---
read_when:
    - Chcesz przełączać się między kanałami stable/extended-stable/beta/dev
    - Chcesz przypiąć konkretną wersję, tag lub SHA
    - Oznaczasz tagami lub publikujesz wersje wstępne
sidebarTitle: Release Channels
summary: 'Kanały stable, extended-stable, beta i dev: znaczenie, przełączanie, przypinanie i tagowanie'
title: Kanały wydań
x-i18n:
    generated_at: "2026-07-12T15:14:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a99e31f5121c0ab8696e638cb10a7ce16e8f32c81e4b2bef1f703eef71191494
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw udostępnia cztery kanały aktualizacji:

- **stable**: dist-tag npm `latest`. Zalecany dla większości użytkowników.
- **extended-stable**: dist-tag npm `extended-stable`. Nowy kanał pakietów dla
  poprzedniego nadal wspieranego miesiąca. Jest dostępny wyłącznie jako pakiet,
  a instalacja odbywa się tylko na pierwszym planie. Zapisany wybór otrzymuje
  wskazówki o aktualizacjach tylko do odczytu, gdy włączono
  `update.checkOnStart`, ale nigdy nie stosuje ich automatycznie.
- **beta**: dist-tag npm `beta`. Powraca do `latest`, gdy `beta` nie istnieje
  lub jest starsza od bieżącego wydania stabilnego.
- **dev**: ruchoma najnowsza wersja gałęzi `main` (git). Dist-tag npm `dev`, gdy
  zostanie opublikowany. `main` służy do eksperymentów i aktywnego rozwoju;
  może zawierać nieukończone funkcje lub zmiany niezgodne wstecz. Nie używaj
  jej w produkcyjnych instancjach Gateway.

Wersje stabilne są zwykle najpierw publikowane w kanale **beta**, tam
weryfikowane, a następnie promowane do **latest** bez zwiększania numeru wersji.
Opiekunowie mogą również publikować bezpośrednio do `latest`. Dist-tagi są
źródłem prawdy dla instalacji npm.

## Przełączanie kanałów

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

Opcja `--channel` zapisuje wybór w `update.channel` w konfiguracji i steruje
obiema ścieżkami instalacji:

| Kanał             | Instalacje npm/pakietowe                                                                                                                                                                                                  | Instalacje git                                                                                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | dist-tag `latest`                                                                                                                                                                                                         | najnowszy stabilny tag git (z wyłączeniem `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`, `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` i innych nazwanych sufiksów wersji przedpremierowych)                       |
| `extended-stable` | rozpoznaje publiczny selektor npm `extended-stable`, weryfikuje dokładnie wybrany pakiet i instaluje tę konkretną wersję. W razie niepowodzenia przerywa działanie bez powrotu do `latest`, `beta` ani `dev`.                 | nieobsługiwane: OpenClaw pozostawia kopię roboczą bez zmian i prosi o użycie instalacji pakietowej                                                                                                                 |
| `beta`            | dist-tag `beta`, z powrotem do `latest`, gdy `beta` nie istnieje lub jest starsza                                                                                                                                          | najnowszy tag git wersji beta, z powrotem do najnowszego stabilnego tagu git, gdy wersja beta nie istnieje lub jest starsza                                                                                        |
| `dev`             | dist-tag `dev` (rzadko używany; większość użytkowników wersji deweloperskiej korzysta z instalacji git)                                                                                                                    | pobiera zmiany, wykonuje rebase kopii roboczej na nadrzędnej gałęzi `main`, kompiluje i ponownie instaluje globalny CLI                                                                                           |

W przypadku instalacji git kanału `dev` domyślna kopia robocza znajduje się w
`~/openclaw` (lub `$OPENCLAW_HOME/openclaw`, gdy ustawiono `OPENCLAW_HOME`);
można ją zastąpić za pomocą `OPENCLAW_GIT_DIR`.

<Tip>
Aby równolegle używać wersji stabilnej i deweloperskiej, zastosuj dwie oddzielne kopie robocze i skieruj każdą instancję Gateway do właściwej kopii.
</Tip>

## Jednorazowe wskazanie wersji lub tagu

Użyj `--tag`, aby dla pojedynczej aktualizacji wskazać konkretny dist-tag,
wersję lub specyfikację pakietu **bez** zmiany zapisanego kanału:

```bash
# Zainstaluj określoną wersję
openclaw update --tag 2026.4.1-beta.1

# Zainstaluj z dist-tagu beta (jednorazowo, bez zapisywania)
openclaw update --tag beta

# Przełącz na ruchomą kopię roboczą gałęzi main z GitHub (trwale)
openclaw update --channel dev

# Zainstaluj określoną specyfikację pakietu npm
openclaw update --tag openclaw@2026.4.1-beta.1

# Zainstaluj jednorazowo z gałęzi main na GitHub bez zapisywania kanału
openclaw update --tag main
```

Uwagi:

