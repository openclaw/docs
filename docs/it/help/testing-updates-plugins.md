---
read_when:
    - Modifica del comportamento di aggiornamento, doctor, accettazione dei pacchetti o installazione dei Plugin di OpenClaw
    - Preparazione o approvazione di una versione candidata al rilascio
    - Debug di aggiornamenti dei pacchetti, pulizia delle dipendenze dei Plugin o regressioni nell'installazione dei Plugin
sidebarTitle: Update and plugin tests
summary: Come OpenClaw convalida i percorsi di aggiornamento, le migrazioni dei pacchetti e il comportamento di installazione/aggiornamento dei Plugin
title: 'Test: aggiornamenti e Plugin'
x-i18n:
    generated_at: "2026-05-03T21:36:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 309ac7785a8d49db241989d28580887d3f6739982108af7148b624082c5f23dd
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Questa è la checklist dedicata per la validazione degli aggiornamenti e dei plugin. L'obiettivo è
semplice: dimostrare che il pacchetto installabile può aggiornare lo stato reale degli utenti, riparare lo stato
legacy obsoleto tramite `doctor` e continuare a installare, caricare, aggiornare e disinstallare
plugin dalle sorgenti supportate.

Per la mappa più ampia del test runner, consulta [Testing](/it/help/testing). Per le chiavi dei provider live
e le suite che toccano la rete, consulta [Testing live](/it/help/testing-live).

## Cosa proteggiamo

I test di aggiornamento e dei plugin proteggono questi contratti:

- Un tarball del pacchetto è completo, ha un `dist/postinstall-inventory.json`
  valido e non dipende da file del repository non impacchettati.
- Un utente può passare da un pacchetto pubblicato precedente al pacchetto candidato
  senza perdere configurazione, agenti, sessioni, workspace, allowlist dei plugin o
  configurazione dei canali.
- `openclaw doctor --fix --non-interactive` possiede i percorsi di pulizia e riparazione
  legacy. L'avvio non dovrebbe accumulare migrazioni di compatibilità nascoste per lo
  stato obsoleto dei plugin.
- Le installazioni dei plugin funzionano da directory locali, repository git, pacchetti npm e dal
  percorso del registro ClawHub.
- Le dipendenze npm dei plugin vengono installate nella root npm gestita, scansionate prima
  della fiducia e rimosse tramite npm durante la disinstallazione, così le dipendenze hoistate non
  restano in giro.
- L'aggiornamento dei plugin è stabile quando non è cambiato nulla: record di installazione, sorgente
  risolta, layout delle dipendenze installate e stato abilitato restano intatti.

## Prova locale durante lo sviluppo

Inizia in modo ristretto:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Per modifiche a installazione, disinstallazione, dipendenze o inventario del pacchetto dei plugin, esegui anche
i test mirati che coprono la giunzione modificata:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Prima che qualsiasi lane Docker del pacchetto consumi un tarball, verifica l'artefatto del pacchetto:

```bash
pnpm release:check
```

`release:check` esegue controlli di drift su configurazione/docs/API, scrive l'inventario dist del pacchetto,
esegue `npm pack --dry-run`, rifiuta file impacchettati vietati, installa
il tarball in un prefisso temporaneo, esegue postinstall ed effettua uno smoke test degli entrypoint
dei canali inclusi.

## Lane Docker

Le lane Docker sono la prova a livello di prodotto. Installano o aggiornano un vero
pacchetto dentro container Linux e verificano il comportamento tramite comandi CLI,
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

- `test:docker:plugins` valida smoke test di installazione dei plugin, installazioni da cartella locale,
  comportamento di skip dell'aggiornamento da cartella locale, cartelle locali con
  dipendenze preinstallate, installazioni di pacchetti `file:`, installazioni git con esecuzione CLI, aggiornamenti di
  ref git mobili, installazioni da registro npm con dipendenze transitive
  hoistate, no-op di aggiornamento npm, installazioni da fixture locale ClawHub e no-op di
  aggiornamento, comportamento di aggiornamento del marketplace e abilitazione/ispezione del bundle Claude. Imposta
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per mantenere il blocco ClawHub ermetico/offline.
- `test:docker:plugin-lifecycle-matrix` installa il pacchetto candidato in un container
  essenziale, fa passare un plugin npm attraverso installazione, ispezione, disabilitazione, abilitazione,
  upgrade esplicito, downgrade esplicito e disinstallazione dopo aver eliminato il codice del plugin.
  Registra metriche RSS e CPU per ogni fase.
- `test:docker:plugin-update` valida che un plugin installato invariato non
  venga reinstallato né perda metadati di installazione durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` installa il tarball candidato sopra una fixture sporca
  di vecchio utente, esegue l'aggiornamento del pacchetto più doctor non interattivo, quindi avvia
  un Gateway loopback e controlla la conservazione dello stato.
- `test:docker:published-upgrade-survivor` installa prima una baseline pubblicata,
  la configura tramite una ricetta `openclaw config set` incorporata, la aggiorna al
  tarball candidato, esegue doctor, controlla la pulizia legacy, avvia il Gateway e
  interroga `/healthz`, `/readyz` e lo stato RPC.
- `test:docker:update-migration` è la lane di aggiornamento pubblicato più centrata sulla pulizia. Parte
  da uno stato utente configurato in stile Discord/Telegram, esegue il doctor della baseline
  così le dipendenze dei plugin configurati hanno la possibilità di materializzarsi, semina
  residui legacy di dipendenze plugin per un plugin pacchettizzato configurato, aggiorna al
  tarball candidato e richiede al doctor post-aggiornamento di rimuovere le root delle dipendenze
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
`plugin-deps-cleanup`, `configured-plugin-installs`, `tilde-log-path` e
`versioned-runtime-deps`. Nelle esecuzioni aggregate,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` si espande a tutti gli scenari
con forma di issue segnalata, inclusa la migrazione di installazione dei plugin configurati.

