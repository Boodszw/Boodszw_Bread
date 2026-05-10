#!/usr/bin/env bash
set -euo pipefail
MSG=$(cat .tmp_message.txt)
exec ./notify "$MSG"
