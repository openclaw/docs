---
read_when:
    - Вам потрібні embeddings для пошуку в пам’яті з локальної моделі GGUF
    - Ви налаштовуєте memorySearch.provider = "local"
    - Вам потрібен Plugin OpenClaw, який відповідає за середовище виконання node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: Установіть офіційний провайдер llama.cpp для локальних embedding-векторів пам’яті GGUF
title: Провайдер llama.cpp
x-i18n:
    generated_at: "2026-06-27T17:53:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b0988c36c5ed5c61a7e97980df291fb43a0071e57c7460bf5a653f516114963
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` є офіційним зовнішнім Plugin постачальника для локальних вбудовувань GGUF.
Він володіє runtime-залежністю `node-llama-cpp`, яку використовує
`memorySearch.provider: "local"`.

Установіть його перед використанням локальних вбудовувань пам’яті:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Основний npm-пакет `openclaw` не містить `node-llama-cpp`. Збереження
нативної залежності в цьому Plugin запобігає видаленню вручну встановленого runtime у каталозі пакета OpenClaw під час звичайних npm-оновлень OpenClaw.

## Конфігурація

Установіть постачальника пошуку в пам’яті на `local`:

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

Типова модель — `embeddinggemma-300m-qat-Q8_0.gguf`. Ви також можете вказати
`local.modelPath` на локальний файл `.gguf`.

## Нативний runtime

Використовуйте Node 24 для найзручнішого шляху встановлення нативних залежностей. Вихідні checkout’и, що використовують pnpm,
можуть потребувати схвалення та повторного складання нативної залежності:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

Для локальних вбудовувань із меншим тертям використовуйте локального сервісного постачальника, як-от
Ollama або LM Studio.
