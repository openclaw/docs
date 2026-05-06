---
read_when:
    - Inspecionando trabalhos em segundo plano em andamento ou concluídos recentemente
    - Depuração de falhas de entrega em execuções de agente destacadas
    - Entendendo como as execuções em segundo plano se relacionam com sessões, Cron e Heartbeat
sidebarTitle: Background tasks
summary: Rastreamento de tarefas em segundo plano para execuções do ACP, subagentes, tarefas Cron isoladas e operações da CLI
title: Tarefas em segundo plano
x-i18n:
    generated_at: "2026-05-06T05:46:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 055e16b4f53dbd089cc72eea7fe80bdaee5451dc56fa6e88a742f98e566bb57a
    source_path: automation/tasks.md
    workflow: 16
---

<Note>
Procurando agendamento? Consulte [Automação e tarefas](/pt-BR/automation) para escolher o mecanismo certo. Esta página é o registro de atividades do trabalho em segundo plano, não o agendador.
</Note>

Tarefas em segundo plano acompanham o trabalho executado **fora da sua sessão principal de conversa**: execuções ACP, criação de subagentes, execuções isoladas de trabalhos Cron e operações iniciadas pela CLI.

Tarefas **não** substituem sessões, trabalhos Cron ou Heartbeats - elas são o **registro de atividades** que registra qual trabalho desacoplado aconteceu, quando e se foi bem-sucedido.

<Note>
Nem toda execução de agente cria uma tarefa. Turnos de Heartbeat e chats interativos normais não criam. Todas as execuções de Cron, criações ACP, criações de subagentes e comandos de agente da CLI criam.
</Note>

## TL;DR

- Tarefas são **registros**, não agendadores - Cron e Heartbeat decidem _quando_ o trabalho é executado; tarefas acompanham _o que aconteceu_.
- ACP, subagentes, todos os trabalhos Cron e operações da CLI criam tarefas. Turnos de Heartbeat não criam.
- Cada tarefa passa por `queued → running → terminal` (succeeded, failed, timed_out, cancelled ou lost).
- Tarefas Cron permanecem ativas enquanto o runtime do Cron ainda possui o trabalho; se o
  estado do runtime em memória se foi, a manutenção de tarefas primeiro verifica o histórico
  durável de execuções Cron antes de marcar uma tarefa como perdida.
- A conclusão é orientada por push: trabalho desacoplado pode notificar diretamente ou acordar a
  sessão/Heartbeat solicitante quando termina, então loops de consulta de status geralmente têm
  o formato errado.
- Execuções isoladas de Cron e conclusões de subagentes fazem a melhor tentativa de limpar abas/processos de navegador rastreados para a sessão filha antes da escrituração final de limpeza.
- A entrega isolada de Cron suprime respostas provisórias obsoletas do pai enquanto o trabalho de subagente descendente ainda está esvaziando, e prefere a saída final do descendente quando ela chega antes da entrega.
- Notificações de conclusão são entregues diretamente a um canal ou enfileiradas para o próximo Heartbeat.
- `openclaw tasks list` mostra todas as tarefas; `openclaw tasks audit` expõe problemas.
- Registros terminais são mantidos por 7 dias e depois removidos automaticamente.

## Início rápido

<Tabs>
  <Tab title="Listar e filtrar">
    ```bash
    # Listar todas as tarefas (mais recentes primeiro)
    openclaw tasks list

    # Filtrar por runtime ou status
    openclaw tasks list --runtime acp
    openclaw tasks list --status running
    ```

  </Tab>
  <Tab title="Inspecionar">
    ```bash
    # Mostrar detalhes de uma tarefa específica (por ID, ID de execução ou chave de sessão)
    openclaw tasks show <lookup>
    ```
  </Tab>
  <Tab title="Cancelar e notificar">
    ```bash
    # Cancelar uma tarefa em execução (encerra a sessão filha)
    openclaw tasks cancel <lookup>

    # Alterar a política de notificação de uma tarefa
    openclaw tasks notify <lookup> state_changes
    ```

  </Tab>
  <Tab title="Auditoria e manutenção">
    ```bash
    # Executar uma auditoria de integridade
    openclaw tasks audit

    # Pré-visualizar ou aplicar manutenção
    openclaw tasks maintenance
    openclaw tasks maintenance --apply
    ```

  </Tab>
  <Tab title="Fluxo de tarefas">
    ```bash
    # Inspecionar estado do TaskFlow
    openclaw tasks flow list
    openclaw tasks flow show <lookup>
    openclaw tasks flow cancel <lookup>
    ```
  </Tab>
