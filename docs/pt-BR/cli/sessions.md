---
read_when:
    - Você quer listar as sessões armazenadas e ver a atividade recente
summary: Referência da CLI para `openclaw sessions` (listar sessões armazenadas + uso)
title: Sessões
x-i18n:
    generated_at: "2026-05-05T08:25:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: a204189952bc82788eb724c0a6b6db93c7d6795ad69bb6d498e8575236c3272e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Lista sessões de conversa armazenadas.

As listas de sessões não são verificações de atividade de canal/provedor. Elas mostram linhas de conversa persistidas dos armazenamentos de sessão. Um canal Discord, Slack, Telegram ou outro canal silencioso pode se reconectar com sucesso sem criar uma nova linha de sessão até que uma mensagem seja processada. Use `openclaw channels status --probe`, `openclaw status --deep` ou `openclaw health --verbose` quando precisar de conectividade de canal ao vivo.

As respostas de `openclaw sessions` e Gateway `sessions.list` são limitadas por padrão para que armazenamentos grandes e de longa duração não monopolizem o processo da CLI ou o loop de eventos do Gateway. A CLI retorna as 100 sessões mais recentes por padrão; passe `--limit <n>` para uma janela menor/maior ou `--limit all` quando você precisar intencionalmente do armazenamento completo. As respostas JSON incluem `totalCount`, `limitApplied` e `hasMore` quando os chamadores precisam mostrar que existem mais linhas.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

Seleção de escopo:

- padrão: armazenamento do agente padrão configurado
- `--verbose`: registro detalhado
- `--agent <id>`: um armazenamento de agente configurado
- `--all-agents`: agrega todos os armazenamentos de agentes configurados
- `--store <path>`: caminho de armazenamento explícito (não pode ser combinado com `--agent` ou `--all-agents`)
- `--limit <n|all>`: máximo de linhas a emitir (padrão `100`; `all` restaura a saída completa)

Exporte um pacote de trajetória para uma sessão armazenada:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Este é o caminho de comando usado pelo comando de barra `/export-trajectory` depois que o proprietário aprova a solicitação de execução. O diretório de saída é sempre resolvido dentro de `.openclaw/trajectory-exports/` no workspace selecionado.

`openclaw sessions --all-agents` lê armazenamentos de agentes configurados. A descoberta de sessões do Gateway e do ACP é mais ampla: ela também inclui armazenamentos presentes apenas no disco encontrados na raiz padrão `agents/` ou em uma raiz `session.store` modelada. Esses armazenamentos descobertos devem resolver para arquivos `sessions.json` regulares dentro da raiz do agente; links simbólicos e caminhos fora da raiz são ignorados.

Exemplos JSON:

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
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Manutenção de limpeza

Execute a manutenção agora (em vez de aguardar o próximo ciclo de escrita):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` usa as configurações `session.maintenance` da configuração:

- Observação de escopo: `openclaw sessions cleanup` mantém armazenamentos de sessão, transcrições e sidecars de trajetória. Ele não remove logs de execuções de Cron (`cron/runs/<jobId>.jsonl`), que são gerenciados por `cron.runLog.maxBytes` e `cron.runLog.keepLines` em [Configuração do Cron](/pt-BR/automation/cron-jobs#configuration) e explicados em [Manutenção do Cron](/pt-BR/automation/cron-jobs#maintenance).
- A limpeza também remove transcrições primárias não referenciadas, checkpoints de Compaction e sidecars de trajetória mais antigos que `session.maintenance.pruneAfter`; arquivos ainda referenciados por `sessions.json` são preservados.

- `--dry-run`: pré-visualiza quantas entradas seriam removidas/limitadas sem escrever.
  - No modo texto, a execução de teste imprime uma tabela de ações por sessão (`Action`, `Key`, `Age`, `Model`, `Flags`) para que você possa ver o que seria mantido em comparação com o que seria removido.
- `--enforce`: aplica a manutenção mesmo quando `session.maintenance.mode` é `warn`.
- `--fix-missing`: remove entradas cujos arquivos de transcrição estão ausentes, mesmo que elas normalmente ainda não fossem removidas por idade/contagem.
- `--active-key <key>`: protege uma chave ativa específica contra despejo por orçamento de disco. Ponteiros duráveis de conversas externas, como sessões de grupo e sessões de chat com escopo de thread, também são mantidos pela manutenção por idade/contagem/orçamento de disco.
- `--agent <id>`: executa a limpeza para um armazenamento de agente configurado.
- `--all-agents`: executa a limpeza para todos os armazenamentos de agentes configurados.
- `--store <path>`: executa contra um arquivo `sessions.json` específico.
- `--json`: imprime um resumo JSON. Com `--all-agents`, a saída inclui um resumo por armazenamento.

Quando um Gateway está acessível, a limpeza sem execução de teste para armazenamentos de agentes configurados é enviada pelo Gateway, de modo que ela compartilhe o mesmo escritor do armazenamento de sessão que o tráfego em tempo de execução. Use `--store <path>` para reparo offline explícito de um arquivo de armazenamento.

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
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

Relacionado:

- Configuração de sessão: [Referência de configuração](/pt-BR/gateway/config-agents#session)

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Gerenciamento de sessões](/pt-BR/concepts/session)
