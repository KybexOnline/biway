
Biway turns your scattered cloud servers into a single, secure, and high-performance private mesh network — no matter which providers you use (AWS, Hetzner, DigitalOcean, bare metal, etc.).

Create, manage, modify, and monitor your mesh infrastructure with simplicity and confidence from a centralized, self-hosted dashboard.


## ✨ Features
* 🌍 Self-Hosted Control Plane: Deploy Biway on your own infrastructure and domain. You own your network, keys, and your data.

* 🔒 WireGuard® Core: High-performance, state-of-the-art cryptography for all inter-node communication.

* 🕸️ Frictionless Node Provisioning: Easily add nodes. Agents automatically generate keys and sync peer configurations on the fly.

* 🧮 Smart IP Management: Define your custom private CIDR blocks (e.g., 10.35.0.0/24). Biway handles automatic IP allocation and prevents conflicts.

* 📡 Lightweight Agent Daemon: The biway-agent continuously monitors peer states and gracefully updates WireGuard configurations without dropping existing tunnels.


## 🏗️ Architecture

Biway is split into two primary components:

1. **biway-admin** (Control Plane): The centralized brain. It serves the REST API, hosts the dashboard, manages the SQLite database, and acts as the source of truth for your mesh network's state.

2. **biway-agent** (Node Daemon): A lightweight daemon installed on your target servers. It authenticates with the Admin API, fetches peer configurations, and seamlessly configures the local WireGuard interface.


## ⚙️ Build 

[Build Documention](docs/Build_selfhosted.md)