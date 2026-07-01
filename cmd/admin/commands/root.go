package commands

import (
	"github.com/KybexOnline/biway/pkg/utils"
	"github.com/spf13/cobra"
)

var versionSwitch bool

var RootCommand = &cobra.Command{
	Use:   "biway-admin",
	Short: "Mesh service management",
	Long: `BiWay turns your scattered cloud servers into a single, secure, and high-performance private mesh network — no matter which providers you use.
Create, manage, modify, and monitor your mesh infrastructure with simplicity and confidence.`,
	Run: func(cmd *cobra.Command, args []string) {
		if versionSwitch {
			utils.PrintVersion("Biway admin")
		} else {
			cmd.Help()
		}
	},
}

func init() {
	RootCommand.AddCommand(
		serverCommand(),
		migrationCommand(),
	)
	RootCommand.Flags().BoolVarP(&versionSwitch, "version", "v", false, "show version")
}
