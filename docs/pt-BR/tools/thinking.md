---
read_when:
    - Ajustar a análise sintática ou os padrões das diretivas thinking, fast-mode ou verbose
summary: Sintaxe de diretivas para /think, /fast, /verbose, /trace e visibilidade do raciocínio
title: Níveis de raciocínio
x-i18n:
    generated_at: "2026-05-05T01:50:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2282c9eccda4693680bbfbfc42de508021f4472b00d40a1a8c1bc19a4516012
    source_path: tools/thinking.md
    workflow: 16
---

## O que faz

- Diretiva inline em qualquer corpo recebido: `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Níveis (aliases): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “pensar”
  - low → “pensar muito”
  - medium → “pensar ainda mais”
  - high → “ultrathink” (orçamento máximo)
  - xhigh → “ultrathink+” (modelos GPT-5.2+ e Codex, além do esforço do Anthropic Claude Opus 4.7)
  - adaptive → pensamento adaptativo gerenciado pelo provedor (compatível com Claude 4.6 na Anthropic/Bedrock, Anthropic Claude Opus 4.7 e pensamento dinâmico do Google Gemini)
  - max → raciocínio máximo do provedor (Anthropic Claude Opus 4.7; Ollama mapeia isso para seu maior esforço nativo de `think`)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` mapeiam para `xhigh`.
  - `highest` mapeia para `high`.
- Observações sobre provedores:
  - Menus e seletores de pensamento são orientados por perfil de provedor. Plugins de provedor declaram o conjunto exato de níveis para o modelo selecionado, incluindo rótulos como o binário `on`.
  - `adaptive`, `xhigh` e `max` só são anunciados para perfis de provedor/modelo compatíveis. Diretivas digitadas para níveis não compatíveis são rejeitadas com as opções válidas desse modelo.
  - Níveis armazenados existentes que não são compatíveis são remapeados pela classificação do perfil do provedor. `adaptive` volta para `medium` em modelos não adaptativos, enquanto `xhigh` e `max` voltam para o maior nível não `off` compatível com o modelo selecionado.
  - Modelos Anthropic Claude 4.6 usam `adaptive` por padrão quando nenhum nível explícito de pensamento está definido.
  - Anthropic Claude Opus 4.7 não usa pensamento adaptativo por padrão. O padrão de esforço da API continua pertencendo ao provedor, a menos que você defina explicitamente um nível de pensamento.
  - Anthropic Claude Opus 4.7 mapeia `/think xhigh` para pensamento adaptativo mais `output_config.effort: "xhigh"`, porque `/think` é uma diretiva de pensamento e `xhigh` é a configuração de esforço do Opus 4.7.
  - Anthropic Claude Opus 4.7 também expõe `/think max`; ele mapeia para o mesmo caminho de esforço máximo pertencente ao provedor.
  - Modelos diretos DeepSeek V4 expõem `/think xhigh|max`; ambos mapeiam para `reasoning_effort: "max"` do DeepSeek, enquanto níveis não `off` menores mapeiam para `high`.
  - Modelos DeepSeek V4 roteados pelo OpenRouter expõem `/think xhigh` e enviam valores de `reasoning_effort` compatíveis com o OpenRouter. Sobrescritas `max` armazenadas voltam para `xhigh`.
  - Modelos Ollama com capacidade de pensamento expõem `/think low|medium|high|max`; `max` mapeia para o `think: "high"` nativo, porque a API nativa do Ollama aceita as strings de esforço `low`, `medium` e `high`.
  - Modelos OpenAI GPT mapeiam `/think` pelo suporte a esforço da Responses API específico do modelo. `/think off` envia `reasoning.effort: "none"` somente quando o modelo de destino é compatível; caso contrário, o OpenClaw omite o payload de raciocínio desativado em vez de enviar um valor sem suporte.
  - Entradas de catálogo personalizadas compatíveis com OpenAI podem aderir a `/think xhigh` definindo `models.providers.<provider>.models[].compat.supportedReasoningEfforts` para incluir `"xhigh"`. Isso usa os mesmos metadados de compatibilidade que mapeiam payloads de esforço de raciocínio OpenAI de saída, então menus, validação de sessão, CLI de agente e `llm-task` concordam com o comportamento de transporte.
  - Referências configuradas obsoletas do OpenRouter Hunter Alpha ignoram a injeção de raciocínio por proxy porque essa rota descontinuada podia retornar texto de resposta final por campos de raciocínio.
  - Google Gemini mapeia `/think adaptive` para o pensamento dinâmico pertencente ao provedor do Gemini. Solicitações do Gemini 3 omitem um `thinkingLevel` fixo, enquanto solicitações do Gemini 2.5 enviam `thinkingBudget: -1`; níveis fixos ainda mapeiam para o `thinkingLevel` ou orçamento Gemini mais próximo para essa família de modelos.
  - MiniMax (`minimax/*`) no caminho de streaming compatível com Anthropic usa `thinking: { type: "disabled" }` por padrão, a menos que você defina explicitamente pensamento nos parâmetros do modelo ou da solicitação. Isso evita deltas de `reasoning_content` vazados pelo formato de stream Anthropic não nativo do MiniMax.
  - Z.AI (`zai/*`) só oferece suporte a pensamento binário (`on`/`off`). Qualquer nível diferente de `off` é tratado como `on` (mapeado para `low`).
  - Moonshot (`moonshot/*`) mapeia `/think off` para `thinking: { type: "disabled" }` e qualquer nível diferente de `off` para `thinking: { type: "enabled" }`. Quando o pensamento está ativado, Moonshot só aceita `tool_choice` `auto|none`; OpenClaw normaliza valores incompatíveis para `auto`.

