---
read_when:
    - Implementación o revisión de la función del panel de sesiones (tableros)
    - Cambiar el alojamiento de widgets, el puente de widgets o el almacenamiento de tableros
summary: 'Paneles de sesiones: arquitectura y plan de implementación (diseño técnico, previo a la disponibilidad general)'
title: Arquitectura del panel de control
x-i18n:
    generated_at: "2026-07-21T09:04:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a7c5da94ec19add55c6b7b530f0c17509a027e97fb301469ce48f520b325c169
    source_path: web/dashboard-architecture.md
    workflow: 16
---

<Note>
Documento de diseño técnico para la función del panel de sesiones, redactado antes y
durante la implementación. Es la fuente de referencia para el desarrollo. Cuando se
publique la función, `/web/dashboard` se convertirá en la página orientada al usuario y esta página seguirá
siendo la referencia de arquitectura.
</Note>

## Visión

Trabajar con un agente actualmente consiste en un flujo de texto. El panel lo convierte en un
banco de trabajo: el agente representa widgets interactivos en tiempo real; el usuario los fija en
una superficie persistente; el chat se acopla a un lado (o se oculta) y el contenido principal es
el tablero. Se pasa de «hablar con el agente» a «operar un panel de control que el
agente ha creado» sin salir nunca de la sesión.

Principios:

- **Un tablero es una faceta de una sesión, no un objeto nuevo.** Cada sesión (hilo)
  tiene dos facetas: la transcripción y el tablero. Una sesión sin widgets fijados
  es un chat normal. Al fijar un widget, el tablero pasa a existir. Los tableros heredan la
  identidad, la propiedad del agente, el nombre, la fijación y el ciclo de vida de la sesión. No hay
  ningún `dashboard_create`, ningún registro de tableros ni ningún modelo de ACL independiente.
- **Paridad del agente.** Todo lo que el usuario puede hacer en un tablero también puede hacerlo el agente
  con herramientas: añadir, actualizar y eliminar widgets, organizarlos, gestionar pestañas, cambiar la
  pestaña visible y acoplar u ocultar el chat.
- **Nativo, no incrustado.** El tablero consta de componentes Lit en el shell de la interfaz de control
  (el mismo sistema de diseño que el resto de la aplicación). Solo el _contenido_ de los widgets está
  aislado en iframes. No hay barra de URL ni elementos de interfaz del navegador.
- **Superficie reducida para el agente.** Los widgets se identifican mediante un nombre estable y se actualizan
  en el mismo lugar. El diseño es una cuadrícula fluida que se compacta automáticamente; el agente especifica tamaños y
  anclajes, nunca píxeles ni coordenadas.
- **Capacidades en lugar de confianza.** El código de los widgets es HTML/JS arbitrario creado por el agente
  en un entorno aislado estricto. El acceso (datos del Gateway, acciones y red) solo existe mediante
  un manifiesto de capacidades declarado y autorizado por el operador.

## Conceptos

| Concepto             | Definición                                                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sesión (hilo)    | Sesión existente del Gateway, identificada mediante el `sessionKey` estable. Pertenece a un agente.                                                                                        |
| Tablero               | La faceta de widgets de una sesión. Existe si y solo si la sesión tiene widgets o pestañas. Sobrevive a `/new`/`/reset` (está asociado a `sessionKey`, no a la transcripción).                 |
| Pestaña                 | Una página de presentación de un tablero: qué widgets contiene, su disposición y el estado de acoplamiento del chat (`left`/`right`/`bottom`/`hidden`). Los tableros comienzan con una pestaña implícita. |
| Widget              | Programa HTML/JS con nombre y aislado que pertenece a la sesión. Se identifica mediante `sessionKey` + `name`. Se actualiza en el mismo lugar por nombre.                                              |
| Manifiesto de capacidades | Declaración de acceso por widget: `data` (enlaces de lectura), `actions` (verbos incluidos en la lista de permitidos), `prompt` (envío a la sesión), `net` (orígenes permitidos).                      |
| Fijación (widget)        | Traslado de un widget de la transcripción al tablero de la sesión (mediante una opción de la interfaz de usuario o un argumento de herramienta del agente). Desfijarlo lo elimina del tablero.                                         |
| Fijación (sesión)       | Fijación existente de sesiones en la barra lateral. Una sesión fijada que tenga un tablero se abre en la faceta del tablero.                                                                      |

