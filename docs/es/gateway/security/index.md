---
read_when:
    - Añadir funciones que amplían el acceso o la automatización
summary: Consideraciones de seguridad y modelo de amenazas para ejecutar un Gateway de IA con acceso al shell
title: Seguridad
x-i18n:
    generated_at: "2026-07-14T13:44:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 3549a0d4891c89fa5b962a65dc3a1fd13b7fbd1400d0bdc7222b9a1c0e7496ed
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **Modelo de confianza del asistente personal.** Esta guía presupone un límite de
  operador de confianza por Gateway (modelo de usuario único y asistente personal).
  OpenClaw **no** es un límite de seguridad multiusuario hostil para varios
  usuarios adversarios que comparten un agente o Gateway. Para operaciones con
  distintos niveles de confianza o usuarios adversarios, separe los límites de confianza:
  Gateway + credenciales independientes e, idealmente, usuarios o hosts del SO independientes.
</Warning>

## Alcance: modelo de seguridad del asistente personal

- Compatible: un usuario/límite de confianza por Gateway (se recomienda un usuario del SO/host/VPS por límite).
- No compatible: un Gateway/agente compartido que utilizan usuarios mutuamente desconfiados o adversarios.
- El aislamiento de usuarios adversarios requiere Gateways independientes (e, idealmente, usuarios del SO/hosts independientes).
- Si varios usuarios no confiables pueden enviar mensajes a un agente con herramientas habilitadas, comparten la autoridad delegada de las herramientas de ese agente.
- Si alguien puede modificar el estado o la configuración del host del Gateway (`~/.openclaw`, incluido `openclaw.json`), debe considerarse un operador de confianza.
- Dentro de un Gateway, el acceso autenticado del operador es un rol de confianza del plano de control, no un rol de inquilino por usuario.
- `sessionKey` (identificadores y etiquetas de sesión) es un selector de enrutamiento, no un token de autorización.

¿Se alojan varios usuarios u organizaciones? Ejecute una celda de Gateway aislada por inquilino en lugar de compartir un Gateway. Consulte [Alojamiento multiinquilino](/es/gateway/multi-tenant-hosting).

Antes de cambiar el acceso remoto, la política de mensajes directos, el proxy inverso o la exposición pública, siga el [procedimiento de exposición del Gateway](/es/gateway/security/exposure-runbook) como lista de comprobación previa y de reversión.

## `openclaw security audit`

Ejecute lo siguiente después de cualquier cambio de configuración o antes de exponer superficies de red:

```bash
openclaw security audit
openclaw security audit --deep    # intenta una prueba activa del Gateway
openclaw security audit --fix     # aplica correcciones seguras
openclaw security audit --json
```

`--fix` tiene un alcance deliberadamente limitado: cambia las políticas de grupos abiertos a listas de permitidos, restaura `logging.redactSensitive: "tools"`, restringe los permisos de estado/configuración/archivos incluidos (archivos `600`, directorios `700`) y, en Windows, utiliza restablecimientos de ACL en lugar de `chmod` de POSIX.

### Qué comprueba la auditoría (a grandes rasgos)

- **Acceso entrante**: políticas de mensajes directos/grupos y listas de permitidos: ¿pueden desconocidos activar el bot?
- **Radio de impacto de las herramientas**: herramientas con privilegios elevados + salas abiertas: ¿podría una inyección de instrucciones convertirse en acciones de shell/archivos/red?
- **Desviación del sistema de archivos de ejecución**: se deniegan las herramientas que modifican el sistema de archivos mientras `exec`/`process` siguen disponibles sin restricciones de aislamiento.
- **Desviación de las aprobaciones de ejecución**: `security="full"`, `autoAllowSkills`, listas de intérpretes permitidos sin `strictInlineEval`. `security="full"` por sí solo es una advertencia general sobre la postura de seguridad, no la prueba de un error: es el valor predeterminado elegido para configuraciones de asistentes personales de confianza; restrínjalo únicamente cuando el modelo de amenazas requiera medidas de protección mediante aprobación o listas de permitidos.
- **Exposición de red**: enlace/autenticación del Gateway, Serve/Funnel de Tailscale y tokens de autenticación débiles o cortos.
- **Exposición del control del navegador**: Nodes remotos, puertos de retransmisión y puntos de conexión CDP remotos.
- **Higiene del disco local**: permisos, enlaces simbólicos, inclusiones de configuración y rutas de carpetas sincronizadas.
- **Plugins**: carga sin una lista de permitidos explícita.
- **Desviación de políticas**: ajustes de Docker para el aislamiento configurados con el modo de aislamiento desactivado; entradas de `gateway.nodes.denyCommands` que parecen surtir efecto, pero solo coinciden con identificadores exactos de comandos (por ejemplo, `system.run`), no con el texto del shell dentro de la carga útil; entradas peligrosas de `gateway.nodes.allowCommands`; `tools.profile="minimal"` global anulado por agente; herramientas propiedad de Plugins accesibles bajo una política permisiva.
- **Desviación de las expectativas del entorno de ejecución**: suponer que la ejecución implícita todavía significa `sandbox` cuando `tools.exec.host` ahora tiene como valor predeterminado `auto`, o establecer `tools.exec.host="sandbox"` mientras el modo de aislamiento está desactivado.
- **Higiene del modelo**: advierte sobre modelos heredados configurados (advertencia leve, no un bloqueo estricto).

Cada hallazgo tiene un `checkId` estructurado (por ejemplo, `gateway.bind_no_auth`, `tools.exec.security_full_configured`). Prefijos: `fs.*` (permisos), `gateway.*` (enlace/autenticación/Tailscale/interfaz de control/proxy de confianza), `hooks.*`/`browser.*`/`sandbox.*`/`tools.exec.*` (refuerzo por superficie), `plugins.*`/`skills.*` (cadena de suministro), `security.exposure.*` (política de acceso × radio de impacto de las herramientas). Catálogo completo con gravedad y compatibilidad con correcciones automáticas: [Comprobaciones de auditoría de seguridad](/es/gateway/security/audit-checks). Consulte también [Verificación formal](/es/security/formal-verification).

### Orden de prioridad al clasificar los hallazgos

1. Cualquier elemento «abierto» + herramientas habilitadas: restrinja primero los mensajes directos/grupos (emparejamiento/listas de permitidos) y, después, endurezca la política de herramientas y el aislamiento.
2. Exposición a redes públicas (enlace LAN, Funnel o ausencia de autenticación): corríjala de inmediato.
3. Exposición remota del control del navegador: trátela como acceso de operador (solo tailnet, emparejamiento deliberado de Nodes y ninguna exposición pública).
4. Permisos: el estado, la configuración, las credenciales y la autenticación no deben ser legibles por el grupo ni por todo el mundo.
5. Plugins: cargue únicamente aquellos en los que confíe explícitamente.
6. Elección del modelo: se recomiendan modelos modernos y reforzados frente a instrucciones maliciosas para cualquier bot con herramientas.

## Configuración base reforzada en 60 segundos

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

Mantiene el Gateway únicamente en el entorno local, aísla los mensajes directos y deshabilita de forma predeterminada las herramientas del plano de control y del entorno de ejecución. A partir de ahí, vuelva a habilitar herramientas de forma selectiva para cada agente de confianza.

Configuración base integrada para turnos de agentes controlados mediante chat: los remitentes que no sean propietarios no pueden utilizar las herramientas `cron` ni `gateway`, independientemente de la configuración.

## Matriz de límites de confianza

Modelo rápido para clasificar informes de riesgos:

| Límite o control                                          | Qué significa                                                  | Interpretación errónea habitual                                                     |
| --------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `gateway.auth` (token/contraseña/proxy de confianza/autenticación del dispositivo) | Autentica a quienes llaman a las API del Gateway                | «Necesita firmas por mensaje en cada trama para ser seguro»                         |
| `sessionKey`                                        | Clave de enrutamiento para seleccionar el contexto o la sesión  | «La clave de sesión es un límite de autenticación del usuario»                      |
| Medidas de protección de instrucciones/contenido          | Reducen el riesgo de uso indebido del modelo                    | «La inyección de instrucciones por sí sola demuestra una omisión de autenticación»  |
| `canvas.eval` / evaluación del navegador             | Capacidad intencionada del operador cuando está habilitada      | «Cualquier primitiva de evaluación de JS es automáticamente una vulnerabilidad en este modelo de confianza» |
| Shell `!` de la TUI local                  | Ejecución local activada explícitamente por el operador         | «El comando práctico del shell local es una inyección remota»                       |
| Emparejamiento de Nodes y comandos de Nodes                | Ejecución remota de nivel de operador en dispositivos emparejados | «El control remoto del dispositivo debe tratarse de forma predeterminada como acceso de un usuario no confiable» |
| `gateway.nodes.pairing.autoApproveCidrs`                                        | Política opcional de incorporación de Nodes de redes de confianza | «Una lista de permitidos deshabilitada de forma predeterminada es una vulnerabilidad automática de emparejamiento» |
| `gateway.nodes.pairing.sshVerify`                                        | Incorporación de Nodes con clave verificada mediante SSH del operador | «La aprobación automática habilitada de forma predeterminada es una vulnerabilidad automática de emparejamiento» |

## Comportamientos que no son vulnerabilidades por diseño

<Accordion title="Hallazgos habituales cerrados sin tomar medidas">