## Ordem de resolução

1. Diretiva inline na mensagem (aplica-se somente a essa mensagem).
2. Sobrescrita de sessão (definida pelo envio de uma mensagem contendo apenas a diretiva).
3. Padrão por agente (`agents.list[].thinkingDefault` na configuração).
4. Padrão global (`agents.defaults.thinkingDefault` na configuração).
5. Fallback: padrão declarado pelo provedor quando disponível; caso contrário, modelos com capacidade de raciocínio resolvem para `medium` ou o nível não `off` compatível mais próximo para esse modelo, e modelos sem raciocínio permanecem `off`.

## Definindo um padrão de sessão

- Envie uma mensagem que seja **somente** a diretiva (espaços em branco permitidos), por exemplo, `/think:medium` ou `/t high`.
- Isso fica fixo para a sessão atual (por remetente, por padrão); é limpo por `/think:off` ou pela redefinição de ociosidade da sessão.
- Uma resposta de confirmação é enviada (`Thinking level set to high.` / `Thinking disabled.`). Se o nível for inválido (por exemplo, `/thinking big`), o comando será rejeitado com uma dica e o estado da sessão permanecerá inalterado.
- Envie `/think` (ou `/think:`) sem argumento para ver o nível de pensamento atual.

## Aplicação por agente

- **Pi incorporado**: o nível resolvido é passado para o runtime do agente Pi em processo.
- **backend Claude CLI**: níveis diferentes de off são passados para Claude Code como `--effort` ao usar `claude-cli`; consulte [backends CLI](/pt-BR/gateway/cli-backends).

## Modo rápido (/fast)

- Níveis: `on|off`.
- Mensagem contendo apenas a diretiva alterna uma sobrescrita de modo rápido da sessão e responde `Fast mode enabled.` / `Fast mode disabled.`.
- Envie `/fast` (ou `/fast status`) sem modo para ver o estado efetivo atual do modo rápido.
- OpenClaw resolve o modo rápido nesta ordem:
  1. `/fast on|off` inline/contendo apenas diretiva
  2. Sobrescrita de sessão
  3. Padrão por agente (`agents.list[].fastModeDefault`)
  4. Configuração por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Para `openai/*`, o modo rápido mapeia para processamento prioritário da OpenAI enviando `service_tier=priority` em solicitações Responses compatíveis.
