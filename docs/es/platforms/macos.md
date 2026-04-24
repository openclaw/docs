---
read_when:
    - Implementar funciones de la app de macOS
    - Cambiar el ciclo de vida del gateway o el puente de nodos en macOS
summary: Aplicación complementaria de OpenClaw para macOS (barra de menús + intermediario del gateway)
title: App de macOS
x-i18n:
    generated_at: "2026-04-24T05:39:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c7911d0a2e7be7fa437c5ef01a98c0f7da5e44388152ba182581cd2e381ba8b
    source_path: platforms/macos.md
    workflow: 15
---

La app de macOS es la **aplicación complementaria de barra de menús** para OpenClaw. Gestiona los permisos,
administra/se conecta al Gateway localmente (launchd o manual) y expone capacidades de macOS
al agente como un nodo.

## Qué hace

- Muestra notificaciones nativas y estado en la barra de menús.
- Gestiona las solicitudes TCC (Notificaciones, Accesibilidad, Grabación de pantalla, Micrófono,
  Reconocimiento de voz, Automatización/AppleScript).
- Ejecuta o se conecta al Gateway (local o remoto).
- Expone herramientas exclusivas de macOS (Canvas, Cámara, Grabación de pantalla, `system.run`).
- Inicia el servicio local de host de nodo en modo **remoto** (launchd) y lo detiene en modo **local**.
- Puede alojar opcionalmente **PeekabooBridge** para automatización de UI.
- Instala la CLI global (`openclaw`) a petición mediante npm, pnpm o bun (la app prefiere npm, luego pnpm y luego bun; Node sigue siendo el runtime recomendado del Gateway).

## Modo local frente a remoto

- **Local** (predeterminado): la app se conecta a un Gateway local ya en ejecución si existe;
  en caso contrario habilita el servicio launchd mediante `openclaw gateway install`.
- **Remoto**: la app se conecta a un Gateway por SSH/Tailscale y nunca inicia
  un proceso local.
  La app inicia el **servicio local de host de nodo** para que el Gateway remoto pueda alcanzar este Mac.
  La app no inicia el Gateway como proceso hijo.
  El descubrimiento del Gateway ahora prefiere nombres MagicDNS de Tailscale frente a IP sin procesar de tailnet,
  por lo que la app de Mac se recupera con más fiabilidad cuando cambian las IP de tailnet.

## Control de launchd

La app gestiona un LaunchAgent por usuario con la etiqueta `ai.openclaw.gateway`
(o `ai.openclaw.<profile>` cuando se usa `--profile`/`OPENCLAW_PROFILE`; el heredado `com.openclaw.*` sigue descargándose).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Sustituye la etiqueta por `ai.openclaw.<profile>` cuando ejecutes un perfil con nombre.

Si el LaunchAgent no está instalado, actívalo desde la app o ejecuta
`openclaw gateway install`.

## Capacidades del nodo (Mac)

La app de macOS se presenta como un nodo. Comandos habituales:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Cámara: `camera.snap`, `camera.clip`
- Pantalla: `screen.snapshot`, `screen.record`
- Sistema: `system.run`, `system.notify`

El nodo informa de un mapa `permissions` para que los agentes puedan decidir qué está permitido.

Servicio de nodo + IPC de la app:

- Cuando el servicio sin interfaz de host de nodo está en ejecución (modo remoto), se conecta al Gateway WS como nodo.
- `system.run` se ejecuta en la app de macOS (contexto UI/TCC) sobre un socket Unix local; las solicitudes y la salida permanecen dentro de la app.

Diagrama (SCI):

```text
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Aprobaciones de ejecución (`system.run`)

`system.run` está controlado por **Aprobaciones de ejecución** en la app de macOS (Ajustes → Exec approvals).
La seguridad + solicitud + lista de permitidos se almacenan localmente en el Mac en:

```text
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

