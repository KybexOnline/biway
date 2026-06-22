package service

import (
	"context"

	"github.com/KybexOnline/biway/internal/db"
	"github.com/KybexOnline/biway/internal/models"
	"gorm.io/datatypes"
)

type ServerService struct {
	repo db.ServerRepository
}

func NewServerService(repo db.ServerRepository) *ServerService {
	return &ServerService{
		repo: repo,
	}
}

func (s *ServerService) List(ctx context.Context, filter *models.Servers, page int, pageSize int) ([]models.Servers, int64, error) {
	return s.repo.FindPaginated(ctx, filter, page, pageSize)
}

func (s *ServerService) Create(
	ctx context.Context, name string, tags []string,
	provider, public_ip, private_ip string,
) (models.Servers, error) {
	server := models.Servers{
		Name:      name,
		Tags:      datatypes.JSON("[]"),
		Provider:  provider,
		PublicIP:  public_ip,
		PrivateIP: private_ip,
	}
	err := s.repo.Create(ctx, &server)
	return server, err
}
