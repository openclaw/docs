---
read_when:
    - Agregar o modificar la representación de tarjetas de mensaje, botones o selectores
    - Crear un plugin de canal compatible con mensajes salientes enriquecidos
    - Cambiar las capacidades de presentación o entrega de herramientas de mensajes
    - Depuración de regresiones de renderizado de tarjetas/bloques/componentes específicas del proveedor
summary: Tarjetas de mensajes semánticas, botones, selectores, texto alternativo e indicaciones de entrega para plugins de canal
title: Presentación de mensajes
x-i18n:
    generated_at: "2026-06-27T12:15:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fc5eca9dfe637fbdd56dcb473a68540035f8b990eab8cf139a4e27711536f57
    source_path: plugins/message-presentation.md
    workflow: 16
---

La presentación de mensajes es el contrato compartido de OpenClaw para interfaces de chat salientes enriquecidas.
Permite que agentes, comandos de CLI, flujos de aprobación y plugins describan la intención del mensaje una sola vez, mientras cada plugin de canal renderiza la mejor forma nativa que pueda.

Usa la presentación para interfaces de mensaje portables:

- secciones de texto
- texto pequeño de contexto/pie
- divisores
- botones
- menús de selección
- título y tono de tarjeta

No agregues nuevos campos nativos de proveedor, como `components` de Discord, `blocks` de Slack, `buttons` de Telegram, `card` de Teams o `card` de Feishu, a la herramienta de mensajes compartida. Esas son salidas del renderizador propiedad del plugin de canal.

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
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
  url?: string;
  webApp?: { url: string };
  /** @deprecated Use webApp. Accepted for legacy JSON payloads only. */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
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
- `action.type: "callback"` transporta datos opacos del plugin a través de la ruta de interacción del canal. Los plugins de canal no deben reinterpretar los datos de callback como comandos de barra.
- `value` es el valor opaco de callback heredado. Los controles nuevos deben usar `action` para que los plugins de canal puedan asignar comandos y callbacks sin inferirlo a partir del texto.
- `url` es un botón de enlace. Puede existir sin `value`.
- `webApp` describe un botón de aplicación web nativo del canal. Telegram lo renderiza como `web_app` y solo lo admite en chats privados. `web_app` aún se acepta en cargas JSON flexibles por compatibilidad, pero los productores TypeScript deben usar `webApp`.
- `label` es obligatorio y también se usa en el texto de reserva.
- `style` es orientativo. Los renderizadores deben asignar estilos no admitidos a un valor predeterminado seguro, no hacer fallar el envío.
- `priority` es opcional. Cuando un canal anuncia límites de acciones y deben descartarse controles, el núcleo conserva primero los botones de mayor prioridad y preserva el orden original entre botones con la misma prioridad. Cuando todos los controles caben, se preserva el orden creado.
- `disabled` es opcional. Los canales deben optar explícitamente con `supportsDisabled`; de lo contrario, el núcleo degrada el control deshabilitado a texto de reserva no interactivo.
- `reusable` es opcional. Los canales que admiten callbacks nativos reutilizables pueden mantener la acción disponible después de una interacción correcta. Úsalo para acciones repetibles o idempotentes, como actualizar, inspeccionar o ver más detalles; déjalo sin definir para aprobaciones normales de un solo uso y acciones destructivas.

Semántica de selección:

- `options[].action` tiene el mismo significado de comando/callback que `action` en botones.
- `options[].value` es el valor de aplicación seleccionado heredado.
- `placeholder` es orientativo y puede ser ignorado por canales sin soporte nativo para selección.
- Si un canal no admite selecciones, el texto de reserva enumera las etiquetas.

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

Botón de enlace solo con URL:

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

Envío por CLI:

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

Los plugins de canal declaran el soporte de renderizado en su adaptador saliente:

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

Los booleanos de capacidad describen lo que el renderizador puede hacer interactivo. `limits` opcional describe la envoltura genérica que el núcleo puede adaptar antes de llamar al renderizador:

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

