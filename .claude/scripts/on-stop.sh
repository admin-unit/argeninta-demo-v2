#!/bin/bash
# Corre en el evento Stop de Claude Code.
# Registra la fecha/hora de la última actividad y estado básico del directorio.

CONTEXT_FILE="/home/kenpias/unit/argeninta/demo/CONTEXT.md"
LOG_FILE="/home/kenpias/unit/argeninta/demo/.claude/session.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Registrar en session.log
echo "[$TIMESTAMP] Claude session activity" >> "$LOG_FILE"

# Si CONTEXT.md existe, actualizar solo la línea de "Última actualización"
if [ -f "$CONTEXT_FILE" ]; then
  sed -i "s/^\*\*Última actualización:\*\*.*/\*\*Última actualización:\*\* $TIMESTAMP (auto)/" "$CONTEXT_FILE"
fi
