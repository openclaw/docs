---
read_when:
    - Refactorización de la interfaz de usuario de mensajes de canal, las cargas útiles interactivas o los renderizadores nativos de canal
    - Cambiar las capacidades de herramientas de mensajes, las indicaciones de entrega o los marcadores entre contextos
    - Depuración de la propagación de importaciones de Discord Carbon o de la carga diferida en tiempo de ejecución del Plugin de canal
summary: Desacoplar la presentación semántica de mensajes de los renderizadores de interfaz de usuario nativos del canal.
title: Plan de refactorización de la presentación del canal
x-i18n:
    generated_at: "2026-04-30T05:50:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5608e7806a2a20e73ee82f1b1f0fcbbb4c865232df984d3d98b91e5b721998f5
    source_path: plan/ui-channels.md
    workflow: 16
---

## Estado

Implementado para el agente compartido, la CLI, la capacidad de Plugin y las superficies de entrega saliente:

- `ReplyPayload.presentation` transporta la IU semántica del mensaje.
- `ReplyPayload.delivery.pin` transporta solicitudes para fijar mensajes enviados.
- Las acciones de mensaje compartidas exponen `presentation`, `delivery` y `pin` en lugar de `components`, `blocks`, `buttons` o `card` nativos del proveedor.
- El núcleo renderiza o degrada automáticamente la presentación mediante las capacidades salientes declaradas por el Plugin.
- Los renderizadores de Discord, Slack, Telegram, Mattermost, MS Teams y Feishu consumen el contrato genérico.
- El código del plano de control del canal de Discord ya no importa contenedores de IU respaldados por Carbon.

La documentación canónica ahora está en [Presentación de mensajes](/es/plugins/message-presentation).
Conserva este plan como contexto histórico de implementación; actualiza la guía canónica
para cambios en el contrato, el renderizador o el comportamiento de reserva.

## Problema

La IU de canal está actualmente dividida en varias superficies incompatibles:

- El núcleo posee un hook de renderizador entre contextos con forma de Discord mediante `buildCrossContextComponents`.
- `channel.ts` de Discord puede importar la IU nativa de Carbon mediante `DiscordUiContainer`, lo que arrastra dependencias de IU en tiempo de ejecución al plano de control del Plugin de canal.
- El agente y la CLI exponen vías de escape de carga útil nativas como `components` de Discord, `blocks` de Slack, `buttons` de Telegram o Mattermost, y `card` de Teams o Feishu.
- `ReplyPayload.channelData` transporta tanto indicaciones de transporte como sobres de IU nativos.
- El modelo genérico `interactive` existe, pero es más limitado que los diseños más completos que ya usan Discord, Slack, Teams, Feishu, LINE, Telegram y Mattermost.

Esto hace que el núcleo conozca formas de IU nativas, debilita la carga diferida del tiempo de ejecución del Plugin y ofrece a los agentes demasiadas formas específicas por proveedor de expresar la misma intención de mensaje.

## Objetivos

- El núcleo decide la mejor presentación semántica para un mensaje a partir de las capacidades declaradas.
- Las extensiones declaran capacidades y renderizan la presentación semántica en cargas útiles de transporte nativas.
- La IU de Control Web permanece separada de la IU nativa de chat.
- Las cargas útiles de canal nativas no se exponen mediante la superficie de mensajes compartida del agente o la CLI.
- Las funciones de presentación no admitidas se degradan automáticamente a la mejor representación de texto.
- El comportamiento de entrega, como fijar un mensaje enviado, es metadato genérico de entrega, no presentación.

## No objetivos

- Sin shim de compatibilidad hacia atrás para `buildCrossContextComponents`.
- Sin vías de escape nativas públicas para `components`, `blocks`, `buttons` o `card`.
- Sin importaciones del núcleo de bibliotecas de IU nativas de canal.
- Sin seams de SDK específicos del proveedor para canales incluidos.

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

- El bloque de texto `interactive` se mapea a `presentation.blocks[].type = "text"`.
- El bloque de botones `interactive` se mapea a `presentation.blocks[].type = "buttons"`.
- El bloque de selección `interactive` se mapea a `presentation.blocks[].type = "select"`.

Los esquemas externos del agente y la CLI ahora usan `presentation`; `interactive` permanece como ayudante interno heredado de análisis/renderizado para los productores de respuestas existentes.

## Metadatos de entrega

Añadir un campo `delivery` propiedad del núcleo para comportamiento de envío que no sea IU.

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
- `notify` tiene como valor predeterminado `false`.
- `required` tiene como valor predeterminado `false`; los canales no admitidos o los errores al fijar se degradan automáticamente continuando la entrega.
- Las acciones de mensaje manuales `pin`, `unpin` y `list-pins` permanecen para mensajes existentes.

La vinculación actual de temas ACP de Telegram debe pasar de `channelData.telegram.pin = true` a `delivery.pin = true`.

## Contrato de capacidades en tiempo de ejecución

Añadir hooks de renderizado de presentación y entrega al adaptador saliente en tiempo de ejecución, no al Plugin de canal del plano de control.

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

- Resolver el canal de destino y el adaptador de tiempo de ejecución.
- Solicitar las capacidades de presentación.
- Degradar los bloques no compatibles antes de renderizar.
- Llamar a `renderPresentation`.
- Si no existe ningún renderizador, convertir la presentación a una alternativa de texto.
- Después de un envío correcto, llamar a `pinDeliveredMessage` cuando se solicite `delivery.pin` y esté admitido.

