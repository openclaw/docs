---
read_when:
    - Você quer trabalho em segundo plano ou paralelo por meio do agente
    - Você está alterando sessions_spawn ou a política da ferramenta de subagente
    - Você está implementando ou solucionando problemas em sessões de subagente vinculadas à thread
sidebarTitle: Sub-agents
summary: Inicie execuções isoladas de agentes em segundo plano que anunciam os resultados de volta ao chat solicitante
title: Subagentes
x-i18n:
    generated_at: "2026-05-10T19:54:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b4a78b83fda42931ed2a4795e2db611121a30378de149c0478e989029123382
    source_path: tools/subagents.md
    workflow: 16
---

Subagentes são execuções de agente em segundo plano criadas a partir de uma execução de agente existente.
Eles rodam na própria sessão (`agent:<agentId>:subagent:<uuid>`) e,
quando terminam, **anunciam** o resultado de volta ao canal de chat
solicitante. Cada execução de subagente é acompanhada como uma
[tarefa em segundo plano](/pt-BR/automation/tasks).

Objetivos principais:

- Paralelizar trabalho de "pesquisa / tarefa longa / ferramenta lenta" sem bloquear a execução principal.
- Manter subagentes isolados por padrão (separação de sessão + sandboxing opcional).
- Manter a superfície de ferramentas difícil de usar incorretamente: subagentes **não** recebem ferramentas de sessão por padrão.
- Dar suporte a profundidade de aninhamento configurável para padrões de orquestrador.

<Note>
**Nota de custo:** cada subagente tem o próprio contexto e uso de tokens por
padrão. Para tarefas pesadas ou repetitivas, defina um modelo mais barato para subagentes
e mantenha seu agente principal em um modelo de maior qualidade. Configure via
`agents.defaults.subagents.model` ou substituições por agente. Quando um filho
    realmente precisa da transcrição atual do solicitante, o agente pode solicitar
    `context: "fork"` nessa criação específica. Sessões de subagente vinculadas a thread usam por padrão
    `context: "fork"` porque ramificam a conversa atual em uma
    thread de acompanhamento.
</Note>

## Comando de barra

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

Use [`/steer <message>`](/pt-BR/tools/steer) no nível superior para direcionar a execução ativa da sessão solicitante atual. Use `/subagents steer <id|#> <message>` quando o alvo for uma execução filha.

`/subagents info` mostra metadados da execução (status, carimbos de data/hora, id da sessão,
caminho da transcrição, limpeza). Use `sessions_history` para uma visualização de recuperação limitada
e filtrada por segurança; inspecione o caminho da transcrição no disco quando você
precisar da transcrição completa bruta.

### Controles de vinculação de thread

