---
read_when:
    - Implementación o revisión de la función del panel de sesiones (tableros)
    - Cambiar el alojamiento de widgets, el puente de widgets o el almacenamiento de tableros
summary: 'Paneles de sesiones: arquitectura y plan de implementación (diseño técnico, previo a la disponibilidad general)'
title: Arquitectura del panel de control
x-i18n:
    generated_at: "2026-07-19T02:15:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 472b6a9268f552f56b7aaa3ceecaa99e15722188f10d703d3321e9d60166904f
    source_path: web/dashboard-architecture.md
    workflow: 16
---

<Note>
Documento de diseño técnico para la función del panel de sesiones, redactado antes y
durante la implementación. Es la fuente de referencia para el desarrollo. Cuando la
función se publique, `/web/dashboard` se convertirá en la página destinada a los usuarios y esta página permanecerá
como referencia de arquitectura.
</Note>

## Visión

Actualmente, trabajar con un agente consiste en un flujo de texto. El panel lo convierte en un
banco de trabajo: el agente renderiza widgets interactivos en tiempo real; el usuario los fija en
una superficie persistente; el chat se acopla a un lado (o se oculta) y el contenido principal es
el tablero. Se pasa de «hablar con el agente» a «operar un panel de control que el
agente ha creado» sin salir nunca de la sesión.

Principios:

- **Un tablero es una vista de una sesión, no un objeto nuevo.** Cada sesión (hilo)
  tiene dos vistas: la transcripción y el tablero. Una sesión sin widgets fijados
  es un chat normal. Al fijar un widget, el tablero pasa a existir. Los tableros heredan la
  identidad, la propiedad del agente, el nombre, la fijación y el ciclo de vida de la sesión. No hay
  ningún `dashboard_create`, ningún registro de tableros ni ningún modelo de ACL independiente.
- **Paridad del agente.** Todo lo que el usuario puede hacer en un tablero, el agente puede hacerlo
  mediante herramientas: añadir, actualizar y eliminar widgets, organizarlos, gestionar pestañas, cambiar la
  pestaña visible y acoplar u ocultar el chat.
- **Nativo, no incrustado.** El tablero se compone de componentes Lit en el shell de la interfaz de control
  (el mismo sistema de diseño que el resto de la aplicación). Solo el _contenido_ de los widgets está
  aislado en iframes. No hay barra de URL ni elementos de interfaz del navegador.
- **Superficie reducida para el agente.** Los widgets se identifican mediante un nombre estable y se actualizan
  sin sustituirlos. El diseño es una cuadrícula fluida con compactación automática; el agente especifica tamaños y
  anclajes, nunca píxeles ni coordenadas.
- **Capacidades en lugar de confianza.** El código de los widgets es HTML/JS arbitrario creado por el agente
  dentro de un entorno aislado estricto. El acceso (datos del Gateway, acciones y red) solo existe mediante
  un manifiesto de capacidades declarado y concedido por el operador.

## Conceptos

| Concepto             | Definición                                                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sesión (hilo)    | Sesión existente del Gateway, identificada por el valor estable `sessionKey`. Pertenece a un agente.                                                                                        |
| Tablero               | La vista de widgets de una sesión. Existe si y solo si la sesión tiene widgets o pestañas. Persiste tras `/new`/`/reset` (está vinculado a `sessionKey`, no a la transcripción).                 |
| Pestaña                 | Una página de presentación de un tablero: qué widgets contiene, su disposición y el estado de acoplamiento del chat (`left`/`right`/`bottom`/`hidden`). Los tableros comienzan con una pestaña implícita. |
| Widget              | Programa HTML/JS con nombre y aislado que pertenece a la sesión. Se identifica mediante `sessionKey` + `name`. Se actualiza sin sustituirlo mediante su nombre.                                              |
| Manifiesto de capacidades | Declaración de acceso por widget: `data` (enlaces de lectura), `actions` (verbos incluidos en la lista de permitidos), `prompt` (envío a la sesión), `net` (orígenes permitidos).                      |
| Fijación (widget)        | Trasladar un widget de la transcripción al tablero de la sesión (mediante un control del usuario o un argumento de herramienta del agente). Dejar de fijarlo lo elimina del tablero.                                         |
| Fijación (sesión)       | Fijación existente de sesiones en la barra lateral. Una sesión fijada que tenga un tablero se abre en la vista de su tablero.                                                                      |

