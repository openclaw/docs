---
read_when:
    - Chcesz mieć jeden klucz API do czołowych otwartoźródłowych modeli LLM
    - Chcesz uruchamiać modele za pośrednictwem API DeepInfra w OpenClaw
summary: Użyj ujednoliconego API DeepInfra, aby uzyskać dostęp do najpopularniejszych modeli o otwartym kodzie źródłowym oraz najbardziej zaawansowanych modeli w OpenClaw.
title: DeepInfra
x-i18n:
    generated_at: "2026-05-06T09:26:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e68c3f764ac91548c2ced0b650e582f6d315ad7f154d19a00f299a3737494cd
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra udostępnia **ujednolicony interfejs API**, który kieruje żądania do najpopularniejszych modeli open source i frontier za pojedynczym
punktem końcowym i kluczem API. Jest zgodny z OpenAI, więc większość zestawów SDK OpenAI działa po zmianie bazowego adresu URL.

## Uzyskiwanie klucza API

1. Przejdź do [https://deepinfra.com/](https://deepinfra.com/)
2. Zaloguj się lub utwórz konto
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
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V3.2" },
    },
  },
}
```

## Obsługiwane powierzchnie OpenClaw

Dołączony plugin rejestruje wszystkie powierzchnie DeepInfra zgodne z bieżącymi
kontraktami dostawców OpenClaw:

| Powierzchnia             | Model domyślny                    | Konfiguracja/narzędzie OpenClaw                         |
| ------------------------ | ---------------------------------- | -------------------------------------------------------- |
| Czat / dostawca modelu   | `deepseek-ai/DeepSeek-V3.2`        | `agents.defaults.model`                                  |
| Generowanie/edycja obrazów | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| Rozumienie multimediów   | `moonshotai/Kimi-K2.5` dla obrazów | rozumienie obrazów przychodzących                        |
| Mowa na tekst            | `openai/whisper-large-v3-turbo`    | transkrypcja przychodzącego dźwięku                      |
| Tekst na mowę            | `hexgrad/Kokoro-82M`               | `messages.tts.provider: "deepinfra"`                     |
| Generowanie wideo        | `Pixverse/Pixverse-T2V`            | `video_generate`, `agents.defaults.videoGenerationModel` |
| Osadzenia pamięci        | `BAAI/bge-m3`                      | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra udostępnia także ponowne rankingowanie, klasyfikację, wykrywanie obiektów i inne
natywne typy modeli. OpenClaw nie ma obecnie pełnoprawnych kontraktów dostawców
dla tych kategorii, więc ten plugin jeszcze ich nie rejestruje.

## Dostępne modele

OpenClaw dynamicznie wykrywa dostępne modele DeepInfra podczas uruchamiania. Użyj
`/models deepinfra`, aby zobaczyć pełną listę dostępnych modeli.

Dowolny model dostępny na [DeepInfra.com](https://deepinfra.com/) może być użyty z prefiksem `deepinfra/`:

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
- Bazowy adres URL: `https://api.deepinfra.com/v1/openai`
- Natywne generowanie wideo używa `https://api.deepinfra.com/v1/inference/<model>`.

## Powiązane

- [Dostawcy modeli](/pl/concepts/model-providers)
- [Wszyscy dostawcy](/pl/providers/index)
