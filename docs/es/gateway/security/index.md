---
read_when:
    - Añadir funciones que amplían el acceso o la automatización
summary: Consideraciones de seguridad y modelo de amenazas para ejecutar un gateway de IA con acceso al shell
title: Seguridad
x-i18n:
    generated_at: "2026-07-19T01:54:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eba4a7196aaf1be0d9e94011f76cb802568686d4af69e24467b87edc472b2738
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **Modelo de confianza del asistente personal.** Estas directrices presuponen un límite de
  operador de confianza por gateway (modelo de asistente personal de un solo usuario).
  OpenClaw **no** es un límite de seguridad multiinquilino hostil para varios
  usuarios adversarios que comparten un agente o gateway. Para operaciones con confianza
  mixta o usuarios adversarios, separe los límites de confianza: gateway +
  credenciales independientes y, preferiblemente, usuarios del SO o hosts independientes.
</Warning>

## Alcance: modelo de seguridad del asistente personal

- Compatible: un usuario/límite de confianza por gateway (preferiblemente un usuario del SO/host/VPS por límite).
- No compatible: un gateway/agente compartido que utilizan usuarios que no confían entre sí o que son adversarios.
- El aislamiento de usuarios adversarios requiere gateways independientes (y, preferiblemente, usuarios del SO/hosts independientes).
- Si varios usuarios que no son de confianza pueden enviar mensajes a un agente con herramientas habilitadas, comparten la autoridad de herramientas delegada de ese agente.
- Si alguien puede modificar el estado o la configuración del host del Gateway (`~/.openclaw`, incluido `openclaw.json`), debe considerarse un operador de confianza.
- Dentro de un Gateway, el acceso autenticado del operador es un rol de confianza del plano de control, no un rol de inquilino por usuario.
- `sessionKey` (identificadores y etiquetas de sesión) es un selector de enrutamiento, no un token de autorización.

¿Aloja varios usuarios u organizaciones? Ejecute una célula de Gateway aislada por inquilino en lugar de compartir un Gateway. Consulte [Alojamiento multiinquilino](/es/gateway/multi-tenant-hosting).

Antes de cambiar el acceso remoto, la política de mensajes directos, el proxy inverso o la exposición pública, siga el [procedimiento de exposición del Gateway](/es/gateway/security/exposure-runbook) como lista de comprobación previa y de reversión.

## `openclaw security audit`

Ejecute lo siguiente después de cualquier cambio de configuración o antes de exponer superficies de red:

```bash
openclaw security audit
openclaw security audit --deep    # intenta realizar una comprobación en vivo del Gateway
openclaw security audit --fix     # aplica correcciones seguras
openclaw security audit --json
```

`--fix` tiene un alcance deliberadamente limitado: cambia las políticas de grupos abiertos por listas de permitidos, restaura `logging.redactSensitive: "tools"`, restringe los permisos de los archivos de estado, configuración e inclusión (archivos `600`, directorios `700`) y, en Windows, restablece las ACL en lugar de utilizar `chmod` de POSIX.

### Qué comprueba la auditoría (a grandes rasgos)

- **Acceso entrante**: políticas de mensajes directos/grupos y listas de permitidos: ¿pueden personas desconocidas activar el bot?
- **Radio de impacto de las herramientas**: herramientas elevadas + salas abiertas: ¿podría una inyección de instrucciones convertirse en acciones de shell, archivos o red?
- **Desviación del sistema de archivos de ejecución**: herramientas que modifican el sistema de archivos denegadas mientras `exec`/`process` siguen disponibles sin restricciones de sandbox.
- **Desviación de las aprobaciones de ejecución**: `security="full"`, `autoAllowSkills`, listas de intérpretes permitidos sin `strictInlineEval`. `security="full"` por sí solo es una advertencia general sobre la postura, no una prueba de un error: es el valor predeterminado elegido para configuraciones de asistente personal de confianza; restrínjalo únicamente cuando el modelo de amenazas requiera barreras de aprobación o listas de permitidos.
- **Exposición de red**: enlace/autenticación del Gateway, Serve/Funnel de Tailscale y tokens de autenticación débiles o cortos.
- **Exposición del control del navegador**: nodos remotos, puertos de retransmisión y endpoints CDP remotos.
- **Higiene del disco local**: permisos, enlaces simbólicos, inclusiones de configuración y rutas de carpetas sincronizadas.
- **Plugins**: carga sin una lista de permitidos explícita.
- **Desviación de políticas**: configuración de Docker para el sandbox con el modo sandbox desactivado; entradas `gateway.nodes.denyCommands` que parecen eficaces, pero solo coinciden con identificadores exactos de comandos (por ejemplo, `system.run`), no con el texto del shell dentro de la carga útil; entradas `gateway.nodes.allowCommands` peligrosas; `tools.profile="minimal"` global reemplazado por agente; herramientas propiedad de plugins accesibles mediante una política permisiva.
- **Desviación de las expectativas del entorno de ejecución**: suponer que la ejecución implícita aún significa `sandbox` cuando `tools.exec.host` ahora tiene como valor predeterminado `auto`, o establecer `tools.exec.host="sandbox"` mientras el modo sandbox está desactivado.
- **Higiene de modelos**: advierte sobre modelos antiguos configurados (advertencia leve, no un bloqueo estricto).

Cada hallazgo tiene un `checkId` estructurado (por ejemplo, `gateway.bind_no_auth`, `tools.exec.security_full_configured`). Prefijos: `fs.*` (permisos), `gateway.*` (enlace/autenticación/Tailscale/interfaz de control/proxy de confianza), `hooks.*`/`browser.*`/`sandbox.*`/`tools.exec.*` (refuerzo por superficie), `plugins.*`/`skills.*` (cadena de suministro), `security.exposure.*` (política de acceso × radio de impacto de las herramientas). Para consultar el catálogo completo con la gravedad y la compatibilidad con correcciones automáticas, consulte [Comprobaciones de auditoría de seguridad](/es/gateway/security/audit-checks). Consulte también [Verificación formal](/es/security/formal-verification).

### Orden de prioridad al clasificar los hallazgos

1. Cualquier elemento «abierto» + herramientas habilitadas: restrinja primero los mensajes directos/grupos (emparejamiento/listas de permitidos) y, después, la política de herramientas y el uso del sandbox.
2. Exposición a redes públicas (enlace a LAN, Funnel, ausencia de autenticación): corríjala inmediatamente.
3. Exposición remota del control del navegador: trátela como acceso de operador (solo tailnet, empareje los nodos deliberadamente, sin exposición pública).
4. Permisos: el estado, la configuración, las credenciales y la autenticación no deben poder ser leídos por el grupo ni por cualquier usuario.
5. Plugins: cargue únicamente aquellos en los que confíe explícitamente.
6. Elección del modelo: prefiera modelos modernos y reforzados frente a instrucciones maliciosas para cualquier bot con herramientas.

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

Mantiene el Gateway únicamente en local, aísla los mensajes directos y deshabilita de forma predeterminada las herramientas del plano de control y del entorno de ejecución. A partir de ahí, vuelva a habilitar herramientas de forma selectiva para cada agente de confianza.

Configuración base integrada para los turnos de agente iniciados mediante chat: los remitentes que no sean propietarios no pueden utilizar las herramientas `cron` ni `gateway`, independientemente de la configuración.

## Matriz de límites de confianza

Modelo rápido para clasificar informes de riesgos:

| Límite o control                                           | Qué significa                                               | Interpretación errónea habitual                                                      |
| --------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `gateway.auth` (token/contraseña/proxy de confianza/autenticación del dispositivo) | Autentica a quienes llaman a las API del gateway            | «Necesita firmas por mensaje en cada trama para ser seguro»                          |
| `sessionKey`                                              | Clave de enrutamiento para seleccionar el contexto o la sesión | «La clave de sesión es un límite de autenticación de usuario»                        |
| Barreras para instrucciones/contenido                     | Reducen el riesgo de abuso del modelo                        | «La inyección de instrucciones por sí sola demuestra una omisión de la autenticación» |
| `canvas.eval` / evaluación del navegador                  | Capacidad deliberada del operador cuando está habilitada    | «Cualquier primitiva de evaluación de JS es automáticamente una vulnerabilidad en este modelo de confianza» |
| Shell `!` de la TUI local                                | Ejecución local iniciada explícitamente por el operador     | «El comando práctico del shell local es una inyección remota»                        |
| Emparejamiento y comandos de nodos                        | Ejecución remota a nivel de operador en dispositivos emparejados | «El control remoto del dispositivo debe tratarse de forma predeterminada como acceso de un usuario no fiable» |
| `gateway.nodes.pairing.autoApproveCidrs`                  | Política opcional de incorporación de nodos de una red de confianza | «Una lista de permitidos deshabilitada de forma predeterminada es automáticamente una vulnerabilidad de emparejamiento» |
| `gateway.nodes.pairing.sshVerify`                         | Incorporación de nodos verificada mediante claves a través del SSH del operador | «La aprobación automática habilitada de forma predeterminada es automáticamente una vulnerabilidad de emparejamiento» |

## No son vulnerabilidades por diseño

<Accordion title="Hallazgos habituales cerrados sin acción">

