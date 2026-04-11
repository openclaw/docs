---
read_when:
    - Agendamento de tarefas em segundo plano ou ativações
    - Integração de gatilhos externos (webhooks, Gmail) ao OpenClaw
    - Decisão entre heartbeat e cron para tarefas agendadas
summary: Tarefas agendadas, webhooks e gatilhos do Gmail PubSub para o agendador do Gateway
title: Tarefas agendadas
x-i18n:
    generated_at: "2026-04-11T02:44:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04d94baa152de17d78515f7d545f099fe4810363ab67e06b465e489737f54665
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Tarefas agendadas (Cron)

Cron é o agendador integrado do Gateway. Ele persiste tarefas, ativa o agente no momento certo e pode entregar a saída de volta para um canal de chat ou endpoint de webhook.

## Início rápido

```bash
# Add a one-shot reminder
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Check your jobs
openclaw cron list

# See run history
openclaw cron runs --id <job-id>
```

## Como o cron funciona

- O cron é executado **dentro do processo do Gateway** (não dentro do modelo).
- As tarefas persistem em `~/.openclaw/cron/jobs.json`, para que reinicializações não percam os agendamentos.
- Todas as execuções do cron criam registros de [tarefa em segundo plano](/pt-BR/automation/tasks).
- Tarefas de execução única (`--at`) são excluídas automaticamente após sucesso por padrão.
- Execuções isoladas do cron fecham, em regime best-effort, abas/processos de navegador rastreados para a sessão `cron:<jobId>` quando a execução é concluída, para que a automação de navegador destacada não deixe processos órfãos para trás.
- Execuções isoladas do cron também protegem contra respostas de confirmação obsoletas. Se o primeiro resultado for apenas uma atualização de status provisória (`on it`, `pulling everything together` e indicações semelhantes) e nenhuma execução descendente de subagente ainda for responsável pela resposta final, o OpenClaw faz um novo prompt uma vez para obter o resultado real antes da entrega.

<a id="maintenance"></a>

A reconciliação de tarefas para o cron é de propriedade do runtime: uma tarefa ativa de cron permanece ativa enquanto o runtime do cron ainda rastrear essa tarefa como em execução, mesmo que uma linha antiga de sessão filha ainda exista.
Quando o runtime deixa de ser responsável pela tarefa e a janela de tolerância de 5 minutos expira, a manutenção pode marcar a tarefa como `lost`.

## Tipos de agendamento

| Tipo    | Flag da CLI | Descrição                                                     |
| ------- | ----------- | ------------------------------------------------------------- |
| `at`    | `--at`      | Timestamp de execução única (ISO 8601 ou relativo como `20m`) |
| `every` | `--every`   | Intervalo fixo                                                |
| `cron`  | `--cron`    | Expressão cron de 5 ou 6 campos com `--tz` opcional          |

Timestamps sem fuso horário são tratados como UTC. Adicione `--tz America/New_York` para agendamento em horário local.

Expressões recorrentes no início da hora são automaticamente escalonadas em até 5 minutos para reduzir picos de carga. Use `--exact` para forçar temporização precisa ou `--stagger 30s` para uma janela explícita.

## Estilos de execução

| Estilo          | Valor de `--session` | Executa em               | Melhor para                    |
| --------------- | -------------------- | ------------------------ | ------------------------------ |
| Sessão principal | `main`              | Próximo turno de heartbeat | Lembretes, eventos do sistema |
| Isolado         | `isolated`           | `cron:<jobId>` dedicado  | Relatórios, tarefas em segundo plano |
| Sessão atual    | `current`            | Vinculada no momento da criação | Trabalho recorrente com contexto |
| Sessão personalizada | `session:custom-id` | Sessão nomeada persistente | Fluxos de trabalho que constroem sobre o histórico |

Tarefas da **sessão principal** enfileiram um evento do sistema e opcionalmente ativam o heartbeat (`--wake now` ou `--wake next-heartbeat`). Tarefas **isoladas** executam um turno dedicado do agente com uma sessão nova. **Sessões personalizadas** (`session:xxx`) persistem o contexto entre execuções, permitindo fluxos de trabalho como resumos diários que se baseiam em resumos anteriores.

Para tarefas isoladas, o encerramento do runtime agora inclui limpeza de navegador em regime best-effort para essa sessão de cron. Falhas de limpeza são ignoradas para que o resultado real do cron continue prevalecendo.

Quando execuções isoladas do cron orquestram subagentes, a entrega também prefere a saída final descendente em vez de texto provisório obsoleto do pai. Se os descendentes ainda estiverem em execução, o OpenClaw suprime essa atualização parcial do pai em vez de anunciá-la.

