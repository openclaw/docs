---
read_when:
    - Chcesz, aby promowanie pamięci działało automatycznie
    - Chcesz zrozumieć, co robi każda faza Dreaming
    - Chcesz dostroić konsolidację bez zaśmiecania MEMORY.md
sidebarTitle: Dreaming
summary: Konsolidacja pamięci w tle z fazami lekką, głęboką i REM oraz Dziennikiem snów
title: Dreaming
x-i18n:
    generated_at: "2026-06-30T14:31:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b636df63cdc5b60758f9600af695b3b6453122a03b0cc6fdc69d3c9259d1e61
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming to system konsolidacji pamięci w tle w `memory-core`. Pomaga OpenClaw przenosić silne sygnały krótkoterminowe do trwałej pamięci, zachowując przy tym wyjaśnialność i możliwość przeglądu procesu.

<Note>
Dreaming jest **opcjonalny** i domyślnie wyłączony.
</Note>

## Co zapisuje Dreaming

Dreaming utrzymuje dwa rodzaje danych wyjściowych:

- **Stan maszyny** w `memory/.dreams/` (magazyn odwołań, sygnały faz, punkty kontrolne ingestii, blokady).
- **Dane czytelne dla człowieka** w `DREAMS.md` (lub istniejącym `dreams.md`) oraz opcjonalne pliki raportów faz w `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promowanie do pamięci długoterminowej nadal zapisuje wyłącznie do `MEMORY.md`.

## Model faz

Dreaming używa trzech współpracujących faz:

| Faza    | Cel                                                | Trwały zapis      |
| ------- | -------------------------------------------------- | ----------------- |
| Lekka   | Sortowanie i etapowanie najnowszego materiału krótkoterminowego | Nie               |
| Głęboka | Ocena i promowanie trwałych kandydatów             | Tak (`MEMORY.md`) |
| REM     | Refleksja nad motywami i powracającymi pomysłami   | Nie               |

Te fazy są wewnętrznymi szczegółami implementacji, a nie osobnymi „trybami” konfigurowanymi przez użytkownika.

<AccordionGroup>
  <Accordion title="Light phase">
    Faza lekka pobiera najnowsze dzienne sygnały pamięci i ślady odwołań, deduplikuje je i etapu­je wiersze kandydatów.

    - Odczytuje krótkoterminowy stan odwołań, najnowsze dzienne pliki pamięci i zredagowane transkrypty sesji, gdy są dostępne.
    - Zapisuje zarządzany blok `## Light Sleep`, gdy magazyn obejmuje dane wyjściowe inline.
    - Rejestruje sygnały wzmocnienia do późniejszego rankingu głębokiego.
    - Nigdy nie zapisuje do `MEMORY.md`.

  </Accordion>
  <Accordion title="Deep phase">
    Faza głęboka decyduje, co staje się pamięcią długoterminową.

    - Klasyfikuje kandydatów przy użyciu ważonej punktacji i progów.
    - Wymaga spełnienia `minScore`, `minRecallCount` i `minUniqueQueries`.
    - Odtwarza fragmenty z aktywnych dziennych plików przed zapisem, więc nieaktualne/usunięte fragmenty są pomijane.
    - Dopisuje promowane wpisy do `MEMORY.md`.
    - Zapisuje podsumowanie `## Deep Sleep` w `DREAMS.md` i opcjonalnie zapisuje `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="REM phase">
    Faza REM wyodrębnia wzorce i sygnały refleksyjne.

    - Buduje podsumowania motywów i refleksji z najnowszych krótkoterminowych śladów.
    - Zapisuje zarządzany blok `## REM Sleep`, gdy magazyn obejmuje dane wyjściowe inline.
    - Rejestruje sygnały wzmocnienia REM używane przez ranking głęboki.
    - Nigdy nie zapisuje do `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestia transkryptów sesji

Dreaming może pobierać zredagowane transkrypty sesji do korpusu Dreaming. Gdy transkrypty są dostępne, trafiają do fazy lekkiej obok dziennych sygnałów pamięci i śladów odwołań. Treści osobiste i wrażliwe są redagowane przed ingestą.

## Dziennik snów

Dreaming utrzymuje także narracyjny **Dziennik snów** w `DREAMS.md`. Gdy każda faza ma wystarczająco dużo materiału, `memory-core` uruchamia w tle najlepszą możliwą turę subagenta i dopisuje krótki wpis dziennika. Używa domyślnego modelu runtime, chyba że skonfigurowano `dreaming.model`. Jeśli skonfigurowany model jest niedostępny, Dziennik snów ponawia próbę raz z domyślnym modelem sesji.

<Note>
Ten dziennik jest przeznaczony do czytania przez ludzi w interfejsie Dreams, a nie jako źródło promocji. Artefakty dziennika/raportu wygenerowane przez Dreaming są wyłączone z promocji krótkoterminowej. Do promowania do `MEMORY.md` kwalifikują się tylko ugruntowane fragmenty pamięci.
</Note>

Istnieje też ugruntowana ścieżka historycznego uzupełniania do pracy przeglądowej i odzyskiwania:

<AccordionGroup>
  <Accordion title="Backfill commands">
    - `memory rem-harness --path ... --grounded` podgląda ugruntowane dane wyjściowe dziennika z historycznych notatek `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` zapisuje odwracalne ugruntowane wpisy dziennika do `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` etapu­je ugruntowanych trwałych kandydatów w tym samym krótkoterminowym magazynie dowodów, którego używa już normalna faza głęboka.
    - `memory rem-backfill --rollback` i `--rollback-short-term` usuwają te etapowane artefakty uzupełniania bez naruszania zwykłych wpisów dziennika ani aktywnych krótkoterminowych odwołań.

  </Accordion>
</AccordionGroup>

Control UI udostępnia ten sam przepływ uzupełniania/resetowania dziennika, aby można było sprawdzić wyniki w scenie Dreams przed decyzją, czy ugruntowani kandydaci zasługują na promocję. Scena pokazuje też osobną ugruntowaną ścieżkę, dzięki czemu widać, które etapowane wpisy krótkoterminowe pochodzą z historycznego odtworzenia, które promowane elementy były prowadzone przez ugruntowanie, oraz można wyczyścić tylko ugruntowane etapowane wpisy bez naruszania zwykłego aktywnego krótkoterminowego stanu.

## Sygnały rankingu głębokiego

Ranking głęboki używa sześciu ważonych sygnałów bazowych oraz wzmocnienia faz:

| Sygnał                | Waga | Opis                                             |
| --------------------- | ---- | ------------------------------------------------ |
| Częstotliwość         | 0.24 | Ile sygnałów krótkoterminowych zgromadził wpis   |
| Trafność              | 0.30 | Średnia jakość pobierania dla wpisu              |
| Różnorodność zapytań  | 0.15 | Odrębne konteksty zapytań/dni, które go ujawniły |
| Świeżość              | 0.15 | Wynik świeżości z zanikiem czasowym              |
| Konsolidacja          | 0.10 | Siła wielodniowego nawrotu                       |
| Bogactwo konceptualne | 0.06 | Gęstość tagów pojęć z fragmentu/ścieżki          |

Trafienia faz lekkiej i REM dodają niewielkie wzmocnienie z zanikiem świeżości z `memory/.dreams/phase-signals.json`.

Wyniki prób shadow można nakładać na tę punktację bazową jako sygnał przeglądowy
przed jakimkolwiek trwałym zapisem. Pomocna próba daje kandydatowi małe,
ograniczone wzmocnienie, neutralna próba pozostawia go odroczonym, a szkodliwa
próba oznacza go jako odrzuconego w danym przebiegu punktacji. Ten sygnał nadal
jest tylko raportowy: może zmieniać kolejność kandydatów lub metadane przeglądu,
ale sam nie zapisuje do `MEMORY.md` ani nie promuje kandydata.

## Pokrycie raportu prób shadow w QA

QA Lab obejmuje scenariusz tylko raportowy do badania, jak przyszła próba shadow
Dreaming mogłaby przeglądać kandydata pamięci przed promocją. Scenariusz prosi
agenta o porównanie odpowiedzi bazowej z odpowiedzią, która może użyć pamięci
kandydata, a następnie zapisanie lokalnego raportu z werdyktem, powodem i flagami
ryzyka.

To pokrycie jest celowo ograniczone do QA. Weryfikuje, że artefakt raportu
pozostaje oddzielony od `MEMORY.md` oraz że agent nie twierdzi, iż kandydat
został promowany. Nie dodaje produkcyjnego zachowania prób shadow ani nie zmienia
silnika promocji fazy głębokiej.

Runner prób shadow w `memory-core` utrzymuje ten sam kontrakt tylko raportowy dla
ścieżek kodu, które potrzebują stabilnego artefaktu. Przyjmuje kandydata, prompt
próby, wynik bazowy, wynik kandydata, werdykt, powód, flagi ryzyka i referencje
dowodów, a następnie zapisuje raport z `promotion action: report-only`. Pomocne
werdykty mapują się na rekomendację `promote`, neutralne werdykty na `defer`, a
szkodliwe werdykty na `reject`; żadna z tych rekomendacji nie zapisuje do
`MEMORY.md` ani nie stosuje promocji fazy głębokiej.

## Harmonogram

Po włączeniu `memory-core` automatycznie zarządza jednym zadaniem cron dla pełnego przebiegu Dreaming. Każdy przebieg uruchamia fazy w kolejności: lekka → REM → głęboka.

Przebieg obejmuje główny obszar roboczy runtime i wszystkie skonfigurowane obszary robocze agentów, zdeduplikowane według ścieżki, więc rozgałęzienie obszarów roboczych subagentów nie wyklucza `DREAMS.md` ani stanu pamięci głównego agenta.

Domyślne zachowanie kadencji:

| Ustawienie           | Domyślnie        |
| -------------------- | ---------------- |
| `dreaming.frequency` | `0 3 * * *`      |
| `dreaming.model`     | model domyślny   |

## Szybki start

<Tabs>
  <Tab title="Enable dreaming">
    ```json
    {
      "plugins": {
        "entries": {
          "memory-core": {
            "config": {
              "dreaming": {
                "enabled": true
              }
            }
          }
        }
      }
    }
    ```
  </Tab>
  <Tab title="Custom sweep cadence">
    ```json
    {
      "plugins": {
        "entries": {
          "memory-core": {
            "config": {
              "dreaming": {
                "enabled": true,
                "timezone": "America/Los_Angeles",
                "frequency": "0 */6 * * *"
              }
            }
          }
        }
      }
    }
    ```
  </Tab>
</Tabs>

## Polecenie slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on` i `/dreaming off` zmieniają konfigurację w całym Gateway. Wywołujący
z kanałów muszą być właścicielami, a klienci Gateway muszą mieć `operator.admin`.
`/dreaming status` i `/dreaming help` pozostają tylko do odczytu.

