package models

import "github.com/google/uuid"

type AgentInfo struct {
	ID        uuid.UUID    `json:"id"`
	Name      string       `json:"name"`
	PublicIP  string       `json:"public_ip"`
	PrivateIP string       `json:"private_ip"`
	Status    ServerStatus `json:"status"`
	PublicKey string       `json:"public_key"`
}
