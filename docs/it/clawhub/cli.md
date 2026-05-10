---
read_when:
    - Uso della CLI ClawHub
    - Debug di installazione, aggiornamento, pubblicazione o sincronizzazione
summary: 'Riferimento CLI: comandi, flag, configurazione, file di blocco, comportamento della sincronizzazione.'
x-i18n:
    generated_at: "2026-05-10T19:25:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8e43780c82c9d540bf99e677788df8913532adb3d237d20d96f575f621eae3
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

- `--workdir <dir>`: directory di lavoro (predefinita: cwd; ripiega sul workspace di Clawdbot se configurato)
- `--dir <dir>`: directory di installazione sotto workdir (predefinita: `skills`)
- `--site <url>`: URL di base per l'accesso dal browser (predefinito: `https://clawhub.ai`)
- `--registry <url>`: URL di base dell'API (predefinito: rilevato, altrimenti `https://clawhub.ai`)
- `--no-input`: disabilita i prompt

Equivalenti env:

- `CLAWHUB_SITE` (legacy `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (legacy `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (legacy `CLAWDHUB_WORKDIR`)

### Proxy HTTP

La CLI rispetta le variabili d'ambiente standard per proxy HTTP sui sistemi dietro
proxy aziendali o reti limitate:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Quando una di queste variabili è impostata, la CLI instrada le richieste in uscita attraverso
il proxy specificato. `HTTPS_PROXY` viene usato per le richieste HTTPS, `HTTP_PROXY`
per HTTP semplice. `NO_PROXY` / `no_proxy` viene rispettato per bypassare il proxy per
host o domini specifici.

Questo è richiesto sui sistemi in cui le connessioni dirette in uscita sono bloccate
(ad es. container Docker, VPS Hetzner con internet solo tramite proxy, firewall
aziendali).

Esempio:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Quando non è impostata alcuna variabile proxy, il comportamento resta invariato (connessioni dirette).

## File di configurazione

Memorizza il tuo token API + l'URL del registro memorizzato nella cache.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` o `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Fallback legacy: se `clawhub/config.json` non esiste ancora ma `clawdhub/config.json` esiste, la CLI riusa il percorso legacy
- override: `CLAWHUB_CONFIG_PATH` (legacy `CLAWDHUB_CONFIG_PATH`)

## Comandi

### `login` / `auth login`

- Predefinito: apre il browser su `<site>/cli/auth` e completa tramite callback loopback.
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
- La ricerca privilegia le corrispondenze esatte dei token slug/nome prima della popolarità dei download. Un token slug autonomo come `map` corrisponde a `personal-map` più fortemente della sottostringa dentro `amap`.
- I download sono un piccolo indicatore preliminare di popolarità, non una garanzia di posizionamento in cima.
- Se una skill dovrebbe apparire ma non appare, esegui `clawhub inspect <slug>` dopo l'accesso per controllare la diagnostica di moderazione visibile al proprietario prima di rinominare i metadati.

### `explore`

- Elenca le skill più recenti tramite `/api/v1/skills?limit=...&sort=createdAt` (ordinate per `createdAt` decrescente).
- Flag:
  - `--limit <n>` (1-200, predefinito: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (predefinito: newest)
  - `--json` (output leggibile dalla macchina)
- Output: `<slug>  v<version>  <age>  <summary>` (riepilogo troncato a 50 caratteri).

### `inspect <slug>`

- Recupera i metadati della skill e i file di versione senza installare.
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
- Mostra `pinned` accanto alle skill bloccate con `clawhub pin`, incluso il motivo opzionale.

### `pin <slug>`

- Contrassegna una Skill installata come bloccata nel lockfile.
- `--reason <text>` registra perché la Skill è congelata.
- Le Skills bloccate vengono saltate da `update --all` e rifiutate da `update <slug>` diretto.
- Le Skills bloccate rifiutano anche `install --force`, così i byte locali non possono essere sostituiti accidentalmente.

### `unpin <slug>`

- Rimuove il blocco nel lockfile da una Skill installata, così gli aggiornamenti futuri possono modificarla.

### `update [slug]` / `update --all`

- Calcola l'impronta dai file locali.
- Se l'impronta corrisponde a una versione nota: nessun prompt.
- Se l'impronta non corrisponde:
  - rifiuta per impostazione predefinita
  - sovrascrive con `--force` (o con prompt, se interattivo)
- Le Skills bloccate non vengono mai aggiornate da `--force`.
- `update <slug>` fallisce subito per gli slug bloccati e indica di eseguire prima `clawhub unpin <slug>`.
- `update --all` salta gli slug bloccati e stampa un riepilogo di ciò che è rimasto congelato.

### `skill publish <path>`

- Pubblica tramite `POST /api/v1/skills` (multipart).
- Richiede semver: `--version 1.2.3`.
- `--owner <handle>` pubblica sotto l'handle editore di un'organizzazione/utente quando l'attore ha accesso come editore.
- `--migrate-owner` sposta una Skill esistente su `--owner` mentre pubblica una nuova versione. Richiede accesso amministratore/proprietario su entrambi gli editori.
- Il comportamento di proprietario e revisione è spiegato in `docs/publishing.md`.
- Pubblicare una Skill significa che viene rilasciata sotto `MIT-0` su ClawHub.
- Le Skills pubblicate sono libere da usare, modificare e ridistribuire senza attribuzione.
- ClawHub non supporta Skills a pagamento o prezzi per singola Skill.
- Alias legacy: `publish <path>`.

### `delete <slug>`

- Elimina in modo reversibile una Skill (proprietario, moderatore o amministratore).
- Chiama `DELETE /api/v1/skills/{slug}`.
- Le eliminazioni reversibili avviate dal proprietario riservano lo slug per 30 giorni; il comando stampa l'ora di scadenza.
- `--reason <text>` registra una nota di moderazione sulla Skill e nel log di audit.
- `--note <text>` è un alias di `--reason`.
- `--yes` salta la conferma.

### `undelete <slug>`

- Ripristina una Skill nascosta (proprietario, moderatore o amministratore).
- Chiama `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` registra una nota di moderazione sulla Skill e nel log di audit.
- `--note <text>` è un alias di `--reason`.
- `--yes` salta la conferma.

### `hide <slug>`

- Nasconde una Skill (proprietario, moderatore o amministratore).
- Alias di `delete`.

### `unhide <slug>`

- Mostra di nuovo una Skill (proprietario, moderatore o amministratore).
- Alias di `undelete`.

### `skill rename <slug> <new-slug>`

- Rinomina una Skill posseduta e mantiene lo slug precedente come alias di reindirizzamento.
- Chiama `POST /api/v1/skills/{slug}/rename`.
- `--yes` salta la conferma.

### `skill merge <source-slug> <target-slug>`

- Unisce una Skill posseduta in un'altra Skill posseduta.
- Lo slug sorgente smette di comparire pubblicamente e diventa un alias di reindirizzamento verso la destinazione.
- Chiama `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` salta la conferma.

### `skill rescan <slug>`

- Richiede una nuova scansione di sicurezza per l'ultima versione pubblicata della Skill.
- I proprietari e gli amministratori dell'editore possono rieseguire la scansione delle proprie Skills fino al limite di recupero per versione.
- I moderatori e gli amministratori della piattaforma possono rieseguire la scansione di qualsiasi Skill e non sono bloccati dal limite di recupero del proprietario, anche se può essere eseguita una sola nuova scansione alla volta per versione.
- Chiama `POST /api/v1/skills/{slug}/rescan`.
- Flag:
  - `--yes`: salta la conferma.
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub skill rescan suspicious-skill --yes
```

### `transfer`

- Flusso di trasferimento della proprietà.
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
- Usalo per Plugin e altre voci della famiglia di pacchetti; `search` di primo livello rimane la superficie di ricerca delle Skill.
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

- Recupera i metadati del pacchetto senza installarlo.
- Usalo per metadati Plugin, compatibilità, verifica, sorgente e ispezione di versione/file.
- `--version <version>`: ispeziona una versione specifica (predefinito: più recente).
- `--tag <tag>`: ispeziona una versione con tag (ad es. `latest`).
- `--versions`: elenca la cronologia delle versioni (prima pagina).
- `--limit <n>`: numero massimo di versioni da elencare (1-100).
- `--files`: elenca i file per la versione selezionata.
- `--file <path>`: recupera il contenuto raw del file (solo file di testo; limite 200KB).
- `--json`: output leggibile dalla macchina.

### `package download <name>`

- Risolve una versione del pacchetto tramite
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Scarica l'artefatto dal `downloadUrl` del resolver.
- Verifica lo SHA-256 ClawHub per tutti gli artefatti.
- Per gli artefatti ClawPack npm-pack, verifica anche l'integrità npm `sha512`, lo shasum npm e nome/versione del `package.json` del tarball.
- Le versioni ZIP legacy vengono scaricate tramite la rotta ZIP legacy.
- Flag:
  - `--version <version>`: scarica una versione specifica.
  - `--tag <tag>`: scarica una versione con tag (predefinito: `latest`).
  - `-o, --output <path>`: file o directory di output.
  - `--force`: sovrascrive un file di output esistente.
  - `--json`: output leggibile dalla macchina.

Esempi:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Calcola SHA-256 ClawHub, integrità npm `sha512` e shasum npm per un artefatto locale.
- Con `--package`, risolve i metadati attesi da ClawHub e confronta il file locale con i metadati dell'artefatto pubblicato.
- Con i flag di digest diretti, verifica senza una ricerca di rete.
- Flag:
  - `--package <name>`: nome del pacchetto per risolvere i metadati dell'artefatto attesi.
  - `--version <version>` o `--tag <tag>`: versione del pacchetto attesa.
  - `--sha256 <hex>`: SHA-256 ClawHub atteso.
  - `--npm-integrity <sri>`: integrità npm attesa.
  - `--npm-shasum <sha1>`: shasum npm atteso.
  - `--json`: output leggibile dalla macchina.

Esempi:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- Elimina in modo reversibile un pacchetto e tutte le release.
- Richiede il proprietario del pacchetto, un proprietario/amministratore dell'editore dell'organizzazione, un moderatore della piattaforma
  o un amministratore della piattaforma.
- Flag:
  - `--yes`: salta la conferma.
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package rescan <name>`

- Richiede una nuova scansione di sicurezza per l'ultima release pubblicata del pacchetto.
- I proprietari e gli amministratori dell'editore possono eseguire nuovamente la scansione dei propri pacchetti fino al limite di
  recupero per release.
- I moderatori e gli amministratori della piattaforma possono eseguire nuovamente la scansione di qualsiasi pacchetto e non sono bloccati dal
  limite di recupero del proprietario, anche se può essere eseguita una sola nuova scansione alla volta per release.
- Chiama `POST /api/v1/packages/{name}/rescan`.
- Flag:
  - `--yes`: salta la conferma.
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package rescan @openclaw/example-plugin --yes
```

### `package report`

- Comando autenticato per segnalare un pacchetto ai moderatori.
- Chiama `POST /api/v1/packages/{name}/report`.
- Le segnalazioni sono a livello di pacchetto, facoltativamente associate a una versione, e diventano visibili
  ai moderatori per la revisione.
- Le segnalazioni non nascondono automaticamente i pacchetti né bloccano i download da sole.
- Flag:
  - `--version <version>`: versione facoltativa del pacchetto da allegare alla segnalazione.
  - `--reason <text>`: motivo obbligatorio della segnalazione.
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package appeal`

- Comando per proprietario/editore per presentare ricorso contro la moderazione di una release.
- Chiama `POST /api/v1/packages/{name}/appeal`.
- I ricorsi sono accettati per release in quarantena, revocate, sospette o dannose.
- Flag:
  - `--version <version>`: versione obbligatoria del pacchetto.
  - `--message <text>`: messaggio di ricorso obbligatorio.
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package appeal @openclaw/example-plugin --version 1.2.3 --message "linked source release explains the native binary"
```

### `package moderation-status`

- Comando del proprietario per controllare la visibilità di moderazione del pacchetto.
- Chiama `GET /api/v1/packages/{name}/moderation`.
- Mostra lo stato attuale della scansione del pacchetto, il numero di segnalazioni aperte, lo stato più recente di moderazione manuale
  della release, lo stato di blocco dei download e i motivi della moderazione.
- Flag:
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Verifica se un pacchetto è pronto per il consumo futuro da parte di OpenClaw.
- Chiama `GET /api/v1/packages/{name}/readiness`.
- Segnala i blocchi per stato ufficiale, disponibilità ClawPack, digest dell'artefatto,
  provenienza del sorgente, compatibilità con OpenClaw, target host, metadati dell'ambiente
  e stato della scansione.
- Flag:
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Mostra lo stato di migrazione orientato agli operatori per un pacchetto che può sostituire un
  plugin OpenClaw incluso.
- Chiama lo stesso endpoint di idoneità calcolata di `package readiness`, ma stampa
  stato incentrato sulla migrazione, versione più recente, stato del pacchetto ufficiale, controlli e
  blocchi.
- Flag:
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Pubblica un code plugin o un bundle plugin tramite `POST /api/v1/packages`.
- `<source>` accetta:
  - Percorso di cartella locale: `./my-plugin`
  - Tarball ClawPack npm-pack locale: `./my-plugin-1.2.3.tgz`
  - Repository GitHub: `owner/repo` o `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- I metadati vengono rilevati automaticamente da `package.json`, `openclaw.plugin.json` e
  marcatori reali dei bundle OpenClaw come `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` e `.cursor-plugin/plugin.json`.
- Le sorgenti `.tgz` sono trattate come ClawPack. La CLI carica gli esatti byte npm-pack
  e usa i contenuti `package/` estratti solo per convalida e
  precompilazione dei metadati.
- Le cartelle code-plugin vengono impacchettate in un tarball npm ClawPack prima del caricamento, così
  le installazioni OpenClaw possono verificare l'artefatto esatto. Le cartelle bundle-plugin continuano
  a usare il percorso di pubblicazione dei file estratti.
- Per le sorgenti GitHub, l'attribuzione della sorgente viene popolata automaticamente dal repository, dal commit risolto, dal ref e dal sottopercorso.
- Per le cartelle locali, l'attribuzione della sorgente viene rilevata automaticamente da git locale quando il remote origin punta a GitHub.
- I code plugin esterni devono dichiarare esplicitamente `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion`.
  `package.json.version` di primo livello non viene usato come fallback per la convalida della pubblicazione.
- `--dry-run` mostra in anteprima il payload di pubblicazione risolto senza caricarlo.
- `--json` emette output leggibile dalla macchina per la CI.
- `--owner <handle>` pubblica sotto un handle di editore utente o organizzazione quando l'attore ha accesso come editore.
- I nomi di pacchetti con scope devono corrispondere al proprietario selezionato. Vedi `docs/publishing.md`.
- I flag esistenti (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) continuano a funzionare come override.
- I repository GitHub privati richiedono `GITHUB_TOKEN`.

#### Flusso locale consigliato

Usa prima `--dry-run` per poter confermare i metadati del pacchetto risolti e
l'attribuzione della sorgente prima di creare una release live:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Flusso con cartella locale

Per i code plugin, la pubblicazione da cartella crea e carica un artefatto ClawPack dalla
cartella del pacchetto:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` minimo per `--family code-plugin`

I code plugin esterni necessitano di una piccola quantità di metadati OpenClaw in
`package.json`. Questo manifest minimo è sufficiente per una pubblicazione riuscita:

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
  fallback per la convalida di compatibilità/build OpenClaw.
- `openclaw.hostTargets` e `openclaw.environment` sono metadati facoltativi.
  ClawHub può mostrarli quando presenti, ma non sono obbligatori per la pubblicazione.
- `openclaw.compat.minGatewayVersion` e
  `openclaw.build.pluginSdkVersion` sono extra facoltativi se vuoi pubblicare
  metadati di compatibilità più dettagliati.
- Se usi una release precedente della CLI `clawhub`, aggiornala prima di pubblicare, così
  i controlli preliminari locali vengono eseguiti prima del caricamento.

#### GitHub Actions

ClawHub fornisce anche un workflow riutilizzabile ufficiale in
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/2dcaf25d23c4e19b9c14f705c2ce1fd1dc2949c1/.github/workflows/package-publish.yml)
per i repository dei plugin.

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

- Il workflow riutilizzabile imposta per impostazione predefinita `source` sul repository chiamante.
- Per i monorepo, passa `source_path` in modo che il workflow pubblichi la cartella del pacchetto
  plugin, ad esempio `source_path: extensions/codex`.
- Blocca il workflow riutilizzabile a un tag stabile o a uno SHA di commit completo. Non eseguire la pubblicazione delle release da `@main`.
- `pull_request` deve usare `dry_run: true` così la CI resta non inquinante.
- Le pubblicazioni reali devono essere limitate a eventi attendibili come `workflow_dispatch` o push di tag.
- La pubblicazione attendibile senza un segreto funziona solo su `workflow_dispatch`; i push di tag richiedono comunque `clawhub_token`.
- Mantieni `clawhub_token` disponibile per la prima pubblicazione, per pacchetti non attendibili o per pubblicazioni di emergenza.
- Il workflow carica il risultato JSON come artefatto e lo espone come output del workflow.

### `sync`

- Cerca cartelle Skills locali e pubblica quelle nuove/modificate.
- Le radici possono essere qualsiasi cartella: una directory di Skills o una singola cartella Skill con `SKILL.md`.
- Aggiunge automaticamente le radici Skills di Clawdbot quando `~/.clawdbot/clawdbot.json` è presente:
  - `agent.workspace/skills` (agente principale)
  - `routing.agents.*.workspace/skills` (per agente)
  - `~/.clawdbot/skills` (condivise)
  - `skills.load.extraDirs` (pacchetti condivisi)
- Rispetta `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` e `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- Flag:
  - `--root <dir...>` radici di scansione aggiuntive
  - `--all` carica senza chiedere conferma
  - `--dry-run` mostra solo il piano
  - `--bump patch|minor|major` (predefinito: patch)
  - `--changelog <text>` (non interattivo)
  - `--tags a,b,c` (predefinito: latest)
  - `--concurrency <n>` (predefinito: 4)

Telemetria:

- Inviata durante `sync` quando è stato eseguito l'accesso, salvo `CLAWHUB_DISABLE_TELEMETRY=1` (legacy `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Dettagli: `docs/telemetry.md`.
