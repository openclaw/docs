---
read_when:
    - Presentare ClawHub ai nuovi utenti
    - Installare, cercare o pubblicare Skills o Plugin
    - Spiegare i flag della CLI ClawHub e il comportamento di sincronizzazione
summary: 'Guida di ClawHub: registro pubblico, flussi di installazione nativi di OpenClaw e flussi CLI di ClawHub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-24T09:04:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 887bbf942238e3aee84389aa1c85b31b263144021301de37452522e215a0b1e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub è il registro pubblico per **Skills e Plugin di OpenClaw**.

- Usa i comandi nativi `openclaw` per cercare/installare/aggiornare Skills e installare
  Plugin da ClawHub.
- Usa la CLI separata `clawhub` quando hai bisogno di autenticazione al registro, pubblicazione, eliminazione,
  ripristino o flussi di sync.

Sito: [clawhub.ai](https://clawhub.ai)

## Flussi nativi OpenClaw

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugin:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Anche le specifiche dei Plugin bare npm-safe vengono provate contro ClawHub prima di npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

I comandi nativi `openclaw` installano nello spazio di lavoro attivo e persistono metadati di origine
così le successive chiamate `update` possono restare su ClawHub.

Le installazioni dei Plugin validano la compatibilità pubblicizzata di `pluginApi` e `minGatewayVersion`
prima che venga eseguita l'installazione dell'archivio, così gli host incompatibili falliscono in modalità fail-closed
subito invece di installare il pacchetto parzialmente.

`openclaw plugins install clawhub:...` accetta solo famiglie di Plugin installabili.
Se un pacchetto ClawHub è in realtà una skill, OpenClaw si ferma e ti indirizza invece a
`openclaw skills install <slug>`.

## Cos'è ClawHub

- Un registro pubblico per Skills e Plugin di OpenClaw.
- Un archivio versionato di bundle di skill e metadati.
- Una superficie di discovery per ricerca, tag e segnali di utilizzo.

## Come funziona

1. Un utente pubblica un bundle di skill (file + metadati).
2. ClawHub archivia il bundle, analizza i metadati e assegna una versione.
3. Il registro indicizza la skill per ricerca e discovery.
4. Gli utenti sfogliano, scaricano e installano le Skills in OpenClaw.

## Cosa puoi fare

- Pubblicare nuove Skills e nuove versioni di Skills esistenti.
- Scoprire Skills per nome, tag o ricerca.
- Scaricare bundle di skill e ispezionarne i file.
- Segnalare Skills abusive o non sicure.
- Se sei un moderatore, nascondere, mostrare, eliminare o bannare.

## A chi è rivolto (adatto ai principianti)

Se vuoi aggiungere nuove capacità al tuo agente OpenClaw, ClawHub è il modo più semplice per trovare e installare Skills. Non devi sapere come funziona il backend. Puoi:

- Cercare Skills in linguaggio naturale.
- Installare una skill nel tuo spazio di lavoro.
- Aggiornare le Skills più tardi con un solo comando.
- Fare backup delle tue Skills pubblicandole.

## Avvio rapido (non tecnico)

1. Cerca qualcosa di cui hai bisogno:
   - `openclaw skills search "calendar"`
2. Installa una skill:
   - `openclaw skills install <skill-slug>`
3. Avvia una nuova sessione OpenClaw in modo che rilevi la nuova skill.
4. Se vuoi pubblicare o gestire l'autenticazione del registro, installa anche la CLI separata
   `clawhub`.

## Installare la CLI di ClawHub

Ti serve solo per flussi autenticati dal registro come publish/sync:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Come si integra in OpenClaw

Il comando nativo `openclaw skills install` installa nella directory `skills/`
dello spazio di lavoro attivo. `openclaw plugins install clawhub:...` registra una normale installazione gestita
di Plugin più i metadati di origine ClawHub per gli aggiornamenti.

Le installazioni anonime dei Plugin ClawHub falliscono anch'esse in modalità fail-closed per i pacchetti privati.
I canali community o altri canali non ufficiali possono comunque installare, ma OpenClaw avvisa
così gli operatori possono esaminare sorgente e verifica prima di abilitarli.

La CLI separata `clawhub` installa anche le Skills in `./skills` sotto la tua
directory di lavoro corrente. Se è configurato uno spazio di lavoro OpenClaw, `clawhub`
usa come fallback quello spazio di lavoro a meno che tu non esegua l'override con `--workdir` (oppure
`CLAWHUB_WORKDIR`). OpenClaw carica le Skills dello spazio di lavoro da `<workspace>/skills`
e le rileverà nella sessione **successiva**. Se usi già
`~/.openclaw/skills` o Skills incluse, le Skills dello spazio di lavoro hanno la precedenza.

