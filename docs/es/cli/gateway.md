---
read_when:
    - Ejecutar el Gateway desde la CLI (desarrollo o servidores)
    - Depuración de la autenticación del Gateway, los modos de enlace y la conectividad
    - Descubrimiento de Gateways mediante Bonjour (local + DNS-SD de área amplia)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — ejecutar, consultar y descubrir Gateways
title: Gateway
x-i18n:
    generated_at: "2026-05-12T12:50:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b19babe545895b8a5fc4b49bef5a0f9103091795f3e3c9bbcdf9ba9d7784538
    source_path: cli/gateway.md
    workflow: 16
---

El Gateway es el servidor WebSocket de OpenClaw (canales, nodos, sesiones, hooks). Los subcomandos de esta página se encuentran bajo `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Descubrimiento Bonjour" href="/es/gateway/bonjour">
    Configuración de mDNS local + DNS-SD de área amplia.
  </Card>
  <Card title="Descripción general del descubrimiento" href="/es/gateway/discovery">
    Cómo OpenClaw anuncia y encuentra gateways.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration">
    Claves de configuración de gateway de nivel superior.
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
    - De forma predeterminada, el Gateway se niega a iniciarse a menos que `gateway.mode=local` esté establecido en `~/.openclaw/openclaw.json`. Usa `--allow-unconfigured` para ejecuciones ad hoc/de desarrollo.
    - Se espera que `openclaw onboard --mode local` y `openclaw setup` escriban `gateway.mode=local`. Si el archivo existe pero falta `gateway.mode`, trata eso como una configuración rota o sobrescrita y repárala en lugar de asumir implícitamente el modo local.
    - Si el archivo existe y falta `gateway.mode`, el Gateway lo trata como un daño sospechoso de configuración y se niega a "adivinar local" por ti.
    - Se bloquea el enlace más allá de loopback sin autenticación (barrera de seguridad).
    - `SIGUSR1` activa un reinicio dentro del proceso cuando está autorizado (`commands.restart` está habilitado de forma predeterminada; establece `commands.restart: false` para bloquear el reinicio manual, mientras que aplicar/actualizar la herramienta/configuración del gateway sigue permitido).
    - Los manejadores `SIGINT`/`SIGTERM` detienen el proceso del gateway, pero no restauran ningún estado personalizado del terminal. Si envuelves la CLI con una TUI o entrada en modo raw, restaura el terminal antes de salir.

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
  Sobrescritura del modo de autenticación.
</ParamField>
<ParamField path="--token <token>" type="string">
  Sobrescritura del token (también establece `OPENCLAW_GATEWAY_TOKEN` para el proceso).
</ParamField>
<ParamField path="--password <password>" type="string">
  Sobrescritura de contraseña.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Leer la contraseña del gateway desde un archivo.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Exponer el Gateway mediante Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Restablecer la configuración de serve/funnel de Tailscale al apagar.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Permitir que el gateway se inicie sin `gateway.mode=local` en la configuración. Omite la protección de inicio solo para arranque ad hoc/de desarrollo; no escribe ni repara el archivo de configuración.
</ParamField>
<ParamField path="--dev" type="boolean">
  Crear una configuración de desarrollo + workspace si falta (omite BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Restablecer configuración de desarrollo + credenciales + sesiones + workspace (requiere `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Matar cualquier listener existente en el puerto seleccionado antes de iniciar.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Registros detallados.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Mostrar solo registros del backend de la CLI en la consola (y habilitar stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Estilo de registro de WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias de `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Registrar eventos de stream del modelo sin procesar en jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ruta jsonl del stream sin procesar.
</ParamField>

## Reiniciar el Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` solicita al Gateway en ejecución que haga una verificación previa del trabajo activo de OpenClaw antes de reiniciar. Si hay operaciones en cola, entrega de respuestas, ejecuciones integradas o ejecuciones de tareas activas, el Gateway informa los bloqueadores, fusiona las solicitudes duplicadas de reinicio seguro y reinicia una vez que el trabajo activo se drena. `restart` simple conserva el comportamiento existente del gestor de servicios por compatibilidad. Usa `--force` solo cuando quieras explícitamente la ruta de sobrescritura inmediata.

`openclaw gateway restart --safe --skip-deferral` ejecuta el mismo reinicio coordinado consciente de OpenClaw que `--safe`, pero omite la compuerta de aplazamiento por trabajo activo para que el Gateway emita el reinicio inmediatamente incluso cuando se informan bloqueadores. Úsalo como vía de escape del operador cuando un aplazamiento se haya quedado fijado por una ejecución de tarea atascada y `--safe` por sí solo esperaría indefinidamente. `--skip-deferral` requiere `--safe`.

<Warning>
`--password` en línea puede quedar expuesto en listados de procesos locales. Prefiere `--password-file`, env o un `gateway.auth.password` respaldado por SecretRef.
</Warning>

### Perfilado de inicio

- Establece `OPENCLAW_GATEWAY_STARTUP_TRACE=1` para registrar tiempos de fases durante el inicio del Gateway, incluido el retraso `eventLoopMax` por fase y los tiempos de tablas de búsqueda de plugins para el índice instalado, el registro de manifiestos, la planificación de inicio y el trabajo de mapa de propietarios.
- Establece `OPENCLAW_DIAGNOSTICS=timeline` con `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` para escribir una línea temporal de diagnósticos de inicio JSONL de mejor esfuerzo para arneses externos de QA. También puedes habilitar la bandera con `diagnostics.flags: ["timeline"]` en la configuración; la ruta sigue proporcionándose por env. Agrega `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` para incluir muestras del event loop.
- Ejecuta `pnpm test:startup:gateway -- --runs 5 --warmup 1` para medir el inicio del Gateway. El benchmark registra la primera salida del proceso, `/healthz`, `/readyz`, los tiempos de traza de inicio, el retraso del event loop y los detalles de tiempos de tablas de búsqueda de plugins.

## Consultar un Gateway en ejecución

Todos los comandos de consulta usan RPC por WebSocket.

<Tabs>
  <Tab title="Modos de salida">
    - Predeterminado: legible para humanos (con color en TTY).
    - `--json`: JSON legible por máquina (sin estilo/spinner).
    - `--no-color` (o `NO_COLOR=1`): deshabilitar ANSI manteniendo el diseño humano.

  </Tab>
  <Tab title="Opciones compartidas">
    - `--url <url>`: URL WebSocket del Gateway.
    - `--token <token>`: token del Gateway.
    - `--password <password>`: contraseña del Gateway.
    - `--timeout <ms>`: timeout/presupuesto (varía según el comando).
    - `--expect-final`: esperar una respuesta "final" (llamadas de agente).

  </Tab>
</Tabs>

<Note>
Cuando estableces `--url`, la CLI no recurre a credenciales de configuración ni de entorno. Pasa `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

El endpoint HTTP `/healthz` es una sonda de actividad: devuelve una respuesta una vez que el servidor puede responder HTTP. El endpoint HTTP `/readyz` es más estricto y permanece en rojo mientras los sidecars de plugins de inicio, los canales o los hooks configurados aún se están estabilizando. Las respuestas detalladas locales o autenticadas de disponibilidad incluyen un bloque de diagnóstico `eventLoop` con retraso del event loop, utilización del event loop, proporción de núcleos de CPU y una bandera `degraded`.

### `gateway usage-cost`

Obtiene resúmenes de costo de uso desde registros de sesión.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Número de días que incluir.
</ParamField>

### `gateway stability`

Obtiene el registrador reciente de estabilidad diagnóstica desde un Gateway en ejecución.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Número máximo de eventos recientes que incluir (máx. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filtrar por tipo de evento diagnóstico, como `payload.large` o `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Incluir solo eventos posteriores a un número de secuencia diagnóstica.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Leer un bundle de estabilidad persistido en lugar de llamar al Gateway en ejecución. Usa `--bundle latest` (o solo `--bundle`) para el bundle más nuevo bajo el directorio de estado, o pasa directamente una ruta JSON de bundle.
</ParamField>
<ParamField path="--export" type="boolean">
  Escribir un zip de diagnósticos de soporte compartible en lugar de imprimir detalles de estabilidad.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ruta de salida para `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacidad y comportamiento de bundles">
    - Los registros conservan metadatos operativos: nombres de eventos, conteos, tamaños en bytes, lecturas de memoria, estado de colas/sesiones, nombres de canales/plugins y resúmenes de sesión redactados. No conservan texto de chat, cuerpos de webhook, salidas de herramientas, cuerpos sin procesar de solicitudes o respuestas, tokens, cookies, valores secretos, hostnames ni ids de sesión sin procesar. Establece `diagnostics.enabled: false` para deshabilitar por completo el registrador.
    - En salidas fatales del Gateway, timeouts de apagado y fallos de inicio tras reinicio, OpenClaw escribe la misma instantánea diagnóstica en `~/.openclaw/logs/stability/openclaw-stability-*.json` cuando el registrador tiene eventos. Inspecciona el bundle más nuevo con `openclaw gateway stability --bundle latest`; `--limit`, `--type` y `--since-seq` también se aplican a la salida de bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Escribe un zip local de diagnósticos diseñado para adjuntarse a informes de errores. Para el modelo de privacidad y el contenido del bundle, consulta [Exportación de diagnósticos](/es/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ruta del zip de salida. El valor predeterminado es una exportación de soporte bajo el directorio de estado.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Número máximo de líneas de registro saneadas que incluir.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Número máximo de bytes de registro que inspeccionar.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket del Gateway para la instantánea de estado.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token del Gateway para la instantánea de estado.
</ParamField>
<ParamField path="--password <password>" type="string">
  Contraseña del Gateway para la instantánea de estado.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout de la instantánea de estado/salud.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Omitir la búsqueda de bundles de estabilidad persistidos.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprimir la ruta escrita, el tamaño y el manifiesto como JSON.
</ParamField>

La exportación contiene un manifiesto, un resumen en Markdown, la forma de la configuración, detalles de configuración saneados, resúmenes de registros saneados, instantáneas saneadas de estado/salud del Gateway y el bundle de estabilidad más nuevo cuando existe uno.

Está pensada para compartirse. Conserva detalles operativos que ayudan a depurar, como campos seguros de registros de OpenClaw, nombres de subsistemas, códigos de estado, duraciones, modos configurados, puertos, ids de plugins, ids de proveedores, ajustes de funciones no secretos y mensajes de registro operativos redactados. Omite o redacta texto de chat, cuerpos de webhook, salidas de herramientas, credenciales, cookies, identificadores de cuenta/mensaje, texto de prompts/instrucciones, hostnames y valores secretos. Cuando un mensaje estilo LogTape parece texto de payload de usuario/chat/herramienta, la exportación conserva solo que se omitió un mensaje más su conteo de bytes.

### `gateway status`

`gateway status` muestra el servicio del Gateway (launchd/systemd/schtasks) más una sonda opcional de capacidad de conectividad/autenticación.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Agrega un destino de sondeo explícito. El remoto configurado + localhost se siguen sondeando.
</ParamField>
<ParamField path="--token <token>" type="string">
  Autenticación por token para el sondeo.
</ParamField>
<ParamField path="--password <password>" type="string">
  Autenticación por contraseña para el sondeo.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Tiempo de espera del sondeo.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Omite el sondeo de conectividad (vista solo del servicio).
</ParamField>
<ParamField path="--deep" type="boolean">
  Escanea también los servicios de nivel de sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Convierte el sondeo de conectividad predeterminado en un sondeo de lectura y sale con código distinto de cero cuando ese sondeo de lectura falla. No se puede combinar con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - `gateway status` sigue disponible para diagnósticos incluso cuando la configuración local de la CLI falta o no es válida.
    - `gateway status` predeterminado comprueba el estado del servicio, la conexión WebSocket y la capacidad de autenticación visible durante el handshake. No comprueba operaciones de lectura/escritura/administración.
    - Los sondeos de diagnóstico no mutan la autenticación de dispositivos por primera vez: reutilizan un token de dispositivo en caché existente cuando existe, pero no crean una nueva identidad de dispositivo de la CLI ni un registro de emparejamiento de dispositivo de solo lectura solo para comprobar el estado.
    - `gateway status` resuelve los SecretRefs de autenticación configurados para la autenticación del sondeo cuando es posible.
    - Si un SecretRef de autenticación requerido no se resuelve en esta ruta de comando, `gateway status --json` informa `rpc.authWarning` cuando la conectividad/autenticación del sondeo falla; pasa `--token`/`--password` explícitamente o resuelve primero el origen del secreto.
    - Si el sondeo tiene éxito, las advertencias de referencia de autenticación sin resolver se suprimen para evitar falsos positivos.
    - Usa `--require-rpc` en scripts y automatización cuando un servicio en escucha no sea suficiente y también necesites que las llamadas RPC de alcance de lectura estén sanas.
    - `--deep` agrega un escaneo de mejor esfuerzo para instalaciones adicionales de launchd/systemd/schtasks. Cuando se detectan varios servicios similares a Gateway, la salida humana imprime sugerencias de limpieza y advierte que la mayoría de las configuraciones deberían ejecutar un Gateway por máquina.
    - `--deep` también informa una transferencia reciente de reinicio del supervisor de Gateway cuando el proceso del servicio salió limpiamente para un reinicio de supervisor externo.
    - `--deep` ejecuta la validación de configuración en modo compatible con plugins (`pluginValidation: "full"`) y muestra advertencias de manifiestos de plugins configurados (por ejemplo, metadatos faltantes de configuración de canal) para que las comprobaciones smoke de instalación y actualización las detecten. `gateway status` predeterminado mantiene la ruta rápida de solo lectura que omite la validación de plugins.
    - La salida humana incluye la ruta resuelta del log en archivo más la instantánea de rutas/validez de configuración CLI-vs-servicio para ayudar a diagnosticar desviaciones de perfil o de directorio de estado.

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - En instalaciones Linux systemd, las comprobaciones de desviación de autenticación del servicio leen tanto los valores `Environment=` como `EnvironmentFile=` de la unidad (incluidos `%h`, rutas entre comillas, varios archivos y archivos `-` opcionales).
    - Las comprobaciones de desviación resuelven los SecretRefs de `gateway.auth.token` usando el entorno de ejecución combinado (primero el entorno del comando de servicio, luego el entorno del proceso como alternativa).
    - Si la autenticación por token no está activa efectivamente (`gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, o modo sin definir donde la contraseña puede ganar y ningún candidato de token puede ganar), las comprobaciones de desviación de token omiten la resolución del token de configuración.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` es el comando para "depurar todo". Siempre sondea:

- tu Gateway remoto configurado (si está definido), y
- localhost (loopback) **aunque el remoto esté configurado**.

Si pasas `--url`, ese destino explícito se agrega antes de ambos. La salida humana etiqueta los destinos como:

- `URL (explicit)`
- `Remote (configured)` o `Remote (configured, inactive)`
- `Local loopback`

<Note>
Si se puede acceder a varios gateways, los imprime todos. Se admiten varios gateways cuando usas perfiles/puertos aislados (por ejemplo, un bot de rescate), pero la mayoría de las instalaciones siguen ejecutando un único Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` significa que al menos un destino aceptó una conexión WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` informa lo que el sondeo pudo comprobar sobre la autenticación. Es independiente de la accesibilidad.
    - `Read probe: ok` significa que las llamadas RPC de detalle con alcance de lectura (`health`/`status`/`system-presence`/`config.get`) también tuvieron éxito.
    - `Read probe: limited - missing scope: operator.read` significa que la conexión tuvo éxito, pero el RPC con alcance de lectura está limitado. Esto se informa como accesibilidad **degradada**, no como fallo completo.
    - `Read probe: failed` después de `Connect: ok` significa que el Gateway aceptó la conexión WebSocket, pero los diagnósticos de lectura posteriores agotaron el tiempo o fallaron. Esto también es accesibilidad **degradada**, no un Gateway inaccesible.
    - Al igual que `gateway status`, el sondeo reutiliza la autenticación de dispositivo en caché existente, pero no crea una identidad de dispositivo por primera vez ni estado de emparejamiento.
    - El código de salida es distinto de cero solo cuando no se puede acceder a ningún destino sondeado.

  </Accordion>
  <Accordion title="JSON output">
    Nivel superior:

    - `ok`: se puede acceder al menos a un destino.
    - `degraded`: al menos un destino aceptó una conexión pero no completó todos los diagnósticos RPC de detalle.
    - `capability`: mejor capacidad vista entre los destinos accesibles (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: mejor destino para tratar como ganador activo en este orden: URL explícita, túnel SSH, remoto configurado y luego local loopback.
    - `warnings[]`: registros de advertencia de mejor esfuerzo con `code`, `message` y `targetIds` opcional.
    - `network`: sugerencias de URL de local loopback/tailnet derivadas de la configuración actual y la red del host.
    - `discovery.timeoutMs` y `discovery.count`: el presupuesto de descubrimiento/recuento de resultados real usado para esta pasada de sondeo.

    Por destino (`targets[].connect`):

    - `ok`: accesibilidad después de connect + clasificación degradada.
    - `rpcOk`: éxito completo del RPC de detalle.
    - `scopeLimited`: el RPC de detalle falló por falta de alcance de operador.

    Por destino (`targets[].auth`):

    - `role`: rol de autenticación informado en `hello-ok` cuando está disponible.
    - `scopes`: alcances concedidos informados en `hello-ok` cuando están disponibles.
    - `capability`: la clasificación expuesta de capacidad de autenticación para ese destino.

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: falló la configuración del túnel SSH; el comando recurrió a sondeos directos.
    - `multiple_gateways`: se pudo acceder a más de un destino; esto es inusual salvo que ejecutes perfiles aislados intencionalmente, como un bot de rescate.
    - `auth_secretref_unresolved`: no se pudo resolver un SecretRef de autenticación configurado para un destino fallido.
    - `probe_scope_limited`: la conexión WebSocket tuvo éxito, pero el sondeo de lectura estuvo limitado por falta de `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto por SSH (paridad de la app de Mac)

