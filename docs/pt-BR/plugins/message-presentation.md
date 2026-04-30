---
read_when:
    - Adição ou modificação da renderização de cartões de mensagem, botões ou seletores
    - Criando um Plugin de canal compatível com mensagens de saída ricas
    - Alterando a apresentação da ferramenta de mensagens ou os recursos de entrega
    - Depuração de regressões de renderização de cartões/blocos/componentes específicas de provedor
summary: Cartões semânticos de mensagem, botões, seletores, texto alternativo e dicas de entrega para plugins de canal
title: Apresentação da mensagem
x-i18n:
    generated_at: "2026-04-30T10:01:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23ef0eab890ee174c1433f72e84932a84a481f2bcf4b69bc793a2660ec94b10c
    source_path: plugins/message-presentation.md
    workflow: 16
---

A apresentação de mensagens é o contrato compartilhado da OpenClaw para UI rica de chat de saída.
Ela permite que agentes, comandos CLI, fluxos de aprovação e plugins descrevam a intenção da mensagem
uma vez, enquanto cada plugin de canal renderiza o melhor formato nativo possível.

Use a apresentação para UI de mensagem portátil:

- seções de texto
- pequeno texto de contexto/rodapé
- divisores
- botões
- menus de seleção
- título e tom do cartão

Não adicione novos campos nativos de provedor, como `components` do Discord, `blocks` do Slack,
`buttons` do Telegram, `card` do Teams ou `card` do Feishu à ferramenta compartilhada
de mensagens. Eles são saídas do renderizador pertencentes ao plugin de canal.

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

- `value` é um valor de ação do aplicativo roteado de volta pelo caminho de
  interação existente do canal quando o canal oferece suporte a controles clicáveis.
- `url` é um botão de link. Ele pode existir sem `value`.
- `label` é obrigatório e também é usado no fallback de texto.
- `style` é consultivo. Renderizadores devem mapear estilos sem suporte para um
  padrão seguro, não falhar no envio.

Semântica de seleção:

- `options[].value` é o valor selecionado do aplicativo.
- `placeholder` é consultivo e pode ser ignorado por canais sem suporte nativo
  a seleção.
- Se um canal não oferece suporte a seleções, o texto de fallback lista os rótulos.

## Exemplos de produtor

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

Botão de link somente URL:

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
renderizador pode tornar interativo, não todos os limites da plataforma nativa. Os renderizadores ainda
são responsáveis por limites específicos da plataforma, como contagem máxima de botões, contagem de blocos e
tamanho do cartão.

## Fluxo de renderização do núcleo

Quando um `ReplyPayload` ou uma ação de mensagem inclui `presentation`, o núcleo:

1. Normaliza o payload de apresentação.
2. Resolve o adaptador de saída do canal de destino.
3. Lê `presentationCapabilities`.
4. Chama `renderPresentation` quando o adaptador pode renderizar o payload.
5. Faz fallback para texto conservador quando o adaptador está ausente ou não consegue renderizar.
6. Envia o payload resultante pelo caminho normal de entrega do canal.
7. Aplica metadados de entrega, como `delivery.pin`, após a primeira mensagem
   enviada com sucesso.

O núcleo é responsável pelo comportamento de fallback para que os produtores possam permanecer agnósticos ao canal. Plugins de canal
são responsáveis pela renderização nativa e pelo tratamento de interação.

## Regras de degradação

A apresentação deve ser segura para enviar em canais limitados.

O texto de fallback inclui:

- `title` como a primeira linha
- blocos `text` como parágrafos normais
- blocos `context` como linhas compactas de contexto
- blocos `divider` como separador visual
- rótulos de botões, incluindo URLs para botões de link
- rótulos de opções de seleção

Controles nativos sem suporte devem degradar em vez de fazer o envio inteiro falhar.
Exemplos:

- Telegram com botões inline desativados envia fallback de texto.
- Um canal sem suporte a seleção lista opções de seleção como texto.
- Um botão somente URL se torna um botão de link nativo ou uma linha de URL de fallback.
- Falhas opcionais de fixação não fazem a mensagem entregue falhar.

