---
read_when:
    - Agendamento de tarefas em segundo plano ou despertares
    - Conectando gatilhos externos (webhooks, Gmail) ao OpenClaw
    - Decidindo entre Heartbeat e Cron para tarefas agendadas
sidebarTitle: Scheduled tasks
summary: Trabalhos agendados, webhooks e gatilhos do Gmail PubSub para o agendador do Gateway
title: Tarefas agendadas
x-i18n:
    generated_at: "2026-07-01T05:31:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron é o agendador integrado do Gateway. Ele persiste jobs, desperta o agente no momento certo e pode entregar a saída de volta para um canal de chat ou endpoint de webhook.

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

- Cron é executado **dentro do processo Gateway** (não dentro do modelo).
- Definições de jobs, estado de runtime e histórico de execuções persistem no banco de dados SQLite de estado compartilhado do OpenClaw, para que reinicializações não percam agendamentos.
- Ao atualizar, execute `openclaw doctor --fix` para importar arquivos legados `~/.openclaw/cron/jobs.json`, `jobs-state.json` e `runs/*.jsonl` para o SQLite e renomeá-los com um sufixo `.migrated`. Linhas de jobs malformadas são ignoradas pelo runtime e copiadas para `jobs-quarantine.json` para reparo ou revisão posterior.
- `cron.store` ainda nomeia a chave lógica do repositório cron e o caminho de importação do doctor. Após a importação, editar esse arquivo JSON não altera mais os jobs cron ativos; use `openclaw cron add|edit|remove` ou os métodos RPC de cron do Gateway.
- Todas as execuções de cron criam registros de [tarefa em segundo plano](/pt-BR/automation/tasks).
- Na inicialização do Gateway, jobs isolados de turno do agente atrasados são reagendados para fora da janela de conexão de canais, em vez de serem reproduzidos imediatamente, para que a inicialização do Discord/Telegram e a configuração de comandos nativos permaneçam responsivas após reinicializações.
- Jobs únicos (`--at`) são excluídos automaticamente após sucesso por padrão.
- Execuções isoladas de cron fecham, em modo de melhor esforço, abas/processos de navegador rastreados para sua sessão `cron:<jobId>` quando a execução é concluída, para que automações de navegador destacadas não deixem processos órfãos para trás.
- Execuções isoladas de cron que recebem a concessão estreita de autolimpeza do cron ainda podem ler o status do agendador, uma lista autofiltrada de seu job atual e o histórico de execuções desse job, para que verificações de status/Heartbeat possam inspecionar seu próprio agendamento sem obter acesso mais amplo para mutação de cron.
- Execuções isoladas de cron também se protegem contra respostas de confirmação obsoletas. Se o primeiro resultado for apenas uma atualização de status intermediária (`on it`, `pulling everything together` e dicas semelhantes) e nenhuma execução descendente de subagente ainda for responsável pela resposta final, o OpenClaw solicita novamente uma vez o resultado real antes da entrega.
- Execuções isoladas de cron usam metadados estruturados de negação de execução da execução incorporada, incluindo wrappers `UNAVAILABLE` do host do nó cuja mensagem de erro aninhada começa com `SYSTEM_RUN_DENIED` ou `INVALID_REQUEST`, para que um comando bloqueado não seja relatado como uma execução verde enquanto prosa comum do assistente não seja tratada como negação.
- Execuções isoladas de cron também tratam falhas do agente no nível da execução como erros do job mesmo quando nenhuma carga de resposta é produzida, para que falhas de modelo/provedor incrementem contadores de erro e acionem notificações de falha em vez de limpar o job como bem-sucedido.
- Quando um job isolado de turno do agente atinge `timeoutSeconds`, o cron aborta a execução subjacente do agente e concede a ela uma breve janela de limpeza. Se a execução não drenar, a limpeza de propriedade do Gateway libera à força a posse da sessão dessa execução antes que o cron registre o tempo limite, para que trabalho de chat enfileirado não fique preso atrás de uma sessão de processamento obsoleta.
- Se um turno isolado do agente travar antes do runner iniciar ou antes da primeira chamada ao modelo, o cron registra um tempo limite específico da fase, como `setup timed out before runner start` ou `stalled before first model call (last phase: context-engine)`. Esses watchdogs cobrem provedores incorporados e provedores baseados em CLI antes que seu processo externo de CLI seja realmente iniciado, e são limitados independentemente de valores longos de `timeoutSeconds`, para que falhas de inicialização a frio/autenticação/contexto apareçam rapidamente em vez de esperar por todo o orçamento do job.
- Se você usar cron do sistema ou outro agendador externo para executar `openclaw agent`, envolva-o com uma escalada de encerramento forçado mesmo que a CLI trate `SIGTERM`/`SIGINT`. Execuções apoiadas pelo Gateway pedem ao Gateway para abortar execuções aceitas; execuções locais e de fallback incorporado recebem o mesmo sinal de aborto. Para GNU `timeout`, prefira `timeout -k 60 600 openclaw agent ...` em vez de `timeout 600 ...` simples; o valor `-k` é a proteção final do supervisor se o processo não conseguir drenar. Para unidades systemd, mantenha o mesmo formato usando um sinal de parada `SIGTERM` mais uma janela de tolerância, como `TimeoutStopSec`, antes de qualquer encerramento final. Se uma nova tentativa reutilizar um `--run-id` enquanto a execução original do Gateway ainda estiver ativa, a duplicata será relatada como em andamento em vez de iniciar uma segunda execução.