### Opções de payload para tarefas isoladas

- `--message`: texto do prompt (obrigatório para isolado)
- `--model` / `--thinking`: substituições de modelo e nível de raciocínio
- `--light-context`: pula a injeção de arquivos de bootstrap do workspace
- `--tools exec,read`: restringe quais ferramentas a tarefa pode usar

`--model` usa o modelo permitido selecionado para essa tarefa. Se o modelo solicitado não for permitido, o cron registra um aviso e volta para a seleção de modelo do agente/padrão da tarefa. Cadeias de fallback configuradas ainda se aplicam, mas uma substituição simples de modelo sem lista explícita de fallback por tarefa não acrescenta mais o modelo primário do agente como um destino extra oculto de nova tentativa.

A precedência de seleção de modelo para tarefas isoladas é:

1. Substituição de modelo do hook do Gmail (quando a execução veio do Gmail e essa substituição é permitida)
2. `model` do payload por tarefa
3. Substituição de modelo da sessão de cron armazenada
4. Seleção de modelo do agente/padrão

O modo rápido também segue a seleção ativa resolvida. Se a configuração do modelo selecionado tiver `params.fastMode`, o cron isolado usará isso por padrão. Uma substituição armazenada de `fastMode` da sessão ainda prevalece sobre a configuração em qualquer direção.

Se uma execução isolada atingir uma transferência ativa de troca de modelo, o cron tenta novamente com o provedor/modelo alterado e persiste essa seleção ativa antes de tentar novamente. Quando a troca também traz um novo perfil de autenticação, o cron persiste essa substituição de perfil de autenticação também. As novas tentativas são limitadas: após a tentativa inicial mais 2 novas tentativas de troca, o cron aborta em vez de entrar em loop infinito.

## Entrega e saída

| Modo      | O que acontece                                             |
| --------- | ---------------------------------------------------------- |
| `announce` | Entrega o resumo ao canal de destino (padrão para isolado) |
| `webhook`  | Faz POST do payload do evento concluído para uma URL       |
| `none`     | Apenas interno, sem entrega                                |

Use `--announce --channel telegram --to "-1001234567890"` para entrega em canal. Para tópicos de fórum do Telegram, use `-1001234567890:topic:123`. Destinos do Slack/Discord/Mattermost devem usar prefixos explícitos (`channel:<id>`, `user:<id>`).

Para tarefas isoladas de propriedade do cron, o executor é responsável pelo caminho final de entrega. O agente recebe um prompt para retornar um resumo em texto simples, e esse resumo é então enviado por `announce`, `webhook` ou mantido interno para `none`. `--no-deliver` não devolve a entrega ao agente; ele mantém a execução interna.

Se a tarefa original disser explicitamente para enviar mensagem a algum destinatário externo, o agente deve informar em sua saída quem/onde essa mensagem deve ir, em vez de tentar enviá-la diretamente.

As notificações de falha seguem um caminho de destino separado:

- `cron.failureDestination` define um padrão global para notificações de falha.
- `job.delivery.failureDestination` substitui isso por tarefa.
- Se nenhum dos dois estiver definido e a tarefa já fizer entrega por `announce`, as notificações de falha agora usam como fallback esse destino principal de anúncio.
- `delivery.failureDestination` é compatível apenas com tarefas `sessionTarget="isolated"`, a menos que o modo principal de entrega seja `webhook`.

## Exemplos de CLI

Lembrete de execução única (sessão principal):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

Tarefa isolada recorrente com entrega:

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

Tarefa isolada com substituição de modelo e raciocínio:

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

## Webhooks

O Gateway pode expor endpoints HTTP de webhook para gatilhos externos. Habilite na configuração:

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

Toda solicitação deve incluir o token do hook por cabeçalho:

- `Authorization: Bearer <token>` (recomendado)
- `x-openclaw-token: <token>`

Tokens na query string são rejeitados.

### POST /hooks/wake

Enfileira um evento do sistema para a sessão principal:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (obrigatório): descrição do evento
- `mode` (opcional): `now` (padrão) ou `next-heartbeat`

### POST /hooks/agent

Executa um turno isolado do agente:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Campos: `message` (obrigatório), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Hooks mapeados (POST /hooks/\<name\>)

Nomes de hook personalizados são resolvidos por `hooks.mappings` na configuração. Os mapeamentos podem transformar payloads arbitrários em ações `wake` ou `agent` com templates ou transformações em código.

### Segurança

