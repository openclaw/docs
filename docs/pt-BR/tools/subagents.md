---
read_when:
    - Você quer trabalho em segundo plano ou paralelo via agente
    - Você está alterando a política de sessions_spawn ou da ferramenta de subagente
    - Você está implementando ou solucionando problemas de sessões de subagentes vinculadas a threads
sidebarTitle: Sub-agents
summary: Inicie execuções isoladas de agentes em segundo plano que anunciam os resultados de volta no chat do solicitante
title: Subagentes
x-i18n:
    generated_at: "2026-06-27T18:19:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf8b819b1bb478c5161a7493f6a806aefb8df252e6c3d9faeee94a66689a5f5f
    source_path: tools/subagents.md
    workflow: 16
---

Subagentes são execuções de agente em segundo plano geradas a partir de uma execução de agente existente.
Eles rodam em sua própria sessão (`agent:<agentId>:subagent:<uuid>`) e,
quando terminam, **anunciam** seu resultado de volta ao canal de chat
solicitante. Cada execução de subagente é rastreada como uma
[tarefa em segundo plano](/pt-BR/automation/tasks).

Objetivos principais:

- Paralelizar trabalho de "pesquisa / tarefa longa / ferramenta lenta" sem bloquear a execução principal.
- Manter subagentes isolados por padrão (separação de sessão + sandboxing opcional).
- Manter a superfície de ferramentas difícil de usar incorretamente: subagentes **não** recebem ferramentas de sessão por padrão.
- Oferecer suporte a profundidade de aninhamento configurável para padrões de orquestrador.

<Note>
**Observação de custo:** cada subagente tem seu próprio contexto e uso de tokens por
padrão. Para tarefas pesadas ou repetitivas, defina um modelo mais barato para subagentes
e mantenha seu agente principal em um modelo de maior qualidade. Configure via
`agents.defaults.subagents.model` ou substituições por agente. Quando um filho
    realmente precisa da transcrição atual do solicitante, o agente pode solicitar
    `context: "fork"` naquela geração específica. Sessões de subagente vinculadas a thread usam
    `context: "fork"` por padrão porque ramificam a conversa atual em uma
    thread de acompanhamento.
</Note>

## Comando de barra

