---
read_when:
    - Ви хочете використовувати Chutes з OpenClaw
    - Вам потрібен шлях налаштування OAuth або API-ключа
    - Вам потрібна поведінка моделі за замовчуванням, псевдонімів або виявлення
summary: Налаштування Chutes (OAuth або API-ключ, виявлення моделей, псевдоніми)
title: Жолоби
x-i18n:
    generated_at: "2026-06-27T18:09:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f1898c568fd664303a8bb5c2e46228c75f9c217bec5a65e752d9c7e10b980bb
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) надає каталоги моделей з відкритим кодом через
OpenAI-сумісний API. OpenClaw підтримує як браузерний OAuth, так і пряму
автентифікацію ключем API для провайдера `chutes`.

| Властивість | Значення                     |
| ----------- | ---------------------------- |
| Провайдер   | `chutes`                     |
| API         | OpenAI-сумісний              |
| Базова URL-адреса | `https://llm.chutes.ai/v1`   |
| Автентифікація | OAuth або ключ API (див. нижче) |

## Установлення плагіна

Установіть офіційний плагін, потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Початок роботи

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Run the OAuth onboarding flow">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw запускає браузерний потік локально або показує URL + потік
        вставлення перенаправлення на віддалених чи headless-хостах. Токени OAuth
        автоматично оновлюються через профілі автентифікації OpenClaw.
      </Step>
      <Step title="Verify the default model">
        Після онбордингу модель за замовчуванням установлюється на
        `chutes/zai-org/GLM-4.7-TEE`, а статичний каталог Chutes
        реєструється.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="Get an API key">
        Створіть ключ на
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Run the API key onboarding flow">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Verify the default model">
        Після онбордингу модель за замовчуванням установлюється на
        `chutes/zai-org/GLM-4.7-TEE`, а статичний каталог Chutes
        реєструється.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Обидва шляхи автентифікації реєструють статичний каталог Chutes і встановлюють
модель за замовчуванням на `chutes/zai-org/GLM-4.7-TEE`. Змінні середовища
runtime: `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`.
</Note>

## Поведінка виявлення

Коли автентифікація Chutes доступна, OpenClaw запитує каталог Chutes із цими
обліковими даними та використовує виявлені моделі. Якщо виявлення не вдається,
OpenClaw повертається до статичного каталогу, щоб онбординг і запуск усе одно
працювали.

## Псевдоніми за замовчуванням

OpenClaw реєструє три зручні псевдоніми для статичного каталогу Chutes:

| Псевдонім       | Цільова модель                                       |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Вбудований стартовий каталог

Статичний резервний каталог містить поточні refs Chutes:

| Ref моделі                                            |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

## Приклад конфігурації

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="OAuth overrides">
    Ви можете налаштувати потік OAuth за допомогою необов’язкових змінних середовища:

    | Змінна | Призначення |
    | ------ | ----------- |
    | `CHUTES_CLIENT_ID` | Власний ID клієнта OAuth |
    | `CHUTES_CLIENT_SECRET` | Власний секрет клієнта OAuth |
    | `CHUTES_OAUTH_REDIRECT_URI` | Власний URI перенаправлення |
    | `CHUTES_OAUTH_SCOPES` | Власні scopes OAuth |

    Див. [документацію Chutes OAuth](https://chutes.ai/docs/sign-in-with-chutes/overview)
    щодо вимог до застосунку перенаправлення та допомоги.

  </Accordion>

  <Accordion title="Notes">
    - Виявлення за ключем API та OAuth використовують той самий id провайдера `chutes`.
    - Моделі Chutes реєструються як `chutes/<model-id>`.
    - Якщо виявлення під час запуску не вдається, статичний каталог використовується автоматично.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Правила провайдерів, refs моделей і поведінка failover.
  </Card>
  <Card title="Configuration reference" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, включно з налаштуваннями провайдерів.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Панель керування Chutes і документація API.
  </Card>
  <Card title="Chutes API keys" href="https://chutes.ai/settings/api-keys" icon="key">
    Створюйте та керуйте ключами API Chutes.
  </Card>
</CardGroup>
