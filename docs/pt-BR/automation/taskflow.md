---
read_when:
    - Você quer entender como o TaskFlow se relaciona com tarefas em segundo plano
    - Você encontra Task Flow ou fluxo de tarefas do openclaw em notas de versão ou documentação
    - Você deseja inspecionar ou gerenciar o estado durável do fluxo
summary: Camada de orquestração de fluxo do TaskFlow acima de tarefas em segundo plano
title: Fluxo de tarefas
x-i18n:
    generated_at: "2026-05-10T19:21:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 135227b250840cd579f10a8ab4211e9319c447bb4d6df25907738ea138fc2d2a
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow é o substrato de orquestração de fluxos que fica acima das [tarefas em segundo plano](/pt-BR/automation/tasks). Ele gerencia fluxos duráveis de várias etapas com seu próprio estado, rastreamento de revisões e semântica de sincronização, enquanto tarefas individuais continuam sendo a unidade de trabalho desacoplado.

## Quando usar Task Flow

Use Task Flow quando o trabalho abrange várias etapas sequenciais ou ramificadas e você precisa de rastreamento durável do progresso entre reinicializações do gateway. Para operações únicas em segundo plano, uma [tarefa](/pt-BR/automation/tasks) simples é suficiente.

| Cenário                              | Use                  |
| ------------------------------------ | -------------------- |
| Trabalho único em segundo plano      | Tarefa simples       |
| Pipeline de várias etapas (A, depois B, depois C) | Task Flow (gerenciado) |
| Observar tarefas criadas externamente | Task Flow (espelhado) |
| Lembrete único                       | Trabalho Cron        |

## Padrão confiável de workflow agendado

Para workflows recorrentes, como briefings de inteligência de mercado, trate o agendamento, a orquestração e as verificações de confiabilidade como camadas separadas:

1. Use [Tarefas Agendadas](/pt-BR/automation/cron-jobs) para temporização.
2. Use uma sessão cron persistente quando o workflow deve se basear no contexto anterior.
3. Use [Lobster](/pt-BR/tools/lobster) para etapas determinísticas, gates de aprovação e tokens de retomada.
4. Use Task Flow para rastrear a execução de várias etapas entre tarefas filhas, esperas, novas tentativas e reinicializações do gateway.

Exemplo de formato cron:

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

Use `session:<id>` em vez de `isolated` quando o workflow recorrente precisar de histórico deliberado, resumos de execuções anteriores ou contexto permanente. Use `isolated` quando cada execução deve começar do zero e todo o estado necessário está explícito no workflow.

Dentro do workflow, coloque verificações de confiabilidade antes da etapa de resumo do LLM:

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

Verificações de preparação recomendadas:

- Disponibilidade do navegador e escolha do perfil, por exemplo `openclaw` para estado gerenciado ou `user` quando uma sessão conectada do Chrome é necessária. Consulte [Navegador](/pt-BR/tools/browser).
- Credenciais de API e cota para cada fonte.
- Alcance de rede para endpoints necessários.
- Ferramentas necessárias habilitadas para o agente, como `lobster`, `browser` e `llm-task`.
- Destino de falha configurado para cron para que falhas de preparação fiquem visíveis. Consulte [Tarefas Agendadas](/pt-BR/automation/cron-jobs#delivery-and-output).

Campos recomendados de proveniência de dados para cada item coletado:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Faça o workflow rejeitar ou marcar itens obsoletos antes da sumarização. A etapa do LLM deve receber apenas JSON estruturado e deve ser instruída a preservar `sourceUrl`, `retrievedAt` e `asOf` na saída. Use [LLM Task](/pt-BR/tools/llm-task) quando precisar de uma etapa de modelo validada por esquema dentro do workflow.

Para workflows reutilizáveis de equipe ou comunidade, empacote a CLI, arquivos `.lobster` e quaisquer notas de configuração como uma skill ou plugin e publique-o pelo [ClawHub](/pt-BR/clawhub). Mantenha guardrails específicos do workflow nesse pacote, a menos que a API do plugin não tenha uma capacidade genérica necessária.

## Modos de sincronização

### Modo gerenciado

Task Flow controla o ciclo de vida de ponta a ponta. Ele cria tarefas como etapas do fluxo, as conduz até a conclusão e avança o estado do fluxo automaticamente.

Exemplo: um fluxo de relatório semanal que (1) coleta dados, (2) gera o relatório e (3) o entrega. Task Flow cria cada etapa como uma tarefa em segundo plano, aguarda a conclusão e então passa para a próxima etapa.

```
Fluxo: weekly-report
  Etapa 1: gather-data     → tarefa criada → bem-sucedida
  Etapa 2: generate-report → tarefa criada → bem-sucedida
  Etapa 3: deliver         → tarefa criada → em execução
```

### Modo espelhado

Task Flow observa tarefas criadas externamente e mantém o estado do fluxo sincronizado sem assumir a responsabilidade pela criação das tarefas. Isso é útil quando as tarefas se originam de trabalhos cron, comandos da CLI ou outras fontes e você quer uma visão unificada do progresso delas como um fluxo.

Exemplo: três trabalhos cron independentes que juntos formam uma rotina de "operações matinais". Um fluxo espelhado rastreia o progresso coletivo sem controlar quando ou como eles são executados.

## Estado durável e rastreamento de revisões

Cada fluxo persiste seu próprio estado e rastreia revisões para que o progresso sobreviva a reinicializações do gateway. O rastreamento de revisões permite detectar conflitos quando várias fontes tentam avançar o mesmo fluxo simultaneamente.
O registro de fluxos usa SQLite com manutenção limitada do log de gravação antecipada, incluindo
checkpoints periódicos e no desligamento, para que gateways de longa duração não retenham
arquivos auxiliares `registry.sqlite-wal` sem limite.

## Comportamento de cancelamento

`openclaw tasks flow cancel` define uma intenção de cancelamento persistente no fluxo. Tarefas ativas dentro do fluxo são canceladas, e nenhuma nova etapa é iniciada. A intenção de cancelamento persiste entre reinicializações, então um fluxo cancelado permanece cancelado mesmo que o gateway reinicie antes que todas as tarefas filhas tenham terminado.

## Comandos da CLI

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
| `openclaw tasks flow list`        | Mostra fluxos rastreados com status e modo de sincronização |
| `openclaw tasks flow show <id>`   | Inspeciona um fluxo por ID de fluxo ou chave de busca |
| `openclaw tasks flow cancel <id>` | Cancela um fluxo em execução e suas tarefas ativas |

## Como fluxos se relacionam com tarefas

Fluxos coordenam tarefas, não as substituem. Um único fluxo pode conduzir várias tarefas em segundo plano ao longo de sua vida útil. Use `openclaw tasks` para inspecionar registros de tarefas individuais e `openclaw tasks flow` para inspecionar o fluxo orquestrador.

## Relacionados

- [Tarefas em segundo plano](/pt-BR/automation/tasks) — o livro-razão de trabalho desacoplado que fluxos coordenam
- [CLI: tarefas](/pt-BR/cli/tasks) — referência de comandos da CLI para `openclaw tasks flow`
- [Visão geral de automação](/pt-BR/automation) — todos os mecanismos de automação em um só lugar
- [Trabalhos Cron](/pt-BR/automation/cron-jobs) — trabalhos agendados que podem alimentar fluxos