## Mapeo de canales

Discord:

- Renderizar `presentation` en componentes v2 y contenedores Carbon en módulos solo de tiempo de ejecución.
- Mantener los helpers de color de acento en módulos ligeros.
- Eliminar las importaciones de `DiscordUiContainer` del código de plano de control del plugin de canal.

Slack:

- Renderizar `presentation` en Block Kit.
- Eliminar la entrada `blocks` del agente y la CLI.

Telegram:

- Renderizar texto, contexto y divisores como texto.
- Renderizar acciones y select como teclados en línea cuando esté configurado y permitido para la superficie de destino.
- Usar la alternativa de texto cuando los botones en línea estén deshabilitados.
- Mover la fijación de temas ACP a `delivery.pin`.

Mattermost:

- Renderizar acciones como botones interactivos donde esté configurado.
- Renderizar otros bloques como alternativa de texto.

MS Teams:

- Renderizar `presentation` en Adaptive Cards.
- Mantener las acciones manuales de fijar, desfijar y listar fijados.
- Implementar opcionalmente `pinDeliveredMessage` si el soporte de Graph es fiable para la conversación de destino.

Feishu:

- Renderizar `presentation` en tarjetas interactivas.
- Mantener las acciones manuales de fijar, desfijar y listar fijados.
- Implementar opcionalmente `pinDeliveredMessage` para fijar mensajes enviados si el comportamiento de la API es fiable.

LINE:

- Renderizar `presentation` en mensajes Flex o de plantilla cuando sea posible.
- Recurrir a texto para bloques no compatibles.
- Eliminar las cargas útiles de UI de LINE de `channelData`.

Canales simples o limitados:

- Convertir la presentación a texto con formato conservador.

## Pasos de refactorización

1. Volver a aplicar la corrección de la versión de Discord que separa `ui-colors.ts` de la UI respaldada por Carbon y elimina `DiscordUiContainer` de `extensions/discord/src/channel.ts`.
2. Agregar `presentation` y `delivery` a `ReplyPayload`, la normalización de cargas útiles salientes, los resúmenes de entrega y las cargas útiles de hooks.
3. Agregar el esquema `MessagePresentation` y helpers de parser en una subruta estrecha de SDK/tiempo de ejecución.
4. Reemplazar las capacidades de mensaje `buttons`, `cards`, `components` y `blocks` por capacidades semánticas de presentación.
5. Agregar hooks del adaptador saliente de tiempo de ejecución para renderización de presentaciones y fijación de entregas.
6. Reemplazar la construcción de componentes entre contextos por `buildCrossContextPresentation`.
7. Eliminar `src/infra/outbound/channel-adapters.ts` y quitar `buildCrossContextComponents` de los tipos de plugin de canal.
8. Cambiar `maybeApplyCrossContextMarker` para adjuntar `presentation` en lugar de parámetros nativos.
9. Actualizar las rutas de envío de plugin-dispatch para consumir solo presentación semántica y metadatos de entrega.
10. Eliminar los parámetros de cargas útiles nativas del agente y la CLI: `components`, `blocks`, `buttons` y `card`.
11. Eliminar los helpers del SDK que crean esquemas nativos de herramientas de mensaje y reemplazarlos por helpers de esquema de presentación.
12. Eliminar los envoltorios de UI/nativos de `channelData`; conservar solo los metadatos de transporte hasta que se revise cada campo restante.
13. Migrar los renderizadores de Discord, Slack, Telegram, Mattermost, MS Teams, Feishu y LINE.
14. Actualizar la documentación de la CLI de mensajes, las páginas de canales, el SDK de plugins y el recetario de capacidades.
15. Ejecutar el perfilado de fanout de importaciones para Discord y los puntos de entrada de canales afectados.

Los pasos 1-11 y 13-14 están implementados en esta refactorización para los contratos compartidos del agente, la CLI, las capacidades de plugin y el adaptador saliente. El paso 12 sigue siendo una pasada de limpieza interna más profunda para los envoltorios de transporte `channelData` privados del proveedor. El paso 15 queda como validación de seguimiento si queremos números cuantificados de fanout de importaciones más allá de la puerta de tipos/pruebas.

## Pruebas

Agregar o actualizar:

- Pruebas de normalización de presentación.
- Pruebas de degradación automática de presentación para bloques no compatibles.
- Pruebas de marcador entre contextos para rutas de plugin dispatch y entrega del núcleo.
- Pruebas de matriz de renderización de canales para Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE y alternativa de texto.
- Pruebas de esquema de herramientas de mensaje que demuestren que los campos nativos desaparecieron.
- Pruebas de CLI que demuestren que los flags nativos desaparecieron.
- Regresión de pereza de importación del punto de entrada de Discord que cubra Carbon.
- Pruebas de fijación de entrega que cubran Telegram y la alternativa genérica.

## Preguntas abiertas

- ¿Debería implementarse `delivery.pin` para Discord, Slack, MS Teams y Feishu en la primera pasada, o solo Telegram primero?
- ¿Debería `delivery` absorber eventualmente campos existentes como `replyToId`, `replyToCurrent`, `silent` y `audioAsVoice`, o seguir enfocado en comportamientos posteriores al envío?
- ¿Debería la presentación admitir imágenes o referencias a archivos directamente, o los medios deberían permanecer separados del diseño de UI por ahora?

## Relacionado

- [Descripción general de canales](/es/channels)
- [Presentación de mensajes](/es/plugins/message-presentation)
