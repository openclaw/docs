---
read_when:
    - Встановлення OpenClaw у Windows
    - Вибір між Windows Hub, нативною Windows і WSL2
    - Налаштування супровідного застосунку Windows або режиму вузла Windows
summary: 'Підтримка Windows: Windows Hub, нативні CLI та Gateway, налаштування Gateway у WSL2, режим Node і усунення несправностей'
title: Windows
x-i18n:
    generated_at: "2026-06-27T17:47:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7c7bde33f27bce6c1136ccf688547ee82750d317a997c4a45b354c52ae1b690
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw постачається з нативним супутнім застосунком **Windows Hub** і підтримкою Windows CLI.
Використовуйте Windows Hub, коли потрібен настільний застосунок із налаштуванням, станом у треї, чатом,
діагностикою Command Center і можливостями вузла Windows. Використовуйте інсталятор PowerShell,
коли потрібні CLI/Gateway напряму. Використовуйте WSL2, коли потрібне
найбільш сумісне з Linux середовище виконання Gateway.

## Рекомендовано: Windows Hub

Windows Hub — це нативний супутній застосунок WinUI для Windows 10 20H2+ і Windows 11. Він установлюється без прав адміністратора та публікується з підписаними
інсталяторами x64 і ARM64 у релізах OpenClaw.

Завантажте найновіший стабільний інсталятор зі [сторінки релізів OpenClaw](https://github.com/openclaw/openclaw/releases):

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-arm64.exe)
- [Контрольні суми](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-SHA256SUMS.txt)

