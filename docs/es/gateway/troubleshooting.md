---
read_when:
    - El centro de solución de problemas te dirigió aquí para un diagnóstico más profundo
    - Necesitas secciones de runbook estables basadas en síntomas con comandos exactos
sidebarTitle: Troubleshooting
summary: Runbook de solución avanzada de problemas para Gateway, canales, automatización, nodos y navegador
title: Solución de problemas
x-i18n:
    generated_at: "2026-07-05T11:23:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1975522afa7eada6b79e7ea4b117e645b0273b506ecf2e071542d820555adff0
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Este es el runbook detallado. Empieza primero en [/help/troubleshooting](/es/help/troubleshooting) para el flujo de triaje rápido.

## Escalera de comandos

Ejecútalos en este orden:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Señales saludables:

- `openclaw gateway status` muestra `Runtime: running`, `Connectivity probe: ok` y una línea `Capability: ...`.
- `openclaw doctor` no informa problemas bloqueantes de configuración o servicio.
- `openclaw channels status --probe` muestra el estado de transporte activo por cuenta y, donde sea compatible, `works` o `audit ok`.

## Después de una actualización

Úsalo cuando una actualización termina pero el Gateway está caído, los canales están vacíos o las llamadas al modelo fallan con errores 401.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Busca:

- `Update restart` en `openclaw status` / `openclaw status --all`. Las transferencias pendientes o fallidas incluyen el siguiente comando que se debe ejecutar.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` bajo Canales: la configuración del canal todavía existe, pero el registro del Plugin falló antes de que el canal pudiera cargarse.
- Errores 401 del proveedor después de volver a autenticar: `openclaw doctor --fix` comprueba si hay sombras de autenticación OAuth obsoletas por agente y elimina las copias antiguas para que todos los agentes resuelvan el perfil compartido actual.

## Instalaciones divididas y protección de configuración más nueva

Úsalo cuando un servicio de Gateway se detiene inesperadamente después de una actualización, o los registros muestran que un binario `openclaw` es más antiguo que la versión que escribió por última vez `openclaw.json`.

OpenClaw marca las escrituras de configuración con `meta.lastTouchedVersion`. Los comandos de solo lectura pueden inspeccionar una configuración escrita por una versión más nueva de OpenClaw, pero las mutaciones de proceso y servicio se niegan a ejecutarse desde un binario más antiguo. Acciones bloqueadas: inicio/detención/reinicio/desinstalación del servicio de Gateway, reinstalación forzada del servicio, inicio del Gateway en modo servicio y limpieza de puerto con `gateway --force`.

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
  <Step title="Reinstalar el servicio de gateway">
    Reinstala el servicio de gateway previsto desde la instalación más nueva:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Eliminar wrappers obsoletos">
    Elimina las entradas obsoletas de paquetes del sistema o wrappers antiguos que todavía apuntan a un binario `openclaw` antiguo.
  </Step>
</Steps>

<Warning>
Solo para una degradación intencional o recuperación de emergencia, establece `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` para el comando único. Déjalo sin establecer durante el funcionamiento normal.
</Warning>

## Desajuste de protocolo después de una reversión

Úsalo cuando los registros siguen imprimiendo `protocol mismatch` después de una degradación o reversión. Se está ejecutando un Gateway más antiguo, pero un proceso de cliente local más nuevo todavía se vuelve a conectar con un rango de protocolo que el Gateway antiguo no puede hablar.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Busca:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` en los registros del Gateway.
- `Established clients:` en `openclaw gateway status --deep` o `Gateway clients` en `openclaw doctor --deep`: clientes TCP activos conectados al puerto del Gateway, con PID y líneas de comandos cuando el sistema operativo lo permite.
- Un proceso de cliente cuya línea de comandos apunta a la instalación o wrapper de OpenClaw más nuevo desde el que hiciste la reversión.

Corrección:

1. Detén o reinicia el proceso de cliente de OpenClaw obsoleto que muestra `gateway status --deep`.
2. Reinicia las aplicaciones o wrappers que incorporan OpenClaw: paneles locales, editores, ayudantes de servidor de aplicaciones o shells de larga duración con `openclaw logs --follow`.
3. Vuelve a ejecutar `openclaw gateway status --deep` o `openclaw doctor --deep` y confirma que el PID del cliente obsoleto ya no está.

No hagas que un Gateway más antiguo acepte un protocolo más nuevo incompatible. Los incrementos de protocolo protegen el contrato de cable; la recuperación de una reversión es un problema de limpieza de procesos/versiones.

## Symlink de Skill omitido como escape de ruta

Úsalo cuando los registros incluyan:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

Cada raíz de Skill es un límite de contención. Un symlink bajo `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` o `~/.openclaw/skills` se omite cuando su destino real se resuelve fuera de esa raíz, a menos que el destino sea explícitamente de confianza.

Inspecciona el enlace:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Si el destino es intencional, configura tanto la raíz directa de Skills como el destino de symlink permitido:

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

Luego inicia una nueva sesión o espera a que el observador de Skills se actualice. Reinicia el gateway si el proceso en ejecución es anterior al cambio de configuración.

