---
read_when:
    - Ви хочете використовувати моделі Anthropic в OpenClaw
summary: Використовуйте Anthropic Claude через API-ключі або Claude CLI в OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-05-07T15:12:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15ae1d2751d0127a45ece3d0a25bead21fd6bacc2ffc80636188fc2cb5f3d7ce
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic створює сімейство моделей **Claude**. OpenClaw підтримує два способи автентифікації:

- **Ключ API** — прямий доступ до Anthropic API з оплатою за використання (моделі `anthropic/*`)
- **Claude CLI** — повторне використання наявного входу Claude CLI на тому самому хості

<Warning>
Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому
OpenClaw вважає повторне використання Claude CLI і використання `claude -p` санкціонованими, якщо тільки
Anthropic не опублікує нову політику.

Для довготривалих хостів Gateway ключі Anthropic API все ще є найзрозумілішим і
найпередбачуванішим виробничим шляхом.

Поточна публічна документація Anthropic:

- [Довідник Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Огляд Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Використання Claude Code з вашим планом Pro або Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Використання Claude Code з вашим планом Team або Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Початок роботи

<Tabs>
  <Tab title="Ключ API">
    **Найкраще для:** стандартного доступу API та оплати за використання.

    <Steps>
      <Step title="Отримайте свій ключ API">
        Створіть ключ API в [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Запустіть onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Або передайте ключ напряму:

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
    **Найкраще для:** повторного використання наявного входу Claude CLI без окремого ключа API.

    <Steps>
      <Step title="Переконайтеся, що Claude CLI встановлено і в нього виконано вхід">
        Перевірте за допомогою:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Запустіть onboarding">
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
    Деталі налаштування та виконання для бекенда Claude CLI наведено в [Бекенди CLI](/uk/gateway/cli-backends).
    </Note>

    ### Приклад конфігурації

    Надавайте перевагу канонічному посиланню на модель Anthropic плюс перевизначенню середовища виконання CLI:

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

    Застарілі посилання на моделі `claude-cli/claude-opus-4-7` усе ще працюють для
    сумісності, але нова конфігурація має зберігати вибір провайдера/моделі як
    `anthropic/*` і вказувати бекенд виконання в `agentRuntime.id`.

    <Tip>
    Якщо вам потрібен найзрозуміліший шлях оплати, натомість використовуйте ключ Anthropic API. OpenClaw також підтримує варіанти у стилі підписки від [OpenAI Codex](/uk/providers/openai), [Qwen Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [Z.AI / GLM](/uk/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Типові параметри мислення (Claude 4.6)

Моделі Claude 4.6 за замовчуванням використовують `adaptive` thinking в OpenClaw, якщо явний рівень thinking не задано.

Перевизначте для окремого повідомлення за допомогою `/think:<level>` або в параметрах моделі:

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
- [Адаптивне thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Розширене thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Кешування prompt

OpenClaw підтримує функцію кешування prompt від Anthropic для автентифікації за ключем API.

| Значення            | Тривалість кешу | Опис                                           |
| ------------------- | -------------- | ---------------------------------------------- |
| `"short"` (типово)  | 5 хвилин       | Автоматично застосовується для автентифікації за ключем API |
| `"long"`            | 1 година       | Розширений кеш                                 |
| `"none"`            | Без кешування  | Вимкнути кешування prompt                      |

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

    Це дає змогу одному агенту зберігати довготривалий кеш, тоді як інший агент на тій самій моделі вимикає кешування для стрибкоподібного трафіку або трафіку з низьким повторним використанням.

  </Accordion>

  <Accordion title="Примітки щодо Bedrock Claude">
    - Моделі Anthropic Claude у Bedrock (`amazon-bedrock/*anthropic.claude*`) приймають наскрізний `cacheRetention`, якщо його налаштовано.
    - Для моделей Bedrock, які не належать Anthropic, під час виконання примусово встановлюється `cacheRetention: "none"`.
    - Розумні типові параметри для ключа API також задають `cacheRetention: "short"` для посилань Claude-on-Bedrock, коли явне значення не встановлено.

  </Accordion>
</AccordionGroup>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Швидкий режим">
    Спільний перемикач OpenClaw `/fast` підтримує прямий трафік Anthropic (ключ API та OAuth до `api.anthropic.com`).

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
    - В облікових записах без місткості Priority Tier `service_tier: "auto"` може зводитися до `standard`.

    </Note>

  </Accordion>

  <Accordion title="Розуміння медіа (зображення та PDF)">
    Вбудований Plugin Anthropic реєструє розуміння зображень і PDF. OpenClaw
    автоматично визначає медіа-можливості з налаштованої автентифікації Anthropic — додаткова
    конфігурація не потрібна.

    | Властивість       | Значення              |
    | ----------------- | --------------------- |
    | Типова модель     | `claude-opus-4-7`     |
    | Підтримуваний ввід | Зображення, PDF-документи |

    Коли до розмови прикріплено зображення або PDF, OpenClaw автоматично
    маршрутизує його через провайдера розуміння медіа Anthropic.

  </Accordion>

  <Accordion title="Контекстне вікно 1M (бета)">
    Контекстне вікно Anthropic 1M доступне через бета-доступ. Увімкніть його для окремої моделі:

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
    (`claude-cli/*`) для придатних моделей Opus і Sonnet, розширюючи контекстне
    вікно виконання для цих сеансів CLI відповідно до поведінки прямого API.

    <Warning>
    Потрібен доступ до довгого контексту для ваших облікових даних Anthropic. Застаріла автентифікація токеном (`sk-ant-oat-*`) відхиляється для запитів контексту 1M — OpenClaw записує попередження в журнал і повертається до стандартного контекстного вікна.
    </Warning>

  </Accordion>

  <Accordion title="Контекст 1M Claude Opus 4.7">
    `anthropic/claude-opus-4.7` і його варіант `claude-cli` мають контекстне
    вікно 1M за замовчуванням — `params.context1m: true` не потрібен.
  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Помилки 401 / токен раптово став недійсним">
    Автентифікація токеном Anthropic завершується і може бути відкликана. Для нових налаштувань натомість використовуйте ключ Anthropic API.
  </Accordion>

  <Accordion title='Ключ API для провайдера "anthropic" не знайдено'>
    Автентифікація Anthropic є **окремою для кожного агента** — нові агенти не успадковують ключі головного агента. Повторно запустіть onboarding для цього агента (або налаштуйте ключ API на хості Gateway), потім перевірте за допомогою `openclaw models status`.
  </Accordion>

  <Accordion title='Облікові дані для профілю "anthropic:default" не знайдено'>
    Запустіть `openclaw models status`, щоб побачити, який профіль автентифікації активний. Повторно запустіть onboarding або налаштуйте ключ API для цього шляху профілю.
  </Accordion>

  <Accordion title="Немає доступного профілю автентифікації (усі на cooldown)">
    Перевірте `auth.unusableProfiles` у `openclaw models status --json`. Cooldown через обмеження швидкості Anthropic може бути прив’язаний до моделі, тому суміжна модель Anthropic усе ще може бути придатною для використання. Додайте інший профіль Anthropic або дочекайтеся завершення cooldown.
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
  <Card title="Бекенди CLI" href="/uk/gateway/cli-backends" icon="terminal">
    Налаштування бекенда Claude CLI та деталі виконання.
  </Card>
  <Card title="Кешування prompt" href="/uk/reference/prompt-caching" icon="database">
    Як кешування prompt працює в різних провайдерів.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Деталі автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
