---
read_when:
    - Ejecutar el Gateway desde la CLI (desarrollo o servidores)
    - Depurar autenticación, modos de enlace y conectividad del Gateway
    - Descubrir Gateways mediante Bonjour (local + DNS-SD de área amplia)
sidebarTitle: Gateway
summary: CLI del Gateway de OpenClaw (`openclaw gateway`) — ejecutar, consultar y descubrir Gateways
title: Gateway
x-i18n:
    generated_at: "2026-04-26T11:25:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8cdca95676f0b098e2dd79ff4245a32eaae82711ed6c2b7e39522331872cfd9
    source_path: cli/gateway.md
    workflow: 15
---

El Gateway es el servidor WebSocket de OpenClaw (canales, Nodes, sesiones, hooks). Los subcomandos de esta página viven bajo `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Descubrimiento con Bonjour" href="/es/gateway/bonjour">
    Configuración de mDNS local + DNS-SD de área amplia.
  </Card>
  <Card title="Resumen del descubrimiento" href="/es/gateway/discovery">
    Cómo OpenClaw anuncia y encuentra Gateways.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration">
    Claves de configuración de nivel superior del Gateway.
  </Card>
</CardGroup>

## Ejecutar el Gateway

Ejecuta un proceso local de Gateway:

```bash
openclaw gateway
```

Alias en primer plano:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Comportamiento de inicio">
    - De forma predeterminada, el Gateway se niega a iniciarse a menos que `gateway.mode=local` esté configurado en `~/.openclaw/openclaw.json`. Usa `--allow-unconfigured` para ejecuciones ad hoc/de desarrollo.
    - Se espera que `openclaw onboard --mode local` y `openclaw setup` escriban `gateway.mode=local`. Si el archivo existe pero falta `gateway.mode`, trátalo como una configuración dañada o sobrescrita y repáralo en lugar de asumir implícitamente el modo local.
    - Si el archivo existe y falta `gateway.mode`, el Gateway lo trata como un daño sospechoso en la configuración y se niega a “asumir local” por ti.
    - Se bloquea el enlace más allá de local loopback sin autenticación (barandilla de seguridad).
    - `SIGUSR1` activa un reinicio en proceso cuando está autorizado (`commands.restart` está habilitado de forma predeterminada; configura `commands.restart: false` para bloquear el reinicio manual, mientras que gateway tool/config apply/update siguen permitidos).
    - Los manejadores de `SIGINT`/`SIGTERM` detienen el proceso del Gateway, pero no restauran ningún estado personalizado de la terminal. Si encapsulas la CLI con una TUI o entrada en modo raw, restaura la terminal antes de salir.

  </Accordion>
</AccordionGroup>

### Opciones

<ParamField path="--port <port>" type="number">
  Puerto WebSocket (el valor predeterminado proviene de config/env; normalmente `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Modo de enlace del listener.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Anulación del modo de autenticación.
</ParamField>
<ParamField path="--token <token>" type="string">
  Anulación del token (también establece `OPENCLAW_GATEWAY_TOKEN` para el proceso).
</ParamField>
<ParamField path="--password <password>" type="string">
  Anulación de la contraseña.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Lee la contraseña del Gateway desde un archivo.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Expone el Gateway mediante Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Restablece la configuración de serve/funnel de Tailscale al apagar.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Permite iniciar el Gateway sin `gateway.mode=local` en la configuración. Omite la protección de inicio solo para arranque ad hoc/de desarrollo; no escribe ni repara el archivo de configuración.
</ParamField>
<ParamField path="--dev" type="boolean">
  Crea una configuración + espacio de trabajo de desarrollo si faltan (omite `BOOTSTRAP.md`).
