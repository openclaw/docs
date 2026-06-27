---
read_when:
    - Empaquetado de OpenClaw.app
    - Depuración del servicio launchd del Gateway de macOS
    - Instalar la CLI del Gateway para macOS
summary: Entorno de ejecución de Gateway en macOS (servicio launchd externo)
title: Gateway en macOS
x-i18n:
    generated_at: "2026-06-27T12:02:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c55e3d24e5bc743233e11be4897f4f2a865c97f2e0d795a472caeb6d097d34
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app ya no incluye Node/Bun ni el entorno de ejecución de Gateway. La app de macOS
espera una instalación **externa** de la CLI `openclaw`, no inicia Gateway como
proceso hijo y administra un servicio launchd por usuario para mantener Gateway
en ejecución (o se conecta a un Gateway local existente si ya hay uno en ejecución).

## Instalar la CLI (obligatorio para el modo local)

Node 24 es el entorno de ejecución predeterminado en Mac. Node 22 LTS, actualmente `22.19+`, sigue funcionando por compatibilidad. Luego instala `openclaw` globalmente:

```bash
npm install -g openclaw@<version>
```

El botón **Instalar CLI** de la app de macOS ejecuta el mismo flujo de instalación global que la app
usa internamente: prefiere npm primero, luego pnpm y luego bun si ese es el único
gestor de paquetes detectado. Node sigue siendo el entorno de ejecución recomendado para Gateway.

## Launchd (Gateway como LaunchAgent)

Etiqueta:

- `ai.openclaw.gateway` (o `ai.openclaw.<profile>`; el heredado `com.openclaw.*` puede permanecer)

Ubicación del plist (por usuario):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (o `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gestor:

- La app de macOS se encarga de instalar/actualizar LaunchAgent en modo local.
- La CLI también puede instalarlo: `openclaw gateway install`.

Comportamiento:

- "OpenClaw Active" activa/desactiva LaunchAgent.
- Salir de la app **no** detiene el gateway (launchd lo mantiene activo).
- Si ya hay un Gateway en ejecución en el puerto configurado, la app se conecta a
  él en lugar de iniciar uno nuevo.

Registro:

- stdout de launchd: `~/Library/Logs/openclaw/gateway.log` (los perfiles usan `gateway-<profile>.log`)
- stderr de launchd: suprimido

## Compatibilidad de versiones

La app de macOS comprueba la versión del gateway con respecto a su propia versión. Si son
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

- [app de macOS](/es/platforms/macos)
- [Runbook de Gateway](/es/gateway)
