---
read_when:
    - Chcesz uruchamiać OpenClaw z modelami open source za pomocą LM Studio
    - Chcesz przygotować i skonfigurować LM Studio
summary: Uruchamianie OpenClaw z LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-30T10:13:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d1feadf355579b244ab4187a8d3b8bad661a5605aed906eedf361d6fcae3f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio to przyjazna, a jednocześnie wydajna aplikacja do uruchamiania modeli o otwartych wagach na własnym sprzęcie. Pozwala uruchamiać modele llama.cpp (GGUF) lub MLX (Apple Silicon). Jest dostępna jako pakiet GUI albo demon bez interfejsu graficznego (`llmster`). Dokumentację produktu i konfiguracji znajdziesz na [lmstudio.ai](https://lmstudio.ai/).

## Szybki start

1. Zainstaluj LM Studio (wersja desktopowa) albo `llmster` (bez interfejsu graficznego), a następnie uruchom lokalny serwer:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Uruchom serwer

Upewnij się, że uruchomiono aplikację desktopową albo demon za pomocą następującego polecenia:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Jeśli używasz aplikacji, upewnij się, że masz włączone JIT, aby uzyskać płynne działanie. Więcej informacji znajdziesz w [przewodniku po JIT i TTL w LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. Jeśli uwierzytelnianie LM Studio jest włączone, ustaw `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Jeśli uwierzytelnianie LM Studio jest wyłączone, możesz pozostawić klucz API pusty podczas interaktywnej konfiguracji OpenClaw.

Szczegóły konfiguracji uwierzytelniania LM Studio znajdziesz w [Uwierzytelnianiu LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. Uruchom onboarding i wybierz `LM Studio`:

```bash
openclaw onboard
```

5. Podczas onboardingu użyj monitu `Default model`, aby wybrać model LM Studio.

Możesz też ustawić lub zmienić go później:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Klucze modeli LM Studio mają format `author/model-name` (np. `qwen/qwen3.5-9b`). Referencje modeli OpenClaw
dodają przedrostek z nazwą dostawcy: `lmstudio/qwen/qwen3.5-9b`. Dokładny klucz modelu można znaleźć,
uruchamiając `curl http://localhost:1234/api/v1/models` i sprawdzając pole `key`.

## Nieinteraktywny onboarding

Użyj nieinteraktywnego onboardingu, gdy chcesz oskryptować konfigurację (CI, provisioning, zdalny bootstrap):

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

`--custom-model-id` przyjmuje klucz modelu zwrócony przez LM Studio (np. `qwen/qwen3.5-9b`), bez
przedrostka dostawcy `lmstudio/`.

W przypadku serwerów LM Studio z uwierzytelnianiem przekaż `--lmstudio-api-key` albo ustaw `LM_API_TOKEN`.
W przypadku serwerów LM Studio bez uwierzytelniania pomiń klucz; OpenClaw zapisze lokalny marker niebędący sekretem.

`--custom-api-key` pozostaje obsługiwane dla zgodności, ale dla LM Studio preferowane jest `--lmstudio-api-key`.

To zapisuje `models.providers.lmstudio` i ustawia domyślny model na
`lmstudio/<custom-model-id>`. Gdy podasz klucz API, konfiguracja zapisuje też profil uwierzytelniania
`lmstudio:default`.

Interaktywna konfiguracja może zapytać o opcjonalną preferowaną długość kontekstu ładowania i zastosuje ją do wykrytych modeli LM Studio zapisywanych w konfiguracji.
Konfiguracja Plugin LM Studio ufa skonfigurowanemu endpointowi LM Studio dla żądań modeli, w tym hostom loopback, LAN i tailnet. Możesz z tego zrezygnować, ustawiając `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## Konfiguracja

### Zgodność użycia strumieniowania

LM Studio jest zgodne z użyciem strumieniowania. Gdy nie emituje obiektu
`usage` w formacie OpenAI, OpenClaw odtwarza liczniki tokenów z metadanych
`timings.prompt_n` / `timings.predicted_n` w stylu llama.cpp.

To samo zachowanie użycia strumieniowania dotyczy tych lokalnych backendów zgodnych z OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Zgodność myślenia

Gdy wykrywanie `/api/v1/models` w LM Studio zgłasza specyficzne dla modelu
opcje rozumowania, OpenClaw zachowuje te natywne wartości w metadanych zgodności modelu. W przypadku
binarnych modeli myślenia, które deklarują `allowed_options: ["off", "on"]`,
OpenClaw mapuje wyłączone myślenie na `off`, a włączone poziomy `/think` na `on`
zamiast wysyłać wartości dostępne tylko w OpenAI, takie jak `low` czy `medium`.

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

Jeśli konfiguracja zgłasza HTTP 401, sprawdź klucz API:

- Sprawdź, czy `LM_API_TOKEN` odpowiada kluczowi skonfigurowanemu w LM Studio.
- Szczegóły konfiguracji uwierzytelniania LM Studio znajdziesz w [Uwierzytelnianiu LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Jeśli serwer nie wymaga uwierzytelniania, pozostaw klucz pusty podczas konfiguracji.

### Ładowanie modeli just-in-time

LM Studio obsługuje ładowanie modeli just-in-time (JIT), w którym modele są ładowane przy pierwszym żądaniu. Upewnij się, że ta funkcja jest włączona, aby uniknąć błędów 'Model not loaded'.

### Host LM Studio w sieci LAN lub tailnet

Użyj osiągalnego adresu hosta LM Studio, zachowaj `/v1` i upewnij się, że LM Studio na tej maszynie jest powiązane nie tylko z loopback:

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

W przeciwieństwie do ogólnych dostawców zgodnych z OpenAI, `lmstudio` automatycznie ufa skonfigurowanemu lokalnemu/prywatnemu endpointowi dla chronionych żądań modeli. Identyfikatory niestandardowych dostawców loopback, takie jak `localhost` czy `127.0.0.1`, również są automatycznie zaufane; dla niestandardowych identyfikatorów dostawców LAN, tailnet lub prywatnego DNS ustaw jawnie `models.providers.<id>.request.allowPrivateNetwork: true`.

## Powiązane

- [Wybór modelu](/pl/concepts/model-providers)
- [Ollama](/pl/providers/ollama)
- [Modele lokalne](/pl/gateway/local-models)
