---
read_when:
    - Ajustando thinking, modo rápido ou parsing/padrões de diretivas verbose
summary: Sintaxe de diretivas para /think, /fast, /verbose, /trace e visibilidade do reasoning
title: Níveis de thinking
x-i18n:
    generated_at: "2026-04-23T14:08:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4efe899f7b47244745a105583b3239effa7975fadd06bd7bcad6327afcc91207
    source_path: tools/thinking.md
    workflow: 15
---

# Níveis de thinking (diretivas `/think`)

## O que faz

- Diretiva inline em qualquer corpo de entrada: `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Níveis (aliases): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (orçamento máximo)
  - xhigh → “ultrathink+” (GPT-5.2 + modelos Codex e effort do Anthropic Claude Opus 4.7)
  - adaptive → thinking adaptativo gerenciado pelo provider (compatível com Claude 4.6 em Anthropic/Bedrock e Anthropic Claude Opus 4.7)
  - max → reasoning máximo do provider (atualmente Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` são mapeados para `xhigh`.
  - `highest` é mapeado para `high`.
- Observações sobre providers:
  - Menus e seletores de thinking são orientados por perfis de provider. Plugins de provider declaram o conjunto exato de níveis para o modelo selecionado, incluindo rótulos como `on` binário.
  - `adaptive`, `xhigh` e `max` só são anunciados para perfis de provider/modelo que os suportam. Diretivas digitadas para níveis não compatíveis são rejeitadas com as opções válidas desse modelo.
  - Níveis incompatíveis já armazenados são remapeados por classificação do perfil do provider. `adaptive` recorre a `medium` em modelos não adaptativos, enquanto `xhigh` e `max` recorrem ao maior nível compatível diferente de `off` para o modelo selecionado.
  - Modelos Anthropic Claude 4.6 usam `adaptive` por padrão quando nenhum nível explícito de thinking está definido.
  - Anthropic Claude Opus 4.7 não usa thinking adaptativo por padrão. O effort padrão da API continua sendo controlado pelo provider, a menos que você defina explicitamente um nível de thinking.
  - Anthropic Claude Opus 4.7 mapeia `/think xhigh` para thinking adaptativo mais `output_config.effort: "xhigh"`, porque `/think` é uma diretiva de thinking e `xhigh` é a configuração de effort do Opus 4.7.
  - Anthropic Claude Opus 4.7 também expõe `/think max`; ele é mapeado para o mesmo caminho de effort máximo controlado pelo provider.
  - Modelos OpenAI GPT mapeiam `/think` usando suporte a effort específico do modelo na Responses API. `/think off` envia `reasoning.effort: "none"` apenas quando o modelo de destino o suporta; caso contrário, o OpenClaw omite o payload de reasoning desabilitado em vez de enviar um valor não compatível.
  - MiniMax (`minimax/*`) no caminho de streaming compatível com Anthropic usa por padrão `thinking: { type: "disabled" }`, a menos que você defina explicitamente o thinking em params do modelo ou params da solicitação. Isso evita deltas vazados de `reasoning_content` do formato de stream Anthropic não nativo do MiniMax.
  - Z.AI (`zai/*`) oferece suporte apenas a thinking binário (`on`/`off`). Qualquer nível diferente de `off` é tratado como `on` (mapeado para `low`).
  - Moonshot (`moonshot/*`) mapeia `/think off` para `thinking: { type: "disabled" }` e qualquer nível diferente de `off` para `thinking: { type: "enabled" }`. Quando o thinking está habilitado, a Moonshot aceita apenas `tool_choice` `auto|none`; o OpenClaw normaliza valores incompatíveis para `auto`.

## Ordem de resolução

1. Diretiva inline na mensagem (aplica-se apenas a essa mensagem).
2. Substituição da sessão (definida ao enviar uma mensagem contendo apenas a diretiva).
3. Padrão por agente (`agents.list[].thinkingDefault` na configuração).
4. Padrão global (`agents.defaults.thinkingDefault` na configuração).
5. Fallback: padrão declarado pelo provider quando disponível; caso contrário, modelos compatíveis com reasoning resolvem para `medium` ou o nível compatível mais próximo diferente de `off` para esse modelo, e modelos sem reasoning permanecem em `off`.

