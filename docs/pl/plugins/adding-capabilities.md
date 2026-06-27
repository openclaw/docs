---
read_when:
    - Dodawanie nowej podstawowej funkcji i powierzchni rejestracji Plugin
    - Decydowanie, czy kod należy do core, pluginu dostawcy czy pluginu funkcji
    - Łączenie nowego pomocnika środowiska uruchomieniowego dla kanałów lub narzędzi
sidebarTitle: Adding capabilities
summary: Przewodnik dla współautorów dotyczący dodawania nowej współdzielonej możliwości do systemu Plugin w OpenClaw
title: Dodawanie możliwości (przewodnik dla kontrybutorów)
x-i18n:
    generated_at: "2026-06-27T17:48:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8a25122a7b76ff5bbb7616748d5fad2397502f9accb5428134a75d65e872034
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  To jest **przewodnik dla kontrybutorów** dla deweloperów rdzenia OpenClaw. Jeśli
  tworzysz zewnętrzny plugin, zobacz zamiast tego [Tworzenie pluginów](/pl/plugins/building-plugins).
  Głęboką dokumentację architektury (model możliwości, własność,
  potok ładowania, pomocniki runtime) znajdziesz w [Wewnętrznych mechanizmach Pluginów](/pl/plugins/architecture).
</Info>

Użyj tego, gdy OpenClaw potrzebuje nowej współdzielonej domeny, takiej jak embeddingi, generowanie
obrazów, generowanie wideo albo jakiś przyszły obszar funkcji wspierany przez dostawcę.

Zasada:

- **plugin** = granica własności
- **możliwość** = współdzielony kontrakt rdzenia

Nie zaczynaj od bezpośredniego podpinania dostawcy do kanału albo narzędzia. Zacznij od zdefiniowania możliwości.

## Kiedy utworzyć możliwość

Utwórz nową możliwość, gdy **wszystkie** poniższe warunki są prawdziwe:

1. Więcej niż jeden dostawca mógłby wiarygodnie ją zaimplementować.
2. Kanały, narzędzia albo pluginy funkcji powinny móc z niej korzystać bez przejmowania się dostawcą.
3. Rdzeń musi posiadać zachowanie awaryjnego przełączania, polityki, konfiguracji albo dostarczania.

Jeśli praca dotyczy wyłącznie dostawcy i nie istnieje jeszcze współdzielony kontrakt, zatrzymaj się i najpierw zdefiniuj kontrakt.

## Standardowa sekwencja

1. Zdefiniuj typowany kontrakt rdzenia.
2. Dodaj rejestrację pluginu dla tego kontraktu.
3. Dodaj współdzielony pomocnik runtime.
4. Podłącz jeden rzeczywisty plugin dostawcy jako dowód.
5. Przenieś konsumentów funkcji/kanałów na pomocnik runtime.
6. Dodaj testy kontraktu.
7. Udokumentuj konfigurację widoczną dla operatora i model własności.

## Co trafia gdzie

**Rdzeń:**

- Typy żądań/odpowiedzi.
- Rejestr dostawców + rozwiązywanie.
- Zachowanie awaryjnego przełączania.
- Schemat konfiguracji z propagowanymi metadanymi dokumentacji `title` / `description` w węzłach obiektów zagnieżdżonych, wieloznacznych, elementów tablic i kompozycji.
- Powierzchnia pomocnika runtime.

**Plugin dostawcy:**

- Wywołania API dostawcy.
- Obsługa uwierzytelniania dostawcy.
- Normalizacja żądań specyficzna dla dostawcy.
- Rejestracja implementacji możliwości.

**Plugin funkcji/kanału:**

- Wywołuje `api.runtime.*` albo pasujący pomocnik `plugin-sdk/*-runtime`.
- Nigdy nie wywołuje bezpośrednio implementacji dostawcy.

## Punkty rozszerzeń dostawcy i harnessa

Używaj **haków dostawcy**, gdy zachowanie należy do kontraktu dostawcy modelu, a nie do ogólnej pętli agenta. Przykłady obejmują parametry żądań specyficzne dla dostawcy po wyborze transportu, preferencję profilu uwierzytelniania, nakładki promptów i routing awaryjny kolejnej próby po awarii modelu/profilu.

