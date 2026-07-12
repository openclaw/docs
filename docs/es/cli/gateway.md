---
read_when:
    - Ejecutar el Gateway desde la CLI (desarrollo o servidores)
    - Depuración de la autenticación del Gateway, los modos de vinculación y la conectividad
    - Descubrimiento de gateways mediante Bonjour (DNS-SD local y de área amplia)
sidebarTitle: Gateway
summary: CLI del Gateway de OpenClaw (`openclaw gateway`) — ejecutar, consultar y descubrir gateways
title: Gateway
x-i18n:
    generated_at: "2026-07-12T14:23:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 75f8f4bebe585b213f486f08bf20015aeb89ca4d179f6d96c1008ec9d1cd00ea
    source_path: cli/gateway.md
    workflow: 16
---

El Gateway es el servidor WebSocket de OpenClaw (canales, nodos, sesiones y hooks). Todos los subcomandos siguientes se encuentran bajo `openclaw gateway ...`.

<CardGroup cols={3}>
  <Card title="Descubrimiento Bonjour" href="/es/gateway/bonjour">
    Configuración de mDNS local + DNS-SD de área amplia.
  </Card>
  <Card title="Descripción general del descubrimiento" href="/es/gateway/discovery">
    Cómo OpenClaw anuncia y encuentra gateways.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration">
    Claves de configuración de nivel superior del gateway.
  </Card>
</CardGroup>

## Ejecutar el Gateway

```bash
openclaw gateway
openclaw gateway run   # equivalente, forma explícita
```

<AccordionGroup>
  <Accordion title="Comportamiento de inicio">
    - Se niega a iniciarse a menos que `gateway.mode=local` esté establecido en `~/.openclaw/openclaw.json`. Use `--allow-unconfigured` para ejecuciones ad hoc o de desarrollo; omite la protección sin escribir ni reparar la configuración.
    - `openclaw onboard --mode local` y `openclaw setup` escriben `gateway.mode=local`. Si el archivo de configuración existe, pero falta `gateway.mode`, se considera que la configuración está dañada o sobrescrita y el Gateway se niega a suponer `local`: vuelva a ejecutar la incorporación, establezca la clave manualmente o pase `--allow-unconfigured`.
    - Se bloquea la vinculación más allá de loopback sin autenticación.
    - Actualmente, los valores `lan`, `tailnet` y `custom` de `--bind` se resuelven mediante rutas que solo admiten IPv4; las configuraciones con host propio que solo admiten IPv6 necesitan un sidecar IPv4 o un proxy delante del Gateway.
    - `SIGUSR1` activa un reinicio dentro del proceso cuando está autorizado. `commands.restart` (valor predeterminado: habilitado) controla los `SIGUSR1` enviados externamente; establézcalo en `false` para bloquear los reinicios manuales mediante señales del SO, pero seguir permitiendo el reinicio mediante el comando `gateway restart`, la herramienta del gateway y la aplicación o actualización de la configuración.
    - `SIGINT`/`SIGTERM` detienen el proceso, pero no restauran el estado personalizado de la terminal; si se encapsula la CLI en una TUI o en una entrada en modo sin procesar, restaure la terminal antes de salir.

  </Accordion>
</AccordionGroup>

### Opciones

<ParamField path="--port <port>" type="number">
  Puerto WebSocket (valor predeterminado de la configuración o el entorno; normalmente `18789`).
</ParamField>
<ParamField path="--bind <mode>" type="string">
  Modo de vinculación: `loopback` (predeterminado), `lan`, `tailnet`, `auto`, `custom`.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token compartido para `connect.params.auth.token`. El valor predeterminado es `OPENCLAW_GATEWAY_TOKEN` cuando está establecido.
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
  Inicia sin exigir `gateway.mode=local`. Solo para arranque ad hoc o de desarrollo; no conserva ni repara la configuración.
</ParamField>
<ParamField path="--dev" type="boolean">
  Crea una configuración y un espacio de trabajo de desarrollo si faltan (omite `BOOTSTRAP.md`).
