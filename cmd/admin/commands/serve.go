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
	var tlsCertFile string
	var tlsKeyFile string

	cmd := &cobra.Command{
		Use:   "serve",
		Short: "serve the admin panel and api",
		Run: func(cmd *cobra.Command, args []string) {
			config.LoadConfig(configPath)

			if tlsCertFile != "" {
				config.AppConfig.TLS.CertFile = tlsCertFile
				config.AppConfig.TLS.Enabled = true
			}
			if tlsKeyFile != "" {
				config.AppConfig.TLS.KeyFile = tlsKeyFile
				config.AppConfig.TLS.Enabled = true
			}

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

			tlsEnabled := config.AppConfig.TLS.Enabled

			go func() {
				// service connections
				var err error
				if tlsEnabled {
					log.Info().Msgf("Starting web server on https://%s (TLS enabled)", listenAddr)
					err = srv.ListenAndServeTLS(config.AppConfig.TLS.CertFile, config.AppConfig.TLS.KeyFile)
				} else {
					log.Info().Msgf("Starting web server on http://%s", listenAddr)
					err = srv.ListenAndServe()
				}
				if err != nil && err != http.ErrServerClosed {
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
	cmd.Flags().StringVar(&tlsCertFile, "tls-cert", "", "path to TLS certificate file (enables TLS, overrides config)")
	cmd.Flags().StringVar(&tlsKeyFile, "tls-key", "", "path to TLS private key file (enables TLS, overrides config)")

	return cmd
}
