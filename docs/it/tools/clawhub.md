---
read_when:
    - Ricerca, installazione o aggiornamento di Skills o Plugin
    - Pubblicazione di Skills o Plugin nel registro
    - Configurazione della CLI ClawHub o dei relativi override dell'ambiente
sidebarTitle: ClawHub
summary: 'ClawHub: registro pubblico per Skills e plugin di OpenClaw, flussi di installazione nativi e CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T21:01:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd422cb3e7e53fcc6d2b8a557ebc569debb0b470d5fcf141d90499c03fb4d7b3
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub è il registro pubblico per **Skills e Plugin di OpenClaw**.

- Usa i comandi nativi `openclaw` per cercare, installare e aggiornare Skills, e per installare Plugin da ClawHub.
- Usa la CLI separata `clawhub` per i flussi di autenticazione del registro, pubblicazione, eliminazione/ripristino e sincronizzazione.

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
    Avvia una nuova sessione OpenClaw: rileverà il nuovo Skill.
  </Step>
  <Step title="Pubblica (facoltativo)">
    Per i flussi autenticati nel registro (pubblicazione, sincronizzazione, gestione), installa
    la CLI separata `clawhub`:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Flussi nativi di OpenClaw

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    I comandi nativi `openclaw` installano nel tuo workspace attivo e
    mantengono i metadati della sorgente, così le chiamate successive a `update` possono restare su ClawHub.

  </Tab>
  <Tab title="Plugin">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` interroga il catalogo dei Plugin di ClawHub e stampa nomi di pacchetti
    pronti per l’installazione. Usa `clawhub:<package>` quando vuoi la risoluzione tramite ClawHub.
    Le specifiche Plugin npm-safe senza prefisso vengono installate da npm durante il passaggio di lancio:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Anche `npm:<package>` usa solo npm ed è utile quando una specifica potrebbe altrimenti
    essere ambigua:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Le installazioni dei Plugin convalidano la compatibilità dichiarata di `pluginApi` e
    `minGatewayVersion` prima dell’installazione dell’archivio, così gli host incompatibili falliscono in modo chiuso fin dall’inizio invece di installare parzialmente
    il pacchetto. Quando una versione del pacchetto pubblica un artefatto ClawPack,
    OpenClaw preferisce il `.tgz` npm-pack caricato esatto, verifica l’header digest di ClawHub
    e i byte scaricati, e registra tipo di artefatto, integrità npm,
    shasum npm, nome del tarball e metadati digest ClawPack per aggiornamenti
    successivi. Le versioni più vecchie dei pacchetti senza metadati ClawPack continuano a usare il
    percorso legacy di verifica dell’archivio del pacchetto.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` accetta solo famiglie di Plugin
installabili. Se un pacchetto ClawHub è in realtà uno Skill, OpenClaw si ferma e
ti indirizza invece a `openclaw skills install <slug>`.

Anche le installazioni anonime di Plugin ClawHub falliscono in modo chiuso per i pacchetti privati.
I canali community o altri canali non ufficiali possono comunque essere installati, ma OpenClaw
avvisa affinché gli operatori possano esaminare sorgente e verifica prima di abilitarli.
</Note>

## Che cos’è ClawHub

- Un registro pubblico per Skills e Plugin di OpenClaw.
- Un archivio versionato di bundle e metadati degli Skill.
- Una superficie di scoperta per ricerca, tag e segnali di utilizzo.

Uno Skill tipico è un bundle versionato di file che include:

- Un file `SKILL.md` con descrizione principale e modalità d’uso.
- Configurazioni, script o file di supporto facoltativi usati dallo Skill.
- Metadati come tag, riepilogo e requisiti di installazione.

ClawHub usa i metadati per alimentare la scoperta ed esporre in sicurezza le
capacità degli Skill. Il registro tiene traccia dei segnali di utilizzo (stelle, download) per
migliorare ranking e visibilità. Ogni pubblicazione crea una nuova versione
semver, e il registro conserva la cronologia delle versioni affinché gli utenti possano controllare
le modifiche.

## Workspace e caricamento degli Skill

La CLI separata `clawhub` installa anche gli Skill in `./skills` sotto
la directory di lavoro corrente. Se è configurato un workspace OpenClaw,
`clawhub` ripiega su quel workspace a meno che tu non sovrascriva `--workdir`
(o `CLAWHUB_WORKDIR`). OpenClaw carica gli Skill del workspace da
`<workspace>/skills` e li rileva nella sessione **successiva**.

Se usi già `~/.openclaw/skills` o Skill inclusi, gli Skill del workspace
hanno la precedenza. Per maggiori dettagli su come gli Skill vengono caricati,
condivisi e sottoposti a gate, consulta [Skills](/it/tools/skills).

## Funzionalità del servizio

