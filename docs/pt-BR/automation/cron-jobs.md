---
read_when:
    - Agendamento de tarefas em segundo plano ou reativações
    - Conectando gatilhos externos (webhooks, Gmail) ao OpenClaw
    - Decidindo entre Heartbeat e Cron para tarefas agendadas
sidebarTitle: Scheduled tasks
summary: Tarefas agendadas, webhooks e gatilhos do Gmail PubSub para o agendador do Gateway
title: Tarefas agendadas
x-i18n:
    generated_at: "2026-05-06T17:52:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron é o agendador integrado do Gateway. Ele persiste trabalhos, desperta o agente no momento certo e pode entregar a saída de volta para um canal de chat ou endpoint de Webhook.

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
  <Step title="Verificar seus trabalhos">
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

## Como o Cron funciona

- O Cron é executado **dentro do processo do Gateway** (não dentro do modelo).
- As definições de trabalhos persistem em `~/.openclaw/cron/jobs.json`, para que reinicializações não percam agendamentos.
- O estado de execução em runtime persiste ao lado dele em `~/.openclaw/cron/jobs-state.json`. Se você rastrear definições de Cron no git, rastreie `jobs.json` e adicione `jobs-state.json` ao gitignore.
- Após a separação, versões mais antigas do OpenClaw podem ler `jobs.json`, mas podem tratar os trabalhos como novos porque os campos de runtime agora ficam em `jobs-state.json`.
- Quando `jobs.json` é editado enquanto o Gateway está em execução ou parado, o OpenClaw compara os campos de agendamento alterados com os metadados de slot de runtime pendente e limpa valores `nextRunAtMs` obsoletos. Regravações apenas de formatação ou apenas de ordem de chaves preservam o slot pendente.
- Todas as execuções de Cron criam registros de [tarefa em segundo plano](/pt-BR/automation/tasks).
- Na inicialização do Gateway, trabalhos de turno de agente isolados em atraso são reagendados para fora da janela de conexão do canal em vez de serem reproduzidos imediatamente, para que a inicialização do Discord/Telegram e a configuração de comandos nativos permaneçam responsivas após reinicializações.
- Trabalhos únicos (`--at`) são excluídos automaticamente após sucesso por padrão.
- Execuções isoladas de Cron fecham, em melhor esforço, abas/processos de navegador rastreados para sua sessão `cron:<jobId>` quando a execução é concluída, para que automações de navegador destacadas não deixem processos órfãos para trás.
- Execuções isoladas de Cron que recebem a concessão restrita de autolimpeza de Cron ainda podem ler o status do agendador e uma lista autofiltrada de seu trabalho atual, para que verificações de status/Heartbeat possam inspecionar seu próprio agendamento sem obter acesso mais amplo de mutação de Cron.
- Execuções isoladas de Cron também se protegem contra respostas de confirmação obsoletas. Se o primeiro resultado for apenas uma atualização de status intermediária (`on it`, `pulling everything together` e indicações semelhantes) e nenhuma execução de subagente descendente ainda for responsável pela resposta final, o OpenClaw solicita novamente uma vez o resultado real antes da entrega.
- Execuções isoladas de Cron preferem metadados estruturados de negação de execução da execução incorporada e depois recorrem a marcadores conhecidos de resumo/saída final, como `SYSTEM_RUN_DENIED` e `INVALID_REQUEST`, para que um comando bloqueado não seja relatado como uma execução verde.
- Execuções isoladas de Cron também tratam falhas de agente em nível de execução como erros de trabalho mesmo quando nenhum payload de resposta é produzido, para que falhas de modelo/provedor incrementem contadores de erro e disparem notificações de falha em vez de limpar o trabalho como bem-sucedido.
- Quando um trabalho isolado de turno de agente atinge `timeoutSeconds`, o Cron aborta a execução subjacente do agente e concede a ela uma breve janela de limpeza. Se a execução não drenar, a limpeza de propriedade do Gateway limpa à força a propriedade de sessão dessa execução antes que o Cron registre o timeout, para que trabalho de chat enfileirado não fique preso atrás de uma sessão de processamento obsoleta.

