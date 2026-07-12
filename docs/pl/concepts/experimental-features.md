---
read_when:
    - Widzisz klucz konfiguracji `.experimental` i chcesz wiedzieć, czy jest stabilny
    - Chcesz wypróbować eksperymentalne funkcje środowiska wykonawczego, nie myląc ich ze standardowymi ustawieniami domyślnymi
    - Chcesz mieć jedno miejsce, w którym znajdziesz obecnie udokumentowane flagi eksperymentalne
summary: Co oznaczają flagi eksperymentalne w OpenClaw i które z nich są obecnie udokumentowane
title: Funkcje eksperymentalne
x-i18n:
    generated_at: "2026-07-12T15:03:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d4f6d066ef80cad2fb8a54c8aecb9fca5b4ed91cd5a3626dad4ad889dc3e8f2
    source_path: concepts/experimental-features.md
    workflow: 16
---

Funkcje eksperymentalne to opcjonalne funkcje w wersji zapoznawczej, dostępne po włączeniu jawnych flag. Potrzebują więcej testów w rzeczywistych warunkach, zanim uzyskają stabilne ustawienie domyślne lub długoterminową gwarancję zgodności.

- Są domyślnie wyłączone, chyba że dokumentacja zaleca włączenie którejś z nich.
- Ich forma i działanie mogą zmieniać się szybciej niż stabilna konfiguracja.
- Jeśli istnieje już stabilne rozwiązanie, należy je preferować.
- Szerokie wdrożenie należy przeprowadzić dopiero po wcześniejszych testach w mniejszym środowisku.

## Obecnie udokumentowane flagi

