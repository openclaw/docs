---
read_when:
    - Você quer trabalho em segundo plano/paralelo por meio do agente
    - Você está alterando `sessions_spawn` ou a política da ferramenta de subagente
    - Você está implementando ou depurando sessões de subagente vinculadas a thread
summary: 'Subagentes: iniciar execuções isoladas de agentes que anunciam os resultados de volta no chat solicitante'
title: Subagentes
x-i18n:
    generated_at: "2026-04-22T04:28:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef8d8faa296bdc1b56079bd4a24593ba2e1aa02b9929a7a191b0d8498364ce4e
    source_path: tools/subagents.md
    workflow: 15
---

# Subagentes

Subagentes são execuções de agente em segundo plano iniciadas a partir de uma execução existente de agente. Eles são executados em sua própria sessão (`agent:<agentId>:subagent:<uuid>`) e, quando terminam, **anunciam** o resultado de volta no canal de chat do solicitante. Cada execução de subagente é rastreada como uma [tarefa em segundo plano](/pt-BR/automation/tasks).

## Comando slash

Use `/subagents` para inspecionar ou controlar execuções de subagente da **sessão atual**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Controles de vínculo com thread:

Esses comandos funcionam em canais que oferecem suporte a vínculos persistentes com thread. Consulte **Canais com suporte a thread** abaixo.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` mostra metadados da execução (status, timestamps, id da sessão, caminho da transcrição, limpeza).
Use `sessions_history` para uma visualização limitada e filtrada por segurança; inspecione o
caminho da transcrição em disco quando precisar da transcrição bruta completa.

### Comportamento de spawn

`/subagents spawn` inicia um subagente em segundo plano como um comando de usuário, não como um relay interno, e envia uma atualização final de conclusão de volta ao chat solicitante quando a execução termina.

- O comando de spawn não bloqueia; ele retorna um id de execução imediatamente.
- Ao concluir, o subagente anuncia uma mensagem de resumo/resultado de volta ao canal de chat do solicitante.
- A entrega da conclusão é baseada em push. Depois de iniciar, não faça polling em `/subagents list`,
  `sessions_list` ou `sessions_history` em loop apenas para esperar a
  conclusão; inspecione o status somente sob demanda para depuração ou intervenção.
- Ao concluir, o OpenClaw fecha por melhor esforço abas/processos de navegador rastreados abertos por aquela sessão de subagente antes de o fluxo de limpeza do anúncio continuar.
- Para spawns manuais, a entrega é resiliente:
  - O OpenClaw tenta primeiro entrega direta por `agent` com uma chave de idempotência estável.
  - Se a entrega direta falhar, faz fallback para roteamento por fila.
  - Se o roteamento por fila ainda não estiver disponível, o anúncio é tentado novamente com backoff exponencial curto antes da desistência final.
- A entrega da conclusão mantém a rota resolvida do solicitante:
  - rotas de conclusão vinculadas a thread ou à conversa têm prioridade quando disponíveis
  - se a origem da conclusão fornecer apenas um canal, o OpenClaw preenche o alvo/conta ausente a partir da rota resolvida da sessão do solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que a entrega direta ainda funcione
- A transferência da conclusão para a sessão do solicitante é um contexto interno gerado em runtime (não texto criado pelo usuário) e inclui:
  - `Result` (texto mais recente visível de resposta `assistant`, ou então texto sanitizado mais recente de tool/toolResult; execuções terminadas com falha não reutilizam texto de resposta capturado)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - estatísticas compactas de runtime/token
  - uma instrução de entrega dizendo ao agente solicitante para reescrever em voz normal de assistente (não encaminhar metadados internos brutos)
- `--model` e `--thinking` substituem os padrões para aquela execução específica.
- Use `info`/`log` para inspecionar detalhes e saída após a conclusão.
- `/subagents spawn` é modo one-shot (`mode: "run"`). Para sessões persistentes vinculadas a thread, use `sessions_spawn` com `thread: true` e `mode: "session"`.
- Para sessões de harness ACP (Codex, Claude Code, Gemini CLI), use `sessions_spawn` com `runtime: "acp"` e consulte [Agentes ACP](/pt-BR/tools/acp-agents), especialmente o [modelo de entrega do ACP](/pt-BR/tools/acp-agents#delivery-model) ao depurar conclusões ou loops de agente para agente.

Objetivos principais:

- Paralelizar trabalho de "pesquisa / tarefa longa / ferramenta lenta" sem bloquear a execução principal.
- Manter subagentes isolados por padrão (separação de sessão + sandboxing opcional).
- Manter a superfície da ferramenta difícil de usar incorretamente: subagentes **não** recebem ferramentas de sessão por padrão.
- Oferecer suporte a profundidade de aninhamento configurável para padrões de orquestração.

Observação de custo: cada subagente tem seu **próprio** contexto e uso de tokens. Para tarefas pesadas ou repetitivas,
defina um modelo mais barato para subagentes e mantenha seu agente principal em um modelo de maior qualidade.
Você pode configurar isso por `agents.defaults.subagents.model` ou substituições por agente.

## Ferramenta

Use `sessions_spawn`:

- Inicia uma execução de subagente (`deliver: false`, lane global: `subagent`)
- Depois executa uma etapa de anúncio e publica a resposta de anúncio no canal de chat do solicitante
- Modelo padrão: herda do chamador, a menos que você defina `agents.defaults.subagents.model` (ou por agente em `agents.list[].subagents.model`); um `sessions_spawn.model` explícito ainda tem prioridade.
- Thinking padrão: herda do chamador, a menos que você defina `agents.defaults.subagents.thinking` (ou por agente em `agents.list[].subagents.thinking`); um `sessions_spawn.thinking` explícito ainda tem prioridade.
- Timeout padrão de execução: se `sessions_spawn.runTimeoutSeconds` for omitido, o OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário, usa `0` como fallback (sem timeout).

Parâmetros da ferramenta:

- `task` (obrigatório)
- `label?` (opcional)
- `agentId?` (opcional; inicia sob outro id de agente se permitido)
- `model?` (opcional; substitui o modelo do subagente; valores inválidos são ignorados e o subagente é executado no modelo padrão com um aviso no resultado da ferramenta)
- `thinking?` (opcional; substitui o nível de thinking para a execução do subagente)
- `runTimeoutSeconds?` (usa `agents.defaults.subagents.runTimeoutSeconds` como padrão quando definido, caso contrário `0`; quando definido, a execução do subagente é abortada após N segundos)
- `thread?` (padrão `false`; quando `true`, solicita vínculo com thread de canal para esta sessão de subagente)
- `mode?` (`run|session`)
  - o padrão é `run`
  - se `thread: true` e `mode` for omitido, o padrão passa a ser `session`
  - `mode: "session"` exige `thread: true`
- `cleanup?` (`delete|keep`, padrão `keep`)
- `sandbox?` (`inherit|require`, padrão `inherit`; `require` rejeita o spawn a menos que o runtime filho de destino esteja em sandbox)
- `sessions_spawn` **não** aceita parâmetros de entrega de canal (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Para entrega, use `message`/`sessions_send` a partir da execução iniciada.

## Sessões vinculadas a thread

Quando vínculos com thread estão habilitados para um canal, um subagente pode permanecer vinculado a uma thread para que mensagens de acompanhamento do usuário naquela thread continuem sendo roteadas para a mesma sessão de subagente.

### Canais com suporte a thread

- Discord (atualmente o único canal compatível): oferece suporte a sessões persistentes de subagente vinculadas a thread (`sessions_spawn` com `thread: true`), controles manuais de thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) e chaves de adaptador `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` e `channels.discord.threadBindings.spawnSubagentSessions`.

Fluxo rápido:

1. Inicie com `sessions_spawn` usando `thread: true` (e opcionalmente `mode: "session"`).
2. O OpenClaw cria ou vincula uma thread àquele alvo de sessão no canal ativo.
3. Respostas e mensagens de acompanhamento naquela thread são roteadas para a sessão vinculada.
4. Use `/session idle` para inspecionar/atualizar o desfoco automático por inatividade e `/session max-age` para controlar o limite rígido.
5. Use `/unfocus` para desvincular manualmente.

Controles manuais:

- `/focus <target>` vincula a thread atual (ou cria uma) a um alvo de subagente/sessão.
- `/unfocus` remove o vínculo da thread atualmente vinculada.
- `/agents` lista execuções ativas e estado do vínculo (`thread:<id>` ou `unbound`).
- `/session idle` e `/session max-age` funcionam apenas para threads vinculadas em foco.

Chaves de configuração:

- Padrão global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Substituição por canal e chaves de vínculo automático no spawn são específicas do adaptador. Consulte **Canais com suporte a thread** acima.

Consulte [Referência de configuração](/pt-BR/gateway/configuration-reference) e [Comandos slash](/pt-BR/tools/slash-commands) para detalhes atuais do adaptador.

Lista de permissões:

- `agents.list[].subagents.allowAgents`: lista de ids de agente que podem ser direcionados via `agentId` (`["*"]` para permitir qualquer um). Padrão: apenas o agente solicitante.
- `agents.defaults.subagents.allowAgents`: lista de permissões padrão de agente-alvo usada quando o agente solicitante não define sua própria `subagents.allowAgents`.
- Guarda de herança de sandbox: se a sessão do solicitante estiver em sandbox, `sessions_spawn` rejeita alvos que seriam executados sem sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: quando verdadeiro, bloqueia chamadas `sessions_spawn` que omitem `agentId` (força seleção explícita de perfil). Padrão: false.

Descoberta:

- Use `agents_list` para ver quais ids de agente estão atualmente permitidos para `sessions_spawn`.

Arquivamento automático:

- Sessões de subagente são arquivadas automaticamente após `agents.defaults.subagents.archiveAfterMinutes` (padrão: 60).
- O arquivamento usa `sessions.delete` e renomeia a transcrição para `*.deleted.<timestamp>` (mesma pasta).
- `cleanup: "delete"` arquiva imediatamente após o anúncio (ainda mantém a transcrição via renomeação).
- O arquivamento automático é por melhor esforço; timers pendentes são perdidos se o Gateway reiniciar.
- `runTimeoutSeconds` **não** arquiva automaticamente; ele apenas interrompe a execução. A sessão permanece até o arquivamento automático.
- O arquivamento automático se aplica igualmente a sessões de profundidade 1 e profundidade 2.
- A limpeza do navegador é separada da limpeza de arquivamento: abas/processos de navegador rastreados são fechados por melhor esforço quando a execução termina, mesmo se o registro da transcrição/sessão for mantido.

## Subagentes aninhados

Por padrão, subagentes não podem iniciar seus próprios subagentes (`maxSpawnDepth: 1`). Você pode habilitar um nível de aninhamento definindo `maxSpawnDepth: 2`, o que permite o **padrão de orquestração**: principal → subagente orquestrador → sub-subagentes trabalhadores.

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

| Profundidade | Formato da chave de sessão                   | Papel                                        | Pode iniciar?                |
| ------------ | -------------------------------------------- | -------------------------------------------- | ---------------------------- |
| 0            | `agent:<id>:main`                            | Agente principal                             | Sempre                       |
| 1            | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestrador quando profundidade 2 é permitida) | Somente se `maxSpawnDepth >= 2` |
| 2            | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagente (trabalhador final)            | Nunca                        |

### Cadeia de anúncio

Os resultados sobem pela cadeia:

1. O trabalhador de profundidade 2 termina → anuncia ao pai dele (orquestrador de profundidade 1)
2. O orquestrador de profundidade 1 recebe o anúncio, sintetiza os resultados, termina → anuncia ao principal
3. O agente principal recebe o anúncio e entrega ao usuário

Cada nível vê apenas anúncios de seus filhos diretos.

Orientação operacional:

- Inicie o trabalho do filho uma vez e espere os eventos de conclusão em vez de construir loops de polling em torno de `sessions_list`, `sessions_history`, `/subagents list` ou comandos `exec` de espera.
- Se um evento de conclusão de filho chegar depois que você já enviou a resposta final,
  o acompanhamento correto é o token silencioso exato `NO_REPLY` / `no_reply`.

### Política de ferramenta por profundidade

- Papel e escopo de controle são gravados nos metadados da sessão no momento do spawn. Isso evita que chaves de sessão planas ou restauradas recuperem acidentalmente privilégios de orquestrador.
- **Profundidade 1 (orquestrador, quando `maxSpawnDepth >= 2`)**: recebe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder gerenciar seus filhos. Outras ferramentas de sessão/sistema continuam negadas.
- **Profundidade 1 (folha, quando `maxSpawnDepth == 1`)**: sem ferramentas de sessão (comportamento padrão atual).
- **Profundidade 2 (trabalhador folha)**: sem ferramentas de sessão — `sessions_spawn` é sempre negado na profundidade 2. Não pode iniciar mais filhos.

### Limite de spawn por agente

Cada sessão de agente (em qualquer profundidade) pode ter no máximo `maxChildrenPerAgent` (padrão: 5) filhos ativos ao mesmo tempo. Isso evita expansão descontrolada a partir de um único orquestrador.

### Parada em cascata

Parar um orquestrador de profundidade 1 para automaticamente todos os seus filhos de profundidade 2:

- `/stop` no chat principal para todos os agentes de profundidade 1 e propaga para seus filhos de profundidade 2.
- `/subagents kill <id>` para um subagente específico e propaga para seus filhos.
- `/subagents kill all` para todos os subagentes do solicitante e propaga.

## Autenticação

A autenticação de subagente é resolvida por **id do agente**, não por tipo de sessão:

- A chave de sessão do subagente é `agent:<agentId>:subagent:<uuid>`.
- O armazenamento de autenticação é carregado de `agentDir` daquele agente.
- Os perfis de autenticação do agente principal são mesclados como **fallback**; perfis do agente substituem perfis principais em caso de conflito.

Observação: a mesclagem é aditiva, então perfis principais estão sempre disponíveis como fallback. Autenticação totalmente isolada por agente ainda não é compatível.

## Anúncio

Subagentes reportam de volta por meio de uma etapa de anúncio:

- A etapa de anúncio é executada dentro da sessão do subagente (não na sessão do solicitante).
- Se o subagente responder exatamente `ANNOUNCE_SKIP`, nada será publicado.
- Se o texto mais recente do assistente for o token silencioso exato `NO_REPLY` / `no_reply`,
  a saída do anúncio será suprimida mesmo que tenha havido progresso visível anteriormente.
- Caso contrário, a entrega depende da profundidade do solicitante:
  - sessões solicitantes de nível superior usam uma chamada `agent` de acompanhamento com entrega externa (`deliver=true`)
  - sessões solicitantes de subagente aninhadas recebem uma injeção interna de acompanhamento (`deliver=false`) para que o orquestrador possa sintetizar resultados dos filhos dentro da sessão
  - se uma sessão solicitante de subagente aninhada não existir mais, o OpenClaw usa como fallback o solicitante daquela sessão quando disponível
- Para sessões solicitantes de nível superior, a entrega direta em modo de conclusão primeiro resolve qualquer rota vinculada de conversa/thread e substituição de hook, depois preenche campos ausentes de alvo de canal a partir da rota armazenada da sessão do solicitante. Isso mantém conclusões no chat/tópico correto mesmo quando a origem da conclusão identifica apenas o canal.
- A agregação de conclusões de filhos é limitada à execução atual do solicitante ao construir achados de conclusão aninhada, impedindo que saídas antigas de filhos de execuções anteriores vazem para o anúncio atual.
- Respostas de anúncio preservam o roteamento de thread/tópico quando disponível nos adaptadores de canal.
- O contexto de anúncio é normalizado em um bloco estável de evento interno:
  - origem (`subagent` ou `cron`)
  - chave/id da sessão filha
  - tipo de anúncio + rótulo da tarefa
  - linha de status derivada do resultado do runtime (`success`, `error`, `timeout` ou `unknown`)
  - conteúdo do resultado selecionado a partir do texto visível mais recente do assistente ou, caso contrário, do texto sanitizado mais recente de tool/toolResult; execuções terminadas com falha reportam status de falha sem reproduzir texto de resposta capturado
  - uma instrução de acompanhamento descrevendo quando responder vs. permanecer silencioso
- `Status` não é inferido da saída do modelo; ele vem de sinais de resultado do runtime.
- Em timeout, se o filho passou apenas por chamadas de ferramenta, o anúncio pode condensar esse histórico em um pequeno resumo de progresso parcial em vez de reproduzir a saída bruta da ferramenta.

Payloads de anúncio incluem uma linha de estatísticas ao final (mesmo quando encapsulados):

- Runtime (por exemplo, `runtime 5m12s`)
- Uso de tokens (entrada/saída/total)
- Custo estimado quando a precificação do modelo está configurada (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` e caminho da transcrição (para que o agente principal possa buscar histórico via `sessions_history` ou inspecionar o arquivo em disco)
- Metadados internos se destinam apenas à orquestração; respostas voltadas ao usuário devem ser reescritas em voz normal de assistente.

