---
read_when:
    - Primo utilizzo di ClawHub
    - Installazione di una skill o di un Plugin dal registro
    - Pubblicazione su ClawHub
summary: 'Inizia a usare ClawHub: trova, installa, aggiorna e pubblica Skills o Plugin.'
x-i18n:
    generated_at: "2026-07-16T14:04:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Avvio rapido

ClawHub è un registro per Skills e Plugin di OpenClaw.

Utilizzare OpenClaw quando si installano elementi in OpenClaw. Utilizzare la CLI `clawhub`
quando si effettua l'accesso, si pubblicano o gestiscono le proprie inserzioni oppure si utilizzano
flussi di lavoro specifici del registro.

## Trovare e installare una skill

Cercare da OpenClaw:

```bash
openclaw skills search "calendar"
```

Installare una skill:

```bash
openclaw skills install @openclaw/demo
```

Aggiornare le skill installate:

```bash
openclaw skills update --all
```

OpenClaw registra la provenienza della skill, affinché gli aggiornamenti successivi possano continuare a
essere risolti tramite ClawHub.

## Trovare e installare un plugin

Cercare da OpenClaw:

```bash
openclaw plugins search "calendar"
```

Installare un plugin ospitato su ClawHub specificando esplicitamente ClawHub come origine:

```bash
openclaw plugins install clawhub:<package>
```

Aggiornare i plugin installati:

```bash
openclaw plugins update --all
```

Utilizzare il prefisso `clawhub:` quando si desidera che OpenClaw risolva il pacchetto tramite
ClawHub anziché tramite npm o un'altra origine.

## Effettuare l'accesso per la pubblicazione

Installare la CLI di ClawHub:

```bash
npm i -g clawhub
# oppure
pnpm add -g clawhub
```

Effettuare l'accesso con GitHub:

```bash
clawhub login
clawhub whoami
```

Gli ambienti headless possono utilizzare un token API ottenuto dall'interfaccia web di ClawHub:

```bash
clawhub login --token clh_...
```

## Pubblicare una skill

Una skill è una cartella con un file `SKILL.md` obbligatorio ed eventuali file di supporto
facoltativi.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Il comando ignora i contenuti invariati. Le nuove skill iniziano dalla versione `1.0.0`; le modifiche successive
pubblicano automaticamente la versione patch seguente. Utilizzare `--dry-run` per visualizzare un'anteprima oppure
`--version` per scegliere una versione esplicita.

Prima della pubblicazione, verificare i metadati in `SKILL.md`. Dichiarare le variabili
d'ambiente, gli strumenti e le autorizzazioni necessari affinché gli utenti possano comprendere ciò di cui
la skill necessita prima di installarla. Consultare [Formato delle skill](/it/clawhub/skill-format).

Per i repository contenenti più skill, il flusso di lavoro GitHub riutilizzabile chiama
`skill publish` per ogni cartella di skill immediatamente sotto `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Pubblicare un plugin

Pubblicare un plugin da una cartella locale, un repository GitHub, un riferimento GitHub o un
archivio esistente:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Utilizzare prima `--dry-run` per visualizzare in anteprima i metadati risolti del pacchetto, i campi di compatibilità,
l'attribuzione dell'origine e il piano di caricamento senza effettuare la pubblicazione.

I plugin di codice devono includere i metadati di compatibilità con OpenClaw in `package.json`,
inclusi `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.

## Ispezionare prima dell'installazione

Prima dell'installazione, utilizzare la pagina web di ClawHub o i comandi dettagliati della CLI per esaminare
i metadati, i collegamenti alle origini, le versioni, i registri delle modifiche e lo stato della scansione:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Le inserzioni pubbliche mostrano lo stato della scansione più recente. Le versioni sospese o bloccate dalla
moderazione potrebbero essere nascoste nelle interfacce di ricerca e installazione fino alla risoluzione.