## Definindo um padrão da sessão

- Envie uma mensagem que seja **apenas** a diretiva (espaços em branco permitidos), por exemplo `/think:medium` ou `/t high`.
- Isso permanece na sessão atual (por padrão, por remetente); é limpo por `/think:off` ou redefinição por inatividade da sessão.
- Uma resposta de confirmação é enviada (`Thinking level set to high.` / `Thinking disabled.`). Se o nível for inválido (por exemplo `/thinking big`), o comando é rejeitado com uma dica e o estado da sessão permanece inalterado.
- Envie `/think` (ou `/think:`) sem argumento para ver o nível de thinking atual.

## Aplicação por agente

- **Pi embutido**: o nível resolvido é passado para o runtime do agente Pi em processo.

## Modo rápido (/fast)

- Níveis: `on|off`.
- Uma mensagem contendo apenas a diretiva alterna uma substituição de modo rápido da sessão e responde `Fast mode enabled.` / `Fast mode disabled.`.
- Envie `/fast` (ou `/fast status`) sem modo para ver o estado efetivo atual do modo rápido.
- O OpenClaw resolve o modo rápido nesta ordem:
  1. `/fast on|off` inline/somente-diretiva
  2. Substituição da sessão
  3. Padrão por agente (`agents.list[].fastModeDefault`)
  4. Configuração por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Para `openai/*`, o modo rápido é mapeado para processamento prioritário do OpenAI enviando `service_tier=priority` em solicitações Responses compatíveis.
- Para `openai-codex/*`, o modo rápido envia o mesmo sinalizador `service_tier=priority` em Codex Responses. O OpenClaw mantém um único alternador `/fast` compartilhado entre ambos os caminhos de autenticação.
- Para solicitações públicas diretas `anthropic/*`, incluindo tráfego autenticado por OAuth enviado a `api.anthropic.com`, o modo rápido é mapeado para níveis de serviço da Anthropic: `/fast on` define `service_tier=auto`, `/fast off` define `service_tier=standard_only`.
- Para `minimax/*` no caminho compatível com Anthropic, `/fast on` (ou `params.fastMode: true`) reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.
- Params explícitos de modelo Anthropic `serviceTier` / `service_tier` substituem o padrão do modo rápido quando ambos estão definidos. O OpenClaw ainda ignora a injeção de nível de serviço da Anthropic para URLs base proxy não Anthropic.
- `/status` mostra `Fast` apenas quando o modo rápido está habilitado.

## Diretivas verbose (`/verbose` ou `/v`)

- Níveis: `on` (mínimo) | `full` | `off` (padrão).
- Uma mensagem contendo apenas a diretiva alterna o verbose da sessão e responde `Verbose logging enabled.` / `Verbose logging disabled.`; níveis inválidos retornam uma dica sem alterar o estado.
- `/verbose off` armazena uma substituição explícita da sessão; limpe-a pela interface de Sessões escolhendo `inherit`.
- A diretiva inline afeta apenas essa mensagem; padrões de sessão/globais se aplicam nos demais casos.
- Envie `/verbose` (ou `/verbose:`) sem argumento para ver o nível verbose atual.
- Quando verbose está ativo, agentes que emitem resultados estruturados de ferramentas (Pi, outros agentes JSON) enviam cada chamada de ferramenta como sua própria mensagem apenas de metadados, com prefixo `<emoji> <tool-name>: <arg>` quando disponível (caminho/comando). Esses resumos de ferramenta são enviados assim que cada ferramenta começa (bolhas separadas), não como deltas de streaming.
- Resumos de falha de ferramenta permanecem visíveis no modo normal, mas sufixos com detalhes brutos de erro ficam ocultos a menos que verbose esteja em `on` ou `full`.
- Quando verbose está em `full`, as saídas das ferramentas também são encaminhadas após a conclusão (bolha separada, truncada para um tamanho seguro). Se você alternar `/verbose on|full|off` enquanto uma execução estiver em andamento, as bolhas de ferramenta subsequentes respeitarão a nova configuração.

