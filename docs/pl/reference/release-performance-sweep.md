---
read_when:
    - Sprawdzasz poprawki dotyczące wydajności i rozmiaru pakietu z maja 2026 roku
    - Potrzebujesz liczb stojących za wpisem na blogu o wydajności i zależnościach OpenClaw
    - Zmieniasz bramki wydania, package shrinkwrap lub granice zależności Plugin
summary: Wizualne podsumowanie i techniczne dowody dotyczące czyszczenia wydajności, rozmiaru pakietów, zależności i shrinkwrap z maja 2026 roku
title: Przegląd wydajności wydania
x-i18n:
    generated_at: "2026-06-27T18:18:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93438b8037a40ed9e5590854926badfe943d440e4c585e6290d29b54764e861b
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Ta strona przedstawia dowody stojące za majowym czyszczeniem wydajności,
rozmiaru pakietu, zależności i shrinkwrap OpenClaw z 2026 roku. Jest technicznym uzupełnieniem
publicznego wpisu na blogu.

Połączono tu dwa audyty:

- **Przegląd wydajności wydania:** wydania GitHub od `v2026.5.28` wstecz przez
  stabilne `v2026.4.23`, z użyciem workflow `OpenClaw Performance`,
  `profile=smoke`, ścieżka mock-provider. Większość wierszy tagów to jedna próbka;
  wiersze `v2026.5.27` i `v2026.5.28` używają najnowszych artefaktów repeat-3
  z gałęzi wydania.
- **Wcześniejszy kontekst kwietniowy:** opublikowane punkty bazowe mock-provider
  `clawgrit-reports` od `v2026.4.1` do `v2026.5.2`, użyte tylko po to, by nie traktować
  wadliwych wydań z końca kwietnia jako publicznego punktu odniesienia wydajności.
- **Przegląd śladu instalacji:** świeże instalacje `npm install --ignore-scripts`
  w pakietach tymczasowych, z `du -sk node_modules` do pomiaru rozmiaru oraz
  przejściem po `node_modules` do zliczenia instancji pakietów.
- **Przegląd rozmiaru pakietu npm:** `npm pack openclaw@<version> --dry-run --json`
  dla opublikowanych wydań, z zapisem rozmiaru skompresowanego archiwum tarball,
  rozmiaru po rozpakowaniu i liczby plików.

<Warning>
Główny przegląd wydajności używa jednej próbki smoke na tag, z wyjątkiem
wierszy `v2026.5.27` i `v2026.5.28`, które używają najnowszych artefaktów repeat-3
z gałęzi wydania. Wcześniejszy kontekst kwietniowy używa opublikowanych median repeat-3
z `clawgrit-reports`. Traktuj te liczby jako dowód trendu i sygnał do szukania
regresji, a nie jako statystyki bramki wydania.
</Warning>

## Migawka

