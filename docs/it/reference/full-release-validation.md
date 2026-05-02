---
read_when:
    - Esecuzione o riesecuzione della convalida completa della release
    - Confronto tra i profili di convalida del rilascio stabile e del rilascio completo
    - Debug degli errori nella fase di validazione della release
summary: Fasi della validazione completa del rilascio, flussi di lavoro figli, profili di rilascio, identificatori di riesecuzione e prove
title: Validazione completa del rilascio
x-i18n:
    generated_at: "2026-05-02T21:00:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce1e5a72227ca202335fe68b537491a0b68a0bb2af431aa56c41cf20989e88c
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` è il contenitore della release. È l'unico punto di ingresso
manuale per la prova pre-release, ma la maggior parte del lavoro avviene nei
workflow figli, così un box non riuscito può essere rieseguito senza riavviare
l'intera release.

Eseguilo da un riferimento di workflow attendibile, normalmente `main`, e passa
il branch di release, il tag o lo SHA completo del commit come `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

I workflow figli usano il riferimento di workflow attendibile per l'harness e
l'input `ref` per il candidato sotto test. Questo mantiene disponibile la nuova
logica di validazione quando si valida un branch o tag di release più vecchio.

Package Acceptance normalmente crea il tarball candidato dal `ref` risolto,
incluse le esecuzioni con SHA completo avviate con `pnpm ci:full-release`. Dopo
la pubblicazione, passa `package_acceptance_package_spec=openclaw@YYYY.M.D`
(oppure `openclaw@beta`/`openclaw@latest`) per eseguire invece la stessa matrice
di pacchetti/aggiornamenti sul pacchetto npm distribuito.

## Fasi di livello superiore

| Fase                 | Dettagli                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Risoluzione target   | **Job:** `Resolve target ref`<br />**Workflow figlio:** nessuno<br />**Dimostra:** risolve il branch di release, il tag o lo SHA completo del commit e registra gli input selezionati.<br />**Riesecuzione:** riesegui il contenitore se questo fallisce.                                                                                                                                   |
| Vitest e CI normale  | **Job:** `Run normal full CI`<br />**Workflow figlio:** `CI`<br />**Dimostra:** grafo CI completo manuale sul ref target, incluse lane Linux Node, shard dei Plugin inclusi, contratti dei canali, compatibilità Node 22, `check`, `check-additional`, smoke build, controlli docs, Skills Python, Windows, macOS, i18n della Control UI e Android tramite il contenitore.<br />**Riesecuzione:** `rerun_group=ci`. |
| Prerelease Plugin    | **Job:** `Run plugin prerelease validation`<br />**Workflow figlio:** `Plugin Prerelease`<br />**Dimostra:** controlli statici Plugin solo per release, copertura Plugin agentica, shard batch completi delle estensioni e lane Docker di prerelease Plugin.<br />**Riesecuzione:** `rerun_group=plugin-prerelease`.                                                                       |
| Controlli release    | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow figlio:** `OpenClaw Release Checks`<br />**Dimostra:** install smoke, controlli pacchetto cross-OS, suite live/E2E, chunk del percorso di release Docker, Package Acceptance, parità QA Lab, Matrix live e Telegram live.<br />**Riesecuzione:** `rerun_group=release-checks` o un handle release-checks più ristretto. |
| Pacchetto Telegram   | **Job:** `Run package Telegram E2E`<br />**Workflow figlio:** `NPM Telegram Beta E2E`<br />**Dimostra:** prova del pacchetto Telegram supportata da artifact per `rerun_group=all` con `release_profile=full`, o prova Telegram del pacchetto pubblicato quando `npm_telegram_package_spec` è impostato.<br />**Riesecuzione:** `rerun_group=npm-telegram` con `npm_telegram_package_spec`. |
| Verificatore contenitore | **Job:** `Verify full validation`<br />**Workflow figlio:** nessuno<br />**Dimostra:** ricontrolla le conclusioni registrate delle esecuzioni figlie e aggiunge le tabelle dei job più lenti dai workflow figli.<br />**Riesecuzione:** riesegui solo questo job dopo aver rieseguito con successo un figlio fallito.                                                                    |

Per `ref=main` e `rerun_group=all`, un contenitore più recente sostituisce uno
più vecchio. Quando il parent viene annullato, il suo monitor annulla qualsiasi
workflow figlio che ha già avviato. Le esecuzioni di validazione di branch e tag
di release non si annullano a vicenda per impostazione predefinita.

## Fasi dei controlli release

