---
read_when:
    - Spiegazione di che cos'è ClawHub
    - Ricerca, installazione o aggiornamento di Skills o Plugin
    - Pubblicazione di Skills o Plugin nel registro
    - Scelta tra i flussi CLI di OpenClaw e ClawHub
sidebarTitle: ClawHub
summary: Panoramica pubblica di ClawHub per ricerca, installazione, pubblicazione, sicurezza e CLI `clawhub`.
title: ClawHub
x-i18n:
    generated_at: "2026-07-16T13:57:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub è il registro pubblico per Skills e Plugin di OpenClaw.

- Utilizzare i comandi nativi `openclaw` per cercare, installare e aggiornare le Skills e per installare i Plugin da ClawHub.
- Utilizzare la CLI separata `clawhub` per l'autenticazione al registro, la pubblicazione e i flussi di eliminazione/ripristino.

Sito: [clawhub.ai](https://clawhub.ai)

## Avvio rapido

Cercare e installare le Skills con OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Cercare e installare i Plugin con OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Installare la CLI di ClawHub quando servono flussi autenticati nel registro, come
la pubblicazione o l'eliminazione/ripristino:

```bash
npm i -g clawhub
# oppure
pnpm add -g clawhub
```

## Contenuti ospitati da ClawHub

| Superficie             | Contenuto archiviato                                          | Comando tipico                                |
| ---------------------- | ------------------------------------------------------------- | --------------------------------------------- |
| Skills                 | Pacchetti di testo con versioni, contenenti `SKILL.md` e file di supporto | `openclaw skills install @openclaw/demo`     |
| Plugin di codice       | Pacchetti Plugin di OpenClaw con metadati di compatibilità    | `openclaw plugins install clawhub:<package>` |
| Plugin in pacchetto    | Pacchetti Plugin confezionati per la distribuzione OpenClaw   | `clawhub package publish <source>`           |

ClawHub tiene traccia delle versioni semver, dei tag come `latest`, dei registri delle modifiche, dei file,
dei download, delle stelle e dei riepiloghi delle scansioni di sicurezza. Le pagine pubbliche mostrano lo stato corrente del registro,
in modo che sia possibile esaminare una Skill o un Plugin prima di installarlo.

## Flussi nativi di OpenClaw

I comandi nativi di OpenClaw eseguono l'installazione nell'area di lavoro OpenClaw attiva e conservano
i metadati della sorgente, consentendo ai successivi comandi di aggiornamento di continuare a utilizzare ClawHub.

Utilizzare `clawhub:<package>` quando l'installazione di un Plugin deve essere risolta tramite ClawHub.
Le specifiche di Plugin semplici e compatibili con npm possono essere risolte tramite npm durante le transizioni di lancio, mentre
`npm:<package>` rimane riservato a npm quando la sorgente deve essere esplicita.

Prima dell'installazione dell'archivio, le installazioni dei Plugin convalidano la compatibilità dichiarata
da `pluginApi` e `minGatewayVersion`. Quando una versione del pacchetto pubblica un artefatto
ClawPack, OpenClaw preferisce l'esatto `.tgz` npm-pack caricato, verifica
l'intestazione del digest di ClawHub e i byte scaricati e registra i metadati dell'artefatto per
gli aggiornamenti successivi.

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

La CLI include anche comandi per installare e aggiornare le Skills tramite flussi diretti del registro:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Questi comandi installano le Skills in `./skills` nella directory di lavoro corrente
e registrano le versioni installate in `.clawhub/lock.json`.

## Pubblicazione

Pubblicare le Skills da una cartella locale contenente `SKILL.md`:

```bash
clawhub skill publish <path>
```

Opzioni di pubblicazione comuni:

- `--slug <slug>`: nome nell'URL della Skill pubblicata.
- `--name <name>`: nome visualizzato.
- `--version <version>`: versione semver.
- `--changelog <text>`: testo del registro delle modifiche.
- `--tags <tags>`: tag separati da virgole, con valore predefinito `latest`.

Pubblicare i Plugin da una cartella locale, `owner/repo`, `owner/repo@ref` o da un URL
GitHub:

```bash
clawhub package publish <source>
```

Utilizzare `--dry-run` per generare l'esatto piano di pubblicazione senza caricare nulla e `--json`
per un output adatto alla CI.

I Plugin di codice devono includere i metadati di compatibilità OpenClaw obbligatori in
`package.json`, inclusi `openclaw.compat.pluginApi` e
`openclaw.build.openclawVersion`. Consultare [CLI](/it/clawhub/cli) per il riferimento completo dei comandi
e [Formato delle Skills](/clawhub/skill-format) per i metadati delle Skills.

## Sicurezza e moderazione

ClawHub è aperto per impostazione predefinita: chiunque può caricare contenuti, ma la pubblicazione richiede un account
GitHub abbastanza vecchio da superare il controllo per il caricamento. Prima dell'installazione o del download, le pagine pubbliche dei dettagli riepilogano
lo stato della scansione più recente.

ClawHub esegue controlli automatici sulle Skills e sulle versioni dei Plugin pubblicate. Le versioni
trattenute dalla scansione o bloccate possono scomparire dal catalogo pubblico e dalle superfici di installazione, pur
rimanendo visibili al proprietario in `/dashboard`.

Gli utenti autenticati possono segnalare Skills e pacchetti. I moderatori possono esaminare le segnalazioni,
nascondere o ripristinare contenuti e bloccare gli account che commettono abusi. Consultare
[Sicurezza](/it/clawhub/security),
[Audit di sicurezza](/clawhub/security-audits),
[Moderazione e sicurezza degli account](/clawhub/moderation) e
[Utilizzo accettabile](/clawhub/acceptable-usage) per i dettagli sulle norme e sulla loro applicazione.

## Telemetria e ambiente

Quando si esegue `clawhub install` dopo aver effettuato l'accesso, la CLI può inviare, secondo il principio del massimo impegno,
un evento di installazione affinché ClawHub possa calcolare il numero aggregato di installazioni. Per disattivarlo:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Variabili di ambiente utili:

| Variabile                     | Effetto                                                    |
| ----------------------------- | ---------------------------------------------------------- |
| `CLAWHUB_SITE`                | Sostituisce l'URL del sito utilizzato per l'accesso tramite browser. |
| `CLAWHUB_REGISTRY`            | Sostituisce l'URL dell'API del registro.                    |
| `CLAWHUB_CONFIG_PATH`         | Sostituisce il percorso in cui la CLI archivia lo stato di token/configurazione. |
| `CLAWHUB_WORKDIR`             | Sostituisce la directory di lavoro predefinita.             |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Disattiva la telemetria delle installazioni.                |

Consultare [Telemetria](/clawhub/telemetry), [API HTTP](/clawhub/http-api) e
[Risoluzione dei problemi](/it/clawhub/troubleshooting) per materiale di riferimento più approfondito.
