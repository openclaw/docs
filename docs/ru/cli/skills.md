---
read_when:
    - Вы хотите узнать, какие Skills доступны и готовы к запуску
    - Вы хотите искать в ClawHub или устанавливать Skills из ClawHub, Git или локальных каталогов
    - Вы хотите проверить Skill ClawHub с помощью ClawHub
    - Вы хотите отладить отсутствие исполняемых файлов, переменных окружения или конфигурации для Skills
summary: Справочник по CLI для `openclaw skills` (поиск/установка/обновление/проверка/список/информация/диагностика/мастерская)
title: Skills
x-i18n:
    generated_at: "2026-07-12T11:19:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Проверяйте локальные Skills, выполняйте поиск в ClawHub, устанавливайте Skills из ClawHub, Git или локальных каталогов, проверяйте Skills из ClawHub и обновляйте установки, отслеживаемые через ClawHub.

Связанные разделы:

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

Команды `search`, `update` и `verify` обращаются непосредственно к ClawHub. `install @owner/<slug>` устанавливает Skill из ClawHub, `install git:owner/repo[@ref]` клонирует Skill из Git, а `install ./path` копирует локальный каталог Skill. По умолчанию команды `install`, `update` и `verify` используют каталог `skills/` активной рабочей области; с флагом `--global` они используют общий управляемый каталог Skills. Команды `list`/`info`/`check` по-прежнему проверяют локальные Skills, доступные текущей рабочей области и конфигурации. Команды, работающие с рабочей областью, определяют целевую рабочую область сначала по `--agent <id>`, затем по текущему рабочему каталогу, если он находится внутри настроенной рабочей области агента, и наконец используют агента по умолчанию.

При установке из Git и локального каталога файл `SKILL.md` должен находиться в корне источника. Слаг установки берётся из поля `name` во frontmatter файла `SKILL.md`, если оно допустимо, а затем — из имени исходного каталога или репозитория; используйте `--as <slug>`, чтобы переопределить его. Флаг `--version` применим только к ClawHub. Установка Skills не поддерживает спецификации пакетов npm и пути к ZIP-файлам или архивам, а команда `openclaw skills update` обновляет только установки, отслеживаемые через ClawHub.

Установка зависимостей Skills через Gateway, запускаемая при первоначальной настройке или из настроек Skills, использует отдельный путь запроса `skills.install`.

Примечания:

