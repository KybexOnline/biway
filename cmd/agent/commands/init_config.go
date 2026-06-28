package commands

import (
	"github.com/KybexOnline/biway/internal/config"
	"github.com/spf13/cobra"
)

func initConfigCommand() *cobra.Command {
	var configCmd = &cobra.Command{
		Use:   "init-config",
		Short: "Check for existing config and create a default one if missing",
		Long: `Checks for the existence of agent.yml, agent.json, or agent.toml 
in the directory beside the binary or in /etc/biway. 
If no configuration file is found, a default agent.yml will be created beside the binary.`,
		Run: func(cmd *cobra.Command, args []string) {
			config.CheckAgentConfig()
		},
	}

	return configCmd
}
