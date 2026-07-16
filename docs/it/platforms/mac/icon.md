---
read_when:
    - Modifica del comportamento dell'icona della barra dei menu
summary: Stati e animazioni dell'icona della barra dei menu per OpenClaw su macOS
title: Icona della barra dei menu
x-i18n:
    generated_at: "2026-07-16T14:35:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8a38f1253f0c376ef2ce6c0ae339b67084c472c764964bcc7ad21e10133e2b47
    source_path: platforms/mac/icon.md
    workflow: 16
---

# Stati dell'icona nella barra dei menu

Ambito: app macOS (`apps/macos`). Rendering: `CritterIconRenderer.makeIcon(...)`. Collegamento di animazioni e stati: `CritterStatusLabel` + `CritterStatusLabel+Behavior.swift`.

## Stati

| Stato                 | Attivazione                               | Aspetto                                                                                             |
| --------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Inattivo              | Predefinito                               | Normale animazione di battito delle palpebre/oscillazione; gli occhi aperti mantengono un riflesso lucido |
| In pausa              | `isPaused=true`                           | Le antenne si abbassano ("fuori servizio") con gli occhi aperti; nessun movimento                   |
| In sospensione        | Gateway disconnesso/non configurato       | Le antenne si abbassano e gli occhi si chiudono formando palpebre `⌣ ⌣`; nessun movimento |
| Festeggiamento        | Messaggio inviato (`sendCelebrationTick`)      | Gli occhi mostrano brevemente archi `∩ ∩` felici per ~0.9s, accompagnati da un calcio con una zampa |
| Risveglio vocale (orecchie grandi) | Parola di attivazione rilevata             | Le antenne si raddrizzano e si allungano (`earScale=1.9`); si abbassano dopo un periodo di silenzio |
| In attività           | `isWorking=true` o un `IconState` attivo | Oscillazione più rapida delle zampe (da `legWiggle` fino a `1.0`) con un piccolo spostamento orizzontale; si aggiunge all'oscillazione dello stato inattivo |

Un badge di attività dello strumento (riquadro con simbolo SF, ad esempio `chevron.left.slash.chevron.right` per l'esecuzione) può essere visualizzato sopra la stessa icona della creatura quando una sessione ha un processo o uno strumento attivo. Il badge proviene da `IconState`/`ActivityKind`; consultare [Barra dei menu](/it/platforms/mac/menu-bar) per il modello completo degli stati.

## Orecchie del risveglio vocale

- Attivazione: `AppStateStore.shared.triggerVoiceEars(ttl: nil)`, richiamato dalla pipeline di acquisizione del risveglio vocale (`VoiceWakeRuntime`) e dagli strumenti di debug/test del risveglio vocale (`VoiceWakeTester`, `VoiceWakeOverlayController`).
- Arresto: `stopVoiceEars()`, richiamato al termine dell'acquisizione.
- Intervallo di silenzio prima della finalizzazione: normalmente `2.0s`, oppure `5.0s` se è stata rilevata solo la parola di attivazione senza ulteriori parole successive (`VoiceWakeRuntime.silenceWindow` / `triggerOnlySilenceWindow`).
- Durante il potenziamento, i timer per il battito delle palpebre, l'oscillazione, le zampe e le orecchie dello stato inattivo vengono sospesi (`earBoostActive` controlla l'attività di animazione in `CritterStatusLabel+Behavior`).

## Forme e dimensioni

- Area di disegno: immagine modello da 18x18pt, renderizzata in un buffer bitmap da 36x36px (2x) affinché l'icona rimanga nitida sui display Retina.
- La scala predefinita delle orecchie è `1.0`; il potenziamento vocale imposta `earScale=1.9` senza modificare il riquadro complessivo.
- `antennaDroop` (0-1) ripiega le antenne verso il basso per le pose in pausa e in sospensione.
- Il movimento rapido delle zampe usa valori da `legWiggle` fino a `1.0`, con una leggera oscillazione orizzontale.

## Note sul comportamento

- Non è disponibile alcuna opzione esterna della CLI o del broker per attivare/disattivare le orecchie o lo stato di attività; entrambi sono gestiti internamente dai segnali dell'app (`AppState.setWorking`, `AppState.triggerVoiceEars`) per evitare oscillazioni accidentali.
- Mantenere breve ogni nuovo TTL (ben al di sotto di 10s), affinché l'icona torni rapidamente allo stato di base se un processo si blocca.

## Contenuti correlati

- [Barra dei menu](/it/platforms/mac/menu-bar)
- [App macOS](/it/platforms/macos)
