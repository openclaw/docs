---
read_when:
    - Inspecionando trabalho em segundo plano em andamento ou concluído recentemente
    - Depurando falhas de entrega para execuções destacadas de agentes
    - Entendendo como execuções em segundo plano se relacionam com sessões, cron e heartbeat
summary: Rastreamento de tarefas em segundo plano para execuções ACP, subagentes, trabalhos cron isolados e operações da CLI
title: Tarefas em Segundo Plano
x-i18n:
    generated_at: "2026-04-06T03:06:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f56c1ac23237907a090c69c920c09578a2f56f5d8bf750c7f2136c603c8a8ff
    source_path: automation/tasks.md
    workflow: 15
---

# Tarefas em Segundo Plano

> **Procurando agendamento?** Consulte [Automação e Tarefas](/pt-BR/automation) para escolher o mecanismo certo. Esta página cobre o **rastreamento** do trabalho em segundo plano, não o agendamento dele.

As tarefas em segundo plano rastreiam trabalho que é executado **fora da sua sessão principal de conversa**:
execuções ACP, inicializações de subagentes, execuções isoladas de trabalhos cron e operações iniciadas pela CLI.

As tarefas **não** substituem sessões, trabalhos cron ou heartbeats — elas são o **registro de atividade** que registra qual trabalho destacado aconteceu, quando aconteceu e se foi bem-sucedido.

<Note>
Nem toda execução de agente cria uma tarefa. Turnos de heartbeat e chat interativo normal não criam. Todas as execuções cron, inicializações ACP, inicializações de subagentes e comandos de agente da CLI criam.
</Note>

## Resumo rápido

- Tarefas são **registros**, não agendadores — cron e heartbeat decidem _quando_ o trabalho é executado, as tarefas rastreiam _o que aconteceu_.
- ACP, subagentes, todos os trabalhos cron e operações da CLI criam tarefas. Turnos de heartbeat não criam.
- Cada tarefa passa por `queued → running → terminal` (succeeded, failed, timed_out, cancelled ou lost).
- As tarefas cron permanecem ativas enquanto o runtime cron ainda for responsável pelo trabalho; tarefas da CLI com suporte de chat permanecem ativas apenas enquanto seu contexto de execução proprietário ainda estiver ativo.
- A conclusão é orientada por envio: o trabalho destacado pode notificar diretamente ou despertar a sessão solicitante/heartbeat quando termina, então loops de polling de status geralmente não são o formato correto.
- Execuções cron isoladas e conclusões de subagentes limpam por melhor esforço abas/processos de navegador rastreados para sua sessão filha antes da contabilidade final de limpeza.
- A entrega de cron isolado suprime respostas intermediárias obsoletas do pai enquanto o trabalho de subagentes descendentes ainda está sendo drenado, e prefere a saída final descendente quando ela chega antes da entrega.
- Notificações de conclusão são entregues diretamente a um canal ou enfileiradas para o próximo heartbeat.
- `openclaw tasks list` mostra todas as tarefas; `openclaw tasks audit` exibe problemas.
- Registros terminais são mantidos por 7 dias e depois removidos automaticamente.

## Início rápido

