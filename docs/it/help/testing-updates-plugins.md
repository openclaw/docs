---
read_when:
    - Modifica del comportamento di aggiornamento, doctor, accettazione dei pacchetti o installazione dei Plugin di OpenClaw
    - Preparazione o approvazione di una versione candidata al rilascio
    - Debug del processo di aggiornamento dei pacchetti, della pulizia delle dipendenze dei plugin o delle regressioni nell'installazione dei plugin
sidebarTitle: Update and plugin tests
summary: Come OpenClaw convalida i percorsi di aggiornamento, le migrazioni dei pacchetti e il comportamento di installazione/aggiornamento dei plugin
title: 'Test: aggiornamenti e plugin'
x-i18n:
    generated_at: "2026-07-12T07:08:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e930960b5819d2144467476cb473e62f236eca63e1d9941a6bc793b484e731c
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Checklist per la convalida di aggiornamenti e plugin: dimostrare che il pacchetto installabile può
aggiornare lo stato reale dell'utente, riparare lo stato legacy obsoleto tramite `doctor` e continuare
a installare, caricare, aggiornare e disinstallare plugin da ogni origine supportata.

Per la panoramica generale degli strumenti di esecuzione dei test, vedere [Test](/it/help/testing). Per le chiavi
dei provider live e le suite che accedono alla rete, vedere [Test live](/it/help/testing-live).

## Cosa proteggiamo

- Un tarball del pacchetto è completo, dispone di un file `dist/postinstall-inventory.json`
  valido e non dipende da file del repository non inclusi nel pacchetto.
- Un utente può passare da un pacchetto pubblicato meno recente al pacchetto candidato
  senza perdere configurazione, agenti, sessioni, aree di lavoro, elenchi di plugin consentiti o
  configurazione dei canali.
- `openclaw doctor --fix --non-interactive` gestisce i percorsi di pulizia e riparazione
  legacy. L'avvio non deve introdurre migrazioni di compatibilità nascoste per lo stato
  obsoleto dei plugin.
- Le installazioni dei plugin funzionano da directory locali, repository git, pacchetti npm e dal
  percorso del registro ClawHub.
- Le dipendenze npm dei plugin vengono installate in un singolo progetto npm gestito per ogni plugin,
  sottoposte a scansione prima di essere considerate attendibili e rimosse tramite `npm uninstall` durante
  la disinstallazione del plugin, affinché le dipendenze elevate di livello non rimangano presenti.
- L'aggiornamento dei plugin non esegue alcuna operazione quando non è cambiato nulla: record di installazione, origine
  risolta, struttura delle dipendenze installate e stato di abilitazione rimangono invariati.

## Verifica locale durante lo sviluppo

Iniziare con controlli mirati:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Per modifiche all'installazione, alla disinstallazione, alle dipendenze o all'inventario del pacchetto dei plugin, eseguire anche
i test mirati che coprono il punto di integrazione modificato:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Prima che qualsiasi percorso Docker del pacchetto utilizzi un tarball, verificare l'artefatto del pacchetto:

```bash
pnpm release:check
```

