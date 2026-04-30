---
read_when:
    - Ajuste da análise ou dos padrões das diretivas thinking, fast-mode ou verbose
summary: Sintaxe de diretivas para /think, /fast, /verbose, /trace e visibilidade do raciocínio
title: Níveis de raciocínio
x-i18n:
    generated_at: "2026-04-30T16:30:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9adf065e46cb64e4c2149b95ecd69ed887a17e2eff5a5569894defa3e7217b7
    source_path: tools/thinking.md
    workflow: 16
---

## O que ele faz

- Diretiva inline em qualquer corpo de entrada: `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Níveis (aliases): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (orçamento máximo)
  - xhigh → “ultrathink+” (modelos GPT-5.2+ e Codex, mais esforço do Anthropic Claude Opus 4.7)
  - adaptive → raciocínio adaptativo gerenciado pelo provedor (compatível com Claude 4.6 na Anthropic/Bedrock, Anthropic Claude Opus 4.7 e raciocínio dinâmico do Google Gemini)
  - max → raciocínio máximo do provedor (Anthropic Claude Opus 4.7; Ollama mapeia isso para seu maior esforço nativo de `think`)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` são mapeados para `xhigh`.
  - `highest` é mapeado para `high`.
- Observações sobre provedores:
  - Menus e seletores de raciocínio são orientados por perfil de provedor. Plugins de provedor declaram o conjunto exato de níveis para o modelo selecionado, incluindo rótulos como `on` binário.
  - `adaptive`, `xhigh` e `max` são anunciados apenas para perfis de provedor/modelo compatíveis. Diretivas digitadas para níveis sem suporte são rejeitadas com as opções válidas desse modelo.
  - Níveis sem suporte armazenados existentes são remapeados pela classificação do perfil do provedor. `adaptive` recua para `medium` em modelos não adaptativos, enquanto `xhigh` e `max` recuam para o maior nível não `off` compatível com o modelo selecionado.
  - Modelos Anthropic Claude 4.6 usam `adaptive` por padrão quando nenhum nível de raciocínio explícito é definido.
  - Anthropic Claude Opus 4.7 não usa raciocínio adaptativo por padrão. O padrão de esforço da API continua sob responsabilidade do provedor, a menos que você defina explicitamente um nível de raciocínio.
  - Anthropic Claude Opus 4.7 mapeia `/think xhigh` para raciocínio adaptativo mais `output_config.effort: "xhigh"`, porque `/think` é uma diretiva de raciocínio e `xhigh` é a configuração de esforço do Opus 4.7.
  - Anthropic Claude Opus 4.7 também expõe `/think max`; ele é mapeado para o mesmo caminho de esforço máximo pertencente ao provedor.
  - Modelos DeepSeek V4 expõem `/think xhigh|max`; ambos são mapeados para DeepSeek `reasoning_effort: "max"`, enquanto níveis não `off` inferiores são mapeados para `high`.
  - Modelos Ollama com capacidade de raciocínio expõem `/think low|medium|high|max`; `max` é mapeado para `think: "high"` nativo, porque a API nativa do Ollama aceita strings de esforço `low`, `medium` e `high`.
  - Modelos OpenAI GPT mapeiam `/think` por meio do suporte de esforço específico do modelo na Responses API. `/think off` envia `reasoning.effort: "none"` somente quando o modelo de destino é compatível; caso contrário, o OpenClaw omite o payload de raciocínio desativado em vez de enviar um valor sem suporte.
  - Entradas de catálogo personalizadas compatíveis com OpenAI podem optar por `/think xhigh` definindo `models.providers.<provider>.models[].compat.supportedReasoningEfforts` para incluir `"xhigh"`. Isso usa os mesmos metadados de compatibilidade que mapeiam payloads de esforço de raciocínio OpenAI de saída, então menus, validação de sessão, CLI do agente e `llm-task` concordam com o comportamento de transporte.
  - Referências configuradas obsoletas do OpenRouter Hunter Alpha ignoram a injeção de raciocínio por proxy porque essa rota aposentada podia retornar texto de resposta final por campos de raciocínio.
  - Google Gemini mapeia `/think adaptive` para o raciocínio dinâmico pertencente ao provedor do Gemini. Solicitações do Gemini 3 omitem um `thinkingLevel` fixo, enquanto solicitações do Gemini 2.5 enviam `thinkingBudget: -1`; níveis fixos ainda são mapeados para o `thinkingLevel` ou orçamento Gemini mais próximo para essa família de modelos.
  - MiniMax (`minimax/*`) no caminho de streaming compatível com Anthropic usa `thinking: { type: "disabled" }` por padrão, a menos que você defina explicitamente raciocínio em parâmetros de modelo ou de solicitação. Isso evita deltas de `reasoning_content` vazados do formato de stream Anthropic não nativo do MiniMax.
  - Z.AI (`zai/*`) só oferece suporte a raciocínio binário (`on`/`off`). Qualquer nível que não seja `off` é tratado como `on` (mapeado para `low`).
  - Moonshot (`moonshot/*`) mapeia `/think off` para `thinking: { type: "disabled" }` e qualquer nível que não seja `off` para `thinking: { type: "enabled" }`. Quando o raciocínio está ativado, Moonshot aceita apenas `tool_choice` `auto|none`; OpenClaw normaliza valores incompatíveis para `auto`.

