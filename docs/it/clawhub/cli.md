---
read_when:
    - Uso della CLI di ClawHub
    - Debug di installazione, aggiornamento o pubblicazione
summary: 'Riferimento CLI: comandi, flag, configurazione e comportamento del lockfile.'
x-i18n:
    generated_at: "2026-07-03T09:39:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5bc3d499e78ba3c9861c2faf6a01cf8afd92d6b35c42658c5b702692b5c8746
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

- `--workdir <dir>`: directory di lavoro (predefinita: cwd; ripiega sul workspace Clawdbot se configurato)
- `--dir <dir>`: directory di installazione sotto workdir (predefinita: `skills`)
- `--site <url>`: URL di base per il login nel browser (predefinito: `https://clawhub.ai`)
- `--registry <url>`: URL di base dell'API (predefinito: rilevato, altrimenti `https://clawhub.ai`)
- `--no-input`: disabilita i prompt

Equivalenti env:

- `CLAWHUB_SITE` (legacy `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (legacy `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (legacy `CLAWDHUB_WORKDIR`)

### Proxy HTTP

La CLI rispetta le variabili di ambiente standard per proxy HTTP nei sistemi dietro
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

Archivia il tuo token API + l'URL del registro memorizzato nella cache.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` o `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Fallback legacy: se `clawhub/config.json` non esiste ancora ma `clawdhub/config.json` esiste, la CLI riusa il percorso legacy
- override: `CLAWHUB_CONFIG_PATH` (legacy `CLAWDHUB_CONFIG_PATH`)

## Comandi

### `login` / `auth login`

- Predefinito: apre il browser su `<site>/cli/auth` e completa tramite callback loopback.
- Senza interfaccia: `clawhub login --token clh_...`
- Interattivo remoto/senza interfaccia: `clawhub login --device` stampa un codice e attende mentre lo autorizzi su `<site>/cli/device`.

### `whoami`

- Verifica il token archiviato tramite `/api/v1/whoami`.

### `token`

- Stampa il token API archiviato su stdout.
- Utile per reindirizzare un token di login locale nei comandi di configurazione dei secret CI.

### `star <skill>` / `unstar <skill>`

- Aggiunge/rimuove uno skill dai tuoi elementi in evidenza.
- Chiama `POST /api/v1/stars/<slug>` e `DELETE /api/v1/stars/<slug>`.
- `--yes` salta la conferma.

### `search <query...>`

- Chiama `/api/v1/search?q=...`.
- L'output include lo slug dello skill, l'handle del proprietario, il nome visualizzato e il punteggio di rilevanza.
- La ricerca privilegia le corrispondenze esatte dei token di slug/nome prima della popolarità dei download. Un token slug autonomo come `map` corrisponde a `personal-map` più fortemente della sottostringa dentro `amap`.
- La popolarità è un piccolo prior di ranking, non una garanzia di posizionamento in cima.
- Se uno skill dovrebbe apparire ma non appare, esegui `clawhub inspect @owner/slug` dopo aver effettuato l'accesso per controllare la diagnostica di moderazione visibile al proprietario prima di rinominare i metadati.

### `explore`

- Elenca gli skill più recenti tramite `/api/v1/skills?limit=...&sort=createdAt` (ordinati per `createdAt` discendente).
- Flag:
  - `--limit <n>` (1-200, predefinito: 25)
  - `--sort newest|updated|rating|downloads|trending` (predefinito: newest). Gli alias di ordinamento di installazione legacy funzionano ancora per compatibilità.
  - `--json` (output leggibile da macchina)
- Output: `<slug>  v<version>  <age>  <summary>` (riepilogo troncato a 50 caratteri).

### `inspect @owner/slug`

- Recupera i metadati dello skill e i file di versione senza installare.
- `--version <version>`: ispeziona una versione specifica (predefinita: latest).
- `--tag <tag>`: ispeziona una versione con tag (ad es. `latest`).
- `--versions`: elenca la cronologia delle versioni (prima pagina).
- `--limit <n>`: numero massimo di versioni da elencare (1-200).
- `--files`: elenca i file per la versione selezionata.
- `--file <path>`: recupera il contenuto grezzo del file (solo file di testo; limite 200 KB).
- `--json`: output leggibile da macchina.

### `install @owner/slug`

- Risolve la versione più recente per il proprietario e lo skill indicati.
- Scarica lo zip tramite `/api/v1/download`.
- Estrae in `<workdir>/<dir>/<slug>`.
- Rifiuta di sovrascrivere skill bloccati; esegui prima `clawhub unpin <skill>`.
- Scrive:
  - `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

### `uninstall <skill>`

- Rimuove `<workdir>/<dir>/<slug>` ed elimina la voce del lockfile.
- Invia telemetria best-effort quando hai effettuato l'accesso, così i conteggi di installazione correnti possono essere
  disattivati.
- Interattivo: chiede conferma.
- Non interattivo (`--no-input`): richiede `--yes`.

### `list`

- Legge `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`).
- Mostra `pinned` accanto agli skill congelati con `clawhub pin`, includendo il motivo opzionale.

### `pin <skill>`

- Contrassegna uno skill installato come bloccato nel lockfile.
- `--reason <text>` registra perché lo skill è congelato.
- Gli skill bloccati vengono saltati da `update --all` e rifiutati da `update <skill>` diretto.
- Gli skill bloccati rifiutano anche `install --force`, così i byte locali non possono essere sostituiti accidentalmente.

### `unpin <skill>`

- Rimuove il pin del lockfile da uno skill installato, così gli aggiornamenti futuri possono modificarlo.

### `update [@owner/slug]` / `update --all`

- Calcola il fingerprint dai file locali.
- Se il fingerprint corrisponde a una versione nota: nessun prompt.
- Se il fingerprint non corrisponde:
  - rifiuta per impostazione predefinita
  - sovrascrive con `--force` (o prompt, se interattivo)
- Gli skill bloccati non vengono mai aggiornati da `--force`.
- `update <skill>` fallisce subito per gli skill bloccati e ti dice di eseguire prima `clawhub unpin <skill>`.
- `update --all` salta gli slug bloccati e stampa un riepilogo di ciò che è rimasto congelato.

### `skill publish <path>`

- Confronta il fingerprint del bundle locale con ClawHub ed esce con successo quando
  il contenuto è già pubblicato.
- I nuovi skill usano `1.0.0` come valore predefinito; gli skill modificati usano per impostazione predefinita la versione patch
  successiva.
- `--version <version>` seleziona esplicitamente una versione e pubblica anche quando il
  contenuto corrisponde a una versione esistente.
- `--dry-run` risolve la pubblicazione senza caricare; `--json` stampa un
  risultato leggibile da macchina.
- `--owner <handle>` pubblica sotto l'handle di un publisher org/utente quando
  l'attore ha accesso come publisher.
- `--migrate-owner` sposta uno skill esistente su `--owner` mentre pubblica una nuova
  versione. Richiede accesso admin/proprietario su entrambi i publisher.
- Il comportamento di proprietario e revisione è spiegato in `docs/publishing.md`.
- Pubblicare uno skill significa che viene rilasciato sotto `MIT-0` su ClawHub.
- Gli skill pubblicati sono liberi da usare, modificare e redistribuire senza attribuzione.
- ClawHub non supporta skill a pagamento o prezzi per singolo skill.
- Alias legacy: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Il workflow riutilizzabile di ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
chiama `skill publish` per uno `skill_path`, o per ogni cartella skill immediata
sotto `root` (predefinito: `skills`). Salta gli skill invariati e usa lo
stesso comportamento automatico di versione patch.

Imposta `dry_run: true` per visualizzare un'anteprima senza token. Le pubblicazioni reali richiedono il
secret `clawhub_token`.

### `sync`

- Scansiona il workdir corrente, la directory degli skill configurata e tutte le
  cartelle `--root <dir>` alla ricerca di cartelle skill locali contenenti `SKILL.md` o
  `skill.md`.
- Confronta ogni fingerprint di skill locale con ClawHub e pubblica solo skill nuovi o
  modificati.
- I nuovi skill vengono pubblicati come `1.0.0`; gli skill modificati pubblicano la versione patch successiva
  per impostazione predefinita. Usa `--bump minor|major` per batch di aggiornamento che devono avanzare di un
  passo semver più grande.
- `--dry-run` mostra il piano di pubblicazione senza caricare; `--json` stampa un
  piano leggibile da macchina.
- `--all` pubblica ogni skill nuovo o modificato senza prompt. Senza
  `--all`, i terminali interattivi ti consentono di selezionare gli skill da pubblicare.
- `--owner <handle>` pubblica sotto l'handle di un publisher org/utente quando
  l'attore ha accesso come publisher.
- `sync` è solo una pubblicazione unidirezionale. Non installa, aggiorna, scarica né
  segnala telemetria di installazione/download.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Richiede `clawhub login`.
- Esegue ClawHub ClawScan tramite `POST /api/v1/skills/-/scan`, poi effettua polling finché la scansione è terminale.
- Le scansioni sono asincrone e possono richiedere tempo per completarsi. Durante la coda, lo spinner del terminale mostra la posizione corrente nella scansione prioritaria e quante scansioni precedono.
- Le scansioni pubblicate richiedono proprietà o accesso di gestione publisher. Moderatori/admin possono usare lo stesso backend tramite `clawhub-admin`.
- `--update` è valido solo con `--slug`; scrive i risultati di scansione pubblicati riusciti sulla versione selezionata.
- `--output <file.zip>` scarica l'archivio completo del report con `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` e `README.md`.
- `--json` stampa la risposta completa del polling per l'automazione.
- Le scansioni di percorsi locali non sono più supportate. Carica una nuova versione, poi usa `scan download` per recuperare i risultati di scansione archiviati per quella versione inviata.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Richiede `clawhub login`.
- Scarica lo ZIP del report di scansione archiviato per una versione di skill o plugin inviata, incluse le versioni bloccate o nascoste dai controlli di sicurezza ClawHub.
- I download di skill usano lo slug dello skill e usano `--kind skill` come valore predefinito.
- I download di plugin usano il nome del pacchetto e richiedono `--kind plugin`.
- `--version` è richiesto affinché gli autori ispezionino la versione esatta inviata che ClawHub ha bloccato.
- `--output <file.zip>` sceglie il percorso di destinazione.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub fornisce un workflow riutilizzabile ufficiale in
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/a95f470a588ea9fe4c4b4c258c8c4ca5f02c2836/.github/workflows/skill-publish.yml)
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

- `root` usa `skills` come valore predefinito per i repository catalogo.
- Passa `skill_path: skills/review-helper` per elaborare una cartella skill.
- `owner` corrisponde al flag CLI `--owner`; omettilo per pubblicare come utente autenticato.
- La pubblicazione skill V1 usa `clawhub_token`; la pubblicazione trusted con GitHub OIDC è per ora solo per pacchetti.

### `delete <skill>`

- Senza `--version`, elimina in modo reversibile una competenza (proprietario, moderatore o amministratore).
- Chiama `DELETE /api/v1/skills/{slug}`.
- Le eliminazioni reversibili avviate dal proprietario riservano lo slug per 30 giorni; il comando stampa l'ora di scadenza.
- `--version <version>` elimina definitivamente una versione posseduta non più recente tramite una route fail-closed
  specifica per versione.
  Le versioni eliminate non possono essere ripristinate o ripubblicate. Pubblica una sostituzione prima di eliminare la
  versione attualmente più recente. Il personale della piattaforma non aggira la proprietà per questo flusso solo per versione.
- `--reason <text>` registra una nota di moderazione su un'eliminazione reversibile dell'intera competenza e nel registro di controllo.
- `--note <text>` è un alias per `--reason`.
- `--yes` salta la conferma.

### `undelete <skill>`

- Ripristina una competenza nascosta (proprietario, moderatore o amministratore).
- Non esiste un ripristino della versione; le versioni eliminate definitivamente non possono essere ripristinate.
- Chiama `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` registra una nota di moderazione sulla competenza e nel registro di controllo.
- `--note <text>` è un alias per `--reason`.
- `--yes` salta la conferma.

### `hide <skill>`

- Nasconde una competenza (proprietario, moderatore o amministratore).
- Alias per `delete`.

### `unhide <skill>`

- Rende nuovamente visibile una competenza (proprietario, moderatore o amministratore).
- Alias per `undelete`.

### `skill rename <skill> <new-name>`

- Rinomina una competenza posseduta e mantiene lo slug precedente come alias di reindirizzamento.
- Chiama `POST /api/v1/skills/{slug}/rename`.
- `--yes` salta la conferma.

### `skill merge <source> <target>`

- Unisce una competenza posseduta in un'altra competenza posseduta.
- Lo slug di origine smette di essere elencato pubblicamente e diventa un alias di reindirizzamento verso la destinazione.
- Chiama `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` salta la conferma.

### `transfer`

- Flusso di trasferimento della proprietà.
- I trasferimenti verso handle utente creano una richiesta in sospeso che il destinatario accetta.
- I trasferimenti verso handle di organizzazioni/publisher vengono applicati immediatamente solo quando l'attore ha
  accesso amministrativo sia al proprietario corrente sia al publisher di destinazione.
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
- Usalo per i plugin e altre voci della famiglia di pacchetti; `search` di primo livello resta la superficie di ricerca delle competenze.
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
- Usalo per metadati del plugin, compatibilità, verifica, origine e ispezione di versioni/file.
- `--version <version>`: ispeziona una versione specifica (predefinito: più recente).
- `--tag <tag>`: ispeziona una versione con tag (ad es. `latest`).
- `--versions`: elenca la cronologia delle versioni (prima pagina).
- `--limit <n>`: numero massimo di versioni da elencare (1-100).
- `--files`: elenca i file per la versione selezionata.
- `--file <path>`: recupera il contenuto grezzo del file (solo file di testo; limite di 200 KB).
- `--json`: output leggibile dalla macchina.

### `package download <name>`

- Risolve una versione del pacchetto tramite
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Scarica l'artefatto dal `downloadUrl` del resolver.
- Verifica lo SHA-256 di ClawHub per tutti gli artefatti.
- Per gli artefatti ClawPack npm-pack, verifica anche l'integrità npm `sha512`,
  lo shasum npm e nome/versione nel `package.json` del tarball.
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

- Calcola lo SHA-256 di ClawHub, l'integrità npm `sha512` e lo shasum npm per un
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

### `package validate <source>`

- Esegue il Plugin Inspector incluso nella CLI di ClawHub su una cartella locale
  di pacchetto plugin.
- Per impostazione predefinita usa la convalida offline/statica, senza localizzare o importare un checkout
  locale di OpenClaw.
- Gli errori di compatibilità bloccanti terminano con codice diverso da zero. I risultati solo di avviso vengono stampati ma
  terminano con zero.
- Flag:
  - `--out <dir>`: scrive i report di Plugin Inspector in questa directory.
  - `--openclaw <path>`: ispeziona rispetto a un checkout locale esplicito di OpenClaw.
  - `--runtime`: abilita l'acquisizione runtime; importa il codice del plugin.
  - `--allow-execute`: consente l'acquisizione runtime in uno spazio di lavoro isolato.
  - `--no-mock-sdk`: disabilita l'SDK OpenClaw simulato durante l'acquisizione runtime.
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package validate ./example-plugin
```

Se la convalida segnala un risultato relativo a pacchetto, manifesto, importazione SDK o artefatto, consulta
[correzioni di convalida dei plugin](/clawhub/plugin-validation-fixes), quindi riesegui il comando.

### `package delete <name>`

- Senza `--version`, elimina in modo reversibile un pacchetto e tutte le release.
- `--version <version>` elimina definitivamente una release posseduta non più recente tramite una route fail-closed
  specifica per versione.
  Le versioni eliminate non possono essere ripristinate o ripubblicate. Pubblica una sostituzione prima di eliminare la
  versione attualmente più recente. Questo flusso solo per versione richiede il proprietario del pacchetto o un amministratore
  del publisher dell'organizzazione; il personale della piattaforma non aggira la proprietà del pacchetto.
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
- Non esiste un ripristino della versione; le versioni eliminate definitivamente non possono essere ripristinate.
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
- Richiede accesso amministrativo sia al proprietario corrente del pacchetto sia al publisher di destinazione,
  a meno che non venga eseguito da un amministratore della piattaforma.
- I nomi di pacchetto con scope devono essere trasferiti al proprietario dello scope corrispondente.
- Chiama `POST /api/v1/packages/{name}/transfer`.
- Flag:
  - `--to <owner>`: handle del publisher di destinazione.
  - `--reason <text>`: motivo di controllo facoltativo.
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
  - `--version <version>`: versione del pacchetto facoltativa da allegare alla segnalazione.
  - `--reason <text>`: motivo della segnalazione obbligatorio.
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Comando per il proprietario per controllare la visibilità di moderazione del pacchetto.
- Chiama `GET /api/v1/packages/{name}/moderation`.
- Mostra lo stato corrente della scansione del pacchetto, il conteggio delle segnalazioni aperte, lo stato di moderazione manuale
  dell'ultima release, lo stato del blocco download e i motivi di moderazione.
- Flag:
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Controlla se un pacchetto è pronto per il consumo futuro da parte di OpenClaw.
- Chiama `GET /api/v1/packages/{name}/readiness`.
- Segnala blocchi per stato ufficiale, disponibilità ClawPack, digest dell'artefatto,
  provenienza dell'origine, compatibilità OpenClaw, destinazioni host, metadati dell'ambiente
  e stato della scansione.
- Flag:
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Mostra lo stato di migrazione orientato all'operatore per un pacchetto che può sostituire un
  plugin OpenClaw incluso.
- Chiama lo stesso endpoint di readiness calcolato di `package readiness`, ma stampa
  stato orientato alla migrazione, versione più recente, stato di pacchetto ufficiale, controlli e
  blocchi.
- Flag:
  - `--json`: output leggibile dalla macchina.

Esempio:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Crea un publisher dell'organizzazione posseduto dall'utente autenticato.
- L'handle viene normalizzato in minuscolo e può essere passato con o senza `@`.
- I publisher dell'organizzazione appena creati non sono attendibili/ufficiali per impostazione predefinita.
- Fallisce se l'handle è già usato da un publisher esistente, da un utente o da una route riservata.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Pubblica un Plugin di codice o un Plugin bundle tramite `POST /api/v1/packages`.
- `<source>` accetta:
  - Percorso di cartella locale: `./my-plugin`
  - Tarball npm-pack ClawPack locale: `./my-plugin-1.2.3.tgz`
  - Repo GitHub: `owner/repo` o `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- I metadati vengono rilevati automaticamente da `package.json`, `openclaw.plugin.json` e
  marcatori reali di bundle OpenClaw come `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` e `.cursor-plugin/plugin.json`.
- Le sorgenti `.tgz` vengono trattate come ClawPack. La CLI carica i byte esatti
  di npm-pack e usa i contenuti estratti di `package/` solo per la validazione e
  il precompilamento dei metadati.
- Le cartelle di Plugin di codice vengono pacchettizzate in un tarball npm ClawPack prima del caricamento, così
  le installazioni di OpenClaw possono verificare l’artefatto esatto. Le cartelle di Plugin bundle continuano
  a usare il percorso di pubblicazione dei file estratti.
- Per le sorgenti GitHub, l’attribuzione della sorgente viene compilata automaticamente dal repo, dal commit risolto, dal ref e dal sottopercorso.
- Per le cartelle locali, l’attribuzione della sorgente viene rilevata automaticamente da git locale quando il remote origin punta a GitHub.
- I Plugin di codice esterni devono dichiarare esplicitamente `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion`.
  Il `package.json.version` di primo livello non viene usato come fallback per la validazione della pubblicazione.
- `--dry-run` mostra in anteprima il payload di pubblicazione risolto senza caricarlo.
- `--json` emette output leggibile da macchina per la CI.
- `--owner <handle>` pubblica sotto l’handle di un publisher utente o organizzazione quando l’attore dispone dell’accesso da publisher.
- I nomi dei pacchetti con scope devono corrispondere all’owner selezionato. Vedi `docs/publishing.md`.
- I flag esistenti (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) continuano a funzionare come override.
- I repo GitHub privati richiedono `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Flusso locale consigliato

Usa prima `--dry-run` così puoi confermare i metadati del pacchetto risolti e
l’attribuzione della sorgente prima di creare una release live:

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

#### `package.json` minimale per `--family code-plugin`

I Plugin di codice esterni hanno bisogno di una piccola quantità di metadati OpenClaw in
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
  fallback per la validazione di compatibilità/build di OpenClaw.
- `openclaw.hostTargets` e `openclaw.environment` sono metadati facoltativi.
  ClawHub può mostrarli quando presenti, ma non sono necessari per la pubblicazione.
- `openclaw.compat.minGatewayVersion` e
  `openclaw.build.pluginSdkVersion` sono extra facoltativi se vuoi pubblicare
  metadati di compatibilità più dettagliati.
- Se stai usando una release precedente della CLI `clawhub`, aggiornala prima di pubblicare in modo che
  i controlli preliminari locali vengano eseguiti prima del caricamento.
- Se la validazione segnala un codice di correzione, vedi
  [Correzioni per la validazione dei Plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub distribuisce anche un workflow riutilizzabile ufficiale su
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/a95f470a588ea9fe4c4b4c258c8c4ca5f02c2836/.github/workflows/package-publish.yml)
per i repo dei Plugin.

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

- Il workflow riutilizzabile imposta `source` sul repository chiamante per impostazione predefinita.
- Per i monorepo, passa `source_path` in modo che il workflow pubblichi la cartella
  del pacchetto Plugin, ad esempio `source_path: extensions/codex`.
- Fissa il workflow riutilizzabile a un tag stabile o a uno SHA di commit completo. Non eseguire la pubblicazione delle release da `@main`.
- `pull_request` deve usare `dry_run: true` in modo che la CI non inquini lo stato.
- Le pubblicazioni reali devono essere limitate a eventi attendibili come `workflow_dispatch` o push di tag.
- La pubblicazione attendibile senza un segreto funziona solo su `workflow_dispatch`; i push di tag richiedono comunque `clawhub_token`.
- Mantieni `clawhub_token` disponibile per la prima pubblicazione, i pacchetti non attendibili o le pubblicazioni di emergenza.
- Il workflow carica il risultato JSON come artefatto e lo espone come output del workflow.

### `package trusted-publisher get <name>`

- Mostra la configurazione dell'editore attendibile GitHub Actions per un pacchetto.
- Usalo dopo aver impostato la configurazione per confermare il repository, il nome file del workflow
  e l'eventuale vincolo dell'ambiente.
- Flag:
  - `--json`: output leggibile da macchina.

Esempio:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Collega o sostituisce la configurazione dell'editore attendibile GitHub Actions per un pacchetto
  esistente.
- Il pacchetto deve prima essere creato tramite il normale
  `clawhub package publish` manuale o autenticato tramite token.
- Dopo aver impostato la configurazione, le future pubblicazioni GitHub Actions supportate possono usare
  OIDC/pubblicazione attendibile senza un token ClawHub a lunga durata.
- `--repository <repo>` deve essere `owner/repo`.
- `--workflow-filename <file>` deve corrispondere al nome del file del workflow in
  `.github/workflows/`.
- `--environment <name>` è facoltativo. Quando configurato, l'ambiente GitHub Actions
  nell'attestazione OIDC deve corrispondere esattamente.
- ClawHub verifica il repository GitHub configurato quando questo comando viene eseguito.
  I repository pubblici possono essere verificati tramite i metadati pubblici di GitHub. I repository privati
  richiedono che ClawHub abbia accesso GitHub a quel repository, ad
  esempio tramite una futura installazione della GitHub App di ClawHub o un'altra integrazione
  GitHub autorizzata.
- Flag:
  - `--repository <repo>`: repository GitHub, ad esempio `openclaw/example-plugin`.
  - `--workflow-filename <file>`: nome file del workflow, ad esempio `package-publish.yml`.
  - `--environment <name>`: ambiente GitHub Actions facoltativo con corrispondenza esatta.
  - `--json`: output leggibile da macchina.

Esempio:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Rimuove la configurazione dell'editore attendibile da un pacchetto.
- Usalo come rollback se il workflow, il repository o il vincolo dell'ambiente devono essere
  disabilitati o ricreati.
- Le future pubblicazioni reali devono usare la normale pubblicazione autenticata finché la configurazione non viene
  impostata di nuovo.
- Flag:
  - `--json`: output leggibile da macchina.

Esempio:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Telemetria di installazione

- Inviata dopo `clawhub install <slug>` quando l'accesso è stato effettuato, a meno che
  `CLAWHUB_DISABLE_TELEMETRY=1` non sia impostato.
- La segnalazione è best-effort. I comandi di installazione non falliscono se la telemetria
  non è disponibile.
- Dettagli: `docs/telemetry.md`.
