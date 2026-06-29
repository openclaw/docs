---
read_when:
    - Vuoi installare o gestire Plugin Gateway o bundle compatibili
    - Vuoi creare lo scaffolding o convalidare un semplice Plugin strumento
    - Vuoi eseguire il debug degli errori di caricamento dei plugin
sidebarTitle: Plugins
summary: Riferimento CLI per `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-06-28T22:33:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 528a7ead224eab330bc0a83314d205a68c7f814ad336441aee7b19170c105e43
    source_path: cli/plugins.md
    workflow: 16
---

Gestisci Plugin Gateway, pacchetti di hook e bundle compatibili.

<CardGroup cols={2}>
  <Card title="Sistema di Plugin" href="/it/tools/plugin">
    Guida per gli utenti finali all'installazione, all'abilitazione e alla risoluzione dei problemi dei Plugin.
  </Card>
  <Card title="Gestire i Plugin" href="/it/plugins/manage-plugins">
    Esempi rapidi per installazione, elenco, aggiornamento, disinstallazione e pubblicazione.
  </Card>
  <Card title="Bundle di Plugin" href="/it/plugins/bundles">
    Modello di compatibilità dei bundle.
  </Card>
  <Card title="Manifest del Plugin" href="/it/plugins/manifest">
    Campi del manifest e schema di configurazione.
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
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
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

Per indagare su installazioni, ispezioni, disinstallazioni o aggiornamenti del registro lenti, esegui il
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traccia scrive i tempi delle fasi
su stderr e mantiene analizzabile l'output JSON. Vedi [Debugging](/it/help/debugging#plugin-lifecycle-trace).

<Note>
In modalità Nix (`OPENCLAW_NIX_MODE=1`), i mutatori del ciclo di vita dei Plugin sono disabilitati. Usa invece la sorgente Nix per questa installazione al posto di `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` o `plugins disable`; per nix-openclaw, usa il [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) agent-first.
</Note>

<Note>
I Plugin in bundle vengono distribuiti con OpenClaw. Alcuni sono abilitati per impostazione predefinita (ad esempio provider di modelli in bundle, provider vocali in bundle e il Plugin browser in bundle); altri richiedono `plugins enable`.

I Plugin OpenClaw nativi devono distribuire `openclaw.plugin.json` con uno schema JSON inline (`configSchema`, anche se vuoto). I bundle compatibili usano invece i propri manifest di bundle.

`plugins list` mostra `Format: openclaw` o `Format: bundle`. L'output dettagliato di elenco/info mostra anche il sottotipo del bundle (`codex`, `claude` o `cursor`) più le capacità del bundle rilevate.
</Note>

### Autore

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` crea per impostazione predefinita un Plugin strumento TypeScript minimale. Il primo
argomento è l'id del Plugin; passa `--name` per il nome visualizzato. OpenClaw usa
l'id per la directory di output predefinita e per il nome del pacchetto. Gli scaffold per strumenti usano
`defineToolPlugin`.
`plugins build` importa l'entry compilata, legge i suoi metadati statici degli strumenti, scrive
`openclaw.plugin.json` e mantiene allineato `openclaw.extensions` in `package.json`.
`plugins validate` verifica che il manifest generato, i metadati del pacchetto e
l'export dell'entry corrente siano ancora coerenti. Vedi [Plugin strumento](/it/plugins/tool-plugins) per
il flusso di lavoro completo di authoring degli strumenti.

Lo scaffold scrive sorgente TypeScript ma genera i metadati dall'entry compilata
`./dist/index.js`, quindi il flusso di lavoro funziona anche con la CLI pubblicata. Usa
`--entry <path>` quando l'entry non è l'entry predefinita del pacchetto. Usa
`plugins build --check` in CI per fallire quando i metadati generati sono obsoleti senza
riscrivere i file.

### Scaffold del provider

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Gli scaffold per provider creano un Plugin provider generico di testo/modello con cablaggio
della chiave API compatibile con OpenAI, uno script integrato `npm run validate` per `clawhub package
validate`, metadati del pacchetto ClawHub e un workflow GitHub avviato manualmente
per una futura pubblicazione attendibile tramite GitHub Actions OIDC. Gli scaffold per provider
non generano Skills e non usano `openclaw plugins build` o
`openclaw plugins validate`; questi comandi sono destinati al percorso dei metadati generati
dallo scaffold per strumenti.

Prima della pubblicazione, sostituisci l'URL base API segnaposto, il catalogo dei modelli, la rotta della documentazione, il testo delle credenziali e il testo del README con dettagli reali del provider. Usa il
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

