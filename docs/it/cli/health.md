---
read_when:
    - Vuoi controllare rapidamente lo stato del Gateway in esecuzione
summary: Riferimento CLI per `openclaw health` (istantanea dello stato del Gateway tramite RPC)
title: Stato di salute
x-i18n:
    generated_at: "2026-07-12T06:55:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a26ce5ade9ab56c9751c3dde814c38a1e01e74d91c2fd57e56d3c44ca529d0d8
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Recupera un'istantanea dello stato di integrità dal Gateway in esecuzione tramite RPC WebSocket (senza socket diretti dei canali dalla CLI).

## Opzioni

| Flag             | Valore predefinito | Descrizione                                                                                                                    |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `--json`         | `false`             | Stampa JSON leggibile dalla macchina anziché testo.                                                                            |
| `--timeout <ms>` | `10000`             | Timeout della connessione in millisecondi.                                                                                      |
| `--verbose`      | `false`             | Forza una verifica in tempo reale ed espande l'output includendo tutti gli account e gli agenti configurati.                   |
| `--debug`        | `false`             | Alias di `--verbose`.                                                                                                           |

Esempi:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

## Comportamento

- Senza `--verbose`, il Gateway può restituire un'istantanea memorizzata nella cache (aggiornata da non più di 60 secondi e invariata rispetto allo stato di esecuzione in tempo reale dei canali) e aggiornarla in background per il chiamante successivo.
- `--verbose` forza una verifica in tempo reale (verifiche degli account per ciascun canale), stampa i dettagli della connessione al Gateway ed espande l'output leggibile includendo tutti gli account e gli agenti configurati anziché il solo agente predefinito.
- `--json` restituisce sempre l'istantanea completa: canali, verifiche per account, stato di caricamento dei plugin, stato di quarantena del motore di contesto, stato della cache dei prezzi dei modelli, integrità del ciclo degli eventi e archivi delle sessioni per agente.

## Argomenti correlati

- [Riferimento della CLI](/it/cli)
- [`openclaw status`](/it/cli/status) — diagnostica locale e verifiche dei canali senza un'istantanea completa dello stato di integrità
- [Stato di integrità del Gateway](/it/gateway/health)
