---
read_when:
    - Ви хочете, щоб агенти OpenClaw у режимі Codex використовували Codex Computer Use
    - Ви обираєте між Codex Computer Use, PeekabooBridge і прямим cua-driver MCP
    - Ви обираєте між Codex Computer Use і прямим налаштуванням MCP cua-driver
    - Ви налаштовуєте computerUse для вбудованого плагіна Codex
    - Ви усуваєте несправності стану або встановлення `/codex computer-use`
summary: Налаштуйте Codex Computer Use для агентів OpenClaw у режимі Codex
title: Використання комп’ютера Codex
x-i18n:
    generated_at: "2026-06-27T17:49:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a595b8ae261c1cc9a1469217a31279cd3a116b0f11c16813ea018aab76b8c0d
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use — це нативний для Codex MCP-плагін для керування локальним робочим столом. OpenClaw
не постачає desktop app, не виконує desktop-дії самостійно й не обходить
дозволи Codex. Вбудований плагін `codex` лише готує Codex app-server:
він вмикає підтримку плагінів Codex, знаходить або встановлює налаштований Codex
Computer Use плагін, перевіряє, що MCP-сервер `computer-use` доступний, а
потім дозволяє Codex володіти нативними викликами MCP-інструментів під час ходів у Codex-mode.

Використовуйте цю сторінку, коли OpenClaw уже використовує нативний harness Codex. Для
налаштування самого runtime див. [Codex harness](/uk/plugins/codex-harness).

## OpenClaw.app і Peekaboo

Інтеграція Peekaboo в OpenClaw.app є окремою від Codex Computer Use. Застосунок
macOS може розміщувати сокет PeekabooBridge, щоб CLI `peekaboo` міг повторно використовувати
локальні дозволи Accessibility і Screen Recording застосунку для власних
інструментів автоматизації Peekaboo. Цей bridge не встановлює й не проксіює Codex Computer Use, а
Codex Computer Use не викликається через сокет PeekabooBridge.

Використовуйте [Peekaboo bridge](/uk/platforms/mac/peekaboo), коли хочете, щоб OpenClaw.app був
host із урахуванням дозволів для автоматизації Peekaboo CLI. Використовуйте цю сторінку, коли
OpenClaw-агент у Codex-mode має мати нативний MCP-плагін `computer-use` Codex
доступним до початку ходу.

## Застосунок iOS

Застосунок iOS є окремим від Codex Computer Use. Він не встановлює й не проксіює
MCP-сервер Codex `computer-use` і не є backend для керування робочим столом.
Натомість застосунок iOS підключається як вузол OpenClaw і надає мобільні
можливості через команди вузла, як-от `canvas.*`, `camera.*`, `screen.*`,
`location.*` і `talk.*`.

Використовуйте [iOS](/uk/platforms/ios), коли хочете, щоб агент керував вузлом iPhone через
gateway. Використовуйте цю сторінку, коли агент у Codex-mode має керувати локальним
робочим столом macOS через нативний Plugin Computer Use Codex.

## Прямий cua-driver MCP

Codex Computer Use — не єдиний спосіб надати керування робочим столом. Якщо ви хочете,
щоб керовані OpenClaw runtime напряму викликали driver TryCua, використовуйте upstream
сервер `cua-driver mcp` через MCP-реєстр OpenClaw замість
специфічного для Codex marketplace flow.

Після встановлення `cua-driver` або попросіть його надати команду OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

або зареєструйте stdio-сервер самостійно:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Цей шлях зберігає upstream поверхню MCP-інструментів без змін, зокрема схеми driver
і структуровані MCP-відповіді. Використовуйте його, коли хочете, щоб CUA driver
був доступний як звичайний MCP-сервер OpenClaw. Використовуйте налаштування Codex Computer Use на
цій сторінці, коли Codex app-server має володіти встановленням Plugin, перезавантаженнями MCP
і нативними викликами інструментів усередині ходів у Codex-mode.

