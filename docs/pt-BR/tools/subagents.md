---
read_when:
    - Você quer trabalho em segundo plano ou paralelo por meio do agente
    - Você está alterando a política de sessions_spawn ou da ferramenta de subagente
    - Você está implementando ou solucionando problemas de sessões de subagentes vinculadas à thread
sidebarTitle: Sub-agents
summary: Gere execuções isoladas de agentes em segundo plano que anunciam os resultados de volta no chat do solicitante
title: Subagentes
x-i18n:
    generated_at: "2026-05-02T21:07:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e964df543bd19435daf94f2c85a34b9d32e07662405d2eac7635935f1e7bf64
    source_path: tools/subagents.md
    workflow: 16
---

Subagentes são execuções de agentes em segundo plano geradas a partir de uma execução de agente existente.
Eles são executados em sua própria sessão (`agent:<agentId>:subagent:<uuid>`) e,
quando terminam, **anunciam** seu resultado de volta ao canal de chat
solicitante. Cada execução de subagente é rastreada como uma
[tarefa em segundo plano](/pt-BR/automation/tasks).

Objetivos principais:

- Paralelizar trabalho de "pesquisa / tarefa longa / ferramenta lenta" sem bloquear a execução principal.
- Manter subagentes isolados por padrão (separação de sessão + sandboxing opcional).
- Manter a superfície de ferramentas difícil de usar incorretamente: subagentes **não** recebem ferramentas de sessão por padrão.
- Dar suporte a profundidade de aninhamento configurável para padrões de orquestrador.

<Note>
**Observação de custo:** cada subagente tem seu próprio contexto e uso de tokens por
padrão. Para tarefas pesadas ou repetitivas, defina um modelo mais barato para subagentes
e mantenha seu agente principal em um modelo de maior qualidade. Configure via
`agents.defaults.subagents.model` ou substituições por agente. Quando um filho
    realmente precisa da transcrição atual do solicitante, o agente pode solicitar
    `context: "fork"` nessa geração específica. Sessões de subagente vinculadas a thread usam por padrão
    `context: "fork"` porque ramificam a conversa atual em uma
    thread de acompanhamento.
</Note>

## Comando slash

Use `/subagents` para inspecionar ou controlar execuções de subagente da **sessão
atual**:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

`/subagents info` mostra metadados da execução (status, carimbos de data/hora, id da sessão,
caminho da transcrição, limpeza). Use `sessions_history` para uma visão de recuperação limitada
e filtrada por segurança; inspecione o caminho da transcrição em disco quando você
precisar da transcrição completa bruta.

### Controles de vinculação de thread

