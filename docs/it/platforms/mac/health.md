---
read_when:
    - Debug degli indicatori di salute dell'app Mac
summary: Come l'app macOS segnala gli stati di salute del gateway/Baileys
title: Controlli di salute (macOS)
x-i18n:
    generated_at: "2026-04-05T13:58:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9223b2bbe272b32526f79cf878510ac5104e788402d94a1b1627e72c5fbebf5
    source_path: platforms/mac/health.md
    workflow: 15
---

# Controlli di salute su macOS

Come verificare dall'app della barra dei menu se il canale collegato è in buona salute.

## Barra dei menu

- Il pallino di stato ora riflette la salute di Baileys:
  - Verde: collegato + socket aperto di recente.
  - Arancione: connessione/nuovi tentativi in corso.
  - Rosso: disconnesso o probe fallito.
- La riga secondaria mostra "linked · auth 12m" oppure il motivo dell'errore.
- La voce di menu "Esegui controllo di salute" attiva un probe on-demand.

## Impostazioni

- La scheda General aggiunge una card Health che mostra: età auth collegata, percorso/conteggio del session-store, ora dell'ultimo controllo, ultimo codice di errore/stato e pulsanti per Esegui controllo di salute / Mostra log.
- Usa uno snapshot in cache così la UI si carica immediatamente e ricade in modo elegante quando è offline.
- La scheda **Channels** mostra lo stato del canale + controlli per WhatsApp/Telegram (QR di login, logout, probe, ultimo disconnect/error).

## Come funziona il probe

- L'app esegue `openclaw health --json` tramite `ShellExecutor` circa ogni 60 secondi e on-demand. Il probe carica le credenziali e segnala lo stato senza inviare messaggi.
- Memorizza separatamente in cache l'ultimo snapshot valido e l'ultimo errore per evitare sfarfallii; mostra il timestamp di ciascuno.

## In caso di dubbio

- Puoi comunque usare il flusso CLI in [Salute del Gateway](/gateway/health) (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) e seguire `/tmp/openclaw/openclaw-*.log` per `web-heartbeat` / `web-reconnect`.
