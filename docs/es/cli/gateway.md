---
read_when:
    - Ejecución del Gateway desde la CLI (desarrollo o servidores)
    - Depuración de la autenticación, los modos de enlace y la conectividad del Gateway
    - Detección de gateways mediante Bonjour (DNS-SD local y de área amplia)
    - Integración de un supervisor externo de procesos del Gateway
sidebarTitle: Gateway
summary: CLI de Gateway de OpenClaw (`openclaw gateway`) — ejecutar, consultar y descubrir gateways
title: Gateway
x-i18n:
    generated_at: "2026-07-20T00:45:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4de443c749806ccb7fe3e7919a319ff125130192e8814708a79b2b3a93162e7d
    source_path: cli/gateway.md
    workflow: 16
---

El Gateway es el servidor WebSocket de OpenClaw (canales, nodos, sesiones, hooks). Todos los subcomandos siguientes se encuentran bajo `openclaw gateway ...`.

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
openclaw gateway run   # forma explícita equivalente
```

<AccordionGroup>
  <Accordion title="Comportamiento al iniciar">
    - Se niega a iniciarse a menos que `gateway.mode=local` esté establecido en `~/.openclaw/openclaw.json`. Use `--allow-unconfigured` para ejecuciones ad hoc o de desarrollo; omite la protección sin escribir ni reparar la configuración.
    - Cuando al iniciar se encuentra una configuración no válida que puede repararse, un terminal interactivo ofrece ejecutar `openclaw doctor --fix` y vuelve a intentar el inicio una vez tras obtener el consentimiento. Las ejecuciones no interactivas nunca reparan automáticamente; en su lugar, muestran el comando. Si la configuración reparada sigue sin ser válida, el inicio permanece detenido.
    - `openclaw onboard --mode local` y `openclaw setup` escriben `gateway.mode=local`. Si el archivo de configuración existe, pero falta `gateway.mode`, se considera que la configuración está dañada o sobrescrita y el Gateway se niega a deducir `local` — vuelva a ejecutar la incorporación, establezca la clave manualmente o pase `--allow-unconfigured`.
    - Se bloquea la vinculación más allá de la interfaz de bucle invertido sin autenticación.
    - Actualmente, los valores `lan`, `tailnet` y `custom` de `--bind` se resuelven únicamente mediante rutas IPv4; las configuraciones con host propio que solo admiten IPv6 necesitan un proceso auxiliar IPv4 o un proxy delante del Gateway.
    - `SIGUSR1` activa un reinicio dentro del proceso cuando está autorizado. `commands.restart` (valor predeterminado: habilitado) controla los `SIGUSR1` enviados externamente; establézcalo en `false` para bloquear los reinicios manuales mediante señales del sistema operativo. La herramienta `gateway` orientada a agentes es de solo lectura; los agentes solicitan el reinicio mediante la herramienta de delegación `openclaw` aprobada por una persona.
    - `SIGINT`/`SIGTERM` detienen el proceso, pero no restauran el estado personalizado del terminal; si se encapsula la CLI en una TUI o una entrada en modo sin procesar, se debe restaurar el terminal antes de salir.

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
  Restablecer la configuración serve/funnel de Tailscale al apagarse.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Iniciar sin exigir `gateway.mode=local`. Solo para arranque ad hoc o de desarrollo; no conserva ni repara la configuración.
</ParamField>
<ParamField path="--dev" type="boolean">
  Crear una configuración y un espacio de trabajo de desarrollo si no existen (omite `BOOTSTRAP.md`).
</ParamField>
<ParamField path="--reset" type="boolean">
  Restablecer la configuración de desarrollo, las credenciales, las sesiones y el espacio de trabajo. Requiere `--dev`.
</ParamField>
<ParamField path="--force" type="boolean">
  Finalizar cualquier proceso que ya esté escuchando en el puerto de destino antes de iniciar. En un shell no interactivo, esta opción se niega a finalizar un proceso verificado del Gateway que esté escuchando; use en su lugar `--dev` o un `--profile` aislado con un puerto libre.
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
  Registrar en JSONL los eventos sin procesar del flujo del modelo.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ruta del JSONL del flujo sin procesar.
</ParamField>

`--claude-cli-logs` es un alias obsoleto de `--cli-backend-logs`.

Para `--bind custom`, establezca `gateway.customBindHost` en una dirección IPv4. Cualquier dirección distinta de `127.0.0.1` o `0.0.0.0` también requiere `127.0.0.1` en el mismo puerto para los clientes del mismo host; el inicio falla si cualquiera de los procesos de escucha no puede vincularse. El comodín `0.0.0.0` no añade un alias obligatorio independiente. Las configuraciones con host propio que solo admiten IPv6 necesitan un proceso auxiliar IPv4 o un proxy delante del Gateway.

## Reiniciar el Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` solicita al Gateway en ejecución que compruebe previamente el trabajo activo y programe un único reinicio agrupado cuando dicho trabajo termine. La espera está limitada a 5 minutos; cuando se agota el tiempo asignado, se fuerza el reinicio. `--safe` no puede combinarse con `--force` ni `--wait`.

