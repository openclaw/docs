---
read_when:
    - Você quer trabalho em segundo plano ou paralelo por meio do agente
    - Você está alterando a política de sessions_spawn ou da ferramenta de subagente
    - Você está implementando ou solucionando problemas em sessões de subagente vinculadas a threads
sidebarTitle: Sub-agents
summary: Inicie execuções isoladas de agentes em segundo plano que comunicam os resultados de volta ao chat do solicitante
title: Subagentes
x-i18n:
    generated_at: "2026-05-07T01:54:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 901311ae7766640ff6991f66a63070fddef47d79ef5385d2c1af84be34a5140e
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agentes são execuções de agentes em segundo plano geradas a partir de uma execução de agente existente.
Eles são executados na própria sessão (`agent:<agentId>:subagent:<uuid>`) e,
quando terminam, **anunciam** seu resultado de volta ao canal de chat
solicitante. Cada execução de sub-agente é rastreada como uma
[tarefa em segundo plano](/pt-BR/automation/tasks).

Para o modelo de segurança por trás da delegação, consulte
[Limites de multiagente e sub-agente](/pt-BR/gateway/security#multi-agent-and-sub-agent-boundaries).
Sub-agentes são unidades úteis de isolamento e fluxo de trabalho, mas não são
um limite de autorização multi-inquilino hostil dentro de um Gateway compartilhado.

Objetivos principais:

- Paralelizar trabalho de "pesquisa / tarefa longa / ferramenta lenta" sem bloquear a execução principal.
- Manter sub-agentes isolados por padrão (separação de sessão + sandbox opcional).
- Manter a superfície de ferramentas difícil de usar incorretamente: sub-agentes **não** recebem ferramentas de sessão por padrão.
- Oferecer suporte a profundidade de aninhamento configurável para padrões de orquestrador.

<Note>
**Observação de custo:** cada sub-agente tem seu próprio contexto e uso de tokens por
padrão. Para tarefas pesadas ou repetitivas, defina um modelo mais barato para sub-agentes
e mantenha seu agente principal em um modelo de maior qualidade. Configure via
`agents.defaults.subagents.model` ou substituições por agente. Quando um filho
    realmente precisa da transcrição atual do solicitante, o agente pode solicitar
    `context: "fork"` naquela geração específica. Sessões de subagente vinculadas a thread usam
    `context: "fork"` por padrão porque ramificam a conversa atual em uma
    thread de acompanhamento.
</Note>

## Comando de barra

Use `/subagents` para inspecionar ou controlar execuções de sub-agentes para a **sessão
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

Use [`/steer <message>`](/pt-BR/tools/steer) de nível superior para orientar a execução ativa da sessão solicitante atual. Use `/subagents steer <id|#> <message>` quando o alvo for uma execução filha.

`/subagents info` mostra metadados da execução (status, carimbos de data/hora, id da sessão,
caminho da transcrição, limpeza). Use `sessions_history` para uma visualização de recordação delimitada
e filtrada por segurança; inspecione o caminho da transcrição no disco quando você
precisar da transcrição bruta completa.

### Controles de vinculação a thread

Estes comandos funcionam em canais que oferecem suporte a vinculações persistentes de thread.
Veja [Canais com suporte a thread](#thread-supporting-channels) abaixo.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamento de geração

`/subagents spawn` inicia um sub-agente em segundo plano como comando de usuário (não um
encaminhamento interno) e envia uma atualização final de conclusão de volta ao
chat solicitante quando a execução termina.

<AccordionGroup>
  <Accordion title="Conclusão não bloqueante, baseada em push">
    - O comando de geração não é bloqueante; ele retorna um id de execução imediatamente.
    - Na conclusão, o sub-agente anuncia uma mensagem de resumo/resultado de volta ao canal de chat solicitante.
    - A conclusão é baseada em push. Depois de gerado, **não** consulte `/subagents list`, `sessions_list` ou `sessions_history` em loop apenas para esperar terminar; inspecione o status somente sob demanda para depuração ou intervenção.
    - Na conclusão, o OpenClaw fecha, em melhor esforço, abas/processos de navegador rastreados que foram abertos por aquela sessão de sub-agente antes que o fluxo de limpeza do anúncio continue.

  </Accordion>
  <Accordion title="Resiliência de entrega de geração manual">
    - O OpenClaw tenta primeiro a entrega direta por `agent` com uma chave de idempotência estável.
    - Se a rodada de conclusão do agente solicitante falhar, não produzir saída visível ou retornar um prefixo obviamente incompleto do resultado filho capturado, o OpenClaw recorre à entrega direta da conclusão a partir do resultado filho capturado.
    - Se a entrega direta não puder ser usada, ele recorre ao roteamento por fila.
    - Se o roteamento por fila ainda não estiver disponível, o anúncio é repetido com um backoff exponencial curto antes da desistência final.
    - A entrega de conclusão mantém a rota resolvida do solicitante: rotas de conclusão vinculadas a thread ou a conversa vencem quando disponíveis; se a origem da conclusão fornecer apenas um canal, o OpenClaw preenche o alvo/conta ausente a partir da rota resolvida da sessão solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que a entrega direta ainda funcione.

  </Accordion>
  <Accordion title="Metadados de transferência de conclusão">
    A transferência de conclusão para a sessão solicitante é um contexto interno gerado em tempo de execução
    (não texto criado pelo usuário) e inclui:

    - `Result` — texto da resposta `assistant` visível mais recente; caso contrário, o texto de ferramenta/toolResult mais recente higienizado. Execuções terminais com falha não reutilizam texto de resposta capturado.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Estatísticas compactas de runtime/tokens.
    - Uma instrução de entrega dizendo ao agente solicitante para reescrever em voz normal de assistente (não encaminhar metadados internos brutos).

  </Accordion>
  <Accordion title="Modos e runtime ACP">
    - `--model` e `--thinking` substituem os padrões para aquela execução específica.
    - Use `info`/`log` para inspecionar detalhes e saída após a conclusão.
    - `/subagents spawn` é o modo de execução única (`mode: "run"`). Para sessões persistentes vinculadas a thread, use `sessions_spawn` com `thread: true` e `mode: "session"`.
    - Para sessões de harness ACP (Claude Code, Gemini CLI, OpenCode ou Codex ACP/acpx explícito), use `sessions_spawn` com `runtime: "acp"` quando a ferramenta anunciar esse runtime. Veja [Modelo de entrega ACP](/pt-BR/tools/acp-agents#delivery-model) ao depurar conclusões ou loops agente-para-agente. Quando o Plugin `codex` estiver ativado, o controle de chat/thread do Codex deve preferir `/codex ...` em vez de ACP, a menos que o usuário peça explicitamente ACP/acpx.
    - O OpenClaw oculta `runtime: "acp"` até que ACP esteja ativado, o solicitante não esteja em sandbox e um Plugin de backend como `acpx` esteja carregado. `runtime: "acp"` espera um id de harness ACP externo ou uma entrada `agents.list[]` com `runtime.type="acp"`; use o runtime de sub-agente padrão para agentes normais de configuração do OpenClaw em `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Sub-agentes nativos começam isolados, a menos que o chamador peça explicitamente para bifurcar
a transcrição atual.

| Modo       | Quando usar                                                                                                                            | Comportamento                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Pesquisa nova, implementação independente, trabalho de ferramenta lenta ou qualquer coisa que possa ser resumida no texto da tarefa    | Cria uma transcrição filha limpa. Este é o padrão e mantém o uso de tokens menor. |
| `fork`     | Trabalho que depende da conversa atual, de resultados anteriores de ferramentas ou de instruções sutis já presentes na transcrição do solicitante | Ramifica a transcrição do solicitante para a sessão filha antes que o filho comece. |

Use `fork` com moderação. Ele serve para delegação sensível ao contexto, não como
substituto para escrever um prompt de tarefa claro.

## Ferramenta: `sessions_spawn`

Inicia uma execução de sub-agente com `deliver: false` na lane global `subagent`,
depois executa uma etapa de anúncio e publica a resposta de anúncio no canal de chat
solicitante.

A disponibilidade depende da política efetiva de ferramentas do chamador. Os perfis `coding` e
`full` expõem `sessions_spawn` por padrão. O perfil `messaging`
não; adicione `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` ou use `tools.profile: "coding"` para agentes que devem delegar
trabalho. Políticas de canal/grupo, provedor, sandbox e allow/deny por agente ainda podem
remover a ferramenta após a etapa de perfil. Use `/tools` na mesma
sessão para confirmar a lista efetiva de ferramentas.

**Padrões:**

- **Modelo:** herda o chamador, a menos que você defina `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` por agente); um `sessions_spawn.model` explícito ainda prevalece.
- **Thinking:** herda o chamador, a menos que você defina `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` por agente); um `sessions_spawn.thinking` explícito ainda prevalece.
- **Tempo limite de execução:** se `sessions_spawn.runTimeoutSeconds` for omitido, o OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário, recorre a `0` (sem tempo limite).

### Parâmetros da ferramenta

<ParamField path="task" type="string" required>
  A descrição da tarefa para o sub-agente.
</ParamField>
<ParamField path="label" type="string">
  Rótulo legível por humanos opcional.
</ParamField>
<ParamField path="agentId" type="string">
  Gerar sob outro id de agente quando permitido por `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` é somente para harnesses ACP externos (`claude`, `droid`, `gemini`, `opencode` ou Codex ACP/acpx solicitado explicitamente) e para entradas `agents.list[]` cujo `runtime.type` seja `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Somente ACP. Retoma uma sessão de harness ACP existente quando `runtime: "acp"`; ignorado para gerações de sub-agente nativas.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Somente ACP. Transmite a saída da execução ACP para a sessão pai quando `runtime: "acp"`; omita para gerações de sub-agente nativas.
</ParamField>
<ParamField path="model" type="string">
  Substitui o modelo do sub-agente. Valores inválidos são ignorados, e o sub-agente é executado no modelo padrão com um aviso no resultado da ferramenta.
</ParamField>
<ParamField path="thinking" type="string">
  Substitui o nível de thinking para a execução do sub-agente.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  O padrão é `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário, `0`. Quando definido, a execução do sub-agente é abortada após N segundos.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Quando `true`, solicita vinculação de thread de canal para esta sessão de sub-agente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Se `thread: true` e `mode` for omitido, o padrão passa a ser `session`. `mode: "session"` exige `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` arquiva imediatamente após o anúncio (ainda mantém a transcrição via renomeação).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rejeita a geração, a menos que o runtime filho alvo esteja em sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` ramifica a transcrição atual do solicitante para a sessão filha. Somente sub-agentes nativos. Gerações vinculadas a thread usam `fork` por padrão; gerações sem thread usam `isolated` por padrão.
</ParamField>

<Warning>
`sessions_spawn` **não** aceita parâmetros de entrega em canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Para entrega, use
`message`/`sessions_send` a partir da execução gerada.
</Warning>

## Sessões vinculadas a thread

Quando vinculações de thread estão ativadas para um canal, um sub-agente pode permanecer vinculado
a uma thread para que mensagens de usuário de acompanhamento naquela thread continuem sendo roteadas para a
mesma sessão de sub-agente.

### Canais com suporte a thread

**Discord** atualmente é o único canal compatível. Ele oferece suporte a
sessões de subagente persistentes vinculadas a thread (`sessions_spawn` com
`thread: true`), controles manuais de thread (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) e chaves de adaptador
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` e
`channels.discord.threadBindings.spawnSessions`.

### Fluxo rápido

<Steps>
  <Step title="Gerar">
    `sessions_spawn` com `thread: true` (e opcionalmente `mode: "session"`).
  </Step>
  <Step title="Vincular">
    O OpenClaw cria ou vincula uma thread a esse destino de sessão no canal ativo.
  </Step>
  <Step title="Roteamento de acompanhamentos">
    Respostas e mensagens de acompanhamento nessa thread são roteadas para a sessão vinculada.
  </Step>
  <Step title="Inspecionar tempos limite">
    Use `/session idle` para inspecionar/atualizar o auto-desfoque por inatividade e
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
| `/unfocus`         | Remove o vínculo da thread atualmente vinculada                       |
| `/agents`          | Lista execuções ativas e o estado do vínculo (`thread:<id>` ou `unbound`) |
| `/session idle`    | Inspeciona/atualiza o auto-desfoque por inatividade (somente threads vinculadas em foco) |
| `/session max-age` | Inspeciona/atualiza o limite rígido (somente threads vinculadas em foco) |

### Chaves de configuração

- **Padrão global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Substituição por canal e chaves de vínculo automático ao gerar** são específicas do adaptador. Veja [Canais com suporte a threads](#thread-supporting-channels) acima.

Veja [Referência de configuração](/pt-BR/gateway/configuration-reference) e
[Comandos slash](/pt-BR/tools/slash-commands) para os detalhes atuais dos adaptadores.

### Lista de permissões

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de ids de agentes que podem ser direcionados por meio de `agentId` explícito (`["*"]` permite qualquer um). Padrão: somente o agente solicitante. Se você definir uma lista e ainda quiser que o solicitante gere a si mesmo com `agentId`, inclua o id do solicitante na lista.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista de permissões padrão de agentes de destino usada quando o agente solicitante não define seu próprio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloqueia chamadas `sessions_spawn` que omitem `agentId` (força seleção explícita de perfil). Substituição por agente: `agents.list[].subagents.requireAgentId`.
</ParamField>

Se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeita destinos
que seriam executados sem sandbox.

### Descoberta

Use `agents_list` para ver quais ids de agentes são permitidos atualmente para
`sessions_spawn`. A resposta inclui o modelo efetivo de cada agente listado
e metadados de runtime incorporados para que os chamadores possam distinguir PI,
servidor de app do Codex e outros runtimes nativos configurados.

### Arquivamento automático

- Sessões de subagentes são arquivadas automaticamente após `agents.defaults.subagents.archiveAfterMinutes` (padrão `60`).
- O arquivamento usa `sessions.delete` e renomeia a transcrição para `*.deleted.<timestamp>` (mesma pasta).
- `cleanup: "delete"` arquiva imediatamente após o anúncio (ainda mantém a transcrição por renomeação).
- O arquivamento automático é de melhor esforço; timers pendentes são perdidos se o Gateway reiniciar.
- `runTimeoutSeconds` **não** arquiva automaticamente; ele apenas interrompe a execução. A sessão permanece até o arquivamento automático.
- O arquivamento automático se aplica igualmente a sessões de profundidade 1 e profundidade 2.
- A limpeza do navegador é separada da limpeza de arquivamento: abas/processos de navegador rastreados são fechados com melhor esforço quando a execução termina, mesmo que o registro de transcrição/sessão seja mantido.

## Subagentes aninhados

Por padrão, subagentes não podem gerar seus próprios subagentes
(`maxSpawnDepth: 1`). Defina `maxSpawnDepth: 2` para habilitar um nível de
aninhamento — o **padrão orquestrador**: principal → subagente orquestrador →
sub-subagentes trabalhadores.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // permite que subagentes gerem filhos (padrão: 1)
        maxChildrenPerAgent: 5, // máximo de filhos ativos por sessão de agente (padrão: 5)
        maxConcurrent: 8, // limite global de trilhas de concorrência (padrão: 8)
        runTimeoutSeconds: 900, // tempo limite padrão para sessions_spawn quando omitido (0 = sem tempo limite)
      },
    },
  },
}
```

### Níveis de profundidade

| Profundidade | Formato da chave de sessão                  | Função                                        | Pode gerar?                  |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principal                              | Sempre                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestrador quando profundidade 2 é permitida) | Somente se `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagente (trabalhador folha)             | Nunca                        |

### Cadeia de anúncios

Os resultados fluem de volta pela cadeia:

1. Trabalhador de profundidade 2 termina → anuncia ao seu pai (orquestrador de profundidade 1).
2. Orquestrador de profundidade 1 recebe o anúncio, sintetiza os resultados, termina → anuncia ao principal.
3. Agente principal recebe o anúncio e entrega ao usuário.

Cada nível vê apenas anúncios de seus filhos diretos.

<Note>
**Orientação operacional:** inicie o trabalho filho uma vez e aguarde eventos
de conclusão em vez de criar loops de sondagem em torno de `sessions_list`,
`sessions_history`, `/subagents list` ou comandos de espera de `exec`.
`sessions_list` e `/subagents list` mantêm as relações de sessões filhas
focadas no trabalho ativo — filhos ativos permanecem anexados, filhos encerrados ficam
visíveis por uma janela recente curta, e vínculos de filhos apenas no armazenamento e obsoletos são
ignorados após sua janela de atualização. Isso impede que metadados antigos de `spawnedBy` /
`parentSessionKey` ressuscitem filhos fantasma após
reinicialização. Se um evento de conclusão de filho chegar depois de você já ter enviado a
resposta final, o acompanhamento correto é o token silencioso exato
`NO_REPLY` / `no_reply`.
</Note>

### Política de ferramentas por profundidade

- Função e escopo de controle são gravados nos metadados da sessão no momento da geração. Isso impede que chaves de sessão planas ou restauradas recuperem acidentalmente privilégios de orquestrador.
- **Profundidade 1 (orquestrador, quando `maxSpawnDepth >= 2`):** recebe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para que possa gerenciar seus filhos. Outras ferramentas de sessão/sistema continuam negadas.
- **Profundidade 1 (folha, quando `maxSpawnDepth == 1`):** sem ferramentas de sessão (comportamento padrão atual).
- **Profundidade 2 (trabalhador folha):** sem ferramentas de sessão — `sessions_spawn` é sempre negado na profundidade 2. Não pode gerar mais filhos.

### Limite de geração por agente

Cada sessão de agente (em qualquer profundidade) pode ter no máximo `maxChildrenPerAgent`
(padrão `5`) filhos ativos por vez. Isso evita fan-out descontrolado
de um único orquestrador.

### Interrupção em cascata

Interromper um orquestrador de profundidade 1 interrompe automaticamente todos os seus filhos
de profundidade 2:

- `/stop` no chat principal interrompe todos os agentes de profundidade 1 e propaga a interrupção para seus filhos de profundidade 2.
- `/subagents kill <id>` interrompe um subagente específico e propaga a interrupção para seus filhos.
- `/subagents kill all` interrompe todos os subagentes do solicitante e propaga a interrupção.

## Autenticação

A autenticação de subagente é resolvida por **id de agente**, não por tipo de sessão:

- A chave da sessão de subagente é `agent:<agentId>:subagent:<uuid>`.
- O armazenamento de autenticação é carregado a partir do `agentDir` desse agente.
- Os perfis de autenticação do agente principal são mesclados como **fallback**; perfis de agente substituem perfis principais em conflitos.

A mesclagem é aditiva, então os perfis principais estão sempre disponíveis como
fallbacks. Autenticação totalmente isolada por agente ainda não é suportada.

## Anúncio

Subagentes retornam informações por meio de uma etapa de anúncio:

- A etapa de anúncio é executada dentro da sessão do subagente (não na sessão solicitante).
- Se o subagente responder exatamente `ANNOUNCE_SKIP`, nada será publicado.
- Se o texto mais recente do assistente for o token silencioso exato `NO_REPLY` / `no_reply`, a saída do anúncio será suprimida mesmo que tenha havido progresso visível anterior.

A entrega depende da profundidade do solicitante:

- Sessões solicitantes de nível superior usam uma chamada `agent` de acompanhamento com entrega externa (`deliver=true`).
- Sessões de subagente solicitante aninhadas recebem uma injeção interna de acompanhamento (`deliver=false`) para que o orquestrador possa sintetizar resultados de filhos na sessão.
- Se uma sessão de subagente solicitante aninhada não existir mais, o OpenClaw recorre ao solicitante dessa sessão quando disponível.

Para sessões solicitantes de nível superior, a entrega direta em modo de conclusão primeiro
resolve qualquer rota de conversa/thread vinculada e substituição de hook, depois preenche
campos ausentes de destino do canal a partir da rota armazenada da sessão solicitante.
Isso mantém as conclusões no chat/tópico correto mesmo quando a origem da conclusão
identifica apenas o canal.

A agregação de conclusões de filhos é limitada à execução atual do solicitante ao
criar descobertas de conclusão aninhadas, impedindo que saídas de filhos de execuções
anteriores e obsoletas vazem para o anúncio atual. Respostas de anúncio preservam
roteamento de thread/tópico quando disponível nos adaptadores de canal.

### Contexto do anúncio

O contexto do anúncio é normalizado para um bloco de evento interno estável:

| Campo          | Fonte                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Origem         | `subagent` ou `cron`                                                                                          |
| IDs de sessão  | Chave/id da sessão filha                                                                                      |
| Tipo           | Tipo de anúncio + rótulo da tarefa                                                                            |
| Status         | Derivado do resultado de runtime (`success`, `error`, `timeout` ou `unknown`) — **não** inferido do texto do modelo |
| Conteúdo do resultado | Texto visível mais recente do assistente; caso contrário, o texto sanitizado mais recente de ferramenta/toolResult |
| Acompanhamento | Instrução descrevendo quando responder vs. permanecer silencioso                                             |

Execuções terminais com falha relatam o status de falha sem reproduzir o texto
de resposta capturado. Em tempo limite, se o filho apenas chegou até chamadas de ferramentas, o anúncio
pode condensar esse histórico em um breve resumo de progresso parcial em vez
de reproduzir a saída bruta da ferramenta.

### Linha de estatísticas

Payloads de anúncio incluem uma linha de estatísticas no final (mesmo quando quebrada):

- Runtime (por exemplo, `runtime 5m12s`).
- Uso de tokens (entrada/saída/total).
- Custo estimado quando o preço do modelo está configurado (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` e caminho da transcrição para que o agente principal possa buscar o histórico via `sessions_history` ou inspecionar o arquivo no disco.

Metadados internos são destinados apenas à orquestração; respostas voltadas ao usuário
devem ser reescritas na voz normal do assistente.

### Por que preferir `sessions_history`

`sessions_history` é o caminho de orquestração mais seguro:

- A lembrança do assistente é normalizada primeiro: tags de pensamento removidas; andaimes `<relevant-memories>` / `<relevant_memories>` removidos; blocos de payload XML de chamadas de ferramenta em texto puro (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) removidos, incluindo payloads truncados que nunca fecham corretamente; andaimes rebaixados de chamada/resultado de ferramenta e marcadores de contexto histórico removidos; tokens de controle de modelo vazados (`<|assistant|>`, outros ASCII `<|...|>`, largura total `<｜...｜>`) removidos; XML de chamada de ferramenta MiniMax malformado removido.
- Texto semelhante a credencial/token é redigido.
- Blocos longos podem ser truncados.
- Históricos muito grandes podem descartar linhas antigas ou substituir uma linha grande demais por `[sessions_history omitted: message too large]`.
- A inspeção da transcrição bruta em disco é o fallback quando você precisa da transcrição completa byte a byte.

## Política de ferramentas

Subagentes usam primeiro o mesmo perfil e pipeline de política de ferramentas que o agente pai ou de destino. Depois disso, o OpenClaw aplica a camada de restrição de subagentes.

Sem um `tools.profile` restritivo, subagentes recebem **todas as ferramentas, exceto ferramentas de sessão** e ferramentas de sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` também permanece aqui uma visualização de recuperação limitada e higienizada — ela não é um despejo bruto de transcrição.

Quando `maxSpawnDepth >= 2`, subagentes orquestradores de profundidade 1 também recebem `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` para poderem gerenciar seus filhos.

### Substituir via configuração

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

`tools.subagents.tools.allow` é um filtro final somente de permissão. Ele pode restringir o conjunto de ferramentas já resolvido, mas não pode **adicionar de volta** uma ferramenta removida por `tools.profile`. Por exemplo, `tools.profile: "coding"` inclui `web_search`/`web_fetch`, mas não a ferramenta `browser`. Para permitir que subagentes com perfil de codificação usem automação de navegador, adicione browser na etapa de perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Use `agents.list[].tools.alsoAllow: ["browser"]` por agente quando apenas um agente deve receber automação de navegador.

## Concorrência

Subagentes usam uma faixa de fila dedicada em processo:

- **Nome da faixa:** `subagent`
- **Concorrência:** `agents.defaults.subagents.maxConcurrent` (padrão `8`)

## Liveness e recuperação

O OpenClaw não trata a ausência de `endedAt` como prova permanente de que um subagente ainda está vivo. Execuções não encerradas mais antigas que a janela de execução obsoleta deixam de contar como ativas/pendentes em `/subagents list`, resumos de status, bloqueio de conclusão de descendentes e verificações de concorrência por sessão.

Após uma reinicialização do Gateway, execuções restauradas obsoletas e não encerradas são removidas, a menos que a sessão filha esteja marcada como `abortedLastRun: true`. Essas sessões filhas abortadas pela reinicialização continuam recuperáveis pelo fluxo de recuperação de órfãos de subagente, que envia uma mensagem sintética de retomada antes de limpar o marcador de abortado.

A recuperação automática após reinicialização é limitada por sessão filha. Se o mesmo filho de subagente for aceito para recuperação de órfão repetidamente dentro da janela de reinterrupção rápida, o OpenClaw persiste uma lápide de recuperação nessa sessão e para de retomá-la automaticamente em reinicializações posteriores. Execute `openclaw tasks maintenance --apply` para reconciliar o registro da tarefa, ou `openclaw doctor --fix` para limpar sinalizadores obsoletos de recuperação abortada em sessões com lápide.

<Note>
Se a geração de um subagente falhar com Gateway `PAIRING_REQUIRED` / `scope-upgrade`, verifique o chamador RPC antes de editar o estado de pareamento. A coordenação interna de `sessions_spawn` deve se conectar como `client.id: "gateway-client"` com `client.mode: "backend"` por autenticação direta de token compartilhado/senha em loopback; esse caminho não depende da linha de base de escopo de dispositivo pareado da CLI. Chamadores remotos, `deviceIdentity` explícito, caminhos explícitos de token de dispositivo e clientes de navegador/node ainda precisam de aprovação normal de dispositivo para upgrades de escopo.
</Note>

## Interrupção

- Enviar `/stop` no chat solicitante aborta a sessão solicitante e interrompe quaisquer execuções ativas de subagentes geradas a partir dela, com cascata para filhos aninhados.
- `/subagents kill <id>` interrompe um subagente específico e propaga para seus filhos.

## Limitações

- O anúncio de subagente é **melhor esforço**. Se o gateway reiniciar, o trabalho pendente de "anunciar de volta" será perdido.
- Subagentes ainda compartilham os mesmos recursos do processo do gateway; trate `maxConcurrent` como uma válvula de segurança.
- `sessions_spawn` é sempre não bloqueante: ele retorna `{ status: "accepted", runId, childSessionKey }` imediatamente.
- O contexto de subagente injeta apenas `AGENTS.md` + `TOOLS.md` (sem `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ou `BOOTSTRAP.md`).
- A profundidade máxima de aninhamento é 5 (intervalo de `maxSpawnDepth`: 1–5). A profundidade 2 é recomendada para a maioria dos casos de uso.
- `maxChildrenPerAgent` limita filhos ativos por sessão (padrão `5`, intervalo `1–20`).

## Relacionados

- [agentes ACP](/pt-BR/tools/acp-agents)
- [Envio para agente](/pt-BR/tools/agent-send)
- [Tarefas em segundo plano](/pt-BR/automation/tasks)
- [Ferramentas de sandbox multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
