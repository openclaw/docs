---
read_when:
    - Esecuzione o riesecuzione della validazione completa del rilascio
    - Confronto tra i profili stabile e completo di convalida del rilascio
    - Risoluzione degli errori nelle fasi di convalida del rilascio
summary: Fasi della convalida completa della release, workflow secondari, profili di release, handle di riesecuzione e prove
title: Validazione completa del rilascio
x-i18n:
    generated_at: "2026-05-03T21:43:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 038901ad751c00b35f69d7ec5caf74e577dcf2350d7658037c3ecc9ff5fab6d7
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` è l'ombrello del rilascio. È il singolo punto di ingresso
manuale per la prova pre-release, ma la maggior parte del lavoro avviene in workflow
figli, così un ambiente fallito può essere rieseguito senza riavviare l'intero rilascio.

Eseguilo da un ref di workflow attendibile, normalmente `main`, e passa il branch di rilascio,
il tag o lo SHA completo del commit come `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

I workflow figli usano il ref di workflow attendibile per l'harness e l'input
`ref` per il candidato sotto test. Questo mantiene disponibile la nuova logica di validazione
quando si valida un branch o un tag di rilascio precedente.

Package Acceptance di norma crea il tarball candidato dal
`ref` risolto, incluse le esecuzioni con SHA completo inviate con `pnpm ci:full-release`. Dopo
la pubblicazione, passa `package_acceptance_package_spec=openclaw@YYYY.M.D` (oppure
`openclaw@beta`/`openclaw@latest`) per eseguire invece la stessa matrice di pacchetti/aggiornamenti contro
il pacchetto npm distribuito.

## Fasi di primo livello

| Fase                 | Dettagli                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Risoluzione target   | **Job:** `Resolve target ref`<br />**Workflow figlio:** nessuno<br />**Dimostra:** risolve il branch di rilascio, il tag o lo SHA completo del commit e registra gli input selezionati.<br />**Riesecuzione:** riesegui l'ombrello se fallisce.                                                                                                                                              |
| Vitest e CI normale  | **Job:** `Run normal full CI`<br />**Workflow figlio:** `CI`<br />**Dimostra:** grafo CI completo manuale contro il ref target, incluse lane Linux Node, shard dei Plugin inclusi, contratti dei canali, compatibilità Node 22, `check`, `check-additional`, smoke di build, controlli docs, Skills Python, Windows, macOS, i18n della Control UI e Android tramite l'ombrello.<br />**Riesecuzione:** `rerun_group=ci`. |
| Pre-release Plugin   | **Job:** `Run plugin prerelease validation`<br />**Workflow figlio:** `Plugin Prerelease`<br />**Dimostra:** controlli statici dei Plugin solo di rilascio, copertura agentica dei Plugin, shard batch completi delle estensioni e lane Docker di pre-release dei Plugin.<br />**Riesecuzione:** `rerun_group=plugin-prerelease`.                                                              |
| Controlli rilascio   | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow figlio:** `OpenClaw Release Checks`<br />**Dimostra:** smoke di installazione, controlli pacchetto cross-OS, suite live/E2E, chunk del percorso di rilascio Docker, Package Acceptance, parità QA Lab, Matrix live e Telegram live.<br />**Riesecuzione:** `rerun_group=release-checks` o un handle release-checks più stretto. |
| Artefatto pacchetto  | **Job:** `Prepare release package artifact`<br />**Workflow figlio:** nessuno<br />**Dimostra:** crea il tarball padre `release-package-under-test` abbastanza presto per i controlli orientati ai pacchetti che non devono attendere `OpenClaw Release Checks`.<br />**Riesecuzione:** riesegui l'ombrello oppure fornisci `npm_telegram_package_spec` per `rerun_group=npm-telegram`.        |
| Pacchetto Telegram   | **Job:** `Run package Telegram E2E`<br />**Workflow figlio:** `NPM Telegram Beta E2E`<br />**Dimostra:** prova del pacchetto Telegram basata sull'artefatto padre per `rerun_group=all` con `release_profile=full`, oppure prova Telegram del pacchetto pubblicato quando `npm_telegram_package_spec` è impostato.<br />**Riesecuzione:** `rerun_group=npm-telegram` con `npm_telegram_package_spec`. |
| Verificatore ombrello | **Job:** `Verify full validation`<br />**Workflow figlio:** nessuno<br />**Dimostra:** ricontrolla le conclusioni registrate delle esecuzioni figlie e aggiunge tabelle dei job più lenti dai workflow figli.<br />**Riesecuzione:** riesegui solo questo job dopo aver rieseguito un figlio fallito fino al verde.                                                                             |

Per `ref=main` e `rerun_group=all`, un ombrello più recente sostituisce uno precedente.
Quando il padre viene annullato, il suo monitor annulla qualsiasi workflow figlio già
inviato. Le esecuzioni di validazione di branch e tag di rilascio non si annullano a vicenda
per impostazione predefinita.

