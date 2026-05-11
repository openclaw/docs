---
read_when:
    - Primo utilizzo di ClawHub
    - Installazione di una Skill o di un Plugin dal registro
    - Pubblicazione su ClawHub
summary: 'Inizia a usare ClawHub: trova, installa, aggiorna e pubblica Skills o Plugin.'
x-i18n:
    generated_at: "2026-05-11T20:24:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Quickstart

ClawHub è un registro per Skills e plugin di OpenClaw.

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

OpenClaw registra da dove proviene la skill, così gli aggiornamenti successivi possono continuare a
risolversi tramite ClawHub.

## Trovare e installare un plugin

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
ClawHub anziché tramite npm o un'altra fonte.

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

Gli ambienti senza interfaccia possono usare un token API dall'interfaccia web di ClawHub:

```bash
clawhub login --token clh_...
```

## Pubblicare una skill

Una skill è una cartella con un file `SKILL.md` obbligatorio e file di supporto
facoltativi.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Prima di pubblicare, controlla i metadati in `SKILL.md`. Dichiara le variabili
d'ambiente, gli strumenti e i permessi richiesti, così gli utenti possono capire di cosa ha
bisogno la skill prima di installarla. Vedi [Formato delle skill](/it/clawhub/skill-format).

## Pubblicare un plugin

Pubblica un plugin da una cartella locale, un repository GitHub, un riferimento GitHub o un
archivio esistente:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa prima `--dry-run` per visualizzare in anteprima i metadati del pacchetto risolti, i campi di compatibilità,
l'attribuzione della fonte e il piano di caricamento senza pubblicare.

I plugin di codice devono includere metadati di compatibilità con OpenClaw in `package.json`,
inclusi `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.

## Sincronizzare le skill che mantieni

`sync` analizza le cartelle delle skill e pubblica le skill nuove o modificate che non sono
già sincronizzate.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Quando hai effettuato l'accesso, `sync` può anche inviare uno snapshot minimo delle installazioni per
conteggi aggregati delle installazioni. Vedi [Telemetria](/it/clawhub/telemetry) per sapere cosa viene segnalato
e come disattivarlo.

## Ispezionare prima dell'installazione

Prima dell'installazione, usa la pagina web di ClawHub o i comandi di dettaglio della CLI per ispezionare
metadati, link alle fonti, versioni, changelog e stato della scansione:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Le inserzioni pubbliche mostrano lo stato più recente della scansione. Le release trattenute o bloccate dalla
moderazione possono essere nascoste dalle superfici di ricerca e installazione finché non vengono risolte.