- Cadenas basadas únicamente en inyección de instrucciones sin eludir políticas, autenticación ni el sandbox.
- Afirmaciones que presuponen una operación multiinquilino hostil en un único host o una única configuración compartidos.
- Acceso normal del operador a rutas de lectura (por ejemplo, `sessions.list` / `sessions.preview` / `chat.history`) clasificado como IDOR en una configuración de gateway compartido.
- Hallazgos de implementaciones limitadas a localhost (por ejemplo, la ausencia de HSTS en un gateway limitado a la interfaz de bucle invertido).
- Hallazgos sobre firmas de Webhook entrantes de Discord para rutas entrantes que no existen en este repositorio.
- Metadatos de emparejamiento de nodos tratados como una segunda capa oculta de aprobación por comando para `system.run`; el límite real de ejecución es la política global de comandos de nodos del gateway junto con las propias aprobaciones de ejecución del nodo.
- `gateway.nodes.pairing.sshVerify` tratado como una vulnerabilidad porque está habilitado de forma predeterminada. Nunca aprueba basándose únicamente en la ubicación de red o en la accesibilidad mediante SSH: el gateway vuelve a leer la identidad del dispositivo a través de SSH (BatchMode, claves de host estrictas) y solo aprueba si la clave del dispositivo coincide exactamente con la solicitud pendiente, lo que requiere que el par de claves de conexión ya se encuentre en la cuenta del operador en un host controlado por este. Las comprobaciones están limitadas a direcciones de origen privadas/CGNAT, comparten el requisito mínimo de aptitud de CIDR de confianza (solo `role: node` recientes y sin ámbitos) y `sshVerify: false` desactiva la función.
- `gateway.nodes.pairing.autoApproveCidrs` tratado por sí solo como una vulnerabilidad. Está deshabilitado de forma predeterminada, requiere entradas CIDR/IP explícitas, solo se aplica al primer emparejamiento `role: node` sin ámbitos solicitados y nunca aprueba automáticamente al operador/navegador/interfaz de control, WebChat, ampliaciones de roles/ámbitos, cambios de metadatos o claves públicas ni rutas de encabezados de proxy de confianza de bucle invertido en el mismo host (incluso cuando está habilitada la autenticación mediante proxy de confianza de bucle invertido).
- Hallazgos de «falta de autorización por usuario» que tratan `sessionKey` como un token de autenticación.

</Accordion>

## Confianza del Gateway y los nodos

Trate el Gateway y el nodo como un único dominio de confianza del operador con funciones diferentes:

- **Gateway**: plano de control y superficie de políticas (`gateway.auth`, política de herramientas, enrutamiento).
- **Nodo**: superficie de ejecución remota emparejada con ese Gateway (comandos, acciones del dispositivo, capacidades locales del host).
- Quien se autentica en el Gateway es de confianza dentro del ámbito del Gateway; tras el emparejamiento, las acciones del nodo son acciones de un operador de confianza en ese nodo. Consulte [Ámbitos del operador](/es/gateway/operator-scopes).
- Los clientes directos del backend de bucle invertido autenticados con el token o la contraseña compartidos del gateway pueden realizar RPC internos del plano de control sin presentar la identidad de un dispositivo de usuario. Esto no omite el emparejamiento remoto ni el del navegador: los clientes de red, los clientes de nodos, los clientes con token de dispositivo y las identidades de dispositivo explícitas siguen sujetos a la aplicación del emparejamiento y de las ampliaciones de ámbito.
- Las aprobaciones de ejecución (lista de permitidos + solicitud) son barreras para la intención del operador, no aislamiento multiinquilino hostil. Vinculan el contexto exacto de la solicitud y, en la medida de lo posible, los operandos directos de archivos locales; no modelan semánticamente todas las rutas de carga de entornos de ejecución o intérpretes. Utilice el sandbox y el aislamiento del host para establecer límites sólidos.
- Valor predeterminado para un único operador de confianza: la ejecución en el host mediante `gateway`/`node` se permite sin solicitudes de aprobación (`security="full"`, `ask="off"`). Esto es una decisión deliberada de experiencia de usuario, no una vulnerabilidad por sí sola.

Para aislar a usuarios hostiles, separe los límites de confianza por usuario del SO/host y ejecute gateways independientes.

## Modelo de amenazas

Tu asistente de IA puede ejecutar comandos de shell arbitrarios, leer/escribir archivos, acceder a servicios de red y enviar mensajes a cualquier persona (si se le concede acceso al canal). Quienes le envíen mensajes pueden intentar engañarlo para que haga cosas perjudiciales, obtener acceso a tus datos mediante ingeniería social o sondear detalles de la infraestructura.

La mayoría de los fallos aquí no son vulnerabilidades exóticas, sino casos en los que «alguien envió un mensaje al bot y el bot hizo lo que se le pidió». La postura de OpenClaw, en orden:

1. **Primero, la identidad**: decide quién puede comunicarse con el bot (emparejamiento de mensajes directos/listas de permitidos/«apertura» explícita).
2. **Después, el alcance**: decide dónde puede actuar el bot (listas de permitidos de grupos + activación mediante mención, herramientas, aislamiento y permisos del dispositivo).
3. **Por último, el modelo**: da por hecho que el modelo puede ser manipulado; diseña el sistema de modo que la manipulación tenga un radio de impacto limitado.

## Acceso mediante mensajes directos: emparejamiento, lista de permitidos, abierto, deshabilitado

Cada canal compatible con mensajes directos admite `dmPolicy` (o `*.dm.policy`), que controla los mensajes directos entrantes antes de procesarlos:

| Política      | Comportamiento                                                                                                                                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pairing`   | Valor predeterminado. Los remitentes desconocidos reciben un código de emparejamiento; el bot los ignora hasta que se aprueban. Los códigos caducan después de 1 hora; los mensajes directos repetidos no vuelven a enviar un código hasta que se crea una nueva solicitud. Las solicitudes pendientes están limitadas a 3 por canal. |
| `allowlist` | Los remitentes desconocidos quedan bloqueados, sin proceso de emparejamiento.                                                                                                                                                                       |
| `open`      | Cualquiera puede enviar mensajes directos (público). Requiere que la lista de permitidos del canal incluya `"*"` (aceptación explícita).                                                                                                                           |
| `disabled`  | Los mensajes directos entrantes se ignoran por completo.                                                                                                                                                                                        |

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Detalles y archivos en disco: [Emparejamiento](/es/channels/pairing)

Trata `dmPolicy="open"` y `groupPolicy="open"` como opciones de último recurso; prefiere el emparejamiento y las listas de permitidos, salvo que confíes plenamente en todos los miembros de la sala.

### Listas de permitidos (dos capas)

- **Lista de permitidos de mensajes directos** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; heredados: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): quién puede enviar mensajes directos al bot. Cuando `dmPolicy="pairing"`, las aprobaciones se escriben en `~/.openclaw/credentials/<channel>-allowFrom.json` (cuenta predeterminada) o `<channel>-<accountId>-allowFrom.json` (cuentas no predeterminadas) y se combinan con las listas de permitidos de la configuración.
- **Lista de permitidos de grupos** (específica del canal): qué grupos/canales/servidores acepta el bot.
  - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: valores predeterminados por grupo, como `requireMention`; cuando se establecen, también actúan como lista de permitidos de grupos (incluye `"*"` para conservar el comportamiento de permitir todo). Personaliza los activadores de mención con `agents.list[].groupChat.mentionPatterns` (por ejemplo, `["@openclaw", "@mybot"]`) para que `requireMention` se active con los nombres que uses para el bot.
  - `groupPolicy="allowlist"` + `groupAllowFrom`: restringe quién puede activar el bot dentro de una sesión de grupo (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
  - `channels.discord.guilds` / `channels.slack.channels`: listas de permitidos por superficie + valores predeterminados de menciones.
  - Orden de comprobación: primero `groupPolicy`/listas de permitidos de grupos y, después, activación por mención/respuesta. Responder a un mensaje del bot (mención implícita) **no** omite `groupAllowFrom`.

Detalles: [Configuración](/es/gateway/configuration) y [Grupos](/es/channels/groups)

### Aislamiento de sesiones de mensajes directos (modo multiusuario)

De forma predeterminada, OpenClaw dirige todos los mensajes directos a la sesión principal para mantener la continuidad entre dispositivos. Si varias personas pueden enviar mensajes directos al bot (mensajes directos abiertos o una lista de permitidos con varias personas), aísla las sesiones de mensajes directos:

```json5
{ session: { dmScope: "per-channel-peer" } }
```

Valores de `session.dmScope`:

| Valor                      | Alcance                                                                  |
| -------------------------- | ---------------------------------------------------------------------- |
| `main` (valor predeterminado de la configuración)    | Todos los mensajes directos comparten una sesión.                                             |
| `per-channel-peer`         | Cada pareja de canal+remitente recibe un contexto aislado de mensajes directos (modo seguro de mensajes directos). |
| `per-account-channel-peer` | Como el anterior, pero con una división adicional por cuenta (canales con varias cuentas).         |
| `per-peer`                 | Cada remitente recibe una sesión en todos los canales del mismo tipo.     |

La incorporación mediante la CLI local conserva un `session.dmScope` explícito y, de lo contrario, lo deja sin establecer, por lo que se aplica el valor predeterminado `"main"`: todos los mensajes directos de todos los canales comparten la sesión principal continua del agente (el valor predeterminado de un agente personal). Para bandejas de entrada compartidas o multiusuario, establece `session.dmScope: "per-channel-peer"`; `openclaw security audit` recomienda el aislamiento cuando detecta tráfico de mensajes directos de varios usuarios.

Este es un límite del contexto de mensajería, no un límite administrativo del host. Si los usuarios son potencialmente hostiles entre sí y comparten el mismo host/configuración del Gateway, ejecuta gateways separados para cada límite de confianza.

Si la misma persona se pone en contacto mediante varios canales, usa `session.identityLinks` para unificar esas sesiones de mensajes directos en una identidad canónica. Consulta [Gestión de sesiones](/es/concepts/session) y [Configuración](/es/gateway/configuration).

## Visibilidad del contexto frente a autorización de activación

Dos conceptos distintos:

- **Autorización de activación**: quién puede activar el agente (`dmPolicy`, `groupPolicy`, listas de permitidos, activadores mediante mención).
- **Visibilidad del contexto**: qué contexto complementario recibe el modelo (cuerpo de la respuesta, texto citado, historial del hilo, metadatos reenviados).

`contextVisibility` controla el segundo:

- `"all"` (valor predeterminado): el contexto complementario se conserva tal como se recibió.
- `"allowlist"`: el contexto complementario se filtra para incluir únicamente a los remitentes permitidos por las comprobaciones activas de las listas de permitidos.
- `"allowlist_quote"`: como `allowlist`, pero conserva una respuesta citada explícita.

Configúralo por canal o por sala/conversación; consulta [Grupos](/es/channels/groups#context-visibility-and-allowlists). Los informes que solo muestran que «el modelo puede ver texto citado/histórico de remitentes que no están en la lista de permitidos» son hallazgos de refuerzo de seguridad que pueden abordarse con `contextVisibility`, no omisiones de autenticación ni del aislamiento por sí mismos; un informe con impacto en la seguridad sigue necesitando demostrar que se ha traspasado un límite de confianza.

## Inyección de instrucciones

Un atacante crea un mensaje que manipula el modelo para que realice una acción insegura («ignora tus instrucciones», «vuelca tu sistema de archivos», «sigue este enlace y ejecuta comandos»). La inyección de instrucciones **no se resuelve** únicamente con medidas de protección en las instrucciones del sistema: estas son directrices flexibles; la aplicación estricta proviene de la política de herramientas, las aprobaciones de ejecución, el aislamiento y las listas de permitidos de los canales (que los operadores pueden deshabilitar deliberadamente).

La inyección de instrucciones no requiere mensajes directos públicos: aunque solo tú puedas enviar mensajes al bot, cualquier **contenido que no sea de confianza** que lea (resultados de búsquedas/consultas web, páginas del navegador, correos electrónicos, documentos, archivos adjuntos, registros o código pegados) puede contener instrucciones maliciosas. El propio contenido constituye una superficie de amenaza, no solo el remitente.

Señales de alerta que deben tratarse como contenido no confiable:

- «Lee este archivo/URL y haz exactamente lo que indica».
- «Ignora las instrucciones del sistema o las reglas de seguridad».
- «Revela tus instrucciones ocultas o los resultados de las herramientas».
- «Pega el contenido completo de ~/.openclaw o de tus registros».

Medidas útiles en la práctica:

- Mantén restringidos los mensajes directos entrantes (emparejamiento/listas de permitidos); prefiere la activación mediante mención en los grupos; evita los bots permanentemente activos en salas públicas.
- Trata los enlaces, archivos adjuntos e instrucciones pegadas como contenido hostil de forma predeterminada.
- Ejecuta las herramientas sensibles en un entorno aislado; mantén los secretos fuera del sistema de archivos al que puede acceder el agente. El aislamiento es opcional: si el modo de aislamiento está desactivado, el valor implícito `host=auto` se resuelve como el host del Gateway, mientras que el valor explícito `host=sandbox` sigue provocando un cierre seguro (no hay disponible un entorno de ejecución aislado). Establece `host=gateway` para hacer explícito ese comportamiento en la configuración.
- Limita las herramientas de alto riesgo (`exec`, `browser`, `web_fetch`, `web_search`) a agentes de confianza o listas de permitidos explícitas.
- Si incluyes intérpretes en la lista de permitidos (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), habilita `tools.exec.strictInlineEval` para que las formas de evaluación en línea (`-c`, `-e` y similares) sigan requiriendo aprobación explícita. En el modo de lista de permitidos, cualquier segmento heredoc (`<<`) siempre requiere la aprobación de una persona revisora o una aprobación explícita, independientemente de cómo se entrecomille: un comando incluido en la lista de permitidos no puede utilizar el cuerpo de un heredoc para eludir la revisión de la lista.
- Reduce el radio de impacto mediante un **agente lector** de solo lectura o sin herramientas para resumir contenido que no sea de confianza y, después, pasa el resumen al agente principal.
- Para los hooks de Gmail, la sesión integrada por mensaje aísla el contexto de la conversación, pero no elimina los permisos de herramientas ni del espacio de trabajo del agente de destino. Dirige el correo que no sea de confianza a un agente lector dedicado, aplica [restricciones de aislamiento y herramientas por agente](/es/tools/multi-agent-sandbox-tools) y limita cualquier transferencia al agente principal mediante [`tools.agentToAgent`](/es/gateway/config-tools#toolsagenttoagent). Consulta la [integración con Gmail](/es/gateway/configuration-reference#gmail-integration).
- Mantén `web_search` / `web_fetch` / `browser` desactivados para los agentes con herramientas, salvo que sean necesarios.
- Para entradas de URL de OpenResponses (`input_file` / `input_image`), establece valores estrictos de `gateway.http.endpoints.responses.files.urlAllowlist` / `images.urlAllowlist` y mantén `maxUrlParts` bajo (las listas de permitidos vacías se consideran no establecidas). Usa `files.allowUrl: false` / `images.allowUrl: false` para deshabilitar por completo la consulta de URL.
- Mantén los secretos fuera de las instrucciones; pásalos mediante variables de entorno/configuración en el host del Gateway.

**La elección del modelo importa.** La resistencia a la inyección de instrucciones no es uniforme entre los distintos niveles de modelos: los modelos más pequeños/baratos son más susceptibles al uso indebido de herramientas y al secuestro de instrucciones mediante instrucciones maliciosas.

<Warning>
Para agentes con herramientas o agentes que leen contenido que no sea de confianza, el riesgo de inyección de instrucciones con modelos antiguos/más pequeños suele ser demasiado alto. No ejecutes esas cargas de trabajo en niveles de modelos poco potentes.
</Warning>

- Usa el modelo de última generación y del mejor nivel para cualquier bot que pueda ejecutar herramientas o acceder a archivos/redes.
- No uses niveles antiguos/menos potentes/más pequeños para agentes con herramientas o bandejas de entrada que no sean de confianza.
- Si debes usar un modelo más pequeño, reduce el radio de impacto: herramientas de solo lectura, aislamiento estricto, acceso mínimo al sistema de archivos y listas de permitidos estrictas. Habilita el aislamiento para todas las sesiones y deshabilita `web_search`/`web_fetch`/`browser`, salvo que las entradas estén estrictamente controladas.
- Para asistentes personales exclusivamente de chat, con entradas de confianza y sin herramientas, los modelos más pequeños suelen ser adecuados.

### Contenido externo y encapsulado de entradas que no son de confianza

El texto de OpenResponses `input_file` se sigue inyectando como contenido externo no confiable aunque el Gateway lo decodifique localmente: el bloque contiene marcadores de límite `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` junto con metadatos `Source: External` (esta ruta omite el banner más largo `SECURITY NOTICE:` utilizado en otros lugares). El mismo encapsulado basado en marcadores se aplica cuando la comprensión de contenido multimedia extrae texto de documentos adjuntos antes de añadirlo al prompt multimedia.

OpenClaw también elimina los literales comunes de tokens especiales de plantillas de chat de LLM autoalojados (tokens de rol/turno de Qwen/ChatML, Llama, Gemma, Mistral, Phi y GPT-OSS) del contenido externo encapsulado y de los metadatos antes de que lleguen al modelo. Los backends autoalojados compatibles con OpenAI (vLLM, SGLang, TGI, LM Studio y pilas personalizadas de tokenizadores de Hugging Face) a veces tokenizan cadenas literales como `<|im_start|>` o `<|start_header_id|>` como tokens estructurales de plantillas de chat dentro del contenido del usuario; sin esta sanitización, el texto no confiable de una página obtenida, el cuerpo de un correo electrónico o la salida de una herramienta de contenido de archivos podría falsificar un límite de rol sintético `assistant`/`system`. La sanitización se produce en la capa de encapsulado de contenido externo, por lo que se aplica uniformemente en las herramientas de obtención/lectura y en el contenido entrante de los canales. Los proveedores alojados (OpenAI y Anthropic) ya aplican su propia sanitización en las solicitudes; mantenga habilitado el encapsulado de contenido externo y, cuando estén disponibles, prefiera ajustes del backend que dividan o escapen los tokens especiales.

Las respuestas salientes del modelo tienen un sanitizador independiente que elimina `<tool_call>`, `<function_calls>`, `<system-reminder>`, `<previous_response>` y otros elementos internos similares que se hayan filtrado de las respuestas visibles para el usuario en el límite final de entrega del canal.

Esto no sustituye a `dmPolicy`, las listas de permitidos, las aprobaciones de ejecución, el aislamiento ni `contextVisibility`; cierra una omisión específica de la capa de tokenización.

### Indicadores de omisión (manténgalos desactivados en producción)

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Campo de carga útil de Cron `allowUnsafeExternalContent`

Habilítelos solo temporalmente para depuraciones con un alcance muy limitado; si se habilitan, aísle ese agente (entorno aislado + herramientas mínimas + espacio de nombres de sesión dedicado).

Las cargas útiles de los hooks son contenido no confiable incluso cuando la entrega procede de sistemas bajo su control (el contenido de correos, documentos o sitios web puede contener inyección de prompts). Los niveles de modelo débiles aumentan este riesgo: para la automatización controlada por hooks, prefiera niveles de modelos modernos y potentes, mantenga una política de herramientas estricta (`tools.profile: "messaging"` o más estricta) y utilice aislamiento cuando sea posible.

### Razonamiento y salida detallada en grupos

`/reasoning`, `/verbose` y `/trace` pueden exponer razonamiento interno, resultados de herramientas o diagnósticos de plugins que no están destinados a un canal público; pueden incluir argumentos de herramientas, URL, diagnósticos de plugins y datos que haya visto el modelo. Manténgalos deshabilitados en salas públicas; habilítelos solo en mensajes directos de confianza o en salas estrictamente controladas.

## Autorización de comandos

Los comandos de barra y las directivas solo se aceptan de remitentes autorizados, determinados a partir de las listas de permitidos o el emparejamiento del canal, además de `commands.useAccessGroups` (consulte [Configuración](/es/gateway/configuration) y [Comandos de barra](/es/tools/slash-commands)). Si la lista de permitidos de un canal está vacía o incluye `"*"`, los comandos están abiertos de hecho para ese canal.

`/exec` es una comodidad exclusiva de la sesión para operadores autorizados; no escribe la configuración ni modifica otras sesiones.

## Herramientas del plano de control

Dos herramientas integradas siguen siendo sensibles para el plano de control:

- `gateway` lee la configuración con `config.schema.lookup` / `config.get`. No puede escribir la configuración, actualizar OpenClaw ni reiniciar el Gateway.
- `cron` crea trabajos programados que continúan ejecutándose después de que finalice el chat o la tarea original.

La herramienta `gateway` sigue siendo exclusiva del propietario porque las lecturas de configuración pueden exponer secretos y la topología del host. Los agentes solicitan cambios persistentes de configuración o del ciclo de vida mediante la herramienta de delegación `openclaw`; OpenClaw los asigna a operaciones tipadas y exige aprobación humana antes de aplicarlos. Consulte [Agente de configuración de OpenClaw](/es/cli/openclaw#operations-and-approval).

Para cualquier agente o superficie que gestione contenido no confiable, deniegue estas herramientas de manera predeterminada:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` deshabilita `/restart` y las solicitudes externas de reinicio `SIGUSR1`. La herramienta de agente `gateway` no dispone de una acción de reinicio.

