---
read_when:
    - El centro de solución de problemas te remitió aquí para un diagnóstico más profundo
    - Necesitas secciones estables del manual operativo basadas en síntomas con comandos exactos
sidebarTitle: Troubleshooting
summary: Manual detallado de resolución de problemas para Gateway, canales, automatización, nodos y navegador
title: Solución de problemas
x-i18n:
    generated_at: "2026-04-30T05:44:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48735a68daa92678867a9cafb3ceeb37063bb91dee8c4c94e185f74eb0296fcb
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Esta página es el runbook detallado. Empieza en [/help/troubleshooting](/es/help/troubleshooting) si primero quieres el flujo de triaje rápido.

## Escalera de comandos

Ejecuta estos primero, en este orden:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Señales saludables esperadas:

- `openclaw gateway status` muestra `Runtime: running`, `Connectivity probe: ok` y una línea `Capability: ...`.
- `openclaw doctor` no informa problemas bloqueantes de configuración/servicio.
- `openclaw channels status --probe` muestra el estado de transporte en vivo por cuenta y, donde sea compatible, resultados de sondeo/auditoría como `works` o `audit ok`.

## Instalaciones split brain y protección para configuración más nueva

Usa esto cuando un servicio de Gateway se detenga inesperadamente después de una actualización, o los registros muestren que un binario `openclaw` es más antiguo que la versión que escribió `openclaw.json` por última vez.

OpenClaw marca las escrituras de configuración con `meta.lastTouchedVersion`. Los comandos de solo lectura todavía pueden inspeccionar una configuración escrita por un OpenClaw más nuevo, pero las mutaciones de proceso y servicio se niegan a continuar desde un binario más antiguo. Las acciones bloqueadas incluyen iniciar, detener, reiniciar y desinstalar el servicio de Gateway, reinstalación forzada del servicio, inicio del Gateway en modo servicio y limpieza de puertos con `gateway --force`.

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
  <Step title="Reinstalar el servicio de Gateway">
    Reinstala el servicio de Gateway previsto desde la instalación más nueva:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Eliminar wrappers obsoletos">
    Elimina entradas obsoletas del paquete del sistema o de wrappers antiguos que todavía apunten a un binario `openclaw` antiguo.
  </Step>
</Steps>

<Warning>
Solo para degradación intencional o recuperación de emergencia, define `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` para el comando individual. Déjala sin definir para la operación normal.
</Warning>

## Uso adicional requerido de Anthropic 429 para contexto largo

Usa esto cuando los registros/errores incluyan: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Busca:

- El modelo Anthropic Opus/Sonnet seleccionado tiene `params.context1m: true`.
- La credencial actual de Anthropic no es elegible para uso de contexto largo.
- Las solicitudes fallan solo en sesiones largas/ejecuciones de modelo que necesitan la ruta beta de 1M.

Opciones de corrección:

<Steps>
  <Step title="Desactivar context1m">
    Desactiva `context1m` para ese modelo y volver a la ventana de contexto normal.
  </Step>
  <Step title="Usar una credencial elegible">
    Usa una credencial de Anthropic que sea elegible para solicitudes de contexto largo, o cambia a una clave de API de Anthropic.
  </Step>
  <Step title="Configurar modelos de reserva">
    Configura modelos de reserva para que las ejecuciones continúen cuando se rechacen las solicitudes de contexto largo de Anthropic.
  </Step>
</Steps>

Relacionado:

