---
read_when:
    - Ejecutar el Gateway desde la CLI (desarrollo o servidores)
    - Depurar la autenticación de Gateway, los modos de enlace y la conectividad
    - Descubrir gateways mediante Bonjour (DNS-SD local y de área amplia)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — ejecutar, consultar y descubrir Gateways
title: Gateway
x-i18n:
    generated_at: "2026-07-01T05:28:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80f329ebd154f6fd0e87869c498c58fc6d5276a21934f8a36837653bd68a2d22
    source_path: cli/gateway.md
    workflow: 16
---

El Gateway es el servidor WebSocket de OpenClaw (canales, nodos, sesiones, hooks). Los subcomandos de esta página están bajo `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/es/gateway/bonjour">
    Configuración local de mDNS + DNS-SD de área amplia.
  </Card>
  <Card title="Discovery overview" href="/es/gateway/discovery">
    Cómo OpenClaw anuncia y encuentra gateways.
  </Card>
  <Card title="Configuration" href="/es/gateway/configuration">
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
  <Accordion title="Startup behavior">
    - De forma predeterminada, el Gateway se niega a iniciar a menos que `gateway.mode=local` esté definido en `~/.openclaw/openclaw.json`. Usa `--allow-unconfigured` para ejecuciones ad hoc/de desarrollo.
    - Se espera que `openclaw onboard --mode local` y `openclaw setup` escriban `gateway.mode=local`. Si el archivo existe pero falta `gateway.mode`, trátalo como una configuración rota o sobrescrita y repárala en lugar de asumir implícitamente el modo local.
    - Si el archivo existe y falta `gateway.mode`, el Gateway lo trata como daño sospechoso en la configuración y se niega a "adivinar local" por ti.
    - Se bloquea el enlace más allá de loopback sin autenticación (protección de seguridad).
    - `lan`, `tailnet` y `custom` actualmente se resuelven mediante rutas BYOH solo IPv4.
    - BYOH solo IPv6 no es compatible de forma nativa en esta ruta actualmente. Usa un sidecar o proxy IPv4 si el host en sí es solo IPv6.
    - `SIGUSR1` activa un reinicio en proceso cuando está autorizado (`commands.restart` está habilitado de forma predeterminada; define `commands.restart: false` para bloquear el reinicio manual, mientras que la aplicación/actualización de herramientas/configuración del gateway permanece permitida).
    - Los manejadores de `SIGINT`/`SIGTERM` detienen el proceso del gateway, pero no restauran ningún estado personalizado de la terminal. Si envuelves la CLI con una TUI o entrada en modo raw, restaura la terminal antes de salir.

  </Accordion>
</AccordionGroup>

### Opciones

<ParamField path="--port <port>" type="number">
  Puerto WebSocket (el valor predeterminado viene de la configuración/env; normalmente `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Modo de enlace del listener. `lan`, `tailnet` y `custom` actualmente se resuelven mediante rutas solo IPv4.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Sustitución del modo de autenticación.
</ParamField>
<ParamField path="--token <token>" type="string">
  Sustitución del token (también define `OPENCLAW_GATEWAY_TOKEN` para el proceso).
</ParamField>
<ParamField path="--password <password>" type="string">
  Sustitución de la contraseña.
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
  Actualmente espera una dirección IPv4. Para BYOH solo IPv6, coloca un sidecar o proxy IPv4 delante del Gateway y apunta OpenClaw a ese endpoint IPv4.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Permitir que el gateway inicie sin `gateway.mode=local` en la configuración. Omite la protección de inicio solo para arranques ad hoc/de desarrollo; no escribe ni repara el archivo de configuración.
