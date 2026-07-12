---
read_when:
    - Añadir o modificar la representación de tarjetas de mensaje, gráficos, tablas, botones o selectores
    - Creación de un Plugin de canal compatible con mensajes salientes enriquecidos
    - Cambio de las capacidades de presentación o entrega de la herramienta de mensajes
    - Depuración de regresiones de renderizado de tarjetas, bloques y componentes específicas del proveedor
summary: Tarjetas semánticas de mensajes, gráficos, tablas, controles, texto alternativo e indicaciones de entrega para plugins de canal
title: Presentación de mensajes
x-i18n:
    generated_at: "2026-07-12T14:44:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 400841f6fd1817350bffdfca15c7154bc98811fbe984056416d86d7fe990b5b5
    source_path: plugins/message-presentation.md
    workflow: 16
---

La presentación de mensajes es el contrato compartido de OpenClaw para interfaces enriquecidas de chat saliente.
Permite que los agentes, los comandos de la CLI, los flujos de aprobación y los plugins describan una sola vez la
intención del mensaje, mientras cada plugin de canal representa la mejor forma nativa que puede.

Use la presentación para interfaces de mensajes portátiles: secciones de texto, texto contextual o de pie de página
breve, separadores, gráficos, tablas, botones, menús de selección y título o tono de tarjetas.

No añada al recurso compartido de mensajes nuevos campos nativos del proveedor, como `components` de Discord,
`blocks` de Slack, `buttons` de Telegram, `card` de Teams o `card` de Feishu.
Esos campos son resultados de representación cuyo propietario es el plugin de canal.

## Contrato

Los autores de plugins importan el contrato público desde:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Estructura:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] }
  | {
      type: "chart";
      chartType: "pie";
      title: string;
      segments: Array<{ label: string; value: number }>;
    }
  | {
      type: "chart";
      chartType: "bar" | "area" | "line";
      title: string;
      categories: string[];
      series: Array<{ name: string; values: number[] }>;
      xLabel?: string;
      yLabel?: string;
    }
  | {
      type: "table";
      caption: string;
      headers: string[];
      rows: Array<Array<string | number>>;
      rowHeaderColumnIndex?: number;
    };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: "allow-once" | "allow-always" | "deny";
    }
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Valor de callback heredado. Para controles nuevos, prefiera action. */
  value?: string;
  /** @deprecated Use una acción con el tipo "url". */
  url?: string;
  /** @deprecated Use una acción con el tipo "web-app". */
  webApp?: { url: string };
  /** @deprecated Use una acción con el tipo "web-app". */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: Extract<MessagePresentationAction, { type: "command" | "callback" }>;
  /** Valor de callback heredado. Para controles nuevos, prefiera action. */
  value?: string;
};

type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

Semántica de los botones:

- `action.type: "command"` ejecuta un comando de barra nativo mediante la ruta de
  comandos del núcleo. Úselo para los botones y menús de comandos integrados.
- `action.type: "callback"` transporta datos opacos del plugin mediante la ruta de
  interacción del canal. Los plugins de canal no deben reinterpretar los datos del callback como
  comandos de barra.
- `action.type: "approval"` identifica una aprobación duradera del operador, su
  tipo explícito `exec` o `plugin` y la decisión solicitada. Los plugins de canal
  codifican esa acción en un callback privado del transporte y la resuelven mediante
  el servicio de aprobación; no deben analizar el texto del comando `/approve` ni inferir
  el tipo a partir del identificador.
- `action.type: "url"` abre un enlace normal.
- `action.type: "web-app"` inicia una aplicación web nativa del canal.
- `value` es el valor opaco heredado del callback. Los controles nuevos deben usar `action`
  para que los plugins de canal puedan asignar comandos y callbacks sin deducirlos a partir del texto.
- `url`, `webApp` y `web_app` siguen aceptándose como entradas obsoletas en el límite.
  Los normalizadores conservan estos campos para que los representadores puedan distinguir la semántica
  heredada publicada de las acciones tipadas explícitas. Los productores nuevos deben usar `action`.
