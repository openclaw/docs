---
read_when:
    - Adição ou modificação da renderização de cartões de mensagem, gráficos, tabelas, botões ou seletores
    - Criando um plugin de canal compatível com mensagens de saída avançadas
    - Alteração dos recursos de apresentação ou entrega da ferramenta de mensagens
    - Depuração de regressões de renderização de cartões/blocos/componentes específicas do provedor
summary: Cartões de mensagem semânticos, gráficos, tabelas, controles, texto alternativo e dicas de entrega para plugins de canal
title: Apresentação de mensagens
x-i18n:
    generated_at: "2026-07-12T15:24:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 400841f6fd1817350bffdfca15c7154bc98811fbe984056416d86d7fe990b5b5
    source_path: plugins/message-presentation.md
    workflow: 16
---

A apresentação de mensagens é o contrato compartilhado do OpenClaw para interfaces avançadas de chat de saída.
Ela permite que agentes, comandos da CLI, fluxos de aprovação e plugins descrevam a
intenção da mensagem uma única vez, enquanto cada plugin de canal renderiza o melhor formato nativo possível.

Use a apresentação para interfaces portáveis de mensagens: seções de texto, pequenos textos
de contexto/rodapé, divisores, gráficos, tabelas, botões, menus de seleção e título/tom de cartões.

Não adicione novos campos nativos de provedores, como `components` do Discord, `blocks`
do Slack, `buttons` do Telegram, `card` do Teams ou `card` do Feishu, à ferramenta
compartilhada de mensagens. Essas são saídas de renderização pertencentes ao plugin de canal.

## Contrato

Autores de plugins importam o contrato público de:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Estrutura:

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
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] }
  | {
      type: "chart";
      chartType: "pie";
      title: string;
      segments: Array<{ label: string; value: number }>;
    }
  | {
      type: "chart";
      chartType: "bar" | "area" | "line";
      title: string;
      categories: string[];
      series: Array<{ name: string; values: number[] }>;
      xLabel?: string;
      yLabel?: string;
    }
  | {
      type: "table";
      caption: string;
      headers: string[];
      rows: Array<Array<string | number>>;
      rowHeaderColumnIndex?: number;
    };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: "allow-once" | "allow-always" | "deny";
    }
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Valor legado de callback. Prefira action para novos controles. */
  value?: string;
  /** @deprecated Use uma action com type "url". */
  url?: string;
  /** @deprecated Use uma action com type "web-app". */
  webApp?: { url: string };
  /** @deprecated Use uma action com type "web-app". */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: Extract<MessagePresentationAction, { type: "command" | "callback" }>;
  /** Valor legado de callback. Prefira action para novos controles. */
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

- `action.type: "command"` executa um comando de barra nativo pelo fluxo de comandos
  do núcleo. Use isso para botões e menus de comandos integrados.
- `action.type: "callback"` transporta dados opacos do plugin pelo fluxo de
  interação do canal. Os plugins de canal não devem reinterpretar dados de callback como
  comandos de barra.
- `action.type: "approval"` identifica uma aprovação persistente do operador, seu
  tipo explícito `exec` ou `plugin` e a decisão solicitada. Os plugins de canal
  codificam essa ação em um callback privado do transporte e a resolvem pelo
  serviço de aprovação; eles não devem analisar o texto do comando `/approve` nem inferir
  o tipo pelo ID.
- `action.type: "url"` abre um link normal.
- `action.type: "web-app"` inicia um aplicativo web nativo do canal.
- `value` é o valor legado opaco de callback. Novos controles devem usar `action`
  para que os plugins de canal possam mapear comandos e callbacks sem fazer suposições com base no texto.
- `url`, `webApp` e `web_app` continuam aceitos como entradas obsoletas de limite.
  Os normalizadores preservam esses campos para que os renderizadores possam distinguir a semântica
  legada já distribuída das ações tipadas explícitas. Novos produtores devem usar `action`.
- `label` é obrigatório e também é usado no fallback de texto.
- `style` é indicativo. Os renderizadores devem mapear estilos sem suporte para um
  padrão seguro, sem causar falha no envio.
- `priority` é opcional. Quando um canal anuncia limites de ações e controles
  precisam ser descartados, o núcleo mantém primeiro os botões de maior prioridade e preserva
  a ordem original entre botões com a mesma prioridade. Quando todos os controles cabem, a
  ordem definida pelo autor é preservada.