## Ejecución de Node (`system.run`)

Si hay un nodo macOS emparejado, el Gateway puede invocar `system.run` en él; esto supone la ejecución remota de código en ese Mac.

- Requiere el emparejamiento del nodo (aprobación + token). El emparejamiento establece la identidad y la confianza del nodo, así como la emisión del token; no es una superficie de aprobación para cada comando.
- El Gateway aplica una política global aproximada de comandos de nodo mediante `gateway.nodes.allowCommands` / `denyCommands`. `denyCommands` solo coincide con nombres exactos de comandos de nodo (por ejemplo, `system.run`), no con texto de shell dentro de la carga útil de un comando; un nodo que se reconecta y anuncia una lista de comandos diferente no constituye por sí mismo una vulnerabilidad si la política global del Gateway y las propias aprobaciones de ejecución del nodo siguen haciendo respetar el límite.
- La política `system.run` de cada nodo es el archivo propio de aprobaciones de ejecución del nodo (`exec.approvals.node.*`), controlado en el Mac mediante Settings -> Exec approvals (seguridad + consulta + lista de permitidos); puede ser más o menos estricta que la política global de identificadores de comandos del Gateway.
- Un nodo que ejecuta `security="full"` y `ask="off"` sigue el modelo predeterminado de operador de confianza; es el comportamiento previsto, no un error, salvo que el despliegue requiera una postura más estricta.
- El modo de aprobación vincula el contexto exacto de la solicitud y, cuando es posible, un único operando concreto de script o archivo local. Si OpenClaw no puede identificar exactamente un archivo local directo para un comando de intérprete o entorno de ejecución, se deniega la ejecución respaldada por aprobación en lugar de prometer una cobertura semántica completa.
- Para `host=node`, las ejecuciones respaldadas por aprobación también almacenan un `systemRunPlan` preparado y canónico; los reenvíos aprobados posteriores reutilizan ese plan almacenado y la validación del Gateway rechaza las modificaciones del llamador en el contexto de comando, directorio de trabajo o sesión después de crear la solicitud de aprobación.
- Para deshabilitar por completo la ejecución remota: establezca la seguridad en `deny` y elimine el emparejamiento de nodos para ese Mac.

## Skills dinámicas (observador / nodos remotos)

OpenClaw puede actualizar la lista de Skills durante una sesión: el observador de Skills actualiza la instantánea en el siguiente turno del agente cuando cambia `SKILL.md`, y la conexión de un nodo macOS puede hacer que las Skills exclusivas de macOS sean aptas (según la detección de binarios). Trate las carpetas de Skills como código de confianza y restrinja quién puede modificarlas.

## Plugins

Los plugins se ejecutan dentro del proceso del Gateway; trátelos como código de confianza.

- Instale únicamente desde fuentes de confianza; prefiera listas de permitidos `plugins.allow` explícitas; revise la configuración del plugin antes de habilitarlo; reinicie el Gateway después de modificar plugins.
- La instalación y actualización de plugins ejecutan código:
  - La ruta de instalación es el directorio de cada plugin dentro de la raíz activa de instalación de plugins.
  - Los paquetes de ClawHub y el catálogo integrado/oficial de OpenClaw son fuentes de confianza. Una nueva fuente arbitraria de npm, `npm-pack:`, git, ruta/archivo local o marketplace muestra una advertencia antes de la instalación; las instalaciones no interactivas requieren `--force` después de revisar y confiar en esa fuente. `--force` confirma la procedencia y permite sobrescribir; no omite `security.installPolicy` ni las demás comprobaciones de seguridad de la instalación. Las actualizaciones reutilizan la fuente ya seleccionada.
  - OpenClaw no ejecuta un bloqueo local integrado de código peligroso durante la instalación o actualización. Use `security.installPolicy` para las decisiones locales de permitir o bloquear que corresponden al operador y `openclaw security audit --deep` para el análisis de diagnóstico.
  - Las instalaciones de plugins mediante npm y git ejecutan la convergencia de dependencias del gestor de paquetes únicamente durante el flujo explícito de instalación o actualización. Las rutas y los archivos locales se tratan como paquetes autónomos; OpenClaw los copia o referencia sin ejecutar `npm install`.
  - Prefiera versiones exactas fijadas (`@scope/pkg@1.2.3`) e inspeccione el código desempaquetado antes de habilitarlo.
  - `--dangerously-force-unsafe-install` está obsoleto y ya no modifica el comportamiento de instalación o actualización.
  - `security.installPolicy` permite a los operadores ejecutar un comando local de confianza para tomar decisiones específicas del host sobre permitir o bloquear instalaciones de Skills y plugins. Se ejecuta después de preparar el material de origen, pero antes de continuar con la instalación; también se aplica a las Skills de ClawHub y los indicadores inseguros obsoletos no lo omiten.

Detalles: [Plugins](/es/tools/plugin)

## Aislamiento

Documentación específica: [Aislamiento](/es/gateway/sandboxing)

Dos enfoques complementarios:

- **Gateway completo en Docker** (límite del contenedor): [Docker](/es/install/docker)
- **Entorno aislado de herramientas** (`agents.defaults.sandbox`; Gateway del host + herramientas aisladas en un entorno; Docker es el backend predeterminado): [Aislamiento](/es/gateway/sandboxing)

<Note>
Para evitar el acceso entre agentes, mantenga `agents.defaults.sandbox.scope` en `"agent"` (valor predeterminado) o utilice `"session"` para un aislamiento por sesión más estricto. `scope: "shared"` utiliza un único contenedor o espacio de trabajo.
</Note>

Acceso al espacio de trabajo del agente dentro del entorno aislado (`agents.defaults.sandbox.workspaceAccess`):

- `"none"` (valor predeterminado): las herramientas ven un espacio de trabajo aislado en `~/.openclaw/sandboxes`; el espacio de trabajo del agente queda fuera de los límites.
- `"ro"`: monta el espacio de trabajo del agente en modo de solo lectura en `/agent` (deshabilita `write`/`edit`/`apply_patch`).
- `"rw"`: monta el espacio de trabajo del agente en modo de lectura y escritura en `/workspace`.

