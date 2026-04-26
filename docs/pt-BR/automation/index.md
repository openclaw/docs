---
read_when:
    - Decidindo como automatizar o trabalho com OpenClaw
    - Escolhendo entre Heartbeat, Cron, hooks e ordens permanentes
    - Procurando o ponto de entrada de automação certo
summary: 'Visão geral dos mecanismos de automação: tarefas, cron, hooks, ordens permanentes e TaskFlow'
title: Automação e tarefas
x-i18n:
    generated_at: "2026-04-26T11:23:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d2a2d3ef58830133e07b34f33c611664fc1032247e9dd81005adf7fc0c43cdb
    source_path: automation/index.md
    workflow: 15
---

OpenClaw executa trabalho em segundo plano por meio de tarefas, jobs agendados, hooks de eventos e instruções permanentes. Esta página ajuda você a escolher o mecanismo certo e a entender como eles se encaixam.

## Guia rápido de decisão

```mermaid
flowchart TD
    START([Do que você precisa?]) --> Q1{Agendar trabalho?}
    START --> Q2{Acompanhar trabalho desacoplado?}
    START --> Q3{Orquestrar fluxos de várias etapas?}
    START --> Q4{Reagir a eventos do ciclo de vida?}
    START --> Q5{Dar instruções persistentes ao agente?}

    Q1 -->|Sim| Q1a{Tempo exato ou flexível?}
    Q1a -->|Exato| CRON["Tarefas Agendadas (Cron)"]
    Q1a -->|Flexível| HEARTBEAT[Heartbeat]

    Q2 -->|Sim| TASKS[Tarefas em segundo plano]
    Q3 -->|Sim| FLOW[Task Flow]
    Q4 -->|Sim| HOOKS[Hooks]
    Q5 -->|Sim| SO[Ordens permanentes]
```

| Caso de uso                             | Recomendado           | Motivo                                           |
| --------------------------------------- | --------------------- | ------------------------------------------------ |
| Enviar relatório diário às 9h em ponto  | Tarefas Agendadas (Cron) | Tempo exato, execução isolada                 |
| Lembre-me em 20 minutos                 | Tarefas Agendadas (Cron) | Execução única com tempo preciso (`--at`)     |
| Executar análise profunda semanal       | Tarefas Agendadas (Cron) | Tarefa independente, pode usar outro modelo   |
| Verificar caixa de entrada a cada 30 min | Heartbeat            | Agrupa com outras verificações, ciente do contexto |
| Monitorar calendário para próximos eventos | Heartbeat           | Encaixe natural para percepção periódica      |
| Inspecionar o status de um subagente ou execução ACP | Tarefas em segundo plano | O registro de tarefas acompanha todo trabalho desacoplado |
| Auditar o que executou e quando         | Tarefas em segundo plano | `openclaw tasks list` e `openclaw tasks audit` |
| Pesquisa de várias etapas e depois resumir | Task Flow           | Orquestração durável com rastreamento de revisões |
| Executar um script ao redefinir a sessão | Hooks                | Orientado por eventos, dispara em eventos do ciclo de vida |
| Executar código em toda chamada de ferramenta | Plugin hooks       | Hooks em processo podem interceptar chamadas de ferramentas |
| Sempre verificar conformidade antes de responder | Ordens permanentes | Injetadas automaticamente em toda sessão      |

### Tarefas Agendadas (Cron) vs Heartbeat

| Dimensão        | Tarefas Agendadas (Cron)            | Heartbeat                            |
| --------------- | ----------------------------------- | ------------------------------------ |
| Tempo           | Exato (expressões cron, execução única) | Aproximado (padrão a cada 30 min) |
| Contexto da sessão | Nova (isolada) ou compartilhada   | Contexto completo da sessão principal |
| Registros de tarefas | Sempre criados                 | Nunca criados                        |
| Entrega         | Canal, webhook ou silenciosa        | Inline na sessão principal           |
| Melhor para     | Relatórios, lembretes, jobs em segundo plano | Verificações de caixa de entrada, calendário, notificações |

Use Tarefas Agendadas (Cron) quando você precisar de tempo preciso ou execução isolada. Use Heartbeat quando o trabalho se beneficiar do contexto completo da sessão e um tempo aproximado for suficiente.

## Conceitos principais

### Tarefas agendadas (cron)

