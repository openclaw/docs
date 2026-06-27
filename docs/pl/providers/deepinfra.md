---
read_when:
    - Chcesz jednego klucza API do najlepszych modeli LLM o otwartym kodzie źródłowym
    - Chcesz uruchamiać modele przez API DeepInfra w OpenClaw
summary: Użyj ujednoliconego API DeepInfra, aby uzyskać dostęp do najpopularniejszych modeli open source i modeli frontier w OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-06-27T18:11:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 059a556c24d2de2c8c5290b54c78fbc7451dc534238bfc4c725dcfbbd9a2d17f
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra udostępnia **ujednolicone API**, które kieruje żądania do najpopularniejszych modeli open source i frontier za jednym
endpointem i kluczem API. Jest zgodne z OpenAI, więc większość SDK OpenAI działa po zmianie bazowego adresu URL.

## Zainstaluj Plugin

Zainstaluj oficjalny Plugin, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## Uzyskiwanie klucza API

1. Przejdź do [https://deepinfra.com/](https://deepinfra.com/)
2. Zaloguj się albo utwórz konto
3. Przejdź do Dashboard / Keys i wygeneruj nowy klucz API albo użyj automatycznie utworzonego

## Konfiguracja CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

Albo ustaw zmienną środowiskową:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## Fragment konfiguracji

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V4-Flash" },
    },
  },
}
```

## Obsługiwane powierzchnie OpenClaw

Plugin rejestruje wszystkie powierzchnie DeepInfra, które pasują do bieżących
kontraktów dostawców OpenClaw. Czat, generowanie obrazów i generowanie wideo
odświeżają swoje katalogi modeli na żywo z `/v1/openai/models?sort_by=openclaw&filter=with_meta`,
gdy skonfigurowano `DEEPINFRA_API_KEY`; pozostałe powierzchnie używają wyselekcjonowanych
statycznych wartości domyślnych poniżej.

| Powierzchnia             | Model domyślny                                                                                       | Konfiguracja/narzędzie OpenClaw                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Czat / dostawca modelu   | pierwszy wpis z tagiem czatu z katalogu na żywo (awaryjnie z manifestu `deepseek-ai/DeepSeek-V4-Flash`) | `agents.defaults.model`                                  |
| Generowanie/edycja obrazów | pierwszy wpis z tagiem `image-gen` z katalogu na żywo (statycznie awaryjnie `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Rozumienie multimediów   | `moonshotai/Kimi-K2.5` dla obrazów                                                                    | rozumienie obrazów przychodzących                        |
| Mowa na tekst            | `openai/whisper-large-v3-turbo`                                                                       | transkrypcja dźwięku przychodzącego                      |
| Tekst na mowę            | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| Generowanie wideo        | pierwszy wpis z tagiem `video-gen` z katalogu na żywo (statycznie awaryjnie `Pixverse/Pixverse-T2V`)  | `video_generate`, `agents.defaults.videoGenerationModel` |
| Embeddingi pamięci       | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra udostępnia także ponowne rankingowanie, klasyfikację, wykrywanie obiektów i inne
natywne typy modeli. OpenClaw obecnie nie ma pierwszorzędnych kontraktów dostawców
dla tych kategorii, więc ten Plugin jeszcze ich nie rejestruje.

## Dostępne modele

OpenClaw dynamicznie wykrywa dostępne modele DeepInfra podczas uruchamiania. Użyj
`/models deepinfra`, aby zobaczyć pełną listę dostępnych modeli.

Każdego modelu dostępnego na [DeepInfra.com](https://deepinfra.com/) można używać z prefiksem `deepinfra/`:

```
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...i wiele więcej
```

## Uwagi

- Referencje modeli mają postać `deepinfra/<provider>/<model>` (np. `deepinfra/Qwen/Qwen3-Max`).
- Model domyślny: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- Bazowy adres URL: `https://api.deepinfra.com/v1/openai`
- Natywne generowanie wideo używa `https://api.deepinfra.com/v1/inference/<model>`.

## Powiązane

- [Dostawcy modeli](/pl/concepts/model-providers)
- [Wszyscy dostawcy](/pl/providers/index)
