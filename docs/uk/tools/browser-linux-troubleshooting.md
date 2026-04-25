---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Виправлення проблем запуску CDP у Chrome/Brave/Edge/Chromium для керування браузером OpenClaw у Linux
title: Усунення несправностей браузера
x-i18n:
    generated_at: "2026-04-25T10:18:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7756634001798bf4d14546b1bb679e9f4530adf33adc1aa323e9c594b0a7abbd
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Проблема: «Не вдалося запустити Chrome CDP на порту 18800»

Сервер керування браузером OpenClaw не може запустити Chrome/Brave/Edge/Chromium із помилкою:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Коренева причина

В Ubuntu (і багатьох дистрибутивах Linux) типове встановлення Chromium є **snap-пакетом**. Обмеження AppArmor у snap заважає тому, як OpenClaw запускає й відстежує процес браузера.

Команда `apt install chromium` встановлює пакет-заглушку, який перенаправляє на snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Це НЕ справжній браузер — це лише обгортка.

Інші поширені збої запуску в Linux:

- `The profile appears to be in use by another Chromium process` означає, що Chrome
  знайшов застарілі файли блокування `Singleton*` у каталозі керованого профілю. OpenClaw
  видаляє ці блокування й повторює спробу один раз, якщо блокування вказує на неактивний процес
  або процес з іншого хоста.
- `Missing X server or $DISPLAY` означає, що було явно запитано видимий браузер
  на хості без сеансу робочого столу. Типово локальні керовані
  профілі в Linux тепер переходять у headless-режим, коли одночасно не задані `DISPLAY` і
  `WAYLAND_DISPLAY`. Якщо ви встановили `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless: false` або `browser.profiles.<name>.headless: false`,
  приберіть це перевизначення headed-режиму, встановіть `OPENCLAW_BROWSER_HEADLESS=1`, запустіть `Xvfb`
  або запустіть OpenClaw у справжньому сеансі робочого столу.

### Рішення 1: Встановіть Google Chrome (рекомендовано)

Встановіть офіційний пакет Google Chrome `.deb`, який не ізольований через snap:

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

Якщо вам необхідно використовувати snap Chromium, налаштуйте OpenClaw на підключення до браузера, запущеного вручну:

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

Увімкніть командою: `systemctl --user enable --now openclaw-browser.service`

### Перевірка роботи браузера

Перевірте стан:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Перевірте перегляд:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Довідник конфігурації

| Параметр                    | Опис                                                                 | Типово                                                      |
| --------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`           | Увімкнути керування браузером                                        | `true`                                                      |
| `browser.executablePath`    | Шлях до бінарного файла браузера на базі Chromium (Chrome/Brave/Edge/Chromium) | визначається автоматично (надає перевагу типовому браузеру, якщо він на базі Chromium) |
| `browser.headless`          | Запуск без GUI                                                       | `false`                                                     |
| `OPENCLAW_BROWSER_HEADLESS` | Перевизначення headless-режиму для локального керованого браузера в межах процесу | не задано                                                   |
| `browser.noSandbox`         | Додати прапорець `--no-sandbox` (потрібно для деяких конфігурацій Linux) | `false`                                                     |
| `browser.attachOnly`        | Не запускати браузер, лише підключатися до наявного                  | `false`                                                     |
| `browser.cdpPort`           | Порт Chrome DevTools Protocol                                        | `18800`                                                     |

### Проблема: «Не знайдено вкладок Chrome для profile="user"»

Ви використовуєте профіль `existing-session` / Chrome MCP. OpenClaw бачить локальний Chrome,
але немає відкритих вкладок, до яких можна підключитися.

Варіанти виправлення:

1. **Використовуйте керований браузер:** `openclaw browser start --browser-profile openclaw`
   (або встановіть `browser.defaultProfile: "openclaw"`).
2. **Використовуйте Chrome MCP:** переконайтеся, що локальний Chrome запущений і має принаймні одну відкриту вкладку, а потім повторіть спробу з `--browser-profile user`.

Примітки:

- `user` доступний лише на хості. Для серверів Linux, контейнерів або віддалених хостів віддавайте перевагу CDP-профілям.
- `user` та інші профілі `existing-session` зберігають поточні обмеження Chrome MCP:
  дії на основі ref, хуки завантаження лише одного файла, без перевизначення тайм-аутів діалогів, без
  `wait --load networkidle`, а також без `responsebody`, експорту PDF, перехоплення завантажень
  або пакетних дій.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP.
- Віддалені CDP-профілі приймають `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S) для виявлення через `/json/version`, або WS(S), коли ваш сервіс браузера
  надає прямий URL сокета DevTools.

## Пов’язане

- [Браузер](/uk/tools/browser)
- [Вхід у браузері](/uk/tools/browser-login)
- [Усунення несправностей браузера у WSL2](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
