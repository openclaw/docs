---
read_when:
    - Weryfikujesz optymalizację wydajności i rozmiaru pakietu z maja 2026 roku
    - Potrzebujesz danych liczbowych stojących za wpisem na blogu o wydajności i zależnościach OpenClaw
    - Zmieniasz kryteria wydania, plik shrinkwrap pakietu lub granice zależności pluginów
summary: Wizualne podsumowanie i dowody techniczne dotyczące przeprowadzonej w maju 2026 roku optymalizacji wydajności, rozmiaru pakietów, zależności i pliku shrinkwrap
title: Przegląd wydajności wydania
x-i18n:
    generated_at: "2026-07-12T15:37:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e98ffc9d63e14e078a19368917eb4278695e1426048dc21942f928af145d5e1
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Ta strona przedstawia dowody stojące za przeprowadzonym w maju 2026 roku porządkowaniem wydajności OpenClaw, rozmiaru pakietu, zależności i pliku shrinkwrap. Stanowi techniczne uzupełnienie publicznego wpisu na blogu.

Połączono tutaj dwa audyty:

- **Przegląd wydajności wydań:** wydania GitHub od `v2026.5.28` wstecz do stabilnego
  `v2026.4.23`, z użyciem przepływu pracy `OpenClaw Performance`,
  `profile=smoke` i ścieżki pozorowanego dostawcy. Większość wierszy tagów zawiera jedną próbkę; wiersze
  `v2026.5.27` i `v2026.5.28` wykorzystują najnowsze artefakty z trzema powtórzeniami
  z gałęzi wydania.
- **Wcześniejszy kontekst kwietniowy:** opublikowane poziomy bazowe pozorowanego dostawcy z
  `clawgrit-reports`, od `v2026.4.1` do `v2026.5.2`, używane wyłącznie po to, aby nie traktować
  wadliwych wydań z końca kwietnia jako publicznego poziomu bazowego wydajności.
- **Przegląd rozmiaru instalacji:** świeże instalacje `npm install --ignore-scripts`
  w pakietach tymczasowych, z użyciem `du -sk node_modules` do pomiaru rozmiaru oraz
  przejścia po `node_modules` w celu zliczenia instancji pakietów.
- **Przegląd rozmiaru pakietu npm:** `npm pack openclaw@<version> --dry-run --json`
  dla opublikowanych wydań, z rejestrowaniem rozmiaru skompresowanego archiwum tar, rozmiaru
  po rozpakowaniu i liczby plików.

<Warning>
Główny przegląd wydajności używa jednej próbki testu dymnego na tag, z wyjątkiem
wierszy `v2026.5.27` i `v2026.5.28`, które wykorzystują najnowsze artefakty
z trzema powtórzeniami z gałęzi wydania. Wcześniejszy kontekst kwietniowy wykorzystuje opublikowane mediany
z trzech powtórzeń z `clawgrit-reports`. Traktuj te liczby jako dowody trendu i
sygnał pomocny w wyszukiwaniu regresji, a nie jako statystyki bramki wydania.
</Warning>

## Podsumowanie

