---
read_when:
    - Ви хочете, щоб агенти OpenClaw у режимі Codex використовували Codex Computer Use
    - Ви обираєте між Codex Computer Use, PeekabooBridge і прямим cua-driver MCP
    - Ви обираєте між Codex Computer Use і прямим налаштуванням MCP через cua-driver
    - Ви налаштовуєте computerUse для вбудованого Codex Plugin
    - Ви усуваєте несправності статусу або встановлення /codex computer-use
summary: Налаштуйте Codex Computer Use для агентів OpenClaw у режимі Codex
title: Використання комп’ютера в Codex
x-i18n:
    generated_at: "2026-05-03T04:51:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08383e88ca02dccc86c622c3295478e950fdd222ef16947465e0de1dacafa56c
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use — це нативний для Codex MCP-плагін для локального керування робочим столом. OpenClaw
не постачає desktop app, не виконує дії на робочому столі самостійно й не обходить
дозволи Codex. Вбудований Plugin `codex` лише готує Codex app-server:
він вмикає підтримку Plugin у Codex, знаходить або встановлює налаштований Plugin Codex
Computer Use, перевіряє, що MCP-сервер `computer-use` доступний, а
потім дає Codex володіти нативними викликами інструментів MCP під час ходів у режимі Codex.

Використовуйте цю сторінку, коли OpenClaw уже використовує нативний harness Codex. Для
налаштування самого runtime див. [Codex harness](/uk/plugins/codex-harness).

## OpenClaw.app і Peekaboo

Інтеграція Peekaboo в OpenClaw.app окрема від Codex Computer Use. Застосунок
macOS може розміщувати сокет PeekabooBridge, щоб CLI `peekaboo` міг повторно використовувати
локальні дозволи застосунку на Accessibility і Screen Recording для власних
інструментів автоматизації Peekaboo. Цей bridge не встановлює й не проксіює Codex Computer Use, а
Codex Computer Use не викликається через сокет PeekabooBridge.

Використовуйте [Peekaboo bridge](/uk/platforms/mac/peekaboo), коли хочете, щоб OpenClaw.app був
хостом із урахуванням дозволів для автоматизації Peekaboo CLI. Використовуйте цю сторінку, коли
агент OpenClaw у режимі Codex має мати нативний MCP-плагін `computer-use` від Codex
доступним до початку ходу.

## Застосунок iOS

Застосунок iOS окремий від Codex Computer Use. Він не встановлює й не проксіює
MCP-сервер Codex `computer-use` і не є бекендом керування робочим столом.
Натомість застосунок iOS підключається як вузол OpenClaw і надає мобільні
можливості через команди вузла, як-от `canvas.*`, `camera.*`, `screen.*`,
`location.*` і `talk.*`.

Використовуйте [iOS](/uk/platforms/ios), коли хочете, щоб агент керував вузлом iPhone через
Gateway. Використовуйте цю сторінку, коли агент у режимі Codex має керувати локальним
робочим столом macOS через нативний Plugin Computer Use від Codex.

## Прямий MCP cua-driver

Codex Computer Use — не єдиний спосіб надати керування робочим столом. Якщо ви хочете,
щоб runtime під керуванням OpenClaw напряму викликали драйвер TryCua, використовуйте upstream
MCP-сервер `cua-driver mcp` через MCP-реєстр OpenClaw замість
специфічного для Codex потоку marketplace.

Після встановлення `cua-driver` або попросіть його надати команду OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

або зареєструйте stdio-сервер самостійно:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Цей шлях зберігає upstream поверхню інструментів MCP без змін, зокрема схеми драйвера
та структуровані відповіді MCP. Використовуйте його, коли хочете, щоб драйвер CUA
був доступний як звичайний MCP-сервер OpenClaw. Використовуйте налаштування Codex Computer Use на
цій сторінці, коли Codex app-server має володіти встановленням Plugin, перезавантаженням MCP
і нативними викликами інструментів усередині ходів у режимі Codex.

Драйвер CUA є специфічним для macOS і все ще потребує локальних дозволів macOS,
які запитує його застосунок, як-от Accessibility і Screen Recording. OpenClaw
не встановлює `cua-driver`, не надає ці дозволи й не обходить модель безпеки upstream
драйвера.

## Швидке налаштування

Встановіть `plugins.entries.codex.config.computerUse`, коли ходи в режимі Codex повинні мати
Computer Use доступним до запуску thread:

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

З цією конфігурацією OpenClaw перевіряє Codex app-server перед кожним ходом у режимі Codex.
Якщо Computer Use відсутній, але Codex app-server уже виявив
встановлюваний marketplace, OpenClaw просить Codex app-server встановити або повторно ввімкнути
Plugin і перезавантажити MCP-сервери. На macOS, коли відповідний marketplace
не зареєстрований, а стандартний bundle застосунку Codex існує, OpenClaw також намагається
зареєструвати вбудований marketplace Codex із
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, перш ніж
завершити з помилкою. Якщо налаштування все одно не може зробити MCP-сервер доступним, хід завершується з помилкою
до запуску thread.

