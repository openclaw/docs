---
read_when:
    - Você quer entender como o TaskFlow se relaciona com as tarefas em segundo plano
    - Você encontra o TaskFlow ou o fluxo de tarefas do openclaw nas notas de versão ou na documentação
    - Você quer inspecionar ou gerenciar o estado durável do fluxo
summary: Camada de orquestração de fluxo do Task Flow acima das tarefas em segundo plano
title: Fluxo de tarefas
x-i18n:
    generated_at: "2026-04-24T05:40:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90286fb783db5417ab5e781377a85be76cd3f9e9b32da57558c2d8f02b813dba
    source_path: automation/taskflow.md
    workflow: 15
---

TaskFlow é a base de orquestração de fluxos que fica acima das [tarefas em segundo plano](/pt-BR/automation/tasks). Ele gerencia fluxos duráveis de várias etapas com seu próprio estado, rastreamento de revisões e semântica de sincronização, enquanto tarefas individuais continuam sendo a unidade de trabalho desacoplado.

## Quando usar o TaskFlow

Use o TaskFlow quando o trabalho abranger várias etapas sequenciais ou ramificadas e você precisar de rastreamento durável do progresso entre reinicializações do Gateway. Para operações únicas em segundo plano, uma [tarefa](/pt-BR/automation/tasks) simples é suficiente.

| Cenário                               | Uso                   |
| ------------------------------------- | --------------------- |
| Trabalho único em segundo plano       | Tarefa simples        |
| Pipeline de várias etapas (A, depois B, depois C) | TaskFlow (gerenciado) |
| Observar tarefas criadas externamente | TaskFlow (espelhado)  |
| Lembrete único                        | Trabalho Cron         |

## Modos de sincronização

### Modo gerenciado

O TaskFlow controla o ciclo de vida de ponta a ponta. Ele cria tarefas como etapas do fluxo, conduz essas tarefas até a conclusão e avança o estado do fluxo automaticamente.

Exemplo: um fluxo de relatório semanal que (1) coleta dados, (2) gera o relatório e (3) o entrega. O TaskFlow cria cada etapa como uma tarefa em segundo plano, aguarda a conclusão e então passa para a próxima etapa.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Modo espelhado

O TaskFlow observa tarefas criadas externamente e mantém o estado do fluxo sincronizado sem assumir a responsabilidade pela criação das tarefas. Isso é útil quando as tarefas se originam de trabalhos Cron, comandos de CLI ou outras fontes, e você quer uma visão unificada do progresso delas como um fluxo.

Exemplo: três trabalhos Cron independentes que, juntos, formam uma rotina de "operações da manhã". Um fluxo espelhado acompanha o progresso coletivo deles sem controlar quando ou como são executados.

## Estado durável e rastreamento de revisões

Cada fluxo persiste seu próprio estado e rastreia revisões para que o progresso sobreviva a reinicializações do Gateway. O rastreamento de revisões permite detectar conflitos quando várias fontes tentam avançar o mesmo fluxo ao mesmo tempo.

## Comportamento de cancelamento

`openclaw tasks flow cancel` define uma intenção persistente de cancelamento no fluxo. As tarefas ativas dentro do fluxo são canceladas, e nenhuma nova etapa é iniciada. A intenção de cancelamento persiste entre reinicializações, portanto um fluxo cancelado permanece cancelado mesmo que o Gateway reinicie antes que todas as tarefas filhas sejam encerradas.

## Comandos de CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Comando                           | Descrição                                        |
| --------------------------------- | ------------------------------------------------ |
| `openclaw tasks flow list`        | Mostra os fluxos rastreados com status e modo de sincronização |
| `openclaw tasks flow show <id>`   | Inspeciona um fluxo por ID do fluxo ou chave de busca |
| `openclaw tasks flow cancel <id>` | Cancela um fluxo em execução e suas tarefas ativas |

## Como os fluxos se relacionam com tarefas

Os fluxos coordenam tarefas, não as substituem. Um único fluxo pode conduzir várias tarefas em segundo plano ao longo de seu ciclo de vida. Use `openclaw tasks` para inspecionar registros de tarefas individuais e `openclaw tasks flow` para inspecionar o fluxo de orquestração.

## Relacionado

- [Background Tasks](/pt-BR/automation/tasks) — o registro de trabalho desacoplado que os fluxos coordenam
- [CLI: tasks](/pt-BR/cli/tasks) — referência de comandos de CLI para `openclaw tasks flow`
- [Visão geral de automação](/pt-BR/automation) — todos os mecanismos de automação em um relance
- [Trabalhos Cron](/pt-BR/automation/cron-jobs) — trabalhos agendados que podem alimentar fluxos
