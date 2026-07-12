---
read_when:
    - Regolazione del comportamento dell'overlay vocale
summary: Ciclo di vita dell’overlay vocale quando la parola di attivazione e la modalità push-to-talk si sovrappongono
title: Overlay vocale
x-i18n:
    generated_at: "2026-07-12T07:14:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# Ciclo di vita dell'overlay vocale (macOS)

Destinatari: collaboratori dell'app macOS. Obiettivo: mantenere prevedibile l'overlay vocale quando la parola di attivazione e la modalità premi per parlare si sovrappongono.

## Comportamento

- Se l'overlay è già visibile per via della parola di attivazione e l'utente preme il tasto di scelta rapida, la sessione del tasto di scelta rapida acquisisce il testo esistente anziché reimpostarlo. L'overlay rimane visibile finché il tasto viene tenuto premuto. Al rilascio: invia se è presente del testo senza spazi iniziali o finali, altrimenti chiude.
- La sola parola di attivazione continua a eseguire l'invio automatico in caso di silenzio; la modalità premi per parlare invia immediatamente al rilascio.

## Implementazione

- `VoiceSessionCoordinator` (`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`) è l'unico proprietario della sessione vocale attiva. È un singleton `@MainActor @Observable`, non un actor. API: `startSession`, `updatePartial`, `finalize`, `sendNow`, `dismiss`, `updateLevel`, `snapshot`. Ogni sessione contiene un token `UUID`; le chiamate con un token obsoleto o non corrispondente vengono ignorate.
- `VoiceWakeOverlayController` (`VoiceWakeOverlayController+Session.swift`) visualizza l'overlay e inoltra le azioni dell'utente (`requestSend`, `dismiss`) al coordinatore tramite il token della sessione. Non gestisce mai direttamente lo stato della sessione.
- La modalità premi per parlare (`VoicePushToTalk.begin()`) acquisisce qualsiasi testo visibile nell'overlay come `adoptedPrefix` (tramite `VoiceSessionCoordinator.shared.snapshot()`), in modo che la pressione del tasto di scelta rapida mentre l'overlay di attivazione è visibile mantenga il testo e aggiunga il nuovo parlato. Al rilascio, attende fino a 1,5 secondi una trascrizione finale prima di ripiegare sul testo corrente.
- Durante `dismiss`, l'overlay chiama `VoiceSessionCoordinator.overlayDidDismiss`, che attiva `VoiceWakeRuntime.refresh(state:)` affinché la chiusura manuale tramite X, la chiusura dovuta a testo vuoto e quella successiva all'invio riprendano tutte l'ascolto della parola di attivazione.
- Percorso di invio unificato: se il testo senza spazi iniziali o finali è vuoto, chiude; altrimenti `sendNow` riproduce una sola volta il segnale acustico di invio, inoltra tramite `VoiceWakeForwarder`, quindi chiude.

## Registrazione

Il sottosistema vocale è `ai.openclaw`; ogni componente registra gli eventi nella propria categoria:

| Categoria               | Componente                                      |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | Tasto di scelta rapida e acquisizione della modalità premi per parlare |
| `voicewake.runtime`     | Runtime della parola di attivazione             |
| `voicewake.chime`       | Riproduzione del segnale acustico               |
| `voicewake.sync`        | Sincronizzazione delle impostazioni globali     |
| `voicewake.forward`     | Inoltro della trascrizione                      |
| `voicewake.meter`       | Monitoraggio del livello del microfono          |

## Elenco di controllo per il debug

- Visualizza il flusso dei log mentre riproduci un overlay che rimane bloccato:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Verifica che sia attivo un solo token di sessione; i callback obsoleti vengono ignorati dal coordinatore.
- Verifica che il rilascio della modalità premi per parlare chiami sempre `end()` con il token attivo; se il testo è vuoto, è prevista la chiusura senza segnale acustico né invio.

## Contenuti correlati

- [App macOS](/it/platforms/macos)
- [Attivazione vocale (macOS)](/it/platforms/mac/voicewake)
- [Modalità conversazione](/it/nodes/talk)
