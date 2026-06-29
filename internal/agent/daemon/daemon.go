package daemon

import (
	"context"
	"fmt"
	"net"
	"os"
	"sync"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
	"github.com/vishvananda/netlink"
	"golang.zx2c4.com/wireguard/wgctrl"
	"golang.zx2c4.com/wireguard/wgctrl/wgtypes"

	"github.com/KybexOnline/biway/internal/agent/client"
	"github.com/KybexOnline/biway/internal/config"
	"github.com/KybexOnline/biway/internal/models"
)

type Daemon struct {
	agentClient        *client.AgentClient
	ifaceName          string
	pollingInterval    time.Duration
	monitoringInterval time.Duration

	listenPort int

	// waiting group
	wGroup *sync.WaitGroup

	// wireguard controller
	wgctrl *wgctrl.Client
}

type DaemonConfig struct {
	ApiEndpoint   string
	Token         string
	InterfaceName string
}

func NewDaemon(cfg DaemonConfig) *Daemon {
	client := client.NewAgentClient(cfg.ApiEndpoint, cfg.Token)
	return &Daemon{
		agentClient:        client,
		ifaceName:          cfg.InterfaceName,
		pollingInterval:    1 * time.Minute,
		monitoringInterval: 20 * time.Second,

		listenPort: 25259,

		wGroup: &sync.WaitGroup{},
	}
}

func (d *Daemon) Run(ctx context.Context) error {

	err := d.SetupAgent(ctx)
	if err != nil {
		return err
	}

	// stop wireguard
	defer func() {
		log.Info().Msg("Tearing down Wireguard interface...")
		if err := d.teardownWireguard(); err != nil {
			log.Error().Err(err).Msg("Error tearing down wireguard")
		}
	}()

	d.wGroup.Add(1)

	// setup worker
	go d.pollPeersWorker(ctx)

	log.Info().Msg("Daemon is running. Press Ctrl+C to stop.")

	// 3. Block until context is canceled (SIGTERM/SIGINT)
	<-ctx.Done()

	log.Info().Msg("Shutdown signal received. Waiting for workers to finish...")

	// Wait for all workers to cleanly exit
	d.wGroup.Wait()

	log.Info().Msg("All workers finished. Exiting...")
	return nil
}

// pollPeersWorker periodically fetches peers from the API and syncs them
func (d *Daemon) pollPeersWorker(ctx context.Context) {
	defer d.wGroup.Done()

	ticker := time.NewTicker(d.pollingInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Info().Msg("Stopping peer polling worker...")
			return
		case <-ticker.C:
			// Using the newly implemented syncPeers function
			if err := d.syncPeers(ctx); err != nil {
				log.Error().Err(err).Msg("Failed to sync peers")
			} else {
				log.Info().Msg("Successfully synced peers")
			}
		}
	}
}

func (d *Daemon) syncPeers(ctx context.Context) error {
	device, err := d.wgctrl.Device(d.ifaceName)
	if err != nil {
		return err
	}

	existPeers := device.Peers
	apiPeers := d.getWireguardPeers(ctx)

	// Map to keep track of valid API peers by their PublicKey
	apiPeerMap := make(map[wgtypes.Key]wgtypes.PeerConfig)
	for _, p := range apiPeers {
		apiPeerMap[p.PublicKey] = p
	}

	var peersToConfigure []wgtypes.PeerConfig

	// Find existing peers that are NO LONGER in the API and remove them
	for _, ep := range existPeers {
		if _, found := apiPeerMap[ep.PublicKey]; !found {
			// Mark peer for removal
			peersToConfigure = append(peersToConfigure, wgtypes.PeerConfig{
				PublicKey: ep.PublicKey,
				Remove:    true,
			})
			log.Debug().Msgf("Marking peer for removal: %s", ep.PublicKey.String())
		}
	}

	// Add all API peers. Wireguard will automatically add new ones
	// and update existing ones (e.g., if endpoint or allowed IPs changed)
	peersToConfigure = append(peersToConfigure, apiPeers...)

	// Apply the changes. ReplacePeers MUST be false to do a granular update
	// without resetting the whole interface and dropping traffic.
	err = d.wgctrl.ConfigureDevice(d.ifaceName, wgtypes.Config{
		Peers:        peersToConfigure,
		ReplacePeers: false,
	})

	return err
}

func (d *Daemon) GetPrivateKey() wgtypes.Key {
	private := config.AgentConfig.PrivateKey
	if private == "" {
		privatekey, err := wgtypes.GeneratePrivateKey()
		if err != nil {
			log.Error().Err(err).Msg("failed to create private key")
			os.Exit(1)
		}
		viper.Set("private_key", privatekey.String())
		err = viper.WriteConfig()
		if err != nil {
			log.Error().Err(err).Msg("failed to create private key")
			os.Exit(1)
		} else {
			err := config.UnmarshalAgentConfig()
			if err != nil {
				log.Error().Err(err).Msg("failed to create private key")
				os.Exit(1)
			}
		}
		return privatekey
	}
	privatekey, err := wgtypes.ParseKey(private)
	if err != nil {
		log.Error().Err(err).Msg("failed to load private key")
		os.Exit(1)
	}
	return privatekey
}