- `disabled` é opcional. Os canais devem aderir explicitamente com `supportsDisabled`; caso contrário,
  o núcleo converte o controle desabilitado em texto de fallback não interativo. Um
  botão desabilitado sempre é renderizado apenas com o rótulo no texto de fallback, mesmo quando
  contém uma ação `command`.
- `reusable` é opcional. Canais compatíveis com callbacks nativos reutilizáveis podem
  manter a ação disponível após uma interação bem-sucedida. Use-o para
  ações repetíveis ou idempotentes, como atualizar, inspecionar ou exibir mais detalhes;
  deixe-o não definido para aprovações normais de uso único e ações destrutivas.

Semântica da seleção:

- `options[].action` aceita apenas `command` ou `callback`; ações de aprovação e link são exclusivas de botões.
- `options[].value` é o valor legado selecionado pelo aplicativo.
- `placeholder` é indicativo e pode ser ignorado por canais sem suporte nativo
  a seleções.
- Se um canal não oferecer suporte a seleções, o texto de fallback listará os rótulos.

Semântica dos gráficos:

- `pie` exige valores positivos de segmentos.
- `bar`, `area` e `line` usam um único array ordenado `categories`. Cada série
  fornece exatamente um valor finito por categoria, na mesma ordem.
- Os rótulos das categorias e os nomes das séries devem ser únicos. Blocos de gráfico
  inválidos ou incompletos são descartados durante a normalização, em vez de alterar silenciosamente os dados.
- A renderização nativa de gráficos exige adesão explícita por meio de `presentationCapabilities.charts`.
  Outros canais recebem o título do gráfico, os eixos, as categorias, as séries e os valores
  como texto determinístico. Esse também é o fallback de acessibilidade.

Semântica das tabelas:

- `caption` é um título curto obrigatório. `headers` deve conter pelo menos um
  rótulo de coluna único e não vazio.
- `rows` deve conter pelo menos uma linha. Cada linha deve ter exatamente uma célula por
  cabeçalho, e cada célula deve ser uma string não vazia ou um número finito.
- `rowHeaderColumnIndex` é um índice opcional baseado em zero que identifica a coluna
  cujas células devem ser expostas como cabeçalhos de linha pelos renderizadores nativos.
- A normalização de tabelas é atômica. Uma legenda, um cabeçalho, uma largura de linha, uma célula
  ou um índice de cabeçalho de linha inválido faz com que o bloco de tabela seja descartado, em vez de truncar ou corrigir
  seus dados.
- A renderização nativa de tabelas exige adesão explícita por meio de `presentationCapabilities.tables`.
  Outros canais recebem a legenda e cada linha como texto linear determinístico,
  com os espaços em branco internos reduzidos:

  ```text
  Pipeline aberto (tabela)
  - Conta: Acme; Etapa: Ganho; ARR: 125000
  - Conta: Globex; Etapa: Revisão; ARR: 82000
  ```

Não há um discriminador `report` separado. Componha um relatório usando blocos de `title`,
`tone`, `text`, `context`, `chart`, `table` e ações. Isso mantém cada
bloco renderizável de forma independente e fornece ao relatório completo o mesmo
fallback de texto determinístico.

## Exemplos de produtores

Cartão simples:

```json
{
  "title": "Aprovação de implantação",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "O Canary está pronto para ser promovido." },
    { "type": "context", "text": "Build 1234, homologação aprovada." },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "Aprovar",
          "action": { "type": "callback", "value": "deploy:approve" },
          "style": "success"
        },
        {
          "label": "Recusar",
          "action": { "type": "callback", "value": "deploy:decline" },
          "style": "danger"
        }
      ]
    }
  ]
}
```

Botão de link somente para URL:

```json
{
  "blocks": [
    { "type": "text", "text": "As notas da versão estão prontas." },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "Abrir notas",
          "action": { "type": "url", "url": "https://example.com/release" }
        }
      ]
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
      "buttons": [
        {
          "label": "Iniciar",
          "action": { "type": "web-app", "url": "https://example.com/app" }
        }
      ]
    }
  ]
}
```

Menu de seleção:

```json
{
  "title": "Escolha o ambiente",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Ambiente",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Produção", "value": "env:prod" }
      ]
    }
  ]
}
```

