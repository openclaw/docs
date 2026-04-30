---
read_when:
    - Ajustar a análise sintática ou os padrões das diretivas thinking, fast-mode ou verbose
summary: Sintaxe de diretiva para /think, /fast, /verbose, /trace e visibilidade do raciocínio
title: Níveis de raciocínio
x-i18n:
    generated_at: "2026-04-30T10:12:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9fabead8d2f58fc5bce3bf8b281ad9d52da2cd02ba2777bc1597359537b7705
    source_path: tools/thinking.md
    workflow: 16
---

## O que faz

- Diretiva inline em qualquer corpo recebido: `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Níveis (apelidos): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “pense”
  - low → “pense bastante”
  - medium → “pense mais a fundo”
  - high → “ultrathink” (orçamento máximo)
  - xhigh → “ultrathink+” (modelos GPT-5.2+ e Codex, além do esforço Anthropic Claude Opus 4.7)
  - adaptive → pensamento adaptativo gerenciado pelo provedor (compatível com Claude 4.6 na Anthropic/Bedrock, Anthropic Claude Opus 4.7 e pensamento dinâmico do Google Gemini)
  - max → raciocínio máximo do provedor (Anthropic Claude Opus 4.7; o Ollama mapeia isso para seu maior esforço `think` nativo)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` mapeiam para `xhigh`.
  - `highest` mapeia para `high`.
- Observações sobre provedores:
  - Menus e seletores de pensamento são orientados pelo perfil do provedor. Os plugins de provedor declaram o conjunto exato de níveis para o modelo selecionado, incluindo rótulos como o `on` binário.
  - `adaptive`, `xhigh` e `max` só são anunciados para perfis de provedor/modelo que oferecem suporte a eles. Diretivas digitadas para níveis não compatíveis são rejeitadas com as opções válidas desse modelo.
  - Níveis não compatíveis já armazenados são remapeados pela classificação do perfil do provedor. `adaptive` recua para `medium` em modelos não adaptativos, enquanto `xhigh` e `max` recuam para o maior nível não `off` compatível com o modelo selecionado.
  - Modelos Anthropic Claude 4.6 usam `adaptive` por padrão quando nenhum nível explícito de pensamento é definido.
  - Anthropic Claude Opus 4.7 não usa pensamento adaptativo por padrão. O padrão de esforço da API dele continua pertencendo ao provedor, a menos que você defina explicitamente um nível de pensamento.
  - Anthropic Claude Opus 4.7 mapeia `/think xhigh` para pensamento adaptativo mais `output_config.effort: "xhigh"`, porque `/think` é uma diretiva de pensamento e `xhigh` é a configuração de esforço do Opus 4.7.
  - Anthropic Claude Opus 4.7 também expõe `/think max`; ele mapeia para o mesmo caminho de esforço máximo pertencente ao provedor.
  - Modelos Ollama com suporte a pensamento expõem `/think low|medium|high|max`; `max` mapeia para `think: "high"` nativo porque a API nativa do Ollama aceita as strings de esforço `low`, `medium` e `high`.
  - Modelos OpenAI GPT mapeiam `/think` pelo suporte a esforço específico do modelo na Responses API. `/think off` envia `reasoning.effort: "none"` somente quando o modelo de destino oferece suporte a isso; caso contrário, o OpenClaw omite o payload de raciocínio desativado em vez de enviar um valor não compatível.
  - Entradas de catálogo personalizadas compatíveis com OpenAI podem optar por `/think xhigh` definindo `models.providers.<provider>.models[].compat.supportedReasoningEfforts` para incluir `"xhigh"`. Isso usa os mesmos metadados de compatibilidade que mapeiam payloads de esforço de raciocínio OpenAI de saída, para que menus, validação de sessão, CLI do agente e `llm-task` estejam alinhados com o comportamento de transporte.
  - Referências configuradas obsoletas do OpenRouter Hunter Alpha pulam a injeção de raciocínio do proxy porque essa rota descontinuada podia retornar texto de resposta final por campos de raciocínio.
  - Google Gemini mapeia `/think adaptive` para o pensamento dinâmico pertencente ao provedor do Gemini. Solicitações Gemini 3 omitem um `thinkingLevel` fixo, enquanto solicitações Gemini 2.5 enviam `thinkingBudget: -1`; níveis fixos ainda mapeiam para o `thinkingLevel` ou orçamento Gemini mais próximo para essa família de modelos.
  - MiniMax (`minimax/*`) no caminho de streaming compatível com Anthropic usa por padrão `thinking: { type: "disabled" }`, a menos que você defina explicitamente pensamento nos parâmetros do modelo ou da solicitação. Isso evita deltas vazados de `reasoning_content` do formato de stream Anthropic não nativo da MiniMax.
  - Z.AI (`zai/*`) só oferece suporte a pensamento binário (`on`/`off`). Qualquer nível não `off` é tratado como `on` (mapeado para `low`).
  - Moonshot (`moonshot/*`) mapeia `/think off` para `thinking: { type: "disabled" }` e qualquer nível não `off` para `thinking: { type: "enabled" }`. Quando o pensamento está ativado, a Moonshot aceita apenas `tool_choice` `auto|none`; o OpenClaw normaliza valores incompatíveis para `auto`.

