---
read_when:
    - Ви хочете використовувати Vercel AI Gateway з OpenClaw
    - Потрібна змінна середовища з ключем API або вибір автентифікації CLI
summary: Налаштування Vercel AI Gateway (автентифікація + вибір моделі)
title: Gateway Vercel AI
x-i18n:
    generated_at: "2026-06-27T18:14:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27aeeeff28661839f3be55c60bf1b383b95af78e17abb77441ae4e81f58688ed
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) надає уніфікований API для
доступу до сотень моделей через одну кінцеву точку.

| Властивість    | Значення                                |
| -------------- | --------------------------------------- |
| Провайдер      | `vercel-ai-gateway`                     |
| Пакет          | `@openclaw/vercel-ai-gateway-provider`  |
| Автентифікація | `AI_GATEWAY_API_KEY`                    |
| API            | сумісний з Anthropic Messages           |
| Каталог моделей | автоматично виявляється через `/v1/models` |

<Tip>
OpenClaw автоматично виявляє каталог Gateway `/v1/models`, тож
`/models vercel-ai-gateway` містить поточні посилання на моделі, як-от
`vercel-ai-gateway/openai/gpt-5.5` і
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Початок роботи

<Steps>
  <Step title="Установіть Plugin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="Установіть ключ API">
    Запустіть онбординг і виберіть опцію автентифікації AI Gateway:

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
  <Step title="Перевірте, що модель доступна">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Неінтерактивний приклад

Для скриптових або CI-налаштувань передайте всі значення в командному рядку:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Скорочений запис ID моделі

OpenClaw приймає скорочені посилання на моделі Vercel Claude і нормалізує їх під
час виконання:

| Скорочене введення                  | Нормалізоване посилання на модель             |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
У конфігурації можна використовувати як скорочення, так і повністю уточнене
посилання на модель. OpenClaw автоматично визначає канонічну форму.
</Tip>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Змінна середовища для процесів-демонів">
    Якщо OpenClaw Gateway працює як демон (launchd/systemd), переконайтеся, що
    `AI_GATEWAY_API_KEY` доступний цьому процесу.

    <Warning>
    Ключ, експортований лише в інтерактивній оболонці, не буде видимий для
    демона launchd/systemd, якщо це середовище явно не імпортовано. Задайте
    ключ у `~/.openclaw/.env` або через `env.shellEnv`, щоб процес Gateway
    міг його прочитати.
    </Warning>

  </Accordion>

  <Accordion title="Маршрутизація провайдера">
    Vercel AI Gateway маршрутизує запити до висхідного провайдера на основі
    префікса посилання на модель. Наприклад, `vercel-ai-gateway/anthropic/claude-opus-4.6` маршрутизується
    через Anthropic, тоді як `vercel-ai-gateway/openai/gpt-5.5` маршрутизується через
    OpenAI, а `vercel-ai-gateway/moonshotai/kimi-k2.6` маршрутизується через
    MoonshotAI. Ваш єдиний `AI_GATEWAY_API_KEY` обробляє автентифікацію для всіх
    висхідних провайдерів.
  </Accordion>
  <Accordion title="Рівні мислення">
    Опції `/think` дотримуються довірених префіксів висхідних моделей, коли OpenClaw знає
    контракт висхідного провайдера. `vercel-ai-gateway/anthropic/...` використовує
    профіль мислення Claude, включно з адаптивними стандартними значеннями для моделей Claude 4.6.
    `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5` і посилання у стилі Codex надають
    `/think xhigh` так само, як прямі провайдери OpenAI/OpenAI Codex. Інші
    простори імен посилань зберігають звичайні рівні reasoning, якщо їхні
    метадані каталогу не оголошують більше.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і поширені запитання.
  </Card>
</CardGroup>
