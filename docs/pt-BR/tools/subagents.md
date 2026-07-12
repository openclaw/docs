---
read_when:
    - Você quer trabalho em segundo plano ou em paralelo por meio do agente
    - Você está alterando a política da ferramenta sessions_spawn ou de subagente
    - Você está implementando ou solucionando problemas em sessões de subagentes vinculadas a threads
sidebarTitle: Sub-agents
summary: Inicie execuções isoladas de agentes em segundo plano que anunciam os resultados no chat do solicitante
title: Subagentes
x-i18n:
    generated_at: "2026-07-12T15:45:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d2293993ad99e2797f5cfbe13e964487f3bd0fa0a3114e78d25ce5862768b9ca
    source_path: tools/subagents.md
    workflow: 16
---

Subagentes são execuções de agentes em segundo plano iniciadas a partir de uma execução de agente existente.
Cada uma é executada em sua própria sessão (`agent:<agentId>:subagent:<uuid>`) e,
quando concluída, **anuncia** seu resultado de volta ao canal de chat solicitante.
Cada execução de subagente é rastreada como uma [tarefa em segundo plano](/pt-BR/automation/tasks).

Objetivos:

- Paralelizar pesquisas, tarefas longas e trabalhos lentos com ferramentas sem bloquear a execução principal.
- Manter os subagentes isolados por padrão (separação de sessões, sandbox opcional).
- Manter a superfície de ferramentas difícil de usar incorretamente: por padrão, os subagentes **não** recebem ferramentas de sessão nem de mensagens.
- Permitir profundidade de aninhamento configurável para padrões de orquestração.

<Note>
**Observação sobre custos:** cada subagente tem seu próprio contexto e consumo de tokens por
padrão. Para tarefas pesadas ou repetitivas, defina um modelo mais econômico para os subagentes
e mantenha o agente principal em um modelo de maior qualidade por meio de
`agents.defaults.subagents.model` ou substituições por agente. Quando um agente filho
realmente precisar da transcrição atual do solicitante, inicie-o com
`context: "fork"`. Sessões de subagentes vinculadas a threads usam
`context: "fork"` por padrão porque ramificam a conversa atual em uma
thread de acompanhamento.
</Note>

## Comando de barra