- `label` es obligatorio y también se utiliza en la alternativa de texto.
- `style` es orientativo. Los representadores deben asignar los estilos no compatibles a un valor
  predeterminado seguro, no hacer que falle el envío.
- `priority` es opcional. Cuando un canal anuncia límites de acciones y es necesario
  descartar controles, el núcleo conserva primero los botones con mayor prioridad y mantiene
  el orden original entre los botones con la misma prioridad. Cuando todos los controles caben, se conserva
  el orden definido por el autor.
- `disabled` es opcional. Los canales deben habilitarlo explícitamente mediante `supportsDisabled`; de lo contrario,
  el núcleo degrada el control deshabilitado a texto alternativo no interactivo. Un
  botón deshabilitado siempre se representa únicamente con la etiqueta en el texto alternativo, incluso cuando
  contiene una acción `command`.
- `reusable` es opcional. Los canales compatibles con callbacks nativos reutilizables pueden
  mantener disponible la acción después de una interacción correcta. Úselo para
  acciones repetibles o idempotentes, como actualizar, inspeccionar o mostrar más detalles;
  déjelo sin definir para las aprobaciones normales de un solo uso y las acciones destructivas.

Semántica de la selección:

- `options[].action` solo acepta `command` o `callback`; las acciones de aprobación y enlace solo están disponibles para botones.
- `options[].value` es el valor de aplicación heredado seleccionado.
- `placeholder` es orientativo y los canales sin compatibilidad nativa con
  selecciones pueden ignorarlo.
- Si un canal no admite selecciones, el texto alternativo enumera las etiquetas.

Semántica de los gráficos:

- `pie` requiere valores de segmento positivos.
- `bar`, `area` y `line` usan una matriz `categories` ordenada. Cada serie
  proporciona exactamente un valor finito por categoría, en el mismo orden.
- Las etiquetas de las categorías y los nombres de las series deben ser únicos. Los bloques de gráficos
  no válidos o incompletos se descartan durante la normalización en lugar de modificar silenciosamente los datos.
- La representación nativa de gráficos se habilita explícitamente mediante `presentationCapabilities.charts`.
  Los demás canales reciben el título del gráfico, los ejes, las categorías, las series y los valores
  como texto determinista. Esta es también la alternativa de accesibilidad.

Semántica de las tablas:

- `caption` es un encabezado breve obligatorio. `headers` debe contener al menos una
  etiqueta de columna única y no vacía.
- `rows` debe contener al menos una fila. Cada fila debe tener exactamente una celda por
  encabezado y cada celda debe ser una cadena no vacía o un número finito.
- `rowHeaderColumnIndex` es un índice opcional basado en cero que identifica la columna
  cuyas celdas deben exponerse como encabezados de fila mediante los representadores nativos.
- La normalización de tablas es atómica. Un título, encabezado, ancho de fila, celda
  o índice de encabezado de fila no válido hace que se descarte el bloque de tabla, en lugar de truncar o reparar
  sus datos.
- La representación nativa de tablas se habilita explícitamente mediante `presentationCapabilities.tables`.
  Los demás canales reciben el título y cada fila como texto lineal determinista,
  con los espacios en blanco internos contraídos:

  ```text
  Canalización abierta (tabla)
  - Cuenta: Acme; Etapa: Ganada; ARR: 125000
  - Cuenta: Globex; Etapa: Revisión; ARR: 82000
  ```

No existe un discriminador `report` independiente. Componga un informe mediante `title`,
`tone`, `text`, `context`, `chart`, `table` y bloques de acciones. Esto permite representar cada
bloque de forma independiente y proporciona al informe completo la misma
alternativa de texto determinista.

## Ejemplos de productores

Tarjeta sencilla:

```json
{
  "title": "Aprobación del despliegue",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "La versión canary está lista para promoverse." },
    { "type": "context", "text": "Compilación 1234; la fase de preproducción se completó correctamente." },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "Aprobar",
          "action": { "type": "callback", "value": "deploy:approve" },
          "style": "success"
        },
        {
          "label": "Rechazar",
          "action": { "type": "callback", "value": "deploy:decline" },
          "style": "danger"
        }
      ]
    }
  ]
}
```

