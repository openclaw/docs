---
read_when:
    - Додавання або змінення конфігурації Skills
    - Налаштування вбудованого списку дозволених або поведінки встановлення
summary: Схема конфігурації Skills і приклади
title: Конфігурація Skills
x-i18n:
    generated_at: "2026-05-11T21:02:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7dad312d69c93544d8e7f9537fdd50f02345166ea629291160a30f19f0a8b340
    source_path: tools/skills-config.md
    workflow: 16
---

Більшість конфігурації завантажувача/встановлення Skills зберігається в `skills` у
`~/.openclaw/openclaw.json`. Видимість Skills для окремого агента зберігається в
`agents.defaults.skills` і `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
      allowUploadedArchives: false,
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

Для вбудованого створення/редагування зображень віддавайте перевагу `agents.defaults.imageGenerationModel`
разом із базовим інструментом `image_generate`. `skills.entries.*` призначено лише для власних або
сторонніх робочих процесів Skills.

Якщо ви вибираєте конкретного провайдера/модель зображень, також налаштуйте
автентифікацію/API-ключ цього провайдера. Типові приклади: `GEMINI_API_KEY` або `GOOGLE_API_KEY` для
`google/*`, `OPENAI_API_KEY` для `openai/*` і `FAL_KEY` для `fal/*`.

Приклади:

- Нативне налаштування в стилі Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Нативне налаштування fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Списки дозволених Skills для агентів

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

- `agents.defaults.skills`: спільний базовий список дозволених Skills для агентів, які не задають
  `agents.list[].skills`.
- Не вказуйте `agents.defaults.skills`, щоб Skills за замовчуванням лишалися необмеженими.
- `agents.list[].skills`: явний кінцевий набір Skills для цього агента; він не
  об’єднується зі стандартними значеннями.
- `agents.list[].skills: []`: не показувати жодних Skills для цього агента.

## Поля

- Вбудовані корені Skills завжди включають `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` і `<workspace>/skills`.
- `allowBundled`: необов’язковий список дозволених лише для **вбудованих** Skills. Якщо задано, придатними є лише
  вбудовані Skills зі списку (керовані, агентські та Skills робочого простору не зачіпаються).
- `load.extraDirs`: додаткові каталоги Skills для сканування (найнижчий пріоритет).
- `load.allowSymlinkTargets`: довірені реальні цільові каталоги, у які можуть вказувати символьні посилання
  папок Skills, навіть якщо символьне посилання розташоване поза цим
  цільовим коренем. Використовуйте це для навмисних схем із сусідніми репозиторіями, як-от
  `~/.agents/skills/manager -> ~/Projects/manager/skills`.
- `load.watch`: стежити за папками Skills і оновлювати знімок Skills (за замовчуванням: true).
- `load.watchDebounceMs`: затримка усунення брязкоту для подій спостерігача Skills у мілісекундах (за замовчуванням: 250).
- `install.preferBrew`: віддавати перевагу інсталяторам brew, коли вони доступні (за замовчуванням: true).
- `install.nodeManager`: бажаний інсталятор Node (`npm` | `pnpm` | `yarn` | `bun`, за замовчуванням: npm).
  Це впливає лише на **встановлення Skills**; середовище виконання Gateway усе одно має бути Node
  (Bun не рекомендовано для WhatsApp/Telegram).
  - `openclaw setup --node-manager` має вужчу дію й наразі приймає `npm`,
    `pnpm` або `bun`. Задайте `skills.install.nodeManager: "yarn"` вручну, якщо
    хочете встановлення Skills на основі Yarn.
- `install.allowUploadedArchives`: дозволити довіреним клієнтам Gateway `operator.admin`
  встановлювати приватні zip-архіви, підготовлені через `skills.upload.*`
  (за замовчуванням: false). Це вмикає лише шлях завантажених архівів; звичайні встановлення ClawHub
  цього не потребують.
- `entries.<skillKey>`: перевизначення для окремих Skills.
- `agents.defaults.skills`: необов’язковий стандартний список дозволених Skills, який успадковують агенти,
  що не задають `agents.list[].skills`.
- `agents.list[].skills`: необов’язковий кінцевий список дозволених Skills для окремого агента; явні
  списки замінюють успадковані стандартні значення, а не об’єднуються з ними.

## Символьні посилання на сусідні репозиторії

За замовчуванням кожен корінь Skills є межею ізоляції. Якщо папка Skills під
`~/.agents/skills` є символьним посиланням, що вказує поза `~/.agents/skills`,
OpenClaw пропускає її та записує в журнал `Skipping escaped skill path outside its configured
root`.

Збережіть схему символьних посилань і дозвольте лише довірений цільовий корінь:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

З цією конфігурацією символьне посилання на кшталт
`~/.agents/skills/manager -> ~/Projects/manager/skills` приймається після
розв’язання realpath. `extraDirs` також сканує сусідній репозиторій напряму, тоді як
`allowSymlinkTargets` зберігає шлях через символьне посилання для наявних
схем Skills агентів. Тримайте цільові записи вузькими; не вказуйте широкі корені, як-от `~` або
`~/Projects`, якщо кожному дереву Skills під цим коренем не можна довіряти.

Поля окремих Skills:

- `enabled`: задайте `false`, щоб вимкнути Skill, навіть якщо він вбудований/встановлений.
- `env`: змінні середовища, які додаються для запуску агента (лише якщо ще не задані).
- `apiKey`: необов’язкова зручність для Skills, що оголошують основну змінну середовища.
  Підтримує відкритий текстовий рядок або об’єкт SecretRef (`{ source, provider, id }`).

## Примітки

- Ключі в `entries` за замовчуванням відповідають назві Skill. Якщо Skill визначає
  `metadata.openclaw.skillKey`, використовуйте натомість цей ключ.
- Пріоритет завантаження: `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → вбудовані Skills →
  `skills.load.extraDirs`.
- Зміни в Skills підхоплюються на наступному ході агента, коли спостерігач увімкнений.

### Ізольовані Skills і змінні середовища

Коли сесія **ізольована**, процеси Skills запускаються всередині налаштованого бекенду ізоляції. Ізоляція **не** успадковує `process.env` хоста.

<Warning>
  Глобальні `env` і `skills.entries.<skill>.env`/`apiKey` застосовуються лише до запусків на **хості**. Усередині ізоляції вони не мають ефекту, тому Skill, який залежить від `GEMINI_API_KEY`, завершиться помилкою `apiKey not configured`, якщо змінну не буде окремо передано ізоляції.
</Warning>

Використайте один із варіантів:

- `agents.defaults.sandbox.docker.env` для бекенду Docker (або `agents.list[].sandbox.docker.env` для окремого агента).
- Вбудуйте env у власний образ ізоляції або віддалене середовище ізоляції.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Skills" href="/uk/tools/skills" icon="puzzle-piece">
    Що таке Skills і як вони завантажуються.
  </Card>
  <Card title="Створення Skills" href="/uk/tools/creating-skills" icon="hammer">
    Написання власних пакетів Skills.
  </Card>
  <Card title="Slash-команди" href="/uk/tools/slash-commands" icon="terminal">
    Нативний каталог команд і директиви чату.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема `skills` і `agents.skills`.
  </Card>
</CardGroup>
