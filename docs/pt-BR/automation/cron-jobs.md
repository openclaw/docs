---
read_when:
    - Agendamento de tarefas em segundo plano ou despertares
    - Conectando gatilhos externos (webhooks, Gmail) ao OpenClaw
    - Escolhendo entre Heartbeat e Cron para tarefas agendadas
sidebarTitle: Scheduled tasks
summary: Tarefas agendadas, webhooks e gatilhos do Gmail PubSub para o agendador do Gateway
title: Tarefas agendadas
x-i18n:
    generated_at: "2026-07-12T14:51:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dc6ac442b03f892b916cf04695b770bc86ee6b00978b95ffaeb8e6480f5b8af6
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron é o agendador integrado do Gateway. Ele persiste tarefas, desperta o agente no momento certo e pode entregar a saída a um canal de chat, um Webhook ou a lugar nenhum.

## Início rápido

<Steps>
  <Step title="Adicionar um lembrete único">
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

- Cron é executado **dentro do processo do Gateway**, não dentro do modelo. O Gateway deve estar em execução para que os agendamentos sejam acionados.
- As definições das tarefas, o estado de execução e o histórico de execuções persistem no banco de dados SQLite de estado compartilhado do OpenClaw, portanto as reinicializações não perdem os agendamentos.
- Cada execução do cron cria um registro de [tarefa em segundo plano](/pt-BR/automation/tasks).
- As tarefas únicas (`--at`) são excluídas automaticamente após a conclusão bem-sucedida por padrão; passe `--keep-after-run` para mantê-las.
- Orçamento de tempo decorrido por execução: `--timeout-seconds`, quando definido. Caso contrário, as tarefas isoladas/desanexadas de turno do agente são limitadas pelo próprio watchdog de 60 minutos do cron antes que o tempo limite subjacente do turno do agente (`agents.defaults.timeoutSeconds`, padrão de 48 horas) chegue a ser aplicado; as tarefas de comando têm um padrão de 10 minutos.
- Na inicialização do Gateway, as tarefas isoladas de turno do agente atrasadas são reagendadas em vez de reproduzidas imediatamente, mantendo o trabalho de inicialização do modelo e das ferramentas fora da janela de conexão do canal.
- Se você executar `openclaw agent` por meio do cron do sistema ou de outro agendador externo, envolva-o com uma escalada de encerramento forçado, mesmo que a CLI já trate `SIGTERM`/`SIGINT`. As execuções apoiadas pelo Gateway solicitam que o Gateway interrompa as execuções aceitas; as execuções de fallback locais e incorporadas recebem o mesmo sinal de interrupção. Para o `timeout` do GNU, prefira `timeout -k 60 600 openclaw agent ...` em vez de apenas `timeout 600 ...` — o valor de `-k` é a salvaguarda caso o processo não consiga concluir a finalização a tempo. Para unidades do systemd, use um sinal de parada `SIGTERM` com uma janela de tolerância (`TimeoutStopSec`) antes do encerramento final. Reutilizar um `--run-id` enquanto a execução original do Gateway ainda está ativa informa que a duplicata está em andamento, em vez de iniciar uma segunda execução.