Estes comandos funcionam em canais que dão suporte a vinculações de thread persistentes.
Veja [Canais compatíveis com thread](#thread-supporting-channels) abaixo.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamento de criação

`/subagents spawn` inicia um subagente em segundo plano como um comando de usuário (não um
relay interno) e envia uma atualização final de conclusão de volta ao
chat solicitante quando a execução termina.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - O comando de criação não bloqueia; ele retorna um id de execução imediatamente.
    - Na conclusão, o subagente anuncia uma mensagem de resumo/resultado de volta ao canal de chat solicitante.
    - Turnos de agente que precisam de resultados filhos devem chamar `sessions_yield` depois de criar o trabalho necessário. Isso encerra o turno atual e permite que eventos de conclusão cheguem como a próxima mensagem visível ao modelo.
    - A conclusão é baseada em push. Depois de criado, **não** consulte `/subagents list`, `sessions_list` ou `sessions_history` em loop apenas para esperar que ele termine; inspecione o status somente sob demanda para depuração ou intervenção.
    - A saída filha é um relatório/evidência para o agente solicitante sintetizar. Ela não é texto de instrução escrito pelo usuário e não pode substituir políticas de sistema, desenvolvedor ou usuário.
    - Na conclusão, o OpenClaw fecha em modo melhor esforço as abas/processos de navegador rastreados abertos por essa sessão de subagente antes que o fluxo de limpeza do anúncio continue.

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - O OpenClaw devolve conclusões para a sessão solicitante por meio de um turno `agent` com uma chave de idempotência estável.
    - Se a execução solicitante ainda estiver ativa, o OpenClaw primeiro tenta acordar/direcionar essa execução em vez de iniciar um segundo caminho de resposta visível.
    - Se a transferência de conclusão para o agente solicitante falhar ou não produzir saída visível, o OpenClaw trata a entrega como falha e recorre ao roteamento/fila de nova tentativa. Ele não envia diretamente o resultado filho bruto ao chat externo.
    - Se a transferência direta não puder ser usada, ele recorre ao roteamento por fila.
    - Se o roteamento por fila ainda não estiver disponível, o anúncio é tentado novamente com um backoff exponencial curto antes da desistência final.
    - A entrega de conclusão mantém a rota solicitante resolvida: rotas de conclusão vinculadas a thread ou a conversa vencem quando disponíveis; se a origem da conclusão fornecer apenas um canal, o OpenClaw preenche o alvo/conta ausente a partir da rota resolvida da sessão solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que a entrega direta ainda funcione.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    A transferência de conclusão para a sessão solicitante é contexto interno
    gerado em tempo de execução (não texto escrito pelo usuário) e inclui:

    - `Result` — texto da resposta `assistant` visível mais recente; caso contrário, texto sanitizado de ferramenta/toolResult mais recente. Execuções com falha terminal não reutilizam texto de resposta capturado.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Estatísticas compactas de runtime/tokens.
    - Uma instrução de entrega dizendo ao agente solicitante para reescrever em voz normal de assistente (não encaminhar metadados internos brutos).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` e `--thinking` substituem os padrões para essa execução específica.
    - Use `info`/`log` para inspecionar detalhes e saída após a conclusão.
    - `/subagents spawn` é modo de disparo único (`mode: "run"`). Para sessões persistentes vinculadas a thread, use `sessions_spawn` com `thread: true` e `mode: "session"`.
    - Para sessões de harness ACP (Claude Code, Gemini CLI, OpenCode ou Codex ACP/acpx explícito), use `sessions_spawn` com `runtime: "acp"` quando a ferramenta anunciar esse runtime. Veja [Modelo de entrega ACP](/pt-BR/tools/acp-agents#delivery-model) ao depurar conclusões ou loops de agente para agente. Quando o plugin `codex` estiver habilitado, o controle de chat/thread do Codex deve preferir `/codex ...` em vez de ACP, a menos que o usuário peça explicitamente ACP/acpx.
    - O OpenClaw oculta `runtime: "acp"` até que ACP esteja habilitado, o solicitante não esteja em sandbox e um Plugin de backend como `acpx` esteja carregado. `runtime: "acp"` espera um id de harness ACP externo, ou uma entrada `agents.list[]` com `runtime.type="acp"`; use o runtime de subagente padrão para agentes normais de configuração do OpenClaw vindos de `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Subagentes nativos começam isolados, a menos que o chamador solicite explicitamente bifurcar
a transcrição atual.

| Modo       | Quando usá-lo                                                                                                                         | Comportamento                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Pesquisa nova, implementação independente, trabalho de ferramenta lenta ou qualquer coisa que possa ser resumida no texto da tarefa                           | Cria uma transcrição filha limpa. Este é o padrão e mantém menor o uso de tokens.  |
| `fork`     | Trabalho que depende da conversa atual, de resultados de ferramentas anteriores ou de instruções sutis já presentes na transcrição solicitante | Ramifica a transcrição solicitante para dentro da sessão filha antes que o filho comece. |

Use `fork` com moderação. Ele serve para delegação sensível a contexto, não como
substituto para escrever um prompt de tarefa claro.

## Ferramenta: `sessions_spawn`

Inicia uma execução de subagente com `deliver: false` na lane global `subagent`,
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

- **Modelo:** herda do chamador, a menos que você defina `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` por agente); um `sessions_spawn.model` explícito ainda prevalece.
- **Thinking:** herda do chamador, a menos que você defina `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` por agente); um `sessions_spawn.thinking` explícito ainda prevalece.
- **Tempo limite de execução:** se `sessions_spawn.runTimeoutSeconds` for omitido, o OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário, recorre a `0` (sem tempo limite).

### Modo de prompt de delegação

`agents.defaults.subagents.delegationMode` controla apenas a orientação de prompt; ele não altera a política de ferramentas nem impõe delegação.

- `suggest` (padrão): mantém o lembrete padrão do prompt para usar subagentes em trabalhos maiores ou mais lentos.
- `prefer`: diz ao agente principal para permanecer responsivo e delegar por meio de `sessions_spawn` qualquer coisa mais envolvida que uma resposta direta.

