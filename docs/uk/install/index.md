---
read_when:
    - Вам потрібен спосіб встановлення, відмінний від короткого посібника «Початок роботи»
    - Ви хочете розгорнути на хмарній платформі
    - Потрібно оновити, мігрувати або видалити
summary: Установлення OpenClaw — скрипт інсталятора, npm/pnpm/bun, з вихідного коду, Docker тощо
title: Встановлення
x-i18n:
    generated_at: "2026-06-27T17:41:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8c6108cecea3e38a6f714758fe4de9b01eebe1c89f9ff68251685c440e8a41f
    source_path: install/index.md
    workflow: 16
---

## Системні вимоги

- **Node 24** (рекомендовано) або Node 22.19+ - скрипт інсталятора обробляє це автоматично
- **macOS, Linux або Windows** - користувачі Windows можуть почати з нативної програми Windows Hub, інсталятора CLI для PowerShell або WSL2 Gateway. Див. [Windows](/uk/platforms/windows).
- `pnpm` потрібен лише якщо ви збираєте з вихідного коду

## Рекомендовано: скрипт інсталятора

Найшвидший спосіб інсталяції. Він визначає вашу ОС, інсталює Node за потреби, інсталює OpenClaw і запускає первинне налаштування.

<Note>
Користувачі робочого стола Windows також можуть інсталювати нативну супровідну програму [Windows Hub](/uk/platforms/windows#recommended-windows-hub), яка містить налаштування, статус у треї, чат, режим Node і локальний режим MCP.
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

Щоб інсталювати без запуску первинного налаштування:

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

Усі прапорці та параметри CI/автоматизації див. у розділі [Внутрішня робота інсталятора](/uk/install/installer).

## Альтернативні способи інсталяції

### Інсталятор із локальним префіксом (`install-cli.sh`)

Використовуйте це, коли хочете зберігати OpenClaw і Node під локальним префіксом, як-от
`~/.openclaw`, без залежності від загальносистемної інсталяції Node:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

За замовчуванням він підтримує інсталяції npm, а також інсталяції з git-checkout у тому самому
потоці з префіксом. Повна довідка: [Внутрішня робота інсталятора](/uk/install/installer#install-clish).

Уже інстальовано? Перемикайтеся між інсталяціями з пакета та git за допомогою
`openclaw update --channel dev` і `openclaw update --channel stable`. Див.
[Оновлення](/uk/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm або bun

Якщо ви вже керуєте Node самостійно:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Розміщений інсталятор очищує фільтри свіжості npm, такі як `min-release-age`,
    для інсталяції пакета OpenClaw. Якщо ви інсталюєте вручну через npm, ваша власна
    політика npm усе ще застосовується.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm вимагає явного схвалення для пакетів зі скриптами збірки. Запустіть `pnpm approve-builds -g` після першої інсталяції.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun підтримується для шляху глобальної інсталяції CLI. Для середовища виконання Gateway рекомендованим daemon-середовищем виконання залишається Node.
    </Note>

  </Tab>
</Tabs>

### З вихідного коду

Для контриб’юторів або всіх, хто хоче запускати з локального checkout:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Або пропустіть link і використовуйте `pnpm openclaw ...` зсередини репозиторію. Повні робочі процеси розробки див. у [Налаштуванні](/uk/start/setup).

### Інсталяція з checkout GitHub main

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Контейнери та менеджери пакетів

<CardGroup cols={2}>
  <Card title="Docker" href="/uk/install/docker" icon="container">
    Контейнеризовані або безголові розгортання.
  </Card>
  <Card title="Podman" href="/uk/install/podman" icon="container">
    Безrootова контейнерна альтернатива Docker.
  </Card>
  <Card title="Nix" href="/uk/install/nix" icon="snowflake">
    Декларативна інсталяція через Nix flake.
  </Card>
  <Card title="Ansible" href="/uk/install/ansible" icon="server">
    Автоматизоване підготовлення парку машин.
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

Якщо після інсталяції вам потрібен керований запуск:

- macOS: LaunchAgent через `openclaw onboard --install-daemon` або `openclaw gateway install`
- Linux/WSL2: користувацький сервіс systemd через ті самі команди
- Нативна Windows: спочатку Scheduled Task, із резервним per-user елементом входу в Startup-folder, якщо створення завдання заборонено

## Хостинг і розгортання

Розгорніть OpenClaw на хмарному сервері або VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/uk/vps">
    Будь-який Linux VPS.
  </Card>
  <Card title="Docker VM" href="/uk/install/docker-vm-runtime">
    Спільні кроки Docker.
  </Card>
  <Card title="Kubernetes" href="/uk/install/kubernetes">
    Розгортання K8s.
  </Card>
  <Card title="Fly.io" href="/uk/install/fly">
    Розгортання на Fly.io.
  </Card>
  <Card title="Hetzner" href="/uk/install/hetzner">
    Розгортання Hetzner.
  </Card>
  <Card title="GCP" href="/uk/install/gcp">
    Розгортання Google Cloud.
  </Card>
  <Card title="Azure" href="/uk/install/azure">
    Розгортання Azure.
  </Card>
  <Card title="Railway" href="/uk/install/railway">
    Розгортання Railway.
  </Card>
  <Card title="Render" href="/uk/install/render">
    Розгортання Render.
  </Card>
  <Card title="Northflank" href="/uk/install/northflank">
    Розгортання Northflank.
  </Card>
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

Якщо `$(npm prefix -g)/bin` немає у вашому `$PATH`, додайте його до стартового файла оболонки (`~/.zshrc` або `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Потім відкрийте новий термінал. Докладніше див. у [Налаштуванні Node](/uk/install/node).