- Para `openai-codex/*`, o modo rápido envia a mesma flag `service_tier=priority` em Codex Responses. OpenClaw mantém uma única alternância `/fast` compartilhada entre os dois caminhos de autenticação.
- Para solicitações públicas diretas `anthropic/*`, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o modo rápido mapeia para níveis de serviço da Anthropic: `/fast on` define `service_tier=auto`, `/fast off` define `service_tier=standard_only`.
- Para `minimax/*` no caminho compatível com Anthropic, `/fast on` (ou `params.fastMode: true`) reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.
- Parâmetros explícitos de modelo Anthropic `serviceTier` / `service_tier` substituem o padrão de modo rápido quando ambos estão definidos. OpenClaw ainda ignora a injeção de nível de serviço Anthropic para URLs base de proxy não Anthropic.
- `/status` mostra `Fast` somente quando o modo rápido está ativado.

## Diretivas verbosas (/verbose ou /v)

- Níveis: `on` (mínimo) | `full` | `off` (padrão).
- Mensagem contendo apenas a diretiva alterna o verbose da sessão e responde `Verbose logging enabled.` / `Verbose logging disabled.`; níveis inválidos retornam uma dica sem alterar o estado.
- `/verbose off` armazena uma sobrescrita explícita de sessão; limpe-a pela UI de Sessões escolhendo `inherit`.
- Diretiva inline afeta somente essa mensagem; padrões de sessão/globais se aplicam caso contrário.
- Envie `/verbose` (ou `/verbose:`) sem argumento para ver o nível verbose atual.
- Quando verbose está ativado, agentes que emitem resultados estruturados de ferramentas (Pi, outros agentes JSON) enviam cada chamada de ferramenta de volta como sua própria mensagem somente de metadados, prefixada com `<emoji> <tool-name>: <arg>` quando disponível. Esses resumos de ferramenta são enviados assim que cada ferramenta inicia (bolhas separadas), não como deltas de streaming.
- Resumos de falha de ferramenta permanecem visíveis no modo normal, mas sufixos de detalhes brutos de erro ficam ocultos, a menos que verbose seja `on` ou `full`.
- Quando verbose é `full`, as saídas de ferramentas também são encaminhadas após a conclusão (bolha separada, truncada para um comprimento seguro). Se você alternar `/verbose on|full|off` enquanto uma execução estiver em andamento, as bolhas de ferramenta subsequentes respeitarão a nova configuração.
- `agents.defaults.toolProgressDetail` controla o formato dos resumos de ferramenta de `/verbose` e das linhas de ferramenta de rascunho de progresso. Use `"explain"` (padrão) para rótulos humanos compactos, como `🛠️ Exec: checking JS syntax`; use `"raw"` quando também quiser o comando/detalhe bruto anexado para depuração. `agents.list[].toolProgressDetail` por agente substitui o padrão.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Diretivas de rastreamento de Plugin (/trace)

- Níveis: `on` | `off` (padrão).
- Mensagem contendo apenas a diretiva alterna a saída de rastreamento de Plugin da sessão e responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- Diretiva inline afeta somente essa mensagem; padrões de sessão/globais se aplicam caso contrário.
- Envie `/trace` (ou `/trace:`) sem argumento para ver o nível de rastreamento atual.
- `/trace` é mais restrito que `/verbose`: ele expõe apenas linhas de rastreamento/depuração pertencentes ao Plugin, como resumos de depuração da Active Memory.
- Linhas de rastreamento podem aparecer em `/status` e como uma mensagem diagnóstica de acompanhamento após a resposta normal do assistente.

## Visibilidade de raciocínio (/reasoning)

