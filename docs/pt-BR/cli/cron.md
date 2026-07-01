---
read_when:
    - Você quer tarefas agendadas e despertares
    - Você está depurando a execução e os logs do cron
summary: Referência da CLI para `openclaw cron` (agendar e executar tarefas em segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-07-01T05:32:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aed39843e183b3d441908ad4ac0578d44b6f0d482905871efc3421fd9820a1cc
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gerencie tarefas Cron para o agendador do Gateway.

<Tip>
Execute `openclaw cron --help` para ver toda a superfície de comandos. Consulte [Tarefas Cron](/pt-BR/automation/cron-jobs) para o guia conceitual.
</Tip>

## Criar tarefas rapidamente

`openclaw cron create` é um alias de `openclaw cron add`. Para novas tarefas, coloque primeiro o agendamento e depois o prompt:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Use `--webhook <url>` quando a tarefa deve enviar por POST a carga finalizada em vez de entregá-la a um destino de chat:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Use `--command` para tarefas determinísticas no estilo shell que devem ser executadas dentro do Cron do OpenClaw sem iniciar uma execução isolada de agente/modelo:

<Note>
Tarefas Cron de comando são automações do Gateway criadas por administradores. Criá-las, editá-las,
removê-las ou executá-las manualmente requer `operator.admin`; a execução agendada
posteriormente roda no processo do Gateway, não como uma chamada de ferramenta `tools.exec` de agente.
`tools.exec.*` e aprovações de exec ainda regem ferramentas exec visíveis ao modelo.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` armazena `argv: ["sh", "-lc", <shell>]`. Use `--command-argv '["node","scripts/report.mjs"]'` para execução exata de argv. Tarefas de comando capturam stdout/stderr, registram o histórico normal do Cron e encaminham a saída pelos mesmos modos de entrega `announce`, `webhook` ou `none` que as tarefas isoladas. Um comando que imprime apenas `NO_REPLY` é suprimido.

## Sessões

`--session` aceita `main`, `isolated`, `current` ou `session:<id>`.

<AccordionGroup>
  <Accordion title="Chaves de sessão">
    - `main` vincula à sessão principal do agente.
    - `isolated` cria uma transcrição e um id de sessão novos para cada execução.
    - `current` vincula à sessão ativa no momento da criação.
    - `session:<id>` fixa em uma chave de sessão persistente explícita.

  </Accordion>
  <Accordion title="Semântica de sessão isolada">
    Execuções isoladas redefinem o contexto de conversa ambiente. Roteamento de canal e grupo, política de envio/fila, elevação, origem e vínculo de runtime ACP são redefinidos para a nova execução. Preferências seguras e substituições explícitas de modelo ou autenticação selecionadas pelo usuário podem ser preservadas entre execuções.
  </Accordion>
</AccordionGroup>

## Entrega

`openclaw cron list` e `openclaw cron show <job-id>` pré-visualizam a rota de entrega resolvida. Para `channel: "last"`, a prévia mostra se a rota foi resolvida a partir da sessão principal ou atual, ou se falhará fechada.

Destinos com prefixo de provedor podem desambiguar canais de anúncio não resolvidos. Por exemplo, `to: "telegram:123"` seleciona Telegram quando `delivery.channel` é omitido ou é `last`. Apenas prefixos anunciados pelo plugin carregado são seletores de provedor. Se `delivery.channel` for explícito, o prefixo deve corresponder a esse canal; `channel: "whatsapp"` com `to: "telegram:123"` é rejeitado. Prefixos de serviço como `imessage:` e `sms:` continuam sendo sintaxe de destino pertencente ao canal.

<Note>
Tarefas isoladas de `cron add` usam entrega `--announce` por padrão. Use `--no-deliver` para manter a saída interna. `--deliver` permanece como um alias obsoleto de `--announce`.
</Note>

### Propriedade da entrega

A entrega de chat de Cron isolado é compartilhada entre o agente e o executor:

- O agente pode enviar diretamente usando a ferramenta `message` quando uma rota de chat está disponível.
- `announce` entrega como fallback a resposta final somente quando o agente não enviou diretamente ao destino resolvido.
- `webhook` envia a carga finalizada por POST a uma URL.
- `none` desativa a entrega de fallback do executor.

Use `cron add|create --webhook <url>` ou `cron edit <job-id> --webhook <url>` para definir a entrega por webhook. Não combine `--webhook` com flags de entrega por chat como `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` ou `--account`.

`cron edit <job-id>` pode remover campos individuais de roteamento de entrega com `--clear-channel`, `--clear-to`, `--clear-thread-id` e `--clear-account` (cada um é rejeitado quando combinado com sua flag de definição correspondente). Ao contrário de `--no-deliver`, que apenas desativa a entrega de fallback do executor, estes removem o campo armazenado para que a tarefa resolva essa parte de sua rota a partir dos padrões novamente.

`--announce` é a entrega de fallback do executor para a resposta final. `--no-deliver` desativa esse fallback, mas não remove a ferramenta `message` do agente quando uma rota de chat está disponível.

Lembretes criados a partir de um chat ativo preservam o destino de entrega do chat ao vivo para a entrega de anúncio de fallback. Chaves internas de sessão podem estar em minúsculas; não as use como fonte da verdade para IDs de provedor sensíveis a maiúsculas e minúsculas, como IDs de salas do Matrix.

### Entrega de falhas

Notificações de falha são resolvidas nesta ordem:

1. `delivery.failureDestination` na tarefa.
2. `cron.failureDestination` global.
3. O destino principal de anúncio da tarefa (quando nenhum destino de falha explícito está definido).

<Note>
Tarefas de sessão principal só podem usar `delivery.failureDestination` quando o modo de entrega primário for `webhook`. Tarefas isoladas o aceitam em todos os modos.
</Note>

Observação: execuções de Cron isoladas tratam falhas de agente em nível de execução como erros da tarefa mesmo quando
nenhuma carga de resposta é produzida, portanto falhas de modelo/provedor ainda incrementam contadores de erro
e acionam notificações de falha.

Tarefas Cron de comando não iniciam uma vez isolada de agente. Um código de saída zero registra
`ok`; saída não zero, sinal, timeout ou timeout sem saída registra `error` e
pode acionar o mesmo caminho de notificação de falha.

Se uma execução isolada atingir timeout antes da primeira solicitação de modelo, `openclaw cron show`
e `openclaw cron runs` incluem um erro específico de fase, como
`setup timed out before runner start` ou
`stalled before first model call (last phase: context-engine)`.
Para provedores baseados em CLI, o watchdog pré-modelo permanece ativo até o turno externo
da CLI começar, então travamentos de busca de sessão, hook, autenticação, prompt e configuração da CLI são
relatados como falhas de Cron pré-modelo.

## Agendamento

### Tarefas únicas

`--at <datetime>` agenda uma execução única. Datetimes sem offset são tratados como UTC, a menos que você também passe `--tz <iana>`, que interpreta o horário de relógio na timezone indicada.

<Note>
Tarefas únicas são excluídas após sucesso por padrão. Use `--keep-after-run` para preservá-las.
</Note>

### Tarefas recorrentes

Tarefas recorrentes usam backoff exponencial de nova tentativa após erros consecutivos: 30s, 1m, 5m, 15m, 60m. O agendamento volta ao normal após a próxima execução bem-sucedida.

Execuções ignoradas são rastreadas separadamente de erros de execução. Elas não afetam o backoff de nova tentativa, mas `openclaw cron edit <job-id> --failure-alert-include-skipped` pode optar por incluir notificações repetidas de execuções ignoradas nos alertas de falha.

Para tarefas isoladas que têm como destino um provedor de modelo local configurado, o Cron executa uma verificação prévia leve do provedor antes de iniciar o turno do agente. Provedores `api: "ollama"` de loopback, rede privada e `.local` são sondados em `/api/tags`; provedores locais compatíveis com OpenAI, como vLLM, SGLang e LM Studio, são sondados em `/models`. Se o endpoint estiver inacessível, a execução é registrada como `skipped` e repetida em um agendamento posterior; endpoints inativos correspondentes são armazenados em cache por 5 minutos para evitar que muitas tarefas sobrecarreguem o mesmo servidor local.

Observação: tarefas Cron, estado pendente de runtime e histórico de execuções ficam no banco de dados de estado SQLite compartilhado. Arquivos legados `jobs.json`, `jobs-state.json` e `runs/*.jsonl` são importados uma vez e renomeados com um sufixo `.migrated`. Após a importação, edite agendamentos com `openclaw cron add|edit|remove` em vez de editar arquivos JSON.

### Execuções manuais

`openclaw cron run <job-id>` força execuções por padrão e retorna assim que a execução manual é enfileirada. Respostas bem-sucedidas incluem `{ ok: true, enqueued: true, runId }`. Use o `runId` retornado para inspecionar o resultado posterior:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Adicione `--wait` quando um script deve bloquear até que essa execução enfileirada exata registre um status terminal:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Com `--wait`, a CLI ainda chama `cron.run` primeiro, depois consulta `cron.runs` para o `runId` retornado. O comando sai com `0` somente quando a execução termina com status `ok`. Ele sai com valor diferente de zero quando a execução termina com `error` ou `skipped`, quando a resposta do Gateway não inclui um `runId`, ou quando `--wait-timeout` expira. `--poll-interval` deve ser maior que zero.

<Note>
Use `--due` quando quiser que o comando manual execute somente se a tarefa estiver vencida no momento. Se `--due --wait` não enfileirar uma execução, o comando retorna a resposta normal sem execução em vez de consultar.
</Note>

## Modelos

`cron add|edit --model <ref>` seleciona um modelo permitido para a tarefa. `cron add|edit --fallbacks <list>` define modelos de fallback por tarefa, por exemplo `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; passe `--fallbacks ""` para uma execução estrita sem fallbacks. `cron edit <job-id> --clear-fallbacks` remove a substituição de fallback por tarefa. `cron edit <job-id> --clear-model` remove a substituição de modelo por tarefa para que a tarefa siga a precedência normal de seleção de modelo do Cron (uma substituição de sessão Cron armazenada, se presente, caso contrário o modelo do agente/padrão); isso não pode ser combinado com `--model`. `cron add|edit --thinking <level>` define uma substituição de thinking por tarefa; `cron edit <job-id> --clear-thinking` a remove para que a tarefa siga a precedência normal de thinking do Cron, e isso não pode ser combinado com `--thinking`.

<Warning>
Se o modelo não for permitido ou não puder ser resolvido, o Cron falha a execução com um erro de validação explícito em vez de fazer fallback para a seleção de modelo do agente da tarefa ou do modelo padrão.
</Warning>

Cron `--model` é um **primário da tarefa**, não uma substituição de `/model` de sessão de chat. Isso significa:

- Fallbacks de modelo configurados ainda se aplicam quando o modelo da tarefa selecionado falha.
- O payload `fallbacks` por tarefa substitui a lista de fallback configurada quando presente.
- Uma lista vazia de fallback por tarefa (`--fallbacks ""` ou `fallbacks: []` no payload/API da tarefa) torna a execução de Cron estrita.
- Quando uma tarefa tem `--model`, mas nenhuma lista de fallback está configurada, o OpenClaw passa uma substituição de fallback vazia explícita para que o primário do agente não seja anexado como um destino oculto de nova tentativa.
- Verificações prévias de provedor local percorrem os fallbacks configurados antes de marcar uma execução de Cron como `skipped`.

`openclaw doctor` relata tarefas que já têm `payload.model` definido, incluindo contagens de namespace de provedor e divergências em relação a `agents.defaults.model`. Use essa verificação quando o comportamento de autenticação, provedor ou cobrança parecer diferente entre chat ao vivo e tarefas agendadas.

### Precedência de modelo em Cron isolado

Cron isolado resolve o modelo ativo nesta ordem:

1. Substituição de hook do Gmail.
2. `--model` por tarefa.
3. Substituição de modelo de sessão Cron armazenada (quando o usuário selecionou uma).
4. Seleção de modelo do agente ou padrão.

### Modo rápido

O modo rápido de Cron isolado segue a seleção de modelo ao vivo resolvida. A configuração de modelo `params.fastMode` se aplica por padrão, mas uma substituição de sessão armazenada `fastMode` ainda prevalece sobre a configuração. Quando o modo resolvido é `auto`, o limite usa o valor `params.fastAutoOnSeconds` do modelo selecionado, com padrão de 60 segundos.

### Novas tentativas de troca de modelo ao vivo

Se uma execução isolada lançar `LiveSessionModelSwitchError`, o Cron persiste o provedor e o modelo trocados (e a substituição de perfil de autenticação trocado, quando presente) para a execução ativa antes de tentar novamente. O loop externo de nova tentativa é limitado a duas novas tentativas de troca após a tentativa inicial, então aborta em vez de repetir indefinidamente.

## Saída da execução e negações

### Supressão de confirmação obsoleta

Turnos de Cron isolado suprimem respostas obsoletas apenas de confirmação. Se o primeiro resultado for apenas uma atualização de status intermediária e nenhuma execução de subagente descendente for responsável pela resposta eventual, o Cron reprompta uma vez para obter o resultado real antes da entrega.

### Supressão silenciosa de token

Se uma execução cron isolada retornar apenas o token silencioso (`NO_REPLY` ou `no_reply`), o cron suprime tanto a entrega direta de saída quanto o caminho de resumo enfileirado de fallback, então nada é publicado de volta no chat.

### Negações estruturadas

Execuções cron isoladas usam metadados estruturados de negação de execução da execução incorporada como o sinal de negação autoritativo. Elas também respeitam wrappers `UNAVAILABLE` do host do nó quando a mensagem de erro estruturada aninhada começa com `SYSTEM_RUN_DENIED` ou `INVALID_REQUEST`.

O Cron não classifica prosa de saída final nem frases de recusa que parecem aprovação como negações, a menos que a execução incorporada também forneça metadados estruturados de negação, então texto comum do assistente não é tratado como um comando bloqueado.

`cron list` e o histórico de execuções exibem o motivo da negação em vez de relatar um comando bloqueado como `ok`.

## Retenção

Retenção e poda são controladas na configuração:

- `cron.sessionRetention` (padrão `24h`) remove sessões de execuções isoladas concluídas.
- `cron.runLog.keepLines` remove linhas retidas do histórico de execuções no SQLite por job. `cron.runLog.maxBytes` continua aceito para compatibilidade com logs de execução mais antigos baseados em arquivo.

## Migração de jobs antigos

<Note>
Se você tiver jobs cron de antes do formato atual de entrega e armazenamento, execute `openclaw doctor --fix`. O Doctor normaliza campos cron legados (`jobId`, `schedule.cron`, campos de entrega de nível superior incluindo `threadId` legado, aliases de entrega `provider` do payload) e migra jobs de fallback de Webhook com `notify: true` de `cron.webhook` para entrega explícita por Webhook. Jobs que já anunciam em um chat mantêm essa entrega e recebem um destino de Webhook de conclusão. Quando `cron.webhook` não está definido, o marcador inerte de nível superior `notify` é removido de jobs sem destino de migração (a entrega existente é preservada sem alterações), então `doctor --fix` não continua emitindo novos avisos sobre eles.
</Note>

## Edições comuns

Atualize as configurações de entrega sem alterar a mensagem:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Desative a entrega para um job isolado:

```bash
openclaw cron edit <job-id> --no-deliver
```

Habilite contexto leve de bootstrap para um job isolado:

```bash
openclaw cron edit <job-id> --light-context
```

Anuncie em um canal específico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Anuncie em um tópico de fórum do Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Crie um job isolado com contexto leve de bootstrap:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` se aplica apenas a jobs isolados de turno de agente. Para execuções cron, o modo leve mantém o contexto de bootstrap vazio em vez de injetar o conjunto completo de bootstrap do workspace.

Crie um job de comando com argv, cwd, env, stdin e limites de saída exatos:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Position export" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## Comandos administrativos comuns

Execução manual e inspeção:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron run <job-id> --wait --wait-timeout 10m
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
openclaw cron runs --id <job-id> --limit 50
openclaw cron runs --id <job-id> --run-id <run-id>
```

`openclaw cron list` mostra todos os jobs correspondentes por padrão. Passe `--agent <id>` para mostrar apenas jobs cujo id de agente normalizado efetivo corresponda; jobs sem um id de agente armazenado contam como o agente padrão configurado.

`openclaw cron get <job-id>` retorna diretamente o JSON armazenado do job. Use `cron show <job-id>` quando quiser a visualização legível por humanos com prévia da rota de entrega.

`cron list --json` e `cron show <job-id> --json` incluem um campo `status` de nível superior em cada job, calculado a partir de `enabled`, `state.runningAtMs` e `state.lastRunStatus`. Valores: `disabled`, `running`, `ok`, `error`, `skipped` ou `idle`. Isso espelha a coluna de status legível por humanos para que ferramentas externas possam ler o estado do job sem derivá-lo novamente.

Entradas de `cron runs` incluem diagnósticos de entrega com o destino cron pretendido, o destino resolvido, envios da ferramenta de mensagem, uso de fallback e estado entregue.

Redirecionamento de agente e sessão:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` avisa quando `--agent` é omitido em jobs de turno de agente e recorre ao agente padrão (`main`). Passe `--agent <id>` no momento da criação para fixar um agente específico.

Ajustes de entrega:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Tarefas agendadas](/pt-BR/automation/cron-jobs)
