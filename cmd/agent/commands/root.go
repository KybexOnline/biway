package commands

import "github.com/spf13/cobra"

var RootCommand = &cobra.Command{
	Use:   "biway-agent",
	Short: "bitway agent",
	Run: func(cmd *cobra.Command, args []string) {
		cmd.Help()
	},
}

func init() {
	RootCommand.AddCommand(
		startCommand(),
		initConfigCommand(),
	)
}