- Las entradas de `allowlist` son patrones glob para rutas resueltas de binarios.
- El texto sin procesar de comandos de shell que contiene sintaxis de control o expansión de shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) se trata como un fallo de lista de permitidos y requiere aprobación explícita (o añadir el binario del shell a la lista de permitidos).
- Elegir “Always Allow” en la solicitud añade ese comando a la lista de permitidos.
- Las anulaciones de entorno de `system.run` se filtran (elimina `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) y luego se combinan con el entorno de la app.
- Para envoltorios de shell (`bash|sh|zsh ... -c/-lc`), las anulaciones de entorno con alcance de solicitud se reducen a una pequeña lista explícita de permitidos (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisiones de permitir siempre en modo de lista de permitidos, los envoltorios de despacho conocidos (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) conservan las rutas del ejecutable interno en lugar de las rutas del envoltorio. Si no es seguro desempaquetar, no se conserva automáticamente ninguna entrada en la lista de permitidos.

## Enlaces profundos

La app registra el esquema de URL `openclaw://` para acciones locales.

### `openclaw://agent`

Desencadena una solicitud `agent` al Gateway.
__OC_I18N_900004__
Parámetros de consulta:

- `message` (obligatorio)
- `sessionKey` (opcional)
- `thinking` (opcional)
- `deliver` / `to` / `channel` (opcional)
- `timeoutSeconds` (opcional)
- `key` (opcional, clave para modo desatendido)

Seguridad:

- Sin `key`, la app solicita confirmación.
- Sin `key`, la app aplica un límite corto al mensaje para la solicitud de confirmación e ignora `deliver` / `to` / `channel`.
- Con una `key` válida, la ejecución es desatendida (pensada para automatizaciones personales).

## Flujo de incorporación (típico)

1. Instala y abre **OpenClaw.app**.
2. Completa la lista de comprobación de permisos (solicitudes TCC).
3. Asegúrate de que el modo **Local** esté activo y de que el Gateway esté en ejecución.
4. Instala la CLI si quieres acceso por terminal.

## Ubicación del directorio de estado (macOS)

Evita colocar tu directorio de estado de OpenClaw en iCloud u otras carpetas sincronizadas con la nube.
Las rutas respaldadas por sincronización pueden añadir latencia y ocasionalmente provocar carreras de bloqueo/sincronización de archivos para
sesiones y credenciales.

Prefiere una ruta de estado local no sincronizada como:
__OC_I18N_900005__
Si `openclaw doctor` detecta el estado bajo:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

mostrará una advertencia y recomendará volver a una ruta local.

## Flujo de compilación y desarrollo (nativo)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (o Xcode)
- Empaquetar app: `scripts/package-mac-app.sh`

## Depurar la conectividad del gateway (CLI de macOS)

Usa la CLI de depuración para ejercitar el mismo handshake y la misma lógica de descubrimiento del Gateway WebSocket
que usa la app de macOS, sin abrir la app.
__OC_I18N_900006__
Opciones de conexión:

- `--url <ws://host:port>`: anula la configuración
- `--mode <local|remote>`: resuelve a partir de la configuración (predeterminado: config o local)
- `--probe`: fuerza una sonda de estado nueva
- `--timeout <ms>`: tiempo de espera de la solicitud (predeterminado: `15000`)
- `--json`: salida estructurada para comparar diferencias

Opciones de descubrimiento:

- `--include-local`: incluye gateways que se filtrarían como “locales”
- `--timeout <ms>`: ventana total de descubrimiento (predeterminado: `2000`)
- `--json`: salida estructurada para comparar diferencias

Consejo: compáralo con `openclaw gateway discover --json` para ver si la
canalización de descubrimiento de la app de macOS (`local.` más el dominio de área extensa configurado, con
alternativas de área extensa y de Tailscale Serve) difiere de
el descubrimiento basado en `dns-sd` de la CLI de Node.

## Infraestructura de conexión remota (túneles SSH)

Cuando la app de macOS se ejecuta en modo **Remoto**, abre un túnel SSH para que los componentes locales de UI
puedan hablar con un Gateway remoto como si estuviera en localhost.

### Túnel de control (puerto WebSocket del Gateway)

- **Propósito:** comprobaciones de estado, estado general, Web Chat, configuración y otras llamadas del plano de control.
- **Puerto local:** el puerto del Gateway (predeterminado `18789`), siempre estable.
- **Puerto remoto:** el mismo puerto del Gateway en el host remoto.
- **Comportamiento:** no hay puerto local aleatorio; la app reutiliza un túnel existente y en buen estado
  o lo reinicia si es necesario.
- **Forma SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` con opciones BatchMode +
  ExitOnForwardFailure + keepalive.
- **Informe de IP:** el túnel SSH usa loopback, por lo que el gateway verá la IP del nodo
  como `127.0.0.1`. Usa transporte **Direct (ws/wss)** si quieres que aparezca la IP real del cliente
  (consulta [acceso remoto de macOS](/es/platforms/mac/remote)).

Para los pasos de configuración, consulta [acceso remoto de macOS](/es/platforms/mac/remote). Para detalles del protocolo,
consulta [protocolo del Gateway](/es/gateway/protocol).

## Documentación relacionada

- [Runbook del Gateway](/es/gateway)
- [Gateway (macOS)](/es/platforms/mac/bundled-gateway)
- [Permisos de macOS](/es/platforms/mac/permissions)
- [Canvas](/es/platforms/mac/canvas)
