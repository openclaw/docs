---
read_when:
    - Spiegazione di cos'è ClawHub
    - Ricerca, installazione o aggiornamento di Skills o Plugin
    - Pubblicazione di Skills o Plugin nel registro
    - Scelta tra i flussi CLI di OpenClaw e ClawHub
sidebarTitle: ClawHub
summary: Panoramica pubblica di ClawHub per la scoperta, l'installazione, la pubblicazione, la sicurezza e la CLI di clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-12T06:54:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub è il registro pubblico per le Skills e i Plugin di OpenClaw.

- Usa i comandi nativi di `openclaw` per cercare, installare e aggiornare le Skills e per installare i Plugin da ClawHub.
- Usa la CLI `clawhub` separata per l'autenticazione al registro, la pubblicazione e i flussi di eliminazione/ripristino.

Sito: [clawhub.ai](https://clawhub.ai)

## Avvio rapido

Cerca e installa le Skills con OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Cerca e installa i Plugin con OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Installa la CLI di ClawHub quando vuoi usare flussi autenticati nel registro, come
la pubblicazione o l'eliminazione e il ripristino:

```bash
npm i -g clawhub
# oppure
pnpm add -g clawhub
```

## Contenuti ospitati da ClawHub

| Superficie      | Contenuto archiviato                                           | Comando tipico                                |
| --------------- | -------------------------------------------------------------- | --------------------------------------------- |
| Skills          | Pacchetti di testo con versione, contenenti `SKILL.md` e file di supporto | `openclaw skills install @openclaw/demo`     |
| Plugin di codice | Pacchetti Plugin di OpenClaw con metadati di compatibilità     | `openclaw plugins install clawhub:<package>` |
| Plugin in bundle | Bundle di Plugin pacchettizzati per la distribuzione di OpenClaw | `clawhub package publish <source>`           |

ClawHub tiene traccia delle versioni semver, dei tag come `latest`, dei registri
delle modifiche, dei file, dei download, delle stelle e dei riepiloghi delle
scansioni di sicurezza. Le pagine pubbliche mostrano lo stato corrente del
registro, consentendo agli utenti di esaminare una Skill o un Plugin prima
dell'installazione.

## Flussi nativi di OpenClaw

I comandi nativi di OpenClaw eseguono l'installazione nello spazio di lavoro
OpenClaw attivo e conservano i metadati della sorgente, in modo che i successivi
comandi di aggiornamento possano continuare a usare ClawHub.

Usa `clawhub:<package>` quando l'installazione di un Plugin deve essere risolta
tramite ClawHub. Le specifiche semplici dei Plugin compatibili con npm possono
essere risolte tramite npm durante le transizioni di rilascio, mentre
`npm:<package>` usa esclusivamente npm quando la sorgente deve essere esplicita.

Le installazioni dei Plugin convalidano la compatibilità dichiarata di
`pluginApi` e `minGatewayVersion` prima di procedere con l'installazione
dell'archivio. Quando una versione del pacchetto pubblica un artefatto ClawPack,
OpenClaw preferisce il file `.tgz` esatto caricato tramite npm pack, verifica
l'intestazione del digest di ClawHub e i byte scaricati e registra i metadati
dell'artefatto per gli aggiornamenti successivi.

## CLI di ClawHub

La CLI di ClawHub è destinata alle operazioni autenticate nel registro:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

La CLI include anche comandi per installare e aggiornare le Skills nei flussi
diretti con il registro:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Questi comandi installano le Skills in `./skills` nella directory di lavoro
corrente e registrano le versioni installate in `.clawhub/lock.json`.

## Pubblicazione

Pubblica le Skills da una cartella locale contenente `SKILL.md`:

```bash
clawhub skill publish <path>
```

Opzioni di pubblicazione comuni:

- `--slug <slug>`: nome della Skill nell'URL pubblicato.
- `--name <name>`: nome visualizzato.
- `--version <version>`: versione semver.
- `--changelog <text>`: testo del registro delle modifiche.
- `--tags <tags>`: tag separati da virgole; il valore predefinito è `latest`.

Pubblica i Plugin da una cartella locale, da `owner/repo`, da `owner/repo@ref` o
da un URL GitHub:

```bash
clawhub package publish <source>
```

Usa `--dry-run` per generare il piano di pubblicazione esatto senza caricare
alcun file e `--json` per un output adatto alla CI.

I Plugin di codice devono includere in `package.json` i metadati di compatibilità
OpenClaw richiesti, inclusi `openclaw.compat.pluginApi` e
`openclaw.build.openclawVersion`. Consulta [CLI](/it/clawhub/cli) per il riferimento
completo dei comandi e [Formato delle Skill](/clawhub/skill-format) per i metadati
delle Skills.

## Sicurezza e moderazione

ClawHub è aperto per impostazione predefinita: chiunque può caricare contenuti,
ma la pubblicazione richiede un account GitHub sufficientemente vecchio da
superare il controllo per il caricamento. Prima dell'installazione o del
download, le pagine pubbliche dei dettagli riepilogano lo stato della scansione
più recente.

ClawHub esegue controlli automatici sulle Skills pubblicate e sulle versioni dei
Plugin. Le versioni trattenute dalla scansione o bloccate possono scomparire dal
catalogo pubblico e dalle superfici di installazione, pur rimanendo visibili al
proprietario in `/dashboard`.

Gli utenti che hanno effettuato l'accesso possono segnalare Skills e pacchetti.
I moderatori possono esaminare le segnalazioni, nascondere o ripristinare i
contenuti e bloccare gli account responsabili di abusi. Consulta
[Sicurezza](/clawhub/security),
[Controlli di sicurezza](/it/clawhub/security-audits),
[Moderazione e sicurezza degli account](/clawhub/moderation) e
[Utilizzo accettabile](/clawhub/acceptable-usage) per i dettagli sulle norme e
sulla loro applicazione.

## Telemetria e ambiente

Quando esegui `clawhub install` dopo aver effettuato l'accesso, la CLI può inviare
un evento di installazione senza garanzia di consegna, in modo che ClawHub possa
calcolare il numero aggregato di installazioni. Disabilita questa funzione con:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Variabili di ambiente utili per la sostituzione dei valori predefiniti:

| Variabile                     | Effetto                                                    |
| ----------------------------- | ---------------------------------------------------------- |
| `CLAWHUB_SITE`                | Sostituisce l'URL del sito usato per l'accesso dal browser. |
| `CLAWHUB_REGISTRY`            | Sostituisce l'URL dell'API del registro.                    |
| `CLAWHUB_CONFIG_PATH`         | Sostituisce il percorso in cui la CLI archivia lo stato del token e della configurazione. |
| `CLAWHUB_WORKDIR`             | Sostituisce la directory di lavoro predefinita.             |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Disabilita la telemetria delle installazioni.               |

Consulta [Telemetria](/it/clawhub/telemetry), [API HTTP](/clawhub/http-api) e
[Risoluzione dei problemi](/clawhub/troubleshooting) per materiale di riferimento
più approfondito.
