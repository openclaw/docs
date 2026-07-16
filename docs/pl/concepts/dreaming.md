---
read_when:
    - Automatyczne uruchamianie promowania pamięci
    - Chcesz zrozumieć, co robi każda faza Dreaming
    - Chcesz dostroić konsolidację bez zaśmiecania pliku MEMORY.md
sidebarTitle: Dreaming
summary: Konsolidacja pamięci w tle z fazami lekką, głęboką i REM oraz dziennikiem snów
title: Dreaming
x-i18n:
    generated_at: "2026-07-16T18:18:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 501ab42cfdfa0216c308896aa8c1719b06b49d64a62afdb004e097102a376eac
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming to działający w tle system konsolidacji pamięci w `memory-core`. Przenosi silne sygnały krótkoterminowe do trwałej pamięci, zachowując przejrzystość procesu i możliwość jego przeglądu.

<Note>
Dreaming jest funkcją **opcjonalną** i domyślnie wyłączoną.
</Note>

## Co zapisuje Dreaming

- **Stan maszyny** w `memory/.dreams/` (magazyn przywołań, sygnały faz, punkty kontrolne pozyskiwania danych, blokady).
- **Dane wyjściowe czytelne dla człowieka** w `DREAMS.md` (lub istniejącym `dreams.md`) oraz opcjonalne pliki raportów faz w `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Długoterminowa promocja nadal zapisuje dane wyłącznie do `MEMORY.md`.

## Model faz

Dreaming wykonuje podczas każdego przebiegu trzy współdziałające fazy w następującej kolejności: lekka -> REM -> głęboka. Są to wewnętrzne fazy implementacji, a nie osobne tryby konfigurowane przez użytkownika.

| Faza    | Cel                                               | Trwały zapis      |
| ------- | ------------------------------------------------- | ----------------- |
| Lekka   | Sortowanie i przygotowanie najnowszych materiałów krótkoterminowych | Nie               |
| REM     | Refleksja nad motywami i powtarzającymi się ideami | Nie               |
| Głęboka | Ocena i promocja kandydatów do trwałej pamięci    | Tak (`MEMORY.md`) |

<AccordionGroup>
  <Accordion title="Faza lekka">
    - Odczytuje najnowszy stan krótkoterminowych przywołań, dzienne pliki pamięci oraz zredagowane transkrypcje sesji, jeśli są dostępne.
    - Usuwa zduplikowane sygnały i przygotowuje wiersze kandydatów.
    - Zapisuje zarządzany blok `## Light Sleep`, gdy magazyn obejmuje dane wyjściowe wbudowane w treść.
    - Rejestruje sygnały wzmacniające na potrzeby późniejszego rankingu w fazie głębokiej.
    - Nigdy nie zapisuje do `MEMORY.md`.

  </Accordion>
  <Accordion title="Faza REM">
    - Tworzy podsumowania motywów i refleksji na podstawie najnowszych śladów krótkoterminowych.
    - Zapisuje zarządzany blok `## REM Sleep`, gdy magazyn obejmuje dane wyjściowe wbudowane w treść.
    - Rejestruje sygnały wzmacniające REM używane przez ranking w fazie głębokiej.
    - Nigdy nie zapisuje do `MEMORY.md`.

  </Accordion>
  <Accordion title="Faza głęboka">
    - Klasyfikuje kandydatów za pomocą ważonej oceny i progów (`minScore`, `minRecallCount` oraz `minUniqueQueries` muszą zostać spełnione).
    - Przed zapisem ponownie pobiera fragmenty z aktywnych plików dziennych, dzięki czemu pomija nieaktualne lub usunięte fragmenty.
    - Dodaje promowane wpisy do `MEMORY.md`.
    - Zapisuje podsumowanie `## Deep Sleep` w `DREAMS.md` i opcjonalnie w `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
</AccordionGroup>

## Pozyskiwanie transkrypcji sesji

Dreaming może pozyskiwać zredagowane transkrypcje sesji do korpusu Dreaming. Gdy są dostępne, transkrypcje zasilają fazę lekką wraz z dziennymi sygnałami pamięci i śladami przywołań. Treści osobiste i wrażliwe są redagowane przed pozyskaniem.

## Dziennik snów

Dreaming prowadzi narracyjny **Dziennik snów** w `DREAMS.md`. Gdy każda faza zgromadzi wystarczającą ilość materiału, `memory-core` uruchamia w tle, w miarę możliwości, turę subagenta i dodaje krótki wpis do dziennika, korzystając z domyślnego modelu środowiska uruchomieniowego, chyba że skonfigurowano `dreaming.model`. Jeśli skonfigurowany model jest niedostępny, uruchomienie dziennika jest ponawiane raz z domyślnym modelem sesji; błędy zaufania lub listy dozwolonych elementów nie są ponawiane i pozostają widoczne w dziennikach zamiast powodować ciche przełączenie na ogólny wpis dziennika.

<Note>
Dziennik służy do odczytu przez człowieka w interfejsie snów, a nie jako źródło promocji. Artefakty dziennika i raportów są wykluczone z krótkoterminowej promocji; do promocji do `MEMORY.md` kwalifikują się wyłącznie fragmenty pamięci oparte na źródłach.
</Note>

Dostępny jest również oparty na źródłach proces historycznego uzupełniania danych na potrzeby przeglądu i odzyskiwania:

<AccordionGroup>
  <Accordion title="Polecenia uzupełniania danych">
    - `memory rem-harness --path ... --grounded` wyświetla podgląd opartych na źródłach danych wyjściowych dziennika z historycznych notatek `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` zapisuje odwracalne, oparte na źródłach wpisy dziennika w `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` przygotowuje opartych na źródłach kandydatów do trwałej pamięci w tym samym magazynie krótkoterminowych dowodów, którego używa zwykła faza głęboka.
    - `memory rem-backfill --rollback` oraz `--rollback-short-term` usuwają przygotowane artefakty uzupełniania danych bez modyfikowania zwykłych wpisów dziennika ani aktywnych krótkoterminowych przywołań.

  </Accordion>
</AccordionGroup>

Interfejs sterowania udostępnia ten sam proces uzupełniania i resetowania dziennika na karcie Pamięć agenta (strona Agenci), co pozwala sprawdzić wyniki w scenie snu przed podjęciem decyzji, czy kandydaci opierający się na źródłach zasługują na promocję. Osobna, oparta na źródłach ścieżka Sceny pokazuje, które przygotowane wpisy krótkoterminowe pochodzą z odtwarzania danych historycznych i które promowane elementy zostały wybrane przede wszystkim na podstawie źródeł, oraz umożliwia usunięcie wyłącznie przygotowanych wpisów opartych tylko na źródłach bez modyfikowania aktywnego stanu krótkoterminowego.

## Sygnały rankingu głębokiego

Ranking głęboki wykorzystuje sześć ważonych sygnałów bazowych oraz wzmocnienie faz:

| Sygnał                | Waga | Opis                                                      |
| --------------------- | ---- | --------------------------------------------------------- |
| Trafność              | 0.30 | Średnia jakość wyszukiwania wpisu                          |
| Częstotliwość         | 0.24 | Liczba krótkoterminowych sygnałów zgromadzonych przez wpis |
| Różnorodność zapytań  | 0.15 | Odrębne konteksty zapytań lub dni, w których się pojawił   |
| Aktualność            | 0.15 | Wynik aktualności malejący wraz z upływem czasu            |
| Konsolidacja          | 0.10 | Siła powtarzalności w wielu dniach                         |
| Bogactwo pojęciowe    | 0.06 | Zagęszczenie znaczników pojęć we fragmencie lub ścieżce    |

Trafienia w fazach lekkiej i REM dodają niewielkie wzmocnienie z `memory/.dreams/phase-signals.json`, malejące wraz z upływem czasu.

Wyniki prób w tle mogą zostać nałożone na wynik bazowy jako sygnał do przeglądu przed wykonaniem jakiegokolwiek trwałego zapisu: pomocna próba zapewnia kandydatowi niewielkie, ograniczone wzmocnienie, neutralna próba pozostawia go odroczonym, a szkodliwa próba oznacza go jako odrzuconego w danym przebiegu oceny. Ten sygnał jest używany wyłącznie w raportach — może zmieniać kolejność kandydatów lub metadane przeglądu, ale nigdy nie zapisuje do `MEMORY.md` ani samodzielnie nie promuje kandydata.

### Zakres raportów prób w tle w QA

QA Lab zawiera scenariusz służący wyłącznie do raportowania, który pozwala zbadać, jak przyszła próba Dreaming w tle mogłaby ocenić kandydata pamięci przed promocją: agent porównuje odpowiedź bazową z odpowiedzią mogącą korzystać z pamięci kandydata, a następnie zapisuje lokalny raport zawierający werdykt, uzasadnienie i flagi ryzyka. Ten zakres jest ograniczony do QA — sprawdza, czy artefakt raportu pozostaje oddzielony od `MEMORY.md` oraz czy agent nigdy nie twierdzi, że kandydat został promowany. Nie dodaje produkcyjnego działania prób w tle ani nie zmienia mechanizmu promocji fazy głębokiej.

Program uruchamiający próby w tle `memory-core` zachowuje tę samą umowę wyłącznie raportową dla ścieżek kodu wymagających stabilnego artefaktu. Przyjmuje kandydata, prompt próby, wynik bazowy, wynik kandydata, werdykt, uzasadnienie, flagi ryzyka i odwołania do dowodów, a następnie zapisuje raport za pomocą `promotion action: report-only`. Pomocne werdykty są mapowane na rekomendację `promote`, neutralne werdykty na `defer`, a szkodliwe werdykty na `reject` — żadna z tych operacji nie zapisuje do `MEMORY.md` ani nie stosuje promocji fazy głębokiej.

## Harmonogram

Po włączeniu `memory-core` automatycznie zarządza jednym zadaniem Cron dla pełnego przebiegu Dreaming, usuwając duplikaty między głównym obszarem roboczym środowiska uruchomieniowego a wszystkimi skonfigurowanymi obszarami roboczymi agentów, aby rozdzielanie obszarów roboczych subagentów nie wykluczało `DREAMS.md` ani stanu pamięci głównego agenta.

| Ustawienie             | Wartość domyślna |
| ---------------------- | ---------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | model domyślny   |

## Szybki start

<Tabs>
  <Tab title="Włącz Dreaming">
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
  <Tab title="Niestandardowa częstotliwość przebiegów">
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

```text
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on` oraz `/dreaming off` wymagają statusu właściciela w przypadku wywołań z kanału lub `operator.admin` w przypadku klientów Gateway. `/dreaming status` oraz `/dreaming help` są tylko do odczytu.

## Przepływ pracy CLI

<Tabs>
  <Tab title="Podgląd lub zastosowanie promocji">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Ręczne `memory promote` domyślnie używa progów fazy głębokiej, chyba że zostaną one zastąpione flagami CLI.

  </Tab>
  <Tab title="Wyjaśnienie promocji">
    Wyjaśnia, dlaczego określony kandydat zostałby lub nie zostałby promowany:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Podgląd środowiska testowego REM">
    Wyświetla podgląd refleksji REM, prawd kandydatów i wyników głębokiej promocji bez zapisywania czegokolwiek:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Najważniejsze wartości domyślne

Wszystkie ustawienia znajdują się w `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Włącza lub wyłącza przebieg Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Częstotliwość Cron pełnego przebiegu Dreaming.
</ParamField>
<ParamField path="model" type="string">
  Opcjonalne zastąpienie modelu subagenta Dziennika snów. Przy jednoczesnym ustawianiu listy dozwolonych elementów subagenta `allowedModels` należy użyć kanonicznej wartości `provider/model`.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Maksymalna szacowana liczba tokenów zachowywana z każdego fragmentu krótkoterminowego przywołania promowanego do `MEMORY.md`. Pochodzenie rankingu pozostaje widoczne.
