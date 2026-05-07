---
read_when:
    - Ajuste da análise ou dos padrões das diretivas thinking, fast-mode ou verbose
summary: Sintaxe de diretivas para /think, /fast, /verbose, /trace e visibilidade do raciocínio
title: Níveis de raciocínio
x-i18n:
    generated_at: "2026-05-07T13:25:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8890563aa0171d41549f1d1a6af3279babbcba17eb19302753275e9e2ff01980
    source_path: tools/thinking.md
    workflow: 16
---

## O que ele faz

- Diretiva inline em qualquer corpo recebido: `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Níveis (aliases): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (orçamento máximo)
  - xhigh → "ultrathink+" (modelos GPT-5.2+ e Codex, além de esforço Anthropic Claude Opus 4.7)
  - adaptive → pensamento adaptativo gerenciado pelo provedor (compatível com Claude 4.6 na Anthropic/Bedrock, Anthropic Claude Opus 4.7 e pensamento dinâmico do Google Gemini)
  - max → raciocínio máximo do provedor (Anthropic Claude Opus 4.7; Ollama mapeia isso para seu maior esforço `think` nativo)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` são mapeados para `xhigh`.
  - `highest` é mapeado para `high`.
- Observações sobre provedores:
  - Menus e seletores de pensamento são controlados pelo perfil do provedor. Plugins de provedor declaram o conjunto exato de níveis para o modelo selecionado, incluindo rótulos como `on` binário.
  - `adaptive`, `xhigh` e `max` só são anunciados para perfis de provedor/modelo que oferecem suporte a eles. Diretivas digitadas para níveis sem suporte são rejeitadas com as opções válidas desse modelo.
  - Níveis sem suporte armazenados existentes são remapeados pela classificação do perfil do provedor. `adaptive` volta para `medium` em modelos não adaptativos, enquanto `xhigh` e `max` voltam para o maior nível compatível que não seja `off` para o modelo selecionado.
  - Modelos Anthropic Claude 4.6 usam `adaptive` por padrão quando nenhum nível explícito de pensamento é definido.
  - Anthropic Claude Opus 4.7 não usa pensamento adaptativo por padrão. O padrão de esforço da API dele continua pertencendo ao provedor, a menos que você defina explicitamente um nível de pensamento.
  - Anthropic Claude Opus 4.7 mapeia `/think xhigh` para pensamento adaptativo mais `output_config.effort: "xhigh"`, porque `/think` é uma diretiva de pensamento e `xhigh` é a configuração de esforço do Opus 4.7.
  - Anthropic Claude Opus 4.7 também expõe `/think max`; ele é mapeado para o mesmo caminho de esforço máximo pertencente ao provedor.
  - Modelos Direct DeepSeek V4 expõem `/think xhigh|max`; ambos são mapeados para DeepSeek `reasoning_effort: "max"`, enquanto níveis menores que não sejam `off` são mapeados para `high`.
  - Modelos DeepSeek V4 roteados pelo OpenRouter expõem `/think xhigh` e enviam valores `reasoning_effort` compatíveis com OpenRouter. Substituições `max` armazenadas voltam para `xhigh`.
  - Modelos Ollama com capacidade de pensamento expõem `/think low|medium|high|max`; `max` é mapeado para `think: "high"` nativo porque a API nativa do Ollama aceita as strings de esforço `low`, `medium` e `high`.
  - Modelos OpenAI GPT mapeiam `/think` por meio do suporte de esforço específico do modelo na Responses API. `/think off` envia `reasoning.effort: "none"` somente quando o modelo de destino oferece suporte; caso contrário, o OpenClaw omite o payload de raciocínio desativado em vez de enviar um valor sem suporte.
  - Entradas personalizadas de catálogo compatível com OpenAI podem aderir a `/think xhigh` definindo `models.providers.<provider>.models[].compat.supportedReasoningEfforts` para incluir `"xhigh"`. Isso usa os mesmos metadados de compatibilidade que mapeiam payloads de esforço de raciocínio OpenAI de saída, portanto menus, validação de sessão, CLI de agente e `llm-task` concordam com o comportamento de transporte.
  - Referências configuradas obsoletas ao OpenRouter Hunter Alpha ignoram a injeção de raciocínio por proxy porque essa rota aposentada podia retornar texto de resposta final por meio de campos de raciocínio.
  - Google Gemini mapeia `/think adaptive` para o pensamento dinâmico pertencente ao provedor do Gemini. Solicitações Gemini 3 omitem um `thinkingLevel` fixo, enquanto solicitações Gemini 2.5 enviam `thinkingBudget: -1`; níveis fixos ainda são mapeados para o `thinkingLevel` ou orçamento Gemini mais próximo para essa família de modelos.
  - MiniMax (`minimax/*`) no caminho de streaming compatível com Anthropic usa `thinking: { type: "disabled" }` por padrão, a menos que você defina explicitamente pensamento nos parâmetros do modelo ou da solicitação. Isso evita deltas `reasoning_content` vazados do formato de stream Anthropic não nativo do MiniMax.
  - Z.AI (`zai/*`) só oferece suporte a pensamento binário (`on`/`off`). Qualquer nível que não seja `off` é tratado como `on` (mapeado para `low`).
  - Moonshot (`moonshot/*`) mapeia `/think off` para `thinking: { type: "disabled" }` e qualquer nível que não seja `off` para `thinking: { type: "enabled" }`. Quando o pensamento está habilitado, Moonshot só aceita `tool_choice` `auto|none`; OpenClaw normaliza valores incompatíveis para `auto`.

