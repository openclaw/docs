---
read_when:
    - Adição ou modificação da renderização de cartões de mensagem, botões ou seleções
    - Criando um Plugin de canal compatível com mensagens de saída enriquecidas
    - Alterando a apresentação da ferramenta de mensagens ou os recursos de entrega
    - Depurando regressões de renderização de cartões/blocos/componentes específicas de provedor
summary: Cartões de mensagem semânticos, botões, seleções, texto de fallback e dicas de entrega para plugins de canal
title: Apresentação de mensagens
x-i18n:
    generated_at: "2026-06-27T17:49:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fc5eca9dfe637fbdd56dcb473a68540035f8b990eab8cf139a4e27711536f57
    source_path: plugins/message-presentation.md
    workflow: 16
---

A apresentação de mensagens é o contrato compartilhado do OpenClaw para UI rica de chat de saída.
Ela permite que agentes, comandos da CLI, fluxos de aprovação e plugins descrevam a intenção da
mensagem uma vez, enquanto cada Plugin de canal renderiza o melhor formato nativo possível.

Use apresentação para UI de mensagens portátil:

- seções de texto
- pequeno texto de contexto/rodapé
- divisores
- botões
- menus de seleção
- título e tom do cartão

Não adicione novos campos nativos de provedor, como `components` do Discord, `blocks` do Slack,
`buttons` do Telegram, `card` do Teams ou `card` do Feishu, à ferramenta de mensagem
compartilhada. Esses são resultados de renderização pertencentes ao Plugin de canal.

## Contrato

Autores de plugins importam o contrato público de:

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

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
  url?: string;
  webApp?: { url: string };
  /** @deprecated Use webApp. Accepted for legacy JSON payloads only. */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
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

- `action.type: "command"` executa um comando de barra nativo pelo caminho de
  comandos do core. Use isso para botões e menus de comandos integrados.
- `action.type: "callback"` carrega dados opacos do plugin pelo caminho de
  interação do canal. Plugins de canal não devem reinterpretar dados de callback como comandos
  de barra.
- `value` é o valor de callback opaco legado. Novos controles devem usar `action`
  para que plugins de canal possam mapear comandos e callbacks sem adivinhar pelo texto.
- `url` é um botão de link. Ele pode existir sem `value`.
- `webApp` descreve um botão de aplicativo web nativo do canal. O Telegram renderiza isso
  como `web_app` e só oferece suporte em chats privados. `web_app` ainda é
  aceito em payloads JSON flexíveis por compatibilidade, mas produtores TypeScript
  devem usar `webApp`.
- `label` é obrigatório e também é usado no fallback de texto.
- `style` é consultivo. Renderizadores devem mapear estilos sem suporte para um padrão
  seguro, não falhar no envio.
- `priority` é opcional. Quando um canal anuncia limites de ações e controles
  precisam ser descartados, o core mantém primeiro os botões de maior prioridade e preserva
  a ordem original entre botões de mesma prioridade. Quando todos os controles cabem, a
  ordem criada é preservada.
- `disabled` é opcional. Canais devem aderir explicitamente com `supportsDisabled`; caso contrário,
  o core degrada o controle desabilitado para texto de fallback não interativo.
- `reusable` é opcional. Canais que oferecem suporte a callbacks nativos reutilizáveis podem
  manter a ação disponível após uma interação bem-sucedida. Use para ações
  repetíveis ou idempotentes, como atualizar, inspecionar ou ver mais detalhes;
  deixe sem definir para aprovações normais de uso único e ações destrutivas.

Semântica de seleção:

- `options[].action` tem o mesmo significado de comando/callback que `action` de botão.
- `options[].value` é o valor de aplicação selecionado legado.
- `placeholder` é consultivo e pode ser ignorado por canais sem suporte nativo
  a seleção.
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

