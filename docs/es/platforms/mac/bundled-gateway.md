---
read_when:
    - Empaquetado de OpenClaw.app
    - Depuración del servicio launchd del gateway de macOS
    - Instalar la CLI de Gateway para macOS
summary: Ejecución de Gateway en macOS (servicio launchd externo)
title: Gateway en macOS
x-i18n:
    generated_at: "2026-06-28T00:12:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5317e82435ecf179407116339507a666957a8e23a07a49665233b22f22f5b155
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app ya no incluye Node/Bun ni el tiempo de ejecución de Gateway. La app de macOS
espera una instalación **externa** de la CLI `openclaw`, no inicia Gateway como
proceso secundario y gestiona un servicio launchd por usuario para mantener Gateway
en ejecución (o se conecta a un Gateway local existente si ya hay uno en ejecución).

## Instalar la CLI (obligatorio para el modo local)

Node 24 es el tiempo de ejecución predeterminado en Mac. Node 22 LTS, actualmente `22.19+`, sigue funcionando por compatibilidad. Luego instala `openclaw` globalmente:

```bash
npm install -g openclaw@<version>
```

El botón **Instalar CLI** de la app de macOS ejecuta el mismo flujo de instalación global que la app
usa internamente: prefiere npm primero, luego pnpm y después bun si es el único
gestor de paquetes detectado. Node sigue siendo el tiempo de ejecución recomendado para Gateway.

## Launchd (Gateway como LaunchAgent)

Etiqueta:

- `ai.openclaw.gateway` (o `ai.openclaw.<profile>`; el heredado `com.openclaw.*` puede permanecer)

Ubicación del plist (por usuario):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (o `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Administrador:

- La app de macOS gestiona la instalación/actualización de LaunchAgent en modo local.
- La CLI también puede instalarlo: `openclaw gateway install`.

Comportamiento:

- "OpenClaw Activo" habilita/deshabilita LaunchAgent.
- Salir de la app **no** detiene el gateway (launchd lo mantiene activo).
- Si ya hay un Gateway en ejecución en el puerto configurado, la app se conecta a
  él en lugar de iniciar uno nuevo.

Registro:

- stdout de launchd: `~/Library/Logs/openclaw/gateway.log` (los perfiles usan `gateway-<profile>.log`)
- stderr de launchd: suprimido

## Compatibilidad de versiones

La app de macOS comprueba la versión del gateway con respecto a su propia versión. Si son
incompatibles, actualiza la CLI global para que coincida con la versión de la app.

## Directorio de estado en macOS

Mantén el estado de OpenClaw en un disco local, no sincronizado. Evita iCloud Drive y otras
carpetas sincronizadas con la nube porque la latencia de sincronización y los bloqueos de archivos pueden afectar las sesiones,
las credenciales y el estado de Gateway.

Establece `OPENCLAW_STATE_DIR` en una ruta local solo cuando necesites una anulación.
`openclaw doctor` advierte sobre rutas de estado comunes sincronizadas con la nube y recomienda
volver al almacenamiento local. Consulta
[variables de entorno](/es/help/environment#path-related-env-vars) y
[Doctor](/es/gateway/doctor).

## Depurar la conectividad de la app

Usa la CLI de depuración de macOS desde un checkout del código fuente para ejercitar la misma lógica de
handshake de WebSocket de Gateway y descubrimiento que usa la app:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` acepta `--url`, `--token`, `--timeout` y `--json`. `discover`
acepta `--timeout`, `--json` y `--include-local`. Compara la salida de descubrimiento
con `openclaw gateway discover --json` cuando necesites separar el descubrimiento de la CLI
de los problemas de conexión del lado de la app.

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
- [runbook de Gateway](/es/gateway)
