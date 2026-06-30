---
read_when:
    - Ви хочете, щоб агенти OpenClaw у режимі Codex використовували Codex Computer Use
    - Ви обираєте між Codex Computer Use, PeekabooBridge і прямим cua-driver MCP
    - Ви обираєте між Codex Computer Use і прямим налаштуванням cua-driver MCP
    - Ви налаштовуєте computerUse для вбудованого Plugin Codex
    - Ви усуваєте проблеми зі статусом або встановленням /codex computer-use
summary: Налаштуйте Codex Computer Use для агентів OpenClaw у режимі Codex
title: Використання комп’ютера в Codex
x-i18n:
    generated_at: "2026-06-30T14:25:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb785e2fda0d89a7e7770df0c2a4b3aa23f97cb1c8515a7d555a8409acfd3b2
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use — це нативний для Codex MCP Plugin для керування локальним робочим столом. OpenClaw
не постачає desktop-застосунок, не виконує дії на робочому столі самостійно й не обходить
дозволи Codex. Вбудований Plugin `codex` лише готує сервер застосунку Codex:
він вмикає підтримку Codex Plugin, знаходить або встановлює налаштований Codex
Computer Use Plugin, перевіряє, що MCP-сервер `computer-use` доступний, а
потім дозволяє Codex володіти нативними викликами MCP-інструментів під час ходів у режимі Codex.

Використовуйте цю сторінку, коли OpenClaw уже використовує нативний harness Codex. Для
налаштування самого середовища виконання див. [harness Codex](/uk/plugins/codex-harness).

## OpenClaw.app і Peekaboo

Інтеграція Peekaboo в OpenClaw.app відокремлена від Codex Computer Use. Застосунок
macOS може розміщувати сокет PeekabooBridge, щоб CLI `peekaboo` міг повторно використовувати
локальні дозволи Accessibility і Screen Recording застосунку для власних
інструментів автоматизації Peekaboo. Цей міст не встановлює й не проксіює Codex Computer Use, а
Codex Computer Use не викликається через сокет PeekabooBridge.

Використовуйте [міст Peekaboo](/uk/platforms/mac/peekaboo), коли хочете, щоб OpenClaw.app був
хостом із урахуванням дозволів для автоматизації Peekaboo CLI. Використовуйте цю сторінку, коли
агент OpenClaw у режимі Codex має мати нативний MCP Plugin `computer-use` Codex
доступним до початку ходу.

## Застосунок iOS

Застосунок iOS відокремлений від Codex Computer Use. Він не встановлює й не проксіює
MCP-сервер Codex `computer-use` і не є бекендом керування робочим столом.
Натомість застосунок iOS підключається як вузол OpenClaw і надає мобільні
можливості через команди вузла, такі як `canvas.*`, `camera.*`, `screen.*`,
`location.*` і `talk.*`.

Використовуйте [iOS](/uk/platforms/ios), коли хочете, щоб агент керував вузлом iPhone через
Gateway. Використовуйте цю сторінку, коли агент у режимі Codex має керувати локальним
робочим столом macOS через нативний Plugin Computer Use Codex.

## Прямий MCP cua-driver

Codex Computer Use — не єдиний спосіб надати керування робочим столом. Якщо ви хочете,
щоб середовища виконання, керовані OpenClaw, викликали драйвер TryCua напряму, використовуйте upstream
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

Цей шлях зберігає поверхню upstream MCP-інструментів без змін, включно зі схемами драйвера
та структурованими MCP-відповідями. Використовуйте його, коли хочете, щоб драйвер CUA
був доступний як звичайний MCP-сервер OpenClaw. Використовуйте налаштування Codex Computer Use на
цій сторінці, коли сервер застосунку Codex має володіти встановленням Plugin, перезавантаженнями MCP
і нативними викликами інструментів усередині ходів у режимі Codex.

Драйвер CUA специфічний для macOS і все ще потребує локальних дозволів macOS,
які запитує його застосунок, наприклад Accessibility і Screen Recording. OpenClaw
не встановлює `cua-driver`, не надає ці дозволи й не обходить модель безпеки upstream
драйвера.

