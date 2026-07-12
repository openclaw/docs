---
read_when:
    - Ви хочете переглянути, які Skills доступні та готові до запуску
    - Ви хочете шукати в ClawHub або встановлювати Skills із ClawHub, Git чи локальних каталогів
    - Ви хочете перевірити навичку ClawHub за допомогою ClawHub
    - Ви хочете налагодити відсутні бінарні файли, змінні середовища або конфігурацію для Skills
summary: Довідник CLI для `openclaw skills` (пошук/встановлення/оновлення/перевірка/перелік/інформація/контроль/майстерня)
title: Skills
x-i18n:
    generated_at: "2026-07-12T13:09:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Переглядайте локальні Skills, шукайте в ClawHub, установлюйте Skills із ClawHub, Git або локальних каталогів, перевіряйте Skills із ClawHub та оновлюйте встановлення, відстежувані через ClawHub.

Пов’язані матеріали:

- Система Skills: [Skills](/uk/tools/skills)
- Майстерня Skills: [Майстерня Skills](/uk/tools/skill-workshop)
- Конфігурація Skills: [Конфігурація Skills](/uk/tools/skills-config)
- Встановлення з ClawHub: [ClawHub](/uk/clawhub/cli)

## Команди

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install @owner/<slug>
openclaw skills install @owner/<slug> --version <version>
openclaw skills install git:owner/repo
openclaw skills install git:owner/repo@main
openclaw skills install ./path/to/skill --as custom-name
openclaw skills install @owner/<slug> --force
openclaw skills install @owner/<slug> --force-install
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --force-install
openclaw skills update @owner/<slug> --acknowledge-clawhub-risk
openclaw skills update @owner/<slug> --global
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills update --all --global
openclaw skills verify @owner/<slug>
openclaw skills verify @owner/<slug> --version <version>
openclaw skills verify @owner/<slug> --tag <tag>
openclaw skills verify @owner/<slug> --card
openclaw skills verify @owner/<slug> --global
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
openclaw skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Not reusable"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`search`, `update` і `verify` використовують ClawHub безпосередньо. `install @owner/<slug>` установлює Skill із ClawHub, `install git:owner/repo[@ref]` клонує Skill із Git, а `install ./path` копіює локальний каталог Skill. За замовчуванням `install`, `update` і `verify` спрямовані на каталог `skills/` активного робочого простору; з `--global` вони спрямовані на спільний керований каталог Skills. `list`/`info`/`check` і далі перевіряють локальні Skills, видимі для поточного робочого простору та конфігурації. Команди, що працюють із робочим простором, визначають цільовий робочий простір спочатку за `--agent <id>`, потім за поточним робочим каталогом, якщо він розташований у налаштованому робочому просторі агента, і зрештою використовують агента за замовчуванням.

Для встановлення з Git і локального каталогу файл `SKILL.md` має бути в корені джерела. Ідентифікатор встановлення береться зі значення `name` у frontmatter файлу `SKILL.md`, якщо воно дійсне, а інакше — з назви каталогу джерела або репозиторію; використовуйте `--as <slug>`, щоб перевизначити його. `--version` застосовується лише до ClawHub. Встановлення Skills не підтримує специфікації пакетів npm або шляхи до zip-файлів чи архівів, а `openclaw skills update` оновлює лише встановлення, відстежувані через ClawHub.

Встановлення залежностей Skills через Gateway, запущене під час початкового налаштування або з налаштувань Skills, натомість використовує окремий шлях запиту `skills.install`.

Примітки:

| Прапорець/поведінка              | Опис                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `search [query...]`              | Необов’язковий запит; пропустіть його, щоб переглянути стандартну стрічку пошуку ClawHub.                                                                                                                                                                                                                                             |
| `search --limit <n>`             | Обмежує кількість повернених результатів.                                                                                                                                                                                                                                                                                             |
| `install git:owner/repo[@ref]`   | Установлює Skill із Git. Посилання на гілки можуть містити скісні риски, наприклад `git:owner/repo@feature/foo`.                                                                                                                                                                                                                       |
| `install ./path/to/skill`        | Установлює локальний каталог, корінь якого містить `SKILL.md`.                                                                                                                                                                                                                                                                        |
| `install --as <slug>`            | Перевизначає автоматично визначений ідентифікатор для встановлень із Git і локальних каталогів.                                                                                                                                                                                                                                       |
| `install --version <version>`    | Застосовується лише до посилань на Skills у ClawHub.                                                                                                                                                                                                                                                                                  |
| `install --force`                | Перезаписує наявну папку Skill у робочому просторі з тим самим ідентифікатором.                                                                                                                                                                                                                                                       |
| `install/update --force-install` | Установлює Skill із ClawHub на базі GitHub, що очікує перевірки, до завершення сканування ClawHub.                                                                                                                                                                                                                                    |
| `--global`                       | Спрямовує операцію на спільний керований каталог Skills; не можна поєднувати з `--agent <id>`.                                                                                                                                                                                                                                        |
| `--agent <id>`                   | Спрямовує операцію на один налаштований робочий простір агента; перевизначає визначення за поточним робочим каталогом.                                                                                                                                                                                                                 |
| `update @owner/<slug>`           | Оновлює один відстежуваний Skill. Додайте `--global`, щоб спрямувати операцію на спільний керований каталог Skills замість робочого простору.                                                                                                                                                                                          |
| `update --all`                   | Оновлює встановлення з ClawHub, відстежувані у вибраному робочому просторі, або в спільному керованому каталозі Skills за використання `--global`.                                                                                                                                                                                     |
| `verify @owner/<slug>`           | За замовчуванням виводить JSON-конверт ClawHub `clawhub.skill.verify.v1`. Прапорця `--json` немає, оскільки JSON уже використовується за замовчуванням. Ідентифікатори без власника підтримуються для сумісності, коли Skill уже встановлено або його можна визначити однозначно; посилання із зазначенням власника усувають неоднозначність видавця. |
| Походження `verify`              | Коли ClawHub повертає визначене сервером походження джерела, JSON перевірки також містить `openclaw.verifiedSourceUrl`, закріплену за конкретним комітом. Недоступні або самостійно заявлені URL-адреси джерел залишаються лише в необробленому конверті походження й не підвищуються до перевірених.                                               |
| Вибір версії `verify`            | `verify` використовує `.clawhub/origin.json` для встановлених Skills із ClawHub, тому перевіряє встановлену версію за реєстром, з якого її отримано. `--version` і `--tag` перевизначають вибір версії, але зберігають цей реєстр, якщо наявні метадані походження.                                                                           |
| `verify --card`                  | Виводить згенерований Markdown картки Skill замість JSON. Завершується з ненульовим кодом, коли ClawHub повертає `ok: false` або `decision: "fail"`; непідписані сигнатури мають інформаційний характер, якщо політика ClawHub не зміниться.                                                                                                |
| Відбиток картки Skill            | Установлені пакети ClawHub можуть містити згенерований файл `skill-card.md`. OpenClaw розглядає перевірку як рішення сервера ClawHub і не відхиляє встановлений Skill лише через те, що ця згенерована картка змінює відбиток пакета.                                                                                                      |
| `check --agent <id>`             | Перевіряє робочий простір вибраного агента та повідомляє, які готові Skills фактично видимі в підказці або інтерфейсі команд цього агента.                                                                                                                                                                                             |
| `list`                           | Стандартна дія, якщо підкоманду не вказано.                                                                                                                                                                                                                                                                                           |
| Виведення `list`/`info`/`check`  | Відформатований результат надходить до stdout. З `--json` машинозчитувані дані залишаються в stdout для конвеєрів і скриптів.                                                                                                                                                                                                          |

Під час установлення й оновлення спільнотних Skills із ClawHub рівень довіри перевіряється до завантаження. Версіоновані архівні випуски спільноти використовують метадані довіри конкретного випуску. Skills із GitHub, що використовують резолвер, покладаються на резолвер встановлення ClawHub для застосування політики сканування та примусового встановлення перед поверненням закріпленого коміту; використовуйте `--force-install`, щоб установити Skill на базі GitHub, який очікує перевірки, до завершення цього сканування. Шкідливі або заблоковані випуски спільноти відхиляються. Ризиковані випуски спільноти потребують перевірки та прапорця `--acknowledge-clawhub-risk`, якщо неінтерактивна команда має продовжити роботу після цієї перевірки. Для офіційних видавців Skills у ClawHub і вбудованих джерел Skills OpenClaw цей запит щодо довіри до випуску пропускається.

## Майстерня Skills

`openclaw skills workshop` керує пропозиціями Skills, що очікують розгляду у вибраному робочому просторі. Пропозиції не є активними Skills, доки їх не застосовано. Докладніше про зберігання пропозицій, захист допоміжних файлів, методи Gateway і політику схвалення див. у розділі [Майстерня Skills](/uk/tools/skill-workshop).

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`propose-create`, `propose-update` і `revise` також приймають `--goal <text>`
і `--evidence <text>`, щоб записати мотивацію пропозиції та допоміжні
нотатки разом із вмістом `--proposal`/`--proposal-dir`.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Skills](/uk/tools/skills)
