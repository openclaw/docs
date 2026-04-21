---
read_when:
    - El centro de solución de problemas te dirigió aquí para un diagnóstico más profundo.
    - Necesitas secciones estables del manual basadas en síntomas con comandos exactos.
summary: Guía detallada de solución de problemas para Gateway, canales, automatización, nodos y navegador
title: Solución de problemas
x-i18n:
    generated_at: "2026-04-21T13:35:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: add7625785e3b78897c750b4785b7fe84a3d91c23c4175de750c4834272967f9
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Solución de problemas de Gateway

Esta página es el manual detallado.
Empieza en [/help/troubleshooting](/es/help/troubleshooting) si primero quieres el flujo rápido de triaje.

## Escalera de comandos

Ejecuta estos primero, en este orden:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Señales esperadas de buen estado:

- `openclaw gateway status` muestra `Runtime: running`, `Connectivity probe: ok` y una línea `Capability: ...`.
- `openclaw doctor` no informa problemas de configuración/servicio que bloqueen.
- `openclaw channels status --probe` muestra el estado de transporte activo por cuenta y,
  donde se admite, resultados de sonda/auditoría como `works` o `audit ok`.

## Anthropic 429 requiere uso adicional para contexto largo

Usa esto cuando los registros/errores incluyan:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Busca lo siguiente:

- El modelo Anthropic Opus/Sonnet seleccionado tiene `params.context1m: true`.
- La credencial actual de Anthropic no es apta para uso de contexto largo.
- Las solicitudes fallan solo en sesiones largas o ejecuciones de modelos que necesitan la ruta beta de 1M.

Opciones de corrección:

1. Desactiva `context1m` para ese modelo para volver a la ventana de contexto normal.
2. Usa una credencial de Anthropic apta para solicitudes de contexto largo o cambia a una clave de API de Anthropic.
3. Configura modelos de respaldo para que las ejecuciones continúen cuando se rechacen las solicitudes de contexto largo de Anthropic.

Relacionado:

