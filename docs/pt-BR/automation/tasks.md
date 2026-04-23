---
read_when:
    - Inspecionando trabalho em segundo plano em andamento ou concluído recentemente
    - Depurando falhas de entrega para execuções de agentes desacopladas
    - Entendendo como execuções em segundo plano se relacionam com sessões, Cron e Heartbeat
summary: Rastreamento de tarefas em segundo plano para execuções do ACP, subagentes, trabalhos de Cron isolados e operações da CLI
title: Tarefas em segundo plano
x-i18n:
    generated_at: "2026-04-23T13:57:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5cd0b0db6c20cc677aa5cc50c42e09043d4354e026ca33c020d804761c331413
    source_path: automation/tasks.md
    workflow: 15
---

# Tarefas em segundo plano

> **Está procurando agendamento?** Veja [Automação e tarefas](/pt-BR/automation) para escolher o mecanismo certo. Esta página cobre o **rastreamento** de trabalho em segundo plano, não o agendamento.

As tarefas em segundo plano rastreiam o trabalho que é executado **fora da sua sessão principal de conversa**:
execuções do ACP, criações de subagentes, execuções isoladas de trabalhos de Cron e operações iniciadas pela CLI.

As tarefas **não** substituem sessões, trabalhos de Cron ou Heartbeats — elas são o **registro de atividade** que documenta qual trabalho desacoplado ocorreu, quando ocorreu e se foi bem-sucedido.

<Note>
Nem toda execução de agente cria uma tarefa. Turnos de Heartbeat e chat interativo normal não criam. Todas as execuções de Cron, criações do ACP, criações de subagentes e comandos de agente da CLI criam.
</Note>

## Resumo rápido

- Tarefas são **registros**, não agendadores — Cron e Heartbeat decidem _quando_ o trabalho é executado, as tarefas rastreiam _o que aconteceu_.
- ACP, subagentes, todos os trabalhos de Cron e operações da CLI criam tarefas. Turnos de Heartbeat não criam.
- Cada tarefa passa por `queued → running → terminal` (succeeded, failed, timed_out, cancelled ou lost).
- Tarefas de Cron permanecem ativas enquanto o runtime do Cron ainda é dono do trabalho; tarefas da CLI baseadas em chat permanecem ativas apenas enquanto seu contexto de execução proprietário ainda estiver ativo.
- A conclusão é orientada por envio: o trabalho desacoplado pode notificar diretamente ou despertar a sessão/Heartbeat solicitante quando termina, então loops de polling de status normalmente não são a abordagem correta.
- Execuções isoladas de Cron e conclusões de subagentes limpam, em regime de melhor esforço, abas/processos de navegador rastreados para sua sessão filha antes da contabilidade final de limpeza.
- A entrega de Cron isolado suprime respostas intermediárias antigas do pai enquanto o trabalho de subagente descendente ainda está sendo drenado, e prefere a saída final do descendente quando ela chega antes da entrega.
- Notificações de conclusão são entregues diretamente a um canal ou enfileiradas para o próximo Heartbeat.
- `openclaw tasks list` mostra todas as tarefas; `openclaw tasks audit` destaca problemas.
- Registros terminais são mantidos por 7 dias e depois removidos automaticamente.

## Início rápido

