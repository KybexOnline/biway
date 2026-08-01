package config

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"log"
	"os"
	"strings"

	"github.com/spf13/viper"
)

var AppConfig Config

type TLSConfig struct {
	Enabled  bool   `mapstructure:"enabled"`
	CertFile string `mapstructure:"cert_file"`
	KeyFile  string `mapstructure:"key_file"`
}

type Config struct {
	Environment  string    `mapstructure:"env"`
	JWTSecret    string    `mapstructure:"jwt_secret"`
	AllowOrigins []string  `mapstructure:"allow_origins"`
	PrivateCIDR  string    `mapstructure:"private_cidr"`
	TLS          TLSConfig `mapstructure:"tls"`
}

func generateRandomSecret(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func bindEnvWithSlice(key string) {
	envKey := strings.ToUpper(viper.GetEnvPrefix() + "_" + key)
	if value := os.Getenv(envKey); value != "" {
		// Split by comma and trim spaces
		items := strings.Split(value, ",")
		var trimmed []string
		for _, item := range items {
			if trimmedItem := strings.TrimSpace(item); trimmedItem != "" {
				trimmed = append(trimmed, trimmedItem)
			}
		}
		viper.Set(key, trimmed)
	}
}

func LoadConfig(configPath string) {
	viper.SetConfigFile(configPath)
	viper.SetEnvPrefix("BIWAY")
	// Allow nested keys (e.g. "tls.enabled") to be set via env vars using
	// underscores instead of dots, e.g. BIWAY_TLS_ENABLED.
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	// Set defaults
	viper.SetDefault("allow_origins", []string{"*"})
	viper.SetDefault("env", "production")
	viper.SetDefault("private_cidr", "10.35.0.0/24")
	viper.SetDefault("tls.enabled", false)
	viper.SetDefault("tls.cert_file", "")
	viper.SetDefault("tls.key_file", "")

	// Special handling for allow_origins from environment variable
	bindEnvWithSlice("allow_origins")

	if err := viper.ReadInConfig(); err != nil {
		if errors.Is(err, os.ErrNotExist) {
			log.Printf("Config file %s not found. Bootstrapping a new one...", configPath)

			if viper.GetString("jwt_secret") == "" {
				log.Println("JWT secret not found. Generating a secure random secret...")
				secret, err := generateRandomSecret(32)
				if err != nil {
					log.Fatalf("Failed to generate secure JWT secret: %v", err)
				}
				viper.Set("jwt_secret", secret)
			} else {
				viper.SetDefault("jwt_secret", viper.GetString("jwt_secret"))
			}

			if err := viper.WriteConfigAs(configPath); err != nil {
				log.Fatalf("Failed to create new config file: %v", err)
			}

			log.Printf("Successfully created new config file at: %s", configPath)
		} else {
			log.Fatalf("Error reading config: %v", err)
		}
	}

	// Unmarshal into struct
	if err := viper.Unmarshal(&AppConfig); err != nil {
		log.Fatalf("Unable to decode config into struct: %v", err)
	}

	if AppConfig.TLS.Enabled {
		if AppConfig.TLS.CertFile == "" || AppConfig.TLS.KeyFile == "" {
			log.Fatalf("tls.enabled is true but tls.cert_file and/or tls.key_file is not set")
		}
		if _, err := os.Stat(AppConfig.TLS.CertFile); err != nil {
			log.Fatalf("tls.cert_file %q is not accessible: %v", AppConfig.TLS.CertFile, err)
		}
		if _, err := os.Stat(AppConfig.TLS.KeyFile); err != nil {
			log.Fatalf("tls.key_file %q is not accessible: %v", AppConfig.TLS.KeyFile, err)
		}
	}
}
