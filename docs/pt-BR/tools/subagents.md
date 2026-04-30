---
read_when:
    - Você quer trabalho em segundo plano ou paralelo por meio do agente
    - Você está alterando a política de `sessions_spawn` ou da ferramenta de subagente
    - Você está implementando ou solucionando problemas em sessões de subagentes vinculadas a encadeamentos
sidebarTitle: Sub-agents
summary: Gere execuções isoladas de agentes em segundo plano que anunciam os resultados de volta no chat do solicitante
title: Subagentes
x-i18n:
    generated_at: "2026-04-30T10:13:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84386ea706873cf9f2ea03261f916c8fb01304999f2d9fa86e037e734a62bf7e
    source_path: tools/subagents.md
    workflow: 16
---

Subagentes são execuções de agentes em segundo plano geradas a partir de uma execução de agente existente.
Eles rodam em sua própria sessão (`agent:<agentId>:subagent:<uuid>`) e,
quando terminam, **anunciam** o resultado de volta para o canal de chat
solicitante. Cada execução de subagente é rastreada como uma
[tarefa em segundo plano](/pt-BR/automation/tasks).

Objetivos principais:

- Paralelizar trabalho de "pesquisa / tarefa longa / ferramenta lenta" sem bloquear a execução principal.
- Manter subagentes isolados por padrão (separação de sessão + sandbox opcional).
- Manter a superfície de ferramentas difícil de usar incorretamente: subagentes **não** recebem ferramentas de sessão por padrão.
- Dar suporte a profundidade de aninhamento configurável para padrões de orquestrador.

<Note>
**Nota de custo:** cada subagente tem seu próprio contexto e uso de tokens por
padrão. Para tarefas pesadas ou repetitivas, defina um modelo mais barato para subagentes
e mantenha seu agente principal em um modelo de maior qualidade. Configure via
`agents.defaults.subagents.model` ou substituições por agente. Quando um filho
realmente precisa do transcript atual do solicitante, o agente pode solicitar
`context: "fork"` nessa geração específica.
</Note>

## Comando slash

Use `/subagents` para inspecionar ou controlar execuções de subagentes da **sessão
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
caminho do transcript, limpeza). Use `sessions_history` para uma visão de recuperação limitada
e filtrada por segurança; inspecione o caminho do transcript no disco quando
precisar do transcript bruto completo.

### Controles de vinculação de thread

