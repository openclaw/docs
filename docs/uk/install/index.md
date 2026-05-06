---
read_when:
    - Вам потрібен спосіб встановлення, відмінний від короткого посібника «Початок роботи»
    - Ви хочете виконати розгортання на хмарній платформі
    - Потрібно оновити, перенести або видалити
summary: Встановлення OpenClaw - скрипт інсталятора, npm/pnpm/bun, із вихідного коду, Docker та інше
title: Встановлення
x-i18n:
    generated_at: "2026-05-06T02:09:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d5b38787ad80f91c82aa1fd4020a11c99f440ccbf2e9b9309da336dd5883462
    source_path: install/index.md
    workflow: 16
---

## Системні вимоги

- **Node 24** (рекомендовано) або Node 22.14+ - скрипт інсталятора обробляє це автоматично
- **macOS, Linux або Windows** - підтримуються як нативний Windows, так і WSL2; WSL2 стабільніший. Див. [Windows](/uk/platforms/windows).
- `pnpm` потрібен лише якщо ви збираєте з вихідного коду

## Рекомендовано: скрипт інсталятора

Найшвидший спосіб інсталяції. Він визначає вашу ОС, інсталює Node за потреби, інсталює OpenClaw і запускає початкове налаштування.

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

Щоб інсталювати без запуску початкового налаштування:

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

Для всіх прапорців і параметрів CI/автоматизації див. [Внутрішня робота інсталятора](/uk/install/installer).

## Альтернативні способи інсталяції

### Інсталятор із локальним префіксом (`install-cli.sh`)

Використовуйте це, коли хочете тримати OpenClaw і Node під локальним префіксом, як-от
`~/.openclaw`, без залежності від системної інсталяції Node:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Він стандартно підтримує інсталяції через npm, а також інсталяції з git checkout у тому самому
потоці з префіксом. Повна довідка: [Внутрішня робота інсталятора](/uk/install/installer#install-clish).

Уже інстальовано? Перемикайтеся між інсталяціями з пакета та git за допомогою
`openclaw update --channel dev` і `openclaw update --channel stable`. Див.
[Оновлення](/uk/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm або bun

Якщо ви вже самостійно керуєте Node:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm потребує явного схвалення для пакетів зі скриптами збірки. Запустіть `pnpm approve-builds -g` після першої інсталяції.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun підтримується для шляху глобальної інсталяції CLI. Для середовища виконання Gateway рекомендованим середовищем демона залишається Node.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Troubleshooting: sharp build errors (npm)">
  Якщо `sharp` завершується помилкою через глобально інстальований libvips:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### З вихідного коду

Для контриб’юторів або всіх, хто хоче запускати з локального checkout:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Або пропустіть link і використовуйте `pnpm openclaw ...` зсередини репозиторію. Див. [Налаштування](/uk/start/setup) для повних робочих процесів розробки.

### Інсталяція з GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Контейнери та менеджери пакетів

<CardGroup cols={2}>
  <Card title="Docker" href="/uk/install/docker" icon="container">
    Контейнеризовані або headless-розгортання.
  </Card>
  <Card title="Podman" href="/uk/install/podman" icon="container">
    Rootless контейнерна альтернатива Docker.
  </Card>
  <Card title="Nix" href="/uk/install/nix" icon="snowflake">
    Декларативна інсталяція через Nix flake.
  </Card>
  <Card title="Ansible" href="/uk/install/ansible" icon="server">
    Автоматизоване підготування парку машин.
  </Card>
  <Card title="Bun" href="/uk/install/bun" icon="zap">
    Використання лише CLI через середовище виконання Bun.
  </Card>
</CardGroup>

## Перевірка інсталяції

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

Якщо після інсталяції потрібен керований запуск:

- macOS: LaunchAgent через `openclaw onboard --install-daemon` або `openclaw gateway install`
- Linux/WSL2: користувацький сервіс systemd через ті самі команди
- Нативний Windows: спочатку Scheduled Task, із резервним елементом входу в теку Startup для поточного користувача, якщо створення завдання заборонено

## Хостинг і розгортання

Розгорніть OpenClaw на хмарному сервері або VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/uk/vps">Будь-який Linux VPS</Card>
  <Card title="Docker VM" href="/uk/install/docker-vm-runtime">Спільні кроки Docker</Card>
  <Card title="Kubernetes" href="/uk/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/uk/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/uk/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/uk/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/uk/install/azure">Azure</Card>
  <Card title="Railway" href="/uk/install/railway">Railway</Card>
  <Card title="Render" href="/uk/install/render">Render</Card>
  <Card title="Northflank" href="/uk/install/northflank">Northflank</Card>
</CardGroup>

## Оновлення, міграція або видалення

<CardGroup cols={3}>
  <Card title="Updating" href="/uk/install/updating" icon="refresh-cw">
    Підтримуйте OpenClaw в актуальному стані.
  </Card>
  <Card title="Migrating" href="/uk/install/migrating" icon="arrow-right">
    Перенесіть на нову машину.
  </Card>
  <Card title="Uninstall" href="/uk/install/uninstall" icon="trash-2">
    Повністю видаліть OpenClaw.
  </Card>
</CardGroup>

## Усунення несправностей: `openclaw` не знайдено

Якщо інсталяція успішна, але `openclaw` не знайдено у вашому терміналі:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

Якщо `$(npm prefix -g)/bin` немає у вашому `$PATH`, додайте його до файлу запуску вашої оболонки (`~/.zshrc` або `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Потім відкрийте новий термінал. Докладніше див. [Налаштування Node](/uk/install/node).
