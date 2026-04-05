---
read_when:
    - Cerchi le definizioni pubbliche dei canali di rilascio
    - Cerchi la nomenclatura delle versioni e la cadenza
summary: Canali di rilascio pubblici, nomenclatura delle versioni e cadenza
title: Policy di rilascio
x-i18n:
    generated_at: "2026-04-05T14:02:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb52a13264c802395aa55404c6baeec5c7b2a6820562e7a684057e70cc85668f
    source_path: reference/RELEASING.md
    workflow: 15
---

# Policy di rilascio

OpenClaw ha tre canali di rilascio pubblici:

- stable: release taggate che pubblicano su npm `beta` per impostazione predefinita, oppure su npm `latest` quando richiesto esplicitamente
- beta: tag di prerelease che pubblicano su npm `beta`
- dev: la head mobile di `main`

## Nomenclatura delle versioni

- Versione release stable: `YYYY.M.D`
  - Tag git: `vYYYY.M.D`
- Versione release stable di correzione: `YYYY.M.D-N`
  - Tag git: `vYYYY.M.D-N`
- Versione prerelease beta: `YYYY.M.D-beta.N`
  - Tag git: `vYYYY.M.D-beta.N`
- Non aggiungere zeri iniziali a mese o giorno
- `latest` indica l'attuale release stable npm promossa
- `beta` indica l'attuale target di installazione beta
- Le release stable e le release stable di correzione pubblicano su npm `beta` per impostazione predefinita; gli operatori di rilascio possono puntare esplicitamente a `latest`, oppure promuovere in seguito una build beta verificata
- Ogni release OpenClaw distribuisce insieme il pacchetto npm e l'app macOS

## Cadenza di rilascio

- Le release passano prima da beta
- stable segue solo dopo che l'ultima beta è stata convalidata
- La procedura dettagliata di rilascio, le approvazioni, le credenziali e le note di recupero sono
  riservate ai maintainer

## Preflight del rilascio

- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check` così gli artefatti di release attesi `dist/*` e il bundle della Control UI esistano per il passaggio di validazione del pack
- Esegui `pnpm release:check` prima di ogni release taggata
- Il preflight npm del branch main esegue anche
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  prima di creare il tarball, usando entrambi i secret di workflow
  `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o il tag beta/correzione corrispondente) prima dell'approvazione
- Dopo la pubblicazione su npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versione beta/correzione corrispondente) per verificare il percorso di installazione dal registro pubblicato in un nuovo prefisso temporaneo
- L'automazione di rilascio dei maintainer ora usa preflight-then-promote:
  - la vera pubblicazione npm deve superare un `preflight_run_id` npm riuscito
  - le release npm stable hanno come predefinito `beta`
  - la pubblicazione npm stable può puntare esplicitamente a `latest` tramite input del workflow
  - la promozione npm stable da `beta` a `latest` è ancora disponibile come modalità manuale esplicita nel workflow fidato `OpenClaw NPM Release`
  - quella modalità di promozione richiede comunque un `NPM_TOKEN` valido nell'ambiente `npm-release` perché la gestione di npm `dist-tag` è separata dal trusted publishing
  - la `macOS Release` pubblica è solo di validazione
  - la vera pubblicazione privata mac deve superare i `preflight_run_id` e `validate_run_id` privati mac riusciti
  - i veri percorsi di pubblicazione promuovono artefatti preparati invece di ricompilarli di nuovo
- Per release stable di correzione come `YYYY.M.D-N`, il verificatore post-publish
  controlla anche lo stesso percorso di aggiornamento con prefisso temporaneo da `YYYY.M.D` a `YYYY.M.D-N`
  così le correzioni di rilascio non possono lasciare silenziosamente installazioni globali più vecchie sul payload stable di base
- Il preflight della release npm fallisce in modo chiuso a meno che il tarball non includa sia
  `dist/control-ui/index.html` sia un payload `dist/control-ui/assets/` non vuoto
  così non distribuiamo di nuovo una dashboard browser vuota
- Se il lavoro di rilascio ha toccato la pianificazione CI, i manifest di timing delle estensioni o le matrici di test veloci,
  rigenera e rivedi gli output della matrice del workflow `checks-fast-extensions`
  gestiti dal planner da `.github/workflows/ci.yml`
  prima dell'approvazione così le note di rilascio non descrivano un layout CI obsoleto
- La prontezza della release macOS stable include anche le superfici dell'updater:
  - la release GitHub deve finire con `.zip`, `.dmg` e `.dSYM.zip` impacchettati
  - `appcast.xml` su `main` deve puntare al nuovo zip stable dopo la pubblicazione
  - l'app impacchettata deve mantenere un bundle id non-debug, un URL Sparkle feed non vuoto
    e un `CFBundleVersion` pari o superiore alla soglia canonica di build Sparkle
    per quella versione di rilascio

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio come `v2026.4.2`, `v2026.4.2-1`, o
  `v2026.4.2-beta.1`
- `preflight_only`: `true` per sola validazione/build/package, `false` per il
  vero percorso di pubblicazione
- `preflight_run_id`: obbligatorio nel vero percorso di pubblicazione così il workflow riusa
  il tarball preparato dall'esecuzione preflight riuscita
- `npm_dist_tag`: tag npm di destinazione per il percorso di pubblicazione; il valore predefinito è `beta`
- `promote_beta_to_latest`: `true` per saltare la pubblicazione e spostare una build stable
  `beta` già pubblicata su `latest`

Regole:

- I tag stable e di correzione possono pubblicare sia su `beta` sia su `latest`
- I tag prerelease beta possono pubblicare solo su `beta`
- Il vero percorso di pubblicazione deve usare lo stesso `npm_dist_tag` usato durante il preflight;
  il workflow verifica quei metadati prima di continuare con la pubblicazione
- La modalità promozione deve usare un tag stable o di correzione, `preflight_only=false`,
  un `preflight_run_id` vuoto, e `npm_dist_tag=beta`
- La modalità promozione richiede anche un `NPM_TOKEN` valido nell'ambiente `npm-release`
  perché `npm dist-tag add` richiede comunque la normale autenticazione npm

## Sequenza di rilascio npm stable

Quando tagli una release npm stable:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stable diretta
3. Salva il `preflight_run_id` riuscito
4. Esegui di nuovo `OpenClaw NPM Release` con `preflight_only=false`, lo stesso
   `tag`, lo stesso `npm_dist_tag` e il `preflight_run_id` salvato
5. Se la release è arrivata su `beta`, esegui `OpenClaw NPM Release` più tardi con lo
   stesso `tag` stable, `promote_beta_to_latest=true`, `preflight_only=false`,
   `preflight_run_id` vuoto e `npm_dist_tag=beta` quando vuoi spostare quella
   build pubblicata su `latest`

La modalità promozione richiede comunque l'approvazione dell'ambiente `npm-release` e un
`NPM_TOKEN` valido in quell'ambiente.

Questo mantiene sia il percorso di pubblicazione diretta sia il percorso di promozione beta-first
documentati e visibili all'operatore.

## Riferimenti pubblici

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

I maintainer usano la documentazione privata di rilascio in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
per il runbook effettivo.
