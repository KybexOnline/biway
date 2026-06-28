package api

import (
	"fmt"
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
		api.GET("/me", serverAuthenticate(), agentInfo)
		api.POST("/set_pubkey", serverAuthenticate(), setPublicKey)
		api.GET("/:id", serverDetails)
	}
}

// TODO: need to change
func agentInfo(c *gin.Context) {
	s, _ := c.Get(AGENT_KEY)
	server := s.(models.AgentInfo)
	c.JSON(http.StatusOK, server)
}

func setPublicKey(c *gin.Context) {
	type Req struct {
		PublicKey string `json:"public_key"`
	}

	var req Req

	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	s, _ := c.Get(AGENT_KEY)
	server := s.(models.AgentInfo)

	agent, err := serverService.SetPublicKey(c.Request.Context(), server.ID, req.PublicKey)
	if err != nil {
		fmt.Println(err)
		c.Set("x-error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal system error",
		})
		return
	}
	c.JSON(http.StatusOK, agent)
}

func serverDetails(c *gin.Context) {
	server_id := c.Param("id")
	if server_id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "id is required",
		})
	}
	ctx := c.Request.Context()
	server, err := serverService.GetById(ctx, server_id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal system error",
		})
		return
	}

	c.JSON(http.StatusOK, server)
}

type serverListReq struct {
	Start int `form:"_start" binding:"omitempty,min=0"` // offset
	End   int `form:"_end" binding:"omitempty,min=0"`   // limit = end - start
}

func serverList(c *gin.Context) {
	var req serverListReq

	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Default values if not provided
	if req.End == 0 {
		req.End = 10 // default page size
	}
	if req.Start < 0 {
		req.Start = 0
	}

	limit := req.End - req.Start
	if limit <= 0 {
		limit = 10
	}

	ctx := c.Request.Context()

	servers, total, err := serverService.List(
		ctx,
		&models.Servers{},
		req.Start, // offset
		limit,     // limit
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "internal system error",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": servers,
		"total": total,
		"page":  (req.Start / limit) + 1,
		"limit": limit,
		"count": len(servers),
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
