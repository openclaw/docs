---
read_when:
    - Вам потрібен інший спосіб встановлення, ніж швидкий старт у розділі «Початок роботи»
    - Ви хочете розгорнути систему на хмарній платформі
    - Потрібно оновити, перенести або видалити
summary: Встановлення OpenClaw — скрипт інсталятора, npm/pnpm/bun, встановлення з вихідного коду, Docker тощо
title: Установлення
x-i18n:
    generated_at: "2026-07-16T18:11:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc6c6c33294852c90d2d2904b78ff8b0483b8e72a380d5835c5bdda67547de0c
    source_path: install/index.md
    workflow: 16
---

## Системні вимоги

- **Node 22.22.3+, 24.15+ або 25.9+** — Node 24 є цільовою версією за замовчуванням; скрипт інсталятора обробляє це автоматично.
- **macOS, Linux або Windows** — користувачі Windows можуть почати з нативного застосунку Windows Hub, інсталятора CLI для PowerShell або Gateway у WSL2. Див. [Windows](/uk/platforms/windows).
- `pnpm` потрібен лише для збирання з вихідного коду.

## Рекомендовано: скрипт інсталятора

Найшвидший спосіб установлення. Він визначає вашу ОС, за потреби встановлює Node, установлює OpenClaw і запускає початкове налаштування.

<Note>
Користувачі настільної версії Windows також можуть установити нативний допоміжний застосунок [Windows Hub](/uk/platforms/windows#recommended-windows-hub), який містить засоби налаштування, відображення стану в системному треї, чат, режим Node і локальний режим MCP.
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

Усі прапорці та параметри для CI й автоматизації описано в розділі [Внутрішня будова інсталятора](/uk/install/installer).

## Альтернативні способи встановлення

### Інсталятор із локальним префіксом (`install-cli.sh`)

Використовуйте цей спосіб, якщо потрібно зберігати OpenClaw і Node у каталозі з локальним префіксом, наприклад
`~/.openclaw`, без залежності від загальносистемного встановлення Node:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

За замовчуванням він підтримує встановлення через npm, а також установлення з робочої копії git у межах того самого
процесу з префіксом. Повна довідка: [Внутрішня будова інсталятора](/uk/install/installer#install-clish).

Уже встановлено? Перемикайтеся між установленнями з пакета та git за допомогою
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
    Розміщений інсталятор скидає фільтри актуальності npm, як-от `min-release-age`,
    під час установлення пакета OpenClaw. Якщо ви встановлюєте його вручну через npm, ваша власна
    політика npm усе одно застосовується.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm вимагає явного схвалення пакетів зі скриптами збирання. Виконайте `pnpm approve-builds -g` після першого встановлення.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun може встановити глобальний пакет, але створений виконуваний файл `openclaw` потребує підтримуваного середовища виконання Node, оскільки стан OpenClaw використовує `node:sqlite`.
    </Note>

  </Tab>
</Tabs>

### З вихідного коду

Для учасників розробки або всіх, хто хоче запускати OpenClaw із локальної робочої копії:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Або пропустіть створення посилання та використовуйте `pnpm openclaw ...` у репозиторії. Повний опис процесів розробки див. у розділі [Налаштування](/uk/start/setup).

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
    Декларативне встановлення за допомогою Nix flake.
  </Card>
  <Card title="Ansible" href="/uk/install/ansible" icon="server">
    Автоматизоване підготування парку систем.
  </Card>
  <Card title="Bun" href="/uk/install/bun" icon="zap">
    Необов’язковий інсталятор залежностей і засіб запуску скриптів пакетів.
  </Card>
</CardGroup>

## Перевірка встановлення

```bash
openclaw --version      # переконайтеся, що CLI доступний
openclaw doctor         # перевірте наявність проблем із конфігурацією
openclaw gateway status # переконайтеся, що Gateway працює
```

Якщо після встановлення потрібен керований запуск:

- macOS: LaunchAgent через `openclaw onboard --install-daemon` або `openclaw gateway install`
- Linux/WSL2: користувацька служба systemd через ті самі команди
- Нативна Windows: спочатку Scheduled Task, а якщо створення завдання заборонено — резервний елемент входу в систему в папці Startup для окремого користувача

## Хостинг і розгортання

Розгорніть OpenClaw на хмарному сервері або VPS. Повний перелік
провайдерів (DigitalOcean, Hetzner, Hostinger, Fly.io, GCP, Azure, Railway,
Northflank, Oracle Cloud, Raspberry Pi тощо) див. у розділі [Сервер Linux](/uk/vps); також можна виконати декларативне розгортання на
[Render](/uk/install/render).

<CardGroup cols={3}>
  <Card title="VPS" href="/uk/vps">
    Виберіть провайдера.
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
    Перенесіть на новий комп’ютер.
  </Card>
  <Card title="Видалення" href="/uk/install/uninstall" icon="trash-2">
    Повністю видаліть OpenClaw.
  </Card>
</CardGroup>

## Усунення несправностей: `openclaw` не знайдено

Майже завжди це проблема з PATH: глобальний каталог виконуваних файлів npm відсутній у змінній `PATH` вашої оболонки. Повний спосіб виправлення, зокрема шлях для Windows, див. у розділі [Усунення несправностей Node.js](/uk/install/node#troubleshooting).

```bash
node -v           # Node установлено?
npm prefix -g     # Де розташовані глобальні пакети?
echo "$PATH"      # Чи є глобальний каталог виконуваних файлів у PATH?
```
