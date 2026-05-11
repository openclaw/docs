---
read_when:
    - El centro de solución de problemas te dirigió aquí para un diagnóstico más profundo
    - Necesitas secciones de runbook estables basadas en síntomas con comandos exactos
sidebarTitle: Troubleshooting
summary: Guía operativa avanzada de solución de problemas para Gateway, canales, automatización, nodos y navegador
title: Solución de problemas
x-i18n:
    generated_at: "2026-05-11T20:37:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 146a593493ce265da9a24660e8a9fc2effa25cae16cf00bf77cc1f2fec84275d
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Esta página es el runbook detallado. Empieza en [/help/troubleshooting](/es/help/troubleshooting) si primero quieres el flujo de triaje rápido.

## Escalera de comandos

Ejecuta esto primero, en este orden:

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
- `openclaw channels status --probe` muestra el estado de transporte en vivo por cuenta y, donde se admita, resultados de prueba/auditoría como `works` o `audit ok`.

## Instalaciones divididas y protección de configuración más reciente

Usa esto cuando un servicio de Gateway se detiene inesperadamente después de una actualización, o los registros muestran que un binario `openclaw` es más antiguo que la versión que escribió por última vez `openclaw.json`.

OpenClaw marca las escrituras de configuración con `meta.lastTouchedVersion`. Los comandos de solo lectura aún pueden inspeccionar una configuración escrita por un OpenClaw más reciente, pero las mutaciones de procesos y servicios se niegan a continuar desde un binario más antiguo. Las acciones bloqueadas incluyen iniciar, detener, reiniciar y desinstalar el servicio de Gateway, reinstalación forzada del servicio, arranque del Gateway en modo servicio y limpieza de puertos con `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Corregir PATH">
    Corrige `PATH` para que `openclaw` se resuelva a la instalación más reciente, y luego vuelve a ejecutar la acción.
  </Step>
  <Step title="Reinstalar el servicio de Gateway">
    Reinstala el servicio de Gateway previsto desde la instalación más reciente:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Eliminar wrappers obsoletos">
    Elimina el paquete del sistema obsoleto o las entradas de wrapper antiguas que todavía apuntan a un binario `openclaw` antiguo.
  </Step>
</Steps>

<Warning>
Solo para degradaciones intencionales o recuperación de emergencia, establece `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` para el comando único. Déjalo sin establecer para la operación normal.
</Warning>

## Symlink de Skill omitido por escape de ruta

Usa esto cuando los registros incluyan:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw trata cada raíz de Skills como un límite de contención. Se omite un symlink bajo
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` o
`~/.openclaw/skills` cuando su destino real se resuelve fuera de esa raíz
a menos que el destino sea explícitamente de confianza.

Inspecciona el enlace:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Si el destino es intencional, configura tanto la raíz directa de Skills como el
destino de symlink permitido:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Luego inicia una sesión nueva o espera a que el observador de Skills se actualice. Reinicia el
Gateway si el proceso en ejecución es anterior al cambio de configuración.

No uses destinos amplios como `~`, `/` o toda una carpeta de proyecto sincronizada.
Mantén `allowSymlinkTargets` limitado a la raíz real de Skills que contiene directorios
`SKILL.md` de confianza.

Relacionado:

- [Configuración de Skills](/es/tools/skills-config#symlinked-sibling-repos)
- [Ejemplos de configuración](/es/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 requiere uso adicional para contexto largo

Usa esto cuando los registros/errores incluyan: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Busca:

- El modelo Anthropic Opus/Sonnet seleccionado tiene `params.context1m: true`.
- La credencial actual de Anthropic no es apta para uso con contexto largo.
- Las solicitudes fallan solo en sesiones/ejecuciones de modelo largas que necesitan la ruta beta de 1M.

Opciones de corrección:

<Steps>
  <Step title="Desactivar context1m">
    Desactiva `context1m` para ese modelo y vuelve a la ventana de contexto normal.
  </Step>
  <Step title="Usar una credencial apta">
    Usa una credencial de Anthropic apta para solicitudes de contexto largo, o cambia a una clave de API de Anthropic.
  </Step>
  <Step title="Configurar modelos de respaldo">
    Configura modelos de respaldo para que las ejecuciones continúen cuando se rechacen las solicitudes de contexto largo de Anthropic.
  </Step>
</Steps>

Relacionado:

- [Anthropic](/es/providers/anthropic)
- [Uso de tokens y costos](/es/reference/token-use)
- [¿Por qué veo HTTP 429 de Anthropic?](/es/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend local compatible con OpenAI pasa pruebas directas pero fallan las ejecuciones del agente

Usa esto cuando:

- `curl ... /v1/models` funciona
- las llamadas directas pequeñas a `/v1/chat/completions` funcionan
- las ejecuciones de modelos de OpenClaw fallan solo en turnos normales del agente

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Busca:

- las llamadas directas pequeñas funcionan, pero las ejecuciones de OpenClaw fallan solo con prompts más grandes
- errores `model_not_found` o 404 aunque `/v1/chat/completions` directo
  funcione con el mismo id de modelo sin prefijo
- errores del backend sobre `messages[].content` que esperan una cadena
- advertencias intermitentes `incomplete turn detected ... stopReason=stop payloads=0` con un backend local compatible con OpenAI
- fallos del backend que aparecen solo con conteos mayores de tokens de prompt o prompts completos de tiempo de ejecución del agente

<AccordionGroup>
  <Accordion title="Firmas comunes">
    - `model_not_found` con un servidor local estilo MLX/vLLM → verifica que `baseUrl` incluya `/v1`, que `api` sea `"openai-completions"` para backends `/v1/chat/completions`, y que `models.providers.<provider>.models[].id` sea el id local del proveedor sin prefijo. Selecciónalo con el prefijo del proveedor una vez, por ejemplo `mlx/mlx-community/Qwen3-30B-A3B-6bit`; mantén la entrada del catálogo como `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → el backend rechaza partes de contenido estructuradas de Chat Completions. Corrección: establece `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` o claves de mensaje permitidas como `["role","content"]` → el backend rechaza metadatos de repetición estilo OpenAI en mensajes de Chat Completions. Corrección: establece `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → el backend completó la solicitud de Chat Completions pero no devolvió texto de asistente visible para el usuario en ese turno. OpenClaw reintenta una vez los turnos vacíos compatibles con OpenAI que son seguros para repetición; los fallos persistentes suelen indicar que el backend emite contenido vacío/no textual o suprime el texto de respuesta final.
    - las solicitudes directas pequeñas funcionan, pero las ejecuciones del agente de OpenClaw fallan con bloqueos del backend/modelo (por ejemplo Gemma en algunas compilaciones de `inferrs`) → el transporte de OpenClaw probablemente ya es correcto; el backend falla con la forma de prompt más grande del tiempo de ejecución del agente.
    - los fallos disminuyen después de desactivar herramientas pero no desaparecen → los esquemas de herramientas formaban parte de la presión, pero el problema restante sigue siendo capacidad del modelo/servidor ascendente o un error del backend.

  </Accordion>
  <Accordion title="Opciones de corrección">
    1. Establece `compat.requiresStringContent: true` para backends de Chat Completions que solo aceptan cadenas.
    2. Establece `compat.strictMessageKeys: true` para backends estrictos de Chat Completions que solo aceptan `role` y `content` en cada mensaje.
    3. Establece `compat.supportsTools: false` para modelos/backends que no pueden manejar de forma fiable la superficie de esquemas de herramientas de OpenClaw.
    4. Reduce la presión del prompt donde sea posible: arranque de workspace más pequeño, historial de sesión más corto, modelo local más ligero o un backend con mejor soporte de contexto largo.
    5. Si las solicitudes directas pequeñas siguen funcionando mientras los turnos del agente de OpenClaw aún fallan dentro del backend, trátalo como una limitación ascendente del servidor/modelo y presenta allí una reproducción con la forma de payload aceptada.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Configuración](/es/gateway/configuration)
- [Modelos locales](/es/gateway/local-models)
- [Endpoints compatibles con OpenAI](/es/gateway/configuration-reference#openai-compatible-endpoints)

## Sin respuestas

Si los canales están activos pero nada responde, revisa el enrutamiento y la política antes de reconectar algo.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Busca:

- Emparejamiento pendiente para remitentes de DM.
- Control de menciones de grupo (`requireMention`, `mentionPatterns`).
- Desajustes de allowlist de canal/grupo.

Firmas comunes:

- `drop guild message (mention required` → mensaje de grupo ignorado hasta la mención.
- `pairing request` → el remitente necesita aprobación.
- `blocked` / `allowlist` → el remitente/canal fue filtrado por política.

Relacionado:

- [Solución de problemas de canales](/es/channels/troubleshooting)
- [Grupos](/es/channels/groups)
- [Emparejamiento](/es/channels/pairing)

## Conectividad de la interfaz de control del panel

Cuando el panel/interfaz de control no se conecte, valida la URL, el modo de autenticación y los supuestos de contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Busca:

- URL de prueba y URL del panel correctas.
- Desajuste de modo/token de autenticación entre cliente y Gateway.
- Uso de HTTP donde se requiere identidad de dispositivo.

<AccordionGroup>
  <Accordion title="Firmas de conexión/autenticación">
    - `device identity required` → contexto no seguro o falta autenticación de dispositivo.
    - `origin not allowed` → el `Origin` del navegador no está en `gateway.controlUi.allowedOrigins` (o te conectas desde un origen de navegador que no es local loopback sin una allowlist explícita).
    - `device nonce required` / `device nonce mismatch` → el cliente no completa el flujo de autenticación de dispositivo basado en desafío (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → el cliente firmó el payload incorrecto (o una marca de tiempo obsoleta) para el handshake actual.
    - `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → el cliente puede hacer un reintento de confianza con token de dispositivo en caché.
    - Ese reintento con token en caché reutiliza el conjunto de alcances en caché almacenado con el token de dispositivo emparejado. Los llamadores con `deviceToken` explícito / `scopes` explícitos mantienen el conjunto de alcances solicitado.
    - `AUTH_SCOPE_MISMATCH` → se reconoció el token de dispositivo, pero sus alcances aprobados no cubren esta solicitud de conexión; vuelve a emparejar o aprueba el contrato de alcances solicitado en lugar de rotar un token compartido de Gateway.
    - Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es primero token/contraseña compartidos explícitos, luego `deviceToken` explícito, luego token de dispositivo almacenado y luego token de arranque.
    - En la ruta asíncrona de la interfaz de control de Tailscale Serve, los intentos fallidos para el mismo `{scope, ip}` se serializan antes de que el limitador registre el fallo. Por lo tanto, dos reintentos incorrectos concurrentes desde el mismo cliente pueden mostrar `retry later` en el segundo intento en lugar de dos desajustes simples.
    - `too many failed authentication attempts (retry later)` desde un cliente local loopback con origen de navegador → los fallos repetidos desde ese mismo `Origin` normalizado se bloquean temporalmente; otro origen localhost usa un bucket separado.
    - `unauthorized` repetido después de ese reintento → divergencia de token compartido/token de dispositivo; actualiza la configuración del token y vuelve a aprobar/rotar el token de dispositivo si es necesario.
    - `gateway connect failed:` → objetivo de host/puerto/url incorrecto.

  </Accordion>
</AccordionGroup>

### Mapa rápido de códigos de detalle de autenticación

Usa `error.details.code` de la respuesta `connect` fallida para elegir la siguiente acción:

| Código de detalle            | Significado                                                                                                                                                                                                | Acción recomendada                                                                                                                                                                                                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | El cliente no envió un token compartido obligatorio.                                                                                                                                                       | Pega/establece el token en el cliente y vuelve a intentarlo. Para rutas del panel: `openclaw config get gateway.auth.token` y luego pégalo en la configuración de Control UI.                                                                                                           |
| `AUTH_TOKEN_MISMATCH`        | El token compartido no coincidió con el token de autenticación de Gateway.                                                                                                                                 | Si `canRetryWithDeviceToken=true`, permite un reintento de confianza. Los reintentos con token en caché reutilizan los alcances aprobados almacenados; los llamadores explícitos con `deviceToken` / `scopes` conservan los alcances solicitados. Si sigue fallando, ejecuta la [lista de comprobación de recuperación de desviación de token](/es/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | El token por dispositivo en caché está obsoleto o revocado.                                                                                                                                               | Rota/vuelve a aprobar el token de dispositivo con [devices CLI](/es/cli/devices), y luego reconecta.                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | El token de dispositivo es válido, pero su rol/alcances aprobados no cubren esta solicitud de conexión.                                                                                                    | Vuelve a emparejar el dispositivo o aprueba el contrato de alcance solicitado; no trates esto como desviación del token compartido.                                                                                                                                                       |
| `PAIRING_REQUIRED`           | La identidad del dispositivo necesita aprobación. Revisa `error.details.reason` para `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade`, y usa `requestId` / `remediationHint` cuando estén presentes. | Aprueba la solicitud pendiente: `openclaw devices list` y luego `openclaw devices approve <requestId>`. Las actualizaciones de alcance/rol usan el mismo flujo después de que revises el acceso solicitado.                                                                              |

<Note>
Los RPC directos del backend por local loopback autenticados con el token/contraseña compartidos de Gateway no deberían depender de la línea base de alcance de dispositivos emparejados del CLI. Si los subagentes u otras llamadas internas siguen fallando con `scope-upgrade`, verifica que el llamador esté usando `client.id: "gateway-client"` y `client.mode: "backend"` y que no esté forzando un `deviceIdentity` explícito ni un token de dispositivo.
</Note>

Comprobación de migración de autenticación de dispositivo v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si los registros muestran errores de nonce/firma, actualiza el cliente que se conecta y verifícalo:

<Steps>
  <Step title="Esperar connect.challenge">
    El cliente espera el `connect.challenge` emitido por Gateway.
  </Step>
  <Step title="Firmar la carga útil">
    El cliente firma la carga útil vinculada al desafío.
  </Step>
  <Step title="Enviar el nonce del dispositivo">
    El cliente envía `connect.params.device.nonce` con el mismo nonce del desafío.
  </Step>
</Steps>

Si `openclaw devices rotate` / `revoke` / `remove` se deniega inesperadamente:

- las sesiones con token de dispositivo emparejado solo pueden administrar **su propio** dispositivo, a menos que el llamador también tenga `operator.admin`
- `openclaw devices rotate --scope ...` solo puede solicitar alcances de operador que la sesión del llamador ya tenga

Relacionado:

- [Configuración](/es/gateway/configuration) (modos de autenticación de Gateway)
- [Control UI](/es/web/control-ui)
- [Dispositivos](/es/cli/devices)
- [Acceso remoto](/es/gateway/remote)
- [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)

## El servicio de Gateway no está en ejecución

Usa esto cuando el servicio está instalado pero el proceso no permanece activo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Busca:

- `Runtime: stopped` con pistas de salida.
- Desajuste en la configuración del servicio (`Config (cli)` frente a `Config (service)`).
- Conflictos de puerto/listener.
- Instalaciones adicionales de launchd/systemd/schtasks cuando se usa `--deep`.
- Pistas de limpieza de `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Firmas comunes">
    - `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → el modo de Gateway local no está habilitado, o el archivo de configuración se sobrescribió y perdió `gateway.mode`. Solución: establece `gateway.mode="local"` en tu configuración, o vuelve a ejecutar `openclaw onboard --mode local` / `openclaw setup` para volver a sellar la configuración de modo local esperada. Si estás ejecutando OpenClaw mediante Podman, la ruta de configuración predeterminada es `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → enlace que no es de loopback sin una ruta de autenticación de Gateway válida (token/contraseña, o proxy de confianza donde esté configurado).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflicto de puerto.
    - `Other gateway-like services detected (best effort)` → existen unidades launchd/systemd/schtasks obsoletas o paralelas. La mayoría de las instalaciones deberían mantener un Gateway por máquina; si necesitas más de uno, aísla puertos + configuración/estado/espacio de trabajo. Consulta [/gateway#multiple-gateways-same-host](/es/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` desde doctor → existe una unidad systemd de sistema mientras falta el servicio de nivel de usuario. Elimina o deshabilita el duplicado antes de permitir que doctor instale un servicio de usuario, o establece `OPENCLAW_SERVICE_REPAIR_POLICY=external` si la unidad de sistema es el supervisor previsto.
    - `Gateway service port does not match current gateway config` → el supervisor instalado todavía fija el `--port` anterior. Ejecuta `openclaw doctor --fix` o `openclaw gateway install --force`, y luego reinicia el servicio de Gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Ejecución en segundo plano y herramienta de proceso](/es/gateway/background-process)
- [Configuración](/es/gateway/configuration)
- [Doctor](/es/gateway/doctor)

## Gateway rechazó configuración no válida

Usa esto cuando el inicio de Gateway falla con `Invalid config` o los registros de recarga en caliente dicen
que omitió una edición no válida.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Busca:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- Un archivo `openclaw.json.rejected.*` con marca de tiempo junto a la configuración activa
- Un archivo `openclaw.json.clobbered.*` con marca de tiempo si `doctor --fix` reparó una edición directa rota

<AccordionGroup>
  <Accordion title="Qué ocurrió">
    - La configuración no se validó durante el inicio, la recarga en caliente o una escritura propiedad de OpenClaw.
    - El inicio de Gateway falla cerrado en lugar de reescribir `openclaw.json`.
    - La recarga en caliente omite ediciones externas no válidas y mantiene activa la configuración de tiempo de ejecución actual.
    - Las escrituras propiedad de OpenClaw rechazan cargas útiles no válidas/destructivas antes del commit y guardan `.rejected.*`.
    - `openclaw doctor --fix` se encarga de la reparación. Puede eliminar prefijos que no sean JSON o restaurar la última copia conocida como válida, conservando la carga útil rechazada como `.clobbered.*`.

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
    - `.clobbered.*` existe → doctor conservó una edición externa rota mientras reparaba la configuración activa.
    - `.rejected.*` existe → una escritura de configuración propiedad de OpenClaw falló las comprobaciones de esquema o sobrescritura antes del commit.
    - `Config write rejected:` → la escritura intentó eliminar la forma requerida, reducir drásticamente el archivo o persistir una configuración no válida.
    - `config reload skipped (invalid config):` → una edición directa falló la validación y fue ignorada por el Gateway en ejecución.
    - `Invalid config at ...` → el inicio falló antes de que arrancaran los servicios de Gateway.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` o `size-drop-vs-last-good:*` → una escritura propiedad de OpenClaw fue rechazada porque perdió campos o tamaño en comparación con la última copia de seguridad conocida como válida.
    - `Config last-known-good promotion skipped` → el candidato contenía marcadores de posición de secretos redactados como `***`.

  </Accordion>
  <Accordion title="Opciones de corrección">
    1. Ejecuta `openclaw doctor --fix` para dejar que doctor repare la configuración con prefijo/sobrescrita o restaure la última conocida como válida.
    2. Copia solo las claves previstas desde `.clobbered.*` o `.rejected.*`, y luego aplícalas con `openclaw config set` o `config.patch`.
    3. Ejecuta `openclaw config validate` antes de reiniciar.
    4. Si editas a mano, conserva la configuración JSON5 completa, no solo el objeto parcial que querías cambiar.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Config](/es/cli/config)
- [Configuración: recarga en caliente](/es/gateway/configuration#config-hot-reload)
- [Configuración: validación estricta](/es/gateway/configuration#strict-validation)
- [Doctor](/es/gateway/doctor)

## Advertencias de sondeo de Gateway

Usa esto cuando `openclaw gateway probe` alcanza algo, pero aún imprime un bloque de advertencia.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Busca:

- `warnings[].code` y `primaryTargetId` en la salida JSON.
- Si la advertencia trata sobre reserva SSH, varios Gateways, alcances faltantes o referencias de autenticación sin resolver.

Firmas comunes:

- `SSH tunnel failed to start; falling back to direct probes.` → la configuración de SSH falló, pero el comando aun así intentó objetivos directos configurados/de loopback.
- `multiple reachable gateways detected` → respondió más de un objetivo. Normalmente esto significa una configuración multi-Gateway intencional o listeners obsoletos/duplicados.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la conexión funcionó, pero el RPC de detalle está limitado por alcance; empareja la identidad del dispositivo o usa credenciales con `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → la conexión funcionó, pero el conjunto completo de RPC de diagnóstico agotó el tiempo de espera o falló. Trátalo como un Gateway alcanzable con diagnósticos degradados; compara `connect.ok` y `connect.rpcOk` en la salida de `--json`.
- `Capability: pairing-pending` o `gateway closed (1008): pairing required` → Gateway respondió, pero este cliente aún necesita emparejamiento/aprobación antes del acceso normal de operador.
- texto de advertencia de SecretRef `gateway.auth.*` / `gateway.remote.*` sin resolver → el material de autenticación no estaba disponible en esta ruta de comando para el objetivo fallido.

Relacionado:

- [Gateway](/es/cli/gateway)
- [Varios gateways en el mismo host](/es/gateway#multiple-gateways-same-host)
- [Acceso remoto](/es/gateway/remote)

## Canal conectado, los mensajes no fluyen

Si el estado del canal es conectado pero el flujo de mensajes está muerto, céntrate en la política, los permisos y las reglas de entrega específicas del canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Busca:

- Política de DM (`pairing`, `allowlist`, `open`, `disabled`).
- Lista de permitidos de grupos y requisitos de mención.
- Permisos/ámbitos de API de canal faltantes.

Firmas comunes:

- `mention required` → mensaje ignorado por la política de mención de grupo.
- `pairing` / rastros de aprobación pendiente → el remitente no está aprobado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de autenticación/permisos del canal.

Relacionado:

- [Solución de problemas de canales](/es/channels/troubleshooting)
- [Discord](/es/channels/discord)
- [Telegram](/es/channels/telegram)
- [WhatsApp](/es/channels/whatsapp)

## Entrega de Cron y Heartbeat

Si cron o heartbeat no se ejecutó o no se entregó, verifica primero el estado del programador y luego el destino de entrega.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Busca:

- Cron habilitado y siguiente activación presente.
- Estado del historial de ejecución de trabajos (`ok`, `skipped`, `error`).
- Motivos de omisión de Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Firmas comunes">
    - `cron: scheduler disabled; jobs will not run automatically` → cron deshabilitado.
    - `cron: timer tick failed` → falló el tick del programador; revisa errores de archivo/log/runtime.
    - `heartbeat skipped` con `reason=quiet-hours` → fuera de la ventana de horas activas.
    - `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe pero solo contiene líneas en blanco / encabezados markdown, por lo que OpenClaw omite la llamada al modelo.
    - `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un bloque `tasks:`, pero ninguna de las tareas vence en este tick.
    - `heartbeat: unknown accountId` → id de cuenta no válido para el destino de entrega de heartbeat.
    - `heartbeat skipped` con `reason=dm-blocked` → el destino de heartbeat se resolvió como un destino de tipo DM mientras `agents.defaults.heartbeat.directPolicy` (o la anulación por agente) está establecido en `block`.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Heartbeat](/es/gateway/heartbeat)
- [Tareas programadas](/es/automation/cron-jobs)
- [Tareas programadas: solución de problemas](/es/automation/cron-jobs#troubleshooting)

## Node emparejado, falla la herramienta

Si un node está emparejado pero las herramientas fallan, aísla el estado de primer plano, permisos y aprobación.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Busca:

- Node en línea con las capacidades esperadas.
- Concesiones de permisos del SO para cámara/micrófono/ubicación/pantalla.
- Aprobaciones de exec y estado de lista de permitidos.

Firmas comunes:

- `NODE_BACKGROUND_UNAVAILABLE` → la app de node debe estar en primer plano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → falta permiso del SO.
- `SYSTEM_RUN_DENIED: approval required` → aprobación de exec pendiente.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado por la lista de permitidos.

Relacionado:

- [Aprobaciones de exec](/es/tools/exec-approvals)
- [Solución de problemas de Node](/es/nodes/troubleshooting)
- [Nodes](/es/nodes/index)

## Falla la herramienta de navegador

Usa esto cuando las acciones de la herramienta de navegador fallen aunque el propio gateway esté sano.

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
- Disponibilidad local de Chrome para perfiles `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Firmas de Plugin / ejecutable">
    - `unknown command "browser"` o `unknown command 'browser'` → el plugin de navegador incluido está excluido por `plugins.allow`.
    - herramienta de navegador faltante / no disponible mientras `browser.enabled=true` → `plugins.allow` excluye `browser`, por lo que el plugin nunca se cargó.
    - `Failed to start Chrome CDP on port` → no se pudo iniciar el proceso del navegador.
    - `browser.executablePath not found` → la ruta configurada no es válida.
    - `browser.cdpUrl must be http(s) or ws(s)` → la URL CDP configurada usa un esquema no compatible como `file:` o `ftp:`.
    - `browser.cdpUrl has invalid port` → la URL CDP configurada tiene un puerto incorrecto o fuera de rango.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → la instalación actual del gateway carece de la dependencia runtime principal del navegador; reinstala o actualiza OpenClaw y luego reinicia el gateway. Las instantáneas ARIA y las capturas básicas de página todavía pueden funcionar, pero la navegación, las instantáneas de IA, las capturas de elementos con selector CSS y la exportación a PDF siguen no disponibles.

  </Accordion>
  <Accordion title="Firmas de Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session todavía no pudo adjuntarse al directorio de datos del navegador seleccionado. Abre la página de inspección del navegador, habilita la depuración remota, mantén abierto el navegador, aprueba el primer aviso de adjunción y vuelve a intentarlo. Si no se requiere estado con sesión iniciada, prefiere el perfil administrado `openclaw`.
    - `No Chrome tabs found for profile="user"` → el perfil de adjunción de Chrome MCP no tiene pestañas locales de Chrome abiertas.
    - `Remote CDP for profile "<name>" is not reachable` → el endpoint CDP remoto configurado no es alcanzable desde el host del gateway.
    - `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → el perfil solo adjuntar no tiene un destino alcanzable, o el endpoint HTTP respondió pero el WebSocket CDP todavía no pudo abrirse.

  </Accordion>
  <Accordion title="Firmas de elemento / captura / carga">
    - `fullPage is not supported for element screenshots` → la solicitud de captura mezcló `--full-page` con `--ref` o `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → las llamadas de captura de Chrome MCP / `existing-session` deben usar captura de página o un `--ref` de instantánea, no `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → los hooks de carga de Chrome MCP necesitan refs de instantánea, no selectores CSS.
    - `existing-session file uploads currently support one file at a time.` → envía una carga por llamada en perfiles Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → los hooks de diálogo en perfiles Chrome MCP no admiten anulaciones de timeout.
    - `existing-session type does not support timeoutMs overrides.` → omite `timeoutMs` para `act:type` en perfiles `profile="user"` / Chrome MCP existing-session, o usa un perfil de navegador administrado/CDP cuando se requiera un timeout personalizado.
    - `existing-session evaluate does not support timeoutMs overrides.` → omite `timeoutMs` para `act:evaluate` en perfiles `profile="user"` / Chrome MCP existing-session, o usa un perfil de navegador administrado/CDP cuando se requiera un timeout personalizado.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` todavía requiere un navegador administrado o un perfil CDP sin procesar.
    - anulaciones obsoletas de viewport / modo oscuro / locale / sin conexión en perfiles solo adjuntar o CDP remoto → ejecuta `openclaw browser stop --browser-profile <name>` para cerrar la sesión de control activa y liberar el estado de emulación Playwright/CDP sin reiniciar todo el gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Navegador (administrado por OpenClaw)](/es/tools/browser)
- [Solución de problemas del navegador](/es/tools/browser-linux-troubleshooting)

## Si actualizaste y algo se rompió de repente

La mayoría de las roturas posteriores a una actualización son deriva de configuración o valores predeterminados más estrictos que ahora se aplican.

<AccordionGroup>
  <Accordion title="1. Cambió el comportamiento de autenticación y anulación de URL">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Qué revisar:

    - Si `gateway.mode=remote`, las llamadas CLI pueden estar apuntando al remoto mientras tu servicio local está bien.
    - Las llamadas explícitas con `--url` no recurren a las credenciales almacenadas.

    Firmas comunes:

    - `gateway connect failed:` → destino de URL incorrecto.
    - `unauthorized` → endpoint alcanzable pero autenticación incorrecta.

  </Accordion>
  <Accordion title="2. Las barreras de bind y autenticación son más estrictas">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Qué revisar:

    - Los binds no loopback (`lan`, `tailnet`, `custom`) necesitan una ruta válida de autenticación del gateway: autenticación con token/contraseña compartidos, o una implementación `trusted-proxy` no loopback configurada correctamente.
    - Las claves antiguas como `gateway.token` no reemplazan a `gateway.auth.token`.

    Firmas comunes:

    - `refusing to bind gateway ... without auth` → bind no loopback sin una ruta válida de autenticación del gateway.
    - `Connectivity probe: failed` mientras el runtime está ejecutándose → gateway activo pero inaccesible con la autenticación/URL actual.

  </Accordion>
  <Accordion title="3. Cambió el estado de emparejamiento e identidad de dispositivo">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Qué revisar:

    - Aprobaciones de dispositivo pendientes para dashboard/nodes.
    - Aprobaciones de emparejamiento DM pendientes después de cambios de política o identidad.

    Firmas comunes:

    - `device identity required` → autenticación de dispositivo no satisfecha.
    - `pairing required` → el remitente/dispositivo debe aprobarse.

  </Accordion>
</AccordionGroup>

Si la configuración del servicio y el runtime siguen en desacuerdo después de las comprobaciones, reinstala los metadatos del servicio desde el mismo directorio de perfil/estado:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Relacionado:

- [Autenticación](/es/gateway/authentication)
- [Exec en segundo plano y herramienta de proceso](/es/gateway/background-process)
- [Emparejamiento propiedad del gateway](/es/gateway/pairing)

## Relacionado

- [Doctor](/es/gateway/doctor)
- [FAQ](/es/help/faq)
- [Runbook del gateway](/es/gateway)