Botón de enlace solo con URL:

```json
{
  "blocks": [
    { "type": "text", "text": "Las notas de la versión están listas." },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "Abrir notas",
          "action": { "type": "url", "url": "https://example.com/release" }
        }
      ]
    }
  ]
}
```

Botón de Mini App de Telegram:

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "Iniciar",
          "action": { "type": "web-app", "url": "https://example.com/app" }
        }
      ]
    }
  ]
}
```

Menú de selección:

```json
{
  "title": "Elegir entorno",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Entorno",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Producción", "value": "env:prod" }
      ]
    }
  ]
}
```

Gráfico:

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "line",
      "title": "Ingresos trimestrales",
      "categories": ["T1", "T2", "T3"],
      "series": [
        { "name": "Producto", "values": [120, 145, 138] },
        { "name": "Servicios", "values": [80, 95, 104] }
      ],
      "xLabel": "Trimestre",
      "yLabel": "Ingresos"
    }
  ]
}
```

Informe de tabla:

```json
{
  "title": "Informe de canalización",
  "tone": "info",
  "blocks": [
    { "type": "text", "text": "Oportunidades actuales por etapa." },
    {
      "type": "table",
      "caption": "Canalización abierta",
      "headers": ["Cuenta", "Etapa", "ARR"],
      "rows": [
        ["Acme", "Ganada", 125000],
        ["Globex", "Revisión", 82000]
      ],
      "rowHeaderColumnIndex": 0
    },
    { "type": "context", "text": "Actualizado a partir de la instantánea del CRM." }
  ]
}
```

Envío mediante la CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Aprobación del despliegue" \
  --presentation '{"title":"Aprobación del despliegue","tone":"warning","blocks":[{"type":"text","text":"La versión canary está lista."},{"type":"buttons","buttons":[{"label":"Aprobar","value":"deploy:approve","style":"success"},{"label":"Rechazar","value":"deploy:decline","style":"danger"}]}]}'
```

Entrega fijada:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Tema abierto" \
  --pin
```

Entrega fijada con JSON explícito:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Contrato del representador

Los plugins de canal declaran la compatibilidad de representación en su adaptador de salida:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
    charts: false,
    tables: false,
    limits: {
      actions: {
        maxActions: 25,
        maxActionsPerRow: 5,
        maxRows: 5,
        maxLabelLength: 80,
        maxValueBytes: 100,
        supportsStyles: true,
        supportsDisabled: false,
      },
      selects: {
        maxOptions: 25,
        maxLabelLength: 100,
        maxValueBytes: 100,
      },
      text: {
        maxLength: 2000,
        encoding: "characters",
        markdownDialect: "discord-markdown",
      },
    },
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

