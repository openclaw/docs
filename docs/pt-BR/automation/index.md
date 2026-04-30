---
read_when:
    - Decidir como automatizar o trabalho com o OpenClaw
    - Escolhendo entre Heartbeat, Cron, compromissos, ganchos e ordens permanentes
    - Procurando o ponto de entrada de automação certo
summary: 'Visão geral dos mecanismos de automação: tarefas, Cron, hooks, ordens permanentes e Fluxo de Tarefas'
title: Automação e tarefas
x-i18n:
    generated_at: "2026-04-30T09:34:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2465c39f21db8bcb98f980a2c4b2c03018dddd5f43de59d8bf6ce0d6e97d9ef
    source_path: automation/index.md
    workflow: 16
---

OpenClaw executa trabalho em segundo plano por meio de tarefas, trabalhos agendados, compromissos inferidos, ganchos de eventos e instruções permanentes. Esta página ajuda você a escolher o mecanismo certo e entender como eles se encaixam.

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

| Caso de uso                                         | Recomendado                 | Por quê                                             |
| --------------------------------------------------- | --------------------------- | --------------------------------------------------- |
| Enviar relatório diário exatamente às 9h            | Tarefas agendadas (Cron)    | Horário exato, execução isolada                     |
| Lembre-me em 20 minutos                             | Tarefas agendadas (Cron)    | Execução única com horário preciso (`--at`)         |
| Executar análise profunda semanal                   | Tarefas agendadas (Cron)    | Tarefa independente, pode usar outro modelo         |
| Verificar a caixa de entrada a cada 30 min          | Heartbeat                   | Agrupa com outras verificações, ciente do contexto  |
| Monitorar calendário para próximos eventos          | Heartbeat                   | Encaixe natural para percepção periódica            |
| Fazer acompanhamento após uma entrevista mencionada | Compromissos inferidos      | Acompanhamento semelhante à memória, sem pedido de lembrete exato |
| Check-in cuidadoso após contexto do usuário         | Compromissos inferidos      | Escopado ao mesmo agente e canal                    |
| Inspecionar status de um subagente ou execução ACP  | Tarefas em segundo plano    | O livro-razão de tarefas rastreia todo trabalho desacoplado |
| Auditar o que executou e quando                     | Tarefas em segundo plano    | `openclaw tasks list` e `openclaw tasks audit`      |
| Pesquisa em várias etapas e depois resumo           | Fluxo de tarefas            | Orquestração durável com rastreamento de revisões   |
| Executar um script na redefinição da sessão         | Ganchos                     | Orientado por eventos, dispara em eventos do ciclo de vida |
| Executar código em toda chamada de ferramenta       | Ganchos de Plugin           | Ganchos em processo podem interceptar chamadas de ferramentas |
| Sempre verificar conformidade antes de responder    | Ordens permanentes          | Injetadas automaticamente em toda sessão            |

### Tarefas agendadas (Cron) vs Heartbeat

| Dimensão          | Tarefas agendadas (Cron)              | Heartbeat                              |
| ----------------- | ------------------------------------- | -------------------------------------- |
| Tempo             | Exato (expressões cron, execução única) | Aproximado (padrão a cada 30 min)     |
| Contexto da sessão | Novo (isolado) ou compartilhado       | Contexto completo da sessão principal  |
| Registros de tarefas | Sempre criados                     | Nunca criados                          |
| Entrega           | Canal, webhook ou silenciosa          | Inline na sessão principal             |
| Melhor para       | Relatórios, lembretes, trabalhos em segundo plano | Verificações de caixa de entrada, calendário, notificações |

Use Tarefas agendadas (Cron) quando precisar de tempo preciso ou execução isolada. Use Heartbeat quando o trabalho se beneficiar do contexto completo da sessão e tempo aproximado for suficiente.

## Conceitos principais

### Tarefas agendadas (cron)

Cron é o agendador integrado do Gateway para tempo preciso. Ele persiste trabalhos, desperta o agente no momento certo e pode entregar a saída a um canal de chat ou endpoint de webhook. Oferece suporte a lembretes únicos, expressões recorrentes e gatilhos de webhook recebidos.

Consulte [Tarefas agendadas](/pt-BR/automation/cron-jobs).

### Tarefas

O livro-razão de tarefas em segundo plano rastreia todo trabalho desacoplado: execuções ACP, criação de subagentes, execuções cron isoladas e operações da CLI. Tarefas são registros, não agendadores. Use `openclaw tasks list` e `openclaw tasks audit` para inspecioná-las.

