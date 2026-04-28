---
read_when:
    - Você quer trabalho em segundo plano ou paralelo via o agente
    - Você está alterando a política da ferramenta `sessions_spawn` ou de subagentes
    - Você está implementando ou solucionando problemas de sessões de subagentes vinculadas à thread
sidebarTitle: Sub-agents
summary: Iniciar execuções isoladas de agentes em segundo plano que anunciam os resultados de volta no chat solicitante
title: Subagentes
x-i18n:
    generated_at: "2026-04-26T11:39:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7f2f1b8ae08026dd0f8c1b466bb7a8b044ae1d12c2ae61735dcf9f380179986
    source_path: tools/subagents.md
    workflow: 15
---

Subagentes são execuções de agentes em segundo plano iniciadas a partir de uma execução existente de agente.
Eles rodam em sua própria sessão (`agent:<agentId>:subagent:<uuid>`) e,
quando terminam, **anunciam** seu resultado de volta no canal de chat
solicitante. Cada execução de subagente é rastreada como uma
[tarefa em segundo plano](/pt-BR/automation/tasks).

Objetivos principais:

- Paralelizar trabalho de “pesquisa / tarefa longa / ferramenta lenta” sem bloquear a execução principal.
- Manter subagentes isolados por padrão (separação de sessão + sandboxing opcional).
- Manter a superfície da ferramenta difícil de usar incorretamente: subagentes **não** recebem ferramentas de sessão por padrão.
- Oferecer suporte a profundidade de aninhamento configurável para padrões de orquestrador.

<Note>
**Observação sobre custo:** cada subagente tem seu próprio contexto e uso de tokens por
padrão. Para tarefas pesadas ou repetitivas, defina um modelo mais barato para subagentes
e mantenha seu agente principal em um modelo de maior qualidade. Configure via
`agents.defaults.subagents.model` ou substituições por agente. Quando um filho
realmente precisar da transcrição atual do solicitante, o agente pode solicitar
`context: "fork"` nessa execução específica.
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

`/subagents info` mostra metadados da execução (status, timestamps, id da sessão,
caminho da transcrição, limpeza). Use `sessions_history` para uma visualização de recuperação
limitada e filtrada por segurança; inspecione o caminho da transcrição no disco quando
precisar da transcrição bruta completa.

### Controles de vinculação a thread

