---
read_when:
    - Widzisz klucz konfiguracyjny `.experimental` i chcesz wiedzieć, czy jest stabilny
    - Chcesz wypróbować funkcje środowiska uruchomieniowego w wersji preview bez mylenia ich ze zwykłymi ustawieniami domyślnymi
    - Chcesz mieć jedno miejsce, w którym znajdziesz obecnie udokumentowane flagi eksperymentalne
summary: Co oznaczają flagi eksperymentalne w OpenClaw i które z nich są obecnie udokumentowane
title: Funkcje eksperymentalne
x-i18n:
    generated_at: "2026-06-27T17:26:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0f42e6b574c5db9508412c9c5d9919d1a54a16fe00edea43664f3a01e8e38f5
    source_path: concepts/experimental-features.md
    workflow: 16
---

Funkcje eksperymentalne w OpenClaw to **opcjonalne powierzchnie podglądowe**. Są
ukryte za jawnymi flagami, ponieważ nadal wymagają sprawdzenia w rzeczywistych
warunkach, zanim zasłużą na stabilne ustawienie domyślne albo długotrwały
kontrakt publiczny.

Traktuj je inaczej niż zwykłą konfigurację:

- Pozostaw je **domyślnie wyłączone**, chyba że powiązana dokumentacja zaleca wypróbowanie jednej z nich.
- Spodziewaj się, że **kształt i zachowanie będą się zmieniać** szybciej niż stabilna konfiguracja.
- Najpierw preferuj stabilną ścieżkę, jeśli już istnieje.
- Jeśli wdrażasz OpenClaw szeroko, przetestuj flagi eksperymentalne w mniejszym
  środowisku, zanim włączysz je do wspólnej konfiguracji bazowej.

## Aktualnie udokumentowane flagi

