---
read_when:
    - Vuoi installare o gestire Plugin Gateway o bundle compatibili
    - Vuoi creare lo scaffold o validare un semplice Plugin di strumenti
    - Vuoi eseguire il debug degli errori di caricamento dei plugin
sidebarTitle: Plugins
summary: Riferimento CLI per `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-06-28T20:42:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a703adb93af2490282f73b25cbbd95c7bc1d54c9c9c656fdb9b75465683f4ec8
    source_path: cli/plugins.md
    workflow: 16
---

Gestisci Plugin del Gateway, pacchetti di hook e bundle compatibili.

<CardGroup cols={2}>
  <Card title="Sistema di Plugin" href="/it/tools/plugin">
    Guida per utenti finali per installare, abilitare e risolvere i problemi dei Plugin.
  </Card>
  <Card title="Gestire i Plugin" href="/it/plugins/manage-plugins">
    Esempi rapidi per installazione, elenco, aggiornamento, disinstallazione e pubblicazione.
  </Card>
  <Card title="Bundle di Plugin" href="/it/plugins/bundles">
    Modello di compatibilità dei bundle.
  </Card>
  <Card title="Manifesto del Plugin" href="/it/plugins/manifest">
    Campi del manifesto e schema di configurazione.
  </Card>
  <Card title="Sicurezza" href="/it/gateway/security">
    Rafforzamento della sicurezza per le installazioni dei Plugin.
  </Card>
</CardGroup>

## Comandi

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile clawhub-public --json
openclaw plugins marketplace refresh --feed-url https://clawhub.ai/v1/feeds/plugins --expected-sha256 <sha256>
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

Per indagini su installazione, ispezione, disinstallazione o aggiornamento del registro lenti, esegui il
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traccia scrive i tempi delle fasi
su stderr e mantiene analizzabile l'output JSON. Consulta [Debugging](/it/help/debugging#plugin-lifecycle-trace).

<Note>
In modalità Nix (`OPENCLAW_NIX_MODE=1`), i mutatori del ciclo di vita dei Plugin sono disabilitati. Usa la sorgente Nix per questa installazione invece di `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` o `plugins disable`; per nix-openclaw, usa la [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) agent-first.
</Note>

<Note>
I Plugin inclusi vengono distribuiti con OpenClaw. Alcuni sono abilitati per impostazione predefinita (per esempio provider di modelli inclusi, provider vocali inclusi e il Plugin browser incluso); altri richiedono `plugins enable`.

I Plugin OpenClaw nativi devono includere `openclaw.plugin.json` con uno schema JSON inline (`configSchema`, anche se vuoto). I bundle compatibili usano invece i propri manifesti di bundle.

`plugins list` mostra `Format: openclaw` o `Format: bundle`. L'output dettagliato di elenco/info mostra anche il sottotipo di bundle (`codex`, `claude` o `cursor`) più le funzionalità di bundle rilevate.
</Note>

### Autore

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` crea per impostazione predefinita un Plugin di strumenti TypeScript minimale. Il primo
argomento è l'id del Plugin; passa `--name` per il nome visualizzato. OpenClaw usa l'id
per la directory di output predefinita e per il nome del pacchetto. Gli scaffold di strumenti usano
`defineToolPlugin`.
`plugins build` importa l'entry compilato, legge i relativi metadati statici dello strumento, scrive
`openclaw.plugin.json` e mantiene allineato `openclaw.extensions` in `package.json`.
`plugins validate` verifica che il manifesto generato, i metadati del pacchetto e
l'export dell'entry corrente siano ancora coerenti. Consulta [Plugin di strumenti](/it/plugins/tool-plugins) per
il flusso di lavoro completo di creazione degli strumenti.

Lo scaffold scrive sorgente TypeScript ma genera i metadati dall'entry compilato
`./dist/index.js`, quindi il flusso di lavoro funziona anche con la CLI pubblicata. Usa
`--entry <path>` quando l'entry non è quello predefinito del pacchetto. Usa
`plugins build --check` in CI per fallire quando i metadati generati sono obsoleti senza
riscrivere file.

### Scaffold del provider

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Gli scaffold di provider creano un Plugin provider generico per testo/modelli con integrazione
della chiave API compatibile con OpenAI, uno script integrato `npm run validate` per `clawhub package
validate`, metadati del pacchetto ClawHub e un workflow GitHub avviato manualmente
per futura pubblicazione attendibile tramite GitHub Actions OIDC. Gli scaffold di provider non
generano Skills e non usano `openclaw plugins build` o
`openclaw plugins validate`; questi comandi sono destinati al percorso dei metadati generati
dello scaffold di strumenti.

