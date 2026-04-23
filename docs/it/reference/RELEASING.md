---
read_when:
    - Cerchi le definizioni dei canali di release pubblici
    - Cerchi naming delle versioni e cadenza
summary: Canali di release pubblici, naming delle versioni e cadenza
title: Policy di rilascio
x-i18n:
    generated_at: "2026-04-23T08:35:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: b31a9597d656ef33633e6aa1c1019287f7197bebff1e6b11d572e41c149c7cff
    source_path: reference/RELEASING.md
    workflow: 15
---

# Policy di rilascio

OpenClaw ha tre lane di rilascio pubbliche:

- stable: release taggate che pubblicano su npm `beta` per impostazione predefinita, oppure su npm `latest` quando richiesto esplicitamente
- beta: tag di prerelease che pubblicano su npm `beta`
- dev: la head mobile di `main`

## Naming delle versioni

- Versione di release stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versione di release stable correttiva: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versione di prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Non aggiungere zeri iniziali a mese o giorno
- `latest` indica l'attuale release npm stable promossa
- `beta` indica l'attuale destinazione di installazione beta
- Le release stable e le release stable correttive pubblicano su npm `beta` per impostazione predefinita; gli operatori di release possono puntare esplicitamente a `latest`, oppure promuovere in seguito una build beta validata
- Ogni release stable di OpenClaw distribuisce insieme il package npm e l'app macOS;
  le release beta normalmente validano e pubblicano prima il percorso npm/package, con
  build/sign/notarize dell'app mac riservati alla stable salvo richiesta esplicita

## Cadenza delle release

- Le release passano prima da beta
- Stable segue solo dopo che l'ultima beta è stata validata
- I maintainer normalmente tagliano le release da un branch `release/YYYY.M.D` creato
  dall'attuale `main`, così validazione e fix della release non bloccano il nuovo
  sviluppo su `main`
- Se un tag beta è stato pushato o pubblicato e richiede una correzione, i maintainer tagliano
  il successivo tag `-beta.N` invece di eliminare o ricreare il vecchio tag beta
- Procedura dettagliata di release, approvazioni, credenziali e note di
  ripristino sono riservate ai maintainer

## Preflight della release

- Esegui `pnpm check:test-types` prima del preflight della release così il TypeScript dei test resta
  coperto anche fuori dal gate locale più veloce `pnpm check`
