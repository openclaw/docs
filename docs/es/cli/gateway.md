---
read_when:
    - Ejecutar el Gateway desde la CLI (desarrollo o servidores)
    - Depuración de la autenticación del Gateway, los modos de enlace y la conectividad
    - Descubrimiento de Gateways mediante Bonjour (DNS-SD local y de área amplia)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — ejecuta, consulta y descubre gateways
title: Gateway
x-i18n:
    generated_at: "2026-05-05T08:25:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89f798724971151cdd297fcdbbc1fe79dedc19f57521f2ad2c1fff0f9acf9b24
    source_path: cli/gateway.md
    workflow: 16
---

El Gateway es el servidor WebSocket de OpenClaw (canales, nodos, sesiones, hooks). Los subcomandos de esta página están bajo `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Descubrimiento Bonjour" href="/es/gateway/bonjour">
    Configuración local de mDNS + DNS-SD de área amplia.
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
    - De forma predeterminada, el Gateway se niega a iniciar a menos que `gateway.mode=local` esté configurado en `~/.openclaw/openclaw.json`. Usa `--allow-unconfigured` para ejecuciones ad hoc/de desarrollo.
    - Se espera que `openclaw onboard --mode local` y `openclaw setup` escriban `gateway.mode=local`. Si el archivo existe pero falta `gateway.mode`, trátalo como una configuración rota o sobrescrita y repárala en lugar de asumir implícitamente el modo local.
    - Si el archivo existe y falta `gateway.mode`, el Gateway trata eso como daño sospechoso en la configuración y se niega a "adivinar local" por ti.
    - Se bloquea el enlace más allá de loopback sin autenticación (barrera de seguridad).
    - `SIGUSR1` activa un reinicio dentro del proceso cuando está autorizado (`commands.restart` está habilitado de forma predeterminada; establece `commands.restart: false` para bloquear el reinicio manual, mientras que la aplicación/actualización de herramientas/configuración del gateway sigue permitida).
    - Los manejadores de `SIGINT`/`SIGTERM` detienen el proceso del gateway, pero no restauran ningún estado personalizado de la terminal. Si envuelves la CLI con una TUI o entrada en modo sin procesar, restaura la terminal antes de salir.

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
  Sobrescritura del modo de autenticación.
</ParamField>
<ParamField path="--token <token>" type="string">
  Sobrescritura del token (también establece `OPENCLAW_GATEWAY_TOKEN` para el proceso).
</ParamField>
<ParamField path="--password <password>" type="string">
  Sobrescritura de la contraseña.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Lee la contraseña del gateway desde un archivo.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Expón el Gateway mediante Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Restablece la configuración de Tailscale serve/funnel al apagar.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Permite iniciar el gateway sin `gateway.mode=local` en la configuración. Omite la protección de inicio solo para arranque ad hoc/de desarrollo; no escribe ni repara el archivo de configuración.
</ParamField>
<ParamField path="--dev" type="boolean">
  Crea una configuración + espacio de trabajo de desarrollo si faltan (omite BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Restablece configuración de desarrollo + credenciales + sesiones + espacio de trabajo (requiere `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Mata cualquier listener existente en el puerto seleccionado antes de iniciar.
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
  Registra eventos sin procesar del stream del modelo en jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ruta jsonl del stream sin procesar.
</ParamField>

## Reiniciar el Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` pide al Gateway en ejecución que haga una comprobación previa del trabajo activo de OpenClaw antes de reiniciar. Si hay operaciones en cola, entrega de respuestas, ejecuciones integradas o ejecuciones de tareas activas, el Gateway informa los bloqueadores, fusiona solicitudes duplicadas de reinicio seguro y reinicia cuando el trabajo activo se agota. `restart` simple conserva el comportamiento existente del administrador de servicios por compatibilidad. Usa `--force` solo cuando quieras explícitamente la ruta de anulación inmediata.

<Warning>
`--password` en línea puede exponerse en listados de procesos locales. Prefiere `--password-file`, env o un `gateway.auth.password` respaldado por SecretRef.
</Warning>

### Perfilado de inicio

