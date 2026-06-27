---
read_when:
    - Agendando trabalhos em segundo plano ou despertares
    - Conectando gatilhos externos (webhooks, Gmail) ao OpenClaw
    - Decidindo entre heartbeat e cron para tarefas agendadas
sidebarTitle: Scheduled tasks
summary: Tarefas agendadas, webhooks e gatilhos do Gmail PubSub para o agendador do Gateway
title: Tarefas agendadas
x-i18n:
    generated_at: "2026-06-27T17:08:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97097c9809afea699caa0c60d2ab5b71cd3794f90d9e002d35d25e76ca40d63c
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron é o agendador integrado do Gateway. Ele persiste jobs, acorda o agente no momento certo e pode entregar a saída de volta a um canal de chat ou endpoint de Webhook.

## Início rápido

<Steps>
  <Step title="Adicionar um lembrete de execução única">
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
  <Step title="Ver o histórico de execuções">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Como o Cron funciona

- O Cron é executado **dentro do processo do Gateway** (não dentro do modelo).
- Definições de job, estado de runtime e histórico de execuções persistem no banco de dados SQLite de estado compartilhado do OpenClaw, para que reinicializações não percam agendamentos.
- Ao atualizar, execute `openclaw doctor --fix` para importar arquivos legados `~/.openclaw/cron/jobs.json`, `jobs-state.json` e `runs/*.jsonl` para o SQLite e renomeá-los com um sufixo `.migrated`. Linhas de job malformadas são ignoradas pelo runtime e copiadas para `jobs-quarantine.json` para reparo ou revisão posterior.
- `cron.store` ainda nomeia a chave lógica do armazenamento de cron e o caminho de importação do doctor. Após a importação, editar esse arquivo JSON não altera mais os jobs cron ativos; use `openclaw cron add|edit|remove` ou os métodos RPC de cron do Gateway.
- Todas as execuções de cron criam registros de [tarefa em segundo plano](/pt-BR/automation/tasks).
- Na inicialização do Gateway, jobs de turno de agente isolado atrasados são reagendados para fora da janela de conexão de canal em vez de serem reproduzidos imediatamente, para que a inicialização do Discord/Telegram e a configuração de comandos nativos permaneçam responsivas após reinicializações.
- Jobs de execução única (`--at`) são excluídos automaticamente após sucesso por padrão.
- Execuções de cron isoladas fecham, em regime de melhor esforço, abas/processos de navegador rastreados para sua sessão `cron:<jobId>` quando a execução é concluída, para que automações de navegador desacopladas não deixem processos órfãos para trás.
- Execuções de cron isoladas que recebem a concessão restrita de autolimpeza do cron ainda podem ler o status do agendador, uma lista autofiltada do job atual e o histórico de execuções desse job, para que verificações de status/Heartbeat possam inspecionar seu próprio agendamento sem obter acesso mais amplo de mutação do cron.
- Execuções de cron isoladas também se protegem contra respostas de confirmação obsoletas. Se o primeiro resultado for apenas uma atualização intermediária de status (`on it`, `pulling everything together` e indicações semelhantes) e nenhuma execução descendente de subagente ainda for responsável pela resposta final, o OpenClaw solicita novamente uma vez o resultado real antes da entrega.
- Execuções de cron isoladas usam metadados estruturados de negação de execução da execução incorporada, incluindo wrappers `UNAVAILABLE` do host de nó cuja mensagem de erro aninhada começa com `SYSTEM_RUN_DENIED` ou `INVALID_REQUEST`, para que um comando bloqueado não seja relatado como uma execução bem-sucedida enquanto prosa comum do assistente não é tratada como negação.
- Execuções de cron isoladas também tratam falhas de agente no nível da execução como erros de job mesmo quando nenhum payload de resposta é produzido, para que falhas de modelo/provedor incrementem contadores de erro e acionem notificações de falha em vez de limpar o job como bem-sucedido.
- Quando um job de turno de agente isolado atinge `timeoutSeconds`, o cron aborta a execução de agente subjacente e concede uma janela curta de limpeza. Se a execução não escoar, a limpeza de propriedade do Gateway força a liberação da propriedade de sessão dessa execução antes que o cron registre o timeout, para que trabalho de chat enfileirado não fique preso atrás de uma sessão de processamento obsoleta.
- Se um turno de agente isolado travar antes que o executor inicie ou antes da primeira chamada ao modelo, o cron registra um timeout específico da fase, como `setup timed out before runner start` ou `stalled before first model call (last phase: context-engine)`. Esses watchdogs cobrem provedores incorporados e provedores baseados em CLI antes que o processo externo de CLI seja realmente iniciado, e são limitados independentemente de valores longos de `timeoutSeconds`, para que falhas de cold start/autenticação/contexto apareçam rapidamente em vez de aguardar todo o orçamento do job.
- Se você usa o cron do sistema ou outro agendador externo para executar `openclaw agent`, envolva-o com uma escalada de encerramento forçado, ainda que a CLI trate `SIGTERM`/`SIGINT`. Execuções apoiadas pelo Gateway pedem ao Gateway para abortar execuções aceitas; execuções locais e de fallback incorporado recebem o mesmo sinal de abortamento. Para GNU `timeout`, prefira `timeout -k 60 600 openclaw agent ...` em vez de `timeout 600 ...`; o valor de `-k` é a retaguarda do supervisor se o processo não conseguir escoar. Para unidades systemd, mantenha a mesma forma usando um sinal de parada `SIGTERM` mais uma janela de tolerância como `TimeoutStopSec` antes de qualquer encerramento final. Se uma nova tentativa reutilizar um `--run-id` enquanto a execução original do Gateway ainda estiver ativa, a duplicata será relatada como em andamento em vez de iniciar uma segunda execução.

