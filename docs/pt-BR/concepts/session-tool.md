---
read_when:
    - Você quer entender quais ferramentas de sessão o agente possui
    - Você quer configurar o acesso entre sessões ou a criação de subagentes
    - Você quer inspecionar o status dos subagentes iniciados
summary: Ferramentas de agente para status entre sessões, recuperação, troca de mensagens e orquestração de subagentes
title: Ferramentas de sessão
x-i18n:
    generated_at: "2026-07-12T15:07:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6b584912c012b632d001e7f77dc704b8b11ab2e897ed62238675026078039819
    source_path: concepts/session-tool.md
    workflow: 16
---

O OpenClaw fornece aos agentes ferramentas para trabalhar entre sessões, inspecionar o status e orquestrar subagentes.

## Ferramentas disponíveis

| Ferramenta         | O que ela faz                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| `sessions_list`    | Lista sessões com filtros opcionais (tipo, rótulo, agente, arquivamento, prévia)                 |
| `sessions_history` | Lê a transcrição de uma sessão específica                                                       |
| `sessions_send`    | Envia uma mensagem para outra sessão e, opcionalmente, aguarda                                   |
| `sessions_spawn`   | Inicia uma sessão isolada de subagente para trabalho em segundo plano                            |
| `sessions_yield`   | Encerra o turno atual e aguarda resultados posteriores dos subagentes                            |
| `subagents`        | Lista o status dos subagentes iniciados nesta sessão                                             |
| `session_status`   | Exibe um cartão no estilo `/status` e, opcionalmente, define uma substituição de modelo por sessão |

