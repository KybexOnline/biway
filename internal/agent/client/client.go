package client

import (
	"context"
	"errors"
	"fmt"

	"github.com/KybexOnline/biway/internal/models"
	"github.com/rs/zerolog/log"
	"resty.dev/v3"
)

type AgentClient struct {
	apiURL   string
	apiToken string
	http     *resty.Client // Reuse the client to leverage connection pooling
}

var ErrClientNotInit = errors.New("client not initiated")

func NewAgentClient(apiURL, token string) *AgentClient {
	// Create the HTTP client ONCE
	httpClient := resty.New()

	// Set base configuration for all future requests
	httpClient.SetBaseURL(apiURL)
	httpClient.SetHeader("X-Agent-Token", token)

	httpClient.SetRetryCount(3)

	return &AgentClient{
		apiURL:   apiURL,
		apiToken: token,
		http:     httpClient,
	}
}

func (a *AgentClient) GetAgentInfo() (*models.AgentInfo, error) {
	agentInfo := &models.AgentInfo{}
	res, err := a.http.R().
		SetResult(agentInfo).
		Get("/servers/me")

	if err != nil {
		log.Error().Err(err).Msg("Failed to reach upstream server")
		return nil, err
	}
	if res.IsStatusFailure() {
		log.Error().Err(fmt.Errorf("%s", res.String())).Msg("api return error")
		return nil, fmt.Errorf("agent could not verified")
	}
	return agentInfo, nil
}

func (a *AgentClient) SetPublicKey(ctx context.Context, publicKey string) (*models.AgentInfo, error) {
	agentInfo := &models.AgentInfo{}
	res, err := a.http.R().
		SetContext(ctx).
		SetResult(agentInfo).
		SetBody(map[string]string{
			"public_key": publicKey,
		}).
		Post("/servers/set_pubkey")
	if err != nil {
		log.Error().Err(err).Msg("Failed to reach upstream server")
		return nil, err
	}
	if res.IsStatusFailure() {
		log.Error().Err(fmt.Errorf("%s", res.String())).Msg("api return error")
		return nil, fmt.Errorf("Could not set public key")
	}
	return agentInfo, nil
}

func (a *AgentClient) ChangeStatus(ctx context.Context, status models.ServerStatus) error {
	res, err := a.http.R().
		SetContext(ctx).
		SetBody(map[string]string{
			"status": string(status),
		}).
		Patch("/servers/status")

	if err != nil {
		log.Error().Err(err).Msg("Failed to reach upstream server")
		return err
	}
	if res.IsStatusFailure() {
		log.Error().Err(fmt.Errorf("%s", res.String())).Msg("api return error")
		return fmt.Errorf("Could not change the status")
	}
	return nil
}

func (a *AgentClient) GetPeers(ctx context.Context) ([]models.AgentPeer, error) {
	type Result struct {
		Items []models.AgentPeer `json:"items"`
	}
	peers := &Result{}
	res, err := a.http.R().
		SetContext(ctx).
		SetResult(peers).
		Get("/servers/peers")
	if err != nil {
		log.Error().Err(err).Msg("Failed to reach upstream server")
		return nil, err
	}
	if res.IsStatusFailure() {
		log.Error().Err(fmt.Errorf("%s", res.String())).Msg("api return error")
		return nil, fmt.Errorf("can not retrieve the peers")
	}

	return peers.Items, nil
}
