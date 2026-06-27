---
read_when:
    - Lavorare sui percorsi di attivazione vocale o PTT
summary: Modalità di attivazione vocale e push-to-talk, più dettagli di instradamento nell’app mac
title: Risveglio vocale (macOS)
x-i18n:
    generated_at: "2026-06-27T17:45:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33c6132d03efb837ae06f4810ff87eb981ad742d793657bc607f4ec214bc2afa
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Risveglio vocale e premi per parlare

## Requisiti

Risveglio vocale e premi per parlare richiedono macOS 26 o versioni successive. Nelle versioni precedenti di macOS,
i controlli sono nascosti dalla pagina delle impostazioni Voce, che mostra il requisito di macOS 26.

## Modalità

- **Modalità parola di attivazione** (predefinita): il riconoscitore vocale sempre attivo attende i token di attivazione (`swabbleTriggerWords`). Quando trova una corrispondenza avvia la cattura, mostra l'overlay con testo parziale e invia automaticamente dopo il silenzio.
- **Premi per parlare (tieni premuto Option destro)**: tieni premuto il tasto Option destro per catturare immediatamente, senza attivazione necessaria. L'overlay appare mentre il tasto è premuto; il rilascio finalizza e inoltra dopo un breve ritardo, così puoi correggere il testo.

## Comportamento runtime (parola di attivazione)

- Il riconoscitore vocale risiede in `VoiceWakeRuntime`.
- L'attivazione scatta solo quando c'è una **pausa significativa** tra la parola di attivazione e la parola successiva (intervallo di ~0,55 s). L'overlay/il segnale acustico possono partire sulla pausa anche prima dell'inizio del comando.
- Finestre di silenzio: 2,0 s quando il parlato sta proseguendo, 5,0 s se è stata rilevata solo l'attivazione.
- Arresto forzato: 120 s per prevenire sessioni incontrollate.
- Debounce tra le sessioni: 350 ms.
- L'overlay è gestito tramite `VoiceWakeOverlayController` con colorazione committed/volatile.
- Dopo l'invio, il riconoscitore si riavvia in modo pulito per ascoltare l'attivazione successiva.

## Invarianti del ciclo di vita

- Se Risveglio vocale è abilitato e le autorizzazioni sono concesse, il riconoscitore della parola di attivazione dovrebbe essere in ascolto (tranne durante una cattura esplicita premi per parlare).
- La visibilità dell'overlay (inclusa la chiusura manuale tramite il pulsante X) non deve mai impedire la ripresa del riconoscitore.

## Modalità di errore dell'overlay bloccato (precedente)

In precedenza, se l'overlay rimaneva bloccato visibile e lo chiudevi manualmente, Risveglio vocale poteva sembrare "morto" perché il tentativo di riavvio del runtime poteva essere bloccato dalla visibilità dell'overlay e non veniva pianificato alcun riavvio successivo.

Rafforzamento:

- Il riavvio del runtime di risveglio non è più bloccato dalla visibilità dell'overlay.
- Il completamento della chiusura dell'overlay attiva un `VoiceWakeRuntime.refresh(...)` tramite `VoiceSessionCoordinator`, quindi la chiusura manuale con X riprende sempre l'ascolto.

## Dettagli del premi per parlare

- Il rilevamento della scorciatoia usa un monitor globale `.flagsChanged` per **Option destro** (`keyCode 61` + `.option`). Osserviamo solo gli eventi (senza intercettarli).
- La pipeline di cattura risiede in `VoicePushToTalk`: avvia subito Speech, trasmette i parziali all'overlay e chiama `VoiceWakeForwarder` al rilascio.
- Quando premi per parlare si avvia, mettiamo in pausa il runtime della parola di attivazione per evitare tap audio concorrenti; si riavvia automaticamente dopo il rilascio.
- Autorizzazioni: richiede Microfono + Riconoscimento vocale; per vedere gli eventi serve l'approvazione di Accessibilità/Monitoraggio input.
- Tastiere esterne: alcune potrebbero non esporre Option destro come previsto; offri una scorciatoia alternativa se gli utenti segnalano mancate rilevazioni.

## Impostazioni visibili all'utente

- Interruttore **Risveglio vocale**: abilita il runtime della parola di attivazione.
- **Tieni premuto Option destro per parlare**: abilita il monitor premi per parlare.
- Selettori di lingua e microfono, misuratore di livello in tempo reale, tabella delle parole di attivazione, tester (solo locale; non inoltra).
- Il selettore del microfono conserva l'ultima selezione se un dispositivo si disconnette, mostra un suggerimento di disconnessione e ripiega temporaneamente sul valore predefinito di sistema finché non torna disponibile.
- **Suoni**: segnali acustici al rilevamento dell'attivazione e all'invio; l'impostazione predefinita è il suono di sistema macOS "Glass". Puoi scegliere qualsiasi file caricabile da `NSSound` (ad es. MP3/WAV/AIFF) per ogni evento oppure scegliere **Nessun suono**.

## Comportamento di inoltro

- Quando Risveglio vocale è abilitato, le trascrizioni vengono inoltrate al gateway/agente attivo (la stessa modalità locale o remota usata dal resto dell'app Mac).
- Le risposte vengono recapitate all'**ultimo provider principale usato** (WhatsApp/Telegram/Discord/WebChat). Se il recapito non riesce, l'errore viene registrato e l'esecuzione resta comunque visibile tramite WebChat/log di sessione.

## Payload di inoltro

- `VoiceWakeForwarder.prefixedTranscript(_:)` antepone il suggerimento della macchina prima dell'invio. Condiviso tra i percorsi parola di attivazione e premi per parlare.

## Verifica rapida

- Attiva premi per parlare, tieni premuto Option destro, parla, rilascia: l'overlay dovrebbe mostrare i parziali e poi inviare.
- Durante la pressione, le orecchie nella barra dei menu dovrebbero restare ingrandite (usa `triggerVoiceEars(ttl:nil)`); tornano normali dopo il rilascio.

## Correlati

- [Risveglio vocale](/it/nodes/voicewake)
- [Overlay vocale](/it/platforms/mac/voice-overlay)
- [App macOS](/it/platforms/macos)
