---
read_when:
    - Szukasz definicji publicznych kanałów wydań
    - Szukasz nazewnictwa wersji i cyklu wydań
summary: Publiczne kanały wydań, nazewnictwo wersji i cykl wydań
title: Zasady wydań
x-i18n:
    generated_at: "2026-04-05T14:04:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb52a13264c802395aa55404c6baeec5c7b2a6820562e7a684057e70cc85668f
    source_path: reference/RELEASING.md
    workflow: 15
---

# Zasady wydań

OpenClaw ma trzy publiczne ścieżki wydań:

- stable: oznaczone tagami wydania, które domyślnie publikują do npm `beta`, albo do npm `latest`, jeśli zostanie to wyraźnie zażądane
- beta: tagi wydań przedpremierowych, które publikują do npm `beta`
- dev: bieżący stan gałęzi `main`

## Nazewnictwo wersji

- Wersja wydania stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja poprawkowego wydania stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja wydania przedpremierowego beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie dopełniaj miesiąca ani dnia zerami
- `latest` oznacza bieżące promowane stabilne wydanie npm
- `beta` oznacza bieżący docelowy kanał instalacji beta
- Wydania stable i poprawkowe stable domyślnie publikują do npm `beta`; operatorzy wydań mogą jawnie wybrać `latest` albo później promować zweryfikowane wydanie beta
- Każde wydanie OpenClaw obejmuje jednocześnie pakiet npm i aplikację macOS

## Cykl wydań

- Wydania najpierw trafiają do beta
- Stable pojawia się dopiero po zweryfikowaniu najnowszej bety
- Szczegółowa procedura wydania, zatwierdzenia, poświadczenia i notatki dotyczące odzyskiwania są
  dostępne wyłącznie dla maintainerów

## Kontrola przed wydaniem

- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane
  artefakty wydania `dist/*` i bundle Control UI istniały dla kroku walidacji
  pakietu
- Uruchom `pnpm release:check` przed każdym oznaczonym tagiem wydaniem
- Kontrola przed wydaniem npm dla gałęzi main uruchamia także
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  przed spakowaniem tarballa, używając sekretów workflow
  `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (lub odpowiadający tag beta/poprawkowy) przed zatwierdzeniem
- Po publikacji do npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (lub odpowiadającą wersję beta/poprawkową), aby zweryfikować opublikowaną ścieżkę
  instalacji z rejestru w nowym tymczasowym prefiksie
- Automatyzacja wydań maintainerów używa teraz modelu kontrola-przed-wydaniem-a-potem-promocja:
  - rzeczywista publikacja do npm musi przejść pomyślny `preflight_run_id` npm
  - stabilne wydania npm domyślnie trafiają do `beta`
  - stabilna publikacja npm może jawnie kierować do `latest` przez parametr workflow
  - promocja stabilnego wydania npm z `beta` do `latest` nadal jest dostępna jako jawny tryb ręczny w zaufanym workflow `OpenClaw NPM Release`
  - ten tryb promocji nadal wymaga prawidłowego `NPM_TOKEN` w środowisku `npm-release`, ponieważ zarządzanie `dist-tag` w npm jest oddzielone od zaufanej publikacji
  - publiczne `macOS Release` służy tylko do walidacji
  - rzeczywista prywatna publikacja mac musi przejść pomyślne prywatne identyfikatory
    `preflight_run_id` i `validate_run_id`
  - rzeczywiste ścieżki publikacji promują przygotowane artefakty zamiast budować
    je ponownie
- W przypadku stabilnych wydań poprawkowych, takich jak `YYYY.M.D-N`, weryfikator po publikacji
  sprawdza także tę samą ścieżkę aktualizacji w tymczasowym prefiksie z `YYYY.M.D` do `YYYY.M.D-N`,
  aby poprawki wydań nie mogły po cichu pozostawić starszych globalnych instalacji na
  bazowym stabilnym ładunku
- Kontrola przed wydaniem npm kończy się niepowodzeniem w sposób bezpieczny, jeśli tarball nie zawiera zarówno
  `dist/control-ui/index.html`, jak i niepustego ładunku `dist/control-ui/assets/`,
  abyśmy nie wysłali ponownie pustego panelu przeglądarkowego
- Jeśli prace nad wydaniem dotyczyły planowania CI, manifestów czasu rozszerzeń lub szybkich
  macierzy testowych, zregeneruj i przejrzyj zarządzane przez planner wyjścia macierzy workflow
  `checks-fast-extensions` z `.github/workflows/ci.yml`
  przed zatwierdzeniem, aby notatki do wydania nie opisywały nieaktualnego układu CI
- Gotowość stabilnego wydania macOS obejmuje także powierzchnie aktualizatora:
  - wydanie GitHub musi ostatecznie zawierać spakowane pliki `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` w `main` musi po publikacji wskazywać nowy stabilny plik zip
  - spakowana aplikacja musi zachować identyfikator bundle inny niż debug, niepusty URL feedu Sparkle
    oraz `CFBundleVersion` na poziomie co najmniej kanonicznego minimalnego progu builda Sparkle
    dla tej wersji wydania

## Parametry wejściowe workflow npm

`OpenClaw NPM Release` akceptuje następujące parametry wejściowe sterowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` lub
  `v2026.4.2-beta.1`
