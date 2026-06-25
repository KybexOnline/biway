package service

import (
	"context"
	"errors"
	"fmt"
	"slices"

	"github.com/KybexOnline/biway/internal/config"
	"github.com/KybexOnline/biway/internal/db"
	"github.com/KybexOnline/biway/internal/models"
	"github.com/KybexOnline/biway/pkg/utils"
	"github.com/google/uuid"
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

func (s *ServerService) GetById(ctx context.Context, id string) (models.Servers, error) {
	uuids, err := uuid.Parse(id)
	if err != nil {
		return models.Servers{}, err
	}
	return s.repo.FindOne(ctx, &models.Servers{ID: uuids})
}

func (s *ServerService) List(ctx context.Context, filter *models.Servers, page int, pageSize int) ([]models.Servers, int64, error) {
	return s.repo.FindPaginated(ctx, filter, page, pageSize)
}

func (s *ServerService) Create(
	ctx context.Context, name string, tags []string,
	provider, public_ip, private_ip string,
) (models.Servers, error) {

	usedIPs, err := s.GetUsedPrivateIPs(ctx)
	if err != nil {
		return models.Servers{}, err
	}

	if private_ip != "" {
		check, err := utils.IPContains(private_ip, config.AppConfig.PrivateCIDR)
		fmt.Printf("check the %s on %s => %v and error: %s", private_ip, config.AppConfig.PrivateCIDR, check, err)
		if err != nil {
			return models.Servers{}, err
		} else if !check {
			return models.Servers{}, errors.New("private ip is invalid")
		}

		check = slices.Contains(usedIPs, private_ip)
		if check {
			return models.Servers{}, errors.New("private ip is taken.")
		}

	} else {
		private_ip, err = utils.GetNextAvailableIP(config.AppConfig.PrivateCIDR, usedIPs, false)
		if err != nil {
			return models.Servers{}, err
		}
	}

	server := models.Servers{
		Name:      name,
		Tags:      datatypes.JSON("[]"),
		Provider:  provider,
		PublicIP:  public_ip,
		PrivateIP: private_ip,
	}
	err = s.repo.Create(ctx, &server)
	return server, err
}

func (s *ServerService) GetUsedPrivateIPs(ctx context.Context) ([]string, error) {
	servers, err := s.repo.FindSelected(ctx, &models.Servers{}, []string{"private_ip"})
	if err != nil {
		return nil, err
	}

	usedIps := []string{}

	for _, server := range servers {
		if server.PrivateIP != "" {
			usedIps = append(usedIps, server.PrivateIP)
		}
	}

	return usedIps, nil
}
