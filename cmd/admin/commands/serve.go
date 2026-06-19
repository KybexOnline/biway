package commands

import (
	"fmt"
	"net"

	"github.com/KybexOnline/biway/internal/admin/api"
	"github.com/spf13/cobra"
)

func serverCommand() *cobra.Command {
	var listen net.IP
	var port int

	cmd := &cobra.Command{
		Use:   "serve",
		Short: "serve the admin panel and api",
		Run: func(cmd *cobra.Command, args []string) {
			listenAddr := fmt.Sprintf("%s:%d", listen.String(), port)

			engine := api.InitAdminRouter()

			engine.Run(listenAddr)
		},
	}

	cmd.Flags().IPVarP(&listen, "listen", "l", net.IPv4(0, 0, 0, 0), "Listen IP!")
	cmd.Flags().IntVarP(&port, "port", "p", 8500, "port of web service!")

	return cmd
}
