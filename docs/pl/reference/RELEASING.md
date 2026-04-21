---
read_when:
    - Szukasz definicji publicznych kanałów wydań
    - Szukasz nazewnictwa wersji i harmonogramu wydań
summary: Publiczne kanały wydań, nazewnictwo wersji i harmonogram wydawniczy
title: Polityka wydań
x-i18n:
    generated_at: "2026-04-21T10:00:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 356844708f6ecdae4acfcce853ce16ae962914a9fdd1cfc38a22ac4c439ba172
    source_path: reference/RELEASING.md
    workflow: 15
---

# Polityka wydań

OpenClaw ma trzy publiczne ścieżki wydań:

- stable: tagowane wydania publikowane domyślnie do npm `beta`, albo do npm `latest`, gdy zostanie to jawnie zażądane
- beta: tagi prerelease publikowane do npm `beta`
- dev: ruchoma głowa `main`

## Nazewnictwo wersji

- Wersja wydania stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja poprawkowego wydania stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie dopełniaj miesiąca ani dnia zerami
- `latest` oznacza bieżące promowane wydanie stable w npm
- `beta` oznacza bieżący cel instalacji beta
- Wydania stable i poprawkowe stable są domyślnie publikowane do npm `beta`; operatorzy wydań mogą jawnie kierować do `latest` albo później promować zweryfikowany build beta
- Każde wydanie stable OpenClaw dostarcza razem pakiet npm i aplikację macOS;
  wydania beta zwykle najpierw walidują i publikują ścieżkę npm/package, a
  budowanie/podpisywanie/notaryzacja aplikacji macOS są zarezerwowane dla stable, chyba że jawnie zażądano inaczej

## Harmonogram wydań

- Wydania przechodzą najpierw przez beta
- Stable następuje dopiero po zwalidowaniu najnowszej beta
- Maintainerzy zwykle wycinają wydania z gałęzi `release/YYYY.M.D` utworzonej
  z bieżącego `main`, aby walidacja wydań i poprawki nie blokowały nowego
  rozwoju na `main`
- Jeśli tag beta został już wypchnięty lub opublikowany i wymaga poprawki, maintainerzy tworzą
  kolejny tag `-beta.N` zamiast usuwać lub odtwarzać stary tag beta
- Szczegółowa procedura wydania, zgody, poświadczenia i uwagi dotyczące odzyskiwania są
  przeznaczone tylko dla maintainerów

## Preflight wydania

- Uruchom `pnpm check:test-types` przed preflightem wydania, aby testowy TypeScript nadal
  był objęty kontrolą poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed preflightem wydania, aby szersze kontrole
  cykli importów i granic architektury były zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane
  artefakty wydania `dist/*` i bundel Control UI istniały na potrzeby kroku
  walidacji pack
- Uruchom `pnpm release:check` przed każdym tagowanym wydaniem
- Kontrole wydania są teraz uruchamiane w oddzielnym ręcznym workflow:
  `OpenClaw Release Checks`
- Międzyplatformowa walidacja środowiska instalacji i aktualizacji jest uruchamiana z
  prywatnego workflow wywołującego
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  który wywołuje publiczny workflow wielokrotnego użytku
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Ten podział jest celowy: utrzymuj rzeczywistą ścieżkę wydania npm krótką,
  deterministyczną i skupioną na artefaktach, podczas gdy wolniejsze testy na żywo pozostają
  na własnej ścieżce, aby nie opóźniały ani nie blokowały publikacji
- Kontrole wydania muszą być uruchamiane z referencji workflow `main` albo z
  referencji workflow `release/YYYY.M.D`, aby logika workflow i sekrety pozostawały
  pod kontrolą
- Ten workflow akceptuje albo istniejący tag wydania, albo bieżący pełny
  40-znakowy SHA commita gałęzi workflow
- W trybie SHA commita akceptuje tylko bieżący HEAD gałęzi workflow; dla
  starszych commitów wydania użyj tagu wydania
- Preflight tylko do walidacji `OpenClaw NPM Release` także akceptuje bieżący
  pełny 40-znakowy SHA commita gałęzi workflow bez wymagania wypchniętego tagu
- Ta ścieżka SHA służy tylko do walidacji i nie może zostać promowana do realnej publikacji
- W trybie SHA workflow syntetyzuje `v<package.json version>` tylko na potrzeby
  sprawdzenia metadanych pakietu; prawdziwa publikacja nadal wymaga prawdziwego tagu wydania
- Oba workflow utrzymują rzeczywistą ścieżkę publikacji i promocji na runnerach hostowanych przez GitHub, podczas gdy niemutująca ścieżka walidacji może używać większych
  runnerów Linux Blacksmith
