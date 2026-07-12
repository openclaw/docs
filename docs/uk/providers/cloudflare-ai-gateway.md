---
read_when:
    - Ви хочете використовувати Cloudflare AI Gateway з OpenClaw
    - Вам потрібні ідентифікатор облікового запису, ідентифікатор Gateway або змінна середовища з ключем API
summary: Налаштування Cloudflare AI Gateway (автентифікація + вибір моделі)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-07-12T13:41:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) розташовується перед API постачальників і додає аналітику, кешування та засоби керування. Для Anthropic OpenClaw використовує Anthropic Messages API через вашу кінцеву точку Gateway.

| Властивість       | Значення                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| Постачальник      | `cloudflare-ai-gateway`                                                                            |
| Plugin            | офіційний зовнішній пакет (`@openclaw/cloudflare-ai-gateway-provider`)                             |
| Базова URL-адреса | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`                          |
| Модель за замовчуванням | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                    |
| Ключ API          | `CLOUDFLARE_AI_GATEWAY_API_KEY` (ваш ключ API постачальника для запитів через Gateway)             |

<Note>
Для моделей Anthropic, маршрутизованих через Cloudflare AI Gateway, використовуйте свій **ключ API Anthropic** як ключ постачальника.
</Note>

Коли для моделей Anthropic Messages увімкнено міркування, OpenClaw видаляє завершальні
ходи попереднього заповнення асистента перед надсиланням корисного навантаження через Cloudflare AI Gateway.
Anthropic відхиляє попереднє заповнення відповіді з розширеним міркуванням, тоді як звичайне
попереднє заповнення без міркування залишається доступним.

## Встановлення Plugin

Встановіть офіційний Plugin, а потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Початок роботи

<Steps>
  <Step title="Налаштуйте ключ API постачальника та параметри Gateway">
    Запустіть початкове налаштування та виберіть варіант автентифікації Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    З’являться запити на введення ідентифікатора облікового запису, ідентифікатора шлюзу та ключа API.

  </Step>
  <Step title="Налаштуйте модель за замовчуванням">
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
  <Step title="Перевірте доступність моделі">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Приклад неінтерактивного налаштування

Для скриптових налаштувань або налаштувань CI передайте всі значення в командному рядку:

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
    Якщо ви ввімкнули автентифікацію Gateway у Cloudflare, додайте заголовок `cf-aig-authorization`. Він потрібен **на додаток до** вашого ключа API постачальника.

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
    Заголовок `cf-aig-authorization` автентифікує запит у самому Cloudflare Gateway, тоді як ключ API постачальника (наприклад, ваш ключ Anthropic) автентифікує його у постачальника вищого рівня.
    </Tip>

  </Accordion>

  <Accordion title="Примітка щодо середовища">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `CLOUDFLARE_AI_GATEWAY_API_KEY` доступна цьому процесу.

    <Warning>
    Ключ, експортований лише в інтерактивній оболонці, не буде доступний демону launchd/systemd, якщо це середовище також не імпортовано до нього. Установіть ключ у `~/.openclaw/.env` або через `env.shellEnv`, щоб процес Gateway міг його прочитати.
    </Warning>

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки перемикання після відмови.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальні вказівки з усунення несправностей і поширені запитання.
  </Card>
</CardGroup>
