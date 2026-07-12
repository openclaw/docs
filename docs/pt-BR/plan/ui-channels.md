---
read_when:
    - Refatoração da interface de mensagens de canais, payloads interativos ou renderizadores nativos de canais
    - Alteração dos recursos da ferramenta de mensagens, das indicações de entrega ou dos marcadores entre contextos
    - Depuração do fanout de importação do Discord Carbon ou do carregamento tardio em tempo de execução do plugin de canal
summary: Desacople a apresentação semântica de mensagens dos renderizadores de interface nativos dos canais.
title: Plano de refatoração da apresentação de canais
x-i18n:
    generated_at: "2026-07-12T00:03:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## Status

Implementado para as superfícies de agente compartilhado, CLI, recursos de plugins e entrega de saída:

- `ReplyPayload.presentation` transporta a interface semântica da mensagem.
- `ReplyPayload.delivery.pin` transporta solicitações para fixar mensagens enviadas.
- As ações de mensagem compartilhadas expõem `presentation`, `delivery` e `pin`, em vez de `components`, `blocks`, `buttons` ou `card` nativos do provedor.
- O núcleo renderiza ou degrada automaticamente a apresentação por meio dos recursos de saída declarados pelo plugin.
- Os renderizadores do Discord, Slack, Telegram, Mattermost, MS Teams e Feishu consomem o contrato genérico.
- O código do plano de controle do canal Discord não importa mais contêineres de interface baseados no Carbon.

A documentação canônica agora está em [Apresentação de mensagens](/pt-BR/plugins/message-presentation).
Mantenha este plano como contexto histórico da implementação; atualize o guia canônico
quando houver alterações no contrato, no renderizador ou no comportamento de fallback.

## Problema

Atualmente, a interface dos canais está dividida entre várias superfícies incompatíveis:

- O núcleo possui um hook de renderização entre contextos no formato do Discord por meio de `buildCrossContextComponents`.
- O `channel.ts` do Discord pode importar a interface nativa do Carbon por meio de `DiscordUiContainer`, o que incorpora dependências de interface em tempo de execução ao plano de controle do plugin de canal.
- O agente e a CLI expõem mecanismos de escape para payloads nativos, como `components` do Discord, `blocks` do Slack, `buttons` do Telegram ou Mattermost e `card` do Teams ou Feishu.
- `ReplyPayload.channelData` transporta tanto indicações de transporte quanto envelopes de interface nativa.
- O modelo genérico `interactive` existe, mas é mais limitado do que os layouts mais sofisticados já usados pelo Discord, Slack, Teams, Feishu, LINE, Telegram e Mattermost.

Isso faz com que o núcleo conheça os formatos de interface nativos, prejudica o carregamento tardio do runtime dos plugins e oferece aos agentes muitas formas específicas de cada provedor para expressar a mesma intenção de mensagem.

## Objetivos

- O núcleo decide a melhor apresentação semântica para uma mensagem com base nos recursos declarados.
- As extensões declaram recursos e renderizam a apresentação semântica em payloads de transporte nativos.
- A interface Web Control permanece separada da interface nativa de chat.
- Os payloads nativos de canais não são expostos pela superfície compartilhada de mensagens do agente ou da CLI.
- Recursos de apresentação não compatíveis são automaticamente degradados para a melhor representação em texto.
- Comportamentos de entrega, como fixar uma mensagem enviada, são metadados genéricos de entrega, não de apresentação.

## Fora do escopo

- Nenhuma camada de compatibilidade retroativa para `buildCrossContextComponents`.
- Nenhum mecanismo de escape nativo público para `components`, `blocks`, `buttons` ou `card`.
- Nenhuma importação, pelo núcleo, de bibliotecas de interface nativas de canais.
- Nenhuma interface de SDK específica de provedor para canais incluídos.

## Modelo desejado

Adicione um campo `presentation`, pertencente ao núcleo, a `ReplyPayload`.

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

Durante a migração, `interactive` torna-se um subconjunto de `presentation`:

- O bloco de texto de `interactive` corresponde a `presentation.blocks[].type = "text"`.
- O bloco de botões de `interactive` corresponde a `presentation.blocks[].type = "buttons"`.
- O bloco de seleção de `interactive` corresponde a `presentation.blocks[].type = "select"`.

Os esquemas externos do agente e da CLI agora usam `presentation`; `interactive` permanece como um auxiliar interno legado de análise/renderização para os produtores de respostas existentes.
A API pública voltada a produtores considera `interactive` obsoleto. O suporte em runtime
permanece para que os auxiliares de aprovação existentes e plugins antigos continuem
funcionando enquanto o novo código emite `presentation`.

## Metadados de entrega

Adicione um campo `delivery`, pertencente ao núcleo, para comportamentos de envio que não fazem parte da interface.

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
- O valor padrão de `notify` é `false`.
- O valor padrão de `required` é `false`; canais não compatíveis ou falhas ao fixar degradam automaticamente, permitindo que a entrega continue.
- As ações manuais de mensagem `pin`, `unpin` e `list-pins` permanecem disponíveis para mensagens existentes.

A vinculação atual de tópicos ACP do Telegram deve migrar de `channelData.telegram.pin = true` para `delivery.pin = true`.

## Contrato de recursos do runtime

Adicione hooks de renderização de apresentação e entrega ao adaptador de saída do runtime, não ao plugin de canal do plano de controle.

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

Comportamento do núcleo:

- Resolver o canal de destino e o adaptador do runtime.
- Consultar os recursos de apresentação.
- Degradar blocos não compatíveis e aplicar limites genéricos de recursos antes
  da renderização.
