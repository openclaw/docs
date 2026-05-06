---
read_when:
    - Ви хочете, щоб агенти OpenClaw у режимі Codex використовували Codex Computer Use
    - Ви обираєте між Codex Computer Use, PeekabooBridge і прямим cua-driver MCP
    - Ви обираєте між Codex Computer Use та прямим налаштуванням cua-driver MCP
    - Ви налаштовуєте computerUse для вбудованого Plugin Codex
    - Ви усуваєте неполадки зі статусом або встановленням /codex computer-use
summary: Налаштуйте Codex Computer Use для агентів OpenClaw у режимі Codex
title: Використання комп’ютера в Codex
x-i18n:
    generated_at: "2026-05-06T04:53:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d23cd0646336e61c77357f769bc1d7ab47a401bcc484f4d16130b942db9f1f4
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use — це власний для Codex MCP Plugin для локального керування робочим столом. OpenClaw
не постачає desktop app у складі продукту, не виконує desktop actions самостійно та не обходить
дозволи Codex. Вбудований Plugin `codex` лише готує app-server Codex:
він вмикає підтримку Plugin у Codex, знаходить або встановлює налаштований Codex
Computer Use Plugin, перевіряє, що MCP server `computer-use` доступний, а
потім дозволяє Codex володіти нативними викликами MCP tool під час ходів у режимі Codex.

Використовуйте цю сторінку, коли OpenClaw уже використовує нативну обв’язку Codex. Для
налаштування самого середовища виконання див. [обв’язку Codex](/uk/plugins/codex-harness).

## OpenClaw.app і Peekaboo

Інтеграція Peekaboo в OpenClaw.app відокремлена від Codex Computer Use. Застосунок
macOS може розміщувати сокет PeekabooBridge, щоб CLI `peekaboo` міг повторно використовувати
локальні дозволи застосунку на Accessibility і Screen Recording для власних
інструментів автоматизації Peekaboo. Цей bridge не встановлює і не проксіює Codex Computer Use, а
Codex Computer Use не викликається через сокет PeekabooBridge.

Використовуйте [Peekaboo bridge](/uk/platforms/mac/peekaboo), коли потрібно, щоб OpenClaw.app був
хостом для автоматизації Peekaboo CLI з урахуванням дозволів. Використовуйте цю сторінку, коли
агент OpenClaw у режимі Codex має мати нативний MCP Plugin `computer-use` Codex,
доступний до початку ходу.

## Застосунок iOS

Застосунок iOS відокремлений від Codex Computer Use. Він не встановлює і не проксіює
MCP server Codex `computer-use` і не є backend для керування робочим столом.
Натомість застосунок iOS підключається як Node OpenClaw і надає мобільні
можливості через команди Node, як-от `canvas.*`, `camera.*`, `screen.*`,
`location.*` і `talk.*`.

Використовуйте [iOS](/uk/platforms/ios), коли потрібно, щоб агент керував Node iPhone через
Gateway. Використовуйте цю сторінку, коли агент у режимі Codex має керувати локальним
робочим столом macOS через нативний Plugin Computer Use Codex.

## Прямий MCP cua-driver

Codex Computer Use — не єдиний спосіб надати керування робочим столом. Якщо потрібно,
щоб середовища виконання, керовані OpenClaw, викликали driver TryCua напряму, використовуйте upstream
server `cua-driver mcp` через MCP registry OpenClaw замість
специфічного для Codex потоку marketplace.

Після встановлення `cua-driver` або попросіть його надати команду OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

або зареєструйте stdio server самостійно:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Цей шлях зберігає upstream поверхню MCP tool без змін, включно зі схемами driver
і структурованими MCP responses. Використовуйте його, коли потрібно, щоб CUA driver
був доступний як звичайний MCP server OpenClaw. Використовуйте налаштування Codex Computer Use на
цій сторінці, коли app-server Codex має володіти встановленням Plugin, перезавантаженням MCP
і нативними tool calls усередині ходів у режимі Codex.

CUA driver є специфічним для macOS і все одно потребує локальних дозволів macOS,
які запитує його застосунок, зокрема Accessibility і Screen Recording. OpenClaw
не встановлює `cua-driver`, не надає ці дозволи і не обходить модель безпеки
upstream driver.

## Швидке налаштування

Установіть `plugins.entries.codex.config.computerUse`, коли ходи в режимі Codex мають мати
Computer Use доступним до початку потоку:

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
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

З цією конфігурацією OpenClaw перевіряє app-server Codex перед кожним ходом у режимі Codex.
Якщо Computer Use відсутній, але app-server Codex уже знайшов
доступний для встановлення marketplace, OpenClaw просить app-server Codex встановити або повторно ввімкнути
Plugin і перезавантажити MCP servers. На macOS, коли відповідний marketplace не
зареєстровано і стандартний bundle застосунку Codex існує, OpenClaw також намагається
зареєструвати вбудований marketplace Codex із
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, перш ніж
завершити з помилкою. Якщо налаштування все одно не може зробити MCP server доступним, хід завершується
помилкою до початку потоку.

