---
read_when:
    - Você quer trabalho em segundo plano/paralelo via o agente
    - Você está alterando a política de ferramenta sessions_spawn ou de subagente
    - Você está implementando ou depurando sessões de subagente vinculadas a thread
summary: 'Subagentes: iniciar execuções isoladas de agentes que anunciam os resultados de volta ao chat solicitante'
title: Subagentes
x-i18n:
    generated_at: "2026-04-24T06:18:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23202b1761e372e547b02183cb68056043aed04b5620db8b222cbfc7e6cd97ab
    source_path: tools/subagents.md
    workflow: 15
---

Subagentes são execuções de agente em segundo plano iniciadas a partir de uma execução de agente existente. Eles rodam em sua própria sessão (`agent:<agentId>:subagent:<uuid>`) e, quando terminam, **anunciam** seu resultado de volta ao canal de chat do solicitante. Cada execução de subagente é rastreada como uma [tarefa em segundo plano](/pt-BR/automation/tasks).

## Comando slash

Use `/subagents` para inspecionar ou controlar execuções de subagente da **sessão atual**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Controles de binding de thread:

Esses comandos funcionam em canais com suporte a bindings persistentes de thread. Consulte **Canais com suporte a thread** abaixo.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` mostra metadados da execução (status, timestamps, session id, caminho da transcrição, cleanup).
Use `sessions_history` para uma visualização limitada e filtrada com segurança de recall; inspecione o caminho da transcrição em disco quando precisar da transcrição bruta completa.

### Comportamento de spawn

`/subagents spawn` inicia um subagente em segundo plano como comando do usuário, não como relay interno, e envia uma atualização final de conclusão de volta ao chat do solicitante quando a execução termina.

- O comando de spawn não bloqueia; ele retorna imediatamente um ID de execução.
- Ao concluir, o subagente anuncia uma mensagem de resumo/resultado de volta ao canal de chat do solicitante.
- A entrega da conclusão é baseada em push. Depois de iniciado, não faça polling em `/subagents list`,
  `sessions_list` ou `sessions_history` em loop apenas para esperar a
  conclusão; inspecione status apenas sob demanda para depuração ou intervenção.
- Na conclusão, o OpenClaw faz o melhor esforço para fechar abas/processos rastreados de browser abertos por aquela sessão de subagente antes de o fluxo de cleanup do anúncio continuar.
- Para spawns manuais, a entrega é resiliente:
  - O OpenClaw tenta primeiro entrega direta por `agent` com uma chave estável de idempotência.
  - Se a entrega direta falhar, usa fallback para roteamento de fila.
  - Se o roteamento de fila ainda não estiver disponível, o anúncio é tentado novamente com um backoff exponencial curto antes da desistência final.
- A entrega de conclusão preserva a rota resolvida do solicitante:
  - rotas de conclusão vinculadas a thread ou conversa vencem quando disponíveis
  - se a origem da conclusão fornecer apenas um canal, o OpenClaw preenche o destino/conta ausente a partir da rota resolvida da sessão do solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que a entrega direta ainda funcione
- O handoff de conclusão para a sessão do solicitante é um contexto interno gerado em runtime (não texto criado pelo usuário) e inclui:
  - `Result` (último texto visível de resposta `assistant`, caso contrário o texto sanitizado mais recente de tool/toolResult; execuções terminais com falha não reutilizam texto de resposta capturado)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - estatísticas compactas de runtime/token
  - uma instrução de entrega dizendo ao agente solicitante para reescrever em voz normal de assistente (não encaminhar metadados internos brutos)
- `--model` e `--thinking` substituem os padrões para aquela execução específica.
- Use `info`/`log` para inspecionar detalhes e saída após a conclusão.
- `/subagents spawn` é modo one-shot (`mode: "run"`). Para sessões persistentes vinculadas a thread, use `sessions_spawn` com `thread: true` e `mode: "session"`.
- Para sessões de harness ACP (Codex, Claude Code, Gemini CLI), use `sessions_spawn` com `runtime: "acp"` e consulte [ACP Agents](/pt-BR/tools/acp-agents), especialmente o [modelo de entrega do ACP](/pt-BR/tools/acp-agents#delivery-model) ao depurar conclusões ou loops agente-para-agente.

Objetivos principais:

- Paralelizar trabalho de “pesquisa / tarefa longa / ferramenta lenta” sem bloquear a execução principal.
- Manter subagentes isolados por padrão (separação de sessão + sandboxing opcional).
- Manter a superfície de ferramentas difícil de usar incorretamente: subagentes **não** recebem ferramentas de sessão por padrão.
- Oferecer suporte a profundidade configurável de aninhamento para padrões de orquestrador.

Observação de custo: cada subagente tem seu **próprio** contexto e consumo de tokens por padrão. Para tarefas pesadas ou
repetitivas, defina um modelo mais barato para subagentes e mantenha o agente principal em um
modelo de maior qualidade. Você pode configurar isso via `agents.defaults.subagents.model` ou substituições
por agente. Quando um filho realmente precisar da transcrição atual do solicitante, o agente pode solicitar
`context: "fork"` naquele spawn específico.

## Ferramenta

Use `sessions_spawn`:

- Inicia uma execução de subagente (`deliver: false`, lane global: `subagent`)
- Depois executa uma etapa de anúncio e publica a resposta de anúncio no canal de chat do solicitante
- Modelo padrão: herda do chamador, a menos que você defina `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` por agente); um `sessions_spawn.model` explícito ainda vence.
- Thinking padrão: herda do chamador, a menos que você defina `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` por agente); um `sessions_spawn.thinking` explícito ainda vence.
- Timeout padrão de execução: se `sessions_spawn.runTimeoutSeconds` for omitido, o OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário, usa fallback para `0` (sem timeout).

Parâmetros da ferramenta:

- `task` (obrigatório)
- `label?` (opcional)
- `agentId?` (opcional; inicia sob outro ID de agente, se permitido)
- `model?` (opcional; substitui o modelo do subagente; valores inválidos são ignorados e o subagente roda com o modelo padrão, com um aviso no resultado da ferramenta)
- `thinking?` (opcional; substitui o nível de thinking para a execução do subagente)
- `runTimeoutSeconds?` (usa por padrão `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário `0`; quando definido, a execução do subagente é abortada após N segundos)
- `thread?` (padrão `false`; quando `true`, solicita binding de thread de canal para esta sessão de subagente)
- `mode?` (`run|session`)
  - o padrão é `run`
  - se `thread: true` e `mode` for omitido, o padrão passa a ser `session`
  - `mode: "session"` exige `thread: true`