No uses destinos amplios como `~`, `/` o una carpeta completa de proyecto sincronizado. Mantén `allowSymlinkTargets` limitado a la raíz real de Skills que contiene directorios `SKILL.md` de confianza.

Si la aplicación de Skill Workshop también debe escribir a través de esas rutas de Skills de workspace con symlink de confianza, habilita `skills.workshop.allowSymlinkTargetWrites`. Mantenlo deshabilitado para raíces de Skills compartidas de solo lectura.

Relacionado:

- [Configuración de Skills](/es/tools/skills-config#symlinked-skill-roots)
- [Ejemplos de configuración](/es/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Uso adicional requerido de Anthropic 429 para contexto largo

Úsalo cuando los registros/errores incluyan: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Busca:

- El modelo de Anthropic seleccionado es un modelo Claude 4.x compatible con GA de 1M (Opus 4.6/4.7/4.8, Sonnet 4.6), o la configuración del modelo todavía lleva el `params.context1m: true` heredado.
- La credencial actual de Anthropic no es elegible para uso de contexto largo.
- Las solicitudes fallan solo en sesiones largas/ejecuciones de modelo que necesitan la ruta de contexto 1M.

Opciones de corrección:

<Steps>
  <Step title="Usar una ventana de contexto estándar">
    Cambia a un modelo con ventana estándar o elimina el `context1m` heredado de la configuración de modelo antigua que no es compatible con GA para contexto 1M.
  </Step>
  <Step title="Usar una credencial elegible">
    Usa una credencial de Anthropic que sea elegible para solicitudes de contexto largo, o cambia a una clave de API de Anthropic.
  </Step>
  <Step title="Configurar modelos de fallback">
    Configura modelos de fallback para que las ejecuciones continúen cuando se rechacen solicitudes de contexto largo de Anthropic.
  </Step>
</Steps>

Relacionado:

- [Anthropic](/es/providers/anthropic)
- [Uso y costos de tokens](/es/reference/token-use)
- [¿Por qué veo HTTP 429 de Anthropic?](/es/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Respuestas 403 bloqueadas por upstream

Úsalo cuando un proveedor LLM upstream devuelve un `403` genérico como `Your request was blocked`.

No asumas que esto siempre es un problema de configuración de OpenClaw. La respuesta puede provenir de una capa de seguridad upstream, como una CDN, WAF, regla de gestión de bots o proxy inverso delante de un endpoint compatible con OpenAI.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Busca:

- Varios modelos bajo el mismo proveedor fallando de la misma manera.
- HTML o texto de seguridad genérico en lugar de un error normal de API del proveedor.
- Eventos de seguridad del lado del proveedor para la misma hora de solicitud.
- Una pequeña prueba directa con `curl` que tiene éxito mientras las solicitudes normales con forma de SDK fallan.

Corrige primero el filtrado del lado del proveedor cuando la evidencia apunte a un bloqueo de WAF/CDN. Prefiere una regla de omisión o permiso con alcance estrecho para la ruta de API que usa OpenClaw, y evita deshabilitar la protección para todo el sitio.

<Warning>
Un `curl` mínimo correcto no garantiza que las solicitudes reales de estilo SDK pasen por la misma capa de seguridad upstream.
</Warning>

Relacionado:

- [Endpoints compatibles con OpenAI](/es/gateway/configuration-reference#openai-compatible-endpoints)
- [Configuración de proveedores](/es/providers)
- [Registros](/es/logging)

## El backend local compatible con OpenAI pasa pruebas directas, pero las ejecuciones de agente fallan

Úsalo cuando:

- `curl ... /v1/models` funciona.
- Las llamadas directas pequeñas a `/v1/chat/completions` funcionan.
- Las ejecuciones de modelo de OpenClaw fallan solo en turnos normales de agente.

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Busca:

- Las llamadas directas pequeñas tienen éxito, pero las ejecuciones de OpenClaw fallan solo con prompts más grandes.
- Errores `model_not_found` o 404 aunque `/v1/chat/completions` directo funcione con el mismo id de modelo sin prefijo.
- Errores de backend sobre que `messages[].content` espera una cadena.
- Advertencias intermitentes `incomplete turn detected ... stopReason=stop payloads=0` con un backend local compatible con OpenAI.
- Fallos del backend que aparecen solo con conteos más grandes de tokens de prompt o prompts completos del runtime de agente.

<AccordionGroup>
  <Accordion title="Firmas comunes">
    - `model_not_found` con un servidor local de estilo MLX/vLLM: verifica que `baseUrl` incluya `/v1`, que `api` sea `"openai-completions"` para backends `/v1/chat/completions` y que `models.providers.<provider>.models[].id` sea el id local del proveedor sin prefijo. Selecciónalo una vez con el prefijo del proveedor, por ejemplo `mlx/mlx-community/Qwen3-30B-A3B-6bit`; mantén la entrada del catálogo como `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string`: el backend rechaza partes de contenido estructurado de Chat Completions. Corrección: establece `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` o claves de mensaje permitidas como `["role","content"]`: el backend rechaza metadatos de replay de estilo OpenAI en mensajes de Chat Completions. Corrección: establece `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0`: el backend completó la solicitud de Chat Completions, pero no devolvió texto de asistente visible para el usuario en ese turno. OpenClaw reintenta una vez los turnos vacíos compatibles con OpenAI y seguros para replay; los fallos persistentes suelen significar que el backend está emitiendo contenido vacío/no textual o suprimiendo el texto de respuesta final.
    - Las solicitudes directas pequeñas tienen éxito, pero las ejecuciones de agente de OpenClaw fallan con fallos del backend/modelo (por ejemplo Gemma en algunas compilaciones de `inferrs`): es probable que el transporte de OpenClaw ya sea correcto; el backend está fallando con la forma de prompt más grande del runtime de agente.
    - Los fallos se reducen después de deshabilitar herramientas, pero no desaparecen: los esquemas de herramientas formaban parte de la presión, pero el problema restante sigue siendo capacidad del modelo/servidor upstream o un bug del backend.

  </Accordion>
  <Accordion title="Opciones de corrección">
    1. Establece `compat.requiresStringContent: true` para backends de Chat Completions que solo aceptan cadenas.
    2. Establece `compat.strictMessageKeys: true` para backends estrictos de Chat Completions que solo aceptan `role` y `content` en cada mensaje.
    3. Establece `compat.supportsTools: false` para modelos/backends que no pueden manejar de forma fiable la superficie de esquemas de herramientas de OpenClaw.
    4. Reduce la presión del prompt donde sea posible: bootstrap de workspace más pequeño, historial de sesión más corto, modelo local más ligero o un backend con soporte de contexto largo más sólido.
    5. Si las solicitudes directas pequeñas siguen pasando mientras los turnos de agente de OpenClaw todavía fallan dentro del backend, trátalo como una limitación del servidor/modelo upstream y presenta allí una reproducción con la forma de payload aceptada.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Configuración](/es/gateway/configuration)
- [Modelos locales](/es/gateway/local-models)
- [Endpoints compatibles con OpenAI](/es/gateway/configuration-reference#openai-compatible-endpoints)

## Sin respuestas

Si los canales están activos pero nada responde, comprueba el enrutamiento y la política antes de volver a conectar nada.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Busca:

- Emparejamiento pendiente para remitentes de DM.
- Bloqueo de menciones en grupos (`requireMention`, `mentionPatterns`).
- Desajustes en la lista de permitidos de canal/grupo.

Firmas comunes:

- `drop guild message (mention required` → mensaje de grupo ignorado hasta que haya una mención.
- `pairing request` → el remitente necesita aprobación.
- `blocked` / `allowlist` → el remitente/canal fue filtrado por la política.

Relacionado:

- [Solución de problemas de canales](/es/channels/troubleshooting)
- [Grupos](/es/channels/groups)
- [Emparejamiento](/es/channels/pairing)

## Conectividad de la UI de control del panel

Cuando el panel/UI de control no se conecte, valida la URL, el modo de autenticación y los supuestos de contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Busca:

- URL de sondeo y URL del panel correctas.
- Desajuste de modo/token de autenticación entre el cliente y el Gateway.
- Uso de HTTP cuando se requiere identidad de dispositivo.

Si un navegador local no puede conectarse a `127.0.0.1:18789` después de una actualización, primero recupera el servicio local de Gateway y confirma que está sirviendo el panel:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Si `curl` devuelve HTML de OpenClaw, el Gateway está funcionando y el problema restante probablemente sea la caché del navegador, un enlace profundo antiguo o estado obsoleto de la pestaña. Abre `http://127.0.0.1:18789` directamente y navega desde el panel. Si el reinicio no deja el servicio en ejecución, ejecuta `openclaw gateway start` y vuelve a comprobar `openclaw gateway status`.

<AccordionGroup>
  <Accordion title="Firmas de conexión/autenticación">
    - `device identity required` → contexto no seguro o falta autenticación de dispositivo.
    - `origin not allowed` → el `Origin` del navegador no está en `gateway.controlUi.allowedOrigins` (o te estás conectando desde un origen de navegador que no es loopback sin una lista de permitidos explícita).
    - `device nonce required` / `device nonce mismatch` → el cliente no está completando el flujo de autenticación de dispositivo basado en desafío (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → el cliente firmó la carga útil incorrecta (o una marca de tiempo obsoleta) para el intercambio actual.
    - `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → el cliente puede hacer un reintento de confianza con el token de dispositivo en caché.
    - Ese reintento con token en caché reutiliza el conjunto de ámbitos en caché almacenado con el token de dispositivo emparejado. Los llamadores con `deviceToken` explícito / `scopes` explícitos conservan en cambio su conjunto de ámbitos solicitado.
    - `AUTH_SCOPE_MISMATCH` → el token de dispositivo fue reconocido, pero sus ámbitos aprobados no cubren esta solicitud de conexión; vuelve a emparejar o aprueba el contrato de ámbitos solicitado en lugar de rotar un token compartido del gateway.
    - Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es primero token/contraseña compartidos explícitos, luego `deviceToken` explícito, luego token de dispositivo almacenado y luego token de arranque.
    - En la ruta asíncrona de la UI de control de Tailscale Serve, los intentos fallidos para el mismo `{scope, ip}` se serializan antes de que el limitador registre el fallo. Por lo tanto, dos reintentos incorrectos concurrentes del mismo cliente pueden mostrar `retry later` en el segundo intento en lugar de dos desajustes simples.
    - `too many failed authentication attempts (retry later)` desde un cliente loopback con origen de navegador → los fallos repetidos desde ese mismo `Origin` normalizado quedan bloqueados temporalmente; otro origen localhost usa un bucket separado.
    - `unauthorized` repetido después de ese reintento → deriva del token compartido/token de dispositivo; actualiza la configuración del token y vuelve a aprobar/rotar el token de dispositivo si es necesario.
    - `gateway connect failed:` → objetivo de host/puerto/url incorrecto.

  </Accordion>
</AccordionGroup>

### Mapa rápido de códigos de detalle de autenticación

Usa `error.details.code` de la respuesta `connect` fallida para elegir la siguiente acción:

| Código de detalle            | Significado                                                                                                                                                                                 | Acción recomendada                                                                                                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | El cliente no envió un token compartido requerido.                                                                                                                                          | Pega/configura el token en el cliente y vuelve a intentarlo. Para rutas del panel: `openclaw config get gateway.auth.token` y luego pégalo en la configuración de la UI de control.                                                                                                      |
| `AUTH_TOKEN_MISMATCH`        | El token compartido no coincidió con el token de autenticación del gateway.                                                                                                                  | Si `canRetryWithDeviceToken=true`, permite un reintento de confianza. Los reintentos con token en caché reutilizan los ámbitos aprobados almacenados; los llamadores con `deviceToken` / `scopes` explícitos conservan los ámbitos solicitados. Si sigue fallando, ejecuta la [lista de comprobación de recuperación de deriva de tokens](/es/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | El token en caché por dispositivo está obsoleto o revocado.                                                                                                                                 | Rota/vuelve a aprobar el token de dispositivo usando la [CLI de dispositivos](/es/cli/devices), luego vuelve a conectarte.                                                                                                                                                                  |
| `AUTH_SCOPE_MISMATCH`        | El token de dispositivo es válido, pero su rol/ámbitos aprobados no cubren esta solicitud de conexión.                                                                                       | Vuelve a emparejar el dispositivo o aprueba el contrato de ámbitos solicitado; no trates esto como deriva del token compartido.                                                                                                                                                           |
| `PAIRING_REQUIRED`           | La identidad del dispositivo necesita aprobación. Revisa `error.details.reason` para `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade`, y usa `requestId` / `remediationHint` cuando estén presentes. | Aprueba la solicitud pendiente: `openclaw devices list` y luego `openclaw devices approve <requestId>`. Las actualizaciones de ámbito/rol usan el mismo flujo después de revisar el acceso solicitado.                                                                                   |

<Note>
Las RPC directas al backend loopback autenticadas con el token/contraseña compartidos del gateway no deberían depender de la línea base de ámbitos de dispositivos emparejados de la CLI. Si subagentes u otras llamadas internas siguen fallando con `scope-upgrade`, verifica que el llamador esté usando `client.id: "gateway-client"` y `client.mode: "backend"` y que no esté forzando una `deviceIdentity` explícita ni un token de dispositivo.
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

- Las sesiones con token de dispositivo emparejado solo pueden administrar **su propio** dispositivo a menos que el llamador también tenga `operator.admin`.
- `openclaw devices rotate --scope ...` solo puede solicitar ámbitos de operador que la sesión del llamador ya tenga.

Relacionado:

- [Configuración](/es/gateway/configuration) (modos de autenticación del gateway)
- [UI de control](/es/web/control-ui)
- [Dispositivos](/es/cli/devices)
- [Acceso remoto](/es/gateway/remote)
- [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)

## El servicio de Gateway no está en ejecución

Úsalo cuando el servicio está instalado pero el proceso no se mantiene activo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # también escanea servicios de nivel sistema
```

Busca:

- `Runtime: stopped` con pistas de salida.
- Desajuste de configuración del servicio (`Config (cli)` frente a `Config (service)`).
- Conflictos de puerto/listener.
- Instalaciones launchd/systemd/schtasks adicionales cuando se usa `--deep`.
- Pistas de limpieza de `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Firmas comunes">
    - `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → el modo de gateway local no está habilitado, o el archivo de configuración fue sobrescrito y perdió `gateway.mode`. Corrección: define `gateway.mode="local"` en tu configuración, o vuelve a ejecutar `openclaw onboard --mode local` / `openclaw setup` para volver a sellar la configuración de modo local esperada. Si ejecutas OpenClaw mediante Podman, la ruta de configuración predeterminada es `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → enlace no loopback sin una ruta válida de autenticación de gateway (token/contraseña, o proxy de confianza donde esté configurado).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflicto de puerto.
    - `Other gateway-like services detected (best effort)` → existen unidades launchd/systemd/schtasks obsoletas o paralelas. La mayoría de las configuraciones deberían mantener un gateway por máquina; si necesitas más de uno, aísla puertos + configuración/estado/espacio de trabajo. Consulta [/gateway#multiple-gateways-same-host](/es/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` desde doctor → existe una unidad de sistema systemd mientras falta el servicio de nivel usuario. Elimina o deshabilita el duplicado antes de permitir que doctor instale un servicio de usuario, o define `OPENCLAW_SERVICE_REPAIR_POLICY=external` si la unidad de sistema es el supervisor previsto.
    - `Gateway service port does not match current gateway config` → el supervisor instalado todavía fija el `--port` antiguo. Ejecuta `openclaw doctor --fix` o `openclaw gateway install --force`, luego reinicia el servicio gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Ejecución en segundo plano y herramienta de procesos](/es/gateway/background-process)
- [Configuración](/es/gateway/configuration)
- [Doctor](/es/gateway/doctor)

## El gateway de macOS deja de responder silenciosamente y luego se reanuda cuando tocas el panel

Úsalo cuando los canales (Telegram, WhatsApp, etc.) en un host macOS quedan en silencio durante minutos u horas, y el gateway parece volver en el momento en que abres la UI de control, entras por SSH o interactúas de otro modo con el host. Normalmente no hay ningún síntoma obvio en `openclaw status` porque para cuando miras el gateway ya está vivo de nuevo.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Busca:

- Uno o más paquetes `*-uncaught_exception.json` en `~/.openclaw/logs/stability/` con `error.code` establecido en un código de red transitorio como `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` o `ECONNREFUSED`.
- Líneas de `pmset -g log` como `Entering Sleep state due to 'Maintenance Sleep'` o `en0 driver is slow (msg: WillChangeState to 0)` alineadas con las marcas de tiempo del bloqueo. Power Nap / Maintenance Sleep pone brevemente el controlador Wi-Fi en estado 0; cualquier `connect()` saliente que caiga en esa ventana puede fallar con `ENETDOWN` incluso en un host que, por lo demás, tiene conectividad de red completa.
- Salida de `launchctl print` que muestra `state = not running` con varios `runs` recientes y un código de salida, especialmente cuando la separación entre el bloqueo y el siguiente inicio es del orden de una hora en vez de segundos. launchd de macOS aplica una puerta de protección de reinicio no documentada después de una ráfaga de bloqueos que puede dejar de respetar `KeepAlive=true` hasta que un disparador externo, como un inicio de sesión interactivo, una conexión del panel o `launchctl kickstart`, la reactive.

Firmas comunes:

- Un paquete de estabilidad cuyo `error.code` es `ENETDOWN` o un código relacionado, con la pila de llamadas apuntando a `lookupAndConnect` / `Socket.connect` de `net` en Node. OpenClaw `2026.5.26` y versiones posteriores clasifican estos casos como errores de red transitorios benignos, de modo que ya no se propagan al manejador de excepciones no capturadas de nivel superior; si usas una versión anterior, actualiza primero.
- Periodos largos de inactividad que terminan en el instante en que te conectas a la Control UI o haces SSH al host: la actividad visible para el usuario es lo que rearma la puerta de reinicio de launchd, no nada que el panel haga al Gateway.
- El contador `runs` aumenta a lo largo del día sin una línea correspondiente `received SIG*; shutting down` en `~/Library/Logs/openclaw/gateway.log`: los cierres limpios registran una señal; los bloqueos transitorios no.

Qué hacer:

1. **Actualiza el gateway** si estás ejecutando una versión anterior a `2026.5.26`. Después de actualizar, los futuros errores `ENETDOWN` se registran como advertencias en lugar de terminar el proceso.
2. **Reduce la actividad de suspensión de mantenimiento** en hosts Mac mini / de escritorio destinados a ejecutarse como servidores siempre activos:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Esto reduce de forma significativa, pero no elimina por completo, la oscilación subyacente del controlador. El sistema todavía puede realizar algunas suspensiones de mantenimiento para TCP keepalive y mantenimiento de mDNS independientemente de estas banderas.

3. **Añade un watchdog de liveness** para que una futura ráfaga de bloqueos que quede aparcada por launchd se detecte rápidamente:

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   El objetivo es rearmar externamente la puerta de reinicio; `KeepAlive=true` por sí solo no es suficiente en macOS después de una ráfaga de bloqueos.

Relacionado:

- [Notas de plataforma de macOS](/es/platforms/macos)
- [Registro](/es/logging)
- [Doctor](/es/gateway/doctor)

## El Gateway se cierra durante un uso elevado de memoria

Úsalo cuando el Gateway desaparezca bajo carga, el supervisor informe un reinicio de tipo OOM o los registros mencionen `critical memory pressure bundle written`.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Busca:

- `Reason: diagnostic.memory.pressure.critical` en el paquete de estabilidad más reciente.
- `Memory pressure:` con `critical/rss_threshold`, `critical/heap_threshold` o `critical/rss_growth`.
- Valores de `V8 heap:` cerca del límite del heap.
- Entradas de `Largest session files:` como `agents/<agent>/sessions/<session>.jsonl` o `sessions/<session>.jsonl`.
- Contadores de memoria de cgroup en Linux cuando el gateway se ejecuta dentro de un contenedor o servicio con memoria limitada.

Firmas comunes:

- `critical memory pressure bundle written` aparece poco antes del reinicio → OpenClaw capturó un paquete de estabilidad previo a OOM. Inspecciónalo con `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` aparece en los registros del gateway → OpenClaw detectó presión de memoria crítica, pero la instantánea de estabilidad previa a OOM está desactivada.
- `Largest session files:` apunta a una ruta de transcripción redactada muy grande → reduce el historial de sesión retenido, inspecciona el crecimiento de la sesión o mueve transcripciones antiguas fuera del almacén activo antes de reiniciar.
- Los bytes usados de `V8 heap:` están cerca del límite del heap → reduce la presión de prompts/sesiones, reduce el trabajo concurrente o aumenta el límite del heap de Node solo después de confirmar que la carga de trabajo es esperada.
- `Memory pressure: critical/rss_growth` → la memoria creció rápidamente dentro de una ventana de muestreo. Revisa los registros más recientes en busca de una importación grande, salida descontrolada de herramientas, reintentos repetidos o un lote de trabajo de agentes en cola.
- Aparece presión de memoria crítica en los registros pero no existe ningún paquete → este es el valor predeterminado. Establece `diagnostics.memoryPressureSnapshot: true` para capturar el paquete de estabilidad previo a OOM en futuros eventos de presión de memoria crítica.

El paquete de estabilidad no contiene cargas útiles. Incluye evidencia operativa de memoria y rutas de archivo relativas redactadas, no texto de mensajes, cuerpos de webhook, credenciales, tokens, cookies ni ids de sesión sin procesar. Adjunta la exportación de diagnósticos a los informes de errores en lugar de copiar registros sin procesar.

Relacionado:

- [Estado del Gateway](/es/gateway/health)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Sesiones](/es/cli/sessions)

## El Gateway rechazó una configuración no válida

Úsalo cuando el inicio del Gateway falle con `Invalid config` o los registros de recarga en caliente indiquen que se omitió una edición no válida.

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
- Un archivo `openclaw.json.rejected.*` con marca de tiempo junto a la configuración activa.
- Un archivo `openclaw.json.clobbered.*` con marca de tiempo si `doctor --fix` reparó una edición directa rota.
- OpenClaw conserva los 32 archivos `.clobbered.*` más recientes para cada ruta de configuración y rota los más antiguos.

<AccordionGroup>
  <Accordion title="Qué ocurrió">
    - La configuración no validó durante el inicio, la recarga en caliente o una escritura propiedad de OpenClaw.
    - El inicio del Gateway falla de forma cerrada en lugar de reescribir `openclaw.json`.
    - La recarga en caliente omite ediciones externas no válidas y mantiene activa la configuración de tiempo de ejecución actual.
    - Las escrituras propiedad de OpenClaw rechazan cargas no válidas/destructivas antes de confirmar y guardan `.rejected.*`.
    - `openclaw doctor --fix` es responsable de la reparación. Puede eliminar prefijos no JSON o restaurar la última copia conocida como buena mientras preserva la carga rechazada como `.clobbered.*`.
    - Cuando ocurren muchas reparaciones para una ruta de configuración, OpenClaw rota los archivos `.clobbered.*` más antiguos para que la carga reparada más reciente siga disponible.

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
    - `.rejected.*` existe → una escritura de configuración propiedad de OpenClaw falló comprobaciones de esquema o de sobrescritura antes de confirmar.
    - `Config write rejected:` → la escritura intentó eliminar una forma requerida, reducir bruscamente el archivo o persistir una configuración no válida.
    - `config reload skipped (invalid config):` → una edición directa falló la validación y fue ignorada por el Gateway en ejecución.
    - `Invalid config at ...` → el inicio falló antes de que arrancaran los servicios del Gateway.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` o `size-drop-vs-last-good:*` → una escritura propiedad de OpenClaw fue rechazada porque perdió campos o tamaño en comparación con la copia de seguridad de última versión conocida como buena.
    - `Config last-known-good promotion skipped` → el candidato contenía marcadores de posición de secretos redactados como `***`.

  </Accordion>
  <Accordion title="Opciones de corrección">
    1. Ejecuta `openclaw doctor --fix` para que doctor repare la configuración prefijada/sobrescrita o restaure la última versión conocida como buena.
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

## Advertencias de sondeo del Gateway

Úsalo cuando `openclaw gateway probe` alcance algo, pero aun así imprima un bloque de advertencia.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Busca:

- `warnings[].code` y `primaryTargetId` en la salida JSON.
- Si la advertencia se refiere a fallback de SSH, múltiples gateways, scopes faltantes o refs de auth no resueltas.

Firmas comunes:

- `SSH tunnel failed to start; falling back to direct probes.` → la configuración de SSH falló, pero el comando aun así intentó objetivos directos configurados/local loopback.
- `multiple reachable gateway identities detected` → respondieron gateways distintos, o OpenClaw no pudo demostrar que los objetivos alcanzables sean el mismo gateway. Un túnel SSH, URL de proxy o URL remota configurada hacia el mismo gateway se trata como un gateway con múltiples transportes, incluso cuando los puertos de transporte difieren.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la conexión funcionó, pero el RPC de detalle está limitado por scope; empareja la identidad del dispositivo o usa credenciales con `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → la conexión funcionó, pero el conjunto completo de RPC de diagnóstico agotó el tiempo de espera o falló. Trátalo como un Gateway alcanzable con diagnósticos degradados; compara `connect.ok` y `connect.rpcOk` en la salida de `--json`.
- `Capability: pairing-pending` o `gateway closed (1008): pairing required` → el gateway respondió, pero este cliente todavía necesita emparejamiento/aprobación antes del acceso normal de operador.
- Texto de advertencia de SecretRef `gateway.auth.*` / `gateway.remote.*` no resuelto → el material de auth no estaba disponible en esta ruta de comando para el objetivo fallido.

Relacionado:

- [Gateway](/es/cli/gateway)
- [Múltiples gateways en el mismo host](/es/gateway#multiple-gateways-same-host)
- [Acceso remoto](/es/gateway/remote)

## Canal conectado, los mensajes no fluyen

Si el estado del canal es conectado pero el flujo de mensajes está detenido, céntrate en la política, los permisos y las reglas de entrega específicas del canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Busca:

- Política de DM (`pairing`, `allowlist`, `open`, `disabled`).
- Lista de permitidos de grupo y requisitos de mención.
- Permisos/scopes de API de canal faltantes.

Firmas comunes:

- `mention required` → mensaje ignorado por la política de mención de grupo.
- Trazas de `pairing` / aprobación pendiente → el remitente no está aprobado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de auth/permisos del canal.

Relacionado:

- [Solución de problemas de canales](/es/channels/troubleshooting)
- [Discord](/es/channels/discord)
- [Telegram](/es/channels/telegram)
- [WhatsApp](/es/channels/whatsapp)

## Entrega de Cron y Heartbeat

Si cron o heartbeat no se ejecutó o no se entregó, verifica primero el estado del programador y luego el objetivo de entrega.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Busca:

- Cron habilitado y próximo despertar presente.
- Estado del historial de ejecución del trabajo (`ok`, `skipped`, `error`).
- Motivos de omisión de Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Firmas comunes">
    - `cron: scheduler disabled; jobs will not run automatically` → cron deshabilitado.
    - `cron: timer tick failed` → falló el tick del programador; revisa errores de archivo/registro/runtime.
    - `heartbeat skipped` con `reason=quiet-hours` → fuera de la ventana de horas activas.
    - `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe, pero solo contiene andamiaje en blanco, comentarios, encabezados, cercas o listas de verificación vacías, por lo que OpenClaw omite la llamada al modelo.
    - `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un bloque `tasks:`, pero ninguna de las tareas vence en este tick.
    - `heartbeat: unknown accountId` → id de cuenta no válido para el destino de entrega de Heartbeat.
    - `heartbeat skipped` con `reason=dm-blocked` → el destino de Heartbeat se resolvió como un destino de tipo DM mientras `agents.defaults.heartbeat.directPolicy` (o la anulación por agente) está establecido en `block`.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Heartbeat](/es/gateway/heartbeat)
- [Tareas programadas](/es/automation/cron-jobs)
- [Tareas programadas: solución de problemas](/es/automation/cron-jobs#troubleshooting)

## Node emparejado, la herramienta falla

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
- Concesiones de permisos del SO para cámara/micrófono/ubicación/pantalla.
- Aprobaciones de ejecución y estado de allowlist.

Firmas comunes:

- `NODE_BACKGROUND_UNAVAILABLE` → la aplicación del Node debe estar en primer plano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → falta permiso del SO.
- `SYSTEM_RUN_DENIED: approval required` → aprobación de ejecución pendiente.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado por allowlist.

Relacionado:

- [Aprobaciones de ejecución](/es/tools/exec-approvals)
- [Solución de problemas de Node](/es/nodes/troubleshooting)
- [Nodes](/es/nodes/index)

## La herramienta de navegador falla

Úsalo cuando las acciones de la herramienta de navegador fallen aunque el Gateway en sí esté en buen estado.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Busca:

- Si `plugins.allow` está establecido e incluye `browser`.
- Ruta válida al ejecutable del navegador.
- Accesibilidad del perfil CDP.
- Disponibilidad local de Chrome para perfiles `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Firmas de Plugin / ejecutable">
    - `unknown command "browser"` o `unknown command 'browser'` → el plugin de navegador incluido está excluido por `plugins.allow`.
    - Falta la herramienta de navegador / no está disponible mientras `browser.enabled=true` → `plugins.allow` excluye `browser`, por lo que el plugin nunca se cargó.
    - `Failed to start Chrome CDP on port` → el proceso del navegador no pudo iniciarse.
    - `browser.executablePath not found` → la ruta configurada no es válida.
    - `browser.cdpUrl must be http(s) or ws(s)` → la URL de CDP configurada usa un esquema no admitido, como `file:` o `ftp:`.
    - `browser.cdpUrl has invalid port` → la URL de CDP configurada tiene un puerto incorrecto o fuera de rango.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → la instalación actual del Gateway no incluye la dependencia principal del runtime de navegador; reinstala o actualiza OpenClaw y luego reinicia el Gateway. Las instantáneas ARIA y las capturas básicas de página aún pueden funcionar, pero la navegación, las instantáneas de IA, las capturas de elementos con selector CSS y la exportación a PDF siguen sin estar disponibles.

  </Accordion>
  <Accordion title="Firmas de Chrome MCP / sesión existente">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session aún no pudo adjuntarse al directorio de datos del navegador seleccionado. Abre la página de inspección del navegador, habilita la depuración remota, mantén el navegador abierto, aprueba el primer aviso de adjunción y vuelve a intentarlo. Si no se requiere el estado de sesión iniciada, prefiere el perfil gestionado `openclaw`.
    - `No browser tabs found for profile="user"` → el perfil de adjunción de Chrome MCP no tiene pestañas locales de Chrome abiertas.
    - `Remote CDP for profile "<name>" is not reachable` → el endpoint CDP remoto configurado no es accesible desde el host del Gateway.
    - `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → el perfil de solo adjunción no tiene un destino accesible, o el endpoint HTTP respondió pero aún no se pudo abrir el WebSocket de CDP.

  </Accordion>
  <Accordion title="Firmas de elemento / captura / subida">
    - `fullPage is not supported for element screenshots` → la solicitud de captura mezcló `--full-page` con `--ref` o `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → las llamadas de captura de Chrome MCP / `existing-session` deben usar captura de página o una `--ref` de instantánea, no `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → los hooks de subida de Chrome MCP necesitan referencias de instantánea, no selectores CSS.
    - `existing-session file uploads currently support one file at a time.` → envía una subida por llamada en perfiles de Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → los hooks de diálogo en perfiles de Chrome MCP no admiten anulaciones de tiempo de espera.
    - `existing-session type does not support timeoutMs overrides.` → omite `timeoutMs` para `act:type` en perfiles `profile="user"` / Chrome MCP existing-session, o usa un perfil de navegador gestionado/CDP cuando se requiera un tiempo de espera personalizado.
    - `existing-session evaluate does not support timeoutMs overrides.` → omite `timeoutMs` para `act:evaluate` en perfiles `profile="user"` / Chrome MCP existing-session, o usa un perfil de navegador gestionado/CDP cuando se requiera un tiempo de espera personalizado.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` todavía requiere un navegador gestionado o un perfil CDP sin procesar.
    - Anulaciones obsoletas de viewport / modo oscuro / configuración regional / sin conexión en perfiles attach-only o CDP remotos → ejecuta `openclaw browser stop --browser-profile <name>` para cerrar la sesión de control activa y liberar el estado de emulación Playwright/CDP sin reiniciar todo el Gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Navegador (gestionado por OpenClaw)](/es/tools/browser)
- [Solución de problemas del navegador](/es/tools/browser-linux-troubleshooting)

## Si actualizaste y algo dejó de funcionar de repente

La mayoría de las roturas posteriores a una actualización se deben a deriva de configuración o a valores predeterminados más estrictos que ahora se aplican.

<AccordionGroup>
  <Accordion title="1. Cambió el comportamiento de autenticación y anulación de URL">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Qué revisar:

    - Si `gateway.mode=remote`, las llamadas de la CLI pueden estar apuntando al remoto mientras tu servicio local está bien.
    - Las llamadas explícitas con `--url` no recurren a las credenciales almacenadas.

    Firmas comunes:

    - `gateway connect failed:` → destino de URL incorrecto.
    - `unauthorized` → endpoint accesible pero autenticación incorrecta.

  </Accordion>
  <Accordion title="2. Las protecciones de enlace y autenticación son más estrictas">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Qué revisar:

    - Los enlaces que no son de local loopback (`lan`, `tailnet`, `custom`) necesitan una ruta de autenticación de Gateway válida: autenticación con token/contraseña compartidos, o un despliegue `trusted-proxy` que no sea local loopback y esté configurado correctamente.
    - Las claves antiguas como `gateway.token` no reemplazan `gateway.auth.token`.

    Firmas comunes:

    - `refusing to bind gateway ... without auth` → enlace que no es local loopback sin una ruta de autenticación de Gateway válida.
    - `Connectivity probe: failed` mientras el runtime está en ejecución → Gateway activo pero inaccesible con la autenticación/URL actual.

  </Accordion>
  <Accordion title="3. Cambió el estado de emparejamiento e identidad del dispositivo">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Qué revisar:

    - Aprobaciones de dispositivo pendientes para panel/nodes.
    - Aprobaciones de emparejamiento por DM pendientes después de cambios de política o identidad.

    Firmas comunes:

    - `device identity required` → autenticación del dispositivo no satisfecha.
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
- [Ejecución en segundo plano y herramienta de proceso](/es/gateway/background-process)
- [Emparejamiento propiedad del Gateway](/es/gateway/pairing)

## Relacionado

- [Doctor](/es/gateway/doctor)
- [Preguntas frecuentes](/es/help/faq)
- [Runbook del Gateway](/es/gateway)
