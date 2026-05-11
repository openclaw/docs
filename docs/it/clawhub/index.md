---
read_when:
    - Spiegare che cos'è ClawHub
    - Ricerca, installazione o aggiornamento di Skills o Plugin
    - Pubblicazione di Skills o plugin nel registro
    - Scegliere tra i flussi CLI di openclaw e clawhub
sidebarTitle: ClawHub
summary: Panoramica pubblica di ClawHub per l'individuazione, l'installazione, la pubblicazione, la sicurezza e la CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-11T22:19:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub è il registro pubblico per Skills e plugin di OpenClaw.

- Usa i comandi nativi `openclaw` per cercare, installare e aggiornare Skills e per installare plugin da ClawHub.
- Usa la CLI separata `clawhub` per i flussi di lavoro di autenticazione al registro, pubblicazione, eliminazione/ripristino e sincronizzazione.

Sito: [clawhub.ai](https://clawhub.ai)

## Avvio rapido

Cerca e installa Skills con OpenClaw:

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

Installa la CLI di ClawHub quando vuoi flussi di lavoro autenticati con il registro, come
pubblicazione, sincronizzazione o eliminazione/ripristino:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Cosa ospita ClawHub

| Superficie     | Cosa archivia                                               | Comando tipico                              |
| -------------- | ----------------------------------------------------------- | ------------------------------------------ |
| Skills         | Bundle di testo versionati con `SKILL.md` e file di supporto | `openclaw skills install <slug>`           |
| Plugin di codice | Pacchetti Plugin di OpenClaw con metadati di compatibilità | `openclaw plugins install clawhub:<package>` |
| Plugin bundle | Bundle Plugin pacchettizzati per la distribuzione di OpenClaw | `clawhub package publish <source>`         |
| Souls          | Bundle `SOUL.md` mostrati solo su onlycrabs.ai              | Flussi di pubblicazione Web e API          |

ClawHub tiene traccia di versioni semver, tag come `latest`, changelog, file,
download, stelle e riepiloghi delle scansioni di sicurezza. Le pagine pubbliche mostrano lo stato attuale del registro
così gli utenti possono esaminare una skill o un plugin prima di installarlo.

## Flussi nativi di OpenClaw

I comandi nativi di OpenClaw installano nello spazio di lavoro OpenClaw attivo e salvano
i metadati di origine, così i comandi di aggiornamento successivi possono restare su ClawHub.

Usa `clawhub:<package>` quando l’installazione di un plugin deve essere risolta tramite ClawHub.
Le specifiche plugin npm-safe senza prefisso possono essere risolte tramite npm durante i cutover di lancio, e
`npm:<package>` resta solo npm quando una fonte deve essere esplicita.

Le installazioni dei plugin convalidano la compatibilità dichiarata di `pluginApi` e `minGatewayVersion`
prima che venga eseguita l’installazione dell’archivio. Quando una versione del pacchetto pubblica un
artefatto ClawPack, OpenClaw preferisce il `.tgz` npm-pack esatto caricato, verifica
l’header digest di ClawHub e i byte scaricati, e registra i metadati dell’artefatto per
aggiornamenti successivi.

## CLI di ClawHub

La CLI di ClawHub serve per il lavoro autenticato con il registro:

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

La CLI include anche comandi di installazione/aggiornamento delle Skills per flussi di lavoro diretti con il registro:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Questi comandi installano Skills in `./skills` nella directory di lavoro corrente
e registrano le versioni installate in `.clawhub/lock.json`.

## Pubblicazione

Pubblica Skills da una cartella locale contenente `SKILL.md`:

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

Usa `--dry-run` per creare il piano di pubblicazione esatto senza caricare nulla, e `--json`
per un output adatto alla CI.

I plugin di codice devono includere i metadati di compatibilità OpenClaw richiesti in
`package.json`, inclusi `openclaw.compat.pluginApi` e
`openclaw.build.openclawVersion`. Vedi [CLI](/it/clawhub/cli) per il riferimento completo dei comandi
e [Formato Skill](/it/clawhub/skill-format) per i metadati delle skill.

## Sicurezza e moderazione

ClawHub è aperto per impostazione predefinita: chiunque può caricare contenuti, ma la pubblicazione richiede un account GitHub
abbastanza vecchio da superare il gate di caricamento. Le pagine pubbliche dei dettagli riassumono lo
stato della scansione più recente prima dell’installazione o del download.

ClawHub esegue controlli automatizzati sulle Skills e sulle release dei plugin pubblicate. Le release
trattenute dalla scansione o bloccate possono scomparire dal catalogo pubblico e dalle superfici di installazione, pur
restando visibili al proprietario in `/dashboard`.

Gli utenti che hanno effettuato l’accesso possono segnalare Skills e pacchetti. I moderatori possono esaminare le segnalazioni,
nascondere o ripristinare contenuti e bannare gli account abusivi. Vedi
[Uso accettabile](/it/clawhub/acceptable-usage) e
[Sicurezza + moderazione](/it/clawhub/security) per i dettagli su policy e applicazione.

## Telemetria e ambiente

Quando esegui `clawhub sync` mentre hai effettuato l’accesso, la CLI invia uno snapshot minimo così
ClawHub può calcolare il numero di installazioni. Disabilitalo con:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Override di ambiente utili:

| Variabile                     | Effetto                                           |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Sovrascrive l’URL del sito usato per il login nel browser. |
| `CLAWHUB_REGISTRY`            | Sovrascrive l’URL dell’API del registro.          |
| `CLAWHUB_CONFIG_PATH`         | Sovrascrive dove la CLI archivia lo stato di token/configurazione. |
| `CLAWHUB_WORKDIR`             | Sovrascrive la directory di lavoro predefinita.   |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Disabilita la telemetria su `sync`.               |

Vedi [Telemetria](/it/clawhub/telemetry), [API HTTP](/it/clawhub/http-api) e
[Risoluzione dei problemi](/it/clawhub/troubleshooting) per materiale di riferimento più approfondito.
