---
read_when:
    - Modifica del comportamento di aggiornamento, doctor, accettazione del pacchetto o installazione di Plugin di OpenClaw
    - Preparare o approvare una versione candidata al rilascio
    - Debug dell'aggiornamento del pacchetto, della pulizia delle dipendenze dei Plugin o delle regressioni dell'installazione dei Plugin
sidebarTitle: Update and plugin tests
summary: Come OpenClaw convalida i percorsi di aggiornamento, le migrazioni dei pacchetti e il comportamento di installazione/aggiornamento dei Plugin
title: 'Test: aggiornamenti e plugin'
x-i18n:
    generated_at: "2026-05-02T20:46:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a56e249f565cc23a439142b3332c0a57fd4afe9021b79f644d353946d6d2ffc
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Questa è la checklist dedicata per la validazione di aggiornamenti e plugin. L'obiettivo è
semplice: dimostrare che il pacchetto installabile può aggiornare lo stato reale
dell'utente, riparare lo stato legacy obsoleto tramite `doctor` e continuare a installare,
caricare, aggiornare e disinstallare plugin dalle origini supportate.

Per la mappa più ampia del test runner, consulta [Testing](/it/help/testing). Per le
chiavi dei provider live e le suite che toccano la rete, consulta [Testing live](/it/help/testing-live).

## Cosa proteggiamo

I test di aggiornamento e plugin proteggono questi contratti:

- Un tarball del pacchetto è completo, ha un `dist/postinstall-inventory.json`
  valido e non dipende da file del repo non decompressi.
- Un utente può passare da un pacchetto pubblicato più vecchio al pacchetto candidato
  senza perdere configurazione, agenti, sessioni, workspace, allowlist dei plugin o
  configurazione dei canali.
- `openclaw doctor --fix --non-interactive` possiede i percorsi di pulizia e riparazione
  legacy. L'avvio non dovrebbe far crescere migrazioni di compatibilità nascoste per
  stati plugin obsoleti.
- Le installazioni dei plugin funzionano da directory locali, repo git, pacchetti npm e dal
  percorso del registro ClawHub.
- Le dipendenze npm dei plugin sono installate nella root npm gestita, analizzate prima
  della fiducia e rimosse tramite npm durante la disinstallazione, così le dipendenze
  hoisted non rimangono.
- L'aggiornamento dei plugin è stabile quando non è cambiato nulla: record di installazione,
  origine risolta, layout delle dipendenze installate e stato abilitato restano intatti.

## Prova locale durante lo sviluppo

Inizia in modo mirato:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Per modifiche a installazione, disinstallazione, dipendenze dei plugin o inventario del pacchetto,
esegui anche i test mirati che coprono la seam modificata:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Prima che una lane Docker del pacchetto consumi un tarball, verifica l'artefatto del pacchetto:

```bash
pnpm release:check
```

`release:check` esegue controlli di drift di configurazione/documentazione/API, scrive
l'inventario dist del pacchetto, esegue `npm pack --dry-run`, rifiuta i file vietati
impacchettati, installa il tarball in un prefisso temporaneo, esegue postinstall ed esegue
uno smoke sugli entrypoint dei canali inclusi.

## Lane Docker

Le lane Docker sono la prova a livello prodotto. Installano o aggiornano un pacchetto reale
dentro container Linux e verificano il comportamento tramite comandi CLI, avvio del Gateway,
probe HTTP, stato RPC e stato del filesystem.

Usa lane mirate durante l'iterazione:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Lane importanti:

- `test:docker:plugins` valida lo smoke di installazione dei plugin, installazioni da cartelle locali,
  comportamento di skip dell'aggiornamento per cartelle locali, cartelle locali con dipendenze
  preinstallate, installazioni di pacchetti `file:`, installazioni git con esecuzione CLI, aggiornamenti
  di riferimenti git mobili, installazioni dal registro npm con dipendenze transitive hoisted,
  no-op di aggiornamento npm, installazioni da fixture ClawHub locale e no-op di aggiornamento,
  comportamento di aggiornamento del marketplace e abilitazione/ispezione del bundle Claude. Imposta
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per mantenere il blocco ClawHub ermetico/offline.
- `test:docker:plugin-update` valida che un plugin installato invariato non venga reinstallato
  né perda metadati di installazione durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` installa il tarball candidato sopra una fixture di utente vecchio
  sporca, esegue l'aggiornamento del pacchetto più doctor non interattivo, poi avvia un Gateway
  loopback e controlla la conservazione dello stato.
- `test:docker:published-upgrade-survivor` installa prima una baseline pubblicata, la configura tramite
  una ricetta `openclaw config set` integrata, la aggiorna al tarball candidato, esegue doctor,
  controlla la pulizia legacy, avvia il Gateway e interroga `/healthz`, `/readyz` e lo stato RPC.
- `test:docker:update-migration` è la lane di aggiornamento pubblicato più orientata alla pulizia.
  Parte da uno stato utente configurato in stile Discord/Telegram, esegue il doctor baseline affinché
  le dipendenze dei plugin configurati abbiano la possibilità di materializzarsi, semina residui legacy
  di dipendenze plugin per un plugin pacchettizzato configurato, aggiorna al tarball candidato e richiede
  al doctor post-aggiornamento di rimuovere le root legacy delle dipendenze.

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
`plugin-deps-cleanup`, `configured-plugin-installs`, `tilde-log-path` e
`versioned-runtime-deps`. Nelle esecuzioni aggregate,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` si espande a tutti gli scenari
modellati su problemi segnalati, inclusa la migrazione di installazione dei plugin configurati.

