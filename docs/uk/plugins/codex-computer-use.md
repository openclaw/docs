---
read_when:
    - Ви хочете, щоб агенти OpenClaw у режимі Codex використовували Codex Computer Use
    - Ви обираєте між Codex Computer Use, PeekabooBridge і прямим cua-driver MCP
    - Ви обираєте між Codex Computer Use і прямим налаштуванням cua-driver MCP
    - Ви налаштовуєте computerUse для вбудованого Codex Plugin
    - Ви усуваєте проблеми зі станом або встановленням /codex computer-use
summary: Налаштуйте Codex Computer Use для агентів OpenClaw у режимі Codex
title: Використання комп’ютера в Codex
x-i18n:
    generated_at: "2026-04-29T21:01:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e3551b9005cdc8084d159c107f9b5039a4b4624847b8cc6e5bcb620510fd54f
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use — це нативний MCP-плагін Codex для керування локальним робочим столом. OpenClaw
не постачає настільний застосунок, не виконує дії на робочому столі самостійно та не обходить
дозволи Codex. Вбудований плагін `codex` лише готує сервер застосунку Codex:
він вмикає підтримку плагінів Codex, знаходить або встановлює налаштований плагін Codex
Computer Use, перевіряє, що MCP-сервер `computer-use` доступний, а потім
дозволяє Codex керувати нативними викликами MCP-інструментів під час ходів у режимі Codex.

Використовуйте цю сторінку, коли OpenClaw вже використовує нативний середовищний механізм Codex. Для
налаштування самого середовища виконання див. [середовище Codex](/uk/plugins/codex-harness).

## OpenClaw.app і Peekaboo

Інтеграція Peekaboo в OpenClaw.app відокремлена від Codex Computer Use. Застосунок
macOS може розміщувати сокет PeekabooBridge, щоб CLI `peekaboo` міг повторно використовувати
локальні дозволи застосунку на Accessibility і Screen Recording для власних
інструментів автоматизації Peekaboo. Цей міст не встановлює та не проксіює Codex Computer Use, а
Codex Computer Use не звертається через сокет PeekabooBridge.

Використовуйте [міст Peekaboo](/uk/platforms/mac/peekaboo), коли потрібно, щоб OpenClaw.app був
хостом із урахуванням дозволів для автоматизації Peekaboo CLI. Використовуйте цю сторінку, коли
агент OpenClaw у режимі Codex повинен мати нативний MCP-плагін `computer-use` Codex
доступним до початку ходу.

## Застосунок iOS

Застосунок iOS відокремлений від Codex Computer Use. Він не встановлює й не проксіює
MCP-сервер Codex `computer-use` і не є бекендом керування робочим столом.
Натомість застосунок iOS підключається як вузол OpenClaw і надає мобільні
можливості через команди вузла, як-от `canvas.*`, `camera.*`, `screen.*`,
`location.*` і `talk.*`.

Використовуйте [iOS](/uk/platforms/ios), коли потрібно, щоб агент керував вузлом iPhone через
Gateway. Використовуйте цю сторінку, коли агент у режимі Codex повинен керувати локальним
робочим столом macOS через нативний плагін Computer Use Codex.

## Прямий MCP cua-driver

Codex Computer Use — не єдиний спосіб надати керування робочим столом. Якщо потрібно,
щоб середовища виконання під керуванням OpenClaw викликали драйвер TryCua напряму, використовуйте upstream
сервер `cua-driver mcp` через MCP-реєстр OpenClaw замість
специфічного для Codex потоку marketplace.

Після встановлення `cua-driver` або попросіть його надати команду OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

або зареєструйте stdio-сервер самостійно:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Цей шлях зберігає поверхню upstream MCP-інструментів без змін, зокрема схеми драйвера
та структуровані MCP-відповіді. Використовуйте його, коли потрібно, щоб драйвер CUA
був доступний як звичайний MCP-сервер OpenClaw. Використовуйте налаштування Codex Computer Use на
цій сторінці, коли сервер застосунку Codex має керувати встановленням плагінів, перезавантаженнями MCP
і нативними викликами інструментів усередині ходів у режимі Codex.

Драйвер CUA специфічний для macOS і все ще потребує локальних дозволів macOS,
які запитує його застосунок, як-от Accessibility і Screen Recording. OpenClaw
не встановлює `cua-driver`, не надає ці дозволи й не обходить модель безпеки
upstream драйвера.

## Швидке налаштування

Задайте `plugins.entries.codex.config.computerUse`, коли ходи в режимі Codex повинні мати
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
        fallback: "none",
      },
    },
  },
}
```

З цією конфігурацією OpenClaw перевіряє сервер застосунку Codex перед кожним ходом у режимі Codex.
Якщо Computer Use відсутній, але сервер застосунку Codex уже виявив
marketplace, з якого можна встановити плагін, OpenClaw просить сервер застосунку Codex встановити або повторно ввімкнути
плагін і перезавантажити MCP-сервери. На macOS, коли відповідний marketplace не
зареєстрований, а стандартний пакет застосунку Codex існує, OpenClaw також намагається
зареєструвати вбудований marketplace Codex із
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` перед тим, як
завершитися помилкою. Якщо налаштування все одно не може зробити MCP-сервер доступним, хід завершується помилкою
до початку потоку.

