---
read_when:
    - Esecuzione o riesecuzione della convalida completa del rilascio
    - Confronto tra i profili stabile e completo di convalida delle release
    - Debug degli errori nella fase di convalida del rilascio
summary: Fasi di Validazione completa del rilascio, workflow figli, profili di rilascio, handle di riesecuzione ed evidenze
title: Validazione completa del rilascio
x-i18n:
    generated_at: "2026-05-01T08:33:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcbfafd744437c160c09a9c508a639781549193669b300e5249023f9f5dd4afe
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` è l’ombrello di release. È l’unico entrypoint manuale
per la prova pre-release, ma la maggior parte del lavoro avviene nei workflow
figli, così un box non riuscito può essere rieseguito senza riavviare l’intera release.

Eseguilo da un ref di workflow attendibile, normalmente `main`, e passa il branch,
il tag o lo SHA completo del commit della release come `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

I workflow figli usano il ref di workflow attendibile per l’harness e l’input
`ref` per il candidato in test. Questo mantiene disponibile la nuova logica di
validazione quando si valida un branch o tag di release precedente.

## Fasi di primo livello

| Fase                  | Dettagli                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Risoluzione target    | **Job:** `Resolve target ref`<br />**Workflow figlio:** nessuno<br />**Dimostra:** risolve il branch, il tag o lo SHA completo del commit della release e registra gli input selezionati.<br />**Riesecuzione:** riesegui l’ombrello se questo fallisce.                                                                                                                                       |
| Vitest e CI normale   | **Job:** `Run normal full CI`<br />**Workflow figlio:** `CI`<br />**Dimostra:** grafo CI completo manuale rispetto al ref target, incluse le lane Linux Node, shard dei plugin inclusi, contratti dei canali, compatibilità Node 22, `check`, `check-additional`, smoke di build, controlli docs, Skills Python, Windows, macOS, i18n Control UI e Android tramite l’ombrello.<br />**Riesecuzione:** `rerun_group=ci`. |
| Prerelease Plugin     | **Job:** `Run plugin prerelease validation`<br />**Workflow figlio:** `Plugin Prerelease`<br />**Dimostra:** controlli statici dei plugin solo per release, copertura agentica dei plugin, shard batch completi delle estensioni e lane Docker di prerelease dei plugin.<br />**Riesecuzione:** `rerun_group=plugin-prerelease`.                                                                 |
| Controlli di release  | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow figlio:** `OpenClaw Release Checks`<br />**Dimostra:** smoke di installazione, controlli dei pacchetti cross-OS, suite live/E2E, chunk Docker del percorso di release, Package Acceptance, parità QA Lab, Matrix live e Telegram live.<br />**Riesecuzione:** `rerun_group=release-checks` o un handle release-checks più ristretto. |
| Telegram post-publish | **Job:** `Run post-publish Telegram E2E`<br />**Workflow figlio:** `NPM Telegram Beta E2E`<br />**Dimostra:** prova Telegram opzionale del pacchetto pubblicato quando `npm_telegram_package_spec` è impostato.<br />**Riesecuzione:** `rerun_group=npm-telegram`.                                                                                                                                 |
| Verificatore ombrello | **Job:** `Verify full validation`<br />**Workflow figlio:** nessuno<br />**Dimostra:** ricontrolla le conclusioni registrate delle run figlie e aggiunge tabelle dei job più lenti dai workflow figli.<br />**Riesecuzione:** riesegui solo questo job dopo aver rieseguito con successo un figlio fallito.                                                                                    |

Per `ref=main` e `rerun_group=all`, un ombrello più recente sostituisce uno più vecchio.
Quando il parent viene annullato, il suo monitor annulla ogni workflow figlio già
inviato. Le run di validazione di branch e tag di release non si annullano a vicenda
per impostazione predefinita.

## Fasi dei controlli di release

`OpenClaw Release Checks` è il workflow figlio più grande. Risolve il target
una volta e prepara un artifact condiviso `release-package-under-test` quando le
fasi rivolte a pacchetti o Docker ne hanno bisogno.

