package middlewares

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// JSONLogMiddleware returns a Gin middleware function that logs HTTP request details in JSON format.
// The middleware logs the request method, request path, and HTTP status code of the response.
// The severity level of the log is determined based on the status code:
// - Status codes 500 and above are logged with level 3 (Error).
// - Status codes between 400 and 499 are logged with level 2 (Warning).
// - Status codes between 200 and 399 are logged with level 1 (Info).
//
// Returns:
//   - A Gin handler function that applies the logging middleware.
func JSONLogMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		tsReq := time.Now()

		// Process the request
		c.Next()

		// Get the HTTP status code of the response
		statusCode := c.Writer.Status()

		// Create a log entry with request details
		entry := map[string]any{
			"start_date":     tsReq,
			"client_address": c.ClientIP(),
			"request_method": c.Request.Method,
			"request_path":   c.Request.RequestURI,
			"status_code":    statusCode,
			"duration":       time.Since(tsReq).Seconds(),
		}

		if statusCode >= 500 {
			entry["x-error"] = c.GetString("x-error")
			entry["x-error-stage"] = c.GetString("x-error-stage")
			log.Error().Fields(entry).Msg("Server error during API request")
		} else if statusCode >= 400 {
			log.Warn().Fields(entry).Msg("Client error during API request")
		} else {
			log.Info().Fields(entry).Msg("API request successful")
		}
	}
}
