---
read_when:
    - Cercare, installare o aggiornare Skills o Plugin
    - Pubblicazione di Skills o Plugin nel registro
    - Configurare la CLI clawhub o i relativi override di ambiente
sidebarTitle: ClawHub
summary: 'ClawHub: registro pubblico per Skills e Plugin di OpenClaw, flussi di installazione nativi e CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-06T09:10:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78ccf1911344d71b3b1c2c94691e15108305348e09db62aaaf1d03d852984acd
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
    Avvia una nuova sessione OpenClaw: rileverà la nuova skill.
  </Step>
  <Step title="Pubblica (opzionale)">
    Per i flussi autenticati dal registro (pubblicazione, sincronizzazione, gestione), installa
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

    I comandi nativi `openclaw` installano nell'area di lavoro attiva e
    conservano i metadati della sorgente, così le chiamate successive a `update` possono rimanere su ClawHub.

  </Tab>
  <Tab title="Plugin">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` interroga il catalogo Plugin di ClawHub e stampa nomi
    di pacchetti pronti per l'installazione. Usa `clawhub:<package>` quando vuoi la risoluzione tramite ClawHub.
    Le specifiche Plugin semplici compatibili con npm installano da npm durante la transizione di lancio:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Anche `npm:<package>` usa solo npm ed è utile quando una specifica potrebbe altrimenti
    essere ambigua:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Le installazioni dei Plugin convalidano la compatibilità dichiarata di `pluginApi` e
    `minGatewayVersion` prima dell'esecuzione dell'installazione dell'archivio, così
    gli host incompatibili si chiudono in modo sicuro in anticipo invece di installare parzialmente
    il pacchetto. Quando una versione del pacchetto pubblica un artefatto ClawPack,
    OpenClaw preferisce l'esatto `.tgz` npm-pack caricato, verifica l'header del digest ClawHub
    e i byte scaricati, e registra il tipo di artefatto, l'integrità npm,
    lo shasum npm, il nome del tarball e i metadati del digest ClawPack per gli
    aggiornamenti successivi. Le versioni meno recenti dei pacchetti senza metadati ClawPack usano ancora
    il percorso legacy di verifica dell'archivio del pacchetto.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` accetta solo famiglie Plugin
installabili. Se un pacchetto ClawHub è in realtà una skill, OpenClaw si ferma e
ti indirizza invece a `openclaw skills install <slug>`.

Anche le installazioni anonime di Plugin ClawHub falliscono in modo sicuro per i pacchetti privati.
Canali della community o altri canali non ufficiali possono comunque essere installati, ma OpenClaw
mostra un avviso affinché gli operatori possano verificare sorgente e validazione prima di abilitarli.
</Note>

## Che cos'è ClawHub

- Un registro pubblico per Skills e Plugin di OpenClaw.
- Un archivio versionato di bundle e metadati delle skill.
- Una superficie di scoperta per ricerca, tag e segnali di utilizzo.

Una skill tipica è un bundle versionato di file che include:

- Un file `SKILL.md` con la descrizione principale e l'utilizzo.
- Configurazioni opzionali, script o file di supporto usati dalla skill.
- Metadati come tag, riepilogo e requisiti di installazione.

ClawHub usa i metadati per alimentare la scoperta ed esporre in modo sicuro le
capacità delle skill. Il registro traccia segnali di utilizzo (stelle, download) per
migliorare ranking e visibilità. Ogni pubblicazione crea una nuova versione
semver e il registro conserva la cronologia delle versioni, così gli utenti possono controllare
le modifiche.

## Area di lavoro e caricamento delle skill

Anche la CLI separata `clawhub` installa le skill in `./skills` sotto
la directory di lavoro corrente. Se è configurata un'area di lavoro OpenClaw,
`clawhub` ripiega su quell'area di lavoro a meno che tu non sovrascriva `--workdir`
(o `CLAWHUB_WORKDIR`). OpenClaw carica le skill dell'area di lavoro da
`<workspace>/skills` e le rileva nella sessione **successiva**.

Se usi già `~/.openclaw/skills` o skill incluse, le skill dell'area di lavoro
hanno la precedenza. Per maggiori dettagli su come le skill vengono caricate,
condivise e controllate, vedi [Skills](/it/tools/skills).

## Funzionalità del servizio