Los valores booleanos de capacidad describen qué elementos puede hacer interactivos el representador. Los
`limits` opcionales describen el ámbito genérico que el núcleo puede adaptar antes de llamar al
representador:

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  charts?: boolean;
  tables?: boolean;
  limits?: {
    actions?: {
      maxActions?: number;
      maxActionsPerRow?: number;
      maxRows?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
      supportsStyles?: boolean;
      supportsDisabled?: boolean;
      supportsLayoutHints?: boolean;
    };
    selects?: {
      maxOptions?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
    };
    text?: {
      maxLength?: number;
      encoding?: "characters" | "utf8-bytes" | "utf16-units";
      markdownDialect?: "plain" | "markdown" | "html" | "slack-mrkdwn" | "discord-markdown";
      supportsEdit?: boolean;
    };
  };
};
```

El núcleo aplica límites genéricos a los controles semánticos antes del renderizado. Los renderizadores
siguen siendo responsables de la validación final específica del proveedor y del recorte relacionado con la cantidad de bloques nativos,
el tamaño de las tarjetas, los límites de las URL y las particularidades del proveedor que no pueden expresarse en
el contrato genérico. Si los límites eliminan todos los controles de un bloque, el núcleo conserva
las etiquetas como texto de contexto no interactivo, de modo que el mensaje entregado siga teniendo una
alternativa visible.

## Flujo de renderizado del núcleo

En la ruta de salida canónica utilizada por la CLI y las acciones de mensajes estándar, el núcleo:

1. Normaliza la carga útil de presentación.
2. Resuelve el adaptador de salida del canal de destino.
3. Lee `presentationCapabilities`.
4. Aplica límites genéricos de capacidades, como la cantidad de acciones, la longitud de las etiquetas y
   la cantidad de opciones de selección, cuando el adaptador los anuncia. Los bloques de gráficos y tablas
   se convierten en texto determinista, a menos que el adaptador anuncie explícitamente
   `charts: true` o `tables: true`, respectivamente.
5. Llama a `renderPresentation` cuando el adaptador puede renderizar la carga útil.
6. Recurre a texto conservador cuando el adaptador no está disponible o no puede renderizar.
7. Envía la carga útil resultante a través de la ruta normal de entrega del canal.
8. Aplica metadatos de entrega, como `delivery.pin`, después del primer mensaje
   enviado correctamente.

Los flujos locales del canal para respuestas o vistas previas que consumen `ReplyPayload` directamente
deben entrar en esa ruta canónica o materializar la misma alternativa de
presentación antes de reducir la carga útil a texto sin formato o contenido multimedia.

El núcleo controla el comportamiento alternativo para que los productores puedan mantenerse independientes del canal. Los Plugins
de canal controlan el renderizado nativo y la gestión de interacciones.

## Reglas de degradación

La presentación debe poder enviarse de forma segura en canales limitados.

El texto alternativo incluye:

- `title` como primera línea
- bloques `text` como párrafos normales
- bloques `context` como líneas de contexto compactas
- bloques `divider` como separador visual
- etiquetas de botones, incluidas las URL de los botones de enlace
- etiquetas de opciones de selección
- título, tipo, ejes, categorías, series y valores del gráfico
- título de la tabla, encabezados y cada valor de fila

### Visibilidad del valor alternativo del botón

Cuando un canal no puede renderizar controles interactivos, los valores de botones y selectores se muestran como texto sin formato. Este comportamiento alternativo mantiene la facilidad de uso y, al mismo tiempo, preserva la privacidad de los datos opacos de devolución de llamada:

- Las **acciones de tipo `command`** se representan como entradas `label: \`command\`` so users can
  copy the command and run it manually in the channel input.
- **`callback`-typed actions** and legacy **`value`** fields render as
  label-only. The opaque callback value is not exposed in fallback text.
- **`approval`-typed actions** render label-only. Approval IDs and decisions are
  transport data and are not exposed through generic scalar helpers or fallback
  text.
- **`url` / `web-app` actions** and deprecated **`url` / `webApp` / `web_app`**
  que muestran el texto de la URL junto a la etiqueta del botón, ya que la URL es
  visible para el usuario.
- Las **opciones de selección** se representan solo con la etiqueta. El valor subyacente de la opción no
  se muestra en el texto alternativo.

Los adaptadores de canal que añaden indicaciones sobre comandos manuales en su interfaz de reserva (p. ej.,
las instrucciones para comentar documentos de Feishu) deben determinar la presencia de comandos
a partir de los mismos bloques de presentación que utiliza el renderizador de reserva, de modo que el
texto de las indicaciones solo aparezca cuando realmente se muestre un comando manual.

Los controles nativos no compatibles deben degradarse en lugar de provocar el fallo de todo el envío.
Ejemplos:

- Telegram con los botones en línea desactivados envía texto alternativo.
- Un canal sin compatibilidad con selecciones muestra las opciones de selección como texto.
- Un canal sin compatibilidad nativa con gráficos muestra los datos del gráfico como texto.
- Un canal sin compatibilidad nativa con tablas muestra cada fila de la tabla como texto.
- Un botón que solo contiene una URL se convierte en un botón de enlace nativo o en una línea de URL alternativa.
- Los fallos opcionales al fijar no provocan el fallo del mensaje entregado.

La principal excepción es `delivery.pin.required: true`; si se solicita que fijar sea
obligatorio y el canal no puede fijar el mensaje enviado, la entrega informa de un fallo.

