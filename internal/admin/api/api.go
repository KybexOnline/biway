package api

import (
	"net/http"

	"github.com/KybexOnline/biway/pkg/middlewares"
	"github.com/gin-gonic/gin"
)

func InitAdminRouter() *gin.Engine {
	engine := gin.New()

	engine.Use(middlewares.JSONLogMiddleware())

	engine.Use(gin.Recovery())

	api := engine.Group("/api/v1")
	{
		api.GET("/health", func(ctx *gin.Context) {
			ctx.JSON(http.StatusOK, gin.H{
				"status": "healthy",
			})
		})
	}

	return engine
}
