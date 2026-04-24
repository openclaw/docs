---
read_when:
    - Adicionar ou modificar a renderização de cards de mensagem, botões ou selects
    - Criar um Plugin de canal com suporte a mensagens de saída ricas
    - Alterar capacidades de apresentação ou entrega da ferramenta de mensagem
    - Depurar regressões de renderização de card/bloco/component específicas de provedor
summary: Cards semânticos de mensagem, botões, selects, texto de fallback e dicas de entrega para Plugins de canal
title: Message Presentation
x-i18n:
    generated_at: "2026-04-24T06:03:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c8c3903101310de330017b34bc2f0d641f4c8ea2b80a30532736b4409716510
    source_path: plugins/message-presentation.md
    workflow: 15
---

A apresentação de mensagem é o contrato compartilhado do OpenClaw para UI rica de chat de saída.
Ela permite que agentes, comandos da CLI, fluxos de aprovação e Plugins descrevam a
intenção da mensagem uma única vez, enquanto cada Plugin de canal renderiza a melhor forma nativa que puder.

Use apresentação para UI portátil de mensagem:

- seções de texto
- texto pequeno de contexto/rodapé
- divisores
- botões
- menus select
- título e tom do card

Não adicione novos campos nativos de provedor, como `components` do Discord, `blocks` do Slack,
`buttons` do Telegram, `card` do Teams ou `card` do Feishu, à ferramenta de
mensagem compartilhada. Essas são saídas de renderizador controladas pelo Plugin de canal.

## Contrato

Autores de Plugin importam o contrato público de:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Formato:

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

Semântica de botão:

- `value` é um valor de ação da aplicação roteado de volta pelo caminho
  de interação existente do canal quando o canal oferece suporte a controles clicáveis.
- `url` é um botão de link. Ele pode existir sem `value`.
- `label` é obrigatório e também é usado no fallback em texto.
- `style` é consultivo. Os renderizadores devem mapear estilos não compatíveis para um
  padrão seguro, não falhar no envio.

Semântica de select:

- `options[].value` é o valor de aplicação selecionado.
- `placeholder` é consultivo e pode ser ignorado por canais sem suporte
  nativo a select.
- Se um canal não oferecer suporte a selects, o texto de fallback lista os rótulos.

## Exemplos de produtor

Card simples:

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

Botão de link somente com URL:

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

Menu select:

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

Envio por CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

Entrega fixada:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Entrega fixada com JSON explícito:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Contrato do renderizador

Plugins de canal declaram suporte de renderização em seu adaptador de saída:

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

Os campos de capacidade são intencionalmente booleanos simples. Eles descrevem o que o
renderizador pode tornar interativo, não todos os limites nativos da plataforma. Os renderizadores ainda
controlam limites específicos de plataforma, como contagem máxima de botões, contagem de blocos e
tamanho do card.

## Fluxo de renderização do core

Quando um `ReplyPayload` ou ação de mensagem inclui `presentation`, o core:

1. Normaliza o payload de apresentação.
2. Resolve o adaptador de saída do canal de destino.
3. Lê `presentationCapabilities`.
4. Chama `renderPresentation` quando o adaptador pode renderizar o payload.
5. Recorre a texto conservador quando o adaptador está ausente ou não consegue renderizar.
6. Envia o payload resultante pelo caminho normal de entrega do canal.
7. Aplica metadados de entrega, como `delivery.pin`, após a primeira
   mensagem enviada com sucesso.

O core controla o comportamento de fallback para que produtores possam permanecer agnósticos ao canal. Plugins de canal
controlam a renderização nativa e o tratamento de interação.

## Regras de degradação

A apresentação deve ser segura para envio em canais limitados.

O texto de fallback inclui:

- `title` como primeira linha
- blocos `text` como parágrafos normais
- blocos `context` como linhas compactas de contexto
- blocos `divider` como separador visual
- rótulos de botão, incluindo URLs para botões de link
- rótulos de opção de select

Controles nativos não compatíveis devem sofrer degradação em vez de falhar o envio inteiro.
Exemplos:

- Telegram com botões inline desativados envia fallback em texto.
- Um canal sem suporte a select lista as opções de select como texto.
- Um botão somente com URL torna-se ou um botão de link nativo ou uma linha de URL em fallback.
- Falhas opcionais de fixação não fazem a mensagem entregue falhar.

