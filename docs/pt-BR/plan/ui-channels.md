---
read_when:
    - Refatorando a UI de mensagens do canal, payloads interativos ou renderizadores nativos do canal
    - Alterando capacidades da ferramenta de mensagem, dicas de entrega ou marcadores entre contextos
    - Depurando a propagação de importação do Carbon no Discord ou a lazy loading de runtime do plugin de canal
summary: Desacople a apresentação semântica de mensagens dos renderizadores nativos de UI do canal.
title: Plano de refatoração da apresentação de canal
x-i18n:
    generated_at: "2026-04-22T04:23:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed3c49f3cc55151992315599a05451fe499f2983d53d69dc58784e846f9f32ad
    source_path: plan/ui-channels.md
    workflow: 15
---

# Plano de refatoração da apresentação de canal

## Status

Implementado para as superfícies compartilhadas de agente, CLI, capacidade de plugin e entrega de saída:

- `ReplyPayload.presentation` carrega a UI semântica da mensagem.
- `ReplyPayload.delivery.pin` carrega solicitações para fixar mensagens enviadas.
- Ações compartilhadas de mensagem expõem `presentation`, `delivery` e `pin` em vez de `components`, `blocks`, `buttons` ou `card` nativos do provider.
- O core renderiza ou faz auto-degradação da apresentação por meio de capacidades de saída declaradas pelo plugin.
- Renderizadores de Discord, Slack, Telegram, Mattermost, Microsoft Teams e Feishu consomem o contrato genérico.
- O código de plano de controle do canal Discord não importa mais contêineres de UI baseados em Carbon.

A documentação canônica agora fica em [Message Presentation](/pt-BR/plugins/message-presentation).
Mantenha este plano como contexto histórico de implementação; atualize o guia canônico
para mudanças de contrato, renderizador ou comportamento de fallback.

## Problema

A UI de canal atualmente está dividida em várias superfícies incompatíveis:

- O core é dono de um hook de renderização entre contextos com formato de Discord por meio de `buildCrossContextComponents`.
- `channel.ts` do Discord pode importar UI nativa do Carbon por meio de `DiscordUiContainer`, o que puxa dependências de UI de runtime para o plano de controle do plugin de canal.
- O agente e a CLI expõem escapes de payload nativo como `components` do Discord, `blocks` do Slack, `buttons` do Telegram ou Mattermost e `card` do Teams ou Feishu.
- `ReplyPayload.channelData` carrega tanto dicas de transporte quanto envelopes de UI nativa.
- O modelo genérico `interactive` existe, mas é mais estreito do que os layouts mais ricos já usados por Discord, Slack, Teams, Feishu, LINE, Telegram e Mattermost.

Isso faz o core conhecer formatos de UI nativos, enfraquece a lazy loading do runtime do plugin e dá aos agentes caminhos específicos demais do provider para expressar a mesma intenção de mensagem.

## Objetivos

- O core decide a melhor apresentação semântica para uma mensagem a partir das capacidades declaradas.
- Extensões declaram capacidades e renderizam a apresentação semântica em payloads de transporte nativos.
- A Web Control UI permanece separada da UI nativa do chat.
- Payloads nativos de canal não são expostos por meio da superfície compartilhada de mensagem do agente ou da CLI.
- Recursos de apresentação sem suporte fazem auto-degradação para a melhor representação em texto.
- Comportamento de entrega, como fixar uma mensagem enviada, é metadado genérico de entrega, não apresentação.

## Não objetivos

- Sem shim de compatibilidade retroativa para `buildCrossContextComponents`.
- Sem escapes públicos nativos para `components`, `blocks`, `buttons` ou `card`.
- Sem imports no core de bibliotecas de UI nativas do canal.
- Sem seams de SDK específicos do provider para canais incluídos.

## Modelo alvo

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

- bloco de texto de `interactive` mapeia para `presentation.blocks[].type = "text"`.
- bloco de botões de `interactive` mapeia para `presentation.blocks[].type = "buttons"`.
- bloco de seleção de `interactive` mapeia para `presentation.blocks[].type = "select"`.

Os schemas externos do agente e da CLI agora usam `presentation`; `interactive` permanece como um helper interno legado de parser/renderização para produtores de resposta existentes.

## Metadados de entrega

Adicione um campo `delivery` de propriedade do core para comportamento de envio que não seja UI.

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
- `notify` assume `false` por padrão.
- `required` assume `false`; canais sem suporte ou falhas ao fixar fazem auto-degradação continuando a entrega.
- Ações manuais de mensagem `pin`, `unpin` e `list-pins` permanecem para mensagens existentes.

A vinculação atual de tópico ACP no Telegram deve migrar de `channelData.telegram.pin = true` para `delivery.pin = true`.

## Contrato de capacidade de runtime

Adicione hooks de renderização de apresentação e entrega ao adaptador de saída de runtime, não ao plugin de canal do plano de controle.

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

Comportamento do core:

- Resolve o canal de destino e o adaptador de runtime.
- Consulta as capacidades de apresentação.
- Faz degradação dos blocos sem suporte antes de renderizar.
- Chama `renderPresentation`.
- Se não existir renderizador, converte a apresentação para fallback em texto.
- Após envio bem-sucedido, chama `pinDeliveredMessage` quando `delivery.pin` for solicitado e houver suporte.