```bash
# Lista todas as tarefas (mais recentes primeiro)
openclaw tasks list

# Filtra por runtime ou status
openclaw tasks list --runtime acp
openclaw tasks list --status running

# Mostra detalhes de uma tarefa específica (por ID, ID de execução ou chave de sessão)
openclaw tasks show <lookup>

# Cancela uma tarefa em execução (mata a sessão filha)
openclaw tasks cancel <lookup>

# Altera a política de notificação de uma tarefa
openclaw tasks notify <lookup> state_changes

# Executa uma auditoria de integridade
openclaw tasks audit

# Visualiza ou aplica manutenção
openclaw tasks maintenance
openclaw tasks maintenance --apply

# Inspeciona o estado do Task Flow
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## O que cria uma tarefa

| Origem                 | Tipo de runtime | Quando um registro de tarefa é criado                  | Política de notificação padrão |
| ---------------------- | --------------- | ----------------------------------------------------- | ------------------------------ |
| Execuções em segundo plano do ACP | `acp`        | Ao iniciar uma sessão filha do ACP                    | `done_only`                    |
| Orquestração de subagentes | `subagent`   | Ao iniciar um subagente via `sessions_spawn`          | `done_only`                    |
| Trabalhos cron (todos os tipos) | `cron`       | Toda execução cron (sessão principal e isolada)       | `silent`                       |
| Operações da CLI       | `cli`           | Comandos `openclaw agent` executados por meio do gateway | `silent`                    |
| Trabalhos de mídia do agente | `cli`      | Execuções `video_generate` com suporte de sessão      | `silent`                       |

Tarefas cron da sessão principal usam a política de notificação `silent` por padrão — elas criam registros para rastreamento, mas não geram notificações. Tarefas cron isoladas também usam `silent` por padrão, mas são mais visíveis porque são executadas na própria sessão.

Execuções `video_generate` com suporte de sessão também usam a política de notificação `silent`. Elas ainda criam registros de tarefa, mas a conclusão é devolvida à sessão original do agente como um wake interno para que o agente possa escrever a mensagem de acompanhamento e anexar ele mesmo o vídeo finalizado. Se você optar por `tools.media.asyncCompletion.directSend`, conclusões assíncronas de `music_generate` e `video_generate` tentam primeiro a entrega direta ao canal antes de recorrer ao caminho de wake da sessão solicitante.

Enquanto uma tarefa `video_generate` com suporte de sessão ainda estiver ativa, a ferramenta também atua como um guardrail: chamadas repetidas de `video_generate` nessa mesma sessão retornam o status da tarefa ativa em vez de iniciar uma segunda geração concorrente. Use `action: "status"` quando quiser uma consulta explícita de progresso/status do lado do agente.

**O que não cria tarefas:**

- Turnos de heartbeat — sessão principal; consulte [Heartbeat](/pt-BR/gateway/heartbeat)
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

| Status      | O que significa                                                            |
| ----------- | -------------------------------------------------------------------------- |
| `queued`    | Criada, aguardando o agente iniciar                                        |
| `running`   | O turno do agente está em execução ativa                                   |
| `succeeded` | Concluída com sucesso                                                      |
| `failed`    | Concluída com erro                                                         |
| `timed_out` | Excedeu o tempo limite configurado                                         |
| `cancelled` | Interrompida pelo operador via `openclaw tasks cancel`                     |
| `lost`      | O runtime perdeu o estado de suporte autoritativo após um período de carência de 5 minutos |

As transições acontecem automaticamente — quando a execução do agente associada termina, o status da tarefa é atualizado para corresponder.

`lost` depende do runtime:

- Tarefas ACP: os metadados da sessão filha do ACP de suporte desapareceram.
- Tarefas de subagente: a sessão filha de suporte desapareceu do armazenamento do agente de destino.
- Tarefas cron: o runtime cron não rastreia mais o trabalho como ativo.
- Tarefas da CLI: tarefas isoladas de sessão filha usam a sessão filha; tarefas da CLI com suporte de chat usam o contexto de execução ativo em vez disso, então linhas persistentes de sessão de canal/grupo/direta não as mantêm ativas.

## Entrega e notificações

Quando uma tarefa atinge um estado terminal, o OpenClaw notifica você. Há dois caminhos de entrega:

**Entrega direta** — se a tarefa tiver um destino de canal (o `requesterOrigin`), a mensagem de conclusão vai diretamente para esse canal (Telegram, Discord, Slack etc.). Para conclusões de subagentes, o OpenClaw também preserva o roteamento vinculado de thread/tópico quando disponível e pode preencher um `to` / conta ausente a partir da rota armazenada da sessão solicitante (`lastChannel` / `lastTo` / `lastAccountId`) antes de desistir da entrega direta.

**Entrega enfileirada na sessão** — se a entrega direta falhar ou nenhuma origem estiver definida, a atualização é enfileirada como um evento de sistema na sessão do solicitante e aparece no próximo heartbeat.

<Tip>
A conclusão da tarefa aciona um wake imediato do heartbeat para que você veja o resultado rapidamente — você não precisa esperar o próximo tick agendado do heartbeat.
</Tip>

Isso significa que o fluxo de trabalho usual é baseado em envio: inicie o trabalho destacado uma vez e depois deixe o runtime despertar ou notificar você na conclusão. Faça polling do estado da tarefa apenas quando precisar de depuração, intervenção ou uma auditoria explícita.

### Políticas de notificação

Controle o quanto você recebe de informação sobre cada tarefa:

| Política              | O que é entregue                                                         |
| --------------------- | ------------------------------------------------------------------------ |
| `done_only` (padrão)  | Apenas o estado terminal (succeeded, failed etc.) — **este é o padrão** |
| `state_changes`       | Toda transição de estado e atualização de progresso                      |
| `silent`              | Nada                                                                     |

Altere a política enquanto uma tarefa estiver em execução:

```bash
openclaw tasks notify <lookup> state_changes
```

## Referência da CLI

### `tasks list`

```bash
openclaw tasks list [--runtime <acp|subagent|cron|cli>] [--status <status>] [--json]
```

Colunas de saída: ID da tarefa, Tipo, Status, Entrega, ID de execução, Sessão filha, Resumo.

### `tasks show`

```bash
openclaw tasks show <lookup>
```

O token de lookup aceita um ID de tarefa, ID de execução ou chave de sessão. Mostra o registro completo, incluindo tempo, estado de entrega, erro e resumo terminal.

### `tasks cancel`

```bash
openclaw tasks cancel <lookup>
```

Para tarefas ACP e de subagente, isso mata a sessão filha. O status passa para `cancelled` e uma notificação de entrega é enviada.

### `tasks notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