| Funzionalità             | Note                                                                |
| ------------------------ | ------------------------------------------------------------------- |
| Navigazione pubblica     | Le skill e il loro contenuto `SKILL.md` sono visibili pubblicamente. |
| Ricerca                  | Basata su embedding (ricerca vettoriale), non solo parole chiave.   |
| Versionamento            | Semver, changelog e tag (incluso `latest`).                         |
| Download                 | Zip per versione.                                                   |
| Stelle e commenti        | Feedback della community.                                           |
| Riepiloghi scansione sicurezza | Le pagine di dettaglio mostrano lo stato dell'ultima scansione prima di installare o scaricare. |
| Pagine di dettaglio scanner | I risultati VirusTotal, ClawScan e di analisi statica hanno link profondi. |
| Dashboard di recupero proprietario | Gli editori possono vedere da `/dashboard` contenuti di loro proprietà trattenuti dalla scansione. |
| Nuove scansioni richieste dal proprietario | I proprietari possono richiedere nuove scansioni limitate per il recupero da falsi positivi. |
| Moderazione              | Approvazioni e audit.                                               |
| API adatta alla CLI      | Adatta ad automazione e scripting.                                  |

## Sicurezza e moderazione

ClawHub è aperto per impostazione predefinita: chiunque può caricare skill, ma un account GitHub
deve avere **almeno una settimana** per pubblicare. Questo rallenta
gli abusi senza bloccare i contributori legittimi.

<AccordionGroup>
  <Accordion title="Scansioni di sicurezza">
    ClawHub esegue controlli di sicurezza automatizzati sulle skill pubblicate e sulle release dei Plugin.
    Le pagine di dettaglio pubbliche riassumono il risultato corrente e le righe degli scanner
    collegano a pagine di dettaglio dedicate per VirusTotal, ClawScan e analisi
    statica.

    Le release trattenute dalla scansione o bloccate possono non essere disponibili nel catalogo pubblico e
    nelle superfici di installazione, pur rimanendo visibili al proprietario in `/dashboard`.

  </Accordion>
  <Accordion title="Segnalazioni">
    - Qualsiasi utente autenticato può segnalare una skill.
    - I motivi della segnalazione sono obbligatori e registrati.
    - Ogni utente può avere fino a 20 segnalazioni attive alla volta.
    - Le skill con più di 3 segnalazioni uniche sono nascoste automaticamente per impostazione predefinita.

  </Accordion>
  <Accordion title="Moderazione">
    - I moderatori possono visualizzare le skill nascoste, renderle di nuovo visibili, eliminarle o bannare utenti.
    - L'abuso della funzione di segnalazione può comportare il ban dell'account.
    - Ti interessa diventare moderatore? Chiedi nel Discord di OpenClaw e contatta un moderatore o un maintainer.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Ti serve solo per flussi autenticati dal registro, come
pubblicazione/sincronizzazione.

### Opzioni globali

<ParamField path="--workdir <dir>" type="string">
  Directory di lavoro. Predefinito: directory corrente; ripiega sull'area di lavoro OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Directory delle Skills, relativa a workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  URL base del sito (login tramite browser).
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

    - `--token <token>` - incolla un token API.
    - `--label <label>` - etichetta archiviata per i token di login tramite browser (predefinito: `CLI token`).
    - `--no-browser` - non aprire un browser (richiede `--token`).

  </Accordion>
  <Accordion title="Ricerca">
    ```bash
    clawhub search "query"
    ```

    Cerca le skill. Per la scoperta di Plugin/pacchetti, usa `clawhub package explore`.

    - `--limit <n>` - risultati massimi.

  </Accordion>
  <Accordion title="Sfoglia / ispeziona Plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` e `package inspect` sono le superfici della CLI ClawHub per la scoperta di Plugin/pacchetti e l'ispezione dei metadati. Le installazioni native di OpenClaw usano comunque `openclaw plugins install clawhub:<package>`.

    Opzioni:

    - `--family skill|code-plugin|bundle-plugin` - filtra la famiglia del pacchetto.
    - `--official` - mostra solo pacchetti ufficiali.
    - `--executes-code` - mostra solo pacchetti che eseguono codice.
    - `--version <version>` / `--tag <tag>` - ispeziona una versione specifica del pacchetto.
    - `--versions`, `--files`, `--file <path>` - ispeziona la cronologia e i file del pacchetto.
    - `--json` - output leggibile da macchina.

  </Accordion>
  <Accordion title="Installa / aggiorna / elenca">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Opzioni:

    - `--version <version>` - installa o aggiorna a una versione specifica (slug singolo solo su `update`).
    - `--force` - sovrascrivi se la cartella esiste già o quando i file locali non corrispondono ad alcuna versione pubblicata.
    - `clawhub list` legge `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Pubblica Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Opzioni:

    - `--slug <slug>` - slug della skill.
    - `--name <name>` - nome visualizzato.
    - `--version <version>` - versione semver.
    - `--changelog <text>` - testo del changelog (può essere vuoto).
    - `--tags <tags>` - tag separati da virgole (predefinito: `latest`).

  </Accordion>
  <Accordion title="Pubblica Plugin">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` può essere una cartella locale, `owner/repo`, `owner/repo@ref` o un
    URL GitHub.

    Opzioni:

    - `--dry-run` - crea il piano esatto di pubblicazione senza caricare nulla.
    - `--json` - emetti output leggibile da macchina per CI.
    - `--source-repo`, `--source-commit`, `--source-ref` - override opzionali quando il rilevamento automatico non basta.

  </Accordion>
  <Accordion title="Richiedi nuove scansioni">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    I comandi di nuova scansione richiedono un token proprietario autenticato e puntano all'ultima
    versione della skill pubblicata o release del Plugin. Nelle esecuzioni non interattive, passa
    `--yes`.

    Le risposte JSON includono il tipo del target, nome, versione, stato della nuova scansione e
    conteggi residui/massimi delle richieste per quella versione o release.

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

    - `--root <dir...>` - radici di scansione aggiuntive.
    - `--all` - carica tutto senza prompt.
    - `--dry-run` - mostra cosa verrebbe caricato.
    - `--bump <type>` - `patch|minor|major` per gli aggiornamenti (predefinito: `patch`).
    - `--changelog <text>` - changelog per aggiornamenti non interattivi.
    - `--tags <tags>` - tag separati da virgole (predefinito: `latest`).
    - `--concurrency <n>` - controlli del registro (predefinito: `4`).

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

