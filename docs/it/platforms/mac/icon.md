---
read_when:
    - Modifica del comportamento dell'icona nella barra dei menu
summary: Stati e animazioni dell'icona nella barra dei menu per OpenClaw su macOS
title: Icona della barra dei menu
x-i18n:
    generated_at: "2026-04-24T08:50:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6900d702358afcf0481f713ea334236e1abf973d0eeff60eaf0afcf88f9327b2
    source_path: platforms/mac/icon.md
    workflow: 15
---

# Stati dell'icona della barra dei menu

Autore: steipete · Aggiornato: 2025-12-06 · Ambito: app macOS (`apps/macos`)

- **Idle:** Animazione normale dell'icona (battito di ciglia, movimento occasionale).
- **Paused:** L'elemento della barra di stato usa `appearsDisabled`; nessun movimento.
- **Trigger vocale (orecchie grandi):** Il rilevatore voice wake chiama `AppState.triggerVoiceEars(ttl: nil)` quando viene rilevata la wake word, mantenendo `earBoostActive=true` mentre l'enunciato viene acquisito. Le orecchie si ingrandiscono (1.9x), ottengono fori circolari per una migliore leggibilità, poi tornano giù tramite `stopVoiceEars()` dopo 1s di silenzio. Attivato solo dalla pipeline vocale interna all'app.
- **Working (agente in esecuzione):** `AppState.isWorking=true` guida un micromovimento di “sgambettamento di coda/zampe”: movimento più rapido delle zampe e leggero spostamento mentre il lavoro è in corso. Attualmente viene attivato intorno alle esecuzioni dell'agente WebChat; aggiungi lo stesso toggle anche attorno ad altre attività lunghe quando le colleghi.

Punti di collegamento

- Voice wake: runtime/tester chiamano `AppState.triggerVoiceEars(ttl: nil)` al trigger e `stopVoiceEars()` dopo 1s di silenzio per allinearsi alla finestra di acquisizione.
- Attività dell'agente: imposta `AppStateStore.shared.setWorking(true/false)` attorno agli intervalli di lavoro (già fatto nella chiamata dell'agente WebChat). Mantieni gli intervalli brevi e ripristinali in blocchi `defer` per evitare animazioni bloccate.

Forme e dimensioni

- L'icona base viene disegnata in `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- La scala delle orecchie ha come valore predefinito `1.0`; il boost vocale imposta `earScale=1.9` e attiva `earHoles=true` senza modificare il frame complessivo (immagine template da 18×18 pt renderizzata in un backing store Retina da 36×36 px).
- Lo sgambettamento usa un movimento delle zampe fino a ~1.0 con un piccolo tremolio orizzontale; è additivo rispetto a qualsiasi movimento idle esistente.

Note comportamentali

- Nessun toggle CLI/broker esterno per orecchie/working; mantienilo interno ai segnali dell'app stessa per evitare oscillazioni accidentali.
- Mantieni i TTL brevi (&lt;10s) in modo che l'icona torni rapidamente alla baseline se un job si blocca.

## Correlati

- [Menu bar](/it/platforms/mac/menu-bar)
- [App macOS](/it/platforms/macos)