## Швидке налаштування

Задайте `plugins.entries.codex.config.computerUse`, коли ходи в режимі Codex повинні мати
Computer Use доступним до початку потоку. `autoInstall: true` вмикає
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

З цією конфігурацією OpenClaw перевіряє сервер застосунку Codex перед кожним ходом у режимі Codex.
Якщо Computer Use відсутній, але сервер застосунку Codex уже виявив
marketplace, доступний для встановлення, OpenClaw просить сервер застосунку Codex встановити або повторно ввімкнути
Plugin і перезавантажити MCP-сервери. На macOS, коли відповідний marketplace не
зареєстровано, а стандартний пакет застосунку Codex існує, OpenClaw також намагається
зареєструвати вбудований marketplace Codex з
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` перед тим, як
завершитися помилкою. Якщо налаштування все одно не може зробити MCP-сервер доступним, хід завершується помилкою
до початку потоку.

Після зміни конфігурації Computer Use використайте `/new` або `/reset` у відповідному чаті
перед тестуванням, якщо наявний потік Codex уже запущено.

Під час керованого запуску stdio на macOS OpenClaw віддає перевагу підписаному desktop-пакету застосунку Codex
за шляхом `/Applications/Codex.app/Contents/Resources/codex`, коли він існує.
Це тримає Computer Use у межах пакета застосунку, який володіє локальними дозволами
керування робочим столом. Якщо desktop-застосунок не встановлено, OpenClaw повертається до
керованого бінарного файлу Codex, встановленого поряд із Plugin. Якщо встановлений desktop-застосунок
ініціалізується з непідтримуваною версією сервера застосунку, OpenClaw закриває цей дочірній процес
і повторює спробу з наступним кандидатом керованого бінарного файлу, замість того щоб дозволити застарілому
desktop-застосунку затінити локальний fallback Plugin. Явна конфігурація `appServer.command`
або `OPENCLAW_CODEX_APP_SERVER_BIN` усе ще перевизначає цей керований
вибір.

## Команди

Використовуйте команди `/codex computer-use` з будь-якої поверхні чату, де доступна командна поверхня
Plugin `codex`. Це команди чату/середовища виконання OpenClaw,
а не CLI-підкоманди `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` доступна лише для читання. Вона не додає джерела marketplace, не встановлює plugins і не
вмикає підтримку Codex Plugin. Якщо жодна конфігурація не вмикає Computer Use, `status` може
повідомити про вимкнений стан навіть після одноразової команди встановлення.

`install` вмикає підтримку Plugin сервера застосунку Codex, за потреби додає налаштоване
джерело marketplace, встановлює або повторно вмикає налаштований Plugin через сервер
застосунку Codex, перезавантажує MCP-сервери й перевіряє, що MCP-сервер надає інструменти.
Оскільки встановлення змінює довірені ресурси хоста, запускати `install` може лише власник або
клієнт Gateway `operator.admin`. Інші авторизовані відправники можуть
продовжувати використовувати команду `status`, доступну лише для читання, зокрема з перевизначеннями.

## Варіанти marketplace

OpenClaw використовує той самий API сервера застосунку, який надає сам Codex. Поля
marketplace визначають, де Codex має шукати `computer-use`.

| Поле                 | Коли використовувати                                             | Підтримка встановлення                                  |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Без поля marketplace | Ви хочете, щоб сервер застосунку Codex використовував marketplace, які вже знає. | Так, коли сервер застосунку повертає локальний marketplace. |
| `marketplaceSource`  | У вас є джерело marketplace Codex, яке сервер застосунку може додати. | Так, для явного `/codex computer-use install`.          |
| `marketplacePath`    | Ви вже знаєте локальний шлях до файлу marketplace на хості.      | Так, для явного встановлення й автоінсталяції на старті ходу. |
| `marketplaceName`    | Ви хочете вибрати один уже зареєстрований marketplace за назвою. | Так, лише коли вибраний marketplace має локальний шлях.  |

Свіжим домашнім каталогам Codex може знадобитися короткий час для початкового заповнення офіційних marketplace.
Під час встановлення OpenClaw опитує `plugin/list` протягом до
`marketplaceDiscoveryTimeoutMs` мілісекунд. Типове значення — 60 секунд.

Якщо кілька відомих marketplace містять Computer Use, OpenClaw надає перевагу
`openai-bundled`, потім `openai-curated`, потім `local`. Невідомі неоднозначні збіги
завершуються закрито й просять вас задати `marketplaceName` або `marketplacePath`.

## Вбудований marketplace macOS

Останні збірки desktop Codex вбудовують Computer Use тут:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Коли `computerUse.autoInstall` має значення true і жоден marketplace, що містить
`computer-use`, не зареєстровано, OpenClaw намагається автоматично додати стандартний вбудований
корінь marketplace:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Ви також можете зареєструвати його явно з оболонки за допомогою Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Якщо ви використовуєте нестандартний шлях до застосунку Codex, один раз запустіть `/codex computer-use install
--source <marketplace-root>` або задайте `computerUse.marketplacePath` як
локальний шлях до файлу marketplace. Використовуйте `--marketplace-path` лише тоді, коли маєте
шлях до JSON-файлу marketplace, а не корінь вбудованого marketplace.

## Обмеження віддаленого каталогу

Сервер застосунку Codex може перелічувати й читати записи лише віддаленого каталогу, але наразі не
підтримує віддалений `plugin/install`. Це означає, що `marketplaceName` може
вибрати віддалений-only marketplace для перевірок статусу, але встановлення й повторне ввімкнення
все одно потребують локального marketplace через `marketplaceSource` або `marketplacePath`.

Якщо статус каже, що Plugin доступний у віддаленому marketplace Codex, але віддалене
встановлення не підтримується, запустіть встановлення з локальним джерелом або шляхом:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Довідник конфігурації

| Поле                            | Типове значення | Значення                                                                       |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Вимагати Computer Use. Типово true, коли задано інше поле Computer Use.        |
| `autoInstall`                   | false          | Встановити або повторно ввімкнути з уже виявлених marketplace на старті ходу.  |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Як довго встановлення чекає на виявлення marketplace сервером застосунку Codex. |
| `marketplaceSource`             | unset          | Рядок джерела, переданий у `marketplace/add` сервера застосунку Codex.          |
| `marketplacePath`               | unset          | Локальний шлях до файлу marketplace Codex, що містить Plugin.                  |
| `marketplaceName`               | unset          | Назва зареєстрованого marketplace Codex для вибору.                            |
| `pluginName`                    | `computer-use` | Назва Plugin marketplace Codex.                                                |
| `mcpServerName`                 | `computer-use` | Назва MCP-сервера, наданого встановленим Plugin.                               |

Автоінсталяція на старті ходу навмисно відмовляється від налаштованих значень `marketplaceSource`.
Додавання нового джерела — це явна операція налаштування, тому один раз використайте
`/codex computer-use install --source <marketplace-source>`, а потім дозвольте
`autoInstall` обробляти майбутні повторні ввімкнення з виявлених локальних marketplace.
Автоінсталяція на старті ходу може використовувати налаштований `marketplacePath`, тому що це
вже локальний шлях на хості.

## Що перевіряє OpenClaw

OpenClaw внутрішньо повідомляє стабільну причину налаштування й форматує користувацький
статус для чату:

| Причина                      | Значення                                               | Наступний крок                                |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` визначено як false.              | Задайте `enabled` або інше поле Computer Use. |
| `marketplace_missing`        | Відповідний маркетплейс недоступний.                   | Налаштуйте джерело, шлях або назву маркетплейсу. |
| `plugin_not_installed`       | Маркетплейс існує, але Plugin не встановлено.          | Запустіть встановлення або ввімкніть `autoInstall`. |
| `plugin_disabled`            | Plugin встановлено, але вимкнено в конфігурації Codex. | Запустіть встановлення, щоб увімкнути його знову. |
| `remote_install_unsupported` | Вибраний маркетплейс доступний лише віддалено.         | Використайте `marketplaceSource` або `marketplacePath`. |
| `mcp_missing`                | Plugin увімкнено, але сервер MCP недоступний.          | Перевірте Codex Computer Use і дозволи ОС.    |
| `ready`                      | Plugin та інструменти MCP доступні.                    | Почніть хід у режимі Codex.                   |
| `check_failed`               | Запит до app-server Codex не вдався під час перевірки стану. | Перевірте підключення до app-server і журнали. |
| `auto_install_blocked`       | Налаштування на початку ходу потребувало б додавання нового джерела. | Спочатку запустіть явне встановлення.         |

