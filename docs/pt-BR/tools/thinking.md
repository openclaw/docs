---
read_when:
    - Ajuste da análise de diretivas ou dos padrões de raciocínio, modo rápido ou detalhado
summary: Sintaxe de diretivas para /think, /fast, /verbose, /trace e visibilidade do raciocínio
title: Níveis de raciocínio
x-i18n:
    generated_at: "2026-07-12T00:29:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75170dd48f83dcb3ebb70eea2b37160208618d0aae23253c82fe88ce3afbc0e2
    source_path: tools/thinking.md
    workflow: 16
---

## O que faz

- Diretiva inline em qualquer corpo de mensagem recebida: `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Níveis (aliases): `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`, correspondendo aproximadamente à escala clássica de palavras mágicas da Anthropic, "think" < "think hard" < "think harder" < "ultrathink":
  - minimal ~ "pensar"
  - low ~ "pensar bastante"
  - medium ~ "pensar mais"
  - high ~ "ultrathink" (orçamento máximo)
  - xhigh ~ "ultrathink+" (modelos GPT-5.2+ e Codex, além do nível de esforço do Anthropic Claude Opus 4.7+)
  - adaptive → raciocínio adaptativo gerenciado pelo provedor (compatível com Claude 4.6 na Anthropic/Bedrock, Anthropic Claude Opus 4.7+ e raciocínio dinâmico do Google Gemini)
  - max → raciocínio máximo do provedor (Anthropic Claude Opus 4.7+; o Ollama mapeia isso para seu maior nível de esforço nativo de `think`)
  - ultra → raciocínio máximo do provedor mais orquestração proativa de subagentes quando o modelo/runtime selecionado oferece suporte
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` são mapeados para `xhigh`.
  - `highest` é mapeado para `high`.