## Asignación de proveedores

Renderizadores incluidos actualmente:

| Canal          | Destino de renderizado nativo                         | Notas                                                                                                                                                                                                                                                                        |
| -------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord        | Componentes y contenedores de componentes           | Conserva `channelData.discord.components` heredado para los productores existentes de cargas útiles nativas del proveedor, pero los nuevos envíos compartidos deben usar `presentation`.                                                                                      |
| Feishu         | Tarjetas interactivas                                | El encabezado de la tarjeta puede usar `title`; el cuerpo evita duplicar ese título.                                                                                                                                                                                         |
| Matrix         | Alternativa de texto más campo de evento estructurado | Los botones y selectores se anuncian como compatibles, pero actualmente cada bloque se renderiza como la salida de `renderMessagePresentationFallbackText` transportada en un campo de evento `com.openclaw.presentation`, no como widgets interactivos nativos.               |
| Mattermost     | Texto más propiedades interactivas                   | Los selectores y separadores no son compatibles; esos bloques se degradan a texto.                                                                                                                                                                                           |
| Microsoft Teams | Tarjetas adaptables                                 | Cuando se proporcionan ambos, se incluye el texto `message` sin formato junto con la tarjeta. Los selectores, estilos y el estado deshabilitado no son compatibles.                                                                                                           |
| Slack          | Block Kit                                            | Renderiza `chart` como `data_visualization` nativo y `table` como `data_table` nativo; conserva `channelData.slack.blocks` heredado, pero los nuevos envíos compartidos deben usar `presentation`.                                                                             |
| Telegram       | Texto más teclados en línea                          | Los botones y selectores requieren la capacidad de botones en línea en la superficie de destino; de lo contrario, se utiliza la alternativa de texto.                                                                                                                       |
| Canales simples | Alternativa de texto                                | Los canales sin renderizador siguen recibiendo una salida legible.                                                                                                                                                                                                           |

La compatibilidad con cargas útiles nativas del proveedor es una facilidad de transición para los productores
de respuestas existentes. No es un motivo para añadir nuevos campos nativos compartidos.

## Presentación frente a InteractiveReply

`InteractiveReply` es el subconjunto interno anterior utilizado por los auxiliares
de aprobación e interacción. Admite:

- texto
- botones
- selectores

`MessagePresentation` es el contrato canónico de envío compartido. Añade:

- título
- tono
- contexto
- separador
- gráfico
- tabla
- botones solo de URL
- metadatos genéricos de entrega mediante `ReplyPayload.delivery`

Use los auxiliares de `openclaw/plugin-sdk/interactive-runtime` al conectar código
anterior:
__OC_I18N_900014__
El código nuevo debe aceptar o producir `MessagePresentation` directamente. Las cargas útiles
`interactive` existentes son un subconjunto obsoleto de `presentation`; se mantiene la compatibilidad
en tiempo de ejecución para los productores anteriores.

Auxiliares no obsoletos que conviene conocer:

- `normalizeMessagePresentation(raw)` / `hasMessagePresentationBlocks(value)`
  validan y convierten una carga útil sin tipo (por ejemplo, JSON procedente de la opción
  `--presentation` de la CLI) en `MessagePresentation`.
- `isMessagePresentationInteractiveBlock(block)` restringe un bloque a la
  unión `buttons` | `select`.
- `resolveMessagePresentationButtonAction(button)` y
  `resolveMessagePresentationOptionAction(option)` devuelven la acción tipada canónica
  mientras aceptan campos de límite obsoletos. Una `action` explícita
  siempre prevalece.
- `resolveMessagePresentationActionValue(action)` /
  `resolveMessagePresentationControlValue(control)` leen únicamente valores escalares
  de comandos y devoluciones de llamada. Una acción canónica no escalar nunca recurre a un
  `value` heredado paralelo, por lo que los identificadores de aprobación y los destinos de enlaces conservan su tipo.
- `renderMessagePresentationChartFallbackText(block)` /
  `renderMessagePresentationTableFallbackText(block)` renderizan un bloque de datos
  estructurados como texto determinista para las rutas alternativas específicas del canal.