- `--tag` ma zastosowanie **wyłącznie do instalacji pakietowych (npm)**;
  instalacje git go ignorują.
- Tag nie jest zapisywany; następne polecenie `openclaw update` użyje
  skonfigurowanego kanału.
- `--tag main` jest dla tego jednego uruchomienia mapowany na zgodną z npm
  specyfikację `github:openclaw/openclaw#main`. Aby uzyskać trwałą, ruchomą
  instalację z gałęzi `main`, użyj `openclaw update --channel dev` (instalacje
  pakietowe przełączą się na kopię roboczą git) albo zainstaluj ponownie,
  korzystając z metody git instalatora:
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`.
  Ścieżka instalacji npm bezwarunkowo odrzuca źródła GitHub/git i zamiast tego
  wskazuje metodę git.
- Ochrona przed obniżeniem wersji: jeśli wersja docelowa jest starsza od
  bieżącej, OpenClaw prosi o potwierdzenie (można je pominąć za pomocą `--yes`).
- Kanał extended-stable zawsze używa zweryfikowanego, konkretnego pakietu
  docelowego. Nie jest jednorazowym aliasem dla `--tag extended-stable`, a
  opcji `--tag` nie można łączyć z faktycznie używanym kanałem extended-stable.
- `--channel beta` różni się od `--tag beta`: przepływ kanału może powrócić do
  stable/latest, gdy wersja beta nie istnieje lub jest starsza, natomiast
  `--tag beta` zawsze wskazuje surowy dist-tag `beta` dla tego jednego
  uruchomienia.

## Przebieg próbny

Wyświetl podgląd działań, które wykonałoby polecenie `openclaw update`, bez
wprowadzania zmian:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Przebieg próbny zgłasza faktycznie używany kanał, wersję docelową, planowane
działania oraz informację, czy wymagane byłoby potwierdzenie obniżenia wersji.

## Pluginy i kanały

Przełączanie kanałów za pomocą `openclaw update` synchronizuje również źródła
pluginów:

- `dev` przełącza zainstalowane pluginy, które mają wbudowane odpowiedniki,
  z powrotem na ich wbudowane źródła (z kopii roboczej git).
- `stable` i `beta` przywracają pakiety pluginów zainstalowane przez npm lub
  ClawHub.
- `extended-stable` rozpoznaje kwalifikujące się oficjalne pluginy npm z
  pustą/domyślną intencją lub intencją `latest` jako dokładnie zainstalowaną
  wersję rdzenia. W czasie działania nie odpytuje tagów pluginów
  `@extended-stable`.
- Pluginy zainstalowane przez npm są aktualizowane po zakończeniu aktualizacji
  rdzenia.

## Sprawdzanie bieżącego stanu

```bash
openclaw update status
```

Wyświetla aktywny kanał (wraz ze źródłem, które go określiło: konfiguracją,
tagiem git, gałęzią git, zainstalowaną wersją lub wartością domyślną), rodzaj
instalacji (git lub pakiet), bieżącą wersję i dostępność aktualizacji.

## Dobre praktyki dotyczące tagowania

- Oznaczaj tagami wydania, na których mają zatrzymywać się kopie robocze git:
  `vYYYY.M.PATCH` dla wersji stabilnej, `vYYYY.M.PATCH-beta.N` dla wersji beta.
  Nazwane sufiksy wersji przedpremierowych, takie jak `-alpha.N`, `-rc.N` i
  `-next.N`, nie są celami kanału stabilnego ani beta.
- Starsze numeryczne tagi stabilne, takie jak `vYYYY.M.PATCH-1` i `v1.0.1-1`,
  są nadal rozpoznawane jako stabilne tagi git w celu zachowania zgodności.
- Format `vYYYY.M.PATCH.beta.N` (z kropkami) jest również rozpoznawany w celu
  zachowania zgodności; preferuj `-beta.N`.
- Zachowuj niezmienność tagów: nigdy nie przenoś ani nie wykorzystuj ponownie
  tagu.
- Dist-tagi npm pozostają źródłem prawdy dla instalacji npm:
  - `latest` -> wersja stabilna
  - `extended-stable` -> wydanie pakietowe dla poprzedniego nadal wspieranego miesiąca
  - `beta` -> wersja kandydująca lub wersja stabilna publikowana najpierw jako beta
  - `dev` -> migawka gałęzi main (opcjonalna)

## Dostępność aplikacji dla systemu macOS

Wersje beta i deweloperskie mogą **nie** zawierać wydania aplikacji dla systemu
macOS. Jest to dopuszczalne:

- Tag git i dist-tag npm mogą nadal zostać opublikowane niezależnie.
- W informacjach o wydaniu lub dzienniku zmian zaznacz „brak wersji dla macOS w tej wersji beta”.

## Powiązane

- [Aktualizowanie](/pl/install/updating)
- [Mechanizmy wewnętrzne instalatora](/pl/install/installer)
