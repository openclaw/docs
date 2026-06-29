---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Устранение проблем с запуском CDP Chrome/Brave/Edge/Chromium для управления браузером OpenClaw в Linux
title: Устранение неполадок браузера
x-i18n:
    generated_at: "2026-06-28T23:49:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9a91ea42a8a600163bcf66ad398677175bd0c5186d3e1dddb629a55c2ea66ed
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## Проблема: «Не удалось запустить Chrome CDP на порту 18800»

Сервер управления браузером OpenClaw не может запустить Chrome/Brave/Edge/Chromium с ошибкой:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Первопричина

В Ubuntu (и многих дистрибутивах Linux) стандартная установка Chromium представляет собой **snap-пакет**. Ограничения AppArmor в Snap мешают тому, как OpenClaw запускает и отслеживает процесс браузера.

Команда `apt install chromium` устанавливает пакет-заглушку, который перенаправляет на snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Это НЕ настоящий браузер, а всего лишь обертка.

Другие распространенные сбои запуска в Linux:

- `The profile appears to be in use by another Chromium process` означает, что Chrome
  нашел устаревшие lock-файлы `Singleton*` в управляемом каталоге профиля. OpenClaw
  удаляет эти блокировки и повторяет попытку один раз, если блокировка указывает на мертвый процесс
  или процесс на другом хосте.
- `Missing X server or $DISPLAY` означает, что видимый браузер был явно
  запрошен на хосте без desktop-сеанса. По умолчанию локальные управляемые
  профили теперь переключаются в headless-режим в Linux, когда `DISPLAY` и
  `WAYLAND_DISPLAY` оба не заданы. Если вы задали `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless: false` или `browser.profiles.<name>.headless: false`,
  удалите это переопределение headed-режима, задайте `OPENCLAW_BROWSER_HEADLESS=1`, запустите `Xvfb`,
  выполните `openclaw browser start --headless` для разового управляемого запуска или запустите
  OpenClaw в настоящем desktop-сеансе.

### Решение 1: установите Google Chrome (рекомендуется)

Установите официальный пакет Google Chrome `.deb`, который не изолируется snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
```

Затем обновите конфигурацию OpenClaw (`~/.openclaw/openclaw.json`):

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

### Решение 2: используйте Snap Chromium в режиме только подключения

Если вам необходимо использовать snap Chromium, настройте OpenClaw на подключение к браузеру, запущенному вручную:

1. Обновите конфигурацию:

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

2. Запустите Chromium вручную:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. При необходимости создайте пользовательский сервис systemd для автозапуска Chrome:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Включите его командой: `systemctl --user enable --now openclaw-browser.service`

### Проверка работы браузера

Проверьте статус:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Проверьте просмотр страниц:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Справочник конфигурации

| Параметр                         | Описание                                                              | Значение по умолчанию                                          |
| -------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------- |
| `browser.enabled`                | Включить управление браузером                                         | `true`                                                         |
| `browser.executablePath`         | Путь к бинарному файлу браузера на базе Chromium (Chrome/Brave/Edge/Chromium) | определяется автоматически (предпочитает браузер по умолчанию, если он основан на Chromium) |
| `browser.headless`               | Запускать без GUI                                                     | `false`                                                        |
| `OPENCLAW_BROWSER_HEADLESS`      | Переопределение для процесса для headless-режима локального управляемого браузера | не задано                                                      |
| `browser.noSandbox`              | Добавить флаг `--no-sandbox` (нужно для некоторых конфигураций Linux) | `false`                                                        |
| `browser.attachOnly`             | Не запускать браузер, только подключаться к существующему             | `false`                                                        |
| `browser.cdpPort`                | Порт Chrome DevTools Protocol                                         | `18800`                                                        |
| `browser.localLaunchTimeoutMs`   | Тайм-аут обнаружения локального управляемого Chrome                   | `15000`                                                        |
| `browser.localCdpReadyTimeoutMs` | Тайм-аут готовности CDP после запуска локального управляемого браузера | `8000`                                                         |

На Raspberry Pi, старых VPS-хостах или медленном хранилище увеличьте
`browser.localLaunchTimeoutMs`, когда Chrome требуется больше времени, чтобы открыть свой HTTP endpoint CDP.
Увеличьте `browser.localCdpReadyTimeoutMs`, когда запуск проходит успешно, но
`openclaw browser start` все еще сообщает `not reachable after start`. Значения должны
быть положительными целыми числами до `120000` мс; недопустимые значения конфигурации отклоняются.

### Проблема: «В профиле profile=\"user\" не найдены вкладки Chrome»

Вы используете профиль `existing-session` / Chrome MCP. OpenClaw видит локальный Chrome,
но нет открытых вкладок, доступных для подключения.

Варианты исправления:

1. **Используйте управляемый браузер:** `openclaw browser start --browser-profile openclaw`
   (или задайте `browser.defaultProfile: "openclaw"`).
2. **Используйте Chrome MCP:** убедитесь, что локальный Chrome запущен хотя бы с одной открытой вкладкой, затем повторите попытку с `--browser-profile user`.

Примечания:

- `user` работает только на хосте. Для Linux-серверов, контейнеров или удаленных хостов предпочитайте CDP-профили.
- Профили `user` / другие профили `existing-session` сохраняют текущие ограничения Chrome MCP:
  действия на основе ref, хуки загрузки одного файла, без переопределения тайм-аутов диалогов, без
  `wait --load networkidle`, а также без `responsebody`, экспорта PDF, перехвата загрузок
  или пакетных действий.
- Локальные профили `openclaw` автоматически назначают `cdpPort`/`cdpUrl`; задавайте их только для удаленного CDP.
- Удаленные CDP-профили принимают `http://`, `https://`, `ws://` и `wss://`.
  Используйте HTTP(S) для обнаружения `/json/version` или WS(S), когда ваш браузерный
  сервис предоставляет прямой URL сокета DevTools.

## См. также

- [Браузер](/ru/tools/browser)
- [Вход в браузер](/ru/tools/browser-login)
- [Устранение неполадок Browser WSL2](/ru/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
