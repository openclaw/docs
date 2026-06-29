---
read_when:
    - Вы хотите использовать DeepSeek с OpenClaw
    - Требуется переменная окружения с ключом API или вариант аутентификации CLI
summary: Настройка DeepSeek (аутентификация + выбор модели)
title: DeepSeek
x-i18n:
    generated_at: "2026-06-28T23:36:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0446f78e1cb6412034ca18b0db49f2f3a1958e91a013661b3056bf3687fc2d09
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) предоставляет мощные модели ИИ с OpenAI-совместимым API.

| Свойство | Значение                   |
| -------- | -------------------------- |
| Provider | `deepseek`                 |
| Auth     | `DEEPSEEK_API_KEY`         |
| API      | OpenAI-совместимый         |
| Base URL | `https://api.deepseek.com` |

## Установка Plugin

Установите официальный Plugin, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## Начало работы

<Steps>
  <Step title="Get your API key">
    Создайте API-ключ на [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Будет запрошен ваш API-ключ, а `deepseek/deepseek-v4-flash` будет задан как модель по умолчанию.

  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider deepseek
    ```

    Чтобы просмотреть статический каталог Plugin без необходимости запускать Gateway,
    используйте:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Non-interactive setup">
    Для скриптовых или безголовых установок передайте все флаги напрямую:

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
доступен этому процессу (например, в `~/.openclaw/.env` или через
`env.shellEnv`).
</Warning>

## Встроенный каталог

| Ссылка на модель             | Название          | Ввод  | Контекст  | Макс. вывод | Примечания                                      |
| ---------------------------- | ----------------- | ----- | --------- | ----------- | ----------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000     | Модель по умолчанию; поверхность V4 с поддержкой мышления |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000     | Поверхность V4 с поддержкой мышления            |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192       | Поверхность DeepSeek V3.2 без мышления          |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536      | Поверхность V3.2 с поддержкой рассуждений       |

<Tip>
Модели V4 поддерживают управление `thinking` DeepSeek. OpenClaw также воспроизводит
DeepSeek `reasoning_content` в последующих ходах, чтобы сессии мышления с вызовами
инструментов могли продолжаться.
Используйте `/think xhigh` или `/think max` с моделями DeepSeek V4, чтобы запросить
максимальное `reasoning_effort` DeepSeek.
</Tip>

## Мышление и инструменты

Сессии мышления DeepSeek V4 имеют более строгий контракт воспроизведения, чем большинство
OpenAI-совместимых провайдеров: после того как ход с включенным мышлением использует инструменты, DeepSeek
ожидает, что воспроизводимые сообщения ассистента из этого хода будут включать
`reasoning_content` в последующих запросах. OpenClaw обрабатывает это внутри
Plugin DeepSeek, поэтому обычное многоходовое использование инструментов работает с
`deepseek/deepseek-v4-flash` и `deepseek/deepseek-v4-pro`.

Если вы переключаете существующую сессию с другого OpenAI-совместимого провайдера на
модель DeepSeek V4, в более старых ходах ассистента с вызовами инструментов может не быть нативного
DeepSeek `reasoning_content`. OpenClaw заполняет это отсутствующее поле при воспроизведении
сообщений ассистента для запросов мышления DeepSeek V4, чтобы провайдер мог принять
историю без необходимости использовать `/new`.

Когда мышление отключено в OpenClaw (включая выбор **None** в UI),
OpenClaw отправляет DeepSeek `thinking: { type: "disabled" }` и удаляет воспроизводимый
`reasoning_content` из исходящей истории. Это удерживает сессии с отключенным мышлением
на пути DeepSeek без мышления.

Используйте `deepseek/deepseek-v4-flash` для стандартного быстрого пути. Используйте
`deepseek/deepseek-v4-pro`, когда вам нужна более сильная модель V4 и вы готовы принять
более высокую стоимость или задержку.

## Живое тестирование

Прямой набор живых тестов моделей включает DeepSeek V4 в современный набор моделей. Чтобы
запустить только прямые проверки моделей DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Эта живая проверка подтверждает, что обе модели V4 могут завершать запросы и что последующие
ходы с мышлением/инструментами сохраняют полезную нагрузку воспроизведения, требуемую DeepSeek.

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
  <Card title="Model selection" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при отказе.
  </Card>
  <Card title="Configuration reference" href="/ru/gateway/configuration-reference" icon="gear">
    Полный справочник конфигурации для агентов, моделей и провайдеров.
  </Card>
</CardGroup>
