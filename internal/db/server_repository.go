package db

import (
	"context"

	"github.com/KybexOnline/biway/internal/models"
	"gorm.io/gorm"
)

type ServerRepository interface {
	Create(ctx context.Context, server *models.Servers) error
	FindOne(ctx context.Context, server *models.Servers) (models.Servers, error)

	// FindPaginated returns a list of servers, the total count, and an error.
	// page starts at 1.
	FindPaginated(ctx context.Context, filter *models.Servers, page int, pageSize int) ([]models.Servers, int64, error)

	// FindSelected allows you to find by a filter but only query specific columns/fields.
	FindSelected(ctx context.Context, filter *models.Servers, fields []string) ([]models.Servers, error)

	// Update updates all server records that match the filter.
	// updateData can be a *models.Servers struct or a map[string]interface{}.
	Update(ctx context.Context, filter *models.Servers, updateData interface{}) error

	// FindAdvanced allows complex filtering using raw query conditions (e.g., "status != ?", "offline")
	FindAdvanced(ctx context.Context, query interface{}, args ...interface{}) ([]models.Servers, error)

	// FindAdvancedPaginated provides the same complex filtering as FindAdvanced but with pagination included.
	FindAdvancedPaginated(ctx context.Context, page int, pageSize int, query interface{}, args ...interface{}) ([]models.Servers, int64, error)

	// DeleteByID deletes a server record by its primary key ID.
	DeleteByID(ctx context.Context, id interface{}) error
}

type serverRepo struct {
	db *gorm.DB
}

func NewServerRepository(db *gorm.DB) ServerRepository {
	return &serverRepo{
		db: db,
	}
}

func (s *serverRepo) Create(ctx context.Context, server *models.Servers) error {
	return gorm.G[models.Servers](s.db).Create(ctx, server)
}

func (s *serverRepo) FindOne(ctx context.Context, server *models.Servers) (models.Servers, error) {
	return gorm.G[models.Servers](s.db).Where(&server).First(ctx)
}

func (s *serverRepo) FindPaginated(ctx context.Context, filter *models.Servers, page int, pageSize int) ([]models.Servers, int64, error) {
	var servers []models.Servers
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
	query := s.db.WithContext(ctx).Model(&models.Servers{}).Where(filter)

	// Count the total number of records matching the filter (before pagination)
	if err := query.Count(&totalRows).Error; err != nil {
		return nil, 0, err
	}

	// Calculate the offset and fetch the paginated results
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&servers).Error; err != nil {
		return nil, 0, err
	}

	return servers, totalRows, nil
}

// FindSelected retrieves records matching the filter, but only populates the struct with the columns provided in 'fields'.
func (s *serverRepo) FindSelected(ctx context.Context, filter *models.Servers, fields []string) ([]models.Servers, error) {
	var servers []models.Servers

	query := s.db.WithContext(ctx).Model(&models.Servers{}).Where(filter)

	if len(fields) > 0 {
		query = query.Select(fields)
	}

	if err := query.Find(&servers).Error; err != nil {
		return nil, err
	}

	return servers, nil
}

// Update updates all records matching the filter with the provided data.
func (s *serverRepo) Update(ctx context.Context, filter *models.Servers, updateData interface{}) error {
	// GORM requires a global update prevention unless a Where clause is present.
	// Since we pass the filter, it safely updates only matching records.
	return s.db.WithContext(ctx).
		Model(&models.Servers{}).
		Where(filter).
		Updates(updateData).Error
}

// FindAdvanced allows complex SQL queries and combinations.
func (s *serverRepo) FindAdvanced(ctx context.Context, query interface{}, args ...interface{}) ([]models.Servers, error) {
	var servers []models.Servers

	if err := s.db.WithContext(ctx).Model(&models.Servers{}).Where(query, args...).Find(&servers).Error; err != nil {
		return nil, err
	}

	return servers, nil
}

// FindAdvancedPaginated handles advanced combinations while returning total count for paginated results.
func (s *serverRepo) FindAdvancedPaginated(ctx context.Context, page int, pageSize int, query interface{}, args ...interface{}) ([]models.Servers, int64, error) {
	var servers []models.Servers
	var totalRows int64

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	// Setup query with advanced filtering
	dbQuery := s.db.WithContext(ctx).Model(&models.Servers{}).Where(query, args...)

	if err := dbQuery.Count(&totalRows).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := dbQuery.Offset(offset).Limit(pageSize).Find(&servers).Error; err != nil {
		return nil, 0, err
	}

	return servers, totalRows, nil
}

// DeleteByID deletes a server record by its primary key ID.
func (s *serverRepo) DeleteByID(ctx context.Context, id interface{}) error {
	return s.db.WithContext(ctx).Delete(&models.Servers{}, id).Error
}