`sessions_history` é o caminho de orquestração mais seguro:

- a recuperação de assistant é normalizada primeiro:
  - tags de thinking são removidas
  - blocos estruturais `<relevant-memories>` / `<relevant_memories>` são removidos
  - blocos de payload XML de chamada de ferramenta em texto simples como `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>` são removidos, incluindo payloads truncados
    que nunca se fecham corretamente
  - scaffolding rebaixado de tool-call/result e marcadores de contexto histórico são removidos
  - tokens de controle do modelo vazados, como `<|assistant|>`, outros tokens ASCII
    `<|...|>` e variantes de largura total `<｜...｜>` são removidos
  - XML malformado de tool-call do MiniMax é removido
- texto semelhante a credenciais/tokens é redigido
- blocos longos podem ser truncados
- históricos muito grandes podem remover linhas antigas ou substituir uma linha grande demais por
  `[sessions_history omitted: message too large]`
- inspeção bruta da transcrição em disco é o fallback quando você precisa da transcrição completa byte a byte

## Política de ferramenta (ferramentas de subagente)

Por padrão, subagentes recebem **todas as ferramentas exceto ferramentas de sessão** e ferramentas de sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` continua sendo uma visualização limitada e sanitizada de recuperação aqui também; não é
um despejo bruto de transcrição.

Quando `maxSpawnDepth >= 2`, subagentes orquestradores de profundidade 1 recebem adicionalmente `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` para poder gerenciar seus filhos.

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
        // deny tem prioridade
        deny: ["gateway", "cron"],
        // se allow for definido, ele se torna allow-only (deny ainda tem prioridade)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concorrência

Subagentes usam uma lane dedicada de fila no processo:

- Nome da lane: `subagent`
- Concorrência: `agents.defaults.subagents.maxConcurrent` (padrão `8`)

## Parada

- Enviar `/stop` no chat do solicitante aborta a sessão do solicitante e interrompe quaisquer execuções ativas de subagente iniciadas a partir dela, propagando para filhos aninhados.
- `/subagents kill <id>` interrompe um subagente específico e propaga para seus filhos.

## Limitações

- O anúncio de subagente é por **melhor esforço**. Se o Gateway reiniciar, o trabalho pendente de "anunciar de volta" será perdido.
- Subagentes ainda compartilham os mesmos recursos de processo do Gateway; trate `maxConcurrent` como uma válvula de segurança.
- `sessions_spawn` é sempre não bloqueante: retorna `{ status: "accepted", runId, childSessionKey }` imediatamente.
- O contexto do subagente injeta apenas `AGENTS.md` + `TOOLS.md` (sem `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ou `BOOTSTRAP.md`).
- A profundidade máxima de aninhamento é 5 (`maxSpawnDepth` no intervalo: 1–5). Profundidade 2 é recomendada para a maioria dos casos de uso.
- `maxChildrenPerAgent` limita filhos ativos por sessão (padrão: 5, intervalo: 1–20).