El núcleo aplica límites genéricos a los controles semánticos antes del renderizado. Los renderizadores siguen siendo responsables de la validación y el recorte finales específicos del proveedor para el conteo de bloques nativos, tamaño de tarjeta, límites de URL y particularidades del proveedor que no puedan expresarse en el contrato genérico. Si los límites eliminan todos los controles de un bloque, el núcleo conserva las etiquetas como texto de contexto no interactivo para que el mensaje entregado siga teniendo una reserva visible.

## Flujo de renderizado del núcleo

Cuando un `ReplyPayload` o una acción de mensaje incluye `presentation`, el núcleo:

1. Normaliza la carga de presentación.
2. Resuelve el adaptador saliente del canal de destino.
3. Lee `presentationCapabilities`.
4. Aplica límites de capacidad genéricos, como conteo de acciones, longitud de etiquetas y conteo de opciones de selección, cuando el adaptador los anuncia.
5. Llama a `renderPresentation` cuando el adaptador puede renderizar la carga.
6. Recurre a texto conservador cuando el adaptador no está presente o no puede renderizar.
7. Envía la carga resultante a través de la ruta normal de entrega del canal.
8. Aplica metadatos de entrega, como `delivery.pin`, después del primer mensaje enviado correctamente.

El núcleo es responsable del comportamiento de reserva para que los productores puedan permanecer independientes del canal. Los plugins de canal son responsables del renderizado nativo y del manejo de interacciones.

## Reglas de degradación

La presentación debe ser segura para enviar en canales limitados.

El texto de reserva incluye:

- `title` como la primera línea
- bloques `text` como párrafos normales
- bloques `context` como líneas de contexto compactas
- bloques `divider` como separador visual
- etiquetas de botones, incluidas las URL para botones de enlace
- etiquetas de opciones de selección

Los controles nativos no admitidos deben degradarse en lugar de hacer fallar todo el envío. Ejemplos:

- Telegram con botones en línea deshabilitados envía texto de reserva.
- Un canal sin soporte de selección enumera las opciones de selección como texto.
- Un botón solo con URL se convierte en un botón de enlace nativo o en una línea de URL de reserva.
- Los fallos opcionales al fijar no hacen fallar el mensaje entregado.

La excepción principal es `delivery.pin.required: true`; si se solicita fijar como requisito y el canal no puede fijar el mensaje enviado, la entrega informa un fallo.

## Asignación de proveedores

Renderizadores incluidos actuales:

| Canal           | Destino de renderizado nativo       | Notas                                                                                                                                                                         |
| --------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Componentes y contenedores de componentes | Preserva `channelData.discord.components` heredado para productores existentes de cargas nativas del proveedor, pero los envíos compartidos nuevos deben usar `presentation`. |
| Slack           | Block Kit                           | Preserva `channelData.slack.blocks` heredado para productores existentes de cargas nativas del proveedor, pero los envíos compartidos nuevos deben usar `presentation`.       |
| Telegram        | Texto más teclados en línea         | Los botones/selecciones requieren capacidad de botón en línea para la superficie de destino; de lo contrario se usa texto de reserva.                                         |
| Mattermost      | Texto más props interactivas        | Otros bloques se degradan a texto.                                                                                                                                           |
| Microsoft Teams | Adaptive Cards                      | El texto simple de `message` se incluye con la tarjeta cuando se proporcionan ambos.                                                                                          |
| Feishu          | Tarjetas interactivas               | El encabezado de la tarjeta puede usar `title`; el cuerpo evita duplicar ese título.                                                                                          |
| Canales simples | Texto de reserva                    | Los canales sin renderizador siguen obteniendo una salida legible.                                                                                                            |

La compatibilidad con cargas útiles nativas del proveedor es una facilidad de transición para los productores de respuestas existentes. No es una razón para agregar nuevos campos nativos compartidos.

## Presentación frente a InteractiveReply

