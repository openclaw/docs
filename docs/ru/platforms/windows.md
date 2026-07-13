---
read_when:
    - Установка OpenClaw в Windows
    - Выбор между Windows Hub, нативной Windows и WSL2
    - Настройка сопутствующего приложения для Windows или режима Node в Windows
summary: 'Поддержка Windows: Windows Hub, нативные CLI и Gateway, настройка Gateway в WSL2, режим Node и устранение неполадок'
title: Windows
x-i18n:
    generated_at: "2026-07-13T19:59:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: f1a756d3af3898f211c27c34e16bbcc08f71e214ca1e0d5680c15a091ae1c2ca
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw поставляется с нативным приложением-компаньоном **Windows Hub**, а также поддерживает CLI в Windows.
Используйте Windows Hub как настольное приложение для настройки, отображения состояния в области уведомлений, чата, диагностики Command
Center и возможностей узла Windows. Используйте установщик PowerShell
для непосредственной установки CLI/Gateway. Используйте WSL2 для наиболее
совместимой с Linux среды выполнения Gateway.

## Рекомендуется: Windows Hub

Windows Hub — нативное приложение-компаньон WinUI для Windows 10 20H2+ и
Windows 11. Оно устанавливается без прав администратора и предоставляет подписанные установщики x64
и ARM64 на собственной странице релизов.

Windows Hub выпускается независимо от CLI и Gateway OpenClaw. Загрузите
последний стабильный установщик Hub со
[страницы релизов Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases/latest)
или напрямую через `releases/latest/download`:

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)

Если ссылка выше возвращает ошибку 404, перейдите на [страницу релизов Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases)
и откройте последний стабильный релиз Windows Hub. Обычные стабильные релизы OpenClaw
также содержат зеркальную копию закреплённой и проверенной для релиза сборки Windows Hub; эта копия может отставать от
более нового отдельного релиза Hub.

После установки запустите **OpenClaw Companion** из меню «Пуск» или области
уведомлений. Установщик также добавляет ярлыки Gateway Setup, Chat, Settings,
Check for Updates и удаления приложения.

### Что входит в Windows Hub

- Состояние в области уведомлений и запуск при входе в систему.
- Первоначальная настройка локального WSL Gateway, управляемого приложением.
- Параметры подключения для локальных и удалённых Gateway, а также Gateway через SSH-туннель.
- Нативное окно чата и доступ к браузерному Control UI.
- Диагностика Command Center для сеансов, использования, каналов, узлов, сопряжения
  и команд восстановления.
- Режим узла Windows для управляемых агентом холста, экрана, камеры,
  уведомлений, состояния устройства, речи и контролируемого `system.run`.
- Режим локального сервера MCP для клиентов MCP, таких как Claude Desktop, Claude Code
  и Cursor.

### Первый запуск

При первом запуске Windows Hub открывает настройку, если отсутствует пригодный сохранённый
Gateway. Самый быстрый вариант — **Set up locally**: он подготавливает
управляемый приложением дистрибутив WSL `OpenClawGateway`, устанавливает в него Gateway и
сопрягает приложение. При этом существующий дистрибутив Ubuntu не экспортируется и не изменяется.

Выберите **Advanced setup** или откройте вкладку Connections, если у вас уже есть
Gateway. Можно подключиться к:

- локальному Gateway на этом ПК
- WSL Gateway на этом ПК
- удалённому Gateway по URL и токену или коду настройки
- Gateway, доступному через SSH-туннель

После завершения настройки значок в области уведомлений станет зелёным. Откройте **Command Center** из
области уведомлений, чтобы проверить подключение, сопряжение, состояние узла и работоспособность каналов.

## Режим узла Windows