```bash
# Liste todas as tarefas (mais recentes primeiro)
openclaw tasks list

# Filtre por runtime ou status
openclaw tasks list --runtime acp
openclaw tasks list --status running

# Mostre detalhes de uma tarefa específica (por ID, ID de execução ou chave de sessão)
openclaw tasks show <lookup>

# Cancele uma tarefa em execução (encerra a sessão filha)
openclaw tasks cancel <lookup>

# Altere a política de notificação de uma tarefa
openclaw tasks notify <lookup> state_changes

# Execute uma auditoria de integridade
openclaw tasks audit

# Visualize ou aplique manutenção
openclaw tasks maintenance
openclaw tasks maintenance --apply

# Inspecione o estado do TaskFlow
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## O que cria uma tarefa

| Origem                 | Tipo de runtime | Quando um registro de tarefa é criado                  | Política de notificação padrão |
| ---------------------- | --------------- | ------------------------------------------------------ | ------------------------------ |
| Execuções em segundo plano do ACP | `acp`        | Ao criar uma sessão ACP filha                          | `done_only`                    |
| Orquestração de subagentes | `subagent`   | Ao criar um subagente via `sessions_spawn`             | `done_only`                    |
| Trabalhos de Cron (todos os tipos) | `cron`     | Toda execução de Cron (sessão principal e isolada)     | `silent`                       |
| Operações da CLI       | `cli`           | Comandos `openclaw agent` executados pelo Gateway      | `silent`                       |
| Trabalhos de mídia do agente | `cli`      | Execuções `video_generate` com suporte de sessão       | `silent`                       |

Tarefas de Cron da sessão principal usam a política de notificação `silent` por padrão — elas criam registros para rastreamento, mas não geram notificações. Tarefas de Cron isoladas também usam `silent` por padrão, mas são mais visíveis porque são executadas em sua própria sessão.

Execuções `video_generate` com suporte de sessão também usam a política de notificação `silent`. Elas ainda criam registros de tarefa, mas a conclusão é devolvida à sessão original do agente como um despertar interno, para que o agente possa escrever a mensagem de acompanhamento e anexar o vídeo finalizado por conta própria. Se você ativar `tools.media.asyncCompletion.directSend`, conclusões assíncronas de `music_generate` e `video_generate` tentam primeiro a entrega direta ao canal antes de recorrer ao caminho de despertar da sessão solicitante.

Enquanto uma tarefa `video_generate` com suporte de sessão ainda estiver ativa, a ferramenta também atua como proteção: chamadas repetidas de `video_generate` nessa mesma sessão retornam o status da tarefa ativa em vez de iniciar uma segunda geração concorrente. Use `action: "status"` quando quiser uma consulta explícita de progresso/status do lado do agente.

**O que não cria tarefas:**

- Turnos de Heartbeat — sessão principal; veja [Heartbeat](/pt-BR/gateway/heartbeat)
- Turnos normais de chat interativo
- Respostas diretas de `/command`

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
| ----------- | ------------------------------------------------------------------------- |
| `queued`    | Criada, aguardando o agente iniciar                                       |
| `running`   | O turno do agente está sendo executado ativamente                         |
| `succeeded` | Concluída com sucesso                                                     |
| `failed`    | Concluída com erro                                                        |
| `timed_out` | Excedeu o tempo limite configurado                                        |
| `cancelled` | Interrompida pelo operador via `openclaw tasks cancel`                    |
| `lost`      | O runtime perdeu o estado de respaldo autoritativo após um período de carência de 5 minutos |

As transições acontecem automaticamente — quando a execução de agente associada termina, o status da tarefa é atualizado para corresponder.

`lost` depende do runtime:

- Tarefas do ACP: os metadados da sessão filha do ACP desapareceram.
- Tarefas de subagente: a sessão filha de respaldo desapareceu do armazenamento do agente de destino.
- Tarefas de Cron: o runtime do Cron não rastreia mais o trabalho como ativo.
- Tarefas da CLI: tarefas isoladas de sessão filha usam a sessão filha; tarefas da CLI baseadas em chat usam, em vez disso, o contexto de execução ativo, então linhas persistentes de sessão de canal/grupo/direta não as mantêm ativas.

## Entrega e notificações

Quando uma tarefa atinge um estado terminal, o OpenClaw notifica você. Há dois caminhos de entrega:

**Entrega direta** — se a tarefa tiver um destino de canal (o `requesterOrigin`), a mensagem de conclusão vai diretamente para esse canal (Telegram, Discord, Slack etc.). Para conclusões de subagentes, o OpenClaw também preserva o roteamento vinculado de thread/tópico quando disponível e pode preencher um `to` / conta ausente a partir da rota armazenada da sessão solicitante (`lastChannel` / `lastTo` / `lastAccountId`) antes de desistir da entrega direta.

**Entrega enfileirada na sessão** — se a entrega direta falhar ou nenhuma origem estiver definida, a atualização será enfileirada como um evento do sistema na sessão do solicitante e aparecerá no próximo Heartbeat.

<Tip>
A conclusão da tarefa aciona um despertar imediato do Heartbeat para que você veja o resultado rapidamente — você não precisa esperar o próximo tick agendado do Heartbeat.
</Tip>

Isso significa que o fluxo de trabalho usual é baseado em envio: inicie o trabalho desacoplado uma vez e depois deixe o runtime despertar ou notificar você na conclusão. Faça polling do estado da tarefa apenas quando precisar de depuração, intervenção ou de uma auditoria explícita.

### Políticas de notificação

Controle quanto você quer ouvir sobre cada tarefa:

| Política              | O que é entregue                                                         |
| --------------------- | ------------------------------------------------------------------------ |
| `done_only` (padrão)  | Apenas o estado terminal (succeeded, failed etc.) — **este é o padrão** |
| `state_changes`       | Toda transição de estado e atualização de progresso                      |
| `silent`              | Nada                                                                      |

Altere a política enquanto uma tarefa estiver em execução:

```bash
openclaw tasks notify <lookup> state_changes
```

## Referência da CLI

### `tasks list`

```bash
openclaw tasks list [--runtime <acp|subagent|cron|cli>] [--status <status>] [--json]
```

Colunas de saída: ID da tarefa, Tipo, Status, Entrega, ID da execução, Sessão filha, Resumo.

### `tasks show`

```bash
openclaw tasks show <lookup>
```

O token de busca aceita um ID de tarefa, ID de execução ou chave de sessão. Mostra o registro completo, incluindo tempo, estado de entrega, erro e resumo terminal.

### `tasks cancel`

```bash
openclaw tasks cancel <lookup>
```

Para tarefas do ACP e de subagente, isso encerra a sessão filha. Para tarefas rastreadas pela CLI, o cancelamento é registrado no registro de tarefas (não há um identificador separado de runtime filho). O status passa para `cancelled` e uma notificação de entrega é enviada quando aplicável.

### `tasks notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

