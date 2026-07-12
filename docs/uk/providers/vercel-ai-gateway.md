---
read_when:
    - Ви хочете використовувати Vercel AI Gateway з OpenClaw
    - Вам потрібна змінна середовища для ключа API або вибір автентифікації через CLI
summary: Налаштування Vercel AI Gateway (автентифікація + вибір моделі)
title: Шлюз Vercel AI
x-i18n:
    generated_at: "2026-07-12T13:39:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) надає уніфікований API для
доступу до сотень моделей через єдину кінцеву точку.

| Властивість    | Значення                               |
| -------------- | -------------------------------------- |
| Провайдер      | `vercel-ai-gateway`                    |
| Пакет          | `@openclaw/vercel-ai-gateway-provider` |
| Автентифікація | `AI_GATEWAY_API_KEY`                   |
| API            | Сумісний з Anthropic Messages          |
| Базова URL-адреса | `https://ai-gateway.vercel.sh`      |
| Каталог моделей | Автоматично виявляється через `/v1/models` |

<Tip>
OpenClaw автоматично виявляє каталог Gateway `/v1/models`, тому і команда чату
`/models vercel-ai-gateway`, і
`openclaw models list --provider vercel-ai-gateway` містять актуальні посилання
на моделі, як-от `vercel-ai-gateway/openai/gpt-5.5` і
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Початок роботи

<Steps>
  <Step title="Установіть плагін">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="Установіть ключ API">
    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```
  </Step>
  <Step title="Установіть модель за замовчуванням">
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

## Приклад неінтерактивного налаштування

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Скорочені ідентифікатори моделей

OpenClaw нормалізує скорочені посилання на моделі Claude під час виконання:

| Скорочене введення                  | Нормалізоване посилання на модель             |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
У конфігурації можна використовувати будь-яку форму; OpenClaw автоматично
визначає канонічне посилання `anthropic/...`.
</Tip>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Змінна середовища для фонових процесів">
    Якщо Gateway OpenClaw працює як фоновий процес (launchd/systemd),
    переконайтеся, що `AI_GATEWAY_API_KEY` доступна цьому процесу.

    <Warning>
    Ключ, експортований лише в інтерактивній оболонці, не буде видимий фоновому
    процесу launchd/systemd, якщо це середовище не імпортовано явно. Задайте
    ключ у `~/.openclaw/.env` або через `env.shellEnv`, щоб процес Gateway міг
    його прочитати.
    </Warning>

  </Accordion>

  <Accordion title="Маршрутизація провайдера">
    Vercel AI Gateway спрямовує кожен запит до вихідного провайдера, зазначеного
    в префіксі посилання на модель. Наприклад,
    `vercel-ai-gateway/anthropic/claude-opus-4.6` спрямовується через Anthropic,
    `vercel-ai-gateway/openai/gpt-5.5` — через OpenAI, а
    `vercel-ai-gateway/moonshotai/kimi-k2.6` — через MoonshotAI. Один
    `AI_GATEWAY_API_KEY` автентифікує доступ до всіх вихідних провайдерів.
  </Accordion>
  <Accordion title="Рівні міркування">
    Параметри `/think` відповідають префіксу вихідної моделі, якщо OpenClaw
    його розпізнає. `vercel-ai-gateway/anthropic/...` використовує профіль
    міркування Claude, зокрема адаптивне значення за замовчуванням для моделей
    Claude 4.6. Довірені посилання `vercel-ai-gateway/openai/...` (`gpt-5.2`
    і новіші, а також варіанти Codex до `gpt-5.1-codex` включно) підтримують
    `/think xhigh`. Інші посилання з просторами імен зберігають стандартні рівні
    міркування, якщо метадані їхнього каталогу не визначають додаткових.
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки перемикання після відмови.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальні рекомендації з усунення несправностей і поширені запитання.
  </Card>
</CardGroup>
