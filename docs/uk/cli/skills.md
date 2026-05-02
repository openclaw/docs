---
read_when:
    - Ви хочете переглянути, які Skills доступні та готові до запуску
    - Ви хочете шукати, встановлювати або оновлювати Skills із ClawHub
    - Ви хочете налагодити відсутні бінарні файли, змінні середовища або конфігурацію для Skills
summary: Довідник CLI для `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-05-02T18:57:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: d819cdc421151a0093423f57a9e974489e9cc02de644358bd5700ee75181192e
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Переглядайте локальні Skills та встановлюйте/оновлюйте Skills із ClawHub.

Пов’язано:

- Система Skills: [Skills](/uk/tools/skills)
- Конфігурація Skills: [Конфігурація Skills](/uk/tools/skills-config)
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
openclaw skills check --agent <id>
openclaw skills check --json
```

`search`/`install`/`update` використовують ClawHub напряму та встановлюють у
каталог `skills/` активного робочого простору. `list`/`info`/`check` і надалі
перевіряють локальні Skills, видимі для поточного робочого простору та конфігурації.
Команди, що спираються на робочий простір, визначають цільовий робочий простір
із `--agent <id>`, потім із поточного робочого каталогу, якщо він розташований
усередині налаштованого робочого простору агента, а потім із типового агента.

Ця команда CLI `install` завантажує папки Skills із ClawHub. Встановлення
залежностей Skills через Gateway, запущені з onboarding або налаштувань Skills,
натомість використовують окремий шлях запиту `skills.install`.

Примітки:

- `search [query...]` приймає необов’язковий запит; пропустіть його, щоб переглянути типовий
  пошуковий потік ClawHub.
- `search --limit <n>` обмежує кількість повернених результатів.
- `install --force` перезаписує наявну папку Skill робочого простору для того самого
  slug.
- `--agent <id>` націлюється на один налаштований робочий простір агента та перевизначає
  визначення з поточного робочого каталогу.
- `update --all` оновлює лише відстежувані встановлення ClawHub в активному робочому просторі.
- `check --agent <id>` перевіряє робочий простір вибраного агента та повідомляє, які
  готові Skills фактично видимі для prompt або командної поверхні цього агента.
- `list` є типовою дією, якщо підкоманду не вказано.
- `list`, `info` і `check` записують відрендерений вивід у stdout. З
  `--json` це означає, що машиночитне корисне навантаження залишається в stdout для каналів
  і скриптів.

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Skills](/uk/tools/skills)
