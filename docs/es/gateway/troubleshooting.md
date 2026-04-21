---
read_when:
    - El centro de solución de problemas te envió aquí para un diagnóstico más profundo
    - Necesitas secciones estables de guía basadas en síntomas con comandos exactos
summary: Guía detallada de solución de problemas para Gateway, canales, automatización, Nodes y navegador
title: Solución de problemas
x-i18n:
    generated_at: "2026-04-21T05:15:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2afb105376bb467e5a344e6d73726908cb718fa13116b751fddb494a0b641c42
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Solución de problemas del Gateway

Esta página es la guía detallada.
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
- `openclaw doctor` no informa problemas bloqueantes de configuración/servicio.
- `openclaw channels status --probe` muestra el estado en vivo del transporte por cuenta y,
  donde se admite, resultados de sondeo/auditoría como `works` o `audit ok`.

## Anthropic 429 requiere uso extra para contexto largo

Usa esto cuando los registros/errores incluyan:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Busca:

- El modelo Anthropic Opus/Sonnet seleccionado tiene `params.context1m: true`.
- La credencial actual de Anthropic no es apta para uso de contexto largo.
- Las solicitudes fallan solo en sesiones largas/ejecuciones de modelo que necesitan la ruta beta de 1M.

Opciones de corrección:

1. Desactiva `context1m` para ese modelo para volver a la ventana de contexto normal.
2. Usa una credencial de Anthropic apta para solicitudes de contexto largo, o cambia a una clave API de Anthropic.
3. Configura modelos de respaldo para que las ejecuciones continúen cuando se rechacen las solicitudes de contexto largo de Anthropic.

Relacionado:

