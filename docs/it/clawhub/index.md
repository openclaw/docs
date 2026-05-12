---
read_when:
    - Spiegazione di che cos'è ClawHub
    - Cercare, installare o aggiornare Skills o Plugin
    - Pubblicazione di Skills o Plugin nel registro
    - Scegliere tra i flussi CLI openclaw e clawhub
sidebarTitle: ClawHub
summary: Panoramica pubblica di ClawHub per scoperta, installazione, pubblicazione, sicurezza e la CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T12:49:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub è il registro pubblico per gli Skills e i Plugin di OpenClaw.

- Usa i comandi nativi `openclaw` per cercare, installare e aggiornare gli Skills e per installare Plugin da ClawHub.
- Usa la CLI separata `clawhub` per i flussi di autenticazione del registro, pubblicazione, eliminazione/ripristino e sincronizzazione.

Sito: [clawhub.ai](https://clawhub.ai)

## Avvio rapido

Cerca e installa Skills con OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Cerca e installa Plugin con OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Installa la CLI ClawHub quando vuoi usare flussi autenticati dal registro come
pubblicazione, sincronizzazione o eliminazione/ripristino:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Cosa ospita ClawHub

| Superficie     | Cosa archivia                                                | Comando tipico                              |
| -------------- | ------------------------------------------------------------ | ------------------------------------------ |
| Skills         | Pacchetti di testo versionati con `SKILL.md` e file di supporto | `openclaw skills install <slug>`           |
| Plugin di codice | Pacchetti Plugin OpenClaw con metadati di compatibilità    | `openclaw plugins install clawhub:<package>` |
| Plugin bundle  | Bundle Plugin pacchettizzati per la distribuzione OpenClaw   | `clawhub package publish <source>`         |
| Souls          | Bundle `SOUL.md` mostrati su onlycrabs.ai                    | Flussi di pubblicazione Web e API          |

ClawHub tiene traccia di versioni semver, tag come `latest`, changelog, file,
download, stelle e riepiloghi delle scansioni di sicurezza. Le pagine pubbliche mostrano lo stato corrente del registro
così gli utenti possono esaminare uno Skill o un Plugin prima di installarlo.

## Flussi nativi di OpenClaw

I comandi nativi di OpenClaw installano nell’area di lavoro OpenClaw attiva e persistono
i metadati della sorgente, così i comandi di aggiornamento successivi possono restare su ClawHub.

Usa `clawhub:<package>` quando l’installazione di un Plugin deve risolversi tramite ClawHub.
Le specifiche Plugin compatibili con npm senza prefisso possono risolversi tramite npm durante i passaggi di lancio, mentre
`npm:<package>` resta solo npm quando una sorgente deve essere esplicita.

Le installazioni dei Plugin convalidano la compatibilità dichiarata di `pluginApi` e `minGatewayVersion`
prima dell’installazione dell’archivio. Quando una versione di pacchetto pubblica un artefatto
ClawPack, OpenClaw preferisce il `.tgz` npm-pack esatto caricato, verifica
l’header digest di ClawHub e i byte scaricati, e registra i metadati dell’artefatto per
aggiornamenti successivi.

## CLI ClawHub

La CLI ClawHub serve per il lavoro autenticato dal registro:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub sync --all
```

La CLI dispone anche di comandi di installazione/aggiornamento degli Skills per flussi diretti con il registro:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Questi comandi installano gli Skills in `./skills` sotto la directory di lavoro corrente
e registrano le versioni installate in `.clawhub/lock.json`.

## Pubblicazione

Pubblica Skills da una cartella locale contenente `SKILL.md`:

```bash
clawhub skill publish <path>
```

Opzioni di pubblicazione comuni:

- `--slug <slug>`: slug dello Skill.
- `--name <name>`: nome visualizzato.
- `--version <version>`: versione semver.
- `--changelog <text>`: testo del changelog.
- `--tags <tags>`: tag separati da virgole, predefiniti su `latest`.

Pubblica Plugin da una cartella locale, `owner/repo`, `owner/repo@ref` o un URL
GitHub:

```bash
clawhub package publish <source>
```

Usa `--dry-run` per generare il piano di pubblicazione esatto senza caricare nulla, e `--json`
per un output adatto alla CI.

I Plugin di codice devono includere i metadati di compatibilità OpenClaw richiesti in
`package.json`, inclusi `openclaw.compat.pluginApi` e
`openclaw.build.openclawVersion`. Vedi [CLI](/it/clawhub/cli) per il riferimento completo dei comandi
e [Formato degli Skills](/it/clawhub/skill-format) per i metadati degli Skills.

## Sicurezza e moderazione

ClawHub è aperto per impostazione predefinita: chiunque può caricare contenuti, ma la pubblicazione richiede un account GitHub
abbastanza datato da superare il gate di caricamento. Le pagine pubbliche di dettaglio riassumono lo
stato più recente della scansione prima dell’installazione o del download.

ClawHub esegue controlli automatici sugli Skills pubblicati e sulle release dei Plugin. Le release
trattenute dalla scansione o bloccate possono scomparire dal catalogo pubblico e dalle superfici di installazione, pur
restando visibili al proprietario in `/dashboard`.

Gli utenti autenticati possono segnalare Skills e pacchetti. I moderatori possono esaminare le segnalazioni,
nascondere o ripristinare contenuti e bannare account abusivi. Vedi
[Uso accettabile](/it/clawhub/acceptable-usage) e
[Sicurezza e moderazione](/it/clawhub/security) per i dettagli su policy e applicazione.

## Telemetria e ambiente

Quando esegui `clawhub sync` mentre hai effettuato l’accesso, la CLI invia uno snapshot minimo così
ClawHub può calcolare i conteggi delle installazioni. Disabilitalo con:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Override di ambiente utili:

| Variabile                     | Effetto                                           |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Sovrascrive l’URL del sito usato per il login nel browser. |
| `CLAWHUB_REGISTRY`            | Sovrascrive l’URL dell’API del registro.          |
| `CLAWHUB_CONFIG_PATH`         | Sovrascrive dove la CLI archivia token/stato di configurazione. |
| `CLAWHUB_WORKDIR`             | Sovrascrive la directory di lavoro predefinita.   |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Disabilita la telemetria su `sync`.               |

Vedi [Telemetria](/it/clawhub/telemetry), [API HTTP](/it/clawhub/http-api) e
[Risoluzione dei problemi](/it/clawhub/troubleshooting) per materiale di riferimento più approfondito.