- [Anthropic](/es/providers/anthropic)
- [Uso de tokens y costos](/es/reference/token-use)
- [¿Por qué veo HTTP 429 de Anthropic?](/es/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## El backend local compatible con OpenAI supera sondeos directos, pero las ejecuciones de agente fallan

Usa esto cuando:

- `curl ... /v1/models` funciona
- las llamadas directas diminutas a `/v1/chat/completions` funcionan
- las ejecuciones de modelo de OpenClaw fallan solo en turnos normales de agente

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Busca:

- las llamadas directas diminutas tienen éxito, pero las ejecuciones de OpenClaw fallan solo con prompts más grandes
- errores `model_not_found` o 404 aunque `/v1/chat/completions` directo
  funcione con el mismo id de modelo simple
- errores de backend sobre `messages[].content` que espera una cadena
- advertencias intermitentes `incomplete turn detected ... stopReason=stop payloads=0` con un backend local compatible con OpenAI
- bloqueos del backend que aparecen solo con recuentos de tokens de prompt mayores o prompts completos de runtime de agente

<AccordionGroup>
  <Accordion title="Firmas comunes">
    - `model_not_found` con un servidor local estilo MLX/vLLM → verifica que `baseUrl` incluya `/v1`, que `api` sea `"openai-completions"` para backends `/v1/chat/completions` y que `models.providers.<provider>.models[].id` sea el id local del proveedor simple. Selecciónalo una vez con el prefijo del proveedor, por ejemplo `mlx/mlx-community/Qwen3-30B-A3B-6bit`; conserva la entrada del catálogo como `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → el backend rechaza partes de contenido estructurado de Chat Completions. Corrección: define `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → el backend completó la solicitud de Chat Completions pero no devolvió texto de asistente visible para el usuario en ese turno. OpenClaw reintenta una vez los turnos vacíos compatibles con OpenAI que son seguros para replay; los fallos persistentes normalmente significan que el backend emite contenido vacío/no textual o suprime el texto de respuesta final.
    - las solicitudes directas diminutas tienen éxito, pero las ejecuciones de agente de OpenClaw fallan con bloqueos de backend/modelo (por ejemplo Gemma en algunas compilaciones de `inferrs`) → es probable que el transporte de OpenClaw ya sea correcto; el backend falla con la forma más grande del prompt de runtime de agente.
    - los fallos se reducen después de desactivar herramientas, pero no desaparecen → los esquemas de herramientas eran parte de la presión, pero el problema restante sigue siendo capacidad del modelo/servidor ascendente o un bug del backend.

  </Accordion>
  <Accordion title="Opciones de corrección">
    1. Define `compat.requiresStringContent: true` para backends de Chat Completions que solo admiten cadenas.
    2. Define `compat.supportsTools: false` para modelos/backends que no pueden manejar de forma fiable la superficie de esquema de herramientas de OpenClaw.
    3. Reduce la presión del prompt donde sea posible: bootstrap de workspace más pequeño, historial de sesión más corto, modelo local más ligero o un backend con mejor compatibilidad de contexto largo.
    4. Si las solicitudes directas diminutas siguen pasando mientras los turnos de agente de OpenClaw todavía se bloquean dentro del backend, trátalo como una limitación del servidor/modelo ascendente y presenta allí una reproducción con la forma de payload aceptada.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Configuración](/es/gateway/configuration)
