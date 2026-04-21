---
read_when:
    - Cerchi le definizioni dei canali di rilascio pubblici
    - Cerchi la denominazione delle versioni e la cadenza
summary: Canali di rilascio pubblici, denominazione delle versioni e cadenza
title: Policy di rilascio
x-i18n:
    generated_at: "2026-04-21T08:28:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 356844708f6ecdae4acfcce853ce16ae962914a9fdd1cfc38a22ac4c439ba172
    source_path: reference/RELEASING.md
    workflow: 15
---

# Policy di rilascio

OpenClaw ha tre lane di rilascio pubbliche:

- stable: release con tag che pubblicano su npm `beta` per impostazione predefinita, oppure su npm `latest` quando richiesto esplicitamente
- beta: tag di prerelease che pubblicano su npm `beta`
- dev: la head mobile di `main`

## Denominazione delle versioni

- Versione di release stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versione di release stable correttiva: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versione di prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Non aggiungere zeri iniziali a mese o giorno
- `latest` indica l'attuale release npm stable promossa
- `beta` indica l'attuale target di installazione beta
- Le release stable e stable correttive pubblicano su npm `beta` per impostazione predefinita; gli operatori di rilascio possono scegliere esplicitamente `latest` come target, oppure promuovere in seguito una build beta verificata
- Ogni release stable di OpenClaw distribuisce insieme il pacchetto npm e l'app macOS;
  le release beta normalmente validano e pubblicano prima il percorso npm/package, con
  build/firma/notarizzazione dell'app mac riservate a stable salvo richiesta esplicita

## Cadenza di rilascio

- Le release seguono un flusso beta-first
- Stable segue solo dopo che l'ultima beta è stata validata
- I maintainer normalmente creano le release da un branch `release/YYYY.M.D` creato
  dall'attuale `main`, così la validazione della release e le correzioni non bloccano
  il nuovo sviluppo su `main`
- Se un tag beta è già stato pushato o pubblicato e richiede una correzione, i maintainer creano
  il tag `-beta.N` successivo invece di eliminare o ricreare il vecchio tag beta
- La procedura dettagliata di rilascio, le approvazioni, le credenziali e le note di ripristino sono
  riservate ai maintainer

## Preflight di rilascio

- Esegui `pnpm check:test-types` prima del preflight di rilascio così il TypeScript dei test resta
  coperto anche fuori dal più rapido gate locale `pnpm check`