| Funzionalità             | Note                                                                |
| ------------------------ | ------------------------------------------------------------------- |
| Navigazione pubblica     | Gli Skill e il loro contenuto `SKILL.md` sono visibili pubblicamente. |
| Ricerca                  | Basata su embedding (ricerca vettoriale), non solo parole chiave.   |
| Versionamento            | Semver, changelog e tag (incluso `latest`).                         |
| Download                 | Zip per versione.                                                   |
| Stelle e commenti        | Feedback della community.                                           |
| Riepiloghi scansioni di sicurezza | Le pagine di dettaglio mostrano lo stato più recente della scansione prima dell’installazione o del download. |
| Pagine di dettaglio scanner | I risultati di VirusTotal, ClawScan e analisi statica hanno link profondi. |
| Dashboard di recupero proprietario | Gli editori possono vedere da `/dashboard` i contenuti di loro proprietà trattenuti dalla scansione. |
| Nuove scansioni richieste dal proprietario | I proprietari possono richiedere nuove scansioni limitate per il recupero da falsi positivi. |
| Moderazione              | Approvazioni e audit.                                               |
| API adatta alla CLI      | Adatta ad automazione e scripting.                                  |

## Sicurezza e moderazione

ClawHub è aperto per impostazione predefinita: chiunque può caricare Skill, ma un account GitHub
deve avere **almeno una settimana** per pubblicare. Questo rallenta gli abusi
senza bloccare i contributori legittimi.

<AccordionGroup>
  <Accordion title="Scansioni di sicurezza">
    ClawHub esegue controlli di sicurezza automatizzati sugli Skill e sulle release dei Plugin
    pubblicati. Le pagine di dettaglio pubbliche riassumono il risultato corrente, e le righe degli scanner
    rimandano a pagine di dettaglio dedicate per VirusTotal, ClawScan e analisi statica.

    Le release trattenute dalla scansione o bloccate potrebbero non essere disponibili nel catalogo pubblico e
    nelle superfici di installazione, pur restando visibili al loro proprietario in `/dashboard`.

  </Accordion>
  <Accordion title="Segnalazioni">
    - Qualsiasi utente con accesso effettuato può segnalare uno Skill.
    - I motivi della segnalazione sono obbligatori e registrati.
    - Ogni utente può avere fino a 20 segnalazioni attive alla volta.
    - Gli Skill con più di 3 segnalazioni uniche vengono nascosti automaticamente per impostazione predefinita.

  </Accordion>
  <Accordion title="Moderazione">
    - I moderatori possono visualizzare gli Skill nascosti, renderli nuovamente visibili, eliminarli o bannare utenti.
    - L’abuso della funzionalità di segnalazione può comportare il ban dell’account.
    - Ti interessa diventare moderatore? Chiedi nel Discord di OpenClaw e contatta un moderatore o un maintainer.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Ne hai bisogno solo per flussi autenticati nel registro, come
pubblicazione/sincronizzazione.

### Opzioni globali

<ParamField path="--workdir <dir>" type="string">
  Directory di lavoro. Predefinita: directory corrente; ripiega sul workspace OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Directory Skills, relativa a workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  URL base del sito (login da browser).
</ParamField>
<ParamField path="--registry <url>" type="string">
  URL base dell’API del registro.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Disabilita i prompt (non interattivo).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  Stampa la versione della CLI.
</ParamField>

### Comandi

