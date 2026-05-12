---
read_when:
    - Uso della CLI di ClawHub
    - Risoluzione dei problemi di installazione, aggiornamento, pubblicazione o sincronizzazione
summary: 'Riferimento CLI: comandi, opzioni, configurazione, file di lock, comportamento di sincronizzazione.'
x-i18n:
    generated_at: "2026-05-12T23:29:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3600e5539372490924ee884c03d2417b80d25aab519d8260897b2268c2f7b46
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Pacchetto CLI: `clawhub`, binario: `clawhub`.

Installalo globalmente con npm o pnpm:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Poi verificalo:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Flag globali

- `--workdir <dir>`: directory di lavoro (predefinita: cwd; ripiega sullo spazio di lavoro Clawdbot se configurato)
- `--dir <dir>`: directory di installazione sotto workdir (predefinita: `skills`)
- `--site <url>`: URL di base per l'accesso dal browser (predefinito: `https://clawhub.ai`)
- `--registry <url>`: URL di base dell'API (predefinito: rilevato, altrimenti `https://clawhub.ai`)
- `--no-input`: disabilita i prompt

Equivalenti env:

- `CLAWHUB_SITE` (legacy `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (legacy `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (legacy `CLAWDHUB_WORKDIR`)

### Proxy HTTP

La CLI rispetta le variabili d'ambiente standard per proxy HTTP per sistemi dietro
proxy aziendali o reti con restrizioni:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Quando una di queste variabili è impostata, la CLI instrada le richieste in uscita tramite
il proxy specificato. `HTTPS_PROXY` viene usato per le richieste HTTPS, `HTTP_PROXY`
per HTTP semplice. `NO_PROXY` / `no_proxy` viene rispettato per bypassare il proxy per
host o domini specifici.

Questo è richiesto sui sistemi in cui le connessioni dirette in uscita sono bloccate
(ad es. container Docker, VPS Hetzner con Internet solo tramite proxy, firewall
aziendali).

Esempio:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Quando non è impostata alcuna variabile proxy, il comportamento resta invariato (connessioni dirette).

## File di configurazione

Memorizza il tuo token API + l'URL del registro nella cache.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` o `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Fallback legacy: se `clawhub/config.json` non esiste ancora ma `clawdhub/config.json` esiste, la CLI riutilizza il percorso legacy
- override: `CLAWHUB_CONFIG_PATH` (legacy `CLAWDHUB_CONFIG_PATH`)

## Comandi

### `login` / `auth login`

- Predefinito: apre il browser su `<site>/cli/auth` e completa tramite callback local loopback.
- Headless: `clawhub login --token clh_...`
- Interattivo remoto/headless: `clawhub login --device` stampa un codice e attende mentre lo autorizzi su `<site>/cli/device`.

### `whoami`

- Verifica il token memorizzato tramite `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Aggiunge/rimuove una skill dai tuoi elementi in evidenza.
- Chiama `POST /api/v1/stars/<slug>` e `DELETE /api/v1/stars/<slug>`.
- `--yes` salta la conferma.

### `search <query...>`

- Chiama `/api/v1/search?q=...`.
- La ricerca privilegia le corrispondenze esatte dei token di slug/nome prima della popolarità dei download. Un token slug autonomo come `map` corrisponde a `personal-map` più fortemente della sottostringa dentro `amap`.
- I download sono un piccolo indicatore preliminare di popolarità, non una garanzia di posizionamento in cima.
- Se una skill dovrebbe comparire ma non compare, esegui `clawhub inspect <slug>` mentre hai effettuato l'accesso per controllare la diagnostica di moderazione visibile al proprietario prima di rinominare i metadati.

### `explore`

- Elenca le skill più recenti tramite `/api/v1/skills?limit=...&sort=createdAt` (ordinate per `createdAt` desc).
- Flag:
  - `--limit <n>` (1-200, predefinito: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (predefinito: newest)
  - `--json` (output leggibile dalla macchina)
- Output: `<slug>  v<version>  <age>  <summary>` (riepilogo troncato a 50 caratteri).

### `inspect <slug>`

- Recupera i metadati della skill e i file della versione senza installare.
- `--version <version>`: ispeziona una versione specifica (predefinita: latest).
- `--tag <tag>`: ispeziona una versione con tag (ad es. `latest`).
- `--versions`: elenca la cronologia delle versioni (prima pagina).
- `--limit <n>`: numero massimo di versioni da elencare (1-200).
- `--files`: elenca i file per la versione selezionata.
- `--file <path>`: recupera il contenuto grezzo del file (solo file di testo; limite 200 KB).
- `--json`: output leggibile dalla macchina.

### `install <slug>`

- Risolve la versione più recente tramite `/api/v1/skills/<slug>`.
- Scarica lo zip tramite `/api/v1/download`.
- Estrae in `<workdir>/<dir>/<slug>`.
- Rifiuta di sovrascrivere le skill fissate; esegui prima `clawhub unpin <slug>`.
- Scrive:
  - `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

### `uninstall <slug>`

- Rimuove `<workdir>/<dir>/<slug>` ed elimina la voce del lockfile.
- Interattivo: chiede conferma.
- Non interattivo (`--no-input`): richiede `--yes`.

### `list`

- Legge `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`).
- Mostra `pinned` accanto agli skill congelati con `clawhub pin`, incluso il motivo facoltativo.