Esses comandos funcionam em canais que oferecem suporte a vinculações persistentes de thread.
Veja [Canais com suporte a thread](#thread-supporting-channels) abaixo.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamento de execução

`/subagents spawn` inicia um subagente em segundo plano como um comando do usuário (não um
relay interno) e envia uma única atualização final de conclusão de volta ao
chat solicitante quando a execução termina.

<AccordionGroup>
  <Accordion title="Conclusão não bloqueante, baseada em push">
    - O comando de execução não bloqueia; ele retorna imediatamente um id de execução.
    - Na conclusão, o subagente anuncia uma mensagem de resumo/resultado de volta ao canal de chat solicitante.
    - A entrega da conclusão é baseada em push. Depois de iniciado, **não** faça polling de `/subagents list`, `sessions_list` ou `sessions_history` em loop apenas para esperar ele terminar; inspecione o status apenas sob demanda para depuração ou intervenção.
    - Na conclusão, o OpenClaw fecha com o melhor esforço abas/processos de navegador rastreados abertos por essa sessão de subagente antes que o fluxo de limpeza do anúncio continue.

  </Accordion>
  <Accordion title="Resiliência da entrega de execução manual">
    - O OpenClaw tenta primeiro a entrega direta de `agent` com uma chave de idempotência estável.
    - Se a entrega direta falhar, ele recorre ao roteamento por fila.
    - Se o roteamento por fila ainda não estiver disponível, o anúncio é tentado novamente com um pequeno backoff exponencial antes de desistir em definitivo.
    - A entrega da conclusão mantém a rota resolvida do solicitante: rotas de conclusão vinculadas à thread ou à conversa têm prioridade quando disponíveis; se a origem da conclusão fornecer apenas um canal, o OpenClaw preenche o alvo/conta ausente a partir da rota resolvida da sessão solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que a entrega direta continue funcionando.

  </Accordion>
  <Accordion title="Metadados de transferência de conclusão">
    A transferência da conclusão para a sessão solicitante é um contexto interno
    gerado em runtime (não texto criado pelo usuário) e inclui:

    - `Result` — texto mais recente visível de resposta do `assistant`, ou, caso contrário, o texto mais recente sanitizado de tool/toolResult. Execuções com falha terminal não reutilizam o texto de resposta capturado.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Estatísticas compactas de runtime/tokens.
    - Uma instrução de entrega dizendo ao agente solicitante para reescrever em voz normal de assistente (não encaminhar metadados internos brutos).

  </Accordion>
  <Accordion title="Modos e runtime ACP">
    - `--model` e `--thinking` substituem os padrões para essa execução específica.
    - Use `info`/`log` para inspecionar detalhes e saída após a conclusão.
    - `/subagents spawn` é modo de uso único (`mode: "run"`). Para sessões persistentes vinculadas a thread, use `sessions_spawn` com `thread: true` e `mode: "session"`.
    - Para sessões de harness ACP (Claude Code, Gemini CLI, OpenCode ou Codex ACP/acpx explícito), use `sessions_spawn` com `runtime: "acp"` quando a ferramenta anunciar esse runtime. Veja [Modelo de entrega do ACP](/pt-BR/tools/acp-agents#delivery-model) ao depurar conclusões ou loops agente-para-agente. Quando o Plugin `codex` estiver ativado, o controle de chat/thread do Codex deve preferir `/codex ...` em vez de ACP, a menos que o usuário peça explicitamente ACP/acpx.
    - O OpenClaw oculta `runtime: "acp"` até que ACP esteja ativado, o solicitante não esteja em sandbox e um Plugin de backend como `acpx` esteja carregado. `runtime: "acp"` espera um id externo de harness ACP ou uma entrada `agents.list[]` com `runtime.type="acp"`; use o runtime padrão de subagente para agentes normais de configuração do OpenClaw vindos de `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Subagentes nativos começam isolados, a menos que o chamador solicite explicitamente o fork
da transcrição atual.

| Modo       | Quando usá-lo                                                                                                                           | Comportamento                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `isolated` | Pesquisa nova, implementação independente, trabalho com ferramenta lenta ou qualquer coisa que possa ser resumida no texto da tarefa    | Cria uma transcrição filha limpa. Esse é o padrão e mantém o uso de tokens menor. |
| `fork`     | Trabalho que depende da conversa atual, de resultados anteriores de ferramentas ou de instruções detalhadas já presentes na transcrição do solicitante | Ramifica a transcrição do solicitante para a sessão filha antes de a filha começar. |

Use `fork` com moderação. Ele serve para delegação sensível ao contexto, não
como substituto para escrever um prompt de tarefa claro.

## Ferramenta: `sessions_spawn`

Inicia uma execução de subagente com `deliver: false` na lane global `subagent`,
depois executa uma etapa de anúncio e publica a resposta do anúncio no canal de
chat solicitante.

**Padrões:**

- **Modelo:** herda do chamador, a menos que você defina `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` por agente); um `sessions_spawn.model` explícito ainda tem prioridade.
- **Thinking:** herda do chamador, a menos que você defina `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` por agente); um `sessions_spawn.thinking` explícito ainda tem prioridade.
- **Tempo limite da execução:** se `sessions_spawn.runTimeoutSeconds` for omitido, o OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário, usa `0` (sem tempo limite).

### Parâmetros da ferramenta

<ParamField path="task" type="string" required>
  A descrição da tarefa para o subagente.
</ParamField>
<ParamField path="label" type="string">
  Rótulo legível opcional.
</ParamField>
<ParamField path="agentId" type="string">
  Inicia sob outro id de agente quando permitido por `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` é apenas para harnesses ACP externos (`claude`, `droid`, `gemini`, `opencode` ou Codex ACP/acpx solicitado explicitamente) e para entradas `agents.list[]` cujo `runtime.type` seja `acp`.
</ParamField>
<ParamField path="model" type="string">
  Substitui o modelo do subagente. Valores inválidos são ignorados e o subagente roda no modelo padrão com um aviso no resultado da ferramenta.
</ParamField>
<ParamField path="thinking" type="string">
  Substitui o nível de thinking da execução do subagente.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  O padrão é `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário, `0`. Quando definido, a execução do subagente é abortada após N segundos.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Quando `true`, solicita vinculação da thread do canal para esta sessão de subagente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Se `thread: true` e `mode` for omitido, o padrão passa a ser `session`. `mode: "session"` exige `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` arquiva imediatamente após o anúncio (ainda preserva a transcrição via renomeação).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rejeita a execução a menos que o runtime filho de destino esteja em sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` ramifica a transcrição atual do solicitante para a sessão filha. Apenas subagentes nativos. Use `fork` apenas quando o filho precisar da transcrição atual.
</ParamField>

<Warning>
`sessions_spawn` **não** aceita parâmetros de entrega de canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Para entrega, use
`message`/`sessions_send` a partir da execução iniciada.
</Warning>

## Sessões vinculadas a thread

Quando vinculações de thread estão ativadas para um canal, um subagente pode permanecer vinculado
a uma thread, para que mensagens futuras do usuário nessa thread continuem sendo roteadas para a
mesma sessão de subagente.

### Canais com suporte a thread

**Discord** é atualmente o único canal compatível. Ele oferece suporte a
sessões persistentes de subagente vinculadas a thread (`sessions_spawn` com
`thread: true`), controles manuais de thread (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) e chaves do adaptador
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` e
`channels.discord.threadBindings.spawnSubagentSessions`.

### Fluxo rápido

<Steps>
  <Step title="Iniciar">
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
| `/focus <target>`  | Vincula a thread atual (ou cria uma) a um alvo de subagente/sessão    |
| `/unfocus`         | Remove a vinculação da thread vinculada atual                         |
| `/agents`          | Lista execuções ativas e estado da vinculação (`thread:<id>` ou `unbound`) |
| `/session idle`    | Inspeciona/atualiza o desfoco automático por inatividade (apenas threads vinculadas em foco) |
| `/session max-age` | Inspeciona/atualiza o limite rígido (apenas threads vinculadas em foco) |

### Chaves de configuração

- **Padrão global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Substituição por canal e chaves de vinculação automática na execução** são específicas do adaptador. Veja [Canais com suporte a thread](#thread-supporting-channels) acima.

Veja [Referência de configuração](/pt-BR/gateway/configuration-reference) e
[Comandos slash](/pt-BR/tools/slash-commands) para detalhes atuais do adaptador.

### Lista de permissões

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de ids de agentes que podem ser usados como alvo via `agentId` (`["*"]` permite qualquer um). Padrão: apenas o agente solicitante.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista de permissões padrão de agentes-alvo usada quando o agente solicitante não define seu próprio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloqueia chamadas de `sessions_spawn` que omitem `agentId` (força seleção explícita de perfil). Substituição por agente: `agents.list[].subagents.requireAgentId`.
</ParamField>

Se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeitará alvos
que rodariam sem sandbox.

### Descoberta

Use `agents_list` para ver quais ids de agentes estão atualmente permitidos para
`sessions_spawn`. A resposta inclui o modelo efetivo de cada agente listado
e metadados de runtime incorporados para que os chamadores possam distinguir PI, Codex
app-server e outros runtimes nativos configurados.

### Arquivamento automático

- Sessões de subagentes são arquivadas automaticamente após `agents.defaults.subagents.archiveAfterMinutes` (padrão `60`).
- O arquivamento usa `sessions.delete` e renomeia a transcrição para `*.deleted.<timestamp>` (mesma pasta).
- `cleanup: "delete"` arquiva imediatamente após o anúncio (ainda preserva a transcrição via renomeação).
- O arquivamento automático é feito com melhor esforço; timers pendentes são perdidos se o Gateway for reiniciado.
- `runTimeoutSeconds` **não** arquiva automaticamente; ele apenas interrompe a execução. A sessão permanece até o arquivamento automático.
- O arquivamento automático se aplica igualmente a sessões de profundidade 1 e profundidade 2.
- A limpeza do navegador é separada da limpeza de arquivamento: abas/processos de navegador rastreados são fechados com melhor esforço quando a execução termina, mesmo que o registro da transcrição/sessão seja mantido.

## Subagentes aninhados

Por padrão, subagentes não podem iniciar seus próprios subagentes
(`maxSpawnDepth: 1`). Defina `maxSpawnDepth: 2` para permitir um nível de
aninhamento — o **padrão orquestrador**: principal → subagente orquestrador →
sub-subagentes trabalhadores.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // permitir que subagentes iniciem filhos (padrão: 1)
        maxChildrenPerAgent: 5, // máximo de filhos ativos por sessão de agente (padrão: 5)
        maxConcurrent: 8, // limite global de concorrência da lane (padrão: 8)
        runTimeoutSeconds: 900, // tempo limite padrão para sessions_spawn quando omitido (0 = sem tempo limite)
      },
    },
  },
}
```

### Níveis de profundidade

| Profundidade | Formato da chave da sessão                  | Papel                                         | Pode iniciar?                |
| ------------ | ------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0            | `agent:<id>:main`                           | Agente principal                              | Sempre                       |
| 1            | `agent:<id>:subagent:<uuid>`                | Subagente (orquestrador quando profundidade 2 é permitida) | Somente se `maxSpawnDepth >= 2` |
| 2            | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagente (trabalhador folha)            | Nunca                        |

### Cadeia de anúncio

Os resultados fluem de volta pela cadeia:

1. O trabalhador de profundidade 2 termina → anuncia ao seu pai (orquestrador de profundidade 1).
2. O orquestrador de profundidade 1 recebe o anúncio, sintetiza os resultados, termina → anuncia ao principal.
3. O agente principal recebe o anúncio e entrega ao usuário.

Cada nível vê apenas anúncios de seus filhos diretos.

<Note>
**Orientação operacional:** inicie o trabalho filho uma vez e aguarde os eventos de
conclusão em vez de criar loops de polling em torno de `sessions_list`,
`sessions_history`, `/subagents list` ou comandos `exec` com sleep.
`sessions_list` e `/subagents list` mantêm os relacionamentos entre sessões filhas
focados em trabalho ativo — filhos ativos permanecem anexados, filhos encerrados continuam
visíveis por uma curta janela recente, e links filhos obsoletos somente do armazenamento são
ignorados após sua janela de validade. Isso evita que metadados antigos de `spawnedBy` /
`parentSessionKey` ressuscitem filhos fantasmas após reinicialização. Se um evento de
conclusão de filho chegar depois que você já enviou a resposta final, o acompanhamento correto é o token silencioso exato
`NO_REPLY` / `no_reply`.
</Note>

### Política de ferramentas por profundidade

- O papel e o escopo de controle são gravados nos metadados da sessão no momento da execução. Isso evita que chaves de sessão planas ou restauradas recuperem acidentalmente privilégios de orquestrador.
- **Profundidade 1 (orquestrador, quando `maxSpawnDepth >= 2`):** recebe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para que possa gerenciar seus filhos. Outras ferramentas de sessão/sistema permanecem negadas.
- **Profundidade 1 (folha, quando `maxSpawnDepth == 1`):** sem ferramentas de sessão (comportamento padrão atual).
- **Profundidade 2 (trabalhador folha):** sem ferramentas de sessão — `sessions_spawn` é sempre negado na profundidade 2. Não pode iniciar mais filhos.

### Limite de execução por agente

Cada sessão de agente (em qualquer profundidade) pode ter no máximo `maxChildrenPerAgent`
(padrão `5`) filhos ativos ao mesmo tempo. Isso evita expansão descontrolada
a partir de um único orquestrador.

### Parada em cascata

Interromper um orquestrador de profundidade 1 interrompe automaticamente todos os seus
filhos de profundidade 2:

- `/stop` no chat principal interrompe todos os agentes de profundidade 1 e faz cascata para seus filhos de profundidade 2.
- `/subagents kill <id>` interrompe um subagente específico e faz cascata para seus filhos.
- `/subagents kill all` interrompe todos os subagentes do solicitante e faz cascata.

## Autenticação

A autenticação do subagente é resolvida por **id do agente**, não por tipo de sessão:

- A chave da sessão do subagente é `agent:<agentId>:subagent:<uuid>`.
- O armazenamento de autenticação é carregado a partir de `agentDir` desse agente.
- Os perfis de autenticação do agente principal são mesclados como **fallback**; perfis do agente substituem perfis do principal em caso de conflito.

A mesclagem é aditiva, então perfis do principal estão sempre disponíveis como
fallback. Autenticação totalmente isolada por agente ainda não é compatível.

## Anúncio

Subagentes reportam de volta por uma etapa de anúncio:

- A etapa de anúncio roda dentro da sessão do subagente (não na sessão do solicitante).
- Se o subagente responder exatamente `ANNOUNCE_SKIP`, nada é publicado.
- Se o texto mais recente do assistente for o token silencioso exato `NO_REPLY` / `no_reply`, a saída do anúncio será suprimida mesmo que tenha havido progresso visível antes.

A entrega depende da profundidade do solicitante:

- Sessões solicitantes de nível superior usam uma chamada de acompanhamento `agent` com entrega externa (`deliver=true`).
- Sessões aninhadas de subagente solicitante recebem uma injeção interna de acompanhamento (`deliver=false`) para que o orquestrador possa sintetizar resultados dos filhos dentro da sessão.
- Se uma sessão aninhada de subagente solicitante não existir mais, o OpenClaw recorre ao solicitante dessa sessão quando disponível.

Para sessões solicitantes de nível superior, a entrega direta em modo de conclusão primeiro
resolve qualquer rota de conversa/thread vinculada e substituição de hook, depois preenche
campos ausentes de alvo de canal a partir da rota armazenada da sessão solicitante.
Isso mantém as conclusões no chat/tópico correto mesmo quando a origem da conclusão
identifica apenas o canal.

A agregação de conclusão dos filhos é limitada à execução atual do solicitante ao
montar achados de conclusão aninhados, evitando que saídas de filhos de execuções anteriores e obsoletas
vazem para o anúncio atual. Respostas de anúncio preservam o roteamento de thread/tópico quando disponível nos adaptadores de canal.

### Contexto de anúncio

O contexto de anúncio é normalizado em um bloco estável de evento interno:

| Campo            | Origem                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| Source           | `subagent` ou `cron`                                                                                             |
| Session ids      | Chave/id da sessão filha                                                                                         |
| Type             | Tipo de anúncio + rótulo da tarefa                                                                               |
| Status           | Derivado do resultado do runtime (`success`, `error`, `timeout` ou `unknown`) — **não** inferido do texto do modelo |
| Result content   | Texto visível mais recente do assistente; caso contrário, texto mais recente sanitizado de tool/toolResult      |
| Follow-up        | Instrução descrevendo quando responder vs permanecer em silêncio                                                 |

Execuções terminais com falha reportam status de falha sem reproduzir o
texto de resposta capturado. Em timeout, se o filho só conseguiu concluir chamadas de ferramenta, o anúncio
pode condensar esse histórico em um breve resumo de progresso parcial em vez
de reproduzir a saída bruta da ferramenta.

### Linha de estatísticas

As cargas de anúncio incluem uma linha de estatísticas no final (mesmo quando encapsuladas):

- Runtime (por exemplo `runtime 5m12s`).
- Uso de tokens (entrada/saída/total).
- Custo estimado quando o preço do modelo está configurado (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` e caminho da transcrição para que o agente principal possa buscar histórico via `sessions_history` ou inspecionar o arquivo no disco.

