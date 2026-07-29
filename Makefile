# ==== Config ====
BINARY_AGENT := biway-agent
BINARY_ADMIN := biway-admin

DIST_DIR      := dist
PANEL_DIR     := panel
STATIC_DIR    := internal/admin/api/static_files

VERSION     ?= $(shell git describe --tags --always --dirty)
COMMIT_HASH ?= $(shell git rev-parse HEAD)
VITE_API_URL ?= /api/v1

LDFLAGS := -X 'github.com/KybexOnline/biway/pkg/utils.Version=$(VERSION)' \
           -X 'github.com/KybexOnline/biway/pkg/utils.CommitHash=$(COMMIT_HASH)'

# OS/Arch targets to build for
PLATFORMS := linux/amd64 linux/arm64

# ==== Phony targets ====
.PHONY: all clean clean-panel frontend build checksums release

all: release

# Clean previous Go build artifacts
clean:
	rm -rf $(DIST_DIR)
	mkdir -p $(DIST_DIR)

# Clean previous frontend build output (dist + copied static files)
clean-panel:
	rm -rf $(PANEL_DIR)/dist
	rm -rf $(STATIC_DIR)
	mkdir -p $(STATIC_DIR)

# Build the management panel (Vite/React/etc) and copy it into the Go static dir
frontend: clean-panel
	@echo "Installing panel dependencies..."
	cd $(PANEL_DIR) && yarn install
	@echo "Building panel with VITE_API_URL=$(VITE_API_URL)..."
	cd $(PANEL_DIR) && env VITE_API_URL=$(VITE_API_URL) yarn run build
	@echo "Copying static files into $(STATIC_DIR)..."
	cp -r $(PANEL_DIR)/dist/* $(STATIC_DIR)/

# Build agent + admin binaries for every platform in PLATFORMS
# Depends on frontend so static files are embedded before compiling
build: frontend clean
	@for platform in $(PLATFORMS); do \
		GOOS=$$(echo $$platform | cut -d/ -f1); \
		GOARCH=$$(echo $$platform | cut -d/ -f2); \
		EXT=""; \
		if [ "$$GOOS" = "windows" ]; then EXT=".exe"; fi; \
		echo "Building agent for $$GOOS/$$GOARCH..."; \
		GOOS=$$GOOS GOARCH=$$GOARCH go build -ldflags="$(LDFLAGS)" \
			-o $(DIST_DIR)/$(BINARY_AGENT)-$$GOOS-$$GOARCH$$EXT ./cmd/agent; \
		echo "Building admin for $$GOOS/$$GOARCH..."; \
		GOOS=$$GOOS GOARCH=$$GOARCH go build -ldflags="$(LDFLAGS)" \
			-o $(DIST_DIR)/$(BINARY_ADMIN)-$$GOOS-$$GOARCH$$EXT ./cmd/admin; \
	done

# Generate a single checksums file for everything in dist/
checksums:
	@echo "Generating checksums..."
	cd $(DIST_DIR) && sha256sum * > checksums.txt
	@cat $(DIST_DIR)/checksums.txt

# Full release build: frontend + binaries + checksums
release: build checksums
	@echo "Release build complete. Contents of $(DIST_DIR):"
	@ls -la $(DIST_DIR)