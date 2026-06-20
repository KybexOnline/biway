package config

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"log"
	"os"

	"github.com/spf13/viper"
)

var AppConfig Config

type Config struct {
	JWTSecret string `mapstructure:"jwt_secret"`
}

func generateRandomSecret(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func LoadConfig(configPath string) {
	viper.SetConfigFile(configPath)

	if err := viper.ReadInConfig(); err != nil {
		// Use errors.Is with os.ErrNotExist to check if the explicit file is missing
		if errors.Is(err, os.ErrNotExist) {
			log.Printf("Config file %s not found. Bootstrapping a new one...", configPath)

			// Generate the secret
			secret, err := generateRandomSecret(32)
			if err != nil {
				log.Fatalf("Failed to generate secure JWT secret: %v", err)
			}

			viper.Set("jwt_secret", secret)

			// Create and write to the new file
			if err := viper.WriteConfigAs(configPath); err != nil {
				log.Fatalf("Failed to create new config file: %v", err)
			}

			log.Printf("Successfully created new config file at: %s", configPath)

		} else {
			// Catch other errors (e.g., malformed YAML, permission denied)
			log.Fatalf("Error reading config: %v", err)
		}
	}

	// Unmarshal the config into our struct
	if err := viper.Unmarshal(&AppConfig); err != nil {
		log.Fatalf("Unable to decode into struct: %v", err)
	}
}