<a id="maintenance"></a>

<Note>
A reconciliação de tarefas para cron é primeiro de propriedade do runtime e, em segundo lugar, apoiada por histórico durável: uma tarefa cron ativa permanece ativa enquanto o runtime do cron ainda rastreia esse job como em execução, mesmo que uma linha antiga de sessão filha ainda exista. Depois que o runtime deixa de possuir o job e a janela de tolerância de 5 minutos expira, verificações de manutenção inspecionam logs de execução persistidos e o estado do job para a execução `cron:<jobId>:<startedAt>` correspondente. Se esse histórico durável mostrar um resultado terminal, o livro-razão de tarefas é finalizado a partir dele; caso contrário, a manutenção de propriedade do Gateway pode marcar a tarefa como `lost`. A auditoria offline da CLI pode recuperar a partir do histórico durável, mas não trata seu próprio conjunto vazio de jobs ativos em processo como prova de que uma execução cron de propriedade do Gateway desapareceu.
</Note>

## Tipos de agendamento

| Tipo    | Flag da CLI | Descrição                                               |
| ------- | ----------- | ------------------------------------------------------- |
| `at`    | `--at`      | Timestamp único (ISO 8601 ou relativo como `20m`)       |
| `every` | `--every`   | Intervalo fixo                                          |
| `cron`  | `--cron`    | Expressão cron de 5 ou 6 campos com `--tz` opcional     |

Timestamps sem fuso horário são tratados como UTC. Adicione `--tz America/New_York` para agendamento no horário local de relógio de parede.

Expressões recorrentes no início da hora são automaticamente escalonadas por até 5 minutos para reduzir picos de carga. Use `--exact` para forçar tempo preciso ou `--stagger 30s` para uma janela explícita.

### Dia do mês e dia da semana usam lógica OR

