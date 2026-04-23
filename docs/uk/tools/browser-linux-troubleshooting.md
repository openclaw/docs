---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Усунути проблеми запуску Chrome/Brave/Edge/Chromium CDP для керування браузером OpenClaw на Linux
title: Усунення несправностей браузера
x-i18n:
    generated_at: "2026-04-23T21:13:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e1f68dbd75d2cbe8f60b2e910fccdb9e58cc5c0710396b5918b5cb710bee41b
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

# Усунення несправностей браузера (Linux)

## Проблема: "Failed to start Chrome CDP on port 18800"

Сервер керування браузером OpenClaw не може запустити Chrome/Brave/Edge/Chromium і видає помилку:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Першопричина

На Ubuntu (і багатьох інших дистрибутивах Linux) типове встановлення Chromium — це **snap-пакет**. Обмеження AppArmor у snap заважають тому, як OpenClaw запускає й відстежує процес браузера.

Команда `apt install chromium` установлює пакет-заглушку, який перенаправляє на snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Це НЕ справжній браузер — це лише обгортка.

### Рішення 1: Установіть Google Chrome (рекомендовано)

Установіть офіційний `.deb`-пакет Google Chrome, який не ізольований через snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
```

Потім оновіть config OpenClaw (`~/.openclaw/openclaw.json`):

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

### Рішення 2: Використовуйте snap Chromium у режимі Attach-Only

Якщо вам обов’язково потрібен snap Chromium, налаштуйте OpenClaw на підключення до браузера, запущеного вручну:

1. Оновіть config:

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

3. За бажанням створіть systemd user service для автозапуску Chrome:

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

### Перевірка, що браузер працює

Перевірте стан:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Перевірте перегляд:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Довідник із config

| Параметр                 | Опис                                                                 | Типове значення                                              |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `browser.enabled`        | Увімкнути керування браузером                                        | `true`                                                       |
| `browser.executablePath` | Шлях до бінарника браузера на основі Chromium (Chrome/Brave/Edge/Chromium) | визначається автоматично (віддає перевагу типовому браузеру, якщо той на основі Chromium) |
| `browser.headless`       | Запуск без GUI                                                       | `false`                                                      |
| `browser.noSandbox`      | Додати прапорець `--no-sandbox` (потрібно для деяких налаштувань Linux) | `false`                                                   |
| `browser.attachOnly`     | Не запускати браузер, лише підключатися до наявного                  | `false`                                                      |
| `browser.cdpPort`        | Порт Chrome DevTools Protocol                                        | `18800`                                                      |

### Проблема: "No Chrome tabs found for profile=\"user\""

Ви використовуєте профіль `existing-session` / Chrome MCP. OpenClaw бачить локальний Chrome,
але немає відкритих вкладок, до яких можна підключитися.

Варіанти виправлення:

1. **Використовуйте керований браузер:** `openclaw browser start --browser-profile openclaw`
   (або задайте `browser.defaultProfile: "openclaw"`).
2. **Використовуйте Chrome MCP:** переконайтеся, що локальний Chrome запущений і має принаймні одну відкриту вкладку, а потім повторіть спробу з `--browser-profile user`.

Примітки:

- `user` працює лише на хості. Для Linux-серверів, контейнерів або віддалених хостів надавайте перевагу профілям CDP.
- `user` / інші профілі `existing-session` зберігають поточні обмеження Chrome MCP:
  дії на основі ref, hooks завантаження одного файла, без перевизначення timeout діалогів, без
  `wait --load networkidle`, а також без `responsebody`, експорту PDF, перехоплення завантажень
  чи пакетних дій.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP.
- Віддалені профілі CDP приймають `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S) для виявлення через `/json/version`, або WS(S), коли ваш браузерний
  сервіс надає прямий DevTools socket URL.