## Flujos de UX

- **Promoción:** el agente llama a `show_widget` en cualquier chat → el widget se representa en línea
  en la transcripción exactamente igual que ahora → al pasar el cursor se muestra **Fijar en el panel** → el widget
  aparece en el tablero de la sesión. El agente puede pasar `pin: true` para hacer lo mismo.
- **Vista de tablero:** una sesión con un tablero obtiene un selector de faceta (Chat / Panel).
  Vista de tablero = barra de pestañas (solo cuando hay >1 pestaña) + cuadrícula fluida + panel de chat acoplado.
  El panel de chat se puede redimensionar, mover (izquierda/derecha/parte inferior) y contraer exactamente
  como la barra lateral. Se recuerda el estado de acoplamiento de cada pestaña.
- **Arrastrar:** el usuario arrastra los widgets; la cuadrícula se compacta automáticamente (los widgets suben y los adyacentes
  se reorganizan). El redimensionamiento mediante el controlador se ajusta a incrementos de tamaño. No se permite la colocación por píxeles, para
  nadie.
- **Advertencia de restablecimiento:** `/new` / `/reset` en una sesión con tablero solicita
  confirmación en la interfaz web («el contexto se restablece, el panel permanece») y conserva
  el tablero.
- **Barra lateral:** las sesiones fijadas muestran la faceta de su tablero cuando tienen uno.
  El tablero de la sesión Home es el «panel del agente» predeterminado.
- **Interacciones** (tres niveles, descritos a continuación): eventos de estado silenciosos, envíos visibles
  de prompts y activadores de automatización.

## Niveles de interacción

1. **Eventos de estado (predeterminados).** Interacciones con la interfaz del widget que el modelo debe conocer,
   pero a las que no debe responder. `bridge.emitState({...})` añade un aviso estructurado
   de sesión (el mismo mecanismo que los avisos de actividad de grupo). No se
   inicia ningún turno del agente; el modelo ve los avisos acumulados en su siguiente ejecución.
2. **Prompts (conversación explícita).** `bridge.sendPrompt(text)`: requiere la activación
   del usuario; envía un mensaje visible del usuario a la sesión (el chat acoplado
   lo muestra). Está sujeto a límites de frecuencia; cada envío requiere la confirmación del usuario, salvo que el widget disponga
   de la concesión de capacidad `prompt`.
3. **Automatización.** `bridge.runAction(name, args)`: ejecuta una
   acción declarada en el manifiesto. Conjunto inicial de verbos: `cron.trigger` (ejecutar ahora un trabajo de Cron existente) y
   `binding.refresh`. Los trabajos de Cron ya se ejecutan en sesiones de ejecución visibles y aisladas
   y pueden usar un modelo más económico: esa es la vía en la que «un modelo pequeño controla el widget».
   No hay sesiones ocultas en ningún lugar.

## Modelo y alojamiento de widgets

El HTML/JS del widget lo crea el agente (normalmente mediante `show_widget`), se envuelve
en el shell de documento estándar (metadato CSP, notificador de tamaño e inicialización del puente) y
se representa en `<iframe sandbox="allow-scripts">` (nunca en `allow-same-origin`).

- **Los widgets en línea (transcripción)** conservan el pipeline actual de documentos del lienzo:
  se escriben en el directorio de estado, los sirve el Gateway, se depuran por ámbito y no requieren
  aprobación (por diseño, carecen de capacidades; los envíos de prompts requieren la confirmación del usuario).
