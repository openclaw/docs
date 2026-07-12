---
read_when:
    - Ви хочете видалити OpenClaw із комп’ютера
    - Служба Gateway продовжує працювати після видалення
summary: Повне видалення OpenClaw (CLI, служби, стану та робочого простору)
title: Видалення
x-i18n:
    generated_at: "2026-07-12T13:27:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84f01dc11defe6f19c89232375e48bad383b2e71379f47f43e759d3d7bb908b5
    source_path: install/uninstall.md
    workflow: 16
---

Два способи:

- **Простий спосіб**, якщо `openclaw` усе ще встановлено.
- **Видалення служби вручну**, якщо CLI вже немає, але служба все ще працює.

## Простий спосіб (CLI усе ще встановлено)

Рекомендовано скористатися вбудованим засобом видалення:

```bash
openclaw uninstall
```

Під час видалення стану налаштовані каталоги робочих просторів зберігаються, якщо також не вибрати `--workspace`.

Попередньо перегляньте, що буде видалено (безпечно):

```bash
openclaw uninstall --dry-run --all
```

Неінтерактивний режим (автоматизація / npx). Використовуйте обережно й лише після перевірки областей видалення:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Прапорці `--service`, `--state`, `--workspace`, `--app` вибирають окремі області; `--all` вибирає всі чотири.

Кроки вручну (той самий результат):

1. Зупиніть службу Gateway:

```bash
openclaw gateway stop
```

2. Видаліть службу Gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Видаліть стан і конфігурацію:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Якщо для `OPENCLAW_CONFIG_PATH` указано власне розташування поза каталогом стану, також видаліть цей файл.
Якщо потрібно зберегти робочий простір усередині каталогу стану, наприклад `~/.openclaw/workspace`, перемістіть його в інше місце перед запуском `rm -rf` або вибірково видаліть вміст каталогу стану.

4. Видаліть робочий простір (необов’язково; видаляє файли агента):

```bash
rm -rf ~/.openclaw/workspace
```

5. Видаліть установлену CLI (виберіть використаний спосіб):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Якщо встановлено застосунок для macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Примітки:

- Якщо використовувалися профілі (`--profile` / `OPENCLAW_PROFILE`), повторіть крок 3 для кожного каталогу стану (типові каталоги — `~/.openclaw-<profile>`).
- У віддаленому режимі каталог стану розташований на **хості Gateway**, тому також виконайте там кроки 1–4.

## Видалення служби вручну (CLI не встановлено)

Скористайтеся цим способом, якщо служба Gateway продовжує працювати, але `openclaw` відсутній.

### macOS (launchd)

Типова мітка — `ai.openclaw.gateway` (або `ai.openclaw.<profile>` за використання профілю):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Якщо використовувався профіль, замініть мітку та назву plist-файлу на `ai.openclaw.<profile>`.

### Linux (користувацький модуль systemd)

Типова назва модуля — `openclaw-gateway.service` (або `openclaw-gateway-<profile>.service`). На комп’ютерах, оновлених із дуже старих версій, може досі існувати модуль зі старою назвою `clawdbot-gateway.service`; `openclaw uninstall` / `openclaw gateway uninstall` автоматично виявляє та видаляє його.

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (заплановане завдання)

Типова назва завдання — `OpenClaw Gateway` (або `OpenClaw Gateway (<profile>)`).
Завдання запускає без вікна сценарій `gateway.vbs` із каталогу стану, який, своєю чергою,
запускає `gateway.cmd`; видаліть обидва файли.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Якщо використовувався профіль, видаліть відповідне завдання та файли `gateway.cmd` /
`gateway.vbs` у каталозі `~\.openclaw-<profile>`.

## Звичайне встановлення та клонована копія вихідного коду

### Звичайне встановлення (install.sh / npm / pnpm / bun)

Якщо використовувався `https://openclaw.ai/install.sh` або `install.ps1`, CLI було встановлено командою `npm install -g openclaw@latest`.
Видаліть його командою `npm rm -g openclaw` (або `pnpm remove -g` / `bun remove -g`, якщо встановлення виконувалося цим способом).

### Клонована копія вихідного коду (git clone)

Якщо запуск виконується з клонованої копії репозиторію (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Видаліть службу Gateway **перед** видаленням репозиторію (скористайтеся простим способом вище або видаленням служби вручну).
2. Видаліть каталог репозиторію.
3. Видаліть стан і робочий простір, як показано вище.

## Пов’язані матеріали

- [Огляд встановлення](/uk/install)
- [Посібник із міграції](/uk/install/migrating)
