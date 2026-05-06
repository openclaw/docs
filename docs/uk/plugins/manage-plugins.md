---
read_when:
    - Вам потрібні швидкі приклади встановлення, перегляду списку, оновлення або видалення Plugin
    - Ви хочете вибрати між розповсюдженням Plugin через ClawHub і npm
    - Ви публікуєте пакет Plugin
sidebarTitle: Manage plugins
summary: Швидкі приклади встановлення, перегляду списку, видалення, оновлення та публікації плагінів OpenClaw
title: Керування плагінами
x-i18n:
    generated_at: "2026-05-06T12:51:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265777b03434dd07caee6191765c34e17fda4c8347e0327c2f37d47f9dd7a054
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Більшість робочих процесів із plugins зводяться до кількох команд: пошук, встановлення, перезапуск Gateway,
перевірка та видалення, коли plugin більше не потрібен.

## Список plugins

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Використовуйте `--json` для scripts. Він містить діагностику registry та статичний
`dependencyStatus` кожного plugin, коли package plugin оголошує `dependencies` або
`optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` — це холодна перевірка inventory. Вона показує, що OpenClaw може виявити
з config, manifests і registry plugin; вона не доводить, що вже запущений процес
Gateway імпортував runtime plugin.

## Встановлення plugins

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

Після встановлення коду plugin перезапустіть Gateway, який обслуговує ваші channels:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Використовуйте `inspect --runtime`, коли потрібен доказ, що plugin зареєстрував runtime
surfaces, як-от tools, hooks, services, методи Gateway або CLI-команди, що належать plugin.

## Оновлення plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Якщо plugin було встановлено з npm dist-tag, наприклад `@beta`, подальші виклики
`update <plugin-id>` повторно використовують цей записаний tag. Передавання явного npm spec
перемикає відстежуване встановлення на цей spec для майбутніх оновлень.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Друга команда повертає plugin до стандартної release line registry,
якщо раніше він був закріплений за точною версією або tag.

Коли `openclaw update` запускається на beta channel, записи npm і ClawHub
plugins зі стандартною лінією спершу пробують відповідний release plugin `@beta`. Якщо такого beta
release не існує, OpenClaw повертається до записаного default/latest spec.
Для npm plugins OpenClaw також виконує fallback, коли beta package існує, але не проходить
install validation. Точні версії та явні tags, як-от `@rc` або `@beta`,
зберігаються.

## Видалення plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Видалення прибирає config entry plugin, запис index plugin, записи allow/deny list
і linked load paths, коли це застосовно. Managed install directories
видаляються, якщо не передати `--keep-files`.

У режимі Nix (`OPENCLAW_NIX_MODE=1`) команди встановлення, оновлення, видалення, увімкнення
та вимкнення plugins вимкнено. Натомість керуйте цими виборами в Nix source для
встановлення; для nix-openclaw використовуйте agent-first
[Швидкий старт](https://github.com/openclaw/nix-openclaw#quick-start).

## Публікація plugins

Ви можете публікувати зовнішні plugins у [ClawHub](https://clawhub.ai), npmjs.com або
в обох.

### Публікація в ClawHub

ClawHub — основна публічна поверхня виявлення для OpenClaw plugins. Він надає
користувачам searchable metadata, version history і registry scan results перед
встановленням.

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

Скорочена форма все одно спершу перевіряє ClawHub.

### Публікація в npmjs.com

Native npm plugins мають містити manifest plugin і metadata entrypoint OpenClaw
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

Користувачі встановлюють npm-only так:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Якщо той самий package також доступний у ClawHub, `npm:` пропускає пошук у ClawHub і
примусово використовує npm resolution.

## Вибір джерела

- **ClawHub**: використовуйте, коли потрібні OpenClaw-native discovery, scan summaries,
  versions і install hints.
- **npmjs.com**: використовуйте, коли ви вже постачаєте JavaScript packages або потребуєте npm
  dist-tags/private registry workflows.
- **Git**: використовуйте, коли потрібно встановити безпосередньо з branch, tag або commit.
- **Local path**: використовуйте, коли розробляєте або тестуєте plugin на тій самій
  машині.

## Пов’язане

- [Plugins](/uk/tools/plugin) - огляд і усунення несправностей
- [`openclaw plugins`](/uk/cli/plugins) - повний довідник CLI
- [ClawHub](/uk/tools/clawhub) - публікація та операції registry
- [Створення plugins](/uk/plugins/building-plugins) - створення package plugin
- [Manifest plugin](/uk/plugins/manifest) - manifest і package metadata