Prima della pubblicazione, sostituisci l'URL base API segnaposto, il catalogo dei modelli, la route
della documentazione, il testo delle credenziali e il testo del README con i dettagli reali del provider. Usa il
README generato per la prima pubblicazione su ClawHub e la configurazione del publisher attendibile.

### Installazione

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # source auto-detection
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

I manutentori che testano installazioni in fase di configurazione possono sovrascrivere le sorgenti automatiche
di installazione dei Plugin con variabili d'ambiente protette. Consulta
[Sovrascritture di installazione dei Plugin](/it/plugins/install-overrides).

<Warning>
I nomi di pacchetto semplici vengono installati da npm per impostazione predefinita durante la transizione di lancio, a meno che non corrispondano a un id di Plugin ufficiale. Le specifiche di pacchetto `@openclaw/*` grezze che corrispondono a Plugin inclusi usano la copia inclusa distribuita con la build OpenClaw corrente. Usa `npm:<package>` quando vuoi deliberatamente un pacchetto npm esterno. Usa `clawhub:<package>` per ClawHub. Tratta le installazioni dei Plugin come esecuzione di codice. Preferisci versioni fissate.
</Warning>

`plugins search` interroga ClawHub per pacchetti Plugin installabili e stampa
nomi di pacchetto pronti per l'installazione. Cerca pacchetti di Plugin di codice e Plugin bundle,
non Skills. Usa `openclaw skills search` per le Skills di ClawHub.

