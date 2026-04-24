---
read_when:
    - Ospitare PeekabooBridge in OpenClaw.app
    - Integrare Peekaboo tramite Swift Package Manager
    - Modificare protocollo/percorsi di PeekabooBridge
summary: Integrazione PeekabooBridge per l'automazione UI su macOS
title: Bridge Peekaboo
x-i18n:
    generated_at: "2026-04-24T08:50:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3646f66551645733292fb183e0ff2c56697e7b24248ff7c32a0dc925431f6ba7
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

OpenClaw può ospitare **PeekabooBridge** come broker locale di automazione UI consapevole dei permessi.
Questo consente alla CLI `peekaboo` di pilotare l'automazione UI riutilizzando i permessi TCC
dell'app macOS.

## Cosa è (e cosa non è)

- **Host**: OpenClaw.app può agire come host PeekabooBridge.
- **Client**: usa la CLI `peekaboo` (nessuna superficie separata `openclaw ui ...`).
- **UI**: gli overlay visivi restano in Peekaboo.app; OpenClaw è un host broker sottile.

## Abilitare il bridge

Nell'app macOS:

- Impostazioni → **Abilita Peekaboo Bridge**

Quando è abilitato, OpenClaw avvia un server socket UNIX locale. Se disabilitato, l'host
viene fermato e `peekaboo` ripiega su altri host disponibili.

## Ordine di discovery del client

I client Peekaboo in genere provano gli host in questo ordine:

1. Peekaboo.app (UX completa)
2. Claude.app (se installata)
3. OpenClaw.app (broker sottile)

Usa `peekaboo bridge status --verbose` per vedere quale host è attivo e quale
percorso socket è in uso. Puoi sovrascriverlo con:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Sicurezza e permessi

- Il bridge valida le **firme del codice del chiamante**; viene applicata una allowlist di TeamID
  (TeamID dell'host Peekaboo + TeamID dell'app OpenClaw).
- Le richieste vanno in timeout dopo ~10 secondi.
- Se mancano i permessi richiesti, il bridge restituisce un chiaro messaggio di errore
  invece di avviare Impostazioni di Sistema.

## Comportamento degli snapshot (automazione)

Gli snapshot vengono memorizzati in memoria e scadono automaticamente dopo una breve finestra.
Se hai bisogno di una conservazione più lunga, acquisiscili di nuovo dal client.

## Risoluzione dei problemi

- Se `peekaboo` segnala “bridge client is not authorized”, assicurati che il client sia
  correttamente firmato oppure esegui l'host con `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  **solo** in modalità di debug.
- Se non viene trovato alcun host, apri una delle app host (Peekaboo.app o OpenClaw.app)
  e conferma che i permessi siano concessi.

## Correlati

- [app macOS](/it/platforms/macos)
- [Permessi macOS](/it/platforms/mac/permissions)