- `cleanup?` (`delete|keep`, padrão `keep`)
- `sandbox?` (`inherit|require`, padrão `inherit`; `require` rejeita o spawn a menos que o runtime filho de destino esteja em sandbox)
- `context?` (`isolated|fork`, padrão `isolated`; apenas subagentes nativos)
  - `isolated` cria uma transcrição limpa do filho e é o padrão.
  - `fork` ramifica a transcrição atual do solicitante para a sessão filha, de modo que o filho comece com o mesmo contexto da conversa.
  - Use `fork` apenas quando o filho precisar da transcrição atual. Para trabalho com escopo limitado, omita `context`.
- `sessions_spawn` **não** aceita parâmetros de entrega por canal (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Para entrega, use `message`/`sessions_send` da execução iniciada.

## Sessões vinculadas a thread

Quando bindings de thread estão habilitados para um canal, um subagente pode permanecer vinculado a uma thread para que mensagens subsequentes do usuário naquela thread continuem sendo roteadas para a mesma sessão de subagente.

### Canais com suporte a thread

- Discord (atualmente o único canal compatível): oferece suporte a sessões persistentes de subagente vinculadas a thread (`sessions_spawn` com `thread: true`), controles manuais de thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) e chaves de adapter `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` e `channels.discord.threadBindings.spawnSubagentSessions`.

Fluxo rápido:

1. Inicie com `sessions_spawn` usando `thread: true` (e opcionalmente `mode: "session"`).
2. O OpenClaw cria ou vincula uma thread a esse alvo de sessão no canal ativo.
3. Respostas e mensagens subsequentes naquela thread são roteadas para a sessão vinculada.
4. Use `/session idle` para inspecionar/atualizar o desfoco automático por inatividade e `/session max-age` para controlar o limite rígido.
5. Use `/unfocus` para desvincular manualmente.

