---
read_when:
    - Vuoi un archivio di backup di prima classe per lo stato locale di OpenClaw
    - Vuoi vedere in anteprima quali percorsi verrebbero inclusi prima di un reset o di una disinstallazione
summary: Riferimento CLI per `openclaw backup` (creare archivi di backup locali)
title: backup
x-i18n:
    generated_at: "2026-04-05T13:46:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 700eda8f9eac1cc93a854fa579f128e5e97d4e6dfc0da75b437c0fb2a898a37d
    source_path: cli/backup.md
    workflow: 15
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
- Se la directory di lavoro corrente si trova all'interno di un albero sorgente sottoposto a backup, OpenClaw usa come fallback la directory home per il percorso predefinito dell'archivio.
- I file di archivio esistenti non vengono mai sovrascritti.
- I percorsi di output all'interno degli alberi sorgente di stato/workspace vengono rifiutati per evitare l'auto-inclusione.
- `openclaw backup verify <archive>` convalida che l'archivio contenga esattamente un manifest radice, rifiuta percorsi di archivio in stile traversal e verifica che ogni payload dichiarato nel manifest esista nel tarball.
- `openclaw backup create --verify` esegue quella convalida immediatamente dopo la scrittura dell'archivio.
- `openclaw backup create --only-config` esegue il backup solo del file di configurazione JSON attivo.

## Cosa viene sottoposto a backup

`openclaw backup create` pianifica le sorgenti del backup a partire dalla tua installazione locale di OpenClaw:

- La directory di stato restituita dal resolver dello stato locale di OpenClaw, di solito `~/.openclaw`
- Il percorso del file di configurazione attivo
- La directory `credentials/` risolta quando esiste al di fuori della directory di stato
- Le directory workspace rilevate dalla configurazione corrente, a meno che tu non passi `--no-include-workspace`

I profili di autenticazione del modello fanno già parte della directory di stato in
`agents/<agentId>/agent/auth-profiles.json`, quindi normalmente sono coperti dalla
voce di backup dello stato.

Se usi `--only-config`, OpenClaw salta il rilevamento di stato, directory credenziali e workspace e archivia solo il percorso del file di configurazione attivo.

OpenClaw canonicalizza i percorsi prima di creare l'archivio. Se la configurazione, la
directory delle credenziali o un workspace si trovano già all'interno della directory di stato,
non vengono duplicati come sorgenti di backup top-level separate. I percorsi mancanti vengono
saltati.

Il payload dell'archivio memorizza il contenuto dei file di questi alberi sorgente, e il `manifest.json` incorporato registra i percorsi sorgente assoluti risolti più il layout dell'archivio usato per ogni asset.

## Comportamento con configurazione non valida

`openclaw backup` bypassa intenzionalmente il normale preflight della configurazione in modo da poter essere comunque utile durante il ripristino. Poiché il rilevamento dei workspace dipende da una configurazione valida, `openclaw backup create` ora fallisce rapidamente quando il file di configurazione esiste ma non è valido e il backup dei workspace è ancora abilitato.

Se in quella situazione vuoi comunque un backup parziale, riesegui:

```bash
openclaw backup create --no-include-workspace
```

Questo mantiene nell'ambito stato, configurazione e directory credenziali esterna, saltando
completamente il rilevamento dei workspace.

Se ti serve solo una copia del file di configurazione stesso, anche `--only-config` funziona quando la configurazione è malformata perché non dipende dal parsing della configurazione per il rilevamento dei workspace.

## Dimensioni e prestazioni

OpenClaw non applica un limite massimo integrato per le dimensioni del backup né un limite per-file.

I limiti pratici dipendono dalla macchina locale e dal filesystem di destinazione:

- Spazio disponibile per la scrittura temporanea dell'archivio più l'archivio finale
- Tempo necessario per attraversare grandi alberi workspace e comprimerli in un `.tar.gz`
- Tempo necessario per riesaminare l'archivio se usi `openclaw backup create --verify` o esegui `openclaw backup verify`
- Comportamento del filesystem nel percorso di destinazione. OpenClaw preferisce un passaggio di pubblicazione tramite hard link senza sovrascrittura e usa come fallback una copia esclusiva quando gli hard link non sono supportati

I workspace di grandi dimensioni sono di solito il principale fattore che incide sulla dimensione dell'archivio. Se vuoi un backup più piccolo o più veloce, usa `--no-include-workspace`.

Per l'archivio più piccolo, usa `--only-config`.
