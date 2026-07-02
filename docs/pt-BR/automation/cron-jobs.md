---
read_when:
    - Agendando trabalhos em segundo plano ou despertares
    - Conectando gatilhos externos (webhooks, Gmail) ao OpenClaw
    - Decidindo entre Heartbeat e Cron para tarefas agendadas
sidebarTitle: Scheduled tasks
summary: Tarefas agendadas, webhooks e gatilhos do Gmail PubSub para o agendador do Gateway
title: Tarefas agendadas
x-i18n:
    generated_at: "2026-07-02T00:46:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 314b02ed3002843afe9d96e948de362b6111e648eb0e7106ec2ccc230cf50692
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron é o agendador integrado do Gateway. Ele persiste jobs, desperta o agente no momento certo e pode entregar a saída de volta a um canal de chat ou endpoint de Webhook.

## Início rápido

<Steps>
  <Step title="Adicionar um lembrete único">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Verificar seus jobs">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Ver histórico de execuções">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Como o cron funciona

- Cron é executado **dentro do processo do Gateway** (não dentro do modelo).
- Definições de jobs, estado de runtime e histórico de execuções persistem no banco de dados de estado SQLite compartilhado do OpenClaw, para que reinicializações não percam agendamentos.
- Ao atualizar, execute `openclaw doctor --fix` para importar os arquivos legados `~/.openclaw/cron/jobs.json`, `jobs-state.json` e `runs/*.jsonl` para o SQLite e renomeá-los com um sufixo `.migrated`. Linhas de job malformadas são ignoradas pelo runtime e copiadas para `jobs-quarantine.json` para reparo ou revisão posterior.
- `cron.store` ainda nomeia a chave lógica do armazenamento de cron e o caminho de importação do doctor. Depois da importação, editar esse arquivo JSON não altera mais os jobs de cron ativos; use `openclaw cron add|edit|remove` ou os métodos RPC de cron do Gateway.
- Todas as execuções de cron criam registros de [tarefa em segundo plano](/pt-BR/automation/tasks).
- Na inicialização do Gateway, jobs atrasados de turno de agente isolado são reagendados para fora da janela de conexão de canal, em vez de serem reproduzidos imediatamente, para que a inicialização do Discord/Telegram e a configuração de comandos nativos permaneçam responsivas após reinicializações.
- Jobs únicos (`--at`) são excluídos automaticamente após o sucesso por padrão.
- Execuções isoladas de cron tentam, em modo best-effort, fechar abas/processos de navegador rastreados para a sessão `cron:<jobId>` quando a execução termina, para que automações de navegador destacadas não deixem processos órfãos.
- Execuções isoladas de cron que recebem a concessão restrita de autolimpeza do cron ainda podem ler o status do agendador, uma lista autofiltrada do job atual e o histórico de execuções desse job, para que verificações de status/Heartbeat possam inspecionar seu próprio agendamento sem obter acesso mais amplo de mutação do cron.
- Execuções isoladas de cron também protegem contra respostas de confirmação obsoletas. Se o primeiro resultado for apenas uma atualização intermediária de status (`on it`, `pulling everything together` e dicas semelhantes) e nenhuma execução descendente de subagente ainda for responsável pela resposta final, o OpenClaw solicita novamente uma vez o resultado real antes da entrega.
- Execuções isoladas de cron usam metadados estruturados de negação de execução da execução embutida, incluindo wrappers `UNAVAILABLE` de host de node cuja mensagem de erro aninhada começa com `SYSTEM_RUN_DENIED` ou `INVALID_REQUEST`, para que um comando bloqueado não seja relatado como uma execução verde, enquanto prosa comum do assistente não é tratada como negação.
- Execuções isoladas de cron também tratam falhas de agente em nível de execução como erros de job mesmo quando nenhum payload de resposta é produzido, para que falhas de modelo/provedor incrementem contadores de erro e acionem notificações de falha em vez de limpar o job como bem-sucedido.
- Quando um job isolado de turno de agente atinge `timeoutSeconds`, o cron aborta a execução de agente subjacente e dá a ela uma janela curta de limpeza. Se a execução não for drenada, a limpeza de propriedade do Gateway força a liberação da propriedade da sessão dessa execução antes de o cron registrar o timeout, para que trabalho de chat enfileirado não fique preso atrás de uma sessão de processamento obsoleta.
- Se um turno de agente isolado travar antes de o runner começar ou antes da primeira chamada ao modelo, o cron registra um timeout específico da fase, como `setup timed out before runner start` ou `stalled before first model call (last phase: context-engine)`. Esses watchdogs cobrem provedores embutidos e provedores apoiados por CLI antes de o processo de CLI externo deles ser realmente iniciado, e são limitados independentemente de valores longos de `timeoutSeconds`, para que falhas de cold start/autenticação/contexto apareçam rapidamente em vez de aguardarem todo o orçamento do job.
- Se você usa cron do sistema ou outro agendador externo para executar `openclaw agent`, envolva-o com uma escalada de hard-kill mesmo que a CLI trate `SIGTERM`/`SIGINT`. Execuções apoiadas pelo Gateway pedem ao Gateway para abortar execuções aceitas; execuções locais e fallback embutidas recebem o mesmo sinal de abortar. Para `timeout` GNU, prefira `timeout -k 60 600 openclaw agent ...` em vez de `timeout 600 ...`; o valor `-k` é o backstop do supervisor se o processo não conseguir drenar. Para units do systemd, mantenha o mesmo formato usando um sinal de parada `SIGTERM` mais uma janela de tolerância como `TimeoutStopSec` antes de qualquer kill final. Se uma tentativa reutilizar um `--run-id` enquanto a execução original do Gateway ainda estiver ativa, a duplicata será relatada como em andamento em vez de iniciar uma segunda execução.