Use `/subagents` para inspecionar execuções de subagente da **sessão atual**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` mostra metadados da execução (status, carimbos de data/hora, id de sessão,
caminho da transcrição, limpeza). Use `sessions_history` para uma visão de recuperação limitada e
filtrada por segurança; inspecione o caminho da transcrição no disco quando você
precisar da transcrição completa bruta.

### Controles de vinculação de thread

Estes comandos funcionam em canais que oferecem suporte a vinculações de thread persistentes.
Veja [Canais compatíveis com thread](#thread-supporting-channels) abaixo.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamento de geração

Agentes iniciam subagentes em segundo plano com `sessions_spawn`. Conclusões de subagente
retornam como eventos internos da sessão pai; o agente pai/solicitante decide
se uma atualização visível ao usuário é necessária.

<AccordionGroup>
  <Accordion title="Conclusão não bloqueante baseada em push">
    - `sessions_spawn` não bloqueia; ele retorna um id de execução imediatamente.
    - Na conclusão, o subagente informa de volta à sessão pai/solicitante.
    - Turnos de agente que precisam de resultados filhos devem chamar `sessions_yield` depois de gerar o trabalho necessário. Isso encerra o turno atual e permite que eventos de conclusão cheguem como a próxima mensagem visível ao modelo.
    - A conclusão é baseada em push. Depois de gerado, **não** consulte `/subagents list`, `sessions_list` ou `sessions_history` em loop apenas para esperar que termine; inspecione o status apenas sob demanda para visibilidade de depuração.
    - A saída do filho é um relatório/evidência para o agente solicitante sintetizar. Ela não é texto de instrução de autoria do usuário e não pode substituir políticas de sistema, desenvolvedor ou usuário.
    - Na conclusão, o OpenClaw fecha, em melhor esforço, abas/processos de navegador rastreados abertos por essa sessão de subagente antes que o fluxo de limpeza do anúncio continue.

  </Accordion>
  <Accordion title="Entrega de conclusão">
    - O OpenClaw entrega conclusões de volta à sessão solicitante por meio de um turno `agent` com uma chave de idempotência estável.
    - Se a execução solicitante ainda estiver ativa, o OpenClaw primeiro tenta acordar/direcionar essa execução em vez de iniciar um segundo caminho de resposta visível.
    - Se um solicitante ativo não puder ser acordado, o OpenClaw recorre a uma transferência para o agente solicitante com o mesmo contexto de conclusão em vez de descartar o anúncio.
    - Uma transferência pai bem-sucedida conclui a entrega do subagente mesmo quando o pai decide que nenhuma atualização visível ao usuário é necessária.
    - Subagentes nativos não recebem a ferramenta de mensagem. Eles retornam texto simples de assistente ao agente pai/solicitante; respostas visíveis a humanos pertencem à política de entrega normal do agente pai/solicitante.
    - Se a transferência direta não puder ser usada, ela recorre ao roteamento por fila.
    - Se o roteamento por fila ainda não estiver disponível, o anúncio é tentado novamente com um recuo exponencial curto antes da desistência final.
    - A entrega de conclusão mantém a rota solicitante resolvida: rotas de conclusão vinculadas a thread ou vinculadas a conversa prevalecem quando disponíveis; se a origem da conclusão fornece apenas um canal, o OpenClaw preenche o alvo/conta ausente a partir da rota resolvida da sessão solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que a entrega direta ainda funcione.

  </Accordion>
  <Accordion title="Metadados de transferência de conclusão">
    A transferência de conclusão para a sessão solicitante é contexto interno gerado em tempo de execução
    (não texto de autoria do usuário) e inclui:

    - `Result` — o texto da resposta `assistant` visível mais recente do filho. Saída de ferramenta/toolResult não é promovida para resultados do filho. Execuções com falha terminal não reutilizam texto de resposta capturado.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Estatísticas compactas de tempo de execução/tokens.
    - Uma instrução de revisão dizendo ao agente solicitante para verificar o resultado antes de decidir se a tarefa original está concluída.
    - Orientação de acompanhamento dizendo ao agente solicitante para continuar a tarefa ou registrar um acompanhamento quando o resultado do filho deixar mais ação.
    - Uma instrução de atualização final para o caminho sem mais ações, escrita na voz normal de assistente sem encaminhar metadados internos brutos.

  </Accordion>
  <Accordion title="Modos e runtime ACP">
    - `--model` e `--thinking` substituem padrões para essa execução específica.
    - Use `info`/`log` para inspecionar detalhes e saída após a conclusão.
    - Para sessões persistentes vinculadas a thread, use `sessions_spawn` com `thread: true` e `mode: "session"`.
    - Se o canal solicitante não oferece suporte a vinculações de thread, use `mode: "run"` em vez de tentar novamente combinações impossíveis vinculadas a thread.
    - Para sessões de harness ACP (Claude Code, Gemini CLI, OpenCode ou Codex ACP/acpx explícito), use `sessions_spawn` com `runtime: "acp"` quando a ferramenta anuncia esse runtime. Veja [modelo de entrega ACP](/pt-BR/tools/acp-agents#delivery-model) ao depurar conclusões ou loops agente-para-agente. Quando o plugin `codex` está habilitado, o controle de chat/thread do Codex deve preferir `/codex ...` em vez de ACP, a menos que o usuário peça explicitamente ACP/acpx.
    - O OpenClaw oculta `runtime: "acp"` até que ACP esteja habilitado, o solicitante não esteja em sandbox e um plugin de backend como `acpx` esteja carregado. `runtime: "acp"` espera um id de harness ACP externo, ou uma entrada `agents.list[]` com `runtime.type="acp"`; use o runtime de subagente padrão para agentes normais de configuração do OpenClaw vindos de `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Subagentes nativos começam isolados, a menos que o chamador peça explicitamente para bifurcar
a transcrição atual.

