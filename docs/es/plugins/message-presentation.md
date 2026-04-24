---
read_when:
    - Agregar o modificar el renderizado de tarjetas de mensaje, botones o selectores
    - Crear un Plugin de canal que admita mensajes salientes enriquecidos
    - Cambiar la presentación de la herramienta de mensajes o las capacidades de entrega
    - Depurar regresiones específicas del proveedor en el renderizado de tarjetas/bloques/componentes
summary: Tarjetas de mensajes semánticas, botones, selectores, texto alternativo y pistas de entrega para plugins de canal
title: Presentación de mensajes
x-i18n:
    generated_at: "2026-04-24T05:40:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c8c3903101310de330017b34bc2f0d641f4c8ea2b80a30532736b4409716510
    source_path: plugins/message-presentation.md
    workflow: 15
---

La presentación de mensajes es el contrato compartido de OpenClaw para IU enriquecida de chat saliente.
Permite que agentes, comandos CLI, flujos de aprobación y plugins describan la
intención del mensaje una sola vez, mientras cada Plugin de canal renderiza la mejor forma nativa que puede.

Usa presentation para una IU de mensajes portable:

- secciones de texto
- texto pequeño de contexto/pie
- divisores
- botones
- menús de selección
- título de la tarjeta y tono

No agregues nuevos campos nativos de proveedor como `components` de Discord, `blocks` de Slack,
`buttons` de Telegram, `card` de Teams o `card` de Feishu a la herramienta compartida
de mensajes. Esas son salidas del renderizador propiedad del Plugin de canal.

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

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
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

- `value` es un valor de acción de aplicación reenrutado por la
  ruta de interacción existente del canal cuando el canal admite controles clicables.
- `url` es un botón de enlace. Puede existir sin `value`.
- `label` es obligatorio y también se usa en la alternativa de texto.
- `style` es orientativo. Los renderizadores deberían asignar estilos no compatibles a un
  valor predeterminado seguro, no hacer fallar el envío.

Semántica de select:

- `options[].value` es el valor seleccionado de la aplicación.
- `placeholder` es orientativo y puede ignorarse en canales sin compatibilidad nativa
  para select.
- Si un canal no admite selects, el texto alternativo lista las etiquetas.

## Ejemplos de productor

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

Los plugins de canal declaran compatibilidad de renderizado en su adaptador saliente:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
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

Los campos de capacidad son intencionalmente booleanos simples. Describen lo que el
renderizador puede hacer interactivo, no todos los límites nativos de la plataforma. Los renderizadores siguen
siendo propietarios de límites específicos de plataforma como el número máximo de botones, recuento de bloques y
tamaño de tarjeta.

## Flujo de renderizado del núcleo

Cuando un `ReplyPayload` o una acción de mensaje incluye `presentation`, el núcleo:

1. Normaliza la carga útil de presentation.
2. Resuelve el adaptador saliente del canal de destino.
3. Lee `presentationCapabilities`.
4. Llama a `renderPresentation` cuando el adaptador puede renderizar la carga útil.
5. Recurre a texto conservador cuando el adaptador falta o no puede renderizar.
6. Envía la carga útil resultante por la ruta normal de entrega del canal.
7. Aplica metadatos de entrega como `delivery.pin` después del primer
   mensaje enviado con éxito.

El núcleo es propietario del comportamiento alternativo para que los productores puedan seguir siendo agnósticos al canal. Los plugins de canal
son propietarios del renderizado nativo y del manejo de interacción.

## Reglas de degradación

La presentation debe ser segura de enviar en canales limitados.

El texto alternativo incluye:

- `title` como primera línea
- bloques `text` como párrafos normales
- bloques `context` como líneas de contexto compactas
- bloques `divider` como separador visual
- etiquetas de botones, incluidas URLs para botones de enlace
- etiquetas de opciones de select

Los controles nativos no compatibles deberían degradarse en lugar de hacer fallar todo el envío.
Ejemplos:

- Telegram con botones en línea deshabilitados envía texto alternativo.
- Un canal sin compatibilidad con select lista las opciones del select como texto.
- Un botón solo con URL se convierte en un botón nativo de enlace o en una línea alternativa con URL.
- Los fallos opcionales de pin no hacen fallar el mensaje entregado.