### Metadati del pacchetto plugin

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
`runtimeExtensions` a tale output. Le installazioni da checkout Git possono comunque ricorrere
al sorgente TypeScript quando non esistono file compilati, ma le voci runtime
compilate evitano la compilazione TypeScript a runtime nei percorsi di avvio, doctor e
caricamento dei plugin.

## Versionamento, lockfile e telemetria

<AccordionGroup>
  <Accordion title="Versionamento e tag">
    - Ogni pubblicazione crea una nuova `SkillVersion` **semver**.
    - I tag (come `latest`) puntano a una versione; spostare i tag consente di eseguire il rollback.
    - I changelog sono associati per versione e possono essere vuoti durante la sincronizzazione o la pubblicazione di aggiornamenti.

  </Accordion>
  <Accordion title="Modifiche locali rispetto alle versioni del registro">
    Gli aggiornamenti confrontano i contenuti locali della skill con le versioni del registro usando un
    hash del contenuto. Se i file locali non corrispondono a nessuna versione pubblicata, la
    CLI chiede conferma prima di sovrascrivere (o richiede `--force` nelle
    esecuzioni non interattive).
  </Accordion>
  <Accordion title="Scansione di sync e radici di fallback">
    `clawhub sync` esamina prima la directory di lavoro corrente. Se non vengono trovate skill,
    ripiega sulle posizioni legacy note (per esempio
    `~/openclaw/skills` e `~/.openclaw/skills`). Questo è pensato per
    trovare installazioni di skill più vecchie senza flag aggiuntivi.
  </Accordion>
  <Accordion title="Archiviazione e lockfile">
    - Le skill installate sono registrate in `.clawhub/lock.json` sotto la tua directory di lavoro.
    - I token di autenticazione sono archiviati nel file di configurazione della CLI di ClawHub (sovrascrivibile tramite `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetria (conteggi di installazione)">
    Quando esegui `clawhub sync` dopo aver effettuato l'accesso, la CLI invia uno snapshot
    minimo per calcolare i conteggi di installazione. Puoi disattivarlo completamente:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Variabili di ambiente

| Variabile                     | Effetto                                         |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Sovrascrive l'URL del sito.                     |
| `CLAWHUB_REGISTRY`            | Sovrascrive l'URL dell'API del registro.        |
| `CLAWHUB_CONFIG_PATH`         | Sovrascrive dove la CLI archivia il token/configurazione. |
| `CLAWHUB_WORKDIR`             | Sovrascrive la directory di lavoro predefinita. |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Disattiva la telemetria su `sync`.              |

## Correlati

- [Plugin della community](/it/plugins/community)
- [Plugin](/it/tools/plugin)
- [Skills](/it/tools/skills)
