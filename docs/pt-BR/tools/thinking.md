---
read_when:
    - Ajustando parsing ou padrões de diretivas de thinking, modo rápido ou verbose
summary: Sintaxe de diretiva para /think, /fast, /verbose, /trace e visibilidade de reasoning
title: Níveis de pensamento
x-i18n:
    generated_at: "2026-04-25T13:58:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0537f10d3dd3251ac41590bebd2d83ba8b2562725c322040b20f32547c8af88d
    source_path: tools/thinking.md
    workflow: 15
---

## O que isso faz

- Diretiva inline em qualquer corpo de entrada: `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Níveis (aliases): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (orçamento máximo)
  - xhigh → “ultrathink+” (modelos GPT-5.2+ e Codex, além de esforço Anthropic Claude Opus 4.7)
  - adaptive → thinking adaptativo gerenciado pelo provedor (compatível com Claude 4.6 em Anthropic/Bedrock, Anthropic Claude Opus 4.7 e thinking dinâmico do Google Gemini)
  - max → reasoning máximo do provedor (atualmente Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` mapeiam para `xhigh`.
  - `highest` mapeia para `high`.
- Observações por provedor:
  - Menus e seletores de thinking são orientados por perfis de provedor. Plugins de provedor declaram o conjunto exato de níveis para o modelo selecionado, incluindo rótulos como `on` binário.
  - `adaptive`, `xhigh` e `max` só são anunciados para perfis de provedor/modelo que os suportam. Diretivas digitadas para níveis não compatíveis são rejeitadas com as opções válidas desse modelo.
  - Níveis não compatíveis já armazenados são remapeados por ranking de perfil do provedor. `adaptive` recorre a `medium` em modelos não adaptativos, enquanto `xhigh` e `max` recorrem ao maior nível compatível diferente de `off` para o modelo selecionado.
  - Modelos Anthropic Claude 4.6 usam `adaptive` por padrão quando nenhum nível explícito de thinking está definido.
  - Anthropic Claude Opus 4.7 não usa thinking adaptativo por padrão. O padrão de esforço da API continua pertencendo ao provedor, a menos que você defina explicitamente um nível de thinking.
  - Anthropic Claude Opus 4.7 mapeia `/think xhigh` para thinking adaptativo mais `output_config.effort: "xhigh"`, porque `/think` é uma diretiva de thinking e `xhigh` é a configuração de esforço do Opus 4.7.
  - Anthropic Claude Opus 4.7 também expõe `/think max`; ele mapeia para o mesmo caminho de esforço máximo pertencente ao provedor.
  - Modelos OpenAI GPT mapeiam `/think` pelo suporte específico do modelo à API Responses effort. `/think off` envia `reasoning.effort: "none"` apenas quando o modelo de destino o suporta; caso contrário, o OpenClaw omite o payload de reasoning desativado em vez de enviar um valor não compatível.
  - Google Gemini mapeia `/think adaptive` para o thinking dinâmico pertencente ao provedor do Gemini. Solicitações Gemini 3 omitem um `thinkingLevel` fixo, enquanto solicitações Gemini 2.5 enviam `thinkingBudget: -1`; níveis fixos ainda mapeiam para o `thinkingLevel` ou orçamento Gemini mais próximo para aquela família de modelos.
  - MiniMax (`minimax/*`) no caminho de streaming compatível com Anthropic usa por padrão `thinking: { type: "disabled" }`, a menos que você defina thinking explicitamente em parâmetros do modelo ou da solicitação. Isso evita vazamento de deltas `reasoning_content` do formato de streaming Anthropic não nativo do MiniMax.
  - Z.AI (`zai/*`) oferece suporte apenas a thinking binário (`on`/`off`). Qualquer nível diferente de `off` é tratado como `on` (mapeado para `low`).
  - Moonshot (`moonshot/*`) mapeia `/think off` para `thinking: { type: "disabled" }` e qualquer nível diferente de `off` para `thinking: { type: "enabled" }`. Quando o thinking está ativado, o Moonshot só aceita `tool_choice` `auto|none`; o OpenClaw normaliza valores incompatíveis para `auto`.

## Ordem de resolução

