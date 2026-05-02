---
read_when:
    - Chcesz uruchomić OpenClaw z modelami o otwartym kodzie źródłowym za pomocą LM Studio
    - Chcesz przygotować i skonfigurować LM Studio
summary: Uruchamianie OpenClaw z LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-05-02T10:00:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3971bc471e5d8b0f142394b7b1897f8fdb2be283082245fbb2cf744d06143292
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio to przyjazna, a jednocześnie zaawansowana aplikacja do uruchamiania modeli o otwartych wagach na własnym sprzęcie. Umożliwia uruchamianie modeli llama.cpp (GGUF) lub MLX (Apple Silicon). Jest dostępna jako pakiet GUI albo demon bez interfejsu (`llmster`). Dokumentację produktu i konfiguracji znajdziesz na [lmstudio.ai](https://lmstudio.ai/).

## Szybki start

1. Zainstaluj LM Studio (desktop) albo `llmster` (bez interfejsu), a następnie uruchom lokalny serwer:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Uruchom serwer

Upewnij się, że uruchamiasz aplikację desktopową albo demon za pomocą następującego polecenia:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Jeśli używasz aplikacji, upewnij się, że masz włączone JIT, aby zapewnić płynne działanie. Więcej informacji znajdziesz w [przewodniku LM Studio JIT i TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. Jeśli uwierzytelnianie LM Studio jest włączone, ustaw `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Jeśli uwierzytelnianie LM Studio jest wyłączone, podczas interaktywnej konfiguracji OpenClaw możesz pozostawić klucz API pusty.

Szczegóły konfiguracji uwierzytelniania LM Studio znajdziesz w [Uwierzytelnianiu LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. Uruchom onboarding i wybierz `LM Studio`:

```bash
openclaw onboard
```

5. W onboardingu użyj promptu `Default model`, aby wybrać model LM Studio.

Możesz też ustawić go lub zmienić później:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Klucze modeli LM Studio mają format `author/model-name` (np. `qwen/qwen3.5-9b`). Referencje modeli OpenClaw dodają na początku nazwę dostawcy: `lmstudio/qwen/qwen3.5-9b`. Dokładny klucz modelu możesz znaleźć, uruchamiając `curl http://localhost:1234/api/v1/models` i sprawdzając pole `key`.

## Onboarding nieinteraktywny

Użyj onboardingu nieinteraktywnego, gdy chcesz oskryptować konfigurację (CI, provisionowanie, zdalny bootstrap):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Albo określ bazowy URL, model i opcjonalny klucz API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` przyjmuje klucz modelu zwrócony przez LM Studio (np. `qwen/qwen3.5-9b`), bez prefiksu dostawcy `lmstudio/`.

W przypadku serwerów LM Studio z uwierzytelnianiem przekaż `--lmstudio-api-key` albo ustaw `LM_API_TOKEN`.
W przypadku serwerów LM Studio bez uwierzytelniania pomiń klucz; OpenClaw zapisze lokalny, niepoufny marker.

`--custom-api-key` pozostaje obsługiwane ze względu na kompatybilność, ale dla LM Studio preferowane jest `--lmstudio-api-key`.

To zapisuje `models.providers.lmstudio` i ustawia domyślny model na `lmstudio/<custom-model-id>`. Gdy podasz klucz API, konfiguracja zapisze również profil uwierzytelniania `lmstudio:default`.

Konfiguracja interaktywna może poprosić o opcjonalną preferowaną długość kontekstu ładowania i zastosować ją do wykrytych modeli LM Studio zapisanych w konfiguracji.
Konfiguracja Plugin LM Studio ufa skonfigurowanemu endpointowi LM Studio dla żądań modeli, w tym hostom loopback, LAN i tailnet. Możesz z tego zrezygnować, ustawiając `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## Konfiguracja

### Kompatybilność użycia strumieniowego

LM Studio jest kompatybilne z użyciem strumieniowym. Gdy nie emituje obiektu `usage` w kształcie OpenAI, OpenClaw odzyskuje liczniki tokenów z metadanych w stylu llama.cpp: `timings.prompt_n` / `timings.predicted_n`.

To samo zachowanie użycia strumieniowego dotyczy tych lokalnych backendów zgodnych z OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Kompatybilność myślenia

Gdy wykrywanie `/api/v1/models` w LM Studio zgłasza opcje rozumowania specyficzne dla modelu, OpenClaw zachowuje te natywne wartości w metadanych kompatybilności modelu. W przypadku binarnych modeli myślenia, które deklarują `allowed_options: ["off", "on"]`, OpenClaw mapuje wyłączone myślenie na `off`, a włączone poziomy `/think` na `on`, zamiast wysyłać wartości dostępne tylko w OpenAI, takie jak `low` lub `medium`.

### Jawna konfiguracja

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Rozwiązywanie problemów

### Nie wykryto LM Studio

Upewnij się, że LM Studio działa. Jeśli uwierzytelnianie jest włączone, ustaw też `LM_API_TOKEN`:

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

Sprawdź, czy API jest dostępne:

```bash
curl http://localhost:1234/api/v1/models
```

### Błędy uwierzytelniania (HTTP 401)

Jeśli konfiguracja zgłasza HTTP 401, sprawdź swój klucz API:

- Sprawdź, czy `LM_API_TOKEN` pasuje do klucza skonfigurowanego w LM Studio.
- Szczegóły konfiguracji uwierzytelniania LM Studio znajdziesz w [Uwierzytelnianiu LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Jeśli Twój serwer nie wymaga uwierzytelniania, pozostaw klucz pusty podczas konfiguracji.

### Ładowanie modelu just-in-time

LM Studio obsługuje ładowanie modeli just-in-time (JIT), w którym modele są ładowane przy pierwszym żądaniu. Domyślnie OpenClaw wstępnie ładuje modele przez natywny endpoint ładowania LM Studio, co pomaga, gdy JIT jest wyłączone. Aby pozwolić, by JIT, bezczynny TTL i automatyczne usuwanie LM Studio zarządzały cyklem życia modelu, wyłącz krok wstępnego ładowania OpenClaw:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        api: "openai-completions",
        params: { preload: false },
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

### Host LM Studio w sieci LAN lub tailnet

Użyj osiągalnego adresu hosta LM Studio, zachowaj `/v1` i upewnij się, że LM Studio na tej maszynie jest powiązane z interfejsem innym niż loopback:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

W przeciwieństwie do ogólnych dostawców zgodnych z OpenAI, `lmstudio` automatycznie ufa swojemu skonfigurowanemu lokalnemu/prywatnemu endpointowi dla chronionych żądań modeli. Niestandardowe identyfikatory dostawców loopback, takie jak `localhost` lub `127.0.0.1`, również są automatycznie zaufane; dla niestandardowych identyfikatorów dostawców w sieci LAN, tailnet lub prywatnym DNS ustaw jawnie `models.providers.<id>.request.allowPrivateNetwork: true`.

## Powiązane

- [Wybór modelu](/pl/concepts/model-providers)
- [Ollama](/pl/providers/ollama)
- [Modele lokalne](/pl/gateway/local-models)