El modo "Remote over SSH" de la app de macOS usa un reenvío de puerto local para que el Gateway remoto (que puede estar enlazado solo a loopback) sea accesible en `ws://127.0.0.1:<port>`.

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
  Elige el primer host de Gateway descubierto como destino SSH desde el endpoint de descubrimiento resuelto (`local.` más el dominio de área amplia configurado, si lo hay). Las sugerencias solo TXT se ignoran.
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

### Instalar con un wrapper

Usa `--wrapper` cuando el servicio gestionado deba iniciarse mediante otro ejecutable, por ejemplo un
shim de gestor de secretos o un ayudante run-as. El wrapper recibe los argumentos normales de Gateway y es
responsable de finalmente hacer exec de `openclaw` o Node con esos argumentos.

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
`OPENCLAW_WRAPPER` en el entorno del servicio para reinstalaciones forzadas, actualizaciones y reparaciones de doctor posteriores.

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
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Comportamiento del ciclo de vida">
    - Usa `gateway restart` para reiniciar un servicio administrado. No encadenes `gateway stop` y `gateway start` como sustituto de reinicio.
    - En macOS, `gateway stop` usa `launchctl bootout` de forma predeterminada, lo que elimina el LaunchAgent de la sesión de arranque actual sin conservar una desactivación persistente: la recuperación automática de KeepAlive sigue activa para bloqueos futuros y `gateway start` vuelve a habilitarlo limpiamente sin un `launchctl enable` manual. Pasa `--disable` para suprimir de forma persistente KeepAlive y RunAtLoad, de modo que el gateway no reaparezca hasta el siguiente `gateway start` explícito; úsalo cuando una detención manual deba sobrevivir a reinicios del equipo o del sistema.
    - `gateway restart --safe` pide al Gateway en ejecución que compruebe previamente el trabajo activo de OpenClaw y aplace el reinicio hasta que se vacíen la entrega de respuestas, las ejecuciones incrustadas y las ejecuciones de tareas. `--safe` no se puede combinar con `--force` ni `--wait`.
    - `gateway restart --wait 30s` anula el presupuesto de vaciado de reinicio configurado para ese reinicio. Los números sin unidad son milisegundos; se aceptan unidades como `s`, `m` y `h`. `--wait 0` espera indefinidamente.
    - `gateway restart --safe --skip-deferral` ejecuta el reinicio seguro con conocimiento de OpenClaw, pero omite la compuerta de aplazamiento para que el Gateway emita el reinicio inmediatamente incluso cuando se informen bloqueadores. Vía de escape para operadores ante aplazamientos de ejecuciones de tareas atascadas; requiere `--safe`.
    - `gateway restart --force` omite el vaciado de trabajo activo y reinicia inmediatamente. Úsalo cuando un operador ya haya inspeccionado los bloqueadores de tareas enumerados y quiera recuperar el gateway ahora.
    - Los comandos de ciclo de vida aceptan `--json` para scripting.

  </Accordion>
  <Accordion title="Autenticación y SecretRefs durante la instalación">
    - Cuando la autenticación con token requiere un token y `gateway.auth.token` está administrado por SecretRef, `gateway install` valida que el SecretRef se pueda resolver, pero no conserva el token resuelto en los metadatos de entorno del servicio.
    - Si la autenticación con token requiere un token y el SecretRef de token configurado no se puede resolver, la instalación falla de forma cerrada en lugar de conservar texto sin formato alternativo.
    - Para autenticación con contraseña en `gateway run`, prefiere `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` respaldado por SecretRef antes que `--password` en línea.
    - En modo de autenticación inferida, `OPENCLAW_GATEWAY_PASSWORD` solo de shell no relaja los requisitos de token de instalación; usa configuración duradera (`gateway.auth.password` o config `env`) al instalar un servicio administrado.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación se bloquea hasta que el modo se establezca explícitamente.

  </Accordion>
