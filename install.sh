#!/bin/bash
# Biway Admin Installer

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Biway Admin Installer${NC}"

# Check root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (sudo)${NC}"
  exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    OS_LIKE=$ID_LIKE
else
    echo -e "${RED}Cannot detect OS${NC}"
    exit 1
fi

if [[ "$OS" == "ubuntu" || "$OS" == "debian" || "$OS_LIKE" == *"debian"* ]]; then
    PKG_MANAGER="apt"
    echo -e "${GREEN}Detected Debian/Ubuntu-based system${NC}"
elif [[ "$OS" == "rhel" || "$OS" == "centos" || "$OS" == "fedora" || "$OS_LIKE" == *"rhel"* ]]; then
    PKG_MANAGER="yum"
    echo -e "${GREEN}Detected RedHat-based system${NC}"
else
    echo -e "${RED}Unsupported OS. Only Ubuntu/Debian and RHEL-based are supported.${NC}"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
if [ "$PKG_MANAGER" = "apt" ]; then
    apt-get update -qq
    apt-get install -y curl wget jq tar
else
    yum install -y curl wget jq tar
fi

# Get latest release
echo -e "${YELLOW}Fetching latest release...${NC}"
LATEST_RELEASE=$(curl -s https://api.github.com/repos/KybexOnline/biway/releases/latest | jq -r '.tag_name')
echo -e "Latest version: ${GREEN}$LATEST_RELEASE${NC}"

# Detect architecture
ARCH=$(uname -m)
if [[ "$ARCH" == "x86_64" ]]; then
    BINARY="biway-admin-linux-amd64"
elif [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
    BINARY="biway-admin-linux-arm64"
else
    echo -e "${RED}Unsupported architecture: $ARCH${NC}"
    exit 1
fi

DOWNLOAD_URL="https://github.com/KybexOnline/biway/releases/download/${LATEST_RELEASE}/${BINARY}"

# Download binary
echo -e "${YELLOW}Downloading biway-admin...${NC}"
wget -q --show-progress "$DOWNLOAD_URL" -O /usr/local/bin/biway-admin
chmod +x /usr/local/bin/biway-admin

# Create directories
INSTALL_DIR="/opt/biway"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo -e "${GREEN}biway-admin installed successfully!${NC}"

# === Configuration Questions ===
echo -e "\n${YELLOW}=== Biway Admin Setup ===${NC}"

read -p "Port for the admin panel [8500]: " PORT
PORT=${PORT:-8500}

read -p "Database path [${INSTALL_DIR}/biway.sqlite]: " DB_PATH
DB_PATH=${DB_PATH:-${INSTALL_DIR}/biway.sqlite}

read -p "Private network CIDR [10.10.0.0/24]: " PRIVATE_CIDR
PRIVATE_CIDR=${PRIVATE_CIDR:-10.10.0.0/24}


# Create systemd service
echo -e "${YELLOW}Creating systemd service...${NC}"

cat > /etc/systemd/system/biway-admin.service << EOF
[Unit]
Description=Biway Admin Control Plane
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
Environment="BIWAY_PRIVATE_CIDR=$PRIVATE_CIDR"
ExecStart=/usr/local/bin/biway-admin serve --listen 0.0.0.0 --port $PORT --database $DB_PATH
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Run database migration
echo -e "${YELLOW}Running database migration...${NC}"
/usr/local/bin/biway-admin db-migration --database "$DB_PATH" || echo -e "${YELLOW}Migration command may have completed or needs manual check.${NC}"

# Enable and start service
systemctl daemon-reload
systemctl enable biway-admin
systemctl start biway-admin

echo -e "\n${GREEN}=== Installation Complete! ===${NC}"
echo -e "Admin panel should be available at: http://0.0.0.0:${PORT}"
echo -e "Service status: systemctl status biway-admin"
echo -e "Logs: journalctl -u biway-admin -f"


echo -e "\n${GREEN}You can now complete the setup wizard in your browser.${NC}"