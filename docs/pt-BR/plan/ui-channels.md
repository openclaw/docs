---
read_when:
    - Refatoração da UI de mensagens de canal, de payloads interativos ou de renderizadores nativos de canal
    - Alteração de recursos da ferramenta de mensagens, dicas de entrega ou marcadores entre contextos
    - Depuração da propagação de importações do Carbon do Discord ou do carregamento tardio em tempo de execução do Plugin de canal
summary: Desacople a apresentação semântica de mensagens dos renderizadores de UI nativos do canal.
title: Plano de refatoração da apresentação de canais
x-i18n:
    generated_at: "2026-04-30T09:57:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5608e7806a2a20e73ee82f1b1f0fcbbb4c865232df984d3d98b91e5b721998f5
    source_path: plan/ui-channels.md
    workflow: 16
---

## Status

Implementado para as superfícies de agente compartilhado, CLI, capacidade de plugin e entrega de saída:

- `ReplyPayload.presentation` carrega a UI semântica da mensagem.
- `ReplyPayload.delivery.pin` carrega solicitações de fixação de mensagem enviada.
- Ações de mensagem compartilhadas expõem `presentation`, `delivery` e `pin` em vez de `components`, `blocks`, `buttons` ou `card` nativos do provedor.
- O core renderiza ou degrada automaticamente a apresentação por meio das capacidades de saída declaradas pelo plugin.
- Renderizadores de Discord, Slack, Telegram, Mattermost, MS Teams e Feishu consomem o contrato genérico.
- O código do plano de controle do canal Discord não importa mais contêineres de UI baseados em Carbon.

A documentação canônica agora está em [Apresentação de Mensagens](/pt-BR/plugins/message-presentation).
Mantenha este plano como contexto histórico de implementação; atualize o guia canônico
para alterações de contrato, renderizador ou comportamento de fallback.

## Problema

A UI de canal atualmente está dividida entre várias superfícies incompatíveis:

- O core possui um hook de renderizador entre contextos com formato de Discord por meio de `buildCrossContextComponents`.
- O `channel.ts` do Discord pode importar a UI Carbon nativa por meio de `DiscordUiContainer`, o que traz dependências de UI em runtime para o plano de controle do plugin de canal.
- O agente e a CLI expõem escapes de payload nativo, como `components` do Discord, `blocks` do Slack, `buttons` do Telegram ou Mattermost e `card` do Teams ou Feishu.
- `ReplyPayload.channelData` carrega tanto dicas de transporte quanto envelopes de UI nativos.
- O modelo genérico `interactive` existe, mas é mais limitado que os layouts mais ricos já usados por Discord, Slack, Teams, Feishu, LINE, Telegram e Mattermost.

Isso faz o core conhecer formatos de UI nativos, enfraquece a preguiça de runtime dos plugins e dá aos agentes muitas formas específicas de provedor para expressar a mesma intenção de mensagem.

## Objetivos

- O core decide a melhor apresentação semântica para uma mensagem a partir das capacidades declaradas.
- Extensões declaram capacidades e renderizam apresentação semântica em payloads de transporte nativos.
- A UI Web Control permanece separada da UI nativa de chat.
- Payloads de canal nativos não são expostos pela superfície de mensagem compartilhada do agente ou da CLI.
- Recursos de apresentação sem suporte degradam automaticamente para a melhor representação em texto.
- Comportamentos de entrega, como fixar uma mensagem enviada, são metadados genéricos de entrega, não apresentação.

## Não objetivos

- Nenhum shim de compatibilidade retroativa para `buildCrossContextComponents`.
- Nenhum escape nativo público para `components`, `blocks`, `buttons` ou `card`.
- Nenhuma importação pelo core de bibliotecas de UI nativas de canal.
- Nenhum seam de SDK específico de provedor para canais integrados.

## Modelo-alvo

Adicione um campo `presentation`, pertencente ao core, a `ReplyPayload`.

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

- O bloco de texto de `interactive` é mapeado para `presentation.blocks[].type = "text"`.
- O bloco de botões de `interactive` é mapeado para `presentation.blocks[].type = "buttons"`.
- O bloco de seleção de `interactive` é mapeado para `presentation.blocks[].type = "select"`.

Os esquemas externos do agente e da CLI agora usam `presentation`; `interactive` permanece como um auxiliar interno legado de análise/renderização para produtores de resposta existentes.

## Metadados de entrega

Adicione um campo `delivery`, pertencente ao core, para comportamento de envio que não seja UI.

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
- `notify` tem padrão `false`.
- `required` tem padrão `false`; canais sem suporte ou falhas de fixação degradam automaticamente, continuando a entrega.
- Ações manuais de mensagem `pin`, `unpin` e `list-pins` permanecem para mensagens existentes.

A vinculação atual de tópico ACP do Telegram deve migrar de `channelData.telegram.pin = true` para `delivery.pin = true`.

## Contrato de capacidade de runtime

Adicione hooks de renderização de apresentação e entrega ao adaptador de saída em runtime, não ao plugin de canal do plano de controle.

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

- Resolver o canal de destino e o adaptador de runtime.
- Consultar as capacidades de apresentação.
- Degradar blocos sem suporte antes da renderização.
- Chamar `renderPresentation`.
- Se não houver renderizador, converter a apresentação em fallback de texto.
- Após o envio bem-sucedido, chamar `pinDeliveredMessage` quando `delivery.pin` for solicitado e tiver suporte.

