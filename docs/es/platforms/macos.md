---
read_when:
    - Implementación de funciones de la aplicación de macOS
    - Cambiar el ciclo de vida del Gateway o el puente de nodos en macOS
summary: Aplicación complementaria para macOS de OpenClaw (barra de menús + intermediario de Gateway)
title: aplicación de macOS
x-i18n:
    generated_at: "2026-04-30T05:50:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ed98cd4865f2117728d4349c9be99d9c2e20f4d86a77c80f5ba0b5520eb81cd
    source_path: platforms/macos.md
    workflow: 16
---

La app de macOS es la **compañera de la barra de menús** de OpenClaw. Es dueña de los permisos,
gestiona/se adjunta al Gateway localmente (launchd o manual) y expone las
capacidades de macOS al agente como un Node.

## Qué hace

- Muestra notificaciones nativas y estado en la barra de menús.
- Es dueña de los avisos de TCC (Notificaciones, Accesibilidad, Grabación de pantalla, Micrófono,
  Reconocimiento de voz, Automatización/AppleScript).
- Ejecuta o se conecta al Gateway (local o remoto).
- Expone herramientas exclusivas de macOS (Canvas, Cámara, Grabación de pantalla, `system.run`).
- Inicia el servicio local de host de Node en modo **remoto** (launchd) y lo detiene en modo **local**.
- Opcionalmente aloja **PeekabooBridge** para automatización de UI.
- Instala la CLI global (`openclaw`) a pedido mediante npm, pnpm o bun (la app prefiere npm, luego pnpm y luego bun; Node sigue siendo el runtime recomendado para Gateway).

## Modo local frente a remoto

- **Local** (predeterminado): la app se adjunta a un Gateway local en ejecución si existe;
  de lo contrario, habilita el servicio launchd mediante `openclaw gateway install`.
- **Remoto**: la app se conecta a un Gateway por SSH/Tailscale y nunca inicia
  un proceso local.
  La app inicia el **servicio local de host de Node** para que el Gateway remoto pueda alcanzar este Mac.
  La app no genera el Gateway como proceso hijo.
  El descubrimiento de Gateway ahora prefiere nombres MagicDNS de Tailscale antes que IPs tailnet sin procesar,
  por lo que la app de Mac se recupera con mayor fiabilidad cuando cambian las IPs tailnet.

## Control de launchd

La app gestiona un LaunchAgent por usuario con la etiqueta `ai.openclaw.gateway`
(o `ai.openclaw.<profile>` al usar `--profile`/`OPENCLAW_PROFILE`; el legado `com.openclaw.*` todavía se descarga).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Reemplaza la etiqueta por `ai.openclaw.<profile>` al ejecutar un perfil con nombre.

Si el LaunchAgent no está instalado, habilítalo desde la app o ejecuta
`openclaw gateway install`.

## Capacidades de Node (Mac)

La app de macOS se presenta como un Node. Comandos comunes:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Cámara: `camera.snap`, `camera.clip`
- Pantalla: `screen.snapshot`, `screen.record`
- Sistema: `system.run`, `system.notify`

El Node informa un mapa `permissions` para que los agentes puedan decidir qué está permitido.

Servicio de Node + IPC de la app:

- Cuando se ejecuta el servicio de host de Node sin interfaz (modo remoto), se conecta al WS del Gateway como un Node.
- `system.run` se ejecuta en la app de macOS (contexto de UI/TCC) mediante un socket Unix local; los avisos y la salida permanecen dentro de la app.

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

