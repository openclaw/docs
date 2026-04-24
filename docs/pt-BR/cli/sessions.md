---
read_when:
    - Você quer listar sessões armazenadas e ver atividade recente
summary: Referência da CLI para `openclaw sessions` (listar sessões armazenadas + uso)
title: Sessões
x-i18n:
    generated_at: "2026-04-24T05:46:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d9fdc5d4cc968784e6e937a1000e43650345c27765208d46611e1fe85ee9293
    source_path: cli/sessions.md
    workflow: 15
---

# `openclaw sessions`

Liste sessões de conversa armazenadas.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Seleção de escopo:

- padrão: store do agente padrão configurado
- `--verbose`: logging detalhado
- `--agent <id>`: store de um agente configurado
- `--all-agents`: agrega todos os stores de agentes configurados
- `--store <path>`: caminho explícito do store (não pode ser combinado com `--agent` ou `--all-agents`)

`openclaw sessions --all-agents` lê stores de agentes configurados. A descoberta de
sessões do Gateway e do ACP é mais ampla: ela também inclui stores somente em disco encontrados sob a
raiz padrão `agents/` ou uma raiz `session.store` com template. Esses
stores descobertos precisam resolver para arquivos `sessions.json` regulares dentro da
raiz do agente; symlinks e caminhos fora da raiz são ignorados.

Exemplos de JSON:

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
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Manutenção de limpeza

Execute a manutenção agora (em vez de esperar pelo próximo ciclo de gravação):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` usa as configurações de `session.maintenance` da config:

- Observação de escopo: `openclaw sessions cleanup` faz manutenção apenas de stores/transcrições de sessão. Ele não remove logs de execução do cron (`cron/runs/<jobId>.jsonl`), que são gerenciados por `cron.runLog.maxBytes` e `cron.runLog.keepLines` em [Configuração do Cron](/pt-BR/automation/cron-jobs#configuration) e explicados em [Manutenção do Cron](/pt-BR/automation/cron-jobs#maintenance).

- `--dry-run`: mostra uma prévia de quantas entradas seriam removidas/limitadas sem gravar.
  - No modo texto, dry-run imprime uma tabela de ações por sessão (`Action`, `Key`, `Age`, `Model`, `Flags`) para que você veja o que seria mantido vs removido.
- `--enforce`: aplica a manutenção mesmo quando `session.maintenance.mode` é `warn`.
- `--fix-missing`: remove entradas cujos arquivos de transcrição estão ausentes, mesmo que normalmente ainda não expirassem por idade/quantidade.
- `--active-key <key>`: protege uma chave ativa específica contra remoção por orçamento de disco.
- `--agent <id>`: executa a limpeza para um store de agente configurado.
- `--all-agents`: executa a limpeza para todos os stores de agentes configurados.
- `--store <path>`: executa em um arquivo `sessions.json` específico.
- `--json`: imprime um resumo em JSON. Com `--all-agents`, a saída inclui um resumo por store.

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
- [Gerenciamento de sessão](/pt-BR/concepts/session)