## Mapeamento de canais

Discord:

- Renderizar `presentation` para components v2 e contêineres Carbon em módulos somente de runtime.
- Manter auxiliares de cor de destaque em módulos leves.
- Remover importações de `DiscordUiContainer` do código do plano de controle do plugin de canal.

Slack:

- Renderizar `presentation` para Block Kit.
- Remover a entrada `blocks` do agente e da CLI.

Telegram:

- Renderizar texto, contexto e divisores como texto.
- Renderizar ações e seleção como teclados inline quando configurado e permitido para a superfície de destino.
- Usar fallback de texto quando botões inline estiverem desativados.
- Migrar a fixação de tópico ACP para `delivery.pin`.

Mattermost:

- Renderizar ações como botões interativos quando configurado.
- Renderizar outros blocos como fallback de texto.

MS Teams:

- Renderizar `presentation` para Adaptive Cards.
- Manter ações manuais de fixar/desafixar/listar fixações.
- Opcionalmente implementar `pinDeliveredMessage` se o suporte do Graph for confiável para a conversa de destino.

Feishu:

- Renderizar `presentation` para cartões interativos.
- Manter ações manuais de fixar/desafixar/listar fixações.
- Opcionalmente implementar `pinDeliveredMessage` para fixação de mensagens enviadas se o comportamento da API for confiável.

LINE:

- Renderizar `presentation` para mensagens Flex ou de modelo quando possível.
- Fazer fallback para texto em blocos sem suporte.
- Remover payloads de UI do LINE de `channelData`.

Canais simples ou limitados:

- Converter apresentação em texto com formatação conservadora.

## Etapas de refatoração

1. Reaplicar a correção de lançamento do Discord que separa `ui-colors.ts` da UI baseada em Carbon e remove `DiscordUiContainer` de `extensions/discord/src/channel.ts`.
2. Adicionar `presentation` e `delivery` a `ReplyPayload`, normalização de payload de saída, resumos de entrega e payloads de hook.
3. Adicionar esquema `MessagePresentation` e auxiliares de parser em um subcaminho estreito de SDK/runtime.
4. Substituir capacidades de mensagem `buttons`, `cards`, `components` e `blocks` por capacidades semânticas de apresentação.
5. Adicionar hooks de adaptador de saída em runtime para renderização de apresentação e fixação de entrega.
6. Substituir a construção de componentes entre contextos por `buildCrossContextPresentation`.
7. Excluir `src/infra/outbound/channel-adapters.ts` e remover `buildCrossContextComponents` dos tipos de plugin de canal.
8. Alterar `maybeApplyCrossContextMarker` para anexar `presentation` em vez de parâmetros nativos.
9. Atualizar caminhos de envio de plugin-dispatch para consumir apenas apresentação semântica e metadados de entrega.
10. Remover parâmetros de payload nativo do agente e da CLI: `components`, `blocks`, `buttons` e `card`.
11. Remover auxiliares de SDK que criam esquemas nativos de ferramentas de mensagem, substituindo-os por auxiliares de esquema de apresentação.
12. Remover envelopes de UI/nativos de `channelData`; manter apenas metadados de transporte até que cada campo restante seja revisado.
13. Migrar renderizadores de Discord, Slack, Telegram, Mattermost, MS Teams, Feishu e LINE.
14. Atualizar documentação para CLI de mensagens, páginas de canal, SDK de Plugin e cookbook de capacidades.
15. Executar perfilamento de fanout de importações para Discord e pontos de entrada de canal afetados.

As etapas 1-11 e 13-14 estão implementadas nesta refatoração para os contratos do agente compartilhado, CLI, capacidade de plugin e adaptador de saída. A etapa 12 permanece como uma rodada mais profunda de limpeza interna para envelopes de transporte `channelData` privados de provedor. A etapa 15 permanece como validação de acompanhamento se quisermos números quantificados de fanout de importação além do gate de tipos/testes.

## Testes

Adicionar ou atualizar:

- Testes de normalização de apresentação.
- Testes de degradação automática de apresentação para blocos sem suporte.
- Testes de marcador entre contextos para plugin dispatch e caminhos de entrega do core.
- Testes de matriz de renderização de canais para Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE e fallback de texto.
- Testes de esquema de ferramenta de mensagem comprovando que campos nativos foram removidos.
- Testes de CLI comprovando que flags nativas foram removidas.
- Regressão de preguiça de importação do ponto de entrada do Discord cobrindo Carbon.
- Testes de fixação de entrega cobrindo Telegram e fallback genérico.

## Perguntas em aberto

- `delivery.pin` deve ser implementado para Discord, Slack, MS Teams e Feishu na primeira rodada, ou apenas Telegram primeiro?
- `delivery` deve eventualmente absorver campos existentes como `replyToId`, `replyToCurrent`, `silent` e `audioAsVoice`, ou permanecer focado em comportamentos pós-envio?
- A apresentação deve oferecer suporte direto a imagens ou referências de arquivo, ou mídia deve permanecer separada do layout de UI por enquanto?

## Relacionados

- [Visão geral de canais](/pt-BR/channels)
- [Apresentação de mensagens](/pt-BR/plugins/message-presentation)
