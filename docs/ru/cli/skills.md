---
read_when:
    - Вы хотите увидеть, какие skills доступны и готовы к запуску
    - Вы хотите искать в ClawHub или устанавливать Skills из ClawHub, Git или локальных каталогов
    - Вы хотите проверить навык ClawHub с помощью ClawHub
    - Вы хотите отладить отсутствующие двоичные файлы/env/конфигурацию для Skills
summary: Справочник CLI для `openclaw skills` (поиск/установка/обновление/проверка/список/информация/проверка/workshop)
title: Skills
x-i18n:
    generated_at: "2026-06-28T22:46:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f76c49e04559362cac9c0d12ce86cd422b46653242212c7611cc1033941ac43
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Проверяйте локальные навыки, ищите в ClawHub, устанавливайте навыки из ClawHub/Git/локальных
каталогов, проверяйте навыки ClawHub и обновляйте установки, отслеживаемые ClawHub.

Связанные разделы:

- Система Skills: [Skills](/ru/tools/skills)
- Мастерская навыков: [Мастерская навыков](/ru/tools/skill-workshop)
- Конфигурация Skills: [Конфигурация Skills](/ru/tools/skills-config)
- Установки ClawHub: [ClawHub](/ru/clawhub/cli)

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

`search`, `update` и `verify` используют ClawHub напрямую. `install @owner/<slug>`
устанавливает навык ClawHub, `install git:owner/repo[@ref]` клонирует навык из Git, а
`install ./path` копирует локальный каталог навыка. По умолчанию `install`, `update`
и `verify` нацелены на каталог `skills/` активной рабочей области; с `--global`
они нацелены на общий управляемый каталог навыков. `list`/`info`/`check` по-прежнему
проверяют локальные навыки, видимые текущей рабочей области и конфигурации.
Команды, привязанные к рабочей области, определяют целевую рабочую область из
`--agent <id>`, затем из текущего рабочего каталога, если он находится внутри
настроенной рабочей области агента, затем из агента по умолчанию.

Установки из Git и локальных каталогов ожидают `SKILL.md` в корне источника. Slug
установки берется из frontmatter `name` в `SKILL.md`, если оно допустимо, затем из
имени исходного каталога или репозитория; используйте `--as <slug>`, чтобы
переопределить его. `--version` предназначен только для ClawHub. Установки навыков
не поддерживают спецификации пакетов npm или пути к zip/архивам, а
`openclaw skills update` обновляет только установки, отслеживаемые ClawHub.

Установки зависимостей навыков на базе Gateway, запускаемые из онбординга или
настроек Skills, вместо этого используют отдельный путь запроса `skills.install`.

Примечания:

- `search [query...]` принимает необязательный запрос; опустите его, чтобы
  просматривать стандартную ленту поиска ClawHub.
- `search --limit <n>` ограничивает количество возвращаемых результатов.
- `install git:owner/repo[@ref]` устанавливает навык из Git. Ссылки на ветки могут
  содержать косые черты, например `git:owner/repo@feature/foo`.
- `install ./path/to/skill` устанавливает локальный каталог, корень которого
  содержит `SKILL.md`.
- `install --as <slug>` переопределяет выведенный slug для установок из Git и
  локальных каталогов.
- `install --version <version>` применяется только к ссылкам на навыки ClawHub.
- `install --force` перезаписывает существующую папку навыка рабочей области с тем
  же slug.
- Установки и обновления навыков сообщества из ClawHub проверяют доверие перед
  скачиванием. Версионированные архивные релизы сообщества используют метаданные
  доверия точного релиза. Навыки GitHub на базе резолвера полагаются на
  установочный резолвер ClawHub, который применяет политику сканирования и
  принудительной установки перед возвратом закрепленного коммита. Вредоносные или
  заблокированные релизы сообщества отклоняются. Рискованные релизы сообщества
  требуют проверки и `--acknowledge-clawhub-risk`, когда неинтерактивная команда
  должна продолжить работу после этой проверки. Официальные издатели навыков
  ClawHub и встроенные источники навыков OpenClaw обходят этот запрос доверия к
  релизу.
- `--global` нацелен на общий управляемый каталог навыков и не может сочетаться с
  `--agent <id>`.
- `--agent <id>` нацелен на одну настроенную рабочую область агента и
  переопределяет вывод из текущего рабочего каталога.
- `update @owner/<slug>` обновляет один отслеживаемый навык. Добавьте `--global`,
  чтобы нацелиться на общий управляемый каталог навыков вместо рабочей области.
- `update --all` обновляет отслеживаемые установки ClawHub в выбранной рабочей
  области или в общем управляемом каталоге навыков при сочетании с `--global`.
- `verify @owner/<slug>` по умолчанию выводит JSON-конверт
  `clawhub.skill.verify.v1` от ClawHub. Флага `--json` нет, потому что JSON уже
  является форматом по умолчанию. Простые slug остаются допустимыми для
  совместимости, когда навык уже установлен или однозначен, но ссылки с указанием
  владельца устраняют неоднозначность издателя.
- Когда ClawHub возвращает происхождение источника, определенное сервером, JSON
  проверки также включает закрепленный на коммите `openclaw.verifiedSourceUrl`.
  Недоступные или самостоятельно заявленные URL источника остаются только в сыром
  конверте происхождения и не продвигаются.
- `verify` использует `.clawhub/origin.json` для установленных навыков ClawHub,
  поэтому проверяет установленную версию по реестру, из которого она пришла.
  `--version` и `--tag` переопределяют селектор версии, но сохраняют этот
  установленный реестр, когда существуют метаданные происхождения.
- `verify --card` выводит сгенерированный Markdown карточки навыка вместо JSON.
  Команда завершается с ненулевым кодом, когда ClawHub возвращает `ok: false` или
  `decision: "fail"`; неподписанные подписи являются информационными, если
  политика ClawHub не изменится.
- Установленные пакеты ClawHub могут включать сгенерированный `skill-card.md`.
  OpenClaw рассматривает проверку как серверное решение ClawHub и не отклоняет
  установленный навык только потому, что эта сгенерированная карточка меняет
  отпечаток пакета.
- `check --agent <id>` проверяет рабочую область выбранного агента и сообщает,
  какие готовые навыки фактически видны в prompt или командной поверхности этого
  агента.
- `list` является действием по умолчанию, когда подкоманда не указана.
- `list`, `info` и `check` записывают отрендеренный вывод в stdout. С `--json` это
  означает, что машиночитаемая полезная нагрузка остается в stdout для конвейеров
  и скриптов.

## Мастерская навыков

`openclaw skills workshop` управляет ожидающими предложениями навыков в выбранной
рабочей области. Предложения не являются активными навыками, пока не применены.
Сведения о хранении предложений, защитах вспомогательных файлов, методах Gateway
и политике одобрения см. в разделе [Мастерская навыков](/ru/tools/skill-workshop).

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

## Связанные разделы

- [Справочник CLI](/ru/cli)
- [Skills](/ru/tools/skills)
