---
read_when:
    - Empaquetar OpenClaw.app
    - Depurar el servicio launchd del gateway en macOS
    - Instalar la CLI del gateway para macOS
summary: Runtime del Gateway en macOS (servicio launchd externo)
title: Gateway en macOS
x-i18n:
    generated_at: "2026-04-24T05:38:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb98905712504fdf5085ec1c00c9e3f911e4005cd14b1472efdb7a5ec7189b5c
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

OpenClaw.app ya no incluye Node/Bun ni el runtime del Gateway. La app de macOS
espera una instalación **externa** de la CLI `openclaw`, no inicia el Gateway como
proceso hijo y gestiona un servicio launchd por usuario para mantener el Gateway
en ejecución (o se conecta a un Gateway local existente si ya hay uno en ejecución).

## Instalar la CLI (obligatorio para modo local)

Node 24 es el runtime predeterminado en Mac. Node 22 LTS, actualmente `22.14+`, sigue funcionando por compatibilidad. Después instala `openclaw` globalmente:

```bash
npm install -g openclaw@<version>
```

El botón **Install CLI** de la app de macOS ejecuta el mismo flujo de instalación global que la app
usa internamente: primero prefiere npm, luego pnpm y después bun si es el único
gestor de paquetes detectado. Node sigue siendo el runtime recomendado del Gateway.

## Launchd (Gateway como LaunchAgent)

Etiqueta:

- `ai.openclaw.gateway` (o `ai.openclaw.<profile>`; pueden permanecer etiquetas heredadas `com.openclaw.*`)

Ubicación del plist (por usuario):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (o `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gestor:

- La app de macOS es propietaria de la instalación/actualización del LaunchAgent en modo local.
- La CLI también puede instalarlo: `openclaw gateway install`.

Comportamiento:

- “OpenClaw Active” activa/desactiva el LaunchAgent.
- Cerrar la app **no** detiene el gateway (launchd lo mantiene vivo).
- Si ya hay un Gateway en ejecución en el puerto configurado, la app se conecta
  a él en lugar de iniciar uno nuevo.

Registros:

- stdout/err de launchd: `/tmp/openclaw/openclaw-gateway.log`

## Compatibilidad de versiones

La app de macOS comprueba la versión del gateway frente a su propia versión. Si son
incompatibles, actualiza la CLI global para que coincida con la versión de la app.

## Comprobación rápida

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Luego:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## Relacionado

- [App de macOS](/es/platforms/macos)
- [Runbook del Gateway](/es/gateway)
