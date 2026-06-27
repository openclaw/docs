---
read_when:
    - Esecuzione o riesecuzione della convalida completa del rilascio
    - Confronto tra i profili di convalida per release stabile e completa
    - Debug dei fallimenti della fase di convalida della release
summary: Fasi di convalida della release completa, workflow figlio, profili di release, handle di riesecuzione ed evidenze
title: Validazione completa della release
x-i18n:
    generated_at: "2026-06-27T18:12:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 791930254e3cac7da101d809cfc9b56773225159574d3727189f67cf85bd3fce
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` è il workflow ombrello del rilascio. È l’unico punto di ingresso manuale
per la prova pre-rilascio, ma la maggior parte del lavoro avviene nei workflow figlio, così un
ambiente non riuscito può essere rieseguito senza riavviare l’intero rilascio.

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

I workflow figlio usano il riferimento di workflow attendibile per l’harness e l’input
`ref` per il candidato in test. Questo mantiene disponibile la nuova logica di validazione
quando si valida un branch o tag di rilascio precedente.

`release_profile=stable` e `release_profile=full` eseguono sempre lo soak
live/Docker esaustivo. Passa `run_release_soak=true` per includere le stesse lane di soak
con il profilo beta. La pubblicazione stabile rifiuta un manifest di validazione senza questo
soak e senza evidenza bloccante sulle prestazioni del prodotto.

Package Acceptance normalmente crea il tarball candidato dal
`ref` risolto, incluse le esecuzioni con SHA completo inviate con `pnpm ci:full-release`. Dopo una
pubblicazione beta, passa `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` per riutilizzare il
pacchetto npm distribuito tra controlli di rilascio, Package Acceptance, cross-OS,
Docker del percorso di rilascio e package Telegram. Usa `package_acceptance_package_spec`
solo quando Package Acceptance deve dimostrare intenzionalmente un pacchetto diverso.
La lane del pacchetto live del Plugin Codex segue lo stesso stato: i valori pubblicati
`release_package_spec` derivano `codex_plugin_spec=npm:@openclaw/codex@<version>`;
le esecuzioni SHA/artefatto pacchettizzano `extensions/codex` dal ref selezionato; e gli operatori
possono impostare direttamente `codex_plugin_spec` per sorgenti Plugin
`npm:`, `npm-pack:` o `git:`. La lane concede l’approvazione esplicita di installazione della CLI Codex richiesta da
quel Plugin, poi esegue il preflight della CLI Codex e turni dell’agente OpenAI nella stessa sessione.

## Fasi di livello superiore

| Fase                 | Dettagli                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Risoluzione target   | **Job:** `Resolve target ref`<br />**Workflow figlio:** nessuno<br />**Dimostra:** risolve il branch di rilascio, il tag o lo SHA completo del commit e registra gli input selezionati.<br />**Riesecuzione:** riesegui l’ombrello se fallisce.                                                                                                                                                                                                            |
| Vitest e CI normale  | **Job:** `Run normal full CI`<br />**Workflow figlio:** `CI`<br />**Dimostra:** grafo CI completo manuale sul ref target, incluse le lane Linux Node, shard dei Plugin in bundle, shard dei contratti di Plugin e canali, compatibilità Node 22, `check-*`, `check-additional-*`, controlli smoke degli artefatti compilati, controlli docs, Skills Python, Windows, macOS, Control UI i18n e Android tramite l’ombrello.<br />**Riesecuzione:** `rerun_group=ci`. |
| Pre-rilascio Plugin  | **Job:** `Run plugin prerelease validation`<br />**Workflow figlio:** `Plugin Prerelease`<br />**Dimostra:** controlli statici dei Plugin solo per il rilascio, copertura agentica dei Plugin, shard batch completi delle estensioni, lane Docker di pre-rilascio Plugin e un artefatto non bloccante `plugin-inspector-advisory` per il triage della compatibilità.<br />**Riesecuzione:** `rerun_group=plugin-prerelease`.                                           |
| Controlli rilascio   | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow figlio:** `OpenClaw Release Checks`<br />**Dimostra:** smoke di installazione, controlli pacchetto cross-OS, Package Acceptance, parità QA Lab, Matrix live e Telegram live. I profili stable e full eseguono anche suite live/E2E esaustive e chunk Docker del percorso di rilascio; beta può attivarli con `run_release_soak=true`.<br />**Riesecuzione:** `rerun_group=release-checks` o un handle release-checks più ristretto. |
| Package Telegram     | **Job:** `Run package Telegram E2E`<br />**Workflow figlio:** `NPM Telegram Beta E2E`<br />**Dimostra:** un E2E Telegram mirato su pacchetto pubblicato quando `release_package_spec` o `npm_telegram_package_spec` è impostato. La validazione completa del candidato usa invece l’E2E Telegram canonico di Package Acceptance.<br />**Riesecuzione:** `rerun_group=npm-telegram` con `release_package_spec` o `npm_telegram_package_spec`.                 |
| Verificatore ombrello | **Job:** `Verify full validation`<br />**Workflow figlio:** nessuno<br />**Dimostra:** ricontrolla le conclusioni registrate delle esecuzioni figlio e aggiunge tabelle dei job più lenti dai workflow figlio.<br />**Riesecuzione:** riesegui solo questo job dopo aver rieseguito un figlio fallito fino al verde.                                                                                                                                       |

Per `ref=main` e `rerun_group=all`, un ombrello più recente sostituisce uno precedente.
Quando il padre viene annullato, il suo monitor annulla qualsiasi workflow figlio che ha già
inviato. Le esecuzioni di validazione di branch e tag di rilascio non si annullano a vicenda per
impostazione predefinita.

## Fasi dei controlli di rilascio

`OpenClaw Release Checks` è il workflow figlio più grande. Risolve il target
una sola volta e prepara un artefatto condiviso `release-package-under-test` quando le fasi rivolte
a pacchetti o Docker ne hanno bisogno.

| Fase                | Dettagli                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target del rilascio | **Processo:** `Resolve target ref`<br />**Flusso di lavoro di supporto:** nessuno<br />**Test:** riferimento selezionato, SHA previsto facoltativo, profilo, gruppo di riesecuzione e filtro mirato della suite live.<br />**Riesecuzione:** `rerun_group=release-checks`.                                                                                                                                                                                                                       |
| Artefatto pacchetto | **Processo:** `Prepare release package artifact`<br />**Flusso di lavoro di supporto:** nessuno<br />**Test:** crea i pacchetti o risolve un tarball candidato e carica `release-package-under-test` per i controlli downstream rivolti ai pacchetti.<br />**Riesecuzione:** il gruppo interessato per pacchetto, multipiattaforma o live/E2E.                                                                                                                                                 |
| Smoke di installazione | **Processo:** `Run install smoke`<br />**Flusso di lavoro di supporto:** `Install Smoke`<br />**Test:** percorso di installazione completo con riuso dell'immagine smoke del Dockerfile radice, installazione del pacchetto QR, smoke Docker radice e Gateway, test Docker dell'installer, smoke del provider di immagini con installazione globale Bun, ed E2E rapido di installazione/disinstallazione dei Plugin inclusi.<br />**Riesecuzione:** `rerun_group=install-smoke`.                 |
| Multipiattaforma    | **Processo:** `cross_os_release_checks`<br />**Flusso di lavoro di supporto:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Test:** corsie fresh e di aggiornamento su Linux, Windows e macOS per il provider e la modalità selezionati, usando il tarball candidato più un pacchetto baseline.<br />**Riesecuzione:** `rerun_group=cross-os`.                                                                                                                                           |
| E2E repo e live     | **Processo:** `Run repo/live E2E validation`<br />**Flusso di lavoro di supporto:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** E2E del repository, cache live, streaming websocket OpenAI, shard del provider live nativo e dei Plugin, e harness live basati su Docker per modello/backend/Gateway selezionati da `release_profile`.<br />**Esecuzioni:** `run_release_soak=true`, `release_profile=full` oppure `rerun_group=live-e2e` mirato.<br />**Riesecuzione:** `rerun_group=live-e2e`, facoltativamente con `live_suite_filter`. |
| Percorso di rilascio Docker | **Processo:** `Run Docker release-path validation`<br />**Flusso di lavoro di supporto:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** blocchi Docker del percorso di rilascio contro l'artefatto pacchetto condiviso.<br />**Esecuzioni:** `run_release_soak=true`, `release_profile=full` oppure `rerun_group=live-e2e` mirato.<br />**Riesecuzione:** `rerun_group=live-e2e`.                                                                                             |
| Accettazione pacchetto | **Processo:** `Run package acceptance`<br />**Flusso di lavoro di supporto:** `Package Acceptance`<br />**Test:** fixture offline dei pacchetti Plugin, aggiornamento Plugin, E2E canonico del pacchetto Telegram mock-OpenAI e controlli di sopravvivenza all'aggiornamento pubblicato contro lo stesso tarball. I controlli di rilascio bloccanti usano la baseline pubblicata più recente predefinita; i controlli soak si espandono a ogni rilascio npm stabile da `2026.4.23` incluso, più le fixture dei problemi segnalati.<br />**Riesecuzione:** `rerun_group=package`. |
| Parità QA           | **Processo:** `Run QA Lab parity lane` e `Run QA Lab parity report`<br />**Flusso di lavoro di supporto:** job diretti<br />**Test:** pacchetti di parità agentica candidato e baseline, poi il report di parità.<br />**Riesecuzione:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                                                                              |
| Matrix QA live      | **Processo:** `Run QA Lab live Matrix lane`<br />**Flusso di lavoro di supporto:** job diretto<br />**Test:** profilo QA Matrix live rapido nell'ambiente `qa-live-shared`.<br />**Riesecuzione:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                        |
| Telegram QA live    | **Processo:** `Run QA Lab live Telegram lane`<br />**Flusso di lavoro di supporto:** job diretto<br />**Test:** QA Telegram live con lease delle credenziali Convex CI.<br />**Riesecuzione:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                           |
| Verificatore del rilascio | **Processo:** `Verify release checks`<br />**Flusso di lavoro di supporto:** nessuno<br />**Test:** job dei controlli di rilascio richiesti per il gruppo di riesecuzione selezionato.<br />**Riesecuzione:** rieseguire dopo il superamento dei job figli mirati.                                                                                                                                                                                                                                |

## Blocchi del percorso di rilascio Docker

La fase del percorso di rilascio Docker esegue questi blocchi quando
`live_suite_filter` è vuoto:

| Blocco                                                          | Copertura                                                                                                                  |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Corsie smoke principali del percorso di rilascio Docker.                                                                   |
| `package-update-openai`                                         | Comportamento di installazione/aggiornamento del pacchetto OpenAI, installazione Codex on demand, turn live del Plugin Codex e chiamate agli strumenti Chat Completions. |
| `package-update-anthropic`                                      | Comportamento di installazione e aggiornamento del pacchetto Anthropic.                                                    |
| `package-update-core`                                           | Comportamento di pacchetto e aggiornamento neutrale rispetto al provider.                                                  |
| `plugins-runtime-plugins`                                       | Corsie di runtime dei Plugin che esercitano il comportamento dei Plugin.                                                   |
| `plugins-runtime-services`                                      | Corsie di runtime dei Plugin basate su servizi e live; include OpenWebUI quando richiesto.                                |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Batch di installazione/runtime dei Plugin suddivisi per la validazione parallela del rilascio.                             |

Usa `docker_lanes=<lane[,lane]>` mirato sul flusso di lavoro live/E2E riutilizzabile quando
è fallita una sola corsia Docker. Gli artefatti di rilascio includono comandi di
riesecuzione per corsia con artefatto pacchetto e input di riuso immagine quando disponibili.

## Profili di rilascio

`release_profile` controlla principalmente l'ampiezza live/provider all'interno dei controlli di rilascio.
Non rimuove la normale CI completa, la prerelease dei Plugin, lo smoke di installazione, l'accettazione
dei pacchetti o QA Lab. I profili stable e full eseguono sempre copertura esaustiva
E2E repo/live e soak del percorso di rilascio Docker. Il profilo beta può aderire con
`run_release_soak=true`. Package Acceptance fornisce l'E2E canonico del pacchetto
Telegram per ogni candidato full, quindi l'ombrello non duplica quel poller live.

| Profilo   | Uso previsto                      | Copertura live/provider inclusa                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke più rapido critico per il rilascio. | Percorso live OpenAI/core, modelli live Docker per OpenAI, Gateway core nativo, profilo Gateway OpenAI nativo, Plugin OpenAI nativo e Gateway live Docker OpenAI.                  |
| `stable`  | Profilo predefinito di approvazione del rilascio. | `minimum` più smoke Anthropic, Google, MiniMax, backend, harness di test live nativo, backend CLI live Docker, bind ACP Docker, harness Codex Docker e uno shard smoke OpenCode Go. |
| `full`    | Sweep consultivo ampio.           | `stable` più provider consultivi, shard live dei Plugin e shard live media.                                                                                                        |

## Aggiunte solo full

Queste suite sono saltate da `stable` e incluse da `full`:

| Area                             | Copertura solo full                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Modelli live Docker              | OpenCode Go, OpenRouter, xAI, Z.ai e Fireworks.                                                                              |
| Gateway live Docker              | Provider consultivi suddivisi negli shard DeepSeek/Fireworks, OpenCode Go/OpenRouter e xAI/Z.ai.                            |
| Profili provider Gateway nativi  | Shard Anthropic Opus e Sonnet/Haiku completi, Fireworks, DeepSeek, shard completi dei modelli OpenCode Go, OpenRouter, xAI e Z.ai. |
| Shard live dei Plugin nativi     | Plugin A-K, L-N, O-Z altri, Moonshot e xAI.                                                                                 |
| Shard live media nativi          | Audio, musica Google, musica MiniMax e gruppi video A-D.                                                                     |

`stable` include `native-live-src-gateway-profiles-anthropic-smoke` e
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` usa invece gli shard
più ampi dei modelli Anthropic e OpenCode Go. Le riesecuzioni mirate possono comunque usare gli
handle aggregati `native-live-src-gateway-profiles-anthropic` o
`native-live-src-gateway-profiles-opencode-go`.

