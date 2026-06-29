---
read_when:
    - Вы хотите, чтобы агенты OpenClaw в режиме Codex использовали Codex Computer Use
    - Вы выбираете между Codex Computer Use, PeekabooBridge и прямым MCP cua-driver
    - Вы выбираете между Codex Computer Use и прямой настройкой MCP для cua-driver
    - Вы настраиваете computerUse для встроенного plugin Codex
    - Вы устраняете неполадки со статусом или установкой /codex computer-use
summary: Настройте Codex Computer Use для агентов OpenClaw в режиме Codex
title: Использование компьютера в Codex
x-i18n:
    generated_at: "2026-06-28T23:15:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a595b8ae261c1cc9a1469217a31279cd3a116b0f11c16813ea018aab76b8c0d
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use — это нативный для Codex MCP Plugin для локального управления рабочим столом. OpenClaw
не встраивает desktop app, не выполняет действия на рабочем столе самостоятельно и не обходит
разрешения Codex. Встроенный Plugin `codex` только подготавливает Codex app-server:
он включает поддержку Codex Plugin, находит или устанавливает настроенный Codex
Computer Use Plugin, проверяет доступность MCP-сервера `computer-use`, а
затем позволяет Codex владеть нативными вызовами MCP-инструментов во время ходов в Codex-mode.

Используйте эту страницу, когда OpenClaw уже использует нативный Codex harness. О
настройке самого runtime см. [Codex harness](/ru/plugins/codex-harness).

## OpenClaw.app и Peekaboo

Интеграция Peekaboo в OpenClaw.app отделена от Codex Computer Use. Приложение
macOS может размещать сокет PeekabooBridge, чтобы CLI `peekaboo` мог повторно использовать
локальные разрешения приложения Accessibility и Screen Recording для собственных
инструментов автоматизации Peekaboo. Этот мост не устанавливает и не проксирует Codex Computer Use, а
Codex Computer Use не вызывает ничего через сокет PeekabooBridge.

Используйте [Peekaboo bridge](/ru/platforms/mac/peekaboo), когда вы хотите, чтобы OpenClaw.app был
хостом с учетом разрешений для автоматизации Peekaboo CLI. Используйте эту страницу, когда
агент OpenClaw в Codex-mode должен иметь нативный MCP Plugin `computer-use` Codex
доступным до начала хода.

## Приложение iOS

Приложение iOS отделено от Codex Computer Use. Оно не устанавливает и не проксирует
MCP-сервер Codex `computer-use` и не является backend для управления рабочим столом.
Вместо этого приложение iOS подключается как узел OpenClaw и предоставляет мобильные
возможности через команды узла, такие как `canvas.*`, `camera.*`, `screen.*`,
`location.*` и `talk.*`.

Используйте [iOS](/ru/platforms/ios), когда вы хотите, чтобы агент управлял узлом iPhone через
Gateway. Используйте эту страницу, когда агент в Codex-mode должен управлять локальным
рабочим столом macOS через нативный Plugin Computer Use Codex.

## Прямой MCP cua-driver

Codex Computer Use — не единственный способ предоставить управление рабочим столом. Если вы хотите,
чтобы runtime, управляемые OpenClaw, вызывали драйвер TryCua напрямую, используйте upstream
сервер `cua-driver mcp` через MCP-реестр OpenClaw вместо
специфичного для Codex процесса marketplace.

После установки `cua-driver` либо запросите у него команду OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

либо зарегистрируйте stdio-сервер самостоятельно:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Этот путь сохраняет поверхность MCP-инструментов upstream без изменений, включая схемы драйвера
и структурированные MCP-ответы. Используйте его, когда CUA-драйвер должен быть
доступен как обычный MCP-сервер OpenClaw. Используйте настройку Codex Computer Use на
этой странице, когда Codex app-server должен владеть установкой Plugin, перезагрузками MCP
и нативными вызовами инструментов внутри ходов в Codex-mode.

