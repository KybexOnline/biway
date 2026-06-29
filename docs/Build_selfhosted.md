# 🚀 Build

## 1. Starting the Admin Server

Clone the repository and build the admin binary:

```bash
git clone https://github.com/KybexOnline/biway.git
cd biway

# Build the Admin binary
go build -o biway-admin ./cmd/admin
```

First, run the database migrations to initialize the SQLite database:

```bash
./biway-admin db-migration --database biway.sqlite
```

Then, start the server:

```bash
./biway-admin serve --port 8500 --listen 0.0.0.0
```

* Admin Environment Variables (`BIWAY_` prefix)

| Variable | description    | Default   |
|----------|----------------|-----------|
| `BIWAY_ENV` | Environment (`development` or `production`) | `production` |
| `BIWAY_JWT_SECRET` | Secret key for JWT auth | Auto-generated if empty |
| `BIWAY_PRIVATE_CIDR` | CIDR block for the mesh network | `10.35.0.0/24` |
| `BIWAY_ALLOW_ORIGINS` | CORS allowed origins (comma separated) | `*`


Visit ` http://<your-ip>:8500 ` in your browser. The initial setup wizard will prompt you to create your first admin account.

## 2. Starting an Agent

On the server you want to add to your mesh, download/build the agent binary:

```bash
# Build the Agent binary
go build -o biway-agent ./cmd/agent

# Initialize the configuration file
./biway-agent init-config
```

Edit the generated `agent.yaml` (usually in the same directory or `/etc/biway/`) to include your Admin API endpoint and the Node Token generated from your Admin Dashboard.

Start the agent daemon:

```bash
sudo ./biway-agent start --interface-name biway01
```

The agent will automatically generate a private key, register its public key with the admin server, receive an IP, and establish tunnels with other active peers!