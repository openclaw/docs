---
read_when:
    - Esecuzione o riesecuzione della convalida completa della release
    - Confronto tra i profili stabile e completo di convalida delle release
    - Debug degli errori nelle fasi di validazione del rilascio
summary: Fasi di validazione completa della release, workflow figli, profili di release, handle di riesecuzione e prove
title: Convalida completa del rilascio
x-i18n:
    generated_at: "2026-05-02T08:33:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: feb4edec850fb97405575c869547b4851bc773507321690670553e6faafc8b0b
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` è l’ombrello del rilascio. È l’unico entrypoint manuale per la prova pre-release, ma la maggior parte del lavoro avviene nei workflow figli, così un box non riuscito può essere rieseguito senza riavviare l’intero rilascio.

Eseguilo da un ref di workflow attendibile, normalmente `main`, e passa il branch di rilascio, il tag o lo SHA completo del commit come `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

I workflow figli usano il ref di workflow attendibile per l’harness e l’input
`ref` per il candidato in test. Questo mantiene disponibile la nuova logica di validazione quando si valida un branch o un tag di rilascio precedente.

## Fasi di primo livello

| Fase                 | Dettagli                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Risoluzione target   | **Job:** `Resolve target ref`<br />**Workflow figlio:** nessuno<br />**Dimostra:** risolve il branch di rilascio, il tag o lo SHA completo del commit e registra gli input selezionati.<br />**Riesecuzione:** riesegui l’ombrello se questa fase non riesce.                                                                                                                                                 |
| Vitest e CI normale  | **Job:** `Run normal full CI`<br />**Workflow figlio:** `CI`<br />**Dimostra:** grafo CI completo manuale rispetto al ref target, inclusi lane Linux Node, shard Plugin inclusi, contratti di canale, compatibilità Node 22, `check`, `check-additional`, smoke di build, controlli docs, Skills Python, Windows, macOS, i18n Control UI e Android tramite l’ombrello.<br />**Riesecuzione:** `rerun_group=ci`. |
| Pre-release Plugin   | **Job:** `Run plugin prerelease validation`<br />**Workflow figlio:** `Plugin Prerelease`<br />**Dimostra:** controlli statici Plugin solo di rilascio, copertura Plugin agentica, shard batch completi delle estensioni e lane Docker di pre-release Plugin.<br />**Riesecuzione:** `rerun_group=plugin-prerelease`.                                                                                         |
| Controlli rilascio   | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow figlio:** `OpenClaw Release Checks`<br />**Dimostra:** smoke di installazione, controlli pacchetto cross-OS, suite live/E2E, chunk del percorso di rilascio Docker, Package Acceptance, parità QA Lab, Matrix live e Telegram live.<br />**Riesecuzione:** `rerun_group=release-checks` o un handle release-checks più ristretto.            |
| Pacchetto Telegram   | **Job:** `Run package Telegram E2E`<br />**Workflow figlio:** `NPM Telegram Beta E2E`<br />**Dimostra:** prova del pacchetto Telegram basata su artifact per `rerun_group=all` con `release_profile=full`, oppure prova Telegram del pacchetto pubblicato quando `npm_telegram_package_spec` è impostato.<br />**Riesecuzione:** `rerun_group=npm-telegram` con `npm_telegram_package_spec`.                |
| Verificatore ombrello | **Job:** `Verify full validation`<br />**Workflow figlio:** nessuno<br />**Dimostra:** ricontrolla le conclusioni registrate delle esecuzioni figlie e aggiunge tabelle dei job più lenti dai workflow figli.<br />**Riesecuzione:** riesegui solo questo job dopo aver portato a verde un figlio non riuscito.                                                                                             |

Per `ref=main` e `rerun_group=all`, un ombrello più recente sostituisce uno precedente. Quando il parent viene annullato, il suo monitor annulla qualsiasi workflow figlio che ha già inviato. Le esecuzioni di validazione di branch e tag di rilascio non si annullano tra loro per impostazione predefinita.

## Fasi dei controlli rilascio

`OpenClaw Release Checks` è il workflow figlio più grande. Risolve il target una sola volta e prepara un artifact condiviso `release-package-under-test` quando le fasi orientate al pacchetto o a Docker ne hanno bisogno.

