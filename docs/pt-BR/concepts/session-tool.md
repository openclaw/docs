---
read_when:
    - Você quer entender quais ferramentas de sessão o agente tem
    - Você quer configurar acesso entre sessões ou criação de subagentes
    - Você quer inspecionar status ou controlar subagentes criados
summary: Ferramentas de agente para status entre sessões, recuperação de contexto, mensagens e orquestração de subagentes
title: Ferramentas de sessão
x-i18n:
    generated_at: "2026-04-23T14:02:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd8b545429726d0880e6086ba7190497861bf3f3e1e88d53cb38ef9e5e4468c6
    source_path: concepts/session-tool.md
    workflow: 15
---

# Ferramentas de sessão

O OpenClaw fornece aos agentes ferramentas para trabalhar entre sessões, inspecionar status e
orquestrar subagentes.

## Ferramentas disponíveis

| Ferramenta        | O que faz                                                                  |
| ----------------- | -------------------------------------------------------------------------- |
| `sessions_list`   | Lista sessões com filtros opcionais (tipo, rótulo, agente, recência, prévia) |
| `sessions_history`| Lê a transcrição de uma sessão específica                                  |
| `sessions_send`   | Envia uma mensagem para outra sessão e opcionalmente aguarda               |
| `sessions_spawn`  | Cria uma sessão isolada de subagente para trabalho em segundo plano        |
| `sessions_yield`  | Encerra o turno atual e aguarda resultados de acompanhamento de subagentes |
| `subagents`       | Lista, direciona ou encerra subagentes criados para esta sessão            |
| `session_status`  | Mostra um cartão no estilo `/status` e opcionalmente define uma substituição de modelo por sessão |

## Listar e ler sessões

`sessions_list` retorna sessões com sua chave, agentId, tipo, canal, modelo,
contagens de tokens e timestamps. Filtre por tipo (`main`, `group`, `cron`, `hook`,
`node`), `label` exato, `agentId` exato, texto de busca ou recência
(`activeMinutes`). Quando você precisa de triagem no estilo caixa de entrada, ele também pode solicitar um
título derivado com escopo de visibilidade, um trecho de prévia da última mensagem ou
mensagens recentes limitadas em cada linha. Títulos derivados e prévias são produzidos apenas para
sessões que o chamador já pode ver sob a política configurada de visibilidade
das ferramentas de sessão, para que sessões não relacionadas permaneçam ocultas.

`sessions_history` busca a transcrição da conversa de uma sessão específica.
Por padrão, resultados de ferramentas são excluídos — passe `includeTools: true` para vê-los.
A visualização retornada é intencionalmente limitada e filtrada por segurança:

- o texto do assistente é normalizado antes da recuperação:
  - tags de pensamento são removidas
  - blocos de estrutura `<relevant-memories>` / `<relevant_memories>` são removidos
  - blocos XML de carga de chamada de ferramenta em texto simples, como `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>`, são removidos, incluindo
    cargas truncadas que nunca se fecham corretamente
  - estruturas degradadas de chamada/resultado de ferramenta, como `[Tool Call: ...]`,
    `[Tool Result ...]` e `[Historical context ...]`, são removidas
  - tokens de controle de modelo vazados, como `<|assistant|>`, outros tokens ASCII
    `<|...|>` e variantes de largura completa `<｜...｜>`, são removidos
  - XML malformado de chamada de ferramenta do MiniMax, como `<invoke ...>` /
    `</minimax:tool_call>`, é removido
- texto semelhante a credenciais/tokens é redigido antes de ser retornado
- blocos longos de texto são truncados
- históricos muito grandes podem descartar linhas mais antigas ou substituir uma linha superdimensionada por
  `[sessions_history omitted: message too large]`
- a ferramenta informa sinalizadores de resumo como `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` e `bytes`

Ambas as ferramentas aceitam uma **chave de sessão** (como `"main"`) ou um **ID de sessão**
de uma chamada anterior de listagem.

