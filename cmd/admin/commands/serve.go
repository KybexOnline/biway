package commands

import (
	"fmt"
	"net"

	"github.com/spf13/cobra"
)

var listen net.IP
var port int

func serverCommand() *cobra.Command {
	var cmd = &cobra.Command{
		Use:   "serve",
		Short: "serve the admin panel and api",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Printf("%s:%d", listen.String(), port)
		},
	}

	cmd.Flags().IPVarP(&listen, "listen", "l", net.IPv4(0, 0, 0, 0), "Listen IP!")
	cmd.Flags().IntVarP(&port, "port", "p", 8500, "port of web service!")

	return cmd
}