<Note>
ClawHub è la superficie primaria di distribuzione e scoperta per la maggior parte dei Plugin. Npm
rimane un fallback supportato e un percorso di installazione diretta. I pacchetti Plugin
`@openclaw/*` di proprietà di OpenClaw sono nuovamente pubblicati su npm; consulta l'elenco corrente
su [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o l'
[inventario dei Plugin](/it/plugins/plugin-inventory). Le installazioni stabili usano `latest`.
Le installazioni e gli aggiornamenti del canale beta preferiscono il dist-tag npm `beta` quando quel tag
è disponibile, poi ripiegano su `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Include di configurazione e riparazione di configurazioni non valide">
    Se la tua sezione `plugins` è supportata da un `$include` a file singolo, `plugins install/update/enable/disable/uninstall` scrive in quel file incluso e lascia `openclaw.json` intatto. Include root, array di include e include con override fratelli falliscono in modo chiuso invece di essere appiattiti. Consulta [Include di configurazione](/it/gateway/configuration) per le forme supportate.

    Se la configurazione non è valida durante l'installazione, `plugins install` normalmente fallisce in modo chiuso e ti indica di eseguire prima `openclaw doctor --fix`. Durante l'avvio del Gateway e il ricaricamento a caldo, una configurazione Plugin non valida fallisce in modo chiuso come qualsiasi altra configurazione non valida; `openclaw doctor --fix` può mettere in quarantena la voce Plugin non valida. L'unica eccezione documentata in fase di installazione è un percorso ristretto di ripristino per Plugin inclusi per Plugin che aderiscono esplicitamente a `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstallazione rispetto ad aggiornamento">
    `--force` riusa la destinazione di installazione esistente e sovrascrive sul posto un Plugin o un pacchetto di hook già installato. Usalo quando stai intenzionalmente reinstallando lo stesso id da un nuovo percorso locale, archivio, pacchetto ClawHub o artefatto npm. Per aggiornamenti ordinari di un Plugin npm già tracciato, preferisci `openclaw plugins update <id-or-npm-spec>`.

    Se esegui `plugins install` per un id Plugin già installato, OpenClaw si ferma e ti indirizza a `plugins update <id-or-npm-spec>` per un aggiornamento normale, oppure a `plugins install <package> --force` quando vuoi davvero sovrascrivere l'installazione corrente da una sorgente diversa.

  </Accordion>
  <Accordion title="Ambito di --pin">
    `--pin` si applica solo alle installazioni npm. Non è supportato con installazioni `git:`; usa un ref git esplicito come `git:github.com/acme/plugin@v1.2.3` quando vuoi una sorgente fissata. Non è supportato con `--marketplace`, perché le installazioni marketplace persistono i metadati della sorgente marketplace invece di una specifica npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` è deprecato e ora è un no-op. OpenClaw non esegue più il blocco integrato del codice pericoloso in fase di installazione per le installazioni dei Plugin.

    Usa la superficie condivisa `security.installPolicy` di proprietà dell'operatore quando è richiesta una policy di installazione specifica per l'host. Gli hook Plugin `before_install` sono hook del ciclo di vita del runtime Plugin e non sono il confine di policy principale per le installazioni CLI.

    Se un Plugin che hai pubblicato su ClawHub è nascosto o bloccato da una scansione del registro, usa i passaggi per publisher in [Pubblicazione su ClawHub](/it/clawhub/publishing). `--dangerously-force-unsafe-install` non chiede a ClawHub di rieseguire la scansione del Plugin o di rendere pubblica una release bloccata.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Le installazioni da ClawHub community verificano il record di attendibilità della release selezionata prima di scaricare il pacchetto. Se ClawHub disabilita il download per la release, segnala risultati di scansione malevoli o mette la release in uno stato di moderazione bloccante come la quarantena, OpenClaw rifiuta la release. Per stati di scansione rischiosi non bloccanti, stati di moderazione rischiosi o motivi del registro, OpenClaw mostra i dettagli di attendibilità e chiede conferma prima di continuare.

    Usa `--acknowledge-clawhub-risk` solo dopo aver esaminato l'avviso ClawHub e deciso di continuare senza un prompt interattivo. I record di attendibilità puliti in sospeso o obsoleti generano un avviso ma non richiedono conferma. I pacchetti ClawHub ufficiali e le sorgenti Plugin OpenClaw incluse ignorano questo prompt di attendibilità della release.

  </Accordion>
  <Accordion title="Pacchetti di hook e specifiche npm">
    `plugins install` è anche la superficie di installazione per i pacchetti di hook che espongono `openclaw.hooks` in `package.json`. Usa `openclaw hooks` per visibilità filtrata degli hook e abilitazione per singolo hook, non per l'installazione di pacchetti.

    Le specifiche npm sono **solo registry** (nome del pacchetto + **versione esatta** opzionale o **dist-tag**). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati. Le installazioni delle dipendenze vengono eseguite in un progetto npm gestito per ciascun Plugin con `--ignore-scripts` per sicurezza, anche quando la tua shell ha impostazioni globali di installazione npm. I progetti npm gestiti dei Plugin ereditano gli `overrides` npm a livello di pacchetto di OpenClaw, quindi i pin di sicurezza dell'host si applicano anche alle dipendenze dei Plugin hoisted.

    Usa `npm:<package>` quando vuoi rendere esplicita la risoluzione npm. Anche le specifiche di pacchetto nude installano direttamente da npm durante il cutover di lancio, a meno che non corrispondano a un id di Plugin ufficiale.

    Le specifiche di pacchetto `@openclaw/*` grezze che corrispondono a Plugin in bundle vengono risolte nella copia in bundle posseduta dall'immagine prima del fallback npm. Per esempio, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` usa il Plugin Discord in bundle dalla build OpenClaw corrente invece di creare un override npm gestito. Per forzare il pacchetto npm esterno, usa `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Le specifiche nude e `@latest` restano sul canale stabile. Le versioni di correzione con data di OpenClaw, come `2026.5.3-1`, sono release stabili per questo controllo. Se npm risolve una di queste in una prerelease, OpenClaw si ferma e ti chiede di aderire esplicitamente con un tag prerelease come `@beta`/`@rc` o con una versione prerelease esatta come `@1.2.3-beta.4`.

    Per le installazioni npm senza una versione esatta (`npm:<package>` o `npm:<package>@latest`), OpenClaw controlla i metadati del pacchetto risolto prima dell'installazione. Se l'ultimo pacchetto stabile richiede una API Plugin OpenClaw più recente o una versione minima dell'host più nuova, OpenClaw ispeziona le versioni stabili precedenti e installa invece la release compatibile più recente. Le versioni esatte e i dist-tag espliciti come `@beta` restano rigorosi: se il pacchetto selezionato è incompatibile, il comando fallisce e ti chiede di aggiornare OpenClaw o scegliere una versione compatibile.

    Se una specifica di installazione nuda corrisponde a un id di Plugin ufficiale (per esempio `diffs`), OpenClaw installa direttamente la voce di catalogo. Per installare un pacchetto npm con lo stesso nome, usa una specifica scoped esplicita (per esempio `@scope/diffs`).

  </Accordion>
  <Accordion title="Repository Git">
    Usa `git:<repo>` per installare direttamente da un repository git. Le forme supportate includono URL di clone `git:github.com/owner/repo`, `git:owner/repo`, `https://` completo, `ssh://`, `git://`, `file://` e `git@host:owner/repo.git`. Aggiungi `@<ref>` o `#<ref>` per fare il check-out di un branch, tag o commit prima dell'installazione.

    Le installazioni Git clonano in una directory temporanea, fanno il check-out del ref richiesto quando presente, quindi usano il normale installer di directory Plugin. Questo significa che la validazione del manifest, la policy di installazione dell'operatore, il lavoro di installazione del package manager e i record di installazione si comportano come nelle installazioni npm. Le installazioni git registrate includono l'URL/ref sorgente più il commit risolto, così `openclaw plugins update` può risolvere di nuovo la sorgente in seguito.

    Dopo l'installazione da git, usa `openclaw plugins inspect <id> --runtime --json` per verificare le registrazioni runtime come metodi Gateway e comandi CLI. Se il Plugin ha registrato una radice CLI con `api.registerCli`, esegui quel comando direttamente tramite la CLI root di OpenClaw, per esempio `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivi">
    Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Gli archivi Plugin OpenClaw nativi devono contenere un `openclaw.plugin.json` valido nella root del Plugin estratto; gli archivi che contengono solo `package.json` vengono rifiutati prima che OpenClaw scriva i record di installazione.

    Usa `npm-pack:<path.tgz>` quando il file è un tarball npm-pack e vuoi
    testare lo stesso percorso di progetto npm gestito per Plugin usato dalle
    installazioni da registry, inclusi la verifica di `package-lock.json`, la
    scansione delle dipendenze hoisted e i record di installazione npm. I percorsi
    di archivio semplici vengono comunque installati come archivi locali sotto la
    root delle estensioni Plugin.

    Sono supportate anche le installazioni dal marketplace Claude.

  </Accordion>
</AccordionGroup>

Le installazioni ClawHub usano un locator esplicito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Le specifiche Plugin nude sicure per npm installano da npm per impostazione predefinita durante il cutover di lancio, a meno che non corrispondano a un id di Plugin ufficiale:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` per rendere esplicita la risoluzione solo npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controlla la API Plugin pubblicizzata / compatibilità minima del gateway prima dell'installazione. Quando la versione ClawHub selezionata pubblica un artifact ClawPack, OpenClaw scarica il `.tgz` npm-pack versionato, verifica l'header digest ClawHub e il digest dell'artifact, quindi lo installa tramite il normale percorso di archivio. Le versioni ClawHub precedenti senza metadati ClawPack vengono comunque installate tramite il percorso legacy di verifica dell'archivio pacchetto. Le installazioni registrate conservano i metadati sorgente ClawHub, il tipo di artifact, l'integrità npm, lo shasum npm, il nome del tarball e i dati del digest ClawPack per aggiornamenti successivi.
Le installazioni ClawHub senza versione mantengono una specifica registrata senza versione, così `openclaw plugins update` può seguire release ClawHub più recenti; i selettori espliciti di versione o tag come `clawhub:pkg@1.2.3` e `clawhub:pkg@beta` restano bloccati a quel selettore.

#### Abbreviazione marketplace

Usa l'abbreviazione `plugin@marketplace` quando il nome del marketplace esiste nella cache del registry locale di Claude in `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Usa `--marketplace` quando vuoi passare esplicitamente la sorgente del marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Sorgenti marketplace">
    - un nome di marketplace noto a Claude da `~/.claude/plugins/known_marketplaces.json`
    - una root marketplace locale o un percorso `marketplace.json`
    - un'abbreviazione di repo GitHub come `owner/repo`
    - un URL di repo GitHub come `https://github.com/owner/repo`
    - un URL git

  </Tab>
  <Tab title="Regole marketplace remoti">
    Per i marketplace remoti caricati da GitHub o git, le voci Plugin devono restare dentro il repo marketplace clonato. OpenClaw accetta sorgenti con percorso relativo da quel repo e rifiuta sorgenti Plugin HTTP(S), con percorso assoluto, git, GitHub e altre sorgenti non basate su percorso dai manifest remoti.
  </Tab>
</Tabs>

Per percorsi locali e archivi, OpenClaw rileva automaticamente:

- Plugin OpenClaw nativi (`openclaw.plugin.json`)
- bundle compatibili con Codex (`.codex-plugin/plugin.json`)
- bundle compatibili con Claude (`.claude-plugin/plugin.json` o il layout predefinito dei componenti Claude)
- bundle compatibili con Cursor (`.cursor-plugin/plugin.json`)

Le installazioni locali gestite devono essere directory Plugin o archivi. I file Plugin
`.js`, `.mjs`, `.cjs` e `.ts` standalone non vengono copiati nella root Plugin
gestita da `plugins install`; elencali invece esplicitamente in `plugins.load.paths`.

<Note>
I bundle compatibili vengono installati nella normale root Plugin e partecipano allo stesso flusso list/info/enable/disable. Oggi sono supportati Skills dei bundle, command-skills Claude, default Claude `settings.json`, default Claude `.lsp.json` / `lspServers` dichiarati nel manifest, command-skills Cursor e directory hook Codex compatibili; altre capability dei bundle rilevate vengono mostrate in diagnostica/info ma non sono ancora collegate all'esecuzione runtime.
</Note>

### Elenco

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  Mostra solo i Plugin abilitati.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Passa dalla vista tabellare a righe di dettaglio per Plugin con metadati di sorgente/origine/versione/attivazione.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario leggibile da macchina più diagnostica del registry e stato di installazione delle dipendenze del pacchetto.
</ParamField>

<Note>
`plugins list` legge prima il registry locale persistito dei Plugin, con un fallback derivato solo dal manifest quando il registry manca o non è valido. È utile per controllare se un Plugin è installato, abilitato e visibile alla pianificazione dell'avvio a freddo, ma non è una sonda runtime live di un processo Gateway già in esecuzione. Dopo aver modificato codice del Plugin, abilitazione, policy hook o `plugins.load.paths`, riavvia il Gateway che serve il canale prima di aspettarti che nuovo codice `register(api)` o hook vengano eseguiti. Per distribuzioni remote/container, verifica di riavviare il vero figlio `openclaw gateway run`, non solo un processo wrapper.

`plugins list --json` include il `dependencyStatus` di ciascun Plugin da
`dependencies` e `optionalDependencies` in `package.json`. OpenClaw controlla se
quei nomi di pacchetto sono presenti lungo il normale percorso di lookup
`node_modules` di Node del Plugin; non importa codice runtime del Plugin, non
esegue un package manager e non ripara dipendenze mancanti.
</Note>

Se i log di avvio mostrano `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
esegui `openclaw plugins list --enabled --verbose` o
`openclaw plugins inspect <id>` con un id Plugin elencato per confermare gli id
dei Plugin e copiare gli id attendibili in `plugins.allow` in `openclaw.json`. Quando
l'avviso può elencare ogni Plugin rilevato, stampa uno snippet
`plugins.allow` pronto da incollare che include già quegli id. Se un Plugin viene caricato
senza provenienza di installazione/percorso di caricamento, ispeziona quell'id Plugin, quindi
blocca l'id attendibile in `plugins.allow` oppure reinstalla il Plugin da una sorgente attendibile
così OpenClaw registra la provenienza dell'installazione.

`plugins search` è una ricerca remota nel catalogo ClawHub. Non ispeziona lo
stato locale, non modifica la config, non installa pacchetti e non carica codice
runtime del Plugin. I risultati di ricerca includono il nome del pacchetto ClawHub,
famiglia, canale, versione, riepilogo e un suggerimento di installazione come
`openclaw plugins install clawhub:<package>`.

Per il lavoro su Plugin in bundle dentro un'immagine Docker pacchettizzata, monta con bind la
directory sorgente del Plugin sopra il percorso sorgente pacchettizzato corrispondente, come
`/app/extensions/synology-chat`. OpenClaw rileverà quell'overlay sorgente montato
prima di `/app/dist/extensions/synology-chat`; una semplice directory sorgente copiata
resta inerte, così le normali installazioni pacchettizzate continuano a usare il dist compilato.

Per il debug degli hook runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hook registrati e diagnostica da un passaggio di ispezione con modulo caricato. L'ispezione runtime non installa mai dipendenze; usa `openclaw doctor --fix` per pulire lo stato legacy delle dipendenze o recuperare Plugin scaricabili mancanti referenziati dalla config.
- `openclaw gateway status --deep --require-rpc` conferma URL/profilo Gateway raggiungibile, suggerimenti su servizio/processo, percorso config e salute RPC.
- Gli hook di conversazione non in bundle (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) richiedono `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` per evitare di copiare una directory Plugin locale (aggiunge a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

I file Plugin standalone devono essere elencati in `plugins.load.paths` invece di
essere installati con `plugins install` o collocati direttamente in `~/.openclaw/extensions`
o `<workspace>/.openclaw/extensions`. Queste root rilevate automaticamente caricano
pacchetti Plugin o directory bundle, mentre i file script di primo livello vengono
trattati come helper locali e saltati.

<Note>
I Plugin originati dal workspace rilevati da una radice extensions del workspace non vengono
importati o eseguiti finché non vengono abilitati esplicitamente. Per lo sviluppo locale,
esegui `openclaw plugins enable <plugin-id>` oppure imposta
`plugins.entries.<plugin-id>.enabled: true`; se la tua configurazione usa
`plugins.allow`, includi anche lì lo stesso id del Plugin. Questa regola
di chiusura in caso di errore si applica anche quando la configurazione del canale punta esplicitamente a un Plugin originato dal workspace per il
caricamento solo di configurazione, quindi il codice di configurazione del Plugin di canale locale non verrà eseguito finché quel
Plugin del workspace resta disabilitato o escluso dall'elenco consentito. Le installazioni collegate
e le voci esplicite `plugins.load.paths` seguono la normale policy per la loro
origine Plugin risolta. Vedi
[Configurare la policy dei Plugin](/it/tools/plugin#configure-plugin-policy)
e [Riferimento di configurazione](/it/gateway/configuration-reference#plugins).

`--force` non è supportato con `--link` perché le installazioni collegate riutilizzano il percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Usa `--pin` sulle installazioni npm per salvare la spec esatta risolta (`name@version`) nell'indice dei Plugin gestiti mantenendo non vincolato il comportamento predefinito.
</Note>

### Indice dei Plugin

I metadati di installazione dei Plugin sono stato gestito dalla macchina, non configurazione utente. Installazioni e aggiornamenti li scrivono nel database di stato SQLite condiviso sotto la directory di stato OpenClaw attiva. La riga `installed_plugin_index` archivia metadati durevoli `installRecords`, inclusi record per manifest Plugin rotti o mancanti, più una cache del registro cold derivata dal manifest usata da `openclaw plugins update`, disinstallazione, diagnostica e dal registro Plugin cold.

Quando OpenClaw vede record legacy rilasciati `plugins.installs` nella configurazione, le letture runtime li trattano come input di compatibilità senza riscrivere `openclaw.json`. Le scritture esplicite dei Plugin e `openclaw doctor --fix` spostano quei record nell'indice dei Plugin e rimuovono la chiave di configurazione quando le scritture di configurazione sono consentite; se una delle due scritture fallisce, i record di configurazione vengono mantenuti così i metadati di installazione non vanno persi.

### Disinstallazione

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` rimuove i record Plugin da `plugins.entries`, dall'indice Plugin persistito, dalle voci degli elenchi allow/deny dei Plugin e dalle voci collegate `plugins.load.paths` quando applicabile. A meno che `--keep-files` sia impostato, la disinstallazione rimuove anche la directory di installazione gestita tracciata quando si trova dentro la radice delle estensioni Plugin di OpenClaw. Per i Plugin di Active Memory, lo slot di memoria viene reimpostato su `memory-core`.

<Note>
`--keep-config` è supportato come alias deprecato di `--keep-files`.
</Note>

### Aggiornamento

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Gli aggiornamenti si applicano alle installazioni Plugin tracciate nell'indice dei Plugin gestiti e alle installazioni hook-pack tracciate in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Risoluzione tra id Plugin e spec npm">
    Quando passi un id Plugin, OpenClaw riutilizza la spec di installazione registrata per quel Plugin. Ciò significa che i dist-tag archiviati in precedenza, come `@beta`, e le versioni esatte vincolate continuano a essere usati nelle esecuzioni successive di `update <id>`.

    Durante `update <id> --dry-run`, le installazioni npm con vincolo esatto restano vincolate. Se OpenClaw riesce anche a risolvere la linea predefinita del registro del pacchetto e quella linea predefinita è più recente della versione vincolata installata, l'esecuzione di prova segnala il vincolo e stampa il comando esplicito di aggiornamento del pacchetto `@latest` per seguire la linea predefinita del registro.

    Questa regola di aggiornamento mirato è diversa dal percorso di manutenzione in blocco `openclaw plugins update --all`. Gli aggiornamenti in blocco rispettano comunque le normali spec di installazione tracciate, ma i record dei Plugin OpenClaw ufficiali attendibili possono sincronizzarsi con il target corrente del catalogo ufficiale invece di restare su un pacchetto ufficiale esatto obsoleto. Usa `update <id>` mirato quando vuoi intenzionalmente mantenere invariata una spec ufficiale esatta o con tag.

    Per le installazioni npm, puoi anche passare una spec esplicita di pacchetto npm con un dist-tag o una versione esatta. OpenClaw risolve il nome del pacchetto verso il record Plugin tracciato, aggiorna quel Plugin installato e registra la nuova spec npm per futuri aggiornamenti basati su id.

    Passare il nome del pacchetto npm senza versione o tag risolve anch'esso verso il record Plugin tracciato. Usa questa opzione quando un Plugin era vincolato a una versione esatta e vuoi riportarlo alla linea di rilascio predefinita del registro.

  </Accordion>
  <Accordion title="Aggiornamenti del canale beta">
    `openclaw plugins update <id-or-npm-spec>` mirato riutilizza la spec Plugin tracciata a meno che tu non passi una nuova spec. `openclaw plugins update --all` in blocco usa `update.channel` configurato quando sincronizza i record dei Plugin ufficiali attendibili con il target del catalogo ufficiale, quindi le installazioni del canale beta possono restare sulla linea di rilascio beta invece di essere normalizzate silenziosamente a stable/latest.

    Anche `openclaw update` conosce il canale di aggiornamento OpenClaw attivo: sul canale beta, i record Plugin npm e ClawHub della linea predefinita provano prima `@beta`. Ripiegano sulla spec default/latest registrata se non esiste alcun rilascio beta del Plugin; i Plugin npm ripiegano anche quando il pacchetto beta esiste ma fallisce la convalida dell'installazione. Quel fallback viene segnalato come avviso e non fa fallire l'aggiornamento core. Versioni esatte e tag espliciti restano vincolati a quel selettore per gli aggiornamenti mirati.

  </Accordion>
  <Accordion title="Controlli di versione e deriva di integrità">
    Prima di un aggiornamento npm live, OpenClaw controlla la versione del pacchetto installato rispetto ai metadati del registro npm. Se la versione installata e l'identità dell'artefatto registrata corrispondono già al target risolto, l'aggiornamento viene saltato senza scaricare, reinstallare o riscrivere `openclaw.json`.

    Quando esiste un hash di integrità archiviato e l'hash dell'artefatto recuperato cambia, OpenClaw lo tratta come deriva dell'artefatto npm. Il comando interattivo `openclaw plugins update` stampa gli hash attesi e effettivi e chiede conferma prima di procedere. Gli helper di aggiornamento non interattivi si chiudono in caso di errore a meno che il chiamante fornisca una policy di continuazione esplicita.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install su update">
    `--dangerously-force-unsafe-install` è accettato anche su `plugins update` per compatibilità, ma è deprecato e non cambia più il comportamento di aggiornamento dei Plugin. L'operatore `security.installPolicy` può ancora bloccare gli aggiornamenti; gli hook Plugin `before_install` si applicano solo nei processi in cui gli hook Plugin sono caricati.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk su update">
    Gli aggiornamenti dei Plugin supportati da ClawHub della community eseguono lo stesso controllo di attendibilità del rilascio esatto delle installazioni prima di scaricare il pacchetto sostitutivo. Usa `--acknowledge-clawhub-risk` per automazioni revisionate che devono continuare quando il rilascio ClawHub selezionato ha un avviso di attendibilità rischioso. I pacchetti ClawHub ufficiali e le sorgenti Plugin OpenClaw incluse aggirano questo prompt di attendibilità del rilascio.
  </Accordion>
</AccordionGroup>

### Ispezione

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect mostra identità, stato di caricamento, origine, capability del manifest, flag di policy, diagnostica, metadati di installazione, capability del bundle e qualsiasi supporto server MCP o LSP rilevato senza importare per impostazione predefinita il runtime Plugin. L'output JSON include i contratti del manifest Plugin, come `contracts.agentToolResultMiddleware` e `contracts.trustedToolPolicies`, così gli operatori possono verificare le dichiarazioni di superficie attendibile prima di abilitare o riavviare un Plugin. Aggiungi `--runtime` per caricare il modulo Plugin e includere hook, strumenti, comandi, servizi, metodi Gateway e route HTTP registrati. L'ispezione runtime segnala direttamente le dipendenze Plugin mancanti; installazioni e riparazioni restano in `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

I comandi CLI posseduti dai Plugin sono solitamente installati come gruppi di comandi root `openclaw`, ma i Plugin possono anche registrare comandi annidati sotto un padre core come `openclaw nodes`. Dopo che `inspect --runtime` mostra un comando sotto `cliCommands`, eseguilo nel percorso elencato; ad esempio un Plugin che registra `demo-git` può essere verificato con `openclaw demo-git ping`.

Ogni Plugin viene classificato in base a ciò che registra effettivamente a runtime:

- **plain-capability** — un tipo di capability (ad es. un Plugin solo provider)
- **hybrid-capability** — più tipi di capability (ad es. testo + voce + immagini)
- **hook-only** — solo hook, nessuna capability o superficie
- **non-capability** — strumenti/comandi/servizi ma nessuna capability

Vedi [Forme dei Plugin](/it/plugins/architecture#plugin-shapes) per ulteriori informazioni sul modello di capability.

<Note>
Il flag `--json` produce un report leggibile dalla macchina adatto a script e audit. `inspect --all` renderizza una tabella dell'intera flotta con colonne per forma, tipi di capability, avvisi di compatibilità, capability del bundle e riepilogo degli hook. `info` è un alias di `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` segnala errori di caricamento dei Plugin, diagnostica di manifest/discovery, avvisi di compatibilità e riferimenti obsoleti nella configurazione dei Plugin, come slot Plugin mancanti. Quando l'albero di installazione e la configurazione Plugin sono puliti stampa `No plugin issues detected.` Se resta configurazione obsoleta ma l'albero di installazione è altrimenti sano, il riepilogo lo indica invece di implicare la piena salute dei Plugin.

Se un Plugin configurato è presente su disco ma bloccato dai controlli di sicurezza dei percorsi del loader, la convalida della configurazione mantiene la voce Plugin e la segnala come `present but blocked`. Correggi la diagnostica precedente del Plugin bloccato, come proprietà del percorso o permessi world-writable, invece di rimuovere la configurazione `plugins.entries.<id>` o `plugins.allow`.

Per errori di forma del modulo, come export `register`/`activate` mancanti, riesegui con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` per includere un riepilogo compatto della forma degli export nell'output diagnostico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Il registro Plugin locale è il modello di lettura cold persistito di OpenClaw per identità dei Plugin installati, abilitazione, metadati di origine e proprietà dei contributi. Avvio normale, lookup del proprietario provider, classificazione della configurazione del canale e inventario dei Plugin possono leggerlo senza importare moduli runtime Plugin.

Usa `plugins registry` per controllare se il registro persistito è presente, corrente o obsoleto. Usa `--refresh` per ricostruirlo dall'indice Plugin persistito, dalla policy di configurazione e dai metadati di manifest/pacchetto. Questo è un percorso di riparazione, non un percorso di attivazione runtime.

`openclaw doctor --fix` ripara anche la deriva npm gestita adiacente al registro: se un pacchetto `@openclaw/*` orfano o recuperato sotto un progetto npm Plugin gestito o la radice npm gestita piatta legacy oscura un Plugin incluso, doctor rimuove quel pacchetto obsoleto e ricostruisce il registro così l'avvio convalida rispetto al manifest incluso. Doctor ricollega anche il pacchetto host `openclaw` nei Plugin npm gestiti che dichiarano `peerDependencies.openclaw`, così gli import runtime locali al pacchetto come `openclaw/plugin-sdk/*` si risolvono dopo aggiornamenti o riparazioni npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` è uno switch di compatibilità break-glass deprecato per errori di lettura del registro. Preferisci `plugins registry --refresh` o `openclaw doctor --fix`; il fallback env serve solo per il ripristino di emergenza dell'avvio mentre la migrazione viene distribuita.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

L'elenco del marketplace accetta un percorso di marketplace locale, un percorso `marketplace.json`, una forma abbreviata GitHub come `owner/repo`, un URL di repository GitHub o un URL git. `--json` stampa l'etichetta dell'origine risolta più il manifest del marketplace analizzato e le voci dei plugin.

L'aggiornamento del marketplace carica un feed del marketplace OpenClaw ospitato e salva la
risposta convalidata come snapshot locale del feed ospitato. Senza opzioni, usa
il profilo di feed predefinito configurato. Usa `--feed-profile <name>` per aggiornare un
profilo configurato specifico, `--feed-url <url>` per aggiornare un URL di feed
ospitato esplicito, `--expected-sha256 <sha256>` per richiedere un checksum del payload
corrispondente (`sha256:<hex>` o un digest esadecimale semplice di 64 caratteri) e `--json` per
l'output leggibile da macchina. Gli URL espliciti dei feed ospitati non devono includere
credenziali, stringhe di query o frammenti. Gli aggiornamenti non vincolati possono riportare uno
snapshot ospitato o un risultato di fallback in bundle senza far fallire il comando. Gli aggiornamenti
vincolati falliscono a meno che non accettino un payload ospitato fresco, e gli aggiornamenti ospitati
riusciti falliscono se OpenClaw non riesce a salvare lo snapshot convalidato.

## Correlati

- [Creazione di plugin](/it/plugins/building-plugins)
- [Riferimento CLI](/it/cli)
- [ClawHub](/it/clawhub)
