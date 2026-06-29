---
read_when:
    - Вы хотите использовать Vercel AI Gateway с OpenClaw
    - Вам нужна переменная окружения с ключом API или выбор аутентификации в CLI
summary: Настройка Vercel AI Gateway (аутентификация + выбор модели)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-06-28T23:40:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27aeeeff28661839f3be55c60bf1b383b95af78e17abb77441ae4e81f58688ed
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) предоставляет единый API для
доступа к сотням моделей через одну конечную точку.

| Свойство        | Значение                               |
| --------------- | -------------------------------------- |
| Поставщик       | `vercel-ai-gateway`                    |
| Пакет           | `@openclaw/vercel-ai-gateway-provider` |
| Аутентификация  | `AI_GATEWAY_API_KEY`                   |
| API             | Совместим с Anthropic Messages         |
| Каталог моделей | Автоматически обнаруживается через `/v1/models` |

<Tip>
OpenClaw автоматически обнаруживает каталог Gateway `/v1/models`, поэтому
`/models vercel-ai-gateway` включает текущие ссылки на модели, такие как
`vercel-ai-gateway/openai/gpt-5.5` и
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Начало работы

<Steps>
  <Step title="Установите Plugin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="Задайте ключ API">
    Запустите первичную настройку и выберите вариант аутентификации AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Задайте модель по умолчанию">
    Добавьте модель в конфигурацию OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Проверьте, что модель доступна">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Неинтерактивный пример

Для сценариев или настроек CI передайте все значения в командной строке:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Сокращенная запись ID модели

OpenClaw принимает сокращенные ссылки на модели Vercel Claude и нормализует их
во время выполнения:

| Сокращенный ввод                    | Нормализованная ссылка на модель             |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
В конфигурации можно использовать как сокращенную, так и полную ссылку на
модель. OpenClaw автоматически разрешает каноническую форму.
</Tip>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Переменная окружения для фоновых процессов">
    Если OpenClaw Gateway работает как фоновый процесс (launchd/systemd),
    убедитесь, что `AI_GATEWAY_API_KEY` доступен этому процессу.

    <Warning>
    Ключ, экспортированный только в интерактивной оболочке, не будет виден
    фоновому процессу launchd/systemd, если это окружение не импортировано явно.
    Задайте ключ в `~/.openclaw/.env` или через `env.shellEnv`, чтобы процесс
    Gateway мог его прочитать.
    </Warning>

  </Accordion>

  <Accordion title="Маршрутизация поставщика">
    Vercel AI Gateway направляет запросы вышестоящему поставщику на основе
    префикса ссылки на модель. Например,
    `vercel-ai-gateway/anthropic/claude-opus-4.6` направляется через Anthropic,
    а `vercel-ai-gateway/openai/gpt-5.5` направляется через OpenAI и
    `vercel-ai-gateway/moonshotai/kimi-k2.6` направляется через MoonshotAI.
    Единый `AI_GATEWAY_API_KEY` обрабатывает аутентификацию для всех
    вышестоящих поставщиков.
  </Accordion>
  <Accordion title="Уровни Thinking">
    Параметры `/think` следуют доверенным префиксам вышестоящих моделей, когда
    OpenClaw знает контракт вышестоящего поставщика. `vercel-ai-gateway/anthropic/...`
    использует профиль thinking Claude, включая адаптивные значения по умолчанию
    для моделей Claude 4.6. `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5` и ссылки
    в стиле Codex предоставляют `/think xhigh` так же, как прямые поставщики
    OpenAI/OpenAI Codex. Другие ссылки с пространствами имен сохраняют обычные
    уровни рассуждения, если их метаданные каталога не объявляют больше.
  </Accordion>
</AccordionGroup>

## См. также

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор поставщиков, ссылок на модели и поведения при отказе.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Общее устранение неполадок и часто задаваемые вопросы.
  </Card>
</CardGroup>
