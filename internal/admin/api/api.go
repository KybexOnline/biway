package api

import (
	"embed"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/KybexOnline/biway/internal/config"
	"github.com/KybexOnline/biway/pkg/middlewares"
	"github.com/KybexOnline/biway/pkg/utils"
	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
)

//go:embed static_files
var embeddedFiles embed.FS

func InitAdminRouter() *gin.Engine {

	utils.NewJWTHelper(config.AppConfig.JWTSecret)

	if config.AppConfig.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
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

	distFS := getFileSystem("static_files")
	engine.Use(static.Serve("/", distFS))

	engine.NoRoute(func(c *gin.Context) {
		// Only serve index.html for non-API routes
		if !strings.HasPrefix(c.Request.RequestURI, "/api") {
			index, err := distFS.Open("index.html")
			if err != nil {
				log.Fatal(err)
			}
			defer index.Close()
			stat, _ := index.Stat()
			http.ServeContent(c.Writer, c.Request, "index.html", stat.ModTime(), index)
		}
	})

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

func getFileSystem(path string) static.ServeFileSystem {
	fs, err := static.EmbedFolder(embeddedFiles, path)
	if err != nil {
		log.Fatal(err)
	}
	return fs
}
