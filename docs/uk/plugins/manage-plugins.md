---
doc-schema-version: 1
read_when:
    - Вам потрібні швидкі приклади для списку Plugin, встановлення, оновлення, перевірки або видалення
    - Ви хочете вибрати джерело встановлення plugin
    - Вам потрібен правильний довідковий матеріал для публікації пакетів Plugin
sidebarTitle: Manage plugins
summary: Короткі приклади для перегляду списку, установлення, оновлення, перевірки та видалення плагінів OpenClaw
title: Керування плагінами
x-i18n:
    generated_at: "2026-06-27T17:53:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd0c1143c6312603311931cbbdc63069a44bc5ec487e2a46b0266b86a556da4e
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Використовуйте цю сторінку для поширених команд керування плагінами. Повний контракт команд, прапорці, правила вибору джерела та крайові випадки див. у
[`openclaw plugins`](/uk/cli/plugins).

Більшість робочих процесів встановлення такі:

1. знайти пакет
2. встановити його з ClawHub, npm, git або локального шляху
3. дозволити керованому Gateway автоматично перезапуститися або перезапустити його вручну, якщо він некерований
4. перевірити реєстрації середовища виконання плагіна

## Список і пошук плагінів

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

Використовуйте `--json` для скриптів:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` — це холодна перевірка інвентарю. Вона показує, що OpenClaw може виявити
з конфігурації, маніфестів і реєстру плагінів; вона не доводить, що вже запущений Gateway імпортував середовище виконання плагіна. Вивід JSON містить діагностику реєстру та статичний `dependencyStatus` кожного плагіна, коли пакет плагіна оголошує `dependencies` або `optionalDependencies`.

`plugins search` запитує ClawHub щодо встановлюваних пакетів плагінів і виводить
підказки для встановлення, наприклад `openclaw plugins install clawhub:<package>`.

## Встановлення плагінів

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Install from ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Install from npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from a local npm pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Специфікації пакетів без префікса встановлюються з npm під час стартового переходу. Використовуйте `clawhub:`,
`npm:`, `git:` або `npm-pack:`, коли потрібен детермінований вибір джерела.
Якщо ім’я без префікса збігається з ідентифікатором офіційного плагіна, OpenClaw може встановити
запис каталогу напряму.

Використовуйте `--force` лише тоді, коли навмисно хочете перезаписати наявну ціль встановлення.
Для звичайних оновлень відстежуваних встановлень npm, ClawHub або hook-pack використовуйте
`openclaw plugins update`.

## Перезапуск і перевірка

Після встановлення, оновлення або видалення коду плагіна запущений керований
Gateway з увімкненим перезавантаженням конфігурації перезапускається автоматично. Якщо Gateway не
керований або перезавантаження вимкнено, перезапустіть його самостійно перед перевіркою живих поверхонь
середовища виконання:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Використовуйте `inspect --runtime`, коли потрібен доказ, що плагін зареєстрував поверхні середовища виконання, як-от інструменти, хуки, сервіси, методи Gateway, HTTP-маршрути або CLI-команди, що належать плагіну. Звичайні `inspect` і `list` — це холодні перевірки маніфесту, конфігурації та реєстру.

## Оновлення плагінів

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Коли ви передаєте ідентифікатор плагіна, OpenClaw повторно використовує відстежувану специфікацію встановлення. Збережені dist-tags, як-от `@beta`, і точні закріплені версії продовжують використовуватися під час подальших запусків `update <plugin-id>`.

`openclaw plugins update --all` — це шлях масового обслуговування. Він усе ще поважає
звичайні відстежувані специфікації встановлення, але довірені офіційні записи плагінів OpenClaw можуть
синхронізуватися з поточною ціллю офіційного каталогу замість того, щоб залишатися на застарілому точному
офіційному пакеті. Якщо `update.channel` має значення `beta`, ця масова офіційна синхронізація
використовує контекст beta-каналу. Використовуйте цільовий `update <plugin-id>`, коли ви
навмисно хочете залишити точну або теговану офіційну специфікацію без змін.

Для встановлень npm можна передати явну специфікацію пакета, щоб переключити відстежуваний
запис:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Друга команда повертає плагін до стандартної лінійки випусків реєстру,
якщо раніше він був закріплений на точній версії або тегу.

Коли `openclaw update` виконується на beta-каналі, записи плагінів можуть надавати перевагу
відповідним випускам `@beta`. Точні правила резервного вибору та закріплення див. у
[`openclaw plugins`](/uk/cli/plugins#update).

## Видалення плагінів

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

Видалення прибирає запис конфігурації плагіна, збережений індексний запис плагіна,
записи списків дозволу/заборони та пов’язані шляхи завантаження, коли це застосовно. Керовані каталоги
встановлення видаляються, якщо не передати `--keep-files`. Запущений керований
Gateway перезапускається автоматично, коли видалення змінює джерело плагіна.

У режимі Nix (`OPENCLAW_NIX_MODE=1`) команди встановлення, оновлення, видалення, увімкнення
та вимкнення плагінів вимкнені. Керуйте цими виборами в джерелі Nix для
встановлення натомість.

## Вибір джерела

| Джерело      | Використовуйте, коли                                                                    | Приклад                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Вам потрібні нативне для OpenClaw виявлення, зведення сканування, версії та підказки     | `openclaw plugins install clawhub:<package>`                   |
| npmjs.com   | Ви вже постачаєте JavaScript-пакети або потребуєте npm dist-tags/приватного реєстру | `openclaw plugins install npm:@acme/openclaw-plugin`           |
| git         | Вам потрібна гілка, тег або коміт із репозиторію                         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| локальний шлях  | Ви розробляєте або тестуєте плагін на тому самому комп’ютері                  | `openclaw plugins install --link ./my-plugin`                  |
| npm pack    | Ви перевіряєте локальний артефакт пакета через семантику встановлення npm      | `openclaw plugins install npm-pack:<path.tgz>`                 |
| маркетплейс | Ви встановлюєте сумісний із Claude плагін маркетплейсу                   | `openclaw plugins install <plugin> --marketplace <source>`     |

Керовані встановлення з локального шляху мають бути каталогами або архівами плагінів. Додавайте
окремі файли плагінів у `plugins.load.paths` замість встановлення їх за допомогою
`plugins install`.

## Публікація плагінів

ClawHub — основна публічна поверхня виявлення для плагінів OpenClaw. Публікуйте
там, коли хочете, щоб користувачі знаходили метадані плагіна, історію версій, результати
сканування реєстру та підказки для встановлення перед встановленням.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Нативні npm-плагіни мають містити маніфест плагіна та метадані пакета перед
публікацією:

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Використовуйте ці сторінки для повного контракту публікації замість того, щоб вважати цю сторінку
довідником із публікації:

- [Публікація ClawHub](/uk/clawhub/publishing) пояснює власників, scopes, випуски,
  рев’ю, перевірку пакета та передавання пакета.
- [Створення плагінів](/uk/plugins/building-plugins) показує форму пакета плагіна
  та перший робочий процес публікації.
- [Маніфест Plugin](/uk/plugins/manifest) визначає поля нативного маніфесту плагіна.

Якщо той самий пакет доступний і в ClawHub, і в npm, використовуйте явний
префікс `clawhub:` або `npm:`, коли потрібно примусово вибрати одне джерело.

## Пов’язане

- [Плагіни](/uk/tools/plugin) - встановлення, налаштування, перезапуск і усунення несправностей
- [`openclaw plugins`](/uk/cli/plugins) - повна довідка CLI
- [Спільнотні плагіни](/uk/plugins/community) - публічне виявлення та публікація ClawHub
- [ClawHub](/uk/clawhub/cli) - операції CLI реєстру
- [Створення плагінів](/uk/plugins/building-plugins) - створення пакета плагіна
- [Маніфест Plugin](/uk/plugins/manifest) - маніфест і метадані пакета