| Powierzchnia             | Klucz                                                                                      | Użyj, gdy                                                                                                                         | Więcej                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Lokalne środowisko uruchomieniowe modelu | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Mniejszy lub bardziej rygorystyczny lokalny backend nie radzi sobie z pełną domyślną powierzchnią narzędzi OpenClaw              | [Modele lokalne](/pl/gateway/local-models)                                                       |
| Wyszukiwanie pamięci     | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Chcesz, aby `memory_search` indeksowało transkrypcje poprzednich sesji i akceptujesz dodatkowy koszt przechowywania/indeksowania | [Dokumentacja konfiguracji pamięci](/pl/reference/memory-config#session-memory-search-experimental) |
| Harness Codex            | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Chcesz, aby natywny app-server Codex w wersji 0.132.0 lub nowszej kierował do exec-servera OpenClaw opartego na sandboxie zamiast wyłączać Code Mode | [Dokumentacja harnessu Codex](/pl/plugins/codex-harness-reference#sandboxed-native-execution) |
| Narzędzie planowania strukturalnego | `tools.experimental.planTool`                                                              | Chcesz udostępnić strukturalne narzędzie `update_plan` do śledzenia pracy wieloetapowej w zgodnych środowiskach uruchomieniowych i UI | [Dokumentacja konfiguracji Gateway](/pl/gateway/config-tools#toolsexperimental)                  |

## Tryb odchudzonego modelu lokalnego

`agents.defaults.experimental.localModelLean: true` to zawór bezpieczeństwa dla słabszych konfiguracji modeli lokalnych. Gdy jest włączony, OpenClaw usuwa trzy domyślne narzędzia — `browser`, `cron` i `message` — z powierzchni narzędzi agenta dla każdej tury. Domyślnie włącza też dla takiego uruchomienia strukturalne kontrolki Tool Search, gdy `tools.toolSearch` nie jest jawnie skonfigurowane, dzięki czemu większe katalogi narzędzi pluginów, MCP lub klientów pozostają za `tool_search`, `tool_describe` i `tool_call`, zamiast trafiać bezpośrednio do promptu. Uruchomienia wymagające bezpośredniego dostarczania przez `message` zachowują to narzędzie jako bezpośrednie, zamiast włączać domyślne Tool Search trybu odchudzonego. Użyj `agents.list[].experimental.localModelLean`, aby włączyć lub wyłączyć to samo zachowanie dla jednego skonfigurowanego agenta.

### Dlaczego te trzy narzędzia

Te trzy narzędzia mają największe opisy i najwięcej kształtów parametrów w domyślnym środowisku uruchomieniowym OpenClaw. Na backendzie o małym kontekście lub bardziej rygorystycznym backendzie zgodnym z OpenAI oznacza to różnicę między:

- Schematami narzędzi mieszczącymi się czysto w prompcie a wypychaniem historii rozmowy.
- Wyborem właściwego narzędzia przez model a emitowaniem nieprawidłowo uformowanych wywołań narzędzi, ponieważ istnieje zbyt wiele podobnie wyglądających schematów.
- Adapterem Chat Completions mieszczącym się w limitach strukturalnego wyjścia serwera a wywołaniem błędu 400 z powodu rozmiaru ładunku wywołań narzędzi.

Usunięcie ich nie przepina po cichu OpenClaw — po prostu skraca listę bezpośrednich narzędzi. Model nadal ma dostępne narzędzia `read`, `write`, `edit`, `exec`, `apply_patch`, wyszukiwanie/pobieranie z sieci (gdy skonfigurowane), pamięć oraz narzędzia sesji/agenta. Dodatkowe katalogi pozostają wywoływalne przez Tool Search, chyba że jawnie ustawisz `tools.toolSearch: false`.

### Kiedy włączyć

Włącz tryb odchudzony, gdy już udowodniono, że model może rozmawiać z Gateway, ale pełne tury agenta działają nieprawidłowo. Typowy ciąg sygnałów to:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` kończy się powodzeniem.
2. Normalna tura agenta kończy się niepowodzeniem z powodu nieprawidłowo uformowanych wywołań narzędzi, zbyt dużych promptów albo ignorowania narzędzi przez model.
3. Przełączenie `localModelLean: true` usuwa awarię.

### Kiedy pozostawić wyłączone

Jeśli Twój backend sprawnie obsługuje pełne domyślne środowisko uruchomieniowe, pozostaw to wyłączone. Tryb odchudzony jest obejściem, a nie ustawieniem domyślnym. Istnieje, ponieważ niektóre lokalne stosy potrzebują mniejszej powierzchni narzędzi, aby działać poprawnie; modele hostowane i dobrze wyposażone lokalne konfiguracje tego nie wymagają.

Tryb odchudzony nie zastępuje też `tools.profile`, `tools.allow`/`tools.deny` ani awaryjnego wyjścia modelu `compat.supportsTools: false`. Jeśli potrzebujesz trwale węższej powierzchni narzędzi dla konkretnego agenta, preferuj te stabilne pokrętła zamiast flagi eksperymentalnej.

Jeśli już globalnie dostrajasz Tool Search, OpenClaw pozostawia tę konfigurację operatora bez zmian. Ustaw `tools.toolSearch: false`, aby zrezygnować z domyślnego Tool Search trybu odchudzonego.

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

Tylko dla jednego agenta:

```json5
{
  agents: {
    list: [
      {
        id: "local",
        model: "lmstudio/gemma-4-e4b-it",
        experimental: {
          localModelLean: true,
        },
      },
    ],
  },
}
```

Po zmianie flagi uruchom ponownie Gateway, a następnie potwierdź przyciętą listę narzędzi poleceniem:

```bash
openclaw status --deep
```

Szczegółowe wyjście statusu zawiera listę aktywnych narzędzi agenta; `browser`, `cron` i `message` powinny być nieobecne, gdy tryb odchudzony jest włączony, chyba że bieżący tryb dostarczania wymusza bezpośrednie odpowiedzi `message`.

## Eksperymentalne nie znaczy ukryte

Jeśli funkcja jest eksperymentalna, OpenClaw powinien jasno powiedzieć to w dokumentacji i w samej ścieżce konfiguracji. Nie powinien natomiast **przemycać** zachowania podglądowego do pokrętła domyślnego wyglądającego na stabilne i udawać, że to normalne. Właśnie tak powierzchnie konfiguracji stają się bałaganiarskie.

## Powiązane

- [Funkcje](/pl/concepts/features)
- [Kanały wydań](/pl/install/development-channels)
