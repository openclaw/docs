---
read_when:
    - Refactorización de la interfaz de mensajes de canal, cargas útiles interactivas o renderizadores nativos de canal
    - Cambiar las capacidades de las herramientas de mensajes, las sugerencias de entrega o los marcadores entre contextos
    - Depurar el fanout de importación de Discord Carbon o la carga diferida en tiempo de ejecución del plugin de canal
summary: Desacopla la presentación semántica de mensajes de los renderizadores de interfaz nativa del canal.
title: Plan de refactorización de presentación de canales
x-i18n:
    generated_at: "2026-06-27T11:58:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## Estado

Implementado para las superficies compartidas de agente, CLI, capacidad de plugin y entrega saliente:

- `ReplyPayload.presentation` transporta UI semántica de mensajes.
- `ReplyPayload.delivery.pin` transporta solicitudes para fijar mensajes enviados.
- Las acciones de mensajes compartidas exponen `presentation`, `delivery` y `pin` en lugar de `components`, `blocks`, `buttons` o `card` nativos del proveedor.
- El núcleo renderiza o degrada automáticamente la presentación mediante capacidades salientes declaradas por el plugin.
- Los renderizadores de Discord, Slack, Telegram, Mattermost, MS Teams y Feishu consumen el contrato genérico.
- El código del plano de control del canal Discord ya no importa contenedores de UI respaldados por Carbon.

La documentación canónica ahora vive en [Presentación de mensajes](/es/plugins/message-presentation).
Mantén este plan como contexto histórico de implementación; actualiza la guía canónica
para cambios de contrato, renderizador o comportamiento de degradación.

## Problema

La UI de canales está actualmente dividida entre varias superficies incompatibles:

- El núcleo posee un hook de renderizador entre contextos con forma de Discord mediante `buildCrossContextComponents`.
- `channel.ts` de Discord puede importar UI nativa de Carbon mediante `DiscordUiContainer`, lo que arrastra dependencias de UI en tiempo de ejecución al plano de control del plugin de canal.
- El agente y la CLI exponen escapes de payload nativos como `components` de Discord, `blocks` de Slack, `buttons` de Telegram o Mattermost, y `card` de Teams o Feishu.
- `ReplyPayload.channelData` transporta tanto indicaciones de transporte como sobres de UI nativa.
- El modelo genérico `interactive` existe, pero es más limitado que los diseños más ricos que ya usan Discord, Slack, Teams, Feishu, LINE, Telegram y Mattermost.

Esto hace que el núcleo conozca formas de UI nativas, debilita la carga diferida del runtime de plugins y da a los agentes demasiadas formas específicas de proveedor para expresar la misma intención de mensaje.

## Objetivos

- El núcleo decide la mejor presentación semántica para un mensaje a partir de las capacidades declaradas.
- Las extensiones declaran capacidades y renderizan la presentación semántica en payloads de transporte nativos.
- La Web Control UI permanece separada de la UI nativa de chat.
- Los payloads nativos de canal no se exponen mediante la superficie compartida de mensajes del agente o la CLI.
- Las características de presentación no admitidas se degradan automáticamente a la mejor representación de texto.
- El comportamiento de entrega, como fijar un mensaje enviado, es metadato genérico de entrega, no presentación.

## No objetivos

- Sin shim de compatibilidad hacia atrás para `buildCrossContextComponents`.
- Sin escapes nativos públicos para `components`, `blocks`, `buttons` o `card`.
- Sin importaciones del núcleo de bibliotecas de UI nativas de canal.
- Sin seams de SDK específicos de proveedor para canales incluidos.

## Modelo objetivo

Añadir un campo `presentation` propiedad del núcleo a `ReplyPayload`.

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
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
```

`interactive` se convierte en un subconjunto de `presentation` durante la migración:

- El bloque de texto `interactive` se asigna a `presentation.blocks[].type = "text"`.
- El bloque de botones `interactive` se asigna a `presentation.blocks[].type = "buttons"`.
- El bloque de selección `interactive` se asigna a `presentation.blocks[].type = "select"`.

Los esquemas externos del agente y la CLI ahora usan `presentation`; `interactive` permanece como un helper interno heredado de análisis/renderizado para productores de respuestas existentes.
La API pública orientada a productores trata `interactive` como obsoleto. El soporte en runtime
permanece para que los helpers de aprobación existentes y los plugins antiguos sigan
funcionando mientras el código nuevo emite `presentation`.

## Metadatos de entrega

Añadir un campo `delivery` propiedad del núcleo para comportamiento de envío que no es UI.

```ts
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

Semántica:

- `delivery.pin = true` significa fijar el primer mensaje entregado correctamente.
- `notify` tiene `false` como valor predeterminado.
- `required` tiene `false` como valor predeterminado; los canales no admitidos o los fallos al fijar se degradan automáticamente continuando la entrega.
- Las acciones manuales de mensaje `pin`, `unpin` y `list-pins` permanecen para mensajes existentes.

La vinculación actual de temas ACP de Telegram debe pasar de `channelData.telegram.pin = true` a `delivery.pin = true`.

## Contrato de capacidades del runtime

Añadir hooks de renderizado de presentación y entrega al adaptador saliente del runtime, no al plugin de canal del plano de control.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

Comportamiento del núcleo:

- Resolver el canal objetivo y el adaptador de runtime.
- Pedir las capacidades de presentación.
- Degradar bloques no admitidos y aplicar límites genéricos de capacidades antes de
  renderizar.