</Tabs>

## O que cria uma tarefa

| Origem                 | Tipo de runtime | Quando um registro de tarefa é criado                  | Política de notificação padrão |
| ---------------------- | ------------ | ------------------------------------------------------ | --------------------- |
| Execuções em segundo plano ACP | `acp`        | Ao criar uma sessão ACP filha                          | `done_only`           |
| Orquestração de subagentes | `subagent`   | Ao criar um subagente via `sessions_spawn`             | `done_only`           |
| Trabalhos Cron (todos os tipos) | `cron`       | A cada execução de Cron (sessão principal e isolada)   | `silent`              |
| Operações da CLI       | `cli`        | Comandos `openclaw agent` que são executados pelo gateway | `silent`              |
| Trabalhos de mídia do agente | `cli`        | Execuções `music_generate`/`video_generate` com sessão | `silent`              |

<AccordionGroup>
  <Accordion title="Padrões de notificação para Cron e mídia">
    Tarefas Cron de sessão principal usam a política de notificação `silent` por padrão - elas criam registros para acompanhamento, mas não geram notificações. Tarefas Cron isoladas também usam `silent` por padrão, mas são mais visíveis porque executam na própria sessão.

    Execuções `music_generate` e `video_generate` com sessão também usam a política de notificação `silent`. Elas ainda criam registros de tarefa, mas a conclusão é devolvida à sessão original do agente como um despertar interno para que o agente possa escrever a mensagem de acompanhamento e anexar a mídia concluída por conta própria. Conclusões em grupo/canal seguem a política normal de resposta visível, então o agente usa a ferramenta de mensagem quando a entrega de origem exige isso. Se o agente de conclusão não produzir evidência de entrega por ferramenta de mensagem em uma rota somente com ferramentas, o OpenClaw envia o fallback de conclusão diretamente ao canal original em vez de deixar a mídia privada.

  </Accordion>
  <Accordion title="Proteção contra video_generate concorrente">
    Enquanto uma tarefa `video_generate` com sessão ainda está ativa, a ferramenta também atua como proteção: chamadas repetidas de `video_generate` nessa mesma sessão retornam o status da tarefa ativa em vez de iniciar uma segunda geração concorrente. Use `action: "status"` quando quiser uma consulta explícita de progresso/status pelo lado do agente.
  </Accordion>
  <Accordion title="O que não cria tarefas">
    - Turnos de Heartbeat - sessão principal; consulte [Heartbeat](/pt-BR/gateway/heartbeat)
    - Turnos normais de chat interativo
    - Respostas diretas a `/command`

  </Accordion>
</AccordionGroup>

## Ciclo de vida da tarefa

```mermaid
stateDiagram-v2
    [*] --> queued
    queued --> running : agent starts
    running --> succeeded : completes ok
    running --> failed : error
    running --> timed_out : timeout exceeded
    running --> cancelled : operator cancels
    queued --> lost : session gone > 5 min
    running --> lost : session gone > 5 min
```

| Status      | O que significa                                                           |
| ----------- | -------------------------------------------------------------------------- |
| `queued`    | Criada, aguardando o agente iniciar                                       |
| `running`   | O turno do agente está em execução ativa                                  |
| `succeeded` | Concluída com sucesso                                                     |
| `failed`    | Concluída com erro                                                        |
| `timed_out` | Excedeu o tempo limite configurado                                        |
| `cancelled` | Interrompida pelo operador via `openclaw tasks cancel`                    |
| `lost`      | O runtime perdeu o estado de respaldo autoritativo após um período de carência de 5 minutos |

Transições acontecem automaticamente - quando a execução do agente associada termina, o status da tarefa é atualizado para corresponder.

A conclusão da execução do agente é autoritativa para registros de tarefa ativos. Uma execução desacoplada bem-sucedida finaliza como `succeeded`, erros comuns de execução finalizam como `failed`, e resultados de timeout ou abortamento finalizam como `timed_out`. Se um operador já cancelou a tarefa, ou o runtime já registrou um estado terminal mais forte como `failed`, `timed_out` ou `lost`, um sinal de sucesso posterior não rebaixa esse status terminal.

`lost` reconhece o runtime:

- Tarefas ACP: os metadados da sessão ACP filha de respaldo desapareceram.
- Tarefas de subagente: a sessão filha de respaldo desapareceu do armazenamento do agente de destino.
- Tarefas Cron: o runtime do Cron não rastreia mais o trabalho como ativo e o histórico
  durável de execuções Cron não mostra um resultado terminal para essa execução. A auditoria
  offline da CLI não trata seu próprio estado vazio do runtime Cron em processo como autoridade.
- Tarefas da CLI: tarefas de sessão filha isolada usam a sessão filha; tarefas da CLI
  apoiadas por chat usam o contexto de execução ao vivo, então linhas persistentes de
  sessão de canal/grupo/direta não as mantêm ativas. Execuções `openclaw agent` apoiadas
  pelo Gateway também finalizam a partir do resultado da execução, então execuções concluídas
  não ficam ativas até que o varredor as marque como `lost`.

## Entrega e notificações

Quando uma tarefa alcança um estado terminal, o OpenClaw notifica você. Há dois caminhos de entrega:

**Entrega direta** - se a tarefa tiver um destino de canal (o `requesterOrigin`), a mensagem de conclusão vai direto para esse canal (Telegram, Discord, Slack etc.). Para conclusões de subagente, o OpenClaw também preserva o roteamento de thread/tópico vinculado quando disponível e pode preencher um `to` / conta ausente a partir da rota armazenada da sessão solicitante (`lastChannel` / `lastTo` / `lastAccountId`) antes de desistir da entrega direta.

**Entrega enfileirada na sessão** - se a entrega direta falhar ou nenhuma origem estiver definida, a atualização é enfileirada como um evento de sistema na sessão do solicitante e aparece no próximo Heartbeat.

<Tip>
A conclusão da tarefa aciona um despertar imediato do Heartbeat para que você veja o resultado rapidamente - você não precisa esperar o próximo tick agendado do Heartbeat.
</Tip>

Isso significa que o fluxo de trabalho usual é baseado em push: inicie o trabalho desacoplado uma vez e deixe o runtime acordar ou notificar você na conclusão. Consulte o estado da tarefa apenas quando precisar depurar, intervir ou fazer uma auditoria explícita.

### Políticas de notificação

Controle quanto você recebe sobre cada tarefa:

| Política             | O que é entregue                                                       |
| --------------------- | ----------------------------------------------------------------------- |
| `done_only` (padrão) | Apenas estado terminal (succeeded, failed etc.) - **este é o padrão** |
| `state_changes`       | Cada transição de estado e atualização de progresso                    |
| `silent`              | Nada                                                                    |

Altere a política enquanto uma tarefa está em execução:

```bash
openclaw tasks notify <lookup> state_changes
```

## Referência da CLI