Esses comandos funcionam em canais que dão suporte a vinculações persistentes de thread.
Veja [Canais com suporte a thread](#thread-supporting-channels) abaixo.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamento de geração

`/subagents spawn` inicia um subagente em segundo plano como um comando do usuário (não um
reencaminhamento interno) e envia uma atualização final de conclusão de volta ao
chat solicitante quando a execução termina.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - O comando de geração não bloqueia; ele retorna um id de execução imediatamente.
    - Ao concluir, o subagente anuncia uma mensagem de resumo/resultado de volta ao canal de chat solicitante.
    - A conclusão é baseada em push. Depois de gerar, **não** consulte `/subagents list`, `sessions_list` ou `sessions_history` em loop apenas para esperar que termine; inspecione o status somente sob demanda para depuração ou intervenção.
    - Ao concluir, o OpenClaw faz o melhor esforço para fechar abas/processos do navegador rastreados que foram abertos por essa sessão de subagente antes que o fluxo de limpeza do anúncio continue.

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - O OpenClaw tenta primeiro a entrega direta por `agent` com uma chave de idempotência estável.
    - Se a entrega direta falhar, ele recorre ao roteamento por fila.
    - Se o roteamento por fila ainda não estiver disponível, o anúncio é tentado novamente com um breve backoff exponencial antes da desistência final.
    - A entrega de conclusão mantém a rota resolvida do solicitante: rotas de conclusão vinculadas a thread ou vinculadas à conversa prevalecem quando disponíveis; se a origem da conclusão fornece apenas um canal, o OpenClaw preenche o destino/conta ausente a partir da rota resolvida da sessão solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que a entrega direta ainda funcione.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    A passagem de conclusão para a sessão solicitante é contexto interno gerado em tempo de execução
    (não texto criado pelo usuário) e inclui:

    - `Result` — o texto da resposta `assistant` visível mais recente; caso contrário, o texto sanitizado mais recente de tool/toolResult. Execuções terminais com falha não reutilizam texto de resposta capturado.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Estatísticas compactas de tempo de execução/tokens.
    - Uma instrução de entrega dizendo ao agente solicitante para reescrever em voz normal de assistente (não encaminhar metadados internos brutos).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` e `--thinking` substituem os padrões dessa execução específica.
    - Use `info`/`log` para inspecionar detalhes e saída após a conclusão.
    - `/subagents spawn` é modo de execução única (`mode: "run"`). Para sessões persistentes vinculadas a thread, use `sessions_spawn` com `thread: true` e `mode: "session"`.
    - Para sessões de harness ACP (Claude Code, Gemini CLI, OpenCode ou Codex ACP/acpx explícito), use `sessions_spawn` com `runtime: "acp"` quando a ferramenta anunciar esse runtime. Veja [modelo de entrega ACP](/pt-BR/tools/acp-agents#delivery-model) ao depurar conclusões ou loops de agente para agente. Quando o plugin `codex` estiver habilitado, o controle de chat/thread do Codex deve preferir `/codex ...` em vez de ACP, a menos que o usuário peça explicitamente ACP/acpx.
    - O OpenClaw oculta `runtime: "acp"` até que ACP esteja habilitado, o solicitante não esteja em sandbox e um plugin de backend como `acpx` esteja carregado. `runtime: "acp"` espera um id externo de harness ACP ou uma entrada `agents.list[]` com `runtime.type="acp"`; use o runtime padrão de subagente para agentes normais de configuração do OpenClaw a partir de `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Subagentes nativos começam isolados, a menos que o chamador peça explicitamente para ramificar
a transcrição atual.

| Modo       | Quando usar                                                                                                                         | Comportamento                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Pesquisa nova, implementação independente, trabalho com ferramenta lenta ou qualquer coisa que possa ser instruída no texto da tarefa                           | Cria uma transcrição filha limpa. Este é o padrão e mantém o uso de tokens mais baixo.  |
| `fork`     | Trabalho que depende da conversa atual, resultados anteriores de ferramentas ou instruções sutis já presentes na transcrição do solicitante | Ramifica a transcrição do solicitante para a sessão filha antes do início do filho. |

Use `fork` com moderação. Ele é para delegação sensível ao contexto, não um
substituto para escrever um prompt de tarefa claro.

## Ferramenta: `sessions_spawn`

Inicia uma execução de subagente com `deliver: false` na faixa global `subagent`,
depois executa uma etapa de anúncio e publica a resposta de anúncio no canal de chat
solicitante.

A disponibilidade depende da política efetiva de ferramentas do chamador. Os perfis `coding` e
`full` expõem `sessions_spawn` por padrão. O perfil `messaging`
não expõe; adicione `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` ou use `tools.profile: "coding"` para agentes que devem delegar
trabalho. Políticas de canal/grupo, provedor, sandbox e allow/deny por agente ainda podem
remover a ferramenta após a etapa de perfil. Use `/tools` da mesma
sessão para confirmar a lista efetiva de ferramentas.

**Padrões:**

- **Modelo:** herda do chamador, a menos que você defina `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` por agente); um `sessions_spawn.model` explícito ainda prevalece.
- **Thinking:** herda do chamador, a menos que você defina `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` por agente); um `sessions_spawn.thinking` explícito ainda prevalece.
- **Tempo limite da execução:** se `sessions_spawn.runTimeoutSeconds` for omitido, o OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário, recorre a `0` (sem tempo limite).

### Parâmetros da ferramenta

<ParamField path="task" type="string" required>
  A descrição da tarefa para o subagente.
</ParamField>
<ParamField path="label" type="string">
  Rótulo opcional legível por humanos.