- Observações sobre provedores:
  - Os menus e seletores de raciocínio são definidos pelo perfil do provedor. Os plugins de provedor declaram o conjunto exato de níveis para o modelo selecionado, incluindo rótulos como o binário `on`.
  - `adaptive`, `xhigh`, `max` e `ultra` são anunciados apenas para perfis de provedor/modelo/runtime compatíveis. Diretivas digitadas com níveis não compatíveis são rejeitadas e as opções válidas do modelo são apresentadas.
  - Níveis armazenados existentes que não sejam compatíveis são remapeados pela classificação do perfil do provedor. `adaptive` retorna para `medium` em modelos não adaptativos, enquanto `xhigh` e `max` retornam para o maior nível diferente de `off` compatível com o modelo selecionado.
  - Os modelos Anthropic Claude 4.6 usam `adaptive` por padrão quando nenhum nível de raciocínio é definido explicitamente.
  - Anthropic Claude Opus 4.8 e Opus 4.7 mantêm o raciocínio desativado, a menos que você defina explicitamente um nível de raciocínio. O padrão de esforço controlado pelo provedor do Opus 4.8 é `high` após a ativação do raciocínio adaptativo.
  - O Anthropic Claude Opus 4.7+ mapeia `/think xhigh` para raciocínio adaptativo mais `output_config.effort: "xhigh"`, pois `/think` é uma diretiva de raciocínio e `xhigh` é a configuração de esforço do Opus.
  - O Anthropic Claude Opus 4.7+ também oferece `/think max`; ele é mapeado para o mesmo caminho de esforço máximo controlado pelo provedor.
  - Os modelos DeepSeek V4 diretos oferecem `/think xhigh|max`; ambos são mapeados para `reasoning_effort: "max"` do DeepSeek, enquanto níveis inferiores diferentes de `off` são mapeados para `high`.
  - Os modelos DeepSeek V4 roteados pelo OpenRouter oferecem `/think xhigh` e enviam valores de `reasoning.effort` compatíveis com o OpenRouter em vez do `reasoning_effort` nativo de nível superior do DeepSeek. Níveis inferiores diferentes de `off` são mapeados para `high`, e substituições armazenadas como `max` retornam para `xhigh`.
  - Os modelos do Ollama compatíveis com raciocínio oferecem `/think low|medium|high|max`; `max` é mapeado para o valor nativo `think: "high"`, pois a API nativa do Ollama aceita as strings de esforço `low`, `medium` e `high`.
  - Os modelos OpenAI GPT mapeiam `/think` por meio do suporte a esforço específico de cada modelo na Responses API. `/think off` envia `reasoning.effort: "none"` somente quando o modelo de destino oferece suporte; caso contrário, o OpenClaw omite o payload de raciocínio desativado em vez de enviar um valor incompatível.
  - GPT-5.6 Sol e Terra oferecem `/think ultra` nativo por meio do runtime do Codex. O GPT-5.6 Luna oferece níveis até `max`, pois seu catálogo do Codex não anuncia Ultra.
  - O runtime incorporado do OpenClaw oferece `/think ultra` lógico para GPT-5.6 Sol, Terra e Luna. Ele envia o esforço máximo do provedor e adiciona orientações de orquestração proativa de subagentes limitadas à execução.
  - Entradas personalizadas de catálogo compatíveis com a OpenAI podem habilitar `/think xhigh` definindo `models.providers.<provider>.models[].compat.supportedReasoningEfforts` para incluir `"xhigh"`. Isso usa os mesmos metadados de compatibilidade que mapeiam payloads de esforço de raciocínio enviados à OpenAI, fazendo com que menus, validação de sessão, CLI do agente e `llm-task` concordem com o comportamento do transporte.
  - Referências configuradas e obsoletas do OpenRouter Hunter Alpha ignoram a injeção de raciocínio do proxy porque essa rota descontinuada poderia retornar o texto da resposta final por meio dos campos de raciocínio.
  - O Google Gemini mapeia `/think adaptive` para o raciocínio dinâmico controlado pelo provedor do Gemini. As solicitações do Gemini 3 omitem um `thinkingLevel` fixo, enquanto as solicitações do Gemini 2.5 enviam `thinkingBudget: -1`; níveis fixos ainda são mapeados para o `thinkingLevel` ou orçamento mais próximo para essa família de modelos.
  - O MiniMax M2.x (`minimax/MiniMax-M2*`) no caminho de streaming compatível com a Anthropic usa `thinking: { type: "disabled" }` por padrão, a menos que você defina explicitamente o raciocínio nos parâmetros do modelo ou da solicitação. Isso evita o vazamento de deltas de `reasoning_content` do formato de stream não nativo da Anthropic usado pelo M2.x. O MiniMax-M3 (e M3.x) está isento: o M3 emite blocos de raciocínio adequados da Anthropic e retorna conteúdo vazio quando o raciocínio está desativado, portanto o OpenClaw mantém o M3 no caminho de raciocínio omitido/adaptativo do provedor.
  - O Z.AI (`zai/*`) é binário (`on`/`off`) para a maioria dos modelos GLM. O GLM-5.2 é a exceção: ele oferece `/think off|low|high|max`, mapeia `low` e `high` para `reasoning_effort: "high"` do Z.AI e mapeia `max` para `reasoning_effort: "max"`.
  - O Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) sempre raciocina. Seu perfil oferece apenas `on`, e o OpenClaw omite o campo `thinking` enviado, conforme exigido pelo Moonshot. Outros modelos `moonshot/*` mapeiam `/think off` para `thinking: { type: "disabled" }` e qualquer nível diferente de `off` para `thinking: { type: "enabled" }`. Quando o raciocínio está ativado, o Moonshot aceita apenas `tool_choice` `auto|none`; o OpenClaw normaliza valores incompatíveis para `auto`.

## Ordem de resolução

1. Diretiva inline na mensagem (aplica-se somente a essa mensagem).
2. Substituição da sessão (definida enviando uma mensagem contendo apenas a diretiva).
3. Padrão por agente (`agents.list[].thinkingDefault` na configuração).
4. Padrão global (`agents.defaults.thinkingDefault` na configuração).
5. Fallback: padrão declarado pelo provedor quando disponível; caso contrário, modelos compatíveis com raciocínio são resolvidos como `medium` ou o nível diferente de `off` mais próximo compatível com esse modelo, e modelos sem raciocínio permanecem em `off`.

## Definição de um padrão de sessão