- Cadenas basadas únicamente en inyección de instrucciones sin eludir políticas, autenticación ni aislamiento.
- Afirmaciones que presuponen una operación multiinquilino hostil en un único host o una única configuración compartidos.
- Acceso normal del operador mediante rutas de lectura (por ejemplo, `sessions.list` / `sessions.preview` / `chat.history`) clasificado como IDOR en una configuración de Gateway compartido.
- Hallazgos de implementaciones restringidas al host local (por ejemplo, la ausencia de HSTS en un Gateway restringido a loopback).
- Hallazgos sobre la firma de Webhooks entrantes de Discord para rutas de entrada que no existen en este repositorio.
- Metadatos de emparejamiento de Nodes tratados como una segunda capa oculta de aprobación por comando para `system.run`; el límite de ejecución real es la política global de comandos de Nodes del Gateway junto con las aprobaciones de ejecución del propio Node.
- `gateway.nodes.pairing.sshVerify` tratado como una vulnerabilidad porque está habilitado de forma predeterminada. Nunca aprueba basándose únicamente en la ubicación de red o en la accesibilidad por SSH: el Gateway lee la identidad del dispositivo a través de SSH (BatchMode, claves de host estrictas) y solo aprueba cuando la clave del dispositivo coincide exactamente con la solicitud pendiente, lo que requiere que el par de claves de conexión ya se encuentre en la cuenta del operador en un host controlado por este. Las pruebas se limitan a direcciones de origen privadas/CGNAT, comparten el umbral de elegibilidad de CIDR de confianza (solo `role: node` reciente y sin ámbitos) y `sshVerify: false` desactiva la función.
- `gateway.nodes.pairing.autoApproveCidrs` tratado por sí solo como una vulnerabilidad. Está deshabilitado de forma predeterminada, requiere entradas CIDR/IP explícitas, solo se aplica al primer emparejamiento de `role: node` sin ámbitos solicitados y nunca aprueba automáticamente al operador/navegador/interfaz de control, WebChat, las ampliaciones de rol/ámbito, los cambios de metadatos o clave pública ni las rutas de cabeceras del proxy de confianza mediante loopback en el mismo host (incluso cuando la autenticación del proxy de confianza mediante loopback está habilitada).
- Hallazgos de «falta de autorización por usuario» que tratan `sessionKey` como un token de autenticación.

</Accordion>

## Confianza entre Gateway y Node

Considere el Gateway y el Node como un único dominio de confianza del operador con funciones diferentes:

- **Gateway**: plano de control y superficie de políticas (`gateway.auth`, política de herramientas y enrutamiento).
- **Node**: superficie de ejecución remota emparejada con ese Gateway (comandos, acciones del dispositivo y capacidades locales del host).
- Quien llama y se autentica ante el Gateway es de confianza en el ámbito del Gateway; después del emparejamiento, las acciones del Node son acciones de un operador de confianza en ese Node. Consulte [Ámbitos del operador](/es/gateway/operator-scopes).
- Los clientes directos del backend mediante loopback autenticados con el token o la contraseña compartidos del Gateway pueden realizar RPC internos del plano de control sin presentar una identidad de dispositivo del usuario. Esto no constituye una omisión del emparejamiento remoto ni del navegador: los clientes de red, clientes de Nodes, clientes con token de dispositivo e identidades explícitas de dispositivos siguen sujetos al emparejamiento y a la aplicación de ampliaciones de ámbito.
- Las aprobaciones de ejecución (lista de permitidos + solicitud) son medidas de protección para la intención del operador, no aislamiento multiinquilino hostil. Vinculan el contexto exacto de la solicitud y, en la medida de lo posible, los operandos directos de archivos locales; no modelan semánticamente todas las rutas de carga del entorno de ejecución o del intérprete. Utilice aislamiento y separación de hosts para establecer límites sólidos.
- Valor predeterminado para un único operador de confianza: se permite la ejecución en el host mediante `gateway`/`node` sin solicitudes de aprobación (`security="full"`, `ask="off"`). Esta es una decisión intencionada de experiencia de usuario, no una vulnerabilidad por sí sola.

Para aislar usuarios hostiles, separe los límites de confianza por usuario del SO/host y ejecute Gateways independientes.

## Modelo de amenazas

Su asistente de IA puede ejecutar comandos de shell arbitrarios, leer y escribir archivos, acceder a servicios de red y enviar mensajes a cualquier persona (si se le concede acceso al canal). Quienes le envían mensajes pueden intentar engañarlo para que haga cosas perjudiciales, obtener acceso a sus datos mediante ingeniería social o sondear detalles de la infraestructura.

La mayoría de los fallos aquí no son exploits sofisticados, sino casos en los que «alguien envió un mensaje al bot y este hizo lo que se le pidió». La postura de OpenClaw, en orden:

1. **Primero, la identidad**: decida quién puede comunicarse con el bot (emparejamiento de mensajes directos, listas de permitidos o modo explícitamente «abierto»).
2. **Después, el alcance**: decida dónde puede actuar el bot (listas de permitidos de grupos y activación mediante menciones, herramientas, aislamiento y permisos del dispositivo).
3. **Por último, el modelo**: dé por sentado que el modelo puede ser manipulado; diseñe el sistema de modo que la manipulación tenga un radio de impacto limitado.

## Acceso mediante mensajes directos: emparejamiento, lista de permitidos, abierto y deshabilitado

Todos los canales compatibles con mensajes directos admiten `dmPolicy` (o `*.dm.policy`), que controla los mensajes directos entrantes antes de procesarlos:

| Política      | Comportamiento                                                                                                                                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pairing`   | Valor predeterminado. Los remitentes desconocidos reciben un código de emparejamiento; el bot los ignora hasta que se aprueben. Los códigos caducan después de 1 hora; los mensajes directos repetidos no vuelven a enviar un código hasta que se crea una solicitud nueva. Hay un máximo de 3 solicitudes pendientes por canal. |
| `allowlist` | Los remitentes desconocidos se bloquean, sin proceso de emparejamiento.                                                                                                                                                                       |
| `open`      | Cualquiera puede enviar mensajes directos (público). Requiere que la lista de permitidos del canal incluya `"*"` (aceptación explícita).                                                                                                                           |
| `disabled`  | Los mensajes directos entrantes se ignoran por completo.                                                                                                                                                                                        |

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Detalles y archivos en disco: [Emparejamiento](/es/channels/pairing)

Considere `dmPolicy="open"` y `groupPolicy="open"` como ajustes de último recurso; prefiera el emparejamiento y las listas de permitidos, salvo que confíe plenamente en todos los miembros de la sala.

### Listas de permitidos (dos niveles)

- **Lista de permitidos de mensajes directos** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; heredados: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): quién puede enviar mensajes directos al bot. Cuando `dmPolicy="pairing"`, las aprobaciones se escriben en `~/.openclaw/credentials/<channel>-allowFrom.json` (cuenta predeterminada) o `<channel>-<accountId>-allowFrom.json` (cuentas no predeterminadas) y se combinan con las listas de permitidos de la configuración.
- **Lista de permitidos de grupos** (específica del canal): qué grupos, canales o servidores acepta el bot.
  - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: valores predeterminados por grupo, como `requireMention`; cuando se establecen, también actúan como lista de permitidos de grupos (incluya `"*"` para conservar el comportamiento de permitir todo). Personalice los activadores de mención con `agents.list[].groupChat.mentionPatterns` (por ejemplo, `["@openclaw", "@mybot"]`) para que `requireMention` se active con los nombres que haya asignado al bot.
  - `groupPolicy="allowlist"` + `groupAllowFrom`: restringen quién puede activar el bot dentro de una sesión de grupo (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
  - `channels.discord.guilds` / `channels.slack.channels`: listas de permitidos y valores predeterminados de menciones por superficie.
  - Orden de comprobación: primero `groupPolicy`/las listas de permitidos de grupos y, después, la activación mediante menciones o respuestas. Responder a un mensaje del bot (mención implícita) **no** elude `groupAllowFrom`.

Detalles: [Configuración](/es/gateway/configuration) y [Grupos](/es/channels/groups)

### Aislamiento de sesiones de mensajes directos (modo multiusuario)

De forma predeterminada, OpenClaw dirige todos los mensajes directos a la sesión principal para mantener la continuidad entre dispositivos. Si varias personas pueden enviar mensajes directos al bot (mensajes directos abiertos o una lista de permitidos con varias personas), aísle las sesiones de mensajes directos:

```json5
{ session: { dmScope: "per-channel-peer" } }
```

Valores de `session.dmScope`:

| Valor                      | Alcance                                                                  |
| -------------------------- | ---------------------------------------------------------------------- |
| `main` (valor predeterminado de la configuración)    | Todos los mensajes directos comparten una sesión.                                             |
| `per-channel-peer`         | Cada par de canal y remitente obtiene un contexto de mensajes directos aislado (modo seguro de mensajes directos). |
| `per-account-channel-peer` | Como el anterior, pero con una separación adicional por cuenta (canales con varias cuentas).         |
| `per-peer`                 | Cada remitente obtiene una sesión para todos los canales del mismo tipo.     |

La incorporación mediante la CLI local escribe `session.dmScope: "per-channel-peer"` cuando no se ha establecido y conserva cualquier valor explícito existente.

Este es un límite del contexto de mensajería, no un límite de administración del host. Si los usuarios desconfían entre sí y comparten el mismo host o configuración del Gateway, ejecute gateways separados para cada límite de confianza.

Si la misma persona se comunica por varios canales, use `session.identityLinks` para unificar esas sesiones de mensajes directos en una identidad canónica. Consulte [Gestión de sesiones](/es/concepts/session) y [Configuración](/es/gateway/configuration).

## Visibilidad del contexto frente a autorización de activación

Son dos conceptos distintos:

- **Autorización de activación**: quién puede activar al agente (`dmPolicy`, `groupPolicy`, listas de permitidos y activadores mediante menciones).
- **Visibilidad del contexto**: qué contexto complementario llega al modelo (contenido de la respuesta, texto citado, historial del hilo y metadatos reenviados).

`contextVisibility` controla el segundo:

- `"all"` (valor predeterminado): el contexto complementario se conserva tal como se recibió.
- `"allowlist"`: el contexto complementario se filtra para incluir solo a los remitentes permitidos por las comprobaciones activas de las listas de permitidos.
- `"allowlist_quote"`: como `allowlist`, pero conserva una respuesta citada explícita.

Configúrelo por canal o por sala/conversación; consulte [Grupos](/es/channels/groups#context-visibility-and-allowlists). Los informes que solo demuestran que «el modelo puede ver texto citado o histórico de remitentes que no están en la lista de permitidos» son hallazgos de refuerzo que pueden abordarse con `contextVisibility`, no elusiones de autenticación o aislamiento por sí mismos; un informe con impacto en la seguridad aún debe demostrar la elusión de un límite de confianza.

## Inyección de instrucciones

Un atacante crea un mensaje que manipula el modelo para que realice una acción insegura («ignora tus instrucciones», «vuelca tu sistema de archivos», «sigue este enlace y ejecuta comandos»). La inyección de instrucciones **no se resuelve** únicamente con medidas de protección en el prompt del sistema: estas son orientaciones flexibles; la aplicación estricta proviene de las políticas de herramientas, las aprobaciones de ejecución, el aislamiento y las listas de permitidos de los canales (que los operadores pueden deshabilitar deliberadamente).

La inyección de instrucciones no requiere mensajes directos públicos: aunque solo usted pueda enviar mensajes al bot, cualquier **contenido que no sea de confianza** que este lea (resultados de búsqueda u obtención web, páginas del navegador, correos electrónicos, documentos, archivos adjuntos o registros y código pegados) puede contener instrucciones maliciosas. El propio contenido constituye una superficie de amenaza, no solo el remitente.

Señales de alerta que deben considerarse contenido no fiable:

- «Lee este archivo o URL y haz exactamente lo que indique».
- «Ignora el prompt del sistema o las reglas de seguridad».
- «Revela tus instrucciones ocultas o los resultados de las herramientas».
- «Pega todo el contenido de ~/.openclaw o de tus registros».

Medidas útiles en la práctica:

- Mantenga restringidos los mensajes directos entrantes (emparejamiento/listas de permitidos); prefiera la activación mediante menciones en grupos; evite los bots siempre activos en salas públicas.
- Considere hostiles de forma predeterminada los enlaces, los archivos adjuntos y las instrucciones pegadas.
- Ejecute las herramientas sensibles en un entorno aislado; mantenga los secretos fuera del sistema de archivos accesible para el agente. El aislamiento es opcional: si el modo de aislamiento está desactivado, el valor implícito `host=auto` se resuelve como el host del Gateway, mientras que el valor explícito `host=sandbox` sigue fallando de forma segura (no hay ningún entorno de ejecución aislado disponible). Establezca `host=gateway` para hacer explícito ese comportamiento en la configuración.
- Limite las herramientas de alto riesgo (`exec`, `browser`, `web_fetch`, `web_search`) a agentes de confianza o listas de permitidos explícitas.
- Si incluye intérpretes en la lista de permitidos (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), habilite `tools.exec.strictInlineEval` para que las formas de evaluación en línea (`-c`, `-e` y similares) sigan necesitando aprobación explícita. En el modo de lista de permitidos, cualquier segmento heredoc (`<<`) siempre requiere la aprobación de un revisor o una aprobación explícita, independientemente del uso de comillas: un comando incluido en la lista de permitidos no puede utilizar el cuerpo de un heredoc para eludir la revisión de dicha lista.
- Reduzca el radio de impacto mediante un **agente lector** de solo lectura o sin herramientas para resumir contenido no fiable y, después, transfiera el resumen al agente principal.
- Para los hooks de Gmail, la sesión integrada por mensaje aísla el contexto de la conversación, pero no elimina los permisos de herramientas ni del espacio de trabajo del agente de destino. Dirija el correo no fiable a un agente lector dedicado, aplique [restricciones de aislamiento y herramientas por agente](/es/tools/multi-agent-sandbox-tools) y restrinja cualquier transferencia al agente principal mediante [`tools.agentToAgent`](/es/gateway/config-tools#toolsagenttoagent). Consulte [Integración con Gmail](/es/gateway/configuration-reference#gmail-integration).
- Mantenga `web_search` / `web_fetch` / `browser` desactivados para los agentes con herramientas, salvo que sean necesarios.
- Para las entradas de URL de OpenResponses (`input_file` / `input_image`), establezca valores estrictos para `gateway.http.endpoints.responses.files.urlAllowlist` / `images.urlAllowlist` y mantenga bajo `maxUrlParts` (las listas de permitidos vacías se consideran no establecidas). Use `files.allowUrl: false` / `images.allowUrl: false` para deshabilitar por completo la obtención de URL.
- Mantenga los secretos fuera de los prompts; páselos mediante variables de entorno o la configuración del host del Gateway.

**La elección del modelo es importante.** La resistencia a la inyección de instrucciones no es uniforme entre los distintos niveles de modelos: los modelos más pequeños o económicos son más susceptibles al uso indebido de herramientas y al secuestro de instrucciones ante prompts maliciosos.

<Warning>
Para los agentes con herramientas o aquellos que leen contenido no fiable, el riesgo de inyección de instrucciones con modelos antiguos o pequeños suele ser demasiado alto. No ejecute esas cargas de trabajo con niveles de modelos poco robustos.
</Warning>

- Use el modelo de última generación y del mejor nivel para cualquier bot que pueda ejecutar herramientas o acceder a archivos o redes.
- No use niveles antiguos, menos robustos o más pequeños para agentes con herramientas o bandejas de entrada no fiables.
- Si debe usar un modelo más pequeño, reduzca el radio de impacto: herramientas de solo lectura, aislamiento estricto, acceso mínimo al sistema de archivos y listas de permitidos estrictas. Habilite el aislamiento para todas las sesiones y deshabilite `web_search`/`web_fetch`/`browser`, salvo que las entradas estén estrictamente controladas.
- Para asistentes personales exclusivamente de chat, con entradas de confianza y sin herramientas, los modelos más pequeños suelen ser adecuados.

### Contenido externo y encapsulado de entradas no fiables

El texto `input_file` de OpenResponses se sigue insertando como contenido externo no fiable aunque el Gateway lo descodifique localmente: el bloque contiene marcadores de límites `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` y metadatos `Source: External` (esta ruta omite el aviso más extenso `SECURITY NOTICE:` utilizado en otros lugares). El mismo encapsulado basado en marcadores se aplica cuando la comprensión multimedia extrae texto de documentos adjuntos antes de añadirlo al prompt multimedia.

OpenClaw también elimina del contenido externo encapsulado y de los metadatos los literales comunes de tokens especiales de plantillas de chat de LLM autoalojados (tokens de rol/turno de Qwen/ChatML, Llama, Gemma, Mistral, Phi y GPT-OSS) antes de que lleguen al modelo. Los backends autoalojados compatibles con OpenAI (vLLM, SGLang, TGI, LM Studio y pilas personalizadas de tokenizadores de Hugging Face) a veces tokenizan cadenas literales como `<|im_start|>` o `<|start_header_id|>` como tokens estructurales de plantillas de chat dentro del contenido del usuario; sin esta depuración, el texto no confiable de una página obtenida, el cuerpo de un correo electrónico o la salida de una herramienta que lee el contenido de archivos podría falsificar un límite sintético de rol `assistant`/`system`. La depuración se realiza en la capa de encapsulación del contenido externo, por lo que se aplica de manera uniforme a las herramientas de obtención/lectura y al contenido entrante de los canales. Los proveedores alojados (OpenAI, Anthropic) ya aplican su propia depuración en las solicitudes; mantenga habilitada la encapsulación del contenido externo y, cuando estén disponibles, prefiera opciones del backend que separen o escapen los tokens especiales.

Las respuestas salientes del modelo tienen un depurador independiente que elimina `<tool_call>`, `<function_calls>`, `<system-reminder>`, `<previous_response>` y estructuras internas similares que se hayan filtrado en las respuestas visibles para el usuario, en el límite final de entrega al canal.

Esto no sustituye `dmPolicy`, las listas de permitidos, las aprobaciones de ejecución, el aislamiento ni `contextVisibility`; corrige una omisión específica en la capa del tokenizador.

### Indicadores de omisión (manténgalos desactivados en producción)

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Campo de carga útil de Cron `allowUnsafeExternalContent`

Habilítelos solo temporalmente para una depuración con un alcance muy limitado; si se habilitan, aísle ese agente (entorno aislado + herramientas mínimas + espacio de nombres de sesión dedicado).

Las cargas útiles de los hooks son contenido no confiable incluso cuando la entrega proviene de sistemas bajo su control (el contenido de correos, documentos o sitios web puede contener inyección de instrucciones). Los niveles de modelos débiles aumentan este riesgo; para la automatización controlada mediante hooks, prefiera niveles de modelos modernos y potentes, y mantenga una política de herramientas estricta (`tools.profile: "messaging"` o más estricta), además del aislamiento cuando sea posible.

### Razonamiento y salida detallada en grupos

`/reasoning`, `/verbose` y `/trace` pueden exponer razonamiento interno, salidas de herramientas o diagnósticos de plugins no destinados a un canal público; pueden incluir argumentos de herramientas, URL, diagnósticos de plugins y datos que vio el modelo. Manténgalos deshabilitados en salas públicas; habilítelos solo en mensajes directos confiables o salas estrictamente controladas.

## Autorización de comandos

Los comandos con barra y las directivas solo se aceptan de remitentes autorizados, determinados mediante las listas de permitidos o el emparejamiento del canal, además de `commands.useAccessGroups` (consulte [Configuración](/es/gateway/configuration) y [Comandos con barra](/es/tools/slash-commands)). Si la lista de permitidos de un canal está vacía o incluye `"*"`, los comandos están efectivamente abiertos en ese canal.

`/exec` es una comodidad exclusiva de la sesión para operadores autorizados; no escribe en la configuración ni modifica otras sesiones.

## Herramientas del plano de control

Dos herramientas integradas pueden realizar cambios persistentes:

- `gateway` inspecciona la configuración con `config.schema.lookup` / `config.get` y la modifica con `config.apply`, `config.patch` y `update.run`.
- `cron` crea trabajos programados que continúan ejecutándose después de que finalice el chat o la tarea original.

`gateway config.apply`/`config.patch` adoptan un comportamiento cerrado por defecto: el agente solo puede ajustar una lista de permitidos limitada de opciones de bajo riesgo del entorno de ejecución del agente (`agents.defaults.model`, `agents.defaults.thinkingDefault`, campos por agente de modelo, pensamiento, razonamiento y modo rápido), control de menciones (`channels.*.requireMention` en varios niveles de anidamiento) y opciones de respuestas visibles (`messages.visibleReplies`, `messages.groupChat.visibleReplies`, `messages.groupChat.unmentionedInbound`). Se rechaza cualquier otra ruta de configuración modificada. Las superposiciones de instrucciones permanecen bajo el control del operador y los nuevos árboles de configuración sensibles están protegidos, salvo que se añadan deliberadamente a esa lista de permitidos. La herramienta sigue negándose a reescribir `tools.exec.ask` o `tools.exec.security`; los alias heredados de `tools.bash.*` se normalizan a la ruta equivalente de `tools.exec.*` antes de comprobar la escritura.

Para cualquier agente o superficie que procese contenido no confiable, deniegue estas herramientas de forma predeterminada:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` solo bloquea las acciones de reinicio; no deshabilita las acciones de configuración o actualización de `gateway`.