<AccordionGroup>
  <Accordion title="Proteção de execuções isoladas">
    - As execuções isoladas tentam, na medida do possível, fechar as abas e os processos do navegador rastreados para sua sessão `cron:<jobId>` ao serem concluídas e descartam quaisquer instâncias de runtime MCP incluídas que tenham sido criadas para a tarefa por meio do mesmo caminho compartilhado de desmontagem usado pelas execuções da sessão principal e de sessões personalizadas. As falhas de limpeza são ignoradas para que o resultado do cron ainda prevaleça.
    - As execuções isoladas com a concessão restrita de autolimpeza do cron podem ler o status do agendador, uma lista filtrada que contém apenas sua própria tarefa e o histórico de execuções dessa tarefa, e podem remover apenas sua própria tarefa.
    - As execuções isoladas se protegem contra respostas de confirmação obsoletas: se o primeiro resultado for apenas uma atualização provisória de status (`on it`, `pulling everything together` e indicações semelhantes) e nenhum subagente descendente ainda for responsável pela resposta final, o OpenClaw solicita novamente, uma única vez, o resultado efetivo antes da entrega.
    - Os metadados estruturados de recusa de execução (incluindo os encapsulamentos `UNAVAILABLE` do host do Node cujo erro aninhado começa com `SYSTEM_RUN_DENIED` ou `INVALID_REQUEST`) são reconhecidos para que um comando bloqueado não seja relatado como uma execução bem-sucedida, enquanto o texto comum do assistente não seja confundido com uma recusa.
    - As falhas do agente no nível da execução contam como erros da tarefa mesmo sem uma carga de resposta, portanto as falhas do modelo/provedor incrementam os contadores de erros e acionam notificações de falha, em vez de marcar a tarefa como bem-sucedida.
    - Quando uma tarefa atinge `timeoutSeconds`, o cron interrompe a execução e concede a ela uma breve janela de limpeza. Se ela não for concluída, a limpeza sob responsabilidade do Gateway remove à força a propriedade da sessão dessa execução antes que o cron registre o tempo limite, para que o trabalho de chat na fila não fique bloqueado por uma sessão de processamento obsoleta.
    - Os travamentos de configuração/inicialização recebem um tempo limite específico da fase (por exemplo, `cron: isolated agent setup timed out before runner start` ou `cron: isolated agent run stalled before execution start (last phase: context-engine)`). Esses watchdogs abrangem provedores incorporados e apoiados pela CLI mesmo antes que o processo externo da CLI seja iniciado e são limitados independentemente de valores longos de `timeoutSeconds`, para que falhas de inicialização a frio, autenticação ou contexto apareçam rapidamente.

  </Accordion>
  <Accordion title="Reconciliação de tarefas">
    A reconciliação de tarefas do cron se baseia primeiro no runtime e, em segundo lugar, no histórico persistente: uma tarefa ativa do cron permanece em execução enquanto o runtime do cron ainda rastreia essa tarefa como em execução, mesmo que ainda exista uma linha antiga de sessão filha. Depois que o runtime deixa de ser responsável pela tarefa e uma janela de tolerância de 5 minutos expira, as verificações de manutenção consultam os logs de execução persistentes e o estado da tarefa para a execução `cron:<jobId>:<startedAt>` correspondente. Um resultado terminal encontrado ali finaliza o registro contábil da tarefa; caso contrário, a manutenção sob responsabilidade do Gateway pode marcar a tarefa como `lost`. A auditoria offline da CLI pode fazer a recuperação com base no histórico persistente, mas seu próprio conjunto vazio de tarefas ativas em processo não comprova que uma execução sob responsabilidade do Gateway tenha desaparecido.
  </Accordion>
</AccordionGroup>

## Tipos de agendamento

| Tipo      | Sinalizador da CLI | Descrição                                                                                                            |
| --------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`             | Carimbo de data e hora de execução única (ISO 8601 ou relativo, como `20m`)                                          |
| `every`   | `--every`          | Intervalo fixo (`10m`, `1h`, `1d`)                                                                                   |
| `cron`    | `--cron`           | Expressão cron de 5 ou 6 campos com `--tz` opcional                                                                  |
| `on-exit` | `--on-exit`        | Dispara uma vez quando um comando monitorado termina (gatilho de evento; persiste após o encerramento do turno; `--on-exit-cwd` opcional) |

Carimbos de data e hora sem fuso horário são tratados como UTC. Adicione `--tz America/New_York` para interpretar uma data e hora de `--at` sem deslocamento ou para avaliar uma expressão cron nesse fuso horário da IANA. Expressões cron sem `--tz` usam o fuso horário do host do Gateway. `--tz` não é válido com `--every` nem `--on-exit`.

Expressões recorrentes no início da hora (minuto `0` com um campo de hora curinga) são automaticamente distribuídas em até 5 minutos para reduzir picos de carga. Use `--exact` para forçar um horário preciso ou `--stagger 30s` para definir uma janela explícita (somente para agendamentos cron).

### O dia do mês e o dia da semana usam lógica OR

As expressões cron são analisadas pelo [croner](https://github.com/Hexagon/croner). Quando os campos de dia do mês e dia da semana não são curingas, o croner considera uma correspondência quando **qualquer um** dos campos corresponde, não ambos. Esse é o comportamento padrão do cron Vixie.

```bash
# Pretendido: "9h no dia 15, somente se for uma segunda-feira"
# Real:      "9h em todo dia 15 E 9h em toda segunda-feira"
0 9 15 * 1
```

Isso é disparado aproximadamente 5-6 vezes por mês, em vez de 0-1 vez por mês. Para exigir ambas as condições, use o modificador de dia da semana `+` do croner (`0 9 15 * +1`) ou agende com base em um campo e verifique o outro no prompt ou comando do seu trabalho.

## Gatilhos de evento (monitores de condição)

Um gatilho de evento adiciona um script de condição sem interface a um agendamento `every` ou `cron`. O Cron avalia o script quando chega o momento de executar o trabalho e executa o payload normal somente quando o script retorna `fire: true`:

```json5
{
  schedule: { kind: "every", everyMs: 30000 },
  trigger: {
    // Dispara somente quando o status observado difere da última avaliação.
    script: "const res = await tools.call('exec', { command: 'gh pr checks 123 --json state -q \\'.[].state\\' | sort -u' }); const status = String(res?.result?.details?.aggregated ?? '').trim(); json({ fire: status !== trigger.state?.status, message: `CI da PR 123: ${trigger.state?.status ?? 'desconhecido'} -> ${status}`, state: { status } });",
    once: false,
  },
  payload: { kind: "agentTurn", message: "Investigue a alteração no status da CI." },
}
```

O script deve retornar `{ fire, message?, state? }`. O estado JSON anterior está disponível como o `trigger.state`, profundamente congelado; retorne um novo valor de `state` para persisti-lo. O estado é limitado a 16 KB. Quando um resultado de disparo inclui `message`, o Cron o acrescenta ao texto do evento do sistema ou à mensagem do turno do agente antes da execução. `once: true` desabilita o trabalho após a primeira execução bem-sucedida do payload disparado.

`fire: false` persiste o estado e os contadores da avaliação e, em seguida, reagenda sem criar histórico de execução. Se a execução de um payload disparado falhar, o `state` retornado **não** será persistido — a próxima avaliação verá o estado anterior e poderá disparar novamente; portanto, escreva os scripts como verificações somente leitura e mantenha as ações no payload. Os agendamentos de gatilhos têm um intervalo mínimo configurável (30 segundos por padrão). Cada avaliação tem um limite de 30 segundos de tempo de relógio e até 5 chamadas de ferramentas.

<Warning>
Habilitar `cron.triggers.enabled` permite que scripts criados por agentes sejam executados sem interface com a **política completa de ferramentas do agente proprietário, incluindo `exec`**. Trate isso como execução de código sem supervisão com as permissões desse agente; mantenha essa opção desabilitada, a menos que todos os agentes autorizados a criar trabalhos Cron sejam considerados confiáveis para isso.
</Warning>

Crie um monitor a partir de um arquivo de script local (`-` lê o script da entrada padrão):

```bash
openclaw cron add \
  --name "Monitor de CI da PR" \
  --every 30s \
  --trigger-script ./watch-pr-ci.js \
  --message "Responda à alteração no status da CI" \
  --session isolated