| Fase                | Dettagli                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target di release   | **Job:** `Resolve target ref`<br />**Workflow di supporto:** nessuno<br />**Test:** ref selezionato, SHA previsto opzionale, profilo, gruppo di riesecuzione e filtro mirato della suite live.<br />**Riesecuzione:** `rerun_group=release-checks`.                                                                                                                                              |
| Artifact pacchetto  | **Job:** `Prepare release package artifact`<br />**Workflow di supporto:** nessuno<br />**Test:** impacchetta o risolve un tarball candidato e carica `release-package-under-test` per i controlli downstream rivolti ai pacchetti.<br />**Riesecuzione:** il gruppo di pacchetto, cross-OS o live/E2E interessato.                                                                                |
| Smoke installazione | **Job:** `Run install smoke`<br />**Workflow di supporto:** `Install Smoke`<br />**Test:** percorso di installazione completo con riuso dell’immagine smoke del Dockerfile root, installazione pacchetto QR, smoke Docker root e Gateway, test Docker dell’installer, smoke del provider immagini con installazione globale Bun ed E2E Docker rapido dei plugin inclusi.<br />**Riesecuzione:** `rerun_group=install-smoke`. |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Workflow di supporto:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Test:** lane fresh e upgrade su Linux, Windows e macOS per il provider e la modalità selezionati, usando il tarball candidato più un pacchetto baseline.<br />**Riesecuzione:** `rerun_group=cross-os`.                                                                    |
| Repo e live E2E     | **Job:** `Run repo/live E2E validation`<br />**Workflow di supporto:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** E2E del repository, cache live, streaming websocket OpenAI, provider live nativo e shard dei plugin, e harness live model/backend/Gateway supportati da Docker selezionati da `release_profile`.<br />**Riesecuzione:** `rerun_group=live-e2e`, opzionalmente con `live_suite_filter`. |
| Percorso release Docker | **Job:** `Run Docker release-path validation`<br />**Workflow di supporto:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** chunk Docker del percorso di release rispetto all’artifact pacchetto condiviso.<br />**Riesecuzione:** `rerun_group=live-e2e`.                                                                                                                              |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Workflow di supporto:** `Package Acceptance`<br />**Test:** compatibilità delle dipendenze dei canali inclusi nativa dell’artifact, fixture di pacchetti plugin offline e package acceptance Telegram mock-OpenAI rispetto allo stesso tarball.<br />**Riesecuzione:** `rerun_group=package`.                                                              |
| Parità QA           | **Job:** `Run QA Lab parity lane` e `Run QA Lab parity report`<br />**Workflow di supporto:** job diretti<br />**Test:** pacchetti di parità agentica candidato e baseline, poi il report di parità.<br />**Riesecuzione:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                          |
| Matrix live QA      | **Job:** `Run QA Lab live Matrix lane`<br />**Workflow di supporto:** job diretto<br />**Test:** profilo QA Matrix live rapido nell’ambiente `qa-live-shared`.<br />**Riesecuzione:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                  |
| Telegram live QA    | **Job:** `Run QA Lab live Telegram lane`<br />**Workflow di supporto:** job diretto<br />**Test:** QA Telegram live con lease delle credenziali Convex CI.<br />**Riesecuzione:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                       |
| Verificatore release | **Job:** `Verify release checks`<br />**Workflow di supporto:** nessuno<br />**Test:** job release-check richiesti per il gruppo di riesecuzione selezionato.<br />**Riesecuzione:** riesegui dopo che i job figli mirati sono passati.                                                                                                                                                         |

## Chunk del percorso release Docker

La fase del percorso release Docker esegue questi chunk quando `live_suite_filter` è
vuoto:

| Chunk                                                                                       | Copertura                                                               |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                                                      | Lane smoke del percorso release Docker core.                            |
| `package-update-openai`                                                                     | Installazione pacchetto OpenAI e comportamento di aggiornamento.        |
| `package-update-anthropic`                                                                  | Installazione pacchetto Anthropic e comportamento di aggiornamento.     |
| `package-update-core`                                                                       | Comportamento di pacchetto e aggiornamento neutrale rispetto al provider. |
| `plugins-runtime-plugins`                                                                   | Lane runtime dei plugin che esercitano il comportamento dei plugin.     |
| `plugins-runtime-services`                                                                  | Lane runtime dei plugin supportate da servizi; include OpenWebUI quando richiesto. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h`                             | Batch di installazione/runtime dei plugin suddivisi per validazione di release parallela. |
| `bundled-channels-core`                                                                     | Comportamento Docker dei canali inclusi.                                |
| `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` | Comportamento di aggiornamento dei canali inclusi.                      |
| `bundled-channels-contracts`                                                                | Controlli dei contratti dei canali inclusi nel percorso release Docker. |

Usa `docker_lanes=<lane[,lane]>` mirato nel flusso di lavoro live/E2E riutilizzabile quando
è fallita una sola lane Docker. Gli artefatti di release includono comandi di riesecuzione
per lane con input per riutilizzare artefatti del pacchetto e immagini quando disponibili.

## Profili di release

`release_profile` controlla solo l'ampiezza live/provider all'interno dei controlli di release. Non
rimuove la normale CI completa, Plugin Prerelease, install smoke, package
acceptance, QA Lab o i segmenti del percorso di release Docker.

| Profilo   | Uso previsto                      | Copertura live/provider inclusa                                                                                                                                               |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke release-critical più rapido. | Percorso live OpenAI/core, modelli live Docker per OpenAI, core del gateway nativo, profilo gateway OpenAI nativo, plugin OpenAI nativo e gateway live Docker OpenAI.               |
| `stable`  | Profilo predefinito per l'approvazione della release. | `minimum` più Anthropic, Google, MiniMax, backend, harness di test live nativo, backend CLI live Docker, bind ACP Docker, harness Codex Docker e uno shard smoke OpenCode Go. |
| `full`    | Ampia scansione advisory.             | `stable` più provider advisory, shard live dei plugin e shard live media.                                                                                                  |

## Aggiunte solo full

Queste suite vengono saltate da `stable` e incluse da `full`:

| Area                             | Copertura solo full                                                              |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Modelli live Docker               | OpenCode Go, OpenRouter, xAI, Z.ai e Fireworks.                              |
| Gateway live Docker              | Shard advisory per DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI e Z.ai. |
| Profili provider del gateway nativo | Fireworks, DeepSeek, shard completi del modello OpenCode Go, OpenRouter, xAI e Z.ai.  |
| Shard live dei plugin nativi        | Plugin A-K, L-N, O-Z altri, Moonshot e xAI.                                 |
| Shard live media nativi         | Audio, musica Google, musica MiniMax e gruppi video A-D.                       |

`stable` include `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
usa invece gli shard più ampi del modello OpenCode Go.

## Riesecuzioni mirate

Usa `rerun_group` per evitare di ripetere box di release non correlati:

| Handle              | Ambito                                             |
| ------------------- | ------------------------------------------------- |
| `all`               | Tutti gli stadi Full Release Validation.               |
| `ci`                | Solo figlio CI completa manuale.                        |
| `plugin-prerelease` | Solo figlio Plugin Prerelease.                     |
| `release-checks`    | Tutti gli stadi OpenClaw Release Checks.               |
| `install-smoke`     | Install Smoke attraverso i controlli di release.             |
| `cross-os`          | Controlli di release Cross-OS.                          |
| `live-e2e`          | Validazione E2E repo/live e percorso di release Docker. |
| `package`           | Package Acceptance.                               |
| `qa`                | Parità QA più lane live QA.                     |
| `qa-parity`         | Solo lane di parità QA e report.                  |
| `qa-live`           | Solo matrice live QA e Telegram.                 |
| `npm-telegram`      | Solo E2E Telegram opzionale post-pubblicazione.          |

Usa `live_suite_filter` con `rerun_group=live-e2e` quando è fallita una suite live.
Gli ID filtro validi sono definiti nel flusso di lavoro live/E2E riutilizzabile, inclusi
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` e
`live-codex-harness-docker`.

## Evidenze da conservare

Conserva il riepilogo `Full Release Validation` come indice a livello di release. Collega
gli ID delle esecuzioni figlie e include tabelle dei job più lenti. In caso di errori, ispeziona prima il
workflow figlio, quindi riesegui l'handle corrispondente più piccolo tra quelli sopra.

Artefatti utili:

- `release-package-under-test` da `OpenClaw Release Checks`
- Artefatti del percorso di release Docker sotto `.artifacts/docker-tests/`
- Package Acceptance `package-under-test` e artefatti di accettazione Docker
- Artefatti dei controlli di release Cross-OS per ogni OS e suite
- Artefatti QA parity, Matrix e Telegram

## File dei workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
