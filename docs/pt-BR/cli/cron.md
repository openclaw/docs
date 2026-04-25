---
read_when:
    - Você quer jobs agendados e ativações despertadas por agendamento
    - Você está depurando a execução do Cron e os logs
summary: Referência da CLI para `openclaw cron` (agendar e executar jobs em segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-04-25T13:43:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 281c0e0e5a3139d2b9cb7cc02afe3b9a9d4a20228a7891eb45c55b7e22c5e1c4
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gerencie jobs de Cron para o agendador do Gateway.

Relacionado:

- Jobs de Cron: [Jobs de Cron](/pt-BR/automation/cron-jobs)

Dica: execute `openclaw cron --help` para ver a superfície completa de comandos.

Observação: `openclaw cron list` e `openclaw cron show <job-id>` exibem uma prévia da
rota de entrega resolvida. Para `channel: "last"`, a prévia mostra se a
rota foi resolvida a partir da sessão principal/atual ou se falhará de forma segura.

Observação: jobs isolados de `cron add` usam entrega `--announce` por padrão. Use `--no-deliver` para manter
a saída interna. `--deliver` continua como um alias obsoleto para `--announce`.

Observação: a entrega em chat de Cron isolado é compartilhada. `--announce` é a entrega de
fallback do executor para a resposta final; `--no-deliver` desativa esse
fallback, mas não remove a ferramenta `message` do agente quando uma rota de chat está disponível.

Observação: jobs one-shot (`--at`) são excluídos após o sucesso por padrão. Use `--keep-after-run` para mantê-los.

Observação: `--session` aceita `main`, `isolated`, `current` e `session:<id>`.
Use `current` para vincular à sessão ativa no momento da criação, ou `session:<id>` para
uma chave de sessão persistente explícita.

Observação: `--session isolated` cria um novo ID de transcrição/sessão a cada execução.
Preferências seguras e substituições explícitas de modelo/autenticação selecionadas pelo usuário podem ser mantidas, mas
o contexto ambiente da conversa não: roteamento de canal/grupo, política de envio/fila,
elevação, origem e vínculo de runtime ACP são redefinidos para a nova execução isolada.

Observação: para jobs CLI one-shot, datetimes `--at` sem offset são tratados como UTC, a menos que você também passe
`--tz <iana>`, que interpreta esse horário local no fuso horário informado.

Observação: jobs recorrentes agora usam backoff exponencial de repetição após erros consecutivos (30s → 1m → 5m → 15m → 60m), depois retornam ao agendamento normal após a próxima execução bem-sucedida.

Observação: `openclaw cron run` agora retorna assim que a execução manual é enfileirada para execução. Respostas bem-sucedidas incluem `{ ok: true, enqueued: true, runId }`; use `openclaw cron runs --id <job-id>` para acompanhar o resultado final.

Observação: `openclaw cron run <job-id>` força a execução por padrão. Use `--due` para manter o
comportamento antigo de "executar somente se estiver vencido".

Observação: turnos de Cron isolado suprimem respostas obsoletas de apenas confirmação. Se o
primeiro resultado for apenas uma atualização provisória de status e nenhuma execução descendente de subagente for
responsável pela resposta final, o Cron solicita novamente uma vez o resultado real
antes da entrega.

Observação: se uma execução isolada de Cron retornar apenas o token silencioso (`NO_REPLY` /
`no_reply`), o Cron suprime a entrega direta de saída e também o caminho de resumo
enfileirado de fallback, então nada é publicado de volta no chat.

Observação: `cron add|edit --model ...` usa esse modelo permitido selecionado para o job.
Se o modelo não for permitido, o Cron emite um aviso e usa fallback para a seleção de
modelo do agente/padrão do job. Cadeias de fallback configuradas ainda se aplicam, mas uma
simples substituição de modelo sem lista explícita de fallback por job não acrescenta mais o
modelo principal do agente como um alvo extra oculto de repetição.

Observação: a precedência de modelo de Cron isolado é: substituição de hook do Gmail primeiro, depois
`--model` por job, depois qualquer substituição armazenada de modelo de sessão de Cron selecionada pelo usuário, e então a
seleção normal de agente/padrão.

Observação: o modo rápido de Cron isolado segue a seleção resolvida do modelo ativo. A configuração do modelo
`params.fastMode` se aplica por padrão, mas uma substituição armazenada de `fastMode` da sessão ainda tem prioridade sobre a configuração.

Observação: se uma execução isolada lançar `LiveSessionModelSwitchError`, o Cron persiste o
provedor/modelo alterado (e a substituição alterada de perfil de autenticação, quando presente) para a
execução ativa antes de tentar novamente. O loop externo de repetição é limitado a 2 novas tentativas de troca
após a tentativa inicial, depois aborta em vez de entrar em loop infinito.

Observação: notificações de falha usam `delivery.failureDestination` primeiro, depois
`cron.failureDestination` global e, por fim, usam fallback para o alvo principal de
announce do job quando nenhum destino explícito de falha está configurado.

Observação: retenção/poda é controlada na configuração:

- `cron.sessionRetention` (padrão `24h`) remove sessões concluídas de execuções isoladas.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` podam `~/.openclaw/cron/runs/<jobId>.jsonl`.

Observação de upgrade: se você tiver jobs de Cron antigos de antes do formato atual de entrega/armazenamento, execute
`openclaw doctor --fix`. O Doctor agora normaliza campos legados de Cron (`jobId`, `schedule.cron`,
campos de entrega de nível superior incluindo `threadId` legado, aliases de entrega `provider` no payload) e migra jobs simples
de fallback de Webhook com `notify: true` para entrega explícita por Webhook quando `cron.webhook` estiver
configurado.

## Edições comuns

Atualize configurações de entrega sem alterar a mensagem:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Desative a entrega para um job isolado:

```bash
openclaw cron edit <job-id> --no-deliver
```

Habilite contexto bootstrap leve para um job isolado:

```bash
openclaw cron edit <job-id> --light-context
```

Anuncie em um canal específico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Crie um job isolado com contexto bootstrap leve:

```bash
openclaw cron add \
  --name "Resumo matinal leve" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Resuma as atualizações da noite." \
  --light-context \
  --no-deliver
```

`--light-context` se aplica apenas a jobs isolados de turno de agente. Para execuções de Cron, o modo leve mantém o contexto bootstrap vazio em vez de injetar o conjunto completo de bootstrap do workspace.

Observação sobre propriedade da entrega:

- A entrega em chat de Cron isolado é compartilhada. O agente pode enviar diretamente com a
  ferramenta `message` quando uma rota de chat está disponível.
- `announce` entrega por fallback a resposta final apenas quando o agente não enviou
  diretamente para o alvo resolvido. `webhook` publica o payload concluído em uma URL.
  `none` desativa a entrega por fallback do executor.

## Comandos administrativos comuns

Execução manual:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Entradas de `cron runs` incluem diagnósticos de entrega com o alvo de Cron pretendido,
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

- `delivery.failureDestination` é compatível com jobs isolados.
- Jobs de sessão principal só podem usar `delivery.failureDestination` quando o modo
  principal de entrega é `webhook`.
- Se você não definir nenhum destino de falha e o job já anunciar em um
  canal, as notificações de falha reutilizarão esse mesmo alvo de announce.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Tarefas agendadas](/pt-BR/automation/cron-jobs)
