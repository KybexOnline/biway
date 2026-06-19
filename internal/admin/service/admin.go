package service

import (
	"context"
	"errors"

	"github.com/KybexOnline/biway/internal/db"
	"github.com/KybexOnline/biway/internal/models"
	"gorm.io/gorm"
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

func (s *AdminService) Create(ctx context.Context, username, password string) error {
	return s.repo.Create(ctx, &models.Admin{
		Username:     username,
		PasswordHash: password,
	})
}

func (s *AdminService) HasAdmin(ctx context.Context) (bool, error) {
	_, err := s.repo.First(ctx)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return false, err
	}

	return true, nil
}
