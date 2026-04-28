---
read_when:
    - Agendamento de tarefas em segundo plano ou ativações do sistema
    - Conectando gatilhos externos (webhooks, Gmail) ao OpenClaw
    - Decidindo entre Heartbeat e Cron para tarefas agendadas
sidebarTitle: Scheduled tasks
summary: Tarefas agendadas, webhooks e gatilhos do Gmail PubSub para o agendador do Gateway
title: Tarefas agendadas
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:23:01Z"
  model: gpt-5.4
  provider: openai
  source_hash: 41908a34ddec3359e414ff4fbca128cc30db53273ee96a6dd12026da950b95ec
  source_path: automation/cron-jobs.md
  workflow: 15
---

Cron é o agendador integrado do Gateway. Ele persiste tarefas, desperta o agente na hora certa e pode entregar a saída de volta para um canal de chat ou endpoint de Webhook.

## Início rápido

<Steps>
  <Step title="Adicionar um lembrete de execução única">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
      --session main \
      --system-event "Lembrete: verificar o rascunho da documentação do cron" \
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

- O cron é executado **dentro do processo do Gateway** (não dentro do modelo).
- As definições das tarefas persistem em `~/.openclaw/cron/jobs.json`, para que reinicializações não façam você perder os agendamentos.
- O estado de execução em tempo de execução persiste ao lado, em `~/.openclaw/cron/jobs-state.json`. Se você versiona definições de cron no git, versione `jobs.json` e adicione `jobs-state.json` ao gitignore.
- Após a separação, versões mais antigas do OpenClaw conseguem ler `jobs.json`, mas podem tratar as tarefas como novas, porque os campos de execução agora ficam em `jobs-state.json`.
- Todas as execuções de cron criam registros de [tarefas em segundo plano](/pt-BR/automation/tasks).
- Tarefas de execução única (`--at`) são removidas automaticamente após sucesso por padrão.
- Execuções isoladas de cron fazem um fechamento, em melhor esforço, de abas/processos de navegador rastreados para a sessão `cron:<jobId>` quando a execução termina, para que automações de navegador destacadas não deixem processos órfãos para trás.
- Execuções isoladas de cron também protegem contra respostas de confirmação obsoletas. Se o primeiro resultado for apenas uma atualização de status intermediária (`on it`, `pulling everything together` e dicas semelhantes) e nenhuma execução descendente de subagente ainda for responsável pela resposta final, o OpenClaw faz um novo prompt uma vez para obter o resultado real antes da entrega.

<a id="maintenance"></a>

<Note>
A reconciliação de tarefas para cron é primeiro de propriedade do runtime, e em segundo lugar respaldada por histórico durável: uma tarefa cron ativa permanece ativa enquanto o runtime do cron ainda rastrear aquela tarefa como em execução, mesmo que ainda exista uma linha antiga de sessão filha. Quando o runtime deixa de ser o proprietário da tarefa e a janela de tolerância de 5 minutos expira, verificações de manutenção consultam logs persistidos de execução e o estado da tarefa para a execução correspondente `cron:<jobId>:<startedAt>`. Se esse histórico durável mostrar um resultado terminal, o razão de tarefas será finalizado a partir dele; caso contrário, a manutenção de propriedade do Gateway pode marcar a tarefa como `lost`. A auditoria offline da CLI pode recuperar a partir do histórico durável, mas ela não trata seu próprio conjunto vazio de tarefas ativas em processo como prova de que uma execução cron de propriedade do Gateway desapareceu.
</Note>

## Tipos de agendamento

| Tipo    | Flag da CLI | Descrição                                                  |
| ------- | ----------- | ---------------------------------------------------------- |
| `at`    | `--at`      | Timestamp de execução única (ISO 8601 ou relativo como `20m`) |
| `every` | `--every`   | Intervalo fixo                                             |
| `cron`  | `--cron`    | Expressão cron de 5 ou 6 campos com `--tz` opcional        |

Timestamps sem fuso horário são tratados como UTC. Adicione `--tz America/New_York` para agendamento no horário local.