`--skip-deferral` omite la protección de aplazamiento por trabajo activo en un reinicio seguro, por lo que el Gateway se reinicia inmediatamente incluso si se han notificado bloqueos. Requiere `--safe`; úselo cuando un aplazamiento esté bloqueado por una tarea fuera de control.

`--wait <duration>` reemplaza el tiempo asignado al vaciado para un reinicio normal (no seguro). Acepta milisegundos sin sufijo o los sufijos de unidad `ms`, `s`, `m`, `h`, `d` (por ejemplo, `30s`, `5m`, `1h30m`); `--wait 0` espera indefinidamente. No es compatible con `--force` ni `--safe`.

`--force` omite el vaciado del trabajo activo y reinicia inmediatamente. El comando `restart` normal (sin indicadores) conserva el comportamiento actual de reinicio del gestor de servicios.

<Warning>
El valor `--password` en línea puede quedar expuesto en las listas de procesos locales. Es preferible usar `--password-file`, el entorno o un `gateway.auth.password` respaldado por SecretRef.
</Warning>

### Supervisores externos

Establezca `OPENCLAW_SUPERVISOR_MODE=external` solo cuando otro gestor de procesos controle el ciclo de vida del Gateway. En este modo:

- `openclaw gateway restart` conserva el comportamiento seguro, forzado y de espera limitada existente, pero se dirige al Gateway en ejecución verificado en lugar de a launchd, systemd o el Programador de tareas.
- Las operaciones nativas de instalación, inicio, detención y desinstalación del servicio se rechazan y se indica que debe utilizarse el supervisor externo.
- La actualización automática de OpenClaw se rechaza para que el supervisor pueda detener el Gateway, sustituir y finalizar el entorno de ejecución y reiniciarlo de forma segura.
- Un reinicio mediante un proceso nuevo escribe una transferencia limitada en SQLite antes de una salida limpia. Si falla la persistencia, el Gateway recurre a un reinicio dentro del proceso en lugar de salir sin una transferencia utilizable.

`OPENCLAW_SERVICE_REPAIR_POLICY=external` sigue siendo una política de reparación independiente de Doctor. No declara la propiedad del entorno de ejecución; los supervisores que necesiten ambos comportamientos deben establecer las dos variables.

Los supervisores externos pueden negociar y consumir transferencias de reinicio mediante el contrato de máquina oculto:

```bash
openclaw gateway restart-handoff capabilities --json
openclaw gateway restart-handoff consume --expected-pid <pid> --json
```

La versión de protocolo `1` admite la operación `consume`. El consumo valida el PID esperado y los campos limitados de transferencia dentro de una única transacción SQLite inmediata. Una transferencia aceptada se elimina antes de devolver el resultado correcto, por lo que los consumidores simultáneos o repetidos no pueden aceptarla ambos. Una discrepancia de PID se conserva para el propietario correspondiente; las filas ausentes, caducadas y no válidas no autorizan un reinicio.

