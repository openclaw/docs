---
read_when:
    - Ejecución del Gateway desde la CLI (desarrollo o servidores)
    - Depuración de la autenticación del Gateway, los modos de enlace y la conectividad
    - Descubrimiento de Gateway mediante Bonjour (DNS-SD local y de área amplia)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — ejecuta, consulta y descubre instancias de Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-02T22:17:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7f948a8f0ee6e065afa02f354e690ad5cc4f71bdb8b8674f1b0396c439ab242
    source_path: cli/gateway.md
    workflow: 16
---

El Gateway es el servidor WebSocket de OpenClaw (canales, nodos, sesiones, hooks). Los subcomandos de esta página están bajo `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Descubrimiento Bonjour" href="/es/gateway/bonjour">
    Configuración de mDNS local + DNS-SD de área amplia.
  </Card>
  <Card title="Resumen del descubrimiento" href="/es/gateway/discovery">
    Cómo OpenClaw anuncia y encuentra gateways.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration">
    Claves de configuración de nivel superior del gateway.
  </Card>
</CardGroup>

## Ejecutar el Gateway

Ejecuta un proceso Gateway local:

```bash
openclaw gateway
```

Alias en primer plano:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Comportamiento de inicio">
    - De forma predeterminada, el Gateway se niega a iniciarse a menos que `gateway.mode=local` esté definido en `~/.openclaw/openclaw.json`. Usa `--allow-unconfigured` para ejecuciones ad hoc/de desarrollo.
    - Se espera que `openclaw onboard --mode local` y `openclaw setup` escriban `gateway.mode=local`. Si el archivo existe pero falta `gateway.mode`, trátalo como una configuración rota o sobrescrita y repárala en lugar de asumir implícitamente el modo local.
    - Si el archivo existe y falta `gateway.mode`, el Gateway lo trata como un daño de configuración sospechoso y se niega a "adivinar local" por ti.
    - Se bloquea el enlace más allá de loopback sin autenticación (barrera de seguridad).
    - `SIGUSR1` activa un reinicio dentro del proceso cuando está autorizado (`commands.restart` está habilitado de forma predeterminada; define `commands.restart: false` para bloquear el reinicio manual, mientras que la aplicación/actualización de herramientas/configuración del gateway sigue permitida).
    - Los manejadores de `SIGINT`/`SIGTERM` detienen el proceso del gateway, pero no restauran ningún estado personalizado de la terminal. Si envuelves la CLI con una TUI o entrada en modo raw, restaura la terminal antes de salir.

  </Accordion>
</AccordionGroup>

### Opciones

<ParamField path="--port <port>" type="number">
  Puerto WebSocket (el valor predeterminado viene de la configuración/env; normalmente `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Modo de enlace del listener.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Anulación del modo de autenticación.
</ParamField>
<ParamField path="--token <token>" type="string">
  Anulación del token (también define `OPENCLAW_GATEWAY_TOKEN` para el proceso).
</ParamField>
<ParamField path="--password <password>" type="string">
  Anulación de la contraseña.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Lee la contraseña del gateway desde un archivo.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Expón el Gateway mediante Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Restablece la configuración serve/funnel de Tailscale al apagar.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Permite iniciar el gateway sin `gateway.mode=local` en la configuración. Omite la protección de inicio solo para arranques ad hoc/de desarrollo; no escribe ni repara el archivo de configuración.
