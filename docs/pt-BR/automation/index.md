---
read_when:
    - Decidindo como automatizar o trabalho com OpenClaw
    - Escolhendo entre Heartbeat, Cron, hooks e ordens permanentes
    - Buscando o ponto de entrada certo para a automação
summary: 'Visão geral dos mecanismos de automação: tarefas, cron, hooks, ordens permanentes e TaskFlow'
title: Automação e tarefas
x-i18n:
    generated_at: "2026-04-25T13:40:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54524eb5d1fcb2b2e3e51117339be1949d980afaef1f6ae71fcfd764049f3f47
    source_path: automation/index.md
    workflow: 15
---

OpenClaw executa trabalhos em segundo plano por meio de tarefas, trabalhos agendados, hooks de eventos e instruções permanentes. Esta página ajuda você a escolher o mecanismo certo e a entender como eles se encaixam.

## Guia rápido de decisão

```mermaid
flowchart TD
    START([Do que você precisa?]) --> Q1{Agendar trabalho?}
    START --> Q2{Acompanhar trabalho desacoplado?}
    START --> Q3{Orquestrar fluxos de várias etapas?}
    START --> Q4{Reagir a eventos do ciclo de vida?}
    START --> Q5{Dar ao agente instruções persistentes?}

    Q1 -->|Sim| Q1a{Momento exato ou flexível?}
    Q1a -->|Exato| CRON["Tarefas Agendadas (Cron)"]
    Q1a -->|Flexível| HEARTBEAT[Heartbeat]

    Q2 -->|Sim| TASKS[Tarefas em segundo plano]
    Q3 -->|Sim| FLOW[TaskFlow]
    Q4 -->|Sim| HOOKS[Hooks]
    Q5 -->|Sim| SO[Ordens permanentes]
```

| Caso de uso                              | Recomendado           | Por quê                                          |
| ---------------------------------------- | --------------------- | ------------------------------------------------ |
| Enviar relatório diário às 9h em ponto   | Tarefas Agendadas (Cron) | Momento exato, execução isolada               |
| Lembre-me em 20 minutos                  | Tarefas Agendadas (Cron) | Execução única com momento preciso (`--at`)   |
| Executar análise aprofundada semanalmente | Tarefas Agendadas (Cron) | Tarefa independente, pode usar modelo diferente |
| Verificar a caixa de entrada a cada 30 min | Heartbeat            | Agrupa com outras verificações, ciente do contexto |
| Monitorar o calendário para próximos eventos | Heartbeat          | Encaixe natural para percepção periódica         |
| Inspecionar o status de um subagente ou execução ACP | Tarefas em segundo plano | O registro de tarefas acompanha todo o trabalho desacoplado |
| Auditar o que foi executado e quando     | Tarefas em segundo plano | `openclaw tasks list` e `openclaw tasks audit` |
| Pesquisa em várias etapas e depois resumo | TaskFlow             | Orquestração durável com rastreamento de revisão |
| Executar um script ao redefinir a sessão | Hooks                 | Orientado por eventos, dispara em eventos do ciclo de vida |
| Executar código em toda chamada de ferramenta | Hooks de Plugin    | Hooks em processo podem interceptar chamadas de ferramenta |
| Sempre verificar conformidade antes de responder | Ordens permanentes | Injetadas automaticamente em toda sessão        |

### Tarefas Agendadas (Cron) vs Heartbeat

| Dimensão        | Tarefas Agendadas (Cron)            | Heartbeat                            |
| --------------- | ----------------------------------- | ------------------------------------ |
| Momento         | Exato (expressões cron, execução única) | Aproximado (padrão a cada 30 min) |
| Contexto da sessão | Novo (isolado) ou compartilhado   | Contexto completo da sessão principal |
| Registros de tarefa | Sempre criados                   | Nunca criados                        |
| Entrega         | Canal, Webhook ou silenciosa        | Inline na sessão principal           |
| Melhor para     | Relatórios, lembretes, trabalhos em segundo plano | Verificações de caixa de entrada, calendário, notificações |

Use Tarefas Agendadas (Cron) quando você precisar de momento preciso ou execução isolada. Use Heartbeat quando o trabalho se beneficiar do contexto completo da sessão e o momento aproximado for suficiente.

## Conceitos principais

### Tarefas agendadas (cron)