Substituições por agente usam `agents.list[].subagents.delegationMode`.

```json5
{
  agents: {
    defaults: {
      subagents: {
        delegationMode: "prefer",
        maxConcurrent: 4,
      },
    },
    list: [
      {
        id: "coordinator",
        subagents: { delegationMode: "prefer" },
      },
    ],
  },
}
```

### Parâmetros da ferramenta

<ParamField path="task" type="string" required>
  A descrição da tarefa para o subagente.
</ParamField>
<ParamField path="taskName" type="string">
  Identificador estável opcional para direcionamento posterior por `subagents`. Deve corresponder a `[a-z][a-z0-9_]{0,63}` e não pode ser um alvo reservado, como `last` ou `all`. Prefira usá-lo quando o coordenador talvez precise orientar, encerrar ou identificar um filho específico depois de criar vários filhos.
</ParamField>
<ParamField path="label" type="string">
  Rótulo opcional legível por humanos.
</ParamField>
<ParamField path="agentId" type="string">
  Cria sob outro id de agente quando permitido por `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` é apenas para harnesses ACP externos (`claude`, `droid`, `gemini`, `opencode` ou Codex ACP/acpx explicitamente solicitado) e para entradas `agents.list[]` cujo `runtime.type` é `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Somente ACP. Retoma uma sessão existente de harness ACP quando `runtime: "acp"`; ignorado para criações nativas de subagente.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Somente ACP. Transmite a saída da execução ACP para a sessão pai quando `runtime: "acp"`; omita para criações nativas de subagente.
</ParamField>
<ParamField path="model" type="string">
  Substitui o modelo do subagente. Valores inválidos são ignorados e o subagente é executado no modelo padrão com um aviso no resultado da ferramenta.
</ParamField>
<ParamField path="thinking" type="string">
  Substitui o nível de pensamento para a execução do subagente.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  O padrão é `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário, `0`. Quando definido, a execução do subagente é abortada após N segundos.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Quando `true`, solicita vinculação de tópico do canal para esta sessão de subagente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Se `thread: true` e `mode` for omitido, o padrão se torna `session`. `mode: "session"` exige `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` arquiva imediatamente após anunciar (ainda mantém a transcrição por renomeação).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rejeita a criação, a menos que o runtime filho de destino esteja em sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` ramifica a transcrição atual do solicitante para a sessão filha. Apenas subagentes nativos. Criações vinculadas a tópicos usam `fork` por padrão; criações sem tópico usam `isolated` por padrão.
</ParamField>

<Warning>
`sessions_spawn` **não** aceita parâmetros de entrega por canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Para entrega, use
`message`/`sessions_send` a partir da execução criada.
</Warning>

### Nomes de tarefa e direcionamento

`taskName` é um identificador voltado ao modelo para orquestração, não uma chave de sessão.
Use-o para nomes estáveis de filhos, como `review_subagents`,
`linux_validation` ou `docs_update`, quando um coordenador talvez precise orientar
ou encerrar esse filho posteriormente.

A resolução de destino aceita correspondências exatas de `taskName` e
prefixos inequívocos. A correspondência é limitada à mesma janela de destino
ativa/recente usada por destinos numerados de `/subagents`, portanto um filho
concluído antigo não torna ambíguo um identificador reutilizado. Se dois filhos
ativos ou recentes compartilharem o mesmo `taskName`, o destino é ambíguo; use o
índice da lista, a chave de sessão ou o id de execução em vez disso.

Os destinos reservados `last` e `all` não são valores válidos de `taskName`
porque já têm significados de controle.

## Ferramenta: `sessions_yield`

Encerra o turno atual do modelo e aguarda eventos de runtime, principalmente
eventos de conclusão de subagente, chegarem como a próxima mensagem. Use-a depois
de criar trabalho filho obrigatório quando o solicitante não puder produzir uma
resposta final até que essas conclusões cheguem.

`sessions_yield` é a primitiva de espera. Não a substitua por loops de sondagem
sobre `subagents`, `sessions_list`, `sessions_history`, `sleep` de shell
ou sondagem de processos apenas para detectar a conclusão de filhos.

Use `sessions_yield` somente quando a lista efetiva de ferramentas da sessão a
inclui. Alguns perfis de ferramentas mínimos ou personalizados podem expor
`sessions_spawn` e `subagents` sem expor `sessions_yield`; nesse caso, não invente
um loop de sondagem apenas para esperar a conclusão.

Quando existem filhos ativos, o OpenClaw injeta um bloco de prompt compacto
gerado pelo runtime `Active Subagents` nos turnos normais para que o solicitante
possa ver as sessões filhas atuais, ids de execução, status, rótulos, tarefas e
aliases `taskName` sem sondagem. Os campos de tarefa e rótulo nesse bloco são
citados como dados, não instruções, porque podem se originar de argumentos de
criação fornecidos pelo usuário/modelo.

## Ferramenta: `subagents`

Lista, orienta ou encerra execuções de subagente criadas pertencentes à sessão
solicitante. Ela é limitada ao solicitante atual; um filho só pode
ver/controlar seus próprios filhos controlados.

Use `subagents` para status sob demanda, depuração, orientação ou encerramento.
Use `sessions_yield` para aguardar eventos de conclusão.

## Sessões vinculadas a tópicos

Quando vinculações de tópico estão habilitadas para um canal, um subagente pode
permanecer vinculado a um tópico para que mensagens de acompanhamento do usuário
nesse tópico continuem sendo roteadas para a mesma sessão de subagente.

### Canais com suporte a tópicos

**Discord** é atualmente o único canal compatível. Ele oferece suporte a
sessões persistentes de subagente vinculadas a tópicos (`sessions_spawn` com
`thread: true`), controles manuais de tópico (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) e chaves de adaptador
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` e
`channels.discord.threadBindings.spawnSessions`.