<a id="maintenance"></a>

<Note>
A reconciliação de tarefas para Cron é primeiro de propriedade do runtime e, em segundo lugar, apoiada por histórico durável: uma tarefa ativa de Cron permanece ativa enquanto o runtime do Cron ainda rastreia esse trabalho como em execução, mesmo se uma linha antiga de sessão filha ainda existir. Assim que o runtime deixa de possuir o trabalho e a janela de tolerância de 5 minutos expira, verificações de manutenção consultam logs de execução persistidos e o estado do trabalho para a execução `cron:<jobId>:<startedAt>` correspondente. Se esse histórico durável mostrar um resultado terminal, o livro-razão de tarefas é finalizado a partir dele; caso contrário, a manutenção de propriedade do Gateway pode marcar a tarefa como `lost`. A auditoria offline da CLI pode se recuperar a partir do histórico durável, mas não trata seu próprio conjunto vazio de trabalhos ativos em processo como prova de que uma execução de Cron de propriedade do Gateway desapareceu.
</Note>

## Tipos de agendamento

| Tipo    | Flag da CLI | Descrição                                               |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Timestamp único (ISO 8601 ou relativo como `20m`)       |
| `every` | `--every` | Intervalo fixo                                          |
| `cron`  | `--cron`  | Expressão Cron de 5 ou 6 campos com `--tz` opcional     |

Timestamps sem fuso horário são tratados como UTC. Adicione `--tz America/New_York` para agendamento por relógio local.

Expressões recorrentes de início de hora são automaticamente escalonadas em até 5 minutos para reduzir picos de carga. Use `--exact` para forçar o tempo preciso ou `--stagger 30s` para uma janela explícita.

### Dia do mês e dia da semana usam lógica OR

