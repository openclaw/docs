---
read_when:
    - Você quer tarefas agendadas e ativações automáticas
    - Você está depurando a execução e os logs do Cron
summary: Referência da CLI para `openclaw cron` (agendar e executar tarefas em segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-07-16T12:19:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eb897fde0798563144703cd2f3a2bc6c20229aa4135af9c6db41995e66ffd2d1
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gerencie tarefas Cron para o agendador do Gateway.

<Tip>
Execute `openclaw cron --help` para ver todos os comandos disponíveis. Consulte [Tarefas Cron](/pt-BR/automation/cron-jobs) para obter o guia conceitual.
</Tip>

<Note>
Todas as alterações de Cron (`add`/`create`, `update`/`edit`, `remove`, `run`) exigem `operator.admin`. As execuções de payloads de comando ocorrem diretamente no processo do Gateway, não como uma chamada de ferramenta `tools.exec` do agente; `tools.exec.*` e as aprovações de execução ainda controlam as ferramentas de execução visíveis para o modelo.
</Note>

## Crie tarefas rapidamente

`openclaw cron create` é um alias de `openclaw cron add`. Para novas tarefas, coloque primeiro o agendamento e depois o prompt:

```bash
openclaw cron create "0 7 * * *" \
  "Resuma as atualizações da madrugada." \
  --name "Resumo matinal" \
  --agent ops
```

Use `--webhook <url>` quando a tarefa precisar enviar o payload concluído por POST, em vez de entregá-lo a um destino de chat:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Resuma as implantações de hoje como JSON." \
  --name "Resumo de implantações" \
  --webhook "https://example.invalid/openclaw/cron"
```

Use `--command` para tarefas determinísticas no estilo shell que são executadas dentro do Cron do OpenClaw sem iniciar uma execução isolada de agente/modelo:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Sondagem da profundidade da fila" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` armazena `argv: ["sh", "-lc", <shell>]`. Use `--command-argv '["node","scripts/report.mjs"]'` para uma execução argv exata. As tarefas de comando capturam stdout/stderr, registram o histórico normal do Cron e encaminham a saída pelos mesmos modos de entrega `announce`, `webhook` ou `none` usados pelas tarefas isoladas. Um comando que imprime apenas `NO_REPLY` é suprimido.

## Sessões

`--session` aceita `main`, `isolated`, `current` ou `session:<id>`.

<AccordionGroup>
  <Accordion title="Chaves de sessão">
    - `main` vincula-se à sessão principal do agente.
    - `isolated` cria uma nova transcrição e um novo ID de sessão para cada execução.
    - `current` vincula-se à sessão ativa no momento da criação.
    - `session:<id>` fixa uma chave de sessão persistente explícita.

  </Accordion>
  <Accordion title="Semântica da sessão isolada">
    As execuções isoladas redefinem o contexto ambiente da conversa. O roteamento de canal e grupo, a política de envio/fila, a elevação, a origem e a vinculação do runtime ACP são redefinidos para a nova execução. Preferências seguras e substituições explícitas de modelo ou autenticação selecionadas pelo usuário podem ser mantidas entre execuções.
  </Accordion>
</AccordionGroup>

## Entrega

`openclaw cron list` e `openclaw cron show <job-id>` apresentam uma prévia da rota de entrega resolvida. Para `channel: "last"`, a prévia mostra se a rota foi resolvida a partir da sessão principal ou atual, ou se será encerrada de forma segura em caso de falha.

Destinos prefixados pelo provedor podem eliminar ambiguidades em canais de anúncio não resolvidos. Por exemplo, `to: "telegram:123"` seleciona Telegram quando `delivery.channel` é omitido ou `last`. Apenas os prefixos anunciados pelo Plugin carregado são seletores de provedor. Se `delivery.channel` for explícito, o prefixo deverá corresponder a esse canal; `channel: "whatsapp"` com `to: "telegram:123"` será rejeitado. Prefixos de serviço como `imessage:` e `sms:` continuam sendo sintaxe de destino pertencente ao canal.

<Note>
Tarefas `cron add` isoladas usam a entrega `--announce` por padrão. Use `--no-deliver` para manter a saída interna. `--deliver` permanece como um alias obsoleto de `--announce`.
</Note>

### Responsabilidade pela entrega

A entrega de chat de tarefas Cron isoladas é compartilhada entre o agente e o executor:

- O agente pode enviar diretamente usando a ferramenta `message` quando uma rota de chat está disponível.
- A entrega alternativa `announce` entrega a resposta final somente quando o agente não enviou diretamente ao destino resolvido.
- `webhook` envia o payload concluído a uma URL.
- `none` desativa a entrega alternativa pelo executor.

Use `cron add|create --webhook <url>` ou `cron edit <job-id> --webhook <url>` para configurar a entrega por Webhook. Não combine `--webhook` com sinalizadores de entrega por chat como `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` ou `--account`.

`cron edit <job-id>` pode remover campos individuais de roteamento de entrega com `--clear-channel`, `--clear-to`, `--clear-thread-id` e `--clear-account` (cada um é rejeitado quando combinado com seu sinalizador de definição correspondente). Diferentemente de `--no-deliver`, que apenas desativa a entrega alternativa pelo executor, esses removem o campo armazenado para que a tarefa volte a resolver essa parte da rota a partir dos padrões.

`--announce` é a entrega alternativa da resposta final pelo executor. `--no-deliver` desativa essa alternativa, mas não remove a ferramenta `message` do agente quando uma rota de chat está disponível.

Lembretes criados a partir de um chat ativo preservam o destino de entrega do chat atual para a entrega alternativa de anúncios. Chaves de sessão internas podem estar em letras minúsculas; não as use como fonte de verdade para IDs de provedor que diferenciam maiúsculas de minúsculas, como IDs de salas do Matrix.

### Entrega de falhas

As notificações de falha são resolvidas nesta ordem:

1. `delivery.failureDestination` na tarefa.
2. `cron.failureDestination` global.
3. O destino principal de anúncio da tarefa (quando nenhuma das opções anteriores é resolvida em um destino concreto).

<Note>
Tarefas da sessão principal podem usar `delivery.failureDestination` somente quando o modo de entrega principal for `webhook`. Tarefas isoladas o aceitam em todos os modos.
</Note>

As execuções isoladas do Cron tratam falhas do agente no nível da execução como erros da tarefa, mesmo quando nenhum payload de resposta é produzido; portanto, falhas de modelo/provedor ainda incrementam os contadores de erros e acionam notificações de falha.

Tarefas de comando do Cron não iniciam um turno isolado do agente. Um código de saída zero registra `ok`; uma saída diferente de zero, sinal, tempo limite ou tempo limite sem saída registra `error` e pode acionar o mesmo fluxo de notificação de falha.

Se uma execução isolada atingir o tempo limite antes da primeira solicitação ao modelo, `openclaw cron show` e `openclaw cron runs` incluirão um erro específico da fase, como `setup timed out before runner start`, ou uma mensagem de travamento que identifica a última fase de inicialização conhecida (por exemplo, `context-engine`). Para provedores baseados em CLI, o monitor pré-modelo permanece ativo até o início do turno da CLI externa; assim, travamentos na consulta da sessão, no hook, na autenticação, no prompt e na configuração da CLI são relatados como falhas pré-modelo do Cron.

## Agendamento

### Tarefas de execução única

`--at <datetime>` agenda uma execução única. Datas e horas sem deslocamento são tratadas como UTC, a menos que também seja informado `--tz <iana>`, que interpreta o horário local no fuso horário especificado.

<Note>
Por padrão, tarefas de execução única são excluídas após uma execução bem-sucedida. Use `--keep-after-run` para preservá-las.
</Note>

### Tarefas recorrentes

Tarefas recorrentes usam recuo exponencial entre novas tentativas após erros consecutivos: 30s, 1m, 5m, 15m, 60m. O agendamento volta ao normal após a próxima execução bem-sucedida.

Execuções ignoradas são rastreadas separadamente dos erros de execução. Elas não afetam o recuo entre novas tentativas, mas `openclaw cron edit <job-id> --failure-alert-include-skipped` pode incluir notificações repetidas de execuções ignoradas nos alertas de falha.

Para tarefas isoladas destinadas a um provedor de modelo local configurado (URL base em loopback, rede privada ou `.local`), o Cron executa uma verificação preliminar simples do provedor antes de iniciar o turno do agente: provedores `api: "ollama"` são sondados em `/api/tags`; outros provedores locais compatíveis com OpenAI (`api: "openai-completions"`, por exemplo, vLLM, SGLang, LM Studio) são sondados em `/models`. Se o endpoint estiver inacessível, a execução será registrada como `skipped` e tentada novamente em um agendamento posterior; o resultado de acessibilidade é armazenado em cache por endpoint durante 5 minutos para evitar que várias tarefas destinadas ao mesmo servidor local o sobrecarreguem com sondagens repetidas.

Tarefas Cron, estado pendente do runtime e histórico de execuções ficam no banco de dados de estado SQLite compartilhado. Os arquivos legados `jobs.json`, `<name>-state.json` e `runs/*.jsonl` são importados uma vez e renomeados com um sufixo `.migrated`. Após a importação, edite os agendamentos com `openclaw cron add|edit|remove` em vez de editar arquivos JSON.

### Execuções manuais

`openclaw cron run <job-id>` força a execução por padrão e retorna assim que a execução manual entra na fila. Respostas bem-sucedidas incluem `{ ok: true, enqueued: true, runId }`. Use o `runId` retornado para consultar o resultado posteriormente:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Adicione `--wait` quando um script precisar aguardar até que essa execução específica na fila registre um status terminal:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Com `--wait`, a CLI ainda chama `cron.run` primeiro e, em seguida, consulta `cron.runs` repetidamente para o `runId` retornado. O comando encerra com `0` somente quando a execução termina com o status `ok`. Ele encerra com código diferente de zero quando a execução termina com `error` ou `skipped`, quando a resposta do Gateway não inclui um `runId` ou quando `--wait-timeout` expira (por padrão, `10m`, com consultas a cada `2s` por padrão). `--poll-interval` deve ser maior que zero.

<Note>
Use `--due` quando desejar que o comando manual seja executado somente se a tarefa estiver atualmente no prazo. Se `--due --wait` não enfileirar uma execução, o comando retornará a resposta normal de não execução, em vez de realizar consultas repetidas.
</Note>

## Modelos

`cron add|edit --model <ref>` seleciona um modelo permitido para a tarefa. `cron add|edit --fallbacks <list>` define modelos alternativos por tarefa, por exemplo, `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; informe `--fallbacks ""` para uma execução estrita sem alternativas. `cron edit <job-id> --clear-fallbacks` remove a substituição de alternativas por tarefa. `cron edit <job-id> --clear-model` remove a substituição de modelo por tarefa, fazendo com que ela siga a precedência normal de seleção de modelo do Cron (uma substituição armazenada da sessão do Cron, se houver, ou o modelo do agente/padrão); não pode ser combinado com `--model`. `cron add|edit --thinking <level>` define uma substituição de raciocínio por tarefa; `cron edit <job-id> --clear-thinking` a remove para que a tarefa siga a precedência normal de raciocínio do Cron e não pode ser combinado com `--thinking`.

<Warning>
Se o modelo não for permitido ou não puder ser resolvido, o Cron encerrará a execução com um erro explícito de validação, em vez de recorrer à seleção de modelo do agente da tarefa ou ao modelo padrão.
</Warning>

O `--model` do Cron é um **modelo principal da tarefa**, não uma substituição de `/model` da sessão de chat. Isso significa que:

- As alternativas de modelo configuradas ainda serão aplicadas quando o modelo selecionado para a tarefa falhar.
- O `fallbacks` do payload por tarefa substitui a lista de alternativas configurada quando presente.
- Uma lista vazia de alternativas por tarefa (`--fallbacks ""` ou `fallbacks: []` no payload/API da tarefa) torna a execução do Cron estrita.
- Quando uma tarefa tem `--model`, mas nenhuma lista de alternativas está configurada, o OpenClaw passa uma substituição de alternativas explicitamente vazia para que o modelo principal do agente não seja adicionado como um destino oculto para novas tentativas.
- As verificações preliminares de provedores locais percorrem as alternativas configuradas antes de marcar uma execução do Cron como `skipped`.

`openclaw doctor` relata tarefas que já têm `payload.model` definido, incluindo contagens por namespace de provedor e divergências em relação a `agents.defaults.model`. Use essa verificação quando o comportamento de autenticação, provedor ou cobrança parecer diferente entre o chat em tempo real e as tarefas agendadas.

### Precedência de modelo do Cron isolado

O Cron isolado resolve o modelo ativo nesta ordem:

1. Substituição do hook do Gmail.
2. `--model` por tarefa.
3. Substituição de modelo armazenada da sessão do Cron (quando o usuário selecionou uma).
4. Seleção de modelo do agente ou padrão.

### Modo rápido

O modo rápido do Cron isolado segue a seleção de modelo em uso resolvida. A configuração de modelo `params.fastMode` é aplicada por padrão, mas uma substituição armazenada na sessão `fastMode` ainda prevalece sobre a configuração. Quando o modo resolvido é `auto`, o limite usa o valor `params.fastAutoOnSeconds` do modelo selecionado, com padrão de 60 segundos.

### Novas tentativas após troca de modelo em uso

Se uma execução isolada gerar `LiveSessionModelSwitchError`, o Cron persistirá o provedor e o modelo selecionados pela troca (e a substituição do perfil de autenticação selecionado pela troca, quando presente) para a execução ativa antes de tentar novamente. O loop externo de novas tentativas é limitado a duas tentativas de troca após a tentativa inicial e, em seguida, é interrompido em vez de continuar indefinidamente.

## Saída da execução e recusas

### Supressão de confirmações obsoletas

As interações isoladas do Cron suprimem respostas obsoletas que contenham apenas uma confirmação. Se o primeiro resultado for apenas uma atualização intermediária de status e nenhuma execução de subagente descendente for responsável pela resposta final, o Cron solicitará novamente uma vez o resultado real antes da entrega.

### Supressão do token de silêncio

Se uma execução isolada do Cron retornar apenas o token de silêncio (`NO_REPLY` ou `no_reply`), o Cron suprimirá tanto a entrega direta de saída quanto o caminho de contingência do resumo enfileirado, portanto nada será enviado de volta ao chat.

### Recusas estruturadas

As execuções isoladas do Cron usam os metadados estruturados de recusa de execução da execução incorporada (erros fatais da ferramenta de execução codificados como `SYSTEM_RUN_DENIED` ou `INVALID_REQUEST`) como o sinal oficial de recusa. Elas também reconhecem wrappers `UNAVAILABLE` do host do Node em torno de um erro estruturado aninhado que contenha um desses códigos.

O Cron não classifica como recusas o texto da saída final nem frases de recusa que pareçam relacionadas à aprovação, a menos que a execução incorporada também forneça metadados estruturados de recusa. Assim, textos comuns do assistente não são tratados como comandos bloqueados.

`cron list` e o histórico de execuções exibem o motivo da recusa em vez de relatar um comando bloqueado como `ok`.

## Retenção

Comportamento de retenção:

- `cron.sessionRetention` (padrão `24h`, ou `false` para desativar) remove sessões concluídas de execuções isoladas.
- O histórico de execuções mantém as 2000 linhas terminais mais recentes por tarefa do Cron. Linhas perdidas mantêm a janela padrão de limpeza de tarefas perdidas de 24 horas.

## Migração de tarefas antigas

<Note>
Se houver tarefas do Cron anteriores ao formato atual de entrega e armazenamento, execute `openclaw doctor --fix`. O Doctor normaliza campos legados do Cron (`jobId`, `schedule.cron`, campos de entrega de nível superior, incluindo o `threadId` legado, e aliases de entrega `provider` da carga útil) e migra tarefas de contingência de Webhook `notify: true` de `cron.webhook` para uma entrega explícita por Webhook. Tarefas que já fazem anúncios em um chat mantêm essa entrega e recebem um destino de Webhook de conclusão. Quando `cron.webhook` não está definido, o marcador inerte de nível superior `notify` é removido das tarefas sem destino de migração (a entrega existente é preservada sem alterações), portanto `doctor --fix` deixa de emitir avisos repetidos sobre elas.
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

Ative o contexto leve de inicialização para uma tarefa isolada:

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
openclaw cron create "0 7 * * *" \
  "Resuma as atualizações ocorridas durante a noite." \
  --name "Resumo matinal leve" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` aplica-se apenas a tarefas isoladas de interação do agente. Para execuções do Cron, o modo leve mantém o contexto de inicialização vazio em vez de injetar o conjunto completo de inicialização do espaço de trabalho.

Crie uma tarefa de comando com argv, cwd, env e stdin exatos e limites de saída:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Exportação de posição" \
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

Execução e inspeção manuais:

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

`openclaw cron list` mostra todas as tarefas correspondentes por padrão. Passe `--agent <id>` para mostrar apenas as tarefas cujo ID normalizado efetivo do agente corresponda; tarefas sem um ID de agente armazenado são consideradas pertencentes ao agente padrão configurado.

`openclaw cron get <job-id>` retorna diretamente o JSON armazenado da tarefa. Use `cron show <job-id>` para obter a visualização legível por humanos com uma prévia da rota de entrega.

`cron list --json` e `cron show <job-id> --json` incluem um campo de nível superior `status` em cada tarefa, calculado a partir de `enabled`, `state.runningAtMs` e `state.lastRunStatus`. Valores: `disabled`, `running`, `ok`, `error`, `skipped` ou `idle`. O status em JSON permanece canônico e sem elementos decorativos para que ferramentas externas possam ler o estado da tarefa sem recalculá-lo; a saída para humanos pode complementar status `error` repetidos com uma contagem de falhas.

As entradas `cron runs` incluem diagnósticos de entrega com o destino pretendido do Cron, o destino resolvido, os envios da ferramenta de mensagens, o uso da contingência e o estado de entrega.

Redirecionamento de agente e sessão:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` avisa quando `--agent` é omitido em tarefas de interação do agente e recorre ao agente padrão (`main`). Passe `--agent <id>` durante a criação para fixar um agente específico.

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
