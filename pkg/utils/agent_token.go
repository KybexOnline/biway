package utils

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
)

const (
	TokenPrefix = "biway_agent_"
	ByteLength  = 32 // 256 bits of entropy
)

var (
	ErrFailedToGenerateToken = errors.New("failed to generate random bytes")
)

func GenerateAgentToken() (string, error) {
	tokenBytes := make([]byte, ByteLength)
	_, err := rand.Read(tokenBytes)
	if err != nil {
		return "", ErrFailedToGenerateToken
	}

	token := TokenPrefix + hex.EncodeToString(tokenBytes)

	return token, nil
}
