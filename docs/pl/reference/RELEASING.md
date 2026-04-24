---
read_when:
    - Szukasz definicji publicznych kanałów wydań
    - Szukasz nazewnictwa wersji i częstotliwości wydań
summary: Publiczne kanały wydań, nazewnictwo wersji i częstotliwość wydań
title: Polityka wydań
x-i18n:
    generated_at: "2026-04-24T09:30:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2cba6cd02c6fb2380abd8d46e10567af2f96c7c6e45236689d69289348b829ce
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw ma trzy publiczne ścieżki wydań:

- stable: tagowane wydania publikowane domyślnie do npm `beta`, albo do npm `latest`, gdy zostanie to jawnie wskazane
- beta: tagi prerelease publikowane do npm `beta`
- dev: ruchoma głowa `main`

## Nazewnictwo wersji

- Wersja wydania stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja poprawkowego wydania stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie dopełniaj zerami miesiąca ani dnia
- `latest` oznacza bieżące promowane stable wydanie npm
- `beta` oznacza bieżący docelowy kanał instalacji beta
- Wydania stable i poprawkowe stable są domyślnie publikowane do npm `beta`; operatorzy wydań mogą jawnie wskazać `latest` albo później promować sprawdzone wydanie beta
- Każde stable wydanie OpenClaw dostarcza jednocześnie pakiet npm i aplikację macOS;
  wydania beta zwykle najpierw walidują i publikują ścieżkę npm/package, a
  budowanie/podpisywanie/notaryzacja aplikacji mac jest zarezerwowane dla stable, chyba że zostanie to jawnie zażądane

## Częstotliwość wydań

