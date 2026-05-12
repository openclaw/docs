---
read_when:
    - Inspecionando trabalhos em segundo plano em andamento ou concluídos recentemente
    - Depuração de falhas de entrega em execuções de agentes desvinculadas
    - Entendendo como as execuções em segundo plano se relacionam a sessões, Cron e Heartbeat
sidebarTitle: Background tasks
summary: Acompanhamento de tarefas em segundo plano para execuções do ACP, subagentes, trabalhos Cron isolados e operações da CLI
title: Tarefas em segundo plano
x-i18n:
    generated_at: "2026-05-12T00:56:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 31cbf09df48bab0686a1350f91aefffffef899c86704bb97b68320fc47e78021
    source_path: automation/tasks.md
    workflow: 16
---

<Note>
Procurando agendamento? Consulte [Automação](/pt-BR/automation) para escolher o mecanismo certo. Esta página é o registro de atividades do trabalho em segundo plano, não o agendador.
</Note>

Tarefas em segundo plano rastreiam trabalhos que executam **fora da sua sessão principal de conversa**: execuções ACP, criações de subagentes, execuções isoladas de trabalhos Cron e operações iniciadas pela CLI.

Tarefas **não** substituem sessões, trabalhos Cron ou Heartbeats - elas são o **registro de atividades** que registra quais trabalhos destacados aconteceram, quando e se foram bem-sucedidos.

<Note>
Nem toda execução de agente cria uma tarefa. Turnos de Heartbeat e chat interativo normal não criam. Todas as execuções Cron, criações ACP, criações de subagentes e comandos de agente da CLI criam.
</Note>

## Resumo

- Tarefas são **registros**, não agendadores - Cron e Heartbeat decidem _quando_ o trabalho executa; tarefas rastreiam _o que aconteceu_.
- ACP, subagentes, todos os trabalhos Cron e operações da CLI criam tarefas. Turnos de Heartbeat não criam.
- Cada tarefa passa por `queued → running → terminal` (succeeded, failed, timed_out, cancelled ou lost).
- Tarefas Cron permanecem ativas enquanto o runtime Cron ainda possui o trabalho; se o
  estado de runtime em memória sumiu, a manutenção de tarefas primeiro verifica o histórico durável de execuções Cron
  antes de marcar uma tarefa como perdida.
- A conclusão é orientada por push: trabalhos destacados podem notificar diretamente ou acordar a
  sessão/Heartbeat solicitante quando terminam, portanto loops de sondagem de status
  geralmente têm o formato errado.
- Execuções Cron isoladas e conclusões de subagentes limpam, no melhor esforço, abas/processos de navegador rastreados para sua sessão filha antes da escrituração de limpeza final.
- A entrega Cron isolada suprime respostas intermediárias obsoletas do pai enquanto o trabalho de subagente descendente ainda está escoando, e prefere a saída final do descendente quando ela chega antes da entrega.
- Notificações de conclusão são entregues diretamente a um canal ou enfileiradas para o próximo Heartbeat.
- `openclaw tasks list` mostra todas as tarefas; `openclaw tasks audit` expõe problemas.
- Registros terminais são mantidos por 7 dias e então removidos automaticamente.

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

| Fonte                  | Tipo de runtime | Quando um registro de tarefa é criado                  | Política de notificação padrão |
| ---------------------- | ------------ | ------------------------------------------------------ | --------------------- |
| Execuções ACP em segundo plano | `acp`        | Ao criar uma sessão ACP filha                          | `done_only`           |
| Orquestração de subagentes | `subagent`   | Ao criar um subagente via `sessions_spawn`             | `done_only`           |
| Trabalhos Cron (todos os tipos) | `cron`       | Toda execução Cron (sessão principal e isolada)        | `silent`              |
| Operações da CLI       | `cli`        | Comandos `openclaw agent` que executam pelo Gateway    | `silent`              |
| Trabalhos de mídia do agente | `cli`        | Execuções `music_generate`/`video_generate` com sessão | `silent`              |