<AccordionGroup>
  <Accordion title="tasks list">
    ```bash
    openclaw tasks list [--runtime <acp|subagent|cron|cli>] [--status <status>] [--json]
    ```

    Colunas de saída: ID da tarefa, Tipo, Status, Entrega, ID de execução, Sessão filha, Resumo.

  </Accordion>
  <Accordion title="tasks show">
    ```bash
    openclaw tasks show <lookup>
    ```

    O token de consulta aceita um ID de tarefa, ID de execução ou chave de sessão. Mostra o registro completo, incluindo temporização, estado de entrega, erro e resumo terminal.

  </Accordion>
  <Accordion title="tasks cancel">
    ```bash
    openclaw tasks cancel <lookup>
    ```

    Para tarefas ACP e de subagente, isso encerra a sessão filha. Para tarefas rastreadas pela CLI, o cancelamento é registrado no registro de tarefas (não há identificador separado de runtime filho). O status transita para `cancelled` e uma notificação de entrega é enviada quando aplicável.

  </Accordion>
  <Accordion title="tasks notify">
    ```bash
    openclaw tasks notify <lookup> <done_only|state_changes|silent>
    ```
  </Accordion>
  <Accordion title="tasks audit">
    ```bash
    openclaw tasks audit [--json]
    ```

    Expõe problemas operacionais. Achados também aparecem em `openclaw status` quando problemas são detectados.

    | Achado                   | Severidade | Disparador                                                                                                      |
    | ------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
    | `stale_queued`            | warn       | Na fila por mais de 10 minutos                                                                              |
    | `stale_running`           | error      | Em execução por mais de 30 minutos                                                                             |
    | `lost`                    | warn/error | A propriedade da tarefa com respaldo de runtime desapareceu; tarefas perdidas retidas geram avisos até `cleanupAfter`, depois viram erros |
    | `delivery_failed`         | warn       | A entrega falhou e a política de notificação não é `silent`                                                            |
    | `missing_cleanup`         | warn       | Tarefa terminal sem carimbo de data/hora de limpeza                                                                      |
    | `inconsistent_timestamps` | warn       | Violação de linha do tempo (por exemplo, terminou antes de começar)                                                        |

  </Accordion>
  <Accordion title="tasks maintenance">
    ```bash
    openclaw tasks maintenance [--json]
    openclaw tasks maintenance --apply [--json]
    ```

    Use isto para pré-visualizar ou aplicar reconciliação, marcação de limpeza e remoção para tarefas e estado do Task Flow.

    A reconciliação é ciente do runtime:

    - Tarefas ACP/subagente verificam a sessão filha de suporte.
    - Tarefas de subagente cuja sessão filha tem uma lápide de recuperação de reinicialização são marcadas como perdidas em vez de serem tratadas como sessões de suporte recuperáveis.
    - Tarefas Cron verificam se o runtime do cron ainda possui o trabalho, depois recuperam o status terminal dos logs persistidos de execução do cron/estado do trabalho antes de recorrer a `lost`. Somente o processo Gateway é autoritativo para o conjunto em memória de trabalhos ativos do cron; a auditoria CLI offline usa histórico durável, mas não marca uma tarefa cron como perdida apenas porque esse Set local está vazio.
    - Tarefas CLI com suporte de chat verificam o contexto da execução ativa proprietária, não apenas a linha da sessão de chat.

    A limpeza de conclusão também é ciente do runtime:

    - A conclusão de subagente fecha, em melhor esforço, abas/processos de navegador rastreados para a sessão filha antes que a limpeza do anúncio continue.
    - A conclusão de cron isolado fecha, em melhor esforço, abas/processos de navegador rastreados para a sessão cron antes que a execução seja totalmente encerrada.
    - A entrega de cron isolado aguarda o acompanhamento de subagente descendente quando necessário e suprime texto obsoleto de confirmação do pai em vez de anunciá-lo.
    - A entrega de conclusão de subagente prefere o texto de assistente visível mais recente; se estiver vazio, recorre ao texto sanitizado mais recente de ferramenta/toolResult, e execuções apenas com timeout de chamada de ferramenta podem ser condensadas em um breve resumo de progresso parcial. Execuções terminais com falha anunciam o status de falha sem reproduzir o texto de resposta capturado.
    - Falhas de limpeza não mascaram o resultado real da tarefa.

  </Accordion>
  <Accordion title="tasks flow list | show | cancel">
    ```bash
    openclaw tasks flow list [--status <status>] [--json]
    openclaw tasks flow show <lookup> [--json]
    openclaw tasks flow cancel <lookup>
    ```

    Use-os quando o Task Flow orquestrador for o que importa para você, e não um registro individual de tarefa em segundo plano.

  </Accordion>
</AccordionGroup>

## Quadro de tarefas do chat (`/tasks`)

Use `/tasks` em qualquer sessão de chat para ver tarefas em segundo plano vinculadas a essa sessão. O quadro mostra tarefas ativas e concluídas recentemente com runtime, status, temporização e detalhes de progresso ou erro.

Quando a sessão atual não tem tarefas vinculadas visíveis, `/tasks` recorre a contagens de tarefas locais do agente, para que você ainda tenha uma visão geral sem vazar detalhes de outras sessões.

Para o registro operacional completo, use a CLI: `openclaw tasks list`.

## Integração de status (pressão de tarefas)

`openclaw status` inclui um resumo de tarefas rápido:

```
Tasks: 3 queued · 2 running · 1 issues
```

O resumo informa:

- **ativas** - contagem de `queued` + `running`
- **falhas** - contagem de `failed` + `timed_out` + `lost`
- **byRuntime** - detalhamento por `acp`, `subagent`, `cron`, `cli`

Tanto `/status` quanto a ferramenta `session_status` usam um snapshot de tarefas ciente de limpeza: tarefas ativas são preferidas, linhas obsoletas concluídas são ocultadas, e falhas recentes só aparecem quando não resta nenhum trabalho ativo. Isso mantém o cartão de status focado no que importa agora.

## Armazenamento e manutenção

### Onde as tarefas ficam

Registros de tarefas persistem no SQLite em:

```
$OPENCLAW_STATE_DIR/tasks/runs.sqlite
```

