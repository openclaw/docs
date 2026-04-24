---
read_when:
    - Refatorar a interface de mensagens do canal, cargas úteis interativas ou renderizadores nativos do canal
    - Alterar capacidades da ferramenta de mensagem, dicas de entrega ou marcadores entre contextos
    - Depurar a expansão de importação do Discord Carbon ou a carga preguiçosa do runtime do Plugin de canal
summary: Desacoplar a apresentação semântica de mensagens dos renderizadores de interface nativos do canal.
title: Plano de refatoração da apresentação de canal
x-i18n:
    generated_at: "2026-04-24T06:00:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: f983c4d14580e8a66744c7e5f23dd9846c11e926181a8441d60f346cec6d1eea
    source_path: plan/ui-channels.md
    workflow: 15
---

## Status

Implementado para o agente compartilhado, CLI, capacidade de Plugin e superfícies de entrega de saída:

- `ReplyPayload.presentation` carrega interface semântica de mensagem.
- `ReplyPayload.delivery.pin` carrega solicitações de fixação de mensagem enviada.
- Ações compartilhadas de mensagem expõem `presentation`, `delivery` e `pin` em vez de `components`, `blocks`, `buttons` ou `card` nativos do provedor.
- O core renderiza ou faz degradação automática da apresentação por meio de capacidades de saída declaradas pelo Plugin.
- Renderizadores de Discord, Slack, Telegram, Mattermost, MS Teams e Feishu consomem o contrato genérico.
- O código do plano de controle de canal do Discord não importa mais contêineres de interface com suporte de Carbon.

A documentação canônica agora está em [Message Presentation](/pt-BR/plugins/message-presentation).
Mantenha este plano como contexto histórico de implementação; atualize o guia canônico
para mudanças em contrato, renderizador ou comportamento de fallback.

## Problema

A interface de canal atualmente está dividida em várias superfícies incompatíveis:

- O core controla um hook de renderização entre contextos com formato de Discord por meio de `buildCrossContextComponents`.
- `channel.ts` do Discord pode importar UI nativa via `DiscordUiContainer`, o que puxa dependências de UI de runtime para o plano de controle do Plugin de canal.
- O agente e a CLI expõem rotas de escape de payload nativas, como `components` do Discord, `blocks` do Slack, `buttons` do Telegram ou Mattermost e `card` do Teams ou Feishu.
- `ReplyPayload.channelData` carrega tanto dicas de transporte quanto envelopes de UI nativos.
- O modelo genérico `interactive` existe, mas é mais estreito que os layouts mais ricos já usados por Discord, Slack, Teams, Feishu, LINE, Telegram e Mattermost.

Isso faz o core conhecer formatos nativos de UI, enfraquece a carga preguiçosa de runtime do Plugin e dá aos agentes muitas maneiras específicas de provedor para expressar a mesma intenção de mensagem.

## Objetivos

- O core decide a melhor apresentação semântica para uma mensagem a partir de capacidades declaradas.
- Extensões declaram capacidades e renderizam apresentação semântica em payloads nativos de transporte.
- A Control UI web permanece separada da UI nativa de chat.
- Payloads nativos de canal não são expostos pela superfície compartilhada de agente ou CLI.
- Recursos de apresentação não compatíveis sofrem degradação automática para a melhor representação em texto.
- Comportamento de entrega, como fixar uma mensagem enviada, é metadado genérico de entrega, não apresentação.

## Não objetivos

- Nenhum shim de compatibilidade retroativa para `buildCrossContextComponents`.
- Nenhuma rota de escape nativa pública para `components`, `blocks`, `buttons` ou `card`.
- Nenhuma importação no core de bibliotecas de UI nativas de canal.
- Nenhum seam de SDK específico de provedor para canais empacotados.

## Modelo-alvo

Adicione um campo `presentation` controlado pelo core a `ReplyPayload`.

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

`interactive` torna-se um subconjunto de `presentation` durante a migração:

- O bloco de texto `interactive` mapeia para `presentation.blocks[].type = "text"`.
- O bloco de botões `interactive` mapeia para `presentation.blocks[].type = "buttons"`.
- O bloco select `interactive` mapeia para `presentation.blocks[].type = "select"`.

Os schemas externos do agente e da CLI agora usam `presentation`; `interactive` permanece um helper legado interno de parsing/renderização para produtores de resposta existentes.

## Metadados de entrega

Adicione um campo `delivery` controlado pelo core para comportamento de envio que não seja UI.

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
- `notify` usa `false` por padrão.
- `required` usa `false` por padrão; canais não compatíveis ou falhas ao fixar sofrem degradação automática continuando a entrega.
- Ações manuais de mensagem `pin`, `unpin` e `list-pins` permanecem para mensagens existentes.

O binding atual de tópico ACP do Telegram deve ser movido de `channelData.telegram.pin = true` para `delivery.pin = true`.

## Contrato de capacidade de runtime

Adicione hooks de renderização de apresentação e entrega ao adaptador de saída de runtime, não ao Plugin de canal do plano de controle.

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
- Degradar blocos não compatíveis antes da renderização.
- Chamar `renderPresentation`.
- Se não houver renderizador, converter a apresentação em fallback de texto.
- Após envio bem-sucedido, chamar `pinDeliveredMessage` quando `delivery.pin` for solicitado e compatível.

