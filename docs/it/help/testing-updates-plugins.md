---
read_when:
    - Modificare il comportamento di aggiornamento, doctor, accettazione dei pacchetti o installazione dei Plugin di OpenClaw
    - Preparazione o approvazione di una versione candidata al rilascio
    - Debug delle regressioni nell'aggiornamento dei pacchetti, nella pulizia delle dipendenze dei Plugin o nell'installazione dei Plugin
sidebarTitle: Update and plugin tests
summary: Come OpenClaw convalida i percorsi di aggiornamento, le migrazioni dei pacchetti e il comportamento di installazione/aggiornamento dei Plugin
title: 'Test: aggiornamenti e Plugin'
x-i18n:
    generated_at: "2026-05-06T08:54:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: db3790bb8c6b952458342727f3e326f9610b4d8155889dfdadb143e3ef07aa46
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Questa è la checklist dedicata alla validazione degli aggiornamenti e dei plugin. L'obiettivo è
semplice: dimostrare che il pacchetto installabile può aggiornare lo stato reale degli utenti,
riparare lo stato legacy obsoleto tramite `doctor` e continuare a installare, caricare,
aggiornare e disinstallare plugin dalle sorgenti supportate.

Per la mappa più ampia del test runner, consulta [Test](/it/help/testing). Per le chiavi dei
provider live e le suite che toccano la rete, consulta [Test live](/it/help/testing-live).

## Cosa proteggiamo

I test di aggiornamento e dei plugin proteggono questi contratti:

- Un tarball del pacchetto è completo, ha un `dist/postinstall-inventory.json`
  valido e non dipende da file del repository non impacchettati.
- Un utente può passare da un pacchetto pubblicato precedente al pacchetto candidato
  senza perdere configurazione, agenti, sessioni, workspace, allowlist dei plugin o
  configurazione dei canali.
- `openclaw doctor --fix --non-interactive` è responsabile dei percorsi di pulizia e
  riparazione legacy. L'avvio non dovrebbe accumulare migrazioni di compatibilità
  nascoste per lo stato obsoleto dei plugin.
- Le installazioni dei plugin funzionano da directory locali, repository git, pacchetti npm e
  dal percorso del registro ClawHub.
- Le dipendenze npm dei plugin vengono installate nella root npm gestita, scansionate prima
  dell'attendibilità e rimosse tramite npm durante la disinstallazione, così le dipendenze
  hoistate non restano in giro.
- L'aggiornamento dei plugin è stabile quando non è cambiato nulla: record di installazione,
  sorgente risolta, layout delle dipendenze installate e stato abilitato restano intatti.

## Prova locale durante lo sviluppo

Inizia in modo mirato:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Per modifiche a installazione, disinstallazione, dipendenze o inventario dei pacchetti dei
plugin, esegui anche i test mirati che coprono il punto modificato:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Prima che qualsiasi lane Docker del pacchetto consumi un tarball, verifica l'artefatto del pacchetto:

```bash
pnpm release:check
```

`release:check` esegue controlli di deriva su configurazione/docs/API, scrive l'inventario
dist del pacchetto, esegue `npm pack --dry-run`, rifiuta file impacchettati vietati, installa
il tarball in un prefisso temporaneo, esegue postinstall e fa smoke test degli entrypoint
dei canali inclusi.

## Lane Docker

Le lane Docker sono la prova a livello di prodotto. Installano o aggiornano un pacchetto reale
dentro container Linux e verificano il comportamento tramite comandi CLI, avvio del Gateway,
probe HTTP, stato RPC e stato del filesystem.

Usa lane mirate durante l'iterazione:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Lane importanti:

- `test:docker:plugins` valida lo smoke test di installazione plugin, le installazioni da cartella locale,
  il comportamento di salto dell'aggiornamento per cartelle locali, le cartelle locali con
  dipendenze preinstallate, le installazioni di pacchetti `file:`, le installazioni git con
  esecuzione CLI, gli aggiornamenti di riferimenti git mobili, le installazioni da registro npm con
  dipendenze transitive hoistate, i no-op dell'aggiornamento npm, le installazioni da fixture
  ClawHub locale e i no-op di aggiornamento, il comportamento di aggiornamento del marketplace
  e l'abilitazione/ispezione del bundle Claude. Imposta
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per mantenere il blocco ClawHub ermetico/offline.
- `test:docker:plugin-lifecycle-matrix` installa il pacchetto candidato in un container nudo,
  fa passare un plugin npm attraverso installazione, ispezione, disabilitazione, abilitazione,
  upgrade esplicito, downgrade esplicito e disinstallazione dopo aver eliminato il codice del plugin.
  Registra metriche RSS e CPU per ogni fase.
