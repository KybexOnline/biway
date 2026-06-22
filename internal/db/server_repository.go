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