La migrazione completa degli aggiornamenti è intenzionalmente separata dalla CI Full Release. Usa il
workflow manuale `Update Migration` quando la domanda di rilascio è "ogni release stabile
pubblicata dal 2026.4.23 in poi può aggiornarsi a questo candidato e ripulire i residui
delle dipendenze dei plugin?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance è il gate di pacchetto nativo di GitHub. Risolve un pacchetto candidato
in un tarball `package-under-test`, registra versione e SHA-256, poi esegue lane Docker E2E
riutilizzabili contro quel tarball esatto. Il ref dell'harness del workflow è separato dal ref
dell'origine del pacchetto, così la logica di test corrente può validare release attendibili più vecchie.

Origini candidate:

- `source=npm`: valida `openclaw@beta`, `openclaw@latest` o una versione pubblicata esatta.
- `source=ref`: impacchetta un branch, tag o commit attendibile con l'harness corrente selezionato.
- `source=url`: valida un tarball HTTPS con `package_sha256` obbligatorio.
- `source=artifact`: riusa un tarball caricato da un'altra esecuzione Actions.

Full Release Validation usa `source=artifact` per impostazione predefinita, costruito dallo
SHA della release risolto. Per la prova post-pubblicazione, passa
`package_acceptance_package_spec=openclaw@YYYY.M.D` così la stessa matrice di aggiornamento
punta invece al pacchetto npm distribuito.

I controlli di release chiamano Package Acceptance con il set package/update/plugin:

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
plugin obsolete, copertura plugin offline, comportamento di aggiornamento dei plugin e QA del pacchetto
Telegram sullo stesso artefatto risolto.

`all-since-2026.4.23` è il campione di aggiornamento della CI Full Release: ogni release stabile
pubblicata su npm da `2026.4.23` fino a `latest`. Per copertura esaustiva della migrazione degli
aggiornamenti pubblicati, usa `all-since-2026.4.23` nel workflow Update Migration separato invece
della CI Full Release. `release-history` resta disponibile per un campionamento manuale più ampio
quando vuoi anche l'ancora legacy precedente alla data.

Esegui manualmente un profilo pacchetto quando validi un candidato prima della release:

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

Usa `suite_profile=product` quando la domanda di rilascio include canali MCP,
pulizia cron/subagent, ricerca web OpenAI o OpenWebUI. Usa `suite_profile=full`
solo quando hai bisogno della copertura completa del percorso di release Docker.

## Default di release

Per i candidati di release, lo stack di prova predefinito è:

1. `pnpm check:changed` e `pnpm test:changed` per regressioni a livello sorgente.
2. `pnpm release:check` per l'integrità dell'artefatto del pacchetto.
3. Profilo `package` di Package Acceptance o le lane pacchetto personalizzate dei release-check
   per contratti di installazione/aggiornamento/plugin.
4. Controlli di release cross-OS per installer, onboarding e comportamento di piattaforma
   specifici dell'OS.
5. Suite live solo quando la superficie modificata tocca comportamento di provider o servizi ospitati.

Sulle macchine dei maintainer, gate ampi e prove prodotto Docker/pacchetto dovrebbero essere eseguiti
in Testbox salvo quando si esegue esplicitamente una prova locale.

## Compatibilità legacy

La tolleranza di compatibilità è stretta e limitata nel tempo:

- I pacchetti fino a `2026.4.25`, inclusi `2026.4.25-beta.*`, possono tollerare
  gap di metadati del pacchetto già distribuiti in Package Acceptance.
- Il pacchetto pubblicato `2026.4.26` può emettere avvisi per file di stamp di metadati
  di build locali già distribuiti.
- I pacchetti successivi devono soddisfare i contratti moderni. Gli stessi gap falliscono
  invece di generare avvisi o saltare controlli.

Non aggiungere nuove migrazioni all'avvio per queste vecchie forme. Aggiungi o estendi una riparazione
doctor, poi dimostrala con `upgrade-survivor` o `published-upgrade-survivor`.

## Aggiungere copertura

Quando modifichi comportamento di aggiornamento o plugin, aggiungi copertura al livello più basso che
può fallire per il motivo giusto:

- Logica pura di percorso o metadati: unit test accanto al sorgente.
- Inventario del pacchetto o comportamento dei file impacchettati: test `package-dist-inventory` o del
  checker del tarball.
- Comportamento CLI di installazione/aggiornamento: asserzione o fixture di lane Docker.
- Comportamento di migrazione da release pubblicata: scenario `published-upgrade-survivor`.
- Comportamento di origine registro/pacchetto: fixture `test:docker:plugins` o server fixture ClawHub.
- Layout o comportamento di pulizia delle dipendenze: asserisci sia l'esecuzione runtime sia il confine
  del filesystem. Le dipendenze npm possono essere hoisted sotto la root npm gestita, quindi i test
  dovrebbero dimostrare che la root viene analizzata/pulita invece di assumere un albero `node_modules`
  locale al pacchetto.

Mantieni le nuove fixture Docker ermetiche per impostazione predefinita. Usa registri fixture locali e
pacchetti finti salvo quando lo scopo del test è il comportamento del registro live.

## Triage dei fallimenti

Inizia dall'identità dell'artefatto:

- Riepilogo `resolve_package` di Package Acceptance: origine, versione, SHA-256 e nome artefatto.
- Artefatti Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, log della lane e comandi di riesecuzione.
- Riepilogo upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  inclusi versione baseline, versione candidata, scenario, tempi delle fasi e passaggi della ricetta.

Preferisci rieseguire la lane esatta fallita con lo stesso artefatto del pacchetto invece di
rieseguire l'intero ombrello di release.
