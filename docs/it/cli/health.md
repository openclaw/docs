---
read_when:
    - Vuoi verificare rapidamente lo stato del Gateway in esecuzione
summary: Riferimento CLI per `openclaw health` (snapshot dello stato di integrità del Gateway tramite RPC)
title: Integrità
x-i18n:
    generated_at: "2026-05-06T08:42:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 443684af04efce2c54a6679e13b0bff0a5c1869f85d60fae0e853aed0a362226
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Recupera lo stato di integrità dal Gateway in esecuzione.

Opzioni:

- `--json`: risultato leggibile da macchine
- `--timeout <ms>`: timeout di connessione in millisecondi (predefinito `10000`)
- `--verbose`: registrazione dettagliata
- `--debug`: nome alternativo per `--verbose`

Esempi:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Note:

- Per impostazione predefinita, `openclaw health` richiede al Gateway in esecuzione la sua istantanea dello stato di integrità. Quando il
  Gateway dispone già di un’istantanea memorizzata nella cache e recente, può restituire quel contenuto memorizzato nella cache e
  aggiornarsi in background.
- `--verbose` forza una verifica in tempo reale, stampa i dettagli di connessione del Gateway ed espande il
  risultato leggibile da persone in tutti gli account e agenti configurati.
- Il risultato include gli archivi di sessione per agente quando sono configurati più agenti.

## Correlati

- [Riferimento CLI](/it/cli)
- [Stato di integrità del Gateway](/it/gateway/health)
