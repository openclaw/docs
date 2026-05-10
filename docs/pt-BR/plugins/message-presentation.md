---
read_when:
    - Adicionar ou modificar a renderização de cartões de mensagem, botões ou campos de seleção
    - Criando um Plugin de canal compatível com mensagens de saída enriquecidas
    - Alterando a apresentação da ferramenta de mensagens ou os recursos de entrega
    - Depuração de regressões específicas de provedor na renderização de cartões/blocos/componentes
summary: Cartões de mensagem semânticos, botões, seletores, texto de fallback e dicas de entrega para Plugins de canal
title: Apresentação de mensagens
x-i18n:
    generated_at: "2026-05-10T19:43:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3b6fc82b5faaff50e8c58f2c68e14a6a1b30ccf1d8dba7da8164dbec5ebe1b0
    source_path: plugins/message-presentation.md
    workflow: 16
---

A apresentação de mensagens é o contrato compartilhado da OpenClaw para UI de chat de saída avançada.
Ela permite que agentes, comandos da CLI, fluxos de aprovação e plugins descrevam a intenção da mensagem
uma vez, enquanto cada plugin de canal renderiza a melhor forma nativa possível.

Use apresentação para UI de mensagens portátil:

- seções de texto
- texto pequeno de contexto/rodapé
- divisores
- botões
- menus de seleção
- título e tom de cartão

Não adicione novos campos nativos de provedor, como `components` do Discord, `blocks`
do Slack, `buttons` do Telegram, `card` do Teams ou `card` do Feishu à ferramenta
de mensagem compartilhada. Eles são saídas de renderização pertencentes ao plugin de canal.

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

Semântica dos botões:

- `value` é um valor de ação da aplicação roteado de volta pelo caminho de
  interação existente do canal quando o canal oferece suporte a controles clicáveis.
- `url` é um botão de link. Ele pode existir sem `value`.
- `label` é obrigatório e também é usado no fallback de texto.
- `style` é consultivo. Renderizadores devem mapear estilos não compatíveis para um
  padrão seguro, não falhar o envio.

Semântica da seleção:

- `options[].value` é o valor da aplicação selecionado.
- `placeholder` é consultivo e pode ser ignorado por canais sem suporte nativo a
  seleção.
- Se um canal não oferecer suporte a seleções, o texto de fallback lista os rótulos.

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

Botão de link apenas com URL:

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

Envio pela CLI:

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

Os campos de capacidade são booleanos intencionalmente simples. Eles descrevem o que o
renderizador consegue tornar interativo, não todos os limites da plataforma nativa. Renderizadores ainda
são responsáveis por limites específicos da plataforma, como contagem máxima de botões, contagem de blocos e
tamanho de cartão.

## Fluxo de renderização do núcleo

Quando um `ReplyPayload` ou ação de mensagem inclui `presentation`, o núcleo:

1. Normaliza o payload de apresentação.
2. Resolve o adaptador de saída do canal de destino.
3. Lê `presentationCapabilities`.
4. Chama `renderPresentation` quando o adaptador consegue renderizar o payload.
5. Usa fallback para texto conservador quando o adaptador está ausente ou não consegue renderizar.
6. Envia o payload resultante pelo caminho normal de entrega do canal.
7. Aplica metadados de entrega, como `delivery.pin`, após a primeira mensagem
   enviada com sucesso.

O núcleo é responsável pelo comportamento de fallback para que produtores possam permanecer agnósticos em relação ao canal. Plugins de
canal são responsáveis pela renderização nativa e pelo tratamento de interações.

## Regras de degradação

A apresentação deve ser segura para envio em canais limitados.

O texto de fallback inclui:

- `title` como a primeira linha
- blocos `text` como parágrafos normais
- blocos `context` como linhas compactas de contexto
- blocos `divider` como separador visual
- rótulos de botões, incluindo URLs para botões de link
- rótulos de opções de seleção

Controles nativos sem suporte devem degradar em vez de falhar o envio inteiro.
Exemplos:

- Telegram com botões inline desativados envia fallback de texto.
- Um canal sem suporte a seleção lista as opções de seleção como texto.
- Um botão apenas com URL se torna um botão de link nativo ou uma linha de URL de fallback.
- Falhas opcionais de fixação não fazem a mensagem entregue falhar.

A principal exceção é `delivery.pin.required: true`; se a fixação for solicitada como
obrigatória e o canal não puder fixar a mensagem enviada, a entrega informa falha.

## Mapeamento de provedores

Renderizadores incluídos atualmente:

| Canal           | Destino de renderização nativa      | Observações                                                                                                                                      |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Discord         | Componentes e contêineres de componentes | Preserva `channelData.discord.components` legado para produtores de payload nativo de provedor existentes, mas novos envios compartilhados devem usar `presentation`. |
| Slack           | Block Kit                           | Preserva `channelData.slack.blocks` legado para produtores de payload nativo de provedor existentes, mas novos envios compartilhados devem usar `presentation`.       |
| Telegram        | Texto mais teclados inline          | Botões/seleções exigem capacidade de botão inline para a superfície de destino; caso contrário, fallback de texto é usado.                       |
| Mattermost      | Texto mais props interativas        | Outros blocos degradam para texto.                                                                                                               |
| Microsoft Teams | Adaptive Cards                      | O texto simples de `message` é incluído com o cartão quando ambos são fornecidos.                                                                |
| Feishu          | Cartões interativos                 | O cabeçalho do cartão pode usar `title`; o corpo evita duplicar esse título.                                                                     |
| Canais simples  | Fallback de texto                   | Canais sem renderizador ainda recebem uma saída legível.                                                                                         |

A compatibilidade com payload nativo de provedor é uma facilidade de transição para produtores
de respostas existentes. Ela não é motivo para adicionar novos campos nativos compartilhados.

## Apresentação vs InteractiveReply

`InteractiveReply` é o subconjunto interno mais antigo usado por auxiliares de aprovação e interação.
Ele oferece suporte a:

- texto
- botões
- seleções

`MessagePresentation` é o contrato canônico de envio compartilhado. Ele adiciona:

- título
- tom
- contexto
- divisor
- botões apenas com URL
- metadados genéricos de entrega por meio de `ReplyPayload.delivery`

Use auxiliares de `openclaw/plugin-sdk/interactive-runtime` ao fazer a ponte com código
mais antigo:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Código novo deve aceitar ou produzir `MessagePresentation` diretamente.

`presentationToInteractiveReply(...)` preserva o texto visível da apresentação ao
mapear o título, texto, contexto, botões e seleções para o formato antigo de
`InteractiveReply`. Renderizadores de componentes que já desenham título, texto,
contexto e blocos divisores nativamente devem usar
`presentationToInteractiveControlsReply(...)` em vez disso, e então anexar apenas os
controles de botão e seleção.

`renderMessagePresentationFallbackText(...)` retorna uma string vazia para
blocos de apresentação que não têm fallback de texto, como uma apresentação
composta apenas por divisor. Transportes que exigem um corpo de envio não vazio podem passar
`emptyFallback` para optar por um corpo mínimo sem alterar o contrato de fallback
padrão.

## Fixação de entrega

Fixação é comportamento de entrega, não apresentação. Use `delivery.pin` em vez de
campos nativos de provedor, como `channelData.telegram.pin`.

Semântica:

- `pin: true` fixa a primeira mensagem entregue com sucesso.
- `pin.notify` tem como padrão `false`.
- `pin.required` tem como padrão `false`.
- Falhas opcionais de fixação degradam e deixam a mensagem enviada intacta.
- Falhas de fixação obrigatória falham a entrega.
- Mensagens em partes fixam a primeira parte entregue, não a parte final.

Ações manuais de mensagem `pin`, `unpin` e `pins` ainda existem para mensagens
existentes quando o provedor oferece suporte a essas operações.

## Lista de verificação para autores de Plugin

- Declare `presentation` a partir de `describeMessageTool(...)` quando o canal puder
  renderizar ou degradar com segurança a apresentação semântica.
- Adicione `presentationCapabilities` ao adaptador de saída em runtime.
- Implemente `renderPresentation` no código de runtime, não no código de configuração
  do Plugin de plano de controle.
- Mantenha bibliotecas de UI nativa fora dos caminhos quentes de configuração/catálogo.
- Preserve limites da plataforma no renderizador e nos testes.
- Adicione testes de fallback para botões sem suporte, seleções, botões de URL, duplicação
  de título/texto e envios mistos de `message` mais `presentation`.
- Adicione suporte a fixação de entrega por meio de `deliveryCapabilities.pin` e
  `pinDeliveredMessage` somente quando o provedor puder fixar o id da mensagem enviada.
- Não exponha novos campos nativos de provedor de cartão/bloco/componente/botão pelo
  esquema de ação de mensagem compartilhado.

## Documentos relacionados

- [CLI de Mensagens](/pt-BR/cli/message)
- [Visão Geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)
- [Arquitetura de Plugin](/pt-BR/plugins/architecture-internals#message-tool-schemas)
- [Plano de Refatoração de Apresentação de Canais](/pt-BR/plan/ui-channels)
