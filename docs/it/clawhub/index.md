---
read_when:
    - Spiegazione di cos'è ClawHub
    - Ricerca, installazione o aggiornamento di Skills o Plugin
    - Pubblicazione di Skills o Plugin nel registro
    - Scegliere tra i flussi CLI openclaw e clawhub
sidebarTitle: ClawHub
summary: Panoramica pubblica di ClawHub per scoperta, installazione, pubblicazione, sicurezza e CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T15:42:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub è il registro pubblico per skill e plugin di OpenClaw.

- Usa i comandi nativi `openclaw` per cercare, installare e aggiornare skill e per installare plugin da ClawHub.
- Usa la CLI `clawhub` separata per i flussi di lavoro di autenticazione al registro, pubblicazione, eliminazione/ripristino e sincronizzazione.

Sito: [clawhub.ai](https://clawhub.ai)

## Avvio rapido

Cerca e installa skill con OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Cerca e installa plugin con OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Installa la CLI ClawHub quando vuoi flussi di lavoro autenticati nel registro come
pubblicazione, sincronizzazione o eliminazione/ripristino:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Cosa ospita ClawHub

| Superficie     | Cosa archivia                                               | Comando tipico                               |
| -------------- | ----------------------------------------------------------- | -------------------------------------------- |
| Skills         | Bundle di testo versionati con `SKILL.md` e file di supporto | `openclaw skills install <slug>`             |
| Plugin di codice | Pacchetti plugin OpenClaw con metadati di compatibilità  | `openclaw plugins install clawhub:<package>` |
| Plugin bundle  | Bundle di plugin impacchettati per la distribuzione OpenClaw | `clawhub package publish <source>`           |
| Souls          | Bundle `SOUL.md` mostrati su onlycrabs.ai                   | Flussi di pubblicazione Web e API            |

ClawHub tiene traccia di versioni semver, tag come `latest`, changelog, file,
download, stelle e riepiloghi delle scansioni di sicurezza. Le pagine pubbliche mostrano lo
stato attuale del registro, così gli utenti possono esaminare una skill o un plugin prima di installarlo.

## Flussi nativi OpenClaw

I comandi nativi OpenClaw installano nello spazio di lavoro OpenClaw attivo e mantengono
i metadati di origine, così i comandi di aggiornamento successivi possono restare su ClawHub.

Usa `clawhub:<package>` quando l'installazione di un plugin deve risolversi tramite ClawHub.
Le specifiche di plugin compatibili con npm senza prefisso possono risolversi tramite npm durante le transizioni di lancio, e
`npm:<package>` resta solo npm quando una sorgente deve essere esplicita.

Le installazioni dei plugin convalidano la compatibilità dichiarata di `pluginApi` e `minGatewayVersion`
prima dell'installazione dell'archivio. Quando una versione del pacchetto pubblica un artefatto
ClawPack, OpenClaw preferisce l'esatto `.tgz` npm-pack caricato, verifica
l'intestazione digest ClawHub e i byte scaricati, e registra i metadati dell'artefatto per
aggiornamenti successivi.

## CLI ClawHub

La CLI ClawHub serve per il lavoro autenticato nel registro:

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

La CLI dispone anche di comandi di installazione/aggiornamento delle skill per flussi di lavoro diretti con il registro:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Questi comandi installano le skill in `./skills` sotto la directory di lavoro corrente
e registrano le versioni installate in `.clawhub/lock.json`.

## Pubblicazione

Pubblica skill da una cartella locale contenente `SKILL.md`:

```bash
clawhub skill publish <path>
```

Opzioni di pubblicazione comuni:

- `--slug <slug>`: slug della skill.
- `--name <name>`: nome visualizzato.
- `--version <version>`: versione semver.
- `--changelog <text>`: testo del changelog.
- `--tags <tags>`: tag separati da virgole, con valore predefinito `latest`.

Pubblica plugin da una cartella locale, `owner/repo`, `owner/repo@ref` o un URL GitHub:

```bash
clawhub package publish <source>
```

Usa `--dry-run` per costruire il piano di pubblicazione esatto senza caricare, e `--json`
per un output adatto alla CI.

I plugin di codice devono includere i metadati di compatibilità OpenClaw richiesti in
`package.json`, inclusi `openclaw.compat.pluginApi` e
`openclaw.build.openclawVersion`. Vedi [CLI](/it/clawhub/cli) per il riferimento completo dei comandi
e [Formato delle skill](/it/clawhub/skill-format) per i metadati delle skill.

## Sicurezza e moderazione

ClawHub è aperto per impostazione predefinita: chiunque può caricare, ma la pubblicazione richiede un account GitHub
abbastanza datato da superare il controllo di caricamento. Le pagine di dettaglio pubbliche riepilogano lo
stato della scansione più recente prima dell'installazione o del download.

ClawHub esegue controlli automatizzati sulle skill pubblicate e sulle release dei plugin. Le release
trattenute dalla scansione o bloccate possono sparire dal catalogo pubblico e dalle superfici di installazione, pur
rimanendo visibili al loro proprietario in `/dashboard`.

Gli utenti che hanno effettuato l'accesso possono segnalare skill e pacchetti. I moderatori possono esaminare le segnalazioni,
nascondere o ripristinare contenuti e bloccare account abusivi. Vedi
[Utilizzo accettabile](/it/clawhub/acceptable-usage) e
[Sicurezza e moderazione](/it/clawhub/security) per i dettagli su policy e applicazione.

## Telemetria e ambiente

Quando esegui `clawhub sync` dopo aver effettuato l'accesso, la CLI invia uno snapshot minimo affinché
ClawHub possa calcolare i conteggi delle installazioni. Disabilitalo con:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Override di ambiente utili:

| Variabile                     | Effetto                                           |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Sovrascrive l'URL del sito usato per il login nel browser. |
| `CLAWHUB_REGISTRY`            | Sovrascrive l'URL dell'API del registro.          |
| `CLAWHUB_CONFIG_PATH`         | Sovrascrive dove la CLI memorizza lo stato di token/configurazione. |
| `CLAWHUB_WORKDIR`             | Sovrascrive la directory di lavoro predefinita.   |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Disabilita la telemetria su `sync`.               |

Vedi [Telemetria](/it/clawhub/telemetry), [API HTTP](/it/clawhub/http-api) e
[Risoluzione dei problemi](/it/clawhub/troubleshooting) per materiale di riferimento più approfondito.
