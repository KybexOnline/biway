package api

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/KybexOnline/biway/internal/admin/service"
	"github.com/KybexOnline/biway/internal/db"
	"github.com/KybexOnline/biway/internal/models"
)

var serverService *service.ServerService

func registerServerRouter(group *gin.RouterGroup) {
	dbConn, err := db.GetDatabaseConnection("")

	if err != nil {
		panic(err)
	}

	repo := db.NewServerRepository(dbConn)
	serverService = service.NewServerService(repo)

	api := group.Group("/servers")
	{
		api.GET("", serverList)
		api.POST("", serverCreate)
	}
}

func serverList(c *gin.Context) {

	ctx := c.Request.Context()

	servers, total, err := serverService.List(
		ctx,
		&models.Servers{},
		1,
		10,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal system error",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"servers": servers,
		"meta": gin.H{
			"total": total,
			"page":  1,
			"count": len(servers),
		},
	})

}

type serverCreateReq struct {
	Name      string   `json:"name" form:"name" binding:"required"`
	Tags      []string `json:"tags" form:"tags"`
	Provider  string   `json:"provider" form:"provider"`
	PublicIP  string   `json:"public_ip" form:"public_ip" bindig:"required"`
	PrivateIP string   `json:"private_ip" form:"private_ip"`
}

func serverCreate(c *gin.Context) {

	var req serverCreateReq

	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  err.Error(),
		})
		return
	}

	ctx := c.Request.Context()

	server, err := serverService.Create(
		ctx, req.Name, req.Tags, req.Provider, req.PublicIP, req.PrivateIP,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal system error",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": server,
	})
}