### `pin <slug>`

- Contrassegna uno skill installato come pinned nel lockfile.
- `--reason <text>` registra perché lo skill è congelato.
- Gli skill pinned vengono saltati da `update --all` e rifiutati da `update <slug>` diretto.
- Gli skill pinned rifiutano anche `install --force`, così i byte locali non possono essere sostituiti accidentalmente.

### `unpin <slug>`

- Rimuove il pin del lockfile da uno skill installato, così gli aggiornamenti futuri possono modificarlo.

### `update [slug]` / `update --all`

- Calcola l'impronta digitale dai file locali.
- Se l'impronta digitale corrisponde a una versione nota: nessun prompt.
- Se l'impronta digitale non corrisponde:
  - rifiuta per impostazione predefinita
  - sovrascrive con `--force` (o con prompt, se interattivo)
- Gli skill pinned non vengono mai aggiornati da `--force`.
- `update <slug>` fallisce subito per gli slug pinned e indica di eseguire prima `clawhub unpin <slug>`.
- `update --all` salta gli slug pinned e stampa un riepilogo di ciò che è rimasto congelato.

### `skill publish <path>`

- Pubblica tramite `POST /api/v1/skills` (multipart).
- Richiede semver: `--version 1.2.3`.
- `--owner <handle>` pubblica sotto un handle editore di un'organizzazione/utente quando
  l'attore ha accesso come editore.
- `--migrate-owner` sposta uno skill esistente a `--owner` durante la pubblicazione di una nuova
  versione. Richiede accesso admin/owner su entrambi gli editori.
- Il comportamento di proprietario e revisione è spiegato in `docs/publishing.md`.
- Pubblicare uno skill significa che viene rilasciato sotto `MIT-0` su ClawHub.
- Gli skill pubblicati sono liberi da usare, modificare e ridistribuire senza attribuzione.
- ClawHub non supporta skill a pagamento o prezzi per singolo skill.
- `--clawscan-note <text>` aggiunge una nota ClawScan. Questa nota fornisce a ClawScan
  contesto per comportamenti che altrimenti potrebbero sembrare insoliti, come l'accesso alla rete,
  l'accesso all'host nativo o credenziali specifiche del provider. La nota viene memorizzata sulla
  versione pubblicata.
- Alias legacy: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- Elimina in modo soft-delete uno skill (owner, moderatore o admin).
- Chiama `DELETE /api/v1/skills/{slug}`.
- Le soft delete avviate dall'owner riservano lo slug per 30 giorni; il comando stampa l'ora di scadenza.
- `--reason <text>` registra una nota di moderazione sullo skill e nel log di audit.
- `--note <text>` è un alias di `--reason`.
- `--yes` salta la conferma.

### `undelete <slug>`

- Ripristina uno skill nascosto (owner, moderatore o admin).
- Chiama `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` registra una nota di moderazione sullo skill e nel log di audit.
- `--note <text>` è un alias di `--reason`.
- `--yes` salta la conferma.

### `hide <slug>`

- Nasconde uno skill (owner, moderatore o admin).
- Alias di `delete`.

