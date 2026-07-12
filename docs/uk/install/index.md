---
read_when:
    - Вам потрібен спосіб встановлення, відмінний від швидкого старту в посібнику з початку роботи
    - Ви хочете розгорнути систему на хмарній платформі
    - Вам потрібно оновити, перенести або видалити
summary: Встановлення OpenClaw — сценарій встановлення, npm/pnpm/bun, встановлення з вихідного коду, Docker тощо
title: Установити
x-i18n:
    generated_at: "2026-07-12T13:26:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc819cc6c1d57af0739a7d11f0f2834479ddabbca0571b105b8cb9325e87b145
    source_path: install/index.md
    workflow: 16
---

## Системні вимоги

- **Node 22.19+, 23.11+ або 24+** — Node 24 є цільовою версією за замовчуванням; сценарій інсталятора налаштовує її автоматично.
- **macOS, Linux або Windows** — користувачі Windows можуть почати з нативного застосунку Windows Hub, інсталятора CLI для PowerShell або Gateway у WSL2. Див. [Windows](/uk/platforms/windows).
- `pnpm` потрібен лише для складання з вихідного коду.

## Рекомендовано: сценарій інсталятора

Найшвидший спосіб установлення. Він визначає вашу ОС, за потреби встановлює Node, установлює OpenClaw і запускає початкове налаштування.

<Note>
Користувачі настільної версії Windows також можуть установити нативний супутній застосунок [Windows Hub](/uk/platforms/windows#recommended-windows-hub), який містить засоби налаштування, індикатор стану в системному треї, чат, режим Node і локальний режим MCP.
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

Щоб установити без запуску початкового налаштування:

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

Усі прапорці та параметри для CI й автоматизації див. у розділі [Внутрішня будова інсталятора](/uk/install/installer).

## Альтернативні способи встановлення

### Інсталятор із локальним префіксом (`install-cli.sh`)

Використовуйте цей спосіб, якщо хочете розмістити OpenClaw і Node під локальним префіксом, наприклад
`~/.openclaw`, без залежності від загальносистемної інсталяції Node:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

За замовчуванням він підтримує встановлення через npm, а також установлення з робочої копії git у межах того самого
процесу з префіксом. Повний довідник: [Внутрішня будова інсталятора](/uk/install/installer#install-clish).

Уже встановили? Перемикайтеся між установленнями з пакета та з git за допомогою
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

    <Note>
    Хостований інсталятор скидає фільтри актуальності npm, як-от `min-release-age`,
    для встановлення пакета OpenClaw. Якщо ви встановлюєте його вручну через npm, ваша власна
    політика npm і надалі застосовується.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm вимагає явного схвалення пакетів зі сценаріями складання. Після першого встановлення виконайте `pnpm approve-builds -g`.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun підтримується для глобального встановлення CLI. Для середовища виконання Gateway рекомендованим середовищем виконання фонової служби залишається Node.
    </Note>

  </Tab>
</Tabs>

### З вихідного коду

Для учасників розробки або тих, хто хоче запускати систему з локальної робочої копії:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Або пропустіть створення посилання й використовуйте `pnpm openclaw ...` у репозиторії. Повні робочі процеси розробки див. у розділі [Налаштування](/uk/start/setup).

### Установлення з основної робочої копії GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Контейнери та менеджери пакетів

<CardGroup cols={2}>
  <Card title="Docker" href="/uk/install/docker" icon="container">
    Контейнеризовані розгортання або розгортання без графічного інтерфейсу.
  </Card>
  <Card title="Podman" href="/uk/install/podman" icon="container">
    Безпривілейована контейнерна альтернатива Docker.
  </Card>
  <Card title="Nix" href="/uk/install/nix" icon="snowflake">
    Декларативне встановлення через Nix flake.
  </Card>
  <Card title="Ansible" href="/uk/install/ansible" icon="server">
    Автоматизоване розгортання парку машин.
  </Card>
  <Card title="Bun" href="/uk/install/bun" icon="zap">
    Використання лише CLI через середовище виконання Bun.
  </Card>
</CardGroup>

## Перевірка встановлення

```bash
openclaw --version      # підтвердити доступність CLI
openclaw doctor         # перевірити наявність проблем із конфігурацією
openclaw gateway status # перевірити, чи працює Gateway
```

Якщо після встановлення потрібен керований запуск:

- macOS: LaunchAgent через `openclaw onboard --install-daemon` або `openclaw gateway install`
- Linux/WSL2: користувацька служба systemd через ті самі команди
- Нативна Windows: спочатку Scheduled Task, а якщо створення завдання заборонено — резервний елемент входу для кожного користувача в папці Startup

## Хостинг і розгортання

Розгорніть OpenClaw на хмарному сервері або VPS. Повний список
постачальників (DigitalOcean, Hetzner, Hostinger, Fly.io, GCP, Azure, Railway,
Northflank, Oracle Cloud, Raspberry Pi тощо) див. у розділі [Сервер Linux](/uk/vps); також можна виконати декларативне розгортання на
[Render](/uk/install/render).

<CardGroup cols={3}>
  <Card title="VPS" href="/uk/vps">
    Виберіть постачальника.
  </Card>
  <Card title="Віртуальна машина Docker" href="/uk/install/docker-vm-runtime">
    Спільні кроки для Docker.
  </Card>
  <Card title="Kubernetes" href="/uk/install/kubernetes">
    Розгортання K8s.
  </Card>
</CardGroup>

## Оновлення, перенесення або видалення

<CardGroup cols={3}>
  <Card title="Оновлення" href="/uk/install/updating" icon="refresh-cw">
    Підтримуйте OpenClaw в актуальному стані.
  </Card>
  <Card title="Перенесення" href="/uk/install/migrating" icon="arrow-right">
    Перенесіть систему на нову машину.
  </Card>
  <Card title="Видалення" href="/uk/install/uninstall" icon="trash-2">
    Повністю видаліть OpenClaw.
  </Card>
</CardGroup>

## Усунення несправностей: `openclaw` не знайдено

Майже завжди це проблема з PATH: глобальний каталог виконуваних файлів npm відсутній у змінній `PATH` вашої оболонки. Повне рішення, зокрема шлях для Windows, див. у розділі [Усунення несправностей Node.js](/uk/install/node#troubleshooting).

```bash
node -v           # Node встановлено?
npm prefix -g     # Де розташовані глобальні пакети?
echo "$PATH"      # Чи є глобальний каталог виконуваних файлів у PATH?
```
