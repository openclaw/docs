---
read_when:
    - Modifica del comportamento di aggiornamento, doctor, accettazione dei pacchetti o installazione dei plugin di OpenClaw
    - Preparare o approvare una versione candidata al rilascio
    - Debug dell'aggiornamento del pacchetto, della pulizia delle dipendenze del Plugin o delle regressioni dell'installazione del Plugin
sidebarTitle: Update and plugin tests
summary: Come OpenClaw convalida i percorsi di aggiornamento, le migrazioni dei pacchetti e il comportamento di installazione/aggiornamento dei Plugin
title: 'Test: aggiornamenti e Plugin'
x-i18n:
    generated_at: "2026-05-02T08:26:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1999106b52d2539a6ee0fd7cd88ebb3515c8726e080d4031d7bf421fb99de36
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Questa è la checklist dedicata per la convalida degli aggiornamenti e dei Plugin. L'obiettivo è
semplice: dimostrare che il pacchetto installabile può aggiornare lo stato reale dell'utente, riparare lo stato
legacy obsoleto tramite `doctor` e continuare a installare, caricare, aggiornare e disinstallare
Plugin dalle fonti supportate.

Per la mappa più ampia del test runner, vedi [Testing](/it/help/testing). Per le chiavi dei provider live
e le suite che toccano la rete, vedi [Testing live](/it/help/testing-live).

## Cosa proteggiamo

I test di aggiornamento e dei Plugin proteggono questi contratti:

- Un tarball di pacchetto è completo, ha un `dist/postinstall-inventory.json` valido
  e non dipende da file del repo non inclusi.
- Un utente può passare da un pacchetto pubblicato più vecchio al pacchetto candidato
  senza perdere configurazione, agenti, sessioni, workspace, allowlist dei Plugin o
  configurazione dei canali.
- `openclaw doctor --fix --non-interactive` possiede i percorsi di pulizia e riparazione
  legacy. L'avvio non dovrebbe accumulare migrazioni di compatibilità nascoste per lo stato
  obsoleto dei Plugin.
- Le installazioni dei Plugin funzionano da directory locali, repo git, pacchetti npm e dal
  percorso del registro ClawHub.
- Le dipendenze npm dei Plugin vengono installate nella root npm gestita, scansionate prima
  della fiducia e rimosse tramite npm durante la disinstallazione, così le dipendenze hoisted non
  restano in giro.
- L'aggiornamento dei Plugin è stabile quando non è cambiato nulla: record di installazione, fonte
  risolta, layout delle dipendenze installate e stato abilitato restano intatti.

## Prova locale durante lo sviluppo

Inizia in modo circoscritto:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Per modifiche a installazione, disinstallazione, dipendenze dei Plugin o inventory del pacchetto, esegui anche
i test mirati che coprono il punto di integrazione modificato:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Prima che qualsiasi lane Docker del pacchetto consumi un tarball, verifica l'artefatto del pacchetto:

```bash
pnpm release:check
```

`release:check` esegue controlli di drift di config/docs/API, scrive l'inventory dist del pacchetto,
esegue `npm pack --dry-run`, rifiuta file vietati inclusi nel pacchetto, installa
il tarball in un prefisso temporaneo, esegue postinstall e fa uno smoke degli entrypoint dei canali
in bundle.

## Lane Docker

Le lane Docker sono la prova a livello di prodotto. Installano o aggiornano un pacchetto reale
dentro container Linux e verificano il comportamento tramite comandi CLI,
avvio del Gateway, probe HTTP, stato RPC e stato del filesystem.

Usa lane mirate durante l'iterazione:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Lane importanti:

- `test:docker:plugins` valida lo smoke dell'installazione dei Plugin, installazioni da cartella locale,
  comportamento di salto dell'aggiornamento da cartella locale, cartelle locali con dipendenze
  preinstallate, installazioni di pacchetti `file:`, installazioni git con esecuzione CLI, aggiornamenti
  git a riferimento mobile, installazioni da registro npm con dipendenze transitive hoisted,
  no-op di aggiornamento npm, installazioni da fixture ClawHub locale e no-op di aggiornamento,
  comportamento di aggiornamento del marketplace e abilitazione/ispezione del bundle Claude. Imposta
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per mantenere il blocco ClawHub ermetico/offline.
- `test:docker:plugin-update` valida che un Plugin installato invariato non venga
  reinstallato né perda metadati di installazione durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` installa il tarball candidato sopra una fixture sporca
  di vecchio utente, esegue l'aggiornamento del pacchetto più doctor non interattivo, poi avvia
  un Gateway su local loopback e controlla la preservazione dello stato.
- `test:docker:published-upgrade-survivor` prima installa una baseline pubblicata,
  la configura tramite una ricetta `openclaw config set` incorporata, la aggiorna al
  tarball candidato, esegue doctor, controlla la pulizia legacy, avvia il Gateway e
  interroga `/healthz`, `/readyz` e lo stato RPC.
- `test:docker:update-migration` è la lane di aggiornamento pubblicato più incentrata sulla pulizia. Parte
  da uno stato utente configurato in stile Discord/Telegram, esegue doctor sulla baseline
  così le dipendenze dei Plugin configurati hanno la possibilità di materializzarsi, semina
  residui legacy di dipendenze dei Plugin per un Plugin pacchettizzato configurato, aggiorna al
  tarball candidato e richiede al doctor post-aggiornamento di rimuovere le root delle dipendenze
  legacy.

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
`plugin-deps-cleanup`, `tilde-log-path` e `versioned-runtime-deps`. Nelle esecuzioni aggregate,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` si espande a tutti gli scenari
modellati sui problemi segnalati.

