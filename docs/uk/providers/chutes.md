---
read_when:
    - Ви хочете використовувати Chutes з OpenClaw
    - Вам потрібен шлях налаштування OAuth або API key
    - Ви хочете дізнатися про типову модель, псевдоніми або поведінку виявлення
summary: Налаштування Chutes (OAuth або API key, виявлення моделей, псевдоніми)
title: Chutes
x-i18n:
    generated_at: "2026-04-23T21:05:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4e5189cfe32affbd23cce6c626adacd90f435c0cfe4866e2c96ac8bd0312f23
    source_path: providers/chutes.md
    workflow: 15
---

[Chutes](https://chutes.ai) надає каталоги open-source моделей через
OpenAI-compatible API. OpenClaw підтримує як browser OAuth, так і пряму
автентифікацію через API key для вбудованого провайдера `chutes`.

| Властивість | Значення                    |
| ----------- | --------------------------- |
| Провайдер   | `chutes`                    |
| API         | OpenAI-compatible           |
| Base URL    | `https://llm.chutes.ai/v1`  |
| Автентифікація | OAuth або API key (див. нижче) |

## Початок роботи

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Запустіть потік onboarding для OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw локально запускає browser-потік, або показує URL + потік
        вставлення redirect на віддалених/headless-хостах. OAuth-токени автоматично оновлюються через профілі автентифікації OpenClaw.
      </Step>
      <Step title="Перевірте типову модель">
        Після onboarding типова модель встановлюється в
        `chutes/zai-org/GLM-4.7-TEE`, а вбудований каталог Chutes
        реєструється.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="Отримайте API key">
        Створіть ключ на
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Запустіть потік onboarding для API key">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Перевірте типову модель">
        Після onboarding типова модель встановлюється в
        `chutes/zai-org/GLM-4.7-TEE`, а вбудований каталог Chutes
        реєструється.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Обидва шляхи автентифікації реєструють вбудований каталог Chutes і встановлюють типову модель на
`chutes/zai-org/GLM-4.7-TEE`. Змінні середовища runtime: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## Поведінка виявлення

Коли автентифікація Chutes доступна, OpenClaw запитує каталог Chutes з цими
обліковими даними і використовує виявлені моделі. Якщо виявлення не вдається, OpenClaw
використовує запасний варіант — вбудований статичний каталог, — тож onboarding і запуск усе одно працюють.

## Типові псевдоніми

OpenClaw реєструє три зручні псевдоніми для вбудованого каталогу Chutes:

| Псевдонім      | Цільова модель                                       |
| -------------- | ---------------------------------------------------- |
| `chutes-fast`  | `chutes/zai-org/GLM-4.7-FP8`                         |
| `chutes-pro`   | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`               |
| `chutes-vision`| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Вбудований стартовий каталог

Вбудований запасний каталог містить поточні посилання Chutes:

| Посилання на модель                                  |
| ---------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                         |
| `chutes/zai-org/GLM-5-TEE`                           |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`               |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`            |
| `chutes/moonshotai/Kimi-K2.5-TEE`                    |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`|
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                   |
| `chutes/openai/gpt-oss-120b-TEE`                     |

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
  <Accordion title="Перевизначення OAuth">
    Ви можете налаштувати потік OAuth за допомогою необов’язкових змінних середовища:

    | Змінна | Призначення |
    | ------ | ----------- |
    | `CHUTES_CLIENT_ID` | Власний OAuth client ID |
    | `CHUTES_CLIENT_SECRET` | Власний OAuth client secret |
    | `CHUTES_OAUTH_REDIRECT_URI` | Власний redirect URI |
    | `CHUTES_OAUTH_SCOPES` | Власні області дії OAuth |

    Вимоги до redirect app і довідку див. у [документації Chutes OAuth](https://chutes.ai/docs/sign-in-with-chutes/overview).

  </Accordion>

  <Accordion title="Примітки">
    - Виявлення через API key і OAuth використовують той самий id провайдера `chutes`.
    - Моделі Chutes реєструються як `chutes/<model-id>`.
    - Якщо виявлення не вдається під час запуску, вбудований статичний каталог використовується автоматично.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Правила провайдерів, посилання на моделі та поведінка запасних варіантів.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, включно з налаштуваннями провайдера.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Панель керування Chutes і документація API.
  </Card>
  <Card title="API keys Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Створення й керування API keys Chutes.
  </Card>
</CardGroup>
