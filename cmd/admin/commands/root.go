package commands

import (
	"github.com/spf13/cobra"
)

var RootCommand = &cobra.Command{
	Use:   "biway-admin",
	Short: "Mesh service management",
	Long: `BiWay turns your scattered cloud servers into a single, secure, and high-performance private mesh network — no matter which providers you use.
Create, manage, modify, and monitor your mesh infrastructure with simplicity and confidence.`,
	Run: func(cmd *cobra.Command, args []string) {
		cmd.Help()
	},
}

func init() {
	RootCommand.AddCommand(
		serverCommand(),
		migrationCommand(),
	)
}
