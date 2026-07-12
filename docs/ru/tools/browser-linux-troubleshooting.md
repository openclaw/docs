---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Устранение проблем запуска CDP в Chrome/Brave/Edge/Chromium для управления браузером OpenClaw в Linux
title: Устранение неполадок браузера
x-i18n:
    generated_at: "2026-07-12T11:53:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0256e8ee441802086cd486923060be54f8966b423e5dcb71fc8961bbab5d729
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## Проблема: не удалось запустить Chrome CDP на порту 18800

```json
{ "error": "Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"." }
```

### Основная причина

В Ubuntu и большинстве дистрибутивов Linux команда `apt install chromium` устанавливает
обёртку snap, а не настоящий браузер:

```text
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Ограничения AppArmor в snap мешают OpenClaw запускать и отслеживать
процесс браузера.

Другие распространённые ошибки запуска в Linux:

- `The profile appears to be in use by another Chromium process`: устаревшие
  файлы блокировки `Singleton*` в каталоге управляемого профиля. OpenClaw удаляет
  эти блокировки и выполняет одну повторную попытку, если блокировка указывает на завершившийся процесс
  или процесс на другом хосте.
- `Missing X server or $DISPLAY`: на хосте без сеанса рабочего стола был явно запрошен
  браузер с графическим интерфейсом. В Linux локальные управляемые профили переключаются
  в безголовый режим, если не заданы ни `DISPLAY`, ни `WAYLAND_DISPLAY`.
  Если вы задали `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false` или
  `browser.profiles.<name>.headless: false`, удалите это переопределение режима с графическим интерфейсом, задайте
  `OPENCLAW_BROWSER_HEADLESS=1`, запустите `Xvfb`, выполните
  `openclaw browser start --headless` для однократного управляемого запуска или запускайте
  OpenClaw в полноценном сеансе рабочего стола.

### Решение 1: установите Google Chrome (рекомендуется)

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # при наличии ошибок зависимостей
```

Обновите `~/.openclaw/openclaw.json`:

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### Решение 2: используйте Chromium из snap в режиме только подключения

Если необходимо сохранить Chromium из snap, настройте OpenClaw для подключения
к браузеру, запущенному вручную, вместо его запуска:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

Запустите Chromium вручную:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

При необходимости настройте его автоматический запуск с помощью пользовательской службы systemd:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=Браузер OpenClaw (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

```bash
systemctl --user enable --now openclaw-browser.service
```

### Проверьте работу браузера

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Справочник по конфигурации

| Параметр                         | Описание                                                             | Значение по умолчанию                                              |
| -------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `browser.enabled`                | Включить управление браузером                                        | `true`                                                             |
| `browser.executablePath`         | Путь к исполняемому файлу браузера на базе Chromium (Chrome/Brave/Edge/Chromium) | определяется автоматически (предпочтителен браузер ОС по умолчанию, если он основан на Chromium) |
| `browser.headless`               | Запускать без графического интерфейса                                 | `false`                                                            |
| `OPENCLAW_BROWSER_HEADLESS`      | Переопределение безголового режима локального управляемого браузера для отдельного процесса | не задано                                                          |
| `browser.noSandbox`              | Добавить флаг `--no-sandbox` (необходимо для некоторых конфигураций Linux) | `false`                                                        |
| `browser.attachOnly`             | Не запускать браузер, а только подключаться к уже запущенному         | `false`                                                            |
| `browser.cdpPortRangeStart`      | Начальный локальный порт CDP для автоматически назначаемых профилей   | `18800` (вычисляется на основе порта Gateway)                      |
| `browser.localLaunchTimeoutMs`   | Тайм-аут обнаружения локального управляемого Chrome, до `120000`      | `15000`                                                            |
| `browser.localCdpReadyTimeoutMs` | Тайм-аут ожидания готовности CDP после локального управляемого запуска, до `120000` | `8000`                                                     |

Оба значения тайм-аута должны быть положительными целыми числами не более `120000` мс; остальные значения
отклоняются при загрузке конфигурации. На Raspberry Pi, старых VPS-хостах или медленных
накопителях увеличьте `browser.localLaunchTimeoutMs`, если Chrome требуется больше времени,
чтобы открыть свою конечную точку HTTP CDP. Увеличьте `browser.localCdpReadyTimeoutMs`, если
запуск выполняется успешно, но `openclaw browser start` по-прежнему сообщает `not reachable
after start`.

### Проблема: для profile="user" не найдены вкладки Chrome

Вы используете профиль `user` (`existing-session` / Chrome MCP), но нет
открытых вкладок, к которым можно подключиться.

Варианты решения:

1. Используйте управляемый браузер:
   `openclaw browser --browser-profile openclaw start` (или задайте
   `browser.defaultProfile: "openclaw"`).
2. Оставьте локальный Chrome запущенным хотя бы с одной открытой вкладкой, затем повторите попытку с
   `--browser-profile user`.

Примечания:

- `user` работает только на локальном хосте. На серверах Linux, в контейнерах или на удалённых хостах предпочтительно
  использовать профили CDP.
- Для `user` и других профилей `existing-session` действуют текущие ограничения Chrome MCP:
  только действия по ссылкам, один файл на одну загрузку, без переопределения `timeoutMs`
  для диалоговых окон, без `wait --load networkidle`, а также без `responsebody`, экспорта в PDF,
  перехвата загрузок и пакетных действий.
- Локальные профили драйвера `openclaw` автоматически назначают `cdpPort`/`cdpUrl`; задавайте
  их вручную только для удалённого CDP.
- Удалённые профили CDP поддерживают `http://`, `https://`, `ws://` и `wss://`.
  Используйте HTTP(S) для обнаружения через `/json/version` или WS(S), если служба браузера
  предоставляет прямой URL-адрес сокета DevTools.

## Связанные материалы

- [Браузер](/ru/tools/browser)
- [Вход в браузере](/ru/tools/browser-login)
- [Устранение неполадок браузера в WSL2](/ru/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
