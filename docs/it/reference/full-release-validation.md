---
read_when:
    - Esecuzione o riesecuzione della convalida completa della release
    - Confronto tra i profili di convalida delle release stabile e completa
    - Risoluzione degli errori nella fase di validazione del rilascio
summary: Fasi della convalida completa del rilascio, workflow figli, profili di rilascio, handle di riesecuzione e prove
title: Convalida completa della release
x-i18n:
    generated_at: "2026-05-10T19:50:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a479b2d79ae2710c501d583ad14f913a32382bba8dfd7ec9d25124357743e20
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` è il contenitore di rilascio. È l’unico punto di
ingresso manuale per la prova pre-rilascio, ma la maggior parte del lavoro
avviene nei flussi di lavoro figlio, così un ambiente non riuscito può essere
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

I flussi di lavoro figlio usano il riferimento di workflow attendibile per
l’harness e l’input `ref` per il candidato in test. Questo mantiene disponibile
la nuova logica di validazione quando si valida un branch o tag di rilascio meno
recente.

Per impostazione predefinita, `release_profile=stable` esegue le corsie
bloccanti per il rilascio e salta il soak live/Docker esaustivo. Passa
`run_release_soak=true` per includere le corsie di soak in un’esecuzione stable.
`release_profile=full` abilita sempre le corsie di soak, così il profilo
consultivo ampio non perde copertura in modo silenzioso.

Package Acceptance normalmente crea il tarball candidato dal `ref` risolto,
incluse le esecuzioni con SHA completo avviate con `pnpm ci:full-release`. Dopo
la pubblicazione, passa `package_acceptance_package_spec=openclaw@YYYY.M.D`
(oppure `openclaw@beta`/`openclaw@latest`) per eseguire invece la stessa matrice
di package/aggiornamento contro il package npm rilasciato.

## Fasi di primo livello

| Fase                 | Dettagli                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Risoluzione target   | **Job:** `Resolve target ref`<br />**Flusso di lavoro figlio:** nessuno<br />**Prova:** risolve il branch di rilascio, il tag o lo SHA completo del commit e registra gli input selezionati.<br />**Riesecuzione:** riesegui il contenitore se questa fase non riesce.                                                                                                                                                                                  |
| Vitest e CI normale  | **Job:** `Run normal full CI`<br />**Flusso di lavoro figlio:** `CI`<br />**Prova:** grafo CI completo manuale contro il ref target, incluse le corsie Linux Node, gli shard dei Plugin in bundle, i contratti dei canali, la compatibilità Node 22, `check`, `check-additional`, smoke build, controlli docs, Skills Python, Windows, macOS, i18n della Control UI e Android tramite il contenitore.<br />**Riesecuzione:** `rerun_group=ci`. |
| Prerelease Plugin    | **Job:** `Run plugin prerelease validation`<br />**Flusso di lavoro figlio:** `Plugin Prerelease`<br />**Prova:** controlli statici solo di rilascio per Plugin, copertura agentica dei Plugin, shard batch completi delle estensioni e corsie Docker di prerelease dei Plugin.<br />**Riesecuzione:** `rerun_group=plugin-prerelease`.                                                                                                                  |
| Controlli rilascio   | **Job:** `Run release/live/Docker/QA validation`<br />**Flusso di lavoro figlio:** `OpenClaw Release Checks`<br />**Prova:** smoke install, controlli package cross-OS, Package Acceptance, parità QA Lab, Matrix live e Telegram live. Con `run_release_soak=true` o `release_profile=full`, esegue anche suite live/E2E esaustive e blocchi del percorso di rilascio Docker.<br />**Riesecuzione:** `rerun_group=release-checks` o un handle release-checks più ristretto. |
| Artefatto package    | **Job:** `Prepare release package artifact`<br />**Flusso di lavoro figlio:** nessuno<br />**Prova:** crea il tarball padre `release-package-under-test` abbastanza presto per i controlli rivolti ai package che non devono attendere `OpenClaw Release Checks`.<br />**Riesecuzione:** riesegui il contenitore o fornisci `npm_telegram_package_spec` per `rerun_group=npm-telegram`.                                                                 |
| Package Telegram     | **Job:** `Run package Telegram E2E`<br />**Flusso di lavoro figlio:** `NPM Telegram Beta E2E`<br />**Prova:** prova del package Telegram basata sull’artefatto padre per `rerun_group=all` con `release_profile=full`, oppure prova Telegram del package pubblicato quando `npm_telegram_package_spec` è impostato.<br />**Riesecuzione:** `rerun_group=npm-telegram` con `npm_telegram_package_spec`.                                               |
| Verificatore ombrello | **Job:** `Verify full validation`<br />**Flusso di lavoro figlio:** nessuno<br />**Prova:** ricontrolla le conclusioni registrate delle esecuzioni figlio e aggiunge tabelle dei job più lenti dai flussi di lavoro figlio.<br />**Riesecuzione:** riesegui solo questo job dopo aver rieseguito un figlio non riuscito fino a renderlo verde.                                                                                                         |

Per `ref=main` e `rerun_group=all`, un contenitore più recente sostituisce uno
meno recente. Quando il padre viene annullato, il suo monitor annulla qualsiasi
flusso di lavoro figlio che ha già avviato. Le esecuzioni di validazione di
branch e tag di rilascio non si annullano tra loro per impostazione predefinita.

## Fasi dei controlli di rilascio

`OpenClaw Release Checks` è il flusso di lavoro figlio più grande. Risolve il
target una sola volta e prepara un artefatto condiviso `release-package-under-test`
quando le fasi rivolte a package o Docker ne hanno bisogno.

| Fase                | Dettagli                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target di rilascio  | **Job:** `Resolve target ref`<br />**Workflow di supporto:** nessuno<br />**Test:** ref selezionato, SHA previsto opzionale, profilo, gruppo di riesecuzione e filtro focalizzato della suite live.<br />**Riesecuzione:** `rerun_group=release-checks`.                                                                                                                                                                                                                                             |
| Artefatto pacchetto | **Job:** `Prepare release package artifact`<br />**Workflow di supporto:** nessuno<br />**Test:** crea pacchetti o risolve un tarball candidato e carica `release-package-under-test` per i controlli downstream rivolti al pacchetto.<br />**Riesecuzione:** il gruppo pacchetto, cross-OS o live/E2E interessato.                                                                                                                                                                                  |
| Smoke di installazione | **Job:** `Run install smoke`<br />**Workflow di supporto:** `Install Smoke`<br />**Test:** percorso di installazione completo con riuso dell'immagine smoke Dockerfile root, installazione del pacchetto QR, smoke Docker root e Gateway, test Docker dell'installer, smoke del provider di immagini con installazione globale Bun, ed E2E rapido di installazione/disinstallazione dei Plugin inclusi.<br />**Riesecuzione:** `rerun_group=install-smoke`.                                      |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Workflow di supporto:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Test:** corsie fresh e upgrade su Linux, Windows e macOS per il provider e la modalità selezionati, usando il tarball candidato più un pacchetto baseline.<br />**Riesecuzione:** `rerun_group=cross-os`.                                                                                                                                                                      |
| Repo ed E2E live    | **Job:** `Run repo/live E2E validation`<br />**Workflow di supporto:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** E2E del repository, cache live, streaming websocket OpenAI, shard del provider live nativo e dei Plugin, e harness di modello/backend/Gateway live basati su Docker selezionati da `release_profile`.<br />**Esecuzioni:** `run_release_soak=true`, `release_profile=full` o `rerun_group=live-e2e` focalizzato.<br />**Riesecuzione:** `rerun_group=live-e2e`, facoltativamente con `live_suite_filter`. |
| Percorso di rilascio Docker | **Job:** `Run Docker release-path validation`<br />**Workflow di supporto:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** blocchi Docker del percorso di rilascio contro l'artefatto pacchetto condiviso.<br />**Esecuzioni:** `run_release_soak=true`, `release_profile=full` o `rerun_group=live-e2e` focalizzato.<br />**Riesecuzione:** `rerun_group=live-e2e`.                                                                                                                     |
| Accettazione pacchetto | **Job:** `Run package acceptance`<br />**Workflow di supporto:** `Package Acceptance`<br />**Test:** fixture offline dei pacchetti Plugin, aggiornamento Plugin, accettazione pacchetto Telegram con mock OpenAI, e controlli di sopravvivenza all'upgrade pubblicato contro lo stesso tarball. I controlli di rilascio bloccanti usano la baseline pubblicata più recente predefinita; i controlli soak si espandono a ogni rilascio npm stabile a partire da `2026.4.23` più le fixture dei problemi segnalati.<br />**Riesecuzione:** `rerun_group=package`. |
| Parità QA           | **Job:** `Run QA Lab parity lane` e `Run QA Lab parity report`<br />**Workflow di supporto:** job diretti<br />**Test:** pacchetti di parità agentica candidato e baseline, poi il report di parità.<br />**Riesecuzione:** `rerun_group=qa-parity` o `rerun_group=qa`.                                                                                                                                                                                                                              |
| Matrix QA live      | **Job:** `Run QA Lab live Matrix lane`<br />**Workflow di supporto:** job diretto<br />**Test:** profilo QA Matrix live rapido nell'ambiente `qa-live-shared`.<br />**Riesecuzione:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                                     |
| Telegram QA live    | **Job:** `Run QA Lab live Telegram lane`<br />**Workflow di supporto:** job diretto<br />**Test:** QA Telegram live con lease delle credenziali Convex CI.<br />**Riesecuzione:** `rerun_group=qa-live` o `rerun_group=qa`.                                                                                                                                                                                                                                                                       |
| Verificatore rilascio | **Job:** `Verify release checks`<br />**Workflow di supporto:** nessuno<br />**Test:** job di controllo del rilascio richiesti per il gruppo di riesecuzione selezionato.<br />**Riesecuzione:** riesegui dopo che i job figli focalizzati sono passati.                                                                                                                                                                                                                                            |

## Blocchi del percorso di rilascio Docker

La fase del percorso di rilascio Docker esegue questi blocchi quando `live_suite_filter` è
vuoto:

| Blocco                                                          | Copertura                                                                        |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `core`                                                          | Corsie smoke del percorso di rilascio Docker core.                               |
| `package-update-openai`                                         | Comportamento di installazione/aggiornamento del pacchetto OpenAI, inclusa l'installazione on-demand di Codex. |
| `package-update-anthropic`                                      | Comportamento di installazione e aggiornamento del pacchetto Anthropic.          |
| `package-update-core`                                           | Comportamento di pacchetto e aggiornamento neutrale rispetto al provider.        |
| `plugins-runtime-plugins`                                       | Corsie runtime dei Plugin che esercitano il comportamento dei Plugin.            |
| `plugins-runtime-services`                                      | Corsie runtime dei Plugin live e supportate da servizi; include OpenWebUI quando richiesto. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Batch di installazione/runtime dei Plugin suddivisi per la convalida parallela del rilascio. |

Usa `docker_lanes=<lane[,lane]>` mirato nel workflow live/E2E riutilizzabile quando
è fallita una sola corsia Docker. Gli artefatti di rilascio includono comandi di riesecuzione
per corsia con artefatto pacchetto e input di riuso immagine quando disponibili.

## Profili di rilascio

`release_profile` controlla principalmente l'ampiezza live/provider all'interno dei controlli di rilascio.
Non rimuove la normale CI completa, Plugin Prerelease, smoke di installazione, accettazione
pacchetto o QA Lab. Per `stable`, E2E repo/live esaustivo e blocchi del
percorso di rilascio Docker sono copertura soak e vengono eseguiti quando `run_release_soak=true`.
`full` forza l'attivazione della copertura soak e fa anche sì che l'esecuzione ombrello esegua l'E2E Telegram del pacchetto
contro l'artefatto pacchetto di rilascio padre quando `rerun_group=all`, così un candidato
pre-pubblicazione completo non salta silenziosamente quella corsia pacchetto Telegram.

| Profilo  | Uso previsto                         | Copertura live/provider inclusa                                                                                                                                                    |
| -------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke più rapido critico per il rilascio. | Percorso live OpenAI/core, modelli live Docker per OpenAI, core Gateway nativo, profilo Gateway OpenAI nativo, Plugin OpenAI nativo e Gateway OpenAI live Docker.                 |
| `stable`  | Profilo predefinito di approvazione del rilascio. | `minimum` più smoke Anthropic, Google, MiniMax, backend, harness di test live nativo, backend CLI live Docker, bind ACP Docker, harness Codex Docker e uno shard smoke OpenCode Go. |
| `full`    | Ampia scansione consultiva.           | `stable` più provider consultivi, shard live dei Plugin e shard live media.                                                                                                        |

## Aggiunte solo full

Queste suite vengono saltate da `stable` e incluse da `full`:

| Area                             | Copertura solo full                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Modelli live Docker              | OpenCode Go, OpenRouter, xAI, Z.ai e Fireworks.                                                                          |
| Gateway live Docker              | Provider consultivi suddivisi in shard DeepSeek/Fireworks, OpenCode Go/OpenRouter e xAI/Z.ai.                           |
| Profili provider Gateway nativo  | Shard Anthropic Opus e Sonnet/Haiku completi, Fireworks, DeepSeek, shard completi dei modelli OpenCode Go, OpenRouter, xAI e Z.ai. |
| Shard live dei Plugin nativi     | Plugin A-K, L-N, O-Z altri, Moonshot e xAI.                                                                              |
| Shard live media nativi          | Gruppi audio, musica Google, musica MiniMax e video A-D.                                                                 |

`stable` include `native-live-src-gateway-profiles-anthropic-smoke` e
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` usa invece gli shard di modelli
Anthropic e OpenCode Go più ampi. Le riesecuzioni focalizzate possono comunque usare gli handle
aggregati `native-live-src-gateway-profiles-anthropic` o
`native-live-src-gateway-profiles-opencode-go`.