<a id="maintenance"></a>

<Note>
A reconciliação de tarefas para cron é primeiro de propriedade do runtime e, em segundo lugar, apoiada por histórico durável: uma tarefa de cron ativa permanece ativa enquanto o runtime do cron ainda rastreia esse job como em execução, mesmo que uma linha antiga de sessão filha ainda exista. Quando o runtime deixa de ser dono do job e a janela de tolerância de 5 minutos expira, as verificações de manutenção inspecionam logs de execução persistidos e o estado do job para a execução correspondente `cron:<jobId>:<startedAt>`. Se esse histórico durável mostrar um resultado terminal, o ledger de tarefas é finalizado a partir dele; caso contrário, a manutenção de propriedade do Gateway pode marcar a tarefa como `lost`. A auditoria offline da CLI pode recuperar a partir do histórico durável, mas não trata seu próprio conjunto vazio de jobs ativos em processo como prova de que uma execução de cron de propriedade do Gateway desapareceu.
</Note>

## Tipos de agendamento

| Tipo    | Flag da CLI | Descrição                                               |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Timestamp único (ISO 8601 ou relativo como `20m`)       |
| `every` | `--every` | Intervalo fixo                                          |
| `cron`  | `--cron`  | Expressão cron de 5 ou 6 campos com `--tz` opcional     |

Timestamps sem fuso horário são tratados como UTC. Adicione `--tz America/New_York` para agendamento pelo relógio local.

Expressões recorrentes no topo da hora são automaticamente escalonadas em até 5 minutos para reduzir picos de carga. Use `--exact` para forçar temporização precisa ou `--stagger 30s` para uma janela explícita.

### Dia do mês e dia da semana usam lógica OR

