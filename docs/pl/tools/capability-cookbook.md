---
read_when:
    - Dodawanie nowej podstawowej możliwości i powierzchni rejestracji Pluginów
    - Decydowanie, czy kod należy do rdzenia, Pluginu dostawcy czy Pluginu funkcjonalnego
    - Podłączanie nowego pomocnika środowiska uruchomieniowego dla kanałów lub narzędzi
sidebarTitle: Adding Capabilities
summary: Przewodnik dla współtwórców dotyczący dodawania nowej współdzielonej możliwości do systemu Pluginów OpenClaw
title: Dodawanie możliwości (przewodnik dla współtwórców)
x-i18n:
    generated_at: "2026-04-24T09:35:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 864506dd3f61aa64e7c997c9d9e05ce0ad70c80a26a734d4f83b2e80331be4ab
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  To jest **przewodnik dla współtwórców** przeznaczony dla deweloperów rdzenia OpenClaw. Jeśli tworzysz
  zewnętrzny Plugin, zobacz zamiast tego [Budowanie Pluginów](/pl/plugins/building-plugins).
</Info>

Użyj tego, gdy OpenClaw potrzebuje nowej domeny, takiej jak generowanie obrazów, generowanie wideo
lub jakiegoś przyszłego obszaru funkcji wspieranego przez dostawcę.

Zasada:

- plugin = granica odpowiedzialności
- capability = współdzielony kontrakt rdzenia

Oznacza to, że nie należy zaczynać od podłączania dostawcy bezpośrednio do kanału lub
narzędzia. Zacznij od zdefiniowania możliwości.

## Kiedy utworzyć możliwość

Utwórz nową możliwość, gdy wszystkie poniższe warunki są spełnione:

1. więcej niż jeden dostawca może realnie ją zaimplementować
2. kanały, narzędzia lub Pluginy funkcjonalne powinny korzystać z niej bez przejmowania się
   dostawcą
3. rdzeń musi zarządzać fallbackiem, polityką, konfiguracją lub zachowaniem dostarczania

Jeśli praca dotyczy wyłącznie dostawcy i nie istnieje jeszcze żaden współdzielony kontrakt, zatrzymaj się i najpierw zdefiniuj
kontrakt.

## Standardowa sekwencja

1. Zdefiniuj typowany kontrakt rdzenia.
2. Dodaj rejestrację Pluginów dla tego kontraktu.
3. Dodaj współdzielony pomocnik środowiska uruchomieniowego.
4. Podłącz jeden rzeczywisty Plugin dostawcy jako dowód.
5. Przenieś konsumentów funkcji/kanałów na pomocnik środowiska uruchomieniowego.
6. Dodaj testy kontraktu.
7. Udokumentuj konfigurację widoczną dla operatora oraz model odpowiedzialności.

## Co gdzie trafia

Rdzeń:

- typy żądania/odpowiedzi
- rejestr dostawców + rozwiązywanie
- zachowanie fallbacku
- schemat konfiguracji oraz propagowane metadane dokumentacji `title` / `description` na zagnieżdżonych obiektach, wildcardach, elementach tablic i węzłach złożeń
- powierzchnia pomocnika środowiska uruchomieniowego

Plugin dostawcy:

- wywołania API dostawcy
- obsługa uwierzytelniania dostawcy
- normalizacja żądań specyficzna dla dostawcy
- rejestracja implementacji możliwości

Plugin funkcjonalny/kanału:

- wywołuje `api.runtime.*` lub odpowiadający mu helper `plugin-sdk/*-runtime`
- nigdy nie wywołuje implementacji dostawcy bezpośrednio

## Rozszerzenia dostawcy i Harness

Używaj hooków dostawcy, gdy dane zachowanie należy do kontraktu dostawcy modelu,
a nie do ogólnej pętli agenta. Przykłady obejmują parametry żądań specyficzne dla dostawcy po wyborze transportu, preferencję profilu uwierzytelniania, nakładki promptów oraz routing fallbacku kolejnych prób po przełączeniu awaryjnym modelu/profilu.

Używaj hooków harnessu agenta, gdy dane zachowanie należy do środowiska uruchomieniowego
wykonującego turę. Harnessy mogą klasyfikować wyniki prób zakończonych sukcesem, ale bezużytecznych,
takie jak odpowiedzi puste, zawierające wyłącznie rozumowanie albo wyłącznie planowanie, aby zewnętrzna polityka fallbacku modelu mogła podjąć decyzję o ponowieniu.

Obie powierzchnie rozszerzeń powinny pozostać wąskie:

- rdzeń zarządza polityką ponowień/fallbacku
- Pluginy dostawców zarządzają wskazówkami dotyczącymi żądań/uwierzytelniania/routingu specyficznymi dla dostawcy
- Pluginy harness zarządzają klasyfikacją prób specyficzną dla środowiska uruchomieniowego
- Pluginy zewnętrzne zwracają wskazówki, a nie bezpośrednie mutacje stanu rdzenia

## Lista plików do sprawdzenia

W przypadku nowej możliwości można się spodziewać zmian w tych obszarach:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- jeden lub więcej dołączonych pakietów Pluginów
- konfiguracja/dokumentacja/testy

## Przykład: generowanie obrazów

Generowanie obrazów ma standardowy kształt:

1. rdzeń definiuje `ImageGenerationProvider`
2. rdzeń udostępnia `registerImageGenerationProvider(...)`
3. rdzeń udostępnia `runtime.imageGeneration.generate(...)`
4. Pluginy `openai`, `google`, `fal` i `minimax` rejestrują implementacje wspierane przez dostawców
5. przyszli dostawcy mogą rejestrować ten sam kontrakt bez zmiany kanałów/narzędzi

Klucz konfiguracji jest oddzielony od routingu analizy obrazu:

- `agents.defaults.imageModel` = analizowanie obrazów
- `agents.defaults.imageGenerationModel` = generowanie obrazów

Zachowaj ich rozdzielenie, aby fallback i polityka pozostały jawne.

## Lista kontrolna przeglądu

Przed wydaniem nowej możliwości sprawdź:

- żaden kanał/narzędzie nie importuje bezpośrednio kodu dostawcy
- helper środowiska uruchomieniowego jest współdzieloną ścieżką
- co najmniej jeden test kontraktu potwierdza odpowiedzialność pakietów dołączonych
- dokumentacja konfiguracji nazywa nowy model/klucz konfiguracji
- dokumentacja Pluginów wyjaśnia granicę odpowiedzialności

Jeśli PR pomija warstwę możliwości i koduje na sztywno zachowanie dostawcy w
kanale/narzędziu, odeślij go z powrotem i najpierw zdefiniuj kontrakt.

## Powiązane

- [Plugin](/pl/tools/plugin)
- [Tworzenie Skills](/pl/tools/creating-skills)
- [Narzędzia i Pluginy](/pl/tools)