- `preflight_only`: `true` tylko dla walidacji/budowania/pakowania, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagane dla rzeczywistej ścieżki publikacji, aby workflow ponownie użył
  przygotowanego tarballa z pomyślnego uruchomienia kontroli przed wydaniem
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; domyślnie `beta`
- `promote_beta_to_latest`: `true`, aby pominąć publikację i przenieść już opublikowane
  stabilne wydanie `beta` na `latest`

Zasady:

- Tagi stable i poprawkowe mogą publikować do `beta` albo `latest`
- Tagi wydań przedpremierowych beta mogą publikować wyłącznie do `beta`
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, który był użyty podczas kontroli przed wydaniem;
  workflow weryfikuje te metadane, zanim publikacja będzie kontynuowana
- Tryb promocji musi używać tagu stable lub poprawkowego, `preflight_only=false`,
  pustego `preflight_run_id` oraz `npm_dist_tag=beta`
- Tryb promocji wymaga także prawidłowego `NPM_TOKEN` w środowisku `npm-release`,
  ponieważ `npm dist-tag add` nadal wymaga zwykłego uwierzytelniania npm

## Sekwencja stabilnego wydania npm

Podczas tworzenia stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
2. Wybierz `npm_dist_tag=beta` dla zwykłego przepływu beta-first albo `latest` tylko wtedy,
   gdy celowo chcesz bezpośredniej stabilnej publikacji
3. Zapisz pomyślny `preflight_run_id`
4. Uruchom `OpenClaw NPM Release` ponownie z `preflight_only=false`, tym samym
   `tag`, tym samym `npm_dist_tag` i zapisanym `preflight_run_id`
5. Jeśli wydanie trafiło do `beta`, uruchom później `OpenClaw NPM Release` z tym
   samym stabilnym `tag`, `promote_beta_to_latest=true`, `preflight_only=false`,
   pustym `preflight_run_id` i `npm_dist_tag=beta`, gdy chcesz przenieść to
   opublikowane wydanie do `latest`

Tryb promocji nadal wymaga zatwierdzenia środowiska `npm-release` oraz
prawidłowego `NPM_TOKEN` w tym środowisku.

Dzięki temu zarówno ścieżka publikacji bezpośredniej, jak i ścieżka promocji beta-first
pozostają udokumentowane i widoczne dla operatora.

## Publiczne odwołania

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainerzy używają prywatnej dokumentacji wydań w
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
jako właściwego runbooka.