</ParamField>

<Warning>
`dreaming.model` wymaga `plugins.entries.memory-core.subagent.allowModelOverride: true`. Aby ograniczyć tę funkcję, należy również ustawić `plugins.entries.memory-core.subagent.allowedModels`. Automatyczne ponowienie obejmuje wyłącznie błędy niedostępności modelu; błędy zaufania lub listy dozwolonych elementów pozostają widoczne w dziennikach zamiast powodować ciche przełączenie.
</Warning>

<Note>
Większość zasad faz, progów i zachowań magazynu stanowi wewnętrzne szczegóły implementacji. Pełną listę kluczy zawiera [dokumentacja konfiguracji pamięci](/pl/reference/memory-config#dreaming).
</Note>

## Interfejs snów

Po włączeniu karta **Sny** w Gateway pokazuje:

- bieżący stan włączenia Dreaming
- stan poszczególnych faz i obecność zarządzanego przebiegu
- liczbę elementów krótkoterminowych, opartych na źródłach, sygnałów i promowanych dzisiaj
- czas następnego zaplanowanego uruchomienia
- osobną, opartą na źródłach ścieżkę Sceny dla przygotowanych wpisów odtwarzania historycznego
- rozwijany czytnik Dziennika snów oparty na `doctor.memory.dreamDiary`

## Powiązane materiały

- [Pamięć](/pl/concepts/memory)
- [CLI pamięci](/pl/cli/memory)
- [Dokumentacja konfiguracji pamięci](/pl/reference/memory-config)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
