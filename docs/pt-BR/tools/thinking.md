---
read_when:
    - Ajuste da análise de diretivas ou dos padrões de raciocínio, modo rápido ou verbosidade
summary: Sintaxe de diretivas para /think, /fast, /verbose, /trace e visibilidade do raciocínio
title: Níveis de raciocínio
x-i18n:
    generated_at: "2026-07-12T15:51:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 75170dd48f83dcb3ebb70eea2b37160208618d0aae23253c82fe88ce3afbc0e2
    source_path: tools/thinking.md
    workflow: 16
---

## O que ele faz

- Diretiva embutida em qualquer corpo recebido: `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Níveis (aliases): `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`, refletindo aproximadamente a clássica escala de palavras mágicas da Anthropic, "think" < "think hard" < "think harder" < "ultrathink":
  - minimal ~ "pense"
  - low ~ "pense bastante"
  - medium ~ "pense ainda mais"
  - high ~ "ultrathink" (orçamento máximo)
  - xhigh ~ "ultrathink+" (modelos GPT-5.2+ e Codex, além do esforço do Anthropic Claude Opus 4.7+)
  - adaptive → pensamento adaptativo gerenciado pelo provedor (compatível com Claude 4.6 na Anthropic/Bedrock, Anthropic Claude Opus 4.7+ e pensamento dinâmico do Google Gemini)
  - max → raciocínio máximo do provedor (Anthropic Claude Opus 4.7+; o Ollama mapeia isso para seu maior esforço `think` nativo)
  - ultra → raciocínio máximo do provedor mais orquestração proativa de subagentes quando o modelo/runtime selecionado oferece suporte
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` são mapeados para `xhigh`.
  - `highest` é mapeado para `high`.
