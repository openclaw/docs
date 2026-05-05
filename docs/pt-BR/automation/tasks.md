---
read_when:
    - Inspecionando trabalhos em segundo plano em andamento ou concluídos recentemente
    - Depuração de falhas de entrega em execuções de agentes desanexadas
    - Entendendo como execuções em segundo plano se relacionam a sessões, Cron e Heartbeat
sidebarTitle: Background tasks
summary: Rastreamento de tarefas em segundo plano para execuções de ACP, subagentes, trabalhos Cron isolados e operações da CLI
title: Tarefas em segundo plano
x-i18n:
    generated_at: "2026-05-05T01:44:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60d6ea6178535b19b95d761b8e8b05a665234584ae69852fd21097988aa32991
    source_path: automation/tasks.md
    workflow: 16
---

<Note>
Procurando agendamento? Consulte [Automação e tarefas](/pt-BR/automation) para escolher o mecanismo certo. Esta página é o registro de atividades do trabalho em segundo plano, não o agendador.
</Note>

Tarefas em segundo plano rastreiam trabalhos executados **fora da sua sessão principal de conversa**: execuções ACP, criação de subagentes, execuções isoladas de tarefas cron e operações iniciadas pela CLI.

Tarefas **não** substituem sessões, tarefas cron ou heartbeats — elas são o **registro de atividades** que registra qual trabalho separado aconteceu, quando, e se foi bem-sucedido.

<Note>
Nem toda execução de agente cria uma tarefa. Turnos de Heartbeat e chat interativo normal não criam. Todas as execuções cron, criações ACP, criações de subagentes e comandos de agente pela CLI criam.
</Note>

## TL;DR

- Tarefas são **registros**, não agendadores — cron e heartbeat decidem _quando_ o trabalho executa, tarefas rastreiam _o que aconteceu_.
- ACP, subagentes, todas as tarefas cron e operações da CLI criam tarefas. Turnos de Heartbeat não criam.
- Cada tarefa passa por `queued → running → terminal` (succeeded, failed, timed_out, cancelled ou lost).
- Tarefas cron permanecem ativas enquanto o runtime cron ainda é dono do job; se o
  estado do runtime em memória se foi, a manutenção de tarefas primeiro verifica o histórico durável de execuções cron
  antes de marcar uma tarefa como perdida.
- A conclusão é orientada por push: trabalho separado pode notificar diretamente ou acordar a
  sessão/heartbeat solicitante quando termina, então loops de consulta de status
  geralmente têm o formato errado.
- Execuções cron isoladas e conclusões de subagentes tentam, em melhor esforço, limpar abas/processos de navegador rastreados para a sessão filha antes da escrituração final de limpeza.
- A entrega de cron isolado suprime respostas intermediárias obsoletas do pai enquanto o trabalho de subagentes descendentes ainda está sendo drenado, e prefere a saída final do descendente quando ela chega antes da entrega.
- Notificações de conclusão são entregues diretamente a um canal ou enfileiradas para o próximo heartbeat.
- `openclaw tasks list` mostra todas as tarefas; `openclaw tasks audit` destaca problemas.
- Registros terminais são mantidos por 7 dias e depois removidos automaticamente.

## Início rápido

<Tabs>
  <Tab title="Listar e filtrar">
    ```bash
    # List all tasks (newest first)
    openclaw tasks list

    # Filter by runtime or status
    openclaw tasks list --runtime acp
    openclaw tasks list --status running
    ```

  </Tab>
  <Tab title="Inspecionar">
    ```bash
    # Show details for a specific task (by ID, run ID, or session key)
    openclaw tasks show <lookup>
    ```
  </Tab>
  <Tab title="Cancelar e notificar">
    ```bash
    # Cancel a running task (kills the child session)
    openclaw tasks cancel <lookup>

    # Change notification policy for a task
    openclaw tasks notify <lookup> state_changes
    ```

  </Tab>
  <Tab title="Auditoria e manutenção">
    ```bash
    # Run a health audit
    openclaw tasks audit

    # Preview or apply maintenance
    openclaw tasks maintenance
    openclaw tasks maintenance --apply
    ```

  </Tab>
  <Tab title="Fluxo de tarefas">
    ```bash
    # Inspect TaskFlow state
    openclaw tasks flow list
    openclaw tasks flow show <lookup>
    openclaw tasks flow cancel <lookup>
    ```
  </Tab>