| Obszar                         | Klucz                                                                                      | Kiedy używać                                                                                                                                | Więcej informacji                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Środowisko uruchomieniowe modelu lokalnego | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Gdy mniejszy lub bardziej restrykcyjny lokalny backend nie radzi sobie z pełnym domyślnym zestawem narzędzi OpenClaw                         | [Modele lokalne](/pl/gateway/local-models)                                                           |
| Wyszukiwanie w pamięci         | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Gdy chcesz, aby `memory_search` indeksowało transkrypcje poprzednich sesji, i akceptujesz dodatkowy koszt przechowywania oraz indeksowania    | [Dokumentacja konfiguracji pamięci](/pl/reference/memory-config#session-memory-search-experimental)  |
| Środowisko Codex               | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Gdy chcesz, aby natywny serwer aplikacji Codex w wersji 0.132.0 lub nowszej korzystał z serwera wykonywania opartego na piaskownicy OpenClaw zamiast wyłączać tryb kodu | [Dokumentacja środowiska Codex](/pl/plugins/codex-harness-reference#sandboxed-native-execution) |
| Narzędzie planowania strukturalnego | `tools.experimental.planTool`                                                          | Gdy chcesz udostępnić strukturalne narzędzie `update_plan` do śledzenia pracy wieloetapowej w zgodnych środowiskach uruchomieniowych i interfejsach użytkownika | [Dokumentacja konfiguracji Gateway](/pl/gateway/config-tools#toolsexperimental)                       |

## Odchudzony tryb modelu lokalnego

Ustawienie `agents.defaults.experimental.localModelLean: true` usuwa w każdym przebiegu z bezpośrednio dostępnego zestawu agenta rozbudowane narzędzia opcjonalne: `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` oraz `pdf`. Narzędzia jawnie dozwolone lub wymagane do dostarczania pozostają dostępne, choć wyszukiwanie narzędzi może umieszczać je w katalogu zamiast udostępniać bezpośrednio. Jeśli `tools.toolSearch` nie jest jeszcze ustawione, tryb odchudzony domyślnie przełącza również katalogi pluginów, MCP i klientów na strukturalne wyszukiwanie narzędzi (`tool_search`, `tool_describe`, `tool_call`). Użyj `agents.list[].experimental.localModelLean`, aby ograniczyć to ustawienie do jednego agenta.

Jeśli wyszukiwanie narzędzi jest już skonfigurowane globalnie, OpenClaw nie zmienia tej konfiguracji. Ustaw `tools.toolSearch: false`, aby zrezygnować z domyślnego wyszukiwania narzędzi w trybie odchudzonym.

W strukturalnym trybie `tools` przebiegi odchudzone zachowują bezpośrednią widoczność narzędzia `exec` obok elementów sterujących wyszukiwaniem narzędzi, dzięki czemu lokalne modele dostrojone do programowania nadal mogą wybierać znaną im ścieżkę powłoki. Zmienia to wyłącznie widoczność schematu: nadal obowiązują zwykłe zasady dotyczące narzędzi, izolacja w piaskownicy i zatwierdzanie wykonania. Jawne tryby `code` oraz `directory` zachowują swoje normalne działanie funkcji Compaction.

### Dlaczego te narzędzia

Te narzędzia mają najdłuższe opisy, najbardziej rozbudowane struktury parametrów lub największe prawdopodobieństwo odciągnięcia małego modelu od zwykłego toku programowania i rozmowy. W przypadku backendu z małym kontekstem lub bardziej restrykcyjnego backendu zgodnego z OpenAI oznacza to różnicę między:

- Zmieszczeniem schematów narzędzi w prompcie a wypieraniem przez nie historii rozmowy.
- Wybraniem przez model właściwego narzędzia a generowaniem nieprawidłowych wywołań narzędzi z powodu zbyt wielu podobnych schematów.
- Zachowaniem przez adapter Chat Completions limitów ustrukturyzowanych danych wyjściowych a błędem 400 spowodowanym rozmiarem ładunku wywołania narzędzia.

Ich usunięcie jedynie skraca listę bezpośrednio dostępnych narzędzi. Model nadal ma dostęp do `read`, `write`, `edit`, `exec`, `apply_patch`, rozumienia obrazów, wyszukiwania i pobierania treści z internetu (jeśli skonfigurowano), pamięci oraz narzędzi sesji i agentów. Dodatkowe katalogi pozostają dostępne przez wyszukiwanie narzędzi, chyba że ustawisz `tools.toolSearch: false`; jawne zezwolenia na narzędzia mogą ponownie udostępnić agentowi w trybie odchudzonym narzędzia potrzebne w ograniczonym przepływie pracy.

### Kiedy włączyć

Włącz tryb odchudzony po potwierdzeniu, że model może komunikować się z Gateway, ale pełne przebiegi agenta działają nieprawidłowo:

1. Polecenie `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` kończy się powodzeniem.
2. Zwykły przebieg agenta kończy się nieprawidłowymi wywołaniami narzędzi, zbyt dużymi promptami lub ignorowaniem narzędzi przez model.
3. Włączenie `localModelLean: true` usuwa błąd.

### Kiedy pozostawić wyłączony

Jeśli backend poprawnie obsługuje pełne domyślne środowisko uruchomieniowe, pozostaw tę opcję wyłączoną. Jest to obejście przeznaczone dla lokalnych stosów wymagających mniejszego zestawu narzędzi, a nie ustawienie domyślne dla modeli hostowanych ani lokalnych środowisk dysponujących odpowiednimi zasobami.

Tryb odchudzony nie zastępuje `tools.profile`, `tools.allow`/`tools.deny` ani awaryjnej opcji modelu `compat.supportsTools: false`. Aby trwale zawęzić zestaw narzędzi określonego agenta, wybierz te stabilne opcje konfiguracji.

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

Po zmianie flagi uruchom ponownie Gateway. Filtrowanie w trybie odchudzonym usuwa `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` oraz `pdf`, chyba że jawnie zachowasz je za pomocą `tools.allow` lub `tools.alsoAllow`; wyszukiwanie narzędzi może nadal umieszczać zachowane narzędzia w katalogu zamiast udostępniać je bezpośrednio.

## Eksperymentalne nie oznacza ukrytego

Dokumentacja i sama ścieżka konfiguracji powinny jasno wskazywać, że funkcja jest eksperymentalna; nie należy ukrywać jej za opcją domyślną wyglądającą na stabilną.

## Powiązane

- [Funkcje](/pl/concepts/features)
- [Kanały wydań](/pl/install/development-channels)
