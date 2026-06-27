---
read_when:
    - Ви хочете побачити, які Skills доступні й готові до запуску
    - Ви хочете шукати в ClawHub або встановлювати Skills із ClawHub, Git чи локальних каталогів
    - Ви хочете перевірити навичку ClawHub за допомогою ClawHub
    - Ви хочете налагодити відсутні бінарні файли/env/config для Skills
summary: Довідник CLI для `openclaw skills` (search/install/update/verify/list/info/check/workshop)
title: Skills
x-i18n:
    generated_at: "2026-06-27T17:23:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f76c49e04559362cac9c0d12ce86cd422b46653242212c7611cc1033941ac43
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Переглядайте локальні Skills, шукайте в ClawHub, встановлюйте Skills із ClawHub/Git/локальних
каталогів, перевіряйте Skills із ClawHub і оновлюйте встановлення, відстежувані ClawHub.

Пов’язане:

- Система Skills: [Skills](/uk/tools/skills)
- Майстерня Skills: [Майстерня Skills](/uk/tools/skill-workshop)
- Конфігурація Skills: [Конфігурація Skills](/uk/tools/skills-config)
- Встановлення ClawHub: [ClawHub](/uk/clawhub/cli)

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
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
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

`search`, `update` і `verify` використовують ClawHub напряму. `install @owner/<slug>`
встановлює skill із ClawHub, `install git:owner/repo[@ref]` клонує skill із Git, а
`install ./path` копіює локальний каталог skill. За замовчуванням `install`, `update`
і `verify` націлені на каталог `skills/` активного робочого простору; з `--global`
вони націлені на спільний керований каталог Skills. `list`/`info`/`check` все ще
перевіряють локальні Skills, видимі для поточного робочого простору й конфігурації.
Команди з прив’язкою до робочого простору визначають цільовий робочий простір із `--agent <id>`, потім
із поточного робочого каталогу, якщо він усередині налаштованого робочого простору агента,
а потім із агента за замовчуванням.

Встановлення з Git і локального каталогу очікують `SKILL.md` у корені джерела. Slug
встановлення береться з frontmatter `name` у `SKILL.md`, якщо воно чинне, потім із
назви вихідного каталогу або репозиторію; використовуйте `--as <slug>`, щоб перевизначити його. `--version`
доступний лише для ClawHub. Встановлення Skills не підтримують специфікації пакетів npm або шляхи
zip/архівів, а `openclaw skills update` оновлює лише встановлення, відстежувані ClawHub.

Встановлення залежностей Skills з опорою на Gateway, запущені з onboarding або налаштувань Skills,
натомість використовують окремий шлях запиту `skills.install`.

Примітки:

- `search [query...]` приймає необов’язковий запит; пропустіть його, щоб переглядати типовий
  пошуковий feed ClawHub.
- `search --limit <n>` обмежує кількість повернених результатів.
- `install git:owner/repo[@ref]` встановлює skill із Git. Посилання на гілки можуть містити
  скісні риски, наприклад `git:owner/repo@feature/foo`.
- `install ./path/to/skill` встановлює локальний каталог, корінь якого містить
  `SKILL.md`.
- `install --as <slug>` перевизначає виведений slug для встановлень із Git і локального каталогу.
- `install --version <version>` застосовується лише до посилань на Skills із ClawHub.
- `install --force` перезаписує наявну теку skill у робочому просторі для того самого
  slug.
- Встановлення й оновлення спільнотних Skills із ClawHub перевіряють довіру перед завантаженням.
  Версійні випуски спільнотних архівів використовують метадані довіри для точного випуску.
  GitHub Skills із resolver покладаються на install resolver ClawHub, щоб забезпечити
  політику сканування й примусового встановлення до повернення зафіксованого commit. Шкідливі або
  заблоковані спільнотні випуски відхиляються. Ризиковані спільнотні випуски потребують
  review і `--acknowledge-clawhub-risk`, коли неінтерактивна команда має
  продовжити після такого review. Офіційні видавці Skills у ClawHub і bundled
  джерела Skills OpenClaw обходять цей prompt довіри до випуску.
- `--global` націлюється на спільний керований каталог Skills і не може поєднуватися
  з `--agent <id>`.
- `--agent <id>` націлюється на один налаштований робочий простір агента й перевизначає
  визначення з поточного робочого каталогу.
- `update @owner/<slug>` оновлює один відстежуваний skill. Додайте `--global`, щоб
  націлитися на спільний керований каталог Skills замість робочого простору.
- `update --all` оновлює відстежувані встановлення ClawHub у вибраному робочому просторі або
  у спільному керованому каталозі Skills, якщо поєднано з `--global`.
- `verify @owner/<slug>` за замовчуванням друкує JSON-обгортку ClawHub
  `clawhub.skill.verify.v1`. Прапорця `--json` немає, бо JSON уже є
  типовим форматом. Голі slugs залишаються прийнятими для сумісності, коли skill
  вже встановлений або однозначний, але посилання з власником уникають
  неоднозначності видавця.
- Коли ClawHub повертає визначене сервером походження джерела, JSON перевірки також
  містить прив’язаний до commit `openclaw.verifiedSourceUrl`. Недоступні або
  самостійно задекларовані URL джерела залишаються лише в сирій обгортці походження й не
  підвищуються.
- `verify` використовує `.clawhub/origin.json` для встановлених Skills із ClawHub, тому він
  перевіряє встановлену версію щодо registry, з якого вона походить. `--version`
  і `--tag` перевизначають selector версії, але зберігають цей встановлений registry,
  коли існують метадані origin.
- `verify --card` друкує згенерований Markdown картки skill замість JSON. Команда
  завершується з ненульовим кодом, коли ClawHub повертає `ok: false` або `decision: "fail"`;
  непідписані підписи є інформаційними, доки політика ClawHub не зміниться.
- Встановлені bundles ClawHub можуть містити згенерований `skill-card.md`. OpenClaw
  трактує перевірку як серверне рішення ClawHub і не відхиляє
  встановлений skill лише тому, що ця згенерована картка змінює
  fingerprint bundle.
- `check --agent <id>` перевіряє робочий простір вибраного агента й повідомляє, які
  готові Skills фактично видимі для prompt або командної поверхні цього агента.
- `list` є типовою дією, коли subcommand не вказано.
- `list`, `info` і `check` записують свій відрендерений вивід у stdout. З
  `--json` це означає, що machine-readable payload залишається в stdout для pipes
  і scripts.

## Майстерня Skills

`openclaw skills workshop` керує очікуваними пропозиціями Skills у вибраному
робочому просторі. Пропозиції не є активними Skills, доки їх не застосовано. Щодо зберігання пропозицій,
запобіжників для support-файлів, методів Gateway і політики схвалення див.
[Майстерня Skills](/uk/tools/skill-workshop).

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

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Skills](/uk/tools/skills)
