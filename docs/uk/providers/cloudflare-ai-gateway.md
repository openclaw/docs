---
read_when:
    - Ви хочете використовувати Cloudflare AI Gateway з OpenClaw
    - Вам потрібен ID облікового запису, ID Gateway або змінна середовища ключа API
summary: Налаштування Cloudflare AI Gateway (автентифікація + вибір моделі)
title: Cloudflare AI gateway
x-i18n:
    generated_at: "2026-04-27T20:43:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7c567076a5b3fea0f09f44d772c0858aed2a4813f91f1cc9f87b0da39c2e5db
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

Cloudflare AI Gateway розташовується перед API постачальників і дає змогу додавати аналітику, кешування та елементи керування. Для Anthropic OpenClaw використовує Anthropic Messages API через вашу кінцеву точку Gateway.

| Властивість   | Значення                                                                                |
| ------------- | --------------------------------------------------------------------------------------- |
| Постачальник  | `cloudflare-ai-gateway`                                                                 |
| Базова URL    | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`              |
| Модель за замовчуванням | `cloudflare-ai-gateway/claude-sonnet-4-6`                                   |
| Ключ API      | `CLOUDFLARE_AI_GATEWAY_API_KEY` (ваш ключ API постачальника для запитів через Gateway) |

<Note>
Для моделей Anthropic, маршрутизованих через Cloudflare AI Gateway, використовуйте ваш **ключ API Anthropic** як ключ постачальника.
</Note>

Коли для моделей Anthropic Messages увімкнено thinking, OpenClaw видаляє кінцеві
попередньо заповнені ходи assistant перед надсиланням корисного навантаження через Cloudflare AI Gateway.
Anthropic відхиляє попереднє заповнення відповіді з extended thinking, тоді як звичайне
попереднє заповнення без thinking залишається доступним.

## Початок роботи

<Steps>
  <Step title="Задайте ключ API постачальника та дані Gateway">
    Запустіть онбординг і виберіть варіант автентифікації Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Буде запропоновано ввести ID вашого облікового запису, ID Gateway і ключ API.

  </Step>
  <Step title="Задайте модель за замовчуванням">
    Додайте модель до конфігурації OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Перевірте, що модель доступна">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Неінтерактивний приклад

Для сценаріїв або налаштувань CI передайте всі значення в командному рядку:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Автентифіковані gateway">
    Якщо ви ввімкнули автентифікацію Gateway у Cloudflare, додайте заголовок `cf-aig-authorization`. Це **додатково до** вашого ключа API постачальника.

    ```json5
    {
      models: {
        providers: {
          "cloudflare-ai-gateway": {
            headers: {
              "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
            },
          },
        },
      },
    }
    ```

    <Tip>
    Заголовок `cf-aig-authorization` виконує автентифікацію із самим Cloudflare Gateway, тоді як ключ API постачальника (наприклад, ваш ключ Anthropic) виконує автентифікацію у висхідного постачальника.
    </Tip>

  </Accordion>

  <Accordion title="Примітка щодо середовища">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `CLOUDFLARE_AI_GATEWAY_API_KEY` доступний для цього процесу.

    <Warning>
    Ключ, який зберігається лише в `~/.profile`, не допоможе демону launchd/systemd, якщо це середовище також не імпортовано туди. Задайте ключ у `~/.openclaw/.env` або через `env.shellEnv`, щоб процес gateway міг його прочитати.
    </Warning>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки перемикання при збої.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і поширені запитання.
  </Card>
</CardGroup>
