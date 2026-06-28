package api

import (
	"net/http"

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