<a id="maintenance"></a>

<Note>
A reconciliação de tarefas para cron pertence primeiro ao runtime e, em segundo lugar, é apoiada por histórico durável: uma tarefa cron ativa permanece ativa enquanto o runtime do cron ainda rastreia esse job como em execução, mesmo que uma linha antiga de sessão filha ainda exista. Depois que o runtime deixa de ser dono do job e a janela de tolerância de 5 minutos expira, a manutenção verifica logs de execução persistidos e o estado do job para a execução `cron:<jobId>:<startedAt>` correspondente. Se esse histórico durável mostrar um resultado terminal, o livro-razão de tarefas é finalizado a partir dele; caso contrário, a manutenção de propriedade do Gateway pode marcar a tarefa como `lost`. A auditoria offline da CLI pode se recuperar a partir do histórico durável, mas não trata seu próprio conjunto vazio de jobs ativos em processo como prova de que uma execução cron de propriedade do Gateway desapareceu.
</Note>

## Tipos de agendamento

| Tipo    | Flag da CLI | Descrição                                               |
| ------- | ----------- | ------------------------------------------------------- |
| `at`    | `--at`      | Timestamp de execução única (ISO 8601 ou relativo como `20m`) |
| `every` | `--every`   | Intervalo fixo                                          |
| `cron`  | `--cron`    | Expressão cron de 5 ou 6 campos com `--tz` opcional     |

Timestamps sem fuso horário são tratados como UTC. Adicione `--tz America/New_York` para agendamento no horário local de parede.

Expressões recorrentes no topo da hora são automaticamente escalonadas em até 5 minutos para reduzir picos de carga. Use `--exact` para forçar temporização precisa ou `--stagger 30s` para uma janela explícita.

### Dia do mês e dia da semana usam lógica OR