- Envie uma mensagem contendo **apenas** a diretiva (espaços em branco são permitidos), por exemplo, `/think:medium` ou `/t high`.
- Isso permanece válido para a sessão atual (por remetente, por padrão). Use `/think default` para remover a substituição da sessão e herdar o padrão configurado/do provedor; os aliases incluem `inherit`, `clear`, `reset` e `unpin`.
- `/think off` armazena uma substituição explícita de desativação. Ela desativa o raciocínio até você alterar ou remover a substituição da sessão.
- Uma resposta de confirmação é enviada (`Nível de raciocínio definido como alto.` / `Raciocínio desativado.`). Se o nível for inválido (por exemplo, `/thinking big`), o comando será rejeitado com uma dica e o estado da sessão permanecerá inalterado.
- Envie `/think` (ou `/think:`) sem argumento para ver o nível atual de raciocínio.

## Aplicação pelo agente

- **OpenClaw incorporado**: o nível resolvido é passado para o runtime do agente OpenClaw no processo.
- **Backend da CLI do Claude**: níveis concretos diferentes de `off` são passados ao Claude Code como `--effort` ao usar `claude-cli`; `adaptive` remove as flags de esforço configuradas e delega o esforço efetivo ao ambiente, às configurações e aos padrões de modelo do Claude Code. Consulte [backends de CLI](/pt-BR/gateway/cli-backends).

## Modo rápido (/fast)

- Níveis: `auto|on|off|default`.
- Uma mensagem contendo apenas a diretiva alterna uma substituição do modo rápido da sessão e responde `Modo rápido definido como automático.`, `Modo rápido ativado.` ou `Modo rápido desativado.`. Use `/fast default` para remover a substituição da sessão e herdar o padrão configurado; os aliases incluem `inherit`, `clear`, `reset` e `unpin`.
- Envie `/fast` (ou `/fast status`) sem modo para ver o estado efetivo atual do modo rápido.
- O OpenClaw resolve o modo rápido nesta ordem:
  1. Substituição inline/contendo apenas a diretiva `/fast auto|on|off` (`/fast default` remove esta camada)
  2. Substituição da sessão
  3. Padrão por agente (`agents.list[].fastModeDefault`)
  4. Configuração por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- `auto` mantém o modo da sessão/configuração como automático, mas resolve cada nova chamada de modelo de forma independente. Chamadas iniciadas antes do limite automático ficam com o modo rápido ativado; chamadas posteriores de nova tentativa, fallback, resultado de ferramenta ou continuação começam com o modo rápido desativado. O limite padrão é de 60 segundos; defina `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` no modelo ativo para alterá-lo.
- Para `openai/*`, o modo rápido é mapeado para o processamento prioritário da OpenAI, enviando `service_tier=priority` em solicitações compatíveis da Responses.
- Para modelos `openai/*` / `openai-codex/*` baseados no Codex, o modo rápido envia a mesma flag `service_tier=priority` nas Responses do Codex. Turnos nativos do servidor de aplicativo do Codex recebem o nível somente em `turn/start` ou no início/retomada do encadeamento; portanto, `auto` não pode alterar o nível de um turno do servidor de aplicativo que já esteja em execução; ele se aplica ao próximo turno do modelo iniciado pelo OpenClaw.
- Para solicitações públicas diretas a `anthropic/*`, incluindo tráfego autenticado via OAuth enviado para `api.anthropic.com`, o modo rápido é mapeado para os níveis de serviço da Anthropic: `/fast on` define `service_tier=auto`, e `/fast off` define `service_tier=standard_only`.
- Para `minimax/*` no caminho compatível com a Anthropic, `/fast on` (ou `params.fastMode: true`) reescreve `MiniMax-M2.7` como `MiniMax-M2.7-highspeed`.
- Parâmetros explícitos de modelo `serviceTier` / `service_tier` da Anthropic substituem o padrão do modo rápido quando ambos estão definidos. O OpenClaw ainda ignora a injeção do nível de serviço da Anthropic para URLs-base de proxy que não sejam da Anthropic.
- `/status` mostra `Rápido` quando o modo rápido está ativado e `Rápido:auto` quando o modo configurado é automático.

## Diretivas de detalhamento (/verbose ou /v)