Controles manuais:

- `/focus <target>` vincula a thread atual (ou cria uma) a um alvo de subagente/sessão.
- `/unfocus` remove o binding da thread vinculada atual.
- `/agents` lista execuções ativas e estado de binding (`thread:<id>` ou `unbound`).
- `/session idle` e `/session max-age` só funcionam para threads vinculadas e em foco.

Chaves de configuração:

- Padrão global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Substituições por canal e chaves de binding automático de spawn são específicas do adapter. Consulte **Canais com suporte a thread** acima.

Consulte [Referência de Configuração](/pt-BR/gateway/configuration-reference) e [Comandos slash](/pt-BR/tools/slash-commands) para detalhes atuais do adapter.

Allowlist:

- `agents.list[].subagents.allowAgents`: lista de IDs de agente que podem ser direcionados via `agentId` (`["*"]` para permitir qualquer um). Padrão: apenas o agente solicitante.
- `agents.defaults.subagents.allowAgents`: allowlist padrão de agentes de destino usada quando o agente solicitante não define sua própria `subagents.allowAgents`.
- Proteção de herança de sandbox: se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeita alvos que seriam executados sem sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: quando true, bloqueia chamadas de `sessions_spawn` que omitem `agentId` (força seleção explícita de perfil). Padrão: false.

Descoberta:

- Use `agents_list` para ver quais IDs de agente estão atualmente permitidos para `sessions_spawn`.

Autoarquivamento:

- Sessões de subagente são automaticamente arquivadas após `agents.defaults.subagents.archiveAfterMinutes` (padrão: 60).
- O arquivamento usa `sessions.delete` e renomeia a transcrição para `*.deleted.<timestamp>` (mesma pasta).
- `cleanup: "delete"` arquiva imediatamente após o anúncio (ainda preserva a transcrição via rename).
- O autoarquivamento é por melhor esforço; timers pendentes se perdem se o gateway reiniciar.
- `runTimeoutSeconds` **não** autoarquiva; ele apenas interrompe a execução. A sessão permanece até o autoarquivamento.
- O autoarquivamento se aplica igualmente a sessões de profundidade 1 e profundidade 2.
- O cleanup do browser é separado do cleanup de arquivamento: abas/processos rastreados de browser são fechados por melhor esforço quando a execução termina, mesmo que o registro da sessão/transcrição seja mantido.

## Subagentes aninhados

Por padrão, subagentes não podem iniciar seus próprios subagentes (`maxSpawnDepth: 1`). Você pode habilitar um nível de aninhamento definindo `maxSpawnDepth: 2`, o que permite o **padrão de orquestrador**: principal → subagente orquestrador → sub-subagentes trabalhadores.

