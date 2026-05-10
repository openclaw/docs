---
read_when:
    - Agendamento de tarefas em segundo plano ou despertares
    - Conectando gatilhos externos (Webhooks, Gmail) ao OpenClaw
    - Decidindo entre Heartbeat e Cron para tarefas agendadas
sidebarTitle: Scheduled tasks
summary: Tarefas agendadas, webhooks e acionadores do Gmail PubSub para o agendador do Gateway
title: Tarefas agendadas
x-i18n:
    generated_at: "2026-05-10T19:21:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: b837fc5c4cd2647bdab98b0421d2f89a528164c8eb93e7851428c73f8f59dccb
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron é o agendador integrado do Gateway. Ele persiste tarefas, desperta o agente no momento certo e pode entregar a saída de volta para um canal de chat ou endpoint de webhook.

## Início rápido

<Steps>
  <Step title="Adicionar um lembrete único">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Verificar suas tarefas">
    ```bash
    openclaw cron list
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
- As definições de tarefas persistem em `~/.openclaw/cron/jobs.json`, então reinicializações não perdem agendamentos.
- O estado de execução em runtime persiste ao lado dele em `~/.openclaw/cron/jobs-state.json`. Se você acompanha definições de cron no git, acompanhe `jobs.json` e adicione `jobs-state.json` ao gitignore.
- Após a separação, versões mais antigas do OpenClaw conseguem ler `jobs.json`, mas podem tratar tarefas como novas porque os campos de runtime agora ficam em `jobs-state.json`.
- Quando `jobs.json` é editado enquanto o Gateway está em execução ou parado, o OpenClaw compara os campos de agendamento alterados com metadados pendentes de slot de runtime e limpa valores `nextRunAtMs` obsoletos. Reescritas apenas de formatação ou somente de ordem de chaves preservam o slot pendente.
- Todas as execuções de cron criam registros de [tarefa em segundo plano](/pt-BR/automation/tasks).
- Na inicialização do Gateway, tarefas atrasadas de turno de agente isolado são reagendadas para fora da janela de conexão do canal, em vez de serem reproduzidas imediatamente, para que a inicialização do Discord/Telegram e a configuração de comandos nativos continuem responsivas após reinicializações.
- Tarefas únicas (`--at`) são excluídas automaticamente após sucesso por padrão.
- Execuções isoladas de cron fazem uma tentativa de melhor esforço para fechar abas/processos de navegador rastreados da sessão `cron:<jobId>` quando a execução é concluída, para que automações de navegador destacadas não deixem processos órfãos.
- Execuções isoladas de cron que recebem a concessão restrita de autolimpeza do cron ainda podem ler o status do agendador, uma lista autoflitrada de sua tarefa atual e o histórico de execuções dessa tarefa, para que verificações de status/Heartbeat possam inspecionar seu próprio agendamento sem obter acesso mais amplo para mutação do cron.
- Execuções isoladas de cron também protegem contra respostas de confirmação obsoletas. Se o primeiro resultado for apenas uma atualização de status provisória (`on it`, `pulling everything together` e dicas semelhantes) e nenhuma execução de subagente descendente ainda for responsável pela resposta final, o OpenClaw solicita novamente o resultado real uma vez antes da entrega.
- Execuções isoladas de cron preferem metadados estruturados de negação de execução da execução incorporada e, em seguida, recorrem a marcadores conhecidos de resumo/saída finais, como `SYSTEM_RUN_DENIED` e `INVALID_REQUEST`, para que um comando bloqueado não seja relatado como uma execução verde.
- Execuções isoladas de cron também tratam falhas de agente no nível da execução como erros de tarefa mesmo quando nenhum payload de resposta é produzido, para que falhas de modelo/provedor incrementem contadores de erro e acionem notificações de falha, em vez de limpar a tarefa como bem-sucedida.
- Quando uma tarefa isolada de turno de agente atinge `timeoutSeconds`, o cron aborta a execução de agente subjacente e concede uma janela curta de limpeza. Se a execução não esvaziar, a limpeza pertencente ao Gateway força a limpeza da propriedade da sessão dessa execução antes que o cron registre o timeout, para que trabalho de chat enfileirado não fique preso atrás de uma sessão de processamento obsoleta.
- Se um turno de agente isolado travar antes do executor iniciar ou antes da primeira chamada de modelo, o cron registra um timeout específico de fase, como `setup timed out before runner start` ou `stalled before first model call (last phase: context-engine)`. Esses watchdogs cobrem provedores incorporados e provedores baseados em CLI antes que o processo de CLI externo seja realmente iniciado, e são limitados independentemente de valores longos de `timeoutSeconds`, para que falhas de inicialização a frio/autenticação/contexto apareçam rapidamente em vez de esperar pelo orçamento completo da tarefa.

<a id="maintenance"></a>

<Note>
A reconciliação de tarefas para cron pertence primeiro ao runtime e, em segundo lugar, é apoiada por histórico durável: uma tarefa de cron ativa permanece ativa enquanto o runtime do cron ainda rastreia essa tarefa como em execução, mesmo que uma linha antiga de sessão filha ainda exista. Depois que o runtime deixa de possuir a tarefa e a janela de tolerância de 5 minutos expira, verificações de manutenção consultam logs de execução persistidos e o estado da tarefa para a execução `cron:<jobId>:<startedAt>` correspondente. Se esse histórico durável mostra um resultado terminal, o ledger de tarefas é finalizado a partir dele; caso contrário, a manutenção pertencente ao Gateway pode marcar a tarefa como `lost`. A auditoria offline da CLI pode recuperar a partir do histórico durável, mas não trata seu próprio conjunto vazio de tarefas ativas em processo como prova de que uma execução de cron pertencente ao Gateway desapareceu.
</Note>

## Tipos de agendamento

| Tipo    | Flag da CLI | Descrição                                               |
| ------- | ----------- | ------------------------------------------------------- |
| `at`    | `--at`      | Timestamp único (ISO 8601 ou relativo, como `20m`)      |
| `every` | `--every`   | Intervalo fixo                                          |
| `cron`  | `--cron`    | Expressão cron de 5 ou 6 campos com `--tz` opcional     |

Timestamps sem fuso horário são tratados como UTC. Adicione `--tz America/New_York` para agendamento por horário local de relógio.

Expressões recorrentes no início da hora são automaticamente escalonadas por até 5 minutos para reduzir picos de carga. Use `--exact` para forçar temporização precisa ou `--stagger 30s` para uma janela explícita.

### Dia do mês e dia da semana usam lógica OR

Expressões cron são analisadas por [croner](https://github.com/Hexagon/croner). Quando os campos de dia do mês e dia da semana não são curingas, o croner corresponde quando **qualquer um** dos campos corresponde — não ambos. Esse é o comportamento padrão do cron Vixie.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Isso dispara cerca de 5–6 vezes por mês em vez de 0–1 vez por mês. O OpenClaw usa aqui o comportamento OR padrão do Croner. Para exigir ambas as condições, use o modificador de dia da semana `+` do Croner (`0 9 15 * +1`) ou agende em um campo e proteja o outro no prompt ou comando da sua tarefa.

## Estilos de execução

| Estilo          | Valor de `--session` | Executa em              | Melhor para                                |
| --------------- | -------------------- | ----------------------- | ------------------------------------------ |
| Sessão principal | `main`              | Próximo turno de Heartbeat | Lembretes, eventos de sistema           |
| Isolado         | `isolated`           | `cron:<jobId>` dedicado | Relatórios, tarefas em segundo plano       |
| Sessão atual    | `current`            | Vinculada no momento da criação | Trabalho recorrente sensível ao contexto |
| Sessão customizada | `session:custom-id` | Sessão nomeada persistente | Workflows que se baseiam no histórico |

<AccordionGroup>
  <Accordion title="Sessão principal vs isolada vs customizada">
    Tarefas da **sessão principal** enfileiram um evento de sistema e, opcionalmente, despertam o Heartbeat (`--wake now` ou `--wake next-heartbeat`). Esses eventos de sistema não estendem a atualização de reset diário/ocioso da sessão de destino. Tarefas **isoladas** executam um turno de agente dedicado com uma sessão nova. **Sessões customizadas** (`session:xxx`) persistem contexto entre execuções, habilitando workflows como standups diários que se baseiam em resumos anteriores.
  </Accordion>
  <Accordion title="O que 'sessão nova' significa para tarefas isoladas">
    Para tarefas isoladas, "sessão nova" significa um novo id de transcrição/sessão para cada execução. O OpenClaw pode carregar preferências seguras, como configurações de thinking/fast/verbose, rótulos e substituições explícitas de modelo/autenticação selecionadas pelo usuário, mas não herda contexto ambiente de conversa de uma linha de cron mais antiga: roteamento de canal/grupo, política de envio ou fila, elevação, origem ou associação de runtime ACP. Use `current` ou `session:<id>` quando uma tarefa recorrente deve deliberadamente se basear no mesmo contexto de conversa.
  </Accordion>
  <Accordion title="Limpeza de runtime">
    Para tarefas isoladas, o encerramento de runtime agora inclui limpeza de navegador de melhor esforço para essa sessão de cron. Falhas de limpeza são ignoradas para que o resultado real do cron ainda prevaleça.

    Execuções isoladas de cron também descartam quaisquer instâncias de runtime MCP empacotadas criadas para a tarefa por meio do caminho compartilhado de limpeza de runtime. Isso corresponde à forma como clientes MCP de sessão principal e sessão customizada são encerrados, então tarefas isoladas de cron não vazam processos filhos stdio nem conexões MCP de longa duração entre execuções.

  </Accordion>
  <Accordion title="Entrega por subagente e Discord">
    Quando execuções isoladas de cron orquestram subagentes, a entrega também prefere a saída final descendente em vez de texto provisório obsoleto do pai. Se descendentes ainda estiverem em execução, o OpenClaw suprime essa atualização parcial do pai em vez de anunciá-la.

    Para destinos de anúncio Discord somente texto, o OpenClaw envia o texto final canônico do assistente uma vez, em vez de reproduzir tanto payloads de texto transmitidos/intermediários quanto a resposta final. Payloads de mídia e Discord estruturados ainda são entregues como payloads separados para que anexos e componentes não sejam descartados.

  </Accordion>
</AccordionGroup>

### Opções de payload para tarefas isoladas

<ParamField path="--message" type="string" required>
  Texto do prompt (obrigatório para isolado).
</ParamField>
<ParamField path="--model" type="string">
  Substituição de modelo; usa o modelo permitido selecionado para a tarefa.
</ParamField>
<ParamField path="--thinking" type="string">
  Substituição de nível de thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Ignorar a injeção de arquivo de bootstrap do workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Restringe quais ferramentas a tarefa pode usar, por exemplo `--tools exec,read`.
</ParamField>

`--model` usa o modelo permitido selecionado como modelo primário dessa tarefa. Não é o mesmo que uma substituição `/model` de sessão de chat: cadeias de fallback configuradas ainda se aplicam quando o primário da tarefa falha. Se o modelo solicitado não for permitido ou não puder ser resolvido, o cron falha a execução com um erro de validação explícito, em vez de recorrer silenciosamente à seleção de modelo de agente/padrão da tarefa.

Tarefas de cron também podem carregar `fallbacks` no nível do payload. Quando presente, essa lista substitui a cadeia de fallback configurada para a tarefa. Use `fallbacks: []` no payload/API da tarefa quando quiser uma execução de cron estrita que tenta apenas o modelo selecionado. Se uma tarefa tiver `--model`, mas não tiver fallbacks nem no payload nem configurados, o OpenClaw passa uma substituição explícita de fallback vazia para que o primário do agente não seja anexado como um destino oculto de nova tentativa.

A precedência de seleção de modelo para tarefas isoladas é:

1. Substituição de modelo do hook Gmail (quando a execução veio do Gmail e essa substituição é permitida)
2. `model` no payload por tarefa
3. Substituição de modelo armazenada da sessão de cron selecionada pelo usuário
4. Seleção de modelo de agente/padrão

O modo rápido também segue a seleção ao vivo resolvida. Se a configuração do modelo selecionado tiver `params.fastMode`, o cron isolado usa isso por padrão. Uma substituição `fastMode` de sessão armazenada ainda prevalece sobre a configuração em qualquer direção.

Se uma execução isolada atingir uma transferência de troca de modelo ao vivo, o cron tenta novamente com o provedor/modelo trocado e persiste essa seleção ao vivo para a execução ativa antes de tentar novamente. Quando a troca também carrega um novo perfil de autenticação, o cron também persiste essa substituição de perfil de autenticação para a execução ativa. As novas tentativas são limitadas: após a tentativa inicial mais 2 novas tentativas de troca, o cron aborta em vez de entrar em loop para sempre.

Antes de uma execução de Cron isolada entrar no executor do agente, o OpenClaw verifica endpoints locais de provedores alcançáveis para provedores configurados com `api: "ollama"` e `api: "openai-completions"` cujo `baseUrl` seja loopback, rede privada ou `.local`. Se esse endpoint estiver fora do ar, a execução será registrada como `skipped` com um erro claro de provedor/modelo, em vez de iniciar uma chamada de modelo. O resultado do endpoint fica em cache por 5 minutos, então muitos trabalhos vencidos que usam o mesmo servidor local Ollama, vLLM, SGLang ou LM Studio inativo compartilham uma pequena sondagem em vez de criar uma tempestade de requisições. Execuções ignoradas por preflight de provedor não incrementam o backoff de erro de execução; habilite `failureAlert.includeSkipped` quando quiser notificações repetidas de pulos.

## Entrega e saída

| Modo       | O que acontece                                                     |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Entrega o texto final ao destino por fallback se o agente não enviou |
| `webhook`  | Envia por POST o payload de evento concluído para uma URL          |
| `none`     | Sem entrega de fallback do executor                                |

Use `--announce --channel telegram --to "-1001234567890"` para entrega em canal. Para tópicos de fórum do Telegram, use `-1001234567890:topic:123`; chamadores diretos de RPC/config também podem passar `delivery.threadId` como string ou número. Destinos do Slack/Discord/Mattermost devem usar prefixos explícitos (`channel:<id>`, `user:<id>`). IDs de salas do Matrix diferenciam maiúsculas de minúsculas; use o ID exato da sala ou o formato `room:!room:server` do Matrix.

Quando a entrega de anúncio usa `channel: "last"` ou omite `channel`, um destino com prefixo de provedor, como `telegram:123`, pode selecionar o canal antes que o Cron recorra ao histórico da sessão ou a um único canal configurado. Apenas prefixos anunciados pelo Plugin carregado são seletores de provedor. Se `delivery.channel` for explícito, o prefixo do destino deve nomear o mesmo provedor; por exemplo, `channel: "whatsapp"` com `to: "telegram:123"` é rejeitado em vez de permitir que o WhatsApp interprete o ID do Telegram como um número de telefone. Prefixos de tipo de destino e serviço, como `channel:<id>`, `user:<id>`, `imessage:<handle>` e `sms:<number>`, continuam sendo sintaxe de destino pertencente ao canal, não seletores de provedor.

Para trabalhos isolados, a entrega por chat é compartilhada. Se uma rota de chat estiver disponível, o agente poderá usar a ferramenta `message` mesmo quando o trabalho usa `--no-deliver`. Se o agente enviar para o destino configurado/atual, o OpenClaw pula o anúncio de fallback. Caso contrário, `announce`, `webhook` e `none` controlam apenas o que o executor faz com a resposta final após o turno do agente.

Quando um agente cria um lembrete isolado a partir de um chat ativo, o OpenClaw armazena o destino de entrega ao vivo preservado para a rota de anúncio de fallback. Chaves internas de sessão podem estar em minúsculas; destinos de entrega de provedor não são reconstruídos a partir dessas chaves quando o contexto de chat atual está disponível.

A entrega de anúncio implícita usa allowlists de canais configuradas para validar e redirecionar destinos obsoletos. Aprovações do armazenamento de pareamento de DMs não são destinatários de automação de fallback; defina `delivery.to` ou configure a entrada `allowFrom` do canal quando um trabalho agendado deve enviar proativamente para uma DM.

Notificações de falha seguem um caminho de destino separado:

- `cron.failureDestination` define um padrão global para notificações de falha.
- `job.delivery.failureDestination` substitui isso por trabalho.
- Se nenhum dos dois estiver definido e o trabalho já entregar via `announce`, as notificações de falha agora recorrem a esse destino de anúncio primário.
- `delivery.failureDestination` só é compatível com trabalhos `sessionTarget="isolated"`, a menos que o modo de entrega primário seja `webhook`.
- `failureAlert.includeSkipped: true` inclui um trabalho ou política global de alerta de Cron em alertas repetidos de execuções ignoradas. Execuções ignoradas mantêm um contador separado de pulos consecutivos, então elas não afetam o backoff de erro de execução.

## Exemplos de CLI

<Tabs>
  <Tab title="One-shot reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Recurring isolated job">
    ```bash
    openclaw cron add \
      --name "Morning brief" \
      --cron "0 7 * * *" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Summarize overnight updates." \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Model and thinking override">
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
</Tabs>