### `unhide <slug>`

- Mostra di nuovo uno skill (owner, moderatore o admin).
- Alias di `undelete`.

### `skill rename <slug> <new-slug>`

- Rinomina uno skill posseduto e mantiene lo slug precedente come alias di reindirizzamento.
- Chiama `POST /api/v1/skills/{slug}/rename`.
- `--yes` salta la conferma.

### `skill merge <source-slug> <target-slug>`

- Unisce uno skill posseduto in un altro skill posseduto.
- Lo slug sorgente smette di essere elencato pubblicamente e diventa un alias di reindirizzamento verso la destinazione.
- Chiama `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` salta la conferma.

### `transfer`

- Flusso di lavoro di trasferimento della proprietà.
- I trasferimenti verso handle utente creano una richiesta in sospeso che il destinatario accetta.
- I trasferimenti verso handle org/editore vengono applicati immediatamente solo quando l'attore ha
  accesso admin sia all'owner corrente sia all'editore di destinazione.
- Sottocomandi:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- Endpoint:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Sfoglia o cerca nel catalogo unificato dei pacchetti tramite `GET /api/v1/packages` e `GET /api/v1/packages/search`.
- Usalo per plugin e altre voci di famiglie di pacchetti; `search` di primo livello rimane la superficie di ricerca degli skill.
- Flag:
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>` (1-100, predefinito: 25)
  - `--json`

Esempi:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- Recupera i metadati del pacchetto senza installare.
- Usalo per metadati, compatibilità, verifica, sorgente e ispezione di versioni/file dei plugin.
- `--version <version>`: ispeziona una versione specifica (predefinita: latest).
- `--tag <tag>`: ispeziona una versione taggata (ad es. `latest`).
- `--versions`: elenca la cronologia delle versioni (prima pagina).
- `--limit <n>`: numero massimo di versioni da elencare (1-100).
- `--files`: elenca i file per la versione selezionata.
- `--file <path>`: recupera il contenuto grezzo del file (solo file di testo; limite 200KB).
- `--json`: output leggibile dalla macchina.

### `package download <name>`

- Risolve una versione di pacchetto tramite
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Scarica l'artefatto dal `downloadUrl` del resolver.
- Verifica lo SHA-256 ClawHub per tutti gli artefatti.
- Per gli artefatti ClawPack npm-pack, verifica anche l'integrità npm `sha512`,
  lo shasum npm e nome/versione del `package.json` del tarball.
- Le versioni ZIP legacy vengono scaricate tramite la rotta ZIP legacy.
- Flag:
  - `--version <version>`: scarica una versione specifica.
  - `--tag <tag>`: scarica una versione taggata (predefinita: `latest`).
  - `-o, --output <path>`: file o directory di output.
  - `--force`: sovrascrive un file di output esistente.
  - `--json`: output leggibile dalla macchina.

Esempi:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Calcola SHA-256 ClawHub, integrità npm `sha512` e shasum npm per un artefatto
  locale.
- Con `--package`, risolve i metadati previsti da ClawHub e confronta il
  file locale con i metadati dell'artefatto pubblicato.
- Con flag digest diretti, verifica senza una ricerca di rete.
- Flag:
  - `--package <name>`: nome del pacchetto per risolvere i metadati dell'artefatto previsti.
  - `--version <version>` o `--tag <tag>`: versione del pacchetto prevista.
  - `--sha256 <hex>`: SHA-256 ClawHub previsto.
  - `--npm-integrity <sri>`: integrità npm prevista.
  - `--npm-shasum <sha1>`: shasum npm previsto.
  - `--json`: output leggibile dalla macchina.

Esempi:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- Elimina in modo reversibile un pacchetto e tutte le release.
- Richiede il proprietario del pacchetto, un proprietario/admin del publisher di un'organizzazione, un moderatore della piattaforma
  o un admin della piattaforma.
- Flag:
  - `--yes`: salta la conferma.
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Ripristina un pacchetto eliminato in modo reversibile e le release.
- Richiede il proprietario del pacchetto, un proprietario/admin del publisher di un'organizzazione, un moderatore della piattaforma
  o un admin della piattaforma.
- Chiama `POST /api/v1/packages/{name}/undelete`.
- Flag:
  - `--yes`: salta la conferma.
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Trasferisce un pacchetto a un altro publisher.
- Richiede accesso admin sia al proprietario corrente del pacchetto sia al publisher
  di destinazione, a meno che non venga eseguito da un admin della piattaforma.
- I nomi dei pacchetti con scope devono essere trasferiti al proprietario dello scope corrispondente.
- Chiama `POST /api/v1/packages/{name}/transfer`.
- Flag:
  - `--to <owner>`: handle del publisher di destinazione.
  - `--reason <text>`: motivo di audit facoltativo.
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Comando autenticato per segnalare un pacchetto ai moderatori.
- Chiama `POST /api/v1/packages/{name}/report`.
- Le segnalazioni sono a livello di pacchetto, facoltativamente associate a una versione, e diventano visibili
  ai moderatori per la revisione.
- Le segnalazioni non nascondono automaticamente i pacchetti né bloccano i download da sole.
- Flag:
  - `--version <version>`: versione facoltativa del pacchetto da associare alla segnalazione.
  - `--reason <text>`: motivo obbligatorio della segnalazione.
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Comando per i proprietari per controllare la visibilità della moderazione del pacchetto.
- Chiama `GET /api/v1/packages/{name}/moderation`.
- Mostra lo stato corrente di scansione del pacchetto, il conteggio delle segnalazioni aperte, lo stato di moderazione
  manuale dell'ultima release, lo stato del blocco dei download e i motivi della moderazione.
- Flag:
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Controlla se un pacchetto è pronto per il futuro consumo da parte di OpenClaw.
- Chiama `GET /api/v1/packages/{name}/readiness`.
- Segnala i blocchi per lo stato ufficiale, la disponibilità di ClawPack, il digest dell'artefatto,
  la provenienza del sorgente, la compatibilità OpenClaw, le destinazioni host, i metadati dell'ambiente
  e lo stato della scansione.
- Flag:
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Mostra lo stato di migrazione orientato agli operatori per un pacchetto che potrebbe sostituire un
  plugin OpenClaw incluso.
- Chiama lo stesso endpoint di readiness calcolata di `package readiness`, ma stampa
  stato incentrato sulla migrazione, versione più recente, stato del pacchetto ufficiale, controlli e
  blocchi.
- Flag:
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Pubblica un plugin di codice o un plugin bundle tramite `POST /api/v1/packages`.
- `<source>` accetta:
  - Percorso cartella locale: `./my-plugin`
  - Tarball npm-pack ClawPack locale: `./my-plugin-1.2.3.tgz`
  - Repo GitHub: `owner/repo` o `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- I metadati vengono rilevati automaticamente da `package.json`, `openclaw.plugin.json` e
  marcatori di bundle OpenClaw reali come `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` e `.cursor-plugin/plugin.json`.