Las solicitudes de máquina válidas devuelven JSON con el código de salida `0`, incluidos los resultados que no implican un reinicio. Los argumentos no válidos devuelven `reason: "invalid-expected-pid"` con el código de salida `2`; los fallos del almacén de estado devuelven `reason: "store-unavailable"` con el código de salida `1`. Los supervisores deben consultar `capabilities` en el entorno de ejecución o iniciador exacto que utilizarán, en lugar de deducir la compatibilidad a partir de una cadena de versión de OpenClaw o leer directamente el esquema SQLite privado.

### Creación de perfiles del Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` registra los tiempos de las fases durante el inicio, incluidos el retraso `eventLoopMax` por fase y los tiempos de las tablas de búsqueda de plugins (índice instalado, registro de manifiestos, planificación del inicio y trabajo del mapa de propietarios).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` registra líneas `restart trace:` limitadas al reinicio: gestión de señales, vaciado del trabajo activo, fases de apagado, siguiente inicio, tiempo hasta estar listo y métricas de memoria.
- `OPENCLAW_DIAGNOSTICS=timeline` con `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` escribe, con el máximo esfuerzo posible, una cronología de diagnóstico del inicio en JSONL para bancos de pruebas externos de control de calidad (equivale a la configuración `diagnostics.flags: ["timeline"]`; la ruta sigue estando disponible solo mediante el entorno). Añada `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` para incluir muestras del bucle de eventos.
- `pnpm build` y después `pnpm test:startup:gateway -- --runs 5 --warmup 1` evalúan el rendimiento del inicio del Gateway con respecto al punto de entrada compilado de la CLI: primera salida del proceso, `/healthz`, `/readyz`, tiempos de seguimiento del inicio, retraso del bucle de eventos y tiempos de las tablas de búsqueda de plugins.
- `pnpm build` y después `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` evalúan el rendimiento del reinicio dentro del proceso en macOS o Linux (no se admite en Windows; el reinicio requiere `SIGUSR1`). Utiliza `SIGUSR1`, habilita ambos seguimientos en el proceso secundario y registra el siguiente `/healthz`, el siguiente `/readyz`, el tiempo de inactividad, el tiempo hasta estar listo, la CPU, el RSS y las métricas de seguimiento del reinicio.
- `/healthz` indica actividad; `/readyz` indica disponibilidad para el uso. Considere las líneas de seguimiento y los resultados de las evaluaciones de rendimiento como señales para atribuir la responsabilidad, no como una conclusión completa sobre el rendimiento a partir de un único intervalo o muestra.

## Consultar un Gateway en ejecución

Todos los comandos de consulta utilizan RPC mediante WebSocket.

<Tabs>
  <Tab title="Modos de salida">
    - Predeterminado: legible para personas (con colores en una TTY).
    - `--json`: JSON legible por máquinas (sin estilos ni indicador de progreso).
    - `--no-color` (o `NO_COLOR=1`): deshabilita ANSI y conserva el diseño para personas.

  </Tab>
  <Tab title="Opciones compartidas">
    - `--url <url>`: URL WebSocket del Gateway.
    - `--token <token>`: token del Gateway.
    - `--password <password>`: contraseña del Gateway.
    - `--timeout <ms>`: tiempo de espera o límite (el valor predeterminado varía según el comando; consulte cada comando a continuación).
    - `--expect-final`: espera una respuesta «final» (llamadas de agentes).

  </Tab>
</Tabs>

