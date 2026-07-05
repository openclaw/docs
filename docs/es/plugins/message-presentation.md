---
read_when:
    - Agregar o modificar la renderización de tarjetas de mensaje, botones o selectores
    - Crear un Plugin de canal compatible con mensajes salientes enriquecidos
    - Cambio de la presentación de la herramienta de mensajes o de las capacidades de entrega
    - Depuración de regresiones de renderización de tarjetas, bloques o componentes específicas del proveedor
summary: Tarjetas de mensajes semánticas, botones, menús de selección, texto alternativo e indicaciones de entrega para plugins de canal
title: Presentación de mensajes
x-i18n:
    generated_at: "2026-07-05T11:31:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49e9a4657d27b90d12fb921bb4c9f0e7f0ae70d9dc452c8365626c9fdb5adcc8
    source_path: plugins/message-presentation.md
    workflow: 16
---

La presentación de mensajes es el contrato compartido de OpenClaw para una interfaz de usuario de chat saliente enriquecida.
Permite que agentes, comandos de CLI, flujos de aprobación y plugins describan una vez la intención del mensaje, mientras cada plugin de canal renderiza la mejor forma nativa que pueda.

Usa la presentación para interfaces de usuario de mensajes portátiles: secciones de texto, texto breve de contexto/pie, divisores, botones, menús de selección y título/tono de tarjeta.

No agregues campos nativos nuevos de proveedor, como Discord `components`, Slack `blocks`, Telegram `buttons`, Teams `card` o Feishu `card`, a la herramienta de mensajes compartida. Esas son salidas de renderizador propiedad del plugin de canal.

## Contrato

Los autores de plugins importan el contrato público desde:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Forma:

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
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Valor de callback heredado. Prefiere action para controles nuevos. */
  value?: string;
  url?: string;
  webApp?: { url: string };
  /** @deprecated Usa webApp. Aceptado solo para cargas JSON heredadas. */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: MessagePresentationAction;
  /** Valor de callback heredado. Prefiere action para controles nuevos. */
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

Semántica de botones:

- `action.type: "command"` ejecuta un comando de barra nativo a través de la ruta de comandos del núcleo. Usa esto para botones y menús de comandos integrados.
- `action.type: "callback"` transporta datos opacos del plugin a través de la ruta de interacción del canal. Los plugins de canal no deben reinterpretar datos de callback como comandos de barra.
- `value` es el valor de callback opaco heredado. Los controles nuevos deberían usar `action` para que los plugins de canal puedan mapear comandos y callbacks sin inferirlo desde el texto.
- `url` es un botón de enlace. Puede existir sin `value`.
- `webApp` describe un botón de aplicación web nativa del canal. Telegram lo renderiza como `web_app` y solo lo admite en chats privados. `web_app` todavía se acepta en cargas JSON flexibles por compatibilidad, pero los productores TypeScript deberían usar `webApp`.
- `label` es obligatorio y también se usa en el texto de respaldo.
- `style` es orientativo. Los renderizadores deberían mapear estilos no admitidos a un valor predeterminado seguro, no fallar el envío.
- `priority` es opcional. Cuando un canal anuncia límites de acciones y deben descartarse controles, el núcleo conserva primero los botones de mayor prioridad y preserva el orden original entre botones con la misma prioridad. Cuando todos los controles caben, se preserva el orden escrito.
- `disabled` es opcional. Los canales deben optar por admitirlo con `supportsDisabled`; de lo contrario, el núcleo degrada el control deshabilitado a texto de respaldo no interactivo. Un botón deshabilitado siempre se renderiza solo con etiqueta en el texto de respaldo, incluso cuando lleva una acción `command`.
- `reusable` es opcional. Los canales que admiten callbacks nativos reutilizables pueden mantener la acción disponible después de una interacción exitosa. Úsalo para acciones repetibles o idempotentes como actualizar, inspeccionar o ver más detalles; déjalo sin establecer para aprobaciones normales de un solo uso y acciones destructivas.

Semántica de selección:

- `options[].action` tiene el mismo significado de comando/callback que `action` de botón.
- `options[].value` es el valor de aplicación seleccionado heredado.
- `placeholder` es orientativo y puede ser ignorado por canales sin soporte nativo para selección.
- Si un canal no admite selecciones, el texto de respaldo enumera las etiquetas.

## Ejemplos de productores

Tarjeta simple:

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

