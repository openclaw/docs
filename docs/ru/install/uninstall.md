---
read_when:
    - Вы хотите удалить OpenClaw с компьютера
    - Служба Gateway всё ещё работает после удаления
summary: Полное удаление OpenClaw (CLI, сервис, состояние, рабочая область)
title: Удаление
x-i18n:
    generated_at: "2026-06-28T23:08:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0f63bde2769b3d35d928aed1668121086a2952338f2634d45d55da8cc637025b
    source_path: install/uninstall.md
    workflow: 16
---

Два пути:

- **Простой путь**, если `openclaw` все еще установлен.
- **Ручное удаление службы**, если CLI удален, но служба все еще работает.

## Простой путь (CLI все еще установлен)

Рекомендуется: используйте встроенный деинсталлятор:

```bash
openclaw uninstall
```

При использовании CLI удаление состояния сохраняет настроенные каталоги рабочих областей, если вы также не выберете `--workspace`.

Предварительно посмотреть, что будет удалено (безопасно):

```bash
openclaw uninstall --dry-run --all
```

Неинтерактивно (автоматизация / npx). Используйте с осторожностью и только после подтверждения областей удаления:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Ручные шаги (тот же результат):

1. Остановите службу Gateway:

```bash
openclaw gateway stop
```

2. Удалите службу Gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Удалите состояние и конфигурацию:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Если вы задали `OPENCLAW_CONFIG_PATH` в пользовательском расположении вне каталога состояния, удалите и этот файл.
Если вы хотите сохранить рабочую область внутри каталога состояния, например `~/.openclaw/workspace`, переместите ее в сторону перед запуском `rm -rf` или удалите содержимое состояния выборочно.

4. Удалите рабочую область (необязательно, удаляет файлы агентов):

```bash
rm -rf ~/.openclaw/workspace
```

5. Удалите установленный CLI (выберите тот вариант, который использовали):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Если вы установили приложение macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Примечания:

- Если вы использовали профили (`--profile` / `OPENCLAW_PROFILE`), повторите шаг 3 для каждого каталога состояния (по умолчанию это `~/.openclaw-<profile>`).
- В удаленном режиме каталог состояния находится на **хосте Gateway**, поэтому выполните шаги 1-4 и там.

## Ручное удаление службы (CLI не установлен)

Используйте это, если служба Gateway продолжает работать, но `openclaw` отсутствует.

### macOS (launchd)

Метка по умолчанию: `ai.openclaw.gateway` (или `ai.openclaw.<profile>`; устаревшие `com.openclaw.*` могут все еще существовать):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Если вы использовали профиль, замените метку и имя plist на `ai.openclaw.<profile>`. Удалите все устаревшие plist `com.openclaw.*`, если они есть.

### Linux (пользовательский unit systemd)

Имя unit по умолчанию: `openclaw-gateway.service` (или `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (запланированная задача)

Имя задачи по умолчанию: `OpenClaw Gateway` (или `OpenClaw Gateway (<profile>)`).
Скрипт задачи находится в каталоге состояния как `gateway.cmd`; текущие установки могут
также создавать средство запуска `gateway.vbs` без окна, которое Планировщик заданий запускает вместо
прямого открытия `gateway.cmd`.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Если вы использовали профиль, удалите соответствующее имя задачи и файлы `gateway.cmd` /
`gateway.vbs` в `~\.openclaw-<profile>`.

## Обычная установка и checkout исходного кода

### Обычная установка (install.sh / npm / pnpm / bun)

Если вы использовали `https://openclaw.ai/install.sh` или `install.ps1`, CLI был установлен через `npm install -g openclaw@latest`.
Удалите его командой `npm rm -g openclaw` (или `pnpm remove -g` / `bun remove -g`, если вы устанавливали этим способом).

### Checkout исходного кода (git clone)

Если вы запускаете из checkout репозитория (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Удалите службу Gateway **до** удаления репозитория (используйте простой путь выше или ручное удаление службы).
2. Удалите каталог репозитория.
3. Удалите состояние и рабочую область, как показано выше.

## Связанное

- [Обзор установки](/ru/install)
- [Руководство по миграции](/ru/install/migrating)