## Webhooks

O Gateway pode expor endpoints HTTP de Webhook para gatilhos externos. Habilite na configuração:

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

Cada requisição deve incluir o token do hook via cabeçalho:

- `Authorization: Bearer <token>` (recomendado)
- `x-openclaw-token: <token>`

Tokens em query string são rejeitados.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Enfileire um evento de sistema para a sessão principal:

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
    Execute um turno de agente isolado:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Campos: `message` (obrigatório), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Nomes de hooks personalizados são resolvidos via `hooks.mappings` na configuração. Mapeamentos podem transformar payloads arbitrários em ações `wake` ou `agent` com templates ou transformações de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantenha endpoints de hooks atrás de loopback, tailnet ou proxy reverso confiável.

- Use um token de hook dedicado; não reutilize tokens de autenticação do Gateway.
- Mantenha `hooks.path` em um subcaminho dedicado; `/` é rejeitado.
- Defina `hooks.allowedAgentIds` para limitar o roteamento explícito por `agentId`.
- Mantenha `hooks.allowRequestSessionKey=false`, a menos que você precise de sessões selecionadas pelo chamador.
- Se você habilitar `hooks.allowRequestSessionKey`, também defina `hooks.allowedSessionKeyPrefixes` para restringir os formatos permitidos de chave de sessão.
- Payloads de hooks são envolvidos por limites de segurança por padrão.

