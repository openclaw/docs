---
read_when:
    - Ви хочете використовувати моделі Anthropic в OpenClaw
summary: Використовуйте Anthropic Claude через API-ключі або Claude CLI в OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-26T07:50:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: f26f117cb4f98790c323e056d39267c18f1278b0a7a8d3d43a7cbaddbb4523c1
    source_path: providers/anthropic.md
    workflow: 15
---

Anthropic створює сімейство моделей **Claude**. OpenClaw підтримує два шляхи автентифікації:

- **API key** — прямий доступ до Anthropic API з білінгом на основі використання (моделі `anthropic/*`)
- **Claude CLI** — повторне використання наявного входу Claude CLI на тому самому хості

<Warning>
Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому
OpenClaw вважає повторне використання Claude CLI і використання `claude -p` санкціонованими, якщо
Anthropic не опублікує нову політику.

Для довготривалих хостів Gateway API-ключі Anthropic усе ще є найзрозумілішим і
найпередбачуванішим виробничим шляхом.

Поточна публічна документація Anthropic:

- [Довідник з Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Огляд Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Використання Claude Code з вашим планом Pro або Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Використання Claude Code з вашим планом Team або Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Початок роботи

<Tabs>
  <Tab title="API key">
    **Найкраще для:** стандартного доступу до API та білінгу на основі використання.

    <Steps>
      <Step title="Отримайте свій API key">
        Створіть API key у [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Або передайте ключ напряму:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Переконайтеся, що модель доступна">
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
    **Найкраще для:** повторного використання наявного входу Claude CLI без окремого API key.

    <Steps>
      <Step title="Переконайтеся, що Claude CLI встановлено і вхід виконано">
        Перевірте командою:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw виявляє та повторно використовує наявні облікові дані Claude CLI.
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Подробиці налаштування та виконання для backend Claude CLI наведено в [CLI Backends](/uk/gateway/cli-backends).
    </Note>

    ### Приклад конфігурації

    Віддавайте перевагу канонічному посиланню на модель Anthropic плюс перевизначенню середовища виконання CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          agentRuntime: { id: "claude-cli" },
        },
      },
    }
    ```

    Старі посилання на моделі `claude-cli/claude-opus-4-7` усе ще працюють для
    сумісності, але нова конфігурація має зберігати вибір provider/model як
    `anthropic/*`, а backend виконання вказувати в `agentRuntime.id`.

    <Tip>
    Якщо вам потрібен найпрозоріший шлях білінгу, натомість використовуйте API key Anthropic. OpenClaw також підтримує варіанти в стилі підписки від [OpenAI Codex](/uk/providers/openai), [Qwen Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [Z.AI / GLM](/uk/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Типові параметри thinking (Claude 4.6)

Для моделей Claude 4.6 в OpenClaw за замовчуванням використовується `adaptive` thinking, якщо явно не задано рівень thinking.

Перевизначайте для окремого повідомлення через `/think:<level>` або в параметрах моделі:

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
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Кешування prompt-ів

OpenClaw підтримує функцію кешування prompt-ів Anthropic для автентифікації через API key.

| Значення            | Тривалість кешу | Опис                                       |
| ------------------- | --------------- | ------------------------------------------ |
| `"short"` (типово)  | 5 хвилин        | Застосовується автоматично для auth через API key |
| `"long"`            | 1 година        | Розширений кеш                             |
| `"none"`            | Без кешування   | Вимкнути кешування prompt-ів               |

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
    Використовуйте параметри на рівні моделі як базу, а потім перевизначайте конкретних агентів через `agents.list[].params`:

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

    Порядок об’єднання конфігурації:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (відповідний `id`, перевизначення за ключем)

    Це дає змогу одному агенту зберігати довготривалий кеш, тоді як інший агент на тій самій моделі вимикає кешування для стрибкоподібного/малоповторюваного трафіку.

  </Accordion>

  <Accordion title="Примітки щодо Claude на Bedrock">
    - Моделі Anthropic Claude на Bedrock (`amazon-bedrock/*anthropic.claude*`) приймають наскрізний параметр `cacheRetention`, якщо його налаштовано.
    - Для моделей Bedrock, що не належать Anthropic, під час виконання примусово встановлюється `cacheRetention: "none"`.
    - Типові розумні налаштування для API key також задають `cacheRetention: "short"` для посилань Claude-on-Bedrock, якщо явно не задано інше значення.

  </Accordion>
</AccordionGroup>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Швидкий режим">
    Спільний перемикач `/fast` в OpenClaw підтримує прямий трафік Anthropic (API key і OAuth до `api.anthropic.com`).

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
    - Інʼєктується лише для прямих запитів до `api.anthropic.com`. Маршрути через проксі залишають `service_tier` без змін.
    - Явні параметри `serviceTier` або `service_tier` мають пріоритет над `/fast`, коли задано обидва.
    - Для акаунтів без місткості Priority Tier значення `service_tier: "auto"` може розв’язатися як `standard`.

    </Note>

  </Accordion>

  <Accordion title="Розуміння медіа (зображення та PDF)">
    Вбудований Plugin Anthropic реєструє розуміння зображень і PDF. OpenClaw
    автоматично визначає можливості медіа з налаштованої автентифікації Anthropic — додаткова
    конфігурація не потрібна.

    | Властивість      | Значення             |
    | ---------------- | -------------------- |
    | Типова модель    | `claude-opus-4-6`    |
    | Підтримуваний ввід | Зображення, PDF-документи |

    Коли до розмови прикріплено зображення або PDF, OpenClaw автоматично
    маршрутизує його через provider розуміння медіа Anthropic.

  </Accordion>

  <Accordion title="Вікно контексту 1M (beta)">
    Вікно контексту 1M від Anthropic доступне лише з beta-доступом. Увімкніть його для моделі:

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

    `params.context1m: true` також застосовується до backend Claude CLI
    (`claude-cli/*`) для відповідних моделей Opus і Sonnet, розширюючи
    вікно контексту виконання для цих CLI-сесій відповідно до поведінки прямого API.

    <Warning>
    Потрібен доступ до довгого контексту для ваших облікових даних Anthropic. Застаріла автентифікація токеном (`sk-ant-oat-*`) відхиляється для запитів із контекстом 1M — OpenClaw записує попередження в журнал і повертається до стандартного вікна контексту.
    </Warning>

  </Accordion>

  <Accordion title="Контекст 1M для Claude Opus 4.7">
    `anthropic/claude-opus-4.7` і його варіант `claude-cli` мають вікно контексту 1M
    за замовчуванням — `params.context1m: true` не потрібен.
  </Accordion>
</AccordionGroup>

## Усунення проблем

<AccordionGroup>
  <Accordion title="Помилки 401 / токен раптово став недійсним">
    Автентифікація токеном Anthropic має строк дії та може бути відкликана. Для нових налаштувань використовуйте API key Anthropic.
  </Accordion>

  <Accordion title='Не знайдено API key для provider "anthropic"'>
    Автентифікація Anthropic є **для кожного агента окремо** — нові агенти не успадковують ключі основного агента. Повторно запустіть онбординг для цього агента (або налаштуйте API key на хості Gateway), а потім перевірте через `openclaw models status`.
  </Accordion>

  <Accordion title='Не знайдено облікових даних для профілю "anthropic:default"'>
    Виконайте `openclaw models status`, щоб побачити, який профіль автентифікації активний. Повторно запустіть онбординг або налаштуйте API key для шляху цього профілю.
  </Accordion>

  <Accordion title="Немає доступного профілю автентифікації (усі в cooldown)">
    Перевірте `openclaw models status --json` для `auth.unusableProfiles`. Cooldown Anthropic через обмеження частоти може бути прив’язаний до моделі, тож сусідня модель Anthropic може все ще бути придатною до використання. Додайте інший профіль Anthropic або дочекайтеся завершення cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Більше допомоги: [Усунення проблем](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider-ів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="CLI backend-и" href="/uk/gateway/cli-backends" icon="terminal">
    Налаштування та подробиці виконання для backend Claude CLI.
  </Card>
  <Card title="Кешування prompt-ів" href="/uk/reference/prompt-caching" icon="database">
    Як працює кешування prompt-ів у різних provider-ів.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Подробиці auth і правила повторного використання облікових даних.
  </Card>
</CardGroup>