<AccordionGroup>
  <Accordion title="Padrões de notificação para Cron e mídia">
    Tarefas Cron de sessão principal usam a política de notificação `silent` por padrão - elas criam registros para rastreamento, mas não geram notificações. Tarefas Cron isoladas também usam `silent` por padrão, mas são mais visíveis porque executam na própria sessão.

    Execuções `music_generate` e `video_generate` com sessão também usam a política de notificação `silent`. Elas ainda criam registros de tarefa, mas a conclusão é devolvida à sessão original do agente como um despertar interno para que o agente possa escrever a mensagem de acompanhamento e anexar a mídia finalizada por conta própria. Conclusões em grupo/canal seguem a política normal de resposta visível, então o agente usa a ferramenta de mensagem quando a entrega de origem exige isso. Se o agente de conclusão não produzir evidência de entrega por ferramenta de mensagem em uma rota somente com ferramenta, o OpenClaw envia o fallback de conclusão diretamente ao canal original em vez de deixar a mídia privada.

  </Accordion>
  <Accordion title="Proteção contra video_generate concorrente">
    Enquanto uma tarefa `video_generate` com sessão ainda estiver ativa, a ferramenta também atua como proteção: chamadas repetidas de `video_generate` nessa mesma sessão retornam o status da tarefa ativa em vez de iniciar uma segunda geração concorrente. Use `action: "status"` quando quiser uma consulta explícita de progresso/status pelo lado do agente.
  </Accordion>
  <Accordion title="O que não cria tarefas">
    - Turnos de Heartbeat - sessão principal; consulte [Heartbeat](/pt-BR/gateway/heartbeat)
    - Turnos normais de chat interativo
    - Respostas diretas de `/command`

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

| Status      | O que significa                                                            |
| ----------- | -------------------------------------------------------------------------- |
| `queued`    | Criada, aguardando o agente iniciar                                        |
| `running`   | O turno do agente está executando ativamente                               |
| `succeeded` | Concluída com sucesso                                                      |
| `failed`    | Concluída com erro                                                         |
| `timed_out` | Excedeu o tempo limite configurado                                         |
| `cancelled` | Interrompida pelo operador via `openclaw tasks cancel`                     |
| `lost`      | O runtime perdeu o estado de apoio autoritativo após um período de carência de 5 minutos |

As transições acontecem automaticamente - quando a execução do agente associada termina, o status da tarefa é atualizado para corresponder.

A conclusão da execução do agente é autoritativa para registros de tarefas ativos. Uma execução destacada bem-sucedida finaliza como `succeeded`, erros comuns de execução finalizam como `failed`, e resultados de timeout ou abort finalizam como `timed_out`. Se um operador já cancelou a tarefa, ou o runtime já registrou um estado terminal mais forte, como `failed`, `timed_out` ou `lost`, um sinal de sucesso posterior não rebaixa esse status terminal.

`lost` é ciente do runtime:

- Tarefas ACP: metadados da sessão ACP filha de apoio desapareceram.
- Tarefas de subagente: a sessão filha de apoio desapareceu do armazenamento do agente de destino.
- Tarefas Cron: o runtime Cron não rastreia mais o trabalho como ativo e o histórico durável
  de execuções Cron não mostra um resultado terminal para essa execução. A auditoria offline da CLI
  não trata seu próprio estado vazio de runtime Cron em processo como autoridade.
- Tarefas CLI: tarefas com um run id/source id usam o contexto de execução ao vivo, então
  linhas persistentes de sessão filha ou sessão de chat não as mantêm vivas depois que a
  execução pertencente ao Gateway desaparece. Tarefas CLI legadas sem identidade de execução ainda recorrem
  à sessão filha. Execuções `openclaw agent` com suporte do Gateway também finalizam
  a partir do resultado da execução, então execuções concluídas não permanecem ativas até que o varredor
  as marque como `lost`.

## Entrega e notificações

