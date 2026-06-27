---
read_when:
    - Refatorar a UI de mensagens de canais, payloads interativos ou renderizadores nativos de canais
    - Alterar capacidades de ferramentas de mensagem, dicas de entrega ou marcadores entre contextos
    - Depuração do fanout da importação do Discord Carbon ou da inicialização tardia em tempo de execução do Plugin de canal
summary: Desacople a apresentação semântica de mensagens dos renderizadores de UI nativos do canal.
title: Plano de refatoração da apresentação de canais
x-i18n:
    generated_at: "2026-06-27T17:41:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## Status

Implementado para o agente compartilhado, CLI, capacidade de Plugin e superfícies de entrega de saída:

- `ReplyPayload.presentation` carrega a UI semântica de mensagens.
- `ReplyPayload.delivery.pin` carrega solicitações de fixação de mensagens enviadas.
- Ações de mensagem compartilhadas expõem `presentation`, `delivery` e `pin` em vez de `components`, `blocks`, `buttons` ou `card` nativos do provedor.
- O core renderiza ou autodegrada a apresentação por meio das capacidades de saída declaradas pelo Plugin.
- Renderizadores do Discord, Slack, Telegram, Mattermost, MS Teams e Feishu consomem o contrato genérico.
- O código do plano de controle do canal Discord não importa mais contêineres de UI baseados em Carbon.

A documentação canônica agora fica em [Apresentação de mensagens](/pt-BR/plugins/message-presentation).
Mantenha este plano como contexto histórico de implementação; atualize o guia canônico
para mudanças de contrato, renderizador ou comportamento de fallback.

## Problema

A UI de canais está atualmente dividida entre várias superfícies incompatíveis:

- O core possui um hook de renderizador entre contextos com formato de Discord por meio de `buildCrossContextComponents`.
- O `channel.ts` do Discord pode importar UI Carbon nativa por meio de `DiscordUiContainer`, o que traz dependências de UI em runtime para o plano de controle do Plugin de canal.
- O agente e a CLI expõem escapes de payload nativo, como `components` do Discord, `blocks` do Slack, `buttons` do Telegram ou Mattermost e `card` do Teams ou Feishu.
- `ReplyPayload.channelData` carrega tanto dicas de transporte quanto envelopes de UI nativa.
- O modelo genérico `interactive` existe, mas é mais restrito do que os layouts mais ricos já usados por Discord, Slack, Teams, Feishu, LINE, Telegram e Mattermost.

Isso faz o core conhecer formatos de UI nativa, enfraquece a preguiça de runtime de Plugins e dá aos agentes muitas formas específicas por provedor para expressar a mesma intenção de mensagem.

## Objetivos

- O core decide a melhor apresentação semântica para uma mensagem a partir das capacidades declaradas.
- Extensões declaram capacidades e renderizam apresentação semântica em payloads de transporte nativos.
- A UI de Controle Web permanece separada da UI nativa de chat.
- Payloads nativos de canal não são expostos pela superfície de mensagens do agente compartilhado ou da CLI.
- Recursos de apresentação sem suporte são autodegradados para a melhor representação em texto.
- Comportamento de entrega, como fixar uma mensagem enviada, é metadado genérico de entrega, não apresentação.

## Não objetivos

- Nenhum shim de compatibilidade retroativa para `buildCrossContextComponents`.
- Nenhum escape nativo público para `components`, `blocks`, `buttons` ou `card`.
- Nenhuma importação pelo core de bibliotecas de UI nativas de canal.
- Nenhuma interface de SDK específica de provedor para canais empacotados.

## Modelo-alvo

Adicione um campo `presentation` de propriedade do core a `ReplyPayload`.

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

`interactive` se torna um subconjunto de `presentation` durante a migração:

- Bloco de texto de `interactive` é mapeado para `presentation.blocks[].type = "text"`.
- Bloco de botões de `interactive` é mapeado para `presentation.blocks[].type = "buttons"`.
- Bloco de seleção de `interactive` é mapeado para `presentation.blocks[].type = "select"`.

Os schemas externos do agente e da CLI agora usam `presentation`; `interactive` permanece como helper interno legado de análise/renderização para produtores de resposta existentes.
A API pública voltada a produtores trata `interactive` como obsoleto. O suporte em runtime
permanece para que helpers de aprovação existentes e Plugins mais antigos continuem
funcionando enquanto o código novo emite `presentation`.

## Metadados de entrega

Adicione um campo `delivery` de propriedade do core para comportamento de envio que não é UI.

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

Semântica:

- `delivery.pin = true` significa fixar a primeira mensagem entregue com sucesso.
- `notify` usa `false` como padrão.
- `required` usa `false` como padrão; canais sem suporte ou falha na fixação são autodegradados ao continuar a entrega.
- Ações manuais de mensagem `pin`, `unpin` e `list-pins` permanecem para mensagens existentes.

A vinculação atual de tópico ACP do Telegram deve passar de `channelData.telegram.pin = true` para `delivery.pin = true`.

## Contrato de capacidade em runtime

Adicione hooks de renderização de apresentação e entrega ao adaptador de saída em runtime, não ao Plugin de canal do plano de controle.

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

Comportamento do core:

- Resolver o canal de destino e o adaptador em runtime.
- Consultar capacidades de apresentação.
- Degradar blocos sem suporte e aplicar limites genéricos de capacidade antes de
  renderizar.
