FROM debian:12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates sqlite3 \
    && rm -rf /var/lib/apt/lists/*

ARG TARGETARCH
COPY dist/biway-admin-linux-${TARGETARCH} /usr/local/bin/biway-admin
RUN chmod +x /usr/local/bin/biway-admin


# ---- Non-secret runtime variables (safe to declare defaults) ----
ENV BIWAY_ENV=production
ENV BIWAY_PRIVATE_CIDR=10.35.0.0/24
ENV BIWAY_ALLOW_ORIGINS=*
ENV BIWAY_LISTEN=0.0.0.0
ENV BIWAY_PORT=8500
ENV BIWAY_DB_PATH=/data/biway.sqlite

# BIWAY_JWT_SECRET is intentionally NOT declared here.
# Per the docs, if unset the app auto-generates one at runtime.
# Users who want a fixed/persistent secret must supply it via
# `docker run -e BIWAY_JWT_SECRET=...` or a secrets manager — never baked into the image.


VOLUME ["/data"]
EXPOSE 8500

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]