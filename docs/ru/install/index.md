---
read_when:
    - Вам нужен способ установки, отличный от краткого руководства по началу работы
    - Вы хотите развернуть на облачной платформе
    - Вам нужно обновить, перенести или удалить
summary: Установка OpenClaw — скрипт установщика, npm/pnpm/bun, из исходного кода, Docker и многое другое
title: Установка
x-i18n:
    generated_at: "2026-06-28T23:06:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8c6108cecea3e38a6f714758fe4de9b01eebe1c89f9ff68251685c440e8a41f
    source_path: install/index.md
    workflow: 16
---

## Системные требования

- **Node 24** (рекомендуется) или Node 22.19+ - установочный скрипт обрабатывает это автоматически
- **macOS, Linux или Windows** - пользователи Windows могут начать с нативного приложения Windows Hub, установщика CLI для PowerShell или WSL2 Gateway. См. [Windows](/ru/platforms/windows).
- `pnpm` нужен только при сборке из исходного кода

## Рекомендуется: установочный скрипт

Самый быстрый способ установки. Он определяет вашу ОС, при необходимости устанавливает Node, устанавливает OpenClaw и запускает первичную настройку.

<Note>
Пользователи Windows на настольных компьютерах также могут установить нативное сопутствующее приложение [Windows Hub](/ru/platforms/windows#recommended-windows-hub), которое включает настройку, статус в трее, чат, режим узла и локальный режим MCP.
</Note>

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

Чтобы установить без запуска первичной настройки:

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

Все флаги и параметры CI/автоматизации см. в разделе [Внутреннее устройство установщика](/ru/install/installer).

## Альтернативные способы установки

### Установщик с локальным префиксом (`install-cli.sh`)

Используйте этот вариант, если хотите держать OpenClaw и Node в локальном префиксе, например
`~/.openclaw`, без зависимости от общесистемной установки Node:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

По умолчанию он поддерживает установку через npm, а также установку из git checkout в рамках того же
потока с префиксом. Полная справка: [Внутреннее устройство установщика](/ru/install/installer#install-clish).

Уже установлено? Переключайтесь между установками из пакета и из git с помощью
`openclaw update --channel dev` и `openclaw update --channel stable`. См.
[Обновление](/ru/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm или bun

Если вы уже управляете Node самостоятельно:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Размещенный установщик сбрасывает фильтры свежести npm, такие как `min-release-age`,
    для установки пакета OpenClaw. Если вы устанавливаете вручную через npm, ваша собственная
    политика npm все равно применяется.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm требует явного одобрения для пакетов со скриптами сборки. Выполните `pnpm approve-builds -g` после первой установки.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun поддерживается для глобального пути установки CLI. Для среды выполнения Gateway рекомендуемой средой выполнения демона остается Node.
    </Note>

  </Tab>
</Tabs>

### Из исходного кода

Для участников разработки или всех, кто хочет запускать из локального checkout:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Или пропустите связывание и используйте `pnpm openclaw ...` внутри репозитория. Полные рабочие процессы разработки см. в разделе [Настройка](/ru/start/setup).

### Установка из checkout основной ветки GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Контейнеры и менеджеры пакетов

<CardGroup cols={2}>
  <Card title="Docker" href="/ru/install/docker" icon="container">
    Контейнеризованные или безголовые развертывания.
  </Card>
  <Card title="Podman" href="/ru/install/podman" icon="container">
    Rootless-альтернатива Docker для контейнеров.
  </Card>
  <Card title="Nix" href="/ru/install/nix" icon="snowflake">
    Декларативная установка через Nix flake.
  </Card>
  <Card title="Ansible" href="/ru/install/ansible" icon="server">
    Автоматизированная подготовка парка машин.
  </Card>
  <Card title="Bun" href="/ru/install/bun" icon="zap">
    Использование только CLI через среду выполнения Bun.
  </Card>
</CardGroup>

## Проверка установки

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

Если после установки нужен управляемый запуск:

- macOS: LaunchAgent через `openclaw onboard --install-daemon` или `openclaw gateway install`
- Linux/WSL2: пользовательская служба systemd через те же команды
- Нативная Windows: сначала Scheduled Task, с резервным элементом входа в пользовательской папке Startup, если создание задачи запрещено

## Хостинг и развертывание

Разверните OpenClaw на облачном сервере или VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/ru/vps">
    Любой Linux VPS.
  </Card>
  <Card title="Docker VM" href="/ru/install/docker-vm-runtime">
    Общие шаги для Docker.
  </Card>
  <Card title="Kubernetes" href="/ru/install/kubernetes">
    Развертывание K8s.
  </Card>
  <Card title="Fly.io" href="/ru/install/fly">
    Развертывание на Fly.io.
  </Card>
  <Card title="Hetzner" href="/ru/install/hetzner">
    Развертывание в Hetzner.
  </Card>
  <Card title="GCP" href="/ru/install/gcp">
    Развертывание в Google Cloud.
  </Card>
  <Card title="Azure" href="/ru/install/azure">
    Развертывание в Azure.
  </Card>
  <Card title="Railway" href="/ru/install/railway">
    Развертывание в Railway.
  </Card>
  <Card title="Render" href="/ru/install/render">
    Развертывание в Render.
  </Card>
  <Card title="Northflank" href="/ru/install/northflank">
    Развертывание в Northflank.
  </Card>
</CardGroup>

## Обновление, миграция или удаление

<CardGroup cols={3}>
  <Card title="Обновление" href="/ru/install/updating" icon="refresh-cw">
    Поддерживайте OpenClaw в актуальном состоянии.
  </Card>
  <Card title="Миграция" href="/ru/install/migrating" icon="arrow-right">
    Перенос на новую машину.
  </Card>
  <Card title="Удаление" href="/ru/install/uninstall" icon="trash-2">
    Полностью удалите OpenClaw.
  </Card>
</CardGroup>

## Устранение неполадок: `openclaw` не найден

Если установка прошла успешно, но `openclaw` не найден в вашем терминале:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

Если `$(npm prefix -g)/bin` отсутствует в вашем `$PATH`, добавьте его в файл запуска вашей оболочки (`~/.zshrc` или `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Затем откройте новый терминал. Подробнее см. в разделе [Настройка Node](/ru/install/node).
