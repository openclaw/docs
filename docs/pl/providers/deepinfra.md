---
read_when:
    - Chcesz jednego klucza API do najlepszych modeli LLM o otwartym kodzie źródłowym
    - Chcesz uruchamiać modele za pośrednictwem API DeepInfra w OpenClaw
summary: Użyj ujednoliconego API DeepInfra, aby uzyskać dostęp do najpopularniejszych modeli open source i modeli pionierskich w OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-07-12T15:34:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra kieruje żądania do popularnych modeli open source i modeli pionierskich za pośrednictwem jednego punktu końcowego zgodnego z OpenAI oraz jednego klucza API. Większość zestawów SDK OpenAI współpracuje z nim po zmianie bazowego adresu URL.

## Instalacja Pluginu

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## Uzyskiwanie klucza API

1. Zaloguj się w serwisie [deepinfra.com](https://deepinfra.com/)
2. Przejdź do Dashboard / Keys i wygeneruj klucz albo użyj klucza utworzonego automatycznie

## Konfiguracja za pomocą CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

Możesz też ustawić zmienną środowiskową:

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

## Obsługiwane obszary

Czat oraz generowanie obrazów i filmów odświeżają swoje katalogi modeli
na bieżąco z adresu `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta`
po skonfigurowaniu `DEEPINFRA_API_KEY`. Pozostałe obszary korzystają z poniższych
statycznych ustawień domyślnych, dopóki nie przejdą na ten sam katalog aktualizowany na bieżąco.

| Obszar                        | Model domyślny                                                                                                      | Konfiguracja/narzędzie OpenClaw                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Czat / dostawca modelu        | pierwszy wpis oznaczony jako czat w katalogu aktualizowanym na bieżąco (statyczny model rezerwowy: `deepseek-ai/DeepSeek-V4-Flash`) | `agents.defaults.model`                                  |
| Generowanie/edycja obrazów    | pierwszy wpis oznaczony jako `image-gen` w katalogu aktualizowanym na bieżąco (statyczny model rezerwowy: `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Rozumienie multimediów        | `moonshotai/Kimi-K2.5` dla obrazów                                                                                  | rozumienie obrazów przychodzących                        |
| Zamiana mowy na tekst         | `openai/whisper-large-v3-turbo`                                                                                     | transkrypcja przychodzącego dźwięku                      |
| Zamiana tekstu na mowę        | `hexgrad/Kokoro-82M`                                                                                                | `messages.tts.provider: "deepinfra"`                     |
| Generowanie filmów            | statyczny model rezerwowy `Pixverse/Pixverse-T2V` (obecnie DeepInfra nie udostępnia wpisów generowania filmów w katalogu aktualizowanym na bieżąco) | `video_generate`, `agents.defaults.videoGenerationModel` |
| Osadzenia pamięci             | `BAAI/bge-m3`                                                                                                       | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra udostępnia również ponowne szeregowanie, klasyfikację, wykrywanie obiektów
i inne natywne typy modeli. OpenClaw nie ma jeszcze kontraktu dostawcy dla tych
kategorii, dlatego ten Plugin ich nie rejestruje.

## Dostępne modele

Po skonfigurowaniu klucza OpenClaw dynamicznie wykrywa modele DeepInfra. Użyj
`/models deepinfra` lub `openclaw models list --provider deepinfra`, aby wyświetlić
aktualną listę.

Każdy model dostępny w serwisie [deepinfra.com](https://deepinfra.com/) działa z
prefiksem `deepinfra/`:

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...i wiele innych
```

## Uwagi

- Odwołania do modeli mają postać `deepinfra/<provider>/<model>` (na przykład `deepinfra/Qwen/Qwen3-Max`).
- Domyślny model czatu: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- Bazowy adres URL: `https://api.deepinfra.com/v1/openai`
- Natywne generowanie filmów korzysta z adresu `https://api.deepinfra.com/v1/inference/<model>`.

## Powiązane materiały

- [Dostawcy modeli](/pl/concepts/model-providers)
- [Wszyscy dostawcy](/pl/providers/index)
