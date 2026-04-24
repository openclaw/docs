---
read_when:
    - 'Cerchi le definizioni dei canali di rilascio pubblici】【：】【“】【analysis to=final code:  true'
    - Cerchi denominazione delle versioni e cadenza
summary: Canali di rilascio pubblici, denominazione delle versioni e cadenza
title: Policy di rilascio
x-i18n:
    generated_at: "2026-04-24T08:59:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2cba6cd02c6fb2380abd8d46e10567af2f96c7c6e45236689d69289348b829ce
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw ha tre canali di rilascio pubblici:

- stable: release taggate che pubblicano su npm `beta` per impostazione predefinita, oppure su npm `latest` quando richiesto esplicitamente
- beta: tag prerelease che pubblicano su npm `beta`
- dev: la head mobile di `main`

## Denominazione delle versioni

- Versione release stable: `YYYY.M.D`
  - Tag git: `vYYYY.M.D`
- Versione release stable correction: `YYYY.M.D-N`
  - Tag git: `vYYYY.M.D-N`
- Versione prerelease beta: `YYYY.M.D-beta.N`
  - Tag git: `vYYYY.M.D-beta.N`
- Non usare zero-padding per mese o giorno
- `latest` significa la release npm stable promossa corrente
- `beta` significa il target di installazione beta corrente
- Le release stable e stable correction pubblicano su npm `beta` per impostazione predefinita; gli operatori di rilascio possono puntare esplicitamente a `latest`, oppure promuovere successivamente una build beta verificata
- Ogni release stable di OpenClaw distribuisce insieme il package npm e l'app macOS;
  le release beta normalmente convalidano e pubblicano prima il percorso npm/package, con
  build/sign/notarize dell'app macOS riservati a stable salvo richiesta esplicita

## Cadenza dei rilasci

- I rilasci passano prima da beta
- Stable segue solo dopo che l'ultima beta è stata validata
- I maintainer normalmente tagliano i rilasci da un branch `release/YYYY.M.D` creato
  dalla `main` corrente, così validazione e fix del rilascio non bloccano il nuovo
  sviluppo su `main`
- Se un tag beta è stato pushato o pubblicato e richiede una correzione, i maintainer tagliano
  il successivo tag `-beta.N` invece di eliminare o ricreare il vecchio tag beta
- La procedura dettagliata di rilascio, le approvazioni, le credenziali e le note di recupero sono riservate ai maintainer

## Preflight del rilascio

- Esegui `pnpm check:test-types` prima del preflight del rilascio così il TypeScript dei test resta
  coperto anche al di fuori del più rapido gate locale `pnpm check`