Se você precisar da transcrição exata, byte por byte, inspecione o arquivo de transcrição em
disco em vez de tratar `sessions_history` como um dump bruto.

## Enviar mensagens entre sessões

`sessions_send` entrega uma mensagem para outra sessão e opcionalmente aguarda
a resposta:

- **Disparar e esquecer:** defina `timeoutSeconds: 0` para enfileirar e retornar
  imediatamente.
- **Aguardar resposta:** defina um tempo limite e obtenha a resposta inline.

Depois que o destino responder, o OpenClaw pode executar um **loop de resposta**
em que os agentes alternam mensagens (até 5 turnos). O agente de destino pode responder
`REPLY_SKIP` para parar mais cedo.

## Helpers de status e orquestração

`session_status` é a ferramenta leve equivalente a `/status` para a sessão atual
ou outra sessão visível. Ela informa uso, tempo, estado do modelo/runtime e
contexto vinculado de tarefa em segundo plano quando presente. Assim como `/status`, ela pode preencher
contadores esparsos de tokens/cache a partir da entrada de uso mais recente da transcrição, e
`model=default` limpa uma substituição por sessão.

`sessions_yield` encerra intencionalmente o turno atual para que a próxima mensagem possa ser
o evento de acompanhamento que você está esperando. Use-a depois de criar subagentes quando
você quiser que os resultados de conclusão cheguem como a próxima mensagem em vez de construir
loops de polling.

`subagents` é o helper de plano de controle para subagentes do OpenClaw já
criados. Ele oferece suporte a:

- `action: "list"` para inspecionar execuções ativas/recentes
- `action: "steer"` para enviar orientação de acompanhamento a um filho em execução
- `action: "kill"` para parar um filho ou `all`

## Criar subagentes

`sessions_spawn` cria uma sessão isolada para uma tarefa em segundo plano. Ela é sempre
não bloqueante — retorna imediatamente com um `runId` e `childSessionKey`.

Principais opções:

- `runtime: "subagent"` (padrão) ou `"acp"` para agentes externos de harness.
- substituições de `model` e `thinking` para a sessão filha.
- `thread: true` para vincular a criação a uma thread de chat (Discord, Slack etc.).
- `sandbox: "require"` para exigir sandbox no filho.

Subagentes folha padrão não recebem ferramentas de sessão. Quando
`maxSpawnDepth >= 2`, subagentes orquestradores de profundidade 1 também recebem
`sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` para que possam
gerenciar seus próprios filhos. Execuções folha ainda não recebem ferramentas de
orquestração recursiva.

Após a conclusão, uma etapa de anúncio publica o resultado no canal do solicitante.
A entrega de conclusão preserva o roteamento vinculado de thread/tópico quando disponível, e se
a origem da conclusão identificar apenas um canal, o OpenClaw ainda pode reutilizar a rota armazenada
da sessão do solicitante (`lastChannel` / `lastTo`) para entrega
direta.

Para comportamento específico de ACP, veja [Agentes ACP](/pt-BR/tools/acp-agents).

## Visibilidade

As ferramentas de sessão têm escopo limitado para restringir o que o agente pode ver:

| Nível   | Escopo                                   |
| ------- | ---------------------------------------- |
| `self`  | Apenas a sessão atual                    |
| `tree`  | Sessão atual + subagentes criados        |
| `agent` | Todas as sessões deste agente            |
| `all`   | Todas as sessões (entre agentes, se configurado) |

O padrão é `tree`. Sessões em sandbox são limitadas a `tree` independentemente da
configuração.

## Leitura adicional

- [Gerenciamento de sessão](/pt-BR/concepts/session) -- roteamento, ciclo de vida, manutenção
- [Agentes ACP](/pt-BR/tools/acp-agents) -- criação com harness externo
- [Multi-agent](/pt-BR/concepts/multi-agent) -- arquitetura multiagente
- [Configuração do Gateway](/pt-BR/gateway/configuration) -- controles de configuração das ferramentas de sessão
