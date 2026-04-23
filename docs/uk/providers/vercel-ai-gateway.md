---
read_when:
    - Ви хочете використовувати Vercel AI Gateway з OpenClaw
    - Вам потрібна env var API-ключа або варіант автентифікації в CLI
summary: Налаштування Vercel AI Gateway (auth + вибір моделі)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-23T21:08:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1fa1c3c6e44e40d7a1fc89d93ee268c19124b746d4644d58014157be7cceeb9
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) надає уніфікований API для
доступу до сотень моделей через один endpoint.

| Властивість   | Значення                         |
| ------------- | -------------------------------- |
| Provider      | `vercel-ai-gateway`              |
| Auth          | `AI_GATEWAY_API_KEY`             |
| API           | сумісний з Anthropic Messages    |
| Каталог моделей | автовиявлення через `/v1/models` |

<Tip>
OpenClaw автоматично виявляє каталог Gateway `/v1/models`, тому
`/models vercel-ai-gateway` містить актуальні refs моделей, такі як
`vercel-ai-gateway/openai/gpt-5.5` і
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Початок роботи

<Steps>
  <Step title="Задайте API-ключ">
    Запустіть онбординг і виберіть варіант автентифікації AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Установіть типову модель">
    Додайте модель до конфігурації OpenClaw:

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
  <Step title="Переконайтеся, що модель доступна">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Неінтерактивний приклад

Для сценарних або CI-конфігурацій передайте всі значення в командному рядку:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Скорочений запис model ID

OpenClaw приймає скорочені refs моделей Vercel Claude і нормалізує їх під час
runtime:

| Скорочений ввід                     | Нормалізований model ref                      |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Ви можете використовувати у конфігурації як скорочений варіант, так і повністю
кваліфікований model ref. OpenClaw автоматично розв’язує канонічну форму.
</Tip>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Змінна середовища для daemon-процесів">
    Якщо Gateway OpenClaw працює як daemon (launchd/systemd), переконайтеся, що
    `AI_GATEWAY_API_KEY` доступний цьому процесу.

    <Warning>
    Ключ, заданий лише в `~/.profile`, не буде видимий для daemon launchd/systemd,
    якщо це середовище не імпортовано явно. Установіть ключ у
    `~/.openclaw/.env` або через `env.shellEnv`, щоб процес gateway міг
    його прочитати.
    </Warning>

  </Accordion>

  <Accordion title="Маршрутизація provider">
    Vercel AI Gateway маршрутизує запити до upstream provider на основі префікса model
    ref. Наприклад, `vercel-ai-gateway/anthropic/claude-opus-4.6` маршрутизується
    через Anthropic, тоді як `vercel-ai-gateway/openai/gpt-5.5` маршрутизується через
    OpenAI, а `vercel-ai-gateway/moonshotai/kimi-k2.6` — через
    MoonshotAI. Ваш єдиний `AI_GATEWAY_API_KEY` обробляє автентифікацію для всіх
    upstream provider.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider, refs моделей і поведінки failover.
  </Card>
  <Card title="Усунення проблем" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення проблем і FAQ.
  </Card>
</CardGroup>