I maintainer che testano installazioni in fase di configurazione possono sovrascrivere le sorgenti automatiche di installazione dei Plugin
con variabili d'ambiente protette. Vedi
[Sovrascritture dell'installazione dei Plugin](/it/plugins/install-overrides).

<Warning>
I nomi di pacchetto semplici vengono installati da npm per impostazione predefinita durante il passaggio del lancio, a meno che non corrispondano a un id di Plugin ufficiale. Le specifiche di pacchetto `@openclaw/*` raw che corrispondono a Plugin in bundle usano la copia in bundle distribuita con la build OpenClaw corrente. Usa `npm:<package>` quando vuoi deliberatamente un pacchetto npm esterno. Usa `clawhub:<package>` per ClawHub. Tratta le installazioni dei Plugin come esecuzione di codice. Preferisci versioni fissate.
</Warning>

`plugins search` interroga ClawHub per pacchetti Plugin installabili e stampa
nomi di pacchetti pronti per l'installazione. Cerca pacchetti code-plugin e bundle-plugin,
non Skills. Usa `openclaw skills search` per le Skills ClawHub.

<Note>
ClawHub è la superficie principale di distribuzione e scoperta per la maggior parte dei Plugin. Npm
rimane un fallback supportato e un percorso di installazione diretta. I pacchetti Plugin
`@openclaw/*` di proprietà di OpenClaw sono di nuovo pubblicati su npm; vedi l'elenco corrente
su [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o
[l'inventario dei Plugin](/it/plugins/plugin-inventory). Le installazioni stabili usano `latest`.
Le installazioni e gli aggiornamenti del canale beta preferiscono il dist-tag npm `beta` quando quel tag
è disponibile, poi ripiegano su `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Include di configurazione e riparazione della configurazione non valida">
    Se la tua sezione `plugins` è supportata da un `$include` a file singolo, `plugins install/update/enable/disable/uninstall` scrive in quel file incluso e lascia `openclaw.json` intatto. Include root, array di include e include con override fratelli falliscono in modo chiuso invece di essere appiattiti. Vedi [Include di configurazione](/it/gateway/configuration) per le forme supportate.

    Se la configurazione non è valida durante l'installazione, `plugins install` normalmente fallisce in modo chiuso e ti indica di eseguire prima `openclaw doctor --fix`. Durante l'avvio del Gateway e il ricaricamento a caldo, una configurazione Plugin non valida fallisce in modo chiuso come qualsiasi altra configurazione non valida; `openclaw doctor --fix` può mettere in quarantena la voce Plugin non valida. L'unica eccezione documentata in fase di installazione è un percorso ristretto di recupero per Plugin in bundle per i Plugin che scelgono esplicitamente `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstallazione rispetto ad aggiornamento">
    `--force` riutilizza la destinazione di installazione esistente e sovrascrive sul posto un Plugin o pacchetto di hook già installato. Usalo quando stai reinstallando intenzionalmente lo stesso id da un nuovo percorso locale, archivio, pacchetto ClawHub o artefatto npm. Per gli aggiornamenti di routine di un Plugin npm già tracciato, preferisci `openclaw plugins update <id-or-npm-spec>`.

    Se esegui `plugins install` per un id Plugin già installato, OpenClaw si ferma e ti indirizza a `plugins update <id-or-npm-spec>` per un normale aggiornamento, oppure a `plugins install <package> --force` quando vuoi davvero sovrascrivere l'installazione corrente da una sorgente diversa.

  </Accordion>
  <Accordion title="Ambito di --pin">
    `--pin` si applica solo alle installazioni npm. Non è supportato con installazioni `git:`; usa un riferimento git esplicito come `git:github.com/acme/plugin@v1.2.3` quando vuoi una sorgente fissata. Non è supportato con `--marketplace`, perché le installazioni marketplace persistono metadati della sorgente marketplace invece di una specifica npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` è deprecato e ora è un no-op. OpenClaw non esegue più il blocco integrato del codice pericoloso in fase di installazione per le installazioni dei Plugin.

    Usa la superficie condivisa `security.installPolicy` di proprietà dell'operatore quando è richiesta una policy di installazione specifica dell'host. Gli hook Plugin `before_install` sono hook del ciclo di vita del runtime dei Plugin e non sono il confine principale della policy per le installazioni CLI.

    Se un Plugin che hai pubblicato su ClawHub è nascosto o bloccato da una scansione del registro, usa i passaggi per publisher in [Pubblicazione su ClawHub](/it/clawhub/publishing). `--dangerously-force-unsafe-install` non chiede a ClawHub di riesaminare il Plugin o rendere pubblica una release bloccata.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Le installazioni ClawHub della community controllano il record di attendibilità della release selezionata prima di scaricare il pacchetto. Se ClawHub disabilita il download per la release, segnala risultati di scansione dannosi o mette la release in uno stato di moderazione bloccante come la quarantena, OpenClaw rifiuta la release. Per stati di scansione rischiosi non bloccanti, stati di moderazione rischiosi o motivi del registro, OpenClaw mostra i dettagli di attendibilità e chiede conferma prima di continuare.

    Usa `--acknowledge-clawhub-risk` solo dopo aver esaminato l'avviso ClawHub e aver deciso di continuare senza un prompt interattivo. I record di attendibilità puliti in sospeso o obsoleti avvisano ma non richiedono conferma. I pacchetti ClawHub ufficiali e le sorgenti Plugin OpenClaw in bundle ignorano questo prompt di attendibilità della release.

  </Accordion>
  <Accordion title="Pacchetti di hook e specifiche npm">
    `plugins install` è anche la superficie di installazione per i pacchetti di hook che espongono `openclaw.hooks` in `package.json`. Usa `openclaw hooks` per la visibilità filtrata degli hook e l'abilitazione per singolo hook, non per l'installazione dei pacchetti.

    Le specifiche npm sono **solo registro** (nome del pacchetto + **versione esatta** facoltativa o **dist-tag**). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati. Le installazioni delle dipendenze vengono eseguite in un progetto npm gestito per ciascun plugin con `--ignore-scripts` per sicurezza, anche quando la tua shell ha impostazioni globali di installazione npm. I progetti npm gestiti dei plugin ereditano gli `overrides` npm a livello di pacchetto di OpenClaw, quindi i pin di sicurezza dell'host si applicano anche alle dipendenze dei plugin hoistate.

    Usa `npm:<package>` quando vuoi rendere esplicita la risoluzione npm. Anche le specifiche di pacchetto semplici installano direttamente da npm durante la transizione di lancio, a meno che non corrispondano a un id di plugin ufficiale.

    Le specifiche grezze di pacchetti `@openclaw/*` che corrispondono a plugin inclusi vengono risolte nella copia inclusa di proprietà dell'immagine prima del fallback npm. Per esempio, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` usa il plugin Discord incluso dalla build OpenClaw corrente invece di creare un override npm gestito. Per forzare il pacchetto npm esterno, usa `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Le specifiche semplici e `@latest` restano sul canale stabile. Le versioni correttive OpenClaw con data, come `2026.5.3-1`, sono versioni stabili per questo controllo. Se npm risolve una di queste in una prerelease, OpenClaw si ferma e ti chiede di aderire esplicitamente con un tag di prerelease come `@beta`/`@rc` o una versione di prerelease esatta come `@1.2.3-beta.4`.

    Per le installazioni npm senza una versione esatta (`npm:<package>` o `npm:<package>@latest`), OpenClaw controlla i metadati del pacchetto risolto prima dell'installazione. Se l'ultimo pacchetto stabile richiede un'API plugin OpenClaw più recente o una versione minima dell'host più nuova, OpenClaw esamina le versioni stabili precedenti e installa invece la versione compatibile più recente. Le versioni esatte e i dist-tag espliciti come `@beta` restano rigorosi: se il pacchetto selezionato è incompatibile, il comando fallisce e ti chiede di aggiornare OpenClaw o scegliere una versione compatibile.

    Se una specifica di installazione semplice corrisponde a un id di plugin ufficiale (per esempio `diffs`), OpenClaw installa direttamente la voce del catalogo. Per installare un pacchetto npm con lo stesso nome, usa una specifica scoped esplicita (per esempio `@scope/diffs`).

  </Accordion>
  <Accordion title="Repository Git">
    Usa `git:<repo>` per installare direttamente da un repository git. I formati supportati includono `git:github.com/owner/repo`, `git:owner/repo`, URL di clonazione completi `https://`, `ssh://`, `git://`, `file://` e `git@host:owner/repo.git`. Aggiungi `@<ref>` o `#<ref>` per eseguire il checkout di un branch, tag o commit prima dell'installazione.

    Le installazioni Git clonano in una directory temporanea, eseguono il checkout del ref richiesto quando presente, quindi usano il normale programma di installazione della directory del plugin. Questo significa che la convalida del manifest, la policy di installazione dell'operatore, il lavoro di installazione del gestore di pacchetti e i record di installazione si comportano come nelle installazioni npm. Le installazioni git registrate includono l'URL/ref di origine più il commit risolto, così `openclaw plugins update` può risolvere di nuovo l'origine in seguito.

    Dopo l'installazione da git, usa `openclaw plugins inspect <id> --runtime --json` per verificare le registrazioni runtime come metodi gateway e comandi CLI. Se il plugin ha registrato una root CLI con `api.registerCli`, esegui quel comando direttamente tramite la CLI root di OpenClaw, per esempio `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivi">
    Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Gli archivi di plugin OpenClaw nativi devono contenere un `openclaw.plugin.json` valido nella root del plugin estratta; gli archivi che contengono solo `package.json` vengono rifiutati prima che OpenClaw scriva i record di installazione.

    Usa `npm-pack:<path.tgz>` quando il file è un tarball npm-pack e vuoi
    testare lo stesso percorso di progetto npm gestito per plugin usato dalle
    installazioni da registro, inclusa la verifica di `package-lock.json`, la
    scansione delle dipendenze hoistate e i record di installazione npm. I percorsi
    di archivio semplici vengono comunque installati come archivi locali sotto
    la root delle estensioni dei plugin.

    Sono supportate anche le installazioni dal marketplace Claude.

  </Accordion>
</AccordionGroup>

Le installazioni ClawHub usano un localizzatore esplicito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Le specifiche di plugin semplici compatibili con npm installano da npm per impostazione predefinita durante la transizione di lancio, a meno che non corrispondano a un id di plugin ufficiale:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` per rendere esplicita la risoluzione solo npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controlla l'API plugin pubblicizzata / compatibilità minima del gateway prima dell'installazione. Quando la versione ClawHub selezionata pubblica un artefatto ClawPack, OpenClaw scarica il `.tgz` npm-pack versionato, verifica l'intestazione digest ClawHub e il digest dell'artefatto, quindi lo installa tramite il normale percorso di archivio. Le versioni ClawHub più vecchie senza metadati ClawPack vengono comunque installate tramite il percorso legacy di verifica dell'archivio del pacchetto. Le installazioni registrate conservano i metadati della sorgente ClawHub, il tipo di artefatto, l'integrità npm, lo shasum npm, il nome del tarball e i fatti del digest ClawPack per aggiornamenti successivi.
Le installazioni ClawHub senza versione conservano una specifica registrata senza versione, così `openclaw plugins update` può seguire le versioni ClawHub più recenti; i selettori espliciti di versione o tag come `clawhub:pkg@1.2.3` e `clawhub:pkg@beta` restano fissati a quel selettore.

#### Abbreviazione del marketplace

Usa l'abbreviazione `plugin@marketplace` quando il nome del marketplace esiste nella cache del registro locale di Claude in `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="Sorgenti del marketplace">
    - un nome di marketplace noto a Claude da `~/.claude/plugins/known_marketplaces.json`
    - una root di marketplace locale o un percorso `marketplace.json`
    - un'abbreviazione di repository GitHub come `owner/repo`
    - un URL di repository GitHub come `https://github.com/owner/repo`
    - un URL git

  </Tab>
  <Tab title="Regole per marketplace remoti">
    Per i marketplace remoti caricati da GitHub o git, le voci dei plugin devono restare dentro il repository del marketplace clonato. OpenClaw accetta sorgenti con percorsi relativi da quel repository e rifiuta sorgenti di plugin HTTP(S), con percorso assoluto, git, GitHub e altre sorgenti non basate su percorso dai manifest remoti.
  </Tab>
</Tabs>

Per percorsi locali e archivi, OpenClaw rileva automaticamente:

- plugin OpenClaw nativi (`openclaw.plugin.json`)
- bundle compatibili con Codex (`.codex-plugin/plugin.json`)
- bundle compatibili con Claude (`.claude-plugin/plugin.json` o il layout predefinito dei componenti Claude)
- bundle compatibili con Cursor (`.cursor-plugin/plugin.json`)

Le installazioni locali gestite devono essere directory o archivi di plugin. I file di plugin
autonomi `.js`, `.mjs`, `.cjs` e `.ts` non vengono copiati nella root dei plugin gestiti
da `plugins install`; elencali invece esplicitamente in `plugins.load.paths`.

<Note>
I bundle compatibili vengono installati nella normale root dei plugin e partecipano allo stesso flusso list/info/enable/disable. Oggi sono supportati Skills dei bundle, command-skills Claude, impostazioni predefinite Claude `settings.json`, impostazioni predefinite Claude `.lsp.json` / `lspServers` dichiarati nel manifest, command-skills Cursor e directory hook Codex compatibili; le altre capacità di bundle rilevate vengono mostrate in diagnostica/info ma non sono ancora collegate all'esecuzione runtime.
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
  Mostra solo i plugin abilitati.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Passa dalla vista tabellare a righe di dettaglio per plugin con metadati di sorgente/origine/versione/attivazione.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario leggibile dalla macchina più diagnostica del registro e stato di installazione delle dipendenze del pacchetto.
</ParamField>

<Note>
`plugins list` legge prima il registro locale persistente dei plugin, con un fallback derivato solo dal manifest quando il registro manca o non è valido. È utile per controllare se un plugin è installato, abilitato e visibile alla pianificazione dell'avvio a freddo, ma non è una sonda runtime live di un processo Gateway già in esecuzione. Dopo aver modificato codice del plugin, abilitazione, policy degli hook o `plugins.load.paths`, riavvia il Gateway che serve il canale prima di aspettarti l'esecuzione del nuovo codice `register(api)` o degli hook. Per distribuzioni remote/container, verifica di riavviare il vero figlio `openclaw gateway run`, non solo un processo wrapper.

`plugins list --json` include il `dependencyStatus` di ciascun plugin da `package.json`
`dependencies` e `optionalDependencies`. OpenClaw controlla se quei nomi di pacchetto
sono presenti lungo il normale percorso di lookup Node `node_modules` del plugin; non
importa codice runtime del plugin, non esegue un gestore di pacchetti e non ripara
dipendenze mancanti.
</Note>

Se i log di avvio mostrano `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
esegui `openclaw plugins list --enabled --verbose` o
`openclaw plugins inspect <id>` con un id di plugin elencato per confermare gli
id dei plugin e copiare gli id attendibili in `plugins.allow` in `openclaw.json`. Quando
l'avviso può elencare ogni plugin rilevato, stampa uno snippet
`plugins.allow` pronto da incollare che include già quegli id. Se un plugin viene caricato
senza provenienza di installazione/load-path, ispeziona quell'id di plugin, quindi fissa
l'id attendibile in `plugins.allow` oppure reinstalla il plugin da una sorgente attendibile
così OpenClaw registra la provenienza dell'installazione.

`plugins search` è una ricerca remota nel catalogo ClawHub. Non ispeziona lo
stato locale, non modifica la configurazione, non installa pacchetti e non carica codice runtime
del plugin. I risultati di ricerca includono il nome del pacchetto ClawHub, famiglia, canale,
versione, riepilogo e un suggerimento di installazione come `openclaw plugins install clawhub:<package>`.

Per lavoro su plugin inclusi dentro un'immagine Docker pacchettizzata, monta con bind la directory
sorgente del plugin sopra il percorso sorgente pacchettizzato corrispondente, come
`/app/extensions/synology-chat`. OpenClaw rileverà quell'overlay sorgente montato
prima di `/app/dist/extensions/synology-chat`; una directory sorgente semplicemente copiata
resta inerte, così le normali installazioni pacchettizzate continuano a usare il dist compilato.

Per il debug degli hook runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hook registrati e diagnostica da un passaggio di ispezione con modulo caricato. L'ispezione runtime non installa mai dipendenze; usa `openclaw doctor --fix` per pulire lo stato legacy delle dipendenze o recuperare plugin scaricabili mancanti a cui fa riferimento la configurazione.
- `openclaw gateway status --deep --require-rpc` conferma URL/profilo Gateway raggiungibile, suggerimenti su servizio/processo, percorso di configurazione e salute RPC.
- Gli hook di conversazione non inclusi (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) richiedono `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` per evitare di copiare una directory di plugin locale (aggiunge a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

I file di plugin autonomi devono essere elencati in `plugins.load.paths` invece di
essere installati con `plugins install` o collocati direttamente in `~/.openclaw/extensions`
o `<workspace>/.openclaw/extensions`. Quelle root rilevate automaticamente caricano
directory di pacchetti o bundle di plugin, mentre i file script di primo livello vengono trattati come
helper locali e saltati.

<Note>
I plugin di origine workspace rilevati dalla radice delle extensions di un workspace non vengono importati né eseguiti finché non sono abilitati esplicitamente. Per lo sviluppo locale, esegui `openclaw plugins enable <plugin-id>` oppure imposta `plugins.entries.<plugin-id>.enabled: true`; se la tua configurazione usa `plugins.allow`, includi anche lì lo stesso id del plugin. Questa regola fail-closed si applica anche quando la configurazione del canale punta esplicitamente a un plugin di origine workspace per il caricamento solo di configurazione, quindi il codice di configurazione del plugin di canale locale non verrà eseguito finché quel plugin del workspace rimane disabilitato o escluso dall'allowlist. Le installazioni collegate e le voci esplicite `plugins.load.paths` seguono la policy normale per l'origine del plugin risolta. Consulta
[Configurare la policy dei plugin](/it/tools/plugin#configure-plugin-policy)
e [Riferimento di configurazione](/it/gateway/configuration-reference#plugins).

`--force` non è supportato con `--link` perché le installazioni collegate riutilizzano il percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Usa `--pin` nelle installazioni npm per salvare la spec esatta risolta (`name@version`) nell'indice dei plugin gestiti, mantenendo il comportamento predefinito non fissato.
</Note>

### Indice dei Plugin

I metadati di installazione dei Plugin sono stato gestito dalla macchina, non configurazione utente. Installazioni e aggiornamenti li scrivono nel database di stato SQLite condiviso sotto la directory di stato OpenClaw attiva. La riga `installed_plugin_index` archivia metadati durevoli `installRecords`, inclusi record per manifest di plugin danneggiati o mancanti, più una cache cold del registro derivata dal manifest usata da `openclaw plugins update`, disinstallazione, diagnostica e registro cold dei plugin.

Quando OpenClaw trova record legacy distribuiti `plugins.installs` nella configurazione, le letture runtime li trattano come input di compatibilità senza riscrivere `openclaw.json`. Le scritture esplicite dei plugin e `openclaw doctor --fix` spostano quei record nell'indice dei plugin e rimuovono la chiave di configurazione quando le scritture di configurazione sono consentite; se una delle due scritture fallisce, i record di configurazione vengono mantenuti così i metadati di installazione non vengono persi.

### Disinstallazione

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` rimuove i record dei plugin da `plugins.entries`, l'indice persistente dei plugin, le voci degli elenchi allow/deny dei plugin e le voci collegate `plugins.load.paths` quando applicabile. A meno che `--keep-files` non sia impostato, la disinstallazione rimuove anche la directory di installazione gestita tracciata quando si trova nella radice delle extensions dei plugin di OpenClaw. Per i plugin Active Memory, lo slot di memoria viene reimpostato su `memory-core`.

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

Gli aggiornamenti si applicano alle installazioni di plugin tracciate nell'indice dei plugin gestiti e alle installazioni di hook-pack tracciate in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Risoluzione tra id del plugin e spec npm">
    Quando passi un id di plugin, OpenClaw riutilizza la spec di installazione registrata per quel plugin. Questo significa che i dist-tag archiviati in precedenza, come `@beta`, e le versioni esatte fissate continuano a essere usati nelle esecuzioni successive di `update <id>`.

    Durante `update <id> --dry-run`, le installazioni npm fissate a una versione esatta rimangono fissate. Se OpenClaw riesce anche a risolvere la linea predefinita del registro del pacchetto e quella linea predefinita è più recente della versione fissata installata, la dry run segnala il pin e stampa il comando esplicito di aggiornamento del pacchetto `@latest` per seguire la linea predefinita del registro.

    Questa regola di aggiornamento mirato è diversa dal percorso di manutenzione di massa `openclaw plugins update --all`. Gli aggiornamenti di massa rispettano comunque le normali spec di installazione tracciate, ma i record dei plugin OpenClaw ufficiali attendibili possono sincronizzarsi con il target corrente del catalogo ufficiale invece di rimanere su un pacchetto ufficiale esatto obsoleto. Usa `update <id>` mirato quando vuoi intenzionalmente mantenere invariata una spec ufficiale esatta o con tag.

    Per le installazioni npm, puoi anche passare una spec esplicita di pacchetto npm con un dist-tag o una versione esatta. OpenClaw risolve quel nome di pacchetto tornando al record del plugin tracciato, aggiorna quel plugin installato e registra la nuova spec npm per futuri aggiornamenti basati su id.

    Passare il nome del pacchetto npm senza versione o tag risolve anch'esso al record del plugin tracciato. Usalo quando un plugin era fissato a una versione esatta e vuoi riportarlo alla linea di rilascio predefinita del registro.

  </Accordion>
  <Accordion title="Aggiornamenti del canale beta">
    `openclaw plugins update <id-or-npm-spec>` mirato riutilizza la spec del plugin tracciata a meno che tu non passi una nuova spec. `openclaw plugins update --all` di massa usa `update.channel` configurato quando sincronizza i record dei plugin ufficiali attendibili con il target del catalogo ufficiale, così le installazioni del canale beta possono restare sulla linea di rilascio beta invece di essere normalizzate silenziosamente a stable/latest.

    Anche `openclaw update` conosce il canale di aggiornamento OpenClaw attivo: sul canale beta, i record dei plugin npm e ClawHub sulla linea predefinita provano prima `@beta`. Ripiegano sulla spec default/latest registrata se non esiste alcun rilascio beta del plugin; i plugin npm ripiegano anche quando il pacchetto beta esiste ma fallisce la validazione di installazione. Quel fallback viene segnalato come avviso e non fa fallire l'aggiornamento core. Le versioni esatte e i tag espliciti rimangono fissati a quel selettore per gli aggiornamenti mirati.

  </Accordion>
  <Accordion title="Controlli di versione e deriva di integrità">
    Prima di un aggiornamento npm live, OpenClaw controlla la versione del pacchetto installato rispetto ai metadati del registro npm. Se la versione installata e l'identità dell'artefatto registrata corrispondono già al target risolto, l'aggiornamento viene saltato senza scaricare, reinstallare o riscrivere `openclaw.json`.

    Quando esiste un hash di integrità archiviato e l'hash dell'artefatto recuperato cambia, OpenClaw lo tratta come deriva dell'artefatto npm. Il comando interattivo `openclaw plugins update` stampa gli hash attesi ed effettivi e chiede conferma prima di procedere. Gli helper di aggiornamento non interattivi falliscono in modo chiuso a meno che il chiamante non fornisca una policy di continuazione esplicita.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install su update">
    `--dangerously-force-unsafe-install` è accettato anche su `plugins update` per compatibilità, ma è deprecato e non modifica più il comportamento di aggiornamento dei plugin. `security.installPolicy` dell'operatore può ancora bloccare gli aggiornamenti; gli hook `before_install` dei plugin si applicano solo nei processi in cui gli hook dei plugin sono caricati.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk su update">
    Gli aggiornamenti dei plugin community supportati da ClawHub eseguono lo stesso controllo di attendibilità del rilascio esatto delle installazioni prima di scaricare il pacchetto sostitutivo. Usa `--acknowledge-clawhub-risk` per automazioni revisionate che devono continuare quando il rilascio ClawHub selezionato presenta un avviso di attendibilità rischioso. I pacchetti ClawHub ufficiali e le sorgenti dei plugin OpenClaw in bundle bypassano questo prompt di attendibilità del rilascio.
  </Accordion>
</AccordionGroup>

### Ispezione

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect mostra identità, stato di caricamento, sorgente, capability del manifest, flag di policy, diagnostica, metadati di installazione, capability del bundle ed eventuale supporto server MCP o LSP rilevato senza importare di default il runtime del plugin. L'output JSON include i contratti del manifest del plugin, come `contracts.agentToolResultMiddleware` e `contracts.trustedToolPolicies`, così gli operatori possono verificare le dichiarazioni di superficie attendibile prima di abilitare o riavviare un plugin. Aggiungi `--runtime` per caricare il modulo del plugin e includere hook registrati, strumenti, comandi, servizi, metodi gateway e route HTTP. L'ispezione runtime segnala direttamente le dipendenze mancanti dei plugin; installazioni e riparazioni restano in `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

I comandi CLI posseduti dai plugin sono solitamente installati come gruppi di comandi root `openclaw`, ma i plugin possono anche registrare comandi annidati sotto un genitore core come `openclaw nodes`. Dopo che `inspect --runtime` mostra un comando sotto `cliCommands`, eseguilo nel percorso elencato; per esempio, un plugin che registra `demo-git` può essere verificato con `openclaw demo-git ping`.

Ogni plugin è classificato in base a ciò che registra effettivamente a runtime:

- **plain-capability** — un tipo di capability (per esempio un plugin solo provider)
- **hybrid-capability** — più tipi di capability (per esempio testo + parlato + immagini)
- **hook-only** — solo hook, nessuna capability o superficie
- **non-capability** — strumenti/comandi/servizi ma nessuna capability

Consulta [Forme dei Plugin](/it/plugins/architecture#plugin-shapes) per ulteriori dettagli sul modello delle capability.

<Note>
Il flag `--json` produce un report leggibile dalla macchina adatto a scripting e audit. `inspect --all` renderizza una tabella a livello di flotta con colonne per forma, tipi di capability, avvisi di compatibilità, capability del bundle e riepilogo degli hook. `info` è un alias di `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` segnala errori di caricamento dei plugin, diagnostica di manifest/discovery, avvisi di compatibilità e riferimenti obsoleti alla configurazione dei plugin, come slot di plugin mancanti. Quando l'albero di installazione e la configurazione dei plugin sono puliti, stampa `No plugin issues detected.` Se rimane configurazione obsoleta ma l'albero di installazione è altrimenti sano, il riepilogo lo dice invece di implicare piena salute dei plugin.

Se un plugin configurato è presente su disco ma bloccato dai controlli di sicurezza del percorso del loader, la validazione della configurazione mantiene la voce del plugin e la segnala come `present but blocked`. Correggi la diagnostica precedente del plugin bloccato, come proprietà del percorso o permessi world-writable, invece di rimuovere la configurazione `plugins.entries.<id>` o `plugins.allow`.

Per errori di forma del modulo, come export `register`/`activate` mancanti, riesegui con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` per includere un riepilogo compatto della forma degli export nell'output diagnostico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Il registro locale dei plugin è il modello di lettura cold persistente di OpenClaw per identità dei plugin installati, abilitazione, metadati sorgente e proprietà dei contributi. Avvio normale, lookup del proprietario del provider, classificazione della configurazione del canale e inventario dei plugin possono leggerlo senza importare i moduli runtime dei plugin.

Usa `plugins registry` per ispezionare se il registro persistente è presente, aggiornato o obsoleto. Usa `--refresh` per ricostruirlo dall'indice persistente dei plugin, dalla policy di configurazione e dai metadati manifest/pacchetto. Questo è un percorso di riparazione, non un percorso di attivazione runtime.

`openclaw doctor --fix` ripara anche la deriva npm gestita adiacente al registro: se un pacchetto `@openclaw/*` orfano o recuperato sotto un progetto npm di plugin gestito o la radice npm gestita flat legacy oscura un plugin in bundle, doctor rimuove quel pacchetto obsoleto e ricostruisce il registro così l'avvio valida rispetto al manifest in bundle. Doctor ricollega anche il pacchetto host `openclaw` nei plugin npm gestiti che dichiarano `peerDependencies.openclaw`, così gli import runtime locali al pacchetto come `openclaw/plugin-sdk/*` si risolvono dopo aggiornamenti o riparazioni npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` è uno switch di compatibilità break-glass deprecato per errori di lettura del registro. Preferisci `plugins registry --refresh` o `openclaw doctor --fix`; il fallback env è solo per il recupero di emergenza dell'avvio mentre la migrazione viene distribuita.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

`plugins marketplace entries` elenca le voci dal feed del marketplace OpenClaw configurato. Per impostazione predefinita tenta di usare il feed ospitato e ripiega sull'ultimo snapshot accettato o sui dati inclusi. Usa `--feed-profile <name>` per leggere un profilo configurato specifico, `--feed-url <url>` per leggere un URL esplicito del feed ospitato e `--offline` per leggere l'ultimo snapshot accettato senza recuperare il feed.

`plugins marketplace refresh` aggiorna lo snapshot del feed ospitato configurato e segnala se OpenClaw ha accettato dati ospitati, uno snapshot ospitato o dati di fallback inclusi. Usa `--expected-sha256` quando un chiamante richiede che il comando fallisca a meno che un nuovo payload ospitato non corrisponda a un checksum fissato.

Marketplace `list` accetta un percorso locale del marketplace, un percorso `marketplace.json`, una forma abbreviata GitHub come `owner/repo`, un URL di repository GitHub o un URL git. `--json` stampa l'etichetta della sorgente risolta più il manifest del marketplace analizzato e le voci dei Plugin.

L'aggiornamento del marketplace carica un feed del marketplace OpenClaw ospitato e salva la
risposta validata come snapshot locale del feed ospitato. Senza opzioni, usa
il profilo del feed predefinito configurato. Usa `--feed-profile <name>` per aggiornare un
profilo configurato specifico, `--feed-url <url>` per aggiornare un URL esplicito del
feed ospitato, `--expected-sha256 <sha256>` per richiedere un checksum del payload corrispondente
(`sha256:<hex>` o un digest esadecimale semplice di 64 caratteri) e `--json` per
un output leggibile da macchina. Gli URL espliciti dei feed ospitati non devono includere
credenziali, stringhe di query o frammenti. Gli aggiornamenti senza pin possono segnalare un
risultato di snapshot ospitato o di fallback incluso senza far fallire il comando. Gli aggiornamenti
con pin falliscono a meno che non accettino un nuovo payload ospitato, e gli aggiornamenti ospitati
riusciti falliscono se OpenClaw non riesce a salvare lo snapshot validato.

## Correlati

- [Creazione di Plugin](/it/plugins/building-plugins)
- [Riferimento CLI](/it/cli)
- [ClawHub](/it/clawhub)
