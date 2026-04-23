---
read_when:
    - Ви хочете використовувати моделі Volcano Engine або Doubao з OpenClaw
    - Вам потрібне налаштування API key Volcengine
summary: Налаштування Volcano Engine (моделі Doubao, загальні endpoint і endpoint для програмування)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-23T21:08:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: a0bd283b6868c540f7bfe3605861288c5b2aea59ae44f39ab2944368e6726847
    source_path: providers/volcengine.md
    workflow: 15
---

Провайдер Volcengine надає доступ до моделей Doubao і сторонніх моделей,
розміщених на Volcano Engine, з окремими endpoint для загальних завдань і завдань
програмування.

| Detail    | Value                                               |
| --------- | --------------------------------------------------- |
| Providers | `volcengine` (загальні) + `volcengine-plan` (для програмування) |
| Auth      | `VOLCANO_ENGINE_API_KEY`                            |
| API       | сумісний з OpenAI                                   |

## Початок роботи

<Steps>
  <Step title="Установіть API key">
    Запустіть інтерактивний onboarding:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Це реєструє і загальний (`volcengine`), і coding (`volcengine-plan`) провайдери з одного API key.

  </Step>
  <Step title="Задайте типову модель">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Переконайтеся, що модель доступна">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Для неінтерактивного налаштування (CI, скрипти) передайте key напряму:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Провайдери й endpoint

| Provider          | Endpoint                                  | Use case            |
| ----------------- | ----------------------------------------- | ------------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Загальні моделі     |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Моделі для кодування |

<Note>
Обидва провайдери налаштовуються з одного API key. Налаштування автоматично реєструє обидва.
</Note>

## Доступні моделі

<Tabs>
  <Tab title="General (volcengine)">
    | Model ref                                    | Name                            | Input       | Context |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | text, image | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | text, image | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | text, image | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | text, image | 128,000 |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | Model ref                                         | Name                     | Input | Context |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | text  | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | text  | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | text  | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | text  | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | text  | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text  | 256,000 |
  </Tab>
</Tabs>

## Розширене налаштування

<AccordionGroup>
  <Accordion title="Типова модель після onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` наразі задає
    `volcengine-plan/ark-code-latest` як типову модель, одночасно реєструючи
    загальний каталог `volcengine`.
  </Accordion>

  <Accordion title="Поведінка fallback у виборі моделі">
    Під час вибору моделі в onboarding/configure вибір auth Volcengine надає перевагу
    рядкам `volcengine/*` і `volcengine-plan/*`. Якщо ці моделі ще
    не завантажено, OpenClaw повертається до нефільтрованого каталогу замість показу
    порожнього вибору, scoped за провайдером.
  </Accordion>

  <Accordion title="Змінні середовища для daemon-процесів">
    Якщо Gateway працює як daemon (launchd/systemd), переконайтеся, що
    `VOLCANO_ENGINE_API_KEY` доступний цьому процесу (наприклад, у
    `~/.openclaw/.env` або через `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Під час запуску OpenClaw як фонового сервісу змінні середовища, задані у вашій
інтерактивній оболонці, не успадковуються автоматично. Див. примітку про daemon вище.
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, model refs і поведінка failover.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник config для агентів, моделей і провайдерів.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Типові проблеми та кроки налагодження.
  </Card>
  <Card title="FAQ" href="/uk/help/faq" icon="circle-question">
    Часті запитання про налаштування OpenClaw.
  </Card>
</CardGroup>