- Níveis: `on` (mínimo) | `full` | `off` (padrão).
- Uma mensagem contendo apenas a diretiva alterna o detalhamento da sessão e responde `Registro detalhado ativado.` / `Registro detalhado desativado.`; níveis inválidos retornam uma dica sem alterar o estado.
- `/verbose off` armazena uma substituição explícita da sessão; remova-a na interface de Sessões escolhendo `inherit`.
- Remetentes autorizados de canais externos podem persistir a substituição de detalhamento da sessão. Clientes internos do gateway/webchat precisam de `operator.admin` para persistir essa substituição.
- A diretiva inline afeta somente essa mensagem; caso contrário, os padrões da sessão/globais são aplicados.
- Envie `/verbose` (ou `/verbose:`) sem argumento para ver o nível atual de detalhamento.
- Quando o detalhamento está ativado, agentes que emitem resultados estruturados de ferramentas enviam cada chamada de ferramenta como uma mensagem separada contendo apenas metadados, prefixada com `<emoji> <tool-name>: <arg>` quando disponível. Esses resumos de ferramentas são enviados assim que cada ferramenta é iniciada (em balões separados), não como deltas de streaming.
- Os resumos de falhas de ferramentas permanecem visíveis no modo normal, mas os sufixos com detalhes brutos dos erros ficam ocultos, a menos que o detalhamento seja `full`.
- Quando o detalhamento é `full`, as saídas das ferramentas também são encaminhadas após a conclusão (em um balão separado, truncadas para um tamanho seguro). Se você alternar `/verbose on|full|off` enquanto uma execução estiver em andamento, os balões de ferramentas posteriores respeitarão a nova configuração.
- `agents.defaults.toolProgressDetail` controla o formato dos resumos de ferramentas de `/verbose` e das linhas de ferramentas nos rascunhos de progresso. Use `"explain"` (padrão) para rótulos humanos compactos, como `🛠️ Exec: verificando a sintaxe de JS`; use `"raw"` quando também quiser que o comando/detalhe bruto seja anexado para depuração. `agents.list[].toolProgressDetail` por agente substitui o padrão.
  - `explain`: `🛠️ Exec: verificar a sintaxe de JS de /tmp/app.js`
  - `raw`: `🛠️ Exec: verificar a sintaxe de JS de /tmp/app.js, node --check /tmp/app.js`

## Diretivas de rastreamento de Plugin (/trace)

- Níveis: `on` | `off` (padrão).
- Uma mensagem contendo apenas a diretiva alterna a saída de rastreamento de plugins da sessão e responde `Rastreamento de Plugin ativado.` / `Rastreamento de Plugin desativado.`.
- A diretiva inline afeta somente essa mensagem; caso contrário, os padrões da sessão/globais são aplicados.
- Envie `/trace` (ou `/trace:`) sem argumento para ver o nível atual de rastreamento.
- `/trace` é mais restrito que `/verbose`: ele expõe somente linhas de rastreamento/depuração pertencentes a plugins, como resumos de depuração da Active Memory.
- As linhas de rastreamento podem aparecer em `/status` e como uma mensagem de diagnóstico complementar após a resposta normal do assistente.

## Visibilidade do raciocínio (/reasoning)

- Níveis: `on|off|stream`.
- A mensagem contendo apenas a diretiva alterna se os blocos de raciocínio são exibidos nas respostas.
- Quando ativado, o raciocínio é enviado como uma **mensagem separada** com o prefixo `Thinking`.
- `stream`: transmite o raciocínio enquanto a resposta está sendo gerada quando o canal ativo oferece suporte a prévias de raciocínio e, em seguida, envia a resposta final sem o raciocínio.
- Alias: `/reason`.
- Envie `/reasoning` (ou `/reasoning:`) sem argumento para ver o nível de raciocínio atual.
- Ordem de resolução: diretiva em linha, depois substituição da sessão, depois padrão por agente (`agents.list[].reasoningDefault`), depois padrão global (`agents.defaults.reasoningDefault`) e, por fim, valor de contingência (`off`).

Tags de raciocínio malformadas de modelos locais são tratadas de forma conservadora. Blocos `<think>...</think>` fechados permanecem ocultos em respostas normais, e o raciocínio não fechado após texto já visível também é ocultado. Se uma resposta estiver totalmente envolvida por uma única tag de abertura não fechada e, de outra forma, fosse entregue como texto vazio, o OpenClaw removerá a tag de abertura malformada e entregará o texto restante.

