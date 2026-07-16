---
read_when:
    - Creazione o firma di build di debug per Mac
summary: Passaggi di firma per le build di debug macOS generate dagli script di pacchettizzazione
title: Firma per macOS
x-i18n:
    generated_at: "2026-07-16T14:34:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 406211dadc9293cf7983e75ae7dd98234f9088351234cf06c33df2f63d1b9b97
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Firma mac (build di debug)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) compila e impacchetta l'app in un percorso fisso (`dist/OpenClaw.app`), quindi richiama [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) per firmarla. Le autorizzazioni TCC sono associate all'ID del bundle e alla firma del codice; mantenere entrambi stabili (e l'app in un percorso fisso) tra le ricompilazioni impedisce a macOS di dimenticare le autorizzazioni TCC concesse (notifiche, accessibilità, registrazione dello schermo, microfono, riconoscimento vocale).

- Per impostazione predefinita, l'identificatore del bundle di debug è `ai.openclaw.mac.debug` (sostituibile con `BUNDLE_ID=...`).
- Node: `>=22.22.3 <23`, `>=24.15.0 <25` o `>=25.9.0` (`package.json` `engines` del repository). Il programma di packaging compila anche l'interfaccia di controllo (`pnpm ui:build`).
- Per impostazione predefinita richiede un'identità di firma reale; lo script di firma del codice termina con un errore se non ne viene trovata alcuna e `ALLOW_ADHOC_SIGNING` non è impostato. La firma ad hoc (`SIGN_IDENTITY="-"`) deve essere abilitata esplicitamente e non mantiene le autorizzazioni TCC tra le ricompilazioni. Consultare [Autorizzazioni di macOS](/it/platforms/mac/permissions).
- Legge `SIGN_IDENTITY` dall'ambiente (ad esempio `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` o un certificato Developer ID Application). In sua assenza, `codesign-mac-app.sh` seleziona automaticamente un'identità nel seguente ordine: Developer ID Application, Apple Distribution, Apple Development, quindi la prima identità di firma del codice valida trovata.
- `CODESIGN_TIMESTAMP=auto` (impostazione predefinita) abilita le marche temporali attendibili solo per le firme Developer ID Application. Impostare `on`/`off` per forzare l'una o l'altra opzione.
- Inserisce in Info.plist `OpenClawBuildTimestamp` (ISO8601 UTC) e `OpenClawGitCommit` (hash breve, `unknown` se non disponibile), affinché la scheda Informazioni possa mostrare la build, il commit Git e il canale di debug/rilascio.
- Esegue una verifica dell'ID team dopo la firma e non riesce se un qualsiasi file Mach-O all'interno del bundle presenta un ID team diverso. Impostare `SKIP_TEAM_ID_CHECK=1` per ignorare la verifica.

## Utilizzo

```bash
# dalla radice del repository
scripts/package-mac-app.sh                                                      # seleziona automaticamente l'identità; restituisce un errore se non ne viene trovata alcuna
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # certificato reale
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # ad hoc (le autorizzazioni non verranno mantenute)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # ad hoc esplicita (stessa avvertenza)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # soluzione alternativa solo per lo sviluppo in caso di mancata corrispondenza dell'ID team di Sparkle
```

### Nota sulla firma ad hoc

`SIGN_IDENTITY="-"` disabilita Hardened Runtime (`--options runtime`) per evitare arresti anomali quando l'app carica framework incorporati (come Sparkle) che non condividono lo stesso ID team. Le firme ad hoc impediscono inoltre la persistenza delle autorizzazioni TCC; consultare [Autorizzazioni di macOS](/it/platforms/mac/permissions) per la procedura di ripristino.

## Metadati della build per Informazioni

La scheda Informazioni legge `OpenClawBuildTimestamp` e `OpenClawGitCommit` da Info.plist per mostrare la versione, la data della build, il commit Git e se la build è DEBUG (tramite `#if DEBUG`). Eseguire nuovamente il programma di packaging dopo le modifiche al codice per aggiornare questi valori.

## Risorse correlate

- [App per macOS](/it/platforms/macos)
- [Autorizzazioni di macOS](/it/platforms/mac/permissions)