`InteractiveReply` es el subconjunto interno anterior que usan los auxiliares de aprobación e interacción. Admite:

- texto
- botones
- selectores

`MessagePresentation` es el contrato de envío compartido canónico. Agrega:

- título
- tono
- contexto
- divisor
- botones solo de URL
- metadatos de entrega genéricos mediante `ReplyPayload.delivery`

Usa auxiliares de `openclaw/plugin-sdk/interactive-runtime` al adaptar código anterior:

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

El código nuevo debe aceptar o producir `MessagePresentation` directamente. Las cargas útiles `interactive` existentes son un subconjunto obsoleto de `presentation`; el soporte en tiempo de ejecución permanece para productores anteriores.

Los tipos heredados `InteractiveReply*` y los auxiliares de conversión están marcados como `@deprecated` en el SDK:

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock`, y
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` y
`presentationToInteractiveControlsReply(...)` siguen disponibles como puentes de renderizado para implementaciones heredadas de canales. El código productor nuevo no debe llamarlos; envía `presentation` y deja que la adaptación de núcleo/canal gestione el renderizado.

Los auxiliares de aprobación también tienen reemplazos que priorizan la presentación:

- usa `buildApprovalPresentationFromActionDescriptors(...)` en lugar de
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- usa `buildApprovalPresentation(...)` en lugar de
  `buildApprovalInteractiveReply(...)`
- usa `buildExecApprovalPresentation(...)` en lugar de
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` devuelve una cadena vacía para los bloques de presentación que no tienen texto alternativo, como una presentación que solo contiene un divisor. Los transportes que requieren un cuerpo de envío no vacío pueden pasar `emptyFallback` para optar por un cuerpo mínimo sin cambiar el contrato alternativo predeterminado.

## Pin de entrega

Fijar es un comportamiento de entrega, no de presentación. Usa `delivery.pin` en lugar de campos nativos del proveedor como `channelData.telegram.pin`.

Semántica:

- `pin: true` fija el primer mensaje entregado correctamente.
- `pin.notify` tiene como valor predeterminado `false`.
- `pin.required` tiene como valor predeterminado `false`.
- Los errores opcionales al fijar se degradan y dejan intacto el mensaje enviado.
- Los errores obligatorios al fijar hacen fallar la entrega.
- Los mensajes fragmentados fijan el primer fragmento entregado, no el fragmento final.

Las acciones manuales de mensaje `pin`, `unpin` y `pins` siguen existiendo para mensajes existentes cuando el proveedor admite esas operaciones.

## Lista de comprobación para autores de Plugin

- Declara `presentation` desde `describeMessageTool(...)` cuando el canal pueda renderizar o degradar de forma segura la presentación semántica.
- Agrega `presentationCapabilities` al adaptador saliente del tiempo de ejecución.
- Implementa `renderPresentation` en el código de tiempo de ejecución, no en el código de configuración del Plugin del plano de control.
- Mantén las bibliotecas de interfaz nativas fuera de las rutas críticas de configuración/catálogo.
- Declara límites de capacidad genéricos en `presentationCapabilities.limits` cuando se conozcan.
- Conserva los límites finales de la plataforma en el renderizador y las pruebas.
- Agrega pruebas de respaldo para botones no compatibles, selectores, botones de URL, duplicación de título/texto y envíos mixtos de `message` más `presentation`.
- Agrega soporte para fijar entregas mediante `deliveryCapabilities.pin` y
  `pinDeliveredMessage` solo cuando el proveedor pueda fijar el id del mensaje enviado.
- No expongas nuevos campos de tarjeta/bloque/componente/botón nativos del proveedor mediante el esquema compartido de acciones de mensaje.

## Documentación relacionada

- [CLI de mensajes](/es/cli/message)
- [Descripción general del SDK de Plugin](/es/plugins/sdk-overview)
- [Arquitectura de Plugin](/es/plugins/architecture-internals#message-tool-schemas)
- [Plan de refactorización de presentación de canales](/es/plan/ui-channels)
