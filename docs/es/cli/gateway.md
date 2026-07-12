---
read_when:
    - Ejecutar el Gateway desde la CLI (desarrollo o servidores)
    - Depuración de la autenticación, los modos de enlace y la conectividad del Gateway
    - Descubrimiento de gateways mediante Bonjour (DNS-SD local y de área amplia)
sidebarTitle: Gateway
summary: CLI de Gateway de OpenClaw (`openclaw gateway`) — ejecuta, consulta y descubre gateways
title: Gateway
x-i18n:
    generated_at: "2026-07-11T22:59:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75f8f4bebe585b213f486f08bf20015aeb89ca4d179f6d96c1008ec9d1cd00ea
    source_path: cli/gateway.md
    workflow: 16
---

El Gateway es el servidor WebSocket de OpenClaw (canales, nodos, sesiones y hooks). Todos los subcomandos siguientes se encuentran bajo `openclaw gateway ...`.

<CardGroup cols={3}>
  <Card title="Descubrimiento mediante Bonjour" href="/es/gateway/bonjour">
    Configuración de mDNS local y DNS-SD de área amplia.
  </Card>
  <Card title="Descripción general del descubrimiento" href="/es/gateway/discovery">
    Cómo OpenClaw anuncia y encuentra gateways.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration">
    Claves de configuración de nivel superior del Gateway.
  </Card>
</CardGroup>

## Ejecutar el Gateway

```bash
openclaw gateway
openclaw gateway run   # forma explícita equivalente
```

<AccordionGroup>
  <Accordion title="Comportamiento al iniciar">
    - Se niega a iniciarse a menos que `gateway.mode=local` esté configurado en `~/.openclaw/openclaw.json`. Use `--allow-unconfigured` para ejecuciones ad hoc o de desarrollo; omite la protección sin escribir ni reparar la configuración.
    - `openclaw onboard --mode local` y `openclaw setup` escriben `gateway.mode=local`. Si el archivo de configuración existe, pero falta `gateway.mode`, se considera que la configuración está dañada o sobrescrita, y el Gateway se niega a suponer `local` por usted: vuelva a ejecutar la incorporación, establezca la clave manualmente o pase `--allow-unconfigured`.
    - Se bloquea la vinculación más allá de loopback sin autenticación.
    - Actualmente, los valores `lan`, `tailnet` y `custom` de `--bind` se resuelven únicamente mediante rutas IPv4; las configuraciones con host propio que solo admiten IPv6 necesitan una instancia auxiliar IPv4 o un proxy delante del Gateway.
    - `SIGUSR1` desencadena un reinicio dentro del proceso cuando está autorizado. `commands.restart` (valor predeterminado: habilitado) controla los `SIGUSR1` enviados externamente; establézcalo en `false` para bloquear los reinicios manuales mediante señales del sistema operativo sin impedir el reinicio mediante el comando `gateway restart`, la herramienta del Gateway y la aplicación o actualización de la configuración.
    - `SIGINT`/`SIGTERM` detienen el proceso, pero no restauran el estado personalizado de la terminal; si envuelve la CLI en una TUI o en una entrada de modo sin procesar, restaure usted mismo la terminal antes de salir.

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
  Restablecer la configuración serve/funnel de Tailscale al cerrarse.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Iniciar sin exigir `gateway.mode=local`. Solo para el arranque ad hoc o de desarrollo; no conserva ni repara la configuración.
</ParamField>
<ParamField path="--dev" type="boolean">
  Crear una configuración y un espacio de trabajo de desarrollo si faltan (omite `BOOTSTRAP.md`).
</ParamField>
<ParamField path="--reset" type="boolean">
  Restablecer la configuración de desarrollo, las credenciales, las sesiones y el espacio de trabajo. Requiere `--dev`.