- Las entradas `allowlist` son patrones glob para rutas binarias resueltas, o nombres de comando simples para comandos invocados mediante PATH.
- El texto de comando de shell sin procesar que contiene sintaxis de control o expansión de shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) se trata como un fallo de lista de permitidos y requiere aprobación explícita (o agregar el binario de shell a la lista de permitidos).
- Elegir “Permitir siempre” en el aviso agrega ese comando a la lista de permitidos.
- Las sobrescrituras de entorno de `system.run` se filtran (descarta `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) y luego se fusionan con el entorno de la app.
- Para envoltorios de shell (`bash|sh|zsh ... -c/-lc`), las sobrescrituras de entorno con alcance de solicitud se reducen a una pequeña lista explícita de permitidos (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisiones de permitir siempre en modo de lista de permitidos, los envoltorios de despacho conocidos (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) conservan las rutas del ejecutable interno en lugar de las rutas del envoltorio. Si desenvolver no es seguro, no se conserva automáticamente ninguna entrada de lista de permitidos.

## Enlaces profundos

La app registra el esquema de URL `openclaw://` para acciones locales.

### `openclaw://agent`

Dispara una solicitud `agent` de Gateway.
__OC_I18N_900004__
Parámetros de consulta:

- `message` (obligatorio)
- `sessionKey` (opcional)
- `thinking` (opcional)
- `deliver` / `to` / `channel` (opcional)
- `timeoutSeconds` (opcional)
- `key` (clave opcional para modo desatendido)

Seguridad:

- Sin `key`, la app solicita confirmación.
- Sin `key`, la app aplica un límite corto de mensaje para el aviso de confirmación e ignora `deliver` / `to` / `channel`.
- Con una `key` válida, la ejecución es desatendida (pensada para automatizaciones personales).

## Flujo de incorporación (típico)

1. Instala e inicia **OpenClaw.app**.
2. Completa la lista de verificación de permisos (avisos de TCC).
3. Asegúrate de que el modo **Local** esté activo y de que el Gateway esté ejecutándose.
4. Instala la CLI si quieres acceso desde terminal.

## Ubicación del directorio de estado (macOS)

Evita colocar tu directorio de estado de OpenClaw en iCloud u otras carpetas sincronizadas con la nube.
Las rutas respaldadas por sincronización pueden agregar latencia y ocasionalmente causar carreras de bloqueo/sincronización de archivos para
sesiones y credenciales.

Prefiere una ruta de estado local no sincronizada, como:
__OC_I18N_900005__
Si `openclaw doctor` detecta estado bajo:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

advertirá y recomendará volver a una ruta local.

## Flujo de compilación y desarrollo (nativo)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (o Xcode)
- Empaquetar app: `scripts/package-mac-app.sh`

## Depurar la conectividad del Gateway (CLI de macOS)

Usa la CLI de depuración para ejercer el mismo handshake de WebSocket de Gateway y la lógica de descubrimiento
que usa la app de macOS, sin iniciar la app.
__OC_I18N_900006__
Opciones de conexión:

- `--url <ws://host:port>`: sobrescribir configuración
- `--mode <local|remote>`: resolver desde configuración (predeterminado: configuración o local)
- `--probe`: forzar una comprobación de salud nueva
- `--timeout <ms>`: tiempo de espera de la solicitud (predeterminado: `15000`)
- `--json`: salida estructurada para comparar diferencias

Opciones de descubrimiento:

- `--include-local`: incluir gateways que se filtrarían como “locales”
- `--timeout <ms>`: ventana general de descubrimiento (predeterminado: `2000`)
- `--json`: salida estructurada para comparar diferencias

<Tip>
Compara con `openclaw gateway discover --json` para ver si la canalización de descubrimiento de la app de macOS (`local.` más el dominio de área amplia configurado, con fallbacks de área amplia y Tailscale Serve) difiere del descubrimiento basado en `dns-sd` de la CLI de Node.
</Tip>

## Fontanería de conexión remota (túneles SSH)

Cuando la app de macOS se ejecuta en modo **Remoto**, abre un túnel SSH para que los componentes de UI locales
puedan hablar con un Gateway remoto como si estuviera en localhost.

### Túnel de control (puerto WebSocket de Gateway)

- **Propósito:** comprobaciones de salud, estado, Web Chat, configuración y otras llamadas del plano de control.
- **Puerto local:** el puerto de Gateway (predeterminado `18789`), siempre estable.
- **Puerto remoto:** el mismo puerto de Gateway en el host remoto.
- **Comportamiento:** sin puerto local aleatorio; la app reutiliza un túnel saludable existente
  o lo reinicia si es necesario.
- **Forma de SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` con BatchMode +
  ExitOnForwardFailure + opciones keepalive.
- **Informe de IP:** el túnel SSH usa loopback, así que el gateway verá la IP del Node
  como `127.0.0.1`. Usa el transporte **Directo (ws/wss)** si quieres que aparezca la IP real del cliente
  (consulta [acceso remoto de macOS](/es/platforms/mac/remote)).

Para pasos de configuración, consulta [acceso remoto de macOS](/es/platforms/mac/remote). Para detalles del protocolo,
consulta [protocolo de Gateway](/es/gateway/protocol).

## Documentación relacionada

- [Runbook de Gateway](/es/gateway)
- [Gateway (macOS)](/es/platforms/mac/bundled-gateway)
- [Permisos de macOS](/es/platforms/mac/permissions)
- [Canvas](/es/platforms/mac/canvas)
