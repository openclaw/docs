---
read_when:
    - Вы хотите использовать DeepSeek с OpenClaw
    - Вам нужна переменная окружения с API-ключом или вариант аутентификации через CLI
summary: Настройка DeepSeek (аутентификация и выбор модели)
title: DeepSeek
x-i18n:
    generated_at: "2026-07-12T11:46:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77e074756d593205d7d05f499da93b9bd3c63acdce7092b42fb5562023577925
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) предоставляет мощные модели ИИ через API, совместимый с OpenAI.

| Свойство  | Значение                   |
| ---------- | -------------------------- |
| Провайдер  | `deepseek`                 |
| Авторизация | `DEEPSEEK_API_KEY`        |
| API        | Совместимый с OpenAI       |
| Базовый URL | `https://api.deepseek.com` |

## Установка плагина

Установите официальный плагин, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## Начало работы

<Steps>
  <Step title="Получите ключ API">
    Создайте ключ API на странице [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Запустите первоначальную настройку">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Запрашивает ключ API и устанавливает `deepseek/deepseek-v4-flash` в качестве модели по умолчанию.

  </Step>
  <Step title="Убедитесь, что модели доступны">
    ```bash
    openclaw models list --provider deepseek
    ```

    Чтобы просмотреть статический каталог плагина без запущенного Gateway:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Неинтерактивная настройка">
    Для автоматизированных установок или установок без графического интерфейса передайте все флаги напрямую:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Если Gateway работает как демон (launchd/systemd), убедитесь, что `DEEPSEEK_API_KEY`
доступна этому процессу (например, в `~/.openclaw/.env` или через
`env.shellEnv`).
</Warning>

## Встроенный каталог

| Ссылка на модель             | Название          | Входные данные | Контекст  | Максимальный вывод | Примечания                                                |
| ---------------------------- | ----------------- | -------------- | --------- | ------------------ | --------------------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | текст          | 1 000 000 | 384 000            | Модель по умолчанию; поверхность V4 с поддержкой мышления |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | текст          | 1 000 000 | 384 000            | Поверхность V4 с поддержкой мышления                      |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | текст          | 1 000 000 | 384 000            | Устаревшее совместимое имя V4 Flash без мышления          |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | текст          | 1 000 000 | 384 000            | Устаревшее совместимое имя V4 Flash с мышлением           |

<Warning>
DeepSeek прекратит поддержку `deepseek-chat` и `deepseek-reasoner` 24 июля 2026 года
в 15:59 UTC. Сейчас они направляются на DeepSeek V4 Flash в режимах без мышления и
с мышлением соответственно. До указанного срока замените настроенные ссылки на модели
на `deepseek/deepseek-v4-flash` или `deepseek/deepseek-v4-pro`.
</Warning>

Локальные оценки стоимости OpenClaw соответствуют опубликованным DeepSeek тарифам
для попаданий в кеш, промахов кеша и вывода. DeepSeek может изменять эти тарифы;
страница [Модели и цены](https://api-docs.deepseek.com/quick_start/pricing/)
является авторитетным источником для расчёта стоимости.

<Tip>
Модели V4 поддерживают параметр DeepSeek `thinking`. OpenClaw также повторно передаёт
`reasoning_content` DeepSeek в последующих ходах, чтобы сеансы мышления с вызовами
инструментов могли продолжаться.
Используйте `/think xhigh` или `/think max` с моделями DeepSeek V4, чтобы запросить
максимальное значение `reasoning_effort` DeepSeek; обе команды соответствуют `"max"`.
</Tip>

## Мышление и инструменты

В сеансах мышления DeepSeek V4 повторно передаваемые сообщения ассистента из хода
с включённым мышлением должны содержать `reasoning_content` в последующих запросах.
Плагин DeepSeek для OpenClaw автоматически заполняет это поле, поэтому обычное
многоходовое использование инструментов работает с `deepseek/deepseek-v4-flash` и
`deepseek/deepseek-v4-pro`, даже если история получена от другого провайдера,
совместимого с OpenAI (без собственного `reasoning_content`), или из обычного
сообщения ассистента. После смены провайдера в середине сеанса команда `/new` не требуется.

Когда мышление отключено (включая выбор **None** в интерфейсе), OpenClaw
отправляет `thinking: { type: "disabled" }` и удаляет повторно передаваемый
`reasoning_content` из исходящей истории, сохраняя сеанс на пути DeepSeek без мышления.

Используйте `deepseek/deepseek-v4-flash` как быстрый вариант по умолчанию. Используйте
`deepseek/deepseek-v4-pro` как более мощную модель, если приемлемы более высокая
стоимость или задержка.

## Тестирование в реальном времени

Чтобы запустить только прямые проверки моделей DeepSeek V4 из современного набора тестов моделей в реальном времени:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Проверяет, что обе модели V4 успешно завершают работу и что последующие ходы
с мышлением и инструментами сохраняют данные повторной передачи, необходимые DeepSeek.

## Пример конфигурации

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полный справочник по конфигурации агентов, моделей и провайдеров.
  </Card>
</CardGroup>
