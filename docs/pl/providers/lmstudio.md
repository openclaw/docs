---
read_when:
    - Chcesz uruchomić OpenClaw z modelami open source za pośrednictwem LM Studio
    - Chcesz skonfigurować LM Studio
summary: Uruchamianie OpenClaw z LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-16T19:04:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21129dad2f1bf53fcf9474db2393fce7642b82f4f22e1770d9788547f08eca7f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio uruchamia lokalnie modele llama.cpp (GGUF) lub MLX jako aplikacja z interfejsem graficznym albo bezinterfejsowy demon `llmster`.
Instrukcje instalacji i dokumentację produktu można znaleźć na stronie [lmstudio.ai](https://lmstudio.ai/).

## Szybki start

<Steps>
  <Step title="Zainstaluj i uruchom serwer">
    Zainstaluj LM Studio (wersję komputerową) lub `llmster` (wersję bezinterfejsową), a następnie uruchom serwer:

    ```bash
    lms server start --port 1234
    ```

    Można też uruchomić demona bezinterfejsowego:

    ```bash
    lms daemon up
    ```

    W przypadku korzystania z aplikacji komputerowej należy włączyć JIT, aby zapewnić płynne ładowanie modeli; zobacz
    [przewodnik LM Studio dotyczący JIT i TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

  </Step>
  <Step title="Ustaw klucz API, jeśli uwierzytelnianie jest włączone">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    Jeśli uwierzytelnianie LM Studio jest wyłączone, podczas konfiguracji należy pozostawić klucz API pusty. Zobacz
    [Uwierzytelnianie LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

  </Step>
  <Step title="Uruchom konfigurację początkową">
    ```bash
    openclaw onboard
    ```

    Wybierz `LM Studio`, a następnie wybierz model po wyświetleniu monitu `Default model`.

    Podczas nowej konfiguracji z przewodnikiem OpenClaw najpierw odpytuje `/api/v1/models` na
    domyślnym lub skonfigurowanym hoście LM Studio. Istniejący model LLM jest oferowany w ramach
    tej samej sekwencji konfiguracji CLI/macOS i weryfikowany za pomocą rzeczywistego uzupełnienia przed
    zapisaniem konfiguracji. Automatyczne sprawdzenie nigdy nie pobiera modelu i
    ignoruje wpisy katalogu przeznaczone wyłącznie do osadzania.

  </Step>
</Steps>

Aby później zmienić model domyślny:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Klucze modeli LM Studio używają formatu `author/model-name` (np. `qwen/qwen3.5-9b`); odwołania do modeli OpenClaw
są poprzedzane nazwą dostawcy: `lmstudio/qwen/qwen3.5-9b`. Dokładny klucz modelu można znaleźć, uruchamiając
poniższe polecenie i sprawdzając pole `key`:

```bash
curl http://localhost:1234/api/v1/models
```

## Nieinteraktywna konfiguracja początkowa

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

Można też jawnie określić bazowy adres URL, model i klucz API:

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
prefiksu dostawcy `lmstudio/`. W przypadku serwerów z uwierzytelnianiem należy przekazać `--lmstudio-api-key` (lub ustawić `LM_API_TOKEN`);
w przypadku serwerów bez uwierzytelniania należy go pominąć, a OpenClaw zapisze zamiast niego lokalny znacznik niebędący sekretem.
`--custom-api-key` jest nadal obsługiwany w celu zachowania zgodności, ale preferowany jest `--lmstudio-api-key`.

Powoduje to zapisanie `models.providers.lmstudio` i ustawienie modelu domyślnego na `lmstudio/<custom-model-id>`.
Podanie klucza API powoduje również zapisanie profilu uwierzytelniania `lmstudio:default`.

Konfiguracja interaktywna może dodatkowo wyświetlić monit o preferowaną długość kontekstu ładowania i zastosować ją do
wykrytych modeli zapisywanych w konfiguracji.

## Konfiguracja

### Zgodność użycia podczas strumieniowania

LM Studio nie zawsze emituje obiekt `usage` zgodny z formatem OpenAI w odpowiedziach strumieniowych. OpenClaw
odzyskuje zamiast tego liczbę tokenów z metadanych `timings.prompt_n` / `timings.predicted_n` w stylu llama.cpp.
Ten sam mechanizm rezerwowy jest stosowany do każdego punktu końcowego zgodnego z OpenAI rozpoznanego jako lokalny
(host pętli zwrotnej), co obejmuje inne lokalne zaplecza, takie jak vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI
i text-generation-webui.

### Zgodność trybu rozumowania

Gdy mechanizm wykrywania `/api/v1/models` w LM Studio zgłasza opcje rozumowania specyficzne dla modelu, OpenClaw
udostępnia odpowiadające im wartości `reasoning_effort` (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`) w
metadanych zgodności modelu. Niektóre kompilacje LM Studio udostępniają binarną opcję interfejsu (`allowed_options: ["off",
"on"]`), jednocześnie odrzucając te dosłowne wartości w `/v1/chat/completions`; OpenClaw normalizuje ten
binarny format do sześciopoziomowej skali przed wysłaniem żądań, również w przypadku starszej zapisanej konfiguracji, która
nadal zawiera mapy rozumowania `off`/`on`.

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

LM Studio obsługuje ładowanie modeli just-in-time (JIT), czyli ładowanie ich przy pierwszym żądaniu. OpenClaw
domyślnie ładuje modele wstępnie za pośrednictwem natywnego punktu końcowego ładowania LM Studio, co jest pomocne, gdy JIT jest
wyłączone. Aby zamiast tego cyklem życia modelu zarządzały mechanizmy JIT, TTL bezczynności i automatycznego usuwania LM Studio,
należy wyłączyć etap wstępnego ładowania OpenClaw:

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

Należy użyć osiągalnego adresu hosta LM Studio, zachować `/v1` i upewnić się, że LM Studio nasłuchuje na tym
komputerze także poza interfejsem pętli zwrotnej:

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

`lmstudio` automatycznie ufa skonfigurowanemu punktowi końcowemu w przypadku żądań dotyczących modeli, w tym hostom
pętli zwrotnej, sieci LAN i tailnet (z wyjątkiem źródeł metadanych/link-local). Każdy niestandardowy/lokalny
wpis dostawcy zgodnego z OpenAI otrzymuje takie samo zaufanie do dokładnego źródła. Żądania kierowane do innego prywatnego hosta lub portu nadal
wymagają `models.providers.<id>.request.allowPrivateNetwork: true`; należy ustawić wartość `false`, aby zrezygnować z
domyślnego zaufania.

## Rozwiązywanie problemów

### LM Studio nie zostało wykryte

Należy upewnić się, że LM Studio jest uruchomione:

```bash
lms server start --port 1234
```

Jeśli uwierzytelnianie jest włączone, należy również ustawić `LM_API_TOKEN`. Należy sprawdzić, czy API jest dostępne:

```bash
curl http://localhost:1234/api/v1/models
```

### Błędy uwierzytelniania (HTTP 401)

- Należy sprawdzić, czy `LM_API_TOKEN` odpowiada kluczowi skonfigurowanemu w LM Studio.
- Zobacz [Uwierzytelnianie LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Jeśli serwer nie wymaga uwierzytelniania, podczas konfiguracji należy pozostawić klucz pusty.

## Powiązane materiały

- [Wybór modelu](/pl/concepts/model-providers)
- [Ollama](/pl/providers/ollama)
- [Modele lokalne](/pl/gateway/local-models)
