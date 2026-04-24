---
read_when:
    - Quieres autocompletados del shell para zsh/bash/fish/PowerShell
    - Necesitas almacenar en caché scripts de autocompletado en el estado de OpenClaw
summary: Referencia de la CLI para `openclaw completion` (generar/instalar scripts de autocompletado del shell)
title: Autocompletado
x-i18n:
    generated_at: "2026-04-24T05:22:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d064723b97f09105154197e4ef35b98ccb61e4b775f3fd990b18958f751f713
    source_path: cli/completion.md
    workflow: 15
---

# `openclaw completion`

Genera scripts de autocompletado del shell y, opcionalmente, los instala en el perfil de tu shell.

## Uso

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## Opciones

- `-s, --shell <shell>`: destino del shell (`zsh`, `bash`, `powershell`, `fish`; predeterminado: `zsh`)
- `-i, --install`: instala el autocompletado añadiendo una línea `source` a tu perfil de shell
- `--write-state`: escribe los scripts de autocompletado en `$OPENCLAW_STATE_DIR/completions` sin imprimirlos en stdout
- `-y, --yes`: omite las solicitudes de confirmación de instalación

## Notas

- `--install` escribe un pequeño bloque "OpenClaw Completion" en el perfil de tu shell y lo apunta al script almacenado en caché.
- Sin `--install` ni `--write-state`, el comando imprime el script en stdout.
- La generación de autocompletado carga de forma anticipada los árboles de comandos para incluir subcomandos anidados.

## Relacionado

- [Referencia de la CLI](/es/cli)