## Ordem de resolução

1. Diretiva inline na mensagem (aplica-se somente a essa mensagem).
2. Substituição da sessão (definida ao enviar uma mensagem contendo apenas a diretiva).
3. Padrão por agente (`agents.list[].thinkingDefault` na configuração).
4. Padrão global (`agents.defaults.thinkingDefault` na configuração).
5. Fallback: padrão declarado pelo provedor quando disponível; caso contrário, modelos com capacidade de raciocínio resolvem para `medium` ou para o nível compatível mais próximo que não seja `off` para esse modelo, e modelos sem raciocínio permanecem `off`.

## Definindo um padrão de sessão

- Envie uma mensagem que seja **somente** a diretiva (espaços em branco permitidos), por exemplo, `/think:medium` ou `/t high`.
- Isso permanece na sessão atual (por remetente, por padrão); é limpo por `/think:off` ou pela redefinição de sessão ociosa.
- Uma resposta de confirmação é enviada (`Thinking level set to high.` / `Thinking disabled.`). Se o nível for inválido (por exemplo, `/thinking big`), o comando é rejeitado com uma dica e o estado da sessão permanece inalterado.
- Envie `/think` (ou `/think:`) sem argumento para ver o nível de pensamento atual.

## Aplicação por agente

- **Pi embutido**: o nível resolvido é passado para o runtime do agente Pi em processo.
- **Backend Claude CLI**: níveis que não sejam off são passados para Claude Code como `--effort` ao usar `claude-cli`; consulte [backends CLI](/pt-BR/gateway/cli-backends).

## Modo rápido (/fast)

- Níveis: `on|off`.
- Mensagem contendo apenas a diretiva alterna uma substituição de modo rápido da sessão e responde `Fast mode enabled.` / `Fast mode disabled.`.
- Envie `/fast` (ou `/fast status`) sem modo para ver o estado efetivo atual do modo rápido.
- OpenClaw resolve o modo rápido nesta ordem:
  1. `/fast on|off` inline/contendo apenas diretiva
  2. Substituição da sessão
  3. Padrão por agente (`agents.list[].fastModeDefault`)
  4. Configuração por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Para `openai/*`, o modo rápido é mapeado para o processamento prioritário da OpenAI enviando `service_tier=priority` em solicitações Responses compatíveis.
