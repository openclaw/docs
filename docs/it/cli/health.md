---
read_when:
    - Vuoi controllare rapidamente lo stato del Gateway in esecuzione
summary: Riferimento CLI per `openclaw health` (snapshot di integrità del Gateway tramite RPC)
title: Integrità
x-i18n:
    generated_at: "2026-05-10T19:28:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26be7bbbf75c2eca1213fe145fdeeab6fee96798dff457278ac69a20145bf75d
    source_path: cli/health.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw health`

Recupera lo stato di salute dal Gateway in esecuzione.

## Opzioni

| Opzione          | Predefinito | Descrizione                                                                     |
| ---------------- | ----------- | ------------------------------------------------------------------------------- |
| `--json`         | `false`     | Stampa JSON leggibile da macchina invece di testo.                              |
| `--timeout <ms>` | `10000`     | Timeout di connessione in millisecondi.                                         |
| `--verbose`      | `false`     | Logging dettagliato. Forza una verifica live ed espande l'output per agent.     |
| `--debug`        | `false`     | Alias di `--verbose`.                                                           |

Esempi:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Note:

- `openclaw health` predefinito richiede al Gateway in esecuzione la sua istantanea dello stato di salute. Quando il
  Gateway ha già un'istantanea memorizzata nella cache e recente, può restituire quel payload in cache e
  aggiornarsi in background.
- `--verbose` forza una verifica live, stampa i dettagli di connessione del Gateway ed espande l'
  output leggibile dall'uomo su tutti gli account e gli agent configurati.
- L'output include gli archivi di sessione per agent quando sono configurati più agent.

## Correlati

- [Riferimento CLI](/it/cli)
- [Stato di salute del Gateway](/it/gateway/health)
