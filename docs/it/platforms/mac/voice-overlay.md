---
read_when:
    - Regolazione del comportamento dell'overlay vocale
summary: Ciclo di vita dell'overlay vocale quando wake-word e push-to-talk si sovrappongono
title: Overlay vocale
x-i18n:
    generated_at: "2026-04-05T13:58:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1efcc26ec05d2f421cb2cf462077d002381995b338d00db77d5fdba9b8d938b6
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# Ciclo di vita dell'overlay vocale (macOS)

Pubblico: collaboratori dell'app macOS. Obiettivo: mantenere prevedibile l'overlay vocale quando wake-word e push-to-talk si sovrappongono.

## Intento attuale

- Se l'overlay è già visibile a causa della wake-word e l'utente preme il tasto rapido, la sessione del tasto rapido _adotta_ il testo esistente invece di reimpostarlo. L'overlay rimane visibile finché il tasto rapido è premuto. Quando l'utente rilascia: invia se c'è testo ripulito, altrimenti chiude.
- La sola wake-word continua comunque a inviare automaticamente al silenzio; push-to-talk invia immediatamente al rilascio.

## Implementato (9 dicembre 2025)

- Le sessioni dell'overlay ora trasportano un token per ogni acquisizione (wake-word o push-to-talk). Gli aggiornamenti partial/final/send/dismiss/level vengono scartati quando il token non corrisponde, evitando callback obsolete.
- Push-to-talk adotta qualsiasi testo dell'overlay visibile come prefisso (quindi premere il tasto rapido mentre l'overlay wake è attivo mantiene il testo e aggiunge il nuovo parlato). Attende fino a 1,5 s per una trascrizione finale prima di ripiegare sul testo corrente.
- Il logging di chime/overlay viene emesso a livello `info` nelle categorie `voicewake.overlay`, `voicewake.ptt` e `voicewake.chime` (avvio sessione, partial, final, send, dismiss, motivo del chime).

## Prossimi passi

1. **VoiceSessionCoordinator (actor)**
   - Gestisce esattamente una `VoiceSession` alla volta.
   - API (basata su token): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Scarta le callback che trasportano token obsoleti (impedisce ai vecchi recognizer di riaprire l'overlay).
2. **VoiceSession (modello)**
   - Campi: `token`, `source` (wakeWord|pushToTalk), testo committed/volatile, flag chime, timer (auto-send, idle), `overlayMode` (display|editing|sending), scadenza del cooldown.
3. **Binding dell'overlay**
   - `VoiceSessionPublisher` (`ObservableObject`) rispecchia la sessione attiva in SwiftUI.
   - `VoiceWakeOverlayView` esegue il rendering solo tramite il publisher; non modifica mai direttamente singleton globali.
   - Le azioni utente dell'overlay (`sendNow`, `dismiss`, `edit`) richiamano il coordinator con il token della sessione.
4. **Percorso di invio unificato**
   - In `endCapture`: se il testo ripulito è vuoto → chiudi; altrimenti `performSend(session:)` (riproduce una sola volta il chime di invio, inoltra, chiude).
   - Push-to-talk: nessun ritardo; wake-word: ritardo facoltativo per l'invio automatico.
   - Applica un breve cooldown al runtime wake dopo la fine di push-to-talk così la wake-word non si riattiva immediatamente.
5. **Logging**
   - Il coordinator emette log `.info` nel sottosistema `ai.openclaw`, categorie `voicewake.overlay` e `voicewake.chime`.
   - Eventi chiave: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Checklist di debug

- Trasmetti i log durante la riproduzione di un overlay bloccato:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Verifica che ci sia un solo token di sessione attivo; le callback obsolete dovrebbero essere scartate dal coordinator.
- Assicurati che il rilascio di push-to-talk chiami sempre `endCapture` con il token attivo; se il testo è vuoto, aspettati `dismiss` senza chime né invio.

## Passaggi di migrazione (suggeriti)

1. Aggiungi `VoiceSessionCoordinator`, `VoiceSession` e `VoiceSessionPublisher`.
2. Esegui il refactor di `VoiceWakeRuntime` in modo che crei/aggiorni/termini sessioni invece di toccare direttamente `VoiceWakeOverlayController`.
3. Esegui il refactor di `VoicePushToTalk` perché adotti le sessioni esistenti e chiami `endCapture` al rilascio; applica il cooldown al runtime.
4. Collega `VoiceWakeOverlayController` al publisher; rimuovi le chiamate dirette da runtime/PTT.
5. Aggiungi test di integrazione per adozione della sessione, cooldown e chiusura con testo vuoto.