### `tasks audit`

```bash
openclaw tasks audit [--json]
```

Destaca problemas operacionais. As descobertas também aparecem em `openclaw status` quando problemas são detectados.

| Achado                    | Severidade | Gatilho                                              |
| ------------------------- | ---------- | ---------------------------------------------------- |
| `stale_queued`            | warn       | Em fila por mais de 10 minutos                       |
| `stale_running`           | error      | Em execução por mais de 30 minutos                   |
| `lost`                    | error      | A propriedade da tarefa com suporte de runtime desapareceu |
| `delivery_failed`         | warn       | A entrega falhou e a política de notificação não é `silent` |
| `missing_cleanup`         | warn       | Tarefa terminal sem carimbo de data/hora de limpeza  |
| `inconsistent_timestamps` | warn       | Violação da linha do tempo (por exemplo, terminou antes de iniciar) |

### `tasks maintenance`

```bash
openclaw tasks maintenance [--json]
openclaw tasks maintenance --apply [--json]
```

Use isso para visualizar ou aplicar reconciliação, marcação de limpeza e remoção para tarefas e estado do TaskFlow.

A reconciliação depende do runtime:

- Tarefas do ACP/subagente verificam sua sessão filha de respaldo.
- Tarefas de Cron verificam se o runtime do Cron ainda é dono do trabalho.
- Tarefas da CLI baseadas em chat verificam o contexto de execução ativo proprietário, não apenas a linha da sessão de chat.

A limpeza de conclusão também depende do runtime:

- A conclusão de subagente fecha, em regime de melhor esforço, abas/processos de navegador rastreados para a sessão filha antes que a limpeza do anúncio continue.
- A conclusão de Cron isolado fecha, em regime de melhor esforço, abas/processos de navegador rastreados para a sessão do Cron antes que a execução seja totalmente encerrada.
- A entrega de Cron isolado espera o acompanhamento de subagente descendente quando necessário e suprime texto antigo de confirmação do pai em vez de anunciá-lo.
- A entrega de conclusão de subagente prefere o texto de assistente visível mais recente; se ele estiver vazio, recorre ao texto mais recente saneado de tool/toolResult, e execuções de chamada de ferramenta somente com timeout podem ser reduzidas a um resumo curto de progresso parcial. Execuções terminais com falha anunciam o status de falha sem reproduzir o texto de resposta capturado.
- Falhas de limpeza não mascaram o resultado real da tarefa.

### `tasks flow list|show|cancel`

