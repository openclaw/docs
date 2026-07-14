---
read_when:
    - Ejecutar el Gateway desde la CLI (desarrollo o servidores)
    - Depuración de la autenticación, los modos de enlace y la conectividad del Gateway
    - Descubrimiento de gateways mediante Bonjour (DNS-SD local y de área amplia)
sidebarTitle: Gateway
summary: CLI del Gateway de OpenClaw (`openclaw gateway`) — ejecutar, consultar y descubrir gateways
title: Gateway
x-i18n:
    generated_at: "2026-07-14T13:34:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: fbbd236611d20a703b64719c2f05a95554107b8e847fb1a4dca55025890f238d
    source_path: cli/gateway.md
    workflow: 16
---

El Gateway es el servidor WebSocket de OpenClaw (canales, nodos, sesiones, hooks). Todos los subcomandos siguientes se encuentran bajo `openclaw gateway ...`.

<CardGroup cols={3}>
  <Card title="Descubrimiento de Bonjour" href="/es/gateway/bonjour">
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
openclaw gateway run   # forma explícita equivalente
```

<AccordionGroup>
  <Accordion title="Comportamiento de inicio">
    - Se niega a iniciarse a menos que `gateway.mode=local` esté establecido en `~/.openclaw/openclaw.json`. Use `--allow-unconfigured` para ejecuciones ad hoc o de desarrollo; omite la comprobación sin escribir ni reparar la configuración.
    - `openclaw onboard --mode local` y `openclaw setup` escriben `gateway.mode=local`. Si el archivo de configuración existe, pero falta `gateway.mode`, se considera que la configuración está dañada o sobrescrita y el Gateway se niega a deducir `local` — vuelva a ejecutar la incorporación, establezca la clave manualmente o pase `--allow-unconfigured`.
    - Se bloquea la vinculación más allá de la interfaz de bucle invertido sin autenticación.
    - Actualmente, los valores `lan`, `tailnet` y `custom` de `--bind` se resuelven mediante rutas exclusivas de IPv4; las configuraciones de host propio exclusivas de IPv6 necesitan un proceso auxiliar IPv4 o un proxy delante del Gateway.
    - `SIGUSR1` activa un reinicio dentro del proceso cuando está autorizado. `commands.restart` (valor predeterminado: habilitado) controla los `SIGUSR1` enviados externamente; establézcalo en `false` para bloquear los reinicios manuales mediante señales del SO, pero seguir permitiendo el reinicio mediante el comando `gateway restart`, la herramienta del gateway y la aplicación o actualización de la configuración.
    - `SIGINT`/`SIGTERM` detienen el proceso, pero no restauran el estado personalizado del terminal; si la CLI está encapsulada en una TUI o una entrada en modo sin procesar, restaure el terminal antes de salir.

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
  Leer la contraseña del Gateway desde un archivo.
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Exposición de Tailscale: `off`, `serve`, `funnel`.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Restablecer la configuración serve/funnel de Tailscale al cerrar.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Iniciar sin aplicar `gateway.mode=local`. Solo para el arranque ad hoc o de desarrollo; no conserva ni repara la configuración.
</ParamField>
<ParamField path="--dev" type="boolean">
  Crear una configuración y un espacio de trabajo de desarrollo si no existen (omite `BOOTSTRAP.md`).
</ParamField>
<ParamField path="--reset" type="boolean">
  Restablecer la configuración de desarrollo, las credenciales, las sesiones y el espacio de trabajo. Requiere `--dev`.
</ParamField>
<ParamField path="--force" type="boolean">
  Finalizar cualquier proceso de escucha existente en el puerto de destino antes de iniciar.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Registro detallado en stdout/stderr.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Mostrar únicamente los registros del backend de la CLI en la consola (también habilita stdout/stderr).
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  Estilo de registro de WebSocket: `auto`, `full`, `compact`.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias de `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Registrar los eventos sin procesar del flujo del modelo en JSONL.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ruta JSONL del flujo sin procesar.
</ParamField>