</ParamField>
<ParamField path="--force" type="boolean">
  Finalizar cualquier proceso que ya esté escuchando en el puerto de destino antes de iniciar.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Registro detallado en stdout/stderr.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Mostrar únicamente los registros del backend de la CLI en la consola (también habilita stdout/stderr).
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  Estilo del registro de WebSocket: `auto`, `full`, `compact`.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias de `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Registrar en JSONL los eventos sin procesar del flujo del modelo.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ruta del archivo JSONL del flujo sin procesar.
</ParamField>

`--claude-cli-logs` es un alias obsoleto de `--cli-backend-logs`.

Para `--bind custom`, establezca `gateway.customBindHost` en una dirección IPv4. Cualquier dirección distinta de `127.0.0.1` o `0.0.0.0` también requiere `127.0.0.1` en el mismo puerto para los clientes del mismo host; el inicio falla si alguno de los procesos de escucha no puede vincularse. El comodín `0.0.0.0` no añade un alias obligatorio independiente. Las configuraciones con host propio que solo admiten IPv6 necesitan una instancia auxiliar IPv4 o un proxy delante del Gateway.

## Reiniciar el Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` solicita al Gateway en ejecución que compruebe previamente el trabajo activo y programe un único reinicio consolidado una vez que dicho trabajo haya finalizado. La espera está limitada por `gateway.reload.deferralTimeoutMs` (valor predeterminado: 5 minutos/`300000`); cuando se agota el límite, se fuerza el reinicio. Establezca `deferralTimeoutMs: 0` para esperar indefinidamente (con advertencias periódicas de que sigue pendiente) en lugar de forzarlo. `--safe` no puede combinarse con `--force` ni `--wait`.

`--skip-deferral` omite la protección de aplazamiento por trabajo activo en un reinicio seguro, por lo que el Gateway se reinicia inmediatamente incluso si se han informado bloqueos. Requiere `--safe`; úselo cuando un aplazamiento esté bloqueado por una tarea descontrolada.

`--wait <duration>` reemplaza el límite de espera para que el trabajo termine en un reinicio normal (no seguro). Acepta milisegundos sin unidad o los sufijos de unidad `ms`, `s`, `m`, `h`, `d` (por ejemplo, `30s`, `5m`, `1h30m`); `--wait 0` espera indefinidamente. No es compatible con `--force` ni `--safe`.

`--force` omite la espera a que termine el trabajo activo y reinicia inmediatamente. `restart` sin opciones mantiene el comportamiento de reinicio existente del administrador de servicios.

<Warning>
La contraseña proporcionada directamente mediante `--password` puede quedar expuesta en los listados de procesos locales. Prefiera `--password-file`, una variable de entorno o un `gateway.auth.password` respaldado por SecretRef.
</Warning>

### Generación de perfiles del Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` registra los tiempos de las fases durante el inicio, incluido el retraso `eventLoopMax` de cada fase y los tiempos de las tablas de búsqueda de plugins (índice de instalaciones, registro de manifiestos, planificación del inicio y procesamiento del mapa de propietarios).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` registra líneas `restart trace:` correspondientes al reinicio: gestión de señales, espera a que termine el trabajo activo, fases de cierre, siguiente inicio, tiempo hasta estar listo y métricas de memoria.
- `OPENCLAW_DIAGNOSTICS=timeline` junto con `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` escribe, según las posibilidades, una cronología de diagnóstico de inicio en formato JSONL para sistemas externos de control de calidad (equivale a la configuración `diagnostics.flags: ["timeline"]`; la ruta sigue estando disponible solo mediante una variable de entorno). Añada `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` para incluir muestras del bucle de eventos.
- Ejecute `pnpm build` y, después, `pnpm test:startup:gateway -- --runs 5 --warmup 1` para evaluar el rendimiento del inicio del Gateway mediante el punto de entrada compilado de la CLI: primera salida del proceso, `/healthz`, `/readyz`, tiempos de seguimiento del inicio, retraso del bucle de eventos y tiempo de las tablas de búsqueda de plugins.
- Ejecute `pnpm build` y, después, `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` para evaluar el rendimiento del reinicio dentro del proceso en macOS o Linux (no compatible con Windows; el reinicio requiere `SIGUSR1`). Usa `SIGUSR1`, habilita ambos seguimientos en el proceso secundario y registra los siguientes `/healthz` y `/readyz`, el tiempo de inactividad, el tiempo hasta estar listo, la CPU, la RSS y las métricas de seguimiento del reinicio.
- `/healthz` indica actividad; `/readyz` indica disponibilidad para el uso. Considere las líneas de seguimiento y la salida de la evaluación de rendimiento como indicios para atribuir la responsabilidad, no como una conclusión completa sobre el rendimiento basada en un único intervalo o muestra.