## Ejecución en Node (`system.run`)

Si se empareja un nodo macOS, el Gateway puede invocar `system.run` en él; esto supone ejecución remota de código en ese Mac.

- Requiere emparejar el nodo (aprobación + token). El emparejamiento establece la identidad y la confianza del nodo y emite el token; no constituye una superficie de aprobación para cada comando.
- El Gateway aplica una política global general para los comandos de nodos mediante `gateway.nodes.allowCommands` / `denyCommands`. `denyCommands` solo coincide con nombres exactos de comandos del nodo (por ejemplo, `system.run`), no con el texto del shell dentro de la carga útil de un comando; que un nodo que vuelve a conectarse anuncie una lista de comandos diferente no constituye por sí solo una vulnerabilidad si la política global del gateway y las propias aprobaciones de ejecución del nodo siguen haciendo cumplir el límite.
- La política `system.run` de cada nodo es el propio archivo de aprobaciones de ejecución del nodo (`exec.approvals.node.*`), que se controla en el Mac mediante Settings -> Exec approvals (seguridad + consulta + lista de permitidos); puede ser más estricta o más permisiva que la política global de identificadores de comandos del gateway.
- Un nodo que ejecuta `security="full"` y `ask="off"` sigue el modelo predeterminado de operador confiable; es el comportamiento esperado, no un error, salvo que la implementación necesite una postura más estricta.
- El modo de aprobación vincula el contexto exacto de la solicitud y, cuando es posible, un único operando concreto de script o archivo local. Si OpenClaw no puede identificar exactamente un archivo local directo para un comando de intérprete o entorno de ejecución, se deniega la ejecución respaldada por aprobación en lugar de prometer una cobertura semántica completa.
- Para `host=node`, las ejecuciones respaldadas por aprobación también almacenan un `systemRunPlan` preparado y canónico; las remisiones aprobadas posteriores reutilizan ese plan almacenado y la validación del gateway rechaza las modificaciones del solicitante en el contexto del comando, el directorio de trabajo o la sesión después de crear la solicitud de aprobación.
- Para deshabilitar por completo la ejecución remota: establezca la seguridad en `deny` y elimine el emparejamiento del nodo de ese Mac.

## Skills dinámicas (observador / nodos remotos)

OpenClaw puede actualizar la lista de Skills durante una sesión: el observador de Skills actualiza la instantánea en el siguiente turno del agente cuando cambia `SKILL.md`, y conectar un nodo macOS puede hacer que las Skills exclusivas de macOS cumplan los requisitos (según la detección de binarios). Trate las carpetas de Skills como código confiable y restrinja quién puede modificarlas.

## Plugins

Los plugins se ejecutan en el mismo proceso que el Gateway; trátelos como código confiable.

- Instale solo desde fuentes de confianza; prefiera listas de permitidos explícitas en `plugins.allow`; revise la configuración del plugin antes de habilitarlo; reinicie el Gateway después de modificar plugins.
- La instalación o actualización (`openclaw plugins install <package>`, `openclaw plugins update <id>`) ejecuta código no confiable:
  - La ruta de instalación es el directorio de cada plugin situado bajo la raíz activa de instalación de plugins.
  - OpenClaw no ejecuta el bloqueo local integrado de código peligroso durante la instalación o actualización. Utilice `security.installPolicy` para las decisiones locales de permitir o bloquear controladas por el operador y `openclaw security audit --deep` para el análisis de diagnóstico.
  - Las instalaciones de plugins mediante npm y git solo ejecutan la convergencia de dependencias del gestor de paquetes durante el flujo explícito de instalación o actualización. Las rutas locales y los archivos se tratan como paquetes independientes; OpenClaw los copia o referencia sin ejecutar `npm install`.
  - Prefiera versiones exactas fijadas (`@scope/pkg@1.2.3`) e inspeccione el código desempaquetado antes de habilitarlo.
  - `--dangerously-force-unsafe-install` está obsoleto y ya no cambia el comportamiento de instalación o actualización.
  - `security.installPolicy` permite a los operadores ejecutar un comando local confiable para tomar decisiones específicas del host sobre permitir o bloquear instalaciones de Skills y plugins. Se ejecuta después de preparar el material de origen, pero antes de que continúe la instalación; también se aplica a las Skills de ClawHub y no se omite mediante indicadores inseguros obsoletos.

Detalles: [Plugins](/es/tools/plugin)

## Aislamiento

Documentación específica: [Aislamiento](/es/gateway/sandboxing)

Dos enfoques complementarios:

- **Gateway completo en Docker** (límite del contenedor): [Docker](/es/install/docker)
- **Entorno aislado para herramientas** (`agents.defaults.sandbox`; gateway del host + herramientas aisladas en el entorno; Docker es el backend predeterminado): [Aislamiento](/es/gateway/sandboxing)

<Note>
Para impedir el acceso entre agentes, mantenga `agents.defaults.sandbox.scope` en `"agent"` (valor predeterminado) o utilice `"session"` para un aislamiento por sesión más estricto. `scope: "shared"` utiliza un único contenedor o espacio de trabajo.
</Note>

Acceso al espacio de trabajo del agente dentro del entorno aislado (`agents.defaults.sandbox.workspaceAccess`):

- `"none"` (valor predeterminado): las herramientas ven un espacio de trabajo aislado bajo `~/.openclaw/sandboxes`; el espacio de trabajo del agente no es accesible.
- `"ro"`: monta el espacio de trabajo del agente en modo de solo lectura en `/agent` (deshabilita `write`/`edit`/`apply_patch`).
- `"rw"`: monta el espacio de trabajo del agente en modo de lectura y escritura en `/workspace`.

Los `sandbox.docker.binds` adicionales se validan con rutas de origen normalizadas y canonizadas. Una lista de rutas bloqueadas incluye `/etc`, `/private/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot` y los directorios que suelen contener el socket de Docker o actuar como alias de este (`/run`, `/var/run` y `docker.sock` bajo ellos), además de las subrutas de credenciales de HOME (`.aws`, `.cargo`, `.config`, `.docker`, `.gnupg`, `.netrc`, `.npm`, `.ssh`). Los trucos con enlaces simbólicos en directorios superiores y los alias canónicos del directorio personal se resuelven mediante los ancestros existentes y se vuelven a comprobar, por lo que siguen adoptando un comportamiento cerrado si se resuelven en una raíz bloqueada.

<Warning>
`tools.elevated` es la vía de escape global de referencia que ejecuta comandos fuera del entorno aislado. El host efectivo es `gateway` de forma predeterminada, o `node` cuando el destino de ejecución está configurado como `node`. Mantenga `tools.elevated.allowFrom` restringido y no lo habilite para desconocidos. Restrínjalo aún más por agente mediante `agents.list[].tools.elevated`. Consulte [Modo elevado](/es/tools/elevated).
</Warning>

