---
read_when:
    - Agregar funcionalidades que amplían el acceso o la automatización
summary: Consideraciones de seguridad y modelo de amenazas para ejecutar un Gateway de IA con acceso a shell
title: Seguridad
x-i18n:
    generated_at: "2026-05-02T20:48:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe44c1ab2b0487afc60b6220aa7665be3803906da187fe38ce33daf8b86c3a1a
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **Modelo de confianza de asistente personal.** Esta guía presupone un límite de operador de confianza
  por gateway (modelo de usuario único, asistente personal).
  OpenClaw **no** es un límite de seguridad multiinquilino hostil para múltiples
  usuarios adversarios que comparten un agente o gateway. Si necesitas operación con confianza mixta o
  usuarios adversarios, separa los límites de confianza (gateway +
  credenciales separados, idealmente usuarios del SO o hosts separados).
</Warning>

## Primero el alcance: modelo de seguridad de asistente personal

La guía de seguridad de OpenClaw presupone un despliegue de **asistente personal**: un límite de operador de confianza, potencialmente muchos agentes.

- Postura de seguridad admitida: un usuario/límite de confianza por gateway (preferiblemente un usuario/host/VPS del SO por límite).
- No es un límite de seguridad admitido: un gateway/agente compartido usado por usuarios mutuamente no confiables o adversarios.
- Si se requiere aislamiento de usuarios adversarios, separa por límite de confianza (gateway + credenciales separados, e idealmente usuarios/hosts del SO separados).
- Si varios usuarios no confiables pueden enviar mensajes a un agente con herramientas habilitadas, trátalos como si compartieran la misma autoridad de herramientas delegada para ese agente.

Esta página explica el endurecimiento **dentro de ese modelo**. No afirma aislamiento multiinquilino hostil en un gateway compartido.

## Comprobación rápida: `openclaw security audit`

Véase también: [Verificación formal (modelos de seguridad)](/es/security/formal-verification)

Ejecuta esto regularmente (especialmente después de cambiar la configuración o exponer superficies de red):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` se mantiene deliberadamente acotado: cambia políticas de grupo abiertas comunes
a listas de permitidos, restaura `logging.redactSensitive: "tools"`, restringe
permisos de estado/configuración/archivos incluidos y usa restablecimientos de ACL de Windows en lugar de
`chmod` POSIX cuando se ejecuta en Windows.

Marca problemas comunes (exposición de autenticación de Gateway, exposición de control del navegador, listas de permitidos elevadas, permisos del sistema de archivos, aprobaciones de ejecución permisivas y exposición de herramientas en canales abiertos).

OpenClaw es tanto un producto como un experimento: estás conectando comportamiento de modelos frontera con superficies reales de mensajería y herramientas reales. **No existe una configuración “perfectamente segura”.** El objetivo es actuar deliberadamente sobre:

- quién puede hablar con tu bot
- dónde se permite actuar al bot
- qué puede tocar el bot

Empieza con el acceso más pequeño que siga funcionando y luego amplíalo a medida que ganes confianza.

### Confianza en el despliegue y el host

OpenClaw presupone que el límite de host y configuración es de confianza:

- Si alguien puede modificar el estado/configuración del host Gateway (`~/.openclaw`, incluido `openclaw.json`), trátalo como un operador de confianza.
- Ejecutar un Gateway para múltiples operadores mutuamente no confiables/adversarios **no es una configuración recomendada**.
- Para equipos con confianza mixta, separa los límites de confianza con gateways separados (o, como mínimo, usuarios/hosts del SO separados).
- Valor predeterminado recomendado: un usuario por máquina/host (o VPS), un gateway para ese usuario y uno o más agentes en ese gateway.
- Dentro de una instancia de Gateway, el acceso de operador autenticado es un rol de plano de control de confianza, no un rol de inquilino por usuario.
- Los identificadores de sesión (`sessionKey`, ID de sesión, etiquetas) son selectores de enrutamiento, no tokens de autorización.
- Si varias personas pueden enviar mensajes a un agente con herramientas habilitadas, cada una puede dirigir ese mismo conjunto de permisos. El aislamiento de sesión/memoria por usuario ayuda a la privacidad, pero no convierte un agente compartido en autorización de host por usuario.

### Espacio de trabajo compartido de Slack: riesgo real

Si "todos en Slack pueden enviar mensajes al bot", el riesgo central es la autoridad de herramientas delegada:

- cualquier remitente permitido puede inducir llamadas a herramientas (`exec`, navegador, herramientas de red/archivos) dentro de la política del agente;
- la inyección de prompt/contenido de un remitente puede causar acciones que afecten al estado, dispositivos o salidas compartidos;
- si un agente compartido tiene credenciales/archivos sensibles, cualquier remitente permitido puede potencialmente impulsar la exfiltración mediante el uso de herramientas.

Usa agentes/gateways separados con herramientas mínimas para flujos de trabajo de equipo; mantén privados los agentes con datos personales.

### Agente compartido por la empresa: patrón aceptable

Esto es aceptable cuando todos los que usan ese agente están en el mismo límite de confianza (por ejemplo, un equipo de la empresa) y el agente está estrictamente acotado al negocio.

- ejecútalo en una máquina/VM/contenedor dedicado;
- usa un usuario del SO dedicado + navegador/perfil/cuentas dedicados para ese runtime;
- no inicies sesión en ese runtime con cuentas personales de Apple/Google ni perfiles personales de gestor de contraseñas/navegador.

Si mezclas identidades personales y de empresa en el mismo runtime, colapsas la separación y aumentas el riesgo de exposición de datos personales.

## Concepto de confianza de Gateway y Node

Trata Gateway y Node como un solo dominio de confianza de operador, con roles distintos:

- **Gateway** es el plano de control y la superficie de política (`gateway.auth`, política de herramientas, enrutamiento).
- **Node** es la superficie de ejecución remota emparejada con ese Gateway (comandos, acciones de dispositivo, capacidades locales del host).
- Un llamador autenticado ante el Gateway es de confianza en el alcance de Gateway. Después del emparejamiento, las acciones de Node son acciones de operador de confianza en ese Node.
- Los clientes backend de local loopback directos autenticados con el token/contraseña compartidos de gateway
  pueden hacer RPC internos de plano de control sin presentar una identidad de dispositivo
  de usuario. Esto no es una omisión del emparejamiento remoto o del navegador: los clientes de red,
  clientes Node, clientes con token de dispositivo e identidades explícitas de dispositivo
  siguen pasando por el emparejamiento y la aplicación de elevación de alcance.
- `sessionKey` es selección de enrutamiento/contexto, no autenticación por usuario.
- Las aprobaciones de ejecución (lista de permitidos + pregunta) son protecciones para la intención del operador, no aislamiento multiinquilino hostil.
- El valor predeterminado del producto OpenClaw para configuraciones de operador único de confianza es que la ejecución en host en `gateway`/`node` esté permitida sin solicitudes de aprobación (`security="full"`, `ask="off"` salvo que lo restrinjas). Ese valor predeterminado es UX intencional, no una vulnerabilidad por sí mismo.
- Las aprobaciones de ejecución vinculan el contexto exacto de la solicitud y operandos de archivos locales directos de mejor esfuerzo; no modelan semánticamente cada ruta de carga de runtime/intérprete. Usa sandboxing y aislamiento de host para límites fuertes.

Si necesitas aislamiento de usuario hostil, separa los límites de confianza por usuario/host del SO y ejecuta gateways separados.

## Matriz de límites de confianza

Usa esto como modelo rápido al triajar riesgos:

| Límite o control                                          | Qué significa                                     | Lectura errónea común                                                          |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth` (token/contraseña/proxy de confianza/autenticación de dispositivo) | Autentica llamadores ante las API de gateway      | "Necesita firmas por mensaje en cada frame para ser seguro"                   |
| `sessionKey`                                              | Clave de enrutamiento para selección de contexto/sesión | "La clave de sesión es un límite de autenticación de usuario"                 |
| Protecciones de prompt/contenido                          | Reducen el riesgo de abuso del modelo             | "La inyección de prompt por sí sola prueba una omisión de autenticación"      |
| `canvas.eval` / evaluación en navegador                   | Capacidad intencional del operador cuando está habilitada | "Cualquier primitiva de JS eval es automáticamente una vulnerabilidad en este modelo de confianza" |
| Shell `!` de TUI local                                    | Ejecución local explícitamente activada por el operador | "El comando de conveniencia de shell local es inyección remota"               |
| Emparejamiento de Node y comandos de Node                 | Ejecución remota de nivel operador en dispositivos emparejados | "El control de dispositivo remoto debería tratarse como acceso de usuario no confiable por defecto" |
| `gateway.nodes.pairing.autoApproveCidrs`                  | Política opcional de inscripción de Node en red de confianza | "Una lista de permitidos deshabilitada por defecto es una vulnerabilidad automática de emparejamiento" |

## No son vulnerabilidades por diseño

<Accordion title="Hallazgos comunes fuera de alcance">

Estos patrones se reportan con frecuencia y normalmente se cierran sin acción salvo que
se demuestre una omisión real de límite:

- Cadenas solo de inyección de prompt sin omisión de política, autenticación o sandbox.
- Afirmaciones que presuponen operación multiinquilino hostil en un host o
  configuración compartidos.