Expressões cron são analisadas pelo [croner](https://github.com/Hexagon/croner). Quando os campos de dia do mês e dia da semana não são curingas, o croner corresponde quando **qualquer um** dos campos corresponde, não ambos. Esse é o comportamento padrão do Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Isso dispara cerca de 5 a 6 vezes por mês em vez de 0 a 1 vez por mês. O OpenClaw usa aqui o comportamento OR padrão do Croner. Para exigir ambas as condições, use o modificador de dia da semana `+` do Croner (`0 9 15 * +1`) ou agende em um campo e proteja o outro no prompt ou comando do seu job.

## Estilos de execução

| Estilo          | Valor de `--session` | Executa em              | Melhor para                    |
| --------------- | ------------------- | ------------------------ | ------------------------------ |
| Sessão principal | `main`              | Lane dedicada de despertar do cron | Lembretes, eventos do sistema |
| Isolado         | `isolated`          | `cron:<jobId>` dedicado | Relatórios, tarefas em segundo plano |
| Sessão atual    | `current`           | Execução de cron destacada | Trabalho recorrente sensível ao contexto |
| Sessão personalizada | `session:custom-id` | Execução de cron destacada | Direcionar uma sessão/chat conhecida |

<AccordionGroup>
  <Accordion title="Sessão principal vs isolada vs personalizada">
    Jobs de **sessão principal** enfileiram um evento do sistema em uma lane de execução de propriedade do cron e, opcionalmente, despertam o Heartbeat (`--wake now` ou `--wake next-heartbeat`). Eles podem usar o último contexto de entrega da sessão principal de destino para respostas, mas não adicionam turnos de cron rotineiros à lane de chat humano e não estendem a atualização de reset diário/ocioso da sessão de destino. Jobs **isolados** executam um turno de agente dedicado com uma sessão nova. Jobs de sessão **atual** e **personalizada** (`current`, `session:xxx`) podem usar o chat/sessão selecionado para contexto de entrega e semeadura segura de preferências, mas cada execução ainda ocorre em uma sessão de cron destacada, para que trabalho agendado não bloqueie nem polua a transcrição da conversa ao vivo.

    Eventos de cron da sessão principal são lembretes autônomos de evento do sistema. Eles não incluem automaticamente a instrução "Read HEARTBEAT.md" do prompt padrão de Heartbeat. Se um lembrete recorrente deve consultar `HEARTBEAT.md`, diga isso explicitamente no texto do evento de cron ou nas próprias instruções do agente.

  </Accordion>
  <Accordion title="O que 'sessão nova' significa para jobs destacados">
    Para jobs isolados, de sessão atual e de sessão personalizada, "sessão nova" significa um novo id de transcrição/sessão para cada execução. O OpenClaw pode carregar preferências seguras, como configurações de raciocínio/rápido/verboso, labels e substituições explícitas de modelo/autenticação selecionadas pelo usuário. Execuções destacadas não herdam contexto de conversa ambiente de uma linha de cron mais antiga: roteamento de canal/grupo, política de envio ou fila, elevação, origem ou associação de runtime ACP. Coloque o estado durável de trabalho recorrente no prompt, em arquivos do workspace, em ferramentas ou no sistema em que o job opera, em vez de depender de uma transcrição de chat ao vivo como memória do cron.
  </Accordion>
  <Accordion title="Limpeza de runtime">
    Para jobs isolados, o teardown de runtime agora inclui limpeza best-effort de navegador para essa sessão de cron. Falhas de limpeza são ignoradas para que o resultado real do cron ainda prevaleça.

    Execuções isoladas de cron também descartam quaisquer instâncias de runtime MCP empacotadas criadas para o job por meio do caminho compartilhado de limpeza de runtime. Isso corresponde à forma como clientes MCP de sessão principal e de sessão personalizada são desmontados, para que jobs isolados de cron não vazem processos filhos stdio ou conexões MCP de longa duração entre execuções.

  </Accordion>
  <Accordion title="Entrega de subagente e Discord">
    Quando execuções isoladas de cron orquestram subagentes, a entrega também prefere a saída final descendente em vez de texto intermediário obsoleto do pai. Se descendentes ainda estiverem em execução, o OpenClaw suprime essa atualização parcial do pai em vez de anunciá-la.

    Para destinos de anúncio do Discord somente texto, o OpenClaw envia o texto final canônico do assistente uma vez, em vez de reproduzir tanto payloads de texto transmitidos/intermediários quanto a resposta final. Payloads de mídia e estruturados do Discord ainda são entregues como payloads separados para que anexos e componentes não sejam descartados.

  </Accordion>
</AccordionGroup>

### Payloads de comando

Use payloads de comando para scripts determinísticos que devem executar dentro do agendador do Gateway sem iniciar um turno de agente isolado apoiado por modelo. Jobs de comando executam no host do Gateway, capturam stdout/stderr, registram a execução no histórico do cron e reutilizam os mesmos modos de entrega `announce`, `webhook` e `none` dos jobs isolados.

<Note>
Cron de comando é uma superfície de automação de administrador operador do Gateway, não uma chamada de agente `tools.exec`. Criar, atualizar, remover ou executar manualmente jobs de cron exige `operator.admin`; execuções de comando agendadas depois executam dentro do processo do Gateway como essa automação criada pelo administrador. Políticas de exec de agente, como `tools.exec.mode`, prompts de aprovação e allowlists de ferramentas por agente, governam ferramentas de exec visíveis ao modelo, não payloads de cron de comando.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` armazena `argv: ["sh", "-lc", <shell>]`. Use `--command-argv '["node","scripts/report.mjs"]'` quando quiser execução argv exata sem análise de shell. Os campos opcionais `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` e `--output-max-bytes` controlam o ambiente do processo, stdin e limites de saída.

Se stdout não estiver vazio, esse texto será o resultado entregue. Se stdout estiver vazio e stderr não estiver vazio, stderr será entregue. Se ambos os fluxos estiverem presentes, cron entregará um pequeno bloco `stdout:` / `stderr:`. Um código de saída zero registra a execução como `ok`; saída diferente de zero, sinal, timeout ou timeout sem saída registra `error` e pode acionar alertas de falha. Um comando que imprime apenas `NO_REPLY` usa a supressão normal de token silencioso do cron e não publica nada de volta no chat.

### Opções de payload para tarefas isoladas

<ParamField path="--message" type="string" required>
  Texto do prompt (obrigatório para isoladas).
</ParamField>
<ParamField path="--model" type="string">
  Substituição de modelo; usa o modelo permitido selecionado para a tarefa.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Lista de modelos de fallback por tarefa, por exemplo `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Passe `--fallbacks ""` para uma execução estrita sem fallbacks.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Em `cron edit`, remove a substituição de fallback por tarefa para que a tarefa siga a precedência de fallback configurada. Não pode ser combinado com `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Em `cron edit`, remove a substituição de modelo por tarefa para que a tarefa siga a precedência normal de seleção de modelo do cron (uma substituição armazenada de sessão cron, se definida; caso contrário, o modelo do agente/padrão). Não pode ser combinado com `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Substituição de nível de raciocínio.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Em `cron edit`, remove a substituição de raciocínio por tarefa para que a tarefa siga a precedência normal de raciocínio do cron. Não pode ser combinado com `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Ignora a injeção de arquivos de inicialização do workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Restringe quais ferramentas a tarefa pode usar, por exemplo `--tools exec,read`.
</ParamField>

`--model` usa o modelo permitido selecionado como o modelo primário dessa tarefa. Ele não é o mesmo que uma substituição `/model` de sessão de chat: as cadeias de fallback configuradas ainda se aplicam quando o primário da tarefa falha. Se o modelo solicitado não for permitido ou não puder ser resolvido, cron falhará a execução com um erro de validação explícito em vez de recorrer silenciosamente à seleção de modelo do agente/padrão da tarefa.

Tarefas Cron também podem carregar `fallbacks` no nível do payload. Quando presente, essa lista substitui a cadeia de fallback configurada para a tarefa. Use `fallbacks: []` no payload/API da tarefa quando quiser uma execução cron estrita que tente apenas o modelo selecionado. Se uma tarefa tiver `--model`, mas não tiver fallbacks no payload nem configurados, o OpenClaw passará uma substituição explícita de fallback vazia para que o primário do agente não seja anexado como um alvo extra oculto de nova tentativa.

As verificações de preflight de provedor local percorrem os fallbacks configurados antes de marcar uma execução cron como `skipped`; `fallbacks: []` mantém esse caminho de preflight estrito.

A precedência de seleção de modelo para tarefas isoladas é:

1. Substituição de modelo do hook do Gmail (quando a execução veio do Gmail e essa substituição é permitida)
2. `model` do payload por tarefa
3. Substituição de modelo de sessão cron armazenada selecionada pelo usuário
4. Seleção de modelo do agente/padrão

O modo rápido também segue a seleção ativa resolvida. Se a configuração do modelo selecionado tiver `params.fastMode`, o cron isolado usa isso por padrão. Uma substituição `fastMode` de sessão armazenada ainda prevalece sobre a configuração em qualquer direção. O modo automático usa o limite `params.fastAutoOnSeconds` do modelo selecionado quando presente, com padrão de 60 segundos.

Se uma execução isolada atingir uma transferência de troca de modelo ao vivo, cron tentará novamente com o provedor/modelo trocado e persistirá essa seleção ao vivo para a execução ativa antes de tentar novamente. Quando a troca também carrega um novo perfil de autenticação, cron também persiste essa substituição de perfil de autenticação para a execução ativa. As novas tentativas são limitadas: após a tentativa inicial mais 2 novas tentativas de troca, cron aborta em vez de entrar em loop para sempre.

Antes de uma execução cron isolada entrar no executor do agente, o OpenClaw verifica endpoints alcançáveis de provedores locais para provedores configurados `api: "ollama"` e `api: "openai-completions"` cujo `baseUrl` seja local loopback, rede privada ou `.local`. Se esse endpoint estiver fora do ar, a execução será registrada como `skipped` com um erro claro de provedor/modelo em vez de iniciar uma chamada de modelo. O resultado do endpoint fica em cache por 5 minutos, portanto muitas tarefas vencidas usando o mesmo servidor local Ollama, vLLM, SGLang ou LM Studio fora do ar compartilham uma pequena sondagem em vez de criar uma tempestade de requisições. Execuções ignoradas por preflight de provedor não incrementam o backoff de erro de execução; habilite `failureAlert.includeSkipped` quando quiser notificações repetidas de ignoradas.

## Entrega e saída

| Modo       | O que acontece                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Entrega de fallback do texto final ao alvo se o agente não enviou |
| `webhook`  | Envia o payload de evento concluído por POST para uma URL                                |
| `none`     | Sem entrega de fallback do executor                                         |

Use `--announce --channel telegram --to "-1001234567890"` para entrega em canal. Para tópicos de fórum do Telegram, use `-1001234567890:topic:123`; o OpenClaw também aceita o atalho de propriedade do Telegram `-1001234567890:123`. Chamadores RPC/config diretos podem passar `delivery.threadId` como string ou número. Alvos Slack/Discord/Mattermost devem usar prefixos explícitos (`channel:<id>`, `user:<id>`). IDs de salas Matrix diferenciam maiúsculas de minúsculas; use o ID exato da sala ou o formato `room:!room:server` do Matrix.

Quando a entrega de anúncio usa `channel: "last"` ou omite `channel`, um alvo com prefixo de provedor, como `telegram:123`, pode selecionar o canal antes que cron recorra ao histórico da sessão ou a um único canal configurado. Apenas prefixos anunciados pelo Plugin carregado são seletores de provedor. Se `delivery.channel` for explícito, o prefixo do alvo deve nomear o mesmo provedor; por exemplo, `channel: "whatsapp"` com `to: "telegram:123"` é rejeitado em vez de permitir que o WhatsApp interprete o ID do Telegram como um número de telefone. Prefixos de tipo de alvo e serviço, como `channel:<id>`, `user:<id>`, `imessage:<handle>` e `sms:<number>`, permanecem sintaxe de alvo pertencente ao canal, não seletores de provedor.

Para tarefas isoladas, a entrega no chat é compartilhada. Se uma rota de chat estiver disponível, o agente poderá usar a ferramenta `message` mesmo quando a tarefa usar `--no-deliver`. Se o agente enviar para o alvo configurado/atual, o OpenClaw ignorará o anúncio de fallback. Caso contrário, `announce`, `webhook` e `none` controlam apenas o que o executor faz com a resposta final após o turno do agente.

Quando um agente cria um lembrete isolado a partir de um chat ativo, o OpenClaw armazena o alvo preservado de entrega ao vivo para a rota de anúncio de fallback. Chaves internas de sessão podem estar em minúsculas; alvos de entrega de provedor não são reconstruídos a partir dessas chaves quando o contexto de chat atual está disponível.

A entrega implícita de anúncio usa allowlists de canais configuradas para validar e redirecionar alvos obsoletos. Aprovações do armazenamento de pares de DM não são destinatários de automação de fallback; defina `delivery.to` ou configure a entrada `allowFrom` do canal quando uma tarefa agendada deve enviar proativamente para uma DM.

## Idioma da saída

Tarefas Cron não inferem um idioma de resposta a partir do canal, da localidade ou de mensagens
anteriores. Coloque a regra de idioma na mensagem ou no modelo agendado:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Para arquivos de modelo, mantenha a instrução de idioma no prompt renderizado e
verifique se placeholders como `{{language}}` foram preenchidos antes de a tarefa ser executada. Se
a saída misturar idiomas, torne a regra explícita, por exemplo: "Use Chinese
for narrative text and keep technical terms in English."

Notificações de falha seguem um caminho de destino separado:

- `cron.failureDestination` define um padrão global para notificações de falha.
- `job.delivery.failureDestination` substitui isso por tarefa.
- Se nenhum dos dois estiver definido e a tarefa já entregar via `announce`, as notificações de falha agora recorrem a esse alvo primário de anúncio.
- `delivery.failureDestination` só é compatível com tarefas `sessionTarget="isolated"`, a menos que o modo de entrega primário seja `webhook`.
- `failureAlert.includeSkipped: true` inclui uma tarefa ou política global de alerta cron em alertas repetidos de execuções ignoradas. Execuções ignoradas mantêm um contador separado de ignoradas consecutivas, portanto não afetam o backoff de erro de execução.

## Exemplos de CLI

<Tabs>
  <Tab title="Lembrete único">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Tarefa isolada recorrente">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Summarize overnight updates." \
      --name "Morning brief" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Substituição de modelo e raciocínio">
    ```bash
    openclaw cron add \
      --name "Deep analysis" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Weekly deep analysis of project progress." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Saída de Webhook">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Saída de comando">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Queue depth probe" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Webhooks

Gateway pode expor endpoints de Webhook HTTP para gatilhos externos. Habilite na configuração:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Autenticação

Toda requisição deve incluir o token do hook via cabeçalho:

- `Authorization: Bearer <token>` (recomendado)
- `x-openclaw-token: <token>`

Tokens em query string são rejeitados.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Enfileira um evento do sistema para a sessão principal:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Descrição do evento.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` ou `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Executa um turno de agente isolado:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Campos: `message` (obrigatório), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hooks mapeados (POST /hooks/<name>)">
    Nomes de hooks personalizados são resolvidos via `hooks.mappings` na configuração. Mapeamentos podem transformar payloads arbitrários em ações `wake` ou `agent` com modelos ou transformações de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantenha endpoints de hook atrás de loopback, tailnet ou proxy reverso confiável.

- Use um token de gancho dedicado; não reutilize tokens de autenticação do Gateway.
- Mantenha `hooks.path` em um subcaminho dedicado; `/` é rejeitado.
- Defina `hooks.allowedAgentIds` para limitar qual agente efetivo um gancho pode acionar, incluindo o agente padrão quando `agentId` for omitido.
- Mantenha `hooks.allowRequestSessionKey=false`, a menos que você exija sessões selecionadas pelo chamador.
- Se você habilitar `hooks.allowRequestSessionKey`, também defina `hooks.allowedSessionKeyPrefixes` para restringir os formatos permitidos de chave de sessão.
- As cargas úteis de gancho são encapsuladas com limites de segurança por padrão.

</Warning>

## Integração Gmail PubSub

Conecte gatilhos da caixa de entrada do Gmail ao OpenClaw via Google PubSub.

<Note>
**Pré-requisitos:** CLI `gcloud`, `gog` (gogcli), ganchos do OpenClaw habilitados, Tailscale para o endpoint HTTPS público.
</Note>

### Configuração pelo assistente (recomendado)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Isso grava a configuração `hooks.gmail`, habilita a predefinição do Gmail e usa o Tailscale Funnel para o endpoint push.

### Inicialização automática do Gateway

Quando `hooks.enabled=true` e `hooks.gmail.account` está definido, o Gateway inicia `gog gmail watch serve` na inicialização e renova automaticamente o watch. Defina `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desativar.

### Configuração manual única

<Steps>
  <Step title="Select the GCP project">
    Selecione o projeto GCP que possui o cliente OAuth usado por `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Create topic and grant Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start the watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Substituição de modelo do Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Gerenciamento de tarefas

```bash
# List all jobs
openclaw cron list

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Force run a job now and wait for its terminal status
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# View one exact run
openclaw cron runs --id <jobId> --run-id <runId>

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` retorna depois de enfileirar a execução manual. Use `--wait` para ganchos de desligamento, scripts de manutenção ou outras automações que precisam bloquear até que a execução enfileirada termine. O modo de espera consulta o `runId` exato retornado; ele sai com `0` para o status `ok` e com valor diferente de zero para `error`, `skipped` ou tempo limite de espera.

A ferramenta `cron` do agente retorna resumos compactos de tarefas (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) de `cron(action: "list")`; use `cron(action: "get", jobId: "...")` para uma definição completa de uma tarefa. Chamadores diretos do Gateway podem passar `compact: true` para `cron.list`; omiti-lo preserva a resposta completa existente com prévias de entrega.

`openclaw cron create` é um alias para `openclaw cron add`, e novas tarefas podem usar um agendamento posicional (`"0 9 * * 1"`, `"every 1h"`, `"20m"` ou um timestamp ISO) seguido por um prompt posicional do agente. Use `--webhook <url>` em `cron add|create` ou `cron edit` para enviar via POST a carga útil da execução concluída para um endpoint HTTP. A entrega por Webhook não pode ser combinada com flags de entrega por chat, como `--announce`, `--channel`, `--to`, `--thread-id` ou `--account`. Em `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` e `--clear-account` removem esses campos de roteamento individualmente (cada um é rejeitado junto com sua flag de definição correspondente), o que é diferente de `--no-deliver` desabilitar a entrega de fallback do executor.

<Note>
Observação sobre substituição de modelo:

- `openclaw cron add|edit --model ...` altera o modelo selecionado da tarefa.
- Se o modelo for permitido, esse provedor/modelo exato chega à execução isolada do agente.
- Se ele não for permitido ou não puder ser resolvido, o Cron falha a execução com um erro explícito de validação.
- Patches de carga útil da API `cron.update` podem definir `model: null` para limpar uma substituição de modelo armazenada da tarefa.
- `openclaw cron edit <job-id> --clear-model` limpa essa substituição pela CLI (mesmo efeito do patch `model: null`) e não pode ser combinado com `--model`.
- Cadeias de fallback configuradas ainda se aplicam porque `--model` do Cron é o primário da tarefa, não uma substituição de sessão `/model`.
- `openclaw cron add|edit --fallbacks ...` define a carga útil `fallbacks`, substituindo os fallbacks configurados para essa tarefa; `--fallbacks ""` desabilita o fallback e torna a execução estrita. `openclaw cron edit <job-id> --clear-fallbacks` limpa a substituição por tarefa.
- Um `--model` simples sem lista de fallback explícita ou configurada não recai para o primário do agente como um alvo extra silencioso de nova tentativa.

</Note>

## Configuração

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

`maxConcurrentRuns` limita tanto o despacho Cron agendado quanto a execução isolada de turnos do agente, e o padrão é 8. Turnos isolados de agente do Cron usam internamente a fila de execução dedicada `cron-nested`, então aumentar esse valor permite que execuções LLM independentes do Cron avancem em paralelo, em vez de iniciar apenas seus wrappers Cron externos. A fila compartilhada não Cron `nested` não é ampliada por essa configuração.

`cron.store` é uma chave lógica de armazenamento e um caminho legado de importação do doctor. Execute `openclaw doctor --fix` para importar armazenamentos JSON existentes para SQLite e arquivá-los; alterações futuras do Cron devem passar pela CLI ou pela API do Gateway.

Desabilitar Cron: `cron.enabled: false` ou `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Nova tentativa única**: erros transitórios (limite de taxa, sobrecarga, rede, erro do servidor) tentam novamente até 3 vezes com backoff exponencial. Erros permanentes desabilitam imediatamente.

    **Nova tentativa recorrente**: backoff exponencial (30s a 60m) entre tentativas. O backoff é redefinido após a próxima execução bem-sucedida.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (padrão `24h`) remove entradas isoladas de sessão de execução. `cron.runLog.keepLines` limita as linhas mantidas do histórico de execuções SQLite por tarefa; `maxBytes` é mantido para compatibilidade de configuração com logs de execução antigos baseados em arquivo.
  </Accordion>
</AccordionGroup>

## Solução de problemas

### Escada de comandos

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron not firing">
    - Verifique `cron.enabled` e a variável de ambiente `OPENCLAW_SKIP_CRON`.
    - Confirme que o Gateway está em execução continuamente.
    - Para agendamentos `cron`, verifique o fuso horário (`--tz`) em relação ao fuso horário do host.
    - `reason: not-due` na saída da execução significa que a execução manual foi verificada com `openclaw cron run <jobId> --due` e a tarefa ainda não estava vencida.

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - O modo de entrega `none` significa que nenhum envio de fallback do executor é esperado. O agente ainda pode enviar diretamente com a ferramenta `message` quando uma rota de chat está disponível.
    - Destino de entrega ausente/inválido (`channel`/`to`) significa que a saída foi ignorada.
    - Para Matrix, tarefas copiadas ou legadas com IDs de sala `delivery.to` em minúsculas podem falhar porque IDs de sala do Matrix diferenciam maiúsculas de minúsculas. Edite a tarefa para o valor exato `!room:server` ou `room:!room:server` do Matrix.
    - Erros de autenticação de canal (`unauthorized`, `Forbidden`) significam que a entrega foi bloqueada por credenciais.
    - Se a execução isolada retornar apenas o token silencioso (`NO_REPLY` / `no_reply`), o OpenClaw suprime a entrega direta de saída e também suprime o caminho de resumo enfileirado de fallback, então nada é publicado de volta no chat.
    - Se o agente deve enviar mensagem ao usuário por conta própria, verifique se a tarefa tem uma rota utilizável (`channel: "last"` com um chat anterior ou um canal/destino explícito).

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - A atualização de redefinição diária e por inatividade não se baseia em `updatedAt`; consulte [Gerenciamento de sessão](/pt-BR/concepts/session#session-lifecycle).
    - Despertares do Cron, execuções de Heartbeat, notificações de exec e escrituração do Gateway podem atualizar a linha da sessão para roteamento/status, mas não estendem `sessionStartedAt` nem `lastInteractionAt`.
    - Para linhas legadas criadas antes da existência desses campos, o OpenClaw pode recuperar `sessionStartedAt` do cabeçalho de sessão JSONL da transcrição quando o arquivo ainda está disponível. Linhas legadas inativas sem `lastInteractionAt` usam esse horário inicial recuperado como sua linha de base de inatividade.

  </Accordion>
  <Accordion title="Timezone gotchas">
    - Cron sem `--tz` usa o fuso horário do host do Gateway.
    - Agendamentos `at` sem fuso horário são tratados como UTC.
    - `activeHours` do Heartbeat usa a resolução de fuso horário configurada.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Automação](/pt-BR/automation) — todos os mecanismos de automação em resumo
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — ledger de tarefas para execuções Cron
- [Heartbeat](/pt-BR/gateway/heartbeat) — turnos periódicos da sessão principal
- [Fuso horário](/pt-BR/concepts/timezone) — configuração de fuso horário