- Chamar `renderPresentation`.
- Se nenhum renderizador existir, converter a apresentação para fallback de texto.
- Após envio bem-sucedido, chamar `pinDeliveredMessage` quando `delivery.pin` for solicitado e suportado.

## Mapeamento de canais

Discord:

- Renderizar `presentation` para componentes v2 e contêineres Carbon em módulos somente de runtime.
- Manter helpers de cor de destaque em módulos leves.
- Remover importações de `DiscordUiContainer` do código do plano de controle do Plugin de canal.

Slack:

- Renderizar `presentation` para Block Kit.
- Remover entrada `blocks` do agente e da CLI.

Telegram:

- Renderizar texto, contexto e divisores como texto.
- Renderizar ações e seleção como teclados inline quando configurado e permitido para a superfície de destino.
- Usar fallback de texto quando botões inline estiverem desativados.
- Mover a fixação de tópico ACP para `delivery.pin`.

Mattermost:

- Renderizar ações como botões interativos quando configurado.
- Renderizar outros blocos como fallback de texto.

MS Teams:

- Renderizar `presentation` para Adaptive Cards.
- Manter ações manuais de fixar/desafixar/listar fixados.
- Opcionalmente implementar `pinDeliveredMessage` se o suporte do Graph for confiável para a conversa de destino.

Feishu:

- Renderizar `presentation` para cartões interativos.
- Manter ações manuais de fixar/desafixar/listar fixados.
- Opcionalmente implementar `pinDeliveredMessage` para fixação de mensagem enviada se o comportamento da API for confiável.

LINE:

- Renderizar `presentation` para mensagens Flex ou de modelo quando possível.
- Fazer fallback para texto em blocos sem suporte.
- Remover payloads de UI do LINE de `channelData`.

Canais simples ou limitados:

- Converter apresentação para texto com formatação conservadora.

## Etapas de refatoração

1. Reaplicar a correção de release do Discord que separa `ui-colors.ts` da UI baseada em Carbon e remove `DiscordUiContainer` de `extensions/discord/src/channel.ts`.
2. Adicionar `presentation` e `delivery` a `ReplyPayload`, normalização de payload de saída, resumos de entrega e payloads de hook.
3. Adicionar schema `MessagePresentation` e helpers de parser em um subcaminho estreito de SDK/runtime.
4. Substituir capacidades de mensagem `buttons`, `cards`, `components` e `blocks` por capacidades de apresentação semântica.
5. Adicionar hooks de adaptador de saída em runtime para renderização de apresentação e fixação de entrega.
6. Substituir construção de componentes entre contextos por `buildCrossContextPresentation`.
7. Excluir `src/infra/outbound/channel-adapters.ts` e remover `buildCrossContextComponents` dos tipos de Plugin de canal.
8. Alterar `maybeApplyCrossContextMarker` para anexar `presentation` em vez de parâmetros nativos.
9. Atualizar caminhos de envio de despacho de Plugins para consumir somente apresentação semântica e metadados de entrega.
10. Remover parâmetros de payload nativo do agente e da CLI: `components`, `blocks`, `buttons` e `card`.
11. Remover helpers do SDK que criam schemas de ferramenta de mensagem nativa, substituindo-os por helpers de schema de apresentação.
12. Remover envelopes de UI/nativos de `channelData`; manter somente metadados de transporte até que cada campo restante seja revisado.
13. Migrar renderizadores do Discord, Slack, Telegram, Mattermost, MS Teams, Feishu e LINE.
14. Atualizar documentação para CLI de mensagens, páginas de canal, SDK de Plugin e cookbook de capacidades.
15. Executar perfilamento de fanout de importação para Discord e entrypoints de canais afetados.

As etapas 1-11 e 13-14 estão implementadas nesta refatoração para os contratos do agente compartilhado, CLI, capacidade de Plugin e adaptador de saída. A etapa 12 permanece como uma limpeza interna mais profunda para envelopes de transporte `channelData` privados de provedor. A etapa 15 permanece como validação de acompanhamento se quisermos números quantificados de fanout de importação além do gate de tipo/teste.

## Testes

Adicionar ou atualizar:

- Testes de normalização de apresentação.
- Testes de autodegradação de apresentação para blocos sem suporte.
- Testes de marcador entre contextos para despacho de Plugin e caminhos de entrega do core.
- Testes de matriz de renderização de canais para Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE e fallback de texto.
- Testes de schema de ferramenta de mensagem provando que campos nativos desapareceram.
- Testes de CLI provando que flags nativas desapareceram.
- Regressão de preguiça de importação do entrypoint do Discord cobrindo Carbon.
- Testes de fixação de entrega cobrindo Telegram e fallback genérico.

## Perguntas em aberto

- `delivery.pin` deve ser implementado para Discord, Slack, MS Teams e Feishu na primeira passada, ou somente Telegram primeiro?
- `delivery` deve eventualmente absorver campos existentes como `replyToId`, `replyToCurrent`, `silent` e `audioAsVoice`, ou permanecer focado em comportamentos pós-envio?
- A apresentação deve dar suporte direto a imagens ou referências de arquivo, ou a mídia deve permanecer separada do layout de UI por enquanto?

## Relacionado

- [Visão geral de canais](/pt-BR/channels)
- [Apresentação de mensagens](/pt-BR/plugins/message-presentation)
