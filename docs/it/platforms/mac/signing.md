---
read_when:
    - Creazione o firma di build debug per Mac
summary: Passaggi di firma per build debug macOS generate dagli script di packaging
title: Firma macOS
x-i18n:
    generated_at: "2026-04-24T08:50:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd432c1f87ea14f4e19b1e5db967a62b42e2e4118fbd2a44d358b4eedea799f
    source_path: platforms/mac/signing.md
    workflow: 15
---

# firma mac (build debug)

Questa app di solito viene creata da [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), che ora:

- imposta un identificatore bundle debug stabile: `ai.openclaw.mac.debug`
- scrive `Info.plist` con quell'id bundle (override tramite `BUNDLE_ID=...`)
- chiama [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) per firmare il binario principale e il bundle dell'app in modo che macOS tratti ogni rebuild come lo stesso bundle firmato e mantenga i permessi TCC (notifiche, accessibilità, registrazione schermo, microfono, voce). Per permessi stabili, usa una vera identità di firma; la firma ad-hoc è opt-in e fragile (vedi [permessi macOS](/it/platforms/mac/permissions)).
- usa `CODESIGN_TIMESTAMP=auto` per impostazione predefinita; abilita timestamp affidabili per le firme Developer ID. Imposta `CODESIGN_TIMESTAMP=off` per saltare il timestamping (build debug offline).
- inietta metadati di build in `Info.plist`: `OpenClawBuildTimestamp` (UTC) e `OpenClawGitCommit` (hash breve) così il pannello About può mostrare build, git e canale debug/release.
- **Il packaging usa Node 24 per impostazione predefinita**: lo script esegue le build TS e la build della Control UI. Node 22 LTS, attualmente `22.14+`, resta supportato per compatibilità.
- legge `SIGN_IDENTITY` dall'ambiente. Aggiungi `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (o il tuo certificato Developer ID Application) al file rc della tua shell per firmare sempre con il tuo certificato. La firma ad-hoc richiede opt-in esplicito tramite `ALLOW_ADHOC_SIGNING=1` oppure `SIGN_IDENTITY="-"` (non consigliato per test dei permessi).
- esegue un audit Team ID dopo la firma e fallisce se un qualsiasi Mach-O all'interno del bundle dell'app è firmato da un Team ID diverso. Imposta `SKIP_TEAM_ID_CHECK=1` per bypassare.

## Utilizzo

```bash
# dalla root del repository
scripts/package-mac-app.sh               # seleziona automaticamente l'identità; errore se non ne trova nessuna
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # certificato reale
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (i permessi non resteranno)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # ad-hoc esplicito (stesse limitazioni)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # workaround solo dev per mismatch Sparkle Team ID
```

### Nota sulla firma ad-hoc

Quando firmi con `SIGN_IDENTITY="-"` (ad-hoc), lo script disabilita automaticamente il **Hardened Runtime** (`--options runtime`). Questo è necessario per evitare crash quando l'app tenta di caricare framework incorporati (come Sparkle) che non condividono lo stesso Team ID. Le firme ad-hoc rompono anche la persistenza dei permessi TCC; vedi [permessi macOS](/it/platforms/mac/permissions) per i passaggi di recupero.

## Metadati di build per About

`package-mac-app.sh` marca il bundle con:

- `OpenClawBuildTimestamp`: ISO8601 UTC al momento del packaging
- `OpenClawGitCommit`: hash git breve (oppure `unknown` se non disponibile)

La scheda About legge queste chiavi per mostrare versione, data build, commit git e se si tratta di una build debug (tramite `#if DEBUG`). Esegui il packager per aggiornare questi valori dopo modifiche al codice.

## Perché

I permessi TCC sono legati all'identificatore del bundle _e_ alla firma del codice. Le build debug non firmate con UUID variabili facevano dimenticare a macOS le autorizzazioni dopo ogni rebuild. Firmare i binari (ad‑hoc per impostazione predefinita) e mantenere un id/percorso bundle fisso (`dist/OpenClaw.app`) preserva le autorizzazioni tra una build e l'altra, seguendo l'approccio VibeTunnel.

## Correlati

- [App macOS](/it/platforms/macos)
- [Permessi macOS](/it/platforms/mac/permissions)
