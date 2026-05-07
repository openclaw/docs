---
read_when:
    - Você quer trabalho em segundo plano ou paralelo por meio do agente
    - Você está alterando a política de sessions_spawn ou da ferramenta de subagente
    - Você está implementando ou solucionando problemas em sessões de subagentes vinculadas a linhas de discussão
sidebarTitle: Sub-agents
summary: Inicie execuções isoladas de agentes em segundo plano que anunciam os resultados de volta ao chat do solicitante
title: Subagentes
x-i18n:
    generated_at: "2026-05-07T13:25:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b112f9c45bcb9cdc5d3b856f2fe2a36617606ad278b0ccc3db8830f0e847ba9
    source_path: tools/subagents.md
    workflow: 16
---

Subagentes são execuções de agente em segundo plano geradas a partir de uma execução de agente existente.
Eles rodam na própria sessão (`agent:<agentId>:subagent:<uuid>`) e,
quando terminam, **anunciam** o resultado de volta ao canal de chat
solicitante. Cada execução de subagente é rastreada como uma
[tarefa em segundo plano](/pt-BR/automation/tasks).

Objetivos principais:

- Paralelizar trabalho de "pesquisa / tarefa longa / ferramenta lenta" sem bloquear a execução principal.
- Manter subagentes isolados por padrão (separação de sessão + sandboxing opcional).
- Manter a superfície de ferramentas difícil de usar indevidamente: subagentes **não** recebem ferramentas de sessão por padrão.
- Dar suporte a profundidade de aninhamento configurável para padrões de orquestrador.

<Note>
**Observação sobre custo:** cada subagente tem seu próprio contexto e uso de tokens por
padrão. Para tarefas pesadas ou repetitivas, defina um modelo mais barato para subagentes
e mantenha seu agente principal em um modelo de qualidade mais alta. Configure via
`agents.defaults.subagents.model` ou substituições por agente. Quando um filho
    realmente precisa da transcrição atual do solicitante, o agente pode solicitar
    `context: "fork"` nessa geração específica. Sessões de subagente vinculadas a conversa encadeada usam
    `context: "fork"` por padrão porque ramificam a conversa atual em uma
    conversa encadeada de acompanhamento.
</Note>

## Comando de barra

Use `/subagents` para inspecionar ou controlar execuções de subagente para a **sessão
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

Use [`/steer <message>`](/pt-BR/tools/steer) de nível superior para direcionar a execução ativa da sessão solicitante atual. Use `/subagents steer <id|#> <message>` quando o alvo for uma execução filha.

`/subagents info` mostra metadados da execução (status, carimbos de data/hora, id da sessão,
caminho da transcrição, limpeza). Use `sessions_history` para uma visão de recuperação limitada
e filtrada por segurança; inspecione o caminho da transcrição no disco quando você
precisar da transcrição completa bruta.

### Controles de vinculação de conversas encadeadas

