---
read_when:
    - Esecuzione o riesecuzione della convalida completa della release
    - Confronto tra i profili stabile e completo per la convalida delle release
    - Risoluzione dei problemi relativi agli errori nella fase di convalida del rilascio
summary: Fasi della Validazione completa del rilascio, flussi di lavoro figli, profili di rilascio, identificatori di riesecuzione e prove
title: Validazione completa della release
x-i18n:
    generated_at: "2026-05-11T20:35:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d83d15272e4f7cff82ef791c8dbeb6adc447626ada8ae221d074ee16b2cadd5
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` è il processo ombrello di rilascio. È l’unico
punto di ingresso manuale per la prova pre-release, ma la maggior parte del
lavoro avviene in workflow figli, così un ambiente non riuscito può essere
rieseguito senza riavviare l’intero rilascio.

Eseguilo da un riferimento di workflow attendibile, normalmente `main`, e passa
il branch di rilascio, il tag o lo SHA completo del commit come `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

I workflow figli usano il riferimento di workflow attendibile per l’harness e
l’input `ref` per il candidato in test. Questo mantiene disponibile la nuova
logica di validazione quando si valida un branch o un tag di rilascio precedente.

Per impostazione predefinita, `release_profile=stable` esegue le lane bloccanti
per il rilascio e salta il soak live/Docker esaustivo. Passa
`run_release_soak=true` per includere le lane di soak in un’esecuzione stabile.
`release_profile=full` abilita sempre le lane di soak, così il profilo
consultivo ampio non perde mai copertura in modo silenzioso.

Package Acceptance normalmente crea il tarball candidato dal `ref` risolto,
incluse le esecuzioni con SHA completo avviate con `pnpm ci:full-release`. Dopo
la pubblicazione di una beta, passa `release_package_spec=openclaw@YYYY.M.D-beta.N`
per riusare il pacchetto npm distribuito tra i controlli di rilascio, Package
Acceptance, cross-OS, Docker del percorso di rilascio e package Telegram. Usa
`package_acceptance_package_spec` solo quando Package Acceptance deve dimostrare
intenzionalmente un pacchetto diverso.

## Fasi di primo livello

| Fase                 | Dettagli                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Risoluzione target   | **Job:** `Resolve target ref`<br />**Workflow figlio:** nessuno<br />**Dimostra:** risolve il branch di rilascio, il tag o lo SHA completo del commit e registra gli input selezionati.<br />**Riesecuzione:** riesegui l’ombrello se fallisce.                                                                                                                                                                                             |
| Vitest e CI normale  | **Job:** `Run normal full CI`<br />**Workflow figlio:** `CI`<br />**Dimostra:** grafo CI completo manuale rispetto al riferimento target, incluse lane Linux Node, shard dei Plugin inclusi, contratti di canale, compatibilità Node 22, `check`, `check-additional`, smoke di build, controlli docs, Skills Python, Windows, macOS, i18n della Control UI e Android tramite l’ombrello.<br />**Riesecuzione:** `rerun_group=ci`.         |
| Pre-release Plugin   | **Job:** `Run plugin prerelease validation`<br />**Workflow figlio:** `Plugin Prerelease`<br />**Dimostra:** controlli statici Plugin solo di rilascio, copertura agentica dei Plugin, shard batch completi delle estensioni, lane Docker di pre-release Plugin e un artefatto non bloccante `plugin-inspector-advisory` per il triage di compatibilità.<br />**Riesecuzione:** `rerun_group=plugin-prerelease`.                    |
| Controlli rilascio   | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow figlio:** `OpenClaw Release Checks`<br />**Dimostra:** smoke di installazione, controlli pacchetto cross-OS, Package Acceptance, parità QA Lab, Matrix live e Telegram live. Con `run_release_soak=true` o `release_profile=full`, esegue anche suite live/E2E esaustive e chunk Docker del percorso di rilascio.<br />**Riesecuzione:** `rerun_group=release-checks` o un handle release-checks più ristretto. |
| Artefatto pacchetto  | **Job:** `Prepare release package artifact`<br />**Workflow figlio:** nessuno<br />**Dimostra:** crea il tarball padre `release-package-under-test` abbastanza presto per i controlli rivolti ai pacchetti che non devono attendere `OpenClaw Release Checks`.<br />**Riesecuzione:** riesegui l’ombrello o fornisci `release_package_spec` per le riesecuzioni con pacchetto pubblicato.                                      |
| Package Telegram     | **Job:** `Run package Telegram E2E`<br />**Workflow figlio:** `NPM Telegram Beta E2E`<br />**Dimostra:** prova del pacchetto Telegram basata sull’artefatto padre per `rerun_group=all` con `release_profile=full`, oppure prova Telegram del pacchetto pubblicato quando `release_package_spec` o `npm_telegram_package_spec` è impostato.<br />**Riesecuzione:** `rerun_group=npm-telegram` con `release_package_spec` o `npm_telegram_package_spec`. |
| Verificatore ombrello | **Job:** `Verify full validation`<br />**Workflow figlio:** nessuno<br />**Dimostra:** ricontrolla le conclusioni registrate delle esecuzioni figlie e aggiunge tabelle dei job più lenti dai workflow figli.<br />**Riesecuzione:** riesegui solo questo job dopo aver riportato a verde un figlio fallito.                                                                                                                                 |

