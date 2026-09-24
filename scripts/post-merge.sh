#!/usr/bin/env bash
set -euo pipefail

# Reconcile dependencies after isolated task changes; never alter the lockfile here.
CI=true pnpm install --frozen-lockfile

# The root build still references template libraries absent from this workspace.
# Check and build the artifact that actually exists, then refresh its language builds.
pnpm --filter @workspace/the-fine-line run typecheck
pnpm --filter @workspace/the-fine-line run build
pnpm --filter @workspace/the-fine-line run build:languages