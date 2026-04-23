---
read_when:
    - Ви хочете побачити, які Skills доступні та готові до запуску
    - Ви хочете шукати, встановлювати або оновлювати Skills з ClawHub
    - Ви хочете налагодити відсутні binaries/env/config для Skills
summary: Довідник CLI для `openclaw skills` (пошук/встановлення/оновлення/список/інформація/перевірка)
title: Skills
x-i18n:
    generated_at: "2026-04-23T20:48:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8490cd16bfb2120162af9503acb873d434ae4010b4c0270a4aa76991a4316ae
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

Перегляд локальних Skills і встановлення/оновлення Skills з ClawHub.

Пов’язане:

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
openclaw skills update <slug>
openclaw skills update --all
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills check
openclaw skills check --json
```

`search`/`install`/`update` напряму використовують ClawHub і встановлюють у каталог `skills/` активного робочого простору. `list`/`info`/`check` і далі перевіряють локальні Skills, видимі з поточного робочого простору та конфігурації.

Ця команда CLI `install` завантажує папки Skill з ClawHub. Встановлення залежностей Skill через Gateway, ініційовані з onboarding або налаштувань Skills, використовують натомість окремий шлях запиту `skills.install`.

Примітки:

- `search [query...]` приймає необов’язковий запит; не вказуйте його, щоб переглянути типовий пошуковий канал ClawHub.
- `search --limit <n>` обмежує кількість повернених результатів.
- `install --force` перезаписує наявну папку Skill у робочому просторі для того самого slug.
- `update --all` оновлює лише відстежувані встановлення ClawHub в активному робочому просторі.
- `list` є типовою дією, якщо не вказано підкоманду.
- `list`, `info` і `check` записують свій відрендерений вивід у stdout. З `--json` це означає, що payload для машинного читання залишається у stdout для pipe і скриптів.
