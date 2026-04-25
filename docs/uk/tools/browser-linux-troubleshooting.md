---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Усунення проблем запуску CDP у Chrome/Brave/Edge/Chromium для керування браузером OpenClaw у Linux
title: Усунення несправностей браузера
x-i18n:
    generated_at: "2026-04-25T11:57:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6540de2c3141a92ad8bf7f6aedfc0ecb68293c939da2fed59e7fe2dd07ce8901
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Проблема: «Не вдалося запустити Chrome CDP на порту 18800»

Сервер керування браузером OpenClaw не може запустити Chrome/Brave/Edge/Chromium і повертає помилку:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Основна причина

В Ubuntu (і багатьох інших дистрибутивах Linux) типове встановлення Chromium є **snap-пакетом**. Обмеження Snap через AppArmor заважають тому, як OpenClaw запускає та відстежує процес браузера.

Команда `apt install chromium` встановлює пакет-заглушку, який перенаправляє на snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Це НЕ справжній браузер — це лише обгортка.

Інші поширені збої запуску в Linux:

- `The profile appears to be in use by another Chromium process` означає, що Chrome знайшов застарілі файли блокування `Singleton*` у каталозі керованого профілю. OpenClaw видаляє ці блокування й повторює спробу один раз, якщо блокування вказує на мертвий процес або процес на іншому хості.
- `Missing X server or $DISPLAY` означає, що було явно запрошено видимий браузер на хості без сесії робочого столу. За замовчуванням локальні керовані профілі тепер переходять у безголовий режим у Linux, якщо `DISPLAY` і `WAYLAND_DISPLAY` обидва не задані. Якщо ви встановили `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false` або `browser.profiles.<name>.headless: false`, приберіть це перевизначення headed-режиму, встановіть `OPENCLAW_BROWSER_HEADLESS=1`, запустіть `Xvfb`, виконайте `openclaw browser start --headless` для одноразового керованого запуску або запускайте OpenClaw у справжній сесії робочого столу.

### Рішення 1: встановіть Google Chrome (рекомендовано)

Встановіть офіційний пакет Google Chrome `.deb`, який не ізольований через snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
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

### Рішення 2: використовуйте Snap Chromium у режимі лише підключення

Якщо вам обов’язково потрібно використовувати snap Chromium, налаштуйте OpenClaw на підключення до браузера, запущеного вручну:

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

3. За бажанням створіть сервіс користувача systemd для автоматичного запуску Chrome:

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

### Довідка з конфігурації

| Параметр                         | Опис                                                                 | Типове значення                                            |
| -------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| `browser.enabled`                | Увімкнути керування браузером                                        | `true`                                                     |
| `browser.executablePath`         | Шлях до виконуваного файла браузера на основі Chromium (Chrome/Brave/Edge/Chromium) | визначається автоматично (надає перевагу типовому браузеру, якщо він на основі Chromium) |
| `browser.headless`               | Запуск без GUI                                                       | `false`                                                    |
| `OPENCLAW_BROWSER_HEADLESS`      | Перевизначення безголового режиму для локального керованого браузера на рівні процесу | unset                                                      |
| `browser.noSandbox`              | Додати прапорець `--no-sandbox` (потрібно для деяких конфігурацій Linux) | `false`                                                |
| `browser.attachOnly`             | Не запускати браузер, лише підключатися до наявного                  | `false`                                                    |
| `browser.cdpPort`                | Порт Chrome DevTools Protocol                                        | `18800`                                                    |
| `browser.localLaunchTimeoutMs`   | Тайм-аут виявлення локального керованого Chrome                      | `15000`                                                    |
| `browser.localCdpReadyTimeoutMs` | Тайм-аут готовності локального керованого CDP після запуску          | `8000`                                                     |

На Raspberry Pi, старіших VPS-хостах або повільних носіях збільшуйте
`browser.localLaunchTimeoutMs`, якщо Chrome потребує більше часу, щоб відкрити свій HTTP-ендпоінт CDP. Збільшуйте `browser.localCdpReadyTimeoutMs`, якщо запуск вдається, але
`openclaw browser start` усе ще повідомляє `not reachable after start`. Значення обмежені 120000 мс.

### Проблема: `No Chrome tabs found for profile="user"`

Ви використовуєте профіль `existing-session` / Chrome MCP. OpenClaw бачить локальний Chrome, але немає відкритих вкладок, до яких можна підключитися.

Варіанти виправлення:

1. **Використовуйте керований браузер:** `openclaw browser start --browser-profile openclaw`
   (або встановіть `browser.defaultProfile: "openclaw"`).
2. **Використовуйте Chrome MCP:** переконайтеся, що локальний Chrome запущений і має принаймні одну відкриту вкладку, потім повторіть спробу з `--browser-profile user`.

Примітки:

- `user` доступний лише на хості. Для Linux-серверів, контейнерів або віддалених хостів віддавайте перевагу профілям CDP.
- `user` / інші профілі `existing-session` зберігають поточні обмеження Chrome MCP: дії на основі ref, хуки завантаження одного файла, без перевизначень тайм-ауту діалогів, без `wait --load networkidle`, а також без `responsebody`, експорту PDF, перехоплення завантажень чи пакетних дій.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP.
- Віддалені профілі CDP приймають `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S) для виявлення `/json/version` або WS(S), якщо ваш сервіс браузера надає прямий URL сокета DevTools.

## Пов’язане

- [Browser](/uk/tools/browser)
- [Вхід у браузері](/uk/tools/browser-login)
- [Усунення несправностей Browser у WSL2](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
