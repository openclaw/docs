---
read_when:
    - Você quer entender quais ferramentas de sessão o agente possui
    - Você quer configurar o acesso entre sessões ou a geração de subagentes
    - Você quer inspecionar o status do subagente criado
summary: Ferramentas de agente para status entre sessões, recuperação, mensagens e orquestração de subagentes
title: Ferramentas da sessão
x-i18n:
    generated_at: "2026-06-28T00:12:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffc7edf68e4510ea6a5fe93238be32e9d7eacf8e7b49e58f63536c14bbe2da80
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw dá aos agentes ferramentas para trabalhar entre sessões, inspecionar status e
orquestrar subagentes.

## Ferramentas disponíveis

| Ferramenta        | O que faz                                                                         |
| ----------------- | --------------------------------------------------------------------------------- |
| `sessions_list`   | Lista sessões com filtros opcionais (tipo, rótulo, agente, recência, prévia)      |
| `sessions_history` | Lê a transcrição de uma sessão específica                                        |
| `sessions_send`   | Envia uma mensagem para outra sessão e, opcionalmente, aguarda                    |
| `sessions_spawn`  | Cria uma sessão isolada de subagente para trabalho em segundo plano               |
| `sessions_yield`  | Encerra o turno atual e aguarda resultados posteriores de subagentes              |
| `subagents`       | Lista o status dos subagentes criados para esta sessão                            |
| `session_status`  | Mostra um cartão no estilo `/status` e, opcionalmente, define uma substituição de modelo por sessão |

Essas ferramentas ainda estão sujeitas ao perfil de ferramentas ativo e à
política de permissão/negação. `tools.profile: "coding"` inclui o conjunto
completo de orquestração de sessões, incluindo `sessions_spawn`,
`sessions_yield` e `subagents`. `tools.profile: "messaging"` inclui ferramentas
de mensagens entre sessões (`sessions_list`, `sessions_history`,
`sessions_send`, `session_status`), mas não inclui criação de subagentes. Para
manter um perfil de mensagens e ainda permitir delegação nativa, adicione:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Políticas de grupo, provedor, sandbox e por agente ainda podem remover essas
ferramentas depois da etapa de perfil. Use `/tools` na sessão afetada para
inspecionar a lista efetiva de ferramentas.

## Listar e ler sessões

`sessions_list` retorna sessões com sua chave, agentId, tipo, canal, modelo,
contagens de tokens e timestamps. Filtre por tipo (`main`, `group`, `cron`,
`hook`, `node`), `label` exato, `agentId` exato, texto de busca ou recência
(`activeMinutes`). Quando você precisar de triagem em estilo caixa de entrada,
ela também pode solicitar um título derivado escopado por visibilidade, um
trecho de prévia da última mensagem ou mensagens recentes limitadas em cada
linha. Títulos derivados e prévias são produzidos apenas para sessões que o
chamador já pode ver conforme a política configurada de visibilidade da
ferramenta de sessão, então sessões não relacionadas permanecem ocultas. Quando
a visibilidade é restrita, `sessions_list` retorna metadados opcionais
`visibility` mostrando o modo efetivo e um aviso de que os resultados podem
estar limitados por escopo.

`sessions_history` busca a transcrição da conversa de uma sessão específica.
Por padrão, resultados de ferramentas são excluídos; passe `includeTools: true`
para vê-los. Use `limit` para a cauda limitada mais recente. Passe `offset: 0`
quando precisar de metadados de paginação; depois passe os valores retornados
de `nextOffset` para paginar para trás por janelas mais antigas de transcrição
do OpenClaw sem ler arquivos brutos de transcrição. Páginas com offset explícito
não mesclam importações externas de fallback da CLI; use a visualização padrão
da cauda mais recente quando precisar desse histórico de exibição mesclado.
A visualização retornada é intencionalmente limitada e filtrada por segurança:

- o texto do assistente é normalizado antes da recuperação:
  - tags de pensamento são removidas
  - blocos de estrutura `<relevant-memories>` / `<relevant_memories>` são removidos
  - blocos de payload XML de chamadas de ferramenta em texto simples, como `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>`, são removidos, incluindo payloads
    truncados que nunca fecham corretamente
  - estruturas rebaixadas de chamada/resultado de ferramenta, como `[Tool Call: ...]`,
    `[Tool Result ...]` e `[Historical context ...]`, são removidas
  - tokens vazados de controle do modelo, como `<|assistant|>`, outros tokens
    ASCII `<|...|>` e variantes de largura total `<｜...｜>` são removidos
  - XML malformado de chamada de ferramenta do MiniMax, como `<invoke ...>` /
    `</minimax:tool_call>`, é removido
- texto semelhante a credenciais/tokens é redigido antes de ser retornado
- blocos de texto longos são truncados
- históricos muito grandes podem descartar linhas antigas ou substituir uma linha grande demais por
  `[sessions_history omitted: message too large]`
