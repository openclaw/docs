---
read_when:
    - Ejecutar el Gateway desde la CLI (desarrollo o servidores)
    - Depuración de la autenticación de Gateway, los modos de enlace y la conectividad
    - Descubrir Gateways mediante Bonjour (DNS-SD local y de área amplia)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — ejecuta, consulta y descubre gateways
title: Gateway
x-i18n:
    generated_at: "2026-05-05T01:44:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 521558189b150b2faa22f95ec32419ac9e02c5f47c72b9095f40d1432840c038
    source_path: cli/gateway.md
    workflow: 16
---

El Gateway es el servidor WebSocket de OpenClaw (canales, nodos, sesiones, hooks). Los subcomandos de esta página están bajo `openclaw gateway …`.

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

Ejecuta un proceso de Gateway local:

```bash
openclaw gateway
```

Alias en primer plano:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Comportamiento de inicio">
    - De forma predeterminada, el Gateway se niega a iniciar a menos que `gateway.mode=local` esté configurado en `~/.openclaw/openclaw.json`. Usa `--allow-unconfigured` para ejecuciones ad hoc/de desarrollo.
    - Se espera que `openclaw onboard --mode local` y `openclaw setup` escriban `gateway.mode=local`. Si el archivo existe pero falta `gateway.mode`, trátalo como una configuración dañada o sobrescrita y repárala en lugar de asumir implícitamente el modo local.
    - Si el archivo existe y falta `gateway.mode`, el Gateway trata eso como un daño de configuración sospechoso y se niega a "adivinar local" por ti.
    - Se bloquea el enlace más allá de loopback sin autenticación (barrera de seguridad).
    - `SIGUSR1` desencadena un reinicio en proceso cuando está autorizado (`commands.restart` está habilitado de forma predeterminada; define `commands.restart: false` para bloquear el reinicio manual, mientras que las acciones de herramienta/configuración aplicar/actualizar del Gateway siguen permitidas).
    - Los manejadores `SIGINT`/`SIGTERM` detienen el proceso del gateway, pero no restauran ningún estado personalizado de la terminal. Si envuelves la CLI con una TUI o entrada en modo sin procesar, restaura la terminal antes de salir.

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
  Anulación del token (también establece `OPENCLAW_GATEWAY_TOKEN` para el proceso).
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
  Restablece la configuración de serve/funnel de Tailscale al apagar.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Permite iniciar el gateway sin `gateway.mode=local` en la configuración. Omite la barrera de inicio solo para arranque ad hoc/de desarrollo; no escribe ni repara el archivo de configuración.