</Tabs>

## O que cria uma tarefa

| Origem                 | Tipo de runtime | Quando um registro de tarefa é criado                  | Política de notificação padrão |
| ---------------------- | ------------ | ------------------------------------------------------ | --------------------- |
| Execuções ACP em segundo plano | `acp`        | Ao criar uma sessão ACP filha                          | `done_only`           |
| Orquestração de subagentes | `subagent`   | Ao criar um subagente via `sessions_spawn`             | `done_only`           |
| Tarefas cron (todos os tipos) | `cron`       | A cada execução cron (sessão principal e isolada)      | `silent`              |
| Operações da CLI       | `cli`        | Comandos `openclaw agent` que executam pelo gateway | `silent`              |
| Jobs de mídia do agente | `cli`        | Execuções `music_generate`/`video_generate` apoiadas por sessão | `silent`              |

<AccordionGroup>
  <Accordion title="Padrões de notificação para cron e mídia">
    Tarefas cron da sessão principal usam a política de notificação `silent` por padrão — elas criam registros para rastreamento, mas não geram notificações. Tarefas cron isoladas também usam `silent` por padrão, mas são mais visíveis porque executam em sua própria sessão.

    Execuções `music_generate` e `video_generate` apoiadas por sessão também usam a política de notificação `silent`. Elas ainda criam registros de tarefa, mas a conclusão é devolvida à sessão original do agente como um acionamento interno para que o agente possa escrever a mensagem de acompanhamento e anexar a mídia finalizada por conta própria. Conclusões em grupo/canal seguem a política normal de resposta visível, então o agente usa a ferramenta de mensagem quando a entrega de origem exige isso.

  </Accordion>
  <Accordion title="Proteção para video_generate concorrente">
    Enquanto uma tarefa `video_generate` apoiada por sessão ainda está ativa, a ferramenta também atua como uma proteção: chamadas repetidas a `video_generate` nessa mesma sessão retornam o status da tarefa ativa em vez de iniciar uma segunda geração concorrente. Use `action: "status"` quando quiser uma consulta explícita de progresso/status pelo lado do agente.
  </Accordion>
  <Accordion title="O que não cria tarefas">
    - Turnos de Heartbeat — sessão principal; consulte [Heartbeat](/pt-BR/gateway/heartbeat)
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
| `running`   | O turno do agente está executando ativamente                              |
| `succeeded` | Concluída com sucesso                                                     |
| `failed`    | Concluída com erro                                                         |
| `timed_out` | Excedeu o tempo limite configurado                                         |
| `cancelled` | Interrompida pelo operador via `openclaw tasks cancel`                    |
| `lost`      | O runtime perdeu o estado de apoio autoritativo após um período de carência de 5 minutos |

As transições acontecem automaticamente — quando a execução de agente associada termina, o status da tarefa é atualizado para corresponder.

A conclusão da execução do agente é autoritativa para registros de tarefa ativos. Uma execução separada bem-sucedida finaliza como `succeeded`, erros comuns de execução finalizam como `failed`, e resultados de timeout ou abortamento finalizam como `timed_out`. Se um operador já cancelou a tarefa, ou o runtime já registrou um estado terminal mais forte, como `failed`, `timed_out` ou `lost`, um sinal posterior de sucesso não rebaixa esse status terminal.

`lost` é ciente do runtime:

- Tarefas ACP: os metadados da sessão ACP filha de apoio desapareceram.
- Tarefas de subagente: a sessão filha de apoio desapareceu do armazenamento do agente de destino.
- Tarefas cron: o runtime cron não rastreia mais o job como ativo e o histórico durável
  de execuções cron não mostra um resultado terminal para essa execução. A auditoria offline da CLI
  não trata seu próprio estado vazio de runtime cron em processo como autoridade.
