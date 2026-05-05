---
read_when:
    - Modifica del comportamento di aggiornamento, doctor, accettazione dei pacchetti o installazione dei Plugin di OpenClaw
    - Preparazione o approvazione di una versione candidata al rilascio
    - Debug di regressioni nell'aggiornamento dei pacchetti, nella pulizia delle dipendenze dei Plugin o nell'installazione dei Plugin
sidebarTitle: Update and plugin tests
summary: Come OpenClaw convalida i percorsi di aggiornamento, le migrazioni dei pacchetti e il comportamento di installazione/aggiornamento dei Plugin
title: 'Test: aggiornamenti e Plugin'
x-i18n:
    generated_at: "2026-05-05T06:17:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19ae526d3daa8a1b67cb2f74225138b3e1fa192c9f956c9dd6d0e407581b9ed9
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Questa è la checklist dedicata alla convalida degli aggiornamenti e dei plugin. L'obiettivo è
semplice: dimostrare che il pacchetto installabile può aggiornare lo stato reale degli utenti, riparare lo stato
legacy obsoleto tramite `doctor` e continuare a installare, caricare, aggiornare e disinstallare
plugin dalle sorgenti supportate.

Per la mappa più ampia dei runner di test, vedi [Test](/it/help/testing). Per le chiavi dei provider live
e le suite che toccano la rete, vedi [Test live](/it/help/testing-live).

## Cosa proteggiamo

I test di aggiornamento e dei plugin proteggono questi contratti:

- Un tarball del pacchetto è completo, ha un `dist/postinstall-inventory.json` valido
  e non dipende da file del repository non estratti.
- Un utente può passare da un pacchetto pubblicato più vecchio al pacchetto candidato
  senza perdere configurazione, agenti, sessioni, workspace, allowlist dei plugin o
  configurazione dei canali.
- `openclaw doctor --fix --non-interactive` possiede i percorsi di pulizia e riparazione
  legacy. L'avvio non dovrebbe accumulare migrazioni di compatibilità nascoste per lo stato
  obsoleto dei plugin.
- Le installazioni dei plugin funzionano da directory locali, repository git, pacchetti npm e dal
  percorso del registro ClawHub.
- Le dipendenze npm dei plugin vengono installate nella radice npm gestita, analizzate prima
  della fiducia e rimosse tramite npm durante la disinstallazione, così le dipendenze innalzate non
  restano.
- L'aggiornamento dei plugin è stabile quando non è cambiato nulla: record di installazione, sorgente
  risolta, layout delle dipendenze installate e stato abilitato restano intatti.

## Prova locale durante lo sviluppo

Inizia in modo mirato:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Per modifiche a installazione, disinstallazione, dipendenze o inventario del pacchetto dei plugin, esegui anche
i test mirati che coprono il punto modificato:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Prima che qualunque lane Docker di pacchetto consumi un tarball, dimostra l'artefatto del pacchetto:

```bash
pnpm release:check
```

`release:check` esegue controlli di deriva di configurazione/docs/API, scrive l'inventario dist del pacchetto,
esegue `npm pack --dry-run`, rifiuta file impacchettati vietati, installa
il tarball in un prefisso temporaneo, esegue postinstall e fa uno smoke test degli entrypoint dei canali
inclusi.

## Lane Docker

Le lane Docker sono la prova a livello di prodotto. Installano o aggiornano un pacchetto reale
dentro container Linux e verificano il comportamento tramite comandi CLI,
avvio del Gateway, probe HTTP, stato RPC e stato del filesystem.

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

- `test:docker:plugins` convalida lo smoke test di installazione dei plugin, le installazioni da cartella locale,
  il comportamento di salto dell'aggiornamento per cartelle locali, le cartelle locali con dipendenze
  preinstallate, le installazioni di pacchetti `file:`, le installazioni git con esecuzione CLI, gli aggiornamenti di riferimenti git
  mobili, le installazioni da registro npm con dipendenze transitive
  innalzate, i no-op degli aggiornamenti npm, le installazioni da fixture ClawHub locale e i no-op di aggiornamento,
  il comportamento di aggiornamento del marketplace e abilita/ispeziona del bundle Claude. Imposta
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per mantenere il blocco ClawHub ermetico/offline.
- `test:docker:plugin-lifecycle-matrix` installa il pacchetto candidato in un container
  vuoto, esegue un plugin npm attraverso installazione, ispezione, disabilitazione, abilitazione,
  upgrade esplicito, downgrade esplicito e disinstallazione dopo aver eliminato il codice del plugin.
  Registra metriche RSS e CPU per ogni fase.
