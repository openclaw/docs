---
read_when:
    - Você quer tarefas agendadas e ativações programadas
    - Você está depurando a execução e os logs do Cron
summary: Referência da CLI para `openclaw cron` (agendar e executar tarefas em segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-04-23T14:00:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5216f220748b05df5202af778878b37148d6abe235be9fe82ddcf976d51532a
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gerencie tarefas Cron para o agendador do Gateway.

Relacionado:

- Tarefas Cron: [Tarefas Cron](/pt-BR/automation/cron-jobs)

Dica: execute `openclaw cron --help` para ver toda a superfície de comandos.

Observação: `openclaw cron list` e `openclaw cron show <job-id>` mostram uma prévia da
rota de entrega resolvida. Para `channel: "last"`, a prévia mostra se a
rota foi resolvida a partir da sessão principal/atual ou se falhará em modo fechado.

Observação: tarefas isoladas de `cron add` usam `--announce` como entrega padrão. Use `--no-deliver` para manter
a saída interna. `--deliver` continua disponível como alias obsoleto para `--announce`.

Observação: a entrega em chat do cron isolado é compartilhada. `--announce` é a entrega
de fallback do executor para a resposta final; `--no-deliver` desabilita esse fallback, mas
não remove a ferramenta `message` do agente quando há uma rota de chat disponível.

Observação: tarefas de execução única (`--at`) são excluídas após sucesso por padrão. Use `--keep-after-run` para mantê-las.

Observação: `--session` aceita `main`, `isolated`, `current` e `session:<id>`.
Use `current` para vincular à sessão ativa no momento da criação, ou `session:<id>` para
uma chave de sessão persistente explícita.

Observação: para tarefas CLI de execução única, datetimes em `--at` sem offset são tratados como UTC, a menos que você também passe
`--tz <iana>`, que interpreta esse horário local no fuso horário informado.

Observação: tarefas recorrentes agora usam backoff exponencial de repetição após erros consecutivos (30s → 1m → 5m → 15m → 60m) e depois retornam ao agendamento normal após a próxima execução bem-sucedida.

Observação: `openclaw cron run` agora retorna assim que a execução manual é enfileirada para execução. Respostas bem-sucedidas incluem `{ ok: true, enqueued: true, runId }`; use `openclaw cron runs --id <job-id>` para acompanhar o resultado final.

Observação: `openclaw cron run <job-id>` força a execução por padrão. Use `--due` para manter o
comportamento antigo de “executar apenas se estiver vencida”.

Observação: rodadas isoladas de cron suprimem respostas antigas apenas de confirmação. Se o
primeiro resultado for apenas uma atualização intermediária de status e nenhuma execução descendente de subagente
for responsável pela resposta final, o cron faz uma nova solicitação uma vez para obter o resultado real antes da entrega.

Observação: se uma execução isolada retornar apenas o token silencioso (`NO_REPLY` /
`no_reply`), o cron suprime tanto a entrega direta de saída quanto o caminho de resumo
enfileirado de fallback, então nada é publicado de volta no chat.

Observação: `cron add|edit --model ...` usa esse modelo permitido selecionado para a tarefa.
Se o modelo não for permitido, o cron emite um aviso e recorre à seleção normal de
modelo da tarefa/agente/padrão. Cadeias de fallback configuradas ainda se aplicam, mas uma simples
substituição de modelo sem uma lista explícita de fallback por tarefa não acrescenta mais o modelo principal do
agente como um alvo extra oculto de nova tentativa.

Observação: a precedência de modelo do cron isolado é primeiro a substituição do hook do Gmail, depois
`--model` por tarefa, depois qualquer substituição de modelo da sessão de cron armazenada, e então a seleção normal
do agente/padrão.

Observação: o modo rápido do cron isolado segue a seleção de modelo live resolvida. A configuração de modelo
`params.fastMode` se aplica por padrão, mas uma substituição armazenada de `fastMode` na sessão ainda prevalece sobre a configuração.

Observação: se uma execução isolada lançar `LiveSessionModelSwitchError`, o cron persiste o
provider/model trocado (e a substituição trocada do perfil de autenticação, quando presente) antes de
tentar novamente. O loop externo de repetição é limitado a 2 repetições por troca após a tentativa inicial e então aborta em vez de entrar em loop infinito.

Observação: notificações de falha usam `delivery.failureDestination` primeiro, depois
`cron.failureDestination` global e, por fim, recorrem ao destino principal de
anúncio da tarefa quando nenhum destino explícito de falha está configurado.

Observação: retenção/poda é controlada na configuração:

- `cron.sessionRetention` (padrão `24h`) remove sessões concluídas de execuções isoladas.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` podam `~/.openclaw/cron/runs/<jobId>.jsonl`.

Observação de atualização: se você tiver tarefas Cron antigas de antes do formato atual de entrega/armazenamento, execute
`openclaw doctor --fix`. O doctor agora normaliza campos legados de cron (`jobId`, `schedule.cron`,
campos de entrega de nível superior, incluindo o legado `threadId`, aliases de entrega `provider` no payload) e migra tarefas simples de fallback de Webhook com
`notify: true` para entrega explícita por Webhook quando `cron.webhook` estiver
configurado.

## Edições comuns

Atualize as configurações de entrega sem alterar a mensagem:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Desabilite a entrega para uma tarefa isolada:

```bash
openclaw cron edit <job-id> --no-deliver
```

Habilite contexto inicial leve para uma tarefa isolada:

```bash
openclaw cron edit <job-id> --light-context
```

Anuncie em um canal específico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Crie uma tarefa isolada com contexto inicial leve:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` se aplica apenas a tarefas isoladas de rodada de agente. Para execuções de cron, o modo leve mantém o contexto inicial vazio em vez de injetar o conjunto completo de bootstrap do espaço de trabalho.

Observação sobre propriedade da entrega:

- A entrega em chat do cron isolado é compartilhada. O agente pode enviar diretamente com a
  ferramenta `message` quando uma rota de chat estiver disponível.
- `announce` entrega por fallback a resposta final apenas quando o agente não enviou
  diretamente para o destino resolvido. `webhook` publica o payload concluído em uma URL.
  `none` desabilita a entrega de fallback do executor.

## Comandos administrativos comuns

Execução manual:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Entradas de `cron runs` incluem diagnósticos de entrega com o destino cron pretendido,
o destino resolvido, envios da ferramenta de mensagem, uso de fallback e estado de entrega.

Redirecionamento de agente/sessão:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Ajustes de entrega:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Observação sobre entrega de falhas:

- `delivery.failureDestination` é compatível com tarefas isoladas.
- Tarefas de sessão principal só podem usar `delivery.failureDestination` quando o modo principal
  de entrega for `webhook`.
- Se você não definir nenhum destino de falha e a tarefa já anunciar em um
  canal, as notificações de falha reutilizarão esse mesmo destino de anúncio.
