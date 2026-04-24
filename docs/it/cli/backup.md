---
read_when:
    - Vuoi un archivio di backup di prima classe per lo stato locale di OpenClaw
    - Vuoi vedere in anteprima quali percorsi verrebbero inclusi prima di un reset o della disinstallazione
summary: Riferimento CLI per `openclaw backup` (creare archivi di backup locali)
title: Backup
x-i18n:
    generated_at: "2026-04-24T08:32:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88d83cf04c163d76658575aa6d90be1dd7379934fa2822a07e13311c4324f8fd
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
- Se la directory di lavoro corrente si trova all'interno di un albero sorgente sottoposto a backup, OpenClaw usa come fallback la tua home directory per la posizione predefinita dell'archivio.
- I file di archivio esistenti non vengono mai sovrascritti.
- I percorsi di output all'interno degli alberi sorgente di stato/workspace vengono rifiutati per evitare auto-inclusioni.
- `openclaw backup verify <archive>` valida che l'archivio contenga esattamente un manifest root, rifiuta percorsi di archivio in stile traversal e controlla che ogni payload dichiarato nel manifest esista nel tarball.
- `openclaw backup create --verify` esegue questa validazione subito dopo la scrittura dell'archivio.
- `openclaw backup create --only-config` esegue il backup del solo file JSON di configurazione attivo.

## Cosa viene sottoposto a backup

`openclaw backup create` pianifica le sorgenti di backup dall'installazione locale di OpenClaw:

- La directory di stato restituita dal resolver di stato locale di OpenClaw, di solito `~/.openclaw`
- Il percorso del file di configurazione attivo
- La directory `credentials/` risolta, quando esiste fuori dalla directory di stato
- Le directory workspace individuate dalla configurazione corrente, a meno che tu non passi `--no-include-workspace`

I profili di autenticazione del modello fanno già parte della directory di stato in
`agents/<agentId>/agent/auth-profiles.json`, quindi normalmente sono coperti dalla voce
di backup dello stato.

Se usi `--only-config`, OpenClaw salta l'individuazione di stato, directory credenziali e workspace e archivia solo il percorso del file di configurazione attivo.

OpenClaw canonicalizza i percorsi prima di costruire l'archivio. Se la configurazione, la
directory delle credenziali o un workspace si trovano già all'interno della directory di stato,
non vengono duplicati come sorgenti di backup separate di primo livello. I percorsi mancanti vengono
saltati.

Il payload dell'archivio memorizza il contenuto dei file di quegli alberi sorgente, e il file `manifest.json` incorporato registra i percorsi sorgente assoluti risolti insieme al layout dell'archivio usato per ogni risorsa.

## Comportamento con configurazione non valida

`openclaw backup` aggira intenzionalmente il normale preflight della configurazione così può comunque essere utile durante il recupero. Poiché l'individuazione dei workspace dipende da una configurazione valida, `openclaw backup create` ora fallisce subito quando il file di configurazione esiste ma non è valido e il backup dei workspace è ancora abilitato.

Se in quella situazione vuoi comunque un backup parziale, riesegui:

```bash
openclaw backup create --no-include-workspace
```

Questo mantiene nell'ambito stato, configurazione e directory credenziali esterna, saltando
completamente l'individuazione dei workspace.

Se ti serve solo una copia del file di configurazione stesso, anche `--only-config` funziona quando la configurazione è malformata perché non dipende dal parsing della configurazione per l'individuazione dei workspace.

## Dimensioni e prestazioni

OpenClaw non impone un limite massimo incorporato per la dimensione del backup o un limite per file.

I limiti pratici dipendono dalla macchina locale e dal filesystem di destinazione:

- Spazio disponibile per la scrittura temporanea dell'archivio più l'archivio finale
- Tempo necessario per attraversare grandi alberi di workspace e comprimerli in un `.tar.gz`
- Tempo necessario per riesaminare l'archivio se usi `openclaw backup create --verify` o esegui `openclaw backup verify`
- Comportamento del filesystem nel percorso di destinazione. OpenClaw preferisce un passaggio di pubblicazione con hard link senza sovrascrittura e ripiega su una copia esclusiva quando gli hard link non sono supportati

I workspace grandi sono di solito il principale fattore che determina la dimensione dell'archivio. Se vuoi un backup più piccolo o più veloce, usa `--no-include-workspace`.

Per l'archivio più piccolo, usa `--only-config`.

## Correlati

- [Riferimento CLI](/it/cli)
