package commands

import (
	"os"
	"os/signal"
	"syscall"

	"github.com/KybexOnline/biway/internal/agent/daemon"
	"github.com/KybexOnline/biway/internal/config"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

func startCommand() *cobra.Command {

	var ifaceName string

	cmd := &cobra.Command{
		Use:   "start",
		Short: "start agent",
		Run: func(cmd *cobra.Command, args []string) {

			config.LoadAgentConfig()

			ctx, cancel := signal.NotifyContext(cmd.Context(), os.Interrupt, syscall.SIGTERM)

			defer cancel()
			cfg := daemon.DaemonConfig{
				ApiEndpoint:   config.AgentConfig.ApiEndpoint,
				Token:         config.AgentConfig.ApiToken,
				InterfaceName: ifaceName,
			}
			d := daemon.NewDaemon(cfg)

			if err := d.Run(ctx); err != nil {
				log.Error().Err(err).Msg("failed to run daemon")
			}

		},
	}

	cmd.Flags().StringVarP(&ifaceName, "interface-name", "i", "biway01", "biway interface name")

	return cmd
}
