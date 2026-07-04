---
read_when:
    - Prima volta con ClawHub
    - Installazione di uno skill o plugin dal registro
    - Pubblicazione su ClawHub
summary: 'Inizia a usare ClawHub: trova, installa, aggiorna e pubblica Skills o Plugin.'
x-i18n:
    generated_at: "2026-07-04T10:43:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Avvio rapido

ClawHub è un registro per le competenze e i plugin di OpenClaw.

Usa OpenClaw quando installi elementi in OpenClaw. Usa la CLI `clawhub`
quando accedi, pubblichi, gestisci le tue schede o usi
workflow specifici del registro.

## Trovare e installare una competenza

Cerca da OpenClaw:

```bash
openclaw skills search "calendar"
```

Installa una competenza:

```bash
openclaw skills install @openclaw/demo
```

Aggiorna le competenze installate:

```bash
openclaw skills update --all
```

OpenClaw registra da dove proviene la competenza, così gli aggiornamenti successivi possono continuare a
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
ClawHub invece che tramite npm o un'altra fonte.

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

Gli ambienti senza interfaccia grafica possono usare un token API dall'interfaccia web di ClawHub:

```bash
clawhub login --token clh_...
```

## Pubblicare una competenza

Una competenza è una cartella con un file `SKILL.md` obbligatorio e file di supporto
facoltativi.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Il comando salta i contenuti invariati. Le nuove competenze partono da `1.0.0`; le modifiche successive
pubblicano automaticamente la versione patch successiva. Usa `--dry-run` per un'anteprima o
`--version` per scegliere una versione esplicita.

Prima della pubblicazione, controlla i metadati in `SKILL.md`. Dichiara le variabili
d'ambiente, gli strumenti e le autorizzazioni richiesti, così gli utenti possono capire cosa
serve alla competenza prima di installarla. Vedi [Formato competenza](/it/clawhub/skill-format).

Per i repository che contengono più competenze, il workflow GitHub riutilizzabile chiama
`skill publish` per ogni cartella di competenza immediatamente sotto `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Pubblicare un plugin

Pubblica un plugin da una cartella locale, un repository GitHub, un riferimento GitHub o un
archivio esistente:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa prima `--dry-run` per vedere in anteprima i metadati del pacchetto risolti, i campi di compatibilità,
l'attribuzione della fonte e il piano di caricamento senza pubblicare.

I plugin di codice devono includere i metadati di compatibilità con OpenClaw in `package.json`,
inclusi `openclaw.compat.pluginApi` e `openclaw.build.openclawVersion`.

## Ispezionare prima dell'installazione

Prima dell'installazione, usa la pagina web di ClawHub o i comandi di dettaglio della CLI per ispezionare
metadati, link alle fonti, versioni, changelog e stato della scansione:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Le schede pubbliche mostrano lo stato più recente della scansione. Le release trattenute o bloccate dalla
moderazione possono essere nascoste dalle superfici di ricerca e installazione finché il problema non viene risolto.