## Mapeamento de canal

Discord:

- Renderizar `presentation` em components v2 e contêineres Carbon em módulos apenas de runtime.
- Manter helpers de cor de destaque em módulos leves.
- Remover importações de `DiscordUiContainer` do código do plano de controle do Plugin de canal.

Slack:

- Renderizar `presentation` em Block Kit.
- Remover entrada `blocks` do agente e da CLI.

Telegram:

- Renderizar texto, contexto e divisores como texto.
- Renderizar ações e select como teclados inline quando configurados e permitidos para a superfície de destino.
- Usar fallback em texto quando botões inline estiverem desativados.
- Mover fixação de tópico ACP para `delivery.pin`.

Mattermost:

- Renderizar ações como botões interativos quando configurado.
- Renderizar outros blocos como fallback em texto.

MS Teams:

- Renderizar `presentation` em Adaptive Cards.
- Manter ações manuais `pin`/`unpin`/`list-pins`.
- Opcionalmente implementar `pinDeliveredMessage` se o suporte do Graph for confiável para a conversa de destino.

Feishu:

- Renderizar `presentation` em cards interativos.
- Manter ações manuais `pin`/`unpin`/`list-pins`.
- Opcionalmente implementar `pinDeliveredMessage` para fixação de mensagem enviada, se o comportamento da API for confiável.

LINE:

- Renderizar `presentation` em mensagens Flex ou template quando possível.
- Fazer fallback para texto em blocos não compatíveis.
- Remover payloads de UI do LINE de `channelData`.

Canais simples ou limitados:

- Converter apresentação para texto com formatação conservadora.

## Etapas da refatoração

1. Reaplicar a correção de release do Discord que separa `ui-colors.ts` da UI com suporte de Carbon e remove `DiscordUiContainer` de `extensions/discord/src/channel.ts`.
2. Adicionar `presentation` e `delivery` a `ReplyPayload`, normalização de payload de saída, resumos de entrega e payloads de hook.
3. Adicionar schema `MessagePresentation` e helpers de parsing em um subcaminho estreito de SDK/runtime.
4. Substituir capacidades de mensagem `buttons`, `cards`, `components` e `blocks` por capacidades semânticas de apresentação.
5. Adicionar hooks do adaptador de saída de runtime para renderização de apresentação e fixação de entrega.
6. Substituir a construção de components entre contextos por `buildCrossContextPresentation`.
7. Excluir `src/infra/outbound/channel-adapters.ts` e remover `buildCrossContextComponents` dos tipos do Plugin de canal.
8. Alterar `maybeApplyCrossContextMarker` para anexar `presentation` em vez de parâmetros nativos.
9. Atualizar os caminhos de envio do plugin-dispatch para consumir apenas apresentação semântica e metadados de entrega.
10. Remover parâmetros nativos de payload do agente e da CLI: `components`, `blocks`, `buttons` e `card`.
11. Remover helpers de SDK que criam schemas nativos da ferramenta de mensagem, substituindo-os por helpers de schema de apresentação.
12. Remover envelopes nativos/UI de `channelData`; manter apenas metadados de transporte até que cada campo remanescente seja revisado.
13. Migrar renderizadores de Discord, Slack, Telegram, Mattermost, MS Teams, Feishu e LINE.
14. Atualizar a documentação para CLI de mensagem, páginas de canal, SDK de Plugin e cookbook de capacidades.
15. Executar profiling de expansão de importação para Discord e entrypoints de canal afetados.

As etapas 1-11 e 13-14 estão implementadas nesta refatoração para os contratos do agente compartilhado, CLI, capacidade de Plugin e adaptador de saída. A etapa 12 continua sendo uma limpeza interna mais profunda para envelopes privados de transporte `channelData` de provedor. A etapa 15 continua como validação futura, se quisermos números quantificados de expansão de importação além da barreira de tipos/testes.

## Testes

Adicionar ou atualizar:

- Testes de normalização de apresentação.
- Testes de degradação automática de apresentação para blocos não compatíveis.
- Testes de marcador entre contextos para caminhos de plugin-dispatch e entrega do core.
- Testes de matriz de renderização de canal para Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE e fallback em texto.
- Testes de schema da ferramenta de mensagem comprovando que campos nativos desapareceram.
- Testes de CLI comprovando que flags nativas desapareceram.
- Regressão de carga preguiçosa do entrypoint do Discord cobrindo Carbon.
- Testes de fixação de entrega cobrindo Telegram e fallback genérico.

## Questões em aberto

- `delivery.pin` deve ser implementado para Discord, Slack, MS Teams e Feishu na primeira etapa, ou apenas Telegram primeiro?
- `delivery` deve eventualmente absorver campos existentes como `replyToId`, `replyToCurrent`, `silent` e `audioAsVoice`, ou continuar focado em comportamentos pós-envio?
- A apresentação deve oferecer suporte direto a imagens ou referências de arquivo, ou a mídia deve permanecer separada do layout de UI por enquanto?

## Relacionado

- [Visão geral dos canais](/pt-BR/channels)
- [Message Presentation](/pt-BR/plugins/message-presentation)
