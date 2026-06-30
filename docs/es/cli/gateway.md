---
read_when:
    - Ejecutar el Gateway desde la CLI (desarrollo o servidores)
    - Depuración de autenticación del Gateway, modos de enlace y conectividad
    - Descubrir gateways mediante Bonjour (DNS-SD local y de área amplia)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — ejecutar, consultar y descubrir gateways
title: Gateway
x-i18n:
    generated_at: "2026-06-30T13:47:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c33900a9bdc61c1e922e424dbfce139c6591a7a5071ed8263b172e19bdf653b
    source_path: cli/gateway.md
    workflow: 16
---

El Gateway es el servidor WebSocket de OpenClaw (canales, nodos, sesiones, hooks). Los subcomandos de esta página viven bajo `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Descubrimiento Bonjour" href="/es/gateway/bonjour">
    Configuración de mDNS local + DNS-SD de área amplia.
  </Card>
  <Card title="Resumen de descubrimiento" href="/es/gateway/discovery">
    Cómo OpenClaw anuncia y encuentra gateways.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration">
    Claves de configuración de Gateway de nivel superior.
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
    - De forma predeterminada, el Gateway se niega a arrancar a menos que `gateway.mode=local` esté definido en `~/.openclaw/openclaw.json`. Usa `--allow-unconfigured` para ejecuciones ad hoc/de desarrollo.
    - Se espera que `openclaw onboard --mode local` y `openclaw setup` escriban `gateway.mode=local`. Si el archivo existe pero falta `gateway.mode`, trátalo como una configuración rota o sobrescrita y repárala en lugar de asumir implícitamente el modo local.
    - Si el archivo existe y falta `gateway.mode`, el Gateway lo trata como daño sospechoso en la configuración y se niega a "adivinar local" por ti.
    - Se bloquea el enlace más allá de loopback sin autenticación (medida de seguridad).
    - `lan`, `tailnet` y `custom` actualmente se resuelven sobre rutas BYOH solo IPv4.
    - BYOH solo IPv6 no es compatible de forma nativa en esta ruta hoy. Usa un sidecar o proxy IPv4 si el propio host es solo IPv6.
    - `SIGUSR1` activa un reinicio en proceso cuando está autorizado (`commands.restart` está habilitado de forma predeterminada; define `commands.restart: false` para bloquear el reinicio manual, mientras que aplicar/actualizar la herramienta/configuración del gateway sigue permitido).
    - Los manejadores de `SIGINT`/`SIGTERM` detienen el proceso del gateway, pero no restauran ningún estado personalizado de la terminal. Si envuelves la CLI con una TUI o entrada en modo raw, restaura la terminal antes de salir.

  </Accordion>
</AccordionGroup>

### Opciones

<ParamField path="--port <port>" type="number">
  Puerto WebSocket (el valor predeterminado viene de config/env; normalmente `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Modo de enlace del listener. `lan`, `tailnet` y `custom` actualmente se resuelven sobre rutas solo IPv4.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Sobrescritura del modo de autenticación.
</ParamField>
<ParamField path="--token <token>" type="string">
  Sobrescritura del token (también define `OPENCLAW_GATEWAY_TOKEN` para el proceso).