<Note>
Cuando se establece `--url`, la CLI no recurre a las credenciales de la configuración ni del entorno. Pase explícitamente `--token` o `--password`. La ausencia de credenciales explícitas es un error.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` es una sonda de actividad: devuelve una respuesta en cuanto el servidor puede responder mediante HTTP. `/readyz` es más estricta y permanece en rojo mientras los procesos auxiliares de plugins, los canales o los hooks configurados del inicio aún se están estabilizando. Las respuestas detalladas locales o autenticadas de `/readyz` incluyen un bloque de diagnóstico `eventLoop` (retraso, utilización, proporción de núcleos de CPU, indicador `degraded`).

<ParamField path="--port <port>" type="number">
  Apunta a un Gateway de bucle invertido local en este puerto. Para esta llamada, sustituye `OPENCLAW_GATEWAY_URL` y `OPENCLAW_GATEWAY_PORT`.
</ParamField>

### `gateway usage-cost`

Obtiene resúmenes de costes de uso de los registros de sesión.

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
  Agrega todos los agentes configurados. No se puede combinar con `--agent`.
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
  Incluye solo los eventos posteriores a un número de secuencia de diagnóstico.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lee un paquete de estabilidad persistente en lugar de llamar al Gateway en ejecución. `--bundle latest` (o simplemente `--bundle`) selecciona el paquete más reciente del directorio de estado; también se puede proporcionar directamente la ruta de un paquete JSON.
</ParamField>
<ParamField path="--export" type="boolean">
  Escribe un archivo zip de diagnósticos compartible para soporte en lugar de imprimir los detalles de estabilidad.
</ParamField>
<ParamField path="--output <path>" type="string">
  Ruta de salida para `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacidad y comportamiento de los paquetes">
    - Los registros conservan metadatos operativos: nombres de eventos, recuentos, tamaños en bytes, lecturas de memoria, estado de colas y sesiones, ids de aprobación, nombres de canales y plugins, y resúmenes de sesión censurados. Excluyen el texto del chat, los cuerpos de webhooks, las salidas de herramientas, los cuerpos sin procesar de solicitudes y respuestas, los tokens, las cookies, los valores secretos, los nombres de host y los ids de sesión sin procesar. Establezca `diagnostics.enabled: false` para desactivar por completo el registro.
    - Las salidas fatales del Gateway, los tiempos de espera agotados durante el cierre y los fallos de inicio tras un reinicio escriben la misma instantánea de diagnóstico en `~/.openclaw/logs/stability/openclaw-stability-*.json` cuando el registro contiene eventos. Inspeccione el paquete más reciente con `openclaw gateway stability --bundle latest`; `--limit`, `--type` y `--since-seq` también se aplican a la salida del paquete.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Escribe un archivo zip local de diagnósticos diseñado para informes de errores. Para consultar el modelo de privacidad y el contenido del paquete, véase [Exportación de diagnósticos](/es/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Ruta del archivo zip de salida. De forma predeterminada, se usa una exportación de soporte en el directorio de estado.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Número máximo de líneas de registro depuradas que se incluirán.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Número máximo de bytes del registro que se inspeccionarán.
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
  Omite la búsqueda del paquete de estabilidad persistente.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprime como JSON la ruta escrita, el tamaño y el manifiesto.
</ParamField>

La exportación agrupa: `manifest.json` (inventario de archivos), `summary.md` (resumen en Markdown), `diagnostics.json` (resumen de nivel superior de configuración, registros, detección, estabilidad, estado y salud), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` y `stability/latest.json` cuando existe un paquete.

Está diseñada para compartirse. Conserva detalles operativos útiles para la depuración —campos de registro seguros, nombres de subsistemas, códigos de estado, duraciones, modos configurados, puertos, ids de plugins y proveedores, ajustes de funciones no secretos y mensajes operativos de registro censurados— y omite o censura el texto del chat, los cuerpos de webhooks, las salidas de herramientas, las credenciales, las cookies, los identificadores de cuentas y mensajes, el texto de prompts e instrucciones, los nombres de host y los valores secretos. Cuando un mensaje de registro parece contener texto de carga útil del usuario, del chat o de una herramienta (por ejemplo, "el usuario dijo", "texto del chat", "salida de la herramienta" o "cuerpo del webhook"), la exportación conserva únicamente el hecho de que se omitió un mensaje y su recuento de bytes.

### `gateway status`

Muestra el servicio del Gateway (launchd/systemd/schtasks), además de una sonda opcional de conectividad y autenticación.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Añade un destino explícito para la sonda. También se siguen sondeando el destino remoto configurado y localhost.
</ParamField>
<ParamField path="--token <token>" type="string">
  Autenticación mediante token para la sonda.
</ParamField>
<ParamField path="--password <password>" type="string">
  Autenticación mediante contraseña para la sonda.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Tiempo de espera de la sonda.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Omite la sonda de conectividad (vista exclusiva del servicio).
</ParamField>
<ParamField path="--deep" type="boolean">
  Analiza también los servicios del sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Amplía la sonda de conectividad con una sonda de lectura y termina con un código distinto de cero si falla. No se puede combinar con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semántica del estado">
    - Permanece disponible para diagnósticos incluso cuando falta la configuración local de la CLI o esta no es válida.
    - La salida predeterminada demuestra el estado del servicio, la conexión WebSocket y la capacidad de autenticación visible durante el protocolo de enlace, no las operaciones de lectura, escritura o administración.
    - Las sondas no realizan cambios en la primera autenticación del dispositivo: reutilizan un token de dispositivo almacenado en caché si existe, pero nunca crean una nueva identidad de dispositivo de la CLI ni un registro de emparejamiento de solo lectura únicamente para comprobar el estado.
    - Resuelve las SecretRefs de autenticación configuradas para autenticar la sonda cuando es posible. Si una SecretRef requerida no se resuelve, `--json` informa de `rpc.authWarning` cuando falla la conectividad o la autenticación de la sonda; proporcione explícitamente `--token`/`--password` o corrija la fuente del secreto. Las advertencias de autenticación sin resolver se omiten cuando la sonda se completa correctamente.
    - La salida JSON incluye `gateway.version` cuando el Gateway en ejecución lo informa; `--require-rpc` puede recurrir a la carga útil RPC de `status.runtimeVersion` si la sonda del protocolo de enlace no puede proporcionar los metadatos de versión.
    - Use `--require-rpc` en scripts y automatizaciones cuando no baste con que el servicio esté escuchando y también se necesite que la RPC con ámbito de lectura esté operativa.
    - `--deep` busca instalaciones adicionales de launchd/systemd/schtasks; cuando se encuentran varios servicios similares a un Gateway, la salida legible muestra sugerencias de limpieza (normalmente, se debe ejecutar un Gateway por máquina) e informa de una transferencia de reinicio reciente del supervisor cuando corresponde.
    - `--deep` también ejecuta la validación de configuración en modo compatible con plugins (`pluginValidation: "full"`) y muestra advertencias del manifiesto de plugins (por ejemplo, la ausencia de metadatos de configuración de canales). El valor predeterminado `gateway status` conserva la ruta rápida de solo lectura que omite la validación de plugins.
    - La salida legible incluye la ruta resuelta del archivo de registro, además de las rutas y la validez de la configuración de la CLI y del servicio, para ayudar a diagnosticar desviaciones del perfil o del directorio de estado.
    - La salida legible incluye `Gateway heap:` con el límite aplicado y su derivación adaptativa. La salida JSON expone el mismo informe como `service.gatewayHeap`.

  </Accordion>
  <Accordion title="Comprobaciones de desviación de autenticación de systemd en Linux">
    - Las comprobaciones de desviación de la autenticación del servicio leen tanto `Environment=` como `EnvironmentFile=` de la unidad (incluidos `%h`, rutas entre comillas, varios archivos y archivos `-` opcionales).
    - Resuelve las SecretRefs de `gateway.auth.token` mediante el entorno combinado de ejecución (primero el entorno de comandos del servicio y, a continuación, el entorno del proceso como alternativa).
    - Las comprobaciones de desviación de tokens omiten la resolución del token de configuración cuando la autenticación mediante token no está activa de forma efectiva (`gateway.auth.mode` establecido explícitamente en `password`/`none`/`trusted-proxy`, o el modo sin establecer cuando la contraseña puede prevalecer y ningún token candidato puede hacerlo).

  </Accordion>
</AccordionGroup>

### `gateway probe`

El comando para «depurarlo todo». Siempre sondea:

- el Gateway remoto configurado (si se ha establecido), y
- localhost (bucle invertido), **incluso si hay un destino remoto configurado**.

Proporcionar `--url` añade ese destino explícito antes que los otros dos. La salida legible etiqueta los destinos como `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)` y `Local loopback`.

<Note>
Si se puede acceder a varios destinos de sondeo, se imprimen todos. Un túnel SSH, una URL de TLS/proxy y una URL remota configurada pueden apuntar al mismo Gateway aunque usen puertos de transporte distintos; `multiple_gateways` se reserva para Gateways accesibles distintos o cuya identidad sea ambigua. Se admite la ejecución de varios Gateways para perfiles aislados (por ejemplo, un bot de rescate), pero la mayoría de las instalaciones ejecutan un único Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Usa este puerto para el destino local de sondeo por bucle invertido y para el puerto remoto del túnel SSH. Sin `--url`, solo selecciona el destino local de bucle invertido, en lugar de la URL de entorno del Gateway configurado, el puerto del entorno o los destinos remotos.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretación">
    - `Reachable: yes` significa que al menos un destino aceptó una conexión WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` informa de lo que la sonda pudo demostrar sobre la autenticación, independientemente de la accesibilidad.
    - `Read probe: ok` significa que las llamadas RPC detalladas con ámbito de lectura (`health`/`status`/`system-presence`/`config.get`) también se completaron correctamente.
    - `Read probe: limited - missing scope: operator.read` significa que la conexión se completó correctamente, pero la RPC con ámbito de lectura está limitada. Se informa como accesibilidad **degradada**, no como un fallo total.
    - `Read probe: failed` después de `Connect: ok` significa que se estableció la conexión WebSocket, pero los diagnósticos de lectura posteriores agotaron el tiempo de espera o fallaron; también se considera un estado **degradado**, no inaccesible.
    - Al igual que `gateway status`, la sonda reutiliza la autenticación de dispositivo existente almacenada en caché, pero no crea una identidad de dispositivo ni un estado de emparejamiento iniciales.
    - El código de salida solo es distinto de cero cuando no se puede acceder a ninguno de los destinos sondeados.

  </Accordion>
  <Accordion title="Salida JSON">
    Nivel superior:

    - `ok`: al menos un destino es accesible.
    - `degraded`: al menos un destino aceptó una conexión, pero no completó los diagnósticos RPC detallados.
    - `capability`: mejor capacidad observada entre los destinos accesibles (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: mejor destino para tratar como ganador activo, en este orden: URL explícita, túnel SSH, remoto configurado, bucle invertido local.
    - `warnings[]`: registros de advertencia generados según el mejor esfuerzo con `code`, `message` y `targetIds` opcional.
    - `network`: indicaciones de URL de bucle invertido local o tailnet derivadas de la configuración actual y la red del host.
    - `discovery.timeoutMs` / `discovery.count`: presupuesto de descubrimiento y cantidad de resultados reales utilizados en esta pasada de sondeo.

    Por destino (`targets[].connect`): `ok` (accesibilidad + clasificación degradada), `rpcOk` (éxito del RPC detallado completo), `scopeLimited` (el RPC detallado falló por falta de ámbito de operador).

    Por destino (`targets[].auth`): `role` y `scopes` informados en `hello-ok` cuando estén disponibles, además de la clasificación `capability` mostrada.

  </Accordion>
  <Accordion title="Códigos de advertencia comunes">
    - `ssh_tunnel_failed`: falló la configuración del túnel SSH; el comando recurrió a sondeos directos.
    - `multiple_gateways`: se pudo acceder a identidades de Gateway distintas, o OpenClaw no pudo demostrar que los destinos accesibles correspondieran al mismo Gateway. Un túnel SSH, una URL de proxy o una URL remota configurada que apunten al mismo Gateway no activan esta advertencia.
    - `auth_secretref_unresolved`: no se pudo resolver un SecretRef de autenticación configurado para un destino que presentó un fallo.
    - `probe_scope_limited`: la conexión WebSocket se realizó correctamente, pero el sondeo de lectura estuvo limitado por la ausencia de `operator.read`.
    - `local_tls_runtime_unavailable`: TLS del Gateway local está habilitado, pero OpenClaw no pudo cargar la huella digital del certificado local.

  </Accordion>
</AccordionGroup>

#### Remoto mediante SSH (paridad con la aplicación para Mac)

El modo "Remoto mediante SSH" de la aplicación para macOS utiliza un reenvío de puerto local para que un Gateway remoto limitado al bucle invertido sea accesible en `ws://127.0.0.1:<port>`.

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
  Selecciona el primer host de Gateway descubierto como destino SSH desde el punto de conexión de descubrimiento resuelto (`local.` más el dominio de área amplia configurado, si existe). Se ignoran las indicaciones que solo contienen TXT.
</ParamField>

Valores predeterminados de configuración (opcionales): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`.

### `gateway call <method>`

Asistente RPC de bajo nivel.

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
  Límite de tiempo de espera.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Principalmente para RPC de tipo agente que transmiten eventos intermedios antes de una carga útil final.
</ParamField>
<ParamField path="--json" type="boolean">
  Salida JSON legible por máquina.
</ParamField>

<Note>
`--params` debe ser JSON válido, y cada método valida su propia estructura de parámetros (se rechazan los campos adicionales o con nombres incorrectos).
</Note>

## Gestionar el servicio del Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Instalar con un contenedor

Utilice `--wrapper` cuando el servicio gestionado deba iniciarse mediante otro ejecutable, por ejemplo, un adaptador para un gestor de secretos o una herramienta para ejecutar con otra identidad. El contenedor recibe los argumentos normales del Gateway y es responsable de ejecutar finalmente `openclaw` o Node con esos argumentos.

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

También se puede establecer el contenedor mediante el entorno. `gateway install` valida que la ruta corresponda a un archivo ejecutable, escribe el contenedor en el `ProgramArguments` del servicio y conserva `OPENCLAW_WRAPPER` en el entorno del servicio para posteriores reinstalaciones forzadas, actualizaciones y reparaciones de doctor.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Para eliminar un contenedor persistente, borre `OPENCLAW_WRAPPER` durante la reinstalación:

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
    - `gateway stop`: `--disable`, `--force`, `--json`

  </Accordion>
  <Accordion title="Comportamiento del ciclo de vida">
    - `gateway start` es idempotente: cuando el servicio administrado ya está en ejecución, informa del proceso en ejecución y no lo modifica. Un servicio cargado pero detenido se inicia como antes.
    - Use `gateway restart` para reiniciar un servicio administrado. No encadene `gateway stop` y `gateway start` como sustituto de un reinicio.
    - En un shell no interactivo, `gateway stop` requiere `--force`. Los terminales interactivos conservan el comportamiento existente sin solicitudes. Para automatización y pruebas, se recomienda `gateway run --dev` o un `--profile` aislado con un puerto libre.
    - En macOS, `gateway stop` usa `launchctl bootout` de forma predeterminada, lo que elimina el LaunchAgent de la sesión de arranque actual sin conservar una desactivación: la recuperación automática de KeepAlive permanece activa para fallos futuros y `gateway start` vuelve a habilitarlo correctamente sin un `launchctl enable` manual. Pase `--disable` para suprimir de forma persistente KeepAlive y RunAtLoad, de modo que el Gateway no vuelva a iniciarse hasta el siguiente `gateway start` explícito; use esta opción cuando una detención manual deba mantenerse tras los reinicios.
    - Las modificaciones del ciclo de vida del Gateway añaden, en la medida de lo posible, registros de auditoría de clave-valor a `<state-dir>/logs/gateway-restart.log`, incluidas las operaciones de inicio, detención y reinicio de la CLI, las solicitudes de reinicio seguro, los reinicios del supervisor y las transferencias desacopladas.
    - Los comandos del ciclo de vida aceptan `--json` para su uso en scripts.

  </Accordion>
  <Accordion title="Dimensionamiento del montón del Gateway administrado">
    - `gateway install` escribe un valor `NODE_OPTIONS` exclusivo para el montón del servicio Gateway administrado. El objetivo es el 50% de la memoria restringida cuando Node informa de un límite de contenedor o servicio; de lo contrario, el 50% de la memoria física.
    - El intervalo objetivo nominal es de 2048–8192 MiB, con un límite adicional del 75% de margen para memoria nativa. En hosts pequeños, este límite de margen puede situar el límite aplicado por debajo del mínimo nominal de 2048 MiB.
    - Un `--max-old-space-size` explícito y válido que ya esté almacenado en el servicio instalado se conserva durante las reinstalaciones forzadas y las reparaciones de doctor. Los demás indicadores de `NODE_OPTIONS` no se transfieren al servicio administrado.
    - El `NODE_OPTIONS` del shell del entorno no anula esta política. Use `gateway status` o `doctor` para inspeccionar el valor instalado; ejecute `openclaw gateway install --force` para regenerar metadatos de servicios antiguos que no tengan una configuración administrada del montón.
    - La política se aplica únicamente al servicio Gateway administrado. `gateway run` en primer plano, los servicios de Node y las unidades de supervisor escritas manualmente conservan su propia configuración de tiempo de ejecución.

  </Accordion>
  <Accordion title="Autenticación y SecretRefs durante la instalación">
    - Cuando la autenticación mediante token requiere un token y `gateway.auth.token` está administrado mediante SecretRef, `gateway install` valida que el SecretRef pueda resolverse, pero no conserva el token resuelto en los metadatos del entorno del servicio.
    - Si la autenticación mediante token requiere un token y el SecretRef del token configurado no se resuelve, la instalación falla de forma segura en lugar de conservar texto sin formato como alternativa.
    - Para la autenticación mediante contraseña en `gateway run`, se recomienda `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` respaldado por SecretRef en lugar de `--password` insertado directamente.
    - En el modo de autenticación inferido, `OPENCLAW_GATEWAY_PASSWORD` disponible únicamente en el shell no flexibiliza los requisitos de token de la instalación; use una configuración persistente (`gateway.auth.password` o la configuración `env`) al instalar un servicio administrado.
    - Si se configuran tanto `gateway.auth.token` como `gateway.auth.password` y `gateway.auth.mode` no está definido, la instalación se bloquea hasta que el modo se establezca explícitamente.

  </Accordion>
</AccordionGroup>

## Detectar gateways (Bonjour)

`gateway discover` busca balizas de Gateway (`_openclaw-gw._tcp`).

- DNS-SD de multidifusión: `local.`
- DNS-SD de unidifusión (Bonjour de área amplia): elija un dominio (ejemplo: `openclaw.internal.`) y configure DNS dividido y un servidor DNS; consulte [Bonjour](/es/gateway/bonjour).

Solo los gateways que tienen habilitada la detección mediante Bonjour (valor predeterminado) anuncian la baliza.

Indicaciones TXT en cada baliza: `role` (indicación del rol del Gateway), `transport` (indicación del transporte, p. ej., `gateway`), `gatewayPort` (puerto WebSocket, normalmente `18789`), `tailnetDns` (nombre de host de MagicDNS, cuando está disponible), `gatewayTls` / `gatewayTlsSha256` (TLS habilitado + huella digital del certificado). `sshPort` y `cliPath` solo se publican en el modo de detección completa (`discovery.mdns.mode: "full"`; el valor predeterminado es `"minimal"`, que los omite; en ese caso, los clientes usan de forma predeterminada el puerto `22` para los destinos SSH).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Tiempo de espera por comando (exploración/resolución).
</ParamField>
<ParamField path="--json" type="boolean">
  Salida legible por máquina (también desactiva los estilos y el indicador de progreso).
</ParamField>

Ejemplos:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- Explora `local.` y el dominio de área amplia configurado cuando está habilitado.
- `wsUrl` en la salida JSON se deriva del punto de conexión del servicio resuelto, no de indicaciones disponibles únicamente en TXT, como `lanHost` o `tailnetDns`.
- `discovery.mdns.mode` controla la publicación de `sshPort`/`cliPath` tanto en mDNS `local.` como en DNS-SD de área amplia (consulte la información anterior).

</Note>

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Guía operativa del Gateway](/es/gateway)
