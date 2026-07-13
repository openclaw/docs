---
read_when:
    - Вы хотите использовать Vercel AI Gateway с OpenClaw
    - Вам нужна переменная окружения с ключом API или выбор аутентификации в CLI
summary: Настройка Vercel AI Gateway (аутентификация и выбор модели)
title: Шлюз Vercel AI
x-i18n:
    generated_at: "2026-07-13T18:31:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Шлюз Vercel AI Gateway](https://vercel.com/ai-gateway) предоставляет унифицированный API для
доступа к сотням моделей через единую конечную точку.

| Свойство      | Значение                               |
| ------------- | -------------------------------------- |
| Провайдер     | `vercel-ai-gateway`                    |
| Пакет         | `@openclaw/vercel-ai-gateway-provider` |
| Аутентификация | `AI_GATEWAY_API_KEY`                   |
| API           | Совместимый с Anthropic Messages       |
| Базовый URL   | `https://ai-gateway.vercel.sh`         |
| Каталог моделей | Автоматически обнаруживается через `/v1/models`       |

<Tip>
OpenClaw автоматически обнаруживает каталог Gateway `/v1/models`, поэтому и
команда чата `/models vercel-ai-gateway`, и
`openclaw models list --provider vercel-ai-gateway` содержат актуальные
ссылки на модели, такие как `vercel-ai-gateway/openai/gpt-5.5` и
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Начало работы

<Steps>
  <Step title="Установите плагин">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="Задайте ключ API">
    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```
  </Step>
  <Step title="Задайте модель по умолчанию">
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
  <Step title="Убедитесь, что модель доступна">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Пример неинтерактивного запуска

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Сокращённая запись идентификатора модели

OpenClaw нормализует сокращённые ссылки на модели Claude во время выполнения:

| Сокращённая запись                  | Нормализованная ссылка на модель              |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
В конфигурации можно использовать любую форму; OpenClaw автоматически определяет
каноническую ссылку `anthropic/...`.
</Tip>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Переменная окружения для процессов-демонов">
    Если Gateway OpenClaw работает как демон (launchd/systemd), убедитесь, что
    `AI_GATEWAY_API_KEY` доступна этому процессу.

    <Warning>
    Ключ, экспортированный только в интерактивной оболочке, не будет виден
    демону launchd/systemd, если это окружение не импортировано явно. Задайте
    ключ в `~/.openclaw/.env` или через `env.shellEnv`, чтобы процесс Gateway
    мог его прочитать.
    </Warning>

  </Accordion>

  <Accordion title="Маршрутизация провайдеров">
    Vercel AI Gateway направляет каждый запрос вышестоящему провайдеру, указанному
    в префиксе ссылки на модель. Например, `vercel-ai-gateway/anthropic/claude-opus-4.6`
    направляется через Anthropic, `vercel-ai-gateway/openai/gpt-5.5` — через
    OpenAI, а `vercel-ai-gateway/moonshotai/kimi-k2.6` — через
    MoonshotAI. Один `AI_GATEWAY_API_KEY` обеспечивает аутентификацию для всех вышестоящих провайдеров.
  </Accordion>
  <Accordion title="Уровни рассуждения">
    Параметры `/think` соответствуют префиксу вышестоящей модели, если OpenClaw его
    распознаёт. `vercel-ai-gateway/anthropic/...` использует профиль рассуждений Claude,
    включая адаптивное значение по умолчанию для моделей Claude 4.6. Доверенные
    ссылки `vercel-ai-gateway/openai/...` (`gpt-5.2` и новее, а также варианты Codex
    вплоть до `gpt-5.1-codex`) предоставляют `/think xhigh`. Другие ссылки
    с пространством имён сохраняют стандартные уровни рассуждений, если только
    метаданные их каталога не объявляют дополнительные.
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Общие рекомендации по устранению неполадок и часто задаваемые вопросы.
  </Card>
</CardGroup>