Per `ref=main` e `rerun_group=all`, un ombrello più recente sostituisce uno più
vecchio. Quando il padre viene annullato, il suo monitor annulla qualsiasi
workflow figlio che ha già avviato. Le esecuzioni di validazione di branch e tag
di rilascio non si annullano tra loro per impostazione predefinita.

## Fasi dei controlli di rilascio

`OpenClaw Release Checks` è il workflow figlio più grande. Risolve il target una
sola volta e prepara un artefatto condiviso `release-package-under-test` quando
le fasi rivolte ai pacchetti o a Docker ne hanno bisogno.

| Fase                | Dettagli                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Destinazione release | **Job:** `Resolve target ref`<br />**Workflow di supporto:** nessuno<br />**Test:** ref selezionato, SHA previsto opzionale, profilo, gruppo di riesecuzione e filtro mirato della suite live.<br />**Riesecuzione:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                |
| Artefatto pacchetto | **Job:** `Prepare release package artifact`<br />**Workflow di supporto:** nessuno<br />**Test:** crea il pacchetto o risolve un tarball candidato e carica `release-package-under-test` per i controlli successivi rivolti al pacchetto.<br />**Riesecuzione:** il pacchetto interessato, il gruppo cross-OS o live/E2E.                                                                                                                                                                       |
| Smoke installazione | **Job:** `Run install smoke`<br />**Workflow di supporto:** `Install Smoke`<br />**Test:** percorso di installazione completo con riuso dell'immagine smoke del Dockerfile root, installazione pacchetto QR, smoke Docker root e Gateway, test Docker dell'installer, smoke del provider di immagini con installazione globale Bun ed E2E rapido di installazione/disinstallazione dei Plugin in bundle.<br />**Riesecuzione:** `rerun_group=install-smoke`.                                      |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Workflow di supporto:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Test:** corsie fresh e upgrade su Linux, Windows e macOS per il provider e la modalità selezionati, usando il tarball candidato più un pacchetto baseline.<br />**Riesecuzione:** `rerun_group=cross-os`.                                                                                                                                                                |
| Repo e live E2E     | **Job:** `Run repo/live E2E validation`<br />**Workflow di supporto:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** E2E del repository, cache live, streaming websocket OpenAI, shard nativi di provider live e Plugin, e harness live con modello/backend/Gateway basati su Docker selezionati da `release_profile`.<br />**Esecuzioni:** `run_release_soak=true`, `release_profile=full` o `rerun_group=live-e2e` mirato.<br />**Riesecuzione:** `rerun_group=live-e2e`, opzionalmente con `live_suite_filter`. |
| Percorso release Docker | **Job:** `Run Docker release-path validation`<br />**Workflow di supporto:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** chunk Docker del percorso release rispetto all'artefatto pacchetto condiviso.<br />**Esecuzioni:** `run_release_soak=true`, `release_profile=full` o `rerun_group=live-e2e` mirato.<br />**Riesecuzione:** `rerun_group=live-e2e`.                                                                                                                        |
| Accettazione pacchetto | **Job:** `Run package acceptance`<br />**Workflow di supporto:** `Package Acceptance`<br />**Test:** fixture offline dei pacchetti Plugin, aggiornamento Plugin, accettazione pacchetto Telegram con mock OpenAI e controlli di sopravvivenza all'upgrade pubblicato rispetto allo stesso tarball. I controlli release bloccanti usano la baseline pubblicata più recente predefinita; i controlli soak si estendono a ogni release npm stabile a partire da `2026.4.23` inclusa, più le fixture dei problemi segnalati.<br />**Riesecuzione:** `rerun_group=package`. |
| Parità QA           | **Job:** `Run QA Lab parity lane` e `Run QA Lab parity report`<br />**Workflow di supporto:** job diretti<br />**Test:** pack di parità agentic candidato e baseline, poi il report di parità.<br />**Riesecuzione:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                                                                                                  |
| Matrix live QA      | **Job:** `Run QA Lab live Matrix lane`<br />**Workflow di supporto:** job diretto<br />**Test:** profilo QA Matrix live rapido nell'ambiente `qa-live-shared`.<br />**Riesecuzione:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                                    |
| Telegram live QA    | **Job:** `Run QA Lab live Telegram lane`<br />**Workflow di supporto:** job diretto<br />**Test:** QA Telegram live con lease delle credenziali Convex CI.<br />**Riesecuzione:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                                       |
| Verificatore release | **Job:** `Verify release checks`<br />**Workflow di supporto:** nessuno<br />**Test:** job di controllo release richiesti per il gruppo di riesecuzione selezionato.<br />**Riesecuzione:** rieseguire dopo il superamento dei job figli mirati.                                                                                                                                                                                                                                                 |

