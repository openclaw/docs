---
read_when:
    - Вы отлаживаете установку пакетов plugin
    - Вы изменяете поведение запуска Plugin, doctor или установки через менеджер пакетов
    - Вы сопровождаете пакетные установки OpenClaw или встроенные манифесты Plugin
sidebarTitle: Dependencies
summary: Как OpenClaw устанавливает пакеты Plugin и разрешает зависимости Plugin
title: Разрешение зависимостей Plugin
x-i18n:
    generated_at: "2026-06-28T23:17:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5d2f3efe40c50433bd44961f6f5b8d03f3c69d3f5112163613b8efbd0f17c65
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw выполняет работу с зависимостями Plugin во время установки/обновления. Загрузка во время выполнения
не запускает пакетные менеджеры, не чинит деревья зависимостей и не изменяет каталог
пакета OpenClaw.

## Разделение ответственности

Пакеты Plugin владеют своим графом зависимостей:

- зависимости времени выполнения находятся в `dependencies` или
  `optionalDependencies` пакета Plugin
- импорты SDK/core являются peer-зависимостями или импортами, предоставляемыми OpenClaw
- локальные Plugin для разработки приносят собственные уже установленные зависимости
- npm- и git-Plugin устанавливаются в корни пакетов, принадлежащие OpenClaw

OpenClaw владеет только жизненным циклом Plugin:

- обнаружить источник Plugin
- установить или обновить пакет при явном запросе
- записать метаданные установки
- загрузить точку входа Plugin
- завершиться с actionable-ошибкой, когда зависимости отсутствуют

## Корни установки

OpenClaw использует стабильные корни для каждого источника:

- npm-пакеты устанавливаются в проекты для каждого Plugin в
  `~/.openclaw/npm/projects/<encoded-package>`
- git-пакеты клонируются в `~/.openclaw/git`
- локальные/path/archive-установки копируются или используются по ссылке без ремонта зависимостей

