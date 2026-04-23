---
read_when:
    - Ви хочете використовувати Cloudflare AI Gateway з OpenClaw
    - Вам потрібні account ID, gateway ID або env-змінна API key
summary: Налаштування Cloudflare AI Gateway (auth + вибір моделі)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-23T21:05:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31e2886c6333ec47ebed3042c0802ad5aedba6f16fbddc2110728dcb1e86b499
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

Cloudflare AI Gateway стоїть перед API provider-ів і дає змогу додавати аналітику, кешування та елементи керування. Для Anthropic OpenClaw використовує Anthropic Messages API через endpoint вашого Gateway.

| Властивість    | Значення                                                                                |
| -------------- | --------------------------------------------------------------------------------------- |
| Provider       | `cloudflare-ai-gateway`                                                                 |
| Base URL       | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`             |
| Типова модель  | `cloudflare-ai-gateway/claude-sonnet-4-5`                                               |
| API key        | `CLOUDFLARE_AI_GATEWAY_API_KEY` (ваш API key provider-а для запитів через Gateway)     |

<Note>
Для моделей Anthropic, маршрутизованих через Cloudflare AI Gateway, використовуйте свій **Anthropic API key** як ключ provider-а.
</Note>

## Початок роботи

<Steps>
  <Step title="Задайте API key provider-а та дані Gateway">
    Запустіть onboarding і виберіть варіант автентифікації Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Це попросить account ID, gateway ID і API key.

  </Step>
  <Step title="Задайте типову модель">
    Додайте модель до config OpenClaw:

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

Для scripted- або CI-конфігурацій передавайте всі значення в командному рядку:

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
  <Accordion title="Автентифіковані Gateway-и">
    Якщо ви ввімкнули автентифікацію Gateway у Cloudflare, додайте заголовок `cf-aig-authorization`. Це **додатково** до API key вашого provider-а.

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
    Заголовок `cf-aig-authorization` автентифікує вас перед самим Cloudflare Gateway, тоді як API key provider-а (наприклад, ваш ключ Anthropic) автентифікує вас перед upstream provider-ом.
    </Tip>

  </Accordion>

  <Accordion title="Примітка про environment">
    Якщо Gateway працює як daemon (launchd/systemd), переконайтеся, що `CLOUDFLARE_AI_GATEWAY_API_KEY` доступний цьому процесу.

    <Warning>
    Ключ, який лежить лише в `~/.profile`, не допоможе daemon-у launchd/systemd, якщо це середовище там також не імпортовано. Задайте ключ у `~/.openclaw/.env` або через `env.shellEnv`, щоб процес gateway міг його прочитати.
    </Warning>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider-ів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і FAQ.
  </Card>
</CardGroup>
