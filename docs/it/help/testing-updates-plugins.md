---
read_when:
    - Modifica del comportamento di aggiornamento, doctor, accettazione del pacchetto o installazione del Plugin di OpenClaw
    - Preparazione o approvazione di un candidato al rilascio
    - Debug di aggiornamenti dei pacchetti, pulizia delle dipendenze dei Plugin o regressioni nell'installazione dei Plugin
sidebarTitle: Update and plugin tests
summary: Come OpenClaw convalida i percorsi di aggiornamento, le migrazioni dei pacchetti e il comportamento di installazione/aggiornamento dei Plugin
title: 'Test: aggiornamenti e plugin'
x-i18n:
    generated_at: "2026-05-05T01:47:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: e83a847c76f424199b5fccbd9a2b30d0bf01e4f466c4f9822bf7693d1c2ad286
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Questa è la checklist dedicata per la convalida degli aggiornamenti e dei plugin. L'obiettivo è
semplice: dimostrare che il pacchetto installabile può aggiornare lo stato reale dell'utente, riparare lo stato
legacy obsoleto tramite `doctor` e continuare a installare, caricare, aggiornare e disinstallare
plugin dalle fonti supportate.

Per la mappa più ampia del test runner, vedi [Testing](/it/help/testing). Per le chiavi dei provider live
e le suite che toccano la rete, vedi [Testing live](/it/help/testing-live).

## Cosa proteggiamo

I test di aggiornamento e dei plugin proteggono questi contratti:

- Un tarball di pacchetto è completo, ha un `dist/postinstall-inventory.json` valido
  e non dipende da file del repo non inclusi nel pacchetto.
- Un utente può passare da un pacchetto pubblicato precedente al pacchetto candidato
  senza perdere configurazione, agenti, sessioni, workspace, allowlist dei plugin o
  configurazione dei canali.
- `openclaw doctor --fix --non-interactive` possiede i percorsi di pulizia e riparazione
  legacy. L'avvio non dovrebbe accumulare migrazioni di compatibilità nascoste per lo stato
  obsoleto dei plugin.
- Le installazioni dei plugin funzionano da directory locali, repo git, pacchetti npm e dal
  percorso del registro ClawHub.
- Le dipendenze npm dei plugin vengono installate nella root npm gestita, scansionate prima
  della fiducia e rimosse tramite npm durante la disinstallazione, così che le dipendenze hoisted non
  rimangano.
- L'aggiornamento dei plugin è stabile quando non è cambiato nulla: record di installazione, sorgente
  risolta, layout delle dipendenze installate e stato abilitato restano intatti.

## Prova locale durante lo sviluppo

Inizia in modo mirato:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Per modifiche a installazione, disinstallazione, dipendenze o inventario di pacchetto dei plugin, esegui anche
i test mirati che coprono il punto modificato:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Prima che una lane Docker di pacchetto consumi un tarball, verifica l'artefatto del pacchetto:

```bash
pnpm release:check
```

`release:check` esegue controlli di drift di configurazione/docs/API, scrive l'inventario dist del pacchetto,
esegue `npm pack --dry-run`, rifiuta i file vietati inclusi nel pacchetto, installa
il tarball in un prefisso temporaneo, esegue postinstall e fa uno smoke test degli entrypoint dei canali
in bundle.

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
pnpm test:docker:update-migration
```

Lane importanti:

- `test:docker:plugins` convalida smoke test di installazione plugin, installazioni da cartella locale,
  comportamento di skip dell'aggiornamento per cartelle locali, cartelle locali con
  dipendenze preinstallate, installazioni di pacchetti `file:`, installazioni git con esecuzione CLI, aggiornamenti di riferimenti git
  mobili, installazioni da registro npm con dipendenze transitive hoisted, no-op degli aggiornamenti npm, installazioni da fixture ClawHub locale e no-op degli aggiornamenti,
  comportamento di aggiornamento del marketplace e abilitazione/ispezione del bundle Claude. Imposta
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per mantenere il blocco ClawHub ermetico/offline.
- `test:docker:plugin-lifecycle-matrix` installa il pacchetto candidato in un container vuoto,
  esegue un plugin npm attraverso installazione, ispezione, disabilitazione, abilitazione,
  upgrade esplicito, downgrade esplicito e disinstallazione dopo aver eliminato il codice del plugin.
  Registra metriche RSS e CPU per ogni fase.
- `test:docker:plugin-update` verifica che un plugin installato e invariato non
  venga reinstallato né perda metadati di installazione durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` installa il tarball candidato sopra una fixture
  di vecchio utente sporca, esegue l'aggiornamento del pacchetto più doctor non interattivo, poi avvia
  un Gateway local loopback e controlla la preservazione dello stato.
- `test:docker:published-upgrade-survivor` installa prima una baseline pubblicata,
  la configura tramite una ricetta `openclaw config set` incorporata, la aggiorna al
  tarball candidato, esegue doctor, controlla la pulizia legacy, avvia il Gateway e
  interroga `/healthz`, `/readyz` e lo stato RPC.
- `test:docker:update-migration` è la lane di aggiornamento pubblicato a forte componente di pulizia. Parte
  da uno stato utente configurato in stile Discord/Telegram, esegue doctor sulla baseline
  così che le dipendenze dei plugin configurati abbiano la possibilità di materializzarsi, semina
  residui legacy di dipendenze plugin per un plugin pacchettizzato configurato, aggiorna al
  tarball candidato e richiede che doctor post-aggiornamento rimuova le root
  delle dipendenze legacy.

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
modellati su problemi segnalati, inclusa la migrazione di installazione dei plugin configurati.

