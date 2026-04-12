---
read_when:
    - Ajustando a análise ou os padrões das diretivas de thinking, modo rápido ou verbose
summary: Sintaxe de diretivas para /think, /fast, /verbose, /trace e visibilidade do raciocínio
title: Níveis de raciocínio
x-i18n:
    generated_at: "2026-04-12T23:33:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f3b1341281f07ba4e9061e3355845dca234be04cc0d358594312beeb7676e68
    source_path: tools/thinking.md
    workflow: 15
---

# Níveis de raciocínio (diretivas /think)

## O que faz

- Diretiva inline em qualquer corpo de mensagem recebida: `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Níveis (aliases): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (orçamento máximo)
  - xhigh → “ultrathink+” (somente modelos GPT-5.2 + Codex)
  - adaptive → orçamento de raciocínio adaptativo gerenciado pelo provedor (compatível com a família de modelos Anthropic Claude 4.6)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` são mapeados para `xhigh`.
  - `highest`, `max` são mapeados para `high`.
- Observações por provedor:
  - Os modelos Anthropic Claude 4.6 usam `adaptive` por padrão quando nenhum nível explícito de raciocínio é definido.
  - MiniMax (`minimax/*`) no caminho de streaming compatível com Anthropic usa por padrão `thinking: { type: "disabled" }`, a menos que você defina explicitamente o raciocínio nos params do modelo ou nos params da solicitação. Isso evita vazamento de deltas `reasoning_content` do formato de stream Anthropic não nativo do MiniMax.
  - Z.AI (`zai/*`) oferece suporte apenas a raciocínio binário (`on`/`off`). Qualquer nível diferente de `off` é tratado como `on` (mapeado para `low`).
  - Moonshot (`moonshot/*`) mapeia `/think off` para `thinking: { type: "disabled" }` e qualquer nível diferente de `off` para `thinking: { type: "enabled" }`. Quando o raciocínio está ativado, o Moonshot aceita apenas `tool_choice` `auto|none`; o OpenClaw normaliza valores incompatíveis para `auto`.

## Ordem de resolução

1. Diretiva inline na mensagem (aplica-se somente a essa mensagem).
2. Substituição da sessão (definida ao enviar uma mensagem contendo apenas a diretiva).
3. Padrão por agente (`agents.list[].thinkingDefault` na configuração).
4. Padrão global (`agents.defaults.thinkingDefault` na configuração).
5. Fallback: `adaptive` para modelos Anthropic Claude 4.6, `low` para outros modelos compatíveis com raciocínio, `off` caso contrário.

## Definindo um padrão da sessão

- Envie uma mensagem que seja **somente** a diretiva (espaços em branco permitidos), por exemplo `/think:medium` ou `/t high`.
- Isso permanece na sessão atual (por padrão, por remetente); é limpo por `/think:off` ou por reset por inatividade da sessão.
- Uma resposta de confirmação é enviada (`Nível de raciocínio definido como high.` / `Raciocínio desativado.`). Se o nível for inválido (por exemplo, `/thinking big`), o comando é rejeitado com uma dica e o estado da sessão permanece inalterado.
- Envie `/think` (ou `/think:`) sem argumento para ver o nível atual de raciocínio.

## Aplicação por agente

- **Embedded Pi**: o nível resolvido é passado para o runtime do agente Pi em processo.

## Modo rápido (/fast)

- Níveis: `on|off`.
- Uma mensagem contendo apenas a diretiva alterna uma substituição de modo rápido da sessão e responde `Modo rápido ativado.` / `Modo rápido desativado.`.
- Envie `/fast` (ou `/fast status`) sem modo para ver o estado efetivo atual do modo rápido.
- O OpenClaw resolve o modo rápido nesta ordem:
  1. `/fast on|off` inline/somente diretiva
  2. Substituição da sessão
  3. Padrão por agente (`agents.list[].fastModeDefault`)
  4. Configuração por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Para `openai/*`, o modo rápido é mapeado para processamento prioritário da OpenAI, enviando `service_tier=priority` em solicitações Responses compatíveis.
- Para `openai-codex/*`, o modo rápido envia o mesmo sinalizador `service_tier=priority` em Responses do Codex. O OpenClaw mantém uma única alternância compartilhada `/fast` para ambos os caminhos de auth.
- Para solicitações públicas diretas `anthropic/*`, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o modo rápido é mapeado para service tiers da Anthropic: `/fast on` define `service_tier=auto`, `/fast off` define `service_tier=standard_only`.
- Para `minimax/*` no caminho compatível com Anthropic, `/fast on` (ou `params.fastMode: true`) reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.
- Params explícitos de modelo Anthropic `serviceTier` / `service_tier` substituem o padrão do modo rápido quando ambos estão definidos. O OpenClaw ainda ignora a injeção de service tier da Anthropic para base URLs proxy não Anthropic.

