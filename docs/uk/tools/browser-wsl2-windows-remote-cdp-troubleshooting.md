---
read_when:
    - Запуск Gateway OpenClaw у WSL2, коли Chrome працює у Windows
    - Бачите накладання помилок browser/control-ui між WSL2 та Windows
    - Вибір між host-local Chrome MCP і raw remote CDP у конфігураціях із розділеними хостами
summary: Усунення неполадок для Gateway у WSL2 + віддаленого Windows Chrome CDP по шарах
title: Усунення неполадок для WSL2 + Windows + віддаленого Chrome CDP
x-i18n:
    generated_at: "2026-04-23T21:13:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3368c7fef1470d181d7e125596de566ab63a0cb569bb6417058bf43578e71f7
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

Цей посібник охоплює поширену конфігурацію з розділеними хостами, де:

- Gateway OpenClaw працює всередині WSL2
- Chrome працює у Windows
- керування browser має перетинати межу WSL2/Windows

Він також охоплює багатошаровий шаблон збоїв із [issue #39369](https://github.com/openclaw/openclaw/issues/39369): кілька незалежних проблем можуть з’являтися одночасно, через що насамперед зламаним виглядає не той шар.

## Спочатку виберіть правильний режим browser

У вас є два коректні шаблони:

### Варіант 1: Raw remote CDP з WSL2 до Windows

Використовуйте профіль віддаленого browser, який вказує з WSL2 на endpoint Windows Chrome CDP.

Вибирайте це, коли:

- Gateway залишається всередині WSL2
- Chrome працює у Windows
- вам потрібно, щоб керування browser перетинало межу WSL2/Windows

### Варіант 2: Host-local Chrome MCP

Використовуйте `existing-session` / `user` лише тоді, коли сам Gateway працює на тому самому хості, що й Chrome.

Вибирайте це, коли:

- OpenClaw і Chrome знаходяться на одній машині
- ви хочете використовувати локальний уже залогінений стан browser
- вам не потрібен міжхостовий транспорт browser
- вам не потрібні просунуті маршрути, доступні лише в managed/raw-CDP, такі як `responsebody`, експорт PDF,
  перехоплення завантажень або пакетні дії

Для Gateway у WSL2 + Chrome у Windows віддавайте перевагу raw remote CDP. Chrome MCP є host-local, а не мостом WSL2-to-Windows.

## Робоча архітектура

Еталонна форма:

- WSL2 запускає Gateway на `127.0.0.1:18789`
- Windows відкриває Control UI у звичайному browser за адресою `http://127.0.0.1:18789/`
- Windows Chrome відкриває endpoint CDP на порту `9222`
- WSL2 може дістатися до endpoint Windows CDP
- OpenClaw вказує профіль browser на адресу, доступну з WSL2

## Чому ця конфігурація збиває з пантелику

Кілька збоїв можуть накладатися:

- WSL2 не може дістатися до endpoint Windows CDP
- Control UI відкрито з небезпечного origin
- `gateway.controlUi.allowedOrigins` не відповідає origin сторінки
- бракує token або pairing
- профіль browser вказує на неправильну адресу

Через це навіть після виправлення одного шару ви все одно можете бачити іншу помилку.

## Критичне правило для Control UI

Коли UI відкривається з Windows, використовуйте localhost Windows, якщо тільки у вас немає навмисно налаштованого HTTPS.

Використовуйте:

`http://127.0.0.1:18789/`

Не використовуйте за замовчуванням LAN IP для Control UI. Звичайний HTTP на LAN або tailnet-адресі може викликати поведінку insecure-origin/device-auth, яка не пов’язана безпосередньо з самим CDP. Див. [Control UI](/uk/web/control-ui).

## Перевіряйте по шарах

Працюйте зверху вниз. Не пропускайте кроки.

### Шар 1: Переконайтеся, що Chrome віддає CDP у Windows

Запустіть Chrome у Windows з увімкненим remote debugging:

```powershell
chrome.exe --remote-debugging-port=9222
```

З Windows спочатку перевірте сам Chrome:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Якщо це не працює у Windows, проблема ще не в OpenClaw.

### Шар 2: Переконайтеся, що WSL2 може дістатися до цього endpoint Windows

З WSL2 перевірте точну адресу, яку ви плануєте використовувати в `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Хороший результат:

- `/json/version` повертає JSON з метаданими Browser / Protocol-Version
- `/json/list` повертає JSON (порожній масив теж підходить, якщо жодної сторінки не відкрито)

Якщо це не працює:

- Windows ще не відкриває порт для WSL2
- адреса неправильна з боку WSL2
- firewall / перенаправлення порту / локальне проксіювання ще не налаштовані

Виправте це, перш ніж чіпати конфігурацію OpenClaw.

### Шар 3: Налаштуйте правильний профіль browser

Для raw remote CDP вкажіть OpenClaw адресу, доступну з WSL2:

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

- використовуйте адресу, доступну з WSL2, а не ту, що працює лише у Windows
- залишайте `attachOnly: true` для зовнішньо керованих browser
- `cdpUrl` може бути `http://`, `https://`, `ws://` або `wss://`
- використовуйте HTTP(S), коли хочете, щоб OpenClaw виявляв `/json/version`
- використовуйте WS(S) лише тоді, коли провайдер browser дає вам пряму URL-адресу DevTools socket
- протестуйте ту саму URL-адресу через `curl`, перш ніж очікувати, що OpenClaw спрацює

### Шар 4: Окремо перевірте шар Control UI

Відкрийте UI з Windows:

`http://127.0.0.1:18789/`

Потім перевірте:

- origin сторінки відповідає тому, що очікує `gateway.controlUi.allowedOrigins`
- token auth або pairing налаштовано правильно
- ви не налагоджуєте проблему автентифікації Control UI так, ніби це проблема browser

Корисна сторінка:

- [Control UI](/uk/web/control-ui)

### Шар 5: Перевірте наскрізне керування browser

З WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Хороший результат:

- вкладка відкривається в Chrome у Windows
- `openclaw browser tabs` повертає ціль
- подальші дії (`snapshot`, `screenshot`, `navigate`) працюють із тим самим профілем

## Поширені помилки, що вводять в оману

Сприймайте кожне повідомлення як підказку, специфічну для окремого шару:

- `control-ui-insecure-auth`
  - проблема origin / secure-context UI, а не проблема транспорту CDP
- `token_missing`
  - проблема конфігурації автентифікації
- `pairing required`
  - проблема схвалення пристрою
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 не може дістатися до налаштованого `cdpUrl`
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - HTTP endpoint відповів, але WebSocket DevTools усе одно не вдалося відкрити
- застарілі перевизначення viewport / dark-mode / locale / offline після віддаленої сесії
  - виконайте `openclaw browser stop --browser-profile remote`
  - це закриває активну сесію керування і звільняє стан емуляції Playwright/CDP без перезапуску gateway або зовнішнього browser
- `gateway timeout after 1500ms`
  - часто це все ще проблема досяжності CDP або повільного/недоступного віддаленого endpoint
- `No Chrome tabs found for profile="user"`
  - вибрано локальний профіль Chrome MCP, тоді як host-local вкладки недоступні

## Швидкий контрольний список тріажу

1. Windows: чи працює `curl http://127.0.0.1:9222/json/version`?
2. WSL2: чи працює `curl http://WINDOWS_HOST_OR_IP:9222/json/version`?
3. Конфігурація OpenClaw: чи використовує `browser.profiles.<name>.cdpUrl` саме цю адресу, доступну з WSL2?
4. Control UI: чи відкриваєте ви `http://127.0.0.1:18789/`, а не LAN IP?
5. Чи не намагаєтеся ви використовувати `existing-session` між WSL2 і Windows замість raw remote CDP?

## Практичний висновок

Така конфігурація зазвичай цілком життєздатна. Найскладніше те, що транспорт browser, безпека origin у Control UI та token/pairing можуть відмовляти незалежно один від одного, хоча для користувача виглядають схоже.

Якщо сумніваєтеся:

- спочатку перевірте endpoint Windows Chrome локально
- потім перевірте той самий endpoint з WSL2
- і лише після цього налагоджуйте конфігурацію OpenClaw або автентифікацію Control UI