`--claude-cli-logs` es un alias obsoleto de `--cli-backend-logs`.

Para `--bind custom`, establezca `gateway.customBindHost` en una dirección IPv4. Cualquier dirección distinta de `127.0.0.1` o `0.0.0.0` también requiere `127.0.0.1` en el mismo puerto para los clientes del mismo host; el inicio falla si alguno de los procesos de escucha no puede vincularse. El comodín `0.0.0.0` no añade un alias obligatorio independiente. Las configuraciones de host propio exclusivas de IPv6 necesitan un proceso auxiliar IPv4 o un proxy delante del Gateway.

## Reiniciar el Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` solicita al Gateway en ejecución que compruebe previamente el trabajo activo y programe un único reinicio consolidado una vez que dicho trabajo termine. La espera está limitada por `gateway.reload.deferralTimeoutMs` (valor predeterminado: 5 minutos / `300000`); cuando se agota el tiempo disponible, se fuerza el reinicio. Establezca `deferralTimeoutMs: 0` para esperar indefinidamente (con advertencias periódicas de que continúa pendiente) en lugar de forzarlo. `--safe` no puede combinarse con `--force` ni `--wait`.

`--skip-deferral` omite la comprobación de aplazamiento por trabajo activo en un reinicio seguro, por lo que el Gateway se reinicia inmediatamente incluso si se notifican bloqueos. Requiere `--safe`; úselo cuando un aplazamiento quede bloqueado por una tarea fuera de control.

`--wait <duration>` sustituye el tiempo disponible para el vaciado en un reinicio normal (no seguro). Acepta milisegundos sin unidad o los sufijos de unidad `ms`, `s`, `m`, `h`, `d` (por ejemplo, `30s`, `5m`, `1h30m`); `--wait 0` espera indefinidamente. No es compatible con `--force` ni `--safe`.

`--force` omite el vaciado del trabajo activo y reinicia inmediatamente. `restart` normal (sin indicadores) mantiene el comportamiento de reinicio existente del gestor de servicios.

<Warning>
El valor `--password` insertado directamente puede quedar expuesto en los listados de procesos locales. Es preferible usar `--password-file`, el entorno o un `gateway.auth.password` respaldado por SecretRef.
</Warning>

### Perfilado del Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` registra los tiempos de las fases durante el inicio, incluidos el retraso `eventLoopMax` por fase y los tiempos de las tablas de consulta de plugins (índice instalado, registro de manifiestos, planificación del inicio y procesamiento del mapa de propietarios).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` registra líneas `restart trace:` correspondientes al reinicio: gestión de señales, vaciado del trabajo activo, fases de cierre, siguiente inicio, tiempo hasta estar listo y métricas de memoria.
- `OPENCLAW_DIAGNOSTICS=timeline` con `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` escribe, en la medida de lo posible, una cronología JSONL de diagnóstico del inicio para sistemas externos de QA (equivale a la configuración `diagnostics.flags: ["timeline"]`; la ruta sigue disponible únicamente mediante el entorno). Añada `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` para incluir muestras del bucle de eventos.
- `pnpm build` y después `pnpm test:startup:gateway -- --runs 5 --warmup 1` evalúan comparativamente el inicio del Gateway con respecto al punto de entrada integrado de la CLI: primera salida del proceso, `/healthz`, `/readyz`, tiempos de seguimiento del inicio, retraso del bucle de eventos y tiempo de las tablas de consulta de plugins.
- `pnpm build` y después `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` evalúan comparativamente el reinicio dentro del proceso en macOS o Linux (no se admite en Windows; el reinicio requiere `SIGUSR1`). Usa `SIGUSR1`, habilita ambos seguimientos en el proceso secundario y registra los siguientes `/healthz` y `/readyz`, el tiempo de inactividad, el tiempo hasta estar listo, la CPU, la RSS y las métricas de seguimiento del reinicio.
- `/healthz` indica actividad; `/readyz` indica disponibilidad operativa. Considere las líneas de seguimiento y la salida de la evaluación comparativa como una señal de atribución al propietario, no como una conclusión completa sobre el rendimiento basada en un único intervalo o muestra.

