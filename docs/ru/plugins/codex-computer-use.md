---
read_when:
    - Вы хотите, чтобы агенты OpenClaw в режиме Codex использовали Codex Computer Use
    - Вы выбираете между Codex Computer Use, PeekabooBridge и прямым MCP cua-driver
    - Вы выбираете между Codex Computer Use и прямой настройкой MCP cua-driver
    - Вы настраиваете computerUse для bundled Codex plugin
    - Вы устраняете неполадки со статусом или установкой /codex computer-use
summary: Настройка Codex Computer Use для агентов OpenClaw в режиме Codex
title: Codex Computer Use
x-i18n:
    generated_at: "2026-06-30T14:16:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb785e2fda0d89a7e7770df0c2a4b3aa23f97cb1c8515a7d555a8409acfd3b2
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use — это MCP Plugin, нативный для Codex, для локального управления рабочим столом. OpenClaw
не встраивает desktop-приложение, не выполняет действия с рабочим столом самостоятельно и не обходит
разрешения Codex. Встроенный Plugin `codex` только подготавливает app-server Codex:
он включает поддержку Plugin в Codex, находит или устанавливает настроенный Plugin Codex
Computer Use, проверяет, что MCP-сервер `computer-use` доступен, а затем
передает Codex владение нативными вызовами MCP-инструментов во время ходов в режиме Codex.

Используйте эту страницу, когда OpenClaw уже использует нативный harness Codex. Для самой
настройки runtime см. [harness Codex](/ru/plugins/codex-harness).

## OpenClaw.app и Peekaboo

Интеграция Peekaboo в OpenClaw.app отделена от Codex Computer Use. Приложение
macOS может размещать сокет PeekabooBridge, чтобы CLI `peekaboo` мог повторно использовать
локальные разрешения Accessibility и Screen Recording приложения для собственных
инструментов автоматизации Peekaboo. Этот мост не устанавливает и не проксирует Codex Computer Use, а
Codex Computer Use не обращается через сокет PeekabooBridge.

Используйте [мост Peekaboo](/ru/platforms/mac/peekaboo), когда хотите, чтобы OpenClaw.app был
permission-aware хостом для автоматизации Peekaboo CLI. Используйте эту страницу, когда
агент OpenClaw в режиме Codex должен иметь нативный MCP Plugin `computer-use` Codex
доступным до начала хода.

## Приложение iOS

Приложение iOS отделено от Codex Computer Use. Оно не устанавливает и не проксирует
MCP-сервер Codex `computer-use` и не является backend для управления рабочим столом.
Вместо этого приложение iOS подключается как узел OpenClaw и предоставляет мобильные
возможности через команды узла, такие как `canvas.*`, `camera.*`, `screen.*`,
`location.*` и `talk.*`.

Используйте [iOS](/ru/platforms/ios), когда хотите, чтобы агент управлял узлом iPhone через
Gateway. Используйте эту страницу, когда агент в режиме Codex должен управлять локальным
рабочим столом macOS через нативный Plugin Computer Use Codex.

## Прямой MCP cua-driver

Codex Computer Use — не единственный способ предоставить управление рабочим столом. Если вы хотите,
чтобы runtime под управлением OpenClaw вызывали драйвер TryCua напрямую, используйте upstream
MCP-сервер `cua-driver mcp` через MCP-реестр OpenClaw вместо
специфичного для Codex marketplace-потока.

После установки `cua-driver` либо запросите у него команду OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

либо зарегистрируйте stdio-сервер самостоятельно:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Этот путь сохраняет upstream-поверхность MCP-инструментов без изменений, включая схемы драйвера
и структурированные MCP-ответы. Используйте его, когда хотите, чтобы драйвер CUA был
доступен как обычный MCP-сервер OpenClaw. Используйте настройку Codex Computer Use на
этой странице, когда app-server Codex должен владеть установкой Plugin, перезагрузками MCP
и нативными вызовами инструментов внутри ходов в режиме Codex.