Los `sandbox.docker.binds` adicionales se validan con rutas de origen normalizadas y canonizadas. Una lista de denegación de rutas bloqueadas incluye `/etc`, `/private/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot` y los directorios que suelen contener o usar como alias el socket de Docker (`/run`, `/var/run` y `docker.sock` dentro de ellos), además de las subrutas de credenciales de HOME (`.aws`, `.cargo`, `.config`, `.docker`, `.gnupg`, `.netrc`, `.npm`, `.ssh`). Los trucos con enlaces simbólicos principales y los alias canónicos del directorio personal se resuelven a través de los antecesores existentes y se vuelven a comprobar, por lo que siguen generando un fallo seguro si se resuelven dentro de una raíz bloqueada.

<Warning>
`tools.elevated` es la vía de escape de referencia global que ejecuta comandos fuera del entorno aislado. El host efectivo es `gateway` de manera predeterminada, o `node` cuando el destino de ejecución está configurado como `node`. Mantenga `tools.elevated.allowFrom` restringido y no lo habilite para desconocidos. Restrínjalo aún más por agente mediante `agents.list[].tools.elevated`. Consulte [Modo elevado](/es/tools/elevated).
</Warning>

### Mecanismo de protección para la delegación a subagentes

Si permite herramientas de sesión, trate las ejecuciones delegadas de subagentes como otra decisión de límites:

- Deniegue `sessions_spawn` salvo que el agente realmente necesite delegación.
- Mantenga `agents.defaults.subagents.allowAgents` y cualquier anulación `agents.list[].subagents.allowAgents` por agente restringidos a agentes de destino cuya seguridad sea conocida.
- Para los flujos de trabajo que deban permanecer aislados, invoque `sessions_spawn` con `sandbox: "require"` (el valor predeterminado es `"inherit"`); `"require"` falla inmediatamente cuando el entorno de ejecución secundario de destino no está aislado.

### Modo de solo lectura

Cree un perfil de solo lectura combinando `agents.defaults.sandbox.workspaceAccess: "ro"` (o `"none"` para impedir el acceso al espacio de trabajo) con listas de herramientas permitidas y denegadas que bloqueen `write`, `edit`, `apply_patch`, `exec`, `process`, etc.

- `tools.exec.applyPatch.workspaceOnly: true` (predeterminado): impide que `apply_patch` escriba o elimine fuera del directorio del espacio de trabajo, incluso con el aislamiento desactivado. Establezca `false` solo si desea intencionadamente que `apply_patch` modifique archivos fuera del espacio de trabajo.
- `tools.fs.workspaceOnly: true` (opcional): restringe las rutas de `read`/`write`/`edit`/`apply_patch` y las rutas de carga automática de imágenes de solicitudes nativas al directorio del espacio de trabajo.
- Mantenga limitadas las raíces del sistema de archivos: evite raíces amplias, como el directorio personal, para los espacios de trabajo de agentes o entornos aislados, ya que pueden exponer archivos locales confidenciales (por ejemplo, el estado o la configuración en `~/.openclaw`) a las herramientas del sistema de archivos.

## Perfiles de acceso por agente (varios agentes)

Cada agente puede tener su propia política de aislamiento y herramientas: acceso completo, solo lectura o sin acceso. Consulte [Aislamiento y herramientas para varios agentes](/es/tools/multi-agent-sandbox-tools) para conocer las reglas de precedencia.

Patrones habituales: agente personal (acceso completo, sin aislamiento), agente familiar/laboral (aislado + herramientas de solo lectura), agente público (aislado + sin herramientas de sistema de archivos ni shell).

### Acceso completo (sin aislamiento)

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

### Sin acceso al sistema de archivos ni al shell (mensajería del proveedor permitida)

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          // Las herramientas de sesión pueden revelar datos de transcripciones. El ámbito predeterminado es la sesión actual y las generadas;
          // las lecturas también incluyen grupos del mismo agente supervisados mediante el conocimiento ambiental de grupos.
          // Use visibility: "self" para excluir esas sesiones supervisadas.
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

- Utilice preferentemente un perfil dedicado para el agente (el perfil predeterminado `openclaw`); evite su perfil personal de uso diario.
- Mantenga deshabilitado el control del navegador del host para los agentes aislados, salvo que confíe en ellos.
- La API independiente de control del navegador mediante loopback solo admite autenticación con secreto compartido (autenticación de portador mediante token del Gateway o contraseña del Gateway); no utiliza encabezados de identidad de proxy de confianza ni de Tailscale Serve.
- Trate las descargas del navegador como entradas no confiables; utilice preferentemente un directorio de descargas aislado.
- Si es posible, deshabilite la sincronización del navegador y los administradores de contraseñas en el perfil del agente.
- Para gateways remotos, el «control del navegador» equivale a «acceso de operador» a todo lo que ese perfil pueda alcanzar.
- Mantenga los hosts del Gateway y de los nodos accesibles solo desde la tailnet; evite exponer los puertos de control del navegador a la LAN o a Internet pública.
- Deshabilite el enrutamiento por proxy del navegador cuando no sea necesario (`gateway.nodes.browser.mode="off"`).
- El modo de sesión existente de Chrome MCP no es «más seguro»: puede actuar en su nombre en todo aquello a lo que pueda acceder ese perfil de Chrome del host.
- Ejecute un **host de nodo** en la máquina del navegador y permita que el Gateway retransmita las acciones del navegador cuando este sea remoto respecto al navegador (consulte [Herramienta de navegador](/es/tools/browser)); trate el emparejamiento de nodos como acceso administrativo, mantenga el Gateway y el host de nodo en la misma tailnet y evite exponer los puertos de retransmisión o control mediante la LAN, Internet pública o Tailscale Funnel.

### Política SSRF del navegador (estricta de forma predeterminada)

Los destinos privados o internos permanecen bloqueados salvo que los permita explícitamente.

- Valor predeterminado: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` sin establecer, por lo que los destinos privados, internos o de uso especial permanecen bloqueados. El alias heredado `allowPrivateNetwork` sigue siendo válido.
- Activación explícita: establezca `dangerouslyAllowPrivateNetwork: true` para permitir esos destinos.
- En modo estricto, utilice `hostnameAllowlist` (patrones como `*.example.com`) y `allowedHostnames` (excepciones de host exactas, incluidos nombres que de otro modo estarían bloqueados, como `localhost`) para definir excepciones explícitas.
- Las solicitudes de navegación directa se comprueban previamente. Durante la acción y el periodo de gracia limitado posterior, las interacciones protegidas de Playwright (clic, clic por coordenadas, desplazamiento del puntero, arrastre, desplazamiento, selección, pulsación, escritura, cumplimentación de formularios y evaluación) interceptan las cargas de documentos de nivel superior y de submarcos denegadas por la política antes de enviar los bytes de la solicitud HTTP y, después, vuelven a comprobar en la medida de lo posible la URL final de `http(s)`.
- Antes de cada inicio nuevo de Chrome administrado, OpenClaw deshabilita en la medida de lo posible la predicción de red, lo que suprime la preconexión especulativa observada de Chromium para esas cargas denegadas. Esto constituye defensa en profundidad, no un límite de política: es posible que un navegador reutilizado tras reiniciar el servicio de control y otros backends de navegador no compartan esta protección. El enrutamiento de páginas sigue siendo una interceptación en el nivel de las solicitudes, no un cortafuegos de red: los saltos de redirección, la primera solicitud de una ventana emergente, el tráfico de Service Worker, el código de página ejecutado tras el periodo limitado de protección y algunas rutas de recursos secundarios o en segundo plano pueden eludirla. Las comprobaciones de la URL final siguen siendo una defensa de detección y cuarentena; la prevención completa requiere aislamiento de salida por parte del propietario o un proxy que aplique la política.

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

### Dirección de escucha, puerto y cortafuegos

El Gateway multiplexa WebSocket + HTTP en un solo puerto (predeterminado: `18789`; configuración/marcadores/variables de entorno: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`). Esa superficie HTTP incluye la interfaz de control (recursos de SPA, ruta base predeterminada `/`) y el host de canvas (`/__openclaw__/canvas` y `/__openclaw__/a2ui`: HTML/JS arbitrario; trátelo como contenido no confiable cuando se cargue en un navegador normal; no lo exponga a redes o usuarios no confiables ni comparta su origen con superficies web privilegiadas).

`gateway.bind` controla dónde escucha el Gateway:

- `"loopback"` (predeterminado): solo pueden conectarse clientes locales.
- `"lan"`, `"tailnet"`, `"custom"`: amplían la superficie de ataque. Utilícelos únicamente con autenticación del Gateway (token o contraseña compartidos, o un proxy de confianza configurado correctamente) y un cortafuegos real.

Reglas prácticas: utilice preferentemente Tailscale Serve en lugar de direcciones de escucha de LAN (Serve mantiene el Gateway en loopback y Tailscale gestiona el acceso); si debe escuchar en la LAN, restrinja el puerto mediante el cortafuegos a una lista limitada de direcciones IP de origen en lugar de realizar un reenvío generalizado de puertos; nunca exponga el Gateway sin autenticación en `0.0.0.0`.

### Publicación de puertos de Docker con UFW

Los puertos de contenedores publicados (`-p HOST:CONTAINER` o `ports:` de Compose) se enrutan mediante las cadenas de reenvío de Docker, no solo mediante las reglas `INPUT` del host. Aplique las reglas en `DOCKER-USER` (evaluadas antes de las propias reglas de aceptación de Docker); la mayoría de las distribuciones modernas utilizan la interfaz `iptables-nft`, que también aplica estas reglas al backend de nftables.

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

