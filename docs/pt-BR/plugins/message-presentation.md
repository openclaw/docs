---
read_when:
    - Adicionando ou modificando a renderização de cartões de mensagem, botões ou seleções
    - Criando um Plugin de canal que oferece suporte a mensagens de saída avançadas
    - Alterando a apresentação da ferramenta de mensagens ou os recursos de entrega
    - Depuração de regressões de renderização de cartões/blocos/componentes específicas de provedor
summary: Cartões de mensagem semânticos, botões, seleções, texto de fallback e dicas de entrega para plugins de canal
title: Apresentação de mensagens
x-i18n:
    generated_at: "2026-07-02T22:25:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5acb03b2aabcfefe4935440a3f799876afb3e9ee8c166704987f93f3667e68dd
    source_path: plugins/message-presentation.md
    workflow: 16
---

A apresentação de mensagens é o contrato compartilhado do OpenClaw para interfaces avançadas de chat de saída.
Ela permite que agentes, comandos da CLI, fluxos de aprovação e plugins descrevam a intenção da mensagem
uma vez, enquanto cada plugin de canal renderiza a melhor forma nativa possível.

Use apresentação para interfaces portáveis de mensagem:

- seções de texto
- pequeno texto de contexto/rodapé
- divisores
- botões
- menus de seleção
- título e tom do cartão

Não adicione novos campos nativos de provedor, como Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` ou Feishu `card`, à ferramenta
compartilhada de mensagens. Esses são resultados de renderização pertencentes ao plugin de canal.

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
  comandos do núcleo. Use isso para botões e menus de comandos integrados.
- `action.type: "callback"` transporta dados opacos do plugin pelo caminho de
  interação do canal. Plugins de canal não devem reinterpretar dados de callback como
  comandos de barra.
- `value` é o valor opaco de callback legado. Novos controles devem usar `action`
  para que plugins de canal possam mapear comandos e callbacks sem inferir pelo texto.
- `url` é um botão de link. Ele pode existir sem `value`.
- `webApp` descreve um botão de aplicativo web nativo do canal. O Telegram renderiza isso
  como `web_app` e oferece suporte apenas em chats privados. `web_app` ainda é
  aceito em payloads JSON flexíveis por compatibilidade, mas produtores TypeScript
  devem usar `webApp`.
- `label` é obrigatório e também é usado no fallback de texto.
- `style` é consultivo. Renderizadores devem mapear estilos sem suporte para um padrão
  seguro, sem falhar o envio.
- `priority` é opcional. Quando um canal anuncia limites de ação e controles
  precisam ser removidos, o núcleo mantém primeiro os botões de maior prioridade e preserva
  a ordem original entre botões de prioridade igual. Quando todos os controles cabem, a ordem
  definida pelo autor é preservada.
- `disabled` é opcional. Canais devem optar explicitamente com `supportsDisabled`; caso contrário,
  o núcleo degrada o controle desativado para texto de fallback não interativo.
- `reusable` é opcional. Canais que oferecem suporte a callbacks nativos reutilizáveis podem
  manter a ação disponível após uma interação bem-sucedida. Use para ações
  repetíveis ou idempotentes, como atualizar, inspecionar ou ver mais detalhes;
  deixe indefinido para aprovações normais de uso único e ações destrutivas.

Semântica de seleção:

- `options[].action` tem o mesmo significado de comando/callback que `action` de botão.
- `options[].value` é o valor legado da aplicação selecionada.
- `placeholder` é consultivo e pode ser ignorado por canais sem suporte nativo
  a seleção.
- Se um canal não oferece suporte a seleções, o texto de fallback lista os rótulos.

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

Booleanos de capacidade descrevem o que o renderizador consegue tornar interativo. `limits`
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

O núcleo aplica limites genéricos a controles semânticos antes da renderização. Renderizadores
ainda são responsáveis pela validação final específica do provedor e por cortes de contagem
nativa de blocos, tamanho de cartão, limites de URL e peculiaridades do provedor que não podem ser expressas no
contrato genérico. Se os limites removerem todos os controles de um bloco, o núcleo mantém
os rótulos como texto de contexto não interativo para que a mensagem entregue ainda tenha um
fallback visível.

## Fluxo de renderização do núcleo

Quando um `ReplyPayload` ou ação de mensagem inclui `presentation`, o núcleo:

1. Normaliza o payload de apresentação.
2. Resolve o adaptador de saída do canal de destino.
3. Lê `presentationCapabilities`.
4. Aplica limites genéricos de capacidade, como contagem de ações, comprimento de rótulo e
   contagem de opções de seleção quando o adaptador os anuncia.
5. Chama `renderPresentation` quando o adaptador consegue renderizar o payload.
6. Faz fallback para texto conservador quando o adaptador está ausente ou não consegue renderizar.
7. Envia o payload resultante pelo caminho normal de entrega do canal.
8. Aplica metadados de entrega, como `delivery.pin`, após a primeira mensagem
   enviada com sucesso.

O núcleo é responsável pelo comportamento de fallback para que produtores possam permanecer agnósticos ao canal. Plugins de canal
são responsáveis pela renderização nativa e pelo tratamento de interações.

## Regras de degradação

A apresentação deve ser segura para enviar em canais limitados.

O texto de fallback inclui:

- `title` como a primeira linha
- blocos `text` como parágrafos normais
- blocos `context` como linhas compactas de contexto
- blocos `divider` como separador visual
- rótulos de botões, incluindo URLs para botões de link
- rótulos de opções de seleção

### Visibilidade de fallback de valores de botão

Quando um canal não consegue renderizar controles interativos, valores de botões e seleções
fazem fallback para texto simples. O comportamento de fallback preserva a usabilidade enquanto
mantém privados os dados opacos de callback:

- Ações tipadas como **`command`** são renderizadas como `label: \`command\`` para que usuários possam
  copiar o comando e executá-lo manualmente na entrada do canal.
