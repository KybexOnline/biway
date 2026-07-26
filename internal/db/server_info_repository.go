package db

import (
	"context"
	"errors"

	"github.com/KybexOnline/biway/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ServerInfoRepository defines the data access methods for ServerInfo.
type ServerInfoRepository interface {
	// CreateOrUpdate creates a new server info record or updates it if one already exists for the ServerID.
	CreateOrUpdate(ctx context.Context, info *models.ServerInfo) error

	// FindByServerID retrieves the single server info record associated with a specific server.
	FindByServerID(ctx context.Context, serverID uuid.UUID) (models.ServerInfo, error)

	// DeleteByServerID removes the server info record associated with a specific server.
	DeleteByServerID(ctx context.Context, serverID uuid.UUID) error
}

type serverInfoRepo struct {
	db *gorm.DB
}

// NewServerInfoRepository creates a new instance of ServerInfoRepository.
func NewServerInfoRepository(db *gorm.DB) ServerInfoRepository {
	return &serverInfoRepo{
		db: db,
	}
}

// CreateOrUpdate enforces the 1-to-1 relationship. It checks if info exists for the server.
// If it exists, it updates the record. If it doesn't, it creates a new record.
func (r *serverInfoRepo) CreateOrUpdate(ctx context.Context, info *models.ServerInfo) error {
	var existing models.ServerInfo

	// Check if a ServerInfo already exists for this ServerID
	err := r.db.WithContext(ctx).Where("server_id = ?", info.ServerID).First(&existing).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Record doesn't exist, create it
			return r.db.WithContext(ctx).Create(info).Error
		}
		// Return any other database errors (e.g., connection issues)
		return err
	}

	// Record exists. Ensure we keep the original Primary Key ID before updating.
	info.ID = existing.ID

	// Update the existing record with the new data
	return r.db.WithContext(ctx).Model(&existing).Updates(info).Error
}

// FindByServerID looks up the ServerInfo by the foreign key ServerID.
func (r *serverInfoRepo) FindByServerID(ctx context.Context, serverID uuid.UUID) (models.ServerInfo, error) {
	var info models.ServerInfo
	err := r.db.WithContext(ctx).Where("server_id = ?", serverID).First(&info).Error
	return info, err
}

// DeleteByServerID deletes a server info record using its associated server ID.
func (r *serverInfoRepo) DeleteByServerID(ctx context.Context, serverID uuid.UUID) error {
	return r.db.WithContext(ctx).Where("server_id = ?", serverID).Delete(&models.ServerInfo{}).Error
}
