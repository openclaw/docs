---
read_when:
    - Primo utilizzo di ClawHub
    - Installazione di una skill o di un Plugin dal registro
    - Pubblicazione su ClawHub
summary: 'Inizia a usare ClawHub: trova, installa, aggiorna e pubblica Skills o Plugin.'
x-i18n:
    generated_at: "2026-05-11T22:19:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Quickstart

ClawHub è un registro per le skills e i Plugin di OpenClaw.

Usa OpenClaw quando installi elementi in OpenClaw. Usa la CLI `clawhub`
quando effettui l'accesso, pubblichi, gestisci le tue inserzioni o usi
flussi di lavoro specifici del registro.

## Trovare e installare una skill

Cerca da OpenClaw:

```bash
openclaw skills search "calendar"
```

Installa una skill:

```bash
openclaw skills install <skill-slug>
```

Aggiorna le skills installate:

```bash
openclaw skills update --all
```

OpenClaw registra da dove proviene la skill, così gli aggiornamenti successivi
possono continuare a essere risolti tramite ClawHub.

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

## Accedere per la pubblicazione

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

## Pubblicare una skill

Una skill è una cartella con un file `SKILL.md` obbligatorio e file di supporto
opzionali.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Prima della pubblicazione, controlla i metadati in `SKILL.md`. Dichiara le
variabili di ambiente, gli strumenti e le autorizzazioni richiesti, così gli
utenti possono capire di cosa ha bisogno la skill prima di installarla. Vedi [Formato skill](/it/clawhub/skill-format).

## Pubblicare un Plugin

Pubblica un Plugin da una cartella locale, un repository GitHub, un ref GitHub o un
archivio esistente:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa prima `--dry-run` per visualizzare in anteprima i metadati del pacchetto risolti, i campi di compatibilità,
l'attribuzione della sorgente e il piano di caricamento senza pubblicare.

I Plugin di codice devono includere i metadati di compatibilità di OpenClaw in `package.json`,
inclusi `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.

## Sincronizzare le skills che mantieni

`sync` esamina le cartelle delle skills e pubblica skills nuove o modificate che non sono
già sincronizzate.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Quando hai effettuato l'accesso, `sync` può anche inviare uno snapshot minimo delle installazioni per
i conteggi aggregati delle installazioni. Vedi [Telemetria](/it/clawhub/telemetry) per sapere cosa viene segnalato
e come disattivarlo.

## Ispezionare prima dell'installazione

Prima dell'installazione, usa la pagina web di ClawHub o i comandi di dettaglio della CLI per ispezionare
metadati, link sorgente, versioni, changelog e stato della scansione:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Le inserzioni pubbliche mostrano lo stato della scansione più recente. Le release trattenute o bloccate dalla
moderazione possono essere nascoste dalla ricerca e dalle superfici di installazione finché non vengono risolte.