## Consultar un Gateway en ejecución

Todos los comandos de consulta usan RPC mediante WebSocket.

<Tabs>
  <Tab title="Modos de salida">
    - Predeterminado: formato legible para personas (con colores en una TTY).
    - `--json`: JSON legible por máquinas (sin estilos ni indicador de progreso).
    - `--no-color` (o `NO_COLOR=1`): deshabilita ANSI y conserva el formato para personas.

  </Tab>
  <Tab title="Opciones compartidas">
    - `--url <url>`: URL de WebSocket del Gateway.
    - `--token <token>`: token del Gateway.
    - `--password <password>`: contraseña del Gateway.
    - `--timeout <ms>`: tiempo de espera o límite (el valor predeterminado varía según el comando; consulte cada comando más adelante).
    - `--expect-final`: esperar una respuesta `"final"` (llamadas del agente).

  </Tab>
</Tabs>

<Note>
Cuando establece `--url`, la CLI no recurre a las credenciales de la configuración ni del entorno. Pase `--token` o `--password` explícitamente. La ausencia de credenciales explícitas es un error.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` es una sonda de actividad: responde en cuanto el servidor puede contestar mediante HTTP. `/readyz` es más estricto y permanece en rojo mientras las instancias auxiliares de plugins iniciadas durante el arranque, los canales o los hooks configurados todavía se están estabilizando. Las respuestas detalladas locales o autenticadas de `/readyz` incluyen un bloque de diagnóstico `eventLoop` (retraso, utilización, proporción de núcleos de CPU e indicador `degraded`).

<ParamField path="--port <port>" type="number">
  Apuntar a un Gateway de local loopback en este puerto. Reemplaza `OPENCLAW_GATEWAY_URL` y `OPENCLAW_GATEWAY_PORT` para esta llamada.
</ParamField>

### `gateway usage-cost`

Obtener resúmenes de costes de uso de los registros de sesión.

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
  Limitar el resumen a un identificador de agente configurado.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Agregar los datos de todos los agentes configurados. No puede combinarse con `--agent`.
</ParamField>

### `gateway stability`

Obtener del Gateway en ejecución el registro reciente de estabilidad de diagnóstico.

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
  Leer un paquete de estabilidad conservado en lugar de llamar al Gateway en ejecución. `--bundle latest` (o simplemente `--bundle`) selecciona el paquete más reciente del directorio de estado; también puede pasar directamente la ruta de un paquete JSON.
</ParamField>
<ParamField path="--export" type="boolean">
  Escribir un archivo ZIP compartible con diagnósticos de soporte en lugar de imprimir los detalles de estabilidad.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ruta de salida para `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacidad y comportamiento de los paquetes">
    - Los registros conservan metadatos operativos: nombres de eventos, recuentos, tamaños en bytes, lecturas de memoria, estado de colas y sesiones, identificadores de aprobaciones, nombres de canales y plugins, y resúmenes de sesión censurados. Excluyen el texto de los chats, los cuerpos de webhooks, las salidas de herramientas, los cuerpos sin procesar de solicitudes y respuestas, los tokens, las cookies, los valores secretos, los nombres de host y los identificadores de sesión sin procesar. Establezca `diagnostics.enabled: false` para deshabilitar completamente el registro.
    - Las salidas fatales del Gateway, los tiempos de espera agotados durante el cierre y los fallos de inicio tras un reinicio escriben la misma instantánea de diagnóstico en `~/.openclaw/logs/stability/openclaw-stability-*.json` cuando el registro contiene eventos. Examine el paquete más reciente con `openclaw gateway stability --bundle latest`; `--limit`, `--type` y `--since-seq` también se aplican a la salida del paquete.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Escribir un archivo ZIP local de diagnósticos diseñado para informes de errores. Para consultar el modelo de privacidad y el contenido del paquete, consulte [Exportación de diagnósticos](/es/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ruta del archivo zip de salida. De forma predeterminada, se crea una exportación para soporte en el directorio de estado.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Número máximo de líneas de registro depuradas que se incluirán.
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
  Tiempo de espera de la instantánea de estado.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Omite la búsqueda del paquete de estabilidad persistente.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprime como JSON la ruta escrita, el tamaño y el manifiesto.
</ParamField>

La exportación agrupa: `manifest.json` (inventario de archivos), `summary.md` (resumen en Markdown), `diagnostics.json` (resumen de nivel superior de configuración, registros, detección, estabilidad y estado), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` y `stability/latest.json` cuando existe un paquete.

Está diseñada para compartirse. Conserva los detalles operativos útiles para la depuración —campos de registro seguros, nombres de subsistemas, códigos de estado, duraciones, modos configurados, puertos, identificadores de plugins/proveedores, ajustes de funciones que no contienen secretos y mensajes operativos de registro censurados— y omite o censura el texto de chats, los cuerpos de webhooks, las salidas de herramientas, las credenciales, las cookies, los identificadores de cuentas/mensajes, el texto de prompts/instrucciones, los nombres de host y los valores secretos. Cuando un mensaje de registro parece contener texto de una carga útil de usuario, chat o herramienta (p. ej., «el usuario dijo», «texto del chat», «salida de la herramienta», «cuerpo del webhook»), la exportación solo conserva el hecho de que se omitió un mensaje y su cantidad de bytes.

### `gateway status`

Muestra el servicio Gateway (launchd/systemd/schtasks), además de una prueba opcional de conectividad/autenticación.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Añade un destino de prueba explícito. También se siguen probando el remoto configurado y localhost.
</ParamField>
<ParamField path="--token <token>" type="string">
  Autenticación mediante token para la prueba.
</ParamField>
<ParamField path="--password <password>" type="string">
  Autenticación mediante contraseña para la prueba.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Tiempo de espera de la prueba.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Omite la prueba de conectividad (vista exclusiva del servicio).
</ParamField>
<ParamField path="--deep" type="boolean">
  Examina también los servicios del sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Amplía la prueba de conectividad con una prueba de lectura y finaliza con un código distinto de cero si falla. No se puede combinar con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semántica del estado">
    - Permanece disponible para realizar diagnósticos incluso si falta la configuración local de la CLI o no es válida.
    - La salida predeterminada demuestra el estado del servicio, la conexión WebSocket y la capacidad de autenticación visible durante el protocolo de enlace, no las operaciones de lectura, escritura o administración.
    - Las pruebas no realizan cambios en la autenticación inicial del dispositivo: reutilizan un token de dispositivo existente en caché cuando lo hay, pero nunca crean una nueva identidad de dispositivo para la CLI ni un registro de vinculación de solo lectura únicamente para comprobar el estado.
    - Resuelve las SecretRefs de autenticación configuradas para autenticar la prueba cuando es posible. Si una SecretRef obligatoria no se resuelve, `--json` informa de `rpc.authWarning` cuando falla la conectividad o autenticación de la prueba; pasa `--token`/`--password` explícitamente o corrige el origen del secreto. Las advertencias de autenticación sin resolver se suprimen cuando la prueba tiene éxito.
    - La salida JSON incluye `gateway.version` cuando el Gateway en ejecución la informa; `--require-rpc` puede recurrir a la carga útil RPC `status.runtimeVersion` si la prueba del protocolo de enlace no puede proporcionar metadatos de la versión.
    - Usa `--require-rpc` en scripts/automatizaciones cuando no baste con que el servicio esté escuchando y también necesites que RPC con alcance de lectura funcione correctamente.
    - `--deep` busca instalaciones adicionales de launchd/systemd/schtasks; cuando se encuentran varios servicios similares al Gateway, la salida para personas muestra sugerencias de limpieza (normalmente, ejecutar un Gateway por máquina) e informa de una transferencia de reinicio reciente del supervisor cuando corresponde.
    - `--deep` también ejecuta la validación de la configuración en modo compatible con plugins (`pluginValidation: "full"`) y muestra las advertencias del manifiesto de plugins (p. ej., si faltan metadatos de configuración del canal). El comando `gateway status` predeterminado mantiene la ruta rápida de solo lectura que omite la validación de plugins.
    - La salida para personas incluye la ruta resuelta del archivo de registro, además de las rutas y la validez de la configuración de la CLI y del servicio, para ayudar a diagnosticar divergencias del perfil o del directorio de estado.

  </Accordion>
  <Accordion title="Comprobaciones de divergencia de autenticación de systemd en Linux">
    - Las comprobaciones de divergencia de autenticación del servicio leen tanto `Environment=` como `EnvironmentFile=` de la unidad (incluidos `%h`, rutas entre comillas, varios archivos y archivos opcionales con `-`).
    - Resuelve las SecretRefs de `gateway.auth.token` mediante el entorno combinado del runtime (primero el entorno del comando del servicio y después el entorno del proceso como alternativa).
    - Las comprobaciones de divergencia del token omiten la resolución del token de configuración cuando la autenticación mediante token no está activa de forma efectiva (`gateway.auth.mode` establecido explícitamente en `password`/`none`/`trusted-proxy`, o el modo sin establecer cuando la contraseña puede prevalecer y ningún token candidato puede hacerlo).

  </Accordion>
</AccordionGroup>

### `gateway probe`

El comando para «depurarlo todo». Siempre prueba:

- el gateway remoto configurado (si está definido), y
- localhost (local loopback), **aunque haya un remoto configurado**.

Pasar `--url` añade ese destino explícito antes que los otros dos. La salida para personas etiqueta los destinos como `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)` y `Local loopback`.

<Note>
Si se puede acceder a varios destinos de prueba, se muestran todos. Un túnel SSH, una URL TLS/proxy y una URL remota configurada pueden apuntar al mismo gateway incluso con puertos de transporte distintos; `multiple_gateways` se reserva para gateways accesibles distintos o cuya identidad sea ambigua. Se admite la ejecución de varios gateways para perfiles aislados (p. ej., un bot de rescate), pero la mayoría de las instalaciones ejecutan un solo gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Usa este puerto para el destino local loopback de la prueba y el puerto remoto del túnel SSH. Sin `--url`, selecciona únicamente el destino local loopback en lugar de la URL del entorno del Gateway configurado, el puerto del entorno o los destinos remotos.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretación">
    - `Reachable: yes` significa que al menos un destino aceptó una conexión WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` indica lo que la prueba pudo demostrar sobre la autenticación, independientemente de la accesibilidad.
    - `Read probe: ok` significa que también se completaron correctamente las llamadas RPC detalladas con alcance de lectura (`health`/`status`/`system-presence`/`config.get`).
    - `Read probe: limited - missing scope: operator.read` significa que la conexión se realizó correctamente, pero RPC con alcance de lectura está limitado. Se informa como accesibilidad **degradada**, no como un fallo total.
    - `Read probe: failed` después de `Connect: ok` significa que el WebSocket se conectó, pero los diagnósticos de lectura posteriores agotaron el tiempo de espera o fallaron; también se considera un estado **degradado**, no inaccesible.
    - Al igual que `gateway status`, la prueba reutiliza la autenticación de dispositivo existente en caché, pero no crea una identidad de dispositivo inicial ni un estado de vinculación.
    - El código de salida solo es distinto de cero cuando no se puede acceder a ninguno de los destinos probados.

  </Accordion>
  <Accordion title="Salida JSON">
    Nivel superior:

    - `ok`: se puede acceder al menos a un destino.
    - `degraded`: al menos un destino aceptó una conexión, pero no completó todos los diagnósticos RPC detallados.
    - `capability`: mejor capacidad observada entre los destinos accesibles (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: mejor destino que se debe considerar como el activo, en este orden: URL explícita, túnel SSH, remoto configurado, local loopback.
    - `warnings[]`: registros de advertencia según el mejor esfuerzo, con `code`, `message` y `targetIds` opcional.
    - `network`: sugerencias de URL de local loopback/tailnet derivadas de la configuración actual y de la red del host.
    - `discovery.timeoutMs` / `discovery.count`: presupuesto real de detección y cantidad de resultados usados para esta ejecución de la prueba.

    Por destino (`targets[].connect`): `ok` (clasificación de accesibilidad y degradación), `rpcOk` (éxito completo del RPC detallado), `scopeLimited` (el RPC detallado falló por falta de alcance del operador).

    Por destino (`targets[].auth`): `role` y `scopes` informados en `hello-ok` cuando están disponibles, además de la clasificación `capability` mostrada.

  </Accordion>
  <Accordion title="Códigos de advertencia habituales">
    - `ssh_tunnel_failed`: no se pudo configurar el túnel SSH; el comando recurrió a pruebas directas.
    - `multiple_gateways`: se pudo acceder a identidades de gateway distintas o OpenClaw no pudo demostrar que los destinos accesibles correspondían al mismo gateway. Un túnel SSH, una URL de proxy o una URL remota configurada que apunten al mismo gateway no activan esta advertencia.
    - `auth_secretref_unresolved`: no se pudo resolver una SecretRef de autenticación configurada para un destino fallido.
    - `probe_scope_limited`: la conexión WebSocket se realizó correctamente, pero la prueba de lectura quedó limitada porque faltaba `operator.read`.
    - `local_tls_runtime_unavailable`: TLS está activado en el Gateway local, pero OpenClaw no pudo cargar la huella digital del certificado local.

  </Accordion>
</AccordionGroup>

#### Acceso remoto mediante SSH (equivalencia con la aplicación para Mac)

El modo "Remote over SSH" de la aplicación para macOS usa un reenvío de puerto local para que un gateway remoto limitado a loopback sea accesible en `ws://127.0.0.1:<port>`.

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
  Selecciona el primer host de Gateway detectado como destino SSH a partir del endpoint de detección resuelto (`local.` más el dominio de área amplia configurado, si existe). Se ignoran las sugerencias que solo contienen TXT.
</ParamField>

Valores predeterminados de configuración (opcionales): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`.

### `gateway call <method>`

Herramienta auxiliar RPC de bajo nivel.

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
  Presupuesto de tiempo de espera.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Principalmente para RPC de estilo agente que transmiten eventos intermedios antes de una carga útil final.
</ParamField>
<ParamField path="--json" type="boolean">
  Salida JSON legible por máquinas.
</ParamField>

<Note>
`--params` debe ser JSON válido y cada método valida la estructura de sus propios parámetros (se rechazan los campos adicionales o con nombres incorrectos).
</Note>

## Administrar el servicio Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Instalar con un wrapper

Usa `--wrapper` cuando el servicio administrado deba iniciarse mediante otro ejecutable, por ejemplo, un adaptador de un gestor de secretos o una herramienta auxiliar para ejecutarlo como otro usuario. El wrapper recibe los argumentos normales del Gateway y es responsable de ejecutar finalmente `openclaw` o Node con esos argumentos.

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

También puedes establecer el contenedor mediante el entorno. `gateway install` valida que la ruta sea un archivo ejecutable, escribe el contenedor en `ProgramArguments` del servicio y conserva `OPENCLAW_WRAPPER` en el entorno del servicio para posteriores reinstalaciones forzadas, actualizaciones y reparaciones de doctor.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Para eliminar un contenedor conservado, borra `OPENCLAW_WRAPPER` durante la reinstalación:

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
    - Usa `gateway restart` para reiniciar un servicio administrado. No encadenes `gateway stop` y `gateway start` como sustituto del reinicio.
    - En macOS, `gateway stop` utiliza `launchctl bootout` de forma predeterminada, lo que elimina el LaunchAgent de la sesión de arranque actual sin conservar una desactivación: la recuperación automática de KeepAlive permanece activa para futuros fallos y `gateway start` vuelve a habilitarlo correctamente sin ejecutar manualmente `launchctl enable`. Pasa `--disable` para suprimir de forma persistente KeepAlive y RunAtLoad, de modo que el Gateway no vuelva a iniciarse hasta el siguiente `gateway start` explícito; úsalo cuando una detención manual deba persistir después de reiniciar el sistema.
    - Los comandos del ciclo de vida aceptan `--json` para su uso en scripts.

  </Accordion>
  <Accordion title="Autenticación y SecretRefs durante la instalación">
    - Cuando la autenticación mediante token requiere un token y `gateway.auth.token` está administrado mediante SecretRef, `gateway install` valida que el SecretRef se pueda resolver, pero no conserva el token resuelto en los metadatos del entorno del servicio.
    - Si la autenticación mediante token requiere un token y el SecretRef del token configurado no se puede resolver, la instalación falla de forma segura en lugar de conservar un texto sin formato alternativo.
    - Para la autenticación mediante contraseña en `gateway run`, usa preferentemente `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` respaldado por SecretRef en lugar de `--password` en línea.
    - En el modo de autenticación inferido, `OPENCLAW_GATEWAY_PASSWORD` definido solo en el shell no reduce los requisitos de token de la instalación; usa una configuración persistente (`gateway.auth.password` o `env` en la configuración) al instalar un servicio administrado.
    - Si están configurados tanto `gateway.auth.token` como `gateway.auth.password` y `gateway.auth.mode` no está establecido, la instalación se bloquea hasta que el modo se establezca explícitamente.

  </Accordion>
</AccordionGroup>

## Detectar gateways (Bonjour)

`gateway discover` busca balizas de Gateway (`_openclaw-gw._tcp`).

- DNS-SD multidifusión: `local.`
- DNS-SD unidifusión (Bonjour de área extensa): elige un dominio (ejemplo: `openclaw.internal.`) y configura DNS dividido y un servidor DNS; consulta [Bonjour](/es/gateway/bonjour).

Solo los gateways que tienen habilitado el descubrimiento mediante Bonjour (valor predeterminado) anuncian la baliza.

Indicaciones TXT en cada baliza: `role` (indicación del rol del Gateway), `transport` (indicación del transporte, p. ej., `gateway`), `gatewayPort` (puerto WebSocket, normalmente `18789`), `tailnetDns` (nombre de host MagicDNS, cuando está disponible), `gatewayTls` / `gatewayTlsSha256` (TLS habilitado y huella digital del certificado). `sshPort` y `cliPath` solo se publican en el modo de descubrimiento completo (`discovery.mdns.mode: "full"`; el valor predeterminado es `"minimal"`, que los omite; en ese caso, los clientes usan de forma predeterminada el puerto `22` para los destinos SSH).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Tiempo de espera por comando (exploración/resolución).
</ParamField>
<ParamField path="--json" type="boolean">
  Salida legible por máquina (también desactiva los estilos y el indicador de carga).
</ParamField>

Ejemplos:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- Explora `local.` y el dominio de área extensa configurado cuando hay uno habilitado.
- `wsUrl` en la salida JSON se deriva del punto de conexión del servicio resuelto, no de indicaciones presentes únicamente en TXT, como `lanHost` o `tailnetDns`.
- `discovery.mdns.mode` controla la publicación de `sshPort`/`cliPath` tanto en mDNS `local.` como en DNS-SD de área extensa (consulta la información anterior).

</Note>

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Guía de operaciones del Gateway](/es/gateway)
