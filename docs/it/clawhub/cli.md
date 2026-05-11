---
read_when:
    - Utilizzo della CLI di ClawHub
    - Risoluzione dei problemi di installazione, aggiornamento, pubblicazione o sincronizzazione
summary: 'Riferimento CLI: comandi, flag, configurazione, file di lock, comportamento di sincronizzazione.'
x-i18n:
    generated_at: "2026-05-11T20:23:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b07c0a4cf2896ac8ffbaf9d65b913523a565a7030c9c255c0d27e0af7ad28b4
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
- `--site <url>`: URL di base per il login nel browser (predefinito: `https://clawhub.ai`)
- `--registry <url>`: URL di base dell'API (predefinito: rilevato, altrimenti `https://clawhub.ai`)
- `--no-input`: disabilita i prompt

Equivalenti env:

- `CLAWHUB_SITE` (legacy `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (legacy `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (legacy `CLAWDHUB_WORKDIR`)

### Proxy HTTP

La CLI rispetta le variabili d'ambiente standard dei proxy HTTP per sistemi dietro
proxy aziendali o reti con restrizioni:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Quando una di queste variabili è impostata, la CLI instrada le richieste in uscita attraverso
il proxy specificato. `HTTPS_PROXY` viene usato per le richieste HTTPS, `HTTP_PROXY`
per HTTP semplice. `NO_PROXY` / `no_proxy` viene rispettato per bypassare il proxy per
host o domini specifici.

Questo è necessario sui sistemi in cui le connessioni dirette in uscita sono bloccate
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

Memorizza il tuo token API + l'URL del registro nella cache.

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
- La ricerca favorisce le corrispondenze esatte di token di slug/nome prima della popolarità dei download. Un token slug autonomo come `map` corrisponde a `personal-map` più fortemente della sottostringa dentro `amap`.
- I download sono un piccolo prior di popolarità, non una garanzia di posizionamento in cima.
- Se una skill dovrebbe comparire ma non compare, esegui `clawhub inspect <slug>` mentre hai effettuato l'accesso per controllare la diagnostica di moderazione visibile al proprietario prima di rinominare i metadati.

### `explore`

- Elenca le Skills più recenti tramite `/api/v1/skills?limit=...&sort=createdAt` (ordinate per `createdAt` desc).
- Flag:
  - `--limit <n>` (1-200, predefinito: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (predefinito: newest)
  - `--json` (output leggibile dalle macchine)
- Output: `<slug>  v<version>  <age>  <summary>` (riepilogo troncato a 50 caratteri).

### `inspect <slug>`

- Recupera i metadati della skill e i file di versione senza installarla.
- `--version <version>`: ispeziona una versione specifica (predefinita: latest).
- `--tag <tag>`: ispeziona una versione con tag (ad es. `latest`).
- `--versions`: elenca la cronologia delle versioni (prima pagina).
- `--limit <n>`: numero massimo di versioni da elencare (1-200).
- `--files`: elenca i file per la versione selezionata.
- `--file <path>`: recupera il contenuto grezzo del file (solo file di testo; limite 200KB).
- `--json`: output leggibile dalle macchine.

### `install <slug>`

- Risolve la versione latest tramite `/api/v1/skills/<slug>`.
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

- Contrassegna una skill installata come bloccata nel lockfile.
- `--reason <text>` registra perché la skill è bloccata.
- Le skill bloccate vengono saltate da `update --all` e rifiutate da `update <slug>` diretto.
- Le skill bloccate rifiutano anche `install --force`, così i byte locali non possono essere sostituiti accidentalmente.

### `unpin <slug>`

- Rimuove dal lockfile il blocco di una skill installata, così gli aggiornamenti futuri possono modificarla.

### `update [slug]` / `update --all`

- Calcola l'impronta dai file locali.
- Se l'impronta corrisponde a una versione nota: nessuna richiesta.
- Se l'impronta non corrisponde:
  - rifiuta per impostazione predefinita
  - sovrascrive con `--force` (o con richiesta, se interattivo)
- Le skill bloccate non vengono mai aggiornate da `--force`.
- `update <slug>` fallisce subito per gli slug bloccati e indica di eseguire prima `clawhub unpin <slug>`.
- `update --all` salta gli slug bloccati e stampa un riepilogo di ciò che è rimasto bloccato.

### `skill publish <path>`

- Pubblica tramite `POST /api/v1/skills` (multipart).
- Richiede semver: `--version 1.2.3`.
- `--owner <handle>` pubblica con l'handle di un publisher org/utente quando
  l'attore ha accesso come publisher.
- `--migrate-owner` sposta una skill esistente in `--owner` durante la pubblicazione di una nuova
  versione. Richiede accesso admin/proprietario su entrambi i publisher.
- Il comportamento di proprietario e revisione è spiegato in `docs/publishing.md`.
- Pubblicare una skill significa che viene rilasciata con `MIT-0` su ClawHub.
- Le skill pubblicate sono libere da usare, modificare e ridistribuire senza attribuzione.
- ClawHub non supporta skill a pagamento o prezzi per singola skill.
- Alias legacy: `publish <path>`.

### `delete <slug>`

- Elimina in modo reversibile una skill (proprietario, moderatore o admin).
- Chiama `DELETE /api/v1/skills/{slug}`.
- Le eliminazioni reversibili avviate dal proprietario riservano lo slug per 30 giorni; il comando stampa l'ora di scadenza.
- `--reason <text>` registra una nota di moderazione sulla skill e nel log di audit.
- `--note <text>` è un alias per `--reason`.
- `--yes` salta la conferma.

### `undelete <slug>`

- Ripristina una skill nascosta (proprietario, moderatore o admin).
- Chiama `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` registra una nota di moderazione sulla skill e nel log di audit.
- `--note <text>` è un alias per `--reason`.
- `--yes` salta la conferma.

### `hide <slug>`

- Nasconde una skill (proprietario, moderatore o admin).
- Alias per `delete`.

### `unhide <slug>`

- Rende di nuovo visibile una skill (proprietario, moderatore o admin).
- Alias per `undelete`.

### `skill rename <slug> <new-slug>`

- Rinomina una skill posseduta e mantiene lo slug precedente come alias di reindirizzamento.
- Chiama `POST /api/v1/skills/{slug}/rename`.
- `--yes` salta la conferma.

### `skill merge <source-slug> <target-slug>`

- Unisce una skill posseduta in un'altra skill posseduta.
- Lo slug sorgente smette di essere elencato pubblicamente e diventa un alias di reindirizzamento alla destinazione.
- Chiama `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` salta la conferma.

### `skill rescan <slug>`

- Richiede una nuova scansione di sicurezza per l'ultima versione pubblicata della skill.
- I proprietari e gli admin del publisher possono rieseguire la scansione delle proprie skill fino al limite di
  recupero per versione.
- I moderatori e gli admin della piattaforma possono rieseguire la scansione di qualsiasi skill e non sono bloccati dal
  limite di recupero del proprietario, anche se può essere eseguita una sola nuova scansione alla volta per versione.
- Chiama `POST /api/v1/skills/{slug}/rescan`.
- Flag:
  - `--yes`: salta la conferma.
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub skill rescan suspicious-skill --yes
```

### `transfer`

- Flusso di lavoro per il trasferimento della proprietà.
- I trasferimenti verso handle utente creano una richiesta in sospeso che il destinatario accetta.
- I trasferimenti verso handle org/publisher si applicano immediatamente solo quando l'attore ha
  accesso admin sia al proprietario corrente sia al publisher di destinazione.
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
- Usalo per i Plugin e altre voci della famiglia di pacchetti; `search` di livello superiore rimane la superficie di ricerca delle skill.
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
- Usalo per metadati, compatibilità, verifica, sorgente e ispezione di versioni/file dei Plugin.
- `--version <version>`: ispeziona una versione specifica (predefinito: più recente).
- `--tag <tag>`: ispeziona una versione con tag (ad es. `latest`).
- `--versions`: elenca la cronologia delle versioni (prima pagina).
- `--limit <n>`: numero massimo di versioni da elencare (1-100).
- `--files`: elenca i file per la versione selezionata.
- `--file <path>`: recupera il contenuto grezzo del file (solo file di testo; limite 200 KB).
- `--json`: output leggibile dalla macchina.

### `package download <name>`

- Risolve una versione del pacchetto tramite
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Scarica l'artefatto dal `downloadUrl` del resolver.
- Verifica SHA-256 di ClawHub per tutti gli artefatti.
- Per gli artefatti ClawPack npm-pack, verifica anche l'integrità npm `sha512`,
  lo shasum npm e nome/versione del `package.json` del tarball.
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

- Calcola SHA-256 di ClawHub, l'integrità npm `sha512` e lo shasum npm per un
  artefatto locale.
- Con `--package`, risolve i metadati attesi da ClawHub e confronta il
  file locale con i metadati dell'artefatto pubblicato.
- Con flag di digest diretti, verifica senza una ricerca di rete.
- Flag:
  - `--package <name>`: nome del pacchetto per risolvere i metadati attesi dell'artefatto.
  - `--version <version>` o `--tag <tag>`: versione del pacchetto attesa.
  - `--sha256 <hex>`: SHA-256 di ClawHub atteso.
  - `--npm-integrity <sri>`: integrità npm attesa.
  - `--npm-shasum <sha1>`: shasum npm atteso.
  - `--json`: output leggibile dalla macchina.

Esempi:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- Elimina logicamente un pacchetto e tutte le release.
- Richiede il proprietario del pacchetto, un proprietario/amministratore dell'editore dell'organizzazione, un moderatore della piattaforma
  o un amministratore della piattaforma.
- Flag:
  - `--yes`: salta la conferma.
  - `--json`: output leggibile da macchina.

Esempio:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Ripristina un pacchetto e le release eliminati logicamente.
- Richiede il proprietario del pacchetto, un proprietario/amministratore dell'editore dell'organizzazione, un moderatore della piattaforma
  o un amministratore della piattaforma.
- Chiama `POST /api/v1/packages/{name}/undelete`.
- Flag:
  - `--yes`: salta la conferma.
  - `--json`: output leggibile da macchina.

Esempio:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Trasferisce un pacchetto a un altro editore.
- Richiede l'accesso amministratore sia al proprietario attuale del pacchetto sia all'editore di destinazione,
  a meno che non venga eseguito da un amministratore della piattaforma.
- I nomi dei pacchetti con ambito devono essere trasferiti al proprietario dell'ambito corrispondente.
- Chiama `POST /api/v1/packages/{name}/transfer`.
- Flag:
  - `--to <owner>`: identificativo dell'editore di destinazione.
  - `--reason <text>`: motivo facoltativo per l'audit.
  - `--json`: output leggibile da macchina.

Esempio:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package rescan <name>`

- Richiede una nuova scansione di sicurezza per l'ultima release pubblicata del pacchetto.
- I proprietari e gli amministratori degli editori possono riesaminare i propri pacchetti fino al limite di recupero per release.
- I moderatori e gli amministratori della piattaforma possono riesaminare qualsiasi pacchetto e non sono bloccati dal limite di recupero del proprietario, anche se può essere eseguita una sola nuova scansione alla volta per release.
- Chiama `POST /api/v1/packages/{name}/rescan`.
- Flag:
  - `--yes`: salta la conferma.
  - `--json`: output leggibile da macchina.

Esempio:

```bash
clawhub package rescan @openclaw/example-plugin --yes
```

### `package report`

- Comando autenticato per segnalare un pacchetto ai moderatori.
- Chiama `POST /api/v1/packages/{name}/report`.
- Le segnalazioni sono a livello di pacchetto, facoltativamente associate a una versione, e diventano visibili ai moderatori per la revisione.
- Le segnalazioni non nascondono automaticamente i pacchetti né bloccano da sole i download.
- Flag:
  - `--version <version>`: versione facoltativa del pacchetto da allegare alla segnalazione.
  - `--reason <text>`: motivo della segnalazione obbligatorio.
  - `--json`: output leggibile da macchina.

Esempio:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package appeal`

- Comando per proprietari/editori per presentare ricorso contro la moderazione di una release.
- Chiama `POST /api/v1/packages/{name}/appeal`.
- I ricorsi sono accettati per release in quarantena, revocate, sospette o dannose.
- Flag:
  - `--version <version>`: versione del pacchetto obbligatoria.
  - `--message <text>`: messaggio di ricorso obbligatorio.
  - `--json`: output leggibile da macchina.

Esempio:

```bash
clawhub package appeal @openclaw/example-plugin --version 1.2.3 --message "linked source release explains the native binary"
```

### `package moderation-status`

- Comando per proprietari per controllare la visibilità di moderazione del pacchetto.
- Chiama `GET /api/v1/packages/{name}/moderation`.
- Mostra lo stato attuale della scansione del pacchetto, il numero di segnalazioni aperte, lo stato di moderazione manuale dell'ultima release, lo stato di blocco dei download e i motivi di moderazione.
- Flag:
  - `--json`: output leggibile da macchina.

Esempio:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Verifica se un pacchetto è pronto per il futuro consumo da parte di OpenClaw.
- Chiama `GET /api/v1/packages/{name}/readiness`.
- Segnala i blocchi per stato ufficiale, disponibilità ClawPack, digest dell'artefatto, provenienza del sorgente, compatibilità OpenClaw, target host, metadati di ambiente e stato della scansione.
- Flag:
  - `--json`: output leggibile da macchina.

Esempio:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Mostra lo stato di migrazione orientato agli operatori per un pacchetto che potrebbe sostituire un plugin OpenClaw incluso.
- Chiama lo stesso endpoint di readiness calcolata di `package readiness`, ma stampa stato orientato alla migrazione, ultima versione, stato del pacchetto ufficiale, controlli e blocchi.
- Flag:
  - `--json`: output leggibile da macchina.

Esempio:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Pubblica un plugin di codice o un plugin di bundle tramite `POST /api/v1/packages`.
- `<source>` accetta:
  - Percorso di cartella locale: `./my-plugin`
  - Tarball npm-pack ClawPack locale: `./my-plugin-1.2.3.tgz`
  - Repository GitHub: `owner/repo` o `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- I metadati vengono rilevati automaticamente da `package.json`, `openclaw.plugin.json` e dai marker reali dei bundle OpenClaw come `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` e `.cursor-plugin/plugin.json`.
- Le sorgenti `.tgz` sono trattate come ClawPack. La CLI carica i byte npm-pack esatti e usa i contenuti estratti di `package/` solo per la validazione e la precompilazione dei metadati.
- Le cartelle di plugin di codice vengono impacchettate in un tarball npm ClawPack prima del caricamento, così le installazioni OpenClaw possono verificare l'artefatto esatto. Le cartelle di plugin di bundle usano ancora il percorso di pubblicazione dei file estratti.
- Per le sorgenti GitHub, l'attribuzione della sorgente viene popolata automaticamente dal repository, dal commit risolto, dal ref e dal sottopercorso.
- Per le cartelle locali, l'attribuzione della sorgente viene rilevata automaticamente da git locale quando il remote origin punta a GitHub.
- I plugin di codice esterni devono dichiarare esplicitamente `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion`.
  `package.json.version` di primo livello non viene usato come fallback per la validazione della pubblicazione.
- `--dry-run` mostra in anteprima il payload di pubblicazione risolto senza caricare nulla.
- `--json` emette output leggibile da macchina per la CI.
- `--owner <handle>` pubblica sotto un identificativo di editore utente o organizzazione quando l'attore ha accesso all'editore.
- I nomi dei pacchetti con ambito devono corrispondere al proprietario selezionato. Vedi `docs/publishing.md`.
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

Per i plugin di codice, la pubblicazione da cartella crea e carica un artefatto ClawPack dalla cartella del pacchetto:

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

- `package.json.version` è la versione di release del tuo pacchetto, ma non viene usata come fallback per la validazione di compatibilità/build OpenClaw.
- `openclaw.hostTargets` e `openclaw.environment` sono metadati facoltativi.
  ClawHub può mostrarli quando presenti, ma non sono obbligatori per la pubblicazione.
- `openclaw.compat.minGatewayVersion` e
  `openclaw.build.pluginSdkVersion` sono extra facoltativi se vuoi pubblicare metadati di compatibilità più dettagliati.
- Se stai usando una release precedente della CLI `clawhub`, aggiornala prima della pubblicazione, così i controlli preliminari locali vengono eseguiti prima del caricamento.

#### GitHub Actions

ClawHub include anche un workflow riutilizzabile ufficiale in
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/8ed84813808a116d30aebe4357bb367b0786bb9c/.github/workflows/package-publish.yml)
per repository di plugin.

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

- Il workflow riutilizzabile imposta per impostazione predefinita `source` al repository chiamante.
- Per i monorepo, passa `source_path` così il workflow pubblica la cartella del pacchetto plugin, ad esempio `source_path: extensions/codex`.
- Fissa il workflow riutilizzabile a un tag stabile o a uno SHA di commit completo. Non eseguire la pubblicazione delle release da `@main`.
- `pull_request` dovrebbe usare `dry_run: true`, così la CI rimane non invasiva.
- Le pubblicazioni reali dovrebbero essere limitate a eventi attendibili come `workflow_dispatch` o push di tag.
- La pubblicazione attendibile senza un secret funziona solo su `workflow_dispatch`; i push di tag richiedono ancora `clawhub_token`.
- Mantieni `clawhub_token` disponibile per la prima pubblicazione, pacchetti non attendibili o pubblicazioni di emergenza.
- Il workflow carica il risultato JSON come artefatto e lo espone come output del workflow.

### `sync`

- Cerca cartelle di Skills locali e pubblica quelle nuove/modificate.
- Le radici possono essere qualsiasi cartella: una directory di Skills o una singola cartella di Skill con `SKILL.md`.
- Aggiunge automaticamente le radici delle Skills Clawdbot quando è presente `~/.clawdbot/clawdbot.json`:
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

- Inviata durante `sync` quando l'accesso è stato effettuato, a meno che `CLAWHUB_DISABLE_TELEMETRY=1` (legacy `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Dettagli: `docs/telemetry.md`.