## Ordem de resolução

1. Diretiva inline na mensagem (aplica-se somente a essa mensagem).
2. Substituição da sessão (definida ao enviar uma mensagem contendo apenas a diretiva).
3. Padrão por agente (`agents.list[].thinkingDefault` na configuração).
4. Padrão global (`agents.defaults.thinkingDefault` na configuração).
5. Fallback: padrão declarado pelo provedor quando disponível; caso contrário, modelos com capacidade de raciocínio resolvem para `medium` ou para o nível não `off` compatível mais próximo desse modelo, e modelos sem raciocínio permanecem `off`.

## Definindo um padrão de sessão

- Envie uma mensagem que seja **somente** a diretiva (espaços em branco são permitidos), por exemplo, `/think:medium` ou `/t high`.
- Isso permanece para a sessão atual (por remetente, por padrão); é limpo por `/think:off` ou por redefinição de ociosidade da sessão.
- Uma resposta de confirmação é enviada (`Thinking level set to high.` / `Thinking disabled.`). Se o nível for inválido (por exemplo, `/thinking big`), o comando é rejeitado com uma dica e o estado da sessão permanece inalterado.
- Envie `/think` (ou `/think:`) sem argumento para ver o nível de pensamento atual.

## Aplicação por agente

- **Pi incorporado**: o nível resolvido é passado para o runtime do agente Pi em processo.

## Modo rápido (/fast)

- Níveis: `on|off`.
- Mensagem contendo apenas a diretiva alterna uma substituição de modo rápido da sessão e responde `Fast mode enabled.` / `Fast mode disabled.`.
- Envie `/fast` (ou `/fast status`) sem modo para ver o estado efetivo atual do modo rápido.
- O OpenClaw resolve o modo rápido nesta ordem:
  1. `/fast on|off` inline/contendo apenas a diretiva
  2. Substituição da sessão
  3. Padrão por agente (`agents.list[].fastModeDefault`)
  4. Configuração por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Para `openai/*`, o modo rápido mapeia para o processamento prioritário da OpenAI enviando `service_tier=priority` em solicitações Responses compatíveis.
- Para `openai-codex/*`, o modo rápido envia a mesma flag `service_tier=priority` nas Responses do Codex. O OpenClaw mantém uma alternância `/fast` compartilhada entre os dois caminhos de autenticação.
- Para solicitações públicas diretas `anthropic/*`, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o modo rápido mapeia para níveis de serviço da Anthropic: `/fast on` define `service_tier=auto`, `/fast off` define `service_tier=standard_only`.
- Para `minimax/*` no caminho compatível com Anthropic, `/fast on` (ou `params.fastMode: true`) reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.
- Parâmetros explícitos de modelo Anthropic `serviceTier` / `service_tier` substituem o padrão do modo rápido quando ambos estão definidos. O OpenClaw ainda pula a injeção de nível de serviço Anthropic para URLs base de proxy não Anthropic.
- `/status` mostra `Fast` somente quando o modo rápido está ativado.

## Diretivas detalhadas (/verbose ou /v)

- Níveis: `on` (mínimo) | `full` | `off` (padrão).
- Mensagem contendo apenas a diretiva alterna o detalhamento da sessão e responde `Verbose logging enabled.` / `Verbose logging disabled.`; níveis inválidos retornam uma dica sem alterar o estado.
- `/verbose off` armazena uma substituição explícita da sessão; limpe-a pela UI de Sessões escolhendo `inherit`.
- Diretiva inline afeta somente essa mensagem; padrões de sessão/globais se aplicam nos demais casos.
- Envie `/verbose` (ou `/verbose:`) sem argumento para ver o nível detalhado atual.
- Quando o modo detalhado está ligado, agentes que emitem resultados estruturados de ferramentas (Pi, outros agentes JSON) enviam cada chamada de ferramenta de volta como sua própria mensagem somente de metadados, prefixada com `<emoji> <tool-name>: <arg>` quando disponível (caminho/comando). Esses resumos de ferramentas são enviados assim que cada ferramenta inicia (bolhas separadas), não como deltas de streaming.
- Resumos de falha de ferramentas permanecem visíveis no modo normal, mas sufixos de detalhe de erro bruto ficam ocultos, a menos que o detalhamento esteja `on` ou `full`.
- Quando o detalhamento está `full`, saídas de ferramentas também são encaminhadas após a conclusão (bolha separada, truncada para um tamanho seguro). Se você alternar `/verbose on|full|off` enquanto uma execução está em andamento, bolhas de ferramentas subsequentes respeitam a nova configuração.

## Diretivas de rastreamento de Plugin (/trace)