| Fase                | Dettagli                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target rilascio     | **Job:** `Resolve target ref`<br />**Workflow sottostante:** nessuno<br />**Test:** ref selezionato, SHA previsto opzionale, profilo, gruppo di riesecuzione e filtro focalizzato della suite live.<br />**Riesecuzione:** `rerun_group=release-checks`.                                                                                                                                                             |
| Artifact pacchetto  | **Job:** `Prepare release package artifact`<br />**Workflow sottostante:** nessuno<br />**Test:** crea o risolve un tarball candidato e carica `release-package-under-test` per i controlli downstream orientati al pacchetto.<br />**Riesecuzione:** il gruppo pacchetto, cross-OS o live/E2E interessato.                                                                                                         |
| Smoke installazione | **Job:** `Run install smoke`<br />**Workflow sottostante:** `Install Smoke`<br />**Test:** percorso di installazione completo con riuso dell’immagine smoke del Dockerfile root, installazione pacchetto QR, smoke Docker root e Gateway, test Docker dell’installer, smoke image-provider di installazione globale Bun ed E2E veloce di installazione/disinstallazione dei Plugin inclusi.<br />**Riesecuzione:** `rerun_group=install-smoke`. |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Workflow sottostante:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Test:** lane fresh e upgrade su Linux, Windows e macOS per il provider e la modalità selezionati, usando il tarball candidato più un pacchetto baseline.<br />**Riesecuzione:** `rerun_group=cross-os`.                                                                                       |
| Repo e live E2E     | **Job:** `Run repo/live E2E validation`<br />**Workflow sottostante:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** repository E2E, cache live, streaming websocket OpenAI, shard provider live nativo e Plugin, e harness live model/backend/Gateway basati su Docker selezionati da `release_profile`.<br />**Riesecuzione:** `rerun_group=live-e2e`, opzionalmente con `live_suite_filter`.           |
| Percorso rilascio Docker | **Job:** `Run Docker release-path validation`<br />**Workflow sottostante:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** chunk Docker del percorso di rilascio rispetto all’artifact pacchetto condiviso.<br />**Riesecuzione:** `rerun_group=live-e2e`.                                                                                                                                              |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Workflow sottostante:** `Package Acceptance`<br />**Test:** fixture offline di pacchetto Plugin, aggiornamento Plugin e accettazione del pacchetto Telegram mock-OpenAI rispetto allo stesso tarball.<br />**Riesecuzione:** `rerun_group=package`.                                                                                                                          |
| Parità QA           | **Job:** `Run QA Lab parity lane` e `Run QA Lab parity report`<br />**Workflow sottostante:** job diretti<br />**Test:** pack di parità agentica candidato e baseline, poi il report di parità.<br />**Riesecuzione:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                  |
| Matrix live QA      | **Job:** `Run QA Lab live Matrix lane`<br />**Workflow sottostante:** job diretto<br />**Test:** profilo QA Matrix live veloce nell’ambiente `qa-live-shared`.<br />**Riesecuzione:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                       |
| Telegram live QA    | **Job:** `Run QA Lab live Telegram lane`<br />**Workflow sottostante:** job diretto<br />**Test:** QA Telegram live con lease delle credenziali Convex CI.<br />**Riesecuzione:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                            |
| Verificatore rilascio | **Job:** `Verify release checks`<br />**Workflow sottostante:** nessuno<br />**Test:** job release-check richiesti per il gruppo di riesecuzione selezionato.<br />**Riesecuzione:** riesegui dopo che i job figli focalizzati passano.                                                                                                                                                                           |

## Chunk del percorso di rilascio Docker

La fase del percorso di rilascio Docker esegue questi chunk quando `live_suite_filter` è vuoto:

| Chunk                                                           | Copertura                                                               |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Lane smoke del percorso di rilascio Docker core.                        |
| `package-update-openai`                                         | Comportamento di installazione e aggiornamento del pacchetto OpenAI.    |
| `package-update-anthropic`                                      | Comportamento di installazione e aggiornamento del pacchetto Anthropic. |
| `package-update-core`                                           | Comportamento di pacchetto e aggiornamento neutrale rispetto al provider. |
| `plugins-runtime-plugins`                                       | Lane di runtime Plugin che esercitano il comportamento Plugin.          |
| `plugins-runtime-services`                                      | Lane di runtime Plugin basate su servizi; include OpenWebUI quando richiesto. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Batch di installazione/runtime Plugin divisi per la validazione di rilascio parallela. |

