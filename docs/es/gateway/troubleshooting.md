---
read_when:
    - El centro de solución de problemas te remitió aquí para un diagnóstico más detallado
    - Necesitas secciones estables del runbook basadas en síntomas con comandos exactos
summary: Runbook detallado de solución de problemas para gateway, canales, automatización, nodos y navegador
title: Solución de problemas
x-i18n:
    generated_at: "2026-04-24T05:31:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32c4cbbbe8b1cd5eaca34503f4a363d3fa2650e491f83455958eb5725f9d50c5
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Solución de problemas del Gateway

Esta página es el runbook detallado.
Empieza en [/help/troubleshooting](/es/help/troubleshooting) si primero quieres el flujo rápido de triaje.

## Secuencia de comandos

Ejecuta primero estos comandos, en este orden:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Señales esperadas de buen estado:

- `openclaw gateway status` muestra `Runtime: running`, `Connectivity probe: ok` y una línea `Capability: ...`.
- `openclaw doctor` no informa de problemas bloqueantes de configuración/servicio.
- `openclaw channels status --probe` muestra el estado activo del transporte por cuenta y,
  cuando es compatible, resultados de sonda/auditoría como `works` o `audit ok`.

## Anthropic 429 extra usage required for long context

Úsalo cuando los registros/errores incluyan:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Busca lo siguiente:

- El modelo Opus/Sonnet seleccionado de Anthropic tiene `params.context1m: true`.
- La credencial actual de Anthropic no es apta para uso de contexto largo.
- Las solicitudes fallan solo en sesiones largas/ejecuciones de modelo que necesitan la ruta beta de 1M.

Opciones para corregirlo:

1. Desactiva `context1m` para ese modelo y vuelve a la ventana de contexto normal.
2. Usa una credencial de Anthropic apta para solicitudes de contexto largo, o cambia a una clave de API de Anthropic.
3. Configura modelos alternativos para que las ejecuciones continúen cuando se rechacen las solicitudes de contexto largo de Anthropic.

Relacionado:

- [/providers/anthropic](/es/providers/anthropic)
- [/reference/token-use](/es/reference/token-use)
- [/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/es/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## El backend local compatible con OpenAI pasa las sondas directas, pero fallan las ejecuciones del agente

Úsalo cuando:

- `curl ... /v1/models` funciona
- funcionan llamadas directas pequeñas a `/v1/chat/completions`
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
- errores del backend sobre `messages[].content` que esperan una cadena
- fallos del backend que aparecen solo con recuentos grandes de tokens del prompt o con prompts completos
  del runtime del agente

Firmas comunes:

- `messages[...].content: invalid type: sequence, expected a string` → el backend
  rechaza partes estructuradas de contenido de Chat Completions. Solución: establece
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- las solicitudes directas pequeñas tienen éxito, pero las ejecuciones del agente de OpenClaw fallan con
  bloqueos del backend/modelo (por ejemplo Gemma en algunas compilaciones de `inferrs`) → el transporte de OpenClaw
  probablemente ya sea correcto; el backend está fallando con la forma más grande del prompt
  del runtime del agente.
- los fallos disminuyen después de desactivar herramientas, pero no desaparecen → los esquemas de herramientas formaban
  parte de la presión, pero el problema restante sigue siendo la capacidad del modelo/servidor
  de origen o un error del backend.

Opciones para corregirlo:

1. Establece `compat.requiresStringContent: true` para backends de Chat Completions que solo admiten cadenas.
2. Establece `compat.supportsTools: false` para modelos/backends que no puedan manejar
   de forma fiable la superficie de esquemas de herramientas de OpenClaw.
3. Reduce la presión del prompt donde sea posible: arranque de espacio de trabajo más pequeño, historial
   de sesión más corto, modelo local más ligero o un backend con mejor soporte
   de contexto largo.
4. Si las solicitudes directas pequeñas siguen funcionando mientras que los turnos del agente de OpenClaw siguen fallando
   dentro del backend, trátalo como una limitación del servidor/modelo de origen y presenta
   allí una reproducción con la forma de carga útil aceptada.

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

- Vinculación pendiente para remitentes de mensajes directos.
- Control de mención en grupos (`requireMention`, `mentionPatterns`).
- Incompatibilidades en listas de permitidos de canal/grupo.

Firmas comunes:

- `drop guild message (mention required` → mensaje de grupo ignorado hasta que haya una mención.
- `pairing request` → el remitente necesita aprobación.
- `blocked` / `allowlist` → el remitente/canal fue filtrado por la política.

Relacionado:

- [/channels/troubleshooting](/es/channels/troubleshooting)
- [/channels/pairing](/es/channels/pairing)
- [/channels/groups](/es/channels/groups)

## Conectividad de la UI de control del dashboard

Cuando el dashboard/la UI de control no se conecta, valida la URL, el modo de autenticación y las suposiciones de contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Busca lo siguiente:

- URL de sonda y URL del dashboard correctas.
- Incompatibilidad de modo/token de autenticación entre cliente y gateway.
- Uso de HTTP donde se requiere identidad de dispositivo.

Firmas comunes:

- `device identity required` → contexto no seguro o falta autenticación de dispositivo.
- `origin not allowed` → el `Origin` del navegador no está en `gateway.controlUi.allowedOrigins`
  (o te estás conectando desde un origen de navegador que no es loopback sin una
  lista de permitidos explícita).
- `device nonce required` / `device nonce mismatch` → el cliente no está completando el
  flujo de autenticación de dispositivo basado en desafío (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → el cliente firmó la carga útil incorrecta
  (o con una marca de tiempo obsoleta) para el handshake actual.
- `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → el cliente puede hacer un reintento de confianza con un token de dispositivo en caché.
- Ese reintento con token en caché reutiliza el conjunto de ámbitos almacenado con el token
  del dispositivo vinculado. Los llamadores con `deviceToken` explícito / `scopes` explícitos mantienen su
  conjunto de ámbitos solicitado.
- Fuera de esa ruta de reintento, la precedencia de autenticación de connect es primero
  token/contraseña compartidos explícitos, luego `deviceToken` explícito, luego token de dispositivo almacenado,
  y después token de arranque.
- En la ruta asíncrona de Tailscale Serve Control UI, los intentos fallidos para el mismo
  `{scope, ip}` se serializan antes de que el limitador registre el fallo. Por tanto, dos reintentos
  concurrentes incorrectos del mismo cliente pueden mostrar `retry later`
  en el segundo intento en lugar de dos incompatibilidades simples.
- `too many failed authentication attempts (retry later)` desde un cliente loopback
  con origen de navegador → los fallos repetidos desde ese mismo `Origin` normalizado quedan
  temporalmente bloqueados; otro origen localhost usa un bucket independiente.
- `unauthorized` repetido después de ese reintento → desfase entre token compartido y token de dispositivo; actualiza la configuración del token y vuelve a aprobar/rotar el token del dispositivo si es necesario.
- `gateway connect failed:` → host/puerto/URL de destino incorrectos.

### Mapa rápido de códigos de detalle de autenticación

Usa `error.details.code` de la respuesta fallida de `connect` para elegir la siguiente acción:

| Código de detalle            | Significado                                                                                                                                                                                   | Acción recomendada                                                                                                                                                                                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | El cliente no envió un token compartido requerido.                                                                                                                                             | Pega/configura el token en el cliente y vuelve a intentarlo. Para rutas de dashboard: `openclaw config get gateway.auth.token` y luego pégalo en la configuración de la UI de control.                                                                                               |
| `AUTH_TOKEN_MISMATCH`        | El token compartido no coincidió con el token de autenticación del gateway.                                                                                                                    | Si `canRetryWithDeviceToken=true`, permite un reintento de confianza. Los reintentos con token en caché reutilizan los ámbitos aprobados almacenados; los llamadores con `deviceToken` / `scopes` explícitos mantienen los ámbitos solicitados. Si sigue fallando, ejecuta la [lista de comprobación de recuperación por desfase de token](/es/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | El token por dispositivo en caché está obsoleto o revocado.                                                                                                                                    | Rota/vuelve a aprobar el token del dispositivo usando la [CLI de dispositivos](/es/cli/devices) y luego vuelve a conectarte.                                                                                                                                                               |
| `PAIRING_REQUIRED`           | La identidad del dispositivo necesita aprobación. Comprueba `error.details.reason` para ver `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade`, y usa `requestId` / `remediationHint` cuando estén presentes. | Aprueba la solicitud pendiente: `openclaw devices list` y luego `openclaw devices approve <requestId>`. Las actualizaciones de ámbito/rol usan el mismo flujo después de revisar el acceso solicitado.                                                                                |

Comprobación de migración de autenticación de dispositivos v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si los registros muestran errores de nonce/firma, actualiza el cliente que se conecta y verifica que:

1. espere a `connect.challenge`
2. firme la carga útil vinculada al desafío
3. envíe `connect.params.device.nonce` con el mismo nonce del desafío

Si `openclaw devices rotate` / `revoke` / `remove` se deniega inesperadamente:

- las sesiones con token de dispositivo vinculado solo pueden gestionar **su propio**
  dispositivo a menos que el llamador también tenga `operator.admin`
- `openclaw devices rotate --scope ...` solo puede solicitar ámbitos de operador que
  la sesión del llamador ya posea

Relacionado:

- [/web/control-ui](/es/web/control-ui)
- [/gateway/configuration](/es/gateway/configuration) (modos de autenticación del gateway)
- [/gateway/trusted-proxy-auth](/es/gateway/trusted-proxy-auth)
- [/gateway/remote](/es/gateway/remote)
- [/cli/devices](/es/cli/devices)

## El servicio del Gateway no se está ejecutando

Úsalo cuando el servicio está instalado pero el proceso no se mantiene activo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Busca lo siguiente:

- `Runtime: stopped` con pistas de salida.
- Incompatibilidad de configuración del servicio (`Config (cli)` frente a `Config (service)`).
- Conflictos de puerto/listener.
- Instalaciones adicionales de launchd/systemd/schtasks cuando se usa `--deep`.
- Pistas de limpieza de `Other gateway-like services detected (best effort)`.

Firmas comunes:

- `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → el modo gateway local no está habilitado, o el archivo de configuración fue sobrescrito y perdió `gateway.mode`. Solución: establece `gateway.mode="local"` en tu configuración, o vuelve a ejecutar `openclaw onboard --mode local` / `openclaw setup` para volver a sellar la configuración esperada de modo local. Si estás ejecutando OpenClaw mediante Podman, la ruta predeterminada de configuración es `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → vinculación no loopback sin una ruta válida de autenticación del gateway (token/contraseña, o `trusted-proxy` cuando esté configurado).
- `another gateway instance is already listening` / `EADDRINUSE` → conflicto de puerto.
- `Other gateway-like services detected (best effort)` → existen unidades launchd/systemd/schtasks obsoletas o en paralelo. La mayoría de las configuraciones deberían mantener un gateway por máquina; si realmente necesitas más de uno, aísla puertos + configuración/estado/espacio de trabajo. Consulta [/gateway#multiple-gateways-same-host](/es/gateway#multiple-gateways-same-host).

Relacionado:

- [/gateway/background-process](/es/gateway/background-process)
- [/gateway/configuration](/es/gateway/configuration)
- [/gateway/doctor](/es/gateway/doctor)

## El Gateway restauró la última configuración válida conocida

Úsalo cuando el Gateway inicia, pero los registros dicen que restauró `openclaw.json`.

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
- Un archivo con marca temporal `openclaw.json.clobbered.*` junto a la configuración activa
- Un evento del sistema del agente principal que empieza por `Config recovery warning`

Qué ocurrió:

- La configuración rechazada no superó la validación durante el arranque o la recarga en caliente.
- OpenClaw conservó la carga útil rechazada como `.clobbered.*`.
- La configuración activa se restauró desde la última copia válida conocida.
- El siguiente turno del agente principal recibe una advertencia para que no reescriba a ciegas la configuración rechazada.

Inspeccionar y reparar:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Firmas comunes:

- Existe `.clobbered.*` → se restauró una edición directa externa o una lectura en el arranque.
- Existe `.rejected.*` → una escritura de configuración propiedad de OpenClaw no superó las comprobaciones de esquema o sobrescritura antes de confirmarse.
- `Config write rejected:` → la escritura intentó eliminar una forma requerida, reducir drásticamente el tamaño del archivo o conservar una configuración no válida.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` o `size-drop-vs-last-good:*` → el arranque trató el archivo actual como sobrescrito porque perdió campos o tamaño en comparación con la última copia válida conocida.
- `Config last-known-good promotion skipped` → el candidato contenía marcadores de secretos redactados como `***`.

Opciones para corregirlo:

1. Mantén la configuración activa restaurada si es la correcta.
2. Copia solo las claves deseadas desde `.clobbered.*` o `.rejected.*`, y luego aplícalas con `openclaw config set` o `config.patch`.
3. Ejecuta `openclaw config validate` antes de reiniciar.
4. Si editas a mano, conserva toda la configuración JSON5, no solo el objeto parcial que querías cambiar.

Relacionado:

- [/gateway/configuration#strict-validation](/es/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/es/gateway/configuration#config-hot-reload)
- [/cli/config](/es/cli/config)
- [/gateway/doctor](/es/gateway/doctor)

## Advertencias de sonda del Gateway

Úsalo cuando `openclaw gateway probe` llega a algo, pero aun así imprime un bloque de advertencia.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Busca lo siguiente:

- `warnings[].code` y `primaryTargetId` en la salida JSON.
- Si la advertencia trata sobre alternativa SSH, varios gateways, ámbitos faltantes o referencias de autenticación sin resolver.

Firmas comunes:

- `SSH tunnel failed to start; falling back to direct probes.` → la configuración de SSH falló, pero el comando siguió probando objetivos directos configurados/loopback.
- `multiple reachable gateways detected` → respondió más de un objetivo. Normalmente esto significa una configuración intencionada de varios gateways o listeners obsoletos/duplicados.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → connect funcionó, pero el RPC de detalle está limitado por ámbito; vincula la identidad del dispositivo o usa credenciales con `operator.read`.
- `Capability: pairing-pending` o `gateway closed (1008): pairing required` → el gateway respondió, pero este cliente aún necesita vinculación/aprobación antes del acceso normal de operador.
- texto de advertencia de SecretRef sin resolver `gateway.auth.*` / `gateway.remote.*` → el material de autenticación no estaba disponible en esta ruta de comando para el objetivo fallido.

Relacionado:

- [/cli/gateway](/es/cli/gateway)
- [/gateway#multiple-gateways-same-host](/es/gateway#multiple-gateways-same-host)
- [/gateway/remote](/es/gateway/remote)

## Canal conectado pero los mensajes no fluyen

Si el estado del canal aparece como conectado pero el flujo de mensajes está muerto, céntrate en la política, los permisos y las reglas de entrega específicas del canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Busca lo siguiente:

- Política de mensajes directos (`pairing`, `allowlist`, `open`, `disabled`).
- Lista de permitidos de grupos y requisitos de mención.
- Permisos/ámbitos faltantes de la API del canal.

Firmas comunes:

- `mention required` → mensaje ignorado por la política de mención en grupo.
- trazas de `pairing` / aprobación pendiente → el remitente no está aprobado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de autenticación/permisos del canal.

Relacionado:

- [/channels/troubleshooting](/es/channels/troubleshooting)
- [/channels/whatsapp](/es/channels/whatsapp)
- [/channels/telegram](/es/channels/telegram)
- [/channels/discord](/es/channels/discord)

## Entrega de Cron y Heartbeat

Si Cron o Heartbeat no se ejecutó o no entregó nada, verifica primero el estado del programador y luego el destino de entrega.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Busca lo siguiente:

- Cron habilitado y siguiente activación presente.
- Estado del historial de ejecuciones del trabajo (`ok`, `skipped`, `error`).
- Motivos de omisión de Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Firmas comunes:

- `cron: scheduler disabled; jobs will not run automatically` → Cron deshabilitado.
- `cron: timer tick failed` → falló el tick del programador; revisa errores de archivo/registro/runtime.
- `heartbeat skipped` con `reason=quiet-hours` → fuera de la ventana de horas activas.
- `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe pero solo contiene líneas en blanco / encabezados markdown, por lo que OpenClaw omite la llamada al modelo.
- `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un bloque `tasks:`, pero ninguna tarea vence en este tick.
- `heartbeat: unknown accountId` → id de cuenta no válido para el destino de entrega de Heartbeat.
- `heartbeat skipped` con `reason=dm-blocked` → el objetivo de Heartbeat se resolvió como un destino de estilo mensaje directo mientras `agents.defaults.heartbeat.directPolicy` (o la anulación por agente) está configurado como `block`.

Relacionado:

- [/automation/cron-jobs#troubleshooting](/es/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/es/automation/cron-jobs)
- [/gateway/heartbeat](/es/gateway/heartbeat)

## Falla una herramienta de un nodo vinculado

Si un nodo está vinculado pero fallan las herramientas, aísla el estado de primer plano, permisos y aprobaciones.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Busca lo siguiente:

- Nodo en línea con las capacidades esperadas.
- Permisos del sistema operativo concedidos para cámara/micrófono/ubicación/pantalla.
- Estado de aprobaciones de ejecución y lista de permitidos.

Firmas comunes:

- `NODE_BACKGROUND_UNAVAILABLE` → la app del nodo debe estar en primer plano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → falta un permiso del sistema operativo.
- `SYSTEM_RUN_DENIED: approval required` → aprobación de ejecución pendiente.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado por la lista de permitidos.

Relacionado:

- [/nodes/troubleshooting](/es/nodes/troubleshooting)
- [/nodes/index](/es/nodes/index)
- [/tools/exec-approvals](/es/tools/exec-approvals)

## Falla la herramienta de navegador

Úsalo cuando fallan las acciones de la herramienta de navegador aunque el gateway en sí esté en buen estado.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Busca lo siguiente:

- Si `plugins.allow` está establecido e incluye `browser`.
- Ruta válida del ejecutable del navegador.
- Alcance del perfil CDP.
- Disponibilidad de Chrome local para perfiles `existing-session` / `user`.

Firmas comunes:

- `unknown command "browser"` o `unknown command 'browser'` → el plugin incluido de navegador está excluido por `plugins.allow`.
- herramienta de navegador ausente / no disponible mientras `browser.enabled=true` → `plugins.allow` excluye `browser`, por lo que el plugin nunca se cargó.
- `Failed to start Chrome CDP on port` → el proceso del navegador no pudo iniciarse.
- `browser.executablePath not found` → la ruta configurada no es válida.
- `browser.cdpUrl must be http(s) or ws(s)` → la URL CDP configurada usa un esquema no compatible como `file:` o `ftp:`.
- `browser.cdpUrl has invalid port` → la URL CDP configurada tiene un puerto incorrecto o fuera de rango.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session no pudo conectarse todavía al directorio de datos del navegador seleccionado. Abre la página de inspección del navegador, habilita la depuración remota, mantén el navegador abierto, aprueba la primera solicitud de conexión y vuelve a intentarlo. Si no necesitas mantener la sesión iniciada, prefiere el perfil gestionado `openclaw`.
- `No Chrome tabs found for profile="user"` → el perfil de conexión Chrome MCP no tiene pestañas locales de Chrome abiertas.
- `Remote CDP for profile "<name>" is not reachable` → el endpoint CDP remoto configurado no es accesible desde el host del gateway.
- `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → el perfil attach-only no tiene un objetivo accesible, o el endpoint HTTP respondió pero aun así no se pudo abrir el WebSocket de CDP.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → la instalación actual del gateway carece de la dependencia de runtime `playwright-core` del plugin incluido de navegador; ejecuta `openclaw doctor --fix` y luego reinicia el gateway. Las instantáneas ARIA y las capturas básicas de página pueden seguir funcionando, pero la navegación, las instantáneas de IA, las capturas de elementos por selector CSS y la exportación PDF seguirán sin estar disponibles.
- `fullPage is not supported for element screenshots` → la solicitud de captura mezcló `--full-page` con `--ref` o `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → las llamadas de captura de pantalla Chrome MCP / `existing-session` deben usar captura de página o un `--ref` de instantánea, no `--element` CSS.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → los hooks de carga de Chrome MCP necesitan referencias de instantánea, no selectores CSS.
- `existing-session file uploads currently support one file at a time.` → envía una carga por llamada en perfiles Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → los hooks de diálogo en perfiles Chrome MCP no admiten anulaciones de tiempo de espera.
- `response body is not supported for existing-session profiles yet.` → `responsebody` todavía requiere un navegador gestionado o un perfil CDP sin procesar.
- anulaciones obsoletas de viewport / modo oscuro / idioma / offline en perfiles attach-only o CDP remotos → ejecuta `openclaw browser stop --browser-profile <name>` para cerrar la sesión de control activa y liberar el estado de emulación de Playwright/CDP sin reiniciar todo el gateway.

Relacionado:

- [/tools/browser-linux-troubleshooting](/es/tools/browser-linux-troubleshooting)
- [/tools/browser](/es/tools/browser)

## Si actualizaste y algo dejó de funcionar de repente

La mayoría de los fallos posteriores a una actualización se deben a desviaciones de configuración o a valores predeterminados más estrictos que ahora se aplican.

### 1) Cambió el comportamiento de las anulaciones de autenticación y URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Qué comprobar:

- Si `gateway.mode=remote`, las llamadas de CLI pueden estar apuntando al remoto mientras tu servicio local está bien.
- Las llamadas explícitas con `--url` no recurren a credenciales almacenadas.

Firmas comunes:

- `gateway connect failed:` → objetivo URL incorrecto.
- `unauthorized` → el endpoint es accesible, pero la autenticación es incorrecta.

### 2) Los límites de bind y autenticación son más estrictos

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Qué comprobar:

- Los binds no loopback (`lan`, `tailnet`, `custom`) necesitan una ruta válida de autenticación del gateway: autenticación con token/contraseña compartidos, o un despliegue `trusted-proxy` no loopback configurado correctamente.
- Las claves antiguas como `gateway.token` no sustituyen a `gateway.auth.token`.

Firmas comunes:

- `refusing to bind gateway ... without auth` → bind no loopback sin una ruta válida de autenticación del gateway.
- `Connectivity probe: failed` mientras el runtime está activo → el gateway está vivo pero inaccesible con la autenticación/url actual.

### 3) Cambió el estado de vinculación e identidad del dispositivo

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Qué comprobar:

- Aprobaciones pendientes de dispositivos para dashboard/nodos.
- Aprobaciones pendientes de vinculación de mensajes directos después de cambios de política o identidad.

Firmas comunes:

- `device identity required` → no se ha satisfecho la autenticación del dispositivo.
- `pairing required` → el remitente/dispositivo debe ser aprobado.

Si la configuración del servicio y el runtime siguen sin coincidir después de las comprobaciones, reinstala los metadatos del servicio desde el mismo directorio de perfil/estado:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Relacionado:

- [/gateway/pairing](/es/gateway/pairing)
- [/gateway/authentication](/es/gateway/authentication)
- [/gateway/background-process](/es/gateway/background-process)

## Relacionado

- [Runbook del Gateway](/es/gateway)
- [Doctor](/es/gateway/doctor)
- [Preguntas frecuentes](/es/help/faq)