</Warning>

## Integração com Gmail PubSub

Conecte gatilhos da caixa de entrada do Gmail ao OpenClaw via Google PubSub.

<Note>
**Pré-requisitos:** CLI `gcloud`, `gog` (gogcli), hooks do OpenClaw habilitados, Tailscale para o endpoint HTTPS público.
</Note>

### Configuração pelo assistente (recomendado)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Isso grava a configuração `hooks.gmail`, habilita o preset do Gmail e usa o Tailscale Funnel para o endpoint push.

### Inicialização automática do Gateway

Quando `hooks.enabled=true` e `hooks.gmail.account` está definido, o Gateway inicia `gog gmail watch serve` na inicialização e renova automaticamente o watch. Defina `OPENCLAW_SKIP_GMAIL_WATCHER=1` para optar por não usar isso.

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

## Gerenciamento de trabalhos

```bash
# List all jobs
openclaw cron list

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
Observação sobre substituição de modelo:

- `openclaw cron add|edit --model ...` altera o modelo selecionado do trabalho.
- Se o modelo for permitido, esse provedor/modelo exato chega à execução isolada do agente.
- Se ele não for permitido ou não puder ser resolvido, o Cron falha a execução com um erro de validação explícito.
- Cadeias de fallback configuradas ainda se aplicam porque `--model` do Cron é um primário do trabalho, não uma substituição de `/model` da sessão.
- O payload `fallbacks` substitui os fallbacks configurados para esse trabalho; `fallbacks: []` desabilita fallback e torna a execução estrita.
- Um `--model` simples sem lista de fallback explícita ou configurada não recai para o primário do agente como um destino extra silencioso de nova tentativa.

</Note>

## Configuração

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
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

`maxConcurrentRuns` limita tanto o despacho de Cron agendado quanto a execução de turnos isolados de agente. Turnos de agente de Cron isolados usam internamente a faixa de execução dedicada `cron-nested` da fila, então aumentar esse valor permite que execuções LLM de Cron independentes avancem em paralelo em vez de apenas iniciar seus wrappers externos de Cron. A faixa `nested` compartilhada que não é do Cron não é ampliada por esta configuração.

O sidecar de estado de runtime é derivado de `cron.store`: um armazenamento `.json`, como `~/clawd/cron/jobs.json`, usa `~/clawd/cron/jobs-state.json`, enquanto um caminho de armazenamento sem sufixo `.json` acrescenta `-state.json`.

Se você editar `jobs.json` manualmente, deixe `jobs-state.json` fora do controle de versão. O OpenClaw usa esse sidecar para slots pendentes, marcadores ativos, metadados da última execução e a identidade do agendamento que informa ao agendador quando um trabalho editado externamente precisa de um novo `nextRunAtMs`.

Desabilite o Cron: `cron.enabled: false` ou `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Nova tentativa de execução única**: erros transitórios (limite de taxa, sobrecarga, rede, erro de servidor) tentam novamente até 3 vezes com backoff exponencial. Erros permanentes desabilitam imediatamente.

    **Nova tentativa recorrente**: backoff exponencial (30s a 60m) entre tentativas. O backoff é redefinido após a próxima execução bem-sucedida.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (padrão `24h`) remove entradas de sessão de execução isolada. `cron.runLog.maxBytes` / `cron.runLog.keepLines` removem automaticamente arquivos de log de execução.
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
  <Accordion title="Cron não dispara">
    - Verifique `cron.enabled` e a variável de ambiente `OPENCLAW_SKIP_CRON`.
    - Confirme que o Gateway está em execução continuamente.
    - Para agendamentos `cron`, verifique o fuso horário (`--tz`) em relação ao fuso horário do host.
    - `reason: not-due` na saída de execução significa que a execução manual foi verificada com `openclaw cron run <jobId> --due` e a tarefa ainda não estava vencida.

  </Accordion>
  <Accordion title="Cron disparou, mas não houve entrega">
    - O modo de entrega `none` significa que nenhum envio de fallback pelo runner é esperado. O agente ainda pode enviar diretamente com a ferramenta `message` quando uma rota de chat está disponível.
    - Destino de entrega ausente/inválido (`channel`/`to`) significa que a saída foi ignorada.
    - Para Matrix, tarefas copiadas ou legadas com IDs de sala `delivery.to` em minúsculas podem falhar porque IDs de sala do Matrix diferenciam maiúsculas de minúsculas. Edite a tarefa para o valor exato `!room:server` ou `room:!room:server` do Matrix.
    - Erros de autenticação de canal (`unauthorized`, `Forbidden`) significam que a entrega foi bloqueada pelas credenciais.
    - Se a execução isolada retornar apenas o token silencioso (`NO_REPLY` / `no_reply`), o OpenClaw suprime a entrega de saída direta e também suprime o caminho de resumo enfileirado de fallback, então nada é publicado de volta no chat.
    - Se o agente deve enviar uma mensagem ao usuário por conta própria, verifique se a tarefa tem uma rota utilizável (`channel: "last"` com um chat anterior ou um canal/destino explícito).

  </Accordion>
  <Accordion title="Cron ou Heartbeat parece impedir a rolagem /new-style">
    - A atualização diária e por ociosidade não se baseia em `updatedAt`; consulte [Gerenciamento de sessões](/pt-BR/concepts/session#session-lifecycle).
    - Despertares do Cron, execuções do Heartbeat, notificações de execução e manutenção contábil do Gateway podem atualizar a linha da sessão para roteamento/status, mas não estendem `sessionStartedAt` nem `lastInteractionAt`.
    - Para linhas legadas criadas antes desses campos existirem, o OpenClaw pode recuperar `sessionStartedAt` do cabeçalho de sessão JSONL da transcrição quando o arquivo ainda está disponível. Linhas ociosas legadas sem `lastInteractionAt` usam esse horário de início recuperado como base de ociosidade.

  </Accordion>
  <Accordion title="Pegadinhas de fuso horário">
    - Cron sem `--tz` usa o fuso horário do host do gateway.
    - Agendamentos `at` sem fuso horário são tratados como UTC.
    - `activeHours` do Heartbeat usa a resolução de fuso horário configurada.

  </Accordion>
</AccordionGroup>

## Relacionados

- [Automação e tarefas](/pt-BR/automation) — todos os mecanismos de automação em resumo
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — registro de tarefas para execuções de cron
- [Heartbeat](/pt-BR/gateway/heartbeat) — turnos periódicos da sessão principal
- [Fuso horário](/pt-BR/concepts/timezone) — configuração de fuso horário