| Флаг/поведение                   | Описание                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | Необязательный запрос; опустите его, чтобы просмотреть стандартную поисковую ленту ClawHub.                                                                                                                                                                                                                                               |
| `search --limit <n>`             | Ограничивает количество возвращаемых результатов.                                                                                                                                                                                                                                                                                        |
| `install git:owner/repo[@ref]`   | Устанавливает Skill из Git. Ссылки на ветви могут содержать косые черты, например `git:owner/repo@feature/foo`.                                                                                                                                                                                                                           |
| `install ./path/to/skill`        | Устанавливает локальный каталог, в корне которого находится `SKILL.md`.                                                                                                                                                                                                                                                                   |
| `install --as <slug>`            | Переопределяет автоматически определённый слаг при установке из Git и локального каталога.                                                                                                                                                                                                                                                |
| `install --version <version>`    | Применяется только к ссылкам на Skills из ClawHub.                                                                                                                                                                                                                                                                                        |
| `install --force`                | Перезаписывает существующую папку Skill с тем же слагом в рабочей области.                                                                                                                                                                                                                                                               |
| `install/update --force-install` | Устанавливает ожидающий проверки Skill из ClawHub с исходным кодом на GitHub до завершения сканирования ClawHub.                                                                                                                                                                                                                          |
| `--global`                       | Использует общий управляемый каталог Skills; нельзя сочетать с `--agent <id>`.                                                                                                                                                                                                                                                           |
| `--agent <id>`                   | Использует рабочую область одного настроенного агента; переопределяет определение по текущему рабочему каталогу.                                                                                                                                                                                                                          |
| `update @owner/<slug>`           | Обновляет один отслеживаемый Skill. Добавьте `--global`, чтобы вместо рабочей области использовать общий управляемый каталог Skills.                                                                                                                                                                                                      |
| `update --all`                   | Обновляет отслеживаемые установки из ClawHub в выбранной рабочей области или в общем управляемом каталоге Skills при использовании `--global`.                                                                                                                                                                                            |
| `verify @owner/<slug>`           | По умолчанию выводит JSON-оболочку ClawHub `clawhub.skill.verify.v1`. Флаг `--json` отсутствует, поскольку JSON уже используется по умолчанию. Для совместимости допускаются слаги без владельца, если Skill уже установлен или определяется однозначно; ссылки с указанием владельца исключают неоднозначность издателя.                    |
| Происхождение `verify`           | Если ClawHub возвращает определённые сервером данные о происхождении исходного кода, JSON проверки также содержит привязанный к коммиту URL `openclaw.verifiedSourceUrl`. Недоступные или заявленные самим издателем URL исходного кода остаются только в исходной оболочке данных о происхождении и не получают повышенного статуса.            |
| Выбор версии в `verify`          | Для установленных Skills из ClawHub команда `verify` использует `.clawhub/origin.json`, поэтому проверяет установленную версию в том реестре, откуда она была получена. Флаги `--version` и `--tag` переопределяют выбор версии, но при наличии метаданных происхождения сохраняют установленный реестр.                                         |
| `verify --card`                  | Выводит сгенерированный Markdown карточки Skill вместо JSON. Завершается с ненулевым кодом, если ClawHub возвращает `ok: false` или `decision: "fail"`; неподписанные подписи носят информационный характер, если политика ClawHub не предусматривает иное.                                                                                       |
| Отпечаток карточки Skill         | Установленные пакеты ClawHub могут содержать сгенерированный файл `skill-card.md`. OpenClaw рассматривает результат проверки как решение сервера ClawHub и не отклоняет установленный Skill только из-за того, что эта сгенерированная карточка изменила отпечаток пакета.                                                                      |
| `check --agent <id>`             | Проверяет рабочую область выбранного агента и сообщает, какие готовые Skills фактически доступны в промпте или интерфейсе команд этого агента.                                                                                                                                                                                            |
| `list`                           | Действие по умолчанию, если подкоманда не указана.                                                                                                                                                                                                                                                                                        |
| Вывод `list`/`info`/`check`      | Форматированный вывод направляется в stdout. При использовании `--json` машиночитаемые данные остаются в stdout для конвейеров и скриптов.                                                                                                                                                                                                |

При установке и обновлении Skills сообщества из ClawHub доверие проверяется до загрузки. Для версий архивных выпусков сообщества используются метаданные доверия конкретного выпуска. Skills с исходным кодом на GitHub, обрабатываемые через механизм разрешения, полагаются на установочный механизм ClawHub, который применяет политику сканирования и принудительной установки до возврата закреплённого коммита; используйте `--force-install`, чтобы установить ожидающий проверки Skill с исходным кодом на GitHub до завершения сканирования. Вредоносные или заблокированные выпуски сообщества отклоняются. Рискованные выпуски сообщества требуют проверки и флага `--acknowledge-clawhub-risk`, если неинтерактивная команда должна продолжить работу после такой проверки. Для официальных издателей Skills в ClawHub и встроенных источников Skills OpenClaw этот запрос подтверждения доверия к выпуску не отображается.

## Мастерская Skills

Команда `openclaw skills workshop` управляет ожидающими предложениями Skills в выбранной рабочей области. Предложения не являются активными Skills, пока не будут применены. Сведения о хранении предложений, защите вспомогательных файлов, методах Gateway и политике одобрения см. в разделе [Мастерская Skills](/ru/tools/skill-workshop).

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

`propose-create`, `propose-update` и `revise` также принимают `--goal <text>`
и `--evidence <text>`, чтобы сохранить мотивацию предложения и подтверждающие
примечания вместе с содержимым `--proposal`/`--proposal-dir`.

## Связанные материалы

- [Справочник по CLI](/ru/cli)
- [Skills](/ru/tools/skills)
