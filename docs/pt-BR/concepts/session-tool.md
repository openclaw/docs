---
read_when:
    - Você quer entender quais ferramentas de sessão o agente possui
    - Você quer configurar acesso entre sessões ou inicialização de subagentes
    - Você quer inspecionar o status ou controlar subagentes iniciados
summary: Ferramentas do agente para status entre sessões, recall, mensagens e orquestração de subagentes
title: Ferramentas de sessão
x-i18n:
    generated_at: "2026-04-24T05:49:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3032178a83e662009c3ea463f02cb20d604069d1634d5c24a9f86988e676b2e
    source_path: concepts/session-tool.md
    workflow: 15
---

O OpenClaw oferece aos agentes ferramentas para trabalhar entre sessões, inspecionar status e
orquestrar subagentes.

## Ferramentas disponíveis

| Ferramenta       | O que faz                                                                |
| ---------------- | ------------------------------------------------------------------------ |
| `sessions_list`  | Lista sessões com filtros opcionais (kind, label, agent, recência, preview) |
| `sessions_history` | Lê a transcrição de uma sessão específica                              |
| `sessions_send`  | Envia uma mensagem para outra sessão e opcionalmente espera             |
| `sessions_spawn` | Inicia uma sessão isolada de subagente para trabalho em segundo plano   |
| `sessions_yield` | Encerra o turno atual e espera resultados de acompanhamento de subagente |
| `subagents`      | Lista, direciona ou encerra subagentes iniciados para esta sessão       |
| `session_status` | Mostra um cartão no estilo `/status` e opcionalmente define uma substituição de modelo por sessão |

## Listando e lendo sessões

`sessions_list` retorna sessões com sua chave, agentId, kind, canal, modelo,
contagens de tokens e timestamps. Filtre por kind (`main`, `group`, `cron`, `hook`,
`node`), `label` exato, `agentId` exato, texto de pesquisa ou recência
(`activeMinutes`). Quando você precisa de triagem no estilo caixa de entrada, também pode solicitar um
título derivado com escopo de visibilidade, um trecho de pré-visualização da última mensagem ou
mensagens recentes limitadas em cada linha. Títulos derivados e pré-visualizações são produzidos apenas para
sessões que o chamador já pode ver sob a política de visibilidade configurada
das ferramentas de sessão, para que sessões não relacionadas permaneçam ocultas.

`sessions_history` busca a transcrição da conversa de uma sessão específica.
Por padrão, resultados de ferramenta são excluídos -- passe `includeTools: true` para vê-los.
A visualização retornada é intencionalmente limitada e filtrada por segurança:

- o texto do assistente é normalizado antes do recall:
  - tags de thinking são removidas
  - blocos de estrutura `<relevant-memories>` / `<relevant_memories>` são removidos
  - blocos de payload XML de chamada de ferramenta em texto simples, como `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>`, são removidos, incluindo
    payloads truncados que nunca fecham corretamente
  - estruturas degradadas de chamada/resultado de ferramenta, como `[Tool Call: ...]`,
    `[Tool Result ...]` e `[Historical context ...]`, são removidas
  - tokens de controle do modelo vazados, como `<|assistant|>`, outros tokens ASCII
    `<|...|>` e variantes de largura total `<｜...｜>`, são removidos
  - XML malformado de chamada de ferramenta MiniMax, como `<invoke ...>` /
    `</minimax:tool_call>`, é removido
- texto semelhante a credenciais/tokens é redigido antes de ser retornado
- blocos longos de texto são truncados
- históricos muito grandes podem descartar linhas mais antigas ou substituir uma linha grande demais por
  `[sessions_history omitted: message too large]`
- a ferramenta informa sinalizadores de resumo, como `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` e `bytes`

Ambas as ferramentas aceitam uma **chave de sessão** (como `"main"`) ou um **ID de sessão**
de uma chamada anterior de listagem.

Se você precisar da transcrição exata byte a byte, inspecione o arquivo de transcrição em
disco em vez de tratar `sessions_history` como um dump bruto.

## Enviando mensagens entre sessões