| Modo       | Quando usar                                                                                                                         | Comportamento                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Pesquisa nova, implementação independente, trabalho de ferramenta lenta ou qualquer coisa que possa ser resumida no texto da tarefa                           | Cria uma transcrição filha limpa. Este é o padrão e mantém o uso de tokens menor.  |
| `fork`     | Trabalho que depende da conversa atual, resultados anteriores de ferramentas ou instruções sutis já presentes na transcrição solicitante | Ramifica a transcrição solicitante para a sessão filha antes que o filho comece. |

Use `fork` com moderação. Ele serve para delegação sensível ao contexto, não como
substituto para escrever um prompt de tarefa claro.

## Ferramenta: `sessions_spawn`

Inicia uma execução de subagente com `deliver: false` na lane global `subagent`,
então roda uma etapa de anúncio e publica a resposta de anúncio no canal de
chat solicitante.

A disponibilidade depende da política efetiva de ferramentas do chamador. Os perfis `coding` e
`full` expõem `sessions_spawn` por padrão. O perfil `messaging`
não; adicione `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` ou use `tools.profile: "coding"` para agentes que devem delegar
trabalho. Políticas de canal/grupo, provedor, sandbox e permitir/negar por agente ainda podem
remover a ferramenta após a etapa de perfil. Use `/tools` a partir da mesma
sessão para confirmar a lista efetiva de ferramentas.

**Padrões:**

- **Modelo:** subagentes nativos herdam o chamador, a menos que você defina `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` por agente). Gerações de runtime ACP usam o mesmo modelo de subagente configurado quando presente; caso contrário, o harness ACP mantém seu próprio padrão. Um `sessions_spawn.model` explícito ainda prevalece.
- **Thinking:** subagentes nativos herdam o chamador, a menos que você defina `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` por agente). Gerações de runtime ACP também aplicam `agents.defaults.models["provider/model"].params.thinking` para o modelo selecionado. Um `sessions_spawn.thinking` explícito ainda prevalece.
- **Tempo limite de execução:** OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário, recorre a `0` (sem tempo limite). `sessions_spawn` não aceita substituições de tempo limite por chamada.
- **Entrega da tarefa:** subagentes nativos recebem a tarefa delegada em sua primeira mensagem `[Subagent Task]` visível. O prompt de sistema do subagente carrega regras de runtime e contexto de roteamento, não uma duplicata oculta da tarefa.

Gerações de subagente nativas aceitas incluem os metadados do modelo filho resolvido no
resultado da ferramenta: `resolvedModel` contém a ref do modelo aplicada e
`resolvedProvider` contém o prefixo do provedor quando a ref tem um.

### Modo de prompt de delegação

`agents.defaults.subagents.delegationMode` controla apenas a orientação do prompt; ele não altera a política de ferramentas nem impõe delegação.

- `suggest` (padrão): manter o lembrete padrão de prompt para usar subagentes em trabalhos maiores ou mais lentos.
- `prefer`: dizer ao agente principal para permanecer responsivo e delegar qualquer coisa mais envolvida do que uma resposta direta por meio de `sessions_spawn`.

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
  Identificador estável opcional para identificar um filho específico em saídas de status posteriores. Deve corresponder a `[a-z][a-z0-9_-]{0,63}` e não pode ser um alvo reservado, como `last` ou `all`.
</ParamField>
<ParamField path="label" type="string">
  Rótulo opcional legível por humanos.
</ParamField>
<ParamField path="agentId" type="string">
  Gera sob outro id de agente configurado quando permitido por `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Diretório de trabalho opcional da tarefa para a execução filha. Subagentes nativos ainda carregam arquivos de bootstrap do workspace do agente de destino; `cwd` só altera onde ferramentas de runtime e harnesses da CLI fazem o trabalho delegado.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` é apenas para harnesses ACP externos (`claude`, `droid`, `gemini`, `opencode` ou Codex ACP/acpx solicitado explicitamente) e para entradas `agents.list[]` cujo `runtime.type` é `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Somente ACP. Retoma uma sessão existente de harness ACP quando `runtime: "acp"`; ignorado para gerações de subagente nativas.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Somente ACP. Transmite a saída da execução ACP para a sessão pai quando `runtime: "acp"`; omita para gerações de subagente nativas.
</ParamField>
<ParamField path="model" type="string">
  Substitui o modelo do subagente. Valores inválidos são ignorados e o subagente executa no modelo padrão com um aviso no resultado da ferramenta.
</ParamField>
<ParamField path="thinking" type="string">
  Substitui o nível de raciocínio para a execução do subagente.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Quando `true`, solicita vinculação de thread de canal para esta sessão de subagente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Se `thread: true` e `mode` for omitido, o padrão se torna `session`. `mode: "session"` exige `thread: true`.
  Se a vinculação de thread não estiver disponível para o canal solicitante, use `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` arquiva imediatamente após o anúncio (ainda mantém a transcrição via renomeação).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rejeita a geração a menos que o runtime filho de destino esteja em sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` ramifica a transcrição atual do solicitante para a sessão filha. Somente subagentes nativos. Gerações vinculadas a thread usam `fork` por padrão; gerações sem thread usam `isolated` por padrão.