</ParamField>
<ParamField path="--dev" type="boolean">
  Crea una configuración de desarrollo + workspace si faltan (omite BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Restablece la configuración de desarrollo + credenciales + sesiones + workspace (requiere `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Termina cualquier listener existente en el puerto seleccionado antes de iniciar.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Registros detallados.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Muestra solo los registros del backend de la CLI en la consola (y habilita stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Estilo de registro de WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias de `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Registra eventos raw del stream del modelo en jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ruta jsonl del stream raw.
</ParamField>

<Warning>
`--password` en línea puede quedar expuesto en los listados de procesos locales. Prefiere `--password-file`, env o un `gateway.auth.password` respaldado por SecretRef.
</Warning>

### Perfilado de inicio

- Define `OPENCLAW_GATEWAY_STARTUP_TRACE=1` para registrar los tiempos de las fases durante el inicio del Gateway, incluido el retraso `eventLoopMax` por fase y los tiempos de las tablas de búsqueda de plugins para el índice instalado, el registro de manifiestos, la planificación de inicio y el trabajo del mapa de propietarios.
- Define `OPENCLAW_DIAGNOSTICS=timeline` con `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` para escribir una línea de tiempo de diagnósticos de inicio JSONL de mejor esfuerzo para arneses de QA externos. También puedes habilitar la marca con `diagnostics.flags: ["timeline"]` en la configuración; la ruta sigue proporcionándose mediante env. Añade `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` para incluir muestras del bucle de eventos.
- Ejecuta `pnpm test:startup:gateway -- --runs 5 --warmup 1` para medir el inicio del Gateway. La medición registra la primera salida del proceso, `/healthz`, `/readyz`, los tiempos de trazas de inicio, el retraso del bucle de eventos y los detalles de tiempos de la tabla de búsqueda de plugins.

## Consultar un Gateway en ejecución

Todos los comandos de consulta usan RPC por WebSocket.

<Tabs>
  <Tab title="Modos de salida">
    - Predeterminado: legible para humanos (con color en TTY).
    - `--json`: JSON legible por máquina (sin estilos/spinner).
    - `--no-color` (o `NO_COLOR=1`): deshabilita ANSI manteniendo el diseño humano.

  </Tab>
  <Tab title="Opciones compartidas">
    - `--url <url>`: URL WebSocket del Gateway.
    - `--token <token>`: token del Gateway.
    - `--password <password>`: contraseña del Gateway.
    - `--timeout <ms>`: timeout/presupuesto (varía por comando).
    - `--expect-final`: espera una respuesta "final" (llamadas de agente).

  </Tab>
</Tabs>

<Note>
Cuando defines `--url`, la CLI no recurre a credenciales de configuración o entorno. Pasa `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

El endpoint HTTP `/healthz` es una sonda de vivacidad: responde cuando el servidor puede contestar HTTP. El endpoint HTTP `/readyz` es más estricto y permanece en rojo mientras los sidecars de plugins de inicio, los canales o los hooks configurados todavía se están estabilizando. Las respuestas detalladas de preparación locales o autenticadas incluyen un bloque de diagnóstico `eventLoop` con retraso del bucle de eventos, utilización del bucle de eventos, proporción de núcleos de CPU y una marca `degraded`.

### `gateway usage-cost`

Obtén resúmenes de coste de uso desde los registros de sesión.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Número de días que se incluirán.
</ParamField>

### `gateway stability`

Obtén el registrador de estabilidad de diagnósticos reciente desde un Gateway en ejecución.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Número máximo de eventos recientes que se incluirán (máx. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filtra por tipo de evento de diagnóstico, como `payload.large` o `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Incluye solo eventos posteriores a un número de secuencia de diagnóstico.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lee un paquete de estabilidad persistido en lugar de llamar al Gateway en ejecución. Usa `--bundle latest` (o solo `--bundle`) para el paquete más reciente bajo el directorio de estado, o pasa directamente una ruta JSON del paquete.
</ParamField>
<ParamField path="--export" type="boolean">
  Escribe un zip de diagnósticos de soporte compartible en lugar de imprimir los detalles de estabilidad.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ruta de salida para `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacidad y comportamiento del paquete">
    - Los registros conservan metadatos operativos: nombres de eventos, conteos, tamaños en bytes, lecturas de memoria, estado de colas/sesiones, nombres de canales/plugins y resúmenes de sesión redactados. No conservan texto de chat, cuerpos de webhook, salidas de herramientas, cuerpos raw de solicitudes o respuestas, tokens, cookies, valores secretos, nombres de host ni ids raw de sesión. Define `diagnostics.enabled: false` para deshabilitar por completo el registrador.
    - En salidas fatales del Gateway, timeouts de apagado y fallos de inicio tras reinicio, OpenClaw escribe la misma instantánea de diagnóstico en `~/.openclaw/logs/stability/openclaw-stability-*.json` cuando el registrador tiene eventos. Inspecciona el paquete más reciente con `openclaw gateway stability --bundle latest`; `--limit`, `--type` y `--since-seq` también se aplican a la salida del paquete.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Escribe un zip local de diagnósticos diseñado para adjuntarse a informes de errores. Para el modelo de privacidad y el contenido del paquete, consulta [Exportación de diagnósticos](/es/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ruta del zip de salida. El valor predeterminado es una exportación de soporte bajo el directorio de estado.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Máximo de líneas de registro saneadas que se incluirán.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Máximo de bytes de registro que se inspeccionarán.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket del Gateway para la instantánea de salud.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token del Gateway para la instantánea de salud.
</ParamField>
<ParamField path="--password <password>" type="string">
  Contraseña del Gateway para la instantánea de salud.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout de la instantánea de estado/salud.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Omite la búsqueda del paquete de estabilidad persistido.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprime la ruta escrita, el tamaño y el manifiesto como JSON.
</ParamField>

La exportación contiene un manifiesto, un resumen en Markdown, la forma de la configuración, detalles de configuración saneados, resúmenes de registros saneados, instantáneas saneadas de estado/salud del Gateway y el paquete de estabilidad más reciente cuando existe.

Está pensada para compartirse. Conserva detalles operativos que ayudan a depurar, como campos seguros de registros de OpenClaw, nombres de subsistemas, códigos de estado, duraciones, modos configurados, puertos, ids de plugins, ids de proveedores, ajustes de funciones no secretos y mensajes de registro operativos redactados. Omite o redacta texto de chat, cuerpos de webhook, salidas de herramientas, credenciales, cookies, identificadores de cuenta/mensaje, texto de prompts/instrucciones, nombres de host y valores secretos. Cuando un mensaje de estilo LogTape parece texto de payload de usuario/chat/herramienta, la exportación conserva solo que se omitió un mensaje y su conteo de bytes.

### `gateway status`

`gateway status` muestra el servicio Gateway (launchd/systemd/schtasks) más una sonda opcional de conectividad/capacidad de autenticación.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Añade un destino de sonda explícito. El remoto configurado + localhost siguen sondeándose.
</ParamField>
<ParamField path="--token <token>" type="string">
  Autenticación por token para la sonda.
</ParamField>
<ParamField path="--password <password>" type="string">
  Autenticación por contraseña para la sonda.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Timeout de la sonda.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Omite la sonda de conectividad (vista solo del servicio).
</ParamField>
<ParamField path="--deep" type="boolean">
  Escanea también servicios de nivel de sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Actualiza la sonda de conectividad predeterminada a una sonda de lectura y sale con código distinto de cero cuando esa sonda de lectura falla. No se puede combinar con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - `gateway status` permanece disponible para diagnósticos incluso cuando falta la configuración local de la CLI o no es válida.
    - El `gateway status` predeterminado comprueba el estado del servicio, la conexión WebSocket y la capacidad de autenticación visible en el momento del handshake. No comprueba operaciones de lectura/escritura/administración.
    - Las sondas de diagnóstico no mutan la autenticación de dispositivos por primera vez: reutilizan un token de dispositivo almacenado en caché existente cuando existe, pero no crean una nueva identidad de dispositivo de la CLI ni un registro de emparejamiento de dispositivo de solo lectura solo para comprobar el estado.
    - `gateway status` resuelve los SecretRefs de autenticación configurados para la autenticación de la sonda cuando es posible.
    - Si un SecretRef de autenticación requerido no se resuelve en esta ruta de comando, `gateway status --json` informa `rpc.authWarning` cuando la conectividad/autenticación de la sonda falla; pasa `--token`/`--password` explícitamente o resuelve primero el origen del secreto.
    - Si la sonda se completa correctamente, las advertencias de referencias de autenticación sin resolver se suprimen para evitar falsos positivos.
    - Usa `--require-rpc` en scripts y automatización cuando un servicio en escucha no sea suficiente y también necesites que las llamadas RPC con alcance de lectura estén saludables.
    - `--deep` añade un escaneo de mejor esfuerzo en busca de instalaciones launchd/systemd/schtasks adicionales. Cuando se detectan varios servicios similares a gateway, la salida para humanos imprime sugerencias de limpieza y advierte que la mayoría de las configuraciones deberían ejecutar un gateway por máquina.
    - La salida para humanos incluye la ruta resuelta del registro de archivo más una instantánea de las rutas/validez de configuración entre la CLI y el servicio para ayudar a diagnosticar desviaciones de perfil o directorio de estado.

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - En instalaciones Linux systemd, las comprobaciones de desviación de autenticación del servicio leen los valores `Environment=` y `EnvironmentFile=` de la unidad (incluidos `%h`, rutas entre comillas, varios archivos y archivos opcionales con `-`).
    - Las comprobaciones de desviación resuelven los SecretRefs de `gateway.auth.token` usando el entorno de runtime combinado (primero el entorno del comando del servicio y luego el entorno del proceso como alternativa).
    - Si la autenticación por token no está activa de forma efectiva (`gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, o modo no definido donde la contraseña puede ganar y ningún candidato de token puede ganar), las comprobaciones de desviación de token omiten la resolución del token de configuración.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` es el comando para "depurarlo todo". Siempre sondea:

- tu gateway remoto configurado (si está definido), y
- localhost (loopback) **incluso si el remoto está configurado**.

Si pasas `--url`, ese destino explícito se añade antes de ambos. La salida para humanos etiqueta los destinos como:

- `URL (explicit)`
- `Remote (configured)` o `Remote (configured, inactive)`
- `Local loopback`

<Note>
Si se puede acceder a varios gateways, los imprime todos. Se admiten varios gateways cuando usas perfiles/puertos aislados (por ejemplo, un bot de rescate), pero la mayoría de las instalaciones siguen ejecutando un único gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` significa que al menos un destino aceptó una conexión WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` informa lo que la sonda pudo comprobar sobre la autenticación. Es independiente de la accesibilidad.
    - `Read probe: ok` significa que las llamadas RPC de detalle con alcance de lectura (`health`/`status`/`system-presence`/`config.get`) también se completaron correctamente.
    - `Read probe: limited - missing scope: operator.read` significa que la conexión se completó correctamente, pero el RPC con alcance de lectura está limitado. Esto se informa como accesibilidad **degradada**, no como fallo completo.
    - `Read probe: failed` después de `Connect: ok` significa que el Gateway aceptó la conexión WebSocket, pero los diagnósticos de lectura posteriores agotaron el tiempo o fallaron. Esto también es accesibilidad **degradada**, no un Gateway inaccesible.
    - Como `gateway status`, la sonda reutiliza la autenticación de dispositivo almacenada en caché existente, pero no crea una identidad de dispositivo por primera vez ni estado de emparejamiento.
    - El código de salida solo es distinto de cero cuando no se puede acceder a ningún destino sondeado.

  </Accordion>
  <Accordion title="JSON output">
    Nivel superior:

    - `ok`: se puede acceder a al menos un destino.
    - `degraded`: al menos un destino aceptó una conexión pero no completó todos los diagnósticos RPC de detalle.
    - `capability`: mejor capacidad observada entre los destinos accesibles (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: mejor destino para tratar como ganador activo en este orden: URL explícita, túnel SSH, remoto configurado y luego local loopback.
    - `warnings[]`: registros de advertencia de mejor esfuerzo con `code`, `message` y `targetIds` opcional.
    - `network`: sugerencias de URL de local loopback/tailnet derivadas de la configuración actual y la red del host.
    - `discovery.timeoutMs` y `discovery.count`: el presupuesto de descubrimiento real/recuento de resultados usado para esta pasada de sondeo.

    Por destino (`targets[].connect`):

    - `ok`: accesibilidad después de la conexión + clasificación degradada.
    - `rpcOk`: éxito completo de RPC de detalle.
    - `scopeLimited`: el RPC de detalle falló por falta de alcance de operador.

    Por destino (`targets[].auth`):

    - `role`: rol de autenticación informado en `hello-ok` cuando está disponible.
    - `scopes`: alcances concedidos informados en `hello-ok` cuando están disponibles.
    - `capability`: la clasificación de capacidad de autenticación expuesta para ese destino.

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: falló la configuración del túnel SSH; el comando recurrió a sondas directas.
    - `multiple_gateways`: se pudo acceder a más de un destino; esto es inusual salvo que ejecutes intencionalmente perfiles aislados, como un bot de rescate.
    - `auth_secretref_unresolved`: no se pudo resolver un SecretRef de autenticación configurado para un destino fallido.
    - `probe_scope_limited`: la conexión WebSocket se completó correctamente, pero la sonda de lectura quedó limitada por la falta de `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto por SSH (paridad con la app de Mac)

El modo "Remote over SSH" de la app de macOS usa un reenvío de puerto local para que el gateway remoto (que puede estar enlazado solo a loopback) sea accesible en `ws://127.0.0.1:<port>`.

Equivalente de la CLI:

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
  Elige el primer host de gateway descubierto como destino SSH desde el endpoint de descubrimiento resuelto (`local.` más el dominio de área amplia configurado, si existe). Las sugerencias solo TXT se ignoran.
</ParamField>

Configuración (opcional, usada como valores predeterminados):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Ayudante RPC de bajo nivel.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Cadena de objeto JSON para params.
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
  Presupuesto de tiempo de espera.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Principalmente para RPCs de estilo agente que transmiten eventos intermedios antes de una carga útil final.
</ParamField>
<ParamField path="--json" type="boolean">
  Salida JSON legible por máquinas.
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

### Instalar con un wrapper

Usa `--wrapper` cuando el servicio gestionado deba iniciarse mediante otro ejecutable, por ejemplo una
capa de gestor de secretos o un ayudante de ejecución como otro usuario. El wrapper recibe los argumentos normales del Gateway y es
responsable de ejecutar finalmente `openclaw` o Node con esos argumentos.

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

También puedes definir el wrapper mediante el entorno. `gateway install` valida que la ruta sea
un archivo ejecutable, escribe el wrapper en `ProgramArguments` del servicio y conserva
`OPENCLAW_WRAPPER` en el entorno del servicio para reinstalaciones forzadas, actualizaciones y reparaciones de doctor
posteriores.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Para eliminar un wrapper persistido, borra `OPENCLAW_WRAPPER` al reinstalar:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Command options">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - Usa `gateway restart` para reiniciar un servicio gestionado. No encadenes `gateway stop` y `gateway start` como sustituto de reinicio; en macOS, `gateway stop` deshabilita intencionalmente el LaunchAgent antes de detenerlo.
    - `gateway restart --wait 30s` reemplaza el presupuesto de drenaje de reinicio configurado para ese reinicio. Los números sin unidad son milisegundos; se aceptan unidades como `s`, `m` y `h`. `--wait 0` espera indefinidamente.
    - `gateway restart --force` omite el drenaje de trabajo activo y reinicia inmediatamente. Úsalo cuando un operador ya haya inspeccionado los bloqueadores de tareas enumerados y quiera recuperar el gateway ahora.
    - Los comandos de ciclo de vida aceptan `--json` para scripting.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - Cuando la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, `gateway install` valida que el SecretRef se pueda resolver, pero no conserva el token resuelto en los metadatos del entorno del servicio.
    - Si la autenticación por token requiere un token y el SecretRef de token configurado no se resuelve, la instalación falla de forma cerrada en lugar de conservar texto plano alternativo.
    - Para autenticación por contraseña en `gateway run`, prefiere `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` respaldado por SecretRef en lugar de `--password` inline.
    - En modo de autenticación inferido, `OPENCLAW_GATEWAY_PASSWORD` solo en shell no relaja los requisitos de token de instalación; usa configuración duradera (`gateway.auth.password` o `env` de configuración) al instalar un servicio gestionado.
    - Si `gateway.auth.token` y `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación queda bloqueada hasta que el modo se defina explícitamente.

  </Accordion>
</AccordionGroup>

## Descubrir gateways (Bonjour)

`gateway discover` escanea beacons del Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour de área amplia): elige un dominio (ejemplo: `openclaw.internal.`) y configura DNS dividido + un servidor DNS; consulta [Bonjour](/es/gateway/bonjour).

Solo los gateways con descubrimiento Bonjour habilitado (predeterminado) anuncian el beacon.

Los registros de descubrimiento de área amplia incluyen (TXT):

- `role` (sugerencia de rol de gateway)
- `transport` (sugerencia de transporte, por ejemplo `gateway`)
- `gatewayPort` (puerto WebSocket, normalmente `18789`)
- `sshPort` (opcional; los clientes usan por defecto destinos SSH en `22` cuando está ausente)
- `tailnetDns` (nombre de host MagicDNS, cuando está disponible)
- `gatewayTls` / `gatewayTlsSha256` (TLS habilitado + huella digital del certificado)
- `cliPath` (sugerencia de instalación remota escrita en la zona de área amplia)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Tiempo de espera por comando (exploración/resolución).
</ParamField>
<ParamField path="--json" type="boolean">
  Salida legible por máquina (también desactiva el estilo/spinner).
</ParamField>

Ejemplos:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- La CLI analiza `local.` además del dominio de área amplia configurado cuando hay uno habilitado.
- `wsUrl` en la salida JSON se deriva del extremo de servicio resuelto, no de indicaciones solo de TXT como `lanHost` o `tailnetDns`.
- En mDNS `local.`, `sshPort` y `cliPath` solo se anuncian cuando `discovery.mdns.mode` es `full`. DNS-SD de área amplia sigue escribiendo `cliPath`; `sshPort` también sigue siendo opcional allí.

</Note>

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Manual operativo de Gateway](/es/gateway)