Używaj **haków harnessa agenta**, gdy zachowanie należy do runtime wykonującego turę. Harnessy mogą klasyfikować jawne wyniki protokołu, takie jak pusty wynik, rozumowanie bez widocznego wyniku albo ustrukturyzowany plan bez ostatecznej odpowiedzi, aby zewnętrzna polityka awaryjnego przełączania modelu mogła podjąć decyzję o ponowieniu próby.

Utrzymuj oba punkty rozszerzeń wąskie:

- Rdzeń posiada politykę ponawiania/awaryjnego przełączania.
- Pluginy dostawców posiadają wskazówki specyficzne dla dostawcy dotyczące żądań/uwierzytelniania/routingu.
- Pluginy harnessów posiadają klasyfikację prób specyficzną dla runtime.
- Pluginy firm trzecich zwracają wskazówki, a nie bezpośrednie mutacje stanu rdzenia.

## Lista kontrolna plików

Dla nowej możliwości spodziewaj się dotknąć tych obszarów:

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
- Jeden albo więcej pakietów bundlowanych pluginów.
- Konfiguracja, dokumentacja, testy.

## Przykład: generowanie obrazów

Generowanie obrazów ma standardowy kształt:

1. Rdzeń definiuje `ImageGenerationProvider`.
2. Rdzeń udostępnia `registerImageGenerationProvider(...)`.
3. Rdzeń udostępnia `runtime.imageGeneration.generate(...)`.
4. Pluginy `openai`, `google`, `fal` i `minimax` rejestrują implementacje wspierane przez dostawców.
5. Przyszli dostawcy rejestrują ten sam kontrakt bez zmieniania kanałów/narzędzi.

Klucz konfiguracji jest celowo oddzielony od routingu analizy wizji:

- `agents.defaults.imageModel` analizuje obrazy.
- `agents.defaults.imageGenerationModel` generuje obrazy.

Utrzymuj je oddzielnie, aby awaryjne przełączanie i polityka pozostały jawne.

## Dostawcy embeddingów

Używaj `embeddingProviders` dla dostawców embeddingów wektorowych wielokrotnego użytku. Ten kontrakt
jest celowo szerszy niż pamięć: narzędzia, wyszukiwanie, pobieranie, importery albo
przyszłe pluginy funkcji mogą korzystać z embeddingów bez zależności od silnika
pamięci.

Wyszukiwanie w pamięci może korzystać z ogólnych `embeddingProviders`. Starszy
kontrakt `memoryEmbeddingProviders` jest przestarzałą kompatybilnością, podczas gdy istniejący
dostawcy specyficzni dla pamięci migrują; nowi dostawcy embeddingów wielokrotnego użytku powinni używać
`embeddingProviders`.

## Lista kontrolna przeglądu

Przed wysłaniem nowej możliwości zweryfikuj:

- Żaden kanał/narzędzie nie importuje bezpośrednio kodu dostawcy.
- Pomocnik runtime jest współdzieloną ścieżką.
- Co najmniej jeden test kontraktu potwierdza bundlowaną własność.
- Dokumentacja konfiguracji nazywa nowy model/klucz konfiguracji.
- Dokumentacja pluginu wyjaśnia granicę własności.

Jeśli PR pomija warstwę możliwości i koduje zachowanie dostawcy na stałe w kanale/narzędziu, odeślij go i najpierw zdefiniuj kontrakt.

## Powiązane

- [Wewnętrzne mechanizmy Pluginów](/pl/plugins/architecture) — model możliwości, własność, potok ładowania, pomocniki runtime.
- [Tworzenie pluginów](/pl/plugins/building-plugins) — samouczek pierwszego pluginu.
- [Przegląd SDK](/pl/plugins/sdk-overview) — mapa importów i dokumentacja API rejestracji.
- [Tworzenie Skills](/pl/tools/creating-skills) — towarzysząca powierzchnia kontrybutora.
