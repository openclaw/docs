---
read_when:
    - Esecuzione o riesecuzione della convalida completa della release
    - Confronto tra i profili di convalida delle versioni stable e full
    - Debug degli errori nelle fasi di convalida della release
summary: Fasi della convalida completa della release, workflow secondari, profili di release, riferimenti per la riesecuzione ed evidenze
title: Validazione completa del rilascio
x-i18n:
    generated_at: "2026-07-12T07:28:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` è il processo generale di rilascio: l'unico punto di ingresso manuale
per la verifica preliminare al rilascio. La maggior parte del lavoro avviene nei workflow figli, così un ambiente non riuscito può
essere rieseguito senza riavviare l'intero rilascio.

Eseguilo da un riferimento di workflow attendibile, normalmente `main`, e passa il branch di rilascio,
il tag o lo SHA completo del commit come `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider` accetta anche `anthropic` o `minimax` per l'onboarding multipiattaforma e il
turno end-to-end dell'agente. I job figli riutilizzabili risolvono l'infrastruttura del workflow chiamato
da `job.workflow_repository` e `job.workflow_sha`, mentre l'input `ref`
seleziona il candidato sottoposto a test. Ciò mantiene disponibile la logica di convalida attendibile corrente
quando si convalida un branch o un tag di rilascio precedente.

Ogni workflow figlio avviato deve segnalare lo stesso SHA del workflow dell'esecuzione padre
`Full Release Validation`. Se `main` cambia tra gli avvii del padre e dei figli,
il processo generale fallisce in modo sicuro anche se il workflow figlio ha esito positivo. Per
una verifica immutabile di un commit esatto, usa
`pnpm ci:full-release --sha <target-sha>`. L'helper crea un riferimento temporaneo
`release-ci/*` vincolato all'attuale `origin/main` attendibile, passa lo SHA di destinazione
solo come `ref` del candidato, riutilizza le evidenze rigorose relative alla destinazione esatta quando
disponibili ed elimina il riferimento dopo la convalida. Passa
`-f reuse_evidence=false` per forzare una nuova esecuzione oppure
`--workflow-sha <trusted-main-sha>` per selezionare un commit del workflow precedente ancora
raggiungibile dall'attuale `origin/main`. Il workflow non crea né aggiorna mai
autonomamente i riferimenti del repository.

`release_profile=stable` e `release_profile=full` eseguono sempre il test prolungato completo
live/Docker. Passa `run_release_soak=true` per includere gli stessi percorsi di test prolungato
con il profilo `beta`. La pubblicazione stabile rifiuta un manifest di convalida
privo di questo test prolungato e delle evidenze bloccanti sulle prestazioni del prodotto.

Package Acceptance normalmente crea il tarball candidato dal `ref`
risolto, incluse le esecuzioni con SHA completo avviate tramite `pnpm ci:full-release`. Dopo una
pubblicazione beta, passa `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` per riutilizzare
il pacchetto npm pubblicato nei controlli di rilascio, in Package Acceptance, nelle verifiche multipiattaforma,
nel percorso di rilascio Docker e nel test Telegram del pacchetto. Usa `package_acceptance_package_spec`
solo quando Package Acceptance deve intenzionalmente verificare un pacchetto diverso.
Il percorso del pacchetto live del Plugin Codex segue lo stesso stato: i valori
`release_package_spec` pubblicati derivano `codex_plugin_spec=npm:@openclaw/codex@<version>`;
le esecuzioni tramite SHA/artefatto preparano `extensions/codex` dal riferimento selezionato; inoltre, gli operatori
possono impostare direttamente `codex_plugin_spec` per sorgenti del Plugin
`npm:`, `npm-pack:` o `git:`. Il percorso concede l'approvazione esplicita all'installazione della CLI Codex richiesta da
quel Plugin, quindi esegue il controllo preliminare della CLI Codex e i turni dell'agente OpenAI nella stessa sessione.

## Fasi di primo livello

Per `rerun_group=all`, viene eseguito per primo un job `Check for reusable validation evidence`:
cerca la convalida completa precedente più recente con esito positivo per lo stesso identico
SHA di destinazione, profilo di rilascio, impostazione effettiva del test prolungato e input di convalida.
Quando tali evidenze esistono, ogni percorso viene ignorato e il verificatore generale
ricontrolla l'artefatto padre immutabile, le esecuzioni figlie e i log degli avvii. Si tratta
esclusivamente del ripristino di una riesecuzione per lo stesso candidato; non autorizza il riutilizzo tra SHA diversi. Per
un candidato modificato, riesegui ogni controllo di pacchetto, artefatto, installazione, Docker o provider
interessato dalla modifica. Passa `reuse_evidence=false` per forzare una nuova esecuzione completa.
Il riutilizzo delle evidenze viene eseguito solo da `main` o da un riferimento canonico
`release-ci/*` vincolato a uno SHA il cui commit del workflow rimane nella discendenza attendibile di `main`;
gli altri riferimenti di workflow eseguono nuovamente i percorsi selezionati.

