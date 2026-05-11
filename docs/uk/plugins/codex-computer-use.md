---
read_when:
    - Ви хочете, щоб агенти OpenClaw у режимі Codex використовували Codex Computer Use
    - Ви обираєте між Codex Computer Use, PeekabooBridge і прямим cua-driver MCP
    - Ви обираєте між Codex Computer Use і прямим налаштуванням cua-driver MCP
    - Ви налаштовуєте computerUse для вбудованого Codex Plugin
    - Ви усуваєте неполадки з /codex computer-use status або install
summary: Налаштуйте Codex Computer Use для агентів OpenClaw у режимі Codex
title: Використання комп’ютера Codex
x-i18n:
    generated_at: "2026-05-11T20:45:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e1637ad13a96324aebbf97fb179b8c846b27541e917fd56e586c75e79eea7bb
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use — це нативний для Codex MCP-plugin для керування локальним робочим столом. OpenClaw
не постачає застосунок для робочого столу, не виконує дії на робочому столі самостійно й не обходить
дозволи Codex. Вбудований plugin `codex` лише готує сервер застосунку Codex:
він вмикає підтримку plugin у Codex, знаходить або встановлює налаштований plugin Codex
Computer Use, перевіряє доступність MCP-сервера `computer-use`, а
потім дозволяє Codex володіти нативними викликами MCP-інструментів під час ходів у режимі Codex.

Використовуйте цю сторінку, коли OpenClaw уже використовує нативну обв'язку Codex. Щодо
самого налаштування runtime див. [обв'язку Codex](/uk/plugins/codex-harness).

## OpenClaw.app і Peekaboo

Інтеграція Peekaboo в OpenClaw.app відокремлена від Codex Computer Use. Застосунок
macOS може розміщувати сокет PeekabooBridge, щоб CLI `peekaboo` міг повторно використовувати
локальні дозволи Accessibility і Screen Recording застосунку для власних
інструментів автоматизації Peekaboo. Цей міст не встановлює й не проксіює Codex Computer Use, а
Codex Computer Use не викликається через сокет PeekabooBridge.

Використовуйте [міст Peekaboo](/uk/platforms/mac/peekaboo), коли потрібно, щоб OpenClaw.app був
хостом із урахуванням дозволів для автоматизації Peekaboo CLI. Використовуйте цю сторінку, коли
агент OpenClaw у режимі Codex повинен мати нативний MCP-plugin `computer-use` від Codex
доступним до початку ходу.

## Застосунок iOS

Застосунок iOS відокремлений від Codex Computer Use. Він не встановлює й не проксіює
MCP-сервер Codex `computer-use` і не є бекендом керування робочим столом.
Натомість застосунок iOS підключається як вузол OpenClaw і надає мобільні
можливості через команди вузла, як-от `canvas.*`, `camera.*`, `screen.*`,
`location.*` і `talk.*`.

Використовуйте [iOS](/uk/platforms/ios), коли потрібно, щоб агент керував вузлом iPhone через
Gateway. Використовуйте цю сторінку, коли агент у режимі Codex повинен керувати локальним
робочим столом macOS через нативний plugin Computer Use від Codex.

## Прямий MCP cua-driver

Codex Computer Use — не єдиний спосіб надати керування робочим столом. Якщо потрібно,
щоб runtime, керовані OpenClaw, викликали драйвер TryCua напряму, використовуйте upstream
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
та структурованими MCP-відповідями. Використовуйте його, коли потрібно, щоб драйвер CUA
був доступний як звичайний MCP-сервер OpenClaw. Використовуйте налаштування Codex Computer Use на
цій сторінці, коли сервер застосунку Codex має володіти встановленням plugin, перезавантаженнями MCP
і нативними викликами інструментів усередині ходів у режимі Codex.

Драйвер CUA специфічний для macOS і все ще потребує локальних дозволів macOS,
які запитує його застосунок, наприклад Accessibility і Screen Recording. OpenClaw
не встановлює `cua-driver`, не надає ці дозволи й не обходить модель безпеки
upstream-драйвера.

## Швидке налаштування

Задайте `plugins.entries.codex.config.computerUse`, коли ходи в режимі Codex мають мати
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
    },
  },
}
```

З цією конфігурацією OpenClaw перевіряє сервер застосунку Codex перед кожним ходом у режимі Codex.
Якщо Computer Use відсутній, але сервер застосунку Codex уже виявив
marketplace, доступний для встановлення, OpenClaw просить сервер застосунку Codex встановити або повторно ввімкнути
plugin і перезавантажити MCP-сервери. На macOS, коли не зареєстровано відповідний marketplace,
а стандартний пакет застосунку Codex існує, OpenClaw також намагається
зареєструвати вбудований marketplace Codex із
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` перед тим,
як завершитися помилкою. Якщо налаштування все одно не може зробити MCP-сервер доступним, хід завершується помилкою
до початку потоку.

