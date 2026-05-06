---
read_when:
    - Dodawanie nowej możliwości rdzenia i powierzchni rejestracji Plugin
    - Decydowanie, czy kod należy do rdzenia, Plugin dostawcy czy Plugin funkcji
    - Podłączanie nowego pomocnika środowiska uruchomieniowego dla kanałów lub narzędzi
sidebarTitle: Adding capabilities
summary: Przewodnik dla współtwórców dotyczący dodawania nowej współdzielonej możliwości do systemu Plugin OpenClaw
title: Dodawanie możliwości (przewodnik dla współtwórców)
x-i18n:
    generated_at: "2026-05-06T09:23:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e289c95d9dc5924b5cc7b67428386660b83052b6cf6f14fc4f838fc88b7a25c
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  To jest **przewodnik dla współtwórców** przeznaczony dla głównych deweloperów OpenClaw. Jeśli
  tworzysz zewnętrzny plugin, zobacz zamiast tego [Tworzenie pluginów](/pl/plugins/building-plugins).
  Szczegółowe odniesienie architektoniczne (model możliwości, własność,
  potok ładowania, pomocniki środowiska uruchomieniowego) znajdziesz w [Wewnętrzna architektura Plugin](/pl/plugins/architecture).
</Info>

Użyj tego, gdy OpenClaw potrzebuje nowej współdzielonej domeny, takiej jak generowanie obrazów, generowanie wideo lub jakiś przyszły obszar funkcji obsługiwany przez dostawcę.

Zasada:

- **plugin** = granica własności
- **możliwość** = współdzielony kontrakt rdzenia

Nie zaczynaj od podłączania dostawcy bezpośrednio do kanału lub narzędzia. Zacznij od zdefiniowania możliwości.

## Kiedy utworzyć możliwość

Utwórz nową możliwość, gdy **wszystkie** poniższe warunki są spełnione:

1. Więcej niż jeden dostawca mógłby wiarygodnie ją zaimplementować.
2. Kanały, narzędzia lub pluginy funkcji powinny z niej korzystać bez przejmowania się dostawcą.
3. Rdzeń musi posiadać zachowanie dotyczące mechanizmu awaryjnego, zasad, konfiguracji lub dostarczania.

Jeśli praca dotyczy tylko dostawcy i nie istnieje jeszcze współdzielony kontrakt, zatrzymaj się i najpierw zdefiniuj kontrakt.

## Standardowa sekwencja

1. Zdefiniuj typowany kontrakt rdzenia.
2. Dodaj rejestrację pluginu dla tego kontraktu.
3. Dodaj współdzielony pomocnik środowiska uruchomieniowego.
4. Podłącz jeden rzeczywisty plugin dostawcy jako dowód.
5. Przenieś konsumentów funkcji/kanałów na pomocnik środowiska uruchomieniowego.
6. Dodaj testy kontraktu.
7. Udokumentuj konfigurację widoczną dla operatora i model własności.

## Co trafia gdzie

**Rdzeń:**

- Typy żądań/odpowiedzi.
- Rejestr dostawców + rozwiązywanie.
- Zachowanie mechanizmu awaryjnego.
- Schemat konfiguracji z propagowanymi metadanymi dokumentacji `title` / `description` w zagnieżdżonych obiektach, symbolach wieloznacznych, elementach tablic i węzłach kompozycji.
- Powierzchnia pomocnika środowiska uruchomieniowego.

**Plugin dostawcy:**

- Wywołania API dostawcy.
- Obsługa uwierzytelniania dostawcy.
- Normalizacja żądań specyficzna dla dostawcy.
- Rejestracja implementacji możliwości.

**Plugin funkcji/kanału:**

- Wywołuje `api.runtime.*` lub pasujący pomocnik `plugin-sdk/*-runtime`.
- Nigdy nie wywołuje bezpośrednio implementacji dostawcy.

## Granice dostawcy i uprzęży

Używaj **haków dostawcy**, gdy zachowanie należy do kontraktu dostawcy modelu, a nie do ogólnej pętli agenta. Przykłady obejmują parametry żądań specyficzne dla dostawcy po wyborze transportu, preferencje profilu uwierzytelniania, nakładki promptów i trasowanie mechanizmu awaryjnego dla kontynuacji po przełączeniu modelu/profilu.

Używaj **haków uprzęży agenta**, gdy zachowanie należy do środowiska uruchomieniowego wykonującego turę. Uprzęże mogą klasyfikować udane, ale nieużyteczne wyniki prób, takie jak puste odpowiedzi, odpowiedzi zawierające tylko rozumowanie lub odpowiedzi zawierające tylko planowanie, aby zewnętrzna polityka mechanizmu awaryjnego modelu mogła podjąć decyzję o ponownej próbie.

Utrzymuj obie granice wąsko:

- Rdzeń posiada politykę ponownych prób/mechanizmu awaryjnego.
- Pluginy dostawców posiadają wskazówki dotyczące żądań/uwierzytelniania/trasowania specyficzne dla dostawcy.
- Pluginy uprzęży posiadają klasyfikację prób specyficzną dla środowiska uruchomieniowego.
- Pluginy zewnętrzne zwracają wskazówki, a nie bezpośrednie mutacje stanu rdzenia.

## Lista kontrolna plików

Dla nowej możliwości spodziewaj się pracy w tych obszarach:

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
- Jeden lub więcej pakietów dołączonych pluginów.
- Konfiguracja, dokumentacja, testy.

## Przykład roboczy: generowanie obrazów

Generowanie obrazów ma standardowy kształt:

1. Rdzeń definiuje `ImageGenerationProvider`.
2. Rdzeń udostępnia `registerImageGenerationProvider(...)`.
3. Rdzeń udostępnia `runtime.imageGeneration.generate(...)`.
4. Pluginy `openai`, `google`, `fal` i `minimax` rejestrują implementacje oparte na dostawcach.
5. Przyszli dostawcy rejestrują ten sam kontrakt bez zmieniania kanałów/narzędzi.

Klucz konfiguracji jest celowo oddzielony od trasowania analizy wizualnej:

- `agents.defaults.imageModel` analizuje obrazy.
- `agents.defaults.imageGenerationModel` generuje obrazy.

Utrzymuj je oddzielnie, aby mechanizm awaryjny i polityka pozostały jawne.

## Lista kontrolna przeglądu

Przed wysłaniem nowej możliwości zweryfikuj:

- Żaden kanał/narzędzie nie importuje bezpośrednio kodu dostawcy.
- Pomocnik środowiska uruchomieniowego jest współdzieloną ścieżką.
- Co najmniej jeden test kontraktu sprawdza dołączoną własność.
- Dokumentacja konfiguracji nazywa nowy model/klucz konfiguracji.
- Dokumentacja Plugin wyjaśnia granicę własności.

Jeśli PR pomija warstwę możliwości i twardo koduje zachowanie dostawcy w kanale/narzędziu, odeślij go i najpierw zdefiniuj kontrakt.

## Powiązane

- [Wewnętrzna architektura Plugin](/pl/plugins/architecture) — model możliwości, własność, potok ładowania, pomocniki środowiska uruchomieniowego.
- [Tworzenie pluginów](/pl/plugins/building-plugins) — samouczek pierwszego pluginu.
- [Przegląd SDK](/pl/plugins/sdk-overview) — mapa importów i odniesienie API rejestracji.
- [Tworzenie Skills](/pl/tools/creating-skills) — pokrewna powierzchnia dla współtwórców.