O registro é carregado na memória na inicialização do Gateway e sincroniza gravações com o SQLite para durabilidade entre reinicializações.
O Gateway mantém o log write-ahead do SQLite limitado usando o limite padrão de autocheckpoint do SQLite mais checkpoints `TRUNCATE` periódicos e no desligamento.

### Manutenção automática

Um varredor executa a cada **60 segundos** e cuida de quatro coisas:

<Steps>
  <Step title="Reconciliation">
    Verifica se tarefas ativas ainda têm suporte autoritativo do runtime. Tarefas ACP/subagente usam o estado da sessão filha, tarefas cron usam a propriedade de trabalho ativo, e tarefas CLI com suporte de chat usam o contexto da execução proprietária. Se esse estado de suporte desaparecer por mais de 5 minutos, a tarefa será marcada como `lost`.
  </Step>
  <Step title="ACP session repair">
    Fecha sessões ACP one-shot terminais ou órfãs de propriedade do pai, e fecha sessões ACP persistentes terminais ou órfãs obsoletas apenas quando não resta nenhuma vinculação de conversa ativa.
  </Step>
  <Step title="Cleanup stamping">
    Define um carimbo de data/hora `cleanupAfter` em tarefas terminais (endedAt + 7 dias). Durante a retenção, tarefas perdidas ainda aparecem na auditoria como avisos; depois que `cleanupAfter` expira ou quando metadados de limpeza estão ausentes, elas são erros.
  </Step>
  <Step title="Pruning">
    Exclui registros após a data `cleanupAfter`.
  </Step>
</Steps>

<Note>
**Retenção:** registros de tarefas terminais são mantidos por **7 dias** e depois removidos automaticamente. Nenhuma configuração é necessária.
</Note>

## Como tarefas se relacionam com outros sistemas

<AccordionGroup>
  <Accordion title="Tasks and Task Flow">
    [Task Flow](/pt-BR/automation/taskflow) é a camada de orquestração de fluxos acima das tarefas em segundo plano. Um único fluxo pode coordenar várias tarefas ao longo de sua vida útil usando modos de sincronização gerenciados ou espelhados. Use `openclaw tasks` para inspecionar registros individuais de tarefas e `openclaw tasks flow` para inspecionar o fluxo orquestrador.

    Consulte [Task Flow](/pt-BR/automation/taskflow) para obter detalhes.

  </Accordion>
  <Accordion title="Tasks and cron">
    Uma **definição** de trabalho cron fica em `~/.openclaw/cron/jobs.json`; o estado de execução em runtime fica ao lado dela em `~/.openclaw/cron/jobs-state.json`. **Toda** execução cron cria um registro de tarefa - tanto de sessão principal quanto isolada. Tarefas cron de sessão principal usam por padrão a política de notificação `silent`, para que sejam rastreadas sem gerar notificações.

    Consulte [Cron Jobs](/pt-BR/automation/cron-jobs).

  </Accordion>
  <Accordion title="Tasks and heartbeat">
    Execuções de Heartbeat são turnos da sessão principal - elas não criam registros de tarefa. Quando uma tarefa é concluída, ela pode acionar um despertar de Heartbeat para que você veja o resultado prontamente.

    Consulte [Heartbeat](/pt-BR/gateway/heartbeat).

  </Accordion>
  <Accordion title="Tasks and sessions">
    Uma tarefa pode referenciar uma `childSessionKey` (onde o trabalho é executado) e uma `requesterSessionKey` (quem a iniciou). Sessões são contexto de conversa; tarefas são rastreamento de atividade por cima disso.
  </Accordion>
  <Accordion title="Tasks and agent runs">
    O `runId` de uma tarefa vincula à execução do agente que está realizando o trabalho. Eventos de ciclo de vida do agente (início, fim, erro) atualizam automaticamente o status da tarefa - você não precisa gerenciar o ciclo de vida manualmente.
  </Accordion>
</AccordionGroup>

## Relacionados

- [Automação e tarefas](/pt-BR/automation) - todos os mecanismos de automação em uma visão geral
- [CLI: Tarefas](/pt-BR/cli/tasks) - referência de comandos da CLI
- [Heartbeat](/pt-BR/gateway/heartbeat) - turnos periódicos da sessão principal
- [Tarefas agendadas](/pt-BR/automation/cron-jobs) - agendamento de trabalho em segundo plano
- [Task Flow](/pt-BR/automation/taskflow) - orquestração de fluxos acima de tarefas