</ParamField>
<ParamField path="--reset" type="boolean">
  Restablece la configuración de desarrollo + credenciales + sesiones + espacio de trabajo (requiere `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Mata cualquier listener existente en el puerto seleccionado antes de iniciar.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Registros detallados.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Muestra solo los registros del backend de CLI en la consola (y habilita stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Estilo de registro de WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias de `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Registra eventos de flujo raw del modelo en jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ruta jsonl del flujo raw.
</ParamField>

<Warning>
La opción `--password` en línea puede quedar expuesta en listados locales de procesos. Prefiere `--password-file`, env o un `gateway.auth.password` respaldado por SecretRef.
</Warning>

### Perfilado del inicio

- Establece `OPENCLAW_GATEWAY_STARTUP_TRACE=1` para registrar tiempos de fase durante el inicio del Gateway.
- Ejecuta `pnpm test:startup:gateway -- --runs 5 --warmup 1` para medir el inicio del Gateway. La medición registra la primera salida del proceso, `/healthz`, `/readyz` y los tiempos de traza del inicio.

## Consultar un Gateway en ejecución

Todos los comandos de consulta usan RPC sobre WebSocket.

<Tabs>
  <Tab title="Modos de salida">
    - Predeterminado: legible para humanos (coloreado en TTY).
    - `--json`: JSON legible por máquina (sin estilos/spinner).
    - `--no-color` (o `NO_COLOR=1`): desactiva ANSI manteniendo el diseño para humanos.

  </Tab>
  <Tab title="Opciones compartidas">
    - `--url <url>`: URL WebSocket del Gateway.
    - `--token <token>`: token del Gateway.
    - `--password <password>`: contraseña del Gateway.
    - `--timeout <ms>`: tiempo límite/presupuesto (varía según el comando).
    - `--expect-final`: espera una respuesta “final” (llamadas del agente).

  </Tab>
</Tabs>

<Note>
Cuando configuras `--url`, la CLI no recurre a credenciales de configuración ni de entorno. Pasa `--token` o `--password` explícitamente. La ausencia de credenciales explícitas es un error.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

El endpoint HTTP `/healthz` es una sonda de actividad: devuelve una respuesta una vez que el servidor puede responder por HTTP. El endpoint HTTP `/readyz` es más estricto y permanece en rojo mientras los sidecars de inicio, canales o hooks configurados siguen estabilizándose.

### `gateway usage-cost`

Obtiene resúmenes de costo de uso de los registros de sesión.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Número de días que se incluirán.
</ParamField>

### `gateway stability`

Obtiene el registrador reciente de estabilidad diagnóstica de un Gateway en ejecución.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Número máximo de eventos recientes que se incluirán (máximo `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filtra por tipo de evento diagnóstico, como `payload.large` o `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Incluye solo eventos posteriores a un número de secuencia de diagnóstico.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lee un paquete de estabilidad persistido en lugar de llamar al Gateway en ejecución. Usa `--bundle latest` (o simplemente `--bundle`) para el paquete más reciente bajo el directorio de estado, o pasa directamente una ruta JSON del paquete.
</ParamField>
<ParamField path="--export" type="boolean">
  Escribe un zip compartible de diagnósticos de soporte en lugar de imprimir detalles de estabilidad.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ruta de salida para `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacidad y comportamiento de los paquetes">
    - Los registros conservan metadatos operativos: nombres de eventos, recuentos, tamaños en bytes, lecturas de memoria, estado de cola/sesión, nombres de canal/Plugin y resúmenes de sesión redactados. No conservan texto del chat, cuerpos de Webhook, salidas de herramientas, cuerpos raw de solicitudes o respuestas, tokens, cookies, valores secretos, nombres de host ni IDs raw de sesión. Establece `diagnostics.enabled: false` para desactivar completamente el registrador.
    - En salidas fatales del Gateway, tiempos de espera de apagado y fallos de inicio durante reinicio, OpenClaw escribe la misma instantánea diagnóstica en `~/.openclaw/logs/stability/openclaw-stability-*.json` cuando el registrador tiene eventos. Inspecciona el paquete más reciente con `openclaw gateway stability --bundle latest`; `--limit`, `--type` y `--since-seq` también se aplican a la salida del paquete.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Escribe un archivo zip local de diagnósticos diseñado para adjuntarse a informes de errores. Para el modelo de privacidad y el contenido del paquete, consulta [Exportación de diagnósticos](/es/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ruta de salida del zip. De forma predeterminada, usa una exportación de soporte en el directorio de estado.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Número máximo de líneas de registro saneadas que se incluirán.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Número máximo de bytes de registro que se inspeccionarán.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket del Gateway para la instantánea de estado/actividad.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token del Gateway para la instantánea de estado/actividad.
</ParamField>
<ParamField path="--password <password>" type="string">
  Contraseña del Gateway para la instantánea de estado/actividad.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Tiempo límite de la instantánea de estado/actividad.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Omite la búsqueda del paquete de estabilidad persistido.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprime la ruta escrita, el tamaño y el manifiesto como JSON.
</ParamField>

La exportación contiene un manifiesto, un resumen en Markdown, la forma de la configuración, detalles de configuración saneados, resúmenes saneados de registros, instantáneas saneadas de estado/actividad del Gateway y el paquete de estabilidad más reciente cuando existe.

Está pensada para compartirse. Conserva detalles operativos que ayudan en la depuración, como campos seguros de registros de OpenClaw, nombres de subsistemas, códigos de estado, duraciones, modos configurados, puertos, IDs de Plugin, IDs de provider, ajustes de funciones no secretas y mensajes redactados de registros operativos. Omite o redacta texto del chat, cuerpos de Webhook, salidas de herramientas, credenciales, cookies, identificadores de cuenta/mensaje, texto de prompts/instrucciones, nombres de host y valores secretos. Cuando un mensaje de estilo LogTape parece texto de carga de usuario/chat/herramienta, la exportación conserva solo que se omitió un mensaje más su recuento de bytes.

### `gateway status`

`gateway status` muestra el servicio del Gateway (launchd/systemd/schtasks) más una sonda opcional de capacidad de conectividad/autenticación.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Añade un destino explícito de sonda. El remoto configurado + localhost siguen sondeándose.
</ParamField>
<ParamField path="--token <token>" type="string">
  Autenticación por token para la sonda.
</ParamField>
<ParamField path="--password <password>" type="string">
  Autenticación por contraseña para la sonda.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Tiempo límite de la sonda.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Omite la sonda de conectividad (vista solo del servicio).
</ParamField>
<ParamField path="--deep" type="boolean">
  Escanea también servicios a nivel del sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Eleva la sonda de conectividad predeterminada a una sonda de lectura y sale con código distinto de cero cuando esa sonda de lectura falla. No puede combinarse con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semántica de estado">
    - `gateway status` sigue disponible para diagnósticos incluso cuando falta la configuración local de la CLI o no es válida.
    - `gateway status` predeterminado demuestra el estado del servicio, la conexión WebSocket y la capacidad de autenticación visible en el momento del handshake. No demuestra operaciones de lectura/escritura/administración.
    - Las sondas de diagnóstico no mutan la autenticación del dispositivo en el primer uso: reutilizan un token de dispositivo almacenado en caché cuando existe, pero no crean una nueva identidad de dispositivo de CLI ni un registro de emparejamiento de dispositivo de solo lectura solo para comprobar el estado.
    - `gateway status` resuelve los SecretRefs de autenticación configurados para la autenticación de la sonda cuando es posible.
    - Si un SecretRef de autenticación requerido no se resuelve en esta ruta del comando, `gateway status --json` informa `rpc.authWarning` cuando falla la conectividad/autenticación de la sonda; pasa `--token`/`--password` explícitamente o resuelve primero la fuente del secreto.
    - Si la sonda tiene éxito, las advertencias de referencias de autenticación no resueltas se suprimen para evitar falsos positivos.
    - Usa `--require-rpc` en scripts y automatización cuando un servicio en escucha no sea suficiente y también necesites que las llamadas RPC con alcance de lectura estén en buen estado.
    - `--deep` añade una exploración en el mejor esfuerzo para instalaciones adicionales de launchd/systemd/schtasks. Cuando se detectan varios servicios tipo Gateway, la salida para humanos imprime sugerencias de limpieza y advierte que la mayoría de las configuraciones deberían ejecutar un Gateway por máquina.
    - La salida para humanos incluye la ruta resuelta del registro en archivo más la instantánea de rutas/validez de configuración de CLI frente al servicio para ayudar a diagnosticar desviaciones de perfil o del directorio de estado.

  </Accordion>
  <Accordion title="Comprobaciones de desviación de autenticación de Linux systemd">
    - En instalaciones con Linux systemd, las comprobaciones de desviación de autenticación del servicio leen los valores `Environment=` y `EnvironmentFile=` de la unidad (incluidos `%h`, rutas entre comillas, varios archivos y archivos opcionales con `-`).
    - Las comprobaciones de desviación resuelven los SecretRefs de `gateway.auth.token` usando el entorno combinado del runtime (primero el entorno del comando del servicio y luego el entorno del proceso como respaldo).
    - Si la autenticación por token no está efectivamente activa (modo explícito `gateway.auth.mode` de `password`/`none`/`trusted-proxy`, o modo no establecido donde puede ganar password y ningún candidato de token puede ganar), las comprobaciones de desviación de token omiten la resolución del token de configuración.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` es el comando para “depurarlo todo”. Siempre sondea:

- tu Gateway remoto configurado (si está establecido), y
- localhost (loopback) **incluso si hay un remoto configurado**.

Si pasas `--url`, ese destino explícito se añade antes que ambos. La salida para humanos etiqueta los destinos como:

- `URL (explicit)`
- `Remote (configured)` o `Remote (configured, inactive)`
- `Local loopback`

<Note>
Si hay varios Gateways accesibles, los imprime todos. Se admiten varios Gateways cuando usas perfiles/puertos aislados (por ejemplo, un bot de rescate), pero la mayoría de las instalaciones siguen ejecutando un único Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretación">
    - `Reachable: yes` significa que al menos un destino aceptó una conexión WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` informa qué pudo demostrar la sonda sobre la autenticación. Es independiente de la accesibilidad.
    - `Read probe: ok` significa que las llamadas RPC de detalle con alcance de lectura (`health`/`status`/`system-presence`/`config.get`) también tuvieron éxito.
    - `Read probe: limited - missing scope: operator.read` significa que la conexión tuvo éxito, pero la RPC con alcance de lectura es limitada. Esto se informa como accesibilidad **degradada**, no como fallo total.
    - Igual que `gateway status`, la sonda reutiliza la autenticación de dispositivo almacenada en caché, pero no crea identidad de dispositivo de primer uso ni estado de emparejamiento.
    - El código de salida es distinto de cero solo cuando ningún destino sondeado es accesible.

  </Accordion>
  <Accordion title="Salida JSON">
    Nivel superior:

    - `ok`: al menos un destino es accesible.
    - `degraded`: al menos un destino tenía RPC de detalle limitada por alcance.
    - `capability`: la mejor capacidad observada entre los destinos accesibles (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: el mejor destino para tratar como ganador activo en este orden: URL explícita, túnel SSH, remoto configurado y luego local loopback.
    - `warnings[]`: registros de advertencia en el mejor esfuerzo con `code`, `message` y `targetIds` opcionales.
    - `network`: sugerencias de URL de local loopback/tailnet derivadas de la configuración actual y de la red del host.
    - `discovery.timeoutMs` y `discovery.count`: el presupuesto/resultado real de descubrimiento usado en esta pasada de sonda.

    Por destino (`targets[].connect`):

    - `ok`: accesibilidad tras conectar + clasificación degradada.
    - `rpcOk`: éxito completo de la RPC de detalle.
    - `scopeLimited`: la RPC de detalle falló por falta de alcance de operator.

    Por destino (`targets[].auth`):

    - `role`: rol de autenticación informado en `hello-ok` cuando está disponible.
    - `scopes`: alcances concedidos informados en `hello-ok` cuando están disponibles.
    - `capability`: la clasificación expuesta de capacidad de autenticación para ese destino.

  </Accordion>
  <Accordion title="Códigos de advertencia comunes">
    - `ssh_tunnel_failed`: falló la configuración del túnel SSH; el comando recurrió a sondas directas.
    - `multiple_gateways`: más de un destino era accesible; esto es inusual salvo que ejecutes intencionadamente perfiles aislados, como un bot de rescate.
    - `auth_secretref_unresolved`: no se pudo resolver un SecretRef de autenticación configurado para un destino fallido.
    - `probe_scope_limited`: la conexión WebSocket tuvo éxito, pero la sonda de lectura estuvo limitada por falta de `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto mediante SSH (paridad con la app de Mac)

El modo “Remote over SSH” de la app de macOS usa un reenvío de puerto local para que el Gateway remoto (que puede estar enlazado solo a loopback) sea accesible en `ws://127.0.0.1:<port>`.

Equivalente en CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` o `user@host:port` (el puerto predeterminado es `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Archivo de identidad.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Elige el primer host Gateway descubierto como destino SSH desde el endpoint de descubrimiento resuelto (`local.` más el dominio de área amplia configurado, si lo hay). Las sugerencias solo-TXT se ignoran.
</ParamField>

Configuración (opcional, usada como valores predeterminados):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Asistente RPC de bajo nivel.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Cadena de objeto JSON para los parámetros.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket del Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token del Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  Contraseña del Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Presupuesto de tiempo límite.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Principalmente para RPC de estilo agente que transmiten eventos intermedios antes de una carga final.
</ParamField>
<ParamField path="--json" type="boolean">
  Salida JSON legible por máquina.
</ParamField>

<Note>
`--params` debe ser JSON válido.
</Note>

## Gestionar el servicio Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

<AccordionGroup>
  <Accordion title="Opciones de comando">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="Notas sobre instalación y ciclo de vida del servicio">
    - `gateway install` admite `--port`, `--runtime`, `--token`, `--force`, `--json`.
    - Usa `gateway restart` para reiniciar un servicio gestionado. No encadenes `gateway stop` y `gateway start` como sustituto de reinicio; en macOS, `gateway stop` deshabilita intencionadamente el LaunchAgent antes de detenerlo.
    - Cuando la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, `gateway install` valida que el SecretRef pueda resolverse, pero no persiste el token resuelto en los metadatos del entorno del servicio.
    - Si la autenticación por token requiere un token y el SecretRef del token configurado no está resuelto, la instalación falla de forma segura en lugar de persistir texto sin formato de respaldo.
    - Para la autenticación por contraseña en `gateway run`, prefiere `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` respaldado por SecretRef en lugar de `--password` en línea.
    - En modo de autenticación inferido, `OPENCLAW_GATEWAY_PASSWORD` solo del shell no relaja los requisitos de token de instalación; usa configuración duradera (`gateway.auth.password` o `env` de configuración) al instalar un servicio gestionado.
    - Si `gateway.auth.token` y `gateway.auth.password` están ambos configurados y `gateway.auth.mode` no está establecido, la instalación se bloquea hasta que el modo se establezca explícitamente.
    - Los comandos de ciclo de vida aceptan `--json` para scripting.

  </Accordion>
</AccordionGroup>

## Descubrir Gateways (Bonjour)

`gateway discover` explora balizas de Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Bonjour de área amplia): elige un dominio (ejemplo: `openclaw.internal.`) y configura split DNS + un servidor DNS; consulta [Bonjour](/es/gateway/bonjour).

Solo los Gateways con descubrimiento Bonjour habilitado (predeterminado) anuncian la baliza.

Los registros de descubrimiento de área amplia incluyen (TXT):

- `role` (sugerencia de rol del Gateway)
- `transport` (sugerencia de transporte, p. ej. `gateway`)
- `gatewayPort` (puerto WebSocket, normalmente `18789`)
- `sshPort` (opcional; los clientes usan `22` como predeterminado para destinos SSH cuando no está presente)
- `tailnetDns` (nombre de host MagicDNS, cuando está disponible)
- `gatewayTls` / `gatewayTlsSha256` (TLS habilitado + huella del certificado)
- `cliPath` (sugerencia de instalación remota escrita en la zona de área amplia)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Tiempo límite por comando (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Salida legible por máquina (también desactiva estilos/spinner).
</ParamField>

Ejemplos:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- La CLI explora `local.` más el dominio de área amplia configurado cuando hay uno habilitado.
- `wsUrl` en la salida JSON se deriva del endpoint de servicio resuelto, no de sugerencias solo-TXT como `lanHost` o `tailnetDns`.
- En mDNS `local.`, `sshPort` y `cliPath` solo se difunden cuando `discovery.mdns.mode` es `full`. El DNS-SD de área amplia sigue escribiendo `cliPath`; `sshPort` también sigue siendo opcional allí.

</Note>

## Relacionado

- [Referencia de CLI](/es/cli)
- [Runbook del Gateway](/es/gateway)