</ParamField>

<Warning>
`sessions_spawn` **não** aceita parâmetros de entrega por canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Subagentes nativos relatam
seu turno mais recente de assistente de volta ao solicitante; a entrega externa permanece com
o agente pai/solicitante.
</Warning>

### Nomes de tarefa e direcionamento

`taskName` é um identificador voltado ao modelo para orquestração, não uma chave de sessão.
Use-o para nomes estáveis de filhos, como `review_subagents`,
`linux_validation` ou `docs_update`, quando um coordenador talvez precise inspecionar
esse filho depois.

A resolução de destino aceita correspondências exatas de `taskName` e
prefixos inequívocos. A correspondência é limitada à mesma janela de destinos ativos/recentes usada
por destinos numerados de `/subagents`, então um filho concluído obsoleto não torna
ambíguo um identificador reutilizado. Se dois filhos ativos ou recentes compartilharem o mesmo
`taskName`, o destino será ambíguo; use o índice da lista, a chave de sessão ou
o id da execução.

Os destinos reservados `last` e `all` não são valores válidos de `taskName`
porque eles já têm significados de controle.

## Ferramenta: `sessions_yield`

Encerra o turno atual do modelo e aguarda eventos de runtime, principalmente
eventos de conclusão de subagentes, chegarem como a próxima mensagem. Use-a depois
de gerar trabalho filho obrigatório quando o solicitante não puder produzir uma resposta
final até que essas conclusões cheguem.

`sessions_yield` é a primitiva de espera. Não a substitua por loops de polling
sobre `subagents`, `sessions_list`, `sessions_history`, `sleep` de shell
ou polling de processos apenas para detectar a conclusão de filhos.

Use `sessions_yield` somente quando a lista efetiva de ferramentas da sessão a incluir.
Alguns perfis de ferramentas mínimos ou personalizados podem expor `sessions_spawn` e
`subagents` sem expor `sessions_yield`; nesse caso, não invente
um loop de polling apenas para aguardar a conclusão.

Quando filhos ativos existem, o OpenClaw injeta um bloco de prompt compacto gerado pelo runtime
`Active Subagents` em turnos normais para que o solicitante possa ver
as sessões filhas atuais, ids de execução, status, rótulos, tarefas e
aliases `taskName` sem polling. Os campos de tarefa e rótulo nesse
bloco são citados como dados, não instruções, porque podem se originar
de argumentos de geração fornecidos pelo usuário/modelo.

## Ferramenta: `subagents`

Lista execuções de subagente geradas pertencentes à sessão solicitante. Ela é limitada
ao solicitante atual; um filho só pode ver seus próprios filhos controlados.

Use `subagents` para status sob demanda e depuração. Use `sessions_yield` para
aguardar eventos de conclusão.

## Sessões vinculadas a thread

Quando vinculações de thread estão habilitadas para um canal, um subagente pode permanecer vinculado
a uma thread para que mensagens de acompanhamento do usuário nessa thread continuem sendo roteadas para a
mesma sessão de subagente.

### Canais com suporte a thread

Qualquer canal com um adaptador de vinculação de sessão pode oferecer suporte a sessões persistentes
de subagente vinculadas a thread (`sessions_spawn` com `thread: true`).
Adaptadores incluídos atualmente abrangem threads do Discord, threads do Matrix,
tópicos de fórum do Telegram e vinculações da conversa atual para Feishu.
Use as chaves de configuração `threadBindings` por canal para habilitação,
timeouts e `spawnSessions`.

