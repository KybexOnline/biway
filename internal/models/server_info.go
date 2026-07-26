package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type ServerInfo struct {
	ID       uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ServerID uuid.UUID `json:"server_id"`
	OS       string    `json:"os"`
	Distro   string    `json:"distro"`
	Version  string    `json:"version"`
	Arch     string    `json:"arch"`
	Kernel   string    `json:"kernel"`

	AgentCommit  string `json:"agent_commit"`
	AgentVersion string `json:"agent_version"`

	RawData datatypes.JSON `json:"raw"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (u *ServerInfo) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}