## Ordem de resolução

1. Diretiva inline na mensagem (aplica-se somente a essa mensagem).
2. Substituição da sessão (definida ao enviar uma mensagem contendo apenas diretiva).
3. Padrão por agente (`agents.list[].thinkingDefault` na configuração).
4. Padrão global (`agents.defaults.thinkingDefault` na configuração).
5. Fallback: padrão declarado pelo provedor quando disponível; caso contrário, modelos capazes de raciocínio resolvem para `medium` ou para o nível não `off` compatível mais próximo desse modelo, e modelos sem raciocínio permanecem `off`.

## Definir um padrão de sessão

- Envie uma mensagem que seja **apenas** a diretiva (espaços em branco permitidos), por exemplo, `/think:medium` ou `/t high`.
- Isso permanece para a sessão atual (por remetente, por padrão); limpo por `/think:off` ou redefinição por inatividade da sessão.
- Uma resposta de confirmação é enviada (`Thinking level set to high.` / `Thinking disabled.`). Se o nível for inválido (por exemplo, `/thinking big`), o comando será rejeitado com uma dica e o estado da sessão permanecerá inalterado.
- Envie `/think` (ou `/think:`) sem argumento para ver o nível de raciocínio atual.

## Aplicação por agente

- **Pi incorporado**: o nível resolvido é passado para o runtime do agente Pi em processo.

## Modo rápido (/fast)

- Níveis: `on|off`.
- Mensagem contendo apenas diretiva alterna uma substituição de modo rápido da sessão e responde `Fast mode enabled.` / `Fast mode disabled.`.
- Envie `/fast` (ou `/fast status`) sem modo para ver o estado efetivo atual do modo rápido.
- OpenClaw resolve o modo rápido nesta ordem:
  1. `/fast on|off` inline/somente diretiva
  2. Substituição da sessão
  3. Padrão por agente (`agents.list[].fastModeDefault`)
  4. Configuração por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Para `openai/*`, o modo rápido é mapeado para processamento prioritário OpenAI enviando `service_tier=priority` em solicitações Responses compatíveis.
- Para `openai-codex/*`, o modo rápido envia a mesma flag `service_tier=priority` em Responses do Codex. OpenClaw mantém uma alternância `/fast` compartilhada entre os dois caminhos de autenticação.
- Para solicitações públicas diretas `anthropic/*`, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o modo rápido é mapeado para níveis de serviço da Anthropic: `/fast on` define `service_tier=auto`, `/fast off` define `service_tier=standard_only`.
- Para `minimax/*` no caminho compatível com Anthropic, `/fast on` (ou `params.fastMode: true`) reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.
- Parâmetros de modelo Anthropic explícitos `serviceTier` / `service_tier` substituem o padrão do modo rápido quando ambos são definidos. OpenClaw ainda ignora a injeção de nível de serviço Anthropic para URLs base de proxy que não são Anthropic.
- `/status` mostra `Fast` somente quando o modo rápido está ativado.

## Diretivas detalhadas (/verbose ou /v)

- Níveis: `on` (mínimo) | `full` | `off` (padrão).
- Mensagem contendo apenas diretiva alterna o modo detalhado da sessão e responde `Verbose logging enabled.` / `Verbose logging disabled.`; níveis inválidos retornam uma dica sem alterar o estado.
- `/verbose off` armazena uma substituição explícita da sessão; limpe-a pela UI de Sessões escolhendo `inherit`.
- Diretiva inline afeta somente essa mensagem; padrões de sessão/globais se aplicam nos demais casos.
- Envie `/verbose` (ou `/verbose:`) sem argumento para ver o nível detalhado atual.
- Quando o modo detalhado está ativado, agentes que emitem resultados de ferramenta estruturados (Pi, outros agentes JSON) enviam cada chamada de ferramenta de volta como sua própria mensagem somente de metadados, prefixada com `<emoji> <tool-name>: <arg>` quando disponível (caminho/comando). Esses resumos de ferramenta são enviados assim que cada ferramenta começa (balões separados), não como deltas de streaming.
- Resumos de falha de ferramenta permanecem visíveis no modo normal, mas sufixos de detalhe de erro bruto ficam ocultos, a menos que o modo detalhado seja `on` ou `full`.
- Quando o modo detalhado é `full`, as saídas de ferramenta também são encaminhadas após a conclusão (balão separado, truncado para um tamanho seguro). Se você alternar `/verbose on|full|off` enquanto uma execução está em andamento, os balões de ferramenta subsequentes respeitarão a nova configuração.

## Diretivas de rastreamento de Plugin (/trace)