- [/providers/anthropic](/es/providers/anthropic)
- [/reference/token-use](/es/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/es/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Un backend local compatible con OpenAI pasa sondas directas pero fallan las ejecuciones del agente

Usa esto cuando:

- `curl ... /v1/models` funciona
- pequeñas llamadas directas a `/v1/chat/completions` funcionan
- las ejecuciones de modelos de OpenClaw fallan solo en turnos normales del agente

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Busca lo siguiente:

- las llamadas directas pequeñas tienen éxito, pero las ejecuciones de OpenClaw fallan solo con prompts más grandes
- errores del backend sobre `messages[].content` esperando una cadena
- fallos del backend que aparecen solo con recuentos mayores de tokens del prompt o prompts completos del runtime del agente

Firmas comunes:

- `messages[...].content: invalid type: sequence, expected a string` → el backend rechaza partes estructuradas de contenido de Chat Completions. Solución: establece `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- las solicitudes directas pequeñas tienen éxito, pero las ejecuciones del agente de OpenClaw fallan con bloqueos del backend/modelo
  (por ejemplo, Gemma en algunas compilaciones de `inferrs`) → probablemente el transporte de OpenClaw ya sea correcto; el backend está fallando con la forma del prompt más grande del runtime del agente.
- los fallos disminuyen tras desactivar herramientas, pero no desaparecen → los esquemas de herramientas formaban
  parte de la presión, pero el problema restante sigue siendo la capacidad aguas arriba del modelo/servidor o un error del backend.

Opciones de corrección:

1. Establece `compat.requiresStringContent: true` para backends de Chat Completions que solo aceptan cadenas.
2. Establece `compat.supportsTools: false` para modelos/backends que no pueden manejar
   de forma fiable la superficie de esquemas de herramientas de OpenClaw.
3. Reduce la presión del prompt donde sea posible: arranque inicial más pequeño del espacio de trabajo, historial de sesión más corto, modelo local más ligero o un backend con mejor compatibilidad con contexto largo.
4. Si las solicitudes directas pequeñas siguen funcionando mientras los turnos del agente de OpenClaw continúan fallando
   dentro del backend, trátalo como una limitación del servidor/modelo aguas arriba y presenta
   allí una reproducción con la forma de payload aceptada.

Relacionado:

- [/gateway/local-models](/es/gateway/local-models)
- [/gateway/configuration](/es/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/es/gateway/configuration-reference#openai-compatible-endpoints)

## Sin respuestas

Si los canales están activos pero no responde nada, comprueba el enrutamiento y la política antes de volver a conectar nada.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Busca lo siguiente:

- Emparejamiento pendiente para remitentes de mensajes directos.
- Restricción de mención en grupos (`requireMention`, `mentionPatterns`).
- Incompatibilidades en listas de permitidos de canal/grupo.

Firmas comunes:

- `drop guild message (mention required` → el mensaje del grupo se ignora hasta que haya una mención.
- `pairing request` → el remitente necesita aprobación.
- `blocked` / `allowlist` → el remitente/canal fue filtrado por la política.

Relacionado:

- [/channels/troubleshooting](/es/channels/troubleshooting)
- [/channels/pairing](/es/channels/pairing)
- [/channels/groups](/es/channels/groups)

## Conectividad de la UI de dashboard/control

Cuando la UI de dashboard/control no se conecta, valida la URL, el modo de autenticación y los supuestos de contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Busca lo siguiente:

- URL de sonda correcta y URL de dashboard correcta.
- Incompatibilidad de modo de autenticación/token entre el cliente y el gateway.
- Uso de HTTP donde se requiere identidad del dispositivo.

Firmas comunes:

- `device identity required` → contexto no seguro o falta autenticación del dispositivo.
- `origin not allowed` → el `Origin` del navegador no está en `gateway.controlUi.allowedOrigins`
  (o te estás conectando desde un origen de navegador que no es loopback sin una
  lista de permitidos explícita).
- `device nonce required` / `device nonce mismatch` → el cliente no está completando el
  flujo de autenticación de dispositivo basado en desafío (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → el cliente firmó el payload incorrecto
  (o con una marca de tiempo obsoleta) para el protocolo de enlace actual.
- `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → el cliente puede hacer un reintento confiable con un token de dispositivo en caché.
- Ese reintento con token en caché reutiliza el conjunto de alcances almacenado con el token del
  dispositivo emparejado. Los llamadores con `deviceToken` explícito / `scopes` explícitos mantienen
  en cambio el conjunto de alcances solicitado.
- Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es: token/contraseña compartidos explícitos primero, luego `deviceToken` explícito, luego token de dispositivo almacenado y después token de arranque.
- En la ruta asíncrona de Tailscale Serve Control UI, los intentos fallidos para el mismo
  `{scope, ip}` se serializan antes de que el limitador registre el fallo. Por eso, dos reintentos
  concurrentes fallidos del mismo cliente pueden mostrar `retry later` en el segundo intento en lugar de dos incompatibilidades simples.
- `too many failed authentication attempts (retry later)` desde un cliente loopback con origen de navegador
  → los fallos repetidos desde ese mismo `Origin` normalizado se bloquean temporalmente; otro origen localhost usa un bucket separado.
- `repeated unauthorized` después de ese reintento → desajuste de token compartido/token de dispositivo; actualiza la configuración del token y vuelve a aprobar/rotar el token del dispositivo si hace falta.
- `gateway connect failed:` → destino de host/puerto/url incorrecto.

### Mapa rápido de códigos de detalle de autenticación

Usa `error.details.code` de la respuesta fallida de `connect` para elegir la siguiente acción:

| Detail code                  | Meaning                                                                                                                                                                                      | Recommended action                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | El cliente no envió un token compartido requerido.                                                                                                                                            | Pega/establece el token en el cliente y vuelve a intentarlo. Para rutas de dashboard: `openclaw config get gateway.auth.token` y luego pégalo en la configuración de Control UI.                                                                                                      |
| `AUTH_TOKEN_MISMATCH`        | El token compartido no coincidía con el token de autenticación del gateway.                                                                                                                  | Si `canRetryWithDeviceToken=true`, permite un reintento confiable. Los reintentos con token en caché reutilizan los alcances aprobados almacenados; los llamadores con `deviceToken` / `scopes` explícitos mantienen los alcances solicitados. Si sigue fallando, ejecuta la [lista de verificación de recuperación por deriva de token](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | El token por dispositivo en caché está obsoleto o revocado.                                                                                                                                  | Rota/vuelve a aprobar el token del dispositivo usando la [CLI de devices](/cli/devices) y luego vuelve a conectarte.                                                                                                                                                                   |
| `PAIRING_REQUIRED`           | La identidad del dispositivo necesita aprobación. Comprueba `error.details.reason` para `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade`, y usa `requestId` / `remediationHint` cuando estén presentes. | Aprueba la solicitud pendiente: `openclaw devices list` y luego `openclaw devices approve <requestId>`. Las actualizaciones de alcance/rol usan el mismo flujo después de revisar el acceso solicitado.                                                                               |

Comprobación de migración de autenticación de dispositivos v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si los registros muestran errores de nonce/firma, actualiza el cliente que se conecta y verifica que:

1. espere a `connect.challenge`
2. firme el payload vinculado al desafío
3. envíe `connect.params.device.nonce` con el mismo nonce del desafío

Si `openclaw devices rotate` / `revoke` / `remove` se deniega inesperadamente:

- las sesiones con token de dispositivo emparejado solo pueden gestionar **su propio** dispositivo, a menos que el
  llamador también tenga `operator.admin`
- `openclaw devices rotate --scope ...` solo puede solicitar alcances de operador que
  la sesión llamadora ya tenga

Relacionado:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/es/gateway/configuration) (modos de autenticación del gateway)
- [/gateway/trusted-proxy-auth](/es/gateway/trusted-proxy-auth)
- [/gateway/remote](/es/gateway/remote)
- [/cli/devices](/cli/devices)

## El servicio Gateway no está en ejecución

Usa esto cuando el servicio está instalado pero el proceso no permanece activo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # también examina servicios a nivel del sistema
```

Busca lo siguiente:

- `Runtime: stopped` con pistas de salida.
- Incompatibilidad de configuración del servicio (`Config (cli)` frente a `Config (service)`).
- Conflictos de puerto/escucha.
- Instalaciones adicionales de launchd/systemd/schtasks cuando se usa `--deep`.
- Sugerencias de limpieza de `Other gateway-like services detected (best effort)`.

Firmas comunes:

- `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → el modo local de gateway no está habilitado, o el archivo de configuración fue sobrescrito y perdió `gateway.mode`. Solución: establece `gateway.mode="local"` en tu configuración, o vuelve a ejecutar `openclaw onboard --mode local` / `openclaw setup` para volver a aplicar la configuración esperada de modo local. Si ejecutas OpenClaw mediante Podman, la ruta de configuración predeterminada es `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → enlace fuera de loopback sin una ruta de autenticación válida del gateway (token/contraseña, o trusted-proxy donde esté configurado).
- `another gateway instance is already listening` / `EADDRINUSE` → conflicto de puerto.
- `Other gateway-like services detected (best effort)` → existen unidades launchd/systemd/schtasks obsoletas o en paralelo. La mayoría de las configuraciones deberían mantener un gateway por máquina; si sí necesitas más de uno, aísla puertos + configuración/estado/espacio de trabajo. Consulta [/gateway#multiple-gateways-same-host](/es/gateway#multiple-gateways-same-host).

Relacionado:

- [/gateway/background-process](/es/gateway/background-process)
- [/gateway/configuration](/es/gateway/configuration)
- [/gateway/doctor](/es/gateway/doctor)

## Gateway restauró la configuración del último estado válido conocido

Usa esto cuando el Gateway inicia, pero los registros dicen que restauró `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Busca lo siguiente:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Un archivo con marca de tiempo `openclaw.json.clobbered.*` junto a la configuración activa
- Un evento del agente principal que empieza con `Config recovery warning`

Qué pasó:

- La configuración rechazada no validó durante el inicio o la recarga en caliente.
- OpenClaw conservó el payload rechazado como `.clobbered.*`.
- La configuración activa se restauró desde la última copia válida conocida validada.
- Se advierte al siguiente turno del agente principal que no reescriba a ciegas la configuración rechazada.

Inspecciona y corrige:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Firmas comunes:

- existe `.clobbered.*` → se restauró una edición directa externa o una lectura durante el arranque.
- existe `.rejected.*` → una escritura de configuración controlada por OpenClaw falló las comprobaciones de esquema o sobrescritura antes de confirmarse.
- `Config write rejected:` → la escritura intentó eliminar la forma requerida, reducir drásticamente el archivo o persistir una configuración no válida.
- `Config last-known-good promotion skipped` → el candidato contenía marcadores de secretos redactados como `***`.

Opciones de corrección:

1. Mantén la configuración activa restaurada si es correcta.
2. Copia solo las claves deseadas desde `.clobbered.*` o `.rejected.*`, y luego aplícalas con `openclaw config set` o `config.patch`.
3. Ejecuta `openclaw config validate` antes de reiniciar.
4. Si editas a mano, conserva la configuración JSON5 completa, no solo el objeto parcial que querías cambiar.

Relacionado:

- [/gateway/configuration#strict-validation](/es/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/es/gateway/configuration#config-hot-reload)
- [/cli/config](/cli/config)
- [/gateway/doctor](/es/gateway/doctor)

## Advertencias de sonda del Gateway

Usa esto cuando `openclaw gateway probe` alcanza algo, pero aun así muestra un bloque de advertencia.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Busca lo siguiente:

- `warnings[].code` y `primaryTargetId` en la salida JSON.
- Si la advertencia trata sobre fallback por SSH, múltiples gateways, alcances faltantes o referencias de autenticación sin resolver.

Firmas comunes:

- `SSH tunnel failed to start; falling back to direct probes.` → la configuración de SSH falló, pero el comando aún intentó objetivos directos configurados/de loopback.
- `multiple reachable gateways detected` → respondió más de un objetivo. Normalmente esto significa una configuración intencional de múltiples gateways o listeners obsoletos/duplicados.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la conexión funcionó, pero el RPC de detalle está limitado por alcance; empareja la identidad del dispositivo o usa credenciales con `operator.read`.
- `Capability: pairing-pending` o `gateway closed (1008): pairing required` → el gateway respondió, pero este cliente aún necesita emparejamiento/aprobación antes del acceso normal de operador.
- texto de advertencia de SecretRef sin resolver en `gateway.auth.*` / `gateway.remote.*` → el material de autenticación no estaba disponible en esta ruta de comando para el objetivo fallido.

Relacionado:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/es/gateway#multiple-gateways-same-host)
- [/gateway/remote](/es/gateway/remote)

## Canal conectado pero los mensajes no fluyen

Si el estado del canal es conectado pero el flujo de mensajes está muerto, céntrate en la política, los permisos y las reglas de entrega específicas del canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Busca lo siguiente:

- Política de MD (`pairing`, `allowlist`, `open`, `disabled`).
- Lista de permitidos de grupos y requisitos de mención.
- Permisos/alcances faltantes de la API del canal.

Firmas comunes:

- `mention required` → el mensaje se ignoró por la política de mención del grupo.
- `pairing` / rastros de aprobación pendiente → el remitente no está aprobado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de autenticación/permisos del canal.

Relacionado:

- [/channels/troubleshooting](/es/channels/troubleshooting)
- [/channels/whatsapp](/es/channels/whatsapp)
- [/channels/telegram](/es/channels/telegram)
- [/channels/discord](/es/channels/discord)

## Entrega de Cron y Heartbeat

Si Cron o Heartbeat no se ejecutaron o no entregaron, verifica primero el estado del programador y luego el destino de entrega.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Busca lo siguiente:

- Cron habilitado y próxima activación presente.
- Estado del historial de ejecución del trabajo (`ok`, `skipped`, `error`).
- Motivos de omisión de Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Firmas comunes:

- `cron: scheduler disabled; jobs will not run automatically` → Cron deshabilitado.
- `cron: timer tick failed` → falló el tick del programador; revisa errores de archivo/registro/runtime.
- `heartbeat skipped` con `reason=quiet-hours` → fuera de la ventana de horas activas.
- `heartbeat skipped` con `reason=empty-heartbeat-file` → existe `HEARTBEAT.md` pero solo contiene líneas en blanco / encabezados markdown, por lo que OpenClaw omite la llamada al modelo.
- `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un bloque `tasks:`, pero ninguna de las tareas vence en este tick.
- `heartbeat: unknown accountId` → id de cuenta no válido para el destino de entrega de Heartbeat.
- `heartbeat skipped` con `reason=dm-blocked` → el destino de Heartbeat se resolvió a un destino tipo MD mientras `agents.defaults.heartbeat.directPolicy` (o una anulación por agente) está establecido en `block`.

Relacionado:

- [/automation/cron-jobs#troubleshooting](/es/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/es/automation/cron-jobs)
- [/gateway/heartbeat](/es/gateway/heartbeat)

## Falla una herramienta de Node emparejado

Si un Node está emparejado pero las herramientas fallan, aísla el estado de primer plano, permisos y aprobación.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Busca lo siguiente:

- Node en línea con las capacidades esperadas.
- Concesiones de permisos del SO para cámara/micrófono/ubicación/pantalla.
- Estado de aprobaciones de exec y lista de permitidos.

Firmas comunes:

- `NODE_BACKGROUND_UNAVAILABLE` → la app del Node debe estar en primer plano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → falta un permiso del SO.
- `SYSTEM_RUN_DENIED: approval required` → aprobación de exec pendiente.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado por la lista de permitidos.

Relacionado:

- [/nodes/troubleshooting](/es/nodes/troubleshooting)
- [/nodes/index](/es/nodes/index)
- [/tools/exec-approvals](/es/tools/exec-approvals)

## Falla la herramienta del navegador

Usa esto cuando las acciones de la herramienta del navegador fallan aunque el gateway en sí esté en buen estado.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Busca lo siguiente:

- Si `plugins.allow` está establecido e incluye `browser`.
- Ruta válida al ejecutable del navegador.
- Alcanzabilidad del perfil CDP.
- Disponibilidad de Chrome local para perfiles `existing-session` / `user`.

Firmas comunes:

- `unknown command "browser"` o `unknown command 'browser'` → el plugin integrado del navegador está excluido por `plugins.allow`.
- la herramienta del navegador falta / no está disponible mientras `browser.enabled=true` → `plugins.allow` excluye `browser`, por lo que el plugin nunca se cargó.
- `Failed to start Chrome CDP on port` → el proceso del navegador no se pudo iniciar.
- `browser.executablePath not found` → la ruta configurada no es válida.
- `browser.cdpUrl must be http(s) or ws(s)` → la URL de CDP configurada usa un esquema no compatible como `file:` o `ftp:`.
- `browser.cdpUrl has invalid port` → la URL de CDP configurada tiene un puerto incorrecto o fuera de rango.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP `existing-session` aún no pudo conectarse al directorio de datos del navegador seleccionado. Abre la página de inspección del navegador, habilita la depuración remota, mantén el navegador abierto, aprueba la primera solicitud de conexión y luego vuelve a intentarlo. Si no se requiere estado de sesión iniciada, prefiere el perfil administrado `openclaw`.
- `No Chrome tabs found for profile="user"` → el perfil de conexión Chrome MCP no tiene pestañas locales de Chrome abiertas.
- `Remote CDP for profile "<name>" is not reachable` → el endpoint remoto de CDP configurado no es alcanzable desde el host del gateway.
- `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → el perfil solo de conexión no tiene un objetivo alcanzable, o el endpoint HTTP respondió pero aun así no se pudo abrir el WebSocket CDP.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → la instalación actual del gateway no incluye el paquete completo de Playwright; las instantáneas ARIA y las capturas básicas de página aún pueden funcionar, pero la navegación, las instantáneas de IA, las capturas de elementos por selector CSS y la exportación a PDF siguen sin estar disponibles.
- `fullPage is not supported for element screenshots` → la solicitud de captura mezcló `--full-page` con `--ref` o `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → las llamadas de captura de pantalla de Chrome MCP / `existing-session` deben usar captura de página o un `--ref` de snapshot, no `--element` CSS.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → los hooks de carga de Chrome MCP necesitan refs de snapshot, no selectores CSS.
- `existing-session file uploads currently support one file at a time.` → envía una carga por llamada en perfiles Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → los hooks de diálogos en perfiles Chrome MCP no admiten anulaciones de tiempo de espera.
- `response body is not supported for existing-session profiles yet.` → `responsebody` todavía requiere un navegador administrado o un perfil CDP sin procesar.
- anulaciones obsoletas de viewport / modo oscuro / locale / sin conexión en perfiles solo de conexión o CDP remotos → ejecuta `openclaw browser stop --browser-profile <name>` para cerrar la sesión de control activa y liberar el estado de emulación de Playwright/CDP sin reiniciar todo el gateway.

Relacionado:

- [/tools/browser-linux-troubleshooting](/es/tools/browser-linux-troubleshooting)
- [/tools/browser](/es/tools/browser)

## Si actualizaste y algo dejó de funcionar de repente

La mayoría de los fallos posteriores a una actualización son deriva de configuración o valores predeterminados más estrictos que ahora se están aplicando.

### 1) El comportamiento de autenticación y anulación de URL cambió

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Qué comprobar:

- Si `gateway.mode=remote`, las llamadas de la CLI pueden estar apuntando al entorno remoto mientras tu servicio local está bien.
- Las llamadas explícitas con `--url` no recurren a las credenciales almacenadas.

Firmas comunes:

- `gateway connect failed:` → destino URL incorrecto.
- `unauthorized` → endpoint alcanzable, pero autenticación incorrecta.

### 2) Las protecciones de bind y autenticación son más estrictas

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Qué comprobar:

- Los binds fuera de loopback (`lan`, `tailnet`, `custom`) necesitan una ruta válida de autenticación del gateway: autenticación compartida por token/contraseña, o un despliegue `trusted-proxy` fuera de loopback configurado correctamente.
- Claves antiguas como `gateway.token` no sustituyen a `gateway.auth.token`.

Firmas comunes:

- `refusing to bind gateway ... without auth` → bind fuera de loopback sin una ruta válida de autenticación del gateway.
- `Connectivity probe: failed` mientras el runtime está en ejecución → el gateway está activo, pero es inaccesible con la autenticación/URL actuales.

### 3) Cambió el estado de emparejamiento e identidad del dispositivo

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Qué comprobar:

- Aprobaciones pendientes de dispositivos para dashboard/nodes.
- Aprobaciones pendientes de emparejamiento de MD tras cambios de política o identidad.

Firmas comunes:

- `device identity required` → no se cumplió la autenticación del dispositivo.
- `pairing required` → el remitente/dispositivo debe aprobarse.

Si la configuración del servicio y el runtime siguen sin coincidir después de las comprobaciones, reinstala los metadatos del servicio desde el mismo directorio de perfil/estado:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Relacionado:

- [/gateway/pairing](/es/gateway/pairing)
- [/gateway/authentication](/es/gateway/authentication)
- [/gateway/background-process](/es/gateway/background-process)