## Consultar un Gateway en ejecución

Todos los comandos de consulta usan RPC mediante WebSocket.

<Tabs>
  <Tab title="Modos de salida">
    - Valor predeterminado: legible para personas (con colores en TTY).
    - `--json`: JSON legible por máquinas (sin estilos ni indicador de progreso).
    - `--no-color` (o `NO_COLOR=1`): deshabilita ANSI y conserva el diseño legible para personas.

  </Tab>
  <Tab title="Opciones compartidas">
    - `--url <url>`: URL WebSocket del Gateway.
    - `--token <token>`: token del Gateway.
    - `--password <password>`: contraseña del Gateway.
    - `--timeout <ms>`: tiempo de espera o tiempo disponible (el valor predeterminado varía según el comando; consulte cada comando a continuación).
    - `--expect-final`: espera una respuesta «final» (llamadas de agentes).

  </Tab>
</Tabs>

<Note>
Al establecer `--url`, la CLI no recurre a las credenciales de la configuración ni del entorno. Pase `--token` o `--password` explícitamente. La ausencia de credenciales explícitas es un error.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` es una sonda de actividad: devuelve una respuesta en cuanto el servidor puede responder mediante HTTP. `/readyz` es más estricta y permanece en rojo mientras los procesos auxiliares de plugins, los canales o los hooks configurados durante el inicio siguen estabilizándose. Las respuestas detalladas locales o autenticadas de `/readyz` incluyen un bloque de diagnóstico `eventLoop` (retraso, utilización, proporción de núcleos de CPU e indicador `degraded`).

<ParamField path="--port <port>" type="number">
  Usar como destino un Gateway local de bucle invertido en este puerto. Sustituye `OPENCLAW_GATEWAY_URL` y `OPENCLAW_GATEWAY_PORT` para esta llamada.
</ParamField>

### `gateway usage-cost`

Obtener resúmenes de costes de uso de los registros de sesiones.

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
  Limitar el resumen a un id de agente configurado.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Agregar todos los agentes configurados. No puede combinarse con `--agent`.
</ParamField>

### `gateway stability`

Obtener el registro reciente de estabilidad de diagnóstico de un Gateway en ejecución.

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
  Filtrar por tipo de evento de diagnóstico, por ejemplo, `payload.large` o `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Incluir únicamente los eventos posteriores a un número de secuencia de diagnóstico.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Leer un paquete de estabilidad almacenado en lugar de llamar al Gateway en ejecución. `--bundle latest` (o simplemente `--bundle`) selecciona el paquete más reciente del directorio de estado; también se puede pasar directamente una ruta JSON de paquete.
</ParamField>
<ParamField path="--export" type="boolean">
  Escribir un archivo zip compartible con diagnósticos para soporte en lugar de imprimir los detalles de estabilidad.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ruta de salida para `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacidad y comportamiento del paquete">
    - Los registros conservan metadatos operativos: nombres de eventos, recuentos, tamaños en bytes, lecturas de memoria, estado de colas/sesiones, identificadores de aprobación, nombres de canales/plugins y resúmenes de sesiones censurados. Excluyen el texto de los chats, los cuerpos de webhooks, las salidas de herramientas, los cuerpos sin procesar de solicitudes/respuestas, los tokens, las cookies, los valores secretos, los nombres de host y los identificadores de sesión sin procesar. Establezca `diagnostics.enabled: false` para desactivar por completo el registrador.
    - Las salidas fatales del Gateway, los tiempos de espera agotados durante el apagado y los fallos de inicio tras un reinicio escriben la misma instantánea de diagnóstico en `~/.openclaw/logs/stability/openclaw-stability-*.json` cuando el registrador contiene eventos. Inspeccione el paquete más reciente con `openclaw gateway stability --bundle latest`; `--limit`, `--type` y `--since-seq` también se aplican a la salida del paquete.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Escribe un archivo zip de diagnóstico local diseñado para informes de errores. Para obtener información sobre el modelo de privacidad y el contenido del paquete, consulte [Exportación de diagnósticos](/es/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ruta del archivo zip de salida. El valor predeterminado es una exportación para soporte en el directorio de estado.
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
  Omite la búsqueda del paquete de estabilidad persistente.
</ParamField>
<ParamField path="--json" type="boolean">
  Muestra como JSON la ruta escrita, el tamaño y el manifiesto.
</ParamField>

La exportación agrupa: `manifest.json` (inventario de archivos), `summary.md` (resumen en Markdown), `diagnostics.json` (resumen de nivel superior de configuración/registros/detección/estabilidad/estado/salud), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` y `stability/latest.json` cuando existe un paquete.

