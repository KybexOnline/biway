package utils

import (
	"errors"
	"fmt"
	"net"
	"net/netip"
)

// IPContains checks if a given IP address is contained within a specified CIDR block.
// It is a generic function that accepts the IP as either a string or net.IP,
// and the CIDR as either a string or *net.IPNet.
func IPContains[TIP ~string | net.IP, TCIDR ~string | *net.IPNet](ip TIP, cidr TCIDR) (bool, error) {
	// Convert IP
	var parsedIP net.IP
	switch x := any(ip).(type) {
	case string:
		parsedIP = net.ParseIP(x)
	case net.IP:
		parsedIP = x
	}

	if parsedIP == nil {
		return false, fmt.Errorf("invalid IP")
	}

	// Convert CIDR
	var ipnet *net.IPNet
	switch x := any(cidr).(type) {
	case string:
		_, ipnet, _ = net.ParseCIDR(x) // error handled below
	case *net.IPNet:
		ipnet = x
	}

	if ipnet == nil {
		return false, fmt.Errorf("invalid CIDR")
	}

	return ipnet.Contains(parsedIP), nil
}

// GetNextAvailableIP takes a CIDR string and a slice of taken IP strings.
// It returns the first available IP address in the CIDR block.
// If skipNetAndBroadcast is true, it will not return the Network (.0) or Broadcast (.255) addresses for IPv4.
func GetNextAvailableIP(cidr string, takenIPs []string, skipNetAndBroadcast bool) (string, error) {
	// 1. Parse the CIDR prefix using the modern netip package
	prefix, err := netip.ParsePrefix(cidr)
	if err != nil {
		return "", fmt.Errorf("invalid CIDR prefix: %w", err)
	}

	// Normalize the prefix to ensure we start exactly at the network address
	// (e.g., passing "192.168.1.10/24" becomes "192.168.1.0/24")
	prefix = prefix.Masked()

	// 2. Load taken IPs into a map for O(1) fast lookups
	taken := make(map[netip.Addr]bool, len(takenIPs))
	for _, ipStr := range takenIPs {
		if addr, err := netip.ParseAddr(ipStr); err == nil {
			taken[addr] = true
		}
	}

	// 3. Automatically reserve Network and Broadcast addresses for IPv4 if requested
	// (Only applies if the subnet is larger than a /31)
	if skipNetAndBroadcast && prefix.Addr().Is4() && prefix.Bits() < 31 {
		// Reserve Network Address (the very first IP)
		networkAddr := prefix.Addr()
		taken[networkAddr] = true

		// Calculate and reserve Broadcast Address (the very last IP)
		broadcastAddr := calculateIPv4Broadcast(prefix)
		taken[broadcastAddr] = true
	}

	// 4. Iterate sequentially through all possible IPs in the CIDR block
	for addr := prefix.Addr(); prefix.Contains(addr); addr = addr.Next() {
		// If the current IP is not in our 'taken' map, we found our match!
		if !taken[addr] {
			return addr.String(), nil
		}
	}

	// 5. If the loop finishes, the entire CIDR block is exhausted
	return "", errors.New("no available IP addresses remaining in the given CIDR")
}

// calculateIPv4Broadcast calculates the broadcast address for an IPv4 prefix
// using bitwise operations.
func calculateIPv4Broadcast(prefix netip.Prefix) netip.Addr {
	// Get the 4 bytes of the IPv4 address
	b := prefix.Addr().As4()

	// Convert the 4 bytes into a single uint32 integer
	ipUint32 := uint32(b[0])<<24 | uint32(b[1])<<16 | uint32(b[2])<<8 | uint32(b[3])

	// Calculate the subnet mask based on the prefix length (e.g., 24 -> 255.255.255.0)
	maskUint32 := ^uint32(0) << (32 - prefix.Bits())

	// The broadcast address is the IP bitwise OR'd with the inverted mask
	broadcastUint32 := ipUint32 | ^maskUint32

	// Convert back to netip.Addr
	return netip.AddrFrom4([4]byte{
		byte(broadcastUint32 >> 24),
		byte(broadcastUint32 >> 16),
		byte(broadcastUint32 >> 8),
		byte(broadcastUint32),
	})
}
