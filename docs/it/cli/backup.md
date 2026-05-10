---
read_when:
    - Vuoi un archivio di backup di prima classe per lo stato locale di OpenClaw
    - Vuoi visualizzare in anteprima quali percorsi verrebbero inclusi prima della reimpostazione o della disinstallazione
summary: Riferimento CLI per `openclaw backup` (crea archivi di backup locali)
title: Copia di sicurezza
x-i18n:
    generated_at: "2026-05-10T19:27:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c95cf475a563ad4f0a2dbaeda504b265580545c9d3f6f71d2f4d2a183e76a5c
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Crea un archivio di backup locale per stato, configurazione, profili di autenticazione, credenziali di canali/provider, sessioni e, facoltativamente, workspace di OpenClaw.

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

- L'archivio include un file `manifest.json` con i percorsi sorgente risolti e il layout dell'archivio.
- L'output predefinito è un archivio `.tar.gz` con timestamp nella directory di lavoro corrente.
- Se la directory di lavoro corrente si trova all'interno di un albero sorgente sottoposto a backup, OpenClaw usa come fallback la tua home directory per la posizione predefinita dell'archivio.
- I file di archivio esistenti non vengono mai sovrascritti.
- I percorsi di output all'interno degli alberi di stato/workspace sorgente vengono rifiutati per evitare l'auto-inclusione.
- `openclaw backup verify <archive>` convalida che l'archivio contenga esattamente un manifest radice, rifiuta i percorsi di archivio in stile attraversamento e verifica che ogni payload dichiarato dal manifest esista nel tarball.
- `openclaw backup create --verify` esegue quella convalida subito dopo aver scritto l'archivio.
- `openclaw backup create --only-config` esegue il backup solo del file di configurazione JSON attivo.

## Cosa viene incluso nel backup

`openclaw backup create` pianifica le sorgenti di backup dalla tua installazione locale di OpenClaw:

- La directory di stato restituita dal resolver dello stato locale di OpenClaw, di solito `~/.openclaw`
- Il percorso del file di configurazione attivo
- La directory `credentials/` risolta quando esiste al di fuori della directory di stato
- Le directory dei workspace rilevate dalla configurazione corrente, a meno che tu non passi `--no-include-workspace`

I profili di autenticazione dei modelli fanno già parte della directory di stato in
`agents/<agentId>/agent/auth-profiles.json`, quindi normalmente sono coperti dalla
voce di backup dello stato.

Se usi `--only-config`, OpenClaw salta il rilevamento di stato, directory delle credenziali e workspace e archivia solo il percorso del file di configurazione attivo.

OpenClaw canonicalizza i percorsi prima di creare l'archivio. Se la configurazione,
la directory delle credenziali o un workspace si trovano già all'interno della directory di stato,
non vengono duplicati come sorgenti di backup di primo livello separate. I percorsi mancanti vengono
saltati.

Il payload dell'archivio memorizza il contenuto dei file da quegli alberi sorgente e il `manifest.json` incorporato registra i percorsi sorgente assoluti risolti più il layout dell'archivio usato per ogni risorsa.

Durante la creazione dell'archivio, OpenClaw salta i file noti soggetti a mutazioni live che non hanno valore di ripristino, inclusi transcript delle sessioni agente attive, log di esecuzione Cron, log rotativi, code di consegna, file socket/pid/temp nella directory di stato e file temporanei correlati delle code durevoli. Il risultato JSON include `skippedVolatileCount`, così l'automazione può vedere quanti file sono stati omessi intenzionalmente.

I sorgenti dei Plugin installati e i file manifest sotto l'albero
`extensions/` della directory di stato sono inclusi, ma i rispettivi alberi di dipendenze
`node_modules/` annidati vengono saltati. Quelle dipendenze sono artefatti di installazione ricostruibili; dopo
il ripristino di un archivio, usa `openclaw plugins update <id>` oppure reinstalla il Plugin
con `openclaw plugins install <spec> --force` quando un Plugin ripristinato segnala
dipendenze mancanti.

## Comportamento con configurazione non valida

`openclaw backup` aggira intenzionalmente il normale preflight della configurazione, così può comunque aiutare durante il ripristino. Poiché il rilevamento dei workspace dipende da una configurazione valida, `openclaw backup create` ora fallisce rapidamente quando il file di configurazione esiste ma non è valido e il backup dei workspace è ancora abilitato.

Se in quella situazione vuoi comunque un backup parziale, riesegui:

```bash
openclaw backup create --no-include-workspace
```

Questo mantiene nell'ambito stato, configurazione e directory delle credenziali esterna, saltando
completamente il rilevamento dei workspace.

Se ti serve solo una copia del file di configurazione stesso, anche `--only-config` funziona quando la configurazione è malformata, perché non si basa sull'analisi della configurazione per il rilevamento dei workspace.

## Dimensioni e prestazioni

OpenClaw non impone un limite massimo integrato alla dimensione del backup né un limite di dimensione per file.

I limiti pratici derivano dalla macchina locale e dal filesystem di destinazione:

- Spazio disponibile per la scrittura dell'archivio temporaneo più l'archivio finale
- Tempo per attraversare grandi alberi di workspace e comprimerli in un `.tar.gz`
- Tempo per riesaminare l'archivio se usi `openclaw backup create --verify` o esegui `openclaw backup verify`
- Comportamento del filesystem nel percorso di destinazione. OpenClaw preferisce un passaggio di pubblicazione tramite hard link senza sovrascrittura e usa come fallback una copia esclusiva quando gli hard link non sono supportati

I workspace di grandi dimensioni sono di solito il principale fattore della dimensione dell'archivio. Se vuoi un backup più piccolo o più veloce, usa `--no-include-workspace`.

Per l'archivio più piccolo, usa `--only-config`.

## Correlati

- [Riferimento CLI](/it/cli)