</ParamField>
<ParamField path="agentId" type="string">
  Gerar sob outro id de agente quando permitido por `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` é apenas para harnesses ACP externos (`claude`, `droid`, `gemini`, `opencode` ou Codex ACP/acpx explicitamente solicitado) e para entradas `agents.list[]` cujo `runtime.type` é `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Somente ACP. Retoma uma sessão de harness ACP existente quando `runtime: "acp"`; ignorado para gerações nativas de subagente.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Somente ACP. Transmite a saída da execução ACP para a sessão pai quando `runtime: "acp"`; omita para gerações nativas de subagente.
</ParamField>
<ParamField path="model" type="string">
  Substitui o modelo do subagente. Valores inválidos são ignorados e o subagente é executado no modelo padrão com um aviso no resultado da ferramenta.
</ParamField>
<ParamField path="thinking" type="string">
  Substitui o nível de thinking da execução do subagente.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Usa como padrão `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário, `0`. Quando definido, a execução do subagente é abortada após N segundos.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Quando `true`, solicita vinculação de thread de canal para esta sessão de subagente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Se `thread: true` e `mode` for omitido, o padrão se torna `session`. `mode: "session"` requer `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` arquiva imediatamente após o anúncio (ainda mantém a transcrição via renomeação).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rejeita a geração, a menos que o runtime filho de destino esteja em sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` ramifica a transcrição atual do solicitante para a sessão filha. Somente subagentes nativos. Gerações vinculadas a thread usam `fork` por padrão; gerações sem thread usam `isolated` por padrão.
</ParamField>

<Warning>
`sessions_spawn` **não** aceita parâmetros de entrega por canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Para entrega, use
`message`/`sessions_send` a partir da execução gerada.
</Warning>

## Sessões vinculadas a thread

Quando vinculações de thread estão habilitadas para um canal, um subagente pode permanecer vinculado
a uma thread para que mensagens de acompanhamento do usuário nessa thread continuem sendo roteadas para a
mesma sessão de subagente.

### Canais com suporte a thread

**Discord** atualmente é o único canal compatível. Ele oferece suporte a
sessões persistentes de subagente vinculadas a thread (`sessions_spawn` com
`thread: true`), controles manuais de thread (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) e chaves de adaptador
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` e
`channels.discord.threadBindings.spawnSessions`.

### Fluxo rápido

<Steps>
  <Step title="Spawn">
    `sessions_spawn` com `thread: true` (e opcionalmente `mode: "session"`).
  </Step>
  <Step title="Bind">
    O OpenClaw cria ou vincula uma thread a esse destino de sessão no canal ativo.
  </Step>
  <Step title="Route follow-ups">
    Respostas e mensagens de acompanhamento nessa thread são roteadas para a sessão vinculada.
  </Step>
  <Step title="Inspect timeouts">
    Use `/session idle` para inspecionar/atualizar o auto-desfoque por inatividade e
    `/session max-age` para controlar o limite rígido.
  </Step>
  <Step title="Detach">
    Use `/unfocus` para desvincular manualmente.
  </Step>
</Steps>

### Controles manuais

| Comando            | Efeito                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Vincula o tópico atual (ou cria um) a um destino de subagente/sessão |
| `/unfocus`         | Remove o vínculo do tópico vinculado atual                       |
| `/agents`          | Lista execuções ativas e o estado do vínculo (`thread:<id>` ou `unbound`)       |
| `/session idle`    | Inspeciona/atualiza o auto-desfoque por inatividade (somente tópicos vinculados em foco)         |
| `/session max-age` | Inspeciona/atualiza o limite rígido (somente tópicos vinculados em foco)                  |

### Chaves de configuração

