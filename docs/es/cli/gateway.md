---
read_when:
    - Ejecutar el Gateway desde la CLI (desarrollo o servidores)
    - Depuración de autenticación de Gateway, modos de enlace y conectividad
    - Descubrimiento de gateways mediante Bonjour (DNS-SD local y de área amplia)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — ejecutar, consultar y descubrir gateways
title: Gateway
x-i18n:
    generated_at: "2026-07-05T11:07:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb1eb4aaba7681699f6048fc9a91b4117e90f20f24c9a696f688f0ac3b39a49e
    source_path: cli/gateway.md
    workflow: 16
---

El Gateway es el servidor WebSocket de OpenClaw (canales, nodos, sesiones, hooks). Todos los subcomandos siguientes están bajo `openclaw gateway ...`.

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

```bash
openclaw gateway
openclaw gateway run   # equivalent, explicit form
```

<AccordionGroup>
  <Accordion title="Comportamiento de inicio">
    - Se niega a iniciarse a menos que `gateway.mode=local` esté definido en `~/.openclaw/openclaw.json`. Usa `--allow-unconfigured` para ejecuciones ad hoc/de desarrollo; omite la protección sin escribir ni reparar la configuración.
    - `openclaw onboard --mode local` y `openclaw setup` escriben `gateway.mode=local`. Si el archivo de configuración existe pero falta `gateway.mode`, se trata como configuración dañada/sobrescrita y el Gateway se niega a adivinar `local` por ti: vuelve a ejecutar el onboarding, define la clave manualmente o pasa `--allow-unconfigured`.
    - Se bloquea el enlace más allá de loopback sin autenticación.
    - Los valores de `--bind` `lan`, `tailnet` y `custom` se resuelven hoy mediante rutas solo IPv4; las configuraciones solo IPv6 con host propio necesitan un sidecar IPv4 o un proxy delante del Gateway.
    - `SIGUSR1` activa un reinicio dentro del proceso cuando está autorizado. `commands.restart` (predeterminado: habilitado) controla `SIGUSR1` enviado externamente; defínelo en `false` para bloquear reinicios manuales por señal del SO sin dejar de permitir el reinicio mediante el comando `gateway restart`, la herramienta gateway y config-apply/update.
    - `SIGINT`/`SIGTERM` detienen el proceso, pero no restauran el estado personalizado del terminal; si envuelves la CLI en una TUI o entrada en modo raw, restaura el terminal tú mismo antes de salir.

  </Accordion>
</AccordionGroup>

### Opciones

<ParamField path="--port <port>" type="number">
  Puerto WebSocket (valor predeterminado de config/env; normalmente `18789`).
</ParamField>
<ParamField path="--bind <mode>" type="string">
  Modo de enlace: `loopback` (predeterminado), `lan`, `tailnet`, `auto`, `custom`.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token compartido para `connect.params.auth.token`. Usa `OPENCLAW_GATEWAY_TOKEN` de forma predeterminada cuando está definido.
</ParamField>
<ParamField path="--auth <mode>" type="string">
  Modo de autenticación: `none`, `token`, `password`, `trusted-proxy`.
</ParamField>
<ParamField path="--password <password>" type="string">
  Contraseña para `--auth password`.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Lee la contraseña del Gateway desde un archivo.
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Exposición de Tailscale: `off`, `serve`, `funnel`.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Restablece la configuración serve/funnel de Tailscale al cerrar.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Inicia sin exigir `gateway.mode=local`. Solo arranque ad hoc/de desarrollo; no persiste ni repara la configuración.
</ParamField>
<ParamField path="--dev" type="boolean">
  Crea una configuración de desarrollo + espacio de trabajo si faltan (omite `BOOTSTRAP.md`).
</ParamField>
<ParamField path="--reset" type="boolean">
  Restablece la configuración de desarrollo, credenciales, sesiones y espacio de trabajo. Requiere `--dev`.