Metadados internos destinam-se apenas à orquestração; respostas voltadas ao usuário
devem ser reescritas em voz normal de assistente.

### Por que preferir `sessions_history`

`sessions_history` é o caminho de orquestração mais seguro:

- A recuperação do assistente é normalizada primeiro: tags de thinking removidas; scaffolding `<relevant-memories>` / `<relevant_memories>` removido; blocos de carga XML em texto simples de chamada de ferramenta (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) removidos, incluindo cargas truncadas que nunca fecham corretamente; scaffolding degradado de chamada/resultado de ferramenta e marcadores de contexto histórico removidos; tokens de controle de modelo vazados (`<|assistant|>`, outros ASCII `<|...|>`, largura total `<｜...｜>`) removidos; XML malformado de chamada de ferramenta MiniMax removido.
- Texto semelhante a credenciais/tokens é redigido.
- Blocos longos podem ser truncados.
- Históricos muito grandes podem descartar linhas antigas ou substituir uma linha superdimensionada por `[sessions_history omitted: message too large]`.
- A inspeção bruta da transcrição no disco é o fallback quando você precisa da transcrição completa byte a byte.

## Política de ferramentas

Subagentes usam o mesmo pipeline de perfil e política de ferramentas do pai ou
do agente de destino primeiro. Depois disso, o OpenClaw aplica a camada de restrição de subagente.

