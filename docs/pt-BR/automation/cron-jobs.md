---
read_when:
    - Agendamento de tarefas em segundo plano ou despertares
    - Conectando gatilhos externos (webhooks, Gmail) ao OpenClaw
    - Como decidir entre Heartbeat e Cron para tarefas agendadas
sidebarTitle: Scheduled tasks
summary: Tarefas agendadas, webhooks e gatilhos do Gmail PubSub para o agendador do Gateway
title: Tarefas agendadas
x-i18n:
    generated_at: "2026-07-16T12:07:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9a419d4376fa08df1c429c167ead6918262cc34b986a85ffec024023f6da1eef
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron é o agendador integrado do Gateway. Ele persiste tarefas, desperta o agente no momento certo e pode entregar a saída a um canal de chat, a um webhook ou a lugar nenhum.

## Início rápido

<Steps>
  <Step title="Adicionar um lembrete de execução única">
    ```bash
    openclaw cron create "2027-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Verificar suas tarefas">
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

## Como o cron funciona

- O Cron é executado **dentro do processo do Gateway**, não dentro do modelo. O Gateway deve estar em execução para que os agendamentos sejam acionados.
- As definições das tarefas, o estado de execução e o histórico de execuções persistem no banco de dados SQLite de estado compartilhado do OpenClaw, portanto as reinicializações não causam a perda dos agendamentos.
- Cada execução do cron cria um registro de [tarefa em segundo plano](/pt-BR/automation/tasks).
- Tarefas de execução única (`--at`) são excluídas automaticamente após a conclusão bem-sucedida por padrão; passe `--keep-after-run` para mantê-las.
- Limite de tempo de relógio por execução: `--timeout-seconds`, quando definido. Caso contrário, tarefas de turno do agente isoladas/desanexadas são limitadas pelo próprio watchdog de 60 minutos do cron antes que o tempo limite subjacente do turno do agente (`agents.defaults.timeoutSeconds`, 48 horas por padrão) chegue a ser aplicado; tarefas de comando têm um limite padrão de 10 minutos.
- Na inicialização do Gateway, tarefas de turno do agente isoladas e atrasadas são reagendadas em vez de reproduzidas imediatamente, mantendo o trabalho de inicialização do modelo/das ferramentas fora da janela de conexão do canal.
- Se você acionar `openclaw agent` pelo cron do sistema ou por outro agendador externo, envolva-o com um escalonamento de encerramento forçado, embora a CLI já trate `SIGTERM`/`SIGINT`. Execuções respaldadas pelo Gateway solicitam que o Gateway aborte as execuções aceitas; execuções locais e alternativas incorporadas recebem o mesmo sinal de interrupção. Para o `timeout` GNU, prefira `timeout -k 60 600 openclaw agent ...` em vez de apenas `timeout 600 ...` — o valor `-k` é a salvaguarda caso o processo não consiga concluir a drenagem a tempo. Para unidades systemd, use um sinal de parada `SIGTERM` com uma janela de tolerância (`TimeoutStopSec`) antes do encerramento final. Reutilizar um `--run-id` enquanto a execução original do Gateway ainda estiver ativa relata a duplicata como em andamento em vez de iniciar uma segunda execução.

<AccordionGroup>
  <Accordion title="Proteção de execuções isoladas">
    - Ao serem concluídas, as execuções isoladas fazem o possível para fechar as guias/processos de navegador rastreados de sua sessão `cron:<jobId>` e descartam todas as instâncias de runtime MCP incluídas que tenham sido criadas para a tarefa, usando o mesmo caminho de desmontagem compartilhado empregado pelas execuções da sessão principal e de sessões personalizadas. Falhas na limpeza são ignoradas para que o resultado do cron continue prevalecendo.
    - Execuções isoladas com a concessão restrita de autolimpeza do cron podem ler o status do agendador, uma lista filtrada que contém somente sua própria tarefa e o histórico de execuções dessa tarefa, e podem remover somente sua própria tarefa.
    - Execuções isoladas se protegem contra respostas de confirmação obsoletas: se o primeiro resultado for apenas uma atualização provisória de status (`on it`, `pulling everything together` e indícios semelhantes) e nenhum subagente descendente ainda for responsável pela resposta final, o OpenClaw solicita novamente, uma vez, o resultado efetivo antes da entrega.
    - Metadados estruturados de negação de execução (incluindo wrappers `UNAVAILABLE` do host do Node cujo erro aninhado começa com `SYSTEM_RUN_DENIED` ou `INVALID_REQUEST`) são reconhecidos para que um comando bloqueado não seja relatado como uma execução bem-sucedida, enquanto textos comuns do assistente não sejam confundidos com uma negação.
    - Falhas do agente no nível da execução contam como erros da tarefa mesmo sem um payload de resposta, portanto falhas do modelo/provedor incrementam os contadores de erros e acionam notificações de falha em vez de concluir a tarefa como bem-sucedida.
    - Quando uma tarefa atinge `timeoutSeconds`, o cron aborta a execução e concede uma breve janela de limpeza. Se ela não for drenada, a limpeza sob responsabilidade do Gateway remove à força a propriedade da sessão dessa execução antes que o cron registre o tempo limite, para que o trabalho de chat na fila não fique retido atrás de uma sessão de processamento obsoleta.
    - Travamentos na configuração/inicialização recebem um tempo limite específico da fase (por exemplo, `cron: isolated agent setup timed out before runner start` ou `cron: isolated agent run stalled before execution start (last phase: context-engine)`). Esses watchdogs abrangem provedores incorporados e respaldados pela CLI mesmo antes de o processo externo da CLI ser iniciado e são limitados independentemente de valores `timeoutSeconds` longos, para que falhas de inicialização a frio/autenticação/contexto sejam reveladas rapidamente.

  </Accordion>
  <Accordion title="Reconciliação de tarefas">
    A reconciliação de tarefas do cron é controlada primeiro pelo runtime e respaldada em segundo lugar pelo histórico durável: uma tarefa ativa do cron permanece ativa enquanto o runtime do cron ainda rastrear essa tarefa como em execução, mesmo que ainda exista uma linha antiga de sessão filha. Assim que o runtime deixa de controlar a tarefa e uma janela de tolerância de 5 minutos expira, as verificações de manutenção consultam os logs persistidos de execução e o estado da tarefa para a execução `cron:<jobId>:<startedAt>` correspondente. Um resultado terminal encontrado ali finaliza o registro contábil da tarefa; caso contrário, a manutenção sob responsabilidade do Gateway pode marcar a tarefa como `lost`. A auditoria offline da CLI pode recuperar informações do histórico durável, mas o próprio conjunto vazio de tarefas ativas no processo não comprova que uma execução sob responsabilidade do Gateway deixou de existir.
  </Accordion>
</AccordionGroup>

## Tipos de agendamento

| Tipo      | Flag da CLI    | Descrição                                                                                              |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`      | Carimbo de data e hora de execução única (ISO 8601 ou relativo, como `20m`)                                                     |
| `every`   | `--every`   | Intervalo fixo (`10m`, `1h`, `1d`)                                                                       |
| `cron`    | `--cron`    | Expressão cron de 5 ou 6 campos com `--tz` opcional                                                  |
| `on-exit` | `--on-exit` | Aciona uma vez quando um comando monitorado é encerrado (gatilho de evento; sobrevive à desmontagem do turno; `--on-exit-cwd` opcional) |

