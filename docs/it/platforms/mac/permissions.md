---
read_when:
    - Debug dei prompt di autorizzazione di macOS mancanti o bloccati
    - Decidere se concedere l’accesso ad Accessibilità a Node o a un runtime CLI
    - Creazione del pacchetto o firma dell'app macOS
    - Modifica degli ID bundle o dei percorsi di installazione dell'app
summary: Persistenza dei permessi di macOS (TCC) e requisiti di firma
title: autorizzazioni di macOS
x-i18n:
    generated_at: "2026-07-12T07:14:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c8431a1d5a27aed00c50c5d6c8c36554cf766051dfdccea677d0523bbc4189d4
    source_path: platforms/mac/permissions.md
    workflow: 16
---

Le concessioni dei permessi di macOS sono fragili. TCC associa una concessione di permesso alla firma del codice dell'app, all'identificatore del bundle e al percorso sul disco. Se uno di questi elementi cambia, macOS considera l'app come nuova e potrebbe eliminare o nascondere le richieste di autorizzazione.

## Requisiti per permessi stabili

- Stesso percorso: esegui l'app da una posizione fissa (per OpenClaw, `dist/OpenClaw.app`).
- Stesso identificatore del bundle: l'ID bundle di OpenClaw è `ai.openclaw.mac`; modificarlo crea una nuova identità per i permessi.
- App firmata: le build non firmate o firmate ad hoc non mantengono i permessi.
- Firma coerente: usa un certificato Apple Development o Developer ID reale affinché la firma rimanga stabile tra le diverse compilazioni.

Le firme ad hoc generano una nuova identità a ogni compilazione. macOS dimentica le concessioni precedenti e le richieste di autorizzazione possono scomparire completamente finché le voci obsolete non vengono eliminate.

## Concessioni di Accessibilità per i runtime Node e CLI

È preferibile concedere l'Accessibilità a OpenClaw.app, Peekaboo.app o a un altro programma di supporto firmato con un proprio identificatore del bundle, anziché a un binario `node` generico.

TCC di macOS concede l'Accessibilità all'identità del codice del processo rilevato. Se un flusso di lavoro Homebrew, nvm, pnpm o npm fa sì che un eseguibile `node` condiviso riceva l'Accessibilità, qualsiasi pacchetto JavaScript avviato tramite lo stesso eseguibile potrebbe ereditare i privilegi di automazione dell'interfaccia grafica.

Considera una voce `node` nelle Impostazioni di Sistema come un'autorizzazione generale per quel runtime Node, non come un'autorizzazione per un singolo pacchetto npm. Evita di concedere l'Accessibilità a `node`, a meno che tu non ritenga attendibili tutti gli script e i pacchetti avviati tramite quella specifica installazione di Node.

Se hai accidentalmente concesso l'Accessibilità a `node`, rimuovi la relativa voce da System Settings -> Privacy & Security -> Accessibility. Quindi concedila all'app firmata o al programma di supporto che deve gestire l'automazione dell'interfaccia utente.

## Elenco di controllo per il ripristino quando le richieste scompaiono

1. Chiudi l'app.
2. Rimuovi la voce dell'app in System Settings -> Privacy & Security.
3. Riavvia l'app dallo stesso percorso e concedi nuovamente i permessi.
4. Se la richiesta continua a non apparire, reimposta le voci TCC con `tccutil` e riprova.
5. Alcuni permessi ricompaiono solo dopo un riavvio completo di macOS.

Esempi di reimpostazione (utilizzando l'ID bundle di OpenClaw, `ai.openclaw.mac`):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Permessi per file e cartelle (Scrivania/Documenti/Download)

macOS può inoltre limitare l'accesso a Scrivania, Documenti e Download per i processi del terminale o in background. Se le letture dei file o gli elenchi delle directory si bloccano, concedi l'accesso allo stesso contesto di processo che esegue le operazioni sui file (ad esempio Terminal/iTerm, un'app avviata da LaunchAgent o un processo SSH).

Soluzione alternativa: sposta i file nell'area di lavoro di OpenClaw (`~/.openclaw/workspace`) se vuoi evitare di concedere permessi per ogni cartella.

Se stai verificando i permessi, firma sempre con un certificato reale. Le build ad hoc sono accettabili solo per rapide esecuzioni locali in cui i permessi non sono rilevanti.

## Argomenti correlati

- [App macOS](/it/platforms/macos)
- [Firma per macOS](/it/platforms/mac/signing)
