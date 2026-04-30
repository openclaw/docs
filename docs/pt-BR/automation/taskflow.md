---
read_when:
    - Você quer entender como o Fluxo de Tarefas se relaciona com tarefas em segundo plano
    - Você encontra TaskFlow ou fluxo de tarefas do openclaw em notas de versão ou documentação
    - Você quer inspecionar ou gerenciar o estado persistente do fluxo
summary: Camada de orquestração de fluxos de tarefas acima das tarefas em segundo plano
title: Fluxo de tarefas
x-i18n:
    generated_at: "2026-04-30T09:35:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ab261dea0ec3beb10b53c641bd188288cada5345aef6ddbbc8071d37eb57bdc
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow é o substrato de orquestração de fluxos que fica acima de [tarefas em segundo plano](/pt-BR/automation/tasks). Ele gerencia fluxos duráveis de várias etapas com seu próprio estado, rastreamento de revisões e semântica de sincronização, enquanto tarefas individuais continuam sendo a unidade de trabalho desacoplado.

## Quando usar o Task Flow

Use Task Flow quando o trabalho abranger várias etapas sequenciais ou ramificadas e você precisar de rastreamento durável de progresso entre reinicializações do Gateway. Para operações únicas em segundo plano, uma [tarefa](/pt-BR/automation/tasks) simples é suficiente.

| Cenário                              | Uso                  |
| ------------------------------------ | -------------------- |
| Trabalho único em segundo plano      | Tarefa simples       |
| Pipeline de várias etapas (A depois B depois C) | Task Flow (gerenciado) |
| Observar tarefas criadas externamente | Task Flow (espelhado) |
| Lembrete único                       | Trabalho Cron        |

## Padrão de fluxo de trabalho agendado confiável

Para fluxos de trabalho recorrentes, como briefings de inteligência de mercado, trate o agendamento, a orquestração e as verificações de confiabilidade como camadas separadas:

1. Use [Tarefas agendadas](/pt-BR/automation/cron-jobs) para o tempo.
2. Use uma sessão cron persistente quando o fluxo de trabalho deve se basear no contexto anterior.
3. Use [Lobster](/pt-BR/tools/lobster) para etapas determinísticas, gates de aprovação e tokens de retomada.
4. Use Task Flow para rastrear a execução de várias etapas entre tarefas filhas, esperas, novas tentativas e reinicializações do Gateway.

Formato de cron de exemplo:

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

Use `session:<id>` em vez de `isolated` quando o fluxo de trabalho recorrente precisar de histórico deliberado, resumos de execuções anteriores ou contexto permanente. Use `isolated` quando cada execução deve começar do zero e todo o estado necessário estiver explícito no fluxo de trabalho.

Dentro do fluxo de trabalho, coloque verificações de confiabilidade antes da etapa de resumo do LLM:

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

Verificações de preflight recomendadas:

- Disponibilidade do navegador e escolha de perfil, por exemplo `openclaw` para estado gerenciado ou `user` quando uma sessão conectada do Chrome for necessária. Consulte [Navegador](/pt-BR/tools/browser).
- Credenciais de API e cota para cada fonte.
- Acessibilidade de rede para endpoints necessários.
- Ferramentas necessárias habilitadas para o agente, como `lobster`, `browser` e `llm-task`.
- Destino de falha configurado para cron, para que falhas de preflight fiquem visíveis. Consulte [Tarefas agendadas](/pt-BR/automation/cron-jobs#delivery-and-output).

Campos de proveniência de dados recomendados para cada item coletado:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Faça o fluxo de trabalho rejeitar ou marcar itens obsoletos antes da sumarização. A etapa de LLM deve receber apenas JSON estruturado e deve ser instruída a preservar `sourceUrl`, `retrievedAt` e `asOf` em sua saída. Use [Tarefa LLM](/pt-BR/tools/llm-task) quando precisar de uma etapa de modelo validada por esquema dentro do fluxo de trabalho.

Para fluxos de trabalho reutilizáveis de equipe ou comunidade, empacote a CLI, os arquivos `.lobster` e quaisquer notas de configuração como uma skill ou plugin e publique pelo [ClawHub](/pt-BR/tools/clawhub). Mantenha as proteções específicas do fluxo de trabalho nesse pacote, a menos que a API do plugin esteja sem uma capacidade genérica necessária.

## Modos de sincronização

### Modo gerenciado

Task Flow é dono do ciclo de vida de ponta a ponta. Ele cria tarefas como etapas do fluxo, conduz essas tarefas até a conclusão e avança o estado do fluxo automaticamente.

Exemplo: um fluxo de relatório semanal que (1) coleta dados, (2) gera o relatório e (3) o entrega. O Task Flow cria cada etapa como uma tarefa em segundo plano, aguarda a conclusão e então passa para a próxima etapa.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Modo espelhado

Task Flow observa tarefas criadas externamente e mantém o estado do fluxo sincronizado sem assumir a propriedade da criação de tarefas. Isso é útil quando as tarefas se originam de trabalhos cron, comandos da CLI ou outras fontes, e você quer uma visão unificada do progresso delas como um fluxo.

Exemplo: três trabalhos cron independentes que, juntos, formam uma rotina de "operações matinais". Um fluxo espelhado rastreia o progresso coletivo deles sem controlar quando ou como eles são executados.

## Estado durável e rastreamento de revisões

Cada fluxo persiste seu próprio estado e rastreia revisões para que o progresso sobreviva a reinicializações do Gateway. O rastreamento de revisões permite a detecção de conflitos quando várias fontes tentam avançar o mesmo fluxo simultaneamente.
O registro de fluxos usa SQLite com manutenção limitada de write-ahead log, incluindo
checkpoints periódicos e no desligamento, para que Gateways de longa duração não mantenham
arquivos auxiliares `registry.sqlite-wal` ilimitados.

## Comportamento de cancelamento

`openclaw tasks flow cancel` define uma intenção de cancelamento persistente no fluxo. Tarefas ativas dentro do fluxo são canceladas, e nenhuma nova etapa é iniciada. A intenção de cancelamento persiste entre reinicializações, então um fluxo cancelado permanece cancelado mesmo que o Gateway reinicie antes que todas as tarefas filhas tenham terminado.

## Comandos da CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Comando                           | Descrição                                   |
| --------------------------------- | ------------------------------------------- |
| `openclaw tasks flow list`        | Mostra fluxos rastreados com status e modo de sincronização |
| `openclaw tasks flow show <id>`   | Inspeciona um fluxo por ID de fluxo ou chave de consulta |
| `openclaw tasks flow cancel <id>` | Cancela um fluxo em execução e suas tarefas ativas |

## Como os fluxos se relacionam às tarefas

Fluxos coordenam tarefas, não as substituem. Um único fluxo pode conduzir várias tarefas em segundo plano ao longo de seu ciclo de vida. Use `openclaw tasks` para inspecionar registros de tarefas individuais e `openclaw tasks flow` para inspecionar o fluxo orquestrador.

## Relacionados

- [Tarefas em segundo plano](/pt-BR/automation/tasks) — o livro-razão de trabalho desacoplado que os fluxos coordenam
- [CLI: tarefas](/pt-BR/cli/tasks) — referência de comandos da CLI para `openclaw tasks flow`
- [Visão geral de automação](/pt-BR/automation) — todos os mecanismos de automação em um relance
- [Trabalhos Cron](/pt-BR/automation/cron-jobs) — trabalhos agendados que podem alimentar fluxos
