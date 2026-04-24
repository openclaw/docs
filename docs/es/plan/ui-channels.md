---
read_when:
    - Refactorizar la UI de mensajes de canal, cargas útiles interactivas o renderizadores nativos de canal
    - Cambiar capacidades de la herramienta message, sugerencias de entrega o marcadores entre contextos
    - Depurar el fanout de importación de Discord Carbon o la carga diferida del tiempo de ejecución del Plugin de canal
summary: Desacoplar la presentación semántica de mensajes de los renderizadores de UI nativos del canal.
title: Plan de refactorización de presentación de canales
x-i18n:
    generated_at: "2026-04-24T05:37:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: f983c4d14580e8a66744c7e5f23dd9846c11e926181a8441d60f346cec6d1eea
    source_path: plan/ui-channels.md
    workflow: 15
---

## Estado

Implementado para las superficies compartidas del agente, la CLI, la capacidad del Plugin y la entrega saliente:

- `ReplyPayload.presentation` transporta UI semántica de mensajes.
- `ReplyPayload.delivery.pin` transporta solicitudes de fijación de mensajes enviados.
- Las acciones compartidas de mensajes exponen `presentation`, `delivery` y `pin` en lugar de `components`, `blocks`, `buttons` o `card` nativos del proveedor.
- El núcleo renderiza o degrada automáticamente la presentación mediante capacidades salientes declaradas por el Plugin.
- Los renderizadores de Discord, Slack, Telegram, Mattermost, MS Teams y Feishu consumen el contrato genérico.
- El código del plano de control de canal de Discord ya no importa contenedores de UI respaldados por Carbon.

La documentación canónica vive ahora en [Message Presentation](/es/plugins/message-presentation).
Mantén este plan como contexto histórico de implementación; actualiza la guía canónica
cuando cambie el comportamiento de contrato, renderizador o fallback.

## Problema

La UI de canal está actualmente dividida entre varias superficies incompatibles:

- El núcleo posee un hook de renderizado entre contextos con forma de Discord mediante `buildCrossContextComponents`.
- `channel.ts` de Discord puede importar UI nativa de Carbon mediante `DiscordUiContainer`, lo que arrastra dependencias de UI en tiempo de ejecución al plano de control del Plugin de canal.
- El agente y la CLI exponen vías de escape de carga útil nativa como `components` de Discord, `blocks` de Slack, `buttons` de Telegram o Mattermost y `card` de Teams o Feishu.
- `ReplyPayload.channelData` transporta tanto sugerencias de transporte como envoltorios de UI nativa.
- El modelo genérico `interactive` existe, pero es más limitado que los diseños más ricos ya usados por Discord, Slack, Teams, Feishu, LINE, Telegram y Mattermost.

Esto hace que el núcleo conozca formas de UI nativa, debilita la carga diferida del tiempo de ejecución de Plugins y da a los agentes demasiadas formas específicas del proveedor de expresar la misma intención de mensaje.

## Objetivos

- El núcleo decide la mejor presentación semántica para un mensaje a partir de capacidades declaradas.
- Las extensiones declaran capacidades y renderizan la presentación semántica en cargas útiles nativas de transporte.
- La UI de Control web permanece separada de la UI nativa del chat.
- Las cargas útiles nativas de canal no se exponen mediante la superficie compartida del agente o la CLI.
- Las funciones de presentación no compatibles se degradan automáticamente a la mejor representación de texto.
- El comportamiento de entrega, como fijar un mensaje enviado, es metadato genérico de entrega, no presentación.

## No objetivos

- No habrá shim de compatibilidad hacia atrás para `buildCrossContextComponents`.
- No habrá vías de escape nativas públicas para `components`, `blocks`, `buttons` o `card`.
- No habrá importaciones en el núcleo de bibliotecas de UI nativas del canal.
- No habrá interfaces de SDK específicas del proveedor para canales incluidos.

## Modelo objetivo

Agrega un campo `presentation` propiedad del núcleo a `ReplyPayload`.

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

- el bloque de texto `interactive` se asigna a `presentation.blocks[].type = "text"`.
- el bloque de botones `interactive` se asigna a `presentation.blocks[].type = "buttons"`.
- el bloque select `interactive` se asigna a `presentation.blocks[].type = "select"`.

Los esquemas externos del agente y la CLI ahora usan `presentation`; `interactive` permanece como helper interno heredado de análisis/renderizado para productores de respuestas existentes.

## Metadatos de entrega

Agrega un campo `delivery` propiedad del núcleo para el comportamiento de envío que no es UI.

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

- `delivery.pin = true` significa fijar el primer mensaje entregado con éxito.
- `notify` toma el valor predeterminado `false`.
- `required` toma el valor predeterminado `false`; los canales no compatibles o los fallos al fijar se degradan automáticamente continuando la entrega.
- Las acciones manuales de mensaje `pin`, `unpin` y `list-pins` se mantienen para mensajes existentes.

La vinculación actual de temas ACP de Telegram debería pasar de `channelData.telegram.pin = true` a `delivery.pin = true`.

## Contrato de capacidad en tiempo de ejecución

Agrega hooks de renderizado de presentación y entrega al adaptador saliente del tiempo de ejecución, no al Plugin de canal del plano de control.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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

- Resolver el canal de destino y el adaptador del tiempo de ejecución.
- Solicitar capacidades de presentación.
- Degradar bloques no compatibles antes de renderizar.
- Llamar a `renderPresentation`.
- Si no existe renderizador, convertir la presentación a texto fallback.
- Después de un envío exitoso, llamar a `pinDeliveredMessage` cuando se solicite `delivery.pin` y sea compatible.

