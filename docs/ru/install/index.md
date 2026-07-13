---
read_when:
    - Вам нужен способ установки, отличный от быстрого старта в разделе «Начало работы»
    - Вы хотите выполнить развертывание на облачной платформе
    - Вам нужно обновить, перенести или удалить
summary: Установка OpenClaw — скрипт установки, npm/pnpm/bun, установка из исходного кода, Docker и другие способы
title: Установка
x-i18n:
    generated_at: "2026-07-13T18:15:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: dc6c6c33294852c90d2d2904b78ff8b0483b8e72a380d5835c5bdda67547de0c
    source_path: install/index.md
    workflow: 16
---

## Системные требования

- **Node 22.22.3+, 24.15+ или 25.9+** — Node 24 является целевой версией по умолчанию; установочный скрипт настраивает её автоматически.
- **macOS, Linux или Windows** — пользователи Windows могут начать с нативного приложения Windows Hub, установщика CLI для PowerShell или Gateway в WSL2. См. раздел [Windows](/ru/platforms/windows).
- `pnpm` требуется только при сборке из исходного кода.

## Рекомендуемый способ: установочный скрипт

Самый быстрый способ установки. Он определяет вашу ОС, при необходимости устанавливает Node, устанавливает OpenClaw и запускает первоначальную настройку.

<Note>
Пользователи настольной версии Windows также могут установить нативное вспомогательное приложение [Windows Hub](/ru/platforms/windows#recommended-windows-hub), которое включает первоначальную настройку, отображение состояния в системном трее, чат, режим Node и локальный режим MCP.
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

Чтобы установить без запуска первоначальной настройки:

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

Все флаги и параметры для CI и автоматизации описаны в разделе [Внутреннее устройство установщика](/ru/install/installer).

## Альтернативные способы установки

### Установщик с локальным префиксом (`install-cli.sh`)

Используйте этот способ, если хотите разместить OpenClaw и Node под локальным префиксом, например
`~/.openclaw`, не завися от общесистемной установки Node:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

По умолчанию поддерживается установка через npm, а также установка из рабочей копии git в рамках того же
процесса с префиксом. Полная справка: [Внутреннее устройство установщика](/ru/install/installer#install-clish).

Уже установили? Переключайтесь между установками из пакета и git с помощью
`openclaw update --channel dev` и `openclaw update --channel stable`. См.
[Обновление](/ru/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm или bun

Если вы самостоятельно управляете Node:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Размещённый установщик сбрасывает фильтры актуальности npm, такие как `min-release-age`,
    при установке пакета OpenClaw. Если вы устанавливаете его вручную через npm, продолжает
    действовать ваша собственная политика npm.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm требует явного разрешения для пакетов со скриптами сборки. Выполните `pnpm approve-builds -g` после первой установки.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun может установить глобальный пакет, но полученный исполняемый файл `openclaw` требует поддерживаемой среды выполнения Node, поскольку состояние OpenClaw использует `node:sqlite`.
    </Note>

  </Tab>
</Tabs>

### Из исходного кода

Для участников разработки и всех, кто хочет запускать OpenClaw из локальной рабочей копии:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Либо пропустите создание ссылки и используйте `pnpm openclaw ...` внутри репозитория. Полные сведения о рабочих процессах разработки см. в разделе [Настройка](/ru/start/setup).

### Установка из основной рабочей копии GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Контейнеры и менеджеры пакетов

<CardGroup cols={2}>
  <Card title="Docker" href="/ru/install/docker" icon="container">
    Развёртывание в контейнере или без графического интерфейса.
  </Card>
  <Card title="Podman" href="/ru/install/podman" icon="container">
    Альтернатива Docker для контейнеров без прав root.
  </Card>
  <Card title="Nix" href="/ru/install/nix" icon="snowflake">
    Декларативная установка через Nix flake.
  </Card>
  <Card title="Ansible" href="/ru/install/ansible" icon="server">
    Автоматизированное развёртывание на группе машин.
  </Card>
  <Card title="Bun" href="/ru/install/bun" icon="zap">
    Необязательный установщик зависимостей и средство запуска скриптов пакетов.
  </Card>
</CardGroup>

## Проверка установки

```bash
openclaw --version      # проверьте доступность CLI
openclaw doctor         # проверьте наличие проблем с конфигурацией
openclaw gateway status # убедитесь, что Gateway запущен
```

Если после установки требуется управляемый запуск:

- macOS: LaunchAgent через `openclaw onboard --install-daemon` или `openclaw gateway install`
- Linux/WSL2: пользовательская служба systemd через те же команды
- Нативная Windows: сначала Scheduled Task, а если создание задачи запрещено — резервный вариант в виде элемента входа в папке Startup для текущего пользователя

## Хостинг и развёртывание

Разверните OpenClaw на облачном сервере или VPS. Полный список вариантов
провайдеров (DigitalOcean, Hetzner, Hostinger, Fly.io, GCP, Azure, Railway,
Northflank, Oracle Cloud, Raspberry Pi и другие) приведён в разделе [Сервер Linux](/ru/vps); также можно выполнить декларативное развёртывание на
[Render](/ru/install/render).

<CardGroup cols={3}>
  <Card title="VPS" href="/ru/vps">
    Выберите провайдера.
  </Card>
  <Card title="Виртуальная машина Docker" href="/ru/install/docker-vm-runtime">
    Общие шаги для Docker.
  </Card>
  <Card title="Kubernetes" href="/ru/install/kubernetes">
    Развёртывание в K8s.
  </Card>
</CardGroup>

## Обновление, перенос или удаление

<CardGroup cols={3}>
  <Card title="Обновление" href="/ru/install/updating" icon="refresh-cw">
    Поддерживайте OpenClaw в актуальном состоянии.
  </Card>
  <Card title="Перенос" href="/ru/install/migrating" icon="arrow-right">
    Перенесите OpenClaw на новый компьютер.
  </Card>
  <Card title="Удаление" href="/ru/install/uninstall" icon="trash-2">
    Полностью удалите OpenClaw.
  </Card>
</CardGroup>

## Устранение неполадок: `openclaw` не найден

Почти всегда проблема связана с PATH: каталог глобальных исполняемых файлов npm отсутствует в `PATH` вашей оболочки. Полное решение, включая путь в Windows, приведено в разделе [Устранение неполадок Node.js](/ru/install/node#troubleshooting).

```bash
node -v           # установлен ли Node?
npm prefix -g     # где находятся глобальные пакеты?
echo "$PATH"      # присутствует ли каталог глобальных исполняемых файлов в PATH?
```
