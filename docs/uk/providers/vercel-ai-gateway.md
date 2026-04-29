---
read_when:
    - Ви хочете використовувати Vercel AI Gateway з OpenClaw
    - Потрібна змінна середовища ключа API або вибір автентифікації CLI
summary: Налаштування Vercel AI Gateway (автентифікація + вибір моделі)
title: Gateway Vercel AI
x-i18n:
    generated_at: "2026-04-29T11:17:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3bbe498a04c2073020fcfbbe68cb506eca4c52c3274e4eca6ab7e6893fcfa56
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) надає уніфікований API для
доступу до сотень моделей через одну кінцеву точку.

| Властивість   | Значення                         |
| ------------- | -------------------------------- |
| Провайдер     | `vercel-ai-gateway`              |
| Автентифікація | `AI_GATEWAY_API_KEY`             |
| API           | сумісний з Anthropic Messages    |
| Каталог моделей | автоматично виявляється через `/v1/models` |

<Tip>
OpenClaw автоматично виявляє каталог Gateway `/v1/models`, тому
`/models vercel-ai-gateway` містить поточні посилання на моделі, як-от
`vercel-ai-gateway/openai/gpt-5.5` і
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Початок роботи

<Steps>
  <Step title="Установіть ключ API">
    Запустіть початкове налаштування й виберіть опцію автентифікації AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Установіть модель за замовчуванням">
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
  <Step title="Перевірте, що модель доступна">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Неінтерактивний приклад

Для скриптів або налаштувань CI передайте всі значення в командному рядку:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Скорочення ID моделі

OpenClaw приймає скорочені посилання на моделі Vercel Claude і нормалізує їх під час
виконання:

| Скорочене введення                  | Нормалізоване посилання на модель             |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Ви можете використовувати у своїй конфігурації як скорочення, так і повністю
кваліфіковане посилання на модель. OpenClaw автоматично визначає канонічну форму.
</Tip>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Змінна середовища для процесів демона">
    Якщо OpenClaw Gateway працює як демон (launchd/systemd), переконайтеся, що
    `AI_GATEWAY_API_KEY` доступний цьому процесу.

    <Warning>
    Ключ, заданий лише в `~/.profile`, не буде видимий для демона launchd/systemd,
    якщо це середовище не імпортовано явно. Задайте ключ у
    `~/.openclaw/.env` або через `env.shellEnv`, щоб процес Gateway міг
    його прочитати.
    </Warning>

  </Accordion>

  <Accordion title="Маршрутизація провайдера">
    Vercel AI Gateway спрямовує запити до вихідного провайдера на основі префікса
    посилання на модель. Наприклад, `vercel-ai-gateway/anthropic/claude-opus-4.6` спрямовується
    через Anthropic, тоді як `vercel-ai-gateway/openai/gpt-5.5` спрямовується через
    OpenAI, а `vercel-ai-gateway/moonshotai/kimi-k2.6` спрямовується через
    MoonshotAI. Ваш єдиний `AI_GATEWAY_API_KEY` обробляє автентифікацію для всіх
    вихідних провайдерів.
  </Accordion>
  <Accordion title="Рівні мислення">
    Параметри `/think` відповідають довіреним префіксам вихідних моделей, коли OpenClaw знає
    контракт вихідного провайдера. `vercel-ai-gateway/anthropic/...` використовує
    профіль мислення Claude, зокрема адаптивні значення за замовчуванням для моделей Claude 4.6.
    `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5` і посилання в стилі Codex надають
    `/think xhigh` так само, як прямі провайдери OpenAI/OpenAI Codex. Інші
    просторово іменовані посилання зберігають звичайні рівні міркування, якщо їхні метадані
    каталогу не оголошують більше.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки відмовостійкості.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і поширені запитання.
  </Card>
</CardGroup>
