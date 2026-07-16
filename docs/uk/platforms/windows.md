---
read_when:
    - Установлення OpenClaw у Windows
    - Вибір між Windows Hub, нативною Windows і WSL2
    - Налаштування допоміжного застосунку Windows або режиму вузла Windows
summary: 'Підтримка Windows: Windows Hub, нативні CLI та Gateway, налаштування Gateway у WSL2, режим Node й усунення несправностей'
title: Windows
x-i18n:
    generated_at: "2026-07-16T18:10:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f1a756d3af3898f211c27c34e16bbcc08f71e214ca1e0d5680c15a091ae1c2ca
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw постачається з нативним супутнім застосунком **Windows Hub** і підтримкою CLI у Windows.
Використовуйте Windows Hub як настільний застосунок із налаштуванням, станом у системному треї, чатом, діагностикою Командного центру та можливостями вузла Windows. Використовуйте інсталятор PowerShell
безпосередньо для CLI/Gateway. Використовуйте WSL2 для середовища виконання Gateway,
найсуміснішого з Linux.

## Рекомендовано: Windows Hub

Windows Hub — це нативний супутній застосунок WinUI для Windows 10 20H2+ і
Windows 11. Він установлюється без прав адміністратора й постачається у вигляді підписаних інсталяторів x64
та ARM64 на власній сторінці випусків.

Windows Hub публікується незалежно від OpenClaw CLI та Gateway. Завантажте
останній стабільний інсталятор Hub зі
[сторінки випусків Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases/latest)
або безпосередньо через `releases/latest/download`:

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)

Якщо наведене вище посилання повертає помилку 404, перейдіть на [сторінку випусків Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases)
і відкрийте найновіший стабільний випуск Windows Hub. Звичайні стабільні випуски OpenClaw
також містять дзеркальну копію закріпленої та перевіреної для випуску збірки Windows Hub; ця копія може відставати від
новішого окремого випуску Hub.

Після встановлення запустіть **OpenClaw Companion** з меню Start або системного
трея. Інсталятор також додає ярлики для налаштування Gateway, чату, параметрів,
перевірки оновлень і видалення.

### Що містить Windows Hub

- Стан у системному треї та запуск під час входу.
- Початкове налаштування локального WSL Gateway, яким керує застосунок.
- Параметри підключення для локальних, віддалених і доступних через SSH-тунель Gateway.
- Нативне вікно чату та доступ до браузерного інтерфейсу керування.
- Діагностика Командного центру для сеансів, використання, каналів, вузлів, спарювання
  та команд відновлення.
- Режим вузла Windows для керованих агентом полотна, екрана, камери,
  сповіщень, стану пристрою, мовлення та контрольованого `system.run`.
- Режим локального сервера MCP для клієнтів MCP, як-от Claude Desktop, Claude Code
  і Cursor.

### Перший запуск

Під час першого запуску Windows Hub відкриває налаштування, якщо немає придатного збереженого
Gateway. Найшвидший шлях — **Налаштувати локально**, що створює
керований застосунком дистрибутив WSL `OpenClawGateway`, установлює в ньому Gateway і
спарює застосунок. Це не експортує й не змінює наявний дистрибутив Ubuntu.

Виберіть **Розширене налаштування** або відкрийте вкладку Підключення, якщо Gateway
уже є. Можна підключитися до:

- локального Gateway на цьому ПК
- WSL Gateway на цьому ПК
- віддаленого Gateway за URL-адресою та токеном або кодом налаштування
- Gateway, доступного через SSH-тунель

Після завершення налаштування піктограма в треї стає зеленою. Відкрийте **Командний центр** із
трея, щоб перевірити підключення, спарювання, стан вузла та працездатність каналів.

## Режим вузла Windows