### `tasks audit`

```bash
openclaw tasks audit [--json]
```

Exibe problemas operacionais. As descobertas também aparecem em `openclaw status` quando problemas são detectados.

| Descoberta                | Severidade | Gatilho                                              |
| ------------------------- | ---------- | ---------------------------------------------------- |
| `stale_queued`            | warn       | Em fila por mais de 10 minutos                       |
| `stale_running`           | error      | Em execução por mais de 30 minutos                   |
| `lost`                    | error      | A propriedade da tarefa com suporte de runtime desapareceu |
| `delivery_failed`         | warn       | A entrega falhou e a política de notificação não é `silent` |
| `missing_cleanup`         | warn       | Tarefa terminal sem timestamp de limpeza             |
| `inconsistent_timestamps` | warn       | Violação da linha do tempo (por exemplo, terminou antes de iniciar) |

### `tasks maintenance`

```bash
openclaw tasks maintenance [--json]
openclaw tasks maintenance --apply [--json]
```

Use isto para visualizar ou aplicar reconciliação, marcação de limpeza e remoção para tarefas e estado do Task Flow.

A reconciliação depende do runtime:

- Tarefas ACP/subagente verificam sua sessão filha de suporte.
- Tarefas cron verificam se o runtime cron ainda é responsável pelo trabalho.
- Tarefas da CLI com suporte de chat verificam o contexto de execução ativo proprietário, não apenas a linha de sessão de chat.

A limpeza de conclusão também depende do runtime:

- A conclusão de subagente fecha por melhor esforço abas/processos de navegador rastreados para a sessão filha antes de a limpeza do anúncio continuar.
- A conclusão de cron isolado fecha por melhor esforço abas/processos de navegador rastreados para a sessão cron antes de a execução ser totalmente encerrada.
- A entrega de cron isolado espera o acompanhamento descendente de subagentes quando necessário e suprime texto obsoleto de confirmação do pai em vez de anunciá-lo.
- A entrega de conclusão de subagente prefere o texto visível mais recente do assistente; se ele estiver vazio, recorre ao texto sanitizado mais recente de tool/toolResult, e execuções de chamada de ferramenta apenas com timeout podem ser reduzidas a um breve resumo de progresso parcial.
- Falhas de limpeza não mascaram o resultado real da tarefa.

### `tasks flow list|show|cancel`