- Para `openai-codex/*`, o modo rápido envia a mesma flag `service_tier=priority` nas Responses do Codex. OpenClaw mantém um único alternador `/fast` compartilhado entre os dois caminhos de autenticação.
- Para solicitações públicas diretas `anthropic/*`, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o modo rápido é mapeado para níveis de serviço da Anthropic: `/fast on` define `service_tier=auto`, `/fast off` define `service_tier=standard_only`.
- Para `minimax/*` no caminho compatível com Anthropic, `/fast on` (ou `params.fastMode: true`) reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.
- Parâmetros explícitos de modelo Anthropic `serviceTier` / `service_tier` substituem o padrão de modo rápido quando ambos são definidos. OpenClaw ainda ignora a injeção de nível de serviço Anthropic para URLs base de proxy que não sejam Anthropic.
- `/status` mostra `Fast` somente quando o modo rápido está habilitado.

## Diretivas verbosas (/verbose ou /v)

- Níveis: `on` (mínimo) | `full` | `off` (padrão).
- Mensagem contendo apenas a diretiva alterna o verbose da sessão e responde `Verbose logging enabled.` / `Verbose logging disabled.`; níveis inválidos retornam uma dica sem alterar o estado.
- `/verbose off` armazena uma substituição explícita de sessão; limpe-a pela UI de Sessões escolhendo `inherit`.
- Diretiva inline afeta somente essa mensagem; padrões de sessão/globais se aplicam caso contrário.
- Envie `/verbose` (ou `/verbose:`) sem argumento para ver o nível verboso atual.
- Quando verbose está ativado, agentes que emitem resultados estruturados de ferramentas (Pi, outros agentes JSON) enviam cada chamada de ferramenta de volta como sua própria mensagem somente de metadados, prefixada com `<emoji> <tool-name>: <arg>` quando disponível. Esses resumos de ferramentas são enviados assim que cada ferramenta inicia (bolhas separadas), não como deltas de streaming.
- Resumos de falha de ferramenta permanecem visíveis no modo normal, mas sufixos com detalhes brutos de erro ficam ocultos, a menos que verbose seja `on` ou `full`.
- Quando verbose é `full`, saídas de ferramentas também são encaminhadas após a conclusão (bolha separada, truncada para um tamanho seguro). Se você alternar `/verbose on|full|off` enquanto uma execução estiver em andamento, as bolhas de ferramenta subsequentes respeitarão a nova configuração.
- `agents.defaults.toolProgressDetail` controla o formato dos resumos de ferramenta de `/verbose` e das linhas de ferramenta em rascunho de progresso. Use `"explain"` (padrão) para rótulos humanos compactos como `🛠️ Exec: checking JS syntax`; use `"raw"` quando também quiser o comando/detalhe bruto anexado para depuração. `agents.list[].toolProgressDetail` por agente substitui o padrão.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Diretivas de rastreamento de Plugin (/trace)

- Níveis: `on` | `off` (padrão).
- Mensagem contendo apenas a diretiva alterna a saída de rastreamento de Plugin da sessão e responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- Diretiva inline afeta somente essa mensagem; padrões de sessão/globais se aplicam caso contrário.
- Envie `/trace` (ou `/trace:`) sem argumento para ver o nível de rastreamento atual.
- `/trace` é mais restrito que `/verbose`: ele expõe apenas linhas de rastreamento/depuração pertencentes ao Plugin, como resumos de depuração de Active Memory.
- Linhas de rastreamento podem aparecer em `/status` e como uma mensagem diagnóstica complementar após a resposta normal do assistente.

## Visibilidade do raciocínio (/reasoning)

- Níveis: `on|off|stream`.
- Mensagem contendo apenas a diretiva alterna se blocos de pensamento são exibidos nas respostas.
- Quando habilitado, o raciocínio é enviado como uma **mensagem separada** prefixada com `Reasoning:`.
- `stream` (somente Telegram): transmite o raciocínio para a bolha de rascunho do Telegram enquanto a resposta está sendo gerada e, em seguida, envia a resposta final sem raciocínio.
- Alias: `/reason`.
- Envie `/reasoning` (ou `/reasoning:`) sem argumento para ver o nível atual de raciocínio.
- Ordem de resolução: diretiva inline, depois substituição da sessão, depois padrão por agente (`agents.list[].reasoningDefault`), depois fallback (`off`).

