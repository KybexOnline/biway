package api

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/KybexOnline/biway/internal/admin/service"
	"github.com/KybexOnline/biway/internal/db"
	"github.com/KybexOnline/biway/internal/models"
	"github.com/KybexOnline/biway/pkg/apperrors"
)

var settingsService *service.SettingsService

func registerSettingsRouter(group *gin.RouterGroup) {
	dbConn, err := db.GetDatabaseConnection("")

	if err != nil {
		panic(err)
	}

	repo := db.NewSettingRepository(dbConn)
	settingsService = service.NewSettingsService(repo)

	api := group.Group("/settings")
	{
		api.GET("", adminAuthenticate(), settingsList)
		api.GET("/:key", adminAuthenticate(), settingGet)
		api.PUT("/:key", adminAuthenticate(), settingSet)
		api.DELETE("/:key", adminAuthenticate(), settingDelete)

		// providers is a "list" setting with dedicated add/update/remove endpoints
		providers := api.Group("/providers")
		{
			providers.GET("", adminAuthenticate(), providersList)
			providers.POST("", adminAuthenticate(), providerCreate)
			providers.PUT("/:code", adminAuthenticate(), providerUpdate)
			providers.DELETE("/:code", adminAuthenticate(), providerDelete)
		}
	}
}

// ---------------------------------------------------------------------------
// Generic settings endpoints
// ---------------------------------------------------------------------------

type settingsListReq struct {
	Group string `form:"group"`
}

func settingsList(c *gin.Context) {
	var req settingsListReq

	if err := c.ShouldBindQuery(&req); err != nil {
		apperrors.HandleError(c, err)
		return
	}

	settings, err := settingsService.List(c.Request.Context(), req.Group)
	if err != nil {
		apperrors.HandleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": settings,
		"count": len(settings),
	})
}

func settingGet(c *gin.Context) {
	key := c.Param("key")
	if key == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "key is required",
		})
		return
	}

	setting, err := settingsService.GetSetting(c.Request.Context(), key)
	if err != nil {
		apperrors.HandleError(c, err)
		return
	}

	c.JSON(http.StatusOK, setting)
}

type settingSetReq struct {
	Label string             `json:"label" binding:"required"`
	Group string             `json:"group"`
	Type  models.SettingType `json:"type" binding:"required"`
	Value interface{}        `json:"value"`
}

func settingSet(c *gin.Context) {
	key := c.Param("key")
	if key == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "key is required",
		})
		return
	}

	var req settingSetReq
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := settingsService.Set(c.Request.Context(), key, req.Label, req.Group, req.Type, req.Value)
	if err != nil {
		apperrors.HandleError(c, err)
		return
	}

	setting, err := settingsService.GetSetting(c.Request.Context(), key)
	if err != nil {
		apperrors.HandleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": setting,
	})
}

func settingDelete(c *gin.Context) {
	key := c.Param("key")
	if key == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "key is required",
		})
		return
	}

	err := settingsService.Delete(c.Request.Context(), key)
	if err != nil {
		apperrors.HandleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "setting deleted successfully",
	})
}

func providersList(c *gin.Context) {
	providers, err := settingsService.GetProviders(c.Request.Context())
	if err != nil {
		apperrors.HandleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": providers,
		"count": len(providers),
	})
}

type providerReq struct {
	Code  string `json:"code" binding:"required"`
	Color string `json:"color"`
	Name  string `json:"name" binding:"required"`
}

func providerCreate(c *gin.Context) {
	var req providerReq
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	provider := models.Provider{
		Code:  req.Code,
		Color: req.Color,
		Name:  req.Name,
	}

	if err := settingsService.AddProvider(c.Request.Context(), provider); err != nil {
		apperrors.HandleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": provider,
	})
}

func providerUpdate(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "code is required",
		})
		return
	}

	var req providerReq
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	provider := models.Provider{
		Code:  code, // path param wins, ignore body code to avoid mismatches
		Color: req.Color,
		Name:  req.Name,
	}

	if err := settingsService.UpdateProvider(c.Request.Context(), provider); err != nil {
		apperrors.HandleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": provider,
	})
}

func providerDelete(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "code is required",
		})
		return
	}

	if err := settingsService.RemoveProvider(c.Request.Context(), code); err != nil {
		apperrors.HandleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "provider removed successfully",
	})
}
