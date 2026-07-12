---
read_when:
    - Dodawanie nowej podstawowej funkcji i mechanizmu rejestracji pluginów
    - Określanie, czy kod powinien znaleźć się w rdzeniu, pluginie dostawcy czy pluginie funkcji
    - Podłączanie nowego pomocnika środowiska wykonawczego dla kanałów lub narzędzi
sidebarTitle: Adding capabilities
summary: Przewodnik dla współtwórców dotyczący dodawania nowej współdzielonej funkcji do systemu Pluginów OpenClaw
title: Dodawanie funkcji (przewodnik dla współtwórców)
x-i18n:
    generated_at: "2026-07-12T15:18:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3534b7521ab8183d91399cded8a3b397be46bf9bd18f2fdb88a8947bad67ffaa
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  To jest **przewodnik dla współtwórców** przeznaczony dla programistów rdzenia OpenClaw. Jeśli
  tworzysz zewnętrzny plugin, zobacz zamiast tego [Tworzenie pluginów](/pl/plugins/building-plugins).
  Szczegółowe informacje o architekturze (model możliwości, własność,
  potok ładowania, pomocnicze funkcje środowiska uruchomieniowego) znajdziesz w dokumencie [Wewnętrzna architektura pluginów](/pl/plugins/architecture).
</Info>

Skorzystaj z tego przewodnika, gdy OpenClaw potrzebuje nowej współdzielonej domeny, takiej jak osadzanie wektorowe, generowanie
obrazów, generowanie wideo lub przyszły obszar funkcjonalny obsługiwany przez dostawców.

Zasada:

- **plugin** = granica własności
- **możliwość** = współdzielony kontrakt rdzenia

Nie podłączaj dostawcy bezpośrednio do kanału ani narzędzia. Najpierw zdefiniuj możliwość.

## Kiedy utworzyć możliwość

Utwórz nową możliwość tylko wtedy, gdy **wszystkie** poniższe warunki są spełnione:

1. Więcej niż jeden dostawca mógłby ją w praktyce zaimplementować.
2. Kanały, narzędzia lub pluginy funkcjonalne powinny móc z niej korzystać bez znajomości dostawcy.
3. Rdzeń musi odpowiadać za zachowanie mechanizmu rezerwowego, zasady, konfigurację lub dostarczanie.

Jeśli praca dotyczy wyłącznie dostawcy i nie istnieje jeszcze współdzielony kontrakt, najpierw zdefiniuj kontrakt.

## Standardowa kolejność

1. Zdefiniuj typowany kontrakt rdzenia.
2. Dodaj rejestrację pluginu dla tego kontraktu.
3. Dodaj współdzieloną pomocniczą funkcję środowiska uruchomieniowego.
4. Podłącz jeden rzeczywisty plugin dostawcy jako implementację referencyjną.
5. Przenieś korzystające z niego funkcje i kanały na pomocniczą funkcję środowiska uruchomieniowego.
6. Dodaj testy kontraktu.
7. Udokumentuj konfigurację przeznaczoną dla operatora i model własności.

## Podział odpowiedzialności

| Warstwa                    | Odpowiada za                                                                                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rdzeń**                  | Typy żądań i odpowiedzi; rejestr i rozpoznawanie dostawców; zachowanie mechanizmu rezerwowego; schemat konfiguracji z propagowanymi metadanymi dokumentacji `title`/`description` w zagnieżdżonych obiektach, symbolach wieloznacznych, elementach tablic i węzłach kompozycji; interfejs pomocniczych funkcji środowiska uruchomieniowego. |
| **Plugin dostawcy**        | Wywołania API dostawcy, obsługa uwierzytelniania dostawcy, normalizacja żądań właściwa dla dostawcy oraz rejestracja implementacji możliwości.                                                                                          |
| **Plugin funkcji/kanału**  | Wywołuje `api.runtime.*` lub odpowiednią funkcję pomocniczą `plugin-sdk/*-runtime`. Nigdy nie wywołuje bezpośrednio implementacji dostawcy.                                                                                            |

## Punkty integracji dostawcy i środowiska wykonawczego agenta

Używaj **haków dostawcy**, gdy zachowanie należy do kontraktu dostawcy modelu, a nie do ogólnej pętli agenta. Przykłady obejmują parametry żądań właściwe dla dostawcy po wyborze transportu, preferencje profilu uwierzytelniania, nakładki na prompty oraz rezerwowe trasowanie kolejnych prób po przełączeniu modelu lub profilu.