- Níveis: `on` | `off` (padrão).
- Mensagem contendo apenas a diretiva alterna a saída de rastreamento de Plugin da sessão e responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- Diretiva inline afeta somente essa mensagem; padrões de sessão/globais se aplicam nos demais casos.
- Envie `/trace` (ou `/trace:`) sem argumento para ver o nível de rastreamento atual.
- `/trace` é mais restrito que `/verbose`: ele expõe somente linhas de rastreamento/depuração pertencentes a plugins, como resumos de depuração de Active Memory.
- Linhas de rastreamento podem aparecer em `/status` e como uma mensagem diagnóstica de acompanhamento após a resposta normal do assistente.

## Visibilidade do raciocínio (/reasoning)

- Níveis: `on|off|stream`.
- Mensagem contendo apenas a diretiva alterna se blocos de pensamento são exibidos nas respostas.
- Quando ativado, o raciocínio é enviado como uma **mensagem separada** prefixada com `Reasoning:`.
- `stream` (somente Telegram): transmite o raciocínio para a bolha de rascunho do Telegram enquanto a resposta é gerada e depois envia a resposta final sem raciocínio.
- Alias: `/reason`.
- Envie `/reasoning` (ou `/reasoning:`) sem argumento para ver o nível de raciocínio atual.
- Ordem de resolução: diretiva inline, depois substituição da sessão, depois padrão por agente (`agents.list[].reasoningDefault`), depois fallback (`off`).

Tags de raciocínio de modelo local malformadas são tratadas de forma conservadora. Blocos fechados `<think>...</think>` permanecem ocultos em respostas normais, e raciocínio não fechado após texto já visível também fica oculto. Se uma resposta estiver totalmente envolvida em uma única tag de abertura não fechada e, de outra forma, seria entregue como texto vazio, o OpenClaw remove a tag de abertura malformada e entrega o texto restante.

## Relacionado

- A documentação do modo elevado está em [Modo elevado](/pt-BR/tools/elevated).

## Heartbeats

- O corpo da sondagem de Heartbeat é o prompt de Heartbeat configurado (padrão: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Diretivas inline em uma mensagem de Heartbeat se aplicam normalmente (mas evite alterar padrões de sessão a partir de Heartbeats).
- A entrega de Heartbeat usa por padrão somente o payload final. Para também enviar a mensagem `Reasoning:` separada (quando disponível), defina `agents.defaults.heartbeat.includeReasoning: true` ou `agents.list[].heartbeat.includeReasoning: true` por agente.

## UI do chat web

- O seletor de pensamento do chat web espelha o nível armazenado da sessão a partir do armazenamento/configuração da sessão recebida quando a página carrega.
- Escolher outro nível grava a substituição da sessão imediatamente via `sessions.patch`; ele não espera o próximo envio e não é uma substituição `thinkingOnce` de uso único.
- A primeira opção é sempre `Default (<resolved level>)`, onde o padrão resolvido vem do perfil de pensamento do provedor do modelo da sessão ativa mais a mesma lógica de fallback que `/status` e `session_status` usam.
- O seletor usa `thinkingLevels` retornado pela linha/padrões de sessão do Gateway, com `thinkingOptions` mantido como uma lista legada de rótulos. A UI do navegador não mantém sua própria lista de regex de provedores; os plugins são responsáveis pelos conjuntos de níveis específicos do modelo.
- `/think:<level>` ainda funciona e atualiza o mesmo nível de sessão armazenado, para que diretivas de chat e o seletor permaneçam sincronizados.

## Perfis de provedor

- Plugins de provedor podem expor `resolveThinkingProfile(ctx)` para definir os níveis compatíveis do modelo e o padrão.
- Plugins de provedor que fazem proxy de modelos Claude devem reutilizar `resolveClaudeThinkingProfile(modelId)` de `openclaw/plugin-sdk/provider-model-shared` para que os catálogos diretos da Anthropic e de proxy permaneçam alinhados.
- Cada nível de perfil tem um `id` canônico armazenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` ou `max`) e pode incluir um `label` de exibição. Provedores binários usam `{ id: "low", label: "on" }`.
- Plugins de ferramenta que precisam validar uma substituição explícita de raciocínio devem usar `api.runtime.agent.resolveThinkingPolicy({ provider, model })` mais `api.runtime.agent.normalizeThinkingLevel(...)`; eles não devem manter suas próprias listas de níveis de provedor/modelo.
- Plugins de ferramenta com acesso a metadados configurados de modelo personalizado podem passar `catalog` para `resolveThinkingPolicy` para que adesões em `compat.supportedReasoningEfforts` sejam refletidas na validação do lado do Plugin.
- Hooks legados publicados (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) permanecem como adaptadores de compatibilidade, mas novos conjuntos de níveis personalizados devem usar `resolveThinkingProfile`.
- Linhas/padrões do Gateway expõem `thinkingLevels`, `thinkingOptions` e `thinkingDefault` para que clientes de ACP/bate-papo renderizem os mesmos ids e rótulos de perfil que a validação em tempo de execução usa.
