---
read_when:
    - Você quer trabalho em segundo plano/paralelo por meio do agente
    - Você está alterando `sessions_spawn` ou a política de ferramenta de subagente
    - Você está implementando ou solucionando problemas de sessões de subagente vinculadas a thread
summary: 'Subagentes: iniciando execuções isoladas de agentes que anunciam os resultados de volta no chat solicitante'
title: Subagentes
x-i18n:
    generated_at: "2026-04-25T18:22:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70195000c4326baba38a9a096dc8d6db178f754f345ad05d122902ee1216ab1c
    source_path: tools/subagents.md
    workflow: 15
---

Subagentes são execuções de agentes em segundo plano iniciadas a partir de uma execução de agente existente. Eles são executados em sua própria sessão (`agent:<agentId>:subagent:<uuid>`) e, quando terminam, **anunciam** seu resultado de volta ao canal de chat solicitante. Cada execução de subagente é rastreada como uma [tarefa em segundo plano](/pt-BR/automation/tasks).

## Comando slash

Use `/subagents` para inspecionar ou controlar execuções de subagentes da **sessão atual**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Controles de vínculo com thread:

Esses comandos funcionam em canais com suporte a vínculos persistentes de thread. Consulte **Canais com suporte a thread** abaixo.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` mostra metadados da execução (status, timestamps, id da sessão, caminho do transcript, limpeza).
Use `sessions_history` para uma visualização limitada e filtrada por segurança de recall; inspecione o
caminho do transcript em disco quando precisar do transcript bruto completo.

### Comportamento de spawn

`/subagents spawn` inicia um subagente em segundo plano como um comando do usuário, não um relay interno, e envia uma atualização final de conclusão de volta ao chat solicitante quando a execução termina.

- O comando spawn é não bloqueante; ele retorna imediatamente um id de execução.
- Ao concluir, o subagente anuncia uma mensagem de resumo/resultado de volta ao canal de chat solicitante.
- A entrega da conclusão é baseada em push. Depois de iniciado, não faça polling de `/subagents list`,
  `sessions_list` ou `sessions_history` em loop apenas para esperar que ele
  termine; inspecione o status apenas sob demanda para depuração ou intervenção.
- Ao concluir, o OpenClaw fecha, com melhor esforço, abas/processos de navegador rastreados abertos por essa sessão de subagente antes de o fluxo de limpeza do anúncio continuar.
- Para spawns manuais, a entrega é resiliente:
  - O OpenClaw tenta primeiro a entrega direta de `agent` com uma chave estável de idempotência.
  - Se a entrega direta falhar, ele usa fallback para roteamento em fila.
  - Se o roteamento em fila ainda não estiver disponível, o anúncio é tentado novamente com um curto backoff exponencial antes da desistência final.
- A entrega da conclusão mantém a rota resolvida do solicitante:
  - rotas de conclusão vinculadas a thread ou à conversa prevalecem quando disponíveis
  - se a origem da conclusão fornecer apenas um canal, o OpenClaw preenche o alvo/conta ausente a partir da rota resolvida da sessão solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que a entrega direta ainda funcione
- O handoff de conclusão para a sessão solicitante é um contexto interno gerado em runtime (não texto criado pelo usuário) e inclui:
  - `Result` (texto mais recente de resposta `assistant` visível ou, caso contrário, texto mais recente higienizado de tool/toolResult; execuções com falha terminal não reutilizam texto de resposta capturado)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - estatísticas compactas de runtime/tokens
  - uma instrução de entrega dizendo ao agente solicitante para reescrever em voz normal de assistente (não encaminhar metadados internos brutos)
- `--model` e `--thinking` substituem os padrões para essa execução específica.
- Use `info`/`log` para inspecionar detalhes e saída após a conclusão.
- `/subagents spawn` é modo de execução única (`mode: "run"`). Para sessões persistentes vinculadas a thread, use `sessions_spawn` com `thread: true` e `mode: "session"`.
- Para sessões de harness ACP (Codex, Claude Code, Gemini CLI), use `sessions_spawn` com `runtime: "acp"` e consulte [Agentes ACP](/pt-BR/tools/acp-agents), especialmente o [modelo de entrega ACP](/pt-BR/tools/acp-agents#delivery-model) ao depurar conclusões ou loops agente a agente.

Objetivos principais:

- Paralelizar trabalho de "pesquisa / tarefa longa / ferramenta lenta" sem bloquear a execução principal.
- Manter subagentes isolados por padrão (separação de sessão + sandboxing opcional).
- Manter a superfície de ferramentas difícil de usar incorretamente: subagentes **não** recebem ferramentas de sessão por padrão.
- Dar suporte a profundidade de aninhamento configurável para padrões de orquestrador.

Observação de custo: cada subagente tem seu **próprio** contexto e uso de tokens por padrão. Para tarefas pesadas ou
repetitivas, defina um modelo mais barato para subagentes e mantenha seu agente principal em um
modelo de maior qualidade. Você pode configurar isso via `agents.defaults.subagents.model` ou com
substituições por agente. Quando um filho realmente precisar do transcript atual do solicitante, o agente pode solicitar
`context: "fork"` nesse spawn específico.

## Modos de contexto

Subagentes nativos começam isolados, a menos que o chamador solicite explicitamente um fork do
transcript atual.

| Modo       | Quando usá-lo                                                                                                                         | Comportamento                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Pesquisa nova, implementação independente, trabalho com ferramenta lenta ou qualquer coisa que possa ser descrita brevemente no texto da tarefa | Cria um transcript filho limpo. Este é o padrão e mantém o uso de tokens menor. |
| `fork`     | Trabalho que depende da conversa atual, de resultados anteriores de ferramentas ou de instruções sutis já presentes no transcript do solicitante | Ramifica o transcript do solicitante na sessão filha antes de o filho começar. |

Use `fork` com moderação. Ele serve para delegação sensível ao contexto, não como substituto
para escrever um prompt de tarefa claro.

## Ferramenta

Use `sessions_spawn`:

- Inicia uma execução de subagente (`deliver: false`, lane global: `subagent`)
- Depois executa uma etapa de anúncio e publica a resposta de anúncio no canal de chat solicitante
- Modelo padrão: herda do chamador, a menos que você defina `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` por agente); um `sessions_spawn.model` explícito ainda prevalece.
- Thinking padrão: herda do chamador, a menos que você defina `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` por agente); um `sessions_spawn.thinking` explícito ainda prevalece.
- Timeout padrão da execução: se `sessions_spawn.runTimeoutSeconds` for omitido, o OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário, usa fallback para `0` (sem timeout).

Parâmetros da ferramenta:

- `task` (obrigatório)
- `label?` (opcional)
- `agentId?` (opcional; inicia sob outro id de agente se permitido)
- `model?` (opcional; substitui o modelo do subagente; valores inválidos são ignorados e o subagente é executado no modelo padrão com um aviso no resultado da ferramenta)
- `thinking?` (opcional; substitui o nível de thinking para a execução do subagente)
- `runTimeoutSeconds?` (usa `agents.defaults.subagents.runTimeoutSeconds` por padrão quando definido, caso contrário `0`; quando definido, a execução do subagente é abortada após N segundos)
- `thread?` (padrão `false`; quando `true`, solicita vínculo de thread do canal para esta sessão de subagente)
- `mode?` (`run|session`)
  - o padrão é `run`
  - se `thread: true` e `mode` for omitido, o padrão passa a ser `session`
  - `mode: "session"` exige `thread: true`
- `cleanup?` (`delete|keep`, padrão `keep`)
- `sandbox?` (`inherit|require`, padrão `inherit`; `require` rejeita o spawn a menos que o runtime filho de destino esteja em sandbox)
- `context?` (`isolated|fork`, padrão `isolated`; somente subagentes nativos)
  - `isolated` cria um transcript filho limpo e é o padrão.
  - `fork` ramifica o transcript atual do solicitante para a sessão filha, de modo que o filho comece com o mesmo contexto de conversa.
  - Use `fork` apenas quando o filho precisar do transcript atual. Para trabalho com escopo definido, omita `context`.
- `sessions_spawn` **não** aceita parâmetros de entrega por canal (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Para entrega, use `message`/`sessions_send` a partir da execução iniciada.

## Sessões vinculadas a thread

Quando vínculos de thread estão habilitados para um canal, um subagente pode permanecer vinculado a uma thread para que mensagens subsequentes do usuário nessa thread continuem sendo roteadas para a mesma sessão de subagente.

### Canais com suporte a thread

- Discord (atualmente o único canal compatível): oferece suporte a sessões persistentes de subagentes vinculadas a thread (`sessions_spawn` com `thread: true`), controles manuais de thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) e chaves de adaptador `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` e `channels.discord.threadBindings.spawnSubagentSessions`.

Fluxo rápido:

1. Inicie com `sessions_spawn` usando `thread: true` (e opcionalmente `mode: "session"`).
2. O OpenClaw cria ou vincula uma thread a esse destino de sessão no canal ativo.
3. Respostas e mensagens subsequentes nessa thread são roteadas para a sessão vinculada.
4. Use `/session idle` para inspecionar/atualizar o desfoco automático por inatividade e `/session max-age` para controlar o limite rígido.
5. Use `/unfocus` para desvincular manualmente.

Controles manuais:

- `/focus <target>` vincula a thread atual (ou cria uma) a um destino de subagente/sessão.
- `/unfocus` remove o vínculo da thread vinculada atual.
- `/agents` lista execuções ativas e o estado do vínculo (`thread:<id>` ou `unbound`).
- `/session idle` e `/session max-age` funcionam apenas para threads vinculadas com foco.

Chaves de configuração:

- Padrão global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- As substituições por canal e as chaves de vínculo automático no spawn são específicas do adaptador. Consulte **Canais com suporte a thread** acima.

Consulte [Referência de configuração](/pt-BR/gateway/configuration-reference) e [Comandos slash](/pt-BR/tools/slash-commands) para detalhes atuais do adaptador.

Lista de permissões:

- `agents.list[].subagents.allowAgents`: lista de ids de agente que podem ser direcionados via `agentId` (`["*"]` para permitir qualquer). Padrão: apenas o agente solicitante.
- `agents.defaults.subagents.allowAgents`: lista de permissões padrão de agentes de destino usada quando o agente solicitante não define sua própria `subagents.allowAgents`.
- Proteção de herança de sandbox: se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeita destinos que seriam executados sem sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: quando true, bloqueia chamadas `sessions_spawn` que omitem `agentId` (força seleção explícita de perfil). Padrão: false.

Descoberta:

- Use `agents_list` para ver quais ids de agente estão atualmente permitidos para `sessions_spawn`.

Autoarquivamento:

- Sessões de subagente são arquivadas automaticamente após `agents.defaults.subagents.archiveAfterMinutes` (padrão: 60).
- O arquivamento usa `sessions.delete` e renomeia o transcript para `*.deleted.<timestamp>` (mesma pasta).
- `cleanup: "delete"` arquiva imediatamente após o anúncio (ainda mantém o transcript via renomeação).
- O autoarquivamento é feito com melhor esforço; timers pendentes são perdidos se o gateway reiniciar.
- `runTimeoutSeconds` **não** faz autoarquivamento; ele apenas interrompe a execução. A sessão permanece até o autoarquivamento.
- O autoarquivamento se aplica igualmente a sessões de profundidade 1 e profundidade 2.
- A limpeza do navegador é separada da limpeza de arquivamento: abas/processos de navegador rastreados são fechados com melhor esforço quando a execução termina, mesmo que o registro da sessão/transcript seja mantido.

## Subagentes aninhados

Por padrão, subagentes não podem iniciar seus próprios subagentes (`maxSpawnDepth: 1`). Você pode habilitar um nível de aninhamento definindo `maxSpawnDepth: 2`, o que permite o **padrão de orquestrador**: principal → subagente orquestrador → sub-subagentes workers.

### Como habilitar

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // permite que subagentes iniciem filhos (padrão: 1)
        maxChildrenPerAgent: 5, // máximo de filhos ativos por sessão de agente (padrão: 5)
        maxConcurrent: 8, // limite global de concorrência da lane (padrão: 8)
        runTimeoutSeconds: 900, // timeout padrão para sessions_spawn quando omitido (0 = sem timeout)
      },
    },
  },
}
```