```bash
openclaw tasks flow list [--status <status>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Use estes comandos quando o Task Flow de orquestração for aquilo com que você se importa, em vez de um registro individual de tarefa em segundo plano.

## Painel de tarefas no chat (`/tasks`)

Use `/tasks` em qualquer sessão de chat para ver tarefas em segundo plano vinculadas a essa sessão. O painel mostra tarefas ativas e concluídas recentemente com runtime, status, tempo e detalhes de progresso ou erro.

Quando a sessão atual não tem tarefas vinculadas visíveis, `/tasks` recorre a contagens de tarefas locais do agente para que você ainda tenha uma visão geral sem expor detalhes de outras sessões.

Para o registro completo do operador, use a CLI: `openclaw tasks list`.

## Integração com status (pressão de tarefas)

`openclaw status` inclui um resumo rápido das tarefas:

```
Tasks: 3 queued · 2 running · 1 issues
```

O resumo informa:

- **active** — contagem de `queued` + `running`
- **failures** — contagem de `failed` + `timed_out` + `lost`
- **byRuntime** — detalhamento por `acp`, `subagent`, `cron`, `cli`

Tanto `/status` quanto a ferramenta `session_status` usam um snapshot de tarefas com reconhecimento de limpeza: tarefas ativas têm prioridade, linhas concluídas obsoletas ficam ocultas, e falhas recentes só aparecem quando não resta trabalho ativo. Isso mantém o cartão de status focado no que importa agora.

## Armazenamento e manutenção

### Onde as tarefas ficam

Os registros de tarefas persistem no SQLite em:

```
$OPENCLAW_STATE_DIR/tasks/runs.sqlite
```

O registro é carregado na memória na inicialização do gateway e sincroniza gravações com o SQLite para durabilidade entre reinicializações.

### Manutenção automática

Um varredor é executado a cada **60 segundos** e cuida de três coisas:

1. **Reconciliação** — verifica se tarefas ativas ainda têm suporte autoritativo de runtime. Tarefas ACP/subagente usam o estado da sessão filha, tarefas cron usam a propriedade do trabalho ativo, e tarefas da CLI com suporte de chat usam o contexto de execução proprietário. Se esse estado de suporte desaparecer por mais de 5 minutos, a tarefa é marcada como `lost`.
2. **Marcação de limpeza** — define um timestamp `cleanupAfter` em tarefas terminais (`endedAt` + 7 dias).
3. **Remoção** — exclui registros que passaram da data `cleanupAfter`.

**Retenção**: registros de tarefas terminais são mantidos por **7 dias** e depois removidos automaticamente. Nenhuma configuração é necessária.

## Como as tarefas se relacionam com outros sistemas

### Tarefas e Task Flow

[Task Flow](/pt-BR/automation/taskflow) é a camada de orquestração de fluxo acima das tarefas em segundo plano. Um único fluxo pode coordenar várias tarefas ao longo de sua vida útil usando modos de sincronização gerenciados ou espelhados. Use `openclaw tasks` para inspecionar registros individuais de tarefas e `openclaw tasks flow` para inspecionar o fluxo de orquestração.

Consulte [Task Flow](/pt-BR/automation/taskflow) para mais detalhes.

### Tarefas e cron

Uma **definição** de trabalho cron fica em `~/.openclaw/cron/jobs.json`. **Toda** execução cron cria um registro de tarefa — tanto principal quanto isolada. Tarefas cron da sessão principal usam a política de notificação `silent` por padrão para rastrear sem gerar notificações.

Consulte [Trabalhos Cron](/pt-BR/automation/cron-jobs).

### Tarefas e heartbeat

Execuções de heartbeat são turnos da sessão principal — elas não criam registros de tarefa. Quando uma tarefa é concluída, ela pode acionar um wake do heartbeat para que você veja o resultado rapidamente.

Consulte [Heartbeat](/pt-BR/gateway/heartbeat).

### Tarefas e sessões

Uma tarefa pode referenciar uma `childSessionKey` (onde o trabalho é executado) e uma `requesterSessionKey` (quem o iniciou). Sessões são contexto de conversa; tarefas são rastreamento de atividade sobre esse contexto.

### Tarefas e execuções de agente

O `runId` de uma tarefa se vincula à execução do agente que está realizando o trabalho. Eventos do ciclo de vida do agente (início, término, erro) atualizam automaticamente o status da tarefa — você não precisa gerenciar o ciclo de vida manualmente.

## Relacionado

- [Automação e Tarefas](/pt-BR/automation) — todos os mecanismos de automação em um relance
- [Task Flow](/pt-BR/automation/taskflow) — orquestração de fluxo acima das tarefas
- [Tarefas Agendadas](/pt-BR/automation/cron-jobs) — agendamento de trabalho em segundo plano
- [Heartbeat](/pt-BR/gateway/heartbeat) — turnos periódicos da sessão principal
- [CLI: Tarefas](/cli/index#tasks) — referência de comandos da CLI
