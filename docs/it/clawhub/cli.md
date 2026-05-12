---
read_when:
    - Utilizzo della CLI di ClawHub
    - Debug di installazione, aggiornamento, pubblicazione o sincronizzazione
summary: 'Riferimento CLI: comandi, flag, configurazione, file di lock, comportamento di sincronizzazione.'
x-i18n:
    generated_at: "2026-05-12T15:42:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 541fb8367e70fab6aaa9fd622a0c2753170d7cd2afa5e4e02681d606bb45ea8c
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

Variabili d'ambiente equivalenti:

- `CLAWHUB_SITE` (legacy `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (legacy `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (legacy `CLAWDHUB_WORKDIR`)

### Proxy HTTP

La CLI rispetta le variabili d'ambiente standard dei proxy HTTP per i sistemi dietro
proxy aziendali o reti con restrizioni:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Quando una di queste variabili è impostata, la CLI instrada le richieste in uscita attraverso
il proxy specificato. `HTTPS_PROXY` viene usata per le richieste HTTPS, `HTTP_PROXY`
per HTTP semplice. `NO_PROXY` / `no_proxy` viene rispettata per bypassare il proxy per
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

Archivia il tuo token API + l'URL del registro nella cache.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` o `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Fallback legacy: se `clawhub/config.json` non esiste ancora ma `clawdhub/config.json` esiste, la CLI riutilizza il percorso legacy
- override: `CLAWHUB_CONFIG_PATH` (legacy `CLAWDHUB_CONFIG_PATH`)

## Comandi

### `login` / `auth login`

- Predefinito: apre il browser su `<site>/cli/auth` e completa tramite callback di loopback.
- Senza interfaccia grafica: `clawhub login --token clh_...`
- Interattivo remoto/senza interfaccia grafica: `clawhub login --device` stampa un codice e attende mentre lo autorizzi su `<site>/cli/device`.

### `whoami`

- Verifica il token archiviato tramite `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Aggiunge/rimuove una skill dai tuoi elementi in evidenza.
- Chiama `POST /api/v1/stars/<slug>` e `DELETE /api/v1/stars/<slug>`.
- `--yes` salta la conferma.

### `search <query...>`

- Chiama `/api/v1/search?q=...`.
- La ricerca favorisce le corrispondenze esatte dei token di slug/nome prima della popolarità dei download. Un token slug autonomo come `map` corrisponde a `personal-map` in modo più forte rispetto alla sottostringa dentro `amap`.
- I download sono un piccolo indicatore preliminare di popolarità, non una garanzia di posizionamento in cima.
- Se una skill dovrebbe apparire ma non compare, esegui `clawhub inspect <slug>` dopo aver effettuato l'accesso per controllare le diagnostiche di moderazione visibili al proprietario prima di rinominare i metadati.

### `explore`

- Elenca le skill più recenti tramite `/api/v1/skills?limit=...&sort=createdAt` (ordinate per `createdAt` desc).
- Flag:
  - `--limit <n>` (1-200, predefinito: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (predefinito: newest)
  - `--json` (output leggibile da macchina)
- Output: `<slug>  v<version>  <age>  <summary>` (riepilogo troncato a 50 caratteri).

### `inspect <slug>`

- Recupera i metadati della skill e i file della versione senza installare.
- `--version <version>`: ispeziona una versione specifica (predefinita: latest).
- `--tag <tag>`: ispeziona una versione con tag (ad es. `latest`).
- `--versions`: elenca la cronologia delle versioni (prima pagina).
- `--limit <n>`: numero massimo di versioni da elencare (1-200).
- `--files`: elenca i file per la versione selezionata.
- `--file <path>`: recupera il contenuto grezzo del file (solo file di testo; limite 200 KB).
- `--json`: output leggibile da macchina.

### `install <slug>`

- Risolve la versione più recente tramite `/api/v1/skills/<slug>`.
- Scarica lo zip tramite `/api/v1/download`.
- Estrae in `<workdir>/<dir>/<slug>`.
- Rifiuta di sovrascrivere skill pinned; esegui prima `clawhub unpin <slug>`.
- Scrive:
  - `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

### `uninstall <slug>`

- Rimuove `<workdir>/<dir>/<slug>` ed elimina la voce dal lockfile.
- Interattivo: chiede conferma.
- Non interattivo (`--no-input`): richiede `--yes`.

### `list`

- Legge `<workdir>/.clawhub/lock.json` (`.clawdhub` legacy).
- Mostra `pinned` accanto alle skill bloccate con `clawhub pin`, incluso il motivo opzionale.

### `pin <slug>`

- Contrassegna una skill installata come bloccata nel lockfile.
- `--reason <text>` registra perché la skill è bloccata.
- Le skill bloccate vengono saltate da `update --all` e rifiutate da `update <slug>` diretto.
- Le skill bloccate rifiutano anche `install --force`, così i byte locali non possono essere sostituiti accidentalmente.

### `unpin <slug>`

- Rimuove il blocco del lockfile da una skill installata, così gli aggiornamenti futuri possono modificarla.

### `update [slug]` / `update --all`

- Calcola l'impronta dai file locali.
- Se l'impronta corrisponde a una versione nota: nessun prompt.
- Se l'impronta non corrisponde:
  - rifiuta per impostazione predefinita
  - sovrascrive con `--force` (o con prompt, se interattivo)
- Le skill bloccate non vengono mai aggiornate da `--force`.
- `update <slug>` fallisce rapidamente per gli slug bloccati e indica di eseguire prima `clawhub unpin <slug>`.
- `update --all` salta gli slug bloccati e stampa un riepilogo di ciò che è rimasto bloccato.

### `skill publish <path>`

- Pubblica tramite `POST /api/v1/skills` (multipart).
- Richiede semver: `--version 1.2.3`.
- `--owner <handle>` pubblica sotto un handle di editore org/utente quando l'attore ha accesso come editore.
- `--migrate-owner` sposta una skill esistente a `--owner` mentre pubblica una nuova versione. Richiede accesso admin/owner su entrambi gli editori.
- Il comportamento di proprietario e revisione è spiegato in `docs/publishing.md`.
- Pubblicare una skill significa che viene rilasciata con licenza `MIT-0` su ClawHub.
- Le skill pubblicate sono libere da usare, modificare e ridistribuire senza attribuzione.
- ClawHub non supporta skill a pagamento o prezzi per singola skill.
- `--clawscan-note <text>` aggiunge una nota ClawScan. Questa nota fornisce a ClawScan contesto per comportamenti che altrimenti potrebbero sembrare insoliti, come l'accesso alla rete, l'accesso all'host nativo o credenziali specifiche del provider. La nota viene archiviata nella versione pubblicata.
- Alias legacy: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- Elimina temporaneamente una skill (proprietario, moderatore o admin).
- Chiama `DELETE /api/v1/skills/{slug}`.
- Le eliminazioni temporanee avviate dal proprietario riservano lo slug per 30 giorni; il comando stampa l'orario di scadenza.
- `--reason <text>` registra una nota di moderazione sulla skill e nel log di audit.
- `--note <text>` è un alias di `--reason`.
- `--yes` salta la conferma.

### `undelete <slug>`

- Ripristina una skill nascosta (proprietario, moderatore o admin).
- Chiama `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` registra una nota di moderazione sulla skill e nel log di audit.
- `--note <text>` è un alias di `--reason`.
- `--yes` salta la conferma.

### `hide <slug>`

- Nasconde una skill (proprietario, moderatore o admin).
- Alias di `delete`.

### `unhide <slug>`

- Mostra di nuovo una skill (proprietario, moderatore o admin).
- Alias di `undelete`.

### `skill rename <slug> <new-slug>`

- Rinomina una skill posseduta e mantiene lo slug precedente come alias di reindirizzamento.
- Chiama `POST /api/v1/skills/{slug}/rename`.
- `--yes` salta la conferma.

### `skill merge <source-slug> <target-slug>`

- Unisce una skill posseduta in un'altra skill posseduta.
- Lo slug sorgente smette di essere elencato pubblicamente e diventa un alias di reindirizzamento alla destinazione.
- Chiama `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` salta la conferma.

### `transfer`

- Flusso di trasferimento della proprietà.
- I trasferimenti a handle utente creano una richiesta in sospeso che il destinatario accetta.
- I trasferimenti a handle org/editore si applicano immediatamente solo quando l'attore ha accesso admin sia al proprietario corrente sia all'editore di destinazione.
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
- Usalo per i plugin e altre voci della famiglia di pacchetti; `search` di primo livello resta la superficie di ricerca delle skill.
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
- Usalo per metadati, compatibilità, verifica, sorgente e ispezione di versioni/file dei plugin.
- `--version <version>`: ispeziona una versione specifica (predefinito: latest).
- `--tag <tag>`: ispeziona una versione taggata (ad es. `latest`).
- `--versions`: elenca la cronologia delle versioni (prima pagina).
- `--limit <n>`: numero massimo di versioni da elencare (1-100).
- `--files`: elenca i file per la versione selezionata.
- `--file <path>`: recupera il contenuto grezzo del file (solo file di testo; limite 200KB).
- `--json`: output leggibile dalla macchina.

### `package download <name>`

- Risolve una versione del pacchetto tramite `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Scarica l'artefatto dal `downloadUrl` del risolutore.
- Verifica SHA-256 di ClawHub per tutti gli artefatti.
- Per gli artefatti ClawPack npm-pack, verifica anche l'integrità npm `sha512`, lo shasum npm e nome/versione del `package.json` del tarball.
- Le versioni ZIP legacy vengono scaricate tramite la route ZIP legacy.
- Flag:
  - `--version <version>`: scarica una versione specifica.
  - `--tag <tag>`: scarica una versione taggata (predefinito: `latest`).
  - `-o, --output <path>`: file o directory di output.
  - `--force`: sovrascrive un file di output esistente.
  - `--json`: output leggibile dalla macchina.

Esempi:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Calcola SHA-256 di ClawHub, integrità npm `sha512` e shasum npm per un artefatto locale.
- Con `--package`, risolve i metadati attesi da ClawHub e confronta il file locale con i metadati dell'artefatto pubblicato.
- Con flag digest diretti, verifica senza una ricerca di rete.
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

- Elimina in modo reversibile un pacchetto e tutte le release.
- Richiede il proprietario del pacchetto, un proprietario/admin dell’editore dell’organizzazione, un moderatore della piattaforma,
  o un amministratore della piattaforma.
- Flag:
  - `--yes`: salta la conferma.
  - `--json`: output leggibile da macchina.

Esempio:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Ripristina un pacchetto e le release eliminati in modo reversibile.
- Richiede il proprietario del pacchetto, un proprietario/admin dell’editore dell’organizzazione, un moderatore della piattaforma,
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
- Richiede l’accesso amministrativo sia al proprietario corrente del pacchetto sia all’editore
  di destinazione, a meno che non venga eseguito da un amministratore della piattaforma.
- I nomi di pacchetti con ambito devono essere trasferiti al proprietario dell’ambito corrispondente.
- Chiama `POST /api/v1/packages/{name}/transfer`.
- Flag:
  - `--to <owner>`: handle dell’editore di destinazione.
  - `--reason <text>`: motivo di audit facoltativo.
  - `--json`: output leggibile da macchina.

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
  - `--json`: output leggibile da macchina.

Esempio:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Comando del proprietario per controllare la visibilità di moderazione del pacchetto.
- Chiama `GET /api/v1/packages/{name}/moderation`.
- Mostra lo stato attuale della scansione del pacchetto, il numero di segnalazioni aperte, lo stato di moderazione manuale
  dell’ultima release, lo stato di blocco dei download e i motivi di moderazione.
- Flag:
  - `--json`: output leggibile da macchina.

Esempio:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Controlla se un pacchetto è pronto per l’utilizzo futuro da parte di OpenClaw.
- Chiama `GET /api/v1/packages/{name}/readiness`.
- Segnala i blocchi per lo stato ufficiale, la disponibilità ClawPack, il digest dell’artefatto,
  la provenienza del sorgente, la compatibilità OpenClaw, i target host, i metadati di ambiente
  e lo stato della scansione.
- Flag:
  - `--json`: output leggibile da macchina.

Esempio:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Mostra lo stato di migrazione orientato agli operatori per un pacchetto che potrebbe sostituire un
  plugin OpenClaw in bundle.
- Chiama lo stesso endpoint di readiness calcolato di `package readiness`, ma stampa
  lo stato incentrato sulla migrazione, la versione più recente, lo stato del pacchetto ufficiale, i controlli e
  i blocchi.
- Flag:
  - `--json`: output leggibile da macchina.

Esempio:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Pubblica un plugin di codice o un plugin bundle tramite `POST /api/v1/packages`.
- `<source>` accetta:
  - Percorso di cartella locale: `./my-plugin`
  - Tarball npm-pack ClawPack locale: `./my-plugin-1.2.3.tgz`
  - Repository GitHub: `owner/repo` o `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- I metadati vengono rilevati automaticamente da `package.json`, `openclaw.plugin.json` e
  marcatori reali di bundle OpenClaw come `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` e `.cursor-plugin/plugin.json`.
- Le sorgenti `.tgz` vengono trattate come ClawPack. La CLI carica i byte npm-pack esatti
  e usa i contenuti estratti di `package/` solo per validazione e
  precompilazione dei metadati.
- Le cartelle di plugin di codice vengono impacchettate in un tarball npm ClawPack prima del caricamento, così
  le installazioni OpenClaw possono verificare l’artefatto esatto. Le cartelle di plugin bundle continuano
  a usare il percorso di pubblicazione dei file estratti.
- Per le sorgenti GitHub, l’attribuzione del sorgente viene compilata automaticamente dal repository, dal commit risolto, dal ref e dal sottopercorso.
- Per le cartelle locali, l’attribuzione del sorgente viene rilevata automaticamente dal git locale quando il remote origin punta a GitHub.
- I plugin di codice esterni devono dichiarare esplicitamente `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion`.
  `package.json.version` di primo livello non viene usato come fallback per la validazione della pubblicazione.
- `--dry-run` mostra in anteprima il payload di pubblicazione risolto senza caricarlo.
- `--json` emette output leggibile da macchina per CI.
- `--owner <handle>` pubblica sotto un handle di editore utente o organizzazione quando l’attore dispone dell’accesso da editore.
- `--clawscan-note <text>` aggiunge una nota ClawScan. Questa nota fornisce a ClawScan
  contesto per comportamenti che altrimenti potrebbero sembrare insoliti, come accesso alla rete,
  accesso all’host nativo o credenziali specifiche del provider. La nota viene archiviata sulla
  release pubblicata.
- I nomi di pacchetti con ambito devono corrispondere al proprietario selezionato. Vedi `docs/publishing.md`.
- I flag esistenti (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) continuano a funzionare come override.
- I repository GitHub privati richiedono `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Flusso locale consigliato

Usa prima `--dry-run` per poter confermare i metadati del pacchetto risolti e
l’attribuzione del sorgente prima di creare una release attiva:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Flusso da cartella locale

Per i plugin di codice, la pubblicazione da cartella crea e carica un artefatto ClawPack dalla
cartella del pacchetto:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` minimo per `--family code-plugin`

I plugin di codice esterni richiedono una piccola quantità di metadati OpenClaw in
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

- `package.json.version` è la versione di release del tuo pacchetto, ma non viene usato come
  fallback per la validazione di compatibilità/build OpenClaw.
- `openclaw.hostTargets` e `openclaw.environment` sono metadati facoltativi.
  ClawHub può mostrarli quando presenti, ma non sono necessari per la pubblicazione.
- `openclaw.compat.minGatewayVersion` e
  `openclaw.build.pluginSdkVersion` sono extra facoltativi se vuoi pubblicare
  metadati di compatibilità più dettagliati.
- Se stai usando una release precedente della CLI `clawhub`, aggiorna prima di pubblicare, così
  i controlli preflight locali vengono eseguiti prima del caricamento.

#### GitHub Actions

ClawHub distribuisce anche un workflow riutilizzabile ufficiale in
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/be77f0626d9e4b52c465670ba411882be1ac3a2d/.github/workflows/package-publish.yml)
per i repository di plugin.

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