Botón de enlace solo URL:

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
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
      "buttons": [{ "label": "Launch", "web_app": { "url": "https://example.com/app" } }]
    }
  ]
}
```

Menú de selección:

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

Envío de CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

Entrega fijada:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
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

## Contrato del renderizador

Los plugins de canal declaran soporte de renderizado en su adaptador saliente:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
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

Los booleanos de capacidad describen qué puede hacer interactivo el renderizador. Los `limits` opcionales describen el contenedor genérico que el núcleo puede adaptar antes de llamar al renderizador:

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
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

El núcleo aplica límites genéricos a los controles semánticos antes de renderizar. Los renderizadores siguen siendo responsables de la validación y el recorte finales específicos del proveedor para el conteo de bloques nativos, el tamaño de tarjeta, los límites de URL y particularidades del proveedor que no pueden expresarse en el contrato genérico. Si los límites eliminan todos los controles de un bloque, el núcleo conserva las etiquetas como texto de contexto no interactivo para que el mensaje entregado aún tenga un respaldo visible.

## Flujo de renderizado del núcleo

Cuando un `ReplyPayload` o una acción de mensaje incluye `presentation`, el núcleo:

1. Normaliza la carga de presentación.
2. Resuelve el adaptador saliente del canal de destino.
3. Lee `presentationCapabilities`.
4. Aplica límites de capacidad genéricos, como conteo de acciones, longitud de etiquetas y conteo de opciones de selección, cuando el adaptador los anuncia.
5. Llama a `renderPresentation` cuando el adaptador puede renderizar la carga.
6. Recurre a texto conservador cuando el adaptador está ausente o no puede renderizar.
7. Envía la carga resultante a través de la ruta normal de entrega del canal.
8. Aplica metadatos de entrega, como `delivery.pin`, después del primer mensaje enviado correctamente.

El núcleo es responsable del comportamiento de respaldo para que los productores puedan mantenerse agnósticos del canal. Los plugins de canal son responsables del renderizado nativo y el manejo de interacciones.

## Reglas de degradación

La presentación debe ser segura para enviar en canales limitados.

El texto de respaldo incluye:

- `title` como primera línea
- bloques `text` como párrafos normales
- bloques `context` como líneas de contexto compactas
- bloques `divider` como separador visual
- etiquetas de botones, incluidas URL para botones de enlace
- etiquetas de opciones de selección

### Visibilidad de respaldo del valor de botón

Cuando un canal no puede renderizar controles interactivos, los valores de botones y selecciones se convierten en texto sin formato como respaldo. El comportamiento de respaldo preserva la usabilidad mientras mantiene privados los datos opacos de callback:

- Las acciones tipadas como **`command`** se renderizan como `label: \`command\`` para que los usuarios puedan copiar el comando y ejecutarlo manualmente en la entrada del canal.
- Las acciones tipadas como **`callback`** y los campos **`value`** heredados se renderizan solo con etiqueta. El valor de callback opaco no se expone en el texto de respaldo.
- Los botones **`url` / `webApp`** renderizan el texto de la URL junto a la etiqueta del botón, ya que la URL es visible para el usuario.
- Las **opciones de selección** se renderizan solo con etiqueta. El valor de opción subyacente no se expone en el texto de respaldo.

Los adaptadores de canal que agreguen orientación de comandos manuales en su interfaz de respaldo (por ejemplo, instrucciones de comentarios de documento de Feishu) deben derivar la comprobación de presencia de comandos de los mismos bloques de presentación que usa el renderizador de respaldo, para que el texto de orientación solo aparezca cuando realmente se muestra un comando manual.

Los controles nativos no admitidos deberían degradarse en lugar de hacer fallar todo el envío. Ejemplos:

- Telegram con botones en línea deshabilitados envía texto de respaldo.
- Un canal sin soporte para selección enumera las opciones de selección como texto.
- Un botón solo URL se convierte en un botón de enlace nativo o en una línea de URL de respaldo.
- Los fallos opcionales al fijar no hacen fallar el mensaje entregado.

La excepción principal es `delivery.pin.required: true`; si se solicita fijar como obligatorio y el canal no puede fijar el mensaje enviado, la entrega informa un fallo.

## Mapeo de proveedor

Renderizadores integrados actuales:

| Canal           | Destino de renderizado nativo             | Notas                                                                                                                                                                                                                   |
| --------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Componentes y contenedores de componentes | Conserva el `channelData.discord.components` heredado para productores existentes de cargas útiles nativas del proveedor, pero los nuevos envíos compartidos deben usar `presentation`.                                  |
| Feishu          | Tarjetas interactivas                     | El encabezado de la tarjeta puede usar `title`; el cuerpo evita duplicar ese título.                                                                                                                                     |
| Matrix          | Reserva de texto más campo de evento estructurado | Los botones/selectores se anuncian como compatibles, pero actualmente cada bloque se renderiza como salida de `renderMessagePresentationFallbackText` transportada en un campo de evento `com.openclaw.presentation`, no como widgets interactivos nativos. |
| Mattermost      | Texto más props interactivas              | Los selectores y divisores no son compatibles; esos bloques degradan a texto.                                                                                                                                            |
| Microsoft Teams | Adaptive Cards                            | El texto plano de `message` se incluye con la tarjeta cuando se proporcionan ambos. Los selectores, estilos y el estado deshabilitado no son compatibles.                                                                |
| Slack           | Block Kit                                 | Conserva el `channelData.slack.blocks` heredado para productores existentes de cargas útiles nativas del proveedor, pero los nuevos envíos compartidos deben usar `presentation`.                                        |
| Telegram        | Texto más teclados en línea               | Los botones/selectores requieren capacidad de botón en línea para la superficie de destino; de lo contrario, se usa la reserva de texto.                                                                                  |
| Canales simples | Reserva de texto                          | Los canales sin renderizador siguen recibiendo una salida legible.                                                                                                                                                       |