IPv6 tiene tablas independientes; añada una política equivalente en `/etc/ufw/after6.rules` si IPv6 de Docker está habilitado. Evite codificar de forma fija los nombres de las interfaces (`eth0`), ya que varían entre imágenes de VPS (`ens3`, `enp*`, etc.) y una discrepancia puede omitir silenciosamente la regla de denegación.

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

Los puertos externos esperados deben limitarse a los que se hayan expuesto intencionadamente (en la mayoría de las configuraciones: SSH + puertos del proxy inverso).

### Detección mDNS/Bonjour

Cuando el plugin integrado `bonjour` está habilitado, el Gateway anuncia su presencia mediante mDNS (`_openclaw-gw._tcp`, puerto 5353) para permitir la detección de dispositivos locales. El modo completo incluye registros TXT que exponen detalles operativos: `cliPath` (ruta del sistema de archivos que revela el nombre de usuario y la ubicación de instalación), `sshPort` (anuncia la disponibilidad de SSH), `displayName`/`lanHost` (información del nombre de host). La difusión de detalles de infraestructura facilita el reconocimiento de la LAN.

- Mantenga Bonjour deshabilitado salvo que se necesite la detección en la LAN; se inicia automáticamente en hosts macOS y requiere activación explícita en otros sistemas. Las URL directas del Gateway, Tailnet, SSH o DNS-SD de área amplia evitan la multidifusión local.
- El **modo mínimo** (predeterminado cuando Bonjour está habilitado y recomendado para gateways expuestos) omite los campos confidenciales:

  ```json5
  { discovery: { mdns: { mode: "minimal" } } }
  ```

- El modo **desactivado** suprime la detección local mientras mantiene habilitado el plugin:

  ```json5
  { discovery: { mdns: { mode: "off" } } }
  ```

- El **modo completo** (activación explícita) incluye `cliPath` + `sshPort`:

  ```json5
  { discovery: { mdns: { mode: "full" } } }
  ```

- También puede establecer `OPENCLAW_DISABLE_BONJOUR=1` para deshabilitar mDNS sin cambiar la configuración.

En modo mínimo, el Gateway anuncia `role`, `gatewayPort`, `transport`, pero omite `cliPath`/`sshPort`; las aplicaciones que necesiten la ruta de la CLI pueden obtenerla mediante la conexión WebSocket autenticada.

### Autenticación WebSocket del Gateway

La autenticación del Gateway es obligatoria de forma predeterminada: si no se configura ninguna vía de autenticación válida, el Gateway rechaza las conexiones WebSocket (cierre seguro). La incorporación genera un token de forma predeterminada (incluso para loopback), por lo que los clientes locales deben autenticarse.

```json5
{ gateway: { auth: { mode: "token", token: "your-token" } } }
```

`openclaw doctor --generate-gateway-token` puede generar uno.

<Note>
`gateway.remote.token` y `gateway.remote.password` son fuentes de credenciales del cliente; no protegen por sí solas el acceso WS local. Las rutas de llamadas locales utilizan `gateway.remote.*` únicamente como alternativa cuando `gateway.auth.*` no está establecido. Si `gateway.auth.token` o `gateway.auth.password` se configura explícitamente mediante SecretRef y no se puede resolver, la resolución se cierra de forma segura (sin ocultar el error mediante una alternativa remota).
</Note>

Fije el TLS remoto con `gateway.remote.tlsFingerprint` al usar `wss://`. Se acepta `ws://` en texto sin cifrar para loopback, literales de IP privadas, `.local` y URLs del gateway `*.ts.net` de Tailnet; para otros nombres DNS privados de confianza, establezca `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` en el proceso cliente como medida de emergencia (solo en el entorno del proceso, no como clave de `openclaw.json`). El emparejamiento móvil y las rutas manuales/escaneadas del gateway en Android son más estrictos: solo se permite texto sin cifrar para loopback, mientras que las redes LAN privadas, las direcciones de enlace local, `.local` y los nombres de host sin puntos deben usar TLS, salvo que se habilite explícitamente la ruta de texto sin cifrar para redes privadas de confianza.

El emparejamiento de dispositivos se aprueba automáticamente para conexiones directas mediante loopback local (además de una ruta limitada de autoconexión local del backend/contenedor para flujos de asistentes de confianza con secreto compartido); las conexiones mediante Tailnet y LAN, incluidas las conexiones desde el mismo host a una dirección de Tailnet, se consideran remotas y siguen necesitando aprobación. Una dirección `tailnet` o `custom` resuelta distinta de `127.0.0.1` o `0.0.0.0` añade un listener `127.0.0.1` independiente; solo las conexiones a ese listener local reciben semántica de loopback. La presencia de encabezados reenviados en una solicitud de loopback invalida su carácter local; la aprobación automática de actualizaciones de metadatos tiene un alcance limitado. Consulte [Emparejamiento del Gateway](/es/gateway/pairing).

Modos de autenticación:

- `"token"`: token de portador compartido (recomendado para la mayoría de las configuraciones).
- `"password"`: se recomienda establecerla mediante `OPENCLAW_GATEWAY_PASSWORD`.
- `"trusted-proxy"`: confíe en un proxy inverso con reconocimiento de identidad para autenticar a los usuarios y transmitir la identidad mediante encabezados. Consulte [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth).

Lista de comprobación para la rotación (token/contraseña): genere o establezca un secreto nuevo (`gateway.auth.token` o `OPENCLAW_GATEWAY_PASSWORD`); reinicie el Gateway (o la aplicación de macOS si supervisa el Gateway); actualice los clientes remotos (`gateway.remote.token`/`.password`); verifique que las credenciales anteriores ya no funcionen.

### Encabezados de identidad de Tailscale Serve

Cuando `gateway.auth.allowTailscale` es `true` (valor predeterminado para Serve), OpenClaw acepta el encabezado de identidad de Tailscale Serve `tailscale-user-login` para la autenticación de la interfaz de control/WebSocket. Verifica la identidad resolviendo la dirección `x-forwarded-for` mediante el daemon local de Tailscale (`tailscale whois`) y comparándola con el encabezado; esto solo se activa para solicitudes de loopback que incluyan `x-forwarded-for`, `x-forwarded-proto` y `x-forwarded-host`, inyectados por Tailscale. Para esta comprobación asíncrona, los intentos fallidos del mismo `{scope, ip}` se serializan antes de que el limitador registre el fallo, por lo que los reintentos incorrectos simultáneos de un mismo cliente de Serve pueden bloquear inmediatamente el segundo intento.

Los endpoints de la API HTTP (`/v1/*`, `/tools/invoke`, `/api/channels/*`) no usan autenticación mediante encabezados de identidad de Tailscale; siguen el modo de autenticación HTTP configurado para el gateway.

En la práctica, la autenticación HTTP mediante portador del Gateway concede acceso total o ningún acceso al operador. Las credenciales que pueden invocar `/v1/chat/completions`, `/v1/responses`, rutas de plugins como `/api/v1/admin/rpc` o `/api/channels/*` son secretos de operador con acceso completo para ese gateway: la autenticación mediante portador con secreto compartido restaura todos los ámbitos predeterminados del operador (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) y la semántica de propietario para los turnos del agente, y los valores más restringidos de `x-openclaw-scopes` no reducen el acceso por secreto compartido. La semántica de ámbitos por solicitud solo se aplica cuando la solicitud procede de un modo que proporciona identidad (autenticación mediante proxy de confianza) o de un ingreso privado explícitamente sin autenticación; en esos modos, omitir `x-openclaw-scopes` hace que se use el conjunto normal de ámbitos predeterminados del operador, y los encabezados de nivel de propietario como `x-openclaw-model` requieren `operator.admin` cuando los ámbitos están restringidos. `/tools/invoke` y los endpoints HTTP del historial de sesiones siguen la misma regla del secreto compartido. No comparta estas credenciales con solicitantes que no sean de confianza; se recomienda usar gateways independientes para cada límite de confianza.

La autenticación de Serve sin token presupone que el propio host del gateway es de confianza; no protege contra procesos hostiles ejecutados en el mismo host. Si puede ejecutarse código local que no sea de confianza en el host del gateway, deshabilite `allowTailscale` y exija autenticación explícita mediante secreto compartido (`token` o `password`).

No reenvíe estos encabezados desde su propio proxy inverso. Si termina TLS o utiliza un proxy delante del gateway, deshabilite `allowTailscale` y use en su lugar autenticación mediante secreto compartido o [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth).

Consulte [Tailscale](/es/gateway/tailscale) y [Descripción general de la web](/es/web).

### Configuración del proxy inverso

Establezca `gateway.trustedProxies` para gestionar correctamente la IP reenviada del cliente detrás de nginx/Caddy/Traefik/etc. Cuando el Gateway detecta encabezados de proxy procedentes de una dirección que **no** está en `trustedProxies`, no considera local la conexión; si la autenticación del gateway está deshabilitada, la conexión se rechaza. Esto evita que las conexiones a través de proxy parezcan proceder de localhost y reciban confianza automática.