- Le sorgenti `.tgz` vengono trattate come ClawPack. La CLI carica esattamente i byte npm-pack
  e usa i contenuti `package/` estratti solo per la validazione e la precompilazione
  dei metadati.
- Le cartelle dei plugin di codice vengono impacchettate in un tarball npm ClawPack prima del caricamento, così
  le installazioni di OpenClaw possono verificare l'artefatto esatto. Le cartelle dei plugin bundle continuano
  a usare il percorso di pubblicazione dei file estratti.
- Per le sorgenti GitHub, l'attribuzione del sorgente viene popolata automaticamente dal repo, dal commit risolto, dal ref e dal sottopercorso.
- Per le cartelle locali, l'attribuzione del sorgente viene rilevata automaticamente dal git locale quando il remote origin punta a GitHub.
- I plugin di codice esterni devono dichiarare esplicitamente `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion`.
  Il valore di primo livello `package.json.version` non viene usato come fallback per la validazione della pubblicazione.
- `--dry-run` mostra in anteprima il payload di pubblicazione risolto senza caricarlo.
- `--json` emette output leggibile dalla macchina per la CI.
- `--owner <handle>` pubblica sotto un handle di publisher utente o organizzazione quando l'attore ha accesso al publisher.
- `--clawscan-note <text>` aggiunge una nota ClawScan. Questa nota fornisce a ClawScan
  il contesto per comportamenti che altrimenti potrebbero sembrare insoliti, come l'accesso alla rete,
  l'accesso all'host nativo o credenziali specifiche del provider. La nota viene archiviata nella
  release pubblicata.
