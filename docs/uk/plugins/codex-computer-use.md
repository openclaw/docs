---
read_when:
    - Ви хочете, щоб агенти OpenClaw у режимі Codex використовували використання комп’ютера Codex
    - Ви налаштовуєте `computerUse` для вбудованого Plugin Codex
    - Ви усуваєте проблеми зі станом або встановленням `/codex computer-use`
summary: Налаштуйте використання комп’ютера Codex для агентів OpenClaw у режимі Codex
title: Використання комп’ютера Codex
x-i18n:
    generated_at: "2026-04-27T23:13:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5ebd47014d64778c4c932e3fb73e5b48503fc2fe6fa7727199417ef902631b3
    source_path: plugins/codex-computer-use.md
    workflow: 15
---

Використання комп’ютера — це нативний MCP Plugin для Codex для локального керування робочим столом. OpenClaw
не постачає разом із собою програму для робочого столу, не виконує дії на робочому столі самостійно й не обходить
дозволи Codex. Вбудований Plugin `codex` лише готує app-server Codex:
він вмикає підтримку Plugin у Codex, знаходить або встановлює налаштований
Plugin Codex Computer Use, перевіряє, що MCP-сервер `computer-use` доступний, і
після цього дозволяє Codex керувати нативними викликами інструментів MCP під час кроків у режимі Codex.

Використовуйте цю сторінку, коли OpenClaw уже використовує нативне середовище Codex. Для
самого налаштування середовища виконання див. [Середовище Codex](/uk/plugins/codex-harness).

## Швидке налаштування

Задайте `plugins.entries.codex.config.computerUse`, коли потрібно, щоб для кроків у режимі Codex
Computer Use був доступний до початку потоку:

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
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

Із цією конфігурацією OpenClaw перевіряє app-server Codex перед кожним кроком у режимі Codex.
Якщо Computer Use відсутній, але app-server Codex уже виявив
marketplace, з якого можна виконати встановлення, OpenClaw просить app-server Codex встановити або знову ввімкнути
Plugin і перезавантажити MCP-сервери. Якщо налаштування все одно не може зробити MCP-сервер
доступним, крок завершується помилкою ще до початку потоку.

## Команди

