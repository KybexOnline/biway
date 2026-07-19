package models

import (
	"time"

	"gorm.io/gorm"
)

type Admin struct {
	gorm.Model
	// admin info
	Username     string `gorm:"type:varchar(100);uniqueIndex;not null"`
	PasswordHash string `gorm:"type:varchar(255);not null"`

	// Authenticator
	AuthenticatorSecret  string `gorm:"type:varchar(50);"`
	EnabledAuthenticator bool   `gorm:"default:false"`

	// tracking
	LastLoginAt *time.Time
}
