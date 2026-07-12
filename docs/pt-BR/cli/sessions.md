---
read_when:
    - Você quer listar as sessões armazenadas e ver as atividades recentes
summary: Referência da CLI para `openclaw sessions` (listar sessões armazenadas + uso)
title: Sessões
x-i18n:
    generated_at: "2026-07-12T15:06:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 29820bd34035ba3a6539950bd18dc671739eaeee9ddea3d57455c16b945caffa
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Liste as sessões de conversa armazenadas.

As listas de sessões não são verificações de disponibilidade de canal/provedor. Elas mostram linhas de
conversas persistidas nos armazenamentos de sessões. Um Discord, Slack, Telegram ou
outro canal inativo pode se reconectar com sucesso sem criar uma nova linha de sessão
até que uma mensagem seja processada. Use `openclaw channels status --probe`,
`openclaw status --deep` ou `openclaw health --verbose` quando precisar verificar a
conectividade do canal em tempo real.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --store ./tmp/sessions.json
openclaw sessions --json
```

Opções:

| Opção                | Descrição                                                                 |
| -------------------- | ------------------------------------------------------------------------- |
| `--agent <id>`       | Um armazenamento de agente configurado (padrão: agente padrão configurado). |
| `--all-agents`       | Agrega todos os armazenamentos de agentes configurados.                   |
| `--store <path>`     | Caminho explícito do armazenamento (não pode ser combinado com `--agent` ou `--all-agents`). |
| `--active <minutes>` | Mostra apenas sessões atualizadas nos últimos N minutos.                  |
| `--limit <n\|all>`   | Máximo de linhas na saída (padrão `100`; `all` restaura a saída completa). |
| `--json`             | Saída legível por máquina.                                                |
| `--verbose`          | Registro detalhado.                                                       |

`openclaw sessions` e a RPC `sessions.list` do Gateway são limitados por padrão
para que armazenamentos grandes e de longa duração não monopolizem o processo da CLI nem o loop de
eventos do Gateway. A CLI retorna as 100 sessões mais recentes por padrão; passe `--limit <n>`
para uma janela menor/maior ou `--limit all` quando precisar intencionalmente do
armazenamento completo. As respostas JSON incluem `totalCount`, `limitApplied` e `hasMore`
quando os clientes precisam indicar que existem mais linhas.

Os clientes RPC podem passar `configuredAgentsOnly: true` para manter a fonte ampla e combinada
de descoberta, mas retornar apenas linhas de agentes atualmente presentes na configuração.
A Control UI usa esse modo por padrão para que armazenamentos de agentes excluídos ou presentes
somente no disco não reapareçam na visualização de Sessões.

`--all-agents` lê os armazenamentos de agentes configurados. A descoberta de sessões do Gateway e do ACP
é mais ampla: ela também inclui armazenamentos SQLite resolvidos a partir das
raízes dos agentes configurados ou de uma raiz `session.store` baseada em modelo. Caminhos de seletores
legados devem ser resolvidos dentro da raiz do agente; links simbólicos e caminhos fora da raiz são
ignorados.

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.6-sol" },
    { "agentId": "work", "key": "agent:work:main", "model": "anthropic/claude-sonnet-4-6" }
  ]
}
```