- Ações tipadas como **`callback`** e campos legados **`value`** são renderizados como
  apenas rótulo. O valor opaco de callback não é exposto no texto de fallback.
- Botões **`url` / `webApp`** renderizam o texto da URL junto com o
  rótulo do botão, já que a URL é voltada ao usuário.
- **Opções de seleção** são renderizadas apenas como rótulo. O valor de opção subjacente não é
  exposto no texto de fallback.

Adaptadores de canal que adicionam orientação de comando manual em sua UI de fallback (por exemplo,
instruções de comentário de documento do Feishu) devem derivar a verificação de presença de comando
dos mesmos blocos de apresentação que o renderizador de fallback usa, para que o
texto de orientação só apareça quando um comando manual é realmente mostrado.

Controles nativos sem suporte devem ser degradados em vez de fazer o envio inteiro falhar.
Exemplos:

- Telegram com botões inline desativados envia fallback de texto.
- Um canal sem suporte a seleção lista opções de seleção como texto.
- Um botão somente URL se torna um botão de link nativo ou uma linha de URL de fallback.
- Falhas opcionais de fixação não fazem a mensagem entregue falhar.

A principal exceção é `delivery.pin.required: true`; se a fixação for solicitada como
obrigatória e o canal não conseguir fixar a mensagem enviada, a entrega reporta falha.

## Mapeamento de provedores

Renderizadores integrados atuais:

| Canal           | Destino de renderização nativo      | Observações                                                                                                                                                   |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Componentes e contêineres de componentes | Preserva `channelData.discord.components` legado para produtores de payloads nativos de provedor existentes, mas novos envios compartilhados devem usar `presentation`. |
| Slack           | Block Kit                           | Preserva `channelData.slack.blocks` legado para produtores de payloads nativos de provedor existentes, mas novos envios compartilhados devem usar `presentation`.       |
| Telegram        | Texto mais teclados inline          | Botões/seletores exigem capacidade de botão inline para a superfície de destino; caso contrário, o fallback de texto é usado.                                         |
| Mattermost      | Texto mais props interativas        | Outros blocos degradam para texto.                                                                                                                            |
| Microsoft Teams | Adaptive Cards                      | O texto simples de `message` é incluído com o cartão quando ambos são fornecidos.                                                                              |
| Feishu          | Cartões interativos                 | O cabeçalho do cartão pode usar `title`; o corpo evita duplicar esse título.                                                                                   |
| Canais simples  | Fallback de texto                   | Canais sem renderizador ainda recebem uma saída legível.                                                                                                       |

