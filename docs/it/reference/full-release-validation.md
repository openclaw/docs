---
read_when:
    - Esecuzione o riesecuzione della convalida completa del rilascio
    - Confronto tra i profili di validazione del rilascio stabile e completo
    - Debug degli errori nella fase di convalida del rilascio
summary: Fasi della Validazione completa della release, workflow figli, profili di release, handle di riesecuzione ed evidenze
title: Validazione completa della release
x-i18n:
    generated_at: "2026-05-05T01:49:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cf696761f516fc7f8e9606a2a06fab61a644731330eb484a388f276767a9e0d
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` è il workflow ombrello della release. È l'unico punto di ingresso manuale
per la prova pre-release, ma la maggior parte del lavoro avviene nei workflow figli, così una
box non riuscita può essere rieseguita senza riavviare l'intera release.

Eseguilo da un riferimento di workflow attendibile, normalmente `main`, e passa il branch di release,
il tag o lo SHA completo del commit come `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

I workflow figli usano il riferimento di workflow attendibile per l'harness e l'input
`ref` per il candidato in test. Questo mantiene disponibile la nuova logica di validazione
quando si valida un branch o un tag di release meno recente.

Per impostazione predefinita, `release_profile=stable` esegue le lane bloccanti per la release e salta
il soak live/Docker esaustivo. Passa `run_release_soak=true` per includere le
lane di soak in un'esecuzione stabile. `release_profile=full` abilita sempre le lane di soak, così
il profilo consultivo ampio non perde mai copertura silenziosamente.

Package Acceptance normalmente crea il tarball candidato dal
`ref` risolto, incluse le esecuzioni con SHA completo avviate con `pnpm ci:full-release`. Dopo
la pubblicazione, passa `package_acceptance_package_spec=openclaw@YYYY.M.D` (o
`openclaw@beta`/`openclaw@latest`) per eseguire invece la stessa matrice package/aggiornamento contro
il pacchetto npm distribuito.

## Fasi di livello superiore

| Fase                 | Dettagli                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Risoluzione target   | **Job:** `Resolve target ref`<br />**Workflow figlio:** nessuno<br />**Dimostra:** risolve il branch di release, il tag o lo SHA completo del commit e registra gli input selezionati.<br />**Riesecuzione:** riesegui l'ombrello se questo fallisce.                                                                                                                                                                                          |
| Vitest e CI normale  | **Job:** `Run normal full CI`<br />**Workflow figlio:** `CI`<br />**Dimostra:** grafo CI completo manuale contro il ref target, incluse le lane Linux Node, gli shard dei Plugin in bundle, i contratti dei canali, la compatibilità Node 22, `check`, `check-additional`, smoke della build, controlli docs, Skills Python, Windows, macOS, i18n della Control UI e Android tramite l'ombrello.<br />**Riesecuzione:** `rerun_group=ci`.        |
| Prerelease Plugin    | **Job:** `Run plugin prerelease validation`<br />**Workflow figlio:** `Plugin Prerelease`<br />**Dimostra:** controlli statici dei Plugin solo per release, copertura Plugin agentica, shard batch completi delle estensioni e lane Docker di prerelease Plugin.<br />**Riesecuzione:** `rerun_group=plugin-prerelease`.                                                                                                                        |
| Controlli release    | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow figlio:** `OpenClaw Release Checks`<br />**Dimostra:** smoke di installazione, controlli package cross-OS, Package Acceptance, parità QA Lab, Matrix live e Telegram live. Con `run_release_soak=true` o `release_profile=full`, esegue anche suite live/E2E esaustive e chunk del percorso di release Docker.<br />**Riesecuzione:** `rerun_group=release-checks` o un handle release-checks più ristretto. |
| Artefatto package    | **Job:** `Prepare release package artifact`<br />**Workflow figlio:** nessuno<br />**Dimostra:** crea il tarball padre `release-package-under-test` abbastanza presto per i controlli rivolti ai package che non devono attendere `OpenClaw Release Checks`.<br />**Riesecuzione:** riesegui l'ombrello o fornisci `npm_telegram_package_spec` per `rerun_group=npm-telegram`.                                                                   |
| Telegram package     | **Job:** `Run package Telegram E2E`<br />**Workflow figlio:** `NPM Telegram Beta E2E`<br />**Dimostra:** prova del package Telegram basata sull'artefatto padre per `rerun_group=all` con `release_profile=full`, oppure prova Telegram del package pubblicato quando `npm_telegram_package_spec` è impostato.<br />**Riesecuzione:** `rerun_group=npm-telegram` con `npm_telegram_package_spec`.                                             |
| Verificatore ombrello | **Job:** `Verify full validation`<br />**Workflow figlio:** nessuno<br />**Dimostra:** ricontrolla le conclusioni registrate delle esecuzioni figlie e aggiunge le tabelle dei job più lenti dai workflow figli.<br />**Riesecuzione:** riesegui solo questo job dopo aver rieseguito un figlio fallito fino al verde.                                                                                                                          |