Драйвер CUA специфичен для macOS и по-прежнему требует локальных разрешений macOS,
которые запрашивает его приложение, например Accessibility и Screen Recording. OpenClaw
не устанавливает `cua-driver`, не предоставляет эти разрешения и не обходит модель безопасности
upstream-драйвера.

## Быстрая настройка

Задайте `plugins.entries.codex.config.computerUse`, когда ходы в Codex-mode должны иметь
Computer Use доступным до запуска потока. `autoInstall: true` включает
Computer Use и позволяет OpenClaw установить или повторно включить его перед ходом:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

С этой конфигурацией OpenClaw проверяет Codex app-server перед каждым ходом в Codex-mode.
Если Computer Use отсутствует, но Codex app-server уже обнаружил
устанавливаемый marketplace, OpenClaw просит Codex app-server установить или повторно включить
Plugin и перезагрузить MCP-серверы. В macOS, когда подходящий marketplace не
зарегистрирован и существует стандартный bundle приложения Codex, OpenClaw также пытается
зарегистрировать встроенный Codex marketplace из
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` перед тем, как
завершиться ошибкой. Если настройка по-прежнему не может сделать MCP-сервер доступным, ход завершается ошибкой
до запуска потока.

После изменения конфигурации Computer Use используйте `/new` или `/reset` в затронутом чате
перед тестированием, если существующий поток Codex уже запущен.

При управляемом запуске stdio в macOS OpenClaw предпочитает подписанный bundle desktop-приложения Codex
по пути `/Applications/Codex.app/Contents/Resources/codex`, когда он существует.
Это удерживает Computer Use внутри bundle приложения, которому принадлежат локальные разрешения
управления рабочим столом. Если desktop-приложение не установлено, OpenClaw переключается на
управляемый бинарный файл Codex, установленный рядом с Plugin. Если установленное desktop-приложение
инициализируется с неподдерживаемой версией app-server, OpenClaw закрывает этот дочерний процесс
и пробует следующего кандидата управляемого бинарного файла, вместо того чтобы позволять устаревшему
desktop-приложению скрывать локальный fallback Plugin. Явная конфигурация `appServer.command`
или `OPENCLAW_CODEX_APP_SERVER_BIN` по-прежнему переопределяет этот управляемый
выбор.

## Команды

Используйте команды `/codex computer-use` с любой поверхности чата, где доступна командная
поверхность Plugin `codex`. Это команды чата/runtime OpenClaw,
а не подкоманды CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` доступна только для чтения. Она не добавляет источники marketplace, не устанавливает Plugin и не
включает поддержку Codex Plugin. Если конфигурация не включает Computer Use,
`status` может сообщить, что он отключен, даже после разовой команды установки.

`install` включает поддержку Plugin в Codex app-server, при необходимости добавляет настроенный
источник marketplace, устанавливает или повторно включает настроенный Plugin через Codex
app-server, перезагружает MCP-серверы и проверяет, что MCP-сервер предоставляет инструменты.

## Выбор marketplace

OpenClaw использует тот же API app-server, который предоставляет сам Codex. Поля
marketplace выбирают, где Codex должен искать `computer-use`.

| Поле                 | Когда использовать                                              | Поддержка установки                                      |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Нет поля marketplace | Вы хотите, чтобы Codex app-server использовал уже известные ему marketplace. | Да, когда app-server возвращает локальный marketplace. |
| `marketplaceSource`  | У вас есть источник Codex marketplace, который app-server может добавить. | Да, для явной `/codex computer-use install`. |
| `marketplacePath`    | Вы уже знаете локальный путь к файлу marketplace на хосте.      | Да, для явной установки и автоустановки при запуске хода. |
| `marketplaceName`    | Вы хотите выбрать один уже зарегистрированный marketplace по имени. | Да, только когда выбранный marketplace имеет локальный путь. |

Свежим Codex home может понадобиться немного времени, чтобы заполнить официальные marketplace.
Во время установки OpenClaw опрашивает `plugin/list` в течение до
`marketplaceDiscoveryTimeoutMs` миллисекунд. Значение по умолчанию — 60 секунд.

