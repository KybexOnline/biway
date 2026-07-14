package commands

import (
	"context"

	"github.com/KybexOnline/biway/internal/admin/service"
	"github.com/KybexOnline/biway/internal/db"
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
			gormDB, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
			if err != nil {
				panic(err)
			}

			err = gormDB.AutoMigrate(&models.Admin{}, &models.Servers{}, &models.Setting{})
			if err != nil {
				panic(err)
			}

			if err := seedProviders(gormDB); err != nil {
				panic(err)
			}
		},
	}

	cmd.Flags().StringVarP(&dbPath, "database", "d", "biway.sqlite", "database path")

	return cmd
}

// seedProviders creates the "providers" setting with the top 10 cloud
// providers if it doesn't already exist. Existing data is left untouched so
// re-running migrations doesn't wipe out admin edits.
func seedProviders(gormDB *gorm.DB) error {
	repo := db.NewSettingRepository(gormDB)
	settingsService := service.NewSettingsService(repo)

	ctx := context.Background()

	existing, err := settingsService.GetProviders(ctx)
	if err != nil {
		return err
	}
	if len(existing) > 0 {
		return nil
	}

	providers := []models.Provider{
		{Code: "aws", Name: "Amazon Web Services", Color: "FF9900"},
		{Code: "azure", Name: "Microsoft Azure", Color: "0078D4"},
		{Code: "gcp", Name: "Google Cloud Platform", Color: "4285F4"},
		{Code: "alibabacloud", Name: "Alibaba Cloud", Color: "FF6A00"},
		{Code: "ibmcloud", Name: "IBM Cloud", Color: "052FAD"},
		{Code: "oraclecloud", Name: "Oracle Cloud", Color: "F80000"},
		{Code: "tencentcloud", Name: "Tencent Cloud", Color: "0052D9"},
		{Code: "huaweicloud", Name: "Huawei Cloud", Color: "FF0000"},
		{Code: "digitalocean", Name: "DigitalOcean", Color: "0080FF"},
		{Code: "vultr", Name: "Vultr", Color: "007BFC"},
		{Code: "linode", Name: "Linode (Akamai)", Color: "00A95C"},
		{Code: "ovhcloud", Name: "OVHcloud", Color: "000E9C"},
		{Code: "hetzner", Name: "Hetzner", Color: "D50C2D"},
		{Code: "scaleway", Name: "Scaleway", Color: "4F0599"},
		{Code: "upcloud", Name: "UpCloud", Color: "7350FE"},
		{Code: "other", Name: "Other", Color: "888888"},
	}

	return settingsService.SetList(ctx, "providers", "Providers", "integrations", providers)
}