Cron é o agendador integrado do Gateway para tempo preciso. Ele persiste jobs, desperta o agente no momento certo e pode entregar a saída para um canal de chat ou endpoint de Webhook. Suporta lembretes de execução única, expressões recorrentes e gatilhos de Webhook de entrada.

Veja [Tarefas Agendadas](/pt-BR/automation/cron-jobs).

### Tarefas

O registro de tarefas em segundo plano acompanha todo trabalho desacoplado: execuções ACP, inicializações de subagentes, execuções cron isoladas e operações de CLI. Tarefas são registros, não agendadores. Use `openclaw tasks list` e `openclaw tasks audit` para inspecioná-las.

Veja [Tarefas em segundo plano](/pt-BR/automation/tasks).

### Task Flow

Task Flow é o substrato de orquestração de fluxos acima das tarefas em segundo plano. Ele gerencia fluxos duráveis de várias etapas com modos de sincronização gerenciada e espelhada, rastreamento de revisões e `openclaw tasks flow list|show|cancel` para inspeção.

Veja [Task Flow](/pt-BR/automation/taskflow).

### Ordens permanentes

Ordens permanentes concedem ao agente autoridade operacional permanente para programas definidos. Elas ficam em arquivos do workspace (normalmente `AGENTS.md`) e são injetadas em toda sessão. Combine com cron para aplicação baseada em tempo.

Veja [Ordens permanentes](/pt-BR/automation/standing-orders).

### Hooks

Hooks internos são scripts orientados por eventos disparados por eventos do ciclo de vida do agente
(`/new`, `/reset`, `/stop`), Compaction da sessão, inicialização do gateway e fluxo
de mensagens. Eles são descobertos automaticamente em diretórios e podem ser gerenciados
com `openclaw hooks`. Para interceptação em processo de chamadas de ferramentas, use
[Plugin hooks](/pt-BR/plugins/hooks).

Veja [Hooks](/pt-BR/automation/hooks).

### Heartbeat

Heartbeat é um turno periódico da sessão principal (padrão a cada 30 minutos). Ele agrupa várias verificações (caixa de entrada, calendário, notificações) em um único turno do agente com contexto completo da sessão. Turnos de Heartbeat não criam registros de tarefas e não estendem a atualização de redefinição diária/ociosa da sessão. Use `HEARTBEAT.md` para uma pequena lista de verificação, ou um bloco `tasks:` quando você quiser verificações periódicas apenas quando vencidas dentro do próprio heartbeat. Arquivos heartbeat vazios são ignorados como `empty-heartbeat-file`; o modo de tarefas apenas quando vencidas é ignorado como `no-tasks-due`.

Veja [Heartbeat](/pt-BR/gateway/heartbeat).

## Como eles funcionam juntos

- **Cron** lida com agendamentos precisos (relatórios diários, revisões semanais) e lembretes de execução única. Todas as execuções cron criam registros de tarefas.
- **Heartbeat** lida com monitoramento de rotina (caixa de entrada, calendário, notificações) em um único turno agrupado a cada 30 minutos.
- **Hooks** reagem a eventos específicos (redefinições de sessão, compaction, fluxo de mensagens) com scripts personalizados. Plugin hooks cobrem chamadas de ferramentas.
- **Ordens permanentes** dão ao agente contexto persistente e limites de autoridade.
- **Task Flow** coordena fluxos de várias etapas acima de tarefas individuais.
- **Tarefas** acompanham automaticamente todo trabalho desacoplado para que você possa inspecioná-lo e auditá-lo.

## Relacionados

- [Tarefas Agendadas](/pt-BR/automation/cron-jobs) — agendamento preciso e lembretes de execução única
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — registro de tarefas para todo trabalho desacoplado
- [Task Flow](/pt-BR/automation/taskflow) — orquestração durável de fluxos de várias etapas
- [Hooks](/pt-BR/automation/hooks) — scripts de ciclo de vida orientados por eventos
- [Plugin hooks](/pt-BR/plugins/hooks) — hooks em processo de ferramentas, prompts, mensagens e ciclo de vida
- [Ordens permanentes](/pt-BR/automation/standing-orders) — instruções persistentes do agente
- [Heartbeat](/pt-BR/gateway/heartbeat) — turnos periódicos da sessão principal
- [Referência de Configuração](/pt-BR/gateway/configuration-reference) — todas as chaves de configuração
