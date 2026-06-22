package commands

import (
	"github.com/KybexOnline/biway/internal/models"
	"github.com/spf13/cobra"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func migrationCommand() *cobra.Command {
	var dbPath string
	cmd := &cobra.Command{
		Use:   "db-migration",
		Short: "run database migration",
		Run: func(cmd *cobra.Command, args []string) {
			db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
			if err != nil {
				panic(err)
			}
			err = db.AutoMigrate(&models.Admin{}, &models.Servers{})
			if err != nil {
				panic(err)
			}
		},
	}

	cmd.Flags().StringVarP(&dbPath, "database", "d", "biway.sqlite", "database path")

	return cmd
}