### Fluxo rápido

<Steps>
  <Step title="Gerar">
    `sessions_spawn` com `thread: true` (e opcionalmente `mode: "session"`).
  </Step>
  <Step title="Vincular">
    O OpenClaw cria ou vincula uma thread a esse destino de sessão no canal ativo.
  </Step>
  <Step title="Rotear acompanhamentos">
    Respostas e mensagens de acompanhamento nessa thread são roteadas para a sessão vinculada.
  </Step>
  <Step title="Inspecionar timeouts">
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
| `/unfocus`         | Remove a vinculação da thread vinculada atual                       |
| `/agents`          | Lista execuções ativas e estado de vinculação (`thread:<id>` ou `unbound`)       |
| `/session idle`    | Inspeciona/atualiza o desfoco automático por inatividade (somente threads vinculadas focadas)         |
| `/session max-age` | Inspeciona/atualiza o limite rígido (somente threads vinculadas focadas)                  |

### Chaves de configuração

- **Padrão global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Chaves de substituição de canal e auto-vinculação de geração** são específicas do adaptador. Consulte [Canais com suporte a thread](#thread-supporting-channels) acima.

Consulte a [Referência de configuração](/pt-BR/gateway/configuration-reference) e
[Comandos slash](/pt-BR/tools/slash-commands) para detalhes atuais dos adaptadores.

### Lista de permissões

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de ids de agentes configurados que podem ser direcionados via `agentId` explícito (`["*"]` permite qualquer destino configurado). Padrão: apenas o agente solicitante. Se você definir uma lista e ainda quiser que o solicitante gere a si mesmo com `agentId`, inclua o id do solicitante na lista.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista de permissões padrão de agentes de destino configurados usada quando o agente solicitante não define seu próprio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloqueia chamadas `sessions_spawn` que omitem `agentId` (força seleção explícita de perfil). Substituição por agente: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Timeout por chamada para tentativas de entrega de anúncio `agent` do Gateway. Os valores são milissegundos inteiros positivos e são limitados ao máximo de temporizador seguro da plataforma. Tentativas transitórias podem fazer a espera total do anúncio durar mais do que um timeout configurado.
</ParamField>

Se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeita destinos
que seriam executados sem sandbox.

### Descoberta

Use `agents_list` para ver quais ids de agentes são permitidos atualmente para
`sessions_spawn`. A resposta inclui o modelo efetivo de cada agente listado
e metadados de runtime incorporados para que chamadores possam distinguir runtimes nativos do OpenClaw, servidor de app Codex
e outros runtimes nativos configurados.

Entradas `allowAgents` devem apontar para ids de agentes configurados em `agents.list[]`.
`["*"]` significa qualquer agente de destino configurado mais o solicitante. Se uma configuração de agente
for excluída, mas seu id permanecer em `allowAgents`, `sessions_spawn` rejeita esse id
e `agents_list` o omite. Execute `openclaw doctor --fix` para limpar entradas obsoletas
da lista de permissões, ou adicione uma entrada mínima `agents.list[]` quando o destino deve
continuar apto a ser gerado enquanto herda padrões.

### Arquivamento automático

- Sessões de subagente são arquivadas automaticamente após `agents.defaults.subagents.archiveAfterMinutes` (padrão `60`).
- O arquivamento usa `sessions.delete` e renomeia a transcrição para `*.deleted.<timestamp>` (mesma pasta).
- `cleanup: "delete"` arquiva imediatamente após o anúncio (ainda mantém a transcrição via renomeação).
- O arquivamento automático é de melhor esforço; temporizadores pendentes são perdidos se o gateway reiniciar.
- Timeouts de execução configurados **não** arquivam automaticamente; eles apenas interrompem a execução. A sessão permanece até o arquivamento automático.
- O arquivamento automático se aplica igualmente a sessões de profundidade 1 e profundidade 2.
- A limpeza do navegador é separada da limpeza de arquivamento: abas/processos de navegador rastreados são fechados em melhor esforço quando a execução termina, mesmo que a transcrição/registro da sessão seja mantido.

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
        runTimeoutSeconds: 900, // default timeout for sessions_spawn (0 = no timeout)
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
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestrador quando profundidade 2 é permitida) | Somente se `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagente (trabalhador folha)             | Nunca                        |

### Cadeia de anúncio

Os resultados fluem de volta pela cadeia:

1. O worker de profundidade 2 termina → anuncia ao seu pai (orquestrador de profundidade 1).
2. O orquestrador de profundidade 1 recebe o anúncio, sintetiza os resultados, termina → anuncia ao principal.
3. O agente principal recebe o anúncio e entrega ao usuário.

Cada nível vê apenas anúncios de seus filhos diretos.

<Note>
**Orientação operacional:** inicie o trabalho filho uma vez e aguarde eventos
de conclusão em vez de criar loops de sondagem em torno de `sessions_list`,
`sessions_history`, `/subagents list` ou comandos `exec` com sleep.
`sessions_list` e `/subagents list` mantêm as relações de sessão filha
focadas no trabalho ativo — filhos ativos permanecem anexados, filhos encerrados
continuam visíveis por uma breve janela recente, e links de filhos obsoletos
existentes apenas no armazenamento são ignorados após sua janela de atualização.
Isso impede que metadados antigos `spawnedBy` /
`parentSessionKey` ressuscitem filhos fantasmas após
reinicialização. Se um evento de conclusão de filho chegar depois que você já enviou a
resposta final, o acompanhamento correto é o token silencioso exato
`NO_REPLY` / `no_reply`.
</Note>

### Política de ferramentas por profundidade

- O papel e o escopo de controle são gravados nos metadados da sessão no momento do spawn. Isso impede que chaves de sessão planas ou restauradas recuperem acidentalmente privilégios de orquestrador.
- **Profundidade 1 (orquestrador, quando `maxSpawnDepth >= 2`):** recebe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para que possa criar filhos e inspecionar seu status. Outras ferramentas de sessão/sistema continuam negadas.
- **Profundidade 1 (folha, quando `maxSpawnDepth == 1`):** nenhuma ferramenta de sessão (comportamento padrão atual).
- **Profundidade 2 (worker folha):** nenhuma ferramenta de sessão — `sessions_spawn` é sempre negado na profundidade 2. Não pode criar mais filhos.

### Limite de spawn por agente

Cada sessão de agente (em qualquer profundidade) pode ter no máximo `maxChildrenPerAgent`
(padrão `5`) filhos ativos ao mesmo tempo. Isso impede expansão descontrolada
a partir de um único orquestrador.

### Parada em cascata

Parar um orquestrador de profundidade 1 interrompe automaticamente todos os seus filhos
de profundidade 2:

- `/stop` no chat principal interrompe todos os agentes de profundidade 1 e propaga para seus filhos de profundidade 2.

## Autenticação

A autenticação de subagente é resolvida por **id do agente**, não pelo tipo de sessão:

- A chave de sessão do subagente é `agent:<agentId>:subagent:<uuid>`.
- O armazenamento de autenticação é carregado a partir do `agentDir` desse agente.
- Os perfis de autenticação do agente principal são mesclados como **fallback**; perfis do agente substituem perfis principais em conflitos.

A mesclagem é aditiva, portanto os perfis principais estão sempre disponíveis como
fallbacks. Autenticação totalmente isolada por agente ainda não é compatível.

## Anúncio

Subagentes reportam de volta por meio de uma etapa de anúncio:

- A etapa de anúncio é executada dentro da sessão do subagente (não na sessão solicitante).
- Se o subagente responder exatamente `ANNOUNCE_SKIP`, nada será publicado.
- Se o texto mais recente do assistente for o token silencioso exato `NO_REPLY` / `no_reply`, a saída do anúncio será suprimida mesmo que tenha existido progresso visível anterior.

A entrega depende da profundidade do solicitante:

- Sessões solicitantes de nível superior usam uma chamada de acompanhamento `agent` com entrega externa (`deliver=true`).
- Sessões de subagente solicitantes aninhadas recebem uma injeção interna de acompanhamento (`deliver=false`) para que o orquestrador possa sintetizar os resultados dos filhos dentro da sessão.
- Se uma sessão de subagente solicitante aninhada desaparecer, o OpenClaw recorre ao solicitante dessa sessão quando disponível.

Para sessões solicitantes de nível superior, a entrega direta em modo de conclusão primeiro
resolve qualquer rota de conversa/thread vinculada e substituição de hook, depois preenche
campos ausentes de canal-alvo a partir da rota armazenada da sessão solicitante.
Isso mantém as conclusões no chat/tópico correto mesmo quando a origem da conclusão
identifica apenas o canal.

A agregação de conclusões de filhos é limitada à execução solicitante atual ao
criar descobertas de conclusão aninhadas, impedindo que saídas de filhos de execuções
anteriores obsoletas vazem para o anúncio atual. Respostas de anúncio preservam
roteamento de thread/tópico quando disponível nos adaptadores de canal.

### Contexto do anúncio

O contexto de anúncio é normalizado para um bloco de evento interno estável:

| Campo          | Origem                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Origem         | `subagent` ou `cron`                                                                                          |
| IDs de sessão  | Chave/id da sessão filha                                                                                      |
| Tipo           | Tipo de anúncio + rótulo da tarefa                                                                            |
| Status         | Derivado do resultado de runtime (`success`, `error`, `timeout` ou `unknown`) — **não** inferido do texto do modelo |
| Conteúdo do resultado | Texto visível mais recente do assistente vindo do filho                                                |
| Acompanhamento | Instrução descrevendo quando responder vs. permanecer silencioso                                               |

Execuções terminais com falha reportam status de falha sem reproduzir o
texto de resposta capturado. A saída Tool/toolResult não é promovida a texto de resultado do filho.

### Linha de estatísticas

Payloads de anúncio incluem uma linha de estatísticas no final (mesmo quando encapsulados):

- Runtime (por exemplo, `runtime 5m12s`).
- Uso de tokens (entrada/saída/total).
- Custo estimado quando a precificação do modelo está configurada (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` e caminho da transcrição para que o agente principal possa buscar o histórico via `sessions_history` ou inspecionar o arquivo no disco.