<AccordionGroup>
  <Accordion title="Autenticazione (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Opzioni di login:

    - `--token <token>` — incolla un token API.
    - `--label <label>` — etichetta salvata per i token di login da browser (predefinita: `CLI token`).
    - `--no-browser` — non aprire un browser (richiede `--token`).

  </Accordion>
  <Accordion title="Ricerca">
    ```bash
    clawhub search "query"
    ```

    Cerca Skill. Per la scoperta di Plugin/pacchetti, usa `clawhub package explore`.

    - `--limit <n>` — risultati massimi.

  </Accordion>
  <Accordion title="Sfoglia / ispeziona Plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` e `package inspect` sono le superfici della CLI ClawHub per la scoperta di Plugin/pacchetti e l’ispezione dei metadati. Le installazioni native OpenClaw continuano a usare `openclaw plugins install clawhub:<package>`.

    Opzioni:

    - `--family skill|code-plugin|bundle-plugin` — filtra la famiglia del pacchetto.
    - `--official` — mostra solo pacchetti ufficiali.
    - `--executes-code` — mostra solo pacchetti che eseguono codice.
    - `--version <version>` / `--tag <tag>` — ispeziona una versione specifica del pacchetto.
    - `--versions`, `--files`, `--file <path>` — ispeziona cronologia e file del pacchetto.
    - `--json` — output leggibile da macchina.

  </Accordion>
  <Accordion title="Installa / aggiorna / elenca">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Opzioni:

    - `--version <version>` — installa o aggiorna a una versione specifica (slug singolo solo su `update`).
    - `--force` — sovrascrivi se la cartella esiste già, o quando i file locali non corrispondono ad alcuna versione pubblicata.
    - `clawhub list` legge `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Pubblica Skill">
    ```bash
    clawhub skill publish <path>
    ```

    Opzioni:

    - `--slug <slug>` — slug dello Skill.
    - `--name <name>` — nome visualizzato.
    - `--version <version>` — versione semver.
    - `--changelog <text>` — testo del changelog (può essere vuoto).
    - `--tags <tags>` — tag separati da virgole (predefinito: `latest`).

  </Accordion>
  <Accordion title="Pubblica Plugin">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` può essere una cartella locale, `owner/repo`, `owner/repo@ref` o un
    URL GitHub.

    Opzioni:

    - `--dry-run` — costruisce il piano esatto di pubblicazione senza caricare nulla.
    - `--json` — emette output leggibile da macchina per CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — override facoltativi quando il rilevamento automatico non basta.

  </Accordion>
  <Accordion title="Richiedi nuove scansioni">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    I comandi di nuova scansione richiedono un token proprietario con accesso effettuato e prendono di mira la versione
    pubblicata più recente dello Skill o la release del Plugin. Nelle esecuzioni non interattive, passa
    `--yes`.

    Le risposte JSON includono tipo di target, nome, versione, stato della nuova scansione e
    conteggi richieste rimanenti/massime per quella versione o release.

  </Accordion>
  <Accordion title="Elimina / ripristina (proprietario o admin)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Sincronizza (scansiona locale + pubblica nuovo o aggiornato)">
    ```bash
    clawhub sync
    ```

    Opzioni:

    - `--root <dir...>` — root di scansione extra.
    - `--all` — carica tutto senza prompt.
    - `--dry-run` — mostra cosa verrebbe caricato.
    - `--bump <type>` — `patch|minor|major` per gli aggiornamenti (predefinito: `patch`).
    - `--changelog <text>` — changelog per aggiornamenti non interattivi.
    - `--tags <tags>` — tag separati da virgole (predefinito: `latest`).
    - `--concurrency <n>` — controlli del registro (predefinito: `4`).

  </Accordion>
</AccordionGroup>

## Flussi comuni

<Tabs>
  <Tab title="Search">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Find a plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="Install">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Update all">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Publish a single skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Sync many skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Publish a plugin from GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Metadati del pacchetto Plugin

I plugin di codice devono includere i metadati OpenClaw richiesti in
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

I pacchetti pubblicati dovrebbero includere **JavaScript compilato** e puntare
`runtimeExtensions` a tale output. Le installazioni da checkout Git possono comunque
ripiegare sul sorgente TypeScript quando non esistono file compilati, ma le voci
runtime compilate evitano la compilazione TypeScript a runtime nei percorsi di avvio, doctor e
caricamento dei plugin.

## Versionamento, lockfile e telemetria

<AccordionGroup>
  <Accordion title="Versioning and tags">
    - Ogni pubblicazione crea una nuova `SkillVersion` **semver**.
    - I tag (come `latest`) puntano a una versione; spostare i tag consente di eseguire il rollback.
    - I changelog sono allegati per versione e possono essere vuoti durante la sincronizzazione o la pubblicazione di aggiornamenti.

  </Accordion>
  <Accordion title="Local changes vs registry versions">
    Gli aggiornamenti confrontano i contenuti locali della skill con le versioni del registry usando un
    hash del contenuto. Se i file locali non corrispondono ad alcuna versione pubblicata, la
    CLI chiede conferma prima di sovrascrivere (o richiede `--force` nelle
    esecuzioni non interattive).
  </Accordion>
  <Accordion title="Sync scanning and fallback roots">
    `clawhub sync` analizza prima la workdir corrente. Se non vengono trovate skill,
    ripiega sulle posizioni legacy note (per esempio
    `~/openclaw/skills` e `~/.openclaw/skills`). Questo è progettato per
    trovare installazioni di skill meno recenti senza flag aggiuntivi.
  </Accordion>
  <Accordion title="Storage and lockfile">
    - Le skill installate sono registrate in `.clawhub/lock.json` nella tua workdir.
    - I token di autenticazione sono archiviati nel file di configurazione della CLI ClawHub (sovrascrivibile tramite `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetry (install counts)">
    Quando esegui `clawhub sync` dopo l'accesso, la CLI invia uno snapshot minimo
    per calcolare i conteggi delle installazioni. Puoi disabilitarlo completamente:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Variabili d'ambiente

| Variabile                     | Effetto                                         |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Sostituisce l'URL del sito.                     |
| `CLAWHUB_REGISTRY`            | Sostituisce l'URL dell'API del registry.        |
| `CLAWHUB_CONFIG_PATH`         | Sostituisce la posizione in cui la CLI archivia il token/config. |
| `CLAWHUB_WORKDIR`             | Sostituisce la workdir predefinita.             |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Disabilita la telemetria su `sync`.             |

## Correlati

- [Plugin della community](/it/plugins/community)
- [Plugin](/it/tools/plugin)
- [Skills](/it/tools/skills)
