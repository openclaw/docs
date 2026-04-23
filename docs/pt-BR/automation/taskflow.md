---
read_when:
    - Você quer entender como o Fluxo de Tarefas se relaciona com as tarefas em segundo plano
    - Você encontra TaskFlow ou fluxo de tarefas do OpenClaw nas notas de versão ou na documentação
    - Você quer inspecionar ou gerenciar o estado durável do fluxo
summary: camada de orquestração de fluxo do Task Flow acima das tarefas em segundo plano
title: Fluxo de Tarefas
x-i18n:
    generated_at: "2026-04-23T13:57:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: f94a3cda89db5bfcc6c396358bc3fcee40f9313e102dc697d985f40707381468
    source_path: automation/taskflow.md
    workflow: 15
---

# Fluxo de Tarefas

O Fluxo de Tarefas é a camada de orquestração de fluxo que fica acima das [tarefas em segundo plano](/pt-BR/automation/tasks). Ele gerencia fluxos duráveis de várias etapas com seu próprio estado, rastreamento de revisão e semântica de sincronização, enquanto as tarefas individuais continuam sendo a unidade de trabalho desacoplado.

## Quando usar Fluxo de Tarefas

Use o Fluxo de Tarefas quando o trabalho abranger várias etapas sequenciais ou ramificadas e você precisar de rastreamento durável do progresso entre reinicializações do Gateway. Para operações únicas em segundo plano, uma [tarefa](/pt-BR/automation/tasks) simples é suficiente.

| Cenário                               | Uso                  |
| ------------------------------------- | -------------------- |
| Trabalho único em segundo plano       | Tarefa simples       |
| Pipeline de várias etapas (A, depois B, depois C) | Fluxo de Tarefas (gerenciado) |
| Observar tarefas criadas externamente | Fluxo de Tarefas (espelhado) |
| Lembrete único                        | Trabalho Cron        |

## Modos de sincronização

### Modo gerenciado

O Fluxo de Tarefas controla o ciclo de vida de ponta a ponta. Ele cria tarefas como etapas do fluxo, conduz essas tarefas até a conclusão e avança o estado do fluxo automaticamente.

Exemplo: um fluxo de relatório semanal que (1) coleta dados, (2) gera o relatório e (3) o entrega. O Fluxo de Tarefas cria cada etapa como uma tarefa em segundo plano, aguarda a conclusão e então passa para a próxima etapa.

```bash
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Modo espelhado

O Fluxo de Tarefas observa tarefas criadas externamente e mantém o estado do fluxo sincronizado sem assumir o controle da criação das tarefas. Isso é útil quando as tarefas se originam de trabalhos Cron, comandos CLI ou outras fontes, e você quer uma visão unificada do progresso delas como um fluxo.

Exemplo: três trabalhos Cron independentes que, juntos, formam uma rotina de "operações matinais". Um fluxo espelhado acompanha o progresso coletivo deles sem controlar quando ou como são executados.

## Estado durável e rastreamento de revisão

Cada fluxo persiste seu próprio estado e rastreia revisões para que o progresso sobreviva a reinicializações do Gateway. O rastreamento de revisão permite detectar conflitos quando várias fontes tentam avançar o mesmo fluxo simultaneamente.

## Comportamento de cancelamento

`openclaw tasks flow cancel` define uma intenção de cancelamento persistente no fluxo. As tarefas ativas dentro do fluxo são canceladas, e nenhuma nova etapa é iniciada. A intenção de cancelamento persiste entre reinicializações, então um fluxo cancelado permanece cancelado mesmo que o Gateway reinicie antes que todas as tarefas filhas tenham sido encerradas.

## Comandos CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Comando                           | Descrição                                      |
| --------------------------------- | ---------------------------------------------- |
| `openclaw tasks flow list`        | Mostra os fluxos rastreados com status e modo de sincronização |
| `openclaw tasks flow show <id>`   | Inspeciona um fluxo por ID do fluxo ou chave de busca |
| `openclaw tasks flow cancel <id>` | Cancela um fluxo em execução e suas tarefas ativas |

## Como os fluxos se relacionam com as tarefas

Os fluxos coordenam tarefas, não as substituem. Um único fluxo pode conduzir várias tarefas em segundo plano ao longo de sua vida útil. Use `openclaw tasks` para inspecionar registros de tarefas individuais e `openclaw tasks flow` para inspecionar o fluxo de orquestração.

## Relacionado

- [Tarefas em Segundo Plano](/pt-BR/automation/tasks) — o registro de trabalho desacoplado que os fluxos coordenam
- [CLI: tasks](/pt-BR/cli/tasks) — referência de comandos CLI para `openclaw tasks flow`
- [Visão Geral da Automação](/pt-BR/automation) — todos os mecanismos de automação em um relance
- [Trabalhos Cron](/pt-BR/automation/cron-jobs) — trabalhos agendados que podem alimentar fluxos