- Níveis: `on|off|stream`.
- Mensagem contendo apenas a diretiva alterna se blocos de pensamento são exibidos nas respostas.
- Quando ativado, o raciocínio é enviado como uma **mensagem separada** prefixada com `Reasoning:`.
- `stream` (somente Telegram): transmite o raciocínio para a bolha de rascunho do Telegram enquanto a resposta está sendo gerada e depois envia a resposta final sem raciocínio.
- Alias: `/reason`.
- Envie `/reasoning` (ou `/reasoning:`) sem argumento para ver o nível de raciocínio atual.
- Ordem de resolução: diretiva inline, depois sobrescrita de sessão, depois padrão por agente (`agents.list[].reasoningDefault`), depois fallback (`off`).

Tags de raciocínio malformadas de modelo local são tratadas de forma conservadora. Blocos fechados `<think>...</think>` permanecem ocultos em respostas normais, e raciocínio não fechado depois de texto já visível também fica oculto. Se uma resposta estiver totalmente envolvida em uma única tag de abertura não fechada e de outra forma seria entregue como texto vazio, OpenClaw remove a tag de abertura malformada e entrega o texto restante.

## Relacionado

- A documentação do modo elevado fica em [Modo elevado](/pt-BR/tools/elevated).

## Heartbeats

- O corpo da sonda Heartbeat é o prompt de Heartbeat configurado (padrão: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Diretivas inline em uma mensagem de Heartbeat se aplicam normalmente (mas evite alterar padrões de sessão a partir de Heartbeats).
- A entrega de Heartbeat usa por padrão apenas o payload final. Para também enviar a mensagem `Reasoning:` separada (quando disponível), defina `agents.defaults.heartbeat.includeReasoning: true` ou `agents.list[].heartbeat.includeReasoning: true` por agente.

## UI de chat web

- O seletor de pensamento do chat web espelha o nível armazenado da sessão a partir do armazenamento/configuração de sessão recebida quando a página carrega.
- Escolher outro nível grava a sobrescrita de sessão imediatamente via `sessions.patch`; ele não espera pelo próximo envio e não é uma sobrescrita `thinkingOnce` de uso único.
- A primeira opção é sempre `Default (<resolved level>)`, em que o padrão resolvido vem do perfil de pensamento do provedor do modelo da sessão ativa mais a mesma lógica de fallback usada por `/status` e `session_status`.
- O seletor usa `thinkingLevels` retornado pela linha/padrões de sessão do Gateway, com `thinkingOptions` mantido como uma lista de rótulos legada. A UI do navegador não mantém sua própria lista de regex de provedor; os Plugins são donos dos conjuntos de níveis específicos de modelo.
- `/think:<level>` ainda funciona e atualiza o mesmo nível de sessão armazenado, então as diretivas de chat e o seletor permanecem sincronizados.

## Perfis de provedor

- Os plugins de provedor podem expor `resolveThinkingProfile(ctx)` para definir os níveis compatíveis do modelo e o padrão.
- Os plugins de provedor que intermedeiam modelos Claude devem reutilizar `resolveClaudeThinkingProfile(modelId)` de `openclaw/plugin-sdk/provider-model-shared` para que os catálogos Anthropic diretos e de proxy permaneçam alinhados.
- Cada nível de perfil tem um `id` canônico armazenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` ou `max`) e pode incluir uma `label` de exibição. Provedores binários usam `{ id: "low", label: "on" }`.
- Plugins de ferramenta que precisam validar uma substituição explícita de pensamento devem usar `api.runtime.agent.resolveThinkingPolicy({ provider, model })` junto com `api.runtime.agent.normalizeThinkingLevel(...)`; eles não devem manter suas próprias listas de níveis por provedor/modelo.
- Plugins de ferramenta com acesso aos metadados configurados de modelos personalizados podem passar `catalog` para `resolveThinkingPolicy` para que adesões por `compat.supportedReasoningEfforts` sejam refletidas na validação do lado do plugin.
- Hooks legados publicados (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) permanecem como adaptadores de compatibilidade, mas novos conjuntos de níveis personalizados devem usar `resolveThinkingProfile`.
- Linhas/padrões do Gateway expõem `thinkingLevels`, `thinkingOptions` e `thinkingDefault` para que clientes ACP/chat renderizem os mesmos IDs e rótulos de perfil que a validação de runtime usa.
