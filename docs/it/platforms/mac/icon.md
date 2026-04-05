---
read_when:
    - Modifica del comportamento dell'icona della barra dei menu
summary: Stati e animazioni dell'icona della barra dei menu per OpenClaw su macOS
title: Icona della barra dei menu
x-i18n:
    generated_at: "2026-04-05T13:58:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: a67a6e6bbdc2b611ba365d3be3dd83f9e24025d02366bc35ffcce9f0b121872b
    source_path: platforms/mac/icon.md
    workflow: 15
---

# Stati dell'icona della barra dei menu

Autore: steipete · Aggiornato: 2025-12-06 · Ambito: app macOS (`apps/macos`)

- **Inattiva:** animazione normale dell'icona (battito di ciglia, occasionale oscillazione).
- **In pausa:** l'elemento della barra di stato usa `appearsDisabled`; nessun movimento.
- **Trigger vocale (orecchie grandi):** il rilevatore di Voice Wake chiama `AppState.triggerVoiceEars(ttl: nil)` quando viene rilevata la wake word, mantenendo `earBoostActive=true` mentre l'enunciato viene acquisito. Le orecchie si ingrandiscono (1,9x), ottengono fori circolari per migliorare la leggibilità, poi tornano normali tramite `stopVoiceEars()` dopo 1 secondo di silenzio. Attivato solo dalla pipeline vocale interna all'app.
- **Attiva (agente in esecuzione):** `AppState.isWorking=true` pilota un micromovimento di tipo “coda/zampette in agitazione”: oscillazione più rapida delle zampe e leggero spostamento mentre il lavoro è in corso. Attualmente viene attivato attorno alle esecuzioni dell'agente in WebChat; aggiungi lo stesso toggle anche attorno ad altre attività lunghe quando le colleghi.

Punti di collegamento

- Voice Wake: runtime/tester chiamano `AppState.triggerVoiceEars(ttl: nil)` al trigger e `stopVoiceEars()` dopo 1 secondo di silenzio per corrispondere alla finestra di acquisizione.
- Attività dell'agente: imposta `AppStateStore.shared.setWorking(true/false)` attorno agli intervalli di lavoro (già fatto nella chiamata agente WebChat). Mantieni gli intervalli brevi e reimposta in blocchi `defer` per evitare animazioni bloccate.

Forme e dimensioni

- L'icona base viene disegnata in `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- La scala delle orecchie è predefinita a `1.0`; il boost vocale imposta `earScale=1.9` e attiva `earHoles=true` senza modificare il frame complessivo (immagine template da 18×18 pt renderizzata in un backing store Retina da 36×36 px).
- L'agitazione usa un'oscillazione delle zampe fino a ~1.0 con un piccolo movimento orizzontale; è additiva rispetto a qualsiasi oscillazione inattiva già esistente.

Note comportamentali

- Nessun toggle CLI/broker esterno per orecchie/stato attivo; mantienilo interno ai segnali dell'app stessa per evitare attivazioni accidentali.
- Mantieni TTL brevi (&lt;10s) così l'icona torna rapidamente allo stato base se un'attività si blocca.
