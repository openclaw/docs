---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Виправлення проблем запуску CDP у Chrome/Brave/Edge/Chromium для керування браузером OpenClaw у Linux
title: Усунення проблем із браузером
x-i18n:
    generated_at: "2026-07-12T13:44:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0256e8ee441802086cd486923060be54f8966b423e5dcb71fc8961bbab5d729
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## Проблема: не вдалося запустити Chrome CDP на порту 18800

```json
{ "error": "Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"." }
```

### Основна причина

В Ubuntu та більшості дистрибутивів Linux команда `apt install chromium` встановлює
обгортку snap, а не справжній браузер:

```text
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Обмеження AppArmor у snap перешкоджають OpenClaw запускати та відстежувати
процес браузера.

Інші поширені помилки запуску в Linux:

- `The profile appears to be in use by another Chromium process`: застарілі
  файли блокування `Singleton*` у каталозі керованого профілю. OpenClaw видаляє
  ці блокування та повторює спробу один раз, якщо блокування вказує на завершений
  процес або процес на іншому хості.
- `Missing X server or $DISPLAY`: на хості без сеансу робочого столу було явно
  запитано браузер із видимим інтерфейсом. Локальні керовані профілі в Linux
  переходять у безголовий режим, коли не задано ані `DISPLAY`, ані
  `WAYLAND_DISPLAY`. Якщо ви встановили `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless: false` або `browser.profiles.<name>.headless: false`,
  видаліть це перевизначення режиму з інтерфейсом, установіть
  `OPENCLAW_BROWSER_HEADLESS=1`, запустіть `Xvfb`, виконайте
  `openclaw browser start --headless` для одноразового керованого запуску або
  запустіть OpenClaw у справжньому сеансі робочого столу.

### Рішення 1: установіть Google Chrome (рекомендовано)

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # якщо виникають помилки залежностей
```

Оновіть `~/.openclaw/openclaw.json`:

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

### Рішення 2: використовуйте snap Chromium у режимі лише підключення

Якщо вам потрібно залишити snap Chromium, налаштуйте OpenClaw для підключення
до браузера, запущеного вручну, замість його самостійного запуску:

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

Запустіть Chromium вручну:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

За потреби налаштуйте його автоматичний запуск за допомогою користувацької служби systemd:

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

```bash
systemctl --user enable --now openclaw-browser.service
```

### Перевірте роботу браузера

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Довідник із конфігурації

| Параметр                         | Опис                                                                 | Значення за замовчуванням                                           |
| -------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `browser.enabled`                | Увімкнути керування браузером                                        | `true`                                                              |
| `browser.executablePath`         | Шлях до виконуваного файла браузера на основі Chromium (Chrome/Brave/Edge/Chromium) | визначається автоматично (перевага надається типовому браузеру ОС, якщо він базується на Chromium) |
| `browser.headless`               | Запускати без графічного інтерфейсу                                   | `false`                                                             |
| `OPENCLAW_BROWSER_HEADLESS`      | Перевизначення безголового режиму локального керованого браузера для окремого процесу | не задано                                                           |
| `browser.noSandbox`              | Додати прапорець `--no-sandbox` (потрібно для деяких конфігурацій Linux) | `false`                                                          |
| `browser.attachOnly`             | Не запускати браузер; лише підключатися до наявного                   | `false`                                                             |
| `browser.cdpPortRangeStart`      | Початковий локальний порт CDP для автоматично призначених профілів    | `18800` (визначається на основі порту Gateway)                       |
| `browser.localLaunchTimeoutMs`   | Час очікування виявлення локального керованого Chrome, до `120000`    | `15000`                                                             |
| `browser.localCdpReadyTimeoutMs` | Час очікування готовності CDP після локального керованого запуску, до `120000` | `8000`                                                       |

Обидва значення часу очікування мають бути додатними цілими числами до
`120000` мс; інші значення відхиляються під час завантаження конфігурації.
На Raspberry Pi, старіших хостах VPS або повільних сховищах збільште
`browser.localLaunchTimeoutMs`, якщо Chrome потребує більше часу, щоб відкрити
свою кінцеву точку HTTP CDP. Збільште `browser.localCdpReadyTimeoutMs`, якщо
запуск завершується успішно, але `openclaw browser start` усе одно повідомляє
`not reachable after start`.

### Проблема: не знайдено вкладок Chrome для profile="user"

Ви використовуєте профіль `user` (`existing-session` / Chrome MCP), але немає
відкритих вкладок, до яких можна підключитися.

Варіанти виправлення:

1. Натомість використовуйте керований браузер:
   `openclaw browser --browser-profile openclaw start` (або встановіть
   `browser.defaultProfile: "openclaw"`).
2. Залиште локальний Chrome запущеним із принаймні однією відкритою вкладкою,
   а потім повторіть спробу з `--browser-profile user`.

Примітки:

- `user` працює лише на хості. На серверах Linux, у контейнерах або на
  віддалених хостах натомість використовуйте профілі CDP.
- `user` та інші профілі `existing-session` мають поточні обмеження Chrome MCP:
  лише дії за посиланнями, один файл на одне завантаження, без перевизначень
  `timeoutMs` для діалогових вікон, без `wait --load networkidle`, а також без
  `responsebody`, експорту PDF, перехоплення завантажень і пакетних дій.
- Локальні профілі драйвера `openclaw` автоматично призначають `cdpPort`/`cdpUrl`;
  установлюйте їх вручну лише для віддаленого CDP.
- Віддалені профілі CDP приймають `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S) для виявлення через `/json/version` або WS(S), якщо
  служба браузера надає пряму URL-адресу сокета DevTools.

## Пов’язані матеріали

- [Браузер](/uk/tools/browser)
- [Вхід у браузері](/uk/tools/browser-login)
- [Усунення несправностей браузера у WSL2](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