npm-установки выполняются в этом корне проекта для конкретного Plugin с:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` использует тот же корень npm-проекта
для конкретного Plugin для локального tarball npm-pack. OpenClaw читает npm-метаданные
tarball, добавляет его в управляемый проект как скопированную зависимость `file:`, запускает
обычную npm-установку, а затем проверяет метаданные установленного lockfile перед тем,
как доверять Plugin.
Это предназначено для package-acceptance и доказательства release-candidate, когда
локальный артефакт pack должен вести себя как артефакт registry, который он имитирует.

npm может hoist транзитивные зависимости в `node_modules` проекта для конкретного Plugin
рядом с пакетом Plugin. OpenClaw сканирует корень управляемого проекта перед тем,
как доверять установке, и удаляет этот проект при uninstall, поэтому hoisted-зависимости
времени выполнения остаются внутри границы очистки этого Plugin.

Опубликованные npm-пакеты Plugin могут поставлять `npm-shrinkwrap.json`. npm использует этот
публикуемый lockfile во время установки, а корень управляемого npm-проекта OpenClaw
поддерживает его через обычный путь npm-установки. Публикуемые пакеты Plugin,
принадлежащие OpenClaw, должны включать локальный для пакета shrinkwrap, сгенерированный из
опубликованного графа зависимостей этого пакета Plugin:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Генератор удаляет `devDependencies` Plugin, применяет политику workspace override
и записывает `extensions/<id>/npm-shrinkwrap.json` для каждого
Plugin с `publishToNpm`. Сторонние пакеты Plugin также могут поставлять shrinkwrap;
OpenClaw не требует его для community-пакетов, но npm будет учитывать его
при наличии.

npm-пакеты Plugin, принадлежащие OpenClaw, также могут публиковаться с явными
`bundledDependencies`. Путь npm-публикации накладывает список имен зависимостей
времени выполнения, удаляет dev-only workspace-метаданные из опубликованного manifest
пакета, запускает script-free npm-установку для локальных зависимостей времени выполнения
пакета, затем пакует или публикует tarball Plugin с включенными файлами этих зависимостей.
Пакеты с большим количеством native-кода, включая Codex и ACP runtimes, отключают это
с помощью `openclaw.release.bundleRuntimeDependencies: false`; эти пакеты все равно
поставляют свой shrinkwrap, но npm разрешает зависимости времени выполнения при установке,
а не встраивает каждый platform binary в tarball Plugin. Корневой пакет
`openclaw` не включает в bundle свое полное дерево зависимостей.

Plugin, которые импортируют `openclaw/plugin-sdk/*`, объявляют `openclaw` как peer-зависимость.
OpenClaw не позволяет npm устанавливать отдельную registry-копию host-пакета
в управляемый проект, потому что устаревшие host-пакеты могут влиять на npm
peer resolution внутри этого Plugin. Управляемые npm-установки пропускают npm peer
resolution/materialization, а OpenClaw повторно утверждает локальные для Plugin ссылки
`node_modules/openclaw` для установленных пакетов, которые объявляют host peer
после установки или обновления.

git-установки клонируют или обновляют репозиторий, затем запускают:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Затем установленный Plugin загружается из этого каталога пакета, поэтому разрешение
локальных для пакета и родительских `node_modules` работает так же, как для обычного
Node-пакета.

## Локальные Plugin

Локальные Plugin рассматриваются как каталоги, контролируемые разработчиком. OpenClaw не
запускает для них `npm install`, `pnpm install` или ремонт зависимостей. Если у локального
Plugin есть зависимости, установите их в этом Plugin перед загрузкой.

Сторонние локальные Plugin на TypeScript могут использовать аварийный путь Jiti. Упакованные
JavaScript Plugin и встроенные внутренние Plugin загружаются через native
import/require вместо Jiti.

## Запуск и перезагрузка

Запуск Gateway и перезагрузка config никогда не устанавливают зависимости Plugin. Они читают
записи установки Plugin, вычисляют точку входа и загружают ее.

Если зависимость отсутствует во время выполнения, Plugin не загружается, а ошибка
должна указать оператору явное исправление:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` может очищать legacy-состояние зависимостей, сгенерированное OpenClaw, и восстанавливать
скачиваемые Plugin, отсутствующие в локальных записях установки, когда config
ссылается на них. Doctor не чинит зависимости для уже установленного
локального Plugin.

## Встроенные Plugin

Легковесные и критичные для core встроенные Plugin поставляются как часть OpenClaw.
Они должны либо не иметь тяжелого дерева зависимостей времени выполнения, либо быть вынесены
в скачиваемый пакет на ClawHub/npm.

Текущий сгенерированный список Plugin, которые поставляются в core-пакете, устанавливаются
внешне или остаются только в исходниках, см. в [инвентаре Plugin](/ru/plugins/plugin-inventory).

Manifest встроенных Plugin не должен запрашивать staging зависимостей. Крупная или optional
функциональность Plugin должна быть упакована как обычный Plugin и установлена через
тот же путь npm/git/ClawHub, что и сторонние Plugin.

В source checkouts OpenClaw рассматривает репозиторий как pnpm-монорепозиторий. После
`pnpm install` встроенные Plugin загружаются из `extensions/<id>`, поэтому локальные для пакета
workspace-зависимости доступны, а правки подхватываются напрямую. Разработка в source
checkout поддерживается только через pnpm; простой `npm install` в корне репозитория
не является поддерживаемым способом подготовить зависимости встроенных Plugin.

| Форма установки                  | Расположение встроенного Plugin       | Владелец зависимостей                                               |
| -------------------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| `npm install -g openclaw`        | Собранное дерево runtime внутри пакета | Пакет OpenClaw и явные потоки install/update/doctor для Plugin     |
| Git checkout плюс `pnpm install` | Workspace-пакеты `extensions/<id>`    | pnpm workspace, включая собственные зависимости каждого пакета Plugin |
| `openclaw plugins install ...`   | Управляемый npm project/git/ClawHub root | Поток install/update для Plugin                                    |

## Очистка legacy

Старые версии OpenClaw генерировали корни зависимостей встроенных Plugin при запуске или
во время doctor repair. Текущая cleanup doctor удаляет эти устаревшие каталоги и
symlink при использовании `--fix`, включая старые корни `plugin-runtime-deps`, global
Node-prefix package symlink, указывающие на pruned targets `plugin-runtime-deps`,
manifest `.openclaw-runtime-deps*`, сгенерированные Plugin `node_modules`, каталоги
install stage и локальные для пакета pnpm stores. Packaged postinstall также
удаляет эти global symlink перед pruning legacy target roots, чтобы обновления
не оставляли dangling ESM package imports.

Старые npm-установки также использовали общий корень `~/.openclaw/npm/node_modules`.
Текущие потоки install, update, uninstall и doctor все еще распознают этот legacy
flat root только для восстановления и очистки. Новые npm-установки должны создавать
корни проектов для каждого Plugin.