- Afirmaciones que clasifican el acceso normal de lectura del operador (por ejemplo
  `sessions.list` / `sessions.preview` / `chat.history`) como IDOR en una
  configuración de gateway compartido.
- Hallazgos de despliegue solo en localhost (por ejemplo HSTS en un gateway solo de loopback).
- Hallazgos de firma de Webhook entrante de Discord para rutas entrantes que no
  existen en este repo.
- Informes que tratan los metadatos de emparejamiento de Node como una segunda capa oculta de
  aprobación por comando para `system.run`, cuando el límite real de ejecución sigue siendo
  la política global de comandos de Node del gateway más las propias aprobaciones de ejecución
  de Node.
- Informes que tratan `gateway.nodes.pairing.autoApproveCidrs` configurado como una
  vulnerabilidad por sí mismo. Esta opción está deshabilitada por defecto, requiere
  entradas CIDR/IP explícitas, solo se aplica al primer emparejamiento con `role: node`
  sin alcances solicitados y no autoaprueba operador/navegador/Control UI,
  WebChat, elevaciones de rol, elevaciones de alcance, cambios de metadatos, cambios de clave pública,
  ni rutas de encabezado de proxy de confianza en local loopback del mismo host salvo que la autenticación de proxy de confianza de loopback se haya habilitado explícitamente.
- Hallazgos de "falta de autorización por usuario" que tratan `sessionKey` como un
  token de autenticación.

</Accordion>

## Línea base endurecida en 60 segundos

Usa primero esta línea base y luego vuelve a habilitar selectivamente herramientas por agente de confianza:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

Esto mantiene el Gateway solo local, aísla los DM y deshabilita las herramientas de plano de control/runtime por defecto.

## Regla rápida para bandeja de entrada compartida

Si más de una persona puede enviar DM a tu bot:

- Establece `session.dmScope: "per-channel-peer"` (o `"per-account-channel-peer"` para canales con varias cuentas).
- Mantén `dmPolicy: "pairing"` o listas de permitidos estrictas.
- Nunca combines DM compartidos con acceso amplio a herramientas.
- Esto endurece las bandejas de entrada cooperativas/compartidas, pero no está diseñado como aislamiento hostil entre coinquilinos cuando los usuarios comparten acceso de escritura al host/configuración.

## Modelo de visibilidad de contexto

OpenClaw separa dos conceptos:

- **Autorización de activación**: quién puede activar el agente (`dmPolicy`, `groupPolicy`, listas de permitidos, puertas de mención).
- **Visibilidad de contexto**: qué contexto suplementario se inyecta en la entrada del modelo (cuerpo de respuesta, texto citado, historial del hilo, metadatos reenviados).

Las listas de permitidos controlan activaciones y autorización de comandos. La opción `contextVisibility` controla cómo se filtra el contexto suplementario (respuestas citadas, raíces de hilo, historial obtenido):

- `contextVisibility: "all"` (predeterminado) mantiene el contexto suplementario tal como se recibió.
- `contextVisibility: "allowlist"` filtra el contexto suplementario a remitentes permitidos por las comprobaciones activas de lista de permitidos.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, pero sigue conservando una respuesta citada explícita.