Per `ref=main` e `rerun_group=all`, un ombrello più recente sostituisce uno più vecchio.
Quando il padre viene annullato, il suo monitor annulla qualsiasi workflow figlio che ha già
avviato. Le esecuzioni di validazione di branch e tag di release non si annullano a vicenda per
impostazione predefinita.

## Fasi dei controlli release

`OpenClaw Release Checks` è il workflow figlio più grande. Risolve il target
una volta e prepara un artefatto condiviso `release-package-under-test` quando le fasi rivolte ai package
o a Docker ne hanno bisogno.

| Fase                | Dettagli                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target di rilascio  | **Job:** `Resolve target ref`<br />**Workflow sottostante:** nessuno<br />**Test:** ref selezionato, SHA previsto opzionale, profilo, gruppo di riesecuzione e filtro mirato della suite live.<br />**Riesecuzione:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                       |
| Artefatto pacchetto | **Job:** `Prepare release package artifact`<br />**Workflow sottostante:** nessuno<br />**Test:** crea o risolve un tarball candidato e carica `release-package-under-test` per i controlli successivi rivolti ai pacchetti.<br />**Riesecuzione:** il gruppo pacchetto, cross-OS o live/E2E interessato.                                                                                                                                                                                                                                |
| Smoke di installazione | **Job:** `Run install smoke`<br />**Workflow sottostante:** `Install Smoke`<br />**Test:** percorso di installazione completo con riutilizzo dell'immagine smoke Dockerfile root, installazione pacchetto QR, smoke Docker root e Gateway, test Docker dell'installer, smoke del provider di immagini con installazione globale Bun ed E2E rapido di installazione/disinstallazione dei plugin in bundle.<br />**Riesecuzione:** `rerun_group=install-smoke`.                                                                      |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Workflow sottostante:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Test:** corsie fresh e di upgrade su Linux, Windows e macOS per il provider e la modalità selezionati, usando il tarball candidato più un pacchetto di baseline.<br />**Riesecuzione:** `rerun_group=cross-os`.                                                                                                                                                                                                  |
| Repo e live E2E     | **Job:** `Run repo/live E2E validation`<br />**Workflow sottostante:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** E2E del repository, cache live, streaming websocket OpenAI, shard di provider live nativi e plugin, e harness live basati su Docker per modello/backend/Gateway selezionati da `release_profile`.<br />**Esecuzioni:** `run_release_soak=true`, `release_profile=full` o `rerun_group=live-e2e` mirato.<br />**Riesecuzione:** `rerun_group=live-e2e`, facoltativamente con `live_suite_filter`. |
| Percorso di rilascio Docker | **Job:** `Run Docker release-path validation`<br />**Workflow sottostante:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** chunk Docker del percorso di rilascio contro l'artefatto pacchetto condiviso.<br />**Esecuzioni:** `run_release_soak=true`, `release_profile=full` o `rerun_group=live-e2e` mirato.<br />**Riesecuzione:** `rerun_group=live-e2e`.                                                                                                         |
| Accettazione pacchetto | **Job:** `Run package acceptance`<br />**Workflow sottostante:** `Package Acceptance`<br />**Test:** fixture offline di pacchetti plugin, aggiornamento plugin, accettazione del pacchetto mock-OpenAI Telegram e controlli di sopravvivenza all'upgrade pubblicato contro lo stesso tarball. I controlli di rilascio bloccanti usano la baseline predefinita dell'ultima versione pubblicata; i controlli soak si estendono a ogni release npm stabile a partire da `2026.4.23` inclusa, più le fixture dei problemi segnalati.<br />**Riesecuzione:** `rerun_group=package`. |
| Parità QA           | **Job:** `Run QA Lab parity lane` e `Run QA Lab parity report`<br />**Workflow sottostante:** job diretti<br />**Test:** pacchetti di parità agentica candidato e baseline, quindi il report di parità.<br />**Riesecuzione:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                                                                 |
| Matrix live QA      | **Job:** `Run QA Lab live Matrix lane`<br />**Workflow sottostante:** job diretto<br />**Test:** profilo QA Matrix live rapido nell'ambiente `qa-live-shared`.<br />**Riesecuzione:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                             |
| Telegram live QA    | **Job:** `Run QA Lab live Telegram lane`<br />**Workflow sottostante:** job diretto<br />**Test:** QA Telegram live con lease delle credenziali Convex CI.<br />**Riesecuzione:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                |
| Verificatore di rilascio | **Job:** `Verify release checks`<br />**Workflow sottostante:** nessuno<br />**Test:** job di controllo del rilascio richiesti per il gruppo di riesecuzione selezionato.<br />**Riesecuzione:** rieseguire dopo che i job figli mirati sono passati.                                                                                                                                                                                                                   |