Наявні сеанси зберігають свій runtime і прив’язку thread Codex. Після зміни
`agentRuntime` або конфігурації Computer Use використайте `/new` або `/reset` у відповідному
чаті перед тестуванням.

## Команди

Використовуйте команди `/codex computer-use` з будь-якої поверхні чату, де доступна командна поверхня Plugin
`codex`. Це команди чату/runtime OpenClaw,
а не підкоманди CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` призначена лише для читання. Вона не додає джерела marketplace, не встановлює Plugin і не
вмикає підтримку Plugin у Codex.

`install` вмикає підтримку Plugin у Codex app-server, за потреби додає налаштоване
джерело marketplace, встановлює або повторно вмикає налаштований Plugin через Codex
app-server, перезавантажує MCP-сервери й перевіряє, що MCP-сервер надає інструменти.

## Варіанти marketplace

OpenClaw використовує той самий API app-server, який надає сам Codex. Поля
marketplace визначають, де Codex має знаходити `computer-use`.

| Поле                 | Використовуйте, коли                                           | Підтримка встановлення                                  |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Немає поля marketplace | Ви хочете, щоб Codex app-server використовував marketplace, які він уже знає. | Так, коли app-server повертає локальний marketplace. |
| `marketplaceSource`  | У вас є джерело marketplace Codex, яке app-server може додати. | Так, для явного `/codex computer-use install`. |
| `marketplacePath`    | Ви вже знаєте локальний шлях до файлу marketplace на хості. | Так, для явного встановлення й автоматичного встановлення на початку ходу. |
| `marketplaceName`    | Ви хочете вибрати один уже зареєстрований marketplace за назвою. | Так, лише коли вибраний marketplace має локальний шлях. |

Новим homes Codex може знадобитися короткий час, щоб засіяти офіційні marketplace.
Під час встановлення OpenClaw опитує `plugin/list` до
`marketplaceDiscoveryTimeoutMs` мілісекунд. Типове значення — 60 секунд.

Якщо кілька відомих marketplace містять Computer Use, OpenClaw надає перевагу
`openai-bundled`, потім `openai-curated`, потім `local`. Невідомі неоднозначні збіги
завершуються безпечною відмовою й просять вас встановити `marketplaceName` або `marketplacePath`.

## Вбудований marketplace macOS

Нещодавні desktop-збірки Codex вбудовують Computer Use тут:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Коли `computerUse.autoInstall` має значення true і жоден marketplace із
`computer-use` не зареєстрований, OpenClaw намагається автоматично додати стандартний вбудований
корінь marketplace:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Ви також можете явно зареєструвати його з shell за допомогою Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Якщо ви використовуєте нестандартний шлях до застосунку Codex, встановіть `computerUse.marketplacePath` на
локальний шлях до файлу marketplace або один раз виконайте `/codex computer-use install --source
<marketplace-source>`.

## Обмеження віддаленого каталогу

Codex app-server може перелічувати й читати записи каталогу лише віддалено, але наразі не
підтримує віддалений `plugin/install`. Це означає, що `marketplaceName` може
вибрати віддалений-only marketplace для перевірок статусу, але встановлення й повторне вмикання
все ще потребують локального marketplace через `marketplaceSource` або `marketplacePath`.

Якщо статус каже, що Plugin доступний у віддаленому marketplace Codex, але віддалене
встановлення не підтримується, запустіть встановлення з локальним джерелом або шляхом:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Довідник конфігурації

| Поле                            | Типово         | Значення                                                                       |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Вимагати Computer Use. Типово true, коли встановлено інше поле Computer Use. |
| `autoInstall`                   | false          | Встановити або повторно ввімкнути з уже виявлених marketplace на початку ходу. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Скільки часу встановлення чекає на виявлення marketplace Codex app-server. |
| `marketplaceSource`             | unset          | Рядок джерела, переданий до `marketplace/add` Codex app-server. |
| `marketplacePath`               | unset          | Локальний шлях до файлу marketplace Codex, що містить Plugin. |
| `marketplaceName`               | unset          | Назва зареєстрованого marketplace Codex для вибору. |
| `pluginName`                    | `computer-use` | Назва Plugin у marketplace Codex. |
| `mcpServerName`                 | `computer-use` | Назва MCP-сервера, наданого встановленим Plugin. |

Автоматичне встановлення на початку ходу навмисно відхиляє налаштовані значення `marketplaceSource`.
Додавання нового джерела — це явна операція налаштування, тож використайте
`/codex computer-use install --source <marketplace-source>` один раз, а потім дозвольте
`autoInstall` обробляти майбутні повторні вмикання з виявлених локальних marketplace.
Автоматичне встановлення на початку ходу може використовувати налаштований `marketplacePath`, бо це
вже локальний шлях на хості.

## Що перевіряє OpenClaw

OpenClaw внутрішньо повідомляє стабільну причину налаштування й форматує видимий для користувача
статус для чату:

| Причина                      | Значення                                               | Наступний крок                                |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` обчислено як false.              | Встановіть `enabled` або інше поле Computer Use. |
| `marketplace_missing`        | Відповідний marketplace був недоступний.               | Налаштуйте джерело, шлях або назву marketplace. |
| `plugin_not_installed`       | Marketplace існує, але Plugin не встановлений.         | Запустіть install або ввімкніть `autoInstall`. |
| `plugin_disabled`            | Plugin встановлений, але вимкнений у конфігурації Codex. | Запустіть install, щоб повторно ввімкнути його. |
| `remote_install_unsupported` | Вибраний marketplace є лише віддаленим.                | Використайте `marketplaceSource` або `marketplacePath`. |
| `mcp_missing`                | Plugin увімкнений, але MCP-сервер недоступний.         | Перевірте Codex Computer Use і дозволи ОС. |
| `ready`                      | Plugin та MCP-інструменти доступні.                    | Запустіть хід у режимі Codex. |
| `check_failed`               | Запит Codex app-server не вдався під час перевірки статусу. | Перевірте підключення до app-server і журнали. |
| `auto_install_blocked`       | Налаштуванню на початку ходу потрібно було б додати нове джерело. | Спочатку запустіть явне встановлення. |