## Riesecuzioni mirate

Usa `rerun_group` per evitare di ripetere box di release non correlati:

| Handle              | Ambito                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Tutte le fasi di Validazione completa della release.                                            |
| `ci`                | Solo il processo figlio della CI completa manuale.                                              |
| `plugin-prerelease` | Solo il processo figlio Plugin Prerelease.                                                      |
| `release-checks`    | Tutte le fasi dei controlli di release di OpenClaw.                                             |
| `install-smoke`     | Install Smoke attraverso i controlli di release.                                                |
| `cross-os`          | Controlli di release Cross-OS.                                                                  |
| `live-e2e`          | Validazione E2E repo/live e del percorso di release Docker.                                     |
| `package`           | Accettazione del pacchetto.                                                                     |
| `qa`                | Parità QA più corsie QA live.                                                                   |
| `qa-parity`         | Solo corsie e report di parità QA.                                                              |
| `qa-live`           | Matrix/Telegram QA live più corsie Discord, WhatsApp e Slack con gate quando abilitate.         |
| `npm-telegram`      | E2E Telegram del pacchetto pubblicato; richiede `release_package_spec` o `npm_telegram_package_spec`. |

Usa `live_suite_filter` con `rerun_group=live-e2e` quando una singola suite live non è riuscita.
Gli id filtro validi sono definiti nel workflow riutilizzabile live/E2E, inclusi
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` e
`live-codex-harness-docker`.

L'handle `live-gateway-advisory-docker` è un handle di riesecuzione aggregato per i suoi
tre shard provider, quindi esegue comunque il fan-out verso tutti i job advisory del gateway Docker.

Usa `cross_os_suite_filter` con `rerun_group=cross-os` quando una singola corsia cross-OS
non è riuscita. Il filtro accetta un id OS, un id suite o una coppia OS/suite, per
esempio `windows/packaged-upgrade`, `windows` o `packaged-fresh`. I riepiloghi cross-OS
includono tempi per fase per le corsie di upgrade pacchettizzato, e i comandi di lunga durata
stampano righe di heartbeat così un aggiornamento Windows bloccato è visibile prima del
timeout del job.

Gli errori dei controlli QA di release bloccano la normale validazione della release. Anche la deriva
richiesta degli strumenti dinamici OpenClaw nel livello standard blocca il verificatore dei controlli di release.
Le esecuzioni alpha Tideclaw possono comunque trattare le corsie dei controlli di release non legate alla
sicurezza del pacchetto come advisory. Quando `live_suite_filter` richiede esplicitamente una corsia QA live con gate,
come Discord, WhatsApp o Slack, la variabile repo corrispondente
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` deve essere abilitata; altrimenti
l'acquisizione dell'input fallisce invece di saltare silenziosamente la corsia. Riesegui `rerun_group=qa`,
`qa-parity` o `qa-live` quando hai bisogno di nuove evidenze QA.

## Evidenze da conservare

Conserva il riepilogo `Full Release Validation` come indice a livello di release. Collega
gli id delle esecuzioni figlie e include tabelle dei job più lenti. In caso di errori, ispeziona prima il workflow
figlio, poi riesegui l'handle corrispondente più piccolo sopra.

Artefatti utili:

- `release-package-under-test` da `OpenClaw Release Checks`
- Artefatti del percorso di release Docker sotto `.artifacts/docker-tests/`
- Artefatti `package-under-test` di Accettazione del pacchetto e artefatti di accettazione Docker
- Artefatti dei controlli di release Cross-OS per ogni OS e suite
- Artefatti di parità QA, Matrix e Telegram

## File di workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