## Diretivas de rastreamento de Plugin (/trace)

- Níveis: `on` | `off` (padrão).
- Uma mensagem contendo apenas a diretiva alterna a saída de rastreamento de Plugin da sessão e responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- A diretiva inline afeta apenas essa mensagem; padrões de sessão/globais se aplicam nos demais casos.
- Envie `/trace` (ou `/trace:`) sem argumento para ver o nível atual de trace.
- `/trace` é mais restrito que `/verbose`: ele expõe apenas linhas de trace/debug de propriedade do plugin, como resumos de depuração da Active Memory.
- Linhas de trace podem aparecer em `/status` e como uma mensagem diagnóstica de acompanhamento após a resposta normal do assistente.

## Visibilidade do reasoning (/reasoning)

- Níveis: `on|off|stream`.
- Uma mensagem contendo apenas a diretiva alterna se blocos de thinking são mostrados nas respostas.
- Quando habilitado, o reasoning é enviado como uma **mensagem separada** com o prefixo `Reasoning:`.
- `stream` (somente Telegram): transmite o reasoning na bolha de rascunho do Telegram enquanto a resposta está sendo gerada, e depois envia a resposta final sem reasoning.
- Alias: `/reason`.
- Envie `/reasoning` (ou `/reasoning:`) sem argumento para ver o nível atual de reasoning.
- Ordem de resolução: diretiva inline, depois substituição da sessão, depois padrão por agente (`agents.list[].reasoningDefault`), depois fallback (`off`).

## Relacionado

- A documentação do modo elevado está em [Modo elevado](/pt-BR/tools/elevated).

## Heartbeats

- O corpo da sondagem de Heartbeat é o prompt de Heartbeat configurado (padrão: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Diretivas inline em uma mensagem de Heartbeat se aplicam normalmente (mas evite alterar padrões da sessão a partir de Heartbeats).
- A entrega do Heartbeat usa por padrão apenas o payload final. Para também enviar a mensagem separada `Reasoning:` (quando disponível), defina `agents.defaults.heartbeat.includeReasoning: true` ou por agente `agents.list[].heartbeat.includeReasoning: true`.

## Interface web de chat

- O seletor de thinking do chat web espelha o nível armazenado da sessão a partir do armazenamento/configuração de sessão de entrada quando a página é carregada.
- Escolher outro nível grava imediatamente a substituição da sessão via `sessions.patch`; ele não espera o próximo envio e não é uma substituição de uso único `thinkingOnce`.
- A primeira opção é sempre `Default (<resolved level>)`, em que o padrão resolvido vem do perfil de thinking do provider do modelo ativo da sessão mais a mesma lógica de fallback usada por `/status` e `session_status`.
- O seletor usa `thinkingOptions` retornado pela linha de sessão do gateway. A interface do navegador não mantém sua própria lista regex de providers; plugins controlam os conjuntos de níveis específicos de modelo.
- `/think:<level>` ainda funciona e atualiza o mesmo nível armazenado da sessão, então as diretivas de chat e o seletor permanecem sincronizados.

## Perfis de provider

- Plugins de provider podem expor `resolveThinkingProfile(ctx)` para definir os níveis compatíveis e o padrão do modelo.
- Cada nível do perfil tem um `id` canônico armazenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` ou `max`) e pode incluir um `label` de exibição. Providers binários usam `{ id: "low", label: "on" }`.
- Hooks legados publicados (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) continuam como adaptadores de compatibilidade, mas novos conjuntos de níveis personalizados devem usar `resolveThinkingProfile`.
- Linhas do gateway expõem `thinkingOptions` e `thinkingDefault` para que clientes ACP/chat renderizem o mesmo perfil que a validação em runtime usa.
