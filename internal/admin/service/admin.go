package service

import (
	"context"
	"errors"
	"net/http"
	"strconv"

	"github.com/KybexOnline/biway/internal/db"
	"github.com/KybexOnline/biway/internal/models"
	"github.com/KybexOnline/biway/pkg/apperrors"
	"github.com/KybexOnline/biway/pkg/utils"
	"github.com/gin-gonic/gin"
	"github.com/pquerna/otp/totp"
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

func (s *AdminService) GetAdminIdFromContext(c *gin.Context) (uint, error) {
	adminId := c.GetString("admin_id")
	id, err := strconv.ParseUint(adminId, 10, 64)
	return uint(id), err
}

func (s *AdminService) FindByUsername(ctx context.Context, username string) (models.Admin, error) {
	return s.repo.FindOne(ctx, &models.Admin{
		Username: username,
	})
}

func (s *AdminService) FindById(ctx context.Context, id uint) (models.Admin, error) {
	return s.repo.FindById(ctx, id)
}

func (s *AdminService) ChangePassword(ctx context.Context, id string, newPassword string) error {
	passwordHash, err := utils.HashPassword(newPassword)
	if err != nil {
		return errors.New("failed to process secure password")
	}
	err = s.repo.UpdateById(ctx, id, models.Admin{
		PasswordHash: passwordHash,
	})

	if err != nil {
		return apperrors.ErrInternalServer("Failed to process change password")
	}
	return nil
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

type AuthenticatorResponse struct {
	Secret string `json:"secret"`
	URL    string `json:"url"`
}

func (s *AdminService) CreateSecretAuthenticator(ctx context.Context, id uint) (*AuthenticatorResponse, error) {
	admin, err := s.repo.FindById(ctx, id)
	if err != nil {
		return nil, apperrors.ErrInternalServer("Failed to fetch user")
	}

	if admin.EnabledAuthenticator {
		return nil, apperrors.NewAppError(
			http.StatusBadRequest,
			apperrors.CONFLICT,
			"You have already enabled an authenticator. To create a new one, you must first disable the current authenticator.",
			nil,
		)
	}

	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "Biway",
		AccountName: admin.Username,
	})

	if err != nil {
		return nil, apperrors.ErrInternalServer("Failed to create authenticator secret")
	}

	err = s.repo.UpdateById(ctx, admin.ID, models.Admin{
		AuthenticatorSecret: key.Secret(),
	})

	if err != nil {
		return nil, apperrors.ErrInternalServer("Failed to create authenticator secret")
	}

	return &AuthenticatorResponse{
		Secret: key.Secret(),
		URL:    key.URL(),
	}, nil

}

func (s *AdminService) Disable2Fa(ctx context.Context, id uint) error {
	admin, err := s.repo.FindById(ctx, id)
	if err != nil {
		return apperrors.ErrInternalServer("Failed to fetch user")
	}

	if !admin.EnabledAuthenticator {
		return apperrors.NewAppError(
			http.StatusBadRequest,
			apperrors.CONFLICT,
			"Your 2fa is not enable",
			nil,
		)
	}

	admin.EnabledAuthenticator = false

	err = s.repo.UpdateSingleById(ctx, admin.ID, "enabled_authenticator", false)

	return err
}

func (s *AdminService) Enable2FA(ctx context.Context, id uint, code string) error {
	admin, err := s.repo.FindById(ctx, id)
	if err != nil {
		return apperrors.ErrInternalServer("Failed to fetch user")
	}

	if admin.EnabledAuthenticator {
		return apperrors.NewAppError(
			http.StatusBadRequest,
			apperrors.CONFLICT,
			"You have already enabled an authenticator. To create a new one, you must first disable the current authenticator.",
			nil,
		)
	}

	check := totp.Validate(code, admin.AuthenticatorSecret)

	if !check {
		return apperrors.NewAppError(
			http.StatusBadRequest,
			apperrors.CONFLICT,
			"Invalid or Expired code, Please try again",
			nil,
		)
	}

	err = s.repo.UpdateById(ctx, admin.ID, models.Admin{
		EnabledAuthenticator: true,
	})

	if err != nil {
		return apperrors.ErrInternalServer("Failed to enable 2fa")
	}

	return nil
}
