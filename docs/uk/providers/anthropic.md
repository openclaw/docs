---
read_when:
    - Ви хочете використовувати моделі Anthropic в OpenClaw
summary: Використовуйте Anthropic Claude за допомогою ключів API або Claude CLI в OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-05-11T20:53:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: c36764f1adb7585389d241303e9c61c1fe2fa49fefdfb28c314abbafa646b273
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic створює сімейство моделей **Claude**. OpenClaw підтримує два способи автентифікації:

- **API-ключ** — прямий доступ до Anthropic API з оплатою за використання (моделі `anthropic/*`)
- **Claude CLI** — повторне використання наявного входу Claude CLI на тому самому хості

<Warning>
Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому
OpenClaw вважає повторне використання Claude CLI і використання `claude -p` санкціонованими, доки
Anthropic не опублікує нову політику.

Для довготривалих хостів gateway Anthropic API-ключі все ще є найчіткішим і
найбільш передбачуваним виробничим шляхом.

Поточна публічна документація Anthropic:

- [Довідник Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Огляд Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Використання Claude Code з вашим планом Pro або Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Використання Claude Code з вашим планом Team або Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Початок роботи

<Tabs>
  <Tab title="API-ключ">
    **Найкраще для:** стандартного доступу до API та оплати за використання.

    <Steps>
      <Step title="Отримайте свій API-ключ">
        Створіть API-ключ у [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Або передайте ключ безпосередньо:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Приклад конфігурації

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Найкраще для:** повторного використання наявного входу Claude CLI без окремого API-ключа.

    <Steps>
      <Step title="Переконайтеся, що Claude CLI встановлено і ви ввійшли">
        Перевірте за допомогою:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw виявляє та повторно використовує наявні облікові дані Claude CLI.
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Подробиці налаштування та виконання для бекенда Claude CLI наведені в [Бекенди CLI](/uk/gateway/cli-backends).
    </Note>

    ### Приклад конфігурації

    Надавайте перевагу канонічному посиланню на модель Anthropic плюс перевизначенню середовища виконання CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          models: {
            "anthropic/claude-opus-4-7": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Застарілі посилання на моделі `claude-cli/claude-opus-4-7` все ще працюють для
    сумісності, але нова конфігурація має зберігати вибір провайдера/моделі як
    `anthropic/*`, а бекенд виконання розміщувати в політиці середовища виконання провайдера/моделі.

    <Tip>
    Якщо вам потрібен найчіткіший шлях білінгу, натомість використовуйте Anthropic API-ключ. OpenClaw також підтримує варіанти в стилі підписки від [OpenAI Codex](/uk/providers/openai), [Qwen Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [Z.AI / GLM](/uk/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Стандартні налаштування мислення (Claude 4.6)

Моделі Claude 4.6 за замовчуванням використовують `adaptive` мислення в OpenClaw, якщо явний рівень мислення не задано.

Перевизначайте для окремого повідомлення за допомогою `/think:<level>` або в параметрах моделі:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
Пов’язана документація Anthropic:
- [Адаптивне мислення](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Розширене мислення](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Кешування промптів

OpenClaw підтримує функцію кешування промптів Anthropic для автентифікації через API-ключ.

| Значення            | Тривалість кешу | Опис                                             |
| ------------------- | --------------- | ------------------------------------------------ |
| `"short"` (типово)  | 5 хвилин        | Застосовується автоматично для автентифікації через API-ключ |
| `"long"`            | 1 година        | Розширений кеш                                  |
| `"none"`            | Без кешування   | Вимкнути кешування промптів                     |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Перевизначення кешу для окремого агента">
    Використовуйте параметри рівня моделі як базові, а потім перевизначайте конкретних агентів через `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Порядок злиття конфігурації:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (відповідний `id`, перевизначення за ключем)

    Це дає змогу одному агенту зберігати довготривалий кеш, тоді як інший агент на тій самій моделі вимикає кешування для сплескового трафіку або трафіку з низьким повторним використанням.

  </Accordion>

  <Accordion title="Примітки щодо Bedrock Claude">
    - Моделі Anthropic Claude на Bedrock (`amazon-bedrock/*anthropic.claude*`) приймають наскрізний `cacheRetention`, якщо його налаштовано.
    - Для моделей Bedrock, що не належать Anthropic, під час виконання примусово встановлюється `cacheRetention: "none"`.
    - Розумні стандартні налаштування API-ключа також задають `cacheRetention: "short"` для посилань Claude-на-Bedrock, якщо явне значення не встановлено.

  </Accordion>
</AccordionGroup>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Швидкий режим">
    Спільний перемикач `/fast` в OpenClaw підтримує прямий трафік Anthropic (API-ключ і OAuth до `api.anthropic.com`).

    | Команда | Відповідає |
    |---------|------------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Додається лише для прямих запитів до `api.anthropic.com`. Проксі-маршрути залишають `service_tier` без змін.
    - Явні параметри `serviceTier` або `service_tier` перевизначають `/fast`, коли встановлено обидва.
    - Для облікових записів без ємності Priority Tier `service_tier: "auto"` може перетворитися на `standard`.

    </Note>

  </Accordion>

  <Accordion title="Розуміння медіа (зображення і PDF)">
    Вбудований Plugin Anthropic реєструє розуміння зображень і PDF. OpenClaw
    автоматично визначає медіаможливості з налаштованої автентифікації Anthropic — додаткова
    конфігурація не потрібна.

    | Властивість       | Значення              |
    | ----------------- | --------------------- |
    | Типова модель     | `claude-opus-4-7`     |
    | Підтримуваний ввід | Зображення, PDF-документи |

    Коли зображення або PDF додано до розмови, OpenClaw автоматично
    спрямовує його через провайдера розуміння медіа Anthropic.

  </Accordion>

  <Accordion title="Контекстне вікно 1M (бета)">
    Контекстне вікно 1M Anthropic доступне через бета-доступ. Увімкніть його для окремої моделі:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw відображає це в `anthropic-beta: context-1m-2025-08-07` у запитах.

    `params.context1m: true` також застосовується до бекенда Claude CLI
    (`claude-cli/*`) для відповідних моделей Opus і Sonnet, розширюючи контекстне
    вікно виконання для цих CLI-сеансів, щоб воно відповідало поведінці прямого API.

    <Warning>
    Потрібен доступ до довгого контексту для ваших облікових даних Anthropic. Застаріла токенна автентифікація (`sk-ant-oat-*`) відхиляється для запитів контексту 1M — OpenClaw записує попередження в журнал і повертається до стандартного контекстного вікна.
    </Warning>

  </Accordion>

  <Accordion title="Контекст 1M для Claude Opus 4.7">
    `anthropic/claude-opus-4.7` і його варіант `claude-cli` мають контекстне
    вікно 1M за замовчуванням — `params.context1m: true` не потрібен.
  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Помилки 401 / токен раптово став недійсним">
    Токенна автентифікація Anthropic має строк дії і може бути відкликана. Для нових налаштувань натомість використовуйте Anthropic API-ключ.
  </Accordion>

  <Accordion title='API-ключ для провайдера "anthropic" не знайдено'>
    Автентифікація Anthropic є **окремою для кожного агента** — нові агенти не успадковують ключі основного агента. Повторно запустіть початкове налаштування для цього агента (або налаштуйте API-ключ на хості gateway), а потім перевірте за допомогою `openclaw models status`.
  </Accordion>

  <Accordion title='Облікові дані для профілю "anthropic:default" не знайдено'>
    Запустіть `openclaw models status`, щоб побачити, який профіль автентифікації активний. Повторно запустіть початкове налаштування або налаштуйте API-ключ для цього шляху профілю.
  </Accordion>

  <Accordion title="Немає доступного профілю автентифікації (усі в періоді очікування)">
    Перевірте `openclaw models status --json` для `auth.unusableProfiles`. Періоди очікування через обмеження частоти Anthropic можуть бути прив’язані до моделі, тому споріднена модель Anthropic все ще може бути придатною до використання. Додайте інший профіль Anthropic або дочекайтеся завершення періоду очікування.
  </Accordion>
</AccordionGroup>

<Note>
Більше допомоги: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки відмовостійкості.
  </Card>
  <Card title="Бекенди CLI" href="/uk/gateway/cli-backends" icon="terminal">
    Налаштування бекенда Claude CLI та подробиці виконання.
  </Card>
  <Card title="Кешування промптів" href="/uk/reference/prompt-caching" icon="database">
    Як кешування промптів працює між провайдерами.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Подробиці автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
