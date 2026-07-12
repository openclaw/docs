---
read_when:
    - El centro de solución de problemas le indicó consultar esta página para realizar un diagnóstico más exhaustivo
    - Necesita secciones estables de procedimientos operativos basadas en síntomas, con comandos exactos.
sidebarTitle: Troubleshooting
summary: Guía detallada de solución de problemas para Gateway, canales, automatización, nodos y navegador
title: Solución de problemas
x-i18n:
    generated_at: "2026-07-12T14:32:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f53064a0d42e601ec1a1904fc9d0e8ebb9def7a2fb9d2579c7f10ca675b8f7fd
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Este es el manual de operaciones detallado. Empiece primero por [/help/troubleshooting](/es/help/troubleshooting) para seguir el flujo rápido de diagnóstico.

## Secuencia de comandos

Ejecútelos en este orden:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Indicadores de funcionamiento correcto:

- `openclaw gateway status` muestra `Runtime: running`, `Connectivity probe: ok` y una línea `Capability: ...`.
- `openclaw doctor` no informa de problemas de configuración o del servicio que impidan continuar.
- `openclaw channels status --probe` muestra el estado activo del transporte por cuenta y, cuando se admite, `works` o `audit ok`.

## Después de una actualización

Úselo cuando finalice una actualización, pero el Gateway esté inactivo, los canales estén vacíos o las llamadas a modelos fallen con errores 401.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Busque lo siguiente:

- `Update restart` en `openclaw status` / `openclaw status --all`. Las transferencias pendientes o fallidas incluyen el siguiente comando que se debe ejecutar.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` en Channels: la configuración del canal aún existe, pero el registro del plugin falló antes de que se pudiera cargar el canal.
- Errores 401 del proveedor después de volver a autenticarse: `openclaw doctor --fix` comprueba si existen copias obsoletas de autenticación OAuth por agente y las elimina para que todos los agentes resuelvan el perfil compartido actual.

## Instalaciones divergentes y protección frente a configuraciones más recientes

Úselo cuando un servicio de Gateway se detenga inesperadamente después de una actualización o cuando los registros muestren que un binario `openclaw` es anterior a la versión que escribió por última vez `openclaw.json`.

OpenClaw marca las escrituras de configuración con `meta.lastTouchedVersion`. Los comandos de solo lectura pueden inspeccionar una configuración escrita por una versión más reciente de OpenClaw, pero las mutaciones de procesos y servicios se niegan a ejecutarse desde un binario anterior. Acciones bloqueadas: iniciar, detener, reiniciar o desinstalar el servicio de Gateway; forzar la reinstalación del servicio; iniciar el Gateway en modo de servicio; y limpiar el puerto con `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Corregir PATH">
    Corrija `PATH` para que `openclaw` resuelva la instalación más reciente y, a continuación, vuelva a ejecutar la acción.
  </Step>
  <Step title="Reinstalar el servicio de Gateway">
    Reinstale el servicio de Gateway previsto desde la instalación más reciente:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Eliminar envoltorios obsoletos">
    Elimine las entradas obsoletas de paquetes del sistema o de envoltorios antiguos que aún apunten a un binario `openclaw` anterior.
  </Step>
</Steps>

<Warning>
Solo para una reversión intencionada o una recuperación de emergencia, establezca `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` para el comando individual. Déjela sin establecer durante el funcionamiento normal.
</Warning>

## Incompatibilidad de protocolo después de una reversión

