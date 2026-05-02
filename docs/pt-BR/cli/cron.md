---
read_when:
    - Você quer tarefas agendadas e ativações
    - Você está depurando a execução do Cron e os logs
summary: Referência da CLI para `openclaw cron` (agendar e executar trabalhos em segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-05-02T05:43:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298ac3fc868462eb301febbc1aa5296d8087cad7fdc466870487081444c5856f
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gerencie tarefas cron para o agendador do Gateway.

<Tip>
Execute `openclaw cron --help` para ver toda a superfície de comandos. Consulte [Tarefas cron](/pt-BR/automation/cron-jobs) para o guia conceitual.
</Tip>

## Sessões

`--session` aceita `main`, `isolated`, `current` ou `session:<id>`.

<AccordionGroup>
  <Accordion title="Chaves de sessão">
    - `main` vincula à sessão principal do agente.
    - `isolated` cria uma transcrição e um id de sessão novos para cada execução.
    - `current` vincula à sessão ativa no momento da criação.
    - `session:<id>` fixa uma chave de sessão persistente explícita.

  </Accordion>
  <Accordion title="Semântica de sessão isolada">
    Execuções isoladas redefinem o contexto de conversa ambiente. Roteamento de canal e grupo, política de envio/fila, elevação, origem e vinculação de runtime ACP são redefinidos para a nova execução. Preferências seguras e substituições explícitas de modelo ou autenticação selecionadas pelo usuário podem ser mantidas entre execuções.
  </Accordion>
</AccordionGroup>

## Entrega

`openclaw cron list` e `openclaw cron show <job-id>` mostram uma prévia da rota de entrega resolvida. Para `channel: "last"`, a prévia mostra se a rota foi resolvida a partir da sessão principal ou atual, ou se falhará em modo fechado.

Destinos prefixados por provedor podem desambiguar canais de anúncio não resolvidos. Por exemplo, `to: "telegram:123"` seleciona Telegram quando `delivery.channel` é omitido ou `last`. Somente prefixos anunciados pelo plugin carregado são seletores de provedor. Se `delivery.channel` for explícito, o prefixo deve corresponder a esse canal; `channel: "whatsapp"` com `to: "telegram:123"` é rejeitado. Prefixos de serviço como `imessage:` e `sms:` continuam sendo sintaxe de destino pertencente ao canal.

<Note>
Tarefas `cron add` isoladas usam entrega `--announce` por padrão. Use `--no-deliver` para manter a saída interna. `--deliver` permanece como um alias obsoleto para `--announce`.
</Note>

### Propriedade da entrega

A entrega de chat de cron isolado é compartilhada entre o agente e o executor:

- O agente pode enviar diretamente usando a ferramenta `message` quando uma rota de chat está disponível.
- `announce` faz a entrega final de fallback apenas quando o agente não enviou diretamente para o destino resolvido.
- `webhook` publica o payload concluído em uma URL.
- `none` desabilita a entrega de fallback do executor.

`--announce` é a entrega de fallback do executor para a resposta final. `--no-deliver` desabilita esse fallback, mas não remove a ferramenta `message` do agente quando uma rota de chat está disponível.

Lembretes criados a partir de um chat ativo preservam o destino de entrega do chat ao vivo para entrega de anúncio de fallback. Chaves de sessão internas podem estar em minúsculas; não as use como fonte de verdade para IDs de provedor sensíveis a maiúsculas e minúsculas, como IDs de sala do Matrix.

### Entrega de falhas

Notificações de falha são resolvidas nesta ordem:

1. `delivery.failureDestination` na tarefa.
2. `cron.failureDestination` global.
3. O destino principal de anúncio da tarefa (quando nenhum destino de falha explícito está definido).

<Note>
Tarefas de sessão principal só podem usar `delivery.failureDestination` quando o modo de entrega principal é `webhook`. Tarefas isoladas o aceitam em todos os modos.
</Note>

Observação: execuções de cron isolado tratam falhas de agente no nível da execução como erros de tarefa mesmo quando
nenhum payload de resposta é produzido, portanto falhas de modelo/provedor ainda incrementam contadores
de erro e acionam notificações de falha.

## Agendamento

### Tarefas de execução única

`--at <datetime>` agenda uma execução única. Datas e horas sem deslocamento são tratadas como UTC, a menos que você também passe `--tz <iana>`, que interpreta o horário de relógio na timezone informada.

<Note>
Tarefas de execução única são excluídas após sucesso por padrão. Use `--keep-after-run` para preservá-las.
</Note>

### Tarefas recorrentes

Tarefas recorrentes usam backoff exponencial de nova tentativa após erros consecutivos: 30s, 1m, 5m, 15m, 60m. A agenda volta ao normal após a próxima execução bem-sucedida.

Execuções ignoradas são rastreadas separadamente de erros de execução. Elas não afetam o backoff de nova tentativa, mas `openclaw cron edit <job-id> --failure-alert-include-skipped` pode fazer alertas de falha incluírem notificações repetidas de execução ignorada.

Para tarefas isoladas que têm como destino um provedor de modelo configurado localmente, o cron executa um preflight leve do provedor antes de iniciar o turno do agente. Provedores `api: "ollama"` em loopback, rede privada e `.local` são sondados em `/api/tags`; provedores locais compatíveis com OpenAI, como vLLM, SGLang e LM Studio, são sondados em `/models`. Se o endpoint estiver inacessível, a execução é registrada como `skipped` e tentada novamente em uma agenda posterior; endpoints inativos correspondentes são armazenados em cache por 5 minutos para evitar que muitas tarefas sobrecarreguem o mesmo servidor local.

Observação: definições de tarefas cron ficam em `jobs.json`, enquanto o estado de runtime pendente fica em `jobs-state.json`. Se `jobs.json` for editado externamente, o Gateway recarrega agendas alteradas e limpa slots pendentes obsoletos; regravações apenas de formatação não limpam o slot pendente.

### Execuções manuais

`openclaw cron run` retorna assim que a execução manual é enfileirada. Respostas bem-sucedidas incluem `{ ok: true, enqueued: true, runId }`. Use `openclaw cron runs --id <job-id>` para acompanhar o resultado eventual.

<Note>
`openclaw cron run <job-id>` força a execução por padrão. Use `--due` para manter o comportamento antigo de "executar somente se estiver vencida".
</Note>

## Modelos

`cron add|edit --model <ref>` seleciona um modelo permitido para a tarefa.

<Warning>
Se o modelo não for permitido ou não puder ser resolvido, o cron falha a execução com um erro de validação explícito, em vez de recorrer ao agente da tarefa ou à seleção de modelo padrão.
</Warning>

Cron `--model` é um **primário da tarefa**, não uma substituição de `/model` de sessão de chat. Isso significa:

- Fallbacks de modelo configurados ainda se aplicam quando o modelo da tarefa selecionado falha.
- `fallbacks` no payload por tarefa substitui a lista de fallbacks configurada quando presente.
- Uma lista de fallbacks por tarefa vazia (`fallbacks: []` no payload/API da tarefa) torna a execução cron estrita.
- Quando uma tarefa tem `--model`, mas nenhuma lista de fallbacks está configurada, o OpenClaw passa uma substituição de fallback vazia explícita para que o primário do agente não seja anexado como destino oculto de nova tentativa.

### Precedência de modelo de cron isolado

O cron isolado resolve o modelo ativo nesta ordem:

1. Substituição de hook do Gmail.
2. `--model` por tarefa.
3. Substituição de modelo de sessão cron armazenada (quando o usuário selecionou uma).
4. Seleção de modelo do agente ou padrão.

### Modo rápido

O modo rápido de cron isolado segue a seleção de modelo ao vivo resolvida. A configuração de modelo `params.fastMode` se aplica por padrão, mas uma substituição `fastMode` de sessão armazenada ainda prevalece sobre a configuração.

### Novas tentativas de troca de modelo ao vivo

Se uma execução isolada lançar `LiveSessionModelSwitchError`, o cron persiste o provedor e o modelo trocados (e a substituição de perfil de autenticação trocada quando presente) para a execução ativa antes de tentar novamente. O loop externo de novas tentativas é limitado a duas tentativas de troca após a tentativa inicial e então aborta, em vez de ficar em loop para sempre.

## Saída de execução e negações

### Supressão de confirmação obsoleta

Turnos de cron isolado suprimem respostas obsoletas que contêm apenas confirmação. Se o primeiro resultado for apenas uma atualização de status intermediária e nenhuma execução de subagente descendente for responsável pela resposta eventual, o cron solicita novamente uma vez o resultado real antes da entrega.

### Supressão de token silencioso

Se uma execução de cron isolado retornar apenas o token silencioso (`NO_REPLY` ou `no_reply`), o cron suprime tanto a entrega direta de saída quanto o caminho de resumo enfileirado de fallback, para que nada seja publicado de volta no chat.

### Negações estruturadas

Execuções de cron isolado preferem metadados estruturados de negação de execução da execução incorporada e então recorrem a marcadores de negação conhecidos na saída final, como `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` e frases de recusa de vinculação de aprovação.

`cron list` e o histórico de execuções exibem o motivo da negação em vez de relatar um comando bloqueado como `ok`.

## Retenção

Retenção e poda são controladas na configuração:

- `cron.sessionRetention` (padrão `24h`) poda sessões de execução isolada concluídas.
- `cron.runLog.maxBytes` e `cron.runLog.keepLines` podam `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migrando tarefas antigas

<Note>
Se você tiver tarefas cron de antes do formato atual de entrega e armazenamento, execute `openclaw doctor --fix`. O Doctor normaliza campos cron legados (`jobId`, `schedule.cron`, campos de entrega de nível superior incluindo `threadId` legado, aliases de entrega `provider` de payload) e migra tarefas simples de fallback de webhook `notify: true` para entrega webhook explícita quando `cron.webhook` está configurado.
</Note>

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

Anuncie em um tópico de fórum do Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Crie uma tarefa isolada com contexto leve de bootstrap:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` se aplica apenas a tarefas de turno de agente isoladas. Para execuções cron, o modo leve mantém o contexto de bootstrap vazio em vez de injetar o conjunto completo de bootstrap do espaço de trabalho.

## Comandos administrativos comuns

Execução manual e inspeção:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Entradas de `cron runs` incluem diagnósticos de entrega com o destino cron pretendido, o destino resolvido, envios pela ferramenta de mensagem, uso de fallback e estado entregue.

Redirecionamento de agente e sessão:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` avisa quando `--agent` é omitido em tarefas de turno de agente e recorre ao agente padrão (`main`). Passe `--agent <id>` no momento da criação para fixar um agente específico.

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