## Mapeo de canales

Discord:

- Renderizar `presentation` a components v2 y contenedores Carbon en módulos de solo tiempo de ejecución.
- Mantener helpers de color de acento en módulos ligeros.
- Eliminar importaciones de `DiscordUiContainer` del código del plano de control del Plugin de canal.

Slack:

- Renderizar `presentation` a Block Kit.
- Eliminar la entrada `blocks` del agente y la CLI.

Telegram:

- Renderizar texto, contexto y divisores como texto.
- Renderizar acciones y select como teclados en línea cuando estén configurados y permitidos para la superficie objetivo.
- Usar fallback de texto cuando los botones en línea estén deshabilitados.
- Mover la fijación de temas ACP a `delivery.pin`.

Mattermost:

- Renderizar acciones como botones interactivos cuando estén configurados.
- Renderizar los demás bloques como fallback de texto.

MS Teams:

- Renderizar `presentation` a Adaptive Cards.
- Mantener las acciones manuales `pin`/`unpin`/`list-pins`.
- Implementar opcionalmente `pinDeliveredMessage` si el soporte de Graph es fiable para la conversación objetivo.

Feishu:

- Renderizar `presentation` a tarjetas interactivas.
- Mantener las acciones manuales `pin`/`unpin`/`list-pins`.
- Implementar opcionalmente `pinDeliveredMessage` para fijación de mensajes enviados si el comportamiento de la API es fiable.

LINE:

- Renderizar `presentation` a mensajes Flex o de plantilla cuando sea posible.
- Recurrir a texto para bloques no compatibles.
- Eliminar cargas útiles de UI de LINE de `channelData`.

Canales planos o limitados:

- Convertir la presentación a texto con formato conservador.

## Pasos de refactorización

1. Reaplicar la corrección de versión de Discord que separa `ui-colors.ts` de la UI respaldada por Carbon y elimina `DiscordUiContainer` de `extensions/discord/src/channel.ts`.
2. Agregar `presentation` y `delivery` a `ReplyPayload`, normalización de carga útil saliente, resúmenes de entrega y cargas útiles de hooks.
3. Agregar el esquema y los helpers de análisis de `MessagePresentation` en una subruta estrecha de SDK/tiempo de ejecución.
4. Reemplazar las capacidades de mensajes `buttons`, `cards`, `components` y `blocks` por capacidades de presentación semántica.
5. Agregar hooks de adaptador saliente en tiempo de ejecución para renderizado de presentación y fijación de entrega.
6. Reemplazar la construcción de componentes entre contextos por `buildCrossContextPresentation`.
7. Eliminar `src/infra/outbound/channel-adapters.ts` y quitar `buildCrossContextComponents` de los tipos de Plugins de canal.
8. Cambiar `maybeApplyCrossContextMarker` para adjuntar `presentation` en lugar de parámetros nativos.
9. Actualizar las rutas de envío de despacho de Plugins para que consuman solo presentación semántica y metadatos de entrega.
10. Eliminar los parámetros nativos de carga útil del agente y la CLI: `components`, `blocks`, `buttons` y `card`.
11. Eliminar los helpers de SDK que crean esquemas nativos de herramientas de mensaje, sustituyéndolos por helpers de esquema de presentación.
12. Eliminar envoltorios de UI/nativos de `channelData`; conservar solo metadatos de transporte hasta revisar cada campo restante.
13. Migrar renderizadores de Discord, Slack, Telegram, Mattermost, MS Teams, Feishu y LINE.
14. Actualizar la documentación de la CLI de mensajes, páginas de canales, SDK de Plugins y recetario de capacidades.
15. Ejecutar perfilado de fanout de importación para Discord y los entrypoints de canales afectados.

Los pasos 1-11 y 13-14 están implementados en esta refactorización para el agente compartido, la CLI, la capacidad del Plugin y los contratos del adaptador saliente. El paso 12 sigue siendo una limpieza interna más profunda para envoltorios de transporte `channelData` privados del proveedor. El paso 15 sigue siendo una validación posterior si queremos cifras cuantificadas de fanout de importación más allá de la puerta de tipos/pruebas.

## Pruebas

Agregar o actualizar:

- Pruebas de normalización de presentación.
- Pruebas de degradación automática de presentación para bloques no compatibles.
- Pruebas de marcadores entre contextos para despacho de Plugins y rutas de entrega del núcleo.
- Pruebas de matriz de renderizado de canales para Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE y fallback de texto.
- Pruebas del esquema de la herramienta message que demuestren que los campos nativos han desaparecido.
- Pruebas de CLI que demuestren que las banderas nativas han desaparecido.
- Regresión de carga diferida del entrypoint de Discord que cubra Carbon.
- Pruebas de fijación de entrega que cubran Telegram y fallback genérico.

## Preguntas abiertas

- ¿Debería implementarse `delivery.pin` para Discord, Slack, MS Teams y Feishu en la primera pasada, o solo primero para Telegram?
- ¿Debería `delivery` acabar absorbiendo campos existentes como `replyToId`, `replyToCurrent`, `silent` y `audioAsVoice`, o mantenerse centrado en comportamientos posteriores al envío?
- ¿Debería la presentación admitir directamente imágenes o referencias de archivos, o el contenido multimedia debería seguir separado del diseño de UI por ahora?

## Relacionado

- [Resumen de canales](/es/channels)
- [Presentación de mensajes](/es/plugins/message-presentation)