```

## Payloads

Cada trabalho contém exatamente um tipo de payload, escolhido por flag:

| Payload           | Flag                                           | Execução                                                        |
| ----------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| Evento do sistema | `--system-event <text>`                        | Enfileirado na sessão principal, sem chamada de modelo por si só |
| Mensagem do agente | `--message <text>`                             | Um turno do agente apoiado por modelo                            |
| Comando           | `--command <shell>` ou `--command-argv <json>` | Um shell/processo no host do Gateway, sem chamada de modelo      |

### Opções de turno do agente

<ParamField path="--message" type="string" required>
  Texto do prompt (obrigatório para trabalhos de sessão isolada/atual/personalizada).
</ParamField>
<ParamField path="--model" type="string">
  Substituição do modelo; deve ser resolvida para um modelo permitido, ou a execução falhará com um erro de validação.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Lista de modelos de fallback por trabalho, por exemplo, `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`. Passe `--fallbacks ""` para uma execução estrita sem fallbacks.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Em `cron edit`, remove a substituição de fallback por trabalho para que o trabalho siga a precedência de fallback configurada. Não pode ser combinado com `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Em `cron edit`, remove a substituição de modelo por trabalho para que o trabalho siga a precedência normal de modelos do Cron (substituição armazenada da sessão do Cron ou, caso contrário, modelo do agente/padrão). Não pode ser combinado com `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Substituição do nível de raciocínio (`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`). Os níveis disponíveis ainda dependem do modelo selecionado e do runtime do agente.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Em `cron edit`, remove a substituição de raciocínio por trabalho. Não pode ser combinado com `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Ignora a injeção de arquivos de inicialização do workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Restringe quais ferramentas o trabalho pode usar, por exemplo, `--tools exec,read`.
</ParamField>

`--model` define o modelo principal do job; ele não substitui uma sobrescrição de `/model` da sessão, portanto as cadeias de fallback configuradas continuam sendo aplicadas sobre ele. Um modelo não resolvido ou não permitido faz a execução falhar com um erro explícito de validação, em vez de recorrer silenciosamente ao padrão. Se um job tiver `--model`, mas nenhuma lista de fallback explícita ou configurada, o OpenClaw passará uma sobrescrição de fallback vazia, em vez de adicionar silenciosamente o modelo principal do agente como um destino oculto de nova tentativa.

Precedência de seleção de modelo para jobs isolados, da mais alta para a mais baixa:

1. `model` da carga útil específica do job (configuração explícita; um modelo não permitido faz a execução falhar)
2. Sobrescrição do modelo pelo hook do Gmail (somente quando a execução se originou no Gmail e essa sobrescrição é permitida)
3. Sobrescrição do modelo da sessão Cron armazenada e selecionada pelo usuário
4. Seleção do modelo do agente/padrão

