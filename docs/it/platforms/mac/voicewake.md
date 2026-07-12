---
read_when:
    - Lavorare sui percorsi di attivazione vocale o PTT
summary: Modalità di attivazione vocale e push-to-talk, oltre ai dettagli di instradamento nell’app per Mac
title: Attivazione vocale (macOS)
x-i18n:
    generated_at: "2026-07-12T07:12:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a0a5ac44931b578daa4f74b3728a65a1c19ab9742e2d4b9f4c6db49fa5d7b8a
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Attivazione vocale e push-to-talk

## Requisiti

L'attivazione vocale e il push-to-talk richiedono macOS 26 o versioni successive. Nelle versioni precedenti di macOS, i controlli sono nascosti nella pagina delle impostazioni vocali, che mostra invece il requisito di macOS 26.

## Modalità

- **Modalità parola di attivazione** (predefinita): un riconoscitore vocale sempre attivo attende i termini di attivazione (`swabbleTriggerWords`). Quando li rileva, avvia l'acquisizione, mostra la sovrimpressione con il testo parziale e invia automaticamente dopo un periodo di silenzio.
- **Push-to-talk (tieni premuto Opzione destro)**: tieni premuto il tasto Opzione destro per avviare immediatamente l'acquisizione, senza bisogno di un termine di attivazione. La sovrimpressione appare mentre il tasto è premuto; al rilascio, finalizza e inoltra dopo un breve ritardo, consentendoti di modificare il testo.

## Comportamento in fase di esecuzione (parola di attivazione)

- Il riconoscitore risiede in `VoiceWakeRuntime`.
- L'attivazione avviene solo in presenza di una pausa significativa tra la parola di attivazione e quella successiva (`triggerPauseWindow` = 0,55 s). La sovrimpressione e il segnale acustico possono avviarsi durante la pausa, anche prima dell'inizio del comando.
- Intervalli di silenzio: 2,0 s (`silenceWindow`) mentre il parlato prosegue, 5,0 s (`triggerOnlySilenceWindow`) se è stata rilevata soltanto la parola di attivazione.
- Arresto forzato: 120 s (`captureHardStop`) per evitare sessioni incontrollate.
- Antirimbalzo tra le sessioni: 350 ms (`debounceAfterSend`) dopo un invio.
- La sovrimpressione è gestita tramite `VoiceWakeOverlayController`, con una colorazione distinta per il testo confermato e quello provvisorio.
- Dopo l'invio, il riconoscitore si riavvia in modo pulito per attendere l'attivazione successiva.

## Invarianti del ciclo di vita

- Se l'attivazione vocale è abilitata e le autorizzazioni sono concesse, il riconoscitore della parola di attivazione rimane in ascolto, tranne durante un'acquisizione push-to-talk attiva.
- La chiusura della sovrimpressione, inclusa quella manuale tramite il pulsante X, riattiva sempre il riconoscitore: `VoiceSessionCoordinator.overlayDidDismiss` chiama `VoiceWakeRuntime.refresh(state:)` in ogni percorso di chiusura. Consulta [Sovrimpressione vocale](/it/platforms/mac/voice-overlay) per il modello di sessione e token.

## Dettagli del push-to-talk

- Il rilevamento del tasto di scelta rapida utilizza un monitor globale `.flagsChanged` per il tasto Opzione destro (`keyCode 61` + `.option`). Osserva soltanto gli eventi, senza mai intercettarli.
- L'acquisizione risiede in `VoicePushToTalk`: avvia immediatamente il riconoscimento vocale, trasmette i risultati parziali alla sovrimpressione e chiama `VoiceWakeForwarder` al rilascio.
- L'avvio del push-to-talk mette in pausa il runtime della parola di attivazione per evitare acquisizioni audio concorrenti; questo si riavvia automaticamente dopo il rilascio.
- Autorizzazioni: richiede l'accesso a microfono e riconoscimento vocale; la ricezione degli eventi da tastiera richiede l'autorizzazione per accessibilità e monitoraggio input.
- Tastiere esterne: alcune non espongono il tasto Opzione destro come previsto. Offri una scorciatoia alternativa se gli utenti segnalano mancate attivazioni.

## Impostazioni visibili all'utente

- Interruttore **Attivazione vocale**: abilita il runtime della parola di attivazione.
- **Tieni premuto Opzione destro per parlare**: abilita il monitoraggio push-to-talk.
- Selettori della lingua e del microfono, indicatore del livello in tempo reale, tabella delle parole di attivazione e strumento di prova (solo locale, non inoltra mai).
- Il selettore del microfono conserva l'ultima scelta se un dispositivo si disconnette, mostra un'indicazione di disconnessione e usa temporaneamente il dispositivo predefinito del sistema finché quello selezionato non torna disponibile.
- **Suoni**: segnali acustici al rilevamento dell'attivazione e all'invio, con il suono di sistema "Glass" di macOS come impostazione predefinita. Scegli per ciascun evento qualsiasi file caricabile da `NSSound` (ad esempio MP3/WAV/AIFF), oppure seleziona **Nessun suono**.

## Comportamento di inoltro

- Durante l'inoltro, `VoiceWakeForwarder.selectedSessionOptions` seleziona la chiave della sessione WebChat attiva, se impostata; in caso contrario, usa la chiave della sessione principale del Gateway.
- Cerca la sessione tramite `sessions.list` e ricava il canale e la destinazione di consegna dal contesto di consegna della sessione, usando come ripiego prima l'ultimo canale e l'ultima destinazione, poi una chiave di sessione analizzata; se non viene risolto nulla, usa WebChat come impostazione predefinita.
- Se la consegna non riesce, l'errore viene registrato (categoria `voicewake.forward`) e l'esecuzione rimane comunque visibile tramite WebChat o i registri della sessione.

## Payload di inoltro

- `VoiceWakeForwarder.prefixedTranscript(_:)` antepone alla trascrizione una riga di indicazione per la macchina (nome host risolto, con "questo Mac" come ripiego), condivisa tra i percorsi della parola di attivazione e del push-to-talk.

## Verifica rapida

- Attiva il push-to-talk, tieni premuto Opzione destro, parla e rilascia: la sovrimpressione dovrebbe mostrare i risultati parziali e poi inviarli.
- Mentre tieni premuto il tasto, le orecchie nella barra dei menu devono rimanere ingrandite (`triggerVoiceEars(ttl: nil)`); tornano alle dimensioni normali dopo il rilascio.

## Argomenti correlati

- [Attivazione vocale](/it/nodes/voicewake)
- [Sovrimpressione vocale](/it/platforms/mac/voice-overlay)
- [App macOS](/it/platforms/macos)
