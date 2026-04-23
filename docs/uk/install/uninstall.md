---
read_when:
    - Ви хочете видалити OpenClaw з машини
    - Сервіс gateway усе ще працює після видалення
summary: Повністю видалити OpenClaw (CLI, сервіс, state, workspace)
title: Видалення
x-i18n:
    generated_at: "2026-04-23T20:58:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37f96121335e8e29140a2b9e1de9190ce379fc687448fd317b982af52899d2f7
    source_path: install/uninstall.md
    workflow: 15
---

Є два шляхи:

- **Простий шлях**, якщо `openclaw` усе ще встановлено.
- **Ручне видалення сервісу**, якщо CLI вже немає, але сервіс усе ще працює.

## Простий шлях (CLI усе ще встановлено)

Рекомендовано: використовуйте вбудований деінсталятор:

```bash
openclaw uninstall
```

Неінтерактивний режим (автоматизація / npx):

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Ручні кроки (той самий результат):

1. Зупиніть сервіс gateway:

```bash
openclaw gateway stop
```

2. Видаліть сервіс gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Видаліть state + config:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Якщо ви встановили `OPENCLAW_CONFIG_PATH` на користувацьке розташування поза каталогом state, видаліть і цей файл.

4. Видаліть свій workspace (необов’язково, видаляє файли агента):

```bash
rm -rf ~/.openclaw/workspace
```

5. Видаліть встановлений CLI (оберіть той варіант, який ви використовували):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Якщо ви встановлювали застосунок macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Примітки:

- Якщо ви використовували профілі (`--profile` / `OPENCLAW_PROFILE`), повторіть крок 3 для кожного каталогу state (типові значення — `~/.openclaw-<profile>`).
- У віддаленому режимі каталог state розташований на **хості gateway**, тож виконайте кроки 1-4 також там.

## Ручне видалення сервісу (CLI не встановлено)

Використовуйте це, якщо сервіс gateway продовжує працювати, але `openclaw` відсутній.

### macOS (launchd)

Типова мітка — `ai.openclaw.gateway` (або `ai.openclaw.<profile>`; застарілі `com.openclaw.*` також можуть усе ще існувати):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Якщо ви використовували профіль, замініть мітку й ім’я plist на `ai.openclaw.<profile>`. Також видаліть усі наявні застарілі plist `com.openclaw.*`.

### Linux (user unit systemd)

Типова назва unit — `openclaw-gateway.service` (або `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Типова назва завдання — `OpenClaw Gateway` (або `OpenClaw Gateway (<profile>)`).
Скрипт завдання розташований у вашому каталозі state.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

Якщо ви використовували профіль, видаліть відповідну назву завдання і `~\.openclaw-<profile>\gateway.cmd`.

## Звичайне встановлення vs checkout вихідного коду

### Звичайне встановлення (`install.sh` / npm / pnpm / bun)

Якщо ви використовували `https://openclaw.ai/install.sh` або `install.ps1`, CLI було встановлено через `npm install -g openclaw@latest`.
Видаліть його через `npm rm -g openclaw` (або `pnpm remove -g` / `bun remove -g`, якщо ви встановлювали саме так).

### Checkout вихідного коду (git clone)

Якщо ви запускаєте з checkout репозиторію (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Видаліть сервіс gateway **до** видалення репозиторію (використайте простий шлях вище або ручне видалення сервісу).
2. Видаліть каталог репозиторію.
3. Видаліть state + workspace, як показано вище.
