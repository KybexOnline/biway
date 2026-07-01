package utils

import "fmt"

var (
	// Version is injected via -ldflags during build
	Version = "dev"
	// CommitHash is injected via -ldflags during build
	CommitHash = "unknown"
)

func PrintVersion(projectName string) {
	fmt.Printf("Project Name: %s\n", projectName)
	fmt.Printf("Version:      %s\n", Version)
	fmt.Printf("Commit Hash:  %s\n", CommitHash)
}
