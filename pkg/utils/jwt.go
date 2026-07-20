package utils

import (
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	purposeSession    = "session"
	purposePending2FA = "2fa_pending"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidToken       = errors.New("invalid token")
	ErrExpiredToken       = errors.New("token has expired")
	ErrWrongTokenPurpose  = errors.New("token cannot be used for this action")
)

type JWTHelper struct {
	secret []byte
}

var JWT *JWTHelper

func NewJWTHelper(secret string) *JWTHelper {
	if JWT == nil {
		JWT = &JWTHelper{
			secret: []byte(secret),
		}
	}

	return JWT
}

func (j *JWTHelper) GenerateTokenById(id any) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":     fmt.Sprintf("%v", id),
		"purpose": purposeSession,
		"exp":     time.Now().Add(1 * time.Hour).Unix(),
	})
	return token.SignedString(j.secret)
}

// GeneratePendingTokenById issues a short-lived token proving username/password
// were verified, used only to complete a 2FA challenge. It cannot be used to
// authenticate normal requests.
func (j *JWTHelper) GeneratePendingTokenById(id any) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":     fmt.Sprintf("%v", id),
		"purpose": purposePending2FA,
		"exp":     time.Now().Add(5 * time.Minute).Unix(),
	})
	return token.SignedString(j.secret)
}

// parseWithPurpose parses tokenString and ensures its "purpose" claim matches
// wantPurpose, returning the subject id as a string.
func (j *JWTHelper) parseWithPurpose(tokenString, wantPurpose string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return j.secret, nil
	})
	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return "", ErrExpiredToken
		}
		return "", ErrInvalidToken
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return "", ErrInvalidToken
	}

	purpose, _ := claims["purpose"].(string)
	if purpose != wantPurpose {
		return "", ErrWrongTokenPurpose
	}

	sub, ok := claims["sub"].(string)
	if !ok || sub == "" {
		return "", ErrInvalidToken
	}

	return sub, nil
}

// ParsePendingTokenId validates a 2FA-pending token and returns the admin ID
// it was issued for.
func (j *JWTHelper) ParsePendingTokenId(tokenString string) (uint, error) {
	sub, err := j.parseWithPurpose(tokenString, purposePending2FA)
	if err != nil {
		return 0, err
	}
	id, err := strconv.ParseUint(sub, 10, 64)
	if err != nil {
		return 0, ErrInvalidToken
	}
	return uint(id), nil
}

func (j *JWTHelper) ValidateSessionToken(tokenString string) (string, error) {
	id, err := j.parseWithPurpose(tokenString, purposeSession)
	return id, err
}