- Esegui `pnpm check:architecture` prima del preflight della release così i controlli più ampi su
  cicli di import e confini architetturali siano verdi anche fuori dal gate locale più veloce
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check` così gli artifact di release
  attesi `dist/*` e il bundle Control UI esistano per il passaggio di
  validazione del pack
- Esegui `pnpm release:check` prima di ogni release taggata
- I controlli di release ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` esegue anche il parity gate mock di QA Lab più le lane QA live
  Matrix e Telegram prima dell'approvazione della release. Le lane live usano l'ambiente
  `qa-live-shared`; Telegram usa anche lease di credenziali CI Convex.
- La validazione runtime di installazione e upgrade cross-OS viene dispatchata dal
  workflow chiamante privato
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  che invoca il workflow pubblico riutilizzabile
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa separazione è intenzionale: mantiene il vero percorso di release npm breve,
  deterministico e focalizzato sugli artifact, mentre i controlli live più lenti restano nella loro
  lane così non rallentano né bloccano la pubblicazione
- I controlli di release devono essere dispatchati dal workflow ref `main` oppure da un
  workflow ref `release/YYYY.M.D` così la logica del workflow e i secret restano
  controllati
- Quel workflow accetta un tag release esistente oppure l'attuale SHA commit completo di 40 caratteri del branch del workflow
- In modalità commit-SHA accetta solo l'attuale HEAD del branch del workflow; usa un
  tag release per commit di release più vecchi
- Il preflight solo-validazione di `OpenClaw NPM Release` accetta anch'esso l'attuale SHA commit completo di 40 caratteri del branch del workflow senza richiedere un tag già pushato
- Quel percorso SHA è solo di validazione e non può essere promosso a una vera publish
- In modalità SHA il workflow sintetizza `v<package.json version>` solo per il controllo dei metadati del package; la vera publish richiede comunque un vero tag release
- Entrambi i workflow mantengono il vero percorso di publish e promozione su runner ospitati da GitHub, mentre il percorso di validazione non mutante può usare i più grandi runner Linux Blacksmith
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando sia i secret di workflow `OPENAI_API_KEY` sia `ANTHROPIC_API_KEY`
- Il preflight della release npm non attende più la lane separata di release checks
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o il tag beta/correttivo corrispondente) prima dell'approvazione
- Dopo la publish npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versione beta/correttiva corrispondente) per verificare il percorso
  di installazione dal registry pubblicato in un temp prefix fresco
- L'automazione di release dei maintainer ora usa preflight-then-promote:
  - la vera publish npm deve passare un `preflight_run_id` npm riuscito
  - la vera publish npm deve essere dispatchata dallo stesso branch `main` o
    `release/YYYY.M.D` della run di preflight riuscita
  - le release npm stable usano per default `beta`
  - la publish npm stable può puntare esplicitamente a `latest` tramite input del workflow
  - la mutazione token-based di npm dist-tag ora vive in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    per motivi di sicurezza, perché `npm dist-tag add` richiede ancora `NPM_TOKEN` mentre il
    repository pubblico mantiene publish solo OIDC
  - il pubblico `macOS Release` è solo di validazione
  - la vera publish privata mac deve passare un preflight mac privato riuscito
    `preflight_run_id` e `validate_run_id`
  - i veri percorsi di publish promuovono artifact preparati invece di ricostruirli di nuovo
- Per release stable correttive come `YYYY.M.D-N`, il verificatore post-publish
  controlla anche lo stesso percorso di upgrade temp-prefix da `YYYY.M.D` a `YYYY.M.D-N`
  così le correzioni di release non possono lasciare silenziosamente le installazioni globali più vecchie sul payload stable di base
- Il preflight della release npm fallisce in modo chiuso a meno che il tarball includa sia
  `dist/control-ui/index.html` sia un payload non vuoto `dist/control-ui/assets/`
  così non distribuiamo di nuovo una dashboard browser vuota
- La verifica post-publish controlla anche che l'installazione dal registry pubblicato
  contenga dipendenze runtime dei plugin inclusi non vuote sotto il layout root `dist/*`.
  Una release che distribuisce payload mancanti o vuoti di dipendenze dei plugin inclusi
  fallisce il verificatore postpublish e non può essere promossa
  a `latest`.
- `pnpm test:install:smoke` applica anche il budget `unpackedSize` del pack npm sul
  tarball candidato all'aggiornamento, così l'e2e dell'installer intercetta bloat accidentale del pack
  prima del percorso di publish della release
- Se il lavoro di release ha toccato pianificazione CI, manifest di timing delle extension o
  matrix dei test delle extension, rigenera e rivedi gli output della matrix
  `checks-node-extensions` di proprietà del planner da `.github/workflows/ci.yml`
  prima dell'approvazione così le note di release non descrivono un layout CI obsoleto
- La readiness della release stable macOS include anche le superfici di updater:
  - la release GitHub deve finire con `.zip`, `.dmg` e `.dSYM.zip` pacchettizzati
  - `appcast.xml` su `main` deve puntare al nuovo zip stable dopo la publish
  - l'app pacchettizzata deve mantenere un bundle id non-debug, un URL del feed
    Sparkle non vuoto e un `CFBundleVersion` pari o superiore al floor canonico di build Sparkle
    per quella versione di release

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag release obbligatorio come `v2026.4.2`, `v2026.4.2-1` oppure
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere l'attuale
  SHA commit completo di 40 caratteri del branch del workflow per preflight solo-validazione
- `preflight_only`: `true` per sola validazione/build/package, `false` per il
  vero percorso di publish
- `preflight_run_id`: obbligatorio nel vero percorso di publish così il workflow riusa
  il tarball preparato dalla run di preflight riuscita
- `npm_dist_tag`: tag npm di destinazione per il percorso di publish; predefinito `beta`

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: tag release esistente oppure l'attuale SHA commit completo di 40 caratteri di `main`
  da validare quando dispatchato da `main`; da un branch di release, usa un
  tag release esistente oppure l'attuale SHA commit completo di 40 caratteri del branch release

Regole:

- I tag stable e correttivi possono pubblicare sia su `beta` sia su `latest`
- I tag di prerelease beta possono pubblicare solo su `beta`
- Per `OpenClaw NPM Release`, l'input SHA commit completo è consentito solo quando
  `preflight_only=true`
- `OpenClaw Release Checks` è sempre solo-validazione e accetta anch'esso
  l'attuale SHA commit del branch del workflow
- La modalità commit-SHA dei release checks richiede anche l'attuale HEAD del branch del workflow
- Il vero percorso di publish deve usare lo stesso `npm_dist_tag` usato durante il preflight;
  il workflow verifica che quei metadati continuino prima della publish

## Sequenza di release npm stable

Quando tagli una release npm stable:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare l'attuale SHA commit completo del branch del workflow
     per una dry run solo-validazione del workflow di preflight
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una publish stable diretta
3. Esegui separatamente `OpenClaw Release Checks` con lo stesso tag oppure con lo
   SHA completo corrente del branch del workflow quando vuoi copertura su prompt cache live,
   QA Lab parity, Matrix e Telegram
   - Questo è separato di proposito così la copertura live resta disponibile senza
     riaccoppiare controlli lunghi o flaky al workflow di publish
4. Salva il `preflight_run_id` riuscito
5. Esegui di nuovo `OpenClaw NPM Release` con `preflight_only=false`, lo stesso
   `tag`, lo stesso `npm_dist_tag` e il `preflight_run_id` salvato
6. Se la release è finita su `beta`, usa il workflow privato
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   per promuovere quella versione stable da `beta` a `latest`
7. Se la release è stata intenzionalmente pubblicata direttamente su `latest` e `beta`
   deve seguire subito la stessa build stable, usa quello stesso workflow privato
   per puntare entrambi i dist-tag alla versione stable, oppure lascia che il suo sync
   self-healing schedulato sposti `beta` in seguito

La mutazione dei dist-tag vive nel repository privato per motivi di sicurezza perché richiede ancora
`NPM_TOKEN`, mentre il repository pubblico mantiene publish solo OIDC.

Questo mantiene documentati e visibili agli operatori sia il percorso di publish diretto sia il percorso di promozione beta-first.

## Riferimenti pubblici

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

I maintainer usano la documentazione di release privata in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
come runbook effettivo.