- Tarefas da CLI: tarefas de sessão filha isolada usam a sessão filha; tarefas da CLI
  apoiadas por chat usam o contexto de execução ativo, então linhas persistentes de sessão
  de canal/grupo/direta não as mantêm vivas. Execuções `openclaw agent` apoiadas pelo Gateway
  também finalizam a partir do resultado da execução, então execuções concluídas
  não ficam ativas até o varredor marcá-las como `lost`.

## Entrega e notificações

Quando uma tarefa alcança um estado terminal, o OpenClaw notifica você. Há dois caminhos de entrega:

**Entrega direta** — se a tarefa tem um destino de canal (o `requesterOrigin`), a mensagem de conclusão vai diretamente para esse canal (Telegram, Discord, Slack etc.). Para conclusões de subagentes, o OpenClaw também preserva o roteamento de thread/tópico vinculado quando disponível e pode preencher um `to` / conta ausente a partir da rota armazenada da sessão solicitante (`lastChannel` / `lastTo` / `lastAccountId`) antes de desistir da entrega direta.

**Entrega enfileirada na sessão** — se a entrega direta falhar ou nenhuma origem estiver definida, a atualização é enfileirada como um evento de sistema na sessão do solicitante e aparece no próximo heartbeat.

<Tip>
A conclusão de tarefa aciona um acionamento imediato de heartbeat para que você veja o resultado rapidamente — você não precisa esperar o próximo tique de heartbeat agendado.
</Tip>

Isso significa que o fluxo de trabalho usual é baseado em push: inicie o trabalho separado uma vez e deixe o runtime acordar ou notificar você na conclusão. Consulte o estado da tarefa somente quando precisar depurar, intervir ou fazer uma auditoria explícita.

### Políticas de notificação

Controle quanto você ouve sobre cada tarefa:

| Política             | O que é entregue                                                       |
| --------------------- | ----------------------------------------------------------------------- |
| `done_only` (padrão) | Somente estado terminal (succeeded, failed etc.) — **este é o padrão** |
| `state_changes`       | Toda transição de estado e atualização de progresso                    |
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

    Colunas de saída: ID da tarefa, Tipo, Status, Entrega, ID da execução, Sessão filha, Resumo.

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

    Para tarefas ACP e de subagente, isso encerra a sessão filha. Para tarefas rastreadas pela CLI, o cancelamento é registrado no registro de tarefas (não há identificador de runtime filho separado). O status transiciona para `cancelled` e uma notificação de entrega é enviada quando aplicável.

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

    Destaca problemas operacionais. Achados também aparecem em `openclaw status` quando problemas são detectados.

    | Descoberta                | Severidade | Gatilho                                                                                                                          |
    | ------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
    | `stale_queued`            | warn       | Na fila há mais de 10 minutos                                                                                                    |
    | `stale_running`           | error      | Em execução há mais de 30 minutos                                                                                                |
    | `lost`                    | warn/error | A propriedade da tarefa apoiada pelo runtime desapareceu; tarefas perdidas retidas avisam até `cleanupAfter`, depois viram erros |
    | `delivery_failed`         | warn       | A entrega falhou e a política de notificação não é `silent`                                                                      |
    | `missing_cleanup`         | warn       | Tarefa terminal sem timestamp de limpeza                                                                                         |
    | `inconsistent_timestamps` | warn       | Violação da linha do tempo (por exemplo, terminou antes de começar)                                                              |

  </Accordion>
  <Accordion title="manutenção de tarefas">
    ```bash
    openclaw tasks maintenance [--json]
    openclaw tasks maintenance --apply [--json]
    ```

    Use isto para pré-visualizar ou aplicar reconciliação, marcação de limpeza e poda para tarefas e o estado do Task Flow.

    A reconciliação é ciente do runtime:

    - Tarefas de ACP/subagente verificam sua sessão filha de apoio.
    - Tarefas de subagente cuja sessão filha tem uma lápide de recuperação de reinicialização são marcadas como perdidas em vez de serem tratadas como sessões de apoio recuperáveis.
    - Tarefas de Cron verificam se o runtime de cron ainda possui o trabalho, depois recuperam o status terminal de logs de execução cron/estado de trabalho persistidos antes de recorrer a `lost`. Somente o processo Gateway é autoritativo para o conjunto em memória de trabalhos ativos de cron; a auditoria offline da CLI usa histórico durável, mas não marca uma tarefa cron como perdida apenas porque esse Set local está vazio.
    - Tarefas da CLI apoiadas por chat verificam o contexto de execução ao vivo proprietário, não apenas a linha da sessão de chat.

    A limpeza de conclusão também é ciente do runtime:

    - A conclusão de subagente fecha, por melhor esforço, abas/processos de navegador rastreados para a sessão filha antes de a limpeza de anúncio continuar.
    - A conclusão de cron isolado fecha, por melhor esforço, abas/processos de navegador rastreados para a sessão cron antes de a execução ser totalmente desmontada.
    - A entrega de cron isolado aguarda o acompanhamento de subagente descendente quando necessário e suprime texto obsoleto de confirmação do pai em vez de anunciá-lo.
    - A entrega de conclusão de subagente prefere o texto de assistente visível mais recente; se estiver vazio, recorre ao texto mais recente higienizado de ferramenta/toolResult, e execuções de chamadas de ferramenta apenas por timeout podem ser reduzidas a um breve resumo de progresso parcial. Execuções terminais com falha anunciam o status de falha sem reproduzir o texto de resposta capturado.
    - Falhas de limpeza não mascaram o resultado real da tarefa.

  </Accordion>
  <Accordion title="tasks flow list | show | cancel">
    ```bash
    openclaw tasks flow list [--status <status>] [--json]
    openclaw tasks flow show <lookup> [--json]
    openclaw tasks flow cancel <lookup>
    ```

    Use estes quando o Task Flow orquestrador for o que importa para você, em vez de um registro individual de tarefa em segundo plano.

  </Accordion>
</AccordionGroup>

## Quadro de tarefas do chat (`/tasks`)

Use `/tasks` em qualquer sessão de chat para ver tarefas em segundo plano vinculadas a essa sessão. O quadro mostra tarefas ativas e concluídas recentemente com runtime, status, temporização e detalhes de progresso ou erro.

Quando a sessão atual não tem tarefas vinculadas visíveis, `/tasks` recorre a contagens de tarefas locais do agente, para que você ainda tenha uma visão geral sem vazar detalhes de outras sessões.

Para o registro completo do operador, use a CLI: `openclaw tasks list`.

## Integração de status (pressão de tarefas)

`openclaw status` inclui um resumo de tarefas em uma olhada:

```
Tasks: 3 queued · 2 running · 1 issues
```

O resumo relata:

- **active** — contagem de `queued` + `running`
- **failures** — contagem de `failed` + `timed_out` + `lost`
- **byRuntime** — detalhamento por `acp`, `subagent`, `cron`, `cli`

Tanto `/status` quanto a ferramenta `session_status` usam um instantâneo de tarefas ciente de limpeza: tarefas ativas são preferidas, linhas concluídas obsoletas ficam ocultas, e falhas recentes só aparecem quando não resta nenhum trabalho ativo. Isso mantém o cartão de status focado no que importa agora.

## Armazenamento e manutenção

### Onde as tarefas ficam

Registros de tarefa persistem no SQLite em:

```
$OPENCLAW_STATE_DIR/tasks/runs.sqlite
```

O registro é carregado na memória na inicialização do gateway e sincroniza gravações com o SQLite para durabilidade entre reinicializações.
O Gateway mantém o log write-ahead do SQLite limitado usando o limite padrão de
autocheckpoint do SQLite mais checkpoints `TRUNCATE` periódicos e no desligamento.

### Manutenção automática

Um varredor roda a cada **60 segundos** e cuida de quatro coisas:

<Steps>
  <Step title="Reconciliação">
    Verifica se tarefas ativas ainda têm apoio autoritativo de runtime. Tarefas de ACP/subagente usam o estado da sessão filha, tarefas de cron usam a propriedade do trabalho ativo, e tarefas da CLI apoiadas por chat usam o contexto de execução proprietário. Se esse estado de apoio desaparecer por mais de 5 minutos, a tarefa é marcada como `lost`.
  </Step>
  <Step title="Reparo de sessão ACP">
    Fecha sessões ACP one-shot terminais ou órfãs pertencentes ao pai, e fecha sessões ACP persistentes terminais obsoletas ou órfãs apenas quando não resta nenhuma vinculação de conversa ativa.
  </Step>
  <Step title="Marcação de limpeza">
    Define um timestamp `cleanupAfter` em tarefas terminais (endedAt + 7 dias). Durante a retenção, tarefas perdidas ainda aparecem na auditoria como avisos; depois que `cleanupAfter` expira ou quando metadados de limpeza estão ausentes, elas são erros.
  </Step>
  <Step title="Poda">
    Exclui registros após a data `cleanupAfter`.
  </Step>
</Steps>

<Note>
**Retenção:** registros de tarefas terminais são mantidos por **7 dias** e depois podados automaticamente. Nenhuma configuração necessária.
</Note>

## Como as tarefas se relacionam com outros sistemas

<AccordionGroup>
  <Accordion title="Tarefas e Task Flow">
    [Task Flow](/pt-BR/automation/taskflow) é a camada de orquestração de fluxo acima das tarefas em segundo plano. Um único fluxo pode coordenar várias tarefas ao longo de sua vida útil usando modos de sincronização gerenciados ou espelhados. Use `openclaw tasks` para inspecionar registros individuais de tarefa e `openclaw tasks flow` para inspecionar o fluxo orquestrador.

    Consulte [Task Flow](/pt-BR/automation/taskflow) para obter detalhes.

  </Accordion>
  <Accordion title="Tarefas e cron">
    Uma **definição** de trabalho cron fica em `~/.openclaw/cron/jobs.json`; o estado de execução do runtime fica ao lado dela em `~/.openclaw/cron/jobs-state.json`. **Toda** execução de cron cria um registro de tarefa — tanto de sessão principal quanto isolada. Tarefas cron de sessão principal usam a política de notificação `silent` por padrão, para que sejam rastreadas sem gerar notificações.

    Consulte [Trabalhos Cron](/pt-BR/automation/cron-jobs).

  </Accordion>
  <Accordion title="Tarefas e heartbeat">
    Execuções de Heartbeat são turnos de sessão principal — elas não criam registros de tarefa. Quando uma tarefa é concluída, ela pode disparar um despertar de Heartbeat para que você veja o resultado prontamente.

    Consulte [Heartbeat](/pt-BR/gateway/heartbeat).

  </Accordion>
  <Accordion title="Tarefas e sessões">
    Uma tarefa pode referenciar uma `childSessionKey` (onde o trabalho é executado) e uma `requesterSessionKey` (quem a iniciou). Sessões são contexto de conversa; tarefas são rastreamento de atividade por cima disso.
  </Accordion>
  <Accordion title="Tarefas e execuções de agente">
    O `runId` de uma tarefa vincula à execução de agente que faz o trabalho. Eventos de ciclo de vida do agente (início, fim, erro) atualizam automaticamente o status da tarefa — você não precisa gerenciar o ciclo de vida manualmente.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Automação e tarefas](/pt-BR/automation) — todos os mecanismos de automação em uma olhada
- [CLI: Tarefas](/pt-BR/cli/tasks) — referência de comandos da CLI
- [Heartbeat](/pt-BR/gateway/heartbeat) — turnos periódicos de sessão principal
- [Tarefas agendadas](/pt-BR/automation/cron-jobs) — agendamento de trabalho em segundo plano
- [Task Flow](/pt-BR/automation/taskflow) — orquestração de fluxo acima das tarefas