- Níveis: `on` | `off` (padrão).
- Mensagem contendo apenas diretiva alterna a saída de rastreamento de Plugin da sessão e responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- Diretiva inline afeta somente essa mensagem; padrões de sessão/globais se aplicam nos demais casos.
- Envie `/trace` (ou `/trace:`) sem argumento para ver o nível de rastreamento atual.
- `/trace` é mais estreito que `/verbose`: expõe apenas linhas de rastreamento/depuração pertencentes a plugins, como resumos de depuração de Active Memory.
- Linhas de rastreamento podem aparecer em `/status` e como uma mensagem diagnóstica de acompanhamento após a resposta normal do assistente.

## Visibilidade de raciocínio (/reasoning)

- Níveis: `on|off|stream`.
- Mensagem contendo apenas diretiva alterna se blocos de raciocínio são mostrados nas respostas.
- Quando ativado, o raciocínio é enviado como uma **mensagem separada** prefixada com `Reasoning:`.
- `stream` (somente Telegram): transmite o raciocínio para o balão de rascunho do Telegram enquanto a resposta está sendo gerada e depois envia a resposta final sem raciocínio.
- Alias: `/reason`.
- Envie `/reasoning` (ou `/reasoning:`) sem argumento para ver o nível de raciocínio atual.
- Ordem de resolução: diretiva inline, depois substituição da sessão, depois padrão por agente (`agents.list[].reasoningDefault`), depois fallback (`off`).

Tags de raciocínio de modelo local malformadas são tratadas de forma conservadora. Blocos fechados `<think>...</think>` permanecem ocultos em respostas normais, e raciocínio não fechado após texto já visível também fica oculto. Se uma resposta estiver totalmente envolvida em uma única tag de abertura não fechada e, de outra forma, seria entregue como texto vazio, OpenClaw remove a tag de abertura malformada e entrega o texto restante.

## Relacionado

- A documentação do modo elevado fica em [Modo elevado](/pt-BR/tools/elevated).

## Heartbeats

- O corpo da sonda de Heartbeat é o prompt de Heartbeat configurado (padrão: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Diretivas inline em uma mensagem de Heartbeat se aplicam normalmente (mas evite alterar padrões de sessão a partir de Heartbeats).
- A entrega de Heartbeat usa por padrão apenas o payload final. Para também enviar a mensagem `Reasoning:` separada (quando disponível), defina `agents.defaults.heartbeat.includeReasoning: true` ou `agents.list[].heartbeat.includeReasoning: true` por agente.

## UI de chat web

- O seletor de raciocínio do chat web espelha o nível armazenado da sessão a partir do repositório/configuração da sessão de entrada quando a página carrega.
- Selecionar outro nível grava a substituição da sessão imediatamente via `sessions.patch`; ele não espera o próximo envio e não é uma substituição única `thinkingOnce`.
- A primeira opção é sempre `Default (<resolved level>)`, em que o padrão resolvido vem do perfil de raciocínio do provedor do modelo da sessão ativa mais a mesma lógica de fallback que `/status` e `session_status` usam.
- O seletor usa `thinkingLevels` retornado pela linha/padrões da sessão do Gateway, com `thinkingOptions` mantido como uma lista legada de rótulos. A UI do navegador não mantém sua própria lista de regex de provedor; plugins possuem conjuntos de níveis específicos de modelo.
- `/think:<level>` ainda funciona e atualiza o mesmo nível de sessão armazenado, então diretivas de chat e o seletor permanecem sincronizados.

## Perfis de provedor

- Plugins de provedor podem expor `resolveThinkingProfile(ctx)` para definir os níveis compatíveis do modelo e o padrão.
- Plugins de provedor que fazem proxy de modelos Claude devem reutilizar `resolveClaudeThinkingProfile(modelId)` de `openclaw/plugin-sdk/provider-model-shared` para que os catálogos diretos da Anthropic e os catálogos de proxy permaneçam alinhados.
- Cada nível de perfil tem um `id` canônico armazenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` ou `max`) e pode incluir um `label` de exibição. Provedores binários usam `{ id: "low", label: "on" }`.
- Plugins de ferramenta que precisam validar uma substituição explícita de raciocínio devem usar `api.runtime.agent.resolveThinkingPolicy({ provider, model })` junto com `api.runtime.agent.normalizeThinkingLevel(...)`; eles não devem manter suas próprias listas de níveis por provedor/modelo.
- Plugins de ferramenta com acesso a metadados configurados de modelos personalizados podem passar `catalog` para `resolveThinkingPolicy` para que adesões de `compat.supportedReasoningEfforts` sejam refletidas na validação do lado do Plugin.
- Hooks legados publicados (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) permanecem como adaptadores de compatibilidade, mas novos conjuntos de níveis personalizados devem usar `resolveThinkingProfile`.
- Linhas/padrões do Gateway expõem `thinkingLevels`, `thinkingOptions` e `thinkingDefault` para que clientes ACP/chat renderizem os mesmos ids e rótulos de perfil que a validação em tempo de execução usa.
