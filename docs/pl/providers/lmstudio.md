---
read_when:
    - Chcesz uruchomić OpenClaw z modelami otwartoźródłowymi przez LM Studio
    - Chcesz skonfigurować LM Studio
summary: Uruchom OpenClaw z LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-06-27T18:13:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20dff6e3156edf0e840c5450999bc511ba168b23692494c9030bfb946936ae40
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio to przyjazna, a zarazem wydajna aplikacja do uruchamiania modeli o otwartych wagach na własnym sprzęcie. Umożliwia uruchamianie modeli llama.cpp (GGUF) lub MLX (Apple Silicon). Jest dostępna jako pakiet GUI albo demon bez interfejsu (`llmster`). Dokumentację produktu i konfiguracji znajdziesz na [lmstudio.ai](https://lmstudio.ai/).

## Szybki start

1. Zainstaluj LM Studio (desktop) albo `llmster` (bez interfejsu), a następnie uruchom lokalny serwer:

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

Jeśli używasz aplikacji, upewnij się, że JIT jest włączone, aby zapewnić płynne działanie. Dowiedz się więcej w [przewodniku po JIT i TTL w LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. Jeśli uwierzytelnianie LM Studio jest włączone, ustaw `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Jeśli uwierzytelnianie LM Studio jest wyłączone, możesz zostawić klucz API pusty podczas interaktywnej konfiguracji OpenClaw.

Szczegóły konfiguracji uwierzytelniania LM Studio znajdziesz w [Uwierzytelnianiu LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. Uruchom wdrażanie i wybierz `LM Studio`:

```bash
openclaw onboard
```

5. Podczas wdrażania użyj monitu `Default model`, aby wybrać model LM Studio.

Możesz też ustawić lub zmienić go później:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Klucze modeli LM Studio mają format `author/model-name` (np. `qwen/qwen3.5-9b`). Referencje modeli OpenClaw
dodają na początku nazwę dostawcy: `lmstudio/qwen/qwen3.5-9b`. Dokładny klucz
modelu możesz znaleźć, uruchamiając `curl http://localhost:1234/api/v1/models` i sprawdzając pole `key`.

## Wdrażanie nieinteraktywne

Użyj wdrażania nieinteraktywnego, gdy chcesz oskryptować konfigurację (CI, provisioning, zdalny bootstrap):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Albo podaj bazowy URL, model i opcjonalny klucz API:

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
prefiksu dostawcy `lmstudio/`.

W przypadku uwierzytelnianych serwerów LM Studio przekaż `--lmstudio-api-key` albo ustaw `LM_API_TOKEN`.
W przypadku nieuwierzytelnianych serwerów LM Studio pomiń klucz; OpenClaw zapisze lokalny, niepoufny znacznik.

`--custom-api-key` pozostaje obsługiwane ze względu na kompatybilność, ale dla LM Studio preferowane jest `--lmstudio-api-key`.

To zapisuje `models.providers.lmstudio` i ustawia model domyślny na
`lmstudio/<custom-model-id>`. Gdy podasz klucz API, konfiguracja zapisuje także
profil uwierzytelniania `lmstudio:default`.

Konfiguracja interaktywna może zapytać o opcjonalną preferowaną długość kontekstu ładowania i stosuje ją do odkrytych modeli LM Studio zapisywanych w konfiguracji.
Konfiguracja Plugin LM Studio ufa skonfigurowanemu punktowi końcowemu LM Studio dla żądań modeli, w tym hostom loopback, LAN i tailnet. Źródła metadata/link-local nadal wymagają jawnego włączenia. Możesz z tego zrezygnować, ustawiając `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## Konfiguracja

### Kompatybilność użycia strumieniowego

LM Studio jest zgodne z użyciem strumieniowym. Gdy nie emituje obiektu
`usage` w kształcie OpenAI, OpenClaw odtwarza liczniki tokenów z metadanych w stylu llama.cpp:
`timings.prompt_n` / `timings.predicted_n`.

To samo zachowanie użycia strumieniowego dotyczy tych lokalnych backendów zgodnych z OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Kompatybilność myślenia

Gdy wykrywanie LM Studio przez `/api/v1/models` zgłasza opcje rozumowania
specyficzne dla modelu, OpenClaw ujawnia odpowiadające im wartości `reasoning_effort`
zgodne z OpenAI w metadanych kompatybilności modelu. Obecne kompilacje LM Studio mogą reklamować binarne
opcje UI, takie jak `allowed_options: ["off", "on"]`, jednocześnie odrzucając te wartości
w `/v1/chat/completions`; OpenClaw normalizuje ten binarny kształt wykrywania do
`none`, `minimal`, `low`, `medium`, `high` i `xhigh` przed wysłaniem żądań.
Starsza zapisana konfiguracja LM Studio zawierająca mapy rozumowania `off`/`on` jest
normalizowana w ten sam sposób podczas ładowania katalogu.

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
- Jeśli serwer nie wymaga uwierzytelniania, zostaw klucz pusty podczas konfiguracji.

### Ładowanie modelu just-in-time

LM Studio obsługuje ładowanie modeli just-in-time (JIT), w którym modele są ładowane przy pierwszym żądaniu. OpenClaw domyślnie wstępnie ładuje modele przez natywny punkt końcowy ładowania LM Studio, co pomaga, gdy JIT jest wyłączone. Aby cykl życia modelu był zarządzany przez JIT, bezczynny TTL i automatyczne eksmitowanie LM Studio, wyłącz krok wstępnego ładowania OpenClaw:

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

`lmstudio` automatycznie ufa skonfigurowanemu lokalnemu/prywatnemu punktowi końcowemu dla chronionych żądań modeli. Niestandardowe/lokalne wpisy dostawców zgodnych z OpenAI także ufają dokładnie skonfigurowanemu źródłu `baseUrl`, z wyjątkiem źródeł metadata/link-local; żądania do innych prywatnych portów lub miejsc docelowych nadal wymagają `models.providers.<id>.request.allowPrivateNetwork: true`. Ustaw `models.providers.<id>.request.allowPrivateNetwork: false`, aby zrezygnować z zaufania do dokładnego źródła.

## Powiązane

- [Wybór modelu](/pl/concepts/model-providers)
- [Ollama](/pl/providers/ollama)
- [Modele lokalne](/pl/gateway/local-models)