Używaj **haków środowiska wykonawczego agenta**, gdy zachowanie należy do środowiska uruchomieniowego wykonującego turę. Środowiska wykonawcze mogą klasyfikować jawne wyniki protokołu, takie jak pusty wynik, rozumowanie bez widocznego wyniku lub ustrukturyzowany plan bez końcowej odpowiedzi, aby zewnętrzne zasady przełączania modelu mogły podjąć decyzję o ponowieniu próby.

Oba punkty integracji powinny pozostać wąskie:

- Rdzeń odpowiada za zasady ponawiania prób i mechanizmu rezerwowego.
- Pluginy dostawców odpowiadają za wskazówki dotyczące żądań, uwierzytelniania i trasowania właściwe dla dostawcy.
- Pluginy środowisk wykonawczych odpowiadają za klasyfikację prób właściwą dla środowiska uruchomieniowego.
- Pluginy innych firm zwracają wskazówki, a nie bezpośrednie modyfikacje stanu rdzenia.

## Lista kontrolna plików

W przypadku nowej możliwości należy spodziewać się zmian w następujących obszarach:

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
- Co najmniej jeden dołączony pakiet pluginu.
- Konfiguracja, dokumentacja i testy.

## Przykład: generowanie obrazów

Generowanie obrazów korzysta ze standardowego schematu:

1. Rdzeń definiuje `ImageGenerationProvider`.
2. Rdzeń udostępnia `registerImageGenerationProvider(...)`.
3. Rdzeń udostępnia `api.runtime.imageGeneration.generate(...)` i `.listProviders(...)`.
4. Pluginy dostawców (`comfy`, `deepinfra`, `fal`, `google`, `litellm`, `microsoft-foundry`, `minimax`, `openai`, `openrouter`, `vydra`, `xai`) rejestrują implementacje obsługiwane przez dostawców.
5. Przyszli dostawcy rejestrują ten sam kontrakt bez zmieniania kanałów ani narzędzi.

Klucz konfiguracji jest celowo oddzielony od trasowania analizy obrazu:

- `agents.defaults.imageModel` analizuje obrazy.
- `agents.defaults.imageGenerationModel` generuje obrazy.

Zachowaj ich rozdzielenie, aby mechanizm rezerwowy i zasady pozostały jawne.

## Dostawcy osadzania wektorowego

Używaj `registerEmbeddingProvider(...)` / kontraktu `embeddingProviders` dla
wielokrotnego użytku dostawców osadzania wektorowego. Ten kontrakt jest celowo szerszy
niż pamięć: narzędzia, wyszukiwanie, pobieranie informacji, importery lub przyszłe pluginy funkcjonalne
mogą korzystać z osadzania wektorowego bez zależności od silnika pamięci. Wyszukiwanie w pamięci
również korzysta z ogólnych `embeddingProviders`.

Starszy interfejs API rejestracji przeznaczony dla pamięci oraz kontrakt `memoryEmbeddingProviders`
są przestarzałe. Używaj `registerEmbeddingProvider` i
`embeddingProviders` dla wszystkich nowych dostawców osadzania wektorowego.

## Lista kontrolna przeglądu

Przed wydaniem nowej możliwości sprawdź:

- Żaden kanał ani narzędzie nie importuje bezpośrednio kodu dostawcy.
- Pomocnicza funkcja środowiska uruchomieniowego stanowi współdzieloną ścieżkę.
- Co najmniej jeden test kontraktu potwierdza własność dołączonego pluginu.
- Dokumentacja konfiguracji wymienia nowy model lub klucz konfiguracji.
- Dokumentacja pluginu wyjaśnia granicę własności.

Jeśli PR pomija warstwę możliwości i umieszcza na stałe zachowanie dostawcy w kanale lub narzędziu, odeślij go do poprawy i najpierw zdefiniuj kontrakt.

## Powiązane materiały

- [Wewnętrzna architektura pluginów](/pl/plugins/architecture) — model możliwości, własność, potok ładowania i pomocnicze funkcje środowiska uruchomieniowego.
- [Tworzenie pluginów](/pl/plugins/building-plugins) — samouczek tworzenia pierwszego pluginu.
- [Omówienie SDK](/pl/plugins/sdk-overview) — mapa importów i dokumentacja interfejsu API rejestracji.
- [Tworzenie Skills](/pl/tools/creating-skills) — uzupełniający obszar dla współtwórców.
