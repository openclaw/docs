---
read_when:
    - Quieres una TUI para el Gateway (compatible con acceso remoto)
    - Quieres pasar url/token/session desde scripts
    - Quieres ejecutar la TUI en modo integrado local sin Gateway
    - Quieres usar openclaw chat o openclaw tui --local
summary: Referencia de la CLI para `openclaw tui` (interfaz de terminal integrada local o respaldada por Gateway)
title: TUI
x-i18n:
    generated_at: "2026-04-24T05:24:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3b3d337c55411fbcbae3bda85d9ca8d0f1b2a4224b5d4c9bbc5f96c41c5363c
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Abre la interfaz de terminal conectada al Gateway o la ejecuta en modo
integrado local.

Relacionado:

- Guía de TUI: [TUI](/es/web/tui)

Notas:

- `chat` y `terminal` son alias de `openclaw tui --local`.
- `--local` no puede combinarse con `--url`, `--token` ni `--password`.
- `tui` resuelve SecretRefs de autenticación del Gateway configurados para autenticación por token/contraseña cuando es posible (proveedores `env`/`file`/`exec`).
- Cuando se inicia desde dentro de un directorio de espacio de trabajo de agente configurado, la TUI selecciona automáticamente ese agente para el valor predeterminado de la clave de sesión (a menos que `--session` sea explícitamente `agent:<id>:...`).
- El modo local usa directamente el runtime integrado del agente. La mayoría de las herramientas locales funcionan, pero las funciones exclusivas del Gateway no están disponibles.
- El modo local añade `/auth [provider]` dentro de la superficie de comandos de la TUI.
- Las barreras de aprobación de Plugins siguen aplicándose en modo local. Las herramientas que requieren aprobación solicitan una decisión en la terminal; nada se aprueba automáticamente de forma silenciosa porque el Gateway no interviene.

## Ejemplos

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## Bucle de reparación de configuración

Usa el modo local cuando la configuración actual ya es válida y quieras que el
agente integrado la inspeccione, la compare con la documentación y ayude a repararla
desde la misma terminal:

Si `openclaw config validate` ya está fallando, usa primero `openclaw configure` o
`openclaw doctor --fix`. `openclaw chat` no omite la protección contra configuración
inválida.

```bash
openclaw chat
```

Luego, dentro de la TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Aplica correcciones concretas con `openclaw config set` o `openclaw configure`, y luego
vuelve a ejecutar `openclaw config validate`. Consulta [TUI](/es/web/tui) y [Config](/es/cli/config).

## Relacionado

- [Referencia de la CLI](/es/cli)
- [TUI](/es/web/tui)
