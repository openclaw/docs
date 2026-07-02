---
read_when:
    - Vuoi che Claude Code usi gli strumenti MCP di OpenClaw Gateway
    - È necessaria un'autorizzazione MCP temporanea vincolata alla sessione per un harness esterno
summary: Riferimento CLI per `openclaw attach` (avvia Claude Code con una concessione MCP Gateway con ambito)
title: Collega la CLI
x-i18n:
    generated_at: "2026-07-02T00:59:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1445c9bbf28e5365d070f69bf8f53e249d70ac6e8690ed68831404d041e41e86
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` avvia Claude Code con una configurazione MCP temporanea rigorosa associata
a una sessione Gateway.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Opzioni:

- `--session <key>` associa l'autorizzazione a una sessione Gateway. Il valore predefinito è la sessione principale.
- `--ttl <ms>` richiede un TTL positivo dell'autorizzazione in millisecondi. Il Gateway applica il proprio limite massimo.
- `--bin <path>` seleziona il binario Claude Code. Il valore predefinito è `claude`.
- `--print-config` scrive il file temporaneo `.mcp.json`, stampa il comando di avvio e l'ambiente, e mantiene attiva l'autorizzazione fino alla scadenza del TTL.

Il token bearer viene passato tramite variabili d'ambiente, non tramite argv. OpenClaw
avvia Claude Code con `--strict-mcp-config --mcp-config <path>` in modo che i
server MCP Claude dell'ambiente non si uniscano alla sessione collegata. Gli avvii normali revocano
l'autorizzazione quando il processo Claude Code termina.

Vedi anche: [CLI Gateway](/it/cli/gateway), [CLI MCP](/it/cli/mcp) e [CLI ACP](/it/cli/acp).
