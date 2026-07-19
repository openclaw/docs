---
read_when:
    - El centro de solución de problemas le remitió aquí para realizar un diagnóstico más exhaustivo.
    - Necesita secciones estables de manual operativo basadas en síntomas y con comandos exactos.
sidebarTitle: Troubleshooting
summary: Guía detallada de solución de problemas para Gateway, canales, automatización, Nodes y navegador
title: Solución de problemas
x-i18n:
    generated_at: "2026-07-19T01:58:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 104d84b73305cb1290562c5045e0733611f5d9c42be064773c288429604da7f4
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Este es el manual operativo detallado. Para realizar primero el flujo de triaje rápido, comience en [/help/troubleshooting](/es/help/troubleshooting).

## Secuencia de comandos

Ejecútelos en este orden:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Señales de funcionamiento correcto:

- `openclaw gateway status` muestra `Runtime: running`, `Connectivity probe: ok` y una línea `Capability: ...`.
- `openclaw doctor` no informa de problemas de configuración o del servicio que impidan continuar.
- `openclaw channels status --probe` muestra el estado activo del transporte por cuenta y, cuando se admite, `works` o `audit ok`.

## Después de una actualización

Utilice esta sección cuando finalice una actualización, pero el Gateway esté inactivo, los canales estén vacíos o las llamadas a modelos fallen con errores 401.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Compruebe lo siguiente:

- `Update restart` en `openclaw status` / `openclaw status --all`. Las transferencias pendientes o fallidas incluyen el siguiente comando que se debe ejecutar.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` en Canales: la configuración del canal aún existe, pero el registro del plugin falló antes de que se pudiera cargar el canal.
- Errores 401 del proveedor después de volver a autenticarse: `openclaw doctor --fix` comprueba si hay copias obsoletas de autenticación OAuth por agente y elimina las antiguas para que todos los agentes resuelvan el perfil compartido actual.

## Instalaciones divergentes y protección contra configuraciones más recientes

Utilice esta sección cuando un servicio de Gateway se detenga inesperadamente después de una actualización o los registros muestren que un binario `openclaw` es más antiguo que la versión que escribió `openclaw.json` por última vez.

OpenClaw marca las escrituras de configuración con `meta.lastTouchedVersion`. Los comandos de solo lectura pueden inspeccionar una configuración escrita por una versión más reciente de OpenClaw, pero las mutaciones de procesos y servicios se niegan a ejecutarse desde un binario más antiguo. Acciones bloqueadas: iniciar, detener, reiniciar o desinstalar el servicio del Gateway; forzar la reinstalación del servicio; iniciar el Gateway en modo de servicio; y limpiar el puerto de `gateway --force`.

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
  <Step title="Reinstalar el servicio del Gateway">
    Reinstale el servicio del Gateway previsto desde la instalación más reciente:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Eliminar envoltorios obsoletos">
    Elimine las entradas obsoletas de paquetes del sistema o de envoltorios antiguos que aún apunten a un binario `openclaw` antiguo.
  </Step>
</Steps>

<Warning>
Solo para una reversión intencionada a una versión anterior o una recuperación de emergencia, establezca `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` para ese único comando. Manténgalo sin establecer durante el funcionamiento normal.
</Warning>

## Incompatibilidad de protocolo después de una reversión

Utilice esta sección cuando los registros sigan mostrando `protocol mismatch` después de volver a una versión anterior o revertir una actualización. Se está ejecutando un Gateway antiguo, pero un proceso de cliente local más reciente sigue intentando reconectarse con un intervalo de protocolo que el Gateway antiguo no admite.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Compruebe lo siguiente:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` en los registros del Gateway.
- `Established clients:` en `openclaw gateway status --deep` o `Gateway clients` en `openclaw doctor --deep`: clientes TCP activos conectados al puerto del Gateway, con PID y líneas de comandos cuando el sistema operativo lo permita.
- Un proceso de cliente cuya línea de comandos apunte a la instalación o al envoltorio más reciente de OpenClaw desde el que realizó la reversión.

Solución:

1. Detenga o reinicie el proceso de cliente obsoleto de OpenClaw que muestra `gateway status --deep`.
2. Reinicie las aplicaciones o los envoltorios que incorporen OpenClaw: paneles locales, editores, auxiliares de servidores de aplicaciones o shells `openclaw logs --follow` de larga duración.
3. Vuelva a ejecutar `openclaw gateway status --deep` o `openclaw doctor --deep` y confirme que el PID del cliente obsoleto haya desaparecido.

No haga que un Gateway antiguo acepte un protocolo más reciente e incompatible. Los incrementos de versión del protocolo protegen el contrato de comunicación; la recuperación tras una reversión es un problema de limpieza de procesos y versiones.

## Enlace simbólico de una Skill omitido por escapar de la ruta

Utilice esta sección cuando los registros incluyan:

```text
Se omite la ruta de la Skill que escapa de su raíz configurada: ... reason=symlink-escape
```

Cada raíz de Skills constituye un límite de contención. Un enlace simbólico en `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` o `~/.openclaw/skills` se omite cuando su destino real se resuelve fuera de esa raíz, a menos que el destino sea de confianza de forma explícita.

Inspeccione el enlace:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Si el destino es intencionado, configure tanto la raíz directa de Skills como el destino permitido del enlace simbólico:

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

A continuación, inicie una sesión nueva o espere a que el observador de Skills se actualice. Reinicie el Gateway si el proceso en ejecución es anterior al cambio de configuración.

No utilice destinos amplios como `~`, `/` o una carpeta completa de un proyecto sincronizado. Mantenga `allowSymlinkTargets` limitado a la raíz real de Skills que contenga directorios `SKILL.md` de confianza.

Si la aplicación de Skill Workshop también debe escribir a través de esas rutas de Skills del espacio de trabajo enlazadas simbólicamente y de confianza, active `skills.workshop.allowSymlinkTargetWrites`. Manténgalo desactivado para las raíces compartidas de Skills de solo lectura.

