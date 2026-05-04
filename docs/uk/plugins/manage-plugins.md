---
read_when:
    - Вам потрібні швидкі приклади встановлення, перегляду списку, оновлення або видалення Plugin
    - Ви хочете вибрати між ClawHub і розповсюдженням Plugin через npm
    - Ви публікуєте пакет Plugin
sidebarTitle: Manage plugins
summary: Короткі приклади встановлення, перегляду списку, видалення, оновлення та публікації плагінів OpenClaw
title: Керування Plugin
x-i18n:
    generated_at: "2026-05-04T20:59:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fa7aa78c1ba9c83ba09bea073987ed5e037031f7c7f29307fe18934b0bd2a1c
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Більшість робочих процесів із плагінами складаються з кількох команд: пошук, встановлення, перезапуск Gateway, перевірка та видалення, коли плагін більше не потрібен.

## Список плагінів

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Використовуйте `--json` для скриптів. Він містить діагностику реєстру та статичний `dependencyStatus` кожного плагіна, коли пакет плагіна оголошує `dependencies` або `optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` — це холодна перевірка інвентарю. Вона показує, що OpenClaw може виявити з конфігурації, маніфестів і реєстру плагінів; вона не доводить, що вже запущений процес Gateway імпортував runtime плагіна.

## Встановлення плагінів

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Bare package specs try ClawHub first, then npm fallback.
openclaw plugins install <package>

# Force one source.
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# Install a specific version or dist-tag.
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Після встановлення коду плагіна перезапустіть Gateway, який обслуговує ваші канали:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Використовуйте `inspect --runtime`, коли вам потрібен доказ, що плагін зареєстрував runtime-поверхні, як-от інструменти, хуки, сервіси, методи Gateway або CLI-команди, що належать плагіну.

## Оновлення плагінів

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Якщо плагін було встановлено з npm dist-tag, наприклад `@beta`, подальші виклики `update <plugin-id>` повторно використовують цей записаний тег. Передавання явної npm-специфікації перемикає відстежуване встановлення на цю специфікацію для майбутніх оновлень.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Друга команда повертає плагін до стандартної лінії випусків реєстру, якщо раніше він був закріплений за точною версією або тегом.

Коли `openclaw update` виконується на beta-каналі, записи npm і ClawHub-плагінів зі стандартної лінії спочатку пробують відповідний випуск плагіна `@beta`. Якщо такого beta-випуску не існує, OpenClaw повертається до записаної стандартної/найновішої специфікації. Для npm-плагінів OpenClaw також повертається до неї, коли beta-пакет існує, але не проходить перевірку встановлення. Точні версії та явні теги, як-от `@rc` або `@beta`, зберігаються.

## Видалення плагінів

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Видалення прибирає конфігураційний запис плагіна, запис індексу плагінів, записи списків дозволів/заборон і пов’язані шляхи завантаження, коли це застосовно. Керовані каталоги встановлення видаляються, якщо ви не передасте `--keep-files`.

## Публікація плагінів

Ви можете публікувати зовнішні плагіни в [ClawHub](https://clawhub.ai), npmjs.com або в обидва місця.

### Публікація в ClawHub

ClawHub — це основна публічна поверхня виявлення плагінів OpenClaw. Вона надає користувачам доступні для пошуку метадані, історію версій і результати сканування реєстру перед встановленням.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Користувачі встановлюють із ClawHub за допомогою:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

Скорочена форма й надалі спочатку перевіряє ClawHub.

### Публікація в npmjs.com

Нативні npm-плагіни мають містити маніфест плагіна та метадані точки входу OpenClaw у `package.json`.

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
```

Користувачі встановлюють лише з npm за допомогою:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Якщо той самий пакет також доступний у ClawHub, `npm:` пропускає пошук у ClawHub і примусово використовує розв’язання через npm.

## Вибір джерела

- **ClawHub**: використовуйте, коли потрібні нативне для OpenClaw виявлення, підсумки сканування, версії та підказки зі встановлення.
- **npmjs.com**: використовуйте, коли ви вже постачаєте JavaScript-пакети або потребуєте робочих процесів npm dist-tag/приватного реєстру.
- **Git**: використовуйте, коли хочете встановити безпосередньо з гілки, тегу або коміту.
- **Локальний шлях**: використовуйте, коли розробляєте або тестуєте плагін на тому самому комп’ютері.

## Пов’язане

- [Плагіни](/uk/tools/plugin) - огляд і усунення несправностей
- [`openclaw plugins`](/uk/cli/plugins) - повна довідка CLI
- [ClawHub](/uk/tools/clawhub) - публікація та операції з реєстром
- [Створення плагінів](/uk/plugins/building-plugins) - створення пакета плагіна
- [Маніфест плагіна](/uk/plugins/manifest) - маніфест і метадані пакета
