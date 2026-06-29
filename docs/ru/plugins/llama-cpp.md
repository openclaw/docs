---
read_when:
    - Вам нужны эмбеддинги для поиска в памяти из локальной модели GGUF
    - Вы настраиваете memorySearch.provider = "local"
    - Вам нужен Plugin OpenClaw, которому принадлежит среда выполнения node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: Установите официальный провайдер llama.cpp для локальных эмбеддингов памяти GGUF
title: Провайдер llama.cpp
x-i18n:
    generated_at: "2026-06-28T23:18:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b0988c36c5ed5c61a7e97980df291fb43a0071e57c7460bf5a653f516114963
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` — официальный внешний Plugin-провайдер для локальных GGUF-эмбеддингов.
Он владеет runtime-зависимостью `node-llama-cpp`, используемой
`memorySearch.provider: "local"`.

Установите его перед использованием локальных эмбеддингов памяти:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Основной npm-пакет `openclaw` не включает `node-llama-cpp`. Хранение
нативной зависимости в этом Plugin предотвращает удаление вручную установленного
runtime внутри каталога пакета OpenClaw при обычных npm-обновлениях OpenClaw.

## Конфигурация

Задайте провайдер поиска по памяти как `local`:

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

Модель по умолчанию — `embeddinggemma-300m-qat-Q8_0.gguf`. Также можно указать
в `local.modelPath` локальный файл `.gguf`.

## Нативный Runtime

Используйте Node 24 для наиболее гладкого пути установки нативных зависимостей.
Исходные checkout-копии, использующие pnpm, могут потребовать одобрения и
пересборки нативной зависимости:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

Для локальных эмбеддингов с меньшими трудозатратами используйте локальный
сервисный провайдер, например Ollama или LM Studio.
