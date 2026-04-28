---
read_when:
    - Ви хочете, щоб агенти OpenClaw у режимі Codex використовували Codex Computer Use
    - Ви обираєте між Codex Computer Use, PeekabooBridge і прямим cua-driver MCP
    - Ви обираєте між Codex Computer Use і прямим налаштуванням cua-driver MCP
    - Ви налаштовуєте `computerUse` для вбудованого Plugin Codex
    - Ви усуваєте проблеми зі статусом або встановленням `/codex computer-use`
summary: Налаштуйте Codex Computer Use для агентів OpenClaw у режимі Codex
title: Codex Computer Use
x-i18n:
    generated_at: "2026-04-28T00:34:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93fe881b384f746137c8ded83d8736ec7d71ad4203aaa64d6b53ee6ef067022a
    source_path: plugins/codex-computer-use.md
    workflow: 15
---

Computer Use — це нативний для Codex MCP Plugin для локального керування робочим столом. OpenClaw
не постачає застосунок для робочого столу, не виконує дії на робочому столі самостійно й не обходить
дозволи Codex. Вбудований Plugin `codex` лише готує app-server Codex:
він вмикає підтримку Plugin Codex, знаходить або встановлює налаштований Plugin Codex
Computer Use, перевіряє, що MCP-сервер `computer-use` доступний, а
потім дозволяє Codex керувати нативними викликами інструментів MCP під час ходів у режимі Codex.

Використовуйте цю сторінку, коли OpenClaw уже використовує нативний harness Codex. Для
налаштування самого середовища виконання див. [harness Codex](/uk/plugins/codex-harness).

## OpenClaw.app і Peekaboo

Інтеграція Peekaboo в OpenClaw.app є окремою від Codex Computer Use. Застосунок
macOS може розміщувати сокет PeekabooBridge, щоб CLI `peekaboo` міг повторно
використовувати локальні дозволи Accessibility і Screen Recording застосунку для
власних інструментів автоматизації Peekaboo. Цей міст не встановлює й не проксіює Codex Computer Use, а
Codex Computer Use не викликає інструменти через сокет PeekabooBridge.

Використовуйте [міст Peekaboo](/uk/platforms/mac/peekaboo), коли хочете, щоб OpenClaw.app був
хостом із урахуванням дозволів для автоматизації через CLI Peekaboo. Використовуйте цю сторінку, коли агент OpenClaw
у режимі Codex повинен мати доступний нативний MCP Plugin `computer-use` Codex
до початку ходу.

## Прямий cua-driver MCP

Codex Computer Use — не єдиний спосіб надати керування робочим столом. Якщо ви хочете, щоб
середовища виконання під керуванням OpenClaw викликали драйвер TryCua безпосередньо, використовуйте
висхідний сервер `cua-driver mcp` через реєстр MCP OpenClaw замість
специфічного для Codex потоку marketplace.

Після встановлення `cua-driver` або попросіть його надати команду для OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

або зареєструйте stdio-сервер самостійно:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Цей шлях зберігає поверхню інструментів висхідного MCP без змін, включно зі схемами
драйвера та структурованими відповідями MCP. Використовуйте його, коли хочете, щоб драйвер CUA
був доступний як звичайний MCP-сервер OpenClaw. Використовуйте налаштування Codex Computer Use на
цій сторінці, коли app-server Codex повинен керувати встановленням Plugin, перезавантаженнями MCP
і нативними викликами інструментів у межах ходів у режимі Codex.

Драйвер CUA є специфічним для macOS і все одно потребує локальних дозволів macOS,
які запитує його застосунок, наприклад Accessibility і Screen Recording. OpenClaw
не встановлює `cua-driver`, не надає ці дозволи й не обходить модель безпеки
висхідного драйвера.

## Швидке налаштування

Встановіть `plugins.entries.codex.config.computerUse`, якщо ходи в режимі Codex повинні мати
доступний Computer Use до початку треду:

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

Із цією конфігурацією OpenClaw перевіряє app-server Codex перед кожним ходом у режимі Codex.
Якщо Computer Use відсутній, але app-server Codex уже виявив
marketplace, доступний для встановлення, OpenClaw просить app-server Codex встановити або знову ввімкнути
Plugin і перезавантажити MCP-сервери. На macOS, коли не зареєстровано відповідного marketplace
і існує стандартний bundle застосунку Codex, OpenClaw також намагається
зареєструвати вбудований marketplace Codex із
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, перш ніж
завершити з помилкою. Якщо після налаштування MCP-сервер усе ще не стає доступним,
хід завершується помилкою до початку треду.