## Acompanhar o progresso da trajetória

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` renderiza eventos recentes da trajetória de execução como linhas compactas
de progresso. Sem `--session-key`, ele acompanha primeiro as sessões em execução e depois
a sessão armazenada mais recente. `--tail <count>` controla quantos eventos existentes
são impressos antes do modo de acompanhamento; o padrão é `80`, e `0` começa no final atual.
`--follow` continua monitorando a sessão selecionada baseada em SQLite ou um arquivo explícito
de trajetória legada.

A visualização de progresso é intencionalmente conservadora: o texto do prompt, os argumentos das ferramentas
e o conteúdo dos resultados das ferramentas não são impressos. As chamadas de ferramentas mostram o nome da ferramenta com
`{...redacted...}`; os resultados das ferramentas mostram um status como `ok`, `error` ou `done`;
as linhas de conclusão do modelo mostram o provedor/modelo e o status final.

## Exportar um pacote de trajetória

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Este é o caminho de comando usado pelo comando de barra `/export-trajectory` depois que
o proprietário aprova a solicitação de execução. O diretório de saída é sempre resolvido
dentro de `.openclaw/trajectory-exports/`, no espaço de trabalho selecionado.

## Manutenção de limpeza

Execute a manutenção agora em vez de aguardar o próximo ciclo de gravação:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` usa as configurações de `session.maintenance` da configuração
([Referência de configuração](/pt-BR/gateway/config-agents#session)):

- Observação de escopo: `openclaw sessions cleanup` mantém armazenamentos de sessões,
  transcrições, linhas de trajetória e arquivos auxiliares de trajetórias legadas. Ele não
  remove o histórico de execuções do Cron, que é gerenciado por `cron.runLog.keepLines`
  ([Configuração do Cron](/pt-BR/automation/cron-jobs#configuration)).
- A limpeza também remove artefatos de transcrições legadas/arquivadas sem referência,
  pontos de verificação de Compaction e arquivos auxiliares de trajetórias mais antigos que
  `session.maintenance.pruneAfter`; artefatos ainda referenciados por linhas de sessões do SQLite
  são preservados.
- A limpeza relata separadamente como `modelRunPruned` a remoção de sondagens de execução de modelo
  de curta duração do Gateway. Isso corresponde apenas a chaves explícitas estritas no formato
  `agent:*:explicit:model-run-<uuid>`. A retenção é fixa em `24h` e condicionada à pressão:
  ela remove linhas de sondagem obsoletas apenas quando a pressão de manutenção/limite de entradas
  de sessão é atingida. Quando executada, a limpeza de execuções de modelo ocorre antes da limpeza
  global de dados obsoletos e da aplicação de limites.

Opções:

| Opção                | Descrição                                                                                                                                                                                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | Visualiza quantas entradas seriam removidas/limitadas sem gravar. No modo de texto, imprime uma tabela de ações por sessão (`Action`, `Key`, `Age`, `Model`, `Flags`), além de um resumo agrupado pelo rótulo da sessão.                                                                                         |
| `--enforce`          | Aplica a manutenção mesmo quando `session.maintenance.mode` é `warn`.                                                                                                                                                                                                                                       |
| `--fix-missing`      | Remove entradas legadas cujos artefatos de transcrição arquivados estão ausentes ou contêm apenas o cabeçalho/estão vazios, mesmo que normalmente ainda não fossem removidos por idade/contagem.                                                                                                              |
| `--fix-dm-scope`     | Quando `session.dmScope` é `main`, desativa linhas obsoletas de mensagens diretas indexadas por par deixadas por roteamentos anteriores `per-peer`, `per-channel-peer` ou `per-account-channel-peer`. Use primeiro `--dry-run`; a aplicação remove essas linhas do SQLite e preserva seus artefatos de transcrição legados como arquivos excluídos. |
| `--active-key <key>` | Protege uma chave ativa específica contra a remoção causada pelo orçamento de disco. Ponteiros duráveis para conversas externas, como sessões de grupo e sessões de chat com escopo de thread, também são mantidos pela manutenção por idade/contagem/orçamento de disco.                                        |
| `--agent <id>`       | Executa a limpeza para um armazenamento de agente configurado.                                                                                                                                                                                                                                             |
| `--all-agents`       | Executa a limpeza para todos os armazenamentos de agentes configurados.                                                                                                                                                                                                                                    |
| `--store <path>`     | Executa em um caminho específico de seletor de armazenamento legado.                                                                                                                                                                                                                                       |
| `--json`             | Imprime um resumo em JSON. Com `--all-agents`, a saída inclui um resumo por armazenamento.                                                                                                                                                                                                                  |

Quando um Gateway está acessível, a limpeza que não seja uma simulação para armazenamentos de agentes configurados é
enviada pelo Gateway para compartilhar o mesmo gravador do armazenamento de sessões usado pelo tráfego
de execução. Use `--store <path>` para o reparo offline explícito de um seletor de armazenamento
legado.

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

## Compactar uma sessão

Recupere o orçamento de contexto de uma sessão travada ou grande demais. `openclaw sessions
compact <key>` é o wrapper de primeira classe em torno da RPC `sessions.compact`
do Gateway e requer um Gateway em execução.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Sem `--max-lines`, o LLM do Gateway resume a transcrição. Por padrão, a CLI
  não impõe um prazo ao cliente; o Gateway controla o ciclo de vida
  configurado da Compaction.
- Com `--max-lines <n>`, ele trunca para as últimas `n` linhas da transcrição e
  arquiva a transcrição anterior como um arquivo auxiliar `.bak`.
- `--agent <id>`: agente proprietário da sessão; obrigatório para chaves `global`.
- `--url` / `--token` / `--password`: substituições da conexão com o Gateway.
- `--timeout <ms>`: tempo limite RPC opcional do lado do cliente, em milissegundos.
- `--json`: imprime a carga útil RPC bruta.

O comando é encerrado com código diferente de zero quando o Gateway relata uma Compaction com falha ou está
inacessível, para que crons e scripts nunca confundam uma ausência silenciosa de operação com sucesso.

<Note>
`openclaw agent --message '/compact ...'` **não** é um caminho de Compaction. Comandos de
barra enviados pela CLI são rejeitados pela verificação de remetente autorizado; essa
invocação é encerrada com código diferente de zero e fornece orientações que apontam para esta seção, em vez de silenciosamente
não realizar nenhuma operação.
</Note>

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` aceita:

| Campo      | Tipo        | Obrigatório | Descrição                                                        |
| ---------- | ----------- | ----------- | ---------------------------------------------------------------- |
| `key`      | string      | sim         | Chave da sessão a compactar (por exemplo, `agent:main:main`).     |
| `agentId`  | string      | não         | ID do agente proprietário da sessão (para chaves `global`).      |
| `maxLines` | integer ≥ 1 | não         | Trunca para as últimas N linhas em vez de usar resumo por LLM.   |

Exemplo de resposta com resumo por LLM:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Exemplo de resposta com truncamento (`--max-lines 200`):

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## Relacionados

- [Configuração de sessão](/pt-BR/gateway/config-agents#session)
- [Gerenciamento de sessões](/pt-BR/concepts/session)
- [Compaction](/pt-BR/concepts/compaction)
- [Referência da CLI](/pt-BR/cli)