`release:check` esegue i controlli di divergenza di configurazione/documentazione/API (schema di configurazione, baseline della documentazione
di configurazione, baseline ed esportazioni dell'API SDK dei plugin, versioni/inventario dei plugin),
scrive l'inventario della distribuzione del pacchetto, esegue `npm pack --dry-run`, rifiuta i file
vietati inclusi nel pacchetto, installa il tarball in un prefisso temporaneo, esegue il post-installazione e
verifica sommariamente i punti di ingresso dei canali inclusi.

## Percorsi Docker

I percorsi Docker costituiscono la verifica a livello di prodotto. Installano o aggiornano un
pacchetto reale all'interno di container Linux e verificano il comportamento tramite comandi CLI,
avvio del Gateway, sonde HTTP, stato RPC e stato del file system.

Durante le iterazioni, utilizzare percorsi mirati:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Percorsi importanti:

- `test:docker:plugins` copre la verifica preliminare dell'installazione dei plugin, le installazioni da cartelle locali,
  il comportamento di esclusione dell'aggiornamento per le cartelle locali, le cartelle locali con
  dipendenze preinstallate, le installazioni di pacchetti `file:`, le installazioni git con esecuzione della CLI, gli aggiornamenti
  git dei riferimenti mobili, le installazioni dal registro npm con dipendenze transitive
  elevate di livello, gli aggiornamenti npm senza operazioni, il rifiuto dei metadati non validi dei pacchetti npm,
  le installazioni da fixture ClawHub locale e gli aggiornamenti senza operazioni, il comportamento degli aggiornamenti del marketplace
  e l'abilitazione/ispezione del bundle Claude. Impostare `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per
  mantenere il blocco ClawHub ermetico/offline.
- `test:docker:plugin-lifecycle-matrix` installa il pacchetto candidato in un container
  vuoto ed esegue per un plugin npm le operazioni di installazione, ispezione, disabilitazione, abilitazione,
  aggiornamento esplicito, downgrade esplicito e disinstallazione dopo l'eliminazione del codice
  del plugin. Registra le metriche RSS e CPU per ogni fase.
- `test:docker:plugin-update` verifica che un plugin installato e invariato non venga
  reinstallato e non perda i metadati di installazione durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` installa il tarball candidato su una fixture
  di un vecchio utente con stato non pulito, esegue l'aggiornamento del pacchetto insieme a doctor non interattivo, quindi avvia
  un Gateway local loopback e verifica la conservazione dello stato.
- `test:docker:published-upgrade-survivor` installa prima una baseline pubblicata,
  la configura tramite una procedura `openclaw config set` incorporata, la aggiorna al
  tarball candidato, esegue doctor, verifica la pulizia legacy, avvia il Gateway e
  interroga `/healthz`, `/readyz` e lo stato RPC.
- `test:docker:update-restart-auth` installa il pacchetto candidato, avvia un
  Gateway gestito con autenticazione tramite token, rimuove dall'ambiente l'autenticazione del Gateway del chiamante per
  `openclaw update --yes --json` e richiede che il comando di aggiornamento candidato
  riavvii il Gateway prima delle normali sonde.
- `test:docker:update-migration` è il percorso di aggiornamento pubblicato con pulizia intensiva. Parte
  da uno stato utente configurato in stile Discord/Telegram, esegue doctor sulla baseline
  affinché le dipendenze dei plugin configurati possano essere materializzate, inserisce
  residui legacy delle dipendenze dei plugin per un plugin distribuito e configurato, esegue l'aggiornamento al
  tarball candidato e richiede che doctor, dopo l'aggiornamento, rimuova le radici delle dipendenze
  legacy.

Varianti utili del percorso di sopravvivenza agli aggiornamenti pubblicati:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Scenari disponibili: `base`, `acpx-openclaw-tools-bridge`, `feishu-channel`,
`bootstrap-persona`, `channel-post-core-restore`, `plugin-deps-cleanup`,
`configured-plugin-installs`, `stale-source-plugin-shadow`, `tilde-log-path`
e `versioned-runtime-deps`. Nelle esecuzioni aggregate, `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`
(alias `far-reaching`) si espande a tutti gli scenari, inclusa la migrazione
dell'installazione dei plugin configurati.

La migrazione completa degli aggiornamenti è intenzionalmente separata dalla CI completa di rilascio. Utilizzare il
workflow manuale `Update Migration` quando la domanda relativa al rilascio è: «ogni
versione stabile pubblicata a partire dalla 2026.4.23 può aggiornarsi a questo candidato e
ripulire i residui delle dipendenze dei plugin?»:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Accettazione del pacchetto

L'accettazione del pacchetto è il controllo del pacchetto nativo di GitHub. Risolve un pacchetto
candidato in un tarball `package-under-test`, ne registra la versione e il valore SHA-256, quindi
esegue percorsi E2E Docker riutilizzabili su quel tarball esatto. Il riferimento
dell'infrastruttura del workflow è separato dal riferimento dell'origine del pacchetto, quindi la logica di test corrente può convalidare
versioni attendibili meno recenti.

Origini candidate:

- `source=npm`: convalida `openclaw@extended-stable`, `openclaw@beta`,
  `openclaw@latest` o una versione pubblicata esatta.
- `source=ref`: crea il pacchetto da un ramo, tag o commit attendibile con l'infrastruttura corrente
  selezionata.
- `source=url`: convalida un tarball HTTPS pubblico con `package_sha256` obbligatorio.
  Questo percorso rifiuta credenziali negli URL, porte HTTPS non predefinite, nomi host o risultati
  DNS/IP privati/interni, spazi di indirizzi IP per usi speciali e reindirizzamenti non sicuri.
- `source=trusted-url`: convalida un tarball HTTPS con `package_sha256`
  e `trusted_source_id` obbligatori secondo la policy gestita dai manutentori
  in `.github/package-trusted-sources.json`. Utilizzare questa opzione per mirror aziendali/privati
  invece di indebolire `source=url` con un'opzione di input che consenta risorse private.
  L'autenticazione bearer, quando configurata dalla policy, utilizza il secret fisso
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.
- `source=artifact`: riutilizza un tarball caricato da un'altra esecuzione di Actions.

La convalida completa del rilascio utilizza `source=artifact` per impostazione predefinita, generato dallo
SHA del rilascio risolto. Per la verifica successiva alla pubblicazione, passare
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH`, affinché la stessa matrice di aggiornamento
utilizzi invece il pacchetto npm distribuito.

I controlli di rilascio invocano l'accettazione del pacchetto con l'insieme pacchetto/aggiornamento/riavvio/plugin:

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

Quando il collaudo prolungato del rilascio è abilitato (obbligatorio per `release_profile=stable` e
`full`), passano anche:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Ciò mantiene la migrazione del pacchetto, il cambio del canale di aggiornamento, la tolleranza dei plugin gestiti
danneggiati, la pulizia delle dipendenze obsolete dei plugin, la copertura offline dei plugin, il comportamento
di aggiornamento dei plugin e la QA del pacchetto Telegram sullo stesso artefatto risolto, senza
obbligare il controllo predefinito del pacchetto di rilascio a esaminare ogni versione pubblicata.

`last-stable-4` viene risolto nelle quattro versioni stabili più recenti di OpenClaw
pubblicate su npm. L'accettazione del pacchetto di rilascio fissa `2026.4.23` come primo limite di
compatibilità degli aggiornamenti dei plugin, `2026.5.2` come limite per le modifiche sostanziali all'architettura dei plugin e
`2026.4.15` come baseline precedente per gli aggiornamenti pubblicati della serie 2026.4.1x; il risolutore
elimina i duplicati delle versioni fissate già incluse nelle quattro più recenti. Per una copertura esaustiva
della migrazione degli aggiornamenti pubblicati, utilizzare `all-since-2026.4.23` nel workflow separato
Update Migration invece della CI completa di rilascio. `release-history` resta
disponibile per un campionamento manuale più ampio quando si desidera includere anche il riferimento legacy
precedente alla data.

Quando vengono selezionate più baseline per la sopravvivenza agli aggiornamenti pubblicati, il workflow Docker
riutilizzabile suddivide ogni baseline in un processo di esecuzione mirato separato. Ogni
partizione della baseline esegue comunque l'insieme di scenari selezionato, ma log e artefatti rimangono
separati per baseline e la durata complessiva è limitata dalla partizione più lenta, anziché da un unico grande
processo seriale.

Eseguire manualmente un profilo del pacchetto durante la convalida di un candidato prima del rilascio:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines="last-stable-4 2026.4.23 2026.5.2 2026.4.15" \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Per un canary extended-stable pubblicato, impostare
`package_spec=openclaw@extended-stable`. L'accettazione del pacchetto risolve tale
selettore in un tarball esatto prima dell'esecuzione dei percorsi Docker.

Utilizzare `suite_profile=product` quando la domanda relativa al rilascio include canali MCP,
pulizia di cron/sottoagenti, ricerca web OpenAI o OpenWebUI. Utilizzare `suite_profile=full`
solo quando è necessaria la copertura completa del percorso di rilascio Docker.

## Impostazione predefinita del rilascio

Per i candidati al rilascio, la sequenza di verifica predefinita è:

1. `pnpm check:changed` e `pnpm test:changed` per le regressioni a livello di sorgente.
2. `pnpm release:check` per l'integrità dell'artefatto del pacchetto.
3. Il profilo `package` dell'accettazione del pacchetto o i percorsi personalizzati del pacchetto
   per il controllo del rilascio, per verificare i contratti di installazione/aggiornamento/riavvio/plugin.
4. Controlli di rilascio multipiattaforma per il programma di installazione specifico del sistema operativo, l'onboarding e il comportamento
   della piattaforma.
5. Suite live solo quando la superficie modificata riguarda il comportamento del provider o del servizio
   ospitato.

Sui computer dei manutentori, i controlli estesi e la verifica del prodotto Docker/pacchetto devono essere eseguiti
in Testbox, salvo quando si esegue esplicitamente una verifica locale.

## Compatibilità legacy

La tolleranza di compatibilità è limitata e vincolata nel tempo:

- I pacchetti fino alla versione `2026.4.25`, inclusi quelli `2026.4.25-beta.*`, possono tollerare
  lacune nei metadati del pacchetto già distribuite nell'accettazione del pacchetto.
- Il pacchetto `2026.4.26` pubblicato può generare avvisi per file di marcatura dei metadati
  della build locale già distribuiti.
- I pacchetti successivi devono soddisfare i contratti moderni. Le stesse lacune causano un errore anziché
  un avviso o un'esclusione.

Non aggiungere nuove migrazioni all'avvio per questi formati obsoleti. Aggiungere o estendere una riparazione di doctor,
quindi verificarla con `upgrade-survivor`, `published-upgrade-survivor` o
`update-restart-auth` quando il comando di aggiornamento è responsabile del riavvio.

## Aggiunta della copertura

Quando si modifica il comportamento degli aggiornamenti o dei plugin, aggiungere la copertura al livello più basso che
può produrre un errore per il motivo corretto:

- Logica pura relativa a percorsi o metadati: test unitario accanto al sorgente.
- Inventario del pacchetto o comportamento dei file impacchettati: test di verifica `package-dist-inventory` o del tarball.
- Comportamento di installazione/aggiornamento della CLI: asserzione o fixture della corsia Docker.
- Comportamento della migrazione delle versioni pubblicate: scenario `published-upgrade-survivor`.
- Comportamento di riavvio gestito dall'aggiornamento: `update-restart-auth`.
- Comportamento dell'origine del registro/pacchetto: fixture `test:docker:plugins` o server di fixture ClawHub.
- Layout delle dipendenze o comportamento di pulizia: verificare sia l'esecuzione in fase di runtime sia il confine del filesystem. Le dipendenze npm possono essere sollevate all'interno del progetto npm gestito del plugin, quindi i test devono dimostrare che tale progetto viene analizzato/ripulito, anziché presupporre esclusivamente l'albero `node_modules` locale del pacchetto del plugin.

Per impostazione predefinita, mantenere ermetiche le nuove fixture Docker. Utilizzare registri di fixture locali e pacchetti fittizi, a meno che lo scopo del test non sia verificare il comportamento del registro in tempo reale.

## Analisi degli errori

Iniziare dall'identità dell'artefatto:

- Riepilogo `resolve_package` di Package Acceptance: origine, versione, SHA-256 e nome dell'artefatto.
- Artefatti Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log delle corsie e comandi di riesecuzione.
- Riepilogo della sopravvivenza all'aggiornamento: `.artifacts/upgrade-survivor/summary.json`, inclusi versione di riferimento, versione candidata, scenario, tempi delle fasi e copertura delle procedure di configurazione.

Preferire la riesecuzione dell'esatta corsia non riuscita con lo stesso artefatto del pacchetto, anziché rieseguire l'intero insieme di test della versione.