Вивід чату містить стан Plugin, стан сервера MCP, маркетплейс, інструменти,
якщо вони доступні, і конкретне повідомлення для невдалого кроку налаштування.

## Дозволи macOS

Computer Use є специфічним для macOS. Сервер MCP, що належить Codex, може потребувати локальних дозволів ОС,
перш ніж зможе перевіряти або керувати застосунками. Якщо OpenClaw повідомляє, що Computer Use
встановлено, але сервер MCP недоступний, спочатку перевірте налаштування Computer
Use на боці Codex:

- Codex app-server запущено на тому самому хості, де має відбуватися керування робочим столом.
- Plugin Computer Use увімкнено в конфігурації Codex.
- Сервер MCP `computer-use` відображається в стані MCP Codex app-server.
- macOS надала потрібні дозволи для застосунку керування робочим столом.
- Поточний сеанс хоста має доступ до робочого столу, яким керують.

OpenClaw навмисно завершує роботу закрито, коли `computerUse.enabled` має значення true. Хід
у режимі Codex не має непомітно продовжуватися без нативних інструментів робочого столу,
які вимагала конфігурація.

## Усунення несправностей

**Стан повідомляє, що не встановлено.** Запустіть `/codex computer-use install`. Якщо
маркетплейс не виявлено, передайте `--source` або `--marketplace-path`.

