package api

import (
	"bytes"
	"fmt"
	"net/http"
	"text/template"

	"github.com/KybexOnline/biway/pkg/utils"
	"github.com/gin-gonic/gin"
)

var scriptTemplate string = `#!/bin/bash
# install-agent.sh
# Supports: Ubuntu, Debian, AlmaLinux

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ====================== CONFIG ======================
AGENT_NAME="biway-agent"
AGENT_BIN="/usr/local/bin/${AGENT_NAME}"
AGENT_SERVICE="/etc/systemd/system/${AGENT_NAME}.service"
# ===================================================

print_usage() {
    echo -e "${RED}Usage: $0 --token=YOUR_TOKEN${NC}"
    exit 1
}

# Parse arguments
TOKEN=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --token=*)
            TOKEN="${1#*=}"
            ;;
        --token)
            TOKEN="${2:-}"
            shift
            ;;
        -h|--help)
            print_usage
            ;;
    esac
    shift
done

if [[ -z "$TOKEN" ]]; then
    echo -e "${RED}❌ Error: --token is required${NC}"
    print_usage
fi

# Check root
if [[ $EUID -ne 0 ]]; then
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

echo -e "🔍 ${GREEN}Detecting OS...${NC}"
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    OS=$ID
    VERSION_CODENAME=${VERSION_CODENAME:-}
else
    echo -e "${RED}❌ Cannot detect OS${NC}"
    exit 1
fi

echo -e "📦 ${GREEN}Updating system packages...${GREEN}"

case $OS in
    ubuntu|debian)
        export DEBIAN_FRONTEND=noninteractive
        apt-get update -qq
        apt-get install -y curl wget unzip wireguard
        ;;
    almalinux|rocky|rhel|centos|fedora)
        dnf update -y -q
        dnf install -y epel-release
        dnf install -y curl wget unzip wireguard-tools
        ;;
    *)
        echo -e "${RED}❌ Unsupported OS: $OS ${NC}"
        echo -e "${RED}Supported: Ubuntu, Debian, AlmaLinux${NC}"
        exit 1
        ;;
esac

echo -e "✅ ${GREEN}WireGuard installed ${NC}"

# ====================== DOWNLOAD AGENT ======================
echo -e "⬇️ ${GREEN}Downloading agent with provided token...${NC}"
ARCH=$(uname -m)
if [[ "$ARCH" == "x86_64" ]]; then
    BINARY="biway-agent-linux-amd64"
elif [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
    BINARY="biway-agent-linux-arm64"
else
    echo -e "${RED}Unsupported architecture: $ARCH${NC}"
    exit 1
fi


# Adjust the URL below according to your backend
DOWNLOAD_URL="{{ .DownloadLink }}/$BINARY"

if ! curl -fsSL -H "User-Agent: Biway-Installer" \
     -o "${AGENT_BIN}" \
     "${DOWNLOAD_URL}"; then
    echo -e "${RED}❌ Failed to download agent${NC}"
    exit 1
fi

chmod +x "${AGENT_BIN}"
echo -e "✅ ${GREEN}Agent downloaded to ${AGENT_BIN} ${NC}"

# ====================== CREATE SYSTEMD SERVICE ======================
echo -e "⚙️ ${GREEN}Creating systemd service... ${NC}"

API_URL="{{ .ApiUrl }}"

cat > "${AGENT_SERVICE}" << EOF
[Unit]
Description=Biway Agent Service
After=network.target

[Service]
Type=simple
ExecStartPre=${AGENT_BIN} init-config
ExecStart=${AGENT_BIN} start
Restart=always
RestartSec=5
User=root
Environment="BIWAY_API_ENDPOINT=${API_URL}" "BIWAY_API_TOKEN=${TOKEN}"

[Install]
WantedBy=multi-user.target
EOF

# Reload and enable service
systemctl daemon-reload
systemctl enable --now "${AGENT_NAME}.service"

echo -e "✅ Systemd service created and started"

# Final status
echo ""
echo "🎉 Installation completed successfully!"
echo "📋 Token: ${TOKEN}"
echo "🔧 Service: ${AGENT_NAME}.service"
echo ""

echo ""
echo "Useful commands:"
echo "  systemctl status ${AGENT_NAME}"
echo "  journalctl -u ${AGENT_NAME} -f"
`

var scriptTmpl *template.Template

func init() {
	scriptTmpl, _ = template.New("install_script").Parse(scriptTemplate)
}

func installScriptHandler(c *gin.Context) {
	scheme := "http"

	if c.Request.TLS != nil {
		scheme = "https"
	} else if c.GetHeader("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}

	host := c.Request.Host

	baseURL := fmt.Sprintf("%s://%s", scheme, host)

	var downloadURL string
	if utils.Version == "dev" {
		downloadURL = fmt.Sprintf("%s/download", baseURL)
	} else {
		downloadURL = fmt.Sprintf("https://github.com/KybexOnline/biway/releases/download/%s", utils.Version)
	}
	data := map[string]string{
		"DownloadLink": downloadURL,
		"ApiUrl":       fmt.Sprintf("%s/api/v1", baseURL),
	}

	var buf bytes.Buffer

	if err := scriptTmpl.Execute(&buf, data); err != nil {
		c.String(http.StatusInternalServerError, "Error generating script")
		return
	}
	c.Data(http.StatusOK, "text/x-shellscript", buf.Bytes())
}
