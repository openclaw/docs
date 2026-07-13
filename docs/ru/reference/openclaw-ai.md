---
read_when:
    - Вы хотите повторно использовать транспортные механизмы моделей OpenClaw в другом приложении
    - Вы изменяете packages/ai или порты хоста транспорта ИИ
    - Вы проверяете, что релиз OpenClaw публикует в npm помимо корневого пакета
summary: 'Пакет npm @openclaw/ai: переиспользуемые транспорты моделей, изолированные среды выполнения и порты политик хоста'
title: Пакет @openclaw/ai
x-i18n:
    generated_at: "2026-07-13T18:45:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 610057caae0a9bbf9f74074cda75fc40c0b9aa9d3441f8263151f08f1a3f35a8
    source_path: reference/openclaw-ai.md
    workflow: 16
---

`@openclaw/ai` — это публикуемая библиотечная форма слоя выполнения моделей OpenClaw:
нейтральные к провайдеру контракты сообщений, инструментов и потоковой передачи, валидация, диагностика,
потоки событий, изолированный реестр среды выполнения и лениво загружаемые адаптеры для восьми
встроенных семейств API (Anthropic Messages, OpenAI Completions, OpenAI
Responses, Azure OpenAI Responses, ChatGPT/Codex Responses, Google Generative
AI, Google Vertex, Mistral Conversations).

Она публикуется вместе с корневым пакетом `openclaw` при каждом выпуске и закрепляется
на той же версии, а собственный `npm-shrinkwrap.json` обеспечивает фиксацию дерева транзитивных
зависимостей во время установки. При установке `openclaw` соответствующий
`@openclaw/ai` устанавливается автоматически; потребители библиотеки могут напрямую добавить его
как зависимость без какого-либо кода приложения OpenClaw.

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

## Архитектурный контракт

- **По умолчанию область действия ограничена экземпляром.** Импорт пакета ничего
  не регистрирует глобально. `createApiRegistry()` / `createLlmRuntime()` возвращают изолированные
  экземпляры; `registerBuiltInApiProviders(registry)` подключает встроенные транспорты
  к одному реестру. Модули SDK провайдеров загружаются лениво при первом использовании.
- **Политика хоста внедряется, а не включается в комплект.** Защита запросов fetch (например,
  политика SSRF), сокрытие секретов в тексте повторно воспроизводимых результатов инструментов, стандартные
  настройки строгого режима инструментов OpenAI и журналирование диагностики — это порты `AiTransportHost`,
  настраиваемые с помощью `configureAiTransportHost`. Настройки библиотеки по умолчанию неактивны;
  OpenClaw устанавливает реальные реализации в своём фасаде потоковой передачи.
- **Единая идентичность потока событий.** `@openclaw/ai/event-stream` — канонический
  конструктор `EventStream`, общий для ядра OpenClaw, agent-core и внешних
  потребителей.
- **Подпути `internal/*` не являются API.** Они предназначены для самого приложения
  OpenClaw и не имеют гарантий semver.
- Идентификаторы провайдеров, учётные данные, каталоги моделей, повторные попытки и переключение при сбое остаются
  задачами приложения. OpenClaw реализует эти уровни вокруг данного пакета; потребитель
  библиотеки передаёт объект `Model` и параметры напрямую.

## Экспортируемые подпути

| Подпуть          | Содержимое                                                                       |
| ---------------- | ------------------------------------------------------------------------------ |
| `.`              | Контракты, `createApiRegistry`, `createLlmRuntime`, `configureAiTransportHost` |
| `./providers`    | `registerBuiltInApiProviders`, `resetApiProviders`                             |
| `./types`        | Типы моделей, сообщений, инструментов и потоков                                                |
| `./validation`   | Валидация аргументов инструментов                                                       |
| `./diagnostics`  | Контракты диагностики                                                          |
| `./event-stream` | Общая реализация `EventStream`                                            |
| `./internal/*`   | Внутренний компонент OpenClaw, без гарантий semver                                         |