Carimbos de data e hora sem fuso horário são tratados como UTC. Adicione `--tz America/New_York` para interpretar uma data e hora `--at` sem deslocamento, ou para avaliar uma expressão cron, nesse fuso horário da IANA. Expressões cron sem `--tz` usam o fuso horário do host do Gateway. `--tz` não é válido com `--every` ou `--on-exit`.

Expressões recorrentes no início da hora (minuto `0` com um campo de hora curinga) são automaticamente distribuídas em até 5 minutos para reduzir picos de carga. Use `--exact` para forçar uma temporização precisa ou `--stagger 30s` para definir uma janela explícita (somente para agendamentos cron).

### Dia do mês e dia da semana usam lógica OR

As expressões cron são analisadas pelo [croner](https://github.com/Hexagon/croner). Quando os campos de dia do mês e dia da semana não são curingas, o croner encontra uma correspondência quando **qualquer um** dos campos corresponde, não ambos. Esse é o comportamento padrão do cron Vixie.

```bash
# Pretendido: "9h do dia 15, somente se for uma segunda-feira"
# Real:      "9h de todo dia 15 E 9h de toda segunda-feira"
0 9 15 * 1
```

Isso é acionado aproximadamente 5 a 6 vezes por mês, em vez de 0 a 1 vez por mês. Para exigir ambas as condições, use o modificador de dia da semana `+` do croner (`0 9 15 * +1`) ou agende por um campo e verifique o outro no prompt ou comando da tarefa.

## Gatilhos de evento (monitores de condição)

Um gatilho de evento adiciona um script de condição sem interface a um agendamento `every` ou `cron`. O Cron avalia o script quando chega o momento da tarefa e executa o payload normal somente quando o script retorna `fire: true`:

```json5
{
  schedule: { kind: "every", everyMs: 30000 },
  trigger: {
    // Dispara somente quando o status observado difere da última avaliação.
    script: "const res = await tools.call('exec', { command: 'gh pr checks 123 --json state -q \\'.[].state\\' | sort -u' }); const status = String(res?.result?.details?.aggregated ?? '').trim(); json({ fire: status !== trigger.state?.status, message: `CI da PR 123: ${trigger.state?.status ?? 'desconhecido'} -> ${status}`, state: { status } });",
    once: false,
  },
  payload: { kind: "agentTurn", message: "Investigue a mudança de status da CI." },
}
```

O script deve retornar `{ fire, message?, state? }`. O estado JSON anterior está disponível como o `trigger.state`, profundamente congelado; retorne um novo valor `state` para persistir esse estado. O estado é limitado a 16 KB. Quando um resultado de acionamento inclui `message`, o cron o acrescenta ao texto do evento do sistema ou à mensagem do turno do agente antes da execução. `once: true` desativa a tarefa após a primeira execução bem-sucedida de seu payload acionado.

`fire: false` persiste o estado e os contadores da avaliação e então reagenda sem criar um histórico de execução. Se a execução de um payload acionado falhar, o `state` retornado **não** será persistido — a próxima avaliação verá o estado anterior e poderá ser acionada novamente; portanto, escreva scripts como verificações somente leitura e mantenha as ações no payload. Os agendamentos de gatilho têm um intervalo mínimo configurável (30 segundos por padrão). Cada avaliação tem um limite de tempo de relógio de 30 segundos e até 5 chamadas de ferramentas.

<Warning>
Ativar `cron.triggers.enabled` permite que scripts criados pelo agente sejam executados sem interface com a **política completa de ferramentas do agente proprietário, incluindo `exec`**. Trate isso como uma execução de código não supervisionada com as permissões desse agente; mantenha essa opção desativada, a menos que todos os agentes autorizados a criar tarefas cron sejam considerados confiáveis para isso.
</Warning>

Crie um monitor a partir de um arquivo de script local (`-` lê o script da entrada padrão):

```bash
openclaw cron add \
  --name "PR CI watcher" \
  --every 30s \
  --trigger-script ./watch-pr-ci.js \
  --message "Respond to the CI status change" \
  --session isolated
```

## Payloads

Cada tarefa contém exatamente um tipo de payload, escolhido pela flag:

| Payload       | Flag                                           | Execução                                                    |
| ------------- | ---------------------------------------------- | ------------------------------------------------------- |
| Evento do sistema  | `--system-event <text>`                        | Colocado na fila da sessão principal, sem chamada ao modelo por si só |
| Mensagem do agente | `--message <text>`                             | Um turno do agente respaldado por modelo                               |
| Comando       | `--command <shell>` ou `--command-argv <json>` | Um shell/processo no host do Gateway, sem chamada ao modelo      |

### Opções de turno do agente

<ParamField path="--message" type="string" required>
  Texto do prompt (obrigatório para tarefas isoladas, da sessão atual ou de sessão personalizada).
</ParamField>
<ParamField path="--model" type="string">
  Substituição do modelo; deve ser resolvida para um modelo permitido, ou a execução falhará com um erro de validação.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Lista de modelos de fallback por tarefa, por exemplo, `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`. Passe `--fallbacks ""` para uma execução estrita sem fallbacks.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Em `cron edit`, remove a substituição de fallback por tarefa para que a tarefa siga a precedência de fallback configurada. Não pode ser combinado com `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Em `cron edit`, remove a substituição de modelo por tarefa para que a tarefa siga a precedência normal de modelos do Cron (substituição armazenada da sessão do Cron ou, caso contrário, modelo do agente/padrão). Não pode ser combinado com `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Substituição do nível de raciocínio (`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`). Os níveis disponíveis ainda dependem do modelo selecionado e do runtime do agente.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Em `cron edit`, remove a substituição de raciocínio por tarefa. Não pode ser combinado com `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Ignora a injeção de arquivos de inicialização do workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Restringe quais ferramentas a tarefa pode usar, por exemplo, `--tools exec,read`.
</ParamField>

`--model` define o modelo principal da tarefa; ele não substitui uma substituição `/model` da sessão, portanto, as cadeias de fallback configuradas continuam sendo aplicadas sobre ele. Um modelo não resolvido ou não permitido faz a execução falhar com um erro de validação explícito, em vez de recorrer silenciosamente ao padrão. Se uma tarefa tiver `--model`, mas nenhuma lista de fallback explícita ou configurada, o OpenClaw passará uma substituição de fallback vazia, em vez de adicionar silenciosamente o modelo principal do agente como um destino oculto para novas tentativas.

Precedência da seleção de modelos para tarefas isoladas, da mais alta para a mais baixa:

1. Payload por tarefa `model` (configuração explícita; um modelo não permitido faz a execução falhar)
2. Substituição de modelo do hook do Gmail (somente quando a execução veio do Gmail e essa substituição é permitida)
3. Substituição de modelo armazenada da sessão do Cron selecionada pelo usuário
4. Seleção do modelo do agente/padrão

O modo rápido segue a seleção ativa resolvida. Se a configuração do modelo selecionado tiver `params.fastMode`, o Cron isolado o usará por padrão; uma substituição armazenada da sessão `fastMode` (e, em seguida, uma `fastModeDefault` do agente) ainda prevalecerá sobre a configuração do modelo em qualquer direção. O modo automático usa o limite `params.fastAutoOnSeconds` do modelo, com o padrão de 60 segundos.

Se uma execução atingir uma transferência de troca de modelo em tempo real, o Cron tentará novamente com o provedor/modelo alterado e manterá essa seleção (e qualquer novo perfil de autenticação) durante a execução ativa. As novas tentativas são limitadas: após a tentativa inicial e mais 2 tentativas de troca, o Cron é interrompido em vez de entrar em loop.

Antes do início de uma execução isolada, o OpenClaw verifica endpoints locais acessíveis para provedores `api: "ollama"` e `api: "openai-completions"` configurados cujo `baseUrl` seja loopback, rede privada ou `.local`. Essa verificação preliminar percorre a cadeia de fallback configurada da tarefa e somente marca a execução como `skipped` quando todos os candidatos estão inacessíveis; `--fallbacks ""` mantém esse percurso estritamente restrito ao modelo principal. Um endpoint indisponível registra a execução como `skipped` com um erro claro, em vez de iniciar uma chamada de modelo. O resultado é armazenado em cache por 5 minutos por endpoint (não por tarefa ou modelo), portanto, muitas tarefas programadas que compartilham um servidor local Ollama/vLLM/SGLang/LM Studio indisponível geram uma única sondagem, em vez de uma tempestade de solicitações. Execuções ignoradas pela verificação preliminar não incrementam o recuo por erro de execução; defina `failureAlert.includeSkipped` para habilitar alertas repetidos de execuções ignoradas.

### Payloads de comando

Os payloads de comando executam scripts determinísticos dentro do agendador do Gateway sem iniciar um turno baseado em modelo. Eles são executados no host do Gateway, capturam stdout/stderr, registram a execução no histórico do Cron e reutilizam os mesmos modos de entrega `announce`, `webhook` e `none` das tarefas de turno do agente.

<Note>
O Cron de comandos é uma superfície de automação administrativa do Gateway para operadores, não uma chamada `tools.exec` do agente. Criar, atualizar, remover ou executar manualmente tarefas do Cron exige `operator.admin`; posteriormente, as execuções de comandos agendadas são realizadas dentro do processo do Gateway como essa automação criada pelo administrador. A política de execução do agente (`tools.exec.mode`, prompts de aprovação e listas de ferramentas permitidas por agente) rege as ferramentas de execução visíveis ao modelo, não os payloads do Cron de comandos.
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

`--command <shell>` armazena `argv: ["sh", "-lc", <shell>]`. Use `--command-argv '["node","scripts/report.mjs"]'` para a execução exata de argv sem análise pelo shell. Os parâmetros opcionais `--command-env KEY=VALUE` (repetível), `--command-input`, `--timeout-seconds` (padrão de 10 minutos), `--no-output-timeout-seconds` e `--output-max-bytes` controlam o ambiente do processo, stdin e os limites de saída.

O texto entregue é derivado da saída do processo: stdout não vazio prevalece; se stdout estiver vazio e stderr não estiver, stderr será entregue; se ambos estiverem presentes, o Cron enviará um pequeno bloco `stdout:` / `stderr:`. O código de saída `0` registra a execução como `ok`; uma saída diferente de zero, um sinal, um tempo limite ou um tempo limite sem saída registra `error` e pode acionar alertas de falha. Um comando que imprime somente `NO_REPLY` usa a supressão normal do token silencioso do Cron e não publica nada no chat.

## Estilos de execução

| Estilo          | Valor de `--session` | Executado em                      | Mais adequado para                    |
| --------------- | --------------------------- | --------------------------------- | ------------------------------------- |
| Sessão principal | `main`          | Faixa dedicada de ativação do Cron | Lembretes, eventos do sistema          |
| Isolado         | `isolated`           | `cron:<jobId>` dedicado       | Relatórios, tarefas de segundo plano   |
| Sessão atual    | `current`           | Vinculada no momento da criação   | Trabalho recorrente sensível ao contexto |
| Sessão personalizada | `session:custom-id`       | Sessão nomeada persistente        | Fluxos de trabalho que usam o histórico |

<AccordionGroup>
  <Accordion title="Sessão principal vs. isolada vs. personalizada">
    As tarefas da **sessão principal** enfileiram um evento do sistema em uma faixa de execução pertencente ao Cron e, opcionalmente, ativam o Heartbeat (`--wake now` ou `--wake next-heartbeat`). Elas podem usar o último contexto de entrega da sessão principal de destino para respostas, mas não adicionam turnos rotineiros do Cron à faixa de chat humano nem estendem a validade da redefinição diária/por inatividade da sessão de destino. As tarefas **isoladas** executam um turno dedicado do agente com uma nova sessão. As **sessões personalizadas** (`session:xxx`) mantêm o contexto entre execuções, possibilitando fluxos de trabalho, como reuniões diárias de alinhamento, que se baseiam em resumos anteriores.

    Os eventos do Cron da sessão principal são lembretes autocontidos de eventos do sistema. Eles não incluem automaticamente a instrução "Read HEARTBEAT.md" do prompt padrão do Heartbeat; declare isso explicitamente no texto do evento do Cron caso um lembrete deva consultar `HEARTBEAT.md`.

  </Accordion>
  <Accordion title="O que significa 'nova sessão' para tarefas isoladas">
    Um novo ID de transcrição/sessão por execução. O OpenClaw mantém preferências seguras (configurações de raciocínio/modo rápido/nível de detalhes, rótulos e substituições explícitas de modelo/autenticação selecionadas pelo usuário), mas não herda o contexto de conversa ambiente de uma linha anterior do Cron: roteamento de canal/grupo, política de envio ou enfileiramento, elevação, origem ou vinculação do runtime ACP. Use `current` ou `session:<id>` quando uma tarefa recorrente tiver que se basear intencionalmente no mesmo contexto de conversa.
  </Accordion>
  <Accordion title="Entrega de subagente e Discord">
    Quando execuções isoladas do Cron orquestram subagentes, a entrega prioriza a saída final do último descendente em vez de um texto intermediário obsoleto do agente pai. Se os descendentes ainda estiverem em execução, o OpenClaw suprimirá essa atualização parcial do agente pai em vez de anunciá-la.

    Para destinos de anúncio do Discord que aceitam somente texto, o OpenClaw envia uma única vez o texto final canônico do assistente, em vez de reproduzir tanto o texto transmitido/intermediário quanto a resposta final. Mídia e payloads estruturados do Discord continuam sendo entregues separadamente para que anexos e componentes não sejam descartados.

  </Accordion>
</AccordionGroup>

## Entrega e saída

| Modo       | O que acontece                                                               |
| ---------- | ---------------------------------------------------------------------------- |
| `announce` | Entrega como fallback o texto final ao destino caso o agente não o tenha enviado |
| `webhook` | Envia o payload do evento concluído via POST para uma URL                    |
| `none` | Nenhuma entrega de fallback pelo executor                                    |

Use `--announce --channel telegram --to "-1001234567890"` para entrega em canais. Para tópicos de fórum do Telegram, use `-1001234567890:topic:123`; o OpenClaw também aceita a forma abreviada `-1001234567890:123`, pertencente ao Telegram. Chamadores diretos de RPC/configuração podem passar `delivery.threadId` como string ou número. Os destinos do Slack/Discord/Mattermost usam prefixos explícitos (`channel:<id>`, `user:<id>`). Os IDs de sala do Matrix diferenciam maiúsculas de minúsculas; use o ID exato da sala ou a forma `room:!room:server` do Matrix.

Quando a entrega de anúncios usa `channel: "last"` ou omite `channel`, um destino com prefixo de provedor, como `telegram:123`, pode selecionar o canal antes que o Cron recorra ao histórico da sessão ou a um único canal configurado. Somente os prefixos anunciados pelo Plugin carregado funcionam como seletores de provedor. Se `delivery.channel` for explícito, o prefixo do destino deverá indicar o mesmo provedor; `channel: "whatsapp"` com `to: "telegram:123"` será rejeitado, em vez de permitir que o WhatsApp interprete o ID do Telegram como um número de telefone. Os prefixos de tipo de destino e de serviço (`channel:<id>`, `user:<id>`, `imessage:<handle>`, `sms:<number>`) permanecem como sintaxe de destino pertencente ao canal, não como seletores de provedor.

Para tarefas isoladas, a entrega no chat é compartilhada: se houver uma rota de chat disponível, o agente poderá usar a ferramenta `message` mesmo com `--no-deliver`. Se o agente enviar para o destino configurado/atual, o OpenClaw ignorará o anúncio de fallback. Caso contrário, `announce`, `webhook` e `none` controlarão somente o que o executor fará com a resposta final após o turno do agente.

Quando um agente cria um lembrete isolado a partir de um chat ativo, o OpenClaw armazena o destino de entrega ativo preservado para a rota de anúncio de fallback. As chaves internas de sessão podem estar em letras minúsculas; os destinos de entrega do provedor não são reconstruídos a partir dessas chaves quando o contexto atual do chat está disponível.

A entrega implícita de anúncios usa listas de canais permitidos configuradas para validar e redirecionar destinos obsoletos. As aprovações do repositório de pareamento de mensagens diretas não são destinatários de fallback da automação; defina `delivery.to` ou configure a entrada `allowFrom` do canal quando uma tarefa agendada tiver que enviar proativamente para uma mensagem direta.

### Notificações de falha

As notificações de falha seguem um caminho de destino separado:

- `cron.failureDestination` define um padrão global para notificações de falha.
- `job.delivery.failureDestination` substitui esse padrão por tarefa.
- Se nenhum dos dois estiver definido e a tarefa já fizer entregas via `announce`, as notificações de falha usarão como alternativa esse destino principal de anúncio.
- `delivery.failureDestination` só é compatível com tarefas `sessionTarget="isolated"`, a menos que o modo de entrega principal seja `webhook`.
- `failureAlert.includeSkipped: true` inclui uma tarefa ou política global de alertas do cron em alertas repetidos de execuções ignoradas. As execuções ignoradas mantêm um contador separado de omissões consecutivas, portanto não afetam o recuo por erro de execução.
- `openclaw cron edit` disponibiliza ajustes de alerta por tarefa: `--failure-alert`/`--no-failure-alert`, `--failure-alert-after <n>`, `--failure-alert-channel`, `--failure-alert-to`, `--failure-alert-cooldown`, `--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`, `--failure-alert-mode` e `--failure-alert-account-id`.

### Idioma da saída

As tarefas Cron não deduzem um idioma de resposta com base no canal, na localidade ou nas mensagens anteriores. Inclua a regra de idioma na mensagem ou no modelo agendado:

```bash
openclaw cron edit <jobId> \
  --message "Resuma as atualizações. Responda em chinês; mantenha URLs, código e nomes de produtos inalterados."
```

Para arquivos de modelo, mantenha a instrução de idioma no prompt renderizado e verifique se espaços reservados como `{{language}}` estão preenchidos antes da execução da tarefa. Se a saída misturar idiomas, torne a regra explícita, por exemplo: "Use chinês no texto narrativo e mantenha os termos técnicos em inglês."

## Exemplos de CLI

<Tabs>
  <Tab title="Lembrete de execução única">
    ```bash
    openclaw cron add \
      --name "Verificação do calendário" \
      --at "20m" \
      --session main \
      --system-event "Próximo heartbeat: verifique o calendário." \
      --wake now
    ```
  </Tab>
  <Tab title="Tarefa isolada recorrente">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Resuma as atualizações da madrugada." \
      --name "Resumo matinal" \
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
      --name "Análise aprofundada" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Análise aprofundada semanal do progresso do projeto." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Saída de Webhook">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Resuma as implantações de hoje como JSON." \
      --name "Resumo de implantações" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Saída de comando">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Sondagem da profundidade da fila" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Gerenciamento de tarefas

```bash
# Listar todas as tarefas
openclaw cron list

# Obter uma tarefa armazenada como JSON
openclaw cron get <jobId>

# Exibir uma tarefa, incluindo a rota de entrega resolvida
openclaw cron show <jobId>

# Habilitar/desabilitar sem excluir
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# Editar uma tarefa
openclaw cron edit <jobId> --message "Prompt atualizado" --model "opus"

# Forçar a execução imediata de uma tarefa
openclaw cron run <jobId>

# Forçar a execução imediata de uma tarefa e aguardar seu status final
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Executar somente se estiver no prazo
openclaw cron run <jobId> --due

# Ver o histórico de execuções
openclaw cron runs --id <jobId> --limit 50

# Ver uma execução específica
openclaw cron runs --id <jobId> --run-id <runId>

# Excluir uma tarefa
openclaw cron remove <jobId>

# Seleção de agente (configurações com vários agentes)
openclaw cron create "0 6 * * *" "Verifique a fila de operações" --name "Varredura de operações" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

Arquivar uma sessão (pela interface de controle ou por `sessions.patch { archived: true }` de um chamador operador-administrador) desabilita todas as tarefas Cron habilitadas vinculadas a essa sessão: sua sessão isolada `cron:<jobId>`, um destino `session:<key>` ou uma faixa de entrega/ativação `sessionKey`. Restaurar a sessão não reabilita essas tarefas; use `openclaw cron enable <jobId>`. As sessões com uma tarefa vinculada habilitada exibem um emblema de relógio na barra lateral da interface de controle.

`openclaw cron run <jobId>` retorna após enfileirar a execução manual. Use `--wait` para ganchos de desligamento, scripts de manutenção ou outras automações que precisam bloquear até a conclusão da execução enfileirada; ele consulta periodicamente o `runId` retornado (tempo limite padrão de `10m`, intervalo de consulta de `2s`) e encerra com `0` para o status `ok` e com valor diferente de zero para `error`, `skipped` ou tempo limite de espera.

A ferramenta `cron` do agente retorna resumos compactos das tarefas (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) de `cron(action: "list")`; use `cron(action: "get", jobId: "...")` para obter a definição completa de uma tarefa. Chamadores diretos do Gateway podem passar `compact: true` para `cron.list`; omiti-lo preserva a resposta completa com prévias de entrega.

`openclaw cron create` é um alias de `openclaw cron add`. Novas tarefas podem usar um agendamento posicional (`"0 9 * * 1"`, `"every 1h"`, `"20m"` ou um carimbo de data/hora ISO) seguido por um prompt posicional do agente. Use `--webhook <url>` em `cron add|create` ou `cron edit` para enviar por POST a carga útil da execução concluída a um endpoint HTTP; a entrega por Webhook não pode ser combinada com sinalizadores de entrega por chat (`--announce`, `--channel`, `--to`, `--thread-id`, `--account`). Em `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` e `--clear-account`, remova esses campos de roteamento individualmente (cada um é rejeitado junto com seu sinalizador de definição correspondente) — diferentemente de `--no-deliver`, que apenas desabilita a entrega alternativa do executor.

<Note>
Observação sobre substituição de modelo:

- `openclaw cron add|edit --model ...` altera o modelo selecionado da tarefa.
- Se o modelo for permitido, esse provedor/modelo exato chegará à execução isolada do agente.
- Se não for permitido ou não puder ser resolvido, o Cron causará a falha da execução com um erro explícito de validação.
- As atualizações parciais da carga útil de `cron.update` da API podem definir `model: null` para limpar uma substituição de modelo armazenada para a tarefa.
- `openclaw cron edit <job-id> --clear-model` limpa essa substituição pela CLI (o mesmo efeito da atualização parcial `model: null`) e não pode ser combinado com `--model`.
- As cadeias alternativas configuradas continuam sendo aplicadas porque `--model` do Cron é o modelo principal da tarefa, não uma substituição de `/model` da sessão.
- `openclaw cron add|edit --fallbacks ...` define `fallbacks` da carga útil, substituindo as alternativas configuradas para essa tarefa; `--fallbacks ""` desabilita a alternativa e torna a execução estrita. `openclaw cron edit <job-id> --clear-fallbacks` limpa a substituição por tarefa.
- Um `--model` simples, sem uma lista de alternativas explícita ou configurada, não passa silenciosamente para o modelo principal do agente como destino adicional de nova tentativa.

</Note>

## Webhooks

O Gateway pode disponibilizar endpoints HTTP de Webhook para acionadores externos. Habilite-os na configuração:

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

Toda solicitação deve incluir o token do gancho por meio de um cabeçalho:

- `Authorization: Bearer <token>` (recomendado)
- `x-openclaw-token: <token>`

Tokens na string de consulta são rejeitados.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Enfileire um evento do sistema para a sessão principal:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"Novo e-mail recebido","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Descrição do evento.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` ou `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Execute um turno isolado do agente:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Resuma a caixa de entrada","name":"E-mail","model":"openai/gpt-5.6-sol"}'
    ```

    Campos: `message` (obrigatório), `name`, `agentId`, `sessionKey` (requer `hooks.allowRequestSessionKey=true`), `idempotencyKey`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Ganchos mapeados (POST /hooks/<name>)">
    Nomes de ganchos personalizados são resolvidos por meio de `hooks.mappings` na configuração. Os mapeamentos podem transformar cargas úteis arbitrárias em ações `wake` ou `agent` com modelos ou transformações de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantenha os endpoints de ganchos protegidos por loopback, tailnet ou um proxy reverso confiável.

- Use um token exclusivo para ganchos; não reutilize tokens de autenticação do Gateway.
- Mantenha `hooks.path` em um subcaminho exclusivo; `/` é rejeitado.
- Defina `hooks.allowedAgentIds` para limitar quais agentes efetivos um gancho pode usar como destino, incluindo o agente padrão quando `agentId` for omitido.
- Mantenha `hooks.allowRequestSessionKey=false`, a menos que sejam necessárias sessões selecionadas pelo chamador.
- Se habilitar `hooks.allowRequestSessionKey`, defina também `hooks.allowedSessionKeyPrefixes` para restringir os formatos permitidos das chaves de sessão.
- Por padrão, cargas úteis de ganchos são envolvidas por limites de segurança.

</Warning>

## Integração com o Gmail PubSub

Conecte acionadores da caixa de entrada do Gmail ao OpenClaw por meio do Google PubSub.

<Note>
**Pré-requisitos:** CLI `gcloud`, `gog` (gogcli), ganchos do OpenClaw habilitados e Tailscale para o endpoint HTTPS público.
</Note>

### Configuração pelo assistente (recomendado)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Isso grava a configuração `hooks.gmail`, habilita a predefinição do Gmail e usa o Tailscale Funnel por padrão para o endpoint de envio por push (`--tailscale funnel|serve|off`).

<Warning>
A sessão por mensagem da predefinição do Gmail separa o contexto da conversa; ela não restringe as ferramentas nem o espaço de trabalho do agente de destino. Sem um mapeamento personalizado que defina `agentId`, os ganchos do Gmail são executados como o agente padrão.

Para caixas de entrada não confiáveis, encaminhe o gancho para um agente leitor exclusivo, conceda a esse agente acesso somente leitura ou nenhum acesso ao espaço de trabalho e negue ferramentas de gravação no sistema de arquivos, shell, navegador e outras ferramentas desnecessárias. Se ele precisar notificar o agente principal, permita somente a transferência obrigatória entre agentes. Consulte [Injeção de prompt](/pt-BR/gateway/security#prompt-injection), [Sandbox e ferramentas para vários agentes](/pt-BR/tools/multi-agent-sandbox-tools) e [`tools.agentToAgent`](/pt-BR/gateway/config-tools#toolsagenttoagent).
</Warning>

### Inicialização automática do Gateway

Quando `hooks.enabled=true` estiver definido junto com `hooks.gmail.account`, o Gateway iniciará `gog gmail watch serve` durante a inicialização e renovará automaticamente o monitoramento. Defina `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desativar esse comportamento.

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
  <Step title="Crie o tópico e conceda acesso de push do Gmail">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Inicie o monitoramento">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Substituição do modelo do Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openai/gpt-5.6-sol",
      thinking: "high",
    },
  },
}
```

Use o modelo de última geração e da melhor categoria disponível no seu provedor para caixas de entrada não confiáveis. O valor acima é um exemplo; o modelo deve existir no catálogo e na lista de permissões configurados.

## Configuração

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    triggers: {
      enabled: false,
      minIntervalMs: 30000,
    },
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
  },
}
```