Після зміни конфігурації Computer Use використайте `/new` або `/reset` у відповідному чаті
перед тестуванням, якщо наявний потік Codex уже запущено.

## Команди

Використовуйте команди `/codex computer-use` з будь-якої поверхні чату, де доступна
поверхня команд plugin `codex`. Це команди чату/runtime OpenClaw,
а не підкоманди CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` призначена лише для читання. Вона не додає джерела marketplace, не встановлює plugin і не
вмикає підтримку plugin у Codex.

`install` вмикає підтримку plugin на сервері застосунку Codex, за потреби додає налаштоване
джерело marketplace, встановлює або повторно вмикає налаштований plugin через сервер
застосунку Codex, перезавантажує MCP-сервери й перевіряє, що MCP-сервер надає інструменти.

## Варіанти marketplace

OpenClaw використовує той самий API сервера застосунку, який надає сам Codex. Поля
marketplace вибирають, де Codex має знайти `computer-use`.

| Поле                 | Коли використовувати                                             | Підтримка встановлення                                  |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Немає поля marketplace | Потрібно, щоб сервер застосунку Codex використовував marketplace, які він уже знає. | Так, коли сервер застосунку повертає локальний marketplace. |
| `marketplaceSource`  | У вас є джерело marketplace Codex, яке сервер застосунку може додати. | Так, для явного `/codex computer-use install`.          |
| `marketplacePath`    | Ви вже знаєте локальний шлях до файлу marketplace на хості.      | Так, для явного встановлення та автоматичного встановлення на початку ходу. |
| `marketplaceName`    | Потрібно вибрати один уже зареєстрований marketplace за назвою.  | Так, лише коли вибраний marketplace має локальний шлях.  |

Новим домівкам Codex може знадобитися короткий час, щоб заповнити офіційні marketplace.
Під час встановлення OpenClaw опитує `plugin/list` до
`marketplaceDiscoveryTimeoutMs` мілісекунд. Значення за замовчуванням — 60 секунд.

Якщо кілька відомих marketplace містять Computer Use, OpenClaw надає перевагу
`openai-bundled`, потім `openai-curated`, потім `local`. Невідомі неоднозначні збіги
завершуються закритою відмовою та просять задати `marketplaceName` або `marketplacePath`.

## Вбудований marketplace macOS

Останні збірки Codex для робочого столу постачають Computer Use тут:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Коли `computerUse.autoInstall` має значення true і не зареєстровано marketplace, що містить
`computer-use`, OpenClaw намагається автоматично додати стандартний корінь вбудованого
marketplace:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Ви також можете явно зареєструвати його з оболонки за допомогою Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Якщо ви використовуєте нестандартний шлях до застосунку Codex, задайте `computerUse.marketplacePath` як
локальний шлях до файлу marketplace або один раз виконайте `/codex computer-use install --source
<marketplace-source>`.

## Обмеження віддаленого каталогу

Сервер застосунку Codex може перелічувати й читати записи лише віддаленого каталогу, але наразі не
підтримує віддалене `plugin/install`. Це означає, що `marketplaceName` може
вибрати marketplace лише віддаленого типу для перевірок стану, але встановлення й повторне ввімкнення
все одно потребують локального marketplace через `marketplaceSource` або `marketplacePath`.

Якщо status повідомляє, що plugin доступний у віддаленому marketplace Codex, але віддалене
встановлення не підтримується, запустіть install із локальним джерелом або шляхом:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Довідник конфігурації

| Поле                            | За замовчуванням | Значення                                                                       |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Вимагати Computer Use. За замовчуванням true, коли задано інше поле Computer Use. |
| `autoInstall`                   | false          | Встановлювати або повторно вмикати з уже виявлених marketplace на початку ходу. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Як довго install очікує виявлення marketplace сервером застосунку Codex.        |
| `marketplaceSource`             | unset          | Рядок джерела, переданий у `marketplace/add` сервера застосунку Codex.          |
| `marketplacePath`               | unset          | Локальний шлях до файлу marketplace Codex, що містить plugin.                  |
| `marketplaceName`               | unset          | Назва зареєстрованого marketplace Codex для вибору.                            |
| `pluginName`                    | `computer-use` | Назва plugin у marketplace Codex.                                              |
| `mcpServerName`                 | `computer-use` | Назва MCP-сервера, яку надає встановлений plugin.                              |

Автоматичне встановлення на початку ходу навмисно відхиляє налаштовані значення `marketplaceSource`.
Додавання нового джерела — явна операція налаштування, тому один раз використайте
`/codex computer-use install --source <marketplace-source>`, а потім дозвольте
`autoInstall` обробляти майбутні повторні ввімкнення з виявлених локальних marketplace.
Автоматичне встановлення на початку ходу може використовувати налаштований `marketplacePath`, оскільки це
вже локальний шлях на хості.

## Що перевіряє OpenClaw

OpenClaw внутрішньо повідомляє стабільну причину налаштування та форматує видимий користувачу
стан для чату:

| Причина                      | Значення                                               | Наступний крок                                |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` обчислено як false.              | Задайте `enabled` або інше поле Computer Use. |
| `marketplace_missing`        | Відповідний marketplace був недоступний.               | Налаштуйте джерело, шлях або назву marketplace. |
| `plugin_not_installed`       | Marketplace існує, але plugin не встановлено.          | Запустіть install або ввімкніть `autoInstall`. |
| `plugin_disabled`            | Plugin встановлено, але вимкнено в конфігурації Codex. | Запустіть install, щоб повторно ввімкнути його. |
| `remote_install_unsupported` | Вибраний marketplace є лише віддаленим.                | Використайте `marketplaceSource` або `marketplacePath`. |
| `mcp_missing`                | Plugin увімкнено, але MCP-сервер недоступний.          | Перевірте Codex Computer Use і дозволи ОС.    |
| `ready`                      | Plugin і MCP-інструменти доступні.                     | Почніть хід у режимі Codex.                  |
| `check_failed`               | Запит до сервера застосунку Codex завершився помилкою під час перевірки стану. | Перевірте з'єднання із сервером застосунку та журнали. |
| `auto_install_blocked`       | Налаштування на початку ходу потребувало б додавання нового джерела. | Спочатку запустіть явне встановлення.         |