Наявні сеанси зберігають своє середовище виконання та прив’язку до потоку Codex. Після зміни
`agentRuntime` або конфігурації Computer Use використайте `/new` або `/reset` у відповідному
чаті перед тестуванням.

## Команди

Використовуйте команди `/codex computer-use` з будь-якої поверхні чату, де доступна командна поверхня
плагіна `codex`. Це команди чату/середовища виконання OpenClaw,
а не підкоманди CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` доступна лише для читання. Вона не додає джерела marketplace, не встановлює плагіни та не
вмикає підтримку плагінів Codex.

`install` вмикає підтримку плагінів сервера застосунку Codex, за потреби додає налаштоване
джерело marketplace, встановлює або повторно вмикає налаштований плагін через сервер
застосунку Codex, перезавантажує MCP-сервери та перевіряє, що MCP-сервер надає інструменти.

## Вибір marketplace

OpenClaw використовує той самий API сервера застосунку, який надає сам Codex.
Поля marketplace визначають, де Codex має шукати `computer-use`.

| Поле                 | Коли використовувати                                             | Підтримка встановлення                                  |
| -------------------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| Немає поля marketplace | Потрібно, щоб сервер застосунку Codex використовував marketplace, які йому вже відомі. | Так, коли сервер застосунку повертає локальний marketplace. |
| `marketplaceSource`  | У вас є джерело marketplace Codex, яке сервер застосунку може додати. | Так, для явного `/codex computer-use install`.          |
| `marketplacePath`    | Ви вже знаєте локальний шлях до файла marketplace на хості.      | Так, для явного встановлення та автовстановлення на початку ходу. |
| `marketplaceName`    | Потрібно вибрати один уже зареєстрований marketplace за назвою.  | Так, лише коли вибраний marketplace має локальний шлях. |

Новим домівкам Codex може знадобитися короткий час, щоб заповнити офіційні marketplace.
Під час встановлення OpenClaw опитує `plugin/list` до
`marketplaceDiscoveryTimeoutMs` мілісекунд. Типове значення — 60 секунд.

Якщо кілька відомих marketplace містять Computer Use, OpenClaw надає перевагу
`openai-bundled`, потім `openai-curated`, потім `local`. Невідомі неоднозначні збіги
завершуються безпечною відмовою та просять задати `marketplaceName` або `marketplacePath`.

## Вбудований marketplace macOS

Останні настільні збірки Codex містять Computer Use тут:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Коли `computerUse.autoInstall` має значення true і не зареєстровано marketplace, що містить
`computer-use`, OpenClaw намагається автоматично додати стандартний корінь вбудованого
marketplace:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Його також можна явно зареєструвати з оболонки за допомогою Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Якщо ви використовуєте нестандартний шлях до застосунку Codex, задайте `computerUse.marketplacePath` як
локальний шлях до файла marketplace або один раз виконайте `/codex computer-use install --source
<marketplace-source>`.

## Обмеження віддаленого каталогу

Сервер застосунку Codex може перелічувати та читати записи каталогу, доступні лише віддалено, але наразі не
підтримує віддалений `plugin/install`. Це означає, що `marketplaceName` може
вибрати marketplace, доступний лише віддалено, для перевірок статусу, але для встановлення та повторного ввімкнення
все ще потрібен локальний marketplace через `marketplaceSource` або `marketplacePath`.

Якщо статус повідомляє, що плагін доступний у віддаленому marketplace Codex, але віддалене
встановлення не підтримується, запустіть встановлення з локальним джерелом або шляхом:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Довідник конфігурації

| Поле                            | Типово         | Значення                                                                       |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Вимагати Computer Use. Типово true, коли задано інше поле Computer Use.        |
| `autoInstall`                   | false          | Встановлювати або повторно вмикати з уже виявлених marketplace на початку ходу. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Як довго встановлення очікує на виявлення marketplace сервером застосунку Codex. |
| `marketplaceSource`             | unset          | Рядок джерела, переданий до `marketplace/add` сервера застосунку Codex.        |
| `marketplacePath`               | unset          | Локальний шлях до файла marketplace Codex, що містить плагін.                  |
| `marketplaceName`               | unset          | Назва зареєстрованого marketplace Codex для вибору.                            |
| `pluginName`                    | `computer-use` | Назва плагіна marketplace Codex.                                               |
| `mcpServerName`                 | `computer-use` | Назва MCP-сервера, наданого встановленим плагіном.                             |

Автовстановлення на початку ходу навмисно відхиляє налаштовані значення `marketplaceSource`.
Додавання нового джерела — це явна операція налаштування, тому один раз використайте
`/codex computer-use install --source <marketplace-source>`, а потім дозвольте
`autoInstall` обробляти майбутні повторні ввімкнення з виявлених локальних marketplace.
Автовстановлення на початку ходу може використовувати налаштований `marketplacePath`, оскільки це
вже локальний шлях на хості.

## Що перевіряє OpenClaw

OpenClaw внутрішньо повідомляє стабільну причину налаштування та форматує видимий для користувача
статус для чату:

| Причина                      | Значення                                             | Наступний крок                                |
| ---------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` розв’язано в false.            | Задайте `enabled` або інше поле Computer Use. |
| `marketplace_missing`        | Відповідний marketplace був недоступний.             | Налаштуйте джерело, шлях або назву marketplace. |
| `plugin_not_installed`       | Marketplace існує, але плагін не встановлено.        | Запустіть встановлення або ввімкніть `autoInstall`. |
| `plugin_disabled`            | Плагін встановлено, але вимкнено в конфігурації Codex. | Запустіть встановлення, щоб повторно його ввімкнути. |
| `remote_install_unsupported` | Вибраний marketplace доступний лише віддалено.       | Використайте `marketplaceSource` або `marketplacePath`. |
| `mcp_missing`                | Плагін увімкнено, але MCP-сервер недоступний.        | Перевірте Codex Computer Use і дозволи ОС.    |
| `ready`                      | Плагін і MCP-інструменти доступні.                   | Почніть хід у режимі Codex.                   |
| `check_failed`               | Запит до сервера застосунку Codex не вдався під час перевірки статусу. | Перевірте підключення до сервера застосунку та журнали. |
| `auto_install_blocked`       | Налаштування на початку ходу потребувало б додавання нового джерела. | Спочатку запустіть явне встановлення.         |

