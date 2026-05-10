---
read_when:
    - Você quer tarefas agendadas e despertares
    - Você está depurando a execução do Cron e os logs
summary: Referência da CLI para `openclaw cron` (agendar e executar tarefas em segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-05-10T19:27:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1575213cfcc6cb9991e0aed48722e737d930570ce8527532188b345810982892
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gerencie trabalhos de Cron para o agendador do Gateway.

<Tip>
Execute `openclaw cron --help` para ver toda a superfície de comandos. Consulte [trabalhos de Cron](/pt-BR/automation/cron-jobs) para o guia conceitual.
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

`openclaw cron list` e `openclaw cron show <job-id>` pré-visualizam a rota de entrega resolvida. Para `channel: "last"`, a pré-visualização mostra se a rota foi resolvida a partir da sessão principal ou atual, ou se falhará de forma fechada.

Destinos prefixados por provedor podem desambiguar canais de anúncio não resolvidos. Por exemplo, `to: "telegram:123"` seleciona Telegram quando `delivery.channel` é omitido ou é `last`. Somente prefixos anunciados pelo plugin carregado são seletores de provedor. Se `delivery.channel` for explícito, o prefixo deve corresponder a esse canal; `channel: "whatsapp"` com `to: "telegram:123"` é rejeitado. Prefixos de serviço como `imessage:` e `sms:` continuam sendo sintaxe de destino pertencente ao canal.

<Note>
Trabalhos `cron add` isolados usam entrega `--announce` por padrão. Use `--no-deliver` para manter a saída interna. `--deliver` continua como um alias obsoleto de `--announce`.
</Note>

### Propriedade da entrega

A entrega de chat do Cron isolado é compartilhada entre o agente e o executor:

- O agente pode enviar diretamente usando a ferramenta `message` quando uma rota de chat está disponível.
- `announce` entrega por fallback a resposta final somente quando o agente não enviou diretamente ao destino resolvido.
- `webhook` publica a carga finalizada em uma URL.
- `none` desativa a entrega de fallback do executor.

`--announce` é a entrega de fallback do executor para a resposta final. `--no-deliver` desativa esse fallback, mas não remove a ferramenta `message` do agente quando uma rota de chat está disponível.

Lembretes criados a partir de um chat ativo preservam o destino de entrega do chat ao vivo para entrega de anúncio por fallback. Chaves internas de sessão podem estar em minúsculas; não as use como fonte da verdade para IDs de provedor sensíveis a maiúsculas e minúsculas, como IDs de salas do Matrix.

### Entrega de falhas

Notificações de falha são resolvidas nesta ordem:

1. `delivery.failureDestination` no trabalho.
2. `cron.failureDestination` global.
3. O destino de anúncio principal do trabalho (quando nenhum destino de falha explícito está definido).

<Note>
Trabalhos de sessão principal só podem usar `delivery.failureDestination` quando o modo de entrega principal é `webhook`. Trabalhos isolados o aceitam em todos os modos.
</Note>

Observação: execuções de Cron isoladas tratam falhas de agente em nível de execução como erros do trabalho mesmo quando
nenhuma carga de resposta é produzida, portanto falhas de modelo/provedor ainda incrementam contadores de erro
e acionam notificações de falha.

Se uma execução isolada atingir o tempo limite antes da primeira solicitação ao modelo, `openclaw cron show`
e `openclaw cron runs` incluem um erro específico da fase, como
`setup timed out before runner start` ou
`stalled before first model call (last phase: context-engine)`.
Para provedores baseados em CLI, o watchdog pré-modelo permanece ativo até o turno externo da
CLI começar, portanto travamentos de consulta de sessão, hook, autenticação, prompt e configuração de CLI são
relatados como falhas de Cron pré-modelo.

## Agendamento

### Trabalhos de execução única

`--at <datetime>` agenda uma execução única. Datetimes sem offset são tratados como UTC, a menos que você também passe `--tz <iana>`, que interpreta a hora do relógio de parede no fuso horário informado.

<Note>
Trabalhos de execução única são excluídos após sucesso por padrão. Use `--keep-after-run` para preservá-los.
</Note>

### Trabalhos recorrentes

Trabalhos recorrentes usam backoff exponencial de repetição após erros consecutivos: 30s, 1m, 5m, 15m, 60m. O agendamento volta ao normal após a próxima execução bem-sucedida.

Execuções ignoradas são acompanhadas separadamente de erros de execução. Elas não afetam o backoff de repetição, mas `openclaw cron edit <job-id> --failure-alert-include-skipped` pode optar por incluir notificações repetidas de execução ignorada nos alertas de falha.

Para trabalhos isolados que miram um provedor de modelo configurado localmente, o Cron executa uma verificação preliminar leve do provedor antes de iniciar o turno do agente. Provedores `api: "ollama"` de loopback, rede privada e `.local` são sondados em `/api/tags`; provedores locais compatíveis com OpenAI, como vLLM, SGLang e LM Studio, são sondados em `/models`. Se o endpoint estiver inacessível, a execução é registrada como `skipped` e tentada novamente em um agendamento posterior; endpoints inativos correspondentes são armazenados em cache por 5 minutos para evitar que muitos trabalhos sobrecarreguem o mesmo servidor local.

Observação: definições de trabalhos de Cron ficam em `jobs.json`, enquanto o estado de runtime pendente fica em `jobs-state.json`. Se `jobs.json` for editado externamente, o Gateway recarrega agendamentos alterados e limpa slots pendentes obsoletos; reescritas somente de formatação não limpam o slot pendente.

### Execuções manuais

`openclaw cron run` retorna assim que a execução manual é enfileirada. Respostas bem-sucedidas incluem `{ ok: true, enqueued: true, runId }`. Use `openclaw cron runs --id <job-id>` para acompanhar o resultado eventual.

<Note>
`openclaw cron run <job-id>` executa forçadamente por padrão. Use `--due` para manter o comportamento antigo de "executar somente se estiver vencido".
</Note>

## Modelos

`cron add|edit --model <ref>` seleciona um modelo permitido para o trabalho.

<Warning>
Se o modelo não for permitido ou não puder ser resolvido, o Cron falha a execução com um erro de validação explícito em vez de recorrer à seleção de modelo do agente do trabalho ou ao modelo padrão.
</Warning>

`--model` do Cron é um **principal do trabalho**, não uma substituição `/model` da sessão de chat. Isso significa:

- Fallbacks de modelo configurados ainda se aplicam quando o modelo do trabalho selecionado falha.
- `fallbacks` na carga por trabalho substitui a lista de fallback configurada quando presente.
- Uma lista de fallback por trabalho vazia (`fallbacks: []` na carga/API do trabalho) torna a execução de Cron estrita.
- Quando um trabalho tem `--model`, mas nenhuma lista de fallback está configurada, o OpenClaw passa uma substituição de fallback vazia explícita para que o primário do agente não seja acrescentado como um destino oculto de nova tentativa.

### Precedência de modelo no Cron isolado

O Cron isolado resolve o modelo ativo nesta ordem:

1. Substituição de hook do Gmail.
2. `--model` por trabalho.
3. Substituição de modelo armazenada da sessão de Cron (quando o usuário selecionou uma).
4. Seleção de modelo do agente ou padrão.

### Modo rápido

O modo rápido do Cron isolado segue a seleção de modelo ao vivo resolvida. A configuração de modelo `params.fastMode` se aplica por padrão, mas uma substituição `fastMode` armazenada na sessão ainda vence a configuração.

### Novas tentativas de troca de modelo ao vivo

Se uma execução isolada lançar `LiveSessionModelSwitchError`, o Cron persiste o provedor e o modelo alternados (e a substituição de perfil de autenticação alternada, quando presente) para a execução ativa antes de tentar novamente. O loop externo de repetição é limitado a duas novas tentativas de troca após a tentativa inicial, depois aborta em vez de entrar em loop indefinidamente.

## Saída da execução e recusas

### Supressão de confirmação obsoleta

Turnos de Cron isolados suprimem respostas obsoletas que apenas confirmam recebimento. Se o primeiro resultado for apenas uma atualização de status intermediária e nenhuma execução de subagente descendente for responsável pela resposta eventual, o Cron solicita novamente uma vez o resultado real antes da entrega.

### Supressão de token silencioso

Se uma execução de Cron isolada retornar apenas o token silencioso (`NO_REPLY` ou `no_reply`), o Cron suprime tanto a entrega direta de saída quanto o caminho de resumo enfileirado por fallback, então nada é publicado de volta no chat.

### Recusas estruturadas

Execuções de Cron isoladas preferem metadados estruturados de recusa de execução da execução embutida e depois recorrem a marcadores de recusa conhecidos na saída final, como `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` e frases de recusa de vinculação de aprovação.

`cron list` e o histórico de execuções expõem o motivo da recusa em vez de relatar um comando bloqueado como `ok`.

## Retenção

Retenção e poda são controladas na configuração:

- `cron.sessionRetention` (padrão `24h`) poda sessões de execução isolada concluídas.
- `cron.runLog.maxBytes` e `cron.runLog.keepLines` podam `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migrando trabalhos antigos

<Note>
Se você tiver trabalhos de Cron anteriores ao formato atual de entrega e armazenamento, execute `openclaw doctor --fix`. O Doctor normaliza campos legados de Cron (`jobId`, `schedule.cron`, campos de entrega de nível superior incluindo `threadId` legado, aliases de entrega `provider` na carga) e migra trabalhos simples de fallback de Webhook com `notify: true` para entrega explícita por Webhook quando `cron.webhook` está configurado.
</Note>

## Edições comuns

Atualize configurações de entrega sem alterar a mensagem:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Desative a entrega para um trabalho isolado:

```bash
openclaw cron edit <job-id> --no-deliver
```

Ative contexto leve de bootstrap para um trabalho isolado:

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

Crie um trabalho isolado com contexto leve de bootstrap:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` aplica-se somente a trabalhos de turno de agente isolados. Para execuções de Cron, o modo leve mantém o contexto de bootstrap vazio em vez de injetar o conjunto completo de bootstrap do workspace.

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

`openclaw cron list` mostra todos os trabalhos correspondentes por padrão. Passe `--agent <id>` para mostrar somente trabalhos cujo id de agente normalizado efetivo corresponde; trabalhos sem um id de agente armazenado contam como o agente padrão configurado.

`cron list --json` e `cron show <job-id> --json` incluem um campo `status` de nível superior em cada trabalho, computado a partir de `enabled`, `state.runningAtMs` e `state.lastRunStatus`. Valores: `disabled`, `running`, `ok`, `error`, `skipped` ou `idle`. Isso espelha a coluna de status legível por humanos para que ferramentas externas possam ler o estado do trabalho sem derivá-lo novamente.

Entradas de `cron runs` incluem diagnósticos de entrega com o destino de Cron pretendido, o destino resolvido, envios pela ferramenta de mensagem, uso de fallback e estado entregue.

Redirecionamento de agente e sessão:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` avisa quando `--agent` é omitido em trabalhos de turno de agente e recorre ao agente padrão (`main`). Passe `--agent <id>` no momento da criação para fixar um agente específico.

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
