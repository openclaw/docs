---
read_when:
    - Chcesz, aby OpenClaw uruchamiał lokalny serwer modelu tylko wtedy, gdy wybrany jest jego model.
    - Uruchamiasz ds4, inferrs, vLLM, llama.cpp, MLX lub inny lokalny serwer zgodny z OpenAI
    - Musisz kontrolować zimny start, gotowość i wyłączanie lokalnych dostawców po bezczynności
summary: Uruchamiaj lokalne serwery modeli na żądanie przed żądaniami modeli OpenClaw
title: Lokalne usługi modeli
x-i18n:
    generated_at: "2026-06-27T17:34:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 399648e32dd51faba7687a26de75ef349f1197269b5cca03d34552f0cd9cce28
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` pozwala OpenClaw uruchamiać na żądanie lokalny
serwer modelu należący do providera. To konfiguracja na poziomie providera: gdy wybrany model
należy do tego providera, OpenClaw sprawdza usługę, uruchamia proces, jeśli
endpoint nie działa, czeka na gotowość, a następnie wysyła żądanie modelu.

Używaj tego dla lokalnych serwerów, których ciągłe utrzymywanie przez cały dzień jest kosztowne, albo dla
ręcznych konfiguracji, w których wybór modelu powinien wystarczyć do uruchomienia backendu.

## Jak to działa

1. Żądanie modelu jest rozwiązywane do skonfigurowanego providera.
2. Jeśli ten provider ma `localService`, OpenClaw sprawdza `healthUrl`.
3. Jeśli sprawdzenie się powiedzie, OpenClaw używa istniejącego serwera.
4. Jeśli sprawdzenie się nie powiedzie, OpenClaw uruchamia `command` z `args`.
5. OpenClaw odpytuje gotowość do czasu wygaśnięcia `readyTimeoutMs`.
6. Żądanie modelu jest wysyłane przez standardowy transport providera.
7. Jeśli OpenClaw uruchomił proces, a `idleStopMs` jest dodatnie, proces jest
   zatrzymywany, gdy ostatnie aktywne żądanie pozostawało bezczynne przez tak długi czas.

OpenClaw nie instaluje do tego launchd, systemd, Dockera ani demona.
Serwer jest procesem potomnym procesu OpenClaw, który jako pierwszy go potrzebował.

## Kształt konfiguracji

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

## Pola

- `command`: bezwzględna ścieżka do pliku wykonywalnego. Wyszukiwanie przez powłokę nie jest używane.
- `args`: argumenty procesu. Nie są stosowane żadne reguły rozwijania powłoki,
  potoków, globowania ani cytowania.
- `cwd`: opcjonalny katalog roboczy procesu.
- `env`: opcjonalne zmienne środowiskowe scalane ze środowiskiem procesu OpenClaw.
- `healthUrl`: adres URL gotowości. Jeśli zostanie pominięty, OpenClaw dodaje `/models` do
  `baseUrl`, więc `http://127.0.0.1:8000/v1` staje się
  `http://127.0.0.1:8000/v1/models`.
- `readyTimeoutMs`: limit czasu gotowości podczas uruchamiania. Domyślnie: `120000`.
- `idleStopMs`: opóźnienie zamknięcia po bezczynności dla procesów uruchomionych przez OpenClaw. `0` albo
  pominięcie utrzymuje proces przy życiu do zakończenia OpenClaw.

## Przykład Inferrs

Inferrs to niestandardowy backend zgodny z OpenAI dla `/v1`, więc ten sam interfejs API usługi lokalnej
działa z wpisem providera `inferrs`.

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
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

Zastąp `command` wynikiem `which inferrs` na maszynie, na której działa
OpenClaw.

## Przykład ds4

Pełną konfigurację, wskazówki dotyczące rozmiaru kontekstu oraz polecenia weryfikacyjne znajdziesz w
[ds4](/pl/providers/ds4).

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

## Uwagi operacyjne

- Jeden proces OpenClaw zarządza uruchomionym przez siebie procesem potomnym. Inny proces OpenClaw,
  który zobaczy ten sam adres URL zdrowia już działający, użyje go ponownie bez przejmowania.
- Uruchamianie jest serializowane dla każdego zestawu polecenia providera i argumentów, więc równoczesne
  żądania nie tworzą zduplikowanych serwerów dla tej samej konfiguracji.
- Aktywne odpowiedzi strumieniowe utrzymują dzierżawę; zamknięcie po bezczynności czeka, aż obsługa
  treści odpowiedzi się zakończy.
- Użyj `timeoutSeconds` dla wolnych lokalnych providerów, aby zimne starty i długie generowania
  nie trafiały w domyślny limit czasu żądania modelu.
- Użyj jawnego `healthUrl`, jeśli serwer wystawia gotowość w innym miejscu niż
  `/v1/models`.

## Powiązane

<CardGroup cols={2}>
  <Card title="Modele lokalne" href="/pl/gateway/local-models" icon="server">
    Konfiguracja modeli lokalnych, wybór providerów i wskazówki dotyczące bezpieczeństwa.
  </Card>
  <Card title="Inferrs" href="/pl/providers/inferrs" icon="cpu">
    Uruchom OpenClaw przez zgodny z OpenAI lokalny serwer inferrs.
  </Card>
</CardGroup>
