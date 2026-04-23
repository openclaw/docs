---
read_when:
    - Вам потрібен спосіб встановлення, відмінний від короткого сценарію в Getting Started
    - Ви хочете розгорнути на хмарній платформі
    - Вам потрібно оновити, перенести або видалити систему
summary: Встановлення OpenClaw — скрипт інсталятора, npm/pnpm/bun, зі source, Docker тощо
title: Встановлення
x-i18n:
    generated_at: "2026-04-23T20:57:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: a30a8c5caa4ae917b09b2362be86800a5ed034c515dd1072fc7001014c10c654
    source_path: install/index.md
    workflow: 15
---

## Рекомендовано: скрипт інсталятора

Найшвидший спосіб встановлення. Він визначає вашу ОС, встановлює Node за потреби, встановлює OpenClaw і запускає onboarding.

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

Щоб встановити без запуску onboarding:

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

Усі прапорці та параметри для CI/автоматизації див. в [Внутрішні механізми інсталятора](/uk/install/installer).

## Системні вимоги

- **Node 24** (рекомендовано) або Node 22.14+ — скрипт інсталятора обробляє це автоматично
- **macOS, Linux або Windows** — підтримуються як нативний Windows, так і WSL2; WSL2 стабільніший. Див. [Windows](/uk/platforms/windows).
- `pnpm` потрібен лише якщо ви збираєте зі source

## Альтернативні способи встановлення

### Інсталятор у локальний prefix (`install-cli.sh`)

Використовуйте це, якщо хочете, щоб OpenClaw і Node зберігалися під локальним prefix, наприклад
`~/.openclaw`, без залежності від системного встановлення Node:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Він типово підтримує npm-встановлення, а також встановлення з git-checkout у тому ж
потоці prefix. Повний довідник: [Внутрішні механізми інсталятора](/uk/install/installer#install-clish).

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
    pnpm вимагає явного схвалення для пакетів зі build-скриптами. Після першого встановлення виконайте `pnpm approve-builds -g`.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun підтримується для шляху глобального встановлення CLI. Для runtime Gateway рекомендованим daemon runtime залишається Node.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Усунення несправностей: помилки збірки sharp (npm)">
  Якщо `sharp` не працює через глобально встановлений libvips:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Зі source

Для контриб’юторів або всіх, хто хоче запускати з локального checkout:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Або пропустіть link і використовуйте `pnpm openclaw ...` зсередини repo. Повні робочі процеси розробки див. в [Налаштування](/uk/start/setup).

### Встановлення з GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Контейнери та пакетні менеджери

<CardGroup cols={2}>
  <Card title="Docker" href="/uk/install/docker" icon="container">
    Контейнеризовані або безголові розгортання.
  </Card>
  <Card title="Podman" href="/uk/install/podman" icon="container">
    Rootless контейнерна альтернатива Docker.
  </Card>
  <Card title="Nix" href="/uk/install/nix" icon="snowflake">
    Декларативне встановлення через Nix flake.
  </Card>
  <Card title="Ansible" href="/uk/install/ansible" icon="server">
    Автоматизоване розгортання у флоті машин.
  </Card>
  <Card title="Bun" href="/uk/install/bun" icon="zap">
    Використання лише CLI через runtime Bun.
  </Card>
</CardGroup>

## Перевірка встановлення

```bash
openclaw --version      # підтвердити, що CLI доступний
openclaw doctor         # перевірити проблеми конфігурації
openclaw gateway status # перевірити, що Gateway запущений
```

Якщо після встановлення ви хочете керований запуск:

- macOS: LaunchAgent через `openclaw onboard --install-daemon` або `openclaw gateway install`
- Linux/WSL2: user service systemd через ті самі команди
- Нативний Windows: спочатку Scheduled Task, із запасним per-user login item у папці Startup, якщо створення завдання заборонене

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
  <Card title="Оновлення" href="/uk/install/updating" icon="refresh-cw">
    Підтримуйте OpenClaw в актуальному стані.
  </Card>
  <Card title="Міграція" href="/uk/install/migrating" icon="arrow-right">
    Перенесіть систему на нову машину.
  </Card>
  <Card title="Видалення" href="/uk/install/uninstall" icon="trash-2">
    Повністю видаліть OpenClaw.
  </Card>
</CardGroup>

## Усунення несправностей: `openclaw` не знайдено

Якщо встановлення пройшло успішно, але `openclaw` не знаходиться у вашому терміналі:

```bash
node -v           # Node встановлено?
npm prefix -g     # Де глобальні пакети?
echo "$PATH"      # Чи є глобальний каталог bin у PATH?
```

Якщо `$(npm prefix -g)/bin` немає у вашому `$PATH`, додайте його у файл запуску shell (`~/.zshrc` або `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Потім відкрийте новий термінал. Докладніше див. в [Налаштування Node](/uk/install/node).
