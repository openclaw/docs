---
read_when:
    - Eseguire il debug degli indicatori di salute dell’app Macോസ
summary: Come l’app macOS segnala gli stati di salute di gateway/Baileys
title: Controlli di salute (macOS)
x-i18n:
    generated_at: "2026-04-24T08:50:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7488b39b0eec013083f52e2798d719bec35780acad743a97f5646a6891810e5
    source_path: platforms/mac/health.md
    workflow: 15
---

# Controlli di salute su macOS

Come vedere se il canale collegato è in salute dall’app nella barra dei menu.

## Barra dei menu

- Il punto di stato ora riflette la salute di Baileys:
  - Verde: collegato + socket aperto di recente.
  - Arancione: connessione/riprova in corso.
  - Rosso: disconnesso o probe fallito.
- La riga secondaria mostra "linked · auth 12m" oppure il motivo del fallimento.
- La voce di menu "Run Health Check" attiva un probe su richiesta.

## Impostazioni

- La scheda General aggiunge una card Health che mostra: età dell’autenticazione collegata, percorso/conteggio dell’archivio sessioni, ora dell’ultimo controllo, ultimo errore/codice di stato e pulsanti per Run Health Check / Reveal Logs.
- Usa uno snapshot in cache così l’interfaccia si carica istantaneamente e usa un fallback in modo elegante quando è offline.
- La **scheda Channels** mostra stato del canale + controlli per WhatsApp/Telegram (QR di login, logout, probe, ultima disconnessione/errore).

## Come funziona il probe

- L’app esegue `openclaw health --json` tramite `ShellExecutor` circa ogni 60 s e su richiesta. Il probe carica le credenziali e segnala lo stato senza inviare messaggi.
- Memorizza in cache separatamente l’ultimo snapshot valido e l’ultimo errore per evitare sfarfallii; mostra il timestamp di ciascuno.

## In caso di dubbi

- Puoi comunque usare il flusso CLI in [Salute del Gateway](/it/gateway/health) (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) e seguire `/tmp/openclaw/openclaw-*.log` per `web-heartbeat` / `web-reconnect`.

## Correlati

- [Salute del Gateway](/it/gateway/health)
- [App macOS](/it/platforms/macos)