Relacionado:

- [Configuración de Skills](/es/tools/skills-config#symlinked-skill-roots)
- [Ejemplos de configuración](/es/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429: se requiere uso adicional para un contexto largo

Utilice esta sección cuando los registros o errores incluyan: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Compruebe lo siguiente:

- El modelo de Anthropic seleccionado es un modelo Claude 4.x con disponibilidad general y capacidad para 1M (Opus 4.6/4.7/4.8, Sonnet 4.6), o la configuración del modelo aún contiene el valor heredado `params.context1m: true`.
- La credencial actual de Anthropic no es apta para el uso de contexto largo.
- Las solicitudes solo fallan en sesiones o ejecuciones del modelo largas que necesitan la ruta de contexto de 1M.

Opciones de solución:

<Steps>
  <Step title="Usar una ventana de contexto estándar">
    Cambie a un modelo con una ventana estándar o elimine el valor heredado `context1m` de una
    configuración de modelo antigua que no tenga disponibilidad general para un contexto de 1M.
  </Step>
  <Step title="Usar una credencial apta">
    Utilice una credencial de Anthropic apta para solicitudes de contexto largo o cambie a una clave de API de Anthropic.
  </Step>
  <Step title="Configurar modelos de respaldo">
    Configure modelos de respaldo para que las ejecuciones continúen cuando se rechacen las solicitudes de contexto largo de Anthropic.
  </Step>
</Steps>

Relacionado:

- [Anthropic](/es/providers/anthropic)
- [Uso y costes de tokens](/es/reference/token-use)
- [¿Por qué recibo un error HTTP 429 de Anthropic?](/es/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Respuestas 403 bloqueadas en el servidor de origen

Utilice esta sección cuando un proveedor de LLM de origen devuelva un error genérico `403`, como `Your request was blocked`.

No presuponga que siempre se trata de un problema de configuración de OpenClaw. La respuesta puede proceder de una capa de seguridad de origen, como una CDN, un WAF, una regla de gestión de bots o un proxy inverso situado delante de un endpoint compatible con OpenAI.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Compruebe lo siguiente:

- Varios modelos del mismo proveedor fallan de la misma forma.
- Aparece HTML o texto de seguridad genérico en lugar de un error normal de la API del proveedor.
- Hay eventos de seguridad del proveedor correspondientes a la misma hora de la solicitud.
- Una pequeña prueba directa de `curl` funciona, mientras que las solicitudes con el formato normal del SDK fallan.

Corrija primero el filtrado del proveedor cuando las pruebas indiquen un bloqueo del WAF o de la CDN. Se recomienda usar una regla de permiso u omisión estrictamente limitada a la ruta de la API que utiliza OpenClaw y evitar desactivar la protección de todo el sitio.

<Warning>
Que una solicitud mínima de `curl` funcione correctamente no garantiza que las solicitudes reales con el formato del SDK atraviesen la misma capa de seguridad de origen.
</Warning>

Relacionado:

- [Endpoints compatibles con OpenAI](/es/gateway/configuration-reference#openai-compatible-endpoints)
- [Configuración de proveedores](/es/providers)
- [Registros](/es/logging)

## El backend local compatible con OpenAI supera las pruebas directas, pero las ejecuciones del agente fallan

Utilice esta sección cuando:

- `curl ... /v1/models` funcione.
- Las llamadas directas pequeñas de `/v1/chat/completions` funcionen.
- Las ejecuciones de modelos de OpenClaw fallen únicamente durante los turnos normales del agente.

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hola"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hola" --json
openclaw logs --follow
```

Compruebe lo siguiente:

- Las llamadas directas pequeñas funcionan, pero las ejecuciones de OpenClaw solo fallan con prompts más grandes.
- Se producen errores `model_not_found` o 404 aunque una solicitud directa de `/v1/chat/completions` funcione con el mismo identificador básico del modelo.
- El backend genera errores que indican que `messages[].content` esperaba una cadena.
- Se producen advertencias intermitentes `incomplete turn detected ... stopReason=stop payloads=0` con un backend local compatible con OpenAI.
- El backend se bloquea únicamente con un mayor número de tokens en el prompt o con los prompts completos del entorno de ejecución del agente.

<AccordionGroup>
  <Accordion title="Indicadores habituales">
    - `model_not_found` con un servidor local de tipo MLX/vLLM: compruebe que `baseUrl` incluya `/v1`, que `api` sea `"openai-completions"` para backends `/v1/chat/completions` y que `models.providers.<provider>.models[].id` sea el identificador local básico del proveedor. Selecciónelo una sola vez con el prefijo del proveedor, por ejemplo, `mlx/mlx-community/Qwen3-30B-A3B-6bit`; mantenga la entrada del catálogo como `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string`: el backend rechaza las partes de contenido estructuradas de Chat Completions. Solución: establezca `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` o claves de mensaje permitidas como `["role","content"]`: el backend rechaza los metadatos de reproducción de estilo OpenAI en los mensajes de Chat Completions. Solución: establezca `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0`: el backend completó la solicitud de Chat Completions, pero no devolvió texto visible para el usuario del asistente durante ese turno. OpenClaw reintenta una vez los turnos vacíos compatibles con OpenAI que se pueden reproducir de forma segura; los fallos persistentes suelen indicar que el backend está emitiendo contenido vacío o no textual, o suprimiendo el texto de la respuesta final.
    - Las solicitudes directas pequeñas funcionan, pero las ejecuciones del agente de OpenClaw fallan debido a bloqueos del backend o del modelo (por ejemplo, Gemma en algunas compilaciones `inferrs`): es probable que el transporte de OpenClaw ya sea correcto; el backend está fallando debido al formato más grande del prompt del entorno de ejecución del agente.
    - Los fallos disminuyen después de desactivar las herramientas, pero no desaparecen: los esquemas de herramientas formaban parte de la presión, pero el problema restante sigue siendo la capacidad del modelo o servidor de origen, o un error del backend.

  </Accordion>
  <Accordion title="Opciones de solución">
    1. Establezca `compat.requiresStringContent: true` para los backends de Chat Completions que solo admitan cadenas.
    2. Establezca `compat.strictMessageKeys: true` para los backends estrictos de Chat Completions que solo acepten `role` y `content` en cada mensaje.
    3. Establezca `compat.supportsTools: false` para modelos o backends que no puedan procesar de forma fiable la superficie de esquemas de herramientas de OpenClaw.
    4. Reduzca la presión del prompt cuando sea posible: un arranque del espacio de trabajo más pequeño, un historial de sesión más corto, un modelo local más ligero o un backend con una mejor compatibilidad con contextos largos.
    5. Si las solicitudes directas pequeñas siguen funcionando mientras los turnos del agente de OpenClaw continúan bloqueándose dentro del backend, trátelo como una limitación del servidor o modelo de origen y presente allí una reproducción con el formato de carga útil aceptado.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Configuración](/es/gateway/configuration)
- [Modelos locales](/es/gateway/local-models)
- [Endpoints compatibles con OpenAI](/es/gateway/configuration-reference#openai-compatible-endpoints)

## Sin respuestas

Si los canales están activos pero no se obtiene ninguna respuesta, compruebe el enrutamiento y la política antes de volver a conectar nada.

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
- Discrepancias en las listas de permitidos del canal o grupo.

Indicadores habituales:

- `drop guild message (mention required` → el mensaje de grupo se ignora hasta que haya una mención.
- `pairing request` → el remitente necesita aprobación.
- `blocked` / `allowlist` → la política filtró al remitente o canal.

Relacionado:

- [Solución de problemas de canales](/es/channels/troubleshooting)
- [Grupos](/es/channels/groups)
- [Emparejamiento](/es/channels/pairing)

## Conectividad de la interfaz de control del panel

Cuando el panel o la interfaz de control no se conecten, valide la URL, el modo de autenticación y las suposiciones sobre el contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Busque:

- URL de sondeo y URL del panel correctas.
- Discrepancia del modo de autenticación o del token entre el cliente y el Gateway.
- Uso de HTTP cuando se requiere la identidad del dispositivo.

Si un navegador local no puede conectarse a `127.0.0.1:18789` después de una actualización, primero recupere el servicio Gateway local y confirme que está sirviendo el panel:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Si `curl` devuelve HTML de OpenClaw, el Gateway funciona y el problema restante probablemente sea la caché del navegador, un enlace profundo antiguo o el estado obsoleto de una pestaña. Abra `http://127.0.0.1:18789` directamente y navegue desde el panel. Si el servicio no permanece en ejecución después de reiniciarlo, ejecute `openclaw gateway start` y vuelva a comprobar `openclaw gateway status`.

<AccordionGroup>
  <Accordion title="Indicadores de conexión y autenticación">
    - `device identity required` → contexto no seguro o falta la autenticación del dispositivo.
    - `origin not allowed` → el `Origin` del navegador no está en `gateway.controlUi.allowedOrigins` (o se está conectando desde un origen del navegador que no es de bucle invertido sin una lista de permitidos explícita).
    - `device nonce required` / `device nonce mismatch` → el cliente no está completando el flujo de autenticación del dispositivo basado en desafío (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → el cliente firmó la carga útil incorrecta (o una marca de tiempo obsoleta) para el protocolo de enlace actual.
    - `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → el cliente puede realizar un reintento de confianza con el token del dispositivo almacenado en caché.
    - Ese reintento con el token almacenado en caché reutiliza el conjunto de ámbitos almacenado con el token del dispositivo emparejado. En cambio, los llamadores con `deviceToken` explícito o `scopes` explícito conservan el conjunto de ámbitos solicitado.
    - `AUTH_SCOPE_MISMATCH` → se reconoció el token del dispositivo, pero sus ámbitos aprobados no cubren esta solicitud de conexión; vuelva a emparejar o apruebe el contrato de ámbitos solicitado en lugar de rotar un token compartido del Gateway.
    - Fuera de esa ruta de reintento, la precedencia de la autenticación de conexión es: primero el token compartido o la contraseña explícitos; después, `deviceToken` explícito; luego, el token del dispositivo almacenado; y, por último, el token de arranque.
    - En la ruta asíncrona de la interfaz de control de Tailscale Serve, los intentos fallidos del mismo `{scope, ip}` se serializan antes de que el limitador registre el fallo. Por tanto, dos reintentos simultáneos incorrectos del mismo cliente pueden mostrar `retry later` en el segundo intento, en lugar de dos simples discrepancias.
    - `too many failed authentication attempts (retry later)` desde un cliente de bucle invertido con origen de navegador → los fallos repetidos desde ese mismo `Origin` normalizado se bloquean temporalmente; otro origen localhost utiliza un grupo independiente.
    - `unauthorized` repetido después de ese reintento → divergencia entre el token compartido y el token del dispositivo; actualice la configuración del token y vuelva a aprobar o rotar el token del dispositivo si es necesario.
    - `gateway connect failed:` → destino de host, puerto o URL incorrecto.

  </Accordion>
</AccordionGroup>

### Mapa rápido de códigos de detalle de autenticación

Utilice `error.details.code` de la respuesta fallida de `connect` para elegir la siguiente acción:

| Código de detalle             | Significado                                                                                                                                                                                  | Acción recomendada                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | El cliente no envió un token compartido obligatorio.                                                                                                                                         | Pegue o establezca el token en el cliente y vuelva a intentarlo. Para las rutas del panel: `openclaw config get gateway.auth.token` y, a continuación, péguelo en la configuración de la interfaz de control.                                                                                                    |
| `AUTH_TOKEN_MISMATCH`        | El token compartido no coincidió con el token de autenticación del Gateway.                                                                                                                   | Si `canRetryWithDeviceToken=true`, permita un reintento de confianza. Los reintentos con tokens almacenados en caché reutilizan los ámbitos aprobados almacenados; los llamadores con `deviceToken` / `scopes` explícitos conservan los ámbitos solicitados. Si continúa fallando, siga la [lista de comprobación para recuperar la divergencia de tokens](/es/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | El token almacenado en caché por dispositivo está obsoleto o se ha revocado.                                                                                                                  | Rote o vuelva a aprobar el token del dispositivo mediante la [CLI de dispositivos](/es/cli/devices) y, a continuación, vuelva a conectarse.                                                                                                                                                |
| `AUTH_SCOPE_MISMATCH`        | El token del dispositivo es válido, pero su rol o sus ámbitos aprobados no cubren esta solicitud de conexión.                                                                                 | Vuelva a emparejar el dispositivo o apruebe el contrato de ámbitos solicitado; no trate este caso como una divergencia del token compartido.                                                                                                                                             |
| `PAIRING_REQUIRED`           | La identidad del dispositivo necesita aprobación. Compruebe `error.details.reason` para `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade`, y utilice `requestId` / `remediationHint` cuando estén presentes. | Apruebe la solicitud pendiente: `openclaw devices list` y, a continuación, `openclaw devices approve <requestId>`. Las ampliaciones de ámbito o rol utilizan el mismo flujo después de revisar el acceso solicitado.                                                                                                |

<Note>
Las RPC directas del backend de bucle invertido autenticadas con el token compartido o la contraseña del Gateway no deberían depender de la base de ámbitos de dispositivos emparejados de la CLI. Si los subagentes u otras llamadas internas siguen fallando con `scope-upgrade`, verifique que el llamador utiliza `client.id: "gateway-client"` y `client.mode: "backend"`, y que no fuerza un `deviceIdentity` explícito ni un token de dispositivo.
</Note>

Comprobación de la migración de autenticación de dispositivos v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si los registros muestran errores de nonce o firma, actualice el cliente que se conecta y verifique lo siguiente:

<Steps>
  <Step title="Esperar a connect.challenge">
    El cliente espera el `connect.challenge` emitido por el Gateway.
  </Step>
  <Step title="Firmar la carga útil">
    El cliente firma la carga útil vinculada al desafío.
  </Step>
  <Step title="Enviar el nonce del dispositivo">
    El cliente envía `connect.params.device.nonce` con el mismo nonce del desafío.
  </Step>
</Steps>

Si `openclaw devices rotate` / `revoke` / `remove` se deniega inesperadamente:

- Las sesiones con tokens de dispositivos emparejados solo pueden gestionar **su propio** dispositivo, a menos que el llamador también tenga `operator.admin`.
- `openclaw devices rotate --scope ...` solo puede solicitar ámbitos de operador que ya posea la sesión del llamador.

Relacionado:

- [Configuración](/es/gateway/configuration) (modos de autenticación del Gateway)
- [Interfaz de control](/es/web/control-ui)
- [Dispositivos](/es/cli/devices)
- [Acceso remoto](/es/gateway/remote)
- [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth)

## El servicio Gateway no se está ejecutando

Utilice esta sección cuando el servicio esté instalado, pero el proceso no permanezca activo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # analizar también los servicios del sistema
```

Busque:

- `Runtime: stopped` con indicaciones sobre la salida.
- Discrepancia en la configuración del servicio (`Config (cli)` frente a `Config (service)`).
- Conflictos de puertos o procesos de escucha.
- Instalaciones adicionales de launchd/systemd/schtasks cuando se utiliza `--deep`.
- Indicaciones de limpieza de `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Indicadores habituales">
    - `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → el modo de Gateway local no está habilitado, o el archivo de configuración se sobrescribió y perdió `gateway.mode`. Solución: establezca `gateway.mode="local"` en la configuración o vuelva a ejecutar `openclaw onboard --mode local` / `openclaw setup` para volver a registrar la configuración esperada del modo local. Si se ejecuta OpenClaw mediante Podman, la ruta de configuración predeterminada es `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → enlace que no es de bucle invertido sin una ruta válida de autenticación del Gateway (token/contraseña o proxy de confianza, si está configurado).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflicto de puertos.
    - `Other gateway-like services detected (best effort)` → existen unidades de launchd/systemd/schtasks obsoletas o paralelas. La mayoría de las configuraciones deberían mantener un Gateway por equipo; si se necesita más de uno, aísle los puertos, la configuración, el estado y el espacio de trabajo. Consulte [/gateway#multiple-gateways-same-host](/es/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` de doctor → existe una unidad de sistema de systemd mientras falta el servicio de usuario. Elimine o deshabilite el duplicado antes de permitir que doctor instale un servicio de usuario, o establezca `OPENCLAW_SERVICE_REPAIR_POLICY=external` si la unidad de sistema es el supervisor previsto.
    - `Gateway service port does not match current gateway config` → el supervisor instalado aún fija el antiguo `--port`. Ejecute `openclaw doctor --fix` o `openclaw gateway install --force` y, a continuación, reinicie el servicio Gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Ejecución en segundo plano y herramienta de procesos](/es/gateway/background-process)
- [Configuración](/es/gateway/configuration)
- [Doctor](/es/gateway/doctor)

## El Gateway de macOS deja de responder silenciosamente y se reanuda al interactuar con el panel

Úsese cuando los canales (Telegram, WhatsApp, etc.) de un host macOS dejen de responder durante períodos de minutos a horas y el Gateway parezca volver en cuanto se abre la interfaz de control, se accede mediante SSH o se interactúa de algún otro modo con el host. Por lo general, no hay ningún síntoma evidente en `openclaw status` porque, para cuando se revisa, el Gateway ya está activo de nuevo.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Compruebe lo siguiente:

- Uno o más paquetes de `*-uncaught_exception.json` en `~/.openclaw/logs/stability/` con `error.code` establecido en un código de red transitorio como `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` o `ECONNREFUSED`.
- Líneas de `pmset -g log` como `Entering Sleep state due to 'Maintenance Sleep'` o `en0 driver is slow (msg: WillChangeState to 0)` que coincidan con las marcas de tiempo de los fallos. Power Nap / Maintenance Sleep pone brevemente el controlador Wi-Fi en el estado 0; cualquier `connect()` saliente que coincida con ese intervalo puede fallar con `ENETDOWN`, incluso en un host que, por lo demás, tenga conectividad de red completa.
- La salida de `launchctl print` muestra `state = not running` con varios `runs` recientes y un código de salida, especialmente cuando el intervalo entre el fallo y el siguiente inicio es de aproximadamente una hora en lugar de segundos. launchd de macOS aplica una protección no documentada contra la reaparición después de una ráfaga de fallos, lo que puede hacer que deje de respetar `KeepAlive=true` hasta que un desencadenador externo, como un inicio de sesión interactivo, una conexión del panel o `launchctl kickstart`, vuelva a activarlo.

Indicadores habituales:

- Un paquete de estabilidad cuyo `error.code` sea `ENETDOWN` o un código relacionado, con la pila de llamadas apuntando a `net` de Node, `lookupAndConnect` / `Socket.connect`. OpenClaw `2026.5.26` y las versiones posteriores clasifican estos casos como errores de red transitorios inofensivos, por lo que ya no se propagan al controlador superior de excepciones no capturadas; si se utiliza una versión anterior, actualícela primero.
- Períodos prolongados de inactividad que terminan en el instante en que se conecta a la interfaz de control o se accede al host mediante SSH: la actividad visible para el usuario es lo que vuelve a activar la protección contra reapariciones de launchd, no una acción del panel sobre el Gateway.
- El recuento de `runs` aumenta a lo largo del día sin una línea de `received SIG*; shutting down` correspondiente en `~/Library/Logs/openclaw/gateway.log`: los cierres limpios registran una señal; los fallos transitorios no.

Qué hacer:

1. **Actualice el Gateway** si se ejecuta una versión anterior a `2026.5.26`. Después de la actualización, los futuros errores de `ENETDOWN` se registrarán como advertencias en lugar de finalizar el proceso.
2. **Reduzca la actividad de suspensión de mantenimiento** en hosts Mac mini o de escritorio destinados a funcionar como servidores siempre activos:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Esto reduce considerablemente, pero no elimina por completo, la fluctuación subyacente del controlador. El sistema aún puede realizar algunas suspensiones de mantenimiento para conservar las conexiones TCP y mantener mDNS, independientemente de estas opciones.

3. **Añada un monitor de actividad** para que cualquier futura ráfaga de fallos bloqueada por launchd se detecte rápidamente:

   ```bash
   # Ejemplo de comprobación de actividad compatible con launchd, adecuada para un Cron o LaunchAgent cada 5 minutos
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   El objetivo es volver a activar externamente la protección contra reapariciones; `KeepAlive=true` por sí solo no basta en macOS después de una ráfaga de fallos.

Relacionado:

- [Notas sobre la plataforma macOS](/es/platforms/macos)
- [Registro](/es/logging)
- [Doctor](/es/gateway/doctor)

## Bucle del supervisor launchd de macOS con LaunchAgents de Gateway/Node duplicados

Úsese cuando una instalación de macOS siga reiniciándose cada pocos segundos, las comprobaciones de estado de `openclaw`
alternen entre disponible y no disponible, y el envío a los canales se bloquee
aunque el servicio parezca estar en ejecución.

Esto se observó en instalaciones antiguas donde tanto `ai.openclaw.gateway` como
`ai.openclaw.node` estaban activos y cada LaunchAgent inyectaba
`OPENCLAW_LAUNCHD_LABEL`. En ese estado, OpenClaw puede detectar la
supervisión de launchd, intentar devolver a launchd el control del reinicio y caer en un bucle rápido
de `EADDRINUSE`/reaparición, en lugar de mantener un único proceso estable del Gateway.

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

Compruebe lo siguiente:

- Más de un PID del Gateway en la muestra de 30 segundos, en lugar de un único
  proceso estable.
- `EADDRINUSE`, `another gateway instance is already listening` o líneas repetidas
  de reinicio/traspaso en `gateway.log`.
- Tanto `~/Library/LaunchAgents/ai.openclaw.gateway.plist` como
  `~/Library/LaunchAgents/ai.openclaw.node.plist` cargados al mismo tiempo en un
  host que debería ejecutar un solo servicio administrado del Gateway.

Qué hacer:

1. Si este host solo debe ejecutar el servicio Gateway, elimine el servicio administrado de Node
   mediante OpenClaw. **Omita este paso** si depende activamente del servicio Node
   para funciones de Node remoto; desinstalarlo detiene esas funciones en
   este host:

   ```bash
   openclaw node uninstall
   ```

2. Instale un envoltorio persistente para el Gateway que borre los
   marcadores de launchd heredados antes de iniciar OpenClaw. Utilice la opción compatible `--wrapper`; no
   edite el archivo generado en `~/.openclaw/service-env/`, porque la reinstalación
   y actualización del servicio, así como la reparación de Doctor, regeneran ese archivo:

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

   `gateway install` conserva la ruta del envoltorio durante reinstalaciones
   forzadas, actualizaciones y reparaciones de Doctor.

3. Verifique que el Gateway sea estable y atienda RPC, no que simplemente esté escuchando:

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   La muestra de PID debería mostrar un único proceso estable en lugar de un conjunto cambiante de
   PID, y el envío de canales entrantes debería reanudarse.

4. Después de actualizar a una versión donde esté corregido el bucle subyacente de
   dos LaunchAgents, elimine la solución temporal y reinstale el servicio administrado normal:

   ```bash
   OPENCLAW_WRAPPER= openclaw gateway install --force
   rm ~/.local/bin/openclaw-launchd-workaround
   ```

Relacionado:

- [Notas sobre la plataforma macOS](/es/platforms/mac/bundled-gateway)
- [Doctor](/es/gateway/doctor)
- [CLI del Gateway](/es/cli/gateway)

## El Gateway se cierra durante un uso elevado de memoria

Úsese cuando el Gateway desaparezca bajo carga, el supervisor informe de un reinicio similar a un OOM o los registros mencionen `critical memory pressure bundle written`.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Compruebe lo siguiente:

- `Reason: diagnostic.memory.pressure.critical` en el paquete de estabilidad más reciente.
- `Memory pressure:` con `critical/rss_threshold`, `critical/heap_threshold` o `critical/rss_growth`.
- Valores de `V8 heap:` cercanos al límite del montón.
- Entradas de `Largest session files:` como `agents/<agent>/sessions/<session>.jsonl` o `sessions/<session>.jsonl`.
- Contadores de memoria de cgroup de Linux cuando el Gateway se ejecuta dentro de un contenedor o un servicio con memoria limitada.

Indicadores habituales:

- `critical memory pressure bundle written` aparece poco antes del reinicio → OpenClaw capturó un paquete de estabilidad previo al OOM. Inspecciónelo con `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` aparece en los registros del Gateway → OpenClaw detectó una presión crítica de memoria, pero la instantánea de estabilidad previa al OOM está desactivada.
- `Largest session files:` apunta a una ruta de transcripción redactada muy grande → reduzca el historial de sesiones conservado, inspeccione el crecimiento de las sesiones o traslade las transcripciones antiguas fuera del almacén activo antes de reiniciar.
- Los bytes utilizados de `V8 heap:` están cerca del límite del montón → reduzca primero la presión de las solicitudes/sesiones o el trabajo simultáneo. Para un servicio administrado, inspeccione `Gateway heap:` en `openclaw gateway status`; si indica `not set`, regenere los metadatos antiguos del servicio con `openclaw gateway install --force`. El valor de `NODE_OPTIONS` del entorno del shell se ignora de forma intencionada. Utilice una anulación explícita del montón en el nivel del supervisor solo después de confirmar la carga de trabajo sostenida y dejar suficiente margen para la memoria nativa.
- `Memory pressure: critical/rss_growth` → la memoria creció rápidamente dentro de un único intervalo de muestreo. Revise los registros más recientes en busca de una importación grande, una salida descontrolada de herramientas, reintentos repetidos o un lote de trabajo de agentes en cola.
- Aparece una presión crítica de memoria en los registros, pero no existe ningún paquete → este es el comportamiento predeterminado. Establezca `diagnostics.memoryPressureSnapshot: true` para capturar el paquete de estabilidad previo al OOM en futuros eventos de presión crítica de memoria.

El paquete de estabilidad no contiene cargas útiles. Incluye pruebas operativas de memoria y rutas relativas de archivos redactadas, no texto de mensajes, cuerpos de Webhook, credenciales, tokens, cookies ni identificadores de sesión sin procesar. Adjunte la exportación de diagnóstico a los informes de errores en lugar de copiar registros sin procesar.

Relacionado:

- [Estado del Gateway](/es/gateway/health)
- [Exportación de diagnóstico](/es/gateway/diagnostics)
- [Sesiones](/es/cli/sessions)

## El Gateway rechazó una configuración no válida

Úsese cuando el inicio del Gateway falle con `Invalid config` o los registros de recarga en caliente indiquen que se omitió una edición no válida.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Compruebe lo siguiente:

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
    - La recarga en caliente omite las ediciones externas no válidas y mantiene activa la configuración actual del entorno de ejecución.
    - Las escrituras propiedad de OpenClaw rechazan las cargas útiles no válidas o destructivas antes de confirmarlas y guardan `.rejected.*`.
    - `openclaw doctor --fix` se encarga de la reparación. Puede eliminar prefijos que no sean JSON o restaurar la última copia válida conocida, conservando la carga útil rechazada como `.clobbered.*`.
    - Cuando se realizan muchas reparaciones para una ruta de configuración, OpenClaw rota los archivos `.clobbered.*` más antiguos para que la carga útil reparada más reciente siga estando disponible.

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
  <Accordion title="Indicadores habituales">
    - `.clobbered.*` existe → doctor conservó una edición externa dañada mientras reparaba la configuración activa.
    - `.rejected.*` existe → una escritura de configuración propiedad de OpenClaw no superó las comprobaciones de esquema o sobrescritura antes de confirmarse.
    - `Config write rejected:` → la escritura intentó eliminar una estructura obligatoria, reducir considerablemente el archivo o guardar una configuración no válida.
    - `config reload skipped (invalid config):` → una edición directa no superó la validación y el Gateway en ejecución la ignoró.
    - `Invalid config at ...` → el inicio falló antes de que arrancaran los servicios del Gateway.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` o `size-drop-vs-last-good:*` → se rechazó una escritura propiedad de OpenClaw porque perdió campos o tamaño en comparación con la última copia de seguridad válida conocida.
    - `Config last-known-good promotion skipped` → el candidato contenía marcadores de posición de secretos censurados, como `***`.

  </Accordion>
  <Accordion title="Opciones de corrección">
    1. Ejecute `openclaw doctor --fix` para permitir que doctor repare la configuración con prefijos o sobrescrita, o restaure la última configuración válida conocida.
    2. Copie únicamente las claves deseadas de `.clobbered.*` o `.rejected.*` y aplíquelas con `openclaw config set` o `config.patch`.
    3. Ejecute `openclaw config validate` antes de reiniciar.
    4. Si edita manualmente, conserve la configuración JSON5 completa, no solo el objeto parcial que quería cambiar.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Configuración](/es/cli/config)
- [Configuración: recarga en caliente](/es/gateway/configuration#config-hot-reload)
- [Configuración: validación estricta](/es/gateway/configuration#strict-validation)
- [Doctor](/es/gateway/doctor)

## Advertencias de sondeo del Gateway

Utilice esta sección cuando `openclaw gateway probe` llegue a algún destino, pero siga mostrando un bloque de advertencia.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Busque:

- `warnings[].code` y `primaryTargetId` en la salida JSON.
- Si la advertencia se refiere al mecanismo alternativo de SSH, a varios gateways, a ámbitos ausentes o a referencias de autenticación sin resolver.

Indicadores habituales:

- `SSH tunnel failed to start; falling back to direct probes.` → la configuración de SSH falló, pero el comando siguió intentando acceder a los destinos directos configurados o de bucle invertido.
- `multiple reachable gateway identities detected` → respondieron gateways distintos, o OpenClaw no pudo demostrar que los destinos accesibles fueran el mismo gateway. Un túnel SSH, una URL de proxy o una URL remota configurada para el mismo gateway se consideran un solo gateway con varios transportes, aunque los puertos de transporte sean diferentes.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la conexión funcionó, pero la RPC detallada está limitada por el ámbito; empareje la identidad del dispositivo o utilice credenciales con `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → la conexión funcionó, pero el conjunto completo de RPC de diagnóstico agotó el tiempo de espera o falló. Trátelo como un Gateway accesible con diagnósticos degradados; compare `connect.ok` y `connect.rpcOk` en la salida de `--json`.
- `Capability: pairing-pending` o `gateway closed (1008): pairing required` → el gateway respondió, pero este cliente todavía necesita emparejamiento o aprobación antes de obtener el acceso normal de operador.
- Texto de advertencia de SecretRef `gateway.auth.*` / `gateway.remote.*` sin resolver → el material de autenticación no estaba disponible en esta ruta de comandos para el destino que falló.

Relacionado:

- [Gateway](/es/cli/gateway)
- [Varios gateways en el mismo host](/es/gateway#multiple-gateways-same-host)
- [Acceso remoto](/es/gateway/remote)

## Canal conectado, pero los mensajes no circulan

Si el estado del canal indica que está conectado, pero el flujo de mensajes está detenido, céntrese en la política, los permisos y las reglas de entrega específicas del canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Busque:

- Política de mensajes directos (`pairing`, `allowlist`, `open`, `disabled`).
- Lista de permitidos del grupo y requisitos de mención.
- Permisos o ámbitos de la API del canal ausentes.

Indicadores habituales:

- `mention required` → la política de menciones del grupo ignoró el mensaje.
- `pairing` / rastros de aprobación pendiente → el remitente no está aprobado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de autenticación o permisos del canal.

Relacionado:

- [Solución de problemas de canales](/es/channels/troubleshooting)
- [Discord](/es/channels/discord)
- [Telegram](/es/channels/telegram)
- [WhatsApp](/es/channels/whatsapp)

## Entrega de Cron y Heartbeat

Si Cron o Heartbeat no se ejecutaron o no realizaron la entrega, verifique primero el estado del planificador y después el destino de entrega.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Busque:

- Cron habilitado y próxima activación presente.
- Estado del historial de ejecuciones del trabajo (`ok`, `skipped`, `error`).
- Motivos por los que se omitió Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Indicadores habituales">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron deshabilitado.
    - `cron: timer tick failed` → el ciclo del planificador falló; compruebe los errores de archivos, registros o tiempo de ejecución.
    - `heartbeat skipped` con `reason=quiet-hours` → fuera del intervalo de horas activas.
    - `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe, pero solo contiene una estructura auxiliar en blanco, de comentarios, encabezados, delimitadores o listas de comprobación vacías, por lo que OpenClaw omite la llamada al modelo.
    - `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un bloque `tasks:`, pero ninguna de las tareas vence en este ciclo.
    - `heartbeat: unknown accountId` → identificador de cuenta no válido para el destino de entrega de Heartbeat.
    - `heartbeat skipped` con `reason=dm-blocked` → el destino de Heartbeat se resolvió como un destino de tipo mensaje directo mientras `agents.defaults.heartbeat.directPolicy` (o la anulación específica del agente) está establecido en `block`.

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

- Node en línea con las capacidades esperadas.
- Permisos del sistema operativo concedidos para cámara, micrófono, ubicación y pantalla.
- Aprobaciones de ejecución y estado de la lista de permitidos.

Indicadores habituales:

- `NODE_BACKGROUND_UNAVAILABLE` → la aplicación del Node debe estar en primer plano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → falta un permiso del sistema operativo.
- `SYSTEM_RUN_DENIED: approval required` → aprobación de ejecución pendiente.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado por la lista de permitidos.

Relacionado:

- [Aprobaciones de ejecución](/es/tools/exec-approvals)
- [Solución de problemas de Node](/es/nodes/troubleshooting)
- [Nodes](/es/nodes/index)

## La herramienta del navegador falla

Utilice esta sección cuando las acciones de la herramienta del navegador fallen aunque el propio gateway funcione correctamente.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Busque:

- Si `plugins.allow` está establecido e incluye `browser`.
- Ruta válida al ejecutable del navegador.
- Accesibilidad del perfil CDP.
- Disponibilidad local de Chrome para los perfiles `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Indicadores del Plugin o ejecutable">
    - `unknown command "browser"` o `unknown command 'browser'` → el Plugin del navegador incluido está excluido por `plugins.allow`.
    - La herramienta del navegador falta o no está disponible mientras `browser.enabled=true` → `plugins.allow` excluye `browser`, por lo que el Plugin nunca se cargó.
    - `Failed to start Chrome CDP on port` → el proceso del navegador no pudo iniciarse.
    - `browser.executablePath not found` → la ruta configurada no es válida.
    - `browser.cdpUrl must be http(s) or ws(s)` → la URL CDP configurada utiliza un esquema no compatible, como `file:` o `ftp:`.
    - `browser.cdpUrl has invalid port` → la URL CDP configurada contiene un puerto incorrecto o fuera del intervalo.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → la instalación actual del gateway carece de la dependencia principal del entorno de ejecución del navegador; reinstale o actualice OpenClaw y reinicie el gateway. Las instantáneas ARIA y las capturas de pantalla básicas de páginas pueden seguir funcionando, pero la navegación, las instantáneas de IA, las capturas de elementos mediante selectores CSS y la exportación a PDF seguirán sin estar disponibles.

  </Accordion>
  <Accordion title="Indicadores de Chrome MCP o sesiones existentes">
    - `Could not find DevToolsActivePort for chrome` → la sesión existente de Chrome MCP aún no pudo conectarse al directorio de datos del navegador seleccionado. Abra la página de inspección del navegador, habilite la depuración remota, mantenga el navegador abierto, apruebe la primera solicitud de conexión y vuelva a intentarlo. Si no se requiere el estado de sesión iniciada, se recomienda el perfil administrado `openclaw`.
    - `No browser tabs found for profile="user"` → el perfil de conexión de Chrome MCP no tiene pestañas locales de Chrome abiertas.
    - `Remote CDP for profile "<name>" is not reachable` → no se puede acceder al punto de conexión CDP remoto configurado desde el host del gateway.
    - `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → el perfil de solo conexión no tiene ningún destino accesible, o el punto de conexión HTTP respondió, pero no se pudo abrir el WebSocket CDP.

  </Accordion>
  <Accordion title="Indicadores de elementos, capturas de pantalla o cargas">
    - `fullPage is not supported for element screenshots` → la solicitud de captura de pantalla combinó `--full-page` con `--ref` o `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → las llamadas de captura de pantalla de Chrome MCP / `existing-session` deben utilizar una captura de página o una `--ref` de instantánea, no un `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → los enlaces de carga de Chrome MCP necesitan referencias de instantáneas, no selectores CSS.
    - `existing-session file uploads currently support one file at a time.` → envíe una carga por llamada en los perfiles de Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → los enlaces de cuadros de diálogo de los perfiles de Chrome MCP no admiten anulaciones del tiempo de espera.
    - `existing-session type does not support timeoutMs overrides.` → omita `timeoutMs` para `act:type` en los perfiles `profile="user"` o de sesión existente de Chrome MCP, o utilice un perfil de navegador administrado o CDP cuando se requiera un tiempo de espera personalizado.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` todavía requiere un navegador administrado o un perfil CDP sin procesar.
    - Anulaciones obsoletas de la ventana gráfica, el modo oscuro, la configuración regional o el modo sin conexión en perfiles de solo conexión o CDP remotos → ejecute `openclaw browser stop --browser-profile <name>` para cerrar la sesión de control activa y liberar el estado de emulación de Playwright/CDP sin reiniciar todo el gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Navegador (administrado por OpenClaw)](/es/tools/browser)
- [Solución de problemas del navegador](/es/tools/browser-linux-troubleshooting)

## Si algo dejó de funcionar repentinamente después de actualizar

La mayoría de los problemas posteriores a una actualización se deben a divergencias en la configuración o a valores predeterminados más estrictos que ahora se aplican.

<AccordionGroup>
  <Accordion title="1. El comportamiento de la autenticación y la anulación de URL ha cambiado">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Qué comprobar:

    - Si `gateway.mode=remote`, las llamadas de la CLI pueden estar dirigiéndose al servicio remoto aunque el servicio local funcione correctamente.
    - Las llamadas explícitas a `--url` no recurren a las credenciales almacenadas.

    Indicadores habituales:

    - `gateway connect failed:` → destino de URL incorrecto.
    - `unauthorized` → el endpoint es accesible, pero la autenticación es incorrecta.

  </Accordion>
  <Accordion title="2. Las restricciones de vinculación y autenticación son más estrictas">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Qué comprobar:

    - Las vinculaciones que no son de bucle invertido (`lan`, `tailnet`, `custom`) necesitan una ruta de autenticación válida del Gateway: autenticación mediante token compartido o contraseña, o una implementación `trusted-proxy` que no sea de bucle invertido y esté configurada correctamente.
    - Las claves antiguas como `gateway.token` no sustituyen a `gateway.auth.token`.

    Indicadores habituales:

    - `refusing to bind gateway ... without auth` → vinculación que no es de bucle invertido sin una ruta de autenticación válida del Gateway.
    - `Connectivity probe: failed` mientras el entorno de ejecución está activo → el Gateway está activo, pero no es accesible con la autenticación o URL actuales.

  </Accordion>
  <Accordion title="3. El estado de emparejamiento e identidad del dispositivo ha cambiado">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Qué comprobar:

    - Aprobaciones de dispositivos pendientes para el panel o los nodos.
    - Aprobaciones de emparejamiento por mensaje directo pendientes después de cambios en la política o la identidad.

    Indicadores habituales:

    - `device identity required` → no se cumplen los requisitos de autenticación del dispositivo.
    - `pairing required` → se debe aprobar el remitente o el dispositivo.

  </Accordion>
</AccordionGroup>

Si la configuración del servicio y el entorno de ejecución siguen sin coincidir después de las comprobaciones, reinstale los metadatos del servicio desde el mismo directorio de perfil o estado:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Contenido relacionado:

- [Autenticación](/es/gateway/authentication)
- [Ejecución en segundo plano y herramienta de procesos](/es/gateway/background-process)
- [Emparejamiento de nodos](/es/gateway/pairing)

## Contenido relacionado

- [Doctor](/es/gateway/doctor)
- [Preguntas frecuentes](/es/help/faq)
- [Guía operativa del Gateway](/es/gateway)