`/subagents` inspeciona as execuções de subagentes da **sessão atual**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` mostra os metadados da execução (status, carimbos de data e hora, id da sessão,
caminho da transcrição, limpeza). `/subagents log` exibe os turnos recentes do chat de uma
execução; adicione o token `tools` para incluir mensagens de chamadas/resultados de ferramentas (omitidas
por padrão). Use `sessions_history` para uma visualização limitada e filtrada por segurança da memória
a partir de um turno do agente ou inspecione o caminho da transcrição no disco para
acessar a transcrição bruta completa.

### Controles de vinculação a threads

Estes comandos funcionam em canais com vinculações persistentes a threads. Consulte
[Canais com suporte a threads](#thread-supporting-channels) abaixo.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Comportamento de inicialização

Os agentes iniciam subagentes em segundo plano com a ferramenta `sessions_spawn`.
As conclusões retornam como eventos internos da sessão principal; o agente principal/solicitante
decide se uma atualização visível ao usuário é necessária.

<AccordionGroup>
  <Accordion title="Conclusão não bloqueante baseada em envio">
    - `sessions_spawn` não é bloqueante; retorna imediatamente um id de execução.
    - Ao concluir, o subagente envia um relatório de volta à sessão principal/solicitante.
    - Turnos de agentes que precisam dos resultados de agentes filhos devem chamar `sessions_yield` após iniciar o trabalho necessário. Isso encerra o turno atual e permite que o evento de conclusão chegue como a próxima mensagem visível ao modelo.
    - A conclusão é baseada em envio. Depois da inicialização, **não** consulte `/subagents list`, `sessions_list` ou `sessions_history` repetidamente apenas para aguardar a conclusão; verifique o status sob demanda somente durante a depuração.
    - A saída do agente filho é um relatório/evidência para o agente solicitante sintetizar. Ela não é um texto de instrução criado pelo usuário e não pode substituir políticas do sistema, do desenvolvedor ou do usuário.
    - Ao concluir, o OpenClaw tenta, na medida do possível, fechar as abas/processos do navegador rastreados que foram abertos pela sessão desse subagente antes de continuar o fluxo de limpeza do anúncio.

  </Accordion>
  <Accordion title="Entrega da conclusão">
    - O OpenClaw devolve as conclusões à sessão solicitante por meio de um turno `agent` com uma chave de idempotência estável.
    - Se a execução solicitante ainda estiver ativa, o OpenClaw primeiro tenta despertar/direcionar essa execução em vez de iniciar um segundo caminho de resposta visível.
    - Se não for possível despertar um solicitante ativo, o OpenClaw recorre a uma transferência para o agente solicitante com o mesmo contexto de conclusão, em vez de descartar o anúncio.
    - Uma transferência bem-sucedida para o agente principal conclui a entrega do subagente mesmo quando o agente principal decide que nenhuma atualização visível ao usuário é necessária.
    - Subagentes nativos não recebem a ferramenta de mensagens. Eles retornam texto simples de assistente ao agente principal/solicitante; respostas visíveis a pessoas continuam sob responsabilidade da política normal de entrega do agente principal/solicitante.
    - Se não for possível usar a transferência direta, a entrega recorre ao roteamento por fila e, em seguida, a uma nova tentativa curta do anúncio com espera exponencial antes da desistência definitiva.
    - A entrega mantém a rota resolvida do solicitante: rotas de conclusão vinculadas a threads ou conversas têm prioridade quando disponíveis. Se a origem da conclusão fornecer apenas um canal, o OpenClaw preenche o destino/a conta ausente com base na rota resolvida da sessão solicitante (`lastChannel` / `lastTo` / `lastAccountId`), para que a entrega direta continue funcionando.

  </Accordion>
  <Accordion title="Metadados da transferência de conclusão">
    A transferência de conclusão para a sessão solicitante é um contexto interno
    gerado pelo runtime (não é texto criado pelo usuário) e inclui:

    - `Result` — o texto da resposta `assistant` visível mais recente do agente filho. A saída de tool/toolResult não é promovida a resultado do agente filho. Execuções com falha terminal não reutilizam o texto de resposta capturado.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Estatísticas compactas de runtime/tokens.
    - Uma instrução de revisão que orienta o agente solicitante a verificar o resultado antes de decidir se a tarefa original foi concluída.
    - Orientações de acompanhamento que instruem o agente solicitante a continuar a tarefa ou registrar um acompanhamento quando o resultado do agente filho exigir outras ações.
    - Uma instrução de atualização final para o caso em que nenhuma outra ação seja necessária, escrita na voz normal do assistente, sem encaminhar metadados internos brutos.

  </Accordion>
  <Accordion title="Modos e runtime ACP">
    - `--model` e `--thinking` substituem os padrões dessa execução específica.
    - Use `info`/`log` para inspecionar detalhes e a saída após a conclusão.
    - Para sessões persistentes vinculadas a threads, use `sessions_spawn` com `thread: true` e `mode: "session"`.
    - Se o canal solicitante não oferecer suporte a vinculações a threads, use `mode: "run"` em vez de tentar novamente uma combinação impossível vinculada a threads.
    - Para sessões de harness ACP (Claude Code, Gemini CLI, OpenCode ou Codex ACP/acpx explícito), use `sessions_spawn` com `runtime: "acp"` quando a ferramenta anunciar esse runtime. Consulte [Modelo de entrega do ACP](/pt-BR/tools/acp-agents#delivery-model) ao depurar conclusões ou loops entre agentes. Quando o Plugin `codex` estiver habilitado, o controle de chat/thread do Codex deve preferir `/codex ...` ao ACP, a menos que o usuário solicite explicitamente ACP/acpx.
    - O OpenClaw oculta `runtime: "acp"` até que o ACP esteja habilitado, o solicitante não esteja em sandbox e um Plugin de backend como `acpx` esteja carregado. `runtime: "acp"` espera um id de harness ACP externo ou uma entrada `agents.list[]` com `runtime.type="acp"`; use o runtime padrão de subagentes para agentes de configuração normais do OpenClaw provenientes de `agents_list`.

  </Accordion>
</AccordionGroup>

## Modos de contexto

Subagentes nativos começam isolados, a menos que o chamador solicite explicitamente a ramificação
da transcrição atual.

| Modo       | Quando usar                                                                                                                             | Comportamento                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Pesquisa nova, implementação independente, trabalho lento com ferramentas ou qualquer tarefa que possa ser descrita no texto da tarefa | Cria uma transcrição limpa para o agente filho. Este é o padrão e reduz o consumo de tokens. |
| `fork`     | Trabalho que depende da conversa atual, de resultados anteriores de ferramentas ou de instruções detalhadas já presentes na transcrição do solicitante | Ramifica a transcrição do solicitante na sessão do agente filho antes de ele começar. |

Use `fork` com moderação. Ele se destina à delegação sensível ao contexto, não substitui
a elaboração de uma instrução de tarefa clara.

## Ferramenta: `sessions_spawn`

Inicia uma execução de subagente com `deliver: false` na faixa global `subagent`,
depois executa uma etapa de anúncio e publica a resposta do anúncio no canal de
chat solicitante.

A disponibilidade depende da política efetiva de ferramentas do chamador. O perfil integrado
`coding` inclui `sessions_spawn`; `messaging` e `minimal` não
incluem. `full` permite todas as ferramentas. Adicione `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]` ou use `tools.profile: "coding"` para
agentes com um perfil mais restrito que ainda precisem delegar trabalho.
As políticas de permissão/negação de canal/grupo, provedor, sandbox e por agente
ainda podem remover a ferramenta após a etapa de aplicação do perfil. Use `/tools` na mesma
sessão para confirmar a lista efetiva de ferramentas.

**Padrões:**

- **Modelo:** subagentes nativos herdam o modelo do chamador, a menos que você defina `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` por agente). Inicializações no runtime ACP usam o mesmo modelo configurado para subagentes quando presente; caso contrário, o harness ACP mantém seu próprio padrão. Um `sessions_spawn.model` explícito ainda tem prioridade.
- **Raciocínio:** subagentes nativos herdam a configuração do chamador, a menos que você defina `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` por agente). Inicializações no runtime ACP também aplicam `agents.defaults.models["provider/model"].params.thinking` ao modelo selecionado. Um `sessions_spawn.thinking` explícito ainda tem prioridade.
- **Tempo limite da execução:** o OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário, recorre a `0` (sem tempo limite). `sessions_spawn` não aceita substituições do tempo limite por chamada.
- **Entrega da tarefa:** subagentes nativos recebem a tarefa delegada em sua primeira mensagem `[Subagent Task]` visível. O prompt do sistema do subagente contém regras de runtime e contexto de roteamento, não uma duplicata oculta da tarefa.

Inicializações aceitas de subagentes nativos incluem os metadados resolvidos do modelo do agente filho
no resultado da ferramenta: `resolvedModel` contém a referência de modelo aplicada e
`resolvedProvider` contém o prefixo do provedor quando a referência possui um.

### Modo do prompt de delegação

`agents.defaults.subagents.delegationMode` controla apenas as orientações do prompt; ele não altera a política de ferramentas nem impõe a delegação.

- `suggest` (padrão): mantém a sugestão padrão do prompt para usar subagentes em trabalhos maiores ou mais lentos.
- `prefer`: orienta o agente principal a permanecer responsivo e delegar por meio de `sessions_spawn` qualquer tarefa mais complexa que uma resposta direta.

Substituição por agente: `agents.list[].subagents.delegationMode`.

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
  Identificador estável opcional para identificar um filho específico em uma saída de status posterior. Deve corresponder a `[a-z][a-z0-9_-]{0,63}` e não pode ser um destino reservado, como `last` ou `all`.
</ParamField>
<ParamField path="label" type="string">
  Rótulo opcional legível por humanos.
</ParamField>
<ParamField path="agentId" type="string">
  Inicia sob outro id de agente configurado quando permitido por `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Diretório de trabalho opcional da tarefa para a execução filha. Os subagentes nativos ainda carregam os arquivos de inicialização do espaço de trabalho do agente de destino; `cwd` altera apenas onde as ferramentas de runtime e os harnesses da CLI realizam o trabalho delegado.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` destina-se apenas a harnesses ACP externos (`claude`, `droid`, `gemini`, `opencode` ou Codex ACP/acpx solicitado explicitamente) e a entradas de `agents.list[]` cujo `runtime.type` seja `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Somente ACP. Retoma uma sessão existente do harness ACP quando `runtime: "acp"`; ignorado para inicializações de subagentes nativos.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Somente ACP. Transmite a saída da execução ACP para a sessão pai quando `runtime: "acp"`; omita para inicializações de subagentes nativos.
