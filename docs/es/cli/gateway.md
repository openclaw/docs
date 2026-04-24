---
read_when:
    - Ejecutar el Gateway desde la CLI (desarrollo o servidores)
    - Depurar autenticación, modos de enlace y conectividad del Gateway
    - Descubrir Gateways mediante Bonjour (DNS-SD local y de área amplia)
summary: CLI del Gateway de OpenClaw (`openclaw gateway`) — ejecutar, consultar y descubrir Gateways
title: Gateway
x-i18n:
    generated_at: "2026-04-24T05:22:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 011b8c8f86de6ecafbf17357a458956357ebe8285fe86e2bf875a4e2d87b5126
    source_path: cli/gateway.md
    workflow: 15
---

# CLI del Gateway

El Gateway es el servidor WebSocket de OpenClaw (canales, Nodes, sesiones, Hooks).

Los subcomandos de esta página se usan bajo `openclaw gateway …`.

Documentación relacionada:

- [/gateway/bonjour](/es/gateway/bonjour)
- [/gateway/discovery](/es/gateway/discovery)
- [/gateway/configuration](/es/gateway/configuration)

## Ejecutar el Gateway

Ejecuta un proceso local de Gateway:

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
- Se bloquea enlazar más allá del loopback sin autenticación (medida de seguridad).
- `SIGUSR1` activa un reinicio en proceso cuando está autorizado (`commands.restart` está habilitado de forma predeterminada; configura `commands.restart: false` para bloquear el reinicio manual, mientras que gateway tool/config apply/update siguen permitidos).
- Los controladores `SIGINT`/`SIGTERM` detienen el proceso del Gateway, pero no restauran ningún estado personalizado del terminal. Si encapsulas la CLI con una TUI o entrada en modo raw, restaura el terminal antes de salir.

### Opciones