</ParamField>
<ParamField path="--password <password>" type="string">
  Sobrescritura de la contraseña.
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
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  Hoy espera una dirección IPv4. Para BYOH solo IPv6, coloca un sidecar o proxy IPv4 delante del Gateway y apunta OpenClaw a ese endpoint IPv4.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Permitir el arranque del gateway sin `gateway.mode=local` en la configuración. Omite la protección de arranque solo para bootstrap ad hoc/de desarrollo; no escribe ni repara el archivo de configuración.
</ParamField>
<ParamField path="--dev" type="boolean">
  Crear una configuración de desarrollo + workspace si faltan (omite BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Restablecer configuración de desarrollo + credenciales + sesiones + workspace (requiere `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Terminar cualquier listener existente en el puerto seleccionado antes de arrancar.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Registros detallados.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Mostrar solo registros del backend de la CLI en la consola (y habilitar stdout/stderr).
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

`openclaw gateway restart --safe` pide al Gateway en ejecución que haga una comprobación previa del trabajo activo y programe un reinicio combinado después de que el trabajo activo se vacíe. El reinicio seguro predeterminado espera el trabajo activo hasta el `gateway.reload.deferralTimeoutMs` configurado (predeterminado: 5 minutos); cuando ese presupuesto vence, el reinicio se fuerza. Define `gateway.reload.deferralTimeoutMs` en `0` para una espera segura indefinida que nunca fuerza. `restart` sin opciones conserva el comportamiento existente del administrador de servicio; `--force` sigue siendo la ruta de sobrescritura inmediata.

`openclaw gateway restart --safe --skip-deferral` ejecuta el mismo reinicio coordinado consciente de OpenClaw que `--safe`, pero omite la compuerta de aplazamiento por trabajo activo, de modo que el Gateway emite el reinicio inmediatamente aunque se informen bloqueadores. Úsalo como vía de escape del operador cuando un aplazamiento haya quedado fijado por una ejecución de tarea atascada y `--safe` por sí solo pueda quedar limitado por `gateway.reload.deferralTimeoutMs`. `--skip-deferral` requiere `--safe`.

<Warning>
`--password` en línea puede quedar expuesto en listados de procesos locales. Prefiere `--password-file`, env o un `gateway.auth.password` respaldado por SecretRef.
</Warning>

### Perfilado del Gateway

- Define `OPENCLAW_GATEWAY_STARTUP_TRACE=1` para registrar tiempos de fase durante el arranque del Gateway, incluido el retraso `eventLoopMax` por fase y los tiempos de tablas de búsqueda de plugins para índice instalado, registro de manifiestos, planificación de arranque y trabajo de mapa de propietarios.
- Define `OPENCLAW_GATEWAY_RESTART_TRACE=1` para registrar líneas `restart trace:` con alcance de reinicio para el manejo de señales de reinicio, vaciado de trabajo activo, fases de apagado, siguiente arranque, tiempo de ready y métricas de memoria.
- Define `OPENCLAW_DIAGNOSTICS=timeline` con `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` para escribir una línea de tiempo de diagnósticos de arranque JSONL de mejor esfuerzo para arneses de QA externos. También puedes habilitar la marca con `diagnostics.flags: ["timeline"]` en la configuración; la ruta sigue proporcionándose por env. Añade `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` para incluir muestras del event loop.
- Ejecuta primero `pnpm build`, luego `pnpm test:startup:gateway -- --runs 5 --warmup 1` para medir el arranque del Gateway contra la entrada de CLI construida. El benchmark registra la primera salida del proceso, `/healthz`, `/readyz`, tiempos de trace de arranque, retraso del event loop y detalles de tiempo de las tablas de búsqueda de plugins.
- Ejecuta primero `pnpm build`, luego `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` para medir el reinicio en proceso del Gateway contra la entrada de CLI construida en macOS o Linux. El benchmark de reinicio usa SIGUSR1, habilita tanto traces de arranque como de reinicio en el proceso hijo, y registra el siguiente `/healthz`, el siguiente `/readyz`, tiempo de inactividad, tiempo de ready, CPU, RSS y métricas de trace de reinicio.
- Trata `/healthz` como liveness y `/readyz` como readiness usable. Las líneas de trace y la salida del benchmark son para atribución de propietario; no trates un span de trace ni una muestra como una conclusión completa de rendimiento.

## Consultar un Gateway en ejecución

Todos los comandos de consulta usan RPC WebSocket.

<Tabs>
  <Tab title="Modos de salida">
    - Predeterminado: legible por humanos (con color en TTY).
    - `--json`: JSON legible por máquina (sin estilo/spinner).
    - `--no-color` (o `NO_COLOR=1`): deshabilita ANSI y conserva el diseño humano.

  </Tab>
  <Tab title="Opciones compartidas">
    - `--url <url>`: URL WebSocket del Gateway.
    - `--token <token>`: token del Gateway.
    - `--password <password>`: contraseña del Gateway.
    - `--timeout <ms>`: timeout/presupuesto (varía por comando).
    - `--expect-final`: esperar una respuesta "final" (llamadas de agente).

  </Tab>
</Tabs>

<Note>
Cuando defines `--url`, la CLI no recurre a credenciales de configuración ni de entorno. Pasa `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

El endpoint HTTP `/healthz` es una sonda de liveness: devuelve una respuesta en cuanto el servidor puede responder HTTP. El endpoint HTTP `/readyz` es más estricto y permanece en rojo mientras los sidecars de plugins de arranque, los canales o los hooks configurados todavía se están estabilizando. Las respuestas detalladas de readiness locales o autenticadas incluyen un bloque de diagnóstico `eventLoop` con retraso del event loop, utilización del event loop, ratio de núcleos de CPU y una marca `degraded`.

<ParamField path="--port <port>" type="number">
  Apunta a un Gateway local loopback en este puerto. Esto sobrescribe `OPENCLAW_GATEWAY_URL` y `OPENCLAW_GATEWAY_PORT` para la llamada de health.
</ParamField>

### `gateway usage-cost`

Obtén resúmenes de coste de uso desde los registros de sesión.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Número de días que incluir.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Limita el resumen de costes a un id de agente configurado.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Agrega el resumen de costes entre todos los agentes configurados. No se puede combinar con `--agent`.
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
  Filtrar por tipo de evento diagnóstico, como `payload.large` o `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Incluir solo eventos posteriores a un número de secuencia diagnóstica.
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
  <Accordion title="Privacidad y comportamiento de paquetes">
    - Los registros conservan metadatos operativos: nombres de eventos, recuentos, tamaños en bytes, lecturas de memoria, estado de colas/sesiones, nombres de canales/plugins y resúmenes de sesiones redactados. No conservan texto de chat, cuerpos de webhook, salidas de herramientas, cuerpos raw de solicitud o respuesta, tokens, cookies, valores secretos, nombres de host ni ids de sesión raw. Define `diagnostics.enabled: false` para deshabilitar por completo el registrador.
    - En salidas fatales del Gateway, timeouts de apagado y fallos de arranque tras reinicio, OpenClaw escribe la misma instantánea diagnóstica en `~/.openclaw/logs/stability/openclaw-stability-*.json` cuando el registrador tiene eventos. Inspecciona el paquete más reciente con `openclaw gateway stability --bundle latest`; `--limit`, `--type` y `--since-seq` también se aplican a la salida de paquete.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Escribe un zip local de diagnósticos diseñado para adjuntarlo a informes de errores. Para el modelo de privacidad y el contenido del paquete, consulta [Exportación de diagnósticos](/es/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ruta del zip de salida. De forma predeterminada, usa una exportación de soporte bajo el directorio de estado.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Máximo de líneas de registro saneadas que se incluirán.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Máximo de bytes de registro que se inspeccionarán.
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
  Tiempo de espera de la instantánea de estado/salud.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Omite la búsqueda del paquete de estabilidad persistido.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprime la ruta escrita, el tamaño y el manifiesto como JSON.
</ParamField>

La exportación contiene un manifiesto, un resumen Markdown, la forma de la configuración, detalles de configuración saneados, resúmenes de registro saneados, instantáneas saneadas de estado/salud del Gateway y el paquete de estabilidad más reciente cuando existe uno.

Está pensada para compartirse. Conserva detalles operativos que ayudan a depurar, como campos seguros de registro de OpenClaw, nombres de subsistemas, códigos de estado, duraciones, modos configurados, puertos, ids de Plugin, ids de proveedor, ajustes de características no secretos y mensajes de registro operativos censurados. Omite o censura texto de chat, cuerpos de Webhook, salidas de herramientas, credenciales, cookies, identificadores de cuenta/mensaje, texto de prompts/instrucciones, nombres de host y valores secretos. Cuando un mensaje de estilo LogTape parece texto de carga útil de usuario/chat/herramienta, la exportación conserva solo que se omitió un mensaje y su recuento de bytes.

### `gateway status`

`gateway status` muestra el servicio Gateway (launchd/systemd/schtasks) más una comprobación opcional de capacidad de conectividad/autenticación.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Añade un destino de comprobación explícito. El remoto configurado + localhost se siguen comprobando.
</ParamField>
<ParamField path="--token <token>" type="string">
  Autenticación por token para la comprobación.
</ParamField>
<ParamField path="--password <password>" type="string">
  Autenticación por contraseña para la comprobación.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Tiempo de espera de la comprobación.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Omite la comprobación de conectividad (vista solo del servicio).
</ParamField>
<ParamField path="--deep" type="boolean">
  Escanea también servicios de nivel de sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Actualiza la comprobación de conectividad predeterminada a una comprobación de lectura y sale con código distinto de cero cuando esa comprobación de lectura falla. No se puede combinar con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semántica de estado">
    - `gateway status` permanece disponible para diagnósticos incluso cuando falta la configuración local de la CLI o no es válida.
    - `gateway status` predeterminado prueba el estado del servicio, la conexión WebSocket y la capacidad de autenticación visible durante el handshake. No prueba operaciones de lectura/escritura/administración.
    - Las comprobaciones de diagnóstico no mutan la autenticación de dispositivos por primera vez: reutilizan un token de dispositivo en caché existente cuando existe, pero no crean una nueva identidad de dispositivo de CLI ni un registro de emparejamiento de dispositivo de solo lectura solo para comprobar el estado.
    - `gateway status` resuelve las SecretRefs de autenticación configuradas para la autenticación de la comprobación cuando es posible.
    - Si una SecretRef de autenticación requerida no se resuelve en esta ruta de comando, `gateway status --json` informa `rpc.authWarning` cuando la conectividad/autenticación de la comprobación falla; pasa `--token`/`--password` explícitamente o resuelve primero el origen del secreto.
    - Si la comprobación tiene éxito, las advertencias de referencias de autenticación no resueltas se suprimen para evitar falsos positivos.
    - Cuando la comprobación está habilitada, la salida JSON incluye `gateway.version` cuando el Gateway en ejecución la informa; `--require-rpc` puede recurrir a la carga útil RPC `status.runtimeVersion` si la comprobación de handshake de seguimiento no puede proporcionar metadatos de versión.
    - Usa `--require-rpc` en scripts y automatización cuando un servicio en escucha no sea suficiente y también necesites que las llamadas RPC con alcance de lectura estén sanas.
    - `--deep` añade un escaneo de mejor esfuerzo para instalaciones adicionales de launchd/systemd/schtasks. Cuando se detectan varios servicios similares a gateway, la salida humana imprime sugerencias de limpieza y advierte que la mayoría de las configuraciones deberían ejecutar un gateway por máquina.
    - `--deep` también informa una transferencia reciente de reinicio del supervisor del Gateway cuando el proceso del servicio salió limpiamente para un reinicio de supervisor externo.
    - `--deep` ejecuta la validación de configuración en modo consciente de Plugin (`pluginValidation: "full"`) y muestra advertencias de manifiesto de Plugin configurado (por ejemplo, metadatos de configuración de canal faltantes) para que las comprobaciones de humo de instalación y actualización las detecten. `gateway status` predeterminado mantiene la ruta rápida de solo lectura que omite la validación de Plugin.
    - La salida humana incluye la ruta resuelta del archivo de registro más la instantánea de rutas/validez de configuración CLI-vs-servicio para ayudar a diagnosticar desviaciones de perfil o directorio de estado.

  </Accordion>
  <Accordion title="Comprobaciones de deriva de autenticación de Linux systemd">
    - En instalaciones de Linux systemd, las comprobaciones de deriva de autenticación del servicio leen valores `Environment=` y `EnvironmentFile=` de la unidad (incluidos `%h`, rutas entrecomilladas, varios archivos y archivos opcionales `-`).
    - Las comprobaciones de deriva resuelven SecretRefs `gateway.auth.token` usando el entorno de runtime combinado (primero el entorno del comando del servicio, luego el entorno del proceso como alternativa).
    - Si la autenticación por token no está efectivamente activa (`gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, o modo sin establecer donde la contraseña puede ganar y ningún candidato de token puede ganar), las comprobaciones de deriva de token omiten la resolución del token de configuración.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` es el comando de "depurar todo". Siempre comprueba:

- tu gateway remoto configurado (si está establecido), y
- localhost (loopback) **incluso si hay un remoto configurado**.

Si pasas `--url`, ese destino explícito se añade delante de ambos. La salida humana etiqueta los destinos como:

- `URL (explícita)`
- `Remoto (configurado)` o `Remoto (configurado, inactivo)`
- `Local loopback`

<Note>
Si varios destinos de comprobación son alcanzables, los imprime todos. Un túnel SSH, una URL TLS/proxy y una URL remota configurada pueden apuntar todos al mismo gateway aunque sus puertos de transporte difieran; `multiple_gateways` se reserva para gateways alcanzables distintos o con identidad ambigua. Se admiten varios gateways cuando usas perfiles aislados (por ejemplo, un bot de rescate), pero la mayoría de las instalaciones siguen ejecutando un solo gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Usa este puerto para el destino de comprobación local loopback y el puerto remoto del túnel SSH. Sin `--url`, esto selecciona el destino local loopback en lugar de la URL de entorno del gateway configurado, el puerto de entorno o los destinos remotos.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretación">
    - `Reachable: yes` significa que al menos un destino aceptó una conexión WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` informa lo que la comprobación pudo probar sobre la autenticación. Es independiente de la alcanzabilidad.
    - `Read probe: ok` significa que las llamadas RPC de detalle con alcance de lectura (`health`/`status`/`system-presence`/`config.get`) también tuvieron éxito.
    - `Read probe: limited - missing scope: operator.read` significa que la conexión tuvo éxito pero la RPC con alcance de lectura está limitada. Esto se informa como alcanzabilidad **degradada**, no como fallo completo.
    - `Read probe: failed` después de `Connect: ok` significa que el Gateway aceptó la conexión WebSocket, pero los diagnósticos de lectura de seguimiento agotaron el tiempo de espera o fallaron. Esto también es alcanzabilidad **degradada**, no un Gateway inalcanzable.
    - Igual que `gateway status`, la comprobación reutiliza la autenticación de dispositivo en caché existente pero no crea una identidad de dispositivo por primera vez ni estado de emparejamiento.
    - El código de salida es distinto de cero solo cuando ningún destino comprobado es alcanzable.

  </Accordion>
  <Accordion title="Salida JSON">
    Nivel superior:

    - `ok`: al menos un destino es alcanzable.
    - `degraded`: al menos un destino aceptó una conexión pero no completó los diagnósticos RPC de detalle completos.
    - `capability`: mejor capacidad observada entre destinos alcanzables (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: mejor destino para tratar como ganador activo en este orden: URL explícita, túnel SSH, remoto configurado y luego local loopback.
    - `warnings[]`: registros de advertencia de mejor esfuerzo con `code`, `message` y `targetIds` opcionales.
    - `network`: sugerencias de URL local loopback/tailnet derivadas de la configuración actual y la red del host.
    - `discovery.timeoutMs` y `discovery.count`: el presupuesto de descubrimiento real y el recuento de resultados usados para esta pasada de comprobación.

    Por destino (`targets[].connect`):

    - `ok`: alcanzabilidad después de la clasificación de conexión + degradación.
    - `rpcOk`: éxito completo de RPC de detalle.
    - `scopeLimited`: RPC de detalle fallida por falta de alcance de operador.

    Por destino (`targets[].auth`):

    - `role`: rol de autenticación informado en `hello-ok` cuando está disponible.
    - `scopes`: alcances concedidos informados en `hello-ok` cuando están disponibles.
    - `capability`: la clasificación de capacidad de autenticación mostrada para ese destino.

  </Accordion>
  <Accordion title="Códigos de advertencia comunes">
    - `ssh_tunnel_failed`: falló la configuración del túnel SSH; el comando recurrió a comprobaciones directas.
    - `multiple_gateways`: identidades de gateway distintas fueron alcanzables, u OpenClaw no pudo probar que los destinos alcanzables sean el mismo gateway. Un túnel SSH, una URL proxy o una URL remota configurada hacia el mismo gateway no activa esta advertencia.
    - `auth_secretref_unresolved`: no se pudo resolver una SecretRef de autenticación configurada para un destino fallido.
    - `probe_scope_limited`: la conexión WebSocket tuvo éxito, pero la comprobación de lectura estuvo limitada por la falta de `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto por SSH (paridad con la app de Mac)

El modo "Remote over SSH" de la app de macOS usa un reenvío de puerto local para que el gateway remoto (que puede estar enlazado solo a loopback) sea alcanzable en `ws://127.0.0.1:<port>`.

Equivalente de CLI:

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

### Instalar con un envoltorio

Usa `--wrapper` cuando el servicio gestionado deba iniciarse mediante otro ejecutable, por ejemplo un
adaptador de gestor de secretos o un helper para ejecutar como otro usuario. El envoltorio recibe los argumentos normales de Gateway y es
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

También puedes definir el envoltorio mediante el entorno. `gateway install` valida que la ruta sea
un archivo ejecutable, escribe el envoltorio en `ProgramArguments` del servicio y conserva
`OPENCLAW_WRAPPER` en el entorno del servicio para reinstalaciones forzadas, actualizaciones y reparaciones de doctor
posteriores.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Para quitar un envoltorio persistido, borra `OPENCLAW_WRAPPER` al reinstalar:

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
    - En macOS, `gateway stop` usa `launchctl bootout` de forma predeterminada, lo que elimina el LaunchAgent de la sesión de arranque actual sin persistir una desactivación; la recuperación automática de KeepAlive permanece activa para fallos futuros y `gateway start` vuelve a habilitarse limpiamente sin un `launchctl enable` manual. Pasa `--disable` para suprimir de forma persistente KeepAlive y RunAtLoad, de modo que el Gateway no se vuelva a iniciar hasta el siguiente `gateway start` explícito; usa esto cuando una detención manual deba sobrevivir a reinicios del equipo o del sistema.
    - `gateway restart --safe` pide al Gateway en ejecución que haga una comprobación previa del trabajo activo y programe un único reinicio agrupado después de que el trabajo activo se vacíe. El reinicio seguro predeterminado espera el trabajo activo hasta el `gateway.reload.deferralTimeoutMs` configurado (predeterminado: 5 minutos); cuando ese presupuesto expira, el reinicio se fuerza. Define `gateway.reload.deferralTimeoutMs` en `0` para una espera segura indefinida que nunca fuerza. `--safe` no puede combinarse con `--force` ni `--wait`.
    - `gateway restart --wait 30s` sobrescribe el presupuesto configurado de vaciado para ese reinicio. Los números sin unidad son milisegundos; se aceptan unidades como `s`, `m` y `h`. `--wait 0` espera indefinidamente.
    - `gateway restart --safe --skip-deferral` ejecuta el reinicio seguro consciente de OpenClaw pero omite la puerta de aplazamiento, de modo que el Gateway emite el reinicio inmediatamente incluso cuando se informan bloqueadores. Es una salida de emergencia para el operador ante aplazamientos por ejecuciones de tareas atascadas; requiere `--safe`.
    - `gateway restart --force` omite el vaciado del trabajo activo y reinicia inmediatamente. Úsalo cuando un operador ya haya inspeccionado los bloqueadores de tareas listados y quiera recuperar el Gateway ahora.
    - Los comandos de ciclo de vida aceptan `--json` para scripting.

  </Accordion>
  <Accordion title="Autenticación y SecretRefs en el momento de instalación">
    - Cuando la autenticación con token requiere un token y `gateway.auth.token` está gestionado por SecretRef, `gateway install` valida que el SecretRef pueda resolverse, pero no conserva el token resuelto en los metadatos del entorno del servicio.
    - Si la autenticación con token requiere un token y el SecretRef de token configurado no está resuelto, la instalación falla de forma cerrada en lugar de conservar texto plano de reserva.
    - Para autenticación con contraseña en `gateway run`, prefiere `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` respaldado por SecretRef antes que `--password` en línea.
    - En modo de autenticación inferida, `OPENCLAW_GATEWAY_PASSWORD` solo en la shell no relaja los requisitos de token de instalación; usa configuración duradera (`gateway.auth.password` o `env` de configuración) al instalar un servicio gestionado.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación se bloquea hasta que el modo se defina explícitamente.

  </Accordion>
</AccordionGroup>

## Descubrir gateways (Bonjour)

`gateway discover` escanea balizas de Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour de área amplia): elige un dominio (ejemplo: `openclaw.internal.`) y configura DNS dividido + un servidor DNS; consulta [Bonjour](/es/gateway/bonjour).

Solo los gateways con descubrimiento Bonjour habilitado (predeterminado) anuncian la baliza.

Los registros de descubrimiento de área amplia pueden incluir estas sugerencias TXT:

- `role` (sugerencia de rol de gateway)
- `transport` (sugerencia de transporte, por ejemplo `gateway`)
- `gatewayPort` (puerto WebSocket, normalmente `18789`)
- `sshPort` (solo modo de descubrimiento completo; los clientes usan `22` como destino SSH predeterminado cuando no está presente)
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
  Salida legible por máquina (también desactiva estilos/spinner).
</ParamField>

Ejemplos:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- La CLI escanea `local.` además del dominio de área amplia configurado cuando hay uno habilitado.
- `wsUrl` en la salida JSON se deriva del endpoint de servicio resuelto, no de sugerencias solo TXT como `lanHost` o `tailnetDns`.
- En mDNS `local.` y DNS-SD de área amplia, `sshPort` y `cliPath` solo se publican cuando `discovery.mdns.mode` es `full`.

</Note>

## Relacionado

- [Referencia de CLI](/es/cli)
- [Runbook de Gateway](/es/gateway)