O modo rápido segue a seleção ativa resolvida. Se a configuração do modelo selecionado tiver `params.fastMode`, o Cron isolado a usará por padrão; uma sobrescrição `fastMode` armazenada na sessão (seguida por um `fastModeDefault` do agente) ainda prevalece sobre a configuração do modelo em qualquer direção. O modo automático usa o limite `params.fastAutoOnSeconds` do modelo, com valor padrão de 60 segundos.

Se uma execução encontrar uma transferência ativa de troca de modelo, o Cron tentará novamente com o provedor/modelo alternado e persistirá essa seleção (e qualquer novo perfil de autenticação) para a execução ativa. As novas tentativas são limitadas: após a tentativa inicial e mais 2 novas tentativas de troca, o Cron será interrompido em vez de entrar em loop.

Antes do início de uma execução isolada, o OpenClaw verifica os endpoints locais acessíveis dos provedores configurados com `api: "ollama"` e `api: "openai-completions"` cujo `baseUrl` seja de loopback, rede privada ou `.local`. Essa verificação preliminar percorre a cadeia de fallback configurada do job e somente marca a execução como `skipped` quando todos os candidatos estão inacessíveis; `--fallbacks ""` restringe estritamente essa verificação apenas ao modelo principal. Um endpoint indisponível registra a execução como `skipped` com um erro claro, em vez de iniciar uma chamada ao modelo. O resultado é armazenado em cache por 5 minutos por endpoint (não por job ou modelo), de modo que muitos jobs agendados que compartilham um servidor local Ollama/vLLM/SGLang/LM Studio indisponível gerem uma única sondagem, em vez de uma enxurrada de solicitações. Execuções ignoradas na verificação preliminar não incrementam o recuo por erro de execução; defina `failureAlert.includeSkipped` para optar por alertas repetidos de execuções ignoradas.

### Cargas úteis de comando

As cargas úteis de comando executam scripts determinísticos dentro do agendador do Gateway sem iniciar um turno apoiado por modelo. Elas são executadas no host do Gateway, capturam stdout/stderr, registram a execução no histórico do Cron e reutilizam os mesmos modos de entrega `announce`, `webhook` e `none` dos jobs de turno do agente.

<Note>
O Cron de comandos é uma superfície de automação administrativa do Gateway para operadores, não uma chamada `tools.exec` de agente. Criar, atualizar, remover ou executar manualmente jobs do Cron exige `operator.admin`; posteriormente, as execuções de comandos agendadas são realizadas dentro do processo do Gateway como essa automação criada pelo administrador. A política de execução do agente (`tools.exec.mode`, solicitações de aprovação, listas de ferramentas permitidas por agente) rege as ferramentas de execução visíveis ao modelo, não as cargas úteis do Cron de comandos.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Sondagem da profundidade da fila" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` armazena `argv: ["sh", "-lc", <shell>]`. Use `--command-argv '["node","scripts/report.mjs"]'` para uma execução exata de argv sem análise pelo shell. Os parâmetros opcionais `--command-env KEY=VALUE` (repetível), `--command-input`, `--timeout-seconds` (padrão de 10 minutos), `--no-output-timeout-seconds` e `--output-max-bytes` controlam o ambiente do processo, a entrada padrão e os limites de saída.

O texto entregue é derivado da saída do processo: stdout não vazio prevalece; se stdout estiver vazio e stderr não estiver vazio, stderr será entregue; se ambos estiverem presentes, o Cron enviará um pequeno bloco `stdout:` / `stderr:`. O código de saída `0` registra a execução como `ok`; uma saída diferente de zero, um sinal, um tempo limite ou um tempo limite sem saída registra `error` e pode acionar alertas de falha. Um comando que exiba apenas `NO_REPLY` usará a supressão normal do token silencioso do Cron e não publicará nada no chat.

## Estilos de execução

| Estilo          | Valor de `--session` | Executado em                      | Mais indicado para                         |
| --------------- | -------------------- | --------------------------------- | ------------------------------------------ |
| Sessão principal | `main`              | Faixa de ativação dedicada do Cron | Lembretes, eventos do sistema              |
| Isolado         | `isolated`           | `cron:<jobId>` dedicado           | Relatórios, tarefas de rotina em segundo plano |
| Sessão atual    | `current`            | Vinculada no momento da criação   | Trabalho recorrente sensível ao contexto   |
| Sessão personalizada | `session:custom-id` | Sessão nomeada persistente      | Fluxos de trabalho que aproveitam o histórico |

