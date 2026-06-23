package api

import (
	"net/http"

	"github.com/KybexOnline/biway/internal/config"
	"github.com/KybexOnline/biway/pkg/middlewares"
	"github.com/KybexOnline/biway/pkg/utils"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func InitAdminRouter() *gin.Engine {

	utils.NewJWTHelper(config.AppConfig.JWTSecret)

	if config.AppConfig.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	engine := gin.New()

	// cors setup
	engine.Use(cors.New(cors.Config{
		AllowOrigins:     config.AppConfig.AllowOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Content-Length", "Accept-Encoding", "Authorization", "X-CSRF-Token"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,           // Important if using cookies/auth
		MaxAge:           12 * time.Hour, // Cache preflight response
	}))

	engine.Use(middlewares.JSONLogMiddleware())

	engine.Use(gin.Recovery())

	api := engine.Group("/api/v1")
	{
		api.GET("/health", func(ctx *gin.Context) {
			ctx.JSON(http.StatusOK, gin.H{
				"status": "healthy",
			})
		})

		// register admin routers
		registerAdminRouter(api)

		// register server routers
		registerServerRouter(api)
	}

	return engine
}