Los tipos `InteractiveReply*` heredados y los auxiliares de conversión están marcados como
`@deprecated` en el SDK:

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock` y
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` y
`presentationToInteractiveControlsReply(...)` siguen disponibles como puentes de
renderizado para implementaciones de canales heredadas. El código productor nuevo no debe
invocarlos; debe enviar `presentation` y dejar que la adaptación del núcleo o del canal gestione el renderizado.

Los auxiliares de aprobación también tienen sustitutos que priorizan la presentación:

- use `buildApprovalPresentationFromActionDescriptors(...)` en lugar de
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- use `buildApprovalPresentation(...)` en lugar de
  `buildApprovalInteractiveReply(...)`
- use `buildExecApprovalPresentation(...)` en lugar de
  `buildExecApprovalInteractiveReply(...)`

Esos constructores publicados siguen estando respaldados por comandos para garantizar la compatibilidad con plugins. El código del Gateway
y de los canales incluidos que posea un tipo de aprobación persistente debe usar
`buildTypedApprovalPresentation(...)`,
`buildTypedExecApprovalPendingReplyPayload(...)` o
`buildTypedPluginApprovalPendingReplyPayload(...)` para que los transportes reciban una
acción `approval` explícita en lugar de inferir la semántica del texto `/approve`.

`renderMessagePresentationFallbackText(...)` devuelve una cadena vacía para
los bloques de presentación que no tienen alternativa de texto, como una presentación
que solo contiene un separador. Los transportes que requieran un cuerpo de envío no vacío pueden pasar
`emptyFallback` para optar por un cuerpo mínimo sin cambiar el contrato predeterminado
de la alternativa.

## Fijación de entrega

Fijar es un comportamiento de entrega, no de presentación. Use `delivery.pin` en lugar de
campos nativos del proveedor como `channelData.telegram.pin`.

Semántica:

- `pin: true` fija el primer mensaje entregado correctamente.
- El valor predeterminado de `pin.notify` es `false`.
- El valor predeterminado de `pin.required` es `false`.
- Los fallos opcionales al fijar se degradan y dejan intacto el mensaje enviado.
- Los fallos obligatorios al fijar hacen que la entrega falle.
- En los mensajes divididos en fragmentos, se fija el primer fragmento entregado, no el fragmento final.

Las acciones de mensaje manuales `pin`, `unpin` y `pins` siguen existiendo para los
mensajes existentes cuando el proveedor admite esas operaciones.

## Lista de comprobación para autores de plugins

- Declare `presentation` desde `describeMessageTool(...)` cuando el canal pueda
  renderizar o degradar de forma segura la presentación semántica.
- Añada `presentationCapabilities` al adaptador de salida del entorno de ejecución.
- Implemente `renderPresentation` en el código del entorno de ejecución, no en el código de
  configuración del Plugin del plano de control.
- Mantenga las bibliotecas de interfaz nativas fuera de las rutas críticas de configuración y catálogo.
- Declare los límites de capacidad genéricos en `presentationCapabilities.limits` cuando
  se conozcan.
- Preserve los límites finales de la plataforma en el renderizador y las pruebas.
- Añada pruebas de comportamiento alternativo para gráficos, tablas, botones, selectores y botones
  de URL no compatibles, la duplicación de título y texto, y los envíos que combinan `message`
  con `presentation`.
- Añada compatibilidad para fijar durante la entrega mediante `deliveryCapabilities.pin` y
  `pinDeliveredMessage` solo cuando el proveedor pueda fijar el identificador del mensaje enviado.
- No exponga nuevos campos nativos del proveedor para tarjetas, bloques, componentes o botones mediante
  el esquema compartido de acciones de mensajes.

## Documentación relacionada

- [CLI de mensajes](/es/cli/message)
- [Descripción general del SDK de plugins](/es/plugins/sdk-overview)
- [Arquitectura de plugins](/es/plugins/architecture-internals#message-tool-schemas)
- [Plan de refactorización de la presentación de canales](/es/plan/ui-channels)