Metadados internos destinam-se apenas à orquestração; respostas voltadas ao usuário
devem ser reescritas na voz normal do assistente.

### Por que preferir `sessions_history`

`sessions_history` é o caminho de orquestração mais seguro:

- A recuperação do assistente é normalizada primeiro: tags de pensamento removidas; estruturas `<relevant-memories>` / `<relevant_memories>` removidas; blocos de payload XML de chamada de ferramenta em texto simples (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) removidos, incluindo payloads truncados que nunca fecham corretamente; estruturas rebaixadas de chamada/resultado de ferramenta e marcadores de contexto histórico removidos; tokens de controle de modelo vazados (`<|assistant|>`, outros ASCII `<|...|>`, largura total `<｜...｜>`) removidos; XML de chamada de ferramenta MiniMax malformado removido.
- Texto semelhante a credencial/token é redigido.
- Blocos longos podem ser truncados.
- Históricos muito grandes podem descartar linhas antigas ou substituir uma linha grande demais por `[sessions_history omitted: message too large]`.
- A inspeção da transcrição bruta no disco é o fallback quando você precisa da transcrição byte a byte completa.

## Política de ferramentas

Subagentes usam primeiro o mesmo pipeline de perfil e política de ferramentas do pai ou
agente-alvo. Depois disso, o OpenClaw aplica a camada de restrição de subagente.