- **Los widgets del tablero** forman parte del estado de la sesión: los bytes residen en la base de datos SQLite
  del agente propietario (`board_widgets`) y se sirven mediante una ruta principal del Gateway
  (`/__openclaw__/board/<agentId>/<sessionKey>/<name>/`) que lee la base de datos.
  Al fijar un widget de la transcripción, se copian los bytes. Límites: 256 KB por widget,
  48 widgets por tablero.
- **Actualización en el mismo lugar:** volver a emitir un widget con el mismo `name` sustituye los
  bytes, incrementa `revision`, difunde `board.changed` y las vistas activas recargan
  únicamente ese iframe.
- **Inmovilización de bytes:** las capacidades concedidas se vinculan al sha256 de los bytes
  del widget. Al cambiar los bytes, las concesiones `data`/`net`/`actions` solo se conservan si la nueva
  revisión declara un subconjunto del manifiesto concedido; un manifiesto ampliado
  vuelve a solicitar la autorización del operador.

### Los widgets alojan contenido; las aplicaciones MCP son un tipo de contenido

El **widget es la primitiva de OpenClaw**: la celda del tablero con nombre, fijada, dimensionada,
perteneciente a la sesión y con un registro de concesión. Lo que se representa en su interior es un
tipo de contenido:

- `html`: creado por el agente mediante `show_widget`, con los bytes en el almacenamiento del tablero.
- `mcp-app`: una vista de una aplicación MCP de terceros (recurso `ui://` de un servidor
  configurado) alojada dentro de la celda del widget.

Las aplicaciones MCP no definen el modelo de widgets; los widgets adquirieron la capacidad de alojarlas.
La identidad, la ubicación, la fijación, las concesiones y la API para autores siguen
siendo de OpenClaw, por lo que el código `show_widget` sigue siendo tan breve como hasta ahora y nunca
necesita saber que existe la especificación MCP Apps.

Infraestructura compartida subyacente (aquí es donde se materializa la simplificación):

- **Un único host aislado.** Los widgets `html` se representan mediante el mismo pipeline reforzado
  con el que se publicaron las aplicaciones MCP (iframe doble en el origen de aislamiento
  dedicado, con la CSP declarada por widget, decodificada con cierre en caso de error) en lugar de un segundo
  host de iframe específico. El proxy recibe el HTML por valor, por lo que el contenido local es
  el caso natural.
- **Un único modelo de autorización.** El acceso de un widget es una lista de permitidos concedida,
  independientemente de su tipo: para los widgets `html`, las herramientas del host; para los widgets `mcp-app`,
  las herramientas del servidor visibles para la aplicación (mediante el mecanismo `allowedAppToolNames`
  existente, que pasa a ser duradero por widget en lugar de por ejecución de creación).
- **Herramientas del host para widgets `html`** (expuestas mediante el puente del widget y comprobadas
  con respecto a la concesión):
  - `openclaw.prompt.send`: nivel 2; se enruta mediante el compositor visible y
    requiere la confirmación del usuario salvo que se haya concedido
  - `openclaw.state.emit`: avisos de sesión de nivel 1 (agrupados y con límite de tamaño)
  - `openclaw.data.read`: enlaces parametrizados de solo lectura (conjunto existente
    de RPC de lectura incluidos en la lista de permitidos), resueltos en el Gateway
  - `openclaw.cron.trigger`: automatización de nivel 3
- **`net` = CSP.** El acceso a la red usa la declaración de CSP por widget
  ya publicada (orígenes `connect-src`): el widget meteorológico que se actualiza automáticamente
  consulta su API directamente desde el entorno aislado, sin intervención del Gateway.
