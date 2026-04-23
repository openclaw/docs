---
read_when:
    - Ejecutar el Gateway desde la CLI (desarrollo o servidores)
    - Depuración de autenticación, modos de enlace y conectividad del Gateway
    - Detectar gateways mediante Bonjour (DNS-SD local y de área amplia)
summary: CLI del Gateway de OpenClaw (`openclaw gateway`) — ejecutar, consultar y detectar gateways
title: gateway
x-i18n:
    generated_at: "2026-04-23T14:01:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9160017a4d1326819f6b4d067bd99aa02ee37689b96c185defedef6200c19cf
    source_path: cli/gateway.md
    workflow: 15
---

# CLI del Gateway

El Gateway es el servidor WebSocket de OpenClaw (canales, nodos, sesiones, hooks).

Los subcomandos de esta página viven bajo `openclaw gateway …`.

Documentación relacionada:

- [/gateway/bonjour](/es/gateway/bonjour)
- [/gateway/discovery](/es/gateway/discovery)
- [/gateway/configuration](/es/gateway/configuration)

## Ejecutar el Gateway

Ejecuta un proceso local del Gateway:

```bash
openclaw gateway
```

Alias en primer plano:

```bash
openclaw gateway run
```

Notas:

- De forma predeterminada, el Gateway se niega a iniciarse a menos que `gateway.mode=local` esté configurado en `~/.openclaw/openclaw.json`. Usa `--allow-unconfigured` para ejecuciones ad hoc/de desarrollo.
- Se espera que `openclaw onboard --mode local` y `openclaw setup` escriban `gateway.mode=local`. Si el archivo existe pero falta `gateway.mode`, trátalo como una configuración rota o sobrescrita y repárala en lugar de asumir implícitamente el modo local.
- Si el archivo existe y falta `gateway.mode`, el Gateway lo trata como un daño sospechoso en la configuración y se niega a “suponer local” por ti.
- Se bloquea enlazar fuera de loopback sin autenticación (guarda de seguridad).
- `SIGUSR1` activa un reinicio dentro del proceso cuando está autorizado (`commands.restart` está habilitado de forma predeterminada; establece `commands.restart: false` para bloquear el reinicio manual, mientras que las operaciones gateway tool/config apply/update siguen permitidas).
- Los controladores `SIGINT`/`SIGTERM` detienen el proceso del gateway, pero no restauran ningún estado personalizado del terminal. Si envuelves la CLI con una TUI o entrada en modo raw, restaura el terminal antes de salir.

### Opciones