1. Diretiva inline na mensagem (aplica-se apenas a essa mensagem).
2. Substituição da sessão (definida ao enviar uma mensagem contendo apenas a diretiva).
3. Padrão por agente (`agents.list[].thinkingDefault` na configuração).
4. Padrão global (`agents.defaults.thinkingDefault` na configuração).
5. Fallback: padrão declarado pelo provedor quando disponível; caso contrário, modelos com capacidade de reasoning resolvem para `medium` ou o nível compatível mais próximo diferente de `off` para aquele modelo, e modelos sem reasoning permanecem em `off`.

## Definindo um padrão de sessão

- Envie uma mensagem que seja **apenas** a diretiva (espaços em branco permitidos), por exemplo `/think:medium` ou `/t high`.
- Isso permanece para a sessão atual (por remetente, por padrão); é limpo por `/think:off` ou redefinição por ociosidade da sessão.
- Uma resposta de confirmação é enviada (`Thinking level set to high.` / `Thinking disabled.`). Se o nível for inválido (por exemplo `/thinking big`), o comando é rejeitado com uma dica e o estado da sessão permanece inalterado.
- Envie `/think` (ou `/think:`) sem argumento para ver o nível atual de thinking.

## Aplicação por agente

- **Pi embutido**: o nível resolvido é passado para o runtime do agente Pi em processo.

## Modo rápido (/fast)

- Níveis: `on|off`.
- Uma mensagem contendo apenas a diretiva alterna uma substituição de modo rápido da sessão e responde `Fast mode enabled.` / `Fast mode disabled.`.
- Envie `/fast` (ou `/fast status`) sem modo para ver o estado efetivo atual do modo rápido.
- O OpenClaw resolve o modo rápido nesta ordem:
  1. `/fast on|off` inline/apenas diretiva
  2. Substituição da sessão
  3. Padrão por agente (`agents.list[].fastModeDefault`)
  4. Configuração por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Para `openai/*`, o modo rápido mapeia para processamento prioritário da OpenAI enviando `service_tier=priority` em solicitações Responses compatíveis.
- Para `openai-codex/*`, o modo rápido envia o mesmo sinalizador `service_tier=priority` em Codex Responses. O OpenClaw mantém um único toggle compartilhado `/fast` nas duas rotas de autenticação.
- Para solicitações públicas diretas `anthropic/*`, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o modo rápido mapeia para níveis de serviço Anthropic: `/fast on` define `service_tier=auto`, `/fast off` define `service_tier=standard_only`.
- Para `minimax/*` no caminho compatível com Anthropic, `/fast on` (ou `params.fastMode: true`) reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.
- Parâmetros explícitos `serviceTier` / `service_tier` do modelo Anthropic substituem o padrão do modo rápido quando ambos estão definidos. O OpenClaw ainda ignora a injeção de nível de serviço Anthropic para base URLs de proxy não Anthropic.
- `/status` mostra `Fast` apenas quando o modo rápido está ativado.

## Diretivas verbose (/verbose ou /v)

- Níveis: `on` (mínimo) | `full` | `off` (padrão).
- Uma mensagem contendo apenas a diretiva alterna o verbose da sessão e responde `Verbose logging enabled.` / `Verbose logging disabled.`; níveis inválidos retornam uma dica sem alterar o estado.
- `/verbose off` armazena uma substituição explícita da sessão; limpe-a pela UI de Sessions escolhendo `inherit`.
- A diretiva inline afeta apenas aquela mensagem; padrões de sessão/globais se aplicam caso contrário.
- Envie `/verbose` (ou `/verbose:`) sem argumento para ver o nível atual de verbose.
- Quando verbose está ativado, agentes que emitem resultados estruturados de ferramentas (Pi, outros agentes JSON) enviam cada chamada de ferramenta de volta como sua própria mensagem apenas de metadados, prefixada com `<emoji> <tool-name>: <arg>` quando disponível (caminho/comando). Esses resumos de ferramenta são enviados assim que cada ferramenta começa (bolhas separadas), não como deltas de streaming.
- Resumos de falha de ferramenta permanecem visíveis no modo normal, mas sufixos de detalhe bruto de erro ficam ocultos, a menos que verbose seja `on` ou `full`.
- Quando verbose é `full`, saídas de ferramentas também são encaminhadas após a conclusão (bolha separada, truncada para um tamanho seguro). Se você alternar `/verbose on|full|off` enquanto uma execução está em andamento, bolhas de ferramenta subsequentes respeitarão a nova configuração.