## Chunk del percorso di rilascio Docker

La fase del percorso di rilascio Docker esegue questi chunk quando `live_suite_filter` è
vuoto:

| Chunk                                                           | Copertura                                                               |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Corsie smoke del percorso di rilascio Docker core.                      |
| `package-update-openai`                                         | Comportamento di installazione e aggiornamento del pacchetto OpenAI.    |
| `package-update-anthropic`                                      | Comportamento di installazione e aggiornamento del pacchetto Anthropic. |
| `package-update-core`                                           | Comportamento di pacchetto e aggiornamento neutrale rispetto al provider. |
| `plugins-runtime-plugins`                                       | Corsie runtime dei plugin che esercitano il comportamento dei plugin.   |
| `plugins-runtime-services`                                      | Corsie runtime dei plugin supportate da servizi; include OpenWebUI quando richiesto. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Batch di installazione/runtime dei plugin divisi per la validazione parallela del rilascio. |

Usa `docker_lanes=<lane[,lane]>` mirato sul workflow live/E2E riutilizzabile quando
è fallita una sola corsia Docker. Gli artefatti di rilascio includono comandi di
riesecuzione per corsia con input di riutilizzo dell'artefatto pacchetto e dell'immagine quando disponibili.

## Profili di rilascio

`release_profile` controlla principalmente l'ampiezza live/provider all'interno dei controlli di rilascio.
Non rimuove la normale CI completa, il pre-rilascio Plugin, lo smoke di installazione, l'accettazione
pacchetto o QA Lab. Per `stable`, E2E repo/live esaustivi e chunk del percorso di rilascio
Docker sono copertura soak e vengono eseguiti quando `run_release_soak=true`.
`full` forza l'attivazione della copertura soak e fa anche eseguire al run ombrello l'E2E
del pacchetto Telegram contro l'artefatto pacchetto del rilascio padre quando `rerun_group=all`, così un candidato
completo pre-pubblicazione non salta silenziosamente quella corsia del pacchetto Telegram.

| Profilo   | Uso previsto                     | Copertura live/provider inclusa                                                                                                                                                    |
| --------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke più rapido critico per il rilascio. | Percorso live OpenAI/core, modelli live Docker per OpenAI, core del Gateway nativo, profilo Gateway OpenAI nativo, plugin OpenAI nativo e Gateway live Docker OpenAI. |
| `stable`  | Profilo predefinito di approvazione del rilascio. | `minimum` più smoke Anthropic, Google, MiniMax, backend, harness di test live nativo, backend CLI live Docker, bind ACP Docker, harness Codex Docker e uno shard smoke OpenCode Go. |
| `full`    | Sweep consultivo ampio.          | `stable` più provider consultivi, shard live dei plugin e shard live multimediali.                                                                                                  |

