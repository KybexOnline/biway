package service

import (
	"context"

	"github.com/KybexOnline/biway/internal/db"
	"github.com/KybexOnline/biway/internal/models"
)

type AdminService struct {
	repo db.AdminRepository
}

func NewAdminServce(repo db.AdminRepository) *AdminService {
	return &AdminService{
		repo: repo,
	}
}

func (s *AdminService) FindByUsername(ctx context.Context, username string) (models.Admin, error) {
	return s.repo.FindOne(ctx, &models.Admin{
		Username: username,
	})
}
