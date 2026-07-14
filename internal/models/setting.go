package models

import "time"

type SettingType string

const (
	SettingTypeString SettingType = "string" // single text input
	SettingTypeNumber SettingType = "number" // single numeric input
	SettingTypeBool   SettingType = "bool"   // toggle/checkbox
	SettingTypeJSON   SettingType = "json"   // arbitrary object
	SettingTypeList   SettingType = "list"   // array of items (add/remove)
)

type Setting struct {
	ID        uint        `gorm:"primaryKey" json:"id"`
	Key       string      `gorm:"uniqueIndex;size:191;not null" json:"key"` // e.g. "providers", "site_name"
	Label     string      `gorm:"size:255" json:"label"`                    // shown in the admin UI
	Group     string      `gorm:"size:100;index" json:"group"`              // e.g. "general", "integrations"
	Type      SettingType `gorm:"size:20;not null;default:string" json:"type"`
	Value     JSON        `gorm:"type:json;not null;default:'null'" json:"value"`
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt time.Time   `json:"updated_at"`
}

type Provider struct {
	Code  string `json:"code"`
	Color string `json:"color"`
	Name  string `json:"name"`
}