func (d *Daemon) teardownWireguard() error {
	_ = d.agentClient.ChangeStatus(context.Background(), models.Offline)
	defer d.wgctrl.Close()
	err := d.wgctrl.ConfigureDevice(d.ifaceName, wgtypes.Config{PrivateKey: nil}) // clear
	if err != nil {
		return err
	}
	return netlink.LinkDel(&netlink.GenericLink{LinkAttrs: netlink.LinkAttrs{Name: d.ifaceName}})
}

func (d *Daemon) SetupAgent(ctx context.Context) error {
	// step 1: get agent info from server
	agentInfo, err := d.agentClient.GetAgentInfo()
	if err != nil {
		return err
	}

	// step 2: check status and public key
	// if agent has a not initilized status and has not public key
	// must create a private key for agent and then send the public key to api
	privateKey := d.GetPrivateKey()
	if agentInfo.Status == models.NotInitialized && agentInfo.PublicKey == "" {
		_, err := d.agentClient.SetPublicKey(ctx, privateKey.PublicKey().String())
		if err != nil {
			log.Error().Err(err).Msg("failed to set public key")
			os.Exit(1)
		}
	}

	err = d.startWireguardInstance(ctx, privateKey, agentInfo)
	if err != nil {
		log.Error().Err(err).Msg("failed to start wiregaurd instance")
		os.Exit(1)
	}

	return nil
}

func createPrivateIPWithSubnet(privateIP, cidr string) (*netlink.Addr, error) {
	// Parse the CIDR to get the subnet mask
	_, subnet, err := net.ParseCIDR(cidr)
	if err != nil {
		return nil, fmt.Errorf("invalid CIDR %s: %w", cidr, err)
	}

	// Parse the IP
	ip := net.ParseIP(privateIP)
	if ip == nil {
		return nil, fmt.Errorf("invalid IP address: %s", privateIP)
	}

	// Check if the IP belongs to the subnet
	if !subnet.Contains(ip) {
		return nil, fmt.Errorf("IP %s is not in subnet %s", privateIP, cidr)
	}

	// Get the mask size (e.g. /20)
	ones, _ := subnet.Mask.Size()

	// Return IP with subnet mask
	result := fmt.Sprintf("%s/%d", ip.String(), ones)

	addr, err := netlink.ParseAddr(result)
	if err != nil {
		return nil, err
	}

	return addr, nil
}

func (d *Daemon) getWireguardPeers(ctx context.Context) []wgtypes.PeerConfig {
	// fetch peers for agent
	availablePeers, err := d.agentClient.GetPeers(ctx)
	if err != nil {
		log.Error().Err(err).Msg("can not get wireguard peers")
	}

	// FIX: Use 0 for initial length, otherwise the append starts after empty entries
	peers := make([]wgtypes.PeerConfig, 0, len(availablePeers))

	for _, peer := range availablePeers {
		pubkey, _ := wgtypes.ParseKey(peer.PublicKey)
		endpint, _ := net.ResolveUDPAddr("udp", fmt.Sprintf("%s:%d", peer.PublicIP, d.listenPort))
		_, allowedrange, _ := net.ParseCIDR(fmt.Sprintf("%s/32", peer.PrivateIP))
		peers = append(peers, wgtypes.PeerConfig{
			PublicKey:  pubkey,
			Endpoint:   endpint,
			AllowedIPs: []net.IPNet{*allowedrange},
		})
	}
	return peers
}

func (d *Daemon) startWireguardInstance(ctx context.Context, privateKey wgtypes.Key, agentInfo *models.AgentInfo) error {
	link := &netlink.GenericLink{
		LinkAttrs: netlink.LinkAttrs{
			Name: d.ifaceName,
		},
		LinkType: "wireguard",
	}

	if err := netlink.LinkAdd(link); err != nil && !os.IsExist(err) {
		log.Error().Err(err).Msg("can not start wiregaurd interface")
		return err
	}

	wgclient, err := wgctrl.New()
	if err != nil {
		log.Error().Err(err).Msg("can not create wiregaurd control")
		return err
	} else {
		d.wgctrl = wgclient
	}

	// get peers
	peers := d.getWireguardPeers(ctx)

	cfg := wgtypes.Config{
		PrivateKey: &privateKey,
		ListenPort: &d.listenPort,
		Peers:      peers,
	}

	if err := d.wgctrl.ConfigureDevice(d.ifaceName, cfg); err != nil {
		return err
	}

	addr, err := createPrivateIPWithSubnet(agentInfo.PrivateIP, agentInfo.Subnet)
	if err != nil {
		return err
	}

	if err := netlink.AddrAdd(link, addr); err != nil && !os.IsExist(err) {
		log.Printf("Warning: failed to add IP: %v", err)
	}
	if err := netlink.LinkSetUp(link); err != nil {
		return err
	}

	// send status online to api
	_ = d.agentClient.ChangeStatus(ctx, models.Online)

	return nil
}