La migrazione completa degli aggiornamenti è intenzionalmente separata dalla Full Release CI. Usa il
workflow manuale `Update Migration` quando la domanda di release è "ogni
release stabile pubblicata da 2026.4.23 in poi può aggiornarsi a questo candidato e
ripulire i residui delle dipendenze dei Plugin?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance è il gate pacchetto nativo di GitHub. Risolve un pacchetto
candidato in un tarball `package-under-test`, registra versione e SHA-256, poi
esegue lane Docker E2E riutilizzabili contro quello specifico tarball. L'harness del workflow
ref è separato dal ref sorgente del pacchetto, così la logica di test corrente può convalidare
release fidate più vecchie.

Fonti candidate:

- `source=npm`: valida `openclaw@beta`, `openclaw@latest` o una versione
  pubblicata esatta.
- `source=ref`: impacchetta un branch, tag o commit fidato con l'harness corrente
  selezionato.
- `source=url`: valida un tarball HTTPS con `package_sha256` obbligatorio.
- `source=artifact`: riusa un tarball caricato da un'altra esecuzione di Actions.

I controlli di release chiamano Package Acceptance con il set package/update/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Passano anche:

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Questo mantiene migrazione del pacchetto, cambio del canale di aggiornamento, pulizia delle dipendenze
obsolete dei Plugin, copertura dei Plugin offline, comportamento di aggiornamento dei Plugin e QA del pacchetto
Telegram sullo stesso artefatto risolto.

`release-history` è un campione limitato per i controlli di release: ultime sei release stabili,
`2026.4.23` e un'ancora più vecchia precedente alla data. Per una copertura esaustiva della migrazione
degli aggiornamenti pubblicati, usa `all-since-2026.4.23` nel workflow Update Migration
separato invece della Full Release CI.

Esegui manualmente un profilo pacchetto quando convalidi un candidato prima della release:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=release-history \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Usa `suite_profile=product` quando la domanda di release include canali MCP,
pulizia di cron/subagent, ricerca web OpenAI o OpenWebUI. Usa `suite_profile=full`
solo quando ti serve copertura completa del percorso di release Docker.

## Predefinito di release

Per i candidati alla release, lo stack di prova predefinito è:

1. `pnpm check:changed` e `pnpm test:changed` per regressioni a livello sorgente.
2. `pnpm release:check` per l'integrità dell'artefatto del pacchetto.
3. Profilo Package Acceptance `package` o le lane pacchetto personalizzate dei controlli di release
   per i contratti di installazione/aggiornamento/Plugin.
4. Controlli di release cross-OS per installer, onboarding e comportamento di piattaforma
   specifici per OS.
5. Suite live solo quando la superficie modificata tocca il comportamento di provider o servizi
   ospitati.

Sulle macchine dei maintainer, i gate ampi e le prove di prodotto Docker/pacchetto dovrebbero essere eseguiti
in Testbox salvo prova locale esplicita.

## Compatibilità legacy

La tolleranza di compatibilità è stretta e limitata nel tempo:

- I pacchetti fino a `2026.4.25`, incluso `2026.4.25-beta.*`, possono tollerare
  gap nei metadati del pacchetto già rilasciati in Package Acceptance.
- Il pacchetto pubblicato `2026.4.26` può avvisare per file di stamp dei metadati di build
  locali già rilasciati.
- I pacchetti successivi devono soddisfare i contratti moderni. Gli stessi gap falliscono invece di
  generare avvisi o venire saltati.

Non aggiungere nuove migrazioni di avvio per queste vecchie forme. Aggiungi o estendi una riparazione
doctor, poi dimostrala con `upgrade-survivor` o `published-upgrade-survivor`.

## Aggiungere copertura

Quando cambi il comportamento di aggiornamento o dei Plugin, aggiungi copertura al livello più basso che
può fallire per il motivo giusto:

- Logica pura di percorsi o metadati: unit test accanto alla sorgente.
- Comportamento dell'inventory del pacchetto o dei file impacchettati: test `package-dist-inventory` o del checker
  del tarball.
- Comportamento CLI di installazione/aggiornamento: asserzione o fixture della lane Docker.
- Comportamento di migrazione da release pubblicata: scenario `published-upgrade-survivor`.
- Comportamento di registro/fonte pacchetto: fixture `test:docker:plugins` o server fixture ClawHub.
- Comportamento del layout o della pulizia delle dipendenze: verifica sia l'esecuzione runtime sia il
  confine del filesystem. Le dipendenze npm possono essere hoisted sotto la root npm gestita,
  quindi i test dovrebbero dimostrare che la root viene scansionata/pulita invece di assumere un albero
  `node_modules` locale al pacchetto.

Mantieni le nuove fixture Docker ermetiche per impostazione predefinita. Usa registri fixture locali e
pacchetti finti salvo che lo scopo del test sia il comportamento live del registro.

## Triage dei fallimenti

Inizia dall'identità dell'artefatto:

- Riepilogo `resolve_package` di Package Acceptance: fonte, versione, SHA-256 e
  nome dell'artefatto.
- Artefatti Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, log delle lane e comandi di riesecuzione.
- Riepilogo upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  inclusi versione baseline, versione candidata, scenario, tempi delle fasi e
  passaggi della ricetta.

Preferisci rieseguire la lane esatta fallita con lo stesso artefatto del pacchetto invece di
rieseguire l'intero ombrello di release.
