---
read_when:
    - Сполучення або повторне підключення Android Node
    - Налагодження виявлення або автентифікації Android Gateway
    - Перевірка відповідності історії чату між клієнтами
summary: 'Android застосунок (Node): інструкція з підключення + поверхня команд Connect/Chat/Voice/Canvas'
title: Android застосунок
x-i18n:
    generated_at: "2026-04-25T19:17:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a47c07e3301ad7b98f4827c9c34c42b7ba2f92c55aabd7b49606ab688191b66
    source_path: platforms/android.md
    workflow: 15
---

> **Примітка:** Застосунок Android ще не було публічно випущено. Вихідний код доступний у [репозиторії OpenClaw](https://github.com/openclaw/openclaw) у `apps/android`. Ви можете зібрати його самостійно за допомогою Java 17 та Android SDK (`./gradlew :app:assemblePlayDebug`). Див. [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) для інструкцій зі збирання.

## Знімок підтримки

- Роль: застосунок супутнього Node (Android не розміщує Gateway).
- Gateway потрібен: так (запускайте його на macOS, Linux або Windows через WSL2).
- Встановлення: [Початок роботи](/uk/start/getting-started) + [Сполучення](/uk/channels/pairing).
- Gateway: [Інструкція](/uk/gateway) + [Конфігурація](/uk/gateway/configuration).
  - Протоколи: [Протокол Gateway](/uk/gateway/protocol) (Node + контрольна площина).

## Керування системою

Керування системою (`launchd`/`systemd`) розташоване на хості Gateway. Див. [Gateway](/uk/gateway).

## Інструкція з підключення

Застосунок Android Node ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android підключається безпосередньо до WebSocket Gateway і використовує сполучення пристрою (`role: node`).

Для Tailscale або публічних хостів Android потребує захищену кінцеву точку:

- Бажано: Tailscale Serve / Funnel з `https://<magicdns>` / `wss://<magicdns>`
- Також підтримується: будь-який інший URL Gateway `wss://` із реальною TLS-кінцевою точкою
- Незашифрований `ws://` залишається підтримуваним для приватних LAN-адрес / хостів `.local`, а також `localhost`, `127.0.0.1` і мосту емулятора Android (`10.0.2.2`)

### Передумови

- Ви можете запустити Gateway на “master”-машині.
- Пристрій/емулятор Android може досягти WebSocket gateway:
  - У тій самій LAN із mDNS/NSD, **або**
  - У тій самій мережі Tailscale з Wide-Area Bonjour / unicast DNS-SD (див. нижче), **або**
  - Ручний хост/порт gateway (резервний варіант)
- Мобільне сполучення через tailnet/публічну мережу **не** використовує сирі кінцеві точки `ws://` tailnet IP. Натомість використовуйте Tailscale Serve або інший URL `wss://`.
- Ви можете запускати CLI (`openclaw`) на машині gateway (або через SSH).

### 1) Запустіть Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Підтвердьте в журналах, що бачите щось на кшталт:

- `listening on ws://0.0.0.0:18789`

Для віддаленого доступу Android через Tailscale віддавайте перевагу Serve/Funnel замість сирого прив’язування tailnet:

```bash
openclaw gateway --tailscale serve
```

Це надає Android захищену кінцеву точку `wss://` / `https://`. Простого налаштування `gateway.bind: "tailnet"` недостатньо для першого віддаленого сполучення Android, якщо ви також окремо не завершуєте TLS.

### 2) Перевірте виявлення (необов’язково)

На машині gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Більше приміток щодо налагодження: [Bonjour](/uk/gateway/bonjour).

Якщо ви також налаштували wide-area домен для виявлення, порівняйте з:

```bash
openclaw gateway discover --json
```

Це показує `local.` разом із налаштованим wide-area доменом за один прохід і використовує розв’язану кінцеву точку сервісу замість лише TXT-підказок.

#### Виявлення через tailnet (Vienna ⇄ London) за допомогою unicast DNS-SD

Виявлення Android NSD/mDNS не працює між різними мережами. Якщо ваш Android Node і gateway перебувають у різних мережах, але з’єднані через Tailscale, використовуйте Wide-Area Bonjour / unicast DNS-SD.

Самого виявлення недостатньо для сполучення Android через tailnet/публічну мережу. Виявлений маршрут усе одно потребує захищеної кінцевої точки (`wss://` або Tailscale Serve):

1. Налаштуйте зону DNS-SD (наприклад, `openclaw.internal.`) на хості gateway і опублікуйте записи `_openclaw-gw._tcp`.
2. Налаштуйте Tailscale split DNS для вибраного вами домену з вказанням цього DNS-сервера.

Докладніше та приклад конфігурації CoreDNS: [Bonjour](/uk/gateway/bonjour).

### 3) Підключіться з Android

У застосунку Android:

- Застосунок підтримує з’єднання з gateway через **foreground service** (постійну сповіщення).
- Відкрийте вкладку **Connect**.
- Використовуйте режим **Setup Code** або **Manual**.
- Якщо виявлення заблоковане, використовуйте ручний хост/порт у **Advanced controls**. Для приватних LAN-хостів `ws://` усе ще працює. Для Tailscale/публічних хостів увімкніть TLS і використовуйте кінцеву точку `wss://` / Tailscale Serve.

Після першого успішного сполучення Android автоматично перепідключається під час запуску:

- Ручна кінцева точка (якщо ввімкнено), інакше
- Останній виявлений gateway (best-effort).

### 4) Підтвердьте сполучення (CLI)

На машині gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Докладніше про сполучення: [Сполучення](/uk/channels/pairing).

Необов’язково: якщо Android Node завжди підключається з жорстко контрольованої підмережі,
ви можете явно ввімкнути авто-підтвердження першого сполучення Node для конкретних CIDR або точних IP:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Це вимкнено типово. Це застосовується лише до нового сполучення `role: node` без запитаних scopes. Сполучення operator/browser і будь-які зміни ролі, scope, metadata або відкритого ключа все одно потребують ручного підтвердження.

### 5) Перевірте, що Node підключено

- Через статус Node:

  ```bash
  openclaw nodes status
  ```

- Через Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + history

Вкладка Chat в Android підтримує вибір сеансу (типово `main`, а також інші наявні сеанси):

- Історія: `chat.history` (нормалізовано для відображення; вбудовані теги директив видаляються з видимого тексту, XML-навантаження викликів інструментів у звичайному тексті (включно з `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, а також обрізаними блоками викликів інструментів) і витіклі ASCII/повноширинні токени керування моделлю видаляються, чисті рядки помічника з тихими токенами, як-от точні `NO_REPLY` / `no_reply`, пропускаються, а надто великі рядки можуть бути замінені заповнювачами)
- Надсилання: `chat.send`
- Push-оновлення (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + camera

#### Хост Gateway Canvas (рекомендовано для вебвмісту)

Якщо ви хочете, щоб Node показував справжні HTML/CSS/JS, які агент може редагувати на диску, спрямуйте Node на хост canvas Gateway.

Примітка: Node завантажують canvas із HTTP-сервера Gateway (той самий порт, що й `gateway.port`, типово `18789`).

1. Створіть `~/.openclaw/workspace/canvas/index.html` на хості gateway.

2. Перейдіть до нього на Node (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (необов’язково): якщо обидва пристрої в Tailscale, використовуйте ім’я MagicDNS або tailnet IP замість `.local`, наприклад `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Цей сервер вбудовує клієнт live-reload в HTML і перезавантажує сторінку при зміні файлів.
Хост A2UI розташований за адресою `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Команди Canvas (лише у foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (використовуйте `{"url":""}` або `{"url":"/"}` для повернення до типової scaffolding-сторінки). `canvas.snapshot` повертає `{ format, base64 }` (типово `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` — застарілий псевдонім)

Команди camera (лише у foreground; із контролем дозволів):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Параметри та допоміжні засоби CLI див. у [Camera node](/uk/nodes/camera).

### 8) Voice + розширена поверхня команд Android

- Вкладка Voice: Android має два явні режими захоплення. **Mic** — це ручний сеанс вкладки Voice, який надсилає кожну паузу як хід чату і зупиняється, коли застосунок виходить із foreground або користувач залишає вкладку Voice. **Talk** — це безперервний Talk Mode, який продовжує слухати, доки його не вимкнено або Node не відключиться.
- Talk Mode підвищує наявний foreground service з `dataSync` до `dataSync|microphone` перед початком захоплення, а потім знижує його, коли Talk Mode зупиняється. Android 14+ вимагає оголошення `FOREGROUND_SERVICE_MICROPHONE`, runtime-дозвіл `RECORD_AUDIO` і тип служби microphone під час виконання.
- Озвучені відповіді використовують `talk.speak` через налаштованого провайдера Talk gateway. Локальний системний TTS використовується лише тоді, коли `talk.speak` недоступний.
- Голосове пробудження залишається вимкненим в UX/runtime Android.
- Додаткові сімейства команд Android (доступність залежить від пристрою та дозволів):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (див. [Пересилання сповіщень](#notification-forwarding) нижче)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Точки входу помічника

Android підтримує запуск OpenClaw із системного тригера помічника (Google
Assistant). Якщо це налаштовано, утримання кнопки home або фраза "Hey Google, ask
OpenClaw..." відкриває застосунок і передає запит у поле введення чату.

Для цього використовуються метадані Android **App Actions**, оголошені в маніфесті застосунку. Додаткове налаштування на боці gateway не потрібне -- намір помічника повністю обробляється застосунком Android і пересилається як звичайне повідомлення чату.

<Note>
Доступність App Actions залежить від пристрою, версії Google Play Services
і від того, чи встановив користувач OpenClaw як типовий застосунок-помічник.
</Note>

## Пересилання сповіщень

Android може пересилати сповіщення пристрою до gateway як події. Кілька елементів керування дають змогу обмежити, які саме сповіщення пересилаються і коли.

| Key                              | Type           | Description                                                                                          |
| -------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Пересилати лише сповіщення від цих назв пакетів. Якщо задано, усі інші пакети ігноруються.         |
| `notifications.denyPackages`     | string[]       | Ніколи не пересилати сповіщення від цих назв пакетів. Застосовується після `allowPackages`.         |
| `notifications.quietHours.start` | string (HH:mm) | Початок вікна тихих годин (локальний час пристрою). Сповіщення пригнічуються протягом цього вікна. |
| `notifications.quietHours.end`   | string (HH:mm) | Кінець вікна тихих годин.                                                                            |
| `notifications.rateLimit`        | number         | Максимальна кількість пересланих сповіщень на пакет за хвилину. Надлишкові сповіщення відкидаються. |

Пікер сповіщень також використовує безпечнішу поведінку для подій пересланих сповіщень, запобігаючи випадковому пересиланню чутливих системних сповіщень.

Приклад конфігурації:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
Для пересилання сповіщень потрібен дозвіл Android Notification Listener. Під час налаштування застосунок запропонує надати його.
</Note>

## Пов’язане

- [Застосунок iOS](/uk/platforms/ios)
- [Node](/uk/nodes)
- [Усунення несправностей Android Node](/uk/nodes/troubleshooting)