## Aggiunte solo full

Queste suite vengono saltate da `stable` e incluse da `full`:

| Area                             | Copertura solo full                                                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Modelli live Docker              | OpenCode Go, OpenRouter, xAI, Z.ai e Fireworks.                                                                             |
| Gateway live Docker              | Provider consultivi divisi in shard DeepSeek/Fireworks, OpenCode Go/OpenRouter e xAI/Z.ai.                                  |
| Profili provider Gateway nativo  | Shard Anthropic Opus e Sonnet/Haiku completi, Fireworks, DeepSeek, shard completi del modello OpenCode Go, OpenRouter, xAI e Z.ai. |
| Shard live dei plugin nativi     | Plugin A-K, L-N, O-Z altri, Moonshot e xAI.                                                                                 |
| Shard live multimediali nativi   | Audio, musica Google, musica MiniMax e gruppi video A-D.                                                                    |

`stable` include `native-live-src-gateway-profiles-anthropic-smoke` e
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` usa invece gli shard
più ampi dei modelli Anthropic e OpenCode Go. Le riesecuzioni mirate possono comunque usare gli
handle aggregati `native-live-src-gateway-profiles-anthropic` o
`native-live-src-gateway-profiles-opencode-go`.

## Riesecuzioni mirate

Usa `rerun_group` per evitare di ripetere box di rilascio non correlati:

| Identificativo      | Ambito                                                                |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Tutte le fasi di Full Release Validation.                             |
| `ci`                | Solo il child CI completo manuale.                                    |
| `plugin-prerelease` | Solo il child Plugin Prerelease.                                      |
| `release-checks`    | Tutte le fasi di OpenClaw Release Checks.                             |
| `install-smoke`     | Install Smoke attraverso i controlli di rilascio.                     |
| `cross-os`          | Controlli di rilascio cross-OS.                                       |
| `live-e2e`          | Validazione E2E repo/live e del percorso di rilascio Docker.          |
| `package`           | Package Acceptance.                                                   |
| `qa`                | Parità QA più lane live QA.                                           |
| `qa-parity`         | Solo lane e report di parità QA.                                      |
| `qa-live`           | Solo Matrix live QA e Telegram.                                       |
| `npm-telegram`      | E2E Telegram del pacchetto pubblicato; richiede `npm_telegram_package_spec`. |

Usa `live_suite_filter` con `rerun_group=live-e2e` quando una suite live non è riuscita.
Gli id filtro validi sono definiti nel workflow live/E2E riutilizzabile, inclusi
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` e
`live-codex-harness-docker`.

L'handle `live-gateway-advisory-docker` è un handle di riesecuzione aggregato per i suoi
tre shard provider, quindi continua a ramificarsi verso tutti i job Gateway Docker consultivi.

Usa `cross_os_suite_filter` con `rerun_group=cross-os` quando una lane cross-OS
non è riuscita. Il filtro accetta un id OS, un id suite o una coppia OS/suite, per
esempio `windows/packaged-upgrade`, `windows` o `packaged-fresh`. I riepiloghi cross-OS
includono i tempi per fase per le lane di upgrade pacchettizzate, e i comandi di lunga durata
stampano righe Heartbeat così un aggiornamento Windows bloccato è visibile prima del
timeout del job.

Le lane QA dei release-check sono consultive. Un errore solo QA viene segnalato come avviso
e non blocca il verificatore release-check; riesegui `rerun_group=qa`,
`qa-parity` o `qa-live` quando ti servono prove QA aggiornate.

## Prove da conservare

Conserva il riepilogo `Full Release Validation` come indice a livello di rilascio. Collega
gli id delle esecuzioni child e include tabelle dei job più lenti. In caso di errori, ispeziona prima il workflow
child, poi riesegui l'handle corrispondente più piccolo sopra.

Artifact utili:

- `release-package-under-test` dal parent Full Release Validation e `OpenClaw Release Checks`
- Artifact del percorso di rilascio Docker sotto `.artifacts/docker-tests/`
- `package-under-test` di Package Acceptance e artifact di accettazione Docker
- Artifact dei release-check cross-OS per ogni OS e suite
- Artifact di parità QA, Matrix e Telegram

## File di workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