Наявні сесії зберігають своє середовище виконання та прив’язку до треду Codex. Після зміни
`agentRuntime` або конфігурації Computer Use використайте `/new` або `/reset` у
відповідному чаті перед тестуванням.

## Команди

Використовуйте команди `/codex computer-use` з будь-якої поверхні чату, де доступна
поверхня команд Plugin `codex`. Це команди чату/середовища виконання OpenClaw, а не
підкоманди CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` — лише для читання. Він не додає джерела marketplace, не встановлює Plugin
і не вмикає підтримку Plugin Codex.

`install` вмикає підтримку Plugin в app-server Codex, за потреби додає налаштоване
джерело marketplace, встановлює або знову вмикає налаштований Plugin через app-server Codex,
перезавантажує MCP-сервери й перевіряє, що MCP-сервер надає інструменти.

## Варіанти marketplace

OpenClaw використовує той самий API app-server, який надає сам Codex. Поля
marketplace визначають, де Codex повинен шукати `computer-use`.

| Field                | Use when                                                        | Install support                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Без поля marketplace | Ви хочете, щоб app-server Codex використовував marketplace, які він уже знає. | Так, коли app-server повертає локальний marketplace.     |
| `marketplaceSource`  | У вас є джерело marketplace Codex, яке app-server може додати.  | Так, для явного `/codex computer-use install`.           |
| `marketplacePath`    | Ви вже знаєте шлях до локального файла marketplace на хості.    | Так, для явного встановлення й autoInstall на старті ходу. |
| `marketplaceName`    | Ви хочете вибрати вже зареєстрований marketplace за назвою.     | Так, лише коли вибраний marketplace має локальний шлях.  |

Новим home-каталогам Codex може знадобитися трохи часу, щоб заповнити офіційні
marketplace. Під час встановлення OpenClaw опитує `plugin/list` протягом
`marketplaceDiscoveryTimeoutMs` мілісекунд. Типове значення — 60 секунд.

Якщо кілька відомих marketplace містять Computer Use, OpenClaw надає перевагу
`openai-bundled`, потім `openai-curated`, потім `local`. Невідомі неоднозначні збіги
завершуються в закритому стані й пропонують установити `marketplaceName` або `marketplacePath`.

## Вбудований marketplace macOS

У свіжих збірках Codex для робочого столу Computer Use постачається тут:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Коли `computerUse.autoInstall` має значення true і не зареєстровано жодного marketplace, що містить
`computer-use`, OpenClaw намагається автоматично додати стандартний кореневий
вбудований marketplace:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Ви також можете зареєструвати його явно з оболонки разом із Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Якщо ви використовуєте нестандартний шлях до застосунку Codex, установіть `computerUse.marketplacePath` на
шлях до локального файла marketplace або один раз виконайте `/codex computer-use install --source
<marketplace-source>`.

## Обмеження віддаленого каталогу

app-server Codex може перелічувати та читати записи каталогу, доступні лише віддалено, але
наразі не підтримує віддалений `plugin/install`. Це означає, що `marketplaceName` може
вибрати marketplace, доступний лише віддалено, для перевірок статусу, але встановлення й повторне ввімкнення
усе ще потребують локального marketplace через `marketplaceSource` або `marketplacePath`.

Якщо статус повідомляє, що Plugin доступний у віддаленому marketplace Codex, але віддалене
встановлення не підтримується, виконайте встановлення з локальним джерелом або шляхом:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Довідник конфігурації

| Field                           | Default        | Meaning                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Вимагати Computer Use. Типово дорівнює true, коли встановлено інше поле Computer Use. |
| `autoInstall`                   | false          | Встановити або знову ввімкнути з уже виявлених marketplace на старті ходу.     |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Скільки часу встановлення чекає на виявлення marketplace app-server Codex.     |
| `marketplaceSource`             | unset          | Рядок джерела, переданий у `marketplace/add` app-server Codex.                 |
| `marketplacePath`               | unset          | Шлях до локального файла marketplace Codex, що містить Plugin.                 |
| `marketplaceName`               | unset          | Назва зареєстрованого marketplace Codex для вибору.                            |
| `pluginName`                    | `computer-use` | Назва Plugin marketplace Codex.                                                |
| `mcpServerName`                 | `computer-use` | Назва MCP-сервера, яку надає встановлений Plugin.                              |

AutoInstall на старті ходу навмисно відхиляє налаштовані значення
`marketplaceSource`. Додавання нового джерела — це явна операція налаштування, тож один раз використайте
`/codex computer-use install --source <marketplace-source>`, а потім дозвольте
`autoInstall` виконувати майбутні повторні ввімкнення з виявлених локальних marketplace.
AutoInstall на старті ходу може використовувати налаштований `marketplacePath`, оскільки це
вже локальний шлях на хості.

## Що перевіряє OpenClaw

OpenClaw внутрішньо повідомляє стабільну причину стану налаштування й форматує
статус, видимий користувачу, для чату:

| Reason                       | Meaning                                                | Next step                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` визначено як false.              | Установіть `enabled` або інше поле Computer Use. |
| `marketplace_missing`        | Не було доступно відповідного marketplace.             | Налаштуйте source, path або назву marketplace. |
| `plugin_not_installed`       | Marketplace існує, але Plugin не встановлено.          | Виконайте install або ввімкніть `autoInstall`. |
| `plugin_disabled`            | Plugin встановлено, але вимкнено в конфігурації Codex. | Виконайте install, щоб знову ввімкнути його.  |
| `remote_install_unsupported` | Вибраний marketplace доступний лише віддалено.         | Використайте `marketplaceSource` або `marketplacePath`. |
| `mcp_missing`                | Plugin увімкнено, але MCP-сервер недоступний.          | Перевірте Codex Computer Use і дозволи ОС.    |
| `ready`                      | Plugin та інструменти MCP доступні.                    | Почніть хід у режимі Codex.                   |
| `check_failed`               | Запит app-server Codex завершився помилкою під час перевірки статусу. | Перевірте з’єднання з app-server і журнали.   |
| `auto_install_blocked`       | Налаштування на старті ходу потребувало б додавання нового джерела. | Спочатку виконайте явне install.              |