<AccordionGroup>
  <Accordion title="Sessão principal vs. isolada vs. personalizada">
    Os jobs da **sessão principal** enfileiram um evento do sistema em uma faixa de execução pertencente ao Cron e, opcionalmente, ativam o Heartbeat (`--wake now` ou `--wake next-heartbeat`). Eles podem usar o último contexto de entrega da sessão principal de destino para respostas, mas não acrescentam turnos rotineiros do Cron à faixa de chat com a pessoa e não estendem o período de atualização da redefinição diária/por inatividade da sessão de destino. Os jobs **isolados** executam um turno dedicado do agente com uma nova sessão. As **sessões personalizadas** (`session:xxx`) mantêm o contexto entre execuções, permitindo fluxos de trabalho como reuniões diárias que aproveitam resumos anteriores.

    Os eventos do Cron da sessão principal são lembretes autocontidos de eventos do sistema. Eles não incluem automaticamente a instrução "Ler HEARTBEAT.md" do prompt padrão do Heartbeat; indique isso explicitamente no texto do evento do Cron se um lembrete precisar consultar `HEARTBEAT.md`.

  </Accordion>
  <Accordion title="O que 'nova sessão' significa para jobs isolados">
    Um novo ID de transcrição/sessão por execução. O OpenClaw mantém preferências seguras (configurações de raciocínio/modo rápido/detalhamento, rótulos e sobrescrições explícitas de modelo/autenticação selecionadas pelo usuário), mas não herda o contexto ambiente da conversa de uma linha mais antiga do Cron: roteamento de canal/grupo, política de envio ou fila, elevação, origem ou vinculação ao runtime ACP. Use `current` ou `session:<id>` quando um job recorrente precisar aproveitar deliberadamente o mesmo contexto de conversa.
  </Accordion>
  <Accordion title="Entrega de subagente e Discord">
    Quando execuções isoladas do Cron orquestram subagentes, a entrega prioriza a saída final do último descendente, em vez de texto intermediário obsoleto do pai. Se os descendentes ainda estiverem em execução, o OpenClaw suprimirá essa atualização parcial do pai, em vez de anunciá-la.

    Para destinos de anúncio do Discord somente com texto, o OpenClaw envia uma vez o texto final canônico do assistente, em vez de reproduzir tanto o texto transmitido/intermediário quanto a resposta final. Mídias e cargas úteis estruturadas do Discord ainda são entregues separadamente para que anexos e componentes não sejam descartados.

  </Accordion>
</AccordionGroup>

## Entrega e saída

| Modo       | O que acontece                                                               |
| ---------- | ---------------------------------------------------------------------------- |
| `announce` | Entrega o texto final ao destino como fallback se o agente não o tiver enviado |
| `webhook`  | Envia por POST a carga útil do evento concluído para uma URL                 |
| `none`     | Nenhuma entrega de fallback pelo executor                                    |

Use `--announce --channel telegram --to "-1001234567890"` para entrega ao canal. Para tópicos de fórum do Telegram, use `-1001234567890:topic:123`; o OpenClaw também aceita a forma abreviada `-1001234567890:123`, pertencente ao Telegram. Chamadores diretos de RPC/configuração podem passar `delivery.threadId` como string ou número. Destinos do Slack/Discord/Mattermost usam prefixos explícitos (`channel:<id>`, `user:<id>`). IDs de sala do Matrix diferenciam maiúsculas de minúsculas; use o ID exato da sala ou a forma `room:!room:server` do Matrix.

Quando a entrega de anúncio usa `channel: "last"` ou omite `channel`, um destino com prefixo de provedor, como `telegram:123`, pode selecionar o canal antes que o Cron recorra ao histórico da sessão ou a um único canal configurado. Somente os prefixos divulgados pelo Plugin carregado são seletores de provedor. Se `delivery.channel` for explícito, o prefixo do destino deverá nomear o mesmo provedor; `channel: "whatsapp"` com `to: "telegram:123"` será rejeitado, em vez de permitir que o WhatsApp interprete o ID do Telegram como um número de telefone. Prefixos de tipo de destino e serviço (`channel:<id>`, `user:<id>`, `imessage:<handle>`, `sms:<number>`) continuam sendo uma sintaxe de destino pertencente ao canal, não seletores de provedor.

Para jobs isolados, a entrega ao chat é compartilhada: se houver uma rota de chat disponível, o agente poderá usar a ferramenta `message` mesmo com `--no-deliver`. Se o agente enviar para o destino configurado/atual, o OpenClaw ignorará o anúncio de fallback. Caso contrário, `announce`, `webhook` e `none` controlam apenas o que o executor fará com a resposta final após o turno do agente.

Quando um agente cria um lembrete isolado a partir de um chat ativo, o OpenClaw armazena o destino de entrega ativo preservado para a rota de anúncio de fallback. As chaves internas da sessão podem estar em minúsculas; os destinos de entrega do provedor não são reconstruídos a partir dessas chaves quando o contexto atual do chat está disponível.

A entrega implícita de anúncios usa listas configuradas de canais permitidos para validar e redirecionar destinos obsoletos. As aprovações do armazenamento de emparelhamento de mensagens diretas não são destinatários de automação de fallback; defina `delivery.to` ou configure a entrada `allowFrom` do canal quando um job agendado precisar enviar proativamente para uma mensagem direta.

