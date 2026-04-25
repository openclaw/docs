---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Виправте проблеми запуску CDP у Chrome/Brave/Edge/Chromium для керування браузером OpenClaw на Linux
title: Усунення проблем із браузером
x-i18n:
    generated_at: "2026-04-25T10:48:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1af7769d475e3c66aa9c0869c15646208c7840f3240238d830986913acde684b
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Проблема: «Не вдалося запустити Chrome CDP на порту 18800»

Сервер керування браузером OpenClaw не може запустити Chrome/Brave/Edge/Chromium з помилкою:

````
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
````

### Основна причина

В Ubuntu (і в багатьох дистрибутивах Linux) типове встановлення Chromium — це **snap-пакет**. Обмеження AppArmor у snap заважає тому, як OpenClaw запускає процес браузера та стежить за ним.

Команда `apt install chromium` встановлює пакет-заглушку, який перенаправляє на snap:

````
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
````

Це НЕ справжній браузер — це лише обгортка.

Інші поширені збої запуску в Linux:

- `The profile appears to be in use by another Chromium process` означає, що Chrome знайшов застарілі файли блокування `Singleton*` у каталозі керованого профілю. OpenClaw видаляє ці блокування і повторює спробу один раз, якщо блокування вказує на мертвий процес або процес на іншому хості.
- `Missing X server or $DISPLAY` означає, що було явно запитано видимий браузер на хості без сеансу робочого стола. Типово локальні керовані профілі в Linux тепер переходять у headless-режим, якщо одночасно не задані `DISPLAY` і `WAYLAND_DISPLAY`. Якщо ви встановили `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false` або `browser.profiles.<name>.headless: false`, приберіть це перевизначення headed-режиму, задайте `OPENCLAW_BROWSER_HEADLESS=1`, запустіть `Xvfb`, виконайте `openclaw browser start --headless` для одноразового запуску керованого браузера або запустіть OpenClaw у справжньому сеансі робочого стола.

### Рішення 1: Встановіть Google Chrome (рекомендовано)

Встановіть офіційний пакет Google Chrome `.deb`, який не ізольовано через snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # якщо є помилки залежностей
```

Потім оновіть конфігурацію OpenClaw (`~/.openclaw/openclaw.json`):

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

### Рішення 2: Використовуйте snap Chromium у режимі лише підключення

Якщо вам обов’язково потрібно використовувати snap Chromium, налаштуйте OpenClaw так, щоб він підключався до браузера, запущеного вручну:

1. Оновіть конфігурацію:

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

2. Запустіть Chromium вручну:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. За потреби створіть користувацький сервіс systemd для автоматичного запуску Chrome:

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

Увімкніть його командою: `systemctl --user enable --now openclaw-browser.service`

### Перевірка роботи браузера

Перевірте стан:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Перевірте перегляд сторінок:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Довідник із конфігурації

| Параметр                    | Опис                                                                 | Типове значення                                              |
| --------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `browser.enabled`           | Увімкнути керування браузером                                        | `true`                                                       |
| `browser.executablePath`    | Шлях до виконуваного файлу браузера на базі Chromium (Chrome/Brave/Edge/Chromium) | визначається автоматично (надає перевагу типовому браузеру, якщо він на базі Chromium) |
| `browser.headless`          | Запуск без GUI                                                       | `false`                                                      |
| `OPENCLAW_BROWSER_HEADLESS` | Перевизначення headless-режиму локального керованого браузера для окремого процесу | не задано                                                    |
| `browser.noSandbox`         | Додати прапорець `--no-sandbox` (потрібно для деяких конфігурацій Linux) | `false`                                                      |
| `browser.attachOnly`        | Не запускати браузер, а лише підключатися до наявного                | `false`                                                      |
| `browser.cdpPort`           | Порт Chrome DevTools Protocol                                        | `18800`                                                      |

### Проблема: «Не знайдено вкладок Chrome для profile="user"»

Ви використовуєте профіль `existing-session` / Chrome MCP. OpenClaw бачить локальний Chrome, але немає відкритих вкладок, до яких можна підключитися.

Можливі способи виправлення:

1. **Використовуйте керований браузер:** `openclaw browser start --browser-profile openclaw`
   (або задайте `browser.defaultProfile: "openclaw"`).
2. **Використовуйте Chrome MCP:** переконайтеся, що локальний Chrome запущений принаймні з однією відкритою вкладкою, а потім повторіть спробу з `--browser-profile user`.

Примітки:

- `user` працює лише на хості. Для серверів Linux, контейнерів або віддалених хостів віддавайте перевагу CDP-профілям.
- `user` / інші профілі `existing-session` зберігають поточні обмеження Chrome MCP: дії на основі ref, гачки завантаження одного файла, без перевизначення тайм-аутів діалогів, без `wait --load networkidle`, а також без `responsebody`, експорту PDF, перехоплення завантажень або пакетних дій.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP.
- Віддалені CDP-профілі приймають `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S) для виявлення через `/json/version`, або WS(S), якщо ваш сервіс браузера надає прямий URL сокета DevTools.

## Пов’язане

- [Браузер](/uk/tools/browser)
- [Вхід у браузер](/uk/tools/browser-login)
- [Усунення проблем із браузером у Browser WSL2](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
