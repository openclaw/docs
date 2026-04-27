---
read_when:
    - Запуск OpenClaw Gateway у WSL2, коли Chrome працює у Windows
    - Бачите накладені помилки browser/control-ui у WSL2 та Windows
    - Вибір між host-local Chrome MCP і сирим віддаленим CDP у конфігураціях із розділеними хостами
summary: Усунення несправностей WSL2 Gateway + віддалений CDP Windows Chrome пошарово
title: Усунення несправностей WSL2 + Windows + віддалений CDP Chrome
x-i18n:
    generated_at: "2026-04-27T06:28:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7532c672f7e829b851d175d93354fc586baecea4af5f2555f57908780cedfd02
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

У поширеній конфігурації з розділеними хостами OpenClaw Gateway працює всередині WSL2, Chrome працює у Windows, а керування браузером має перетинати межу між WSL2 і Windows. Пошаровий шаблон збоїв з [issue #39369](https://github.com/openclaw/openclaw/issues/39369) означає, що кілька незалежних проблем можуть виникати одночасно, через що спочатку може здаватися, що зламано не той шар.

## Спочатку виберіть правильний режим браузера

У вас є два коректні варіанти:

### Варіант 1: сирий віддалений CDP з WSL2 до Windows

Використовуйте профіль віддаленого браузера, який вказує з WSL2 на ендпойнт Windows Chrome CDP.

Вибирайте це, коли:

- Gateway лишається всередині WSL2
- Chrome працює у Windows
- вам потрібно, щоб керування браузером перетинало межу WSL2/Windows

### Варіант 2: host-local Chrome MCP

Використовуйте `existing-session` / `user` лише тоді, коли сам Gateway працює на тому самому хості, що й Chrome.

Вибирайте це, коли:

- OpenClaw і Chrome працюють на одній машині
- вам потрібен локальний браузерний стан із виконаним входом
- вам не потрібен міжхостовий транспорт браузера
- вам не потрібні розширені маршрути лише для managed/raw-CDP, як-от `responsebody`, експорт PDF, перехоплення завантажень або пакетні дії

Для Gateway у WSL2 + Chrome у Windows надавайте перевагу сирому віддаленому CDP. Chrome MCP — це host-local, а не міст між WSL2 і Windows.

## Робоча архітектура

Опорна схема:

- WSL2 запускає Gateway на `127.0.0.1:18789`
- Windows відкриває Control UI у звичайному браузері на `http://127.0.0.1:18789/`
- Windows Chrome відкриває ендпойнт CDP на порту `9222`
- WSL2 може досягти цього ендпойнта Windows CDP
- OpenClaw спрямовує профіль браузера на адресу, яка досяжна з WSL2

## Чому ця конфігурація заплутує

Може накладатися кілька збоїв:

- WSL2 не може досягти ендпойнта Windows CDP
- Control UI відкрито з небезпечного походження
- `gateway.controlUi.allowedOrigins` не збігається з походженням сторінки
- відсутній токен або pairing
- профіль браузера вказує на неправильну адресу

Через це виправлення одного шару все одно може залишати видимою іншу помилку.

## Критичне правило для Control UI

Коли UI відкривається з Windows, використовуйте localhost Windows, якщо тільки у вас немає навмисно налаштованого HTTPS.

Використовуйте:

`http://127.0.0.1:18789/`

Не використовуйте за замовчуванням LAN IP для Control UI. Звичайний HTTP на LAN або tailnet-адресі може спричиняти поведінку insecure-origin/device-auth, яка не пов’язана безпосередньо з CDP. Див. [Control UI](/uk/web/control-ui).

## Перевіряйте пошарово

Рухайтеся зверху вниз. Не перескакуйте наперед.

### Шар 1: переконайтеся, що Chrome віддає CDP у Windows

Запустіть Chrome у Windows з увімкненим віддаленим налагодженням:

```powershell
chrome.exe --remote-debugging-port=9222
```

Із Windows спочатку перевірте сам Chrome:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Якщо це не працює у Windows, проблема ще не в OpenClaw.

### Шар 2: переконайтеся, що WSL2 може досягти цього ендпойнта Windows

Із WSL2 перевірте точну адресу, яку ви плануєте використовувати в `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Хороший результат:

- `/json/version` повертає JSON із метаданими Browser / Protocol-Version
- `/json/list` повертає JSON (порожній масив — це нормально, якщо сторінок не відкрито)

Якщо це не працює:

- Windows іще не відкриває порт для WSL2
- адреса неправильна для боку WSL2
- іще бракує firewall / port forwarding / локального proxying

Виправте це, перш ніж чіпати конфігурацію OpenClaw.

### Шар 3: налаштуйте правильний профіль браузера

Для сирого віддаленого CDP спрямуйте OpenClaw на адресу, яка досяжна з WSL2:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Примітки:

- використовуйте адресу, досяжну з WSL2, а не ту, що працює лише у Windows
- залишайте `attachOnly: true` для браузерів, якими керують зовнішні засоби
- `cdpUrl` може бути `http://`, `https://`, `ws://` або `wss://`
- використовуйте HTTP(S), коли хочете, щоб OpenClaw виявляв `/json/version`
- використовуйте WS(S) лише тоді, коли провайдер браузера надає вам прямий URL сокета DevTools
- перевіряйте той самий URL через `curl`, перш ніж очікувати успіху від OpenClaw

### Шар 4: окремо перевірте шар Control UI

Відкрийте UI з Windows:

`http://127.0.0.1:18789/`

Потім перевірте:

- походження сторінки збігається з тим, що очікує `gateway.controlUi.allowedOrigins`
- автентифікацію токеном або pairing налаштовано правильно
- ви не налагоджуєте проблему автентифікації Control UI так, ніби це проблема браузера

Корисна сторінка:

- [Control UI](/uk/web/control-ui)

### Шар 5: перевірте наскрізне керування браузером

Із WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Хороший результат:

- вкладка відкривається у Windows Chrome
- `openclaw browser tabs` повертає ціль
- подальші дії (`snapshot`, `screenshot`, `navigate`) працюють із того самого профілю

## Поширені помилки, що вводять в оману

Сприймайте кожне повідомлення як підказку до конкретного шару:

- `control-ui-insecure-auth`
  - проблема походження UI / secure-context, а не транспорту CDP
- `token_missing`
  - проблема конфігурації автентифікації
- `pairing required`
  - проблема погодження пристрою
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 не може досягти налаштованого `cdpUrl`
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - HTTP-ендпойнт відповів, але WebSocket DevTools усе одно не вдалося відкрити
- застарілі перевизначення viewport / dark-mode / locale / offline після віддаленої сесії
  - виконайте `openclaw browser stop --browser-profile remote`
  - це закриває активну сесію керування й звільняє стан емуляції Playwright/CDP без перезапуску gateway або зовнішнього браузера
- `gateway timeout after 1500ms`
  - часто це все ще проблема досяжності CDP або повільного/недосяжного віддаленого ендпойнта
- `No Chrome tabs found for profile="user"`
  - вибрано локальний профіль Chrome MCP там, де немає доступних локальних вкладок хоста

## Швидкий контрольний список для тріажу

1. Windows: чи працює `curl http://127.0.0.1:9222/json/version`?
2. WSL2: чи працює `curl http://WINDOWS_HOST_OR_IP:9222/json/version`?
3. Конфігурація OpenClaw: чи використовує `browser.profiles.<name>.cdpUrl` саме цю адресу, досяжну з WSL2?
4. Control UI: чи відкриваєте ви `http://127.0.0.1:18789/`, а не LAN IP?
5. Чи не намагаєтеся ви використовувати `existing-session` через WSL2 і Windows замість сирого віддаленого CDP?

## Практичний висновок

Зазвичай така конфігурація є життєздатною. Найскладніше те, що транспорт браузера, безпека походження Control UI та токен/pairing можуть незалежно ламатися, водночас виглядаючи подібно з боку користувача.

Якщо сумніваєтесь:

- спочатку локально перевірте ендпойнт Windows Chrome
- потім перевірте той самий ендпойнт із WSL2
- і лише після цього налагоджуйте конфігурацію OpenClaw або автентифікацію Control UI

## Пов’язане

- [Browser](/uk/tools/browser)
- [Browser login](/uk/tools/browser-login)
- [Усунення несправностей Browser у Linux](/uk/tools/browser-linux-troubleshooting)