Вивід чату містить стан plugin, стан MCP-сервера, marketplace, інструменти,
коли вони доступні, і конкретне повідомлення для кроку налаштування, що завершився помилкою.

## Дозволи macOS

Computer Use специфічний для macOS. MCP-сервер, яким володіє Codex, може потребувати локальних дозволів ОС
перш ніж зможе перевіряти застосунки або керувати ними. Якщо OpenClaw повідомляє, що Computer Use
встановлено, але MCP-сервер недоступний, спочатку перевірте налаштування Computer Use на боці Codex:

- Codex app-server запущено на тому самому хості, де має
  відбуватися керування робочим столом.
- Plugin Computer Use увімкнено в конфігурації Codex.
- MCP-сервер `computer-use` відображається в статусі MCP Codex app-server.
- macOS надала потрібні дозволи для застосунку керування робочим столом.
- Поточний сеанс хоста має доступ до робочого столу, яким керують.

OpenClaw навмисно завершується закритою відмовою, коли `computerUse.enabled` має значення true. Хід у режимі Codex не повинен непомітно продовжуватися без нативних інструментів робочого столу, яких вимагає конфігурація.

## Усунення несправностей

**Статус показує, що не встановлено.** Виконайте `/codex computer-use install`. Якщо marketplace не виявлено, передайте `--source` або `--marketplace-path`.

**Статус показує, що встановлено, але вимкнено.** Знову виконайте `/codex computer-use install`.
Встановлення Codex app-server записує конфігурацію Plugin назад як увімкнену.

**Статус показує, що віддалене встановлення не підтримується.** Використайте локальне джерело або шлях marketplace. Записи каталогу лише для віддаленого доступу можна переглядати, але їх не можна встановити через поточний API app-server.

**Статус показує, що MCP-сервер недоступний.** Повторно виконайте встановлення один раз, щоб MCP-сервери перезавантажилися. Якщо він і далі недоступний, виправте застосунок Codex Computer Use, статус MCP Codex app-server або дозволи macOS.

**Статус або проба завершується за тайм-аутом на `computer-use.list_apps`.** Plugin і MCP-сервер наявні, але локальний міст Computer Use не відповів. Закрийте або перезапустіть Codex Computer Use, за потреби перезапустіть Codex Desktop, а потім повторіть спробу в новому сеансі OpenClaw.

**Інструмент Computer Use повідомляє `Native hook relay unavailable`.** Нативний для Codex hook інструмента не зміг дістатися активного relay OpenClaw через локальний міст або резервний Gateway. Запустіть новий сеанс OpenClaw за допомогою `/new` або `/reset`. Якщо це продовжує траплятися, перезапустіть gateway, щоб старі потоки app-server і реєстрації hook було скинуто, а потім повторіть спробу.

**Автовстановлення на початку ходу відхиляє джерело.** Це навмисно. Спершу додайте джерело явно за допомогою `/codex computer-use install --source <marketplace-source>`, і тоді майбутнє автовстановлення на початку ходу зможе використовувати виявлений локальний marketplace.

## Пов’язане

- [Codex harness](/uk/plugins/codex-harness)
- [міст Peekaboo](/uk/platforms/mac/peekaboo)
- [застосунок iOS](/uk/platforms/ios)