Quando uma tarefa atinge um estado terminal, o OpenClaw notifica você. Há dois caminhos de entrega:

**Entrega direta** - se a tarefa tiver um destino de canal (o `requesterOrigin`), a mensagem de conclusão vai direto para esse canal (Telegram, Discord, Slack etc.). Conclusões de tarefas de grupo e canal são, em vez disso, roteadas pela sessão solicitante para que o agente pai possa escrever a resposta visível. Para conclusões de subagentes, o OpenClaw também preserva o roteamento vinculado de thread/tópico quando disponível e pode preencher um `to` / conta ausente a partir da rota armazenada da sessão solicitante (`lastChannel` / `lastTo` / `lastAccountId`) antes de desistir da entrega direta.

**Entrega enfileirada na sessão** - se a entrega direta falhar ou nenhuma origem estiver definida, a atualização é enfileirada como um evento do sistema na sessão do solicitante e aparece no próximo Heartbeat.

<Tip>
A conclusão da tarefa dispara um despertar imediato de Heartbeat para que você veja o resultado rapidamente - você não precisa esperar o próximo tick agendado de Heartbeat.
</Tip>

Isso significa que o fluxo de trabalho usual é baseado em push: inicie o trabalho destacado uma vez e deixe o runtime acordar ou notificar você na conclusão. Consulte o estado da tarefa apenas quando precisar depurar, intervir ou fazer uma auditoria explícita.

### Políticas de notificação

Controle quanto você recebe sobre cada tarefa:

| Política              | O que é entregue                                                        |
| --------------------- | ----------------------------------------------------------------------- |
| `done_only` (padrão) | Apenas estado terminal (succeeded, failed etc.) - **este é o padrão** |
| `state_changes`       | Toda transição de estado e atualização de progresso                     |
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

    Para tarefas ACP e de subagente, isso encerra a sessão filha. Para tarefas rastreadas pela CLI, o cancelamento é registrado no registro de tarefas (não há handle de runtime filho separado). O status transiciona para `cancelled` e uma notificação de entrega é enviada quando aplicável.

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

    Expõe problemas operacionais. As descobertas também aparecem em `openclaw status` quando problemas são detectados.

    | Descoberta                | Gravidade  | Gatilho                                                                                                           |
    | ------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
    | `stale_queued`            | aviso      | Em fila há mais de 10 minutos                                                                                     |
    | `stale_running`           | erro       | Em execução há mais de 30 minutos                                                                                 |
    | `lost`                    | aviso/erro | A propriedade da tarefa com suporte de runtime desapareceu; tarefas perdidas retidas avisam até `cleanupAfter` e então se tornam erros |
    | `delivery_failed`         | aviso      | A entrega falhou e a política de notificação não é `silent`                                                       |
    | `missing_cleanup`         | aviso      | Tarefa terminal sem carimbo de data/hora de limpeza                                                               |
    | `inconsistent_timestamps` | aviso      | Violação da linha do tempo (por exemplo, terminou antes de começar)                                               |

  </Accordion>
  <Accordion title="manutenção de tarefas">
    ```bash
    openclaw tasks maintenance [--json]
    openclaw tasks maintenance --apply [--json]
    ```

    Use isto para visualizar ou aplicar reconciliação, marcação de limpeza e remoção para tarefas, estado do Task Flow e linhas obsoletas do registro de sessões de execução de cron.

    A reconciliação considera o runtime:

    - Tarefas ACP/subagente verificam sua sessão filha de suporte.
    - Tarefas de subagente cuja sessão filha tem uma lápide de recuperação de reinicialização são marcadas como perdidas, em vez de serem tratadas como sessões de suporte recuperáveis.
    - Tarefas de Cron verificam se o runtime de cron ainda é proprietário do job e então recuperam o status terminal dos logs persistidos de execuções de cron/estado do job antes de recorrer a `lost`. Somente o processo Gateway é autoritativo para o conjunto em memória de jobs ativos de cron; a auditoria offline da CLI usa histórico durável, mas não marca uma tarefa de cron como perdida apenas porque esse Set local está vazio.
    - Tarefas da CLI com identidade de execução verificam o contexto de execução ativo proprietário, não apenas linhas de sessão filha ou sessão de chat.

    A limpeza de conclusão também considera o runtime:

    - A conclusão de subagente tenta, em melhor esforço, fechar abas/processos de navegador rastreados para a sessão filha antes de a limpeza de anúncio continuar.
    - A conclusão de cron isolado tenta, em melhor esforço, fechar abas/processos de navegador rastreados para a sessão de cron antes de a execução ser totalmente desmontada.
    - A entrega de cron isolado aguarda acompanhamento de subagentes descendentes quando necessário e suprime texto obsoleto de confirmação do pai em vez de anunciá-lo.
    - A entrega de conclusão de subagente prefere o texto visível mais recente do assistente; se estiver vazio, usa como fallback o texto sanitizado mais recente de ferramenta/toolResult, e execuções com chamadas de ferramenta que só atingem timeout podem ser reduzidas a um breve resumo de progresso parcial. Execuções terminais com falha anunciam o status de falha sem repetir o texto de resposta capturado.
    - Falhas de limpeza não mascaram o resultado real da tarefa.

    Ao aplicar manutenção, o OpenClaw também remove linhas obsoletas do registro de sessões `cron:<jobId>:run:<uuid>` com mais de 7 dias, preservando linhas de jobs de cron em execução no momento e deixando intocadas linhas de sessões que não sejam de cron.

  </Accordion>
  <Accordion title="tasks flow list | show | cancel">
    ```bash
    openclaw tasks flow list [--status <status>] [--json]
    openclaw tasks flow show <lookup> [--json]
    openclaw tasks flow cancel <lookup>
    ```

    Use estes comandos quando o Task Flow orquestrador for o que importa, em vez de um registro individual de tarefa em segundo plano.

  </Accordion>