Вивід чату містить стан плагіна, стан MCP-сервера, marketplace, інструменти
за наявності та конкретне повідомлення для невдалого кроку налаштування.

## Дозволи macOS

Computer Use специфічний для macOS. MCP-сервер під керуванням Codex може потребувати локальних дозволів ОС,
перш ніж зможе перевіряти або керувати застосунками. Якщо OpenClaw повідомляє, що Computer Use
встановлено, але MCP-сервер недоступний, спершу перевірте налаштування Computer Use
на боці Codex:

- Codex app-server працює на тому самому хості, де має відбуватися керування робочим столом.
- Plugin Computer Use увімкнено в конфігурації Codex.
- MCP-сервер `computer-use` відображається в статусі MCP Codex app-server.
- macOS надала потрібні дозволи для застосунку керування робочим столом.
- Поточний сеанс хоста має доступ до робочого столу, яким керують.

OpenClaw навмисно завершує роботу в закритому режимі, коли `computerUse.enabled` має значення true. Хід у режимі Codex не має непомітно продовжуватися без нативних інструментів робочого столу, які вимагає конфігурація.

## Усунення несправностей

**Статус повідомляє, що не встановлено.** Запустіть `/codex computer-use install`. Якщо marketplace не виявлено, передайте `--source` або `--marketplace-path`.

**Статус повідомляє, що встановлено, але вимкнено.** Знову запустіть `/codex computer-use install`. Встановлення Codex app-server записує конфігурацію Plugin назад як увімкнену.

**Статус повідомляє, що віддалене встановлення не підтримується.** Використайте локальне джерело або шлях marketplace. Записи каталогу, доступні лише віддалено, можна переглядати, але їх не можна встановити через поточний API app-server.

**Статус повідомляє, що MCP-сервер недоступний.** Повторно запустіть встановлення один раз, щоб MCP-сервери перезавантажилися. Якщо він і далі недоступний, виправте застосунок Codex Computer Use, статус MCP Codex app-server або дозволи macOS.

**Статус або проба завершується за таймаутом на `computer-use.list_apps`.** Plugin і MCP-сервер наявні, але локальний міст Computer Use не відповів. Закрийте або перезапустіть Codex Computer Use, за потреби перезапустіть Codex Desktop, а потім повторіть спробу в новому сеансі OpenClaw.

**Інструмент Computer Use повідомляє `Native hook relay unavailable`.** Нативний для Codex хук інструмента не зміг досягти активного реле OpenClaw через локальний міст або резервний Gateway. Запустіть новий сеанс OpenClaw за допомогою `/new` або `/reset`. Якщо це повторюється, перезапустіть gateway, щоб старі потоки app-server і реєстрації хуків було скинуто, а потім повторіть спробу.

**Автовстановлення на початку ходу відхиляє джерело.** Це навмисно. Спочатку додайте джерело явно за допомогою `/codex computer-use install --source <marketplace-source>`, після чого майбутнє автовстановлення на початку ходу зможе використовувати виявлений локальний marketplace.