## Fasi dei controlli di rilascio

`OpenClaw Release Checks` è il workflow figlio più grande. Risolve il target
una volta e prepara un artefatto condiviso `release-package-under-test` quando le fasi
orientate a pacchetti o Docker ne hanno bisogno.

| Fase                | Dettagli                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target rilascio     | **Job:** `Resolve target ref`<br />**Workflow di supporto:** nessuno<br />**Test:** ref selezionato, SHA atteso opzionale, profilo, gruppo di riesecuzione e filtro della suite live mirata.<br />**Riesecuzione:** `rerun_group=release-checks`.                                                                                                                                                 |
| Artefatto pacchetto | **Job:** `Prepare release package artifact`<br />**Workflow di supporto:** nessuno<br />**Test:** impacchetta o risolve un tarball candidato e carica `release-package-under-test` per i controlli downstream orientati ai pacchetti.<br />**Riesecuzione:** il gruppo pacchetto, cross-OS o live/E2E interessato.                                                                               |
| Smoke installazione | **Job:** `Run install smoke`<br />**Workflow di supporto:** `Install Smoke`<br />**Test:** percorso di installazione completo con riuso dell'immagine smoke Dockerfile root, installazione pacchetto QR, smoke Docker root e Gateway, test Docker dell'installer, smoke Bun global install image-provider e E2E veloce di installazione/disinstallazione dei Plugin inclusi.<br />**Riesecuzione:** `rerun_group=install-smoke`. |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Workflow di supporto:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Test:** lane fresh e di upgrade su Linux, Windows e macOS per il provider e la modalità selezionati, usando il tarball candidato più un pacchetto baseline.<br />**Riesecuzione:** `rerun_group=cross-os`.                                                               |
| Repo e live E2E     | **Job:** `Run repo/live E2E validation`<br />**Workflow di supporto:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** E2E del repository, cache live, streaming websocket OpenAI, shard provider live nativi e Plugin, e harness live basati su Docker per modello/backend/Gateway selezionati da `release_profile`.<br />**Riesecuzione:** `rerun_group=live-e2e`, opzionalmente con `live_suite_filter`. |
| Percorso rilascio Docker | **Job:** `Run Docker release-path validation`<br />**Workflow di supporto:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** chunk Docker del percorso di rilascio contro l'artefatto pacchetto condiviso.<br />**Riesecuzione:** `rerun_group=live-e2e`.                                                                                                                              |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Workflow di supporto:** `Package Acceptance`<br />**Test:** fixture offline dei pacchetti Plugin, aggiornamento Plugin, package acceptance Telegram mock-OpenAI e controlli di sopravvivenza all'upgrade pubblicato da ogni release npm stabile da `2026.4.23` in poi contro lo stesso tarball.<br />**Riesecuzione:** `rerun_group=package`.          |
| Parità QA           | **Job:** `Run QA Lab parity lane` e `Run QA Lab parity report`<br />**Workflow di supporto:** job diretti<br />**Test:** pack agentici di parità candidato e baseline, quindi report di parità.<br />**Riesecuzione:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                              |
| QA live Matrix      | **Job:** `Run QA Lab live Matrix lane`<br />**Workflow di supporto:** job diretto<br />**Test:** profilo QA Matrix live veloce nell'ambiente `qa-live-shared`.<br />**Riesecuzione:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                |
| QA live Telegram    | **Job:** `Run QA Lab live Telegram lane`<br />**Workflow di supporto:** job diretto<br />**Test:** QA Telegram live con lease delle credenziali Convex CI.<br />**Riesecuzione:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                      |
| Verificatore rilascio | **Job:** `Verify release checks`<br />**Workflow di supporto:** nessuno<br />**Test:** job release-check richiesti per il gruppo di riesecuzione selezionato.<br />**Riesecuzione:** riesegui dopo che i job figli mirati sono passati.                                                                                                                                                       |

## Chunk del percorso di rilascio Docker

La fase del percorso di rilascio Docker esegue questi chunk quando `live_suite_filter` è
vuoto:

| Chunk                                                           | Copertura                                                               |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Lane smoke del percorso di rilascio Docker core.                        |
| `package-update-openai`                                         | Installazione pacchetto OpenAI e comportamento di aggiornamento.         |
| `package-update-anthropic`                                      | Installazione pacchetto Anthropic e comportamento di aggiornamento.      |
| `package-update-core`                                           | Comportamento di pacchetto e aggiornamento indipendente dal provider.    |
| `plugins-runtime-plugins`                                       | Lane runtime Plugin che esercitano il comportamento dei Plugin.          |
| `plugins-runtime-services`                                      | Lane runtime Plugin supportate da servizi; include OpenWebUI quando richiesto. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Batch di installazione/runtime Plugin suddivisi per la validazione parallela del rilascio. |

