---
read_when:
    - Вам потрібен спосіб встановлення, відмінний від короткого посібника Getting Started
    - Ви хочете розгорнутися на хмарній платформі
    - Вам потрібно оновити, перенести або видалити
summary: Встановлення OpenClaw — скрипт інсталятора, npm/pnpm/bun, із вихідного коду, Docker та інше
title: Встановити
x-i18n:
    generated_at: "2026-04-26T08:50:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8dc6b9511be6bf9060cc150a7c51daf3b6d556dab4a85910094b4b892145cd7
    source_path: install/index.md
    workflow: 15
---

## Системні вимоги

- **Node 24** (рекомендовано) або Node 22.14+ — скрипт інсталятора обробляє це автоматично
- **macOS, Linux або Windows** — підтримуються як нативний Windows, так і WSL2; WSL2 стабільніший. Див. [Windows](/uk/platforms/windows).
- `pnpm` потрібен лише якщо ви збираєте з вихідного коду

## Рекомендовано: скрипт інсталятора

Найшвидший спосіб встановлення. Він визначає вашу ОС, за потреби встановлює Node, встановлює OpenClaw і запускає онбординг.

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

Щоб встановити без запуску онбордингу:

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

Усі прапорці та параметри для CI/автоматизації див. у [Внутрішня будова інсталятора](/uk/install/installer).

## Альтернативні способи встановлення

### Інсталятор із локальним префіксом (`install-cli.sh`)

Використовуйте це, якщо хочете, щоб OpenClaw і Node зберігалися під локальним префіксом, таким як
`~/.openclaw`, без залежності від системно встановленого Node:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Він підтримує встановлення через npm за замовчуванням, а також встановлення з git checkout у межах того самого
потоку з префіксом. Повний довідник: [Внутрішня будова інсталятора](/uk/install/installer#install-clish).

Уже встановлено? Перемикайтеся між пакетними та git-встановленнями за допомогою
`openclaw update --channel dev` і `openclaw update --channel stable`. Див.
[Оновлення](/uk/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm або bun

Якщо ви вже самі керуєте Node:

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
    pnpm вимагає явного підтвердження для пакетів зі скриптами збірки. Після першого встановлення виконайте `pnpm approve-builds -g`.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun підтримується для шляху глобального встановлення CLI. Для середовища виконання Gateway Node залишається рекомендованим середовищем виконання демона.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Усунення несправностей: помилки збірки sharp (npm)">
  Якщо `sharp` завершується з помилкою через глобально встановлений libvips:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Із вихідного коду

Для учасників розробки або всіх, хто хоче запускати з локального checkout:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Або пропустіть link і використовуйте `pnpm openclaw ...` зсередини репозиторію. Див. [Налаштування](/uk/start/setup) для повних робочих процесів розробки.

### Встановлення з GitHub main

```bash
npm install -g github:openclaw/openclaw#main
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
openclaw --version      # підтвердьте, що CLI доступний
openclaw doctor         # перевірте наявність проблем із конфігурацією
openclaw gateway status # перевірте, що Gateway запущено
```

Якщо ви хочете керований автозапуск після встановлення:

- macOS: LaunchAgent через `openclaw onboard --install-daemon` або `openclaw gateway install`
- Linux/WSL2: користувацька служба systemd через ті самі команди
- Нативний Windows: спочатку Scheduled Task, з резервним варіантом у вигляді елемента входу в систему в папці Startup для кожного користувача, якщо створення завдання заборонено

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

## Оновлення, перенесення або видалення

<CardGroup cols={3}>
  <Card title="Оновлення" href="/uk/install/updating" icon="refresh-cw">
    Підтримуйте OpenClaw в актуальному стані.
  </Card>
  <Card title="Перенесення" href="/uk/install/migrating" icon="arrow-right">
    Перемістіть на нову машину.
  </Card>
  <Card title="Видалення" href="/uk/install/uninstall" icon="trash-2">
    Повністю видаліть OpenClaw.
  </Card>
</CardGroup>

## Усунення несправностей: `openclaw` не знайдено

Якщо встановлення було успішним, але `openclaw` не знаходиться у вашому терміналі:

```bash
node -v           # Node встановлено?
npm prefix -g     # Де розташовані глобальні пакети?
echo "$PATH"      # Чи є глобальний каталог bin у PATH?
```

Якщо `$(npm prefix -g)/bin` немає у вашому `$PATH`, додайте його до файлу запуску оболонки (`~/.zshrc` або `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Потім відкрийте новий термінал. Див. [Налаштування Node](/uk/install/node) для докладнішої інформації.