</AccordionGroup>

## Descubrir gateways (Bonjour)

`gateway discover` busca balizas de Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Bonjour de área amplia): elige un dominio (ejemplo: `openclaw.internal.`) y configura DNS dividido + un servidor DNS; consulta [Bonjour](/es/gateway/bonjour).

Solo los gateways con descubrimiento Bonjour habilitado (predeterminado) anuncian la baliza.

Los registros de descubrimiento de área amplia pueden incluir estas pistas TXT:

- `role` (pista de rol del gateway)
- `transport` (pista de transporte, p. ej. `gateway`)
- `gatewayPort` (puerto WebSocket, normalmente `18789`)
- `sshPort` (solo modo de descubrimiento completo; los clientes usan `22` como destino SSH predeterminado cuando está ausente)
- `tailnetDns` (nombre de host MagicDNS, cuando está disponible)
- `gatewayTls` / `gatewayTlsSha256` (TLS habilitado + huella digital del certificado)
- `cliPath` (solo modo de descubrimiento completo)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Tiempo de espera por comando (explorar/resolver).
</ParamField>
<ParamField path="--json" type="boolean">
  Salida legible por máquina (también desactiva estilo/indicador giratorio).
</ParamField>

Ejemplos:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- La CLI escanea `local.` más el dominio de área amplia configurado cuando hay uno habilitado.
- `wsUrl` en la salida JSON se deriva del endpoint de servicio resuelto, no de pistas solo TXT como `lanHost` o `tailnetDns`.
- En mDNS `local.` y DNS-SD de área amplia, `sshPort` y `cliPath` solo se publican cuando `discovery.mdns.mode` es `full`.

</Note>

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Runbook del Gateway](/es/gateway)