### Níveis de profundidade

| Profundidade | Formato da chave de sessão                  | Papel                                         | Pode iniciar?                |
| ------------ | ------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0            | `agent:<id>:main`                           | Agente principal                              | Sempre                       |
| 1            | `agent:<id>:subagent:<uuid>`                | Subagente (orquestrador quando profundidade 2 é permitida) | Somente se `maxSpawnDepth >= 2` |
| 2            | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagente (worker folha)                  | Nunca                        |

### Cadeia de anúncio

Os resultados retornam pela cadeia:

1. O worker de profundidade 2 termina → anuncia para seu pai (orquestrador de profundidade 1)
2. O orquestrador de profundidade 1 recebe o anúncio, sintetiza os resultados, termina → anuncia para o principal
3. O agente principal recebe o anúncio e entrega ao usuário

Cada nível vê apenas anúncios de seus filhos diretos.

Orientação operacional:

- Inicie o trabalho filho uma vez e espere pelos eventos de conclusão em vez de criar loops de polling
  em torno de `sessions_list`, `sessions_history`, `/subagents list` ou
  comandos `exec` com sleep.
- `sessions_list` e `/subagents list` mantêm os relacionamentos de sessões filhas focados
  em trabalho ativo: filhos ativos permanecem vinculados, filhos encerrados continuam visíveis por uma
  curta janela recente, e links de filhos obsoletos apenas no armazenamento são ignorados após sua
  janela de validade. Isso impede que metadados antigos `spawnedBy` / `parentSessionKey`
  ressuscitem filhos fantasma após reinicialização.