Gráfico:

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "line",
      "title": "Receita trimestral",
      "categories": ["T1", "T2", "T3"],
      "series": [
        { "name": "Produto", "values": [120, 145, 138] },
        { "name": "Serviços", "values": [80, 95, 104] }
      ],
      "xLabel": "Trimestre",
      "yLabel": "Receita"
    }
  ]
}
```

Relatório em tabela:

```json
{
  "title": "Relatório do pipeline",
  "tone": "info",
  "blocks": [
    { "type": "text", "text": "Oportunidades atuais por etapa." },
    {
      "type": "table",
      "caption": "Pipeline aberto",
      "headers": ["Conta", "Etapa", "ARR"],
      "rows": [
        ["Acme", "Ganho", 125000],
        ["Globex", "Revisão", 82000]
      ],
      "rowHeaderColumnIndex": 0
    },
    { "type": "context", "text": "Atualizado com base no snapshot do CRM." }
  ]
}
```

Envio pela CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Aprovação de implantação" \
  --presentation '{"title":"Aprovação de implantação","tone":"warning","blocks":[{"type":"text","text":"O Canary está pronto."},{"type":"buttons","buttons":[{"label":"Aprovar","value":"deploy:approve","style":"success"},{"label":"Recusar","value":"deploy:decline","style":"danger"}]}]}'
```

Entrega fixada:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Tópico aberto" \
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

Os plugins de canal declaram o suporte à renderização em seu adaptador de saída:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
    charts: false,
    tables: false,
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

Valores booleanos de capacidade descrevem o que o renderizador pode tornar interativo. Os
`limits` opcionais descrevem o envelope genérico que o núcleo pode adaptar antes de chamar o
renderizador:

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  charts?: boolean;
  tables?: boolean;
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

O núcleo aplica limites genéricos aos controles semânticos antes da renderização. Os renderizadores
ainda são responsáveis pela validação final específica do provedor e pelo truncamento da contagem
de blocos nativos, do tamanho dos cartões, dos limites de URL e das particularidades do provedor que
não podem ser expressas no contrato genérico. Se os limites removerem todos os controles de um bloco,
o núcleo mantém os rótulos como texto de contexto não interativo para que a mensagem entregue ainda
tenha uma alternativa visível.

## Fluxo de renderização do núcleo

No caminho canônico de saída usado pela CLI e pelas ações de mensagem padrão, o núcleo:

1. Normaliza a carga útil de apresentação.
2. Resolve o adaptador de saída do canal de destino.
3. Lê `presentationCapabilities`.
4. Aplica limites genéricos de recursos, como contagem de ações, comprimento dos rótulos e
   quantidade de opções de seleção, quando o adaptador os anuncia. Blocos de gráfico e tabela
   tornam-se texto determinístico, a menos que o adaptador anuncie explicitamente
   `charts: true` ou `tables: true`, respectivamente.
5. Chama `renderPresentation` quando o adaptador consegue renderizar a carga útil.
6. Usa texto conservador como alternativa quando o adaptador está ausente ou não consegue renderizar.
7. Envia a carga útil resultante pelo caminho normal de entrega do canal.
8. Aplica metadados de entrega, como `delivery.pin`, após a primeira mensagem
   enviada com sucesso.

Fluxos locais do canal de resposta ou visualização que consomem `ReplyPayload` diretamente
devem entrar nesse caminho canônico ou materializar a mesma alternativa de apresentação
antes de projetar a carga útil em texto simples/mídia.

O núcleo é responsável pelo comportamento alternativo para que os produtores permaneçam
independentes de canal. Os plugins de canal são responsáveis pela renderização nativa e pelo
tratamento de interações.

## Regras de degradação

A apresentação deve ser segura para envio em canais limitados.

O texto alternativo inclui:

- `title` como a primeira linha
- blocos `text` como parágrafos normais
- blocos `context` como linhas de contexto compactas
- blocos `divider` como um separador visual
- rótulos de botões, incluindo URLs para botões de link
- rótulos de opções de seleção
- título, tipo, eixos, categorias, séries e valores do gráfico
- legenda, cabeçalhos e todos os valores das linhas da tabela

### Visibilidade do valor de fallback do botão

Quando um canal não consegue renderizar controles interativos, os valores de botões e seleções são convertidos em texto simples. Esse comportamento alternativo preserva a usabilidade e mantém privados os dados opacos de retorno de chamada:

- **Ações tipadas como `command`** são renderizadas como `label: \`command\`` so users can
  copy the command and run it manually in the channel input.
- **`callback`-typed actions** and legacy **`value`** fields render as
  label-only. The opaque callback value is not exposed in fallback text.
- **`approval`-typed actions** render label-only. Approval IDs and decisions are
  transport data and are not exposed through generic scalar helpers or fallback
  text.
- **`url` / `web-app` actions** and deprecated **`url` / `webApp` / `web_app`**
  As entradas exibem o texto da URL ao lado do rótulo do botão, pois a URL é
  visível para o usuário.
