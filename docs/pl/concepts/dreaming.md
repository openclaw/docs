---
read_when:
    - Chcesz, aby promowanie pamięci uruchamiało się automatycznie
    - Chcesz zrozumieć, co robi każda faza Dreaming
    - Chcesz dostroić konsolidację bez zaśmiecania MEMORY.md
sidebarTitle: Dreaming
summary: Konsolidacja pamięci w tle z fazami lekką, głęboką i REM oraz dziennikiem Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-06-27T17:26:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 257e8095114e05f18e0ba7a6870765a6b88c80e1eedaccfa891faa231f68f01b
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming to działający w tle system konsolidacji pamięci w `memory-core`. Pomaga OpenClaw przenosić silne sygnały krótkoterminowe do trwałej pamięci, jednocześnie utrzymując proces zrozumiałym i możliwym do przeglądu.

<Note>
Dreaming jest **opcjonalny** i domyślnie wyłączony.
</Note>

## Co zapisuje Dreaming

Dreaming przechowuje dwa rodzaje danych wyjściowych:

- **Stan maszynowy** w `memory/.dreams/` (magazyn przypominania, sygnały faz, punkty kontrolne ingestii, blokady).
- **Dane czytelne dla człowieka** w `DREAMS.md` (lub istniejącym `dreams.md`) oraz opcjonalne pliki raportów faz w `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promocja długoterminowa nadal zapisuje tylko do `MEMORY.md`.

## Model faz

Dreaming używa trzech współpracujących faz:

| Faza  | Cel                                            | Trwały zapis      |
| ----- | ---------------------------------------------- | ----------------- |
| Light | Sortowanie i przygotowanie ostatnich materiałów krótkoterminowych | Nie               |
| Deep  | Ocena i promocja trwałych kandydatów           | Tak (`MEMORY.md`) |
| REM   | Refleksja nad motywami i powracającymi pomysłami | Nie               |

Te fazy są wewnętrznymi szczegółami implementacji, a nie osobnymi „trybami” konfigurowanymi przez użytkownika.

<AccordionGroup>
  <Accordion title="Light phase">
    Faza Light pobiera ostatnie dzienne sygnały pamięci i ślady przypominania, usuwa duplikaty i przygotowuje wiersze kandydatów.

    - Czyta z krótkoterminowego stanu przypominania, ostatnich dziennych plików pamięci i zredagowanych transkrypcji sesji, gdy są dostępne.
    - Zapisuje zarządzany blok `## Light Sleep`, gdy pamięć masowa obejmuje wynik wstawiany bezpośrednio.
    - Rejestruje sygnały wzmacniające do późniejszego rankingu fazy Deep.
    - Nigdy nie zapisuje do `MEMORY.md`.

  </Accordion>
  <Accordion title="Deep phase">
    Faza Deep decyduje, co staje się pamięcią długoterminową.

    - Szereguje kandydatów przy użyciu ważonej punktacji i progów.
    - Wymaga spełnienia `minScore`, `minRecallCount` i `minUniqueQueries`.
    - Odtwarza fragmenty z aktywnych plików dziennych przed zapisem, więc nieaktualne lub usunięte fragmenty są pomijane.
    - Dopisuje wypromowane wpisy do `MEMORY.md`.
    - Zapisuje podsumowanie `## Deep Sleep` w `DREAMS.md` i opcjonalnie zapisuje `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="REM phase">
    Faza REM wyodrębnia wzorce i sygnały refleksyjne.

    - Buduje podsumowania motywów i refleksji z ostatnich śladów krótkoterminowych.
    - Zapisuje zarządzany blok `## REM Sleep`, gdy pamięć masowa obejmuje wynik wstawiany bezpośrednio.
    - Rejestruje sygnały wzmacniające REM używane przez ranking fazy Deep.
    - Nigdy nie zapisuje do `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestia transkrypcji sesji

Dreaming może pobierać zredagowane transkrypcje sesji do korpusu Dreaming. Gdy transkrypcje są dostępne, trafiają do fazy Light razem z dziennymi sygnałami pamięci i śladami przypominania. Treści osobiste i wrażliwe są redagowane przed ingestacją.

## Dziennik snów

Dreaming prowadzi także narracyjny **Dziennik snów** w `DREAMS.md`. Gdy każda faza ma wystarczająco dużo materiału, `memory-core` uruchamia w tle próbny zwrot subagenta i dopisuje krótki wpis dziennika. Używa domyślnego modelu runtime, chyba że skonfigurowano `dreaming.model`. Jeśli skonfigurowany model jest niedostępny, Dziennik snów ponawia próbę raz z domyślnym modelem sesji.

<Note>
Ten dziennik jest przeznaczony do czytania przez ludzi w interfejsie snów, a nie jako źródło promocji. Artefakty dziennika i raportów wygenerowane przez Dreaming są wyłączone z promocji krótkoterminowej. Do promocji do `MEMORY.md` kwalifikują się tylko ugruntowane fragmenty pamięci.
</Note>

Istnieje także ugruntowana ścieżka historycznego uzupełniania do pracy przeglądowej i odzyskiwania:

<AccordionGroup>
  <Accordion title="Backfill commands">
    - `memory rem-harness --path ... --grounded` pokazuje podgląd ugruntowanego wyniku dziennika z historycznych notatek `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` zapisuje odwracalne, ugruntowane wpisy dziennika do `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` przygotowuje ugruntowanych trwałych kandydatów w tym samym krótkoterminowym magazynie dowodów, którego używa już normalna faza Deep.
    - `memory rem-backfill --rollback` i `--rollback-short-term` usuwają te przygotowane artefakty uzupełnienia bez dotykania zwykłych wpisów dziennika ani aktywnego krótkoterminowego przypominania.

  </Accordion>
</AccordionGroup>

Control UI udostępnia ten sam przepływ uzupełniania i resetowania dziennika, dzięki czemu możesz sprawdzić wyniki w scenie snów przed decyzją, czy ugruntowani kandydaci zasługują na promocję. Scena pokazuje także osobną ugruntowaną ścieżkę, aby było widać, które przygotowane wpisy krótkoterminowe pochodzą z historycznego odtworzenia, które wypromowane elementy były prowadzone przez ugruntowanie, oraz aby wyczyścić tylko przygotowane wpisy wyłącznie ugruntowane bez dotykania zwykłego aktywnego stanu krótkoterminowego.

## Sygnały rankingu fazy Deep

Ranking fazy Deep używa sześciu ważonych sygnałów bazowych oraz wzmocnienia faz:

| Sygnał              | Waga | Opis                                               |
| ------------------- | ---- | -------------------------------------------------- |
| Częstotliwość       | 0.24 | Ile sygnałów krótkoterminowych zgromadził wpis     |
| Trafność            | 0.30 | Średnia jakość wyszukiwania dla wpisu              |
| Różnorodność zapytań | 0.15 | Odrębne konteksty zapytań/dni, które go ujawniły   |
| Świeżość            | 0.15 | Wynik świeżości z zanikiem czasowym                |
| Konsolidacja        | 0.10 | Siła powtarzalności na przestrzeni wielu dni       |
| Bogactwo koncepcyjne | 0.06 | Gęstość tagów pojęć z fragmentu/ścieżki            |

Trafienia faz Light i REM dodają niewielkie, zanikające z czasem wzmocnienie z `memory/.dreams/phase-signals.json`.

Wyniki prób w tle mogą zostać nałożone na ten wynik bazowy jako sygnał
przeglądowy przed jakimkolwiek trwałym zapisem. Pomocna próba daje kandydatowi
niewielkie ograniczone wzmocnienie, neutralna próba pozostawia go odroczonym,
a szkodliwa próba oznacza go jako odrzuconego dla danego przebiegu punktacji.
Ten sygnał nadal ma wyłącznie charakter raportowy: może zmienić kolejność
kandydatów lub metadane przeglądu, ale sam nie zapisuje do `MEMORY.md` ani nie
promuje kandydata.

## Pokrycie raportu próby w tle w QA

QA Lab obejmuje scenariusz wyłącznie raportowy do badania, jak przyszła próba
w tle Dreaming mogłaby przejrzeć kandydata pamięci przed promocją. Scenariusz
prosi agenta o porównanie odpowiedzi bazowej z odpowiedzią, która może używać
pamięci kandydata, a następnie zapisanie lokalnego raportu z werdyktem, powodem
i flagami ryzyka.

To pokrycie jest celowo ograniczone do QA. Weryfikuje, że artefakt raportu
pozostaje oddzielony od `MEMORY.md` i że agent nie twierdzi, iż kandydat został
wypromowany. Nie dodaje produkcyjnego zachowania prób w tle ani nie zmienia
silnika promocji fazy Deep.

Runner prób w tle `memory-core` zachowuje ten sam kontrakt wyłącznie raportowy
dla ścieżek kodu, które potrzebują stabilnego artefaktu. Przyjmuje kandydata,
prompt próby, wynik bazowy, wynik kandydata, werdykt, powód, flagi ryzyka
i odwołania do dowodów, a następnie zapisuje raport z `promotion action: report-only`.
Pomocne werdykty mapują się na rekomendację `promote`, neutralne werdykty na `defer`,
a szkodliwe werdykty na `reject`; żadna z tych rekomendacji nie zapisuje do
`MEMORY.md` ani nie stosuje promocji fazy Deep.

## Harmonogram

Po włączeniu `memory-core` automatycznie zarządza jednym zadaniem cron dla pełnego przebiegu Dreaming. Każdy przebieg uruchamia fazy w kolejności: Light → REM → Deep.

Przebieg obejmuje podstawowy obszar roboczy runtime oraz wszystkie skonfigurowane obszary robocze agentów, z usunięciem duplikatów według ścieżki, dzięki czemu rozproszenie obszarów roboczych subagentów nie wyklucza `DREAMS.md` głównego agenta ani stanu pamięci.

Domyślne zachowanie kadencji:

| Ustawienie           | Domyślne        |
| -------------------- | --------------- |
| `dreaming.frequency` | `0 3 * * *`     |
| `dreaming.model`     | model domyślny  |

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

## Polecenie z ukośnikiem

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Przepływ pracy CLI

<Tabs>
  <Tab title="Promotion preview / apply">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Ręczne `memory promote` domyślnie używa progów fazy Deep, chyba że zostaną nadpisane flagami CLI.

  </Tab>
  <Tab title="Explain promotion">
    Wyjaśnij, dlaczego konkretny kandydat zostałby albo nie zostałby wypromowany:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness preview">
    Podejrzyj refleksje REM, prawdy kandydatów i wynik promocji Deep bez zapisywania czegokolwiek:

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
  Opcjonalne nadpisanie modelu subagenta Dziennika snów. Użyj kanonicznej wartości `provider/model`, gdy ustawiasz także listę dozwolonych modeli subagenta `allowedModels`.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Maksymalna szacowana liczba tokenów zachowana z każdego krótkoterminowego fragmentu przypominania promowanego do `MEMORY.md`. Pochodzenie rankingu pozostaje widoczne.
</ParamField>

<Warning>
`dreaming.model` wymaga `plugins.entries.memory-core.subagent.allowModelOverride: true`. Aby je ograniczyć, ustaw także `plugins.entries.memory-core.subagent.allowedModels`. Błędy zaufania lub listy dozwolonych modeli pozostają widoczne zamiast cicho wracać do wartości zapasowej; ponowna próba obejmuje tylko błędy niedostępności modelu.
</Warning>

<Note>
Większość zasad faz, progów i zachowań pamięci masowej to wewnętrzne szczegóły implementacji. Pełną listę kluczy znajdziesz w [referencji konfiguracji pamięci](/pl/reference/memory-config#dreaming).
</Note>

## Interfejs snów

Po włączeniu karta **Sny** w Gateway pokazuje:

- bieżący stan włączenia Dreaming
- status na poziomie faz i obecność zarządzanego przebiegu
- liczby krótkoterminowe, ugruntowane, sygnałów oraz wypromowanych dzisiaj
- czas następnego zaplanowanego uruchomienia
- osobną ugruntowaną ścieżkę sceny dla przygotowanych wpisów historycznego odtworzenia
- rozwijany czytnik Dziennika snów oparty na `doctor.memory.dreamDiary`

## Dreaming nigdy się nie uruchamia: status pokazuje blokadę

Jeśli `openclaw memory status` zgłasza `Dreaming status: blocked`, zarządzany cron istnieje, ale Heartbeat domyślnego agenta nie działa. Sprawdź, czy Heartbeat jest włączony dla domyślnego agenta i czy jego cel nie jest ustawiony na `none`, a następnie uruchom ponownie `openclaw memory status --deep` po kolejnym interwale Heartbeat.

## Powiązane

- [Pamięć](/pl/concepts/memory)
- [CLI pamięci](/pl/cli/memory)
- [Referencja konfiguracji pamięci](/pl/reference/memory-config)
- [Wyszukiwanie pamięci](/pl/concepts/memory-search)