Está diseñada para compartirse. Conserva detalles operativos útiles para la depuración —campos de registro seguros, nombres de subsistemas, códigos de estado, duraciones, modos configurados, puertos, identificadores de plugins/proveedores, ajustes de funciones no secretos y mensajes operativos de registro censurados— y omite o censura el texto de los chats, los cuerpos de webhooks, las salidas de herramientas, las credenciales, las cookies, los identificadores de cuentas/mensajes, el texto de prompts/instrucciones, los nombres de host y los valores secretos. Cuando un mensaje de registro parece contener texto de una carga útil de usuario/chat/herramienta (por ejemplo, "el usuario dijo", "texto del chat", "salida de la herramienta", "cuerpo del webhook"), la exportación conserva únicamente el hecho de que se omitió un mensaje y su recuento de bytes.

### `gateway status`

Muestra el servicio del Gateway (launchd/systemd/schtasks), además de una comprobación opcional de conectividad/autenticación.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Añade un destino de comprobación explícito. También se siguen comprobando el remoto configurado y localhost.
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
  Omite la comprobación de conectividad (vista exclusiva del servicio).
</ParamField>
<ParamField path="--deep" type="boolean">
  También examina los servicios del sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Eleva la comprobación de conectividad a una comprobación de lectura y finaliza con un código distinto de cero si falla. No se puede combinar con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semántica del estado">
    - Permanece disponible para diagnósticos incluso cuando falta la configuración local de la CLI o esta no es válida.
    - La salida predeterminada demuestra el estado del servicio, la conexión WebSocket y la capacidad de autenticación visible durante el protocolo de enlace, no las operaciones de lectura/escritura/administración.
    - Las comprobaciones no realizan cambios en la autenticación inicial del dispositivo: reutilizan un token de dispositivo existente en caché cuando lo hay, pero nunca crean una nueva identidad de dispositivo de la CLI ni un registro de emparejamiento de solo lectura únicamente para comprobar el estado.
    - Resuelve las SecretRefs de autenticación configuradas para autenticar la comprobación cuando es posible. Si una SecretRef obligatoria no se resuelve, `--json` informa de `rpc.authWarning` cuando falla la conectividad/autenticación de la comprobación; proporcione `--token`/`--password` explícitamente o corrija el origen del secreto. Las advertencias de autenticación sin resolver se suprimen una vez que la comprobación se realiza correctamente.
    - La salida JSON incluye `gateway.version` cuando el Gateway en ejecución lo comunica; `--require-rpc` puede recurrir a la carga útil RPC de `status.runtimeVersion` si la comprobación del protocolo de enlace no puede proporcionar metadatos de versión.
    - Utilice `--require-rpc` en scripts/automatizaciones cuando no baste con que un servicio esté escuchando y también sea necesario que el RPC con ámbito de lectura funcione correctamente.
    - `--deep` busca instalaciones adicionales de launchd/systemd/schtasks; cuando se encuentran varios servicios similares a Gateway, la salida para personas muestra sugerencias de limpieza (normalmente, ejecutar un Gateway por máquina) e informa de una transferencia de reinicio reciente del supervisor cuando corresponde.
    - `--deep` también ejecuta la validación de la configuración en modo compatible con plugins (`pluginValidation: "full"`) y muestra las advertencias de los manifiestos de plugins (por ejemplo, metadatos de configuración de canal ausentes). El valor predeterminado `gateway status` conserva la ruta rápida de solo lectura que omite la validación de plugins.
    - La salida para personas incluye la ruta resuelta del archivo de registro, además de las rutas y la validez de la configuración de la CLI frente a las del servicio, para ayudar a diagnosticar divergencias del perfil o del directorio de estado.

  </Accordion>
  <Accordion title="Comprobaciones de divergencia de autenticación de systemd en Linux">
    - Las comprobaciones de divergencia de autenticación del servicio leen tanto `Environment=` como `EnvironmentFile=` de la unidad (incluidos `%h`, las rutas entre comillas, varios archivos y los archivos opcionales `-`).
    - Resuelve las SecretRefs de `gateway.auth.token` mediante el entorno de ejecución combinado (primero el entorno del comando del servicio y después, como alternativa, el entorno del proceso).
    - Las comprobaciones de divergencia de tokens omiten la resolución del token de configuración cuando la autenticación mediante token no está activa de forma efectiva (`gateway.auth.mode` establecido explícitamente en `password`/`none`/`trusted-proxy`, o el modo no está establecido cuando puede prevalecer la contraseña y ningún token candidato puede prevalecer).

  </Accordion>