- Establece `OPENCLAW_GATEWAY_STARTUP_TRACE=1` para registrar tiempos de fases durante el inicio del Gateway, incluido el retraso `eventLoopMax` por fase y tiempos de tablas de búsqueda de plugins para installed-index, registro de manifiestos, planificación de inicio y trabajo de owner-map.
- Establece `OPENCLAW_DIAGNOSTICS=timeline` con `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` para escribir una cronología de diagnósticos de inicio JSONL de mejor esfuerzo para arneses externos de QA. También puedes habilitar la bandera con `diagnostics.flags: ["timeline"]` en la configuración; la ruta sigue proporcionándose mediante env. Añade `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` para incluir muestras del bucle de eventos.
- Ejecuta `pnpm test:startup:gateway -- --runs 5 --warmup 1` para medir el inicio del Gateway. La medición registra la primera salida del proceso, `/healthz`, `/readyz`, tiempos de traza de inicio, retraso del bucle de eventos y detalles de tiempos de tablas de búsqueda de plugins.

## Consultar un Gateway en ejecución

Todos los comandos de consulta usan RPC de WebSocket.

<Tabs>
  <Tab title="Modos de salida">
    - Predeterminado: legible para humanos (con color en TTY).
    - `--json`: JSON legible por máquina (sin estilo/spinner).
    - `--no-color` (o `NO_COLOR=1`): deshabilita ANSI mientras mantiene el diseño humano.

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
Cuando estableces `--url`, la CLI no recurre a credenciales de configuración o entorno. Pasa `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

El endpoint HTTP `/healthz` es una sonda de disponibilidad básica: devuelve una respuesta cuando el servidor puede responder HTTP. El endpoint HTTP `/readyz` es más estricto y permanece en rojo mientras los sidecars de plugins de inicio, canales o hooks configurados todavía se están estabilizando. Las respuestas detalladas de preparación locales o autenticadas incluyen un bloque de diagnóstico `eventLoop` con retraso del bucle de eventos, utilización del bucle de eventos, proporción de núcleos de CPU y una bandera `degraded`.

### `gateway usage-cost`

Obtén resúmenes de costo de uso desde registros de sesión.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Número de días que incluir.
</ParamField>

### `gateway stability`

Obtén el registrador de estabilidad diagnóstica reciente desde un Gateway en ejecución.

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
  Filtra por tipo de evento diagnóstico, como `payload.large` o `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Incluye solo eventos posteriores a un número de secuencia diagnóstica.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lee un paquete de estabilidad persistido en lugar de llamar al Gateway en ejecución. Usa `--bundle latest` (o solo `--bundle`) para el paquete más nuevo bajo el directorio de estado, o pasa directamente una ruta JSON de paquete.