Windows Hub може зареєструватися як вузол OpenClaw, щоб агент міг використовувати оголошені
нативні можливості Windows через Gateway. Команди вузла мають бути
оголошені вузлом і дозволені політикою Gateway до їх виконання; повну модель
дозволів і заборон див. у розділі [Вузли](/uk/nodes#command-policy).

Поширені команди:

| Сімейство | Команди                                                                              |
| ------ | ------------------------------------------------------------------------------------ |
| Полотно | `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot` |
| Екран | `screen.snapshot`; `screen.record` потребує явного погодження                          |
| Камера | `camera.list`; `camera.snap`, `camera.clip` потребують явного погодження                  |
| Система | `system.notify`, `system.run`, `system.run.prepare`, `system.which`                  |
| Пристрій | `location.get`, `device.info`, `device.status`                                       |
| Мовлення   | `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`, `talk.speak`  |

Режим вузла потребує спарювання з Gateway. Якщо застосунок показує запит на спарювання,
схваліть його на хості Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Gateway пересилає лише команди, оголошені вузлом і
дозволені політикою сервера. Команди, чутливі з погляду приватності, як-от `screen.record`, `camera.snap`
і `camera.clip`, потребують явного погодження `gateway.nodes.allowCommands`.

## Режим локального MCP

Windows Hub може надавати той самий реєстр нативних можливостей Windows як локальний
сервер MCP у loopback-інтерфейсі, щоб локальні клієнти MCP могли керувати можливостями Windows
без запущеного OpenClaw Gateway.

Увімкніть його в параметрах Windows Hub у розділі для розробників/розширених параметрів. Після ввімкнення сервера
застосунок показує loopback-кінцеву точку й токен-носій.

Матриця режимів:

| Режим вузла | Сервер MCP | Поведінка                           |
| --------- | ---------- | ---------------------------------- |
| вимкнено       | вимкнено        | Настільний застосунок лише для оператора          |
| увімкнено        | вимкнено        | Вузол Windows, підключений до Gateway     |
| вимкнено       | увімкнено         | Лише локальний сервер MCP              |
| увімкнено        | увімкнено         | Вузол Gateway і локальний сервер MCP |

## Нативні Windows CLI та Gateway

Для використання насамперед із термінала встановіть OpenClaw через PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Перевірте:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

Для керованого запуску використовуються заплановані завдання Windows, якщо вони доступні. Завдання зберігає
читабельний сценарій `gateway.cmd` у каталозі стану OpenClaw, але запускає його
через згенеровану оболонку WScript `gateway.vbs`, тому фоновий Gateway
не відкриває видимого вікна консолі. Якщо створення завдання заборонено, OpenClaw
переходить до елемента входу в папці автозавантаження поточного користувача.

Установіть службу Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Для використання лише CLI без керованої служби Gateway:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2 Gateway

WSL2 залишається середовищем виконання Gateway у Windows, найсуміснішим із Linux. Windows
Hub може налаштувати керований застосунком WSL Gateway або його можна встановити вручну
у власному дистрибутиві.

Ручне налаштування:

```powershell
wsl --install
# Або явно виберіть дистрибутив:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Увімкніть systemd у WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Перезапустіть WSL із PowerShell:

```powershell
wsl --shutdown
```

Потім установіть OpenClaw у WSL за допомогою посібника швидкого початку для Linux:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Автозапуск Gateway до входу у Windows

Для безголових конфігурацій WSL переконайтеся, що повний ланцюжок завантаження виконується, навіть якщо ніхто
не входить у Windows.

У WSL:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

У PowerShell від імені адміністратора:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

Замініть `Ubuntu` назвою свого дистрибутива з:

```powershell
wsl --list --verbose
```

<Note>
Дві зміни порівняно зі старішими інструкціями:

- **`dbus-launch true` замість `/bin/true`**: у WSL >= 2.6.1.0
  регресія ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416))
  завершує роботу неактивного дистрибутива через 15-20 секунд після виходу останнього клієнта, навіть
  коли затримку завершення ввімкнено. `dbus-launch true` як обхідний шлях залишає активним
  дочірній процес init
  (обговорення спільноти: [microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
- **`/ru "$env:USERNAME"` замість `/ru SYSTEM`**: дистрибутиви WSL окремих користувачів (
  типове налаштування) не видимі для облікового запису SYSTEM, тому завдання нібито
  виконується, але дистрибутив так і не запускається. Виконання від власного облікового запису
  запобігає цьому; під час створення завдання Windows запитує пароль.

</Note>

Після перезавантаження перевірте з WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Надання доступу до служб WSL через LAN

WSL має власну віртуальну мережу. Якщо іншому комп’ютеру потрібен доступ до служби
у WSL, перенаправте порт Windows на поточну IP-адресу WSL. IP-адреса WSL може
змінюватися після перезапусків, тому за потреби оновлюйте правило перенаправлення.

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

- SSH-підключення з іншого комп’ютера спрямовується на IP-адресу хоста Windows, наприклад `ssh user@windows-host -p 2222`.
- Віддалені вузли мають указувати доступну URL-адресу Gateway, а не `127.0.0.1`.
- Використовуйте `listenaddress=0.0.0.0` для доступу з LAN, а `127.0.0.1` — лише для локального доступу.

## Усунення несправностей

### Піктограма в треї не з’являється

Перевірте наявність `OpenClaw.Tray.WinUI.exe` у Task Manager. Якщо процес виконується, відкрийте
область прихованих піктограм трея та закріпіть його. Якщо ні, запустіть **OpenClaw Companion** з
меню Start.

### Локальне налаштування завершується помилкою

Відкрийте журнал налаштування з Windows Hub або перегляньте:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Поширені причини: вимкнений WSL, заблокована віртуалізація, застарілий стан керованого застосунком WSL
або збій мережі під час установлення пакета Gateway.

### Застосунок повідомляє, що потрібне спарювання

Схваліть запит оператора або вузла в Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

Якщо пристрій уже мав токен, після схвалення повторно підключіться на вкладці Підключення.

### Вебчат не може підключитися до віддаленого Gateway

Для віддаленого вебчату потрібен HTTPS або localhost. Для самопідписаних сертифікатів додайте
сертифікат до довірених у Windows або використовуйте SSH-тунель до URL-адреси localhost.

### Команди `screen.snapshot`, камери або аудіо завершуються помилкою

Перевірте дозволи Windows для камери, мікрофона, захоплення екрана та
сповіщень. Пакетні інсталяції оголошують захищені можливості, але
Windows усе одно може показати запит під час першого використання можливості командою.

### Не працює підключення до Git або GitHub

Деякі мережі блокують або обмежують HTTPS-з’єднання з GitHub. Якщо `git clone` або
`gh auth login` завершується помилкою, спробуйте іншу мережу, VPN або HTTP/HTTPS-проксі.

Для автентифікації `gh` на основі токена в поточному сеансі:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Ніколи не фіксуйте токени в комітах і не вставляйте їх у проблеми чи запити на злиття.

## Пов’язані матеріали

- [Огляд установлення](/uk/install)
- [Налаштування Node.js](/uk/install/node)
- [Вузли](/uk/nodes)
- [Інтерфейс керування](/uk/web/control-ui)
- [Конфігурація Gateway](/uk/gateway/configuration)