Botão de Mini App do Telegram:

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [{ "label": "Launch", "web_app": { "url": "https://example.com/app" } }]
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
    limits: {
      actions: {
        maxActions: 25,
        maxActionsPerRow: 5,
        maxRows: 5,
        maxLabelLength: 80,
        maxValueBytes: 100,
        supportsStyles: true,
        supportsDisabled: false,
      },
      selects: {
        maxOptions: 25,
        maxLabelLength: 100,
        maxValueBytes: 100,
      },
      text: {
        maxLength: 2000,
        encoding: "characters",
        markdownDialect: "discord-markdown",
      },
    },
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

Booleanos de capacidade descrevem o que o renderizador pode tornar interativo. `limits`
opcionais descrevem o envelope genérico que o núcleo pode adaptar antes de chamar o
renderizador:

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
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
```

O núcleo aplica limites genéricos a controles semânticos antes da renderização. Os renderizadores
ainda são responsáveis pela validação final específica do provedor e pelo recorte para contagem
de blocos nativos, tamanho de cartão, limites de URL e particularidades de provedores que não
podem ser expressas no contrato genérico. Se os limites removerem todos os controles de um bloco,
o núcleo mantém os rótulos como texto de contexto não interativo para que a mensagem entregue
ainda tenha uma alternativa visível.

## Fluxo de renderização do núcleo

Quando um `ReplyPayload` ou uma ação de mensagem inclui `presentation`, o núcleo:

1. Normaliza o payload de apresentação.
2. Resolve o adaptador de saída do canal de destino.
3. Lê `presentationCapabilities`.
4. Aplica limites genéricos de capacidade, como contagem de ações, comprimento de rótulo e
   contagem de opções de seleção, quando o adaptador os anuncia.
5. Chama `renderPresentation` quando o adaptador consegue renderizar o payload.
6. Recorre a texto conservador quando o adaptador está ausente ou não consegue renderizar.
7. Envia o payload resultante pelo caminho normal de entrega do canal.
8. Aplica metadados de entrega, como `delivery.pin`, após a primeira mensagem enviada com
   sucesso.

O núcleo é responsável pelo comportamento de fallback para que produtores possam permanecer
agnósticos ao canal. Plugins de canal são responsáveis pela renderização nativa e pelo tratamento
de interações.

## Regras de degradação

A apresentação deve ser segura para enviar em canais limitados.

O texto de fallback inclui:

- `title` como a primeira linha
- blocos `text` como parágrafos normais
- blocos `context` como linhas de contexto compactas
- blocos `divider` como separador visual
- rótulos de botões, incluindo URLs para botões de link
- rótulos de opções de seleção

Controles nativos sem suporte devem degradar em vez de falhar o envio inteiro.
Exemplos:

- Telegram com botões inline desativados envia fallback de texto.
- Um canal sem suporte a seleção lista as opções de seleção como texto.
- Um botão somente URL se torna um botão de link nativo ou uma linha de URL de fallback.
- Falhas opcionais ao fixar não fazem a mensagem entregue falhar.

A principal exceção é `delivery.pin.required: true`; se a fixação for solicitada como
obrigatória e o canal não conseguir fixar a mensagem enviada, a entrega reporta falha.

## Mapeamento de provedores

Renderizadores atualmente incluídos:

| Canal           | Destino de renderização nativo           | Observações                                                                                                                                                     |
| --------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Componentes e contêineres de componentes | Preserva `channelData.discord.components` legado para produtores existentes de payloads nativos do provedor, mas novos envios compartilhados devem usar `presentation`. |
| Slack           | Block Kit                                | Preserva `channelData.slack.blocks` legado para produtores existentes de payloads nativos do provedor, mas novos envios compartilhados devem usar `presentation`.       |
| Telegram        | Texto mais teclados inline               | Botões/seleções exigem capacidade de botão inline para a superfície de destino; caso contrário, o fallback de texto é usado.                                      |
| Mattermost      | Texto mais propriedades interativas      | Outros blocos degradam para texto.                                                                                                                              |
| Microsoft Teams | Adaptive Cards                           | O texto simples de `message` é incluído com o cartão quando ambos são fornecidos.                                                                                 |
| Feishu          | Cartões interativos                      | O cabeçalho do cartão pode usar `title`; o corpo evita duplicar esse título.                                                                                     |
| Canais simples  | Fallback de texto                        | Canais sem renderizador ainda recebem saída legível.                                                                                                             |

A compatibilidade de payloads nativos do provedor é uma facilidade de transição para produtores de respostas existentes. Ela não é motivo para adicionar novos campos nativos compartilhados.

## Apresentação vs InteractiveReply

`InteractiveReply` é o subconjunto interno mais antigo usado por auxiliares de aprovação e interação. Ele oferece suporte a:

- texto
- botões
- seleções

`MessagePresentation` é o contrato canônico compartilhado de envio. Ele adiciona:

- título
- tom
- contexto
- divisor
- botões somente de URL
- metadados genéricos de entrega por meio de `ReplyPayload.delivery`

Use os auxiliares de `openclaw/plugin-sdk/interactive-runtime` ao fazer a ponte com código mais antigo:

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Código novo deve aceitar ou produzir `MessagePresentation` diretamente. Payloads `interactive` existentes são um subconjunto obsoleto de `presentation`; o suporte em runtime permanece para produtores mais antigos.

Os tipos legados `InteractiveReply*` e os auxiliares de conversão estão marcados como `@deprecated` no SDK:

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock` e
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` e
`presentationToInteractiveControlsReply(...)` continuam disponíveis como pontes de renderização para implementações legadas de canais. Código novo de produtores não deve chamá-los; envie `presentation` e deixe a adaptação do núcleo/canal cuidar da renderização.

Os auxiliares de aprovação também têm substitutos que priorizam apresentação:

- use `buildApprovalPresentationFromActionDescriptors(...)` em vez de
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- use `buildApprovalPresentation(...)` em vez de
  `buildApprovalInteractiveReply(...)`
- use `buildExecApprovalPresentation(...)` em vez de
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` retorna uma string vazia para blocos de apresentação que não têm fallback de texto, como uma apresentação somente com divisor. Transportes que exigem um corpo de envio não vazio podem passar `emptyFallback` para optar por um corpo mínimo sem alterar o contrato padrão de fallback.