## Flujos de UX

- **Promoción:** el agente llama a `show_widget` en cualquier chat → el widget se renderiza en línea
  en la transcripción exactamente igual que ahora → al pasar el cursor se muestra **Fijar en el panel** → el widget
  aparece en el tablero de la sesión. El agente puede pasar `pin: true` para hacer lo mismo.
- **Vista del tablero:** una sesión con tablero obtiene un selector de vista (Chat / Panel).
  Vista del tablero = barra de pestañas (solo cuando hay más de 1 pestaña) + cuadrícula fluida + panel de chat acoplado.
  El acoplamiento del chat puede cambiar de tamaño y posición (izquierda/derecha/abajo), y se puede contraer exactamente
  como la barra lateral. El estado de acoplamiento se recuerda para cada pestaña.
- **Arrastre:** el usuario arrastra los widgets; la cuadrícula se compacta automáticamente (los widgets suben y los elementos vecinos
  se redistribuyen). El cambio de tamaño mediante el controlador se ajusta a incrementos predefinidos. No se permite la colocación por píxeles,
  para nadie.
- **Advertencia de restablecimiento:** `/new` / `/reset` en una sesión que contiene un tablero solicita
  confirmación en la interfaz web («el contexto se restablece, el panel permanece») y conserva
  el tablero.
- **Barra lateral:** las sesiones fijadas muestran la vista de su tablero cuando tienen uno.
  El tablero de la sesión de inicio es el «panel del agente» predeterminado.
- **Interacciones** (tres niveles, consulte más adelante): eventos de estado silenciosos, envíos visibles
  de instrucciones y activadores de automatización.

## Niveles de interacción

1. **Eventos de estado (predeterminados).** Interacciones con la interfaz del widget que el modelo debe conocer,
   pero a las que no debe responder. `bridge.emitState({...})` añade un aviso estructurado
   a la sesión (el mismo mecanismo que los avisos de actividad de grupo). No se
   inicia ningún turno del agente; el modelo ve los avisos acumulados en su siguiente ejecución.
2. **Instrucciones (conversación explícita).** `bridge.sendPrompt(text)` — requiere una acción
   del usuario; envía un mensaje visible del usuario a la sesión (el chat acoplado
   lo muestra). Tiene limitación de frecuencia; cada envío requiere la confirmación del usuario, salvo que el widget disponga
   de la concesión de capacidad `prompt`.
3. **Automatización.** `bridge.runAction(name, args)` — ejecuta una
   acción declarada en el manifiesto. Conjunto inicial de verbos: `cron.trigger` (ejecutar ahora un trabajo Cron existente) y
   `binding.refresh`. Los trabajos Cron ya se ejecutan en sesiones de ejecución visibles y aisladas,
   y pueden usar un modelo más económico: esa es la vía por la que «un modelo pequeño controla el widget».
   No hay sesiones ocultas en ningún lugar.

## Modelo y alojamiento de widgets

El HTML/JS del widget lo crea el agente (normalmente mediante `show_widget`), se envuelve
en el shell de documento estándar (metadatos de CSP, notificador de tamaño e inicialización del puente) y
se renderiza en `<iframe sandbox="allow-scripts">` (nunca en `allow-same-origin`).

- **Los widgets en línea (de la transcripción)** mantienen el pipeline actual de documentos del lienzo:
  se escriben en el directorio de estado, los sirve el Gateway, se depuran por ámbito y no requieren
  aprobación (por diseño, no tienen capacidades; los envíos de instrucciones requieren confirmación del usuario).