Estes comandos funcionam em canais que dão suporte a vinculações persistentes de thread.
Veja [Canais com suporte a thread](#thread-supporting-channels) abaixo.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamento de geração

`/subagents spawn` inicia um subagente em segundo plano como um comando de usuário (não um
repasse interno) e envia uma atualização final de conclusão de volta para o
chat solicitante quando a execução termina.

<AccordionGroup>
  <Accordion title="Conclusão não bloqueante, baseada em envio">
    - O comando de geração não bloqueia; ele retorna um id de execução imediatamente.
    - Na conclusão, o subagente anuncia uma mensagem de resumo/resultado de volta ao canal de chat solicitante.
    - A conclusão é baseada em envio. Depois de gerado, **não** faça polling de `/subagents list`, `sessions_list` ou `sessions_history` em loop só para esperar que termine; inspecione o status apenas sob demanda para depuração ou intervenção.
    - Na conclusão, o OpenClaw faz o melhor esforço para fechar abas/processos de navegador rastreados abertos por essa sessão de subagente antes que o fluxo de limpeza do anúncio continue.

  </Accordion>
  <Accordion title="Resiliência de entrega para geração manual">
    - O OpenClaw tenta primeiro a entrega direta por `agent` com uma chave de idempotência estável.
    - Se a entrega direta falhar, ele recorre ao roteamento por fila.
    - Se o roteamento por fila ainda não estiver disponível, o anúncio é tentado novamente com um recuo exponencial curto antes da desistência final.
    - A entrega de conclusão mantém a rota resolvida do solicitante: rotas de conclusão vinculadas a thread ou vinculadas a conversa prevalecem quando disponíveis; se a origem da conclusão fornece apenas um canal, o OpenClaw preenche o alvo/conta ausente a partir da rota resolvida da sessão solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que a entrega direta ainda funcione.

  </Accordion>
  <Accordion title="Metadados de transferência de conclusão">
    A transferência de conclusão para a sessão solicitante é um contexto interno
    gerado em runtime (não texto criado pelo usuário) e inclui:

    - `Result` — texto da resposta `assistant` visível mais recente; caso contrário, o texto sanitizado mais recente de tool/toolResult. Execuções terminais com falha não reutilizam texto de resposta capturado.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Estatísticas compactas de runtime/tokens.
    - Uma instrução de entrega dizendo ao agente solicitante para reescrever em voz normal de assistente (não encaminhar metadados internos brutos).

  </Accordion>
  <Accordion title="Modos e runtime ACP">
    - `--model` e `--thinking` substituem os padrões para essa execução específica.
    - Use `info`/`log` para inspecionar detalhes e saída após a conclusão.
    - `/subagents spawn` é modo de execução única (`mode: "run"`). Para sessões persistentes vinculadas a thread, use `sessions_spawn` com `thread: true` e `mode: "session"`.
    - Para sessões de harness ACP (Claude Code, Gemini CLI, OpenCode ou Codex ACP/acpx explícito), use `sessions_spawn` com `runtime: "acp"` quando a ferramenta anunciar esse runtime. Veja [Modelo de entrega ACP](/pt-BR/tools/acp-agents#delivery-model) ao depurar conclusões ou loops agente-para-agente. Quando o Plugin `codex` estiver habilitado, o controle de chat/thread do Codex deve preferir `/codex ...` em vez de ACP, a menos que o usuário peça explicitamente ACP/acpx.
    - O OpenClaw oculta `runtime: "acp"` até que o ACP esteja habilitado, o solicitante não esteja em sandbox, e um Plugin de backend como `acpx` esteja carregado. `runtime: "acp"` espera um id de harness ACP externo, ou uma entrada `agents.list[]` com `runtime.type="acp"`; use o runtime padrão de subagente para agentes de configuração normais do OpenClaw vindos de `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Subagentes nativos começam isolados, a menos que o chamador peça explicitamente para bifurcar
o transcript atual.

| Modo       | Quando usar                                                                                                                         | Comportamento                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Pesquisa nova, implementação independente, trabalho com ferramenta lenta ou qualquer coisa que possa ser instruída no texto da tarefa                           | Cria um transcript filho limpo. Este é o padrão e mantém o uso de tokens mais baixo.  |
| `fork`     | Trabalho que depende da conversa atual, de resultados anteriores de ferramentas ou de instruções nuançadas já presentes no transcript do solicitante | Ramifica o transcript do solicitante para a sessão filha antes de o filho iniciar. |

Use `fork` com moderação. Ele é para delegação sensível ao contexto, não um
substituto para escrever um prompt de tarefa claro.

## Ferramenta: `sessions_spawn`

Inicia uma execução de subagente com `deliver: false` na faixa global `subagent`,
então executa uma etapa de anúncio e publica a resposta do anúncio no canal de chat
solicitante.

A disponibilidade depende da política efetiva de ferramentas do chamador. Os perfis `coding` e
`full` expõem `sessions_spawn` por padrão. O perfil `messaging`
não expõe; adicione `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` ou use `tools.profile: "coding"` para agentes que devem delegar
trabalho. Políticas de canal/grupo, provedor, sandbox e allow/deny por agente ainda podem
remover a ferramenta após a etapa de perfil. Use `/tools` na mesma
sessão para confirmar a lista efetiva de ferramentas.

**Padrões:**

- **Modelo:** herda o chamador, a menos que você defina `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` por agente); um `sessions_spawn.model` explícito ainda prevalece.
- **Thinking:** herda o chamador, a menos que você defina `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` por agente); um `sessions_spawn.thinking` explícito ainda prevalece.
- **Tempo limite da execução:** se `sessions_spawn.runTimeoutSeconds` for omitido, o OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário, recorre a `0` (sem tempo limite).

### Parâmetros da ferramenta

<ParamField path="task" type="string" required>
  A descrição da tarefa para o subagente.
</ParamField>
<ParamField path="label" type="string">
  Rótulo opcional legível por humanos.
</ParamField>
<ParamField path="agentId" type="string">
  Gere sob outro id de agente quando permitido por `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` é apenas para harnesses ACP externos (`claude`, `droid`, `gemini`, `opencode` ou Codex ACP/acpx solicitado explicitamente) e para entradas `agents.list[]` cujo `runtime.type` é `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Somente ACP. Retoma uma sessão de harness ACP existente quando `runtime: "acp"`; ignorado para gerações de subagentes nativos.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Somente ACP. Transmite a saída da execução ACP para a sessão pai quando `runtime: "acp"`; omita para gerações de subagentes nativos.
</ParamField>
<ParamField path="model" type="string">
  Substitui o modelo do subagente. Valores inválidos são ignorados e o subagente roda no modelo padrão com um aviso no resultado da ferramenta.
</ParamField>
<ParamField path="thinking" type="string">
  Substitui o nível de thinking para a execução do subagente.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  O padrão é `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário, `0`. Quando definido, a execução do subagente é abortada após N segundos.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Quando `true`, solicita vinculação de thread do canal para esta sessão de subagente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Se `thread: true` e `mode` for omitido, o padrão passa a ser `session`. `mode: "session"` exige `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` arquiva imediatamente após o anúncio (ainda mantém o transcript via renomeação).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rejeita a geração, a menos que o runtime filho de destino esteja em sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` ramifica o transcript atual do solicitante para a sessão filha. Apenas subagentes nativos. Use `fork` somente quando o filho precisar do transcript atual.
</ParamField>

<Warning>
`sessions_spawn` **não** aceita parâmetros de entrega por canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Para entrega, use
`message`/`sessions_send` a partir da execução gerada.
</Warning>

## Sessões vinculadas a thread

Quando vinculações de thread estão habilitadas para um canal, um subagente pode permanecer vinculado
a uma thread para que mensagens subsequentes do usuário nessa thread continuem sendo roteadas para a
mesma sessão de subagente.

### Canais com suporte a thread

**Discord** é atualmente o único canal com suporte. Ele oferece suporte a
sessões persistentes de subagentes vinculadas a thread (`sessions_spawn` com
`thread: true`), controles manuais de thread (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) e chaves de adaptador
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` e
`channels.discord.threadBindings.spawnSubagentSessions`.

### Fluxo rápido

<Steps>
  <Step title="Gerar">
    `sessions_spawn` com `thread: true` (e opcionalmente `mode: "session"`).
  </Step>
  <Step title="Vincular">
    O OpenClaw cria ou vincula uma thread a esse alvo de sessão no canal ativo.
  </Step>
  <Step title="Rotear acompanhamentos">
    Respostas e mensagens de acompanhamento nessa thread são roteadas para a sessão vinculada.
  </Step>
  <Step title="Inspecionar tempos limite">
    Use `/session idle` para inspecionar/atualizar o desfoco automático por inatividade e
    `/session max-age` para controlar o limite rígido.
  </Step>
  <Step title="Desvincular">
    Use `/unfocus` para desvincular manualmente.
  </Step>
</Steps>

### Controles manuais

| Comando            | Efeito                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Vincula a thread atual (ou cria uma) a um destino de subagente/sessão |
| `/unfocus`         | Remove o vínculo da thread vinculada atual                       |
| `/agents`          | Lista execuções ativas e estado de vínculo (`thread:<id>` ou `unbound`)       |
| `/session idle`    | Inspeciona/atualiza o desfoco automático por inatividade (somente threads vinculadas em foco)         |
| `/session max-age` | Inspeciona/atualiza o limite rígido (somente threads vinculadas em foco)                  |

### Alternâncias de configuração

- **Padrão global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Substituição por canal e chaves de vinculação automática ao criar** são específicas do adaptador. Consulte [Canais com suporte a threads](#thread-supporting-channels) acima.

Consulte a [Referência de configuração](/pt-BR/gateway/configuration-reference) e
[Comandos de barra](/pt-BR/tools/slash-commands) para detalhes atuais do adaptador.

### Lista de permissões

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de ids de agentes que podem ser direcionados via `agentId` explícito (`["*"]` permite qualquer um). Padrão: somente o agente solicitante. Se você definir uma lista e ainda quiser que o solicitante crie a si mesmo com `agentId`, inclua o id do solicitante na lista.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista de permissões padrão de agentes de destino usada quando o agente solicitante não define seu próprio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloqueia chamadas `sessions_spawn` que omitem `agentId` (força a seleção explícita de perfil). Substituição por agente: `agents.list[].subagents.requireAgentId`.
</ParamField>

Se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeita destinos
que seriam executados sem sandbox.

### Descoberta

Use `agents_list` para ver quais ids de agentes estão atualmente permitidos para
`sessions_spawn`. A resposta inclui o modelo efetivo de cada agente listado
e metadados de runtime incorporados, para que os chamadores possam distinguir PI, servidor de app do Codex
e outros runtimes nativos configurados.

### Arquivamento automático

- Sessões de subagente são arquivadas automaticamente após `agents.defaults.subagents.archiveAfterMinutes` (padrão `60`).
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
subsubagentes trabalhadores.

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
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Subsubagente (trabalhador folha)                   | Nunca                        |

### Cadeia de anúncio

Os resultados retornam pela cadeia:

1. Trabalhador de profundidade 2 termina → anuncia ao seu pai (orquestrador de profundidade 1).
2. Orquestrador de profundidade 1 recebe o anúncio, sintetiza os resultados, termina → anuncia ao principal.
3. Agente principal recebe o anúncio e entrega ao usuário.

Cada nível vê apenas anúncios de seus filhos diretos.

<Note>
**Orientação operacional:** inicie o trabalho filho uma vez e espere pelos
eventos de conclusão em vez de criar loops de polling em torno de `sessions_list`,
`sessions_history`, `/subagents list` ou comandos de espera `exec`.
`sessions_list` e `/subagents list` mantêm os relacionamentos de sessão filha
focados em trabalho ativo — filhos ativos permanecem anexados, filhos encerrados ficam
visíveis por uma breve janela recente, e links antigos de filhos presentes apenas no armazenamento são
ignorados após sua janela de frescor. Isso impede que metadados antigos de `spawnedBy` /
`parentSessionKey` ressuscitem filhos fantasma após
reinicialização. Se um evento de conclusão de filho chegar depois de você já ter enviado a
resposta final, o acompanhamento correto é o token silencioso exato
`NO_REPLY` / `no_reply`.
</Note>

### Política de ferramentas por profundidade

- A função e o escopo de controle são gravados nos metadados da sessão no momento da criação. Isso impede que chaves de sessão planas ou restauradas recuperem acidentalmente privilégios de orquestrador.
- **Profundidade 1 (orquestrador, quando `maxSpawnDepth >= 2`):** recebe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder gerenciar seus filhos. Outras ferramentas de sessão/sistema permanecem negadas.
- **Profundidade 1 (folha, quando `maxSpawnDepth == 1`):** sem ferramentas de sessão (comportamento padrão atual).
- **Profundidade 2 (trabalhador folha):** sem ferramentas de sessão — `sessions_spawn` é sempre negado na profundidade 2. Não pode criar mais filhos.

### Limite de criação por agente

Cada sessão de agente (em qualquer profundidade) pode ter no máximo `maxChildrenPerAgent`
(padrão `5`) filhos ativos por vez. Isso evita expansão descontrolada
a partir de um único orquestrador.

### Parada em cascata

Parar um orquestrador de profundidade 1 interrompe automaticamente todos os seus filhos de profundidade 2:

- `/stop` no chat principal interrompe todos os agentes de profundidade 1 e propaga para seus filhos de profundidade 2.
- `/subagents kill <id>` interrompe um subagente específico e propaga para seus filhos.
- `/subagents kill all` interrompe todos os subagentes do solicitante e propaga em cascata.

## Autenticação

A autenticação de subagente é resolvida por **id de agente**, não por tipo de sessão:

- A chave de sessão do subagente é `agent:<agentId>:subagent:<uuid>`.
- O armazenamento de autenticação é carregado a partir do `agentDir` desse agente.
- Os perfis de autenticação do agente principal são mesclados como **fallback**; perfis do agente substituem perfis principais em conflitos.

A mesclagem é aditiva, então perfis principais estão sempre disponíveis como
fallbacks. Autenticação totalmente isolada por agente ainda não é compatível.

## Anúncio

Subagentes retornam resultados por meio de uma etapa de anúncio:

- A etapa de anúncio é executada dentro da sessão do subagente (não na sessão do solicitante).
- Se o subagente responder exatamente `ANNOUNCE_SKIP`, nada será publicado.
- Se o texto mais recente do assistente for o token silencioso exato `NO_REPLY` / `no_reply`, a saída do anúncio será suprimida mesmo que progresso visível anterior tenha existido.

A entrega depende da profundidade do solicitante:

- Sessões solicitantes de nível superior usam uma chamada `agent` de acompanhamento com entrega externa (`deliver=true`).
- Sessões de subagente solicitantes aninhadas recebem uma injeção interna de acompanhamento (`deliver=false`) para que o orquestrador possa sintetizar resultados dos filhos dentro da sessão.
- Se uma sessão de subagente solicitante aninhada não existir mais, o OpenClaw recorre ao solicitante dessa sessão quando disponível.

Para sessões solicitantes de nível superior, a entrega direta em modo de conclusão primeiro
resolve qualquer rota de conversa/thread vinculada e substituição de hook, depois preenche
campos de destino de canal ausentes a partir da rota armazenada da sessão solicitante.
Isso mantém conclusões no chat/tópico correto mesmo quando a origem da conclusão
identifica apenas o canal.

A agregação de conclusões de filhos fica restrita à execução atual do solicitante ao
criar descobertas de conclusão aninhadas, impedindo que saídas antigas de filhos de execuções anteriores
vazem para o anúncio atual. Respostas de anúncio preservam
roteamento de thread/tópico quando disponível nos adaptadores de canal.

### Contexto do anúncio

O contexto do anúncio é normalizado para um bloco de evento interno estável:

| Campo          | Fonte                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Origem         | `subagent` ou `cron`                                                                                          |
| Ids de sessão    | Chave/id da sessão filha                                                                                          |
| Tipo           | Tipo de anúncio + rótulo da tarefa                                                                                    |
| Status         | Derivado do resultado do runtime (`success`, `error`, `timeout` ou `unknown`) — **não** inferido do texto do modelo |
| Conteúdo do resultado | Texto visível mais recente do assistente; caso contrário, texto de ferramenta/toolResult mais recente sanitizado                                |
| Acompanhamento      | Instrução que descreve quando responder vs. permanecer em silêncio                                                           |

Execuções finais com falha relatam status de falha sem reproduzir o texto de
resposta capturado. Em timeout, se o filho só chegou a chamadas de ferramenta, o anúncio
pode condensar esse histórico em um breve resumo de progresso parcial em vez
de reproduzir a saída bruta da ferramenta.

### Linha de estatísticas

Payloads de anúncio incluem uma linha de estatísticas ao final (mesmo quando encapsulados):

- Runtime (por exemplo, `runtime 5m12s`).
- Uso de tokens (entrada/saída/total).
- Custo estimado quando a precificação do modelo estiver configurada (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` e caminho da transcrição para que o agente principal possa buscar o histórico via `sessions_history` ou inspecionar o arquivo no disco.

Metadados internos destinam-se apenas à orquestração; respostas voltadas ao usuário
devem ser reescritas na voz normal do assistente.

### Por que preferir `sessions_history`

`sessions_history` é o caminho de orquestração mais seguro:

- A recordação do assistente é normalizada primeiro: tags de raciocínio removidas; estruturas `<relevant-memories>` / `<relevant_memories>` removidas; blocos de payload XML de chamada de ferramenta em texto simples (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) removidos, incluindo payloads truncados que nunca fecham corretamente; estruturas rebaixadas de chamada/resultado de ferramenta e marcadores de contexto histórico removidos; tokens de controle de modelo vazados (`<|assistant|>`, outros ASCII `<|...|>`, largura completa `<｜...｜>`) removidos; XML malformado de chamada de ferramenta do MiniMax removido.
- Texto semelhante a credenciais/tokens é redigido.
- Blocos longos podem ser truncados.
- Históricos muito grandes podem descartar linhas antigas ou substituir uma linha grande demais por `[sessions_history omitted: message too large]`.
- A inspeção da transcrição bruta no disco é o fallback quando você precisa da transcrição completa byte a byte.

## Política de ferramentas

Subagentes usam primeiro o mesmo perfil e pipeline de política de ferramentas do agente pai ou
de destino. Depois disso, o OpenClaw aplica a camada de restrição
de subagente.

Sem um `tools.profile` restritivo, subagentes recebem **todas as ferramentas, exceto
ferramentas de sessão** e ferramentas de sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` permanece também aqui uma visualização de recordação delimitada e sanitizada — ela
não é um despejo bruto da transcrição.

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
subagentes com perfil de codificação usem automação de browser, adicione browser na
etapa de perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Use `agents.list[].tools.alsoAllow: ["browser"]` por agente quando apenas um
agente deve receber automação de browser.

## Concorrência

Subagentes usam uma faixa de fila dedicada no processo:

- **Nome da faixa:** `subagent`
- **Concorrência:** `agents.defaults.subagents.maxConcurrent` (padrão `8`)

## Vivacidade e recuperação

O OpenClaw não trata a ausência de `endedAt` como prova permanente de que um
subagente ainda está ativo. Execuções sem encerramento mais antigas que a janela de execução obsoleta
deixam de contar como ativas/pendentes em `/subagents list`, resumos de status,
bloqueio de conclusão de descendentes e verificações de concorrência por sessão.

Após uma reinicialização do Gateway, execuções restauradas obsoletas sem encerramento são podadas, a menos que
a sessão filha esteja marcada como `abortedLastRun: true`. Essas
sessões filhas abortadas por reinicialização permanecem recuperáveis pelo fluxo de recuperação de órfãos de subagentes,
que envia uma mensagem sintética de retomada antes de
limpar o marcador de abortado.

<Note>
Se a criação de um subagente falhar com Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, verifique o chamador RPC antes de editar o estado de pareamento.
A coordenação interna `sessions_spawn` deve se conectar como
`client.id: "gateway-client"` com `client.mode: "backend"` por autenticação direta
de loopback com token/senha compartilhados; esse caminho não depende da
linha de base de escopo de dispositivo pareado da CLI. Chamadores remotos,
`deviceIdentity` explícito, caminhos explícitos de token de dispositivo e clientes
browser/node ainda precisam de aprovação normal do dispositivo para upgrades de escopo.
</Note>

## Interrupção

- Enviar `/stop` no chat solicitante aborta a sessão solicitante e interrompe todas as execuções ativas de subagentes criadas a partir dela, propagando para filhos aninhados.
- `/subagents kill <id>` interrompe um subagente específico e propaga para seus filhos.

## Limitações

- O anúncio de subagente é **por melhor esforço**. Se o Gateway reiniciar, o trabalho pendente de "anunciar de volta" será perdido.
- Subagentes ainda compartilham os mesmos recursos do processo do Gateway; trate `maxConcurrent` como uma válvula de segurança.
- `sessions_spawn` é sempre não bloqueante: ele retorna `{ status: "accepted", runId, childSessionKey }` imediatamente.
- O contexto de subagente injeta apenas `AGENTS.md` + `TOOLS.md` (sem `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ou `BOOTSTRAP.md`).
- A profundidade máxima de aninhamento é 5 (intervalo de `maxSpawnDepth`: 1–5). A profundidade 2 é recomendada para a maioria dos casos de uso.
- `maxChildrenPerAgent` limita filhos ativos por sessão (padrão `5`, intervalo `1–20`).

## Relacionados

- [Agentes ACP](/pt-BR/tools/acp-agents)
- [Envio de agente](/pt-BR/tools/agent-send)
- [Tarefas em segundo plano](/pt-BR/automation/tasks)
- [Ferramentas de sandbox multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
