package main

import (
	"fmt"
	"os"

	"github.com/KybexOnline/biway/cmd/admin/commands"
)

func main() {
	if err := commands.RootCommand.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