Sem `tools.profile` restritivo, subagentes recebem **todas as ferramentas exceto a
ferramenta de mensagem, ferramentas de sessão e ferramentas de sistema**:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

`sessions_history` também permanece aqui uma visão de recuperação limitada e higienizada —
não é um despejo bruto de transcrição.

Quando `maxSpawnDepth >= 2`, subagentes orquestradores de profundidade 1 também
recebem `sessions_spawn`, `subagents`, `sessions_list` e
`sessions_history` para que possam gerenciar seus filhos.

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
o conjunto de ferramentas já resolvido, mas não pode **adicionar de volta** uma ferramenta removida
por `tools.profile`. Por exemplo, `tools.profile: "coding"` inclui
`web_search`/`web_fetch`, mas não a ferramenta `browser`. Para permitir que
subagentes com perfil de coding usem automação de navegador, adicione browser no
estágio de perfil:

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

Subagentes usam uma faixa de fila dedicada dentro do processo:

- **Nome da faixa:** `subagent`
- **Concorrência:** `agents.defaults.subagents.maxConcurrent` (padrão `8`)

## Atividade e recuperação

O OpenClaw não trata a ausência de `endedAt` como prova permanente de que um
subagente ainda está ativo. Execuções não encerradas mais antigas que a janela de execução obsoleta
deixam de contar como ativas/pendentes em `/subagents list`, resumos de status,
gating de conclusão de descendentes e verificações de concorrência por sessão.

