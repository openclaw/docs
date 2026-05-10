---
read_when:
    - Primo utilizzo di ClawHub
    - Installazione di una skill o di un plugin dal registro
    - Pubblicazione su ClawHub
summary: 'Inizia a usare ClawHub: trova, installa, aggiorna e pubblica Skills o Plugin.'
x-i18n:
    generated_at: "2026-05-10T19:26:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Guida rapida

ClawHub è un registro per Skills e Plugin di OpenClaw.

Usa OpenClaw quando installi elementi in OpenClaw. Usa la CLI `clawhub`
quando accedi, pubblichi, gestisci le tue schede o utilizzi
flussi di lavoro specifici del registro.

## Trovare e installare una Skill

Cerca da OpenClaw:

```bash
openclaw skills search "calendar"
```

Installa una Skill:

```bash
openclaw skills install <skill-slug>
```

Aggiorna le Skills installate:

```bash
openclaw skills update --all
```

OpenClaw registra la provenienza della Skill in modo che gli aggiornamenti successivi possano continuare a
risolverla tramite ClawHub.

## Trovare e installare un Plugin

Cerca da OpenClaw:

```bash
openclaw plugins search "calendar"
```

Installa un Plugin ospitato su ClawHub con un'origine ClawHub esplicita:

```bash
openclaw plugins install clawhub:<package>
```

Aggiorna i Plugin installati:

```bash
openclaw plugins update --all
```

Usa il prefisso `clawhub:` quando vuoi che OpenClaw risolva il pacchetto tramite
ClawHub anziché npm o un'altra origine.

## Accedere per la pubblicazione

Installa la CLI di ClawHub:

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

Gli ambienti senza interfaccia grafica possono usare un token API dall'interfaccia web di ClawHub:

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
  --version 1.0.0 \
  --changelog "Initial release"
```

Prima della pubblicazione, controlla i metadati in `SKILL.md`. Dichiara le
variabili d'ambiente, gli strumenti e le autorizzazioni richiesti, così gli utenti possono capire di cosa ha bisogno la
Skill prima di installarla. Consulta [Formato delle Skill](/it/clawhub/skill-format).

## Pubblicare un Plugin

Pubblica un Plugin da una cartella locale, un repository GitHub, un ref GitHub o un
archivio esistente:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa prima `--dry-run` per visualizzare in anteprima i metadati risolti del pacchetto, i campi di compatibilità,
l'attribuzione dell'origine e il piano di caricamento senza pubblicare.

I Plugin di codice devono includere i metadati di compatibilità con OpenClaw in `package.json`,
inclusi `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.

## Sincronizzare le Skills che mantieni

`sync` analizza le cartelle delle Skill e pubblica Skills nuove o modificate che non sono
già sincronizzate.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Quando hai effettuato l'accesso, `sync` può anche inviare uno snapshot minimo delle installazioni per
i conteggi aggregati delle installazioni. Consulta [Telemetria](/it/clawhub/telemetry) per sapere cosa viene segnalato
e come rifiutare esplicitamente la raccolta.

## Ispezionare prima dell'installazione

Prima dell'installazione, usa la pagina web di ClawHub o i comandi di dettaglio della CLI per ispezionare
metadati, link alle origini, versioni, changelog e stato della scansione:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Le schede pubbliche mostrano lo stato della scansione più recente. Le release trattenute o bloccate dalla
moderazione possono essere nascoste dalla ricerca e dalle superfici di installazione finché non vengono risolte.
