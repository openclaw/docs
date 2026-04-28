---
read_when:
    - Ricerca, installazione o aggiornamento di Skills o Plugin
    - Pubblicazione di Skills o Plugin nel registro
    - Configurazione della CLI clawhub o dei suoi override d'ambiente
sidebarTitle: ClawHub
summary: 'ClawHub: registro pubblico per Skills e Plugin OpenClaw, flussi di installazione nativi e CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-26T11:39:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e002bb56b643bfdfb5715ac3632d854df182475be632ebe36c46d04008cf6e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub è il registro pubblico per **Skills e Plugin OpenClaw**.

- Usa i comandi nativi `openclaw` per cercare, installare e aggiornare Skills, e per installare Plugin da ClawHub.
- Usa la CLI separata `clawhub` per autenticazione al registro, pubblicazione, eliminazione/ripristino e flussi di sincronizzazione.

Sito: [clawhub.ai](https://clawhub.ai)

## Avvio rapido

<Steps>
  <Step title="Cerca">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Installa">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Usa">
    Avvia una nuova sessione OpenClaw: rileverà la nuova Skill.
  </Step>
  <Step title="Pubblica (facoltativo)">
    Per i flussi autenticati sul registro (pubblicazione, sincronizzazione, gestione), installa
    la CLI separata `clawhub`:

    ```bash
    npm i -g clawhub
    # oppure
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Flussi nativi OpenClaw

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    I comandi nativi `openclaw` installano nel tuo workspace attivo e
    rendono persistenti i metadati della sorgente così le successive chiamate a
    `update` possono restare su ClawHub.

  </Tab>
  <Tab title="Plugin">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    Gli spec di Plugin npm-safe semplici vengono provati anche su ClawHub prima di npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Le installazioni dei Plugin validano `pluginApi` e
    `minGatewayVersion` dichiarati per la compatibilità prima di eseguire l'installazione dell'archivio, così
    gli host incompatibili falliscono in modo chiuso fin dall'inizio invece di installare parzialmente
    il pacchetto.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` accetta solo famiglie di Plugin
installabili. Se un pacchetto ClawHub è in realtà una Skill, OpenClaw si ferma e
ti indirizza invece a `openclaw skills install <slug>`.

Anche le installazioni anonime di Plugin ClawHub falliscono in modo chiuso per i pacchetti privati.
I canali community o altri canali non ufficiali possono comunque installare, ma OpenClaw
avvisa così gli operatori possono esaminare sorgente e verifica prima di
abilitarli.
</Note>

## Cos'è ClawHub

- Un registro pubblico per Skills e Plugin OpenClaw.
- Un archivio versionato di bundle di Skills e metadati.
- Una superficie di discovery per ricerca, tag e segnali d'uso.

Una Skill tipica è un bundle versionato di file che include:

- Un file `SKILL.md` con la descrizione principale e l'utilizzo.
- Configurazioni, script o file di supporto facoltativi usati dalla Skill.
- Metadati come tag, riepilogo e requisiti di installazione.

ClawHub usa i metadati per abilitare la discovery e per esporre in modo sicuro le
capacità delle Skills. Il registro tiene traccia dei segnali d'uso (stelle, download) per
migliorare ranking e visibilità. Ogni pubblicazione crea una nuova
versione semver, e il registro mantiene la cronologia delle versioni così gli utenti possono verificare
le modifiche.

## Workspace e caricamento delle Skills

La CLI separata `clawhub` installa anche le Skills in `./skills` sotto
la tua directory di lavoro corrente. Se è configurato un workspace OpenClaw,
`clawhub` usa quel workspace come fallback a meno che tu non faccia override con `--workdir`
(o `CLAWHUB_WORKDIR`). OpenClaw carica le Skills del workspace da
`<workspace>/skills` e le rileva nella sessione **successiva**.

Se usi già `~/.openclaw/skills` o Skills incluse, le
Skills del workspace hanno precedenza. Per maggiori dettagli su come vengono caricate,
condivise e controllate le Skills, vedi [Skills](/it/tools/skills).

## Funzionalità del servizio

| Funzionalità       | Note                                                       |
| ------------------ | ---------------------------------------------------------- |
| Navigazione pubblica | Le Skills e il loro contenuto `SKILL.md` sono visibili pubblicamente. |
| Ricerca            | Basata su embedding (ricerca vettoriale), non solo per parole chiave. |
| Versionamento      | Semver, changelog e tag (incluso `latest`).               |
| Download           | Zip per versione.                                         |
| Stelle e commenti  | Feedback della community.                                 |
| Moderazione        | Approvazioni e audit.                                     |
| API adatta alla CLI | Adatta per automazione e scripting.                      |

## Sicurezza e moderazione

ClawHub è aperto per impostazione predefinita — chiunque può caricare Skills, ma un account
GitHub deve avere **almeno una settimana** per poter pubblicare. Questo rallenta
gli abusi senza bloccare i contributori legittimi.

<AccordionGroup>
  <Accordion title="Segnalazione">
    - Qualsiasi utente connesso può segnalare una Skill.
    - I motivi della segnalazione sono obbligatori e vengono registrati.
    - Ogni utente può avere fino a 20 segnalazioni attive contemporaneamente.
    - Le Skills con più di 3 segnalazioni uniche vengono nascoste automaticamente per impostazione predefinita.

  </Accordion>
  <Accordion title="Moderazione">
    - I moderatori possono vedere le Skills nascoste, renderle nuovamente visibili, eliminarle o bannare utenti.
    - L'abuso della funzione di segnalazione può comportare il ban dell'account.
    - Ti interessa diventare moderatore? Chiedi nel Discord di OpenClaw e contatta un moderatore o maintainer.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Ti serve solo per flussi autenticati sul registro come
pubblicazione/sincronizzazione.

### Opzioni globali

<ParamField path="--workdir <dir>" type="string">
  Directory di lavoro. Predefinito: directory corrente; fallback al workspace OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Directory delle Skills, relativa alla workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  URL base del sito (login da browser).
</ParamField>
<ParamField path="--registry <url>" type="string">
  URL base dell'API del registro.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Disabilita i prompt (non interattivo).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  Stampa la versione della CLI.
</ParamField>

### Comandi

<AccordionGroup>
  <Accordion title="Auth (login / logout / whoami)">
    ```bash
    clawhub login              # flusso browser
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Opzioni di login:

    - `--token <token>` — incolla un token API.
    - `--label <label>` — etichetta memorizzata per i token di login via browser (predefinito: `CLI token`).
    - `--no-browser` — non aprire un browser (richiede `--token`).

  </Accordion>
  <Accordion title="Ricerca">
    ```bash
    clawhub search "query"
    ```

    - `--limit <n>` — numero massimo di risultati.

  </Accordion>
  <Accordion title="Installazione / aggiornamento / elenco">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Opzioni:

    - `--version <version>` — installa o aggiorna a una versione specifica (solo slug singolo su `update`).
    - `--force` — sovrascrive se la cartella esiste già, o quando i file locali non corrispondono a nessuna versione pubblicata.
    - `clawhub list` legge `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Pubblicare Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Opzioni:

    - `--slug <slug>` — slug della Skill.
    - `--name <name>` — nome visualizzato.
    - `--version <version>` — versione semver.
    - `--changelog <text>` — testo del changelog (può essere vuoto).
    - `--tags <tags>` — tag separati da virgole (predefinito: `latest`).

  </Accordion>
  <Accordion title="Pubblicare Plugin">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` può essere una cartella locale, `owner/repo`, `owner/repo@ref`, oppure un
    URL GitHub.

    Opzioni:

    - `--dry-run` — costruisce l'esatto piano di pubblicazione senza caricare nulla.
    - `--json` — emette output leggibile da macchina per la CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — override facoltativi quando il rilevamento automatico non è sufficiente.

  </Accordion>
  <Accordion title="Eliminare / ripristinare (proprietario o admin)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Sincronizzazione (scansiona locale + pubblica nuovi o aggiornati)">
    ```bash
    clawhub sync
    ```

    Opzioni:

    - `--root <dir...>` — radici di scansione aggiuntive.
    - `--all` — carica tutto senza prompt.
    - `--dry-run` — mostra cosa verrebbe caricato.
    - `--bump <type>` — `patch|minor|major` per gli aggiornamenti (predefinito: `patch`).
    - `--changelog <text>` — changelog per aggiornamenti non interattivi.
    - `--tags <tags>` — tag separati da virgole (predefinito: `latest`).
    - `--concurrency <n>` — controlli del registro (predefinito: `4`).

  </Accordion>
</AccordionGroup>

## Flussi di lavoro comuni

<Tabs>
  <Tab title="Ricerca">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Installazione">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Aggiorna tutto">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Pubblica una singola Skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Sincronizza molte Skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Pubblica un Plugin da GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Metadati del pacchetto Plugin

I Plugin di codice devono includere i metadati OpenClaw richiesti in
`package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

I pacchetti pubblicati dovrebbero distribuire **JavaScript compilato** e puntare
`runtimeExtensions` a quell'output. Le installazioni da checkout Git possono comunque fare
fallback al sorgente TypeScript quando non esistono file compilati, ma gli entry
runtime compilati evitano la compilazione runtime di TypeScript nei percorsi di avvio, doctor e caricamento plugin.

## Versionamento, lockfile e telemetria

<AccordionGroup>
  <Accordion title="Versionamento e tag">
    - Ogni pubblicazione crea una nuova `SkillVersion` **semver**.
    - I tag (come `latest`) puntano a una versione; spostare i tag consente il rollback.
    - I changelog sono allegati per versione e possono essere vuoti durante la sincronizzazione o la pubblicazione di aggiornamenti.

  </Accordion>
  <Accordion title="Modifiche locali vs versioni del registro">
    Gli aggiornamenti confrontano il contenuto locale della Skill con le versioni del registro usando un
    hash del contenuto. Se i file locali non corrispondono a nessuna versione pubblicata, la
    CLI chiede conferma prima di sovrascrivere (oppure richiede `--force` nelle
    esecuzioni non interattive).
  </Accordion>
  <Accordion title="Scansione sync e radici di fallback">
    `clawhub sync` scansiona prima la workdir corrente. Se non vengono trovate Skills,
    usa come fallback posizioni legacy note (per esempio
    `~/openclaw/skills` e `~/.openclaw/skills`). Questo è progettato per
    trovare installazioni di Skills più vecchie senza flag aggiuntivi.
  </Accordion>
  <Accordion title="Archiviazione e lockfile">
    - Le Skills installate sono registrate in `.clawhub/lock.json` sotto la tua workdir.
    - I token di autenticazione sono archiviati nel file di configurazione della CLI ClawHub (override tramite `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetria (conteggi di installazione)">
    Quando esegui `clawhub sync` mentre sei connesso, la CLI invia uno snapshot minimo
    per calcolare i conteggi di installazione. Puoi disabilitare completamente questa funzione:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Variabili d'ambiente

| Variabile                    | Effetto                                           |
| ---------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`               | Override dell'URL del sito.                       |
| `CLAWHUB_REGISTRY`           | Override dell'URL API del registro.               |
| `CLAWHUB_CONFIG_PATH`        | Override del percorso in cui la CLI memorizza token/configurazione. |
| `CLAWHUB_WORKDIR`            | Override della workdir predefinita.               |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Disabilita la telemetria su `sync`.              |

## Correlati

- [Plugin della community](/it/plugins/community)
- [Plugin](/it/tools/plugin)
- [Skills](/it/tools/skills)
