---
read_when:
    - Chcesz uruchomić OpenClaw z modelami o otwartym kodzie źródłowym za pośrednictwem LM Studio
    - Chcesz przygotować i skonfigurować LM Studio
summary: Uruchamianie OpenClaw z LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-05-02T22:22:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 814117ecbdc52cf67e921d0f0d67c4219f8bdc15fb8cf34b983cda775cba9b9e
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio to przyjazna, a zarazem rozbudowana aplikacja do uruchamiania modeli z otwartymi wagami na własnym sprzęcie. Pozwala uruchamiać modele llama.cpp (GGUF) lub MLX (Apple Silicon). Jest dostępna jako pakiet GUI albo bezgłowy daemon (`llmster`). Dokumentację produktu i konfiguracji znajdziesz na [lmstudio.ai](https://lmstudio.ai/).

## Szybki start

1. Zainstaluj LM Studio (desktop) lub `llmster` (bezzgłowo), a następnie uruchom lokalny serwer:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Uruchom serwer

Upewnij się, że uruchomiono aplikację desktopową albo daemon za pomocą tego polecenia:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Jeśli używasz aplikacji, upewnij się, że JIT jest włączone, aby uzyskać płynne działanie. Więcej informacji znajdziesz w [przewodniku LM Studio po JIT i TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. Jeśli uwierzytelnianie LM Studio jest włączone, ustaw `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Jeśli uwierzytelnianie LM Studio jest wyłączone, możesz pozostawić klucz API pusty podczas interaktywnej konfiguracji OpenClaw.

Szczegóły konfiguracji uwierzytelniania LM Studio znajdziesz w [Uwierzytelnianie LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. Uruchom onboarding i wybierz `LM Studio`:

```bash
openclaw onboard
```

5. W onboardingu użyj monitu `Default model`, aby wybrać model LM Studio.

Możesz też ustawić lub zmienić go później:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Klucze modeli LM Studio mają format `author/model-name` (np. `qwen/qwen3.5-9b`). Referencje modeli OpenClaw
dodają na początku nazwę dostawcy: `lmstudio/qwen/qwen3.5-9b`. Dokładny klucz modelu możesz znaleźć,
uruchamiając `curl http://localhost:1234/api/v1/models` i sprawdzając pole `key`.

## Onboarding nieinteraktywny

Użyj onboardingu nieinteraktywnego, gdy chcesz oskryptować konfigurację (CI, provisioning, zdalny bootstrap):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Albo podaj podstawowy URL, model i opcjonalny klucz API:

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
prefiksu dostawcy `lmstudio/`.

W przypadku uwierzytelnianych serwerów LM Studio przekaż `--lmstudio-api-key` albo ustaw `LM_API_TOKEN`.
W przypadku nieuwierzytelnianych serwerów LM Studio pomiń klucz; OpenClaw zapisze lokalny niepoufny znacznik.

`--custom-api-key` nadal jest obsługiwane dla zgodności, ale dla LM Studio preferowane jest `--lmstudio-api-key`.

To zapisuje `models.providers.lmstudio` i ustawia domyślny model na
`lmstudio/<custom-model-id>`. Gdy podasz klucz API, konfiguracja zapisze także
profil uwierzytelniania `lmstudio:default`.

Interaktywna konfiguracja może zapytać o opcjonalną preferowaną długość kontekstu ładowania i zastosować ją do wykrytych modeli LM Studio, które zapisuje w konfiguracji.
Konfiguracja pluginu LM Studio ufa skonfigurowanemu punktowi końcowemu LM Studio dla żądań modeli, w tym hostom loopback, LAN i tailnet. Możesz z tego zrezygnować, ustawiając `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## Konfiguracja

### Zgodność użycia w streamingu

LM Studio jest zgodne z użyciem w streamingu. Gdy nie emituje obiektu
`usage` w kształcie OpenAI, OpenClaw odzyskuje liczniki tokenów z metadanych w stylu llama.cpp:
`timings.prompt_n` / `timings.predicted_n`.

Takie samo zachowanie użycia w streamingu dotyczy tych lokalnych backendów zgodnych z OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Zgodność myślenia

Gdy wykrywanie `/api/v1/models` w LM Studio raportuje opcje rozumowania
specyficzne dla modelu, OpenClaw udostępnia pasujące wartości `reasoning_effort`
zgodne z OpenAI w metadanych zgodności modelu. Obecne kompilacje LM Studio mogą reklamować binarne
opcje UI, takie jak `allowed_options: ["off", "on"]`, jednocześnie odrzucając te wartości
w `/v1/chat/completions`; OpenClaw normalizuje ten binarny kształt wykrywania do
`none`, `minimal`, `low`, `medium`, `high` i `xhigh` przed wysłaniem żądań.
Starsza zapisana konfiguracja LM Studio, która zawiera mapy rozumowania `off`/`on`, jest
normalizowana w taki sam sposób podczas ładowania katalogu.

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

Upewnij się, że LM Studio działa. Jeśli uwierzytelnianie jest włączone, ustaw także `LM_API_TOKEN`:

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

Sprawdź, czy API jest dostępne:

```bash
curl http://localhost:1234/api/v1/models
```

### Błędy uwierzytelniania (HTTP 401)

Jeśli konfiguracja zgłasza HTTP 401, zweryfikuj swój klucz API:

- Sprawdź, czy `LM_API_TOKEN` pasuje do klucza skonfigurowanego w LM Studio.
- Szczegóły konfiguracji uwierzytelniania LM Studio znajdziesz w [Uwierzytelnianie LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Jeśli serwer nie wymaga uwierzytelniania, pozostaw klucz pusty podczas konfiguracji.

### Ładowanie modelu just-in-time

LM Studio obsługuje ładowanie modeli just-in-time (JIT), w którym modele są ładowane przy pierwszym żądaniu. OpenClaw domyślnie wstępnie ładuje modele przez natywny punkt końcowy ładowania LM Studio, co pomaga, gdy JIT jest wyłączone. Aby pozwolić, by JIT, bezczynny TTL i automatyczne usuwanie LM Studio zarządzały cyklem życia modelu, wyłącz krok wstępnego ładowania OpenClaw:

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

### Host LM Studio w LAN lub tailnet

Użyj osiągalnego adresu hosta LM Studio, zachowaj `/v1` i upewnij się, że LM Studio na tej maszynie jest powiązane poza loopback:

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

W przeciwieństwie do ogólnych dostawców zgodnych z OpenAI, `lmstudio` automatycznie ufa skonfigurowanemu lokalnemu/prywatnemu punktowi końcowemu dla chronionych żądań modeli. Niestandardowe identyfikatory dostawców loopback, takie jak `localhost` lub `127.0.0.1`, są także automatycznie zaufane; dla niestandardowych identyfikatorów dostawców LAN, tailnet lub prywatnego DNS ustaw jawnie `models.providers.<id>.request.allowPrivateNetwork: true`.

## Powiązane

- [Wybór modelu](/pl/concepts/model-providers)
- [Ollama](/pl/providers/ollama)
- [Modele lokalne](/pl/gateway/local-models)
