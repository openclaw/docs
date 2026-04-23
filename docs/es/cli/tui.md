---
read_when:
    - Quieres una interfaz de terminal para el Gateway (compatible con acceso remoto)
    - Quieres pasar url/token/session desde scripts
    - Quieres ejecutar la TUI en modo integrado local sin un Gateway
    - Quieres usar openclaw chat o openclaw tui --local
summary: Referencia de CLI para `openclaw tui` (interfaz de terminal integrada local o respaldada por Gateway)
title: TUI
x-i18n:
    generated_at: "2026-04-23T14:02:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4fca025a15f5e985ca6f2eaf39fcbe784bd716f24841f43450b71936db26d141
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Abre la interfaz de terminal conectada al Gateway, o ejecútala en modo integrado
local.

Relacionado:

- Guía de TUI: [TUI](/es/web/tui)

Notas:

- `chat` y `terminal` son alias de `openclaw tui --local`.
- `--local` no puede combinarse con `--url`, `--token` ni `--password`.
- `tui` resuelve SecretRefs de autenticación del Gateway configurados para autenticación por token/contraseña cuando es posible (proveedores `env`/`file`/`exec`).
- Cuando se inicia desde dentro de un directorio de espacio de trabajo de agente configurado, TUI selecciona automáticamente ese agente como valor predeterminado de la clave de sesión (a menos que `--session` sea explícitamente `agent:<id>:...`).
- El modo local usa directamente el entorno de ejecución integrado del agente. La mayoría de las herramientas locales funcionan, pero las funciones exclusivas del Gateway no están disponibles.
- El modo local añade `/auth [provider]` dentro de la superficie de comandos de la TUI.
- Las puertas de aprobación del Plugin siguen aplicándose en modo local. Las herramientas que requieren aprobación solicitan una decisión en el terminal; nada se aprueba automáticamente de forma silenciosa porque el Gateway no participa.

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

Usa el modo local cuando la configuración actual ya valida y quieres que el
agente integrado la inspeccione, la compare con la documentación y ayude a repararla
desde el mismo terminal:

Si `openclaw config validate` ya está fallando, usa primero `openclaw configure` o
`openclaw doctor --fix`. `openclaw chat` no omite la protección frente a
configuración no válida.

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

Aplica correcciones específicas con `openclaw config set` o `openclaw configure`, y luego
vuelve a ejecutar `openclaw config validate`. Consulta [TUI](/es/web/tui) y [Config](/es/cli/config).