```bash
openclaw tasks flow list [--status <status>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Use estes comandos quando o Task Flow de orquestração for o que importa para você, em vez de um registro individual de tarefa em segundo plano.

## Painel de tarefas no chat (`/tasks`)

Use `/tasks` em qualquer sessão de chat para ver tarefas em segundo plano vinculadas àquela sessão. O painel mostra
tarefas ativas e concluídas recentemente com runtime, status, tempo e detalhes de progresso ou erro.

Quando a sessão atual não tem tarefas vinculadas visíveis, `/tasks` recorre a contagens de tarefas locais do agente
para que você ainda tenha uma visão geral sem expor detalhes de outras sessões.

Para o registro completo do operador, use a CLI: `openclaw tasks list`.

## Integração com status (pressão de tarefas)

`openclaw status` inclui um resumo de tarefas para consulta rápida:

```
Tasks: 3 queued · 2 running · 1 issues
```

O resumo informa:

- **active** — contagem de `queued` + `running`
- **failures** — contagem de `failed` + `timed_out` + `lost`
- **byRuntime** — detalhamento por `acp`, `subagent`, `cron`, `cli`

Tanto `/status` quanto a ferramenta `session_status` usam um snapshot de tarefas sensível à limpeza: tarefas ativas têm
prioridade, linhas concluídas obsoletas ficam ocultas, e falhas recentes só aparecem quando não resta trabalho ativo.
Isso mantém o cartão de status focado no que importa agora.

## Armazenamento e manutenção

### Onde as tarefas ficam

Os registros de tarefas persistem em SQLite em:

```
$OPENCLAW_STATE_DIR/tasks/runs.sqlite
```

O registro é carregado na memória quando o Gateway é iniciado e sincroniza gravações com o SQLite para durabilidade entre reinicializações.

### Manutenção automática

Um processo de varredura é executado a cada **60 segundos** e cuida de três coisas:

1. **Reconciliação** — verifica se tarefas ativas ainda têm respaldo autoritativo no runtime. Tarefas do ACP/subagente usam o estado da sessão filha, tarefas de Cron usam a propriedade do trabalho ativo, e tarefas da CLI baseadas em chat usam o contexto de execução proprietário. Se esse estado de respaldo desaparecer por mais de 5 minutos, a tarefa será marcada como `lost`.
2. **Marcação de limpeza** — define um carimbo de data/hora `cleanupAfter` em tarefas terminais (`endedAt + 7 days`).
3. **Remoção** — exclui registros que ultrapassaram sua data `cleanupAfter`.

**Retenção**: registros de tarefas terminais são mantidos por **7 dias** e depois removidos automaticamente. Nenhuma configuração é necessária.

## Como as tarefas se relacionam com outros sistemas

### Tarefas e Task Flow

[Task Flow](/pt-BR/automation/taskflow) é a camada de orquestração de fluxos acima das tarefas em segundo plano. Um único fluxo pode coordenar várias tarefas ao longo do seu ciclo de vida usando modos de sincronização gerenciados ou espelhados. Use `openclaw tasks` para inspecionar registros individuais de tarefas e `openclaw tasks flow` para inspecionar o fluxo de orquestração.

Veja [Task Flow](/pt-BR/automation/taskflow) para mais detalhes.

### Tarefas e Cron

Uma **definição** de trabalho de Cron fica em `~/.openclaw/cron/jobs.json`; o estado de execução do runtime fica ao lado dela em `~/.openclaw/cron/jobs-state.json`. **Toda** execução de Cron cria um registro de tarefa — tanto na sessão principal quanto de forma isolada. Tarefas de Cron da sessão principal usam a política de notificação `silent` por padrão, para que sejam rastreadas sem gerar notificações.

Veja [Trabalhos de Cron](/pt-BR/automation/cron-jobs).

### Tarefas e Heartbeat

Execuções de Heartbeat são turnos da sessão principal — elas não criam registros de tarefa. Quando uma tarefa é concluída, ela pode acionar um despertar do Heartbeat para que você veja o resultado prontamente.

Veja [Heartbeat](/pt-BR/gateway/heartbeat).

### Tarefas e sessões

Uma tarefa pode fazer referência a um `childSessionKey` (onde o trabalho é executado) e a um `requesterSessionKey` (quem o iniciou). Sessões são o contexto da conversa; tarefas são o rastreamento de atividade por cima disso.

### Tarefas e execuções de agentes

O `runId` de uma tarefa se vincula à execução do agente que realiza o trabalho. Eventos do ciclo de vida do agente (início, fim, erro) atualizam automaticamente o status da tarefa — você não precisa gerenciar o ciclo de vida manualmente.

## Relacionado

- [Automação e tarefas](/pt-BR/automation) — todos os mecanismos de automação em um relance
- [Task Flow](/pt-BR/automation/taskflow) — orquestração de fluxo acima das tarefas
- [Tarefas agendadas](/pt-BR/automation/cron-jobs) — agendamento de trabalho em segundo plano
- [Heartbeat](/pt-BR/gateway/heartbeat) — turnos periódicos da sessão principal
- [CLI: Tarefas](/pt-BR/cli/tasks) — referência de comandos da CLI
