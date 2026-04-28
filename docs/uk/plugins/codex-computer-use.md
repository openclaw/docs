---
read_when:
    - Ви хочете, щоб агенти OpenClaw у режимі Codex використовували Codex Computer Use
    - Ви обираєте між Codex Computer Use, PeekabooBridge та прямим `cua-driver` MCP
    - Ви обираєте між Codex Computer Use і прямим налаштуванням `cua-driver` MCP
    - Ви налаштовуєте `computerUse` для вбудованого Plugin Codex
    - Ви усуваєте проблеми зі станом або встановленням `/codex computer-use`
summary: Налаштуйте Codex Computer Use для агентів OpenClaw у режимі Codex
title: Codex Computer Use
x-i18n:
    generated_at: "2026-04-28T00:49:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c25979c09747ac133df473f25c3d5bca34324fd5b1c047d41545ef675267618
    source_path: plugins/codex-computer-use.md
    workflow: 15
---

Computer Use — це нативний для Codex MCP Plugin для локального керування робочим столом. OpenClaw
не постачає в комплекті десктопний застосунок, не виконує дії на робочому столі самостійно й не обходить
дозволи Codex. Вбудований Plugin `codex` лише готує app-server Codex:
він вмикає підтримку Plugin Codex, знаходить або встановлює налаштований Plugin
Codex Computer Use, перевіряє, що MCP-сервер `computer-use` доступний, а
потім дозволяє Codex керувати нативними викликами інструментів MCP під час ходів у режимі Codex.

Використовуйте цю сторінку, коли OpenClaw уже використовує нативний harness Codex. Щоб налаштувати
сам runtime, див. [Codex harness](/uk/plugins/codex-harness).

## OpenClaw.app і Peekaboo

Інтеграція Peekaboo в OpenClaw.app є окремою від Codex Computer Use. Застосунок
macOS може розміщувати сокет PeekabooBridge, щоб CLI `peekaboo` міг повторно використовувати
локальні дозволи застосунку на Accessibility і Screen Recording для власних
інструментів автоматизації Peekaboo. Цей міст не встановлює і не проксіює Codex Computer Use, а
Codex Computer Use не викликає його через сокет PeekabooBridge.

Використовуйте [Peekaboo bridge](/uk/platforms/mac/peekaboo), коли ви хочете, щоб OpenClaw.app був
хостом із урахуванням дозволів для автоматизації Peekaboo CLI. Використовуйте цю сторінку, коли
агент OpenClaw у режимі Codex повинен мати нативний MCP Plugin `computer-use` Codex
доступним до початку ходу.

## Застосунок iOS

Застосунок iOS є окремим від Codex Computer Use. Він не встановлює і не проксіює
MCP-сервер `computer-use` Codex і не є бекендом для керування робочим столом.
Натомість застосунок iOS підключається як Node OpenClaw і надає мобільні
можливості через команди вузла, такі як `canvas.*`, `camera.*`, `screen.*`,
`location.*` і `talk.*`.

Використовуйте [iOS](/uk/platforms/ios), коли ви хочете, щоб агент керував Node iPhone через
Gateway. Використовуйте цю сторінку, коли агент у режимі Codex повинен керувати
локальним робочим столом macOS через нативний Plugin Computer Use у Codex.

## Прямий MCP `cua-driver`

Codex Computer Use — не єдиний спосіб надати керування робочим столом. Якщо ви хочете,
щоб runtime під керуванням OpenClaw викликали драйвер TryCua безпосередньо, використовуйте
висхідний сервер `cua-driver mcp` через реєстр MCP OpenClaw замість
специфічного для Codex потоку marketplace.

Після встановлення `cua-driver` або попросіть його вивести команду для OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

або зареєструйте stdio-сервер самостійно:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Цей шлях зберігає незмінною висхідну поверхню інструментів MCP, зокрема
схеми драйвера та структуровані відповіді MCP. Використовуйте його, коли хочете, щоб драйвер
CUA був доступний як звичайний MCP-сервер OpenClaw. Використовуйте налаштування Codex Computer Use
на цій сторінці, коли app-server Codex повинен керувати встановленням Plugin, перезавантаженнями
MCP та нативними викликами інструментів усередині ходів у режимі Codex.

Драйвер CUA специфічний для macOS і все одно потребує локальних дозволів macOS,
які запитує його застосунок, наприклад Accessibility і Screen Recording. OpenClaw
не встановлює `cua-driver`, не надає ці дозволи й не обходить модель безпеки
висхідного драйвера.

## Швидке налаштування

Установіть `plugins.entries.codex.config.computerUse`, коли ходи в режимі Codex повинні мати
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