- [/providers/anthropic](/es/providers/anthropic)
- [/reference/token-use](/es/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/es/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Un backend local compatible con OpenAI pasa sondeos directos pero fallan las ejecuciones del agente

Usa esto cuando:

- `curl ... /v1/models` funciona
- funcionan llamadas directas pequeñas a `/v1/chat/completions`
- las ejecuciones de modelo de OpenClaw fallan solo en turnos normales del agente

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Busca:

- las llamadas directas pequeñas tienen éxito, pero las ejecuciones de OpenClaw fallan solo con prompts más grandes
- errores del backend sobre `messages[].content` esperando una cadena
- fallos del backend que aparecen solo con recuentos mayores de tokens del prompt o con prompts completos del entorno de ejecución del agente

Firmas comunes:

- `messages[...].content: invalid type: sequence, expected a string` → el backend rechaza partes de contenido estructurado de Chat Completions. Corrección: establece `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- las solicitudes directas pequeñas tienen éxito, pero las ejecuciones del agente OpenClaw fallan con fallos del backend/modelo (por ejemplo Gemma en algunas compilaciones de `inferrs`) → es probable que el transporte de OpenClaw ya sea correcto; el backend está fallando con la forma más grande del prompt del entorno de ejecución del agente.
- los fallos disminuyen tras desactivar tools pero no desaparecen → los esquemas de tools eran parte de la presión, pero el problema restante sigue siendo una limitación ascendente del modelo/servidor o un error del backend.

Opciones de corrección:

1. Establece `compat.requiresStringContent: true` para backends de Chat Completions que solo admiten cadenas.
2. Establece `compat.supportsTools: false` para modelos/backends que no pueden manejar con fiabilidad la superficie de esquemas de tools de OpenClaw.
3. Reduce la presión del prompt cuando sea posible: bootstrap más pequeño del espacio de trabajo, historial de sesión más corto, modelo local más ligero o un backend con mejor soporte de contexto largo.
4. Si las solicitudes directas pequeñas siguen funcionando mientras los turnos del agente OpenClaw siguen fallando dentro del backend, trátalo como una limitación ascendente del servidor/modelo y presenta allí una reproducción con la forma de carga aceptada.

Relacionado:

- [/gateway/local-models](/es/gateway/local-models)
- [/gateway/configuration](/es/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/es/gateway/configuration-reference#openai-compatible-endpoints)

## Sin respuestas

Si los canales están activos pero nada responde, verifica el enrutamiento y la política antes de reconectar nada.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Busca:

- Vinculación pendiente para remitentes de MD.
- Restricción por mención en grupos (`requireMention`, `mentionPatterns`).
- Desajustes de listas de permitidos de canal/grupo.

Firmas comunes:

- `drop guild message (mention required` → mensaje de grupo ignorado hasta que haya mención.
- `pairing request` → el remitente necesita aprobación.
- `blocked` / `allowlist` → el remitente/canal fue filtrado por la política.

Relacionado:

- [/channels/troubleshooting](/es/channels/troubleshooting)
- [/channels/pairing](/es/channels/pairing)
- [/channels/groups](/es/channels/groups)

## Conectividad de la interfaz de control del panel

Cuando el panel/interfaz de control no se conecta, valida la URL, el modo de autenticación y los supuestos de contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Busca:

- URL de sondeo y URL del panel correctas.
- Desajuste de modo de autenticación/token entre cliente y Gateway.
- Uso de HTTP donde se requiere identidad del dispositivo.

Firmas comunes:

- `device identity required` → contexto no seguro o falta autenticación del dispositivo.
- `origin not allowed` → el `Origin` del navegador no está en `gateway.controlUi.allowedOrigins`
  (o te estás conectando desde un origen del navegador que no es loopback sin una
  lista de permitidos explícita).
- `device nonce required` / `device nonce mismatch` → el cliente no está completando el
  flujo de autenticación del dispositivo basado en desafío (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → el cliente firmó la carga incorrecta
  (o una marca de tiempo obsoleta) para el protocolo actual.
- `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → el cliente puede hacer un reintento de confianza con token de dispositivo en caché.
- Ese reintento con token en caché reutiliza el conjunto de alcances en caché almacenado con el token de dispositivo vinculado. Las llamadas con `deviceToken` explícito / `scopes` explícitos conservan en su lugar el conjunto de alcances solicitado.
- Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es:
  token/contraseña compartidos explícitos primero, luego `deviceToken` explícito, luego token de dispositivo almacenado y luego token bootstrap.
- En la ruta asíncrona de Tailscale Serve Control UI, los intentos fallidos para el mismo
  `{scope, ip}` se serializan antes de que el limitador registre el fallo. Dos reintentos
  simultáneos incorrectos del mismo cliente pueden por tanto mostrar `retry later`
  en el segundo intento en lugar de dos desajustes simples.
- `too many failed authentication attempts (retry later)` desde un cliente loopback con origen de navegador
  → los fallos repetidos desde ese mismo `Origin` normalizado se bloquean temporalmente; otro origen localhost usa un bucket independiente.
- `unauthorized` repetido después de ese reintento → desfase del token compartido/token del dispositivo; actualiza la configuración del token y vuelve a aprobar/rotar el token del dispositivo si hace falta.
- `gateway connect failed:` → objetivo host/puerto/url incorrecto.

### Mapa rápido de códigos detallados de autenticación

Usa `error.details.code` de la respuesta fallida de `connect` para elegir la acción siguiente:

| Código detallado             | Significado                                                                                                                                                                                   | Acción recomendada                                                                                                                                                                                                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | El cliente no envió un token compartido requerido.                                                                                                                                            | Pega/configura el token en el cliente y vuelve a intentarlo. Para rutas del panel: `openclaw config get gateway.auth.token` y luego pégalo en la configuración de la Control UI.                                                                                                      |
| `AUTH_TOKEN_MISMATCH`        | El token compartido no coincidió con el token de autenticación del Gateway.                                                                                                                   | Si `canRetryWithDeviceToken=true`, permite un reintento de confianza. Los reintentos con token en caché reutilizan los alcances aprobados almacenados; las llamadas con `deviceToken` / `scopes` explícitos conservan los alcances solicitados. Si sigue fallando, ejecuta la [lista de recuperación por deriva de token](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | El token por dispositivo en caché está obsoleto o revocado.                                                                                                                                   | Rota/vuelve a aprobar el token del dispositivo usando [devices CLI](/cli/devices) y luego vuelve a conectar.                                                                                                                                                                           |
| `PAIRING_REQUIRED`           | La identidad del dispositivo necesita aprobación. Revisa `error.details.reason` para `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade`, y usa `requestId` / `remediationHint` cuando estén presentes. | Aprueba la solicitud pendiente: `openclaw devices list` y luego `openclaw devices approve <requestId>`. Las actualizaciones de alcance/rol usan el mismo flujo después de revisar el acceso solicitado.                                                                               |

Comprobación de migración de autenticación de dispositivo v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si los registros muestran errores de nonce/firma, actualiza el cliente que se conecta y verifica que:

1. espere `connect.challenge`
2. firme la carga vinculada al desafío
3. envíe `connect.params.device.nonce` con el mismo nonce del desafío

Si `openclaw devices rotate` / `revoke` / `remove` se deniega de forma inesperada:

- las sesiones con token de dispositivo vinculado solo pueden gestionar **su propio**
  dispositivo a menos que la llamada también tenga `operator.admin`
- `openclaw devices rotate --scope ...` solo puede solicitar alcances de operador que
  la sesión llamante ya posea

Relacionado:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/es/gateway/configuration) (modos de autenticación del Gateway)
- [/gateway/trusted-proxy-auth](/es/gateway/trusted-proxy-auth)
- [/gateway/remote](/es/gateway/remote)
- [/cli/devices](/cli/devices)

## El servicio Gateway no se está ejecutando

Usa esto cuando el servicio está instalado pero el proceso no se mantiene activo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # también analiza servicios a nivel de sistema
```

Busca:

- `Runtime: stopped` con pistas de salida.
- Desajuste de configuración del servicio (`Config (cli)` vs `Config (service)`).
- Conflictos de puertos/listeners.
- Instalaciones adicionales de launchd/systemd/schtasks cuando se usa `--deep`.
- Sugerencias de limpieza de `Other gateway-like services detected (best effort)`.

Firmas comunes:

- `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → el modo local del Gateway no está habilitado, o el archivo de configuración fue sobrescrito y perdió `gateway.mode`. Corrección: establece `gateway.mode="local"` en tu configuración, o vuelve a ejecutar `openclaw onboard --mode local` / `openclaw setup` para volver a aplicar la configuración esperada de modo local. Si ejecutas OpenClaw mediante Podman, la ruta de configuración predeterminada es `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → enlace no loopback sin una ruta válida de autenticación del Gateway (token/contraseña, o trusted-proxy donde esté configurado).
- `another gateway instance is already listening` / `EADDRINUSE` → conflicto de puerto.
- `Other gateway-like services detected (best effort)` → existen unidades launchd/systemd/schtasks obsoletas o paralelas. La mayoría de configuraciones deben mantener un Gateway por máquina; si realmente necesitas más de uno, aísla puertos + configuración/estado/espacio de trabajo. Consulta [/gateway#multiple-gateways-same-host](/es/gateway#multiple-gateways-same-host).

Relacionado:

- [/gateway/background-process](/es/gateway/background-process)
- [/gateway/configuration](/es/gateway/configuration)
- [/gateway/doctor](/es/gateway/doctor)

## El Gateway restauró la configuración válida más reciente

Usa esto cuando el Gateway se inicia, pero los registros dicen que restauró `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Busca:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Un archivo `openclaw.json.clobbered.*` con marca de tiempo junto a la configuración activa
- Un evento del sistema del agente principal que empiece con `Config recovery warning`

Qué ocurrió:

- La configuración rechazada no pasó la validación durante el inicio o la recarga en caliente.
- OpenClaw preservó la carga rechazada como `.clobbered.*`.
- La configuración activa se restauró desde la última copia validada conocida como correcta.
- Se advierte al siguiente turno del agente principal que no reescriba ciegamente la configuración rechazada.

Inspeccionar y reparar:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Firmas comunes:

- existe `.clobbered.*` → se restauró una edición directa externa o una lectura de inicio.
- existe `.rejected.*` → una escritura de configuración propiedad de OpenClaw falló por esquema o comprobaciones de sobrescritura antes de confirmar.
- `Config write rejected:` → la escritura intentó eliminar la forma requerida, reducir drásticamente el archivo o persistir una configuración no válida.
- `Config last-known-good promotion skipped` → el candidato contenía marcadores de secretos redactados como `***`.

Opciones de corrección:

1. Conserva la configuración activa restaurada si es correcta.
2. Copia solo las claves deseadas desde `.clobbered.*` o `.rejected.*`, y luego aplícalas con `openclaw config set` o `config.patch`.
3. Ejecuta `openclaw config validate` antes de reiniciar.
4. Si editas a mano, conserva la configuración JSON5 completa, no solo el objeto parcial que querías cambiar.

Relacionado:

- [/gateway/configuration#strict-validation](/es/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/es/gateway/configuration#config-hot-reload)
- [/cli/config](/cli/config)
- [/gateway/doctor](/es/gateway/doctor)

## Advertencias del sondeo del Gateway

Usa esto cuando `openclaw gateway probe` alcanza algo, pero aun así imprime un bloque de advertencia.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Busca:

- `warnings[].code` y `primaryTargetId` en la salida JSON.
- Si la advertencia trata sobre respaldo por SSH, múltiples Gateways, alcances faltantes o refs de autenticación no resueltas.

Firmas comunes:

- `SSH tunnel failed to start; falling back to direct probes.` → la configuración de SSH falló, pero el comando aun así probó los destinos directos configurados/loopback.
- `multiple reachable gateways detected` → respondió más de un destino. Normalmente esto significa una configuración intencional con múltiples Gateways o listeners obsoletos/duplicados.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la conexión funcionó, pero el RPC de detalle está limitado por alcance; vincula la identidad del dispositivo o usa credenciales con `operator.read`.
- `Capability: pairing-pending` o `gateway closed (1008): pairing required` → el Gateway respondió, pero este cliente todavía necesita vinculación/aprobación antes del acceso normal de operador.
- texto de advertencia de SecretRef no resuelto en `gateway.auth.*` / `gateway.remote.*` → el material de autenticación no estaba disponible en esta ruta del comando para el destino fallido.

Relacionado:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/es/gateway#multiple-gateways-same-host)
- [/gateway/remote](/es/gateway/remote)

## El canal aparece conectado pero los mensajes no fluyen

Si el estado del canal es conectado pero el flujo de mensajes está muerto, céntrate en la política, los permisos y las reglas de entrega específicas del canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Busca:

- Política de MD (`pairing`, `allowlist`, `open`, `disabled`).
- Lista de permitidos de grupo y requisitos de mención.
- Permisos/alcances faltantes de la API del canal.

Firmas comunes:

- `mention required` → mensaje ignorado por la política de mención del grupo.
- rastros de `pairing` / aprobación pendiente → el remitente no está aprobado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de autenticación/permisos del canal.

Relacionado:

- [/channels/troubleshooting](/es/channels/troubleshooting)
- [/channels/whatsapp](/es/channels/whatsapp)
- [/channels/telegram](/es/channels/telegram)
- [/channels/discord](/es/channels/discord)

## Entrega de Cron y Heartbeat

Si Cron o Heartbeat no se ejecutó o no entregó nada, verifica primero el estado del planificador y luego el destino de entrega.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Busca:

- Cron habilitado y próxima activación presente.
- Estado del historial de ejecución del trabajo (`ok`, `skipped`, `error`).
- Motivos de omisión de Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Firmas comunes:

- `cron: scheduler disabled; jobs will not run automatically` → Cron deshabilitado.
- `cron: timer tick failed` → falló el tick del planificador; revisa errores de archivos/registros/entorno de ejecución.
- `heartbeat skipped` con `reason=quiet-hours` → fuera de la ventana de horas activas.
- `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe pero solo contiene líneas en blanco / encabezados Markdown, así que OpenClaw omite la llamada al modelo.
- `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un bloque `tasks:`, pero ninguna tarea vence en este tick.
- `heartbeat: unknown accountId` → ID de cuenta no válido para el destino de entrega de Heartbeat.
- `heartbeat skipped` con `reason=dm-blocked` → el destino de Heartbeat se resolvió como un destino de tipo MD mientras `agents.defaults.heartbeat.directPolicy` (o la anulación por agente) está establecido en `block`.

Relacionado:

- [/automation/cron-jobs#troubleshooting](/es/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/es/automation/cron-jobs)
- [/gateway/heartbeat](/es/gateway/heartbeat)

## Falla una tool de Node vinculado

Si un Node está vinculado pero las tools fallan, aísla el estado de primer plano, permisos y aprobación.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Busca:

- Node en línea con las capacidades esperadas.
- Permisos del sistema operativo para cámara/micrófono/ubicación/pantalla.
- Aprobaciones de ejecución y estado de lista de permitidos.

Firmas comunes:

- `NODE_BACKGROUND_UNAVAILABLE` → la app del Node debe estar en primer plano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → falta un permiso del sistema operativo.
- `SYSTEM_RUN_DENIED: approval required` → aprobación de ejecución pendiente.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado por la lista de permitidos.

Relacionado:

- [/nodes/troubleshooting](/es/nodes/troubleshooting)
- [/nodes/index](/es/nodes/index)
- [/tools/exec-approvals](/es/tools/exec-approvals)

## Falla la tool del navegador

Usa esto cuando fallan las acciones de la tool del navegador aunque el propio Gateway esté en buen estado.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Busca:

- Si `plugins.allow` está establecido e incluye `browser`.
- Ruta válida del ejecutable del navegador.
- Alcance del perfil CDP.
- Disponibilidad de Chrome local para perfiles `existing-session` / `user`.

Firmas comunes:

- `unknown command "browser"` o `unknown command 'browser'` → el Plugin integrado del navegador está excluido por `plugins.allow`.
- tool del navegador ausente / no disponible mientras `browser.enabled=true` → `plugins.allow` excluye `browser`, así que el Plugin nunca se cargó.
- `Failed to start Chrome CDP on port` → el proceso del navegador no pudo iniciarse.
- `browser.executablePath not found` → la ruta configurada no es válida.
- `browser.cdpUrl must be http(s) or ws(s)` → la URL CDP configurada usa un esquema no compatible como `file:` o `ftp:`.
- `browser.cdpUrl has invalid port` → la URL CDP configurada tiene un puerto incorrecto o fuera de rango.
- `No Chrome tabs found for profile="user"` → el perfil de conexión Chrome MCP no tiene pestañas locales abiertas de Chrome.
- `Remote CDP for profile "<name>" is not reachable` → el endpoint CDP remoto configurado no es accesible desde el host del Gateway.
- `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → el perfil de solo conexión no tiene un destino accesible, o el endpoint HTTP respondió pero aun así no se pudo abrir el WebSocket CDP.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → la instalación actual del Gateway no incluye el paquete completo de Playwright; las instantáneas ARIA y las capturas de pantalla básicas de página pueden seguir funcionando, pero la navegación, las instantáneas de IA, las capturas de elementos por selector CSS y la exportación a PDF seguirán sin estar disponibles.
- `fullPage is not supported for element screenshots` → la solicitud de captura mezcló `--full-page` con `--ref` o `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → las llamadas de captura con Chrome MCP / `existing-session` deben usar captura de página o un `--ref` de instantánea, no `--element` CSS.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → los ganchos de carga de archivos de Chrome MCP necesitan refs de instantánea, no selectores CSS.
- `existing-session file uploads currently support one file at a time.` → envía una carga por llamada en perfiles Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → los ganchos de diálogo en perfiles Chrome MCP no admiten anulaciones de tiempo de espera.
- `response body is not supported for existing-session profiles yet.` → `responsebody` sigue requiriendo un navegador gestionado o un perfil CDP sin procesar.
- anulaciones obsoletas de viewport / modo oscuro / configuración regional / sin conexión en perfiles de solo conexión o CDP remoto → ejecuta `openclaw browser stop --browser-profile <name>` para cerrar la sesión de control activa y liberar el estado de emulación de Playwright/CDP sin reiniciar todo el Gateway.

Relacionado:

- [/tools/browser-linux-troubleshooting](/es/tools/browser-linux-troubleshooting)
- [/tools/browser](/es/tools/browser)

## Si actualizaste y algo se rompió de repente

La mayoría de fallos después de una actualización son deriva de configuración o valores predeterminados más estrictos que ahora se están aplicando.

### 1) Cambió el comportamiento de autenticación y anulación de URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Qué comprobar:

- Si `gateway.mode=remote`, las llamadas CLI pueden estar apuntando al remoto mientras tu servicio local está bien.
- Las llamadas explícitas con `--url` no usan como respaldo las credenciales almacenadas.

Firmas comunes:

- `gateway connect failed:` → destino URL incorrecto.
- `unauthorized` → endpoint accesible pero autenticación incorrecta.

### 2) Las protecciones de enlace y autenticación son más estrictas

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Qué comprobar:

- Los enlaces no loopback (`lan`, `tailnet`, `custom`) necesitan una ruta válida de autenticación del Gateway: autenticación con token/contraseña compartidos, o un despliegue `trusted-proxy` no loopback correctamente configurado.
- Claves antiguas como `gateway.token` no sustituyen a `gateway.auth.token`.

Firmas comunes:

- `refusing to bind gateway ... without auth` → enlace no loopback sin una ruta válida de autenticación del Gateway.
- `Connectivity probe: failed` mientras el entorno de ejecución está activo → el Gateway está vivo pero inaccesible con la autenticación/URL actual.

### 3) Cambió el estado de vinculación e identidad del dispositivo

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Qué comprobar:

- Aprobaciones pendientes de dispositivos para panel/nodes.
- Aprobaciones pendientes de vinculación de MD tras cambios de política o identidad.

Firmas comunes:

- `device identity required` → la autenticación del dispositivo no está satisfecha.
- `pairing required` → el remitente/dispositivo debe ser aprobado.

Si la configuración del servicio y el entorno de ejecución siguen sin coincidir después de las comprobaciones, reinstala los metadatos del servicio desde el mismo directorio de perfil/estado:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Relacionado:

- [/gateway/pairing](/es/gateway/pairing)
- [/gateway/authentication](/es/gateway/authentication)
- [/gateway/background-process](/es/gateway/background-process)