</ParamField>
<ParamField path="--reset" type="boolean">
  Restablece la configuración de desarrollo, las credenciales, las sesiones y el espacio de trabajo. Requiere `--dev`.
</ParamField>
<ParamField path="--force" type="boolean">
  Finaliza cualquier proceso que esté escuchando en el puerto de destino antes de iniciar.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Registro detallado en stdout/stderr.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Muestra únicamente los registros del backend de la CLI en la consola (también habilita stdout/stderr).
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  Estilo de registro de WebSocket: `auto`, `full`, `compact`.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias de `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Registra en JSONL los eventos sin procesar del flujo del modelo.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ruta del archivo JSONL del flujo sin procesar.
</ParamField>

`--claude-cli-logs` es un alias obsoleto de `--cli-backend-logs`.

Para `--bind custom`, establezca `gateway.customBindHost` en una dirección IPv4. Cualquier dirección distinta de `127.0.0.1` o `0.0.0.0` también requiere `127.0.0.1` en el mismo puerto para los clientes del mismo host; el inicio falla si alguno de los procesos de escucha no puede vincularse. El comodín `0.0.0.0` no añade un alias obligatorio independiente. Las configuraciones con host propio que solo admiten IPv6 necesitan un sidecar IPv4 o un proxy delante del Gateway.

## Reiniciar el Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` solicita al Gateway en ejecución que realice una comprobación previa del trabajo activo y programe un único reinicio agrupado cuando finalice ese trabajo. La espera está limitada por `gateway.reload.deferralTimeoutMs` (valor predeterminado: 5 minutos / `300000`); cuando se agota el tiempo disponible, se fuerza el reinicio. Establezca `deferralTimeoutMs: 0` para esperar indefinidamente (con advertencias periódicas de que aún está pendiente) en lugar de forzarlo. `--safe` no puede combinarse con `--force` ni `--wait`.

`--skip-deferral` omite la protección de aplazamiento por trabajo activo en un reinicio seguro, por lo que el Gateway se reinicia inmediatamente incluso si se notifican bloqueos. Requiere `--safe`; úselo cuando un aplazamiento quede atascado por una tarea descontrolada.

`--wait <duration>` reemplaza el tiempo disponible para el drenaje en un reinicio normal (no seguro). Acepta milisegundos sin unidad o los sufijos de unidad `ms`, `s`, `m`, `h`, `d` (por ejemplo, `30s`, `5m`, `1h30m`); `--wait 0` espera indefinidamente. No es compatible con `--force` ni `--safe`.

`--force` omite el drenaje del trabajo activo y reinicia inmediatamente. Un `restart` normal (sin indicadores) conserva el comportamiento de reinicio existente del gestor de servicios.

<Warning>
Una contraseña especificada directamente mediante `--password` puede quedar expuesta en los listados locales de procesos. Se recomienda usar `--password-file`, una variable de entorno o un `gateway.auth.password` respaldado por SecretRef.
</Warning>

### Generación de perfiles del Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` registra los tiempos de las fases durante el inicio, incluido el retraso `eventLoopMax` por fase y los tiempos de las tablas de consulta de plugins (índice de instalados, registro de manifiestos, planificación del inicio y trabajo del mapa de propietarios).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` registra líneas `restart trace:` correspondientes al reinicio: gestión de señales, drenaje del trabajo activo, fases de cierre, siguiente inicio, tiempo hasta estar listo y métricas de memoria.
- `OPENCLAW_DIAGNOSTICS=timeline` con `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` escribe una cronología de diagnóstico del inicio en JSONL, según el mejor esfuerzo, para sistemas externos de QA (equivale a la configuración `diagnostics.flags: ["timeline"]`; la ruta sigue estando disponible solo mediante el entorno). Añada `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` para incluir muestras del bucle de eventos.
- `pnpm build` y, a continuación, `pnpm test:startup:gateway -- --runs 5 --warmup 1` evalúan el rendimiento del inicio del Gateway con respecto al punto de entrada de la CLI compilada: primera salida del proceso, `/healthz`, `/readyz`, tiempos de seguimiento del inicio, retraso del bucle de eventos y tiempo de las tablas de consulta de plugins.
- `pnpm build` y, a continuación, `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` evalúan el rendimiento del reinicio dentro del proceso en macOS o Linux (no se admite en Windows; el reinicio requiere `SIGUSR1`). Usa `SIGUSR1`, habilita ambos seguimientos en el proceso secundario y registra los siguientes `/healthz` y `/readyz`, el tiempo de inactividad, el tiempo hasta estar listo, la CPU, el RSS y las métricas de seguimiento del reinicio.
- `/healthz` indica actividad; `/readyz` indica disponibilidad operativa. Considere las líneas de seguimiento y la salida de las pruebas de rendimiento como señales para atribuir la responsabilidad, no como una conclusión completa sobre el rendimiento basada en un solo intervalo o una sola muestra.

