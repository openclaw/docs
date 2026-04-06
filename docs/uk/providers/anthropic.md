---
read_when:
    - Ви хочете використовувати моделі Anthropic в OpenClaw
summary: Використання Anthropic Claude через API-ключі або Claude CLI в OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-06T15:30:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 423928fd36c66729985208d4d3f53aff1f94f63b908df85072988bdc41d5cf46
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic створює сімейство моделей **Claude** і надає доступ через API та
Claude CLI. В OpenClaw підтримуються як API-ключі Anthropic, так і повторне використання Claude CLI.
Наявні застарілі профілі токенів Anthropic, якщо вони вже налаштовані, і далі
враховуються під час виконання.

<Warning>
Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тож
OpenClaw вважає повторне використання Claude CLI та використання `claude -p` санкціонованими для цієї
інтеграції, якщо Anthropic не опублікує нову політику.

Для довготривалих хостів gateway API-ключі Anthropic усе ще є найзрозумілішим і
найпередбачуванішим шляхом для production. Якщо ви вже використовуєте Claude CLI на хості,
OpenClaw може безпосередньо повторно використати цей вхід.

Поточна публічна документація Anthropic:

- [Довідник CLI Claude Code](https://code.claude.com/docs/en/cli-reference)
- [Огляд Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Використання Claude Code з вашим планом Pro або Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Використання Claude Code з вашим планом Team або Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

Якщо вам потрібен найзрозуміліший шлях виставлення рахунків, натомість використовуйте API-ключ Anthropic.
OpenClaw також підтримує інші варіанти на основі підписки, зокрема [OpenAI
Codex](/uk/providers/openai), [Qwen Cloud Coding Plan](/uk/providers/qwen),
[MiniMax Coding Plan](/uk/providers/minimax) і [Z.AI / GLM Coding
Plan](/uk/providers/glm).
</Warning>

## Варіант A: API-ключ Anthropic

**Найкраще підходить для:** стандартного доступу до API і тарифікації за використанням.
Створіть API-ключ у Anthropic Console.

### Налаштування CLI

```bash
openclaw onboard
# choose: Anthropic API key

# or non-interactive
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Фрагмент конфігурації Anthropic

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Типові параметри thinking (Claude 4.6)

- Для моделей Anthropic Claude 4.6 в OpenClaw типовим значенням є `adaptive` thinking, якщо явний рівень thinking не задано.
- Ви можете перевизначити його для окремого повідомлення (`/think:<level>`) або в параметрах моделі:
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- Пов’язана документація Anthropic:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Fast mode (Anthropic API)

Спільне перемикання `/fast` в OpenClaw також підтримує прямий публічний трафік Anthropic, зокрема запити з автентифікацією через API-ключ і OAuth, надіслані до `api.anthropic.com`.

- `/fast on` зіставляється з `service_tier: "auto"`
- `/fast off` зіставляється з `service_tier: "standard_only"`
- Типове значення в конфігурації:

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

Важливі обмеження:

- OpenClaw додає рівні сервісу Anthropic лише для прямих запитів до `api.anthropic.com`. Якщо ви маршрутизуєте `anthropic/*` через proxy або gateway, `/fast` не змінює `service_tier`.
- Явні параметри моделі Anthropic `serviceTier` або `service_tier` перевизначають типове значення `/fast`, якщо встановлено обидва.
- Anthropic повідомляє про фактичний рівень у відповіді в полі `usage.service_tier`. Для облікових записів без місткості Priority Tier значення `service_tier: "auto"` усе одно може розв’язатися як `standard`.

## Кешування prompt (Anthropic API)

OpenClaw підтримує функцію кешування prompt від Anthropic. Це **лише для API**; застаріла автентифікація токеном Anthropic не враховує параметри кешу.

### Конфігурація

Використовуйте параметр `cacheRetention` у конфігурації моделі:

| Value   | Тривалість кешу | Опис |
| ------- | -------------- | ---- |
| `none`  | Без кешування | Вимкнути кешування prompt |
| `short` | 5 хвилин      | Типово для автентифікації за API Key |
| `long`  | 1 година         | Розширений кеш |

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

### Типові значення

Коли використовується автентифікація через API Key Anthropic, OpenClaw автоматично застосовує `cacheRetention: "short"` (5-хвилинний кеш) для всіх моделей Anthropic. Ви можете перевизначити це, явно встановивши `cacheRetention` у конфігурації.

### Перевизначення cacheRetention для окремого агента

Використовуйте params на рівні моделі як базовий рівень, а потім перевизначайте конкретних агентів через `agents.list[].params`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // baseline for most agents
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // override for this agent only
    ],
  },
}
```

Порядок злиття конфігурації для параметрів, пов’язаних із кешем:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (для відповідного `id`, перевизначає за ключем)

Це дає змогу одному агенту зберігати довготривалий кеш, тоді як інший агент на тій самій моделі вимикає кешування, щоб уникнути витрат на запис для імпульсного трафіку з низьким повторним використанням.

### Примітки щодо Bedrock Claude

- Моделі Anthropic Claude на Bedrock (`amazon-bedrock/*anthropic.claude*`) приймають наскрізну передачу `cacheRetention`, якщо її налаштовано.
- Для моделей Bedrock, що не належать Anthropic, під час виконання примусово встановлюється `cacheRetention: "none"`.
- Розумні типові значення Anthropic API-key також встановлюють `cacheRetention: "short"` для посилань на моделі Claude-on-Bedrock, якщо явне значення не задано.

## Вікно контексту 1M (бета Anthropic)

Вікно контексту Anthropic 1M перебуває за beta-gate. В OpenClaw його можна ввімкнути для кожної моделі окремо
через `params.context1m: true` для підтримуваних моделей Opus/Sonnet.

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

OpenClaw зіставляє це з `anthropic-beta: context-1m-2025-08-07` у запитах
Anthropic.

Це активується лише тоді, коли для цієї моделі `params.context1m` явно встановлено в `true`.

Вимога: Anthropic має дозволяти використання довгого контексту для цих облікових даних.

Примітка: Anthropic наразі відхиляє бета-запити `context-1m-*` під час використання
застарілої автентифікації токеном Anthropic (`sk-ant-oat-*`). Якщо ви налаштуєте
`context1m: true` з цим застарілим режимом автентифікації, OpenClaw запише попередження в журнал і
повернеться до стандартного вікна контексту, пропустивши заголовок бета `context1m`,
але зберігши обов’язкові бета-заголовки OAuth.

## Бекенд Claude CLI

Вбудований бекенд Anthropic `claude-cli` підтримується в OpenClaw.

- Співробітники Anthropic повідомили нам, що таке використання знову дозволене.
- Тому OpenClaw вважає повторне використання Claude CLI та використання `claude -p`
  санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику.
- API-ключі Anthropic залишаються найзрозумілішим шляхом для production для постійно активних хостів gateway
  та явного серверного контролю виставлення рахунків.
- Докладно про налаштування та виконання див. у [/gateway/cli-backends](/uk/gateway/cli-backends).

## Примітки

- У публічній документації Anthropic про Claude Code усе ще описано пряме використання CLI, таке як
  `claude -p`, а співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw
  знову дозволене. Ми вважаємо ці вказівки остаточними, якщо Anthropic
  не опублікує нову зміну політики.
- Anthropic setup-token залишається доступним в OpenClaw як підтримуваний шлях автентифікації токеном, але OpenClaw тепер надає перевагу повторному використанню Claude CLI та `claude -p`, коли це доступно.
- Докладно про автентифікацію та правила повторного використання див. у [/concepts/oauth](/uk/concepts/oauth).

## Усунення неполадок

**Помилки 401 / токен раптово недійсний**

- Автентифікація токеном Anthropic може сплинути або бути відкликана.
- Для нових налаштувань перейдіть на API-ключ Anthropic.

**Не знайдено API-ключ для постачальника "anthropic"**

- Автентифікація є **для кожного агента окремо**. Нові агенти не успадковують ключі головного агента.
- Повторно запустіть onboarding для цього агента або налаштуйте API-ключ на хості
  gateway, а потім перевірте через `openclaw models status`.

**Не знайдено облікових даних для профілю `anthropic:default`**

- Виконайте `openclaw models status`, щоб побачити, який профіль автентифікації активний.
- Повторно запустіть onboarding або налаштуйте API-ключ для шляху цього профілю.

**Немає доступного профілю автентифікації (усі в кулдауні/недоступні)**

- Перевірте `openclaw models status --json` для `auth.unusableProfiles`.
- Кулдауни rate-limit Anthropic можуть бути прив’язані до конкретної моделі, тож споріднена модель Anthropic
  усе ще може бути придатною, навіть якщо поточна перебуває в кулдауні.
- Додайте інший профіль Anthropic або дочекайтеся завершення кулдауну.

Докладніше: [/gateway/troubleshooting](/uk/gateway/troubleshooting) і [/help/faq](/uk/help/faq).
