---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Виправлення проблем запуску CDP у Chrome/Brave/Edge/Chromium для керування браузером OpenClaw на Linux
title: Усунення несправностей браузера
x-i18n:
    generated_at: "2026-04-25T05:59:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b972e9f611962b60c76088487a8db628bc1cbf8447f73f75d33606f177c701a
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Проблема: «Не вдалося запустити Chrome CDP на порту 18800»

Сервер керування браузером OpenClaw не може запустити Chrome/Brave/Edge/Chromium і повертає помилку:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Коренева причина

На Ubuntu (і багатьох дистрибутивах Linux) стандартне встановлення Chromium — це **snap-пакет**. Ізоляція AppArmor у snap заважає тому, як OpenClaw запускає та відстежує процес браузера.

Команда `apt install chromium` встановлює пакет-заглушку, який перенаправляє на snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Це НЕ справжній браузер — це лише обгортка.

Інші поширені збої запуску в Linux:

- `The profile appears to be in use by another Chromium process` означає, що Chrome
  знайшов застарілі файли блокування `Singleton*` у керованому каталозі профілю. OpenClaw
  видаляє ці блокування й повторює спробу один раз, коли блокування вказує на мертвий процес
  або процес з іншого host.
- `Missing X server or $DISPLAY` означає, що OpenClaw намагається запустити видимий
  браузер на host без desktop-сесії. Використовуйте `browser.headless: true`,
  запустіть `Xvfb` або запускайте OpenClaw у справжній desktop-сесії.

### Рішення 1: Встановіть Google Chrome (рекомендовано)

Установіть офіційний пакет `.deb` для Google Chrome, який не ізольований через snap:

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

### Рішення 2: Використовуйте snap Chromium у режимі лише attach

Якщо вам обов’язково потрібен snap Chromium, налаштуйте OpenClaw на під’єднання до браузера, запущеного вручну:

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

| Параметр                | Опис                                                                 | За замовчуванням                                            |
| ----------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`       | Увімкнути керування браузером                                        | `true`                                                      |
| `browser.executablePath` | Шлях до двійкового файла браузера на базі Chromium (Chrome/Brave/Edge/Chromium) | визначається автоматично (надає перевагу стандартному браузеру, якщо він на базі Chromium) |
| `browser.headless`      | Запуск без GUI                                                       | `false`                                                     |
| `browser.noSandbox`     | Додати прапорець `--no-sandbox` (потрібно для деяких конфігурацій Linux) | `false`                                                     |
| `browser.attachOnly`    | Не запускати браузер, лише під’єднуватися до наявного                | `false`                                                     |
| `browser.cdpPort`       | Порт Chrome DevTools Protocol                                        | `18800`                                                     |

### Проблема: «Не знайдено вкладок Chrome для `profile="user"`»

Ви використовуєте профіль `existing-session` / Chrome MCP. OpenClaw бачить локальний Chrome,
але немає відкритих вкладок, до яких можна під’єднатися.

Варіанти виправлення:

1. **Використовуйте керований браузер:** `openclaw browser start --browser-profile openclaw`
   (або задайте `browser.defaultProfile: "openclaw"`).
2. **Використовуйте Chrome MCP:** переконайтеся, що локальний Chrome запущений і має принаймні одну відкриту вкладку, а потім повторіть спробу з `--browser-profile user`.

Примітки:

- `user` працює лише на host. Для серверів Linux, контейнерів або віддалених host використовуйте профілі CDP.
- `user` / інші профілі `existing-session` зберігають поточні обмеження Chrome MCP:
  дії через ref, хуки завантаження одного файла, без перевизначення тайм-аутів діалогів, без
  `wait --load networkidle`, а також без `responsebody`, експорту PDF, перехоплення завантажень
  чи пакетних дій.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP.
- Віддалені профілі CDP приймають `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S) для виявлення через `/json/version` або WS(S), коли ваш
  браузерний сервіс надає прямий URL сокета DevTools.

## Пов’язане

- [Браузер](/uk/tools/browser)
- [Вхід у браузері](/uk/tools/browser-login)
- [Усунення несправностей браузера WSL2](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