## Przepływ pracy CLI

<Tabs>
  <Tab title="Promotion preview / apply">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Ręczne `memory promote` domyślnie używa progów fazy głębokiej, chyba że zostaną nadpisane flagami CLI.

  </Tab>
  <Tab title="Explain promotion">
    Wyjaśnij, dlaczego konkretny kandydat zostałby lub nie zostałby promowany:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness preview">
    Podgląd refleksji REM, prawd kandydatów i wyniku promocji głębokiej bez zapisywania czegokolwiek:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Kluczowe wartości domyślne

Wszystkie ustawienia znajdują się pod `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Włącz lub wyłącz przebieg Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Kadencja Cron dla pełnego przebiegu Dreaming.
</ParamField>
<ParamField path="model" type="string">
  Opcjonalne nadpisanie modelu subagenta Dziennika snów. Użyj kanonicznej wartości `provider/model`, gdy ustawiasz też listę dozwolonych modeli subagenta `allowedModels`.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Maksymalna szacowana liczba tokenów zachowywana z każdego krótkoterminowego fragmentu odwołania promowanego do `MEMORY.md`. Pochodzenie rankingu pozostaje widoczne.
</ParamField>

<Warning>
`dreaming.model` wymaga `plugins.entries.memory-core.subagent.allowModelOverride: true`. Aby je ograniczyć, ustaw także `plugins.entries.memory-core.subagent.allowedModels`. Błędy zaufania lub listy dozwolonych pozostają widoczne zamiast cicho przechodzić na fallback; ponowna próba obejmuje tylko błędy niedostępności modelu.
</Warning>

<Note>
Większość polityki faz, progów i zachowań magazynu to wewnętrzne szczegóły implementacji. Pełną listę kluczy znajdziesz w [referencji konfiguracji pamięci](/pl/reference/memory-config#dreaming).
</Note>

## Interfejs Dreams

Po włączeniu karta **Dreams** w Gateway pokazuje:

- bieżący stan włączenia Dreaming
- status na poziomie faz i obecność zarządzanego przebiegu
- liczbę krótkoterminowych, ugruntowanych, sygnałowych i promowanych dzisiaj elementów
- czas następnego zaplanowanego uruchomienia
- osobną ugruntowaną ścieżkę Sceny dla etapowanych wpisów historycznego odtworzenia
- rozwijany czytnik Dziennika snów oparty na `doctor.memory.dreamDiary`

## Dreaming nigdy się nie uruchamia: status pokazuje blokadę

Jeśli `openclaw memory status` zgłasza `Dreaming status: blocked`, zarządzany cron istnieje, ale Heartbeat domyślnego agenta nie działa. Sprawdź, czy Heartbeat jest włączony dla domyślnego agenta i czy jego cel nie jest `none`, a następnie uruchom ponownie `openclaw memory status --deep` po następnym interwale Heartbeat.

## Powiązane

- [Pamięć](/pl/concepts/memory)
- [CLI pamięci](/pl/cli/memory)
- [Referencja konfiguracji pamięci](/pl/reference/memory-config)
- [Wyszukiwanie pamięci](/pl/concepts/memory-search)