Expressões cron são analisadas por [croner](https://github.com/Hexagon/croner). Quando os campos de dia do mês e dia da semana não são curingas, croner corresponde quando **qualquer um** dos campos corresponde — não ambos. Esse é o comportamento padrão do Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Isso dispara cerca de 5–6 vezes por mês em vez de 0–1 vez por mês. O OpenClaw usa aqui o comportamento OR padrão do Croner. Para exigir ambas as condições, use o modificador de dia da semana `+` do Croner (`0 9 15 * +1`) ou agende em um campo e proteja o outro no prompt ou comando do seu job.

## Estilos de execução

| Estilo          | Valor de `--session` | Executa em                  | Melhor para                         |
| --------------- | -------------------- | --------------------------- | ----------------------------------- |
| Sessão principal | `main`              | Faixa dedicada de despertar cron | Lembretes, eventos do sistema       |
| Isolado         | `isolated`           | `cron:<jobId>` dedicado     | Relatórios, tarefas de segundo plano |
| Sessão atual    | `current`            | Vinculada no momento da criação | Trabalho recorrente ciente de contexto |
| Sessão personalizada | `session:custom-id` | Sessão nomeada persistente | Workflows que se baseiam no histórico |

<AccordionGroup>
  <Accordion title="Sessão principal vs isolada vs personalizada">
    Jobs de **sessão principal** enfileiram um evento do sistema em uma faixa de execução de propriedade do cron e, opcionalmente, despertam o Heartbeat (`--wake now` ou `--wake next-heartbeat`). Eles podem usar o último contexto de entrega da sessão principal de destino para respostas, mas não acrescentam turnos cron rotineiros à faixa de chat humano e não estendem a atualização de redefinição diária/ociosa para a sessão de destino. Jobs **isolados** executam um turno de agente dedicado com uma sessão nova. **Sessões personalizadas** (`session:xxx`) persistem contexto entre execuções, habilitando workflows como standups diários que se baseiam em resumos anteriores.

    Eventos cron de sessão principal são lembretes autocontidos de evento do sistema. Eles
    não incluem automaticamente a instrução "Read
    HEARTBEAT.md" do prompt padrão de Heartbeat. Se um lembrete recorrente deve consultar
    `HEARTBEAT.md`, diga isso explicitamente no texto do evento cron ou nas
    próprias instruções do agente.

  </Accordion>
  <Accordion title="O que 'sessão nova' significa para jobs isolados">
    Para jobs isolados, "sessão nova" significa um novo transcript/id de sessão para cada execução. O OpenClaw pode carregar preferências seguras, como configurações de thinking/fast/verbose, rótulos e substituições explícitas de modelo/autenticação selecionadas pelo usuário, mas não herda contexto ambiente de conversa de uma linha cron mais antiga: roteamento de canal/grupo, política de envio ou fila, elevação, origem ou associação de runtime ACP. Use `current` ou `session:<id>` quando um job recorrente deve deliberadamente se basear no mesmo contexto de conversa.
  </Accordion>
  <Accordion title="Limpeza de runtime">
    Para jobs isolados, o encerramento de runtime agora inclui limpeza de navegador em modo de melhor esforço para essa sessão cron. Falhas de limpeza são ignoradas para que o resultado real do cron ainda prevaleça.

    Execuções isoladas de cron também descartam quaisquer instâncias de runtime MCP empacotadas criadas para o job pelo caminho compartilhado de limpeza de runtime. Isso corresponde à forma como clientes MCP de sessão principal e sessão personalizada são encerrados, para que jobs cron isolados não vazem processos filhos stdio ou conexões MCP de longa duração entre execuções.

  </Accordion>
  <Accordion title="Entrega por subagente e Discord">
    Quando execuções isoladas de cron orquestram subagentes, a entrega também prefere a saída final descendente em vez de texto intermediário obsoleto do pai. Se descendentes ainda estiverem em execução, o OpenClaw suprime essa atualização parcial do pai em vez de anunciá-la.

    Para destinos de anúncio Discord somente texto, o OpenClaw envia o texto final canônico do assistente uma vez em vez de reproduzir tanto cargas de texto transmitidas/intermediárias quanto a resposta final. Mídias e cargas estruturadas do Discord ainda são entregues como cargas separadas para que anexos e componentes não sejam descartados.

  </Accordion>
</AccordionGroup>

### Cargas de comando

Use cargas de comando para scripts determinísticos que devem ser executados dentro do agendador do Gateway sem iniciar um turno isolado de agente apoiado por modelo. Jobs de comando executam no host do Gateway, capturam stdout/stderr, registram a execução no histórico do cron e reutilizam os mesmos modos de entrega `announce`, `webhook` e `none` que jobs isolados.

<Note>
Cron de comando é uma superfície de automação de Gateway para administrador-operador, não uma chamada
`tools.exec` do agente. Criar, atualizar, remover ou executar manualmente jobs cron
exige `operator.admin`; execuções de comando agendadas posteriormente executam dentro do
processo Gateway como essa automação criada pelo administrador. Políticas de exec do agente, como
`tools.exec.mode`, prompts de aprovação e allowlists de ferramentas por agente, governam
ferramentas exec visíveis ao modelo, não cargas de cron de comando.
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

Se stdout não estiver vazio, esse texto será o resultado entregue. Se stdout estiver vazio e stderr não estiver vazio, stderr será entregue. Se ambos os fluxos estiverem presentes, o Cron entrega um pequeno bloco `stdout:` / `stderr:`. Um código de saída zero registra a execução como `ok`; saída diferente de zero, sinal, tempo limite ou tempo limite sem saída registra `error` e pode acionar alertas de falha. Um comando que imprime apenas `NO_REPLY` usa a supressão normal por token silencioso do Cron e não publica nada de volta no chat.

### Opções de payload para jobs isolados

<ParamField path="--message" type="string" required>
  Texto do prompt (obrigatório para isolado).
</ParamField>
<ParamField path="--model" type="string">
  Substituição de modelo; usa o modelo permitido selecionado para o job.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Lista de modelos de fallback por job, por exemplo `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Passe `--fallbacks ""` para uma execução estrita sem fallbacks.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Em `cron edit`, remove a substituição de fallback por job para que o job siga a precedência de fallback configurada. Não pode ser combinado com `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Em `cron edit`, remove a substituição de modelo por job para que o job siga a precedência normal de seleção de modelo do Cron (uma substituição armazenada da sessão do Cron, se definida; caso contrário, o modelo do agente/padrão). Não pode ser combinado com `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Substituição do nível de raciocínio.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Em `cron edit`, remove a substituição de raciocínio por job para que o job siga a precedência normal de raciocínio do Cron. Não pode ser combinado com `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Ignora a injeção de arquivos de bootstrap do workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Restringe quais ferramentas o job pode usar, por exemplo `--tools exec,read`.
</ParamField>

`--model` usa o modelo permitido selecionado como modelo primário desse job. Ele não é o mesmo que uma substituição `/model` de sessão de chat: cadeias de fallback configuradas ainda se aplicam quando o modelo primário do job falha. Se o modelo solicitado não for permitido ou não puder ser resolvido, o Cron falha a execução com um erro de validação explícito em vez de recorrer silenciosamente à seleção de modelo do agente/padrão do job.

Jobs do Cron também podem carregar `fallbacks` no nível do payload. Quando presente, essa lista substitui a cadeia de fallback configurada para o job. Use `fallbacks: []` no payload/API do job quando quiser uma execução estrita do Cron que tente apenas o modelo selecionado. Se um job tiver `--model`, mas não tiver fallbacks no payload nem configurados, o OpenClaw passa uma substituição explícita de fallback vazia para que o primário do agente não seja anexado como um destino extra oculto de nova tentativa.

Verificações de preflight do provedor local percorrem os fallbacks configurados antes de marcar uma execução do Cron como `skipped`; `fallbacks: []` mantém esse caminho de preflight estrito.

A precedência de seleção de modelo para jobs isolados é:

1. Substituição de modelo do hook do Gmail (quando a execução veio do Gmail e essa substituição é permitida)
2. `model` do payload por job
3. Substituição de modelo armazenada da sessão do Cron selecionada pelo usuário
4. Seleção de modelo do agente/padrão

O modo rápido também segue a seleção ativa resolvida. Se a configuração do modelo selecionado tiver `params.fastMode`, o Cron isolado usa isso por padrão. Uma substituição `fastMode` de sessão armazenada ainda prevalece sobre a configuração em qualquer direção. O modo automático usa o limite `params.fastAutoOnSeconds` do modelo selecionado quando presente, com padrão de 60 segundos.

Se uma execução isolada encontrar uma transferência de troca de modelo ativa, o Cron tenta novamente com o provedor/modelo trocado e persiste essa seleção ativa para a execução ativa antes de tentar novamente. Quando a troca também carrega um novo perfil de autenticação, o Cron também persiste essa substituição de perfil de autenticação para a execução ativa. As novas tentativas são limitadas: após a tentativa inicial mais 2 novas tentativas de troca, o Cron aborta em vez de repetir indefinidamente.

Antes que uma execução isolada do Cron entre no executor do agente, o OpenClaw verifica endpoints de provedores locais alcançáveis para provedores configurados com `api: "ollama"` e `api: "openai-completions"` cujo `baseUrl` seja loopback, rede privada ou `.local`. Se esse endpoint estiver indisponível, a execução será registrada como `skipped` com um erro claro de provedor/modelo em vez de iniciar uma chamada de modelo. O resultado do endpoint fica em cache por 5 minutos, então muitos jobs vencidos usando o mesmo servidor local Ollama, vLLM, SGLang ou LM Studio indisponível compartilham uma pequena sondagem em vez de criar uma tempestade de requisições. Execuções ignoradas pelo preflight de provedor não incrementam o backoff de erros de execução; habilite `failureAlert.includeSkipped` quando quiser notificações repetidas de pulos.

## Entrega e saída

| Modo       | O que acontece                                                       |
| ---------- | -------------------------------------------------------------------- |
| `announce` | Entrega com fallback o texto final ao destino se o agente não enviou |
| `webhook`  | Faz POST do payload do evento concluído para uma URL                 |
| `none`     | Sem entrega de fallback do executor                                  |

Use `--announce --channel telegram --to "-1001234567890"` para entrega em canal. Para tópicos de fórum do Telegram, use `-1001234567890:topic:123`; o OpenClaw também aceita o atalho de propriedade do Telegram `-1001234567890:123`. Chamadores diretos por RPC/config podem passar `delivery.threadId` como string ou número. Destinos do Slack/Discord/Mattermost devem usar prefixos explícitos (`channel:<id>`, `user:<id>`). IDs de sala do Matrix diferenciam maiúsculas de minúsculas; use o ID exato da sala ou a forma `room:!room:server` do Matrix.

Quando a entrega de anúncio usa `channel: "last"` ou omite `channel`, um destino prefixado por provedor, como `telegram:123`, pode selecionar o canal antes que o Cron recorra ao histórico da sessão ou a um único canal configurado. Apenas prefixos anunciados pelo Plugin carregado são seletores de provedor. Se `delivery.channel` for explícito, o prefixo do destino deve nomear o mesmo provedor; por exemplo, `channel: "whatsapp"` com `to: "telegram:123"` é rejeitado em vez de permitir que o WhatsApp interprete o ID do Telegram como um número de telefone. Prefixos de tipo de destino e serviço, como `channel:<id>`, `user:<id>`, `imessage:<handle>` e `sms:<number>`, continuam sendo sintaxe de destino pertencente ao canal, não seletores de provedor.

Para jobs isolados, a entrega de chat é compartilhada. Se uma rota de chat estiver disponível, o agente poderá usar a ferramenta `message` mesmo quando o job usar `--no-deliver`. Se o agente enviar para o destino configurado/atual, o OpenClaw ignora o anúncio de fallback. Caso contrário, `announce`, `webhook` e `none` controlam apenas o que o executor faz com a resposta final após o turno do agente.

Quando um agente cria um lembrete isolado a partir de um chat ativo, o OpenClaw armazena o destino de entrega ativo preservado para a rota de anúncio de fallback. Chaves internas de sessão podem estar em minúsculas; destinos de entrega de provedor não são reconstruídos a partir dessas chaves quando o contexto atual do chat está disponível.

A entrega implícita de anúncio usa allowlists de canal configuradas para validar e redirecionar destinos obsoletos. Aprovações do armazenamento de pareamento de DMs não são destinatários de automação de fallback; defina `delivery.to` ou configure a entrada `allowFrom` do canal quando um job agendado deve enviar proativamente para uma DM.

## Idioma de saída

Jobs do Cron não inferem um idioma de resposta a partir do canal, da localidade ou de mensagens anteriores. Coloque a regra de idioma na mensagem agendada ou no modelo:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Para arquivos de modelo, mantenha a instrução de idioma no prompt renderizado e
verifique se placeholders como `{{language}}` foram preenchidos antes de a tarefa ser executada. Se
a saída misturar idiomas, torne a regra explícita, por exemplo: "Use Chinese
for narrative text and keep technical terms in English."

As notificações de falha seguem um caminho de destino separado:

- `cron.failureDestination` define um padrão global para notificações de falha.
- `job.delivery.failureDestination` substitui isso por tarefa.
- Se nenhum dos dois estiver definido e a tarefa já entregar via `announce`, as notificações de falha agora recorrem a esse destino principal de anúncio.
- `delivery.failureDestination` só é compatível em tarefas `sessionTarget="isolated"`, a menos que o modo de entrega principal seja `webhook`.
- `failureAlert.includeSkipped: true` inclui uma tarefa ou política global de alerta de cron em alertas repetidos de execuções ignoradas. Execuções ignoradas mantêm um contador consecutivo de ignoradas separado, portanto não afetam o backoff de erros de execução.

## Exemplos da CLI

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
  <Tab title="Webhook output">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Command output">
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

Toda solicitação deve incluir o token do hook via cabeçalho:

- `Authorization: Bearer <token>` (recomendado)
- `x-openclaw-token: <token>`

Tokens em query string são rejeitados.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Enfileire um evento do sistema para a sessão principal:

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
    Nomes de hook personalizados são resolvidos via `hooks.mappings` na configuração. Mapeamentos podem transformar payloads arbitrários em ações `wake` ou `agent` com modelos ou transformações de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantenha endpoints de hook atrás de loopback, tailnet ou proxy reverso confiável.

- Use um token de hook dedicado; não reutilize tokens de autenticação do gateway.
- Mantenha `hooks.path` em um subcaminho dedicado; `/` é rejeitado.
- Defina `hooks.allowedAgentIds` para limitar qual agente efetivo um hook pode direcionar, incluindo o agente padrão quando `agentId` for omitido.
- Mantenha `hooks.allowRequestSessionKey=false`, a menos que você precise de sessões selecionadas pelo chamador.
- Se você habilitar `hooks.allowRequestSessionKey`, defina também `hooks.allowedSessionKeyPrefixes` para restringir os formatos permitidos de chaves de sessão.
- Os payloads de hook são encapsulados com limites de segurança por padrão.

</Warning>

## Integração Gmail PubSub

Conecte gatilhos da caixa de entrada do Gmail ao OpenClaw via Google PubSub.

<Note>
**Pré-requisitos:** CLI `gcloud`, `gog` (gogcli), hooks do OpenClaw habilitados, Tailscale para o endpoint HTTPS público.
</Note>

### Configuração pelo assistente (recomendado)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Isso grava a configuração `hooks.gmail`, habilita o preset do Gmail e usa Tailscale Funnel para o endpoint de push.

### Inicialização automática do Gateway

Quando `hooks.enabled=true` e `hooks.gmail.account` estiver definido, o Gateway inicia `gog gmail watch serve` na inicialização e renova automaticamente o monitoramento. Defina `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desativar.

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

`openclaw cron run <jobId>` retorna depois de enfileirar a execução manual. Use `--wait` para hooks de desligamento, scripts de manutenção ou outras automações que precisam bloquear até que a execução enfileirada termine. O modo de espera consulta o `runId` exato retornado; ele sai com `0` para o status `ok` e com valor diferente de zero para `error`, `skipped` ou tempo limite de espera.

A ferramenta `cron` do agente retorna resumos compactos das tarefas (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) a partir de `cron(action: "list")`; use `cron(action: "get", jobId: "...")` para uma definição completa de uma tarefa. Chamadores diretos do Gateway podem passar `compact: true` para `cron.list`; omiti-lo preserva a resposta completa existente com prévias de entrega.

`openclaw cron create` é um alias para `openclaw cron add`, e novas tarefas podem usar um agendamento posicional (`"0 9 * * 1"`, `"every 1h"`, `"20m"` ou um timestamp ISO) seguido por um prompt posicional do agente. Use `--webhook <url>` em `cron add|create` ou `cron edit` para enviar por POST o payload da execução finalizada a um endpoint HTTP. A entrega por Webhook não pode ser combinada com flags de entrega por chat, como `--announce`, `--channel`, `--to`, `--thread-id` ou `--account`. Em `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` e `--clear-account` removem individualmente esses campos de roteamento (cada um rejeitado junto com sua flag de definição correspondente), o que é distinto de `--no-deliver` desabilitar a entrega de fallback do executor.

<Note>
Observação sobre substituição de modelo:

- `openclaw cron add|edit --model ...` altera o modelo selecionado da tarefa.
- Se o modelo for permitido, esse provedor/modelo exato chega à execução isolada do agente.
- Se ele não for permitido ou não puder ser resolvido, o Cron falha a execução com um erro de validação explícito.
- Patches de payload da API `cron.update` podem definir `model: null` para limpar uma substituição de modelo armazenada em uma tarefa.
- `openclaw cron edit <job-id> --clear-model` limpa essa substituição pela CLI (mesmo efeito do patch `model: null`) e não pode ser combinado com `--model`.
- Cadeias de fallback configuradas ainda se aplicam porque `--model` do Cron é um primário da tarefa, não uma substituição de `/model` da sessão.
- `openclaw cron add|edit --fallbacks ...` define o payload `fallbacks`, substituindo os fallbacks configurados para essa tarefa; `--fallbacks ""` desabilita o fallback e torna a execução estrita. `openclaw cron edit <job-id> --clear-fallbacks` limpa a substituição por tarefa.
- Um `--model` simples sem uma lista de fallback explícita ou configurada não recai para o primário do agente como um alvo extra silencioso de nova tentativa.

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

`maxConcurrentRuns` limita tanto o despacho agendado do Cron quanto a execução isolada de turnos de agente, e o padrão é 8. Turnos isolados de agente do Cron usam internamente a faixa de execução dedicada `cron-nested` da fila, portanto aumentar esse valor permite que execuções LLM independentes do Cron avancem em paralelo, em vez de iniciar apenas seus wrappers externos do Cron. A faixa compartilhada não Cron `nested` não é ampliada por essa configuração.

`cron.store` é uma chave lógica de armazenamento e um caminho de importação legado do doctor. Execute `openclaw doctor --fix` para importar armazenamentos JSON existentes para SQLite e arquivá-los; mudanças futuras no Cron devem passar pela CLI ou pela API do Gateway.

Desabilitar o Cron: `cron.enabled: false` ou `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Nova tentativa única**: erros transitórios (limite de taxa, sobrecarga, rede, erro de servidor) tentam novamente até 3 vezes com backoff exponencial. Erros permanentes desabilitam imediatamente.

    **Nova tentativa recorrente**: backoff exponencial (30s a 60m) entre tentativas. O backoff é redefinido depois da próxima execução bem-sucedida.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (padrão `24h`) remove entradas de sessões de execução isoladas. `cron.runLog.keepLines` limita as linhas retidas do histórico de execuções em SQLite por tarefa; `maxBytes` é mantido para compatibilidade de configuração com logs de execução antigos baseados em arquivo.
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
    - `reason: not-due` na saída da execução significa que a execução manual foi verificada com `openclaw cron run <jobId> --due` e a tarefa ainda não estava no vencimento.

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - O modo de entrega `none` significa que nenhum envio de fallback do executor é esperado. O agente ainda pode enviar diretamente com a ferramenta `message` quando uma rota de chat estiver disponível.
    - Destino de entrega ausente/inválido (`channel`/`to`) significa que o envio de saída foi ignorado.
    - Para Matrix, tarefas copiadas ou legadas com IDs de sala `delivery.to` em minúsculas podem falhar porque IDs de sala do Matrix diferenciam maiúsculas de minúsculas. Edite a tarefa para o valor exato `!room:server` ou `room:!room:server` do Matrix.
    - Erros de autenticação de canal (`unauthorized`, `Forbidden`) significam que a entrega foi bloqueada por credenciais.
    - Se a execução isolada retornar apenas o token silencioso (`NO_REPLY` / `no_reply`), o OpenClaw suprime a entrega direta de saída e também suprime o caminho de resumo enfileirado de fallback, portanto nada é publicado de volta no chat.
    - Se o agente deve enviar mensagem ao usuário por conta própria, verifique se a tarefa tem uma rota utilizável (`channel: "last"` com um chat anterior, ou um canal/alvo explícito).

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - A atualização diária e por inatividade não se baseia em `updatedAt`; consulte [Gerenciamento de sessões](/pt-BR/concepts/session#session-lifecycle).
    - Despertares do Cron, execuções de Heartbeat, notificações de exec e escrituração do gateway podem atualizar a linha da sessão para roteamento/status, mas não estendem `sessionStartedAt` nem `lastInteractionAt`.
    - Para linhas legadas criadas antes desses campos existirem, o OpenClaw pode recuperar `sessionStartedAt` do cabeçalho de sessão do transcript JSONL quando o arquivo ainda está disponível. Linhas legadas inativas sem `lastInteractionAt` usam esse horário de início recuperado como sua linha de base de inatividade.

  </Accordion>
  <Accordion title="Timezone gotchas">
    - Cron sem `--tz` usa o fuso horário do host do gateway.
    - Agendamentos `at` sem fuso horário são tratados como UTC.
    - `activeHours` do Heartbeat usa a resolução de fuso horário configurada.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Automação](/pt-BR/automation) — todos os mecanismos de automação em uma visão geral
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — registro de tarefas para execuções do Cron
- [Heartbeat](/pt-BR/gateway/heartbeat) — turnos periódicos da sessão principal
- [Fuso horário](/pt-BR/concepts/timezone) — configuração de fuso horário