- `--port <port>`: puerto WebSocket (el valor predeterminado proviene de config/env; normalmente `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: modo de enlace del listener.
- `--auth <token|password>`: sobrescritura del modo de autenticación.
- `--token <token>`: sobrescritura del token (también establece `OPENCLAW_GATEWAY_TOKEN` para el proceso).
- `--password <password>`: sobrescritura de la contraseña. Advertencia: las contraseñas en línea pueden quedar expuestas en listados locales de procesos.
- `--password-file <path>`: lee la contraseña del Gateway desde un archivo.
- `--tailscale <off|serve|funnel>`: expone el Gateway mediante Tailscale.
- `--tailscale-reset-on-exit`: restablece la configuración serve/funnel de Tailscale al apagar.
- `--allow-unconfigured`: permite iniciar el Gateway sin `gateway.mode=local` en la configuración. Esto omite la protección de inicio solo para arranque ad hoc/de desarrollo; no escribe ni repara el archivo de configuración.
- `--dev`: crea una configuración + espacio de trabajo de desarrollo si faltan (omite `BOOTSTRAP.md`).
- `--reset`: restablece la configuración de desarrollo + credenciales + sesiones + espacio de trabajo (requiere `--dev`).
- `--force`: mata cualquier listener existente en el puerto seleccionado antes de iniciar.
- `--verbose`: registros detallados.
- `--cli-backend-logs`: muestra solo registros del backend de la CLI en la consola (y habilita stdout/stderr).
- `--ws-log <auto|full|compact>`: estilo de registro de websocket (predeterminado `auto`).
- `--compact`: alias de `--ws-log compact`.
- `--raw-stream`: registra eventos sin procesar del flujo del modelo en jsonl.
- `--raw-stream-path <path>`: ruta jsonl del flujo sin procesar.

Perfilado de inicio:

- Establece `OPENCLAW_GATEWAY_STARTUP_TRACE=1` para registrar tiempos por fase durante el inicio del Gateway.
- Ejecuta `pnpm test:startup:gateway -- --runs 5 --warmup 1` para medir el inicio del Gateway. La medición registra la primera salida del proceso, `/healthz`, `/readyz` y los tiempos de rastreo de inicio.

## Consultar un Gateway en ejecución

Todos los comandos de consulta usan RPC por WebSocket.

Modos de salida:

- Predeterminado: legible para humanos (con color en TTY).
- `--json`: JSON legible por máquina (sin estilo/spinner).
- `--no-color` (o `NO_COLOR=1`): deshabilita ANSI manteniendo el diseño legible para humanos.

Opciones compartidas (donde sea compatible):

- `--url <url>`: URL WebSocket del Gateway.
- `--token <token>`: token del Gateway.
- `--password <password>`: contraseña del Gateway.
- `--timeout <ms>`: timeout/presupuesto (varía según el comando).
- `--expect-final`: espera una respuesta “final” (llamadas de agente).

Nota: cuando estableces `--url`, la CLI no recurre a credenciales de configuración o entorno.
Pasa `--token` o `--password` explícitamente. La ausencia de credenciales explícitas es un error.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

El endpoint HTTP `/healthz` es una sonda de vida: devuelve respuesta una vez que el servidor puede responder HTTP. El endpoint HTTP `/readyz` es más estricto y permanece en rojo mientras los sidecars de inicio, los canales o los Hooks configurados siguen estabilizándose.

### `gateway usage-cost`

Obtiene resúmenes de costo de uso desde los registros de sesión.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Opciones:

- `--days <days>`: número de días que se incluirán (predeterminado `30`).

### `gateway stability`

Obtiene el registrador reciente de estabilidad diagnóstica desde un Gateway en ejecución.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

Opciones:

- `--limit <limit>`: número máximo de eventos recientes que se incluirán (predeterminado `25`, máximo `1000`).
- `--type <type>`: filtra por tipo de evento diagnóstico, como `payload.large` o `diagnostic.memory.pressure`.
- `--since-seq <seq>`: incluye solo eventos posteriores a un número de secuencia diagnóstica.
- `--bundle [path]`: lee un paquete de estabilidad persistido en lugar de llamar al Gateway en ejecución. Usa `--bundle latest` (o simplemente `--bundle`) para el paquete más reciente bajo el directorio de estado, o pasa directamente una ruta a un JSON de paquete.
- `--export`: escribe un zip compartible de diagnósticos de soporte en lugar de imprimir detalles de estabilidad.
- `--output <path>`: ruta de salida para `--export`.

Notas:

- Los registros conservan metadatos operativos: nombres de eventos, conteos, tamaños en bytes, lecturas de memoria, estado de cola/sesión, nombres de canal/Plugin y resúmenes de sesión redactados. No conservan texto de chat, cuerpos de Webhook, salidas de herramientas, cuerpos sin procesar de solicitud o respuesta, tokens, cookies, valores secretos, nombres de host ni ids de sesión sin procesar. Configura `diagnostics.enabled: false` para deshabilitar por completo el registrador.
- En salidas fatales del Gateway, timeouts de apagado y fallos de inicio durante reinicios, OpenClaw escribe la misma instantánea diagnóstica en `~/.openclaw/logs/stability/openclaw-stability-*.json` cuando el registrador tiene eventos. Inspecciona el paquete más reciente con `openclaw gateway stability --bundle latest`; `--limit`, `--type` y `--since-seq` también se aplican a la salida del paquete.

### `gateway diagnostics export`

Escribe un zip local de diagnósticos diseñado para adjuntarse a reportes de errores.
Para el modelo de privacidad y el contenido del paquete, consulta [Diagnostics Export](/es/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Opciones:

- `--output <path>`: ruta del zip de salida. De forma predeterminada, usa una exportación de soporte bajo el directorio de estado.
- `--log-lines <count>`: número máximo de líneas saneadas de registro que se incluirán (predeterminado `5000`).
- `--log-bytes <bytes>`: cantidad máxima de bytes de registro que se inspeccionarán (predeterminado `1000000`).
- `--url <url>`: URL WebSocket del Gateway para la instantánea de estado.
- `--token <token>`: token del Gateway para la instantánea de estado.
- `--password <password>`: contraseña del Gateway para la instantánea de estado.
- `--timeout <ms>`: timeout de la instantánea de estado/salud (predeterminado `3000`).
- `--no-stability-bundle`: omite la búsqueda del paquete de estabilidad persistido.
- `--json`: imprime como JSON la ruta escrita, el tamaño y el manifiesto.

La exportación contiene un manifiesto, un resumen en Markdown, la forma de la configuración, detalles de configuración saneados, resúmenes de registros saneados, instantáneas saneadas de estado/salud del Gateway y el paquete de estabilidad más reciente cuando existe uno.

Está pensada para compartirse. Conserva detalles operativos útiles para depuración, como campos seguros de registros de OpenClaw, nombres de subsistemas, códigos de estado, duraciones, modos configurados, puertos, ids de Plugin, ids de proveedor, configuraciones de funciones no secretas y mensajes operativos redactados de registro. Omite o redacta texto de chat, cuerpos de Webhook, salidas de herramientas, credenciales, cookies, identificadores de cuenta/mensaje, texto de prompts/instrucciones, nombres de host y valores secretos. Cuando un mensaje de estilo LogTape parece contener texto de carga de usuario/chat/herramienta, la exportación conserva solo que se omitió un mensaje y su conteo de bytes.

### `gateway status`

`gateway status` muestra el servicio Gateway (launchd/systemd/schtasks) además de una comprobación opcional de conectividad/capacidad de autenticación.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Opciones:

- `--url <url>`: agrega un destino explícito para la comprobación. El remoto configurado + localhost siguen comprobándose.
- `--token <token>`: autenticación por token para la comprobación.
- `--password <password>`: autenticación por contraseña para la comprobación.
- `--timeout <ms>`: timeout de la comprobación (predeterminado `10000`).
- `--no-probe`: omite la comprobación de conectividad (vista solo del servicio).
- `--deep`: escanea también servicios a nivel del sistema.
- `--require-rpc`: eleva la comprobación predeterminada de conectividad a una comprobación de lectura y sale con código distinto de cero cuando esa comprobación de lectura falla. No se puede combinar con `--no-probe`.

Notas:

- `gateway status` sigue disponible para diagnósticos incluso cuando falta la configuración local de la CLI o es inválida.
- `gateway status` predeterminado prueba el estado del servicio, la conexión WebSocket y la capacidad de autenticación visible en el momento del handshake. No prueba operaciones de lectura/escritura/administración.
- `gateway status` resuelve SecretRefs de autenticación configurados para la comprobación cuando es posible.
- Si un SecretRef de autenticación requerido no se resuelve en la ruta de este comando, `gateway status --json` informa `rpc.authWarning` cuando falla la conectividad/autenticación de la comprobación; pasa `--token`/`--password` explícitamente o resuelve primero el origen del secreto.
- Si la comprobación tiene éxito, se suprimen las advertencias de auth-ref no resueltas para evitar falsos positivos.
- Usa `--require-rpc` en scripts y automatización cuando no basta con que haya un servicio escuchando y necesitas también que las llamadas RPC con alcance de lectura estén sanas.
- `--deep` agrega un escaneo best-effort de instalaciones adicionales de launchd/systemd/schtasks. Cuando se detectan varios servicios tipo Gateway, la salida legible para humanos imprime sugerencias de limpieza y advierte que la mayoría de las configuraciones deberían ejecutar un Gateway por máquina.
- La salida legible para humanos incluye la ruta resuelta del archivo de registro además de la instantánea de rutas/validez de configuración de CLI vs servicio para ayudar a diagnosticar deriva de perfil o directorio de estado.
- En instalaciones Linux con systemd, las comprobaciones de deriva de autenticación del servicio leen valores tanto de `Environment=` como de `EnvironmentFile=` de la unidad (incluyendo `%h`, rutas entrecomilladas, varios archivos y archivos opcionales con `-`).
- Las comprobaciones de deriva resuelven SecretRefs de `gateway.auth.token` usando el entorno fusionado de tiempo de ejecución (primero el entorno del comando de servicio, luego el entorno del proceso como alternativa).
- Si la autenticación por token no está efectivamente activa (modo explícito `gateway.auth.mode` de `password`/`none`/`trusted-proxy`, o modo no establecido donde podría ganar password y ningún candidato de token puede imponerse), las comprobaciones de deriva del token omiten resolver el token de configuración.

### `gateway probe`

`gateway probe` es el comando de “depurarlo todo”. Siempre comprueba:

- tu Gateway remoto configurado (si existe), y
- localhost (loopback) **incluso si hay un remoto configurado**.

Si pasas `--url`, ese destino explícito se agrega antes de ambos. La salida legible para humanos etiqueta los
destinos como:

- `URL (explicit)`
- `Remote (configured)` o `Remote (configured, inactive)`
- `Local loopback`

Si se puede llegar a varios Gateways, los imprime todos. Se admiten varios Gateways cuando usas perfiles/puertos aislados (por ejemplo, un bot de rescate), pero la mayoría de las instalaciones siguen ejecutando un solo Gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Interpretación:

- `Reachable: yes` significa que al menos un destino aceptó una conexión WebSocket.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` informa lo que la comprobación pudo demostrar sobre la autenticación. Es independiente de la accesibilidad.
- `Read probe: ok` significa que también tuvieron éxito las llamadas RPC de detalle con alcance de lectura (`health`/`status`/`system-presence`/`config.get`).
- `Read probe: limited - missing scope: operator.read` significa que la conexión tuvo éxito pero la RPC con alcance de lectura es limitada. Esto se informa como accesibilidad **degradada**, no como fallo total.
- El código de salida es distinto de cero solo cuando ningún destino comprobado es accesible.

Notas de JSON (`--json`):

- Nivel superior:
  - `ok`: al menos un destino es accesible.
  - `degraded`: al menos un destino tuvo RPC de detalle limitada por alcance.
  - `capability`: la mejor capacidad observada entre los destinos accesibles (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
  - `primaryTargetId`: el mejor destino para tratarlo como ganador activo en este orden: URL explícita, túnel SSH, remoto configurado y luego loopback local.
  - `warnings[]`: registros de advertencia best-effort con `code`, `message` y `targetIds` opcionales.
  - `network`: sugerencias de URL de loopback local/tailnet derivadas de la configuración actual y de la red del host.
  - `discovery.timeoutMs` y `discovery.count`: el presupuesto de descubrimiento real y el conteo de resultados usado para este paso de comprobación.
- Por destino (`targets[].connect`):
  - `ok`: accesibilidad después de connect + clasificación degradada.
  - `rpcOk`: éxito completo de RPC de detalle.
  - `scopeLimited`: la RPC de detalle falló debido a la falta del alcance de operador.
- Por destino (`targets[].auth`):
  - `role`: rol de autenticación informado en `hello-ok` cuando está disponible.
  - `scopes`: alcances otorgados informados en `hello-ok` cuando están disponibles.
  - `capability`: la clasificación de capacidad de autenticación mostrada para ese destino.

Códigos de advertencia comunes:

- `ssh_tunnel_failed`: falló la configuración del túnel SSH; el comando recurrió a comprobaciones directas.
- `multiple_gateways`: más de un destino era accesible; esto es inusual a menos que ejecutes intencionalmente perfiles aislados, como un bot de rescate.
- `auth_secretref_unresolved`: no se pudo resolver un SecretRef de autenticación configurado para un destino fallido.
- `probe_scope_limited`: la conexión WebSocket tuvo éxito, pero la comprobación de lectura estuvo limitada por la falta de `operator.read`.

#### Remoto por SSH (paridad con la app de Mac)

El modo «Remote over SSH» de la app de macOS usa un reenvío de puerto local para que el Gateway remoto (que puede estar enlazado solo a loopback) quede accesible en `ws://127.0.0.1:<port>`.

Equivalente en CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Opciones:

- `--ssh <target>`: `user@host` o `user@host:port` (el puerto predeterminado es `22`).
- `--ssh-identity <path>`: archivo de identidad.
- `--ssh-auto`: elige el primer host Gateway descubierto como destino SSH desde el endpoint de descubrimiento resuelto (`local.` más el dominio de área amplia configurado, si existe). Las sugerencias de solo TXT se ignoran.

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
- `--expect-final` es principalmente para RPC de estilo agente que transmiten eventos intermedios antes de una carga final.

## Gestionar el servicio Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

Opciones de los comandos:

- `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart`: `--json`

Notas:

- `gateway install` admite `--port`, `--runtime`, `--token`, `--force`, `--json`.
- Cuando la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, `gateway install` valida que el SecretRef se pueda resolver, pero no conserva el token resuelto en los metadatos del entorno del servicio.
- Si la autenticación por token requiere un token y el SecretRef del token configurado no está resuelto, la instalación falla en modo cerrado en lugar de conservar texto plano alternativo.
- Para autenticación por contraseña en `gateway run`, prefiere `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` respaldado por SecretRef en lugar de `--password` en línea.
- En el modo de autenticación inferido, `OPENCLAW_GATEWAY_PASSWORD` solo del shell no relaja los requisitos de token para la instalación; usa configuración persistente (`gateway.auth.password` o `env` de configuración) al instalar un servicio gestionado.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación se bloquea hasta que el modo se establezca explícitamente.
- Los comandos de ciclo de vida aceptan `--json` para scripting.

## Descubrir Gateways (Bonjour)

`gateway discover` escanea beacons de Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour de área amplia): elige un dominio (ejemplo: `openclaw.internal.`) y configura split DNS + un servidor DNS; consulta [/gateway/bonjour](/es/gateway/bonjour)

Solo los Gateways con descubrimiento Bonjour habilitado (predeterminado) anuncian el beacon.

Los registros de descubrimiento de área amplia incluyen (TXT):

- `role` (sugerencia de rol del Gateway)
- `transport` (sugerencia de transporte, por ejemplo `gateway`)
- `gatewayPort` (puerto WebSocket, normalmente `18789`)
- `sshPort` (opcional; los clientes usan `22` como destino SSH predeterminado cuando falta)
- `tailnetDns` (hostname de MagicDNS, cuando está disponible)
- `gatewayTls` / `gatewayTlsSha256` (TLS habilitado + huella digital del certificado)
- `cliPath` (sugerencia de instalación remota escrita en la zona de área amplia)

### `gateway discover`

```bash
openclaw gateway discover
```

Opciones:

- `--timeout <ms>`: timeout por comando (browse/resolve); predeterminado `2000`.
- `--json`: salida legible por máquina (también deshabilita estilo/spinner).

Ejemplos:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Notas:

- La CLI escanea `local.` más el dominio de área amplia configurado cuando hay uno habilitado.
- `wsUrl` en la salida JSON se deriva del endpoint de servicio resuelto, no de sugerencias de solo TXT como `lanHost` o `tailnetDns`.
- En mDNS `local.`, `sshPort` y `cliPath` solo se difunden cuando `discovery.mdns.mode` es `full`. DNS-SD de área amplia sigue escribiendo `cliPath`; `sshPort` también sigue siendo opcional allí.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Guía operativa del Gateway](/es/gateway)
