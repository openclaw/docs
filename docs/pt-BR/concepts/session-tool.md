---
read_when:
    - Você quer entender quais ferramentas de sessão o agente tem
    - Você quer configurar o acesso entre sessões ou a criação de subagentes
    - Você quer inspecionar o status dos subagentes iniciados
summary: Ferramentas de agente para status entre sessões, recuperação, mensagens e orquestração de subagentes
title: Ferramentas de sessão
x-i18n:
    generated_at: "2026-07-12T21:31:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fb0827e2eff6e53d3e7ef6f7d7f0497d8b431fcb23cb4b54c5851229086423cc
    source_path: concepts/session-tool.md
    workflow: 16
---

O OpenClaw fornece aos agentes ferramentas para trabalhar entre sessões, inspecionar o status e orquestrar subagentes.

## Ferramentas disponíveis

| Ferramenta         | O que faz                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| `sessions_list`    | Lista sessões com filtros opcionais (tipo, rótulo, agente, arquivamento, pré-visualização)             |
| `sessions_history` | Lê a transcrição de uma sessão específica                                                              |
| `sessions_send`    | Envia uma mensagem para outra sessão e, opcionalmente, aguarda                                         |
| `sessions_spawn`   | Inicia uma sessão isolada de subagente para trabalho em segundo plano                                  |
| `sessions_yield`   | Encerra o turno atual e aguarda resultados posteriores dos subagentes                                  |
| `subagents`        | Lista o status dos subagentes iniciados para esta sessão                                               |
| `session_status`   | Exibe um cartão no estilo `/status` e, opcionalmente, define uma substituição de modelo por sessão     |