- a ferramenta relata flags de resumo como `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, `bytes` e metadados de paginação

Ambas as ferramentas aceitam uma **chave de sessão** (como `"main"`) ou um
**ID de sessão** de uma chamada de listagem anterior.

Se você precisar da transcrição byte a byte exata, inspecione o arquivo de
transcrição no disco em vez de tratar `sessions_history` como um despejo bruto.

## Enviar mensagens entre sessões

`sessions_send` entrega uma mensagem a outra sessão e, opcionalmente, aguarda a
resposta:

- **Enviar e esquecer:** defina `timeoutSeconds: 0` para enfileirar e retornar
  imediatamente.
- **Aguardar resposta:** defina um tempo limite e receba a resposta inline.

Sessões de chat escopadas a thread, como chaves do Slack ou Discord terminando
em `:thread:<id>`, não são destinos válidos de `sessions_send`. Use a chave de
sessão do canal pai para coordenação entre agentes, de modo que mensagens
roteadas por ferramenta não apareçam dentro de uma thread ativa voltada a
humanos.

Mensagens e respostas de acompanhamento A2A são marcadas como dados entre
sessões no prompt receptor (`[Inter-session message ... isUser=false]`) e na
proveniência da transcrição. O agente receptor deve tratá-las como dados
roteados por ferramenta, não como uma instrução escrita diretamente pelo usuário
final.

Depois que o destino responde, o OpenClaw pode executar um **loop de resposta de
volta** em que os agentes alternam mensagens (até
`session.agentToAgent.maxPingPongTurns`, intervalo 0-20, padrão 5). O agente de
destino pode responder `REPLY_SKIP` para parar antes.

## Auxiliares de status e orquestração

`session_status` é a ferramenta leve equivalente a `/status` para a sessão
atual ou outra sessão visível. Ela relata uso, tempo, estado de modelo/runtime e
contexto vinculado de tarefa em segundo plano quando presente. Como `/status`,
ela pode preencher retroativamente contadores esparsos de tokens/cache a partir
da entrada de uso mais recente da transcrição, e `model=default` limpa uma
substituição por sessão. Use `sessionKey="current"` para a sessão atual do
chamador; rótulos visíveis de cliente, como `openclaw-tui`, não são chaves de
sessão.

Quando metadados de rota estão disponíveis, `session_status` também inclui um
bloco JSON visível `Route context` e campos estruturados `details`
correspondentes. Esses campos diferenciam a chave de sessão da rota que está
lidando atualmente com a execução ao vivo:

- `origin` é onde a sessão foi criada, ou o provedor inferido de um prefixo de
  chave de sessão entregável quando estados antigos não têm metadados de origem
  armazenados.
- `active` é a rota atual de execução ao vivo. Ela é relatada apenas para a
  sessão ao vivo ou atual que está sendo tratada agora.
- `deliveryContext` é a rota de entrega persistida armazenada na sessão, que o
  OpenClaw pode reutilizar para entrega posterior mesmo quando a superfície
  ativa for diferente.

`sessions_yield` encerra intencionalmente o turno atual para que a próxima
mensagem possa ser o evento de acompanhamento que você está aguardando. Use-a
depois de criar subagentes quando quiser que os resultados de conclusão cheguem
como a próxima mensagem, em vez de criar loops de polling.

`subagents` é o auxiliar de visibilidade para subagentes OpenClaw já criados.
Ele oferece suporte a `action: "list"` para inspecionar execuções ativas/recentes.

## Criar subagentes

`sessions_spawn` cria por padrão uma sessão isolada para uma tarefa em segundo
plano. Ela é sempre não bloqueante; retorna imediatamente com um `runId` e
`childSessionKey`. Execuções nativas de subagente recebem a tarefa delegada na
primeira mensagem visível `[Subagent Task]` da sessão filha, enquanto o prompt
do sistema carrega apenas regras de runtime de subagente e contexto de
roteamento.

Opções principais:

- `runtime: "subagent"` (padrão) ou `"acp"` para agentes de harness externos.
- Substituições de `model` e `thinking` para a sessão filha.
- `thread: true` para vincular a criação a uma thread de chat (Discord, Slack etc.).
- `sandbox: "require"` para impor sandboxing ao filho.
- `context: "fork"` para subagentes nativos quando o filho precisa da
  transcrição atual do solicitante; omita ou use `context: "isolated"` para um
  filho limpo. Subagentes nativos vinculados a thread usam `context: "fork"` por
  padrão, a menos que `threadBindings.defaultSpawnContext` diga o contrário.

Subagentes folha padrão não recebem ferramentas de sessão. Quando
`maxSpawnDepth >= 2`, subagentes orquestradores de profundidade 1 recebem
adicionalmente `sessions_spawn`, `subagents`, `sessions_list` e
`sessions_history`, para que possam gerenciar seus próprios filhos. Execuções
folha ainda não recebem ferramentas de orquestração recursiva.

Após a conclusão, uma etapa de anúncio publica o resultado no canal do
solicitante. A entrega de conclusão preserva roteamento vinculado de
thread/tópico quando disponível e, se a origem da conclusão identificar apenas
um canal, o OpenClaw ainda pode reutilizar a rota armazenada da sessão do
solicitante (`lastChannel` / `lastTo`) para entrega direta.

Para comportamento específico de ACP, consulte [Agentes ACP](/pt-BR/tools/acp-agents).

## Visibilidade

Ferramentas de sessão são escopadas para limitar o que o agente pode ver:

| Nível   | Escopo                                   |
| ------- | ---------------------------------------- |
| `self`  | Apenas a sessão atual                    |
| `tree`  | Sessão atual + subagentes criados        |
| `agent` | Todas as sessões deste agente            |
| `all`   | Todas as sessões (entre agentes, se configurado) |

O padrão é `tree`. Sessões em sandbox são limitadas a `tree`
independentemente da configuração.

## Leitura adicional

- [Gerenciamento de sessões](/pt-BR/concepts/session) -- roteamento, ciclo de vida, manutenção
- [Agentes ACP](/pt-BR/tools/acp-agents) -- criação de harness externo
- [Multiagente](/pt-BR/concepts/multi-agent) -- arquitetura multiagente
- [Configuração do Gateway](/pt-BR/gateway/configuration) -- ajustes de configuração de ferramentas de sessão

## Relacionado

- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Poda de sessões](/pt-BR/concepts/session-pruning)
