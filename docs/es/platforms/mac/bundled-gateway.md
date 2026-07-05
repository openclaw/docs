---
read_when:
    - Empaquetar OpenClaw.app
    - Depuración del servicio launchd del gateway de macOS
    - Instalar la CLI de Gateway para macOS
summary: Ejecución del Gateway en macOS (servicio launchd externo)
title: Gateway en macOS
x-i18n:
    generated_at: "2026-07-05T11:26:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1637aaf009383045ce25c0c13d8b39223ea08d5d26b9fa376d2c97f0030c9eb
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app no incluye Node/Bun ni el runtime de Gateway. La app de macOS
espera una instalación **externa** de la CLI `openclaw`, no inicia Gateway como
un proceso hijo y administra un servicio launchd por usuario para mantener
Gateway en ejecución (o se conecta a un Gateway local que ya esté en ejecución).

## Configuración automática

En un Mac nuevo, elige **Este Mac** durante la incorporación. La app ejecuta su
script instalador firmado e incluido antes del asistente de Gateway: instala un
runtime de Node en el espacio de usuario y la CLI `openclaw` correspondiente en
`~/.openclaw`, luego instala e inicia el servicio launchd por usuario. Esta ruta
no necesita Terminal, Homebrew ni acceso de administrador.

La app incluye solo el script instalador, no la carga útil de Node ni de Gateway;
la configuración necesita una conexión a internet para descargar el runtime y el
paquete de OpenClaw correspondiente.

## Recuperación manual

Se recomienda Node 24 para una instalación manual; Node 22.19+ también funciona.
Instala `openclaw` globalmente:

```bash
npm install -g openclaw@<version>
```

Usa **Reintentar configuración** después de una configuración automática fallida.
Si eso aún falla, instala la CLI manualmente con el comando anterior y luego
elige **Comprobar de nuevo** en la incorporación.

## Launchd (Gateway como LaunchAgent)

Etiqueta: `ai.openclaw.gateway` (perfil predeterminado), o
`ai.openclaw.<profile>` para un perfil con nombre.

Ubicación del plist (por usuario): `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
(o `ai.openclaw.<profile>.plist`).

La app de macOS se encarga de la instalación/actualización de LaunchAgent para
el perfil predeterminado en modo local. La CLI también puede instalarlo
directamente: `openclaw gateway install` (los perfiles con nombre se seleccionan
mediante la variable de entorno `OPENCLAW_PROFILE`).

Comportamiento:

- "OpenClaw activo" activa/desactiva el LaunchAgent.
- Salir de la app **no** detiene Gateway (launchd lo mantiene activo).
- Si ya hay un Gateway en ejecución en el puerto configurado, la app se conecta
  a él en lugar de iniciar uno nuevo.

Registro:

- stdout de launchd: `~/Library/Logs/openclaw/gateway.log` (los perfiles usan
  `gateway-<profile>.log`)
- stderr de launchd: suprimido

## Compatibilidad de versiones

La app de macOS comprueba la versión de Gateway frente a su propia versión. La
incorporación ejecuta automáticamente la configuración administrada cuando falta
una CLI existente o es incompatible. Usa **Reintentar configuración** para
repetir la instalación, o **Comprobar de nuevo** después de reparar una CLI
externa.

## Directorio de estado en macOS

Mantén el estado de OpenClaw en un disco local no sincronizado. Evita iCloud Drive
y otras carpetas sincronizadas en la nube; la latencia de sincronización y los
bloqueos de archivos pueden afectar a las sesiones, las credenciales y el estado
de Gateway.

Configura `OPENCLAW_STATE_DIR` en una ruta local solo cuando necesites una
anulación. `openclaw doctor` advierte sobre rutas de estado comunes sincronizadas
en la nube y recomienda volver al almacenamiento local. Consulta
[variables de entorno](/es/help/environment#path-related-env-vars) y
[Doctor](/es/gateway/doctor).

## Depurar la conectividad de la app

Usa la CLI de depuración de macOS desde un checkout de código fuente para
ejercitar el mismo protocolo de enlace WebSocket de Gateway y la misma lógica de
descubrimiento que usa la app:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` acepta `--url`, `--token`, `--timeout`, `--probe` y `--json`
(además de anulaciones de identidad de cliente; ejecútalo con `--help` para ver
la lista completa). `discover` acepta `--timeout`, `--json` e `--include-local`.
Compara la salida de descubrimiento con `openclaw gateway discover --json`
cuando necesites separar el descubrimiento de la CLI de los problemas de conexión
del lado de la app.

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