- Il workflow riutilizzabile imposta `source` per impostazione predefinita sul repository chiamante.
- Per i monorepo, passa `source_path` così il workflow pubblica la cartella del pacchetto
  del plugin, per esempio `source_path: extensions/codex`.
- Fissa il workflow riutilizzabile a un tag stabile o a uno SHA di commit completo. Non eseguire la pubblicazione di release da `@main`.
- `pull_request` dovrebbe usare `dry_run: true` così CI resta non inquinante.
- Le pubblicazioni reali dovrebbero essere limitate a eventi attendibili come `workflow_dispatch` o push di tag.
- La pubblicazione attendibile senza segreto funziona solo su `workflow_dispatch`; i push di tag richiedono comunque `clawhub_token`.
- Mantieni `clawhub_token` disponibile per la prima pubblicazione, pacchetti non attendibili o pubblicazioni di emergenza.
- Il workflow carica il risultato JSON come artefatto e lo espone come output del workflow.

### `sync`

- Esegue la scansione delle cartelle di skill locali e pubblica quelle nuove/modificate.
- Le radici possono essere qualsiasi cartella: una directory di skill o una singola cartella di skill con `SKILL.md`.
- Aggiunge automaticamente le radici di skill Clawdbot quando `~/.clawdbot/clawdbot.json` è presente:
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

- Inviata durante `sync` quando l’accesso è stato effettuato, a meno che `CLAWHUB_DISABLE_TELEMETRY=1` (legacy `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Dettagli: `docs/telemetry.md`.