Configura `contextVisibility` por canal o por sala/conversación. Consulta [Chats de grupo](/es/channels/groups#context-visibility-and-allowlists) para obtener detalles de configuración.

Guía de triaje de avisos:

- Las afirmaciones que solo muestran que "el modelo puede ver texto citado o histórico de remitentes no incluidos en la lista de permitidos" son hallazgos de refuerzo abordables con `contextVisibility`, no omisiones de límites de autenticación o sandbox por sí mismas.
- Para tener impacto de seguridad, los informes aún necesitan demostrar una omisión de límite de confianza (autenticación, política, sandbox, aprobación u otro límite documentado).

## Qué comprueba la auditoría (alto nivel)

- **Acceso entrante** (políticas de DM, políticas de grupos, listas de permitidos): ¿pueden desconocidos activar el bot?
- **Radio de impacto de las herramientas** (herramientas elevadas + salas abiertas): ¿podría una inyección de prompt convertirse en acciones de shell/archivos/red?
- **Deriva de aprobación de ejecución** (`security=full`, `autoAllowSkills`, listas de permitidos de intérpretes sin `strictInlineEval`): ¿las barreras de ejecución en el host siguen haciendo lo que crees que hacen?
  - `security="full"` es una advertencia amplia de postura, no prueba de un error. Es el valor predeterminado elegido para configuraciones de asistentes personales de confianza; ajústalo solo cuando tu modelo de amenazas necesite barreras de aprobación o lista de permitidos.
- **Exposición de red** (enlace/autenticación de Gateway, Tailscale Serve/Funnel, tokens de autenticación débiles/cortos).
- **Exposición de control del navegador** (nodos remotos, puertos de retransmisión, endpoints CDP remotos).
- **Higiene del disco local** (permisos, enlaces simbólicos, includes de configuración, rutas de “carpeta sincronizada”).
- **Plugins** (los plugins se cargan sin una lista de permitidos explícita).
- **Deriva/mala configuración de políticas** (ajustes de Docker de sandbox configurados pero modo sandbox desactivado; patrones `gateway.nodes.denyCommands` ineficaces porque la coincidencia es solo por nombre exacto de comando (por ejemplo, `system.run`) y no inspecciona el texto del shell; entradas peligrosas de `gateway.nodes.allowCommands`; `tools.profile="minimal"` global sobrescrito por perfiles por agente; herramientas propiedad de plugins accesibles bajo una política de herramientas permisiva).
- **Deriva de expectativas en tiempo de ejecución** (por ejemplo, asumir que la ejecución implícita aún significa `sandbox` cuando `tools.exec.host` ahora tiene `auto` como valor predeterminado, o establecer explícitamente `tools.exec.host="sandbox"` mientras el modo sandbox está desactivado).
- **Higiene del modelo** (advierte cuando los modelos configurados parecen heredados; no es un bloqueo estricto).

Si ejecutas `--deep`, OpenClaw también intenta un sondeo en vivo de Gateway con el mejor esfuerzo.

## Mapa de almacenamiento de credenciales

Úsalo al auditar accesos o decidir qué respaldar:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token de bot de Telegram**: config/env o `channels.telegram.tokenFile` (solo archivo regular; enlaces simbólicos rechazados)
- **Token de bot de Discord**: config/env o SecretRef (proveedores env/file/exec)
- **Tokens de Slack**: config/env (`channels.slack.*`)
- **Listas de permitidos de emparejamiento**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (cuenta predeterminada)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (cuentas no predeterminadas)
- **Perfiles de autenticación de modelos**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Estado en tiempo de ejecución de Codex**: `~/.openclaw/agents/<agentId>/agent/codex-home/`
- **Carga de secretos respaldada por archivo (opcional)**: `~/.openclaw/secrets.json`
- **Importación OAuth heredada**: `~/.openclaw/credentials/oauth.json`

## Lista de comprobación de auditoría de seguridad

Cuando la auditoría imprime hallazgos, trata esto como un orden de prioridad:

1. **Cualquier cosa “abierta” + herramientas habilitadas**: bloquea primero DM/grupos (emparejamiento/listas de permitidos) y luego endurece la política de herramientas/sandboxing.
2. **Exposición pública de red** (enlace LAN, Funnel, falta de autenticación): corrígela de inmediato.
3. **Exposición remota de control del navegador**: trátala como acceso de operador (solo tailnet, empareja nodos deliberadamente, evita la exposición pública).
4. **Permisos**: asegúrate de que estado/configuración/credenciales/autenticación no sean legibles por grupo o por todos.
5. **Plugins**: carga solo lo que confías explícitamente.
6. **Elección de modelo**: prefiere modelos modernos y reforzados para seguir instrucciones para cualquier bot con herramientas.

## Glosario de auditoría de seguridad

Cada hallazgo de auditoría se identifica mediante un `checkId` estructurado (por ejemplo,
`gateway.bind_no_auth` o `tools.exec.security_full_configured`). Clases comunes
de gravedad crítica:

- `fs.*` — permisos del sistema de archivos sobre estado, configuración, credenciales y perfiles de autenticación.
- `gateway.*` — modo de enlace, autenticación, Tailscale, UI de Control, configuración de proxy de confianza.
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` — refuerzo por superficie.
- `plugins.*`, `skills.*` — hallazgos de cadena de suministro y escaneo de plugins/skills.
- `security.exposure.*` — comprobaciones transversales donde la política de acceso se cruza con el radio de impacto de herramientas.

Consulta el catálogo completo con niveles de gravedad, claves de corrección y soporte de autocorrección en
[Comprobaciones de auditoría de seguridad](/es/gateway/security/audit-checks).

## UI de Control sobre HTTP

La UI de Control necesita un **contexto seguro** (HTTPS o localhost) para generar identidad
de dispositivo. `gateway.controlUi.allowInsecureAuth` es un interruptor local de compatibilidad:

- En localhost, permite la autenticación de la UI de Control sin identidad de dispositivo cuando la página
  se carga sobre HTTP no seguro.
- No omite las comprobaciones de emparejamiento.
- No relaja los requisitos de identidad de dispositivo remoto (no localhost).

Prefiere HTTPS (Tailscale Serve) o abre la UI en `127.0.0.1`.

Solo para escenarios de emergencia, `gateway.controlUi.dangerouslyDisableDeviceAuth`
desactiva por completo las comprobaciones de identidad de dispositivo. Esto es una degradación de seguridad grave;
mantenlo desactivado salvo que estés depurando activamente y puedas revertirlo rápido.

Separado de esas marcas peligrosas, un `gateway.auth.mode: "trusted-proxy"` correcto
puede admitir sesiones de UI de Control de **operador** sin identidad de dispositivo. Ese es un
comportamiento intencional del modo de autenticación, no un atajo de `allowInsecureAuth`, y aún
no se extiende a sesiones de UI de Control con rol de nodo.

`openclaw security audit` advierte cuando este ajuste está habilitado.

## Resumen de marcas inseguras o peligrosas

`openclaw security audit` genera `config.insecure_or_dangerous_flags` cuando
interruptores de depuración inseguros/peligrosos conocidos están habilitados. Mantenlos sin definir en
producción.

<AccordionGroup>
  <Accordion title="Marcas rastreadas por la auditoría hoy">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="Todas las claves `dangerous*` / `dangerously*` en el esquema de configuración">
    UI de Control y navegador:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    Coincidencia de nombres de canales (canales incluidos y de plugins; también disponible por
    `accounts.<accountId>` cuando corresponda):

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching` (canal de plugin)
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (canal de plugin)
    - `channels.zalouser.dangerouslyAllowNameMatching` (canal de plugin)
    - `channels.irc.dangerouslyAllowNameMatching` (canal de plugin)
    - `channels.mattermost.dangerouslyAllowNameMatching` (canal de plugin)

    Exposición de red:

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork` (también por cuenta)

    Sandbox Docker (valores predeterminados + por agente):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## Configuración de proxy inverso

Si ejecutas el Gateway detrás de un proxy inverso (nginx, Caddy, Traefik, etc.), configura
`gateway.trustedProxies` para gestionar correctamente la IP de cliente reenviada.

Cuando el Gateway detecta encabezados de proxy desde una dirección que **no** está en `trustedProxies`, **no** tratará las conexiones como clientes locales. Si la autenticación de Gateway está deshabilitada, esas conexiones se rechazan. Esto evita una omisión de autenticación donde las conexiones con proxy de otro modo parecerían venir de localhost y recibir confianza automática.

`gateway.trustedProxies` también alimenta `gateway.auth.mode: "trusted-proxy"`, pero ese modo de autenticación es más estricto:

- la autenticación trusted-proxy **falla cerrada con proxies de origen loopback por defecto**
- los proxies inversos loopback del mismo host pueden usar `gateway.trustedProxies` para detección de cliente local y gestión de IP reenviada
- los proxies inversos loopback del mismo host pueden satisfacer `gateway.auth.mode: "trusted-proxy"` solo cuando `gateway.auth.trustedProxy.allowLoopback = true`; de lo contrario, usa autenticación por token/contraseña

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # reverse proxy IP
  # Optional. Default false.
  # Only enable if your proxy cannot provide X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

Cuando `trustedProxies` está configurado, el Gateway usa `X-Forwarded-For` para determinar la IP del cliente. `X-Real-IP` se ignora por defecto salvo que `gateway.allowRealIpFallback: true` se establezca explícitamente.

Los encabezados de proxy de confianza no hacen que el emparejamiento de dispositivos de nodo sea automáticamente de confianza.
`gateway.nodes.pairing.autoApproveCidrs` es una política de operador separada, deshabilitada por defecto.
Incluso cuando está habilitada, las rutas de encabezados trusted-proxy de origen loopback
se excluyen de la aprobación automática de nodos porque los llamadores locales pueden falsificar esos
encabezados, incluso cuando la autenticación trusted-proxy loopback está habilitada explícitamente.

Buen comportamiento de proxy inverso (sobrescribir encabezados de reenvío entrantes):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

Mal comportamiento de proxy inverso (anexar/preservar encabezados de reenvío no confiables):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## Notas de HSTS y origen

- OpenClaw gateway prioriza local/loopback. Si terminas TLS en un proxy inverso, configura HSTS allí en el dominio HTTPS que mira al proxy.
- Si el gateway termina HTTPS por sí mismo, puedes establecer `gateway.http.securityHeaders.strictTransportSecurity` para emitir el encabezado HSTS desde las respuestas de OpenClaw.
- La guía detallada de despliegue está en [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth#tls-termination-and-hsts).
- Para despliegues de UI de Control no loopback, `gateway.controlUi.allowedOrigins` es obligatorio por defecto.
- `gateway.controlUi.allowedOrigins: ["*"]` es una política explícita de permitir todos los orígenes de navegador, no un valor predeterminado reforzado. Evítala fuera de pruebas locales muy controladas.
- Los fallos de autenticación de origen de navegador en loopback aún tienen limitación de tasa incluso cuando la
  exención general de loopback está habilitada, pero la clave de bloqueo se limita por cada
  valor `Origin` normalizado en lugar de un único bucket localhost compartido.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita el modo de respaldo de origen por encabezado Host; trátalo como una política peligrosa seleccionada por el operador.
- Trata el DNS rebinding y el comportamiento de encabezados de host de proxy como preocupaciones de refuerzo de despliegue; mantén `trustedProxies` ajustado y evita exponer el gateway directamente a internet público.

## Los registros de sesión locales viven en el disco

OpenClaw almacena transcripciones de sesión en disco bajo `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
Esto es necesario para la continuidad de sesión y (opcionalmente) para la indexación de memoria de sesión, pero también significa que
**cualquier proceso/usuario con acceso al sistema de archivos puede leer esos registros**. Trata el acceso al disco como el
límite de confianza y bloquea los permisos en `~/.openclaw` (consulta la sección de auditoría a continuación). Si necesitas
un aislamiento más fuerte entre agentes, ejecútalos bajo usuarios de SO separados o hosts separados.

## Ejecución de Node (`system.run`)

Si un nodo macOS está emparejado, el Gateway puede invocar `system.run` en ese nodo. Esto es **ejecución remota de código** en el Mac:

- Requiere emparejamiento de nodo (aprobación + token).
- El emparejamiento de nodo del Gateway no es una superficie de aprobación por comando. Establece la identidad/confianza del nodo y la emisión de tokens.
- El Gateway aplica una política global amplia de comandos de nodo mediante `gateway.nodes.allowCommands` / `denyCommands`.
- Se controla en el Mac mediante **Configuración → Aprobaciones de exec** (seguridad + preguntar + lista de permitidos).
- La política `system.run` por nodo es el propio archivo de aprobaciones de exec del nodo (`exec.approvals.node.*`), que puede ser más estricta o más flexible que la política global de ID de comandos del gateway.
- Un nodo que se ejecuta con `security="full"` y `ask="off"` sigue el modelo predeterminado de operador de confianza. Trátalo como comportamiento esperado salvo que tu despliegue requiera explícitamente una postura de aprobación o lista de permitidos más estricta.
- El modo de aprobación vincula el contexto exacto de la solicitud y, cuando es posible, un operando concreto de script/archivo local. Si OpenClaw no puede identificar exactamente un archivo local directo para un comando de intérprete/runtime, se deniega la ejecución respaldada por aprobación en lugar de prometer una cobertura semántica completa.
- Para `host=node`, las ejecuciones respaldadas por aprobación también almacenan un
  `systemRunPlan` preparado canónico; los reenvíos aprobados posteriores reutilizan ese plan almacenado, y la
  validación del gateway rechaza las ediciones del solicitante al contexto de comando/cwd/sesión después de que se
  creara la solicitud de aprobación.
- Si no quieres ejecución remota, configura la seguridad en **deny** y elimina el emparejamiento de nodo para ese Mac.

Esta distinción importa para el triaje:

- Un nodo emparejado que se reconecta anunciando una lista de comandos distinta no es, por sí solo, una vulnerabilidad si la política global del Gateway y las aprobaciones de exec locales del nodo siguen imponiendo el límite real de ejecución.
- Los informes que tratan los metadatos de emparejamiento de nodo como una segunda capa oculta de aprobación por comando suelen ser confusión de política/UX, no una omisión de un límite de seguridad.

## Skills dinámicas (observador / nodos remotos)

OpenClaw puede actualizar la lista de Skills a mitad de sesión:

- **Observador de Skills**: los cambios en `SKILL.md` pueden actualizar la instantánea de Skills en el siguiente turno del agente.
- **Nodos remotos**: conectar un nodo macOS puede hacer que Skills solo para macOS sean elegibles (según el sondeo de binarios).

Trata las carpetas de Skills como **código de confianza** y restringe quién puede modificarlas.

## El modelo de amenazas

Tu asistente de IA puede:

- Ejecutar comandos de shell arbitrarios
- Leer/escribir archivos
- Acceder a servicios de red
- Enviar mensajes a cualquiera (si le das acceso a WhatsApp)

Las personas que te envían mensajes pueden:

- Intentar engañar a tu IA para que haga cosas indebidas
- Usar ingeniería social para acceder a tus datos
- Sondear detalles de infraestructura

## Concepto central: control de acceso antes que inteligencia

La mayoría de los fallos aquí no son exploits sofisticados: son “alguien envió un mensaje al bot y el bot hizo lo que le pidieron”.

Postura de OpenClaw:

- **Identidad primero:** decide quién puede hablar con el bot (emparejamiento por DM / listas de permitidos / “abierto” explícito).
- **Alcance después:** decide dónde se permite actuar al bot (listas de permitidos de grupos + activación por mención, herramientas, sandboxing, permisos de dispositivo).
- **Modelo al final:** asume que el modelo puede manipularse; diseña para que la manipulación tenga un radio de impacto limitado.

## Modelo de autorización de comandos

Los comandos slash y las directivas solo se respetan para **remitentes autorizados**. La autorización se deriva de
listas de permitidos/emparejamiento del canal más `commands.useAccessGroups` (consulta [Configuración](/es/gateway/configuration)
y [Comandos slash](/es/tools/slash-commands)). Si una lista de permitidos de canal está vacía o incluye `"*"`,
los comandos están efectivamente abiertos para ese canal.

`/exec` es una comodidad solo de sesión para operadores autorizados. **No** escribe configuración ni
cambia otras sesiones.

## Riesgo de herramientas del plano de control

Dos herramientas integradas pueden hacer cambios persistentes en el plano de control:

- `gateway` puede inspeccionar la configuración con `config.schema.lookup` / `config.get`, y puede hacer cambios persistentes con `config.apply`, `config.patch` y `update.run`.
- `cron` puede crear tareas programadas que siguen ejecutándose después de que termine el chat/tarea original.

La herramienta runtime `gateway` solo para el propietario aún se niega a reescribir
`tools.exec.ask` o `tools.exec.security`; los alias heredados `tools.bash.*` se
normalizan a las mismas rutas de exec protegidas antes de la escritura.
Las ediciones impulsadas por agente con `gateway config.apply` y `gateway config.patch`
fallan de forma cerrada de manera predeterminada: solo un conjunto reducido de rutas de
prompt, modelo y activación por mención es ajustable por el agente. Por lo tanto, los nuevos
árboles de configuración sensibles están protegidos salvo que se agreguen deliberadamente a la lista de permitidos.

Para cualquier agente/superficie que maneje contenido no confiable, deniega estos de forma predeterminada:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` solo bloquea acciones de reinicio. No deshabilita acciones de configuración/actualización de `gateway`.

## Plugins

Los plugins se ejecutan **en proceso** con el Gateway. Trátalos como código de confianza:

- Instala plugins solo desde fuentes en las que confíes.
- Prefiere listas de permitidos `plugins.allow` explícitas.
- Revisa la configuración del plugin antes de habilitarlo.
- Reinicia el Gateway después de cambios en plugins.
- Si instalas o actualizas plugins (`openclaw plugins install <package>`, `openclaw plugins update <id>`), trátalo como ejecutar código no confiable:
  - La ruta de instalación es el directorio por plugin bajo la raíz activa de instalación de plugins.
  - OpenClaw ejecuta un escaneo integrado de código peligroso antes de instalar/actualizar. Los hallazgos `critical` bloquean de forma predeterminada.
  - Las instalaciones de plugins mediante npm y git ejecutan la convergencia de dependencias del gestor de paquetes solo durante el flujo explícito de instalación/actualización. Las rutas locales y los archivos comprimidos se tratan como paquetes de plugin autocontenidos; OpenClaw los copia/referencia sin ejecutar `npm install`.
  - Prefiere versiones fijadas y exactas (`@scope/pkg@1.2.3`), e inspecciona el código desempaquetado en disco antes de habilitarlo.
  - `--dangerously-force-unsafe-install` es solo una medida de emergencia para falsos positivos del escaneo integrado en flujos de instalación/actualización de plugins. No omite bloqueos de política del hook `before_install` del plugin ni omite fallos de escaneo.
  - Las instalaciones de dependencias de Skills respaldadas por Gateway siguen la misma división peligroso/sospechoso: los hallazgos integrados `critical` bloquean salvo que el llamador establezca explícitamente `dangerouslyForceUnsafeInstall`, mientras que los hallazgos sospechosos siguen solo advirtiendo. `openclaw skills install` sigue siendo el flujo separado de descarga/instalación de Skills de ClawHub.

Detalles: [Plugins](/es/tools/plugin)

## Modelo de acceso por DM: emparejamiento, lista de permitidos, abierto, deshabilitado

Todos los canales actuales con capacidad de DM admiten una política de DM (`dmPolicy` o `*.dm.policy`) que filtra los DM entrantes **antes** de procesar el mensaje:

- `pairing` (predeterminado): los remitentes desconocidos reciben un código corto de emparejamiento y el bot ignora su mensaje hasta que se apruebe. Los códigos caducan después de 1 hora; los DM repetidos no reenviarán un código hasta que se cree una nueva solicitud. Las solicitudes pendientes tienen un límite predeterminado de **3 por canal**.
- `allowlist`: los remitentes desconocidos se bloquean (sin saludo de emparejamiento).
- `open`: permite que cualquiera envíe DM (público). **Requiere** que la lista de permitidos del canal incluya `"*"` (activación explícita).
- `disabled`: ignora por completo los DM entrantes.

Aprueba mediante CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Detalles + archivos en disco: [Emparejamiento](/es/channels/pairing)

## Aislamiento de sesiones de DM (modo multiusuario)

De forma predeterminada, OpenClaw enruta **todos los DM a la sesión principal** para que tu asistente tenga continuidad entre dispositivos y canales. Si **varias personas** pueden enviar DM al bot (DM abiertos o una lista de permitidos con varias personas), considera aislar las sesiones de DM:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

Esto evita fugas de contexto entre usuarios mientras mantiene aislados los chats grupales.

Este es un límite de contexto de mensajería, no un límite de administrador del host. Si los usuarios son adversarios entre sí y comparten el mismo host/configuración de Gateway, ejecuta gateways separados por límite de confianza.

### Modo DM seguro (recomendado)

Trata el fragmento anterior como **modo DM seguro**:

- Predeterminado: `session.dmScope: "main"` (todos los DM comparten una sesión para continuidad).
- Predeterminado del onboarding de CLI local: escribe `session.dmScope: "per-channel-peer"` cuando no está definido (mantiene los valores explícitos existentes).
- Modo DM seguro: `session.dmScope: "per-channel-peer"` (cada par canal+remitente obtiene un contexto de DM aislado).
- Aislamiento de pares entre canales: `session.dmScope: "per-peer"` (cada remitente obtiene una sesión en todos los canales del mismo tipo).

Si ejecutas varias cuentas en el mismo canal, usa `per-account-channel-peer` en su lugar. Si la misma persona te contacta en varios canales, usa `session.identityLinks` para colapsar esas sesiones de DM en una identidad canónica. Consulta [Gestión de sesiones](/es/concepts/session) y [Configuración](/es/gateway/configuration).

## Listas de permitidos para DM y grupos

OpenClaw tiene dos capas separadas de “¿quién puede activarme?”:

- **Lista de permitidos de DM** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; heredado: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): quién puede hablar con el bot en mensajes directos.
  - Cuando `dmPolicy="pairing"`, las aprobaciones se escriben en el almacén de listas de permitidos de emparejamiento con alcance de cuenta bajo `~/.openclaw/credentials/` (`<channel>-allowFrom.json` para la cuenta predeterminada, `<channel>-<accountId>-allowFrom.json` para cuentas no predeterminadas), fusionadas con las listas de permitidos de configuración.
- **Lista de permitidos de grupos** (específica del canal): de qué grupos/canales/guilds aceptará mensajes el bot en absoluto.
  - Patrones comunes:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: valores predeterminados por grupo como `requireMention`; cuando se establece, también actúa como lista de permitidos de grupos (incluye `"*"` para conservar el comportamiento de permitir todo).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: restringe quién puede activar el bot _dentro_ de una sesión grupal (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: listas de permitidos por superficie + valores predeterminados de mención.
  - Las comprobaciones de grupo se ejecutan en este orden: `groupPolicy`/listas de permitidos de grupos primero, activación por mención/respuesta segundo.
  - Responder a un mensaje del bot (mención implícita) **no** omite listas de permitidos de remitentes como `groupAllowFrom`.
  - **Nota de seguridad:** trata `dmPolicy="open"` y `groupPolicy="open"` como configuraciones de último recurso. Deberían usarse muy poco; prefiere emparejamiento + listas de permitidos salvo que confíes plenamente en todos los miembros de la sala.

Detalles: [Configuración](/es/gateway/configuration) y [Grupos](/es/channels/groups)

## Inyección de prompts (qué es, por qué importa)

La inyección de prompts ocurre cuando un atacante crea un mensaje que manipula el modelo para que haga algo inseguro (“ignora tus instrucciones”, “vuelca tu sistema de archivos”, “sigue este enlace y ejecuta comandos”, etc.).

Incluso con prompts de sistema sólidos, **la inyección de prompts no está resuelta**. Las protecciones del prompt de sistema son solo orientación blanda; la aplicación estricta proviene de la política de herramientas, las aprobaciones de exec, el sandboxing y las listas de permitidos de canales (y los operadores pueden deshabilitarlas por diseño). Lo que ayuda en la práctica:

- Mantén los mensajes directos entrantes bloqueados (emparejamiento/listas de permitidos).
- Prefiere el control por mención en grupos; evita bots “siempre activos” en salas públicas.
- Trata los enlaces, adjuntos e instrucciones pegadas como hostiles por defecto.
- Ejecuta herramientas sensibles en un sandbox; mantén los secretos fuera del sistema de archivos alcanzable por el agente.
- Nota: el aislamiento en sandbox es opcional. Si el modo sandbox está desactivado, `host=auto` implícito se resuelve al host del Gateway. `host=sandbox` explícito sigue fallando de forma cerrada porque no hay ningún runtime de sandbox disponible. Define `host=gateway` si quieres que ese comportamiento sea explícito en la configuración.
- Limita las herramientas de alto riesgo (`exec`, `browser`, `web_fetch`, `web_search`) a agentes de confianza o listas de permitidos explícitas.
- Si incluyes intérpretes en la lista de permitidos (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), habilita `tools.exec.strictInlineEval` para que las formas de evaluación inline sigan requiriendo aprobación explícita.
- El análisis de aprobación de shell también rechaza formas de expansión de parámetros POSIX (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) dentro de **heredocs sin comillas**, de modo que el cuerpo de un heredoc en lista de permitidos no pueda colar expansión de shell como texto plano y pasar la revisión de la lista de permitidos. Pon entre comillas el terminador del heredoc (por ejemplo `<<'EOF'`) para optar por semántica de cuerpo literal; los heredocs sin comillas que habrían expandido variables se rechazan.
- **La elección del modelo importa:** los modelos antiguos/pequeños/legados son significativamente menos robustos frente a inyección de prompts y uso indebido de herramientas. Para agentes con herramientas habilitadas, usa el modelo de última generación más fuerte, reforzado para instrucciones, que esté disponible.

Señales de alerta que debes tratar como no confiables:

- “Lee este archivo/URL y haz exactamente lo que dice.”
- “Ignora tu prompt del sistema o las reglas de seguridad.”
- “Revela tus instrucciones ocultas o salidas de herramientas.”
- “Pega el contenido completo de ~/.openclaw o tus logs.”

## Saneamiento de tokens especiales en contenido externo

OpenClaw elimina literales comunes de tokens especiales de plantillas de chat de LLM autoalojados del contenido externo envuelto y de los metadatos antes de que lleguen al modelo. Las familias de marcadores cubiertas incluyen tokens de rol/turno de Qwen/ChatML, Llama, Gemma, Mistral, Phi y GPT-OSS.

Por qué:

- Los backends compatibles con OpenAI que sirven modelos autoalojados a veces conservan tokens especiales que aparecen en texto de usuario, en lugar de enmascararlos. Un atacante que pueda escribir en contenido externo entrante (una página recuperada, el cuerpo de un correo electrónico, la salida de una herramienta de contenido de archivo) podría inyectar de otro modo un límite sintético de rol `assistant` o `system` y escapar de las barreras del contenido envuelto.
- El saneamiento ocurre en la capa de envoltura de contenido externo, por lo que se aplica de forma uniforme a herramientas de obtención/lectura y al contenido de canales entrantes en lugar de ser por proveedor.
- Las respuestas salientes del modelo ya tienen un saneador separado que elimina `<tool_call>`, `<function_calls>`, `<system-reminder>`, `<previous_response>` filtrados y andamiaje interno similar del runtime de las respuestas visibles para el usuario en el límite final de entrega del canal. El saneador de contenido externo es la contraparte entrante.

Esto no reemplaza los otros refuerzos de esta página: `dmPolicy`, listas de permitidos, aprobaciones de exec, aislamiento en sandbox y `contextVisibility` siguen haciendo el trabajo principal. Cierra una derivación específica de la capa del tokenizador contra pilas autoalojadas que reenvían texto de usuario con tokens especiales intactos.

## Flags de derivación insegura de contenido externo

OpenClaw incluye flags de derivación explícitas que desactivan la envoltura de seguridad de contenido externo:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Campo de payload Cron `allowUnsafeExternalContent`

Guía:

- Mantenlas sin definir/en false en producción.
- Habilítalas solo temporalmente para depuración con alcance muy restringido.
- Si están habilitadas, aísla ese agente (sandbox + herramientas mínimas + espacio de nombres de sesión dedicado).

Nota de riesgo de hooks:

- Los payloads de hooks son contenido no confiable, incluso cuando la entrega proviene de sistemas que controlas (correo/documentos/contenido web pueden contener inyección de prompts).
- Los niveles de modelo débiles aumentan este riesgo. Para automatización impulsada por hooks, prefiere niveles de modelos modernos fuertes y mantén estricta la política de herramientas (`tools.profile: "messaging"` o más estricta), además de aislamiento en sandbox cuando sea posible.

### La inyección de prompts no requiere mensajes directos públicos

Aunque **solo tú** puedas enviar mensajes al bot, la inyección de prompts aún puede ocurrir mediante
cualquier **contenido no confiable** que el bot lea (resultados de búsqueda/obtención web, páginas del navegador,
correos electrónicos, documentos, adjuntos, logs/código pegados). En otras palabras: el remitente no es
la única superficie de amenaza; el **contenido en sí** puede portar instrucciones adversarias.

Cuando las herramientas están habilitadas, el riesgo típico es exfiltrar contexto o activar
llamadas a herramientas. Reduce el radio de impacto mediante:

- Usar un **agente lector** de solo lectura o sin herramientas para resumir contenido no confiable,
  y luego pasar el resumen a tu agente principal.
- Mantener `web_search` / `web_fetch` / `browser` desactivados para agentes con herramientas habilitadas salvo que sean necesarios.
- Para entradas de URL de OpenResponses (`input_file` / `input_image`), define
  `gateway.http.endpoints.responses.files.urlAllowlist` y
  `gateway.http.endpoints.responses.images.urlAllowlist` estrictas, y mantén `maxUrlParts` bajo.
  Las listas de permitidos vacías se tratan como no definidas; usa `files.allowUrl: false` / `images.allowUrl: false`
  si quieres desactivar por completo la obtención de URL.
- Para entradas de archivo de OpenResponses, el texto decodificado de `input_file` se inyecta igualmente como
  **contenido externo no confiable**. No asumas que el texto del archivo es confiable solo porque
  el Gateway lo decodificó localmente. El bloque inyectado sigue llevando marcadores de límite explícitos
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` más metadatos `Source: External`,
  aunque esta ruta omite el banner más largo `SECURITY NOTICE:`.
- La misma envoltura basada en marcadores se aplica cuando la comprensión de medios extrae texto
  de documentos adjuntos antes de anexar ese texto al prompt de medios.
- Habilitar aislamiento en sandbox y listas de permitidos estrictas de herramientas para cualquier agente que toque entradas no confiables.
- Mantener los secretos fuera de los prompts; pásalos mediante env/config en el host del Gateway en su lugar.

### Backends LLM autoalojados

Los backends autoalojados compatibles con OpenAI, como vLLM, SGLang, TGI, LM Studio,
o pilas personalizadas de tokenizadores de Hugging Face, pueden diferir de los proveedores alojados en cómo
se manejan los tokens especiales de plantillas de chat. Si un backend tokeniza cadenas literales
como `<|im_start|>`, `<|start_header_id|>` o `<start_of_turn>` como
tokens estructurales de plantilla de chat dentro del contenido de usuario, el texto no confiable puede intentar
falsificar límites de rol en la capa del tokenizador.

OpenClaw elimina literales comunes de tokens especiales de familias de modelos del contenido
externo envuelto antes de enviarlo al modelo. Mantén habilitada la envoltura de contenido externo
y prefiere configuraciones de backend que separen o escapen tokens especiales
en contenido proporcionado por usuarios cuando estén disponibles. Proveedores alojados como OpenAI
y Anthropic ya aplican su propio saneamiento del lado de la solicitud.

### Fortaleza del modelo (nota de seguridad)

La resistencia a la inyección de prompts **no** es uniforme entre niveles de modelos. Los modelos más pequeños/baratos son por lo general más susceptibles al uso indebido de herramientas y al secuestro de instrucciones, especialmente bajo prompts adversarios.

<Warning>
Para agentes con herramientas habilitadas o agentes que leen contenido no confiable, el riesgo de inyección de prompts con modelos antiguos/pequeños suele ser demasiado alto. No ejecutes esas cargas de trabajo en niveles de modelo débiles.
</Warning>

Recomendaciones:

- **Usa el modelo de última generación y mejor nivel** para cualquier bot que pueda ejecutar herramientas o tocar archivos/redes.
- **No uses niveles antiguos/más débiles/más pequeños** para agentes con herramientas habilitadas o bandejas de entrada no confiables; el riesgo de inyección de prompts es demasiado alto.
- Si debes usar un modelo más pequeño, **reduce el radio de impacto** (herramientas de solo lectura, aislamiento en sandbox fuerte, acceso mínimo al sistema de archivos, listas de permitidos estrictas).
- Al ejecutar modelos pequeños, **habilita aislamiento en sandbox para todas las sesiones** y **desactiva web_search/web_fetch/browser** salvo que las entradas estén estrictamente controladas.
- Para asistentes personales solo de chat con entradas confiables y sin herramientas, los modelos más pequeños suelen estar bien.

## Razonamiento y salida detallada en grupos

`/reasoning`, `/verbose` y `/trace` pueden exponer razonamiento interno, salida de herramientas
o diagnósticos de plugins que
no estaban destinados a un canal público. En entornos grupales, trátalos como **solo depuración**
y mantenlos desactivados salvo que los necesites explícitamente.

Guía:

- Mantén `/reasoning`, `/verbose` y `/trace` desactivados en salas públicas.
- Si los habilitas, hazlo solo en mensajes directos de confianza o salas estrictamente controladas.
- Recuerda: la salida detallada y de trazas puede incluir argumentos de herramientas, URL, diagnósticos de plugins y datos que el modelo vio.

## Ejemplos de refuerzo de configuración

### Permisos de archivos

Mantén config + estado privados en el host del Gateway:

- `~/.openclaw/openclaw.json`: `600` (solo lectura/escritura del usuario)
- `~/.openclaw`: `700` (solo usuario)

`openclaw doctor` puede advertir y ofrecer ajustar estos permisos.

### Exposición de red (bind, puerto, firewall)

El Gateway multiplexa **WebSocket + HTTP** en un solo puerto:

- Predeterminado: `18789`
- Config/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

Esta superficie HTTP incluye la IU de Control y el host de canvas:

- IU de Control (assets SPA) (ruta base predeterminada `/`)
- Host de canvas: `/__openclaw__/canvas/` y `/__openclaw__/a2ui/` (HTML/JS arbitrario; trátalo como contenido no confiable)

Si cargas contenido de canvas en un navegador normal, trátalo como cualquier otra página web no confiable:

- No expongas el host de canvas a redes/usuarios no confiables.
- No hagas que el contenido de canvas comparta el mismo origen que superficies web privilegiadas salvo que entiendas completamente las implicaciones.

El modo bind controla dónde escucha el Gateway:

- `gateway.bind: "loopback"` (predeterminado): solo pueden conectarse clientes locales.
- Los binds que no son loopback (`"lan"`, `"tailnet"`, `"custom"`) amplían la superficie de ataque. Úsalos solo con autenticación de gateway (token/contraseña compartidos o un proxy de confianza configurado correctamente) y un firewall real.

Reglas prácticas:

- Prefiere Tailscale Serve frente a binds LAN (Serve mantiene el Gateway en loopback, y Tailscale gestiona el acceso).
- Si debes hacer bind a LAN, limita con firewall el puerto a una lista estricta de IPs de origen permitidas; no lo reenvíes ampliamente.
- Nunca expongas el Gateway sin autenticación en `0.0.0.0`.

### Publicación de puertos Docker con UFW

Si ejecutas OpenClaw con Docker en un VPS, recuerda que los puertos de contenedor publicados
(`-p HOST:CONTAINER` o `ports:` de Compose) se enrutan a través de las cadenas de reenvío
de Docker, no solo mediante reglas `INPUT` del host.

Para mantener el tráfico de Docker alineado con tu política de firewall, aplica reglas en
`DOCKER-USER` (esta cadena se evalúa antes de las propias reglas de aceptación de Docker).
En muchas distros modernas, `iptables`/`ip6tables` usan el frontend `iptables-nft`
y siguen aplicando estas reglas al backend nftables.

Ejemplo mínimo de lista de permitidos (IPv4):

```bash
# /etc/ufw/after.rules (append as its own *filter section)
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

IPv6 tiene tablas separadas. Agrega una política correspondiente en `/etc/ufw/after6.rules` si
Docker IPv6 está habilitado.

Evita codificar de forma fija nombres de interfaces como `eth0` en fragmentos de documentación. Los nombres de interfaces
varían entre imágenes de VPS (`ens3`, `enp*`, etc.) y las discrepancias pueden hacer que se omita accidentalmente
tu regla de denegación.

Validación rápida después de recargar:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

Los puertos externos esperados deberían ser solo los que expones intencionalmente (para la mayoría de
configuraciones: SSH + los puertos de tu proxy inverso).

### Descubrimiento mDNS/Bonjour

El Gateway anuncia su presencia mediante mDNS (`_openclaw-gw._tcp` en el puerto 5353) para el descubrimiento de dispositivos locales. En modo completo, esto incluye registros TXT que pueden exponer detalles operativos:

- `cliPath`: ruta completa del sistema de archivos al binario de la CLI (revela el nombre de usuario y la ubicación de instalación)
- `sshPort`: anuncia la disponibilidad de SSH en el host
- `displayName`, `lanHost`: información del nombre de host

**Consideración de seguridad operativa:** Difundir detalles de infraestructura facilita el reconocimiento para cualquiera en la red local. Incluso información "inofensiva" como rutas del sistema de archivos y disponibilidad de SSH ayuda a los atacantes a mapear tu entorno.

**Recomendaciones:**

1. **Modo mínimo** (predeterminado, recomendado para gateways expuestos): omite los campos confidenciales de las difusiones mDNS:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. **Deshabilítalo por completo** si no necesitas descubrimiento de dispositivos locales:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **Modo completo** (opcional): incluye `cliPath` + `sshPort` en registros TXT:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **Variable de entorno** (alternativa): establece `OPENCLAW_DISABLE_BONJOUR=1` para deshabilitar mDNS sin cambios de configuración.

En modo mínimo, el Gateway sigue difundiendo lo suficiente para el descubrimiento de dispositivos (`role`, `gatewayPort`, `transport`), pero omite `cliPath` y `sshPort`. Las aplicaciones que necesitan información de la ruta de la CLI pueden obtenerla mediante la conexión WebSocket autenticada en su lugar.

### Protege el WebSocket del Gateway (autenticación local)

La autenticación del Gateway es **obligatoria de forma predeterminada**. Si no hay configurada una ruta válida de autenticación del gateway,
el Gateway rechaza las conexiones WebSocket (cierre seguro ante fallos).

La incorporación genera un token de forma predeterminada (incluso para loopback), por lo que
los clientes locales deben autenticarse.

Establece un token para que **todos** los clientes WS deban autenticarse:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor puede generar uno por ti: `openclaw doctor --generate-gateway-token`.

<Note>
`gateway.remote.token` y `gateway.remote.password` son fuentes de credenciales de cliente. Por sí solos, **no** protegen el acceso WS local. Las rutas de llamada locales pueden usar `gateway.remote.*` como respaldo solo cuando `gateway.auth.*` no está definido. Si `gateway.auth.token` o `gateway.auth.password` se configuran explícitamente mediante SecretRef y no se resuelven, la resolución falla de forma cerrada (sin enmascaramiento por respaldo remoto).
</Note>
Opcional: fija TLS remoto con `gateway.remote.tlsFingerprint` al usar `wss://`.
El texto sin cifrar `ws://` es solo para loopback de forma predeterminada. Para rutas de
red privada de confianza, establece `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` en el proceso
cliente como medida de emergencia. Esto es intencionalmente solo una variable de entorno
del proceso, no una clave de configuración de `openclaw.json`.
El emparejamiento móvil y las rutas de gateway manuales o escaneadas de Android son más estrictos:
se acepta texto claro para loopback, pero los nombres de host de LAN privada, link-local, `.local` y
sin punto deben usar TLS salvo que optes explícitamente por la ruta de texto claro de
red privada de confianza.

Emparejamiento de dispositivos locales:

- El emparejamiento de dispositivos se aprueba automáticamente para conexiones directas de local loopback, para que
  los clientes del mismo host funcionen sin fricción.
- OpenClaw también tiene una ruta estrecha de autoconexión local de backend/contenedor para
  flujos auxiliares de secreto compartido de confianza.
- Las conexiones de tailnet y LAN, incluidos los enlaces tailnet del mismo host, se tratan como
  remotas para el emparejamiento y aún necesitan aprobación.
- La evidencia de encabezados reenviados en una solicitud loopback descalifica la
  localidad loopback. La aprobación automática por mejora de metadatos tiene un alcance estrecho. Consulta
  [Emparejamiento del Gateway](/es/gateway/pairing) para ambas reglas.

Modos de autenticación:

- `gateway.auth.mode: "token"`: token portador compartido (recomendado para la mayoría de configuraciones).
- `gateway.auth.mode: "password"`: autenticación por contraseña (prefiere establecerla mediante env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: confía en un proxy inverso consciente de identidad para autenticar usuarios y pasar la identidad mediante encabezados (consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)).

Lista de verificación de rotación (token/contraseña):

1. Genera/establece un nuevo secreto (`gateway.auth.token` o `OPENCLAW_GATEWAY_PASSWORD`).
2. Reinicia el Gateway (o reinicia la aplicación de macOS si supervisa el Gateway).
3. Actualiza cualquier cliente remoto (`gateway.remote.token` / `.password` en máquinas que llaman al Gateway).
4. Verifica que ya no puedes conectarte con las credenciales antiguas.

### Encabezados de identidad de Tailscale Serve

Cuando `gateway.auth.allowTailscale` es `true` (predeterminado para Serve), OpenClaw
acepta encabezados de identidad de Tailscale Serve (`tailscale-user-login`) para la autenticación de Control
UI/WebSocket. OpenClaw verifica la identidad resolviendo la dirección
`x-forwarded-for` mediante el daemon local de Tailscale (`tailscale whois`)
y comparándola con el encabezado. Esto solo se activa para solicitudes que llegan a loopback
e incluyen `x-forwarded-for`, `x-forwarded-proto` y `x-forwarded-host`, tal como los
inyecta Tailscale.
Para esta ruta asíncrona de comprobación de identidad, los intentos fallidos para el mismo `{scope, ip}`
se serializan antes de que el limitador registre el fallo. Por lo tanto, los reintentos erróneos
concurrentes de un cliente Serve pueden bloquear el segundo intento de inmediato
en vez de pasar por carrera como dos discrepancias simples.
Los endpoints de la API HTTP (por ejemplo `/v1/*`, `/tools/invoke` y `/api/channels/*`)
**no** usan autenticación por encabezados de identidad de Tailscale. Siguen usando el modo
de autenticación HTTP configurado del gateway.

Nota importante de límite:

- La autenticación portadora HTTP del Gateway es, en la práctica, acceso de operador de todo o nada.
- Trata las credenciales que pueden llamar a `/v1/chat/completions`, `/v1/responses` o `/api/channels/*` como secretos de operador con acceso completo para ese gateway.
- En la superficie HTTP compatible con OpenAI, la autenticación portadora con secreto compartido restaura todos los alcances de operador predeterminados (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) y la semántica de propietario para turnos de agente; los valores más estrechos de `x-openclaw-scopes` no reducen esa ruta de secreto compartido.
- La semántica de alcance por solicitud en HTTP solo se aplica cuando la solicitud proviene de un modo con identidad, como autenticación de proxy de confianza o `gateway.auth.mode="none"` en una entrada privada.
- En esos modos con identidad, omitir `x-openclaw-scopes` vuelve al conjunto normal de alcances predeterminados de operador; envía el encabezado explícitamente cuando quieras un conjunto de alcances más estrecho.
- `/tools/invoke` sigue la misma regla de secreto compartido: la autenticación portadora con token/contraseña también se trata allí como acceso completo de operador, mientras que los modos con identidad siguen respetando los alcances declarados.
- No compartas estas credenciales con llamadores no confiables; prefiere gateways separados por límite de confianza.

**Supuesto de confianza:** la autenticación Serve sin token supone que el host del gateway es de confianza.
No trates esto como protección contra procesos hostiles en el mismo host. Si puede ejecutarse código
local no confiable en el host del gateway, deshabilita `gateway.auth.allowTailscale`
y exige autenticación explícita con secreto compartido mediante `gateway.auth.mode: "token"` o
`"password"`.

**Regla de seguridad:** no reenvíes estos encabezados desde tu propio proxy inverso. Si
terminas TLS o usas un proxy delante del gateway, deshabilita
`gateway.auth.allowTailscale` y usa autenticación con secreto compartido (`gateway.auth.mode:
"token"` o `"password"`) o [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth)
en su lugar.

Proxies de confianza:

- Si terminas TLS delante del Gateway, establece `gateway.trustedProxies` en las IP de tu proxy.
- OpenClaw confiará en `x-forwarded-for` (o `x-real-ip`) desde esas IP para determinar la IP del cliente en comprobaciones de emparejamiento local y autenticación HTTP/comprobaciones locales.
- Asegúrate de que tu proxy **sobrescriba** `x-forwarded-for` y bloquee el acceso directo al puerto del Gateway.

Consulta [Tailscale](/es/gateway/tailscale) y [Resumen web](/es/web).

### Control del navegador mediante host Node (recomendado)

Si tu Gateway es remoto pero el navegador se ejecuta en otra máquina, ejecuta un **host Node**
en la máquina del navegador y deja que el Gateway proxifique las acciones del navegador (consulta [Herramienta de navegador](/es/tools/browser)).
Trata el emparejamiento de Node como acceso de administrador.

Patrón recomendado:

- Mantén el Gateway y el host Node en la misma tailnet (Tailscale).
- Empareja el Node intencionalmente; deshabilita el enrutamiento del proxy del navegador si no lo necesitas.

Evita:

- Exponer puertos de retransmisión/control por LAN o Internet público.
- Tailscale Funnel para endpoints de control del navegador (exposición pública).

### Secretos en disco

Asume que cualquier cosa bajo `~/.openclaw/` (o `$OPENCLAW_STATE_DIR/`) puede contener secretos o datos privados:

- `openclaw.json`: la configuración puede incluir tokens (gateway, gateway remoto), ajustes de proveedor y listas de permisos.
- `credentials/**`: credenciales de canal (ejemplo: credenciales de WhatsApp), listas de permisos de emparejamiento, importaciones OAuth heredadas.
- `agents/<agentId>/agent/auth-profiles.json`: claves de API, perfiles de token, tokens OAuth y `keyRef`/`tokenRef` opcionales.
- `agents/<agentId>/agent/codex-home/**`: cuenta de servidor de aplicación Codex por agente, configuración, Skills, plugins, estado nativo de hilos y diagnósticos.
- `secrets.json` (opcional): carga útil de secretos respaldada por archivo usada por proveedores SecretRef `file` (`secrets.providers`).
- `agents/<agentId>/agent/auth.json`: archivo de compatibilidad heredado. Las entradas estáticas `api_key` se depuran cuando se descubren.
- `agents/<agentId>/sessions/**`: transcripciones de sesión (`*.jsonl`) + metadatos de enrutamiento (`sessions.json`) que pueden contener mensajes privados y salida de herramientas.
- paquetes de plugins incluidos: plugins instalados (más sus `node_modules/`).
- `sandboxes/**`: espacios de trabajo de sandbox de herramientas; pueden acumular copias de archivos que lees/escribes dentro del sandbox.

Consejos de endurecimiento:

- Mantén permisos estrictos (`700` en directorios, `600` en archivos).
- Usa cifrado de disco completo en el host del gateway.
- Prefiere una cuenta de usuario del sistema operativo dedicada para el Gateway si el host es compartido.

### Archivos `.env` del espacio de trabajo

OpenClaw carga archivos `.env` locales del espacio de trabajo para agentes y herramientas, pero nunca permite que esos archivos sobrescriban silenciosamente los controles de runtime del gateway.

- Cualquier clave que empiece con `OPENCLAW_*` se bloquea en archivos `.env` de espacios de trabajo no confiables.
- Los ajustes de endpoint de canal para Matrix, Mattermost, IRC y Synology Chat también se bloquean frente a sobrescrituras desde `.env` del espacio de trabajo, para que los espacios de trabajo clonados no puedan redirigir el tráfico de conectores incluidos mediante configuración de endpoint local. Las claves env de endpoint (como `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) deben venir del entorno del proceso del gateway o de `env.shellEnv`, no de un `.env` cargado desde el espacio de trabajo.
- El bloqueo falla de forma cerrada: una nueva variable de control de runtime añadida en una versión futura no puede heredarse de un `.env` registrado o proporcionado por un atacante; la clave se ignora y el gateway conserva su propio valor.
- Las variables de entorno de proceso/sistema operativo de confianza (el propio shell del gateway, unidad launchd/systemd, paquete de aplicación) siguen aplicándose; esto solo restringe la carga de archivos `.env`.

Motivo: los archivos `.env` del espacio de trabajo suelen estar junto al código del agente, se confirman por accidente o los escriben herramientas. Bloquear todo el prefijo `OPENCLAW_*` significa que añadir una nueva marca `OPENCLAW_*` más adelante nunca puede convertirse en una regresión por herencia silenciosa desde el estado del espacio de trabajo.

### Registros y transcripciones (redacción y retención)

Los registros y las transcripciones pueden filtrar información sensible incluso cuando los controles de acceso son correctos:

- Los registros del Gateway pueden incluir resúmenes de herramientas, errores y URLs.
- Las transcripciones de sesión pueden incluir secretos pegados, contenido de archivos, salida de comandos y enlaces.

Recomendaciones:

- Mantén activada la redacción de registros y transcripciones (`logging.redactSensitive: "tools"`; predeterminado).
- Añade patrones personalizados para tu entorno mediante `logging.redactPatterns` (tokens, nombres de host, URLs internas).
- Al compartir diagnósticos, prefiere `openclaw status --all` (apto para pegar, secretos redactados) en lugar de registros sin procesar.
- Purga transcripciones de sesión y archivos de registro antiguos si no necesitas una retención prolongada.

Detalles: [Registro](/es/gateway/logging)

### MD: emparejamiento de forma predeterminada

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### Grupos: exigir mención en todas partes

```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "groupChat": { "mentionPatterns": ["@openclaw", "@mybot"] }
      }
    ]
  }
}
```

En chats grupales, responde solo cuando se te mencione explícitamente.

### Números separados (WhatsApp, Signal, Telegram)

Para los canales basados en números de teléfono, considera ejecutar tu IA en un número de teléfono separado del personal:

- Número personal: tus conversaciones permanecen privadas
- Número del bot: la IA gestiona estas conversaciones, con límites adecuados

### Modo de solo lectura (mediante sandbox y herramientas)

Puedes crear un perfil de solo lectura combinando:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (o `"none"` para no tener acceso al espacio de trabajo)
- listas de herramientas permitidas/denegadas que bloqueen `write`, `edit`, `apply_patch`, `exec`, `process`, etc.

Opciones adicionales de endurecimiento:

- `tools.exec.applyPatch.workspaceOnly: true` (predeterminado): garantiza que `apply_patch` no pueda escribir/eliminar fuera del directorio del espacio de trabajo incluso cuando el aislamiento esté desactivado. Establécelo en `false` solo si quieres intencionalmente que `apply_patch` toque archivos fuera del espacio de trabajo.
- `tools.fs.workspaceOnly: true` (opcional): restringe las rutas de `read`/`write`/`edit`/`apply_patch` y las rutas de carga automática de imágenes de prompt nativas al directorio del espacio de trabajo (útil si hoy permites rutas absolutas y quieres una única barrera de protección).
- Mantén las raíces del sistema de archivos acotadas: evita raíces amplias como tu directorio personal para espacios de trabajo/sandbox de agentes. Las raíces amplias pueden exponer archivos locales sensibles (por ejemplo, estado/configuración bajo `~/.openclaw`) a herramientas del sistema de archivos.

### Línea base segura (copiar/pegar)

Una configuración “predeterminada segura” que mantiene el Gateway privado, requiere emparejamiento por DM y evita bots de grupo siempre activos:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

Si también quieres una ejecución de herramientas “más segura por defecto”, añade un sandbox y deniega herramientas peligrosas para cualquier agente que no sea propietario (ejemplo más abajo en “Perfiles de acceso por agente”).

Línea base integrada para turnos de agente impulsados por chat: los remitentes que no son propietarios no pueden usar las herramientas `cron` ni `gateway`.

## Aislamiento (recomendado)

Documento dedicado: [Aislamiento](/es/gateway/sandboxing)

Dos enfoques complementarios:

- **Ejecutar el Gateway completo en Docker** (límite de contenedor): [Docker](/es/install/docker)
- **Sandbox de herramientas** (`agents.defaults.sandbox`, gateway anfitrión + herramientas aisladas por sandbox; Docker es el backend predeterminado): [Aislamiento](/es/gateway/sandboxing)

<Note>
Para evitar el acceso entre agentes, mantén `agents.defaults.sandbox.scope` en `"agent"` (predeterminado) o `"session"` para un aislamiento por sesión más estricto. `scope: "shared"` usa un único contenedor o espacio de trabajo.
</Note>

Considera también el acceso del agente al espacio de trabajo dentro del sandbox:

- `agents.defaults.sandbox.workspaceAccess: "none"` (predeterminado) mantiene el espacio de trabajo del agente fuera de alcance; las herramientas se ejecutan contra un espacio de trabajo de sandbox bajo `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` monta el espacio de trabajo del agente en modo solo lectura en `/agent` (deshabilita `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` monta el espacio de trabajo del agente en modo lectura/escritura en `/workspace`
- Los `sandbox.docker.binds` adicionales se validan contra rutas de origen normalizadas y canonicalizadas. Los trucos con symlinks padre y los alias canonicales del directorio personal siguen fallando de forma cerrada si se resuelven en raíces bloqueadas como `/etc`, `/var/run` o directorios de credenciales bajo el directorio personal del sistema operativo.

<Warning>
`tools.elevated` es la vía de escape global de línea base que ejecuta exec fuera del sandbox. El anfitrión efectivo es `gateway` por defecto, o `node` cuando el destino de exec está configurado como `node`. Mantén `tools.elevated.allowFrom` restringido y no lo habilites para desconocidos. Puedes restringir más el modo elevado por agente mediante `agents.list[].tools.elevated`. Consulta [Modo elevado](/es/tools/elevated).
</Warning>

### Barrera de protección para delegación de subagentes

Si permites herramientas de sesión, trata las ejecuciones delegadas de subagentes como otra decisión de límite:

- Deniega `sessions_spawn` a menos que el agente realmente necesite delegación.
- Mantén `agents.defaults.subagents.allowAgents` y cualquier override por agente de `agents.list[].subagents.allowAgents` restringidos a agentes de destino conocidos como seguros.
- Para cualquier flujo de trabajo que deba permanecer aislado, llama a `sessions_spawn` con `sandbox: "require"` (el valor predeterminado es `inherit`).
- `sandbox: "require"` falla rápidamente cuando el runtime hijo de destino no está aislado.

## Riesgos del control del navegador

Habilitar el control del navegador da al modelo la capacidad de manejar un navegador real.
Si ese perfil de navegador ya contiene sesiones iniciadas, el modelo puede
acceder a esas cuentas y datos. Trata los perfiles de navegador como **estado sensible**:

- Prefiere un perfil dedicado para el agente (el perfil `openclaw` predeterminado).
- Evita apuntar el agente a tu perfil personal de uso diario.
- Mantén deshabilitado el control del navegador del anfitrión para agentes aislados salvo que confíes en ellos.
- La API independiente de control del navegador mediante local loopback solo respeta la autenticación de secreto compartido
  (autenticación bearer con token del gateway o contraseña del gateway). No consume
  encabezados de identidad de proxy confiable ni de Tailscale Serve.
- Trata las descargas del navegador como entrada no confiable; prefiere un directorio de descargas aislado.
- Deshabilita la sincronización del navegador/gestores de contraseñas en el perfil del agente si es posible (reduce el radio de impacto).
- Para gateways remotos, asume que “control del navegador” equivale a “acceso de operador” a todo lo que ese perfil pueda alcanzar.
- Mantén los anfitriones del Gateway y del node solo en tailnet; evita exponer puertos de control del navegador a la LAN o a Internet pública.
- Deshabilita el enrutamiento de proxy del navegador cuando no lo necesites (`gateway.nodes.browser.mode="off"`).
- El modo de sesión existente de Chrome MCP **no** es “más seguro”; puede actuar como tú en todo lo que ese perfil de Chrome del anfitrión pueda alcanzar.

### Política SSRF del navegador (estricta por defecto)

La política de navegación del navegador de OpenClaw es estricta por defecto: los destinos privados/internos permanecen bloqueados salvo que los habilites explícitamente.

- Predeterminado: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` no está establecido, por lo que la navegación del navegador mantiene bloqueados los destinos privados/internos/de uso especial.
- Alias heredado: `browser.ssrfPolicy.allowPrivateNetwork` aún se acepta por compatibilidad.
- Modo con habilitación explícita: establece `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` para permitir destinos privados/internos/de uso especial.
- En modo estricto, usa `hostnameAllowlist` (patrones como `*.example.com`) y `allowedHostnames` (excepciones exactas de host, incluidos nombres bloqueados como `localhost`) para excepciones explícitas.
- La navegación se comprueba antes de la solicitud y se vuelve a comprobar con mejor esfuerzo en la URL `http(s)` final después de la navegación para reducir pivotes basados en redirecciones.