`OpenClaw Release Checks` è il workflow figlio più grande. Risolve il target una
volta e prepara un artifact `release-package-under-test` condiviso quando le
fasi rivolte a pacchetti o Docker ne hanno bisogno.

| Fase                | Dettagli                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target release      | **Job:** `Resolve target ref`<br />**Workflow di supporto:** nessuno<br />**Test:** ref selezionato, SHA previsto opzionale, profilo, gruppo di riesecuzione e filtro focalizzato della suite live.<br />**Riesecuzione:** `rerun_group=release-checks`.                                                                                                                                        |
| Artifact pacchetto  | **Job:** `Prepare release package artifact`<br />**Workflow di supporto:** nessuno<br />**Test:** impacchetta o risolve un tarball candidato e carica `release-package-under-test` per i controlli downstream rivolti ai pacchetti.<br />**Riesecuzione:** il gruppo pacchetto, cross-OS o live/E2E interessato.                                                                              |
| Install smoke       | **Job:** `Run install smoke`<br />**Workflow di supporto:** `Install Smoke`<br />**Test:** percorso di installazione completo con riuso dell'immagine smoke Dockerfile root, installazione pacchetto QR, smoke Docker root e Gateway, test Docker degli installer, smoke provider immagine con installazione globale Bun e rapido E2E di installazione/disinstallazione dei Plugin inclusi.<br />**Riesecuzione:** `rerun_group=install-smoke`. |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Workflow di supporto:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Test:** lane fresh e upgrade su Linux, Windows e macOS per il provider e la modalità selezionati, usando il tarball candidato più un pacchetto baseline.<br />**Riesecuzione:** `rerun_group=cross-os`.                                                              |
| Repo ed E2E live    | **Job:** `Run repo/live E2E validation`<br />**Workflow di supporto:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** E2E del repository, cache live, streaming websocket OpenAI, shard live nativi di provider e Plugin, e harness live con modello/backend/Gateway supportati da Docker selezionati da `release_profile`.<br />**Riesecuzione:** `rerun_group=live-e2e`, facoltativamente con `live_suite_filter`. |
| Percorso release Docker | **Job:** `Run Docker release-path validation`<br />**Workflow di supporto:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** chunk Docker del percorso di release contro l'artifact pacchetto condiviso.<br />**Riesecuzione:** `rerun_group=live-e2e`.                                                                                                                          |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Workflow di supporto:** `Package Acceptance`<br />**Test:** fixture offline dei pacchetti Plugin, aggiornamento Plugin, accettazione pacchetto Telegram con mock OpenAI e controlli di sopravvivenza degli upgrade pubblicati da ogni release npm stabile pari o successiva a `2026.4.23` contro lo stesso tarball.<br />**Riesecuzione:** `rerun_group=package`. |
| Parità QA           | **Job:** `Run QA Lab parity lane` e `Run QA Lab parity report`<br />**Workflow di supporto:** job diretti<br />**Test:** pack di parità agentica candidato e baseline, poi il report di parità.<br />**Riesecuzione:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                            |
| Matrix live QA      | **Job:** `Run QA Lab live Matrix lane`<br />**Workflow di supporto:** job diretto<br />**Test:** profilo QA Matrix live rapido nell'ambiente `qa-live-shared`.<br />**Riesecuzione:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                |
| Telegram live QA    | **Job:** `Run QA Lab live Telegram lane`<br />**Workflow di supporto:** job diretto<br />**Test:** QA Telegram live con lease delle credenziali Convex CI.<br />**Riesecuzione:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                      |
| Verificatore release | **Job:** `Verify release checks`<br />**Workflow di supporto:** nessuno<br />**Test:** job release-check richiesti per il gruppo di riesecuzione selezionato.<br />**Riesecuzione:** riesegui dopo il passaggio dei job figli focalizzati.                                                                                                                                                   |

## Chunk del percorso di release Docker

La fase del percorso di release Docker esegue questi chunk quando
`live_suite_filter` è vuoto:

| Chunk                                                           | Copertura                                                               |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Lane smoke del percorso di release Docker core.                         |
| `package-update-openai`                                         | Comportamento di installazione e aggiornamento del pacchetto OpenAI.    |
| `package-update-anthropic`                                      | Comportamento di installazione e aggiornamento del pacchetto Anthropic. |
| `package-update-core`                                           | Comportamento di pacchetto e aggiornamento neutrale rispetto al provider. |
| `plugins-runtime-plugins`                                       | Lane runtime Plugin che esercitano il comportamento dei Plugin.         |
| `plugins-runtime-services`                                      | Lane runtime Plugin supportate da servizi; include OpenWebUI quando richiesto. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Batch di installazione/runtime Plugin suddivisi per la validazione di release parallela. |

