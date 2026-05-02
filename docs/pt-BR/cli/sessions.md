---
read_when:
    - Você quer listar sessões armazenadas e ver a atividade recente
summary: Referência da CLI para `openclaw sessions` (listar sessões armazenadas + uso)
title: Sessões
x-i18n:
    generated_at: "2026-05-02T05:44:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4e7e5017ba5a6194ac10d3a18ea9b711da57bc2ef1696776622cd3be2a2fbf43
    source_path: cli/sessions.md
    workflow: 16
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

- padrão: armazenamento do agente padrão configurado
- `--verbose`: registro detalhado
- `--agent <id>`: um armazenamento de agente configurado
- `--all-agents`: agrega todos os armazenamentos de agentes configurados
- `--store <path>`: caminho explícito do armazenamento (não pode ser combinado com `--agent` ou `--all-agents`)

Exporte um pacote de trajetória para uma sessão armazenada:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Este é o caminho de comando usado pelo comando de barra `/export-trajectory` depois que
o proprietário aprova a solicitação de execução. O diretório de saída é sempre resolvido
dentro de `.openclaw/trajectory-exports/` no workspace selecionado.

`openclaw sessions --all-agents` lê armazenamentos de agentes configurados. A descoberta
de sessões do Gateway e do ACP é mais ampla: ela também inclui armazenamentos existentes
apenas em disco encontrados sob a raiz padrão `agents/` ou uma raiz `session.store`
modelada. Esses armazenamentos descobertos devem resolver para arquivos `sessions.json`
regulares dentro da raiz do agente; symlinks e caminhos fora da raiz são ignorados.

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

`openclaw sessions cleanup` usa as configurações `session.maintenance` da configuração:

- Observação de escopo: `openclaw sessions cleanup` mantém armazenamentos de sessão, transcrições e sidecars de trajetória. Ele não remove logs de execuções de Cron (`cron/runs/<jobId>.jsonl`), que são gerenciados por `cron.runLog.maxBytes` e `cron.runLog.keepLines` em [configuração do Cron](/pt-BR/automation/cron-jobs#configuration) e explicados em [manutenção do Cron](/pt-BR/automation/cron-jobs#maintenance).

- `--dry-run`: visualiza quantas entradas seriam removidas/limitadas sem gravar.
  - No modo texto, dry-run imprime uma tabela de ações por sessão (`Action`, `Key`, `Age`, `Model`, `Flags`) para que você possa ver o que seria mantido versus removido.
- `--enforce`: aplica a manutenção mesmo quando `session.maintenance.mode` é `warn`.
- `--fix-missing`: remove entradas cujos arquivos de transcrição estão ausentes, mesmo que elas normalmente ainda não fossem removidas por idade/contagem.
- `--active-key <key>`: protege uma chave ativa específica contra remoção por orçamento de disco. Ponteiros externos duráveis de conversas, como sessões de grupo e sessões de chat com escopo de thread, também são mantidos pela manutenção por idade/contagem/orçamento de disco.
- `--agent <id>`: executa a limpeza para um armazenamento de agente configurado.
- `--all-agents`: executa a limpeza para todos os armazenamentos de agentes configurados.
- `--store <path>`: executa em um arquivo `sessions.json` específico.
- `--json`: imprime um resumo JSON. Com `--all-agents`, a saída inclui um resumo por armazenamento.

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
