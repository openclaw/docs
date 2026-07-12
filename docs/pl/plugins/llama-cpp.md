---
read_when:
    - Chcesz uzyskiwać osadzenia do przeszukiwania pamięci z lokalnego modelu GGUF
    - Konfigurujesz memorySearch.provider = "local"
    - Potrzebujesz pluginu OpenClaw, który zarządza środowiskiem wykonawczym node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: Zainstaluj oficjalnego dostawcę llama.cpp do lokalnych osadzeń pamięci GGUF
title: Dostawca llama.cpp
x-i18n:
    generated_at: "2026-07-12T15:25:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 369ec199e8493356912337b849a84f829672e8872d17083c9a597f4e5294ebd5
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` jest oficjalnym zewnętrznym pluginem dostawcy lokalnych osadzeń GGUF. Rejestruje identyfikator dostawcy osadzeń `local` i jest właścicielem zależności środowiska uruchomieniowego `node-llama-cpp` używanej przez `memorySearch.provider: "local"`.

Zainstaluj go przed użyciem lokalnych osadzeń pamięci:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Główny pakiet npm `openclaw` nie zawiera `node-llama-cpp`. Przechowywanie natywnej zależności w tym pluginie zapobiega usuwaniu ręcznie zainstalowanego środowiska uruchomieniowego z katalogu pakietu OpenClaw podczas zwykłych aktualizacji OpenClaw przez npm.

## Konfiguracja

Ustaw `memorySearch.provider` na `local`:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        local: {
          modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

Domyślną wartością `local.modelPath` jest identyfikator URI `hf:` pokazany powyżej (`embeddinggemma-300m-qat-Q8_0.gguf`). Wskaż inny identyfikator URI `hf:` lub lokalny plik `.gguf`, aby użyć innego modelu. `local.modelCacheDir` zastępuje lokalizację buforowania pobranych modeli (domyślnie: `~/.node-llama-cpp/models`), a `local.contextSize` przyjmuje liczbę całkowitą lub `"auto"`.

Gdy `local.contextSize` ma wartość liczbową, dostawca przekazuje to wymaganie również mechanizmowi automatycznego rozmieszczania warstw na GPU w node-llama-cpp. Dzięki temu node-llama-cpp może dopasować model i kontekst osadzeń łącznie, zachowując mechanizmy kontroli bezpieczeństwa pamięci. W przypadku wartości `"auto"` node-llama-cpp zachowuje standardowe automatyczne rozmieszczanie.

## Natywne środowisko uruchomieniowe

Użyj Node 24, aby zapewnić najsprawniejszy proces instalacji natywnej. W kopiach kodu źródłowego korzystających z pnpm może być konieczne zatwierdzenie i ponowne zbudowanie natywnej zależności:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## Diagnostyka środowiska uruchomieniowego

Po załadowaniu dostawcy uruchom `openclaw memory status --deep`, aby sprawdzić wybrane zaplecze i kompilację, nazwy urządzeń, warstwy przeniesione na GPU, żądany rozmiar kontekstu oraz ostatnio zarejestrowany stan pamięci VRAM lub pamięci współdzielonej. Wartości VRAM zawierają znacznik czasu obserwacji, ponieważ pasywny odczyt stanu nie przeładowuje modelu ani nie odpytuje urządzenia.

Te same ostatnio znane informacje mogą pojawić się w `openclaw doctor`, jeśli działający Gateway używał już lokalnego dostawcy. Zwykłe polecenie sprawdzania stanu lub diagnostyki nie ładuje modelu wyłącznie w celu zebrania danych diagnostycznych.

## Rozwiązywanie problemów

Jeśli brakuje `node-llama-cpp` lub nie można go załadować, OpenClaw zgłasza błąd wraz z następującymi instrukcjami:

1. Zainstaluj plugin: `openclaw plugins install @openclaw/llama-cpp-provider`.
2. Używaj Node 24 do natywnych instalacji i aktualizacji.
3. W kopii kodu źródłowego korzystającej z pnpm uruchom `pnpm approve-builds`, a następnie `pnpm rebuild node-llama-cpp`.

Aby korzystać z lokalnych osadzeń z mniejszą liczbą komplikacji i bez etapu kompilacji natywnej, ustaw zamiast tego `memorySearch.provider` na zdalnego dostawcę osadzeń, takiego jak `lmstudio`, `ollama`, `openai` lub `voyage`.
