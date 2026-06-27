---
read_when:
    - Modificare il comportamento di aggiornamento, doctor, accettazione dei pacchetti o installazione dei Plugin di OpenClaw
    - Preparazione o approvazione di un release candidate
    - Debug di regressioni negli aggiornamenti dei pacchetti, nella pulizia delle dipendenze dei Plugin o nell'installazione dei Plugin
sidebarTitle: Update and plugin tests
summary: Come OpenClaw convalida i percorsi di aggiornamento, le migrazioni dei pacchetti e il comportamento di installazione/aggiornamento dei Plugin
title: 'Testing: aggiornamenti e Plugin'
x-i18n:
    generated_at: "2026-06-27T17:38:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be94eab4be97c53022bdac3110da74a61cfa23db989964c803497305e5415db
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Questa è la checklist dedicata alla validazione degli aggiornamenti e dei plugin. L'obiettivo è
semplice: dimostrare che il pacchetto installabile può aggiornare lo stato reale degli utenti, riparare lo stato
legacy obsoleto tramite `doctor` e continuare a installare, caricare, aggiornare e disinstallare
plugin dalle sorgenti supportate.

Per la mappa più ampia del runner di test, vedi [Testing](/it/help/testing). Per le chiavi dei provider live
e le suite che accedono alla rete, vedi [Testing live](/it/help/testing-live).

## Cosa proteggiamo

I test di aggiornamento e dei plugin proteggono questi contratti:

- Un tarball di pacchetto è completo, ha un `dist/postinstall-inventory.json` valido
  e non dipende da file del repository non impacchettati.
- Un utente può passare da un pacchetto pubblicato più vecchio al pacchetto candidato
  senza perdere configurazione, agenti, sessioni, workspace, allowlist dei plugin o
  configurazione dei canali.
- `openclaw doctor --fix --non-interactive` possiede i percorsi di pulizia e riparazione
  legacy. L'avvio non dovrebbe accumulare migrazioni di compatibilità nascoste per lo stato
  obsoleto dei plugin.
- Le installazioni dei plugin funzionano da directory locali, repository git, pacchetti npm e dal
  percorso del registro ClawHub.
- Le dipendenze npm dei plugin vengono installate in un progetto npm gestito per ciascun plugin,
  analizzate prima dell'attendibilità e rimosse tramite npm durante la disinstallazione, in modo che le
  dipendenze hoistate non restino.
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

Prima che una qualsiasi lane Docker di pacchetto consumi un tarball, verifica l'artefatto del pacchetto:

```bash
pnpm release:check
```

`release:check` esegue controlli di deriva su configurazione/documentazione/API, scrive l'inventario dist
del pacchetto, esegue `npm pack --dry-run`, rifiuta file impacchettati vietati, installa
il tarball in un prefisso temporaneo, esegue postinstall ed effettua uno smoke test degli entrypoint dei canali
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

- `test:docker:plugins` valida lo smoke test di installazione dei plugin, le installazioni da cartella locale,
  il comportamento di skip dell'aggiornamento da cartella locale, le cartelle locali con dipendenze
  preinstallate, le installazioni di pacchetti `file:`, le installazioni git con esecuzione CLI, gli
  aggiornamenti di riferimenti git mobili, le installazioni da registro npm con dipendenze transitive
  hoistate, i no-op dell'aggiornamento npm, il rifiuto di metadati di pacchetti npm malformati,
  le installazioni da fixture ClawHub locale e i no-op di aggiornamento, il comportamento di aggiornamento del marketplace
  e l'abilitazione/ispezione del bundle Claude. Imposta `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` per
  mantenere il blocco ClawHub ermetico/offline.
- `test:docker:plugin-lifecycle-matrix` installa il pacchetto candidato in un container
  vuoto, esegue un plugin npm attraverso installazione, ispezione, disabilitazione, abilitazione,
  upgrade esplicito, downgrade esplicito e disinstallazione dopo aver eliminato il codice del plugin.
  Registra metriche RSS e CPU per ogni fase.