- `test:docker:plugin-update` valida che un plugin installato invariato non venga reinstallato
  e non perda metadati di installazione durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` installa il tarball candidato sopra una fixture sporca di un vecchio utente,
  esegue l'aggiornamento del pacchetto più doctor non interattivo, quindi avvia un Gateway
  loopback e controlla la conservazione dello stato.
- `test:docker:published-upgrade-survivor` installa prima una baseline pubblicata,
  la configura tramite una ricetta `openclaw config set` incorporata, la aggiorna al
  tarball candidato, esegue doctor, controlla la pulizia legacy, avvia il Gateway e
  sonda `/healthz`, `/readyz` e lo stato RPC.
- `test:docker:update-restart-auth` installa il pacchetto candidato, avvia un Gateway gestito
  con autenticazione token, rimuove dall'ambiente del chiamante l'autenticazione Gateway per
  `openclaw update --yes --json` e richiede che il comando di aggiornamento candidato
  riavvii il Gateway prima dei normali probe.
- `test:docker:update-migration` è la lane di aggiornamento pubblicato più intensa in termini di pulizia. Parte
  da uno stato utente configurato in stile Discord/Telegram, esegue doctor sulla baseline
  così le dipendenze dei plugin configurati hanno una possibilità di materializzarsi, semina
  residui legacy delle dipendenze di plugin per un plugin pacchettizzato configurato, aggiorna al
  tarball candidato e richiede che il doctor post-aggiornamento rimuova le root legacy
  delle dipendenze.

Varianti utili di published-upgrade survivor:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Gli scenari disponibili sono `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path` e `versioned-runtime-deps`. Nelle esecuzioni aggregate,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` si espande a tutti gli scenari
modellati sui problemi segnalati, inclusa la migrazione di installazione dei plugin configurati.

La migrazione completa degli aggiornamenti è intenzionalmente separata dalla CI Full Release. Usa il
workflow manuale `Update Migration` quando la domanda di release è "ogni release stabile
pubblicata dalla 2026.4.23 in poi può aggiornarsi a questo candidato e ripulire i residui
delle dipendenze dei plugin?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Accettazione del pacchetto

Accettazione del pacchetto è il gate pacchetto nativo di GitHub. Risolve un pacchetto candidato
in un tarball `package-under-test`, registra versione e SHA-256, quindi esegue lane Docker E2E
riutilizzabili contro esattamente quel tarball. Il ref dell'harness del workflow è separato
dal ref della sorgente del pacchetto, quindi la logica di test corrente può validare
release attendibili più vecchie.

Sorgenti candidate:

- `source=npm`: valida `openclaw@beta`, `openclaw@latest` o una versione pubblicata
  esatta.
- `source=ref`: impacchetta un branch, tag o commit attendibile con l'harness corrente
  selezionato.
- `source=url`: valida un tarball HTTPS con `package_sha256` richiesto.
- `source=artifact`: riusa un tarball caricato da un'altra esecuzione di Actions.

Full Release Validation usa `source=artifact` per impostazione predefinita, costruito dallo
SHA di release risolto. Per la prova post-pubblicazione, passa
`package_acceptance_package_spec=openclaw@YYYY.M.D` così la stessa matrice di upgrade
punta invece al pacchetto npm distribuito.

I controlli di release chiamano Accettazione del pacchetto con il set package/update/restart/plugin:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Quando il soak di release è abilitato, passano anche:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Questo mantiene migrazione del pacchetto, cambio del canale di aggiornamento, tolleranza ai managed-plugin
corrotti, pulizia delle dipendenze obsolete dei plugin, copertura plugin offline,
comportamento di aggiornamento dei plugin e QA del pacchetto Telegram sullo stesso artefatto risolto
senza far percorrere al gate pacchetto di release predefinito ogni release pubblicata.

`last-stable-4` si risolve nelle quattro release OpenClaw stabili più recenti pubblicate su npm.
L'accettazione del pacchetto di release fissa `2026.4.23` come primo confine di compatibilità
per l'aggiornamento dei plugin, `2026.5.2` come confine di churn dell'architettura dei plugin e
`2026.4.15` come baseline di aggiornamento pubblicato più vecchia della serie 2026.4.1x; il resolver
deduplica i pin che sono già nelle ultime quattro. Per una copertura esaustiva della migrazione
degli aggiornamenti pubblicati, usa `all-since-2026.4.23` nel workflow Update
Migration separato invece della CI Full Release. `release-history` resta
disponibile per un campionamento manuale più ampio quando vuoi anche l'ancora legacy
precedente alla data.