- `test:docker:plugin-update` convalida che un plugin installato invariato non
  venga reinstallato né perda i metadati di installazione durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` installa il tarball candidato sopra una fixture
  di vecchio utente sporca, esegue l'aggiornamento del pacchetto più doctor non interattivo, poi avvia
  un Gateway in loopback e controlla la conservazione dello stato.
- `test:docker:published-upgrade-survivor` prima installa una baseline pubblicata,
  la configura tramite una ricetta `openclaw config set` incorporata, la aggiorna al
  tarball candidato, esegue doctor, controlla la pulizia legacy, avvia il Gateway e
  sonda `/healthz`, `/readyz` e lo stato RPC.
- `test:docker:update-restart-auth` installa il pacchetto candidato, avvia un
  Gateway gestito con autenticazione token, annulla le variabili d'ambiente di autenticazione gateway del chiamante per
  `openclaw update --yes --json` e richiede al comando di aggiornamento candidato di
  riavviare il Gateway prima dei probe normali.
- `test:docker:update-migration` è la lane di aggiornamento pubblicato con pulizia intensiva. Parte
  da uno stato utente configurato in stile Discord/Telegram, esegue il doctor della baseline
  così le dipendenze dei plugin configurati hanno la possibilità di materializzarsi, semina
  residui di dipendenze plugin legacy per un plugin pacchettizzato configurato, aggiorna al
  tarball candidato e richiede al doctor post-aggiornamento di rimuovere le radici delle dipendenze
  legacy.

Varianti utili del survivor di aggiornamento pubblicato:

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
modellati su problemi segnalati, inclusa la migrazione di installazione dei plugin configurati.

La migrazione completa degli aggiornamenti è intenzionalmente separata dalla Full Release CI. Usa il
workflow manuale `Update Migration` quando la domanda di release è "ogni
release stabile pubblicata da 2026.4.23 in poi può aggiornarsi a questo candidato e
ripulire i residui delle dipendenze dei plugin?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance è il gate GitHub-native per i pacchetti. Risolve un pacchetto candidato
in un tarball `package-under-test`, registra versione e SHA-256, poi
esegue lane Docker E2E riutilizzabili contro quel tarball esatto. L'harness del workflow
ref è separato dal ref della sorgente del pacchetto, così la logica di test corrente può convalidare
release attendibili più vecchie.

Sorgenti candidate:

- `source=npm`: convalida `openclaw@beta`, `openclaw@latest` o una versione
  pubblicata esatta.
- `source=ref`: impacchetta un branch, tag o commit attendibile con l'harness corrente
  selezionato.
- `source=url`: convalida un tarball HTTPS con `package_sha256` richiesto.
- `source=artifact`: riusa un tarball caricato da un'altra esecuzione di Actions.

Full Release Validation usa `source=artifact` per impostazione predefinita, costruito dallo
SHA di release risolto. Per la prova post-pubblicazione, passa
`package_acceptance_package_spec=openclaw@YYYY.M.D` così la stessa matrice di upgrade
punta invece al pacchetto npm distribuito.

I controlli di release chiamano Package Acceptance con il set package/update/restart/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Quando il soak di release è abilitato, passano anche:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Questo mantiene migrazione del pacchetto, cambio del canale di aggiornamento, pulizia delle dipendenze
plugin obsolete, copertura offline dei plugin, comportamento di aggiornamento dei plugin e QA del pacchetto Telegram
sullo stesso artefatto risolto senza far percorrere al gate predefinito del pacchetto di release
ogni release pubblicata.

`last-stable-4` si risolve nelle quattro release stabili OpenClaw più recenti pubblicate su npm.
La package acceptance di release fissa `2026.4.23` come primo confine di compatibilità
per l'aggiornamento dei plugin, `2026.5.2` come confine di churn dell'architettura plugin e
`2026.4.15` come baseline di aggiornamento pubblicato più vecchia della serie 2026.4.1x; il resolver
deduplica i pin già presenti nelle quattro più recenti. Per una copertura esaustiva della migrazione degli
aggiornamenti pubblicati, usa `all-since-2026.4.23` nel workflow Update
Migration separato invece della Full Release CI. `release-history` resta
disponibile per campionamenti manuali più ampi quando vuoi anche l'ancora legacy precedente alla data.

Quando sono selezionate più baseline del survivor di aggiornamento pubblicato, il workflow Docker
riutilizzabile suddivide ogni baseline nel proprio job runner mirato. Ogni
shard di baseline esegue comunque il set di scenari selezionato, ma log e artefatti restano
per baseline e il tempo totale è limitato dallo shard più lento invece che da un grande
job seriale.

Esegui manualmente un profilo di pacchetto quando convalidi un candidato prima della release:

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
pulizia di cron/subagenti, ricerca web OpenAI o OpenWebUI. Usa `suite_profile=full`
solo quando ti serve copertura Docker completa del percorso di release.

## Valore predefinito per la release

Per i candidati di release, lo stack di prova predefinito è:

1. `pnpm check:changed` e `pnpm test:changed` per regressioni a livello di sorgente.
2. `pnpm release:check` per l'integrità dell'artefatto del pacchetto.
3. Il profilo `package` di Package Acceptance o le lane di pacchetto personalizzate dei release-check
   per i contratti di installazione/aggiornamento/riavvio/plugin.
4. Controlli di release cross-OS per comportamento specifico di sistema operativo di installer, onboarding e piattaforma.
5. Suite live solo quando la superficie modificata tocca il comportamento di provider o servizi ospitati.

Sulle macchine dei manutentori, i gate ampi e la prova di prodotto Docker/pacchetto dovrebbero essere eseguiti
in Testbox salvo quando si sta facendo esplicitamente prova locale.

## Compatibilità legacy

La tolleranza di compatibilità è ristretta e limitata nel tempo:

- I pacchetti fino a `2026.4.25`, inclusi `2026.4.25-beta.*`, possono tollerare
  lacune nei metadati del pacchetto già distribuite in Package Acceptance.
- Il pacchetto pubblicato `2026.4.26` può avvisare per file di marcatura dei metadati di build locale
  già distribuiti.
- I pacchetti successivi devono soddisfare i contratti moderni. Le stesse lacune falliscono invece di
  generare avvisi o essere saltate.

Non aggiungere nuove migrazioni di avvio per queste vecchie forme. Aggiungi o estendi una riparazione
doctor, poi dimostrala con `upgrade-survivor`, `published-upgrade-survivor` o
`update-restart-auth` quando il comando di aggiornamento possiede il riavvio.

## Aggiungere copertura

Quando modifichi il comportamento di aggiornamento o dei plugin, aggiungi copertura al livello più basso che
può fallire per la ragione corretta:

- Logica pura di percorso o metadati: unit test accanto alla sorgente.
- Inventario del pacchetto o comportamento dei file impacchettati: test `package-dist-inventory` o del controllore
  tarball.
- Comportamento CLI di installazione/aggiornamento: asserzione o fixture di lane Docker.
- Comportamento di migrazione da release pubblicata: scenario `published-upgrade-survivor`.
- Comportamento di riavvio posseduto dall'aggiornamento: `update-restart-auth`.
- Comportamento di sorgente registro/pacchetto: fixture `test:docker:plugins` o server fixture ClawHub.
- Comportamento di layout o pulizia delle dipendenze: verifica sia l'esecuzione runtime sia il
  confine del filesystem. Le dipendenze npm possono essere innalzate sotto la radice npm
  gestita, quindi i test dovrebbero dimostrare che la radice viene analizzata/pulita invece di presumere un
  albero `node_modules` locale al pacchetto.

Mantieni le nuove fixture Docker ermetiche per impostazione predefinita. Usa registri fixture locali e
pacchetti falsi salvo quando lo scopo del test è il comportamento del registro live.

## Triage degli errori

Inizia dall'identità dell'artefatto:

- Riepilogo `resolve_package` di Accettazione del pacchetto: origine, versione, SHA-256 e
  nome dell'artefatto.
- Artefatti Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, log delle corsie e comandi di riesecuzione.
- Riepilogo della sopravvivenza all'upgrade: `.artifacts/upgrade-survivor/summary.json`,
  inclusi versione di riferimento, versione candidata, scenario, tempi delle fasi e
  passaggi della ricetta.

Preferisci rieseguire l'esatta corsia non riuscita con lo stesso artefatto del pacchetto invece di
rieseguire l'intero ombrello di rilascio.