Expressões de Cron são analisadas por [croner](https://github.com/Hexagon/croner). Quando os campos de dia do mês e dia da semana são ambos não curinga, o croner corresponde quando **qualquer um** dos campos corresponde, não ambos. Esse é o comportamento padrão do Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Isso dispara cerca de 5 a 6 vezes por mês em vez de 0 a 1 vez por mês. O OpenClaw usa aqui o comportamento OR padrão do Croner. Para exigir ambas as condições, use o modificador de dia da semana `+` do Croner (`0 9 15 * +1`) ou agende em um campo e proteja o outro no prompt ou comando do seu trabalho.

## Estilos de execução

| Estilo         | Valor de `--session` | Executa em               | Melhor para                              |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Sessão principal | `main`              | Próximo turno de Heartbeat | Lembretes, eventos do sistema          |
| Isolado        | `isolated`          | `cron:<jobId>` dedicado  | Relatórios, tarefas de segundo plano    |
| Sessão atual   | `current`           | Vinculada no momento da criação | Trabalho recorrente com consciência de contexto |
| Sessão personalizada | `session:custom-id` | Sessão nomeada persistente | Workflows que constroem sobre histórico |

<AccordionGroup>
  <Accordion title="Sessão principal vs isolada vs personalizada">
    Trabalhos de **sessão principal** enfileiram um evento do sistema e, opcionalmente, despertam o Heartbeat (`--wake now` ou `--wake next-heartbeat`). Esses eventos do sistema não estendem a validade de redefinição diária/ociosa da sessão de destino. Trabalhos **isolados** executam um turno de agente dedicado com uma sessão nova. **Sessões personalizadas** (`session:xxx`) persistem contexto entre execuções, habilitando workflows como reuniões diárias que se baseiam em resumos anteriores.
  </Accordion>
  <Accordion title="O que 'sessão nova' significa para trabalhos isolados">
    Para trabalhos isolados, "sessão nova" significa um novo id de transcrição/sessão para cada execução. O OpenClaw pode carregar preferências seguras, como configurações de thinking/fast/verbose, rótulos e substituições explícitas de modelo/autenticação selecionadas pelo usuário, mas não herda contexto de conversa ambiente de uma linha antiga de Cron: roteamento de canal/grupo, política de envio ou fila, elevação, origem ou vínculo de runtime ACP. Use `current` ou `session:<id>` quando um trabalho recorrente deve deliberadamente construir sobre o mesmo contexto de conversa.
  </Accordion>
  <Accordion title="Limpeza de runtime">
    Para trabalhos isolados, o encerramento de runtime agora inclui limpeza de navegador em melhor esforço para essa sessão de Cron. Falhas de limpeza são ignoradas para que o resultado real do Cron ainda prevaleça.

    Execuções isoladas de Cron também descartam quaisquer instâncias de runtime MCP empacotadas criadas para o trabalho pelo caminho compartilhado de limpeza de runtime. Isso corresponde à forma como clientes MCP de sessão principal e sessão personalizada são encerrados, para que trabalhos isolados de Cron não vazem processos filhos stdio ou conexões MCP de longa duração entre execuções.

  </Accordion>
  <Accordion title="Subagente e entrega no Discord">
    Quando execuções isoladas de Cron orquestram subagentes, a entrega também prefere a saída final do descendente em vez de texto intermediário obsoleto do pai. Se descendentes ainda estiverem em execução, o OpenClaw suprime essa atualização parcial do pai em vez de anunciá-la.

    Para destinos de anúncio do Discord somente texto, o OpenClaw envia o texto final canônico do assistente uma vez em vez de reproduzir tanto payloads de texto transmitido/intermediário quanto a resposta final. Mídia e payloads estruturados do Discord ainda são entregues como payloads separados para que anexos e componentes não sejam descartados.

  </Accordion>
</AccordionGroup>

### Opções de payload para trabalhos isolados

<ParamField path="--message" type="string" required>
  Texto do prompt (obrigatório para isolado).
</ParamField>
<ParamField path="--model" type="string">
  Substituição de modelo; usa o modelo permitido selecionado para o trabalho.
</ParamField>
<ParamField path="--thinking" type="string">
  Substituição de nível de thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Ignora a injeção de arquivo de bootstrap do workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Restringe quais ferramentas o trabalho pode usar, por exemplo `--tools exec,read`.
</ParamField>

`--model` usa o modelo permitido selecionado como modelo primário desse trabalho. Não é o mesmo que uma substituição `/model` de sessão de chat: cadeias de fallback configuradas ainda se aplicam quando o primário do trabalho falha. Se o modelo solicitado não for permitido ou não puder ser resolvido, o Cron falha a execução com um erro de validação explícito em vez de recorrer silenciosamente à seleção de modelo do agente/padrão do trabalho.

Trabalhos de Cron também podem carregar `fallbacks` em nível de payload. Quando presente, essa lista substitui a cadeia de fallback configurada para o trabalho. Use `fallbacks: []` no payload/API do trabalho quando quiser uma execução estrita de Cron que tente apenas o modelo selecionado. Se um trabalho tiver `--model`, mas não tiver fallbacks de payload nem configurados, o OpenClaw passa uma substituição de fallback vazia explícita para que o primário do agente não seja anexado como um destino de nova tentativa extra oculto.

A precedência de seleção de modelo para trabalhos isolados é:

1. Substituição de modelo do hook do Gmail (quando a execução veio do Gmail e essa substituição é permitida)
2. `model` do payload por trabalho
3. Substituição de modelo armazenada da sessão de Cron selecionada pelo usuário
4. Seleção de modelo do agente/padrão

O modo fast também segue a seleção ativa resolvida. Se a configuração do modelo selecionado tiver `params.fastMode`, o Cron isolado usa isso por padrão. Uma substituição `fastMode` de sessão armazenada ainda prevalece sobre a configuração em qualquer direção.

Se uma execução isolada atinge um handoff de troca de modelo em tempo real, o Cron tenta novamente com o provedor/modelo trocado e persiste essa seleção ativa para a execução ativa antes de tentar novamente. Quando a troca também carrega um novo perfil de autenticação, o Cron também persiste essa substituição de perfil de autenticação para a execução ativa. As novas tentativas são limitadas: após a tentativa inicial mais 2 novas tentativas de troca, o Cron aborta em vez de entrar em loop para sempre.

Antes que uma execução isolada de Cron entre no executor de agente, o OpenClaw verifica endpoints de provedores locais alcançáveis para provedores configurados com `api: "ollama"` e `api: "openai-completions"` cujo `baseUrl` seja local loopback, rede privada ou `.local`. Se esse endpoint estiver inativo, a execução é registrada como `skipped` com um erro claro de provedor/modelo em vez de iniciar uma chamada de modelo. O resultado do endpoint é armazenado em cache por 5 minutos, para que muitos trabalhos vencidos usando o mesmo servidor local Ollama, vLLM, SGLang ou LM Studio inativo compartilhem uma pequena sondagem em vez de criar uma tempestade de requisições. Execuções ignoradas por pré-verificação de provedor não incrementam o backoff de erro de execução; habilite `failureAlert.includeSkipped` quando quiser notificações repetidas de salto.

## Entrega e saída

| Modo       | O que acontece                                                     |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Entrega de fallback do texto final ao destino se o agente não enviou |
| `webhook`  | POST do payload de evento concluído para uma URL                    |
| `none`     | Nenhuma entrega de fallback do executor                            |

Use `--announce --channel telegram --to "-1001234567890"` para entrega em canal. Para tópicos de fórum do Telegram, use `-1001234567890:topic:123`; chamadores diretos de RPC/configuração também podem passar `delivery.threadId` como string ou número. Destinos Slack/Discord/Mattermost devem usar prefixos explícitos (`channel:<id>`, `user:<id>`). IDs de salas do Matrix diferenciam maiúsculas de minúsculas; use o ID de sala exato ou o formato `room:!room:server` do Matrix.

Quando a entrega de anúncio usa `channel: "last"` ou omite `channel`, um destino com prefixo de provedor, como `telegram:123`, pode selecionar o canal antes que o Cron recorra ao histórico da sessão ou a um único canal configurado. Somente prefixos anunciados pelo Plugin carregado são seletores de provedor. Se `delivery.channel` for explícito, o prefixo do destino deve nomear o mesmo provedor; por exemplo, `channel: "whatsapp"` com `to: "telegram:123"` é rejeitado em vez de permitir que o WhatsApp interprete o ID do Telegram como um número de telefone. Prefixos de tipo de destino e serviço, como `channel:<id>`, `user:<id>`, `imessage:<handle>` e `sms:<number>`, continuam sendo sintaxe de destino controlada pelo canal, não seletores de provedor.

Para tarefas isoladas, a entrega por chat é compartilhada. Se uma rota de chat estiver disponível, o agente pode usar a ferramenta `message` mesmo quando a tarefa usa `--no-deliver`. Se o agente enviar para o destino configurado/atual, o OpenClaw ignora o anúncio de contingência. Caso contrário, `announce`, `webhook` e `none` controlam apenas o que o executor faz com a resposta final depois da rodada do agente.

Quando um agente cria um lembrete isolado a partir de um chat ativo, o OpenClaw armazena o destino de entrega ativo preservado para a rota de anúncio de contingência. Chaves internas de sessão podem estar em minúsculas; destinos de entrega do provedor não são reconstruídos a partir dessas chaves quando o contexto de chat atual está disponível.

A entrega de anúncio implícita usa listas de permissão de canais configuradas para validar e redirecionar destinos obsoletos. Aprovações do armazenamento de pareamento de DM não são destinatários de automação de contingência; defina `delivery.to` ou configure a entrada `allowFrom` do canal quando uma tarefa agendada deve enviar proativamente para uma DM.

Notificações de falha seguem um caminho de destino separado:

- `cron.failureDestination` define um padrão global para notificações de falha.
- `job.delivery.failureDestination` substitui isso por tarefa.
- Se nenhum dos dois estiver definido e a tarefa já entregar via `announce`, as notificações de falha agora recorrem a esse destino principal de anúncio.
- `delivery.failureDestination` só tem suporte em tarefas `sessionTarget="isolated"`, a menos que o modo de entrega principal seja `webhook`.
- `failureAlert.includeSkipped: true` inclui uma tarefa ou política global de alerta do Cron em alertas repetidos de execuções ignoradas. Execuções ignoradas mantêm um contador separado de pulos consecutivos, portanto não afetam a espera por erro de execução.

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

Toda solicitação deve incluir o token de hook via cabeçalho:

- `Authorization: Bearer <token>` (recomendado)
- `x-openclaw-token: <token>`

Tokens na string de consulta são rejeitados.

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
    Execute uma rodada isolada de agente:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Campos: `message` (obrigatório), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hooks mapeados (POST /hooks/<name>)">
    Nomes de hook personalizados são resolvidos via `hooks.mappings` na configuração. Mapeamentos podem transformar cargas úteis arbitrárias em ações `wake` ou `agent` com modelos ou transformações de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantenha endpoints de hook atrás de loopback, tailnet ou proxy reverso confiável.

- Use um token de hook dedicado; não reutilize tokens de autenticação do Gateway.
- Mantenha `hooks.path` em um subcaminho dedicado; `/` é rejeitado.
- Defina `hooks.allowedAgentIds` para limitar o roteamento explícito de `agentId`.
- Mantenha `hooks.allowRequestSessionKey=false`, a menos que você exija sessões selecionadas pelo chamador.
- Se você habilitar `hooks.allowRequestSessionKey`, também defina `hooks.allowedSessionKeyPrefixes` para restringir os formatos permitidos de chaves de sessão.
- Cargas úteis de hook são envolvidas com limites de segurança por padrão.

</Warning>

## Integração com Gmail PubSub

Conecte gatilhos da caixa de entrada do Gmail ao OpenClaw via Google PubSub.

<Note>
**Pré-requisitos:** CLI `gcloud`, `gog` (gogcli), hooks do OpenClaw habilitados, Tailscale para o endpoint HTTPS público.
</Note>

### Configuração por assistente (recomendado)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Isso grava a configuração `hooks.gmail`, habilita a predefinição do Gmail e usa o Tailscale Funnel para o endpoint de push.

### Inicialização automática do Gateway

Quando `hooks.enabled=true` e `hooks.gmail.account` está definido, o Gateway inicia `gog gmail watch serve` na inicialização e renova automaticamente o monitoramento. Defina `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desativar.

### Configuração manual única

<Steps>
  <Step title="Selecionar o projeto do GCP">
    Selecione o projeto do GCP que possui o cliente OAuth usado por `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Criar tópico e conceder acesso push do Gmail">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Iniciar o monitoramento">
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

## Gerenciando tarefas

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

- `openclaw cron add|edit --model ...` altera o modelo selecionado da tarefa.
- Se o modelo for permitido, esse provedor/modelo exato chega à execução isolada do agente.
- Se não for permitido ou não puder ser resolvido, o Cron faz a execução falhar com um erro de validação explícito.
- Cadeias de contingência configuradas ainda se aplicam porque `--model` do Cron é o primário da tarefa, não uma substituição de sessão `/model`.
- A carga útil `fallbacks` substitui as contingências configuradas para essa tarefa; `fallbacks: []` desabilita a contingência e torna a execução estrita.
- Um `--model` simples sem lista de contingência explícita ou configurada não recorre ao primário do agente como um alvo extra silencioso de nova tentativa.

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

`maxConcurrentRuns` limita tanto o despacho agendado do Cron quanto a execução isolada de rodadas de agente. Rodadas isoladas de agente do Cron usam internamente a faixa de execução dedicada `cron-nested` da fila, portanto aumentar esse valor permite que execuções independentes de LLM do Cron avancem em paralelo, em vez de apenas iniciar suas camadas externas do Cron. A faixa compartilhada não Cron `nested` não é ampliada por essa configuração.

O arquivo auxiliar de estado em tempo de execução é derivado de `cron.store`: um armazenamento `.json`, como `~/clawd/cron/jobs.json`, usa `~/clawd/cron/jobs-state.json`, enquanto um caminho de armazenamento sem sufixo `.json` acrescenta `-state.json`.

Se você editar `jobs.json` manualmente, deixe `jobs-state.json` fora do controle de versão. O OpenClaw usa esse arquivo auxiliar para vagas pendentes, marcadores ativos, metadados da última execução e a identidade da agenda que informa ao agendador quando uma tarefa editada externamente precisa de um `nextRunAtMs` novo.

Desabilite o Cron: `cron.enabled: false` ou `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportamento de nova tentativa">
    **Nova tentativa única**: erros transitórios (limite de taxa, sobrecarga, rede, erro de servidor) têm nova tentativa até 3 vezes com espera exponencial. Erros permanentes desabilitam imediatamente.

    **Nova tentativa recorrente**: espera exponencial (30s a 60m) entre novas tentativas. A espera é reiniciada após a próxima execução bem-sucedida.

  </Accordion>
  <Accordion title="Manutenção">
    `cron.sessionRetention` (padrão `24h`) remove entradas de sessão de execução isolada. `cron.runLog.maxBytes` / `cron.runLog.keepLines` remove automaticamente arquivos de log de execução.
  </Accordion>
</AccordionGroup>

## Solução de problemas

### Sequência de comandos

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
  <Accordion title="Cron não está disparando">
    - Verifique `cron.enabled` e a variável de ambiente `OPENCLAW_SKIP_CRON`.
    - Confirme que o Gateway está em execução continuamente.
    - Para agendamentos `cron`, verifique o fuso horário (`--tz`) em relação ao fuso horário do sistema anfitrião.
    - `reason: not-due` na saída da execução significa que a execução manual foi verificada com `openclaw cron run <jobId> --due` e a tarefa ainda não estava pronta para execução.

  </Accordion>
  <Accordion title="Cron disparou, mas não houve entrega">
    - O modo de entrega `none` significa que nenhum envio de fallback do executor é esperado. O agente ainda pode enviar diretamente com a ferramenta `message` quando uma rota de chat estiver disponível.
    - Destino de entrega ausente/inválido (`channel`/`to`) significa que a saída foi ignorada.
    - Para Matrix, tarefas copiadas ou legadas com IDs de sala `delivery.to` em minúsculas podem falhar porque IDs de sala do Matrix diferenciam maiúsculas de minúsculas. Edite a tarefa para o valor exato `!room:server` ou `room:!room:server` do Matrix.
    - Erros de autenticação do canal (`unauthorized`, `Forbidden`) significam que a entrega foi bloqueada por credenciais.
    - Se a execução isolada retornar apenas o token silencioso (`NO_REPLY` / `no_reply`), o OpenClaw suprime a entrega direta de saída e também suprime o caminho de resumo enfileirado de fallback, então nada é publicado de volta no chat.
    - Se o agente deve enviar mensagem ao usuário por conta própria, verifique se a tarefa tem uma rota utilizável (`channel: "last"` com um chat anterior, ou um canal/destino explícito).

  </Accordion>
  <Accordion title="Cron ou Heartbeat parece impedir a rotação /new-style">
    - A avaliação de frescor para redefinições diárias e por inatividade não se baseia em `updatedAt`; consulte [Gerenciamento de sessões](/pt-BR/concepts/session#session-lifecycle).
    - Despertares de Cron, execuções de Heartbeat, notificações de exec e registros administrativos do Gateway podem atualizar a linha da sessão para roteamento/status, mas não estendem `sessionStartedAt` nem `lastInteractionAt`.
    - Para linhas legadas criadas antes de esses campos existirem, o OpenClaw pode recuperar `sessionStartedAt` do cabeçalho de sessão JSONL da transcrição quando o arquivo ainda está disponível. Linhas legadas inativas sem `lastInteractionAt` usam esse horário inicial recuperado como sua linha de base de inatividade.

  </Accordion>
  <Accordion title="Pegadinhas de fuso horário">
    - Cron sem `--tz` usa o fuso horário do host do Gateway.
    - Agendamentos `at` sem fuso horário são tratados como UTC.
    - `activeHours` do Heartbeat usa a resolução de fuso horário configurada.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Automação e tarefas](/pt-BR/automation) — todos os mecanismos de automação em um relance
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — registro de tarefas para execuções de Cron
- [Heartbeat](/pt-BR/gateway/heartbeat) — turnos periódicos da sessão principal
- [Fuso horário](/pt-BR/concepts/timezone) — configuração de fuso horário
