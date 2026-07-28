#!/usr/bin/env bash
# Sync the generated public OpenAPI documents into this docs repo.
#
# Source of truth: product/openapi/gtm.openapi.public/services/<svc>/openapi.yaml
# (itself generated from the Zod MCP tool registry in product/mcp/gtm.mcp).
# The copies under api-reference/ must stay byte-identical to the source;
# never edit them here. Regenerate upstream, then re-run this script.
#
#   ./sync-openapi.sh          copy the three documents in
#   ./sync-openapi.sh --check  exit 1 if any copy drifts from the source
set -euo pipefail

DOCS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$DOCS_DIR/../../../product/openapi/gtm.openapi.public/services"
SERVICES=(linkedin id orchestration)

if [[ ! -d "$SRC_DIR" ]]; then
  echo "source not found: $SRC_DIR" >&2
  echo "this script expects the docs repo to live inside the gtm.ai monorepo" >&2
  exit 1
fi

mode="${1:-copy}"
rc=0
for svc in "${SERVICES[@]}"; do
  src="$SRC_DIR/$svc/openapi.yaml"
  dst="$DOCS_DIR/api-reference/$svc/openapi.yaml"
  if [[ "$mode" == "--check" ]]; then
    if ! diff -q "$src" "$dst" >/dev/null 2>&1; then
      echo "DRIFT: $dst does not match $src" >&2
      rc=1
    fi
  else
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst"
    echo "synced api-reference/$svc/openapi.yaml"
  fi
done

if [[ "$mode" == "--check" && $rc -eq 0 ]]; then
  echo "api-reference specs match gtm.openapi.public"
fi
exit $rc
