---
read_when:
    - Вы хотите использовать DeepSeek с OpenClaw
    - Вам нужна переменная окружения с API-ключом или выбор аутентификации в CLI
summary: Настройка DeepSeek (аутентификация и выбор модели)
title: DeepSeek
x-i18n:
    generated_at: "2026-07-13T18:29:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 77e074756d593205d7d05f499da93b9bd3c63acdce7092b42fb5562023577925
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) предоставляет мощные модели ИИ через API, совместимый с OpenAI.

| Свойство | Значение                   |
| -------- | -------------------------- |
| Провайдер | `deepseek`                 |
| Аутентификация | `DEEPSEEK_API_KEY`         |
| API      | Совместимый с OpenAI       |
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

    Запрашивает ключ API и устанавливает `deepseek/deepseek-v4-flash` как модель по умолчанию.

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

| Ссылка на модель            | Название          | Ввод  | Контекст  | Макс. вывод | Примечания                                          |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | --------------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | текст | 1,000,000 | 384,000    | Модель по умолчанию; интерфейс V4 с поддержкой рассуждений |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | текст | 1,000,000 | 384,000    | Интерфейс V4 с поддержкой рассуждений               |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | текст | 1,000,000 | 384,000    | Устаревшее имя совместимости V4 Flash без рассуждений |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | текст | 1,000,000 | 384,000    | Устаревшее имя совместимости V4 Flash с рассуждениями |

<Warning>
DeepSeek выведет `deepseek-chat` и `deepseek-reasoner` из эксплуатации 24 июля 2026 года
в 15:59 UTC. Сейчас они направляют запросы к DeepSeek V4 Flash в режиме без рассуждений и
с рассуждениями соответственно. До указанного срока замените настроенные ссылки на модели на
`deepseek/deepseek-v4-flash` или `deepseek/deepseek-v4-pro`.
</Warning>

Локальные оценки стоимости OpenClaw основаны на опубликованных DeepSeek тарифах
для попаданий в кеш, промахов кеша и вывода. DeepSeek может изменять эти тарифы;
для выставления счетов актуальны данные на странице
[Модели и цены](https://api-docs.deepseek.com/quick_start/pricing/).

<Tip>
Модели V4 поддерживают параметр управления DeepSeek `thinking`. OpenClaw также повторно передаёт
DeepSeek `reasoning_content` в последующих ходах, чтобы сеансы рассуждений с вызовами
инструментов могли продолжаться.
Используйте `/think xhigh` или `/think max` с моделями DeepSeek V4, чтобы запросить у DeepSeek
максимальный `reasoning_effort`; оба значения преобразуются в `"max"`.
</Tip>

## Рассуждения и инструменты

В сеансах рассуждений DeepSeek V4 повторно передаваемые сообщения ассистента из
хода с включёнными рассуждениями должны содержать `reasoning_content` в последующих запросах.
Плагин DeepSeek для OpenClaw автоматически добавляет это поле, поэтому обычное
многоходовое использование инструментов работает с `deepseek/deepseek-v4-flash` и
`deepseek/deepseek-v4-pro`, даже если история поступила от другого
провайдера, совместимого с OpenAI (без собственного `reasoning_content`), или из обычного
сообщения ассистента. После переключения провайдера в середине сеанса `/new` не требуется.

Когда рассуждения отключены (включая выбор **None** в пользовательском интерфейсе), OpenClaw
отправляет `thinking: { type: "disabled" }` и удаляет повторно переданный `reasoning_content`
из исходящей истории, сохраняя сеанс на пути DeepSeek без рассуждений.

Используйте `deepseek/deepseek-v4-flash` для быстрого пути по умолчанию. Используйте
`deepseek/deepseek-v4-pro` для более мощной модели, если приемлемы более высокая
стоимость или задержка.

## Тестирование в реальном времени

Чтобы запустить только прямые проверки моделей DeepSeek V4 из современного набора тестов моделей в реальном времени:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Проверяет, что обе модели V4 завершают работу и что последующие ходы с рассуждениями и инструментами
сохраняют данные повторной передачи, необходимые DeepSeek.

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