З цією конфігурацією OpenClaw перевіряє app-server Codex перед кожним ходом у режимі Codex.
Якщо Computer Use відсутній, але app-server Codex уже виявив marketplace, який
можна встановити, OpenClaw просить app-server Codex встановити або знову ввімкнути
Plugin і перезавантажити MCP-сервери. У macOS, коли не зареєстровано жодного відповідного
marketplace і існує стандартний пакет застосунку Codex, OpenClaw також намагається
зареєструвати вбудований marketplace Codex з
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, перш ніж
завершитися з помилкою. Якщо налаштування все одно не може зробити MCP-сервер доступним,
хід завершується з помилкою до початку потоку.

Наявні сеанси зберігають свій runtime і прив’язку до потоку Codex. Після зміни
`agentRuntime` або конфігурації Computer Use використайте `/new` або `/reset` у
відповідному чаті перед тестуванням.

## Команди

Використовуйте команди `/codex computer-use` з будь-якої поверхні чату, де доступна
поверхня команд Plugin `codex`. Це команди чату/runtime OpenClaw,
а не підкоманди CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` доступна лише для читання. Вона не додає джерела marketplace, не встановлює Plugin
і не вмикає підтримку Plugin Codex.

`install` вмикає підтримку Plugin в app-server Codex, за потреби додає налаштоване
джерело marketplace, встановлює або знову вмикає налаштований Plugin через Codex
app-server, перезавантажує MCP-сервери та перевіряє, що MCP-сервер надає інструменти.

## Вибір marketplace

OpenClaw використовує той самий API app-server, який надає сам Codex. Поля
marketplace визначають, де Codex повинен шукати `computer-use`.

| Поле | Використовуйте, коли | Підтримка встановлення |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Без поля marketplace | Ви хочете, щоб app-server Codex використовував marketplace, які він уже знає. | Так, коли app-server повертає локальний marketplace. |
| `marketplaceSource`  | У вас є джерело marketplace Codex, яке app-server може додати. | Так, для явного `/codex computer-use install`. |
| `marketplacePath`    | Ви вже знаєте шлях до локального файла marketplace на хості. | Так, для явного встановлення та автоматичного встановлення на старті ходу. |
| `marketplaceName`    | Ви хочете вибрати один уже зареєстрований marketplace за назвою. | Так, лише коли вибраний marketplace має локальний шлях. |

Новим домашнім каталогам Codex може знадобитися трохи часу, щоб ініціалізувати
офіційні marketplace. Під час встановлення OpenClaw опитує `plugin/list` протягом
`marketplaceDiscoveryTimeoutMs` мілісекунд. Значення за замовчуванням — 60 секунд.

Якщо Computer Use міститься в кількох відомих marketplace, OpenClaw надає перевагу
`openai-bundled`, потім `openai-curated`, потім `local`. Невідомі неоднозначні збіги
завершуються в закритому режимі й просять вас установити `marketplaceName` або
`marketplacePath`.

## Вбудований marketplace macOS

Останні десктопні збірки Codex постачають Computer Use тут:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Коли `computerUse.autoInstall` має значення true і не зареєстровано жодного marketplace,
що містить `computer-use`, OpenClaw намагається автоматично додати стандартний
кореневий каталог вбудованого marketplace:

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

App-server Codex може перелічувати й читати записи каталогу, доступні лише віддалено, але наразі він
не підтримує віддалений `plugin/install`. Це означає, що `marketplaceName` може
вибирати marketplace лише з віддаленим доступом для перевірок стану, але для встановлення й повторного
вмикання все одно потрібен локальний marketplace через `marketplaceSource` або `marketplacePath`.

Якщо стан показує, що Plugin доступний у віддаленому marketplace Codex, але віддалене
встановлення не підтримується, виконайте install із локальним джерелом або шляхом:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Довідник конфігурації

| Поле | За замовчуванням | Значення |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Вимагати Computer Use. За замовчуванням має значення true, коли встановлено інше поле Computer Use. |
| `autoInstall`                   | false          | Встановлювати або знову вмикати з уже виявлених marketplace на старті ходу. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Скільки часу install чекає на виявлення marketplace в app-server Codex. |
| `marketplaceSource`             | unset          | Рядок джерела, переданий у `marketplace/add` app-server Codex. |
| `marketplacePath`               | unset          | Шлях до локального файла marketplace Codex, що містить Plugin. |
| `marketplaceName`               | unset          | Назва зареєстрованого marketplace Codex для вибору. |
| `pluginName`                    | `computer-use` | Назва Plugin marketplace Codex. |
| `mcpServerName`                 | `computer-use` | Назва MCP-сервера, яку надає встановлений Plugin. |

Автоматичне встановлення на старті ходу навмисно відхиляє налаштовані значення
`marketplaceSource`. Додавання нового джерела — це явна операція налаштування, тому
один раз використайте `/codex computer-use install --source <marketplace-source>`, а потім дозвольте
`autoInstall` обробляти майбутні повторні ввімкнення з виявлених локальних marketplace.
Автоматичне встановлення на старті ходу може використовувати налаштований `marketplacePath`, оскільки це
вже локальний шлях на хості.

## Що перевіряє OpenClaw

OpenClaw внутрішньо повідомляє про стабільну причину налаштування і форматує
орієнтований на користувача стан для чату:

| Причина | Значення | Наступний крок |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` розгорнувся в false. | Установіть `enabled` або інше поле Computer Use. |
| `marketplace_missing`        | Не було доступного відповідного marketplace. | Налаштуйте джерело, шлях або назву marketplace. |
| `plugin_not_installed`       | Marketplace існує, але Plugin не встановлено. | Виконайте install або ввімкніть `autoInstall`. |
| `plugin_disabled`            | Plugin встановлено, але вимкнено в конфігурації Codex. | Виконайте install, щоб знову ввімкнути його. |
| `remote_install_unsupported` | Вибраний marketplace доступний лише віддалено. | Використовуйте `marketplaceSource` або `marketplacePath`. |
| `mcp_missing`                | Plugin увімкнено, але MCP-сервер недоступний. | Перевірте Codex Computer Use і дозволи ОС. |
| `ready`                      | Plugin і інструменти MCP доступні. | Запустіть хід у режимі Codex. |
| `check_failed`               | Під час перевірки стану не вдалося виконати запит до app-server Codex. | Перевірте підключення до app-server і журнали. |
| `auto_install_blocked`       | Налаштування на старті ходу потребувало б додавання нового джерела. | Спочатку виконайте явне встановлення. |