### Fluxo rápido

<Steps>
  <Step title="Criar">
    `sessions_spawn` com `thread: true` (e opcionalmente `mode: "session"`).
  </Step>
  <Step title="Vincular">
    O OpenClaw cria ou vincula um tópico a esse destino de sessão no canal ativo.
  </Step>
  <Step title="Rotear acompanhamentos">
    Respostas e mensagens de acompanhamento nesse tópico são roteadas para a sessão vinculada.
  </Step>
  <Step title="Inspecionar timeouts">
    Use `/session idle` para inspecionar/atualizar o auto-desfoco por inatividade e
    `/session max-age` para controlar o limite rígido.
  </Step>
  <Step title="Desanexar">
    Use `/unfocus` para desanexar manualmente.
  </Step>
</Steps>

### Controles manuais

| Comando            | Efeito                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Vincula o tópico atual (ou cria um) a um destino de subagente/sessão |
| `/unfocus`         | Remove a vinculação para o tópico vinculado atual                       |
| `/agents`          | Lista execuções ativas e estado de vinculação (`thread:<id>` ou `unbound`)       |
| `/session idle`    | Inspeciona/atualiza auto-desfoco por inatividade (somente tópicos vinculados em foco)         |
| `/session max-age` | Inspeciona/atualiza limite rígido (somente tópicos vinculados em foco)                  |

### Opções de configuração

