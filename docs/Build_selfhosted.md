# Build & Self-Hosted Deployment

This guide explains how to build and deploy Biway from source.

---

# Requirements

Before building Biway, ensure your system has:

- Go 1.24 or newer
- Git
- SQLite
- WireGuard (required on Agent nodes)

Clone the repository.

```bash
git clone https://github.com/KybexOnline/biway.git
cd biway
```

---

# Building the Admin Server

Compile the Admin binary.

```bash
go build -o biway-admin ./cmd/admin
```

---

# Database Initialization

Initialize the SQLite database.

```bash
./biway-admin db-migration --database biway.sqlite
```

This creates all required database tables and schema.

---

# Running the Admin Server

Start the control plane.

```bash
./biway-admin serve \
    --listen 0.0.0.0 \
    --port 8500
```

The Admin Dashboard will be available at

```
http://<server-ip>:8500
```

During the first launch you will be prompted to create your administrator account.

---

# Environment Variables

All environment variables use the `BIWAY_` prefix.

| Variable | Description | Default |
|----------|-------------|---------|
| `BIWAY_ENV` | Runtime environment (`development` or `production`) | `production` |
| `BIWAY_JWT_SECRET` | Secret used for JWT authentication | Auto-generated |
| `BIWAY_PRIVATE_CIDR` | Private mesh network CIDR | `10.35.0.0/24` |
| `BIWAY_ALLOW_ORIGINS` | Allowed CORS origins | `*` |

Example:

```bash
export BIWAY_PRIVATE_CIDR=10.10.0.0/16
export BIWAY_ENV=production

./biway-admin serve
```

---

# Building the Agent

Compile the Agent binary.

```bash
go build -o biway-agent ./cmd/agent
```

Generate the initial configuration.

```bash
./biway-agent init-config
```

This creates an `agent.yaml` configuration file.

---

# Agent Configuration

Edit `agent.yaml` and configure:

- Admin API URL
- Node Token
- Private key

Example:

```yaml
api_endpoint: https://mesh.example.com

api_token: YOUR_NODE_TOKEN

private_key: ""
```

The Node Token can be generated from the Biway Admin Dashboard when adding a new node.

---

# Starting the Agent

Launch the Agent.

```bash
sudo ./biway-agent start --interface-name biway01
```

During startup the Agent will automatically:

1. Generate a WireGuard key pair
2. Register with the Admin Server
3. Upload its public key
4. Receive a private mesh IP address
5. Download peer configurations
6. Configure the local WireGuard interface
7. Continuously synchronize peer changes

No manual WireGuard configuration is required.

---

# Typical Deployment

```
                Internet
                    │
        ┌────────────────────┐
        │    biway-admin     │
        │ REST API + UI      │
        └─────────┬──────────┘
                  │
      Configuration Synchronization
                  │
     ┌────────────┼────────────┐
     │            │            │
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Agent   │ │ Agent   │ │ Agent   │
│ AWS     │ │Hetzner  │ │On-Prem  │
└─────────┘ └─────────┘ └─────────┘
       Secure WireGuard Mesh
```

---

# Updating

Pull the latest changes.

```bash
git pull
```

Rebuild the binaries.

```bash
go build -o biway-admin ./cmd/admin
go build -o biway-agent ./cmd/agent
```

Restart the services.

---

# Troubleshooting

## Admin server does not start

- Verify the database path is writable.
- Ensure the selected port is available.
- Check application logs for startup errors.

---

## Agent cannot register

- Verify the Admin API URL.
- Confirm the Node Token is valid.
- Ensure outbound connectivity to the Admin Server.

---

## WireGuard interface not created

- Verify WireGuard is installed.
- Ensure the Agent is running with sufficient privileges.
- Check system logs for networking errors.

---

# Next Steps

Once your Admin Server is running:

1. Create your administrator account.
2. Add a new node from the dashboard.
3. Generate a Node Token.
4. Configure and start an Agent.
5. Watch your private mesh network come online.