</ParamField>
<ParamField path="model" type="string">
  Substitui o modelo do subagente. Valores inválidos são ignorados, e o subagente é executado no modelo padrão com um aviso no resultado da ferramenta.
</ParamField>
<ParamField path="thinking" type="string">
  Substitui o nível de raciocínio da execução do subagente.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Quando `true`, solicita a vinculação a uma thread do canal para esta sessão de subagente.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Se `thread: true` e `mode` for omitido, o padrão passa a ser `session`. `mode: "session"` exige `thread: true`.
  Se a vinculação a uma thread não estiver disponível para o canal solicitante, use `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` arquiva a sessão imediatamente após o anúncio (ainda preserva a transcrição por meio da renomeação).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` rejeita a inicialização, a menos que o runtime filho de destino esteja em sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` ramifica a transcrição atual do solicitante na sessão filha. Somente para subagentes nativos. Inicializações vinculadas a threads usam `fork` por padrão; inicializações não vinculadas a threads usam `isolated` por padrão.
</ParamField>

<Warning>
`sessions_spawn` **não** aceita parâmetros de entrega de canal (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Os subagentes nativos enviam
seu turno mais recente de assistente de volta ao solicitante; a entrega externa permanece com
o agente pai/solicitante.
</Warning>

### Nomes de tarefas e direcionamento

`taskName` é um identificador voltado ao modelo para orquestração, não uma chave de sessão.
Use-o para nomes estáveis de filhos, como `review_subagents`,
`linux_validation` ou `docs_update`, quando um coordenador puder precisar inspecionar
esse filho posteriormente.

A resolução de destino aceita correspondências exatas de `taskName` e prefixos
não ambíguos. A correspondência é limitada à mesma janela de destinos ativos/recentes usada
pelos destinos numerados de `/subagents`, portanto um filho antigo concluído não torna
ambíguo um identificador reutilizado. Se dois filhos ativos ou recentes compartilharem o mesmo
`taskName`, o destino será ambíguo; use o índice da lista, a chave da sessão ou
o id da execução.

Os destinos reservados `last` e `all` não são valores válidos de `taskName`
porque já têm significados de controle.

## Ferramenta: `sessions_yield`

Encerra o turno atual do modelo e aguarda que eventos do runtime, principalmente
eventos de conclusão de subagentes, cheguem como a próxima mensagem. Use-a após
iniciar o trabalho filho necessário quando o solicitante não puder produzir uma resposta
final até que essas conclusões cheguem.

`sessions_yield` é a primitiva de espera. Não a substitua por loops de sondagem
sobre `subagents`, `sessions_list`, `sessions_history`, `sleep` do shell
ou sondagem de processos apenas para detectar a conclusão de um filho.

Use `sessions_yield` somente quando a lista efetiva de ferramentas da sessão a incluir.
Alguns perfis de ferramentas mínimos ou personalizados podem expor `sessions_spawn` e
`subagents` sem expor `sessions_yield`; nesse caso, não invente
um loop de sondagem apenas para aguardar a conclusão.

Quando existem filhos ativos, o OpenClaw injeta um bloco de prompt compacto
`Active Subagents`, gerado pelo runtime, nos turnos normais para que o solicitante possa ver
as sessões filhas atuais, ids de execução, status, rótulos, tarefas e
aliases de `taskName` sem sondagem. Os campos de tarefa e rótulo nesse
bloco são citados como dados, não como instruções, pois podem se originar
de argumentos de inicialização fornecidos pelo usuário/modelo.

## Ferramenta: `subagents`

Lista as execuções de subagentes iniciadas pertencentes à sessão solicitante. Ela é limitada
ao solicitante atual; um filho só pode ver seus próprios filhos controlados.

Use `subagents` para consultar status sob demanda e depurar. Use `sessions_yield` para
aguardar eventos de conclusão.

## Sessões vinculadas a threads

Quando as vinculações a threads estão habilitadas para um canal, um subagente pode permanecer vinculado
a uma thread, de modo que as mensagens subsequentes do usuário nessa thread continuem sendo roteadas para a
mesma sessão de subagente.

### Canais compatíveis com threads

Um canal oferece suporte a sessões persistentes de subagentes vinculadas a threads
(`sessions_spawn` com `thread: true`) quando registra um adaptador de vinculação
de conversa. Canais incluídos com esse suporte: **Discord**,
**iMessage**, **Matrix** e **Telegram**. Discord e Matrix criam
uma thread filha por padrão; Telegram e iMessage vinculam a
conversa atual por padrão. Use as chaves de configuração `threadBindings` de cada canal para
habilitação, tempos limite e `spawnSessions`.

### Fluxo rápido

<Steps>
  <Step title="Iniciar">
    `sessions_spawn` com `thread: true` (e, opcionalmente, `mode: "session"`).
  </Step>
  <Step title="Vincular">
    O OpenClaw cria ou vincula uma thread a esse destino de sessão no canal ativo.
  </Step>
  <Step title="Rotear mensagens subsequentes">
    Respostas e mensagens subsequentes nessa thread são roteadas para a sessão vinculada.
  </Step>
  <Step title="Inspecionar tempos limite">
    Use `/session idle` para inspecionar/atualizar a remoção automática de foco por inatividade e
    `/session max-age` para controlar o limite máximo.
  </Step>
  <Step title="Desvincular">
    Use `/unfocus` para desvincular manualmente.
  </Step>
</Steps>

### Controles manuais

| Comando            | Efeito                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Vincula a thread atual (ou cria uma) a um destino de subagente/sessão                     |
| `/unfocus`         | Remove a vinculação da thread atualmente vinculada                                           |
| `/agents`          | Lista execuções ativas e o estado de vinculação (`binding:<id>`, `unbound` ou `bindings unavailable`) |
| `/session idle`    | Inspeciona/atualiza a remoção automática de foco por inatividade (somente threads vinculadas em foco)                             |
| `/session max-age` | Inspeciona/atualiza o limite máximo (somente threads vinculadas em foco)                                      |

### Opções de configuração

- **Padrão global:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **As chaves de substituição por canal e de vinculação automática na inicialização** são específicas do adaptador. Consulte [Canais compatíveis com threads](#thread-supporting-channels) acima.

Consulte [Referência de configuração](/pt-BR/gateway/configuration-reference) e
[Comandos de barra](/pt-BR/tools/slash-commands) para obter os detalhes atuais dos adaptadores.

### Lista de permissões

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista de ids de agentes configurados que podem ser direcionados por meio de `agentId` explícito (`["*"]` permite qualquer destino configurado). Padrão: somente o agente solicitante. Se você definir uma lista e ainda quiser que o solicitante inicie a si próprio com `agentId`, inclua o id do solicitante na lista.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Lista de permissões padrão de agentes de destino configurados usada quando o agente solicitante não define seu próprio `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Bloqueia chamadas de `sessions_spawn` que omitem `agentId` (força a seleção explícita de perfil). Substituição por agente: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Tempo limite por chamada para tentativas de entrega de anúncio de `agent` do Gateway. Os valores são milissegundos inteiros positivos e são limitados ao máximo seguro do temporizador da plataforma. Novas tentativas transitórias podem fazer com que a espera total pelo anúncio seja maior do que um tempo limite configurado.
</ParamField>

Se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeitará destinos
que seriam executados fora da sandbox.

### Descoberta

Use `agents_list` para ver quais ids de agentes estão atualmente permitidos para
`sessions_spawn`. A resposta inclui o modelo efetivo e os metadados
de runtime incorporados de cada agente listado, para que os chamadores possam distinguir OpenClaw, o servidor de aplicativo
Codex e outros runtimes nativos configurados.

As entradas de `allowAgents` devem apontar para ids de agentes configurados em `agents.list[]`.
`["*"]` significa qualquer agente de destino configurado mais o solicitante. Se uma configuração de agente
for excluída, mas seu id permanecer em `allowAgents`, `sessions_spawn` rejeitará esse id
e `agents_list` o omitirá. Execute `openclaw doctor --fix` para limpar entradas obsoletas
da lista de permissões ou adicione uma entrada mínima em `agents.list[]` quando o destino precisar
continuar disponível para inicialização enquanto herda os padrões.

### Arquivamento automático

- As sessões de subagentes são arquivadas automaticamente após `agents.defaults.subagents.archiveAfterMinutes` (padrão `60`).
- O arquivamento usa `sessions.delete` e renomeia a transcrição para `*.deleted.<timestamp>` (mesma pasta).
- `cleanup: "delete"` arquiva imediatamente após o anúncio (ainda preserva a transcrição por meio da renomeação).
- O arquivamento automático é realizado conforme possível; temporizadores pendentes são perdidos se o Gateway for reiniciado.
- Os tempos limite de execução configurados **não** arquivam automaticamente; eles apenas interrompem a execução. A sessão permanece até o arquivamento automático.
- O arquivamento automático se aplica igualmente às sessões de profundidade 1 e profundidade 2.
- A limpeza do navegador é separada da limpeza do arquivamento: abas/processos rastreados do navegador são fechados conforme possível quando a execução termina, mesmo que a transcrição/o registro da sessão seja mantido.

## Subagentes aninhados

Por padrão, os subagentes não podem iniciar seus próprios subagentes
(`maxSpawnDepth: 1`). Defina `maxSpawnDepth: 2` para habilitar um nível de
aninhamento — o **padrão de orquestrador**: principal → subagente orquestrador →
sub-subagentes executores.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // permite que subagentes iniciem filhos (padrão: 1, intervalo 1-5)
        maxChildrenPerAgent: 5, // máximo de filhos ativos por sessão de agente (padrão: 5, intervalo 1-20)
        maxConcurrent: 8, // limite global da faixa de simultaneidade (padrão: 8)
        runTimeoutSeconds: 900, // tempo limite padrão para sessions_spawn (0 = sem tempo limite)
        announceTimeoutMs: 120000, // tempo limite por chamada do anúncio do gateway
      },
    },
  },
}
```

### Níveis de profundidade

| Profundidade | Formato da chave de sessão                     | Função                                                | Pode criar?                    |
| ------------ | ---------------------------------------------- | ----------------------------------------------------- | ----------------------------- |
| 0            | `agent:<id>:main`                              | Agente principal                                      | Sempre                        |
| 1            | `agent:<id>:subagent:<uuid>`                   | Subagente (orquestrador quando profundidade 2 permitida) | Somente se `maxSpawnDepth >= 2` |
| 2            | `agent:<id>:subagent:<uuid>:subagent:<uuid>`   | Sub-subagente (trabalhador folha)                     | Nunca                         |

### Cadeia de anúncios

Os resultados retornam pela cadeia:

1. O trabalhador de profundidade 2 termina → anuncia ao seu pai (orquestrador de profundidade 1).
2. O orquestrador de profundidade 1 recebe o anúncio, sintetiza os resultados e termina → anuncia ao principal.
3. O agente principal recebe o anúncio e o entrega ao usuário.

Cada nível vê apenas os anúncios de seus filhos diretos.

<Note>
**Orientação operacional:** inicie o trabalho dos filhos uma vez e aguarde os eventos de conclusão, em vez de criar loops de sondagem em torno de `sessions_list`, `sessions_history`, `/subagents list` ou comandos de espera `exec`.
`sessions_list` e `/subagents list` mantêm os relacionamentos de sessões filhas concentrados no trabalho ativo — filhos ativos permanecem vinculados, filhos encerrados continuam visíveis por uma breve janela recente e vínculos obsoletos de filhos existentes apenas no armazenamento são ignorados após sua janela de atualização. Isso impede que metadados antigos de `spawnedBy` / `parentSessionKey` ressuscitem filhos fantasmas após uma reinicialização. Se um evento de conclusão de um filho chegar depois que você já enviou a resposta final, o acompanhamento correto é o token silencioso exato `NO_REPLY` / `no_reply`.
</Note>

### Política de ferramentas por profundidade

- A função e o escopo de controle são gravados nos metadados da sessão no momento da criação. Isso impede que chaves de sessão planas ou restauradas recuperem acidentalmente privilégios de orquestrador.
- **Profundidade 1 (orquestrador, quando `maxSpawnDepth >= 2`):** recebe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder criar filhos e inspecionar o status deles. Outras ferramentas de sessão/sistema permanecem negadas.
- **Profundidade 1 (folha, quando `maxSpawnDepth == 1`):** nenhuma ferramenta de sessão (comportamento padrão atual).
- **Profundidade 2 (trabalhador folha):** nenhuma ferramenta de sessão — `sessions_spawn` é sempre negada na profundidade 2. Não pode criar mais filhos.

### Limite de criação por agente

Cada sessão de agente (em qualquer profundidade) pode ter no máximo `maxChildrenPerAgent`
(padrão `5`) filhos ativos simultaneamente. Isso evita a expansão descontrolada
a partir de um único orquestrador.

### Interrupção em cascata

Interromper um orquestrador de profundidade 1 interrompe automaticamente todos os seus
filhos de profundidade 2:

- `/stop` no chat principal interrompe todos os agentes de profundidade 1 e propaga a interrupção aos filhos deles de profundidade 2.

## Autenticação

A autenticação do subagente é resolvida pelo **ID do agente**, não pelo tipo de sessão:

- A chave de sessão do subagente é `agent:<agentId>:subagent:<uuid>`.
- O armazenamento de autenticação é carregado a partir do `agentDir` desse agente.
- Os perfis de autenticação do agente principal são mesclados como **fallback**; os perfis do agente substituem os perfis principais em caso de conflitos.

A mesclagem é aditiva, portanto, os perfis principais estão sempre disponíveis como
fallbacks. Ainda não há suporte para autenticação totalmente isolada por agente.

## Anúncio

Os subagentes informam os resultados por meio de uma etapa de anúncio:

- A etapa de anúncio é executada dentro da sessão do subagente (não na sessão do solicitante).
- Se o subagente responder exatamente `ANNOUNCE_SKIP`, nada será publicado.
- Se o texto mais recente do assistente for o token silencioso exato `NO_REPLY` / `no_reply`, a saída do anúncio será suprimida, mesmo que tenha havido progresso visível anteriormente.

A entrega depende da profundidade do solicitante:

- Sessões solicitantes de nível superior usam uma chamada `agent` de acompanhamento com entrega externa (`deliver=true`).
- Sessões de subagentes solicitantes aninhadas recebem uma injeção interna de acompanhamento (`deliver=false`) para que o orquestrador possa sintetizar os resultados dos filhos dentro da sessão.
- Se uma sessão de subagente solicitante aninhada não existir mais, o OpenClaw recorre ao solicitante dessa sessão quando disponível.

Para sessões solicitantes de nível superior, a entrega direta no modo de conclusão primeiro
resolve qualquer rota de conversa/thread vinculada e substituição de hook e, em seguida, preenche
os campos ausentes de canal-destino a partir da rota armazenada da sessão solicitante.
Isso mantém as conclusões no chat/tópico correto, mesmo quando a origem da conclusão
identifica apenas o canal.

A agregação da conclusão dos filhos é limitada à execução atual do solicitante ao
criar constatações de conclusão aninhadas, evitando que saídas obsoletas de filhos
de execuções anteriores vazem para o anúncio atual. As respostas de anúncio preservam
o roteamento de thread/tópico quando disponível nos adaptadores de canal.

### Contexto do anúncio

O contexto do anúncio é normalizado para um bloco de evento interno estável:

| Campo              | Origem                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| Origem             | `subagent` ou `cron`                                                                                        |
| IDs da sessão      | Chave/ID da sessão filha                                                                                    |
| Tipo               | Tipo de anúncio + rótulo da tarefa                                                                          |
| Status             | Derivado do resultado da execução (`ok`, `error`, `timeout` ou `unknown`) — **não** inferido do texto do modelo |
| Conteúdo do resultado | Texto visível mais recente do assistente filho                                                            |
| Acompanhamento     | Instrução que descreve quando responder ou permanecer em silêncio                                           |

Execuções que falharam em estado terminal informam o status de falha sem reproduzir
o texto de resposta capturado. A saída de ferramenta/toolResult não é promovida a texto de resultado do filho.

### Linha de estatísticas

Os payloads de anúncio incluem uma linha de estatísticas ao final (mesmo quando encapsulados):

- Tempo de execução (por exemplo, `runtime 5m12s`).
- Uso de tokens (entrada/saída/total).
- Custo estimado quando o preço do modelo está configurado (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` e o caminho da transcrição para que o agente principal possa buscar o histórico por meio de `sessions_history` ou inspecionar o arquivo no disco.

Os metadados internos destinam-se apenas à orquestração; respostas voltadas ao usuário
devem ser reescritas na voz normal do assistente.

### Por que preferir `sessions_history`

`sessions_history` é o caminho de orquestração mais seguro para ler a transcrição de um filho
durante um turno do agente:

- Oculta textos semelhantes a credenciais/tokens mesmo quando a ocultação de logs de uso geral está desativada.
- Trunca blocos de texto longos (4000 caracteres por bloco) e descarta assinaturas de pensamento, payloads de repetição de raciocínio e dados de imagem inline.
- Impõe um limite de resposta de 80 KB; linhas grandes demais são substituídas por `[sessions_history omitted: message too large]`.
- Use `nextOffset` quando presente para paginar para trás por janelas mais antigas da transcrição.
- `sessions_history` **não** remove tags de raciocínio, estruturas de `<relevant-memories>` nem XML de chamadas de ferramentas do texto da mensagem — retorna blocos de conteúdo estruturados próximos ao formato bruto da transcrição, apenas ocultados e limitados por tamanho. `/subagents log` aplica o sanitizador de prosa mais rigoroso (remove tags de raciocínio, estruturas de memória e XML de chamadas de ferramentas) porque renderiza linhas simples de chat em vez de blocos estruturados.
- A inspeção da transcrição bruta no disco é o fallback quando você precisa da transcrição completa, byte por byte.

## Política de ferramentas

Os subagentes usam primeiro o mesmo perfil e pipeline de política de ferramentas do agente pai ou
de destino. Depois disso, o OpenClaw aplica a camada de restrição de subagentes.

Os subagentes sempre perdem `gateway`, `agents_list`, `session_status` e
`cron`, independentemente da profundidade ou função (ferramentas interativas/em nível de sistema ou
ferramentas que o agente principal deve coordenar). Subagentes folha (comportamento padrão de profundidade 1
e sempre na profundidade 2) também perdem `subagents`,
`sessions_list`, `sessions_history` e `sessions_spawn`. Os subagentes nunca
recebem a ferramenta `message` — ela é desativada no momento da criação, não filtrada por
esta lista de negação — e `sessions_send` permanece negada para que os subagentes
se comuniquem apenas pela cadeia de anúncios.

`sessions_history` também permanece uma visualização de recuperação limitada e sanitizada aqui — não é
um despejo bruto da transcrição.

Quando `maxSpawnDepth >= 2`, os subagentes orquestradores de profundidade 1 também
recebem `sessions_spawn`, `subagents`, `sessions_list` e
`sessions_history` para poderem gerenciar seus filhos.

### Substituição por configuração

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
        // a negação prevalece
        deny: ["gateway", "cron"],
        // se allow estiver definido, ele se tornará exclusivamente permissivo (a negação ainda prevalece)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` é um filtro final exclusivamente permissivo. Ele pode restringir
o conjunto de ferramentas já resolvido, mas não pode **adicionar novamente** uma ferramenta removida
por `tools.profile`. Por exemplo, `tools.profile: "coding"` inclui
`web_search`/`web_fetch`, mas não a ferramenta `browser`. Para permitir que
subagentes com perfil de programação usem automação de navegador, adicione o navegador na
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

Os subagentes usam uma faixa dedicada da fila no processo:

- **Nome da faixa:** `subagent`
- **Concorrência:** `agents.defaults.subagents.maxConcurrent` (padrão `8`)

## Atividade e recuperação

O OpenClaw não trata a ausência de `endedAt` como prova permanente de que um
subagente ainda está ativo. Execuções não encerradas mais antigas que a janela de execução obsoleta
(2 horas ou o tempo limite de execução configurado mais um curto período de tolerância,
o que for maior) deixam de contar como ativas/pendentes em `/subagents list`,
resumos de status, bloqueio de conclusão de descendentes e verificações de
concorrência por sessão.

Após uma reinicialização do gateway, execuções restauradas obsoletas e não encerradas são removidas, a menos que
a sessão filha esteja marcada como `abortedLastRun: true`. Execuções interrompidas pela reinicialização
permanecem registradas para o fluxo de recuperação de subagentes órfãos: execuções
obsoletas são finalizadas sem retomada, enquanto sessões filhas recentes recebem
uma mensagem sintética de retomada antes que o marcador de interrupção seja removido.

A recuperação automática após reinicialização é limitada por sessão filha. Se o mesmo
subagente filho for aceito repetidamente para recuperação de órfãos dentro da
janela de reincidência rápida, o OpenClaw persiste uma lápide de recuperação nessa
sessão e deixa de retomá-la automaticamente em reinicializações posteriores. Execute
`openclaw tasks maintenance --apply` para reconciliar o registro da tarefa ou
`openclaw doctor --fix` para limpar sinalizadores obsoletos de recuperação interrompida em
sessões com lápide.

<Note>
Se a criação de um subagente falhar com Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, verifique o chamador RPC antes de editar o estado de pareamento.
A coordenação interna de `sessions_spawn` é despachada no processo quando o
chamador já está sendo executado dentro do contexto da solicitação do gateway, portanto, não
abre um WebSocket de loopback nem depende da linha de base de escopo do dispositivo pareado
da CLI. Chamadores fora do processo do gateway ainda usam o fallback
de WebSocket como `client.id: "gateway-client"` com `client.mode: "backend"`
por meio de autenticação direta de token compartilhado/senha em loopback. Chamadores remotos, `deviceIdentity`
explícito, caminhos explícitos de token de dispositivo e clientes de navegador/node
ainda precisam da aprovação normal do dispositivo para ampliações de escopo.
</Note>

## Interrupção

- Enviar `/stop` no chat do solicitante interrompe a sessão solicitante e todas as execuções ativas de subagentes criadas por ela, propagando a interrupção aos filhos aninhados.

## Limitações

- O anúncio de subagente é feito em regime de **melhor esforço**. Se o Gateway reiniciar, o trabalho pendente de "anunciar de volta" será perdido.
- Os subagentes ainda compartilham os mesmos recursos do processo do Gateway; trate `maxConcurrent` como uma válvula de segurança.
- `sessions_spawn` é sempre não bloqueante: retorna `{ status: "accepted", runId, childSessionKey }` imediatamente.
- O contexto do subagente injeta apenas `AGENTS.md` e `TOOLS.md` (sem `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` ou `BOOTSTRAP.md`). Os subagentes nativos do Codex seguem o mesmo limite: `TOOLS.md` permanece nas instruções herdadas da thread do Codex, enquanto os arquivos de persona, identidade e usuário exclusivos do agente pai são injetados como instruções de colaboração com escopo restrito ao turno, para que os agentes filhos não os clonem.
- A profundidade máxima de aninhamento é 5 (intervalo de `maxSpawnDepth`: 1-5). A profundidade 2 é recomendada para a maioria dos casos de uso.
- `maxChildrenPerAgent` limita o número de agentes filhos ativos por sessão (padrão `5`, intervalo `1-20`).

## Relacionado

- [Ferramentas de sessão e alterações de estado](/pt-BR/concepts/session-tool)
- [Agentes ACP](/pt-BR/tools/acp-agents)
- [Envio para agente](/pt-BR/tools/agent-send)
- [Tarefas em segundo plano](/pt-BR/automation/tasks)
- [Ferramentas de sandbox multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
