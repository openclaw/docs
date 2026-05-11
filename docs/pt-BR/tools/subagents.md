---
read_when:
    - Você quer trabalho em segundo plano ou em paralelo via agente
    - Você está alterando sessions_spawn ou a política da ferramenta de subagente
    - Você está implementando ou solucionando problemas de sessões de subagentes vinculadas a threads
sidebarTitle: Sub-agents
summary: Inicie execuções isoladas de agentes em segundo plano que anunciam os resultados de volta ao chat do solicitante
title: Subagentes
x-i18n:
    generated_at: "2026-05-11T20:38:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02b03bdfd5cddf5618fddf0804f017400c36751095166dac18fa35fa3bfd4c6e
    source_path: tools/subagents.md
    workflow: 16
---

Subagentes são execuções de agentes em segundo plano iniciadas a partir de uma execução de agente existente.
Eles rodam em sua própria sessão (`agent:<agentId>:subagent:<uuid>`) e,
quando terminam, **anunciam** seu resultado de volta ao canal de chat do
solicitante. Cada execução de subagente é rastreada como uma
[tarefa em segundo plano](/pt-BR/automation/tasks).

Objetivos principais:

- Paralelizar trabalho de "pesquisa / tarefa longa / ferramenta lenta" sem bloquear a execução principal.
- Manter subagentes isolados por padrão (separação de sessão + sandboxing opcional).
- Manter a superfície de ferramentas difícil de usar incorretamente: subagentes **não** recebem ferramentas de sessão por padrão.
- Dar suporte a profundidade de aninhamento configurável para padrões de orquestrador.

<Note>
**Nota de custo:** cada subagente tem seu próprio contexto e uso de tokens por
padrão. Para tarefas pesadas ou repetitivas, defina um modelo mais barato para subagentes
e mantenha seu agente principal em um modelo de maior qualidade. Configure via
`agents.defaults.subagents.model` ou substituições por agente. Quando um filho
    realmente precisa da transcrição atual do solicitante, o agente pode solicitar
    `context: "fork"` nessa criação específica. Sessões de subagente vinculadas a thread usam
    `context: "fork"` por padrão porque ramificam a conversa atual em uma
    thread de acompanhamento.
</Note>

## Comando de barra

Use `/subagents` para inspecionar ou controlar execuções de subagentes para a **sessão
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

Use [`/steer <message>`](/pt-BR/tools/steer) no nível superior para orientar a execução ativa da sessão solicitante atual. Use `/subagents steer <id|#> <message>` quando o destino for uma execução filha.

`/subagents info` mostra metadados de execução (status, carimbos de data/hora, id da sessão,
caminho da transcrição, limpeza). Use `sessions_history` para uma visualização de recordação limitada
e filtrada por segurança; inspecione o caminho da transcrição no disco quando você
precisar da transcrição bruta completa.

### Controles de vínculo de thread

Estes comandos funcionam em canais que dão suporte a vínculos persistentes de thread.
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
retransmissor interno) e envia uma atualização final de conclusão de volta ao
chat do solicitante quando a execução termina.