- **Padrão global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Chaves de substituição por canal e vínculo automático ao criar** são específicas do adaptador. Consulte [Canais com suporte a tópicos](#thread-supporting-channels) acima.

Consulte a [Referência de configuração](/pt-BR/gateway/configuration-reference) e
[Comandos de barra](/pt-BR/tools/slash-commands) para detalhes atuais dos adaptadores.

### Lista de permissões

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de ids de agente que podem ser direcionados via `agentId` explícito (`["*"]` permite qualquer um). Padrão: somente o agente solicitante. Se você definir uma lista e ainda quiser que o solicitante crie a si mesmo com `agentId`, inclua o id do solicitante na lista.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista de permissões padrão de agente-alvo usada quando o agente solicitante não define seu próprio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloqueia chamadas `sessions_spawn` que omitem `agentId` (força a seleção explícita de perfil). Substituição por agente: `agents.list[].subagents.requireAgentId`.
</ParamField>

Se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeita alvos
que seriam executados sem sandbox.

### Descoberta

Use `agents_list` para ver quais ids de agente estão atualmente permitidos para
`sessions_spawn`. A resposta inclui o modelo efetivo de cada agente listado
e metadados de runtime incorporados para que chamadores possam distinguir PI, o servidor de app Codex
e outros runtimes nativos configurados.

### Arquivamento automático

- Sessões de subagentes são arquivadas automaticamente após `agents.defaults.subagents.archiveAfterMinutes` (padrão `60`).
- O arquivamento usa `sessions.delete` e renomeia a transcrição para `*.deleted.<timestamp>` (mesma pasta).
- `cleanup: "delete"` arquiva imediatamente após o anúncio (ainda mantém a transcrição via renomeação).
- O arquivamento automático é de melhor esforço; timers pendentes são perdidos se o Gateway reiniciar.
- `runTimeoutSeconds` **não** arquiva automaticamente; ele apenas interrompe a execução. A sessão permanece até o arquivamento automático.
- O arquivamento automático se aplica igualmente a sessões de profundidade 1 e profundidade 2.
- A limpeza do navegador é separada da limpeza de arquivamento: abas/processos de navegador rastreados são fechados em melhor esforço quando a execução termina, mesmo que o registro de transcrição/sessão seja mantido.

## Subagentes aninhados

Por padrão, subagentes não podem criar seus próprios subagentes
(`maxSpawnDepth: 1`). Defina `maxSpawnDepth: 2` para habilitar um nível de
aninhamento — o **padrão de orquestrador**: principal → subagente orquestrador →
sub-subagentes trabalhadores.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### Níveis de profundidade

| Profundidade | Formato da chave de sessão                            | Função                                          | Pode criar?                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principal                                    | Sempre                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestrador quando profundidade 2 é permitida) | Somente se `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagente (trabalhador folha)                   | Nunca                        |

### Cadeia de anúncios

Os resultados fluem de volta pela cadeia:

1. O trabalhador de profundidade 2 termina → anuncia para seu pai (orquestrador de profundidade 1).
2. O orquestrador de profundidade 1 recebe o anúncio, sintetiza os resultados, termina → anuncia para o principal.
3. O agente principal recebe o anúncio e entrega ao usuário.

Cada nível vê apenas anúncios de seus filhos diretos.

<Note>
**Orientação operacional:** inicie o trabalho filho uma vez e aguarde eventos
de conclusão em vez de criar loops de sondagem em torno de `sessions_list`,
`sessions_history`, `/subagents list` ou comandos `exec` de suspensão.
`sessions_list` e `/subagents list` mantêm os relacionamentos de sessões filhas
focados no trabalho ativo — filhos ativos permanecem anexados, filhos finalizados ficam
visíveis por uma janela recente curta, e links de filhos obsoletos existentes apenas no armazenamento são
ignorados depois de sua janela de atualização. Isso impede que metadados antigos de `spawnedBy` /
`parentSessionKey` ressuscitem filhos fantasmas após
reinicialização. Se um evento de conclusão de filho chegar depois que você já enviou a
resposta final, o acompanhamento correto é o token silencioso exato
`NO_REPLY` / `no_reply`.
</Note>

### Política de ferramentas por profundidade

- A função e o escopo de controle são gravados nos metadados da sessão no momento da criação. Isso impede que chaves de sessão planas ou restauradas recuperem privilégios de orquestrador acidentalmente.
- **Profundidade 1 (orquestrador, quando `maxSpawnDepth >= 2`):** recebe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder gerenciar seus filhos. Outras ferramentas de sessão/sistema permanecem negadas.
- **Profundidade 1 (folha, quando `maxSpawnDepth == 1`):** nenhuma ferramenta de sessão (comportamento padrão atual).
- **Profundidade 2 (trabalhador folha):** nenhuma ferramenta de sessão — `sessions_spawn` é sempre negado na profundidade 2. Não pode criar mais filhos.

### Limite de criação por agente

Cada sessão de agente (em qualquer profundidade) pode ter no máximo `maxChildrenPerAgent`
(padrão `5`) filhos ativos ao mesmo tempo. Isso impede expansão descontrolada
a partir de um único orquestrador.

### Interrupção em cascata

Interromper um orquestrador de profundidade 1 interrompe automaticamente todos os seus filhos de profundidade 2:

- `/stop` no chat principal interrompe todos os agentes de profundidade 1 e faz cascata para seus filhos de profundidade 2.
- `/subagents kill <id>` interrompe um subagente específico e faz cascata para seus filhos.
- `/subagents kill all` interrompe todos os subagentes do solicitante e faz cascata.

## Autenticação

A autenticação de subagente é resolvida por **id do agente**, não por tipo de sessão:

- A chave de sessão do subagente é `agent:<agentId>:subagent:<uuid>`.
- O armazenamento de autenticação é carregado a partir do `agentDir` desse agente.
- Os perfis de autenticação do agente principal são mesclados como **fallback**; perfis de agente substituem perfis principais em conflitos.

A mesclagem é aditiva, então perfis principais estão sempre disponíveis como
fallbacks. Autenticação totalmente isolada por agente ainda não é compatível.

## Anúncio

Subagentes retornam relatórios por meio de uma etapa de anúncio:

- A etapa de anúncio é executada dentro da sessão do subagente (não da sessão solicitante).
- Se o subagente responder exatamente `ANNOUNCE_SKIP`, nada é publicado.
- Se o texto mais recente do assistente for o token silencioso exato `NO_REPLY` / `no_reply`, a saída do anúncio é suprimida mesmo que tenha havido progresso visível anterior.

A entrega depende da profundidade do solicitante:

- Sessões solicitantes de nível superior usam uma chamada `agent` de acompanhamento com entrega externa (`deliver=true`).
- Sessões de subagente solicitantes aninhadas recebem uma injeção interna de acompanhamento (`deliver=false`) para que o orquestrador possa sintetizar resultados de filhos na sessão.
- Se uma sessão de subagente solicitante aninhada desapareceu, o OpenClaw recorre ao solicitante dessa sessão quando disponível.

Para sessões solicitantes de nível superior, a entrega direta em modo de conclusão primeiro
resolve qualquer rota de conversa/tópico vinculada e substituição de hook, depois preenche
campos de alvo de canal ausentes a partir da rota armazenada da sessão solicitante.
Isso mantém as conclusões no chat/tópico correto mesmo quando a origem da
conclusão identifica apenas o canal.

A agregação de conclusão de filhos é limitada à execução solicitante atual ao
criar achados de conclusão aninhados, impedindo que saídas de filhos de
execuções anteriores obsoletas vazem para o anúncio atual. Respostas de anúncio preservam
o roteamento de tópico quando disponível nos adaptadores de canal.

### Contexto do anúncio

O contexto do anúncio é normalizado para um bloco de evento interno estável:

| Campo          | Fonte                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Origem         | `subagent` ou `cron`                                                                                          |
| Ids de sessão    | Chave/id da sessão filha                                                                                          |
| Tipo           | Tipo de anúncio + rótulo da tarefa                                                                                    |
| Status         | Derivado do resultado do runtime (`success`, `error`, `timeout` ou `unknown`) — **não** inferido do texto do modelo |
| Conteúdo do resultado | Texto visível mais recente do assistente; caso contrário, texto mais recente de ferramenta/toolResult sanitizado                                |
| Acompanhamento      | Instrução descrevendo quando responder versus permanecer em silêncio                                                           |

Execuções terminais com falha relatam status de falha sem reproduzir
texto de resposta capturado. Em caso de timeout, se o filho passou apenas por chamadas de ferramenta, o anúncio
pode condensar esse histórico em um resumo curto de progresso parcial em vez
de reproduzir a saída bruta da ferramenta.

### Linha de estatísticas

Payloads de anúncio incluem uma linha de estatísticas no final (mesmo quando encapsulados):

- Runtime (por exemplo, `runtime 5m12s`).
- Uso de tokens (entrada/saída/total).
- Custo estimado quando a precificação do modelo está configurada (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` e caminho da transcrição para que o agente principal possa buscar o histórico via `sessions_history` ou inspecionar o arquivo no disco.