Sem `tools.profile` restritivo, subagentes recebem **todas as ferramentas exceto
ferramentas de sessão** e ferramentas de sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` continua sendo uma visualização de recuperação limitada e sanitizada aqui também —
não é um dump bruto da transcrição.

Quando `maxSpawnDepth >= 2`, subagentes orquestradores de profundidade 1 também
recebem `sessions_spawn`, `subagents`, `sessions_list` e
`sessions_history` para que possam gerenciar seus filhos.

### Substituição via config

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
        // deny vence
        deny: ["gateway", "cron"],
        // se allow for definido, ele se torna somente-permitir (deny ainda vence)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` é um filtro final de somente-permitir. Ele pode restringir
o conjunto de ferramentas já resolvido, mas não pode **readicionar**
uma ferramenta removida por `tools.profile`. Por exemplo, `tools.profile: "coding"` inclui
`web_search`/`web_fetch`, mas não a ferramenta `browser`. Para permitir que
subagentes do perfil coding usem automação de navegador, adicione `browser` já
na etapa do perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Use `agents.list[].tools.alsoAllow: ["browser"]` por agente quando apenas um
agente deve ter automação de navegador.

## Concorrência

Subagentes usam uma lane dedicada de fila em processo:

- **Nome da lane:** `subagent`
- **Concorrência:** `agents.defaults.subagents.maxConcurrent` (padrão `8`)