## Chunk del percorso release Docker

La fase del percorso release Docker esegue questi chunk quando `live_suite_filter` è
vuoto:

| Chunk                                                           | Copertura                                                                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `core`                                                          | Corsie smoke del percorso release Docker core.                                                     |
| `package-update-openai`                                         | Comportamento di installazione/aggiornamento del pacchetto OpenAI, installazione on-demand di Codex e chiamate agli strumenti Chat Completions. |
| `package-update-anthropic`                                      | Comportamento di installazione e aggiornamento del pacchetto Anthropic.                            |
| `package-update-core`                                           | Comportamento di pacchetto e aggiornamento indipendente dal provider.                              |
| `plugins-runtime-plugins`                                       | Corsie di runtime Plugin che esercitano il comportamento dei Plugin.                               |
| `plugins-runtime-services`                                      | Corsie di runtime Plugin basate su servizi e live; include OpenWebUI quando richiesto.             |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Batch di installazione/runtime Plugin suddivisi per la validazione release parallela.              |

Usa `docker_lanes=<lane[,lane]>` mirato sul workflow live/E2E riutilizzabile quando
è fallita una sola corsia Docker. Gli artefatti release includono comandi di
riesecuzione per corsia con input per l'artefatto pacchetto e il riuso
dell'immagine quando disponibili.

## Profili release

`release_profile` controlla principalmente l'ampiezza live/provider dentro i controlli release.
Non rimuove la normale CI completa, Plugin Prerelease, smoke di installazione,
accettazione pacchetto o QA Lab. Per `stable`, gli E2E repo/live esaustivi e i
chunk del percorso release Docker sono copertura soak ed eseguono quando `run_release_soak=true`.
`full` forza la copertura soak e fa anche eseguire al run ombrello l'E2E Telegram
del pacchetto rispetto all'artefatto pacchetto release padre quando `rerun_group=all`, quindi un candidato
pre-pubblicazione completo non salta silenziosamente quella corsia pacchetto Telegram.

| Profilo   | Uso previsto                      | Copertura live/provider inclusa                                                                                                                                                    |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke release-critical più rapido. | Percorso live OpenAI/core, modelli live Docker per OpenAI, core Gateway nativo, profilo Gateway OpenAI nativo, Plugin OpenAI nativo e Gateway live Docker OpenAI.                  |
| `stable`  | Profilo predefinito di approvazione release. | `minimum` più smoke Anthropic, Google, MiniMax, backend, harness di test live nativo, backend CLI live Docker, bind Docker ACP, harness Docker Codex e uno shard smoke OpenCode Go. |
| `full`    | Sweep consultivo ampio.           | `stable` più provider consultivi, shard live Plugin e shard live media.                                                                                                             |

