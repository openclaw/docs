---
read_when:
    - El centro de solución de problemas le indicó este lugar para un diagnóstico más profundo
    - Necesita secciones estables de guía basadas en síntomas con comandos exactos
summary: Guía de solución de problemas en profundidad para Gateway, canales, automatización, Nodes y navegador
title: Solución de problemas
x-i18n:
    generated_at: "2026-04-23T05:15:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 426d90f3f9b693d49694d0bbd6dab2434c726ddd34cd47a753c91096e50ca6d8
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Solución de problemas del Gateway

Esta página es la guía detallada.
Comience en [/help/troubleshooting](/es/help/troubleshooting) si primero quiere el flujo rápido de triaje.

## Escalera de comandos

Ejecute primero estos comandos, en este orden:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Señales esperadas de estado correcto:

- `openclaw gateway status` muestra `Runtime: running`, `Connectivity probe: ok` y una línea `Capability: ...`.
- `openclaw doctor` no informa problemas bloqueantes de configuración/servicios.
- `openclaw channels status --probe` muestra el estado de transporte en vivo por cuenta y,
  cuando se admite, resultados de sonda/auditoría como `works` o `audit ok`.

## Anthropic 429: uso adicional requerido para contexto largo

Use esto cuando los registros/errores incluyan:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Busque:

- El modelo Anthropic Opus/Sonnet seleccionado tiene `params.context1m: true`.
- La credencial actual de Anthropic no es apta para uso de contexto largo.
- Las solicitudes fallan solo en sesiones largas/ejecuciones de modelo que necesitan la ruta beta de 1M.

Opciones de corrección:

1. Deshabilite `context1m` para ese modelo a fin de volver a la ventana de contexto normal.
2. Use una credencial de Anthropic apta para solicitudes de contexto largo, o cambie a una clave de API de Anthropic.
3. Configure modelos de respaldo para que las ejecuciones continúen cuando se rechacen solicitudes de contexto largo de Anthropic.

Relacionado:

- [/providers/anthropic](/es/providers/anthropic)
- [/reference/token-use](/es/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/es/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## El backend local compatible con OpenAI supera las sondas directas pero fallan las ejecuciones del agente

Use esto cuando:

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

Busque:

- las llamadas directas pequeñas se completan correctamente, pero las ejecuciones de OpenClaw fallan solo con prompts más grandes
- errores del backend sobre `messages[].content` que espera una cadena
- fallos del backend que aparecen solo con conteos mayores de tokens del prompt o con prompts completos
  del tiempo de ejecución del agente

Firmas comunes:

- `messages[...].content: invalid type: sequence, expected a string` → el backend
  rechaza partes estructuradas de contenido de Chat Completions. Corrección: establezca
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- las solicitudes directas pequeñas funcionan, pero las ejecuciones del agente de OpenClaw fallan con
  bloqueos del backend/modelo (por ejemplo, Gemma en algunas compilaciones de `inferrs`) → el transporte de OpenClaw
  probablemente ya sea correcto; el backend está fallando con la forma del prompt más grande del tiempo de ejecución del agente.
- los fallos disminuyen después de deshabilitar herramientas pero no desaparecen → los esquemas de herramientas
  formaban parte de la presión, pero el problema restante sigue siendo una limitación del modelo/servidor ascendente
  o un error del backend.

Opciones de corrección:

1. Establezca `compat.requiresStringContent: true` para backends de Chat Completions que solo admiten cadenas.
2. Establezca `compat.supportsTools: false` para modelos/backends que no puedan manejar
   de forma confiable la superficie de esquemas de herramientas de OpenClaw.
3. Reduzca la presión del prompt donde sea posible: bootstrap del espacio de trabajo más pequeño, historial
   de sesión más corto, modelo local más ligero o un backend con mayor compatibilidad
   con contexto largo.
4. Si las solicitudes directas pequeñas siguen funcionando mientras los turnos del agente de OpenClaw todavía fallan
   dentro del backend, trátelo como una limitación del servidor/modelo ascendente y presente
   allí una reproducción con la forma de carga útil aceptada.

Relacionado:

- [/gateway/local-models](/es/gateway/local-models)
- [/gateway/configuration](/es/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/es/gateway/configuration-reference#openai-compatible-endpoints)

## Sin respuestas

Si los canales están activos pero no responde nada, revise el enrutamiento y la política antes de reconectar nada.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Busque:

- Emparejamiento pendiente para remitentes de mensajes directos.
- Restricción por mención en grupos (`requireMention`, `mentionPatterns`).
- Desajustes en la lista de permitidos del canal/grupo.

Firmas comunes:

- `drop guild message (mention required` → el mensaje de grupo se ignora hasta que haya una mención.
- `pairing request` → el remitente necesita aprobación.
- `blocked` / `allowlist` → el remitente/canal fue filtrado por la política.

Relacionado:

- [/channels/troubleshooting](/es/channels/troubleshooting)
- [/channels/pairing](/es/channels/pairing)
- [/channels/groups](/es/channels/groups)

## Conectividad de la interfaz de usuario de dashboard/control

Cuando la interfaz de usuario de dashboard/control no se conecta, valide la URL, el modo de autenticación y los supuestos de contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Busque:

- URL de sonda y URL del dashboard correctas.
- Desajuste de modo/token de autenticación entre cliente y Gateway.
- Uso de HTTP donde se requiere identidad del dispositivo.

Firmas comunes:

- `device identity required` → contexto no seguro o falta autenticación del dispositivo.
- `origin not allowed` → el `Origin` del navegador no está en `gateway.controlUi.allowedOrigins`
  (o se está conectando desde un origen del navegador que no es loopback sin una
  lista de permitidos explícita).
- `device nonce required` / `device nonce mismatch` → el cliente no está completando el
  flujo de autenticación de dispositivo basado en desafío (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → el cliente firmó la carga útil incorrecta
  (o una marca de tiempo obsoleta) para el protocolo de enlace actual.
- `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → el cliente puede hacer un reintento confiable con el token de dispositivo en caché.
- Ese reintento con token en caché reutiliza el conjunto de ámbitos en caché almacenado con el
  token de dispositivo emparejado. Los llamadores con `deviceToken` explícito / `scopes` explícitos mantienen su
  conjunto de ámbitos solicitado.
- Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es primero el
  token/contraseña compartidos explícitos, luego `deviceToken` explícito, después el token de dispositivo almacenado
  y por último el token de bootstrap.
- En la ruta asíncrona de Tailscale Serve Control UI, los intentos fallidos para el mismo
  `{scope, ip}` se serializan antes de que el limitador registre el fallo. Por lo tanto, dos reintentos simultáneos incorrectos del mismo cliente pueden mostrar `retry later`
  en el segundo intento en lugar de dos desajustes simples.
- `too many failed authentication attempts (retry later)` desde un cliente loopback de origen de navegador
  → los fallos repetidos desde ese mismo `Origin` normalizado se bloquean temporalmente; otro origen localhost usa un contenedor separado.
- `unauthorized` repetido después de ese reintento → desajuste del token compartido/token del dispositivo; actualice la configuración del token y vuelva a aprobar/rotar el token de dispositivo si es necesario.
- `gateway connect failed:` → host/puerto/objetivo de URL incorrecto.

### Mapa rápido de códigos detallados de autenticación

Use `error.details.code` de la respuesta fallida de `connect` para elegir la siguiente acción:

| Detail code                  | Meaning                                                                                                                                                                                      | Recommended action                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | El cliente no envió un token compartido requerido.                                                                                                                                            | Pegue/establezca el token en el cliente y vuelva a intentarlo. Para rutas del dashboard: `openclaw config get gateway.auth.token` y luego péguelo en la configuración de Control UI.                                                                                                  |
| `AUTH_TOKEN_MISMATCH`        | El token compartido no coincidía con el token de autenticación del Gateway.                                                                                                                  | Si `canRetryWithDeviceToken=true`, permita un reintento confiable. Los reintentos con token en caché reutilizan los ámbitos aprobados almacenados; los llamadores con `deviceToken` / `scopes` explícitos mantienen los ámbitos solicitados. Si sigue fallando, ejecute la [lista de comprobación de recuperación de deriva de token](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | El token por dispositivo en caché está obsoleto o revocado.                                                                                                                                  | Rote/vuelva a aprobar el token del dispositivo mediante la [CLI de devices](/cli/devices), luego vuelva a conectar.                                                                                                                                                                    |
| `PAIRING_REQUIRED`           | La identidad del dispositivo necesita aprobación. Revise `error.details.reason` para `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade`, y use `requestId` / `remediationHint` cuando estén presentes. | Apruebe la solicitud pendiente: `openclaw devices list` y luego `openclaw devices approve <requestId>`. Las actualizaciones de ámbito/rol usan el mismo flujo después de revisar el acceso solicitado.                                                                                |

Comprobación de migración a la autenticación de dispositivo v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si los registros muestran errores de nonce/firma, actualice el cliente que se está conectando y verifique que:

1. espere `connect.challenge`
2. firme la carga útil ligada al desafío
3. envíe `connect.params.device.nonce` con el mismo nonce del desafío

Si `openclaw devices rotate` / `revoke` / `remove` se deniega inesperadamente:

- las sesiones con token de dispositivo emparejado solo pueden administrar **su propio** dispositivo, a menos que el
  llamador también tenga `operator.admin`
- `openclaw devices rotate --scope ...` solo puede solicitar ámbitos de operador que
  la sesión del llamador ya posea

Relacionado:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/es/gateway/configuration) (modos de autenticación del Gateway)
- [/gateway/trusted-proxy-auth](/es/gateway/trusted-proxy-auth)
- [/gateway/remote](/es/gateway/remote)
- [/cli/devices](/cli/devices)

## El servicio Gateway no se está ejecutando

Use esto cuando el servicio está instalado pero el proceso no permanece activo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # también explora servicios a nivel del sistema
```

Busque:

- `Runtime: stopped` con pistas de salida.
- Desajuste de configuración del servicio (`Config (cli)` vs `Config (service)`).
- Conflictos de puerto/escucha.
- Instalaciones extra de launchd/systemd/schtasks cuando se usa `--deep`.
- Sugerencias de limpieza de `Other gateway-like services detected (best effort)`.

Firmas comunes:

- `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → el modo Gateway local no está habilitado, o el archivo de configuración fue sobrescrito y perdió `gateway.mode`. Corrección: establezca `gateway.mode="local"` en su configuración, o vuelva a ejecutar `openclaw onboard --mode local` / `openclaw setup` para volver a sellar la configuración esperada de modo local. Si está ejecutando OpenClaw mediante Podman, la ruta de configuración predeterminada es `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → enlace fuera de loopback sin una ruta de autenticación válida del Gateway (token/contraseña, o trusted-proxy cuando esté configurado).
- `another gateway instance is already listening` / `EADDRINUSE` → conflicto de puerto.
- `Other gateway-like services detected (best effort)` → existen unidades launchd/systemd/schtasks obsoletas o paralelas. La mayoría de las configuraciones deberían mantener un Gateway por máquina; si necesita más de uno, aísle puertos + configuración/estado/espacio de trabajo. Consulte [/gateway#multiple-gateways-same-host](/es/gateway#multiple-gateways-same-host).

Relacionado:

- [/gateway/background-process](/es/gateway/background-process)
- [/gateway/configuration](/es/gateway/configuration)
- [/gateway/doctor](/es/gateway/doctor)

## El Gateway restauró la última configuración válida conocida

Use esto cuando el Gateway se inicia, pero los registros indican que restauró `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Busque:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Un archivo `openclaw.json.clobbered.*` con marca de tiempo junto a la configuración activa
- Un evento del sistema del agente principal que comienza con `Config recovery warning`

Qué ocurrió:

- La configuración rechazada no superó la validación durante el inicio o la recarga en caliente.
- OpenClaw conservó la carga útil rechazada como `.clobbered.*`.
- La configuración activa se restauró desde la última copia válida conocida y validada.
- En el siguiente turno del agente principal se advierte que no reescriba ciegamente la configuración rechazada.

Inspeccione y repare:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Firmas comunes:

- existe `.clobbered.*` → se restauró una edición directa externa o una lectura durante el inicio.
- existe `.rejected.*` → una escritura de configuración propiedad de OpenClaw falló las comprobaciones de esquema o sobrescritura antes de confirmar.
- `Config write rejected:` → la escritura intentó eliminar una forma requerida, reducir drásticamente el archivo o conservar una configuración no válida.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` o `size-drop-vs-last-good:*` → durante el inicio se trató el archivo actual como sobrescrito porque perdió campos o tamaño en comparación con la copia de respaldo de la última configuración válida conocida.
- `Config last-known-good promotion skipped` → el candidato contenía marcadores de posición de secretos redactados como `***`.

Opciones de corrección:

1. Mantenga la configuración activa restaurada si es correcta.
2. Copie solo las claves deseadas desde `.clobbered.*` o `.rejected.*`, luego aplíquelas con `openclaw config set` o `config.patch`.
3. Ejecute `openclaw config validate` antes de reiniciar.
4. Si edita a mano, conserve la configuración JSON5 completa, no solo el objeto parcial que quería cambiar.

Relacionado:

- [/gateway/configuration#strict-validation](/es/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/es/gateway/configuration#config-hot-reload)
- [/cli/config](/cli/config)
- [/gateway/doctor](/es/gateway/doctor)

## Advertencias de sonda del Gateway

Use esto cuando `openclaw gateway probe` alcanza algo, pero aun así imprime un bloque de advertencia.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Busque:

- `warnings[].code` y `primaryTargetId` en la salida JSON.
- Si la advertencia es sobre respaldo SSH, varios Gateways, ámbitos faltantes o referencias de autenticación no resueltas.

Firmas comunes:

- `SSH tunnel failed to start; falling back to direct probes.` → la configuración SSH falló, pero el comando igualmente intentó sondas directas configuradas/de loopback.
- `multiple reachable gateways detected` → respondió más de un objetivo. Normalmente esto significa una configuración intencional con varios Gateways o escuchas obsoletas/duplicadas.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la conexión funcionó, pero el RPC detallado está limitado por el ámbito; empareje la identidad del dispositivo o use credenciales con `operator.read`.
- `Capability: pairing-pending` o `gateway closed (1008): pairing required` → el Gateway respondió, pero este cliente aún necesita emparejamiento/aprobación antes del acceso normal de operador.
- texto de advertencia no resuelto de SecretRef `gateway.auth.*` / `gateway.remote.*` → el material de autenticación no estaba disponible en esta ruta de comando para el objetivo fallido.

Relacionado:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/es/gateway#multiple-gateways-same-host)
- [/gateway/remote](/es/gateway/remote)

## El canal está conectado pero los mensajes no fluyen

Si el estado del canal es conectado pero el flujo de mensajes está detenido, céntrese en la política, los permisos y las reglas de entrega específicas del canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Busque:

- Política de mensajes directos (`pairing`, `allowlist`, `open`, `disabled`).
- Lista de permitidos de grupos y requisitos de mención.
- Faltan permisos/ámbitos de API del canal.

Firmas comunes:

- `mention required` → el mensaje se ignora por la política de mención en grupos.
- trazas de `pairing` / aprobación pendiente → el remitente no está aprobado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de autenticación/permisos del canal.

Relacionado:

- [/channels/troubleshooting](/es/channels/troubleshooting)
- [/channels/whatsapp](/es/channels/whatsapp)
- [/channels/telegram](/es/channels/telegram)
- [/channels/discord](/es/channels/discord)

## Entrega de Cron y Heartbeat

Si Cron o Heartbeat no se ejecutaron o no se entregaron, verifique primero el estado del programador y luego el objetivo de entrega.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Busque:

- Cron habilitado y próxima activación presente.
- Estado del historial de ejecución del trabajo (`ok`, `skipped`, `error`).
- Motivos de omisión de Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Firmas comunes:

- `cron: scheduler disabled; jobs will not run automatically` → Cron deshabilitado.
- `cron: timer tick failed` → falló el tick del programador; revise errores de archivo/registro/tiempo de ejecución.
- `heartbeat skipped` con `reason=quiet-hours` → fuera de la ventana de horas activas.
- `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe pero solo contiene líneas en blanco/encabezados markdown, por lo que OpenClaw omite la llamada al modelo.
- `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un bloque `tasks:`, pero ninguna de las tareas vence en este tick.
- `heartbeat: unknown accountId` → ID de cuenta no válido para el objetivo de entrega de Heartbeat.
- `heartbeat skipped` con `reason=dm-blocked` → el objetivo de Heartbeat se resolvió como un destino de tipo mensaje directo mientras `agents.defaults.heartbeat.directPolicy` (o la anulación por agente) está establecido en `block`.

Relacionado:

- [/automation/cron-jobs#troubleshooting](/es/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/es/automation/cron-jobs)
- [/gateway/heartbeat](/es/gateway/heartbeat)

## Falla una herramienta de Node emparejado

Si un Node está emparejado pero fallan las herramientas, aísle el estado de primer plano, permisos y aprobación.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Busque:

- Node en línea con las capacidades esperadas.
- Permisos del sistema operativo para cámara/micrófono/ubicación/pantalla.
- Estado de aprobaciones de ejecución y de la lista de permitidos.

Firmas comunes:

- `NODE_BACKGROUND_UNAVAILABLE` → la aplicación del Node debe estar en primer plano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → falta un permiso del sistema operativo.
- `SYSTEM_RUN_DENIED: approval required` → aprobación de ejecución pendiente.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado por la lista de permitidos.

Relacionado:

- [/nodes/troubleshooting](/es/nodes/troubleshooting)
- [/nodes/index](/es/nodes/index)
- [/tools/exec-approvals](/es/tools/exec-approvals)

## Falla la herramienta del navegador

Use esto cuando fallen las acciones de la herramienta del navegador aunque el propio Gateway esté en buen estado.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Busque:

- Si `plugins.allow` está establecido e incluye `browser`.
- Ruta válida del ejecutable del navegador.
- Accesibilidad del perfil CDP.
- Disponibilidad de Chrome local para perfiles `existing-session` / `user`.

Firmas comunes:

- `unknown command "browser"` o `unknown command 'browser'` → el Plugin de navegador incluido está excluido por `plugins.allow`.
- herramienta de navegador ausente / no disponible mientras `browser.enabled=true` → `plugins.allow` excluye `browser`, por lo que el Plugin nunca se cargó.
- `Failed to start Chrome CDP on port` → el proceso del navegador no se pudo iniciar.
- `browser.executablePath not found` → la ruta configurada no es válida.
- `browser.cdpUrl must be http(s) or ws(s)` → la URL CDP configurada usa un esquema no admitido como `file:` o `ftp:`.
- `browser.cdpUrl has invalid port` → la URL CDP configurada tiene un puerto incorrecto o fuera de rango.
- `Could not find DevToolsActivePort for chrome` → la sesión existente de Chrome MCP aún no pudo adjuntarse al directorio de datos del navegador seleccionado. Abra la página de inspección del navegador, habilite la depuración remota, mantenga el navegador abierto, apruebe el primer aviso de adjuntar y vuelva a intentarlo. Si no se requiere un estado de inicio de sesión, prefiera el perfil administrado `openclaw`.
- `No Chrome tabs found for profile="user"` → el perfil de adjuntar Chrome MCP no tiene pestañas locales abiertas de Chrome.
- `Remote CDP for profile "<name>" is not reachable` → el extremo CDP remoto configurado no es accesible desde el host del Gateway.
- `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → el perfil solo de adjuntar no tiene un objetivo accesible, o el extremo HTTP respondió pero aun así no se pudo abrir el WebSocket CDP.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → la instalación actual del Gateway no tiene la dependencia de tiempo de ejecución `playwright-core` del Plugin de navegador incluido; ejecute `openclaw doctor --fix`, luego reinicie el Gateway. Las instantáneas ARIA y las capturas básicas de página aún pueden funcionar, pero la navegación, las instantáneas de IA, las capturas de elementos con selector CSS y la exportación a PDF seguirán sin estar disponibles.
- `fullPage is not supported for element screenshots` → la solicitud de captura mezcló `--full-page` con `--ref` o `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → las llamadas de captura de Chrome MCP / `existing-session` deben usar captura de página o un `--ref` de instantánea, no `--element` CSS.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → los hooks de carga de archivos de Chrome MCP necesitan referencias de instantánea, no selectores CSS.
- `existing-session file uploads currently support one file at a time.` → envíe una carga por llamada en perfiles Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → los hooks de diálogo en perfiles Chrome MCP no admiten anulaciones de tiempo de espera.
- `response body is not supported for existing-session profiles yet.` → `responsebody` sigue requiriendo un navegador administrado o un perfil CDP sin procesar.
- anulaciones obsoletas de viewport / modo oscuro / configuración regional / fuera de línea en perfiles attach-only o CDP remotos → ejecute `openclaw browser stop --browser-profile <name>` para cerrar la sesión de control activa y liberar el estado de emulación Playwright/CDP sin reiniciar todo el Gateway.

Relacionado:

- [/tools/browser-linux-troubleshooting](/es/tools/browser-linux-troubleshooting)
- [/tools/browser](/es/tools/browser)

## Si actualizó y algo se rompió de repente

La mayoría de los fallos posteriores a una actualización se deben a deriva de configuración o a valores predeterminados más estrictos que ahora se hacen cumplir.

### 1) Cambió el comportamiento de autenticación y anulación de URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Qué comprobar:

- Si `gateway.mode=remote`, las llamadas de la CLI pueden estar apuntando al remoto mientras su servicio local está bien.
- Las llamadas explícitas con `--url` no recurren a las credenciales almacenadas.

Firmas comunes:

- `gateway connect failed:` → objetivo de URL incorrecto.
- `unauthorized` → el extremo es accesible pero la autenticación es incorrecta.

### 2) Las barreras de protección para enlace y autenticación son más estrictas

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Qué comprobar:

- Los enlaces fuera de loopback (`lan`, `tailnet`, `custom`) necesitan una ruta válida de autenticación del Gateway: autenticación con token/contraseña compartidos, o una implementación `trusted-proxy` fuera de loopback configurada correctamente.
- Las claves antiguas como `gateway.token` no sustituyen a `gateway.auth.token`.

Firmas comunes:

- `refusing to bind gateway ... without auth` → enlace fuera de loopback sin una ruta válida de autenticación del Gateway.
- `Connectivity probe: failed` mientras el tiempo de ejecución está activo → el Gateway está vivo pero inaccesible con la autenticación/URL actuales.

### 3) Cambió el estado de emparejamiento e identidad del dispositivo

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Qué comprobar:

- Aprobaciones pendientes de dispositivos para dashboard/nodes.
- Aprobaciones pendientes de emparejamiento de mensajes directos después de cambios de política o identidad.

Firmas comunes:

- `device identity required` → no se satisfizo la autenticación del dispositivo.
- `pairing required` → el remitente/dispositivo debe estar aprobado.

Si la configuración del servicio y el tiempo de ejecución siguen sin coincidir después de las comprobaciones, reinstale los metadatos del servicio desde el mismo directorio de perfil/estado:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Relacionado:

- [/gateway/pairing](/es/gateway/pairing)
- [/gateway/authentication](/es/gateway/authentication)
- [/gateway/background-process](/es/gateway/background-process)