`trustedProxies` también proporciona datos a `gateway.auth.mode: "trusted-proxy"`, que es más estricto: de forma predeterminada, aplica un cierre seguro ante proxies cuyo origen es loopback. Los proxies inversos de loopback en el mismo host pueden usar `trustedProxies` para detectar clientes locales y gestionar la IP reenviada, pero solo pueden satisfacer el modo de autenticación `trusted-proxy` cuando `gateway.auth.trustedProxy.allowLoopback = true`; de lo contrario, use autenticación mediante token/contraseña.

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # IP del proxy inverso
  allowRealIpFallback: false # valor predeterminado: false; habilítelo solo si su proxy no puede proporcionar X-Forwarded-For
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

Cuando se establece `trustedProxies`, el Gateway usa `X-Forwarded-For` para determinar la IP del cliente; `X-Real-IP` se ignora salvo que se establezca explícitamente `gateway.allowRealIpFallback: true`. Asegúrese de que el proxy **sobrescriba** `X-Forwarded-For`/`X-Real-IP` en lugar de añadir valores:

```nginx
# correcto
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;

# incorrecto: conserva/añade valores proporcionados por clientes que no son de confianza
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

Los encabezados de proxy de confianza no hacen que el emparejamiento de dispositivos Node sea automáticamente de confianza: `gateway.nodes.pairing.autoApproveCidrs` es una política de operador independiente y deshabilitada de forma predeterminada, y las rutas de encabezados de proxy de confianza cuyo origen es loopback siguen excluidas de la aprobación automática de nodos incluso cuando está habilitada la autenticación mediante proxy de confianza en loopback (porque los solicitantes locales pueden falsificar esos encabezados).

### Notas sobre HSTS y el origen

- El gateway de OpenClaw está diseñado principalmente para uso local/mediante loopback. Si termina TLS en un proxy inverso, establezca HSTS allí.
- Si el propio gateway termina HTTPS, `gateway.http.securityHeaders.strictTransportSecurity` emite el encabezado HSTS en las respuestas de OpenClaw.
- Los despliegues de la interfaz de control fuera de loopback requieren `gateway.controlUi.allowedOrigins` de forma predeterminada; `allowedOrigins: ["*"]` es una política explícita que permite todos los orígenes, no un valor predeterminado reforzado; evítela fuera de pruebas locales estrictamente controladas.
- Los fallos de autenticación relacionados con el origen del navegador en loopback siguen sujetos a límites de frecuencia incluso cuando está habilitada la exención general para loopback, pero la clave de bloqueo se delimita por cada valor normalizado de `Origin` en lugar de usar un único grupo compartido para localhost.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita el modo de respaldo de origen mediante el encabezado Host; trátelo como una política peligrosa seleccionada por el operador.
- Considere la revinculación de DNS y el comportamiento de los encabezados de host del proxy como aspectos de refuerzo del despliegue; mantenga `trustedProxies` restringido y evite exponer el gateway directamente a Internet.
- Guía detallada de despliegue: [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth#tls-termination-and-hsts).

### Interfaz de control mediante HTTP

La interfaz de control necesita un contexto seguro (HTTPS o localhost) para generar la identidad del dispositivo.

- `gateway.controlUi.allowInsecureAuth`: opción de compatibilidad local. En localhost, permite autenticar la interfaz de control sin identidad de dispositivo cuando la página se carga mediante HTTP no seguro. No omite las comprobaciones de emparejamiento ni relaja los requisitos de identidad de dispositivo remoto (fuera de localhost). Se recomienda usar HTTPS (Tailscale Serve) o abrir la interfaz en `127.0.0.1`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth`: solo para emergencias; deshabilita por completo las comprobaciones de identidad del dispositivo. Supone una degradación grave de la seguridad; manténgala desactivada salvo que se esté depurando activamente y sea posible revertirla con rapidez.
- Independientemente de esas opciones, un `gateway.auth.mode: "trusted-proxy"` correcto puede admitir sesiones de la interfaz de control con rol de **operador** sin identidad de dispositivo; se trata de un comportamiento intencionado del modo de autenticación, no de un atajo de `allowInsecureAuth`, y no se extiende a las sesiones de la interfaz de control con rol de nodo.

`openclaw security audit` muestra una advertencia cuando `allowInsecureAuth` está habilitado.

### Opciones inseguras/peligrosas

`openclaw security audit` genera `config.insecure_or_dangerous_flags` por cada opción conocida de depuración insegura/peligrosa que esté habilitada (un hallazgo por opción). Manténgalas sin establecer en producción. Si se configuran supresiones de auditoría, `security.audit.suppressions.active` permanece en la salida activa incluso cuando los hallazgos coincidentes pasan a `suppressedFindings`.

<AccordionGroup>
  <Accordion title="Opciones que actualmente supervisa la auditoría">
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

    Coincidencia de nombres de canales (canales incluidos y de plugins; también por `accounts.<accountId>` cuando corresponda):
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

- Cifrado de disco completo en el host del Gateway; si el host es compartido, se recomienda una cuenta de usuario del sistema operativo dedicada para el Gateway.
- Bloqueo de dependencias del paquete publicado: los checkouts del código fuente usan `pnpm-lock.yaml`; el paquete npm `openclaw` publicado y los paquetes de plugins npm propiedad de OpenClaw incluyen `npm-shrinkwrap.json` para que las instalaciones usen el grafo de dependencias transitivas revisado de la versión en lugar de resolver uno nuevo durante la instalación. Este es un límite de protección de la cadena de suministro y reproducibilidad de las versiones, no un entorno aislado; consulte [shrinkwrap de npm](/es/gateway/security/shrinkwrap).
- Operaciones de archivos seguras: OpenClaw usa `@openclaw/fs-safe` para el acceso a archivos limitado a la raíz, las escrituras atómicas, la extracción de archivos, los espacios de trabajo temporales y los asistentes para archivos de secretos. El asistente opcional de Python para POSIX está **desactivado** de forma predeterminada; establezca `OPENCLAW_FS_SAFE_PYTHON_MODE=auto` o `require` solo cuando se requiera la protección adicional de las modificaciones relativas a descriptores de archivo y se pueda proporcionar un entorno de ejecución de Python. Detalles: [Operaciones de archivos seguras](/es/gateway/security/secure-file-operations).
- Riesgo de un espacio de trabajo compartido de Slack: si todas las personas en Slack pueden enviar mensajes al bot, el riesgo principal es la autoridad delegada sobre las herramientas; cualquier remitente permitido puede provocar llamadas a herramientas (`exec`, navegador, herramientas de red o de archivos) dentro de la política del agente, la inyección de instrucciones o contenido de un remitente puede afectar al estado, los dispositivos o las salidas compartidos y, si el agente compartido dispone de credenciales o archivos confidenciales, cualquier remitente permitido podría provocar la exfiltración mediante el uso de herramientas. Utilice agentes o gateways separados con un conjunto mínimo de herramientas para los flujos de trabajo de equipo; mantenga privados los agentes con datos personales.
- Agente compartido por la empresa (patrón aceptable): es adecuado cuando todas las personas que usan el agente pertenecen al mismo límite de confianza (por ejemplo, un equipo de una empresa) y el agente se limita estrictamente al ámbito empresarial. Ejecútelo en una máquina, máquina virtual o contenedor dedicados; use un usuario del sistema operativo, un navegador/perfil y unas cuentas específicos; y no inicie sesión en ese entorno de ejecución con cuentas personales de Apple o Google ni con perfiles personales de gestores de contraseñas o navegadores. Mezclar identidades personales y empresariales en el mismo entorno de ejecución elimina la separación y aumenta el riesgo de exposición de datos personales.

## Secretos en el disco

Suponga que cualquier elemento ubicado en `~/.openclaw/` (o `$OPENCLAW_STATE_DIR/`) puede contener secretos o datos privados:

