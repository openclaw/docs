---
read_when:
    - Ви хочете використовувати моделі Anthropic в OpenClaw
summary: Використовуйте Anthropic Claude через API-ключі або Claude CLI в OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-23T07:26:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1e95c84a43b083d12558d8b8c86d36b79e7ef15e4ad7e96a84b2d0e1ea36585
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic створює сімейство моделей **Claude**. OpenClaw підтримує два шляхи автентифікації:

- **API key** — прямий доступ до API Anthropic з оплатою за використання (моделі `anthropic/*`)
- **Claude CLI** — повторне використання наявного входу Claude CLI на тому самому хості

<Warning>
Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тож
OpenClaw вважає повторне використання Claude CLI і використання `claude -p` санкціонованими, якщо тільки
Anthropic не опублікує нову політику.

Для довготривалих хостів Gateway API-ключі Anthropic усе ще є найзрозумілішим і
найпередбачуванішим шляхом для production.

Поточна публічна документація Anthropic:

- [Довідник CLI Claude Code](https://code.claude.com/docs/en/cli-reference)
- [Огляд SDK агента Claude](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Використання Claude Code з вашим планом Pro або Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Використання Claude Code з вашим планом Team або Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Початок роботи

<Tabs>
  <Tab title="API key">
    **Найкраще підходить для:** стандартного доступу до API та оплати за використання.

    <Steps>
      <Step title="Отримайте свій API key">
        Створіть API key у [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Або передайте ключ безпосередньо:

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
    **Найкраще підходить для:** повторного використання наявного входу Claude CLI без окремого API key.

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

        OpenClaw виявляє й повторно використовує наявні облікові дані Claude CLI.
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Подробиці налаштування і роботи бекенду Claude CLI див. у [CLI Backends](/uk/gateway/cli-backends).
    </Note>

    <Tip>
    Якщо вам потрібен найзрозуміліший шлях білінгу, натомість використовуйте API key Anthropic. OpenClaw також підтримує варіанти у стилі передплати від [OpenAI Codex](/uk/providers/openai), [Qwen Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [Z.AI / GLM](/uk/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Значення Thinking за замовчуванням (Claude 4.6)

Для моделей Claude 4.6 в OpenClaw за замовчуванням використовується `adaptive` thinking, якщо явно не задано рівень thinking.

Перевизначайте для кожного повідомлення через `/think:<level>` або в параметрах моделі:

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

## Кешування prompt

OpenClaw підтримує функцію кешування prompt від Anthropic для автентифікації через API key.

| Value               | Тривалість кешу | Опис                                     |
| ------------------- | --------------- | ---------------------------------------- |
| `"short"` (типово)  | 5 хвилин        | Застосовується автоматично для API key auth |
| `"long"`            | 1 година        | Розширений кеш                           |
| `"none"`            | Без кешування   | Вимкнути кешування prompt                |

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
    Використовуйте params на рівні моделі як базове значення, а потім перевизначайте для конкретних агентів через `agents.list[].params`:

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

    Це дає змогу одному агенту зберігати довготривалий кеш, тоді як інший агент на тій самій моделі вимикає кешування для імпульсного трафіку з низьким повторним використанням.

  </Accordion>

  <Accordion title="Примітки щодо Bedrock Claude">
    - Моделі Anthropic Claude у Bedrock (`amazon-bedrock/*anthropic.claude*`) приймають пряме передавання `cacheRetention`, якщо його налаштовано.
    - Для моделей Bedrock, що не належать Anthropic, під час виконання примусово встановлюється `cacheRetention: "none"`.
    - Розумні значення за замовчуванням для API key також установлюють `cacheRetention: "short"` для посилань Claude-on-Bedrock, якщо явне значення не задано.
  </Accordion>
</AccordionGroup>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Швидкий режим">
    Спільний перемикач `/fast` в OpenClaw підтримує прямий трафік Anthropic (API key і OAuth до `api.anthropic.com`).

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
    - Впроваджується лише для прямих запитів до `api.anthropic.com`. Маршрути через proxy залишають `service_tier` без змін.
    - Явні параметри `serviceTier` або `service_tier` мають пріоритет над `/fast`, якщо встановлено обидва.
    - Для облікових записів без потужностей Priority Tier значення `service_tier: "auto"` може зводитися до `standard`.
    </Note>

  </Accordion>

  <Accordion title="Розуміння медіа (зображення та PDF)">
    Вбудований Plugin Anthropic реєструє розуміння зображень і PDF. OpenClaw
    автоматично визначає можливості роботи з медіа з налаштованої автентифікації Anthropic — жодної
    додаткової конфігурації не потрібно.

    | Property        | Value                |
    | --------------- | -------------------- |
    | Модель за замовчуванням | `claude-opus-4-6`    |
    | Підтримуваний вхід | Зображення, PDF-документи |

    Коли до розмови додається зображення або PDF, OpenClaw автоматично
    спрямовує його через провайдера розуміння медіа Anthropic.

  </Accordion>

  <Accordion title="Вікно контексту 1M (бета)">
    Вікно контексту 1M від Anthropic доступне за beta-gate. Увімкніть його для кожної моделі:

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

    OpenClaw зіставляє це із `anthropic-beta: context-1m-2025-08-07` у запитах.

    <Warning>
    Потрібен доступ до довгого контексту для ваших облікових даних Anthropic. Застаріла автентифікація токеном (`sk-ant-oat-*`) відхиляється для запитів із контекстом 1M — OpenClaw журналює попередження та повертається до стандартного вікна контексту.
    </Warning>

  </Accordion>

  <Accordion title="Контекст 1M для Claude Opus 4.7">
    `anthropic/claude-opus-4.7` і його варіант `claude-cli` мають вікно
    контексту 1M за замовчуванням — `params.context1m: true` не потрібен.
  </Accordion>
</AccordionGroup>

## Усунення проблем

<AccordionGroup>
  <Accordion title="Помилки 401 / токен раптово став недійсним">
    Автентифікація токеном Anthropic може завершитися або бути відкликаною. Для нових налаштувань перейдіть на API key Anthropic.
  </Accordion>

  <Accordion title='API key не знайдено для провайдера "anthropic"'>
    Автентифікація є **окремою для кожного агента**. Нові агенти не успадковують ключі головного агента. Повторно запустіть онбординг для цього агента або налаштуйте API key на хості Gateway, а потім перевірте через `openclaw models status`.
  </Accordion>

  <Accordion title='Облікові дані не знайдено для профілю "anthropic:default"'>
    Запустіть `openclaw models status`, щоб побачити, який профіль автентифікації активний. Повторно запустіть онбординг або налаштуйте API key для шляху цього профілю.
  </Accordion>

  <Accordion title="Немає доступного профілю автентифікації (усі в cooldown)">
    Перевірте `openclaw models status --json` для `auth.unusableProfiles`. cooldown через ліміти швидкості Anthropic може бути прив’язаним до моделі, тому сусідня модель Anthropic усе ще може бути придатною для використання. Додайте інший профіль Anthropic або дочекайтеся завершення cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Більше допомоги: [Усунення проблем](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Бекенди CLI" href="/uk/gateway/cli-backends" icon="terminal">
    Налаштування бекенду Claude CLI і подробиці роботи.
  </Card>
  <Card title="Кешування prompt" href="/uk/reference/prompt-caching" icon="database">
    Як працює кешування prompt у різних провайдерів.
  </Card>
  <Card title="OAuth та автентифікація" href="/uk/gateway/authentication" icon="key">
    Подробиці автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