Cron é o agendador integrado do Gateway para momentos precisos. Ele persiste trabalhos, ativa o agente no momento certo e pode entregar a saída a um canal de chat ou endpoint de Webhook. Oferece suporte a lembretes de execução única, expressões recorrentes e gatilhos de Webhook de entrada.

Consulte [Tarefas Agendadas](/pt-BR/automation/cron-jobs).

### Tarefas

O registro de tarefas em segundo plano acompanha todo o trabalho desacoplado: execuções ACP, inicializações de subagentes, execuções cron isoladas e operações de CLI. Tarefas são registros, não agendadores. Use `openclaw tasks list` e `openclaw tasks audit` para inspecioná-las.

Consulte [Tarefas em segundo plano](/pt-BR/automation/tasks).

### TaskFlow

TaskFlow é a camada de orquestração de fluxos acima das tarefas em segundo plano. Ela gerencia fluxos duráveis de várias etapas com modos de sincronização gerenciado e espelhado, rastreamento de revisão e `openclaw tasks flow list|show|cancel` para inspeção.

Consulte [TaskFlow](/pt-BR/automation/taskflow).

### Ordens permanentes

Ordens permanentes concedem ao agente autoridade operacional permanente para programas definidos. Elas ficam em arquivos do workspace (normalmente `AGENTS.md`) e são injetadas em toda sessão. Combine com cron para aplicação baseada em tempo.

Consulte [Ordens permanentes](/pt-BR/automation/standing-orders).

### Hooks

Hooks internos são scripts orientados por eventos acionados por eventos do ciclo de vida do agente
(`/new`, `/reset`, `/stop`), Compaction da sessão, inicialização do gateway e fluxo
de mensagens. Eles são descobertos automaticamente a partir de diretórios e podem ser gerenciados
com `openclaw hooks`. Para interceptação em processo de chamadas de ferramenta, use
[Hooks de Plugin](/pt-BR/plugins/hooks).

Consulte [Hooks](/pt-BR/automation/hooks).

### Heartbeat

Heartbeat é um turno periódico da sessão principal (padrão a cada 30 minutos). Ele agrupa várias verificações (caixa de entrada, calendário, notificações) em um único turno do agente com contexto completo da sessão. Turnos de Heartbeat não criam registros de tarefa. Use `HEARTBEAT.md` para uma pequena lista de verificação, ou um bloco `tasks:` quando quiser verificações periódicas somente no vencimento dentro do próprio heartbeat. Arquivos heartbeat vazios são ignorados como `empty-heartbeat-file`; o modo de tarefa somente no vencimento é ignorado como `no-tasks-due`.

Consulte [Heartbeat](/pt-BR/gateway/heartbeat).

## Como eles funcionam juntos

- **Cron** lida com agendas precisas (relatórios diários, revisões semanais) e lembretes de execução única. Todas as execuções cron criam registros de tarefa.
- **Heartbeat** lida com monitoramento de rotina (caixa de entrada, calendário, notificações) em um único turno agrupado a cada 30 minutos.
- **Hooks** reagem a eventos específicos (redefinições de sessão, Compaction, fluxo de mensagens) com scripts personalizados. Hooks de Plugin cobrem chamadas de ferramenta.
- **Ordens permanentes** dão ao agente contexto persistente e limites de autoridade.
- **TaskFlow** coordena fluxos de várias etapas acima de tarefas individuais.
- **Tarefas** acompanham automaticamente todo o trabalho desacoplado para que você possa inspecioná-lo e auditá-lo.

## Relacionados

- [Tarefas Agendadas](/pt-BR/automation/cron-jobs) — agendamento preciso e lembretes de execução única
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — registro de tarefas para todo o trabalho desacoplado
- [TaskFlow](/pt-BR/automation/taskflow) — orquestração durável de fluxos de várias etapas
- [Hooks](/pt-BR/automation/hooks) — scripts de ciclo de vida orientados por eventos
- [Hooks de Plugin](/pt-BR/plugins/hooks) — hooks em processo de ferramenta, prompt, mensagem e ciclo de vida
- [Ordens permanentes](/pt-BR/automation/standing-orders) — instruções persistentes do agente
- [Heartbeat](/pt-BR/gateway/heartbeat) — turnos periódicos da sessão principal
- [Referência de configuração](/pt-BR/gateway/configuration-reference) — todas as chaves de configuração
