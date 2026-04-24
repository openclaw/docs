---
read_when:
    - Widzisz klucz konfiguracji `.experimental` i chcesz wiedzieć, czy jest stabilny
    - Chcesz wypróbować funkcje podglądowe środowiska wykonawczego, nie myląc ich ze zwykłymi ustawieniami domyślnymi
    - Chcesz mieć jedno miejsce, w którym znajdziesz obecnie udokumentowane flagi eksperymentalne
summary: Co oznaczają flagi eksperymentalne w OpenClaw i które z nich są obecnie udokumentowane
title: Funkcje eksperymentalne
x-i18n:
    generated_at: "2026-04-24T09:05:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a97e8efa180844e1ca94495d626956847a15a15bba0846aaf54ff9c918cda02
    source_path: concepts/experimental-features.md
    workflow: 15
---

Funkcje eksperymentalne w OpenClaw to **powierzchnie podglądowe wymagające świadomego włączenia**. Są
ukryte za jawnymi flagami, ponieważ nadal potrzebują sprawdzenia w praktyce, zanim
zasłużą na stabilne ustawienie domyślne lub długowieczny publiczny kontrakt.

Traktuj je inaczej niż zwykłą konfigurację:

- Pozostawiaj je **wyłączone domyślnie**, chyba że powiązana dokumentacja zaleca wypróbowanie danej flagi.
- Oczekuj, że ich **kształt i zachowanie będą się zmieniać** szybciej niż stabilna konfiguracja.
- Najpierw preferuj ścieżkę stabilną, jeśli już istnieje.
- Jeśli wdrażasz OpenClaw szeroko, przetestuj flagi eksperymentalne w mniejszym
  środowisku, zanim włączysz je do współdzielonej bazy.

## Obecnie udokumentowane flagi

| Powierzchnia             | Klucz                                                     | Użyj, gdy                                                                                                      | Więcej                                                                                        |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Środowisko wykonawcze modelu lokalnego | `agents.defaults.experimental.localModelLean`             | Mniejszy lub bardziej restrykcyjny lokalny backend nie radzi sobie z pełną domyślną powierzchnią narzędzi OpenClaw | [Local Models](/pl/gateway/local-models)                                                         |
| Wyszukiwanie pamięci     | `agents.defaults.memorySearch.experimental.sessionMemory` | Chcesz, aby `memory_search` indeksowało wcześniejsze transkrypcje sesji i akceptujesz dodatkowy koszt przechowywania/indeksowania | [Odwołanie do konfiguracji pamięci](/pl/reference/memory-config#session-memory-search-experimental) |
| Narzędzie planowania strukturalnego | `tools.experimental.planTool`                             | Chcesz udostępnić ustrukturyzowane narzędzie `update_plan` do śledzenia pracy wieloetapowej w zgodnych środowiskach wykonawczych i interfejsach | [Odwołanie do konfiguracji Gateway](/pl/gateway/config-tools#toolsexperimental)                    |

## Tryb lean dla modelu lokalnego

`agents.defaults.experimental.localModelLean: true` to zawór bezpieczeństwa
dla słabszych konfiguracji modeli lokalnych. Ogranicza ciężkie domyślne narzędzia, takie jak
`browser`, `cron` i `message`, aby kształt promptu był mniejszy i mniej kruchy
dla backendów zgodnych z OpenAI o małym kontekście lub bardziej restrykcyjnych.

To celowo **nie** jest normalna ścieżka. Jeśli Twój backend poprawnie obsługuje pełne
środowisko wykonawcze, pozostaw to wyłączone.

## Eksperymentalne nie znaczy ukryte

Jeśli funkcja jest eksperymentalna, OpenClaw powinien jasno to komunikować w dokumentacji i w
samej ścieżce konfiguracji. Czego **nie** powinien robić, to przemycać zachowania podglądowe do
stabilnie wyglądającego przełącznika domyślnego i udawać, że to normalne. Właśnie tak
powierzchnie konfiguracji stają się chaotyczne.

## Powiązane

- [Features](/pl/concepts/features)
- [Kanały wydań](/pl/install/development-channels)
