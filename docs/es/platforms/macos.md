---
read_when:
    - Implementar funciones de la app para macOS
    - Cambiar el ciclo de vida del gateway o el puente de nodos en macOS
summary: Aplicación complementaria de OpenClaw para macOS (barra de menús + broker de Gateway)
title: app de macOS
x-i18n:
    generated_at: "2026-06-27T12:04:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e637a1ae5ca66dfb6255fb6a233436ae0cf04b972f96446e8dc3d703486c9fa
    source_path: platforms/macos.md
    workflow: 16
---

La app de macOS es el **compañero de la barra de menús** para OpenClaw. Es propietaria de los permisos,
gestiona/se adjunta al Gateway localmente (launchd o manual) y expone las
capacidades de macOS al agente como un Node.

## Qué hace

- Muestra notificaciones nativas y estado en la barra de menús.
- Es propietaria de las solicitudes de TCC (Notificaciones, Accesibilidad, Grabación de pantalla, Micrófono,
  Reconocimiento de voz, Automatización/AppleScript).
- Ejecuta o se conecta al Gateway (local o remoto).
- Expone herramientas exclusivas de macOS (Canvas, Cámara, Grabación de pantalla, `system.run`).
- Inicia el servicio de host de Node local en modo **remoto** (launchd) y lo detiene en modo **local**.
- Opcionalmente aloja **PeekabooBridge** para automatización de UI.
- Instala la CLI global (`openclaw`) bajo demanda mediante npm, pnpm o bun (la app prefiere npm, luego pnpm y luego bun; Node sigue siendo el runtime recomendado para Gateway).

## Modo local frente a remoto

- **Local** (predeterminado): la app se adjunta a un Gateway local en ejecución si existe;
  de lo contrario, habilita el servicio launchd mediante `openclaw gateway install`.
- **Remoto**: la app se conecta a un Gateway por SSH/Tailscale y nunca inicia
  un proceso local.
  La app inicia el **servicio de host de Node** local para que el Gateway remoto pueda llegar a este Mac.
  La app no genera el Gateway como proceso secundario.
  El descubrimiento de Gateway ahora prefiere nombres Tailscale MagicDNS sobre IPs de tailnet sin procesar,
  por lo que la app de Mac se recupera con más fiabilidad cuando cambian las IPs de tailnet.

## Control de launchd

La app gestiona un LaunchAgent por usuario etiquetado como `ai.openclaw.gateway`
(o `ai.openclaw.<profile>` cuando se usa `--profile`/`OPENCLAW_PROFILE`; el legado `com.openclaw.*` aún se descarga).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Reemplaza la etiqueta por `ai.openclaw.<profile>` cuando ejecutes un perfil con nombre.

Si el LaunchAgent no está instalado, habilítalo desde la app o ejecuta
`openclaw gateway install`.

