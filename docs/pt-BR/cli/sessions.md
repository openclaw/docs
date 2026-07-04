---
read_when:
    - Você quer listar sessões armazenadas e ver atividades recentes
summary: Referência da CLI para `openclaw sessions` (listar sessões armazenadas + uso)
title: Sessões
x-i18n:
    generated_at: "2026-07-04T20:28:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c24ee8a632998624ee41945b26ace3bfe37cadf9447f7632c373784a9301bde
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Lista sessões de conversa armazenadas.

Listas de sessões não são verificações de atividade de canal/provedor. Elas mostram linhas de conversa persistidas nos armazenamentos de sessão. Um Discord, Slack, Telegram ou outro canal silencioso pode se reconectar com sucesso sem criar uma nova linha de sessão até que uma mensagem seja processada. Use `openclaw channels status --probe`, `openclaw status --deep` ou `openclaw health --verbose` quando precisar de conectividade de canal ao vivo.

As respostas de `openclaw sessions` e Gateway `sessions.list` são limitadas por padrão para que armazenamentos grandes e de longa duração não monopolizem o processo da CLI nem o loop de eventos do Gateway. A CLI retorna as 100 sessões mais recentes por padrão; passe `--limit <n>` para uma janela menor/maior ou `--limit all` quando você intencionalmente precisar do armazenamento completo. Respostas JSON incluem `totalCount`, `limitApplied` e `hasMore` quando chamadores precisam mostrar que existem mais linhas.

Clientes RPC podem passar `configuredAgentsOnly: true` para manter a fonte ampla de descoberta combinada, mas retornar somente linhas de agentes presentes atualmente na configuração. A Control UI usa esse modo por padrão para que armazenamentos de agentes excluídos ou existentes apenas em disco não reapareçam na visualização Sessions.

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
- `--store <path>`: caminho explícito do armazenamento (não pode ser combinado com `--agent` ou `--all-agents`)
- `--limit <n|all>`: máximo de linhas para emitir (padrão `100`; `all` restaura a saída completa)

Acompanhe o progresso de trajetória legível por humanos para sessões armazenadas:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` renderiza eventos JSONL de trajetória recentes como linhas de progresso compactas. Sem `--session-key`, ele acompanha primeiro as sessões em execução e depois a sessão armazenada mais recente. `--tail <count>` controla quantos eventos existentes são impressos antes do modo de acompanhamento; o padrão é `80`, e `0` começa no fim atual. `--follow` continua observando os arquivos de trajetória selecionados, incluindo arquivos realocados referenciados por `<session>.trajectory-path.json`.

A visualização de progresso é intencionalmente conservadora: texto de prompt, argumentos de ferramentas e corpos de resultados de ferramentas não são impressos. Chamadas de ferramentas mostram o nome da ferramenta com `{...redacted...}`; resultados de ferramentas mostram status como `ok`, `error` ou `done`; linhas de conclusão de modelo mostram provedor/modelo e status terminal.

Exporte um pacote de trajetória para uma sessão armazenada:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Este é o caminho de comando usado pelo comando de barra `/export-trajectory` depois que o proprietário aprova a solicitação de execução. O diretório de saída sempre é resolvido dentro de `.openclaw/trajectory-exports/` sob o workspace selecionado.

`openclaw sessions --all-agents` lê armazenamentos de agentes configurados. A descoberta de sessões do Gateway e do ACP é mais ampla: ela também inclui armazenamentos existentes apenas em disco encontrados sob a raiz padrão `agents/` ou uma raiz `session.store` com template. Esses armazenamentos descobertos precisam resolver para arquivos `sessions.json` regulares dentro da raiz do agente; symlinks e caminhos fora da raiz são ignorados.

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

Execute a manutenção agora (em vez de esperar pelo próximo ciclo de escrita):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` usa as configurações `session.maintenance` da configuração:

- Observação de escopo: `openclaw sessions cleanup` mantém armazenamentos de sessão, transcrições e sidecars de trajetória. Ele não remove histórico de execuções de Cron, que é gerenciado por `cron.runLog.keepLines` em [Configuração de Cron](/pt-BR/automation/cron-jobs#configuration) e explicado em [Manutenção de Cron](/pt-BR/automation/cron-jobs#maintenance).
- A limpeza também remove transcrições primárias não referenciadas, pontos de verificação de Compaction e sidecars de trajetória mais antigos que `session.maintenance.pruneAfter`; arquivos ainda referenciados por `sessions.json` são preservados.
- A limpeza relata separadamente a limpeza de sondas de execução de modelo de Gateway de curta duração como `modelRunPruned`. Isso corresponde apenas a chaves explícitas estritas no formato `agent:*:explicit:model-run-<uuid>`. A retenção fixa é `24h`, mas ela é condicionada à pressão: remove linhas obsoletas de sonda somente quando a manutenção/pressão de limite de entradas de sessão é atingida. Quando executada, a limpeza de execuções de modelo acontece antes da limpeza global de itens obsoletos e da limitação.

- `--dry-run`: pré-visualiza quantas entradas seriam removidas/limitadas sem escrever.
  - No modo de texto, a simulação imprime uma tabela de ações por sessão (`Action`, `Key`, `Age`, `Model`, `Flags`) mais um resumo agrupado por rótulo de sessão para que você possa ver o que seria mantido versus removido.
- `--enforce`: aplica a manutenção mesmo quando `session.maintenance.mode` é `warn`.
- `--fix-missing`: remove entradas cujos arquivos de transcrição estão ausentes ou têm somente cabeçalho/estão vazios, mesmo que elas ainda não fossem normalmente removidas por idade/contagem.
- `--fix-dm-scope`: quando `session.dmScope` é `main`, aposenta linhas obsoletas de DM direto com chave por par deixadas por roteamentos anteriores `per-peer`, `per-channel-peer` ou `per-account-channel-peer`. Use `--dry-run` primeiro; aplicar a limpeza remove essas linhas de `sessions.json` e preserva suas transcrições como arquivos excluídos.
- `--active-key <key>`: protege uma chave ativa específica contra despejo por orçamento de disco. Ponteiros duráveis de conversas externas, como sessões de grupo e sessões de chat com escopo de thread, também são mantidos pela manutenção de idade/contagem/orçamento de disco.
- `--agent <id>`: executa a limpeza para um armazenamento de agente configurado.
- `--all-agents`: executa a limpeza para todos os armazenamentos de agentes configurados.
- `--store <path>`: executa contra um arquivo `sessions.json` específico.
- `--json`: imprime um resumo JSON. Com `--all-agents`, a saída inclui um resumo por armazenamento.

Quando um Gateway está acessível, a limpeza sem simulação para armazenamentos de agentes configurados é enviada pelo Gateway para que compartilhe o mesmo gravador de armazenamento de sessão do tráfego em tempo de execução. Use `--store <path>` para reparo offline explícito de um arquivo de armazenamento.

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

Recupere orçamento de contexto para uma sessão travada ou grande demais. `openclaw sessions compact <key>` é o wrapper de primeira classe em torno do RPC de Gateway `sessions.compact` e exige um Gateway em execução.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Sem `--max-lines`, o Gateway resume a transcrição usando LLM. A CLI não impõe um prazo de cliente por padrão; o Gateway é dono do ciclo de vida de Compaction configurado.
- Com `--max-lines <n>`, ele trunca para as últimas `n` linhas da transcrição e arquiva a transcrição anterior como um sidecar `.bak`.
- `--agent <id>`: agente proprietário da sessão; obrigatório para chaves `global`.
- `--url` / `--token` / `--password`: substituições de conexão do Gateway.
- `--timeout <ms>`: tempo limite RPC opcional do lado do cliente em milissegundos.
- `--json`: imprime a carga RPC bruta.

O comando sai com status diferente de zero quando o Gateway relata falha na Compaction ou está inacessível, para que crons e scripts nunca confundam uma operação silenciosa sem efeito com sucesso.

> Observação: `openclaw agent --message '/compact ...'` **não** é um caminho de Compaction. Comandos de barra da CLI são rejeitados pela verificação de remetente autorizado; essa invocação sai com status diferente de zero com orientação apontando para cá em vez de silenciosamente não fazer nada.

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` aceita:

| Campo      | Tipo        | Obrigatório | Descrição                                                |
| ---------- | ----------- | ----------- | -------------------------------------------------------- |
| `key`      | string      | sim         | Chave de sessão para compactar (por exemplo `agent:main:main`). |
| `agentId`  | string      | não         | ID do agente proprietário da sessão (para chaves `global`). |
| `maxLines` | inteiro ≥ 1 | não         | Trunca para as últimas N linhas em vez de resumir com LLM. |

Exemplo de resposta de resumo por LLM:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Exemplo de resposta de truncamento (`--max-lines 200`):

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## Relacionado

- Configuração de sessão: [Referência de configuração](/pt-BR/gateway/config-agents#session)
- [Referência da CLI](/pt-BR/cli)
- [Gerenciamento de sessão](/pt-BR/concepts/session)