Zakres pomiarów wydajności: **77 żądanych wydań**, **74 punkty oparte na artefaktach**
oraz **3 niedostępne uruchomienia CI**. Najnowszy zmierzony punkt stabilny: `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Stabilny przebieg agenta" icon="gauge">
    **Zimny przebieg szybszy 5,1 raza**

    - `v2026.4.14`: 9,8 s
    - `v2026.5.28`: 1,9 s

  </Card>
  <Card title="Opublikowany pakiet" icon="package">
    **Archiwum tar 17,9 MB**

    Najnowszy stabilny pakiet, mniejszy od marcowego maksimum rozmiaru pakietu wynoszącego 43,3 MB.

  </Card>
  <Card title="Najnowsza stabilna instalacja" icon="hard-drive">
    **Świeża instalacja 361,7 MiB**

    Znacznie zmniejsza zagnieżdżone drzewo zależności OpenClaw względem maksimum związanego
    z wprowadzeniem pliku shrinkwrap w `2026.5.22`, choć w lokalnym audycie instalacji nadal
    pozostaje mniejsze zagnieżdżone drzewo o rozmiarze 259,7 MiB.

  </Card>
  <Card title="Graf zależności" icon="boxes">
    **300 zainstalowanych pakietów**

    Pomiar obejmuje unikatowe korzenie par nazwa/wersja pakietu w świeżej instalacji
    z wyłączonymi skryptami; o 71 korzeni mniej niż w poprzednim stabilnym wydaniu.

  </Card>
</CardGroup>

## Co zmieniło się w wersji 5.28

Porządkowanie między `v2026.5.27` a `v2026.5.28` zmniejszyło graf domyślnej instalacji,
zamiast usuwać same możliwości.

<CardGroup cols={2}>
  <Card title="Główny graf domyślny" icon="git-branch">
    Liczba unikatowych korzeni par nazwa/wersja pakietu spadła z **371** do **300**. Liczba instancji
    pakietów spadła z **372** do **301**.
  </Card>
  <Card title="Zagnieżdżone drzewo" icon="unplug">
    Rozmiar zagnieżdżonego `openclaw/node_modules` spadł z **656,1 MiB** do **259,7 MiB** w
    tym samym lokalnym audycie instalacji.
  </Card>
  <Card title="Natywne opcjonalne stożki zależności" icon="cpu">
    Wieloplatformowy stożek natywnych pakietów `@napi-rs/canvas` przestał trafiać do
    domyślnej instalacji.
  </Card>
  <Card title="Powierzchnia łańcucha dostaw" icon="shield">
    Mniej domyślnych pakietów oznacza mniej archiwów tar, opiekunów, natywnych plików binarnych,
    zachowań w czasie instalacji i przechodnich ścieżek aktualizacji, którym trzeba domyślnie ufać.
  </Card>
</CardGroup>

<Tip>
Sam plik shrinkwrap nie był problemem. Problemem był nieprawidłowy kształt pakietu.
`v2026.5.28` nadal dostarcza plik shrinkwrap, ale zagnieżdżone drzewo zależności jest znacznie
mniejsze, a w lokalnym audycie nie ma już wieloplatformowego rozgałęzienia zależności canvas.
</Tip>

## Najważniejsze liczby

Nie używaj wadliwych wierszy z końca kwietnia jako publicznych poziomów bazowych wydajności.
`v2026.4.23` i `v2026.4.29` są przydatnymi dowodami regresji, ale duże różnice
rzędu `14x` opisują głównie odzyskiwanie sprawności po wadliwej linii wydań.

W narracji blogowej użyj jako skali opublikowanego poziomu bazowego z wcześniejszej części kwietnia.
Poziomem bazowym jest `v2026.4.14` z opublikowanego uruchomienia pozorowanego dostawcy
w `clawgrit-reports` (3 powtórzenia; to uruchomienie nie powiodło się wyłącznie dlatego, że nie
wyemitowano diagnostycznej osi czasu, więc mediany zimnego przebiegu, ciepłego przebiegu i RSS nadal
są przydatne jako przybliżona skala). Traktuj to jako kontekst narracyjny, a nie statystykę
bramki wydania.

| Metryka              | Poziom bazowy z początku kwietnia | `v2026.5.28` |                         Różnica |
| -------------------- | --------------------------------: | -----------: | -------------------------------: |
| Zimny przebieg agenta |                           9 819 ms |     1 908 ms | mniej o 80,6%, szybciej 5,1 raza |
| Ciepły przebieg agenta |                          7 458 ms |     1 870 ms | mniej o 74,9%, szybciej 4,0 razy |
| Szczytowe RSS agenta |                            686,2 MB |     581,0 MB |                   mniej o 15,3% |

W ramach majowego przeglądu najnowszy wiersz gałęzi wydania zmienił się znacząco względem
`v2026.5.2`:

| Metryka               | `v2026.5.2` | `v2026.5.28` |     Różnica |
| --------------------- | ----------: | -----------: | ----------: |
| Zimny przebieg agenta |    3 897 ms |     1 908 ms | mniej o 51,0% |
| Ciepły przebieg agenta |   3 610 ms |     1 870 ms | mniej o 48,2% |
| Szczytowe RSS agenta  |     613,7 MB |      581,0 MB | mniej o 5,3% |

W porównaniu z poprzednim stabilnym wydaniem:

| Metryka               | `v2026.5.27` | `v2026.5.28` |     Różnica |
| --------------------- | -----------: | -----------: | ----------: |
| Zimny przebieg agenta |      2 231 ms |      1 908 ms | mniej o 14,5% |
| Ciepły przebieg agenta |     2 226 ms |      1 870 ms | mniej o 16,0% |
| Szczytowe RSS agenta  |       649,0 MB |       581,0 MB | mniej o 10,5% |

### Rozmiar instalacji

| Metryka                                         | Poziom bazowy | `v2026.5.28` |      Różnica |
| ----------------------------------------------- | ------------: | -----------: | -----------: |
| Rozmiar instalacji względem maksimum `2026.5.22` |    1 020,6 MB |    361,7 MiB | mniej o 64,6% |
| Rozmiar instalacji względem najnowszego wydania `2026.5.27` | 767,1 MiB | 361,7 MiB | mniej o 52,8% |
| Zależności względem miesięcznego maksimum `2026.2.26` | 645 | 300 | mniej o 53,5% |
| Zależności względem najnowszego wydania `2026.5.27` | 371 | 300 | mniej o 19,1% |
| Zagnieżdżone `openclaw/node_modules` względem `2026.5.22` | 911,8 MB | 259,7 MiB | mniej o 71,5% |
| Zagnieżdżone `openclaw/node_modules` względem `2026.5.27` | 656,1 MiB | 259,7 MiB | mniej o 60,4% |

### Rozmiar pakietu npm

| Wersja      | Skompresowane archiwum tar | Pakiet po rozpakowaniu | Pliki | Uwagi                                      |
| ----------- | -------------------------: | ---------------------: | ----: | ------------------------------------------ |
| `2026.1.30` |                    12,8 MB |                33,5 MB | 4 607 | wczesny pakiet po zmianie marki            |
| `2026.2.26` |                    23,6 MB |                82,9 MB | 10 125 | rozwój funkcji                             |
| `2026.3.31` |                    43,3 MB |               182,6 MB | 21 037 | maksimum rozmiaru pakietu                  |
| `2026.4.29` |                    22,9 MB |                74,6 MB | 9 309 | widoczne ograniczanie zawartości pakietu   |
| `2026.5.12` |                    23,4 MB |                80,1 MB | 12 035 | istotne wydzielenie zewnętrznych pluginów  |
| `2026.5.22` |                    17,2 MB |                76,9 MB | 12 386 | dokumentacja/zasoby wykluczone z pakietu   |
| `2026.5.27` |                    17,8 MB |                79,0 MB | 12 509 | poprzedni stabilny pakiet                  |
| `2026.5.28` |                    17,9 MB |                81,0 MB | 9 082 | najnowszy stabilny pakiet                  |

`2026.5.12` to widoczny w dzienniku zmian kamień milowy wydzielania pluginów:
Amazon Bedrock, Bedrock Mantle, Slack, piaskownica OpenShell, Anthropic Vertex,
Matrix i WhatsApp zostały usunięte z głównej ścieżki zależności, dzięki czemu ich stożki zależności
są instalowane wraz z tymi pluginami, a nie przy każdej instalacji głównego pakietu.

## Podsumowanie przebiegów agenta Kova

Stabilna linia kwietniowa obejmuje dwie różne historie. Wcześniejsza część kwietnia była wolna,
ale rozpoznawalna. Końcówka kwietnia stała się gwałtownym spadkiem regresyjnym. `v2026.5.2` to moment,
w którym ścieżka pozorowanego dostawcy po raz pierwszy schodzi do zakresu 3–5 s i zaczyna
konsekwentnie przechodzić w dostarczonym przeglądzie.

Wcześniejszy opublikowany kontekst:

| Wydanie      | Kova | Zimny przebieg | Ciepły przebieg | Szczytowe RSS agenta |
| ------------ | ---- | --------------: | ---------------: | -------------------: |
| `v2026.4.10` | NIEPOWODZENIE | 11 031 ms | 7 962 ms | 679,0 MB |
| `v2026.4.12` | NIEPOWODZENIE | 11 965 ms | 8 289 ms | 713,5 MB |
| `v2026.4.14` | NIEPOWODZENIE | 9 819 ms | 7 458 ms | 686,2 MB |
| `v2026.4.20` | NIEPOWODZENIE | 22 314 ms | 18 811 ms | 810,8 MB |
| `v2026.4.22` | NIEPOWODZENIE | 9 630 ms | 7 459 ms | 743,0 MB |

Dostarczony przegląd:

| Wydanie             | Kova | Zimny przebieg | Ciepły przebieg | Szczytowe RSS agenta |
| ------------------- | ---- | --------------: | ---------------: | -------------------: |
| `v2026.4.23`        | NIEPOWODZENIE | 47 847 ms | 8 010 ms | 1 082,7 MB |
| `v2026.4.24`        | NIEPOWODZENIE | 48 264 ms | 25 483 ms | 996,0 MB |
| `v2026.4.25`        | NIEPOWODZENIE | 81 080 ms | 59 172 ms | 1 113,9 MB |
| `v2026.4.26`        | NIEPOWODZENIE | 76 771 ms | 54 941 ms | 1 140,8 MB |
| `v2026.4.27`        | NIEPOWODZENIE | 60 902 ms | 33 699 ms | 1 156,0 MB |
| `v2026.4.29`        | NIEPOWODZENIE | 94 031 ms | 57 334 ms | 3 613,7 MB |
| `v2026.5.2`         | POWODZENIE | 3 897 ms | 3 610 ms | 613,7 MB |
| `v2026.5.7`         | POWODZENIE | 3 923 ms | 3 693 ms | 654,1 MB |
| `v2026.5.12`        | POWODZENIE | 7 248 ms | 6 629 ms | 834,8 MB |
| `v2026.5.18`        | POWODZENIE | 3 301 ms | 2 913 ms | 630,3 MB |
| `v2026.5.20`        | POWODZENIE | 3 413 ms | 2 952 ms | 643,2 MB |
| `v2026.5.22`        | POWODZENIE | 4 494 ms | 4 093 ms | 654,3 MB |
| `v2026.5.26`        | POWODZENIE | 2 626 ms | 2 282 ms | 660,4 MB |
| `v2026.5.27-beta.1` | POWODZENIE | 2 575 ms | 2 217 ms | 635,3 MB |
| `v2026.5.27`        | POWODZENIE | 2 231 ms | 2 226 ms | 649,0 MB |
| `v2026.5.28`        | POWODZENIE | 1 908 ms | 1 870 ms | 581,0 MB |

## Pomiary kodu źródłowego

Pomiary kodu źródłowego pominięto dla 17 pomyślnych starszych odwołań, ponieważ te drzewa źródłowe
nie zawierały jeszcze wymaganych punktów wejścia pomiarów. Metryki przebiegów agenta nadal
istnieją dla tych odwołań.

Reprezentatywne punkty pomiarów kodu źródłowego:

| Wydanie             | Domyślne `readyz` p50 | 50 pluginów `readyz` p50 | Stan CLI p50 | Maks. RSS pluginu |
| ------------------- | --------------------: | -----------------------: | -----------: | ----------------: |
| `v2026.4.29`        |              2 819 ms |                 2 618 ms |     1 679 ms |          389,0 MB |
| `v2026.5.2`         |              2 324 ms |                 2 013 ms |     1 384 ms |          377,2 MB |
| `v2026.5.7`         |              1 649 ms |                 1 540 ms |     1 175 ms |          387,6 MB |
| `v2026.5.18`        |              1 942 ms |                 1 927 ms |       607 ms |          426,5 MB |
| `v2026.5.20`        |              1 966 ms |                 1 987 ms |       621 ms |          455,0 MB |
| `v2026.5.22`        |              2 081 ms |                 1 884 ms |     5 095 ms |          444,2 MB |
| `v2026.5.26`        |              1 546 ms |                 1 634 ms |       656 ms |          400,4 MB |
| `v2026.5.27-beta.1` |              1 462 ms |                 1 548 ms |       548 ms |          394,0 MB |
| `v2026.5.27`        |              1 491 ms |                 1 571 ms |       553 ms |          401,5 MB |
| `v2026.5.28`        |              1 457 ms |                 1 474 ms |       623 ms |          386,1 MB |

Skok czasu kontroli stanu CLI w `v2026.5.22` jest widoczny w tej tabeli, mimo że
ścieżka przebiegu agenta nadal zakończyła się powodzeniem. Zachowuj pomiary kodu źródłowego podczas badania
ukierunkowanych regresji CLI lub Gateway.

## Audyt rozmiaru instalacji

Próbki zależności obejmują po jednym stabilnym wydaniu z każdego miesiąca, a także zdarzenie
wprowadzenia pliku shrinkwrap w `2026.5.22` i najnowsze wydanie `2026.5.28`.

| Punkt                    | Zainstalowane zależności | Świeża instalacja | Pakiet OpenClaw | Zagnieżdżone `openclaw/node_modules` | Główny shrinkwrap | Zachowanie instalacji Canvas                     |
| ------------------------ | -----------------------: | ----------------: | -------------: | -----------------------------------: | ----------------- | ------------------------------------------------ |
| Sty `2026.1.30`          |                      605 |           438.4MB |         45.8MB |                                2.4MB | nie               | wrapper najwyższego poziomu + `darwin-arm64`     |
| Lut `2026.2.26`          |                      645 |           575.7MB |        110.1MB |                                3.5MB | nie               | wrapper najwyższego poziomu + `darwin-arm64`     |
| Mar `2026.3.31`          |                      438 |           584.1MB |        234.8MB |                                  0MB | nie               | wrapper najwyższego poziomu + `darwin-arm64`     |
| Kwi `2026.4.29`          |                      392 |           335.0MB |         97.4MB |                                  0MB | nie               | nic nie zainstalowano                             |
| `2026.5.22`              |                      401 |         1,020.6MB |      1,020.4MB |                              911.8MB | tak               | zagnieżdżone: wszystkie 12 pakietów `@napi-rs/canvas` |
| Maj `2026.5.26`          |                      371 |           767.5MB |        767.4MB |                              656.4MB | tak               | zagnieżdżone: wszystkie 12 pakietów `@napi-rs/canvas` |
| `2026.5.27`              |                      371 |          767.1MiB |       766.9MiB |                             656.1MiB | tak               | zagnieżdżone: wszystkie 12 pakietów `@napi-rs/canvas` |
| Najnowsza `2026.5.28`    |                      300 |          361.7MiB |       361.6MiB |                             259.7MiB | tak               | nic nie zainstalowano                             |

### Granica wprowadzenia shrinkwrap

Wersja `2026.5.20` została wydana bez głównego pliku shrinkwrap i bez dużego,
zagnieżdżonego drzewa zależności OpenClaw. Wersja `2026.5.22` wprowadziła główny
plik shrinkwrap i zainstalowała 911.8MB w zagnieżdżonym katalogu
`openclaw/node_modules`. Wersja `2026.5.28` zachowuje shrinkwrap i nadal
instaluje 259.7MiB w zagnieżdżonym katalogu `openclaw/node_modules`, ale
w lokalnym audycie świeżej instalacji nie instaluje już żadnych pakietów
`@napi-rs/canvas`.

Inspekcja opublikowanych archiwów tar potwierdza tę granicę:

| Wersja      | Opublikowana jako stabilna? | Główny `npm-shrinkwrap.json` | Uwagi                                                   |
| ----------- | --------------------------- | ---------------------------- | ------------------------------------------------------- |
| `2026.5.20` | tak                         | nie                          | ostatnie stabilne wydanie przed wprowadzeniem shrinkwrap |
| `2026.5.21` | nie                         | nie dotyczy                  | brak stabilnego wydania npm                             |
| `2026.5.22` | tak                         | tak                          | wprowadzono shrinkwrap                                  |
| `2026.5.23` | nie                         | nie dotyczy                  | brak stabilnego wydania npm                             |
| `2026.5.24` | nie                         | nie dotyczy                  | brak stabilnego wydania npm                             |
| `2026.5.25` | nie                         | nie dotyczy                  | brak stabilnego wydania npm                             |
| `2026.5.26` | tak                         | tak                          | zagnieżdżone drzewo zależności nadal obecne             |
| `2026.5.27` | tak                         | tak                          | zagnieżdżone drzewo zależności nadal obecne             |
| `2026.5.28` | tak                         | tak                          | zagnieżdżone drzewo zależności jest znacznie mniejsze   |

Ważne rozróżnienie: **sam shrinkwrap nie jest problemem**.
Wersja `v2026.5.28` nadal zawiera główny plik shrinkwrap. Problemem była struktura
pakietu, która powodowała, że npm materializował duże, zagnieżdżone drzewo
zależności OpenClaw oraz wszystkie 12 pakietów platformowych `@napi-rs/canvas`.
W wersji `v2026.5.28` zagnieżdżone drzewo jest mniejsze, a zestaw pakietów
platformowych Canvas nie pojawia się już w lokalnym audycie.

Przystępne wyjaśnienie shrinkwrap oraz opis kontroli pakietów wykonywanych przez
opiekunów zawiera strona [shrinkwrap npm](/pl/gateway/security/shrinkwrap).

## Interpretacja dotycząca łańcucha dostaw

Liczba zależności jest wskaźnikiem bezpieczeństwa operacyjnego, a nie tylko
wskaźnikiem rozmiaru instalacji. Każdy pakiet zwiększa liczbę opiekunów,
archiwów tar, aktualizacji przechodnich, opcjonalnych natywnych plików binarnych
oraz zachowań podczas instalacji, którym operatorzy muszą ufać.

Kierunek porządkowania:

- utrzymywanie ciężkich i opcjonalnych funkcji poza domyślną instalacją rdzenia
- przypisanie pakietom pluginów odpowiedzialności za ich graf zależności środowiska wykonawczego
- unikanie napraw za pomocą menedżera pakietów w czasie działania podczas uruchamiania Gateway
- zachowanie deterministycznych instalacji bez powodowania materializacji natywnych pakietów dla wszystkich platform
- utrzymywanie wyłączonych skryptów instalacyjnych w procesach akceptacji i pomiaru pakietów
- wykrywanie zagnieżdżonych drzew zależności i gwałtownego wzrostu liczby natywnych zależności opcjonalnych przed publikacją

Powiązana dokumentacja:

- [Rozwiązywanie zależności pluginów](/pl/plugins/dependency-resolution)
- [Inwentarz pluginów](/pl/plugins/plugin-inventory)
- [Pełna walidacja wydania](/pl/reference/full-release-validation)