Si el gateway desaparece repetidamente durante minutos u horas y solo se reanuda cuando tocas la UI de Control o entras por SSH al host, consulta la nota de solución de problemas sobre Suspensión de mantenimiento de macOS / fallos `ENETDOWN` y la compuerta de protección contra reinicio de launchd en [solución de problemas de Gateway](/es/gateway/troubleshooting#macos-gateway-silently-stops-responding-then-resumes-when-you-touch-the-dashboard).

## Capacidades de Node (mac)

La app de macOS se presenta como un Node. Comandos comunes:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Cámara: `camera.snap`, `camera.clip`
- Pantalla: `screen.snapshot`, `screen.record`
- Sistema: `system.run`, `system.notify`

El Node informa un mapa `permissions` para que los agentes puedan decidir qué está permitido.

Servicio de Node + IPC de app:

- Cuando el servicio host de Node sin interfaz está en ejecución (modo remoto), se conecta al Gateway WS como un Node.
- `system.run` se ejecuta en la app de macOS (contexto UI/TCC) sobre un socket Unix local; las solicitudes + la salida permanecen dentro de la app.

Diagrama (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Aprobaciones de ejecución (system.run)

`system.run` está controlado por **Aprobaciones de ejecución** en la app de macOS (Configuración → Aprobaciones de ejecución).
La seguridad + solicitud + lista de permitidos se almacenan localmente en el Mac en:

```
~/.openclaw/exec-approvals.json
```

Ejemplo:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

Notas:

- Las entradas de `allowlist` son patrones glob para rutas binarias resueltas, o nombres de comandos simples para comandos invocados por PATH.
- El texto de comando shell sin procesar que contiene control de shell o sintaxis de expansión (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) se trata como una ausencia en la lista de permitidos y requiere aprobación explícita (o agregar el binario del shell a la lista de permitidos).
- Elegir "Permitir siempre" en la solicitud agrega ese comando a la lista de permitidos.
- Las anulaciones de entorno de `system.run` se filtran (descartan `PATH`, `DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`) y luego se fusionan con el entorno de la app.
- Para envoltorios de shell (`bash|sh|zsh ... -c/-lc`), las anulaciones de entorno de alcance de solicitud se reducen a una pequeña lista explícita de permitidos (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisiones de permitir siempre en modo de lista de permitidos, los envoltorios de despacho conocidos (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) persisten rutas de ejecutables internos en lugar de rutas de envoltorios. Si desenvolver no es seguro, no se persiste automáticamente ninguna entrada de lista de permitidos.

## Enlaces profundos

La app registra el esquema de URL `openclaw://` para acciones locales.

### `openclaw://agent`

Activa una solicitud `agent` de Gateway.
__OC_I18N_900004__
Parámetros de consulta:

- `message` (obligatorio)
- `sessionKey` (opcional)
- `thinking` (opcional)
- `deliver` / `to` / `channel` (opcional)
- `timeoutSeconds` (opcional)
- `key` (clave opcional de modo sin supervisión)

Seguridad:

- Sin `key`, la app solicita confirmación.
- Sin `key`, la app aplica un límite breve de mensaje para la solicitud de confirmación e ignora `deliver` / `to` / `channel`.
- Con una `key` válida, la ejecución no tiene supervisión (pensada para automatizaciones personales).

## Flujo de incorporación (típico)

1. Instala e inicia **OpenClaw.app**.
2. Completa la lista de comprobación de permisos (solicitudes de TCC).
3. Asegúrate de que el modo **Local** esté activo y que el Gateway esté en ejecución.
4. Instala la CLI si quieres acceso desde la terminal.

## Ubicación del directorio de estado (macOS)

Evita poner tu directorio de estado de OpenClaw en iCloud u otras carpetas sincronizadas con la nube.
Las rutas respaldadas por sincronización pueden agregar latencia y ocasionalmente causar carreras de bloqueo/sincronización de archivos para
sesiones y credenciales.

Prefiere una ruta de estado local no sincronizada, como:
__OC_I18N_900005__
Si `openclaw doctor` detecta estado bajo:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

avisará y recomendará volver a una ruta local.

## Flujo de build y desarrollo (nativo)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (o Xcode)
- Empaquetar app: `scripts/package-mac-app.sh`

## Depurar conectividad de gateway (CLI de macOS)

Usa la CLI de depuración para ejercitar el mismo handshake de WebSocket de Gateway y la misma lógica de descubrimiento
que usa la app de macOS, sin iniciar la app.
__OC_I18N_900006__
Opciones de conexión:

- `--url <ws://host:port>`: anular configuración
- `--mode <local|remote>`: resolver desde la configuración (predeterminado: configuración o local)
- `--probe`: forzar una nueva sonda de salud
- `--timeout <ms>`: tiempo de espera de solicitud (predeterminado: `15000`)
- `--json`: salida estructurada para comparar diferencias

Opciones de descubrimiento:

- `--include-local`: incluir gateways que se filtrarían como "locales"
- `--timeout <ms>`: ventana general de descubrimiento (predeterminado: `2000`)
- `--json`: salida estructurada para comparar diferencias

<Tip>
Compara con `openclaw gateway discover --json` para ver si la canalización de descubrimiento de la app de macOS (`local.` más el dominio de área amplia configurado, con fallbacks de área amplia y Tailscale Serve) difiere del descubrimiento basado en `dns-sd` de la CLI de Node.
</Tip>

## Plomería de conexión remota (túneles SSH)

Cuando la app de macOS se ejecuta en modo **Remoto**, abre un túnel SSH para que los componentes de UI locales
puedan hablar con un Gateway remoto como si estuviera en localhost.

### Túnel de control (puerto WebSocket de Gateway)

- **Propósito:** comprobaciones de salud, estado, Chat web, configuración y otras llamadas del plano de control.
- **Puerto local:** el puerto de Gateway (predeterminado `18789`), siempre estable.
- **Puerto remoto:** el mismo puerto de Gateway en el host remoto.
- **Comportamiento:** sin puerto local aleatorio; la app reutiliza un túnel saludable existente
  o lo reinicia si es necesario.
- **Forma SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` con BatchMode +
  ExitOnForwardFailure + opciones keepalive.
- **Informe de IP:** el túnel SSH usa loopback, por lo que el gateway verá la IP del Node
  como `127.0.0.1`. Usa el transporte **Directo (ws/wss)** si quieres que aparezca la IP real del cliente
  (consulta [acceso remoto de macOS](/es/platforms/mac/remote)).

Para pasos de configuración, consulta [acceso remoto de macOS](/es/platforms/mac/remote). Para detalles del protocolo,
consulta [protocolo de Gateway](/es/gateway/protocol).

## Documentos relacionados

- [Runbook de Gateway](/es/gateway)
- [Gateway (macOS)](/es/platforms/mac/bundled-gateway)
- [Permisos de macOS](/es/platforms/mac/permissions)
- [Canvas](/es/platforms/mac/canvas)