Úselo cuando los registros sigan mostrando `protocol mismatch` después de volver a una versión anterior o revertir una actualización. Se está ejecutando un Gateway anterior, pero un proceso cliente local más reciente continúa intentando reconectarse con un intervalo de protocolo que el Gateway anterior no admite.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Busque lo siguiente:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` en los registros del Gateway.
- `Established clients:` en `openclaw gateway status --deep` o `Gateway clients` en `openclaw doctor --deep`: clientes TCP activos conectados al puerto del Gateway, con PID y líneas de comandos cuando el sistema operativo lo permite.
- Un proceso cliente cuya línea de comandos apunte a la instalación o al envoltorio más reciente de OpenClaw desde el que realizó la reversión.

Solución:

1. Detenga o reinicie el proceso cliente obsoleto de OpenClaw que muestra `gateway status --deep`.
2. Reinicie las aplicaciones o los envoltorios que incorporan OpenClaw: paneles locales, editores, auxiliares de servidores de aplicaciones o shells de larga duración con `openclaw logs --follow`.
3. Vuelva a ejecutar `openclaw gateway status --deep` o `openclaw doctor --deep` y confirme que el PID del cliente obsoleto ya no aparece.

No haga que un Gateway anterior acepte un protocolo más reciente e incompatible. Los incrementos de versión del protocolo protegen el contrato de comunicación; la recuperación tras una reversión consiste en limpiar procesos y versiones.

## Enlace simbólico de Skill omitido por escapar de la ruta

Úselo cuando los registros incluyan:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

Cada raíz de Skills constituye un límite de contención. Se omite un enlace simbólico ubicado en `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` o `~/.openclaw/skills` cuando su destino real se resuelve fuera de esa raíz, salvo que el destino sea de confianza de forma explícita.

Inspeccione el enlace:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Si el destino es intencionado, configure tanto la raíz directa de Skills como el destino de enlace simbólico permitido:

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

A continuación, inicie una sesión nueva o espere a que se actualice el observador de Skills. Reinicie el Gateway si el proceso en ejecución es anterior al cambio de configuración.

No utilice destinos amplios como `~`, `/` o una carpeta completa de un proyecto sincronizado. Limite `allowSymlinkTargets` a la raíz real de Skills que contenga directorios `SKILL.md` de confianza.

Si la aplicación de Skill Workshop también debe escribir a través de esas rutas de Skills del espacio de trabajo enlazadas simbólicamente y de confianza, habilite `skills.workshop.allowSymlinkTargetWrites`. Manténgalo deshabilitado para las raíces compartidas de Skills que sean de solo lectura.

Relacionado:

- [Configuración de Skills](/es/tools/skills-config#symlinked-skill-roots)
- [Ejemplos de configuración](/es/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic requiere uso adicional para el contexto largo al devolver un error 429

Úselo cuando los registros o errores incluyan: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Busque lo siguiente:

- El modelo de Anthropic seleccionado es un modelo Claude 4.x compatible con disponibilidad general y 1M (Opus 4.6/4.7/4.8, Sonnet 4.6), o la configuración del modelo aún contiene el valor heredado `params.context1m: true`.
- La credencial actual de Anthropic no cumple los requisitos para el uso de contexto largo.
- Las solicitudes solo fallan en sesiones o ejecuciones de modelos largas que necesitan la ruta de contexto de 1M.

Opciones de solución:

<Steps>
  <Step title="Usar una ventana de contexto estándar">
    Cambie a un modelo con una ventana estándar o elimine el valor heredado `context1m` de la configuración de modelos anteriores
    que no sean compatibles con la disponibilidad general del contexto de 1M.
  </Step>
  <Step title="Usar una credencial apta">
    Utilice una credencial de Anthropic apta para solicitudes de contexto largo o cambie a una clave de API de Anthropic.
  </Step>
  <Step title="Configurar modelos alternativos">
    Configure modelos alternativos para que las ejecuciones continúen cuando se rechacen las solicitudes de contexto largo de Anthropic.
  </Step>
</Steps>

Relacionado:

- [Anthropic](/es/providers/anthropic)
- [Uso de tokens y costes](/es/reference/token-use)
- [¿Por qué veo un error HTTP 429 de Anthropic?](/es/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Respuestas bloqueadas con error 403 del servicio de origen

Úselo cuando un proveedor de LLM de origen devuelva un error `403` genérico, como `Your request was blocked`.

No dé por sentado que siempre se trata de un problema de configuración de OpenClaw. La respuesta puede proceder de una capa de seguridad de origen, como una CDN, un WAF, una regla de gestión de bots o un proxy inverso delante de un endpoint compatible con OpenAI.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Busque lo siguiente:

- Varios modelos del mismo proveedor fallan de la misma manera.
- Aparece HTML o texto de seguridad genérico en lugar de un error normal de la API del proveedor.
- Existen eventos de seguridad del proveedor correspondientes a la misma hora de la solicitud.
- Una pequeña prueba directa con `curl` tiene éxito, mientras que las solicitudes normales con la estructura del SDK fallan.

Corrija primero el filtrado del proveedor cuando las pruebas indiquen un bloqueo del WAF o la CDN. Prefiera una regla de permiso u omisión con un ámbito limitado a la ruta de la API que utiliza OpenClaw y evite deshabilitar la protección de todo el sitio.

<Warning>
Que una solicitud mínima con `curl` tenga éxito no garantiza que las solicitudes reales al estilo del SDK atraviesen la misma capa de seguridad de origen.
</Warning>

Relacionado:

- [Endpoints compatibles con OpenAI](/es/gateway/configuration-reference#openai-compatible-endpoints)
- [Configuración de proveedores](/es/providers)
- [Registros](/es/logging)

## El backend local compatible con OpenAI supera las pruebas directas, pero las ejecuciones del agente fallan

Úselo cuando:

- `curl ... /v1/models` funciona.
- Las llamadas directas pequeñas a `/v1/chat/completions` funcionan.
- Las ejecuciones de modelos de OpenClaw solo fallan durante los turnos normales del agente.

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Busque lo siguiente:

- Las llamadas directas pequeñas tienen éxito, pero las ejecuciones de OpenClaw solo fallan con prompts más grandes.
- Errores `model_not_found` o 404 aunque la llamada directa a `/v1/chat/completions` funcione con el mismo identificador de modelo sin prefijo.
- Errores del backend que indican que `messages[].content` debe ser una cadena.
- Advertencias intermitentes `incomplete turn detected ... stopReason=stop payloads=0` con un backend local compatible con OpenAI.
- Fallos del backend que solo aparecen con un mayor número de tokens del prompt o con los prompts completos del entorno de ejecución del agente.

<AccordionGroup>
  <Accordion title="Indicadores comunes">
    - `model_not_found` con un servidor local del estilo MLX/vLLM: compruebe que `baseUrl` incluya `/v1`, que `api` sea `"openai-completions"` para los backends de `/v1/chat/completions` y que `models.providers.<provider>.models[].id` sea el identificador local del proveedor sin prefijo. Selecciónelo una vez con el prefijo del proveedor, por ejemplo `mlx/mlx-community/Qwen3-30B-A3B-6bit`; mantenga la entrada del catálogo como `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string`: el backend rechaza las partes estructuradas del contenido de Chat Completions. Solución: establezca `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` o claves de mensaje permitidas como `["role","content"]`: el backend rechaza los metadatos de reproducción al estilo de OpenAI en los mensajes de Chat Completions. Solución: establezca `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0`: el backend completó la solicitud de Chat Completions, pero no devolvió ningún texto visible del asistente para ese turno. OpenClaw reintenta una vez los turnos vacíos compatibles con OpenAI cuya reproducción es segura; los fallos persistentes suelen significar que el backend emite contenido vacío o que no es texto, o que suprime el texto de la respuesta final.
    - Las solicitudes directas pequeñas tienen éxito, pero las ejecuciones del agente de OpenClaw fallan debido a errores del backend o del modelo (por ejemplo, Gemma en algunas compilaciones de `inferrs`): es probable que el transporte de OpenClaw ya sea correcto; el backend falla con la estructura más grande del prompt del entorno de ejecución del agente.
    - Los fallos se reducen después de deshabilitar las herramientas, pero no desaparecen: los esquemas de herramientas contribuían a la carga, pero el problema restante sigue siendo la capacidad del modelo o servidor de origen, o un error del backend.

  </Accordion>
  <Accordion title="Opciones de solución">
    1. Establezca `compat.requiresStringContent: true` para los backends de Chat Completions que solo aceptan cadenas.
    2. Establezca `compat.strictMessageKeys: true` para los backends estrictos de Chat Completions que solo aceptan `role` y `content` en cada mensaje.
    3. Establezca `compat.supportsTools: false` para los modelos o backends que no puedan procesar de forma fiable el conjunto de esquemas de herramientas de OpenClaw.
    4. Reduzca la carga del prompt cuando sea posible: inicialización más pequeña del espacio de trabajo, historial de sesión más corto, modelo local más ligero o un backend con mejor compatibilidad con contextos largos.
    5. Si las solicitudes directas pequeñas siguen funcionando mientras los turnos del agente de OpenClaw continúan provocando fallos dentro del backend, trátelo como una limitación del servidor o modelo de origen y presente allí un caso reproducible con la estructura de carga útil aceptada.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Configuración](/es/gateway/configuration)
- [Modelos locales](/es/gateway/local-models)
- [Endpoints compatibles con OpenAI](/es/gateway/configuration-reference#openai-compatible-endpoints)

## Sin respuestas

Si los canales están activos, pero no hay respuesta, compruebe el enrutamiento y la política antes de volver a conectar nada.

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
- Incompatibilidades en la lista de permitidos del canal/grupo.

Indicadores comunes:

- `drop guild message (mention required` → mensaje de grupo ignorado hasta que haya una mención.
- `pairing request` → el remitente necesita aprobación.
- `blocked` / `allowlist` → el remitente/canal fue filtrado por la política.

Relacionado:

- [Solución de problemas de canales](/es/channels/troubleshooting)
- [Grupos](/es/channels/groups)
- [Emparejamiento](/es/channels/pairing)

## Conectividad de la interfaz de control del panel

Cuando el panel o la interfaz de control no se conecte, valide la URL, el modo de autenticación y los supuestos del contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Busque:

- URL de sondeo y URL del panel correctas.
- Incompatibilidad del modo/token de autenticación entre el cliente y el gateway.
- Uso de HTTP cuando se requiere la identidad del dispositivo.

Si un navegador local no puede conectarse a `127.0.0.1:18789` después de una actualización, primero recupere el servicio Gateway local y confirme que está sirviendo el panel:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Si `curl` devuelve HTML de OpenClaw, el Gateway funciona y el problema restante probablemente sea la caché del navegador, un enlace profundo antiguo o el estado obsoleto de una pestaña. Abra `http://127.0.0.1:18789` directamente y navegue desde el panel. Si el reinicio no mantiene el servicio en ejecución, ejecute `openclaw gateway start` y vuelva a comprobar `openclaw gateway status`.

<AccordionGroup>
  <Accordion title="Indicadores de conexión/autenticación">
    - `device identity required` → contexto no seguro o falta la autenticación del dispositivo.
    - `origin not allowed` → el `Origin` del navegador no está en `gateway.controlUi.allowedOrigins` (o se está conectando desde un origen de navegador que no es de bucle invertido sin una lista de permitidos explícita).
    - `device nonce required` / `device nonce mismatch` → el cliente no está completando el flujo de autenticación de dispositivo basado en desafío (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → el cliente firmó la carga útil incorrecta (o con una marca de tiempo obsoleta) para el protocolo de enlace actual.
    - `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → el cliente puede realizar un reintento de confianza con el token de dispositivo almacenado en caché.
    - Ese reintento con el token almacenado en caché reutiliza el conjunto de ámbitos almacenado con el token del dispositivo emparejado. Los llamadores con `deviceToken` / `scopes` explícitos conservan en su lugar el conjunto de ámbitos solicitado.
    - `AUTH_SCOPE_MISMATCH` → se reconoció el token del dispositivo, pero sus ámbitos aprobados no cubren esta solicitud de conexión; vuelva a emparejar o apruebe el contrato de ámbitos solicitado en lugar de rotar un token compartido del gateway.
    - Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es primero el token compartido o la contraseña explícitos, luego `deviceToken` explícito, después el token de dispositivo almacenado y, por último, el token de arranque.
    - En la ruta asíncrona de la interfaz de control de Tailscale Serve, los intentos fallidos para el mismo `{scope, ip}` se serializan antes de que el limitador registre el fallo. Por tanto, dos reintentos incorrectos simultáneos del mismo cliente pueden mostrar `retry later` en el segundo intento, en vez de dos incompatibilidades simples.
    - `too many failed authentication attempts (retry later)` desde un cliente de bucle invertido con origen de navegador → los fallos repetidos desde ese mismo `Origin` normalizado se bloquean temporalmente; otro origen de localhost utiliza un contenedor independiente.
    - `unauthorized` repetido después de ese reintento → divergencia entre el token compartido y el token del dispositivo; actualice la configuración del token y vuelva a aprobar o rote el token del dispositivo si es necesario.
    - `gateway connect failed:` → destino de host/puerto/URL incorrecto.

  </Accordion>
</AccordionGroup>

### Mapa rápido de códigos de detalle de autenticación

Use `error.details.code` de la respuesta de `connect` fallida para elegir la siguiente acción:

| Código de detalle            | Significado                                                                                                                                                                                    | Acción recomendada                                                                                                                                                                                                                                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | El cliente no envió un token compartido obligatorio.                                                                                                                                           | Pegue/establezca el token en el cliente y vuelva a intentarlo. Para las rutas del panel: `openclaw config get gateway.auth.token` y, después, péguelo en la configuración de la interfaz de control.                                                                                                                   |
| `AUTH_TOKEN_MISMATCH`        | El token compartido no coincidió con el token de autenticación del gateway.                                                                                                                    | Si `canRetryWithDeviceToken=true`, permita un reintento de confianza. Los reintentos con tokens almacenados en caché reutilizan los ámbitos aprobados almacenados; los llamadores con `deviceToken` / `scopes` explícitos conservan los ámbitos solicitados. Si sigue fallando, ejecute la [lista de comprobación para recuperar la divergencia de tokens](/es/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | El token por dispositivo almacenado en caché está obsoleto o revocado.                                                                                                                         | Rote o vuelva a aprobar el token del dispositivo mediante la [CLI de dispositivos](/es/cli/devices) y, después, vuelva a conectarse.                                                                                                                                                                                   |
| `AUTH_SCOPE_MISMATCH`        | El token del dispositivo es válido, pero su rol o sus ámbitos aprobados no cubren esta solicitud de conexión.                                                                                  | Vuelva a emparejar el dispositivo o apruebe el contrato de ámbitos solicitado; no lo considere una divergencia del token compartido.                                                                                                                                                                               |
| `PAIRING_REQUIRED`           | La identidad del dispositivo necesita aprobación. Compruebe `error.details.reason` para `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade`, y use `requestId` / `remediationHint` cuando estén presentes. | Apruebe la solicitud pendiente: `openclaw devices list` y, después, `openclaw devices approve <requestId>`. Las actualizaciones de ámbito o rol utilizan el mismo flujo después de revisar el acceso solicitado.                                                                                                      |

<Note>
Las RPC directas al backend de bucle invertido autenticadas con el token o la contraseña compartidos del gateway no deberían depender del conjunto de ámbitos de referencia de los dispositivos emparejados de la CLI. Si los subagentes u otras llamadas internas siguen fallando con `scope-upgrade`, compruebe que el llamador utiliza `client.id: "gateway-client"` y `client.mode: "backend"`, y que no fuerza una `deviceIdentity` explícita ni un token de dispositivo.
</Note>

Comprobación de la migración de la autenticación de dispositivos v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si los registros muestran errores de nonce/firma, actualice el cliente que se conecta y verifíquelo:

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

- Las sesiones con tokens de dispositivos emparejados solo pueden administrar **su propio** dispositivo, salvo que el llamador también tenga `operator.admin`.
- `openclaw devices rotate --scope ...` solo puede solicitar ámbitos de operador que la sesión del llamador ya posea.

Relacionado:

- [Configuración](/es/gateway/configuration) (modos de autenticación del gateway)
- [Interfaz de control](/es/web/control-ui)
- [Dispositivos](/es/cli/devices)
- [Acceso remoto](/es/gateway/remote)
- [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth)

## El servicio Gateway no está en ejecución

Úselo cuando el servicio esté instalado, pero el proceso no permanezca activo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # también busca servicios del sistema
```

Busque:

- `Runtime: stopped` con indicios sobre la salida.
- Incompatibilidad en la configuración del servicio (`Config (cli)` frente a `Config (service)`).
- Conflictos de puerto/agente de escucha.
- Instalaciones adicionales de launchd/systemd/schtasks cuando se utiliza `--deep`.
- Indicaciones de limpieza de `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Indicadores comunes">
    - `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → el modo de gateway local no está habilitado, o el archivo de configuración fue sobrescrito y perdió `gateway.mode`. Solución: establezca `gateway.mode="local"` en la configuración o vuelva a ejecutar `openclaw onboard --mode local` / `openclaw setup` para restaurar la configuración esperada del modo local. Si ejecuta OpenClaw mediante Podman, la ruta de configuración predeterminada es `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → enlace fuera del bucle invertido sin una ruta válida de autenticación del gateway (token/contraseña, o proxy de confianza cuando esté configurado).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflicto de puerto.
    - `Other gateway-like services detected (best effort)` → existen unidades de launchd/systemd/schtasks obsoletas o paralelas. La mayoría de las configuraciones deberían mantener un gateway por máquina; si necesita más de uno, aísle los puertos, la configuración, el estado y el espacio de trabajo. Consulte [/gateway#multiple-gateways-same-host](/es/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` de doctor → existe una unidad de sistema de systemd mientras falta el servicio de nivel de usuario. Elimine o deshabilite el duplicado antes de permitir que doctor instale un servicio de usuario, o establezca `OPENCLAW_SERVICE_REPAIR_POLICY=external` si la unidad del sistema es el supervisor previsto.
    - `Gateway service port does not match current gateway config` → el supervisor instalado aún fija el antiguo `--port`. Ejecute `openclaw doctor --fix` o `openclaw gateway install --force` y, después, reinicie el servicio Gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Ejecución en segundo plano y herramienta de procesos](/es/gateway/background-process)
- [Configuración](/es/gateway/configuration)
- [Doctor](/es/gateway/doctor)

## El gateway de macOS deja de responder silenciosamente y se reanuda al interactuar con el panel

Úselo cuando los canales (Telegram, WhatsApp, etc.) de un host macOS queden inactivos durante periodos de minutos a horas, y el gateway parezca volver a funcionar en cuanto se abre la interfaz de control, se accede mediante SSH o se interactúa de cualquier otra forma con el host. Por lo general, no hay ningún síntoma evidente en `openclaw status` porque, para cuando se consulta, el gateway ya vuelve a estar activo.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Busque:

- Uno o más paquetes `*-uncaught_exception.json` en `~/.openclaw/logs/stability/` con `error.code` establecido en un código de red transitorio como `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` o `ECONNREFUSED`.
- Líneas de `pmset -g log` como `Entering Sleep state due to 'Maintenance Sleep'` o `en0 driver is slow (msg: WillChangeState to 0)` que coinciden con las marcas de tiempo de los fallos. Power Nap / Maintenance Sleep pone brevemente el controlador Wi-Fi en el estado 0; cualquier `connect()` saliente que se produzca en ese intervalo puede fallar con `ENETDOWN`, incluso en un host que, por lo demás, tiene conectividad de red completa.
- Salida de `launchctl print` que muestra `state = not running` con varios `runs` recientes y un código de salida, especialmente cuando el intervalo entre el fallo y el siguiente inicio es del orden de una hora en lugar de segundos. launchd de macOS aplica una barrera de protección contra reapariciones no documentada tras una ráfaga de fallos que puede hacer que deje de respetar `KeepAlive=true` hasta que un desencadenador externo, como un inicio de sesión interactivo, una conexión al panel o `launchctl kickstart`, la reactive.

Indicadores comunes:

- Un paquete de estabilidad cuyo `error.code` es `ENETDOWN` o un código relacionado, con la pila de llamadas apuntando a `lookupAndConnect` / `Socket.connect` de `net` en Node. OpenClaw `2026.5.26` y versiones posteriores clasifican estos casos como errores de red transitorios benignos, por lo que ya no se propagan al controlador de excepciones no detectadas de nivel superior; si se utiliza una versión anterior, primero debe actualizarse.
- Periodos prolongados de inactividad que terminan justo al conectarse a la interfaz de control o mediante SSH al host: la actividad visible para el usuario es lo que reactiva la barrera de reaparición de launchd, no ninguna acción del panel sobre el Gateway.
- El recuento de `runs` aumenta a lo largo del día sin una línea correspondiente `received SIG*; shutting down` en `~/Library/Logs/openclaw/gateway.log`: los cierres limpios registran una señal; los fallos transitorios no.

Qué hacer:

1. **Actualice el Gateway** si se ejecuta una versión anterior a `2026.5.26`. Tras la actualización, los futuros errores `ENETDOWN` se registrarán como advertencias en lugar de finalizar el proceso.
2. **Reduzca la actividad de suspensión de mantenimiento** en hosts Mac mini o de escritorio destinados a funcionar como servidores siempre activos:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Esto reduce considerablemente, pero no elimina por completo, la fluctuación subyacente del controlador. El sistema aún puede realizar algunas suspensiones de mantenimiento para mantener activas las conexiones TCP y realizar el mantenimiento de mDNS, independientemente de estas opciones.

3. **Añada un monitor de actividad** para detectar rápidamente una futura ráfaga de fallos que launchd deje detenida:

   ```bash
   # Ejemplo de comprobación de actividad compatible con launchd, adecuada para un cron o LaunchAgent cada 5 minutos
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   El objetivo es reactivar externamente la barrera de reaparición; `KeepAlive=true` por sí solo no es suficiente en macOS después de una ráfaga de fallos.

Relacionado:

- [Notas de la plataforma macOS](/es/platforms/macos)
- [Registro](/es/logging)
- [Doctor](/es/gateway/doctor)

## Bucle de supervisión de launchd en macOS con LaunchAgents de Gateway/node duplicados

Utilice esto cuando una instalación de macOS se reinicie cada pocos segundos, las comprobaciones de estado de `openclaw`
alternen entre disponible y no disponible, y el envío a canales se bloquee
aunque el servicio parezca estar en ejecución.

Esto se observó en instalaciones antiguas donde los LaunchAgents `ai.openclaw.gateway` y
`ai.openclaw.node` estaban activos y ambos inyectaban
`OPENCLAW_LAUNCHD_LABEL`. En ese estado, OpenClaw puede detectar la
supervisión de launchd, intentar devolver el control del reinicio a launchd y entrar en un bucle rápido de
`EADDRINUSE`/reaparición en lugar de mantener un único proceso estable del Gateway.

```bash
for i in 1 2 3 4; do
  ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
  sleep 10
done

openclaw gateway status --deep
openclaw node status
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'state|last exit|runs'
tail -n 80 ~/Library/Logs/openclaw/gateway.log
```

Busque:

- Más de un PID del Gateway durante la muestra de 30 segundos, en lugar de un
  único proceso estable.
- `EADDRINUSE`, `another gateway instance is already listening` o líneas repetidas
  de reinicio/traspaso en `gateway.log`.
- Tanto `~/Library/LaunchAgents/ai.openclaw.gateway.plist` como
  `~/Library/LaunchAgents/ai.openclaw.node.plist` cargados simultáneamente en un
  host que solo debería ejecutar un servicio administrado del Gateway.

Qué hacer:

1. Si este host solo debe ejecutar el servicio Gateway, elimine el servicio
   administrado de Node mediante OpenClaw. **Omita este paso** si depende activamente del servicio de Node
   para las funciones remotas de Node; su desinstalación detiene esas funciones en
   este host:

   ```bash
   openclaw node uninstall
   ```

2. Instale un contenedor persistente del Gateway que borre los
   marcadores heredados de launchd antes de iniciar OpenClaw. Utilice la opción compatible `--wrapper`; no
   edite el archivo generado en `~/.openclaw/service-env/`, porque la reinstalación
   y actualización del servicio, así como la reparación de doctor, vuelven a generar ese archivo:

   ```bash
   mkdir -p ~/.local/bin
   cat >~/.local/bin/openclaw-launchd-workaround <<'EOF'
   #!/bin/sh
   set -eu
   unset OPENCLAW_LAUNCHD_LABEL LAUNCH_JOB_LABEL LAUNCH_JOB_NAME XPC_SERVICE_NAME || true
   exec openclaw "$@"
   EOF
   chmod 700 ~/.local/bin/openclaw-launchd-workaround

   openclaw gateway install \
     --wrapper ~/.local/bin/openclaw-launchd-workaround \
     --force
   ```

   `gateway install` conserva la ruta del contenedor durante las reinstalaciones forzadas,
   las actualizaciones y las reparaciones de doctor.

3. Compruebe que el Gateway sea estable y atienda RPC, no que simplemente esté escuchando:

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   La muestra de PID debe mostrar un único proceso estable en lugar de un conjunto rotativo de
   PID, y el envío entrante a canales debe reanudarse.

4. Después de actualizar a una versión en la que se haya corregido el bucle subyacente de LaunchAgents
   duplicados, elimine la solución provisional y reinstale el servicio administrado normal:

   ```bash
   OPENCLAW_WRAPPER= openclaw gateway install --force
   rm ~/.local/bin/openclaw-launchd-workaround
   ```

Relacionado:

- [Notas de la plataforma macOS](/es/platforms/mac/bundled-gateway)
- [Doctor](/es/gateway/doctor)
- [CLI del Gateway](/es/cli/gateway)

## El Gateway finaliza durante un uso elevado de memoria

Utilice esto cuando el Gateway desaparezca bajo carga, el supervisor informe de un reinicio similar a uno causado por falta de memoria o los registros mencionen `critical memory pressure bundle written`.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Busque:

- `Reason: diagnostic.memory.pressure.critical` en el paquete de estabilidad más reciente.
- `Memory pressure:` con `critical/rss_threshold`, `critical/heap_threshold` o `critical/rss_growth`.
- Valores de `V8 heap:` cercanos al límite del heap.
- Entradas de `Largest session files:` como `agents/<agent>/sessions/<session>.jsonl` o `sessions/<session>.jsonl`.
- Contadores de memoria de cgroup de Linux cuando el Gateway se ejecuta dentro de un contenedor o servicio con memoria limitada.

Indicadores comunes:

- `critical memory pressure bundle written` aparece poco antes del reinicio → OpenClaw capturó un paquete de estabilidad previo a la falta de memoria. Examínelo con `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` aparece en los registros del Gateway → OpenClaw detectó una presión de memoria crítica, pero la instantánea de estabilidad previa a la falta de memoria está desactivada.
- `Largest session files:` apunta a una ruta de transcripción censurada muy grande → reduzca el historial de sesiones conservado, examine el crecimiento de las sesiones o saque las transcripciones antiguas del almacén activo antes de reiniciar.
- Los bytes utilizados de `V8 heap:` están cerca del límite del heap → reduzca la presión de los prompts o las sesiones, disminuya el trabajo simultáneo o aumente el límite del heap de Node solo después de confirmar que la carga de trabajo es la esperada.
- `Memory pressure: critical/rss_growth` → la memoria aumentó rápidamente dentro de un intervalo de muestreo. Revise los registros más recientes para detectar una importación grande, una salida descontrolada de herramientas, reintentos repetidos o un lote de trabajo de agentes en cola.
- Aparece presión de memoria crítica en los registros, pero no existe ningún paquete → este es el comportamiento predeterminado. Establezca `diagnostics.memoryPressureSnapshot: true` para capturar el paquete de estabilidad previo a la falta de memoria en futuros eventos de presión de memoria crítica.

El paquete de estabilidad no contiene cargas útiles. Incluye pruebas operativas sobre la memoria y rutas de archivo relativas censuradas, pero no texto de mensajes, cuerpos de webhooks, credenciales, tokens, cookies ni identificadores de sesión sin censurar. Adjunte la exportación de diagnósticos a los informes de errores en lugar de copiar registros sin procesar.

Relacionado:

- [Estado del Gateway](/es/gateway/health)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Sesiones](/es/cli/sessions)

## El Gateway rechazó una configuración no válida

Utilice esto cuando el inicio del Gateway falle con `Invalid config` o los registros de recarga en caliente indiquen que se omitió una modificación no válida.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Busque:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- Un archivo `openclaw.json.rejected.*` con marca de tiempo junto a la configuración activa.
- Un archivo `openclaw.json.clobbered.*` con marca de tiempo si `doctor --fix` reparó una edición directa dañada.
- OpenClaw conserva los 32 archivos `.clobbered.*` más recientes de cada ruta de configuración y rota los más antiguos.

<AccordionGroup>
  <Accordion title="Qué ocurrió">
    - La configuración no superó la validación durante el inicio, la recarga en caliente o una escritura propiedad de OpenClaw.
    - El inicio del Gateway falla de forma segura en lugar de reescribir `openclaw.json`.
    - La recarga en caliente omite las ediciones externas no válidas y mantiene activa la configuración actual en tiempo de ejecución.
    - Las escrituras propiedad de OpenClaw rechazan las cargas útiles no válidas o destructivas antes de confirmarlas y guardan `.rejected.*`.
    - `openclaw doctor --fix` se encarga de la reparación. Puede eliminar prefijos que no sean JSON o restaurar la última copia válida conocida y conservar la carga útil rechazada como `.clobbered.*`.
    - Cuando se realizan muchas reparaciones para una ruta de configuración, OpenClaw rota los archivos `.clobbered.*` más antiguos para que la carga útil reparada más reciente siga disponible.

  </Accordion>
  <Accordion title="Examinar y reparar">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Indicadores comunes">
    - Existe `.clobbered.*` → doctor conservó una edición externa dañada mientras reparaba la configuración activa.
    - Existe `.rejected.*` → una escritura de configuración propiedad de OpenClaw no superó las comprobaciones del esquema o de sobrescritura antes de confirmarse.
    - `Config write rejected:` → la escritura intentó eliminar una estructura obligatoria, reducir drásticamente el archivo o conservar una configuración no válida.
    - `config reload skipped (invalid config):` → una edición directa no superó la validación y el Gateway en ejecución la ignoró.
    - `Invalid config at ...` → el inicio falló antes de que arrancaran los servicios del Gateway.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` o `size-drop-vs-last-good:*` → se rechazó una escritura propiedad de OpenClaw porque perdió campos o tamaño en comparación con la última copia de seguridad válida conocida.
    - `Config last-known-good promotion skipped` → el candidato contenía marcadores de posición de secretos censurados como `***`.

  </Accordion>
  <Accordion title="Opciones de corrección">
    1. Ejecute `openclaw doctor --fix` para permitir que doctor repare una configuración con prefijos o sobrescrita, o restaure la última configuración válida conocida.
    2. Copie únicamente las claves previstas de `.clobbered.*` o `.rejected.*` y aplíquelas con `openclaw config set` o `config.patch`.
    3. Ejecute `openclaw config validate` antes de reiniciar.
    4. Si edita manualmente, conserve la configuración JSON5 completa, no solo el objeto parcial que pretendía cambiar.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Configuración](/es/cli/config)