Наявні сеанси зберігають своє середовище виконання і прив’язку потоку Codex. Після зміни
`agentRuntime` або конфігурації Computer Use використайте `/new` або `/reset` у відповідному
чаті перед тестуванням.

## Команди

Використовуйте команди `/codex computer-use` з будь-якої поверхні чату, де доступна
командна поверхня Plugin `codex`. Це команди чату/середовища виконання OpenClaw,
а не підкоманди CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` доступна лише для читання. Вона не додає джерела marketplace, не встановлює plugins і не
вмикає підтримку Plugin у Codex.

`install` вмикає підтримку Plugin у app-server Codex, за потреби додає налаштоване
джерело marketplace, встановлює або повторно вмикає налаштований Plugin через app-server Codex,
перезавантажує MCP servers і перевіряє, що MCP server надає tools.

## Варіанти marketplace

OpenClaw використовує той самий API app-server, який надає сам Codex. Поля
marketplace вибирають, де Codex має знайти `computer-use`.

| Поле                 | Коли використовувати                                             | Підтримка встановлення                                  |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Без поля marketplace | Потрібно, щоб app-server Codex використовував уже відомі йому marketplaces. | Так, коли app-server повертає локальний marketplace.     |
| `marketplaceSource`  | У вас є джерело marketplace Codex, яке app-server може додати.  | Так, для явного `/codex computer-use install`.           |
| `marketplacePath`    | Ви вже знаєте локальний шлях до файлу marketplace на хості.     | Так, для явного встановлення й auto-install на початку ходу. |
| `marketplaceName`    | Потрібно вибрати один уже зареєстрований marketplace за назвою. | Так, лише коли вибраний marketplace має локальний шлях.  |

Новим home Codex може знадобитися короткий час, щоб заповнити офіційні marketplaces.
Під час встановлення OpenClaw опитує `plugin/list` до
`marketplaceDiscoveryTimeoutMs` мілісекунд. Типове значення — 60 секунд.

Якщо кілька відомих marketplaces містять Computer Use, OpenClaw віддає перевагу
`openai-bundled`, потім `openai-curated`, потім `local`. Невідомі неоднозначні збіги
завершуються безпечною відмовою і просять встановити `marketplaceName` або `marketplacePath`.

## Вбудований marketplace macOS

Останні desktop builds Codex вбудовують Computer Use тут:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Коли `computerUse.autoInstall` має значення true і не зареєстровано marketplace, що містить
`computer-use`, OpenClaw намагається автоматично додати стандартний вбудований
корінь marketplace:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Його також можна зареєструвати явно з shell за допомогою Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Якщо ви використовуєте нестандартний шлях до застосунку Codex, установіть `computerUse.marketplacePath` на
локальний шлях до файлу marketplace або один раз виконайте `/codex computer-use install --source
<marketplace-source>`.

## Обмеження віддаленого каталогу

App-server Codex може перелічувати й читати записи remote-only catalog, але наразі не
підтримує віддалений `plugin/install`. Це означає, що `marketplaceName` може
вибрати remote-only marketplace для перевірок status, але встановлення і повторне ввімкнення
все одно потребують локального marketplace через `marketplaceSource` або `marketplacePath`.

Якщо status повідомляє, що Plugin доступний у віддаленому marketplace Codex, але віддалене
встановлення не підтримується, запустіть install із локальним джерелом або шляхом:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Довідник конфігурації

| Поле                            | Типово         | Значення                                                                       |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | виведено       | Вимагати Computer Use. Типово true, коли встановлено інше поле Computer Use.   |
| `autoInstall`                   | false          | Установлювати або повторно вмикати з уже знайдених marketplaces на початку ходу. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Як довго install чекає на виявлення marketplace app-server Codex.              |
| `marketplaceSource`             | не встановлено | Рядок джерела, переданий до `marketplace/add` app-server Codex.                |
| `marketplacePath`               | не встановлено | Локальний шлях до файлу marketplace Codex, що містить Plugin.                  |
| `marketplaceName`               | не встановлено | Назва зареєстрованого marketplace Codex для вибору.                            |
| `pluginName`                    | `computer-use` | Назва Plugin у marketplace Codex.                                              |
| `mcpServerName`                 | `computer-use` | Ім’я MCP server, яке надає встановлений Plugin.                                |

Auto-install на початку ходу навмисно відхиляє налаштовані значення `marketplaceSource`.
Додавання нового джерела — це явна операція налаштування, тому один раз використайте
`/codex computer-use install --source <marketplace-source>`, а потім дозвольте
`autoInstall` обробляти майбутні повторні ввімкнення з виявлених локальних marketplaces.
Auto-install на початку ходу може використовувати налаштований `marketplacePath`, бо це
вже локальний шлях на хості.

## Що перевіряє OpenClaw

OpenClaw внутрішньо повідомляє стабільну причину налаштування і форматує
зручний для користувача status для чату:

| Причина                      | Значення                                               | Наступний крок                                |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` розв’язано у false.              | Установіть `enabled` або інше поле Computer Use. |
| `marketplace_missing`        | Відповідний marketplace був недоступний.               | Налаштуйте джерело, шлях або назву marketplace. |
| `plugin_not_installed`       | Marketplace існує, але Plugin не встановлено.          | Запустіть install або ввімкніть `autoInstall`. |
| `plugin_disabled`            | Plugin встановлено, але вимкнено в конфігурації Codex. | Запустіть install, щоб повторно ввімкнути його. |
| `remote_install_unsupported` | Вибраний marketplace є remote-only.                    | Використайте `marketplaceSource` або `marketplacePath`. |
| `mcp_missing`                | Plugin увімкнено, але MCP server недоступний.          | Перевірте Codex Computer Use і дозволи ОС.     |
| `ready`                      | Plugin і MCP tools доступні.                           | Почніть хід у режимі Codex.                   |
| `check_failed`               | Запит до app-server Codex завершився помилкою під час перевірки status. | Перевірте підключення до app-server і журнали. |
| `auto_install_blocked`       | Налаштування на початку ходу потребувало б додавання нового джерела. | Спершу запустіть явний install.               |

