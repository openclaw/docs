---
read_when:
    - Ви хочете побачити, які Skills доступні та готові до запуску
    - Ви хочете шукати, встановлювати або оновлювати Skills із ClawHub
    - Ви хочете налагодити відсутні бінарні файли/змінні середовища/конфігурацію для Skills
summary: Довідка CLI для `openclaw skills` (пошук/встановлення/оновлення/список/інформація/перевірка)
title: Skills
x-i18n:
    generated_at: "2026-04-23T06:19:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11af59b1b6bff19cc043acd8d67bdd4303201d3f75f23c948b83bf14882c7bb1
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

Перевіряйте локальні Skills і встановлюйте/оновлюйте Skills із ClawHub.

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

`search`/`install`/`update` використовують ClawHub безпосередньо й установлюють у активний
каталог робочого простору `skills/`. `list`/`info`/`check` і далі перевіряють локальні
Skills, видимі для поточного робочого простору та конфігурації.

Ця команда CLI `install` завантажує теки Skills із ClawHub. Установлення залежностей skill через gateway,
які запускаються з onboarding або налаштувань Skills, натомість використовують окремий
шлях запиту `skills.install`.

Примітки:

- `search [query...]` приймає необов’язковий пошуковий запит; не вказуйте його, щоб переглянути стандартну
  стрічку пошуку ClawHub.
- `search --limit <n>` обмежує кількість повернених результатів.
- `install --force` перезаписує наявну теку workspace skill для того самого
  slug.
- `update --all` оновлює лише відстежувані встановлення з ClawHub в активному workspace.
- `list` є дією за замовчуванням, якщо підкоманду не вказано.
- `list`, `info` і `check` записують свій відрендерений вивід у stdout. З
  `--json` це означає, що машинозчитуване корисне навантаження лишається в stdout для конвеєрів
  і скриптів.
