---
read_when:
    - Vuoi controllare rapidamente lo stato di salute del Gateway in esecuzione
summary: Riferimento CLI per `openclaw health` (istantanea dello stato di salute del gateway tramite RPC)
title: Salute
x-i18n:
    generated_at: "2026-04-24T08:33:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf5f5b9c3ec5c08090134764966d2657241ed0ebbd28a9dc7fafde0b8c7216d6
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

Recupera lo stato di salute dal Gateway in esecuzione.

Opzioni:

- `--json`: output leggibile da macchina
- `--timeout <ms>`: timeout di connessione in millisecondi (predefinito `10000`)
- `--verbose`: log dettagliati
- `--debug`: alias di `--verbose`

Esempi:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Note:

- Il comando predefinito `openclaw health` chiede al gateway in esecuzione la sua istantanea di stato. Quando il
  gateway ha già un'istantanea in cache aggiornata, può restituire quel payload in cache e
  aggiornarsi in background.
- `--verbose` forza un probe live, stampa i dettagli di connessione del gateway ed espande l'
  output leggibile da umani su tutti gli account e gli agenti configurati.
- L'output include gli store di sessione per agente quando sono configurati più agenti.

## Correlati

- [Riferimento CLI](/it/cli)
- [Stato di salute del gateway](/it/gateway/health)
