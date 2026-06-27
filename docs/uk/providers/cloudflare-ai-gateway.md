---
read_when:
    - Ви хочете використовувати Cloudflare AI Gateway з OpenClaw
    - Вам потрібні ID облікового запису, ID Gateway або змінна середовища ключа API
summary: Налаштування Cloudflare AI Gateway (автентифікація + вибір моделі)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-06-27T18:09:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05678faa049349c610a9c7ea9d23958bf51927453cf6987fef397cd273f6556b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway розташовується перед API постачальників і дає змогу додавати аналітику, кешування та засоби керування. Для Anthropic OpenClaw використовує Anthropic Messages API через вашу кінцеву точку Gateway.

| Властивість        | Значення                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------- |
| Постачальник       | `cloudflare-ai-gateway`                                                                  |
| Базова URL-адреса  | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Стандартна модель  | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| API-ключ           | `CLOUDFLARE_AI_GATEWAY_API_KEY` (ваш API-ключ постачальника для запитів через Gateway)   |

<Note>
Для моделей Anthropic, маршрутизованих через Cloudflare AI Gateway, використовуйте свій **API-ключ Anthropic** як ключ постачальника.
</Note>

Коли для моделей Anthropic Messages увімкнено мислення, OpenClaw прибирає кінцеві
попередньо заповнені ходи асистента перед надсиланням корисного навантаження через Cloudflare AI Gateway.
Anthropic відхиляє попереднє заповнення відповіді з розширеним мисленням, тоді як звичайне
попереднє заповнення без мислення залишається доступним.

## Встановлення plugin

Встановіть офіційний plugin, а потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Початок роботи

<Steps>
  <Step title="Задайте API-ключ постачальника та дані Gateway">
    Запустіть початкове налаштування й виберіть параметр автентифікації Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Буде запропоновано ввести ID облікового запису, ID gateway та API-ключ.

  </Step>
  <Step title="Задайте стандартну модель">
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
    Якщо ви ввімкнули автентифікацію Gateway у Cloudflare, додайте заголовок `cf-aig-authorization`. Це **додатково до** вашого API-ключа постачальника.

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
    Заголовок `cf-aig-authorization` автентифікує запит у самому Cloudflare Gateway, тоді як API-ключ постачальника (наприклад, ваш ключ Anthropic) автентифікує його у вхідного постачальника.
    </Tip>

  </Accordion>

  <Accordion title="Примітка щодо середовища">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `CLOUDFLARE_AI_GATEWAY_API_KEY` доступний цьому процесу.

    <Warning>
    Ключ, експортований лише в інтерактивній оболонці, не допоможе демону launchd/systemd, якщо це середовище також не імпортовано туди. Задайте ключ у `~/.openclaw/.env` або через `env.shellEnv`, щоб процес gateway міг його прочитати.
    </Warning>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки перемикання в разі відмови.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і FAQ.
  </Card>
</CardGroup>