Вивід у чаті містить стан Plugin, стан MCP-сервера, marketplace, інструменти
за наявності та конкретне повідомлення для кроку налаштування, який завершився помилкою.

## Дозволи macOS

Computer Use є специфічним для macOS. MCP-сервер, яким керує Codex, може потребувати локальних
дозволів ОС, перш ніж зможе перевіряти або керувати застосунками. Якщо OpenClaw повідомляє, що Computer Use
встановлено, але MCP-сервер недоступний, спочатку перевірте налаштування
Computer Use на боці Codex:

- app-server Codex запущено на тому самому хості, де має відбуватися
  керування робочим столом.
- Plugin Computer Use увімкнено в конфігурації Codex.
- MCP-сервер `computer-use` відображається у статусі MCP app-server Codex.
- macOS надала потрібні дозволи для застосунку керування робочим столом.
- Поточна сесія хоста має доступ до робочого столу, яким виконується керування.

OpenClaw навмисно завершує роботу в закритому стані, коли `computerUse.enabled` має значення true. Хід
у режимі Codex не повинен непомітно продовжуватися без нативних інструментів робочого столу,
які вимагала конфігурація.

## Усунення проблем

**Статус повідомляє, що не встановлено.** Виконайте `/codex computer-use install`. Якщо
marketplace не виявлено, передайте `--source` або `--marketplace-path`.

**Статус повідомляє, що встановлено, але вимкнено.** Знову виконайте `/codex computer-use install`.
Встановлення через app-server Codex знову записує конфігурацію Plugin у стан enabled.

**Статус повідомляє, що віддалене встановлення не підтримується.** Використайте локальне джерело marketplace або
шлях. Записи каталогу, доступні лише віддалено, можна переглядати, але не можна встановлювати через
поточний API app-server.

**Статус повідомляє, що MCP-сервер недоступний.** Один раз повторно виконайте встановлення, щоб
MCP-сервери перезавантажилися. Якщо він усе ще недоступний, виправте застосунок Codex Computer Use,
статус MCP app-server Codex або дозволи macOS.

**Статус або перевірка зависає за тайм-аутом на `computer-use.list_apps`.** Plugin і MCP-
сервер присутні, але локальний міст Computer Use не відповів. Завершіть роботу або перезапустіть Codex Computer Use,
за потреби перезапустіть Codex Desktop, а потім повторіть спробу в новій сесії OpenClaw.

**Інструмент Computer Use повідомляє `Native hook relay unavailable`.** Нативний для Codex
hook інструмента дістався OpenClaw із застарілою або відсутньою реєстрацією relay. Почніть
нову сесію OpenClaw за допомогою `/new` або `/reset`. Якщо це продовжує траплятися, перезапустіть
gateway, щоб скинути старі треди app-server і реєстрації hook, а потім повторіть спробу.

**Автовстановлення на старті ходу відхиляє source.** Це навмисно. Спочатку додайте
source явною командою `/codex computer-use install --source <marketplace-source>`,
а потім у майбутньому автовстановлення на старті ходу зможе використовувати виявлений локальний
marketplace.
