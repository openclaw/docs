---
read_when:
    - El centro de solución de problemas te indicó venir aquí para un diagnóstico más profundo
    - Necesitas secciones estables del manual de ejecución basadas en síntomas con comandos exactos
sidebarTitle: Troubleshooting
summary: Guía detallada de solución de problemas para gateway, canales, automatización, Nodes y navegador
title: Solución de problemas
x-i18n:
    generated_at: "2026-04-26T11:30:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc6b2a0e8522a761dcee0a3b9bc024eefbd7a5ab4118fc090401868a571bcf
    source_path: gateway/troubleshooting.md
    workflow: 15
---

Esta página es el manual de ejecución detallado. Empieza en [/help/troubleshooting](/es/help/troubleshooting) si primero quieres el flujo rápido de triaje.

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
- `openclaw channels status --probe` muestra estado de transporte activo por cuenta y, cuando corresponde, resultados de sondeo/auditoría como `works` o `audit ok`.

## Instalaciones divididas y protección de configuración más nueva

Usa esto cuando un servicio Gateway se detiene inesperadamente después de una actualización, o los logs muestran que un binario `openclaw` es más antiguo que la versión que escribió por última vez `openclaw.json`.

OpenClaw marca las escrituras de configuración con `meta.lastTouchedVersion`. Los comandos de solo lectura aún pueden inspeccionar una configuración escrita por una versión más nueva de OpenClaw, pero las mutaciones de proceso y servicio se niegan a continuar desde un binario más antiguo. Las acciones bloqueadas incluyen inicio, detención, reinicio y desinstalación del servicio Gateway, reinstalación forzada del servicio, inicio del gateway en modo servicio y limpieza de puerto con `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Corregir PATH">
    Corrige `PATH` para que `openclaw` resuelva a la instalación más nueva y luego vuelve a ejecutar la acción.
  </Step>
  <Step title="Reinstalar el servicio gateway">
    Reinstala el servicio gateway previsto desde la instalación más nueva:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Eliminar wrappers obsoletos">
    Elimina entradas obsoletas de paquetes del sistema o wrappers antiguos que todavía apunten a un binario `openclaw` antiguo.
  </Step>
</Steps>

<Warning>
Solo para degradación intencionada o recuperación de emergencia, establece `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` para ese único comando. Déjalo sin definir en operación normal.
</Warning>

## Anthropic 429 requiere uso adicional para contexto largo

Usa esto cuando los logs/errores incluyan: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Busca lo siguiente:

- El modelo Anthropic Opus/Sonnet seleccionado tiene `params.context1m: true`.
- La credencial actual de Anthropic no es apta para uso de contexto largo.
- Las solicitudes fallan solo en sesiones largas/ejecuciones de modelo que necesitan la ruta beta de 1M.

Opciones de corrección:

<Steps>
  <Step title="Deshabilitar context1m">
    Deshabilita `context1m` para ese modelo y vuelve a la ventana de contexto normal.
  </Step>
  <Step title="Usar una credencial apta">
    Usa una credencial de Anthropic apta para solicitudes de contexto largo, o cambia a una clave API de Anthropic.
  </Step>
  <Step title="Configurar modelos de fallback">
    Configura modelos de fallback para que las ejecuciones continúen cuando se rechacen las solicitudes de contexto largo de Anthropic.
  </Step>
</Steps>

Relacionado:

- [Anthropic](/es/providers/anthropic)
- [Token use and costs](/es/reference/token-use)
- [Why am I seeing HTTP 429 from Anthropic?](/es/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## El backend local compatible con OpenAI supera sondeos directos pero fallan las ejecuciones del agente

Usa esto cuando:

- `curl ... /v1/models` funciona
- las llamadas directas pequeñas a `/v1/chat/completions` funcionan
- las ejecuciones de modelos en OpenClaw fallan solo en turnos normales del agente

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
- fallos del backend que aparecen solo con recuentos más grandes de tokens de prompt o prompts completos del runtime del agente

<AccordionGroup>
  <Accordion title="Firmas comunes">
    - `messages[...].content: invalid type: sequence, expected a string` → el backend rechaza partes estructuradas de contenido de Chat Completions. Solución: establece `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - las solicitudes directas pequeñas tienen éxito, pero las ejecuciones del agente OpenClaw fallan con fallos del backend/modelo (por ejemplo Gemma en algunas compilaciones de `inferrs`) → es probable que el transporte de OpenClaw ya sea correcto; el backend está fallando con la forma más grande del prompt del runtime del agente.
    - los fallos se reducen después de deshabilitar herramientas, pero no desaparecen → los esquemas de herramientas formaban parte de la presión, pero el problema restante sigue siendo una limitación ascendente del servidor/modelo o un error del backend.

  </Accordion>
  <Accordion title="Opciones de corrección">
    1. Establece `compat.requiresStringContent: true` para backends de Chat Completions que solo aceptan contenido en cadena.
    2. Establece `compat.supportsTools: false` para modelos/backends que no pueden manejar de forma fiable la superficie de esquemas de herramientas de OpenClaw.
    3. Reduce la presión del prompt donde sea posible: bootstrap del espacio de trabajo más pequeño, historial de sesión más corto, modelo local más ligero o un backend con mejor compatibilidad con contexto largo.
    4. Si las solicitudes directas pequeñas siguen funcionando mientras los turnos del agente OpenClaw continúan fallando dentro del backend, trátalo como una limitación ascendente del servidor/modelo y presenta allí una reproducción con la forma de carga útil aceptada.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Configuration](/es/gateway/configuration)
