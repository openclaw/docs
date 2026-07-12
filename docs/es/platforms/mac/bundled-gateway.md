---
read_when:
    - Empaquetado de OpenClaw.app
    - Depuración del servicio launchd del Gateway en macOS
    - Instalación de la CLI del Gateway para macOS
summary: Entorno de ejecución del Gateway en macOS (servicio launchd externo)
title: Gateway en macOS
x-i18n:
    generated_at: "2026-07-12T14:38:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e6a871678fcbc617cb87dc4f0610419187a0b67cea7105e02a6cde70d44e85f3
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app no incluye Node/Bun ni el entorno de ejecución del Gateway. La aplicación para macOS
requiere una instalación **externa** de la CLI `openclaw`, no inicia el Gateway como
proceso secundario y administra un servicio launchd por usuario para mantener el Gateway
en ejecución (o se conecta a un Gateway local que ya esté en ejecución).

## Configuración automática

En un Mac nuevo, seleccione **This Mac** durante la incorporación. La aplicación ejecuta su
script de instalación firmado e incluido antes del asistente del Gateway: instala un
entorno de ejecución de Node en el espacio del usuario y la CLI `openclaw` correspondiente en `~/.openclaw`;
después instala e inicia el servicio launchd por usuario. Esta opción no requiere
Terminal, Homebrew ni acceso de administrador.

La aplicación solo incluye el script de instalación, no los componentes de Node ni del Gateway;
la configuración necesita una conexión a Internet para descargar el entorno de ejecución y el paquete
de OpenClaw correspondiente.

## Recuperación manual

Se recomienda Node 24 para una instalación manual; Node 22.19+ también funciona. Instale
`openclaw` globalmente:

```bash
npm install -g openclaw@<version>
```

Use **Retry setup** después de que falle la configuración automática. Si continúa fallando,
instale manualmente la CLI con el comando anterior y seleccione **Check again**
durante la incorporación.

## Launchd (Gateway como LaunchAgent)

Etiqueta: `ai.openclaw.gateway` (perfil predeterminado) o `ai.openclaw.<profile>`
para un perfil con nombre.

Ubicación del plist (por usuario): `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
(o `ai.openclaw.<profile>.plist`).

La aplicación para macOS controla la instalación y actualización del LaunchAgent para el perfil predeterminado en
el modo Local. La CLI también puede instalarlo directamente: `openclaw gateway install`
(los perfiles con nombre se seleccionan mediante la variable de entorno `OPENCLAW_PROFILE`).

Comportamiento:

- "OpenClaw Active" activa o desactiva el LaunchAgent.
- Cerrar la aplicación **no** detiene el Gateway (launchd lo mantiene en ejecución).
- Si ya hay un Gateway en ejecución en el puerto configurado, la aplicación se conecta a
  él en lugar de iniciar uno nuevo.

Registros:

- stdout de launchd: `~/Library/Logs/openclaw/gateway.log` (los perfiles usan
  `gateway-<profile>.log`)
- stderr de launchd: suprimido
- Si el host entra en un bucle con errores `EADDRINUSE` repetidos o reinicios rápidos, compruebe si existen
  LaunchAgents `ai.openclaw.gateway` / `ai.openclaw.node` duplicados y consulte la
  solución alternativa del marcador de launchd en
  [solución de problemas del Gateway](/es/gateway/troubleshooting#macos-launchd-supervisor-loop-with-duplicate-gatewaynode-launchagents).

## Compatibilidad de versiones

La aplicación para macOS compara la versión del Gateway con su propia versión. La incorporación
ejecuta automáticamente la configuración administrada cuando falta una CLI existente o esta es
incompatible. Use **Retry setup** para repetir la instalación o **Check again**
después de reparar una CLI externa.

## Directorio de estado en macOS

Mantenga el estado de OpenClaw en un disco local no sincronizado. Evite iCloud Drive y otras
carpetas sincronizadas con la nube; la latencia de sincronización y los bloqueos de archivos pueden afectar a las sesiones,
las credenciales y el estado del Gateway.

Establezca `OPENCLAW_STATE_DIR` en una ruta local solo cuando necesite sobrescribirla.
`openclaw doctor` advierte sobre las rutas de estado habituales sincronizadas con la nube y recomienda
volver a mover los datos al almacenamiento local. Consulte
[variables de entorno](/es/help/environment#path-related-env-vars) y
[Doctor](/es/gateway/doctor).

## Depurar la conectividad de la aplicación

Use la CLI de depuración de macOS desde un checkout del código fuente para probar el mismo protocolo de enlace
WebSocket y la misma lógica de detección del Gateway que utiliza la aplicación:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` acepta `--url`, `--token`, `--timeout`, `--probe` y `--json`
(además de opciones para sobrescribir la identidad del cliente; ejecútelo con `--help` para ver la lista completa).
`discover` acepta `--timeout`, `--json` y `--include-local`. Compare
el resultado de la detección con `openclaw gateway discover --json` cuando necesite
distinguir los problemas de detección de la CLI de los problemas de conexión de la aplicación.

## Comprobación rápida

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

A continuación:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## Contenido relacionado

- [aplicación para macOS](/es/platforms/macos)
- [guía operativa del Gateway](/es/gateway)
