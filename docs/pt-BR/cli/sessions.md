---
read_when:
    - Você quer listar as sessões armazenadas e ver a atividade recente
summary: Referência da CLI para `openclaw sessions` (listar sessões armazenadas + uso)
title: Sessões
x-i18n:
    generated_at: "2026-05-04T07:02:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dc90344f40c53513bd6db3696bc709279155f26e7c3b6ea27e81a07a2f9f15e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Liste sessões de conversa armazenadas.

Listas de sessões não são verificações de disponibilidade de canal/provedor. Elas mostram linhas de conversa persistidas dos armazenamentos de sessões. Um Discord, Slack, Telegram ou outro canal silencioso pode se reconectar com sucesso sem criar uma nova linha de sessão até que uma mensagem seja processada. Use `openclaw channels status --probe`, `openclaw status --deep` ou `openclaw health --verbose` quando precisar de conectividade de canal ao vivo.

As respostas `sessions.list` do Gateway são limitadas por padrão para que armazenamentos grandes e de longa duração não monopolizem o loop de eventos do Gateway. Passe um `limit` positivo explícito de clientes RPC quando uma janela de resultados diferente for necessária; as respostas incluem `totalCount`, `limitApplied` e `hasMore` quando os chamadores precisam mostrar que existem mais linhas.

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
- `--verbose`: registro em log detalhado
- `--agent <id>`: um armazenamento de agente configurado
- `--all-agents`: agrega todos os armazenamentos de agentes configurados
- `--store <path>`: caminho explícito do armazenamento (não pode ser combinado com `--agent` ou `--all-agents`)

Exporte um pacote de trajetória para uma sessão armazenada:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Este é o caminho de comando usado pelo comando de barra `/export-trajectory` depois que o proprietário aprova a solicitação de exec. O diretório de saída é sempre resolvido dentro de `.openclaw/trajectory-exports/` no workspace selecionado.

`openclaw sessions --all-agents` lê armazenamentos de agentes configurados. A descoberta de sessões do Gateway e do ACP é mais ampla: ela também inclui armazenamentos somente em disco encontrados sob a raiz padrão `agents/` ou uma raiz `session.store` com modelo. Esses armazenamentos descobertos devem resolver para arquivos `sessions.json` regulares dentro da raiz do agente; symlinks e caminhos fora da raiz são ignorados.

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

- Observação de escopo: `openclaw sessions cleanup` faz manutenção de armazenamentos de sessões, transcrições e sidecars de trajetória. Ele não remove logs de execução de Cron (`cron/runs/<jobId>.jsonl`), que são gerenciados por `cron.runLog.maxBytes` e `cron.runLog.keepLines` em [configuração de Cron](/pt-BR/automation/cron-jobs#configuration) e explicados em [manutenção de Cron](/pt-BR/automation/cron-jobs#maintenance).

- `--dry-run`: visualiza quantas entradas seriam removidas/limitadas sem gravar.
  - No modo de texto, dry-run imprime uma tabela de ações por sessão (`Action`, `Key`, `Age`, `Model`, `Flags`) para que você veja o que seria mantido ou removido.
- `--enforce`: aplica manutenção mesmo quando `session.maintenance.mode` é `warn`.
- `--fix-missing`: remove entradas cujos arquivos de transcrição estão ausentes, mesmo que elas normalmente ainda não fossem removidas por idade/contagem.
- `--active-key <key>`: protege uma chave ativa específica da remoção por orçamento de disco. Ponteiros duráveis de conversas externas, como sessões de grupo e sessões de chat com escopo de thread, também são mantidos pela manutenção de idade/contagem/orçamento de disco.
- `--agent <id>`: executa a limpeza para um armazenamento de agente configurado.
- `--all-agents`: executa a limpeza para todos os armazenamentos de agentes configurados.
- `--store <path>`: executa contra um arquivo `sessions.json` específico.
- `--json`: imprime um resumo JSON. Com `--all-agents`, a saída inclui um resumo por armazenamento.

Quando um Gateway está acessível, a limpeza sem dry-run para armazenamentos de agentes configurados é enviada pelo Gateway para que ela compartilhe o mesmo gravador de armazenamento de sessões que o tráfego de runtime. Use `--store <path>` para reparo offline explícito de um arquivo de armazenamento.

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
