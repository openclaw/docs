---
read_when:
    - Spiegazione di cos'è ClawHub
    - Ricerca, installazione o aggiornamento di Skills o plugin
    - Pubblicazione di Skills o Plugin nel registro
    - Scegliere tra i flussi CLI di openclaw e clawhub
sidebarTitle: ClawHub
summary: Panoramica pubblica di ClawHub per scoperta, installazione, pubblicazione, sicurezza e la CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-01T18:13:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub è il registro pubblico per Skills e Plugin di OpenClaw.

- Usa i comandi nativi `openclaw` per cercare, installare e aggiornare Skills e per installare Plugin da ClawHub.
- Usa la CLI separata `clawhub` per i flussi di autenticazione al registro, pubblicazione ed eliminazione/ripristino.

Sito: [clawhub.ai](https://clawhub.ai)

## Avvio rapido

Cerca e installa Skills con OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Cerca e installa Plugin con OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Installa la CLI di ClawHub quando vuoi flussi autenticati dal registro, come
pubblicazione o eliminazione/ripristino:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Cosa ospita ClawHub

| Superficie     | Cosa archivia                                             | Comando tipico                               |
| -------------- | --------------------------------------------------------- | -------------------------------------------- |
| Skills         | Bundle di testo versionati con `SKILL.md` e file di supporto | `openclaw skills install @openclaw/demo`     |
| Plugin di codice | Pacchetti Plugin di OpenClaw con metadati di compatibilità | `openclaw plugins install clawhub:<package>` |
| Plugin in bundle | Bundle Plugin pacchettizzati per la distribuzione di OpenClaw | `clawhub package publish <source>`           |

ClawHub tiene traccia delle versioni semver, dei tag come `latest`, dei changelog, dei file,
dei download, delle stelle e dei riepiloghi delle scansioni di sicurezza. Le pagine pubbliche mostrano lo stato attuale del registro
così gli utenti possono ispezionare una skill o un Plugin prima di installarlo.

## Flussi nativi di OpenClaw

I comandi nativi di OpenClaw installano nell'area di lavoro OpenClaw attiva e salvano
i metadati di origine, così i comandi di aggiornamento successivi possono rimanere su ClawHub.

Usa `clawhub:<package>` quando l'installazione di un Plugin deve essere risolta tramite ClawHub.
Le specifiche Plugin compatibili con npm senza prefisso possono essere risolte tramite npm durante i passaggi di lancio, e
`npm:<package>` rimane solo npm quando una fonte deve essere esplicita.

Le installazioni dei Plugin convalidano la compatibilità dichiarata di `pluginApi` e `minGatewayVersion`
prima dell'installazione dell'archivio. Quando una versione del pacchetto pubblica un artefatto
ClawPack, OpenClaw preferisce l'esatto `.tgz` npm-pack caricato, verifica
l'intestazione digest di ClawHub e i byte scaricati, e registra i metadati dell'artefatto per
gli aggiornamenti successivi.

## CLI di ClawHub

La CLI di ClawHub serve per il lavoro autenticato dal registro:

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

La CLI ha anche comandi di installazione/aggiornamento Skills per flussi diretti con il registro:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
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

- `--slug <slug>`: nome URL della skill pubblicata.
- `--name <name>`: nome visualizzato.
- `--version <version>`: versione semver.
- `--changelog <text>`: testo del changelog.
- `--tags <tags>`: tag separati da virgole, con valore predefinito `latest`.

Pubblica Plugin da una cartella locale, `owner/repo`, `owner/repo@ref` o un URL
GitHub:

```bash
clawhub package publish <source>
```

Usa `--dry-run` per creare il piano di pubblicazione esatto senza caricare, e `--json`
per un output adatto alla CI.

I Plugin di codice devono includere i metadati di compatibilità OpenClaw richiesti in
`package.json`, inclusi `openclaw.compat.pluginApi` e
`openclaw.build.openclawVersion`. Vedi [CLI](/it/clawhub/cli) per il riferimento completo dei comandi
e [Formato delle skill](/clawhub/skill-format) per i metadati delle skill.

## Sicurezza e moderazione

ClawHub è aperto per impostazione predefinita: chiunque può caricare, ma la pubblicazione richiede un account GitHub
abbastanza datato da superare il gate di caricamento. Le pagine pubbliche di dettaglio riepilogano
lo stato dell'ultima scansione prima dell'installazione o del download.

ClawHub esegue controlli automatici sulle Skills pubblicate e sulle release dei Plugin. Le release
trattenute dalla scansione o bloccate possono scomparire dal catalogo pubblico e dalle superfici di installazione, pur
rimanendo visibili al proprietario in `/dashboard`.

Gli utenti connessi possono segnalare Skills e pacchetti. I moderatori possono esaminare le segnalazioni,
nascondere o ripristinare contenuti e bannare account abusivi. Vedi
[Sicurezza](/it/clawhub/security),
[Audit di sicurezza](/clawhub/security-audits),
[Moderazione e sicurezza degli account](/clawhub/moderation) e
[Uso accettabile](/it/clawhub/acceptable-usage) per i dettagli su policy e applicazione.

## Telemetria e ambiente

Quando esegui `clawhub install` mentre hai effettuato l'accesso, la CLI può inviare un evento di installazione
best-effort così ClawHub può calcolare i conteggi aggregati delle installazioni. Disabilitalo con:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Override di ambiente utili:

| Variabile                     | Effetto                                           |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Sostituisce l'URL del sito usato per il login nel browser. |
| `CLAWHUB_REGISTRY`            | Sostituisce l'URL dell'API del registro.          |
| `CLAWHUB_CONFIG_PATH`         | Sostituisce il percorso in cui la CLI archivia lo stato di token/configurazione. |
| `CLAWHUB_WORKDIR`             | Sostituisce la directory di lavoro predefinita.   |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Disabilita la telemetria di installazione.        |

Vedi [Telemetria](/clawhub/telemetry), [API HTTP](/clawhub/http-api) e
[Risoluzione dei problemi](/it/clawhub/troubleshooting) per materiale di riferimento più approfondito.
