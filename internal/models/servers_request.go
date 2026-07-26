package models

type AgentOSInfoUpdate struct {
	OS      string `json:"os"`
	Distro  string `json:"distro"`
	Version string `json:"version"`
	Arch    string `json:"architecture"`
	Kernel  string `json:"kernel"`

	AgentCommit  string `json:"agent_commit"`
	AgentVersion string `json:"agent_version"`

	Raw map[string]any `json:"raw"`
}