- **Padrão global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Chaves de substituição de canal e vinculação automática na criação** são específicas do adaptador. Consulte [Canais com suporte a tópicos](#thread-supporting-channels) acima.

Consulte a [Referência de configuração](/pt-BR/gateway/configuration-reference) e
[Comandos slash](/pt-BR/tools/slash-commands) para os detalhes atuais do adaptador.

### Lista de permissões

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de ids de agentes que podem ser direcionados por `agentId` explícito (`["*"]` permite qualquer um). Padrão: apenas o agente solicitante. Se você definir uma lista e ainda quiser que o solicitante crie a si mesmo com `agentId`, inclua o id do solicitante na lista.
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

Use `agents_list` para ver quais ids de agentes estão atualmente permitidos para
`sessions_spawn`. A resposta inclui o modelo efetivo de cada agente listado
e metadados de runtime incorporados para que os chamadores possam distinguir PI,
servidor de aplicativo Codex e outros runtimes nativos configurados.

### Arquivamento automático

- Sessões de subagente são arquivadas automaticamente após `agents.defaults.subagents.archiveAfterMinutes` (padrão `60`).
- O arquivamento usa `sessions.delete` e renomeia a transcrição para `*.deleted.<timestamp>` (mesma pasta).
- `cleanup: "delete"` arquiva imediatamente após anunciar (ainda mantém a transcrição por renomeação).
- O arquivamento automático é de melhor esforço; temporizadores pendentes são perdidos se o Gateway reiniciar.
- `runTimeoutSeconds` **não** arquiva automaticamente; ele apenas interrompe a execução. A sessão permanece até o arquivamento automático.
- O arquivamento automático se aplica igualmente a sessões de profundidade 1 e profundidade 2.
- A limpeza do navegador é separada da limpeza de arquivamento: abas/processos de navegador rastreados são fechados em melhor esforço quando a execução termina, mesmo que a transcrição/registro da sessão seja mantido.

## Subagentes aninhados

Por padrão, subagentes não podem criar seus próprios subagentes
(`maxSpawnDepth: 1`). Defina `maxSpawnDepth: 2` para habilitar um nível de
aninhamento — o **padrão orquestrador**: principal → subagente orquestrador →
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

| Profundidade | Formato da chave de sessão                  | Função                                        | Pode criar?                  |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principal                              | Sempre                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestrador quando profundidade 2 é permitida) | Somente se `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagente (trabalhador folha)             | Nunca                        |

### Cadeia de anúncio

Os resultados sobem pela cadeia:

1. Trabalhador de profundidade 2 termina → anuncia ao pai (orquestrador de profundidade 1).
2. Orquestrador de profundidade 1 recebe o anúncio, sintetiza resultados, termina → anuncia ao principal.
3. Agente principal recebe o anúncio e entrega ao usuário.

Cada nível vê apenas anúncios de seus filhos diretos.

<Note>
**Orientação operacional:** inicie o trabalho filho uma vez e aguarde eventos
de conclusão em vez de criar loops de sondagem em torno de `sessions_list`,
`sessions_history`, `/subagents list` ou comandos de espera `exec`.
`sessions_list` e `/subagents list` mantêm os relacionamentos de sessão filha
focados no trabalho ativo — filhos ativos permanecem anexados, filhos encerrados
continuam visíveis por uma janela recente curta, e links de filhos apenas no
armazenamento e obsoletos são ignorados depois de sua janela de atualidade. Isso
impede que metadados antigos `spawnedBy` / `parentSessionKey` ressuscitem filhos
fantasmas após a reinicialização. Se um evento de conclusão de filho chegar
depois que você já enviou a resposta final, o acompanhamento correto é o token
silencioso exato `NO_REPLY` / `no_reply`.
</Note>

### Política de ferramentas por profundidade

- O papel e o escopo de controle são gravados nos metadados da sessão no momento do spawn. Isso impede que chaves de sessão planas ou restauradas recuperem privilégios de orquestrador acidentalmente.
- **Profundidade 1 (orquestrador, quando `maxSpawnDepth >= 2`):** recebe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder gerenciar seus filhos. Outras ferramentas de sessão/sistema permanecem negadas.
- **Profundidade 1 (folha, quando `maxSpawnDepth == 1`):** nenhuma ferramenta de sessão (comportamento padrão atual).
- **Profundidade 2 (worker folha):** nenhuma ferramenta de sessão — `sessions_spawn` é sempre negado na profundidade 2. Não pode criar outros filhos.

### Limite de spawn por agente

Cada sessão de agente (em qualquer profundidade) pode ter no máximo `maxChildrenPerAgent`
(padrão `5`) filhos ativos ao mesmo tempo. Isso evita fan-out descontrolado
a partir de um único orquestrador.

### Parada em cascata

Parar um orquestrador de profundidade 1 interrompe automaticamente todos os seus
filhos de profundidade 2:

- `/stop` no chat principal para todos os agentes de profundidade 1 e aplica a cascata aos seus filhos de profundidade 2.
- `/subagents kill <id>` para um subagente específico e aplica a cascata aos seus filhos.
- `/subagents kill all` para todos os subagentes do solicitante e aplica a cascata.

## Autenticação

A autenticação de subagente é resolvida por **id do agente**, não por tipo de sessão:

- A chave de sessão do subagente é `agent:<agentId>:subagent:<uuid>`.
- O armazenamento de autenticação é carregado a partir do `agentDir` desse agente.
- Os perfis de autenticação do agente principal são mesclados como **fallback**; perfis do agente substituem perfis principais em conflitos.

A mesclagem é aditiva, portanto perfis principais estão sempre disponíveis como
fallbacks. Autenticação totalmente isolada por agente ainda não é compatível.

## Anúncio

Subagentes respondem por meio de uma etapa de anúncio:

- A etapa de anúncio roda dentro da sessão do subagente (não na sessão do solicitante).
- Se o subagente responder exatamente `ANNOUNCE_SKIP`, nada será publicado.
- Se o texto mais recente do assistente for o token silencioso exato `NO_REPLY` / `no_reply`, a saída de anúncio será suprimida mesmo que tenha havido progresso visível anterior.

A entrega depende da profundidade do solicitante:

- Sessões solicitantes de nível superior usam uma chamada `agent` de acompanhamento com entrega externa (`deliver=true`).
- Sessões de subagente solicitantes aninhadas recebem uma injeção interna de acompanhamento (`deliver=false`) para que o orquestrador possa sintetizar resultados dos filhos na sessão.
- Se uma sessão de subagente solicitante aninhada tiver desaparecido, o OpenClaw recorre ao solicitante dessa sessão quando disponível.

Para sessões solicitantes de nível superior, a entrega direta em modo de conclusão primeiro
resolve qualquer rota de conversa/thread vinculada e substituição de hook, depois preenche
campos de canal-alvo ausentes a partir da rota armazenada da sessão solicitante.
Isso mantém as conclusões no chat/tópico correto mesmo quando a origem da conclusão
identifica apenas o canal.

A agregação de conclusão dos filhos é limitada à execução atual do solicitante ao
criar descobertas de conclusão aninhadas, impedindo que saídas de filhos de execuções
anteriores vazem para o anúncio atual. Respostas de anúncio preservam o
roteamento de thread/tópico quando disponível em adaptadores de canal.

### Contexto de anúncio

O contexto de anúncio é normalizado para um bloco de evento interno estável:

| Campo          | Fonte                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Origem         | `subagent` ou `cron`                                                                                          |
| IDs de sessão  | Chave/id da sessão filha                                                                                      |
| Tipo           | Tipo de anúncio + rótulo da tarefa                                                                            |
| Status         | Derivado do resultado em runtime (`success`, `error`, `timeout` ou `unknown`) — **não** inferido do texto do modelo |
| Conteúdo do resultado | Texto visível mais recente do assistente; caso contrário, texto sanitizado mais recente de tool/toolResult |
| Acompanhamento | Instrução descrevendo quando responder vs. permanecer silencioso                                             |

Execuções terminais com falha relatam status de falha sem reproduzir o
texto de resposta capturado. Em timeout, se o filho só tiver avançado por chamadas de ferramenta,
o anúncio pode condensar esse histórico em um breve resumo de progresso parcial em vez
de reproduzir a saída bruta da ferramenta.

### Linha de estatísticas

Payloads de anúncio incluem uma linha de estatísticas ao final (mesmo quando encapsulados):

- Runtime (por exemplo, `runtime 5m12s`).
- Uso de tokens (entrada/saída/total).
- Custo estimado quando o preço do modelo está configurado (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` e caminho do transcrito para que o agente principal possa buscar o histórico via `sessions_history` ou inspecionar o arquivo em disco.

