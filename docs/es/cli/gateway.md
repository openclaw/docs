---
read_when:
    - Ejecutar el Gateway desde la CLI (desarrollo o servidores)
    - Depuración de la autenticación de Gateway, los modos de enlace y la conectividad
    - Descubrimiento de gateways mediante Bonjour (DNS-SD local y de área amplia)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — ejecutar, consultar y descubrir gateways
title: Gateway
x-i18n:
    generated_at: "2026-05-11T20:27:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 774753c844909d1ec9257f2035b10c2561432ec2161351e9a6438cd12f7f2ecc
    source_path: cli/gateway.md
    workflow: 16
---

El Gateway es el servidor WebSocket de OpenClaw (canales, nodos, sesiones, hooks). Los subcomandos de esta página están bajo `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Detección Bonjour" href="/es/gateway/bonjour">
    Configuración de mDNS local + DNS-SD de área amplia.
  </Card>
  <Card title="Resumen de detección" href="/es/gateway/discovery">
    Cómo OpenClaw anuncia y encuentra gateways.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration">
    Claves de configuración de gateway de nivel superior.
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
  <Accordion title="Comportamiento de arranque">
    - De forma predeterminada, el Gateway se niega a iniciar a menos que `gateway.mode=local` esté configurado en `~/.openclaw/openclaw.json`. Usa `--allow-unconfigured` para ejecuciones ad-hoc/de desarrollo.
    - Se espera que `openclaw onboard --mode local` y `openclaw setup` escriban `gateway.mode=local`. Si el archivo existe pero falta `gateway.mode`, trátalo como una configuración rota o sobrescrita y repárala en lugar de asumir implícitamente el modo local.
    - Si el archivo existe y falta `gateway.mode`, el Gateway trata eso como daño sospechoso en la configuración y se niega a "adivinar local" por ti.
    - Se bloquea el enlace más allá de loopback sin autenticación (barrera de seguridad).
    - `SIGUSR1` desencadena un reinicio dentro del proceso cuando está autorizado (`commands.restart` está habilitado de forma predeterminada; configura `commands.restart: false` para bloquear el reinicio manual, mientras que la aplicación/actualización de la herramienta/configuración de gateway sigue permitida).
    - Los manejadores de `SIGINT`/`SIGTERM` detienen el proceso gateway, pero no restauran ningún estado de terminal personalizado. Si envuelves la CLI con una TUI o entrada en modo raw, restaura la terminal antes de salir.

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
  Anulación del token (también configura `OPENCLAW_GATEWAY_TOKEN` para el proceso).
</ParamField>
<ParamField path="--password <password>" type="string">
  Anulación de contraseña.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Leer la contraseña del gateway desde un archivo.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Exponer el Gateway mediante Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Restablecer la configuración serve/funnel de Tailscale al apagar.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Permitir que el gateway inicie sin `gateway.mode=local` en la configuración. Omite la barrera de arranque solo para bootstrap ad-hoc/de desarrollo; no escribe ni repara el archivo de configuración.
</ParamField>
<ParamField path="--dev" type="boolean">
  Crear una configuración de desarrollo + workspace si faltan (omite BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Restablecer la configuración de desarrollo + credenciales + sesiones + workspace (requiere `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Matar cualquier listener existente en el puerto seleccionado antes de iniciar.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Registros detallados.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Mostrar solo los registros del backend de la CLI en la consola (y habilitar stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Estilo de registro WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias de `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Registrar eventos raw del stream del modelo en jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ruta jsonl del stream raw.
</ParamField>

## Reiniciar el Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` pide al Gateway en ejecución que haga una comprobación previa del trabajo activo de OpenClaw antes de reiniciar. Si hay operaciones en cola, entrega de respuestas, ejecuciones integradas o ejecuciones de tareas activas, el Gateway informa los bloqueos, fusiona solicitudes duplicadas de reinicio seguro y reinicia cuando el trabajo activo se vacía. `restart` simple conserva el comportamiento existente del administrador de servicios por compatibilidad. Usa `--force` solo cuando quieras explícitamente la ruta de anulación inmediata.

`openclaw gateway restart --safe --skip-deferral` ejecuta el mismo reinicio coordinado y consciente de OpenClaw que `--safe`, pero omite la barrera de aplazamiento por trabajo activo para que el Gateway emita el reinicio inmediatamente incluso cuando se informan bloqueos. Úsalo como vía de escape del operador cuando un aplazamiento haya quedado fijado por una ejecución de tarea atascada y `--safe` solo esperaría indefinidamente. `--skip-deferral` requiere `--safe`.

<Warning>
`--password` inline puede quedar expuesto en listados de procesos locales. Prefiere `--password-file`, env o un `gateway.auth.password` respaldado por SecretRef.
</Warning>

### Perfilado de arranque

- Configura `OPENCLAW_GATEWAY_STARTUP_TRACE=1` para registrar tiempos de fases durante el arranque del Gateway, incluido el retraso `eventLoopMax` por fase y los tiempos de tablas de búsqueda de plugins para índice instalado, registro de manifiestos, planificación de arranque y trabajo de mapa de propietarios.
- Configura `OPENCLAW_DIAGNOSTICS=timeline` con `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` para escribir una línea de tiempo de diagnósticos de arranque JSONL de mejor esfuerzo para arneses externos de QA. También puedes habilitar la marca con `diagnostics.flags: ["timeline"]` en la configuración; la ruta sigue proporcionándose mediante env. Añade `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` para incluir muestras del event loop.
- Ejecuta `pnpm test:startup:gateway -- --runs 5 --warmup 1` para medir el rendimiento del arranque del Gateway. El benchmark registra la primera salida del proceso, `/healthz`, `/readyz`, tiempos de trazas de arranque, retraso del event loop y detalles de tiempos de tablas de búsqueda de plugins.

## Consultar un Gateway en ejecución

Todos los comandos de consulta usan RPC por WebSocket.

<Tabs>
  <Tab title="Modos de salida">
    - Predeterminado: legible para humanos (con colores en TTY).
    - `--json`: JSON legible por máquina (sin estilos/spinner).
    - `--no-color` (o `NO_COLOR=1`): deshabilita ANSI manteniendo el diseño humano.

  </Tab>
  <Tab title="Opciones compartidas">
    - `--url <url>`: URL WebSocket del Gateway.
    - `--token <token>`: token del Gateway.
    - `--password <password>`: contraseña del Gateway.
    - `--timeout <ms>`: timeout/presupuesto (varía por comando).
    - `--expect-final`: esperar una respuesta "final" (llamadas del agente).

  </Tab>
</Tabs>

<Note>
Cuando configuras `--url`, la CLI no recurre a credenciales de la configuración ni del entorno. Pasa `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

El endpoint HTTP `/healthz` es una sonda de actividad: devuelve una respuesta cuando el servidor puede responder HTTP. El endpoint HTTP `/readyz` es más estricto y permanece en rojo mientras los sidecars de plugins de arranque, canales o hooks configurados todavía se están estabilizando. Las respuestas detalladas de preparación locales o autenticadas incluyen un bloque de diagnóstico `eventLoop` con retraso del event loop, utilización del event loop, proporción de núcleos de CPU y una marca `degraded`.

### `gateway usage-cost`

Obtén resúmenes de costos de uso desde los registros de sesión.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Número de días a incluir.
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
  Número máximo de eventos recientes a incluir (máx. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filtrar por tipo de evento de diagnóstico, como `payload.large` o `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Incluir solo eventos posteriores a un número de secuencia de diagnóstico.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Leer un paquete de estabilidad persistido en lugar de llamar al Gateway en ejecución. Usa `--bundle latest` (o solo `--bundle`) para el paquete más nuevo bajo el directorio de estado, o pasa directamente una ruta JSON de paquete.
</ParamField>
<ParamField path="--export" type="boolean">
  Escribir un zip de diagnósticos de soporte compartible en lugar de imprimir detalles de estabilidad.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ruta de salida para `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacidad y comportamiento del paquete">
    - Los registros conservan metadatos operativos: nombres de eventos, conteos, tamaños en bytes, lecturas de memoria, estado de cola/sesión, nombres de canales/plugins y resúmenes de sesiones redactados. No conservan texto de chat, cuerpos de webhook, salidas de herramientas, cuerpos raw de solicitudes o respuestas, tokens, cookies, valores secretos, nombres de host ni ids raw de sesión. Configura `diagnostics.enabled: false` para deshabilitar el registrador por completo.
    - En salidas fatales del Gateway, timeouts de apagado y fallos de arranque tras reinicio, OpenClaw escribe la misma instantánea de diagnóstico en `~/.openclaw/logs/stability/openclaw-stability-*.json` cuando el registrador tiene eventos. Inspecciona el paquete más nuevo con `openclaw gateway stability --bundle latest`; `--limit`, `--type` y `--since-seq` también se aplican a la salida del paquete.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Escribe un zip de diagnósticos local diseñado para adjuntar a informes de errores. Para el modelo de privacidad y el contenido del paquete, consulta [Exportación de diagnósticos](/es/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ruta del zip de salida. El valor predeterminado es una exportación de soporte bajo el directorio de estado.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Máximo de líneas de registro sanitizadas a incluir.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Máximo de bytes de registro a inspeccionar.
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
  Omitir la búsqueda del paquete de estabilidad persistido.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprimir la ruta escrita, el tamaño y el manifiesto como JSON.
</ParamField>

La exportación contiene un manifiesto, un resumen en Markdown, forma de configuración, detalles de configuración sanitizados, resúmenes de registros sanitizados, instantáneas sanitizadas de estado/salud del Gateway y el paquete de estabilidad más nuevo cuando existe uno.

Está pensada para compartirse. Conserva detalles operativos que ayudan a depurar, como campos seguros de registro de OpenClaw, nombres de subsistemas, códigos de estado, duraciones, modos configurados, puertos, ids de plugins, ids de proveedores, configuraciones de funciones no secretas y mensajes de registro operativos redactados. Omite o redacta texto de chat, cuerpos de webhook, salidas de herramientas, credenciales, cookies, identificadores de cuenta/mensaje, texto de prompts/instrucciones, nombres de host y valores secretos. Cuando un mensaje de estilo LogTape parece texto de payload de usuario/chat/herramienta, la exportación conserva solo que se omitió un mensaje más su conteo de bytes.

### `gateway status`

`gateway status` muestra el servicio Gateway (launchd/systemd/schtasks) más una sonda opcional de conectividad/capacidad de autenticación.

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
  También analiza servicios de nivel de sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Eleva el sondeo de conectividad predeterminado a un sondeo de lectura y sale con código distinto de cero cuando ese sondeo de lectura falla. No se puede combinar con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semántica de estado">
    - `gateway status` sigue disponible para diagnósticos incluso cuando falta la configuración de la CLI local o no es válida.
    - `gateway status` predeterminado prueba el estado del servicio, la conexión WebSocket y la capacidad de autenticación visible en el momento del handshake. No prueba operaciones de lectura/escritura/administración.
    - Los sondeos de diagnóstico no mutan la autenticación de dispositivos por primera vez: reutilizan un token de dispositivo existente en caché cuando existe uno, pero no crean una nueva identidad de dispositivo de la CLI ni un registro de emparejamiento de dispositivo de solo lectura solo para comprobar el estado.
    - `gateway status` resuelve los SecretRefs de autenticación configurados para la autenticación del sondeo cuando es posible.
    - Si un SecretRef de autenticación requerido no se resuelve en esta ruta de comando, `gateway status --json` informa `rpc.authWarning` cuando falla la conectividad/autenticación del sondeo; pasa `--token`/`--password` explícitamente o resuelve primero el origen del secreto.
    - Si el sondeo se realiza correctamente, las advertencias de referencias de autenticación no resueltas se suprimen para evitar falsos positivos.
    - Usa `--require-rpc` en scripts y automatización cuando un servicio en escucha no sea suficiente y también necesites que las llamadas RPC con alcance de lectura estén sanas.
    - `--deep` añade un análisis de mejor esfuerzo para instalaciones adicionales de launchd/systemd/schtasks. Cuando se detectan varios servicios similares a Gateway, la salida legible por humanos imprime sugerencias de limpieza y advierte que la mayoría de las configuraciones deberían ejecutar un Gateway por máquina.
    - `--deep` también informa de una entrega de reinicio reciente del supervisor del Gateway cuando el proceso del servicio salió limpiamente para un reinicio de supervisor externo.
    - `--deep` ejecuta la validación de configuración en modo consciente de Plugin (`pluginValidation: "full"`) y muestra advertencias de manifiesto de Plugin configurado (por ejemplo, metadatos de configuración de canal faltantes) para que las comprobaciones rápidas de instalación y actualización las detecten. `gateway status` predeterminado mantiene la ruta rápida de solo lectura que omite la validación de Plugin.
    - La salida legible por humanos incluye la ruta resuelta del archivo de log más la instantánea de rutas/validez de configuración de CLI frente a servicio para ayudar a diagnosticar desviaciones de perfil o directorio de estado.

  </Accordion>
  <Accordion title="Comprobaciones de deriva de autenticación de Linux systemd">
    - En instalaciones de Linux systemd, las comprobaciones de deriva de autenticación del servicio leen los valores `Environment=` y `EnvironmentFile=` de la unidad (incluidos `%h`, rutas entrecomilladas, varios archivos y archivos opcionales `-`).
    - Las comprobaciones de deriva resuelven los SecretRefs de `gateway.auth.token` usando el entorno de ejecución combinado (primero el entorno del comando de servicio, luego el entorno del proceso como respaldo).
    - Si la autenticación con token no está efectivamente activa (`gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, o modo no definido donde la contraseña puede ganar y ningún candidato de token puede ganar), las comprobaciones de deriva de token omiten la resolución del token de configuración.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` es el comando para "depurar todo". Siempre sondea:

- tu Gateway remoto configurado (si está establecido), y
- localhost (loopback) **aunque el remoto esté configurado**.

Si pasas `--url`, ese destino explícito se añade antes de ambos. La salida legible por humanos etiqueta los destinos como:

- `URL (explícita)`
- `Remoto (configurado)` o `Remoto (configurado, inactivo)`
- `Local loopback`

<Note>
Si varios gateways son alcanzables, los imprime todos. Se admiten varios gateways cuando usas perfiles/puertos aislados (por ejemplo, un bot de rescate), pero la mayoría de las instalaciones siguen ejecutando un solo Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretación">
    - `Reachable: yes` significa que al menos un destino aceptó una conexión WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` informa de lo que el sondeo pudo probar sobre la autenticación. Es independiente de la alcanzabilidad.
    - `Read probe: ok` significa que las llamadas RPC de detalle con alcance de lectura (`health`/`status`/`system-presence`/`config.get`) también se realizaron correctamente.
    - `Read probe: limited - missing scope: operator.read` significa que la conexión se realizó correctamente, pero la RPC con alcance de lectura está limitada. Esto se informa como alcanzabilidad **degradada**, no como fallo completo.
    - `Read probe: failed` después de `Connect: ok` significa que el Gateway aceptó la conexión WebSocket, pero los diagnósticos de lectura posteriores agotaron el tiempo de espera o fallaron. Esto también es alcanzabilidad **degradada**, no un Gateway inalcanzable.
    - Al igual que `gateway status`, el sondeo reutiliza la autenticación de dispositivo existente en caché, pero no crea identidad de dispositivo por primera vez ni estado de emparejamiento.
    - El código de salida solo es distinto de cero cuando ningún destino sondeado es alcanzable.

  </Accordion>
  <Accordion title="Salida JSON">
    Nivel superior:

    - `ok`: al menos un destino es alcanzable.
    - `degraded`: al menos un destino aceptó una conexión pero no completó todos los diagnósticos RPC de detalle.
    - `capability`: mejor capacidad observada entre los destinos alcanzables (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: mejor destino para tratar como ganador activo en este orden: URL explícita, túnel SSH, remoto configurado y luego local loopback.
    - `warnings[]`: registros de advertencia de mejor esfuerzo con `code`, `message` y `targetIds` opcional.
    - `network`: sugerencias de URL local loopback/tailnet derivadas de la configuración actual y la red del host.
    - `discovery.timeoutMs` y `discovery.count`: el presupuesto de descubrimiento real/recuento de resultados usado para esta pasada de sondeo.

    Por destino (`targets[].connect`):

    - `ok`: alcanzabilidad después de conexión + clasificación degradada.
    - `rpcOk`: éxito completo de RPC de detalle.
    - `scopeLimited`: la RPC de detalle falló por falta de alcance de operador.

    Por destino (`targets[].auth`):

    - `role`: rol de autenticación informado en `hello-ok` cuando está disponible.
    - `scopes`: alcances concedidos informados en `hello-ok` cuando están disponibles.
    - `capability`: la clasificación de capacidad de autenticación expuesta para ese destino.

  </Accordion>
  <Accordion title="Códigos de advertencia comunes">
    - `ssh_tunnel_failed`: falló la configuración del túnel SSH; el comando recurrió a sondeos directos.
    - `multiple_gateways`: más de un destino fue alcanzable; esto es inusual salvo que ejecutes intencionalmente perfiles aislados, como un bot de rescate.
    - `auth_secretref_unresolved`: no se pudo resolver un SecretRef de autenticación configurado para un destino fallido.
    - `probe_scope_limited`: la conexión WebSocket se realizó correctamente, pero el sondeo de lectura estuvo limitado por la falta de `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto por SSH (paridad con la app de Mac)

El modo "Remoto por SSH" de la app de macOS usa un reenvío de puerto local para que el Gateway remoto (que puede estar enlazado solo a loopback) sea alcanzable en `ws://127.0.0.1:<port>`.

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
  Elige el primer host de Gateway descubierto como destino SSH desde el endpoint de descubrimiento resuelto (`local.` más el dominio de área amplia configurado, si existe). Las sugerencias solo TXT se ignoran.
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
  Principalmente para RPC de estilo agente que transmiten eventos intermedios antes de una carga útil final.
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

Para eliminar un wrapper persistido, borra `OPENCLAW_WRAPPER` al reinstalar:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Opciones de comando">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Comportamiento del ciclo de vida">
    - Usa `gateway restart` para reiniciar un servicio gestionado. No encadenes `gateway stop` y `gateway start` como sustituto de reinicio.
    - En macOS, `gateway stop` usa `launchctl bootout` de forma predeterminada, lo que elimina el LaunchAgent de la sesión de arranque actual sin hacer persistente una desactivación: la recuperación automática KeepAlive permanece activa para futuros bloqueos y `gateway start` vuelve a habilitarlo limpiamente sin un `launchctl enable` manual. Pasa `--disable` para suprimir de forma persistente KeepAlive y RunAtLoad, de modo que el Gateway no se reinicie hasta el siguiente `gateway start` explícito; úsalo cuando una detención manual deba sobrevivir a reinicios o rearranques del sistema.
    - `gateway restart --safe` solicita al Gateway en ejecución que compruebe previamente el trabajo activo de OpenClaw y aplace el reinicio hasta que se vacíen la entrega de respuestas, las ejecuciones incrustadas y las ejecuciones de tareas. `--safe` no se puede combinar con `--force` ni con `--wait`.
    - `gateway restart --wait 30s` anula el presupuesto de vaciado de reinicio configurado para ese reinicio. Los números sin unidad son milisegundos; se aceptan unidades como `s`, `m` y `h`. `--wait 0` espera indefinidamente.
    - `gateway restart --safe --skip-deferral` ejecuta el reinicio seguro compatible con OpenClaw, pero omite la compuerta de aplazamiento para que el Gateway emita el reinicio de inmediato incluso cuando se informen bloqueadores. Vía de escape del operador para aplazamientos de ejecuciones de tareas atascadas; requiere `--safe`.
    - `gateway restart --force` omite el vaciado de trabajo activo y reinicia de inmediato. Úsalo cuando un operador ya haya inspeccionado los bloqueadores de tareas enumerados y quiera que el Gateway vuelva ahora.
    - Los comandos de ciclo de vida aceptan `--json` para scripting.

  </Accordion>
  <Accordion title="Autenticación y SecretRefs en el momento de instalación">
    - Cuando la autenticación con token requiere un token y `gateway.auth.token` está gestionado por SecretRef, `gateway install` valida que el SecretRef se pueda resolver, pero no persiste el token resuelto en los metadatos del entorno del servicio.
    - Si la autenticación con token requiere un token y el SecretRef de token configurado no se resuelve, la instalación falla de forma cerrada en lugar de persistir texto sin formato de reserva.
    - Para la autenticación con contraseña en `gateway run`, prefiere `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` respaldado por SecretRef antes que `--password` en línea.
    - En modo de autenticación inferida, `OPENCLAW_GATEWAY_PASSWORD` solo en la shell no relaja los requisitos de token de instalación; usa configuración duradera (`gateway.auth.password` o `env` de configuración) al instalar un servicio gestionado.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación se bloquea hasta que el modo se establezca explícitamente.

  </Accordion>
</AccordionGroup>

## Descubrir gateways (Bonjour)

`gateway discover` busca beacons de Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour de área amplia): elige un dominio (ejemplo: `openclaw.internal.`) y configura DNS dividido + un servidor DNS; consulta [Bonjour](/es/gateway/bonjour).

Solo los gateways con descubrimiento Bonjour habilitado (predeterminado) anuncian el beacon.

Los registros de descubrimiento de área amplia incluyen (TXT):

- `role` (sugerencia de rol del Gateway)
- `transport` (sugerencia de transporte, p. ej. `gateway`)
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
  Tiempo de espera por comando (explorar/resolver).
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
- `wsUrl` en la salida JSON se deriva del endpoint de servicio resuelto, no de sugerencias solo TXT como `lanHost` o `tailnetDns`.
- En mDNS `local.`, `sshPort` y `cliPath` solo se difunden cuando `discovery.mdns.mode` es `full`. DNS-SD de área amplia aún escribe `cliPath`; `sshPort` también sigue siendo opcional allí.

</Note>

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Runbook del Gateway](/es/gateway)