</AccordionGroup>

### `gateway probe`

El comando para «depurarlo todo». Siempre comprueba:

- el Gateway remoto configurado (si se estableció), y
- localhost (bucle invertido), **aunque haya un remoto configurado**.

Al proporcionar `--url`, se añade ese destino explícito delante de ambos. La salida para personas etiqueta los destinos como `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)` y `Local loopback`.

<Note>
Si se puede acceder a varios destinos de comprobación, se muestran todos. Un túnel SSH, una URL TLS/proxy y una URL remota configurada pueden apuntar al mismo Gateway incluso con distintos puertos de transporte; `multiple_gateways` se reserva para Gateways accesibles que son distintos o cuya identidad es ambigua. Se admite la ejecución de varios Gateways para perfiles aislados (por ejemplo, un bot de rescate), pero la mayoría de las instalaciones ejecutan un solo Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Utiliza este puerto para el destino de comprobación del bucle invertido local y el puerto remoto del túnel SSH. Sin `--url`, selecciona únicamente el destino de bucle invertido local en lugar de la URL del entorno del Gateway configurado, el puerto del entorno o los destinos remotos.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretación">
    - `Reachable: yes` significa que al menos un destino aceptó una conexión WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` informa de lo que la comprobación pudo demostrar sobre la autenticación, independientemente de la accesibilidad.
    - `Read probe: ok` significa que las llamadas RPC de detalles con ámbito de lectura (`health`/`status`/`system-presence`/`config.get`) también se realizaron correctamente.
    - `Read probe: limited - missing scope: operator.read` significa que la conexión se realizó correctamente, pero el RPC con ámbito de lectura es limitado. Se informa como accesibilidad **degradada**, no como fallo total.
    - `Read probe: failed` después de `Connect: ok` significa que el WebSocket se conectó, pero los diagnósticos de lectura posteriores agotaron el tiempo de espera o fallaron; también se considera **degradado**, no inaccesible.
    - Al igual que `gateway status`, la comprobación reutiliza la autenticación de dispositivo existente en caché, pero no crea una identidad de dispositivo inicial ni un estado de emparejamiento.
    - El código de salida solo es distinto de cero cuando ninguno de los destinos comprobados es accesible.

  </Accordion>
  <Accordion title="Salida JSON">
    Nivel superior:

    - `ok`: al menos un destino es accesible.
    - `degraded`: al menos un destino aceptó una conexión, pero no completó todos los diagnósticos RPC detallados.
    - `capability`: mejor capacidad observada entre los destinos accesibles (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: mejor destino que se debe tratar como el ganador activo, en este orden: URL explícita, túnel SSH, remoto configurado, bucle invertido local.
    - `warnings[]`: registros de advertencias según el mejor esfuerzo con `code`, `message` y `targetIds` opcional.
    - `network`: sugerencias de URL de bucle invertido local/tailnet derivadas de la configuración actual y de la red del host.
    - `discovery.timeoutMs` / `discovery.count`: el presupuesto de detección y el número de resultados reales utilizados para esta ejecución de la comprobación.

    Por destino (`targets[].connect`): `ok` (accesibilidad y clasificación degradada), `rpcOk` (éxito completo del RPC detallado), `scopeLimited` (el RPC detallado falló porque faltaba el ámbito de operador).

    Por destino (`targets[].auth`): `role` y `scopes` se incluyen en `hello-ok` cuando están disponibles, además de la clasificación `capability` mostrada.

  </Accordion>
  <Accordion title="Códigos de advertencia habituales">
    - `ssh_tunnel_failed`: falló la configuración del túnel SSH; el comando recurrió a comprobaciones directas.
    - `multiple_gateways`: se podía acceder a identidades de Gateway distintas o OpenClaw no pudo demostrar que los destinos accesibles fueran el mismo Gateway. Un túnel SSH, una URL de proxy o una URL remota configurada que apunten al mismo Gateway no activan esta advertencia.
    - `auth_secretref_unresolved`: no se pudo resolver una SecretRef de autenticación configurada para un destino cuya comprobación falló.
    - `probe_scope_limited`: la conexión WebSocket se realizó correctamente, pero la comprobación de lectura quedó limitada porque faltaba `operator.read`.
    - `local_tls_runtime_unavailable`: TLS está habilitado en el Gateway local, pero OpenClaw no pudo cargar la huella digital del certificado local.

  </Accordion>
</AccordionGroup>

#### Remoto mediante SSH (equivalencia con la aplicación para Mac)

El modo "Remote over SSH" de la aplicación para macOS utiliza un reenvío de puerto local para que se pueda acceder en `ws://127.0.0.1:<port>` a un Gateway remoto restringido al bucle invertido.

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
  Selecciona el primer host del Gateway detectado como destino SSH desde el punto de conexión de detección resuelto (`local.` más el dominio de área extensa configurado, si existe). Se ignoran las sugerencias basadas únicamente en TXT.
