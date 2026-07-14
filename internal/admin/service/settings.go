package service

import (
	"context"
	"fmt"

	"github.com/KybexOnline/biway/internal/db"
	"github.com/KybexOnline/biway/internal/models"
)

type SettingsService struct {
	repo db.SettingRepository
}

func NewSettingsService(repo db.SettingRepository) *SettingsService {
	return &SettingsService{
		repo: repo,
	}
}

// Get fetches a setting by key and decodes its value into dest.
// dest must be a pointer matching what was stored (e.g. *string, *bool, *[]Provider).
func (s *SettingsService) Get(ctx context.Context, key string, dest interface{}) error {
	return s.repo.GetValue(ctx, key, dest)
}

// GetSetting returns the raw setting record (including Type, Label, Group).
func (s *SettingsService) GetSetting(ctx context.Context, key string) (models.Setting, error) {
	return s.repo.FindByKey(ctx, key)
}

// List returns all settings, optionally filtered by group ("" = all groups).
func (s *SettingsService) List(ctx context.Context, group string) ([]models.Setting, error) {
	if group == "" {
		return s.repo.FindAdvanced(ctx, "1 = 1")
	}
	return s.repo.FindAdvanced(ctx, "\"group\" = ?", group)
}

// Set stores any value under a key with an explicit type and metadata.
// Use this the first time you create a setting, or whenever label/group might change.
func (s *SettingsService) Set(ctx context.Context, key, label, group string, t models.SettingType, value interface{}) error {
	return s.repo.Upsert(ctx, key, label, group, t, value)
}

// SetValue stores a value under an existing key without touching label/group/type.
func (s *SettingsService) SetValue(ctx context.Context, key string, value interface{}) error {
	setting, err := s.repo.FindByKey(ctx, key)
	if err != nil {
		return err
	}
	return s.repo.Upsert(ctx, key, setting.Label, setting.Group, setting.Type, value)
}

// Delete removes a setting entirely.
func (s *SettingsService) Delete(ctx context.Context, key string) error {
	return s.repo.DeleteByKey(ctx, key)
}

// ---------------------------------------------------------------------------
// Typed convenience helpers — single-value settings
// ---------------------------------------------------------------------------

func (s *SettingsService) GetString(ctx context.Context, key string) (string, error) {
	var v string
	err := s.repo.GetValue(ctx, key, &v)
	return v, err
}

func (s *SettingsService) SetString(ctx context.Context, key, label, group, value string) error {
	return s.repo.Upsert(ctx, key, label, group, models.SettingTypeString, value)
}

func (s *SettingsService) GetNumber(ctx context.Context, key string) (float64, error) {
	var v float64
	err := s.repo.GetValue(ctx, key, &v)
	return v, err
}

func (s *SettingsService) SetNumber(ctx context.Context, key, label, group string, value float64) error {
	return s.repo.Upsert(ctx, key, label, group, models.SettingTypeNumber, value)
}

func (s *SettingsService) GetBool(ctx context.Context, key string) (bool, error) {
	var v bool
	err := s.repo.GetValue(ctx, key, &v)
	return v, err
}

func (s *SettingsService) SetBool(ctx context.Context, key, label, group string, value bool) error {
	return s.repo.Upsert(ctx, key, label, group, models.SettingTypeBool, value)
}

// GetJSON decodes an arbitrary object/setting into dest (e.g. *map[string]interface{} or *MyConfigStruct).
func (s *SettingsService) GetJSON(ctx context.Context, key string, dest interface{}) error {
	return s.repo.GetValue(ctx, key, dest)
}

func (s *SettingsService) SetJSON(ctx context.Context, key, label, group string, value interface{}) error {
	return s.repo.Upsert(ctx, key, label, group, models.SettingTypeJSON, value)
}

// ---------------------------------------------------------------------------
// Generic list helpers — for any "list" setting made of items with a unique
// identifier (like your providers list). itemKey extracts the identifier
// used to detect duplicates / find items to remove.
// ---------------------------------------------------------------------------

// GetList decodes a list setting into dest (a pointer to a slice, e.g. *[]Provider).
func (s *SettingsService) GetList(ctx context.Context, key string, dest interface{}) error {
	return s.repo.GetValue(ctx, key, dest)
}

// SetList overwrites a whole list setting.
func (s *SettingsService) SetList(ctx context.Context, key, label, group string, items interface{}) error {
	return s.repo.Upsert(ctx, key, label, group, models.SettingTypeList, items)
}

// ---------------------------------------------------------------------------
// Providers — concrete example of a "list" setting with add/remove support,
// matching: [{code, color, name}, ...]
// ---------------------------------------------------------------------------

const (
	providersKey   = "providers"
	providersLabel = "Providers"
	providersGroup = "integrations"
)

func (s *SettingsService) GetProviders(ctx context.Context) ([]models.Provider, error) {
	var providers []models.Provider
	err := s.repo.GetValue(ctx, providersKey, &providers)
	if err != nil {
		// Not created yet — treat as empty list instead of erroring the caller.
		var setting models.Setting
		if setting, _ = s.repo.FindByKey(ctx, providersKey); setting.ID == 0 {
			return []models.Provider{}, nil
		}
		return nil, err
	}
	return providers, nil
}

// AddProvider appends a provider. Returns an error if the code already exists.
func (s *SettingsService) AddProvider(ctx context.Context, p models.Provider) error {
	providers, err := s.GetProviders(ctx)
	if err != nil {
		return err
	}
	for _, existing := range providers {
		if existing.Code == p.Code {
			return fmt.Errorf("provider %q already exists", p.Code)
		}
	}
	providers = append(providers, p)
	return s.repo.Upsert(ctx, providersKey, providersLabel, providersGroup, models.SettingTypeList, providers)
}

// UpdateProvider replaces an existing provider (matched by Code) with new data.
func (s *SettingsService) UpdateProvider(ctx context.Context, p models.Provider) error {
	providers, err := s.GetProviders(ctx)
	if err != nil {
		return err
	}
	found := false
	for i, existing := range providers {
		if existing.Code == p.Code {
			providers[i] = p
			found = true
			break
		}
	}
	if !found {
		return fmt.Errorf("provider %q not found", p.Code)
	}
	return s.repo.Upsert(ctx, providersKey, providersLabel, providersGroup, models.SettingTypeList, providers)
}

// RemoveProvider removes a provider by its code.
func (s *SettingsService) RemoveProvider(ctx context.Context, code string) error {
	providers, err := s.GetProviders(ctx)
	if err != nil {
		return err
	}
	filtered := make([]models.Provider, 0, len(providers))
	for _, p := range providers {
		if p.Code != code {
			filtered = append(filtered, p)
		}
	}
	return s.repo.Upsert(ctx, providersKey, providersLabel, providersGroup, models.SettingTypeList, filtered)
}
