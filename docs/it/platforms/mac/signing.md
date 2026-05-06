---
read_when:
    - Compilazione o firma delle build di debug per Mac
summary: Passaggi di firma per le build di debug macOS generate dagli script di packaging
title: Firma macOS
x-i18n:
    generated_at: "2026-05-06T09:00:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08a2f18f0f813c0bb7352b393531ad69d24da55de2e6ec6446febe0661eb4598
    source_path: platforms/mac/signing.md
    workflow: 16
---

# firma mac (build di debug)

Questa app viene di solito creata da [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), che ora:

- imposta un identificatore bundle di debug stabile: `ai.openclaw.mac.debug`
- scrive l'Info.plist con quell'id bundle (override tramite `BUNDLE_ID=...`)
- chiama [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) per firmare il binario principale e il bundle dell'app, così macOS tratta ogni rebuild come lo stesso bundle firmato e mantiene i permessi TCC (notifiche, accessibilità, registrazione dello schermo, microfono, voce). Per permessi stabili, usa una vera identità di firma; ad-hoc è opt-in e fragile (vedi [permessi macOS](/it/platforms/mac/permissions)).
- usa `CODESIGN_TIMESTAMP=auto` per impostazione predefinita; abilita timestamp attendibili per le firme Developer ID. Imposta `CODESIGN_TIMESTAMP=off` per saltare il timestamping (build di debug offline).
- inserisce metadati di build in Info.plist: `OpenClawBuildTimestamp` (UTC) e `OpenClawGitCommit` (hash breve), così il pannello Informazioni può mostrare build, git e canale debug/release.
- **Il packaging usa Node 24 per impostazione predefinita**: lo script esegue le build TS e la build della Control UI. Node 22 LTS, attualmente `22.14+`, resta supportato per compatibilità.
- legge `SIGN_IDENTITY` dall'ambiente. Aggiungi `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (o il tuo certificato Developer ID Application) al tuo shell rc per firmare sempre con il tuo certificato. La firma ad-hoc richiede opt-in esplicito tramite `ALLOW_ADHOC_SIGNING=1` o `SIGN_IDENTITY="-"` (non consigliato per testare i permessi).
- esegue un audit del Team ID dopo la firma e fallisce se qualsiasi Mach-O dentro il bundle dell'app è firmato da un Team ID diverso. Imposta `SKIP_TEAM_ID_CHECK=1` per ignorarlo.

## Utilizzo

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Nota sulla firma ad-hoc

Quando firmi con `SIGN_IDENTITY="-"` (ad-hoc), lo script disabilita automaticamente l'**Hardened Runtime** (`--options runtime`). Questo è necessario per evitare crash quando l'app tenta di caricare framework incorporati (come Sparkle) che non condividono lo stesso Team ID. Le firme ad-hoc interrompono anche la persistenza dei permessi TCC; vedi [permessi macOS](/it/platforms/mac/permissions) per i passaggi di ripristino.

## Metadati di build per Informazioni

`package-mac-app.sh` marca il bundle con:

- `OpenClawBuildTimestamp`: UTC ISO8601 al momento del packaging
- `OpenClawGitCommit`: hash git breve (o `unknown` se non disponibile)

La scheda Informazioni legge queste chiavi per mostrare versione, data di build, commit git e se è una build di debug (tramite `#if DEBUG`). Esegui il packager per aggiornare questi valori dopo modifiche al codice.

## Perché

I permessi TCC sono legati all'identificatore bundle _e_ alla firma del codice. Le build di debug non firmate con UUID variabili facevano sì che macOS dimenticasse le autorizzazioni dopo ogni rebuild. Firmare i binari (ad-hoc per impostazione predefinita) e mantenere un id/percorso bundle fisso (`dist/OpenClaw.app`) preserva le autorizzazioni tra le build, seguendo l'approccio di VibeTunnel.

## Correlati

- [app macOS](/it/platforms/macos)
- [permessi macOS](/it/platforms/mac/permissions)