<AccordionGroup>
  <Accordion title="Conclusão não bloqueante e baseada em push">
    - O comando de criação não bloqueia; ele retorna um id de execução imediatamente.
    - Na conclusão, o subagente anuncia uma mensagem de resumo/resultado de volta ao canal de chat do solicitante.
    - Turnos de agente que precisam de resultados filhos devem chamar `sessions_yield` depois de criar o trabalho necessário. Isso encerra o turno atual e permite que eventos de conclusão cheguem como a próxima mensagem visível ao modelo.
    - A conclusão é baseada em push. Depois de criado, **não** consulte `/subagents list`, `sessions_list` ou `sessions_history` em um loop apenas para esperar que ele termine; inspecione o status somente sob demanda para depuração ou intervenção.
    - A saída filha é um relatório/evidência para o agente solicitante sintetizar. Ela não é texto de instrução criado pelo usuário e não pode substituir políticas de sistema, desenvolvedor ou usuário.
    - Na conclusão, o OpenClaw faz o melhor esforço para fechar abas/processos de navegador rastreados abertos por essa sessão de subagente antes que o fluxo de limpeza do anúncio continue.

  </Accordion>
  <Accordion title="Resiliência de entrega por criação manual">
    - O OpenClaw devolve conclusões à sessão solicitante por meio de um turno `agent` com uma chave de idempotência estável.
    - Se a execução solicitante ainda estiver ativa, o OpenClaw primeiro tenta despertar/orientar essa execução em vez de iniciar um segundo caminho de resposta visível.
    - Se a passagem de conclusão para o agente solicitante falhar ou não produzir saída visível, o OpenClaw trata a entrega como falha e recorre a roteamento por fila/nova tentativa. Ele não envia diretamente o resultado filho bruto ao chat externo.
    - Se a passagem direta não puder ser usada, ele recorre ao roteamento por fila.
    - Se o roteamento por fila ainda não estiver disponível, o anúncio é tentado novamente com um curto backoff exponencial antes da desistência final.
    - A entrega de conclusão mantém a rota resolvida do solicitante: rotas de conclusão vinculadas a thread ou vinculadas a conversa vencem quando disponíveis; se a origem da conclusão fornecer apenas um canal, o OpenClaw preenche o destino/conta ausente a partir da rota resolvida da sessão solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que a entrega direta ainda funcione.

  </Accordion>
  <Accordion title="Metadados de passagem de conclusão">
    A passagem de conclusão para a sessão solicitante é contexto interno gerado em runtime
    (não texto criado pelo usuário) e inclui:

    - `Result` — texto mais recente de resposta `assistant` visível; caso contrário, o texto mais recente saneado de ferramenta/toolResult. Execuções finais com falha não reutilizam texto de resposta capturado.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Estatísticas compactas de runtime/tokens.
    - Uma instrução de entrega dizendo ao agente solicitante para reescrever na voz normal de assistente (não encaminhar metadados internos brutos).

  </Accordion>
  <Accordion title="Modos e runtime ACP">
    - `--model` e `--thinking` substituem os padrões para essa execução específica.
    - Use `info`/`log` para inspecionar detalhes e saída após a conclusão.
    - `/subagents spawn` é modo de disparo único (`mode: "run"`). Para sessões persistentes vinculadas a thread, use `sessions_spawn` com `thread: true` e `mode: "session"`.
    - Para sessões de harness ACP (Claude Code, Gemini CLI, OpenCode ou Codex ACP/acpx explícito), use `sessions_spawn` com `runtime: "acp"` quando a ferramenta anunciar esse runtime. Veja [Modelo de entrega ACP](/pt-BR/tools/acp-agents#delivery-model) ao depurar conclusões ou loops agente-para-agente. Quando o plugin `codex` estiver habilitado, o controle de chat/thread do Codex deve preferir `/codex ...` em vez de ACP, a menos que o usuário peça explicitamente ACP/acpx.
    - O OpenClaw oculta `runtime: "acp"` até que ACP esteja habilitado, o solicitante não esteja em sandbox e um plugin de backend como `acpx` esteja carregado. `runtime: "acp"` espera um id externo de harness ACP ou uma entrada `agents.list[]` com `runtime.type="acp"`; use o runtime padrão de subagente para agentes normais de configuração do OpenClaw vindos de `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Subagentes nativos começam isolados, a menos que o chamador peça explicitamente para bifurcar
a transcrição atual.

| Modo       | Quando usar                                                                                                                            | Comportamento                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Pesquisa nova, implementação independente, trabalho de ferramenta lenta ou qualquer coisa que possa ser resumida no texto da tarefa     | Cria uma transcrição filha limpa. Este é o padrão e mantém o uso de tokens menor. |
| `fork`     | Trabalho que depende da conversa atual, de resultados anteriores de ferramentas ou de instruções sutis já presentes na transcrição do solicitante | Ramifica a transcrição do solicitante na sessão filha antes que o filho comece. |

Use `fork` com parcimônia. Ele é para delegação sensível ao contexto, não um
substituto para escrever um prompt de tarefa claro.

## Ferramenta: `sessions_spawn`

Inicia uma execução de subagente com `deliver: false` na faixa global `subagent`,
depois executa uma etapa de anúncio e publica a resposta de anúncio no canal
de chat do solicitante.

A disponibilidade depende da política efetiva de ferramentas do chamador. Os perfis `coding` e
`full` expõem `sessions_spawn` por padrão. O perfil `messaging`
não expõe; adicione `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` ou use `tools.profile: "coding"` para agentes que devem delegar
trabalho. Políticas de canal/grupo, provedor, sandbox e allow/deny por agente ainda podem
remover a ferramenta depois do estágio de perfil. Use `/tools` na mesma
sessão para confirmar a lista efetiva de ferramentas.

**Padrões:**

- **Modelo:** herda do chamador, a menos que você defina `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` por agente); um `sessions_spawn.model` explícito ainda vence.
- **Thinking:** herda do chamador, a menos que você defina `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` por agente); um `sessions_spawn.thinking` explícito ainda vence.
- **Tempo limite de execução:** se `sessions_spawn.runTimeoutSeconds` for omitido, o OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário, volta para `0` (sem tempo limite).

### Modo de prompt de delegação

`agents.defaults.subagents.delegationMode` controla apenas a orientação do prompt; ele não altera a política de ferramentas nem impõe delegação.

- `suggest` (padrão): mantém o incentivo padrão do prompt para usar subagentes em trabalhos maiores ou mais lentos.
- `prefer`: diz ao agente principal para permanecer responsivo e delegar qualquer coisa mais envolvida que uma resposta direta por meio de `sessions_spawn`.

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
  Identificador estável opcional para direcionamento posterior de `subagents`. Deve corresponder a `[a-z][a-z0-9_]{0,63}` e não pode ser um alvo reservado, como `last` ou `all`. Prefira usá-lo quando o coordenador puder precisar direcionar, encerrar ou identificar um filho específico após gerar vários filhos.
</ParamField>
<ParamField path="label" type="string">
  Rótulo opcional legível por humanos.
</ParamField>
<ParamField path="agentId" type="string">
  Gera sob outro id de agente quando permitido por `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` é apenas para harnesses ACP externos (`claude`, `droid`, `gemini`, `opencode` ou Codex ACP/acpx solicitado explicitamente) e para entradas `agents.list[]` cujo `runtime.type` é `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Somente ACP. Retoma uma sessão existente de harness ACP quando `runtime: "acp"`; ignorado para gerações nativas de subagentes.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Somente ACP. Transmite a saída da execução ACP para a sessão pai quando `runtime: "acp"`; omita para gerações nativas de subagentes.
</ParamField>
<ParamField path="model" type="string">
  Substitui o modelo do subagente. Valores inválidos são ignorados e o subagente executa no modelo padrão com um aviso no resultado da ferramenta.
</ParamField>
<ParamField path="thinking" type="string">
  Substitui o nível de raciocínio para a execução do subagente.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  O padrão é `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário, `0`. Quando definido, a execução do subagente é abortada após N segundos.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Quando `true`, solicita vinculação de thread do canal para esta sessão de subagente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Se `thread: true` e `mode` for omitido, o padrão se torna `session`. `mode: "session"` exige `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` arquiva imediatamente após o anúncio (ainda mantém a transcrição por renomeação).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rejeita a geração a menos que o runtime filho de destino esteja em sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` ramifica a transcrição atual do solicitante para a sessão filha. Apenas subagentes nativos. Gerações vinculadas a thread usam `fork` por padrão; gerações sem thread usam `isolated` por padrão.
</ParamField>

<Warning>
`sessions_spawn` **não** aceita parâmetros de entrega por canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Para entrega, use
`message`/`sessions_send` a partir da execução gerada.
</Warning>

### Nomes de tarefa e direcionamento

`taskName` é um identificador voltado ao modelo para orquestração, não uma chave de sessão.
Use-o para nomes estáveis de filhos, como `review_subagents`,
`linux_validation` ou `docs_update`, quando um coordenador puder precisar direcionar
ou encerrar esse filho posteriormente.

A resolução de alvo aceita correspondências exatas de `taskName` e
prefixos inequívocos. A correspondência é limitada à mesma janela de alvos
ativos/recentes usada por alvos `/subagents` numerados, portanto um filho
concluído obsoleto não torna ambíguo um identificador reutilizado. Se dois filhos
ativos ou recentes compartilham o mesmo `taskName`, o alvo é ambíguo; use o índice
da lista, a chave de sessão ou o id da execução em vez disso.

Os alvos reservados `last` e `all` não são valores válidos de `taskName`
porque já têm significados de controle.

## Ferramenta: `sessions_yield`

Encerra o turno atual do modelo e aguarda eventos de runtime, principalmente
eventos de conclusão de subagentes, chegarem como a próxima mensagem. Use-a após
gerar trabalho filho obrigatório quando o solicitante não puder produzir uma
resposta final até que essas conclusões cheguem.

`sessions_yield` é a primitiva de espera. Não a substitua por loops de sondagem
sobre `subagents`, `sessions_list`, `sessions_history`, `sleep` no shell
ou sondagem de processos apenas para detectar a conclusão de filhos.

Use `sessions_yield` somente quando a lista efetiva de ferramentas da sessão a incluir.
Alguns perfis de ferramentas mínimos ou personalizados podem expor `sessions_spawn` e
`subagents` sem expor `sessions_yield`; nesse caso, não invente um loop de sondagem
apenas para aguardar a conclusão.

Quando há filhos ativos, o OpenClaw injeta um bloco de prompt compacto gerado pelo runtime
`Active Subagents` em turnos normais para que o solicitante possa ver
as sessões filhas atuais, ids de execução, status, rótulos, tarefas e
aliases `taskName` sem sondagem. Os campos de tarefa e rótulo nesse
bloco são citados como dados, não instruções, porque podem se originar
de argumentos de geração fornecidos por usuário/modelo.

## Ferramenta: `subagents`

Lista, direciona ou encerra execuções de subagentes geradas e pertencentes à sessão
solicitante. Seu escopo é o solicitante atual; um filho só pode
ver/controlar seus próprios filhos controlados.

Use `subagents` para status sob demanda, depuração, direcionamento ou encerramento.
Use `sessions_yield` para aguardar eventos de conclusão.

## Sessões vinculadas a thread

Quando vinculações de thread estão habilitadas para um canal, um subagente pode permanecer vinculado
a uma thread para que mensagens de acompanhamento do usuário nessa thread continuem sendo roteadas
para a mesma sessão de subagente.

### Canais com suporte a thread

**Discord** é atualmente o único canal com suporte. Ele oferece suporte a
sessões persistentes de subagentes vinculadas a thread (`sessions_spawn` com
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
    O OpenClaw cria ou vincula uma thread a esse alvo de sessão no canal ativo.
  </Step>
  <Step title="Rotear acompanhamentos">
    Respostas e mensagens de acompanhamento nessa thread são roteadas para a sessão vinculada.
  </Step>
  <Step title="Inspecionar tempos limite">
    Use `/session idle` para inspecionar/atualizar o auto-desfoco por inatividade e
    `/session max-age` para controlar o limite rígido.
  </Step>
  <Step title="Desvincular">
    Use `/unfocus` para desvincular manualmente.
  </Step>
</Steps>

### Controles manuais

| Comando            | Efeito                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Vincula a thread atual (ou cria uma) a um alvo de subagente/sessão |
| `/unfocus`         | Remove a vinculação da thread atualmente vinculada                       |
| `/agents`          | Lista execuções ativas e estado de vinculação (`thread:<id>` ou `unbound`)       |
| `/session idle`    | Inspeciona/atualiza o auto-desfoco por inatividade (apenas threads vinculadas em foco)         |
| `/session max-age` | Inspeciona/atualiza o limite rígido (apenas threads vinculadas em foco)                  |

### Chaves de configuração

- **Padrão global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Chaves de sobrescrita de canal e vinculação automática na geração** são específicas do adaptador. Consulte [Canais com suporte a thread](#thread-supporting-channels) acima.

Consulte [Referência de configuração](/pt-BR/gateway/configuration-reference) e
[Comandos de barra](/pt-BR/tools/slash-commands) para detalhes atuais do adaptador.

### Lista de permissões

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de ids de agente que podem ser direcionados via `agentId` explícito (`["*"]` permite qualquer um). Padrão: apenas o agente solicitante. Se você definir uma lista e ainda quiser que o solicitante gere a si mesmo com `agentId`, inclua o id do solicitante na lista.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista de permissões padrão de agente de destino usada quando o agente solicitante não define seu próprio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloqueia chamadas `sessions_spawn` que omitem `agentId` (força seleção explícita de perfil). Sobrescrita por agente: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Tempo limite por chamada para tentativas de entrega de anúncio `agent` do Gateway. Os valores são milissegundos inteiros positivos e são limitados ao máximo de temporizador seguro da plataforma. Novas tentativas transitórias podem tornar a espera total pelo anúncio maior que um tempo limite configurado.
</ParamField>

Se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeita alvos
que seriam executados sem sandbox.

### Descoberta

Use `agents_list` para ver quais ids de agente estão permitidos atualmente para
`sessions_spawn`. A resposta inclui o modelo efetivo de cada agente listado
e metadados de runtime incorporados para que chamadores possam distinguir PI, servidor de app Codex
e outros runtimes nativos configurados.

### Autoarquivamento

- Sessões de subagentes são arquivadas automaticamente após `agents.defaults.subagents.archiveAfterMinutes` (padrão `60`).
- O arquivamento usa `sessions.delete` e renomeia a transcrição para `*.deleted.<timestamp>` (mesma pasta).
- `cleanup: "delete"` arquiva imediatamente após o anúncio (ainda mantém a transcrição por renomeação).
- O autoarquivamento é de melhor esforço; temporizadores pendentes são perdidos se o Gateway reiniciar.
- `runTimeoutSeconds` **não** autoarquiva; ele apenas interrompe a execução. A sessão permanece até o autoarquivamento.
- O autoarquivamento se aplica igualmente a sessões de profundidade 1 e profundidade 2.
- A limpeza do navegador é separada da limpeza de arquivamento: abas/processos de navegador rastreados são fechados em melhor esforço quando a execução termina, mesmo que o registro de transcrição/sessão seja mantido.

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
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### Níveis de profundidade

| Profundidade | Formato da chave de sessão                    | Função                                        | Pode gerar?                  |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principal                              | Sempre                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestrador quando profundidade 2 permitida) | Somente se `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagente (trabalhador folha)             | Nunca                        |

### Cadeia de anúncios

Os resultados fluem de volta pela cadeia:

1. Trabalhador de profundidade 2 termina → anuncia para seu pai (orquestrador de profundidade 1).
2. Orquestrador de profundidade 1 recebe o anúncio, sintetiza resultados, termina → anuncia para o principal.
3. Agente principal recebe o anúncio e entrega ao usuário.

Cada nível vê apenas anúncios de seus filhos diretos.

<Note>
**Orientação operacional:** inicie o trabalho filho uma vez e aguarde os
eventos de conclusão em vez de criar loops de sondagem em torno de
`sessions_list`, `sessions_history`, `/subagents list` ou comandos `exec`
com sleep. `sessions_list` e `/subagents list` mantêm os relacionamentos
de sessão filha focados no trabalho ativo — filhos ativos permanecem
anexados, filhos encerrados continuam visíveis por uma breve janela
recente, e links de filhos obsoletos existentes apenas no armazenamento
são ignorados após sua janela de validade. Isso impede que metadados
antigos de `spawnedBy` / `parentSessionKey` ressuscitem filhos fantasma
após a reinicialização. Se um evento de conclusão de filho chegar depois
de você já ter enviado a resposta final, o acompanhamento correto é o
token silencioso exato `NO_REPLY` / `no_reply`.
</Note>

### Política de ferramentas por profundidade

- O papel e o escopo de controle são gravados nos metadados da sessão no momento do spawn. Isso impede que chaves de sessão planas ou restauradas recuperem acidentalmente privilégios de orquestrador.
- **Profundidade 1 (orquestrador, quando `maxSpawnDepth >= 2`):** recebe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder gerenciar seus filhos. Outras ferramentas de sessão/sistema permanecem negadas.
- **Profundidade 1 (folha, quando `maxSpawnDepth == 1`):** sem ferramentas de sessão (comportamento padrão atual).
- **Profundidade 2 (worker folha):** sem ferramentas de sessão — `sessions_spawn` é sempre negado na profundidade 2. Não pode gerar mais filhos.

### Limite de spawn por agente

Cada sessão de agente (em qualquer profundidade) pode ter no máximo
`maxChildrenPerAgent` (padrão `5`) filhos ativos ao mesmo tempo. Isso
impede fan-out descontrolado a partir de um único orquestrador.

### Parada em cascata

Parar um orquestrador de profundidade 1 para automaticamente todos os seus
filhos de profundidade 2:

- `/stop` no chat principal para todos os agentes de profundidade 1 e propaga para seus filhos de profundidade 2.
- `/subagents kill <id>` para um subagente específico e propaga para seus filhos.
- `/subagents kill all` para todos os subagentes do solicitante e propaga.

## Autenticação

A autenticação do subagente é resolvida por **id do agente**, não pelo tipo de sessão:

- A chave de sessão do subagente é `agent:<agentId>:subagent:<uuid>`.
- O armazenamento de autenticação é carregado a partir do `agentDir` desse agente.
- Os perfis de autenticação do agente principal são mesclados como **fallback**; perfis do agente sobrescrevem perfis principais em conflitos.

A mesclagem é aditiva, portanto os perfis principais estão sempre
disponíveis como fallbacks. Autenticação totalmente isolada por agente
ainda não é compatível.

## Anúncio

Subagentes retornam via uma etapa de anúncio:

- A etapa de anúncio é executada dentro da sessão do subagente (não na sessão do solicitante).
- Se o subagente responder exatamente `ANNOUNCE_SKIP`, nada será publicado.
- Se o texto mais recente do assistente for o token silencioso exato `NO_REPLY` / `no_reply`, a saída do anúncio será suprimida mesmo que tenha existido progresso visível anterior.

A entrega depende da profundidade do solicitante:

- Sessões solicitantes de nível superior usam uma chamada `agent` de acompanhamento com entrega externa (`deliver=true`).
- Sessões de subagente solicitantes aninhadas recebem uma injeção interna de acompanhamento (`deliver=false`) para que o orquestrador possa sintetizar resultados filhos dentro da sessão.
- Se uma sessão de subagente solicitante aninhada tiver desaparecido, o OpenClaw recorre ao solicitante dessa sessão quando disponível.

Para sessões solicitantes de nível superior, a entrega direta em modo de
conclusão primeiro resolve qualquer rota vinculada de conversa/thread e
sobrescrita de hook, depois preenche campos ausentes de channel-target a
partir da rota armazenada da sessão solicitante. Isso mantém as conclusões
no chat/tópico correto mesmo quando a origem da conclusão identifica
apenas o canal.

A agregação de conclusões de filhos é limitada à execução atual do
solicitante ao criar descobertas de conclusão aninhadas, impedindo que
saídas de filhos de execuções anteriores obsoletas vazem para o anúncio
atual. Respostas de anúncio preservam roteamento de thread/tópico quando
disponível nos adaptadores de canal.

### Contexto de anúncio

O contexto de anúncio é normalizado para um bloco de evento interno estável:

| Campo          | Origem                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Origem         | `subagent` ou `cron`                                                                                          |
| IDs de sessão  | Chave/id da sessão filha                                                                                      |
| Tipo           | Tipo de anúncio + rótulo da tarefa                                                                            |
| Status         | Derivado do resultado de runtime (`success`, `error`, `timeout` ou `unknown`) — **não** inferido do texto do modelo |
| Conteúdo do resultado | Texto visível mais recente do assistente; caso contrário, texto de tool/toolResult mais recente sanitizado |
| Acompanhamento | Instrução que descreve quando responder vs permanecer em silêncio                                             |

Execuções terminais com falha relatam status de falha sem reproduzir o
texto de resposta capturado. Em timeout, se o filho passou apenas por
chamadas de ferramentas, o anúncio pode condensar esse histórico em um
breve resumo de progresso parcial em vez de reproduzir a saída bruta da
ferramenta.

### Linha de estatísticas

Payloads de anúncio incluem uma linha de estatísticas no final (mesmo quando quebrada):

- Runtime (por exemplo, `runtime 5m12s`).
- Uso de tokens (entrada/saída/total).
- Custo estimado quando o preço do modelo está configurado (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` e caminho do transcript para que o agente principal possa buscar o histórico via `sessions_history` ou inspecionar o arquivo em disco.

Metadados internos servem apenas para orquestração; respostas voltadas ao
usuário devem ser reescritas na voz normal do assistente.

### Por que preferir `sessions_history`

`sessions_history` é o caminho de orquestração mais seguro:

- A recordação do assistente é normalizada primeiro: tags de raciocínio removidas; scaffolding de `<relevant-memories>` / `<relevant_memories>` removido; blocos de payload XML de chamada de ferramenta em texto puro (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) removidos, incluindo payloads truncados que nunca fecham corretamente; scaffolding rebaixado de chamada/resultado de ferramenta e marcadores de contexto histórico removidos; tokens de controle de modelo vazados (`<|assistant|>`, outros `<|...|>` ASCII, `<｜...｜>` de largura total) removidos; XML malformado de chamada de ferramenta MiniMax removido.
- Texto semelhante a credenciais/tokens é redigido.
- Blocos longos podem ser truncados.
- Históricos muito grandes podem descartar linhas mais antigas ou substituir uma linha grande demais por `[sessions_history omitted: message too large]`.
- A inspeção do transcript bruto em disco é o fallback quando você precisa do transcript completo byte a byte.

## Política de ferramentas

Subagentes usam primeiro o mesmo pipeline de perfil e política de
ferramentas do agente pai ou alvo. Depois disso, o OpenClaw aplica a camada
de restrição de subagente.

Sem um `tools.profile` restritivo, subagentes recebem **todas as
ferramentas exceto ferramentas de sessão** e ferramentas de sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` também permanece aqui uma visualização de recordação
limitada e sanitizada — não é um dump de transcript bruto.

Quando `maxSpawnDepth >= 2`, subagentes orquestradores de profundidade 1
também recebem `sessions_spawn`, `subagents`, `sessions_list` e
`sessions_history` para poder gerenciar seus filhos.

### Sobrescrita via configuração

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

`tools.subagents.tools.allow` é um filtro final somente de permissão. Ele
pode restringir o conjunto de ferramentas já resolvido, mas não pode
**adicionar de volta** uma ferramenta removida por `tools.profile`. Por
exemplo, `tools.profile: "coding"` inclui `web_search`/`web_fetch`, mas
não a ferramenta `browser`. Para permitir que subagentes com perfil coding
usem automação de navegador, adicione browser na etapa de perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Use `agents.list[].tools.alsoAllow: ["browser"]` por agente quando apenas
um agente deve receber automação de navegador.

## Concorrência

Subagentes usam uma lane de fila dedicada em processo:

- **Nome da lane:** `subagent`
- **Concorrência:** `agents.defaults.subagents.maxConcurrent` (padrão `8`)

## Vivacidade e recuperação

O OpenClaw não trata a ausência de `endedAt` como prova permanente de que
um subagente ainda está ativo. Execuções não encerradas mais antigas que a
janela de execução obsoleta deixam de contar como ativas/pendentes em
`/subagents list`, resumos de status, bloqueio de conclusão de
descendentes e verificações de concorrência por sessão.

Após uma reinicialização do gateway, execuções restauradas obsoletas e não
encerradas são podadas, a menos que sua sessão filha esteja marcada como
`abortedLastRun: true`. Essas sessões filhas abortadas pela reinicialização
permanecem recuperáveis pelo fluxo de recuperação de órfãos de subagente,
que envia uma mensagem sintética de retomada antes de limpar o marcador
abortado.

A recuperação automática após reinicialização é limitada por sessão filha.
Se o mesmo filho de subagente for aceito para recuperação de órfão
repetidamente dentro da janela rápida de novo travamento, o OpenClaw
persiste uma tombstone de recuperação nessa sessão e para de retomá-la
automaticamente em reinicializações posteriores. Execute
`openclaw tasks maintenance --apply` para reconciliar o registro da tarefa,
ou `openclaw doctor --fix` para limpar flags obsoletas de recuperação
abortada em sessões com tombstone.

<Note>
Se um spawn de subagente falhar com Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, verifique o chamador RPC antes de editar o estado de
pareamento. A coordenação interna de `sessions_spawn` deve se conectar
como `client.id: "gateway-client"` com `client.mode: "backend"` sobre
autenticação direta via loopback com token/senha compartilhado; esse
caminho não depende da linha de base de escopo de dispositivo pareado da
CLI. Chamadores remotos, `deviceIdentity` explícito, caminhos explícitos
de token de dispositivo e clientes browser/node ainda precisam de
aprovação normal de dispositivo para upgrades de escopo.
</Note>

## Parada

- Enviar `/stop` no chat solicitante aborta a sessão solicitante e para quaisquer execuções de subagente ativas geradas a partir dela, propagando para filhos aninhados.
- `/subagents kill <id>` para um subagente específico e propaga para seus filhos.

## Limitações

- O anúncio de subagente é de **melhor esforço**. Se o gateway reiniciar, o trabalho pendente de "anunciar de volta" será perdido.
- Subagentes ainda compartilham os mesmos recursos do processo gateway; trate `maxConcurrent` como uma válvula de segurança.
- `sessions_spawn` é sempre não bloqueante: retorna `{ status: "accepted", runId, childSessionKey }` imediatamente.
- O contexto de subagente injeta apenas `AGENTS.md`, `TOOLS.md`, `SOUL.md`, `IDENTITY.md` e `USER.md` (sem `MEMORY.md`, `HEARTBEAT.md` ou `BOOTSTRAP.md`).
- A profundidade máxima de aninhamento é 5 (intervalo de `maxSpawnDepth`: 1–5). A profundidade 2 é recomendada para a maioria dos casos de uso.
- `maxChildrenPerAgent` limita filhos ativos por sessão (padrão `5`, intervalo `1–20`).

## Relacionados

- [Agentes ACP](/pt-BR/tools/acp-agents)
- [Envio de agente](/pt-BR/tools/agent-send)
- [Tarefas em segundo plano](/pt-BR/automation/tasks)
- [Ferramentas de sandbox multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
