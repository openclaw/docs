---
read_when:
    - Ajustar a análise sintática ou os padrões das diretivas de raciocínio, modo rápido ou detalhadas
summary: Sintaxe de diretivas para /think, /fast, /verbose, /trace e visibilidade do raciocínio
title: Níveis de raciocínio
x-i18n:
    generated_at: "2026-07-03T09:28:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6383ac18fbef0d06a97df5c204d57829ae4993b8287f8ef60aeae197ea711722
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
  - xhigh → "ultrathink+" (modelos GPT-5.2+ e Codex, mais esforço do Anthropic Claude Opus 4.7+)
  - adaptive → raciocínio adaptativo gerenciado pelo provedor (compatível com Claude 4.6 no Anthropic/Bedrock, Anthropic Claude Opus 4.7+ e raciocínio dinâmico do Google Gemini)
  - max → raciocínio máximo do provedor (Anthropic Claude Opus 4.7+; Ollama mapeia isso para seu maior esforço `think` nativo)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` são mapeados para `xhigh`.
  - `highest` é mapeado para `high`.
- Observações sobre provedores:
  - Menus e seletores de raciocínio são orientados por perfis de provedor. Plugins de provedor declaram o conjunto exato de níveis para o modelo selecionado, incluindo rótulos como `on` binário.
  - `adaptive`, `xhigh` e `max` só são anunciados para perfis de provedor/modelo que os aceitam. Diretivas digitadas para níveis sem suporte são rejeitadas com as opções válidas daquele modelo.
  - Níveis armazenados existentes sem suporte são remapeados pela classificação do perfil do provedor. `adaptive` volta para `medium` em modelos não adaptativos, enquanto `xhigh` e `max` voltam para o maior nível sem ser `off` aceito pelo modelo selecionado.
  - Modelos Anthropic Claude 4.6 usam `adaptive` por padrão quando nenhum nível explícito de raciocínio é definido.
  - Anthropic Claude Opus 4.8 e Opus 4.7 mantêm o raciocínio desligado, a menos que você defina explicitamente um nível de raciocínio. O padrão de esforço de propriedade do provedor do Opus 4.8 é `high` depois que o raciocínio adaptativo é ativado.
  - Anthropic Claude Opus 4.7+ mapeia `/think xhigh` para raciocínio adaptativo mais `output_config.effort: "xhigh"`, porque `/think` é uma diretiva de raciocínio e `xhigh` é a configuração de esforço do Opus.
  - Anthropic Claude Opus 4.7+ também expõe `/think max`; ele é mapeado para o mesmo caminho de esforço máximo de propriedade do provedor.
  - Modelos Direct DeepSeek V4 expõem `/think xhigh|max`; ambos são mapeados para `reasoning_effort: "max"` do DeepSeek, enquanto níveis inferiores sem ser `off` são mapeados para `high`.
  - Modelos DeepSeek V4 roteados pelo OpenRouter expõem `/think xhigh` e enviam valores `reasoning.effort` aceitos pelo OpenRouter em vez do `reasoning_effort` de nível superior nativo do DeepSeek. Níveis inferiores sem ser `off` são mapeados para `high`, e substituições armazenadas de `max` voltam para `xhigh`.
  - Modelos Ollama com capacidade de raciocínio expõem `/think low|medium|high|max`; `max` é mapeado para `think: "high"` nativo porque a API nativa do Ollama aceita strings de esforço `low`, `medium` e `high`.
  - Modelos OpenAI GPT mapeiam `/think` por meio do suporte de esforço específico do modelo na Responses API. `/think off` envia `reasoning.effort: "none"` somente quando o modelo de destino aceita isso; caso contrário, o OpenClaw omite o payload de raciocínio desativado em vez de enviar um valor sem suporte.
  - Entradas personalizadas de catálogo compatível com OpenAI podem optar por `/think xhigh` definindo `models.providers.<provider>.models[].compat.supportedReasoningEfforts` para incluir `"xhigh"`. Isso usa os mesmos metadados de compatibilidade que mapeiam payloads de esforço de raciocínio OpenAI de saída, então menus, validação de sessão, CLI de agente e `llm-task` concordam com o comportamento do transporte.
  - Referências configuradas obsoletas do OpenRouter Hunter Alpha ignoram a injeção de raciocínio por proxy porque essa rota aposentada podia retornar texto de resposta final por campos de raciocínio.
  - Google Gemini mapeia `/think adaptive` para o raciocínio dinâmico de propriedade do provedor do Gemini. Solicitações Gemini 3 omitem um `thinkingLevel` fixo, enquanto solicitações Gemini 2.5 enviam `thinkingBudget: -1`; níveis fixos ainda são mapeados para o `thinkingLevel` ou orçamento Gemini mais próximo para essa família de modelos.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) no caminho de streaming compatível com Anthropic usa `thinking: { type: "disabled" }` por padrão, a menos que você defina explicitamente raciocínio nos parâmetros do modelo ou da solicitação. Isso evita deltas de `reasoning_content` vazados do formato de stream Anthropic não nativo do M2.x. MiniMax-M3 (e M3.x) é isento: M3 emite blocos de raciocínio Anthropic adequados e retorna conteúdo vazio quando o raciocínio está desativado, então o OpenClaw mantém o M3 no caminho de raciocínio omitido/adaptativo do provedor.
  - Z.AI (`zai/*`) é binário (`on`/`off`) para a maioria dos modelos GLM. GLM-5.2 é a exceção: ele expõe `/think off|low|high|max`, mapeia `low` e `high` para `reasoning_effort: "high"` da Z.AI, e mapeia `max` para `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) sempre raciocina. Seu perfil expõe apenas `on`, e o OpenClaw omite o campo `thinking` de saída conforme exigido pela Moonshot. Outros modelos `moonshot/*` mapeiam `/think off` para `thinking: { type: "disabled" }` e qualquer nível diferente de `off` para `thinking: { type: "enabled" }`. Quando o raciocínio está ativado, a Moonshot aceita apenas `tool_choice` `auto|none`; o OpenClaw normaliza valores incompatíveis para `auto`.

## Ordem de resolução

1. Diretiva inline na mensagem (aplica-se somente a essa mensagem).
2. Substituição da sessão (definida ao enviar uma mensagem contendo apenas a diretiva).
3. Padrão por agente (`agents.list[].thinkingDefault` na configuração).
4. Padrão global (`agents.defaults.thinkingDefault` na configuração).
5. Fallback: padrão declarado pelo provedor quando disponível; caso contrário, modelos com capacidade de raciocínio resolvem para `medium` ou para o nível diferente de `off` mais próximo aceito por esse modelo, e modelos sem raciocínio permanecem `off`.

## Definindo um padrão de sessão

- Envie uma mensagem que seja **somente** a diretiva (espaços em branco permitidos), por exemplo, `/think:medium` ou `/t high`.
- Isso permanece na sessão atual (por remetente, por padrão). Use `/think default` para limpar a substituição da sessão e herdar o padrão configurado/do provedor; aliases incluem `inherit`, `clear`, `reset` e `unpin`.
- `/think off` armazena uma substituição explícita desligada. Ela desativa o raciocínio até você alterar ou limpar a substituição da sessão.
- Uma resposta de confirmação é enviada (`Thinking level set to high.` / `Thinking disabled.`). Se o nível for inválido (por exemplo, `/thinking big`), o comando será rejeitado com uma dica e o estado da sessão permanecerá inalterado.
- Envie `/think` (ou `/think:`) sem argumento para ver o nível de raciocínio atual.

## Aplicação por agente

- **OpenClaw embutido**: o nível resolvido é passado para o runtime do agente OpenClaw em processo.
- **Backend Claude CLI**: níveis diferentes de off são passados para Claude Code como `--effort` ao usar `claude-cli`; consulte [backends CLI](/pt-BR/gateway/cli-backends).

## Modo rápido (/fast)

- Níveis: `auto|on|off|default`.
- Uma mensagem contendo apenas a diretiva alterna uma substituição de modo rápido da sessão e responde `Fast mode set to auto.`, `Fast mode enabled.` ou `Fast mode disabled.`. Use `/fast default` para limpar a substituição da sessão e herdar o padrão configurado; aliases incluem `inherit`, `clear`, `reset` e `unpin`.
- Envie `/fast` (ou `/fast status`) sem modo para ver o estado efetivo atual do modo rápido.
- O OpenClaw resolve o modo rápido nesta ordem:
  1. Substituição inline/contendo apenas diretiva `/fast auto|on|off` (`/fast default` limpa essa camada)
  2. Substituição da sessão
  3. Padrão por agente (`agents.list[].fastModeDefault`)
  4. Configuração por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- `auto` mantém o modo de sessão/configuração como auto, mas resolve cada nova chamada de modelo de forma independente. Chamadas iniciadas antes do corte automático têm o modo rápido ativado; chamadas posteriores de nova tentativa, fallback, resultado de ferramenta ou continuação começam com o modo rápido desativado. O corte padrão é de 60 segundos; defina `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` no modelo ativo para alterá-lo.
- Para `openai/*`, o modo rápido é mapeado para o processamento prioritário da OpenAI enviando `service_tier=priority` em solicitações Responses compatíveis.
- Para modelos `openai/*` / `openai-codex/*` baseados em Codex, o modo rápido envia a mesma flag `service_tier=priority` em Responses do Codex. Turnos nativos do app-server do Codex recebem a camada apenas em `turn/start` ou no início/retomada de thread, então `auto` não consegue mudar a camada de um turno de app-server já em execução; ele se aplica ao próximo turno de modelo iniciado pelo OpenClaw.
- Para solicitações públicas diretas `anthropic/*`, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o modo rápido é mapeado para camadas de serviço da Anthropic: `/fast on` define `service_tier=auto`, `/fast off` define `service_tier=standard_only`.
- Para `minimax/*` no caminho compatível com Anthropic, `/fast on` (ou `params.fastMode: true`) reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.
- Parâmetros explícitos de modelo Anthropic `serviceTier` / `service_tier` substituem o padrão do modo rápido quando ambos são definidos. O OpenClaw ainda ignora a injeção de camada de serviço Anthropic para URLs base de proxy não Anthropic.
- `/status` mostra `Fast` quando o modo rápido está ativado e `Fast:auto` quando o modo configurado é auto.

## Diretivas detalhadas (/verbose ou /v)

- Níveis: `on` (mínimo) | `full` | `off` (padrão).
- Uma mensagem contendo apenas a diretiva alterna o detalhamento da sessão e responde `Verbose logging enabled.` / `Verbose logging disabled.`; níveis inválidos retornam uma dica sem alterar o estado.
- `/verbose off` armazena uma substituição explícita da sessão; limpe-a pela IU Sessions escolhendo `inherit`.
- Remetentes autorizados de canais externos podem persistir a substituição detalhada da sessão. Clientes internos de gateway/webchat precisam de `operator.admin` para persistir isso.
- Diretiva inline afeta somente essa mensagem; padrões de sessão/globais se aplicam caso contrário.
- Envie `/verbose` (ou `/verbose:`) sem argumento para ver o nível detalhado atual.
- Quando o detalhamento está ativado, agentes que emitem resultados estruturados de ferramentas enviam cada chamada de ferramenta de volta como sua própria mensagem apenas de metadados, prefixada com `<emoji> <tool-name>: <arg>` quando disponível. Esses resumos de ferramenta são enviados assim que cada ferramenta começa (bolhas separadas), não como deltas de streaming.
- Resumos de falha de ferramenta permanecem visíveis no modo normal, mas sufixos de detalhes brutos de erro ficam ocultos, a menos que o detalhamento seja `full`.
- Quando o detalhamento é `full`, as saídas de ferramentas também são encaminhadas após a conclusão (bolha separada, truncada para um comprimento seguro). Se você alternar `/verbose on|full|off` enquanto uma execução está em andamento, as bolhas de ferramentas subsequentes respeitarão a nova configuração.
- `agents.defaults.toolProgressDetail` controla o formato dos resumos de ferramentas de `/verbose` e das linhas de ferramenta de rascunho de progresso. Use `"explain"` (padrão) para rótulos humanos compactos como `🛠️ Exec: checking JS syntax`; use `"raw"` quando também quiser o comando/detalhe bruto anexado para depuração. `agents.list[].toolProgressDetail` por agente substitui o padrão.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Diretivas de rastreamento de Plugin (/trace)

- Níveis: `on` | `off` (padrão).
- Uma mensagem contendo apenas a diretiva alterna a saída de rastreamento de Plugin da sessão e responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- Diretiva inline afeta somente essa mensagem; padrões de sessão/globais se aplicam caso contrário.
- Envie `/trace` (ou `/trace:`) sem argumento para ver o nível de rastreamento atual.
- `/trace` é mais restrito que `/verbose`: ele expõe apenas linhas de rastreamento/depuração de propriedade do Plugin, como resumos de depuração da Active Memory.
- Linhas de rastreamento podem aparecer em `/status` e como uma mensagem diagnóstica de acompanhamento após a resposta normal do assistente.

## Visibilidade do raciocínio (/reasoning)

- Níveis: `on|off|stream`.
- Uma mensagem contendo apenas a diretiva alterna se blocos de raciocínio são mostrados nas respostas.
- Quando ativado, o raciocínio é enviado como uma **mensagem separada** prefixada com `Thinking`.
- `stream`: transmite raciocínio enquanto a resposta está sendo gerada quando o canal ativo aceita prévias de raciocínio, depois envia a resposta final sem raciocínio.
- Alias: `/reason`.
- Envie `/reasoning` (ou `/reasoning:`) sem argumento para ver o nível de raciocínio atual.
- Ordem de resolução: diretiva inline, depois substituição da sessão, depois padrão por agente (`agents.list[].reasoningDefault`), depois padrão global (`agents.defaults.reasoningDefault`), depois fallback (`off`).

Tags de raciocínio de modelo local malformadas são tratadas de forma conservadora. Blocos `<think>...</think>` fechados permanecem ocultos em respostas normais, e raciocínio não fechado após texto já visível também fica oculto. Se uma resposta estiver totalmente envolvida em uma única tag de abertura não fechada e, de outra forma, seria entregue como texto vazio, o OpenClaw remove a tag de abertura malformada e entrega o texto restante.

## Relacionado

- A documentação do modo elevado está em [Modo elevado](/pt-BR/tools/elevated).

## Heartbeats

- O corpo da sondagem de Heartbeat é o prompt de Heartbeat configurado (padrão: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Diretivas inline em uma mensagem de Heartbeat se aplicam normalmente (mas evite alterar padrões de sessão a partir de heartbeats).
- A entrega de Heartbeat usa por padrão apenas o payload final. Para também enviar a mensagem `Thinking` separada (quando disponível), defina `agents.defaults.heartbeat.includeReasoning: true` ou, por agente, `agents.list[].heartbeat.includeReasoning: true`.

## Interface de chat web

- O seletor de raciocínio do chat web espelha o nível armazenado da sessão a partir do armazenamento/configuração da sessão de entrada quando a página carrega.
- Escolher outro nível grava a substituição da sessão imediatamente via `sessions.patch`; isso não espera pelo próximo envio e não é uma substituição única `thinkingOnce`.
- A primeira opção é sempre a escolha para limpar a substituição. Ela mostra `Inherited: <resolved level>`, incluindo `Inherited: Off` quando o raciocínio herdado está desativado.
- Escolhas explícitas do seletor usam seus rótulos de nível diretos, preservando os rótulos do provedor quando presentes (por exemplo, `Maximum` para uma opção `max` rotulada pelo provedor).
- O seletor usa `thinkingLevels` retornado pela linha/padrões de sessão do Gateway, com `thinkingOptions` mantido como uma lista legada de rótulos. A interface do navegador não mantém sua própria lista de regex de provedores; plugins são responsáveis por conjuntos de níveis específicos de modelo.
- `/think:<level>` ainda funciona e atualiza o mesmo nível de sessão armazenado, então diretivas do chat e o seletor permanecem sincronizados.

## Perfis de provedores

- Plugins de provedor podem expor `resolveThinkingProfile(ctx)` para definir os níveis compatíveis e o padrão do modelo.
- Plugins de provedor que fazem proxy de modelos Claude devem reutilizar `resolveClaudeThinkingProfile(modelId)` de `openclaw/plugin-sdk/provider-model-shared` para que catálogos diretos da Anthropic e de proxy permaneçam alinhados.
- Cada nível de perfil tem um `id` canônico armazenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` ou `max`) e pode incluir um `label` de exibição. Provedores binários usam `{ id: "low", label: "on" }`.
- Hooks de perfil recebem fatos de catálogo mesclados quando disponíveis, incluindo `reasoning`, `compat.thinkingFormat` e `compat.supportedReasoningEfforts`. Use esses fatos para expor perfis binários ou personalizados apenas quando o contrato de requisição configurado for compatível com o payload correspondente.
- Plugins de ferramenta que precisam validar uma substituição explícita de raciocínio devem usar `api.runtime.agent.resolveThinkingPolicy({ provider, model })` mais `api.runtime.agent.normalizeThinkingLevel(...)`; eles não devem manter suas próprias listas de níveis por provedor/modelo.
- Plugins de ferramenta com acesso a metadados configurados de modelos personalizados podem passar `catalog` para `resolveThinkingPolicy` para que opt-ins de `compat.supportedReasoningEfforts` sejam refletidos na validação no lado do plugin.
- Hooks legados publicados (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) permanecem como adaptadores de compatibilidade, mas novos conjuntos de níveis personalizados devem usar `resolveThinkingProfile`.
- Linhas/padrões do Gateway expõem `thinkingLevels`, `thinkingOptions` e `thinkingDefault` para que clientes ACP/chat renderizem os mesmos ids e rótulos de perfil que a validação de runtime usa.