Вивід чату включає стан Plugin, стан MCP server, marketplace, tools
за наявності, а також конкретне повідомлення для невдалого кроку налаштування.

## Дозволи macOS

Computer Use є специфічним для macOS. MCP server, яким володіє Codex, може потребувати локальних дозволів ОС,
перш ніж зможе переглядати або керувати застосунками. Якщо OpenClaw повідомляє, що Computer Use
встановлено, але MCP server недоступний, спершу перевірте налаштування Computer Use
на боці Codex:

- Codex app-server працює на тому самому хості, де має
  відбуватися керування робочим столом.
- Plugin Computer Use увімкнено в конфігурації Codex.
- MCP-сервер `computer-use` відображається у статусі MCP Codex app-server.
- macOS надала потрібні дозволи для застосунку керування робочим столом.
- Поточна сесія хоста має доступ до робочого столу, яким керують.

OpenClaw навмисно завершує роботу закрито, коли `computerUse.enabled` має значення true. Хід
у режимі Codex не має непомітно продовжуватися без нативних інструментів робочого столу,
яких вимагала конфігурація.

## Усунення несправностей

**Статус показує, що не встановлено.** Виконайте `/codex computer-use install`. Якщо
marketplace не виявлено, передайте `--source` або `--marketplace-path`.

**Статус показує, що встановлено, але вимкнено.** Повторно виконайте `/codex computer-use install`.
Інсталяція Codex app-server записує конфігурацію plugin назад як увімкнену.

**Статус показує, що віддалене встановлення не підтримується.** Використайте локальне джерело marketplace або
шлях. Записи каталогу лише для віддаленого доступу можна переглядати, але не встановлювати через
поточний API app-server.

**Статус показує, що MCP-сервер недоступний.** Повторно запустіть інсталяцію один раз, щоб MCP-
сервери перезавантажилися. Якщо він залишається недоступним, виправте застосунок Codex Computer Use,
статус MCP Codex app-server або дозволи macOS.

**Статус або проба завершується за таймаутом на `computer-use.list_apps`.** Plugin і MCP-
сервер присутні, але локальний міст Computer Use не відповів. Закрийте або
перезапустіть Codex Computer Use, за потреби повторно запустіть Codex Desktop, а потім повторіть у
новій сесії OpenClaw.

**Інструмент Computer Use повідомляє `Native hook relay unavailable`.** Нативний для Codex
гачок інструмента не зміг досягти активного ретранслятора OpenClaw через локальний міст або
резервний Gateway. Запустіть нову сесію OpenClaw за допомогою `/new` або `/reset`. Якщо це
повторюється, перезапустіть gateway, щоб старі потоки app-server і реєстрації гачків
було скинуто, а потім повторіть.

**Автовстановлення на початку ходу відхиляє джерело.** Це навмисно. Додайте
джерело явною командою `/codex computer-use install --source <marketplace-source>`
спочатку, після чого майбутнє автовстановлення на початку ходу зможе використовувати виявлений локальний
marketplace.

## Пов’язане

- [Codex harness](/uk/plugins/codex-harness)
- [Міст Peekaboo](/uk/platforms/mac/peekaboo)
- [Застосунок iOS](/uk/platforms/ios)