- Se um evento de conclusão de filho chegar depois que você já enviou a resposta final,
  o acompanhamento correto é o token silencioso exato `NO_REPLY` / `no_reply`.

### Política de ferramentas por profundidade

- O papel e o escopo de controle são gravados nos metadados da sessão no momento do spawn. Isso evita que chaves de sessão planas ou restauradas recuperem acidentalmente privilégios de orquestrador.
- **Profundidade 1 (orquestrador, quando `maxSpawnDepth >= 2`)**: recebe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder gerenciar seus filhos. Outras ferramentas de sessão/sistema continuam negadas.
- **Profundidade 1 (folha, quando `maxSpawnDepth == 1`)**: sem ferramentas de sessão (comportamento padrão atual).
- **Profundidade 2 (worker folha)**: sem ferramentas de sessão — `sessions_spawn` é sempre negado na profundidade 2. Não pode iniciar mais filhos.

### Limite de spawn por agente

Cada sessão de agente (em qualquer profundidade) pode ter no máximo `maxChildrenPerAgent` (padrão: 5) filhos ativos ao mesmo tempo. Isso evita fan-out descontrolado de um único orquestrador.

### Interrupção em cascata

Interromper um orquestrador de profundidade 1 interrompe automaticamente todos os seus filhos de profundidade 2:

- `/stop` no chat principal interrompe todos os agentes de profundidade 1 e faz cascata para seus filhos de profundidade 2.
- `/subagents kill <id>` interrompe um subagente específico e faz cascata para seus filhos.
- `/subagents kill all` interrompe todos os subagentes do solicitante e faz cascata.

## Autenticação

A autenticação do subagente é resolvida por **id do agente**, não por tipo de sessão:

- A chave da sessão do subagente é `agent:<agentId>:subagent:<uuid>`.
- O armazenamento de autenticação é carregado a partir de `agentDir` desse agente.
- Os perfis de autenticação do agente principal são mesclados como **fallback**; perfis do agente substituem perfis do principal em caso de conflito.

Observação: a mesclagem é aditiva, então os perfis do principal estão sempre disponíveis como fallback. Autenticação totalmente isolada por agente ainda não é suportada.

## Anúncio

Subagentes reportam de volta por meio de uma etapa de anúncio:

- A etapa de anúncio é executada dentro da sessão do subagente (não na sessão do solicitante).
- Se o subagente responder exatamente `ANNOUNCE_SKIP`, nada é publicado.
- Se o texto mais recente do assistente for o token silencioso exato `NO_REPLY` / `no_reply`,
  a saída do anúncio é suprimida mesmo que tenha havido progresso visível anteriormente.
