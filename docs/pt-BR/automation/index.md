---
doc-schema-version: 1
read_when:
    - Decidindo como automatizar o trabalho com o OpenClaw
    - Escolhendo entre Heartbeat, Cron, compromissos, ganchos e instruções permanentes
    - Procurando o ponto de entrada de automação certo
summary: 'Visão geral dos mecanismos de automação: tarefas, cron, hooks, standing orders e Task Flow'
title: Automação
x-i18n:
    generated_at: "2026-05-12T23:29:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 311ebbd557e40e38cd25b2f11b887baa4576657095d5a0841d4cb7f71898927d
    source_path: automation/index.md
    workflow: 16
    postprocess_version: locale-links-v1
---

O OpenClaw executa trabalho em segundo plano por meio de tarefas, trabalhos agendados, compromissos inferidos, hooks de eventos e instruções permanentes. Esta página ajuda você a escolher o mecanismo certo e entender como eles se encaixam.

## Guia rápido de decisão

```mermaid
flowchart TD
    START([What do you need?]) --> Q1{Schedule work?}
    START --> Q2{Track detached work?}
    START --> Q3{Orchestrate multi-step flows?}
    START --> Q4{React to lifecycle events?}
    START --> Q5{Give the agent persistent instructions?}
    START --> Q6{Remember a natural follow-up?}

    Q1 -->|Yes| Q1a{Exact timing or flexible?}
    Q1a -->|Exact| CRON["Scheduled Tasks (Cron)"]
    Q1a -->|Flexible| HEARTBEAT[Heartbeat]

    Q2 -->|Yes| TASKS[Background Tasks]
    Q3 -->|Yes| FLOW[Task Flow]
    Q4 -->|Yes| HOOKS[Hooks]
    Q5 -->|Yes| SO[Standing Orders]
    Q6 -->|Yes| COMMITMENTS[Inferred Commitments]
```

| Caso de uso                              | Recomendado            | Por quê                                           |
| ---------------------------------------- | ---------------------- | ------------------------------------------------- |
| Enviar relatório diário às 9h em ponto   | Tarefas Agendadas (Cron) | Horário exato, execução isolada                 |
| Lembre-me em 20 minutos                  | Tarefas Agendadas (Cron) | Execução única com horário preciso (`--at`)     |
| Executar análise profunda semanal        | Tarefas Agendadas (Cron) | Tarefa independente, pode usar modelo diferente |
| Verificar caixa de entrada a cada 30 min | Heartbeat              | Agrupa com outras verificações, ciente de contexto |
| Monitorar calendário para eventos futuros | Heartbeat             | Encaixe natural para percepção periódica         |
| Fazer check-in após uma entrevista mencionada | Compromissos Inferidos | Acompanhamento semelhante a memória, sem solicitação exata de lembrete |
| Check-in cuidadoso após contexto do usuário | Compromissos Inferidos | Escopado para o mesmo agente e canal             |
| Inspecionar status de um subagente ou execução ACP | Tarefas em Segundo Plano | O ledger de tarefas rastreia todo trabalho destacado |
| Auditar o que rodou e quando             | Tarefas em Segundo Plano | `openclaw tasks list` e `openclaw tasks audit`   |
| Pesquisa em várias etapas e depois resumo | Task Flow             | Orquestração durável com rastreamento de revisão |
| Executar um script ao redefinir sessão   | Hooks                  | Orientado a eventos, dispara em eventos de ciclo de vida |
| Executar código em toda chamada de ferramenta | Hooks de Plugin     | Hooks em processo podem interceptar chamadas de ferramenta |
| Sempre verificar conformidade antes de responder | Ordens Permanentes | Injetadas automaticamente em toda sessão          |

### Tarefas Agendadas (Cron) vs Heartbeat

| Dimensão        | Tarefas Agendadas (Cron)            | Heartbeat                             |
| --------------- | ----------------------------------- | ------------------------------------- |
| Temporização    | Exata (expressões cron, execução única) | Aproximada (padrão a cada 30 min)  |
| Contexto da sessão | Novo (isolado) ou compartilhado | Contexto completo da sessão principal |
| Registros de tarefas | Sempre criados                | Nunca criados                         |
| Entrega         | Canal, webhook ou silenciosa        | Inline na sessão principal            |
| Melhor para     | Relatórios, lembretes, trabalhos em segundo plano | Verificações de caixa de entrada, calendário, notificações |

Use Tarefas Agendadas (Cron) quando precisar de temporização precisa ou execução isolada. Use Heartbeat quando o trabalho se beneficiar do contexto completo da sessão e uma temporização aproximada for suficiente.

## Conceitos principais

### Tarefas agendadas (cron)

Cron é o agendador integrado do Gateway para temporização precisa. Ele persiste trabalhos, acorda o agente no momento certo e pode entregar a saída a um canal de chat ou endpoint de webhook. Oferece suporte a lembretes de execução única, expressões recorrentes e acionadores de webhook de entrada.