A principal exceção é `delivery.pin.required: true`; se a fixação for solicitada como
obrigatória e o canal não puder fixar a mensagem enviada, a entrega relata falha.

## Mapeamento de provedor

Renderizadores empacotados atuais:

| Canal           | Alvo de renderização nativo          | Observações                                                                                                                                      |
| ---------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Discord         | Components e contêineres de componente | Preserva `channelData.discord.components` legado para produtores existentes de payload nativo de provedor, mas novos envios compartilhados devem usar `presentation`. |
| Slack           | Block Kit                            | Preserva `channelData.slack.blocks` legado para produtores existentes de payload nativo de provedor, mas novos envios compartilhados devem usar `presentation`. |
| Telegram        | Texto mais teclados inline           | Botões/selects exigem capacidade de botão inline para a superfície de destino; caso contrário, é usado fallback em texto.                      |
| Mattermost      | Texto mais props interativas         | Outros blocos sofrem degradação para texto.                                                                                                     |
| Microsoft Teams | Adaptive Cards                       | O texto simples `message` é incluído com o card quando ambos são fornecidos.                                                                    |
| Feishu          | Cards interativos                    | O cabeçalho do card pode usar `title`; o corpo evita duplicar esse título.                                                                      |
| Canais simples  | Fallback em texto                    | Canais sem renderizador ainda recebem saída legível.                                                                                             |

Compatibilidade com payload nativo de provedor é uma facilidade de transição para produtores
existentes de resposta. Não é motivo para adicionar novos campos nativos compartilhados.

## Presentation vs InteractiveReply

`InteractiveReply` é o subconjunto interno mais antigo usado por helpers de aprovação e interação.
Ele oferece suporte a:

- texto
- botões
- selects

`MessagePresentation` é o contrato canônico compartilhado de envio. Ele adiciona:

- título
- tom
- contexto
- divisor
- botões somente com URL
- metadados genéricos de entrega por meio de `ReplyPayload.delivery`

Use helpers de `openclaw/plugin-sdk/interactive-runtime` ao fazer bridge de
código mais antigo:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Código novo deve aceitar ou produzir `MessagePresentation` diretamente.

## Delivery Pin

Fixação é comportamento de entrega, não apresentação. Use `delivery.pin` em vez de
campos nativos de provedor, como `channelData.telegram.pin`.

Semântica:

- `pin: true` fixa a primeira mensagem entregue com sucesso.
- `pin.notify` usa `false` por padrão.
- `pin.required` usa `false` por padrão.
- Falhas opcionais de fixação sofrem degradação e deixam a mensagem enviada intacta.
- Falhas obrigatórias de fixação fazem a entrega falhar.
- Mensagens divididas em blocos fixam o primeiro bloco entregue, não o último.

Ações manuais de mensagem `pin`, `unpin` e `pins` ainda existem para mensagens existentes
em que o provedor oferece suporte a essas operações.

## Checklist para autores de Plugin

- Declare `presentation` em `describeMessageTool(...)` quando o canal puder
  renderizar ou degradar com segurança a apresentação semântica.
- Adicione `presentationCapabilities` ao adaptador de saída de runtime.
- Implemente `renderPresentation` em código de runtime, não em código de
  configuração de Plugin do plano de controle.
- Mantenha bibliotecas nativas de UI fora de caminhos quentes de configuração/catálogo.
- Preserve limites de plataforma no renderizador e nos testes.
- Adicione testes de fallback para botões, selects, botões de URL, duplicação
  de título/texto e envios mistos de `message` mais `presentation`.
- Adicione suporte a fixação de entrega por meio de `deliveryCapabilities.pin` e
  `pinDeliveredMessage` somente quando o provedor puder fixar o ID da mensagem enviada.
- Não exponha novos campos nativos de provedor para card/bloco/component/button pelo
  schema compartilhado de ação de mensagem.

## Documentos relacionados

- [CLI de mensagem](/pt-BR/cli/message)
- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)
- [Arquitetura de Plugin](/pt-BR/plugins/architecture-internals#message-tool-schemas)
- [Plano de refatoração de apresentação de canal](/pt-BR/plan/ui-channels)
