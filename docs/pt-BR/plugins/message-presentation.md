---
read_when:
    - Adicionando ou modificando a renderização de cartão de mensagem, botão ou seleção
    - Criando um plugin de canal compatível com mensagens avançadas de saída
    - Alterando a apresentação da ferramenta de mensagem ou as capacidades de entrega
    - Depurando regressões de renderização específicas do provider em card/block/component
summary: Cartões semânticos de mensagem, botões, seleções, texto de fallback e dicas de entrega para plugins de canal
title: Apresentação de mensagens
x-i18n:
    generated_at: "2026-04-22T04:24:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6913b2b4331598a1396d19a572fba1fffde6cb9a6efa2192f30fe12404eb48d
    source_path: plugins/message-presentation.md
    workflow: 15
---

# Apresentação de mensagens

A apresentação de mensagens é o contrato compartilhado do OpenClaw para UI avançada de chat de saída.
Ela permite que agentes, comandos de CLI, fluxos de aprovação e plugins descrevam a
intenção da mensagem uma única vez, enquanto cada plugin de canal renderiza a melhor forma nativa possível.

Use apresentação para UI de mensagem portável:

- seções de texto
- texto pequeno de contexto/rodapé
- divisores
- botões
- menus de seleção
- título e tom do cartão

Não adicione novos campos nativos de provider, como `components` do Discord, `blocks` do Slack,
`buttons` do Telegram, `card` do Teams ou `card` do Feishu, à ferramenta compartilhada
de mensagem. Esses são saídas de renderização sob responsabilidade do plugin de canal.

## Contrato

Autores de plugin importam o contrato público de:

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

Semântica dos botões:

- `value` é um valor de ação da aplicação roteado de volta pelo
  caminho de interação existente do canal quando o canal oferece suporte a controles clicáveis.
- `url` é um botão de link. Ele pode existir sem `value`.
- `label` é obrigatório e também é usado no fallback em texto.
- `style` é apenas orientativo. Os renderizadores devem mapear estilos sem suporte para um
  padrão seguro, não falhar no envio.

Semântica de seleção:

- `options[].value` é o valor selecionado da aplicação.
- `placeholder` é apenas orientativo e pode ser ignorado por canais sem suporte nativo
  a seleção.
- Se um canal não oferecer suporte a seleções, o fallback em texto lista os rótulos.

## Exemplos de produtores

Cartão simples:

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

Menu de seleção:

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

Envio via CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

Entrega com fixação:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Entrega com fixação usando JSON explícito:

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

Plugins de canal declaram suporte de renderização no adaptador de saída:

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
renderizador consegue tornar interativo, não todos os limites da plataforma nativa. Os renderizadores continuam
sendo donos de limites específicos de plataforma, como contagem máxima de botões, contagem de blocos e tamanho do cartão.

## Fluxo de renderização do core

Quando um `ReplyPayload` ou ação de mensagem inclui `presentation`, o core:

1. Normaliza o payload de apresentação.
2. Resolve o adaptador de saída do canal de destino.
3. Lê `presentationCapabilities`.
4. Chama `renderPresentation` quando o adaptador consegue renderizar o payload.
5. Recorre a texto conservador quando o adaptador está ausente ou não consegue renderizar.
6. Envia o payload resultante pelo caminho normal de entrega do canal.
7. Aplica metadados de entrega, como `delivery.pin`, após a primeira
   mensagem enviada com sucesso.

O core é dono do comportamento de fallback para que os produtores possam continuar agnósticos ao canal. Os
plugins de canal são donos da renderização nativa e do tratamento de interações.

## Regras de degradação

A apresentação precisa ser segura para envio em canais limitados.

O fallback em texto inclui:

- `title` como primeira linha
- blocos `text` como parágrafos normais
- blocos `context` como linhas compactas de contexto
- blocos `divider` como separador visual
- rótulos de botões, incluindo URLs para botões de link
- rótulos de opções de seleção

Controles nativos sem suporte devem degradar em vez de falhar o envio inteiro.
Exemplos:

- Telegram com botões inline desabilitados envia fallback em texto.
- Um canal sem suporte a seleção lista as opções de seleção como texto.
- Um botão somente com URL se torna um botão de link nativo ou uma linha de URL em fallback.
- Falhas opcionais de fixação não falham a mensagem entregue.