- Esegui `pnpm check:architecture` prima del preflight del rilascio così i controlli più ampi su cicli di import
  e confini architetturali sono verdi al di fuori del gate locale più rapido
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check` così gli artefatti di rilascio attesi
  `dist/*` e il bundle Control UI esistono per il passaggio di
  validazione del pack
- Esegui `pnpm release:check` prima di ogni rilascio taggato
- I controlli di rilascio ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` esegue anche il gate di parità mock QA Lab più le lane live
  QA Matrix e Telegram prima dell'approvazione del rilascio. Le lane live usano l'ambiente
  `qa-live-shared`; Telegram usa anche lease di credenziali Convex CI.
- La validazione runtime cross-OS di installazione e upgrade viene dispatchata dal
  workflow caller privato
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  che richiama il workflow pubblico riutilizzabile
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa separazione è intenzionale: mantieni il percorso reale di rilascio npm breve,
  deterministico e focalizzato sugli artefatti, mentre i controlli live più lenti restano nella loro
  lane così non rallentano o bloccano la pubblicazione
- I controlli di rilascio devono essere dispatchati dal workflow ref `main` o da un
  workflow ref `release/YYYY.M.D` così la logica del workflow e i segreti restano
  controllati
- Quel workflow accetta un tag di rilascio esistente oppure l'attuale SHA commit completo a 40 caratteri del branch del workflow
- In modalità commit-SHA accetta solo l'HEAD corrente del branch del workflow; usa un
  tag di rilascio per commit di rilascio più vecchi
- Anche il preflight di sola validazione di `OpenClaw NPM Release` accetta
  l'attuale SHA commit completo a 40 caratteri del branch del workflow senza richiedere
  un tag pushato
- Quel percorso SHA è solo di validazione e non può essere promosso a una pubblicazione reale
- In modalità SHA il workflow sintetizza `v<package.json version>` solo per il controllo dei metadati del package; la pubblicazione reale richiede comunque un vero tag di rilascio
- Entrambi i workflow mantengono il vero percorso di publish e promotion su runner GitHub-hosted, mentre il percorso di validazione non mutante può usare i più grandi runner Linux di Blacksmith
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando entrambi i secret del workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- Il preflight del rilascio npm non attende più la lane separata dei release checks
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (oppure il tag beta/correction corrispondente) prima dell'approvazione
- Dopo la pubblicazione npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (oppure la versione beta/correction corrispondente) per verificare il percorso di installazione
  pubblicato nel registro in un prefisso temp pulito
- Dopo una pubblicazione beta, esegui `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  per verificare onboarding del package installato, setup Telegram e Telegram E2E reale
  contro il package npm pubblicato usando il pool condiviso di credenziali Telegram in lease.
  I one-off locali dei maintainer possono omettere le variabili Convex e passare direttamente
  le tre credenziali env `OPENCLAW_QA_TELEGRAM_*`.
- I maintainer possono eseguire lo stesso controllo post-publish da GitHub Actions tramite il
  workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e
  non viene eseguito a ogni merge.
- L'automazione di rilascio dei maintainer ora usa preflight-then-promote:
  - la pubblicazione npm reale deve superare un `preflight_run_id` npm riuscito
  - la pubblicazione npm reale deve essere dispatchata dallo stesso branch `main` o
    `release/YYYY.M.D` della run preflight riuscita
  - le release npm stable hanno come predefinito `beta`
  - la pubblicazione npm stable può puntare esplicitamente a `latest` tramite input del workflow
  - la mutazione token-based dei dist-tag npm ora si trova in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    per motivi di sicurezza, perché `npm dist-tag add` richiede ancora `NPM_TOKEN` mentre il
    repository pubblico mantiene la pubblicazione solo OIDC
  - il `macOS Release` pubblico è solo di validazione
  - il vero publish mac privato deve superare con successo i `preflight_run_id` e `validate_run_id`
    privati di mac
  - i percorsi di publish reali promuovono artefatti preparati invece di ricostruirli di nuovo
- Per le release stable correction come `YYYY.M.D-N`, il verificatore post-publish
  controlla anche lo stesso percorso di upgrade con prefisso temp da `YYYY.M.D` a `YYYY.M.D-N`
  così le release correction non possono lasciare silenziosamente le installazioni globali
  più vecchie sul payload stable di base
- Il preflight del rilascio npm fallisce in modo chiuso a meno che il tarball non includa sia
  `dist/control-ui/index.html` sia un payload non vuoto `dist/control-ui/assets/`
  così non distribuiamo di nuovo una dashboard browser vuota
- La verifica post-publish controlla anche che l'installazione pubblicata dal registro
  contenga dipendenze runtime dei Plugin inclusi non vuote sotto il layout root `dist/*`.
  Un rilascio distribuito con payload di dipendenze dei Plugin inclusi mancanti o vuoti
  fallisce il verificatore postpublish e non può essere promosso a `latest`.
- Anche `pnpm test:install:smoke` applica il budget `unpackedSize` del pack npm sul
  tarball di aggiornamento candidato, così l'e2e dell'installer intercetta l'aumento
  accidentale delle dimensioni del pack prima del percorso di publish del rilascio
- Se il lavoro di rilascio ha toccato la pianificazione CI, i manifest dei tempi delle estensioni o
  le matrici di test delle estensioni, rigenera e verifica gli output della matrice del workflow
  `checks-node-extensions` posseduti dal planner da `.github/workflows/ci.yml`
  prima dell'approvazione così le note di rilascio non descrivono un layout CI obsoleto
- La prontezza al rilascio stable macOS include anche le superfici dell'updater:
  - la release GitHub deve finire con i file pacchettizzati `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` su `main` deve puntare al nuovo zip stable dopo il publish
  - l'app pacchettizzata deve mantenere un bundle id non-debug, un feed
    URL Sparkle non vuoto e un `CFBundleVersion` pari o superiore al build floor Sparkle canonico
    per quella versione di rilascio

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio come `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere l'attuale
  SHA commit completo a 40 caratteri del branch del workflow per il solo preflight di validazione
- `preflight_only`: `true` per sola validazione/build/package, `false` per il
  vero percorso di publish
- `preflight_run_id`: obbligatorio nel vero percorso di publish così il workflow riutilizza
  il tarball preparato dalla run preflight riuscita
- `npm_dist_tag`: tag npm di destinazione per il percorso di publish; il valore predefinito è `beta`

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: tag di rilascio esistente oppure l'attuale SHA commit completo a 40 caratteri di `main`
  da validare quando dispatchato da `main`; da un release branch, usa un
  tag di rilascio esistente o l'attuale SHA commit completo a 40 caratteri del branch di rilascio

Regole:

- I tag stable e correction possono pubblicare sia su `beta` sia su `latest`
- I tag prerelease beta possono pubblicare solo su `beta`
- Per `OpenClaw NPM Release`, l'input SHA commit completo è consentito solo quando
  `preflight_only=true`
- `OpenClaw Release Checks` è sempre solo di validazione e accetta anche lo
  SHA commit corrente del branch del workflow
- La modalità commit-SHA dei release checks richiede anche l'HEAD corrente del branch del workflow
- Il vero percorso di publish deve usare lo stesso `npm_dist_tag` usato durante il preflight;
  il workflow verifica che quei metadati restino coerenti prima della pubblicazione

## Sequenza del rilascio npm stable

Quando si taglia un rilascio npm stable:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare l'attuale SHA commit completo del branch del workflow
     per una dry run di sola validazione del workflow di preflight
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stable diretta
3. Esegui separatamente `OpenClaw Release Checks` con lo stesso tag o con lo
   SHA completo corrente del branch del workflow quando vuoi copertura live di prompt cache,
   parità QA Lab, Matrix e Telegram
   - Questa separazione è intenzionale così la copertura live resta disponibile senza
     riaccoppiare controlli lunghi o flaky al workflow di pubblicazione
4. Salva il `preflight_run_id` riuscito
5. Esegui di nuovo `OpenClaw NPM Release` con `preflight_only=false`, lo stesso
   `tag`, lo stesso `npm_dist_tag` e il `preflight_run_id` salvato
6. Se il rilascio è finito su `beta`, usa il workflow privato
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   per promuovere quella versione stable da `beta` a `latest`
7. Se il rilascio ha pubblicato intenzionalmente direttamente su `latest` e `beta`
   dovrebbe seguire immediatamente la stessa build stable, usa quello stesso workflow privato
   per puntare entrambi i dist-tag alla versione stable, oppure lascia che la sua sincronizzazione
   di self-healing pianificata sposti `beta` in seguito

La mutazione dei dist-tag vive nel repository privato per motivi di sicurezza perché richiede ancora
`NPM_TOKEN`, mentre il repository pubblico mantiene la pubblicazione solo OIDC.

Questo mantiene documentati e visibili agli operatori sia il percorso di publish diretto sia quello di promozione beta-first.

## Riferimenti pubblici

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

I maintainer usano la documentazione di rilascio privata in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
come vero runbook.

## Correlati

- [Canali di rilascio](/it/install/development-channels)
