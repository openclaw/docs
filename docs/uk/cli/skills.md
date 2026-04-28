---
read_when:
    - Ви хочете побачити, які Skills доступні та готові до запуску
    - Ви хочете знайти, встановити або оновити Skills з ClawHub
    - Ви хочете налагодити відсутні бінарні файли/env/конфігурацію для Skills
summary: Довідка CLI для `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-04-28T00:10:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5059bf04c68dabe289d2c376407a52989c970e3d16e7637a2c83f4e24ad6564c
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

Переглядайте локальні Skills та встановлюйте/оновлюйте Skills з ClawHub.

Пов’язане:

- Система Skills: [Skills](/uk/tools/skills)
- Конфігурація Skills: [Skills config](/uk/tools/skills-config)
- Встановлення з ClawHub: [ClawHub](/uk/tools/clawhub)

## Команди

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills install <slug> --agent <id>
openclaw skills update <slug>
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --json
openclaw skills check --agent <id>
```

`search`/`install`/`update` напряму використовують ClawHub і встановлюють у активний
каталог робочого простору `skills/`. `list`/`info`/`check` як і раніше перевіряють локальні
Skills, видимі для поточного робочого простору та конфігурації. Команди, що
працюють з робочим простором, визначають цільовий робочий простір через `--agent <id>`,
потім через поточний робочий каталог, якщо він знаходиться всередині налаштованого
робочого простору агента, а потім через агента за замовчуванням.

Ця команда CLI `install` завантажує теки Skills з ClawHub. Встановлення залежностей
Skills через Gateway, які запускаються під час онбордингу або з налаштувань Skills,
замість цього використовують окремий шлях запиту `skills.install`.

Примітки:

- `search [query...]` приймає необов’язковий запит; не вказуйте його, щоб переглянути стандартну
  стрічку пошуку ClawHub.
- `search --limit <n>` обмежує кількість повернених результатів.
- `install --force` перезаписує наявну теку Skills робочого простору для того самого
  slug.
- `--agent <id>` націлюється на один налаштований робочий простір агента та перевизначає
  визначення за поточним робочим каталогом.
- `update --all` оновлює лише відстежувані встановлення з ClawHub в активному робочому просторі.
- `list` є дією за замовчуванням, якщо не вказано підкоманду.
- `list`, `info` і `check` записують свій відформатований вивід у stdout. З
  `--json` це означає, що машинозчитувані дані залишаються у stdout для каналів
  і скриптів.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Skills](/uk/tools/skills)