Если несколько известных marketplace содержат Computer Use, OpenClaw предпочитает
`openai-bundled`, затем `openai-curated`, затем `local`. Неизвестные неоднозначные совпадения
завершаются отказом и просят задать `marketplaceName` или `marketplacePath`.

## Встроенный marketplace macOS

В недавних сборках Codex desktop Computer Use встроен здесь:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Когда `computerUse.autoInstall` имеет значение true и не зарегистрирован marketplace, содержащий
`computer-use`, OpenClaw пытается автоматически добавить стандартный встроенный
корень marketplace:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Вы также можете зарегистрировать его явно из shell с помощью Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Если вы используете нестандартный путь к приложению Codex, один раз выполните `/codex computer-use install
--source <marketplace-root>` или задайте `computerUse.marketplacePath` равным
локальному пути к файлу marketplace. Используйте `--marketplace-path` только тогда, когда у вас есть
путь к JSON-файлу marketplace, а не корень встроенного marketplace.

## Ограничение удаленного каталога

Codex app-server может перечислять и читать записи только удаленного каталога, но сейчас не
поддерживает удаленный `plugin/install`. Это означает, что `marketplaceName` может
выбирать удаленный marketplace только для проверок статуса, но для установок и повторных включений
по-прежнему нужен локальный marketplace через `marketplaceSource` или `marketplacePath`.

Если status сообщает, что Plugin доступен в удаленном Codex marketplace, но удаленная
установка не поддерживается, выполните install с локальным источником или путем:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Справочник конфигурации

| Поле                            | По умолчанию  | Значение                                                                       |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Требовать Computer Use. По умолчанию true, когда задано другое поле Computer Use. |
| `autoInstall`                   | false          | Установить или повторно включить из уже обнаруженных marketplace при запуске хода. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Как долго install ждет обнаружения marketplace в Codex app-server.             |
| `marketplaceSource`             | unset          | Строка источника, передаваемая в `marketplace/add` Codex app-server.           |
| `marketplacePath`               | unset          | Локальный путь к файлу Codex marketplace, содержащему Plugin.                  |
| `marketplaceName`               | unset          | Имя зарегистрированного Codex marketplace для выбора.                          |
| `pluginName`                    | `computer-use` | Имя Plugin в Codex marketplace.                                                |
| `mcpServerName`                 | `computer-use` | Имя MCP-сервера, предоставляемого установленным Plugin.                        |

Автоустановка при запуске хода намеренно отклоняет настроенные значения `marketplaceSource`.
Добавление нового источника — это явная операция настройки, поэтому один раз используйте
`/codex computer-use install --source <marketplace-source>`, затем позвольте
`autoInstall` обрабатывать будущие повторные включения из обнаруженных локальных marketplace.
Автоустановка при запуске хода может использовать настроенный `marketplacePath`, потому что это
уже локальный путь на хосте.

## Что проверяет OpenClaw

OpenClaw сообщает стабильную причину настройки внутренне и форматирует пользовательский
статус для чата:

| Причина                     | Значение                                               | Следующий шаг                                  |
| --------------------------- | ------------------------------------------------------ | ---------------------------------------------- |
| `disabled`                  | `computerUse.enabled` разрешился в false.              | Задайте `enabled` или другое поле Computer Use. |
| `marketplace_missing`       | Подходящий маркетплейс недоступен.                     | Настройте источник, путь или имя маркетплейса. |
| `plugin_not_installed`      | Маркетплейс существует, но plugin не установлен.       | Запустите установку или включите `autoInstall`. |
| `plugin_disabled`           | Plugin установлен, но отключен в конфигурации Codex.   | Запустите установку, чтобы снова включить его. |
| `remote_install_unsupported` | Выбранный маркетплейс доступен только удаленно.        | Используйте `marketplaceSource` или `marketplacePath`. |
| `mcp_missing`               | Plugin включен, но сервер MCP недоступен.              | Проверьте Codex Computer Use и разрешения ОС.  |
| `ready`                     | Plugin и инструменты MCP доступны.                     | Начните ход в режиме Codex.                    |
| `check_failed`              | Запрос к app-server Codex завершился ошибкой при проверке статуса. | Проверьте подключение к app-server и журналы. |
| `auto_install_blocked`      | Настройке при начале хода нужно было бы добавить новый источник. | Сначала запустите явную установку.            |

