package api

import (
	"net/http"
	"strings"

	"github.com/KybexOnline/biway/pkg/utils"
	"github.com/gin-gonic/gin"
)

const AGENT_KEY = "agent"

func serverAuthenticate() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("X-Agent-Token")
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "X-AGENT-TOKEN header is required",
			})
			return
		}

		server, err := serverService.GetAgentByToken(c.Request.Context(), token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized token",
			})
			return
		}
		c.Set(AGENT_KEY, server)
	}
}

func adminAuthenticate() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		if token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized",
			})
			return
		}
		authToken := strings.Split(token, " ")
		if len(authToken) != 2 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized",
			})
			return
		}

		claims, err := utils.JWT.ValidateToken(authToken[1])
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized",
			})
			return
		}
		id, err := claims.GetSubject()
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized",
			})
			return
		}
		c.Set("admin_id", id)
	}
}