- Mantenha os endpoints de hook atrás de loopback, tailnet ou proxy reverso confiável.
- Use um token dedicado para hooks; não reutilize tokens de autenticação do gateway.
- Mantenha `hooks.path` em um subcaminho dedicado; `/` é rejeitado.
- Defina `hooks.allowedAgentIds` para limitar o roteamento explícito por `agentId`.
- Mantenha `hooks.allowRequestSessionKey=false`, a menos que você precise de sessões selecionadas pelo chamador.
- Se você habilitar `hooks.allowRequestSessionKey`, também defina `hooks.allowedSessionKeyPrefixes` para restringir os formatos permitidos de chave de sessão.
- Os payloads de hook são encapsulados com limites de segurança por padrão.

## Integração com Gmail PubSub

Conecte gatilhos da caixa de entrada do Gmail ao OpenClaw via Google PubSub.

**Pré-requisitos**: CLI `gcloud`, `gog` (gogcli), hooks do OpenClaw habilitados, Tailscale para o endpoint HTTPS público.

### Configuração com assistente (recomendado)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Isso grava a configuração `hooks.gmail`, habilita o preset do Gmail e usa o Tailscale Funnel para o endpoint de push.

### Inicialização automática do Gateway

Quando `hooks.enabled=true` e `hooks.gmail.account` estiver definido, o Gateway inicia `gog gmail watch serve` na inicialização e renova automaticamente o watch. Defina `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desativar isso.

### Configuração manual única

1. Selecione o projeto do GCP que é dono do cliente OAuth usado por `gog`:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Crie o tópico e conceda ao Gmail acesso de push:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Inicie o watch:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

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

Observação sobre substituição de modelo:

- `openclaw cron add|edit --model ...` altera o modelo selecionado da tarefa.
- Se o modelo for permitido, exatamente esse provedor/modelo chega à execução isolada do agente.
- Se não for permitido, o cron emite um aviso e volta para a seleção de modelo do agente/padrão da tarefa.
- Cadeias de fallback configuradas ainda se aplicam, mas uma substituição simples com `--model` sem lista explícita de fallback por tarefa não recai mais para o primário do agente como um destino extra silencioso de nova tentativa.

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
    webhookToken: "substitua-por-um-token-dedicado-para-webhook",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

Desative o cron: `cron.enabled: false` ou `OPENCLAW_SKIP_CRON=1`.

**Nova tentativa para execução única**: erros transitórios (limite de taxa, sobrecarga, rede, erro de servidor) tentam novamente até 3 vezes com backoff exponencial. Erros permanentes desativam imediatamente.

**Nova tentativa recorrente**: backoff exponencial (30s a 60m) entre novas tentativas. O backoff é redefinido após a próxima execução bem-sucedida.

**Manutenção**: `cron.sessionRetention` (padrão `24h`) remove entradas de sessão de execuções isoladas. `cron.runLog.maxBytes` / `cron.runLog.keepLines` removem automaticamente arquivos de log de execução.

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

### O cron não dispara

- Verifique `cron.enabled` e a variável de ambiente `OPENCLAW_SKIP_CRON`.
- Confirme que o Gateway está em execução contínua.
- Para agendamentos `cron`, verifique o fuso horário (`--tz`) em relação ao fuso do host.
- `reason: not-due` na saída da execução significa que a execução manual foi verificada com `openclaw cron run <jobId> --due` e que a tarefa ainda não estava vencida.

### O cron disparou, mas não houve entrega

- Modo de entrega `none` significa que nenhuma mensagem externa é esperada.
- Destino de entrega ausente/inválido (`channel`/`to`) significa que a saída foi ignorada.
- Erros de autenticação do canal (`unauthorized`, `Forbidden`) significam que a entrega foi bloqueada pelas credenciais.
- Se a execução isolada retornar apenas o token silencioso (`NO_REPLY` / `no_reply`), o OpenClaw suprime a entrega de saída direta e também suprime o caminho de fallback de resumo enfileirado, portanto nada é publicado de volta no chat.
- Para tarefas isoladas de propriedade do cron, não espere que o agente use a ferramenta de mensagem como fallback. O executor é responsável pela entrega final; `--no-deliver` a mantém interna em vez de permitir um envio direto.

### Armadilhas com fuso horário

- Cron sem `--tz` usa o fuso horário do host do gateway.
- Agendamentos `at` sem fuso horário são tratados como UTC.
- `activeHours` do heartbeat usa a resolução de fuso horário configurada.

## Relacionado

- [Automação e tarefas](/pt-BR/automation) — visão geral de todos os mecanismos de automação
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — registro de tarefas para execuções do cron
- [Heartbeat](/pt-BR/gateway/heartbeat) — turnos periódicos da sessão principal
- [Fuso horário](/pt-BR/concepts/timezone) — configuração de fuso horário
