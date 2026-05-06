---
read_when:
    - Lavorare sui percorsi di attivazione vocale o PTT
summary: Modalità di attivazione vocale e premi per parlare, oltre ai dettagli di instradamento nell'app Mac
title: Attivazione vocale (macOS)
x-i18n:
    generated_at: "2026-05-06T09:00:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 312895b5767c447233bd77cbcd48ea81bb6c700080abc31974188b610a1b1ef0
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Risveglio vocale e Premi-per-parlare

## Modalità

- **Modalità parola di attivazione** (predefinita): il riconoscitore vocale sempre attivo attende i token di attivazione (`swabbleTriggerWords`). Quando trova una corrispondenza avvia la cattura, mostra l'overlay con il testo parziale e invia automaticamente dopo il silenzio.
- **Premi-per-parlare (tieni premuto Opzione destro)**: tieni premuto il tasto Opzione destro per catturare immediatamente, senza bisogno di attivazione. L'overlay appare mentre il tasto è premuto; il rilascio finalizza e inoltra dopo un breve ritardo, così puoi ritoccare il testo.

## Comportamento a runtime (parola di attivazione)

- Il riconoscitore vocale vive in `VoiceWakeRuntime`.
- L'attivazione scatta solo quando c'è una **pausa significativa** tra la parola di attivazione e la parola successiva (intervallo di ~0,55s). L'overlay/il suono possono avviarsi sulla pausa anche prima che il comando inizi.
- Finestre di silenzio: 2,0s quando il parlato è in corso, 5,0s se è stata sentita solo l'attivazione.
- Arresto forzato: 120s per prevenire sessioni fuori controllo.
- Debounce tra sessioni: 350ms.
- L'overlay è controllato tramite `VoiceWakeOverlayController` con colorazione committed/volatile.
- Dopo l'invio, il riconoscitore si riavvia in modo pulito per ascoltare l'attivazione successiva.

## Invarianti del ciclo di vita

- Se Risveglio vocale è abilitato e i permessi sono concessi, il riconoscitore della parola di attivazione dovrebbe essere in ascolto (tranne durante una cattura esplicita premi-per-parlare).
- La visibilità dell'overlay (inclusa la chiusura manuale tramite il pulsante X) non deve mai impedire al riconoscitore di riprendere.

## Modalità di errore dell'overlay persistente (precedente)

In precedenza, se l'overlay restava bloccato visibile e lo chiudevi manualmente, Risveglio vocale poteva sembrare "morto" perché il tentativo di riavvio del runtime poteva essere bloccato dalla visibilità dell'overlay e non veniva pianificato alcun riavvio successivo.

Irrigidimento:

- Il riavvio del runtime di risveglio non è più bloccato dalla visibilità dell'overlay.
- Il completamento della chiusura dell'overlay attiva un `VoiceWakeRuntime.refresh(...)` tramite `VoiceSessionCoordinator`, quindi la chiusura manuale con X riprende sempre l'ascolto.

## Specifiche di premi-per-parlare

- Il rilevamento della scorciatoia usa un monitor globale `.flagsChanged` per **Opzione destro** (`keyCode 61` + `.option`). Osserviamo solo gli eventi (senza intercettarli).
- La pipeline di cattura vive in `VoicePushToTalk`: avvia subito il riconoscimento vocale, trasmette i parziali all'overlay e chiama `VoiceWakeForwarder` al rilascio.
- Quando premi-per-parlare parte, mettiamo in pausa il runtime della parola di attivazione per evitare tap audio in conflitto; si riavvia automaticamente dopo il rilascio.
- Permessi: richiede Microfono + Riconoscimento vocale; per vedere gli eventi serve l'approvazione di Accessibilità/Monitoraggio input.
- Tastiere esterne: alcune potrebbero non esporre Opzione destro come previsto: offri una scorciatoia alternativa se gli utenti segnalano mancate rilevazioni.

## Impostazioni rivolte all'utente

- Interruttore **Risveglio vocale**: abilita il runtime della parola di attivazione.
- **Tieni premuto Cmd+Fn per parlare**: abilita il monitor premi-per-parlare. Disabilitato su macOS < 26.
- Selettori di lingua e microfono, misuratore di livello live, tabella delle parole di attivazione, tester (solo locale; non inoltra).
- Il selettore del microfono conserva l'ultima selezione se un dispositivo si disconnette, mostra un suggerimento di disconnessione e ripiega temporaneamente sul valore predefinito di sistema finché non ritorna.
- **Suoni**: suoni sull'individuazione dell'attivazione e sull'invio; il valore predefinito è il suono di sistema macOS "Glass". Puoi scegliere qualsiasi file caricabile da `NSSound` (ad esempio MP3/WAV/AIFF) per ciascun evento oppure scegliere **Nessun suono**.

## Comportamento di inoltro

- Quando Risveglio vocale è abilitato, le trascrizioni vengono inoltrate al gateway/agente attivo (la stessa modalità locale o remota usata dal resto dell'app Mac).
- Le risposte vengono consegnate all'**ultimo provider principale usato** (WhatsApp/Telegram/Discord/WebChat). Se la consegna non riesce, l'errore viene registrato e l'esecuzione resta comunque visibile tramite WebChat/log di sessione.

## Payload di inoltro

- `VoiceWakeForwarder.prefixedTranscript(_:)` antepone il suggerimento della macchina prima dell'invio. Condiviso tra i percorsi parola di attivazione e premi-per-parlare.

## Verifica rapida

- Attiva premi-per-parlare, tieni premuto Cmd+Fn, parla, rilascia: l'overlay dovrebbe mostrare i parziali e poi inviare.
- Mentre tieni premuto, le orecchie nella barra dei menu dovrebbero restare ingrandite (usa `triggerVoiceEars(ttl:nil)`); si riducono dopo il rilascio.

## Correlati

- [Risveglio vocale](/it/nodes/voicewake)
- [Overlay vocale](/it/platforms/mac/voice-overlay)
- [App macOS](/it/platforms/macos)