- Caso contrário, a entrega depende da profundidade do solicitante:
  - sessões solicitantes de nível superior usam uma chamada de `agent` de acompanhamento com entrega externa (`deliver=true`)
  - sessões solicitantes aninhadas de subagente recebem uma injeção interna de acompanhamento (`deliver=false`) para que o orquestrador possa sintetizar os resultados dos filhos em sessão
  - se uma sessão solicitante aninhada de subagente não existir mais, o OpenClaw usa fallback para o solicitante dessa sessão quando disponível
- Para sessões solicitantes de nível superior, a entrega direta em modo de conclusão primeiro resolve qualquer rota vinculada de conversa/thread e substituição de hook, depois preenche campos ausentes de alvo de canal a partir da rota armazenada da sessão solicitante. Isso mantém as conclusões no chat/tópico correto mesmo quando a origem da conclusão identifica apenas o canal.
- A agregação de conclusões de filhos é limitada à execução solicitante atual ao montar achados de conclusão aninhados, evitando que saídas antigas de filhos de execuções anteriores vazem para o anúncio atual.
- Respostas de anúncio preservam o roteamento de thread/tópico quando disponível nos adaptadores de canal.
- O contexto de anúncio é normalizado em um bloco estável de evento interno:
  - origem (`subagent` ou `cron`)
  - chave/id da sessão filha
  - tipo de anúncio + rótulo da tarefa
  - linha de status derivada dos sinais de resultado do runtime (`success`, `error`, `timeout` ou `unknown`)
  - conteúdo do resultado selecionado do texto visível mais recente do assistente ou, caso contrário, do texto mais recente higienizado de tool/toolResult; execuções com falha terminal relatam status de falha sem reproduzir texto de resposta capturado
  - uma instrução de acompanhamento descrevendo quando responder versus quando permanecer silencioso
- `Status` não é inferido a partir da saída do modelo; ele vem dos sinais de resultado do runtime.
- Em timeout, se o filho passou apenas por chamadas de ferramenta, o anúncio pode colapsar esse histórico em um breve resumo de progresso parcial em vez de reproduzir saída bruta de ferramenta.

As cargas de anúncio incluem uma linha de estatísticas no final (mesmo quando encapsuladas):