- Ten workflow uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  z użyciem sekretów workflow `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Preflight wydania npm nie czeka już na oddzielną ścieżkę kontroli wydania
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (albo pasujący tag beta/poprawkowy) przed zatwierdzeniem
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (albo pasującą wersję beta/poprawkową), aby zweryfikować opublikowaną ścieżkę
  instalacji z rejestru w świeżym tymczasowym prefiksie
- Automatyzacja wydań maintainerów używa teraz modelu preflight-then-promote:
  - prawdziwa publikacja npm musi przejść pomyślny `preflight_run_id` npm
  - prawdziwa publikacja npm musi zostać uruchomiona z tej samej gałęzi `main` albo
    `release/YYYY.M.D`, co udany preflight run
  - wydania stable npm domyślnie kierują do `beta`
  - publikacja stable npm może jawnie kierować do `latest` przez input workflow
  - mutacja npm dist-tag oparta na tokenie znajduje się teraz w
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal wymaga `NPM_TOKEN`, podczas gdy
    publiczne repo utrzymuje publikację tylko z OIDC
  - publiczne `macOS Release` służy tylko do walidacji
  - prawdziwa prywatna publikacja mac musi przejść pomyślne prywatne identyfikatory
    `preflight_run_id` i `validate_run_id`
  - ścieżki prawdziwej publikacji promują przygotowane artefakty zamiast budować
    je ponownie
- Dla poprawkowych wydań stable, takich jak `YYYY.M.D-N`, weryfikator po publikacji
  sprawdza także tę samą ścieżkę aktualizacji z `YYYY.M.D` do `YYYY.M.D-N` w tymczasowym prefiksie,
  aby poprawki wydania nie mogły po cichu pozostawić starszych globalnych instalacji na
  bazowym ładunku stable
- Preflight wydania npm kończy się bezpieczną odmową, jeśli tarball nie zawiera zarówno
  `dist/control-ui/index.html`, jak i niepustego ładunku `dist/control-ui/assets/`,
  abyśmy nie wysłali znowu pustego panelu przeglądarkowego
- `pnpm test:install:smoke` wymusza też budżet `unpackedSize` npm pack na
  kandydującym tarballu aktualizacji, aby instalator e2e wychwytywał przypadkowe
  zwiększenie rozmiaru pack przed ścieżką publikacji wydania
- Jeśli prace nad wydaniem dotyczyły planowania CI, manifestów czasów rozszerzeń albo
  macierzy testów rozszerzeń, przed zatwierdzeniem wygeneruj ponownie i przejrzyj
  wyjścia macierzy workflow `checks-node-extensions` należące do planera z `.github/workflows/ci.yml`,
  aby informacje o wydaniu nie opisywały nieaktualnego układu CI
- Gotowość wydania stable macOS obejmuje też powierzchnie aktualizatora:
  - wydanie GitHub musi ostatecznie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi po publikacji wskazywać nowy stabilny zip
  - spakowana aplikacja musi zachować nie-debugowe bundle id, niepusty URL feedu Sparkle
    i `CFBundleVersion` na poziomie co najmniej kanonicznego progu buildów Sparkle
    dla tej wersji wydania

## Inputy workflow NPM

`OpenClaw NPM Release` akceptuje te inputy kontrolowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` albo
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być także bieżący
  pełny 40-znakowy SHA commita gałęzi workflow dla preflightu tylko do walidacji
- `preflight_only`: `true` tylko dla walidacji/build/package, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagane w rzeczywistej ścieżce publikacji, aby workflow ponownie użył
  przygotowanego tarballa z udanego preflightu
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; domyślnie `beta`

`OpenClaw Release Checks` akceptuje te inputy kontrolowane przez operatora:

- `ref`: istniejący tag wydania albo bieżący pełny 40-znakowy SHA commita `main`
  do walidacji przy uruchomieniu z `main`; z gałęzi wydania użyj
  istniejącego tagu wydania albo bieżącego pełnego 40-znakowego SHA commita gałęzi wydania

Zasady:

- Tagi stable i poprawkowe mogą publikować albo do `beta`, albo do `latest`
- Tagi prerelease beta mogą publikować tylko do `beta`
- Dla `OpenClaw NPM Release` pełny input SHA commita jest dozwolony tylko wtedy, gdy
  `preflight_only=true`
- `OpenClaw Release Checks` zawsze służy tylko do walidacji i także akceptuje
  bieżący SHA commita gałęzi workflow
- Tryb SHA commita dla kontroli wydania wymaga też bieżącego HEAD gałęzi workflow
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, który był użyty podczas preflightu;
  workflow weryfikuje te metadane przed kontynuacją publikacji

## Sekwencja wydania stable npm

Przy wycinaniu wydania stable npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim tag zacznie istnieć, możesz użyć bieżącego pełnego SHA commita gałęzi workflow
     do walidacyjnego dry run workflow preflight
2. Wybierz `npm_dist_tag=beta` dla zwykłego przepływu beta-first albo `latest` tylko
   wtedy, gdy celowo chcesz bezpośredniej publikacji stable
3. Uruchom osobno `OpenClaw Release Checks` z tym samym tagiem albo
   pełnym bieżącym SHA commita gałęzi workflow, gdy chcesz pokrycia na żywo dla prompt cache
   - To jest rozdzielone celowo, aby pokrycie na żywo pozostawało dostępne bez
     ponownego sprzęgania długo działających lub niestabilnych testów z workflow publikacji
4. Zachowaj udany `preflight_run_id`
5. Uruchom ponownie `OpenClaw NPM Release` z `preflight_only=false`, tym samym
   `tag`, tym samym `npm_dist_tag` i zapisanym `preflight_run_id`
6. Jeśli wydanie trafiło do `beta`, użyj prywatnego workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby promować tę wersję stable z `beta` do `latest`
7. Jeśli wydanie zostało celowo opublikowane bezpośrednio do `latest`, a `beta`
   powinno od razu wskazywać ten sam build stable, użyj tego samego prywatnego
   workflow, aby skierować oba dist-tagi na wersję stable, albo pozwól, aby jego zaplanowana
   samonaprawiająca synchronizacja przesunęła `beta` później

Mutacja dist-tag znajduje się w prywatnym repo ze względów bezpieczeństwa, ponieważ nadal
wymaga `NPM_TOKEN`, podczas gdy publiczne repo utrzymuje publikację tylko z OIDC.

Dzięki temu zarówno ścieżka bezpośredniej publikacji, jak i ścieżka promocji beta-first pozostają
udokumentowane i widoczne dla operatora.

## Publiczne odwołania

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainerzy używają prywatnej dokumentacji wydań w
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
jako właściwego runbooka.