</ParamField>
<ParamField path="--force" type="boolean">
  Mata cualquier listener existente en el puerto de destino antes de iniciar.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Registro detallado en stdout/stderr.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Muestra solo los logs del backend de la CLI en la consola (también habilita stdout/stderr).
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  Estilo de log WebSocket: `auto`, `full`, `compact`.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias de `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Registra eventos raw del stream del modelo en JSONL.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ruta JSONL del stream raw.
</ParamField>

`--claude-cli-logs` es un alias obsoleto de `--cli-backend-logs`.

Para `--bind custom`, define `gateway.customBindHost` con una dirección IPv4; el Gateway recurre a `0.0.0.0` si esa dirección no está disponible. Las configuraciones solo IPv6 con host propio necesitan un sidecar IPv4 o un proxy delante del Gateway.

## Reiniciar el Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` pide al Gateway en ejecución que haga un preflight del trabajo activo y programe un reinicio combinado después de que ese trabajo se vacíe. La espera está limitada por `gateway.reload.deferralTimeoutMs` (predeterminado: 5 minutos / `300000`); cuando se agota el presupuesto, se fuerza el reinicio. Define `deferralTimeoutMs: 0` para esperar indefinidamente (con advertencias periódicas de pendientes) en lugar de forzar. `--safe` no se puede combinar con `--force` ni `--wait`.

`--skip-deferral` omite la compuerta de aplazamiento por trabajo activo en un reinicio seguro, por lo que el Gateway se reinicia de inmediato incluso con bloqueadores reportados. Requiere `--safe`; úsalo cuando un aplazamiento esté atascado en una tarea descontrolada.

`--wait <duration>` anula el presupuesto de vaciado para un reinicio simple (no seguro). Acepta milisegundos sin unidad o sufijos de unidad `ms`, `s`, `m`, `h`, `d` (por ejemplo, `30s`, `5m`, `1h30m`); `--wait 0` espera indefinidamente. No es compatible con `--force` ni `--safe`.

`--force` omite el vaciado de trabajo activo y reinicia inmediatamente. `restart` simple (sin flags) conserva el comportamiento de reinicio existente del gestor de servicios.

<Warning>
`--password` en línea puede quedar expuesto en los listados de procesos locales. Prefiere `--password-file`, env o un `gateway.auth.password` respaldado por SecretRef.
</Warning>

### Perfilado del Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` registra tiempos de fases durante el inicio, incluido el retraso `eventLoopMax` por fase y tiempos de tablas de búsqueda de plugins (índice instalado, registro de manifiestos, planificación de inicio, trabajo de owner-map).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` registra líneas `restart trace:` con alcance de reinicio: manejo de señales, vaciado de trabajo activo, fases de cierre, siguiente inicio, tiempo hasta estar listo y métricas de memoria.
- `OPENCLAW_DIAGNOSTICS=timeline` con `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` escribe una línea de tiempo de diagnósticos de inicio JSONL de mejor esfuerzo para arneses externos de QA (equivalente a la configuración `diagnostics.flags: ["timeline"]`; la ruta sigue siendo solo env). Añade `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` para incluir muestras del event loop.
- `pnpm build` y luego `pnpm test:startup:gateway -- --runs 5 --warmup 1` hacen benchmark del inicio del Gateway contra la entrada CLI compilada: salida del primer proceso, `/healthz`, `/readyz`, tiempos de trazas de inicio, retraso del event loop y tiempos de tablas de búsqueda de plugins.
- `pnpm build` y luego `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` hacen benchmark del reinicio dentro del proceso en macOS o Linux (no compatible con Windows; el reinicio requiere `SIGUSR1`). Usa `SIGUSR1`, habilita ambas trazas en el proceso hijo y registra el siguiente `/healthz`, el siguiente `/readyz`, tiempo de inactividad, tiempo hasta estar listo, CPU, RSS y métricas de trazas de reinicio.
- `/healthz` es liveness; `/readyz` es preparación utilizable. Trata las líneas de traza y la salida del benchmark como señal de atribución de propietario, no como una conclusión completa de rendimiento a partir de un tramo o muestra.

## Consultar un Gateway en ejecución

Todos los comandos de consulta usan RPC WebSocket.

<Tabs>
  <Tab title="Modos de salida">
    - Predeterminado: legible para humanos (con color en TTY).
    - `--json`: JSON legible por máquinas (sin estilos/spinner).
    - `--no-color` (o `NO_COLOR=1`): deshabilita ANSI mientras mantiene el diseño humano.

  </Tab>
  <Tab title="Opciones compartidas">
    - `--url <url>`: URL WebSocket del Gateway.
    - `--token <token>`: token del Gateway.
    - `--password <password>`: contraseña del Gateway.
    - `--timeout <ms>`: timeout/presupuesto (el valor predeterminado varía por comando; consulta cada comando abajo).
    - `--expect-final`: espera una respuesta "final" (llamadas de agente).

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

