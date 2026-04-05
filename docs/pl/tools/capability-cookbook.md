---
read_when:
    - Dodawanie nowej podstawowej możliwości i powierzchni rejestracji pluginu
    - Decydowanie, czy kod należy do rdzenia, pluginu dostawcy czy pluginu funkcji
    - Podłączanie nowego pomocnika środowiska uruchomieniowego dla kanałów lub narzędzi
sidebarTitle: Adding Capabilities
summary: Przewodnik dla współtwórców dotyczący dodawania nowej współdzielonej możliwości do systemu pluginów OpenClaw
title: Dodawanie możliwości (przewodnik dla współtwórców)
x-i18n:
    generated_at: "2026-04-05T14:07:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29604d88e6df5205b835d71f3078b6223c58b6294135c3e201756c1bcac33ea3
    source_path: tools/capability-cookbook.md
    workflow: 15
---

# Dodawanie możliwości

<Info>
  To jest **przewodnik dla współtwórców** przeznaczony dla deweloperów rdzenia OpenClaw. Jeśli
  tworzysz zewnętrzny plugin, zobacz zamiast tego [Tworzenie pluginów](/plugins/building-plugins).
</Info>

Użyj tego, gdy OpenClaw potrzebuje nowej domeny, takiej jak generowanie obrazów, generowanie wideo
lub jakiegoś przyszłego obszaru funkcji wspieranego przez dostawcę.

Zasada jest następująca:

- plugin = granica własności
- capability = współdzielony kontrakt rdzenia

Oznacza to, że nie powinieneś zaczynać od podłączania dostawcy bezpośrednio do kanału lub
narzędzia. Zacznij od zdefiniowania możliwości.

## Kiedy tworzyć możliwość

Utwórz nową możliwość, gdy wszystkie poniższe warunki są spełnione:

1. więcej niż jeden dostawca może realistycznie ją zaimplementować
2. kanały, narzędzia lub pluginy funkcji powinny z niej korzystać bez uwzględniania
   dostawcy
3. rdzeń musi zarządzać zachowaniem fallback, polityką, konfiguracją lub dostarczaniem

Jeśli praca dotyczy wyłącznie dostawcy i nie istnieje jeszcze żaden współdzielony kontrakt, zatrzymaj się i najpierw zdefiniuj
kontrakt.

## Standardowa sekwencja

1. Zdefiniuj typowany kontrakt rdzenia.
2. Dodaj rejestrację pluginu dla tego kontraktu.
3. Dodaj współdzielony pomocnik środowiska uruchomieniowego.
4. Podłącz jeden rzeczywisty plugin dostawcy jako potwierdzenie.
5. Przenieś konsumentów funkcji/kanałów na pomocnik środowiska uruchomieniowego.
6. Dodaj testy kontraktów.
7. Udokumentuj konfigurację widoczną dla operatora i model własności.

## Co gdzie trafia

Rdzeń:

- typy żądań/odpowiedzi
- rejestr dostawców + rozstrzyganie
- zachowanie fallback
- schemat konfiguracji oraz propagowane metadane dokumentacji `title` / `description` w zagnieżdżonych obiektach, węzłach wildcard, elementach tablic i węzłach kompozycji
- powierzchnia pomocnika środowiska uruchomieniowego

Plugin dostawcy:

- wywołania API dostawcy
- obsługa uwierzytelniania dostawcy
- normalizacja żądań specyficzna dla dostawcy
- rejestracja implementacji możliwości

Plugin funkcji/kanału:

- wywołuje `api.runtime.*` lub pasujący pomocnik `plugin-sdk/*-runtime`
- nigdy nie wywołuje implementacji dostawcy bezpośrednio

## Lista plików do sprawdzenia

W przypadku nowej możliwości spodziewaj się zmian w następujących obszarach:

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
- jeden lub więcej dołączonych pakietów pluginów
- config/docs/tests

## Przykład: generowanie obrazów

Generowanie obrazów ma standardową strukturę:

1. rdzeń definiuje `ImageGenerationProvider`
2. rdzeń udostępnia `registerImageGenerationProvider(...)`
3. rdzeń udostępnia `runtime.imageGeneration.generate(...)`
4. pluginy `openai`, `google`, `fal` i `minimax` rejestrują implementacje wspierane przez dostawców
5. przyszli dostawcy mogą rejestrować ten sam kontrakt bez zmiany kanałów/narzędzi

Klucz konfiguracji jest oddzielony od trasowania analizy obrazu:

- `agents.defaults.imageModel` = analizowanie obrazów
- `agents.defaults.imageGenerationModel` = generowanie obrazów

Zachowaj ten podział, aby fallback i polityka pozostały jawne.

## Lista kontrolna przeglądu

Przed wdrożeniem nowej możliwości sprawdź, czy:

- żaden kanał/narzędzie nie importuje kodu dostawcy bezpośrednio
- pomocnik środowiska uruchomieniowego jest współdzieloną ścieżką
- co najmniej jeden test kontraktu potwierdza dołączoną własność
- dokumentacja konfiguracji nazywa nowy model/klucz konfiguracji
- dokumentacja pluginu wyjaśnia granicę własności

Jeśli PR pomija warstwę możliwości i na sztywno wpisuje zachowanie dostawcy w
kanał/narzędzie, odeślij go z powrotem i najpierw zdefiniuj kontrakt.