Metadados internos servem apenas para orquestração; respostas voltadas ao usuário
devem ser reescritas na voz normal do assistente.

### Por que preferir `sessions_history`

`sessions_history` é o caminho de orquestração mais seguro:

- A recordação do assistente é normalizada primeiro: tags de pensamento removidas; scaffolding de `<relevant-memories>` / `<relevant_memories>` removido; blocos de payload XML de chamadas de ferramenta em texto simples (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) removidos, incluindo payloads truncados que nunca fecham corretamente; scaffolding rebaixado de chamada/resultado de ferramenta e marcadores de contexto histórico removidos; tokens de controle do modelo vazados (`<|assistant|>`, outros ASCII `<|...|>`, largura completa `<｜...｜>`) removidos; XML malformado de chamada de ferramenta MiniMax removido.
- Texto semelhante a credencial/token é redigido.
- Blocos longos podem ser truncados.
- Históricos muito grandes podem descartar linhas antigas ou substituir uma linha grande demais por `[sessions_history omitted: message too large]`.
- A inspeção do transcrito bruto em disco é o fallback quando você precisa do transcrito completo byte a byte.

## Política de ferramentas

Subagentes usam primeiro o mesmo perfil e pipeline de política de ferramentas do pai ou
agente alvo. Depois disso, o OpenClaw aplica a camada de restrição de subagente.

