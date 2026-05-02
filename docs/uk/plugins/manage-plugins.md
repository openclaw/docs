---
read_when:
    - Вам потрібні швидкі приклади встановлення, перегляду списку, оновлення або видалення Plugin
    - Ви хочете вибрати між дистрибуцією Plugin через ClawHub і npm
    - Ви публікуєте пакет Plugin
sidebarTitle: Manage plugins
summary: Короткі приклади встановлення, перегляду списку, видалення, оновлення та публікації плагінів OpenClaw
title: Керування plugins
x-i18n:
    generated_at: "2026-05-02T19:11:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd40c0e9f57c38bf65d68855cdb36919bc926a9808ef09aad89ed32e0fc0f060
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Більшість робочих процесів із plugin зводяться до кількох команд: пошук, інсталяція, перезапуск Gateway,
перевірка та видалення plugin, коли він більше не потрібен.

## Список plugins

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Використовуйте `--json` для скриптів. Він містить діагностику реєстру та статичний
`dependencyStatus` кожного plugin, коли пакет plugin оголошує `dependencies` або
`optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` — це холодна перевірка інвентарю. Вона показує, що OpenClaw може виявити
з конфігурації, маніфестів і реєстру plugin; вона не доводить, що
вже запущений процес Gateway імпортував runtime plugin.

## Інсталяція plugins

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
openclaw plugins install npm:@openclaw/codex@beta

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Після інсталяції коду plugin перезапустіть Gateway, який обслуговує ваші канали:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Використовуйте `inspect --runtime`, коли потрібен доказ, що plugin зареєстрував runtime-поверхні,
як-от інструменти, hooks, сервіси, методи Gateway або CLI-команди,
що належать plugin.

## Оновлення plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Якщо plugin було встановлено з npm dist-tag, наприклад `@beta`, наступні виклики
`update <plugin-id>` повторно використовують цей записаний тег. Передавання явної npm-специфікації
перемикає відстежувану інсталяцію на цю специфікацію для майбутніх оновлень.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Друга команда повертає plugin до стандартної лінії випусків реєстру,
якщо раніше він був зафіксований на точній версії або тезі.

## Видалення plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Видалення прибирає запис конфігурації plugin, запис індексу plugin, записи списків
дозволу/заборони та пов’язані шляхи завантаження, коли це застосовно. Керовані директорії інсталяції
видаляються, якщо ви не передасте `--keep-files`.

## Публікація plugins

Ви можете публікувати зовнішні plugins у [ClawHub](https://clawhub.ai), npmjs.com або
в обох.

### Публікація в ClawHub

ClawHub — це основна публічна поверхня пошуку для OpenClaw plugins. Він дає
користувачам пошукові метадані, історію версій і результати сканування реєстру перед
інсталяцією.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Користувачі інсталюють із ClawHub за допомогою:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

Коротка форма все одно спочатку перевіряє ClawHub.

### Публікація в npmjs.com

Нативні npm plugins мають містити маніфест plugin і метадані точки входу OpenClaw
у `package.json`.

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

Користувачі інсталюють лише з npm за допомогою:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Якщо той самий пакет також доступний у ClawHub, `npm:` пропускає пошук у ClawHub і
примусово використовує npm-розв’язання.

## Вибір джерела

- **ClawHub**: використовуйте, коли потрібні нативні для OpenClaw пошук, зведення сканування,
  версії та підказки щодо інсталяції.
- **npmjs.com**: використовуйте, коли ви вже постачаєте JavaScript-пакети або потребуєте робочих процесів npm
  dist-tags/приватного реєстру.
- **Git**: використовуйте, коли хочете інсталювати безпосередньо з гілки, тега або коміту.
- **Локальний шлях**: використовуйте, коли розробляєте або тестуєте plugin на тій самій
  машині.

## Пов’язане

- [Plugins](/uk/tools/plugin) - огляд і усунення несправностей
- [`openclaw plugins`](/uk/cli/plugins) - повний довідник CLI
- [ClawHub](/uk/tools/clawhub) - публікація й операції з реєстром
- [Створення plugins](/uk/plugins/building-plugins) - створення пакета plugin
- [Маніфест Plugin](/uk/plugins/manifest) - маніфест і метадані пакета