- **Los widgets del tablero** forman parte del estado de la sesión: los bytes se almacenan en la base de datos SQLite
  del agente propietario (`board_widgets`) y los sirve una ruta principal del Gateway
  (`/__openclaw__/board/<agentId>/<sessionKey>/<name>/`) que lee la base de datos.
  Al fijar un widget de la transcripción, se copian los bytes. Límites: 256 KB por widget,
  48 widgets por tablero.
- **Actualización sin sustitución:** volver a emitir un widget con el mismo `name` sustituye los
  bytes, incrementa `revision`, difunde `board.changed` y hace que las vistas activas recarguen
  únicamente ese iframe.
- **Inmovilización de bytes:** las capacidades concedidas se vinculan al sha256 de los bytes
  del widget. Al cambiar los bytes, se conservan las concesiones `data`/`net`/`actions` solo si la nueva
  revisión declara un subconjunto del manifiesto concedido; un manifiesto ampliado
  vuelve a solicitar la autorización del operador.

### Los widgets alojan contenido; las aplicaciones MCP son un tipo de contenido

El **widget es la primitiva de OpenClaw**: la celda del tablero con nombre, fijada,
dimensionada y perteneciente a la sesión, con un registro de concesión. Lo que se renderiza en su
interior es un tipo de contenido:

- `html` — creado por el agente mediante `show_widget`, con los bytes almacenados en el tablero.
- `mcp-app` — una vista de una aplicación MCP de terceros (recurso `ui://` de un servidor
  configurado) alojada dentro de la celda del widget.

Las aplicaciones MCP no definen el modelo de widgets; los widgets adquirieron la capacidad de
alojarlas. La identidad, la ubicación, la fijación, las concesiones y la API para autores siguen
siendo de OpenClaw, por lo que el código `show_widget` sigue siendo tan breve como hasta ahora y nunca
necesita saber que existe la especificación de MCP Apps.

Infraestructura compartida subyacente (aquí es donde se aplica la simplificación):

- **Un único host aislado.** Los widgets `html` se renderizan mediante el mismo pipeline reforzado
  con el que se publicaron las aplicaciones MCP (doble iframe en el origen aislado
  dedicado, con CSP declarada por widget, decodificada con cierre en caso de error) en lugar de usar un segundo
  host de iframe específico. El proxy recibe HTML por valor, por lo que el contenido local es
  el caso natural.
- **Un único modelo de autorización.** El acceso de un widget es una lista de permitidos concedida,
  sea cual sea su tipo: para los widgets `html`, las herramientas del host; para los widgets `mcp-app`,
  las herramientas del servidor visibles para la aplicación (mediante el mecanismo existente `allowedAppToolNames`,
  que se hace persistente por widget en lugar de por ejecución de creación).
- **Herramientas del host para widgets `html`** (expuestas mediante el puente del widget y verificadas
  respecto a la concesión):
  - `openclaw.prompt.send` — nivel 2; se enruta mediante el compositor visible,
    requiere confirmación del usuario salvo que se haya concedido
  - `openclaw.state.emit` — avisos de sesión de nivel 1 (agrupados y con límite de tamaño)
  - `openclaw.data.read` — enlaces parametrizados de solo lectura (conjunto existente
    de RPC de lectura incluidos en la lista de permitidos), resueltos en el Gateway
  - `openclaw.cron.trigger` — automatización de nivel 3
- **`net` = CSP.** El acceso a la red usa la declaración de CSP por widget
  ya publicada (orígenes `connect-src`): el widget meteorológico con actualización automática
  obtiene su API directamente desde el entorno aislado, sin intervención del Gateway.