### Notificações de falha

As notificações de falha seguem um caminho de destino separado:

- `cron.failureDestination` define um padrão global para notificações de falha.
- `job.delivery.failureDestination` substitui essa configuração por job.
- Se nenhum dos dois estiver definido e o job já fizer entregas por `announce`, as notificações de falha recorrerão a esse destino principal de anúncio.
- `delivery.failureDestination` só é compatível com jobs que tenham `sessionTarget="isolated"`, a menos que o modo de entrega principal seja `webhook`.
- `failureAlert.includeSkipped: true` inclui um job ou a política global de alertas do Cron nos alertas repetidos de execuções ignoradas. As execuções ignoradas mantêm um contador separado de ignoradas consecutivas, portanto não afetam o recuo por erro de execução.
- `openclaw cron edit` oferece ajustes de alerta por job: `--failure-alert`/`--no-failure-alert`, `--failure-alert-after <n>`, `--failure-alert-channel`, `--failure-alert-to`, `--failure-alert-cooldown`, `--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`, `--failure-alert-mode` e `--failure-alert-account-id`.

### Idioma da saída

Os jobs do Cron não inferem um idioma de resposta a partir do canal, da localidade ou de mensagens anteriores. Coloque a regra de idioma na mensagem agendada ou no modelo:

```bash
openclaw cron edit <jobId> \
  --message "Resuma as atualizações. Responda em chinês; mantenha URLs, código e nomes de produtos inalterados."
```

Para arquivos de modelo, mantenha a instrução de idioma no prompt renderizado e verifique se placeholders como `{{language}}` foram preenchidos antes da execução do job. Se a saída misturar idiomas, torne a regra explícita, por exemplo: "Use chinês no texto narrativo e mantenha os termos técnicos em inglês."

## Exemplos da CLI

<Tabs>
  <Tab title="Lembrete único">
    ```bash
    openclaw cron add \
      --name "Verificação do calendário" \
      --at "20m" \
      --session main \
      --system-event "Próximo heartbeat: verificar o calendário." \
      --wake now
    ```
  </Tab>
  <Tab title="Tarefa isolada recorrente">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Resuma as atualizações ocorridas durante a noite." \
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

# Mostrar uma tarefa, incluindo a rota de entrega resolvida
openclaw cron show <jobId>

# Ativar/desativar sem excluir
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# Editar uma tarefa
openclaw cron edit <jobId> --message "Prompt atualizado" --model "opus"

# Forçar a execução de uma tarefa agora
openclaw cron run <jobId>

# Forçar a execução de uma tarefa agora e aguardar seu status terminal
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Executar somente se estiver no prazo
openclaw cron run <jobId> --due

# Exibir o histórico de execuções
openclaw cron runs --id <jobId> --limit 50

# Exibir uma execução específica
openclaw cron runs --id <jobId> --run-id <runId>

# Excluir uma tarefa
openclaw cron remove <jobId>

# Seleção de agente (configurações com vários agentes)
openclaw cron create "0 6 * * *" "Verifique a fila de operações" --name "Varredura de operações" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

Arquivar uma sessão (na interface de controle ou com `sessions.patch { archived: true }` por um chamador operador-administrador) desativa todas as tarefas cron ativas vinculadas a essa sessão: sua sessão isolada `cron:<jobId>`, um destino `session:<key>` ou uma via `sessionKey` de entrega/ativação. Restaurar a sessão não reativa essas tarefas; use `openclaw cron enable <jobId>`. As sessões com uma tarefa vinculada ativa exibem um emblema de relógio na barra lateral da interface de controle.

`openclaw cron run <jobId>` retorna após enfileirar a execução manual. Use `--wait` para hooks de encerramento, scripts de manutenção ou outras automações que precisam bloquear até a conclusão da execução enfileirada; ele consulta o `runId` retornado (tempo limite padrão de `10m`, intervalo de consulta de `2s`) e encerra com `0` para o status `ok` e com valor diferente de zero para `error`, `skipped` ou tempo limite de espera.

A ferramenta `cron` do agente retorna resumos compactos das tarefas (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) por meio de `cron(action: "list")`; use `cron(action: "get", jobId: "...")` para obter a definição completa de uma tarefa. Chamadores diretos do Gateway podem passar `compact: true` para `cron.list`; omiti-lo preserva a resposta completa com prévias de entrega.