`/healthz` es una sonda de liveness: devuelve respuesta en cuanto el servidor puede responder HTTP. `/readyz` es más estricta y permanece en rojo mientras los sidecars de plugins de inicio, canales o hooks configurados todavía se están estabilizando. Las respuestas detalladas locales o autenticadas de `/readyz` incluyen un bloque de diagnóstico `eventLoop` (retraso, utilización, relación de núcleos de CPU, flag `degraded`).

<ParamField path="--port <port>" type="number">
  Apunta a un Gateway local loopback en este puerto. Anula `OPENCLAW_GATEWAY_URL` y `OPENCLAW_GATEWAY_PORT` para esta llamada.
</ParamField>

### `gateway usage-cost`

Obtén resúmenes de coste de uso desde logs de sesión.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Número de días que se incluirán.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Limita el resumen a un id de agente configurado.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Agrega entre todos los agentes configurados. No se puede combinar con `--agent`.
</ParamField>

### `gateway stability`

Obtén el grabador reciente de estabilidad de diagnóstico desde un Gateway en ejecución.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Máximo de eventos recientes que se incluirán (máximo `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filtra por tipo de evento de diagnóstico, por ejemplo `payload.large` o `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Incluye solo eventos posteriores a un número de secuencia de diagnóstico.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lee un paquete de estabilidad persistido en lugar de llamar al Gateway en ejecución. `--bundle latest` (o `--bundle` sin valor) elige el paquete más reciente bajo el directorio de estado; también puedes pasar directamente una ruta JSON de paquete.
</ParamField>
<ParamField path="--export" type="boolean">
  Escribe un zip de diagnósticos de soporte compartible en lugar de imprimir detalles de estabilidad.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ruta de salida para `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacidad y comportamiento de paquetes">
    - Los registros conservan metadatos operativos: nombres de eventos, recuentos, tamaños en bytes, lecturas de memoria, estado de cola/sesión, ids de aprobación, nombres de canal/plugin y resúmenes de sesión redactados. Excluyen texto de chat, cuerpos de Webhook, salidas de herramientas, cuerpos raw de solicitud/respuesta, tokens, cookies, valores secretos, nombres de host e ids raw de sesión. Define `diagnostics.enabled: false` para deshabilitar el grabador por completo.
    - Las salidas fatales del Gateway, timeouts de cierre y fallos de inicio tras reinicio escriben la misma instantánea de diagnóstico en `~/.openclaw/logs/stability/openclaw-stability-*.json` cuando el grabador tiene eventos. Inspecciona el paquete más reciente con `openclaw gateway stability --bundle latest`; `--limit`, `--type` y `--since-seq` también se aplican a la salida de paquete.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Escribe un zip local de diagnósticos diseñado para informes de bugs. Para el modelo de privacidad y el contenido del paquete, consulta [Exportación de diagnósticos](/es/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ruta del zip de salida. De forma predeterminada, usa una exportación de soporte bajo el directorio de estado.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Cantidad máxima de líneas de registro saneadas que se incluirán.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Cantidad máxima de bytes de registro que se inspeccionarán.
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

La exportación agrupa: `manifest.json` (inventario de archivos), `summary.md` (resumen Markdown), `diagnostics.json` (resumen de configuración/registros/detección/estabilidad/estado/salud de nivel superior), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` y `stability/latest.json` cuando existe un paquete.

Está diseñada para compartirse. Conserva detalles operativos útiles para depurar —campos de registro seguros, nombres de subsistemas, códigos de estado, duraciones, modos configurados, puertos, ids de plugins/proveedores, ajustes de funciones que no son secretos y mensajes de registro operativos redactados— y omite o redacta texto de chat, cuerpos de webhook, salidas de herramientas, credenciales, cookies, identificadores de cuenta/mensaje, texto de prompts/instrucciones, nombres de host y valores secretos. Cuando un mensaje de registro parece texto de carga útil de usuario/chat/herramienta (por ejemplo, "user said", "chat text", "tool output", "webhook body"), la exportación conserva solo el hecho de que se omitió un mensaje y su recuento de bytes.

### `gateway status`

Muestra el servicio Gateway (launchd/systemd/schtasks) junto con una prueba opcional de conectividad/autenticación.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Agrega un destino de prueba explícito. La conexión remota configurada + localhost se siguen probando.
</ParamField>
<ParamField path="--token <token>" type="string">
  Autenticación con token para la prueba.
</ParamField>
<ParamField path="--password <password>" type="string">
  Autenticación con contraseña para la prueba.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Tiempo de espera de la prueba.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Omite la prueba de conectividad (vista solo del servicio).
</ParamField>
<ParamField path="--deep" type="boolean">
  También analiza los servicios de nivel de sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Eleva la prueba de conectividad a una prueba de lectura y sale con código distinto de cero si falla. No se puede combinar con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - Sigue disponible para diagnósticos incluso cuando falta la configuración local de la CLI o no es válida.
    - La salida predeterminada prueba el estado del servicio, la conexión WebSocket y la capacidad de autenticación visible durante el handshake, no las operaciones de lectura/escritura/administración.
    - Las pruebas no realizan mutaciones para la autenticación inicial de dispositivos: reutilizan un token de dispositivo en caché existente cuando hay uno, pero nunca crean una nueva identidad de dispositivo de la CLI ni un registro de emparejamiento de solo lectura solo para comprobar el estado.
    - Resuelve los SecretRefs de autenticación configurados para la autenticación de la prueba cuando es posible. Si un SecretRef requerido no se resuelve, `--json` informa `rpc.authWarning` cuando falla la conectividad/autenticación de la prueba; pasa `--token`/`--password` explícitamente o corrige la fuente del secreto. Las advertencias de autenticación no resuelta se suprimen cuando la prueba tiene éxito.
    - La salida JSON incluye `gateway.version` cuando el Gateway en ejecución la informa; `--require-rpc` puede recurrir a la carga útil RPC `status.runtimeVersion` si la prueba de handshake no puede proporcionar metadatos de versión.
    - Usa `--require-rpc` en scripts/automatización cuando un servicio en escucha no sea suficiente y también necesites que el RPC con alcance de lectura esté sano.
    - `--deep` busca instalaciones launchd/systemd/schtasks adicionales; cuando se encuentran varios servicios similares a gateway, la salida humana imprime sugerencias de limpieza (normalmente ejecutar un gateway por máquina) e informa una transferencia reciente de reinicio del supervisor cuando corresponde.
    - `--deep` también ejecuta validación de configuración en modo consciente de plugins (`pluginValidation: "full"`) y muestra advertencias del manifiesto del plugin (por ejemplo, metadatos de configuración de canal faltantes). El `gateway status` predeterminado mantiene la ruta rápida de solo lectura que omite la validación de plugins.
    - La salida humana incluye la ruta resuelta del archivo de registro, además de rutas/validez de configuración CLI frente a servicio para ayudar a diagnosticar desviaciones de perfil o directorio de estado.

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - Las comprobaciones de desviación de autenticación del servicio leen tanto `Environment=` como `EnvironmentFile=` desde la unidad (incluidos `%h`, rutas entre comillas, múltiples archivos y archivos `-` opcionales).
    - Resuelve SecretRefs de `gateway.auth.token` usando el entorno de ejecución combinado (primero el entorno del comando del servicio y luego el entorno del proceso como fallback).
    - Las comprobaciones de desviación de token omiten la resolución del token de configuración cuando la autenticación con token no está efectivamente activa (`gateway.auth.mode` explícitamente `password`/`none`/`trusted-proxy`, o modo sin definir donde la contraseña puede ganar y ningún candidato de token puede ganar).

  </Accordion>
</AccordionGroup>

### `gateway probe`

El comando para "depurarlo todo". Siempre prueba:

- tu gateway remoto configurado (si está definido), y
- localhost (loopback), **incluso si hay un remoto configurado**.

Pasar `--url` agrega ese destino explícito antes de ambos. La salida humana etiqueta los destinos como `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)` y `Local loopback`.

<Note>
Si se puede alcanzar más de un destino de prueba, se imprimen todos. Un túnel SSH, una URL TLS/proxy y una URL remota configurada pueden apuntar al mismo gateway incluso con puertos de transporte distintos; `multiple_gateways` se reserva para gateways alcanzables distintos o con identidad ambigua. Ejecutar varios gateways está permitido para perfiles aislados (por ejemplo, un bot de rescate), pero la mayoría de las instalaciones ejecutan un solo gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Usa este puerto para el destino de prueba local loopback y el puerto remoto del túnel SSH. Sin `--url`, esto selecciona solo el destino local loopback en lugar de la URL de entorno del gateway configurado, el puerto de entorno o los destinos remotos.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` significa que al menos un destino aceptó una conexión WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` informa lo que la prueba pudo demostrar sobre la autenticación, separado de la alcanzabilidad.
    - `Read probe: ok` significa que las llamadas RPC de detalle con alcance de lectura (`health`/`status`/`system-presence`/`config.get`) también tuvieron éxito.
    - `Read probe: limited - missing scope: operator.read` significa que la conexión tuvo éxito, pero el RPC con alcance de lectura está limitado. Se informa como alcanzabilidad **degradada**, no como fallo total.
    - `Read probe: failed` después de `Connect: ok` significa que el WebSocket se conectó, pero los diagnósticos de lectura posteriores agotaron el tiempo de espera o fallaron; también es **degradado**, no inalcanzable.
    - Como `gateway status`, la prueba reutiliza la autenticación de dispositivo en caché existente, pero no crea identidad de dispositivo inicial ni estado de emparejamiento.
    - El código de salida solo es distinto de cero cuando ningún destino probado es alcanzable.

  </Accordion>
  <Accordion title="JSON output">
    Nivel superior:

    - `ok`: al menos un destino es alcanzable.
    - `degraded`: al menos un destino aceptó una conexión, pero no completó todos los diagnósticos RPC de detalle.
    - `capability`: mejor capacidad observada entre los destinos alcanzables (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: mejor destino para tratar como ganador activo, en orden: URL explícita, túnel SSH, remoto configurado, local loopback.
    - `warnings[]`: registros de advertencia de mejor esfuerzo con `code`, `message` y `targetIds` opcional.
    - `network`: sugerencias de URL local loopback/tailnet derivadas de la configuración actual y la red del host.
    - `discovery.timeoutMs` / `discovery.count`: el presupuesto de detección real/recuento de resultados usado para esta pasada de prueba.

    Por destino (`targets[].connect`): `ok` (alcanzabilidad + clasificación degradada), `rpcOk` (éxito completo de RPC de detalle), `scopeLimited` (RPC de detalle fallido por falta de alcance de operador).

    Por destino (`targets[].auth`): `role` y `scopes` informados en `hello-ok` cuando están disponibles, además de la clasificación `capability` mostrada.

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: falló la configuración del túnel SSH; el comando recurrió a pruebas directas.
    - `multiple_gateways`: se alcanzaron identidades de gateway distintas, o OpenClaw no pudo demostrar que los destinos alcanzables son el mismo gateway. Un túnel SSH, una URL de proxy o una URL remota configurada hacia el mismo gateway no activa esto.
    - `auth_secretref_unresolved`: no se pudo resolver un SecretRef de autenticación configurado para un destino fallido.
    - `probe_scope_limited`: la conexión WebSocket tuvo éxito, pero la prueba de lectura estuvo limitada por la falta de `operator.read`.
    - `local_tls_runtime_unavailable`: TLS del Gateway local está habilitado, pero OpenClaw no pudo cargar la huella digital del certificado local.

  </Accordion>
</AccordionGroup>

#### Remoto por SSH (paridad con la app de Mac)

El modo "Remoto por SSH" de la app de macOS usa un reenvío de puerto local para que un gateway remoto solo de loopback sea alcanzable en `ws://127.0.0.1:<port>`.

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
  Elige el primer host de gateway detectado como destino SSH desde el endpoint de detección resuelto (`local.` más el dominio de área amplia configurado, si existe). Las sugerencias solo TXT se ignoran.
</ParamField>

Valores predeterminados de configuración (opcionales): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`.

### `gateway call <method>`

Ayudante RPC de bajo nivel.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
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
<ParamField path="--timeout <ms>" type="number" default="10000">
  Presupuesto de tiempo de espera.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Principalmente para RPCs de estilo agente que transmiten eventos intermedios antes de una carga útil final.
</ParamField>
<ParamField path="--json" type="boolean">
  Salida JSON legible por máquina.
</ParamField>

<Note>
`--params` debe ser JSON válido, y cada método valida su propia forma de params (los campos adicionales o con nombre incorrecto se rechazan).
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

Usa `--wrapper` cuando el servicio gestionado deba iniciarse a través de otro ejecutable, por ejemplo un shim de gestor de secretos o un ayudante de ejecución como otro usuario. El wrapper recibe los argumentos normales del Gateway y es responsable de terminar ejecutando con exec `openclaw` o Node con esos argumentos.

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

También puedes configurar el contenedor mediante el entorno. `gateway install` valida que la ruta sea un archivo ejecutable, escribe el contenedor en los `ProgramArguments` del servicio y conserva `OPENCLAW_WRAPPER` en el entorno del servicio para reinstalaciones forzadas, actualizaciones y reparaciones de doctor posteriores.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Para eliminar un contenedor persistido, borra `OPENCLAW_WRAPPER` durante la reinstalación:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Opciones de comando">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>` (predeterminado: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Comportamiento del ciclo de vida">
    - Usa `gateway restart` para reiniciar un servicio administrado. No encadenes `gateway stop` y `gateway start` como sustituto de reinicio.
    - En macOS, `gateway stop` usa `launchctl bootout` de forma predeterminada, lo que elimina el LaunchAgent de la sesión de arranque actual sin persistir una deshabilitación; la recuperación automática de KeepAlive permanece activa para futuros fallos y `gateway start` vuelve a habilitarlo limpiamente sin un `launchctl enable` manual. Pasa `--disable` para suprimir KeepAlive y RunAtLoad de forma persistente, de modo que el gateway no reaparezca hasta el siguiente `gateway start` explícito; usa esto cuando una detención manual deba sobrevivir a reinicios.
    - Los comandos de ciclo de vida aceptan `--json` para scripts.

  </Accordion>
  <Accordion title="Auth y SecretRefs en el momento de la instalación">
    - Cuando la autenticación por token requiere un token y `gateway.auth.token` está administrado por SecretRef, `gateway install` valida que SecretRef pueda resolverse, pero no persiste el token resuelto en los metadatos del entorno del servicio.
    - Si la autenticación por token requiere un token y el SecretRef de token configurado no se resuelve, la instalación falla cerrada en lugar de persistir texto sin formato alternativo.
    - Para la autenticación por contraseña en `gateway run`, prefiere `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` respaldado por SecretRef en lugar de `--password` en línea.
    - En modo de autenticación inferido, `OPENCLAW_GATEWAY_PASSWORD` definido solo en la shell no relaja los requisitos de token de instalación; usa una configuración duradera (`gateway.auth.password` o config `env`) al instalar un servicio administrado.
    - Si `gateway.auth.token` y `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación se bloquea hasta que el modo se configure explícitamente.

  </Accordion>
</AccordionGroup>

## Descubrir gateways (Bonjour)

`gateway discover` busca balizas de Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour de área amplia): elige un dominio (ejemplo: `openclaw.internal.`) y configura DNS dividido + un servidor DNS; consulta [Bonjour](/es/gateway/bonjour).

Solo los gateways con descubrimiento Bonjour habilitado (predeterminado) anuncian la baliza.

Pistas TXT en cada baliza: `role` (pista de rol del gateway), `transport` (pista de transporte, por ejemplo, `gateway`), `gatewayPort` (puerto WebSocket, normalmente `18789`), `tailnetDns` (nombre de host MagicDNS, cuando está disponible), `gatewayTls` / `gatewayTlsSha256` (TLS habilitado + huella digital del certificado). `sshPort` y `cliPath` se publican solo en modo de descubrimiento completo (`discovery.mdns.mode: "full"`; el predeterminado es `"minimal"`, que los omite; los clientes entonces usan por defecto el puerto `22` para destinos SSH).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Tiempo de espera por comando (explorar/resolver).
</ParamField>
<ParamField path="--json" type="boolean">
  Salida legible por máquina (también deshabilita el estilo y el indicador de actividad).
</ParamField>

Ejemplos:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- Busca en `local.` más el dominio de área amplia configurado cuando hay uno habilitado.
- `wsUrl` en la salida JSON se deriva del endpoint de servicio resuelto, no de pistas solo TXT como `lanHost` o `tailnetDns`.
- `discovery.mdns.mode` controla la publicación de `sshPort`/`cliPath` tanto en mDNS `local.` como en DNS-SD de área amplia (consulta lo anterior).

</Note>

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Runbook de Gateway](/es/gateway)
