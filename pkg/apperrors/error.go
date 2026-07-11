package apperrors

type AppErrorCode string

const VALIDATION AppErrorCode = "VALIDATION_FAILED"

type AppError struct {
	HTTPCode int          `json:"-"`
	Code     AppErrorCode `json:"code"`
	Message  string       `json:"message"`
	Details  interface{}  `json:"details,omitempty"`
}

func (a *AppError) Error() string {
	return a.Message
}

func NewAppError(httpCode int, code AppErrorCode, message string, details interface{}) *AppError {
	return &AppError{
		HTTPCode: httpCode,
		Code:     code,
		Message:  message,
		Details:  details,
	}
}
