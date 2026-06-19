package db

import (
	"github.com/KybexOnline/biway/internal/globalvars"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var db *gorm.DB

func GetDatabaseConnection(dbPath string) (*gorm.DB, error) {
	if db == nil {
		if dbPath == "" {
			return nil, globalvars.ErrDatabasePathNotSet
		}
		var err error
		db, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
		return db, err
	}
	return db, nil
}