Usa `docker_lanes=<lane[,lane]>` mirato nel workflow live/E2E riutilizzabile quando
è fallita una sola lane Docker. Gli artefatti di release includono comandi di
riesecuzione per lane con input per riutilizzare l'artefatto del pacchetto e
l'immagine quando disponibili.

## Profili di release

`release_profile` controlla principalmente l'ampiezza live/provider all'interno dei controlli di release.
Non rimuove la CI completa normale, Plugin Prerelease, install smoke, package
acceptance, QA Lab o i segmenti del percorso di release Docker. `full` fa anche sì che
l'esecuzione ombrello esegua Telegram E2E del pacchetto contro l'artefatto del pacchetto di release padre quando
`rerun_group=all`, così un candidato completo pre-pubblicazione non salta silenziosamente quella
lane del pacchetto Telegram.

| Profilo   | Uso previsto                      | Copertura live/provider inclusa                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke più rapido critico per la release.   | Percorso live OpenAI/core, modelli live Docker per OpenAI, core del gateway nativo, profilo gateway OpenAI nativo, plugin OpenAI nativo e gateway live Docker OpenAI.                     |
| `stable`  | Profilo predefinito di approvazione della release. | `minimum` più smoke Anthropic, Google, MiniMax, backend, harness di test live nativo, backend CLI live Docker, bind ACP Docker, harness Codex Docker e uno shard smoke OpenCode Go. |
| `full`    | Sweep consultivo ampio.             | `stable` più provider consultivi, shard live plugin e shard live media.                                                                                                        |

## Aggiunte solo full

Queste suite vengono saltate da `stable` e incluse da `full`:

| Area                             | Copertura solo full                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Modelli live Docker               | OpenCode Go, OpenRouter, xAI, Z.ai e Fireworks.                                                                          |
| Gateway live Docker              | Provider consultivi suddivisi negli shard DeepSeek/Fireworks, OpenCode Go/OpenRouter e xAI/Z.ai.                              |
| Profili provider del gateway nativo | Shard completi Anthropic Opus e Sonnet/Haiku, Fireworks, DeepSeek, shard completi dei modelli OpenCode Go, OpenRouter, xAI e Z.ai. |
| Shard live Plugin nativi        | Plugin A-K, L-N, O-Z altri, Moonshot e xAI.                                                                             |
| Shard live media nativi         | Audio, musica Google, musica MiniMax e gruppi video A-D.                                                                   |

`stable` include `native-live-src-gateway-profiles-anthropic-smoke` e
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` usa invece gli shard
più ampi dei modelli Anthropic e OpenCode Go. Le riesecuzioni mirate possono comunque usare gli
handle aggregati `native-live-src-gateway-profiles-anthropic` o
`native-live-src-gateway-profiles-opencode-go`.

## Riesecuzioni mirate

Usa `rerun_group` per evitare di ripetere box di release non correlati:

| Handle              | Ambito                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Tutti gli stadi di Full Release Validation.                                   |
| `ci`                | Solo figlio CI completa manuale.                                            |
| `plugin-prerelease` | Solo figlio Plugin Prerelease.                                         |
| `release-checks`    | Tutti gli stadi di OpenClaw Release Checks.                                   |
| `install-smoke`     | Install Smoke attraverso i controlli di release.                                 |
| `cross-os`          | Controlli di release Cross-OS.                                              |
| `live-e2e`          | Validazione repo/live E2E e percorso di release Docker.                     |
| `package`           | Package Acceptance.                                                   |
| `qa`                | Parità QA più lane live QA.                                         |
| `qa-parity`         | Solo lane e report di parità QA.                                      |
| `qa-live`           | Solo Matrix live QA e Telegram.                                     |
| `npm-telegram`      | Telegram E2E del pacchetto pubblicato; richiede `npm_telegram_package_spec`. |

Usa `live_suite_filter` con `rerun_group=live-e2e` quando una suite live è fallita.
Gli id filtro validi sono definiti nel workflow live/E2E riutilizzabile, inclusi
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` e
`live-codex-harness-docker`.

L'handle `live-gateway-advisory-docker` è un handle di riesecuzione aggregato per i suoi
tre shard provider, quindi si espande comunque a tutti i job del gateway Docker consultivo.

## Evidenze da conservare

Conserva il riepilogo `Full Release Validation` come indice a livello di release. Collega
gli id delle esecuzioni figlie e include tabelle dei job più lenti. Per gli errori, ispeziona prima il workflow
figlio, poi riesegui il più piccolo handle corrispondente sopra.

Artefatti utili:

- `release-package-under-test` dal padre Full Release Validation e `OpenClaw Release Checks`
- Artefatti del percorso di release Docker sotto `.artifacts/docker-tests/`
- `package-under-test` di Package Acceptance e artefatti di acceptance Docker
- Artefatti dei controlli di release Cross-OS per ciascun OS e suite
- Artefatti di parità QA, Matrix e Telegram

## File dei workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