**Стан повідомляє, що встановлено, але вимкнено.** Запустіть `/codex computer-use install` ще раз.
Встановлення через Codex app-server записує конфігурацію Plugin назад як увімкнену.

**Стан повідомляє, що віддалене встановлення не підтримується.** Використайте локальне джерело або
шлях маркетплейсу. Записи каталогів, доступні лише віддалено, можна переглядати, але не встановлювати через
поточний API app-server.

**Стан повідомляє, що сервер MCP недоступний.** Один раз повторно запустіть встановлення, щоб сервери MCP
перезавантажилися. Якщо він досі недоступний, виправте застосунок Codex Computer Use,
стан MCP Codex app-server або дозволи macOS.

**Стан або проба очікування завершується тайм-аутом на `computer-use.list_apps`.** Plugin і сервер MCP
наявні, але локальний міст Computer Use не відповів. Закрийте або
перезапустіть Codex Computer Use, за потреби перезапустіть Codex Desktop, а потім повторіть спробу в
новому сеансі OpenClaw. Якщо хост раніше запускав Computer Use через старіший
керований Codex app-server, оновіть встановлений Plugin із маркетплейсу, вбудованого в desktop:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Інструмент Computer Use повідомляє `Native hook relay unavailable`.** Нативний для Codex
гачок інструмента не зміг досягти активного реле OpenClaw через локальний міст або
резервний Gateway. Почніть новий сеанс OpenClaw за допомогою `/new` або `/reset`. Якщо це
спрацює один раз, а потім знову не спрацює під час пізнішого виклику інструмента, `/new` лише очищає
поточну спробу; перезапустіть Codex app-server або OpenClaw Gateway, щоб старі потоки
й реєстрації гачків було скинуто, а потім повторіть спробу в новому сеансі.

**Автовстановлення на початку ходу відхиляє джерело.** Це навмисно. Додайте
джерело явною командою `/codex computer-use install --source <marketplace-source>`
спочатку, тоді майбутнє автовстановлення на початку ходу зможе використовувати виявлений локальний
маркетплейс.

## Пов’язане

- [Codex harness](/uk/plugins/codex-harness)
- [Peekaboo bridge](/uk/platforms/mac/peekaboo)
- [iOS app](/uk/platforms/ios)
