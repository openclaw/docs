---
read_when:
    - Вы хотите удалить OpenClaw с компьютера
    - Служба Gateway продолжает работать после удаления
summary: Полное удаление OpenClaw (CLI, служба, состояние, рабочее пространство)
title: Удаление
x-i18n:
    generated_at: "2026-07-13T18:17:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 84f01dc11defe6f19c89232375e48bad383b2e71379f47f43e759d3d7bb908b5
    source_path: install/uninstall.md
    workflow: 16
---

Два способа:

- **Простой способ**, если `openclaw` всё ещё установлен.
- **Удаление службы вручную**, если CLI уже удалён, но служба всё ещё работает.

## Простой способ (CLI всё ещё установлен)

Рекомендуется использовать встроенное средство удаления:

```bash
openclaw uninstall
```

При удалении состояния настроенные каталоги рабочих пространств сохраняются, если дополнительно не выбрать `--workspace`.

Предварительно просмотреть, что будет удалено (безопасно):

```bash
openclaw uninstall --dry-run --all
```

Неинтерактивный режим (автоматизация / npx). Используйте с осторожностью и только после проверки областей удаления:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Флаги `--service`, `--state`, `--workspace`, `--app` выбирают отдельные области; `--all` выбирает все четыре.

Действия вручную (тот же результат):

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

Если для `OPENCLAW_CONFIG_PATH` задано пользовательское расположение вне каталога состояния, также удалите этот файл.
Если вы хотите сохранить рабочее пространство внутри каталога состояния, например `~/.openclaw/workspace`, переместите его в другое место перед запуском `rm -rf` либо удалите содержимое состояния выборочно.

4. Удалите рабочее пространство (необязательно; удаляет файлы агента):

```bash
rm -rf ~/.openclaw/workspace
```

5. Удалите установленный CLI (выберите использованный способ):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Если вы установили приложение для macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Примечания:

- Если вы использовали профили (`--profile` / `OPENCLAW_PROFILE`), повторите шаг 3 для каждого каталога состояния (по умолчанию — `~/.openclaw-<profile>`).
- В удалённом режиме каталог состояния находится на **хосте Gateway**, поэтому выполните там также шаги 1–4.

## Удаление службы вручную (CLI не установлен)

Используйте этот способ, если служба Gateway продолжает работать, но `openclaw` отсутствует.

### macOS (launchd)

Метка по умолчанию — `ai.openclaw.gateway` (или `ai.openclaw.<profile>` при использовании профиля):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Если вы использовали профиль, замените метку и имя файла plist на `ai.openclaw.<profile>`.

### Linux (пользовательский модуль systemd)

Имя модуля по умолчанию — `openclaw-gateway.service` (или `openclaw-gateway-<profile>.service`). Модуль с прежним именем `clawdbot-gateway.service` может по-прежнему присутствовать на компьютерах, обновлённых с очень старых установок; `openclaw uninstall` / `openclaw gateway uninstall` автоматически обнаруживает и удаляет его.

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (запланированная задача)

Имя задачи по умолчанию — `OpenClaw Gateway` (или `OpenClaw Gateway (<profile>)`).
Задача запускает без отображения окна сценарий `gateway.vbs` в каталоге состояния, который, в свою очередь,
запускает `gateway.cmd`; удалите оба файла.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Если вы использовали профиль, удалите соответствующую задачу и файлы `gateway.cmd` /
`gateway.vbs` в каталоге `~\.openclaw-<profile>`.

## Обычная установка и рабочая копия исходного кода

### Обычная установка (install.sh / npm / pnpm / bun)

Если вы использовали `https://openclaw.ai/install.sh` или `install.ps1`, CLI был установлен с помощью `npm install -g openclaw@latest`.
Удалите его с помощью `npm rm -g openclaw` (или `pnpm remove -g` / `bun remove -g`, если использовался соответствующий способ установки).

### Рабочая копия исходного кода (git clone)

Если вы запускаете OpenClaw из рабочей копии репозитория (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Удалите службу Gateway **до** удаления репозитория (используйте описанный выше простой способ или удаление службы вручную).
2. Удалите каталог репозитория.
3. Удалите состояние и рабочее пространство, как показано выше.

## См. также

- [Обзор установки](/ru/install)
- [Руководство по миграции](/ru/install/migrating)
