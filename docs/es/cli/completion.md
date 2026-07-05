---
read_when:
    - Quieres autocompletado de shell para zsh/bash/fish/PowerShell
    - Debes almacenar en caché los scripts de completado en el estado de OpenClaw
summary: Referencia de la CLI para `openclaw completion` (generar/instalar scripts de completado de shell)
title: Finalización
x-i18n:
    generated_at: "2026-07-05T11:08:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

Genera scripts de autocompletado para la shell, los almacena en caché bajo el estado de OpenClaw y, opcionalmente, los instala en tu perfil de shell.

## Uso

```bash
openclaw completion                          # print zsh script to stdout
openclaw completion --shell fish             # print fish script
openclaw completion --write-state            # cache scripts for all shells
openclaw completion --write-state --install  # cache, then install in one step
openclaw completion --shell bash --write-state
```

## Opciones

- `-s, --shell <shell>`: shell de destino (`zsh`, `bash`, `powershell`, `fish`; predeterminado: `zsh`)
- `-i, --install`: instala el autocompletado agregando una línea de origen para el script en caché a tu perfil de shell
- `--write-state`: escribe los scripts de autocompletado en `$OPENCLAW_STATE_DIR/completions` (predeterminado `~/.openclaw/completions`) sin imprimir en stdout; con `--shell` escribe solo esa shell; de lo contrario, las cuatro
- `-y, --yes`: omite las solicitudes de confirmación de instalación (no interactivo)

## Flujo de instalación

`--install` apunta tu perfil al script en caché, por lo que la caché debe existir primero: si falta, el comando falla y te indica que ejecutes `openclaw completion --write-state`. Combina `--write-state --install` para hacer ambas cosas en un solo paso. Sin `--shell`, `--install` detecta la shell desde `$SHELL` (con zsh como alternativa).

La instalación escribe un pequeño bloque `# OpenClaw Completion` en tu perfil de shell y reemplaza cualquier línea antigua y lenta `source <(openclaw completion ...)` por la línea de origen en caché:

| Shell      | Perfil                                                                                                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bash       | `~/.bashrc` (usa `~/.bash_profile` como alternativa cuando falta `~/.bashrc`)                                                                                                             |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                              |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1` (en Windows: `Documents/PowerShell/Microsoft.PowerShell_profile.ps1`, o `Documents/WindowsPowerShell/...` para Windows PowerShell) |
| zsh        | `~/.zshrc`                                                                                                                                                                                |

## Notas

- Sin `--install` ni `--write-state`, el comando imprime el script en stdout.
- La generación de autocompletado carga de inmediato todo el árbol de comandos, incluidos los comandos CLI de Plugin, por lo que se incluyen los subcomandos anidados.
- `openclaw update` actualiza automáticamente la caché de autocompletado después de una actualización correcta; `openclaw doctor` puede reparar configuraciones de autocompletado ausentes u obsoletas.

## Relacionado

- [Referencia de CLI](/es/cli)
