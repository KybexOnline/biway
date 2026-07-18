package db

import (
	"context"

	"github.com/KybexOnline/biway/internal/models"
	"gorm.io/gorm"
)

type AdminRepository interface {
	Create(ctx context.Context, admin *models.Admin) error
	FindOne(ctx context.Context, admin *models.Admin) (models.Admin, error)
	FindById(ctx context.Context, id any) (models.Admin, error)
	UpdateById(ctx context.Context, id any, update models.Admin) error
	First(ctx context.Context) (models.Admin, error)
}

type adminRepo struct {
	db *gorm.DB
}

func NewAdminRepository(db *gorm.DB) AdminRepository {
	return &adminRepo{db: db}
}

func (r *adminRepo) Create(ctx context.Context, admin *models.Admin) error {
	return gorm.G[models.Admin](r.db).Create(ctx, admin)
}

func (r *adminRepo) FindById(ctx context.Context, id any) (models.Admin, error) {
	return gorm.G[models.Admin](r.db).Where("id = ?", id).First(ctx)
}

func (r *adminRepo) UpdateById(ctx context.Context, id any, update models.Admin) error {
	_, err := gorm.G[models.Admin](r.db).Where("id = ?", id).Updates(ctx, update)
	return err
}

func (r *adminRepo) FindOne(ctx context.Context, admin *models.Admin) (models.Admin, error) {
	return gorm.G[models.Admin](r.db).Where(&admin).First(ctx)
}

func (r *adminRepo) First(ctx context.Context) (models.Admin, error) {
	return gorm.G[models.Admin](r.db).First(ctx)
}
