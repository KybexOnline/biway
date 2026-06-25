package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type ServerStatus string

const (
	NotInitialized ServerStatus = "not_initialized"
	Installed      ServerStatus = "installed"
	Online         ServerStatus = "online"
	Offline        ServerStatus = "offline"
)

type Servers struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Name      string         `json:"name"`
	Status    ServerStatus   `gorm:"default:'not_initialized'" json:"status"`
	Tags      datatypes.JSON `json:"tags"`
	Provider  string         `json:"provider"`
	PublicIP  string         `json:"public_ip"`
	PrivateIP string         `json:"private_ip"`
	PublicKey string         `json:"public_key"`

	APIKey string `json:"api_key"`

	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

func (u *Servers) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}