`sessions_send` entrega uma mensagem a outra sessão e opcionalmente espera pela
resposta:

- **Disparar e esquecer:** defina `timeoutSeconds: 0` para enfileirar e retornar
  imediatamente.
- **Esperar resposta:** defina um timeout e obtenha a resposta inline.

Depois que o destino responde, o OpenClaw pode executar um **loop de resposta de volta** em que os
agentes alternam mensagens (até 5 turnos). O agente de destino pode responder
`REPLY_SKIP` para parar antes.

## Helpers de status e orquestração

`session_status` é a ferramenta equivalente leve de `/status` para a sessão atual
ou outra sessão visível. Ela informa uso, tempo, estado de modelo/runtime e
contexto vinculado de tarefa em segundo plano quando presente. Assim como `/status`, ela pode preencher
contadores esparsos de tokens/cache a partir da entrada mais recente de uso da transcrição, e
`model=default` limpa uma substituição por sessão.

`sessions_yield` encerra intencionalmente o turno atual para que a próxima mensagem possa ser
o evento de acompanhamento que você está esperando. Use-o após iniciar subagentes quando
quiser que os resultados de conclusão cheguem como a próxima mensagem em vez de construir
loops de polling.

`subagents` é o helper do plano de controle para subagentes do OpenClaw já
iniciados. Ele oferece suporte a:

- `action: "list"` para inspecionar execuções ativas/recentes
- `action: "steer"` para enviar orientação de acompanhamento a um filho em execução
- `action: "kill"` para interromper um filho ou `all`

## Iniciando subagentes

`sessions_spawn` cria por padrão uma sessão isolada para uma tarefa em segundo plano.
Ela é sempre não bloqueante -- retorna imediatamente com um `runId` e
`childSessionKey`.

Principais opções:

- `runtime: "subagent"` (padrão) ou `"acp"` para agentes de harness externos.
- substituições de `model` e `thinking` para a sessão filha.
- `thread: true` para vincular a inicialização a uma thread de chat (Discord, Slack etc.).
- `sandbox: "require"` para impor sandbox na filha.
- `context: "fork"` para subagentes nativos quando a filha precisa da transcrição atual
  do solicitante; omita ou use `context: "isolated"` para uma filha limpa.

Subagentes folha padrão não recebem ferramentas de sessão. Quando
`maxSpawnDepth >= 2`, subagentes orquestradores de profundidade 1 recebem adicionalmente
`sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` para que
possam gerenciar seus próprios filhos. Execuções folha ainda não recebem
ferramentas de orquestração recursiva.

Após a conclusão, uma etapa de anúncio publica o resultado no canal do solicitante.
A entrega da conclusão preserva o roteamento vinculado de thread/tópico quando disponível, e se
a origem da conclusão identificar apenas um canal, o OpenClaw ainda poderá reutilizar a rota
armazenada da sessão solicitante (`lastChannel` / `lastTo`) para entrega
direta.

Para comportamento específico do ACP, consulte [Agentes ACP](/pt-BR/tools/acp-agents).

## Visibilidade

As ferramentas de sessão têm escopo para limitar o que o agente pode ver:

| Nível   | Escopo                                   |
| ------- | ---------------------------------------- |
| `self`  | Somente a sessão atual                   |
| `tree`  | Sessão atual + subagentes iniciados      |
| `agent` | Todas as sessões deste agente            |
| `all`   | Todas as sessões (entre agentes se configurado) |

O padrão é `tree`. Sessões em sandbox são limitadas a `tree` independentemente da
configuração.

## Leitura adicional

- [Gerenciamento de sessões](/pt-BR/concepts/session) -- roteamento, ciclo de vida, manutenção
- [Agentes ACP](/pt-BR/tools/acp-agents) -- inicialização de harness externo
- [Multi-agent](/pt-BR/concepts/multi-agent) -- arquitetura multiagente
- [Configuração do Gateway](/pt-BR/gateway/configuration) -- controles de configuração das ferramentas de sessão

## Relacionado

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Limpeza de sessões](/pt-BR/concepts/session-pruning)
