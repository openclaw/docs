---
read_when:
    - Chcesz, aby OpenClaw uruchamiał lokalny serwer modeli tylko wtedy, gdy wybrano jego dostawcę modelu lub osadzeń
    - Uruchamiasz ds4, inferrs, vLLM, llama.cpp, MLX lub inny lokalny serwer zgodny z OpenAI
    - Musisz kontrolować zimny start, gotowość i wyłączanie po okresie bezczynności dla lokalnych dostawców
summary: Uruchamiaj lokalne serwery modeli na żądanie przed żądaniami OpenClaw dotyczącymi modeli i osadzania
title: Usługi modeli lokalnych
x-i18n:
    generated_at: "2026-07-12T15:08:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a761113dd591fed0394379b2bad173165efc5e284565c652493e73d1e724529d
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` uruchamia na żądanie lokalny serwer modeli zarządzany przez dostawcę. Gdy żądanie modelu lub osadzania wybierze tego dostawcę, OpenClaw sprawdza punkt końcowy kondycji, uruchamia proces, jeśli serwer nie działa, czeka na gotowość, a następnie wysyła żądanie. Użyj tej funkcji, aby uniknąć utrzymywania kosztownych lokalnych serwerów przez cały dzień.

## Jak to działa

1. Żądanie modelu lub osadzania jest kierowane do skonfigurowanego dostawcy.
2. Jeśli ten dostawca ma `localService`, OpenClaw sprawdza `healthUrl`.
3. Po pomyślnym sprawdzeniu OpenClaw używa już działającego serwera.
4. Po nieudanym sprawdzeniu OpenClaw uruchamia `command` z argumentami `args`.
5. OpenClaw cyklicznie sprawdza punkt końcowy kondycji do upłynięcia `readyTimeoutMs`.
6. Żądanie jest obsługiwane przez standardowy transport modelu lub osadzania.
7. Jeśli OpenClaw uruchomił proces i ustawiono `idleStopMs`, zatrzymuje go, gdy od zakończenia ostatniego aktywnego żądania upłynie określony czas bezczynności.

OpenClaw nie instaluje w tym celu launchd, systemd, Dockera ani żadnego demona. Serwer jest zwykłym procesem potomnym tego procesu OpenClaw, który jako pierwszy go potrzebował.

Uruchamianie jest serializowane dla każdej kombinacji skonfigurowanego dostawcy, polecenia, argumentów i zmiennych środowiskowych, więc równoczesne żądania czatu i osadzania kierowane do tej samej usługi nie uruchamiają zduplikowanych serwerów. Każde żądanie zachowuje własną dzierżawę do zakończenia obsługi odpowiedzi, dlatego wyłączenie po okresie bezczynności czeka na zakończenie wszystkich aktywnych żądań modeli i osadzania. Skonfigurowane aliasy dostawców pozostają odrębne: dwa aliasy mogą wskazywać różne hosty GPU bez łączenia ich w ten sam identyfikator adaptera Ollama, LM Studio lub zgodnego z OpenAI.

Jeśli inny proces OpenClaw ma już sprawny serwer pod tym samym adresem `healthUrl`, bieżący proces używa go ponownie bez przejmowania nad nim kontroli (każdy proces zarządza wyłącznie procesem potomnym, który sam uruchomił). Dzienniki uruchamiania i zakończenia zawierają ograniczone, zredagowane końcowe fragmenty danych wyjściowych procesu potomnego oraz szczegóły czasu i zakończenia; skonfigurowane wartości środowiskowe nigdy nie są ujawniane.

## Struktura konfiguracji

```json5
{
  models: {
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local-model",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/absolute/path/to/server",
          args: ["--host", "127.0.0.1", "--port", "8000"],
          cwd: "/absolute/path/to/working-dir",
          env: { LOCAL_MODEL_CACHE: "/absolute/path/to/cache" },
          healthUrl: "http://127.0.0.1:8000/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "my-local-model",
            name: "My Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Ustaw `timeoutSeconds` we wpisie dostawcy (nie w `localService`), aby powolne uruchamianie na zimno i długie generowanie nie przekraczały domyślnego limitu czasu żądania modelu. Ustaw jawny adres `healthUrl`, jeśli serwer udostępnia stan gotowości w innym miejscu niż `/models` względem bazowego adresu URL.

## Pola

| Pole             | Wymagane | Opis                                                                                                                                 |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `command`        | tak      | Bezwzględna ścieżka do pliku wykonywalnego. Bez wyszukiwania w zmiennej PATH powłoki.                                                 |
| `args`           | nie      | Argumenty procesu. Bez rozwijania przez powłokę, potoków, wzorców wieloznacznych ani przetwarzania cudzysłowów.                        |
| `cwd`            | nie      | Katalog roboczy procesu.                                                                                                             |
| `env`            | nie      | Zmienne środowiskowe scalane ze środowiskiem procesu OpenClaw.                                                                       |
| `healthUrl`      | nie      | Adres URL gotowości. Domyślnie jest to `baseUrl` z dołączonym `/models` (`http://127.0.0.1:8000/v1` staje się `http://127.0.0.1:8000/v1/models`). |
| `readyTimeoutMs` | nie      | Limit czasu oczekiwania na gotowość podczas uruchamiania. Domyślnie: `120000`.                                                        |
| `idleStopMs`     | nie      | Opóźnienie wyłączenia z powodu bezczynności procesu uruchomionego przez OpenClaw. Wartość `0` lub jej pominięcie utrzymuje proces do zakończenia OpenClaw. |

## Przykład Inferrs

Inferrs to niestandardowe zaplecze `/v1` zgodne z OpenAI, więc ten sam interfejs API `localService` działa z wpisem dostawcy `inferrs`:

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: { requiresStringContent: true },
          },
        ],
      },
    },
  },
}
```

Zastąp `command` wynikiem polecenia `which inferrs` na komputerze, na którym działa OpenClaw. Pełna konfiguracja inferrs: [Inferrs](/pl/providers/inferrs).

## Przykład ds4

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [],
      },
    },
  },
}
```

Pełna konfiguracja, dobór rozmiaru kontekstu i polecenia weryfikacyjne: [ds4](/pl/providers/ds4).

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Modele lokalne" href="/pl/gateway/local-models" icon="server">
    Konfiguracja modeli lokalnych, wybór dostawców i wskazówki dotyczące bezpieczeństwa.
  </Card>
  <Card title="Inferrs" href="/pl/providers/inferrs" icon="cpu">
    Uruchamianie OpenClaw za pośrednictwem lokalnego serwera inferrs zgodnego z OpenAI.
  </Card>
</CardGroup>
