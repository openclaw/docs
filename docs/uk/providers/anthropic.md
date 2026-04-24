---
read_when:
    - Ви хочете використовувати моделі Anthropic в OpenClaw
summary: Використання Anthropic Claude через API-ключі або Claude CLI в OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-24T18:12:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: daba524d9917321d2aec55222d0df7b850ddf7f5c1c13123b62807eebd1a7a1b
    source_path: providers/anthropic.md
    workflow: 15
---

Anthropic створює сімейство моделей **Claude**. OpenClaw підтримує два шляхи автентифікації:

- **API-ключ** — прямий доступ до API Anthropic з оплатою за використання (моделі `anthropic/*`)
- **Claude CLI** — повторне використання наявного входу Claude CLI на тому самому хості

<Warning>
Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому
OpenClaw вважає повторне використання Claude CLI і використання `claude -p` санкціонованими, якщо
Anthropic не опублікує нову політику.

Для довготривалих хостів Gateway API-ключі Anthropic все одно залишаються найзрозумілішим і
найпередбачуванішим шляхом для production.

Поточна публічна документація Anthropic:

- [Довідник CLI Claude Code](https://code.claude.com/docs/en/cli-reference)
- [Огляд SDK Claude Agent](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Використання Claude Code з вашим планом Pro або Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Використання Claude Code з вашим планом Team або Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Початок роботи

<Tabs>
  <Tab title="API key">
    **Найкраще для:** стандартного доступу до API та оплати за використання.

    <Steps>
      <Step title="Get your API key">
        Створіть API-ключ у [Консолі Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Або передайте ключ напряму:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
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
      <Step title="Ensure Claude CLI is installed and logged in">
        Перевірте за допомогою:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw виявляє й повторно використовує наявні облікові дані Claude CLI.
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Докладно про налаштування й виконання backend Claude CLI — у [CLI Backends](/uk/gateway/cli-backends).
    </Note>

    <Tip>
    Якщо вам потрібен найпрозоріший шлях білінгу, замість цього використовуйте API-ключ Anthropic. OpenClaw також підтримує варіанти у стилі підписки від [OpenAI Codex](/uk/providers/openai), [Qwen Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [Z.AI / GLM](/uk/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Типові параметри thinking (Claude 4.6)

Моделі Claude 4.6 в OpenClaw типово використовують thinking `adaptive`, якщо явно не задано рівень thinking.

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

## Кешування prompt

OpenClaw підтримує функцію кешування prompt Anthropic для автентифікації через API-ключ.

| Значення            | Тривалість кешу | Опис                                       |
| ------------------- | --------------- | ------------------------------------------ |
| `"short"` (типово)  | 5 хвилин        | Застосовується автоматично для API-ключа   |
| `"long"`            | 1 година        | Розширений кеш                             |
| `"none"`            | Без кешування   | Вимкнути кешування prompt                  |

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
    Використовуйте параметри на рівні моделі як базу, а потім перевизначайте конкретні агенти через `agents.list[].params`:

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
    2. `agents.list[].params` (для відповідного `id`, перевизначення за ключем)

    Це дає змогу одному агенту зберігати довготривалий кеш, тоді як інший агент на тій самій моделі вимикає кешування для імпульсного трафіку або трафіку з низьким повторним використанням.

  </Accordion>

  <Accordion title="Примітки щодо Bedrock Claude">
    - Моделі Anthropic Claude у Bedrock (`amazon-bedrock/*anthropic.claude*`) приймають наскрізну передачу `cacheRetention`, якщо це налаштовано.
    - Для моделей Bedrock, що не належать Anthropic, під час виконання примусово встановлюється `cacheRetention: "none"`.
    - Розумні типові параметри для API-ключа також задають `cacheRetention: "short"` для посилань Claude-on-Bedrock, якщо явне значення не встановлене.
  </Accordion>
</AccordionGroup>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Швидкий режим">
    Спільний перемикач `/fast` в OpenClaw підтримує прямий трафік Anthropic (API-ключ і OAuth до `api.anthropic.com`).

    | Команда | Відображається на |
    |---------|-------------------|
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
    - Вставляється лише для прямих запитів до `api.anthropic.com`. Проксі-маршрути залишають `service_tier` без змін.
    - Явні параметри `serviceTier` або `service_tier` мають пріоритет над `/fast`, якщо задано обидва.
    - Для акаунтів без місткості Priority Tier `service_tier: "auto"` може бути зведено до `standard`.
    </Note>

  </Accordion>

  <Accordion title="Розуміння медіа (зображення та PDF)">
    Вбудований plugin Anthropic реєструє підтримку розуміння зображень і PDF. OpenClaw
    автоматично визначає можливості медіа з налаштованої автентифікації Anthropic — жодна
    додаткова конфігурація не потрібна.

    | Властивість      | Значення             |
    | ---------------- | -------------------- |
    | Типова модель    | `claude-opus-4-6`    |
    | Підтримуваний вхід | Зображення, PDF-документи |

    Коли до розмови додається зображення або PDF, OpenClaw автоматично
    спрямовує його через provider розуміння медіа Anthropic.

  </Accordion>

  <Accordion title="Вікно контексту 1M (beta)">
    Вікно контексту Anthropic 1M доступне лише в beta. Увімкніть його для моделі:

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

    <Warning>
    Потрібен доступ до довгого контексту у ваших облікових даних Anthropic. Застаріла автентифікація токеном (`sk-ant-oat-*`) відхиляється для запитів із контекстом 1M — OpenClaw записує попередження в журнал і повертається до стандартного вікна контексту.
    </Warning>

  </Accordion>

  <Accordion title="Контекст 1M для Claude Opus 4.7">
    `anthropic/claude-opus-4.7` і його варіант `claude-cli` типово мають вікно
    контексту 1M — `params.context1m: true` не потрібен.
  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Помилки 401 / токен раптово став недійсним">
    Автентифікація токеном Anthropic має строк дії і може бути відкликана. Для нових конфігурацій замість цього використовуйте API-ключ Anthropic.
  </Accordion>

  <Accordion title='Не знайдено API-ключ для provider "anthropic"'>
    Автентифікація Anthropic є **для кожного агента окремо** — нові агенти не успадковують ключі основного агента. Повторно запустіть onboarding для цього агента (або налаштуйте API-ключ на хості gateway), а потім перевірте через `openclaw models status`.
  </Accordion>

  <Accordion title='Не знайдено облікових даних для профілю "anthropic:default"'>
    Запустіть `openclaw models status`, щоб побачити, який профіль автентифікації активний. Повторно виконайте onboarding або налаштуйте API-ключ для цього шляху профілю.
  </Accordion>

  <Accordion title="Немає доступного профілю автентифікації (усі в cooldown)">
    Перевірте `openclaw models status --json` на `auth.unusableProfiles`. cooldown через обмеження швидкості Anthropic може бути прив’язаний до моделі, тому сусідня модель Anthropic усе ще може бути придатною до використання. Додайте інший профіль Anthropic або зачекайте, доки cooldown завершиться.
  </Accordion>
</AccordionGroup>

<Note>
Більше допомоги: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider, посилань моделей і поведінки failover.
  </Card>
  <Card title="CLI Backends" href="/uk/gateway/cli-backends" icon="terminal">
    Налаштування backend Claude CLI і деталі виконання.
  </Card>
  <Card title="Кешування prompt" href="/uk/reference/prompt-caching" icon="database">
    Як працює кешування prompt у різних provider.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Докладно про автентифікацію та правила повторного використання облікових даних.
  </Card>
</CardGroup>