Driver CUA є специфічним для macOS і все одно потребує локальних дозволів macOS,
які запитує його застосунок, як-от Accessibility і Screen Recording. OpenClaw
не встановлює `cua-driver`, не надає ці дозволи й не обходить модель безпеки
upstream driver.

## Швидке налаштування

Задайте `plugins.entries.codex.config.computerUse`, коли ходи Codex-mode мають мати
Computer Use доступним до початку thread. `autoInstall: true` вмикає
Computer Use і дозволяє OpenClaw встановити або повторно ввімкнути його перед ходом:

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

З цією конфігурацією OpenClaw перевіряє Codex app-server перед кожним ходом Codex-mode.
Якщо Computer Use відсутній, але Codex app-server уже виявив придатний для встановлення
marketplace, OpenClaw просить Codex app-server встановити або повторно ввімкнути
плагін і перезавантажити MCP-сервери. На macOS, коли відповідний marketplace не
зареєстровано, а стандартний bundle застосунку Codex існує, OpenClaw також намагається
зареєструвати вбудований marketplace Codex з
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` перед тим, як
завершитися з помилкою. Якщо налаштування все одно не може зробити MCP-сервер доступним, хід завершується з помилкою
до початку thread.

Після зміни конфігурації Computer Use використайте `/new` або `/reset` у відповідному чаті
перед тестуванням, якщо наявний Codex thread уже розпочався.

Під час керованого запуску stdio на macOS OpenClaw надає перевагу підписаному bundle desktop Codex app
за адресою `/Applications/Codex.app/Contents/Resources/codex`, коли він існує.
Це утримує Computer Use під bundle застосунку, який володіє локальними дозволами
керування робочим столом. Якщо desktop app не встановлено, OpenClaw повертається до
керованого binary Codex, встановленого поруч із Plugin. Якщо встановлений desktop app
ініціалізується з непідтримуваною версією app-server, OpenClaw закриває цей child
і повторює спробу з наступним кандидатом керованого binary замість того, щоб дозволити застарілому
desktop app затіняти plugin-local fallback. Явна конфігурація `appServer.command`
або `OPENCLAW_CODEX_APP_SERVER_BIN` усе ще перевизначає цей керований
вибір.

## Команди

Використовуйте команди `/codex computer-use` з будь-якої chat surface, де доступна
поверхня команд Plugin `codex`. Це команди чату/runtime OpenClaw,
а не CLI-підкоманди `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` працює лише для читання. Вона не додає джерела marketplace, не встановлює плагіни й не
вмикає підтримку плагінів Codex. Якщо жодна конфігурація не вмикає Computer Use,
`status` може повідомити disabled навіть після одноразової команди install.

`install` вмикає підтримку плагінів Codex app-server, за потреби додає налаштоване
джерело marketplace, встановлює або повторно вмикає налаштований Plugin через Codex
app-server, перезавантажує MCP-сервери й перевіряє, що MCP-сервер надає інструменти.

## Варіанти marketplace

OpenClaw використовує той самий API app-server, який надає сам Codex. Поля
marketplace визначають, де Codex має шукати `computer-use`.

| Поле                 | Коли використовувати                                             | Підтримка встановлення                                  |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Без поля marketplace | Ви хочете, щоб Codex app-server використовував уже відомі йому marketplaces. | Так, коли app-server повертає локальний marketplace.     |
| `marketplaceSource`  | У вас є джерело marketplace Codex, яке app-server може додати.  | Так, для явного `/codex computer-use install`.           |
| `marketplacePath`    | Ви вже знаєте локальний шлях до файлу marketplace на host.      | Так, для явного встановлення й auto-install на початку ходу. |
| `marketplaceName`    | Ви хочете вибрати один уже зареєстрований marketplace за назвою. | Так, лише коли вибраний marketplace має локальний шлях.  |

Новим homes Codex може знадобитися короткий час, щоб засіяти офіційні marketplaces.
Під час встановлення OpenClaw опитує `plugin/list` до
`marketplaceDiscoveryTimeoutMs` мілісекунд. Типове значення — 60 секунд.

Якщо кілька відомих marketplaces містять Computer Use, OpenClaw надає перевагу
`openai-bundled`, потім `openai-curated`, потім `local`. Невідомі неоднозначні збіги
fail closed і просять задати `marketplaceName` або `marketplacePath`.

## Вбудований macOS marketplace

Нещодавні збірки desktop Codex містять Computer Use тут:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Коли `computerUse.autoInstall` має значення true і жоден marketplace, що містить
`computer-use`, не зареєстровано, OpenClaw намагається автоматично додати стандартний корінь
вбудованого marketplace:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Ви також можете зареєструвати його явно з shell за допомогою Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Якщо ви використовуєте нестандартний шлях до застосунку Codex, один раз виконайте `/codex computer-use install
--source <marketplace-root>` або задайте `computerUse.marketplacePath` як
локальний шлях до файлу marketplace. Використовуйте `--marketplace-path` лише тоді, коли маєте
шлях до JSON-файлу marketplace, а не корінь вбудованого marketplace.

## Обмеження віддаленого каталогу

Codex app-server може перелічувати й читати записи каталогу, що існують лише віддалено, але наразі не
підтримує віддалений `plugin/install`. Це означає, що `marketplaceName` може
вибрати remote-only marketplace для перевірок status, але встановлення й повторне ввімкнення
все одно потребують локального marketplace через `marketplaceSource` або `marketplacePath`.

Якщо status каже, що Plugin доступний у віддаленому marketplace Codex, але віддалене
встановлення не підтримується, виконайте install із локальним source або path:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Довідник конфігурації

| Поле                            | Типово         | Значення                                                                       |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Вимагати Computer Use. Типово true, коли задано інше поле Computer Use.        |
| `autoInstall`                   | false          | Встановити або повторно ввімкнути з уже виявлених marketplaces на початку ходу. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Скільки часу install чекає на виявлення marketplace Codex app-server.          |
| `marketplaceSource`             | unset          | Рядок source, переданий до Codex app-server `marketplace/add`.                 |
| `marketplacePath`               | unset          | Локальний шлях до файлу marketplace Codex, що містить Plugin.                  |
| `marketplaceName`               | unset          | Назва зареєстрованого marketplace Codex для вибору.                            |
| `pluginName`                    | `computer-use` | Назва Plugin у marketplace Codex.                                              |
| `mcpServerName`                 | `computer-use` | Назва MCP-сервера, який надає встановлений Plugin.                             |

Auto-install на початку ходу навмисно відмовляється від налаштованих значень `marketplaceSource`.
Додавання нового source є явною операцією налаштування, тому один раз використайте
`/codex computer-use install --source <marketplace-source>`, а потім дозвольте
`autoInstall` обробляти майбутні повторні ввімкнення з виявлених локальних marketplaces.
Auto-install на початку ходу може використовувати налаштований `marketplacePath`, бо це
вже локальний шлях на host.

## Що перевіряє OpenClaw

OpenClaw внутрішньо повідомляє стабільну причину налаштування й форматує видимий для користувача
status для чату:

| Причина                      | Значення                                               | Наступний крок                                 |
| ---------------------------- | ------------------------------------------------------ | ---------------------------------------------- |
| `disabled`                   | `computerUse.enabled` обчислено як false.              | Установіть `enabled` або інше поле Computer Use. |
| `marketplace_missing`        | Відповідний маркетплейс недоступний.                   | Налаштуйте джерело, шлях або назву маркетплейсу. |
| `plugin_not_installed`       | Маркетплейс існує, але Plugin не встановлено.          | Запустіть встановлення або ввімкніть `autoInstall`. |
| `plugin_disabled`            | Plugin встановлено, але вимкнено в конфігурації Codex. | Запустіть встановлення, щоб знову ввімкнути його. |
| `remote_install_unsupported` | Вибраний маркетплейс підтримує лише віддалений режим.  | Використайте `marketplaceSource` або `marketplacePath`. |
| `mcp_missing`                | Plugin увімкнено, але MCP-сервер недоступний.          | Перевірте Codex Computer Use і дозволи ОС.      |
| `ready`                      | Plugin і MCP-інструменти доступні.                     | Почніть хід у режимі Codex.                    |
| `check_failed`               | Запит до app-server Codex не вдався під час перевірки стану. | Перевірте підключення до app-server і журнали. |
| `auto_install_blocked`       | Налаштування на початку ходу потребувало б додавання нового джерела. | Спершу запустіть явне встановлення.            |

Вивід чату містить стан Plugin, стан MCP-сервера, маркетплейс, інструменти,
коли вони доступні, і конкретне повідомлення для невдалого кроку налаштування.

## Дозволи macOS

Computer Use є специфічним для macOS. MCP-сервер, яким володіє Codex, може потребувати локальних
дозволів ОС, перш ніж зможе перевіряти програми або керувати ними. Якщо OpenClaw повідомляє, що Computer Use
встановлено, але MCP-сервер недоступний, спершу перевірте налаштування Computer
Use на боці Codex:

- Codex app-server працює на тому самому хості, де має відбуватися керування робочим столом.
- Plugin Computer Use увімкнено в конфігурації Codex.
- MCP-сервер `computer-use` відображається в стані MCP Codex app-server.
- macOS надала потрібні дозволи для програми керування робочим столом.
- Поточний сеанс хоста має доступ до робочого столу, яким керують.

OpenClaw навмисно завершує роботу із закритою відмовою, коли `computerUse.enabled` має значення true. Хід у режимі
Codex не має непомітно продовжуватися без нативних інструментів робочого столу,
яких вимагала конфігурація.

## Усунення несправностей

**Стан показує, що не встановлено.** Запустіть `/codex computer-use install`. Якщо
маркетплейс не виявлено, передайте `--source` або `--marketplace-path`.

**Стан показує, що встановлено, але вимкнено.** Запустіть `/codex computer-use install` ще раз.
Встановлення через Codex app-server знову записує конфігурацію Plugin як увімкнену.

**Стан показує, що віддалене встановлення не підтримується.** Використайте локальне джерело маркетплейсу або
шлях. Записи каталогу лише для віддаленого режиму можна переглядати, але не встановлювати через
поточний API app-server.

**Стан показує, що MCP-сервер недоступний.** Один раз повторно запустіть встановлення, щоб MCP-
сервери перезавантажилися. Якщо він і далі недоступний, виправте програму Codex Computer Use,
стан MCP Codex app-server або дозволи macOS.

**Стан або проба завершується за тайм-аутом на `computer-use.list_apps`.** Plugin і MCP-
сервер присутні, але локальний міст Computer Use не відповів. Закрийте або
перезапустіть Codex Computer Use, за потреби перезапустіть Codex Desktop, а потім повторіть спробу в
новому сеансі OpenClaw. Якщо хост раніше запускав Computer Use через старіший
керований Codex app-server, оновіть встановлений Plugin із маркетплейсу,
вбудованого в настільну програму:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Інструмент Computer Use повідомляє `Native hook relay unavailable`.** Нативний для Codex
хук інструмента не зміг досягти активного реле OpenClaw через локальний міст або
резервний шлях Gateway. Почніть новий сеанс OpenClaw за допомогою `/new` або `/reset`. Якщо це
спрацьовує один раз, а потім знову не вдається під час пізнішого виклику інструмента, `/new` лише очищає
поточну спробу; перезапустіть Codex app-server або OpenClaw Gateway, щоб старі потоки
та реєстрації хуків було скинуто, а потім повторіть спробу в новому сеансі.

**Автовстановлення на початку ходу відхиляє джерело.** Це навмисно. Спершу додайте
джерело явною командою `/codex computer-use install --source <marketplace-source>`,
після чого майбутнє автовстановлення на початку ходу зможе використовувати виявлений локальний
маркетплейс.

## Пов’язане

- [Codex harness](/uk/plugins/codex-harness)
- [Peekaboo bridge](/uk/platforms/mac/peekaboo)
- [iOS app](/uk/platforms/ios)
