---
read_when:
    - Você quer trabalhos agendados e acionamentos programados
    - Você está depurando a execução e os logs do Cron
summary: Referência da CLI para `openclaw cron` (agendar e executar trabalhos em segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-04-26T11:25:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55cadcf73550367d399b7ca78e842f12a8113f2ec8749f59dadf2bbb5f8417ae
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gerencie trabalhos Cron para o agendador do Gateway.

Relacionado:

- Trabalhos Cron: [trabalhos Cron](/pt-BR/automation/cron-jobs)

Dica: execute `openclaw cron --help` para ver toda a superfície de comandos.

Observação: `openclaw cron list` e `openclaw cron show <job-id>` exibem uma prévia da rota de entrega resolvida. Para `channel: "last"`, a prévia mostra se a rota foi resolvida a partir da sessão principal/atual ou se falhará de forma fechada.

Observação: trabalhos isolados criados com `cron add` usam `--announce` por padrão para entrega. Use `--no-deliver` para manter a saída interna. `--deliver` continua como um alias obsoleto para `--announce`.

Observação: a entrega de chat do Cron isolado é compartilhada. `--announce` é a entrega de fallback do executor para a resposta final; `--no-deliver` desativa esse fallback, mas não remove a ferramenta `message` do agente quando uma rota de chat está disponível.

Observação: trabalhos de execução única (`--at`) são excluídos após sucesso por padrão. Use `--keep-after-run` para mantê-los.

Observação: `--session` oferece suporte a `main`, `isolated`, `current` e `session:<id>`. Use `current` para vincular à sessão ativa no momento da criação, ou `session:<id>` para uma chave de sessão persistente explícita.

Observação: `--session isolated` cria um novo transcript/id de sessão para cada execução. Preferências seguras e substituições explícitas de modelo/autenticação selecionadas pelo usuário podem ser mantidas, mas o contexto ambiente da conversa não: roteamento de canal/grupo, política de envio/fila, elevação, origem e binding de runtime do ACP são redefinidos para a nova execução isolada.

Observação: para trabalhos CLI de execução única, datas/horas `--at` sem offset são tratadas como UTC, a menos que você também passe `--tz <iana>`, que interpreta esse horário local na timezone informada.

Observação: trabalhos recorrentes agora usam recuo exponencial de repetição após erros consecutivos (30s → 1m → 5m → 15m → 60m) e então retornam ao agendamento normal após a próxima execução bem-sucedida.

Observação: `openclaw cron run` agora retorna assim que a execução manual é colocada na fila para execução. Respostas bem-sucedidas incluem `{ ok: true, enqueued: true, runId }`; use `openclaw cron runs --id <job-id>` para acompanhar o resultado final.

Observação: `openclaw cron run <job-id>` força a execução por padrão. Use `--due` para manter o comportamento antigo de "executar apenas se estiver vencido".

Observação: execuções isoladas do Cron suprimem respostas obsoletas que sejam apenas de confirmação. Se o primeiro resultado for apenas uma atualização de status intermediária e nenhuma execução descendente de subagente for responsável pela resposta final, o Cron repete o prompt uma vez para obter o resultado real antes da entrega.

Observação: se uma execução isolada do Cron retornar apenas o token silencioso (`NO_REPLY` / `no_reply`), o Cron suprime tanto a entrega direta de saída quanto o caminho de resumo em fila de fallback, então nada é publicado de volta no chat.

Observação: `cron add|edit --model ...` usa esse modelo permitido selecionado para o trabalho. Se o modelo não for permitido, o Cron avisa e faz fallback para a seleção de modelo do agente/padrão do trabalho. Cadeias de fallback configuradas ainda se aplicam, mas uma simples substituição de modelo sem uma lista explícita de fallback por trabalho não acrescenta mais o modelo primário do agente como um alvo extra oculto de repetição.

Observação: a precedência de modelo no Cron isolado é, primeiro, substituição de hook do Gmail, depois `--model` por trabalho, depois qualquer substituição de modelo de sessão-Cron armazenada e selecionada pelo usuário, e então a seleção normal do agente/padrão.

Observação: o modo rápido do Cron isolado segue a seleção de modelo ativo resolvida. A configuração do modelo `params.fastMode` se aplica por padrão, mas uma substituição `fastMode` de sessão armazenada ainda tem prioridade sobre a configuração.

Observação: se uma execução isolada lançar `LiveSessionModelSwitchError`, o Cron persiste o provider/model alternado (e a substituição do perfil de autenticação alterado, quando presente) para a execução ativa antes de tentar novamente. O loop externo de repetição é limitado a 2 novas tentativas de troca após a tentativa inicial, e então aborta em vez de entrar em loop infinito.

Observação: notificações de falha usam `delivery.failureDestination` primeiro, depois `cron.failureDestination` global e, por fim, fazem fallback para o alvo principal de anúncio do trabalho quando nenhum destino explícito de falha estiver configurado.

Observação: retenção/poda é controlada na configuração:

- `cron.sessionRetention` (padrão `24h`) remove sessões concluídas de execuções isoladas.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` podam `~/.openclaw/cron/runs/<jobId>.jsonl`.

Observação de upgrade: se você tem trabalhos Cron antigos de antes do formato atual de entrega/armazenamento, execute `openclaw doctor --fix`. O Doctor agora normaliza campos legados do Cron (`jobId`, `schedule.cron`, campos de entrega de nível superior incluindo `threadId` legado, aliases de entrega `provider` do payload) e migra trabalhos simples de fallback de Webhook com `notify: true` para entrega explícita por Webhook quando `cron.webhook` está configurado.

## Edições comuns

Atualize configurações de entrega sem mudar a mensagem:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Desative a entrega para um trabalho isolado:

```bash
openclaw cron edit <job-id> --no-deliver
```

Ative contexto de bootstrap leve para um trabalho isolado:

```bash
openclaw cron edit <job-id> --light-context
```

Anuncie em um canal específico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Crie um trabalho isolado com contexto de bootstrap leve:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` se aplica apenas a trabalhos isolados de turno de agente. Para execuções Cron, o modo leve mantém o contexto de bootstrap vazio em vez de injetar o conjunto completo de bootstrap do workspace.

Observação sobre propriedade da entrega:

- A entrega de chat do Cron isolado é compartilhada. O agente pode enviar diretamente com a ferramenta `message` quando uma rota de chat estiver disponível.
- `announce` entrega por fallback a resposta final apenas quando o agente não enviou diretamente para o alvo resolvido. `webhook` publica o payload finalizado em uma URL. `none` desativa a entrega de fallback do executor.
- Lembretes criados a partir de um chat ativo preservam o alvo ativo de entrega do chat para entrega de anúncio de fallback. Chaves de sessão internas podem estar em minúsculas; não as use como fonte de verdade para IDs de provider sensíveis a maiúsculas/minúsculas, como IDs de sala do Matrix.

## Comandos comuns de administração

Execução manual:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Entradas de `cron runs` incluem diagnósticos de entrega com o alvo Cron pretendido, o alvo resolvido, envios da ferramenta de mensagem, uso de fallback e estado entregue.

Redefinição de alvo de agente/sessão:

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

- `delivery.failureDestination` é compatível com trabalhos isolados.
- Trabalhos da sessão principal só podem usar `delivery.failureDestination` quando o modo principal de entrega é `webhook`.
- Se você não definir nenhum destino de falha e o trabalho já anunciar em um canal, as notificações de falha reutilizam esse mesmo alvo de anúncio.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Tarefas agendadas](/pt-BR/automation/cron-jobs)