Expressões recorrentes no início da hora são automaticamente escalonadas em até 5 minutos para reduzir picos de carga. Use `--exact` para forçar temporização precisa ou `--stagger 30s` para uma janela explícita.

### Dia do mês e dia da semana usam lógica OR

Expressões cron são analisadas por [croner](https://github.com/Hexagon/croner). Quando os campos de dia do mês e dia da semana são ambos não curingas, o croner faz correspondência quando **qualquer um** dos campos corresponde — não ambos. Esse é o comportamento padrão do Vixie cron.

```
# Pretendido: "9h no dia 15, somente se for segunda-feira"
# Real:       "9h em todo dia 15, E 9h em toda segunda-feira"
0 9 15 * 1
```

Isso é acionado ~5–6 vezes por mês em vez de 0–1 vez por mês. O OpenClaw usa aqui o comportamento OR padrão do Croner. Para exigir ambas as condições, use o modificador `+` de dia da semana do Croner (`0 9 15 * +1`) ou agende por um campo e valide o outro no prompt ou comando da sua tarefa.

## Estilos de execução

| Estilo          | valor de `--session` | Executa em               | Melhor para                     |
| --------------- | -------------------- | ------------------------ | ------------------------------- |
| Sessão principal | `main`              | Próxima rodada de heartbeat | Lembretes, eventos do sistema |
| Isolado         | `isolated`           | `cron:<jobId>` dedicado  | Relatórios, tarefas em segundo plano |
| Sessão atual    | `current`            | Vinculada na hora da criação | Trabalho recorrente com reconhecimento de contexto |
| Sessão personalizada | `session:custom-id` | Sessão nomeada persistente | Fluxos de trabalho que evoluem com o histórico |

<AccordionGroup>
  <Accordion title="Sessão principal vs isolada vs personalizada">
    Tarefas de **sessão principal** enfileiram um evento do sistema e, opcionalmente, despertam o Heartbeat (`--wake now` ou `--wake next-heartbeat`). Esses eventos do sistema não estendem a atualização de frescor por reinicialização diária/ociosa para a sessão de destino. Tarefas **isoladas** executam uma rodada dedicada do agente com uma sessão nova. **Sessões personalizadas** (`session:xxx`) preservam contexto entre execuções, permitindo fluxos como alinhamentos diários que se apoiam em resumos anteriores.
  </Accordion>
  <Accordion title="O que 'sessão nova' significa para tarefas isoladas">
    Para tarefas isoladas, "sessão nova" significa um novo id de transcrição/sessão para cada execução. O OpenClaw pode carregar preferências seguras, como configurações de thinking/fast/verbose, rótulos e substituições explícitas de modelo/autenticação selecionadas pelo usuário, mas não herda contexto de conversa ambiente de uma linha cron mais antiga: roteamento de canal/grupo, política de envio ou fila, elevação, origem ou vínculo de runtime do ACP. Use `current` ou `session:<id>` quando uma tarefa recorrente deve deliberadamente evoluir sobre o mesmo contexto de conversa.
  </Accordion>
  <Accordion title="Limpeza do runtime">
    Para tarefas isoladas, o encerramento do runtime agora inclui limpeza de navegador em melhor esforço para aquela sessão cron. Falhas de limpeza são ignoradas para que o resultado real do cron ainda prevaleça.

    Execuções isoladas de cron também descartam qualquer instância empacotada de runtime MCP criada para a tarefa por meio do caminho compartilhado de limpeza de runtime. Isso corresponde a como clientes MCP de sessão principal e sessão personalizada são encerrados, para que tarefas cron isoladas não deixem processos filhos stdio ou conexões MCP de longa duração vazando entre execuções.

  </Accordion>
  <Accordion title="Entrega por subagente e Discord">
    Quando execuções isoladas de cron orquestram subagentes, a entrega também passa a preferir a saída final descendente em vez de texto intermediário obsoleto do pai. Se descendentes ainda estiverem em execução, o OpenClaw suprime essa atualização parcial do pai em vez de anunciá-la.

    Para destinos de anúncio no Discord somente texto, o OpenClaw envia o texto final canônico do assistente uma vez, em vez de reproduzir tanto cargas de texto transmitidas/intermediárias quanto a resposta final. Cargas de Discord de mídia e estruturadas ainda são entregues como cargas separadas, para que anexos e componentes não sejam descartados.

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
  Substituição do nível de thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Ignora a injeção do arquivo de bootstrap do workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Restringe quais ferramentas a tarefa pode usar, por exemplo `--tools exec,read`.
</ParamField>

`--model` usa o modelo permitido selecionado para aquela tarefa. Se o modelo solicitado não for permitido, o cron registra um aviso e retorna à seleção de modelo do agente/padrão da tarefa. Cadeias de fallback configuradas continuam se aplicando, mas uma substituição simples de modelo sem lista explícita de fallback por tarefa não acrescenta mais o primário do agente como alvo extra oculto de nova tentativa.

A precedência de seleção de modelo para tarefas isoladas é:

1. Substituição de modelo do hook do Gmail (quando a execução veio do Gmail e essa substituição é permitida)
2. `model` do payload por tarefa
3. Substituição de modelo armazenada da sessão cron selecionada pelo usuário
4. Seleção de modelo do agente/padrão

O modo rápido também segue a seleção ativa resolvida. Se a configuração do modelo selecionado tiver `params.fastMode`, o cron isolado usa isso por padrão. Uma substituição armazenada de `fastMode` da sessão ainda prevalece sobre a configuração em qualquer direção.

Se uma execução isolada atingir uma transferência ativa de troca de modelo, o cron tenta novamente com o provider/modelo alternado e persiste essa seleção ativa para a execução atual antes de tentar de novo. Quando a troca também carrega um novo perfil de autenticação, o cron persiste essa substituição de perfil de autenticação para a execução atual também. As novas tentativas são limitadas: após a tentativa inicial mais 2 novas tentativas por troca, o cron aborta em vez de entrar em loop infinito.

## Entrega e saída

| Modo      | O que acontece                                                      |
| --------- | ------------------------------------------------------------------- |
| `announce` | Faz entrega de fallback do texto final ao destino se o agente não enviar |
| `webhook` | Faz POST do payload do evento concluído para uma URL                |
| `none`    | Sem entrega de fallback pelo executor                               |

Use `--announce --channel telegram --to "-1001234567890"` para entrega em canal. Para tópicos de fórum do Telegram, use `-1001234567890:topic:123`. Destinos de Slack/Discord/Mattermost devem usar prefixos explícitos (`channel:<id>`, `user:<id>`). IDs de sala do Matrix diferenciam maiúsculas de minúsculas; use o ID exato da sala ou a forma `room:!room:server` do Matrix.

Para tarefas isoladas, a entrega por chat é compartilhada. Se uma rota de chat estiver disponível, o agente pode usar a ferramenta `message` mesmo quando a tarefa usa `--no-deliver`. Se o agente enviar para o destino configurado/atual, o OpenClaw ignora o anúncio de fallback. Caso contrário, `announce`, `webhook` e `none` controlam apenas o que o executor faz com a resposta final após a rodada do agente.

Quando um agente cria um lembrete isolado a partir de um chat ativo, o OpenClaw armazena o destino ativo de entrega preservado para a rota de anúncio de fallback. Chaves internas de sessão podem estar em minúsculas; destinos de entrega do provider não são reconstruídos a partir dessas chaves quando o contexto atual de chat está disponível.

Notificações de falha seguem um caminho de destino separado:

- `cron.failureDestination` define um padrão global para notificações de falha.
- `job.delivery.failureDestination` substitui isso por tarefa.
- Se nenhum dos dois estiver definido e a tarefa já fizer entrega via `announce`, notificações de falha agora usam como fallback esse destino principal de anúncio.
- `delivery.failureDestination` só é compatível com tarefas `sessionTarget="isolated"`, a menos que o modo principal de entrega seja `webhook`.

## Exemplos de CLI

<Tabs>
  <Tab title="Lembrete de execução única">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "No próximo heartbeat: verificar calendário." \
      --wake now
    ```
  </Tab>
  <Tab title="Tarefa recorrente isolada">
    ```bash
    openclaw cron add \
      --name "Morning brief" \
      --cron "0 7 * * *" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Resuma as atualizações da noite." \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Substituição de modelo e thinking">
    ```bash
    openclaw cron add \
      --name "Deep analysis" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Análise profunda semanal do progresso do projeto." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
</Tabs>

## Webhooks

O Gateway pode expor endpoints HTTP de Webhook para gatilhos externos. Ative na configuração:

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

Tokens na query string são rejeitados.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Enfileira um evento do sistema para a sessão principal:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"Novo email recebido","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Descrição do evento.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` ou `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Executa uma rodada isolada do agente:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Resumir caixa de entrada","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Campos: `message` (obrigatório), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hooks mapeados (POST /hooks/<name>)">
    Nomes personalizados de hooks são resolvidos via `hooks.mappings` na configuração. Os mapeamentos podem transformar payloads arbitrários em ações `wake` ou `agent` com templates ou transformações em código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantenha os endpoints de hook atrás de loopback, tailnet ou proxy reverso confiável.

Use um token de hook dedicado e não reutilize tokens de autenticação do gateway. Mantenha `hooks.path` em um subcaminho dedicado, pois `/` é rejeitado. Defina `hooks.allowedAgentIds` para limitar o roteamento explícito de `agentId`. Mantenha `hooks.allowRequestSessionKey=false` a menos que você precise de sessões selecionadas pelo chamador. Se você ativar `hooks.allowRequestSessionKey`, também defina `hooks.allowedSessionKeyPrefixes` para restringir os formatos permitidos de chave de sessão. Payloads de hook são encapsulados com limites de segurança por padrão.
</Warning>

## Integração com Gmail PubSub

Conecte gatilhos da caixa de entrada do Gmail ao OpenClaw via Google PubSub.

<Note>
**Pré-requisitos:** CLI `gcloud`, `gog` (gogcli), hooks do OpenClaw ativados, Tailscale para o endpoint HTTPS público.
</Note>

### Configuração com assistente (recomendado)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Isso grava a configuração `hooks.gmail`, ativa o preset do Gmail e usa o Tailscale Funnel para o endpoint push.

### Inicialização automática do Gateway

Quando `hooks.enabled=true` e `hooks.gmail.account` está definido, o Gateway inicia `gog gmail watch serve` na inicialização e renova automaticamente o watch. Defina `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desativar isso.

### Configuração manual única

<Steps>
  <Step title="Selecionar o projeto do GCP">
    Selecione o projeto do GCP que possui o cliente OAuth usado pelo `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Criar o tópico e conceder acesso de push do Gmail">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Iniciar o watch">
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
# Listar todas as tarefas
openclaw cron list

# Mostrar uma tarefa, incluindo a rota de entrega resolvida
openclaw cron show <jobId>

# Editar uma tarefa
openclaw cron edit <jobId> --message "Prompt atualizado" --model "opus"

# Forçar a execução de uma tarefa agora
openclaw cron run <jobId>

# Executar somente se estiver no horário
openclaw cron run <jobId> --due

# Ver histórico de execuções
openclaw cron runs --id <jobId> --limit 50

# Excluir uma tarefa
openclaw cron remove <jobId>

# Seleção de agente (configurações com vários agentes)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Verificar fila de ops" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
Observação sobre substituição de modelo:

`openclaw cron add|edit --model ...` altera o modelo selecionado da tarefa. Se o modelo for permitido, exatamente esse provider/modelo chegará à execução isolada do agente. Se não for permitido, o cron emite um aviso e retorna à seleção de modelo do agente/padrão da tarefa. Cadeias de fallback configuradas continuam se aplicando, mas uma substituição simples com `--model` sem lista explícita de fallback por tarefa não recorre mais ao primário do agente como um alvo extra silencioso de nova tentativa.
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
    webhookToken: "substitua-por-um-token-de-webhook-dedicado",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

O sidecar de estado em tempo de execução é derivado de `cron.store`: um armazenamento `.json` como `~/clawd/cron/jobs.json` usa `~/clawd/cron/jobs-state.json`, enquanto um caminho de armazenamento sem sufixo `.json` acrescenta `-state.json`.

Desative o cron: `cron.enabled: false` ou `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportamento de repetição">
    **Repetição de execução única**: erros transitórios (limite de taxa, sobrecarga, rede, erro do servidor) tentam novamente até 3 vezes com backoff exponencial. Erros permanentes desativam imediatamente.

    **Repetição recorrente**: backoff exponencial (30s a 60m) entre tentativas. O backoff é redefinido após a próxima execução bem-sucedida.

  </Accordion>
  <Accordion title="Manutenção">
    `cron.sessionRetention` (padrão `24h`) remove entradas de sessão de execuções isoladas. `cron.runLog.maxBytes` / `cron.runLog.keepLines` fazem a limpeza automática dos arquivos de log de execução.
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
    Verifique `cron.enabled` e a variável de ambiente `OPENCLAW_SKIP_CRON`. Confirme que o Gateway está em execução contínua. Para agendamentos `cron`, verifique o fuso horário (`--tz`) em relação ao fuso do host. `reason: not-due` na saída da execução significa que a execução manual foi verificada com `openclaw cron run <jobId> --due` e a tarefa ainda não estava no horário.
  </Accordion>
  <Accordion title="Cron disparou, mas não houve entrega">
    O modo de entrega `none` significa que não se espera envio de fallback pelo executor. O agente ainda pode enviar diretamente com a ferramenta `message` quando uma rota de chat estiver disponível. Destino de entrega ausente/inválido (`channel`/`to`) significa que a saída foi ignorada. Para Matrix, tarefas copiadas ou legadas com IDs de sala `delivery.to` em minúsculas podem falhar porque IDs de sala do Matrix diferenciam maiúsculas de minúsculas. Edite a tarefa com o valor exato `!room:server` ou `room:!room:server` do Matrix. Erros de autenticação do canal (`unauthorized`, `Forbidden`) significam que a entrega foi bloqueada pelas credenciais. Se a execução isolada retornar apenas o token silencioso (`NO_REPLY` / `no_reply`), o OpenClaw suprime a entrega de saída direta e também suprime o caminho de resumo enfileirado de fallback, então nada é publicado de volta no chat. Se o agente deve enviar mensagem ao próprio usuário, verifique se a tarefa tem uma rota utilizável (`channel: "last"` com um chat anterior, ou um canal/destino explícito).
  </Accordion>
  <Accordion title="Cron ou heartbeat parecem impedir a rolagem no estilo /new">
    O frescor de redefinição diária e por inatividade não se baseia em `updatedAt`; consulte [Gerenciamento de sessões](/pt-BR/concepts/session#session-lifecycle). Despertares de cron, execuções de Heartbeat, notificações de exec e bookkeeping do gateway podem atualizar a linha da sessão para roteamento/status, mas não estendem `sessionStartedAt` nem `lastInteractionAt`. Para linhas legadas criadas antes de esses campos existirem, o OpenClaw pode recuperar `sessionStartedAt` do cabeçalho de sessão JSONL da transcrição quando o arquivo ainda estiver disponível. Linhas legadas por inatividade sem `lastInteractionAt` usam esse horário inicial recuperado como base de inatividade.
  </Accordion>
  <Accordion title="Pegadinhas de fuso horário">
    Cron sem `--tz` usa o fuso horário do host do gateway. Agendamentos `at` sem fuso horário são tratados como UTC. `activeHours` do Heartbeat usa a resolução de fuso horário configurada.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Automação & Tarefas](/pt-BR/automation) — todos os mecanismos de automação em um só lugar
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — razão de tarefas para execuções de cron
- [Heartbeat](/pt-BR/gateway/heartbeat) — rodadas periódicas da sessão principal
- [Fuso horário](/pt-BR/concepts/timezone) — configuração de fuso horário
