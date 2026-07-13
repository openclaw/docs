---
read_when:
    - Вы хотите использовать Featherless AI с OpenClaw
    - Вам нужна переменная окружения с API-ключом Featherless или формат ссылки на модель
summary: Настройка Featherless AI, выбор модели и вызов инструментов
title: Featherless AI
x-i18n:
    generated_at: "2026-07-13T18:40:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 9112f7e65b4089bf96933c632d0b62f7fb87d42998d985ca85eb92dc392636b6
    source_path: providers/featherless.md
    workflow: 16
---

[Featherless AI](https://featherless.ai) предоставляет открытые модели через
API, совместимый с OpenAI. OpenClaw устанавливает Featherless как официальный внешний
плагин провайдера и сохраняет встроенный каталог небольшим, принимая во время выполнения
точные идентификаторы моделей из Featherless.

| Свойство                    | Значение                                 |
| --------------------------- | ---------------------------------------- |
| Идентификатор провайдера    | `featherless`                       |
| Пакет                       | `@openclaw/featherless-provider`                       |
| Переменная среды для аутентификации | `FEATHERLESS_API_KEY`               |
| Флаг первоначальной настройки | `--auth-choice featherless-api-key`                     |
| Прямой флаг CLI             | `--featherless-api-key <key>`                       |
| API                         | Совместимый с OpenAI (`openai-completions`) |
| Базовый URL                 | `https://api.featherless.ai/v1`                       |
| Модель по умолчанию         | `featherless/Qwen/Qwen3-32B`                       |

## Настройка

Установите плагин и перезапустите Gateway:

```bash
openclaw plugins install @openclaw/featherless-provider
openclaw gateway restart
```

Запустите первоначальную настройку:

```bash
openclaw onboard --auth-choice featherless-api-key
```

Для неинтерактивной настройки:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice featherless-api-key \
  --featherless-api-key "$FEATHERLESS_API_KEY"
```

Либо предоставьте ключ процессу Gateway:

```bash
export FEATHERLESS_API_KEY="<your-featherless-api-key>" # pragma: allowlist secret
```

Проверьте провайдера:

```bash
openclaw models list --provider featherless
```

## Модель по умолчанию

Плагин использует `Qwen/Qwen3-32B` как модель по умолчанию при настройке, поскольку в документации Featherless
указана встроенная поддержка вызова инструментов для семейства Qwen 3. OpenClaw настраивает для неё
окно контекста на 32 768 токенов, консервативный лимит вывода в 4 096 токенов и
элементы управления режимом рассуждений в шаблоне чата Qwen.

Поля стоимости в каталоге равны нулю, поскольку Featherless поддерживает несколько моделей оплаты,
а OpenClaw не встраивает зависящие от учётной записи тарифы плана или
стоимость запросов.

## Другие модели Featherless

Используйте точный идентификатор модели Featherless после префикса провайдера `featherless/`:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "featherless/moonshotai/Kimi-K2-Instruct",
      },
    },
  },
}
```

OpenClaw намеренно не копирует полный общедоступный индекс моделей Featherless
в средство выбора. Индекс велик и не предоставляет достаточно структурированных метаданных
о возможностях, чтобы безопасно классифицировать каждую текстовую, визуальную модель, модель эмбеддингов
и модель рассуждений. Поэтому неизвестные идентификаторы разрешаются с консервативными настройками
по умолчанию: только текст, без рассуждений, окно контекста на 4 096 токенов
и лимит вывода в 1 024 токена.

Добавьте явную запись модели провайдера, если модели требуются другие метаданные:

```json5
{
  models: {
    mode: "merge",
    providers: {
      featherless: {
        baseUrl: "https://api.featherless.ai/v1",
        apiKey: "${FEATHERLESS_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-3-27b-it",
            name: "Gemma 3 27B",
            input: ["text", "image"],
            reasoning: false,
            contextWindow: 32768,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

Перед добавлением пользовательских метаданных проверьте в каталоге моделей Featherless
актуальную доступность модели и теги возможностей.

## Устранение неполадок

- `401` или `403`: убедитесь, что `FEATHERLESS_API_KEY` доступна процессу Gateway,
  либо повторно запустите первоначальную настройку.
- Неизвестная модель: используйте точный идентификатор из Featherless с учётом регистра после
  префикса `featherless/`.
- Вызовы инструментов возвращаются как текст: выберите семейство моделей, для которого Featherless документирует
  встроенную поддержку вызова функций, например Qwen 3.
- Управляемый Gateway не видит ключ: поместите его в `~/.openclaw/.env` или другой
  источник переменных среды, загружаемый службой, затем перезапустите Gateway.

## Связанные материалы

- [Провайдеры моделей](/ru/concepts/model-providers)
- [Все провайдеры](/ru/providers/index)
- [Режимы рассуждений](/ru/tools/thinking)
