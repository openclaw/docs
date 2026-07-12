---
read_when:
    - Você quer tarefas agendadas e ativações
    - Você está depurando a execução e os logs do Cron
summary: Referência da CLI para `openclaw cron` (agendar e executar tarefas em segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-07-11T23:48:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e16335b13f92229df0ba49c320e2714e39ab3e503e8e72f376ec2c5b0803cf7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gerencie tarefas Cron do agendador do Gateway.

<Tip>
Execute `openclaw cron --help` para ver todos os comandos disponíveis. Consulte [Tarefas Cron](/pt-BR/automation/cron-jobs) para ver o guia conceitual.
</Tip>

<Note>
Todas as alterações de Cron (`add`/`create`, `update`/`edit`, `remove`, `run`) exigem `operator.admin`. As execuções com payload de comando são realizadas diretamente no processo do Gateway, não como uma chamada à ferramenta `tools.exec` de um agente; `tools.exec.*` e as aprovações de execução ainda controlam as ferramentas de execução visíveis ao modelo.
</Note>

## Crie tarefas rapidamente

`openclaw cron create` é um alias de `openclaw cron add`. Para novas tarefas, informe primeiro o agendamento e depois o prompt:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Use `--webhook <url>` quando a tarefa precisar enviar o payload concluído por POST, em vez de entregá-lo a um destino de chat:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Use `--command` para tarefas determinísticas no estilo shell que são executadas no Cron do OpenClaw sem iniciar uma execução isolada de agente/modelo:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` armazena `argv: ["sh", "-lc", <shell>]`. Use `--command-argv '["node","scripts/report.mjs"]'` para executar um argv exato. As tarefas de comando capturam stdout/stderr, registram o histórico normal do Cron e encaminham a saída pelos mesmos modos de entrega `announce`, `webhook` ou `none` usados pelas tarefas isoladas. Um comando que imprime somente `NO_REPLY` é suprimido.

## Sessões

`--session` aceita `main`, `isolated`, `current` ou `session:<id>`.

<AccordionGroup>
  <Accordion title="Chaves de sessão">
    - `main` vincula à sessão principal do agente.
    - `isolated` cria uma transcrição e um ID de sessão novos para cada execução.
    - `current` vincula à sessão ativa no momento da criação.
    - `session:<id>` fixa uma chave de sessão persistente explícita.

  </Accordion>
  <Accordion title="Semântica da sessão isolada">
    As execuções isoladas redefinem o contexto de conversa do ambiente. O roteamento de canal e grupo, a política de envio/fila, a elevação, a origem e a vinculação ao runtime ACP são redefinidos para a nova execução. Preferências seguras e substituições de modelo ou autenticação selecionadas explicitamente pelo usuário podem ser mantidas entre execuções.
  </Accordion>
</AccordionGroup>

## Entrega

`openclaw cron list` e `openclaw cron show <job-id>` exibem uma prévia da rota de entrega resolvida. Para `channel: "last"`, a prévia mostra se a rota foi resolvida com base na sessão principal ou atual, ou se falhará de forma fechada.

Destinos com prefixo de provedor podem eliminar ambiguidades em canais de anúncio não resolvidos. Por exemplo, `to: "telegram:123"` seleciona o Telegram quando `delivery.channel` é omitido ou definido como `last`. Somente os prefixos anunciados pelo Plugin carregado são seletores de provedor. Se `delivery.channel` for explícito, o prefixo deverá corresponder ao canal; `channel: "whatsapp"` com `to: "telegram:123"` será rejeitado. Prefixos de serviço como `imessage:` e `sms:` continuam sendo uma sintaxe de destino controlada pelo canal.

<Note>
Tarefas isoladas criadas com `cron add` usam a entrega `--announce` por padrão. Use `--no-deliver` para manter a saída interna. `--deliver` permanece como um alias obsoleto de `--announce`.
</Note>

### Responsabilidade pela entrega

A entrega em chat de tarefas Cron isoladas é compartilhada entre o agente e o executor:

- O agente pode enviar diretamente usando a ferramenta `message` quando houver uma rota de chat disponível.
- O fallback de `announce` entrega a resposta final somente quando o agente não a envia diretamente ao destino resolvido.
- `webhook` envia o payload concluído para uma URL.
- `none` desativa a entrega de fallback do executor.

Use `cron add|create --webhook <url>` ou `cron edit <job-id> --webhook <url>` para configurar a entrega por Webhook. Não combine `--webhook` com opções de entrega por chat, como `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` ou `--account`.

`cron edit <job-id>` pode remover campos individuais do roteamento de entrega com `--clear-channel`, `--clear-to`, `--clear-thread-id` e `--clear-account` (cada um será rejeitado se combinado com a opção correspondente de definição). Diferentemente de `--no-deliver`, que apenas desativa a entrega de fallback do executor, essas opções removem o campo armazenado para que a tarefa volte a resolver essa parte da rota com base nos padrões.

`--announce` é a entrega de fallback da resposta final pelo executor. `--no-deliver` desativa esse fallback, mas não remove a ferramenta `message` do agente quando há uma rota de chat disponível.

Lembretes criados em um chat ativo preservam o destino de entrega do chat atual para a entrega de anúncio de fallback. As chaves internas de sessão podem estar em letras minúsculas; não as use como fonte da verdade para IDs de provedor que diferenciam maiúsculas de minúsculas, como IDs de salas do Matrix.

### Entrega de falhas

As notificações de falha são resolvidas nesta ordem:

1. `delivery.failureDestination` na tarefa.
2. O `cron.failureDestination` global.
3. O destino principal de anúncio da tarefa (quando nenhum dos anteriores é resolvido para um destino concreto).

<Note>
Tarefas da sessão principal só podem usar `delivery.failureDestination` quando o modo de entrega principal é `webhook`. Tarefas isoladas o aceitam em todos os modos.
</Note>

Execuções isoladas do Cron tratam falhas do agente no nível da execução como erros da tarefa, mesmo quando nenhum payload de resposta é produzido; assim, falhas do modelo/provedor ainda incrementam os contadores de erros e acionam notificações de falha.

Tarefas Cron de comando não iniciam um turno isolado do agente. Um código de saída zero registra `ok`; saída diferente de zero, sinal, tempo limite ou tempo limite sem saída registra `error` e pode acionar o mesmo fluxo de notificações de falha.

Se uma execução isolada atingir o tempo limite antes da primeira solicitação ao modelo, `openclaw cron show` e `openclaw cron runs` incluirão um erro específico da fase, como `setup timed out before runner start`, ou uma mensagem de interrupção que nomeia a última fase de inicialização conhecida (por exemplo, `context-engine`). Para provedores baseados em CLI, o monitor pré-modelo permanece ativo até o início do turno da CLI externa, portanto interrupções na consulta da sessão, em hooks, autenticação, prompt e configuração da CLI são relatadas como falhas pré-modelo do Cron.

## Agendamento

### Tarefas de execução única

`--at <datetime>` agenda uma execução única. Datas e horas sem deslocamento são tratadas como UTC, a menos que você também informe `--tz <iana>`, que interpreta a hora do relógio no fuso horário especificado.

<Note>
Por padrão, tarefas de execução única são excluídas após o sucesso. Use `--keep-after-run` para preservá-las.
</Note>

### Tarefas recorrentes

Tarefas recorrentes usam recuo exponencial de novas tentativas após erros consecutivos: 30s, 1m, 5m, 15m, 60m. O agendamento volta ao normal após a próxima execução bem-sucedida.

Execuções ignoradas são rastreadas separadamente dos erros de execução. Elas não afetam o recuo das novas tentativas, mas `openclaw cron edit <job-id> --failure-alert-include-skipped` permite incluir notificações repetidas de execuções ignoradas nos alertas de falha.

Para tarefas isoladas destinadas a um provedor de modelo local configurado (URL-base em local loopback, uma rede privada ou `.local`), o Cron executa uma verificação preliminar leve do provedor antes de iniciar o turno do agente: provedores com `api: "ollama"` são sondados em `/api/tags`; outros provedores locais compatíveis com OpenAI (`api: "openai-completions"`, por exemplo, vLLM, SGLang e LM Studio) são sondados em `/models`. Se o endpoint estiver inacessível, a execução será registrada como `skipped` e haverá uma nova tentativa em um agendamento posterior; o resultado da acessibilidade fica armazenado em cache por endpoint durante 5 minutos, para que várias tarefas direcionadas ao mesmo servidor local não o sobrecarreguem com sondagens repetidas.

Tarefas Cron, estado pendente do runtime e histórico de execuções ficam no banco de dados de estado SQLite compartilhado. Arquivos legados `jobs.json`, `<name>-state.json` e `runs/*.jsonl` são importados uma vez e renomeados com o sufixo `.migrated`. Após a importação, edite os agendamentos com `openclaw cron add|edit|remove` em vez de editar arquivos JSON.

### Execuções manuais

`openclaw cron run <job-id>` força a execução por padrão e retorna assim que a execução manual é enfileirada. Respostas bem-sucedidas incluem `{ ok: true, enqueued: true, runId }`. Use o `runId` retornado para consultar o resultado posteriormente:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Adicione `--wait` quando um script precisar bloquear até que essa execução específica enfileirada registre um status terminal:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Com `--wait`, a CLI ainda chama `cron.run` primeiro e depois consulta `cron.runs` periodicamente usando o `runId` retornado. O comando sai com código `0` somente quando a execução termina com o status `ok`. Ele sai com código diferente de zero quando a execução termina com `error` ou `skipped`, quando a resposta do Gateway não inclui um `runId` ou quando `--wait-timeout` expira (padrão de `10m`, com consultas a cada `2s` por padrão). `--poll-interval` deve ser maior que zero.

<Note>
Use `--due` quando quiser que o comando manual seja executado somente se a tarefa estiver atualmente no prazo de execução. Se `--due --wait` não enfileirar uma execução, o comando retornará a resposta normal de não execução em vez de iniciar consultas periódicas.
</Note>

## Modelos

`cron add|edit --model <ref>` seleciona um modelo permitido para a tarefa. `cron add|edit --fallbacks <list>` define modelos alternativos por tarefa, por exemplo, `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; informe `--fallbacks ""` para uma execução estrita sem alternativas. `cron edit <job-id> --clear-fallbacks` remove a substituição de alternativas por tarefa. `cron edit <job-id> --clear-model` remove a substituição de modelo por tarefa para que ela siga a precedência normal de seleção de modelo do Cron (uma substituição armazenada da sessão do Cron, quando presente; caso contrário, o modelo do agente ou o modelo padrão); não pode ser combinado com `--model`. `cron add|edit --thinking <level>` define uma substituição de raciocínio por tarefa; `cron edit <job-id> --clear-thinking` a remove para que a tarefa siga a precedência normal de raciocínio do Cron e não pode ser combinado com `--thinking`.

<Warning>
Se o modelo não for permitido ou não puder ser resolvido, o Cron interromperá a execução com um erro explícito de validação, em vez de recorrer à seleção do modelo do agente da tarefa ou do modelo padrão.
</Warning>

O `--model` do Cron é um **modelo principal da tarefa**, não uma substituição de `/model` da sessão de chat. Isso significa que:

- As alternativas de modelo configuradas ainda se aplicam quando o modelo selecionado para a tarefa falha.
- O payload `fallbacks` por tarefa substitui a lista de alternativas configurada quando presente.
- Uma lista vazia de alternativas por tarefa (`--fallbacks ""` ou `fallbacks: []` no payload/API da tarefa) torna a execução do Cron estrita.
- Quando uma tarefa tem `--model`, mas nenhuma lista de alternativas está configurada, o OpenClaw transmite uma substituição de alternativas explicitamente vazia para que o modelo principal do agente não seja acrescentado como destino oculto de nova tentativa.
- As verificações preliminares do provedor local percorrem as alternativas configuradas antes de marcar uma execução do Cron como `skipped`.

`openclaw doctor` relata tarefas que já têm `payload.model` definido, incluindo contagens por namespace de provedor e divergências em relação a `agents.defaults.model`. Use essa verificação quando o comportamento de autenticação, provedor ou cobrança parecer diferente entre o chat em tempo real e as tarefas agendadas.

### Precedência de modelo no Cron isolado

O Cron isolado resolve o modelo ativo nesta ordem:

1. Substituição do hook do Gmail.
2. `--model` por tarefa.
3. Substituição de modelo armazenada da sessão do Cron (quando o usuário selecionou uma).
4. Seleção do modelo do agente ou do modelo padrão.

### Modo rápido

O modo rápido do Cron isolado segue a seleção de modelo em tempo real resolvida. A configuração de modelo `params.fastMode` é aplicada por padrão, mas uma substituição `fastMode` armazenada na sessão ainda prevalece sobre a configuração. Quando o modo resolvido é `auto`, o limite usa o valor `params.fastAutoOnSeconds` do modelo selecionado, com padrão de 60 segundos.

### Novas tentativas após troca de modelo em tempo real

Se uma execução isolada lançar `LiveSessionModelSwitchError`, o Cron persistirá o provedor e o modelo selecionados após a troca (e a substituição do perfil de autenticação selecionada após a troca, quando presente) para a execução ativa antes de tentar novamente. O laço externo de novas tentativas é limitado a duas tentativas de troca após a tentativa inicial e, em seguida, é interrompido para não entrar em um laço infinito.

## Saída das execuções e recusas

### Supressão de confirmações obsoletas

Turnos isolados do Cron suprimem respostas obsoletas que contêm somente uma confirmação. Se o primeiro resultado for apenas uma atualização intermediária de status e nenhuma execução de subagente descendente for responsável pela resposta final, o Cron solicitará novamente, uma única vez, o resultado real antes da entrega.

### Supressão de token silencioso

Se uma execução isolada do cron retornar apenas o token silencioso (`NO_REPLY` ou `no_reply`), o cron suprimirá tanto a entrega direta de saída quanto o caminho alternativo de resumo enfileirado, portanto nada será publicado de volta no chat.

### Negações estruturadas

As execuções isoladas do cron usam metadados estruturados de negação de execução provenientes da execução incorporada (erros fatais da ferramenta de execução codificados como `SYSTEM_RUN_DENIED` ou `INVALID_REQUEST`) como o sinal definitivo de negação. Elas também reconhecem encapsulamentos `UNAVAILABLE` do host do Node em torno de um erro estruturado aninhado que contenha um desses códigos.

O Cron não classifica o texto da saída final nem frases de recusa que aparentem solicitar aprovação como negações, a menos que a execução incorporada também forneça metadados estruturados de negação, portanto o texto comum do assistente não é tratado como um comando bloqueado.

`cron list` e o histórico de execuções exibem o motivo da negação, em vez de informar um comando bloqueado como `ok`.

## Retenção

A retenção e a remoção são controladas na configuração:

- `cron.sessionRetention` (padrão: `24h`; use `false` para desativar) remove sessões concluídas de execuções isoladas.
- `cron.runLog.keepLines` (padrão: `2000`) remove, por tarefa, linhas retidas do histórico de execuções no SQLite. `cron.runLog.maxBytes` (padrão: `2000000`) continua sendo aceito para compatibilidade com logs de execução antigos armazenados em arquivos; a remoção no SQLite é baseada na contagem de linhas.

## Migração de tarefas antigas

<Note>
Se você tiver tarefas do cron anteriores ao formato atual de entrega e armazenamento, execute `openclaw doctor --fix`. O Doctor normaliza campos legados do cron (`jobId`, `schedule.cron`, campos de entrega de nível superior, incluindo o `threadId` legado, e aliases de entrega `provider` da carga útil) e migra tarefas de fallback de Webhook com `notify: true` de `cron.webhook` para uma entrega explícita por Webhook. Tarefas que já enviam anúncios para um chat mantêm essa entrega e recebem um destino de Webhook para conclusão. Quando `cron.webhook` não está definido, o marcador inerte `notify` de nível superior é removido das tarefas sem destino de migração (a entrega existente é preservada sem alterações), portanto `doctor --fix` deixa de emitir avisos repetidos sobre elas.
</Note>

## Edições comuns

Atualize as configurações de entrega sem alterar a mensagem:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Desative a entrega de uma tarefa isolada:

```bash
openclaw cron edit <job-id> --no-deliver
```

Ative um contexto leve de inicialização para uma tarefa isolada:

```bash
openclaw cron edit <job-id> --light-context
```

Envie um anúncio para um canal específico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Envie um anúncio para um tópico de fórum do Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Crie uma tarefa isolada com contexto leve de inicialização:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` aplica-se somente a tarefas isoladas de turno do agente. Nas execuções do cron, o modo leve mantém o contexto de inicialização vazio em vez de injetar o conjunto completo de inicialização do espaço de trabalho.

Crie uma tarefa de comando com argv, cwd, env e stdin exatos, além de limites de saída:

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

Por padrão, `openclaw cron list` mostra todas as tarefas correspondentes. Passe `--agent <id>` para mostrar somente as tarefas cujo ID normalizado efetivo do agente corresponda; tarefas sem um ID de agente armazenado são consideradas pertencentes ao agente padrão configurado.

`openclaw cron get <job-id>` retorna diretamente o JSON armazenado da tarefa. Use `cron show <job-id>` quando quiser a visualização legível com uma prévia da rota de entrega.

`cron list --json` e `cron show <job-id> --json` incluem um campo `status` de nível superior em cada tarefa, calculado com base em `enabled`, `state.runningAtMs` e `state.lastRunStatus`. Valores: `disabled`, `running`, `ok`, `error`, `skipped` ou `idle`. O status em JSON permanece canônico e sem elementos decorativos para que ferramentas externas possam ler o estado da tarefa sem precisar recalculá-lo; a saída legível pode complementar status `error` repetidos com uma contagem de falhas.

As entradas de `cron runs` incluem diagnósticos de entrega com o destino pretendido do cron, o destino resolvido, os envios pela ferramenta de mensagens, o uso do fallback e o estado de entrega.

Redirecionamento de agente e sessão:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` exibe um aviso quando `--agent` é omitido em tarefas de turno do agente e usa o agente padrão (`main`) como fallback. Passe `--agent <id>` no momento da criação para fixar um agente específico.

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