Essas ferramentas ainda estão sujeitas ao perfil de ferramentas ativo e à política de permissão/negação. `tools.profile: "coding"` inclui o conjunto completo de orquestração de sessões, incluindo `sessions_spawn`, `sessions_yield` e `subagents`. `tools.profile: "messaging"` inclui ferramentas de mensagens entre sessões (`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), mas não inclui a criação de subagentes. Para manter um perfil de mensagens e ainda permitir delegação nativa, adicione:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

As políticas de grupo, provedor, sandbox e por agente ainda podem remover essas ferramentas após a etapa de perfil. Use `/tools` na sessão afetada para inspecionar a lista efetiva de ferramentas.

## Listagem e leitura de sessões

`sessions_list` retorna sessões com sua chave, agentId, tipo, canal, modelo, contagens de tokens e registros de data e hora. Filtre por `kinds` (matriz; valores aceitos: `main`, `group`, `cron`, `hook`, `node`, `other`), `label` exato, `agentId` exato, texto de `search` ou atividade recente (`activeMinutes`). As sessões ativas são retornadas por padrão; passe `archived: true` para inspecionar sessões arquivadas. As linhas incluem os estados `pinned` e `archived`. Defina `includeDerivedTitles`, `includeLastMessage` ou `messageLimit` (limitado a 20) quando precisar de uma triagem no estilo de caixa de entrada: um título derivado limitado pelo escopo de visibilidade, um trecho de pré-visualização da última mensagem ou mensagens recentes limitadas em cada linha. Títulos derivados e pré-visualizações são produzidos somente para sessões que o chamador já pode ver conforme a política de visibilidade configurada para as ferramentas de sessão, portanto, sessões não relacionadas permanecem ocultas. Quando a visibilidade é restrita, `sessions_list` retorna metadados opcionais de `visibility` que mostram o modo efetivo e um aviso de que os resultados podem estar limitados pelo escopo.

`sessions_history` busca a transcrição da conversa de uma sessão específica. Por padrão, os resultados das ferramentas são excluídos; passe `includeTools: true` para vê-los. Use `limit` para obter a parte final mais recente com tamanho limitado. Passe `offset: 0` quando precisar de metadados de paginação e, em seguida, passe os valores `nextOffset` retornados para retroceder pelas janelas mais antigas de transcrição do OpenClaw sem ler arquivos brutos de transcrição. Páginas com deslocamento explícito não mesclam importações externas de fallback da CLI; use a visualização padrão da parte final mais recente (sem `offset`) quando precisar desse histórico de exibição mesclado.

A visualização retornada é intencionalmente limitada e filtrada por segurança:

- o texto do assistente é normalizado antes da recuperação:
  - as tags de raciocínio são removidas
  - os blocos de estrutura `<relevant-memories>` / `<relevant_memories>` são removidos
  - blocos de payload XML de chamadas de ferramenta em texto simples, como `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e `<function_calls>...</function_calls>`, são removidos, incluindo payloads truncados que nunca são fechados corretamente
  - estruturas rebaixadas de chamadas/resultados de ferramentas, como `[Tool Call: ...]`, `[Tool Result ...]` e `[Historical context ...]`, são removidas
  - tokens de controle de modelo vazados, como `<|assistant|>`, outros tokens ASCII `<|...|>` e variantes de largura completa `<｜...｜>`, são removidos
  - XML malformado de chamada de ferramenta do MiniMax, como `<invoke ...>` / `</minimax:tool_call>`, é removido
- texto semelhante a credenciais/tokens é censurado antes de ser retornado
- blocos de texto longos são truncados
- históricos muito grandes podem descartar linhas mais antigas ou substituir uma linha grande demais por `[sessions_history omitted: message too large]`
- a ferramenta informa indicadores de resumo, como `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`, `bytes` e metadados de paginação

Ambas as ferramentas aceitam uma **chave de sessão** (como `"main"`) ou um **ID de sessão** de uma chamada de listagem anterior.

Se precisar da transcrição bruta exata, inspecione as linhas da transcrição no SQLite com o escopo apropriado, em vez de tratar `sessions_history` como um despejo sem filtros.

## Envio de mensagens entre sessões

`sessions_send` entrega uma mensagem a outra sessão e, opcionalmente, aguarda a resposta:

- **Enviar sem aguardar:** defina `timeoutSeconds: 0` para enfileirar e retornar imediatamente.
- **Aguardar resposta:** defina um tempo limite e receba a resposta em linha.

Sessões de chat com escopo de thread, como chaves terminadas em `:thread:<id>`, não são destinos válidos para `sessions_send`. Use a chave da sessão do canal pai para a coordenação entre agentes, para que mensagens encaminhadas por ferramentas não apareçam dentro de uma thread ativa voltada para pessoas.

Mensagens e respostas posteriores A2A são marcadas como dados entre sessões no prompt receptor (`[Inter-session message ... isUser=false]`) e na proveniência da transcrição. O agente receptor deve tratá-las como dados encaminhados por ferramenta, não como uma instrução criada diretamente pelo usuário final.

Depois que o destino responde, o OpenClaw pode executar um **ciclo de respostas de retorno**, no qual os agentes alternam mensagens (até `session.agentToAgent.maxPingPongTurns`, intervalo de 0 a 20, padrão 5). O agente de destino pode responder `REPLY_SKIP` para interromper antecipadamente.

Passe `watch: true` para também registrar o remetente como observador de alterações de estado do destino: quando outro ator posteriormente enviar ao destino uma mensagem humana direta ou alterar seu objetivo, o remetente receberá um aviso do sistema apontando para `changesSince` de `session_status`. O registro ocorre após o envio bem-sucedido, tem como alvo a sessão que realmente recebeu a mensagem e começa na versão de estado atual dela; portanto, somente alterações posteriores produzem avisos. O resultado informa `watched: true` quando o registro é bem-sucedido. Consulte [Reconhecimento do estado da sessão](/concepts/session-state).

## Auxiliares de status e orquestração

`session_status` é a ferramenta leve equivalente a `/status` para a sessão atual ou outra sessão visível. Ela informa uso, horário, estado do modelo/runtime e contexto vinculado de tarefas em segundo plano, quando presente. Assim como `/status`, ela pode preencher retroativamente contadores esparsos de tokens/cache a partir da entrada de uso mais recente da transcrição, e `model=default` remove uma substituição por sessão. Use `sessionKey="current"` para a sessão atual do chamador; rótulos visíveis de clientes, como `openclaw-tui`, não são chaves de sessão.

Quando os metadados de rota estão disponíveis, `session_status` também inclui um bloco JSON visível `Route context` e campos estruturados correspondentes em `details`. Esses campos diferenciam a chave da sessão da rota que está processando a execução ativa no momento:

- `origin` indica onde a sessão foi criada ou o provedor inferido a partir de um prefixo de chave de sessão apto para entrega quando um estado mais antigo não possui metadados de origem armazenados.
- `active` é a rota da execução ativa atual. Ela só é informada para a sessão ativa ou atual que está sendo processada no momento.
- `deliveryContext` é a rota de entrega persistida armazenada na sessão, que o OpenClaw pode reutilizar para entregas posteriores mesmo quando a superfície ativa é diferente.

## Alterações no estado da sessão

O OpenClaw mantém um registro durável de sinais de alterações relevantes no estado da sessão (mensagens humanas diretas para sessões observadas, resultados de execuções filhas, alterações de objetivo, Compaction). As linhas de `sessions_list` e `session_status` expõem o `stateVersion` da sessão, e `session_status` aceita `changesSince: <version>` para retornar os eventos tipados posteriores a essa versão, com sinalização exata de `historyGap` quando a versão solicitada é anterior ao histórico retido. Os observadores — pais de criações automaticamente, `sessions_send watch: true` explicitamente — recebem um aviso consolidado de estado desatualizado quando outro ator altera uma sessão observada.

Consulte [Reconhecimento do estado da sessão](/concepts/session-state) para ver o modelo completo: tipos de eventos, registro de observadores, protocolo de avisos antispam, fluxo de reconciliação e limites atuais.

`sessions_yield` encerra intencionalmente o turno atual para que a próxima mensagem possa ser o evento posterior que você está aguardando. Use-o após iniciar subagentes quando quiser que os resultados da conclusão cheguem como a próxima mensagem, em vez de criar ciclos de sondagem.

`subagents` é o auxiliar de visibilidade para subagentes do OpenClaw já iniciados. Ele oferece suporte a `action: "list"` para inspecionar execuções ativas/recentes.

## Criação de subagentes

`sessions_spawn` cria, por padrão, uma sessão isolada para uma tarefa em segundo plano. Ela é sempre não bloqueante; retorna imediatamente com um `runId` e uma `childSessionKey`. Execuções nativas de subagentes recebem a tarefa delegada na primeira mensagem visível `[Subagent Task]` da sessão filha, enquanto o prompt do sistema contém somente regras de runtime do subagente e contexto de roteamento.

Principais opções:

- `runtime: "subagent"` (padrão) ou `"acp"` para agentes de harness externos.
- Substituições de `model` e `thinking` para a sessão filha.
- `thread: true` para vincular a criação a uma thread de chat (Discord, Slack etc.).
- `sandbox: "require"` para impor o uso de sandbox à sessão filha.
- `context: "fork"` para subagentes nativos quando a sessão filha precisa da transcrição atual do solicitante; omita ou use `context: "isolated"` para uma sessão filha limpa. `context: "fork"` só é válido com `runtime: "subagent"`. Subagentes nativos vinculados a threads usam `context: "fork"` por padrão, a menos que `threadBindings.defaultSpawnContext` determine o contrário.

Por padrão, subagentes folha não recebem ferramentas de sessão. Quando `maxSpawnDepth >= 2`, subagentes orquestradores de profundidade 1 também recebem `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history`, para que possam gerenciar seus próprios filhos. Execuções folha ainda não recebem ferramentas de orquestração recursiva.

Após a conclusão, uma etapa de anúncio publica o resultado no canal do solicitante. A entrega da conclusão preserva o roteamento vinculado de thread/tópico quando disponível e, se a origem da conclusão identificar somente um canal, o OpenClaw ainda poderá reutilizar a rota armazenada da sessão do solicitante (`lastChannel` / `lastTo`) para entrega direta.

Para comportamentos específicos do ACP, consulte [Agentes ACP](/pt-BR/tools/acp-agents).

## Visibilidade

As ferramentas de sessão têm escopo limitado para restringir o que o agente pode ver:

| Nível   | Escopo                                     |
| ------- | ------------------------------------------ |
| `self`  | Somente a sessão atual                     |
| `tree`  | Sessão atual + subagentes iniciados        |
| `agent` | Todas as sessões deste agente              |
| `all`   | Todas as sessões (entre agentes, se configurado) |

O padrão é `tree`. Sessões em sandbox são limitadas a `tree`, independentemente da configuração.

## Leitura adicional

- [Gerenciamento de sessões](/pt-BR/concepts/session): roteamento, ciclo de vida, manutenção
- [Subagentes](/pt-BR/tools/subagents): ciclo de vida e entrega de sessões filhas
- [Agentes ACP](/pt-BR/tools/acp-agents): criação de harnesses externos
- [Multiagente](/pt-BR/concepts/multi-agent): arquitetura multiagente
- [Configuração do Gateway](/pt-BR/gateway/configuration): opções de configuração das ferramentas de sessão

## Relacionados

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Limpeza de sessões](/pt-BR/concepts/session-pruning)
