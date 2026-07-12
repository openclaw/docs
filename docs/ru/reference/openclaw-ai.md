---
read_when:
    - Вы хотите повторно использовать механизмы передачи данных моделей OpenClaw в другом приложении
    - Вы изменяете `packages/ai` или порты хоста транспорта ИИ
    - Вы проверяете, что релиз OpenClaw публикует в npm помимо корневого пакета
summary: 'Пакет npm @openclaw/ai: многократно используемые транспортные механизмы моделей, изолированные среды выполнения и порты политик хоста'
title: Пакет @openclaw/ai
x-i18n:
    generated_at: "2026-07-12T11:49:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 610057caae0a9bbf9f74074cda75fc40c0b9aa9d3441f8263151f08f1a3f35a8
    source_path: reference/openclaw-ai.md
    workflow: 16
---

`@openclaw/ai` — это публикуемая библиотечная форма слоя выполнения моделей OpenClaw: независимые от провайдера контракты сообщений, инструментов и потоковой передачи, валидация, диагностика, потоки событий, изолированный реестр среды выполнения и лениво загружаемые адаптеры для восьми встроенных семейств API (Anthropic Messages, OpenAI Completions, OpenAI Responses, Azure OpenAI Responses, ChatGPT/Codex Responses, Google Generative AI, Google Vertex, Mistral Conversations).

Она публикуется вместе с корневым пакетом `openclaw` при каждом выпуске и имеет ту же зафиксированную версию, а собственный `npm-shrinkwrap.json` фиксирует дерево транзитивных зависимостей во время установки. При установке `openclaw` соответствующий пакет `@openclaw/ai` устанавливается автоматически; пользователи библиотеки могут напрямую добавить его в зависимости без какого-либо кода приложения OpenClaw.

## Быстрый старт

```js
import { createLlmRuntime } from "@openclaw/ai";
import { registerBuiltInApiProviders } from "@openclaw/ai/providers";

const runtime = createLlmRuntime();
registerBuiltInApiProviders(runtime.registry);

const stream = runtime.streamSimple(model, { messages }, { apiKey });
for await (const event of stream) {
  if (event.type === "text_delta") process.stdout.write(event.delta);
}
const result = await stream.result();
```

Готовая к запуску версия находится в репозитории по адресу `examples/ai-chat`.

## Контракт проектирования

- **По умолчанию область действия ограничена экземпляром.** Импорт пакета ничего не регистрирует глобально. `createApiRegistry()` / `createLlmRuntime()` возвращают изолированные экземпляры; `registerBuiltInApiProviders(registry)` явно подключает встроенные транспорты к одному реестру. Модули SDK провайдеров загружаются лениво при первом использовании.
- **Политика хоста внедряется, а не встраивается.** Защита запросов `fetch` (например, политика SSRF), редактирование секретов в тексте повторного воспроизведения результатов инструментов, настройки строгого режима инструментов OpenAI по умолчанию и журналирование диагностики представлены портами `AiTransportHost`, которые настраиваются через `configureAiTransportHost`. Настройки библиотеки по умолчанию неактивны; OpenClaw устанавливает реальные реализации в своём фасаде потоковой передачи.
- **Единый тип потока событий.** `@openclaw/ai/event-stream` предоставляет канонический конструктор `EventStream`, общий для ядра OpenClaw, agent-core и внешних пользователей.
- **Подпути `internal/*` не являются API.** Они предназначены для самого приложения OpenClaw и не имеют гарантий семантического версионирования.
- Идентификаторы провайдеров, учётные данные, каталоги моделей, повторные попытки и переключение при сбое остаются ответственностью приложения. OpenClaw дополняет этот пакет соответствующими слоями; пользователь библиотеки передаёт объект `Model` и параметры напрямую.

## Экспорты подпутей

| Подпуть          | Содержимое                                                                          |
| ---------------- | ----------------------------------------------------------------------------------- |
| `.`              | Контракты, `createApiRegistry`, `createLlmRuntime`, `configureAiTransportHost`       |
| `./providers`    | `registerBuiltInApiProviders`, `resetApiProviders`                                  |
| `./types`        | Типы моделей, сообщений, инструментов и потоков                                     |
| `./validation`   | Валидация аргументов инструментов                                                    |
| `./diagnostics`  | Контракты диагностики                                                               |
| `./event-stream` | Общая реализация `EventStream`                                                       |
| `./internal/*`   | Внутренние компоненты OpenClaw без гарантий семантического версионирования           |