Вивід у чаті містить стан Plugin, стан MCP-сервера, marketplace, інструменти
за наявності та конкретне повідомлення для кроку налаштування, що завершився помилкою.

## Дозволи macOS

Computer Use специфічний для macOS. MCP-сервер під керуванням Codex може потребувати локальних
дозволів ОС, перш ніж він зможе перевіряти або керувати застосунками. Якщо OpenClaw повідомляє, що Computer Use
встановлено, але MCP-сервер недоступний, спочатку перевірте налаштування Computer
Use з боку Codex:

- app-server Codex запущено на тому самому хості, де має
  відбуватися керування робочим столом.
- Plugin Computer Use увімкнено в конфігурації Codex.
- MCP-сервер `computer-use` відображається в статусі MCP app-server Codex.
- macOS надала потрібні дозволи для застосунку керування робочим столом.
- Поточний сеанс хоста має доступ до робочого столу, яким керують.

OpenClaw навмисно завершує роботу в закритому режимі, коли `computerUse.enabled` має значення true. Хід
у режимі Codex не повинен мовчки продовжуватися без нативних інструментів керування робочим столом,
які вимагала конфігурація.

## Усунення проблем

**Стан показує, що не встановлено.** Виконайте `/codex computer-use install`. Якщо
marketplace не виявлено, передайте `--source` або `--marketplace-path`.

**Стан показує, що встановлено, але вимкнено.** Знову виконайте `/codex computer-use install`.
Встановлення через app-server Codex знову записує конфігурацію Plugin у стан enabled.

**Стан показує, що віддалене встановлення не підтримується.** Використовуйте локальне джерело marketplace або
шлях. Записи каталогу, доступні лише віддалено, можна переглядати, але не можна встановлювати через
поточний API app-server.

**Стан показує, що MCP-сервер недоступний.** Один раз повторно виконайте install, щоб
MCP-сервери перезавантажилися. Якщо він і далі недоступний, виправте застосунок Codex Computer Use,
статус MCP app-server Codex або дозволи macOS.

**Стан або перевірка завершується тайм-аутом на `computer-use.list_apps`.** Plugin і MCP-
сервер присутні, але локальний міст Computer Use не відповів. Закрийте або перезапустіть
Codex Computer Use, за потреби знову запустіть Codex Desktop, а потім повторіть спробу в
новому сеансі OpenClaw.

**Інструмент Computer Use показує `Native hook relay unavailable`.** Нативний для Codex
hook інструмента досяг OpenClaw із застарілою або відсутньою реєстрацією relay. Запустіть
новий сеанс OpenClaw за допомогою `/new` або `/reset`. Якщо це продовжує траплятися, перезапустіть
Gateway, щоб скинути старі потоки app-server і реєстрації hook, а потім повторіть спробу.

**Автоматичне встановлення на старті ходу відхиляє джерело.** Це навмисно. Спочатку додайте
джерело явною командою `/codex computer-use install --source <marketplace-source>`,
а потім подальше автоматичне встановлення на старті ходу зможе використовувати виявлений локальний
marketplace.
