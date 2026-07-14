package db

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/KybexOnline/biway/internal/models"
	"gorm.io/gorm"
)

type SettingRepository interface {
	Create(ctx context.Context, setting *models.Setting) error
	FindOne(ctx context.Context, setting *models.Setting) (models.Setting, error)

	// FindByKey fetches a single setting by its unique key.
	FindByKey(ctx context.Context, key string) (models.Setting, error)

	// FindPaginated returns a list of settings, the total count, and an error.
	// page starts at 1.
	FindPaginated(ctx context.Context, filter *models.Setting, page int, pageSize int) ([]models.Setting, int64, error)

	// FindSelected allows you to find by a filter but only query specific columns/fields.
	FindSelected(ctx context.Context, filter *models.Setting, fields []string) ([]models.Setting, error)

	// Update updates all setting records that match the filter.
	// updateData can be a *models.Setting struct or a map[string]interface{}.
	Update(ctx context.Context, filter *models.Setting, updateData interface{}) error

	// Upsert creates the setting if it doesn't exist (by key), or updates its
	// label/group/type/value if it does.
	Upsert(ctx context.Context, key, label, group string, t models.SettingType, value interface{}) error

	// FindAdvanced allows complex filtering using raw query conditions (e.g., "group = ?", "integrations")
	FindAdvanced(ctx context.Context, query interface{}, args ...interface{}) ([]models.Setting, error)

	// FindAdvancedPaginated provides the same complex filtering as FindAdvanced but with pagination included.
	FindAdvancedPaginated(ctx context.Context, page int, pageSize int, query interface{}, args ...interface{}) ([]models.Setting, int64, error)

	// DeleteByID deletes a setting record by its primary key ID.
	DeleteByID(ctx context.Context, id interface{}) error

	// DeleteByKey deletes a setting record by its unique key.
	DeleteByKey(ctx context.Context, key string) error

	// GetValue fetches a setting by key and decodes its value into dest.
	GetValue(ctx context.Context, key string, dest interface{}) error
}

type settingRepo struct {
	db *gorm.DB
}

func NewSettingRepository(db *gorm.DB) SettingRepository {
	return &settingRepo{
		db: db,
	}
}

func (s *settingRepo) Create(ctx context.Context, setting *models.Setting) error {
	return gorm.G[models.Setting](s.db).Create(ctx, setting)
}

func (s *settingRepo) FindOne(ctx context.Context, setting *models.Setting) (models.Setting, error) {
	return gorm.G[models.Setting](s.db).Where(&setting).First(ctx)
}

func (s *settingRepo) FindByKey(ctx context.Context, key string) (models.Setting, error) {
	var setting models.Setting
	err := s.db.WithContext(ctx).Where("key = ?", key).First(&setting).Error
	return setting, err
}

func (s *settingRepo) FindPaginated(ctx context.Context, filter *models.Setting, page int, pageSize int) ([]models.Setting, int64, error) {
	var settings []models.Setting
	var totalRows int64

	// Fallback to 1 if page is invalid
	if page < 1 {
		page = 1
	}

	// Fallback to a default page size if invalid
	if pageSize < 1 {
		pageSize = 10
	}

	// Build the base query using standard GORM, applying the filter
	query := s.db.WithContext(ctx).Model(&models.Setting{}).Where(filter)

	// Count the total number of records matching the filter (before pagination)
	if err := query.Count(&totalRows).Error; err != nil {
		return nil, 0, err
	}

	// Calculate the offset and fetch the paginated results
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&settings).Error; err != nil {
		return nil, 0, err
	}

	return settings, totalRows, nil
}

// FindSelected retrieves records matching the filter, but only populates the struct with the columns provided in 'fields'.
func (s *settingRepo) FindSelected(ctx context.Context, filter *models.Setting, fields []string) ([]models.Setting, error) {
	var settings []models.Setting

	query := s.db.WithContext(ctx).Model(&models.Setting{}).Where(filter)

	if len(fields) > 0 {
		query = query.Select(fields)
	}

	if err := query.Find(&settings).Error; err != nil {
		return nil, err
	}

	return settings, nil
}

// Update updates all records matching the filter with the provided data.
func (s *settingRepo) Update(ctx context.Context, filter *models.Setting, updateData interface{}) error {
	// GORM requires a global update prevention unless a Where clause is present.
	// Since we pass the filter, it safely updates only matching records.
	return s.db.WithContext(ctx).
		Model(&models.Setting{}).
		Where(filter).
		Updates(updateData).Error
}

// Upsert creates or updates a setting's value/type/label/group in one call.
// This is the main entry point for writing single values, JSON blobs, or lists.
func (s *settingRepo) Upsert(ctx context.Context, key, label, group string, t models.SettingType, value interface{}) error {
	b, err := json.Marshal(value)
	if err != nil {
		return err
	}

	setting := models.Setting{
		Key:   key,
		Label: label,
		Group: group,
		Type:  t,
		Value: models.JSON(b),
	}

	return s.db.WithContext(ctx).
		Where("key = ?", key).
		Assign(models.Setting{Label: label, Group: group, Type: t, Value: models.JSON(b)}).
		FirstOrCreate(&setting).Error
}

// FindAdvanced allows complex SQL queries and combinations.
func (s *settingRepo) FindAdvanced(ctx context.Context, query interface{}, args ...interface{}) ([]models.Setting, error) {
	var settings []models.Setting

	if err := s.db.WithContext(ctx).Model(&models.Setting{}).Where(query, args...).Find(&settings).Error; err != nil {
		return nil, err
	}

	return settings, nil
}

// FindAdvancedPaginated handles advanced combinations while returning total count for paginated results.
func (s *settingRepo) FindAdvancedPaginated(ctx context.Context, page int, pageSize int, query interface{}, args ...interface{}) ([]models.Setting, int64, error) {
	var settings []models.Setting
	var totalRows int64

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	// Setup query with advanced filtering
	dbQuery := s.db.WithContext(ctx).Model(&models.Setting{}).Where(query, args...)

	if err := dbQuery.Count(&totalRows).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := dbQuery.Offset(offset).Limit(pageSize).Find(&settings).Error; err != nil {
		return nil, 0, err
	}

	return settings, totalRows, nil
}

// DeleteByID deletes a setting record by its primary key ID.
func (s *settingRepo) DeleteByID(ctx context.Context, id interface{}) error {
	return s.db.WithContext(ctx).Delete(&models.Setting{}, id).Error
}

// DeleteByKey deletes a setting record by its unique key.
func (s *settingRepo) DeleteByKey(ctx context.Context, key string) error {
	return s.db.WithContext(ctx).Where("key = ?", key).Delete(&models.Setting{}).Error
}

// GetValue fetches a setting by key and decodes its stored value into dest,
// e.g. a *string, *bool, *[]Provider, or any struct/slice matching what was stored.
func (s *settingRepo) GetValue(ctx context.Context, key string, dest interface{}) error {
	setting, err := s.FindByKey(ctx, key)
	if err != nil {
		return err
	}
	if len(setting.Value) == 0 {
		return nil
	}
	if err := json.Unmarshal(setting.Value, dest); err != nil {
		return errors.New("failed to unmarshal setting value for key " + key + ": " + err.Error())
	}
	return nil
}
