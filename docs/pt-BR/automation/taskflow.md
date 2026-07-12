---
read_when:
    - Você quer entender como o TaskFlow se relaciona com tarefas em segundo plano
    - Você encontra Task Flow ou openclaw tasks flow nas notas de versão ou na documentação
    - Você quer inspecionar ou gerenciar o estado persistente do fluxo
summary: Camada de orquestração do Task Flow acima das tarefas em segundo plano
title: Fluxo de tarefas
x-i18n:
    generated_at: "2026-07-11T23:43:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ccc6acf58b4b44c2989e3061bff08dabce8ef385706102360c756a1286ddd1b
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow é a camada de orquestração acima das [tarefas em segundo plano](/pt-BR/automation/tasks). Um fluxo é um registro durável de um trabalho com várias etapas, com status, estado JSON, contador de revisões e registros de tarefas vinculados próprios. Os fluxos persistem após reinicializações do Gateway; as tarefas individuais continuam sendo a unidade de trabalho desvinculado.

## Quando usar o Task Flow

| Cenário                                          | Usar                                               |
| ------------------------------------------------ | -------------------------------------------------- |
| Trabalho único em segundo plano                   | Tarefa simples                                     |
| Pipeline com várias etapas controlado por Plugin | Task Flow (gerenciado)                             |
| Inicialização desvinculada de ACP ou subagente   | Task Flow (espelhado, criado automaticamente)      |
| Lembrete de execução única                        | Trabalho Cron                                      |

## Modos de sincronização

### Modo gerenciado

Um fluxo gerenciado tem um controlador: código de Plugin que cria o fluxo por meio da API Task Flow do runtime do Plugin, com um objetivo e um ID de controlador obrigatório, e depois o controla explicitamente.

- Cada etapa é executada como uma tarefa em segundo plano criada dentro do fluxo; a chave do proprietário e a origem do solicitante do fluxo são propagadas para as tarefas filhas.
- O controlador avança o fluxo entre `running`, `waiting` e estados terminais, além de armazenar um estado arbitrário de etapa em JSON no registro do fluxo.
- Toda mutação informa a revisão esperada do fluxo. Uma gravação obsoleta é rejeitada como conflito de revisão, em vez de sobrescrever um estado mais recente.
- Depois que o cancelamento é solicitado, novas tarefas filhas são recusadas, e o fluxo é finalizado como `cancelled` quando nenhuma tarefa filha permanece ativa.

Exemplo: um fluxo de relatório semanal que (1) coleta dados, (2) gera o relatório e (3) o entrega, com uma tarefa em segundo plano por etapa:

```
Fluxo: relatório-semanal
  Etapa 1: coletar-dados  → tarefa criada → concluída com sucesso
  Etapa 2: gerar-relatório → tarefa criada → concluída com sucesso
  Etapa 3: entregar       → tarefa criada → em execução
```

### Modo espelhado

O OpenClaw cria automaticamente um fluxo espelhado de tarefa única quando uma execução desvinculada de ACP ou subagente é iniciada (tarefas com escopo de sessão e conclusão entregável). O registro do fluxo espelha sua única tarefa subjacente — status, objetivo e informações de tempo — para que inicializações desvinculadas tenham um identificador estável de fluxo nas interfaces de status e nova tentativa, sem um controlador. Os fluxos espelhados exibem o modo de sincronização `task_mirrored` na CLI.

## Status dos fluxos

| Status      | Significado                                                                                |
| ----------- | ------------------------------------------------------------------------------------------ |
| `queued`    | Criado, ainda sem progresso                                                               |
| `running`   | O fluxo está progredindo ativamente                                                       |
| `waiting`   | O fluxo gerenciado está pausado nos metadados de espera (temporizador, evento externo)    |
| `blocked`   | Uma etapa terminou sem resultado utilizável; `blockedTaskId`/resumo indicam qual          |
| `succeeded` | Concluído com sucesso                                                                      |
| `failed`    | Concluído com um erro                                                                      |
| `cancelled` | Cancelamento solicitado e todas as tarefas filhas encerradas                              |
| `lost`      | O fluxo perdeu seu estado subjacente autoritativo                                          |

## Estado durável e acompanhamento de revisões

Os registros de fluxo persistem no banco de dados de estado SQLite compartilhado (`~/.openclaw/state/openclaw.sqlite`, tabela `flow_runs`) junto com os registros de tarefas, de modo que o progresso persiste após reinicializações do Gateway. Cada gravação incrementa a `revision` do fluxo; gravadores simultâneos que informam uma revisão esperada obsoleta recebem um conflito e precisam fazer uma nova leitura. O crescimento do WAL é limitado pelos checkpoints automáticos do SQLite e por checkpoints passivos periódicos, com checkpoints de truncamento durante o encerramento. O arquivo auxiliar legado `flows/registry.sqlite` de instalações mais antigas é importado pelo `openclaw doctor`.

## Comportamento de cancelamento

