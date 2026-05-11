---
read_when:
    - Вам потрібні швидкі приклади встановлення, перегляду списку, оновлення або видалення Plugin
    - Ви хочете вибрати між розповсюдженням плагінів через ClawHub і npm
    - Ви публікуєте пакет Plugin
sidebarTitle: Manage plugins
summary: Швидкі приклади встановлення, перегляду списку, видалення, оновлення та публікації плагінів OpenClaw
title: Керування Plugin
x-i18n:
    generated_at: "2026-05-11T20:48:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f666a8196c802190dfd69e8b6a679a47db22f97c4c14d2f9fed73e8fb1ffe5a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Найпоширеніші робочі процеси Plugin складаються з кількох команд: пошук, установлення, перезапуск Gateway, перевірка та видалення, коли Plugin більше не потрібен.

## Список Plugins

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Використовуйте `--json` для скриптів. Він містить діагностику реєстру та статичний `dependencyStatus` кожного Plugin, коли пакет Plugin оголошує `dependencies` або `optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` — це холодна перевірка інвентарю. Вона показує, що OpenClaw може виявити з конфігурації, маніфестів і реєстру Plugin; вона не доводить, що вже запущений процес Gateway імпортував runtime Plugin.

## Установлення Plugins

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

Після встановлення коду Plugin перезапустіть Gateway, який обслуговує ваші канали:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Використовуйте `inspect --runtime`, коли вам потрібен доказ, що Plugin зареєстрував runtime-поверхні, як-от інструменти, hooks, сервіси, методи Gateway або команди CLI, що належать Plugin.

## Оновлення Plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Якщо Plugin було встановлено з npm dist-tag, такого як `@beta`, подальші виклики `update <plugin-id>` повторно використовують цей записаний тег. Передавання явної npm-специфікації перемикає відстежуване встановлення на цю специфікацію для майбутніх оновлень.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Друга команда повертає Plugin до стандартної лінії випусків реєстру, якщо раніше він був закріплений за точною версією або тегом.

Коли `openclaw update` виконується на beta-каналі, записи Plugin npm і ClawHub зі стандартної лінії спочатку пробують відповідний випуск Plugin `@beta`. Якщо такого beta-випуску не існує, OpenClaw повертається до записаної специфікації default/latest. Для npm Plugins OpenClaw також повертається назад, коли beta-пакет існує, але не проходить перевірку встановлення. Точні версії та явні теги, як-от `@rc` або `@beta`, зберігаються.

## Видалення Plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Видалення прибирає конфігураційний запис Plugin, запис індексу Plugin, записи списків дозволу/заборони та пов’язані шляхи завантаження, коли це застосовно. Керовані каталоги встановлення видаляються, якщо не передано `--keep-files`.

У режимі Nix (`OPENCLAW_NIX_MODE=1`) команди встановлення, оновлення, видалення, увімкнення та вимкнення Plugin вимкнені. Натомість керуйте цими виборами у джерелі Nix для встановлення; для nix-openclaw використовуйте agent-first [Швидкий старт](https://github.com/openclaw/nix-openclaw#quick-start).

## Публікація Plugins

Ви можете публікувати зовнішні Plugins у [ClawHub](https://clawhub.ai), npmjs.com або в обох місцях.

### Публікація в ClawHub

ClawHub є основною публічною поверхнею виявлення для OpenClaw Plugins. Він надає користувачам метадані з пошуком, історію версій і результати сканування реєстру перед встановленням.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Користувачі встановлюють із ClawHub так:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

Коротка форма все одно спочатку перевіряє ClawHub.

### Публікація в npmjs.com

Нативні npm Plugins повинні містити маніфест Plugin і метадані entrypoint OpenClaw у `package.json`.

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

Користувачі встановлюють лише з npm так:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Якщо той самий пакет також доступний у ClawHub, `npm:` пропускає пошук у ClawHub і примусово використовує розв’язання через npm.

## Вибір джерела

- **ClawHub**: використовуйте, коли вам потрібні нативне для OpenClaw виявлення, підсумки сканування, версії та підказки щодо встановлення.
- **npmjs.com**: використовуйте, коли ви вже постачаєте JavaScript-пакети або потребуєте npm dist-tags/робочих процесів приватного реєстру.
- **Git**: використовуйте, коли потрібно встановити безпосередньо з гілки, тегу або коміту.
- **Локальний шлях**: використовуйте, коли розробляєте або тестуєте Plugin на тій самій машині.

## Пов’язане

- [Plugins](/uk/tools/plugin) - огляд і усунення несправностей
- [`openclaw plugins`](/uk/cli/plugins) - повна довідка CLI
- [ClawHub](/uk/clawhub/cli) - публікація та операції реєстру
- [Створення Plugins](/uk/plugins/building-plugins) - створення пакета Plugin
- [Маніфест Plugin](/uk/plugins/manifest) - маніфест і метадані пакета
