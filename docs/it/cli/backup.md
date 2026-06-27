---
read_when:
    - Vuoi un archivio di backup di prima classe per lo stato locale di OpenClaw
    - Vuoi visualizzare in anteprima quali percorsi sarebbero inclusi prima del reset o della disinstallazione
summary: Riferimento CLI per `openclaw backup` (crea archivi di backup locali)
title: Backup
x-i18n:
    generated_at: "2026-06-27T17:18:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ac7d8e4babd24f1c46ac48dca6c413e12361173df83cfe485dd3945ccd30c3e
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Crea un archivio di backup locale per stato, configurazione, profili di autenticazione, credenziali di canali/provider, sessioni e, facoltativamente, aree di lavoro di OpenClaw.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
```

## Note

- L'archivio include un file `manifest.json` con i percorsi di origine risolti e la struttura dell'archivio.
- L'output predefinito è un archivio `.tar.gz` con timestamp nella directory di lavoro corrente.
- I nomi dei file di backup con timestamp usano il fuso orario locale della macchina e includono l'offset UTC.
- Se la directory di lavoro corrente si trova dentro un albero di origine sottoposto a backup, OpenClaw ripiega sulla directory home per la posizione predefinita dell'archivio.
- I file di archivio esistenti non vengono mai sovrascritti.
- I percorsi di output all'interno degli alberi di stato/area di lavoro di origine vengono rifiutati per evitare l'auto-inclusione.
- `openclaw backup verify <archive>` verifica che l'archivio contenga esattamente un manifest radice, rifiuta percorsi di archivio in stile traversal e controlla che ogni payload dichiarato dal manifest esista nel tarball.
- `openclaw backup create --verify` esegue quella verifica subito dopo aver scritto l'archivio.
- `openclaw backup create --only-config` esegue il backup solo del file di configurazione JSON attivo.

## Cosa viene sottoposto a backup

`openclaw backup create` pianifica le origini del backup dalla tua installazione locale di OpenClaw:

- La directory di stato restituita dal resolver dello stato locale di OpenClaw, di solito `~/.openclaw`
- Il percorso del file di configurazione attivo
- La directory `credentials/` risolta quando esiste fuori dalla directory di stato
- Le directory delle aree di lavoro rilevate dalla configurazione corrente, a meno che tu non passi `--no-include-workspace`

I profili di autenticazione dei modelli fanno già parte della directory di stato sotto
`agents/<agentId>/agent/auth-profiles.json`, quindi normalmente sono coperti dalla
voce di backup dello stato.

Se usi `--only-config`, OpenClaw salta il rilevamento di stato, directory delle credenziali e aree di lavoro, e archivia solo il percorso del file di configurazione attivo.

OpenClaw canonicalizza i percorsi prima di creare l'archivio. Se la configurazione,
la directory delle credenziali o un'area di lavoro si trovano già dentro la directory di stato,
non vengono duplicati come origini di backup di primo livello separate. I percorsi mancanti
vengono saltati.

Il payload dell'archivio memorizza i contenuti dei file da quegli alberi di origine, e il `manifest.json` incorporato registra i percorsi di origine assoluti risolti più la struttura dell'archivio usata per ciascun asset.

Durante la creazione dell'archivio, OpenClaw salta i file noti soggetti a mutazioni live che non hanno valore di ripristino, inclusi trascritti di sessioni agente attive, log di esecuzioni Cron, log a rotazione, code di consegna, file socket/pid/temporanei sotto la directory di stato e relativi file temporanei di code durevoli. Il risultato JSON include `skippedVolatileCount` così l'automazione può vedere quanti file sono stati omessi intenzionalmente.

I file sorgente e manifest dei Plugin installati sotto l'albero
`extensions/` della directory di stato sono inclusi, ma i loro alberi di dipendenze
`node_modules/` annidati vengono saltati. Quelle dipendenze sono artefatti di installazione ricostruibili; dopo
aver ripristinato un archivio, usa `openclaw plugins update <id>` o reinstalla il Plugin
con `openclaw plugins install <spec> --force` quando un Plugin ripristinato segnala
dipendenze mancanti.

## Comportamento con configurazione non valida

`openclaw backup` aggira intenzionalmente il normale preflight della configurazione così può essere ancora utile durante il recupero. Poiché il rilevamento delle aree di lavoro dipende da una configurazione valida, `openclaw backup create` ora fallisce rapidamente quando il file di configurazione esiste ma non è valido e il backup delle aree di lavoro è ancora abilitato.

Se vuoi comunque un backup parziale in quella situazione, riesegui:

```bash
openclaw backup create --no-include-workspace
```

Questo mantiene in ambito stato, configurazione e directory delle credenziali esterna, saltando completamente
il rilevamento delle aree di lavoro.

Se ti serve solo una copia del file di configurazione stesso, anche `--only-config` funziona quando la configurazione è malformata, perché non si basa sull'analisi della configurazione per il rilevamento delle aree di lavoro.

## Dimensioni e prestazioni

OpenClaw non impone una dimensione massima di backup integrata né un limite di dimensione per file.

I limiti pratici derivano dalla macchina locale e dal filesystem di destinazione:

- Spazio disponibile per la scrittura dell'archivio temporaneo più l'archivio finale
- Tempo necessario per attraversare grandi alberi di aree di lavoro e comprimerli in un `.tar.gz`
- Tempo necessario per riesaminare l'archivio se usi `openclaw backup create --verify` o esegui `openclaw backup verify`
- Comportamento del filesystem nel percorso di destinazione. OpenClaw preferisce un passaggio di pubblicazione con hard link senza sovrascrittura e ripiega su una copia esclusiva quando gli hard link non sono supportati

Le aree di lavoro grandi sono di solito il principale fattore della dimensione dell'archivio. Se vuoi un backup più piccolo o più rapido, usa `--no-include-workspace`.

Per l'archivio più piccolo, usa `--only-config`.

## Correlati

- [Riferimento CLI](/it/cli)