</ParamField>
<ParamField path="--export" type="boolean">
  Escribe un zip de diagnósticos de soporte compartible en lugar de imprimir detalles de estabilidad.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ruta de salida para `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacidad y comportamiento de paquetes">
    - Los registros conservan metadatos operativos: nombres de eventos, conteos, tamaños en bytes, lecturas de memoria, estado de colas/sesiones, nombres de canales/plugins y resúmenes de sesiones redactados. No conservan texto de chat, cuerpos de webhook, salidas de herramientas, cuerpos sin procesar de solicitud o respuesta, tokens, cookies, valores secretos, nombres de host ni ids de sesión sin procesar. Establece `diagnostics.enabled: false` para deshabilitar por completo el registrador.
    - En salidas fatales del Gateway, tiempos de espera de apagado y fallos de inicio durante reinicio, OpenClaw escribe la misma instantánea diagnóstica en `~/.openclaw/logs/stability/openclaw-stability-*.json` cuando el registrador tiene eventos. Inspecciona el paquete más nuevo con `openclaw gateway stability --bundle latest`; `--limit`, `--type` y `--since-seq` también se aplican a la salida de paquetes.

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
  Ruta del zip de salida. De forma predeterminada, es una exportación de soporte bajo el directorio de estado.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Número máximo de líneas de registro saneadas que incluir.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Número máximo de bytes de registro que inspeccionar.
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

La exportación contiene un manifiesto, un resumen en Markdown, la forma de la configuración, detalles de configuración saneados, resúmenes de registros saneados, instantáneas saneadas de estado/salud del Gateway y el paquete de estabilidad más nuevo cuando existe uno.

Está pensada para compartirse. Conserva detalles operativos que ayudan a depurar, como campos seguros de registros de OpenClaw, nombres de subsistemas, códigos de estado, duraciones, modos configurados, puertos, ids de plugins, ids de proveedores, ajustes de funciones no secretos y mensajes operativos de registro redactados. Omite o redacta texto de chat, cuerpos de webhook, salidas de herramientas, credenciales, cookies, identificadores de cuenta/mensaje, texto de prompt/instrucciones, nombres de host y valores secretos. Cuando un mensaje de estilo LogTape parece texto de carga útil de usuario/chat/herramienta, la exportación conserva solo que se omitió un mensaje más su conteo de bytes.

### `gateway status`

`gateway status` muestra el servicio Gateway (launchd/systemd/schtasks) más una sonda opcional de capacidad de conectividad/autenticación.

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
  Escanea también los servicios de nivel del sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Convierte el sondeo de conectividad predeterminado en un sondeo de lectura y sale con código distinto de cero cuando ese sondeo de lectura falla. No se puede combinar con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semántica de estado">
    - `gateway status` permanece disponible para diagnósticos incluso cuando la configuración local de la CLI falta o no es válida.
    - `gateway status` predeterminado prueba el estado del servicio, la conexión WebSocket y la capacidad de autenticación visible en el momento del handshake. No prueba operaciones de lectura/escritura/administración.
    - Los sondeos de diagnóstico no mutan nada para la autenticación inicial de dispositivos: reutilizan un token de dispositivo existente en caché cuando existe, pero no crean una nueva identidad de dispositivo de la CLI ni un registro de emparejamiento de dispositivo de solo lectura solo para comprobar el estado.
    - `gateway status` resuelve SecretRefs de autenticación configuradas para la autenticación del sondeo cuando es posible.
    - Si una SecretRef de autenticación requerida no se resuelve en esta ruta de comando, `gateway status --json` informa `rpc.authWarning` cuando falla la conectividad/autenticación del sondeo; pasa `--token`/`--password` explícitamente o resuelve primero la fuente del secreto.
    - Si el sondeo se realiza correctamente, las advertencias de auth-ref no resueltas se suprimen para evitar falsos positivos.
    - Usa `--require-rpc` en scripts y automatización cuando un servicio en escucha no sea suficiente y también necesites que las llamadas RPC con alcance de lectura estén sanas.
    - `--deep` añade un escaneo de mejor esfuerzo para instalaciones adicionales de launchd/systemd/schtasks. Cuando se detectan varios servicios similares al gateway, la salida para personas imprime sugerencias de limpieza y advierte que la mayoría de las configuraciones deberían ejecutar un Gateway por máquina.
    - `--deep` también informa una transferencia reciente de reinicio del supervisor del Gateway cuando el proceso del servicio salió limpiamente para un reinicio de supervisor externo.
    - La salida para personas incluye la ruta resuelta del registro de archivo más una instantánea de rutas/validez de configuración CLI frente a servicio para ayudar a diagnosticar derivas de perfil o state-dir.

  </Accordion>
  <Accordion title="Comprobaciones de deriva de autenticación de systemd en Linux">
    - En instalaciones systemd de Linux, las comprobaciones de deriva de autenticación del servicio leen valores `Environment=` y `EnvironmentFile=` de la unidad (incluidos `%h`, rutas entrecomilladas, varios archivos y archivos opcionales con `-`).
    - Las comprobaciones de deriva resuelven SecretRefs de `gateway.auth.token` usando el entorno de runtime combinado (primero el entorno del comando de servicio y luego el entorno del proceso como reserva).
    - Si la autenticación con token no está efectivamente activa (`gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, o modo no definido donde la contraseña puede prevalecer y ningún candidato de token puede prevalecer), las comprobaciones de deriva de token omiten la resolución del token de configuración.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` es el comando para "depurarlo todo". Siempre sondea:

- tu gateway remoto configurado (si está definido), y
- localhost (loopback) **aunque el remoto esté configurado**.

Si pasas `--url`, ese destino explícito se añade antes de ambos. La salida para personas etiqueta los destinos como:

- `URL (explícita)`
- `Remoto (configurado)` o `Remoto (configurado, inactivo)`
- `Local loopback`

<Note>
Si varios gateways son accesibles, los imprime todos. Se admiten varios gateways cuando usas perfiles/puertos aislados (por ejemplo, un bot de rescate), pero la mayoría de las instalaciones siguen ejecutando un único gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretación">
    - `Reachable: yes` significa que al menos un destino aceptó una conexión WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` informa lo que el sondeo pudo probar sobre la autenticación. Es independiente de la accesibilidad.
    - `Read probe: ok` significa que las llamadas RPC de detalle con alcance de lectura (`health`/`status`/`system-presence`/`config.get`) también se completaron correctamente.
    - `Read probe: limited - missing scope: operator.read` significa que la conexión se completó, pero el RPC con alcance de lectura está limitado. Esto se informa como accesibilidad **degradada**, no como fallo completo.
    - `Read probe: failed` después de `Connect: ok` significa que el Gateway aceptó la conexión WebSocket, pero los diagnósticos de lectura posteriores agotaron el tiempo de espera o fallaron. Esto también es accesibilidad **degradada**, no un Gateway inaccesible.
    - Igual que `gateway status`, el sondeo reutiliza la autenticación de dispositivo existente en caché, pero no crea una identidad de dispositivo inicial ni estado de emparejamiento.
    - El código de salida es distinto de cero solo cuando ningún destino sondeado es accesible.

  </Accordion>
  <Accordion title="Salida JSON">
    Nivel superior:

    - `ok`: al menos un destino es accesible.
    - `degraded`: al menos un destino aceptó una conexión pero no completó todos los diagnósticos RPC de detalle.
    - `capability`: mejor capacidad observada entre los destinos accesibles (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: mejor destino para tratar como ganador activo en este orden: URL explícita, túnel SSH, remoto configurado y luego local loopback.
    - `warnings[]`: registros de advertencia de mejor esfuerzo con `code`, `message` y `targetIds` opcionales.
    - `network`: sugerencias de URL de local loopback/tailnet derivadas de la configuración actual y la red del host.
    - `discovery.timeoutMs` y `discovery.count`: el presupuesto de descubrimiento/recuento de resultados real usado para esta pasada de sondeo.

    Por destino (`targets[].connect`):

    - `ok`: accesibilidad después de la clasificación de conexión + degradación.
    - `rpcOk`: éxito completo de RPC de detalle.
    - `scopeLimited`: el RPC de detalle falló porque faltaba el alcance de operador.

    Por destino (`targets[].auth`):

    - `role`: rol de autenticación informado en `hello-ok` cuando está disponible.
    - `scopes`: alcances concedidos informados en `hello-ok` cuando están disponibles.
    - `capability`: clasificación de capacidad de autenticación expuesta para ese destino.

  </Accordion>
  <Accordion title="Códigos de advertencia comunes">
    - `ssh_tunnel_failed`: falló la configuración del túnel SSH; el comando recurrió a sondeos directos.
    - `multiple_gateways`: más de un destino fue accesible; esto es inusual salvo que ejecutes perfiles aislados intencionalmente, como un bot de rescate.
    - `auth_secretref_unresolved`: no se pudo resolver una SecretRef de autenticación configurada para un destino fallido.
    - `probe_scope_limited`: la conexión WebSocket se completó, pero el sondeo de lectura quedó limitado por la falta de `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto sobre SSH (paridad con la app de Mac)

El modo "Remoto sobre SSH" de la app de macOS usa un reenvío de puerto local para que el gateway remoto (que puede estar vinculado solo a loopback) sea accesible en `ws://127.0.0.1:<port>`.

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
  Elige el primer host de gateway descubierto como destino SSH desde el endpoint de descubrimiento resuelto (`local.` más el dominio de área amplia configurado, si lo hay). Las sugerencias solo TXT se ignoran.
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
shim de gestor de secretos o un ayudante para ejecutar como otro usuario. El wrapper recibe los argumentos normales del Gateway y es
responsable de terminar ejecutando `openclaw` o Node con esos argumentos.

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

También puedes establecer el wrapper mediante el entorno. `gateway install` valida que la ruta sea
un archivo ejecutable, escribe el wrapper en `ProgramArguments` del servicio y conserva
`OPENCLAW_WRAPPER` en el entorno del servicio para reinstalaciones forzadas, actualizaciones y reparaciones de doctor posteriores.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Para eliminar un wrapper persistente, borra `OPENCLAW_WRAPPER` durante la reinstalación:

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
    - `gateway restart --safe` pide al Gateway en ejecución que haga una comprobación previa del trabajo activo de OpenClaw y difiera el reinicio hasta que se vacíen la entrega de respuestas, las ejecuciones integradas y las ejecuciones de tareas. `--safe` no se puede combinar con `--force` ni `--wait`.
    - `gateway restart --wait 30s` sustituye el presupuesto configurado de drenaje de reinicio para ese reinicio. Los números sin unidad son milisegundos; se aceptan unidades como `s`, `m` y `h`. `--wait 0` espera indefinidamente.
    - `gateway restart --force` omite el drenaje de trabajo activo y reinicia inmediatamente. Úsalo cuando un operador ya haya inspeccionado los bloqueadores de tareas enumerados y quiera recuperar el gateway ahora.
    - Los comandos de ciclo de vida aceptan `--json` para scripting.

  </Accordion>
  <Accordion title="Autenticación y SecretRefs durante la instalación">
    - Cuando la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, `gateway install` valida que el SecretRef pueda resolverse, pero no conserva el token resuelto en los metadatos del entorno del servicio.
    - Si la autenticación por token requiere un token y el SecretRef del token configurado no está resuelto, la instalación falla de forma cerrada en lugar de conservar texto sin formato alternativo.
    - Para la autenticación por contraseña en `gateway run`, prefiere `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` respaldado por SecretRef en lugar de `--password` en línea.
    - En el modo de autenticación inferido, `OPENCLAW_GATEWAY_PASSWORD` solo de shell no relaja los requisitos de token de instalación; usa configuración duradera (`gateway.auth.password` o `env` de configuración) al instalar un servicio administrado.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación se bloquea hasta que el modo se establezca explícitamente.

  </Accordion>
</AccordionGroup>

## Descubrir gateways (Bonjour)

`gateway discover` busca anuncios de Gateway (`_openclaw-gw._tcp`).

- DNS-SD de multidifusión: `local.`
- DNS-SD de unidifusión (Bonjour de área amplia): elige un dominio (ejemplo: `openclaw.internal.`) y configura DNS dividido + un servidor DNS; consulta [Bonjour](/es/gateway/bonjour).

Solo los gateways con descubrimiento Bonjour habilitado (valor predeterminado) anuncian el beacon.

Los registros de descubrimiento de área amplia incluyen (TXT):

- `role` (indicación del rol del gateway)
- `transport` (indicación del transporte, p. ej., `gateway`)
- `gatewayPort` (puerto WebSocket, normalmente `18789`)
- `sshPort` (opcional; los clientes usan `22` de forma predeterminada para los destinos SSH cuando no está presente)
- `tailnetDns` (nombre de host MagicDNS, cuando está disponible)
- `gatewayTls` / `gatewayTlsSha256` (TLS habilitado + huella digital del certificado)
- `cliPath` (indicación de instalación remota escrita en la zona de área amplia)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Tiempo de espera por comando (examinar/resolver).
</ParamField>
<ParamField path="--json" type="boolean">
  Salida legible por máquina (también deshabilita el estilo/spinner).
</ParamField>

Ejemplos:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- La CLI busca en `local.` más el dominio de área amplia configurado cuando hay uno habilitado.
- `wsUrl` en la salida JSON se deriva del endpoint de servicio resuelto, no de indicaciones solo TXT como `lanHost` o `tailnetDns`.
- En mDNS de `local.`, `sshPort` y `cliPath` solo se difunden cuando `discovery.mdns.mode` es `full`. DNS-SD de área amplia sigue escribiendo `cliPath`; `sshPort` también permanece opcional allí.

</Note>

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Runbook de Gateway](/es/gateway)
