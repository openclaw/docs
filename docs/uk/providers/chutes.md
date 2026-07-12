---
read_when:
    - Ви хочете використовувати Chutes з OpenClaw
    - Вам потрібен спосіб налаштування OAuth або ключа API
    - Вам потрібна модель за замовчуванням, псевдоніми або поведінка виявлення
summary: Налаштування Chutes (OAuth або ключ API, виявлення моделей, псевдоніми)
title: Chutes
x-i18n:
    generated_at: "2026-07-12T13:40:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) надає каталоги моделей із відкритим кодом через
API, сумісний з OpenAI. OpenClaw підтримує як браузерну OAuth-автентифікацію, так і автентифікацію за ключем API.

| Властивість       | Значення                                                |
| ----------------- | ------------------------------------------------------- |
| Постачальник      | `chutes`                                                |
| Plugin            | офіційний зовнішній пакет (`@openclaw/chutes-provider`) |
| API               | сумісний з OpenAI                                       |
| Базова URL-адреса | `https://llm.chutes.ai/v1`                              |
| Автентифікація    | OAuth або ключ API (див. нижче)                         |
| Змінні середовища | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`                  |

`CHUTES_OAUTH_TOKEN` безпосередньо надає вже отриманий токен доступу OAuth
(наприклад, у CI), оминаючи наведений нижче інтерактивний браузерний процес.

## Установлення Plugin

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Початок роботи

Обидва способи встановлюють `chutes/zai-org/GLM-4.7-TEE` як модель за замовчуванням і реєструють
каталог Chutes.

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Запустіть процес початкового налаштування OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw запускає браузерний процес локально або показує URL-адресу та
        процес вставлення адреси переспрямування на віддалених хостах чи хостах без графічного інтерфейсу. Токени OAuth
        автоматично оновлюються через профілі автентифікації OpenClaw.
      </Step>
    </Steps>
  </Tab>
  <Tab title="Ключ API">
    <Steps>
      <Step title="Отримайте ключ API">
        Створіть ключ на сторінці
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Запустіть процес початкового налаштування ключа API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Поведінка виявлення

Коли автентифікація Chutes доступна, OpenClaw надсилає запит `GET /v1/models` із цими
обліковими даними та використовує виявлені моделі, кешуючи їх на 5 хвилин для кожних
облікових даних. Якщо термін дії ключа минув або він не авторизований (HTTP 401), OpenClaw повторює запит один раз
без облікових даних. Якщо виявлення й надалі не повертає жодного рядка, завершується помилкою або повертає будь-який
інший статус, відмінний від 2xx, система переходить до вбудованого статичного каталогу (виявлення
як за ключем API, так і через OAuth використовує той самий шлях). Якщо виявлення завершується помилкою під час запуску,
статичний каталог використовується автоматично.

## Псевдоніми за замовчуванням

OpenClaw реєструє три зручні псевдоніми для каталогу Chutes:

| Псевдонім      | Цільова модель                                        |
| -------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Вбудований початковий каталог

Вбудований резервний каталог містить 47 моделей. Репрезентативна вибірка актуальних посилань:

| Посилання на модель                                  |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

Щоб переглянути повний список, виконайте `openclaw models list --all --provider chutes`.

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
    Налаштуйте процес OAuth за допомогою необов’язкових змінних середовища:

    | Змінна | Призначення |
    | ------ | ----------- |
    | `CHUTES_CLIENT_ID` | Ідентифікатор клієнта OAuth (якщо не задано, з’явиться запит) |
    | `CHUTES_CLIENT_SECRET` | Секрет клієнта OAuth |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI переспрямування (за замовчуванням `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | Області доступу, розділені пробілами (за замовчуванням `openid profile chutes:invoke`) |

    Вимоги до застосунку переспрямування та довідку наведено в
    [документації Chutes щодо OAuth](https://chutes.ai/docs/sign-in-with-chutes/overview).

  </Accordion>

  <Accordion title="Примітки">
    - Моделі Chutes реєструються у форматі `chutes/<model-id>`.
    - Chutes не повідомляє про використання токенів під час потокового передавання (`supportsUsageInStreaming: false`); загальні показники використання все одно відображаються після завершення потоку.

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Правила постачальників, посилання на моделі та поведінка перемикання в разі відмови.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, включно з налаштуваннями постачальника.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Панель керування Chutes і документація API.
  </Card>
  <Card title="Ключі API Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Створюйте ключі API Chutes і керуйте ними.
  </Card>
</CardGroup>