</ParamField>

Valores predeterminados de configuración (opcionales): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`.

### `gateway call <method>`

Asistente de RPC de bajo nivel.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Cadena de objeto JSON para los parámetros.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL de WebSocket del Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token del Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  Contraseña del Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Tiempo máximo disponible.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Principalmente para RPC de estilo agente que transmiten eventos intermedios antes de una carga útil final.
</ParamField>
<ParamField path="--json" type="boolean">
  Salida JSON legible por máquina.
</ParamField>

<Note>
`--params` debe ser JSON válido, y cada método valida su propia estructura de parámetros (se rechazan los campos adicionales o con nombres incorrectos).
</Note>

## Gestionar el servicio Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Instalar con un contenedor

Use `--wrapper` cuando el servicio gestionado deba iniciarse mediante otro ejecutable, por ejemplo, un adaptador de un gestor de secretos o una utilidad de ejecución como otro usuario. El contenedor recibe los argumentos normales del Gateway y es responsable de ejecutar finalmente `openclaw` o Node con esos argumentos.

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

También se puede configurar el contenedor mediante el entorno. `gateway install` valida que la ruta corresponda a un archivo ejecutable, escribe el contenedor en el `ProgramArguments` del servicio y conserva `OPENCLAW_WRAPPER` en el entorno del servicio para posteriores reinstalaciones forzadas, actualizaciones y reparaciones de doctor.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Para eliminar un contenedor conservado, borre `OPENCLAW_WRAPPER` durante la reinstalación:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Opciones del comando">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node>` (valor predeterminado: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Comportamiento del ciclo de vida">
    - Use `gateway restart` para reiniciar un servicio administrado. No encadene `gateway stop` y `gateway start` como sustituto de un reinicio.
    - En macOS, `gateway stop` usa `launchctl bootout` de forma predeterminada, lo que elimina el LaunchAgent de la sesión de arranque actual sin conservar una desactivación; la recuperación automática de KeepAlive permanece activa para futuros fallos y `gateway start` vuelve a habilitarlo correctamente sin necesidad de ejecutar manualmente `launchctl enable`. Pase `--disable` para suprimir de forma persistente KeepAlive y RunAtLoad, de modo que el Gateway no vuelva a iniciarse hasta el siguiente `gateway start` explícito; use esta opción cuando una detención manual deba mantenerse tras los reinicios.
    - Los comandos del ciclo de vida aceptan `--json` para su uso en scripts.

  </Accordion>
  <Accordion title="Autenticación y SecretRefs durante la instalación">
    - Cuando la autenticación mediante token requiere un token y `gateway.auth.token` está administrado mediante SecretRef, `gateway install` valida que SecretRef se pueda resolver, pero no conserva el token resuelto en los metadatos del entorno del servicio.
    - Si la autenticación mediante token requiere un token y no se puede resolver el SecretRef del token configurado, la instalación se bloquea de forma segura en lugar de conservar texto sin formato como alternativa.
    - Para la autenticación mediante contraseña en `gateway run`, se recomienda usar `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o `gateway.auth.password` respaldado por SecretRef en lugar de `--password` insertado directamente.
    - En el modo de autenticación inferido, `OPENCLAW_GATEWAY_PASSWORD` disponible solo en el shell no flexibiliza los requisitos de token de la instalación; al instalar un servicio administrado, use una configuración persistente (`gateway.auth.password` o `env` en la configuración).
    - Si se configuran tanto `gateway.auth.token` como `gateway.auth.password` y `gateway.auth.mode` no está establecido, la instalación se bloquea hasta que el modo se establezca explícitamente.

  </Accordion>
</AccordionGroup>

## Descubrir gateways (Bonjour)

`gateway discover` busca señales de Gateway (`_openclaw-gw._tcp`).

- DNS-SD de multidifusión: `local.`
- DNS-SD de unidifusión (Bonjour de área amplia): elija un dominio (por ejemplo: `openclaw.internal.`) y configure DNS dividido y un servidor DNS; consulte [Bonjour](/es/gateway/bonjour).

Solo los gateways que tienen habilitado el descubrimiento mediante Bonjour (valor predeterminado) anuncian la señal.

Indicaciones TXT en cada señal: `role` (indicación del rol del Gateway), `transport` (indicación del transporte, p. ej., `gateway`), `gatewayPort` (puerto WebSocket, normalmente `18789`), `tailnetDns` (nombre de host de MagicDNS, cuando está disponible), `gatewayTls` / `gatewayTlsSha256` (TLS habilitado y huella digital del certificado). `sshPort` y `cliPath` solo se publican en el modo de descubrimiento completo (`discovery.mdns.mode: "full"`; el valor predeterminado es `"minimal"`, que los omite; en ese caso, los clientes usan de forma predeterminada el puerto `22` para los destinos SSH).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Tiempo de espera por comando (exploración/resolución).
</ParamField>
<ParamField path="--json" type="boolean">
  Salida legible por máquina (también deshabilita los estilos y el indicador de progreso).
</ParamField>

Ejemplos:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- Busca en `local.` y en el dominio de área amplia configurado cuando hay uno habilitado.
- `wsUrl` en la salida JSON se obtiene del punto de conexión del servicio resuelto, no de indicaciones presentes únicamente en TXT, como `lanHost` o `tailnetDns`.
- `discovery.mdns.mode` controla la publicación de `sshPort`/`cliPath` tanto en mDNS de `local.` como en DNS-SD de área amplia (consulte la información anterior).

</Note>

## Temas relacionados

- [Referencia de la CLI](/es/cli)
- [Guía operativa del Gateway](/es/gateway)
