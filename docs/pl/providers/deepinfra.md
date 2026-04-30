---
read_when:
    - Chcesz mieć jeden klucz API do najlepszych otwartoźródłowych modeli LLM
    - Chcesz uruchamiać modele przez API DeepInfra w OpenClaw
summary: Użyj ujednoliconego API DeepInfra, aby uzyskać dostęp do najpopularniejszych modeli otwartoźródłowych i najbardziej zaawansowanych modeli w OpenClaw
x-i18n:
    generated_at: "2026-04-30T10:12:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22a178e7ac582e094f82f5779a9a963e0bf77b1b19820f74725255b6be0b0593
    source_path: providers/deepinfra.md
    workflow: 16
---

# DeepInfra

DeepInfra udostępnia **ujednolicone API**, które kieruje żądania do najpopularniejszych modeli open source i modeli frontier za jednym
endpointem i kluczem API. Jest zgodne z OpenAI, więc większość SDK OpenAI działa po zmianie bazowego URL.

## Uzyskiwanie klucza API

1. Przejdź do [https://deepinfra.com/](https://deepinfra.com/)
2. Zaloguj się lub utwórz konto
3. Przejdź do Dashboard / Keys i wygeneruj nowy klucz API albo użyj automatycznie utworzonego

## Konfiguracja CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

Lub ustaw zmienną środowiskową:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## Fragment konfiguracji

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V3.2" },
    },
  },
}
```

## Obsługiwane powierzchnie OpenClaw

Dołączony plugin rejestruje wszystkie powierzchnie DeepInfra zgodne z bieżącymi
kontraktami dostawców OpenClaw:

| Powierzchnia             | Model domyślny                     | Konfiguracja/narzędzie OpenClaw                         |
| ------------------------ | ---------------------------------- | -------------------------------------------------------- |
| Czat / dostawca modelu   | `deepseek-ai/DeepSeek-V3.2`        | `agents.defaults.model`                                  |
| Generowanie/edycja obrazów | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| Rozumienie multimediów   | `moonshotai/Kimi-K2.5` dla obrazów | rozumienie obrazów przychodzących                        |
| Mowa na tekst            | `openai/whisper-large-v3-turbo`    | transkrypcja audio przychodzącego                        |
| Tekst na mowę            | `hexgrad/Kokoro-82M`               | `messages.tts.provider: "deepinfra"`                     |
| Generowanie wideo        | `Pixverse/Pixverse-T2V`            | `video_generate`, `agents.defaults.videoGenerationModel` |
| Osadzenia pamięci        | `BAAI/bge-m3`                      | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra udostępnia także reranking, klasyfikację, wykrywanie obiektów i inne
natywne typy modeli. OpenClaw nie ma obecnie pełnoprawnych kontraktów dostawców
dla tych kategorii, więc ten plugin jeszcze ich nie rejestruje.

## Dostępne modele

OpenClaw dynamicznie wykrywa dostępne modele DeepInfra podczas uruchamiania. Użyj
`/models deepinfra`, aby zobaczyć pełną listę dostępnych modeli.

Każdego modelu dostępnego na [DeepInfra.com](https://deepinfra.com/) można użyć z prefiksem `deepinfra/`:

```
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/moonshotai/Kimi-K2.5
deepinfra/zai-org/GLM-5.1
...and many more
```

## Uwagi

- Odwołania do modeli mają postać `deepinfra/<provider>/<model>` (np. `deepinfra/Qwen/Qwen3-Max`).
- Model domyślny: `deepinfra/deepseek-ai/DeepSeek-V3.2`
- Bazowy URL: `https://api.deepinfra.com/v1/openai`
- Natywne generowanie wideo używa `https://api.deepinfra.com/v1/inference/<model>`.
