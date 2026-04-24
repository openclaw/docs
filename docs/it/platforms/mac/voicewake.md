---
read_when:
    - Lavorare sui percorsi di attivazione vocale o PTT
summary: Modalità di attivazione vocale e push-to-talk, più dettagli di instradamento nell’app Mac
title: Attivazione vocale (macOS)
x-i18n:
    generated_at: "2026-04-24T08:50:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0273c24764f0baf440a19f31435d6ee62ab040c1ec5a97d7733d3ec8b81b0641
    source_path: platforms/mac/voicewake.md
    workflow: 15
---

# Attivazione vocale & Push-to-Talk

## Modalità

- **Modalità wake word** (predefinita): il riconoscitore vocale sempre attivo attende i token trigger (`swabbleTriggerWords`). Alla corrispondenza avvia la cattura, mostra l’overlay con testo parziale e invia automaticamente dopo il silenzio.
- **Push-to-talk (tenere premuto Right Option)**: tieni premuto il tasto Option destro per catturare immediatamente—non serve alcun trigger. L’overlay appare mentre il tasto è premuto; al rilascio finalizza e inoltra dopo un breve ritardo così puoi ritoccare il testo.

## Comportamento runtime (wake word)

- Il riconoscitore vocale vive in `VoiceWakeRuntime`.
- Il trigger si attiva solo quando c’è una **pausa significativa** tra la wake word e la parola successiva (~0,55 s di intervallo). L’overlay/il segnale acustico può iniziare durante la pausa anche prima che il comando cominci.
- Finestre di silenzio: 2,0 s quando il parlato scorre, 5,0 s se è stato sentito solo il trigger.
- Stop rigido: 120 s per evitare sessioni fuori controllo.
- Debounce tra sessioni: 350 ms.
- L’overlay è gestito tramite `VoiceWakeOverlayController` con colorazione committed/volatile.
- Dopo l’invio, il riconoscitore si riavvia in modo pulito per ascoltare il trigger successivo.

## Invarianti del ciclo di vita

- Se Voice Wake è abilitato e i permessi sono concessi, il riconoscitore wake word dovrebbe essere in ascolto (tranne durante una cattura push-to-talk esplicita).
- La visibilità dell’overlay (inclusa la chiusura manuale tramite il pulsante X) non deve mai impedire la ripresa del riconoscitore.

## Modalità di guasto dell’overlay bloccato (precedente)

In precedenza, se l’overlay restava bloccato visibile e lo chiudevi manualmente, Voice Wake poteva sembrare “morto” perché il tentativo di riavvio del runtime poteva essere bloccato dalla visibilità dell’overlay e nessun riavvio successivo veniva pianificato.

Hardening:

- Il riavvio del runtime wake non è più bloccato dalla visibilità dell’overlay.
- Il completamento della chiusura dell’overlay attiva un `VoiceWakeRuntime.refresh(...)` tramite `VoiceSessionCoordinator`, quindi la chiusura manuale con X riprende sempre l’ascolto.

## Dettagli specifici del push-to-talk

- Il rilevamento della hotkey usa un monitor globale `.flagsChanged` per **Right Option** (`keyCode 61` + `.option`). Osserviamo solo gli eventi (senza bloccarli).
- La pipeline di cattura vive in `VoicePushToTalk`: avvia immediatamente Speech, invia i parziali all’overlay e chiama `VoiceWakeForwarder` al rilascio.
- Quando il push-to-talk inizia, mettiamo in pausa il runtime wake word per evitare tap audio in conflitto; si riavvia automaticamente dopo il rilascio.
- Permessi: richiede Microfono + Speech; per vedere gli eventi serve l’autorizzazione Accessibility/Input Monitoring.
- Tastiere esterne: alcune potrebbero non esporre Right Option come previsto—offri una scorciatoia di fallback se gli utenti segnalano mancate rilevazioni.

## Impostazioni rivolte all’utente

- Toggle **Voice Wake**: abilita il runtime wake word.
- **Hold Cmd+Fn to talk**: abilita il monitor push-to-talk. Disabilitato su macOS < 26.
- Selettori lingua e microfono, indicatore live del livello, tabella parole trigger, tester (solo locale; non inoltra).
- Il selettore microfono conserva l’ultima selezione se un dispositivo si disconnette, mostra un suggerimento di disconnessione e usa temporaneamente come fallback il dispositivo predefinito di sistema finché non ritorna.
- **Sounds**: segnali acustici al rilevamento del trigger e all’invio; il valore predefinito è il suono di sistema macOS “Glass”. Puoi scegliere qualsiasi file caricabile da `NSSound` (es. MP3/WAV/AIFF) per ciascun evento oppure scegliere **No Sound**.

## Comportamento dell’inoltro

- Quando Voice Wake è abilitato, le trascrizioni vengono inoltrate al gateway/agente attivo (la stessa modalità locale o remota usata dal resto dell’app Mac).
- Le risposte vengono consegnate all’**ultimo provider principale usato** (WhatsApp/Telegram/Discord/WebChat). Se la consegna fallisce, l’errore viene registrato nei log e l’esecuzione resta comunque visibile tramite WebChat/log della sessione.

## Payload di inoltro

- `VoiceWakeForwarder.prefixedTranscript(_:)` antepone il suggerimento macchina prima dell’invio. Condiviso tra i percorsi wake word e push-to-talk.

## Verifica rapida

- Attiva il push-to-talk, tieni premuto Cmd+Fn, parla, rilascia: l’overlay dovrebbe mostrare i parziali e poi inviare.
- Durante la pressione, le orecchie della barra dei menu dovrebbero restare ingrandite (usa `triggerVoiceEars(ttl:nil)`); si riducono dopo il rilascio.

## Correlati

- [Voice wake](/it/nodes/voicewake)
- [Voice overlay](/it/platforms/mac/voice-overlay)
- [App macOS](/it/platforms/macos)