La principal excepción es `delivery.pin.required: true`; si se solicita el fijado como
obligatorio y el canal no puede fijar el mensaje enviado, la entrega informa de un fallo.

## Asignación de proveedores

Renderizadores incluidos actualmente:

| Canal           | Destino nativo de renderizado        | Notas                                                                                                                                             |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components y contenedores de componentes | Conserva `channelData.discord.components` heredado para productores existentes de carga útil nativa del proveedor, pero los envíos compartidos nuevos deberían usar `presentation`. |
| Slack           | Block Kit                            | Conserva `channelData.slack.blocks` heredado para productores existentes de carga útil nativa del proveedor, pero los envíos compartidos nuevos deberían usar `presentation`.       |
| Telegram        | Texto más teclados en línea          | Los botones/selects requieren capacidad de botones en línea para la superficie de destino; en caso contrario se usa texto alternativo.           |
| Mattermost      | Texto más props interactivas         | Los demás bloques se degradan a texto.                                                                                                            |
| Microsoft Teams | Adaptive Cards                       | El texto plano `message` se incluye con la tarjeta cuando se proporcionan ambos.                                                                  |
| Feishu          | Tarjetas interactivas                | El encabezado de la tarjeta puede usar `title`; el cuerpo evita duplicar ese título.                                                             |
| Canales simples | Texto alternativo                    | Los canales sin renderizador siguen recibiendo salida legible.                                                                                    |

La compatibilidad con cargas útiles nativas del proveedor es una ayuda transitoria para productores
existentes de respuestas. No es una razón para agregar nuevos campos nativos compartidos.

## Presentation frente a InteractiveReply

`InteractiveReply` es el subconjunto interno más antiguo usado por ayudas de aprobación e interacción. Admite:

- texto
- botones
- selects

`MessagePresentation` es el contrato compartido canónico de envío. Agrega:

- título
- tono
- contexto
- divisor
- botones solo con URL
- metadatos genéricos de entrega mediante `ReplyPayload.delivery`

Usa ayudas de `openclaw/plugin-sdk/interactive-runtime` al conectar código antiguo:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

El código nuevo debería aceptar o producir `MessagePresentation` directamente.

## Pin de entrega

Fijar es comportamiento de entrega, no presentation. Usa `delivery.pin` en lugar de
campos nativos del proveedor como `channelData.telegram.pin`.

Semántica:

- `pin: true` fija el primer mensaje entregado con éxito.
- `pin.notify` usa por defecto `false`.
- `pin.required` usa por defecto `false`.
- Los fallos opcionales de pin se degradan y dejan intacto el mensaje enviado.
- Los fallos obligatorios de pin hacen fallar la entrega.
- Los mensajes fragmentados fijan el primer fragmento entregado, no el último.

Las acciones manuales de mensaje `pin`, `unpin` y `pins` siguen existiendo para mensajes
existentes en los que el proveedor admita esas operaciones.

## Lista de comprobación para autores de plugins

- Declara `presentation` desde `describeMessageTool(...)` cuando el canal pueda
  renderizar o degradar de forma segura la presentation semántica.
- Agrega `presentationCapabilities` al adaptador saliente de tiempo de ejecución.
- Implementa `renderPresentation` en el código de tiempo de ejecución, no en el
  código de configuración del Plugin del plano de control.
- Mantén las bibliotecas nativas de IU fuera de las rutas rápidas de configuración/catálogo.
- Conserva los límites de la plataforma en el renderizador y en las pruebas.
- Agrega pruebas alternativas para botones no compatibles, selects, botones URL, duplicación de title/text
  y envíos mixtos `message` más `presentation`.
- Agrega compatibilidad con pin de entrega mediante `deliveryCapabilities.pin` y
  `pinDeliveredMessage` solo cuando el proveedor pueda fijar el id del mensaje enviado.
- No expongas nuevos campos nativos de proveedor de tarjeta/bloque/componente/botón mediante
  el esquema compartido de acción de mensajes.

## Documentación relacionada

- [CLI de mensajes](/es/cli/message)
- [Resumen del Plugin SDK](/es/plugins/sdk-overview)
- [Arquitectura de plugins](/es/plugins/architecture-internals#message-tool-schemas)
- [Plan de refactorización de presentación de canales](/es/plan/ui-channels)
