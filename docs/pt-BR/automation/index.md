---
doc-schema-version: 1
read_when:
    - Decidindo como automatizar o trabalho com o OpenClaw
    - Escolhendo entre Heartbeat, Cron, compromissos, hooks e ordens permanentes
    - Buscando o ponto de entrada de automação adequado
summary: 'Visão geral dos mecanismos de automação: tarefas, Cron, hooks, ordens permanentes e TaskFlow'
title: Automação
x-i18n:
    generated_at: "2026-07-11T23:43:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 210f2a33012e854e48aa145c665e16e7ffe861c91a2566507e81d809bb2b955c
    source_path: automation/index.md
    workflow: 16
---

O OpenClaw executa trabalhos em segundo plano por meio de tarefas, trabalhos agendados, compromissos inferidos, hooks de eventos e instruções permanentes. Use esta página para escolher o mecanismo adequado.

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

| Caso de uso                                             | Recomendação                | Motivo                                                    |
| ------------------------------------------------------- | --------------------------- | --------------------------------------------------------- |
| Enviar um relatório diário pontualmente às 9h           | Tarefas Agendadas (Cron)    | Horário exato, execução isolada                            |
| Lembrar-me daqui a 20 minutos                           | Tarefas Agendadas (Cron)    | Execução única com horário preciso (`--at`)                |
| Executar uma análise aprofundada semanal                | Tarefas Agendadas (Cron)    | Tarefa independente, pode usar um modelo diferente         |
| Verificar a caixa de entrada a cada 30 min              | Heartbeat                   | Agrupa com outras verificações e considera o contexto      |
| Monitorar o calendário em busca de eventos futuros      | Heartbeat                   | Adequado à percepção periódica                             |
| Fazer acompanhamento após uma entrevista mencionada     | Compromissos Inferidos      | Acompanhamento semelhante à memória, sem lembrete exato    |
| Fazer um contato atencioso após o contexto do usuário   | Compromissos Inferidos      | Limitado ao mesmo agente e canal                           |
| Inspecionar o status de um subagente ou execução de ACP | Tarefas em Segundo Plano    | O registro de tarefas acompanha todo trabalho desvinculado |
| Auditar o que foi executado e quando                    | Tarefas em Segundo Plano    | `openclaw tasks list` e `openclaw tasks audit`             |
| Fazer pesquisa em várias etapas e depois resumir        | Fluxo de Tarefas            | Orquestração durável com acompanhamento de revisões        |
| Executar um script ao redefinir a sessão                | Hooks                       | Orientado a eventos, disparado por eventos do ciclo de vida |
| Executar código em cada chamada de ferramenta           | Hooks de Plugin             | Hooks no processo podem interceptar chamadas de ferramentas |
| Sempre verificar a conformidade antes de responder      | Ordens Permanentes          | Injetadas automaticamente em todas as sessões              |

### Tarefas Agendadas (Cron) versus Heartbeat

| Dimensão           | Tarefas Agendadas (Cron)               | Heartbeat                                      |
| ------------------ | -------------------------------------- | ---------------------------------------------- |
| Horário            | Exato (expressões cron, execução única) | Aproximado (padrão: a cada 30 min)             |
| Contexto da sessão | Novo (isolado) ou compartilhado         | Contexto completo da sessão principal          |
| Registros de tarefa | Sempre criados                         | Nunca criados                                  |
| Entrega            | Canal, webhook ou silenciosa            | Integrada à sessão principal                   |
| Mais adequado para | Relatórios, lembretes, trabalhos em segundo plano | Verificações da caixa de entrada, calendário e notificações |

Use Tarefas Agendadas (Cron) quando precisar de horários precisos ou execução isolada. Use Heartbeat quando o trabalho se beneficiar do contexto completo da sessão e um horário aproximado for suficiente.

## Conceitos principais

### Tarefas agendadas (cron)

Cron é o agendador integrado do Gateway para horários precisos. Ele mantém os trabalhos, ativa o agente no momento certo e pode entregar a saída a um canal de conversa ou endpoint de webhook. Oferece suporte a lembretes de execução única, expressões recorrentes e acionadores de webhook de entrada.

Consulte [Tarefas Agendadas](/pt-BR/automation/cron-jobs).

### Tarefas

O registro de tarefas em segundo plano acompanha todo trabalho desvinculado: execuções de ACP, inicializações de subagentes, execuções cron isoladas e operações da CLI. Tarefas são registros, não agendadores. Use `openclaw tasks list` e `openclaw tasks audit` para inspecioná-las.

Consulte [Tarefas em Segundo Plano](/pt-BR/automation/tasks).

### Compromissos inferidos

