---
read_when:
    - Você quer tarefas agendadas e reativações
    - Você está depurando a execução do Cron e os registros
summary: Referência da CLI para `openclaw cron` (agende e execute tarefas em segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-05-07T01:50:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b6c894cc4f2a7d86b67b2b5bd7c6338dc442af09befed83117567b3a254fe9
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gerencie tarefas Cron para o agendador do Gateway.

<Tip>
Execute `openclaw cron --help` para ver toda a superfície de comandos. Consulte [tarefas Cron](/pt-BR/automation/cron-jobs) para o guia conceitual.
</Tip>

## Sessões

`--session` aceita `main`, `isolated`, `current` ou `session:<id>`.

<AccordionGroup>
  <Accordion title="Chaves de sessão">
    - `main` vincula à sessão principal do agente.
    - `isolated` cria uma transcrição nova e um id de sessão para cada execução.
    - `current` vincula à sessão ativa no momento da criação.
    - `session:<id>` fixa uma chave explícita de sessão persistente.

  </Accordion>
  <Accordion title="Semântica de sessão isolada">
    Execuções isoladas redefinem o contexto de conversa ambiente. Roteamento de canal e grupo, política de envio/fila, elevação, origem e vínculo de runtime ACP são redefinidos para a nova execução. Preferências seguras e substituições explícitas de modelo ou autenticação selecionadas pelo usuário podem ser preservadas entre execuções.
  </Accordion>
</AccordionGroup>

## Entrega

`openclaw cron list` e `openclaw cron show <job-id>` pré-visualizam a rota de entrega resolvida. Para `channel: "last"`, a pré-visualização mostra se a rota foi resolvida a partir da sessão principal ou atual, ou se falhará fechada.

Destinos prefixados por provedor podem desambiguar canais de anúncio não resolvidos. Por exemplo, `to: "telegram:123"` seleciona Telegram quando `delivery.channel` é omitido ou é `last`. Somente prefixos anunciados pelo plugin carregado são seletores de provedor. Se `delivery.channel` for explícito, o prefixo deve corresponder a esse canal; `channel: "whatsapp"` com `to: "telegram:123"` é rejeitado. Prefixos de serviço como `imessage:` e `sms:` continuam sendo sintaxe de destino pertencente ao canal.

<Note>
Tarefas `cron add` isoladas usam entrega `--announce` por padrão. Use `--no-deliver` para manter a saída interna. `--deliver` permanece como um alias obsoleto para `--announce`.
</Note>

### Propriedade da entrega

A entrega de chat por Cron isolado é compartilhada entre o agente e o executor:

- O agente pode enviar diretamente usando a ferramenta `message` quando uma rota de chat está disponível.
- `announce` faz a entrega alternativa da resposta final somente quando o agente não enviou diretamente ao destino resolvido.
- `webhook` publica a carga útil finalizada em uma URL.
- `none` desativa a entrega alternativa do executor.

`--announce` é a entrega alternativa do executor para a resposta final. `--no-deliver` desativa essa alternativa, mas não remove a ferramenta `message` do agente quando uma rota de chat está disponível.

Lembretes criados a partir de um chat ativo preservam o destino de entrega do chat ao vivo para entrega alternativa de anúncio. Chaves internas de sessão podem estar em minúsculas; não as use como fonte da verdade para IDs de provedor sensíveis a maiúsculas e minúsculas, como IDs de salas Matrix.

### Entrega de falhas

Notificações de falha são resolvidas nesta ordem:

1. `delivery.failureDestination` na tarefa.
2. `cron.failureDestination` global.
3. O destino principal de anúncio da tarefa (quando nenhum destino explícito de falha está definido).

<Note>
Tarefas de sessão principal só podem usar `delivery.failureDestination` quando o modo de entrega principal é `webhook`. Tarefas isoladas o aceitam em todos os modos.
</Note>

Observação: execuções Cron isoladas tratam falhas de agente no nível da execução como erros da tarefa mesmo quando nenhuma carga útil de resposta é produzida; portanto, falhas de modelo/provedor ainda incrementam contadores de erro e disparam notificações de falha.

## Agendamento

### Tarefas de execução única

`--at <datetime>` agenda uma execução única. Datetimes sem deslocamento são tratados como UTC, a menos que você também passe `--tz <iana>`, que interpreta o horário de relógio na timezone informada.

<Note>
Tarefas de execução única são excluídas após sucesso por padrão. Use `--keep-after-run` para preservá-las.
</Note>

### Tarefas recorrentes

Tarefas recorrentes usam backoff exponencial de nova tentativa após erros consecutivos: 30s, 1m, 5m, 15m, 60m. O agendamento volta ao normal após a próxima execução bem-sucedida.

Execuções ignoradas são rastreadas separadamente de erros de execução. Elas não afetam o backoff de nova tentativa, mas `openclaw cron edit <job-id> --failure-alert-include-skipped` pode incluir notificações repetidas de execuções ignoradas nos alertas de falha.

Para tarefas isoladas que têm como alvo um provedor de modelo local configurado, Cron executa uma pré-verificação leve do provedor antes de iniciar o turno do agente. Provedores Loopback, de rede privada e `.local` com `api: "ollama"` são sondados em `/api/tags`; provedores locais compatíveis com OpenAI, como vLLM, SGLang e LM Studio, são sondados em `/models`. Se o endpoint estiver inacessível, a execução é registrada como `skipped` e tentada novamente em um agendamento posterior; endpoints inativos correspondentes são armazenados em cache por 5 minutos para evitar que muitas tarefas pressionem o mesmo servidor local.

Observação: definições de tarefas Cron ficam em `jobs.json`, enquanto o estado de runtime pendente fica em `jobs-state.json`. Se `jobs.json` for editado externamente, o Gateway recarrega agendamentos alterados e limpa slots pendentes obsoletos; regravações apenas de formatação não limpam o slot pendente.

### Execuções manuais

`openclaw cron run` retorna assim que a execução manual é enfileirada. Respostas bem-sucedidas incluem `{ ok: true, enqueued: true, runId }`. Use `openclaw cron runs --id <job-id>` para acompanhar o resultado eventual.

<Note>
`openclaw cron run <job-id>` força a execução por padrão. Use `--due` para manter o comportamento antigo de "executar somente se estiver vencido".
</Note>

## Modelos

`cron add|edit --model <ref>` seleciona um modelo permitido para a tarefa.

<Warning>
Se o modelo não for permitido ou não puder ser resolvido, Cron falha a execução com um erro explícito de validação em vez de recorrer ao agente da tarefa ou à seleção de modelo padrão.
</Warning>

Cron `--model` é um **principal da tarefa**, não uma substituição de `/model` da sessão de chat. Isso significa:

- Fallbacks de modelo configurados ainda se aplicam quando o modelo selecionado da tarefa falha.
- `fallbacks` por carga útil da tarefa substitui a lista de fallback configurada quando presente.
- Uma lista vazia de fallbacks por tarefa (`fallbacks: []` na carga útil/API da tarefa) torna a execução Cron estrita.
- Quando uma tarefa tem `--model` mas nenhuma lista de fallback está configurada, o OpenClaw passa uma substituição explícita vazia de fallback para que o principal do agente não seja acrescentado como um destino oculto de nova tentativa.

### Precedência de modelo em Cron isolado

Cron isolado resolve o modelo ativo nesta ordem:

1. Substituição de hook do Gmail.
2. `--model` por tarefa.
3. Substituição de modelo armazenada da sessão Cron (quando o usuário selecionou uma).
4. Seleção de modelo do agente ou padrão.

### Modo rápido

O modo rápido de Cron isolado segue a seleção de modelo ao vivo resolvida. A configuração de modelo `params.fastMode` se aplica por padrão, mas uma substituição `fastMode` de sessão armazenada ainda prevalece sobre a configuração.

### Novas tentativas de troca de modelo ao vivo

Se uma execução isolada lançar `LiveSessionModelSwitchError`, Cron persiste o provedor e o modelo trocados (e a substituição de perfil de autenticação trocada, quando presente) para a execução ativa antes de tentar novamente. O loop externo de nova tentativa é limitado a duas novas tentativas de troca após a tentativa inicial, então aborta em vez de entrar em loop para sempre.

## Saída da execução e negações

### Supressão de confirmação obsoleta

Turnos Cron isolados suprimem respostas obsoletas que são apenas confirmações. Se o primeiro resultado for apenas uma atualização de status provisória e nenhuma execução de subagente descendente for responsável pela resposta eventual, Cron solicita novamente uma vez o resultado real antes da entrega.

### Supressão de token silencioso

Se uma execução Cron isolada retornar apenas o token silencioso (`NO_REPLY` ou `no_reply`), Cron suprime tanto a entrega direta de saída quanto o caminho alternativo de resumo enfileirado, de modo que nada é publicado de volta no chat.

### Negações estruturadas

Execuções Cron isoladas preferem metadados estruturados de negação de execução da execução incorporada e então recorrem a marcadores conhecidos de negação na saída final, como `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` e frases de recusa de vínculo de aprovação.

`cron list` e o histórico de execuções exibem o motivo da negação em vez de relatar um comando bloqueado como `ok`.

## Retenção

Retenção e poda são controladas na configuração:

- `cron.sessionRetention` (padrão `24h`) poda sessões concluídas de execuções isoladas.
- `cron.runLog.maxBytes` e `cron.runLog.keepLines` podam `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migrando tarefas antigas

<Note>
Se você tem tarefas Cron de antes do formato atual de entrega e armazenamento, execute `openclaw doctor --fix`. O Doctor normaliza campos Cron legados (`jobId`, `schedule.cron`, campos de entrega de nível superior incluindo `threadId` legado, aliases de entrega `provider` na carga útil) e migra tarefas simples de fallback de webhook com `notify: true` para entrega explícita por webhook quando `cron.webhook` está configurado.

O Doctor também remove sentinelas persistidas de Cron `payload.model`, como `"default"`, `"null"`, strings em branco e JSON `null`. O runtime de Cron ainda trata qualquer string não vazia em `payload.model` como uma substituição explícita de modelo e a valida contra `agents.defaults.models`; omita a chave de modelo quando uma tarefa deve usar a seleção de modelo do agente/padrão.
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

Ative o contexto leve de bootstrap para uma tarefa isolada:

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

`--light-context` se aplica somente a tarefas de turno de agente isoladas. Para execuções Cron, o modo leve mantém o contexto de bootstrap vazio em vez de injetar o conjunto completo de bootstrap do workspace.

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

`openclaw cron list` mostra todas as tarefas correspondentes por padrão. Passe `--agent <id>` para mostrar somente tarefas cujo id efetivo normalizado do agente corresponda; tarefas sem um id de agente armazenado contam como o agente padrão configurado.

Entradas de `cron runs` incluem diagnósticos de entrega com o destino Cron pretendido, o destino resolvido, envios da ferramenta de mensagem, uso de fallback e estado entregue.

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

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Tarefas agendadas](/pt-BR/automation/cron-jobs)