## Vivacidade e recuperação

O OpenClaw não trata a ausência de `endedAt` como prova permanente de que um
subagente ainda está ativo. Execuções não encerradas mais antigas que a janela de execução obsoleta
deixam de contar como ativas/pendentes em `/subagents list`, resumos de status,
controle de conclusão de descendentes e verificações de concorrência por sessão.

Após um reinício do Gateway, execuções restauradas obsoletas e não encerradas são removidas, a menos que
a sessão filha esteja marcada com `abortedLastRun: true`. Essas
sessões filhas abortadas no reinício continuam recuperáveis por meio do fluxo de recuperação de órfãos de subagente, que envia uma mensagem sintética de retomada antes
de limpar o marcador de abortado.

<Note>
Se a execução de um subagente falhar com Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, verifique o chamador RPC antes de editar o estado de pareamento.
A coordenação interna de `sessions_spawn` deve conectar como
`client.id: "gateway-client"` com `client.mode: "backend"` por autenticação direta
de loopback com token compartilhado/senha; esse caminho não depende da linha de base de escopo de dispositivo pareado da CLI. Chamadores remotos, `deviceIdentity`
explícito, caminhos explícitos com token de dispositivo e clientes browser/node
ainda precisam da aprovação normal do dispositivo para upgrades de escopo.
</Note>

