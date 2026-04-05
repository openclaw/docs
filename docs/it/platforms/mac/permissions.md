---
read_when:
    - Debug di prompt dei permessi macOS mancanti o bloccati
    - Packaging o firma dell'app macOS
    - Modifica di bundle ID o percorsi di installazione dell'app
summary: Persistenza dei permessi macOS (TCC) e requisiti di firma
title: Permessi macOS
x-i18n:
    generated_at: "2026-04-05T13:58:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 250065b964c98c307a075ab9e23bf798f9d247f27befe2e5f271ffef1f497def
    source_path: platforms/mac/permissions.md
    workflow: 15
---

# Permessi macOS (TCC)

Le concessioni dei permessi macOS sono fragili. TCC associa una concessione del permesso alla
firma del codice dell'app, al bundle identifier e al percorso su disco. Se uno qualsiasi di questi cambia,
macOS tratta l'app come nuova e può eliminare o nascondere i prompt.

## Requisiti per permessi stabili

- Stesso percorso: esegui l'app da una posizione fissa (per OpenClaw, `dist/OpenClaw.app`).
- Stesso bundle identifier: cambiare il bundle ID crea una nuova identità di permesso.
- App firmata: le build non firmate o firmate ad hoc non mantengono i permessi.
- Firma coerente: usa un certificato reale Apple Development o Developer ID
  in modo che la firma resti stabile tra le ricompilazioni.

Le firme ad hoc generano una nuova identità a ogni build. macOS dimenticherà le concessioni precedenti e i prompt possono scomparire completamente finché le voci obsolete non vengono cancellate.

## Checklist di ripristino quando i prompt scompaiono

1. Chiudi l'app.
2. Rimuovi la voce dell'app in Impostazioni di Sistema -> Privacy e sicurezza.
3. Riavvia l'app dallo stesso percorso e concedi di nuovo i permessi.
4. Se il prompt continua a non comparire, reimposta le voci TCC con `tccutil` e riprova.
5. Alcuni permessi ricompaiono solo dopo un riavvio completo di macOS.

Esempi di reset (sostituisci il bundle ID secondo necessità):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Permessi per file e cartelle (Desktop/Documenti/Download)

macOS può anche limitare Desktop, Documenti e Download per processi terminal/background. Se le letture di file o gli elenchi di directory si bloccano, concedi l'accesso allo stesso contesto di processo che esegue le operazioni sui file (ad esempio Terminal/iTerm, app avviata da LaunchAgent o processo SSH).

Soluzione alternativa: sposta i file nello spazio di lavoro OpenClaw (`~/.openclaw/workspace`) se vuoi evitare concessioni per singola cartella.

Se stai testando i permessi, firma sempre con un certificato reale. Le build ad hoc
sono accettabili solo per esecuzioni locali rapide in cui i permessi non contano.
