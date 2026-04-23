---
read_when:
    - Додавання або зміна config Skills
    - Налаштування bundled allowlist або поведінки встановлення
summary: Схема config Skills і приклади
title: Config Skills
x-i18n:
    generated_at: "2026-04-23T21:16:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03c3bef00ca365bfa1dd3159dfa783909ae72a6d2e819d495e2f41a1839c6938
    source_path: tools/skills-config.md
    workflow: 15
---

Більшість конфігурації завантаження/встановлення Skills живе в `skills` у
`~/.openclaw/openclaw.json`. Видимість Skills для конкретного агента живе в
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
      nodeManager: "npm", // npm | pnpm | yarn | bun (runtime Gateway усе ще Node; bun не рекомендовано)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // або plaintext string
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
разом із core-інструментом `image_generate`. `skills.entries.*` призначений лише для custom- або
сторонніх workflow Skills.

Якщо ви вибираєте конкретний provider/model для зображень, також налаштуйте
auth/API key цього provider-а. Типові приклади: `GEMINI_API_KEY` або `GOOGLE_API_KEY` для
`google/*`, `OPENAI_API_KEY` для `openai/*` і `FAL_KEY` для `fal/*`.

Приклади:

- Нативне налаштування в стилі Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Нативне налаштування fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Allowlist-и Skills для агента

Використовуйте config агента, коли хочете ті самі корені Skill machine/workspace, але
різні видимі набори Skill для кожного агента.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // успадковує defaults -> github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює defaults
      { id: "locked-down", skills: [] }, // без Skills
    ],
  },
}
```

Правила:

- `agents.defaults.skills`: спільний baseline allowlist для агентів, які пропускають
  `agents.list[].skills`.
- Пропустіть `agents.defaults.skills`, щоб типово не обмежувати Skills.
- `agents.list[].skills`: явний фінальний набір Skills для цього агента; він не
  зливається з defaults.
- `agents.list[].skills: []`: не показувати Skills для цього агента.

## Поля

- Вбудовані корені Skill завжди включають `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` і `<workspace>/skills`.
- `allowBundled`: необов’язковий allowlist лише для **bundled** Skills. Коли його задано, придатними є лише bundled Skills зі списку (managed, agent і workspace Skills не зачіпаються).
- `load.extraDirs`: додаткові каталоги Skill для сканування (найнижчий пріоритет).
- `load.watch`: стежити за папками Skill і оновлювати snapshot Skills (типово: true).
- `load.watchDebounceMs`: debounce для подій watcher-а Skill у мілісекундах (типово: 250).
- `install.preferBrew`: надавати перевагу brew-інсталяторам, коли вони доступні (типово: true).
- `install.nodeManager`: бажаний node-інсталятор (`npm` | `pnpm` | `yarn` | `bun`, типово: npm).
  Це впливає лише на **встановлення Skill**; runtime Gateway усе ще має бути на Node
  (Bun не рекомендований для WhatsApp/Telegram).
  - `openclaw setup --node-manager` має вужчу область і наразі приймає `npm`,
    `pnpm` або `bun`. Задайте `skills.install.nodeManager: "yarn"` вручну, якщо
    хочете встановлення Skill на основі Yarn.
- `entries.<skillKey>`: перевизначення для окремого Skill.
- `agents.defaults.skills`: необов’язковий типовий allowlist Skills, який успадковується агентами,
  що пропускають `agents.list[].skills`.
- `agents.list[].skills`: необов’язковий фінальний allowlist Skills для окремого агента; явні
  списки замінюють успадковані defaults, а не зливаються з ними.

Поля для окремого Skill:

- `enabled`: задайте `false`, щоб вимкнути Skill, навіть якщо він bundled/встановлений.
- `env`: змінні середовища, які впроваджуються для запуску агента (лише якщо їх ще не задано).
- `apiKey`: необов’язковий зручний варіант для Skills, які оголошують основну env-змінну.
  Підтримує plaintext string або об’єкт SecretRef (`{ source, provider, id }`).

## Примітки

- Ключі під `entries` типово відповідають назві Skill. Якщо Skill задає
  `metadata.openclaw.skillKey`, використовуйте натомість цей ключ.
- Пріоритет завантаження: `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → bundled Skills →
  `skills.load.extraDirs`.
- Зміни в Skills підхоплюються на наступному ході агента, коли watcher увімкнений.

### Sandboxed Skills + env-змінні

Коли session є **sandboxed**, процеси Skill виконуються всередині налаштованого
backend пісочниці. Пісочниця **не** успадковує host `process.env`.

Використовуйте один із варіантів:

- `agents.defaults.sandbox.docker.env` для backend-а Docker (або `agents.list[].sandbox.docker.env` для окремого агента)
- bake-ніть env у свій кастомний sandbox image або у віддалене sandbox-середовище

Глобальні `env` і `skills.entries.<skill>.env/apiKey` застосовуються лише до **host**-запусків.
