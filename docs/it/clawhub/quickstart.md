---
read_when:
    - Prima volta con ClawHub
    - Installazione di una skill o di un plugin dal registro
    - Pubblicazione su ClawHub
summary: 'Inizia a usare ClawHub: trova, installa, aggiorna e pubblica Skills o plugin.'
x-i18n:
    generated_at: "2026-07-03T09:39:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Avvio rapido

ClawHub è un registro per Skills e Plugin di OpenClaw.

Usa OpenClaw quando installi elementi in OpenClaw. Usa la CLI `clawhub`
quando accedi, pubblichi, gestisci i tuoi listing o usi workflow
specifici del registro.

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

OpenClaw registra da dove proviene la Skill, così gli aggiornamenti successivi
possono continuare a risolversi tramite ClawHub.

## Trovare e installare un Plugin

Cerca da OpenClaw:

```bash
openclaw plugins search "calendar"
```

Installa un Plugin ospitato su ClawHub con una sorgente ClawHub esplicita:

```bash
openclaw plugins install clawhub:<package>
```

Aggiorna i Plugin installati:

```bash
openclaw plugins update --all
```

Usa il prefisso `clawhub:` quando vuoi che OpenClaw risolva il pacchetto tramite
ClawHub invece che tramite npm o un'altra sorgente.

## Accedere per pubblicare

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

## Pubblicare una Skill

Una Skill è una cartella con un file `SKILL.md` obbligatorio e file di supporto
facoltativi.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Il comando salta i contenuti invariati. Le nuove Skills partono da `1.0.0`; le
modifiche successive pubblicano automaticamente la versione patch successiva.
Usa `--dry-run` per visualizzare un'anteprima oppure `--version` per scegliere
una versione esplicita.

Prima di pubblicare, controlla i metadati in `SKILL.md`. Dichiara le variabili
d'ambiente, gli strumenti e le autorizzazioni richiesti, così gli utenti possono
capire di cosa ha bisogno la Skill prima di installarla. Vedi [Formato Skill](/it/clawhub/skill-format).

Per i repository che contengono più Skills, il workflow GitHub riutilizzabile chiama
`skill publish` per ogni cartella Skill immediata sotto `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Pubblicare un Plugin

Pubblica un Plugin da una cartella locale, un repository GitHub, un ref GitHub o
un archivio esistente:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa prima `--dry-run` per visualizzare un'anteprima dei metadati del pacchetto
risolti, dei campi di compatibilità, dell'attribuzione della sorgente e del piano
di caricamento senza pubblicare.

I Plugin di codice devono includere metadati di compatibilità OpenClaw in `package.json`,
inclusi `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.

## Ispezionare prima dell'installazione

Prima dell'installazione, usa la pagina web di ClawHub o i comandi di dettaglio
della CLI per ispezionare metadati, link alla sorgente, versioni, changelog e
stato della scansione:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

I listing pubblici mostrano lo stato più recente della scansione. Le release
trattenute o bloccate dalla moderazione possono essere nascoste dalle superfici
di ricerca e installazione fino alla risoluzione.