Tags de raciocínio de modelo local malformadas são tratadas de forma conservadora. Blocos fechados `<think>...</think>` permanecem ocultos em respostas normais, e raciocínio não fechado após texto já visível também fica oculto. Se uma resposta estiver totalmente envolvida por uma única tag de abertura não fechada e, de outra forma, seria entregue como texto vazio, OpenClaw remove a tag de abertura malformada e entrega o texto restante.

## Relacionado

- A documentação de modo elevado fica em [Modo elevado](/pt-BR/tools/elevated).

## Heartbeats

- O corpo da sondagem Heartbeat é o prompt de Heartbeat configurado (padrão: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Diretivas inline em uma mensagem de Heartbeat se aplicam normalmente (mas evite alterar padrões de sessão a partir de Heartbeats).
- A entrega de Heartbeat usa por padrão apenas o payload final. Para também enviar a mensagem `Reasoning:` separada (quando disponível), defina `agents.defaults.heartbeat.includeReasoning: true` ou `agents.list[].heartbeat.includeReasoning: true` por agente.

## UI de chat Web

- O seletor de raciocínio do chat web espelha o nível armazenado da sessão a partir do armazenamento/configuração da sessão recebida quando a página carrega.
- Escolher outro nível grava a substituição da sessão imediatamente via `sessions.patch`; ele não espera pelo próximo envio e não é uma substituição pontual `thinkingOnce`.
- A primeira opção é sempre a escolha para limpar a substituição. Ela mostra `Inherited: <resolved level>` quando a sessão está herdando um padrão efetivo não desativado, ou `Off` quando o raciocínio herdado está desativado.
- As escolhas explícitas do seletor são rotuladas como substituições, preservando os rótulos do provedor quando presentes (por exemplo, `Override: maximum` para uma opção `max` rotulada pelo provedor).
- O seletor usa `thinkingLevels` retornado pela linha/padrões da sessão do Gateway, com `thinkingOptions` mantido como uma lista legada de rótulos. A interface do navegador não mantém sua própria lista de regex de provedores; os plugins são responsáveis pelos conjuntos de níveis específicos do modelo.
- `/think:<level>` ainda funciona e atualiza o mesmo nível de sessão armazenado, então as diretivas do chat e o seletor permanecem sincronizados.

## Perfis de provedor

- Plugins de provedor podem expor `resolveThinkingProfile(ctx)` para definir os níveis compatíveis e o padrão do modelo.
- Plugins de provedor que fazem proxy de modelos Claude devem reutilizar `resolveClaudeThinkingProfile(modelId)` de `openclaw/plugin-sdk/provider-model-shared` para que os catálogos diretos da Anthropic e os catálogos de proxy permaneçam alinhados.
- Cada nível de perfil tem um `id` canônico armazenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` ou `max`) e pode incluir um `label` de exibição. Provedores binários usam `{ id: "low", label: "on" }`.
- Plugins de ferramenta que precisam validar uma substituição explícita de raciocínio devem usar `api.runtime.agent.resolveThinkingPolicy({ provider, model })` mais `api.runtime.agent.normalizeThinkingLevel(...)`; eles não devem manter suas próprias listas de níveis por provedor/modelo.
- Plugins de ferramenta com acesso aos metadados configurados de modelos personalizados podem passar `catalog` para `resolveThinkingPolicy` para que as adesões `compat.supportedReasoningEfforts` sejam refletidas na validação do lado do plugin.
- Hooks legados publicados (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) permanecem como adaptadores de compatibilidade, mas novos conjuntos de níveis personalizados devem usar `resolveThinkingProfile`.
- Linhas/padrões do Gateway expõem `thinkingLevels`, `thinkingOptions` e `thinkingDefault` para que clientes ACP/chat renderizem os mesmos ids e rótulos de perfil que a validação em runtime usa.
