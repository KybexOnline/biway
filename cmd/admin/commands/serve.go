package commands

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/KybexOnline/biway/internal/admin/api"
	"github.com/KybexOnline/biway/internal/config"
	"github.com/KybexOnline/biway/internal/db"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

func serverCommand() *cobra.Command {
	var listen net.IP
	var port int
	var dbPath string
	var configPath string

	cmd := &cobra.Command{
		Use:   "serve",
		Short: "serve the admin panel and api",
		Run: func(cmd *cobra.Command, args []string) {

			config.LoadConfig(configPath)

			_, err := db.GetDatabaseConnection(dbPath)
			if err != nil {
				panic(err)
			}

			listenAddr := fmt.Sprintf("%s:%d", listen.String(), port)

			engine := api.InitAdminRouter()

			srv := &http.Server{
				Addr:    listenAddr,
				Handler: engine.Handler(),
			}

			go func() {
				// service connections
				if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
					log.Info().Msgf("listen: %s\n", err)
				}
			}()

			quit := make(chan os.Signal, 1)
			// kill (no params) by default sends syscall.SIGTERM
			// kill -2 is syscall.SIGINT
			// kill -9 is syscall.SIGKILL but can't be caught, so don't need add it
			signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
			<-quit
			log.Info().Msg("Shutdown Server ...")

			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if err := srv.Shutdown(ctx); err != nil {
				log.Info().Msgf("Server Shutdown: %s", err)
			}

		},
	}

	cmd.Flags().IPVarP(&listen, "listen", "l", net.IPv4(0, 0, 0, 0), "Listen IP!")
	cmd.Flags().IntVarP(&port, "port", "p", 8500, "port of web service!")
	cmd.Flags().StringVarP(&dbPath, "database", "d", "biway.sqlite", "database path")
	cmd.Flags().StringVarP(&configPath, "config", "c", "biway.yml", "config path")

	return cmd
}