</ParamField>
<ParamField path="--dev" type="boolean">
  Crear una configuración de desarrollo + workspace si faltan (omite BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Restablecer configuración de desarrollo + credenciales + sesiones + workspace (requiere `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Terminar cualquier listener existente en el puerto seleccionado antes de iniciar.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Registros detallados.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Mostrar solo los registros del backend de la CLI en la consola (y habilitar stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Estilo de registro de WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias de `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Registrar eventos sin procesar del flujo del modelo en jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ruta jsonl del flujo sin procesar.
</ParamField>

## Reiniciar el Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` pide al Gateway en ejecución que haga una comprobación previa del trabajo activo y programe un reinicio combinado después de que el trabajo activo se vacíe. El reinicio seguro predeterminado espera el trabajo activo hasta el `gateway.reload.deferralTimeoutMs` configurado (predeterminado 5 minutos); cuando ese presupuesto expira, el reinicio se fuerza. Define `gateway.reload.deferralTimeoutMs` en `0` para una espera segura indefinida que nunca fuerza. `restart` simple mantiene el comportamiento existente del gestor de servicios; `--force` sigue siendo la ruta de sustitución inmediata.

`openclaw gateway restart --safe --skip-deferral` ejecuta el mismo reinicio coordinado consciente de OpenClaw que `--safe`, pero omite la compuerta de aplazamiento por trabajo activo para que el Gateway emita el reinicio inmediatamente incluso cuando se informan bloqueadores. Úsalo como vía de escape del operador cuando un aplazamiento haya quedado fijado por una ejecución de tarea atascada y `--safe` por sí solo pueda estar limitado por `gateway.reload.deferralTimeoutMs`. `--skip-deferral` requiere `--safe`.

<Warning>
`--password` en línea puede quedar expuesto en listados de procesos locales. Prefiere `--password-file`, env o un `gateway.auth.password` respaldado por SecretRef.
</Warning>

### Perfilado del Gateway

- Define `OPENCLAW_GATEWAY_STARTUP_TRACE=1` para registrar tiempos por fase durante el inicio del Gateway, incluido el retraso `eventLoopMax` por fase y los tiempos de tablas de búsqueda de plugins para installed-index, registro de manifiestos, planificación de inicio y trabajo de owner-map.
- Define `OPENCLAW_GATEWAY_RESTART_TRACE=1` para registrar líneas `restart trace:` con alcance de reinicio para el manejo de señales de reinicio, vaciado de trabajo activo, fases de apagado, siguiente inicio, tiempo hasta ready y métricas de memoria.
- Define `OPENCLAW_DIAGNOSTICS=timeline` con `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` para escribir una línea temporal de diagnóstico de inicio JSONL de mejor esfuerzo para arneses de QA externos. También puedes habilitar la marca con `diagnostics.flags: ["timeline"]` en la configuración; la ruta sigue proporcionándose por env. Añade `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` para incluir muestras del bucle de eventos.
- Ejecuta primero `pnpm build`, luego `pnpm test:startup:gateway -- --runs 5 --warmup 1` para comparar el inicio del Gateway contra la entrada de CLI compilada. El benchmark registra la primera salida del proceso, `/healthz`, `/readyz`, tiempos de traza de inicio, retraso del bucle de eventos y detalles de tiempos de tablas de búsqueda de plugins.
- Ejecuta primero `pnpm build`, luego `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` para comparar el reinicio en proceso del Gateway contra la entrada de CLI compilada en macOS o Linux. El benchmark de reinicio usa SIGUSR1, habilita trazas de inicio y reinicio en el proceso hijo, y registra el siguiente `/healthz`, el siguiente `/readyz`, tiempo de inactividad, tiempo hasta ready, CPU, RSS y métricas de traza de reinicio.
- Trata `/healthz` como disponibilidad del proceso y `/readyz` como preparación utilizable. Las líneas de traza y la salida del benchmark son para atribución de propietarios; no trates un tramo de traza o una muestra como una conclusión completa de rendimiento.

## Consultar un Gateway en ejecución

Todos los comandos de consulta usan RPC por WebSocket.

<Tabs>
  <Tab title="Output modes">
    - Predeterminado: legible para humanos (con color en TTY).
    - `--json`: JSON legible por máquina (sin estilo/spinner).
    - `--no-color` (o `NO_COLOR=1`): deshabilita ANSI mientras conserva el diseño humano.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: URL WebSocket del Gateway.
    - `--token <token>`: token del Gateway.
    - `--password <password>`: contraseña del Gateway.
    - `--timeout <ms>`: tiempo de espera/presupuesto (varía según el comando).
    - `--expect-final`: esperar una respuesta "final" (llamadas de agente).

  </Tab>
</Tabs>

<Note>
Cuando defines `--url`, la CLI no recurre a credenciales de configuración o del entorno. Pasa `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

El endpoint HTTP `/healthz` es una sonda de disponibilidad: devuelve una respuesta cuando el servidor puede responder HTTP. El endpoint HTTP `/readyz` es más estricto y permanece en rojo mientras los sidecars de plugins de inicio, canales o hooks configurados todavía se están estabilizando. Las respuestas de preparación detalladas locales o autenticadas incluyen un bloque de diagnóstico `eventLoop` con retraso del bucle de eventos, utilización del bucle de eventos, proporción de núcleos de CPU y una marca `degraded`.

<ParamField path="--port <port>" type="number">
  Apuntar a un Gateway local loopback en este puerto. Esto anula `OPENCLAW_GATEWAY_URL` y `OPENCLAW_GATEWAY_PORT` para la llamada de estado.
</ParamField>

### `gateway usage-cost`

Obtener resúmenes de coste de uso desde los registros de sesión.

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
  Limitar el resumen de costes a un id de agente configurado.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Agregar el resumen de costes entre todos los agentes configurados. No se puede combinar con `--agent`.
</ParamField>

### `gateway stability`

Obtener el registrador de estabilidad de diagnóstico reciente desde un Gateway en ejecución.

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
  <Accordion title="Privacy and bundle behavior">
    - Los registros conservan metadatos operativos: nombres de eventos, conteos, tamaños en bytes, lecturas de memoria, estado de colas/sesiones, ids de aprobación, nombres de canales/plugins y resúmenes de sesiones redactados. No conservan texto de chat, cuerpos de webhook, salidas de herramientas, cuerpos sin procesar de solicitudes o respuestas, tokens, cookies, valores secretos, nombres de host ni ids de sesión sin procesar. Define `diagnostics.enabled: false` para deshabilitar el registrador por completo.
    - En salidas fatales del Gateway, tiempos de espera de apagado y fallos de inicio tras reinicio, OpenClaw escribe la misma instantánea de diagnóstico en `~/.openclaw/logs/stability/openclaw-stability-*.json` cuando el registrador tiene eventos. Inspecciona el paquete más nuevo con `openclaw gateway stability --bundle latest`; `--limit`, `--type` y `--since-seq` también se aplican a la salida del paquete.

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
  Ruta del zip de salida. De forma predeterminada, usa una exportación para soporte bajo el directorio de estado.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Número máximo de líneas de registro sanitizadas que se incluirán.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Número máximo de bytes de registro que se inspeccionarán.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket de Gateway para la instantánea de salud.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token de Gateway para la instantánea de salud.
</ParamField>
<ParamField path="--password <password>" type="string">
  Contraseña de Gateway para la instantánea de salud.
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

La exportación contiene un manifiesto, un resumen en Markdown, la forma de la configuración, detalles de configuración sanitizados, resúmenes de registro sanitizados, instantáneas sanitizadas de estado/salud de Gateway y el paquete de estabilidad más reciente cuando existe uno.

Está pensada para compartirse. Conserva detalles operativos que ayudan con la depuración, como campos de registro seguros de OpenClaw, nombres de subsistemas, códigos de estado, duraciones, modos configurados, puertos, ids de plugins, ids de proveedores, ajustes de funciones no secretos y mensajes de registro operativos redactados. Omite o redacta texto de chat, cuerpos de webhook, salidas de herramientas, credenciales, cookies, identificadores de cuenta/mensaje, texto de prompts/instrucciones, nombres de host y valores secretos. Cuando un mensaje de tipo LogTape parece texto de carga de usuario/chat/herramienta, la exportación conserva solo que se omitió un mensaje y su conteo de bytes.

### `gateway status`

`gateway status` muestra el servicio de Gateway (launchd/systemd/schtasks) más una comprobación opcional de conectividad/capacidad de autenticación.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Añade un destino de comprobación explícito. El remoto configurado y localhost también se comprueban.
</ParamField>
<ParamField path="--token <token>" type="string">
  Autenticación con token para la comprobación.
</ParamField>
<ParamField path="--password <password>" type="string">
  Autenticación con contraseña para la comprobación.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Tiempo de espera de la comprobación.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Omite la comprobación de conectividad (vista solo del servicio).
</ParamField>
<ParamField path="--deep" type="boolean">
  También analiza servicios de nivel de sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Eleva la comprobación de conectividad predeterminada a una comprobación de lectura y sale con código distinto de cero cuando esa comprobación de lectura falla. No se puede combinar con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semántica de estado">
    - `gateway status` sigue disponible para diagnósticos incluso cuando la configuración local de CLI falta o no es válida.
    - `gateway status` predeterminado prueba el estado del servicio, la conexión WebSocket y la capacidad de autenticación visible en el momento del handshake. No prueba operaciones de lectura/escritura/administración.
    - Las comprobaciones de diagnóstico no mutan la autenticación de dispositivos por primera vez: reutilizan un token de dispositivo en caché existente cuando existe uno, pero no crean una nueva identidad de dispositivo de CLI ni un registro de emparejamiento de dispositivo de solo lectura solo para comprobar el estado.
    - `gateway status` resuelve SecretRefs de autenticación configuradas para la autenticación de la comprobación cuando es posible.
    - Si una SecretRef de autenticación requerida no se resuelve en esta ruta de comando, `gateway status --json` informa `rpc.authWarning` cuando la conectividad/autenticación de la comprobación falla; pasa `--token`/`--password` explícitamente o resuelve primero la fuente del secreto.
    - Si la comprobación tiene éxito, las advertencias de referencias de autenticación no resueltas se suprimen para evitar falsos positivos.
    - Cuando la comprobación está habilitada, la salida JSON incluye `gateway.version` cuando el Gateway en ejecución la informa; `--require-rpc` puede recurrir a la carga RPC `status.runtimeVersion` si la comprobación de handshake de seguimiento no puede proporcionar metadatos de versión.
    - Usa `--require-rpc` en scripts y automatización cuando un servicio en escucha no es suficiente y también necesitas que las llamadas RPC con alcance de lectura estén sanas.
    - `--deep` añade un análisis de mejor esfuerzo para instalaciones adicionales de launchd/systemd/schtasks. Cuando se detectan varios servicios similares a gateway, la salida humana imprime sugerencias de limpieza y advierte que la mayoría de configuraciones deberían ejecutar un gateway por máquina.
    - `--deep` también informa una delegación reciente de reinicio del supervisor de Gateway cuando el proceso del servicio salió limpiamente por un reinicio de supervisor externo.
    - `--deep` ejecuta validación de configuración en modo consciente de plugins (`pluginValidation: "full"`) y muestra advertencias de manifiestos de plugins configurados (por ejemplo, metadatos de configuración de canal faltantes) para que las comprobaciones de instalación y actualización las detecten. `gateway status` predeterminado conserva la ruta rápida de solo lectura que omite la validación de plugins.
    - La salida humana incluye la ruta resuelta del archivo de registro más una instantánea de rutas/validez de configuración de CLI frente a servicio para ayudar a diagnosticar divergencias de perfil o directorio de estado.

  </Accordion>
  <Accordion title="Comprobaciones de deriva de autenticación de systemd en Linux">
    - En instalaciones systemd de Linux, las comprobaciones de deriva de autenticación del servicio leen valores `Environment=` y `EnvironmentFile=` de la unidad (incluidos `%h`, rutas entre comillas, múltiples archivos y archivos opcionales `-`).
    - Las comprobaciones de deriva resuelven SecretRefs de `gateway.auth.token` usando el entorno de ejecución fusionado (primero el entorno del comando de servicio y luego el entorno del proceso como respaldo).
    - Si la autenticación con token no está efectivamente activa (`gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, o modo no definido donde la contraseña puede prevalecer y ningún candidato de token puede prevalecer), las comprobaciones de deriva de token omiten la resolución del token de configuración.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` es el comando de "depurar todo". Siempre comprueba:

- tu gateway remoto configurado (si está definido), y
- localhost (local loopback) **incluso si hay un remoto configurado**.

Si pasas `--url`, ese destino explícito se añade antes de ambos. La salida humana etiqueta los destinos como:

- `URL (explícita)`
- `Remoto (configurado)` o `Remoto (configurado, inactivo)`
- `Local loopback`

<Note>
Si varios destinos de comprobación son alcanzables, los imprime todos. Un túnel SSH, una URL TLS/proxy y una URL remota configurada pueden apuntar todas al mismo gateway aunque sus puertos de transporte difieran; `multiple_gateways` se reserva para gateways alcanzables distintos o con identidad ambigua. Se admiten múltiples gateways cuando usas perfiles aislados (por ejemplo, un bot de rescate), pero la mayoría de instalaciones siguen ejecutando un solo gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Usa este puerto para el destino de comprobación local loopback y el puerto remoto del túnel SSH. Sin `--url`, esto selecciona el destino local loopback en lugar de la URL de entorno de gateway configurada, el puerto de entorno o los destinos remotos.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretación">
    - `Reachable: yes` significa que al menos un destino aceptó una conexión WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` informa lo que la comprobación pudo probar sobre la autenticación. Es independiente de la alcanzabilidad.
    - `Read probe: ok` significa que las llamadas RPC de detalle con alcance de lectura (`health`/`status`/`system-presence`/`config.get`) también tuvieron éxito.
    - `Read probe: limited - missing scope: operator.read` significa que la conexión tuvo éxito, pero la RPC con alcance de lectura está limitada. Esto se informa como alcanzabilidad **degradada**, no como fallo completo.
    - `Read probe: failed` después de `Connect: ok` significa que Gateway aceptó la conexión WebSocket, pero los diagnósticos de lectura de seguimiento agotaron el tiempo de espera o fallaron. Esto también es alcanzabilidad **degradada**, no un Gateway inalcanzable.
    - Al igual que `gateway status`, la comprobación reutiliza la autenticación de dispositivo en caché existente, pero no crea identidad de dispositivo por primera vez ni estado de emparejamiento.
    - El código de salida es distinto de cero solo cuando ningún destino comprobado es alcanzable.

  </Accordion>
  <Accordion title="Salida JSON">
    Nivel superior:

    - `ok`: al menos un destino es alcanzable.
    - `degraded`: al menos un destino aceptó una conexión, pero no completó todos los diagnósticos RPC detallados.
    - `capability`: mejor capacidad observada entre los destinos alcanzables (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: mejor destino para tratar como ganador activo en este orden: URL explícita, túnel SSH, remoto configurado y luego local loopback.
    - `warnings[]`: registros de advertencia de mejor esfuerzo con `code`, `message` y `targetIds` opcionales.
    - `network`: sugerencias de URL local loopback/tailnet derivadas de la configuración actual y la red del host.
    - `discovery.timeoutMs` y `discovery.count`: el presupuesto de descubrimiento y conteo de resultados reales usados para esta pasada de comprobación.

    Por destino (`targets[].connect`):

    - `ok`: alcanzabilidad después de la clasificación de conexión + degradación.
    - `rpcOk`: éxito completo de RPC detallada.
    - `scopeLimited`: la RPC detallada falló por falta de alcance de operador.

    Por destino (`targets[].auth`):

    - `role`: rol de autenticación informado en `hello-ok` cuando está disponible.
    - `scopes`: alcances concedidos informados en `hello-ok` cuando están disponibles.
    - `capability`: la clasificación de capacidad de autenticación expuesta para ese destino.

  </Accordion>
  <Accordion title="Códigos de advertencia comunes">
    - `ssh_tunnel_failed`: falló la configuración del túnel SSH; el comando recurrió a comprobaciones directas.
    - `multiple_gateways`: identidades de gateway distintas eran alcanzables, o OpenClaw no pudo probar que los destinos alcanzables son el mismo gateway. Un túnel SSH, una URL de proxy o una URL remota configurada hacia el mismo gateway no activa esta advertencia.
    - `auth_secretref_unresolved`: no se pudo resolver una SecretRef de autenticación configurada para un destino fallido.
    - `probe_scope_limited`: la conexión WebSocket tuvo éxito, pero la comprobación de lectura estuvo limitada por la falta de `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto por SSH (paridad con la app de Mac)

El modo "Remoto por SSH" de la app de macOS usa un reenvío de puerto local para que el gateway remoto (que puede estar enlazado solo a loopback) sea alcanzable en `ws://127.0.0.1:<port>`.

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
  Elige el primer host de gateway descubierto como destino SSH desde el endpoint de descubrimiento resuelto (`local.` más el dominio de área amplia configurado, si existe). Se ignoran las sugerencias solo TXT.
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

## Gestionar el servicio de Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Instalar con un contenedor

Usa `--wrapper` cuando el servicio administrado deba iniciarse mediante otro ejecutable, por ejemplo un
adaptador de gestor de secretos o un ayudante para ejecutar como otro usuario. El contenedor recibe los argumentos normales del Gateway y es
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

También puedes definir el contenedor mediante el entorno. `gateway install` valida que la ruta sea
un archivo ejecutable, escribe el contenedor en `ProgramArguments` del servicio y conserva
`OPENCLAW_WRAPPER` en el entorno del servicio para reinstalaciones forzadas, actualizaciones y reparaciones de doctor
posteriores.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Para quitar un contenedor conservado, vacía `OPENCLAW_WRAPPER` al reinstalar:

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
  <Accordion title="Lifecycle behavior">
    - Usa `gateway restart` para reiniciar un servicio administrado. No encadenes `gateway stop` y `gateway start` como sustituto de reinicio.
    - En macOS, `gateway stop` usa `launchctl bootout` de forma predeterminada, lo que elimina el LaunchAgent de la sesión de arranque actual sin conservar una deshabilitación: la recuperación automática de KeepAlive permanece activa para futuros bloqueos y `gateway start` vuelve a habilitarlo limpiamente sin un `launchctl enable` manual. Pasa `--disable` para suprimir KeepAlive y RunAtLoad de forma persistente, de modo que el Gateway no se vuelva a iniciar hasta el siguiente `gateway start` explícito; usa esto cuando una detención manual deba sobrevivir a reinicios del equipo o del sistema.
    - `gateway restart --safe` pide al Gateway en ejecución que compruebe previamente el trabajo activo y programe un único reinicio combinado después de que el trabajo activo se vacíe. El reinicio seguro predeterminado espera el trabajo activo hasta el `gateway.reload.deferralTimeoutMs` configurado (5 minutos de forma predeterminada); cuando ese presupuesto expira, el reinicio se fuerza. Establece `gateway.reload.deferralTimeoutMs` en `0` para una espera segura indefinida que nunca fuerza. `--safe` no se puede combinar con `--force` ni `--wait`.
    - `gateway restart --wait 30s` anula el presupuesto configurado de vaciado de reinicio para ese reinicio. Los números sin unidad son milisegundos; se aceptan unidades como `s`, `m` y `h`. `--wait 0` espera indefinidamente.
    - `gateway restart --safe --skip-deferral` ejecuta el reinicio seguro compatible con OpenClaw, pero omite la puerta de aplazamiento para que el Gateway emita el reinicio de inmediato incluso cuando se informen bloqueadores. Es una vía de escape para operadores ante aplazamientos de ejecuciones de tareas atascadas; requiere `--safe`.
    - `gateway restart --force` omite el vaciado del trabajo activo y reinicia de inmediato. Úsalo cuando un operador ya haya inspeccionado los bloqueadores de tareas listados y quiera que el Gateway vuelva ahora.
    - Los comandos de ciclo de vida aceptan `--json` para scripts.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - Cuando la autenticación por token requiere un token y `gateway.auth.token` está administrado por SecretRef, `gateway install` valida que el SecretRef se pueda resolver, pero no conserva el token resuelto en los metadatos de entorno del servicio.
    - Si la autenticación por token requiere un token y el SecretRef de token configurado no se resuelve, la instalación falla de forma cerrada en lugar de conservar texto sin formato de respaldo.
    - Para autenticación por contraseña en `gateway run`, prefiere `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` respaldado por SecretRef antes que `--password` en línea.
    - En modo de autenticación inferida, `OPENCLAW_GATEWAY_PASSWORD` solo de shell no relaja los requisitos de token de instalación; usa configuración duradera (`gateway.auth.password` o `env` de configuración) al instalar un servicio administrado.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación se bloquea hasta que el modo se establezca explícitamente.

  </Accordion>
</AccordionGroup>

## Descubrir Gateways (Bonjour)

`gateway discover` busca balizas de Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour de área amplia): elige un dominio (ejemplo: `openclaw.internal.`) y configura DNS dividido + un servidor DNS; consulta [Bonjour](/es/gateway/bonjour).

Solo los Gateways con descubrimiento Bonjour habilitado (predeterminado) anuncian la baliza.

Los registros de descubrimiento de área amplia pueden incluir estas sugerencias TXT:

- `role` (sugerencia de rol del Gateway)
- `transport` (sugerencia de transporte, por ejemplo `gateway`)
- `gatewayPort` (puerto WebSocket, normalmente `18789`)
- `sshPort` (solo en modo de descubrimiento completo; los clientes usan `22` como destino SSH predeterminado cuando no está presente)
- `tailnetDns` (nombre de host MagicDNS, cuando está disponible)
- `gatewayTls` / `gatewayTlsSha256` (TLS habilitado + huella digital del certificado)
- `cliPath` (solo en modo de descubrimiento completo)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Tiempo de espera por comando (explorar/resolver).
</ParamField>
<ParamField path="--json" type="boolean">
  Salida legible por máquina (también deshabilita estilos/indicador de carga).
</ParamField>

Ejemplos:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- La CLI busca en `local.` más el dominio de área amplia configurado cuando hay uno habilitado.
- `wsUrl` en la salida JSON se deriva del endpoint de servicio resuelto, no de sugerencias solo TXT como `lanHost` o `tailnetDns`.
- En mDNS `local.` y DNS-SD de área amplia, `sshPort` y `cliPath` solo se publican cuando `discovery.mdns.mode` es `full`.

</Note>

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Runbook del Gateway](/es/gateway)