## Consultar un Gateway en ejecución

Todos los comandos de consulta usan RPC mediante WebSocket.

<Tabs>
  <Tab title="Modos de salida">
    - Valor predeterminado: legible para personas (con colores en una TTY).
    - `--json`: JSON legible por máquinas (sin estilos ni indicador de progreso).
    - `--no-color` (o `NO_COLOR=1`): deshabilita ANSI y conserva el formato legible para personas.

  </Tab>
  <Tab title="Opciones compartidas">
    - `--url <url>`: URL WebSocket del Gateway.
    - `--token <token>`: token del Gateway.
    - `--password <password>`: contraseña del Gateway.
    - `--timeout <ms>`: tiempo de espera o presupuesto (el valor predeterminado varía según el comando; consulte cada comando a continuación).
    - `--expect-final`: espera una respuesta "final" (llamadas del agente).

  </Tab>
</Tabs>

<Note>
Cuando se establece `--url`, la CLI no recurre a las credenciales de la configuración ni del entorno. Pase `--token` o `--password` explícitamente. La ausencia de credenciales explícitas es un error.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` es una sonda de actividad: responde en cuanto el servidor puede contestar mediante HTTP. `/readyz` es más estricta y permanece en rojo mientras los sidecars de plugins del inicio, los canales o los hooks configurados aún se están estabilizando. Las respuestas detalladas locales o autenticadas de `/readyz` incluyen un bloque de diagnóstico `eventLoop` (retraso, utilización, proporción de núcleos de CPU e indicador `degraded`).

<ParamField path="--port <port>" type="number">
  Apunta a un Gateway de loopback local en este puerto. Reemplaza `OPENCLAW_GATEWAY_URL` y `OPENCLAW_GATEWAY_PORT` para esta llamada.
</ParamField>

### `gateway usage-cost`

Obtiene resúmenes de costos de uso de los registros de sesión.

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
  Agrega los datos de todos los agentes configurados. No puede combinarse con `--agent`.
</ParamField>

### `gateway stability`

Obtiene el registro reciente de estabilidad de diagnóstico de un Gateway en ejecución.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Número máximo de eventos recientes que se incluirán (máximo: `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filtra por tipo de evento de diagnóstico, por ejemplo, `payload.large` o `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Incluye únicamente los eventos posteriores a un número de secuencia de diagnóstico.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lee un paquete de estabilidad conservado en lugar de llamar al Gateway en ejecución. `--bundle latest` (o `--bundle` sin valor) selecciona el paquete más reciente del directorio de estado; también se puede pasar directamente la ruta de un archivo JSON de paquete.
</ParamField>
<ParamField path="--export" type="boolean">
  Escribe un archivo ZIP de diagnósticos de soporte que se puede compartir, en lugar de imprimir los detalles de estabilidad.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ruta de salida para `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacidad y comportamiento de los paquetes">
    - Los registros conservan metadatos operativos: nombres de eventos, recuentos, tamaños en bytes, lecturas de memoria, estado de colas y sesiones, ids de aprobación, nombres de canales y plugins, y resúmenes de sesión censurados. Excluyen el texto del chat, los cuerpos de webhooks, las salidas de herramientas, los cuerpos sin procesar de solicitudes y respuestas, tokens, cookies, valores secretos, nombres de host e ids de sesión sin procesar. Establezca `diagnostics.enabled: false` para deshabilitar por completo el registro.
    - Las salidas fatales del Gateway, los tiempos de espera agotados durante el cierre y los fallos de inicio tras un reinicio escriben la misma instantánea de diagnóstico en `~/.openclaw/logs/stability/openclaw-stability-*.json` cuando el registro contiene eventos. Inspeccione el paquete más reciente con `openclaw gateway stability --bundle latest`; `--limit`, `--type` y `--since-seq` también se aplican a la salida del paquete.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Escribe un archivo ZIP local de diagnósticos diseñado para informes de errores. Para consultar el modelo de privacidad y el contenido del paquete, consulte [Exportación de diagnósticos](/es/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ruta del archivo zip de salida. De forma predeterminada, se usa una exportación de soporte en el directorio de estado.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Número máximo de líneas de registro saneadas que se incluirán.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Número máximo de bytes de registro que se inspeccionarán.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL de WebSocket del Gateway para la instantánea de estado.
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
  Imprime como JSON la ruta escrita, el tamaño y el manifiesto.
</ParamField>

La exportación agrupa: `manifest.json` (inventario de archivos), `summary.md` (resumen en Markdown), `diagnostics.json` (resumen de nivel superior de configuración, registros, detección, estabilidad, estado y salud), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` y `stability/latest.json` cuando existe un paquete.

Está diseñada para compartirse. Conserva los detalles operativos útiles para la depuración —campos de registro seguros, nombres de subsistemas, códigos de estado, duraciones, modos configurados, puertos, identificadores de plugins/proveedores, ajustes de funciones no secretos y mensajes operativos de registro censurados— y omite o censura el texto de chats, los cuerpos de webhooks, las salidas de herramientas, las credenciales, las cookies, los identificadores de cuentas/mensajes, el texto de prompts/instrucciones, los nombres de host y los valores secretos. Cuando un mensaje de registro parece contener texto de la carga útil de un usuario, chat o herramienta (por ejemplo, «el usuario dijo», «texto del chat», «salida de la herramienta» o «cuerpo del webhook»), la exportación conserva únicamente el hecho de que se omitió un mensaje y su cantidad de bytes.

### `gateway status`

Muestra el servicio del Gateway (launchd/systemd/schtasks), además de una comprobación opcional de conectividad/autenticación.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Añade un destino explícito para la comprobación. También se comprueban el destino remoto configurado y localhost.
</ParamField>
<ParamField path="--token <token>" type="string">
  Autenticación mediante token para la comprobación.
</ParamField>
<ParamField path="--password <password>" type="string">
  Autenticación mediante contraseña para la comprobación.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Tiempo de espera de la comprobación.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Omite la comprobación de conectividad (vista solo del servicio).
</ParamField>
<ParamField path="--deep" type="boolean">
  También examina los servicios del sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Amplía la comprobación de conectividad con una comprobación de lectura y finaliza con un código distinto de cero si falla. No se puede combinar con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semántica del estado">
    - Permanece disponible para diagnóstico incluso cuando falta la configuración local de la CLI o esta no es válida.
    - La salida predeterminada demuestra el estado del servicio, la conexión WebSocket y la capacidad de autenticación visible durante el protocolo de enlace, no las operaciones de lectura, escritura o administración.
    - Las comprobaciones no realizan modificaciones en la autenticación inicial del dispositivo: reutilizan un token de dispositivo almacenado en caché cuando existe, pero nunca crean una nueva identidad de dispositivo de la CLI ni un registro de emparejamiento de solo lectura únicamente para comprobar el estado.
    - Resuelve los SecretRefs de autenticación configurados para la autenticación de la comprobación cuando es posible. Si no se resuelve un SecretRef obligatorio, `--json` informa de `rpc.authWarning` cuando falla la conectividad/autenticación de la comprobación; pase `--token`/`--password` explícitamente o corrija el origen del secreto. Las advertencias de autenticación no resuelta se suprimen cuando la comprobación se realiza correctamente.
    - La salida JSON incluye `gateway.version` cuando el Gateway en ejecución la informa; `--require-rpc` puede recurrir a la carga útil RPC `status.runtimeVersion` si la comprobación del protocolo de enlace no puede proporcionar los metadatos de la versión.
    - Use `--require-rpc` en scripts/automatizaciones cuando no sea suficiente con que un servicio esté escuchando y también necesite que la RPC con ámbito de lectura esté operativa.
    - `--deep` busca instalaciones adicionales de launchd/systemd/schtasks; cuando se encuentran varios servicios similares al Gateway, la salida para personas muestra indicaciones de limpieza (por lo general, ejecute un Gateway por máquina) e informa de una transferencia reciente tras un reinicio del supervisor cuando corresponde.
    - `--deep` también ejecuta la validación de la configuración en modo compatible con plugins (`pluginValidation: "full"`) y muestra advertencias del manifiesto de plugins (por ejemplo, si faltan metadatos de configuración del canal). El comando `gateway status` predeterminado conserva la ruta rápida de solo lectura que omite la validación de plugins.
    - La salida para personas incluye la ruta resuelta del archivo de registro, además de las rutas y la validez de la configuración de la CLI frente a la del servicio, para ayudar a diagnosticar divergencias del perfil o del directorio de estado.

  </Accordion>
  <Accordion title="Comprobaciones de divergencia de autenticación de systemd en Linux">
    - Las comprobaciones de divergencia de autenticación del servicio leen tanto `Environment=` como `EnvironmentFile=` de la unidad (incluidos `%h`, rutas entre comillas, varios archivos y archivos opcionales con `-`).
    - Resuelve los SecretRefs de `gateway.auth.token` mediante el entorno de ejecución combinado (primero el entorno del comando del servicio y, después, el entorno del proceso como alternativa).
    - Las comprobaciones de divergencia del token omiten la resolución del token de configuración cuando la autenticación mediante token no está activa de forma efectiva (`gateway.auth.mode` establecido explícitamente en `password`/`none`/`trusted-proxy`, o el modo no está establecido cuando la contraseña puede prevalecer y ningún token candidato puede hacerlo).

  </Accordion>
</AccordionGroup>

### `gateway probe`

El comando para «depurarlo todo». Siempre comprueba:

- el Gateway remoto configurado (si está definido), y
- localhost (bucle invertido), **incluso si se configuró uno remoto**.

Pasar `--url` añade ese destino explícito antes de ambos. La salida legible etiqueta los destinos como `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)` y `Local loopback`.

<Note>
Si se puede acceder a varios destinos de comprobación, se muestran todos. Un túnel SSH, una URL de TLS/proxy y una URL remota configurada pueden apuntar al mismo Gateway incluso con puertos de transporte diferentes; `multiple_gateways` se reserva para Gateways accesibles distintos o cuya identidad sea ambigua. Se admite ejecutar varios Gateways para perfiles aislados (por ejemplo, un bot de rescate), pero la mayoría de las instalaciones ejecutan un solo Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Usa este puerto para el destino de comprobación del bucle invertido local y el puerto remoto del túnel SSH. Sin `--url`, esto selecciona únicamente el destino de bucle invertido local, en lugar de la URL de entorno del Gateway configurado, el puerto de entorno o los destinos remotos.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretación">
    - `Reachable: yes` significa que al menos un destino aceptó una conexión WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` indica lo que la comprobación pudo demostrar sobre la autenticación, independientemente de la accesibilidad.
    - `Read probe: ok` significa que las llamadas RPC detalladas con ámbito de lectura (`health`/`status`/`system-presence`/`config.get`) también se realizaron correctamente.
    - `Read probe: limited - missing scope: operator.read` significa que la conexión se realizó correctamente, pero el RPC con ámbito de lectura está limitado. Se informa como accesibilidad **degradada**, no como un fallo total.
    - `Read probe: failed` después de `Connect: ok` significa que WebSocket se conectó, pero los diagnósticos de lectura posteriores agotaron el tiempo de espera o fallaron; también se considera un estado **degradado**, no inaccesible.
    - Al igual que `gateway status`, la comprobación reutiliza la autenticación de dispositivo almacenada en caché, pero no crea la identidad inicial del dispositivo ni el estado de emparejamiento.
    - El código de salida es distinto de cero solo cuando no se puede acceder a ninguno de los destinos comprobados.

  </Accordion>
  <Accordion title="Salida JSON">
    Nivel superior:

    - `ok`: se puede acceder al menos a un destino.
    - `degraded`: al menos un destino aceptó una conexión, pero no completó los diagnósticos RPC detallados completos.
    - `capability`: mejor capacidad observada entre los destinos accesibles (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: mejor destino para tratarlo como el ganador activo, en este orden: URL explícita, túnel SSH, remoto configurado, bucle invertido local.
    - `warnings[]`: registros de advertencias según el mejor esfuerzo, con `code`, `message` y `targetIds` opcional.
    - `network`: sugerencias de URL de bucle invertido local/tailnet derivadas de la configuración actual y de la red del host.
    - `discovery.timeoutMs` / `discovery.count`: el presupuesto de descubrimiento y el recuento de resultados reales utilizados en esta pasada de sondeo.

    Por destino (`targets[].connect`): `ok` (accesibilidad + clasificación degradada), `rpcOk` (éxito del RPC detallado completo), `scopeLimited` (el RPC detallado falló por falta del ámbito de operador).

    Por destino (`targets[].auth`): `role` y `scopes` informados en `hello-ok` cuando están disponibles, además de la clasificación `capability` expuesta.

  </Accordion>
  <Accordion title="Códigos de advertencia comunes">
    - `ssh_tunnel_failed`: falló la configuración del túnel SSH; el comando recurrió a sondeos directos.
    - `multiple_gateways`: se pudo acceder a identidades de Gateway distintas, o OpenClaw no pudo demostrar que los destinos accesibles fueran el mismo Gateway. Un túnel SSH, una URL de proxy o una URL remota configurada hacia el mismo Gateway no activa esta advertencia.
    - `auth_secretref_unresolved`: no se pudo resolver una SecretRef de autenticación configurada para un destino con fallo.
    - `probe_scope_limited`: la conexión WebSocket se realizó correctamente, pero el sondeo de lectura estuvo limitado por la falta de `operator.read`.
    - `local_tls_runtime_unavailable`: TLS está habilitado en el Gateway local, pero OpenClaw no pudo cargar la huella digital del certificado local.

  </Accordion>
</AccordionGroup>

#### Acceso remoto mediante SSH (paridad con la aplicación para Mac)

El modo "Remote over SSH" de la aplicación para macOS usa un reenvío de puerto local para que un Gateway remoto limitado al bucle invertido sea accesible en `ws://127.0.0.1:<port>`.

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
  Selecciona el primer host de Gateway descubierto como destino SSH a partir del punto de conexión de descubrimiento resuelto (`local.` más el dominio de área amplia configurado, si existe). Se ignoran las sugerencias que solo contienen TXT.
</ParamField>

Valores predeterminados de configuración (opcionales): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`.

### `gateway call <method>`

Auxiliar RPC de bajo nivel.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
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
<ParamField path="--timeout <ms>" type="number" default="10000">
  Presupuesto de tiempo de espera.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Principalmente para RPC de estilo agente que transmiten eventos intermedios antes de una carga útil final.
</ParamField>
<ParamField path="--json" type="boolean">
  Salida JSON legible por máquinas.
</ParamField>

<Note>
`--params` debe ser JSON válido y cada método valida su propia estructura de parámetros (se rechazan los campos adicionales o con nombres incorrectos).
</Note>

## Administrar el servicio Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Instalar con un contenedor

Use `--wrapper` cuando el servicio administrado deba iniciarse mediante otro ejecutable, por ejemplo, un adaptador de un gestor de secretos o un auxiliar para ejecutar con otra identidad. El contenedor recibe los argumentos normales del Gateway y es responsable de ejecutar finalmente `openclaw` o Node con esos argumentos.

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

También puede definir el contenedor mediante el entorno. `gateway install` valida que la ruta sea un archivo ejecutable, escribe el contenedor en `ProgramArguments` del servicio y conserva `OPENCLAW_WRAPPER` en el entorno del servicio para posteriores reinstalaciones forzadas, actualizaciones y reparaciones de doctor.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Para eliminar un contenedor guardado, borre `OPENCLAW_WRAPPER` durante la reinstalación:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Opciones de los comandos">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>` (valor predeterminado: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Comportamiento del ciclo de vida">
    - Use `gateway restart` para reiniciar un servicio administrado. No encadene `gateway stop` y `gateway start` como sustituto de un reinicio.
    - En macOS, `gateway stop` usa `launchctl bootout` de forma predeterminada, lo que elimina el LaunchAgent de la sesión de arranque actual sin conservar una desactivación: la recuperación automática mediante KeepAlive permanece activa para futuros fallos y `gateway start` lo vuelve a habilitar correctamente sin ejecutar manualmente `launchctl enable`. Pase `--disable` para suprimir de forma persistente KeepAlive y RunAtLoad, de modo que el Gateway no vuelva a iniciarse hasta el siguiente `gateway start` explícito; use esta opción cuando una detención manual deba mantenerse después de reiniciar el sistema.
    - Los comandos del ciclo de vida aceptan `--json` para automatización mediante scripts.

  </Accordion>
  <Accordion title="Autenticación y SecretRefs durante la instalación">
    - Cuando la autenticación mediante token requiere un token y `gateway.auth.token` está administrado mediante SecretRef, `gateway install` valida que el SecretRef pueda resolverse, pero no conserva el token resuelto en los metadatos del entorno del servicio.
    - Si la autenticación mediante token requiere un token y el SecretRef de token configurado no puede resolverse, la instalación falla de forma segura en lugar de conservar texto sin formato como alternativa.
    - Para la autenticación mediante contraseña en `gateway run`, use preferentemente `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` respaldado por SecretRef, en lugar de `--password` en línea.
    - En el modo de autenticación inferido, `OPENCLAW_GATEWAY_PASSWORD` definido únicamente en el shell no elimina los requisitos de token de la instalación; use una configuración persistente (`gateway.auth.password` o `env` en la configuración) al instalar un servicio administrado.
    - Si se configuran tanto `gateway.auth.token` como `gateway.auth.password` y `gateway.auth.mode` no está definido, la instalación se bloquea hasta que el modo se establezca explícitamente.

  </Accordion>
</AccordionGroup>

## Detectar gateways (Bonjour)

`gateway discover` busca anuncios de Gateway (`_openclaw-gw._tcp`).

- DNS-SD multidifusión: `local.`
- DNS-SD unidifusión (Bonjour de área amplia): elija un dominio (ejemplo: `openclaw.internal.`) y configure DNS dividido y un servidor DNS; consulte [Bonjour](/es/gateway/bonjour).

Solo los gateways con la detección mediante Bonjour habilitada (valor predeterminado) anuncian la baliza.

Indicaciones TXT en cada baliza: `role` (indicación del rol del Gateway), `transport` (indicación del transporte, por ejemplo, `gateway`), `gatewayPort` (puerto WebSocket, normalmente `18789`), `tailnetDns` (nombre de host MagicDNS, cuando está disponible), `gatewayTls` / `gatewayTlsSha256` (TLS habilitado y huella digital del certificado). `sshPort` y `cliPath` solo se publican en el modo de detección completa (`discovery.mdns.mode: "full"`; el valor predeterminado es `"minimal"`, que los omite; en ese caso, los clientes usan de forma predeterminada el puerto `22` para los destinos SSH).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Tiempo de espera por comando (exploración/resolución).
</ParamField>
<ParamField path="--json" type="boolean">
  Salida legible por máquinas (también deshabilita los estilos y el indicador giratorio).
</ParamField>

Ejemplos:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- Busca en `local.` y en el dominio de área amplia configurado cuando está habilitado.
- `wsUrl` en la salida JSON se deriva del punto de conexión del servicio resuelto, no de indicaciones presentes únicamente en TXT, como `lanHost` o `tailnetDns`.
- `discovery.mdns.mode` controla la publicación de `sshPort`/`cliPath` tanto en mDNS de `local.` como en DNS-SD de área amplia (consulte la información anterior).

</Note>

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Guía operativa del Gateway](/es/gateway)