### Medida de protección para delegar en subagentes

Si permite herramientas de sesión, trate las ejecuciones delegadas de subagentes como otra decisión sobre límites:

- Deniegue `sessions_spawn` salvo que el agente realmente necesite delegar.
- Mantenga `agents.defaults.subagents.allowAgents` y cualquier anulación por agente de `agents.list[].subagents.allowAgents` restringidos a agentes de destino cuya seguridad sea conocida.
- Para los flujos de trabajo que deban permanecer aislados, llame a `sessions_spawn` con `sandbox: "require"` (el valor predeterminado es `"inherit"`); `"require"` falla inmediatamente cuando el entorno de ejecución secundario de destino no está aislado.

### Modo de solo lectura

Cree un perfil de solo lectura combinando `agents.defaults.sandbox.workspaceAccess: "ro"` (o `"none"` para impedir el acceso al espacio de trabajo) con listas de herramientas permitidas o denegadas que bloqueen `write`, `edit`, `apply_patch`, `exec`, `process`, etc.

- `tools.exec.applyPatch.workspaceOnly: true` (valor predeterminado): impide que `apply_patch` escriba o elimine fuera del directorio del espacio de trabajo incluso con el aislamiento desactivado. Establezca `false` solo si desea intencionadamente que `apply_patch` modifique archivos fuera del espacio de trabajo.
- `tools.fs.workspaceOnly: true` (opcional): restringe las rutas de `read`/`write`/`edit`/`apply_patch` y las rutas de carga automática de imágenes de las instrucciones nativas al directorio del espacio de trabajo.
- Mantenga restringidas las raíces del sistema de archivos; evite raíces amplias, como el directorio personal, para los espacios de trabajo del agente o del entorno aislado, ya que pueden exponer archivos locales sensibles (por ejemplo, el estado o la configuración bajo `~/.openclaw`) a las herramientas del sistema de archivos.

## Perfiles de acceso por agente (varios agentes)

Cada agente puede tener su propia zona de pruebas y política de herramientas: acceso completo, de solo lectura o sin acceso. Consulte [Zona de pruebas y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) para conocer las reglas de precedencia.

Patrones habituales: agente personal (acceso completo, sin zona de pruebas), agente familiar/laboral (en zona de pruebas + herramientas de solo lectura), agente público (en zona de pruebas + sin herramientas de sistema de archivos/shell).

### Acceso completo (sin zona de pruebas)

```json5
{
  agents: {
    list: [
      { id: "personal", workspace: "~/.openclaw/workspace-personal", sandbox: { mode: "off" } },
    ],
  },
}
```

### Herramientas de solo lectura + espacio de trabajo de solo lectura

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### Sin acceso al sistema de archivos/shell (se permite la mensajería del proveedor)

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          // Las herramientas de sesión pueden revelar datos de transcripciones. El ámbito predeterminado es la sesión actual +
          // las sesiones de subagentes iniciadas; restrínjalo aún más con tools.sessions.visibility si es necesario.
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "discord",
            "slack",
            "telegram",
            "whatsapp",
          ],
          deny: [
            "apply_patch",
            "browser",
            "canvas",
            "cron",
            "edit",
            "exec",
            "gateway",
            "image",
            "nodes",
            "process",
            "read",
            "write",
          ],
        },
      },
    ],
  },
}
```

## Riesgos del control del navegador

Habilitar el control del navegador proporciona al modelo un navegador real. Si ese perfil ya tiene sesiones iniciadas, el modelo puede acceder a esas cuentas y datos; trate los perfiles del navegador como estado confidencial.

- Utilice preferentemente un perfil dedicado para el agente (el perfil `openclaw` predeterminado); evite su perfil personal de uso diario.
- Mantenga deshabilitado el control del navegador del host para los agentes en zonas de pruebas, salvo que confíe en ellos.
- La API independiente de control del navegador mediante bucle invertido solo admite la autenticación con secreto compartido (autenticación de portador con token del Gateway o contraseña del Gateway); no utiliza encabezados de identidad de proxy de confianza ni de Tailscale Serve.
- Trate las descargas del navegador como entradas no confiables; utilice preferentemente un directorio de descargas aislado.
- Deshabilite la sincronización del navegador y los gestores de contraseñas en el perfil del agente si es posible.
- Para gateways remotos, el «control del navegador» equivale al «acceso de operador» a todo aquello a lo que pueda acceder ese perfil.
- Mantenga los hosts del Gateway y de Node accesibles solo desde la tailnet; evite exponer los puertos de control del navegador a la LAN o a la Internet pública.
- Deshabilite el enrutamiento mediante proxy del navegador cuando no sea necesario (`gateway.nodes.browser.mode="off"`).
- El modo de sesión existente de Chrome MCP no es «más seguro»: puede actuar en su nombre en todo aquello a lo que pueda acceder el perfil de Chrome de ese host.
- Ejecute un **host de Node** en la máquina del navegador y permita que el Gateway actúe como proxy de las acciones del navegador cuando el Gateway esté alejado del navegador (consulte [Herramienta del navegador](/es/tools/browser)); trate el emparejamiento de Node como acceso administrativo, mantenga el Gateway y el host de Node en la misma tailnet y evite exponer los puertos de retransmisión/control a través de la LAN, la Internet pública o Tailscale Funnel.

### Política SSRF del navegador (estricta de forma predeterminada)

Los destinos privados/internos permanecen bloqueados salvo que se habiliten explícitamente.

- Valor predeterminado: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` sin establecer, por lo que los destinos privados/internos/de uso especial permanecen bloqueados. El alias heredado `allowPrivateNetwork` sigue siendo válido.
- Habilitación explícita: establezca `dangerouslyAllowPrivateNetwork: true` para permitir esos destinos.
- En modo estricto, utilice `hostnameAllowlist` (patrones como `*.example.com`) y `allowedHostnames` (excepciones de host exactas, incluidos nombres que de otro modo estarían bloqueados, como `localhost`) para definir excepciones explícitas.
- Las solicitudes de navegación directa se comprueban previamente. Durante la acción y un periodo de gracia limitado posterior a ella, las interacciones protegidas de Playwright (clic, clic por coordenadas, desplazamiento del puntero, arrastre, desplazamiento, selección, pulsación, escritura, rellenado de formularios y evaluación) interceptan las cargas de documentos de nivel superior y de submarcos denegadas por la política antes de que se envíen bytes de solicitudes HTTP y, después, vuelven a comprobar en la medida de lo posible la URL `http(s)` final.
- Antes de cada nuevo inicio administrado de Chrome, OpenClaw deshabilita en la medida de lo posible la predicción de red, lo que impide la conexión previa especulativa observada de Chromium para esas cargas denegadas. Esto constituye defensa en profundidad, no un límite de la política: es posible que un navegador reutilizado después de reiniciar el servicio de control y otros backends de navegador no compartan esta protección. El enrutamiento de páginas sigue siendo una interceptación en el nivel de las solicitudes, no un cortafuegos de red: los saltos de redirección, la primera solicitud de una ventana emergente, el tráfico de Service Worker, el código de página que se ejecuta después del periodo de protección limitado y algunas rutas en segundo plano o de subrecursos pueden eludirla. Las comprobaciones de la URL final siguen siendo una defensa de detección/cuarentena; la prevención completa requiere aislamiento de salida por parte del propietario o un proxy que aplique la política.

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

## Exposición de red

### Vinculación, puerto y cortafuegos

