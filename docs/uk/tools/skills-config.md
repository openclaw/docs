---
read_when:
    - Додавання або змінення конфігурації Skills
    - Налаштування вбудованого списку дозволених або поведінки встановлення
summary: Схема конфігурації Skills і приклади
title: Конфігурація Skills
x-i18n:
    generated_at: "2026-05-05T23:54:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1acfd34c7af3b8909187d77ae74c52656b5dcfa1abf42ca6a7fdb391854e5c7c
    source_path: tools/skills-config.md
    workflow: 16
---

Більшість конфігурації завантажувача/встановлення Skills міститься в `skills` у
`~/.openclaw/openclaw.json`. Видимість Skills для конкретного агента міститься в
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

Для вбудованої генерації/редагування зображень віддавайте перевагу `agents.defaults.imageGenerationModel`
разом з основним інструментом `image_generate`. `skills.entries.*` призначено лише для кастомних або
сторонніх робочих процесів Skills.

Якщо ви вибираєте конкретного провайдера/модель зображень, також налаштуйте
автентифікацію/API-ключ цього провайдера. Типові приклади: `GEMINI_API_KEY` або `GOOGLE_API_KEY` для
`google/*`, `OPENAI_API_KEY` для `openai/*` і `FAL_KEY` для `fal/*`.

Приклади:

- Нативне налаштування у стилі Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Нативне налаштування fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Списки дозволених Skills для агента

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

- `agents.defaults.skills`: спільний базовий список дозволених Skills для агентів, у яких не задано
  `agents.list[].skills`.
- Не вказуйте `agents.defaults.skills`, щоб за замовчуванням не обмежувати Skills.
- `agents.list[].skills`: явний фінальний набір Skills для цього агента; він не
  об’єднується зі значеннями за замовчуванням.
- `agents.list[].skills: []`: не показувати жодних Skills для цього агента.

## Поля

- Вбудовані корені Skills завжди включають `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` і `<workspace>/skills`.
- `allowBundled`: необов’язковий список дозволених лише для **пакетних** Skills. Якщо задано, придатними є тільки
  пакетні Skills зі списку (керовані, агентські та робочопросторові Skills не зачіпаються).
- `load.extraDirs`: додаткові каталоги Skills для сканування (найнижчий пріоритет).
- `load.watch`: стежити за папками Skills і оновлювати знімок Skills (за замовчуванням: true).
- `load.watchDebounceMs`: debounce для подій спостерігача Skills у мілісекундах (за замовчуванням: 250).
- `install.preferBrew`: віддавати перевагу інсталяторам brew, коли вони доступні (за замовчуванням: true).
- `install.nodeManager`: пріоритет інсталятора node (`npm` | `pnpm` | `yarn` | `bun`, за замовчуванням: npm).
  Це впливає лише на **встановлення Skills**; runtime Gateway усе одно має бути Node
  (Bun не рекомендовано для WhatsApp/Telegram).
  - `openclaw setup --node-manager` має вужчу дію й наразі приймає `npm`,
    `pnpm` або `bun`. Задайте `skills.install.nodeManager: "yarn"` вручну, якщо
    хочете встановлення Skills із використанням Yarn.
- `entries.<skillKey>`: перевизначення для окремих Skills.
- `agents.defaults.skills`: необов’язковий стандартний список дозволених Skills, який успадковують агенти,
  у яких не задано `agents.list[].skills`.
- `agents.list[].skills`: необов’язковий фінальний список дозволених Skills для окремого агента; явні
  списки замінюють успадковані значення за замовчуванням, а не об’єднуються з ними.

Поля для окремих Skills:

- `enabled`: задайте `false`, щоб вимкнути Skills, навіть якщо вона пакетна/встановлена.
- `env`: змінні середовища, які ін’єктуються для запуску агента (лише якщо їх ще не задано).
- `apiKey`: необов’язкова зручність для Skills, які оголошують основну змінну середовища.
  Підтримує відкритий текстовий рядок або об’єкт SecretRef (`{ source, provider, id }`).

## Примітки

- Ключі в `entries` за замовчуванням зіставляються з назвою Skills. Якщо Skills визначає
  `metadata.openclaw.skillKey`, використовуйте натомість цей ключ.
- Пріоритет завантаження: `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → пакетні Skills →
  `skills.load.extraDirs`.
- Зміни в Skills підхоплюються на наступному ході агента, коли спостерігач увімкнений.

### Пісочничні Skills і змінні середовища

Коли сеанс **пісочничний**, процеси Skills запускаються всередині налаштованого sandbox backend. Пісочниця **не** успадковує `process.env` хоста.

<Warning>
  Глобальні `env` і `skills.entries.<skill>.env`/`apiKey` застосовуються лише до запусків на **хості**. Усередині пісочниці вони не мають ефекту, тому Skills, що залежить від `GEMINI_API_KEY`, завершиться помилкою `apiKey not configured`, якщо змінну не передати пісочниці окремо.
</Warning>

Використайте один із варіантів:

- `agents.defaults.sandbox.docker.env` для Docker backend (або `agents.list[].sandbox.docker.env` для окремого агента).
- Вбудуйте env у кастомний образ пісочниці або віддалене середовище пісочниці.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Skills" href="/uk/tools/skills" icon="puzzle-piece">
    Що таке Skills і як вони завантажуються.
  </Card>
  <Card title="Створення Skills" href="/uk/tools/creating-skills" icon="hammer">
    Створення кастомних пакетів Skills.
  </Card>
  <Card title="Slash-команди" href="/uk/tools/slash-commands" icon="terminal">
    Нативний каталог команд і директиви чату.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема `skills` і `agents.skills`.
  </Card>
</CardGroup>