A compatibilidade com payloads nativos de provedor é um recurso de transição para produtores de
respostas existentes. Ela não é motivo para adicionar novos campos nativos compartilhados.

## Presentation vs InteractiveReply

`InteractiveReply` é o subconjunto interno mais antigo usado por auxiliares de aprovação e interação.
Ele oferece suporte a:

- texto
- botões
- seletores

`MessagePresentation` é o contrato canônico de envio compartilhado. Ele adiciona:

- título
- tom
- contexto
- divisor
- botões somente de URL
- metadados genéricos de entrega por meio de `ReplyPayload.delivery`

Use auxiliares de `openclaw/plugin-sdk/interactive-runtime` ao fazer a ponte com código mais antigo:
__OC_I18N_900011__
Código novo deve aceitar ou produzir `MessagePresentation` diretamente. Payloads
`interactive` existentes são um subconjunto obsoleto de `presentation`; o suporte
em runtime permanece para produtores mais antigos.

Os tipos `InteractiveReply*` legados e auxiliares de conversão estão marcados como
`@deprecated` no SDK:

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
`presentationToInteractiveControlsReply(...)` continuam disponíveis como pontes de renderizador
para implementações legadas de canal. Código novo de produtor não deve chamá-los;
envie `presentation` e deixe a adaptação do core/canal cuidar da renderização.

Os auxiliares de aprovação também têm substitutos que priorizam presentation:

- use `buildApprovalPresentationFromActionDescriptors(...)` em vez de
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- use `buildApprovalPresentation(...)` em vez de
  `buildApprovalInteractiveReply(...)`
- use `buildExecApprovalPresentation(...)` em vez de
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` retorna uma string vazia para blocos de
presentation que não têm fallback de texto, como uma presentation contendo apenas divisor.
Transportes que exigem um corpo de envio não vazio podem passar
`emptyFallback` para optar por um corpo mínimo sem alterar o contrato padrão de fallback.

## Fixação de entrega

Fixar é comportamento de entrega, não presentation. Use `delivery.pin` em vez de
campos nativos de provedor como `channelData.telegram.pin`.

Semântica:

- `pin: true` fixa a primeira mensagem entregue com sucesso.
- `pin.notify` usa `false` como padrão.
- `pin.required` usa `false` como padrão.
- Falhas opcionais de fixação degradam e deixam a mensagem enviada intacta.
- Falhas obrigatórias de fixação fazem a entrega falhar.
- Mensagens em chunks fixam o primeiro chunk entregue, não o chunk final.

As ações manuais de mensagem `pin`, `unpin` e `pins` ainda existem para mensagens
existentes em que o provedor oferece suporte a essas operações.

## Checklist de autor de Plugin

- Declare `presentation` a partir de `describeMessageTool(...)` quando o canal puder
  renderizar ou degradar com segurança a apresentação semântica.
- Adicione `presentationCapabilities` ao adaptador de saída do runtime.
- Implemente `renderPresentation` no código de runtime, não no código de configuração
  de Plugin do plano de controle.
- Mantenha bibliotecas de UI nativas fora dos caminhos quentes de setup/catálogo.
- Declare limites genéricos de capacidade em `presentationCapabilities.limits` quando
  eles forem conhecidos.
- Preserve os limites finais da plataforma no renderizador e nos testes.
- Adicione testes de fallback para botões sem suporte, seletores, botões de URL, duplicação
  de título/texto e envios mistos de `message` mais `presentation`.
- Adicione suporte a fixação de entrega por meio de `deliveryCapabilities.pin` e
  `pinDeliveredMessage` somente quando o provedor puder fixar o id da mensagem enviada.
- Não exponha novos campos nativos de provedor de cartão/bloco/componente/botão por meio
  do schema compartilhado de ação de mensagem.

## Docs relacionados

- [CLI de mensagem](/pt-BR/cli/message)
- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)
- [Arquitetura de Plugin](/pt-BR/plugins/architecture-internals#message-tool-schemas)
- [Plano de refatoração de apresentação de canais](/pt-BR/plan/ui-channels)