`openclaw cron create` é um alias de `openclaw cron add`. Novas tarefas podem usar um agendamento posicional (`"0 9 * * 1"`, `"every 1h"`, `"20m"` ou um carimbo de data/hora ISO) seguido por um prompt posicional do agente. Use `--webhook <url>` em `cron add|create` ou `cron edit` para enviar via POST o payload da execução concluída a um endpoint HTTP; a entrega por Webhook não pode ser combinada com opções de entrega por chat (`--announce`, `--channel`, `--to`, `--thread-id`, `--account`). Em `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` e `--clear-account` removem individualmente esses campos de roteamento (cada um é rejeitado junto com sua opção de definição correspondente) — diferentemente de `--no-deliver`, que apenas desativa a entrega de contingência do executor.

<Note>
Observação sobre a substituição de modelo:

- `openclaw cron add|edit --model ...` altera o modelo selecionado da tarefa.
- Se o modelo for permitido, esse provedor/modelo exato será usado na execução isolada do agente.
- Se não for permitido ou não puder ser resolvido, o cron encerrará a execução com um erro explícito de validação.
- Patches de payload da API `cron.update` podem definir `model: null` para remover uma substituição de modelo armazenada na tarefa.
- `openclaw cron edit <job-id> --clear-model` remove essa substituição pela CLI (o mesmo efeito do patch `model: null`) e não pode ser combinado com `--model`.
- As cadeias de contingência configuradas ainda se aplicam porque o `--model` do cron é o modelo primário da tarefa, não uma substituição `/model` da sessão.
- `openclaw cron add|edit --fallbacks ...` define `fallbacks` no payload, substituindo as contingências configuradas para essa tarefa; `--fallbacks ""` desativa a contingência e torna a execução estrita. `openclaw cron edit <job-id> --clear-fallbacks` remove a substituição específica da tarefa.
- Um `--model` simples, sem uma lista de contingência explícita ou configurada, não recorre ao modelo primário do agente como um destino adicional e silencioso de nova tentativa.

</Note>

## Webhooks

O Gateway pode expor endpoints HTTP de Webhook para gatilhos externos. Ative-os na configuração:

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

Toda solicitação deve incluir o token do hook por meio de um cabeçalho:

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
  <Accordion title="Hooks mapeados (POST /hooks/<name>)">
    Nomes personalizados de hooks são resolvidos por meio de `hooks.mappings` na configuração. Os mapeamentos podem transformar payloads arbitrários em ações `wake` ou `agent` com modelos ou transformações de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantenha os endpoints de hooks protegidos por loopback, tailnet ou um proxy reverso confiável.

- Use um token exclusivo para hooks; não reutilize tokens de autenticação do Gateway.
- Mantenha `hooks.path` em um subcaminho exclusivo; `/` é rejeitado.
- Defina `hooks.allowedAgentIds` para limitar qual agente efetivo um hook pode usar como destino, incluindo o agente padrão quando `agentId` for omitido.
- Mantenha `hooks.allowRequestSessionKey=false`, a menos que sejam necessárias sessões selecionadas pelo chamador.
- Se você ativar `hooks.allowRequestSessionKey`, defina também `hooks.allowedSessionKeyPrefixes` para restringir os formatos permitidos das chaves de sessão.
- Por padrão, os payloads dos hooks são encapsulados com limites de segurança.

</Warning>

## Integração com o Gmail PubSub

Conecte os gatilhos da caixa de entrada do Gmail ao OpenClaw por meio do Google PubSub.

<Note>
**Pré-requisitos:** CLI `gcloud`, `gog` (gogcli), hooks do OpenClaw ativados e Tailscale para o endpoint HTTPS público.
</Note>

### Configuração pelo assistente (recomendado)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Isso grava a configuração `hooks.gmail`, ativa a predefinição do Gmail e usa por padrão o Tailscale Funnel para o endpoint de push (`--tailscale funnel|serve|off`).

### Inicialização automática do Gateway