- Llamar a `renderPresentation`.
- Si no existe renderizador, convertir la presentación a una alternativa de texto.
- Después de un envío correcto, llamar a `pinDeliveredMessage` cuando `delivery.pin` se solicite y esté admitido.

## Mapeo de canales

Discord:

- Renderizar `presentation` a componentes v2 y contenedores Carbon en módulos solo de runtime.
- Mantener helpers de color de acento en módulos ligeros.
- Eliminar importaciones de `DiscordUiContainer` del código del plano de control del plugin de canal.

Slack:

- Renderizar `presentation` a Block Kit.
- Eliminar la entrada `blocks` del agente y la CLI.

Telegram:

- Renderizar texto, contexto y divisores como texto.
- Renderizar acciones y selección como teclados en línea cuando esté configurado y permitido para la superficie objetivo.
- Usar alternativa de texto cuando los botones en línea estén deshabilitados.
- Mover el fijado de temas ACP a `delivery.pin`.

Mattermost:

- Renderizar acciones como botones interactivos donde esté configurado.
- Renderizar otros bloques como alternativa de texto.

MS Teams:

- Renderizar `presentation` a Adaptive Cards.
- Mantener las acciones manuales pin/unpin/list-pins.
- Implementar opcionalmente `pinDeliveredMessage` si el soporte de Graph es fiable para la conversación objetivo.

Feishu:

- Renderizar `presentation` a tarjetas interactivas.
- Mantener las acciones manuales pin/unpin/list-pins.
- Implementar opcionalmente `pinDeliveredMessage` para fijar mensajes enviados si el comportamiento de la API es fiable.

LINE:

- Renderizar `presentation` a mensajes Flex o de plantilla cuando sea posible.
- Recurrir a texto para bloques no admitidos.
- Eliminar payloads de UI de LINE de `channelData`.

Canales simples o limitados:

- Convertir la presentación a texto con formato conservador.

## Pasos de refactorización

1. Volver a aplicar la corrección de lanzamiento de Discord que separa `ui-colors.ts` de la UI respaldada por Carbon y elimina `DiscordUiContainer` de `extensions/discord/src/channel.ts`.
2. Añadir `presentation` y `delivery` a `ReplyPayload`, la normalización de payloads salientes, los resúmenes de entrega y los payloads de hooks.
3. Añadir el esquema `MessagePresentation` y helpers de análisis en una subruta estrecha de SDK/runtime.
4. Reemplazar las capacidades de mensaje `buttons`, `cards`, `components` y `blocks` por capacidades de presentación semántica.
5. Añadir hooks de adaptador saliente de runtime para renderizado de presentación y fijado de entrega.
6. Reemplazar la construcción de componentes entre contextos por `buildCrossContextPresentation`.
7. Eliminar `src/infra/outbound/channel-adapters.ts` y quitar `buildCrossContextComponents` de los tipos de plugin de canal.
8. Cambiar `maybeApplyCrossContextMarker` para adjuntar `presentation` en lugar de parámetros nativos.
9. Actualizar las rutas de envío de plugin-dispatch para consumir solo presentación semántica y metadatos de entrega.
10. Eliminar parámetros de payload nativo del agente y la CLI: `components`, `blocks`, `buttons` y `card`.
11. Eliminar helpers del SDK que crean esquemas nativos de herramientas de mensaje, reemplazándolos por helpers de esquema de presentación.
12. Eliminar sobres UI/nativos de `channelData`; conservar solo metadatos de transporte hasta que se revise cada campo restante.
13. Migrar los renderizadores de Discord, Slack, Telegram, Mattermost, MS Teams, Feishu y LINE.
14. Actualizar la documentación para la CLI de mensajes, páginas de canales, SDK de plugins y recetario de capacidades.
15. Ejecutar perfilado de fanout de importaciones para Discord y los entrypoints de canal afectados.

Los pasos 1-11 y 13-14 están implementados en esta refactorización para los contratos compartidos de agente, CLI, capacidad de plugin y adaptador saliente. El paso 12 sigue siendo una limpieza interna más profunda para sobres de transporte `channelData` privados del proveedor. El paso 15 queda como validación de seguimiento si queremos números cuantificados de fanout de importaciones más allá de la barrera de tipos/pruebas.

## Pruebas

Añadir o actualizar:

- Pruebas de normalización de presentación.
- Pruebas de degradación automática de presentación para bloques no admitidos.
- Pruebas de marcador entre contextos para rutas de plugin dispatch y entrega del núcleo.
- Pruebas de matriz de renderizado de canales para Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE y alternativa de texto.
- Pruebas de esquema de herramientas de mensaje que demuestren que los campos nativos ya no están.
- Pruebas de CLI que demuestren que las flags nativas ya no están.
- Regresión de carga diferida de importaciones del entrypoint de Discord que cubra Carbon.
- Pruebas de fijado de entrega que cubran Telegram y la alternativa genérica.

## Preguntas abiertas

- ¿Debe implementarse `delivery.pin` para Discord, Slack, MS Teams y Feishu en la primera pasada, o solo Telegram primero?
- ¿Debe `delivery` absorber eventualmente campos existentes como `replyToId`, `replyToCurrent`, `silent` y `audioAsVoice`, o mantenerse centrado en comportamientos posteriores al envío?
- ¿Debe la presentación admitir imágenes o referencias a archivos directamente, o los medios deben permanecer separados del diseño de UI por ahora?

## Relacionado

- [Resumen de canales](/es/channels)
- [Presentación de mensajes](/es/plugins/message-presentation)