Veja [Tarefas Agendadas](/pt-BR/automation/cron-jobs).

### Tarefas

O ledger de tarefas em segundo plano rastreia todo trabalho destacado: execuções ACP, criação de subagentes, execuções cron isoladas e operações CLI. Tarefas são registros, não agendadores. Use `openclaw tasks list` e `openclaw tasks audit` para inspecioná-las.

Veja [Tarefas em Segundo Plano](/pt-BR/automation/tasks).

### Compromissos inferidos

Compromissos são memórias de acompanhamento opcionais e de curta duração. O OpenClaw os infere a partir de conversas normais, os escopa para o mesmo agente e canal, e entrega check-ins vencidos por meio do Heartbeat. Lembretes exatos solicitados pelo usuário ainda pertencem ao cron.

Veja [Compromissos Inferidos](/pt-BR/concepts/commitments).

### Task Flow

Task Flow é o substrato de orquestração de fluxos acima das tarefas em segundo plano. Ele gerencia fluxos duráveis de várias etapas com modos de sincronização gerenciados e espelhados, rastreamento de revisão e `openclaw tasks flow list|show|cancel` para inspeção.

Veja [Task Flow](/pt-BR/automation/taskflow).

### Ordens permanentes

Ordens permanentes concedem ao agente autoridade operacional permanente para programas definidos. Elas ficam em arquivos do workspace (normalmente `AGENTS.md`) e são injetadas em toda sessão. Combine com cron para aplicação baseada em tempo.

Veja [Ordens Permanentes](/pt-BR/automation/standing-orders).

### Hooks

Hooks internos são scripts orientados a eventos acionados por eventos de ciclo de vida do agente (`/new`, `/reset`, `/stop`), Compaction da sessão, inicialização do Gateway e fluxo de mensagens. Eles são descobertos automaticamente em diretórios e podem ser gerenciados com `openclaw hooks`. Para interceptação de chamadas de ferramenta em processo, use [hooks de Plugin](/pt-BR/plugins/hooks).

Veja [Hooks](/pt-BR/automation/hooks).

### Heartbeat

Heartbeat é um turno periódico da sessão principal (padrão a cada 30 minutos). Ele agrupa várias verificações (caixa de entrada, calendário, notificações) em um turno do agente com contexto completo da sessão. Turnos de Heartbeat não criam registros de tarefas e não estendem a atualização de redefinição diária/ociosa da sessão. Use `HEARTBEAT.md` para uma pequena lista de verificação, ou um bloco `tasks:` quando quiser verificações periódicas apenas de itens vencidos dentro do próprio Heartbeat. Arquivos de Heartbeat vazios são ignorados como `empty-heartbeat-file`; o modo de tarefa apenas com vencidos é ignorado como `no-tasks-due`. Heartbeats são adiados enquanto trabalho cron está ativo ou enfileirado, e `heartbeat.skipWhenBusy` também pode adiar um agente enquanto o subagente com chave de sessão desse mesmo agente ou lanes aninhadas estão ocupadas.

Veja [Heartbeat](/pt-BR/gateway/heartbeat).

## Como eles funcionam juntos

- **Cron** lida com agendamentos precisos (relatórios diários, revisões semanais) e lembretes de execução única. Todas as execuções cron criam registros de tarefas.
- **Heartbeat** lida com monitoramento rotineiro (caixa de entrada, calendário, notificações) em um turno agrupado a cada 30 minutos.
- **Hooks** reagem a eventos específicos (redefinições de sessão, Compaction, fluxo de mensagens) com scripts personalizados. Hooks de Plugin cobrem chamadas de ferramenta.
- **Ordens permanentes** dão ao agente contexto persistente e limites de autoridade.
- **Task Flow** coordena fluxos de várias etapas acima de tarefas individuais.
- **Tarefas** rastreiam automaticamente todo trabalho destacado para que você possa inspecioná-lo e auditá-lo.

## Relacionados

- [Tarefas Agendadas](/pt-BR/automation/cron-jobs) — agendamento preciso e lembretes de execução única
- [Compromissos Inferidos](/pt-BR/concepts/commitments) — check-ins de acompanhamento semelhantes a memória
- [Tarefas em Segundo Plano](/pt-BR/automation/tasks) — ledger de tarefas para todo trabalho destacado
- [Task Flow](/pt-BR/automation/taskflow) — orquestração durável de fluxos de várias etapas
- [Hooks](/pt-BR/automation/hooks) — scripts de ciclo de vida orientados a eventos
- [hooks de Plugin](/pt-BR/plugins/hooks) — hooks em processo de ferramenta, prompt, mensagem e ciclo de vida
- [Ordens Permanentes](/pt-BR/automation/standing-orders) — instruções persistentes do agente
- [Heartbeat](/pt-BR/gateway/heartbeat) — turnos periódicos da sessão principal
- [Referência de Configuração](/pt-BR/gateway/configuration-reference) — todas as chaves de configuração
