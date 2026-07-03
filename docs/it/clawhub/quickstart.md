---
read_when:
    - Prima volta con ClawHub
    - Installazione di una skill o Plugin dal registro
    - Pubblicazione su ClawHub
summary: 'Inizia a usare ClawHub: trova, installa, aggiorna e pubblica skill o plugin.'
x-i18n:
    generated_at: "2026-07-03T23:35:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Quickstart

ClawHub è un registro per Skills e plugin di OpenClaw.

Usa OpenClaw quando installi elementi in OpenClaw. Usa la CLI `clawhub`
quando accedi, pubblichi, gestisci le tue inserzioni o usi
flussi di lavoro specifici del registro.

## Trova e installa una Skill

Cerca da OpenClaw:

```bash
openclaw skills search "calendar"
```

Installa una Skill:

```bash
openclaw skills install @openclaw/demo
```

Aggiorna le Skills installate:

```bash
openclaw skills update --all
```

OpenClaw registra da dove proviene la Skill, così gli aggiornamenti successivi possono continuare a
risolversi tramite ClawHub.

## Trova e installa un plugin

Cerca da OpenClaw:

```bash
openclaw plugins search "calendar"
```

Installa un plugin ospitato su ClawHub con una fonte ClawHub esplicita:

```bash
openclaw plugins install clawhub:<package>
```

Aggiorna i plugin installati:

```bash
openclaw plugins update --all
```

Usa il prefisso `clawhub:` quando vuoi che OpenClaw risolva il pacchetto tramite
ClawHub invece che tramite npm o un'altra fonte.

## Accedi per pubblicare

Installa la CLI ClawHub:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Accedi con GitHub:

```bash
clawhub login
clawhub whoami
```

Gli ambienti headless possono usare un token API dall'interfaccia web di ClawHub:

```bash
clawhub login --token clh_...
```

## Pubblica una Skill

Una Skill è una cartella con un file `SKILL.md` obbligatorio e file di supporto
facoltativi.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Il comando salta i contenuti invariati. Le nuove Skills partono da `1.0.0`; le modifiche successive
pubblicano automaticamente la versione patch successiva. Usa `--dry-run` per un'anteprima oppure
`--version` per scegliere una versione esplicita.

Prima di pubblicare, controlla i metadati in `SKILL.md`. Dichiara le
variabili d'ambiente, gli strumenti e le autorizzazioni richiesti, così gli utenti possono capire di cosa ha bisogno la
Skill prima di installarla. Vedi [Formato Skill](/it/clawhub/skill-format).

Per i repository che contengono più Skills, il workflow GitHub riutilizzabile chiama
`skill publish` per ogni cartella Skill immediata sotto `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Pubblica un plugin

Pubblica un plugin da una cartella locale, un repository GitHub, un ref GitHub o un
archivio esistente:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa prima `--dry-run` per vedere in anteprima i metadati del pacchetto risolti, i campi di compatibilità,
l'attribuzione della fonte e il piano di caricamento senza pubblicare.

I code plugin devono includere metadati di compatibilità OpenClaw in `package.json`,
inclusi `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.

## Ispeziona prima di installare

Prima di installare, usa la pagina web di ClawHub o i comandi di dettaglio della CLI per ispezionare
metadati, link alla fonte, versioni, changelog e stato della scansione:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Le inserzioni pubbliche mostrano lo stato della scansione più recente. Le release trattenute o bloccate dalla
moderazione possono essere nascoste dalle superfici di ricerca e installazione finché non vengono risolte.