</ParamField>
<ParamField path="--dev" type="boolean">
  Crea una configuración de desarrollo + espacio de trabajo si faltan (omite BOOTSTRAP.md).
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
  Muestra solo registros del backend de la CLI en la consola (y habilita stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Estilo de registro WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias para `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Registra eventos sin procesar del flujo del modelo en jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ruta jsonl del flujo sin procesar.
</ParamField>

## Reiniciar el Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` pide al Gateway en ejecución que haga una comprobación previa del trabajo activo de OpenClaw antes de reiniciar. Si hay operaciones en cola, entrega de respuestas, ejecuciones integradas o ejecuciones de tareas activas, el Gateway informa los bloqueadores, agrupa las solicitudes duplicadas de reinicio seguro y reinicia cuando el trabajo activo se drena. `restart` sin más conserva el comportamiento existente del administrador de servicios por compatibilidad. Usa `--force` solo cuando quieras explícitamente la ruta de anulación inmediata.

<Warning>
`--password` en línea puede quedar expuesto en listados de procesos locales. Prefiere `--password-file`, env o un `gateway.auth.password` respaldado por SecretRef.
</Warning>

### Perfilado de inicio

- Define `OPENCLAW_GATEWAY_STARTUP_TRACE=1` para registrar tiempos de fases durante el inicio del Gateway, incluido el retraso `eventLoopMax` por fase y los tiempos de la tabla de búsqueda de plugins para índice instalado, registro de manifiestos, planificación de inicio y trabajo de mapa de propietarios.
- Define `OPENCLAW_DIAGNOSTICS=timeline` con `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` para escribir una línea de tiempo de diagnósticos de inicio JSONL de mejor esfuerzo para harnesses externos de QA. También puedes habilitar la marca con `diagnostics.flags: ["timeline"]` en la configuración; la ruta se sigue proporcionando por env. Añade `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` para incluir muestras del bucle de eventos.
- Ejecuta `pnpm test:startup:gateway -- --runs 5 --warmup 1` para medir el rendimiento del inicio del Gateway. La medición registra la primera salida del proceso, `/healthz`, `/readyz`, los tiempos de traza de inicio, el retraso del bucle de eventos y los detalles de tiempos de la tabla de búsqueda de plugins.

## Consultar un Gateway en ejecución

Todos los comandos de consulta usan RPC por WebSocket.

<Tabs>
  <Tab title="Modos de salida">
    - Predeterminado: legible para personas (con colores en TTY).
    - `--json`: JSON legible por máquinas (sin estilos/spinner).
    - `--no-color` (o `NO_COLOR=1`): desactiva ANSI manteniendo el diseño humano.

  </Tab>
  <Tab title="Opciones compartidas">
    - `--url <url>`: URL WebSocket del Gateway.
    - `--token <token>`: token del Gateway.
    - `--password <password>`: contraseña del Gateway.
    - `--timeout <ms>`: tiempo de espera/presupuesto (varía por comando).
    - `--expect-final`: espera una respuesta "final" (llamadas de agente).

  </Tab>
</Tabs>

<Note>
Cuando estableces `--url`, la CLI no recurre a credenciales de configuración ni de entorno. Pasa `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

El endpoint HTTP `/healthz` es una sonda de vida: responde cuando el servidor puede contestar HTTP. El endpoint HTTP `/readyz` es más estricto y permanece en rojo mientras los sidecars de plugins de inicio, canales o hooks configurados todavía se están estabilizando. Las respuestas detalladas de disponibilidad locales o autenticadas incluyen un bloque de diagnóstico `eventLoop` con retraso del bucle de eventos, utilización del bucle de eventos, proporción de núcleos de CPU y una marca `degraded`.

### `gateway usage-cost`

Obtén resúmenes de costo de uso desde los registros de sesión.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Número de días que incluir.
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
  Número máximo de eventos recientes que incluir (máx. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filtra por tipo de evento de diagnóstico, como `payload.large` o `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Incluye solo eventos después de un número de secuencia de diagnóstico.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lee un paquete de estabilidad persistido en lugar de llamar al Gateway en ejecución. Usa `--bundle latest` (o simplemente `--bundle`) para el paquete más nuevo bajo el directorio de estado, o pasa directamente una ruta JSON de paquete.
</ParamField>
<ParamField path="--export" type="boolean">
  Escribe un zip de diagnósticos de soporte compartible en lugar de imprimir detalles de estabilidad.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ruta de salida para `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacidad y comportamiento de paquetes">
    - Los registros conservan metadatos operativos: nombres de eventos, conteos, tamaños en bytes, lecturas de memoria, estado de colas/sesiones, nombres de canales/plugins y resúmenes de sesiones redactados. No conservan texto de chat, cuerpos de webhook, salidas de herramientas, cuerpos sin procesar de solicitudes o respuestas, tokens, cookies, valores secretos, nombres de host ni ids de sesión sin procesar. Define `diagnostics.enabled: false` para desactivar el registrador por completo.
    - En salidas fatales del Gateway, tiempos de espera de apagado y fallos de inicio tras reinicio, OpenClaw escribe la misma instantánea de diagnóstico en `~/.openclaw/logs/stability/openclaw-stability-*.json` cuando el registrador tiene eventos. Inspecciona el paquete más nuevo con `openclaw gateway stability --bundle latest`; `--limit`, `--type` y `--since-seq` también se aplican a la salida de paquetes.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Escribe un zip de diagnósticos local diseñado para adjuntarse a informes de errores. Para el modelo de privacidad y el contenido del paquete, consulta [Exportación de diagnósticos](/es/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ruta del zip de salida. De forma predeterminada, es una exportación de soporte bajo el directorio de estado.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Número máximo de líneas de registro saneadas que incluir.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Bytes máximos de registro que inspeccionar.
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
  Tiempo de espera de la instantánea de estado/salud.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Omite la búsqueda de paquetes de estabilidad persistidos.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprime la ruta escrita, el tamaño y el manifiesto como JSON.
</ParamField>

La exportación contiene un manifiesto, un resumen en Markdown, forma de configuración, detalles de configuración saneados, resúmenes de registros saneados, instantáneas saneadas de estado/salud del Gateway y el paquete de estabilidad más nuevo cuando existe uno.

Está pensada para compartirse. Conserva detalles operativos que ayudan a depurar, como campos seguros de registro de OpenClaw, nombres de subsistemas, códigos de estado, duraciones, modos configurados, puertos, ids de plugins, ids de proveedores, configuraciones de funciones no secretas y mensajes de registro operativo redactados. Omite o redacta texto de chat, cuerpos de webhook, salidas de herramientas, credenciales, cookies, identificadores de cuenta/mensaje, texto de prompts/instrucciones, nombres de host y valores secretos. Cuando un mensaje de estilo LogTape parece texto de carga útil de usuario/chat/herramienta, la exportación conserva solo que se omitió un mensaje más su conteo de bytes.

### `gateway status`

`gateway status` muestra el servicio del Gateway (launchd/systemd/schtasks) más una sonda opcional de capacidad de conectividad/autenticación.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Añade un destino de sondeo explícito. El remoto configurado + localhost se siguen sondeando.
</ParamField>
<ParamField path="--token <token>" type="string">
  Autenticación con token para el sondeo.
</ParamField>
<ParamField path="--password <password>" type="string">
  Autenticación con contraseña para el sondeo.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Tiempo de espera del sondeo.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Omite el sondeo de conectividad (vista solo del servicio).
</ParamField>
<ParamField path="--deep" type="boolean">
  Escanea también servicios de nivel de sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Actualiza el sondeo de conectividad predeterminado a un sondeo de lectura y termina con un código distinto de cero cuando ese sondeo de lectura falla. No se puede combinar con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semántica de estado">
    - `gateway status` sigue estando disponible para diagnóstico aunque falte la configuración local de la CLI o no sea válida.
    - `gateway status` predeterminado demuestra el estado del servicio, la conexión WebSocket y la capacidad de autenticación visible en el momento del handshake. No demuestra operaciones de lectura/escritura/administración.
    - Los sondeos de diagnóstico no mutan la autenticación de dispositivos por primera vez: reutilizan un token de dispositivo en caché existente cuando existe, pero no crean una nueva identidad de dispositivo de la CLI ni un registro de emparejamiento de dispositivo de solo lectura solo para comprobar el estado.
    - `gateway status` resuelve SecretRefs de autenticación configurados para la autenticación del sondeo cuando es posible.
    - Si un SecretRef de autenticación requerido no se resuelve en esta ruta de comando, `gateway status --json` informa `rpc.authWarning` cuando falla la conectividad/autenticación del sondeo; pasa `--token`/`--password` explícitamente o resuelve primero el origen del secreto.
    - Si el sondeo se realiza correctamente, las advertencias de referencias de autenticación no resueltas se suprimen para evitar falsos positivos.
    - Usa `--require-rpc` en scripts y automatización cuando un servicio en escucha no sea suficiente y también necesites que las llamadas RPC con alcance de lectura estén sanas.
    - `--deep` añade un escaneo de mejor esfuerzo de instalaciones adicionales de launchd/systemd/schtasks. Cuando se detectan varios servicios similares a Gateway, la salida humana imprime sugerencias de limpieza y advierte que la mayoría de las configuraciones deberían ejecutar un Gateway por máquina.
    - La salida humana incluye la ruta resuelta del archivo de registro más una instantánea de rutas/validez de configuración CLI frente a servicio para ayudar a diagnosticar desviaciones de perfil o directorio de estado.

  </Accordion>
  <Accordion title="Comprobaciones de desviación de autenticación de Linux systemd">
    - En instalaciones de Linux systemd, las comprobaciones de desviación de autenticación del servicio leen valores `Environment=` y `EnvironmentFile=` de la unidad (incluidos `%h`, rutas entrecomilladas, varios archivos y archivos `-` opcionales).
    - Las comprobaciones de desviación resuelven SecretRefs de `gateway.auth.token` usando el entorno de runtime fusionado (primero el entorno del comando de servicio, luego el entorno del proceso como respaldo).
    - Si la autenticación con token no está efectivamente activa (`gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, o modo no definido donde la contraseña puede imponerse y ningún candidato de token puede imponerse), las comprobaciones de desviación de token omiten la resolución del token de configuración.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` es el comando para "depurarlo todo". Siempre sondea:

- tu Gateway remoto configurado (si está definido), y
- localhost (loopback) **aunque el remoto esté configurado**.

Si pasas `--url`, ese destino explícito se añade antes de ambos. La salida humana etiqueta los destinos como:

- `URL (explicit)`
- `Remote (configured)` o `Remote (configured, inactive)`
- `Local loopback`

<Note>
Si se puede acceder a varios Gateways, los imprime todos. Se admiten varios Gateways cuando usas perfiles/puertos aislados (por ejemplo, un bot de rescate), pero la mayoría de las instalaciones siguen ejecutando un solo Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretación">
    - `Reachable: yes` significa que al menos un destino aceptó una conexión WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` informa lo que el sondeo pudo demostrar sobre la autenticación. Es independiente de la accesibilidad.
    - `Read probe: ok` significa que las llamadas RPC de detalle con alcance de lectura (`health`/`status`/`system-presence`/`config.get`) también se realizaron correctamente.
    - `Read probe: limited - missing scope: operator.read` significa que la conexión se realizó correctamente, pero la RPC con alcance de lectura está limitada. Esto se informa como accesibilidad **degradada**, no como fallo completo.
    - `Read probe: failed` después de `Connect: ok` significa que el Gateway aceptó la conexión WebSocket, pero los diagnósticos de lectura de seguimiento agotaron el tiempo de espera o fallaron. Esto también es accesibilidad **degradada**, no un Gateway inaccesible.
    - Al igual que `gateway status`, el sondeo reutiliza la autenticación de dispositivo en caché existente, pero no crea identidad de dispositivo por primera vez ni estado de emparejamiento.
    - El código de salida es distinto de cero solo cuando no se puede acceder a ningún destino sondeado.

  </Accordion>
  <Accordion title="Salida JSON">
    Nivel superior:

    - `ok`: al menos un destino es accesible.
    - `degraded`: al menos un destino aceptó una conexión pero no completó los diagnósticos RPC de detalle completos.
    - `capability`: la mejor capacidad vista entre los destinos accesibles (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: el mejor destino para tratar como ganador activo en este orden: URL explícita, túnel SSH, remoto configurado y luego local loopback.
    - `warnings[]`: registros de advertencia de mejor esfuerzo con `code`, `message` y `targetIds` opcional.
    - `network`: pistas de URL de local loopback/tailnet derivadas de la configuración actual y la red del host.
    - `discovery.timeoutMs` y `discovery.count`: el presupuesto de descubrimiento real/recuento de resultados usado para esta pasada de sondeo.

    Por destino (`targets[].connect`):

    - `ok`: accesibilidad después de conexión + clasificación degradada.
    - `rpcOk`: éxito completo de RPC de detalle.
    - `scopeLimited`: la RPC de detalle falló por falta de alcance de operador.

    Por destino (`targets[].auth`):

    - `role`: rol de autenticación informado en `hello-ok` cuando está disponible.
    - `scopes`: alcances concedidos informados en `hello-ok` cuando están disponibles.
    - `capability`: la clasificación de capacidad de autenticación expuesta para ese destino.

  </Accordion>
  <Accordion title="Códigos de advertencia comunes">
    - `ssh_tunnel_failed`: falló la configuración del túnel SSH; el comando volvió a sondeos directos.
    - `multiple_gateways`: más de un destino fue accesible; esto es inusual salvo que ejecutes intencionalmente perfiles aislados, como un bot de rescate.
    - `auth_secretref_unresolved`: no se pudo resolver un SecretRef de autenticación configurado para un destino fallido.
    - `probe_scope_limited`: la conexión WebSocket se realizó correctamente, pero el sondeo de lectura quedó limitado por faltar `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto por SSH (paridad con la app de Mac)

El modo "Remote over SSH" de la app de macOS usa un reenvío de puerto local para que el Gateway remoto (que puede estar enlazado solo a loopback) quede accesible en `ws://127.0.0.1:<port>`.

Equivalente en la CLI:

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
  Elige el primer host de Gateway descubierto como destino SSH desde el endpoint de descubrimiento resuelto (`local.` más el dominio de área amplia configurado, si existe). Las pistas solo TXT se ignoran.
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
  Cadena de objeto JSON para parámetros.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket de Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token de Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  Contraseña de Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Presupuesto de tiempo de espera.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Principalmente para RPCs de estilo agente que transmiten eventos intermedios antes de una carga final.
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

Usa `--wrapper` cuando el servicio gestionado deba iniciarse a través de otro ejecutable, por ejemplo un
shim de gestor de secretos o un ayudante run-as. El wrapper recibe los argumentos normales de Gateway y es
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
`OPENCLAW_WRAPPER` en el entorno del servicio para reinstalaciones forzadas, actualizaciones y reparaciones de doctor posteriores.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Para eliminar un wrapper conservado, vacía `OPENCLAW_WRAPPER` al reinstalar:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Opciones de comando">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Comportamiento del ciclo de vida">
    - Usa `gateway restart` para reiniciar un servicio gestionado. No encadenes `gateway stop` y `gateway start` como sustituto de reinicio; en macOS, `gateway stop` deshabilita intencionalmente el LaunchAgent antes de detenerlo.
    - `gateway restart --safe` pide al Gateway en ejecución que haga una precomprobación del trabajo activo de OpenClaw y difiera el reinicio hasta que se drenen la entrega de respuestas, las ejecuciones incrustadas y las ejecuciones de tareas. `--safe` no se puede combinar con `--force` ni `--wait`.
    - `gateway restart --wait 30s` sobrescribe el presupuesto configurado de drenaje de reinicio para ese reinicio. Los números sin unidad son milisegundos; se aceptan unidades como `s`, `m` y `h`. `--wait 0` espera indefinidamente.
    - `gateway restart --force` omite el drenaje de trabajo activo y reinicia de inmediato. Úsalo cuando un operador ya haya inspeccionado los bloqueadores de tarea enumerados y quiera recuperar el gateway ahora.
    - Los comandos de ciclo de vida aceptan `--json` para scripting.

  </Accordion>
  <Accordion title="Autenticación y SecretRefs en el momento de la instalación">
    - Cuando la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, `gateway install` valida que el SecretRef se pueda resolver, pero no conserva el token resuelto en los metadatos del entorno del servicio.
    - Si la autenticación por token requiere un token y el SecretRef del token configurado no está resuelto, la instalación falla de forma cerrada en lugar de conservar texto sin formato de reserva.
    - Para la autenticación por contraseña en `gateway run`, prefiere `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` respaldado por SecretRef antes que `--password` en línea.
    - En el modo de autenticación inferida, `OPENCLAW_GATEWAY_PASSWORD` solo en shell no relaja los requisitos de token de instalación; usa configuración duradera (`gateway.auth.password` o `env` de configuración) al instalar un servicio gestionado.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación se bloquea hasta que el modo se establezca explícitamente.

  </Accordion>
</AccordionGroup>

## Descubrir Gateways (Bonjour)

`gateway discover` busca balizas de Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour de área amplia): elige un dominio (ejemplo: `openclaw.internal.`) y configura DNS dividido + un servidor DNS; consulta [Bonjour](/es/gateway/bonjour).