### Como habilitar

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // permitir que subagentes iniciem filhos (padrão: 1)
        maxChildrenPerAgent: 5, // máximo de filhos ativos por sessão de agente (padrão: 5)
        maxConcurrent: 8, // limite global de concorrência da lane (padrão: 8)
        runTimeoutSeconds: 900, // timeout padrão para sessions_spawn quando omitido (0 = sem timeout)
      },
    },
  },
}
```

### Níveis de profundidade

| Profundidade | Formato da session key                       | Papel                                         | Pode iniciar?                |
| ------------ | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0            | `agent:<id>:main`                            | Agente principal                              | Sempre                       |
| 1            | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestrador quando profundidade 2 é permitida) | Apenas se `maxSpawnDepth >= 2` |
| 2            | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagente (worker folha)                  | Nunca                        |

### Cadeia de anúncio

Os resultados fluem de volta pela cadeia:

1. O worker de profundidade 2 termina → anuncia para seu pai (orquestrador de profundidade 1)
2. O orquestrador de profundidade 1 recebe o anúncio, sintetiza os resultados, termina → anuncia para o principal
3. O agente principal recebe o anúncio e entrega ao usuário

Cada nível vê apenas anúncios de seus filhos diretos.

Orientação operacional:

- Inicie o trabalho filho uma vez e espere por eventos de conclusão em vez de criar
  loops de polling em torno de `sessions_list`, `sessions_history`, `/subagents list` ou
  comandos `exec` com sleep.
- Se um evento de conclusão de filho chegar depois que você já enviou a resposta final,
  o acompanhamento correto é o token silencioso exato `NO_REPLY` / `no_reply`.

### Política de ferramentas por profundidade

- O papel e o escopo de controle são gravados nos metadados da sessão no momento do spawn. Isso evita que chaves de sessão planas ou restauradas recuperem acidentalmente privilégios de orquestrador.
- **Profundidade 1 (orquestrador, quando `maxSpawnDepth >= 2`)**: recebe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder gerenciar seus filhos. Outras ferramentas de sessão/sistema continuam negadas.
- **Profundidade 1 (leaf, quando `maxSpawnDepth == 1`)**: sem ferramentas de sessão (comportamento padrão atual).
- **Profundidade 2 (worker leaf)**: sem ferramentas de sessão — `sessions_spawn` é sempre negado na profundidade 2. Não pode iniciar mais filhos.

### Limite de spawn por agente

Cada sessão de agente (em qualquer profundidade) pode ter no máximo `maxChildrenPerAgent` (padrão: 5) filhos ativos ao mesmo tempo. Isso evita fan-out descontrolado a partir de um único orquestrador.

### Parada em cascata

Parar um orquestrador de profundidade 1 automaticamente para todos os filhos de profundidade 2:

- `/stop` no chat principal para todos os agentes de profundidade 1 e faz cascata para seus filhos de profundidade 2.
- `/subagents kill <id>` para um subagente específico e faz cascata para seus filhos.
- `/subagents kill all` para todos os subagentes do solicitante e faz cascata.

## Autenticação

A autenticação do subagente é resolvida por **ID de agente**, não por tipo de sessão:

- A session key do subagente é `agent:<agentId>:subagent:<uuid>`.
- O store de autenticação é carregado de `agentDir` desse agente.
- Os perfis de autenticação do agente principal são mesclados como **fallback**; perfis do agente substituem perfis do principal em conflitos.

Observação: a mesclagem é aditiva, então os perfis do principal sempre estão disponíveis como fallback. Isolamento completo de autenticação por agente ainda não é compatível.

## Announce

Subagentes reportam de volta por meio de uma etapa de anúncio:

- A etapa de anúncio roda dentro da sessão do subagente (não da sessão do solicitante).
- Se o subagente responder exatamente `ANNOUNCE_SKIP`, nada é publicado.
- Se o texto mais recente do assistente for exatamente o token silencioso `NO_REPLY` / `no_reply`,
  a saída do anúncio é suprimida, mesmo que tenha existido progresso visível antes.
- Caso contrário, a entrega depende da profundidade do solicitante:
  - sessões solicitantes de nível superior usam uma chamada subsequente `agent` com entrega externa (`deliver=true`)
  - sessões de subagente solicitante aninhadas recebem uma injeção interna subsequente (`deliver=false`), para que o orquestrador possa sintetizar resultados de filhos dentro da sessão
  - se uma sessão de subagente solicitante aninhada tiver desaparecido, o OpenClaw usa fallback para o solicitante daquela sessão quando disponível
- Para sessões solicitantes de nível superior, a entrega direta em modo de conclusão primeiro resolve qualquer rota vinculada de conversa/thread e substituição de hook, depois preenche campos ausentes de alvo de canal a partir da rota armazenada da sessão do solicitante. Isso mantém as conclusões no chat/tópico correto, mesmo quando a origem da conclusão identifica apenas o canal.
- A agregação de conclusões de filhos é limitada à execução atual do solicitante ao construir achados de conclusão aninhados, evitando que saídas antigas de filhos de execuções anteriores vazem para o anúncio atual.
- Respostas de anúncio preservam roteamento de thread/tópico quando disponível nos adapters de canal.
- O contexto de anúncio é normalizado para um bloco estável de evento interno:
  - origem (`subagent` ou `cron`)
  - session key/id do filho
  - tipo de anúncio + rótulo da tarefa
  - linha de status derivada do resultado de runtime (`success`, `error`, `timeout` ou `unknown`)
  - conteúdo do resultado selecionado a partir do último texto visível do assistente, ou então do texto sanitizado mais recente de tool/toolResult; execuções terminais com falha reportam status de falha sem reproduzir texto de resposta capturado
  - uma instrução de acompanhamento descrevendo quando responder vs. permanecer silencioso
- `Status` não é inferido da saída do modelo; ele vem de sinais do resultado de runtime.
- Em timeout, se o filho só tiver chegado a chamadas de ferramenta, o anúncio pode condensar esse histórico em um breve resumo de progresso parcial em vez de reproduzir saída bruta de ferramenta.

Payloads de anúncio incluem uma linha de estatísticas ao final (mesmo quando encapsulados):

- Runtime (por exemplo, `runtime 5m12s`)
- Uso de tokens (entrada/saída/total)
- Custo estimado quando o preço do modelo está configurado (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` e caminho da transcrição (para que o agente principal possa buscar histórico via `sessions_history` ou inspecionar o arquivo em disco)
- Metadados internos servem apenas para orquestração; respostas voltadas ao usuário devem ser reescritas em voz normal de assistente.

