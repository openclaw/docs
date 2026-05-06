---
read_when:
    - Додавання або змінення конфігурації Skills
    - Налаштування вбудованого списку дозволених або поведінки встановлення
summary: Схема конфігурації Skills і приклади
title: Конфігурація Skills
x-i18n:
    generated_at: "2026-05-06T06:20:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8996b3df73a9f0176b541c5d3f9670615f9a879a41838cf5d35d0a455e9f5088
    source_path: tools/skills-config.md
    workflow: 16
---

Більшість конфігурації завантаження/встановлення Skills розташована в `skills` у
`~/.openclaw/openclaw.json`. Видимість Skills для конкретного агента розташована в
`agents.defaults.skills` і `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Для вбудованої генерації/редагування зображень надавайте перевагу `agents.defaults.imageGenerationModel`
разом із основним інструментом `image_generate`. `skills.entries.*` призначено лише для користувацьких або
сторонніх робочих процесів Skills.

Якщо ви вибираєте конкретного провайдера/модель зображень, також налаштуйте
автентифікацію/API-ключ цього провайдера. Типові приклади: `GEMINI_API_KEY` або `GOOGLE_API_KEY` для
`google/*`, `OPENAI_API_KEY` для `openai/*` і `FAL_KEY` для `fal/*`.

Приклади:

- Нативне налаштування в стилі Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Нативне налаштування fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Дозволені списки Skills для агентів

Використовуйте конфігурацію агента, коли потрібні ті самі корені Skills для машини/робочого простору, але
інший видимий набір Skills для кожного агента.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits defaults -> github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

Правила:

- `agents.defaults.skills`: спільний базовий дозволений список для агентів, які не вказують
  `agents.list[].skills`.
- Не вказуйте `agents.defaults.skills`, щоб за замовчуванням не обмежувати Skills.
- `agents.list[].skills`: явний остаточний набір Skills для цього агента; він не
  об'єднується зі значеннями за замовчуванням.
- `agents.list[].skills: []`: не відкривати жодних Skills для цього агента.

## Поля

- Вбудовані корені Skills завжди включають `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` і `<workspace>/skills`.
- `allowBundled`: необов'язковий дозволений список лише для **пакетних** Skills. Якщо задано, придатними є лише
  пакетні Skills зі списку (керовані, агентські та робочого простору Skills не зачіпаються).
- `load.extraDirs`: додаткові каталоги Skills для сканування (найнижчий пріоритет).
- `load.watch`: спостерігати за папками Skills і оновлювати знімок Skills (за замовчуванням: true).
- `load.watchDebounceMs`: затримка debounce для подій спостерігача Skills у мілісекундах (за замовчуванням: 250).
- `install.preferBrew`: надавати перевагу інсталяторам brew, коли вони доступні (за замовчуванням: true).
- `install.nodeManager`: пріоритетний інсталятор node (`npm` | `pnpm` | `yarn` | `bun`, за замовчуванням: npm).
  Це впливає лише на **встановлення Skills**; середовище виконання Gateway усе одно має бути Node
  (Bun не рекомендовано для WhatsApp/Telegram).
  - `openclaw setup --node-manager` має вужчу сферу й наразі приймає `npm`,
    `pnpm` або `bun`. Установіть `skills.install.nodeManager: "yarn"` вручну, якщо
    потрібні встановлення Skills на базі Yarn.
- `entries.<skillKey>`: перевизначення для окремих Skills.
- `agents.defaults.skills`: необов'язковий дозволений список Skills за замовчуванням, який успадковують агенти,
  що не вказують `agents.list[].skills`.
- `agents.list[].skills`: необов'язковий остаточний дозволений список Skills для окремого агента; явні
  списки замінюють успадковані значення за замовчуванням замість об'єднання.

Поля для окремих Skills:

- `enabled`: установіть `false`, щоб вимкнути Skills, навіть якщо вона пакетна/встановлена.
- `env`: змінні середовища, що інжектуються для запуску агента (лише якщо ще не задані).
- `apiKey`: необов'язкова зручність для Skills, які оголошують основну змінну середовища.
  Підтримує відкритий текстовий рядок або об'єкт SecretRef (`{ source, provider, id }`).

## Примітки

- Ключі в `entries` за замовчуванням відповідають назві Skills. Якщо Skills визначає
  `metadata.openclaw.skillKey`, використовуйте цей ключ натомість.
- Пріоритет завантаження: `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → пакетні Skills →
  `skills.load.extraDirs`.
- Зміни в Skills підхоплюються на наступному ході агента, коли спостерігач увімкнений.

### Пісочничні Skills і змінні env

Коли сесія **пісочнична**, процеси Skills запускаються всередині налаштованого бекенда пісочниці. Пісочниця **не** успадковує `process.env` хоста.

<Warning>
  Глобальні `env` і `skills.entries.<skill>.env`/`apiKey` застосовуються лише до запусків на **хості**. Усередині пісочниці вони не мають ефекту, тому Skills, що залежить від `GEMINI_API_KEY`, завершиться помилкою `apiKey not configured`, якщо пісочниці не надати цю змінну окремо.
</Warning>

Використайте один із варіантів:

- `agents.defaults.sandbox.docker.env` для бекенда Docker (або `agents.list[].sandbox.docker.env` для окремого агента).
- Вбудуйте env у власний образ пісочниці або віддалене середовище пісочниці.

## Пов'язане

<CardGroup cols={2}>
  <Card title="Skills" href="/uk/tools/skills" icon="puzzle-piece">
    Що таке Skills і як вони завантажуються.
  </Card>
  <Card title="Creating skills" href="/uk/tools/creating-skills" icon="hammer">
    Створення користувацьких пакетів Skills.
  </Card>
  <Card title="Slash commands" href="/uk/tools/slash-commands" icon="terminal">
    Нативний каталог команд і директиви чату.
  </Card>
  <Card title="Configuration reference" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема `skills` і `agents.skills`.
  </Card>
</CardGroup>
