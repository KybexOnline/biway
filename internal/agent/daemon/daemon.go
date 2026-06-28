package daemon

import (
	"context"
	"os"
	"sync"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
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

	// waiting group
	wGroup *sync.WaitGroup
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

		wGroup: &sync.WaitGroup{},
	}
}

func (d *Daemon) Run(ctx context.Context) error {

	d.SetupAgent(ctx)

	// d.wGroup.Add(2)

	log.Info().Msg("Daemon is running. Press Ctrl+C to stop.")

	// 3. Block until context is canceled (SIGTERM/SIGINT)
	<-ctx.Done()

	log.Info().Msg("Shutdown signal received. Waiting for workers to finish...")

	// Wait for all workers to cleanly exit
	// d.wGroup.Wait()

	log.Info().Msg("All workers finished. Exiting...")
	return nil
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

func (d *Daemon) SetupAgent(ctx context.Context) error {
	// step 1: get agent info from server
	agentInfo, err := d.agentClient.GetAgentInfo()
	if err != nil {
		return err
	}

	// step 2: check status and public key
	// if agent has a not initilized status and has not public key
	// must create a private key for agent and then send the public key to api
	if agentInfo.Status == models.NotInitialized && agentInfo.PublicKey == "" {
		privateKey := d.GetPrivateKey()
		_, err := d.agentClient.SetPublicKey(ctx, privateKey.PublicKey().String())
		if err != nil {
			log.Error().Err(err).Msg("failed to set public key")
			os.Exit(1)
		}
	}

	return nil
}