El Gateway multiplexa WebSocket + HTTP en un solo puerto (valor predeterminado `18789`; configuración/marcadores/variables de entorno: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`). Esa superficie HTTP incluye la interfaz de control (recursos de SPA, ruta base predeterminada `/`) y el host de canvas (`/__openclaw__/canvas` y `/__openclaw__/a2ui`; HTML/JS arbitrario; trátelo como contenido no confiable al cargarlo en un navegador normal; no lo exponga a redes/usuarios no confiables ni comparta un origen con superficies web privilegiadas).

`gateway.bind` controla dónde escucha el Gateway:

- `"loopback"` (valor predeterminado): solo pueden conectarse clientes locales.
- `"lan"`, `"tailnet"`, `"custom"`: amplían la superficie de ataque. Utilícelos únicamente con autenticación del Gateway (token/contraseña compartidos o un proxy de confianza configurado correctamente) y un cortafuegos real.

Reglas generales: utilice preferentemente Tailscale Serve en lugar de vinculaciones a la LAN (Serve mantiene el Gateway en el bucle invertido y Tailscale gestiona el acceso); si debe vincularlo a la LAN, limite el puerto mediante el cortafuegos a una lista estricta de direcciones IP de origen permitidas en lugar de aplicar un reenvío de puertos amplio; nunca exponga el Gateway sin autenticación en `0.0.0.0`.

### Publicación de puertos de Docker con UFW

Los puertos de contenedores publicados (`-p HOST:CONTAINER` o `ports:` de Compose) se enrutan mediante las cadenas de reenvío de Docker, no solo mediante las reglas `INPUT` del host. Aplique las reglas en `DOCKER-USER` (evaluadas antes que las propias reglas de aceptación de Docker); la mayoría de las distribuciones modernas utilizan el frontend `iptables-nft`, que también aplica estas reglas al backend nftables.

```bash
# /etc/ufw/after.rules (añadir como su propia sección *filter)
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

IPv6 tiene tablas independientes; añada una política equivalente en `/etc/ufw/after6.rules` si IPv6 de Docker está habilitado. Evite codificar nombres de interfaces de forma fija (`eth0`), ya que varían entre imágenes de VPS (`ens3`, `enp*`, etc.) y una discrepancia puede hacer que se omita silenciosamente la regla de denegación.

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

Los puertos externos esperados deben ser únicamente los que se hayan expuesto intencionadamente (para la mayoría de las configuraciones: SSH + puertos del proxy inverso).

### Detección mDNS/Bonjour

Cuando el Plugin `bonjour` incluido está habilitado, el Gateway anuncia su presencia mediante mDNS (`_openclaw-gw._tcp`, puerto 5353) para permitir la detección de dispositivos locales. El modo completo incluye registros TXT que exponen detalles operativos: `cliPath` (ruta del sistema de archivos que revela el nombre de usuario y la ubicación de instalación), `sshPort` (anuncia la disponibilidad de SSH), `displayName`/`lanHost` (información del nombre de host). La difusión de detalles de la infraestructura facilita el reconocimiento de la LAN.

- Mantenga Bonjour deshabilitado salvo que se necesite la detección en la LAN; se inicia automáticamente en hosts macOS y requiere habilitación explícita en otros sistemas; las URL directas del Gateway, Tailnet, SSH o DNS-SD de área amplia evitan la multidifusión local.
- El **modo mínimo** (valor predeterminado cuando Bonjour está habilitado, recomendado para gateways expuestos) omite los campos confidenciales:

  ```json5
  { discovery: { mdns: { mode: "minimal" } } }
  ```

- El modo **desactivado** impide la detección local y mantiene habilitado el Plugin:

  ```json5
  { discovery: { mdns: { mode: "off" } } }
  ```

- El **modo completo** (habilitación explícita) incluye `cliPath` + `sshPort`:

  ```json5
  { discovery: { mdns: { mode: "full" } } }
  ```

- También puede establecer `OPENCLAW_DISABLE_BONJOUR=1` para deshabilitar mDNS sin modificar la configuración.

En el modo mínimo, el Gateway anuncia `role`, `gatewayPort`, `transport`, pero omite `cliPath`/`sshPort`; las aplicaciones que necesiten la ruta de la CLI pueden obtenerla mediante la conexión WebSocket autenticada.

### Autenticación WebSocket del Gateway

La autenticación del Gateway es obligatoria de forma predeterminada: si no se configura ninguna vía de autenticación válida, el Gateway rechaza las conexiones WebSocket (cierre seguro). La incorporación genera un token de forma predeterminada (incluso para el bucle invertido), por lo que los clientes locales deben autenticarse.

```json5
{ gateway: { auth: { mode: "token", token: "your-token" } } }
```

`openclaw doctor --generate-gateway-token` puede generar uno.

<Note>
`gateway.remote.token` y `gateway.remote.password` son fuentes de credenciales del cliente; por sí solas no protegen el acceso local mediante WS. Las rutas de llamadas locales utilizan `gateway.remote.*` únicamente como alternativa cuando `gateway.auth.*` no está establecido. Si `gateway.auth.token` o `gateway.auth.password` se configuran explícitamente mediante SecretRef y no se resuelven, la resolución falla de forma segura (sin que la alternativa remota oculte el fallo).
</Note>

Fije el TLS remoto con `gateway.remote.tlsFingerprint` cuando utilice `wss://`. Se acepta `ws://` sin cifrar para el bucle invertido, literales de IP privadas, `.local` y URL del Gateway `*.ts.net` de Tailnet; para otros nombres DNS privados de confianza, establezca `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` en el proceso cliente como medida de emergencia (solo en el entorno del proceso, no como clave de `openclaw.json`). El emparejamiento móvil y las rutas manuales/escaneadas del Gateway en Android son más estrictos: solo se permite texto sin cifrar para el bucle invertido, mientras que la LAN privada, el enlace local, `.local` y los nombres de host sin punto deben utilizar TLS, salvo que se habilite explícitamente la ruta de texto sin cifrar para redes privadas de confianza.

El emparejamiento de dispositivos se aprueba automáticamente para las conexiones locales directas mediante bucle invertido (además de una ruta restringida de conexión propia local del backend/contenedor para flujos de ayudantes confiables con secreto compartido); las conexiones de Tailnet y LAN, incluidas las conexiones desde el mismo host a una dirección de la tailnet, se consideran remotas y siguen necesitando aprobación. Una dirección `tailnet` resuelta o una dirección `custom` distinta de `127.0.0.1` o `0.0.0.0` añade un agente de escucha `127.0.0.1` independiente; solo las conexiones a ese agente de escucha local reciben la semántica de bucle invertido. La presencia de encabezados reenviados en una solicitud de bucle invertido impide que se considere local; la aprobación automática de actualizaciones de metadatos tiene un ámbito estrictamente limitado. Consulte [Emparejamiento del Gateway](/es/gateway/pairing).

Modos de autenticación:

- `"token"`: token de portador compartido (recomendado para la mayoría de las configuraciones).
- `"password"`: se recomienda configurarlo mediante `OPENCLAW_GATEWAY_PASSWORD`.
- `"trusted-proxy"`: confía en un proxy inverso con reconocimiento de identidad para autenticar a los usuarios y transmitir la identidad mediante encabezados. Consulta [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth).

Lista de comprobación para la rotación (token/contraseña): genera/configura un secreto nuevo (`gateway.auth.token` o `OPENCLAW_GATEWAY_PASSWORD`); reinicia el Gateway (o la aplicación de macOS si supervisa el Gateway); actualiza los clientes remotos (`gateway.remote.token`/`.password`); verifica que las credenciales anteriores ya no funcionen.

### Encabezados de identidad de Tailscale Serve

Cuando `gateway.auth.allowTailscale` es `true` (valor predeterminado para Serve), OpenClaw acepta el encabezado de identidad de Tailscale Serve `tailscale-user-login` para la autenticación de la interfaz de control/WebSocket. Verifica la identidad resolviendo la dirección `x-forwarded-for` mediante el daemon local de Tailscale (`tailscale whois`) y comparándola con el encabezado; esto solo se activa para solicitudes de bucle local que contengan `x-forwarded-for`, `x-forwarded-proto` y `x-forwarded-host` tal como los inserta Tailscale. Para esta comprobación asíncrona, los intentos fallidos del mismo `{scope, ip}` se serializan antes de que el limitador registre el fallo, por lo que los reintentos incorrectos simultáneos de un cliente de Serve pueden bloquear inmediatamente el segundo intento.

Los endpoints de la API HTTP (`/v1/*`, `/tools/invoke`, `/api/channels/*`) no utilizan la autenticación mediante encabezados de identidad de Tailscale; siguen el modo de autenticación HTTP configurado en el gateway.

La autenticación HTTP mediante token de portador del Gateway equivale, en la práctica, a conceder acceso de operador total o ninguno. Las credenciales que pueden llamar a `/v1/chat/completions`, `/v1/responses`, rutas de plugins como `/api/v1/admin/rpc` o `/api/channels/*` son secretos de operador con acceso total para ese gateway: la autenticación mediante un secreto compartido de portador restaura todos los ámbitos predeterminados del operador (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) y la semántica de propietario para los turnos del agente, y los valores más restringidos de `x-openclaw-scopes` no reducen el acceso de esa ruta de secreto compartido. La semántica de ámbitos por solicitud solo se aplica cuando la solicitud procede de un modo que incluye identidad (autenticación mediante proxy de confianza) o de una entrada privada explícitamente sin autenticación; en esos modos, omitir `x-openclaw-scopes` hace que se utilice el conjunto normal de ámbitos predeterminados del operador, y los encabezados de nivel de propietario como `x-openclaw-model` requieren `operator.admin` cuando se restringen los ámbitos. `/tools/invoke` y los endpoints HTTP del historial de sesiones siguen la misma regla de secreto compartido. No compartas estas credenciales con solicitantes que no sean de confianza; se recomienda utilizar gateways separados para cada límite de confianza.

La autenticación de Serve sin token presupone que el propio host del gateway es de confianza; no protege frente a procesos hostiles ejecutados en el mismo host. Si puede ejecutarse código local que no sea de confianza en el host del gateway, desactiva `allowTailscale` y exige autenticación explícita mediante secreto compartido (`token` o `password`).

No reenvíes estos encabezados desde tu propio proxy inverso. Si finalizas TLS o utilizas un proxy delante del gateway, desactiva `allowTailscale` y utiliza en su lugar autenticación mediante secreto compartido o [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth).

Consulta [Tailscale](/es/gateway/tailscale) y la [descripción general de la web](/es/web).

### Configuración del proxy inverso

Configura `gateway.trustedProxies` para gestionar correctamente la IP reenviada del cliente detrás de nginx/Caddy/Traefik/etc. Cuando el Gateway detecta encabezados de proxy procedentes de una dirección que **no** está en `trustedProxies`, no trata la conexión como local; si la autenticación del gateway está desactivada, la conexión se rechaza. Esto impide que las conexiones mediante proxy parezcan proceder de localhost y reciban confianza automática.

`trustedProxies` también proporciona datos a `gateway.auth.mode: "trusted-proxy"`, que es más estricto: de forma predeterminada, aplica un cierre seguro ante proxies cuyo origen sea el bucle local. Los proxies inversos de bucle local en el mismo host pueden utilizar `trustedProxies` para detectar clientes locales y gestionar las IP reenviadas, pero solo pueden satisfacer el modo de autenticación `trusted-proxy` cuando `gateway.auth.trustedProxy.allowLoopback = true`; de lo contrario, utiliza autenticación mediante token/contraseña.

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # IP del proxy inverso
  allowRealIpFallback: false # valor predeterminado: false; actívalo solo si el proxy no puede proporcionar X-Forwarded-For
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

Cuando se configura `trustedProxies`, el Gateway utiliza `X-Forwarded-For` para determinar la IP del cliente; `X-Real-IP` se ignora a menos que `gateway.allowRealIpFallback: true` se configure explícitamente. Asegúrate de que el proxy **sobrescriba** `X-Forwarded-For`/`X-Real-IP` en lugar de añadir valores:

```nginx
# correcto
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;

# incorrecto: conserva/añade valores no fiables proporcionados por el cliente
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

Los encabezados de proxy de confianza no hacen que el emparejamiento de dispositivos Node se considere automáticamente de confianza: `gateway.nodes.pairing.autoApproveCidrs` es una política de operador independiente, desactivada de forma predeterminada, y las rutas de encabezados de proxy de confianza cuyo origen es el bucle local siguen excluidas de la aprobación automática de Node incluso cuando está activada la autenticación mediante proxy de confianza de bucle local (porque los solicitantes locales pueden falsificar esos encabezados).

### Notas sobre HSTS y el origen

- El gateway de OpenClaw prioriza el acceso local/mediante bucle local. Si finalizas TLS en un proxy inverso, configura HSTS allí.
- Si el propio gateway finaliza HTTPS, `gateway.http.securityHeaders.strictTransportSecurity` emite el encabezado HSTS en las respuestas de OpenClaw.
- De forma predeterminada, los despliegues de la interfaz de control fuera del bucle local requieren `gateway.controlUi.allowedOrigins`; `allowedOrigins: ["*"]` es una política explícita que permite todos los orígenes, no una opción predeterminada reforzada; evítala fuera de pruebas locales estrictamente controladas.
- Los fallos de autenticación del origen del navegador en el bucle local siguen sujetos a límites de frecuencia incluso con la exención general del bucle local activada, pero la clave de bloqueo se limita a cada valor normalizado de `Origin` en lugar de usar un único contenedor compartido para localhost.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` activa el modo de respaldo del origen mediante el encabezado Host; trátalo como una política peligrosa seleccionada por el operador.
- Considera la revinculación de DNS y el comportamiento de los encabezados de host del proxy como aspectos de refuerzo del despliegue; mantén `trustedProxies` restringido y evita exponer el gateway directamente a Internet.
- Guía detallada de despliegue: [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth#tls-termination-and-hsts).

### Interfaz de control mediante HTTP

La interfaz de control necesita un contexto seguro (HTTPS o localhost) para generar la identidad del dispositivo.

- `gateway.controlUi.allowInsecureAuth`: opción de compatibilidad local. En localhost, permite la autenticación de la interfaz de control sin identidad de dispositivo cuando la página se carga mediante HTTP no seguro. No omite las comprobaciones de emparejamiento ni relaja los requisitos de identidad de dispositivos remotos (fuera de localhost). Se recomienda utilizar HTTPS (Tailscale Serve) o abrir la interfaz en `127.0.0.1`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth`: solo para emergencias; desactiva por completo las comprobaciones de identidad del dispositivo. Supone una reducción grave de la seguridad; mantenlo desactivado salvo que estés depurando activamente y puedas revertirlo con rapidez.
- Al margen de esas opciones, un `gateway.auth.mode: "trusted-proxy"` correcto puede admitir sesiones de la interfaz de control de **operador** sin identidad de dispositivo; se trata de un comportamiento intencionado del modo de autenticación, no de un atajo de `allowInsecureAuth`, y no se extiende a las sesiones de la interfaz de control con rol de Node.

`openclaw security audit` muestra una advertencia cuando `allowInsecureAuth` está activado.

### Opciones inseguras/peligrosas

`openclaw security audit` genera `config.insecure_or_dangerous_flags` por cada opción conocida de depuración insegura/peligrosa que esté activada (un hallazgo por opción). Mantenlas sin configurar en producción. Si se configuran supresiones de auditoría, `security.audit.suppressions.active` permanece en la salida activa incluso cuando los hallazgos coincidentes pasan a `suppressedFindings`.

<AccordionGroup>
  <Accordion title="Opciones que la auditoría supervisa actualmente">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `security.audit.suppressions configured (<count>)`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="Todas las claves dangerous*/dangerously* del esquema de configuración">
    Interfaz de control y navegador:
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    Coincidencia de nombres de canales (canales integrados y de plugins; también por `accounts.<accountId>` cuando corresponda):
    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.irc.dangerouslyAllowNameMatching` (canal de plugin)
    - `channels.mattermost.dangerouslyAllowNameMatching` (canal de plugin)
    - `channels.synology-chat.dangerouslyAllowNameMatching` (canal de plugin)
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (canal de plugin)
    - `channels.zalouser.dangerouslyAllowNameMatching` (canal de plugin)

    Exposición de red:
    - `channels.telegram.network.dangerouslyAllowPrivateNetwork` (también por cuenta)

    Docker del entorno aislado (valores predeterminados y por agente):
    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## Despliegue y confianza en el host

- Cifrado completo del disco en el host del gateway; se recomienda una cuenta de usuario específica del sistema operativo para el Gateway si el host es compartido.
- Bloqueo de dependencias de paquetes publicados: los checkouts del código fuente utilizan `pnpm-lock.yaml`; el paquete npm `openclaw` publicado y los paquetes npm de plugins propiedad de OpenClaw incluyen `npm-shrinkwrap.json` para que las instalaciones utilicen el grafo de dependencias transitivas revisado de la versión, en lugar de resolver un grafo nuevo durante la instalación. Se trata de un límite de refuerzo de la cadena de suministro y de reproducibilidad de las versiones, no de un entorno aislado; consulta [npm shrinkwrap](/es/gateway/security/shrinkwrap).
- Operaciones de archivos seguras: OpenClaw utiliza `@openclaw/fs-safe` para el acceso a archivos limitado a la raíz, las escrituras atómicas, la extracción de archivos, los espacios de trabajo temporales y las funciones auxiliares para archivos de secretos. La función auxiliar opcional de Python para POSIX está **desactivada** de forma predeterminada; configura `OPENCLAW_FS_SAFE_PYTHON_MODE=auto` o `require` únicamente si deseas el refuerzo adicional de las modificaciones relativas a descriptores de archivo y puedes disponer de un entorno de ejecución de Python. Detalles: [Operaciones de archivos seguras](/es/gateway/security/secure-file-operations).
- Riesgo de un espacio de trabajo compartido de Slack: si todos los usuarios de Slack pueden enviar mensajes al bot, el principal riesgo es la autoridad delegada sobre las herramientas; cualquier remitente permitido puede inducir llamadas a herramientas (`exec`, navegador, herramientas de red/archivos) dentro de la política del agente, la inyección de instrucciones/contenido por parte de un remitente puede afectar al estado, los dispositivos y las salidas compartidos, y, si el agente compartido tiene credenciales o archivos confidenciales, cualquier remitente permitido puede llegar a provocar su exfiltración mediante el uso de herramientas. Utiliza agentes/gateways separados con un conjunto mínimo de herramientas para los flujos de trabajo de equipos; mantén privados los agentes que contienen datos personales.
- Agente compartido por una empresa (patrón aceptable): es adecuado cuando todas las personas que utilizan el agente pertenecen al mismo límite de confianza (por ejemplo, un equipo de una empresa) y el agente está estrictamente limitado al ámbito empresarial. Ejecútalo en una máquina/VM/contenedor dedicado, utiliza un usuario específico del sistema operativo y un navegador/perfil/cuentas específicos, y no inicies sesión en ese entorno de ejecución con cuentas personales de Apple/Google ni con perfiles personales del gestor de contraseñas o del navegador. Mezclar identidades personales y empresariales en el mismo entorno de ejecución elimina la separación y aumenta el riesgo de exposición de datos personales.

## Secretos en el disco

Presupón que cualquier elemento situado en `~/.openclaw/` (o `$OPENCLAW_STATE_DIR/`) puede contener secretos o datos privados:

| Ruta                                           | Contenido                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.json`                                | La configuración puede incluir tokens (del gateway y del gateway remoto), ajustes de proveedores y listas de permitidos.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `credentials/**`                               | Credenciales de canales (por ejemplo, credenciales de WhatsApp), listas de permitidos para el emparejamiento e importaciones de OAuth heredadas.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `agents/<agentId>/agent/auth-profiles.json`    | Claves de API, perfiles de tokens, tokens de OAuth y, opcionalmente, `keyRef`/`tokenRef`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `agents/<agentId>/agent/codex-home/**`         | Cuenta del servidor de aplicaciones de Codex por agente, configuración, Skills, plugins, estado nativo de los hilos y diagnósticos (predeterminado).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `$CODEX_HOME/**` o `~/.codex/**`              | Estado del entorno de ejecución nativo de Codex. El arnés ordinario solo accede a él con `plugins.entries.codex.config.appServer.homeScope: "user"` explícito. La conexión de supervisión independiente accede a él cuando el ámbito de inicio resuelto es `"user"`, que es el valor predeterminado para stdio o Unix cuando no se establece. Contiene la cuenta nativa de Codex, la configuración, los plugins y el almacén de hilos. La supervisión enumera los metadatos de origen y conserva en esa conexión la rama nativa canónica de un chat continuado y sus turnos posteriores; la creación de ramas copia un historial persistente y limitado del usuario y el asistente en un chat de OpenClaw autenticado y bloqueado a un modelo. Habilítelo únicamente para un Gateway controlado por su propietario. Consulte [arnés de Codex](/es/plugins/codex-harness#share-threads-with-codex-desktop-and-cli) y [supervisión de Codex](/es/plugins/codex-supervision). |
| `secrets.json` (opcional)                      | Carga secreta respaldada por un archivo que utilizan los proveedores SecretRef `file` (`secrets.providers`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `agents/<agentId>/agent/auth.json`             | Archivo de compatibilidad heredado; las entradas estáticas `api_key` se depuran al detectarse.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | Estado del entorno de ejecución por agente, incluidas las filas de sesiones y las transcripciones que pueden contener mensajes privados y salidas de herramientas.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `agents/<agentId>/sessions/**`                 | Fuentes y archivos de migración de sesiones heredadas que pueden contener mensajes privados y salidas de herramientas.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| paquetes de plugins incluidos                        | Plugins instalados (además de sus `node_modules/`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sandboxes/**`                                 | Espacios de trabajo del entorno aislado de herramientas; pueden acumular copias de los archivos leídos o escritos dentro del entorno aislado.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

### Mapa de almacenamiento de credenciales

También resulta útil para tomar decisiones sobre las copias de seguridad:

- WhatsApp: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- Token del bot de Telegram: configuración/entorno o `channels.telegram.tokenFile` (solo archivos normales; se rechazan los enlaces simbólicos)
- Token del bot de Discord: configuración/entorno o SecretRef (proveedores de entorno/archivo/ejecución)
- Tokens de Slack: configuración/entorno (`channels.slack.*`)
- Listas de permitidos para el emparejamiento: `~/.openclaw/credentials/<channel>-allowFrom.json` (cuenta predeterminada) / `<channel>-<accountId>-allowFrom.json` (cuentas no predeterminadas)
- Perfiles de autenticación de modelos: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importación de OAuth heredada: `~/.openclaw/credentials/oauth.json`

Refuerzo: mantenga permisos restrictivos (`700` en los directorios, `600` en los archivos); utilice cifrado de disco completo en el host del gateway; si el host es compartido, es preferible usar una cuenta de usuario del sistema operativo dedicada.

### Permisos de archivos

- `~/.openclaw/openclaw.json`: `600` (solo lectura y escritura para el usuario)
- `~/.openclaw`: `700` (solo el usuario)

`openclaw doctor` puede advertir sobre estos permisos y ofrecer restringirlos.

### Archivos `.env` del espacio de trabajo

OpenClaw carga archivos `.env` locales del espacio de trabajo para los agentes y las herramientas, pero nunca permite que sustituyan silenciosamente los controles del entorno de ejecución del gateway:

- Las variables de entorno de credenciales del proveedor se bloquean en los archivos `.env` de espacios de trabajo no confiables; por ejemplo, `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY` y las claves de autenticación de proveedores declaradas por plugins confiables instalados. En su lugar, coloque las credenciales del proveedor en el entorno del proceso del Gateway, `~/.openclaw/.env` (`$OPENCLAW_STATE_DIR/.env`), el bloque `env` de la configuración o una importación opcional del shell de inicio de sesión.
- Toda clave que comience por `OPENCLAW_` se bloquea en los archivos `.env` de espacios de trabajo no confiables, reservando todo el espacio de nombres del entorno de ejecución para que un futuro control `OPENCLAW_*` adopte de forma predeterminada una política de cierre seguro ante fallos, en lugar de poder heredarse silenciosamente del contenido `.env` incluido en el repositorio o proporcionado por un atacante.
- La configuración de enrutamiento de endpoints de canales y proveedores también se bloquea en las anulaciones `.env` del espacio de trabajo (por ejemplo, `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`, `AZURE_SPEECH_ENDPOINT` y otras claves que terminan en `_ENDPOINT`), para que un espacio de trabajo clonado no pueda redirigir el tráfico de los conectores incluidos mediante una configuración local de endpoints. Esta configuración debe proceder del entorno del proceso del Gateway, el archivo dotenv global del entorno de ejecución, la configuración explícita o `env.shellEnv`.
- Las variables de entorno confiables del proceso o del sistema operativo, el archivo dotenv global del entorno de ejecución, la configuración `env` y la importación habilitada del shell de inicio de sesión siguen aplicándose; esto solo restringe la carga de archivos `.env` del espacio de trabajo.

Los archivos `.env` del espacio de trabajo suelen estar junto al código del agente, se incluyen por accidente en el repositorio o los escriben herramientas; bloquear las credenciales de proveedores impide que un espacio de trabajo clonado sustituya las cuentas del proveedor por cuentas controladas por un atacante.

### Registros y transcripciones

OpenClaw almacena las transcripciones de las sesiones en el disco, en `~/.openclaw/agents/<agentId>/sessions/*.jsonl`, para mantener la continuidad de las sesiones y permitir la indexación opcional de la memoria; cualquier proceso o usuario con acceso al sistema de archivos puede leerlas. Considere el acceso al disco como el límite de confianza y restrinja los permisos de `~/.openclaw`; ejecute los agentes con usuarios del sistema operativo o hosts separados para obtener un aislamiento más sólido.

Los registros del Gateway pueden incluir resúmenes de herramientas, errores y URL; las transcripciones de las sesiones pueden incluir secretos pegados, contenido de archivos, salida de comandos y enlaces.

- Mantenga activada la ocultación de datos sensibles en registros y transcripciones (`logging.redactSensitive: "tools"`, valor predeterminado).
- Añada patrones personalizados para su entorno mediante `logging.redactPatterns` (tokens, nombres de host, URL internas).
- Al compartir diagnósticos, utilice preferentemente `openclaw status --all` (se puede pegar y oculta los secretos) en lugar de los registros sin procesar.
- Elimine las transcripciones de sesiones y los archivos de registro antiguos si no necesita conservarlos durante mucho tiempo.

Detalles: [Registros](/es/gateway/logging)

## Configuración básica segura (copiar y pegar)

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

Mantiene el Gateway privado, exige el emparejamiento de mensajes directos y evita que los bots de grupo estén siempre activos. Para que la ejecución de herramientas también sea más segura, añada un sandbox y deniegue las herramientas peligrosas a cualquier agente que no sea el propietario (consulte «Perfiles de acceso por agente» más arriba).

### Números separados (WhatsApp, Signal, Telegram)

Para los canales basados en números de teléfono, considere ejecutar el asistente con un número distinto del personal, de modo que las conversaciones personales permanezcan privadas y el número del bot gestione la automatización con sus propios límites.

## Respuesta ante incidentes

### Contención

1. Detenga el sistema: cierre la aplicación de macOS (si supervisa el Gateway) o termine el proceso `openclaw gateway`.
2. Cierre la exposición: establezca `gateway.bind: "loopback"` (o desactive Tailscale Funnel/Serve) hasta comprender qué ocurrió.
3. Restrinja el acceso: cambie los mensajes directos o grupos de riesgo a `dmPolicy: "disabled"`, exija menciones y elimine todas las entradas `"*"` que permitan el acceso general.

### Rotación (suponga que hay una vulneración si se filtraron secretos)

1. Rote la autenticación del Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) y reinícielo.
2. Rote los secretos de los clientes remotos (`gateway.remote.token` / `.password`) en toda máquina que pueda llamar al Gateway.
3. Rote las credenciales del proveedor o de la API (credenciales de WhatsApp, tokens de Slack/Discord, claves de modelos o API en `auth-profiles.json` y valores de cargas útiles de secretos cifrados cuando se utilicen).

### Auditoría

1. Compruebe los registros del Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (o `logging.file`).
2. Revise las transcripciones pertinentes: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Revise los cambios recientes de configuración que podrían haber ampliado el acceso: `gateway.bind`, `gateway.auth`, políticas de mensajes directos o grupos, `tools.elevated` y cambios en plugins.
4. Vuelva a ejecutar `openclaw security audit --deep` y confirme que se hayan resuelto los hallazgos críticos.

### Recopilación de datos para un informe

- Marca temporal, sistema operativo del host del Gateway y versión de OpenClaw.
- Las transcripciones de las sesiones y un breve fragmento final del registro (después de ocultar los datos sensibles).
- Qué envió el atacante y qué hizo el agente.
- Si el Gateway estaba expuesto más allá de la interfaz de bucle invertido (LAN/Tailscale Funnel/Serve).

## Análisis de secretos

El sistema de integración continua ejecuta el hook de preconfirmación `detect-private-key` en el repositorio. Si falla, elimine o rote el material de claves incluido en el repositorio y, a continuación, reproduzca el problema localmente:

```bash
pre-commit run --all-files detect-private-key
```

## Notificación de problemas de seguridad

¿Ha encontrado una vulnerabilidad en OpenClaw? Notifíquela de forma responsable:

1. Correo electrónico: [security@openclaw.ai](mailto:security@openclaw.ai)
2. No la publique hasta que se haya corregido.
3. Reconoceremos su contribución (a menos que prefiera permanecer en el anonimato).