Sempre per `rerun_group=all`, un job `Verify Docker runtime image assets` crea
la destinazione Docker `runtime-assets` con
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex`. Viene eseguito in parallelo con le
altre fasi ed è imposto dal verificatore generale; i percorsi non ne attendono più
il completamento prima dell'avvio. Un `rerun_group` più specifico ignora questo controllo preliminare.

| Fase                    | Dettagli                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Risoluzione destinazione | **Job:** `Resolve target ref`<br />**Workflow figlio:** nessuno<br />**Verifica:** risolve il branch di rilascio, il tag o lo SHA completo del commit e registra gli input selezionati.<br />**Riesecuzione:** riesegui il processo generale se non riesce.                                                                                                                                                                                                                                                                      |
| Controllo preliminare degli asset Docker | **Job:** `Verify Docker runtime image assets`<br />**Workflow figlio:** nessuno<br />**Verifica:** la compilazione della destinazione Docker `runtime-assets` continua a riuscire prima dell'avvio di qualsiasi altra fase. Viene eseguito solo per `rerun_group=all`.<br />**Riesecuzione:** riesegui il processo generale con `rerun_group=all`.                                                                                                                                                                           |
| Vitest e CI normale     | **Job:** `Run normal full CI`<br />**Workflow figlio:** `CI`<br />**Verifica:** il grafo completo della CI manuale rispetto al riferimento di destinazione, inclusi i percorsi Linux Node, le partizioni dei Plugin integrati, le partizioni dei contratti di Plugin e canali, la compatibilità con Node 22, `check-*`, `check-additional-*`, i controlli rapidi degli artefatti compilati, i controlli della documentazione, le Skills Python, Windows, macOS, l'internazionalizzazione della Control UI e Android tramite il processo generale.<br />**Riesecuzione:** `rerun_group=ci`. |
| Prerelease dei Plugin   | **Job:** `Run plugin prerelease validation`<br />**Workflow figlio:** `Plugin Prerelease`<br />**Verifica:** i controlli statici dei Plugin riservati al rilascio, la copertura agentica dei Plugin, le partizioni complete dei batch di Plugin, i percorsi Docker di prerelease dei Plugin e un artefatto non bloccante `plugin-inspector-advisory` per la valutazione della compatibilità.<br />**Riesecuzione:** `rerun_group=plugin-prerelease`.                                                                                 |
| Controlli di rilascio   | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow figlio:** `OpenClaw Release Checks`<br />**Verifica:** il controllo rapido dell'installazione, i controlli multipiattaforma dei pacchetti, Package Acceptance, la parità di QA Lab, Matrix live e Telegram live. I profili stabile e completo eseguono anche suite live/E2E complete e segmenti del percorso di rilascio Docker; la beta può aderire con `run_release_soak=true`.<br />**Riesecuzione:** `rerun_group=release-checks` o un identificatore più specifico dei controlli di rilascio. |
| Telegram del pacchetto  | **Job:** `Run package Telegram E2E`<br />**Workflow figlio:** `NPM Telegram Beta E2E`<br />**Verifica:** un test E2E Telegram mirato sul pacchetto pubblicato quando è impostato `release_package_spec` o `npm_telegram_package_spec`. La convalida completa del candidato utilizza invece il test E2E Telegram canonico di Package Acceptance.<br />**Riesecuzione:** `rerun_group=npm-telegram` con `release_package_spec` o `npm_telegram_package_spec`.                                                                                 |
| Prestazioni del prodotto | **Job:** `Run product performance evidence`<br />**Workflow figlio:** `OpenClaw Performance`<br />**Verifica:** l'esecuzione delle prestazioni del profilo di rilascio (`profile=release`, `repeat=3`, `fail_on_regression=true`, `publish_reports=false`) rispetto allo SHA di destinazione. L'output di Kova rimane negli artefatti del workflow e il workflow figlio deve dimostrare che il relativo processo di pubblicazione dei report è stato ignorato. Obbligatorio e bloccante solo per `rerun_group=all` o `rerun_group=performance`; non obbligatorio per gruppi di riesecuzione più specifici.<br />**Riesecuzione:** `rerun_group=performance`. |
| Verificatore generale   | **Job:** `Verify full validation`<br />**Workflow figlio:** nessuno<br />**Verifica:** ricontrolla le conclusioni registrate delle esecuzioni figlie e aggiunge le tabelle dei job più lenti dei workflow figli.<br />**Riesecuzione:** riesegui solo questo job dopo aver rieseguito con esito positivo un workflow figlio non riuscito.                                                                                                                                                                                        |

Il processo generale avvia sempre le prestazioni del prodotto in modalità solo artefatti.
`OpenClaw Performance` consente la pubblicazione dei report solo per le esecuzioni pianificate o per un
avvio manuale che imposta esplicitamente `publish_reports=true`. La protezione della modalità solo artefatti
deve completarsi correttamente, dimostrando che il job di pubblicazione è rimasto ignorato.
Le evidenze nuove e riutilizzate registrano
`controls.performanceReportPublication=artifact-only`; il verificatore e il selettore per il riutilizzo
rifiutano le evidenze prive della corrispondente verifica normalizzata del workflow figlio
delle prestazioni.

Il verificatore carica il manifest canonico come
`full-release-validation-<run-id>-<run-attempt>`. Gli strumenti per le evidenze convalidano
l'ID dell'artefatto, il digest, l'esecuzione che lo ha prodotto e il tentativo prima di scaricare esattamente
quell'ID artefatto. Impongono un limite allo ZIP scaricato, ne verificano i byte rispetto al digest REST
`sha256:` e trasmettono in streaming l'unica voce delimitata e consentita del manifest senza
estrarre l'archivio. Un alias con nome stabile viene mantenuto temporaneamente per i consumer di
pubblicazione precedenti. Il verificatore preferisce sempre l'artefatto qualificato per tentativo;
durante la transizione, accetta il nome stabile solo per un produttore del manifest v2 al tentativo 1.
Rifiuta tale nome precedente per i tentativi successivi e per il manifest v3.

Per `ref=main` con `rerun_group=all`, per i riferimenti `release/*`
e per i riferimenti alpha di Tideclaw, una nuova esecuzione generale sostituisce una precedente
con lo stesso riferimento e lo stesso gruppo di riesecuzione. Quando il processo padre viene annullato, il relativo monitor
annulla qualsiasi workflow figlio già avviato. Le esecuzioni di convalida per tag e SHA
vincolati non si annullano reciprocamente.

## Fasi dei controlli di rilascio

`OpenClaw Release Checks` è il workflow figlio più esteso. Risolve la destinazione
una sola volta e prepara un artefatto condiviso `release-package-under-test` quando ne hanno bisogno
le fasi relative ai pacchetti o a Docker.

| Fase                     | Dettagli                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Destinazione del rilascio | **Job:** `Resolve target ref`<br />**Workflow di supporto:** nessuno<br />**Test:** riferimento selezionato, SHA previsto facoltativo, profilo, gruppo di riesecuzione e filtro mirato della suite live.<br />**Riesecuzione:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                                                    |
| Artefatto del pacchetto  | **Job:** `Prepare release package artifact`<br />**Workflow di supporto:** nessuno<br />**Test:** crea il pacchetto o risolve un singolo tarball candidato e carica `release-package-under-test` per i controlli successivi relativi al pacchetto.<br />**Riesecuzione:** il gruppo interessato relativo al pacchetto, multipiattaforma o live/E2E.                                                                                                                                                                                                                                                  |
| Smoke test di installazione | **Job:** `Run install smoke`<br />**Workflow di supporto:** `Install Smoke`<br />**Test:** percorso di installazione completo con riutilizzo dell'immagine smoke del Dockerfile radice, installazione del pacchetto QR, smoke test Docker della radice e del Gateway, test Docker del programma di installazione e smoke test del provider di immagini con installazione globale tramite Bun.<br />**Riesecuzione:** `rerun_group=install-smoke`.                                                                                                                                                |
| Multipiattaforma         | **Job:** `cross_os_release_checks`<br />**Workflow di supporto:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Test:** corsie di installazione pulita e aggiornamento su Linux, Windows e macOS per il provider e la modalità selezionati, usando il tarball candidato insieme a un pacchetto di riferimento.<br />**Riesecuzione:** `rerun_group=cross-os`.                                                                                                                                                                                                                                   |
| E2E del repository e live | **Job:** `Run repo/live E2E validation`<br />**Workflow di supporto:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** E2E del repository, cache live, streaming WebSocket di OpenAI, shard del provider live nativo e dei Plugin, nonché harness live basati su Docker per modello/backend/Gateway selezionati da `release_profile`.<br />**Esecuzione:** `run_release_soak=true`, `release_profile=full` o `rerun_group=live-e2e` mirato.<br />**Riesecuzione:** `rerun_group=live-e2e`, facoltativamente con `live_suite_filter`. |
| Percorso di rilascio Docker | **Job:** `Run Docker release-path validation`<br />**Workflow di supporto:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** segmenti Docker del percorso di rilascio sull'artefatto del pacchetto condiviso.<br />**Esecuzione:** `run_release_soak=true`, `release_profile=full` o `rerun_group=live-e2e` mirato.<br />**Riesecuzione:** `rerun_group=live-e2e`.                                                                                                                                                                                                                 |
| Accettazione del pacchetto | **Job:** `Run package acceptance`<br />**Workflow di supporto:** `Package Acceptance`<br />**Test:** fixture offline dei pacchetti dei Plugin, aggiornamento dei Plugin, E2E canonico del pacchetto Telegram con OpenAI simulato e controlli di sopravvivenza agli aggiornamenti pubblicati sullo stesso tarball. I controlli bloccanti del rilascio usano come riferimento predefinito l'ultima versione pubblicata; i controlli prolungati (`run_release_soak=true`) si estendono alle ultime 4 versioni stabili npm più 3 versioni storiche fissate (`2026.4.23`, `2026.5.2`, `2026.4.15`), eseguite su fixture di aggiornamento relative a problemi segnalati.<br />**Riesecuzione:** `rerun_group=package`. |
| Scheda di valutazione della maturità | **Job:** `Render maturity scorecard release docs`<br />**Workflow di supporto:** `maturity-scorecard.yml`<br />**Test:** genera la documentazione indicativa della scheda di valutazione della maturità rispetto al riferimento di destinazione. Viene eseguito solo quando è passato `run_maturity_scorecard=true`.<br />**Riesecuzione:** `rerun_group=qa` con `run_maturity_scorecard=true`.                                                                                                                                                                            |
| Parità QA                | **Job:** `Run QA Lab parity lane` e `Run QA Lab parity report`<br />**Workflow di supporto:** job diretti<br />**Test:** pacchetti di parità agentica del candidato e del riferimento, quindi il rapporto di parità.<br />**Riesecuzione:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                                                                                                                                                                           |
| Parità del runtime QA    | **Job:** `Run QA Lab runtime parity lane`<br />**Workflow di supporto:** job diretto<br />**Test:** una corsia di parità agentica per la coppia di runtime `openclaw`/`codex` (`pnpm openclaw qa suite --runtime-pair openclaw,codex`), comprendente un livello standard e, con `run_release_soak=true`, un livello prolungato. Indicativo: i singoli errori non bloccano il verificatore dei controlli di rilascio.<br />**Riesecuzione:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                |
| Copertura degli strumenti del runtime QA | **Job:** `Enforce QA Lab runtime tool coverage`<br />**Workflow di supporto:** job diretto<br />**Test:** deriva dinamica degli strumenti tra `openclaw` e `codex` nel livello standard di parità del runtime (`pnpm openclaw qa coverage --tools`), usando l'output della corsia di parità del runtime QA. Bloccante: questo job non può essere reso indicativo tramite override.<br />**Riesecuzione:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                      |
| Matrix live QA           | **Job:** `Run QA Lab live Matrix lane`<br />**Workflow di supporto:** job diretto<br />**Test:** profilo QA Matrix live rapido nell'ambiente `qa-live-shared`.<br />**Riesecuzione:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                   |
| Telegram live QA         | **Job:** `Run QA Lab live Telegram lane`<br />**Workflow di supporto:** job diretto<br />**Test:** QA live di Telegram con lease delle credenziali CI di Convex.<br />**Riesecuzione:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                 |
| Verificatore del rilascio | **Job:** `Verify release checks`<br />**Workflow di supporto:** nessuno<br />**Test:** job obbligatori dei controlli di rilascio per il gruppo di riesecuzione selezionato.<br />**Riesecuzione:** rieseguire dopo il superamento dei job secondari mirati.                                                                                                                                                                                                                                                                                                                        |

## Segmenti del percorso di rilascio Docker

La fase del percorso di rilascio Docker esegue questi segmenti quando
`live_suite_filter` è vuoto:

| Segmento                                                        | Copertura                                                                                                                                     |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Corsie smoke principali del percorso di rilascio Docker.                                                                                     |
| `package-update-openai`                                         | Comportamento di installazione/aggiornamento del pacchetto OpenAI, installazione su richiesta di Codex, interazioni live del Plugin Codex e chiamate agli strumenti di Chat Completions. |
| `package-update-anthropic`                                      | Comportamento di installazione e aggiornamento del pacchetto Anthropic.                                                                       |
| `package-update-core`                                           | Comportamento di pacchetti e aggiornamenti indipendente dal provider.                                                                         |
| `plugins-runtime-plugins`                                       | Corsie del runtime dei Plugin che esercitano il comportamento dei Plugin.                                                                     |
| `plugins-runtime-services`                                      | Corsie del runtime dei Plugin supportate da servizi e live.                                                                                   |
| da `plugins-runtime-install-a` a `plugins-runtime-install-h`     | Batch di installazione/runtime dei Plugin suddivisi per la convalida parallela del rilascio.                                                  |
| `openwebui`                                                     | Smoke test di compatibilità con OpenWebUI isolato su un runner dedicato con disco di grandi dimensioni, quando richiesto.                     |

Usa `docker_lanes=<lane[,lane]>` mirato nel workflow live/E2E riutilizzabile quando
è fallita una sola corsia Docker. Gli artefatti del rilascio includono, quando
disponibili, comandi di riesecuzione per ciascuna corsia con input per il
riutilizzo dell'artefatto del pacchetto e dell'immagine.

## Profili di rilascio

`release_profile` controlla principalmente l'ampiezza dei test live/provider all'interno dei controlli di rilascio.
Non rimuove la normale CI completa, la prerelease dei Plugin, lo smoke test di installazione, l'accettazione
del pacchetto o QA Lab. I profili stable e full eseguono sempre una copertura esaustiva
E2E del repository/live e di soak del percorso di rilascio Docker. Il profilo beta può abilitarla con
`run_release_soak=true`. L'accettazione del pacchetto fornisce l'E2E Telegram canonico
del pacchetto per ogni candidato completo, quindi il flusso generale non duplica tale
poller live.

| Profilo  | Uso previsto                      | Copertura live/provider inclusa                                                                                                                                                                            |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | Smoke test critico per il rilascio più rapido.   | Percorso live OpenAI/core, modelli live Docker per OpenAI, core Gateway nativo, profilo Gateway OpenAI nativo, Plugin OpenAI nativo e Gateway OpenAI live Docker.                                            |
| `stable` | Profilo predefinito di approvazione del rilascio. | `beta` più smoke test Anthropic, Google, MiniMax, backend, harness di test live nativo, backend CLI live Docker, binding ACP Docker, harness Codex Docker, annuncio dei subagenti Docker e uno shard di smoke test OpenCode Go. |
| `full`   | Verifica consultiva estesa.             | `stable` più provider consultivi, shard live dei Plugin e shard multimediali live.                                                                                                                               |

## Aggiunte esclusive di full

Queste suite vengono saltate da `stable` e incluse da `full`:

| Area                             | Copertura esclusiva di full                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Modelli live Docker               | OpenCode Go, OpenRouter, xAI, Z.ai e Fireworks.                                                                          |
| Gateway live Docker              | Provider consultivi suddivisi negli shard DeepSeek/Fireworks, OpenCode Go/OpenRouter e xAI/Z.ai.                              |
| Profili provider del Gateway nativo | Shard completi Anthropic Opus e Sonnet/Haiku, Fireworks, DeepSeek, shard completi dei modelli OpenCode Go, OpenRouter, xAI e Z.ai. |
| Shard live dei Plugin nativi        | Plugin A-K, L-N, altri O-Z, Moonshot e xAI.                                                                             |
| Shard multimediali live nativi         | Audio, musica Google, musica MiniMax e gruppi video A-D.                                                                   |

`stable` include `native-live-src-gateway-profiles-anthropic-smoke` e
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` utilizza invece gli shard
più ampi dei modelli Anthropic e OpenCode Go. Le riesecuzioni mirate possono comunque utilizzare gli
handle aggregati `native-live-src-gateway-profiles-anthropic` o
`native-live-src-gateway-profiles-opencode-go`.

## Riesecuzioni mirate

Utilizza `rerun_group` per evitare di ripetere ambienti di rilascio non correlati:

| Handle              | Ambito                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Tutte le fasi della convalida completa del rilascio.                                                             |
| `ci`                | Solo il workflow figlio della CI completa manuale.                                                                      |
| `plugin-prerelease` | Solo il workflow figlio della prerelease dei Plugin.                                                                   |
| `release-checks`    | Tutte le fasi dei controlli di rilascio OpenClaw.                                                             |
| `install-smoke`     | Smoke test di installazione fino ai controlli di rilascio.                                                           |
| `cross-os`          | Controlli di rilascio multipiattaforma.                                                                        |
| `live-e2e`          | E2E del repository/live e convalida del percorso di rilascio Docker.                                               |
| `package`           | Accettazione del pacchetto.                                                                             |
| `qa`                | Parità QA più corsie QA live.                                                                   |
| `qa-parity`         | Solo corsie e rapporto di parità QA.                                                                |
| `qa-live`           | Matrix/Telegram QA live più le corsie soggette ad abilitazione di Discord, WhatsApp e Slack, quando abilitate.             |
| `npm-telegram`      | E2E Telegram del pacchetto pubblicato; richiede `release_package_spec` o `npm_telegram_package_spec`. |
| `performance`       | Solo evidenze sulle prestazioni del prodotto.                                                              |

Utilizza `live_suite_filter` con `rerun_group=live-e2e` quando una suite live non riesce.
Gli ID di filtro validi sono definiti nel workflow live/E2E riutilizzabile, inclusi
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` e
`live-codex-harness-docker`.

L'handle `live-gateway-advisory-docker` è un handle di riesecuzione aggregato per i suoi
tre shard di provider, quindi continua a distribuire l'esecuzione a tutti i job consultivi del Gateway Docker.

Utilizza `cross_os_suite_filter` con `rerun_group=cross-os` quando una corsia multipiattaforma
non riesce. Il filtro accetta un ID del sistema operativo, un ID della suite o una coppia sistema operativo/suite, ad
esempio `windows/packaged-upgrade`, `windows` o `packaged-fresh`. I riepiloghi multipiattaforma
includono le tempistiche per fase per le corsie di aggiornamento con pacchetto e i comandi di lunga durata
stampano righe di Heartbeat, in modo che un aggiornamento bloccato sia visibile prima del
timeout del job.

Gli errori dei controlli di rilascio QA bloccano la normale convalida del rilascio. Anche il controllo
della copertura degli strumenti di runtime QA (divergenza dinamica degli strumenti tra `openclaw` e `codex` nel
livello standard) blocca il verificatore dei controlli di rilascio, anche se la
corsia sottostante di parità del runtime QA è consultiva. Le esecuzioni alpha di Tideclaw possono comunque
considerare consultive le corsie dei controlli di rilascio non relative alla sicurezza del pacchetto. Con
`release_profile=beta`, le suite di provider live di `Run repo/live E2E validation`
sono consultive: le distribuzioni dei modelli di terze parti cambiano indipendentemente da un rilascio, quindi
beta presenta i relativi errori come avvisi, mentre i profili stable e full continuano
a considerarli bloccanti. Quando
`live_suite_filter` richiede esplicitamente una corsia QA live soggetta ad abilitazione, come Discord,
WhatsApp o Slack, deve essere abilitata la variabile del repository
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` corrispondente; in caso contrario, l'acquisizione dell'input non riesce anziché saltare silenziosamente la corsia.
Riesegui `rerun_group=qa`, `qa-parity` o `qa-live` quando
sono necessarie evidenze QA aggiornate.

## Evidenze da conservare

Conserva il riepilogo `Full Release Validation` come indice a livello di rilascio. Contiene collegamenti
agli ID delle esecuzioni figlie e include tabelle dei job più lenti. In caso di errori, esamina prima il
workflow figlio, quindi riesegui l'handle corrispondente più specifico tra quelli riportati sopra.

Artefatti utili:

- `release-package-under-test` da `OpenClaw Release Checks`
- Artefatti del percorso di rilascio Docker in `.artifacts/docker-tests/`
- Artefatti `package-under-test` dell'accettazione del pacchetto e di accettazione Docker
- Artefatti dei controlli di rilascio multipiattaforma per ciascun sistema operativo e suite
- Artefatti di parità QA, parità del runtime, Matrix e Telegram

## File dei workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/install-smoke-reusable.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
- `.github/workflows/openclaw-performance.yml`
- `.github/workflows/npm-telegram-beta-e2e.yml`
