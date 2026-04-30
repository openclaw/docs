---
read_when:
    - Ricerca, installazione o aggiornamento di Skills o Plugin
    - Pubblicazione di Skills o Plugin nel registro
    - Configurazione della CLI clawhub o delle relative sovrascritture di ambiente
sidebarTitle: ClawHub
summary: 'ClawHub: registro pubblico per le Skills e i plugin di OpenClaw, flussi di installazione nativi e la CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-30T09:15:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ec09a3c76820137eb1f7ca829a184fc1ed6392d3b32a327ecbda4d2cad7a78d
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub è il registro pubblico per **Skills e Plugin di OpenClaw**.

- Usa i comandi nativi `openclaw` per cercare, installare e aggiornare Skills, e per installare Plugin da ClawHub.
- Usa la CLI separata `clawhub` per i flussi di lavoro di autenticazione del registro, pubblicazione, eliminazione/ripristino e sincronizzazione.

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
    Avvia una nuova sessione OpenClaw: rileverà la nuova skill.
  </Step>
  <Step title="Pubblica (facoltativo)">
    Per i flussi di lavoro autenticati sul registro (pubblicazione, sincronizzazione, gestione), installa
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

    I comandi nativi `openclaw` installano nel workspace attivo e
    mantengono i metadati di origine, così le chiamate successive a `update` possono restare su ClawHub.

  </Tab>
  <Tab title="Plugin">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    Anche le specifiche di Plugin npm-safe senza prefisso vengono provate su ClawHub prima di npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Usa `npm:<package>` quando vuoi la risoluzione solo tramite npm senza una
    ricerca su ClawHub:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Le installazioni dei Plugin convalidano la compatibilità dichiarata di `pluginApi` e
    `minGatewayVersion` prima dell'installazione dell'archivio, quindi
    gli host incompatibili falliscono in modo chiuso e tempestivo invece di installare parzialmente
    il pacchetto.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` accetta solo famiglie di Plugin
installabili. Se un pacchetto ClawHub è in realtà una skill, OpenClaw si ferma e
ti indirizza invece a `openclaw skills install <slug>`.

Anche le installazioni anonime di Plugin ClawHub falliscono in modo chiuso per i pacchetti privati.
I canali community o altri canali non ufficiali possono comunque essere installati, ma OpenClaw
avvisa affinché gli operatori possano esaminare origine e verifica prima di abilitarli.
</Note>

## Che cos'è ClawHub

- Un registro pubblico per Skills e Plugin di OpenClaw.
- Un archivio versionato di bundle e metadati delle skill.
- Una superficie di scoperta per ricerca, tag e segnali d'uso.

Una skill tipica è un bundle versionato di file che include:

- Un file `SKILL.md` con la descrizione principale e l'utilizzo.
- Configurazioni, script o file di supporto facoltativi usati dalla skill.
- Metadati come tag, riepilogo e requisiti di installazione.

ClawHub usa i metadati per alimentare la scoperta ed esporre in modo sicuro le
funzionalità delle skill. Il registro traccia i segnali d'uso (stelle, download) per
migliorare posizionamento e visibilità. Ogni pubblicazione crea una nuova versione
semver, e il registro conserva la cronologia delle versioni affinché gli utenti possano verificare
le modifiche.

## Workspace e caricamento delle skill

La CLI separata `clawhub` installa anche le skill in `./skills` sotto
la directory di lavoro corrente. Se è configurato un workspace OpenClaw,
`clawhub` ripiega su quel workspace a meno che tu non sovrascriva `--workdir`
(o `CLAWHUB_WORKDIR`). OpenClaw carica le skill del workspace da
`<workspace>/skills` e le rileva nella sessione **successiva**.

Se usi già `~/.openclaw/skills` o skill incluse nel bundle, le skill del workspace
hanno la precedenza. Per maggiori dettagli su come le skill vengono caricate,
condivise e protette da gate, vedi [Skills](/it/tools/skills).

## Funzionalità del servizio

| Funzionalità            | Note                                                                    |
| ----------------------- | ----------------------------------------------------------------------- |
| Esplorazione pubblica   | Le Skills e il loro contenuto `SKILL.md` sono visibili pubblicamente.   |
| Ricerca                 | Basata su embedding (ricerca vettoriale), non solo parole chiave.       |
| Versionamento           | Semver, changelog e tag (incluso `latest`).                             |
| Download                | Zip per versione.                                                       |
| Stelle e commenti       | Feedback della community.                                               |
| Riepiloghi scansioni di sicurezza | Le pagine di dettaglio mostrano lo stato dell'ultima scansione prima dell'installazione o del download. |
| Pagine di dettaglio degli scanner | I risultati di VirusTotal, ClawScan e analisi statica hanno link profondi. |
| Dashboard di recupero proprietario | Gli editori possono vedere da `/dashboard` i contenuti di loro proprietà trattenuti dalla scansione. |
| Nuove scansioni richieste dal proprietario | I proprietari possono richiedere nuove scansioni limitate per il recupero da falsi positivi. |
| Moderazione             | Approvazioni e audit.                                                   |
| API adatta alla CLI     | Adatta ad automazione e scripting.                                      |

## Sicurezza e moderazione

ClawHub è aperto per impostazione predefinita: chiunque può caricare skill, ma un account GitHub
deve avere **almeno una settimana** per pubblicare. Questo rallenta
gli abusi senza bloccare i contributori legittimi.

<AccordionGroup>
  <Accordion title="Scansioni di sicurezza">
    ClawHub esegue controlli di sicurezza automatizzati sulle skill pubblicate e sulle release dei Plugin.
    Le pagine di dettaglio pubbliche riassumono il risultato corrente, e le righe degli scanner
    rimandano a pagine di dettaglio dedicate per VirusTotal, ClawScan e analisi statica.

    Le release trattenute dalla scansione o bloccate possono non essere disponibili nel catalogo pubblico e
    nelle superfici di installazione, pur restando visibili al loro proprietario in `/dashboard`.

  </Accordion>
  <Accordion title="Segnalazione">
    - Qualsiasi utente con accesso effettuato può segnalare una skill.
    - I motivi della segnalazione sono obbligatori e registrati.
    - Ogni utente può avere fino a 20 segnalazioni attive alla volta.
    - Le Skills con più di 3 segnalazioni uniche vengono nascoste automaticamente per impostazione predefinita.

  </Accordion>
  <Accordion title="Moderazione">
    - I moderatori possono visualizzare le skill nascoste, renderle di nuovo visibili, eliminarle o bannare utenti.
    - L'abuso della funzione di segnalazione può comportare il ban dell'account.
    - Ti interessa diventare moderatore? Chiedi nel Discord di OpenClaw e contatta un moderatore o manutentore.

  </Accordion>
</AccordionGroup>

## CLI di ClawHub

Ne hai bisogno solo per flussi di lavoro autenticati sul registro come
pubblicazione/sincronizzazione.

### Opzioni globali

<ParamField path="--workdir <dir>" type="string">
  Directory di lavoro. Predefinita: directory corrente; ripiega sul workspace OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Directory delle Skills, relativa a workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  URL base del sito (accesso tramite browser).
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
  <Accordion title="Autenticazione (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Opzioni di login:

    - `--token <token>` — incolla un token API.
    - `--label <label>` — etichetta memorizzata per i token di login tramite browser (predefinita: `CLI token`).
    - `--no-browser` — non aprire un browser (richiede `--token`).

  </Accordion>
  <Accordion title="Ricerca">
    ```bash
    clawhub search "query"
    ```

    Cerca Skills. Per la scoperta di Plugin/pacchetti, usa `clawhub package explore`.

    - `--limit <n>` — risultati massimi.

  </Accordion>
  <Accordion title="Sfoglia / ispeziona Plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` e `package inspect` sono le superfici della CLI di ClawHub per la scoperta di Plugin/pacchetti e l'ispezione dei metadati. Le installazioni native di OpenClaw usano comunque `openclaw plugins install clawhub:<package>`.

    Opzioni:

    - `--family skill|code-plugin|bundle-plugin` — filtra la famiglia di pacchetto.
    - `--official` — mostra solo i pacchetti ufficiali.
    - `--executes-code` — mostra solo i pacchetti che eseguono codice.
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

    - `--version <version>` — installa o aggiorna a una versione specifica (un solo slug su `update`).
    - `--force` — sovrascrivi se la cartella esiste già, oppure quando i file locali non corrispondono ad alcuna versione pubblicata.
    - `clawhub list` legge `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Pubblica Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Opzioni:

    - `--slug <slug>` — slug della skill.
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

    - `--dry-run` — crea il piano esatto di pubblicazione senza caricare nulla.
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

    I comandi di nuova scansione richiedono un token proprietario con accesso effettuato e prendono di mira l'ultima
    versione pubblicata della skill o release del Plugin. Nelle esecuzioni non interattive, passa
    `--yes`.

    Le risposte JSON includono tipo di destinazione, nome, versione, stato della nuova scansione e
    conteggi di richieste rimanenti/massimi per quella versione o release.

  </Accordion>
  <Accordion title="Elimina / ripristina (proprietario o amministratore)">
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
  <Tab title="Cerca">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Trova un plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="Installa">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Aggiorna tutto">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Pubblica una singola skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Sincronizza molte skill">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Pubblica un plugin da GitHub">
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

I pacchetti pubblicati devono includere **JavaScript compilato** e puntare
`runtimeExtensions` a tale output. Le installazioni tramite checkout Git possono ancora
ripiegare sul sorgente TypeScript quando non esistono file compilati, ma le voci
runtime compilate evitano la compilazione TypeScript a runtime nei percorsi di avvio, doctor e
caricamento dei plugin.

## Versionamento, lockfile e telemetria

<AccordionGroup>
  <Accordion title="Versionamento e tag">
    - Ogni pubblicazione crea una nuova `SkillVersion` **semver**.
    - I tag (come `latest`) puntano a una versione; spostare i tag consente di eseguire il rollback.
    - I changelog sono allegati per versione e possono essere vuoti durante la sincronizzazione o la pubblicazione di aggiornamenti.

  </Accordion>
  <Accordion title="Modifiche locali e versioni del registro">
    Gli aggiornamenti confrontano i contenuti della skill locale con le versioni del registro usando un
    hash del contenuto. Se i file locali non corrispondono ad alcuna versione pubblicata, la
    CLI chiede conferma prima di sovrascrivere (o richiede `--force` nelle
    esecuzioni non interattive).
  </Accordion>
  <Accordion title="Scansione di sincronizzazione e radici di fallback">
    `clawhub sync` esegue prima la scansione della workdir corrente. Se non vengono trovate skill,
    ripiega su posizioni legacy note (per esempio
    `~/openclaw/skills` e `~/.openclaw/skills`). Questo è progettato per
    trovare installazioni di skill meno recenti senza flag aggiuntivi.
  </Accordion>
  <Accordion title="Archiviazione e lockfile">
    - Le skill installate sono registrate in `.clawhub/lock.json` sotto la tua workdir.
    - I token di autenticazione sono archiviati nel file di configurazione della CLI ClawHub (sovrascrivibile tramite `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetria (conteggi di installazione)">
    Quando esegui `clawhub sync` mentre sei autenticato, la CLI invia uno snapshot minimo
    per calcolare i conteggi di installazione. Puoi disabilitarlo completamente:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Variabili d'ambiente

| Variabile                     | Effetto                                          |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Sovrascrive l'URL del sito.                     |
| `CLAWHUB_REGISTRY`            | Sovrascrive l'URL dell'API del registro.        |
| `CLAWHUB_CONFIG_PATH`         | Sovrascrive dove la CLI archivia token/config.  |
| `CLAWHUB_WORKDIR`             | Sovrascrive la workdir predefinita.             |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Disabilita la telemetria su `sync`.             |

## Correlati

- [Plugin della community](/it/plugins/community)
- [Plugin](/it/tools/plugin)
- [Skills](/it/tools/skills)