Expressões cron são analisadas por [croner](https://github.com/Hexagon/croner). Quando os campos de dia do mês e dia da semana não são curingas, o croner corresponde quando **qualquer um** dos campos corresponde — não ambos. Esse é o comportamento padrão do cron Vixie.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Isso dispara cerca de 5–6 vezes por mês em vez de 0–1 vez por mês. O OpenClaw usa aqui o comportamento OR padrão do Croner. Para exigir ambas as condições, use o modificador de dia da semana `+` do Croner (`0 9 15 * +1`) ou agende em um campo e proteja o outro no prompt ou comando do seu job.

## Estilos de execução

| Estilo          | Valor de `--session` | Executa em               | Melhor para                    |
| --------------- | -------------------- | ------------------------ | ------------------------------ |
| Sessão principal | `main`              | Faixa dedicada de despertar do cron | Lembretes, eventos do sistema |
| Isolado         | `isolated`           | `cron:<jobId>` dedicado  | Relatórios, tarefas em segundo plano |
| Sessão atual    | `current`            | Vinculada no momento da criação | Trabalho recorrente ciente de contexto |
| Sessão personalizada | `session:custom-id` | Sessão nomeada persistente | Workflows que se baseiam no histórico |

<AccordionGroup>
  <Accordion title="Sessão principal vs isolada vs personalizada">
    Jobs de **sessão principal** enfileiram um evento do sistema em uma faixa de execução pertencente ao cron e opcionalmente acordam o Heartbeat (`--wake now` ou `--wake next-heartbeat`). Eles podem usar o último contexto de entrega da sessão principal de destino para respostas, mas não acrescentam turnos cron rotineiros à faixa de chat humano e não estendem a atualização de redefinição diária/ociosa da sessão de destino. Jobs **isolados** executam um turno de agente dedicado com uma sessão nova. **Sessões personalizadas** (`session:xxx`) persistem contexto entre execuções, viabilizando workflows como standups diários que se baseiam em resumos anteriores.

    Eventos cron de sessão principal são lembretes de evento do sistema autocontidos. Eles
    não incluem automaticamente a instrução "Read
    HEARTBEAT.md" do prompt padrão de Heartbeat. Se um lembrete recorrente deve consultar
    `HEARTBEAT.md`, diga isso explicitamente no texto do evento cron ou nas
    próprias instruções do agente.

  </Accordion>
  <Accordion title="O que 'sessão nova' significa para jobs isolados">
    Para jobs isolados, "sessão nova" significa um novo ID de transcrição/sessão para cada execução. O OpenClaw pode carregar preferências seguras, como configurações de raciocínio/rápido/verboso, rótulos e substituições explícitas de modelo/autenticação selecionadas pelo usuário, mas não herda contexto ambiente de conversa de uma linha de cron mais antiga: roteamento de canal/grupo, política de envio ou fila, elevação, origem ou vinculação de runtime ACP. Use `current` ou `session:<id>` quando um job recorrente deve deliberadamente se basear no mesmo contexto de conversa.
  </Accordion>
  <Accordion title="Limpeza de runtime">
    Para jobs isolados, o desmonte do runtime agora inclui limpeza de navegador em melhor esforço para essa sessão cron. Falhas de limpeza são ignoradas para que o resultado real do cron ainda prevaleça.

    Execuções de cron isoladas também descartam quaisquer instâncias de runtime MCP agrupadas criadas para o job pelo caminho compartilhado de limpeza de runtime. Isso corresponde à forma como clientes MCP de sessão principal e de sessão personalizada são desmontados, para que jobs cron isolados não vazem processos filhos stdio ou conexões MCP de longa duração entre execuções.

  </Accordion>
  <Accordion title="Subagente e entrega no Discord">
    Quando execuções de cron isoladas orquestram subagentes, a entrega também prefere a saída final descendente em vez de texto intermediário obsoleto do pai. Se descendentes ainda estiverem em execução, o OpenClaw suprime essa atualização parcial do pai em vez de anunciá-la.

    Para destinos de anúncio do Discord apenas com texto, o OpenClaw envia o texto final canônico do assistente uma vez em vez de reproduzir tanto payloads de texto transmitidos/intermediários quanto a resposta final. Mídia e payloads estruturados do Discord ainda são entregues como payloads separados para que anexos e componentes não sejam descartados.

  </Accordion>
</AccordionGroup>

### Payloads de comando

Use payloads de comando para scripts determinísticos que devem ser executados dentro do agendador do Gateway sem iniciar um turno de agente isolado apoiado por modelo. Jobs de comando executam no host do Gateway, capturam stdout/stderr, registram a execução no histórico do cron e reutilizam os mesmos modos de entrega `announce`, `webhook` e `none` que jobs isolados.

<Note>
Cron de comando é uma superfície de automação administrativa de operador do Gateway, não uma chamada
`tools.exec` de agente. Criar, atualizar, remover ou executar manualmente jobs cron
exige `operator.admin`; execuções de comando agendadas posteriormente executam dentro do
processo do Gateway como essa automação criada pelo administrador. Políticas de exec de agente, como
`tools.exec.mode`, prompts de aprovação e allowlists de ferramentas por agente governam
ferramentas de exec visíveis ao modelo, não payloads de cron de comando.
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

`--command <shell>` armazena `argv: ["sh", "-lc", <shell>]`. Use `--command-argv '["node","scripts/report.mjs"]'` quando quiser execução argv exata sem análise de shell. Campos opcionais `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` e `--output-max-bytes` controlam o ambiente do processo, stdin e limites de saída.

Se stdout não estiver vazio, esse texto será o resultado entregue. Se stdout estiver vazio e stderr não estiver vazio, stderr será entregue. Se ambos os fluxos estiverem presentes, o Cron entrega um pequeno bloco `stdout:` / `stderr:`. Um código de saída zero registra a execução como `ok`; saída diferente de zero, sinal, timeout ou timeout sem saída registra `error` e pode acionar alertas de falha. Um comando que imprime apenas `NO_REPLY` usa a supressão normal de token silencioso do Cron e não publica nada de volta no chat.

### Opções de payload para tarefas isoladas

<ParamField path="--message" type="string" required>
  Texto do prompt (obrigatório para isoladas).
</ParamField>
<ParamField path="--model" type="string">
  Substituição de modelo; usa o modelo permitido selecionado para a tarefa.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Lista de modelos alternativos por tarefa, por exemplo `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Passe `--fallbacks ""` para uma execução estrita sem modelos alternativos.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Em `cron edit`, remove a substituição de modelos alternativos por tarefa para que a tarefa siga a precedência configurada de alternativas. Não pode ser combinado com `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Em `cron edit`, remove a substituição de modelo por tarefa para que a tarefa siga a precedência normal de seleção de modelo do Cron (uma substituição armazenada de sessão do Cron, se definida; caso contrário, o modelo do agente/padrão). Não pode ser combinado com `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Substituição do nível de raciocínio.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Pula a injeção de arquivos de bootstrap do workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Restringe quais ferramentas a tarefa pode usar, por exemplo `--tools exec,read`.
</ParamField>

`--model` usa o modelo permitido selecionado como o modelo principal dessa tarefa. Isso não é igual a uma substituição `/model` de sessão de chat: cadeias alternativas configuradas ainda se aplicam quando o modelo principal da tarefa falha. Se o modelo solicitado não for permitido ou não puder ser resolvido, o Cron falha a execução com um erro de validação explícito em vez de retornar silenciosamente à seleção de modelo do agente/padrão da tarefa.

Tarefas Cron também podem carregar `fallbacks` no nível do payload. Quando presente, essa lista substitui a cadeia alternativa configurada para a tarefa. Use `fallbacks: []` no payload/API da tarefa quando quiser uma execução Cron estrita que tente apenas o modelo selecionado. Se uma tarefa tiver `--model`, mas não tiver alternativas no payload nem configuradas, o OpenClaw passa uma substituição alternativa vazia explícita para que o modelo principal do agente não seja anexado como um alvo extra oculto de nova tentativa.

As verificações de preflight de provedor local percorrem as alternativas configuradas antes de marcar uma execução Cron como `skipped`; `fallbacks: []` mantém esse caminho de preflight estrito.

A precedência de seleção de modelo para tarefas isoladas é:

1. Substituição de modelo do hook do Gmail (quando a execução veio do Gmail e essa substituição é permitida)
2. `model` do payload por tarefa
3. Substituição armazenada de modelo da sessão Cron selecionada pelo usuário
4. Seleção de modelo do agente/padrão

O modo rápido também segue a seleção ativa resolvida. Se a configuração do modelo selecionado tiver `params.fastMode`, o Cron isolado usa isso por padrão. Uma substituição armazenada de `fastMode` da sessão ainda prevalece sobre a configuração em qualquer direção. O modo automático usa o limite `params.fastAutoOnSeconds` do modelo selecionado quando presente, com padrão de 60 segundos.

Se uma execução isolada encontrar uma transferência de troca de modelo ao vivo, o Cron tenta novamente com o provedor/modelo trocado e persiste essa seleção ao vivo para a execução ativa antes de tentar novamente. Quando a troca também carrega um novo perfil de autenticação, o Cron também persiste essa substituição de perfil de autenticação para a execução ativa. As novas tentativas são limitadas: após a tentativa inicial mais 2 novas tentativas de troca, o Cron aborta em vez de entrar em loop infinito.

Antes que uma execução Cron isolada entre no executor do agente, o OpenClaw verifica endpoints de provedores locais alcançáveis para provedores configurados `api: "ollama"` e `api: "openai-completions"` cujo `baseUrl` seja loopback, rede privada ou `.local`. Se esse endpoint estiver fora do ar, a execução é registrada como `skipped` com um erro claro de provedor/modelo em vez de iniciar uma chamada de modelo. O resultado do endpoint é armazenado em cache por 5 minutos, então muitas tarefas vencidas usando o mesmo servidor local Ollama, vLLM, SGLang ou LM Studio indisponível compartilham uma pequena sondagem em vez de criar uma tempestade de solicitações. Execuções ignoradas por preflight de provedor não incrementam o recuo por erro de execução; habilite `failureAlert.includeSkipped` quando quiser notificações repetidas de pulos.

## Entrega e saída

| Modo       | O que acontece                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Entrega alternativa do texto final ao destino se o agente não enviou |
| `webhook`  | Envia por POST o payload do evento finalizado para uma URL           |
| `none`     | Sem entrega alternativa do executor                                  |

Use `--announce --channel telegram --to "-1001234567890"` para entrega em canal. Para tópicos de fórum do Telegram, use `-1001234567890:topic:123`; o OpenClaw também aceita a forma abreviada de propriedade do Telegram `-1001234567890:123`. Chamadores diretos de RPC/configuração podem passar `delivery.threadId` como string ou número. Destinos Slack/Discord/Mattermost devem usar prefixos explícitos (`channel:<id>`, `user:<id>`). IDs de sala Matrix diferenciam maiúsculas de minúsculas; use o ID exato da sala ou a forma `room:!room:server` do Matrix.

Quando a entrega de anúncio usa `channel: "last"` ou omite `channel`, um destino com prefixo de provedor como `telegram:123` pode selecionar o canal antes de o Cron retornar ao histórico da sessão ou a um único canal configurado. Somente prefixos anunciados pelo Plugin carregado são seletores de provedor. Se `delivery.channel` for explícito, o prefixo do destino deve nomear o mesmo provedor; por exemplo, `channel: "whatsapp"` com `to: "telegram:123"` é rejeitado em vez de permitir que o WhatsApp interprete o ID do Telegram como um número de telefone. Prefixos de tipo de destino e serviço como `channel:<id>`, `user:<id>`, `imessage:<handle>` e `sms:<number>` continuam sendo sintaxe de destino pertencente ao canal, não seletores de provedor.

Para tarefas isoladas, a entrega por chat é compartilhada. Se uma rota de chat estiver disponível, o agente poderá usar a ferramenta `message` mesmo quando a tarefa usar `--no-deliver`. Se o agente enviar para o destino configurado/atual, o OpenClaw pula o anúncio alternativo. Caso contrário, `announce`, `webhook` e `none` controlam apenas o que o executor faz com a resposta final após o turno do agente.

Quando um agente cria um lembrete isolado a partir de um chat ativo, o OpenClaw armazena o destino de entrega ao vivo preservado para a rota de anúncio alternativa. Chaves internas de sessão podem estar em minúsculas; destinos de entrega de provedores não são reconstruídos a partir dessas chaves quando o contexto de chat atual está disponível.

A entrega de anúncio implícita usa listas de permissões de canais configuradas para validar e redirecionar destinos obsoletos. Aprovações do armazenamento de pareamento de DM não são destinatários de automação alternativa; defina `delivery.to` ou configure a entrada `allowFrom` do canal quando uma tarefa agendada deve enviar proativamente para uma DM.

## Idioma de saída

Tarefas Cron não inferem o idioma da resposta a partir de canal, localidade ou mensagens anteriores. Coloque a regra de idioma na mensagem ou no modelo agendado:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Para arquivos de modelo, mantenha a instrução de idioma no prompt renderizado e verifique se placeholders como `{{language}}` estão preenchidos antes de a tarefa executar. Se a saída misturar idiomas, torne a regra explícita, por exemplo: "Use Chinese for narrative text and keep technical terms in English."

Notificações de falha seguem um caminho de destino separado:

- `cron.failureDestination` define um padrão global para notificações de falha.
- `job.delivery.failureDestination` substitui isso por tarefa.
- Se nenhum dos dois estiver definido e a tarefa já entregar via `announce`, as notificações de falha agora retornam a esse destino primário de anúncio.
- `delivery.failureDestination` só é compatível em tarefas `sessionTarget="isolated"`, a menos que o modo de entrega principal seja `webhook`.
- `failureAlert.includeSkipped: true` inclui uma tarefa ou política global de alerta do Cron em alertas repetidos de execuções ignoradas. Execuções ignoradas mantêm um contador separado de pulos consecutivos, portanto não afetam o recuo por erro de execução.

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

Toda solicitação deve incluir o token do hook via cabeçalho:

- `Authorization: Bearer <token>` (recomendado)
- `x-openclaw-token: <token>`

Tokens em query string são rejeitados.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Enfileira um evento de sistema para a sessão principal:

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
    Nomes de hook personalizados são resolvidos via `hooks.mappings` na configuração. Mapeamentos podem transformar payloads arbitrários em ações `wake` ou `agent` com modelos ou transformações de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantenha endpoints de hook atrás de loopback, tailnet ou proxy reverso confiável.

- Use um token de hook dedicado; não reutilize tokens de autenticação do Gateway.
- Mantenha `hooks.path` em um subcaminho dedicado; `/` é rejeitado.
- Defina `hooks.allowedAgentIds` para limitar qual agente efetivo um hook pode atingir, incluindo o agente padrão quando `agentId` for omitido.
- Mantenha `hooks.allowRequestSessionKey=false`, a menos que você precise de sessões selecionadas pelo chamador.
- Se habilitar `hooks.allowRequestSessionKey`, também defina `hooks.allowedSessionKeyPrefixes` para restringir formatos permitidos de chave de sessão.
- Payloads de hook são envolvidos por limites de segurança por padrão.

</Warning>

## Integração do Gmail PubSub

Conecte gatilhos da caixa de entrada do Gmail ao OpenClaw via Google PubSub.

<Note>
**Pré-requisitos:** CLI `gcloud`, `gog` (gogcli), hooks do OpenClaw habilitados, Tailscale para o endpoint HTTPS público.
</Note>

### Configuração por assistente (recomendada)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Isso grava a configuração `hooks.gmail`, habilita a predefinição do Gmail e usa o Tailscale Funnel para o endpoint de push.

### Inicialização automática do Gateway

Quando `hooks.enabled=true` e `hooks.gmail.account` está definido, o Gateway inicia `gog gmail watch serve` na inicialização e renova automaticamente o watch. Defina `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desativar.

### Configuração manual única

<Steps>
  <Step title="Selecione o projeto do GCP">
    Selecione o projeto do GCP que possui o cliente OAuth usado por `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Crie o tópico e conceda acesso de push ao Gmail">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Inicie o watch">
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

`openclaw cron run <jobId>` retorna depois de enfileirar a execução manual. Use `--wait` para hooks de desligamento, scripts de manutenção ou outras automações que precisam bloquear até que a execução enfileirada termine. O modo de espera consulta o `runId` exato retornado; ele sai com `0` para o status `ok` e diferente de zero para `error`, `skipped` ou um timeout de espera.

A ferramenta de agente `cron` retorna resumos compactos de tarefas (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) a partir de `cron(action: "list")`; use `cron(action: "get", jobId: "...")` para uma definição completa de tarefa. Chamadores diretos do Gateway podem passar `compact: true` para `cron.list`; omitir isso preserva a resposta completa existente com previsualizações de entrega.

`openclaw cron create` é um alias de `openclaw cron add`, e novas tarefas podem usar uma agenda posicional (`"0 9 * * 1"`, `"every 1h"`, `"20m"` ou um timestamp ISO) seguida por um prompt posicional do agente. Use `--webhook <url>` em `cron add|create` ou `cron edit` para fazer POST do payload da execução concluída para um endpoint HTTP. A entrega por Webhook não pode ser combinada com flags de entrega por chat, como `--announce`, `--channel`, `--to`, `--thread-id` ou `--account`. Em `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` e `--clear-account` removem esses campos de roteamento individualmente (cada um é rejeitado junto com sua flag de definição correspondente), o que é diferente de `--no-deliver` desabilitar a entrega de fallback do executor.

<Note>
Observação sobre substituição de modelo:

- `openclaw cron add|edit --model ...` altera o modelo selecionado da tarefa.
- Se o modelo for permitido, esse provedor/modelo exato chega à execução isolada do agente.
- Se ele não for permitido ou não puder ser resolvido, o Cron falha a execução com um erro de validação explícito.
- Patches de payload da API `cron.update` podem definir `model: null` para limpar uma substituição de modelo armazenada da tarefa.
- `openclaw cron edit <job-id> --clear-model` limpa essa substituição pela CLI (mesmo efeito do patch `model: null`) e não pode ser combinado com `--model`.
- Cadeias de fallback configuradas ainda se aplicam porque `--model` do Cron é um modelo primário da tarefa, não uma substituição de sessão `/model`.
- `openclaw cron add|edit --fallbacks ...` define o payload `fallbacks`, substituindo os fallbacks configurados para essa tarefa; `--fallbacks ""` desabilita fallback e torna a execução estrita. `openclaw cron edit <job-id> --clear-fallbacks` limpa a substituição por tarefa.
- Um `--model` simples sem lista de fallback explícita ou configurada não recai para o modelo primário do agente como um destino extra silencioso de nova tentativa.

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

`maxConcurrentRuns` limita tanto o despacho agendado do Cron quanto a execução isolada de turnos de agente, e o padrão é 8. Turnos isolados de agente do Cron usam internamente a pista de execução dedicada `cron-nested` da fila, portanto aumentar esse valor permite que execuções independentes de LLM do Cron avancem em paralelo em vez de apenas iniciar seus wrappers externos de Cron. A pista compartilhada não Cron `nested` não é ampliada por essa configuração.

`cron.store` é uma chave lógica de armazenamento e caminho legado de importação do doctor. Execute `openclaw doctor --fix` para importar armazenamentos JSON existentes para o SQLite e arquivá-los; alterações futuras de Cron devem passar pela CLI ou pela API do Gateway.

Desabilitar Cron: `cron.enabled: false` ou `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportamento de repetição">
    **Repetição única**: erros transitórios (limite de taxa, sobrecarga, rede, erro de servidor) repetem até 3 vezes com backoff exponencial. Erros permanentes desabilitam imediatamente.

    **Repetição recorrente**: backoff exponencial (30s a 60m) entre tentativas. O backoff é redefinido após a próxima execução bem-sucedida.

  </Accordion>
  <Accordion title="Manutenção">
    `cron.sessionRetention` (padrão `24h`) remove entradas de sessão de execução isolada antigas. `cron.runLog.keepLines` limita as linhas retidas do histórico de execução SQLite por tarefa; `maxBytes` é mantido para compatibilidade de configuração com logs de execução mais antigos baseados em arquivo.
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
    - Para agendas `cron`, verifique o fuso horário (`--tz`) em relação ao fuso horário do host.
    - `reason: not-due` na saída da execução significa que a execução manual foi verificada com `openclaw cron run <jobId> --due` e a tarefa ainda não estava vencida.

  </Accordion>
  <Accordion title="Cron disparou, mas não houve entrega">
    - O modo de entrega `none` significa que nenhum envio de fallback do executor é esperado. O agente ainda pode enviar diretamente com a ferramenta `message` quando uma rota de chat está disponível.
    - Destino de entrega ausente/inválido (`channel`/`to`) significa que o envio foi ignorado.
    - Para Matrix, tarefas copiadas ou legadas com IDs de sala `delivery.to` em minúsculas podem falhar porque IDs de sala do Matrix diferenciam maiúsculas de minúsculas. Edite a tarefa para o valor exato `!room:server` ou `room:!room:server` do Matrix.
    - Erros de autenticação de canal (`unauthorized`, `Forbidden`) significam que a entrega foi bloqueada por credenciais.
    - Se a execução isolada retornar apenas o token silencioso (`NO_REPLY` / `no_reply`), o OpenClaw suprime a entrega direta de saída e também suprime o caminho de resumo enfileirado de fallback, então nada é publicado de volta no chat.
    - Se o agente deve enviar mensagem ao usuário por conta própria, verifique se a tarefa tem uma rota utilizável (`channel: "last"` com um chat anterior, ou um canal/destino explícito).

  </Accordion>
  <Accordion title="Cron ou Heartbeat parece impedir rollover estilo /new">
    - A atualização diária e por inatividade não se baseia em `updatedAt`; consulte [Gerenciamento de sessão](/pt-BR/concepts/session#session-lifecycle).
    - Despertares do Cron, execuções de Heartbeat, notificações de exec e contabilidade do Gateway podem atualizar a linha de sessão para roteamento/status, mas não estendem `sessionStartedAt` nem `lastInteractionAt`.
    - Para linhas legadas criadas antes de esses campos existirem, o OpenClaw pode recuperar `sessionStartedAt` do cabeçalho de sessão JSONL da transcrição quando o arquivo ainda está disponível. Linhas legadas inativas sem `lastInteractionAt` usam esse horário de início recuperado como sua linha de base de inatividade.

  </Accordion>
  <Accordion title="Pegadinhas de fuso horário">
    - Cron sem `--tz` usa o fuso horário do host do gateway.
    - Agendas `at` sem fuso horário são tratadas como UTC.
    - `activeHours` do Heartbeat usa a resolução de fuso horário configurada.

  </Accordion>
</AccordionGroup>

## Relacionados

- [Automação](/pt-BR/automation) — todos os mecanismos de automação em um relance
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — livro-razão de tarefas para execuções do Cron
- [Heartbeat](/pt-BR/gateway/heartbeat) — turnos periódicos da sessão principal
- [Fuso horário](/pt-BR/concepts/timezone) — configuração de fuso horário