La migrazione completa degli aggiornamenti è intenzionalmente separata dalla Full Release CI. Usa il
workflow manuale `Update Migration` quando la domanda di release è "ogni
release stabile pubblicata dal 2026.4.23 in poi può aggiornarsi a questo candidato e
ripulire i residui di dipendenze dei plugin?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance è il gate di pacchetto nativo di GitHub. Risolve un pacchetto
candidato in un tarball `package-under-test`, registra versione e SHA-256, poi
esegue lane Docker E2E riutilizzabili contro quel tarball esatto. Il riferimento dell'harness del workflow
è separato dal riferimento sorgente del pacchetto, così la logica di test corrente può convalidare
release affidabili più vecchie.

Sorgenti candidate:

- `source=npm`: convalida `openclaw@beta`, `openclaw@latest` o una versione
  pubblicata esatta.
- `source=ref`: pacchettizza un branch, tag o commit affidabile con l'harness corrente
  selezionato.
- `source=url`: convalida un tarball HTTPS con `package_sha256` richiesto.
- `source=artifact`: riusa un tarball caricato da un'altra esecuzione di Actions.

Full Release Validation usa `source=artifact` per impostazione predefinita, costruito dallo
SHA di release risolto. Per la prova post-pubblicazione, passa
`package_acceptance_package_spec=openclaw@YYYY.M.D` così la stessa matrice di upgrade
punta invece al pacchetto npm distribuito.

I controlli di release chiamano Package Acceptance con il set pacchetto/aggiornamento/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Passano anche:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Questo mantiene migrazione del pacchetto, cambio del canale di aggiornamento, pulizia delle dipendenze
obsolete dei plugin, copertura dei plugin offline, comportamento di aggiornamento dei plugin e QA del pacchetto Telegram
sullo stesso artefatto risolto.

`all-since-2026.4.23` è il campione di upgrade di Full Release CI: ogni release stabile pubblicata su npm da `2026.4.23` fino a `latest`. Per una copertura esaustiva della migrazione
degli aggiornamenti pubblicati, usa `all-since-2026.4.23` nel workflow Update
Migration separato invece della Full Release CI. `release-history` resta
disponibile per campionamenti manuali più ampi quando vuoi includere anche l'ancoraggio legacy precedente alla data.

Esegui manualmente un profilo di pacchetto quando convalidi un candidato prima della release:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=all-since-2026.4.23 \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Usa `suite_profile=product` quando la domanda di release include canali MCP,
pulizia cron/subagent, ricerca web OpenAI o OpenWebUI. Usa `suite_profile=full`
solo quando hai bisogno della copertura Docker completa del percorso di release.

## Impostazione predefinita di release

Per i candidati di release, lo stack di prova predefinito è:

1. `pnpm check:changed` e `pnpm test:changed` per regressioni a livello di sorgente.
2. `pnpm release:check` per l'integrità dell'artefatto del pacchetto.
3. Profilo Package Acceptance `package` o le lane di pacchetto personalizzate dei release-check
   per i contratti di installazione/aggiornamento/plugin.
4. Controlli di release cross-OS per comportamento specifico di OS su installer, onboarding e piattaforma.
5. Suite live solo quando la superficie modificata tocca comportamento di provider o servizi ospitati.

Sulle macchine dei maintainer, i gate ampi e la prova di prodotto Docker/pacchetto dovrebbero essere eseguiti
in Testbox salvo prova locale esplicitamente richiesta.

## Compatibilità legacy

La tolleranza di compatibilità è ristretta e limitata nel tempo:

- I pacchetti fino a `2026.4.25`, inclusi `2026.4.25-beta.*`, possono tollerare
  gap di metadati del pacchetto già distribuiti in Package Acceptance.
- Il pacchetto pubblicato `2026.4.26` può avvisare per file di timbro di metadati
  di build locale già distribuiti.
- I pacchetti successivi devono soddisfare i contratti moderni. Gli stessi gap falliscono invece di
  generare avvisi o essere saltati.

Non aggiungere nuove migrazioni all'avvio per queste vecchie forme. Aggiungi o estendi una riparazione
doctor, poi dimostrala con `upgrade-survivor` o `published-upgrade-survivor`.

## Aggiungere copertura

Quando modifichi il comportamento di aggiornamento o dei plugin, aggiungi copertura al livello più basso che
può fallire per il motivo giusto:

- Logica pura di percorsi o metadati: test unitario accanto al sorgente.
- Inventario del pacchetto o comportamento dei file inclusi: test `package-dist-inventory` o del controllore
  del tarball.
- Comportamento CLI di installazione/aggiornamento: asserzione o fixture di lane Docker.
- Comportamento di migrazione da release pubblicata: scenario `published-upgrade-survivor`.
- Comportamento di registro/sorgente pacchetto: fixture `test:docker:plugins` o server fixture ClawHub.
- Comportamento di layout o pulizia delle dipendenze: asserisci sia l'esecuzione runtime sia il
  confine del filesystem. Le dipendenze npm possono essere hoisted sotto la root npm
  gestita, quindi i test dovrebbero dimostrare che la root viene scansionata/pulita invece di assumere un albero
  `node_modules` locale al pacchetto.

Mantieni le nuove fixture Docker ermetiche per impostazione predefinita. Usa registri fixture locali e
pacchetti finti salvo che lo scopo del test sia il comportamento del registro live.

## Triage dei fallimenti

Inizia dall'identità dell'artefatto:

- Riepilogo Package Acceptance `resolve_package`: sorgente, versione, SHA-256 e
  nome dell'artefatto.
- Artefatti Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, log delle lane e comandi di riesecuzione.
- Riepilogo upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  incluse versione baseline, versione candidata, scenario, tempi delle fasi e
  passaggi della ricetta.

Preferisci rieseguire la lane esatta fallita con lo stesso artefatto di pacchetto invece di
rieseguire l'intero ombrello di release.