- [Modelos locales](/es/gateway/local-models)
- [Puntos de conexión compatibles con OpenAI](/es/gateway/configuration-reference#openai-compatible-endpoints)

## Sin respuestas

Si los canales están activos pero nada responde, revisa el enrutamiento y la política antes de reconectar nada.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Busca:

- Emparejamiento pendiente para remitentes de MD.
- Control de menciones de grupo (`requireMention`, `mentionPatterns`).
- Desajustes en la lista de permitidos de canal/grupo.

Firmas comunes:

- `drop guild message (mention required` → mensaje de grupo ignorado hasta que haya mención.
- `pairing request` → el remitente necesita aprobación.
- `blocked` / `allowlist` → el remitente/canal fue filtrado por política.

Relacionado:

- [Solución de problemas de canales](/es/channels/troubleshooting)
- [Grupos](/es/channels/groups)
- [Emparejamiento](/es/channels/pairing)

## Conectividad de la interfaz de control del panel

Cuando la interfaz de control/panel no se conecte, valida la URL, el modo de autenticación y los supuestos de contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Busca:

- URL de sondeo y URL de panel correctas.
- Desajuste de modo/token de autenticación entre cliente y Gateway.
- Uso de HTTP donde se requiere identidad de dispositivo.

<AccordionGroup>
  <Accordion title="Firmas de conexión / autenticación">
    - `device identity required` → contexto no seguro o falta autenticación de dispositivo.
    - `origin not allowed` → el `Origin` del navegador no está en `gateway.controlUi.allowedOrigins` (o te estás conectando desde un origen de navegador que no es loopback sin una lista de permitidos explícita).
    - `device nonce required` / `device nonce mismatch` → el cliente no está completando el flujo de autenticación de dispositivo basado en desafío (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → el cliente firmó el payload incorrecto (o una marca de tiempo obsoleta) para el handshake actual.
    - `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → el cliente puede hacer un reintento de confianza con el token de dispositivo en caché.
    - Ese reintento con token en caché reutiliza el conjunto de ámbitos en caché almacenado con el token de dispositivo emparejado. Los llamadores con `deviceToken` explícito / `scopes` explícitos conservan en cambio su conjunto de ámbitos solicitado.
    - Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es primero token/contraseña compartidos explícitos, luego `deviceToken` explícito, luego token de dispositivo almacenado y luego token de bootstrap.
    - En la ruta asíncrona de la interfaz de control de Tailscale Serve, los intentos fallidos para el mismo `{scope, ip}` se serializan antes de que el limitador registre el fallo. Por lo tanto, dos reintentos incorrectos concurrentes del mismo cliente pueden mostrar `retry later` en el segundo intento en lugar de dos simples desajustes.
    - `too many failed authentication attempts (retry later)` desde un cliente de loopback con origen de navegador → los fallos repetidos desde ese mismo `Origin` normalizado se bloquean temporalmente; otro origen de localhost usa un bucket separado.
    - `unauthorized` repetido después de ese reintento → deriva de token compartido/token de dispositivo; actualiza la configuración de token y vuelve a aprobar/rotar el token de dispositivo si es necesario.
    - `gateway connect failed:` → destino incorrecto de host/puerto/url.

  </Accordion>
</AccordionGroup>

### Mapa rápido de códigos de detalle de autenticación

Usa `error.details.code` de la respuesta `connect` fallida para elegir la siguiente acción:

| Código de detalle            | Significado                                                                                                                                                                                   | Acción recomendada                                                                                                                                                                                                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | El cliente no envió un token compartido requerido.                                                                                                                                            | Pega/establece el token en el cliente e inténtalo de nuevo. Para rutas del panel: `openclaw config get gateway.auth.token` y luego pégalo en la configuración de Control UI.                                                                                                             |
| `AUTH_TOKEN_MISMATCH`        | El token compartido no coincidió con el token de autenticación del Gateway.                                                                                                                    | Si `canRetryWithDeviceToken=true`, permite un reintento de confianza. Los reintentos con token en caché reutilizan los ámbitos aprobados almacenados; los llamadores con `deviceToken` / `scopes` explícitos mantienen los ámbitos solicitados. Si sigue fallando, ejecuta la [lista de comprobación de recuperación de deriva de tokens](/es/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | El token en caché por dispositivo está obsoleto o revocado.                                                                                                                                   | Rota/vuelve a aprobar el token del dispositivo usando la [CLI de dispositivos](/es/cli/devices), luego vuelve a conectar.                                                                                                                                                                    |
| `PAIRING_REQUIRED`           | La identidad del dispositivo necesita aprobación. Revisa `error.details.reason` para `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade`, y usa `requestId` / `remediationHint` cuando estén presentes. | Aprueba la solicitud pendiente: `openclaw devices list` y luego `openclaw devices approve <requestId>`. Las actualizaciones de ámbito/rol usan el mismo flujo después de revisar el acceso solicitado.                                                                                   |

<Note>
Las RPC directas de backend sobre loopback autenticadas con el token/contraseña compartidos del Gateway no deberían depender de la línea base de ámbitos de dispositivos emparejados de la CLI. Si los subagentes u otras llamadas internas siguen fallando con `scope-upgrade`, verifica que el llamador use `client.id: "gateway-client"` y `client.mode: "backend"` y que no fuerce una `deviceIdentity` explícita ni un token de dispositivo.
</Note>

Comprobación de migración de autenticación de dispositivos v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si los registros muestran errores de nonce/firma, actualiza el cliente que se conecta y verifícalo:

<Steps>
  <Step title="Wait for connect.challenge">
    El cliente espera el `connect.challenge` emitido por el Gateway.
  </Step>
  <Step title="Sign the payload">
    El cliente firma la carga vinculada al desafío.
  </Step>
  <Step title="Send the device nonce">
    El cliente envía `connect.params.device.nonce` con el mismo nonce del desafío.
  </Step>
</Steps>

Si `openclaw devices rotate` / `revoke` / `remove` se deniega inesperadamente:

- las sesiones con token de dispositivo emparejado solo pueden gestionar **su propio** dispositivo, a menos que el llamador también tenga `operator.admin`
- `openclaw devices rotate --scope ...` solo puede solicitar ámbitos de operador que la sesión del llamador ya tenga

Relacionado:

- [Configuración](/es/gateway/configuration) (modos de autenticación del Gateway)
- [Control UI](/es/web/control-ui)
- [Dispositivos](/es/cli/devices)
- [Acceso remoto](/es/gateway/remote)
- [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)

## El servicio Gateway no está en ejecución

Usa esto cuando el servicio está instalado pero el proceso no se mantiene activo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Busca:

- `Runtime: stopped` con pistas de salida.
- Desajuste de configuración del servicio (`Config (cli)` frente a `Config (service)`).
- Conflictos de puerto/listener.
- Instalaciones adicionales de launchd/systemd/schtasks cuando se usa `--deep`.
- Pistas de limpieza de `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → el modo de Gateway local no está habilitado, o el archivo de configuración se sobrescribió y perdió `gateway.mode`. Solución: establece `gateway.mode="local"` en tu configuración, o vuelve a ejecutar `openclaw onboard --mode local` / `openclaw setup` para volver a sellar la configuración esperada de modo local. Si ejecutas OpenClaw mediante Podman, la ruta de configuración predeterminada es `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → enlace no loopback sin una ruta válida de autenticación del Gateway (token/contraseña, o proxy de confianza donde esté configurado).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflicto de puerto.
    - `Other gateway-like services detected (best effort)` → existen unidades launchd/systemd/schtasks obsoletas o paralelas. La mayoría de configuraciones deberían mantener un Gateway por máquina; si necesitas más de uno, aísla puertos + configuración/estado/espacio de trabajo. Consulta [/gateway#multiple-gateways-same-host](/es/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` desde doctor → existe una unidad de sistema systemd mientras falta el servicio de nivel de usuario. Elimina o deshabilita el duplicado antes de permitir que doctor instale un servicio de usuario, o establece `OPENCLAW_SERVICE_REPAIR_POLICY=external` si la unidad del sistema es el supervisor previsto.
    - `Gateway service port does not match current gateway config` → el supervisor instalado aún fija el antiguo `--port`. Ejecuta `openclaw doctor --fix` o `openclaw gateway install --force`, luego reinicia el servicio Gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Ejecución en segundo plano y herramienta de procesos](/es/gateway/background-process)
- [Configuración](/es/gateway/configuration)
- [Doctor](/es/gateway/doctor)

## Gateway restauró la última configuración válida conocida

Usa esto cuando el Gateway arranca, pero los registros dicen que restauró `openclaw.json`.

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
- Un evento de sistema del agente principal que empieza con `Config recovery warning`

<AccordionGroup>
  <Accordion title="What happened">
    - La configuración rechazada no validó durante el arranque o la recarga en caliente.
    - OpenClaw conservó la carga rechazada como `.clobbered.*`.
    - La configuración activa se restauró desde la última copia validada de la última configuración válida conocida.
    - El siguiente turno del agente principal recibe una advertencia para no reescribir ciegamente la configuración rechazada.
    - Si todos los problemas de validación estaban bajo `plugins.entries.<id>...`, OpenClaw no restauraría todo el archivo. Los fallos locales del Plugin permanecen visibles mientras la configuración de usuario no relacionada sigue en la configuración activa.

  </Accordion>
  <Accordion title="Inspect and repair">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Common signatures">
    - Existe `.clobbered.*` → se restauró una edición directa externa o una lectura de arranque.
    - Existe `.rejected.*` → una escritura de configuración propiedad de OpenClaw falló la validación de esquema o las comprobaciones de sobrescritura antes de confirmar.
    - `Config write rejected:` → la escritura intentó eliminar la estructura requerida, reducir drásticamente el archivo o persistir una configuración no válida.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` o `size-drop-vs-last-good:*` → el arranque trató el archivo actual como sobrescrito porque perdió campos o tamaño en comparación con la copia de seguridad de la última configuración válida conocida.
    - `Config last-known-good promotion skipped` → el candidato contenía marcadores de posición de secretos redactados, como `***`.

  </Accordion>
  <Accordion title="Fix options">
    1. Conserva la configuración activa restaurada si es correcta.
    2. Copia solo las claves previstas desde `.clobbered.*` o `.rejected.*`, luego aplícalas con `openclaw config set` o `config.patch`.
    3. Ejecuta `openclaw config validate` antes de reiniciar.
    4. Si editas a mano, conserva la configuración JSON5 completa, no solo el objeto parcial que querías cambiar.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Config](/es/cli/config)
- [Configuración: recarga en caliente](/es/gateway/configuration#config-hot-reload)
- [Configuración: validación estricta](/es/gateway/configuration#strict-validation)
- [Doctor](/es/gateway/doctor)

## Advertencias de sondeo del Gateway

Usa esto cuando `openclaw gateway probe` alcanza algo, pero aun así imprime un bloque de advertencia.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Busca:

- `warnings[].code` y `primaryTargetId` en la salida JSON.
- Si la advertencia trata sobre respaldo SSH, múltiples Gateway, ámbitos faltantes o referencias de autenticación sin resolver.

Firmas comunes:

- `SSH tunnel failed to start; falling back to direct probes.` → falló la configuración SSH, pero el comando aun así probó objetivos directos configurados/loopback.
- `multiple reachable gateways detected` → respondió más de un objetivo. Normalmente esto significa una configuración intencional de varios Gateway o listeners obsoletos/duplicados.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la conexión funcionó, pero la RPC de detalle está limitada por ámbito; empareja la identidad del dispositivo o usa credenciales con `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → la conexión funcionó, pero el conjunto completo de RPC de diagnóstico agotó el tiempo de espera o falló. Trata esto como un Gateway alcanzable con diagnósticos degradados; compara `connect.ok` y `connect.rpcOk` en la salida `--json`.
- `Capability: pairing-pending` o `gateway closed (1008): pairing required` → el Gateway respondió, pero este cliente aún necesita emparejamiento/aprobación antes del acceso normal de operador.
- texto de advertencia de SecretRef `gateway.auth.*` / `gateway.remote.*` sin resolver → el material de autenticación no estaba disponible en esta ruta de comando para el objetivo fallido.

Relacionado:

- [Gateway](/es/cli/gateway)
- [Múltiples Gateway en el mismo host](/es/gateway#multiple-gateways-same-host)
- [Acceso remoto](/es/gateway/remote)

## Canal conectado, pero los mensajes no fluyen

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
- Permisos/ámbitos faltantes de la API del canal.

Firmas comunes:

- `mention required` → mensaje ignorado por la política de menciones de grupo.
- `pairing` / trazas de aprobación pendiente → el remitente no está aprobado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de autenticación/permisos del canal.

Relacionado:

- [Solución de problemas de canales](/es/channels/troubleshooting)
- [Discord](/es/channels/discord)
- [Telegram](/es/channels/telegram)
- [WhatsApp](/es/channels/whatsapp)

## Entrega de Cron y Heartbeat

Si Cron o Heartbeat no se ejecutó o no entregó, verifica primero el estado del planificador y luego el destino de entrega.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Busca:

- Cron habilitado y próxima activación presente.
- Estado del historial de ejecuciones del trabajo (`ok`, `skipped`, `error`).
- Motivos de omisión de Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Common signatures">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron deshabilitado.
    - `cron: timer tick failed` → falló el tick del planificador; revisa errores de archivo/registro/entorno de ejecución.
    - `heartbeat skipped` con `reason=quiet-hours` → fuera de la ventana de horas activas.
    - `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe pero solo contiene líneas en blanco / encabezados Markdown, por lo que OpenClaw omite la llamada al modelo.
    - `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un bloque `tasks:`, pero ninguna de las tareas vence en este tick.
    - `heartbeat: unknown accountId` → id de cuenta no válido para el destino de entrega de Heartbeat.
    - `heartbeat skipped` con `reason=dm-blocked` → el destino de Heartbeat se resolvió como un destino de tipo MD mientras `agents.defaults.heartbeat.directPolicy` (o la anulación por agente) está configurado en `block`.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Heartbeat](/es/gateway/heartbeat)
- [Tareas programadas](/es/automation/cron-jobs)
- [Tareas programadas: solución de problemas](/es/automation/cron-jobs#troubleshooting)

## Node emparejado, falla la herramienta

Si un Node está emparejado pero las herramientas fallan, aísla el estado de primer plano, permisos y aprobación.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Busca:

- Node en línea con las capacidades esperadas.
- Concesiones de permisos del sistema operativo para cámara/micrófono/ubicación/pantalla.
- Aprobaciones de ejecución y estado de lista de permitidos.

Firmas comunes:

- `NODE_BACKGROUND_UNAVAILABLE` → la app del Node debe estar en primer plano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → falta permiso del sistema operativo.
- `SYSTEM_RUN_DENIED: approval required` → aprobación de ejecución pendiente.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado por la lista de permitidos.

Relacionado:

- [Aprobaciones de ejecución](/es/tools/exec-approvals)
- [Solución de problemas de Node](/es/nodes/troubleshooting)
- [Nodes](/es/nodes/index)

## Falla la herramienta de navegador

Usa esto cuando las acciones de la herramienta de navegador fallen aunque el Gateway esté saludable.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Busca:

- Si `plugins.allow` está configurado e incluye `browser`.
- Ruta válida del ejecutable del navegador.
- Accesibilidad del perfil CDP.
- Disponibilidad local de Chrome para perfiles `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Plugin / executable signatures">
    - `unknown command "browser"` o `unknown command 'browser'` → el plugin de navegador incluido está excluido por `plugins.allow`.
    - falta la herramienta de navegador / no está disponible mientras `browser.enabled=true` → `plugins.allow` excluye `browser`, por lo que el plugin nunca se cargó.
    - `Failed to start Chrome CDP on port` → el proceso del navegador no pudo iniciarse.
    - `browser.executablePath not found` → la ruta configurada no es válida.
    - `browser.cdpUrl must be http(s) or ws(s)` → la URL CDP configurada usa un esquema no compatible, como `file:` o `ftp:`.
    - `browser.cdpUrl has invalid port` → la URL CDP configurada tiene un puerto incorrecto o fuera de rango.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → la instalación actual del Gateway carece de la dependencia de entorno de ejecución `playwright-core` del plugin de navegador incluido; ejecuta `openclaw doctor --fix` y luego reinicia el Gateway. Las instantáneas ARIA y las capturas de pantalla básicas de páginas aún pueden funcionar, pero la navegación, las instantáneas de IA, las capturas de pantalla de elementos con selector CSS y la exportación a PDF siguen sin estar disponibles.

  </Accordion>
  <Accordion title="Chrome MCP / existing-session signatures">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP con sesión existente aún no pudo adjuntarse al directorio de datos del navegador seleccionado. Abre la página de inspección del navegador, habilita la depuración remota, mantén el navegador abierto, aprueba el primer aviso de adjuntar y vuelve a intentarlo. Si no se requiere estado de sesión iniciada, prefiere el perfil administrado `openclaw`.
    - `No Chrome tabs found for profile="user"` → el perfil de adjuntar de Chrome MCP no tiene pestañas locales de Chrome abiertas.
    - `Remote CDP for profile "<name>" is not reachable` → el endpoint CDP remoto configurado no es accesible desde el host del Gateway.
    - `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → el perfil solo adjuntar no tiene un destino accesible, o el endpoint HTTP respondió pero el WebSocket CDP aún no pudo abrirse.

  </Accordion>
  <Accordion title="Element / screenshot / upload signatures">
    - `fullPage is not supported for element screenshots` → la solicitud de captura de pantalla mezcló `--full-page` con `--ref` o `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → las llamadas de captura de pantalla de Chrome MCP / `existing-session` deben usar captura de página o una `--ref` de instantánea, no un `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → los hooks de carga de Chrome MCP necesitan refs de instantánea, no selectores CSS.
    - `existing-session file uploads currently support one file at a time.` → envía una carga por llamada en perfiles de Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → los hooks de diálogo en perfiles de Chrome MCP no admiten anulaciones de tiempo de espera.
    - `existing-session type does not support timeoutMs overrides.` → omite `timeoutMs` para `act:type` en perfiles `profile="user"` / Chrome MCP con sesión existente, o usa un perfil de navegador administrado/CDP cuando se requiera un tiempo de espera personalizado.
    - `existing-session evaluate does not support timeoutMs overrides.` → omite `timeoutMs` para `act:evaluate` en perfiles `profile="user"` / Chrome MCP con sesión existente, o usa un perfil de navegador administrado/CDP cuando se requiera un tiempo de espera personalizado.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` todavía requiere un navegador administrado o un perfil CDP sin procesar.
    - viewport obsoleto / modo oscuro / configuración regional / anulaciones offline en perfiles solo adjuntar o CDP remotos → ejecuta `openclaw browser stop --browser-profile <name>` para cerrar la sesión de control activa y liberar el estado de emulación de Playwright/CDP sin reiniciar todo el Gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Navegador (administrado por OpenClaw)](/es/tools/browser)
- [Solución de problemas del navegador](/es/tools/browser-linux-troubleshooting)

## Si actualizaste y algo se rompió de repente

La mayoría de las roturas posteriores a una actualización son deriva de configuración o valores predeterminados más estrictos que ahora se aplican.

<AccordionGroup>
  <Accordion title="1. Auth and URL override behavior changed">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Qué revisar:

    - Si `gateway.mode=remote`, las llamadas de la CLI pueden estar apuntando al remoto mientras tu servicio local está bien.
    - Las llamadas explícitas con `--url` no recurren a credenciales almacenadas.

    Firmas comunes:

    - `gateway connect failed:` → destino de URL incorrecto.
    - `unauthorized` → endpoint accesible pero autenticación incorrecta.

  </Accordion>
  <Accordion title="2. Bind and auth guardrails are stricter">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Qué revisar:

    - Los enlaces no local loopback (`lan`, `tailnet`, `custom`) necesitan una ruta de autenticación de Gateway válida: autenticación con token/contraseña compartidos, o un despliegue `trusted-proxy` no local loopback configurado correctamente.
    - Las claves antiguas como `gateway.token` no sustituyen a `gateway.auth.token`.

    Firmas comunes:

    - `refusing to bind gateway ... without auth` → enlace no local loopback sin una ruta de autenticación de Gateway válida.
    - `Connectivity probe: failed` mientras el entorno de ejecución está activo → Gateway vivo pero inaccesible con la autenticación/URL actuales.

  </Accordion>
  <Accordion title="3. Pairing and device identity state changed">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Qué revisar:

    - Aprobaciones de dispositivos pendientes para panel/nodos.
    - Aprobaciones de emparejamiento por MD pendientes tras cambios de política o identidad.

    Firmas comunes:

    - `device identity required` → autenticación del dispositivo no satisfecha.
    - `pairing required` → el remitente/dispositivo debe ser aprobado.

  </Accordion>
</AccordionGroup>

Si la configuración del servicio y el entorno de ejecución aún discrepan después de las comprobaciones, reinstala los metadatos del servicio desde el mismo directorio de perfil/estado:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Relacionado:

- [Autenticación](/es/gateway/authentication)
- [Ejecución en segundo plano y herramienta de procesos](/es/gateway/background-process)
- [Emparejamiento propiedad del Gateway](/es/gateway/pairing)

## Relacionado

- [Doctor](/es/gateway/doctor)
- [Preguntas frecuentes](/es/help/faq)
- [Runbook del Gateway](/es/gateway)
