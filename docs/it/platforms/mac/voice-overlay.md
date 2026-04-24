---
read_when:
    - Regolazione del comportamento dell'overlay vocale
summary: Ciclo di vita dell'overlay vocale quando la wake-word e il push-to-talk si sovrappongono
title: Overlay vocale
x-i18n:
    generated_at: "2026-04-24T08:50:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ae98afad57dffe73e2c878eef4f3253e4464d68cadf531e9239b017cc160f28
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# Ciclo di vita dell'overlay vocale (macOS)

Pubblico: contributori dell'app macOS. Obiettivo: mantenere prevedibile l'overlay vocale quando wake-word e push-to-talk si sovrappongono.

## Intento attuale

- Se l'overlay è già visibile per via della wake-word e l'utente preme l'hotkey, la sessione dell'hotkey _adotta_ il testo esistente invece di reimpostarlo. L'overlay resta visibile finché l'hotkey è tenuta premuta. Quando l'utente rilascia: invia se c'è testo ripulito, altrimenti chiude.
- La sola wake-word continua a inviare automaticamente sul silenzio; il push-to-talk invia immediatamente al rilascio.

## Implementato (9 dicembre 2025)

- Le sessioni dell'overlay ora portano un token per ogni acquisizione (wake-word o push-to-talk). Gli aggiornamenti partial/final/send/dismiss/level vengono scartati quando il token non corrisponde, evitando callback obsolete.
- Il push-to-talk adotta qualsiasi testo dell'overlay visibile come prefisso (quindi premere l'hotkey mentre l'overlay wake è visibile mantiene il testo e aggiunge il nuovo parlato). Attende fino a 1,5s per una trascrizione finale prima di usare come fallback il testo corrente.
- Il logging di chime/overlay viene emesso a livello `info` nelle categorie `voicewake.overlay`, `voicewake.ptt` e `voicewake.chime` (avvio sessione, partial, final, send, dismiss, motivo del chime).

## Prossimi passi

1. **VoiceSessionCoordinator (actor)**
   - Possiede esattamente una `VoiceSession` alla volta.
   - API (basata su token): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Scarta le callback che trasportano token obsoleti (impedisce ai recognizer vecchi di riaprire l'overlay).
2. **VoiceSession (model)**
   - Campi: `token`, `source` (wakeWord|pushToTalk), testo committed/volatile, flag del chime, timer (auto-send, idle), `overlayMode` (display|editing|sending), scadenza del cooldown.
3. **Binding dell'overlay**
   - `VoiceSessionPublisher` (`ObservableObject`) replica la sessione attiva in SwiftUI.
   - `VoiceWakeOverlayView` esegue il rendering solo tramite il publisher; non muta mai direttamente singleton globali.
   - Le azioni utente dell'overlay (`sendNow`, `dismiss`, `edit`) richiamano il coordinator con il token della sessione.
4. **Percorso di invio unificato**
   - Su `endCapture`: se il testo ripulito è vuoto → chiude; altrimenti `performSend(session:)` (riproduce il chime di invio una sola volta, inoltra, chiude).
   - Push-to-talk: nessun ritardo; wake-word: ritardo facoltativo per l'auto-invio.
   - Applica un breve cooldown al runtime wake dopo la fine del push-to-talk così la wake-word non si riattiva immediatamente.
5. **Logging**
   - Il coordinator emette log `.info` nel subsystem `ai.openclaw`, categorie `voicewake.overlay` e `voicewake.chime`.
   - Eventi chiave: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Checklist di debug

- Trasmetti i log mentre riproduci un overlay bloccato:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Verifica che esista un solo token di sessione attivo; le callback obsolete dovrebbero essere scartate dal coordinator.
- Assicurati che il rilascio del push-to-talk chiami sempre `endCapture` con il token attivo; se il testo è vuoto, aspettati `dismiss` senza chime né invio.

## Passi di migrazione (suggeriti)

1. Aggiungi `VoiceSessionCoordinator`, `VoiceSession` e `VoiceSessionPublisher`.
2. Refattorizza `VoiceWakeRuntime` in modo che crei/aggiorni/termini sessioni invece di toccare direttamente `VoiceWakeOverlayController`.
3. Refattorizza `VoicePushToTalk` in modo che adotti le sessioni esistenti e chiami `endCapture` al rilascio; applica il cooldown del runtime.
4. Collega `VoiceWakeOverlayController` al publisher; rimuovi le chiamate dirette da runtime/PTT.
5. Aggiungi test di integrazione per adozione della sessione, cooldown e chiusura con testo vuoto.

## Correlati

- [App macOS](/it/platforms/macos)
- [Voice wake (macOS)](/it/platforms/mac/voicewake)
- [Modalità talk](/it/nodes/talk)
