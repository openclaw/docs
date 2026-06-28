---
read_when:
    - Uso della CLI di ClawHub
    - Debug di installazione, aggiornamento o pubblicazione
summary: 'Riferimento CLI: comandi, flag, configurazione e comportamento del lockfile.'
x-i18n:
    generated_at: "2026-06-28T00:10:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70aabaeae7b205e0ef30de010624e18c471baf214ff5e07ac1db8139fccb1c27
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

Quindi verificalo:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Flag globali

- `--workdir <dir>`: directory di lavoro (predefinita: cwd; ripiega sul workspace Clawdbot se configurato)
- `--dir <dir>`: directory di installazione sotto workdir (predefinita: `skills`)
- `--site <url>`: URL di base per l'accesso dal browser (predefinito: `https://clawhub.ai`)
- `--registry <url>`: URL di base dell'API (predefinito: rilevato, altrimenti `https://clawhub.ai`)
- `--no-input`: disabilita i prompt

Equivalenti di ambiente:

- `CLAWHUB_SITE` (legacy `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (legacy `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (legacy `CLAWDHUB_WORKDIR`)

### Proxy HTTP

La CLI rispetta le variabili di ambiente proxy HTTP standard per i sistemi dietro
proxy aziendali o reti limitate:

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

Quando non è impostata alcuna variabile proxy, il comportamento non cambia (connessioni dirette).

## File di configurazione

Archivia il tuo token API + l'URL del registro memorizzato nella cache.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` oppure `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Fallback legacy: se `clawhub/config.json` non esiste ancora ma `clawdhub/config.json` esiste, la CLI riusa il percorso legacy
- override: `CLAWHUB_CONFIG_PATH` (legacy `CLAWDHUB_CONFIG_PATH`)

## Comandi

### `login` / `auth login`

- Predefinito: apre il browser su `<site>/cli/auth` e completa tramite callback loopback.
- Headless: `clawhub login --token clh_...`
- Remoto/headless interattivo: `clawhub login --device` stampa un codice e attende mentre lo autorizzi su `<site>/cli/device`.

### `whoami`

- Verifica il token salvato tramite `/api/v1/whoami`.

### `token`

- Stampa il token API salvato su stdout.
- Utile per inoltrare un token di accesso locale nei comandi di configurazione dei segreti CI.

### `star <skill>` / `unstar <skill>`

- Aggiunge/rimuove una skill dai tuoi elementi in evidenza.
- Chiama `POST /api/v1/stars/<slug>` e `DELETE /api/v1/stars/<slug>`.
- `--yes` salta la conferma.

### `search <query...>`

- Chiama `/api/v1/search?q=...`.
- L'output include lo slug della skill, l'handle del proprietario, il nome visualizzato e il punteggio di pertinenza.
- La ricerca favorisce le corrispondenze esatte di token slug/nome prima della popolarità dei download. Un token slug autonomo come `map` corrisponde a `personal-map` in modo più forte rispetto alla sottostringa dentro `amap`.
- La popolarità è un piccolo fattore preliminare di ranking, non una garanzia di posizionamento in cima.
- Se una skill dovrebbe comparire ma non compare, esegui `clawhub inspect @owner/slug` mentre hai effettuato l'accesso per controllare la diagnostica di moderazione visibile al proprietario prima di rinominare i metadati.

### `explore`

- Elenca le skill più recenti tramite `/api/v1/skills?limit=...&sort=createdAt` (ordinate per `createdAt` decrescente).
- Flag:
  - `--limit <n>` (1-200, predefinito: 25)
  - `--sort newest|updated|rating|downloads|trending` (predefinito: newest). Gli alias legacy di ordinamento per l'installazione funzionano ancora per compatibilità.
  - `--json` (output leggibile da macchina)
- Output: `<slug>  v<version>  <age>  <summary>` (riepilogo troncato a 50 caratteri).

### `inspect @owner/slug`

- Recupera i metadati della skill e i file della versione senza installare.
- `--version <version>`: ispeziona una versione specifica (predefinita: latest).
- `--tag <tag>`: ispeziona una versione con tag (ad es. `latest`).
- `--versions`: elenca la cronologia delle versioni (prima pagina).
- `--limit <n>`: numero massimo di versioni da elencare (1-200).
- `--files`: elenca i file per la versione selezionata.
- `--file <path>`: recupera il contenuto grezzo del file (solo file di testo; limite 200 KB).
- `--json`: output leggibile da macchina.

### `install @owner/slug`

- Risolve la versione più recente per il proprietario e la skill indicati.
- Scarica lo zip tramite `/api/v1/download`.
- Estrae in `<workdir>/<dir>/<slug>`.
- Rifiuta di sovrascrivere le skill bloccate; esegui prima `clawhub unpin <skill>`.
- Scrive:
  - `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

### `uninstall <skill>`

- Rimuove `<workdir>/<dir>/<slug>` ed elimina la voce nel lockfile.
- Invia telemetria best-effort mentre hai effettuato l'accesso, così i conteggi delle installazioni correnti possono essere
  disattivati.
- Interattivo: chiede conferma.
- Non interattivo (`--no-input`): richiede `--yes`.

### `list`

- Legge `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`).
- Mostra `pinned` accanto alle skill congelate con `clawhub pin`, includendo il motivo facoltativo.

### `pin <skill>`

- Contrassegna una skill installata come bloccata nel lockfile.
- `--reason <text>` registra perché la skill è congelata.
- Le skill bloccate vengono saltate da `update --all` e rifiutate da `update <skill>` diretto.
- Le skill bloccate rifiutano anche `install --force`, così i byte locali non possono essere sostituiti accidentalmente.

### `unpin <skill>`

- Rimuove il blocco del lockfile da una skill installata, così gli aggiornamenti futuri possono modificarla.

### `update [@owner/slug]` / `update --all`

- Calcola l'impronta dai file locali.
- Se l'impronta corrisponde a una versione nota: nessun prompt.
- Se l'impronta non corrisponde:
  - rifiuta per impostazione predefinita
  - sovrascrive con `--force` (o con prompt, se interattivo)
- Le skill bloccate non vengono mai aggiornate da `--force`.
- `update <skill>` fallisce rapidamente per le skill bloccate e ti dice di eseguire prima `clawhub unpin <skill>`.
- `update --all` salta gli slug bloccati e stampa un riepilogo di ciò che è rimasto congelato.

### `skill publish <path>`

- Confronta l'impronta del bundle locale con ClawHub ed esce con successo quando
  il contenuto è già pubblicato.
- Le nuove skill usano `1.0.0` per impostazione predefinita; le skill modificate usano per impostazione predefinita la successiva
  versione patch.
- `--version <version>` seleziona esplicitamente una versione e pubblica anche quando il
  contenuto corrisponde a una versione esistente.
- `--dry-run` risolve la pubblicazione senza caricare; `--json` stampa un
  risultato leggibile da macchina.
- `--owner <handle>` pubblica sotto un handle editore org/utente quando
  l'attore dispone dell'accesso editore.
- `--migrate-owner` sposta una skill esistente su `--owner` mentre pubblica una nuova
  versione. Richiede accesso admin/proprietario su entrambi gli editori.
- Il comportamento di proprietario e revisione è spiegato in `docs/publishing.md`.
- Pubblicare una skill significa che viene rilasciata sotto `MIT-0` su ClawHub.
- Le skill pubblicate sono gratuite da usare, modificare e ridistribuire senza attribuzione.
- ClawHub non supporta skill a pagamento o prezzi per singola skill.
- Alias legacy: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Il workflow riutilizzabile di ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
chiama `skill publish` per un singolo `skill_path`, o per ogni cartella skill immediata
sotto `root` (predefinita: `skills`). Salta le skill non modificate e usa lo
stesso comportamento automatico di versione patch.

Imposta `dry_run: true` per un'anteprima senza token. Le pubblicazioni reali richiedono il
segreto `clawhub_token`.

### `sync`

- Scansiona la workdir corrente, la directory skill configurata e tutte le cartelle
  `--root <dir>` per trovare cartelle skill locali contenenti `SKILL.md` o
  `skill.md`.
- Confronta l'impronta di ogni skill locale con ClawHub e pubblica solo skill nuove o
  modificate.
- Le nuove skill vengono pubblicate come `1.0.0`; le skill modificate pubblicano per impostazione predefinita la successiva versione patch
  per impostazione predefinita. Usa `--bump minor|major` per batch di aggiornamenti che devono avanzare di un
  passo semver più grande.
- `--dry-run` mostra il piano di pubblicazione senza caricare; `--json` stampa un
  piano leggibile da macchina.
- `--all` pubblica ogni skill nuova o modificata senza prompt. Senza
  `--all`, i terminali interattivi ti consentono di selezionare le skill da pubblicare.
- `--owner <handle>` pubblica sotto un handle editore org/utente quando
  l'attore dispone dell'accesso editore.
- `sync` è solo una pubblicazione unidirezionale. Non installa, aggiorna, scarica né
  segnala telemetria di installazione/download.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Richiede `clawhub login`.
- Esegue ClawHub ClawScan tramite `POST /api/v1/skills/-/scan`, quindi esegue polling finché la scansione non è terminale.
- Le scansioni sono asincrone e possono richiedere tempo per completarsi. Mentre è in coda, lo spinner del terminale mostra la posizione corrente della scansione prioritaria e quante scansioni la precedono.
- Le scansioni pubblicate richiedono accesso di proprietà o gestione editore. Moderatori/admin possono usare lo stesso backend tramite `clawhub-admin`.
- `--update` è valido solo con `--slug`; scrive i risultati riusciti della scansione pubblicata nella versione selezionata.
- `--output <file.zip>` scarica l'archivio completo del report con `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` e `README.md`.
- `--json` stampa la risposta completa del polling per l'automazione.
- Le scansioni di percorsi locali non sono più supportate. Carica una nuova versione, quindi usa `scan download` per recuperare i risultati della scansione archiviati per quella versione inviata.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Richiede `clawhub login`.
- Scarica lo ZIP del report di scansione archiviato per una versione di skill o Plugin inviata, incluse le versioni bloccate o nascoste dai controlli di sicurezza ClawHub.
- I download delle skill usano lo slug della skill e usano per impostazione predefinita `--kind skill`.
- I download dei Plugin usano il nome del pacchetto e richiedono `--kind plugin`.
- `--version` è richiesto, così gli autori ispezionano l'esatta versione inviata che ClawHub ha bloccato.
- `--output <file.zip>` sceglie il percorso di destinazione.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub distribuisce un workflow riutilizzabile ufficiale in
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/8f98128aab28627477a3858081a13b76cba6f5d6/.github/workflows/skill-publish.yml)
per repository di skill e repository catalogo.

Configurazione tipica del catalogo:

```yaml
name: Skill Publish

on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Note:

- `root` usa `skills` per impostazione predefinita per i repository catalogo.
- Passa `skill_path: skills/review-helper` per elaborare una cartella skill.
- `owner` corrisponde al flag CLI `--owner`; omettilo per pubblicare come utente autenticato.
- La pubblicazione di skill V1 usa `clawhub_token`; la pubblicazione attendibile GitHub OIDC per ora è solo per pacchetti.

### `delete <skill>`

- Senza `--version`, elimina in modo reversibile una skill (proprietario, moderatore o amministratore).
- Chiama `DELETE /api/v1/skills/{slug}`.
- Le eliminazioni reversibili avviate dal proprietario riservano lo slug per 30 giorni; il comando stampa l'ora di scadenza.
- `--version <version>` elimina definitivamente una versione posseduta non più recente tramite una route fail-closed
  specifica della versione.
  Le versioni eliminate non possono essere ripristinate o ripubblicate. Pubblica una sostituzione prima di eliminare la
  versione attualmente più recente. Lo staff della piattaforma non aggira la proprietà per questo flusso limitato alla versione.
- `--reason <text>` registra una nota di moderazione su un'eliminazione reversibile dell'intera skill e nel registro di audit.
- `--note <text>` è un alias di `--reason`.
- `--yes` salta la conferma.

### `undelete <skill>`

- Ripristina una skill nascosta (proprietario, moderatore o amministratore).
- Non esiste il ripristino di una versione; le versioni eliminate definitivamente non possono essere ripristinate.
- Chiama `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` registra una nota di moderazione sulla skill e nel registro di audit.
- `--note <text>` è un alias di `--reason`.
- `--yes` salta la conferma.

### `hide <skill>`

- Nasconde una skill (proprietario, moderatore o amministratore).
- Alias di `delete`.

### `unhide <skill>`

- Rende visibile una skill (proprietario, moderatore o amministratore).
- Alias di `undelete`.

### `skill rename <skill> <new-name>`

- Rinomina una skill posseduta e mantiene lo slug precedente come alias di reindirizzamento.
- Chiama `POST /api/v1/skills/{slug}/rename`.
- `--yes` salta la conferma.

### `skill merge <source> <target>`

- Unisce una skill posseduta in un'altra skill posseduta.
- Lo slug di origine smette di essere elencato pubblicamente e diventa un alias di reindirizzamento verso la destinazione.
- Chiama `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` salta la conferma.

### `transfer`

- Flusso di lavoro per il trasferimento della proprietà.
- I trasferimenti verso handle utente creano una richiesta in sospeso che il destinatario accetta.
- I trasferimenti verso handle di organizzazioni/publisher vengono applicati immediatamente solo quando l'attore ha
  accesso amministrativo sia al proprietario attuale sia al publisher di destinazione.
- Sottocomandi:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- Endpoint:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Sfoglia o cerca nel catalogo unificato dei pacchetti tramite `GET /api/v1/packages` e `GET /api/v1/packages/search`.
- Usalo per plugin e altre voci della famiglia di pacchetti; `search` di primo livello rimane la superficie di ricerca delle skill.
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
- Usalo per metadati dei plugin, compatibilità, verifica, origine e ispezione di versione/file.
- `--version <version>`: ispeziona una versione specifica (predefinito: latest).
- `--tag <tag>`: ispeziona una versione con tag (ad esempio `latest`).
- `--versions`: elenca la cronologia delle versioni (prima pagina).
- `--limit <n>`: numero massimo di versioni da elencare (1-100).
- `--files`: elenca i file per la versione selezionata.
- `--file <path>`: recupera il contenuto grezzo del file (solo file di testo; limite 200 KB).
- `--json`: output leggibile dalla macchina.

### `package download <name>`

- Risolve una versione del pacchetto tramite
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Scarica l'artefatto dal `downloadUrl` del resolver.
- Verifica lo SHA-256 di ClawHub per tutti gli artefatti.
- Per gli artefatti ClawPack npm-pack, verifica anche l'integrità npm `sha512`,
  lo shasum npm e nome/versione del `package.json` del tarball.
- Le versioni ZIP legacy vengono scaricate tramite la route ZIP legacy.
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

- Calcola lo SHA-256 di ClawHub, l'integrità npm `sha512` e lo shasum npm per un artefatto
  locale.
- Con `--package`, risolve i metadati attesi da ClawHub e confronta il
  file locale con i metadati dell'artefatto pubblicato.
- Con i flag digest diretti, verifica senza una ricerca di rete.
- Flag:
  - `--package <name>`: nome del pacchetto per risolvere i metadati attesi dell'artefatto.
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

### `package validate <source>`

- Esegue il Plugin Inspector incluso nella CLI di ClawHub su una cartella di pacchetto plugin
  locale.
- Per impostazione predefinita usa la validazione offline/statica, senza individuare o importare un checkout
  OpenClaw locale.
- Gli errori di compatibilità gravi terminano con codice diverso da zero. I risultati solo di avviso vengono stampati ma
  terminano con codice zero.
- Flag:
  - `--out <dir>`: scrive i report del Plugin Inspector in questa directory.
  - `--openclaw <path>`: ispeziona rispetto a un checkout OpenClaw locale esplicito.
  - `--runtime`: abilita l'acquisizione runtime; importa il codice del plugin.
  - `--allow-execute`: consente l'acquisizione runtime in uno spazio di lavoro isolato.
  - `--no-mock-sdk`: disabilita l'SDK OpenClaw simulato durante l'acquisizione runtime.
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package validate ./example-plugin
```

Se la validazione segnala un risultato relativo a pacchetto, manifest, import SDK o artefatto, consulta
[Correzioni per la validazione dei plugin](/it/clawhub/plugin-validation-fixes), quindi riesegui il comando.

### `package delete <name>`

- Senza `--version`, elimina in modo reversibile un pacchetto e tutte le release.
- `--version <version>` elimina definitivamente una release posseduta non più recente tramite una route fail-closed
  specifica della versione.
  Le versioni eliminate non possono essere ripristinate o ripubblicate. Pubblica una sostituzione prima di eliminare la
  versione attualmente più recente. Questo flusso limitato alla versione richiede il proprietario del pacchetto o un amministratore
  del publisher dell'organizzazione; lo staff della piattaforma non aggira la proprietà del pacchetto.
- L'eliminazione reversibile dell'intero pacchetto richiede il proprietario del pacchetto, un proprietario/amministratore del publisher dell'organizzazione, un
  moderatore della piattaforma o un amministratore della piattaforma.
- Flag:
  - `--version <version>`: elimina definitivamente una versione non più recente.
  - `--yes`: salta la conferma.
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Ripristina un pacchetto eliminato in modo reversibile e le release.
- Non esiste il ripristino di una versione; le versioni eliminate definitivamente non possono essere ripristinate.
- Richiede il proprietario del pacchetto, un proprietario/amministratore del publisher dell'organizzazione, un moderatore della piattaforma
  o un amministratore della piattaforma.
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
- Richiede accesso amministrativo sia al proprietario attuale del pacchetto sia al publisher di destinazione,
  a meno che non venga eseguito da un amministratore della piattaforma.
- I nomi di pacchetti con scope devono essere trasferiti al proprietario dello scope corrispondente.
- Chiama `POST /api/v1/packages/{name}/transfer`.
- Flag:
  - `--to <owner>`: handle del publisher di destinazione.
  - `--reason <text>`: motivo di audit opzionale.
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
- Le segnalazioni da sole non nascondono automaticamente i pacchetti né bloccano i download.
- Flag:
  - `--version <version>`: versione opzionale del pacchetto da allegare alla segnalazione.
  - `--reason <text>`: motivo obbligatorio della segnalazione.
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Comando del proprietario per controllare la visibilità di moderazione del pacchetto.
- Chiama `GET /api/v1/packages/{name}/moderation`.
- Mostra lo stato attuale della scansione del pacchetto, il conteggio delle segnalazioni aperte, lo stato di moderazione manuale
  della release più recente, lo stato di blocco dei download e i motivi di moderazione.
- Flag:
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Controlla se un pacchetto è pronto per il consumo futuro da parte di OpenClaw.
- Chiama `GET /api/v1/packages/{name}/readiness`.
- Riporta i blocchi per stato ufficiale, disponibilità ClawPack, digest dell'artefatto,
  provenienza dell'origine, compatibilità OpenClaw, target host, metadati dell'ambiente
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
- Chiama lo stesso endpoint di readiness calcolato di `package readiness`, ma stampa
  stato focalizzato sulla migrazione, versione più recente, stato di pacchetto ufficiale, controlli e
  blocchi.
- Flag:
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Crea un publisher di organizzazione posseduto dall'utente autenticato.
- L'handle viene normalizzato in minuscolo e può essere passato con o senza `@`.
- I publisher di organizzazione appena creati non sono trusted/official per impostazione predefinita.
- Fallisce se l'handle è già usato da un publisher esistente, da un utente o da una route riservata.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Pubblica un Plugin di codice o un Plugin bundle tramite `POST /api/v1/packages`.
- `<source>` accetta:
  - Percorso di cartella locale: `./my-plugin`
  - Tarball npm-pack ClawPack locale: `./my-plugin-1.2.3.tgz`
  - Repository GitHub: `owner/repo` o `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- I metadati vengono rilevati automaticamente da `package.json`, `openclaw.plugin.json` e
  da marcatori reali di bundle OpenClaw come `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` e `.cursor-plugin/plugin.json`.
- Le sorgenti `.tgz` vengono trattate come ClawPack. La CLI carica i byte
  npm-pack esatti e usa i contenuti estratti di `package/` solo per la validazione e
  il precompilamento dei metadati.
- Le cartelle dei Plugin di codice vengono impacchettate in un tarball npm ClawPack prima del caricamento, così
  le installazioni OpenClaw possono verificare l'artefatto esatto. Le cartelle dei Plugin bundle continuano
  a usare il percorso di pubblicazione con file estratti.
- Per le sorgenti GitHub, l'attribuzione della sorgente viene popolata automaticamente dal repository, dal commit risolto, dal riferimento e dal sottopercorso.
- Per le cartelle locali, l'attribuzione della sorgente viene rilevata automaticamente da git locale quando il remote origin punta a GitHub.
- I Plugin di codice esterni devono dichiarare esplicitamente `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion`.
  `package.json.version` di primo livello non viene usato come fallback per la validazione della pubblicazione.
- `--dry-run` mostra in anteprima il payload di pubblicazione risolto senza caricare nulla.
- `--json` emette output leggibile dalle macchine per la CI.
- `--owner <handle>` pubblica sotto l'handle publisher di un utente o di un'organizzazione quando l'attore ha accesso da publisher.
- I nomi dei pacchetti con scope devono corrispondere all'owner selezionato. Vedi `docs/publishing.md`.
- I flag esistenti (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) continuano a funzionare come override.
- I repository GitHub privati richiedono `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Flusso locale consigliato

Usa prima `--dry-run`, così puoi confermare i metadati del pacchetto risolti e
l'attribuzione della sorgente prima di creare un rilascio live:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Flusso con cartella locale

Per i Plugin di codice, la pubblicazione da cartella crea e carica un artefatto ClawPack dalla
cartella del pacchetto:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` minimo per `--family code-plugin`

I Plugin di codice esterni hanno bisogno di una piccola quantità di metadati OpenClaw in
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

- `package.json.version` è la versione di rilascio del tuo pacchetto, ma non viene usata come
  fallback per la validazione di compatibilità/build di OpenClaw.
- `openclaw.hostTargets` e `openclaw.environment` sono metadati opzionali.
  ClawHub può mostrarli quando sono presenti, ma non sono richiesti per la pubblicazione.
- `openclaw.compat.minGatewayVersion` e
  `openclaw.build.pluginSdkVersion` sono extra opzionali se vuoi pubblicare
  metadati di compatibilità più dettagliati.
- Se stai usando una versione precedente della CLI `clawhub`, aggiornala prima di pubblicare, così
  i controlli preliminari locali vengono eseguiti prima del caricamento.
- Se la validazione segnala un codice di correzione, vedi
  [Correzioni di validazione dei Plugin](/it/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub include anche un workflow riutilizzabile ufficiale in
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/8f98128aab28627477a3858081a13b76cba6f5d6/.github/workflows/package-publish.yml)
per i repository di Plugin.

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
- Per i monorepo, passa `source_path` così il workflow pubblica la cartella del pacchetto
  del Plugin, per esempio `source_path: extensions/codex`.
- Fissa il workflow riutilizzabile a un tag stabile o a uno SHA di commit completo. Non eseguire pubblicazioni di rilascio da `@main`.
- `pull_request` deve usare `dry_run: true`, così la CI resta non inquinante.
- Le pubblicazioni reali devono essere limitate a eventi attendibili come `workflow_dispatch` o push di tag.
- La pubblicazione attendibile senza un segreto funziona solo su `workflow_dispatch`; i push di tag richiedono ancora `clawhub_token`.
- Mantieni `clawhub_token` disponibile per la prima pubblicazione, per pacchetti non attendibili o per pubblicazioni di emergenza.
- Il workflow carica il risultato JSON come artefatto e lo espone come output del workflow.

### `package trusted-publisher get <name>`

- Mostra la configurazione del publisher attendibile di GitHub Actions per un pacchetto.
- Usalo dopo aver impostato la configurazione per confermare il repository, il nome file del workflow
  e il pin opzionale dell'ambiente.
- Flag:
  - `--json`: output leggibile dalle macchine.

Esempio:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Collega o sostituisce la configurazione del publisher attendibile di GitHub Actions per un
  pacchetto esistente.
- Il pacchetto deve prima essere creato tramite il normale
  `clawhub package publish` manuale o autenticato con token.
- Dopo aver impostato la configurazione, le future pubblicazioni supportate da GitHub Actions possono usare
  OIDC/pubblicazione attendibile senza un token ClawHub di lunga durata.
- `--repository <repo>` deve essere `owner/repo`.
- `--workflow-filename <file>` deve corrispondere al nome del file del workflow in
  `.github/workflows/`.
- `--environment <name>` è opzionale. Quando configurato, l'ambiente GitHub Actions
  nel claim OIDC deve corrispondere esattamente.
- ClawHub verifica il repository GitHub configurato quando questo comando viene eseguito.
  I repository pubblici possono essere verificati tramite metadati GitHub pubblici. I repository
  privati richiedono che ClawHub abbia accesso GitHub a quel repository, per
  esempio tramite una futura installazione della GitHub App di ClawHub o un'altra integrazione
  GitHub autorizzata.
- Flag:
  - `--repository <repo>`: repository GitHub, per esempio `openclaw/example-plugin`.
  - `--workflow-filename <file>`: nome file del workflow, per esempio `package-publish.yml`.
  - `--environment <name>`: ambiente GitHub Actions opzionale con corrispondenza esatta.
  - `--json`: output leggibile dalle macchine.

Esempio:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Rimuove la configurazione del publisher attendibile da un pacchetto.
- Usalo come rollback se il workflow, il repository o il pin dell'ambiente devono
  essere disabilitati o ricreati.
- Le future pubblicazioni reali devono usare la normale pubblicazione autenticata finché la configurazione non viene
  impostata di nuovo.
- Flag:
  - `--json`: output leggibile dalle macchine.

Esempio:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Telemetria di installazione

- Inviata dopo `clawhub install <slug>` quando hai effettuato l'accesso, a meno che
  `CLAWHUB_DISABLE_TELEMETRY=1` non sia impostato.
- La segnalazione è best-effort. I comandi di installazione non falliscono se la telemetria
  non è disponibile.
- Dettagli: `docs/telemetry.md`.
