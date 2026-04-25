---
read_when:
    - Você quer entender como o TaskFlow se relaciona com tarefas em segundo plano
    - Você encontra o fluxo de tarefas ou o fluxo de tarefas do OpenClaw em notas de versão ou na documentação
    - Você quer inspecionar ou gerenciar o estado durável do fluxo
summary: camada de orquestração de fluxo do Task Flow acima das tarefas em segundo plano
title: fluxo de tarefas
x-i18n:
    generated_at: "2026-04-25T13:41:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: de94ed672e492c7dac066e1a63f5600abecfea63828a92acca1b8caa041c5212
    source_path: automation/taskflow.md
    workflow: 15
---

TaskFlow é o substrato de orquestração de fluxos que fica acima das [tarefas em segundo plano](/pt-BR/automation/tasks). Ele gerencia fluxos duráveis de várias etapas com seu próprio estado, rastreamento de revisões e semântica de sincronização, enquanto as tarefas individuais continuam sendo a unidade de trabalho desacoplado.

## Quando usar o TaskFlow

Use o TaskFlow quando o trabalho abranger várias etapas sequenciais ou ramificadas e você precisar de rastreamento durável de progresso entre reinicializações do Gateway. Para operações únicas em segundo plano, uma [tarefa](/pt-BR/automation/tasks) simples é suficiente.

| Cenário                              | Uso                    |
| ------------------------------------ | ---------------------- |
| Trabalho único em segundo plano      | Tarefa simples         |
| Pipeline de várias etapas (A, depois B, depois C) | TaskFlow (gerenciado)  |
| Observar tarefas criadas externamente | TaskFlow (espelhado) |
| Lembrete pontual                     | Trabalho Cron          |

## Padrão de fluxo de trabalho agendado confiável

Para fluxos de trabalho recorrentes, como briefings de inteligência de mercado, trate o agendamento, a orquestração e as verificações de confiabilidade como camadas separadas:

1. Use [Scheduled Tasks](/pt-BR/automation/cron-jobs) para a temporização.
2. Use uma sessão Cron persistente quando o fluxo de trabalho precisar se basear em contexto anterior.
3. Use [Lobster](/pt-BR/tools/lobster) para etapas determinísticas, portas de aprovação e tokens de retomada.
4. Use o TaskFlow para rastrear a execução de várias etapas entre tarefas filhas, esperas, tentativas novamente e reinicializações do Gateway.

Exemplo de formato de Cron:

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Use `session:<id>` em vez de `isolated` quando o fluxo de trabalho recorrente precisar de histórico deliberado, resumos de execuções anteriores ou contexto permanente. Use `isolated` quando cada execução precisar começar do zero e todo o estado necessário estiver explícito no fluxo de trabalho.

Dentro do fluxo de trabalho, coloque verificações de confiabilidade antes da etapa de resumo com LLM:

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

Verificações de pré-voo recomendadas:

- Disponibilidade do navegador e escolha de perfil, por exemplo `openclaw` para estado gerenciado ou `user` quando uma sessão autenticada do Chrome for necessária. Consulte [Browser](/pt-BR/tools/browser).
- Credenciais de API e cota para cada fonte.
- Alcance de rede para os endpoints necessários.
- Ferramentas necessárias ativadas para o agente, como `lobster`, `browser` e `llm-task`.
- Destino de falha configurado para Cron, para que falhas de pré-voo fiquem visíveis. Consulte [Scheduled Tasks](/pt-BR/automation/cron-jobs#delivery-and-output).

Campos recomendados de procedência dos dados para cada item coletado:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Faça o fluxo de trabalho rejeitar ou marcar itens desatualizados antes da sumarização. A etapa de LLM deve receber apenas JSON estruturado e deve ser instruída a preservar `sourceUrl`, `retrievedAt` e `asOf` em sua saída. Use [LLM Task](/pt-BR/tools/llm-task) quando precisar de uma etapa de modelo validada por esquema dentro do fluxo de trabalho.

Para fluxos de trabalho reutilizáveis de equipe ou comunidade, empacote a CLI, os arquivos `.lobster` e quaisquer notas de configuração como uma skill ou Plugin e publique por meio do [ClawHub](/pt-BR/tools/clawhub). Mantenha proteções específicas do fluxo de trabalho nesse pacote, a menos que a API do Plugin não tenha um recurso genérico necessário.

## Modos de sincronização

### Modo gerenciado

O TaskFlow controla o ciclo de vida de ponta a ponta. Ele cria tarefas como etapas do fluxo, as conduz até a conclusão e avança o estado do fluxo automaticamente.

Exemplo: um fluxo de relatório semanal que (1) coleta dados, (2) gera o relatório e (3) o entrega. O TaskFlow cria cada etapa como uma tarefa em segundo plano, aguarda a conclusão e depois passa para a próxima etapa.

```
Fluxo: weekly-report
  Etapa 1: gather-data     → tarefa criada → concluída com sucesso
  Etapa 2: generate-report → tarefa criada → concluída com sucesso
  Etapa 3: deliver         → tarefa criada → em execução
```

### Modo espelhado

O TaskFlow observa tarefas criadas externamente e mantém o estado do fluxo sincronizado sem assumir o controle da criação de tarefas. Isso é útil quando as tarefas se originam de trabalhos Cron, comandos da CLI ou outras fontes, e você quer uma visão unificada do progresso delas como um fluxo.

Exemplo: três trabalhos Cron independentes que juntos formam uma rotina de "operações matinais". Um fluxo espelhado rastreia o progresso coletivo deles sem controlar quando ou como são executados.

## Estado durável e rastreamento de revisões

Cada fluxo persiste seu próprio estado e rastreia revisões para que o progresso sobreviva a reinicializações do Gateway. O rastreamento de revisões permite detectar conflitos quando várias fontes tentam avançar o mesmo fluxo simultaneamente.

## Comportamento de cancelamento

`openclaw tasks flow cancel` define uma intenção de cancelamento persistente no fluxo. As tarefas ativas dentro do fluxo são canceladas, e nenhuma nova etapa é iniciada. A intenção de cancelamento persiste entre reinicializações, portanto um fluxo cancelado permanece cancelado mesmo que o Gateway reinicie antes que todas as tarefas filhas sejam encerradas.

## Comandos da CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Comando                           | Descrição                                          |
| --------------------------------- | -------------------------------------------------- |
| `openclaw tasks flow list`        | Mostra os fluxos rastreados com status e modo de sincronização |
| `openclaw tasks flow show <id>`   | Inspeciona um fluxo por ID do fluxo ou chave de busca |
| `openclaw tasks flow cancel <id>` | Cancela um fluxo em execução e suas tarefas ativas |

## Como os fluxos se relacionam com as tarefas

Os fluxos coordenam tarefas, não as substituem. Um único fluxo pode conduzir várias tarefas em segundo plano ao longo de seu ciclo de vida. Use `openclaw tasks` para inspecionar registros de tarefas individuais e `openclaw tasks flow` para inspecionar o fluxo de orquestração.

## Relacionado

- [Background Tasks](/pt-BR/automation/tasks) — o registro de trabalho desacoplado que os fluxos coordenam
- [CLI: tasks](/pt-BR/cli/tasks) — referência de comandos da CLI para `openclaw tasks flow`
- [Automation Overview](/pt-BR/automation) — todos os mecanismos de automação em um relance
- [Cron Jobs](/pt-BR/automation/cron-jobs) — trabalhos agendados que podem alimentar fluxos