Metadados internos são destinados apenas à orquestração; respostas voltadas ao usuário
devem ser reescritas na voz normal do assistente.

### Por que preferir `sessions_history`

`sessions_history` é o caminho de orquestração mais seguro:

- A recordação do assistente é normalizada primeiro: tags de raciocínio removidas; andaimes `<relevant-memories>` / `<relevant_memories>` removidos; blocos de payload XML de chamada de ferramenta em texto simples (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) removidos, incluindo payloads truncados que nunca fecham corretamente; andaimes de chamada/resultado de ferramenta rebaixados e marcadores de contexto histórico removidos; tokens de controle de modelo vazados (`<|assistant|>`, outros ASCII `<|...|>`, largura total `<｜...｜>`) removidos; XML malformado de chamada de ferramenta MiniMax removido.
- Texto semelhante a credencial/token é redigido.
- Blocos longos podem ser truncados.
- Históricos muito grandes podem descartar linhas mais antigas ou substituir uma linha superdimensionada por `[sessions_history omitted: message too large]`.
- A inspeção da transcrição bruta no disco é o fallback quando você precisa da transcrição byte a byte completa.

## Política de ferramentas

Subagentes usam primeiro o mesmo perfil e pipeline de política de ferramentas do agente pai ou
alvo. Depois disso, o OpenClaw aplica a camada de restrição de subagente.