- **Concesiones.** Un widget que no declara nada se representa inmediatamente (aislado,
  `default-src 'none'`, con confirmación individual de los envíos de prompts), con el mismo nivel de confianza que
  los widgets en línea del chat actuales. Las herramientas y los orígenes declarados colocan el widget en
  `pending` en el tablero: una tarjeta de marcador de posición los enumera de forma legible con
  las opciones **Permitir**/**Rechazar** con un solo toque. Las concesiones se asignan por nombre de widget; en el caso de los widgets `html`,
  están inmovilizadas por bytes (sha256), y los bytes modificados solo conservan la concesión si la
  declaración se ha reducido.
- **Capa de compatibilidad para autores.** El envoltorio del documento inyecta `window.openclaw.prompt`,
  `window.openclaw.state`, `window.openclaw.data` y `window.openclaw.cron`
  como API estable para autores. Las llamadas al panel comparten un único
  canal de solicitudes vinculado al vale de la vista; los informes de tamaño y los tokens del tema siguen siendo notificaciones
  independientes del host.

### Declaraciones de capacidades de los plugins

Los plugins habilitados pueden ampliar el host de widgets mediante `dashboard.dataBindings`
y `dashboard.actionVerbs` en `openclaw.plugin.json`. Los identificadores locales del plugin se convierten en
nombres de concesión con el identificador del plugin como prefijo, como `workboard.cards.list` y
`workboard.dispatch`; `%` y `.` se escapan en el segmento del identificador del plugin para que una
división diferente entre plugin e identificador local no pueda heredar la misma concesión persistida. Durante
el registro del plugin, OpenClaw verifica que cada enlace apunte a un RPC
registrado por el mismo plugin con `operator.read` y que cada acción apunte a uno
con `operator.write`; las declaraciones no válidas impiden la carga del plugin. El registro
validado solo se reconstruye cuando cambia el ciclo de vida de los plugins, mientras que las concesiones de widgets
siguen asignándose por widget y vinculadas tanto a los bytes como a la revisión.

### Limitación residual modelada: canales de datos WebRTC

La CSP del entorno aislado emite la directiva propuesta `webrtc 'block'`, pero
[el conjunto actual de directivas CSP de Chromium](https://chromium.googlesource.com/chromium/src/+/main/services/network/public/mojom/content_security_policy.mojom#95)
no la implementa. Por lo tanto, los widgets programables pueden usar canales de datos
WebRTC para la salida de datos en la versión actual de Chromium. La misma limitación residual ya está presente en
los widgets en línea del chat y en el host de MCP Apps en `main`.

**Concesión aceptada:** OpenClaw no condiciona los widgets programables a este
residuo. El contenido de los widgets solo obtiene acceso a datos confidenciales
de OpenClaw mediante una capacidad `data:read` concedida por un operador
y fijada a nivel de bytes, y la política de permisos del entorno aislado bloquea
el acceso a la cámara y al micrófono. Una protección de la API del DOM es una
defensa en profundidad de mejor esfuerzo, no un límite de seguridad, y
corresponde a un refuerzo posterior.

### Visualización de la transcripción: una tarjeta de widget

La visualización en línea se unifica en torno a la primitiva de widget. Cuando
el resultado de una herramienta incluye una interfaz de usuario —una salida
`show_widget` o el resultado de una herramienta MCP con un recurso de
aplicación—, el sistema materializa un **widget efímero con nombre automático**
(limitado a la sesión y depurado), y la transcripción representa una única
tarjeta de widget que se distribuye según el tipo de contenido. La visualización
automática de aplicaciones MCP se mantiene exactamente como espera la
especificación (sin trabajo adicional del modelo); simplemente _es_ un widget
subyacente. Esto elimina los casos especiales paralelos de
`mcpApp` en la representación del chat (restricción por superficie y
deduplicación independiente), proporciona a todas las interfaces en línea la
misma opción de anclaje y convierte el registro de widgets en la ruta principal
para volver a abrirlos (la reconstrucción mediante el análisis de la
transcripción se mantiene como alternativa para el historial que nunca se
ancló). El host independiente de solo lectura con tickets se solapa con los
tableros como superficie persistente para volver a abrir contenido; es un
candidato a consolidación que debe evaluarse en T6, no una suposición.

Composición: v1 usa adyacencia en cuadrícula (un widget del contenedor del agente
junto a un widget de aplicación en una pestaña). v2 añade **ranuras de aplicación
gestionadas por el host**: el HTML del widget del agente declara una región de
ranura y el host compone la vista real de la aplicación como un entorno aislado
hermano. La aplicación nunca se representa dentro del iframe del agente: el
anidamiento rompería la identidad del puente y permitiría superponer o secuestrar
clics en la interfaz de usuario concedida a la aplicación, por lo que la ranura
es un contrato de diseño, no una incrustación.

### Widgets procedentes del servidor (aplicaciones MCP ancladas)

Con el host unificado, anclar una aplicación MCP de terceros equivale simplemente
a usar un widget cuyo contenido se obtiene del servidor en lugar de almacenarse:
`board_widgets` conserva el descriptor (`serverName`,
`toolName`, `uiResourceUri`, el `toolCallId` +
`sessionKey` de origen) en lugar de los bytes HTML, y el tablero vuelve a
emitir el arrendamiento de la vista más allá del TTL de 10 minutos del turno de
chat (volviendo a obtener el recurso `ui://` cuando queda obsoleto).
Las vistas de aplicaciones MCP en línea del chat reciben la misma opción
**Anclar al panel** que los widgets del agente. Actualmente, las vistas que se
vuelven a abrir son de solo lectura por diseño; las aplicaciones ancladas que
deban seguir siendo interactivas reciben una concesión duradera sobre las
herramientas del servidor visibles para la aplicación (una lista explícita de
elementos permitidos que se muestra al operador al anclar), desacoplada de la
ejecución que la emitió. Los elementos anclados sin concesión permanecen en modo
de solo lectura, aunque siguen siendo útiles para paneles de visualización. v1
los ancla al tablero de la sesión de origen; el anclaje entre sesiones requiere
un intermediario de arrendamientos y deberá esperar. Debe coordinarse con el
pull request abierto #109807 (enrutamiento del compositor
`ui/message`, propagación de tema y tamaño).

### Integración con WorkBoard

El programa de integración con WorkBoard mantiene las tarjetas y los tableros
bajo la propiedad del Plugin, a la vez que vuelve a vincular las tarjetas
despachadas con los tableros de sus sesiones mediante los elementos existentes
`sessionKey` y `runId`, expone los canales de información y el
despacho de WorkBoard mediante vinculaciones y acciones declaradas por el
Plugin, y compone esos resultados con los tipos de widget existentes
`html` y `mcp-app`, en lugar de introducir un tipo de
widget específico de WorkBoard.

## Diseño: cuadrícula fluida

12 columnas, altura de fila fija, **compactación automática** (gravedad hacia arriba, desplazamiento lateral al
arrastrar — semántica de gridstack, implementada de forma nativa; los cálculos de la cuadrícula se mantienen puros y
sin DOM). Estado del diseño de los widgets por pestaña: `{ name, w (1-12), h (rows) }` más
el orden. Vocabulario del agente:

- `size`: `sm` (3×3) · `md` (6×4) · `lg` (8×6) · `xl` (12×8) · `full`
  (pestaña de un solo widget)
- `after: <widgetName>` ancla de ordenación opcional; si se omite = añadir al final
- El usuario arrastra y cambia el tamaño libremente; el mismo modelo de orden+tamaño permite una conversión de ida y vuelta.

## Modelo de datos (base de datos por agente)

Nuevas tablas en `agents/<agentId>/agent/openclaw-agent.sqlite`
(**requiere incrementar la versión del esquema de la base de datos del agente; se requiere la aprobación del operador
antes de que esto se incorpore**):

```sql
CREATE TABLE board_tabs (
  session_key TEXT NOT NULL,
  tab_id      TEXT NOT NULL,           -- slug
  title       TEXT NOT NULL,
  position    INTEGER NOT NULL,
  chat_dock   TEXT NOT NULL DEFAULT 'right',  -- left|right|bottom|hidden
  created_by  TEXT NOT NULL,           -- 'user' | 'agent'
  PRIMARY KEY (session_key, tab_id)
) STRICT;

CREATE TABLE board_widgets (
  session_key  TEXT NOT NULL,
  name         TEXT NOT NULL,          -- stable widget name
  tab_id       TEXT NOT NULL,
  title        TEXT,
  html         BLOB NOT NULL,          -- wrapped document source
  sha256       TEXT NOT NULL,
  revision     INTEGER NOT NULL,
  size_w       INTEGER NOT NULL,
  size_h       INTEGER NOT NULL,
  position     INTEGER NOT NULL,       -- order within tab (auto-compact input)
  manifest     TEXT NOT NULL DEFAULT '{}',  -- capability manifest JSON
  grant_state  TEXT NOT NULL DEFAULT 'none', -- none|pending|granted|rejected
  granted_sha  TEXT,                   -- byte-frozen grant
  created_by   TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  PRIMARY KEY (session_key, name)
) STRICT;
```

Existencia del tablero = cualquier fila para `sessionKey`. Al eliminar una sesión, se eliminan las
filas de su tablero. `/new`/`/reset` no las modifica.

## Superficie del protocolo

RPC (tabla de métodos principales, esquemas typebox en `gateway-protocol`):

- `board.get { sessionKey }` → pestañas + metadatos de widgets (sin bytes) — `operator.read`
- `board.update { sessionKey, ops[] }` — CRUD/reordenación de pestañas, movimiento/redimensionamiento/
  eliminación/desanclaje de widgets, estado del panel, enfoque de pestaña — `operator.write`
- `board.widget.put { sessionKey, name, html, manifest, placement }` —
  `operator.write` (ruta de herramienta del agente y ruta de anclaje)
- `board.widget.grant { sessionKey, name, decision }` — `operator.approvals`
- `board.event { ticket, payload }` — ingesta de eventos de estado de nivel 1 vinculada a un ticket;
  se mantiene la forma heredada de host de confianza `{ sessionKey, widget, payload }` —
  `operator.write`
- `board.prompt.authorize { ticket }` — devuelve si el envío de un mensaje visible
  aún necesita confirmación en cada clic — `operator.read`
- `board.data.read { ticket, bindingId, params? }` — resolución en el Gateway de enlaces de lectura
  permitidos del núcleo o de plugins activos — `operator.read`
- `board.action { ticket, action, ... }` — despacho de automatización con concesión exacta
  mediante la ruta existente de ejecución inmediata de Cron o el verbo de acción
  validado de un plugin activo — `operator.write`

Eventos (en `EVENT_SCOPE_GUARDS`, ámbito de lectura):

- `board.changed { sessionKey, revision, widget? }` — el estado persistente ha cambiado;
  la interfaz de usuario vuelve a obtener los datos (y recarga un iframe cuando está presente `widget`).
- `board.command { sessionKey, command }` — control transitorio de la interfaz de usuario (el agente cambia
  la pestaña visible, alterna el panel de chat) — el patrón `ui.command`.

Los bytes de los widgets se sirven mediante la superficie HTTP autenticada, no mediante el socket.

## Herramientas del agente

Tres herramientas en total (del núcleo, siempre registradas; renderizado condicionado a la
capacidad de cliente `inline-widgets`, como actualmente):

- `show_widget { title, widget_code, name?, pin?, size?, tab?, after?,
capabilities? }` — crear/actualizar por nombre; `pin` lo coloca en el tablero.
  Sin `name`/`pin`, se comporta exactamente como actualmente (integrado, efímero).
- `dashboard { action, ... }` — verbos de gestión del tablero: `read`, `tab_create`,
  `tab_update`, `tab_delete`, `tabs_reorder`, `widget_move`, `widget_remove`,
  `unpin`, `focus_tab`, `set_chat_dock`.
- Las herramientas `cron` existentes cubren el nivel de automatización; no se necesita ninguna herramienta nueva.

Las descripciones de las herramientas enseñan el vocabulario de tamaño/anclaje y el modelo de niveles. Se
informa al agente sobre los eventos de usuario de nivel 1 mediante avisos de sesión, p. ej.,
`[dashboard] user clicked "Refresh" on widget weather (tab main)`.

## Qué reemplaza esto

- **Se elimina `extensions/workspaces`.** Experimental, `enabledByDefault:
false`, nunca incluido en una versión estable (apareció por primera vez en las betas de 2026.7.2). Sin
  migración; una regla de doctor elimina `<stateDir>/workspaces/` obsoleto si está presente.
  Ideas aprovechadas: matemáticas puras de cuadrícula, modelo de seguridad del puente (arranque del puerto,
  restricción de enlaces, límites de frecuencia), aprobación con bytes inmovilizados.
- **El alojamiento de widgets pasa de `extensions/canvas` al núcleo.** El almacén
  de documentos del lienzo, el contenedor de documentos, el servicio HTTP y la herramienta `show_widget` pasan al núcleo
  (`src/canvas/`); el plugin conserva la herramienta de control de node-canvas (`canvas`) y
  A2UI. El anuncio `pluginSurfaceUrls["canvas"]` y las
  rutas `/__openclaw__/canvas` son contratos de clientes nativos ya publicados y permanecen
  estables. Las sesiones de Discord conservan la variante `show_widget` propiedad de Discord.

## Objetivos excluidos (este programa)

- Uso compartido del tablero entre varios usuarios/ACL (futuro; llegará mediante el uso compartido de sesiones).
- Renderizado nativo del tablero en macOS/iOS (lo obtienen dondequiera que integren la
  interfaz de control; la ruta de widgets integrados no cambia).
- Widgets de datos incorporados (tarjetas de sesiones/uso/Cron): el puente de capacidades y los
  widgets creados por el agente cubren la v1; posteriormente puede añadirse un registro de tipos incorporados.

## Plan de implementación

Árboles de trabajo independientes, creados con Codex, revisión+integración secuenciales. Integrar y después corregir.

| #   | Rama                                 | Alcance                                                                                                                                                                            | Depende de                       |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| T1  | `claude/dashboard-remove-workspaces` | Eliminar el plugin de espacios de trabajo + interfaz de usuario + documentación + claves de i18n; regla de limpieza de doctor                                                                                                              | —                                |
| T2  | `claude/dashboard-canvas-core`       | Promover el alojamiento de widgets + `show_widget` al núcleo; el plugin de lienzo conserva la herramienta de Node; ningún cambio de comportamiento                                                                                | —                                |
| T3  | `claude/dashboard-domain`            | Tablas de la BD del agente (incremento de esquema), RPC `board.*` + eventos, herramienta `dashboard`, argumentos de anclaje/nombre/manifiesto de `show_widget`, avisos de nivel 1, el restablecimiento conserva el tablero                                  | T2                               |
| T4  | `claude/dashboard-ui`                | Vista del tablero + barra de pestañas + cuadrícula fluida con compactación automática + panel de chat (izquierda/derecha/inferior/oculto) + control de anclaje de transcripciones + vista del tablero en la barra lateral + confirmación de restablecimiento                           | T3 (primero simulaciones mediante accesorios de desarrollo) |
| T5  | `claude/dashboard-capabilities`      | Almacén/interfaz de concesiones + inmovilización de bytes; trasladar los widgets `html` al host de entorno aislado compartido; herramientas del host (`openclaw.prompt.send/state.emit/data.read/cron.trigger`); CSP `net`; capa de compatibilidad de creación | T3, T4                           |
| T7  | `claude/dashboard-mcp-apps`          | Tipo de contenido `mcp-app`: control de anclaje en vistas de aplicaciones integradas, almacenamiento de descriptores, reemisión/renovación de arrendamientos, concesiones duraderas de herramientas del servidor (reutiliza el host de aplicaciones MCP ya publicado)                   | T3, T4                           |
| T6  | pulido                               | E2E en vivo en un Gateway temporal (claves reales), capturas de pantalla, correcciones, reescritura de `/web/dashboard` centrada en el usuario, revisión de activación predeterminada                                                     | todo                             |

Validación según las reglas del repositorio: vitest específico en local, comprobaciones completas en
Crabbox/Testbox, `$autoreview` antes de cada integración, prueba en vivo para T6.
