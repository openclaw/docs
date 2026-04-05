---
read_when:
    - Stai creando o firmando build di debug Mac
summary: Passaggi di firma per build di debug macOS generate dagli script di packaging
title: Firma macOS
x-i18n:
    generated_at: "2026-04-05T13:58:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b16d726549cf6dc34dc9c60e14d8041426ebc0699ab59628aca1d094380334a
    source_path: platforms/mac/signing.md
    workflow: 15
---

# firma mac (build di debug)

Questa app viene di solito compilata da [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), che ora:

- imposta un identificatore bundle di debug stabile: `ai.openclaw.mac.debug`
- scrive l'Info.plist con quell'id bundle (override tramite `BUNDLE_ID=...`)
- chiama [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) per firmare il binario principale e il bundle dell'app così macOS tratta ogni rebuild come lo stesso bundle firmato e mantiene i permessi TCC (notifiche, accessibilità, registrazione dello schermo, microfono, voce). Per permessi stabili, usa una vera identità di firma; la firma ad-hoc è opzionale e fragile (vedi [permessi macOS](/platforms/mac/permissions)).
- usa `CODESIGN_TIMESTAMP=auto` per impostazione predefinita; abilita timestamp attendibili per le firme Developer ID. Imposta `CODESIGN_TIMESTAMP=off` per saltare il timestamping (build di debug offline).
- inietta metadati di build in Info.plist: `OpenClawBuildTimestamp` (UTC) e `OpenClawGitCommit` (hash breve) così il pannello About può mostrare build, git e canale debug/release.
- **Il packaging usa per impostazione predefinita Node 24**: lo script esegue le build TS e la build della Control UI. Node 22 LTS, attualmente `22.14+`, resta supportato per compatibilità.
- legge `SIGN_IDENTITY` dall'ambiente. Aggiungi `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (o il tuo certificato Developer ID Application) al file rc della shell per firmare sempre con il tuo certificato. La firma ad-hoc richiede adesione esplicita tramite `ALLOW_ADHOC_SIGNING=1` o `SIGN_IDENTITY="-"` (non consigliato per testare i permessi).
- esegue un audit Team ID dopo la firma e fallisce se un qualsiasi Mach-O nel bundle dell'app è firmato con un Team ID diverso. Imposta `SKIP_TEAM_ID_CHECK=1` per bypassare il controllo.

## Utilizzo

```bash
# dalla radice del repository
scripts/package-mac-app.sh               # seleziona automaticamente l'identità; restituisce errore se non ne trova nessuna
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # certificato reale
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (i permessi non resteranno)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # ad-hoc esplicito (stessa avvertenza)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # workaround solo sviluppo per mismatch Team ID di Sparkle
```

### Nota sulla firma ad-hoc

Quando firmi con `SIGN_IDENTITY="-"` (ad-hoc), lo script disabilita automaticamente il **Hardened Runtime** (`--options runtime`). Questo è necessario per evitare crash quando l'app tenta di caricare framework incorporati (come Sparkle) che non condividono lo stesso Team ID. Le firme ad-hoc interrompono anche la persistenza dei permessi TCC; vedi [permessi macOS](/platforms/mac/permissions) per i passaggi di recupero.

## Metadati di build per About

`package-mac-app.sh` applica al bundle:

- `OpenClawBuildTimestamp`: UTC ISO8601 al momento del packaging
- `OpenClawGitCommit`: hash git breve (o `unknown` se non disponibile)

La scheda About legge queste chiavi per mostrare versione, data di build, commit git e se si tratta di una build di debug (tramite `#if DEBUG`). Esegui il packager per aggiornare questi valori dopo modifiche al codice.

## Perché

I permessi TCC sono legati all'identificatore del bundle _e_ alla firma del codice. Le build di debug non firmate con UUID variabili facevano dimenticare a macOS le autorizzazioni dopo ogni rebuild. Firmare i binari (ad‑hoc per impostazione predefinita) e mantenere un id/percorso bundle fisso (`dist/OpenClaw.app`) preserva le autorizzazioni tra una build e l'altra, seguendo l'approccio di VibeTunnel.
