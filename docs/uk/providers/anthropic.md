---
read_when:
    - Ви хочете використовувати моделі Anthropic в OpenClaw
summary: Використовуйте Anthropic Claude через API-ключі або Claude CLI в OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-12T09:50:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: dabb5adc0d626995c3649c57cf4e1a94e48ce8908c004eecc21582af9c227f4d
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic створює сімейство моделей **Claude**. OpenClaw підтримує два способи автентифікації:

- **API key** — прямий доступ до Anthropic API з оплатою за використання (моделі `anthropic/*`)
- **Claude CLI** — повторне використання наявного входу Claude CLI на тому самому хості

<Warning>
Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому
OpenClaw вважає повторне використання Claude CLI та використання `claude -p` санкціонованими, якщо
Anthropic не опублікує нову політику.

Для довготривалих хостів Gateway ключі Anthropic API key все ще є найзрозумілішим і
найпередбачуванішим шляхом для продакшну.

Поточна публічна документація Anthropic:

- [Довідка з Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Огляд Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Використання Claude Code з планом Pro або Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Використання Claude Code з планом Team або Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)
  </Warning>

## Початок роботи

<Tabs>
  <Tab title="API key">
    **Найкраще для:** стандартного доступу до API та оплати за використання.

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
    Подробиці налаштування та виконання для бекенда Claude CLI наведено в [CLI Backends](/uk/gateway/cli-backends).
    </Note>

    <Tip>
    Якщо вам потрібен найзрозуміліший шлях білінгу, використовуйте Anthropic API key. OpenClaw також підтримує варіанти у стилі підписки від [OpenAI Codex](/uk/providers/openai), [Qwen Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [Z.AI / GLM](/uk/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Типові налаштування thinking (Claude 4.6)

Моделі Claude 4.6 типово використовують `adaptive` thinking в OpenClaw, якщо явний рівень thinking не задано.

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

## Кешування промптів

OpenClaw підтримує функцію кешування промптів Anthropic для автентифікації через API key.

| Value               | Тривалість кешу | Опис                                   |
| ------------------- | --------------- | -------------------------------------- |
| `"short"` (типово)  | 5 хвилин        | Застосовується автоматично для автентифікації через API key |
| `"long"`            | 1 година        | Розширений кеш                         |
| `"none"`            | Без кешування   | Вимкнути кешування промптів            |

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
  <Accordion title="Перевизначення кешу для окремих агентів">
    Використовуйте параметри на рівні моделі як базову лінію, а потім перевизначайте для конкретних агентів через `agents.list[].params`:

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

    Це дозволяє одному агенту зберігати довготривалий кеш, тоді як інший агент на тій самій моделі вимикає кешування для імпульсного трафіку або трафіку з низьким повторним використанням.

  </Accordion>

  <Accordion title="Нотатки щодо Bedrock Claude">
    - Моделі Anthropic Claude на Bedrock (`amazon-bedrock/*anthropic.claude*`) приймають наскрізну передачу `cacheRetention`, якщо це налаштовано.
    - Для моделей Bedrock, що не належать Anthropic, під час виконання примусово встановлюється `cacheRetention: "none"`.
    - Типові розумні налаштування для API key також задають `cacheRetention: "short"` для посилань Claude-on-Bedrock, якщо явне значення не встановлено.
  </Accordion>
</AccordionGroup>

## Розширене налаштування

<AccordionGroup>
  <Accordion title="Швидкий режим">
    Спільний перемикач `/fast` в OpenClaw підтримує прямий трафік Anthropic (API key та OAuth до `api.anthropic.com`).

    | Command | Відповідає |
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
    - Вставляється лише для прямих запитів до `api.anthropic.com`. Для маршрутів через проксі `service_tier` залишається без змін.
    - Явні параметри `serviceTier` або `service_tier` мають пріоритет над `/fast`, якщо задано обидва.
    - Для акаунтів без доступної ємності Priority Tier значення `service_tier: "auto"` може звестися до `standard`.
    </Note>

  </Accordion>

  <Accordion title="Вікно контексту 1M (бета)">
    Вікно контексту Anthropic 1M доступне лише в бета-режимі. Увімкніть його для конкретної моделі:

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

    OpenClaw відображає це у `anthropic-beta: context-1m-2025-08-07` у запитах.

    <Warning>
    Потрібен доступ до довгого контексту для ваших облікових даних Anthropic. Застаріла автентифікація токеном (`sk-ant-oat-*`) відхиляється для запитів із контекстом 1M — OpenClaw записує попередження в лог і повертається до стандартного вікна контексту.
    </Warning>

  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Помилки 401 / токен раптово став недійсним">
    Токен-автентифікація Anthropic може завершити дію або бути відкликаною. Для нових налаштувань перейдіть на Anthropic API key.
  </Accordion>

  <Accordion title='Не знайдено API key для провайдера "anthropic"'>
    Автентифікація є **окремою для кожного агента**. Нові агенти не успадковують ключі головного агента. Повторно запустіть онбординг для цього агента або налаштуйте API key на хості Gateway, а потім перевірте командою `openclaw models status`.
  </Accordion>

  <Accordion title='Не знайдено облікових даних для профілю "anthropic:default"'>
    Виконайте `openclaw models status`, щоб побачити, який профіль автентифікації активний. Повторно запустіть онбординг або налаштуйте API key для шляху цього профілю.
  </Accordion>

  <Accordion title="Немає доступного профілю автентифікації (усі в cooldown)">
    Перевірте `openclaw models status --json` для `auth.unusableProfiles`. Обмеження Anthropic за частотою запитів можуть бути прив’язані до конкретної моделі, тому сусідня модель Anthropic усе ще може бути придатною для використання. Додайте ще один профіль Anthropic або дочекайтеся завершення cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Більше допомоги: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="CLI backends" href="/uk/gateway/cli-backends" icon="terminal">
    Налаштування бекенда Claude CLI та подробиці виконання.
  </Card>
  <Card title="Кешування промптів" href="/uk/reference/prompt-caching" icon="database">
    Як працює кешування промптів у різних провайдерів.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Подробиці автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