</AccordionGroup>

## Quadro de tarefas do chat (`/tasks`)

Use `/tasks` em qualquer sessão de chat para ver tarefas em segundo plano vinculadas a essa sessão. O quadro mostra tarefas ativas e concluídas recentemente com runtime, status, tempo e detalhes de progresso ou erro.

Quando a sessão atual não tem tarefas vinculadas visíveis, `/tasks` recorre a contagens de tarefas locais ao agente para que você ainda tenha uma visão geral sem vazar detalhes de outras sessões.

Para o livro-razão completo do operador, use a CLI: `openclaw tasks list`.

## Integração de status (pressão de tarefas)

`openclaw status` inclui um resumo de tarefas para consulta rápida:

```
Tasks: 3 queued · 2 running · 1 issues
```

O resumo relata:

- **ativas** - contagem de `queued` + `running`
- **falhas** - contagem de `failed` + `timed_out` + `lost`
- **byRuntime** - detalhamento por `acp`, `subagent`, `cron`, `cli`

Tanto `/status` quanto a ferramenta `session_status` usam uma captura de tarefas ciente de limpeza: tarefas ativas são preferidas, linhas concluídas obsoletas são ocultadas e falhas recentes só aparecem quando não resta trabalho ativo. Isso mantém o cartão de status focado no que importa agora.

## Armazenamento e manutenção

### Onde as tarefas ficam

Registros de tarefas persistem no SQLite em:

```
$OPENCLAW_STATE_DIR/tasks/runs.sqlite
```

O registro é carregado na memória na inicialização do gateway e sincroniza gravações no SQLite para durabilidade entre reinicializações.
O Gateway mantém o log write-ahead do SQLite limitado usando o limite padrão de
autocheckpoint do SQLite, além de checkpoints `TRUNCATE` periódicos e no desligamento.

### Manutenção automática

Um varredor é executado a cada **60 segundos** e lida com quatro coisas:

<Steps>
  <Step title="Reconciliação">
    Verifica se tarefas ativas ainda têm suporte autoritativo de runtime. Tarefas ACP/subagente usam o estado da sessão filha, tarefas de cron usam propriedade de job ativo e tarefas da CLI com identidade de execução usam o contexto de execução proprietário. Se esse estado de suporte desaparece por mais de 5 minutos, a tarefa é marcada como `lost`.
  </Step>
  <Step title="Reparo de sessão ACP">
    Fecha sessões ACP one-shot terminais ou órfãs pertencentes ao pai, e fecha sessões ACP persistentes terminais obsoletas ou órfãs somente quando não resta nenhuma vinculação de conversa ativa.
  </Step>
  <Step title="Marcação de limpeza">
    Define um carimbo de data/hora `cleanupAfter` em tarefas terminais (endedAt + 7 dias). Durante a retenção, tarefas perdidas ainda aparecem na auditoria como avisos; depois que `cleanupAfter` expira ou quando metadados de limpeza estão ausentes, elas são erros.
  </Step>
  <Step title="Remoção">
    Exclui registros após sua data `cleanupAfter`.
  </Step>
</Steps>

<Note>
**Retenção:** registros de tarefas terminais são mantidos por **7 dias** e então removidos automaticamente. Nenhuma configuração necessária.
</Note>

## Como tarefas se relacionam com outros sistemas

<AccordionGroup>
  <Accordion title="Tarefas e Task Flow">
    [Task Flow](/pt-BR/automation/taskflow) é a camada de orquestração de fluxos acima de tarefas em segundo plano. Um único fluxo pode coordenar várias tarefas ao longo de sua vida usando modos de sincronização gerenciados ou espelhados. Use `openclaw tasks` para inspecionar registros individuais de tarefas e `openclaw tasks flow` para inspecionar o fluxo orquestrador.

    Consulte [Task Flow](/pt-BR/automation/taskflow) para obter detalhes.

  </Accordion>
  <Accordion title="Tarefas e cron">
    Uma **definição** de job de cron fica em `~/.openclaw/cron/jobs.json`; o estado de execução em runtime fica ao lado dela em `~/.openclaw/cron/jobs-state.json`. **Toda** execução de cron cria um registro de tarefa - tanto em sessão principal quanto isolada. Tarefas de cron em sessão principal usam por padrão a política de notificação `silent`, para que sejam rastreadas sem gerar notificações.

    Consulte [Cron Jobs](/pt-BR/automation/cron-jobs).

  </Accordion>
  <Accordion title="Tarefas e Heartbeat">
    Execuções de Heartbeat são turnos de sessão principal - elas não criam registros de tarefa. Quando uma tarefa é concluída, ela pode acionar um despertar de Heartbeat para que você veja o resultado rapidamente.

    Consulte [Heartbeat](/pt-BR/gateway/heartbeat).

  </Accordion>
  <Accordion title="Tarefas e sessões">
    Uma tarefa pode referenciar uma `childSessionKey` (onde o trabalho é executado) e uma `requesterSessionKey` (quem a iniciou). Sessões são contexto de conversa; tarefas são rastreamento de atividade sobre isso.
  </Accordion>
  <Accordion title="Tarefas e execuções de agente">
    O `runId` de uma tarefa se vincula à execução do agente que faz o trabalho. Eventos de ciclo de vida do agente (início, fim, erro) atualizam automaticamente o status da tarefa - você não precisa gerenciar o ciclo de vida manualmente.
  </Accordion>
</AccordionGroup>

## Relacionados

- [Automação](/pt-BR/automation) - todos os mecanismos de automação em resumo
- [CLI: Tarefas](/pt-BR/cli/tasks) - referência de comandos da CLI
- [Heartbeat](/pt-BR/gateway/heartbeat) - turnos periódicos de sessão principal
- [Tarefas agendadas](/pt-BR/automation/cron-jobs) - agendamento de trabalho em segundo plano
- [Task Flow](/pt-BR/automation/taskflow) - orquestração de fluxos acima de tarefas