La migrazione completa degli aggiornamenti è intenzionalmente separata dalla Full Release CI. Usa il
workflow manuale `Update Migration` quando la domanda di release è "ogni
release stabile pubblicata dal 2026.4.23 in poi può aggiornarsi a questo candidato e
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

Package Acceptance è il gate del pacchetto nativo di GitHub. Risolve un pacchetto candidato
in un tarball `package-under-test`, registra versione e SHA-256, quindi
esegue lane Docker E2E riutilizzabili contro quel tarball esatto. Il riferimento dell'harness del workflow
è separato dal riferimento della sorgente del pacchetto, quindi la logica di test attuale può validare
release attendibili più vecchie.

Sorgenti candidate:

- `source=npm`: valida `openclaw@beta`, `openclaw@latest` o una versione
  pubblicata esatta.
- `source=ref`: impacchetta un branch, tag o commit attendibile con l'harness corrente
  selezionato.
- `source=url`: valida un tarball HTTPS con `package_sha256` obbligatorio.
- `source=artifact`: riusa un tarball caricato da un'altra esecuzione di Actions.

Full Release Validation usa `source=artifact` per impostazione predefinita, creato dallo
SHA della release risolto. Per la prova post-pubblicazione, passa
`package_acceptance_package_spec=openclaw@YYYY.M.D` così la stessa matrice di upgrade
punta invece al pacchetto npm distribuito.

I controlli di release chiamano Package Acceptance con l'insieme package/update/plugin:

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
stale dei plugin, copertura offline dei plugin, comportamento di aggiornamento dei plugin e QA del pacchetto Telegram
sullo stesso artefatto risolto.

`all-since-2026.4.23` è il campione di upgrade della Full Release CI: ogni release stabile pubblicata su npm da `2026.4.23` fino a `latest`. Per una copertura esaustiva della migrazione
degli aggiornamenti pubblicati, usa `all-since-2026.4.23` nel workflow Update
Migration separato invece della Full Release CI. `release-history` resta
disponibile per un campionamento manuale più ampio quando vuoi anche l'ancora legacy
precedente alla data.

Esegui manualmente un profilo package quando validi un candidato prima della release:

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
solo quando ti serve una copertura Docker completa del percorso di release.

## Default di release

Per i candidati di release, lo stack di prova predefinito è:

1. `pnpm check:changed` e `pnpm test:changed` per regressioni a livello di sorgente.
2. `pnpm release:check` per l'integrità dell'artefatto del pacchetto.
3. Profilo `package` di Package Acceptance o le lane package personalizzate dei release-check
   per i contratti di installazione/aggiornamento/plugin.
4. Controlli di release cross-OS per installer, onboarding e comportamento della piattaforma
   specifici del sistema operativo.
5. Suite live solo quando la superficie modificata tocca comportamento di provider o servizi
   ospitati.

Sulle macchine dei maintainer, i gate ampi e la prova prodotto Docker/package dovrebbero essere eseguiti
in Testbox salvo prova locale esplicita.

## Compatibilità legacy

La tolleranza di compatibilità è ristretta e a tempo:

- I pacchetti fino a `2026.4.25`, inclusi `2026.4.25-beta.*`, possono tollerare
  gap di metadati del pacchetto già distribuiti in Package Acceptance.
- Il pacchetto pubblicato `2026.4.26` può emettere avvisi per file di stamp dei metadati
  di build locale già distribuiti.
- I pacchetti successivi devono soddisfare i contratti moderni. Gli stessi gap falliscono invece di
  avvisare o saltare.

Non aggiungere nuove migrazioni all'avvio per queste vecchie forme. Aggiungi o estendi una riparazione
doctor, quindi dimostrala con `upgrade-survivor` o `published-upgrade-survivor`.

## Aggiungere copertura

Quando modifichi il comportamento di aggiornamento o dei plugin, aggiungi copertura al livello più basso che
può fallire per la ragione giusta:

- Logica pura di percorso o metadati: unit test accanto al sorgente.
- Comportamento dell'inventario del pacchetto o dei file impacchettati: test `package-dist-inventory` o del checker
  del tarball.
- Comportamento CLI di installazione/aggiornamento: asserzione o fixture della lane Docker.
- Comportamento di migrazione da release pubblicata: scenario `published-upgrade-survivor`.
- Comportamento di sorgente registro/pacchetto: fixture `test:docker:plugins` o server fixture
  ClawHub.
- Comportamento di layout o pulizia delle dipendenze: verifica sia l'esecuzione runtime sia il
  confine del filesystem. Le dipendenze npm possono essere hoistate sotto la root npm
  gestita, quindi i test dovrebbero dimostrare che la root viene scansionata/pulita invece di presumere un albero
  `node_modules` locale al pacchetto.

Mantieni le nuove fixture Docker ermetiche per impostazione predefinita. Usa registri fixture locali e
pacchetti fittizi salvo che lo scopo del test sia il comportamento live del registro.

## Triage degli errori

Inizia dall'identità dell'artefatto:

- Riepilogo `resolve_package` di Package Acceptance: sorgente, versione, SHA-256 e
  nome dell'artefatto.
- Artefatti Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, log delle lane e comandi di riesecuzione.
- Riepilogo di upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  inclusi versione baseline, versione candidata, scenario, tempi di fase e
  passaggi della ricetta.

Preferisci rieseguire la lane esatta fallita con lo stesso artefatto del pacchetto invece di
rieseguire tutto l'ombrello di release.
