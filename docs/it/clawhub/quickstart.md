---
read_when:
    - Primo utilizzo di ClawHub
    - Installazione di una skill o di un plugin dal registro
    - Pubblicazione su ClawHub
summary: 'Inizia a usare ClawHub: trova, installa, aggiorna e pubblica Skills o plugin.'
x-i18n:
    generated_at: "2026-05-13T04:18:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Avvio rapido

ClawHub è un registro per le skill e i plugin di OpenClaw.

Usa OpenClaw quando installi elementi in OpenClaw. Usa la CLI `clawhub`
quando accedi, pubblichi, gestisci le tue inserzioni o usi
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

Aggiorna le skill installate:

```bash
openclaw skills update --all
```

OpenClaw registra l'origine della skill, così gli aggiornamenti successivi possono continuare a
risolverla tramite ClawHub.

## Trovare e installare un plugin

Cerca da OpenClaw:

```bash
openclaw plugins search "calendar"
```

Installa un plugin ospitato su ClawHub con un'origine ClawHub esplicita:

```bash
openclaw plugins install clawhub:<package>
```

Aggiorna i plugin installati:

```bash
openclaw plugins update --all
```

Usa il prefisso `clawhub:` quando vuoi che OpenClaw risolva il pacchetto tramite
ClawHub invece che tramite npm o un'altra origine.

## Accedere per pubblicare

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

Prima di pubblicare, controlla i metadati in `SKILL.md`. Dichiara le variabili
d'ambiente, gli strumenti e le autorizzazioni richiesti, così gli utenti possono capire di cosa ha bisogno la
skill prima di installarla. Vedi [Formato della skill](/it/clawhub/skill-format).

## Pubblicare un plugin

Pubblica un plugin da una cartella locale, da un repository GitHub, da un riferimento GitHub o da un
archivio esistente:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa prima `--dry-run` per visualizzare in anteprima i metadati risolti del pacchetto, i campi di compatibilità,
l'attribuzione dell'origine e il piano di caricamento senza pubblicare.

I plugin di codice devono includere i metadati di compatibilità con OpenClaw in `package.json`,
inclusi `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.

## Sincronizzare le skill che mantieni

`sync` analizza le cartelle delle skill e pubblica le skill nuove o modificate che non sono
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
metadati, link alle origini, versioni, changelog e stato della scansione:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Le inserzioni pubbliche mostrano lo stato più recente della scansione. Le release trattenute o bloccate dalla
moderazione possono essere nascoste dalle superfici di ricerca e installazione fino alla risoluzione.
