---
read_when:
    - Debug degli indicatori di stato dell'app per Mac
summary: Come l'app macOS segnala gli stati di integrità del Gateway e dei canali
title: Controlli di integrità (macOS)
x-i18n:
    generated_at: "2026-07-12T07:13:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a086c527796dbe453bdee1cc9cbe1e0fc1157de710c8c6de186411fe9aa3bc7b
    source_path: platforms/mac/health.md
    workflow: 16
---

# Controlli di integrità su macOS

Come leggere lo stato di integrità del canale collegato dall'app nella barra dei menu.

## Barra dei menu

Indicatore di stato:

- Verde: collegato e verifica riuscita.
- Arancione: collegato, ma la verifica di un canale segnala uno stato degradato o non connesso.
- Rosso: non ancora collegato.

La riga secondaria mostra "collegato · autenticazione 12 min" oppure il motivo dell'errore.
"Run Health Check Now" nel menu avvia una verifica su richiesta.

## Impostazioni

- La scheda General mostra una scheda di integrità: indicatore di stato, riga di riepilogo (stato del collegamento +
  durata dell'autenticazione) e una riga facoltativa con i dettagli dell'errore, con i pulsanti **Retry now** e
  **Open logs**.
- La **scheda Channels** mostra lo stato e i controlli di ciascun canale (codice QR di accesso,
  disconnessione, verifica, ultima disconnessione/ultimo errore) per WhatsApp e Telegram.

## Funzionamento della verifica

L'app chiama l'RPC `health` del Gateway tramite la connessione WebSocket
esistente (senza avviare una shell CLI) ogni ~60 secondi e su richiesta. L'RPC carica
le credenziali e segnala lo stato senza inviare messaggi. L'app memorizza nella cache separatamente l'ultima
istantanea valida e l'ultimo errore, in modo che l'interfaccia si carichi immediatamente e
non presenti sfarfallii quando è offline.

## In caso di dubbi

Utilizza la procedura CLI descritta in [Integrità del Gateway](/it/gateway/health) (`openclaw status`,
`openclaw status --deep`, `openclaw health --json`) e monitora
`/tmp/openclaw/openclaw-*.log`, filtrando per `web-heartbeat` / `web-reconnect`.

## Contenuti correlati

- [Integrità del Gateway](/it/gateway/health)
- [App macOS](/it/platforms/macos)