La compatibilidad con cargas útiles nativas del proveedor es una facilidad de transición para productores de respuestas existentes. No es una razón para agregar nuevos campos nativos compartidos.

## Presentación frente a InteractiveReply

`InteractiveReply` es el subconjunto interno anterior que usan los ayudantes de aprobación e interacción. Admite:

- texto
- botones
- selectores

`MessagePresentation` es el contrato canónico de envío compartido. Agrega:

- título
- tono
- contexto
- divisor
- botones solo de URL
- metadatos genéricos de entrega mediante `ReplyPayload.delivery`

Usa los ayudantes de `openclaw/plugin-sdk/interactive-runtime` al conectar código anterior:
__OC_I18N_900011__
El código nuevo debe aceptar o producir `MessagePresentation` directamente. Las cargas útiles `interactive` existentes son un subconjunto obsoleto de `presentation`; el soporte en tiempo de ejecución permanece para productores anteriores.

Ayudantes no obsoletos que conviene conocer:

- `normalizeMessagePresentation(raw)` / `hasMessagePresentationBlocks(value)`
  validan y convierten una carga útil sin tipo (por ejemplo, JSON desde la marca
  `--presentation` de la CLI) en `MessagePresentation`.
- `isMessagePresentationInteractiveBlock(block)` reduce un bloque a la unión
  `buttons` | `select`.
- `resolveMessagePresentationActionValue(action)` /
  `resolveMessagePresentationControlValue(control)` leen el valor efectivo de
  comando/callback de una `action`, recurriendo al campo heredado `value`
  para `resolveMessagePresentationControlValue`.

Los tipos heredados `InteractiveReply*` y los ayudantes de conversión están marcados como
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
`presentationToInteractiveControlsReply(...)` siguen disponibles como puentes de renderizador
para implementaciones heredadas de canales. El código productor nuevo no debe llamarlos;
envía `presentation` y deja que la adaptación de núcleo/canal gestione el renderizado.

Los ayudantes de aprobación también tienen reemplazos que priorizan la presentación:

- usa `buildApprovalPresentationFromActionDescriptors(...)` en lugar de
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- usa `buildApprovalPresentation(...)` en lugar de
  `buildApprovalInteractiveReply(...)`
- usa `buildExecApprovalPresentation(...)` en lugar de
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` devuelve una cadena vacía para
bloques de presentación que no tienen reserva de texto, como una presentación
solo con divisor. Los transportes que requieren un cuerpo de envío no vacío pueden pasar
`emptyFallback` para optar por un cuerpo mínimo sin cambiar el contrato predeterminado
de reserva.

## Fijación de entrega

La fijación es comportamiento de entrega, no presentación. Usa `delivery.pin` en lugar de
campos nativos del proveedor como `channelData.telegram.pin`.

Semántica:

- `pin: true` fija el primer mensaje entregado correctamente.
- `pin.notify` tiene `false` como valor predeterminado.
- `pin.required` tiene `false` como valor predeterminado.
- Los fallos opcionales de fijación degradan y dejan intacto el mensaje enviado.
- Los fallos obligatorios de fijación hacen fallar la entrega.
- Los mensajes fragmentados fijan el primer fragmento entregado, no el fragmento final.

Las acciones manuales de mensaje `pin`, `unpin` y `pins` siguen existiendo para mensajes existentes donde el proveedor admite esas operaciones.

## Lista de comprobación para autores de Plugin

- Declara `presentation` desde `describeMessageTool(...)` cuando el canal pueda
  renderizar o degradar de forma segura la presentación semántica.
- Agrega `presentationCapabilities` al adaptador saliente de tiempo de ejecución.
- Implementa `renderPresentation` en el código de tiempo de ejecución, no en el código de configuración del Plugin del plano de control.
- Mantén las bibliotecas de interfaz nativa fuera de las rutas críticas de configuración/catálogo.
- Declara límites de capacidad genéricos en `presentationCapabilities.limits` cuando
  se conozcan.
- Conserva los límites finales de la plataforma en el renderizador y las pruebas.
- Agrega pruebas de reserva para botones no compatibles, selectores, botones de URL, duplicación de título/texto y envíos mixtos de `message` más `presentation`.
- Agrega soporte de fijación de entrega mediante `deliveryCapabilities.pin` y
  `pinDeliveredMessage` solo cuando el proveedor pueda fijar el id del mensaje enviado.
- No expongas nuevos campos nativos del proveedor de tarjeta/bloque/componente/botón mediante
  el esquema compartido de acciones de mensaje.

## Documentos relacionados

- [CLI de mensajes](/es/cli/message)
- [Descripción general del SDK de Plugin](/es/plugins/sdk-overview)
- [Arquitectura de Plugin](/es/plugins/architecture-internals#message-tool-schemas)
- [Plan de refactorización de presentación de canales](/es/plan/ui-channels)