- **Concesiones.** Un widget que no declara nada se renderiza inmediatamente (aislado,
  `default-src 'none'`, con cada envío de instrucciones confirmado individualmente), con la misma confianza que
  los widgets en línea de los chats actuales. Las herramientas y los orígenes declarados sitúan el widget en
  `pending` en el tablero: una tarjeta de marcador de posición los enumera de forma comprensible y permite
  **Permitir**/**Rechazar** con un solo toque. Las concesiones se asignan por nombre de widget; en los widgets `html`
  se inmovilizan según los bytes (sha256), y al cambiar estos se conserva la concesión solo si la
  declaración se ha reducido.
- **Capa de compatibilidad para autores.** El contenedor del documento inyecta
  `window.openclaw.sendPrompt/emitState/read/call` como API estable para autores;
  si el transporte subyacente es nuestro canal o AppBridge es un
  detalle interno que el autor del widget nunca ve. Los informes de tamaño y los tokens
  de tema se transmiten por el mismo puente.

### Visualización de transcripciones: una única tarjeta de widget

La visualización en línea se unifica en torno a la primitiva de widget. Cuando el resultado de una herramienta contiene una interfaz —
la salida de `show_widget` o el resultado de una herramienta MCP con un recurso de aplicación—, el sistema
materializa un **widget efímero con nombre automático** (con ámbito de sesión y sujeto a depuración), y
la transcripción renderiza una única tarjeta de widget que se adapta según el tipo de contenido.
La visualización automática de aplicaciones MCP se mantiene exactamente como exige la especificación (sin trabajo adicional del modelo);
simplemente _es_ un widget de forma subyacente. Esto elimina los casos especiales paralelos de `mcpApp`
en la renderización del chat (restricción por superficie y deduplicación independiente), proporciona a todas las
interfaces en línea el mismo control de fijación y convierte el registro de widgets en la ruta principal
para volver a abrirlos (la reconstrucción mediante el análisis de la transcripción permanece como alternativa para el historial
que nunca se haya fijado). El host independiente con tíquet y de solo lectura se solapa con los tableros como
superficie persistente para volver a abrir contenido; es un candidato a consolidación que debe evaluarse en T6, no
un supuesto.

Composición: la v1 usa la adyacencia en la cuadrícula (un widget de interfaz del agente junto a un widget de aplicación en
una pestaña). La v2 añade **espacios de aplicación gestionados por el host**: el HTML del widget del agente declara una
región de espacio y el host compone la vista real de la aplicación como un entorno aislado hermano.
La aplicación nunca se renderiza dentro del iframe del agente: anidarla rompería la
identidad del puente y permitiría superponer elementos o realizar secuestro de clics en la interfaz concedida de la aplicación, por lo que el espacio es un
contrato de diseño, no una incrustación.

### Widgets procedentes del servidor (aplicaciones MCP fijadas)

Con el host unificado, fijar una aplicación MCP de terceros es simplemente un widget cuyo
contenido se obtiene del servidor en lugar de almacenarse: `board_widgets` conserva el
descriptor (`serverName`, `toolName`, `uiResourceUri`, `toolCallId` +
`sessionKey` de origen) en lugar de los bytes HTML, y el tablero vuelve a generar el
arrendamiento de la vista una vez superado el TTL de 10 minutos del turno de chat (volviendo a obtener el recurso
`ui://` cuando queda obsoleto). Las vistas de aplicaciones MCP insertadas en el chat obtienen la misma opción
**Fijar al panel** que los widgets del agente. Actualmente, las vistas reabiertas son de solo lectura por diseño;
las aplicaciones fijadas que deban seguir siendo interactivas obtienen una concesión duradera sobre las
herramientas del servidor visibles para la aplicación (se muestra al operador una lista de permitidos explícita al fijarla), desacoplada
de la ejecución que la generó. Los elementos fijados sin concesión permanecen en modo de solo lectura, aunque siguen siendo útiles para paneles
de visualización. La v1 los fija al tablero de la sesión de origen; la fijación entre sesiones
necesita un agente de arrendamientos y queda pendiente. Coordinar con el pull request abierto n.º 109807 (enrutamiento
del compositor `ui/message`, propagación del tema/tamaño).

## Diseño: cuadrícula fluida

12 columnas, altura de fila fija, **compactación automática** (gravedad hacia arriba, desplazamiento lateral al
arrastrar — semántica de gridstack, implementada de forma nativa; los cálculos de la cuadrícula permanecen puros y
sin DOM). Estado del diseño de los widgets por pestaña: `{ name, w (1-12), h (rows) }` más el
orden. Vocabulario del agente:

- `size`: `sm` (3×3) · `md` (6×4) · `lg` (8×6) · `xl` (12×8) · `full`
  (pestaña de un solo widget)
- `after: <widgetName>` ancla de ordenación opcional; si se omite = añadir al final
- El usuario arrastra y cambia el tamaño libremente; el mismo modelo de orden+tamaño permite una conversión de ida y vuelta.

## Modelo de datos (base de datos por agente)

Nuevas tablas en `agents/<agentId>/agent/openclaw-agent.sqlite`
(**requiere incrementar la versión del esquema de la base de datos del agente; se necesita la aprobación del operador
antes de integrar esto**):

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

Existencia del tablero = cualquier fila para la `sessionKey`. Al eliminar una sesión, se eliminan sus
filas del tablero. `/new`/`/reset` no las modifica.

## Superficie del protocolo

RPC (tabla de métodos del núcleo, esquemas typebox en `gateway-protocol`):

- `board.get { sessionKey }` → pestañas + metadatos de widgets (sin bytes) — `operator.read`
- `board.update { sessionKey, ops[] }` — CRUD/reordenación de pestañas, mover/cambiar el tamaño/
  eliminar/desfijar widgets, estado del acoplamiento, enfocar pestaña — `operator.write`
- `board.widget.put { sessionKey, name, html, manifest, placement }` —
  `operator.write` (ruta de la herramienta del agente y ruta de fijación)
- `board.widget.grant { sessionKey, name, decision }` — `operator.approvals`
- `board.event { sessionKey, widget, payload }` — ingesta de eventos de estado de nivel 1 —
  `operator.write`

Eventos (en `EVENT_SCOPE_GUARDS`, ámbito de lectura):

- `board.changed { sessionKey, revision, widget? }` — cambió el estado persistente;
  la interfaz vuelve a obtenerlo (y recarga un iframe cuando está presente `widget`).
- `board.command { sessionKey, command }` — control transitorio de la interfaz (el agente cambia
  la pestaña visible, alterna el acoplamiento del chat) — el patrón `ui.command`.

Los bytes de los widgets se sirven mediante la superficie HTTP autenticada, no mediante el socket.

## Herramientas del agente

Tres herramientas en total (del núcleo, siempre registradas; el renderizado depende de la capacidad
de cliente `inline-widgets`, como actualmente):

- `show_widget { title, widget_code, name?, pin?, size?, tab?, after?,
capabilities? }` — crear/actualizar por nombre; `pin` lo coloca en el tablero.
  Sin `name`/`pin`, se comporta exactamente como ahora (insertado, efímero).
- `dashboard { action, ... }` — verbos de administración del tablero: `read`, `tab_create`,
  `tab_update`, `tab_delete`, `tabs_reorder`, `widget_move`, `widget_remove`,
  `unpin`, `focus_tab`, `set_chat_dock`.
- Las herramientas `cron` existentes cubren el nivel de automatización; no se necesita una herramienta nueva.

Las descripciones de las herramientas explican el vocabulario de tamaños/anclas y el modelo de niveles. Se
informa al agente sobre los eventos de nivel 1 del usuario mediante avisos de sesión, por ejemplo,
`[dashboard] user clicked "Refresh" on widget weather (tab main)`.

## Qué reemplaza esto

- **Se elimina `extensions/workspaces`.** Experimental, `enabledByDefault:
false`, nunca incluido en una versión estable (apareció por primera vez en las versiones beta 2026.7.2). Sin
  migración; una regla de doctor elimina `<stateDir>/workspaces/` obsoleto si está presente.
  Ideas aprovechadas: cálculos puros de cuadrícula, modelo de seguridad del puente (inicio del puerto,
  control de vinculación, límites de frecuencia), aprobación con bytes inmutables.
- **El alojamiento de widgets pasa de `extensions/canvas` al núcleo.** El almacén de documentos del lienzo,
  el contenedor de documentos, el servicio HTTP y la herramienta `show_widget` pasan al núcleo
  (`src/canvas/`); el plugin conserva la herramienta de control node-canvas (`canvas`) y
  A2UI. El anuncio `pluginSurfaceUrls["canvas"]` y las rutas
  `/__openclaw__/canvas` son contratos distribuidos de clientes nativos y permanecen
  estables. Las sesiones de Discord conservan la variante `show_widget` propiedad de Discord.
- **WorkBoard no se modifica** (la integración es un programa de seguimiento).

## Fuera del alcance (este programa)

- Uso compartido del tablero entre varios usuarios/ACL (futuro; llegará mediante el uso compartido de sesiones).
- Renderizado nativo del tablero en macOS/iOS (lo obtienen donde integren la
  interfaz de control; la ruta de widgets insertados no cambia).
- Widgets de datos integrados (tarjetas de sesiones/uso/cron): el puente de capacidades y los
  widgets creados por el agente cubren la v1; más adelante puede incorporarse un registro de tipos integrados.
- WorkBoard en el panel.

## Plan de implementación

Árboles de trabajo independientes, creados con Codex, revisión+integración secuenciales. Integrar y después corregir.

| #   | Rama                                 | Alcance                                                                                                                                                                            | Depende de                        |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| T1  | `claude/dashboard-remove-workspaces` | Eliminar el plugin de espacios de trabajo + interfaz + documentación + claves de i18n; regla de limpieza de doctor                                                                 | —                                 |
| T2  | `claude/dashboard-canvas-core`       | Promover el alojamiento de widgets + `show_widget` al núcleo; el plugin del lienzo conserva la herramienta de Node; ningún cambio de comportamiento                                | —                                 |
| T3  | `claude/dashboard-domain`            | Tablas de la base de datos del agente (incremento de esquema), RPC `board.*` + eventos, herramienta `dashboard`, argumentos de fijación/nombre/manifiesto de `show_widget`, avisos de nivel 1, el restablecimiento conserva el tablero | T2                                |
| T4  | `claude/dashboard-ui`                | Vista del tablero + barra de pestañas + cuadrícula fluida con compactación automática + acoplamiento del chat (izquierda/derecha/inferior/oculto) + opción de fijación de transcripciones + vista del tablero en la barra lateral + confirmación de restablecimiento | T3 (primero simulaciones mediante fixtures de desarrollo) |
| T5  | `claude/dashboard-capabilities`      | Almacén/interfaz de concesiones + inmovilización de bytes; trasladar los widgets `html` al host de entorno aislado compartido; herramientas del host (`openclaw.prompt.send/state.emit/data.read/cron.trigger`); CSP `net`; capa de compatibilidad de creación | T3, T4                            |
| T7  | `claude/dashboard-mcp-apps`          | Tipo de contenido `mcp-app`: opción de fijación en vistas de aplicaciones insertadas, almacenamiento de descriptores, regeneración/renovación de arrendamientos, concesiones duraderas para herramientas del servidor (reutiliza el host de aplicaciones MCP ya distribuido) | T3, T4                            |
| T6  | pulido                               | E2E en vivo en un Gateway temporal (claves reales), capturas de pantalla, correcciones, reescritura de `/web/dashboard` centrada en el usuario, revisión para habilitarlo de forma predeterminada | todo                              |

Validación según las reglas del repositorio: vitest focalizado localmente, comprobaciones completas en
Crabbox/Testbox, `$autoreview` antes de cada integración y prueba en vivo para T6.