## Aggiunte solo full

Queste suite sono saltate da `stable` e incluse da `full`:

| Area                             | Copertura solo full                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Modelli live Docker              | OpenCode Go, OpenRouter, xAI, Z.ai e Fireworks.                                                                          |
| Gateway live Docker              | Provider consultivi suddivisi in shard DeepSeek/Fireworks, OpenCode Go/OpenRouter e xAI/Z.ai.                           |
| Profili provider Gateway nativi  | Shard completi Anthropic Opus e Sonnet/Haiku, Fireworks, DeepSeek, shard completi del modello OpenCode Go, OpenRouter, xAI e Z.ai. |
| Shard live Plugin nativi         | Plugin A-K, L-N, O-Z altri, Moonshot e xAI.                                                                              |
| Shard live media nativi          | Gruppi audio, Google music, MiniMax music e video A-D.                                                                   |

`stable` include `native-live-src-gateway-profiles-anthropic-smoke` e
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` usa invece gli shard
più ampi dei modelli Anthropic e OpenCode Go. Le riesecuzioni mirate possono comunque usare gli handle
aggregati `native-live-src-gateway-profiles-anthropic` o
`native-live-src-gateway-profiles-opencode-go`.

## Riesecuzioni mirate

Usa `rerun_group` per evitare di ripetere box release non correlati:

| Handle              | Ambito                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Tutte le fasi di Full Release Validation.                                                       |
| `ci`                | Solo il figlio CI completo manuale.                                                             |
| `plugin-prerelease` | Solo il figlio Plugin Prerelease.                                                               |
| `release-checks`    | Tutte le fasi di OpenClaw Release Checks.                                                       |
| `install-smoke`     | Install Smoke tramite i controlli di rilascio.                                                  |
| `cross-os`          | Controlli di rilascio Cross-OS.                                                                 |
| `live-e2e`          | Validazione Repo/live E2E e del percorso di rilascio Docker.                                    |
| `package`           | Package Acceptance.                                                                             |
| `qa`                | Parità QA più corsie QA live.                                                                   |
| `qa-parity`         | Solo corsie e report di parità QA.                                                              |
| `qa-live`           | Solo Matrix e Telegram QA live.                                                                 |
| `npm-telegram`      | E2E Telegram del pacchetto pubblicato; richiede `release_package_spec` o `npm_telegram_package_spec`. |

Usa `live_suite_filter` con `rerun_group=live-e2e` quando una suite live non è riuscita.
Gli id filtro validi sono definiti nel workflow live/E2E riutilizzabile, inclusi
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` e
`live-codex-harness-docker`.

L'handle `live-gateway-advisory-docker` è un handle di riesecuzione aggregato per i suoi
tre shard provider, quindi si espande comunque a tutti i job Gateway Docker advisory.

Usa `cross_os_suite_filter` con `rerun_group=cross-os` quando una corsia Cross-OS
non è riuscita. Il filtro accetta un id OS, un id suite o una coppia OS/suite, per
esempio `windows/packaged-upgrade`, `windows` o `packaged-fresh`. I riepiloghi Cross-OS
includono tempi per fase per le corsie di upgrade pacchettizzato, e i comandi di lunga durata
stampano righe Heartbeat così un aggiornamento Windows bloccato è visibile prima del
timeout del job.

Le corsie QA release-check sono advisory. Un errore solo QA viene riportato come avviso
e non blocca il verificatore release-check; riesegui `rerun_group=qa`,
`qa-parity` o `qa-live` quando hai bisogno di nuove evidenze QA.

## Evidenze da conservare

Conserva il riepilogo `Full Release Validation` come indice a livello di rilascio. Collega
gli id delle esecuzioni figlie e include tabelle dei job più lenti. Per gli errori, ispeziona prima il
workflow figlio, poi riesegui il più piccolo handle corrispondente sopra.

Artefatti utili:

- `release-package-under-test` dal parent Full Release Validation e `OpenClaw Release Checks`
- Artefatti Docker del percorso di rilascio in `.artifacts/docker-tests/`
- `package-under-test` di Package Acceptance e artefatti di accettazione Docker
- Artefatti release-check Cross-OS per ogni OS e suite
- Artefatti di parità QA, Matrix e Telegram

## File workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
