---
read_when:
    - Você quer tarefas agendadas e ativações programadas
    - Você está depurando a execução e os logs do Cron
summary: Referência da CLI para `openclaw cron` (agendar e executar tarefas em segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-04-24T05:44:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3f5c262092b9b5b821ec824bc02dbbd806936d91f1d03ac6eb789f7e71ffc07
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gerencie tarefas Cron para o agendador do Gateway.

Relacionado:

- Tarefas Cron: [Cron jobs](/pt-BR/automation/cron-jobs)

Dica: execute `openclaw cron --help` para ver toda a superfície de comandos.

Observação: `openclaw cron list` e `openclaw cron show <job-id>` mostram uma prévia da
rota de entrega resolvida. Para `channel: "last"`, a prévia mostra se a
rota foi resolvida a partir da sessão principal/atual ou se falhará de forma segura.

Observação: tarefas isoladas de `cron add` usam `--announce` por padrão para entrega. Use `--no-deliver` para manter a
saída interna. `--deliver` continua como alias obsoleto para `--announce`.

Observação: a entrega por chat de Cron isolado é compartilhada. `--announce` é a entrega de fallback do executor
para a resposta final; `--no-deliver` desabilita esse fallback, mas não
remove a ferramenta `message` do agente quando uma rota de chat está disponível.

Observação: tarefas de execução única (`--at`) são excluídas após sucesso por padrão. Use `--keep-after-run` para mantê-las.

Observação: `--session` oferece suporte a `main`, `isolated`, `current` e `session:<id>`.
Use `current` para vincular à sessão ativa no momento da criação, ou `session:<id>` para
uma chave de sessão persistente explícita.

Observação: para tarefas CLI de execução única, datetimes `--at` sem offset são tratados como UTC, a menos que você também passe
`--tz <iana>`, que interpreta esse horário local na timezone informada.

Observação: tarefas recorrentes agora usam backoff exponencial de nova tentativa após erros consecutivos (30s → 1m → 5m → 15m → 60m), depois retornam à agenda normal após a próxima execução bem-sucedida.

Observação: `openclaw cron run` agora retorna assim que a execução manual é enfileirada para execução. Respostas bem-sucedidas incluem `{ ok: true, enqueued: true, runId }`; use `openclaw cron runs --id <job-id>` para acompanhar o resultado final.

Observação: `openclaw cron run <job-id>` força a execução por padrão. Use `--due` para manter o
comportamento antigo de "executar apenas se estiver no horário".

Observação: turnos isolados de Cron suprimem respostas obsoletas apenas de confirmação. Se o
primeiro resultado for apenas uma atualização de status intermediária e nenhuma execução descendente de subagente
for responsável pela resposta final, o Cron solicita novamente uma vez pelo resultado real
antes da entrega.

Observação: se uma execução isolada de Cron retornar apenas o token silencioso (`NO_REPLY` /
`no_reply`), o Cron suprime tanto a entrega direta de saída quanto o caminho de fallback
de resumo enfileirado, então nada é publicado de volta no chat.

Observação: `cron add|edit --model ...` usa esse modelo permitido selecionado para a tarefa.
Se o modelo não for permitido, o Cron emite um aviso e usa fallback para a seleção normal
de modelo da tarefa/agente em vez disso. Cadeias de fallback configuradas ainda se aplicam, mas uma simples
sobrescrita de modelo sem lista explícita de fallback por tarefa não acrescenta mais o modelo principal
do agente como alvo extra oculto de nova tentativa.

Observação: a precedência de modelo para Cron isolado é primeiro a sobrescrita de hook do Gmail, depois o
`--model` por tarefa, depois qualquer sobrescrita de modelo de sessão de Cron armazenada e, então, a seleção normal
de agente/padrão.

Observação: o modo rápido de Cron isolado segue a seleção resolvida de modelo ativo. A configuração do
modelo `params.fastMode` se aplica por padrão, mas uma sobrescrita armazenada de `fastMode` da sessão ainda tem precedência sobre a configuração.

Observação: se uma execução isolada gerar `LiveSessionModelSwitchError`, o Cron persiste o
provedor/modelo alterado (e a sobrescrita alterada do perfil de autenticação, quando presente) antes
de tentar novamente. O loop externo de nova tentativa é limitado a 2 novas tentativas de troca após a tentativa inicial,
então aborta em vez de entrar em loop infinito.

Observação: notificações de falha usam `delivery.failureDestination` primeiro, depois
`cron.failureDestination` global e, por fim, usam fallback para o alvo principal de
anúncio da tarefa quando nenhum destino explícito de falha é configurado.

Observação: retenção/poda é controlada na configuração:

- `cron.sessionRetention` (padrão `24h`) remove sessões concluídas de execuções isoladas.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` fazem a poda de `~/.openclaw/cron/runs/<jobId>.jsonl`.

Observação de upgrade: se você tiver tarefas Cron antigas de antes do formato atual de entrega/armazenamento, execute
`openclaw doctor --fix`. O Doctor agora normaliza campos legados de Cron (`jobId`, `schedule.cron`,
campos de entrega de nível superior incluindo `threadId` legado, aliases de entrega `provider` de payload) e migra tarefas simples
de fallback de Webhook com `notify: true` para entrega explícita por Webhook quando `cron.webhook` está
configurado.

## Edições comuns

Atualize configurações de entrega sem alterar a mensagem:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Desabilite a entrega para uma tarefa isolada:

```bash
openclaw cron edit <job-id> --no-deliver
```

Habilite contexto leve de bootstrap para uma tarefa isolada:

```bash
openclaw cron edit <job-id> --light-context
```

Anuncie em um canal específico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Crie uma tarefa isolada com contexto leve de bootstrap:

```bash
openclaw cron add \
  --name "Resumo matinal leve" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Resuma as atualizações da noite." \
  --light-context \
  --no-deliver
```

`--light-context` se aplica apenas a tarefas isoladas de turno de agente. Para execuções de Cron, o modo leve mantém o contexto de bootstrap vazio em vez de injetar o conjunto completo de bootstrap do workspace.

Observação sobre propriedade da entrega:

- A entrega por chat de Cron isolado é compartilhada. O agente pode enviar diretamente com a
  ferramenta `message` quando uma rota de chat está disponível.
- `announce` faz a entrega de fallback da resposta final apenas quando o agente não enviou
  diretamente ao alvo resolvido. `webhook` publica o payload finalizado em uma URL.
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

Entradas de `cron runs` incluem diagnósticos de entrega com o alvo pretendido do Cron,
o alvo resolvido, envios da ferramenta de mensagem, uso de fallback e estado de entrega.

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

Observação sobre entrega de falha:

- `delivery.failureDestination` é compatível com tarefas isoladas.
- Tarefas da sessão principal só podem usar `delivery.failureDestination` quando o modo primário
  de entrega for `webhook`.
- Se você não definir nenhum destino de falha e a tarefa já anunciar em um
  canal, as notificações de falha reutilizarão esse mesmo alvo de anúncio.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Tarefas agendadas](/pt-BR/automation/cron-jobs)
