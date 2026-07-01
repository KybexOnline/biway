package commands

import (
	"github.com/KybexOnline/biway/pkg/utils"
	"github.com/spf13/cobra"
)

var versionSwitch bool

var RootCommand = &cobra.Command{
	Use:   "biway-agent",
	Short: "bitway agent",
	Run: func(cmd *cobra.Command, args []string) {
		if versionSwitch {
			utils.PrintVersion("Biway agent")
		} else {
			cmd.Help()
		}
	},
}

func init() {
	RootCommand.AddCommand(
		startCommand(),
		initConfigCommand(),
	)

	RootCommand.Flags().BoolVarP(&versionSwitch, "version", "v", false, "show version")
}