## Relacionado

- A documentação do modo elevado está em [Modo elevado](/pt-BR/tools/elevated).

## Heartbeats

- O corpo da sondagem do Heartbeat é o prompt de Heartbeat configurado (padrão: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Diretivas em linha em uma mensagem de Heartbeat são aplicadas normalmente (mas evite alterar os padrões da sessão a partir de Heartbeats).
- Por padrão, a entrega do Heartbeat inclui apenas o conteúdo final. Para também enviar a mensagem `Thinking` separada (quando disponível), defina `agents.defaults.heartbeat.includeReasoning: true` ou, por agente, `agents.list[].heartbeat.includeReasoning: true`.

## Interface de chat na web

- O seletor de raciocínio do chat na web reflete o nível armazenado da sessão no armazenamento/configuração da sessão de entrada quando a página é carregada.
- Escolher outro nível grava imediatamente a substituição da sessão por meio de `sessions.patch`; não aguarda o próximo envio nem é uma substituição `thinkingOnce` de uso único.
- Enviar enquanto as alterações nos seletores de modelo, raciocínio ou velocidade ainda estão sendo aplicadas aguarda todas as atualizações pendentes dos seletores; se uma alteração falhar, a mensagem permanece sem ser enviada para revisão.
- A primeira opção é sempre a escolha para limpar a substituição. Ela exibe `Inherited: <resolved level>`, incluindo `Inherited: Off` quando o raciocínio herdado está desativado.
- As escolhas explícitas do seletor usam os rótulos diretos de seus níveis, preservando os rótulos do provedor quando presentes (por exemplo, `Maximum` para uma opção `max` rotulada pelo provedor).
- O seletor usa `thinkingLevels` retornado pela linha/pelos padrões da sessão do Gateway, mantendo `thinkingOptions` como uma lista de rótulos legada. A interface do navegador não mantém sua própria lista de expressões regulares de provedores; os plugins são responsáveis pelos conjuntos de níveis específicos de cada modelo.
- `/think:<level>` continua funcionando e atualiza o mesmo nível armazenado da sessão, mantendo sincronizados as diretivas do chat e o seletor.

## Perfis de provedores

- Os plugins de provedores podem expor `resolveThinkingProfile(ctx)` para definir os níveis compatíveis com o modelo e o padrão.
- Os plugins de provedores que atuam como proxy para modelos Claude devem reutilizar `resolveClaudeThinkingProfile(modelId)` de `openclaw/plugin-sdk/provider-model-shared` para manter alinhados os catálogos diretos da Anthropic e os catálogos de proxy.
- Cada nível do perfil tem um `id` canônico armazenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` ou `ultra`) e pode incluir um `label` de exibição. Provedores binários usam `{ id: "low", label: "on" }`.
- Os hooks de perfil recebem fatos mesclados do catálogo quando disponíveis, incluindo `reasoning`, `compat.thinkingFormat` e `compat.supportedReasoningEfforts`. Use esses fatos para expor perfis binários ou personalizados somente quando o contrato de solicitação configurado for compatível com o conteúdo correspondente.
- Os plugins de ferramentas que precisam validar uma substituição explícita de raciocínio devem usar `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` junto com `api.runtime.agent.normalizeThinkingLevel(...)`; eles não devem manter suas próprias listas de níveis por provedor/modelo. Passe `agentRuntime` quando a ferramenta for responsável pelo caminho de execução, como em uma execução sempre incorporada.
- Os plugins de ferramentas com acesso aos metadados configurados de modelos personalizados podem passar `catalog` para `resolveThinkingPolicy`, para que as adesões de `compat.supportedReasoningEfforts` sejam refletidas na validação feita pelo plugin.
- Os hooks legados publicados (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) permanecem como adaptadores de compatibilidade, mas novos conjuntos de níveis personalizados devem usar `resolveThinkingProfile`.
- As linhas/os padrões do Gateway expõem `thinkingLevels`, `thinkingOptions` e `thinkingDefault` para que os clientes ACP/chat renderizem os mesmos identificadores e rótulos de perfil usados pela validação em tempo de execução.