## Riesecuzioni focalizzate

Usa `rerun_group` per evitare di ripetere box di rilascio non correlati:

| Handle              | Ambito                                                                |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Tutte le fasi di convalida completa della release.                    |
| `ci`                | Solo figlio CI completo manuale.                                      |
| `plugin-prerelease` | Solo figlio pre-release Plugin.                                       |
| `release-checks`    | Tutte le fasi dei controlli di release OpenClaw.                      |
| `install-smoke`     | Smoke di installazione tramite i controlli di release.                |
| `cross-os`          | Controlli di release cross-OS.                                        |
| `live-e2e`          | Convalida E2E repo/live e del percorso di release Docker.             |
| `package`           | Accettazione del pacchetto.                                           |
| `qa`                | Parità QA più corsie QA live.                                         |
| `qa-parity`         | Solo corsie e report di parità QA.                                    |
| `qa-live`           | Solo QA live Matrix e Telegram.                                       |
| `npm-telegram`      | E2E Telegram del pacchetto pubblicato; richiede `npm_telegram_package_spec`. |

Usa `live_suite_filter` con `rerun_group=live-e2e` quando una suite live non è riuscita.
Gli ID filtro validi sono definiti nel workflow live/E2E riutilizzabile, inclusi
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` e
`live-codex-harness-docker`.

L'handle `live-gateway-advisory-docker` è un handle di riesecuzione aggregato per i suoi
tre shard di provider, quindi si espande comunque a tutti i job Gateway Docker consultivi.

Usa `cross_os_suite_filter` con `rerun_group=cross-os` quando una corsia cross-OS
non è riuscita. Il filtro accetta un ID OS, un ID suite o una coppia OS/suite, per
esempio `windows/packaged-upgrade`, `windows` o `packaged-fresh`. I riepiloghi cross-OS
includono i tempi per fase per le corsie di upgrade pacchettizzato, e i comandi a lunga
esecuzione stampano righe di Heartbeat così un aggiornamento Windows bloccato è visibile prima del
timeout del job.

Le corsie QA dei controlli di release sono consultive. Un errore solo QA viene segnalato come avviso
e non blocca il verificatore dei controlli di release; riesegui `rerun_group=qa`,
`qa-parity` o `qa-live` quando ti servono prove QA aggiornate.

## Prove da conservare

Conserva il riepilogo `Full Release Validation` come indice a livello di release. Collega
gli ID delle esecuzioni figlie e include tabelle dei job più lenti. Per gli errori, ispeziona prima il
workflow figlio, poi riesegui l'handle corrispondente più piccolo tra quelli sopra.

Artefatti utili:

- `release-package-under-test` dal padre Full Release Validation e `OpenClaw Release Checks`
- Artefatti del percorso di release Docker in `.artifacts/docker-tests/`
- `package-under-test` di Accettazione del pacchetto e artefatti di accettazione Docker
- Artefatti dei controlli di release cross-OS per ciascun OS e suite
- Artefatti di parità QA, Matrix e Telegram

## File di workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