## Interrompendo

- Enviar `/stop` no chat solicitante aborta a sessão solicitante e interrompe todas as execuções ativas de subagentes iniciadas a partir dela, em cascata para filhos aninhados.
- `/subagents kill <id>` interrompe um subagente específico e faz cascata para seus filhos.

## Limitações

- O anúncio de subagente é feito com **melhor esforço**. Se o Gateway for reiniciado, o trabalho pendente de “anunciar de volta” será perdido.
- Subagentes ainda compartilham os mesmos recursos de processo do Gateway; trate `maxConcurrent` como uma válvula de segurança.
- `sessions_spawn` é sempre não bloqueante: ele retorna `{ status: "accepted", runId, childSessionKey }` imediatamente.
- O contexto do subagente injeta apenas `AGENTS.md` + `TOOLS.md` (sem `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ou `BOOTSTRAP.md`).
- A profundidade máxima de aninhamento é 5 (intervalo de `maxSpawnDepth`: 1–5). Profundidade 2 é recomendada para a maioria dos casos de uso.
- `maxChildrenPerAgent` limita o número de filhos ativos por sessão (padrão `5`, intervalo `1–20`).

## Relacionado

- [Agentes ACP](/pt-BR/tools/acp-agents)
- [Envio para agente](/pt-BR/tools/agent-send)
- [Tarefas em segundo plano](/pt-BR/automation/tasks)
- [Ferramentas de sandbox multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