- `test:docker:plugin-update` valida che un plugin installato invariato non
  venga reinstallato né perda metadati di installazione durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` installa il tarball candidato sopra una fixture
  sporca di vecchio utente, esegue l'aggiornamento del pacchetto più il doctor non interattivo, quindi avvia
  un Gateway loopback e controlla la conservazione dello stato.
- `test:docker:published-upgrade-survivor` installa prima una baseline pubblicata,
  la configura tramite una ricetta `openclaw config set` incorporata, la aggiorna al
  tarball candidato, esegue doctor, controlla la pulizia legacy, avvia il Gateway ed
  esegue probe su `/healthz`, `/readyz` e stato RPC.
- `test:docker:update-restart-auth` installa il pacchetto candidato, avvia un
  Gateway gestito con autenticazione token, rimuove le env di autenticazione Gateway del chiamante per
  `openclaw update --yes --json` e richiede che il comando di aggiornamento candidato
  riavvii il Gateway prima dei probe normali.
- `test:docker:update-migration` è la lane di aggiornamento pubblicato con molta pulizia. Parte
  da uno stato utente configurato in stile Discord/Telegram, esegue il doctor della baseline
  in modo che le dipendenze dei plugin configurati abbiano la possibilità di materializzarsi, inserisce
  residui legacy delle dipendenze plugin per un plugin pacchettizzato configurato, aggiorna al
  tarball candidato e richiede al doctor post-aggiornamento di rimuovere le radici legacy delle
  dipendenze.

Varianti utili del survivor di upgrade pubblicato:

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
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` si espande a tutti gli scenari con forma di
issue segnalata, inclusa la migrazione di installazione dei plugin configurati.

La migrazione completa degli aggiornamenti è intenzionalmente separata dalla CI di rilascio completo. Usa il
workflow manuale `Update Migration` quando la domanda di rilascio è "ogni
rilascio stabile pubblicato da 2026.4.23 in poi può aggiornarsi a questo candidato e
ripulire i residui delle dipendenze dei plugin?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Accettazione del pacchetto

L'Accettazione del pacchetto è il gate del pacchetto nativo di GitHub. Risolve un pacchetto
candidato in un tarball `package-under-test`, registra versione e SHA-256, quindi
esegue lane Docker E2E riutilizzabili contro esattamente quel tarball. Il riferimento dell'harness del workflow
è separato dal riferimento della sorgente del pacchetto, quindi la logica di test corrente può validare
rilasci attendibili più vecchi.

Sorgenti candidate:

- `source=npm`: valida `openclaw@beta`, `openclaw@latest` o una versione pubblicata
  esatta.
- `source=ref`: impacchetta un branch, tag o commit attendibile con l'harness corrente
  selezionato.
- `source=url`: valida un tarball HTTPS pubblico con `package_sha256` obbligatorio.
  Questo percorso rifiuta credenziali URL, porte HTTPS non predefinite, nomi host o risultati DNS/IP
  privati/interni, spazio IP per usi speciali e redirect non sicuri.
- `source=trusted-url`: valida un tarball HTTPS con
  `package_sha256` e `trusted_source_id` obbligatori rispetto alla policy posseduta dai maintainer
  in `.github/package-trusted-sources.json`. Usa questo per mirror enterprise/privati
  invece di indebolire `source=url` con uno switch allow-private a livello di input.
  L'autenticazione bearer, quando configurata dalla policy, usa il secret fisso
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.
- `source=artifact`: riutilizza un tarball caricato da un'altra esecuzione di Actions.