Consulte [Tarefas em segundo plano](/pt-BR/automation/tasks).

### Compromissos inferidos

Compromissos são memórias de acompanhamento opcionais e de curta duração. O OpenClaw os infere de conversas normais, escopa-os ao mesmo agente e canal e entrega check-ins vencidos por meio do heartbeat. Lembretes exatos solicitados pelo usuário ainda pertencem ao cron.

Consulte [Compromissos inferidos](/pt-BR/concepts/commitments).

### Fluxo de tarefas

Fluxo de tarefas é o substrato de orquestração de fluxos acima das tarefas em segundo plano. Ele gerencia fluxos duráveis de várias etapas com modos de sincronização gerenciados e espelhados, rastreamento de revisões e `openclaw tasks flow list|show|cancel` para inspeção.

Consulte [Fluxo de tarefas](/pt-BR/automation/taskflow).

### Ordens permanentes

Ordens permanentes concedem ao agente autoridade operacional permanente para programas definidos. Elas ficam em arquivos do workspace (normalmente `AGENTS.md`) e são injetadas em toda sessão. Combine com cron para aplicação baseada em tempo.

Consulte [Ordens permanentes](/pt-BR/automation/standing-orders).

### Ganchos

Ganchos internos são scripts orientados por eventos acionados por eventos do ciclo de vida do agente (`/new`, `/reset`, `/stop`), compactação de sessão, inicialização do gateway e fluxo de mensagens. Eles são descobertos automaticamente a partir de diretórios e podem ser gerenciados com `openclaw hooks`. Para interceptação em processo de chamadas de ferramenta, use [Ganchos de Plugin](/pt-BR/plugins/hooks).

Consulte [Ganchos](/pt-BR/automation/hooks).

### Heartbeat

Heartbeat é uma rodada periódica da sessão principal (padrão a cada 30 minutos). Ele agrupa várias verificações (caixa de entrada, calendário, notificações) em uma rodada do agente com contexto completo da sessão. Rodadas de Heartbeat não criam registros de tarefas e não estendem a atualização de redefinição diária/ociosa da sessão. Use `HEARTBEAT.md` para uma pequena checklist, ou um bloco `tasks:` quando quiser verificações periódicas apenas vencidas dentro do próprio heartbeat. Arquivos de heartbeat vazios são ignorados como `empty-heartbeat-file`; o modo de tarefa apenas vencida é ignorado como `no-tasks-due`. Heartbeats são adiados enquanto trabalho cron está ativo ou enfileirado, e `heartbeat.skipWhenBusy` também pode adiá-los enquanto subagentes ou lanes aninhadas estão ocupadas.

Consulte [Heartbeat](/pt-BR/gateway/heartbeat).

## Como funcionam juntos

- **Cron** lida com agendamentos precisos (relatórios diários, revisões semanais) e lembretes únicos. Todas as execuções cron criam registros de tarefas.
- **Heartbeat** lida com monitoramento rotineiro (caixa de entrada, calendário, notificações) em uma rodada agrupada a cada 30 minutos.
- **Ganchos** reagem a eventos específicos (redefinições de sessão, compactação, fluxo de mensagens) com scripts personalizados. Ganchos de Plugin cobrem chamadas de ferramentas.
- **Ordens permanentes** dão ao agente contexto persistente e limites de autoridade.
- **Fluxo de tarefas** coordena fluxos de várias etapas acima de tarefas individuais.
- **Tarefas** rastreiam automaticamente todo trabalho desacoplado para que você possa inspecioná-lo e auditá-lo.

## Relacionados

- [Tarefas agendadas](/pt-BR/automation/cron-jobs) — agendamento preciso e lembretes únicos
- [Compromissos inferidos](/pt-BR/concepts/commitments) — check-ins de acompanhamento semelhantes à memória
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — livro-razão de tarefas para todo trabalho desacoplado
- [Fluxo de tarefas](/pt-BR/automation/taskflow) — orquestração durável de fluxos de várias etapas
- [Ganchos](/pt-BR/automation/hooks) — scripts de ciclo de vida orientados por eventos
- [Ganchos de Plugin](/pt-BR/plugins/hooks) — ganchos em processo de ferramenta, prompt, mensagem e ciclo de vida
- [Ordens permanentes](/pt-BR/automation/standing-orders) — instruções persistentes do agente
- [Heartbeat](/pt-BR/gateway/heartbeat) — rodadas periódicas da sessão principal
- [Referência de configuração](/pt-BR/gateway/configuration-reference) — todas as chaves de configuração
