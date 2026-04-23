---
read_when:
    - Установлення OpenClaw на Windows
    - Вибір між нативною Windows і WSL2
    - Пошук статусу супутнього застосунку Windows
summary: 'Підтримка Windows: нативні шляхи встановлення й через WSL2, демон і поточні застереження'
title: Windows
x-i18n:
    generated_at: "2026-04-23T21:01:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa786e417e06b245dea4aacdccc63345baa978bf4746a2f0c1df7adb5d1a42ea
    source_path: platforms/windows.md
    workflow: 15
---

OpenClaw підтримує як **нативну Windows**, так і **WSL2**. WSL2 — більш
стабільний шлях і рекомендований для повноцінного досвіду — CLI, Gateway та
інструменти працюють усередині Linux з повною сумісністю. Нативна Windows підходить для
основного використання CLI і Gateway, з деякими застереженнями, наведеними нижче.

Нативні супутні застосунки для Windows заплановані.

## WSL2 (рекомендовано)

- [Початок роботи](/uk/start/getting-started) (використовуйте всередині WSL)
- [Встановлення та оновлення](/uk/install/updating)
- Офіційний посібник WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Статус нативної Windows

Потоки CLI для нативної Windows поліпшуються, але WSL2 усе ще лишається рекомендованим шляхом.

Що сьогодні добре працює в нативній Windows:

- інсталятор із сайту через `install.ps1`
- локальне використання CLI, наприклад `openclaw --version`, `openclaw doctor` і `openclaw plugins list --json`
- вбудований локальний smoke для agent/provider, наприклад:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Поточні застереження:

- `openclaw onboard --non-interactive` усе ще очікує доступний локальний gateway, якщо не передати `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` і `openclaw gateway install` спочатку намагаються використовувати Windows Scheduled Tasks
- якщо створення Scheduled Task заборонено, OpenClaw переходить до елемента автозапуску в Startup folder для конкретного користувача і негайно запускає gateway
- якщо сам `schtasks` зависає або перестає відповідати, OpenClaw тепер швидко перериває цей шлях і переходить до резервного варіанту замість вічного зависання
- Scheduled Tasks усе ще мають пріоритет, коли доступні, тому що забезпечують кращий статус supervisor

Якщо вам потрібен лише нативний CLI, без встановлення сервісу gateway, використовуйте один із цих варіантів:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Якщо вам потрібен керований автозапуск у нативній Windows:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Якщо створення Scheduled Task заблоковано, резервний режим сервісу все одно автозапускатиметься після входу в систему через Startup folder поточного користувача.

## Gateway

- [Runbook Gateway](/uk/gateway)
- [Конфігурація](/uk/gateway/configuration)

## Встановлення сервісу Gateway (CLI)

Усередині WSL2:

```
openclaw onboard --install-daemon
```

Або:

```
openclaw gateway install
```

Або:

```
openclaw configure
```

Коли з’явиться запит, виберіть **Gateway service**.

Відновлення/міграція:

```
openclaw doctor
```

## Автозапуск Gateway до входу в Windows

Для headless-налаштувань переконайтеся, що повний ланцюжок запуску працює, навіть коли ніхто не входить у
Windows.

### 1) Дозвольте користувацьким сервісам працювати без входу

Усередині WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Установіть user service Gateway OpenClaw

Усередині WSL:

```bash
openclaw gateway install
```

### 3) Запускайте WSL автоматично під час завантаження Windows

У PowerShell від імені адміністратора:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Замініть `Ubuntu` на назву вашого дистрибутива з:

```powershell
wsl --list --verbose
```

### Перевірка ланцюжка запуску

Після перезавантаження (до входу в Windows) перевірте з WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Додатково: відкрити служби WSL у LAN (portproxy)

WSL має власну віртуальну мережу. Якщо іншій машині потрібно досягти сервісу,
що працює **всередині WSL** (SSH, локальний TTS-сервер або Gateway), ви маєте
перенаправити порт Windows на поточну IP-адресу WSL. IP-адреса WSL змінюється після перезапусків,
тому вам може знадобитися оновлювати правило перенаправлення.

Приклад (PowerShell **від імені адміністратора**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Дозвольте порт через Windows Firewall (один раз):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Оновіть portproxy після перезапуску WSL:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Примітки:

- SSH з іншої машини має націлюватися на **IP хоста Windows** (наприклад: `ssh user@windows-host -p 2222`).
- Віддалені Node мають вказувати на **досяжний** URL Gateway (а не `127.0.0.1`); для перевірки
  використовуйте `openclaw status --all`.
- Використовуйте `listenaddress=0.0.0.0` для доступу з LAN; `127.0.0.1` залишає доступ лише локальним.
- Якщо ви хочете автоматизувати це, зареєструйте Scheduled Task, щоб запускати крок оновлення
  під час входу в систему.

## Покрокове встановлення WSL2

### 1) Установіть WSL2 + Ubuntu

Відкрийте PowerShell (Admin):

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Перезавантажтеся, якщо Windows попросить.

### 2) Увімкніть systemd (потрібно для встановлення gateway)

У вашому терміналі WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Потім у PowerShell:

```powershell
wsl --shutdown
```

Повторно відкрийте Ubuntu, а потім перевірте:

```bash
systemctl --user status
```

### 3) Установіть OpenClaw (усередині WSL)

Для звичайного першого налаштування всередині WSL дотримуйтеся потоку Linux Getting Started:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Якщо ви розробляєте з вихідного коду замість первинного onboarding, використовуйте
цикл розробки з вихідного коду з [Setup](/uk/start/setup):

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

Повний посібник: [Початок роботи](/uk/start/getting-started)

## Супутній застосунок Windows

У нас ще немає супутнього застосунку для Windows. Внески вітаються, якщо ви хочете
допомогти зробити це реальністю.
