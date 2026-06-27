---
read_when:
    - Debug dei prompt di autorizzazione macOS mancanti o bloccati
    - Decidere se concedere Accessibilità a node o a un runtime CLI
    - Creazione del pacchetto o firma dell'app macOS
    - Modifica degli ID bundle o dei percorsi di installazione dell'app
summary: Persistenza dei permessi macOS (TCC) e requisiti di firma
title: Permessi di macOS
x-i18n:
    generated_at: "2026-06-27T17:45:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b7e21c53bff16c3023e2b6509894717c3d0ef96524951b0d0c5975d2fc91019
    source_path: platforms/mac/permissions.md
    workflow: 16
---

Le concessioni di autorizzazioni macOS sono fragili. TCC associa una concessione di autorizzazione alla
firma del codice dell'app, all'identificatore del bundle e al percorso su disco. Se uno di questi cambia,
macOS tratta l'app come nuova e può eliminare o nascondere le richieste.

## Requisiti per autorizzazioni stabili

- Stesso percorso: esegui l'app da una posizione fissa (per OpenClaw, `dist/OpenClaw.app`).
- Stesso identificatore del bundle: cambiare l'ID del bundle crea una nuova identità di autorizzazione.
- App firmata: le build non firmate o firmate ad hoc non mantengono le autorizzazioni.
- Firma coerente: usa un vero certificato Apple Development o Developer ID
  in modo che la firma resti stabile tra le ricompilazioni.

Le firme ad hoc generano una nuova identità a ogni build. macOS dimenticherà le
concessioni precedenti e le richieste possono scomparire del tutto finché le voci obsolete non vengono cancellate.

## Concessioni di Accessibilità per runtime Node e CLI

Preferisci concedere Accessibilità a OpenClaw.app, Peekaboo.app o a un altro
helper firmato con il proprio identificatore del bundle invece che a un binario `node` generico.

macOS TCC concede Accessibilità all'identità del codice del processo che vede. Se un
flusso di lavoro Homebrew, nvm, pnpm o npm fa sì che un eseguibile `node` condiviso
riceva Accessibilità, qualsiasi pacchetto JavaScript avviato tramite quello stesso
eseguibile può ereditare privilegi di automazione GUI.

Considera una voce `node` in Impostazioni di Sistema come un'autorizzazione ampia per quel runtime Node,
non come un'autorizzazione per un singolo pacchetto npm. Evita di concedere Accessibilità a
`node` a meno che tu non consideri attendibili ogni script e pacchetto avviati tramite quella esatta
installazione di Node.

Se hai concesso accidentalmente Accessibilità a `node`, rimuovi quella voce da
Impostazioni di Sistema -> Privacy e sicurezza -> Accessibilità. Poi concedila all'app o
all'helper firmato che deve possedere l'automazione dell'interfaccia utente.

## Checklist di ripristino quando le richieste scompaiono

1. Chiudi l'app.
2. Rimuovi la voce dell'app in Impostazioni di Sistema -> Privacy e sicurezza.
3. Riavvia l'app dallo stesso percorso e concedi di nuovo le autorizzazioni.
4. Se la richiesta continua a non comparire, reimposta le voci TCC con `tccutil` e riprova.
5. Alcune autorizzazioni ricompaiono solo dopo un riavvio completo di macOS.

Esempi di reimpostazione (sostituisci l'ID del bundle se necessario):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Autorizzazioni per file e cartelle (Scrivania/Documenti/Download)

macOS può anche proteggere Scrivania, Documenti e Download per processi da terminale/in background. Se le letture dei file o gli elenchi delle directory si bloccano, concedi l'accesso allo stesso contesto di processo che esegue le operazioni sui file (per esempio Terminal/iTerm, app avviata da LaunchAgent o processo SSH).

Soluzione alternativa: sposta i file nello spazio di lavoro di OpenClaw (`~/.openclaw/workspace`) se vuoi evitare concessioni per singola cartella.

Se stai testando le autorizzazioni, firma sempre con un certificato reale. Le build ad hoc
sono accettabili solo per esecuzioni locali rapide in cui le autorizzazioni non contano.

## Correlati

- [app macOS](/it/platforms/macos)
- [firma macOS](/it/platforms/mac/signing)
