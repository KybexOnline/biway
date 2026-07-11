package apperrors

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

func ErrNotFound(message string) *AppError {
	return NewAppError(http.StatusNotFound, "NOT_FOUND", message, nil)
}

func ErrUnauthorized(message string) *AppError {
	return NewAppError(http.StatusUnauthorized, "UNAUTHORIZED", message, nil)
}

func ErrInternalServer(message string) *AppError {
	return NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", message, nil)
}

func HandleError(c *gin.Context, err error) {
	if err == nil {
		return
	}

	// Check if the error is our custom AppError
	var appErr *AppError
	if errors.As(err, &appErr) {
		c.JSON(appErr.HTTPCode, appErr)
		return
	}

	// Check if the error is a Gin/Go-Playground Validation Error
	var valErrors validator.ValidationErrors
	if errors.As(err, &valErrors) {
		details := make([]map[string]string, 0)
		for _, fe := range valErrors {
			details = append(details, map[string]string{
				"field":   fe.Field(),
				"message": getValidationMessage(fe),
			})
		}

		validationAppErr := NewAppError(
			http.StatusBadRequest,
			VALIDATION,
			"Invalid input data",
			details,
		)
		c.JSON(validationAppErr.HTTPCode, validationAppErr)
		return
	}

	// Fallback for unhandled/unknown errors (e.g., database connection issues)
	// In production, you might want to log the actual error here and hide details from the user.
	internalErr := ErrInternalServer("An unexpected error occurred")
	c.JSON(internalErr.HTTPCode, internalErr)
}

// getValidationMessage translates validator tags into user-friendly messages.
func getValidationMessage(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "This field is required"
	case "email":
		return "Must be a valid email address"
	case "min":
		return fmt.Sprintf("Must be at least %s", fe.Param())
	case "max":
		return fmt.Sprintf("Must be no more than %s", fe.Param())
	default:
		return fmt.Sprintf("Failed validation on tag: %s", fe.Tag())
	}
}
