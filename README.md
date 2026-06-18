# Biway (Bidirectional Way)

![License](https://img.shields.io/badge/license-Fair%20Code-purple.svg)
![Deployment](https://img.shields.io/badge/deployment-Self--Hosted-1081c2.svg)
![WireGuard](https://img.shields.io/badge/Powered%20by-WireGuard-8B0000.svg)
![React](https://img.shields.io/badge/Frontend-React-61DAFB.svg)

**Biway** is a modern, self-hosted mesh service designed to orchestrate secure, bidirectional private networks across any infrastructure. Built on top of **WireGuard**, it allows you to effortlessly connect globally distributed servers (across AWS, Hetzner, DigitalOcean, etc.) into isolated mesh networks, entirely managed from your own host and domain.

## ✨ Features

- **Self-Hosted Control Plane:** Deploy Biway on your own infrastructure and domain. You own your network and your data.
- **WireGuard Core:** High-performance, state-of-the-art cryptography for all inter-node communication.
- **Custom CIDR Management:** Define your own private IP spaces for different environments (e.g., `10.0.0.0/24`).
- **Frictionless Node Provisioning:** - **Automated Script:** Add nodes with a single command linked directly to your Biway domain.
  - **SSH Integration:** Drop the public key onto your server for zero-touch configuration.
- **Smart IP Assignment:** Choose between automatic DHCP-style private IP allocation or strictly enforced manual IP assignment.
- **Diagnostics & Monitoring:** Built-in inter-node ping testing and latency tracking directly from the React-based dashboard.

## 🚀 Quick Start (Self-Hosted)

1. **Deploy Biway:** Spin up the Biway control plane on your own server and point your domain to it (e.g., `biway.yourdomain.com`).
2. **Create a Network:** Log into your self-hosted panel and create a new network with a designated CIDR.
3. **Add Nodes:** Click "Add Server to Mesh" and run the generated setup script on your target nodes.
4. **Verify Connection:** Use the integrated Ping Diagnostics tool to ensure tunnels are active.

## 📜 Licensing & Usage

Biway operates under a **Fair-Code / Dual-License** model to keep the project open and accessible while protecting its commercial viability.

- ✅ **Free for Personal & Educational Use:** You can use Biway for free for home labs, learning, and personal projects.
- ✅ **Free for Small Businesses:** Small companies and startups can use Biway in production environments at no cost.
- ❌ **Commercial License Required for Large Enterprises:** Big companies utilizing Biway at scale must purchase a commercial license.
- 🚫 **Strictly Prohibited:** You may **not** use the Biway source code to create, host, or offer a competing commercial SaaS/mesh service. 

*For enterprise licensing inquiries, please open an issue or contact the maintainer directly.*

## 🛠 Tech Stack

- **Frontend:** React, Tailwind CSS
- **Backend & Networking:** WireGuard kernel module integration, high-performance routing.

## 👨‍💻 Author

**Amir Arsalan**
- GitHub: [@amirarsalan](https://github.com/amirarsalan)
- LinkedIn: [amirarsalanio](https://linkedin.com/in/amirarsalanio)

## 🔒 Security & Privacy

This project strictly adheres to privacy-preserving architecture. By self-hosting Biway, no third-party services are involved in your control plane, and all inter-node traffic operates through end-to-end encrypted WireGuard tunnels.