| Ruta                                           | Contenido                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.json`                                | La configuración puede incluir tokens (del Gateway y del Gateway remoto), ajustes de proveedores y listas de permitidos.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `credentials/**`                               | Credenciales de canales (por ejemplo, credenciales de WhatsApp), listas de permitidos para el emparejamiento e importaciones de OAuth heredadas.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `state/openclaw.sqlite`                        | Estado compartido del entorno de ejecución, incluidos los tokens de acceso y actualización de OAuth del MCP nativo, los secretos de registro dinámico de clientes y el estado de detección.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | Estado del entorno de ejecución por agente, incluidos los perfiles de autenticación de modelos.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `agents/<agentId>/agent/auth-profiles.json`    | Fuente heredada de migración de autenticación de modelos; doctor importa los registros compatibles en la base de datos SQLite por agente.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `agents/<agentId>/agent/codex-home/**`         | Cuenta del servidor de aplicaciones Codex por agente, configuración, Skills, plugins, estado nativo de los hilos y diagnósticos (predeterminado).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `$CODEX_HOME/**` o `~/.codex/**`              | Estado nativo del entorno de ejecución de Codex. El arnés ordinario solo accede a él con `plugins.entries.codex.config.appServer.homeScope: "user"` explícito. La conexión de supervisión independiente accede a él cuando el ámbito de inicio resuelto es `"user"`, que es el valor predeterminado para stdio o Unix cuando no está establecido. Contiene la cuenta nativa de Codex, la configuración, los plugins y el almacén de hilos. La supervisión enumera los metadatos de origen y mantiene la rama nativa canónica de un Chat continuado y los turnos posteriores en esa conexión; la ramificación copia un historial persistente y acotado del usuario y el asistente en un Chat de OpenClaw autenticado y bloqueado para el modelo. Habilítelo únicamente para un Gateway controlado por el propietario. Consulte [arnés de Codex](/es/plugins/codex-harness#share-threads-with-codex-desktop-and-cli) y [supervisión de Codex](/es/plugins/codex-supervision). |
| `secrets.json` (opcional)                      | Carga de secretos respaldada por archivos que utilizan los proveedores SecretRef `file` (`secrets.providers`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `agents/<agentId>/agent/auth.json`             | Archivo de compatibilidad heredado; las entradas estáticas `api_key` se eliminan de forma segura al detectarse.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | Estado del entorno de ejecución por agente, incluidas las filas de sesión y las transcripciones que pueden contener mensajes privados y resultados de herramientas.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `agents/<agentId>/sessions/**`                 | Fuentes y archivos heredados de migración de sesiones que pueden contener mensajes privados y resultados de herramientas.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| paquetes de plugins incluidos                        | Plugins instalados (junto con sus `node_modules/`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sandboxes/**`                                 | Espacios de trabajo del entorno aislado de herramientas; pueden acumular copias de archivos leídos o escritos dentro del entorno aislado.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

### Mapa de almacenamiento de credenciales

También resulta útil para tomar decisiones sobre copias de seguridad:

- WhatsApp: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- Token del bot de Telegram: configuración/entorno o `channels.telegram.tokenFile` (solo archivo normal; se rechazan los enlaces simbólicos)
- Token del bot de Discord: configuración/entorno o SecretRef (proveedores de entorno/archivo/ejecución)
- Tokens de Slack: configuración/entorno (`channels.slack.*`)
- Listas de permitidos para el emparejamiento: `~/.openclaw/credentials/<channel>-allowFrom.json` (cuenta predeterminada) / `<channel>-<accountId>-allowFrom.json` (cuentas no predeterminadas)
- Perfiles de autenticación de modelos: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` (`auth_profile_store`)
- Sesiones OAuth de MCP: `~/.openclaw/state/openclaw.sqlite` (`mcp_oauth_stores`)
- Importación de OAuth heredada: `~/.openclaw/credentials/oauth.json`

Refuerzo de seguridad: mantenga permisos restrictivos (`700` en directorios, `600` en archivos); utilice cifrado de disco completo en el host del Gateway; si el host es compartido, use preferentemente una cuenta de usuario del sistema operativo dedicada.

### Permisos de archivos

- `~/.openclaw/openclaw.json`: `600` (solo lectura/escritura para el usuario)
- `~/.openclaw`: `700` (solo el usuario)

`openclaw doctor` puede advertir y ofrecer restringir estos permisos.

### Archivos `.env` del espacio de trabajo

OpenClaw carga archivos `.env` locales del espacio de trabajo para agentes y herramientas, pero nunca permite que sobrescriban silenciosamente los controles de ejecución del Gateway:

- Las variables de entorno de credenciales de proveedores se bloquean en los archivos `.env` de espacios de trabajo no fiables; por ejemplo, `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY` y las claves de autenticación de proveedores declaradas por plugins fiables instalados. En su lugar, coloque las credenciales de proveedores en el entorno del proceso del Gateway, `~/.openclaw/.env` (`$OPENCLAW_STATE_DIR/.env`), el bloque `env` de la configuración o una importación opcional del shell de inicio de sesión.
- Toda clave que comience por `OPENCLAW_` se bloquea en los archivos `.env` de espacios de trabajo no fiables, reservando así todo el espacio de nombres de ejecución para que un futuro control `OPENCLAW_*` adopte una política de denegación predeterminada, en lugar de poder heredarse silenciosamente de contenido `.env` incluido en el repositorio o proporcionado por un atacante.
- La configuración de enrutamiento de puntos de conexión de canales y proveedores también se bloquea frente a sobrescrituras mediante archivos `.env` del espacio de trabajo (por ejemplo, `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`, `AZURE_SPEECH_ENDPOINT` y otras claves que terminan en `_ENDPOINT`), de modo que un espacio de trabajo clonado no pueda redirigir el tráfico de los conectores incluidos mediante una configuración local de puntos de conexión. Estos valores deben proceder del entorno del proceso del Gateway, del archivo dotenv global de ejecución, de una configuración explícita o de `env.shellEnv`.
- Las variables fiables del entorno del proceso/sistema operativo, el archivo dotenv global de ejecución, la configuración `env` y la importación habilitada del shell de inicio de sesión siguen aplicándose; esto solo restringe la carga de archivos `.env` del espacio de trabajo.

Los archivos `.env` del espacio de trabajo suelen estar junto al código del agente, incorporarse por accidente al repositorio o ser escritos por herramientas; bloquear las credenciales de proveedores impide que un espacio de trabajo clonado sustituya las cuentas de proveedores por cuentas controladas por un atacante.

### Registros y transcripciones

OpenClaw almacena las transcripciones de las sesiones en el disco, en `~/.openclaw/agents/<agentId>/sessions/*.jsonl`, para mantener la continuidad de las sesiones y permitir la indexación opcional de la memoria; cualquier proceso o usuario con acceso al sistema de archivos puede leerlas. Considere el acceso al disco como el límite de confianza y restrinja los permisos de `~/.openclaw`; ejecute los agentes con usuarios del sistema operativo o hosts independientes para obtener un aislamiento más sólido.

Los registros del Gateway pueden incluir resúmenes de herramientas, errores y URL; las transcripciones de las sesiones pueden contener secretos pegados, contenido de archivos, salida de comandos y enlaces.

- Mantenga activada la ocultación de datos confidenciales en registros y transcripciones (`logging.redactSensitive: "tools"`, valor predeterminado).
- Añada patrones personalizados para su entorno mediante `logging.redactPatterns` (tokens, nombres de host, URL internas).
- Al compartir diagnósticos, utilice preferentemente `openclaw status --all` (se puede pegar y los secretos están ocultos) en lugar de los registros sin procesar.
- Elimine las transcripciones de sesiones y los archivos de registro antiguos si no necesita conservarlos durante mucho tiempo.

Detalles: [Registro](/es/gateway/logging)

## Configuración de referencia segura (copiar y pegar)

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

Mantiene el Gateway privado, exige el emparejamiento de mensajes directos y evita que los bots de grupo estén siempre activos. Para que la ejecución de herramientas también sea más segura, añada un entorno aislado y deniegue las herramientas peligrosas a cualquier agente que no sea el propietario (consulte «Perfiles de acceso por agente» más arriba).

### Números independientes (WhatsApp, Signal, Telegram)

En los canales basados en números de teléfono, considere ejecutar el asistente con un número distinto del personal, de modo que las conversaciones personales permanezcan privadas y el número del bot gestione la automatización con sus propios límites.

## Respuesta ante incidentes

### Contención

1. Deténgalo: cierre la aplicación de macOS (si supervisa el Gateway) o finalice el proceso `openclaw gateway`.
2. Cierre la exposición: establezca `gateway.bind: "loopback"` (o desactive Tailscale Funnel/Serve) hasta que comprenda lo sucedido.
3. Bloquee el acceso: cambie los mensajes directos/grupos de riesgo a `dmPolicy: "disabled"` / exija menciones y elimine cualquier entrada `"*"` que permita todo.

### Rotación (suponga que existe una vulneración si se filtraron secretos)

1. Rote la autenticación del Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) y reinícielo.
2. Rote los secretos de clientes remotos (`gateway.remote.token` / `.password`) en cualquier equipo que pueda invocar el Gateway.
3. Rote las credenciales de proveedores/API (credenciales de WhatsApp, tokens de Slack/Discord, claves de modelos/API en `auth-profiles.json` y valores de cargas útiles de secretos cifrados cuando se utilicen).

### Auditoría

1. Compruebe los registros del Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (o `logging.file`).
2. Revise las transcripciones pertinentes: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Revise los cambios recientes de configuración que podrían haber ampliado el acceso: `gateway.bind`, `gateway.auth`, políticas de mensajes directos/grupos, `tools.elevated` y cambios en los plugins.
4. Vuelva a ejecutar `openclaw security audit --deep` y confirme que se hayan resuelto los hallazgos críticos.

### Recopilación para un informe

- Marca temporal, sistema operativo del host del Gateway y versión de OpenClaw.
- Las transcripciones de las sesiones y un breve fragmento final del registro (después de ocultar los datos confidenciales).
- Qué envió el atacante y qué hizo el agente.
- Si el Gateway estuvo expuesto más allá de la interfaz de bucle invertido (LAN/Tailscale Funnel/Serve).

## Análisis de secretos

La Pipeline de CI ejecuta el hook de pre-commit `detect-private-key` en el repositorio. Si falla, elimine o rote el material de claves incorporado al repositorio y, a continuación, reproduzca el problema localmente:

```bash
pre-commit run --all-files detect-private-key
```

## Notificación de problemas de seguridad

¿Ha encontrado una vulnerabilidad en OpenClaw? Notifíquela de forma responsable:

1. Correo electrónico: [security@openclaw.ai](mailto:security@openclaw.ai)
2. No la publique hasta que se haya corregido.
3. Le reconoceremos el mérito (a menos que prefiera permanecer en el anonimato).
