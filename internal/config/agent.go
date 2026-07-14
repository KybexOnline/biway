package config

import (
	"fmt"
	"os"
	"os/user"
	"path/filepath"
	"strings"

	"github.com/spf13/viper"
)

var AgentConfig AgentConfiguration

type AgentConfiguration struct {
	ApiEndpoint string `mapstructure:"api_endpoint"`
	ApiToken    string `mapstructure:"api_token"`
	PrivateKey  string `mapstructure:"private_key"`
}

func CheckAgentConfig() {
	workingPath, err := os.Getwd()
	if err != nil {
		fmt.Printf("Error getting executable path: %v\n", err)
		os.Exit(1)
	}

	viper.SetConfigName("agent")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(workingPath)
	viper.AddConfigPath("/etc/biway")

	// set default config
	viper.SetDefault("api_endpoint", "https://biway.kybex.online/api/v1")
	viper.SetDefault("api_token", "")
	viper.SetDefault("private_key", "")

	// Enable reading from environment variables
	viper.SetEnvPrefix("BIWAY")                             // Looks for env vars starting with BIWAY_
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "__")) // Translates example.port to BIWAY_EXAMPLE__PORT
	viper.AutomaticEnv()

	err = viper.ReadInConfig()
	if err == nil {
		fmt.Printf("✅ Configuration already exists at: %s\n", viper.ConfigFileUsed())
		return
	}

	// Check if the error is something other than "file not found"
	if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
		fmt.Printf("❌ Error reading config file: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("⚠️ Configuration not found in searched paths.")

	var targetDir string
	currentUser, err := user.Current()

	if err == nil && currentUser.Uid == "0" {
		targetDir = "/etc/biway"

		// Make sure /etc/biway exists before trying to create a file inside it
		if err := os.MkdirAll(targetDir, 0755); err != nil {
			fmt.Printf("❌ Failed to create directory %s: %v\n", targetDir, err)
			os.Exit(1)
		}
	} else {
		targetDir = workingPath
	}

	targetPath := filepath.Join(targetDir, "agent.yaml")

	fmt.Printf("Creating default configuration at: %s...\n", targetPath)

	// Write the default config using Viper
	// Viper automatically formats this to YAML because of the .yml extension
	err = viper.WriteConfigAs(targetPath)
	if err != nil {
		fmt.Printf("❌ Failed to create default config: %v\n", err)

		// Optional: Try fallback to /etc/biway if exe dir is read-only
		os.Exit(1)
	}

	fmt.Println("✅ Default configuration successfully created!")
}

func LoadAgentConfig() {
	workingPath, err := os.Getwd()
	if err != nil {
		fmt.Printf("Error getting executable path: %v\n", err)
		os.Exit(1)
	}

	// 2. Configure Viper search paths and name
	viper.SetConfigName("agent") // Name of config file
	viper.SetConfigType("yaml")
	viper.AddConfigPath(workingPath)  // Check beside binary first
	viper.AddConfigPath("/etc/biway") // Then check /etc/biway

	if err = viper.ReadInConfig(); err != nil {
		fmt.Printf("❌ Error reading config file: %v\n", err)
		os.Exit(1)
	}

	// Unmarshal into struct
	if err := UnmarshalAgentConfig(); err != nil {
		fmt.Printf("Unable to decode config into struct: %v", err)
		os.Exit(1)
	}
}

func UnmarshalAgentConfig() error {
	return viper.Unmarshal(&AgentConfig)
}
