---
read_when:
    - Вам потрібні швидкі приклади встановлення, перегляду списку, оновлення або видалення Plugin
    - Ви хочете вибрати між ClawHub і розповсюдженням плагінів через npm
    - Ви публікуєте пакет Plugin
sidebarTitle: Manage plugins
summary: Короткі приклади встановлення, перегляду списку, видалення, оновлення та публікації плагінів OpenClaw
title: Керування Plugin
x-i18n:
    generated_at: "2026-05-02T19:23:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: c5a1c58da41b243cebe1c163048918a94c492b77fdae1613bd008cb267670041
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Більшість робочих процесів із Plugin складаються з кількох команд: пошук, установлення, перезапуск Gateway, перевірка та видалення, коли Plugin більше не потрібен.

## Список plugins

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

## Установлення plugins

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

Після встановлення коду Plugin перезапустіть Gateway, який обслуговує ваші канали:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Використовуйте `inspect --runtime`, коли потрібен доказ, що Plugin зареєстрував runtime-поверхні, як-от інструменти, hooks, сервіси, методи Gateway або CLI-команди, що належать Plugin.

## Оновлення plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Якщо Plugin було встановлено з npm dist-tag, наприклад `@beta`, наступні виклики `update <plugin-id>` повторно використовують цей записаний тег. Передавання явної npm-специфікації перемикає відстежуване встановлення на цю специфікацію для майбутніх оновлень.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Друга команда повертає Plugin до стандартної лінії релізів реєстру, якщо раніше він був закріплений за точною версією або тегом.

Коли `openclaw update` виконується в beta-каналі, записи npm і ClawHub Plugin зі стандартної лінії спершу намагаються використати відповідний реліз Plugin `@beta`. Якщо такого beta-релізу не існує, OpenClaw повертається до записаної стандартної/останньої специфікації. Точні версії та явні теги, як-от `@rc` або `@beta`, зберігаються.

## Видалення plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Видалення прибирає запис конфігурації Plugin, запис індексу Plugin, записи списків дозволів/заборон і пов’язані шляхи завантаження, коли це застосовно. Керовані каталоги встановлення видаляються, якщо не передати `--keep-files`.

## Публікація plugins

Ви можете публікувати зовнішні plugins у [ClawHub](https://clawhub.ai), npmjs.com або в обох місцях.

### Публікація в ClawHub

ClawHub — це основна публічна поверхня виявлення для plugins OpenClaw. Вона надає користувачам доступні для пошуку метадані, історію версій і результати сканування реєстру до встановлення.

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

Коротка форма все одно спершу перевіряє ClawHub.

### Публікація в npmjs.com

Нативні npm plugins мають містити маніфест Plugin і метадані entrypoint OpenClaw у `package.json`.

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

- **ClawHub**: використовуйте, коли потрібні нативне для OpenClaw виявлення, підсумки сканування, версії та підказки щодо встановлення.
- **npmjs.com**: використовуйте, коли ви вже постачаєте пакети JavaScript або потребуєте workflows npm dist-tags/приватного реєстру.
- **Git**: використовуйте, коли хочете встановлювати безпосередньо з гілки, тегу або коміту.
- **Локальний шлях**: використовуйте, коли розробляєте або тестуєте Plugin на тій самій машині.

## Пов’язане

- [Plugins](/uk/tools/plugin) - огляд і усунення несправностей
- [`openclaw plugins`](/uk/cli/plugins) - повна довідка CLI
- [ClawHub](/uk/tools/clawhub) - публікація та операції реєстру
- [Створення plugins](/uk/plugins/building-plugins) - створення пакета Plugin
- [Маніфест Plugin](/uk/plugins/manifest) - маніфест і метадані пакета