Os valores de `retry` acima são os padrões: até 3 novas tentativas com recuo de `30s/60s/5m`, repetindo a tentativa para todas as cinco categorias transitórias. `webhookToken` é enviado como `Authorization: Bearer <token>` nas solicitações POST do Webhook do Cron.

`maxConcurrentRuns` limita tanto o despacho agendado do Cron quanto a execução isolada de turnos do agente, e o padrão é 8. Os turnos isolados do agente do Cron usam internamente a faixa de execução `cron-nested` dedicada da fila; portanto, aumentar esse valor permite que execuções independentes do LLM pelo Cron avancem em paralelo, em vez de iniciar apenas seus wrappers externos do Cron. A faixa compartilhada `nested`, que não pertence ao Cron, não é ampliada por essa configuração.

`cron.store` é uma chave lógica de armazenamento e um caminho de migração do doctor, não um arquivo JSON ativo para edição manual. Os dados dos trabalhos ficam no SQLite; use a CLI ou a API do Gateway para fazer alterações.

Desative o Cron: `cron.enabled: false` ou `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportamento das novas tentativas">
    **Nova tentativa única**: erros transitórios (limite de taxa, sobrecarga, rede, tempo limite, erro do servidor) são repetidos até `retry.maxAttempts` vezes (padrão: 3), usando `retry.backoffMs` (padrão: 30s, 60s, 5m). Erros permanentes desativam o trabalho imediatamente.

    **Nova tentativa recorrente**: erros consecutivos de execução aplicam recuo em uma programação estendida (30s, 60s, 5m, 15m, 60m). O recuo é redefinido após a próxima execução bem-sucedida.

  </Accordion>
  <Accordion title="Manutenção">
    `cron.sessionRetention` (padrão: `24h`; `false` desativa) remove entradas isoladas de sessão de execução. O histórico de execução mantém as 2000 linhas terminais mais recentes por trabalho; linhas perdidas mantêm sua janela de limpeza de 24 horas.
  </Accordion>
  <Accordion title="Migração do armazenamento legado">
    Após a atualização, execute `openclaw doctor --fix` para importar os arquivos legados `~/.openclaw/cron/jobs.json`, `jobs-state.json` e `runs/*.jsonl` para o SQLite e renomeá-los com o sufixo `.migrated`. Linhas de trabalho malformadas são ignoradas pelo runtime e copiadas para `jobs-quarantine.json` para reparo ou revisão posterior.
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
  <Accordion title="O Cron não é acionado">
    - Verifique `cron.enabled` e a variável de ambiente `OPENCLAW_SKIP_CRON`.
    - Confirme se o Gateway está em execução contínua.
    - Para programações `cron`, verifique o fuso horário (`--tz`) em relação ao fuso horário do host.
    - `reason: not-due` na saída da execução significa que a execução manual foi verificada com `openclaw cron run <jobId> --due` e o trabalho ainda não estava no prazo de execução.

  </Accordion>
  <Accordion title="O Cron foi acionado, mas não houve entrega">
    - O modo de entrega `none` significa que nenhum envio de fallback pelo executor é esperado. O agente ainda pode enviar diretamente com a ferramenta `message` quando houver uma rota de chat disponível.
    - Um destino de entrega ausente ou inválido (`channel`/`to`) significa que o envio foi ignorado.
    - No Matrix, trabalhos copiados ou legados com IDs de sala `delivery.to` em letras minúsculas podem falhar porque os IDs de sala do Matrix diferenciam maiúsculas de minúsculas. Edite o trabalho para usar o valor exato de `!room:server` ou `room:!room:server` fornecido pelo Matrix.
    - Erros de autenticação do canal (`unauthorized`, `Forbidden`) significam que a entrega foi bloqueada pelas credenciais.
    - Se a execução isolada retornar apenas o token silencioso (`NO_REPLY` / `no_reply`), o OpenClaw suprimirá a entrega direta de saída e o caminho de fallback do resumo enfileirado; portanto, nada será enviado de volta ao chat.
    - Se o agente precisar enviar uma mensagem ao usuário por conta própria, verifique se o trabalho tem uma rota utilizável (`channel: "last"` com um chat anterior ou um canal/destino explícito).

  </Accordion>
  <Accordion title="O Cron ou o Heartbeat parece impedir uma renovação no estilo /new">
    - O estado recente para redefinições diárias e por inatividade não se baseia em `updatedAt`; consulte [Gerenciamento de sessões](/pt-BR/concepts/session#session-lifecycle).
    - Ativações do Cron, execuções do Heartbeat, notificações de exec e registros administrativos do Gateway podem atualizar a linha da sessão para roteamento/status, mas não estendem `sessionStartedAt` nem `lastInteractionAt`.
    - Para linhas legadas criadas antes da existência desses campos, o OpenClaw pode recuperar `sessionStartedAt` do cabeçalho da sessão no transcript JSONL quando o arquivo ainda estiver disponível. Linhas legadas inativas sem `lastInteractionAt` usam esse horário de início recuperado como referência de inatividade.

  </Accordion>
  <Accordion title="Armadilhas de fuso horário">
    - O Cron sem `--tz` usa o fuso horário do host do Gateway.
    - Programações `at` sem fuso horário são tratadas como UTC.
    - O `activeHours` do Heartbeat usa a resolução de fuso horário configurada.

  </Accordion>
</AccordionGroup>

## Relacionados

- [Automação](/pt-BR/automation) — todos os mecanismos de automação em resumo
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — registro de tarefas para execuções do Cron
- [Heartbeat](/pt-BR/gateway/heartbeat) — turnos periódicos da sessão principal
- [Fuso horário](/pt-BR/concepts/timezone) — configuração de fuso horário
