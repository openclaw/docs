---
read_when:
    - Presentazione di ClawHub a nuovi utenti
    - Installazione, ricerca o pubblicazione di skill o plugin
    - Spiegazione dei flag della CLI di ClawHub e del comportamento di sincronizzazione
summary: 'Guida a ClawHub: registro pubblico, flussi di installazione nativi di OpenClaw e workflow della CLI di ClawHub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-05T14:06:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: e65b3fd770ca96a5dd828dce2dee4ef127268f4884180a912f43d7744bc5706f
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHub è il registro pubblico per **skill e plugin di OpenClaw**.

- Usa i comandi nativi `openclaw` per cercare/installare/aggiornare skill e installare
  plugin da ClawHub.
- Usa la CLI separata `clawhub` quando ti servono autenticazione del registro, pubblicazione, eliminazione,
  ripristino o workflow di sincronizzazione.

Sito: [clawhub.ai](https://clawhub.ai)

## Flussi nativi di OpenClaw

Skill:

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

Le specifiche plugin essenziali compatibili con npm vengono provate anche su ClawHub prima di npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

I comandi nativi `openclaw` installano nel workspace attivo e mantengono i metadati
della sorgente così che le successive chiamate `update` possano restare su ClawHub.

Le installazioni di plugin convalidano la compatibilità dichiarata di `pluginApi` e `minGatewayVersion`
prima che venga eseguita l'installazione dell'archivio, così gli host incompatibili falliscono in modo sicuro
fin dall'inizio invece di installare parzialmente il pacchetto.

`openclaw plugins install clawhub:...` accetta solo famiglie di plugin installabili.
Se un pacchetto ClawHub è in realtà una skill, OpenClaw si ferma e ti indirizza invece a
`openclaw skills install <slug>`.

## Cos'è ClawHub

- Un registro pubblico per skill e plugin di OpenClaw.
- Un archivio versionato di bundle di skill e metadati.
- Una superficie di scoperta per ricerca, tag e segnali di utilizzo.

## Come funziona

1. Un utente pubblica un bundle di skill (file + metadati).
2. ClawHub archivia il bundle, analizza i metadati e assegna una versione.
3. Il registro indicizza la skill per la ricerca e la scoperta.
4. Gli utenti sfogliano, scaricano e installano skill in OpenClaw.

## Cosa puoi fare

- Pubblicare nuove skill e nuove versioni di skill esistenti.
- Scoprire skill per nome, tag o ricerca.
- Scaricare bundle di skill e ispezionarne i file.
- Segnalare skill abusive o non sicure.
- Se sei un moderatore, nascondere, mostrare di nuovo, eliminare o bannare.

## A chi è rivolto (adatto ai principianti)

Se vuoi aggiungere nuove funzionalità al tuo agente OpenClaw, ClawHub è il modo più semplice per trovare e installare skill. Non devi sapere come funziona il backend. Puoi:

- Cercare skill usando linguaggio naturale.
- Installare una skill nel tuo workspace.
- Aggiornare le skill in seguito con un solo comando.
- Fare il backup delle tue skill pubblicandole.

## Guida rapida (non tecnica)

1. Cerca qualcosa di cui hai bisogno:
   - `openclaw skills search "calendar"`
2. Installa una skill:
   - `openclaw skills install <skill-slug>`
3. Avvia una nuova sessione OpenClaw così rileverà la nuova skill.
4. Se vuoi pubblicare o gestire l'autenticazione del registro, installa anche la
   CLI separata `clawhub`.

## Installa la CLI di ClawHub

Ti serve solo per workflow autenticati al registro, come pubblicazione/sincronizzazione:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Come si integra in OpenClaw

Il comando nativo `openclaw skills install` installa nella directory `skills/`
del workspace attivo. `openclaw plugins install clawhub:...` registra una normale
installazione gestita del plugin più i metadati della sorgente ClawHub per gli aggiornamenti.

Anche le installazioni anonime di plugin ClawHub falliscono in modo sicuro per i pacchetti privati.
I canali community o altri canali non ufficiali possono comunque installare, ma OpenClaw avvisa
così gli operatori possono verificare sorgente e validazione prima di abilitarli.

La CLI separata `clawhub` installa anch'essa le skill in `./skills` sotto la
directory di lavoro corrente. Se è configurato un workspace OpenClaw, `clawhub`
usa quel workspace come fallback a meno che tu non sovrascriva `--workdir` (o
`CLAWHUB_WORKDIR`). OpenClaw carica le skill del workspace da `<workspace>/skills`
e le rileverà nella sessione **successiva**. Se usi già
`~/.openclaw/skills` o skill integrate, le skill del workspace hanno la precedenza.

Per maggiori dettagli su come le skill vengono caricate, condivise e limitate, vedi
[Skills](/tools/skills).

## Panoramica del sistema di skill

Una skill è un bundle versionato di file che insegna a OpenClaw come eseguire un
compito specifico. Ogni pubblicazione crea una nuova versione e il registro mantiene uno
storico delle versioni così che gli utenti possano verificare le modifiche.

Una skill tipica include:

- Un file `SKILL.md` con la descrizione principale e l'utilizzo.
- Configurazioni, script o file di supporto facoltativi usati dalla skill.
- Metadati come tag, riepilogo e requisiti di installazione.

ClawHub usa i metadati per supportare la scoperta e mostrare in modo sicuro le capacità delle skill.
Il registro traccia anche segnali di utilizzo (come stelle e download) per migliorare
classifica e visibilità.

## Cosa offre il servizio (funzionalità)

- **Navigazione pubblica** delle skill e del loro contenuto `SKILL.md`.
- **Ricerca** basata su embedding (ricerca vettoriale), non solo su parole chiave.
- **Versionamento** con semver, changelog e tag (incluso `latest`).
- **Download** come zip per versione.
- **Stelle e commenti** per il feedback della community.
- Hook di **moderazione** per approvazioni e verifiche.
- **API adatta alla CLI** per automazione e scripting.

## Sicurezza e moderazione

ClawHub è aperto per impostazione predefinita. Chiunque può caricare skill, ma per pubblicare un account GitHub deve
avere almeno una settimana di vita. Questo aiuta a rallentare gli abusi senza bloccare
i contributori legittimi.

Segnalazione e moderazione:

- Qualsiasi utente con accesso può segnalare una skill.
- I motivi della segnalazione sono obbligatori e registrati.
- Ogni utente può avere fino a 20 segnalazioni attive contemporaneamente.
- Le skill con più di 3 segnalazioni uniche vengono nascoste automaticamente per impostazione predefinita.
- I moderatori possono visualizzare skill nascoste, mostrarle di nuovo, eliminarle o bannare utenti.
- L'abuso della funzione di segnalazione può comportare il ban dell'account.

Ti interessa diventare moderatore? Chiedi nel Discord di OpenClaw e contatta un
moderatore o un maintainer.

## Comandi e parametri della CLI

Opzioni globali (si applicano a tutti i comandi):

- `--workdir <dir>`: Directory di lavoro (predefinita: directory corrente; fallback al workspace OpenClaw).
- `--dir <dir>`: Directory delle skill, relativa alla workdir (predefinita: `skills`).
- `--site <url>`: URL base del sito (login via browser).
- `--registry <url>`: URL base dell'API del registro.
- `--no-input`: Disabilita i prompt (non interattivo).
- `-V, --cli-version`: Stampa la versione della CLI.

Autenticazione:

- `clawhub login` (flusso browser) oppure `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Opzioni:

- `--token <token>`: Incolla un token API.
- `--label <label>`: Etichetta memorizzata per i token di login via browser (predefinita: `CLI token`).
- `--no-browser`: Non aprire un browser (richiede `--token`).

Ricerca:

- `clawhub search "query"`
- `--limit <n>`: Numero massimo di risultati.

Installazione:

- `clawhub install <slug>`
- `--version <version>`: Installa una versione specifica.
- `--force`: Sovrascrive se la cartella esiste già.

Aggiornamento:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: Aggiorna a una versione specifica (solo per un singolo slug).
- `--force`: Sovrascrive quando i file locali non corrispondono a nessuna versione pubblicata.

Elenco:

- `clawhub list` (legge `.clawhub/lock.json`)

Pubblicazione di skill:

- `clawhub skill publish <path>`
- `--slug <slug>`: Slug della skill.
- `--name <name>`: Nome visualizzato.
- `--version <version>`: Versione semver.
- `--changelog <text>`: Testo del changelog (può essere vuoto).
- `--tags <tags>`: Tag separati da virgole (predefinito: `latest`).

Pubblicazione di plugin:

- `clawhub package publish <source>`
- `<source>` può essere una cartella locale, `owner/repo`, `owner/repo@ref` o un URL GitHub.
- `--dry-run`: Costruisce il piano di pubblicazione esatto senza caricare nulla.
- `--json`: Produce output leggibile da macchina per CI.
- `--source-repo`, `--source-commit`, `--source-ref`: Sovrascritture facoltative quando il rilevamento automatico non basta.

Eliminazione/ripristino (solo proprietario/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sincronizzazione (scansiona le skill locali + pubblica quelle nuove/aggiornate):

- `clawhub sync`
- `--root <dir...>`: Radici di scansione aggiuntive.
- `--all`: Carica tutto senza prompt.
- `--dry-run`: Mostra cosa verrebbe caricato.
- `--bump <type>`: `patch|minor|major` per gli aggiornamenti (predefinito: `patch`).
- `--changelog <text>`: Changelog per aggiornamenti non interattivi.
- `--tags <tags>`: Tag separati da virgole (predefinito: `latest`).
- `--concurrency <n>`: Controlli del registro (predefinito: 4).

## Workflow comuni per agenti

### Cercare skill

```bash
clawhub search "postgres backups"
```

### Scaricare nuove skill

```bash
clawhub install my-skill-pack
```

### Aggiornare le skill installate

```bash
clawhub update --all
```

### Fare il backup delle tue skill (pubblicazione o sincronizzazione)

Per una singola cartella skill:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Per scansionare e fare il backup di molte skill in una volta:

```bash
clawhub sync --all
```

### Pubblicare un plugin da GitHub

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

I plugin di codice devono includere i metadati OpenClaw richiesti in `package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
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

## Dettagli avanzati (tecnici)

### Versionamento e tag

- Ogni pubblicazione crea una nuova `SkillVersion` **semver**.
- I tag (come `latest`) puntano a una versione; spostare i tag consente di tornare indietro.
- I changelog sono associati per versione e possono essere vuoti durante sincronizzazione o pubblicazione di aggiornamenti.

### Modifiche locali vs versioni del registro

Gli aggiornamenti confrontano il contenuto locale della skill con le versioni del registro usando un hash del contenuto. Se i file locali non corrispondono a nessuna versione pubblicata, la CLI chiede prima di sovrascrivere (oppure richiede `--force` nelle esecuzioni non interattive).

### Scansione della sincronizzazione e radici di fallback

`clawhub sync` scansiona prima la workdir corrente. Se non trova skill, usa come fallback le posizioni legacy note (per esempio `~/openclaw/skills` e `~/.openclaw/skills`). Questo è pensato per trovare installazioni di skill meno recenti senza flag aggiuntivi.

### Archiviazione e file lock

- Le skill installate sono registrate in `.clawhub/lock.json` nella tua workdir.
- I token di autenticazione sono archiviati nel file di configurazione della CLI di ClawHub (sovrascrivibile tramite `CLAWHUB_CONFIG_PATH`).

### Telemetria (conteggi di installazione)

Quando esegui `clawhub sync` mentre hai effettuato l'accesso, la CLI invia uno snapshot minimo per calcolare i conteggi di installazione. Puoi disabilitarlo completamente:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Variabili d'ambiente

- `CLAWHUB_SITE`: Sovrascrive l'URL del sito.
- `CLAWHUB_REGISTRY`: Sovrascrive l'URL dell'API del registro.
- `CLAWHUB_CONFIG_PATH`: Sovrascrive il percorso in cui la CLI archivia token/configurazione.
- `CLAWHUB_WORKDIR`: Sovrascrive la workdir predefinita.
- `CLAWHUB_DISABLE_TELEMETRY=1`: Disabilita la telemetria su `sync`.