- `--port <port>`: puerto WebSocket (el valor predeterminado viene de config/env; normalmente `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: modo de enlace del listener.
- `--auth <token|password>`: anulación del modo de autenticación.
- `--token <token>`: anulación del token (también establece `OPENCLAW_GATEWAY_TOKEN` para el proceso).
- `--password <password>`: anulación de la contraseña. Advertencia: las contraseñas en línea pueden quedar expuestas en listados locales de procesos.
- `--password-file <path>`: leer la contraseña del gateway desde un archivo.
- `--tailscale <off|serve|funnel>`: exponer el Gateway mediante Tailscale.
- `--tailscale-reset-on-exit`: restablecer la configuración serve/funnel de Tailscale al apagar.
- `--allow-unconfigured`: permitir iniciar el gateway sin `gateway.mode=local` en la configuración. Esto omite la guarda de inicio solo para arranques ad hoc/de desarrollo; no escribe ni repara el archivo de configuración.
- `--dev`: crear una configuración + espacio de trabajo de desarrollo si faltan (omite BOOTSTRAP.md).
- `--reset`: restablecer la configuración de desarrollo + credenciales + sesiones + espacio de trabajo (requiere `--dev`).
- `--force`: matar cualquier listener existente en el puerto seleccionado antes de iniciar.
- `--verbose`: registros detallados.
- `--cli-backend-logs`: mostrar solo los registros del backend de la CLI en la consola (y habilitar stdout/stderr).
- `--ws-log <auto|full|compact>`: estilo de registro websocket (predeterminado `auto`).
- `--compact`: alias de `--ws-log compact`.
- `--raw-stream`: registrar eventos sin procesar del flujo del modelo en jsonl.
- `--raw-stream-path <path>`: ruta jsonl del flujo sin procesar.

Perfilado de inicio:

- Establece `OPENCLAW_GATEWAY_STARTUP_TRACE=1` para registrar tiempos por fase durante el inicio del Gateway.
- Ejecuta `pnpm test:startup:gateway -- --runs 5 --warmup 1` para medir el inicio del Gateway. La medición registra la primera salida del proceso, `/healthz`, `/readyz` y los tiempos de rastreo del inicio.

## Consultar un Gateway en ejecución

Todos los comandos de consulta usan RPC sobre WebSocket.

Modos de salida:

- Predeterminado: legible para humanos (con color en TTY).
- `--json`: JSON legible por máquina (sin estilo/spinner).
- `--no-color` (o `NO_COLOR=1`): desactivar ANSI manteniendo el formato legible.

Opciones compartidas (cuando se admitan):

- `--url <url>`: URL WebSocket del Gateway.
- `--token <token>`: token del Gateway.
- `--password <password>`: contraseña del Gateway.
- `--timeout <ms>`: tiempo de espera/presupuesto (varía según el comando).
- `--expect-final`: esperar una respuesta “final” (llamadas de agente).

Nota: cuando estableces `--url`, la CLI no recurre a credenciales de configuración ni de entorno.
Pasa `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

El endpoint HTTP `/healthz` es una sonda de vivacidad: devuelve cuando el servidor ya puede responder por HTTP. El endpoint HTTP `/readyz` es más estricto y sigue en rojo mientras los sidecars de inicio, canales o hooks configurados todavía se están estabilizando.

### `gateway usage-cost`

Obtén resúmenes de uso-coste a partir de registros de sesión.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Opciones:

- `--days <days>`: número de días que se incluirán (predeterminado `30`).

### `gateway stability`

Obtén el registrador reciente de estabilidad diagnóstica desde un Gateway en ejecución.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

Opciones:

- `--limit <limit>`: número máximo de eventos recientes que se incluirán (predeterminado `25`, máximo `1000`).
- `--type <type>`: filtrar por tipo de evento diagnóstico, como `payload.large` o `diagnostic.memory.pressure`.
- `--since-seq <seq>`: incluir solo eventos posteriores a un número de secuencia de diagnóstico.
- `--bundle [path]`: leer un paquete de estabilidad persistido en lugar de llamar al Gateway en ejecución. Usa `--bundle latest` (o simplemente `--bundle`) para el paquete más reciente bajo el directorio de estado, o pasa directamente una ruta a un JSON de paquete.
- `--export`: escribir un zip compartible de diagnósticos de soporte en lugar de imprimir los detalles de estabilidad.
- `--output <path>`: ruta de salida para `--export`.

Notas:

- Los registros conservan metadatos operativos: nombres de eventos, recuentos, tamaños en bytes, lecturas de memoria, estado de cola/sesión, nombres de canal/plugin y resúmenes de sesión redactados. No conservan texto de chat, cuerpos de Webhook, salidas de herramientas, cuerpos sin procesar de solicitud o respuesta, tokens, cookies, valores secretos, nombres de host ni ids de sesión sin procesar. Establece `diagnostics.enabled: false` para desactivar completamente el registrador.
- En salidas fatales del Gateway, tiempos de espera de apagado y fallos de inicio tras reinicio, OpenClaw escribe la misma instantánea diagnóstica en `~/.openclaw/logs/stability/openclaw-stability-*.json` cuando el registrador tiene eventos. Inspecciona el paquete más reciente con `openclaw gateway stability --bundle latest`; `--limit`, `--type` y `--since-seq` también se aplican a la salida del paquete.

### `gateway diagnostics export`

Escribe un zip local de diagnósticos diseñado para adjuntarse a informes de errores.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Opciones:

- `--output <path>`: ruta del zip de salida. El valor predeterminado es una exportación de soporte bajo el directorio de estado.
- `--log-lines <count>`: máximo de líneas de registro saneadas que se incluirán (predeterminado `5000`).
- `--log-bytes <bytes>`: máximo de bytes de registro que se inspeccionarán (predeterminado `1000000`).
- `--url <url>`: URL WebSocket del Gateway para la instantánea de salud.
- `--token <token>`: token del Gateway para la instantánea de salud.
- `--password <password>`: contraseña del Gateway para la instantánea de salud.
- `--timeout <ms>`: tiempo de espera de la instantánea de estado/salud (predeterminado `3000`).
- `--no-stability-bundle`: omitir la búsqueda del paquete de estabilidad persistido.
- `--json`: imprimir como JSON la ruta escrita, el tamaño y el manifiesto.

La exportación contiene un manifiesto, un resumen en Markdown, la forma de la configuración, detalles saneados de configuración, resúmenes saneados de registros, instantáneas saneadas de estado/salud del Gateway y el paquete de estabilidad más reciente cuando existe.

Está pensada para compartirse. Conserva detalles operativos que ayudan en la depuración, como campos seguros de registro de OpenClaw, nombres de subsistemas, códigos de estado, duraciones, modos configurados, puertos, ids de plugin, ids de proveedor, ajustes de funciones no secretas y mensajes operativos de registro redactados. Omite o redacta texto de chat, cuerpos de Webhook, salidas de herramientas, credenciales, cookies, identificadores de cuenta/mensaje, texto de prompt/instrucción, nombres de host y valores secretos. Cuando un mensaje de estilo LogTape parece texto de carga útil de usuario/chat/herramienta, la exportación conserva solo que se omitió un mensaje más su recuento de bytes.

### `gateway status`

`gateway status` muestra el servicio Gateway (launchd/systemd/schtasks) más una sonda opcional de conectividad/capacidad de autenticación.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Opciones:

- `--url <url>`: añadir un destino de sonda explícito. El remoto configurado + localhost siguen siendo sondeados.
- `--token <token>`: autenticación por token para la sonda.
- `--password <password>`: autenticación por contraseña para la sonda.
- `--timeout <ms>`: tiempo de espera de la sonda (predeterminado `10000`).
- `--no-probe`: omitir la sonda de conectividad (vista solo del servicio).
- `--deep`: escanear también servicios a nivel de sistema.
- `--require-rpc`: elevar la sonda de conectividad predeterminada a una sonda de lectura y salir con código distinto de cero cuando esa sonda de lectura falle. No puede combinarse con `--no-probe`.

Notas:

- `gateway status` sigue disponible para diagnóstico incluso cuando falta la configuración local de la CLI o es inválida.
- `gateway status` predeterminado demuestra el estado del servicio, la conexión WebSocket y la capacidad de autenticación visible en el momento del handshake. No demuestra operaciones de lectura/escritura/admin.
- `gateway status` resuelve SecretRef de autenticación configurados para la autenticación de la sonda cuando es posible.
- Si un SecretRef de autenticación requerido no se resuelve en esta ruta de comando, `gateway status --json` informa `rpc.authWarning` cuando falla la conectividad/autenticación de la sonda; pasa `--token`/`--password` explícitamente o resuelve antes la fuente del secreto.
- Si la sonda tiene éxito, las advertencias de auth-ref no resueltas se suprimen para evitar falsos positivos.
- Usa `--require-rpc` en scripts y automatización cuando no basta con un servicio escuchando y necesitas que las llamadas RPC con alcance de lectura también estén sanas.
- `--deep` añade un escaneo best-effort de instalaciones extra de launchd/systemd/schtasks. Cuando se detectan varios servicios similares a gateways, la salida legible imprime sugerencias de limpieza y advierte que la mayoría de las configuraciones deberían ejecutar un gateway por máquina.
- La salida legible incluye la ruta resuelta del registro de archivo más la instantánea de rutas/validez de configuración de CLI frente a servicio para ayudar a diagnosticar deriva del perfil o del state-dir.
- En instalaciones Linux con systemd, las comprobaciones de deriva de autenticación del servicio leen tanto valores `Environment=` como `EnvironmentFile=` de la unidad (incluidos `%h`, rutas entre comillas, varios archivos y archivos opcionales `-`).
- Las comprobaciones de deriva resuelven SecretRef de `gateway.auth.token` usando el entorno de ejecución combinado (primero el entorno de comandos del servicio, luego el entorno del proceso como respaldo).
- Si la autenticación por token no está efectivamente activa (modo `gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, o modo no establecido donde la contraseña puede prevalecer y ningún token candidato puede prevalecer), las comprobaciones de deriva de token omiten la resolución del token de configuración.

### `gateway probe`

`gateway probe` es el comando de “depurar todo”. Siempre sondea:

- tu gateway remoto configurado (si existe), y
- localhost (loopback) **incluso si hay un remoto configurado**.

Si pasas `--url`, ese destino explícito se añade antes de ambos. La salida legible etiqueta los
destinos como:

- `URL (explicit)`
- `Remote (configured)` o `Remote (configured, inactive)`
- `Local loopback`

Si se puede acceder a varios gateways, los imprime todos. Se admiten varios gateways cuando usas perfiles/puertos aislados (por ejemplo, un bot de rescate), pero la mayoría de las instalaciones siguen ejecutando un solo gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Interpretación:

- `Reachable: yes` significa que al menos un destino aceptó una conexión WebSocket.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` informa lo que la sonda pudo demostrar sobre la autenticación. Es independiente de la accesibilidad.
- `Read probe: ok` significa que las llamadas RPC detalladas con alcance de lectura (`health`/`status`/`system-presence`/`config.get`) también tuvieron éxito.
- `Read probe: limited - missing scope: operator.read` significa que la conexión tuvo éxito, pero el RPC con alcance de lectura está limitado. Esto se informa como accesibilidad **degradada**, no como fallo total.
- El código de salida es distinto de cero solo cuando ningún destino sondeado es accesible.

Notas de JSON (`--json`):

- Nivel superior:
  - `ok`: al menos un destino es accesible.
  - `degraded`: al menos un destino tuvo RPC detallado limitado por alcance.
  - `capability`: la mejor capacidad observada entre los destinos accesibles (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
  - `primaryTargetId`: mejor destino para tratar como ganador activo en este orden: URL explícita, túnel SSH, remoto configurado y luego loopback local.
  - `warnings[]`: registros de advertencia best-effort con `code`, `message` y `targetIds` opcionales.
  - `network`: sugerencias de URL de loopback local/tailnet derivadas de la configuración actual y de la red del host.
  - `discovery.timeoutMs` y `discovery.count`: el presupuesto/resultado real de detección usado para esta pasada de sonda.
- Por destino (`targets[].connect`):
  - `ok`: accesibilidad tras la conexión + clasificación degradada.
  - `rpcOk`: éxito completo del RPC detallado.
  - `scopeLimited`: el RPC detallado falló por falta de alcance de operador.
- Por destino (`targets[].auth`):
  - `role`: rol de autenticación informado en `hello-ok` cuando esté disponible.
  - `scopes`: alcances concedidos informados en `hello-ok` cuando estén disponibles.
  - `capability`: la clasificación de capacidad de autenticación mostrada para ese destino.

Códigos de advertencia comunes:

- `ssh_tunnel_failed`: falló la configuración del túnel SSH; el comando recurrió a sondas directas.
- `multiple_gateways`: más de un destino era accesible; esto es inusual salvo que ejecutes intencionadamente perfiles aislados, como un bot de rescate.
- `auth_secretref_unresolved`: no se pudo resolver un SecretRef de autenticación configurado para un destino fallido.
- `probe_scope_limited`: la conexión WebSocket tuvo éxito, pero la sonda de lectura estaba limitada por la falta de `operator.read`.

#### Remoto por SSH (paridad con la app de Mac)

El modo “Remote over SSH” de la app de macOS usa un reenvío de puerto local para que el gateway remoto (que puede estar enlazado solo a loopback) sea accesible en `ws://127.0.0.1:<port>`.

Equivalente en la CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Opciones:

- `--ssh <target>`: `user@host` o `user@host:port` (el puerto predeterminado es `22`).
- `--ssh-identity <path>`: archivo de identidad.
- `--ssh-auto`: elegir el primer host de gateway detectado como destino SSH desde el endpoint de detección resuelto (`local.` más el dominio de área amplia configurado, si existe). Se ignoran las sugerencias solo-TXT.

Configuración (opcional, usada como valores predeterminados):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Ayudante RPC de bajo nivel.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

Opciones:

- `--params <json>`: cadena de objeto JSON para params (predeterminado `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

Notas:

- `--params` debe ser JSON válido.
- `--expect-final` es principalmente para RPC de estilo agente que transmiten eventos intermedios antes de una carga útil final.

## Gestionar el servicio Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

Opciones de comandos:

- `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart`: `--json`

Notas:

- `gateway install` admite `--port`, `--runtime`, `--token`, `--force`, `--json`.
- Cuando la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, `gateway install` valida que el SecretRef sea resoluble, pero no conserva el token resuelto en los metadatos del entorno del servicio.
- Si la autenticación por token requiere un token y el SecretRef del token configurado no está resuelto, la instalación falla en modo cerrado en lugar de conservar texto plano de respaldo.
- Para autenticación por contraseña en `gateway run`, prefiere `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` respaldado por SecretRef en lugar de `--password` en línea.
- En modo de autenticación inferido, `OPENCLAW_GATEWAY_PASSWORD` solo en shell no relaja los requisitos de token para la instalación; usa configuración duradera (`gateway.auth.password` o `env` de configuración) al instalar un servicio gestionado.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está establecido, la instalación se bloquea hasta que el modo se establezca explícitamente.
- Los comandos de ciclo de vida aceptan `--json` para scripting.

## Detectar gateways (Bonjour)

`gateway discover` busca balizas del Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour de área amplia): elige un dominio (ejemplo: `openclaw.internal.`) y configura split DNS + un servidor DNS; consulta [/gateway/bonjour](/es/gateway/bonjour)

Solo los gateways con la detección Bonjour habilitada (predeterminado) anuncian la baliza.

Los registros de detección de área amplia incluyen (TXT):

- `role` (sugerencia de rol del gateway)
- `transport` (sugerencia de transporte, p. ej. `gateway`)
- `gatewayPort` (puerto WebSocket, normalmente `18789`)
- `sshPort` (opcional; cuando no está presente, los clientes usan `22` como destino SSH predeterminado)
- `tailnetDns` (nombre de host MagicDNS, cuando está disponible)
- `gatewayTls` / `gatewayTlsSha256` (TLS habilitado + huella del certificado)
- `cliPath` (sugerencia de instalación remota escrita en la zona de área amplia)

### `gateway discover`

```bash
openclaw gateway discover
```

Opciones:

- `--timeout <ms>`: tiempo de espera por comando (browse/resolve); predeterminado `2000`.
- `--json`: salida legible por máquina (también desactiva el estilo/spinner).

Ejemplos:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Notas:

- La CLI busca en `local.` más el dominio de área amplia configurado cuando hay uno habilitado.
- `wsUrl` en la salida JSON se deriva del endpoint de servicio resuelto, no de sugerencias solo-TXT como `lanHost` o `tailnetDns`.
- En mDNS `local.`, `sshPort` y `cliPath` solo se difunden cuando `discovery.mdns.mode` es `full`. El DNS-SD de área amplia sigue escribiendo `cliPath`; `sshPort` también sigue siendo opcional allí.
