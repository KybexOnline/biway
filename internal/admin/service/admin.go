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

// LoginResult is returned by Login(). If TwoFARequired is true, the client
// must call VerifyLogin2FA with PendingToken + their TOTP code to get a real JWT.
type LoginResult struct {
	Token         string `json:"token,omitempty"`
	TwoFARequired bool   `json:"two_fa_required"`
	PendingToken  string `json:"pending_token,omitempty"`
}

// Login verifies username/password and returns either a full JWT (2FA disabled)
// or a pending token that must be exchanged via VerifyLogin2FA (2FA enabled).
func (s *AdminService) Login(ctx context.Context, username, password string) (*LoginResult, error) {
	admin, err := s.repo.FindOne(ctx, &models.Admin{Username: username})
	if err != nil {
		return nil, apperrors.NewAppError(http.StatusBadRequest, apperrors.UNAUTHORIZED, "User or password is incorrect", nil)
	}

	ok, err := utils.VerifyPassword(password, admin.PasswordHash)
	if err != nil || !ok {
		return nil, apperrors.NewAppError(http.StatusBadRequest, apperrors.UNAUTHORIZED, "User or password is incorrect", nil)
	}

	if !admin.EnabledAuthenticator {
		token, err := utils.JWT.GenerateTokenById(admin.ID)
		if err != nil {
			return nil, apperrors.ErrInternalServer("internal system error")
		}
		return &LoginResult{Token: token, TwoFARequired: false}, nil
	}

	// 2FA enabled: issue a short-lived pending token, not a full session token.
	pendingToken, err := utils.JWT.GeneratePendingTokenById(admin.ID)
	if err != nil {
		return nil, apperrors.ErrInternalServer("internal system error")
	}

	return &LoginResult{TwoFARequired: true, PendingToken: pendingToken}, nil
}

// VerifyLogin2FA completes login by validating the TOTP code for the admin
// identified by the pending token, and returns a full session JWT.
func (s *AdminService) VerifyLogin2FA(ctx context.Context, adminId uint, code string) (string, error) {
	admin, err := s.repo.FindById(ctx, adminId)
	if err != nil {
		return "", apperrors.ErrInternalServer("Failed to fetch user")
	}

	if !admin.EnabledAuthenticator {
		return "", apperrors.NewAppError(http.StatusBadRequest, apperrors.CONFLICT, "2fa is not enabled for this account", nil)
	}

	if !totp.Validate(code, admin.AuthenticatorSecret) {
		return "", apperrors.NewAppError(http.StatusBadRequest, apperrors.CONFLICT, "Invalid or expired code, please try again", nil)
	}

	token, err := utils.JWT.GenerateTokenById(admin.ID)
	if err != nil {
		return "", apperrors.ErrInternalServer("internal system error")
	}

	return token, nil
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