- Runtime (por exemplo, `runtime 5m12s`)
- Uso de tokens (entrada/saída/total)
- Custo estimado quando o preço do modelo está configurado (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` e caminho do transcript (para que o agente principal possa buscar histórico via `sessions_history` ou inspecionar o arquivo em disco)
- Metadados internos são destinados apenas à orquestração; respostas voltadas ao usuário devem ser reescritas em voz normal de assistente.

`sessions_history` é o caminho de orquestração mais seguro:

- o recall do assistente é normalizado primeiro:
  - tags de thinking são removidas
  - blocos de estrutura `<relevant-memories>` / `<relevant_memories>` são removidos
  - blocos de payload XML de chamada de ferramenta em texto simples, como `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>` são removidos, incluindo payloads
    truncados que nunca se fecham corretamente
  - estruturas rebaixadas de tool-call/result e marcadores de contexto histórico são removidos
  - tokens vazados de controle do modelo, como `<|assistant|>`, outros tokens ASCII
    `<|...|>` e variantes de largura completa `<｜...｜>` são removidos
  - XML malformado de chamada de ferramenta do MiniMax é removido
- texto semelhante a credencial/token é redigido
- blocos longos podem ser truncados
- históricos muito grandes podem descartar linhas mais antigas ou substituir uma linha superdimensionada por
  `[sessions_history omitted: message too large]`
- a inspeção bruta do transcript em disco é o fallback quando você precisa do transcript completo byte a byte

## Política de ferramentas (ferramentas de subagente)

Subagentes usam primeiro o mesmo perfil e pipeline de política de ferramentas do agente pai ou de destino.
Depois disso, o OpenClaw aplica a camada de restrição de subagente.

Sem `tools.profile` restritivo, subagentes recebem **todas as ferramentas exceto ferramentas de sessão**
e ferramentas de sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` continua sendo uma visualização de recall limitada e higienizada aqui também; não
é um dump bruto de transcript.

Quando `maxSpawnDepth >= 2`, subagentes orquestradores de profundidade 1 recebem adicionalmente `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` para que possam gerenciar seus filhos.

Substitua via configuração:

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
        // deny prevalece
        deny: ["gateway", "cron"],
        // se allow for definido, ele se torna allow-only (deny ainda prevalece)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` é um filtro final somente allow. Ele pode restringir o
conjunto de ferramentas já resolvido, mas não pode readicionar uma ferramenta removida por
`tools.profile`. Por exemplo, `tools.profile: "coding"` inclui
`web_search`/`web_fetch`, mas não a ferramenta `browser`. Para permitir que subagentes
com perfil coding usem automação de navegador, adicione browser no estágio do perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Use `agents.list[].tools.alsoAllow: ["browser"]` por agente quando apenas um agente
deve receber automação de navegador.

## Concorrência

Subagentes usam uma lane dedicada de fila em processo:

- Nome da lane: `subagent`
- Concorrência: `agents.defaults.subagents.maxConcurrent` (padrão `8`)

## Vivacidade e recuperação

O OpenClaw não trata a ausência de `endedAt` como prova permanente de que um subagente
ainda está ativo. Execuções não encerradas mais antigas que a janela de execução obsoleta deixam de contar como
ativas/pendentes em `/subagents list`, resumos de status, bloqueio de conclusão de descendentes
e verificações de concorrência por sessão.

Após uma reinicialização do gateway, execuções restauradas obsoletas e não encerradas são removidas, a menos que sua
sessão filha esteja marcada com `abortedLastRun: true`. Essas sessões filhas abortadas na reinicialização continuam recuperáveis por meio do fluxo de recuperação de órfãos de subagente, que envia uma mensagem sintética de retomada antes de limpar o marcador de abortado.

## Interrupção

- Enviar `/stop` no chat solicitante aborta a sessão solicitante e interrompe quaisquer execuções ativas de subagente iniciadas a partir dela, fazendo cascata para filhos aninhados.
- `/subagents kill <id>` interrompe um subagente específico e faz cascata para seus filhos.

## Limitações

- O anúncio do subagente é feito com **melhor esforço**. Se o gateway reiniciar, o trabalho pendente de "anunciar de volta" será perdido.
- Subagentes ainda compartilham os mesmos recursos do processo do gateway; trate `maxConcurrent` como uma válvula de segurança.
- `sessions_spawn` é sempre não bloqueante: ele retorna `{ status: "accepted", runId, childSessionKey }` imediatamente.
- O contexto do subagente injeta apenas `AGENTS.md` + `TOOLS.md` (sem `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ou `BOOTSTRAP.md`).
- A profundidade máxima de aninhamento é 5 (intervalo de `maxSpawnDepth`: 1–5). Profundidade 2 é recomendada para a maioria dos casos de uso.
- `maxChildrenPerAgent` limita filhos ativos por sessão (padrão: 5, intervalo: 1–20).

## Relacionado

- [Agentes ACP](/pt-BR/tools/acp-agents)
- [Ferramentas de sandbox multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
- [Envio de agente](/pt-BR/tools/agent-send)
