---
read_when:
    - Chcesz uzyskać embeddingi do wyszukiwania w pamięci z lokalnego modelu GGUF
    - Konfigurujesz memorySearch.provider = "local"
    - Wymagany jest Plugin OpenClaw, który jest właścicielem środowiska uruchomieniowego node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: Zainstaluj oficjalnego dostawcę llama.cpp dla lokalnych embeddingów pamięci GGUF
title: Dostawca llama.cpp
x-i18n:
    generated_at: "2026-06-27T17:54:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b0988c36c5ed5c61a7e97980df291fb43a0071e57c7460bf5a653f516114963
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` to oficjalny zewnętrzny Plugin dostawcy dla lokalnych osadzeń GGUF.
Jest właścicielem zależności środowiska uruchomieniowego `node-llama-cpp` używanej przez
`memorySearch.provider: "local"`.

Zainstaluj go przed użyciem lokalnych osadzeń pamięci:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Główny pakiet npm `openclaw` nie zawiera `node-llama-cpp`. Utrzymywanie
natywnej zależności w tym Plugin zapobiega usuwaniu ręcznie zainstalowanego środowiska uruchomieniowego w katalogu pakietu OpenClaw przez standardowe aktualizacje npm OpenClaw.

## Konfiguracja

Ustaw dostawcę wyszukiwania pamięci na `local`:

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

Domyślny model to `embeddinggemma-300m-qat-Q8_0.gguf`. Możesz także wskazać
`local.modelPath` na lokalny plik `.gguf`.

## Natywne środowisko uruchomieniowe

Użyj Node 24, aby uzyskać najsprawniejszą ścieżkę instalacji natywnej. Checkouty źródłowe używające pnpm
mogą wymagać zatwierdzenia i ponownego zbudowania natywnej zależności:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

Aby uzyskać lokalne osadzenia z mniejszym tarciem, użyj zamiast tego lokalnego dostawcy usług, takiego jak
Ollama lub LM Studio.