- [Local models](/es/gateway/local-models)
- [OpenAI-compatible endpoints](/es/gateway/configuration-reference#openai-compatible-endpoints)

## Sin respuestas

Si los canales están activos pero nada responde, comprueba el enrutamiento y la política antes de volver a conectar nada.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Busca lo siguiente:

- Emparejamiento pendiente para remitentes de mensajes directos.
- Control por mención en grupos (`requireMention`, `mentionPatterns`).
- Desajustes en listas de permitidos de canal/grupo.

Firmas comunes:

- `drop guild message (mention required` → el mensaje de grupo se ignora hasta que haya una mención.
- `pairing request` → el remitente necesita aprobación.
- `blocked` / `allowlist` → el remitente/canal fue filtrado por política.

Relacionado:

- [Channel troubleshooting](/es/channels/troubleshooting)
- [Groups](/es/channels/groups)
- [Pairing](/es/channels/pairing)

## Conectividad de la Control UI del panel

Cuando el panel/la Control UI no se conecta, valida la URL, el modo de autenticación y los supuestos de contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Busca lo siguiente:

- URL de sondeo y URL del panel correctas.
- Desajuste de modo/token de autenticación entre cliente y gateway.
- Uso de HTTP cuando se requiere identidad de dispositivo.

<AccordionGroup>
  <Accordion title="Firmas de conexión/autenticación">
    - `device identity required` → contexto no seguro o falta autenticación de dispositivo.
    - `origin not allowed` → el `Origin` del navegador no está en `gateway.controlUi.allowedOrigins` (o te estás conectando desde un origen de navegador no loopback sin una lista explícita de permitidos).
    - `device nonce required` / `device nonce mismatch` → el cliente no está completando el flujo de autenticación de dispositivo basado en desafío (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → el cliente firmó la carga útil incorrecta (o una marca de tiempo obsoleta) para el handshake actual.
    - `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → el cliente puede hacer un reintento de confianza con token de dispositivo en caché.
    - Ese reintento con token en caché reutiliza el conjunto de alcances almacenado con el token de dispositivo emparejado. Los llamadores con `deviceToken` explícito / `scopes` explícitos conservan en cambio su conjunto de alcances solicitado.
    - Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es primero token/contraseña compartidos explícitos, luego `deviceToken` explícito, luego token de dispositivo almacenado y después token bootstrap.
    - En la ruta asíncrona de Tailscale Serve Control UI, los intentos fallidos del mismo `{scope, ip}` se serializan antes de que el limitador registre el fallo. Por tanto, dos reintentos concurrentes incorrectos del mismo cliente pueden mostrar `retry later` en el segundo intento en lugar de dos desajustes simples.
    - `too many failed authentication attempts (retry later)` desde un cliente loopback de origen de navegador → los fallos repetidos del mismo `Origin` normalizado quedan bloqueados temporalmente; otro origen localhost usa un bucket distinto.
    - `unauthorized` repetido después de ese reintento → deriva de token compartido/token de dispositivo; actualiza la configuración del token y vuelve a aprobar/rotar el token de dispositivo si es necesario.
    - `gateway connect failed:` → destino de host/puerto/url incorrecto.

  </Accordion>
</AccordionGroup>

### Mapa rápido de códigos de detalle de autenticación

Usa `error.details.code` de la respuesta fallida de `connect` para elegir la siguiente acción:

| Código de detalle            | Significado                                                                                                                                                                                   | Acción recomendada                                                                                                                                                                                                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | El cliente no envió un token compartido obligatorio.                                                                                                                                          | Pega/establece el token en el cliente y vuelve a intentarlo. Para rutas del panel: `openclaw config get gateway.auth.token` y luego pégalo en la configuración de la Control UI.                                                                                                      |
| `AUTH_TOKEN_MISMATCH`        | El token compartido no coincide con el token de autenticación del gateway.                                                                                                                    | Si `canRetryWithDeviceToken=true`, permite un reintento de confianza. Los reintentos con token en caché reutilizan alcances aprobados almacenados; los llamadores con `deviceToken` / `scopes` explícitos conservan su conjunto solicitado. Si sigue fallando, ejecuta la [token drift recovery checklist](/es/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | El token por dispositivo en caché está obsoleto o revocado.                                                                                                                                   | Rota/vuelve a aprobar el token de dispositivo usando [devices CLI](/es/cli/devices) y luego reconecta.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | La identidad del dispositivo necesita aprobación. Comprueba `error.details.reason` para `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade`, y usa `requestId` / `remediationHint` cuando estén presentes. | Aprueba la solicitud pendiente: `openclaw devices list` y luego `openclaw devices approve <requestId>`. Las actualizaciones de alcance/rol usan el mismo flujo después de revisar el acceso solicitado.                                                                                |

<Note>
Las RPC directas del backend por loopback autenticadas con el token/contraseña compartidos del gateway no deberían depender de la línea base de alcance de dispositivo emparejado de la CLI. Si los subagentes u otras llamadas internas siguen fallando con `scope-upgrade`, verifica que el llamador use `client.id: "gateway-client"` y `client.mode: "backend"` y que no esté forzando `deviceIdentity` explícito ni token de dispositivo.
</Note>

Comprobación de migración de autenticación de dispositivos v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si los logs muestran errores de nonce/firma, actualiza el cliente que se conecta y verifícalo:

<Steps>
  <Step title="Esperar connect.challenge">
    El cliente espera el `connect.challenge` emitido por el gateway.
  </Step>
  <Step title="Firmar la carga útil">
    El cliente firma la carga útil vinculada al desafío.
  </Step>
  <Step title="Enviar el nonce del dispositivo">
    El cliente envía `connect.params.device.nonce` con el mismo nonce del desafío.
  </Step>
</Steps>

Si `openclaw devices rotate` / `revoke` / `remove` se deniega inesperadamente:

- las sesiones con token de dispositivo emparejado solo pueden gestionar **su propio** dispositivo, a menos que el llamador también tenga `operator.admin`
- `openclaw devices rotate --scope ...` solo puede solicitar alcances de operador que la sesión del llamador ya posea

Relacionado:

- [Configuration](/es/gateway/configuration) (modos de autenticación del gateway)
- [Control UI](/es/web/control-ui)
- [Devices](/es/cli/devices)
- [Remote access](/es/gateway/remote)
- [Trusted proxy auth](/es/gateway/trusted-proxy-auth)

## El servicio Gateway no se está ejecutando

Usa esto cuando el servicio está instalado pero el proceso no permanece activo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # también analiza servicios a nivel del sistema
```

Busca lo siguiente:

- `Runtime: stopped` con indicios de salida.
- Desajuste de configuración del servicio (`Config (cli)` frente a `Config (service)`).
- Conflictos de puertos/listeners.
- Instalaciones adicionales de launchd/systemd/schtasks cuando se usa `--deep`.
- Pistas de limpieza `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Firmas comunes">
    - `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → el modo de gateway local no está habilitado, o el archivo de configuración fue sobrescrito y perdió `gateway.mode`. Solución: establece `gateway.mode="local"` en tu configuración, o vuelve a ejecutar `openclaw onboard --mode local` / `openclaw setup` para volver a marcar la configuración esperada del modo local. Si ejecutas OpenClaw mediante Podman, la ruta predeterminada de configuración es `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → bind no loopback sin una ruta válida de autenticación del gateway (token/contraseña, o trusted-proxy donde esté configurado).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflicto de puertos.
    - `Other gateway-like services detected (best effort)` → existen unidades launchd/systemd/schtasks obsoletas o paralelas. La mayoría de las configuraciones deberían mantener un gateway por máquina; si necesitas más de uno, aísla puertos + configuración/estado/espacio de trabajo. Consulta [/gateway#multiple-gateways-same-host](/es/gateway#multiple-gateways-same-host).

  </Accordion>
</AccordionGroup>

Relacionado:

- [Background exec and process tool](/es/gateway/background-process)
- [Configuration](/es/gateway/configuration)
- [Doctor](/es/gateway/doctor)

## Gateway restauró la configuración de último estado válido conocido

Usa esto cuando el Gateway se inicia, pero los logs dicen que restauró `openclaw.json`.

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
- Un evento del sistema del agente principal que empieza con `Config recovery warning`

<AccordionGroup>
  <Accordion title="Qué ocurrió">
    - La configuración rechazada no pasó la validación durante el inicio o la recarga en caliente.
    - OpenClaw conservó la carga útil rechazada como `.clobbered.*`.
    - La configuración activa se restauró desde la última copia válida conocida.
    - Se advierte al siguiente turno del agente principal que no reescriba a ciegas la configuración rechazada.
    - Si todos los problemas de validación estaban bajo `plugins.entries.<id>...`, OpenClaw no restauraría todo el archivo. Los fallos locales del plugin siguen siendo visibles mientras que la configuración de usuario no relacionada permanece en la configuración activa.

  </Accordion>
  <Accordion title="Inspeccionar y reparar">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Firmas comunes">
    - existe `.clobbered.*` → se restauró una edición directa externa o una lectura de inicio.
    - existe `.rejected.*` → una escritura de configuración propiedad de OpenClaw falló las comprobaciones de esquema o sobrescritura antes del commit.
    - `Config write rejected:` → la escritura intentó eliminar la estructura requerida, reducir drásticamente el tamaño del archivo o persistir una configuración no válida.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` o `size-drop-vs-last-good:*` → el inicio trató el archivo actual como sobrescrito porque perdió campos o tamaño en comparación con la copia de último estado válido conocido.
    - `Config last-known-good promotion skipped` → el candidato contenía marcadores redactados de secretos como `***`.

  </Accordion>
  <Accordion title="Opciones de corrección">
    1. Mantén la configuración activa restaurada si es correcta.
    2. Copia solo las claves previstas desde `.clobbered.*` o `.rejected.*` y luego aplícalas con `openclaw config set` o `config.patch`.
    3. Ejecuta `openclaw config validate` antes de reiniciar.
    4. Si editas a mano, conserva la configuración JSON5 completa, no solo el objeto parcial que querías cambiar.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Config](/es/cli/config)
- [Configuration: hot reload](/es/gateway/configuration#config-hot-reload)
- [Configuration: strict validation](/es/gateway/configuration#strict-validation)
- [Doctor](/es/gateway/doctor)

## Advertencias de sondeo del Gateway

Usa esto cuando `openclaw gateway probe` alcanza algo, pero aun así imprime un bloque de advertencia.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Busca lo siguiente:

- `warnings[].code` y `primaryTargetId` en la salida JSON.
- Si la advertencia trata de fallback SSH, múltiples gateways, alcances faltantes o referencias de autenticación no resueltas.

Firmas comunes:

- `SSH tunnel failed to start; falling back to direct probes.` → la configuración de SSH falló, pero el comando siguió probando destinos directos configurados/loopback.
- `multiple reachable gateways detected` → respondió más de un destino. Normalmente esto significa una configuración intencionada de varios gateways o listeners obsoletos/duplicados.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la conexión funcionó, pero el RPC de detalle está limitado por alcance; empareja la identidad del dispositivo o usa credenciales con `operator.read`.
- `Capability: pairing-pending` o `gateway closed (1008): pairing required` → el gateway respondió, pero este cliente todavía necesita emparejamiento/aprobación antes del acceso normal de operador.
- texto de advertencia de SecretRef `gateway.auth.*` / `gateway.remote.*` no resuelto → el material de autenticación no estaba disponible en esta ruta de comando para el destino fallido.

Relacionado:

- [Gateway](/es/cli/gateway)
- [Multiple gateways on the same host](/es/gateway#multiple-gateways-same-host)
- [Remote access](/es/gateway/remote)

## Canal conectado, pero los mensajes no fluyen

Si el estado del canal es conectado pero el flujo de mensajes está muerto, céntrate en política, permisos y reglas específicas de entrega del canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Busca lo siguiente:

- Política de DM (`pairing`, `allowlist`, `open`, `disabled`).
- Lista de permitidos de grupo y requisitos de mención.
- Permisos/alcances de API del canal faltantes.

Firmas comunes:

- `mention required` → el mensaje se ignoró por la política de mención del grupo.
- rastros de `pairing` / aprobación pendiente → el remitente no está aprobado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de autenticación/permisos del canal.

Relacionado:

- [Channel troubleshooting](/es/channels/troubleshooting)
- [Discord](/es/channels/discord)
- [Telegram](/es/channels/telegram)
- [WhatsApp](/es/channels/whatsapp)

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

- Cron habilitado y siguiente activación presente.
- Estado del historial de ejecución del trabajo (`ok`, `skipped`, `error`).
- Razones de omisión de Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Firmas comunes">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron deshabilitado.
    - `cron: timer tick failed` → falló el tick del programador; revisa errores de archivo/log/runtime.
    - `heartbeat skipped` con `reason=quiet-hours` → fuera de la ventana de horas activas.
    - `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe pero solo contiene líneas en blanco / encabezados markdown, por lo que OpenClaw omite la llamada al modelo.
    - `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un bloque `tasks:`, pero ninguna tarea vence en este tick.
    - `heartbeat: unknown accountId` → ID de cuenta no válido para el destino de entrega de Heartbeat.
    - `heartbeat skipped` con `reason=dm-blocked` → el destino de Heartbeat se resolvió a un destino tipo DM mientras `agents.defaults.heartbeat.directPolicy` (o una anulación por agente) está establecido en `block`.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Heartbeat](/es/gateway/heartbeat)
- [Scheduled tasks](/es/automation/cron-jobs)
- [Scheduled tasks: troubleshooting](/es/automation/cron-jobs#troubleshooting)

## Node emparejado, pero la herramienta falla

Si un Node está emparejado pero fallan las herramientas, aísla el estado de primer plano, permisos y aprobaciones.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Busca lo siguiente:

- Node en línea con las capacidades esperadas.
- Permisos del sistema operativo para cámara/micrófono/ubicación/pantalla.
- Aprobaciones de exec y estado de la lista de permitidos.

Firmas comunes:

- `NODE_BACKGROUND_UNAVAILABLE` → la app Node debe estar en primer plano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → falta un permiso del sistema operativo.
- `SYSTEM_RUN_DENIED: approval required` → aprobación de exec pendiente.
- `SYSTEM_RUN_DENIED: allowlist miss` → el comando fue bloqueado por la lista de permitidos.

Relacionado:

- [Exec approvals](/es/tools/exec-approvals)
- [Node troubleshooting](/es/nodes/troubleshooting)
- [Nodes](/es/nodes/index)

## La herramienta del navegador falla

Usa esto cuando las acciones de la herramienta del navegador fallan aunque el propio gateway esté en buen estado.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Busca lo siguiente:

- Si `plugins.allow` está definido e incluye `browser`.
- Ruta válida al ejecutable del navegador.
- Alcance del perfil CDP.
- Disponibilidad de Chrome local para perfiles `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Firmas de Plugin / ejecutable">
    - `unknown command "browser"` o `unknown command 'browser'` → el Plugin de navegador incluido está excluido por `plugins.allow`.
    - herramienta de navegador ausente / no disponible mientras `browser.enabled=true` → `plugins.allow` excluye `browser`, por lo que el Plugin nunca se cargó.
    - `Failed to start Chrome CDP on port` → el proceso del navegador no pudo iniciarse.
    - `browser.executablePath not found` → la ruta configurada no es válida.
    - `browser.cdpUrl must be http(s) or ws(s)` → la URL CDP configurada usa un esquema no compatible como `file:` o `ftp:`.
    - `browser.cdpUrl has invalid port` → la URL CDP configurada tiene un puerto incorrecto o fuera de rango.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → la instalación actual del gateway no tiene la dependencia de runtime `playwright-core` del Plugin de navegador incluido; ejecuta `openclaw doctor --fix` y luego reinicia el gateway. Las instantáneas ARIA y las capturas básicas de página todavía pueden funcionar, pero la navegación, las instantáneas de IA, las capturas de elementos por selector CSS y la exportación a PDF seguirán sin estar disponibles.

  </Accordion>
  <Accordion title="Firmas de Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → existing-session de Chrome MCP todavía no pudo conectarse al directorio de datos del navegador seleccionado. Abre la página de inspección del navegador, habilita la depuración remota, mantén el navegador abierto, aprueba el primer aviso de conexión y vuelve a intentarlo. Si no necesitas mantener el estado de sesión iniciada, prefiere el perfil gestionado `openclaw`.
    - `No Chrome tabs found for profile="user"` → el perfil de conexión de Chrome MCP no tiene pestañas locales de Chrome abiertas.
    - `Remote CDP for profile "<name>" is not reachable` → no se puede acceder al endpoint CDP remoto configurado desde el host del gateway.
    - `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → el perfil solo de conexión no tiene un destino accesible, o el endpoint HTTP respondió pero aun así no se pudo abrir el WebSocket de CDP.

  </Accordion>
  <Accordion title="Firmas de elemento / captura / carga">
    - `fullPage is not supported for element screenshots` → la solicitud de captura mezcló `--full-page` con `--ref` o `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → las llamadas de captura de Chrome MCP / `existing-session` deben usar captura de página o un `--ref` de una instantánea, no `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → los hooks de carga de Chrome MCP necesitan referencias de instantánea, no selectores CSS.
    - `existing-session file uploads currently support one file at a time.` → envía una carga por llamada en perfiles Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → los hooks de diálogo en perfiles Chrome MCP no admiten anulaciones de tiempo de espera.
    - `existing-session type does not support timeoutMs overrides.` → omite `timeoutMs` para `act:type` en perfiles `profile="user"` / Chrome MCP existing-session, o usa un perfil de navegador gestionado/CDP cuando necesites un tiempo de espera personalizado.
    - `existing-session evaluate does not support timeoutMs overrides.` → omite `timeoutMs` para `act:evaluate` en perfiles `profile="user"` / Chrome MCP existing-session, o usa un perfil de navegador gestionado/CDP cuando necesites un tiempo de espera personalizado.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` todavía requiere un navegador gestionado o un perfil CDP sin procesar.
    - anulaciones obsoletas de viewport / modo oscuro / configuración regional / offline en perfiles attach-only o CDP remotos → ejecuta `openclaw browser stop --browser-profile <name>` para cerrar la sesión de control activa y liberar el estado de emulación de Playwright/CDP sin reiniciar todo el gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Browser (gestionado por OpenClaw)](/es/tools/browser)
- [Browser troubleshooting](/es/tools/browser-linux-troubleshooting)

## Si actualizaste y algo se rompió de repente

La mayoría de los fallos posteriores a una actualización se deben a deriva de configuración o a que ahora se aplican valores predeterminados más estrictos.

<AccordionGroup>
  <Accordion title="1. Cambió el comportamiento de autenticación y sobrescritura de URL">
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

    - `gateway connect failed:` → destino de URL incorrecto.
    - `unauthorized` → se puede acceder al endpoint, pero la autenticación es incorrecta.

  </Accordion>
  <Accordion title="2. Las protecciones de bind y autenticación son más estrictas">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Qué comprobar:

    - Los binds no loopback (`lan`, `tailnet`, `custom`) necesitan una ruta válida de autenticación del gateway: autenticación compartida por token/contraseña, o un despliegue `trusted-proxy` no loopback configurado correctamente.
    - Las claves antiguas como `gateway.token` no reemplazan `gateway.auth.token`.

    Firmas comunes:

    - `refusing to bind gateway ... without auth` → bind no loopback sin una ruta válida de autenticación del gateway.
    - `Connectivity probe: failed` mientras el runtime está en ejecución → el gateway está activo, pero es inaccesible con la autenticación/URL actuales.

  </Accordion>
  <Accordion title="3. Cambió el estado de emparejamiento e identidad del dispositivo">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Qué comprobar:

    - Aprobaciones pendientes de dispositivos para el panel/nodes.
    - Aprobaciones pendientes de emparejamiento de DM después de cambios de política o identidad.

    Firmas comunes:

    - `device identity required` → no se cumple la autenticación del dispositivo.
    - `pairing required` → el remitente/dispositivo debe aprobarse.

  </Accordion>
</AccordionGroup>

Si la configuración del servicio y el runtime siguen sin coincidir después de las comprobaciones, reinstala los metadatos del servicio desde el mismo directorio de perfil/estado:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Relacionado:

- [Authentication](/es/gateway/authentication)
- [Background exec and process tool](/es/gateway/background-process)
- [Gateway-owned pairing](/es/gateway/pairing)

## Relacionado

- [Doctor](/es/gateway/doctor)
- [FAQ](/es/help/faq)
- [Gateway runbook](/es/gateway)