Compromissos são memórias de acompanhamento opcionais e de curta duração. O OpenClaw os infere de conversas normais, limita-os ao mesmo agente e canal e entrega os contatos de acompanhamento no momento devido por meio do Heartbeat. Lembretes exatos solicitados pelo usuário ainda pertencem ao cron.

Consulte [Compromissos Inferidos](/pt-BR/concepts/commitments).

### Fluxo de Tarefas

O Fluxo de Tarefas é a camada de orquestração de fluxos acima das tarefas em segundo plano. Ele gerencia fluxos duráveis de várias etapas com modos de sincronização gerenciada e espelhada, acompanhamento de revisões e `openclaw tasks flow list|show|cancel` para inspeção.

Consulte [Fluxo de Tarefas](/pt-BR/automation/taskflow).

### Ordens permanentes

As ordens permanentes concedem ao agente autoridade operacional permanente para programas definidos. Elas ficam em arquivos do espaço de trabalho (normalmente `AGENTS.md`) e são injetadas em todas as sessões. Combine-as com cron para aplicação baseada em tempo.

Consulte [Ordens Permanentes](/pt-BR/automation/standing-orders).

### Hooks

Hooks internos são scripts orientados a eventos acionados por eventos do ciclo de vida do agente (`/new`, `/reset`, `/stop`), Compaction da sessão, inicialização do Gateway e fluxo de mensagens. Eles são descobertos nos diretórios de hooks e gerenciados com `openclaw hooks`. Para interceptar chamadas de ferramentas no processo, use [hooks de Plugin](/pt-BR/plugins/hooks).

Consulte [Hooks](/pt-BR/automation/hooks).

### Heartbeat

Heartbeat é um turno periódico da sessão principal (por padrão, a cada 30 minutos). Ele agrupa várias verificações (caixa de entrada, calendário e notificações) em um único turno do agente com o contexto completo da sessão. Os turnos de Heartbeat não criam registros de tarefas nem prolongam a validade da redefinição diária ou por inatividade da sessão. Use `HEARTBEAT.md` para uma pequena lista de verificação ou um bloco `tasks:` quando quiser verificações periódicas somente de itens vencidos dentro do próprio Heartbeat. Arquivos de Heartbeat vazios são ignorados como `empty-heartbeat-file`; o modo de tarefas somente no vencimento é ignorado como `no-tasks-due`. Os Heartbeats são adiados enquanto houver trabalhos cron ativos ou na fila, e `heartbeat.skipWhenBusy` também pode adiar um agente enquanto as faixas de subagente vinculadas à chave de sessão desse mesmo agente ou as faixas aninhadas estiverem ocupadas.

Consulte [Heartbeat](/pt-BR/gateway/heartbeat).

## Como eles funcionam em conjunto

- **Cron** gerencia programações precisas (relatórios diários, revisões semanais) e lembretes de execução única. Todas as execuções cron criam registros de tarefas.
- **Heartbeat** gerencia o monitoramento de rotina (caixa de entrada, calendário e notificações) em um único turno agrupado a cada 30 minutos.
- **Hooks** reagem a eventos específicos (redefinições de sessão, Compaction e fluxo de mensagens) com scripts personalizados. Hooks de Plugin abrangem chamadas de ferramentas.
- **Ordens permanentes** fornecem ao agente contexto persistente e limites de autoridade.
- **Fluxo de Tarefas** coordena fluxos de várias etapas acima das tarefas individuais.
- **Tarefas** acompanham automaticamente todo trabalho desvinculado para que você possa inspecioná-lo e auditá-lo.

## Relacionados

- [Tarefas Agendadas](/pt-BR/automation/cron-jobs) — agendamento preciso e lembretes de execução única
- [Compromissos Inferidos](/pt-BR/concepts/commitments) — contatos de acompanhamento semelhantes à memória
- [Tarefas em Segundo Plano](/pt-BR/automation/tasks) — registro de tarefas para todo trabalho desvinculado
- [Fluxo de Tarefas](/pt-BR/automation/taskflow) — orquestração durável de fluxos de várias etapas
- [Hooks](/pt-BR/automation/hooks) — scripts de ciclo de vida orientados a eventos
- [Hooks de Plugin](/pt-BR/plugins/hooks) — hooks no processo para ferramentas, prompts, mensagens e ciclo de vida
- [Ordens Permanentes](/pt-BR/automation/standing-orders) — instruções persistentes do agente
- [Heartbeat](/pt-BR/gateway/heartbeat) — turnos periódicos da sessão principal
- [Referência de Configuração](/pt-BR/gateway/configuration-reference) — todas as chaves de configuração
