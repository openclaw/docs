---
read_when:
    - Creazione o firma di build di debug per Mac
summary: Passaggi di firma per le build di debug macOS generate dagli script di pacchettizzazione
title: Firma per macOS
x-i18n:
    generated_at: "2026-07-12T07:12:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 663c08c031417d5a9f048581421e4fe9f69480917582f74746af675bcca5cf95
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Firma per macOS (build di debug)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) compila e crea il pacchetto dell'app in un percorso fisso (`dist/OpenClaw.app`), quindi richiama [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) per firmarlo. Le autorizzazioni TCC sono associate all'ID del bundle e alla firma del codice; mantenere entrambi stabili (e l'app in un percorso fisso) tra le ricompilazioni impedisce a macOS di dimenticare le autorizzazioni TCC concesse (notifiche, accessibilità, registrazione dello schermo, microfono, riconoscimento vocale).

- L'identificatore del bundle di debug è, per impostazione predefinita, `ai.openclaw.mac.debug` (sovrascrivibile con `BUNDLE_ID=...`).
- Node: `>=22.19.0 <23` oppure `>=23.11.0` (`engines` nel file `package.json` del repository). Lo strumento di creazione del pacchetto compila anche l'interfaccia di controllo (`pnpm ui:build`).
- Per impostazione predefinita richiede un'identità di firma reale; lo script di firma termina con un errore se non ne viene trovata alcuna e `ALLOW_ADHOC_SIGNING` non è impostata. La firma ad hoc (`SIGN_IDENTITY="-"`) richiede un'abilitazione esplicita e non mantiene le autorizzazioni TCC tra le ricompilazioni. Consulta [Autorizzazioni di macOS](/it/platforms/mac/permissions).
- Legge `SIGN_IDENTITY` dall'ambiente (ad esempio `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` oppure un certificato Developer ID Application). Se non è impostata, `codesign-mac-app.sh` seleziona automaticamente un'identità in quest'ordine: Developer ID Application, Apple Distribution, Apple Development, quindi la prima identità valida per la firma del codice trovata.
- `CODESIGN_TIMESTAMP=auto` (impostazione predefinita) abilita le marche temporali attendibili solo per le firme Developer ID Application. Imposta `on`/`off` per forzare rispettivamente l'abilitazione o la disabilitazione.
- Aggiunge a Info.plist `OpenClawBuildTimestamp` (ISO8601 UTC) e `OpenClawGitCommit` (hash breve, `unknown` se non disponibile), in modo che la scheda Informazioni possa mostrare la build, il commit Git e il canale di debug/rilascio.
- Esegue una verifica del Team ID dopo la firma e non riesce se un qualsiasi file Mach-O all'interno del bundle presenta un Team ID diverso. Imposta `SKIP_TEAM_ID_CHECK=1` per ignorare la verifica.

## Utilizzo

```bash
# dalla radice del repository
scripts/package-mac-app.sh                                                      # seleziona automaticamente l'identità; genera un errore se non ne trova nessuna
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # certificato reale
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # ad hoc (le autorizzazioni non verranno mantenute)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # ad hoc esplicita (stessa avvertenza)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # soluzione alternativa solo per lo sviluppo in caso di mancata corrispondenza del Team ID di Sparkle
```

### Nota sulla firma ad hoc

`SIGN_IDENTITY="-"` disabilita Hardened Runtime (`--options runtime`) per evitare arresti anomali quando l'app carica framework incorporati (come Sparkle) che non condividono lo stesso Team ID. Le firme ad hoc impediscono inoltre la persistenza delle autorizzazioni TCC; consulta [Autorizzazioni di macOS](/it/platforms/mac/permissions) per la procedura di ripristino.

## Metadati della build per la scheda Informazioni

La scheda Informazioni legge `OpenClawBuildTimestamp` e `OpenClawGitCommit` da Info.plist per mostrare la versione, la data della build, il commit Git e se si tratta di una build DEBUG (tramite `#if DEBUG`). Esegui nuovamente lo strumento di creazione del pacchetto dopo le modifiche al codice per aggiornare questi valori.

## Contenuti correlati

- [App per macOS](/it/platforms/macos)
- [Autorizzazioni di macOS](/it/platforms/mac/permissions)