Якщо посилання для завантаження вище повертає 404, перейдіть на [сторінку релізів](https://github.com/openclaw/openclaw/releases) і знайдіть ресурси `OpenClawCompanion-Setup-*` в останньому релізі.

Після встановлення запустіть **OpenClaw Companion** з меню «Пуск» або системного
трея. Інсталятор також додає ярлики для налаштування Gateway, чату, параметрів,
перевірки оновлень і видалення.

### Що входить до Windows Hub

- стан у системному треї та запуск під час входу
- початкове налаштування для локального Gateway у WSL, яким володіє застосунок
- параметри підключення для локальних, віддалених і тунельованих через SSH Gateway
- нативне вікно чату та доступ до браузерного Control UI
- діагностика Command Center для сеансів, використання, каналів, вузлів, сполучення та
  команд відновлення
- режим вузла Windows для керованих агентом canvas, екрана, камери, сповіщень,
  стану пристрою, перетворення тексту на мовлення, перетворення мовлення на текст і контрольованого `system.run`
- режим локального сервера MCP для клієнтів MCP, як-от Claude Desktop, Claude Code і
  Cursor

### Перший запуск

Під час першого запуску Windows Hub відкриває налаштування, якщо немає придатного збереженого Gateway.
Найшвидший шлях — **Налаштувати локально**, що створює WSL-дистрибутив
`OpenClawGateway`, яким володіє застосунок, установлює всередині нього Gateway і сполучає застосунок.
Це не експортує й не змінює ваш наявний дистрибутив Ubuntu.

Виберіть **Розширене налаштування** або відкрийте вкладку Connections, якщо у вас уже є
Gateway. Ви можете підключитися до:

- локального Gateway на цьому ПК
- WSL Gateway на цьому ПК
- віддаленого Gateway за URL і токеном або кодом налаштування
- Gateway, доступного через SSH-тунель

Коли налаштування завершиться, піктограма в треї стане зеленою. Відкрийте **Command Center** із
трея, щоб підтвердити підключення, сполучення, стан вузла та справність каналу.

## Режим вузла Windows

Windows Hub може реєструватися як повноцінний вузол OpenClaw. Після цього агент може використовувати
оголошені нативні можливості Windows через Gateway.

Поширені команди:

- `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`,
  `canvas.snapshot`
- `screen.snapshot` і, з явною згодою, `screen.record`
- `camera.list` і, з явною згодою, `camera.snap`, `camera.clip`
- `system.notify`, `system.run`, `system.run.prepare`, `system.which`
- `location.get`, `device.info`, `device.status`
- `stt.transcribe`, `tts.speak`

Режим вузла потребує сполучення з Gateway. Якщо застосунок показує запит на сполучення, схваліть
його з хоста Gateway:

```powershell
openclaw devices list
openclaw devices approve <request-id>
openclaw nodes status
```

Gateway пересилає лише команди, які вузол оголошує і які дозволяє політика сервера.
Команди, чутливі до приватності, як-от `screen.record`, `camera.snap` і
`camera.clip`, потребують явної згоди `gateway.nodes.allowCommands`.

## Режим локального MCP

Windows Hub може надавати той самий реєстр нативних можливостей Windows як локальний
сервер MCP на loopback. Це корисно, коли потрібно, щоб локальні клієнти MCP керували
можливостями Windows без запущеного OpenClaw Gateway.

Увімкніть його в параметрах Windows Hub у розділі для розробників/розширених налаштувань. Застосунок
показує endpoint loopback і bearer token після ввімкнення сервера.

Матриця режимів:

| Режим вузла | Сервер MCP | Поведінка                          |
| ----------- | ---------- | ---------------------------------- |
| вимкнено    | вимкнено   | Настільний застосунок лише для оператора |
| увімкнено   | вимкнено   | Підключений до Gateway вузол Windows |
| вимкнено    | увімкнено  | Лише локальний сервер MCP          |
| увімкнено   | увімкнено  | Вузол Gateway плюс локальний сервер MCP |

## Нативні Windows CLI і Gateway

Для роботи передусім із термінала встановіть OpenClaw з PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Перевірте:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

Нативні сценарії Windows CLI і Gateway підтримуються й надалі вдосконалюються.
Керований запуск використовує Windows Scheduled Tasks, коли вони доступні. Завдання зберігає
читабельний скрипт `gateway.cmd` у каталозі стану OpenClaw, але запускає його через
згенеровану обгортку WScript `gateway.vbs`, щоб фоновий Gateway не відкривав
видимого вікна консолі. Якщо створення завдання заборонено, OpenClaw повертається до
елемента входу в папці Startup для поточного користувача.

Щоб установити службу Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Якщо потрібне лише використання CLI без керованої служби Gateway:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2 Gateway

WSL2 лишається найбільш сумісним із Linux середовищем виконання Gateway у Windows. Windows Hub
може налаштувати для вас WSL Gateway, яким володіє застосунок, або ви можете встановити вручну всередині
власного дистрибутива.

Ручне налаштування:

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Увімкніть systemd усередині WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Перезапустіть WSL з PowerShell:

```powershell
wsl --shutdown
```

Потім установіть OpenClaw усередині WSL за допомогою швидкого старту для Linux:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Автозапуск Gateway до входу у Windows

Для headless-налаштувань WSL переконайтеся, що повний ланцюг завантаження виконується навіть тоді, коли ніхто не входить
у Windows.

Усередині WSL:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

У PowerShell від імені адміністратора:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

Замініть `Ubuntu` на назву вашого дистрибутива з:

```powershell
wsl --list --verbose
```

> **Примітка:** Дві зміни порівняно зі старішими рецептами:
>
> - **`dbus-launch true` замість `/bin/true`** — У WSL ≥ 2.6.1.0 регресія ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)) призводить до завершення дистрибутива через 15-20 секунд після виходу останнього клієнта, навіть якщо linger увімкнено. `dbus-launch true` як обхідний шлях підтримує процес-нащадок init активним ([обговорення спільноти, microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
> - **`/ru "$env:USERNAME"` замість `/ru SYSTEM`** — WSL-дистрибутиви для окремих користувачів (типове налаштування) не видимі для облікового запису SYSTEM; завдання нібито виконується, але дистрибутив ніколи не запускається. Запуск від власного облікового запису уникає цього. Windows попросить ваш пароль під час створення завдання.

Після перезавантаження перевірте з WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Надання доступу до служб WSL через LAN

WSL має власну віртуальну мережу. Якщо інший комп’ютер має отримати доступ до служби всередині
WSL, перенаправте порт Windows на поточну IP-адресу WSL. IP-адреса WSL може змінюватися після
перезапусків, тому за потреби оновлюйте правило перенаправлення.

Приклад у PowerShell від імені адміністратора:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Примітки:

- SSH з іншого комп’ютера спрямовується на IP-адресу хоста Windows, наприклад
  `ssh user@windows-host -p 2222`.
- Віддалені вузли мають вказувати досяжний URL Gateway, а не `127.0.0.1`.
- Використовуйте `listenaddress=0.0.0.0` для доступу з LAN. Використовуйте `127.0.0.1` для доступу лише локально.

## Усунення несправностей

### Піктограма в треї не з’являється

Перевірте Task Manager на наявність `OpenClaw.Tray.WinUI.exe`. Якщо він запущений, відкрийте
область прихованих піктограм трея та закріпіть його. Якщо він не запущений, запустіть **OpenClaw
Companion** з меню «Пуск».

### Локальне налаштування завершується невдало

Відкрийте журнал налаштування з Windows Hub або перевірте:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Поширені причини: вимкнений WSL, заблокована віртуалізація, застарілий стан WSL,
яким володіє застосунок, або збій мережі під час встановлення пакета Gateway.

### Застосунок повідомляє, що потрібне сполучення

Схваліть запит оператора або вузла з Gateway:

```powershell
openclaw devices list
openclaw devices approve <request-id>
```

Якщо пристрій уже мав токен, перепідключіться з вкладки Connections після
схвалення.

### Вебчат не може досягти віддаленого Gateway

Віддалений вебчат потребує HTTPS або localhost. Для самопідписаних сертифікатів довірте
сертифікат у Windows або використовуйте SSH-тунель до URL localhost.

### `screen.snapshot`, камера або аудіокоманди не працюють

Підтвердьте дозволи Windows для камери, мікрофона, захоплення екрана та
сповіщень. Пакетні інсталяції оголошують захищені можливості, але Windows
усе одно може запитати дозвіл під час першого використання команди.

### Не працює підключення до Git або GitHub

Деякі мережі блокують або обмежують HTTPS до GitHub. Якщо `git clone` або `gh auth
login` завершується невдало, спробуйте іншу мережу, VPN або HTTP/HTTPS-проксі.

Для автентифікації `gh` на основі токена в поточному сеансі:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Ніколи не комітьте токени й не вставляйте їх в issues або pull requests.

## Пов’язане

- [Огляд установлення](/uk/install)
- [Налаштування Node.js](/uk/install/node)
- [Вузли](/uk/nodes)
- [Control UI](/uk/web/control-ui)
- [Конфігурація Gateway](/uk/gateway/configuration)