A principal exceção é `delivery.pin.required: true`; se a fixação for solicitada como
obrigatória e o canal não puder fixar a mensagem enviada, a entrega relata falha.

## Mapeamento de provedor

Renderizadores empacotados atuais:

| Canal           | Destino de renderização nativo       | Observações                                                                                                                                             |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Componentes e contêineres de componentes | Preserva `channelData.discord.components` legado para produtores de payload nativo de provedor existentes, mas novos envios compartilhados devem usar `presentation`. |
| Slack           | Block Kit                            | Preserva `channelData.slack.blocks` legado para produtores de payload nativo de provedor existentes, mas novos envios compartilhados devem usar `presentation`.       |
| Telegram        | Texto mais teclados inline           | Botões/seleções exigem capacidade de botão inline para a superfície de destino; caso contrário, o fallback de texto é usado.                                         |
| Mattermost      | Texto mais props interativas         | Outros blocos degradam para texto.                                                                                                                     |
| Microsoft Teams | Adaptive Cards                       | Texto `message` simples é incluído com o cartão quando ambos são fornecidos.                                                                            |
| Feishu          | Cartões interativos                  | O cabeçalho do cartão pode usar `title`; o corpo evita duplicar esse título.                                                                                  |
| Canais simples  | Fallback de texto                    | Canais sem renderizador ainda recebem saída legível.                                                                                            |

A compatibilidade com payload nativo de provedor é um recurso de transição para produtores de
respostas existentes. Ela não é motivo para adicionar novos campos nativos compartilhados.

## Presentation vs InteractiveReply

`InteractiveReply` é o subconjunto interno mais antigo usado por helpers de aprovação e interação.
Ele oferece suporte a:

- texto
- botões
- seleções

`MessagePresentation` é o contrato canônico compartilhado de envio. Ele adiciona:

- título
- tom
- contexto
- divisor
- botões somente URL
- metadados genéricos de entrega por meio de `ReplyPayload.delivery`

Use helpers de `openclaw/plugin-sdk/interactive-runtime` ao conectar código mais antigo:

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
campos nativos de provedor, como `channelData.telegram.pin`.

Semântica:

- `pin: true` fixa a primeira mensagem entregue com sucesso.
- `pin.notify` usa `false` por padrão.
- `pin.required` usa `false` por padrão.
- Falhas opcionais de fixação degradam e deixam a mensagem enviada intacta.
- Falhas de fixação obrigatória fazem a entrega falhar.
- Mensagens em partes fixam a primeira parte entregue, não a parte final.

Ações manuais de mensagem `pin`, `unpin` e `pins` ainda existem para mensagens
existentes quando o provedor oferece suporte a essas operações.

## Checklist para autores de Plugin

- Declare `presentation` a partir de `describeMessageTool(...)` quando o canal puder
  renderizar ou degradar com segurança a apresentação semântica.
- Adicione `presentationCapabilities` ao adaptador de saída em runtime.
- Implemente `renderPresentation` no código de runtime, não no código de configuração do plugin
  do plano de controle.
- Mantenha bibliotecas de UI nativa fora de caminhos quentes de configuração/catálogo.
- Preserve limites de plataforma no renderizador e nos testes.
- Adicione testes de fallback para botões sem suporte, seleções, botões de URL, duplicação de título/texto
  e envios mistos de `message` mais `presentation`.
- Adicione suporte à fixação de entrega por meio de `deliveryCapabilities.pin` e
  `pinDeliveredMessage` somente quando o provedor puder fixar o id da mensagem enviada.
- Não exponha novos campos de cartão/bloco/componente/botão nativos de provedor por meio
  do esquema compartilhado de ação de mensagem.

## Documentos relacionados

- [CLI de Mensagens](/pt-BR/cli/message)
- [Visão Geral do Plugin SDK](/pt-BR/plugins/sdk-overview)
- [Arquitetura de Plugin](/pt-BR/plugins/architecture-internals#message-tool-schemas)
- [Plano de Refatoração de Apresentação de Canais](/pt-BR/plan/ui-channels)
