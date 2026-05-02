---
read_when:
    - Вам потрібні короткі приклади встановлення, виведення списку, оновлення або видалення Plugin
    - Ви хочете вибрати між ClawHub і розповсюдженням плагінів через npm
    - Ви публікуєте пакет Plugin
sidebarTitle: Manage plugins
summary: Короткі приклади встановлення, перегляду списку, видалення, оновлення та публікації плагінів OpenClaw
title: Керування Plugin
x-i18n:
    generated_at: "2026-05-02T21:59:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec25a811b942f155f5d5e4cac475dbef74f0616bc85ff182c74598184e910320
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Більшість робочих процесів із plugin складаються з кількох команд: пошук, установлення, перезапуск Gateway,
перевірка та видалення, коли plugin більше не потрібен.

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

`plugins list` — це холодна перевірка інвентаризації. Вона показує, що OpenClaw може виявити
з конфігурації, маніфестів і реєстру plugin; вона не доводить, що вже запущений
процес Gateway імпортував runtime plugin.

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
openclaw plugins install npm:@openclaw/codex

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Після встановлення коду plugin перезапустіть Gateway, який обслуговує ваші канали:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Використовуйте `inspect --runtime`, коли потрібен доказ, що plugin зареєстрував runtime-
поверхні, як-от інструменти, хуки, сервіси, методи Gateway або CLI-
команди, що належать plugin.

## Оновлення plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Якщо plugin було встановлено з npm dist-tag, наприклад `@beta`, подальші виклики
`update <plugin-id>` повторно використовують цей записаний тег. Передавання явної npm-специфікації
перемикає відстежуване встановлення на цю специфікацію для майбутніх оновлень.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Друга команда повертає plugin до типової лінії випусків реєстру,
якщо раніше він був закріплений за точною версією або тегом.

Коли `openclaw update` запускається на beta-каналі, записи plugin npm і ClawHub
типової лінії спершу пробують відповідний випуск plugin `@beta`. Якщо такого beta-
випуску не існує, OpenClaw повертається до записаної типової/latest специфікації.
Точні версії та явні теги, як-от `@rc` або `@beta`, зберігаються.

## Видалення plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Видалення прибирає запис конфігурації plugin, запис індексу plugin, записи списків allow/deny
і пов’язані шляхи завантаження, коли це застосовно. Керовані каталоги встановлення
видаляються, якщо ви не передали `--keep-files`.

## Публікація plugins

Ви можете публікувати зовнішні plugins у [ClawHub](https://clawhub.ai), npmjs.com або
в обох місцях.

### Публікація в ClawHub

ClawHub — це основна публічна поверхня виявлення для plugins OpenClaw. Він надає
користувачам метадані з пошуком, історію версій і результати сканування реєстру перед
установленням.

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

Форма без префікса все одно спочатку перевіряє ClawHub.

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

Користувачі встановлюють npm-only так:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Якщо той самий пакет також доступний у ClawHub, `npm:` пропускає пошук у ClawHub і
примусово використовує розв’язання через npm.

## Вибір джерела

- **ClawHub**: використовуйте, коли потрібні нативне для OpenClaw виявлення, підсумки сканування,
  версії та підказки щодо встановлення.
- **npmjs.com**: використовуйте, коли ви вже постачаєте пакети JavaScript або потребуєте npm
  dist-tags/робочих процесів приватного реєстру.
- **Git**: використовуйте, коли хочете встановлювати безпосередньо з гілки, тега або коміту.
- **Локальний шлях**: використовуйте, коли розробляєте або тестуєте plugin на тій самій
  машині.

## Пов’язане

- [Plugins](/uk/tools/plugin) - огляд і усунення несправностей
- [`openclaw plugins`](/uk/cli/plugins) - повна довідка CLI
- [ClawHub](/uk/tools/clawhub) - публікація та операції реєстру
- [Створення plugins](/uk/plugins/building-plugins) - створення пакета plugin
- [Маніфест plugin](/uk/plugins/manifest) - маніфест і метадані пакета
