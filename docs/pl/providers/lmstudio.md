---
read_when:
    - Chcesz uruchamiać OpenClaw z modelami open source przez LM Studio
    - Chcesz skonfigurować LM Studio
summary: Uruchamiaj OpenClaw z LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-24T09:28:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2077790173a8cb660409b64e199d2027dda7b5b55226a00eadb0cdc45061e3ce
    source_path: providers/lmstudio.md
    workflow: 15
---

LM Studio to przyjazna, a jednocześnie potężna aplikacja do uruchamiania modeli open-weight na własnym sprzęcie. Pozwala uruchamiać modele llama.cpp (GGUF) lub MLX (Apple Silicon). Występuje jako pakiet GUI albo daemon headless (`llmster`). Dokumentację produktu i konfiguracji znajdziesz na [lmstudio.ai](https://lmstudio.ai/).

## Szybki start

1. Zainstaluj LM Studio (desktop) lub `llmster` (headless), a następnie uruchom lokalny serwer:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Uruchom serwer

Upewnij się, że albo uruchomisz aplikację desktopową, albo daemon przy użyciu następującego polecenia:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Jeśli używasz aplikacji, upewnij się, że masz włączone JIT dla płynnego działania. Dowiedz się więcej w [przewodniku LM Studio JIT i TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. OpenClaw wymaga wartości tokenu LM Studio. Ustaw `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Jeśli uwierzytelnianie LM Studio jest wyłączone, użyj dowolnej niepustej wartości tokenu:

```bash
export LM_API_TOKEN="placeholder-key"
```

Szczegóły konfiguracji auth LM Studio znajdziesz w [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).

4. Uruchom onboarding i wybierz `LM Studio`:

```bash
openclaw onboard
```

5. W onboardingu użyj promptu `Default model`, aby wybrać model LM Studio.

Możesz też ustawić lub zmienić go później:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Klucze modeli LM Studio mają format `author/model-name` (np. `qwen/qwen3.5-9b`). Odwołania modeli OpenClaw
dodają prefiks nazwy providera: `lmstudio/qwen/qwen3.5-9b`. Dokładny klucz modelu
możesz znaleźć, uruchamiając `curl http://localhost:1234/api/v1/models` i sprawdzając pole `key`.

## Onboarding nieinteraktywny

Użyj onboardingu nieinteraktywnego, gdy chcesz zautomatyzować konfigurację (CI, provisioning, zdalny bootstrap):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Albo podaj base URL lub model z kluczem API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` przyjmuje klucz modelu zwracany przez LM Studio (np. `qwen/qwen3.5-9b`), bez
prefiksu providera `lmstudio/`.

Onboarding nieinteraktywny wymaga `--lmstudio-api-key` (lub `LM_API_TOKEN` w env).
Dla nieuwierzytelnionych serwerów LM Studio działa dowolna niepusta wartość tokenu.

`--custom-api-key` nadal jest obsługiwane dla zgodności, ale dla LM Studio preferowane jest `--lmstudio-api-key`.

To zapisuje `models.providers.lmstudio`, ustawia model domyślny na
`lmstudio/<custom-model-id>` i zapisuje profil auth `lmstudio:default`.

Konfiguracja interaktywna może zapytać o opcjonalną preferowaną długość kontekstu ładowania i stosuje ją do wykrytych modeli LM Studio zapisywanych do konfiguracji.

## Konfiguracja

### Zgodność z użyciem streamingu

LM Studio jest zgodne z użyciem streamingu. Gdy nie emituje obiektu `usage`
w kształcie OpenAI, OpenClaw odzyskuje liczbę tokenów z metadanych
`timings.prompt_n` / `timings.predicted_n` w stylu llama.cpp.

To samo zachowanie dotyczy tych lokalnych backendów zgodnych z OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

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

### LM Studio nie zostało wykryte

Upewnij się, że LM Studio działa i że ustawiono `LM_API_TOKEN` (dla serwerów nieuwierzytelnionych działa dowolna niepusta wartość tokenu):

```bash
# Uruchom przez aplikację desktopową albo headless:
lms server start --port 1234
```

Sprawdź, czy API jest dostępne:

```bash
curl http://localhost:1234/api/v1/models
```

### Błędy uwierzytelniania (HTTP 401)

Jeśli konfiguracja zgłasza HTTP 401, zweryfikuj swój klucz API:

- Sprawdź, czy `LM_API_TOKEN` zgadza się z kluczem skonfigurowanym w LM Studio.
- Szczegóły konfiguracji auth LM Studio znajdziesz w [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).
- Jeśli Twój serwer nie wymaga uwierzytelniania, użyj dowolnej niepustej wartości tokenu dla `LM_API_TOKEN`.

### Ładowanie modeli just-in-time

LM Studio obsługuje ładowanie modeli just-in-time (JIT), w którym modele są ładowane przy pierwszym żądaniu. Upewnij się, że masz to włączone, aby uniknąć błędów typu „Model not loaded”.

## Powiązane

- [Wybór modelu](/pl/concepts/model-providers)
- [Ollama](/pl/providers/ollama)
- [Modele lokalne](/pl/gateway/local-models)
