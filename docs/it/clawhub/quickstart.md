---
read_when:
    - Prima volta che usi ClawHub
    - Installazione di una skill o di un plugin dal registro
    - Pubblicazione su ClawHub
summary: 'Inizia a usare ClawHub: trova, installa, aggiorna e pubblica Skills o Plugin.'
x-i18n:
    generated_at: "2026-07-12T06:51:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Avvio rapido

ClawHub è un registro per Skills e Plugin di OpenClaw.

Usa OpenClaw quando installi elementi in OpenClaw. Usa la CLI `clawhub`
quando accedi, pubblichi, gestisci le tue inserzioni o utilizzi
flussi di lavoro specifici del registro.

## Trovare e installare una Skill

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

OpenClaw registra la provenienza della Skill, così gli aggiornamenti successivi possono continuare a
risolverla tramite ClawHub.

## Trovare e installare un Plugin

Cerca da OpenClaw:

```bash
openclaw plugins search "calendar"
```

Installa un Plugin ospitato su ClawHub specificando esplicitamente ClawHub come origine:

```bash
openclaw plugins install clawhub:<package>
```

Aggiorna i Plugin installati:

```bash
openclaw plugins update --all
```

Usa il prefisso `clawhub:` quando vuoi che OpenClaw risolva il pacchetto tramite
ClawHub anziché npm o un'altra origine.

## Accedere per pubblicare

Installa la CLI di ClawHub:

```bash
npm i -g clawhub
# oppure
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

## Pubblicare una Skill

Una Skill è una cartella con un file `SKILL.md` obbligatorio ed eventuali file
di supporto facoltativi.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Il comando ignora i contenuti invariati. Le nuove Skills partono dalla versione `1.0.0`; le modifiche successive
pubblicano automaticamente la versione patch seguente. Usa `--dry-run` per visualizzare un'anteprima oppure
`--version` per scegliere una versione esplicita.

Prima della pubblicazione, controlla i metadati in `SKILL.md`. Dichiara le
variabili d'ambiente, gli strumenti e le autorizzazioni necessari affinché gli utenti possano capire di cosa ha
bisogno la Skill prima di installarla. Consulta [Formato delle Skill](/it/clawhub/skill-format).

Per i repository che contengono più Skills, il flusso di lavoro GitHub riutilizzabile chiama
`skill publish` per ogni cartella di Skill immediatamente sotto `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Pubblicare un Plugin

Pubblica un Plugin da una cartella locale, un repository GitHub, un riferimento GitHub o un
archivio esistente:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa prima `--dry-run` per visualizzare in anteprima i metadati risolti del pacchetto, i campi di
compatibilità, l'attribuzione dell'origine e il piano di caricamento senza pubblicare.

I Plugin di codice devono includere i metadati di compatibilità con OpenClaw in `package.json`,
inclusi `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.

## Esaminare prima dell'installazione

Prima dell'installazione, usa la pagina web di ClawHub o i comandi di dettaglio della CLI per esaminare
i metadati, i collegamenti all'origine, le versioni, i registri delle modifiche e lo stato della scansione:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Le inserzioni pubbliche mostrano lo stato più recente della scansione. Le versioni sospese o bloccate dalla
moderazione potrebbero essere nascoste dalle superfici di ricerca e installazione finché il problema non viene risolto.