Вывод чата включает состояние plugin, состояние сервера MCP, маркетплейс,
инструменты, когда они доступны, и конкретное сообщение для неудачного шага
настройки.

## Разрешения macOS

Computer Use относится только к macOS. Сервер MCP, принадлежащий Codex, может
потребовать локальные разрешения ОС, прежде чем сможет проверять приложения или
управлять ими. Если OpenClaw сообщает, что Computer Use установлен, но сервер
MCP недоступен, сначала проверьте настройку Computer Use на стороне Codex:

- Codex app-server запущен на том же хосте, где должно выполняться управление
  рабочим столом.
- Plugin Computer Use включен в конфигурации Codex.
- Сервер MCP `computer-use` отображается в статусе MCP Codex app-server.
- macOS предоставила необходимые разрешения приложению для управления рабочим столом.
- Текущий сеанс хоста может получить доступ к управляемому рабочему столу.

OpenClaw намеренно отказывает по умолчанию, когда `computerUse.enabled` равно true.
Ход в режиме Codex не должен незаметно продолжаться без нативных инструментов
рабочего стола, которые требуются конфигурацией.

## Устранение неполадок

**Статус сообщает, что не установлено.** Запустите `/codex computer-use install`. Если
маркетплейс не обнаружен, передайте `--source` или `--marketplace-path`.

**Статус сообщает, что установлено, но отключено.** Снова запустите `/codex computer-use install`.
Установка через Codex app-server записывает конфигурацию plugin обратно как включенную.

**Статус сообщает, что удаленная установка не поддерживается.** Используйте локальный источник
маркетплейса или путь. Записи каталога, доступные только удаленно, можно просматривать, но
нельзя устанавливать через текущий API app-server.

**Статус сообщает, что сервер MCP недоступен.** Один раз повторно запустите установку, чтобы
серверы MCP перезагрузились. Если он остается недоступным, исправьте приложение Codex Computer Use,
статус MCP Codex app-server или разрешения macOS.

**Статус или проба истекает по тайм-ауту на `computer-use.list_apps`.** Plugin и сервер MCP
присутствуют, но локальный мост Computer Use не ответил. Закройте или перезапустите
Codex Computer Use, при необходимости перезапустите Codex Desktop, затем повторите попытку
в новом сеансе OpenClaw. Если ранее хост запускал Computer Use через более старый управляемый
Codex app-server, обновите установленный plugin из маркетплейса, встроенного в настольное приложение:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Инструмент Computer Use сообщает `Native hook relay unavailable`.** Нативный для Codex
хук инструмента не смог достичь активного ретранслятора OpenClaw через локальный мост или
резервный путь Gateway. Запустите новый сеанс OpenClaw с помощью `/new` или `/reset`. Если это
срабатывает один раз, а затем снова завершается ошибкой при более позднем вызове инструмента,
`/new` очищает только текущую попытку; перезапустите Codex app-server или OpenClaw Gateway, чтобы
старые потоки и регистрации хуков были удалены, затем повторите попытку в новом сеансе.

**Автоустановка при начале хода отклоняет источник.** Это намеренно. Сначала добавьте
источник с явной командой `/codex computer-use install --source <marketplace-source>`, затем
будущая автоустановка при начале хода сможет использовать обнаруженный локальный
маркетплейс.

## См. также

- [Codex harness](/ru/plugins/codex-harness)
- [Мост Peekaboo](/ru/platforms/mac/peekaboo)
- [Приложение iOS](/ru/platforms/ios)