- **Opções de seleção** são exibidas somente como rótulo. O valor subjacente da opção não é
  exposto no texto de fallback.

Os adaptadores de canal que adicionam orientações sobre comandos manuais em sua interface de fallback (por exemplo,
instruções para comentários em documentos do Feishu) devem verificar a presença do comando
com base nos mesmos blocos de apresentação usados pelo renderizador de fallback, para que o
texto de orientação apareça somente quando um comando manual for realmente exibido.

Controles nativos não compatíveis devem ter uma degradação funcional, em vez de fazer com que todo o envio falhe.
Exemplos:

- O Telegram, com os botões embutidos desativados, envia uma alternativa em texto.
- Um canal sem suporte a seleção lista as opções de seleção como texto.
- Um canal sem suporte nativo a gráficos lista os dados do gráfico como texto.
- Um canal sem suporte nativo a tabelas lista cada linha da tabela como texto.
- Um botão que contém apenas uma URL torna-se um botão de link nativo ou uma linha de URL alternativa.
- Falhas opcionais ao fixar não fazem com que a mensagem entregue falhe.

A principal exceção é `delivery.pin.required: true`; se a fixação for solicitada como
obrigatória e o canal não puder fixar a mensagem enviada, a entrega relatará falha.

## Mapeamento de provedores

Renderizadores incluídos atualmente:

| Canal           | Destino de renderização nativo                          | Observações                                                                                                                                                                                                                                                                            |
| --------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Componentes e contêineres de componentes                | Preserva `channelData.discord.components` legado para produtores de payloads nativos do provedor existentes, mas novos envios compartilhados devem usar `presentation`.                                                                                                                |
| Feishu          | Cartões interativos                                     | O cabeçalho do cartão pode usar `title`; o corpo evita duplicar esse título.                                                                                                                                                                                                           |
| Matrix          | Fallback de texto mais campo de evento estruturado      | Botões/seleções são anunciados como compatíveis, mas atualmente cada bloco é renderizado como saída de `renderMessagePresentationFallbackText` transportada em um campo de evento `com.openclaw.presentation`, e não como widgets interativos nativos.                                    |
| Mattermost      | Texto mais propriedades interativas                     | Seleções e divisores não são compatíveis; esses blocos são convertidos em texto.                                                                                                                                                                                                       |
| Microsoft Teams | Adaptive Cards                                          | O texto simples de `message` é incluído com o cartão quando ambos são fornecidos. Seleções, estilos e estado desabilitado não são compatíveis.                                                                                                                                          |
| Slack           | Block Kit                                               | Renderiza `chart` como `data_visualization` nativo e `table` como `data_table` nativo; preserva `channelData.slack.blocks` legado, mas novos envios compartilhados devem usar `presentation`.                                                                                            |
| Telegram        | Texto mais teclados em linha                            | Botões/seleções exigem compatibilidade com botões em linha na superfície de destino; caso contrário, é usado o fallback de texto.                                                                                                                                                       |
| Canais simples  | Fallback de texto                                       | Canais sem renderizador ainda recebem uma saída legível.                                                                                                                                                                                                                               |

A compatibilidade com payloads nativos do provedor é um recurso de transição para produtores
de respostas existentes. Ela não é motivo para adicionar novos campos nativos compartilhados.

## Presentation versus InteractiveReply

`InteractiveReply` é o subconjunto interno mais antigo usado por auxiliares de
aprovação e interação. Ele oferece compatibilidade com:

- texto
- botões
- seleções

`MessagePresentation` é o contrato canônico de envio compartilhado. Ele adiciona:

- título
- tom
- contexto
- divisor
- gráfico
- tabela
- botões somente de URL
- metadados genéricos de entrega por meio de `ReplyPayload.delivery`

Use os auxiliares de `openclaw/plugin-sdk/interactive-runtime` ao integrar código
mais antigo:
__OC_I18N_900014__
O código novo deve aceitar ou produzir `MessagePresentation` diretamente. Os
payloads `interactive` existentes são um subconjunto obsoleto de `presentation`;
a compatibilidade no runtime permanece para produtores mais antigos.

Auxiliares não obsoletos que vale a pena conhecer:

- `normalizeMessagePresentation(raw)` / `hasMessagePresentationBlocks(value)`
  validam e convertem um payload sem tipagem (por exemplo, JSON do sinalizador
  `--presentation` da CLI) em `MessagePresentation`.
- `isMessagePresentationInteractiveBlock(block)` restringe um bloco à união
  `buttons` | `select`.