La validazione completa del rilascio usa `source=artifact` per impostazione predefinita, creato dallo
SHA di rilascio risolto. Per la prova post-pubblicazione, passa
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` così la stessa matrice di upgrade
punta invece al pacchetto npm rilasciato.

I controlli di rilascio chiamano l'Accettazione del pacchetto con il set package/update/restart/plugin:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Quando il soak di rilascio è abilitato, passano anche:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Questo mantiene migrazione del pacchetto, cambio del canale di aggiornamento, tolleranza dei plugin gestiti
corrotti, pulizia delle dipendenze obsolete dei plugin, copertura offline dei plugin,
comportamento di aggiornamento dei plugin e QA del pacchetto Telegram sullo stesso artefatto risolto senza
fare percorrere al gate di pacchetto di rilascio predefinito ogni rilascio pubblicato.

`last-stable-4` si risolve nei quattro rilasci stabili OpenClaw più recenti pubblicati su npm.
L'accettazione del pacchetto di rilascio fissa `2026.4.23` come primo limite di compatibilità
per l'aggiornamento dei plugin, `2026.5.2` come limite di churn dell'architettura plugin e
`2026.4.15` come baseline di aggiornamento pubblicato più vecchia della serie 2026.4.1x; il resolver
deduplica i pin già presenti nei quattro più recenti. Per una copertura esaustiva della migrazione degli
aggiornamenti pubblicati, usa `all-since-2026.4.23` nel workflow separato Update
Migration invece della CI di rilascio completo. `release-history` resta
disponibile per un campionamento manuale più ampio quando vuoi anche l'ancoraggio legacy precedente alla data.

Quando vengono selezionate più baseline survivor di upgrade pubblicato, il workflow Docker
riutilizzabile divide ogni baseline nel proprio job runner mirato. Ogni shard di
baseline esegue comunque il set di scenari selezionato, ma log e artefatti restano
per baseline e il tempo totale è limitato dallo shard più lento invece che da un grande
job seriale.

Esegui manualmente un profilo di pacchetto durante la validazione di un candidato prima del rilascio:

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

Usa `suite_profile=product` quando la domanda di rilascio include canali MCP,
pulizia cron/subagent, ricerca web OpenAI o OpenWebUI. Usa `suite_profile=full`
solo quando serve la copertura Docker completa del percorso di rilascio.

## Impostazione predefinita di rilascio

Per i candidati al rilascio, lo stack di prova predefinito è:

1. `pnpm check:changed` e `pnpm test:changed` per regressioni a livello sorgente.
2. `pnpm release:check` per l'integrità dell'artefatto del pacchetto.
3. Profilo `package` di Accettazione del pacchetto o le lane personalizzate di pacchetto
   dei controlli di rilascio per i contratti install/update/restart/plugin.
4. Controlli di rilascio cross-OS per installer, onboarding e comportamento di piattaforma
   specifici del sistema operativo.
5. Suite live solo quando la superficie modificata tocca il comportamento di provider o servizi
   ospitati.

Sulle macchine dei maintainer, i gate ampi e la prova di prodotto Docker/pacchetto dovrebbero essere eseguiti
in Testbox salvo prova locale esplicita.

## Compatibilità legacy

La tolleranza di compatibilità è stretta e limitata nel tempo:

- I pacchetti fino a `2026.4.25`, inclusi `2026.4.25-beta.*`, possono tollerare
  lacune nei metadati del pacchetto già rilasciate nell'Accettazione del pacchetto.
- Il pacchetto pubblicato `2026.4.26` può avvisare per file di stamp dei metadati di build locale
  già rilasciati.
- I pacchetti successivi devono soddisfare i contratti moderni. Le stesse lacune falliscono invece di
  generare avvisi o venire saltate.

Non aggiungere nuove migrazioni di avvio per queste vecchie forme. Aggiungi o estendi una riparazione doctor,
quindi dimostrala con `upgrade-survivor`, `published-upgrade-survivor` o
`update-restart-auth` quando il comando di aggiornamento possiede il riavvio.

## Aggiungere copertura

Quando modifichi il comportamento di aggiornamento o dei plugin, aggiungi copertura al livello più basso che
può fallire per il motivo corretto:

- Logica di percorso puro o di metadati: test unitario accanto al sorgente.
- Comportamento dell'inventario del pacchetto o dei file impacchettati: test
  `package-dist-inventory` o checker del tarball.
- Comportamento di installazione/aggiornamento della CLI: asserzione della lane
  Docker o fixture.
- Comportamento di migrazione di una release pubblicata: scenario
  `published-upgrade-survivor`.
- Comportamento di riavvio di proprietà dell'aggiornamento: `update-restart-auth`.
- Comportamento della sorgente del registro/pacchetto: fixture
  `test:docker:plugins` o server fixture ClawHub.
- Comportamento del layout delle dipendenze o della pulizia: asserisci sia
  l'esecuzione runtime sia il confine del filesystem. Le dipendenze npm possono
  essere hoistate all'interno del progetto npm gestito del plugin, quindi i test
  devono dimostrare che quel progetto viene scansionato/pulito invece di
  presupporre solo l'albero `node_modules` locale del pacchetto del plugin.

Mantieni i nuovi fixture Docker ermetici per impostazione predefinita. Usa
registri fixture locali e pacchetti finti, a meno che lo scopo del test non sia
il comportamento del registro live.

## Triage degli errori

Inizia dall'identità dell'artefatto:

- Riepilogo `resolve_package` di Package Acceptance: sorgente, versione, SHA-256
  e nome dell'artefatto.
- Artefatti Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, log delle lane e comandi di riesecuzione.
- Riepilogo upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  incluse versione di baseline, versione candidata, scenario, tempistiche delle
  fasi e passaggi della ricetta.

Preferisci rieseguire la lane esatta non riuscita con lo stesso artefatto del
pacchetto invece di rieseguire l'intero ombrello della release.
