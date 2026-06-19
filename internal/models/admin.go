package models

import (
	"time"

	"gorm.io/gorm"
)

type Admin struct {
	gorm.Model
	// admin info
	Username     string `gorm:"type:varchar(100);uniqueIndex;not null"`
	Email        string `gorm:"type:varchar(255);uniqueIndex;not null"`
	PasswordHash string `gorm:"type:varchar(255);not null"`

	// tracking
	LastLoginAt *time.Time
}
