---
read_when:
    - Ви хочете використовувати Vercel AI Gateway з OpenClaw
    - Вам потрібна змінна середовища ключа API або варіант автентифікації через CLI
summary: Налаштування Vercel AI Gateway (автентифікація + вибір моделі)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-22T03:53:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11c0f764d4c35633d0fbfc189bae0fc451dc799002fc1a6d0c84fc73842bbe31
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway) надає уніфікований API для
доступу до сотень моделей через єдину кінцеву точку.

| Властивість   | Значення                        |
| ------------- | ------------------------------- |
| Постачальник  | `vercel-ai-gateway`             |
| Автентифікація | `AI_GATEWAY_API_KEY`            |
| API           | сумісний з Anthropic Messages   |
| Каталог моделей | автоматично виявляється через `/v1/models` |

<Tip>
OpenClaw автоматично виявляє каталог Gateway `/v1/models`, тому
`/models vercel-ai-gateway` містить актуальні посилання на моделі, такі як
`vercel-ai-gateway/openai/gpt-5.4` і
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Початок роботи

<Steps>
  <Step title="Установіть ключ API">
    Запустіть онбординг і виберіть варіант автентифікації AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Установіть модель за замовчуванням">
    Додайте модель до своєї конфігурації OpenClaw:

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

Для сценаріїв або налаштувань CI передайте всі значення в командному рядку:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Скорочений запис ID моделі

OpenClaw приймає скорочені посилання на моделі Vercel Claude і нормалізує їх під
час виконання:

| Скорочений вхід                    | Нормалізоване посилання на модель            |
| ---------------------------------- | -------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`       | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Ви можете використовувати або скорочений запис, або повне посилання на модель у
своїй конфігурації. OpenClaw автоматично визначає канонічну форму.
</Tip>

## Розширені примітки

<AccordionGroup>
  <Accordion title="Змінна середовища для процесів демона">
    Якщо Gateway OpenClaw працює як демон (launchd/systemd), переконайтеся, що
    `AI_GATEWAY_API_KEY` доступна цьому процесу.

    <Warning>
    Ключ, установлений лише в `~/.profile`, не буде видимий демону launchd/systemd,
    якщо це середовище не імпортовано явно. Установіть ключ у
    `~/.openclaw/.env` або через `env.shellEnv`, щоб процес gateway міг
    його прочитати.
    </Warning>

  </Accordion>

  <Accordion title="Маршрутизація постачальника">
    Vercel AI Gateway маршрутизує запити до висхідного постачальника на основі
    префікса посилання на модель. Наприклад, `vercel-ai-gateway/anthropic/claude-opus-4.6` маршрутизується
    через Anthropic, тоді як `vercel-ai-gateway/openai/gpt-5.4` маршрутизується через
    OpenAI, а `vercel-ai-gateway/moonshotai/kimi-k2.6` маршрутизується через
    MoonshotAI. Ваш єдиний `AI_GATEWAY_API_KEY` забезпечує автентифікацію для всіх
    висхідних постачальників.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки перемикання при збоях.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і FAQ.
  </Card>
</CardGroup>
