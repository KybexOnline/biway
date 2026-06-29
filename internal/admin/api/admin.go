package api

import (
	"net/http"

	"github.com/KybexOnline/biway/internal/admin/service"
	"github.com/KybexOnline/biway/internal/db"
	"github.com/KybexOnline/biway/pkg/utils"
	"github.com/gin-gonic/gin"
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
	ctx := c.Request.Context()
	admin, err := adminService.FindByUsername(ctx, login.User)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "User or password is incorrect",
		})
		return
	}

	passwordCheck, err := utils.VerifyPassword(login.Password, admin.PasswordHash)

	if err != nil || !passwordCheck {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "User or password is incorrect",
		})
		return
	}

	token, err := utils.JWT.GenerateTokenById(admin.ID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal system error",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
	})
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
	hasAdmin, err := adminService.HasAdmin(c.Request.Context())
	if err != nil {
		// Case: Actual infrastructure/DB error. Do not falsely report initialized.
		// In a real app, you should log 'err' here internally.
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal system error while checking initialization status",
		})
		return
	}

	if !hasAdmin {
		// Case: No admin user exists, trigger setup flow
		c.JSON(http.StatusOK, gin.H{
			"initialized": false,
			"needs_setup": true,
			"version":     "1.0.0",
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

// InitialRequest represents the payload required to set up the initial admin user.
// Added minimum length validation to ensure secure credentials.
type initialRequest struct {
	Username string `form:"username" json:"username" binding:"required,min=4,max=32"`
	Password string `form:"password" json:"password" binding:"required,min=8"`
}

// Initial handles the system initialization endpoint.
// It checks if the system already has an admin user. If not, it provisions
// the first administrative account using the provided credentials.
func initial(c *gin.Context) {
	var req initialRequest

	// 1. Validate Input Payload
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid request payload",
			"details": err.Error(),
		})
		return
	}

	ctx := c.Request.Context()

	// 2. Check Initialization Status
	hasAdmin, err := adminService.HasAdmin(ctx)
	if err != nil {
		// Case: Actual infrastructure/DB error. Do not falsely report initialized.
		// In a real app, you should log 'err' here internally.
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal system error while checking initialization status",
		})
		return
	}

	if hasAdmin {
		// StatusConflict (409) is more semantic here than StatusBadRequest (400).
		c.JSON(http.StatusConflict, gin.H{
			"error": "system is already initialized",
		})
		return
	}

	// 3. Setup Flow (no admin exists)
	passwordHash, err := utils.HashPassword(req.Password)
	if err != nil {
		// Log internal err here
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to process secure password",
		})
		return
	}

	// 5. Create the Admin User
	if err := adminService.Create(ctx, req.Username, passwordHash); err != nil {
		// Log internal err here
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to provision initial admin user",
		})
		return
	}

	// 6. Success Response
	// StatusCreated (201) indicates a resource was successfully created.
	c.JSON(http.StatusCreated, gin.H{
		"message": "system successfully initialized",
	})
}