Per maggiori dettagli su come le Skills vengono caricate, condivise e limitate, vedi
[Skills](/it/tools/skills).

## Panoramica del sistema di skill

Una skill è un bundle versionato di file che insegna a OpenClaw come svolgere una
specifica attività. Ogni pubblicazione crea una nuova versione e il registro mantiene una
cronologia delle versioni così gli utenti possono verificare le modifiche.

Una skill tipica include:

- Un file `SKILL.md` con descrizione principale e utilizzo.
- Configurazioni, script o file di supporto facoltativi usati dalla skill.
- Metadati come tag, riepilogo e requisiti di installazione.

ClawHub usa i metadati per supportare il discovery e per esporre in sicurezza le capacità delle skill.
Il registro tiene anche traccia di segnali di utilizzo (come stelle e download) per migliorare
classifica e visibilità.

## Cosa fornisce il servizio (funzionalità)

- **Navigazione pubblica** delle Skills e del loro contenuto `SKILL.md`.
- **Ricerca** supportata da embedding (ricerca vettoriale), non solo parole chiave.
- **Versioning** con semver, changelog e tag (incluso `latest`).
- **Download** come zip per versione.
- **Stelle e commenti** per il feedback della community.
- **Hook di moderazione** per approvazioni e audit.
- **API adatta alla CLI** per automazione e scripting.

## Sicurezza e moderazione

ClawHub è aperto per impostazione predefinita. Chiunque può caricare Skills, ma un account GitHub deve
avere almeno una settimana di vita per poter pubblicare. Questo aiuta a rallentare gli abusi senza bloccare
i contributori legittimi.

Segnalazione e moderazione:

- Qualsiasi utente autenticato può segnalare una skill.
- I motivi della segnalazione sono obbligatori e vengono registrati.
- Ogni utente può avere fino a 20 segnalazioni attive contemporaneamente.
- Le Skills con più di 3 segnalazioni uniche vengono automaticamente nascoste per impostazione predefinita.
- I moderatori possono visualizzare le Skills nascoste, mostrarle, eliminarle o bannare utenti.
- L'abuso della funzione di segnalazione può comportare il ban dell'account.

Interessato a diventare moderatore? Chiedi nel Discord di OpenClaw e contatta un
moderatore o maintainer.

## Comandi CLI e parametri

Opzioni globali (si applicano a tutti i comandi):

- `--workdir <dir>`: directory di lavoro (predefinita: directory corrente; usa come fallback lo spazio di lavoro OpenClaw).
- `--dir <dir>`: directory delle Skills, relativa a workdir (predefinita: `skills`).
- `--site <url>`: URL base del sito (login via browser).
- `--registry <url>`: URL base dell'API del registro.
- `--no-input`: disattiva i prompt (non interattivo).
- `-V, --cli-version`: stampa la versione della CLI.

Autenticazione:

- `clawhub login` (flusso browser) oppure `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Opzioni:

- `--token <token>`: incolla un token API.
- `--label <label>`: etichetta memorizzata per i token di login browser (predefinita: `CLI token`).
- `--no-browser`: non aprire un browser (richiede `--token`).

Ricerca:

- `clawhub search "query"`
- `--limit <n>`: numero massimo di risultati.

Installazione:

- `clawhub install <slug>`
- `--version <version>`: installa una versione specifica.
- `--force`: sovrascrive se la cartella esiste già.

Aggiornamento:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: aggiorna a una versione specifica (solo per un singolo slug).
- `--force`: sovrascrive quando i file locali non corrispondono a nessuna versione pubblicata.

Elenco:

- `clawhub list` (legge `.clawhub/lock.json`)

Pubblicare Skills:

- `clawhub skill publish <path>`
- `--slug <slug>`: slug della skill.
- `--name <name>`: nome visualizzato.
- `--version <version>`: versione semver.
- `--changelog <text>`: testo del changelog (può essere vuoto).
- `--tags <tags>`: tag separati da virgole (predefinito: `latest`).

Pubblicare Plugin:

- `clawhub package publish <source>`
- `<source>` può essere una cartella locale, `owner/repo`, `owner/repo@ref` oppure un URL GitHub.
- `--dry-run`: costruisce il piano di pubblicazione esatto senza caricare nulla.
- `--json`: emette output leggibile da una macchina per CI.
- `--source-repo`, `--source-commit`, `--source-ref`: override facoltativi quando il rilevamento automatico non basta.

Eliminare/ripristinare (solo owner/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sync (scansiona Skills locali + pubblica nuove/aggiornate):

- `clawhub sync`
- `--root <dir...>`: radici di scansione aggiuntive.
- `--all`: carica tutto senza prompt.
- `--dry-run`: mostra cosa verrebbe caricato.
- `--bump <type>`: `patch|minor|major` per gli aggiornamenti (predefinito: `patch`).
- `--changelog <text>`: changelog per aggiornamenti non interattivi.
- `--tags <tags>`: tag separati da virgole (predefinito: `latest`).
- `--concurrency <n>`: controlli sul registro (predefinito: 4).

## Flussi di lavoro comuni per agenti

### Cercare Skills

```bash
clawhub search "postgres backups"
```

### Scaricare nuove Skills

```bash
clawhub install my-skill-pack
```

### Aggiornare Skills installate

```bash
clawhub update --all
```

### Fare backup delle tue Skills (publish o sync)

Per una singola cartella di skill:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Per scansionare e fare backup di molte Skills contemporaneamente:

```bash
clawhub sync --all
```

### Pubblicare un Plugin da GitHub

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

I Plugin di codice devono includere i metadati OpenClaw richiesti in `package.json`:

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

I pacchetti pubblicati dovrebbero distribuire JavaScript compilato e puntare `runtimeExtensions`
a quell'output. Le installazioni da checkout git possono ancora usare come fallback il sorgente TypeScript
quando non esistono file compilati, ma le entry runtime compilate evitano la compilazione runtime di TypeScript
nei percorsi di avvio, doctor e caricamento dei Plugin.

## Dettagli avanzati (tecnici)

### Versioning e tag

- Ogni pubblicazione crea una nuova `SkillVersion` **semver**.
- I tag (come `latest`) puntano a una versione; spostare i tag consente il rollback.
- I changelog sono allegati per versione e possono essere vuoti quando si sincronizzano o pubblicano aggiornamenti.

### Modifiche locali vs versioni del registro

Gli aggiornamenti confrontano il contenuto locale della skill con le versioni del registro usando un hash del contenuto. Se i file locali non corrispondono a nessuna versione pubblicata, la CLI chiede conferma prima di sovrascrivere (oppure richiede `--force` nelle esecuzioni non interattive).

### Scansione sync e radici di fallback

`clawhub sync` scansiona prima la directory di lavoro corrente. Se non trova Skills, usa come fallback posizioni legacy note (ad esempio `~/openclaw/skills` e `~/.openclaw/skills`). Questo è progettato per trovare installazioni di skill più vecchie senza flag aggiuntivi.

### Storage e lockfile

- Le Skills installate vengono registrate in `.clawhub/lock.json` sotto la tua directory di lavoro.
- I token auth sono memorizzati nel file di configurazione della CLI ClawHub (override tramite `CLAWHUB_CONFIG_PATH`).

### Telemetria (conteggi di installazione)

Quando esegui `clawhub sync` mentre sei autenticato, la CLI invia un'istantanea minima per calcolare i conteggi di installazione. Puoi disabilitarlo completamente:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Variabili d'ambiente

- `CLAWHUB_SITE`: override dell'URL del sito.
- `CLAWHUB_REGISTRY`: override dell'URL dell'API del registro.
- `CLAWHUB_CONFIG_PATH`: override del punto in cui la CLI memorizza token/configurazione.
- `CLAWHUB_WORKDIR`: override della workdir predefinita.
- `CLAWHUB_DISABLE_TELEMETRY=1`: disabilita la telemetria su `sync`.

## Correlati

- [Plugin](/it/tools/plugin)
- [Skills](/it/tools/skills)
- [Plugin della community](/it/plugins/community)
