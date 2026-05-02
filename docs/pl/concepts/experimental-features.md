---
read_when:
    - Widzisz klucz konfiguracji `.experimental` i chcesz wiedzieć, czy jest stabilny
    - Chcesz wypróbować funkcje środowiska uruchomieniowego w wersji zapoznawczej, nie myląc ich ze zwykłymi wartościami domyślnymi
    - Potrzebujesz jednego miejsca, w którym znajdziesz obecnie udokumentowane flagi eksperymentalne
summary: Co oznaczają flagi eksperymentalne w OpenClaw i które z nich są obecnie udokumentowane
title: Funkcje eksperymentalne
x-i18n:
    generated_at: "2026-05-02T22:18:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 066efa297bac995597f1092ed6473d9cff28c01d7e28fa1382d7997f8f83a346
    source_path: concepts/experimental-features.md
    workflow: 16
---

Funkcje eksperymentalne w OpenClaw to **opcjonalne powierzchnie podglądu**. Są
ukryte za jawnymi flagami, ponieważ nadal wymagają sprawdzenia w realnym użyciu,
zanim zasłużą na stabilne ustawienie domyślne albo długotrwały publiczny kontrakt.

Traktuj je inaczej niż zwykłą konfigurację:

- Pozostaw je **domyślnie wyłączone**, chyba że powiązana dokumentacja sugeruje ich wypróbowanie.
- Zakładaj, że ich **kształt i zachowanie będą zmieniać się** szybciej niż stabilna konfiguracja.
- Najpierw wybieraj stabilną ścieżkę, jeśli już istnieje.
- Jeśli wdrażasz OpenClaw szeroko, przetestuj flagi eksperymentalne w mniejszym
  środowisku, zanim wpiszesz je do współdzielonej konfiguracji bazowej.

## Obecnie udokumentowane flagi

| Powierzchnia             | Klucz                                                     | Użyj jej, gdy                                                                                                  | Więcej                                                                                        |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Lokalne środowisko modeli | `agents.defaults.experimental.localModelLean`             | Mniejszy albo bardziej rygorystyczny lokalny backend dławi się pełną domyślną powierzchnią narzędzi OpenClaw  | [Modele lokalne](/pl/gateway/local-models)                                                       |
| Wyszukiwanie w pamięci   | `agents.defaults.memorySearch.experimental.sessionMemory` | Chcesz, aby `memory_search` indeksowało transkrypty poprzednich sesji, i akceptujesz dodatkowy koszt pamięci/indeksowania | [Dokumentacja konfiguracji pamięci](/pl/reference/memory-config#session-memory-search-experimental) |
| Narzędzie planowania strukturalnego | `tools.experimental.planTool`                             | Chcesz udostępnić strukturalne narzędzie `update_plan` do śledzenia pracy wieloetapowej w zgodnych środowiskach uruchomieniowych i interfejsach UI | [Dokumentacja konfiguracji Gateway](/pl/gateway/config-tools#toolsexperimental)                  |

## Tryb odchudzony modeli lokalnych

`agents.defaults.experimental.localModelLean: true` to zawór bezpieczeństwa dla słabszych konfiguracji modeli lokalnych. Gdy jest włączony, OpenClaw usuwa trzy domyślne narzędzia — `browser`, `cron` i `message` — z powierzchni narzędzi agenta w każdej turze. Nic innego się nie zmienia.

### Dlaczego te trzy narzędzia

Te trzy narzędzia mają najdłuższe opisy i najwięcej kształtów parametrów w domyślnym środowisku uruchomieniowym OpenClaw. W backendzie zgodnym z OpenAI, który ma mały kontekst albo bardziej rygorystyczne limity, to różnica między:

- Schematami narzędzi mieszczącymi się czysto w prompcie a wypychaniem historii rozmowy.
- Modelem wybierającym właściwe narzędzie a emitowaniem niepoprawnych wywołań narzędzi, bo istnieje zbyt wiele podobnie wyglądających schematów.
- Adapterem Chat Completions mieszczącym się w limitach ustrukturyzowanego wyjścia serwera a błędem 400 przez zbyt duży payload wywołania narzędzia.

Usunięcie ich nie przepina OpenClaw po cichu — po prostu skraca listę narzędzi. Model nadal ma dostępne `read`, `write`, `edit`, `exec`, `apply_patch`, wyszukiwanie/pobieranie z sieci (gdy skonfigurowane), pamięć oraz narzędzia sesji/agenta.

### Kiedy włączyć

Włącz tryb odchudzony, gdy masz już dowód, że model potrafi rozmawiać z Gateway, ale pełne tury agenta działają niepoprawnie. Typowy ciąg sygnałów wygląda tak:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` kończy się powodzeniem.
2. Zwykła tura agenta kończy się błędami przez niepoprawnie sformatowane wywołania narzędzi, zbyt duże prompty albo ignorowanie narzędzi przez model.
3. Przełączenie `localModelLean: true` usuwa problem.

### Kiedy pozostawić wyłączone

Jeśli Twój backend bez problemu obsługuje pełne domyślne środowisko uruchomieniowe, pozostaw tę flagę wyłączoną. Tryb odchudzony jest obejściem, a nie ustawieniem domyślnym. Istnieje, ponieważ niektóre lokalne stosy potrzebują mniejszej powierzchni narzędzi, aby działać poprawnie; modele hostowane i dobrze wyposażone lokalne zestawy tego nie wymagają.

Tryb odchudzony nie zastępuje też `tools.profile`, `tools.allow`/`tools.deny` ani awaryjnej ścieżki `compat.supportsTools: false` modelu. Jeśli potrzebujesz trwale węższej powierzchni narzędzi dla konkretnego agenta, użyj tych stabilnych pokręteł zamiast flagi eksperymentalnej.

### Włączanie

```json5
{
  agents: {
    defaults: {
      experimental: {
        localModelLean: true,
      },
    },
  },
}
```

Po zmianie flagi uruchom ponownie Gateway, a następnie potwierdź przyciętą listę narzędzi poleceniem:

```bash
openclaw status --deep
```

Głębokie dane statusu wypisują aktywne narzędzia agenta; gdy tryb odchudzony jest włączony, `browser`, `cron` i `message` powinny być nieobecne.

## Eksperymentalne nie oznacza ukryte

Jeśli funkcja jest eksperymentalna, OpenClaw powinien mówić o tym wprost w dokumentacji i w samej
ścieżce konfiguracji. Nie powinien natomiast przemycać zachowania podglądowego do
stabilnie wyglądającego pokrętła domyślnego i udawać, że to normalne. W ten sposób powierzchnie
konfiguracji robią się chaotyczne.

## Powiązane

- [Funkcje](/pl/concepts/features)
- [Kanały wydań](/pl/install/development-channels)