Windows Hub может зарегистрироваться как узел OpenClaw, чтобы агент мог использовать объявленные
нативные возможности Windows через Gateway. Команды узла должны быть
объявлены узлом и разрешены политикой Gateway до их выполнения; полную модель
разрешений и запретов см. в разделе [Узлы](/ru/nodes#command-policy).

Распространённые команды:

| Семейство | Команды                                                                              |
| ------ | ------------------------------------------------------------------------------------ |
| Холст | `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot` |
| Экран | `screen.snapshot`; `screen.record` требует явного включения                          |
| Камера | `camera.list`; `camera.snap`, `camera.clip` требуют явного включения                  |
| Система | `system.notify`, `system.run`, `system.run.prepare`, `system.which`                  |
| Устройство | `location.get`, `device.info`, `device.status`                                       |
| Речь   | `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`, `talk.speak`  |

Для режима узла требуется сопряжение с Gateway. Если приложение показывает запрос на сопряжение,
подтвердите его на хосте Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Gateway перенаправляет только те команды, которые объявлены узлом и
разрешены политикой сервера. Для чувствительных к конфиденциальности команд, таких как `screen.record`, `camera.snap`
и `camera.clip`, требуется явное включение `gateway.nodes.allowCommands`.

## Режим локального MCP

Windows Hub может предоставлять тот же реестр нативных возможностей Windows в виде локального
сервера MCP на loopback-интерфейсе, чтобы локальные клиенты MCP могли управлять возможностями Windows
без запущенного OpenClaw Gateway.

Включите его в Windows Hub Settings в разделе для разработчиков/расширенных настроек. После включения сервера
приложение покажет loopback-конечную точку и bearer-токен.

Матрица режимов:

| Режим узла | Сервер MCP | Поведение                           |
| --------- | ---------- | ---------------------------------- |
| off       | off        | Настольное приложение только для оператора          |
| on        | off        | Узел Windows, подключённый к Gateway     |
| off       | on         | Только локальный сервер MCP              |
| on        | on         | Узел Gateway и локальный сервер MCP |

## Нативные CLI и Gateway для Windows

Для работы преимущественно через терминал установите OpenClaw из PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Проверка:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

Для управляемого запуска по возможности используются запланированные задачи Windows. Задача сохраняет
читаемый сценарий `gateway.cmd` в каталоге состояния OpenClaw, но запускает его
через сгенерированную оболочку WScript `gateway.vbs`, поэтому фоновый Gateway
не открывает видимое окно консоли. Если создание задачи запрещено, OpenClaw
переключается на элемент автозагрузки текущего пользователя в папке Startup.

Установите службу Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Для использования только CLI без управляемой службы Gateway:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## Gateway в WSL2

WSL2 остаётся наиболее совместимой с Linux средой выполнения Gateway в Windows. Windows
Hub может настроить для вас управляемый приложением WSL Gateway, либо его можно установить вручную
в собственном дистрибутиве.

Ручная настройка:

```powershell
wsl --install
# Или явно выберите дистрибутив:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Включите systemd внутри WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Перезапустите WSL из PowerShell:

```powershell
wsl --shutdown
```

Затем установите OpenClaw внутри WSL, следуя инструкции по быстрому запуску в Linux:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Автозапуск Gateway до входа в Windows

Для WSL без графического интерфейса убедитесь, что вся цепочка загрузки выполняется, даже если никто
не входит в Windows.

Внутри WSL:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

В PowerShell от имени администратора:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

Замените `Ubuntu` именем своего дистрибутива из:

```powershell
wsl --list --verbose
```

<Note>
Два отличия от прежних инструкций:

- **`dbus-launch true` вместо `/bin/true`**: в WSL >= 2.6.1.0
  регрессия ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416))
  завершает бездействующий дистрибутив через 15-20 секунд после выхода последнего клиента, даже
  при включённом linger. `dbus-launch true` в качестве обходного решения поддерживает работу
  дочернего процесса init (обсуждение сообщества: [microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
- **`/ru "$env:USERNAME"` вместо `/ru SYSTEM`**: пользовательские дистрибутивы WSL (
  конфигурация по умолчанию) не видны учётной записи SYSTEM, поэтому задача выглядит
  запущенной, но дистрибутив не запускается. Запуск от собственной учётной записи позволяет
  избежать этого; при создании задачи Windows запросит ваш пароль.

</Note>

После перезагрузки выполните проверку из WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Предоставление доступа к службам WSL по локальной сети

WSL использует собственную виртуальную сеть. Если другой машине требуется доступ к службе
внутри WSL, перенаправьте порт Windows на текущий IP-адрес WSL. IP-адрес WSL может
изменяться после перезапуска, поэтому при необходимости обновляйте правило перенаправления.

Пример в PowerShell от имени администратора:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "IP-адрес WSL не найден." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Примечания:

- При подключении по SSH с другой машины указывайте IP-адрес хоста Windows, например `ssh user@windows-host -p 2222`.
- Удалённые узлы должны указывать доступный URL Gateway, а не `127.0.0.1`.
- Используйте `listenaddress=0.0.0.0` для доступа из локальной сети, а `127.0.0.1` — только для локального доступа.

## Устранение неполадок

### Значок не отображается в области уведомлений

Проверьте наличие `OpenClaw.Tray.WinUI.exe` в диспетчере задач. Если процесс выполняется, откройте
область скрытых значков и закрепите его. Если нет, запустите **OpenClaw Companion** из
меню «Пуск».

### Локальная настройка завершается с ошибкой

Откройте журнал настройки из Windows Hub или просмотрите:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Распространённые причины: отключённый WSL, заблокированная виртуализация, устаревшее состояние
управляемого приложением WSL или сетевая ошибка при установке пакета Gateway.

### Приложение сообщает, что требуется сопряжение

Подтвердите запрос оператора или узла в Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

Если у устройства уже был токен, после подтверждения повторно подключитесь на вкладке Connections.

### Веб-чат не может подключиться к удалённому Gateway

Для удалённого веб-чата требуется HTTPS или localhost. При использовании самоподписанных сертификатов добавьте
сертификат в доверенные в Windows или используйте SSH-туннель к URL на localhost.

### Команды `screen.snapshot`, камеры или аудио завершаются с ошибкой

Проверьте разрешения Windows для камеры, микрофона, захвата экрана и
уведомлений. Упакованные установочные сборки объявляют защищённые возможности, но
Windows всё равно может запросить разрешение при первом использовании соответствующей команды.

### Не работает подключение к Git или GitHub

Некоторые сети блокируют или ограничивают HTTPS-подключения к GitHub. Если `git clone` или
`gh auth login` завершается с ошибкой, попробуйте другую сеть, VPN или прокси-сервер HTTP/HTTPS.

Для аутентификации `gh` на основе токена в текущем сеансе:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Никогда не добавляйте токены в коммиты и не вставляйте их в задачи или запросы на включение изменений.

## Связанные разделы

- [Обзор установки](/ru/install)
- [Настройка Node.js](/ru/install/node)
- [Узлы](/ru/nodes)
- [Control UI](/ru/web/control-ui)
- [Конфигурация Gateway](/ru/gateway/configuration)