## Diretivas verbose (/verbose ou /v)

- Níveis: `on` (mínimo) | `full` | `off` (padrão).
- Uma mensagem contendo apenas a diretiva alterna o verbose da sessão e responde `Verbose logging ativado.` / `Verbose logging desativado.`; níveis inválidos retornam uma dica sem alterar o estado.
- `/verbose off` armazena uma substituição explícita da sessão; limpe-a pela UI de Sessions escolhendo `inherit`.
- A diretiva inline afeta somente aquela mensagem; os padrões de sessão/globais se aplicam nos demais casos.
- Envie `/verbose` (ou `/verbose:`) sem argumento para ver o nível verbose atual.
- Quando verbose está ativado, agentes que emitem resultados estruturados de ferramentas (Pi, outros agentes JSON) enviam cada chamada de ferramenta de volta como sua própria mensagem somente de metadados, com prefixo `<emoji> <tool-name>: <arg>` quando disponível (caminho/comando). Esses resumos de ferramenta são enviados assim que cada ferramenta começa (bolhas separadas), não como deltas de streaming.
- Resumos de falha de ferramenta continuam visíveis no modo normal, mas sufixos brutos com detalhes de erro ficam ocultos, a menos que verbose esteja `on` ou `full`.
- Quando verbose está `full`, as saídas das ferramentas também são encaminhadas após a conclusão (bolha separada, truncada para um tamanho seguro). Se você alternar `/verbose on|full|off` enquanto uma execução estiver em andamento, as bolhas de ferramenta subsequentes respeitarão a nova configuração.

## Diretivas de trace do Plugin (/trace)

- Níveis: `on` | `off` (padrão).
- Uma mensagem contendo apenas a diretiva alterna a saída de trace de Plugin da sessão e responde `Trace de Plugin ativado.` / `Trace de Plugin desativado.`.
- A diretiva inline afeta somente aquela mensagem; os padrões de sessão/globais se aplicam nos demais casos.
- Envie `/trace` (ou `/trace:`) sem argumento para ver o nível atual de trace.
- `/trace` é mais restrito que `/verbose`: ele expõe apenas linhas de trace/debug pertencentes ao plugin, como resumos de depuração de Active Memory.
- Linhas de trace podem aparecer em `/status` e como uma mensagem diagnóstica de acompanhamento após a resposta normal do assistente.

## Visibilidade do raciocínio (/reasoning)

- Níveis: `on|off|stream`.
- Uma mensagem contendo apenas a diretiva alterna se blocos de raciocínio são mostrados nas respostas.
- Quando ativado, o raciocínio é enviado como uma **mensagem separada** com o prefixo `Reasoning:`.
- `stream` (somente Telegram): faz streaming do raciocínio na bolha de rascunho do Telegram enquanto a resposta é gerada e depois envia a resposta final sem raciocínio.
- Alias: `/reason`.
- Envie `/reasoning` (ou `/reasoning:`) sem argumento para ver o nível atual de raciocínio.
- Ordem de resolução: diretiva inline, depois substituição da sessão, depois padrão por agente (`agents.list[].reasoningDefault`), depois fallback (`off`).

## Relacionado

- A documentação do modo elevado está em [Modo elevado](/pt-BR/tools/elevated).

## Heartbeats

- O corpo da sonda de Heartbeat é o prompt de heartbeat configurado (padrão: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Diretivas inline em uma mensagem de heartbeat se aplicam normalmente (mas evite alterar padrões de sessão a partir de heartbeats).
- A entrega de Heartbeat usa por padrão apenas o payload final. Para também enviar a mensagem separada `Reasoning:` (quando disponível), defina `agents.defaults.heartbeat.includeReasoning: true` ou por agente `agents.list[].heartbeat.includeReasoning: true`.

## Web chat UI

- O seletor de raciocínio do chat web espelha o nível armazenado da sessão a partir do armazenamento/configuração de sessão de entrada quando a página é carregada.
- Escolher outro nível grava imediatamente a substituição da sessão via `sessions.patch`; não espera o próximo envio e não é uma substituição única `thinkingOnce`.
- A primeira opção é sempre `Default (<resolved level>)`, em que o padrão resolvido vem do modelo ativo da sessão: `adaptive` para Claude 4.6 em Anthropic/Bedrock, `low` para outros modelos compatíveis com raciocínio, `off` caso contrário.
- O seletor permanece sensível ao provedor:
  - a maioria dos provedores mostra `off | minimal | low | medium | high | adaptive`
  - Z.AI mostra `off | on` binário
- `/think:<level>` ainda funciona e atualiza o mesmo nível armazenado da sessão, então as diretivas do chat e o seletor permanecem sincronizados.