Використовуйте команди `/codex computer-use` з будь-якої поверхні чату, де доступна
поверхня команд Plugin `codex`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` — лише для читання. Він не додає джерела marketplace, не встановлює Plugins і
не вмикає підтримку Plugin у Codex.

`install` вмикає підтримку Plugin в app-server Codex, за потреби додає налаштоване
джерело marketplace, встановлює або знову вмикає налаштований Plugin через Codex
app-server, перезавантажує MCP-сервери та перевіряє, що MCP-сервер надає інструменти.

## Варіанти marketplace

OpenClaw використовує той самий API app-server, який надає сам Codex. Поля
marketplace визначають, де Codex має шукати `computer-use`.

| Поле                 | Використовуйте, коли                                            | Підтримка встановлення                                 |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| Без поля marketplace | Ви хочете, щоб app-server Codex використовував уже відомі йому marketplace. | Так, коли app-server повертає локальний marketplace.   |
| `marketplaceSource`  | У вас є джерело marketplace Codex, яке app-server може додати.  | Так, для явного `/codex computer-use install`.         |
| `marketplacePath`    | Ви вже знаєте шлях до локального файла marketplace на хості.    | Так, для явного встановлення та автоінсталяції на старті кроку. |
| `marketplaceName`    | Ви хочете вибрати вже зареєстрований marketplace за назвою.     | Так, лише коли вибраний marketplace має локальний шлях. |

Новим домашнім каталогам Codex може знадобитися трохи часу, щоб ініціалізувати їхні офіційні marketplace.
Під час встановлення OpenClaw опитує `plugin/list` до
`marketplaceDiscoveryTimeoutMs` мілісекунд. Значення за замовчуванням — 60 секунд.

Якщо кілька відомих marketplace містять Computer Use, OpenClaw надає перевагу
`openai-bundled`, потім `openai-curated`, потім `local`. Невідомі неоднозначні збіги
завершуються безпечною відмовою та просять вас задати `marketplaceName` або `marketplacePath`.

## Обмеження віддаленого каталогу

app-server Codex може перелічувати та читати записи лише з віддаленого каталогу, але наразі
не підтримує віддалений `plugin/install`. Це означає, що `marketplaceName` може
вибрати marketplace лише для віддаленого доступу для перевірок стану, але для встановлення й повторного ввімкнення
усе одно потрібен локальний marketplace через `marketplaceSource` або `marketplacePath`.

Якщо стан показує, що Plugin доступний у віддаленому marketplace Codex, але віддалене
встановлення не підтримується, виконайте встановлення з локальним джерелом або шляхом:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Довідник із конфігурації

| Поле                            | За замовчуванням | Значення                                                                     |
| ------------------------------- | ---------------- | ---------------------------------------------------------------------------- |
| `enabled`                       | визначається автоматично | Вимагає Computer Use. За замовчуванням — true, коли задано інше поле Computer Use. |
| `autoInstall`                   | false            | Встановити або знову ввімкнути з уже виявлених marketplace на старті кроку.  |
| `marketplaceDiscoveryTimeoutMs` | 60000            | Скільки часу встановлення чекає на виявлення marketplace app-server Codex.   |
| `marketplaceSource`             | не задано        | Рядок джерела, переданий у `marketplace/add` app-server Codex.               |
| `marketplacePath`               | не задано        | Шлях до локального файла marketplace Codex, що містить Plugin.               |
| `marketplaceName`               | не задано        | Назва зареєстрованого marketplace Codex для вибору.                          |
| `pluginName`                    | `computer-use`   | Назва Plugin marketplace Codex.                                              |
| `mcpServerName`                 | `computer-use`   | Назва MCP-сервера, яку надає встановлений Plugin.                            |

Автоінсталяція на старті кроку навмисно відхиляє налаштовані значення
`marketplaceSource`. Додавання нового джерела — це явна операція налаштування, тому один раз використайте
`/codex computer-use install --source <marketplace-source>`, а потім дозвольте
`autoInstall` обробляти майбутні повторні ввімкнення з виявлених локальних marketplace.

## Що перевіряє OpenClaw

OpenClaw внутрішньо повідомляє стабільну причину стану налаштування й форматує
стан для користувача в чаті:

| Причина                      | Значення                                              | Наступний крок                                   |
| ---------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| `disabled`                   | `computerUse.enabled` визначився як false.            | Задайте `enabled` або інше поле Computer Use.    |
| `marketplace_missing`        | Відповідний marketplace недоступний.                  | Налаштуйте джерело, шлях або назву marketplace.  |
| `plugin_not_installed`       | Marketplace існує, але Plugin не встановлено.         | Виконайте встановлення або ввімкніть `autoInstall`. |
| `plugin_disabled`            | Plugin встановлено, але вимкнено в конфігурації Codex. | Виконайте встановлення, щоб знову ввімкнути його. |
| `remote_install_unsupported` | Вибраний marketplace доступний лише віддалено.        | Використайте `marketplaceSource` або `marketplacePath`. |
| `mcp_missing`                | Plugin увімкнено, але MCP-сервер недоступний.         | Перевірте Codex Computer Use і дозволи ОС.       |
| `ready`                      | Plugin та інструменти MCP доступні.                   | Почніть крок у режимі Codex.                     |
| `check_failed`               | Під час перевірки стану не вдався запит до app-server Codex. | Перевірте підключення до app-server і журнали.   |
| `auto_install_blocked`       | Для налаштування на старті кроку потрібно додати нове джерело. | Спочатку виконайте явне встановлення.            |

Вивід у чаті містить стан Plugin, стан MCP-сервера, marketplace, інструменти,
коли вони доступні, і конкретне повідомлення для кроку налаштування, що завершився помилкою.

## Дозволи macOS

Computer Use специфічний для macOS. MCP-сервер, яким керує Codex, може потребувати локальних
дозволів ОС, перш ніж він зможе перевіряти або керувати програмами. Якщо OpenClaw повідомляє, що Computer Use
встановлено, але MCP-сервер недоступний, спочатку перевірте налаштування Computer
Use на стороні Codex:

- app-server Codex запущено на тому самому хості, де має відбуватися керування
  робочим столом.
- Plugin Computer Use увімкнено в конфігурації Codex.
- MCP-сервер `computer-use` відображається в стані MCP app-server Codex.
- macOS надала потрібні дозволи для програми керування робочим столом.
- Поточна сесія хоста має доступ до робочого столу, яким керують.

OpenClaw навмисно завершується безпечною відмовою, коли `computerUse.enabled` має значення true. Крок
у режимі Codex не повинен мовчки продовжуватися без нативних інструментів робочого столу,
які вимагає конфігурація.

## Усунення проблем

**Стан показує, що не встановлено.** Виконайте `/codex computer-use install`. Якщо
marketplace не виявлено, передайте `--source` або `--marketplace-path`.

**Стан показує, що встановлено, але вимкнено.** Знову виконайте `/codex computer-use install`.
Встановлення через app-server Codex знову записує конфігурацію Plugin як увімкнену.

**Стан показує, що віддалене встановлення не підтримується.** Використайте локальне джерело marketplace або
шлях. Записи каталогу лише для віддаленого доступу можна перевіряти, але не встановлювати через
поточний API app-server.

**Стан показує, що MCP-сервер недоступний.** Один раз повторно виконайте встановлення, щоб
MCP-сервери перезавантажилися. Якщо він усе ще недоступний, виправте програму Codex Computer Use,
стан MCP app-server Codex або дозволи macOS.

**Автоінсталяція на старті кроку відхиляє джерело.** Це навмисно. Спочатку додайте
джерело явною командою `/codex computer-use install --source <marketplace-source>`,
а потім майбутня автоінсталяція на старті кроку зможе використовувати виявлений локальний
marketplace.