Pokrycie wydajności: **77 żądanych wydań**, **74 punkty oparte na artefaktach**
i **3 niedostępne uruchomienia CI**. Najnowszy zmierzony punkt stabilny: `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Stable agent turn" icon="gauge">
    **5,1x szybsza zimna tura**

    - `v2026.4.14`: 9,8 s
    - `v2026.5.28`: 1,9 s

  </Card>
  <Card title="Published package" icon="package">
    **Tarball 17,9 MB**

    Najnowszy stabilny pakiet, mniej niż marcowy szczyt rozmiaru pakietu wynoszący 43,3 MB.

  </Card>
  <Card title="Latest stable install" icon="hard-drive">
    **Świeża instalacja 361,7 MiB**

    `v2026.5.28` znacząco ogranicza zagnieżdżone drzewo zależności OpenClaw, ale
    mniejsze zagnieżdżone drzewo 259,7 MiB nadal pozostaje w lokalnym audycie instalacji.

  </Card>
  <Card title="Dependency graph" icon="boxes">
    **300 zainstalowanych pakietów**

    Najnowsze stabilne wydanie, mierzone jako unikalne korzenie nazw pakietów i wersji
    w świeżej instalacji z wyłączonymi skryptami.

  </Card>
</CardGroup>

## Oś czasu śladu instalacji

<CardGroup cols={2}>
  <Card title="Monthly high" icon="triangle-alert">
    **645 zależności**

    `2026.2.26` było miesięcznym maksimum liczby zależności w tej próbce.

  </Card>
  <Card title="Shrinkwrap introduced" icon="lock">
    **Instalacja 1020,6 MB**

    `2026.5.22` dodało główny shrinkwrap i ujawniło problem z kształtem pakietu:
    911,8 MB trafiło do zagnieżdżonego `openclaw/node_modules`.

  </Card>
  <Card title="Latest stable" icon="tag">
    **Instalacja 361,7 MiB**

    `2026.5.28` zmniejsza rozmiar świeżej instalacji o 52,8% względem `2026.5.27`, ale nadal
    instaluje zagnieżdżone drzewo OpenClaw o rozmiarze 259,7 MiB.

  </Card>
  <Card title="Dependency graph" icon="scissors">
    **300 korzeni pakietów**

    `2026.5.28` instaluje o 71 mniej unikalnych korzeni nazw pakietów i wersji niż
    `2026.5.27`.

  </Card>
</CardGroup>

<Tip>
Shrinkwrap sam w sobie nie był problemem. Problemem był zły kształt pakietu.
`v2026.5.28` nadal dostarcza shrinkwrap, ale zagnieżdżone drzewo zależności jest znacznie
mniejsze, a wachlarz canvas dla wszystkich platform zniknął w lokalnym audycie.
</Tip>

## Co Zmieniło Się W 5.28

Porządki między `v2026.5.27` a `v2026.5.28` ograniczyły graf domyślnej
instalacji, zamiast usuwać same możliwości.

<CardGroup cols={2}>
  <Card title="Root default graph" icon="git-branch">
    Unikalne korzenie nazw/wersji pakietów spadły z **371** do **300**.
    Instancje pakietów spadły z **372** do **301**.
  </Card>
  <Card title="Nested tree" icon="unplug">
    Zagnieżdżone `openclaw/node_modules` spadło z **656.1MiB** do **259.7MiB**
    w tym samym lokalnym audycie instalacji.
  </Card>
  <Card title="Native optional cones" icon="cpu">
    Wieloplatformowy stożek pakietów natywnych `@napi-rs/canvas` przestał
    trafiać do domyślnej instalacji.
  </Card>
  <Card title="Supply-chain surface" icon="shield">
    Mniej domyślnych pakietów oznacza mniej archiwów tarball, maintainerów,
    binariów natywnych, zachowań podczas instalacji i przechodnich ścieżek
    aktualizacji, którym trzeba domyślnie ufać.
  </Card>
</CardGroup>

## Najważniejsze Liczby

Nie używaj uszkodzonych wierszy z końca kwietnia jako publicznych punktów
odniesienia wydajności. `v2026.4.23` i `v2026.4.29` są przydatnym dowodem
regresji, ale duże delty w stylu `14x` opisują głównie powrót po złej linii
wydań.

W narracji blogowej użyj wcześniejszej, opublikowanej kwietniowej bazy jako
skali:

| Metryka         | Wcześniejsza kwietniowa baza | `v2026.5.28` |                         Delta |
| --------------- | ---------------------------: | -----------: | ----------------------------: |
| Zimna tura agenta |                      9,819ms |      1,908ms | o 80.6% mniej, 5.1x szybciej |
| Ciepła tura agenta |                     7,458ms |      1,870ms | o 74.9% mniej, 4.0x szybciej |
| Szczytowe RSS agenta |                   686.2MB |      581.0MB |                o 15.3% mniej |

Wcześniejsza kwietniowa baza to `v2026.4.14` z opublikowanego uruchomienia
mock-providera `clawgrit-reports`. To uruchomienie używało powtórzenia 3 i
nie powiodło się tylko dlatego, że oś czasu diagnostyki nie została
wyemitowana; mediany dla zimnej tury, ciepłej tury i RSS nadal są przydatne
jako przybliżona skala. Traktuj to jako kontekst narracyjny, nie statystykę
bramki wydania.

W majowym przeglądzie najnowszy wiersz gałęzi wydania przesunął się istotnie
od `v2026.5.2`:

| Metryka         | `v2026.5.2` | `v2026.5.28` |        Delta |
| --------------- | ----------: | -----------: | -----------: |
| Zimna tura agenta |     3,897ms |      1,908ms | o 51.0% mniej |
| Ciepła tura agenta |    3,610ms |      1,870ms | o 48.2% mniej |
| Szczytowe RSS agenta |  613.7MB |      581.0MB |  o 5.3% mniej |

W porównaniu z poprzednim stabilnym wydaniem:

| Metryka         | `v2026.5.27` | `v2026.5.28` |        Delta |
| --------------- | -----------: | -----------: | -----------: |
| Zimna tura agenta |      2,231ms |      1,908ms | o 14.5% mniej |
| Ciepła tura agenta |     2,226ms |      1,870ms | o 16.0% mniej |
| Szczytowe RSS agenta |   649.0MB |      581.0MB | o 10.5% mniej |

### Ślad instalacji

| Metryka                                         |     Baza | `v2026.5.28` |        Delta |
| ----------------------------------------------- | -------: | -----------: | -----------: |
| Rozmiar instalacji od szczytu `2026.5.22`       | 1,020.6MB |     361.7MiB | o 64.6% mniej |
| Rozmiar instalacji od najnowszego wydania `2026.5.27` | 767.1MiB | 361.7MiB | o 52.8% mniej |
| Zależności od miesięcznego maksimum `2026.2.26` |      645 |          300 | o 53.5% mniej |
| Zależności od najnowszego wydania `2026.5.27`   |      371 |          300 | o 19.1% mniej |
| Zagnieżdżone `openclaw/node_modules` od `2026.5.22` | 911.8MB | 259.7MiB | o 71.5% mniej |
| Zagnieżdżone `openclaw/node_modules` od `2026.5.27` | 656.1MiB | 259.7MiB | o 60.4% mniej |

### Rozmiar pakietu npm

| Wersja      | Skompresowany tarball | Rozpakowany pakiet |  Pliki | Uwagi                                      |
| ----------- | --------------------: | -----------------: | -----: | ------------------------------------------ |
| `2026.1.30` |                12.8MB |             33.5MB |  4,607 | wczesny pakiet po rebrandingu              |
| `2026.2.26` |                23.6MB |             82.9MB | 10,125 | wzrost funkcji                             |
| `2026.3.31` |                43.3MB |            182.6MB | 21,037 | najwyższy punkt rozmiaru pakietu           |
| `2026.4.29` |                22.9MB |             74.6MB |  9,309 | widoczne przycinanie pakietu               |
| `2026.5.12` |                23.4MB |             80.1MB | 12,035 | duży podział na zewnętrzne pluginy         |
| `2026.5.22` |                17.2MB |             76.9MB | 12,386 | dokumentacja/zasoby wyłączone z pakietu    |
| `2026.5.27` |                17.8MB |             79.0MB | 12,509 | poprzedni stabilny pakiet                  |
| `2026.5.28` |                17.9MB |             81.0MB |  9,082 | najnowszy stabilny pakiet                  |

`2026.5.12` to widoczny w dzienniku zmian kamień milowy ekstrakcji pluginów:
Amazon Bedrock, Bedrock Mantle, Slack, OpenShell sandbox, Anthropic Vertex,
Matrix i WhatsApp przeniesiono poza ścieżkę zależności core, dzięki czemu ich
stożki zależności instalują się z tymi pluginami, zamiast z każdą instalacją
core.

## Podsumowanie tur agenta Kova

Kwietniowa linia stabilna zawiera dwie różne historie. Wcześniejszy kwiecień
był wolny, ale rozpoznawalny. Pod koniec kwietnia pojawił się gwałtowny spadek
regresyjny. `v2026.5.2` to punkt, w którym ścieżka mock-providera po raz
pierwszy schodzi do zakresu 3-5s i zaczyna konsekwentnie przechodzić w
dostarczonym przeglądzie.

Wcześniejszy opublikowany kontekst:

| Wydanie      | Kova | Zimna tura | Ciepła tura | Szczytowe RSS agenta |
| ------------ | ---- | ---------: | ----------: | -------------------: |
| `v2026.4.10` | NIEPOWODZENIE |  11,031ms |   7,962ms |        679.0MB |
| `v2026.4.12` | NIEPOWODZENIE |  11,965ms |   8,289ms |        713.5MB |
| `v2026.4.14` | NIEPOWODZENIE |   9,819ms |   7,458ms |        686.2MB |
| `v2026.4.20` | NIEPOWODZENIE |  22,314ms |  18,811ms |        810.8MB |
| `v2026.4.22` | NIEPOWODZENIE |   9,630ms |   7,459ms |        743.0MB |

Dostarczony przegląd:

| Wydanie             | Kova | Zimna tura | Ciepła tura | Szczytowe RSS agenta |
| ------------------- | ---- | ---------: | ----------: | -------------------: |
| `v2026.4.23`        | NIEPOWODZENIE |  47,847ms |   8,010ms |      1,082.7MB |
| `v2026.4.24`        | NIEPOWODZENIE |  48,264ms |  25,483ms |        996.0MB |
| `v2026.4.25`        | NIEPOWODZENIE |  81,080ms |  59,172ms |      1,113.9MB |
| `v2026.4.26`        | NIEPOWODZENIE |  76,771ms |  54,941ms |      1,140.8MB |
| `v2026.4.27`        | NIEPOWODZENIE |  60,902ms |  33,699ms |      1,156.0MB |
| `v2026.4.29`        | NIEPOWODZENIE |  94,031ms |  57,334ms |      3,613.7MB |
| `v2026.5.2`         | SUKCES |   3,897ms |   3,610ms |        613.7MB |
| `v2026.5.7`         | SUKCES |   3,923ms |   3,693ms |        654.1MB |
| `v2026.5.12`        | SUKCES |   7,248ms |   6,629ms |        834.8MB |
| `v2026.5.18`        | SUKCES |   3,301ms |   2,913ms |        630.3MB |
| `v2026.5.20`        | SUKCES |   3,413ms |   2,952ms |        643.2MB |
| `v2026.5.22`        | SUKCES |   4,494ms |   4,093ms |        654.3MB |
| `v2026.5.26`        | SUKCES |   2,626ms |   2,282ms |        660.4MB |
| `v2026.5.27-beta.1` | SUKCES |   2,575ms |   2,217ms |        635.3MB |
| `v2026.5.27`        | SUKCES |   2,231ms |   2,226ms |        649.0MB |
| `v2026.5.28`        | SUKCES |   1,908ms |   1,870ms |        581.0MB |

## Próby źródłowe

Próby źródłowe pominięto dla 17 pomyślnych starszych refów, ponieważ te drzewa
źródłowe nie miały jeszcze wymaganych punktów wejścia prób. Metryki tur agenta
nadal istnieją dla tych refów.

Reprezentatywne punkty prób źródłowych:

| Wydanie             | Domyślne `readyz` p50 | 50 pluginów `readyz` p50 | Kondycja CLI p50 | Maks. RSS Plugin |
| ------------------- | --------------------: | -----------------------: | ---------------: | ---------------: |
| `v2026.4.29`        |               2,819ms |                  2,618ms |          1,679ms |          389.0MB |
| `v2026.5.2`         |               2,324ms |                  2,013ms |          1,384ms |          377.2MB |
| `v2026.5.7`         |               1,649ms |                  1,540ms |          1,175ms |          387.6MB |
| `v2026.5.18`        |               1,942ms |                  1,927ms |            607ms |          426.5MB |
| `v2026.5.20`        |               1,966ms |                  1,987ms |            621ms |          455.0MB |
| `v2026.5.22`        |               2,081ms |                  1,884ms |          5,095ms |          444.2MB |
| `v2026.5.26`        |               1,546ms |                  1,634ms |            656ms |          400.4MB |
| `v2026.5.27-beta.1` |               1,462ms |                  1,548ms |            548ms |          394.0MB |
| `v2026.5.27`        |               1,491ms |                  1,571ms |            553ms |          401.5MB |
| `v2026.5.28`        |               1,457ms |                  1,474ms |            623ms |          386.1MB |

Skok zdrowia CLI w `v2026.5.22` jest widoczny w tej tabeli, mimo że ścieżka
agent-turn nadal przeszła. Zachowaj sondy źródłowe podczas badania
ukierunkowanych regresji CLI lub Gateway.

## Audyt śladu instalacji

Próbki zależności używają jednej stabilnej wersji z każdego miesiąca oraz
zdarzenia wprowadzenia shrinkwrap `2026.5.22` i najnowszej wersji `2026.5.28`.

| Punkt              | Zainstalowane zależności | Świeża instalacja | Pakiet OpenClaw | Zagnieżdżone `openclaw/node_modules` | Główny shrinkwrap | Zachowanie instalacji Canvas              |
| ------------------ | -----------------------: | ----------------: | --------------: | -----------------------------------: | ----------------- | ----------------------------------------- |
| Sty `2026.1.30`    |                      605 |           438.4MB |          45.8MB |                                2.4MB | nie               | wrapper najwyższego poziomu + `darwin-arm64` |
| Lut `2026.2.26`    |                      645 |           575.7MB |         110.1MB |                                3.5MB | nie               | wrapper najwyższego poziomu + `darwin-arm64` |
| Mar `2026.3.31`    |                      438 |           584.1MB |         234.8MB |                                  0MB | nie               | wrapper najwyższego poziomu + `darwin-arm64` |
| Kwi `2026.4.29`    |                      392 |           335.0MB |          97.4MB |                                  0MB | nie               | nic nie zainstalowano                     |
| `2026.5.22`        |                      401 |         1,020.6MB |       1,020.4MB |                              911.8MB | tak               | zagnieżdżone: wszystkie 12 pakietów `@napi-rs/canvas` |
| Maj `2026.5.26`    |                      371 |           767.5MB |         767.4MB |                              656.4MB | tak               | zagnieżdżone: wszystkie 12 pakietów `@napi-rs/canvas` |
| `2026.5.27`        |                      371 |          767.1MiB |        766.9MiB |                             656.1MiB | tak               | zagnieżdżone: wszystkie 12 pakietów `@napi-rs/canvas` |
| Najnowsza `2026.5.28` |                   300 |          361.7MiB |        361.6MiB |                             259.7MiB | tak               | nic nie zainstalowano                     |

### Granica shrinkwrap

<CardGroup cols={2}>
  <Card title="Before shrinkwrap" icon="unlock">
    `2026.5.20` nie ma głównego shrinkwrap ani dużego zagnieżdżonego drzewa
    zależności OpenClaw.
  </Card>
  <Card title="Introduced" icon="lock">
    `2026.5.22` dodaje główny shrinkwrap i instaluje 911.8MB w zagnieżdżonym
    `openclaw/node_modules`.
  </Card>
  <Card title="Latest stable" icon="tag">
    `2026.5.28` zachowuje shrinkwrap i nadal instaluje 259.7MiB w zagnieżdżonym
    `openclaw/node_modules`.
  </Card>
  <Card title="Canvas fanout fixed" icon="check">
    `2026.5.28` nie instaluje już żadnych pakietów `@napi-rs/canvas` w lokalnym
    audycie świeżej instalacji.
  </Card>
</CardGroup>

Inspekcja opublikowanego tarballa potwierdza granicę:

| Wersja      | Opublikowana stabilna? | Główny `npm-shrinkwrap.json` | Uwagi                                 |
| ----------- | ---------------------- | ---------------------------- | ------------------------------------- |
| `2026.5.20` | tak                    | nie                          | ostatnia stabilna wersja przed shrinkwrap |
| `2026.5.21` | nie                    | n/d                          | brak stabilnej wersji npm            |
| `2026.5.22` | tak                    | tak                          | wprowadzono shrinkwrap               |
| `2026.5.23` | nie                    | n/d                          | brak stabilnej wersji npm            |
| `2026.5.24` | nie                    | n/d                          | brak stabilnej wersji npm            |
| `2026.5.25` | nie                    | n/d                          | brak stabilnej wersji npm            |
| `2026.5.26` | tak                    | tak                          | zagnieżdżone drzewo zależności nadal obecne |
| `2026.5.27` | tak                    | tak                          | zagnieżdżone drzewo zależności nadal obecne |
| `2026.5.28` | tak                    | tak                          | zagnieżdżone drzewo zależności znacznie mniejsze |

Ważne rozróżnienie: **sam shrinkwrap nie jest problemem**.
`v2026.5.28` nadal dostarcza główny shrinkwrap. Problemem był kształt pakietu,
który sprawiał, że npm materializował duże zagnieżdżone drzewo zależności
OpenClaw oraz wszystkie 12 pakietów platformowych `@napi-rs/canvas`.
Zagnieżdżone drzewo jest mniejsze w `v2026.5.28`, a platformowy fanout Canvas
nie trafia już do lokalnego audytu.

Proste wyjaśnienie shrinkwrap i kontroli pakietów na poziomie utrzymującego
znajdziesz w [npm shrinkwrap](/pl/gateway/security/shrinkwrap).

## Interpretacja łańcucha dostaw

Liczba zależności jest metryką bezpieczeństwa operacyjnego, a nie tylko metryką
rozmiaru instalacji. Każdy pakiet powiększa zestaw utrzymujących, tarballi,
aktualizacji przechodnich, opcjonalnych binariów natywnych oraz zachowań podczas
instalacji, którym operatorzy muszą ufać.

Kierunek porządkowania jest następujący:

- utrzymywać ciężkie i opcjonalne możliwości poza domyślną instalacją rdzenia
- sprawić, aby pakiety Plugin były właścicielami swojego grafu zależności runtime
- unikać naprawiania przez menedżera pakietów w czasie działania podczas uruchamiania Gateway
- zachować deterministyczne instalacje bez powodowania materializacji natywnych pakietów dla wszystkich platform
- utrzymywać skrypty instalacyjne wyłączone w ścieżkach akceptacji i pomiaru pakietów
- wykrywać zagnieżdżone drzewa zależności i eksplozje natywnych opcjonalnych zależności przed publikacją

Powiązana dokumentacja:

- [Rozwiązywanie zależności Plugin](/pl/plugins/dependency-resolution)
- [Inwentarz Plugin](/pl/plugins/plugin-inventory)
- [Pełna walidacja wydania](/pl/reference/full-release-validation)