`openclaw tasks flow cancel` define no fluxo uma intenção persistente de cancelamento, cancela suas tarefas filhas ativas e recusa novas tarefas filhas gerenciadas. Quando nenhuma tarefa filha permanece ativa, o fluxo é finalizado como `cancelled` — imediatamente ou pela varredura de manutenção, caso as tarefas filhas demorem mais para terminar. A intenção é persistida, portanto, um fluxo cancelado permanece cancelado mesmo que o Gateway seja reiniciado antes que todas as tarefas filhas tenham terminado.

## Comandos da CLI

```bash
# List active and recent flows
openclaw tasks flow list [--status <status>] [--json]

# Show details for a specific flow
openclaw tasks flow show <lookup> [--json]

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Comando                           | Descrição                                                                          |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| `openclaw tasks flow list`        | Fluxos acompanhados com modo de sincronização, status, revisão, controlador e contagens de tarefas |
| `openclaw tasks flow show <id>`   | Inspeciona um fluxo pelo ID do fluxo ou pela chave do proprietário, incluindo tarefas vinculadas |
| `openclaw tasks flow cancel <id>` | Cancela um fluxo em execução e suas tarefas ativas                                 |

Os fluxos também são abrangidos por `openclaw tasks audit` (constatações de fluxos obsoletos ou corrompidos) e `openclaw tasks maintenance` (finaliza cancelamentos travados e remove fluxos terminais após 7 dias).

## Padrão confiável de fluxo de trabalho agendado

Para fluxos de trabalho recorrentes, como informes de inteligência de mercado, trate o agendamento, a orquestração e as verificações de confiabilidade como camadas separadas:

1. Use [Tarefas agendadas](/pt-BR/automation/cron-jobs) para definir os horários.
2. Use uma sessão Cron persistente quando o fluxo de trabalho precisar aproveitar o contexto anterior.
3. Use o [Lobster](/pt-BR/tools/lobster) para etapas determinísticas, pontos de aprovação e tokens de retomada.
4. Use o Task Flow para acompanhar a execução com várias etapas entre tarefas filhas, esperas, novas tentativas e reinicializações do Gateway.

Exemplo de configuração Cron:

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

Use `--session session:<id>` em vez de `isolated` quando o fluxo de trabalho recorrente precisar de histórico intencional, resumos de execuções anteriores ou contexto permanente. Use `isolated` quando cada execução precisar começar do zero e todo o estado necessário estiver explícito no fluxo de trabalho.

Dentro do fluxo de trabalho, coloque as verificações de confiabilidade antes da etapa de resumo do LLM:

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

Verificações preliminares recomendadas:

- Disponibilidade do navegador e escolha do perfil, por exemplo, `openclaw` para estado gerenciado ou `user` quando for necessária uma sessão autenticada do Chrome. Consulte [Navegador](/pt-BR/tools/browser).
- Credenciais e cota da API para cada fonte.
- Acessibilidade de rede dos endpoints necessários.
- Ferramentas necessárias habilitadas para o agente, como `lobster`, `browser` e `llm-task`.
- Destino de falhas configurado para o Cron, para que falhas nas verificações preliminares fiquem visíveis. Consulte [Tarefas agendadas](/pt-BR/automation/cron-jobs#delivery-and-output).

Campos recomendados de proveniência dos dados para cada item coletado:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Faça com que o fluxo de trabalho rejeite ou marque itens obsoletos antes do resumo. A etapa do LLM deve receber somente JSON estruturado e deve ser instruída a preservar `sourceUrl`, `retrievedAt` e `asOf` na saída. Use [Tarefa do LLM](/pt-BR/tools/llm-task) quando precisar de uma etapa de modelo validada por esquema dentro do fluxo de trabalho.

Para fluxos de trabalho reutilizáveis de equipes ou comunidades, empacote a CLI, os arquivos `.lobster` e quaisquer notas de configuração como uma skill ou Plugin e publique o pacote por meio do [ClawHub](/clawhub). Mantenha as proteções específicas do fluxo de trabalho nesse pacote, a menos que falte à API do Plugin um recurso genérico necessário.

## Como os fluxos se relacionam às tarefas

Os fluxos coordenam tarefas, não as substituem. Um único fluxo pode controlar várias tarefas em segundo plano ao longo de sua vida útil. Use `openclaw tasks` para inspecionar registros de tarefas individuais e `openclaw tasks flow` para inspecionar o fluxo de orquestração.

## Relacionados

- [Tarefas em segundo plano](/pt-BR/automation/tasks) — o registro de trabalhos desvinculados que os fluxos coordenam
- [CLI: tarefas](/pt-BR/cli/tasks) — referência dos comandos da CLI para `openclaw tasks flow`
- [Visão geral da automação](/pt-BR/automation) — todos os mecanismos de automação em resumo
- [Trabalhos Cron](/pt-BR/automation/cron-jobs) — trabalhos agendados que podem alimentar fluxos