- Chamar `renderPresentation`.
- Se não houver um renderizador, converter a apresentação em um fallback de texto.
- Após um envio bem-sucedido, chamar `pinDeliveredMessage` quando `delivery.pin` for solicitado e houver suporte.

## Mapeamento de canais

Discord:

- Renderizar `presentation` em componentes v2 e contêineres Carbon em módulos exclusivos do runtime.
- Manter os auxiliares de cores de destaque em módulos leves.
- Remover as importações de `DiscordUiContainer` do código do plano de controle do plugin de canal.

Slack:

- Renderizar `presentation` em Block Kit.
- Remover a entrada `blocks` do agente e da CLI.

Telegram:

- Renderizar texto, contexto e divisores como texto.
- Renderizar ações e seleções como teclados embutidos quando configurado e permitido para a superfície de destino.
- Usar fallback de texto quando os botões embutidos estiverem desativados.
- Migrar a fixação de tópicos ACP para `delivery.pin`.

Mattermost:

- Renderizar ações como botões interativos quando configurado.
- Renderizar outros blocos como fallback de texto.

MS Teams:

- Renderizar `presentation` em Adaptive Cards.
- Manter as ações manuais `pin`/`unpin`/`list-pins`.
- Implementar opcionalmente `pinDeliveredMessage` se o suporte do Graph for confiável para a conversa de destino.

Feishu:

- Renderizar `presentation` em cartões interativos.
- Manter as ações manuais `pin`/`unpin`/`list-pins`.
- Implementar opcionalmente `pinDeliveredMessage` para fixar mensagens enviadas, caso o comportamento da API seja confiável.

LINE:

- Renderizar `presentation` em mensagens Flex ou de modelo quando possível.
- Usar fallback de texto para blocos não compatíveis.
- Remover os payloads de interface do LINE de `channelData`.

Canais simples ou limitados:

- Converter a apresentação em texto com formatação conservadora.

## Etapas da refatoração

1. Reaplicar a correção de versão do Discord que separa `ui-colors.ts` da interface baseada no Carbon e remove `DiscordUiContainer` de `extensions/discord/src/channel.ts`.
2. Adicionar `presentation` e `delivery` a `ReplyPayload`, à normalização de payloads de saída, aos resumos de entrega e aos payloads de hooks.
3. Adicionar o esquema `MessagePresentation` e auxiliares de análise em um subcaminho restrito do SDK/runtime.
4. Substituir os recursos de mensagem `buttons`, `cards`, `components` e `blocks` por recursos de apresentação semântica.
5. Adicionar hooks ao adaptador de saída do runtime para renderização da apresentação e fixação na entrega.
6. Substituir a construção de componentes entre contextos por `buildCrossContextPresentation`.
7. Excluir `src/infra/outbound/channel-adapters.ts` e remover `buildCrossContextComponents` dos tipos de plugins de canal.
8. Alterar `maybeApplyCrossContextMarker` para anexar `presentation` em vez de parâmetros nativos.
9. Atualizar os caminhos de envio do dispatcher de plugins para consumir somente apresentação semântica e metadados de entrega.
10. Remover os parâmetros de payload nativo do agente e da CLI: `components`, `blocks`, `buttons` e `card`.
11. Remover os auxiliares do SDK que criam esquemas nativos de ferramentas de mensagem, substituindo-os por auxiliares de esquema de apresentação.
12. Remover envelopes nativos/de interface de `channelData`; manter somente metadados de transporte até que cada campo restante seja revisado.
13. Migrar os renderizadores do Discord, Slack, Telegram, Mattermost, MS Teams, Feishu e LINE.
14. Atualizar a documentação da CLI de mensagens, das páginas de canais, do SDK de plugins e do guia prático de recursos.
15. Executar a análise de propagação de importações para o Discord e os pontos de entrada dos canais afetados.

As etapas 1 a 11 e 13 a 14 foram implementadas nesta refatoração para os contratos do agente compartilhado, da CLI, dos recursos de plugins e do adaptador de saída. A etapa 12 ainda requer uma limpeza interna mais profunda dos envelopes de transporte `channelData` privados dos provedores. A etapa 15 permanece como validação posterior, caso sejam desejados números quantificados de propagação de importações além da verificação de tipos/testes.

## Testes

Adicionar ou atualizar:

- Testes de normalização da apresentação.
- Testes de degradação automática da apresentação para blocos não compatíveis.
- Testes de marcadores entre contextos para o dispatcher de plugins e os caminhos de entrega do núcleo.
- Testes da matriz de renderização de canais para Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE e fallback de texto.
- Testes do esquema de ferramentas de mensagem que comprovem a remoção dos campos nativos.
- Testes da CLI que comprovem a remoção das opções nativas.
- Regressão de carregamento tardio das importações do ponto de entrada do Discord abrangendo o Carbon.
- Testes de fixação na entrega abrangendo o Telegram e o fallback genérico.

## Questões em aberto

- `delivery.pin` deve ser implementado para Discord, Slack, MS Teams e Feishu na primeira etapa ou inicialmente apenas para o Telegram?
- `delivery` deve futuramente incorporar campos existentes como `replyToId`, `replyToCurrent`, `silent` e `audioAsVoice`, ou permanecer focado em comportamentos posteriores ao envio?
- A apresentação deve oferecer suporte direto a imagens ou referências de arquivos, ou a mídia deve permanecer separada do layout da interface por enquanto?

## Relacionado

- [Visão geral dos canais](/pt-BR/channels)
- [Apresentação de mensagens](/pt-BR/plugins/message-presentation)