`sessions_history` é o caminho de orquestração mais seguro:

- o recall do assistente é normalizado primeiro:
  - tags de thinking são removidas
  - blocos de scaffolding `<relevant-memories>` / `<relevant_memories>` são removidos
  - blocos XML de payload de chamada de ferramenta em texto simples como `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>` são removidos, incluindo payloads truncados
    que nunca fecham corretamente
  - scaffolding degradado de chamada/resultado de ferramenta e marcadores de contexto histórico são removidos
  - tokens de controle do modelo vazados, como `<|assistant|>`, outros
    tokens ASCII `<|...|>` e variantes de largura total `<｜...｜>` são removidos
  - XML malformado de chamada de ferramenta do MiniMax é removido
- texto semelhante a credencial/token é redigido
- blocos longos podem ser truncados
- históricos muito grandes podem descartar linhas mais antigas ou substituir uma linha grande demais por
  `[sessions_history omitted: message too large]`
- a inspeção bruta da transcrição em disco é o fallback quando você precisa da transcrição completa byte a byte

## Política de ferramentas (ferramentas de subagente)

Por padrão, subagentes recebem **todas as ferramentas exceto ferramentas de sessão** e ferramentas de sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` continua sendo também aqui uma visualização limitada e sanitizada de recall; não é
um despejo bruto da transcrição.

Quando `maxSpawnDepth >= 2`, subagentes orquestradores de profundidade 1 recebem adicionalmente `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history`, para que possam gerenciar seus filhos.

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
        // deny vence
        deny: ["gateway", "cron"],
        // se allow for definido, passa a ser apenas allow (deny ainda vence)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concorrência

Subagentes usam uma lane dedicada de fila in-process:

- Nome da lane: `subagent`
- Concorrência: `agents.defaults.subagents.maxConcurrent` (padrão `8`)

## Parando

- Enviar `/stop` no chat do solicitante aborta a sessão do solicitante e interrompe qualquer execução ativa de subagente iniciada a partir dela, com cascata para filhos aninhados.
- `/subagents kill <id>` interrompe um subagente específico e faz cascata para seus filhos.

## Limitações

- O anúncio do subagente é por **melhor esforço**. Se o gateway reiniciar, trabalho pendente de “anunciar de volta” é perdido.
- Subagentes ainda compartilham os mesmos recursos do processo do gateway; trate `maxConcurrent` como válvula de segurança.
- `sessions_spawn` é sempre não bloqueante: retorna `{ status: "accepted", runId, childSessionKey }` imediatamente.
- O contexto do subagente injeta apenas `AGENTS.md` + `TOOLS.md` (sem `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ou `BOOTSTRAP.md`).
- A profundidade máxima de aninhamento é 5 (`maxSpawnDepth` intervalo: 1–5). Profundidade 2 é recomendada para a maioria dos casos de uso.
- `maxChildrenPerAgent` limita filhos ativos por sessão (padrão: 5, intervalo: 1–20).

## Relacionado

- [ACP agents](/pt-BR/tools/acp-agents)
- [Ferramentas de sandbox multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
- [Envio de agente](/pt-BR/tools/agent-send)