Quando sono selezionate più baseline published-upgrade survivor, il workflow Docker riutilizzabile
suddivide ogni baseline in un proprio job runner mirato. Ogni shard di baseline esegue comunque
il set di scenari selezionato, ma log e artefatti restano per baseline e il tempo totale è
limitato dallo shard più lento invece che da un grande job seriale.

Esegui manualmente un profilo pacchetto quando validi un candidato prima della release:

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

Usa `suite_profile=product` quando la domanda di release include canali MCP,
pulizia cron/subagent, ricerca web OpenAI o OpenWebUI. Usa `suite_profile=full`
solo quando hai bisogno della copertura Docker completa del percorso di release.

## Predefinito di release

Per i candidati di release, lo stack di prova predefinito è:

1. `pnpm check:changed` e `pnpm test:changed` per regressioni a livello sorgente.
2. `pnpm release:check` per l'integrità dell'artefatto del pacchetto.
3. Profilo `package` di Accettazione del pacchetto o lane pacchetto personalizzate di release-check
   per i contratti di installazione/aggiornamento/riavvio/plugin.
4. Controlli di release cross-OS per installer, onboarding e comportamento di piattaforma
   specifici del sistema operativo.
5. Suite live solo quando la superficie modificata tocca il comportamento di provider o servizi
   ospitati.

Sulle macchine dei maintainer, i gate ampi e la prova di prodotto Docker/pacchetto dovrebbero essere eseguiti
in Testbox salvo prova locale esplicita.

## Compatibilità legacy

La tolleranza di compatibilità è stretta e limitata nel tempo:

- I pacchetti fino a `2026.4.25`, inclusi `2026.4.25-beta.*`, possono tollerare
  lacune nei metadati del pacchetto già distribuite in Accettazione del pacchetto.
- Il pacchetto `2026.4.26` pubblicato può emettere un avviso per file di stamp dei metadati
  di build locali già distribuiti.
- I pacchetti successivi devono soddisfare i contratti moderni. Le stesse lacune falliscono invece di
  generare avvisi o venire saltate.

Non aggiungere nuove migrazioni all'avvio per queste vecchie forme. Aggiungi o estendi una riparazione
doctor, quindi dimostrala con `upgrade-survivor`, `published-upgrade-survivor` o
`update-restart-auth` quando il comando di aggiornamento è responsabile del riavvio.

## Aggiunta di copertura

Quando modifichi il comportamento di aggiornamento o dei plugin, aggiungi copertura al livello più basso che
può fallire per il motivo corretto:

- Logica pura di percorso o metadati: unit test accanto al sorgente.
- Inventario del pacchetto o comportamento dei file impacchettati: test `package-dist-inventory` o del
  verificatore di tarball.
- Comportamento CLI di installazione/aggiornamento: asserzione o fixture di lane Docker.
- Comportamento di migrazione da release pubblicata: scenario `published-upgrade-survivor`.
- Comportamento di riavvio posseduto dall'aggiornamento: `update-restart-auth`.
- Comportamento di sorgente registro/pacchetto: fixture `test:docker:plugins` o server fixture
  ClawHub.
- Comportamento di layout o pulizia delle dipendenze: asserisci sia l'esecuzione runtime sia il
  confine del filesystem. Le dipendenze npm possono essere hoistate sotto la root npm gestita,
  quindi i test dovrebbero dimostrare che la root viene scansionata/pulita invece di assumere un albero
  `node_modules` locale al pacchetto.

Mantieni le nuove fixture Docker ermetiche per impostazione predefinita. Usa registri fixture locali e
pacchetti finti salvo quando lo scopo del test è il comportamento live del registro.

## Triage dei fallimenti

Inizia dall'identità dell'artefatto:

- Riepilogo di Package Acceptance `resolve_package`: origine, versione, SHA-256 e
  nome dell'artefatto.
- Artefatti Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, log delle lane e comandi di riesecuzione.
- Riepilogo dei superstiti dell'upgrade: `.artifacts/upgrade-survivor/summary.json`,
  inclusi versione di riferimento, versione candidata, scenario, tempi delle fasi e
  passaggi della ricetta.

Preferisci rieseguire la lane esatta non riuscita con lo stesso artefatto del pacchetto invece di
rieseguire l'intero ombrello di release.
