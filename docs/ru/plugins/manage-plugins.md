---
doc-schema-version: 1
read_when:
    - Вам нужны быстрые примеры просмотра списка Plugin, установки, обновления, проверки или удаления
    - Вы хотите выбрать источник установки Plugin
    - Вам нужен правильный справочник по публикации пакетов plugin
sidebarTitle: Manage plugins
summary: Краткие примеры для вывода списка, установки, обновления, просмотра и удаления plugins OpenClaw
title: Управление плагинами
x-i18n:
    generated_at: "2026-06-28T23:18:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd0c1143c6312603311931cbbdc63069a44bc5ec487e2a46b0266b86a556da4e
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Используйте эту страницу для распространенных команд управления Plugin. Полный
контракт команд, флаги, правила выбора источника и пограничные случаи см. в
[`openclaw plugins`](/ru/cli/plugins).

Большинство рабочих процессов установки выглядят так:

1. найдите пакет
2. установите его из ClawHub, npm, git или локального пути
3. позвольте управляемому Gateway автоматически перезапуститься или перезапустите его вручную, если он не управляется
4. проверьте runtime-регистрации Plugin

## Список и поиск Plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

Используйте `--json` для скриптов:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` — это холодная проверка инвентаря. Она показывает, что OpenClaw
может обнаружить из конфигурации, манифестов и реестра Plugin; она не доказывает,
что уже запущенный Gateway импортировал runtime Plugin. Вывод JSON включает
диагностику реестра и статический `dependencyStatus` каждого Plugin, когда пакет
Plugin объявляет `dependencies` или `optionalDependencies`.

`plugins search` запрашивает ClawHub для устанавливаемых пакетов Plugin и выводит
подсказки по установке, например `openclaw plugins install clawhub:<package>`.

## Установка Plugin

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Install from ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Install from npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from a local npm pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Голые спецификации пакетов во время launch cutover устанавливаются из npm.
Используйте `clawhub:`, `npm:`, `git:` или `npm-pack:`, когда вам нужен
детерминированный выбор источника. Если голое имя совпадает с идентификатором
официального Plugin, OpenClaw может установить запись каталога напрямую.

Используйте `--force` только когда вы намеренно хотите перезаписать существующую
цель установки. Для обычных обновлений отслеживаемых установок npm, ClawHub или
hook-pack используйте `openclaw plugins update`.

## Перезапуск и проверка

После установки, обновления или удаления кода Plugin запущенный управляемый
Gateway с включенной перезагрузкой конфигурации перезапускается автоматически.
Если Gateway не управляется или перезагрузка отключена, перезапустите его
самостоятельно перед проверкой живых runtime-поверхностей:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Используйте `inspect --runtime`, когда вам нужно доказательство, что Plugin
зарегистрировал runtime-поверхности, такие как инструменты, hooks, сервисы,
методы Gateway, HTTP-маршруты или принадлежащие Plugin команды CLI. Обычные
`inspect` и `list` — это холодные проверки манифеста, конфигурации и реестра.

## Обновление Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Когда вы передаете идентификатор Plugin, OpenClaw повторно использует
отслеживаемую спецификацию установки. Сохраненные dist-tags, такие как `@beta`,
и точные закрепленные версии продолжают использоваться при последующих запусках
`update <plugin-id>`.

`openclaw plugins update --all` — это путь массового обслуживания. Он по-прежнему
учитывает обычные отслеживаемые спецификации установки, но доверенные официальные
записи Plugin OpenClaw могут синхронизироваться с текущей целью официального
каталога вместо того, чтобы оставаться на устаревшем точном официальном пакете.
Если `update.channel` установлен в `beta`, такая массовая официальная
синхронизация использует контекст beta-канала. Используйте целевой
`update <plugin-id>`, когда намеренно хотите оставить точную или помеченную
официальную спецификацию без изменений.

Для установок npm можно передать явную спецификацию пакета, чтобы переключить
отслеживаемую запись:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Вторая команда возвращает Plugin к стандартной release-линии реестра, если ранее
он был закреплен на точной версии или теге.

Когда `openclaw update` выполняется на beta-канале, записи Plugin могут
предпочитать соответствующие выпуски `@beta`. Точные правила fallback и
закрепления см. в [`openclaw plugins`](/ru/cli/plugins#update).

## Удаление Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

Удаление удаляет запись конфигурации Plugin, сохраненную индексную запись Plugin,
записи списков разрешений/запретов и связанные пути загрузки, где применимо.
Управляемые каталоги установки удаляются, если вы не передаете `--keep-files`.
Запущенный управляемый Gateway автоматически перезапускается, когда удаление
меняет источник Plugin.

В режиме Nix (`OPENCLAW_NIX_MODE=1`) команды установки, обновления, удаления,
включения и отключения Plugin отключены. Управляйте этими вариантами в
Nix-источнике установки.

## Выбор источника

| Источник    | Когда использовать                                                        | Пример                                                         |
| ----------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Вам нужны нативные для OpenClaw обнаружение, сводки сканирования, версии и подсказки | `openclaw plugins install clawhub:<package>`                   |
| npmjs.com   | Вы уже публикуете JavaScript-пакеты или нужны npm dist-tags/частный реестр | `openclaw plugins install npm:@acme/openclaw-plugin`           |
| git         | Вам нужна ветка, тег или коммит из репозитория                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| локальный путь | Вы разрабатываете или тестируете Plugin на той же машине               | `openclaw plugins install --link ./my-plugin`                  |
| npm pack    | Вы проверяете локальный артефакт пакета через семантику npm install       | `openclaw plugins install npm-pack:<path.tgz>`                 |
| marketplace | Вы устанавливаете Claude-совместимый marketplace Plugin                   | `openclaw plugins install <plugin> --marketplace <source>`     |

Управляемые установки из локального пути должны быть каталогами или архивами
Plugin. Помещайте отдельные файлы Plugin в `plugins.load.paths` вместо их
установки через `plugins install`.

## Публикация Plugin

ClawHub — основная публичная поверхность обнаружения для Plugin OpenClaw.
Публикуйте там, когда хотите, чтобы пользователи находили метаданные Plugin,
историю версий, результаты сканирования реестра и подсказки по установке до
установки.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Нативные npm Plugin должны включать манифест Plugin и метаданные пакета перед
публикацией:

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Используйте эти страницы как полный контракт публикации, а не считайте эту
страницу справочником по публикации:

- [Публикация ClawHub](/ru/clawhub/publishing) объясняет владельцев, scopes, релизы,
  review, проверку пакетов и передачу пакетов.
- [Создание Plugin](/ru/plugins/building-plugins) показывает форму пакета Plugin
  и первый workflow публикации.
- [Манифест Plugin](/ru/plugins/manifest) определяет поля манифеста нативного Plugin.

Если один и тот же пакет доступен и в ClawHub, и в npm, используйте явный
префикс `clawhub:` или `npm:`, когда нужно принудительно выбрать один источник.

## Связанные материалы

- [Plugins](/ru/tools/plugin) - установка, настройка, перезапуск и устранение неполадок
- [`openclaw plugins`](/ru/cli/plugins) - полный справочник CLI
- [Community plugins](/ru/plugins/community) - публичное обнаружение и публикация в ClawHub
- [ClawHub](/ru/clawhub/cli) - операции CLI реестра
- [Создание Plugin](/ru/plugins/building-plugins) - создание пакета Plugin
- [Манифест Plugin](/ru/plugins/manifest) - манифест и метаданные пакета