## Diretivas de rastreamento de Plugin (/trace)

- Níveis: `on` | `off` (padrão).
- Uma mensagem contendo apenas a diretiva alterna a saída de rastreamento de Plugin da sessão e responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- A diretiva inline afeta apenas aquela mensagem; padrões de sessão/globais se aplicam caso contrário.
- Envie `/trace` (ou `/trace:`) sem argumento para ver o nível atual de trace.
- `/trace` é mais restrito que `/verbose`: ele expõe apenas linhas de trace/debug de propriedade de Plugin, como resumos de depuração de Active Memory.
- Linhas de trace podem aparecer em `/status` e como uma mensagem de diagnóstico complementar após a resposta normal do assistente.

## Visibilidade de reasoning (/reasoning)

- Níveis: `on|off|stream`.
- Uma mensagem contendo apenas a diretiva alterna se blocos de thinking são mostrados nas respostas.
- Quando ativado, o reasoning é enviado como uma **mensagem separada** prefixada com `Reasoning:`.
- `stream` (somente Telegram): transmite o reasoning para a bolha de rascunho do Telegram enquanto a resposta está sendo gerada, depois envia a resposta final sem reasoning.
- Alias: `/reason`.
- Envie `/reasoning` (ou `/reasoning:`) sem argumento para ver o nível atual de reasoning.
- Ordem de resolução: diretiva inline, depois substituição da sessão, depois padrão por agente (`agents.list[].reasoningDefault`), depois fallback (`off`).

## Relacionado

- A documentação de modo elevado fica em [Elevated mode](/pt-BR/tools/elevated).

## Heartbeats

- O corpo de probe de Heartbeat é o prompt de Heartbeat configurado (padrão: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Diretivas inline em uma mensagem de Heartbeat se aplicam normalmente (mas evite mudar padrões de sessão a partir de Heartbeats).
- A entrega de Heartbeat usa por padrão apenas o payload final. Para também enviar a mensagem separada `Reasoning:` (quando disponível), defina `agents.defaults.heartbeat.includeReasoning: true` ou por agente `agents.list[].heartbeat.includeReasoning: true`.

## UI do chat web

- O seletor de thinking do chat web espelha o nível armazenado da sessão a partir do armazenamento/configuração da sessão de entrada quando a página é carregada.
- Escolher outro nível grava imediatamente a substituição da sessão via `sessions.patch`; não espera o próximo envio e não é uma substituição pontual `thinkingOnce`.
- A primeira opção é sempre `Default (<resolved level>)`, onde o padrão resolvido vem do perfil de thinking do provedor do modelo ativo da sessão mais a mesma lógica de fallback que `/status` e `session_status` usam.
- O seletor usa `thinkingLevels` retornado pela linha/padrões de sessão do gateway, com `thinkingOptions` mantido como lista legada de rótulos. A UI do navegador não mantém sua própria lista de regex de provedores; Plugins controlam conjuntos de níveis específicos de modelo.
- `/think:<level>` ainda funciona e atualiza o mesmo nível armazenado da sessão, então diretivas de chat e o seletor permanecem sincronizados.

## Perfis de provedor

- Plugins de provedor podem expor `resolveThinkingProfile(ctx)` para definir os níveis compatíveis e o padrão do modelo.
- Cada nível do perfil tem um `id` canônico armazenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` ou `max`) e pode incluir um `label` de exibição. Provedores binários usam `{ id: "low", label: "on" }`.
- Hooks legados publicados (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) permanecem como adaptadores de compatibilidade, mas novos conjuntos personalizados de níveis devem usar `resolveThinkingProfile`.
- Linhas/padrões do Gateway expõem `thinkingLevels`, `thinkingOptions` e `thinkingDefault` para que clientes ACP/chat renderizem os mesmos IDs e rótulos de perfil que a validação em runtime usa.