Usa `docker_lanes=<lane[,lane]>` mirato sul workflow live/E2E riutilizzabile
quando è fallita una sola lane Docker. Gli artifact della release includono
comandi di riesecuzione per lane con input di artifact pacchetto e riuso
immagine quando disponibili.

## Profili di release

`release_profile` controlla principalmente l'ampiezza live/provider all'interno dei controlli di rilascio.
Non rimuove la normale CI completa, la prerelease Plugin, l'install smoke, la package
acceptance, QA Lab o le parti del percorso di rilascio Docker. `full` fa anche sì che
l'esecuzione ombrello esegua l'E2E Telegram del pacchetto contro l'artefatto del pacchetto di rilascio quando
`rerun_group=all`, quindi un candidato completo pre-pubblicazione non salta silenziosamente quella
lane del pacchetto Telegram.

| Profilo   | Uso previsto                      | Copertura live/provider inclusa                                                                                                                                               |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke più rapido critico per il rilascio.   | Percorso live OpenAI/core, modelli live Docker per OpenAI, core del Gateway nativo, profilo Gateway nativo OpenAI, Plugin nativo OpenAI e Gateway live Docker OpenAI.               |
| `stable`  | Profilo predefinito di approvazione del rilascio. | `minimum` più Anthropic, Google, MiniMax, backend, harness di test live nativo, backend CLI live Docker, bind ACP Docker, harness Codex Docker e uno shard smoke OpenCode Go. |
| `full`    | Sweep consultivo ampio.             | `stable` più provider consultivi, shard live dei plugin e shard live media.                                                                                                  |

## Aggiunte solo full

Queste suite vengono saltate da `stable` e incluse da `full`:

| Area                             | Copertura solo full                                                              |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Modelli live Docker               | OpenCode Go, OpenRouter, xAI, Z.ai e Fireworks.                              |
| Gateway live Docker              | Shard consultivo per DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI e Z.ai. |
| Profili provider del Gateway nativo | Fireworks, DeepSeek, shard completi del modello OpenCode Go, OpenRouter, xAI e Z.ai.  |
| Shard live Plugin nativi        | Plugin A-K, L-N, O-Z altri, Moonshot e xAI.                                 |
| Shard live media nativi         | Audio, musica Google, musica MiniMax e gruppi video A-D.                       |

`stable` include `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
usa invece gli shard più ampi del modello OpenCode Go.

## Riesecuzioni mirate

Usa `rerun_group` per evitare di ripetere box di rilascio non correlati:

| Handle              | Ambito                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Tutti gli stage di Full Release Validation.                                   |
| `ci`                | Solo child CI completa manuale.                                            |
| `plugin-prerelease` | Solo child prerelease Plugin.                                         |
| `release-checks`    | Tutti gli stage di OpenClaw Release Checks.                                   |
| `install-smoke`     | Install Smoke tramite i controlli di rilascio.                                 |
| `cross-os`          | Controlli di rilascio Cross-OS.                                              |
| `live-e2e`          | Validazione repo/live E2E e percorso di rilascio Docker.                     |
| `package`           | Package Acceptance.                                                   |
| `qa`                | Parità QA più lane QA live.                                         |
| `qa-parity`         | Solo lane e report di parità QA.                                      |
| `qa-live`           | Solo Matrix QA live e Telegram.                                     |
| `npm-telegram`      | E2E Telegram del pacchetto pubblicato; richiede `npm_telegram_package_spec`. |

Usa `live_suite_filter` con `rerun_group=live-e2e` quando una suite live non è riuscita.
Gli ID filtro validi sono definiti nel workflow riutilizzabile live/E2E, inclusi
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` e
`live-codex-harness-docker`.

## Evidenze da conservare

Conserva il riepilogo `Full Release Validation` come indice a livello di rilascio. Collega
gli ID delle esecuzioni child e include le tabelle dei job più lenti. Per gli errori, ispeziona prima il
workflow child, quindi riesegui il più piccolo handle corrispondente sopra.

Artefatti utili:

- `release-package-under-test` da `OpenClaw Release Checks`
- Artefatti del percorso di rilascio Docker sotto `.artifacts/docker-tests/`
- `package-under-test` di Package Acceptance e artefatti di accettazione Docker
- Artefatti dei controlli di rilascio Cross-OS per ciascun OS e suite
- Artefatti di parità QA, Matrix e Telegram

## File dei workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