Драйвер CUA специфичен для macOS и по-прежнему требует локальных разрешений macOS,
которые запрашивает его приложение, таких как Accessibility и Screen Recording. OpenClaw
не устанавливает `cua-driver`, не выдает эти разрешения и не обходит модель безопасности
upstream-драйвера.

## Быстрая настройка

Задайте `plugins.entries.codex.config.computerUse`, когда ходам в режиме Codex требуется
доступный Computer Use до начала треда. `autoInstall: true` включает
Computer Use и позволяет OpenClaw установить или повторно включить его до хода:

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

С этой конфигурацией OpenClaw проверяет app-server Codex перед каждым ходом в режиме Codex.
Если Computer Use отсутствует, но app-server Codex уже обнаружил устанавливаемый
marketplace, OpenClaw просит app-server Codex установить или повторно включить
Plugin и перезагрузить MCP-серверы. В macOS, когда подходящий marketplace
не зарегистрирован, а стандартный bundle приложения Codex существует, OpenClaw также пытается
зарегистрировать встроенный marketplace Codex из
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` перед тем, как
завершиться с ошибкой. Если настройка все равно не может сделать MCP-сервер доступным, ход завершается ошибкой
до начала треда.

После изменения конфигурации Computer Use используйте `/new` или `/reset` в затронутом чате
перед тестированием, если существующий тред Codex уже был начат.

При управляемом stdio-запуске в macOS OpenClaw предпочитает подписанный bundle desktop-приложения Codex
по пути `/Applications/Codex.app/Contents/Resources/codex`, когда он существует.
Это удерживает Computer Use внутри bundle приложения, которому принадлежат локальные разрешения
на управление рабочим столом. Если desktop-приложение не установлено, OpenClaw возвращается к
управляемому бинарному файлу Codex, установленному рядом с Plugin. Если установленное desktop-приложение
инициализируется с неподдерживаемой версией app-server, OpenClaw закрывает этот дочерний процесс
и пробует следующий кандидат управляемого бинарного файла вместо того, чтобы позволить устаревшему
desktop-приложению перекрыть plugin-local fallback. Явная конфигурация `appServer.command`
или `OPENCLAW_CODEX_APP_SERVER_BIN` по-прежнему переопределяет этот управляемый
выбор.

## Команды

Используйте команды `/codex computer-use` с любой чат-поверхности, где доступна командная поверхность
Plugin `codex`. Это команды чата/runtime OpenClaw,
а не CLI-подкоманды `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` предназначена только для чтения. Она не добавляет источники marketplace, не устанавливает Plugin и не
включает поддержку Plugin в Codex. Если никакая конфигурация не включает Computer Use, `status` может
сообщить, что он отключен, даже после разовой команды установки.

`install` включает поддержку Plugin в app-server Codex, при необходимости добавляет настроенный
источник marketplace, устанавливает или повторно включает настроенный Plugin через app-server Codex,
перезагружает MCP-серверы и проверяет, что MCP-сервер предоставляет инструменты.
Поскольку установка изменяет доверенные ресурсы хоста, запускать `install` может только владелец или
клиент Gateway `operator.admin`. Другие авторизованные отправители могут
продолжать использовать команду `status` только для чтения, в том числе с переопределениями.

## Выбор marketplace

OpenClaw использует тот же API app-server, который предоставляет сам Codex. Поля
marketplace выбирают, где Codex должен искать `computer-use`.

| Поле                 | Когда использовать                                               | Поддержка установки                                      |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Нет поля marketplace | Вы хотите, чтобы app-server Codex использовал уже известные ему marketplace. | Да, когда app-server возвращает локальный marketplace.   |
| `marketplaceSource`  | У вас есть источник marketplace Codex, который app-server может добавить. | Да, для явного `/codex computer-use install`.            |
| `marketplacePath`    | Вы уже знаете локальный путь к файлу marketplace на хосте.      | Да, для явной установки и автоустановки при старте хода. |
| `marketplaceName`    | Вы хотите выбрать один уже зарегистрированный marketplace по имени. | Да, только когда у выбранного marketplace есть локальный путь. |

Новым домам Codex может понадобиться короткое время, чтобы инициализировать официальные marketplace.
Во время установки OpenClaw опрашивает `plugin/list` в течение до
`marketplaceDiscoveryTimeoutMs` миллисекунд. По умолчанию используется 60 секунд.

Если несколько известных marketplace содержат Computer Use, OpenClaw предпочитает
`openai-bundled`, затем `openai-curated`, затем `local`. Неизвестные неоднозначные совпадения
завершаются отказом и просят задать `marketplaceName` или `marketplacePath`.

## Встроенный marketplace macOS

Свежие сборки Codex desktop включают Computer Use здесь:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Когда `computerUse.autoInstall` равно true и ни один marketplace, содержащий
`computer-use`, не зарегистрирован, OpenClaw пытается автоматически добавить стандартный встроенный
корень marketplace:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Вы также можете зарегистрировать его явно из shell с помощью Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Если вы используете нестандартный путь к приложению Codex, один раз выполните `/codex computer-use install
--source <marketplace-root>` или задайте `computerUse.marketplacePath` как
локальный путь к файлу marketplace. Используйте `--marketplace-path` только когда у вас есть
путь к JSON-файлу marketplace, а не корень встроенного marketplace.

## Ограничение удаленного каталога

app-server Codex может перечислять и читать записи remote-only каталога, но сейчас он не
поддерживает удаленный `plugin/install`. Это означает, что `marketplaceName` может
выбрать remote-only marketplace для проверок статуса, но для установок и повторных включений
по-прежнему нужен локальный marketplace через `marketplaceSource` или `marketplacePath`.

Если статус сообщает, что Plugin доступен в удаленном marketplace Codex, но удаленная
установка не поддерживается, запустите установку с локальным источником или путем:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Справочник конфигурации

| Поле                            | По умолчанию  | Значение                                                                       |
| ------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred      | Требовать Computer Use. По умолчанию true, когда задано другое поле Computer Use. |
| `autoInstall`                   | false         | Устанавливать или повторно включать из уже обнаруженных marketplace при старте хода. |
| `marketplaceDiscoveryTimeoutMs` | 60000         | Как долго установка ждет обнаружения marketplace app-server Codex.             |
| `marketplaceSource`             | unset         | Строка источника, передаваемая в `marketplace/add` app-server Codex.           |
| `marketplacePath`               | unset         | Локальный путь к файлу marketplace Codex, содержащему Plugin.                  |
| `marketplaceName`               | unset         | Имя зарегистрированного marketplace Codex для выбора.                          |
| `pluginName`                    | `computer-use` | Имя Plugin в marketplace Codex.                                                |
| `mcpServerName`                 | `computer-use` | Имя MCP-сервера, предоставляемого установленным Plugin.                        |

Автоустановка при старте хода намеренно отклоняет настроенные значения `marketplaceSource`.
Добавление нового источника — это явная операция настройки, поэтому один раз используйте
`/codex computer-use install --source <marketplace-source>`, а затем позвольте
`autoInstall` обрабатывать будущие повторные включения из обнаруженных локальных marketplace.
Автоустановка при старте хода может использовать настроенный `marketplacePath`, потому что это
уже локальный путь на хосте.

## Что проверяет OpenClaw

OpenClaw сообщает стабильную причину настройки внутренне и форматирует видимый пользователю
статус для чата:

| Причина                     | Значение                                               | Следующий шаг                                  |
| --------------------------- | ------------------------------------------------------ | ---------------------------------------------- |
| `disabled`                  | `computerUse.enabled` разрешилось в false.             | Задайте `enabled` или другое поле Computer Use. |
| `marketplace_missing`       | Подходящий marketplace недоступен.                     | Настройте источник, путь или имя marketplace.  |
| `plugin_not_installed`      | Marketplace существует, но Plugin не установлен.       | Запустите установку или включите `autoInstall`. |
| `plugin_disabled`           | Plugin установлен, но отключен в конфигурации Codex.   | Запустите установку, чтобы снова включить его. |
| `remote_install_unsupported` | Выбранный marketplace доступен только удаленно.        | Используйте `marketplaceSource` или `marketplacePath`. |
| `mcp_missing`               | Plugin включен, но MCP-сервер недоступен.              | Проверьте Codex Computer Use и разрешения ОС.  |
| `ready`                     | Plugin и инструменты MCP доступны.                     | Начните ход в режиме Codex.                    |
| `check_failed`              | Запрос к Codex app-server завершился ошибкой во время проверки состояния. | Проверьте подключение к app-server и журналы. |
| `auto_install_blocked`      | Настройке при начале хода потребовалось бы добавить новый источник. | Сначала запустите явную установку.             |

Вывод чата включает состояние Plugin, состояние MCP-сервера, marketplace, инструменты,
когда они доступны, и конкретное сообщение для сбойного шага настройки.

## Разрешения macOS

Computer Use зависит от macOS. MCP-сервер, принадлежащий Codex, может потребовать локальные
разрешения ОС, прежде чем сможет проверять приложения или управлять ими. Если OpenClaw сообщает,
что Computer Use установлен, но MCP-сервер недоступен, сначала проверьте настройку Computer
Use на стороне Codex:

- Codex app-server запущен на том же хосте, где должно выполняться управление рабочим столом.
- Plugin Computer Use включен в конфигурации Codex.
- MCP-сервер `computer-use` отображается в состоянии MCP Codex app-server.
- macOS предоставила требуемые разрешения приложению для управления рабочим столом.
- Текущий сеанс хоста может получить доступ к управляемому рабочему столу.

OpenClaw намеренно завершает работу с отказом, когда `computerUse.enabled` равно true. Ход в
режиме Codex не должен без уведомления продолжаться без нативных инструментов рабочего стола,
которые потребовала конфигурация.

## Устранение неполадок

**Состояние сообщает, что не установлено.** Запустите `/codex computer-use install`. Если
marketplace не обнаружен, передайте `--source` или `--marketplace-path`.

**Состояние сообщает, что установлено, но отключено.** Снова запустите `/codex computer-use install`.
Установка через Codex app-server записывает конфигурацию Plugin обратно во включенное состояние.

**Состояние сообщает, что удаленная установка не поддерживается.** Используйте локальный источник
или путь marketplace. Записи каталога, доступные только удаленно, можно просмотреть, но нельзя
установить через текущий API app-server.

**Состояние сообщает, что MCP-сервер недоступен.** Один раз повторно запустите установку, чтобы
MCP-серверы перезагрузились. Если он по-прежнему недоступен, исправьте приложение Codex Computer Use,
состояние MCP Codex app-server или разрешения macOS.

**Состояние или проба завершается по тайм-ауту на `computer-use.list_apps`.** Plugin и MCP-сервер
присутствуют, но локальный мост Computer Use не ответил. Закройте или перезапустите Codex Computer
Use, при необходимости снова запустите Codex Desktop, затем повторите попытку в новом сеансе OpenClaw.
Если хост ранее запускал Computer Use через более старый управляемый Codex app-server, обновите
установленный Plugin из marketplace, встроенного в настольное приложение:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Инструмент Computer Use сообщает `Native hook relay unavailable`.** Нативный hook инструмента
Codex не смог достичь активного relay OpenClaw через локальный мост или резервный путь Gateway.
Начните новый сеанс OpenClaw с `/new` или `/reset`. Если один раз это срабатывает, а затем снова
завершается ошибкой при более позднем вызове инструмента, `/new` очищает только текущую попытку;
перезапустите Codex app-server или OpenClaw Gateway, чтобы старые потоки и регистрации hook были
сброшены, затем повторите попытку в новом сеансе.

**Автоустановка при начале хода отклоняет источник.** Это сделано намеренно. Сначала добавьте
источник явной командой `/codex computer-use install --source <marketplace-source>`, после чего
будущая автоустановка при начале хода сможет использовать обнаруженный локальный marketplace.

## См. также

- [Codex harness](/ru/plugins/codex-harness)
- [Peekaboo bridge](/ru/platforms/mac/peekaboo)
- [iOS app](/ru/platforms/ios)