Estes comandos funcionam em canais que dão suporte a vinculações persistentes de conversas encadeadas.
Veja [Canais com suporte a conversas encadeadas](#thread-supporting-channels) abaixo.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamento de geração

`/subagents spawn` inicia um subagente em segundo plano como um comando de usuário (não um
retransmissor interno) e envia uma atualização final de conclusão de volta ao
chat solicitante quando a execução termina.

<AccordionGroup>
  <Accordion title="Conclusão não bloqueante baseada em push">
    - O comando de geração é não bloqueante; ele retorna um id de execução imediatamente.
    - Na conclusão, o subagente anuncia uma mensagem de resumo/resultado de volta ao canal de chat solicitante.
    - A conclusão é baseada em push. Depois de gerado, **não** consulte `/subagents list`, `sessions_list` ou `sessions_history` em um loop apenas para aguardar a conclusão; inspecione o status somente sob demanda para depuração ou intervenção.
    - Na conclusão, o OpenClaw faz o melhor possível para fechar abas/processos de navegador rastreados abertos por essa sessão de subagente antes que o fluxo de limpeza do anúncio continue.

  </Accordion>
  <Accordion title="Resiliência de entrega de geração manual">
    - O OpenClaw devolve conclusões à sessão solicitante por meio de um turno `agent` com uma chave de idempotência estável.
    - Se a execução solicitante ainda estiver ativa, o OpenClaw primeiro tenta despertar/direcionar essa execução em vez de iniciar um segundo caminho de resposta visível.
    - Se a transferência de conclusão do agente solicitante falhar ou não produzir saída visível, o OpenClaw trata a entrega como falha e recorre ao roteamento/repetição por fila. Ele não envia diretamente o resultado filho bruto para o chat externo.
    - Se a transferência direta não puder ser usada, ele recorre ao roteamento por fila.
    - Se o roteamento por fila ainda não estiver disponível, o anúncio é repetido com um backoff exponencial curto antes da desistência final.
    - A entrega de conclusão mantém a rota resolvida do solicitante: rotas de conclusão vinculadas a conversa encadeada ou vinculadas a conversa vencem quando disponíveis; se a origem da conclusão fornecer apenas um canal, o OpenClaw preenche o destino/conta ausente a partir da rota resolvida da sessão solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que a entrega direta ainda funcione.

  </Accordion>
  <Accordion title="Metadados de transferência de conclusão">
    A transferência de conclusão para a sessão solicitante é contexto interno gerado em tempo de execução
    (não texto criado pelo usuário) e inclui:

    - `Result` — texto da resposta `assistant` visível mais recente, caso contrário texto de ferramenta/toolResult mais recente higienizado. Execuções com falha terminal não reutilizam texto de resposta capturado.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Estatísticas compactas de runtime/tokens.
    - Uma instrução de entrega que orienta o agente solicitante a reescrever em voz normal de assistente (não encaminhar metadados internos brutos).

  </Accordion>
  <Accordion title="Modos e runtime ACP">
    - `--model` e `--thinking` substituem os padrões para essa execução específica.
    - Use `info`/`log` para inspecionar detalhes e saída após a conclusão.
    - `/subagents spawn` é modo de execução única (`mode: "run"`). Para sessões persistentes vinculadas a conversa encadeada, use `sessions_spawn` com `thread: true` e `mode: "session"`.
    - Para sessões de harness ACP (Claude Code, Gemini CLI, OpenCode ou Codex ACP/acpx explícito), use `sessions_spawn` com `runtime: "acp"` quando a ferramenta anunciar esse runtime. Veja [Modelo de entrega ACP](/pt-BR/tools/acp-agents#delivery-model) ao depurar conclusões ou loops de agente para agente. Quando o Plugin `codex` estiver habilitado, o controle de chat/conversa encadeada do Codex deve preferir `/codex ...` em vez de ACP, a menos que o usuário peça explicitamente ACP/acpx.
    - O OpenClaw oculta `runtime: "acp"` até que ACP esteja habilitado, o solicitante não esteja em sandbox e um Plugin de backend como `acpx` esteja carregado. `runtime: "acp"` espera um id externo de harness ACP, ou uma entrada `agents.list[]` com `runtime.type="acp"`; use o runtime padrão de subagente para agentes normais de configuração do OpenClaw de `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Subagentes nativos começam isolados, a menos que o chamador peça explicitamente para ramificar
a transcrição atual.

| Modo       | Quando usá-lo                                                                                                                         | Comportamento                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Pesquisa nova, implementação independente, trabalho com ferramenta lenta ou qualquer coisa que possa ser instruída no texto da tarefa                           | Cria uma transcrição filha limpa. Este é o padrão e mantém o uso de tokens menor.  |
| `fork`     | Trabalho que depende da conversa atual, resultados anteriores de ferramentas ou instruções sutis já presentes na transcrição do solicitante | Ramifica a transcrição do solicitante para a sessão filha antes que o filho comece. |

Use `fork` com moderação. Ele serve para delegação sensível ao contexto, não como
substituto para escrever um prompt de tarefa claro.

## Ferramenta: `sessions_spawn`

Inicia uma execução de subagente com `deliver: false` na faixa global `subagent`,
depois executa uma etapa de anúncio e publica a resposta de anúncio no canal de chat
solicitante.

A disponibilidade depende da política efetiva de ferramentas do chamador. Os perfis `coding` e
`full` expõem `sessions_spawn` por padrão. O perfil `messaging`
não; adicione `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` ou use `tools.profile: "coding"` para agentes que devem delegar
trabalho. Políticas de canal/grupo, provider, sandbox e allow/deny por agente ainda podem
remover a ferramenta depois da etapa de perfil. Use `/tools` na mesma
sessão para confirmar a lista efetiva de ferramentas.

**Padrões:**

- **Modelo:** herda do chamador, a menos que você defina `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` por agente); um `sessions_spawn.model` explícito ainda prevalece.
- **Thinking:** herda do chamador, a menos que você defina `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` por agente); um `sessions_spawn.thinking` explícito ainda prevalece.
- **Tempo limite de execução:** se `sessions_spawn.runTimeoutSeconds` for omitido, o OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário, recorre a `0` (sem tempo limite).

### Parâmetros da ferramenta

<ParamField path="task" type="string" required>
  A descrição da tarefa para o subagente.
</ParamField>
<ParamField path="label" type="string">
  Rótulo legível por humanos opcional.
</ParamField>
<ParamField path="agentId" type="string">
  Gere sob outro id de agente quando permitido por `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` é apenas para harnesses ACP externos (`claude`, `droid`, `gemini`, `opencode` ou Codex ACP/acpx solicitado explicitamente) e para entradas `agents.list[]` cujo `runtime.type` é `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Apenas ACP. Retoma uma sessão de harness ACP existente quando `runtime: "acp"`; ignorado para gerações de subagentes nativos.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Apenas ACP. Transmite a saída da execução ACP para a sessão pai quando `runtime: "acp"`; omita para gerações de subagentes nativos.
</ParamField>
<ParamField path="model" type="string">
  Substitua o modelo do subagente. Valores inválidos são ignorados e o subagente roda no modelo padrão com um aviso no resultado da ferramenta.
</ParamField>
<ParamField path="thinking" type="string">
  Substitua o nível de thinking para a execução de subagente.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  O padrão é `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário, `0`. Quando definido, a execução de subagente é abortada após N segundos.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Quando `true`, solicita vinculação de conversa encadeada do canal para esta sessão de subagente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Se `thread: true` e `mode` for omitido, o padrão se torna `session`. `mode: "session"` exige `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` arquiva imediatamente após o anúncio (ainda mantém a transcrição por renomeação).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rejeita a geração a menos que o runtime filho alvo esteja em sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` ramifica a transcrição atual do solicitante para a sessão filha. Apenas subagentes nativos. Gerações vinculadas a conversa encadeada usam `fork` por padrão; gerações sem conversa encadeada usam `isolated` por padrão.
</ParamField>

<Warning>
`sessions_spawn` **não** aceita parâmetros de entrega em canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Para entrega, use
`message`/`sessions_send` a partir da execução gerada.
</Warning>

## Sessões vinculadas a conversas encadeadas

Quando vinculações de conversas encadeadas estão habilitadas para um canal, um subagente pode permanecer vinculado
a uma conversa encadeada para que mensagens de acompanhamento do usuário nessa conversa continuem sendo roteadas para a
mesma sessão de subagente.

### Canais com suporte a conversas encadeadas

**Discord** é atualmente o único canal compatível. Ele oferece suporte a
sessões de subagente persistentes vinculadas a conversa encadeada (`sessions_spawn` com
`thread: true`), controles manuais de conversa encadeada (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) e chaves de adaptador
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` e
`channels.discord.threadBindings.spawnSessions`.

### Fluxo rápido

<Steps>
  <Step title="Gerar">
    `sessions_spawn` com `thread: true` (e, opcionalmente, `mode: "session"`).
  </Step>
  <Step title="Vincular">
    O OpenClaw cria ou vincula uma thread a esse destino de sessão no canal ativo.
  </Step>
  <Step title="Encaminhar acompanhamentos">
    Respostas e mensagens de acompanhamento nessa thread são encaminhadas para a sessão vinculada.
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
| `/agents`          | Lista execuções ativas e o estado do vínculo (`thread:<id>` ou `unbound`)       |
| `/session idle`    | Inspeciona/atualiza o auto-desfoque por ociosidade (somente threads vinculadas em foco)         |
| `/session max-age` | Inspeciona/atualiza o limite rígido (somente threads vinculadas em foco)                  |

### Alternâncias de configuração

- **Padrão global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Substituição por canal e chaves de vinculação automática no spawn** são específicas do adaptador. Veja [Canais com suporte a threads](#thread-supporting-channels) acima.

Veja a [Referência de configuração](/pt-BR/gateway/configuration-reference) e
[Comandos de barra](/pt-BR/tools/slash-commands) para detalhes atuais dos adaptadores.

### Lista de permissões

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de ids de agente que podem ser direcionados via `agentId` explícito (`["*"]` permite qualquer um). Padrão: somente o agente solicitante. Se você definir uma lista e ainda quiser que o solicitante gere a si mesmo com `agentId`, inclua o id do solicitante na lista.
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

Use `agents_list` para ver quais ids de agente estão permitidos no momento para
`sessions_spawn`. A resposta inclui o modelo efetivo de cada agente listado
e metadados de runtime incorporados para que os chamadores possam distinguir PI, servidor de aplicativo Codex
e outros runtimes nativos configurados.

### Arquivamento automático

- Sessões de subagente são arquivadas automaticamente após `agents.defaults.subagents.archiveAfterMinutes` (padrão `60`).
- O arquivamento usa `sessions.delete` e renomeia a transcrição para `*.deleted.<timestamp>` (mesma pasta).
- `cleanup: "delete"` arquiva imediatamente após o anúncio (ainda mantém a transcrição por renomeação).
- O arquivamento automático é de melhor esforço; temporizadores pendentes são perdidos se o Gateway reiniciar.
- `runTimeoutSeconds` **não** arquiva automaticamente; ele apenas interrompe a execução. A sessão permanece até o arquivamento automático.
- O arquivamento automático se aplica igualmente a sessões de profundidade 1 e profundidade 2.
- A limpeza do navegador é separada da limpeza de arquivamento: abas/processos de navegador rastreados são fechados em melhor esforço quando a execução termina, mesmo que a transcrição/registro de sessão seja mantido.

## Subagentes aninhados

Por padrão, subagentes não podem gerar seus próprios subagentes
(`maxSpawnDepth: 1`). Defina `maxSpawnDepth: 2` para habilitar um nível de
aninhamento — o **padrão de orquestrador**: principal → subagente orquestrador →
sub-subagentes trabalhadores.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // permite que subagentes gerem filhos (padrão: 1)
        maxChildrenPerAgent: 5, // máximo de filhos ativos por sessão de agente (padrão: 5)
        maxConcurrent: 8, // limite global de lanes de concorrência (padrão: 8)
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
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestrador quando profundidade 2 permitida) | Somente se `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagente (trabalhador folha)             | Nunca                        |

### Cadeia de anúncio

Os resultados fluem de volta pela cadeia:

1. Trabalhador de profundidade 2 termina → anuncia ao seu pai (orquestrador de profundidade 1).
2. Orquestrador de profundidade 1 recebe o anúncio, sintetiza os resultados, termina → anuncia ao principal.
3. Agente principal recebe o anúncio e entrega ao usuário.

Cada nível vê apenas anúncios de seus filhos diretos.

<Note>
**Orientação operacional:** inicie o trabalho filho uma vez e aguarde eventos
de conclusão, em vez de criar loops de polling em torno de `sessions_list`,
`sessions_history`, `/subagents list` ou comandos de espera com `exec`.
`sessions_list` e `/subagents list` mantêm as relações de sessões filhas
focadas no trabalho em execução — filhos em execução permanecem anexados, filhos encerrados ficam
visíveis por uma janela recente curta, e links obsoletos de filhos apenas no armazenamento são
ignorados após sua janela de frescor. Isso impede que metadados antigos de `spawnedBy` /
`parentSessionKey` ressuscitem filhos fantasma após
a reinicialização. Se um evento de conclusão de filho chegar depois que você já enviou a
resposta final, o acompanhamento correto é o token silencioso exato
`NO_REPLY` / `no_reply`.
</Note>

### Política de ferramentas por profundidade

- A função e o escopo de controle são gravados nos metadados da sessão no momento do spawn. Isso impede que chaves de sessão planas ou restauradas recuperem acidentalmente privilégios de orquestrador.
- **Profundidade 1 (orquestrador, quando `maxSpawnDepth >= 2`):** recebe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder gerenciar seus filhos. Outras ferramentas de sessão/sistema permanecem negadas.
- **Profundidade 1 (folha, quando `maxSpawnDepth == 1`):** sem ferramentas de sessão (comportamento padrão atual).
- **Profundidade 2 (trabalhador folha):** sem ferramentas de sessão — `sessions_spawn` é sempre negado na profundidade 2. Não pode gerar mais filhos.

### Limite de spawn por agente

Cada sessão de agente (em qualquer profundidade) pode ter no máximo `maxChildrenPerAgent`
(padrão `5`) filhos ativos por vez. Isso evita fan-out descontrolado
de um único orquestrador.

### Parada em cascata

Parar um orquestrador de profundidade 1 interrompe automaticamente todos os seus filhos de profundidade 2:

- `/stop` no chat principal interrompe todos os agentes de profundidade 1 e propaga para seus filhos de profundidade 2.
- `/subagents kill <id>` interrompe um subagente específico e propaga para seus filhos.
- `/subagents kill all` interrompe todos os subagentes do solicitante e propaga.

## Autenticação

A autenticação de subagente é resolvida pelo **id do agente**, não pelo tipo de sessão:

- A chave de sessão do subagente é `agent:<agentId>:subagent:<uuid>`.
- O armazenamento de autenticação é carregado do `agentDir` desse agente.
- Os perfis de autenticação do agente principal são mesclados como **fallback**; perfis de agente substituem perfis principais em conflitos.

A mesclagem é aditiva, portanto os perfis principais estão sempre disponíveis como
fallbacks. Autenticação totalmente isolada por agente ainda não é compatível.

## Anúncio

Subagentes retornam o resultado por meio de uma etapa de anúncio:

- A etapa de anúncio é executada dentro da sessão do subagente (não na sessão do solicitante).
- Se o subagente responder exatamente `ANNOUNCE_SKIP`, nada é postado.
- Se o texto mais recente do assistente for o token silencioso exato `NO_REPLY` / `no_reply`, a saída do anúncio é suprimida mesmo que tenha existido progresso visível anterior.

A entrega depende da profundidade do solicitante:

- Sessões solicitantes de nível superior usam uma chamada `agent` de acompanhamento com entrega externa (`deliver=true`).
- Sessões de subagente solicitante aninhadas recebem uma injeção interna de acompanhamento (`deliver=false`) para que o orquestrador possa sintetizar resultados de filhos dentro da sessão.
- Se uma sessão de subagente solicitante aninhada não existir mais, o OpenClaw recorre ao solicitante dessa sessão quando disponível.

Para sessões solicitantes de nível superior, a entrega direta em modo de conclusão primeiro
resolve qualquer rota de conversa/thread vinculada e substituição de hook e, em seguida, preenche
campos ausentes de destino de canal a partir da rota armazenada da sessão solicitante.
Isso mantém as conclusões no chat/tópico correto mesmo quando a origem da conclusão
identifica apenas o canal.

A agregação de conclusões de filhos é limitada à execução solicitante atual ao
criar descobertas de conclusão aninhadas, impedindo que saídas de filhos de execuções anteriores obsoletas
vazem para o anúncio atual. Respostas de anúncio preservam
o roteamento de thread/tópico quando disponível nos adaptadores de canal.

### Contexto do anúncio

O contexto do anúncio é normalizado para um bloco de evento interno estável:

| Campo          | Fonte                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Origem         | `subagent` ou `cron`                                                                                          |
| Ids de sessão  | Chave/id da sessão filha                                                                                      |
| Tipo           | Tipo de anúncio + rótulo da tarefa                                                                            |
| Status         | Derivado do resultado do runtime (`success`, `error`, `timeout` ou `unknown`) — **não** inferido do texto do modelo |
| Conteúdo do resultado | Texto visível mais recente do assistente; caso contrário, texto mais recente sanitizado de ferramenta/toolResult                                |
| Acompanhamento | Instrução que descreve quando responder ou permanecer em silêncio                                                           |

Execuções terminais com falha reportam status de falha sem reproduzir o texto de
resposta capturado. Em caso de timeout, se o filho só chegou até chamadas de ferramenta, o anúncio
pode condensar esse histórico em um resumo curto de progresso parcial em vez
de reproduzir a saída bruta da ferramenta.

### Linha de estatísticas

Payloads de anúncio incluem uma linha de estatísticas no final (mesmo quando quebrados):

- Runtime (por exemplo, `runtime 5m12s`).
- Uso de tokens (entrada/saída/total).
- Custo estimado quando o preço do modelo está configurado (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` e caminho da transcrição para que o agente principal possa buscar o histórico via `sessions_history` ou inspecionar o arquivo no disco.

Metadados internos destinam-se apenas à orquestração; respostas voltadas ao usuário
devem ser reescritas na voz normal do assistente.

### Por que preferir `sessions_history`

`sessions_history` é o caminho de orquestração mais seguro:

- A recordação do assistente é normalizada primeiro: tags de pensamento removidas; andaimes `<relevant-memories>` / `<relevant_memories>` removidos; blocos de payload XML de chamada de ferramenta em texto simples (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) removidos, incluindo payloads truncados que nunca fecham corretamente; andaimes rebaixados de chamada/resultado de ferramenta e marcadores de contexto histórico removidos; tokens de controle de modelo vazados (`<|assistant|>`, outros ASCII `<|...|>`, largura completa `<｜...｜>`) removidos; XML malformado de chamada de ferramenta MiniMax removido.
- Texto semelhante a credenciais/tokens é redigido.
- Blocos longos podem ser truncados.
- Históricos muito grandes podem descartar linhas mais antigas ou substituir uma linha grande demais por `[sessions_history omitted: message too large]`.
- A inspeção da transcrição bruta no disco é o fallback quando você precisa da transcrição completa byte por byte.

## Política de ferramentas

Subagentes usam primeiro o mesmo perfil e pipeline de política de ferramentas que o agente pai ou de destino. Depois disso, o OpenClaw aplica a camada de restrição de subagente.

Sem um `tools.profile` restritivo, subagentes recebem **todas as ferramentas, exceto ferramentas de sessão** e ferramentas do sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` também permanece aqui como uma visualização de recuperação limitada e sanitizada — não é um despejo bruto de transcrição.

Quando `maxSpawnDepth >= 2`, subagentes orquestradores de profundidade 1 também recebem `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` para que possam gerenciar seus filhos.

### Sobrescrever via configuração

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

Subagentes usam uma faixa de fila dedicada dentro do processo:

- **Nome da faixa:** `subagent`
- **Concorrência:** `agents.defaults.subagents.maxConcurrent` (padrão `8`)

## Vivacidade e recuperação

O OpenClaw não trata a ausência de `endedAt` como prova permanente de que um subagente ainda está ativo. Execuções não encerradas mais antigas que a janela de execução obsoleta deixam de contar como ativas/pendentes em `/subagents list`, resumos de status, bloqueio de conclusão de descendentes e verificações de concorrência por sessão.

Após uma reinicialização do gateway, execuções restauradas obsoletas e não encerradas são podadas, a menos que a sessão filha esteja marcada como `abortedLastRun: true`. Essas sessões filhas abortadas pela reinicialização permanecem recuperáveis por meio do fluxo de recuperação de órfãos de subagente, que envia uma mensagem sintética de retomada antes de limpar o marcador de abortado.

A recuperação automática após reinicialização é limitada por sessão filha. Se o mesmo filho de subagente for aceito repetidamente para recuperação de órfãos dentro da janela de recravamento rápido, o OpenClaw persiste uma lápide de recuperação nessa sessão e para de retomá-la automaticamente em reinicializações posteriores. Execute `openclaw tasks maintenance --apply` para reconciliar o registro da tarefa ou `openclaw doctor --fix` para limpar sinalizadores obsoletos de recuperação abortada em sessões com lápide.

<Note>
Se a criação de um subagente falhar com Gateway `PAIRING_REQUIRED` / `scope-upgrade`, verifique o chamador RPC antes de editar o estado de pareamento. A coordenação interna de `sessions_spawn` deve se conectar como `client.id: "gateway-client"` com `client.mode: "backend"` por autenticação direta de token compartilhado/senha em local loopback; esse caminho não depende da linha de base de escopo de dispositivo pareado da CLI. Chamadores remotos, `deviceIdentity` explícito, caminhos explícitos de token de dispositivo e clientes de navegador/node ainda precisam da aprovação normal do dispositivo para upgrades de escopo.
</Note>

## Parada

- Enviar `/stop` no chat solicitante aborta a sessão solicitante e interrompe quaisquer execuções de subagentes ativas criadas a partir dela, em cascata para filhos aninhados.
- `/subagents kill <id>` interrompe um subagente específico e propaga para seus filhos.

## Limitações

- O anúncio de subagente é **de melhor esforço**. Se o Gateway reiniciar, o trabalho pendente de "anunciar de volta" será perdido.
- Subagentes ainda compartilham os mesmos recursos do processo do Gateway; trate `maxConcurrent` como uma válvula de segurança.
- `sessions_spawn` é sempre não bloqueante: ele retorna `{ status: "accepted", runId, childSessionKey }` imediatamente.
- O contexto de subagente injeta apenas `AGENTS.md` + `TOOLS.md` (sem `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ou `BOOTSTRAP.md`).
- A profundidade máxima de aninhamento é 5 (intervalo de `maxSpawnDepth`: 1–5). A profundidade 2 é recomendada para a maioria dos casos de uso.
- `maxChildrenPerAgent` limita os filhos ativos por sessão (padrão `5`, intervalo `1–20`).

## Relacionados

- [Agentes ACP](/pt-BR/tools/acp-agents)
- [Envio de agente](/pt-BR/tools/agent-send)
- [Tarefas em segundo plano](/pt-BR/automation/tasks)
- [Ferramentas de sandbox multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
