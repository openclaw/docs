---
read_when:
    - Vuoi che Claude Code utilizzi gli strumenti MCP del Gateway di OpenClaw
    - Ti serve un'autorizzazione MCP temporanea associata alla sessione per un harness esterno
summary: Riferimento CLI per `openclaw attach` (avvia Claude Code con un'autorizzazione MCP del Gateway ad ambito limitato)
title: Collega la CLI
x-i18n:
    generated_at: "2026-07-12T06:55:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0d8ac60724adef1439af09179806af537b8f2925f06b3715850e4dd3b83b080f
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` avvia Claude Code con una configurazione MCP temporanea rigorosa associata a una singola sessione del Gateway.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Opzioni:

- `--session <key>` associa l'autorizzazione a una sessione del Gateway. Per impostazione predefinita usa la sessione principale.
- `--ttl <ms>` richiede un TTL positivo per l'autorizzazione, espresso in millisecondi. Il Gateway applica il proprio limite massimo.
- `--bin <path>` seleziona il file binario di Claude Code. Valore predefinito: `claude`.
- `--print-config` scrive il file temporaneo `.mcp.json`, stampa il comando di avvio e le variabili di ambiente e mantiene valida l'autorizzazione fino alla scadenza del TTL (non avvia Claude Code né revoca l'autorizzazione).

Il token bearer viene passato tramite variabili di ambiente, non tramite argv. OpenClaw avvia Claude Code con `--strict-mcp-config --mcp-config <path>`, in modo che i server MCP di Claude presenti nell'ambiente non si uniscano alla sessione collegata. Gli avvii normali (senza `--print-config`) revocano l'autorizzazione quando il processo Claude Code termina.

Vedi anche: [CLI del Gateway](/it/cli/gateway), [CLI MCP](/it/cli/mcp) e [CLI ACP](/it/cli/acp).
