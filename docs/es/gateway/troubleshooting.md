---
read_when:
    - El centro de solución de problemas te dirigió aquí para un diagnóstico más profundo
    - Necesitas secciones de runbook estables basadas en síntomas con comandos exactos
sidebarTitle: Troubleshooting
summary: Manual detallado de solución de problemas para gateway, canales, automatización, nodos y navegador
title: Solución de problemas
x-i18n:
    generated_at: "2026-06-27T11:39:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ce8e8aed5c3e00be5b093875222962c22883472802e164534dae32adc5365c5
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Esta página es el runbook detallado. Empieza en [/help/troubleshooting](/es/help/troubleshooting) si quieres primero el flujo rápido de triaje.

## Secuencia de comandos

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
- `openclaw channels status --probe` muestra el estado de transporte activo por cuenta y, donde sea compatible, resultados de sondeo/auditoría como `works` o `audit ok`.

## Después de una actualización

Usa esto cuando una actualización termina pero el Gateway está caído, los canales están vacíos o las llamadas al modelo empiezan a fallar con 401.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Busca:

- `Update restart` en `openclaw status` / `openclaw status --all`. Las entregas pendientes o
  fallidas incluyen el siguiente comando que debes ejecutar.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`
  bajo Canales. Eso significa que la configuración del canal aún existe, pero el registro del plugin
  falló antes de que el canal pudiera cargarse.
- 401 del proveedor después de volver a autenticar. `openclaw doctor --fix` comprueba sombras de autenticación OAuth
  obsoletas por agente y elimina las copias antiguas para que todos los agentes resuelvan
  el perfil compartido actual.

## Instalaciones divididas y protección de configuración más nueva

Usa esto cuando un servicio de Gateway se detiene inesperadamente después de una actualización, o los registros muestran que un binario `openclaw` es más antiguo que la versión que escribió por última vez `openclaw.json`.

OpenClaw marca las escrituras de configuración con `meta.lastTouchedVersion`. Los comandos de solo lectura aún pueden inspeccionar una configuración escrita por un OpenClaw más nuevo, pero las mutaciones de proceso y servicio se niegan a continuar desde un binario más antiguo. Las acciones bloqueadas incluyen iniciar, detener, reiniciar y desinstalar el servicio de Gateway, reinstalación forzada del servicio, arranque del Gateway en modo servicio y limpieza de puerto con `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    Corrige `PATH` para que `openclaw` resuelva a la instalación más nueva y luego vuelve a ejecutar la acción.
  </Step>
  <Step title="Reinstall the gateway service">
    Reinstala el servicio de Gateway previsto desde la instalación más nueva:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    Elimina entradas obsoletas de paquetes del sistema o envoltorios antiguos que aún apuntan a un binario `openclaw` antiguo.
  </Step>
</Steps>

<Warning>
Solo para degradación intencional o recuperación de emergencia, establece `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` para el comando único. Déjalo sin establecer para el funcionamiento normal.
</Warning>

## Incompatibilidad de protocolo después de una reversión

Usa esto cuando los registros siguen imprimiendo `protocol mismatch` después de degradar o revertir OpenClaw. Esto significa que se está ejecutando un Gateway antiguo, pero un proceso de cliente local más nuevo todavía intenta reconectarse con un rango de protocolo que el Gateway antiguo no puede hablar.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Busca:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` en los registros del Gateway.
- `Established clients:` en `openclaw gateway status --deep` o `Gateway clients` en `openclaw doctor --deep`. Esto lista los clientes TCP activos conectados al puerto del Gateway, incluidos los PID y las líneas de comando cuando el sistema operativo lo permite.
- Un proceso de cliente cuya línea de comando apunta a la instalación o el envoltorio de OpenClaw más nuevo desde el que revertiste.

Solución:

1. Detén o reinicia el proceso de cliente de OpenClaw obsoleto que muestra `gateway status --deep`.
2. Reinicia aplicaciones o envoltorios que integren OpenClaw, como paneles locales, editores, ayudantes de servidor de aplicaciones o shells `openclaw logs --follow` de larga duración.
3. Vuelve a ejecutar `openclaw gateway status --deep` o `openclaw doctor --deep` y confirma que el PID del cliente obsoleto ya no está.

No hagas que un Gateway antiguo acepte un protocolo nuevo incompatible. Los incrementos de protocolo protegen el contrato de comunicación; la recuperación por reversión es un problema de limpieza de procesos/versiones.

## Enlace simbólico de Skill omitido como escape de ruta

Usa esto cuando los registros incluyan:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw trata cada raíz de skill como un límite de contención. Un enlace simbólico bajo
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` o
`~/.openclaw/skills` se omite cuando su destino real resuelve fuera de esa raíz,
a menos que el destino sea de confianza explícita.

Inspecciona el enlace:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Si el destino es intencional, configura tanto la raíz directa de skill como el
destino permitido del enlace simbólico:

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
Mantén `allowSymlinkTargets` limitado a la raíz real de skill que contiene directorios
`SKILL.md` de confianza.