Usa `docker_lanes=<lane[,lane]>` mirato sul workflow riutilizzabile live/E2E quando è fallita solo una lane Docker. Gli artifact di rilascio includono comandi di riesecuzione per lane con input di artifact pacchetto e riuso immagine quando disponibili.

## Profili di rilascio

`release_profile` controlla principalmente l’ampiezza live/provider all’interno dei controlli rilascio. Non rimuove la CI completa normale, Plugin Prerelease, lo smoke di installazione, l’accettazione pacchetto, QA Lab o i chunk del percorso di rilascio Docker. `full` fa anche eseguire all’ombrello l’E2E del pacchetto Telegram rispetto all’artifact pacchetto di rilascio quando `rerun_group=all`, così un candidato pre-pubblicazione completo non salta silenziosamente quella lane del pacchetto Telegram.

| Profilo   | Uso previsto                      | Copertura live/provider inclusa                                                                                                                                               |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke più rapido critico per la release.   | Percorso live OpenAI/core, modelli live Docker per OpenAI, core Gateway nativo, profilo Gateway OpenAI nativo, Plugin OpenAI nativo e Gateway live Docker OpenAI.               |
| `stable`  | Profilo predefinito di approvazione release. | `minimum` più Anthropic, Google, MiniMax, backend, harness di test live nativo, backend CLI live Docker, bind Docker ACP, harness Docker Codex e uno shard smoke OpenCode Go. |
| `full`    | Ampia scansione consultiva.             | `stable` più provider consultivi, shard Plugin live e shard media live.                                                                                                  |

## Aggiunte solo per full

Queste suite vengono saltate da `stable` e incluse da `full`:

| Area                             | Copertura solo full                                                              |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Modelli live Docker               | OpenCode Go, OpenRouter, xAI, Z.ai e Fireworks.                              |
| Gateway live Docker              | Shard consultivo per DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI e Z.ai. |
| Profili provider Gateway nativi | Fireworks, DeepSeek, shard completi del modello OpenCode Go, OpenRouter, xAI e Z.ai.  |
| Shard Plugin live nativi        | Plugin A-K, L-N, O-Z altro, Moonshot e xAI.                                 |
| Shard media live nativi         | Audio, musica Google, musica MiniMax e gruppi video A-D.                       |

`stable` include `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
usa invece gli shard più ampi del modello OpenCode Go.

## Riesecuzioni mirate

Usa `rerun_group` per evitare di ripetere box di release non correlati:

| Handle              | Ambito                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Tutte le fasi di Full Release Validation.                                   |
| `ci`                | Solo il figlio CI completo manuale.                                            |
| `plugin-prerelease` | Solo il figlio Plugin Prerelease.                                         |
| `release-checks`    | Tutte le fasi di OpenClaw Release Checks.                                   |
| `install-smoke`     | Install Smoke fino ai controlli di release.                                 |
| `cross-os`          | Controlli di release cross-OS.                                              |
| `live-e2e`          | Validazione E2E repo/live e percorso di release Docker.                     |
| `package`           | Package Acceptance.                                                   |
| `qa`                | Parità QA più lane live QA.                                         |
| `qa-parity`         | Solo lane e report di parità QA.                                      |
| `qa-live`           | Solo Matrix e Telegram live QA.                                     |
| `npm-telegram`      | E2E Telegram del pacchetto pubblicato; richiede `npm_telegram_package_spec`. |

Usa `live_suite_filter` con `rerun_group=live-e2e` quando una suite live non riesce.
Gli id filtro validi sono definiti nel workflow live/E2E riutilizzabile, inclusi
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` e
`live-codex-harness-docker`.

## Evidenze da conservare

Mantieni il riepilogo `Full Release Validation` come indice a livello di release. Collega
gli id delle esecuzioni figlie e include le tabelle dei job più lenti. In caso di errori, ispeziona prima il workflow
figlio, poi riesegui l'handle corrispondente più piccolo tra quelli sopra.

Artefatti utili:

- `release-package-under-test` da `OpenClaw Release Checks`
- Artefatti del percorso di release Docker sotto `.artifacts/docker-tests/`
- `package-under-test` di Package Acceptance e artefatti di accettazione Docker
- Artefatti dei controlli di release cross-OS per ogni OS e suite
- Artefatti di parità QA, Matrix e Telegram

## File di workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