Essas ferramentas ainda estão sujeitas ao perfil de ferramentas ativo e à política de permissão/negação. `tools.profile: "coding"` inclui o conjunto completo de orquestração de sessões, incluindo `sessions_spawn`, `sessions_yield` e `subagents`. `tools.profile: "messaging"` inclui ferramentas de mensagens entre sessões (`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), mas não inclui a inicialização de subagentes. Para manter um perfil de mensagens e ainda permitir delegação nativa, adicione:

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

`sessions_list` retorna sessões com sua chave, agentId, tipo, canal, modelo, contagens de tokens e carimbos de data e hora. Filtre por `kinds` (matriz; valores aceitos: `main`, `group`, `cron`, `hook`, `node`, `other`), `label` exato, `agentId` exato, texto de `search` ou atividade recente (`activeMinutes`). Sessões ativas são retornadas por padrão; passe `archived: true` para inspecionar sessões arquivadas. As linhas incluem os estados `pinned` e `archived`. Defina `includeDerivedTitles`, `includeLastMessage` ou `messageLimit` (limitado a 20) quando precisar de uma triagem no estilo de caixa de entrada: um título derivado com escopo de visibilidade, um trecho de prévia da última mensagem ou mensagens recentes limitadas em cada linha. Os títulos derivados e as prévias são produzidos somente para sessões que o chamador já pode ver de acordo com a política de visibilidade configurada para as ferramentas de sessão, portanto, sessões não relacionadas permanecem ocultas. Quando a visibilidade é restrita, `sessions_list` retorna metadados opcionais de `visibility` que mostram o modo efetivo e um aviso de que os resultados podem estar limitados pelo escopo.

`sessions_history` busca a transcrição da conversa de uma sessão específica. Por padrão, os resultados de ferramentas são excluídos; passe `includeTools: true` para vê-los. Use `limit` para obter o trecho limitado mais recente. Passe `offset: 0` quando precisar de metadados de paginação e, em seguida, passe os valores `nextOffset` retornados para percorrer retroativamente janelas mais antigas da transcrição do OpenClaw sem ler arquivos brutos de transcrição. Páginas com deslocamento explícito não mesclam importações externas de fallback da CLI; use a visualização padrão do trecho mais recente (sem `offset`) quando precisar desse histórico de exibição mesclado.

A visualização retornada é intencionalmente limitada e filtrada por segurança:

- o texto do assistente é normalizado antes da recuperação:
  - as tags de raciocínio são removidas
  - os blocos estruturais `<relevant-memories>` / `<relevant_memories>` são removidos
  - blocos de carga XML de chamadas de ferramentas em texto simples, como `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e `<function_calls>...</function_calls>`, são removidos, incluindo cargas truncadas que nunca são fechadas corretamente
  - estruturas rebaixadas de chamadas/resultados de ferramentas, como `[Tool Call: ...]`, `[Tool Result ...]` e `[Historical context ...]`, são removidas
  - tokens de controle do modelo que vazaram, como `<|assistant|>`, outros tokens ASCII `<|...|>` e variantes de largura completa `<｜...｜>`, são removidos
  - XML malformado de chamadas de ferramentas do MiniMax, como `<invoke ...>` / `</minimax:tool_call>`, é removido
- textos semelhantes a credenciais/tokens são ocultados antes de serem retornados
- blocos de texto longos são truncados
- históricos muito grandes podem descartar linhas mais antigas ou substituir uma linha grande demais por `[sessions_history omitted: message too large]`
- a ferramenta relata sinalizadores de resumo, como `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`, `bytes`, e metadados de paginação

Ambas as ferramentas aceitam uma **chave de sessão** (como `"main"`) ou um **ID de sessão** de uma chamada de listagem anterior.

Se precisar da transcrição bruta exata, inspecione as linhas de transcrição do SQLite com o escopo apropriado em vez de tratar `sessions_history` como um despejo não filtrado.

## Envio de mensagens entre sessões

`sessions_send` entrega uma mensagem a outra sessão e, opcionalmente, aguarda a resposta:

- **Enviar sem aguardar:** defina `timeoutSeconds: 0` para enfileirar e retornar imediatamente.
- **Aguardar resposta:** defina um tempo limite e receba a resposta em linha.

Sessões de chat com escopo de thread, como chaves que terminam em `:thread:<id>`, não são destinos válidos para `sessions_send`. Use a chave da sessão do canal pai para a coordenação entre agentes, para que mensagens encaminhadas por ferramentas não apareçam dentro de uma thread ativa voltada a pessoas.

As mensagens e respostas posteriores de A2A são marcadas como dados entre sessões no prompt receptor (`[Inter-session message ... isUser=false]`) e na procedência da transcrição. O agente receptor deve tratá-las como dados encaminhados por ferramentas, não como uma instrução escrita diretamente pelo usuário final.

Depois que o destino responde, o OpenClaw pode executar um **ciclo de respostas de retorno** no qual os agentes alternam mensagens (até `session.agentToAgent.maxPingPongTurns`, intervalo de 0-20, padrão 5). O agente de destino pode responder `REPLY_SKIP` para encerrar antecipadamente.

## Auxiliares de status e orquestração

`session_status` é a ferramenta leve equivalente a `/status` para a sessão atual ou outra sessão visível. Ela relata uso, tempo, estado do modelo/runtime e contexto de tarefas em segundo plano vinculadas, quando presente. Assim como `/status`, ela pode preencher contadores esparsos de tokens/cache a partir da entrada de uso mais recente da transcrição, e `model=default` remove uma substituição por sessão. Use `sessionKey="current"` para a sessão atual do chamador; rótulos visíveis do cliente, como `openclaw-tui`, não são chaves de sessão.

Quando os metadados de rota estão disponíveis, `session_status` também inclui um bloco JSON visível `Route context` e campos estruturados correspondentes em `details`. Esses campos distinguem a chave da sessão da rota que está processando atualmente a execução ativa:

- `origin` indica onde a sessão foi criada ou o provedor inferido de um prefixo de chave de sessão apto para entrega quando um estado mais antigo não possui metadados de origem armazenados.
- `active` é a rota da execução ativa atual. Ela só é informada para a sessão ativa ou atual que está sendo processada agora.
- `deliveryContext` é a rota de entrega persistida armazenada na sessão, que o OpenClaw pode reutilizar para entregas posteriores mesmo quando a superfície ativa é diferente.

## Alterações no estado da sessão

O OpenClaw mantém um registro de sinais de melhor esforço para determinadas alterações no estado da sessão: mensagens humanas diretas para sessões filhas, conclusão ou falha de execuções filhas, criação de filhas, alterações de objetivo e Compaction. Execuções filhas canceladas e que atingiram o tempo limite são registradas como falhas, com o resultado específico (`cancelled`, `timeout` ou `error`) preservado na carga do evento. O registro contém metadados e resumos de uma linha, nunca o conteúdo das mensagens. Seu `stateVersion` é o cabeçalho do registro de sinais da sessão, não uma versão transacional de captura de alterações de dados; a mutação do armazenamento da sessão e a adição do sinal usam armazenamentos separados, portanto, uma falha na adição é registrada sem causar falha no turno de origem.

`sessions_list` inclui `stateVersion` nas linhas com alterações registradas. `session_status` sempre retorna `stateVersion` nos detalhes estruturados. Passe `changesSince: <previousStateVersion>` para recuperar até 200 eventos retidos após essa versão; essa leitura não confirma nem avança os cursores de notificação do pai. Um resultado `historyGap: true` significa que a versão solicitada é anterior ao histórico retido; portanto, atualize todo o estado da sessão em vez de tratar a resposta como um delta exato.

Quando outro ator envia um turno humano direto para uma filha monitorada ou altera seu objetivo, o pai recebe um aviso do sistema instruindo-o a chamar `session_status` com sua última versão vista. Pais de sessão principal são despertados proativamente. Pais de subagentes aninhados recebem o aviso no próximo turno porque o roteamento de Heartbeat não pode direcioná-lo diretamente à fila deles. Os anúncios de conclusão continuam responsáveis pela entrega comum da conclusão de execuções filhas.

O histórico é limitado a 30 dias e 50.000 linhas, enquanto os cabeçalhos por sessão permanecem monotônicos após a remoção. A entrega de avisos usa a fila de eventos do sistema em memória do Gateway e pressupõe que um processo do Gateway seja responsável pela entrega no banco de dados de estado compartilhado. Vários Gateways ainda compartilham o registro durável e a superfície de reconciliação `changesSince`, mas a v1 não envia avisos entre processos. Os avisos aos pais exigem uma chave de sessão pai qualificada pelo agente; com `session.scope="global"`, a chave compartilhada `global` é ambígua entre agentes, portanto, esses pais recebem o registro durável e `changesSince`, mas nenhum aviso proativo na v1.

`sessions_yield` encerra intencionalmente o turno atual para que a próxima mensagem possa ser o evento posterior que você está aguardando. Use-o após iniciar subagentes quando quiser que os resultados da conclusão cheguem como a próxima mensagem, em vez de criar ciclos de sondagem.

`subagents` é o auxiliar de visibilidade para subagentes do OpenClaw já iniciados. Ele oferece suporte a `action: "list"` para inspecionar execuções ativas/recentes.

## Inicialização de subagentes

`sessions_spawn` cria, por padrão, uma sessão isolada para uma tarefa em segundo plano. Ela é sempre não bloqueante; retorna imediatamente um `runId` e uma `childSessionKey`. As execuções nativas de subagentes recebem a tarefa delegada na primeira mensagem visível `[Subagent Task]` da sessão filha, enquanto o prompt do sistema contém apenas regras de runtime do subagente e contexto de roteamento.

Principais opções:

- `runtime: "subagent"` (padrão) ou `"acp"` para agentes de ambientes externos.
- Substituições de `model` e `thinking` para a sessão filha.
- `thread: true` para vincular a inicialização a uma thread de chat (Discord, Slack etc.).
- `sandbox: "require"` para impor sandbox à filha.
- `context: "fork"` para subagentes nativos quando a filha precisa da transcrição atual do solicitante; omita ou use `context: "isolated"` para uma filha sem contexto prévio. `context: "fork"` só é válido com `runtime: "subagent"`. Subagentes nativos vinculados a threads usam `context: "fork"` por padrão, a menos que `threadBindings.defaultSpawnContext` determine o contrário.

Subagentes folha padrão não recebem ferramentas de sessão. Quando `maxSpawnDepth >= 2`, subagentes orquestradores de profundidade 1 recebem adicionalmente `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` para que possam gerenciar suas próprias filhas. Execuções folha ainda não recebem ferramentas de orquestração recursiva.

Após a conclusão, uma etapa de anúncio publica o resultado no canal do solicitante. A entrega da conclusão preserva o roteamento da thread/tópico vinculados quando disponível e, se a origem da conclusão identificar apenas um canal, o OpenClaw ainda poderá reutilizar a rota armazenada na sessão do solicitante (`lastChannel` / `lastTo`) para entrega direta.

Para o comportamento específico de ACP, consulte [Agentes ACP](/pt-BR/tools/acp-agents).

## Visibilidade

As ferramentas de sessão têm seu escopo definido para limitar o que o agente pode ver:

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
- [Agentes ACP](/pt-BR/tools/acp-agents): inicialização de harness externo
- [Multiagente](/pt-BR/concepts/multi-agent): arquitetura multiagente
- [Configuração do Gateway](/pt-BR/gateway/configuration): opções de configuração da ferramenta de sessão

## Relacionado

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Poda de sessões](/pt-BR/concepts/session-pruning)