- Observações sobre provedores:
  - Os menus e seletores de pensamento são orientados pelo perfil do provedor. Os plugins de provedor declaram o conjunto exato de níveis para o modelo selecionado, incluindo rótulos como o binário `on`.
  - `adaptive`, `xhigh`, `max` e `ultra` são anunciados somente para perfis de provedor/modelo/runtime que oferecem suporte a eles. Diretivas digitadas para níveis sem suporte são rejeitadas com as opções válidas desse modelo.
  - Níveis armazenados existentes sem suporte são remapeados pela classificação do perfil do provedor. `adaptive` recua para `medium` em modelos não adaptativos, enquanto `xhigh` e `max` recuam para o maior nível diferente de off compatível com o modelo selecionado.
  - Os modelos Anthropic Claude 4.6 usam `adaptive` por padrão quando nenhum nível de pensamento explícito é definido.
  - Anthropic Claude Opus 4.8 e Opus 4.7 mantêm o pensamento desativado, a menos que você defina explicitamente um nível de pensamento. O padrão de esforço pertencente ao provedor do Opus 4.8 é `high` após a ativação do pensamento adaptativo.
  - Anthropic Claude Opus 4.7+ mapeia `/think xhigh` para pensamento adaptativo mais `output_config.effort: "xhigh"`, pois `/think` é uma diretiva de pensamento e `xhigh` é a configuração de esforço do Opus.
  - Anthropic Claude Opus 4.7+ também disponibiliza `/think max`; ele é mapeado para o mesmo caminho de esforço máximo pertencente ao provedor.
  - Modelos DeepSeek V4 diretos disponibilizam `/think xhigh|max`; ambos são mapeados para `reasoning_effort: "max"` do DeepSeek, enquanto níveis inferiores diferentes de off são mapeados para `high`.
  - Modelos DeepSeek V4 roteados pelo OpenRouter disponibilizam `/think xhigh` e enviam valores de `reasoning.effort` compatíveis com o OpenRouter em vez do `reasoning_effort` de nível superior nativo do DeepSeek. Níveis inferiores diferentes de off são mapeados para `high`, e substituições `max` armazenadas recuam para `xhigh`.
  - Modelos do Ollama com capacidade de pensamento disponibilizam `/think low|medium|high|max`; `max` é mapeado para o `think: "high"` nativo porque a API nativa do Ollama aceita as strings de esforço `low`, `medium` e `high`.
  - Modelos OpenAI GPT mapeiam `/think` por meio do suporte a esforço específico do modelo na Responses API. `/think off` envia `reasoning.effort: "none"` somente quando o modelo de destino oferece suporte; caso contrário, o OpenClaw omite o payload de raciocínio desativado em vez de enviar um valor sem suporte.
  - GPT-5.6 Sol e Terra disponibilizam `/think ultra` nativo por meio do runtime Codex. GPT-5.6 Luna disponibiliza níveis até `max` porque seu catálogo Codex não anuncia Ultra.
  - O runtime incorporado do OpenClaw disponibiliza `/think ultra` lógico para GPT-5.6 Sol, Terra e Luna. Ele envia o esforço máximo do provedor e adiciona orientações de orquestração proativa de subagentes com escopo de execução.
  - Entradas personalizadas de catálogo compatíveis com OpenAI podem habilitar `/think xhigh` definindo `models.providers.<provider>.models[].compat.supportedReasoningEfforts` para incluir `"xhigh"`. Isso usa os mesmos metadados de compatibilidade que mapeiam os payloads de esforço de raciocínio OpenAI enviados, para que menus, validação de sessão, CLI do agente e `llm-task` estejam de acordo com o comportamento do transporte.
  - Referências obsoletas configuradas do OpenRouter Hunter Alpha ignoram a injeção de raciocínio do proxy porque essa rota descontinuada podia retornar o texto da resposta final por meio de campos de raciocínio.
  - O Google Gemini mapeia `/think adaptive` para o pensamento dinâmico pertencente ao provedor do Gemini. As solicitações do Gemini 3 omitem um `thinkingLevel` fixo, enquanto as solicitações do Gemini 2.5 enviam `thinkingBudget: -1`; níveis fixos ainda são mapeados para o `thinkingLevel` ou orçamento mais próximo para essa família de modelos.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) no caminho de streaming compatível com Anthropic usa `thinking: { type: "disabled" }` por padrão, a menos que você defina explicitamente o pensamento nos parâmetros do modelo ou da solicitação. Isso evita o vazamento de deltas de `reasoning_content` do formato de stream Anthropic não nativo do M2.x. MiniMax-M3 (e M3.x) está isento: o M3 emite blocos de pensamento Anthropic adequados e retorna conteúdo vazio quando o pensamento está desativado, portanto o OpenClaw mantém o M3 no caminho de pensamento omitido/adaptativo do provedor.
  - Z.AI (`zai/*`) é binário (`on`/`off`) para a maioria dos modelos GLM. GLM-5.2 é a exceção: ele disponibiliza `/think off|low|high|max`, mapeia `low` e `high` para `reasoning_effort: "high"` da Z.AI e mapeia `max` para `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) sempre pensa. Seu perfil disponibiliza apenas `on`, e o OpenClaw omite o campo `thinking` enviado, conforme exigido pela Moonshot. Outros modelos `moonshot/*` mapeiam `/think off` para `thinking: { type: "disabled" }` e qualquer nível diferente de `off` para `thinking: { type: "enabled" }`. Quando o pensamento está ativado, a Moonshot aceita apenas `tool_choice` `auto|none`; o OpenClaw normaliza valores incompatíveis para `auto`.

## Ordem de resolução

1. Diretiva em linha na mensagem (aplica-se somente a essa mensagem).
2. Substituição da sessão (definida pelo envio de uma mensagem contendo apenas a diretiva).
3. Padrão por agente (`agents.list[].thinkingDefault` na configuração).
4. Padrão global (`agents.defaults.thinkingDefault` na configuração).
5. Fallback: padrão declarado pelo provedor, quando disponível; caso contrário, os modelos com capacidade de raciocínio usam `medium` ou o nível compatível diferente de `off` mais próximo para esse modelo, e os modelos sem capacidade de raciocínio permanecem em `off`.

## Como definir um padrão para a sessão

- Envie uma mensagem que contenha **apenas** a diretiva (espaços em branco são permitidos), por exemplo, `/think:medium` ou `/t high`.
- Isso permanece válido para a sessão atual (por remetente, por padrão). Use `/think default` para remover a substituição da sessão e herdar o padrão configurado/do provedor; os aliases incluem `inherit`, `clear`, `reset` e `unpin`.
- `/think off` armazena uma substituição explícita de desativação. Isso desativa o raciocínio até que você altere ou remova a substituição da sessão.
- Uma resposta de confirmação é enviada (`Thinking level set to high.` / `Thinking disabled.`). Se o nível for inválido (por exemplo, `/thinking big`), o comando será rejeitado com uma dica, e o estado da sessão permanecerá inalterado.
- Envie `/think` (ou `/think:`) sem argumento para ver o nível atual de raciocínio.

## Aplicação por agente

- **OpenClaw incorporado**: o nível resolvido é passado para o runtime do agente OpenClaw no processo.
- **Backend da CLI Claude**: níveis concretos diferentes de desativado são passados ao Claude Code como `--effort` ao usar `claude-cli`; `adaptive` remove os sinalizadores de esforço configurados e delega o esforço efetivo ao ambiente, às configurações e aos padrões de modelo do Claude Code. Consulte [backends da CLI](/pt-BR/gateway/cli-backends).

## Modo rápido (/fast)

- Níveis: `auto|on|off|default`.
- Uma mensagem contendo somente a diretiva alterna uma substituição do modo rápido para a sessão e responde `Fast mode set to auto.`, `Fast mode enabled.` ou `Fast mode disabled.`. Use `/fast default` para limpar a substituição da sessão e herdar o padrão configurado; os aliases incluem `inherit`, `clear`, `reset` e `unpin`.
- Envie `/fast` (ou `/fast status`) sem um modo para ver o estado efetivo atual do modo rápido.
- O OpenClaw resolve o modo rápido nesta ordem:
  1. Substituição por `/fast auto|on|off` inline ou contendo somente a diretiva (`/fast default` limpa esta camada)
  2. Substituição da sessão
  3. Padrão por agente (`agents.list[].fastModeDefault`)
  4. Configuração por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- `auto` mantém o modo da sessão/configuração como automático, mas resolve cada nova chamada de modelo de forma independente. As chamadas iniciadas antes do limite automático ficam com o modo rápido ativado; chamadas posteriores de nova tentativa, fallback, resultado de ferramenta ou continuação começam com o modo rápido desativado. O limite padrão é de 60 segundos; defina `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` no modelo ativo para alterá-lo.
- Para `openai/*`, o modo rápido corresponde ao processamento prioritário da OpenAI, enviando `service_tier=priority` em solicitações Responses compatíveis.
- Para modelos `openai/*` / `openai-codex/*` com backend Codex, o modo rápido envia o mesmo sinalizador `service_tier=priority` nas Responses do Codex. Turnos nativos do app-server do Codex recebem o nível somente em `turn/start` ou no início/retomada da thread; portanto, `auto` não pode alterar o nível de um turno do app-server que já esteja em execução; ele se aplica ao próximo turno de modelo iniciado pelo OpenClaw.
- Para solicitações públicas diretas `anthropic/*`, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o modo rápido corresponde aos níveis de serviço da Anthropic: `/fast on` define `service_tier=auto`, enquanto `/fast off` define `service_tier=standard_only`.
- Para `minimax/*` no caminho compatível com a Anthropic, `/fast on` (ou `params.fastMode: true`) reescreve `MiniMax-M2.7` como `MiniMax-M2.7-highspeed`.
- Parâmetros explícitos de modelo `serviceTier` / `service_tier` da Anthropic substituem o padrão do modo rápido quando ambos estão definidos. O OpenClaw ainda ignora a injeção do nível de serviço da Anthropic para URLs-base de proxy que não sejam da Anthropic.
- `/status` mostra `Fast` quando o modo rápido está ativado e `Fast:auto` quando o modo configurado é automático.

## Diretivas de detalhamento (/verbose ou /v)

- Níveis: `on` (mínimo) | `full` | `off` (padrão).
- Uma mensagem contendo apenas a diretiva alterna o modo detalhado da sessão e responde com `Verbose logging enabled.` / `Verbose logging disabled.`; níveis inválidos retornam uma dica sem alterar o estado.
- `/verbose off` armazena uma substituição explícita para a sessão; remova-a pela interface de Sessões escolhendo `inherit`.
- Remetentes autorizados de canais externos podem persistir a substituição do modo detalhado da sessão. Clientes internos do Gateway/webchat precisam de `operator.admin` para persistir essa configuração.
- A diretiva em linha afeta apenas essa mensagem; caso contrário, aplicam-se os padrões da sessão/globais.
- Envie `/verbose` (ou `/verbose:`) sem argumento para ver o nível de detalhamento atual.
- Quando o modo detalhado está ativado, agentes que emitem resultados estruturados de ferramentas retornam cada chamada de ferramenta como uma mensagem separada contendo apenas metadados, prefixada com `<emoji> <tool-name>: <arg>` quando disponível. Esses resumos de ferramentas são enviados assim que cada ferramenta é iniciada (em balões separados), não como deltas de streaming.
- Os resumos de falhas de ferramentas permanecem visíveis no modo normal, mas os sufixos com detalhes brutos dos erros ficam ocultos, a menos que o modo detalhado esteja `full`.
- Quando o modo detalhado está `full`, as saídas das ferramentas também são encaminhadas após a conclusão (em um balão separado, truncadas para um tamanho seguro). Se você alternar `/verbose on|full|off` enquanto uma execução estiver em andamento, os balões de ferramentas subsequentes respeitarão a nova configuração.
- `agents.defaults.toolProgressDetail` controla o formato dos resumos de ferramentas de `/verbose` e das linhas de ferramentas nos rascunhos de progresso. Use `"explain"` (padrão) para rótulos concisos e legíveis, como `🛠️ Exec: checking JS syntax`; use `"raw"` quando também quiser acrescentar o comando ou detalhe bruto para depuração. A configuração `agents.list[].toolProgressDetail` específica de cada agente substitui o padrão.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Diretivas de rastreamento de Plugin (/trace)

- Níveis: `on` | `off` (padrão).
- Uma mensagem contendo apenas a diretiva alterna a saída de rastreamento de Plugins da sessão e responde com `Plugin trace enabled.` / `Plugin trace disabled.`.
- A diretiva em linha afeta apenas essa mensagem; caso contrário, aplicam-se os padrões da sessão/globais.
- Envie `/trace` (ou `/trace:`) sem argumento para ver o nível de rastreamento atual.
- `/trace` é mais restrito que `/verbose`: ele expõe apenas linhas de rastreamento/depuração pertencentes ao Plugin, como resumos de depuração do Active Memory.
- As linhas de rastreamento podem aparecer em `/status` e como uma mensagem de diagnóstico subsequente após a resposta normal do assistente.

## Visibilidade do raciocínio (/reasoning)

- Níveis: `on|off|stream`.
- Uma mensagem contendo apenas a diretiva alterna a exibição dos blocos de raciocínio nas respostas.
- Quando ativado, o raciocínio é enviado como uma **mensagem separada** prefixada por `Thinking`.
- `stream`: transmite o raciocínio enquanto a resposta está sendo gerada quando o canal ativo oferece suporte a prévias de raciocínio e, em seguida, envia a resposta final sem o raciocínio.
- Alias: `/reason`.
- Envie `/reasoning` (ou `/reasoning:`) sem argumento para ver o nível de raciocínio atual.
- Ordem de resolução: diretiva em linha, depois substituição da sessão, depois padrão por agente (`agents.list[].reasoningDefault`), depois padrão global (`agents.defaults.reasoningDefault`) e, por fim, valor de contingência (`off`).

Tags de raciocínio malformadas de modelos locais são tratadas de forma conservadora. Blocos `<think>...</think>` fechados permanecem ocultos nas respostas normais, e o raciocínio não fechado após texto já visível também é ocultado. Se uma resposta estiver totalmente envolvida por uma única tag de abertura não fechada e, caso contrário, fosse entregue como texto vazio, o OpenClaw removerá a tag de abertura malformada e entregará o texto restante.

## Relacionado

- A documentação do modo elevado está em [Modo elevado](/pt-BR/tools/elevated).

## Heartbeats

- O corpo da sondagem de Heartbeat é o prompt de Heartbeat configurado (padrão: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). As diretivas embutidas em uma mensagem de Heartbeat são aplicadas normalmente (mas evite alterar os padrões da sessão por meio de Heartbeats).
- Por padrão, a entrega de Heartbeat inclui apenas o payload final. Para também enviar a mensagem `Thinking` separada (quando disponível), defina `agents.defaults.heartbeat.includeReasoning: true` ou, por agente, `agents.list[].heartbeat.includeReasoning: true`.

## Interface de chat na web

- O seletor de nível de raciocínio do chat na web reflete o nível armazenado da sessão no armazenamento/configuração de sessões recebidas quando a página é carregada.
- A escolha de outro nível grava imediatamente a substituição da sessão por meio de `sessions.patch`; ela não aguarda o próximo envio e não é uma substituição `thinkingOnce` de uso único.
- O envio enquanto as alterações nos seletores de modelo, raciocínio ou velocidade ainda estão sendo aplicadas aguarda todas as atualizações pendentes dos seletores; se uma alteração falhar, a mensagem permanece sem ser enviada para revisão.
- A primeira opção é sempre a escolha para limpar a substituição. Ela mostra `Inherited: <resolved level>`, incluindo `Inherited: Off` quando o raciocínio herdado está desativado.
- As escolhas explícitas do seletor usam diretamente seus rótulos de nível, preservando os rótulos do provedor quando presentes (por exemplo, `Maximum` para uma opção `max` com rótulo do provedor).
- O seletor usa `thinkingLevels` retornado pela linha/pelos padrões da sessão no Gateway, mantendo `thinkingOptions` como uma lista de rótulos legada. A interface do navegador não mantém sua própria lista de expressões regulares de provedores; os plugins são responsáveis pelos conjuntos de níveis específicos de cada modelo.
- `/think:<level>` continua funcionando e atualiza o mesmo nível armazenado da sessão, mantendo sincronizados os comandos de chat e o seletor.

## Perfis de provedor

- Plugins de provedor podem expor `resolveThinkingProfile(ctx)` para definir os níveis compatíveis com o modelo e o padrão.
- Plugins de provedor que atuam como proxy para modelos Claude devem reutilizar `resolveClaudeThinkingProfile(modelId)` de `openclaw/plugin-sdk/provider-model-shared` para manter alinhados os catálogos da Anthropic direta e dos proxies.
- Cada nível de perfil tem um `id` canônico armazenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` ou `ultra`) e pode incluir um `label` de exibição. Provedores binários usam `{ id: "low", label: "on" }`.
- Os hooks de perfil recebem os dados mesclados do catálogo quando disponíveis, incluindo `reasoning`, `compat.thinkingFormat` e `compat.supportedReasoningEfforts`. Use esses dados para expor perfis binários ou personalizados somente quando o contrato da solicitação configurada for compatível com o payload correspondente.
- Plugins de ferramenta que precisam validar uma substituição explícita de raciocínio devem usar `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` em conjunto com `api.runtime.agent.normalizeThinkingLevel(...)`; eles não devem manter listas próprias de níveis por provedor/modelo. Passe `agentRuntime` quando a ferramenta for responsável pelo caminho de execução, como em uma execução sempre incorporada.
- Plugins de ferramenta com acesso aos metadados configurados de modelos personalizados podem passar `catalog` para `resolveThinkingPolicy`, para que as adesões de `compat.supportedReasoningEfforts` sejam refletidas na validação realizada pelo Plugin.
- Os hooks legados publicados (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) permanecem como adaptadores de compatibilidade, mas novos conjuntos de níveis personalizados devem usar `resolveThinkingProfile`.
- As linhas e os padrões do Gateway expõem `thinkingLevels`, `thinkingOptions` e `thinkingDefault` para que clientes ACP/de chat renderizem os mesmos ids e rótulos de perfil usados pela validação em tempo de execução.