Si la aplicación de Skill Workshop también debe escribir a través de esas rutas de skill de espacio de trabajo
enlazadas simbólicamente y de confianza, habilita `skills.workshop.allowSymlinkTargetWrites`. Mantenlo
deshabilitado para raíces de Skills compartidas de solo lectura.

Relacionado:

- [Configuración de Skills](/es/tools/skills-config#symlinked-skill-roots)
- [Ejemplos de configuración](/es/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429: uso adicional requerido para contexto largo

Usa esto cuando los registros/errores incluyan: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Busca:

- El modelo Anthropic seleccionado es un modelo Claude 4.x con capacidad GA de 1M, o el modelo tiene el `params.context1m: true` heredado.
- La credencial Anthropic actual no es apta para uso de contexto largo.
- Las solicitudes fallan solo en sesiones largas/ejecuciones de modelo que necesitan la ruta de contexto de 1M.

Opciones de solución:

<Steps>
  <Step title="Use a standard context window">
    Cambia a un modelo con ventana estándar, o elimina el `context1m` heredado de la configuración
    de modelos antiguos que no tienen capacidad GA para contexto de 1M.
  </Step>
  <Step title="Use an eligible credential">
    Usa una credencial Anthropic que sea apta para solicitudes de contexto largo, o cambia a una clave de API de Anthropic.
  </Step>
  <Step title="Configure fallback models">
    Configura modelos de respaldo para que las ejecuciones continúen cuando se rechacen las solicitudes de contexto largo de Anthropic.
  </Step>
</Steps>

Relacionado:

- [Anthropic](/es/providers/anthropic)
- [Uso de tokens y costos](/es/reference/token-use)
- [¿Por qué veo HTTP 429 de Anthropic?](/es/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Respuestas ascendentes 403 bloqueadas

Usa esto cuando un proveedor LLM ascendente devuelve un `403` genérico como
`Your request was blocked`.

No asumas que esto siempre es un problema de configuración de OpenClaw. La respuesta puede
venir de una capa de seguridad ascendente como una CDN, WAF, regla de gestión de bots o
proxy inverso delante de un endpoint compatible con OpenAI.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Busca:

- varios modelos bajo el mismo proveedor fallando de la misma manera
- HTML o texto genérico de seguridad en lugar de un error normal de API del proveedor
- eventos de seguridad del lado del proveedor para la misma hora de solicitud
- un sondeo directo pequeño con `curl` que funciona mientras fallan las solicitudes normales con forma de SDK

Corrige primero el filtrado del lado del proveedor cuando la evidencia apunte a un bloqueo
de WAF/CDN. Prefiere una regla de permiso o exclusión de alcance estrecho para la ruta de API que OpenClaw
usa, y evita deshabilitar la protección para todo el sitio.

<Warning>
Un `curl` mínimo exitoso no garantiza que las solicitudes reales de estilo SDK
atraviesen la misma capa de seguridad ascendente.
</Warning>

Relacionado:

- [Endpoints compatibles con OpenAI](/es/gateway/configuration-reference#openai-compatible-endpoints)
- [Configuración de proveedores](/es/providers)
- [Registros](/es/logging)

## Backend local compatible con OpenAI pasa sondeos directos pero las ejecuciones de agente fallan

Usa esto cuando:

- `curl ... /v1/models` funciona
- las llamadas directas pequeñas a `/v1/chat/completions` funcionan
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

- las llamadas directas pequeñas tienen éxito, pero las ejecuciones de OpenClaw fallan solo con prompts más grandes
- errores `model_not_found` o 404 aunque `/v1/chat/completions` directo
  funcione con el mismo id de modelo simple
- errores del backend sobre `messages[].content` que esperan una cadena
- advertencias intermitentes `incomplete turn detected ... stopReason=stop payloads=0` con un backend local compatible con OpenAI
- bloqueos del backend que aparecen solo con conteos mayores de tokens de prompt o prompts completos del runtime de agente

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` con un servidor local estilo MLX/vLLM → verifica que `baseUrl` incluya `/v1`, que `api` sea `"openai-completions"` para backends `/v1/chat/completions`, y que `models.providers.<provider>.models[].id` sea el id local del proveedor sin prefijo. Selecciónalo una vez con el prefijo del proveedor, por ejemplo `mlx/mlx-community/Qwen3-30B-A3B-6bit`; mantén la entrada de catálogo como `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → el backend rechaza partes de contenido estructurado de Chat Completions. Solución: establece `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` o claves de mensaje permitidas como `["role","content"]` → el backend rechaza metadatos de repetición de estilo OpenAI en mensajes de Chat Completions. Solución: establece `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → el backend completó la solicitud de Chat Completions pero no devolvió texto de asistente visible para el usuario en ese turno. OpenClaw reintenta una vez los turnos vacíos compatibles con OpenAI que son seguros de reproducir; los fallos persistentes normalmente significan que el backend emite contenido vacío/no textual o suprime el texto de respuesta final.
    - las solicitudes directas pequeñas tienen éxito, pero las ejecuciones de agente de OpenClaw fallan con bloqueos de backend/modelo (por ejemplo Gemma en algunas compilaciones de `inferrs`) → es probable que el transporte de OpenClaw ya sea correcto; el backend está fallando con la forma de prompt más grande del runtime de agente.
    - los fallos disminuyen después de deshabilitar herramientas pero no desaparecen → los esquemas de herramientas eran parte de la presión, pero el problema restante sigue siendo capacidad del modelo/servidor ascendente o un error del backend.

  </Accordion>
  <Accordion title="Fix options">
    1. Establece `compat.requiresStringContent: true` para backends de Chat Completions que solo admiten cadenas.
    2. Establece `compat.strictMessageKeys: true` para backends estrictos de Chat Completions que solo aceptan `role` y `content` en cada mensaje.
    3. Establece `compat.supportsTools: false` para modelos/backends que no pueden manejar de forma fiable la superficie de esquemas de herramientas de OpenClaw.
    4. Reduce la presión de prompt donde sea posible: arranque de espacio de trabajo más pequeño, historial de sesión más corto, modelo local más ligero o un backend con mejor soporte de contexto largo.
    5. Si las solicitudes directas pequeñas siguen funcionando mientras los turnos de agente de OpenClaw todavía bloquean el backend, trátalo como una limitación ascendente del servidor/modelo y presenta allí una reproducción con la forma de payload aceptada.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Configuración](/es/gateway/configuration)
- [Modelos locales](/es/gateway/local-models)
- [Endpoints compatibles con OpenAI](/es/gateway/configuration-reference#openai-compatible-endpoints)

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

- Emparejamiento pendiente para remitentes de DM.
- Puerta de menciones en grupos (`requireMention`, `mentionPatterns`).
- Desajustes en listas de permitidos de canal/grupo.

Firmas comunes:

- `drop guild message (mention required` → mensaje de grupo ignorado hasta que haya mención.
- `pairing request` → el remitente necesita aprobación.
- `blocked` / `allowlist` → el remitente/canal fue filtrado por la política.

Relacionado:

- [Solución de problemas de canales](/es/channels/troubleshooting)
- [Grupos](/es/channels/groups)
- [Emparejamiento](/es/channels/pairing)

## Conectividad de la interfaz de control del panel

Cuando el panel/interfaz de control no se conecte, valida la URL, el modo de autenticación y las suposiciones de contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Busca:

- URL de sondeo y URL del panel correctas.
- Desajuste de modo/token de autenticación entre el cliente y el gateway.
- Uso de HTTP donde se requiere identidad del dispositivo.

Si un navegador local no puede conectarse a `127.0.0.1:18789` después de una actualización, primero
recupera el servicio Gateway local y confirma que está sirviendo el panel:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Si `curl` devuelve HTML de OpenClaw, el Gateway funciona y el problema restante
probablemente sea la caché del navegador, un enlace profundo antiguo o estado obsoleto de una pestaña. Abre
`http://127.0.0.1:18789` directamente y navega desde el panel. Si el reinicio
no deja el servicio en ejecución, ejecuta `openclaw gateway start` y vuelve a comprobar
`openclaw gateway status`.

<AccordionGroup>
  <Accordion title="Firmas de conexión / autenticación">
    - `device identity required` → contexto no seguro o falta autenticación de dispositivo.
    - `origin not allowed` → el `Origin` del navegador no está en `gateway.controlUi.allowedOrigins` (o te estás conectando desde un origen de navegador que no es loopback sin una lista de permitidos explícita).
    - `device nonce required` / `device nonce mismatch` → el cliente no está completando el flujo de autenticación de dispositivo basado en desafío (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → el cliente firmó la carga útil incorrecta (o una marca de tiempo obsoleta) para el handshake actual.
    - `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → el cliente puede hacer un reintento de confianza con el token de dispositivo en caché.
    - Ese reintento con token en caché reutiliza el conjunto de ámbitos en caché almacenado con el token de dispositivo emparejado. Los llamadores con `deviceToken` explícito / `scopes` explícitos conservan en cambio su conjunto de ámbitos solicitado.
    - `AUTH_SCOPE_MISMATCH` → se reconoció el token de dispositivo, pero sus ámbitos aprobados no cubren esta solicitud de conexión; vuelve a emparejar o aprueba el contrato de ámbitos solicitado en lugar de rotar un token de gateway compartido.
    - Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es primero token/contraseña compartidos explícitos, luego `deviceToken` explícito, luego token de dispositivo almacenado y luego token de bootstrap.
    - En la ruta asíncrona de la interfaz de control de Tailscale Serve, los intentos fallidos para el mismo `{scope, ip}` se serializan antes de que el limitador registre el fallo. Por eso, dos reintentos concurrentes incorrectos desde el mismo cliente pueden mostrar `retry later` en el segundo intento en lugar de dos desajustes simples.
    - `too many failed authentication attempts (retry later)` desde un cliente loopback con origen de navegador → los fallos repetidos desde ese mismo `Origin` normalizado se bloquean temporalmente; otro origen localhost usa un bucket separado.
    - `unauthorized` repetido después de ese reintento → deriva de token compartido/token de dispositivo; actualiza la configuración de tokens y vuelve a aprobar/rotar el token de dispositivo si hace falta.
    - `gateway connect failed:` → destino de host/puerto/url incorrecto.

  </Accordion>
</AccordionGroup>

### Mapa rápido de códigos de detalle de autenticación

Usa `error.details.code` de la respuesta `connect` fallida para elegir la siguiente acción:

| Código de detalle            | Significado                                                                                                                                                                                  | Acción recomendada                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | El cliente no envió un token compartido requerido.                                                                                                                                           | Pega/define el token en el cliente y vuelve a intentarlo. Para rutas del panel: `openclaw config get gateway.auth.token` y luego pégalo en la configuración de la interfaz de control.                                                                                                   |
| `AUTH_TOKEN_MISMATCH`        | El token compartido no coincidió con el token de autenticación del gateway.                                                                                                                   | Si `canRetryWithDeviceToken=true`, permite un reintento de confianza. Los reintentos con token en caché reutilizan los ámbitos aprobados almacenados; los llamadores con `deviceToken` / `scopes` explícitos conservan los ámbitos solicitados. Si sigue fallando, ejecuta la [lista de comprobación para recuperar deriva de token](/es/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | El token por dispositivo en caché está obsoleto o revocado.                                                                                                                                   | Rota/vuelve a aprobar el token de dispositivo usando la [CLI de dispositivos](/es/cli/devices), luego reconecta.                                                                                                                                                                             |
| `AUTH_SCOPE_MISMATCH`        | El token de dispositivo es válido, pero su rol/ámbitos aprobados no cubren esta solicitud de conexión.                                                                                        | Vuelve a emparejar el dispositivo o aprueba el contrato de ámbitos solicitado; no trates esto como deriva de token compartido.                                                                                                                                                            |
| `PAIRING_REQUIRED`           | La identidad del dispositivo necesita aprobación. Revisa `error.details.reason` para `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade`, y usa `requestId` / `remediationHint` cuando estén presentes. | Aprueba la solicitud pendiente: `openclaw devices list` y luego `openclaw devices approve <requestId>`. Las actualizaciones de ámbito/rol usan el mismo flujo después de revisar el acceso solicitado.                                                                                    |

<Note>
Los RPC directos al backend por loopback autenticados con el token/contraseña compartidos del gateway no deberían depender de la base de ámbitos de dispositivo emparejado de la CLI. Si subagentes u otras llamadas internas aún fallan con `scope-upgrade`, verifica que el llamador esté usando `client.id: "gateway-client"` y `client.mode: "backend"` y que no esté forzando un `deviceIdentity` explícito o token de dispositivo.
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
    El cliente espera el `connect.challenge` emitido por el gateway.
  </Step>
  <Step title="Firmar la carga útil">
    El cliente firma la carga útil vinculada al desafío.
  </Step>
  <Step title="Enviar el nonce del dispositivo">
    El cliente envía `connect.params.device.nonce` con el mismo nonce de desafío.
  </Step>
</Steps>

Si `openclaw devices rotate` / `revoke` / `remove` se deniega inesperadamente:

- las sesiones con token de dispositivo emparejado solo pueden gestionar **su propio** dispositivo a menos que el llamador también tenga `operator.admin`
- `openclaw devices rotate --scope ...` solo puede solicitar ámbitos de operador que la sesión del llamador ya tenga

Relacionado:

- [Configuración](/es/gateway/configuration) (modos de autenticación del gateway)
- [Interfaz de control](/es/web/control-ui)
- [Dispositivos](/es/cli/devices)
- [Acceso remoto](/es/gateway/remote)
- [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)

## El servicio Gateway no está en ejecución

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
- Desajuste de configuración de servicio (`Config (cli)` frente a `Config (service)`).
- Conflictos de puerto/listener.
- Instalaciones launchd/systemd/schtasks adicionales cuando se usa `--deep`.
- Pistas de limpieza de `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Firmas comunes">
    - `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → el modo de gateway local no está habilitado, o el archivo de configuración fue sobrescrito y perdió `gateway.mode`. Solución: define `gateway.mode="local"` en tu configuración, o vuelve a ejecutar `openclaw onboard --mode local` / `openclaw setup` para volver a sellar la configuración esperada de modo local. Si ejecutas OpenClaw mediante Podman, la ruta de configuración predeterminada es `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → enlace no loopback sin una ruta de autenticación de gateway válida (token/contraseña, o proxy de confianza donde esté configurado).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflicto de puerto.
    - `Other gateway-like services detected (best effort)` → existen unidades launchd/systemd/schtasks obsoletas o paralelas. La mayoría de las configuraciones deberían mantener un gateway por máquina; si necesitas más de uno, aísla puertos + configuración/estado/workspace. Consulta [/gateway#multiple-gateways-same-host](/es/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` desde doctor → existe una unidad systemd del sistema mientras falta el servicio de nivel de usuario. Elimina o desactiva el duplicado antes de permitir que doctor instale un servicio de usuario, o define `OPENCLAW_SERVICE_REPAIR_POLICY=external` si la unidad del sistema es el supervisor previsto.
    - `Gateway service port does not match current gateway config` → el supervisor instalado aún fija el `--port` antiguo. Ejecuta `openclaw doctor --fix` o `openclaw gateway install --force`, luego reinicia el servicio gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Ejecución en segundo plano y herramienta de procesos](/es/gateway/background-process)
- [Configuración](/es/gateway/configuration)
- [Doctor](/es/gateway/doctor)

## El gateway de macOS deja de responder silenciosamente y luego se reanuda cuando tocas el panel

Usa esto cuando los canales (Telegram, WhatsApp, etc.) en un host macOS se quedan en silencio durante minutos u horas, y el gateway parece volver en el momento en que abres la interfaz de control, entras por SSH o interactúas de otro modo con el host. Normalmente no hay ningún síntoma evidente en `openclaw status` porque para cuando lo miras el gateway vuelve a estar activo.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Busca:

- Uno o más paquetes `*-uncaught_exception.json` en `~/.openclaw/logs/stability/` con `error.code` establecido en un código de red transitorio como `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` o `ECONNREFUSED`.
- Líneas de `pmset -g log` como `Entering Sleep state due to 'Maintenance Sleep'` o `en0 driver is slow (msg: WillChangeState to 0)` alineadas con las marcas de tiempo del bloqueo. Power Nap / Maintenance Sleep pone brevemente el controlador Wi-Fi en estado 0; cualquier `connect()` saliente que caiga en esa ventana puede fallar con `ENETDOWN` incluso en un host que por lo demás tiene conectividad de red completa.
- Salida de `launchctl print` que muestre `state = not running` con varios `runs` recientes y un código de salida, especialmente cuando la brecha entre el bloqueo y el siguiente inicio es del orden de una hora en lugar de segundos. launchd de macOS aplica una compuerta de protección de reinicio no documentada después de una ráfaga de bloqueos que puede dejar de respetar `KeepAlive=true` hasta que un desencadenador externo, como un inicio de sesión interactivo, una conexión del panel o `launchctl kickstart`, la reactive.

Firmas comunes:

- Un paquete de estabilidad cuyo `error.code` es `ENETDOWN` o un código relacionado, con la pila de llamadas apuntando a `lookupAndConnect` / `Socket.connect` de `net` en Node. OpenClaw `2026.5.26` y versiones posteriores clasifican estos errores como errores de red transitorios benignos, por lo que ya no se propagan al manejador de excepciones no capturadas de nivel superior; si estás en una versión anterior, actualiza primero.
- Largos periodos de inactividad que terminan en el instante en que te conectas a la Control UI o entras por SSH al host: la actividad visible para el usuario es lo que rearma la compuerta de reinicio de launchd, no nada que el panel haga al Gateway.
- El contador `runs` aumenta durante el día sin una línea correspondiente `received SIG*; shutting down` en `~/Library/Logs/openclaw/gateway.log`: los cierres limpios registran una señal; los bloqueos transitorios no.

Qué hacer:

1. **Actualiza el Gateway** si ejecutas una versión anterior a `2026.5.26`. Después de actualizar, los futuros errores `ENETDOWN` se registran como advertencias en lugar de terminar el proceso.
2. **Reduce la actividad de suspensión de mantenimiento** en hosts Mac mini / de escritorio pensados para ejecutarse como servidores siempre activos:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Esto reduce significativamente, aunque no elimina por completo, la oscilación subyacente del controlador. El sistema aún puede realizar algunas suspensiones de mantenimiento para TCP keepalive y mantenimiento de mDNS sin importar estas opciones.

3. **Agrega un watchdog de actividad** para que una futura ráfaga de bloqueos que quede aparcada por launchd se detecte rápidamente:

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   El objetivo es rearmar externamente la compuerta de reinicio; `KeepAlive=true` por sí solo no es suficiente en macOS después de una ráfaga de bloqueos.

Relacionado:

- [Notas de la plataforma macOS](/es/platforms/macos)
- [Registro](/es/logging)
- [Doctor](/es/gateway/doctor)

## El Gateway se cierra durante un uso elevado de memoria

Usa esto cuando el Gateway desaparece bajo carga, el supervisor informa un reinicio de estilo OOM, o los registros mencionan `critical memory pressure bundle written`.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Busca:

- `Reason: diagnostic.memory.pressure.critical` en el paquete de estabilidad más reciente.
- `Memory pressure:` con `critical/rss_threshold`, `critical/heap_threshold` o `critical/rss_growth`.
- Valores de `V8 heap:` cerca del límite de heap.
- Entradas de `Largest session files:` como `agents/<agent>/sessions/<session>.jsonl` o `sessions/<session>.jsonl`.
- Contadores de memoria de cgroup de Linux cuando el Gateway se ejecuta dentro de un contenedor o un servicio con memoria limitada.

Firmas comunes:

- `critical memory pressure bundle written` aparece poco antes del reinicio → OpenClaw capturó un paquete de estabilidad previo al OOM. Inspecciónalo con `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` aparece en los registros del Gateway → OpenClaw detectó presión crítica de memoria, pero la instantánea de estabilidad previa al OOM está desactivada.
- `Largest session files:` apunta a una ruta de transcripción redactada muy grande → reduce el historial de sesión retenido, inspecciona el crecimiento de la sesión o mueve transcripciones antiguas fuera del almacén activo antes de reiniciar.
- Los bytes usados de `V8 heap:` están cerca del límite de heap → reduce la presión de prompts/sesiones, reduce el trabajo concurrente o aumenta el límite de heap de Node solo después de confirmar que la carga de trabajo es esperada.
- `Memory pressure: critical/rss_growth` → la memoria creció rápidamente dentro de una ventana de muestreo. Revisa los registros más recientes para detectar una importación grande, salida descontrolada de herramientas, reintentos repetidos o un lote de trabajo de agentes en cola.
- Aparece presión crítica de memoria en los registros pero no existe ningún paquete → este es el valor predeterminado. Establece `diagnostics.memoryPressureSnapshot: true` para capturar el paquete de estabilidad previo al OOM en futuros eventos de presión crítica de memoria.

El paquete de estabilidad no incluye payloads. Incluye evidencia operativa de memoria y rutas relativas de archivos redactadas, no texto de mensajes, cuerpos de webhook, credenciales, tokens, cookies ni ids de sesión sin procesar. Adjunta la exportación de diagnósticos a los informes de errores en lugar de copiar registros sin procesar.

Relacionado:

- [Salud del Gateway](/es/gateway/health)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Sesiones](/es/cli/sessions)

## El Gateway rechazó una configuración no válida

Usa esto cuando el inicio del Gateway falla con `Invalid config` o los registros de recarga en caliente dicen
que se omitió una edición no válida.

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
- OpenClaw conserva los últimos 32 archivos `.clobbered.*` para cada ruta de configuración y rota los más antiguos

<AccordionGroup>
  <Accordion title="What happened">
    - La configuración no validó durante el inicio, la recarga en caliente o una escritura propiedad de OpenClaw.
    - El inicio del Gateway falla de forma cerrada en lugar de reescribir `openclaw.json`.
    - La recarga en caliente omite ediciones externas no válidas y mantiene activa la configuración de runtime actual.
    - Las escrituras propiedad de OpenClaw rechazan payloads no válidos/destructivos antes del commit y guardan `.rejected.*`.
    - `openclaw doctor --fix` es dueño de la reparación. Puede eliminar prefijos que no son JSON o restaurar la última copia conocida como buena mientras conserva el payload rechazado como `.clobbered.*`.
    - Cuando ocurren muchas reparaciones para una ruta de configuración, OpenClaw rota los archivos `.clobbered.*` más antiguos para que el payload reparado más reciente siga disponible.

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
    - Existe `.clobbered.*` → doctor conservó una edición externa rota mientras reparaba la configuración activa.
    - Existe `.rejected.*` → una escritura de configuración propiedad de OpenClaw falló las comprobaciones de esquema o sobrescritura antes del commit.
    - `Config write rejected:` → la escritura intentó eliminar la forma requerida, reducir bruscamente el archivo o persistir una configuración no válida.
    - `config reload skipped (invalid config):` → una edición directa falló la validación y fue ignorada por el Gateway en ejecución.
    - `Invalid config at ...` → el inicio falló antes de que arrancaran los servicios del Gateway.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` o `size-drop-vs-last-good:*` → una escritura propiedad de OpenClaw fue rechazada porque perdió campos o tamaño en comparación con la copia de seguridad última conocida como buena.
    - `Config last-known-good promotion skipped` → el candidato contenía marcadores de posición de secretos redactados como `***`.

  </Accordion>
  <Accordion title="Fix options">
    1. Ejecuta `openclaw doctor --fix` para dejar que doctor repare una configuración con prefijo/sobrescrita o restaure la última conocida como buena.
    2. Copia solo las claves previstas desde `.clobbered.*` o `.rejected.*`, luego aplícalas con `openclaw config set` o `config.patch`.
    3. Ejecuta `openclaw config validate` antes de reiniciar.
    4. Si editas a mano, conserva la configuración JSON5 completa, no solo el objeto parcial que querías cambiar.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Configuración](/es/cli/config)
- [Configuración: recarga en caliente](/es/gateway/configuration#config-hot-reload)
- [Configuración: validación estricta](/es/gateway/configuration#strict-validation)
- [Doctor](/es/gateway/doctor)

## Advertencias de sondeo del Gateway

Usa esto cuando `openclaw gateway probe` alcanza algo, pero aún imprime un bloque de advertencia.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Busca:

- `warnings[].code` y `primaryTargetId` en la salida JSON.
- Si la advertencia trata sobre fallback SSH, varios gateways, ámbitos faltantes o referencias de autenticación sin resolver.

Firmas comunes:

- `SSH tunnel failed to start; falling back to direct probes.` → la configuración SSH falló, pero el comando aun así intentó objetivos configurados/directos de loopback.
- `multiple reachable gateway identities detected` → respondieron gateways distintos, o OpenClaw no pudo demostrar que los objetivos alcanzables son el mismo Gateway. Un túnel SSH, una URL de proxy o una URL remota configurada hacia el mismo Gateway se trata como un Gateway con múltiples transportes, incluso cuando los puertos de transporte difieren.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la conexión funcionó, pero el RPC de detalle está limitado por el ámbito; empareja la identidad del dispositivo o usa credenciales con `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → la conexión funcionó, pero el conjunto completo de RPC de diagnóstico agotó el tiempo o falló. Trata esto como un Gateway alcanzable con diagnósticos degradados; compara `connect.ok` y `connect.rpcOk` en la salida `--json`.
- `Capability: pairing-pending` o `gateway closed (1008): pairing required` → el Gateway respondió, pero este cliente aún necesita emparejamiento/aprobación antes del acceso normal de operador.
- texto de advertencia de SecretRef `gateway.auth.*` / `gateway.remote.*` sin resolver → el material de autenticación no estuvo disponible en esta ruta de comando para el objetivo fallido.

Relacionado:

- [Gateway](/es/cli/gateway)
- [Varios gateways en el mismo host](/es/gateway#multiple-gateways-same-host)
- [Acceso remoto](/es/gateway/remote)

## Canal conectado, mensajes sin fluir

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
- Permisos/ámbitos de API de canal faltantes.

Firmas comunes:

- `mention required` → mensaje ignorado por la política de menciones de grupo.
- Trazas de `pairing` / aprobación pendiente → el remitente no está aprobado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de autenticación/permisos del canal.

Relacionado:

- [Solución de problemas de canales](/es/channels/troubleshooting)
- [Discord](/es/channels/discord)
- [Telegram](/es/channels/telegram)
- [WhatsApp](/es/channels/whatsapp)

## Entrega de Cron y Heartbeat

Si Cron o Heartbeat no se ejecutó o no entregó, verifica primero el estado del programador y luego el objetivo de entrega.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Busca:

- Cron habilitado y siguiente activación presente.
- Estado del historial de ejecuciones del trabajo (`ok`, `skipped`, `error`).
- Motivos de omisión de Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Señales comunes">
    - `cron: scheduler disabled; jobs will not run automatically` → cron deshabilitado.
    - `cron: timer tick failed` → falló el tick del programador; revisa errores de archivo, registro o runtime.
    - `heartbeat skipped` con `reason=quiet-hours` → fuera de la ventana de horas activas.
    - `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe, pero solo contiene espacios en blanco, comentarios, encabezado, bloque de código o estructura de checklist vacía, por lo que OpenClaw omite la llamada al modelo.
    - `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un bloque `tasks:`, pero ninguna de las tareas vence en este tick.
    - `heartbeat: unknown accountId` → id de cuenta no válido para el destino de entrega de Heartbeat.
    - `heartbeat skipped` con `reason=dm-blocked` → el destino de Heartbeat se resolvió como un destino de tipo DM mientras `agents.defaults.heartbeat.directPolicy` (o la anulación por agente) está configurado como `block`.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Heartbeat](/es/gateway/heartbeat)
- [Tareas programadas](/es/automation/cron-jobs)
- [Tareas programadas: solución de problemas](/es/automation/cron-jobs#troubleshooting)

## Node emparejado, la herramienta falla

Si un Node está emparejado pero las herramientas fallan, aísla el estado de primer plano, permisos y aprobaciones.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Busca:

- Node en línea con las capacidades esperadas.
- Concesiones de permisos del sistema operativo para cámara, micrófono, ubicación y pantalla.
- Aprobaciones de exec y estado de la allowlist.

Señales comunes:

- `NODE_BACKGROUND_UNAVAILABLE` → la aplicación del Node debe estar en primer plano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → falta un permiso del sistema operativo.
- `SYSTEM_RUN_DENIED: approval required` → aprobación de exec pendiente.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado por la allowlist.

Relacionado:

- [Aprobaciones de exec](/es/tools/exec-approvals)
- [Solución de problemas de Node](/es/nodes/troubleshooting)
- [Nodes](/es/nodes/index)

## La herramienta de navegador falla

Usa esto cuando las acciones de la herramienta de navegador fallen aunque el Gateway esté sano.

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
  <Accordion title="Señales de Plugin / ejecutable">
    - `unknown command "browser"` o `unknown command 'browser'` → el Plugin de navegador incluido está excluido por `plugins.allow`.
    - herramienta de navegador ausente / no disponible mientras `browser.enabled=true` → `plugins.allow` excluye `browser`, por lo que el Plugin nunca se cargó.
    - `Failed to start Chrome CDP on port` → el proceso del navegador no pudo iniciarse.
    - `browser.executablePath not found` → la ruta configurada no es válida.
    - `browser.cdpUrl must be http(s) or ws(s)` → la URL de CDP configurada usa un esquema no compatible, como `file:` o `ftp:`.
    - `browser.cdpUrl has invalid port` → la URL de CDP configurada tiene un puerto incorrecto o fuera de rango.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → la instalación actual del Gateway no tiene la dependencia principal del runtime de navegador; reinstala o actualiza OpenClaw y luego reinicia el Gateway. Las instantáneas ARIA y las capturas básicas de página aún pueden funcionar, pero la navegación, las instantáneas de IA, las capturas de elementos por selector CSS y la exportación a PDF siguen no disponibles.

  </Accordion>
  <Accordion title="Señales de Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session aún no pudo adjuntarse al directorio de datos del navegador seleccionado. Abre la página de inspección del navegador, habilita la depuración remota, mantén el navegador abierto, aprueba el primer aviso de adjuntar y vuelve a intentarlo. Si no se requiere estado de sesión iniciada, prefiere el perfil gestionado `openclaw`.
    - `No Chrome tabs found for profile="user"` → el perfil de adjuntar de Chrome MCP no tiene pestañas locales de Chrome abiertas.
    - `Remote CDP for profile "<name>" is not reachable` → no se puede acceder al endpoint CDP remoto configurado desde el host del Gateway.
    - `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → el perfil de solo adjuntar no tiene un destino accesible, o el endpoint HTTP respondió pero el WebSocket CDP aún no pudo abrirse.

  </Accordion>
  <Accordion title="Señales de elemento / captura / carga">
    - `fullPage is not supported for element screenshots` → la solicitud de captura combinó `--full-page` con `--ref` o `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → las llamadas de captura de Chrome MCP / `existing-session` deben usar captura de página o una `--ref` de instantánea, no CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → los hooks de carga de Chrome MCP necesitan refs de instantánea, no selectores CSS.
    - `existing-session file uploads currently support one file at a time.` → envía una carga por llamada en perfiles de Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → los hooks de diálogo en perfiles de Chrome MCP no admiten anulaciones de timeout.
    - `existing-session type does not support timeoutMs overrides.` → omite `timeoutMs` para `act:type` en perfiles `profile="user"` / Chrome MCP existing-session, o usa un perfil de navegador gestionado/CDP cuando se requiera un timeout personalizado.
    - `existing-session evaluate does not support timeoutMs overrides.` → omite `timeoutMs` para `act:evaluate` en perfiles `profile="user"` / Chrome MCP existing-session, o usa un perfil de navegador gestionado/CDP cuando se requiera un timeout personalizado.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` todavía requiere un navegador gestionado o un perfil CDP sin procesar.
    - anulaciones obsoletas de viewport / modo oscuro / locale / offline en perfiles de solo adjuntar o CDP remoto → ejecuta `openclaw browser stop --browser-profile <name>` para cerrar la sesión de control activa y liberar el estado de emulación de Playwright/CDP sin reiniciar todo el Gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Navegador (gestionado por OpenClaw)](/es/tools/browser)
- [Solución de problemas del navegador](/es/tools/browser-linux-troubleshooting)

## Si actualizaste y algo se rompió de repente

La mayoría de las roturas posteriores a una actualización son deriva de configuración o valores predeterminados más estrictos que ahora se aplican.

<AccordionGroup>
  <Accordion title="1. Cambió el comportamiento de auth y de anulación de URL">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Qué revisar:

    - Si `gateway.mode=remote`, las llamadas de la CLI pueden estar apuntando al remoto mientras tu servicio local está bien.
    - Las llamadas explícitas con `--url` no hacen fallback a credenciales almacenadas.

    Señales comunes:

    - `gateway connect failed:` → destino de URL incorrecto.
    - `unauthorized` → endpoint accesible, pero auth incorrecta.

  </Accordion>
  <Accordion title="2. Las salvaguardas de bind y auth son más estrictas">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Qué revisar:

    - Los binds que no son loopback (`lan`, `tailnet`, `custom`) necesitan una ruta válida de auth del Gateway: auth con token/contraseña compartida, o un despliegue `trusted-proxy` que no sea loopback correctamente configurado.
    - Las claves antiguas como `gateway.token` no reemplazan `gateway.auth.token`.

    Señales comunes:

    - `refusing to bind gateway ... without auth` → bind que no es loopback sin una ruta válida de auth del Gateway.
    - `Connectivity probe: failed` mientras el runtime está en ejecución → Gateway activo pero inaccesible con la auth/url actual.

  </Accordion>
  <Accordion title="3. Cambió el estado de emparejamiento e identidad del dispositivo">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Qué revisar:

    - Aprobaciones de dispositivos pendientes para panel/nodes.
    - Aprobaciones de emparejamiento por DM pendientes después de cambios de política o identidad.

    Señales comunes:

    - `device identity required` → auth del dispositivo no satisfecha.
    - `pairing required` → el remitente/dispositivo debe estar aprobado.

  </Accordion>
</AccordionGroup>

Si la configuración del servicio y el runtime siguen discrepando después de las comprobaciones, reinstala los metadatos del servicio desde el mismo perfil/directorio de estado:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Relacionado:

- [Autenticación](/es/gateway/authentication)
- [Exec en segundo plano y herramienta de proceso](/es/gateway/background-process)
- [Emparejamiento propiedad del Gateway](/es/gateway/pairing)

## Relacionado

- [Doctor](/es/gateway/doctor)
- [FAQ](/es/help/faq)
- [Runbook del Gateway](/es/gateway)