Sem `tools.profile` restritivo, subagentes recebem **todas as ferramentas, exceto
ferramentas de sessão** e ferramentas do sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` também permanece aqui uma visão de recordação limitada e sanitizada —
não é um dump bruto do transcrito.

Quando `maxSpawnDepth >= 2`, subagentes orquestradores de profundidade 1 também
recebem `sessions_spawn`, `subagents`, `sessions_list` e
`sessions_history` para poderem gerenciar seus filhos.

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

`tools.subagents.tools.allow` é um filtro final somente de permissão. Ele pode restringir
o conjunto de ferramentas já resolvido, mas não pode **readicionar** uma ferramenta removida
por `tools.profile`. Por exemplo, `tools.profile: "coding"` inclui
`web_search`/`web_fetch`, mas não a ferramenta `browser`. Para permitir que
subagentes com perfil coding usem automação de navegador, adicione browser na
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
agente deve receber automação de navegador.

## Concorrência

Subagentes usam uma faixa dedicada de fila no processo:

- **Nome da faixa:** `subagent`
- **Concorrência:** `agents.defaults.subagents.maxConcurrent` (padrão `8`)

## Vivacidade e recuperação

OpenClaw não trata a ausência de `endedAt` como prova permanente de que um
subagente ainda está ativo. Execuções não encerradas mais antigas que a janela de execução obsoleta
deixam de contar como ativas/pendentes em `/subagents list`, resumos de status,
bloqueio de conclusão de descendentes e verificações de concorrência por sessão.

Após uma reinicialização do Gateway, execuções restauradas obsoletas e não encerradas são removidas, a menos que
a sessão filha esteja marcada como `abortedLastRun: true`. Essas
sessões filhas abortadas por reinicialização continuam recuperáveis por meio do fluxo de recuperação de órfãos de subagente,
que envia uma mensagem sintética de retomada antes de
limpar o marcador abortado.

A recuperação automática após reinicialização é limitada por sessão filha. Se o mesmo
filho de subagente for aceito para recuperação de órfão repetidamente dentro da
janela rápida de retravamento, o OpenClaw persiste uma lápide de recuperação nessa
sessão e para de retomá-la automaticamente em reinicializações posteriores. Execute
`openclaw tasks maintenance --apply` para reconciliar o registro da tarefa, ou
`openclaw doctor --fix` para limpar flags obsoletas de recuperação abortada em
sessões com lápide.

<Note>
Se um spawn de subagente falhar com Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, verifique o chamador RPC antes de editar o estado de pareamento.
A coordenação interna de `sessions_spawn` deve se conectar como
`client.id: "gateway-client"` com `client.mode: "backend"` sobre autenticação direta
de loopback com token/senha compartilhados; esse caminho não depende da
linha de base de escopo de dispositivo pareado da CLI. Chamadores remotos,
`deviceIdentity` explícito, caminhos explícitos de token de dispositivo e clientes
browser/node ainda precisam de aprovação normal do dispositivo para upgrades de escopo.
</Note>

## Interrupção

- Enviar `/stop` no chat solicitante aborta a sessão solicitante e interrompe quaisquer execuções de subagente ativas criadas a partir dela, aplicando cascata aos filhos aninhados.
- `/subagents kill <id>` para um subagente específico e aplica a cascata aos seus filhos.

## Limitações

- O anúncio de subagente é **best-effort**. Se o Gateway reiniciar, o trabalho pendente de "anunciar de volta" será perdido.
- Subagentes ainda compartilham os mesmos recursos do processo Gateway; trate `maxConcurrent` como uma válvula de segurança.
- `sessions_spawn` é sempre não bloqueante: retorna `{ status: "accepted", runId, childSessionKey }` imediatamente.
- O contexto do subagente injeta apenas `AGENTS.md`, `TOOLS.md`, `SOUL.md`, `IDENTITY.md` e `USER.md` (sem `MEMORY.md`, `HEARTBEAT.md` ou `BOOTSTRAP.md`).
- A profundidade máxima de aninhamento é 5 (intervalo de `maxSpawnDepth`: 1–5). A profundidade 2 é recomendada para a maioria dos casos de uso.
- `maxChildrenPerAgent` limita filhos ativos por sessão (padrão `5`, intervalo `1–20`).

## Relacionados

- [Agentes ACP](/pt-BR/tools/acp-agents)
- [Envio de agente](/pt-BR/tools/agent-send)
- [Tarefas em segundo plano](/pt-BR/automation/tasks)
- [Ferramentas de sandbox multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