Após uma reinicialização do Gateway, execuções restauradas obsoletas e não encerradas são podadas, a menos que
sua sessão filha esteja marcada como `abortedLastRun: true`. Essas
sessões filhas abortadas por reinicialização continuam recuperáveis pelo fluxo de recuperação de subagente
órfão, que envia uma mensagem sintética de retomada antes de
limpar o marcador de abortado.

A recuperação automática após reinicialização é limitada por sessão filha. Se o mesmo
filho subagente for aceito para recuperação de órfão repetidamente dentro da
janela rápida de retravamento, o OpenClaw persiste uma lápide de recuperação nessa
sessão e para de retomá-la automaticamente em reinicializações posteriores. Execute
`openclaw tasks maintenance --apply` para reconciliar o registro da tarefa, ou
`openclaw doctor --fix` para limpar flags obsoletas de recuperação abortada em
sessões com lápide.

<Note>
Se o spawn de um subagente falhar com Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, verifique o chamador RPC antes de editar o estado de pareamento.
A coordenação interna `sessions_spawn` despacha dentro do processo quando o
chamador já está executando dentro do contexto de requisição do gateway, portanto ela
não abre um WebSocket de loopback nem depende da linha de base de escopo de dispositivo pareado
da CLI. Chamadores fora do processo do gateway ainda usam o fallback WebSocket
como `client.id: "gateway-client"` com `client.mode: "backend"`
sobre autenticação direta de loopback por token compartilhado/senha. Chamadores remotos, `deviceIdentity`
explícito, caminhos explícitos de token de dispositivo e clientes de navegador/node
ainda precisam de aprovação normal de dispositivo para upgrades de escopo.
</Note>

## Parada

- Enviar `/stop` no chat solicitante aborta a sessão solicitante e interrompe qualquer execução ativa de subagente criada a partir dela, propagando para filhos aninhados.

## Limitações

- O anúncio de subagente é **best-effort**. Se o gateway reiniciar, o trabalho pendente de "anunciar de volta" será perdido.
- Subagentes ainda compartilham os mesmos recursos do processo do gateway; trate `maxConcurrent` como uma válvula de segurança.
- `sessions_spawn` é sempre não bloqueante: ele retorna `{ status: "accepted", runId, childSessionKey }` imediatamente.
- O contexto de subagente injeta apenas `AGENTS.md` e `TOOLS.md` (sem `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` ou `BOOTSTRAP.md`). Subagentes nativos do Codex seguem o mesmo limite: `TOOLS.md` permanece nas instruções herdadas da thread do Codex, enquanto arquivos de persona, identidade e usuário exclusivos do pai são injetados como instruções de colaboração com escopo de turno para que os filhos não os clonem.
- A profundidade máxima de aninhamento é 5 (intervalo de `maxSpawnDepth`: 1–5). A profundidade 2 é recomendada para a maioria dos casos de uso.
- `maxChildrenPerAgent` limita filhos ativos por sessão (padrão `5`, intervalo `1–20`).

## Relacionado

- [Agentes ACP](/pt-BR/tools/acp-agents)
- [Envio de agente](/pt-BR/tools/agent-send)
- [Tarefas em segundo plano](/pt-BR/automation/tasks)
- [Ferramentas de sandbox multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
