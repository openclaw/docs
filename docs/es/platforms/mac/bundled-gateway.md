---
read_when:
    - Empaquetar OpenClaw.app
    - Depuración del servicio launchd del Gateway de macOS
    - Instalar la CLI del Gateway para macOS
summary: Ejecución de Gateway en macOS (servicio launchd externo)
title: Gateway en macOS
x-i18n:
    generated_at: "2026-07-04T06:23:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8b646f4cae43cb66acbf3527ef2af9ccaf4b6f2678a464586a110e5e9b3662
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app ya no incluye Node/Bun ni el runtime del Gateway. La app de macOS
espera una instalación **externa** de la CLI `openclaw`, no inicia el Gateway como
proceso hijo y gestiona un servicio launchd por usuario para mantener el Gateway
en ejecución (o se conecta a un Gateway local existente si ya hay uno en ejecución).

## Configuración automática

En un Mac nuevo, elige **Este Mac** durante la incorporación. La app ejecuta su
instalador firmado e incluido antes del asistente del Gateway, instala un runtime
de Node en espacio de usuario y la CLI `openclaw` correspondiente en `~/.openclaw`,
y luego instala e inicia el servicio launchd por usuario. Esta ruta no requiere
Terminal, Homebrew ni acceso de administrador.

La app incluye el script del instalador, no la carga útil de Node ni del Gateway.
Por lo tanto, la configuración necesita una conexión a internet para descargar el
runtime y el paquete de OpenClaw correspondiente.

## Recuperación manual

Se recomienda Node 24 para una instalación manual. Node 22 LTS, actualmente `22.19+`,
también funciona. Luego instala `openclaw` globalmente:

```bash
npm install -g openclaw@<version>
```

Usa **Reintentar configuración** después de una configuración automática fallida. Si aun así falla, instala
la CLI manualmente con el comando anterior y luego elige **Comprobar de nuevo** en
la incorporación. Node sigue siendo el runtime recomendado para el Gateway.

## Launchd (Gateway como LaunchAgent)

Etiqueta:

- `ai.openclaw.gateway` (o `ai.openclaw.<profile>`; el legado `com.openclaw.*` puede permanecer)

Ubicación del plist (por usuario):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (o `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gestor:

- La app de macOS controla la instalación/actualización del LaunchAgent en modo local.
- La CLI también puede instalarlo: `openclaw gateway install`.

Comportamiento:

- "OpenClaw Active" habilita/deshabilita el LaunchAgent.
- Salir de la app **no** detiene el gateway (launchd lo mantiene activo).
- Si ya hay un Gateway en ejecución en el puerto configurado, la app se conecta a
  él en lugar de iniciar uno nuevo.

Registro:

- stdout de launchd: `~/Library/Logs/openclaw/gateway.log` (los perfiles usan `gateway-<profile>.log`)
- stderr de launchd: suprimido

## Compatibilidad de versiones

La app de macOS comprueba la versión del Gateway frente a su propia versión. La incorporación
ejecuta automáticamente la configuración gestionada cuando falta una CLI existente o
es incompatible. Usa **Reintentar configuración** para repetir la instalación o **Comprobar de nuevo**
después de reparar una CLI externa.

## Directorio de estado en macOS

Mantén el estado de OpenClaw en un disco local no sincronizado. Evita iCloud Drive y otras
carpetas sincronizadas con la nube porque la latencia de sincronización y los bloqueos de archivos pueden afectar las sesiones,
las credenciales y el estado del Gateway.

Configura `OPENCLAW_STATE_DIR` con una ruta local solo cuando necesites una anulación.
`openclaw doctor` advierte sobre rutas de estado comunes sincronizadas con la nube y recomienda
volver al almacenamiento local. Consulta
[variables de entorno](/es/help/environment#path-related-env-vars) y
[Doctor](/es/gateway/doctor).

## Depurar la conectividad de la app

Usa la CLI de depuración de macOS desde un checkout de código fuente para ejercitar el mismo protocolo de enlace
WebSocket del Gateway y la misma lógica de descubrimiento que usa la app:

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
- [Runbook del Gateway](/es/gateway)