- `resolveMessagePresentationButtonAction(button)` e
  `resolveMessagePresentationOptionAction(option)` retornam a ação tipada
  canônica enquanto aceitam campos de limite obsoletos. Uma `action` explícita
  sempre prevalece.
- `resolveMessagePresentationActionValue(action)` /
  `resolveMessagePresentationControlValue(control)` leem apenas valores
  escalares de comando/callback. Uma ação canônica não escalar nunca recorre a
  um `value` de sombra legado, portanto IDs de aprovação e destinos de links
  permanecem tipados.
- `renderMessagePresentationChartFallbackText(block)` /
  `renderMessagePresentationTableFallbackText(block)` renderizam um bloco de
  dados estruturados como texto determinístico para caminhos de fallback
  específicos do canal.

Os tipos `InteractiveReply*` legados e os auxiliares de conversão estão marcados
como `@deprecated` no SDK:

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
`presentationToInteractiveControlsReply(...)` continuam disponíveis como
pontes de renderização para implementações de canais legadas. Novo código
produtor não deve chamá-los; envie `presentation` e permita que a adaptação do
núcleo/canal cuide da renderização.

Os auxiliares de aprovação também têm substitutos que priorizam apresentações:

- use `buildApprovalPresentationFromActionDescriptors(...)` em vez de
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- use `buildApprovalPresentation(...)` em vez de
  `buildApprovalInteractiveReply(...)`
- use `buildExecApprovalPresentation(...)` em vez de
  `buildExecApprovalInteractiveReply(...)`

Esses construtores distribuídos continuam baseados em comandos para manter a
compatibilidade com plugins. O código do Gateway e dos canais incluídos que
controla um tipo de aprovação durável deve usar
`buildTypedApprovalPresentation(...)`,
`buildTypedExecApprovalPendingReplyPayload(...)` ou
`buildTypedPluginApprovalPendingReplyPayload(...)` para que os transportes
recebam uma ação `approval` explícita em vez de inferir a semântica do texto
`/approve`.

`renderMessagePresentationFallbackText(...)` retorna uma string vazia para
blocos de apresentação que não têm fallback de texto, como uma apresentação
apenas com divisor. Transportes que exigem um corpo de envio não vazio podem
fornecer `emptyFallback` para optar por um corpo mínimo sem alterar o contrato
padrão de fallback.

## Fixação de entrega

Fixar é um comportamento de entrega, não de apresentação. Use `delivery.pin` em vez de
campos nativos do provedor, como `channelData.telegram.pin`.

Semântica:

- `pin: true` fixa a primeira mensagem entregue com sucesso.
- `pin.notify` usa `false` como padrão.
- `pin.required` usa `false` como padrão.
- Falhas opcionais ao fixar degradam graciosamente e mantêm intacta a mensagem enviada.
- Falhas obrigatórias ao fixar causam falha na entrega.
- Mensagens divididas em partes fixam a primeira parte entregue, não a última.

As ações de mensagem manuais `pin`, `unpin` e `pins` continuam disponíveis para mensagens
existentes quando o provedor oferece suporte a essas operações.

## Lista de verificação para autores de Plugins

- Declare `presentation` em `describeMessageTool(...)` quando o canal puder
  renderizar ou degradar com segurança a apresentação semântica.
- Adicione `presentationCapabilities` ao adaptador de saída do runtime.
- Implemente `renderPresentation` no código do runtime, não no código de
  configuração do Plugin no plano de controle.
- Mantenha bibliotecas de interface nativas fora dos caminhos críticos de configuração/catálogo.
- Declare limites genéricos de capacidade em `presentationCapabilities.limits` quando
  forem conhecidos.
- Preserve os limites finais da plataforma no renderizador e nos testes.
- Adicione testes de fallback para gráficos, tabelas, botões, seletores e botões
  de URL não compatíveis, duplicação de título/texto e envios combinados de
  `message` com `presentation`.
- Adicione suporte à fixação na entrega por meio de `deliveryCapabilities.pin` e
  `pinDeliveredMessage` somente quando o provedor puder fixar o ID da mensagem enviada.
- Não exponha novos campos de cartão/bloco/componente/botão nativos do provedor
  por meio do esquema compartilhado de ações de mensagem.

## Documentação relacionada

- [CLI de mensagens](/pt-BR/cli/message)
- [Visão geral do SDK de Plugins](/pt-BR/plugins/sdk-overview)
- [Arquitetura de Plugins](/pt-BR/plugins/architecture-internals#message-tool-schemas)
- [Plano de refatoração da apresentação de canais](/pt-BR/plan/ui-channels)
