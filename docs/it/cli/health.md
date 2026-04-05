---
read_when:
    - Vuoi controllare rapidamente l'integrità del Gateway in esecuzione
summary: Riferimento CLI per `openclaw health` (snapshot di integrità del gateway tramite RPC)
title: health
x-i18n:
    generated_at: "2026-04-05T13:47:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ed2b9ceefee6159cabaae9172d2d88174626456e7503d5d2bcd142634188ff0
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

Recupera lo stato di integrità dal Gateway in esecuzione.

Opzioni:

- `--json`: output leggibile da macchina
- `--timeout <ms>`: timeout di connessione in millisecondi (predefinito `10000`)
- `--verbose`: logging dettagliato
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

- Per impostazione predefinita, `openclaw health` chiede al gateway in esecuzione il suo snapshot di integrità. Quando il
  gateway ha già uno snapshot in cache aggiornato, può restituire quel payload in cache e
  aggiornare in background.
- `--verbose` forza una probe live, stampa i dettagli di connessione del gateway ed espande l'
  output leggibile da umani per includere tutti gli account e gli agenti configurati.
- L'output include gli store di sessione per agente quando sono configurati più agenti.
