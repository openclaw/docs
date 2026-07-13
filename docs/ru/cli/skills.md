---
read_when:
    - Вы хотите увидеть, какие Skills доступны и готовы к запуску
    - Вы хотите искать навыки в ClawHub или устанавливать их из ClawHub, Git или локальных каталогов
    - Вы хотите проверить навык ClawHub с помощью ClawHub
    - Вы хотите отладить отсутствие исполняемых файлов, переменных окружения или конфигурации для Skills
summary: Справочник CLI для `openclaw skills` (поиск/установка/обновление/проверка/вывод списка/информация/контроль/мастерская)
title: Skills
x-i18n:
    generated_at: "2026-07-13T19:40:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Проверяйте локальные Skills, выполняйте поиск в ClawHub, устанавливайте Skills из ClawHub/Git/локальных
каталогов, проверяйте Skills из ClawHub и обновляйте установки, отслеживаемые ClawHub.

Связанные материалы:

- Система Skills: [Skills](/ru/tools/skills)
- Мастерская Skills: [Мастерская Skills](/ru/tools/skill-workshop)
- Конфигурация Skills: [Конфигурация Skills](/ru/tools/skills-config)
- Установки из ClawHub: [ClawHub](/ru/clawhub/cli)

## Команды

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

`search`, `update` и `verify` напрямую используют ClawHub. `install @owner/<slug>`
устанавливает Skill из ClawHub, `install git:owner/repo[@ref]` клонирует Skill из Git,
а `install ./path` копирует локальный каталог Skill. По умолчанию `install`,
`update` и `verify` используют каталог `skills/` активной рабочей области; с
`--global` они используют общий каталог управляемых Skills. `list`/`info`/`check`
по-прежнему проверяют локальные Skills, доступные текущей рабочей области и конфигурации.
Команды, работающие с рабочей областью, определяют целевую рабочую область сначала из `--agent <id>`,
затем из текущего рабочего каталога, если он находится внутри настроенной рабочей
области агента, а затем используют агента по умолчанию.

При установке из Git и локального каталога ожидается наличие `SKILL.md` в корне источника. Слаг
установки берётся из `SKILL.md` во frontmatter `name`, если значение допустимо, а затем
из имени исходного каталога или репозитория; используйте `--as <slug>`, чтобы переопределить его.
`--version` применяется только к ClawHub. Установка Skills не поддерживает спецификации пакетов npm
или пути к zip-файлам и архивам, а `openclaw skills update` обновляет только
установки, отслеживаемые ClawHub.

Установка зависимостей Skills через Gateway, запускаемая при первоначальной настройке или в настройках
Skills, использует отдельный путь запроса `skills.install`.

Примечания:

| Флаг/поведение                    | Описание                                                                                                                                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | Необязательный поисковый запрос; не указывайте его, чтобы просмотреть стандартную поисковую ленту ClawHub.                                                                                                                                                                                                                |
| `search --limit <n>`             | Ограничивает количество возвращаемых результатов.                                                                                                                                                                                                                                                            |
| `install git:owner/repo[@ref]`   | Устанавливает Skill из Git. Ссылки на ветки могут содержать косые черты, например `git:owner/repo@feature/foo`.                                                                                                                                                                                      |
| `install ./path/to/skill`        | Устанавливает локальный каталог, корень которого содержит `SKILL.md`.                                                                                                                                                                                                                        |
| `install --as <slug>`            | Переопределяет автоматически определённый слаг при установке из Git и локального каталога.                                                                                                                                                                                                                 |
| `install --version <version>`    | Применяется только к ссылкам на Skills из ClawHub.                                                                                                                                                                                                                                               |
| `install --force`                | Перезаписывает существующий каталог Skill в рабочей области с тем же слагом.                                                                                                                                                                                                                  |
| `install/update --force-install` | Устанавливает ожидающий проверки Skill из ClawHub на основе GitHub до завершения сканирования ClawHub.                                                                                                                                                                                                   |
| `--global`                       | Использует общий каталог управляемых Skills; нельзя сочетать с `--agent <id>`.                                                                                                                                                                                                  |
| `--agent <id>`                   | Использует рабочую область одного настроенного агента; переопределяет определение по текущему рабочему каталогу.                                                                                                                                                                                            |
| `update @owner/<slug>`           | Обновляет один отслеживаемый Skill. Добавьте `--global`, чтобы вместо рабочей области использовать общий каталог управляемых Skills.                                                                                                                                                            |
| `update --all`                   | Обновляет отслеживаемые установки из ClawHub в выбранной рабочей области или, с `--global`, в общем каталоге управляемых Skills.                                                                                                                                                               |
| `verify @owner/<slug>`           | По умолчанию выводит JSON-конверт `clawhub.skill.verify.v1` от ClawHub. Флаг `--json` отсутствует, поскольку JSON уже используется по умолчанию. Слаги без владельца принимаются для совместимости, если Skill уже установлен или однозначно определяется; ссылки с указанием владельца устраняют неоднозначность издателя. |
| Происхождение `verify`              | Когда ClawHub возвращает определённые сервером сведения о происхождении исходного кода, JSON проверки также включает привязанный к коммиту `openclaw.verifiedSourceUrl`. Недоступные или самостоятельно заявленные URL исходного кода остаются только в необработанном конверте происхождения и не продвигаются.                                           |
| Селектор версии `verify`        | `verify` использует `.clawhub/origin.json` для установленных Skills из ClawHub, поэтому проверяет установленную версию по реестру, из которого она получена. `--version` и `--tag` переопределяют селектор версии, но при наличии метаданных происхождения сохраняют установленный реестр.                    |
| `verify --card`                  | Выводит сгенерированную карточку Skill в формате Markdown вместо JSON. Завершается с ненулевым кодом, когда ClawHub возвращает `ok: false` или `decision: "fail"`; неподписанные подписи носят информационный характер, если политика ClawHub не изменится.                                                                             |
| Отпечаток карточки Skill           | Установленные пакеты из ClawHub могут включать сгенерированный `skill-card.md`. OpenClaw рассматривает результат проверки как решение сервера ClawHub и не отклоняет установленный Skill только из-за того, что сгенерированная карточка изменяет отпечаток пакета.                                              |
| `check --agent <id>`             | Проверяет рабочую область выбранного агента и сообщает, какие готовые Skills фактически доступны в промпте или интерфейсе команд этого агента.                                                                                                                                              |
| `list`                           | Действие по умолчанию, если подкоманда не указана.                                                                                                                                                                                                                                    |
| Вывод `list`/`info`/`check`     | Отформатированный вывод направляется в stdout. С `--json` машиночитаемая полезная нагрузка остаётся в stdout для конвейеров и скриптов.                                                                                                                                                                |

При установке и обновлении пользовательских Skills из ClawHub доверие проверяется до загрузки.
Версионированные пользовательские выпуски архивов используют метаданные доверия для конкретного выпуска.
Skills на основе GitHub, получаемые через резолвер, полагаются на установочный резолвер ClawHub, который применяет
политику сканирования и принудительной установки до возврата закреплённого коммита; используйте
`--force-install`, чтобы установить ожидающий проверки Skill на основе GitHub до завершения
сканирования. Вредоносные или заблокированные пользовательские выпуски отклоняются. Рискованные
пользовательские выпуски требуют проверки и `--acknowledge-clawhub-risk`, если
неинтерактивная команда должна продолжить работу после этой проверки. Официальные издатели
Skills в ClawHub и встроенные источники Skills OpenClaw обходят этот запрос
о доверии к выпуску.

## Мастерская Skills

`openclaw skills workshop` управляет ожидающими предложениями навыков в выбранном
рабочем пространстве. Предложения не становятся активными навыками, пока их
не применят. Сведения о хранении предложений, защите вспомогательных файлов,
методах Gateway и политике утверждения см. в разделе
[Мастерская навыков](/ru/tools/skill-workshop).

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Повторяемый контрольный список QA" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Повторяемый контрольный список QA" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Дубликат"
openclaw skills workshop quarantine <proposal-id> --reason "Требуется проверка безопасности"
```

`propose-create`, `propose-update` и `revise` также принимают `--goal <text>`
и `--evidence <text>`, чтобы сохранить мотивацию предложения и сопроводительные
примечания вместе с содержимым `--proposal`/`--proposal-dir`.

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Skills](/ru/tools/skills)