- [Configuración: recarga en caliente](/es/gateway/configuration#config-hot-reload)
- [Configuración: validación estricta](/es/gateway/configuration#strict-validation)
- [Doctor](/es/gateway/doctor)

## Advertencias de sondeo del Gateway

Úselo cuando `openclaw gateway probe` logra comunicarse con algún destino, pero aun así muestra un bloque de advertencias.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Busque:

- `warnings[].code` y `primaryTargetId` en la salida JSON.
- Si la advertencia se refiere a la reserva mediante SSH, a varios gateways, a ámbitos faltantes o a referencias de autenticación sin resolver.

Indicadores comunes:

- `SSH tunnel failed to start; falling back to direct probes.` → la configuración de SSH falló, pero el comando aun así intentó sondeos directos a los destinos configurados o de bucle invertido.
- `multiple reachable gateway identities detected` → respondieron gateways distintos o OpenClaw no pudo demostrar que los destinos accesibles fueran el mismo Gateway. Un túnel SSH, una URL de proxy o una URL remota configurada que apunten al mismo Gateway se consideran un único Gateway con varios transportes, aunque los puertos de transporte sean distintos.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la conexión funcionó, pero la RPC detallada está limitada por los ámbitos; empareje la identidad del dispositivo o use credenciales con `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → la conexión funcionó, pero el conjunto completo de RPC de diagnóstico agotó el tiempo de espera o falló. Considérelo un Gateway accesible con diagnósticos degradados; compare `connect.ok` y `connect.rpcOk` en la salida de `--json`.
- `Capability: pairing-pending` o `gateway closed (1008): pairing required` → el Gateway respondió, pero este cliente aún necesita emparejamiento o aprobación antes de obtener acceso normal de operador.
- Texto de advertencia sobre SecretRef sin resolver para `gateway.auth.*` / `gateway.remote.*` → el material de autenticación no estaba disponible en esta ruta de comandos para el destino fallido.

Relacionado:

- [Gateway](/es/cli/gateway)
- [Varios gateways en el mismo host](/es/gateway#multiple-gateways-same-host)
- [Acceso remoto](/es/gateway/remote)

## Canal conectado, pero los mensajes no circulan

Si el estado del canal indica que está conectado, pero el flujo de mensajes está interrumpido, céntrese en la política, los permisos y las reglas de entrega específicas del canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Busque:

- La política de mensajes directos (`pairing`, `allowlist`, `open`, `disabled`).
- La lista de permitidos del grupo y los requisitos de mención.
- Permisos o ámbitos faltantes de la API del canal.

Indicadores comunes:

- `mention required` → el mensaje se ignoró debido a la política de menciones del grupo.
- Rastros de `pairing` / aprobación pendiente → el remitente no está aprobado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de autenticación o permisos del canal.

Relacionado:

- [Solución de problemas de canales](/es/channels/troubleshooting)
- [Discord](/es/channels/discord)
- [Telegram](/es/channels/telegram)
- [WhatsApp](/es/channels/whatsapp)

## Entrega de Cron y Heartbeat

Si Cron o Heartbeat no se ejecutaron o no realizaron la entrega, verifique primero el estado del programador y, después, el destino de entrega.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Busque:

- Que Cron esté habilitado y que exista un próximo despertar.
- El estado del historial de ejecuciones del trabajo (`ok`, `skipped`, `error`).
- Los motivos de omisión de Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Indicadores comunes">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron está deshabilitado.
    - `cron: timer tick failed` → falló el ciclo del programador; compruebe si hay errores de archivos, registros o tiempo de ejecución.
    - `heartbeat skipped` con `reason=quiet-hours` → fuera del intervalo de horas activas.
    - `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe, pero solo contiene elementos de estructura vacíos, como espacios en blanco, comentarios, encabezados, bloques cercados o listas de comprobación vacías, por lo que OpenClaw omite la llamada al modelo.
    - `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un bloque `tasks:`, pero ninguna de las tareas debe ejecutarse en este ciclo.
    - `heartbeat: unknown accountId` → identificador de cuenta no válido para el destino de entrega de Heartbeat.
    - `heartbeat skipped` con `reason=dm-blocked` → el destino de Heartbeat se resolvió como un destino de tipo mensaje directo mientras `agents.defaults.heartbeat.directPolicy` (o la anulación por agente) está configurado como `block`.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Heartbeat](/es/gateway/heartbeat)
- [Tareas programadas](/es/automation/cron-jobs)
- [Tareas programadas: solución de problemas](/es/automation/cron-jobs#troubleshooting)

## Node emparejado, pero la herramienta falla

Si un Node está emparejado, pero las herramientas fallan, aísle el estado de primer plano, permisos y aprobación.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Busque:

- Que el Node esté en línea y tenga las capacidades esperadas.
- Concesiones de permisos del sistema operativo para la cámara, el micrófono, la ubicación y la pantalla.
- El estado de las aprobaciones de ejecución y de la lista de permitidos.

Indicadores comunes:

- `NODE_BACKGROUND_UNAVAILABLE` → la aplicación del Node debe estar en primer plano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → falta un permiso del sistema operativo.
- `SYSTEM_RUN_DENIED: approval required` → la aprobación de ejecución está pendiente.
- `SYSTEM_RUN_DENIED: allowlist miss` → el comando está bloqueado por la lista de permitidos.

Relacionado:

  - [Aprobaciones de ejecución](/es/tools/exec-approvals)
  - [Solución de problemas de Node](/es/nodes/troubleshooting)
  - [Nodes](/es/nodes/index)

  ## La herramienta de navegador falla

  Úselo cuando las acciones de la herramienta de navegador fallen aunque el Gateway esté en buen estado.

  ```bash
  openclaw browser status
  openclaw browser start --browser-profile openclaw
  openclaw browser profiles
  openclaw logs --follow
  openclaw doctor
  ```

  Compruebe:

  - Si `plugins.allow` está configurado e incluye `browser`.
  - Que la ruta del ejecutable del navegador sea válida.
  - Que se pueda acceder al perfil CDP.
  - Que Chrome local esté disponible para los perfiles `existing-session` / `user`.

  <AccordionGroup>
  <Accordion title="Firmas del Plugin / ejecutable">
    - `unknown command "browser"` o `unknown command 'browser'` → el Plugin de navegador incluido está excluido por `plugins.allow`.
    - Herramienta de navegador ausente o no disponible cuando `browser.enabled=true` → `plugins.allow` excluye `browser`, por lo que el Plugin nunca se cargó.
    - `Failed to start Chrome CDP on port` → no se pudo iniciar el proceso del navegador.
    - `browser.executablePath not found` → la ruta configurada no es válida.
    - `browser.cdpUrl must be http(s) or ws(s)` → la URL de CDP configurada utiliza un esquema no compatible, como `file:` o `ftp:`.
    - `browser.cdpUrl has invalid port` → la URL de CDP configurada tiene un puerto incorrecto o fuera de rango.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → la instalación actual del Gateway carece de la dependencia principal del entorno de ejecución del navegador; reinstale o actualice OpenClaw y, a continuación, reinicie el Gateway. Las instantáneas ARIA y las capturas de pantalla básicas de páginas pueden seguir funcionando, pero la navegación, las instantáneas de IA, las capturas de pantalla de elementos mediante selectores CSS y la exportación a PDF seguirán sin estar disponibles.

  </Accordion>
  <Accordion title="Firmas de Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP con existing-session aún no pudo conectarse al directorio de datos del navegador seleccionado. Abra la página de inspección del navegador, habilite la depuración remota, mantenga abierto el navegador, apruebe la primera solicitud de conexión y vuelva a intentarlo. Si no se requiere mantener la sesión iniciada, es preferible usar el perfil administrado `openclaw`.
    - `No browser tabs found for profile="user"` → el perfil de conexión de Chrome MCP no tiene pestañas locales de Chrome abiertas.
    - `Remote CDP for profile "<name>" is not reachable` → no se puede acceder al punto de conexión CDP remoto configurado desde el host del Gateway.
    - `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → el perfil de solo conexión no tiene ningún destino accesible, o el punto de conexión HTTP respondió, pero aun así no se pudo abrir el WebSocket de CDP.

  </Accordion>
  <Accordion title="Firmas de elementos / capturas de pantalla / cargas">
    - `fullPage is not supported for element screenshots` → la solicitud de captura de pantalla combinó `--full-page` con `--ref` o `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → las llamadas de captura de pantalla de Chrome MCP / `existing-session` deben usar la captura de página o un `--ref` de instantánea, no un `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → los enlaces de carga de Chrome MCP requieren referencias de instantáneas, no selectores CSS.
    - `existing-session file uploads currently support one file at a time.` → envíe una carga por llamada en los perfiles de Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → los enlaces de diálogos de los perfiles de Chrome MCP no admiten anulaciones del tiempo de espera.
    - `existing-session type does not support timeoutMs overrides.` → omita `timeoutMs` para `act:type` en los perfiles `profile="user"` / Chrome MCP con existing-session, o use un perfil de navegador administrado/CDP cuando se requiera un tiempo de espera personalizado.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` todavía requiere un perfil de navegador administrado o CDP sin procesar.
    - Anulaciones obsoletas de la ventana gráfica, el modo oscuro, la configuración regional o el modo sin conexión en perfiles de solo conexión o CDP remoto → ejecute `openclaw browser stop --browser-profile <name>` para cerrar la sesión de control activa y liberar el estado de emulación de Playwright/CDP sin reiniciar todo el Gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Navegador (gestionado por OpenClaw)](/es/tools/browser)
- [Solución de problemas del navegador](/es/tools/browser-linux-troubleshooting)

## Si realizó una actualización y algo dejó de funcionar de repente

La mayoría de los problemas posteriores a una actualización se deben a desviaciones en la configuración o a que ahora se aplican valores predeterminados más estrictos.

<AccordionGroup>
  <Accordion title="1. Cambió el comportamiento de autenticación y anulación de URL">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Qué comprobar:

    - Si `gateway.mode=remote`, las llamadas de la CLI pueden dirigirse al servicio remoto aunque el servicio local funcione correctamente.
    - Las llamadas con `--url` explícito no recurren a las credenciales almacenadas.

    Indicadores habituales:

    - `gateway connect failed:` → destino de URL incorrecto.
    - `unauthorized` → el endpoint es accesible, pero la autenticación es incorrecta.

  </Accordion>
  <Accordion title="2. Las medidas de protección de vinculación y autenticación son más estrictas">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Qué comprobar:

    - Las vinculaciones que no son de bucle local (`lan`, `tailnet`, `custom`) necesitan una ruta de autenticación válida del Gateway: autenticación mediante token compartido o contraseña, o una implementación `trusted-proxy` correctamente configurada que no sea de bucle local.
    - Las claves antiguas como `gateway.token` no sustituyen a `gateway.auth.token`.

    Indicadores habituales:

    - `refusing to bind gateway ... without auth` → vinculación que no es de bucle local sin una ruta de autenticación válida del Gateway.
    - `Connectivity probe: failed` mientras el entorno de ejecución está activo → el Gateway está operativo, pero no es accesible con la autenticación o URL actuales.

  </Accordion>
  <Accordion title="3. El estado del emparejamiento y de la identidad del dispositivo cambió">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Qué comprobar:

    - Aprobaciones de dispositivos pendientes para el panel de control o los nodos.
    - Aprobaciones de emparejamiento de mensajes directos pendientes después de cambios en las políticas o identidades.

    Indicadores habituales:

    - `device identity required` → no se ha satisfecho la autenticación del dispositivo.
    - `pairing required` → se debe aprobar el remitente o dispositivo.

  </Accordion>
</AccordionGroup>

Si la configuración del servicio y el entorno de ejecución siguen sin coincidir después de las comprobaciones, reinstale los metadatos del servicio desde el mismo directorio de perfil/estado:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Relacionado:

- [Autenticación](/es/gateway/authentication)
- [Ejecución en segundo plano y herramienta de procesos](/es/gateway/background-process)
- [Emparejamiento de Node](/es/gateway/pairing)

## Contenido relacionado

- [Doctor](/es/gateway/doctor)
- [Preguntas frecuentes](/es/help/faq)
- [Guía operativa del Gateway](/es/gateway)
