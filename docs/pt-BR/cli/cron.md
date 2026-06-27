---
read_when:
    - Você quer tarefas agendadas e despertares
    - Você está depurando a execução e os logs do Cron
summary: Referência da CLI para `openclaw cron` (agendar e executar trabalhos em segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-06-27T17:18:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa81e555d35b8982d1de9703c68dfb66aa9ad39407d46555eb0143e3cc5f52f5
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gerencie tarefas Cron para o agendador do Gateway.

<Tip>
Execute `openclaw cron --help` para ver toda a superfície de comandos. Consulte [Tarefas Cron](/pt-BR/automation/cron-jobs) para o guia conceitual.
</Tip>

## Crie tarefas rapidamente

`openclaw cron create` é um alias para `openclaw cron add`. Para novas tarefas, coloque o agendamento primeiro e o prompt em segundo:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Use `--webhook <url>` quando a tarefa deve fazer POST do payload finalizado em vez de entregá-lo a um alvo de chat:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Use `--command` para tarefas determinísticas no estilo shell que devem ser executadas dentro do Cron do OpenClaw sem iniciar uma execução isolada de agente/modelo:

<Note>
Tarefas Cron de comando são automações do Gateway criadas por administradores. Criá-las, editá-las,
removê-las ou executá-las manualmente exige `operator.admin`; a execução agendada
posterior roda no processo do Gateway, não como uma chamada de ferramenta `tools.exec` do agente.
`tools.exec.*` e aprovações de exec ainda governam ferramentas exec visíveis ao modelo.
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

`--command <shell>` armazena `argv: ["sh", "-lc", <shell>]`. Use `--command-argv '["node","scripts/report.mjs"]'` para execução exata de argv. Tarefas de comando capturam stdout/stderr, registram histórico normal do Cron e encaminham a saída pelos mesmos modos de entrega `announce`, `webhook` ou `none` das tarefas isoladas. Um comando que imprime apenas `NO_REPLY` é suprimido.

## Sessões

`--session` aceita `main`, `isolated`, `current` ou `session:<id>`.

<AccordionGroup>
  <Accordion title="Chaves de sessão">
    - `main` vincula à sessão principal do agente.
    - `isolated` cria uma transcrição nova e um ID de sessão para cada execução.
    - `current` vincula à sessão ativa no momento da criação.
    - `session:<id>` fixa uma chave de sessão persistente explícita.

  </Accordion>
  <Accordion title="Semântica de sessão isolada">
    Execuções isoladas redefinem o contexto de conversa ambiente. Roteamento de canal e grupo, política de envio/fila, elevação, origem e vinculação de runtime ACP são redefinidos para a nova execução. Preferências seguras e substituições explícitas de modelo ou autenticação selecionadas pelo usuário podem ser preservadas entre execuções.
  </Accordion>
</AccordionGroup>

## Entrega

`openclaw cron list` e `openclaw cron show <job-id>` pré-visualizam a rota de entrega resolvida. Para `channel: "last"`, a prévia mostra se a rota foi resolvida a partir da sessão principal ou atual, ou se falhará de forma fechada.

Alvos com prefixo de provedor podem desambiguar canais de anúncio não resolvidos. Por exemplo, `to: "telegram:123"` seleciona Telegram quando `delivery.channel` é omitido ou é `last`. Apenas prefixos anunciados pelo Plugin carregado são seletores de provedor. Se `delivery.channel` for explícito, o prefixo deve corresponder a esse canal; `channel: "whatsapp"` com `to: "telegram:123"` é rejeitado. Prefixos de serviço como `imessage:` e `sms:` continuam sendo sintaxe de alvo pertencente ao canal.

<Note>
Tarefas isoladas `cron add` usam entrega `--announce` por padrão. Use `--no-deliver` para manter a saída interna. `--deliver` permanece como um alias obsoleto para `--announce`.
</Note>

### Propriedade da entrega

A entrega de chat do Cron isolado é compartilhada entre o agente e o executor:

- O agente pode enviar diretamente usando a ferramenta `message` quando uma rota de chat está disponível.
- `announce` faz a entrega de fallback da resposta final apenas quando o agente não enviou diretamente ao alvo resolvido.
- `webhook` publica o payload finalizado em uma URL.
- `none` desativa a entrega de fallback do executor.

Use `cron add|create --webhook <url>` ou `cron edit <job-id> --webhook <url>` para definir a entrega por Webhook. Não combine `--webhook` com flags de entrega de chat como `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` ou `--account`.

`cron edit <job-id>` pode remover campos individuais de roteamento de entrega com `--clear-channel`, `--clear-to`, `--clear-thread-id` e `--clear-account` (cada um é rejeitado quando combinado com sua flag de definição correspondente). Diferentemente de `--no-deliver`, que apenas desativa a entrega de fallback do executor, estes removem o campo armazenado para que a tarefa resolva novamente essa parte da rota a partir dos padrões.

`--announce` é a entrega de fallback do executor para a resposta final. `--no-deliver` desativa esse fallback, mas não remove a ferramenta `message` do agente quando uma rota de chat está disponível.

Lembretes criados a partir de um chat ativo preservam o alvo de entrega do chat ao vivo para a entrega de anúncio de fallback. Chaves de sessão internas podem estar em minúsculas; não as use como fonte da verdade para IDs de provedor sensíveis a maiúsculas e minúsculas, como IDs de sala do Matrix.

### Entrega de falhas

Notificações de falha são resolvidas nesta ordem:

1. `delivery.failureDestination` na tarefa.
2. `cron.failureDestination` global.
3. O alvo principal de anúncio da tarefa (quando nenhum destino explícito de falha está definido).

<Note>
Tarefas de sessão principal só podem usar `delivery.failureDestination` quando o modo de entrega principal é `webhook`. Tarefas isoladas o aceitam em todos os modos.
</Note>

Observação: execuções isoladas de Cron tratam falhas de agente em nível de execução como erros de tarefa mesmo quando
nenhum payload de resposta é produzido, portanto falhas de modelo/provedor ainda incrementam contadores
de erro e disparam notificações de falha.

Tarefas Cron de comando não iniciam um turno de agente isolado. Um código de saída zero registra
`ok`; saída diferente de zero, sinal, timeout ou timeout por falta de saída registra `error` e
pode disparar o mesmo caminho de notificação de falha.

Se uma execução isolada atinge timeout antes da primeira solicitação ao modelo, `openclaw cron show`
e `openclaw cron runs` incluem um erro específico de fase, como
`setup timed out before runner start` ou
`stalled before first model call (last phase: context-engine)`.
Para provedores baseados em CLI, o watchdog pré-modelo permanece ativo até que o turno da CLI externa
comece, portanto travamentos de busca de sessão, hook, autenticação, prompt e configuração da CLI são
relatados como falhas de Cron pré-modelo.

## Agendamento

### Tarefas de execução única

`--at <datetime>` agenda uma execução única. Datetimes sem offset são tratados como UTC, a menos que você também passe `--tz <iana>`, que interpreta o horário de relógio na timezone fornecida.

<Note>
Tarefas de execução única são excluídas após sucesso por padrão. Use `--keep-after-run` para preservá-las.
</Note>

### Tarefas recorrentes

Tarefas recorrentes usam backoff exponencial de nova tentativa após erros consecutivos: 30s, 1m, 5m, 15m, 60m. O agendamento volta ao normal após a próxima execução bem-sucedida.

Execuções ignoradas são rastreadas separadamente de erros de execução. Elas não afetam o backoff de nova tentativa, mas `openclaw cron edit <job-id> --failure-alert-include-skipped` pode incluir notificações repetidas de execuções ignoradas nos alertas de falha.

Para tarefas isoladas que têm como alvo um provedor de modelo local configurado, o Cron executa um preflight leve do provedor antes de iniciar o turno do agente. Provedores `api: "ollama"` de Loopback, rede privada e `.local` são sondados em `/api/tags`; provedores locais compatíveis com OpenAI, como vLLM, SGLang e LM Studio, são sondados em `/models`. Se o endpoint estiver inacessível, a execução é registrada como `skipped` e tentada novamente em um agendamento posterior; endpoints inativos correspondentes ficam em cache por 5 minutos para evitar que muitas tarefas sobrecarreguem o mesmo servidor local.

Observação: tarefas Cron, estado de runtime pendente e histórico de execução ficam no banco de dados de estado SQLite compartilhado. Arquivos legados `jobs.json`, `jobs-state.json` e `runs/*.jsonl` são importados uma vez e renomeados com o sufixo `.migrated`. Após a importação, edite agendamentos com `openclaw cron add|edit|remove` em vez de editar arquivos JSON.

### Execuções manuais

`openclaw cron run <job-id>` força a execução por padrão e retorna assim que a execução manual é enfileirada. Respostas bem-sucedidas incluem `{ ok: true, enqueued: true, runId }`. Use o `runId` retornado para inspecionar o resultado posterior:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Adicione `--wait` quando um script deve bloquear até que exatamente essa execução enfileirada registre um status terminal:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Com `--wait`, a CLI ainda chama `cron.run` primeiro e depois consulta `cron.runs` para o `runId` retornado. O comando sai com `0` apenas quando a execução termina com status `ok`. Ele sai com código diferente de zero quando a execução termina com `error` ou `skipped`, quando a resposta do Gateway não inclui um `runId` ou quando `--wait-timeout` expira. `--poll-interval` deve ser maior que zero.

<Note>
Use `--due` quando quiser que o comando manual execute apenas se a tarefa estiver atualmente vencida. Se `--due --wait` não enfileirar uma execução, o comando retorna a resposta normal sem execução em vez de consultar.
</Note>

## Modelos

`cron add|edit --model <ref>` seleciona um modelo permitido para a tarefa. `cron add|edit --fallbacks <list>` define modelos de fallback por tarefa, por exemplo `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; passe `--fallbacks ""` para uma execução estrita sem fallbacks. `cron edit <job-id> --clear-fallbacks` remove a substituição de fallback por tarefa. `cron edit <job-id> --clear-model` remove a substituição de modelo por tarefa para que a tarefa siga a precedência normal de seleção de modelo do Cron (uma substituição de sessão Cron armazenada, se presente; caso contrário, o modelo do agente/padrão); ele não pode ser combinado com `--model`.

<Warning>
Se o modelo não for permitido ou não puder ser resolvido, o Cron falha a execução com um erro de validação explícito em vez de fazer fallback para a seleção de modelo do agente da tarefa ou do padrão.
</Warning>

Cron `--model` é um **primário da tarefa**, não uma substituição `/model` de sessão de chat. Isso significa:

- Fallbacks de modelo configurados ainda se aplicam quando o modelo da tarefa selecionado falha.
- O payload `fallbacks` por tarefa substitui a lista de fallback configurada quando presente.
- Uma lista de fallback por tarefa vazia (`--fallbacks ""` ou `fallbacks: []` no payload/API da tarefa) torna a execução Cron estrita.
- Quando uma tarefa tem `--model`, mas nenhuma lista de fallback está configurada, o OpenClaw passa uma substituição explícita de fallback vazia para que o primário do agente não seja anexado como um alvo oculto de nova tentativa.
- Verificações de preflight de provedores locais percorrem os fallbacks configurados antes de marcar uma execução Cron como `skipped`.

`openclaw doctor` relata tarefas que já têm `payload.model` definido, incluindo contagens de namespace de provedor e divergências em relação a `agents.defaults.model`. Use essa verificação quando o comportamento de autenticação, provedor ou cobrança parecer diferente entre chat ao vivo e tarefas agendadas.

### Precedência de modelo do Cron isolado

O Cron isolado resolve o modelo ativo nesta ordem:

1. Substituição de hook do Gmail.
2. `--model` por tarefa.
3. Substituição de modelo de sessão Cron armazenada (quando o usuário selecionou uma).
4. Seleção de modelo do agente ou padrão.

### Modo rápido

O modo rápido do Cron isolado segue a seleção de modelo ao vivo resolvida. A configuração de modelo `params.fastMode` se aplica por padrão, mas uma substituição de sessão armazenada `fastMode` ainda prevalece sobre a configuração. Quando o modo resolvido é `auto`, o corte usa o valor `params.fastAutoOnSeconds` do modelo selecionado, com padrão de 60 segundos.

### Novas tentativas de troca de modelo ao vivo

Se uma execução isolada lançar `LiveSessionModelSwitchError`, o Cron persiste o provedor e o modelo trocados (e a substituição de perfil de autenticação trocado quando presente) para a execução ativa antes de tentar novamente. O loop externo de novas tentativas é limitado a duas novas tentativas de troca após a tentativa inicial e depois aborta em vez de entrar em loop infinito.

## Saída de execução e negações

### Supressão de confirmação obsoleta

Turnos isolados de Cron suprimem respostas obsoletas que são apenas confirmações. Se o primeiro resultado for apenas uma atualização de status provisória e nenhuma execução de subagente descendente for responsável pela resposta eventual, o Cron solicita novamente uma vez pelo resultado real antes da entrega.

### Supressão de token silencioso

Se uma execução isolada de Cron retornar apenas o token silencioso (`NO_REPLY` ou `no_reply`), o Cron suprime tanto a entrega direta de saída quanto o caminho de resumo enfileirado de fallback, portanto nada é publicado de volta no chat.

### Negações estruturadas

Execuções Cron isoladas usam metadados estruturados de negação de execução da execução incorporada como o sinal autoritativo de negação. Elas também respeitam wrappers `UNAVAILABLE` do host Node quando a mensagem de erro estruturada aninhada começa com `SYSTEM_RUN_DENIED` ou `INVALID_REQUEST`.

Cron não classifica prosa de saída final ou frases de recusa com aparência de aprovação como negações, a menos que a execução incorporada também forneça metadados estruturados de negação, portanto texto comum do assistente não é tratado como um comando bloqueado.

`cron list` e o histórico de execuções exibem o motivo da negação em vez de relatar um comando bloqueado como `ok`.

## Retenção

A retenção e a poda são controladas na configuração:

- `cron.sessionRetention` (padrão `24h`) poda sessões de execução isolada concluídas.
- `cron.runLog.keepLines` poda linhas retidas do histórico de execuções em SQLite por job. `cron.runLog.maxBytes` continua aceito por compatibilidade com logs de execução mais antigos baseados em arquivo.

## Migrando jobs mais antigos

<Note>
Se você tem jobs Cron anteriores ao formato atual de entrega e armazenamento, execute `openclaw doctor --fix`. O Doctor normaliza campos Cron legados (`jobId`, `schedule.cron`, campos de entrega de nível superior incluindo `threadId` legado, aliases de entrega `provider` no payload) e migra jobs de fallback de Webhook `notify: true` de `cron.webhook` para entrega explícita por Webhook. Jobs que já anunciam em um chat mantêm essa entrega e recebem um destino de Webhook de conclusão. Quando `cron.webhook` não está definido, o marcador inerte de nível superior `notify` é removido para jobs sem alvo de migração (a entrega existente é preservada sem alterações), então `doctor --fix` não continua reavisando sobre eles.
</Note>

## Edições comuns

Atualize configurações de entrega sem alterar a mensagem:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Desabilite a entrega para um job isolado:

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

`--light-context` se aplica apenas a jobs de turno de agente isolados. Para execuções Cron, o modo leve mantém o contexto de bootstrap vazio em vez de injetar o conjunto completo de bootstrap do workspace.

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

`openclaw cron list` mostra todos os jobs correspondentes por padrão. Passe `--agent <id>` para mostrar apenas jobs cujo id de agente normalizado efetivo corresponde; jobs sem um id de agente armazenado contam como o agente padrão configurado.

`openclaw cron get <job-id>` retorna diretamente o JSON do job armazenado. Use `cron show <job-id>` quando quiser a visualização legível por humanos com prévia da rota de entrega.

`cron list --json` e `cron show <job-id> --json` incluem um campo `status` de nível superior em cada job, calculado a partir de `enabled`, `state.runningAtMs` e `state.lastRunStatus`. Valores: `disabled`, `running`, `ok`, `error`, `skipped` ou `idle`. Isso espelha a coluna de status legível por humanos para que ferramentas externas possam ler o estado do job sem recalculá-lo.

Entradas de `cron runs` incluem diagnósticos de entrega com o alvo Cron pretendido, o alvo resolvido, envios de ferramenta de mensagem, uso de fallback e estado entregue.

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
