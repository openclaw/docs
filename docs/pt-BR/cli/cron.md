---
read_when:
    - Você quer tarefas agendadas e despertares
    - Você está depurando a execução do Cron e os logs
summary: Referência da CLI para `openclaw cron` (agendar e executar trabalhos em segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-04-30T09:40:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03d79e0e2c71f673c900b84eb2beeab705662c1d016e1d0567323c8da73060bb
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gerencie tarefas Cron para o agendador do Gateway.

<Tip>
Execute `openclaw cron --help` para ver toda a superfície de comandos. Consulte [Tarefas Cron](/pt-BR/automation/cron-jobs) para o guia conceitual.
</Tip>

## Sessões

`--session` aceita `main`, `isolated`, `current` ou `session:<id>`.

<AccordionGroup>
  <Accordion title="Chaves de sessão">
    - `main` vincula à sessão principal do agente.
    - `isolated` cria uma transcrição nova e um id de sessão para cada execução.
    - `current` vincula à sessão ativa no momento da criação.
    - `session:<id>` fixa uma chave de sessão persistente explícita.

  </Accordion>
  <Accordion title="Semântica de sessão isolada">
    Execuções isoladas redefinem o contexto de conversa ambiente. Roteamento de canal e grupo, política de envio/fila, elevação, origem e vinculação de runtime ACP são redefinidos para a nova execução. Preferências seguras e substituições explícitas de modelo ou autenticação selecionadas pelo usuário podem ser mantidas entre execuções.
  </Accordion>
</AccordionGroup>

## Entrega

`openclaw cron list` e `openclaw cron show <job-id>` pré-visualizam a rota de entrega resolvida. Para `channel: "last"`, a prévia mostra se a rota foi resolvida a partir da sessão principal ou atual, ou se falhará de forma fechada.

<Note>
Tarefas `cron add` isoladas usam entrega `--announce` por padrão. Use `--no-deliver` para manter a saída interna. `--deliver` permanece como um alias obsoleto para `--announce`.
</Note>

### Propriedade da entrega

A entrega de chat Cron isolada é compartilhada entre o agente e o executor:

- O agente pode enviar diretamente usando a ferramenta `message` quando uma rota de chat está disponível.
- `announce` entrega como fallback a resposta final somente quando o agente não enviou diretamente ao destino resolvido.
- `webhook` publica a carga finalizada em uma URL.
- `none` desativa a entrega de fallback do executor.

`--announce` é a entrega de fallback do executor para a resposta final. `--no-deliver` desativa esse fallback, mas não remove a ferramenta `message` do agente quando uma rota de chat está disponível.

Lembretes criados a partir de um chat ativo preservam o destino de entrega do chat ao vivo para entrega de anúncio por fallback. Chaves de sessão internas podem estar em minúsculas; não as use como fonte da verdade para IDs de provedores sensíveis a maiúsculas e minúsculas, como IDs de salas Matrix.

### Entrega de falhas

Notificações de falha são resolvidas nesta ordem:

1. `delivery.failureDestination` na tarefa.
2. `cron.failureDestination` global.
3. O destino de anúncio primário da tarefa (quando nenhum destino de falha explícito é definido).

<Note>
Tarefas da sessão principal só podem usar `delivery.failureDestination` quando o modo de entrega primário é `webhook`. Tarefas isoladas o aceitam em todos os modos.
</Note>

Observação: execuções Cron isoladas tratam falhas de agente no nível da execução como erros de tarefa mesmo quando
nenhuma carga de resposta é produzida, então falhas de modelo/provedor ainda incrementam contadores
de erro e acionam notificações de falha.

## Agendamento

### Tarefas de execução única

`--at <datetime>` agenda uma execução única. Datetimes sem deslocamento são tratados como UTC, a menos que você também passe `--tz <iana>`, que interpreta o horário de relógio na timezone fornecida.

<Note>
Tarefas de execução única são excluídas após o sucesso por padrão. Use `--keep-after-run` para preservá-las.
</Note>

### Tarefas recorrentes

Tarefas recorrentes usam backoff de nova tentativa exponencial após erros consecutivos: 30s, 1m, 5m, 15m, 60m. O agendamento volta ao normal após a próxima execução bem-sucedida.

Execuções ignoradas são rastreadas separadamente de erros de execução. Elas não afetam o backoff de nova tentativa, mas `openclaw cron edit <job-id> --failure-alert-include-skipped` pode optar por incluir notificações repetidas de execuções ignoradas nos alertas de falha.

Para tarefas isoladas que miram um provedor de modelo local configurado, o Cron executa uma pré-verificação leve do provedor antes de iniciar o turno do agente. Provedores `api: "ollama"` de loopback, rede privada e `.local` são sondados em `/api/tags`; provedores locais compatíveis com OpenAI, como vLLM, SGLang e LM Studio, são sondados em `/models`. Se o endpoint estiver inacessível, a execução é registrada como `skipped` e tentada novamente em um agendamento posterior; endpoints inativos correspondentes são armazenados em cache por 5 minutos para evitar que muitas tarefas sobrecarreguem o mesmo servidor local.

Observação: definições de tarefas Cron ficam em `jobs.json`, enquanto o estado de runtime pendente fica em `jobs-state.json`. Se `jobs.json` for editado externamente, o Gateway recarrega agendamentos alterados e limpa slots pendentes obsoletos; reescritas apenas de formatação não limpam o slot pendente.

### Execuções manuais

`openclaw cron run` retorna assim que a execução manual é enfileirada. Respostas bem-sucedidas incluem `{ ok: true, enqueued: true, runId }`. Use `openclaw cron runs --id <job-id>` para acompanhar o resultado eventual.

<Note>
`openclaw cron run <job-id>` força a execução por padrão. Use `--due` para manter o comportamento antigo de "executar somente se estiver vencida".
</Note>

## Modelos

`cron add|edit --model <ref>` seleciona um modelo permitido para a tarefa.

<Warning>
Se o modelo não for permitido ou não puder ser resolvido, o Cron falhará a execução com um erro de validação explícito em vez de usar como fallback o agente da tarefa ou a seleção de modelo padrão.
</Warning>

Cron `--model` é um **primário da tarefa**, não uma substituição de `/model` da sessão de chat. Isso significa:

- Fallbacks de modelo configurados ainda se aplicam quando o modelo selecionado da tarefa falha.
- `fallbacks` por carga de tarefa substitui a lista de fallback configurada quando presente.
- Uma lista de fallback vazia por tarefa (`fallbacks: []` na carga/API da tarefa) torna a execução Cron estrita.
- Quando uma tarefa tem `--model`, mas nenhuma lista de fallback está configurada, o OpenClaw passa uma substituição de fallback vazia explícita para que o primário do agente não seja anexado como um destino oculto de nova tentativa.

### Precedência de modelo do Cron isolado

O Cron isolado resolve o modelo ativo nesta ordem:

1. Substituição de gancho do Gmail.
2. `--model` por tarefa.
3. Substituição de modelo de sessão Cron armazenada (quando o usuário selecionou uma).
4. Seleção de agente ou modelo padrão.

### Modo rápido

O modo rápido do Cron isolado segue a seleção de modelo ao vivo resolvida. A configuração de modelo `params.fastMode` se aplica por padrão, mas uma substituição de sessão `fastMode` armazenada ainda vence a configuração.

### Novas tentativas de troca de modelo ao vivo

Se uma execução isolada lançar `LiveSessionModelSwitchError`, o Cron persiste o provedor e o modelo trocados (e a substituição de perfil de autenticação trocada quando presente) para a execução ativa antes de tentar novamente. O loop externo de novas tentativas é limitado a duas novas tentativas de troca após a tentativa inicial, então aborta em vez de entrar em loop para sempre.

## Saída da execução e recusas

### Supressão de confirmação obsoleta

Turnos Cron isolados suprimem respostas obsoletas que são apenas confirmação. Se o primeiro resultado for apenas uma atualização de status intermediária e nenhuma execução de subagente descendente for responsável pela resposta eventual, o Cron solicita novamente uma vez o resultado real antes da entrega.

### Supressão de token silencioso

Se uma execução Cron isolada retornar somente o token silencioso (`NO_REPLY` ou `no_reply`), o Cron suprime tanto a entrega direta de saída quanto o caminho de resumo enfileirado de fallback, então nada é publicado de volta no chat.

### Recusas estruturadas

Execuções Cron isoladas preferem metadados estruturados de recusa de execução da execução embutida e, em seguida, usam como fallback marcadores de recusa conhecidos na saída final, como `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` e frases de recusa de vinculação de aprovação.

`cron list` e o histórico de execuções exibem o motivo da recusa em vez de relatar um comando bloqueado como `ok`.

## Retenção

Retenção e poda são controladas na configuração:

- `cron.sessionRetention` (padrão `24h`) poda sessões concluídas de execução isolada.
- `cron.runLog.maxBytes` e `cron.runLog.keepLines` podam `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migração de tarefas antigas

<Note>
Se você tem tarefas Cron de antes do formato atual de entrega e armazenamento, execute `openclaw doctor --fix`. O Doctor normaliza campos Cron legados (`jobId`, `schedule.cron`, campos de entrega de nível superior incluindo `threadId` legado, aliases de entrega `provider` da carga) e migra tarefas simples de fallback de webhook `notify: true` para entrega de webhook explícita quando `cron.webhook` está configurado.
</Note>

## Edições comuns

Atualize configurações de entrega sem alterar a mensagem:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Desative a entrega para uma tarefa isolada:

```bash
openclaw cron edit <job-id> --no-deliver
```

Ative contexto leve de inicialização para uma tarefa isolada:

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

Crie uma tarefa isolada com contexto leve de inicialização:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` aplica-se somente a tarefas de turno de agente isoladas. Para execuções Cron, o modo leve mantém o contexto de inicialização vazio em vez de injetar o conjunto completo de inicialização do workspace.

## Comandos comuns de administração

Execução manual e inspeção:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Entradas de `cron runs` incluem diagnósticos de entrega com o destino Cron pretendido, o destino resolvido, envios pela ferramenta de mensagem, uso de fallback e estado entregue.

Redirecionamento de agente e sessão:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` avisa quando `--agent` é omitido em tarefas de turno de agente e usa como fallback o agente padrão (`main`). Passe `--agent <id>` no momento da criação para fixar um agente específico.

Ajustes de entrega:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Tarefas agendadas](/pt-BR/automation/cron-jobs)