## Fixação de entrega

Fixar é um comportamento de entrega, não de apresentação. Use `delivery.pin` em vez de campos nativos do provedor, como `channelData.telegram.pin`.

Semântica:

- `pin: true` fixa a primeira mensagem entregue com sucesso.
- `pin.notify` assume `false` por padrão.
- `pin.required` assume `false` por padrão.
- Falhas opcionais de fixação degradam e deixam a mensagem enviada intacta.
- Falhas obrigatórias de fixação fazem a entrega falhar.
- Mensagens fragmentadas fixam o primeiro fragmento entregue, não o fragmento final.

As ações manuais de mensagem `pin`, `unpin` e `pins` ainda existem para mensagens existentes quando o provedor oferece suporte a essas operações.

## Checklist do autor de Plugin

- Declare `presentation` em `describeMessageTool(...)` quando o canal puder renderizar ou degradar com segurança a apresentação semântica.
- Adicione `presentationCapabilities` ao adaptador de saída do runtime.
- Implemente `renderPresentation` no código de runtime, não no código de configuração de Plugin do plano de controle.
- Mantenha bibliotecas de UI nativa fora dos caminhos críticos de configuração/catálogo.
- Declare limites de capacidade genéricos em `presentationCapabilities.limits` quando eles forem conhecidos.
- Preserve os limites finais da plataforma no renderizador e nos testes.
- Adicione testes de fallback para botões sem suporte, seleções, botões de URL, duplicação de título/texto e envios mistos de `message` mais `presentation`.
- Adicione suporte a fixação de entrega por meio de `deliveryCapabilities.pin` e
  `pinDeliveredMessage` somente quando o provedor puder fixar o id da mensagem enviada.
- Não exponha novos campos de cartão/bloco/componente/botão nativos do provedor por meio do esquema compartilhado de ações de mensagem.

## Documentação relacionada

- [CLI de mensagens](/pt-BR/cli/message)
- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)
- [Arquitetura de Plugin](/pt-BR/plugins/architecture-internals#message-tool-schemas)
- [Plano de refatoração de apresentação de canais](/pt-BR/plan/ui-channels)
