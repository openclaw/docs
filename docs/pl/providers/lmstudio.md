---
read_when:
    - Chcesz uruchomić OpenClaw z modelami open source za pośrednictwem LM Studio
    - Chcesz skonfigurować LM Studio
summary: Uruchamianie OpenClaw z LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-12T15:34:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4223f90e786e285651fc889985dd61124c60758b4e9c3599d76201d9ac20b46
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio uruchamia lokalnie modele llama.cpp (GGUF) lub MLX jako aplikacja z interfejsem graficznym albo bezobsługowy demon `llmster`.
Instrukcje instalacji i dokumentację produktu znajdziesz na stronie [lmstudio.ai](https://lmstudio.ai/).

## Szybki start

<Steps>
  <Step title="Zainstaluj i uruchom serwer">
    Zainstaluj LM Studio (wersję na komputer) lub `llmster` (wersję bez interfejsu), a następnie uruchom serwer:

    ```bash
    lms server start --port 1234
    ```

    Możesz też uruchomić demona bez interfejsu:

    ```bash
    lms daemon up
    ```

    Jeśli używasz aplikacji na komputer, włącz JIT, aby zapewnić płynne ładowanie modeli; zobacz
    [przewodnik LM Studio dotyczący JIT i TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

  </Step>
  <Step title="Ustaw klucz API, jeśli uwierzytelnianie jest włączone">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    Jeśli uwierzytelnianie LM Studio jest wyłączone, podczas konfiguracji pozostaw klucz API pusty. Zobacz
    [Uwierzytelnianie w LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

  </Step>
  <Step title="Uruchom konfigurację początkową">
    ```bash
    openclaw onboard
    ```

    Wybierz `LM Studio`, a następnie model w monicie `Default model`.

  </Step>
</Steps>

Aby później zmienić model domyślny:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Klucze modeli LM Studio mają format `author/model-name` (np. `qwen/qwen3.5-9b`); odwołania do modeli w OpenClaw
są poprzedzone nazwą dostawcy: `lmstudio/qwen/qwen3.5-9b`. Aby znaleźć dokładny klucz modelu, uruchom
poniższe polecenie i sprawdź pole `key`:

```bash
curl http://localhost:1234/api/v1/models
```

## Nieinteraktywna konfiguracja początkowa

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

Możesz też jawnie określić bazowy adres URL, model i klucz API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

Opcja `--custom-model-id` przyjmuje klucz modelu zwrócony przez LM Studio (np. `qwen/qwen3.5-9b`), bez
prefiksu dostawcy `lmstudio/`. W przypadku serwerów wymagających uwierzytelniania przekaż `--lmstudio-api-key`
(lub ustaw `LM_API_TOKEN`); w przypadku serwerów niewymagających uwierzytelniania pomiń tę opcję, a OpenClaw
zapisze zamiast niej lokalny znacznik, który nie jest sekretem.
Opcja `--custom-api-key` jest nadal obsługiwana ze względu na zgodność, ale preferowana jest `--lmstudio-api-key`.

Spowoduje to zapisanie `models.providers.lmstudio` i ustawienie modelu domyślnego na `lmstudio/<custom-model-id>`.
Podanie klucza API spowoduje również zapisanie profilu uwierzytelniania `lmstudio:default`.

Konfiguracja interaktywna może dodatkowo poprosić o preferowaną długość kontekstu ładowania i zastosować ją do
wykrytych modeli zapisywanych w konfiguracji.

## Konfiguracja

### Zgodność strumieniowego raportowania użycia

LM Studio nie zawsze zwraca obiekt `usage` zgodny z formatem OpenAI w odpowiedziach strumieniowych. OpenClaw
odzyskuje zamiast tego liczbę tokenów z metadanych `timings.prompt_n` / `timings.predicted_n` w stylu llama.cpp.
Każdy punkt końcowy zgodny z OpenAI, rozpoznany jako lokalny punkt końcowy (host pętli zwrotnej), korzysta z tego
samego mechanizmu rezerwowego. Obejmuje to inne lokalne zaplecza, takie jak vLLM, SGLang, llama.cpp, LocalAI, Jan,
TabbyAPI i text-generation-webui.

### Zgodność trybu rozumowania

Gdy mechanizm wykrywania `/api/v1/models` w LM Studio zgłasza opcje rozumowania właściwe dla danego modelu,
OpenClaw udostępnia odpowiadające im wartości `reasoning_effort` (`none`, `minimal`, `low`, `medium`, `high`,
`xhigh`) w metadanych zgodności modelu. Niektóre wersje LM Studio udostępniają binarną opcję interfejsu
(`allowed_options: ["off", "on"]`), ale odrzucają te dosłowne wartości w `/v1/chat/completions`; przed wysłaniem
żądań OpenClaw normalizuje ten binarny format do sześciostopniowej skali. Dotyczy to również starszych zapisanych
konfiguracji, które nadal zawierają mapowania rozumowania `off`/`on`.

### Konfiguracja jawna

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

### Wyłączanie wstępnego ładowania

LM Studio obsługuje ładowanie modeli na żądanie (JIT), czyli przy pierwszym żądaniu. Domyślnie OpenClaw
wstępnie ładuje modele za pośrednictwem natywnego punktu końcowego ładowania LM Studio, co jest pomocne, gdy
JIT jest wyłączone. Aby zarządzanie cyklem życia modelu pozostawić mechanizmom JIT, TTL bezczynności i
automatycznego usuwania LM Studio, wyłącz etap wstępnego ładowania OpenClaw:

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

### Host w sieci LAN lub tailnet

Użyj dostępnego adresu hosta LM Studio, zachowaj `/v1` i upewnij się, że LM Studio na tym urządzeniu nasłuchuje
również poza interfejsem pętli zwrotnej:

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

`lmstudio` automatycznie uznaje skonfigurowany punkt końcowy za zaufany w przypadku żądań modeli, w tym hostów
pętli zwrotnej, sieci LAN i tailnet (z wyjątkiem źródeł metadanych oraz adresów lokalnych dla łącza). Każdy
niestandardowy lub lokalny wpis dostawcy zgodnego z OpenAI otrzymuje takie samo zaufanie dla dokładnego źródła.
Żądania do innego prywatnego hosta lub portu nadal wymagają ustawienia
`models.providers.<id>.request.allowPrivateNetwork: true`; ustaw wartość `false`, aby zrezygnować z domyślnego
zaufania.

## Rozwiązywanie problemów

### Nie wykryto LM Studio

Upewnij się, że LM Studio jest uruchomione:

```bash
lms server start --port 1234
```

Jeśli uwierzytelnianie jest włączone, ustaw również `LM_API_TOKEN`. Sprawdź, czy API jest dostępne:

```bash
curl http://localhost:1234/api/v1/models
```

### Błędy uwierzytelniania (HTTP 401)

- Sprawdź, czy `LM_API_TOKEN` odpowiada kluczowi skonfigurowanemu w LM Studio.
- Zobacz [Uwierzytelnianie w LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Jeśli serwer nie wymaga uwierzytelniania, podczas konfiguracji pozostaw klucz pusty.

## Powiązane materiały

- [Wybór modelu](/pl/concepts/model-providers)
- [Ollama](/pl/providers/ollama)
- [Modele lokalne](/pl/gateway/local-models)