Вивід чату містить стан Plugin, стан MCP-сервера, marketplace, інструменти,
коли вони доступні, і конкретне повідомлення для невдалого кроку налаштування.

## Дозволи macOS

Computer Use є специфічним для macOS. MCP-сервер під керуванням Codex може потребувати локальних дозволів ОС,
перш ніж зможе інспектувати застосунки або керувати ними. Якщо OpenClaw каже, що Computer Use
встановлено, але MCP-сервер недоступний, спершу перевірте налаштування Computer
Use на боці Codex:

- app-server Codex працює на тому самому хості, де має
  відбуватися керування робочим столом.
- Plugin Computer Use увімкнено в конфігурації Codex.
- MCP-сервер `computer-use` відображається у статусі MCP app-server Codex.
- macOS надала потрібні дозволи для застосунку керування робочим столом.
- Поточний сеанс хоста має доступ до робочого столу, яким керують.

OpenClaw навмисно завершує роботу із закритим доступом, коли `computerUse.enabled` має значення true. Хід у режимі Codex не має непомітно продовжуватися без нативних інструментів робочого столу, яких вимагала конфігурація.

## Усунення неполадок

**Статус показує, що не встановлено.** Запустіть `/codex computer-use install`. Якщо
marketplace не виявлено, передайте `--source` або `--marketplace-path`.

**Статус показує, що встановлено, але вимкнено.** Знову запустіть `/codex computer-use install`.
Встановлення app-server Codex записує конфігурацію Plugin назад як увімкнену.

**Статус показує, що віддалене встановлення не підтримується.** Використайте локальне джерело або
шлях marketplace. Записи каталогу, доступні лише віддалено, можна переглядати, але не встановлювати через
поточний API app-server.

**Статус показує, що MCP-сервер недоступний.** Повторно запустіть встановлення один раз, щоб
MCP-сервери перезавантажилися. Якщо він і далі недоступний, виправте застосунок Codex Computer Use,
статус MCP app-server Codex або дозволи macOS.

**Статус або проба завершується за тайм-аутом на `computer-use.list_apps`.** Plugin і MCP-сервер
наявні, але локальний міст Computer Use не відповів. Закрийте або перезапустіть
Codex Computer Use, за потреби перезапустіть Codex Desktop, а потім повторіть спробу в
новому сеансі OpenClaw.

**Інструмент Computer Use показує `Native hook relay unavailable`.** Нативний для Codex
хук інструмента не зміг дістатися активного ретранслятора OpenClaw через локальний міст або
резервний Gateway. Запустіть новий сеанс OpenClaw за допомогою `/new` або `/reset`. Якщо це
повторюється, перезапустіть gateway, щоб старі потоки app-server і реєстрації хуків
було відкинуто, а потім повторіть спробу.

**Автовстановлення на початку ходу відхиляє джерело.** Це навмисно. Спочатку додайте
джерело явною командою `/codex computer-use install --source <marketplace-source>`,
а потім майбутнє автовстановлення на початку ходу зможе використовувати виявлений локальний
marketplace.