- Wydania przechodzą najpierw przez beta
- Stable następuje dopiero po zweryfikowaniu najnowszej beta
- Maintainerzy zwykle wycinają wydania z gałęzi `release/YYYY.M.D` utworzonej
  z bieżącego `main`, aby walidacja i poprawki wydania nie blokowały nowego
  rozwoju na `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki, maintainerzy wycinają
  następny tag `-beta.N` zamiast usuwać lub odtwarzać stary tag beta
- Szczegółowa procedura wydania, zatwierdzenia, poświadczenia i uwagi dotyczące odzyskiwania
  są przeznaczone tylko dla maintainerów

## Preflight wydania

- Uruchom `pnpm check:test-types` przed preflightem wydania, aby testowy TypeScript nadal był
  objęty poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed preflightem wydania, aby szersze kontrole cykli importów
  i granic architektury były zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane
  artefakty wydania `dist/*` i bundle Control UI istniały dla kroku
  walidacji pack
- Uruchom `pnpm release:check` przed każdym tagowanym wydaniem
- Kontrole wydania są teraz uruchamiane w oddzielnym ręcznym workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia również bramkę zgodności QA Lab mock oraz live
  ścieżki QA dla Matrix i Telegram przed zatwierdzeniem wydania. Ścieżki live używają
  środowiska `qa-live-shared`; Telegram używa również dzierżaw poświadczeń Convex CI.
- Walidacja runtime instalacji i aktualizacji między systemami operacyjnymi jest wysyłana z
  prywatnego workflow wywołującego
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  który wywołuje współużywalny publiczny workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Ten podział jest celowy: utrzymuje rzeczywistą ścieżkę wydania npm krótką,
  deterministyczną i skoncentrowaną na artefaktach, podczas gdy wolniejsze kontrole live pozostają na
  osobnej ścieżce, aby nie opóźniać ani nie blokować publikacji
- Kontrole wydania muszą być wysyłane z ref workflow `main` albo z
  ref workflow `release/YYYY.M.D`, aby logika workflow i sekrety pozostawały
  kontrolowane
- Ten workflow akceptuje istniejący tag wydania albo bieżący pełny 40-znakowy SHA commita gałęzi workflow
- W trybie SHA commita akceptuje tylko bieżący HEAD gałęzi workflow; dla
  starszych commitów wydania użyj tagu wydania
- Preflight tylko do walidacji `OpenClaw NPM Release` również akceptuje bieżący
  pełny 40-znakowy SHA commita gałęzi workflow bez wymagania wypchniętego tagu
- Ta ścieżka SHA służy wyłącznie do walidacji i nie może zostać promowana do rzeczywistej publikacji
- W trybie SHA workflow syntetyzuje `v<package.json version>` tylko na potrzeby kontroli metadanych pakietu; rzeczywista publikacja nadal wymaga prawdziwego tagu wydania
- Oba workflow utrzymują rzeczywistą ścieżkę publikacji i promocji na runnerach hostowanych przez GitHub, podczas gdy niemutująca ścieżka walidacji może używać większych
  runnerów Blacksmith Linux
- Ten workflow uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  przy użyciu sekretów workflow `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Preflight wydania npm nie czeka już na oddzielną ścieżkę kontroli wydania
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (albo odpowiadający tag beta/poprawki) przed zatwierdzeniem
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (albo odpowiadającą wersję beta/poprawki), aby zweryfikować ścieżkę instalacji z opublikowanego rejestru w świeżym tymczasowym prefiksie
- Po publikacji beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aby zweryfikować onboarding zainstalowanego pakietu, konfigurację Telegram i rzeczywiste Telegram E2E
  względem opublikowanego pakietu npm przy użyciu współdzielonej puli dzierżawionych poświadczeń Telegram.
  Lokalne jednorazowe uruchomienia maintainera mogą pominąć zmienne Convex i przekazać bezpośrednio trzy
  poświadczenia środowiskowe `OPENCLAW_QA_TELEGRAM_*`.
- Maintainerzy mogą uruchomić tę samą kontrolę po publikacji z GitHub Actions przez
  ręczny workflow `NPM Telegram Beta E2E`. Jest on celowo tylko ręczny i
  nie uruchamia się przy każdym merge.
- Automatyzacja wydań maintainerów używa teraz preflight-then-promote:
  - rzeczywista publikacja npm musi przejść pomyślny npm `preflight_run_id`
  - rzeczywista publikacja npm musi zostać wysłana z tej samej gałęzi `main` lub
    `release/YYYY.M.D`, co pomyślny przebieg preflight
  - stable wydania npm domyślnie trafiają do `beta`
  - stable publikacja npm może jawnie wskazać `latest` przez input workflow
  - mutacja token-based npm dist-tag znajduje się teraz w
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal wymaga `NPM_TOKEN`, podczas gdy
    publiczne repo zachowuje publikację wyłącznie przez OIDC
  - publiczne `macOS Release` służy wyłącznie do walidacji
  - rzeczywista prywatna publikacja mac musi przejść pomyślne prywatne
    `preflight_run_id` i `validate_run_id`
  - rzeczywiste ścieżki publikacji promują przygotowane artefakty zamiast budować
    je ponownie
- Dla poprawkowych wydań stable takich jak `YYYY.M.D-N` weryfikator po publikacji
  sprawdza również tę samą ścieżkę aktualizacji w tymczasowym prefiksie z `YYYY.M.D` do `YYYY.M.D-N`,
  aby poprawki wydania nie mogły po cichu pozostawić starszych globalnych instalacji na
  bazowym stable payloadzie
- Preflight wydania npm kończy się bezpieczną odmową, jeśli tarball nie zawiera zarówno
  `dist/control-ui/index.html`, jak i niepustego payloadu `dist/control-ui/assets/`,
  abyśmy znowu nie wysłali pustego panelu przeglądarkowego
- Weryfikacja po publikacji sprawdza również, czy instalacja z opublikowanego rejestru
  zawiera niepuste zależności runtime dołączonych pluginów w układzie głównym `dist/*`.
  Wydanie, które zostanie dostarczone z brakującym lub pustym payloadem zależności
  dołączonych pluginów, nie przechodzi weryfikatora postpublish i nie może zostać promowane
  do `latest`.
- `pnpm test:install:smoke` egzekwuje również budżet `unpackedSize` dla `npm pack` na
  kandydackim tarballu aktualizacji, aby installer e2e wychwycił przypadkowy wzrost rozmiaru paczki
  przed ścieżką publikacji wydania
- Jeśli prace nad wydaniem dotknęły planowania CI, manifestów czasowych rozszerzeń lub
  macierzy testów rozszerzeń, zregeneruj i sprawdź wyjścia macierzy workflow
  `checks-node-extensions` zarządzane przez planner z `.github/workflows/ci.yml`
  przed zatwierdzeniem, aby notatki wydania nie opisywały nieaktualnego układu CI
- Gotowość stable wydania macOS obejmuje również powierzchnie aktualizatora:
  - wydanie GitHub musi ostatecznie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi po publikacji wskazywać nowy stable zip
  - spakowana aplikacja musi zachować niedebugowy bundle id, niepusty URL feedu Sparkle
    oraz `CFBundleVersion` na poziomie co najmniej kanonicznego progu buildu Sparkle
    dla tej wersji wydania

## Inputy workflow NPM

`OpenClaw NPM Release` akceptuje następujące inputy sterowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` albo
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być również bieżący
  pełny 40-znakowy SHA commita gałęzi workflow dla preflightu tylko do walidacji
- `preflight_only`: `true` dla samej walidacji/buildu/pakowania, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagane w rzeczywistej ścieżce publikacji, aby workflow ponownie użył
  przygotowanego tarballa z pomyślnego przebiegu preflight
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; domyślnie `beta`

`OpenClaw Release Checks` akceptuje następujące inputy sterowane przez operatora:

- `ref`: istniejący tag wydania albo bieżący pełny 40-znakowy SHA commita `main`
  do zweryfikowania przy wysłaniu z `main`; z gałęzi wydania użyj
  istniejącego tagu wydania albo bieżącego pełnego 40-znakowego SHA commita gałęzi wydania

Zasady:

- Tagi stable i poprawek mogą publikować do `beta` albo `latest`
- Tagi prerelease beta mogą publikować tylko do `beta`
- Dla `OpenClaw NPM Release` pełny input SHA commita jest dozwolony tylko wtedy, gdy
  `preflight_only=true`
- `OpenClaw Release Checks` zawsze służy tylko do walidacji i również akceptuje
  bieżący SHA commita gałęzi workflow
- Tryb SHA commita dla kontroli wydania wymaga również bieżącego HEAD gałęzi workflow
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, które zostało użyte podczas preflightu;
  workflow weryfikuje te metadane przed kontynuacją publikacji

## Sekwencja stable wydania npm

Podczas przygotowywania stable wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim tag będzie istniał, możesz użyć bieżącego pełnego SHA commita gałęzi workflow
     do walidacyjnego dry run workflow preflight
2. Wybierz `npm_dist_tag=beta` dla zwykłego przepływu beta-first albo `latest` tylko
   wtedy, gdy świadomie chcesz bezpośredniej stable publikacji
3. Uruchom oddzielnie `OpenClaw Release Checks` z tym samym tagiem albo
   pełnym bieżącym SHA commita gałęzi workflow, gdy chcesz mieć pokrycie live prompt cache,
   zgodność QA Lab, Matrix i Telegram
   - To jest celowo oddzielone, aby pokrycie live pozostawało dostępne bez
     ponownego sprzęgania długotrwałych albo niestabilnych kontroli z workflow publikacji
4. Zapisz pomyślny `preflight_run_id`
5. Uruchom ponownie `OpenClaw NPM Release` z `preflight_only=false`, tym samym
   `tag`, tym samym `npm_dist_tag` oraz zapisanym `preflight_run_id`
6. Jeśli wydanie trafiło do `beta`, użyj prywatnego workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby promować tę stable wersję z `beta` do `latest`
7. Jeśli wydanie zostało celowo opublikowane bezpośrednio do `latest`, a `beta`
   ma od razu wskazywać ten sam stable build, użyj tego samego prywatnego
   workflow, aby skierować oba dist-tagi na stable wersję, albo pozwól, aby jego zaplanowana
   synchronizacja self-healing przesunęła `beta` później

Mutacja dist-tag znajduje się w prywatnym repo ze względów bezpieczeństwa, ponieważ nadal
wymaga `NPM_TOKEN`, podczas gdy publiczne repo zachowuje publikację tylko przez OIDC.

Dzięki temu zarówno ścieżka bezpośredniej publikacji, jak i ścieżka promocji beta-first są
udokumentowane i widoczne dla operatora.

## Publiczne odniesienia

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainerzy używają prywatnej dokumentacji wydań w
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
jako właściwego runbooka.

## Powiązane

- [Kanały wydań](/pl/install/development-channels)
