package api

import (
	"errors"
	"net/http"

	"github.com/KybexOnline/biway/internal/admin/service"
	"github.com/KybexOnline/biway/internal/db"
	"github.com/KybexOnline/biway/pkg/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var adminService *service.AdminService

func registerAdminRouter(group *gin.RouterGroup) {
	dbConn, err := db.GetDatabaseConnection("")

	if err != nil {
		panic(err)
	}

	// initial admin repository and service
	repo := db.NewAdminRepository(dbConn)
	adminService = service.NewAdminServce(repo)

	// handler for check service status
	group.GET("/status", status)

	api := group.Group("/admin")
	{
		api.POST("/login", adminLogin)
		api.POST("/initial", initial)
	}
}

type LoginRequest struct {
	User     string `json:"user" form:"user" binding:"required"`
	Password string `json:"password" form:"password" binding:"required"`
}

func adminLogin(c *gin.Context) {
	var login LoginRequest

	if err := c.ShouldBind(&login); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, login)
}

// status handles the API endpoint for checking Biway's initialization state.
// It queries the database to determine if an administrative user exists.
// If no admin is found, it returns a 200 OK with a payload signaling the
// client dashboard to mount the first-time setup wizard.
//
// Responses:
//   - 200 OK (needs_setup: true)  : No admin found, prompt setup.
//   - 200 OK (needs_setup: false) : System is configured and ready.
//   - 500 Internal Server Error   : Database connection or query failure.
func status(c *gin.Context) {
	_, err := adminService.FindByUsername(c.Request.Context(), "")

	if err != nil {
		// Case: No admin user exists, trigger setup flow
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusOK, gin.H{
				"initialized": false,
				"needs_setup": true,
				"version":     "1.0.0",
			})
			return
		}

		// Case: Actual infrastructure/DB error. Do not falsely report initialized.
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal system error while checking initialization status",
		})
		return
	}

	// Case: Admin exists, system is ready
	c.JSON(http.StatusOK, gin.H{
		"initialized": true,
		"needs_setup": false,
		"version":     "1.0.0",
	})
}

type initialRequest struct {
	Username string `form:"username" json:"username" binding:"required"`
	Password string `form:"password" json:"password" binding:"required"`
}

func initial(c *gin.Context) {
	var req initialRequest

	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  err.Error(),
		})
		return
	}

	_, err := adminService.FindByUsername(c.Request.Context(), "")
	if err != nil {
		// Case: No admin user exists, trigger setup flow
		if errors.Is(err, gorm.ErrRecordNotFound) {

			passwordHash, err := utils.HashPassword(req.Password)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "internal system error while creating hash password",
				})
				return
			}

			err = adminService.Create(c.Request.Context(), req.Username, passwordHash)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "internal system error while creating admin",
				})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"message": "system successfully initialized!",
			})

			return
		}

		// Case: Actual infrastructure/DB error. Do not falsely report initialized.
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal system error while checking initialization status",
		})
		return
	}

	c.JSON(http.StatusBadRequest, gin.H{
		"message": "Your service is already initialized",
	})
}