Solo los Gateways con descubrimiento Bonjour habilitado (opción predeterminada) anuncian la baliza.

Los registros de descubrimiento de área amplia incluyen (TXT):

- `role` (sugerencia del rol del Gateway)
- `transport` (sugerencia de transporte, p. ej., `gateway`)
- `gatewayPort` (puerto WebSocket, normalmente `18789`)
- `sshPort` (opcional; los clientes usan de forma predeterminada `22` para los destinos SSH cuando está ausente)
- `tailnetDns` (nombre de host MagicDNS, cuando está disponible)
- `gatewayTls` / `gatewayTlsSha256` (TLS habilitado + huella digital del certificado)
- `cliPath` (sugerencia de instalación remota escrita en la zona de área amplia)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Tiempo de espera por comando (explorar/resolver).
</ParamField>
<ParamField path="--json" type="boolean">
  Salida legible por máquina (también desactiva estilos/indicador de carga).
</ParamField>

Ejemplos:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- La CLI examina `local.` más el dominio de área amplia configurado cuando hay uno habilitado.
- `wsUrl` en la salida JSON se deriva del extremo de servicio resuelto, no de sugerencias solo TXT como `lanHost` o `tailnetDns`.
- En mDNS `local.`, `sshPort` y `cliPath` solo se emiten cuando `discovery.mdns.mode` es `full`. DNS-SD de área amplia sigue escribiendo `cliPath`; `sshPort` también sigue siendo opcional allí.

</Note>

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Runbook de Gateway](/es/gateway)
