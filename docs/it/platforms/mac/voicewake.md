---
read_when:
    - Stai lavorando sui percorsi di voice wake o PTT
summary: Modalità voice wake e push-to-talk più dettagli di instradamento nell'app Mac
title: Voice Wake (macOS)
x-i18n:
    generated_at: "2026-04-05T13:58:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: fed6524a2e1fad5373d34821c920b955a2b5a3fcd9c51cdb97cf4050536602a7
    source_path: platforms/mac/voicewake.md
    workflow: 15
---

# Voice Wake e Push-to-Talk

## Modalità

- **Modalità wake-word** (predefinita): il riconoscitore vocale always-on attende i token trigger (`swabbleTriggerWords`). Alla corrispondenza avvia la cattura, mostra l'overlay con il testo parziale e invia automaticamente dopo il silenzio.
- **Push-to-talk (tenendo premuto Option destro)**: tieni premuto il tasto Option destro per avviare subito la cattura, senza trigger. L'overlay appare mentre il tasto è premuto; al rilascio finalizza e inoltra dopo un breve ritardo così puoi modificare il testo.

## Comportamento a runtime (wake-word)

- Il riconoscitore vocale risiede in `VoiceWakeRuntime`.
- Il trigger si attiva solo quando c'è una **pausa significativa** tra la wake word e la parola successiva (~0,55 s di intervallo). L'overlay/il suono può iniziare sulla pausa anche prima che inizi il comando.
- Finestre di silenzio: 2,0 s quando il parlato è continuo, 5,0 s se è stato sentito solo il trigger.
- Arresto forzato: 120 s per evitare sessioni incontrollate.
- Debounce tra sessioni: 350 ms.
- L'overlay è gestito tramite `VoiceWakeOverlayController` con colorazione committed/volatile.
- Dopo l'invio, il riconoscitore riparte in modo pulito per ascoltare il trigger successivo.

## Invarianti del ciclo di vita

- Se Voice Wake è abilitato e i permessi sono concessi, il riconoscitore della wake-word dovrebbe essere in ascolto (tranne durante una cattura push-to-talk esplicita).
- La visibilità dell'overlay, inclusa la chiusura manuale tramite il pulsante X, non deve mai impedire al riconoscitore di riprendere.

## Modalità di errore dell'overlay bloccato (precedente)

In precedenza, se l'overlay rimaneva visibile in modo anomalo e veniva chiuso manualmente, Voice Wake poteva sembrare “morto” perché il tentativo di riavvio del runtime poteva essere bloccato dalla visibilità dell'overlay e non veniva pianificato alcun riavvio successivo.

Hardening:

- Il riavvio del runtime wake non è più bloccato dalla visibilità dell'overlay.
- Il completamento della chiusura dell'overlay attiva un `VoiceWakeRuntime.refresh(...)` tramite `VoiceSessionCoordinator`, quindi la chiusura manuale con X riprende sempre l'ascolto.

## Dettagli specifici del push-to-talk

- Il rilevamento della hotkey usa un monitor globale `.flagsChanged` per **Option destro** (`keyCode 61` + `.option`). Osserviamo solo gli eventi, senza intercettarli.
- La pipeline di cattura risiede in `VoicePushToTalk`: avvia subito Speech, invia i parziali all'overlay e chiama `VoiceWakeForwarder` al rilascio.
- Quando il push-to-talk inizia, mettiamo in pausa il runtime wake-word per evitare conflitti tra audio tap; si riavvia automaticamente dopo il rilascio.
- Permessi: richiede Microfono + Speech; per vedere gli eventi serve l'approvazione Accessibilità/Input Monitoring.
- Tastiere esterne: alcune potrebbero non esporre Option destro come previsto — offri una scorciatoia di fallback se gli utenti segnalano mancate rilevazioni.

## Impostazioni visibili all'utente

- Toggle **Voice Wake**: abilita il runtime wake-word.
- **Hold Cmd+Fn to talk**: abilita il monitor push-to-talk. Disabilitato su macOS < 26.
- Selettori di lingua e microfono, misuratore di livello live, tabella delle trigger word, tester (solo locale; non inoltra).
- Il selettore del microfono conserva l'ultima selezione se un dispositivo si disconnette, mostra un suggerimento di disconnessione e passa temporaneamente al valore predefinito di sistema finché non ritorna.
- **Sounds**: suoni all'individuazione del trigger e all'invio; per impostazione predefinita usa il suono di sistema macOS “Glass”. Puoi scegliere qualsiasi file caricabile da `NSSound` (ad esempio MP3/WAV/AIFF) per ciascun evento oppure scegliere **No Sound**.

## Comportamento di inoltro

- Quando Voice Wake è abilitato, le trascrizioni vengono inoltrate al gateway/agente attivo (la stessa modalità locale o remota usata dal resto dell'app Mac).
- Le risposte vengono consegnate all'**ultimo provider principale usato** (WhatsApp/Telegram/Discord/WebChat). Se la consegna fallisce, l'errore viene registrato e l'esecuzione resta comunque visibile tramite WebChat/log di sessione.

## Payload di inoltro

- `VoiceWakeForwarder.prefixedTranscript(_:)` antepone il suggerimento della macchina prima dell'invio. Condiviso tra i percorsi wake-word e push-to-talk.

## Verifica rapida

- Attiva il push-to-talk, tieni premuto Cmd+Fn, parla, rilascia: l'overlay dovrebbe mostrare i parziali e poi inviare.
- Durante la pressione, le orecchie della barra dei menu dovrebbero restare ingrandite (usa `triggerVoiceEars(ttl:nil)`); tornano normali dopo il rilascio.
