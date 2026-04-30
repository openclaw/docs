---
read_when:
    - Vuoi un archivio di backup di prima classe per lo stato locale di OpenClaw
    - Vuoi visualizzare in anteprima quali percorsi sarebbero inclusi prima del ripristino o della disinstallazione
summary: Riferimento CLI per `openclaw backup` (crea archivi di backup locali)
title: Copia di sicurezza
x-i18n:
    generated_at: "2026-04-30T08:41:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c16f953bb32a1613181448f0e4c6ba8777383bce95bddc856dc7e1c3afe8550
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Crea un archivio di backup locale per stato, configurazione, profili di autenticazione, credenziali di canali/provider, sessioni e, opzionalmente, workspace di OpenClaw.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## Note

- L'archivio include un file `manifest.json` con i percorsi sorgente risolti e la struttura dell'archivio.
- L'output predefinito è un archivio `.tar.gz` con timestamp nella directory di lavoro corrente.
- Se la directory di lavoro corrente si trova dentro un albero sorgente sottoposto a backup, OpenClaw ripiega sulla directory home per la posizione predefinita dell'archivio.
- I file di archivio esistenti non vengono mai sovrascritti.
- I percorsi di output dentro gli alberi sorgente dello stato/workspace vengono rifiutati per evitare l'auto-inclusione.
- `openclaw backup verify <archive>` verifica che l'archivio contenga esattamente un manifest radice, rifiuta i percorsi di archivio in stile attraversamento e controlla che ogni payload dichiarato nel manifest esista nel tarball.
- `openclaw backup create --verify` esegue tale verifica subito dopo la scrittura dell'archivio.
- `openclaw backup create --only-config` esegue il backup solo del file di configurazione JSON attivo.

## Elementi sottoposti a backup

`openclaw backup create` pianifica le sorgenti di backup dalla tua installazione locale di OpenClaw:

- La directory di stato restituita dal resolver dello stato locale di OpenClaw, di solito `~/.openclaw`
- Il percorso del file di configurazione attivo
- La directory `credentials/` risolta quando esiste fuori dalla directory di stato
- Le directory dei workspace individuate dalla configurazione corrente, a meno che non passi `--no-include-workspace`

I profili di autenticazione dei modelli fanno già parte della directory di stato sotto
`agents/<agentId>/agent/auth-profiles.json`, quindi normalmente sono coperti dalla voce
di backup dello stato.

Se usi `--only-config`, OpenClaw salta l'individuazione dello stato, della directory delle credenziali e dei workspace e archivia solo il percorso del file di configurazione attivo.

OpenClaw canonicalizza i percorsi prima di creare l'archivio. Se la configurazione, la
directory delle credenziali o un workspace si trovano già dentro la directory di stato,
non vengono duplicati come sorgenti di backup di primo livello separate. I percorsi mancanti vengono
saltati.

Il payload dell'archivio memorizza i contenuti dei file provenienti da quegli alberi sorgente, e il `manifest.json` incorporato registra i percorsi sorgente assoluti risolti più la struttura dell'archivio usata per ogni asset.

I file sorgente e manifest dei Plugin installati sotto l'albero
`extensions/` della directory di stato sono inclusi, ma i loro alberi di dipendenze
`node_modules/` annidati vengono saltati. Quelle dipendenze sono artefatti di installazione ricostruibili; dopo
aver ripristinato un archivio, usa `openclaw plugins update <id>` oppure reinstalla il Plugin
con `openclaw plugins install <spec> --force` quando un Plugin ripristinato segnala
dipendenze mancanti.

## Comportamento con configurazione non valida

`openclaw backup` aggira intenzionalmente il normale preflight della configurazione, così può ancora essere utile durante il recupero. Poiché l'individuazione dei workspace dipende da una configurazione valida, `openclaw backup create` ora fallisce rapidamente quando il file di configurazione esiste ma non è valido e il backup dei workspace è ancora abilitato.

Se in quella situazione vuoi comunque un backup parziale, riesegui:

```bash
openclaw backup create --no-include-workspace
```

Questo mantiene nell'ambito stato, configurazione e directory esterna delle credenziali, saltando
completamente l'individuazione dei workspace.

Se ti serve solo una copia del file di configurazione stesso, anche `--only-config` funziona quando la configurazione è malformata perché non si basa sul parsing della configurazione per individuare i workspace.

## Dimensioni e prestazioni

OpenClaw non impone una dimensione massima di backup integrata né un limite di dimensione per file.

I limiti pratici derivano dalla macchina locale e dal filesystem di destinazione:

- Spazio disponibile per la scrittura temporanea dell'archivio più l'archivio finale
- Tempo necessario per attraversare grandi alberi di workspace e comprimerli in un `.tar.gz`
- Tempo necessario per riesaminare l'archivio se usi `openclaw backup create --verify` o esegui `openclaw backup verify`
- Comportamento del filesystem nel percorso di destinazione. OpenClaw preferisce un passaggio di pubblicazione tramite hard link senza sovrascrittura e ripiega sulla copia esclusiva quando gli hard link non sono supportati

I workspace di grandi dimensioni sono di solito il principale fattore della dimensione dell'archivio. Se vuoi un backup più piccolo o più veloce, usa `--no-include-workspace`.

Per l'archivio più piccolo, usa `--only-config`.

## Correlati

- [Riferimento CLI](/it/cli)