Sem um `tools.profile` restritivo, subagentes recebem **todas as ferramentas, exceto
ferramentas de sessão** e ferramentas de sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` continua sendo uma visão de recordação limitada e sanitizada também aqui — ele
não é um despejo bruto de transcrição.

Quando `maxSpawnDepth >= 2`, subagentes orquestradores de profundidade 1 também
recebem `sessions_spawn`, `subagents`, `sessions_list` e
`sessions_history` para poderem gerenciar seus filhos.

### Substituição via configuração

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` é um filtro final somente de permissão. Ele pode restringir
o conjunto de ferramentas já resolvido, mas não pode **readicionar** uma ferramenta removida
por `tools.profile`. Por exemplo, `tools.profile: "coding"` inclui
`web_search`/`web_fetch`, mas não a ferramenta `browser`. Para permitir que
sub-agentes com perfil de codificação usem automação de navegador, adicione browser na
etapa do perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Use `agents.list[].tools.alsoAllow: ["browser"]` por agente quando apenas um
agente deve receber automação de navegador.

## Concorrência

Sub-agentes usam uma faixa dedicada de fila no processo:

- **Nome da faixa:** `subagent`
- **Concorrência:** `agents.defaults.subagents.maxConcurrent` (padrão `8`)

## Vivacidade e recuperação

O OpenClaw não trata a ausência de `endedAt` como prova permanente de que um
sub-agente ainda está ativo. Execuções não encerradas mais antigas que a janela de execução obsoleta
deixam de contar como ativas/pendentes em `/subagents list`, resumos de status,
bloqueio de conclusão de descendentes e verificações de concorrência por sessão.

Após uma reinicialização do Gateway, execuções restauradas obsoletas e não encerradas são podadas, a menos
que a sessão filha delas esteja marcada como `abortedLastRun: true`. Essas
sessões filhas abortadas por reinicialização permanecem recuperáveis pelo fluxo de recuperação de órfãos
de sub-agentes, que envia uma mensagem sintética de retomada antes de
limpar o marcador de abortado.

A recuperação automática por reinicialização é limitada por sessão filha. Se o mesmo
filho de sub-agente for aceito para recuperação de órfão repetidamente dentro da
janela rápida de recunhagem, o OpenClaw persiste uma lápide de recuperação nessa
sessão e deixa de retomá-la automaticamente em reinicializações posteriores. Execute
`openclaw tasks maintenance --apply` para reconciliar o registro da tarefa, ou
`openclaw doctor --fix` para limpar flags obsoletas de recuperação abortada em
sessões com lápide.

<Note>
Se uma criação de sub-agente falhar com Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, verifique o chamador RPC antes de editar o estado de pareamento.
A coordenação interna de `sessions_spawn` deve se conectar como
`client.id: "gateway-client"` com `client.mode: "backend"` por autenticação direta
de local loopback com token/senha compartilhados; esse caminho não depende da
linha de base de escopo de dispositivo pareado da CLI. Chamadores remotos,
`deviceIdentity` explícito, caminhos explícitos de token de dispositivo e clientes
browser/node ainda precisam da aprovação normal do dispositivo para upgrades de escopo.
</Note>

## Interrupção

- Enviar `/stop` no chat solicitante aborta a sessão solicitante e interrompe quaisquer execuções ativas de sub-agentes criadas a partir dela, propagando para filhos aninhados.
- `/subagents kill <id>` interrompe um sub-agente específico e propaga para seus filhos.

## Limitações

- O anúncio de sub-agente é **de melhor esforço**. Se o Gateway reiniciar, o trabalho pendente de "anunciar de volta" será perdido.
- Sub-agentes ainda compartilham os mesmos recursos do processo do Gateway; trate `maxConcurrent` como uma válvula de segurança.
- `sessions_spawn` é sempre não bloqueante: ele retorna `{ status: "accepted", runId, childSessionKey }` imediatamente.
- O contexto de sub-agente injeta apenas `AGENTS.md` + `TOOLS.md` (sem `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ou `BOOTSTRAP.md`).
- A profundidade máxima de aninhamento é 5 (intervalo de `maxSpawnDepth`: 1–5). A profundidade 2 é recomendada para a maioria dos casos de uso.
- `maxChildrenPerAgent` limita filhos ativos por sessão (padrão `5`, intervalo `1–20`).

## Relacionados

- [Agentes ACP](/pt-BR/tools/acp-agents)
- [Envio de agente](/pt-BR/tools/agent-send)
- [Tarefas em segundo plano](/pt-BR/automation/tasks)
- [Ferramentas de sandbox multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
