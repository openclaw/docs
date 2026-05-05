---
read_when:
    - Você quer tarefas agendadas e ativações
    - Você está depurando a execução do Cron e os registros
summary: Referência da CLI para `openclaw cron` (agendar e executar tarefas em segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-05-05T06:15:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 804efac75b8653b03cec197247be847498e084b50b00fb7bd3fbd94067ef25d4
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gerencie jobs de Cron para o agendador do Gateway.

<Tip>
Execute `openclaw cron --help` para ver toda a superfície de comandos. Consulte [Jobs de Cron](/pt-BR/automation/cron-jobs) para o guia conceitual.
</Tip>

## Sessões

`--session` aceita `main`, `isolated`, `current` ou `session:<id>`.

<AccordionGroup>
  <Accordion title="Chaves de sessão">
    - `main` vincula à sessão principal do agente.
    - `isolated` cria uma transcrição e um ID de sessão novos para cada execução.
    - `current` vincula à sessão ativa no momento da criação.
    - `session:<id>` fixa uma chave de sessão persistente explícita.

  </Accordion>
  <Accordion title="Semântica de sessão isolada">
    Execuções isoladas redefinem o contexto de conversa ambiente. Roteamento de canal e grupo, política de envio/fila, elevação, origem e vinculação de runtime ACP são redefinidos para a nova execução. Preferências seguras e substituições explícitas de modelo ou autenticação selecionadas pelo usuário podem ser preservadas entre execuções.
  </Accordion>
</AccordionGroup>

## Entrega

`openclaw cron list` e `openclaw cron show <job-id>` mostram uma prévia da rota de entrega resolvida. Para `channel: "last"`, a prévia mostra se a rota foi resolvida a partir da sessão principal ou atual, ou se falhará fechada.

Destinos com prefixo de provedor podem desambiguar canais de anúncio não resolvidos. Por exemplo, `to: "telegram:123"` seleciona Telegram quando `delivery.channel` é omitido ou é `last`. Somente prefixos anunciados pelo plugin carregado são seletores de provedor. Se `delivery.channel` for explícito, o prefixo deve corresponder a esse canal; `channel: "whatsapp"` com `to: "telegram:123"` é rejeitado. Prefixos de serviço como `imessage:` e `sms:` permanecem como sintaxe de destino pertencente ao canal.

<Note>
Jobs isolados de `cron add` usam entrega `--announce` por padrão. Use `--no-deliver` para manter a saída interna. `--deliver` permanece como um alias obsoleto de `--announce`.
</Note>

### Propriedade da entrega

A entrega de chat de Cron isolado é compartilhada entre o agente e o executor:

- O agente pode enviar diretamente usando a ferramenta `message` quando uma rota de chat está disponível.
- `announce` entrega o fallback da resposta final somente quando o agente não enviou diretamente ao destino resolvido.
- `webhook` publica o payload concluído em uma URL.
- `none` desativa a entrega de fallback do executor.

`--announce` é a entrega de fallback do executor para a resposta final. `--no-deliver` desativa esse fallback, mas não remove a ferramenta `message` do agente quando uma rota de chat está disponível.

Lembretes criados a partir de um chat ativo preservam o destino de entrega do chat ao vivo para entrega de anúncio de fallback. Chaves de sessão internas podem estar em minúsculas; não as use como fonte da verdade para IDs de provedor sensíveis a maiúsculas e minúsculas, como IDs de salas do Matrix.

### Entrega de falha

Notificações de falha são resolvidas nesta ordem:

1. `delivery.failureDestination` no job.
2. `cron.failureDestination` global.
3. O destino de anúncio primário do job (quando nenhum destino de falha explícito está definido).

<Note>
Jobs de sessão principal só podem usar `delivery.failureDestination` quando o modo de entrega primário é `webhook`. Jobs isolados o aceitam em todos os modos.
</Note>

Observação: execuções isoladas de Cron tratam falhas de agente no nível da execução como erros de job mesmo quando nenhum payload de resposta é produzido, então falhas de modelo/provedor ainda incrementam contadores de erro e acionam notificações de falha.

## Agendamento

### Jobs únicos

`--at <datetime>` agenda uma execução única. Datas e horas sem offset são tratadas como UTC, a menos que você também passe `--tz <iana>`, que interpreta o horário de relógio na timezone fornecida.

<Note>
Jobs únicos são excluídos após o sucesso por padrão. Use `--keep-after-run` para preservá-los.
</Note>

### Jobs recorrentes

Jobs recorrentes usam backoff exponencial de nova tentativa após erros consecutivos: 30s, 1m, 5m, 15m, 60m. O agendamento volta ao normal após a próxima execução bem-sucedida.

Execuções ignoradas são rastreadas separadamente dos erros de execução. Elas não afetam o backoff de nova tentativa, mas `openclaw cron edit <job-id> --failure-alert-include-skipped` pode incluir notificações repetidas de execuções ignoradas nos alertas de falha.

Para jobs isolados que têm como destino um provedor de modelo local configurado, o Cron executa uma pré-verificação leve do provedor antes de iniciar o turno do agente. Provedores `api: "ollama"` em loopback, rede privada e `.local` são verificados em `/api/tags`; provedores locais compatíveis com OpenAI, como vLLM, SGLang e LM Studio, são verificados em `/models`. Se o endpoint estiver inacessível, a execução é registrada como `skipped` e tentada novamente em um agendamento posterior; endpoints inativos correspondentes são armazenados em cache por 5 minutos para evitar que muitos jobs sobrecarreguem o mesmo servidor local.

Observação: definições de jobs de Cron ficam em `jobs.json`, enquanto o estado de runtime pendente fica em `jobs-state.json`. Se `jobs.json` for editado externamente, o Gateway recarrega agendamentos alterados e limpa slots pendentes obsoletos; regravações apenas de formatação não limpam o slot pendente.

### Execuções manuais

`openclaw cron run` retorna assim que a execução manual é enfileirada. Respostas bem-sucedidas incluem `{ ok: true, enqueued: true, runId }`. Use `openclaw cron runs --id <job-id>` para acompanhar o resultado eventual.

<Note>
`openclaw cron run <job-id>` força a execução por padrão. Use `--due` para manter o comportamento antigo de "executar somente se estiver vencido".
</Note>

## Modelos

`cron add|edit --model <ref>` seleciona um modelo permitido para o job.

<Warning>
Se o modelo não for permitido ou não puder ser resolvido, o Cron falha a execução com um erro de validação explícito em vez de recorrer ao agente do job ou à seleção de modelo padrão.
</Warning>

`--model` do Cron é um **primário do job**, não uma substituição `/model` de sessão de chat. Isso significa:

- Fallbacks de modelo configurados ainda se aplicam quando o modelo selecionado do job falha.
- `fallbacks` no payload por job substitui a lista de fallback configurada quando presente.
- Uma lista de fallback vazia por job (`fallbacks: []` no payload/API do job) torna a execução do Cron estrita.
- Quando um job tem `--model`, mas nenhuma lista de fallback está configurada, o OpenClaw passa uma substituição explícita de fallback vazia para que o primário do agente não seja anexado como um destino oculto de nova tentativa.

### Precedência de modelo do Cron isolado

O Cron isolado resolve o modelo ativo nesta ordem:

1. Substituição do hook do Gmail.
2. `--model` por job.
3. Substituição de modelo armazenada da sessão de Cron (quando o usuário selecionou uma).
4. Seleção de modelo do agente ou padrão.

### Modo rápido

O modo rápido do Cron isolado segue a seleção de modelo ao vivo resolvida. A configuração de modelo `params.fastMode` se aplica por padrão, mas uma substituição `fastMode` de sessão armazenada ainda tem precedência sobre a configuração.

### Novas tentativas de troca de modelo ao vivo

Se uma execução isolada lançar `LiveSessionModelSwitchError`, o Cron persiste o provedor e o modelo trocados (e a substituição de perfil de autenticação trocada, quando presente) para a execução ativa antes de tentar novamente. O loop externo de nova tentativa é limitado a duas novas tentativas de troca após a tentativa inicial e então aborta em vez de repetir para sempre.

## Saída da execução e recusas

### Supressão de confirmação obsoleta

Turnos de Cron isolado suprimem respostas obsoletas que são apenas confirmações. Se o primeiro resultado for apenas uma atualização de status provisória e nenhuma execução de subagente descendente for responsável pela resposta eventual, o Cron solicita novamente uma vez pelo resultado real antes da entrega.

### Supressão de token silencioso

Se uma execução isolada de Cron retornar apenas o token silencioso (`NO_REPLY` ou `no_reply`), o Cron suprime tanto a entrega direta de saída quanto o caminho de resumo enfileirado de fallback, então nada é publicado de volta no chat.

### Recusas estruturadas

Execuções isoladas de Cron preferem metadados estruturados de recusa de execução da execução incorporada e então recorrem a marcadores de recusa conhecidos na saída final, como `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` e frases de recusa de vinculação de aprovação.

`cron list` e o histórico de execuções expõem o motivo da recusa em vez de relatar um comando bloqueado como `ok`.

## Retenção

Retenção e limpeza são controladas na configuração:

- `cron.sessionRetention` (padrão `24h`) limpa sessões concluídas de execuções isoladas.
- `cron.runLog.maxBytes` e `cron.runLog.keepLines` limpam `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migrando jobs antigos

<Note>
Se você tem jobs de Cron de antes do formato atual de entrega e armazenamento, execute `openclaw doctor --fix`. O Doctor normaliza campos legados de Cron (`jobId`, `schedule.cron`, campos de entrega de nível superior incluindo `threadId` legado, aliases de entrega `provider` no payload) e migra jobs simples de fallback de webhook `notify: true` para entrega explícita por webhook quando `cron.webhook` está configurado.
</Note>

## Edições comuns

Atualize configurações de entrega sem alterar a mensagem:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Desative a entrega para um job isolado:

```bash
openclaw cron edit <job-id> --no-deliver
```

Ative contexto leve de bootstrap para um job isolado:

```bash
openclaw cron edit <job-id> --light-context
```

Anuncie para um canal específico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Anuncie para um tópico de fórum do Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Crie um job isolado com contexto leve de bootstrap:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` se aplica somente a jobs isolados de turno de agente. Para execuções de Cron, o modo leve mantém o contexto de bootstrap vazio em vez de injetar o conjunto completo de bootstrap do workspace.

## Comandos administrativos comuns

Execução manual e inspeção:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` mostra todos os jobs correspondentes por padrão. Passe `--agent <id>` para mostrar somente jobs cujo ID de agente normalizado efetivo corresponda; jobs sem um ID de agente armazenado contam como o agente padrão configurado.

Entradas de `cron runs` incluem diagnósticos de entrega com o destino pretendido do Cron, o destino resolvido, envios pela ferramenta de mensagem, uso de fallback e estado entregue.

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
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Tarefas agendadas](/pt-BR/automation/cron-jobs)
