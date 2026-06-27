---
read_when:
    - Ви хочете видалити OpenClaw з комп’ютера
    - Служба gateway досі працює після видалення
summary: Повністю видалити OpenClaw (CLI, службу, стан, робочий простір)
title: Видалення
x-i18n:
    generated_at: "2026-06-27T17:42:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0f63bde2769b3d35d928aed1668121086a2952338f2634d45d55da8cc637025b
    source_path: install/uninstall.md
    workflow: 16
---

Два шляхи:

- **Простий шлях**, якщо `openclaw` досі встановлено.
- **Ручне видалення служби**, якщо CLI вже немає, але служба все ще працює.

## Простий шлях (CLI досі встановлено)

Рекомендовано: скористайтеся вбудованим деінсталятором:

```bash
openclaw uninstall
```

Під час використання CLI видалення стану зберігає налаштовані каталоги робочих просторів, якщо ви також не виберете `--workspace`.

Попередньо перегляньте, що буде видалено (безпечно):

```bash
openclaw uninstall --dry-run --all
```

Неінтерактивно (автоматизація / npx). Використовуйте обережно й лише після підтвердження областей:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Ручні кроки (той самий результат):

1. Зупиніть службу Gateway:

```bash
openclaw gateway stop
```

2. Видаліть службу Gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Видаліть стан + конфігурацію:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Якщо ви встановили `OPENCLAW_CONFIG_PATH` на власне розташування поза каталогом стану, також видаліть цей файл.
Якщо хочете зберегти робочий простір усередині каталогу стану, наприклад `~/.openclaw/workspace`, перемістіть його в інше місце перед запуском `rm -rf` або вибірково видаліть вміст стану.

4. Видаліть свій робочий простір (необов’язково, видаляє файли агента):

```bash
rm -rf ~/.openclaw/workspace
```

5. Видаліть установку CLI (виберіть той варіант, який ви використовували):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Якщо ви встановили застосунок macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Примітки:

- Якщо ви використовували профілі (`--profile` / `OPENCLAW_PROFILE`), повторіть крок 3 для кожного каталогу стану (типові значення: `~/.openclaw-<profile>`).
- У віддаленому режимі каталог стану розташований на **хості Gateway**, тому виконайте кроки 1-4 також там.

## Ручне видалення служби (CLI не встановлено)

Використовуйте це, якщо служба Gateway продовжує працювати, але `openclaw` відсутній.

### macOS (launchd)

Типова мітка: `ai.openclaw.gateway` (або `ai.openclaw.<profile>`; застарілі `com.openclaw.*` можуть усе ще існувати):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Якщо ви використовували профіль, замініть мітку й назву plist на `ai.openclaw.<profile>`. Видаліть будь-які застарілі plist `com.openclaw.*`, якщо вони є.

### Linux (користувацький модуль systemd)

Типова назва модуля: `openclaw-gateway.service` (або `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (заплановане завдання)

Типова назва завдання: `OpenClaw Gateway` (або `OpenClaw Gateway (<profile>)`).
Скрипт завдання розташований у вашому каталозі стану як `gateway.cmd`; поточні встановлення можуть
також створювати безвіконний запусковий файл `gateway.vbs`, який Планувальник завдань запускає замість
безпосереднього відкриття `gateway.cmd`.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Якщо ви використовували профіль, видаліть відповідну назву завдання та файли `gateway.cmd` /
`gateway.vbs` у `~\.openclaw-<profile>`.

## Звичайне встановлення проти checkout вихідного коду

### Звичайне встановлення (install.sh / npm / pnpm / bun)

Якщо ви використовували `https://openclaw.ai/install.sh` або `install.ps1`, CLI було встановлено через `npm install -g openclaw@latest`.
Видаліть його за допомогою `npm rm -g openclaw` (або `pnpm remove -g` / `bun remove -g`, якщо ви встановлювали таким способом).

### Checkout вихідного коду (git clone)

Якщо ви запускаєте з checkout репозиторію (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Видаліть службу Gateway **перед** видаленням репозиторію (скористайтеся простим шляхом вище або ручним видаленням служби).
2. Видаліть каталог репозиторію.
3. Видаліть стан + робочий простір, як показано вище.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Посібник із міграції](/uk/install/migrating)