- Esegui `pnpm check:architecture` prima del preflight di rilascio così i controlli più ampi
  sui cicli di import e sui confini architetturali risultano verdi anche fuori dal gate locale più rapido
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check` così gli attesi
  artefatti di rilascio `dist/*` e il bundle della Control UI esistono per il passaggio di
  validazione del pack
- Esegui `pnpm release:check` prima di ogni release con tag
- I controlli di rilascio ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- La validazione runtime di installazione e aggiornamento cross-OS viene dispatchata dal
  workflow chiamante privato
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  che invoca il workflow pubblico riutilizzabile
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa separazione è intenzionale: mantiene il vero percorso di rilascio npm breve,
  deterministico e focalizzato sugli artefatti, mentre i controlli live più lenti restano nel
  proprio lane così non rallentano né bloccano la pubblicazione
- I controlli di rilascio devono essere dispatchati dal ref del workflow `main` oppure da un
  ref del workflow `release/YYYY.M.D` così la logica del workflow e i segreti restano
  controllati
- Quel workflow accetta un tag di release esistente oppure l'attuale SHA di commit a 40 caratteri completo del branch del workflow
- In modalità commit-SHA accetta solo l'attuale HEAD del branch del workflow; usa un
  tag di release per commit di release più vecchi
- Anche il preflight di sola validazione `OpenClaw NPM Release` accetta l'attuale
  SHA di commit a 40 caratteri completo del branch del workflow senza richiedere un tag già pushato
- Quel percorso SHA è solo di validazione e non può essere promosso a una vera pubblicazione
- In modalità SHA il workflow sintetizza `v<package.json version>` solo per il controllo
  dei metadati del pacchetto; la vera pubblicazione richiede comunque un vero tag di release
- Entrambi i workflow mantengono il vero percorso di pubblicazione e promozione su runner ospitati da GitHub, mentre il
  percorso di validazione non mutante può usare i runner Linux Blacksmith più grandi
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando entrambi i segreti del workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- Il preflight di rilascio npm non attende più il lane separato dei controlli di rilascio
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o il tag beta/correttivo corrispondente) prima dell'approvazione
- Dopo la pubblicazione npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versione beta/correttiva corrispondente) per verificare il percorso di installazione
  del registry pubblicato in un nuovo prefisso temporaneo
- L'automazione di rilascio dei maintainer ora usa preflight-then-promote:
  - la vera pubblicazione npm deve superare con esito positivo un `preflight_run_id` npm
  - la vera pubblicazione npm deve essere dispatchata dallo stesso branch `main` o
    `release/YYYY.M.D` del run di preflight riuscito
  - le release npm stable hanno come default `beta`
  - la pubblicazione npm stable può avere come target `latest` esplicitamente tramite input del workflow
  - la mutazione del dist-tag npm basata su token ora si trova in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    per motivi di sicurezza, perché `npm dist-tag add` richiede ancora `NPM_TOKEN` mentre il
    repo pubblico mantiene una pubblicazione solo OIDC
  - il `macOS Release` pubblico è solo di validazione
  - la vera pubblicazione mac privata deve superare un preflight mac privato riuscito
    `preflight_run_id` e `validate_run_id`
  - i veri percorsi di pubblicazione promuovono artefatti preparati invece di ricostruirli di nuovo
- Per release stable correttive come `YYYY.M.D-N`, il verificatore post-pubblicazione
  controlla anche lo stesso percorso di aggiornamento con prefisso temporaneo da `YYYY.M.D` a `YYYY.M.D-N`
  così le correzioni di rilascio non possono lasciare silenziosamente le vecchie installazioni globali sul
  payload stable di base
- Il preflight di rilascio npm fallisce in modo chiuso a meno che il tarball includa sia
  `dist/control-ui/index.html` sia un payload `dist/control-ui/assets/` non vuoto
  così non distribuiamo di nuovo una dashboard browser vuota
- `pnpm test:install:smoke` impone anche il budget `unpackedSize` del pack npm sul
  tarball candidato all'aggiornamento, così l'e2e dell'installer intercetta aumenti accidentali del pack
  prima del percorso di pubblicazione della release
- Se il lavoro di rilascio ha toccato la pianificazione CI, i manifest dei tempi delle extension o
  le matrici di test delle extension, rigenera e rivedi gli output della matrice del workflow
  `checks-node-extensions` gestiti dal planner da `.github/workflows/ci.yml`
  prima dell'approvazione così le note di rilascio non descrivono un layout CI obsoleto
- La readiness della release stable macOS include anche le superfici dell'updater:
  - la release GitHub deve finire con i pacchetti `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` su `main` deve puntare al nuovo zip stable dopo la pubblicazione
  - l'app pacchettizzata deve mantenere un bundle id non-debug, un feed Sparkle
    URL non vuoto e un `CFBundleVersion` pari o superiore al floor canonico della build Sparkle
    per quella versione di release

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di release obbligatorio come `v2026.4.2`, `v2026.4.2-1` oppure
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere l'attuale
  SHA di commit a 40 caratteri completo del branch del workflow per preflight di sola validazione
- `preflight_only`: `true` per sola validazione/build/package, `false` per il
  vero percorso di pubblicazione
- `preflight_run_id`: richiesto nel vero percorso di pubblicazione così il workflow riusa
  il tarball preparato dal run di preflight riuscito
- `npm_dist_tag`: tag npm di destinazione per il percorso di pubblicazione; predefinito `beta`

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: tag di release esistente oppure l'attuale SHA di commit `main` completo a 40 caratteri
  da validare quando dispatchato da `main`; da un branch di release, usa un
  tag di release esistente oppure l'attuale SHA di commit completo a 40 caratteri del branch di release

Regole:

- I tag stable e correttivi possono pubblicare sia su `beta` sia su `latest`
- I tag di prerelease beta possono pubblicare solo su `beta`
- Per `OpenClaw NPM Release`, l'input full commit SHA è consentito solo quando
  `preflight_only=true`
- `OpenClaw Release Checks` è sempre solo di validazione e accetta anch'esso lo
  SHA di commit corrente del branch del workflow
- La modalità commit-SHA dei controlli di rilascio richiede anche l'attuale HEAD del branch del workflow
- Il vero percorso di pubblicazione deve usare lo stesso `npm_dist_tag` usato durante il preflight;
  il workflow verifica quei metadati prima di continuare la pubblicazione

## Sequenza di rilascio npm stable

Quando si crea una release npm stable:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare l'attuale SHA di commit completo del branch del workflow
     per una dry run di sola validazione del workflow di preflight
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stable diretta
3. Esegui `OpenClaw Release Checks` separatamente con lo stesso tag oppure con lo
   SHA completo corrente del branch del workflow quando vuoi copertura live della prompt cache
   - Questo è separato apposta così la copertura live resta disponibile senza
     riaccoppiare controlli lunghi o instabili al workflow di pubblicazione
4. Salva il `preflight_run_id` riuscito
5. Esegui di nuovo `OpenClaw NPM Release` con `preflight_only=false`, lo stesso
   `tag`, lo stesso `npm_dist_tag` e il `preflight_run_id` salvato
6. Se la release è arrivata su `beta`, usa il workflow privato
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   per promuovere quella versione stable da `beta` a `latest`
7. Se la release è stata intenzionalmente pubblicata direttamente su `latest` e `beta`
   deve seguire immediatamente la stessa build stable, usa quello stesso workflow privato
   per puntare entrambi i dist-tag alla versione stable, oppure lascia che la sua sincronizzazione
   self-healing pianificata sposti `beta` in seguito

La mutazione del dist-tag si trova nel repo privato per motivi di sicurezza perché richiede ancora
`NPM_TOKEN`, mentre il repo pubblico mantiene una pubblicazione solo OIDC.

Questo mantiene documentati e visibili agli operatori sia il percorso di pubblicazione diretta sia il
percorso di promozione beta-first.

## Riferimenti pubblici

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

I maintainer usano la documentazione di rilascio privata in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
come runbook effettivo.