## Mapeamento por canal

Discord:

- Renderiza `presentation` para components v2 e contêineres Carbon em módulos somente de runtime.
- Mantém helpers de cor de destaque em módulos leves.
- Remove imports de `DiscordUiContainer` do código de plano de controle do plugin de canal.

Slack:

- Renderiza `presentation` para Block Kit.
- Remove a entrada `blocks` do agente e da CLI.

Telegram:

- Renderiza texto, contexto e divisores como texto.
- Renderiza actions e select como teclados inline quando configurados e permitidos para a superfície de destino.
- Usa fallback em texto quando botões inline estiverem desabilitados.
- Move a fixação de tópico ACP para `delivery.pin`.

Mattermost:

- Renderiza actions como botões interativos quando configurado.
- Renderiza os outros blocos como fallback em texto.

Microsoft Teams:

- Renderiza `presentation` para Adaptive Cards.
- Mantém ações manuais `pin`/`unpin`/`list-pins`.
- Opcionalmente implementa `pinDeliveredMessage` se o suporte do Graph for confiável para a conversa de destino.

Feishu:

- Renderiza `presentation` para cartões interativos.
- Mantém ações manuais `pin`/`unpin`/`list-pins`.
- Opcionalmente implementa `pinDeliveredMessage` para fixação de mensagem enviada se o comportamento da API for confiável.

LINE:

- Renderiza `presentation` para mensagens Flex ou template quando possível.
- Recorre a texto para blocos sem suporte.
- Remove payloads de UI do LINE de `channelData`.

Canais simples ou limitados:

- Converte a apresentação para texto com formatação conservadora.

## Etapas da refatoração

1. Reaplicar a correção de release do Discord que separa `ui-colors.ts` da UI baseada em Carbon e remove `DiscordUiContainer` de `extensions/discord/src/channel.ts`.
2. Adicionar `presentation` e `delivery` a `ReplyPayload`, normalização de payload de saída, resumos de entrega e payloads de hook.
3. Adicionar schema `MessagePresentation` e helpers de parser em um subcaminho estreito de SDK/runtime.
4. Substituir capacidades de mensagem `buttons`, `cards`, `components` e `blocks` por capacidades semânticas de apresentação.
5. Adicionar hooks de adaptador de saída de runtime para renderização de apresentação e fixação de entrega.
6. Substituir a construção de components entre contextos por `buildCrossContextPresentation`.
7. Excluir `src/infra/outbound/channel-adapters.ts` e remover `buildCrossContextComponents` dos tipos de plugin de canal.
8. Alterar `maybeApplyCrossContextMarker` para anexar `presentation` em vez de parâmetros nativos.
9. Atualizar caminhos de envio de plugin-dispatch para consumir apenas apresentação semântica e metadados de entrega.
10. Remover parâmetros nativos do agente e da CLI: `components`, `blocks`, `buttons` e `card`.
11. Remover helpers do SDK que criam schemas nativos da ferramenta de mensagem, substituindo-os por helpers de schema de apresentação.
12. Remover envelopes de UI/nativos de `channelData`; manter apenas metadados de transporte até que cada campo restante seja revisado.
13. Migrar renderizadores de Discord, Slack, Telegram, Mattermost, Microsoft Teams, Feishu e LINE.
14. Atualizar documentação para CLI de mensagem, páginas de canal, SDK de plugin e cookbook de capacidades.
15. Executar profiling de propagação de imports para Discord e pontos de entrada de canal afetados.

As etapas 1-11 e 13-14 estão implementadas nesta refatoração para os contratos compartilhados de agente, CLI, capacidade de plugin e adaptador de saída. A etapa 12 continua sendo uma limpeza interna mais profunda para envelopes de transporte `channelData` privados do provider. A etapa 15 permanece como validação posterior se quisermos números quantificados de propagação de import além do gate de tipos/testes.

## Testes

Adicionar ou atualizar:

- Testes de normalização de apresentação.
- Testes de auto-degradação de apresentação para blocos sem suporte.
- Testes de marcador entre contextos para caminhos de plugin-dispatch e entrega do core.
- Testes de matriz de renderização de canal para Discord, Slack, Telegram, Mattermost, Microsoft Teams, Feishu, LINE e fallback em texto.
- Testes de schema da ferramenta de mensagem provando que campos nativos desapareceram.
- Testes de CLI provando que flags nativas desapareceram.
- Regressão de lazy loading de import no ponto de entrada do Discord cobrindo Carbon.
- Testes de fixação de entrega cobrindo Telegram e fallback genérico.

## Questões em aberto

- `delivery.pin` deve ser implementado para Discord, Slack, Microsoft Teams e Feishu na primeira etapa, ou apenas Telegram primeiro?
- `delivery` deve eventualmente absorver campos existentes como `replyToId`, `replyToCurrent`, `silent` e `audioAsVoice`, ou permanecer focado em comportamentos pós-envio?
- A apresentação deve oferecer suporte direto a imagens ou referências de arquivo, ou a mídia deve permanecer separada do layout de UI por enquanto?
