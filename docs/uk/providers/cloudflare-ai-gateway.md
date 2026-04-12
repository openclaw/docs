---
read_when:
    - Ви хочете використовувати Cloudflare AI Gateway з OpenClaw
    - Вам потрібен ID облікового запису, ID Gateway або змінна середовища ключа API
summary: Налаштування Cloudflare AI Gateway (автентифікація + вибір моделі)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-12T10:33:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12e9589fe74e6a6335370b9cf2361a464876a392a33f8317d7fd30c3f163b2e5
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

# Cloudflare AI Gateway

Cloudflare AI Gateway розташовується перед API провайдерів і дає змогу додавати аналітику, кешування та елементи керування. Для Anthropic OpenClaw використовує Anthropic Messages API через вашу кінцеву точку Gateway.

| Властивість   | Значення                                                                                |
| ------------- | --------------------------------------------------------------------------------------- |
| Провайдер     | `cloudflare-ai-gateway`                                                                 |
| Базовий URL   | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`             |
| Типова модель | `cloudflare-ai-gateway/claude-sonnet-4-5`                                               |
| Ключ API      | `CLOUDFLARE_AI_GATEWAY_API_KEY` (ваш ключ API провайдера для запитів через Gateway)    |

<Note>
Для моделей Anthropic, що маршрутизуються через Cloudflare AI Gateway, використовуйте свій **ключ API Anthropic** як ключ провайдера.
</Note>

## Початок роботи

<Steps>
  <Step title="Укажіть ключ API провайдера та дані Gateway">
    Запустіть онбординг і виберіть варіант автентифікації Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Буде запитано ID вашого облікового запису, ID Gateway і ключ API.

  </Step>
  <Step title="Установіть типову модель">
    Додайте модель до конфігурації OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-5" },
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
  <Accordion title="Автентифіковані шлюзи">
    Якщо ви ввімкнули автентифікацію Gateway у Cloudflare, додайте заголовок `cf-aig-authorization`. Це **додатково до** ключа API вашого провайдера.

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
    Заголовок `cf-aig-authorization` автентифікує в самому Cloudflare Gateway, тоді як ключ API провайдера (наприклад, ваш ключ Anthropic) автентифікує у висхідного провайдера.
    </Tip>

  </Accordion>

  <Accordion title="Примітка щодо середовища">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `CLOUDFLARE_AI_GATEWAY_API_KEY` доступний для цього процесу.

    <Warning>
    Ключ, що зберігається лише в `~/.profile`, не допоможе демону launchd/systemd, якщо це середовище не імпортовано також туди. Установіть ключ у `~/.openclaw/.env` або через `env.shellEnv`, щоб процес gateway міг його прочитати.
    </Warning>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки перемикання на резервний варіант.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і поширені запитання.
  </Card>
</CardGroup>