Ejemplo de política estricta:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"],
    },
  },
}
```

## Perfiles de acceso por agente (multiagente)

Con el enrutamiento multiagente, cada agente puede tener su propio sandbox y política de herramientas:
úsalo para dar **acceso completo**, **solo lectura** o **sin acceso** por agente.
Consulta [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) para ver todos los detalles
y las reglas de precedencia.

Casos de uso comunes:

- Agente personal: acceso completo, sin sandbox
- Agente familiar/de trabajo: aislado + herramientas de solo lectura
- Agente público: aislado + sin herramientas de sistema de archivos/shell

### Ejemplo: acceso completo (sin sandbox)

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

### Ejemplo: herramientas de solo lectura + espacio de trabajo de solo lectura

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### Ejemplo: sin acceso al sistema de archivos/shell (mensajería del proveedor permitida)

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        // Session tools can reveal sensitive data from transcripts. By default OpenClaw limits these tools
        // to the current session + spawned subagent sessions, but you can clamp further if needed.
        // See `tools.sessions.visibility` in the configuration reference.
        tools: {
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

## Respuesta a incidentes

Si tu IA hace algo indebido:

### Contener

1. **Detenla:** detén la app de macOS (si supervisa el Gateway) o termina tu proceso `openclaw gateway`.
2. **Cierra la exposición:** establece `gateway.bind: "loopback"` (o deshabilita Tailscale Funnel/Serve) hasta que entiendas qué ocurrió.
3. **Congela el acceso:** cambia los DMs/grupos riesgosos a `dmPolicy: "disabled"` / requiere menciones, y elimina entradas `"*"` de permitir todo si las tenías.

### Rotar (asume compromiso si se filtraron secretos)

1. Rota la autenticación del Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) y reinicia.
2. Rota los secretos de clientes remotos (`gateway.remote.token` / `.password`) en cualquier máquina que pueda llamar al Gateway.
3. Rota credenciales de proveedores/API (credenciales de WhatsApp, tokens de Slack/Discord, claves de modelo/API en `auth-profiles.json` y valores de payloads de secretos cifrados cuando se usen).

### Auditar

1. Comprueba los logs del Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (o `logging.file`).
2. Revisa la(s) transcripción(es) relevante(s): `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Revisa cambios recientes de configuración (cualquier cosa que pudiera haber ampliado el acceso: `gateway.bind`, `gateway.auth`, políticas de DM/grupo, `tools.elevated`, cambios de plugins).
4. Vuelve a ejecutar `openclaw security audit --deep` y confirma que los hallazgos críticos estén resueltos.

### Recopilar para un informe

- Marca de tiempo, sistema operativo del anfitrión del gateway + versión de OpenClaw
- La(s) transcripción(es) de sesión + una cola breve del log (tras redactar)
- Qué envió el atacante + qué hizo el agente
- Si el Gateway estuvo expuesto más allá de loopback (LAN/Tailscale Funnel/Serve)

## Escaneo de secretos

CI ejecuta el hook pre-commit `detect-private-key` sobre el repositorio. Si
falla, elimina o rota el material de claves confirmado, luego reprodúcelo localmente:

```bash
pre-commit run --all-files detect-private-key
```

## Reportar problemas de seguridad

¿Encontraste una vulnerabilidad en OpenClaw? Repórtala de forma responsable:

1. Correo electrónico: [security@openclaw.ai](mailto:security@openclaw.ai)
2. No publiques nada hasta que se haya corregido
3. Te daremos crédito (a menos que prefieras el anonimato)