Quando `hooks.enabled=true` e `hooks.gmail.account` estiver definido, o Gateway inicia `gog gmail watch serve` durante a inicialização e renova automaticamente o monitoramento. Defina `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desativar esse comportamento.

### Configuração manual única

<Steps>
  <Step title="Selecione o projeto do GCP">
    Selecione o projeto do GCP que possui o cliente OAuth usado pelo `gog`:

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
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

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
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

Os valores de `retry` acima são os padrões: até 3 novas tentativas com espera de `30s/60s/5m`, repetindo em todas as cinco categorias transitórias. `webhookToken` é enviado como `Authorization: Bearer <token>` nos POSTs de Webhook do cron.

`maxConcurrentRuns` limita tanto o despacho agendado do cron quanto a execução de turnos isolados do agente, e seu valor padrão é 8. Os turnos isolados de agentes do cron usam internamente a via de execução exclusiva `cron-nested` da fila, portanto, aumentar esse valor permite que execuções de LLM independentes do cron avancem em paralelo, em vez de iniciar apenas seus wrappers externos do cron. A via compartilhada `nested`, que não pertence ao cron, não é ampliada por essa configuração.

`cron.store` é uma chave lógica de armazenamento e um caminho de migração do doctor, não um arquivo JSON ativo para edição manual. Os dados das tarefas ficam no SQLite; use a CLI ou a API do Gateway para fazer alterações.

Desative o cron com `cron.enabled: false` ou `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportamento das novas tentativas">
    **Nova tentativa de execução única**: erros transitórios (limite de taxa, sobrecarga, rede, tempo limite, erro do servidor) são repetidos até `retry.maxAttempts` vezes (padrão: 3), usando `retry.backoffMs` (padrão: 30s, 60s, 5m). Erros permanentes desativam a tarefa imediatamente.

    **Nova tentativa recorrente**: erros de execução consecutivos aplicam espera conforme um agendamento estendido (30s, 60s, 5m, 15m, 60m). A espera é redefinida após a próxima execução bem-sucedida.

  </Accordion>
  <Accordion title="Manutenção">
    `cron.sessionRetention` (padrão: `24h`; `false` desativa) remove entradas de sessões de execução isoladas. `cron.runLog.keepLines` limita as linhas do histórico de execução no SQLite mantidas por tarefa; `maxBytes` é mantido para compatibilidade de configuração com logs de execução antigos baseados em arquivos.
  </Accordion>
  <Accordion title="Migração do armazenamento legado">
    Após atualizar, execute `openclaw doctor --fix` para importar os arquivos legados `~/.openclaw/cron/jobs.json`, `jobs-state.json` e `runs/*.jsonl` para o SQLite e renomeá-los com o sufixo `.migrated`. Linhas de tarefas malformadas são ignoradas durante a execução e copiadas para `jobs-quarantine.json` para correção ou análise posterior.
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
  <Accordion title="Cron não é acionado">
    - Verifique `cron.enabled` e a variável de ambiente `OPENCLAW_SKIP_CRON`.
    - Confirme se o Gateway está em execução continuamente.
    - Para agendamentos `cron`, verifique o fuso horário (`--tz`) em relação ao fuso horário do host.
    - `reason: not-due` na saída da execução significa que a execução manual foi verificada com `openclaw cron run <jobId> --due` e a tarefa ainda não estava no horário de execução.

  </Accordion>
  <Accordion title="Cron foi acionado, mas não houve entrega">
    - O modo de entrega `none` significa que não se espera um envio alternativo pelo executor. O agente ainda pode enviar diretamente com a ferramenta `message` quando uma rota de chat estiver disponível.
    - Um destino de entrega ausente ou inválido (`channel`/`to`) significa que o envio de saída foi ignorado.
    - No Matrix, tarefas copiadas ou legadas com IDs de sala em `delivery.to` convertidos para minúsculas podem falhar porque os IDs de sala do Matrix diferenciam maiúsculas de minúsculas. Edite a tarefa para usar o valor exato `!room:server` ou `room:!room:server` do Matrix.
    - Erros de autenticação do canal (`unauthorized`, `Forbidden`) significam que a entrega foi bloqueada pelas credenciais.
    - Se a execução isolada retornar apenas o token silencioso (`NO_REPLY` / `no_reply`), o OpenClaw suprime a entrega direta de saída e o fluxo alternativo de resumo enfileirado; portanto, nada é publicado de volta no chat.
    - Se o agente deve enviar uma mensagem ao usuário por conta própria, verifique se a tarefa tem uma rota utilizável (`channel: "last"` com um chat anterior ou um canal/destino explícito).

  </Accordion>
  <Accordion title="Cron ou Heartbeat parece impedir a renovação no estilo /new">
    - A atualização das redefinições diária e por inatividade não se baseia em `updatedAt`; consulte [Gerenciamento de sessões](/pt-BR/concepts/session#session-lifecycle).
    - Ativações do Cron, execuções de Heartbeat, notificações de execução e registros internos do Gateway podem atualizar a linha da sessão para roteamento/status, mas não estendem `sessionStartedAt` nem `lastInteractionAt`.
    - Para linhas legadas criadas antes da existência desses campos, o OpenClaw pode recuperar `sessionStartedAt` do cabeçalho de sessão da transcrição JSONL quando o arquivo ainda estiver disponível. Linhas legadas inativas sem `lastInteractionAt` usam esse horário de início recuperado como referência de inatividade.

  </Accordion>
  <Accordion title="Armadilhas de fuso horário">
    - Cron sem `--tz` usa o fuso horário do host do Gateway.
    - Agendamentos `at` sem fuso horário são tratados como UTC.
    - `activeHours` do Heartbeat usa a resolução de fuso horário configurada.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Automação](/pt-BR/automation) — todos os mecanismos de automação em uma visão geral
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — registro de tarefas para execuções do Cron
- [Heartbeat](/pt-BR/gateway/heartbeat) — turnos periódicos da sessão principal
- [Fuso horário](/pt-BR/concepts/timezone) — configuração de fuso horário