- I nomi dei pacchetti con scope devono corrispondere al proprietario selezionato. Vedi `docs/publishing.md`.
- I flag esistenti (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) continuano a funzionare come override.
- I repo GitHub privati richiedono `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Flusso locale consigliato

Usa prima `--dry-run` in modo da poter confermare i metadati del pacchetto risolti e
l'attribuzione del sorgente prima di creare una release live:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Flusso con cartella locale

Per i plugin di codice, la pubblicazione da cartella crea e carica un artefatto ClawPack dalla
cartella del pacchetto:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` minimale per `--family code-plugin`

I plugin di codice esterni richiedono una piccola quantità di metadati OpenClaw in
`package.json`. Questo manifest minimale è sufficiente per una pubblicazione riuscita:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2"
    }
  }
}
```

Campi obbligatori:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

Note:

- `package.json.version` è la versione di release del tuo pacchetto, ma non viene usata come
  fallback per la validazione della compatibilità/build OpenClaw.
- `openclaw.hostTargets` e `openclaw.environment` sono metadati facoltativi.
  ClawHub può mostrarli quando presenti, ma non sono richiesti per la pubblicazione.
- `openclaw.compat.minGatewayVersion` e
  `openclaw.build.pluginSdkVersion` sono extra facoltativi se vuoi pubblicare
  metadati di compatibilità più dettagliati.
- Se stai usando una release precedente della CLI `clawhub`, aggiorna prima della pubblicazione affinché
  i controlli preflight locali vengano eseguiti prima del caricamento.

#### GitHub Actions

ClawHub fornisce anche un workflow riutilizzabile ufficiale in
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/af96221ebb197e2af09f44870046ced4ded4aea0/.github/workflows/package-publish.yml)
per i repo dei plugin.

Configurazione tipica del chiamante:

```yaml
name: Package Publish

on:
  pull_request:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: read
      id-token: write
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Note:

- Il workflow riutilizzabile imposta per impostazione predefinita `source` al repo chiamante.
- Per i monorepo, passa `source_path` in modo che il workflow pubblichi la cartella del pacchetto
  del plugin, per esempio `source_path: extensions/codex`.
- Fissa il workflow riutilizzabile a un tag stabile o a uno SHA completo del commit. Non eseguire la pubblicazione di release da `@main`.
- `pull_request` dovrebbe usare `dry_run: true` così la CI resta non inquinante.
- Le pubblicazioni reali dovrebbero essere limitate a eventi fidati come `workflow_dispatch` o push di tag.
- La pubblicazione fidata senza un segreto funziona solo su `workflow_dispatch`; i push di tag richiedono comunque `clawhub_token`.
- Mantieni `clawhub_token` disponibile per la prima pubblicazione, pacchetti non fidati o pubblicazioni di emergenza.
- Il workflow carica il risultato JSON come artefatto e lo espone come output del workflow.

### `sync`

- Esegue la scansione delle cartelle locali di skill e pubblica quelle nuove/modificate.
- Le radici possono essere qualsiasi cartella: una directory di skill o una singola cartella di skill con `SKILL.md`.
- Aggiunge automaticamente le radici delle skill di Clawdbot quando `~/.clawdbot/clawdbot.json` è presente:
  - `agent.workspace/skills` (agente principale)
  - `routing.agents.*.workspace/skills` (per agente)
  - `~/.clawdbot/skills` (condivise)
  - `skills.load.extraDirs` (pacchetti condivisi)
- Rispetta `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` e `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- Flag:
  - `--root <dir...>` radici di scansione extra
  - `--all` carica senza chiedere conferma
  - `--dry-run` mostra solo il piano
  - `--bump patch|minor|major` (predefinito: patch)
  - `--changelog <text>` (non interattivo)
  - `--tags a,b,c` (predefinito: latest)
  - `--concurrency <n>` (predefinito: 4)

Telemetria:

- Inviata durante `sync` quando l'accesso è stato effettuato, a meno che `CLAWHUB_DISABLE_TELEMETRY=1` (legacy `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Dettagli: `docs/telemetry.md`.