A principal exceção é `delivery.pin.required: true`; se a fixação for solicitada como
obrigatória e o canal não conseguir fixar a mensagem enviada, a entrega reporta falha.

## Mapeamento por provider

Renderizadores incluídos atualmente:

| Canal           | Destino de renderização nativo      | Observações                                                                                                                                        |
| --------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components e contêineres de component | Preserva `channelData.discord.components` legado para produtores existentes de payload nativo do provider, mas novos envios compartilhados devem usar `presentation`. |
| Slack           | Block Kit                           | Preserva `channelData.slack.blocks` legado para produtores existentes de payload nativo do provider, mas novos envios compartilhados devem usar `presentation`.       |
| Telegram        | Texto mais teclados inline          | Botões/seleções exigem capacidade de botões inline para a superfície de destino; caso contrário, usa-se fallback em texto.                                         |
| Mattermost      | Texto mais props interativas        | Os outros blocos degradam para texto.                                                                                                              |
| Microsoft Teams | Adaptive Cards                      | O texto simples de `message` é incluído com o cartão quando ambos são fornecidos.                                                                 |
| Feishu          | Cartões interativos                 | O cabeçalho do cartão pode usar `title`; o corpo evita duplicar esse título.                                                                      |
| Canais simples  | Fallback em texto                   | Canais sem renderizador ainda recebem saída legível.                                                                                               |

A compatibilidade com payloads nativos do provider é uma facilidade de transição para produtores
de resposta existentes. Não é um motivo para adicionar novos campos nativos compartilhados.

## Presentation vs InteractiveReply

`InteractiveReply` é o subconjunto interno mais antigo usado por helpers de aprovação e interação.
Ele oferece suporte a:

- texto
- botões
- seleções

`MessagePresentation` é o contrato canônico compartilhado para envio. Ele adiciona:

- título
- tom
- contexto
- divisor
- botões somente com URL
- metadados genéricos de entrega por meio de `ReplyPayload.delivery`

Use helpers de `openclaw/plugin-sdk/interactive-runtime` ao adaptar código antigo:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Código novo deve aceitar ou produzir `MessagePresentation` diretamente.

## Fixação de entrega

Fixação é comportamento de entrega, não apresentação. Use `delivery.pin` em vez de
campos nativos do provider, como `channelData.telegram.pin`.

Semântica:

- `pin: true` fixa a primeira mensagem entregue com sucesso.
- `pin.notify` assume `false` por padrão.
- `pin.required` assume `false` por padrão.
- Falhas opcionais de fixação degradam e mantêm a mensagem enviada intacta.
- Falhas obrigatórias de fixação fazem a entrega falhar.
- Mensagens fragmentadas fixam o primeiro fragmento entregue, não o fragmento final.

Ações manuais de mensagem `pin`, `unpin` e `pins` continuam existindo para mensagens existentes
quando o provider oferece suporte a essas operações.

## Checklist para autores de plugin

- Declare `presentation` em `describeMessageTool(...)` quando o canal puder
  renderizar ou degradar com segurança a apresentação semântica.
- Adicione `presentationCapabilities` ao adaptador de saída de runtime.
- Implemente `renderPresentation` em código de runtime, não em código de
  configuração de plugin de plano de controle.
- Mantenha bibliotecas de UI nativas fora de caminhos quentes de configuração/catálogo.
- Preserve limites de plataforma no renderizador e nos testes.
- Adicione testes de fallback para botões sem suporte, seleções, botões de URL, duplicação de título/texto
  e envios mistos de `message` mais `presentation`.
- Adicione suporte a fixação de entrega por meio de `deliveryCapabilities.pin` e
  `pinDeliveredMessage` somente quando o provider puder fixar o id da mensagem enviada.
- Não exponha novos campos nativos de provider para card/block/component/button por meio do
  schema compartilhado de ação de mensagem.

## Documentação relacionada

- [CLI de mensagem](/cli/message)
- [Visão geral do SDK de plugin](/pt-BR/plugins/sdk-overview)
- [Arquitetura de plugin](/pt-BR/plugins/architecture#message-tool-schemas)
- [Plano de refatoração da apresentação de canal](/pt-BR/plan/ui-channels)
