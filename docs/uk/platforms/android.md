---
read_when:
    - Під’єднання або повторне підключення Android-вузла
    - Налагодження виявлення Gateway або автентифікації на Android
    - Перевірка паритету історії чату між клієнтами
summary: 'Застосунок Android (node): інструкція з підключення + поверхня команд Connect/Chat/Voice/Canvas'
title: Застосунок Android
x-i18n:
    generated_at: "2026-06-27T17:45:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c02d4921c3f3011c09e564d83b773a7c155d17a82a6e70d3fd3e973597142f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Офіційний застосунок для Android доступний у [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN). Це супутній вузол, і для нього потрібен запущений OpenClaw Gateway. Вихідний код також доступний у [репозиторії OpenClaw](https://github.com/openclaw/openclaw) у `apps/android`; інструкції зі збирання див. у [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md).
</Note>

## Знімок підтримки

- Роль: застосунок супутнього вузла (Android не розміщує Gateway).
- Gateway потрібен: так (запустіть його на macOS, Linux або Windows через WSL2).
- Встановлення: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) для застосунку, [Початок роботи](/uk/start/getting-started) для Gateway, потім [Сполучення](/uk/channels/pairing).
- Gateway: [Runbook](/uk/gateway) + [Конфігурація](/uk/gateway/configuration).
  - Протоколи: [протокол Gateway](/uk/gateway/protocol) (вузли + площина керування).

## Керування системою

Керування системою (launchd/systemd) розміщується на хості Gateway. Див. [Gateway](/uk/gateway).

## Runbook підключення

Застосунок вузла Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android підключається безпосередньо до WebSocket Gateway і використовує сполучення пристрою (`role: node`).

Для Tailscale або публічних хостів Android потребує захищеної кінцевої точки:

- Бажано: Tailscale Serve / Funnel з `https://<magicdns>` / `wss://<magicdns>`
- Також підтримується: будь-яка інша URL-адреса Gateway `wss://` зі справжньою кінцевою точкою TLS
- Незашифрований `ws://` залишається підтримуваним для приватних LAN-адрес / хостів `.local`, а також `localhost`, `127.0.0.1` і мосту емулятора Android (`10.0.2.2`)

### Передумови

- Ви можете запустити Gateway на "головній" машині.
- Пристрій/емулятор Android може досягти WebSocket Gateway:
  - Та сама LAN з mDNS/NSD, **або**
  - Та сама tailnet Tailscale з Wide-Area Bonjour / unicast DNS-SD (див. нижче), **або**
  - Ручний хост/порт Gateway (резервний варіант)
- Сполучення через tailnet/публічну мобільну мережу **не** використовує сирі кінцеві точки IP tailnet `ws://`. Натомість використовуйте Tailscale Serve або іншу URL-адресу `wss://`.
- Ви можете запустити CLI (`openclaw`) на машині Gateway (або через SSH).

### 1) Запустіть Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Підтвердьте, що в журналах бачите щось на кшталт:

- `listening on ws://0.0.0.0:18789`

Для віддаленого доступу Android через Tailscale надавайте перевагу Serve/Funnel замість сирої прив’язки tailnet:

```bash
openclaw gateway --tailscale serve
```

Це надає Android захищену кінцеву точку `wss://` / `https://`. Звичайного налаштування `gateway.bind: "tailnet"` недостатньо для першого віддаленого сполучення Android, якщо ви окремо не завершуєте TLS.

### 2) Перевірте виявлення (необов’язково)

З машини Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Додаткові нотатки щодо налагодження: [Bonjour](/uk/gateway/bonjour).

Якщо ви також налаштували домен wide-area виявлення, порівняйте з:

```bash
openclaw gateway discover --json
```

Це показує `local.` разом із налаштованим доменом wide-area за один прохід і використовує розв’язану
кінцеву точку сервісу замість підказок лише з TXT.

#### Виявлення через tailnet (Відень ⇄ Лондон) за допомогою unicast DNS-SD

Виявлення Android NSD/mDNS не працює між різними мережами. Якщо ваш вузол Android і Gateway перебувають у різних мережах, але з’єднані через Tailscale, натомість використовуйте Wide-Area Bonjour / unicast DNS-SD.

Самого виявлення недостатньо для сполучення Android через tailnet/публічну мережу. Виявленому маршруту все одно потрібна захищена кінцева точка (`wss://` або Tailscale Serve):

1. Налаштуйте зону DNS-SD (приклад `openclaw.internal.`) на хості Gateway і опублікуйте записи `_openclaw-gw._tcp`.
2. Налаштуйте split DNS Tailscale для вибраного домену, що вказує на цей DNS-сервер.

Докладніше й приклад конфігурації CoreDNS: [Bonjour](/uk/gateway/bonjour).

### 3) Підключіться з Android

У застосунку Android:

- Застосунок підтримує з’єднання з Gateway активним через **foreground service** (постійне сповіщення).
- Відкрийте вкладку **Connect**.
- Використайте режим **Setup Code** або **Manual**.
- Якщо виявлення заблоковане, використайте ручні хост/порт у **Advanced controls**. Для приватних LAN-хостів `ws://` усе ще працює. Для Tailscale/публічних хостів увімкніть TLS і використовуйте кінцеву точку `wss://` / Tailscale Serve.

Після першого успішного сполучення Android автоматично перепідключається під час запуску:

- Ручна кінцева точка (якщо ввімкнено), інакше
- Останній виявлений Gateway (best-effort).

### Сигнали присутності alive

Після підключення автентифікованої сесії вузла, а також коли застосунок переходить у фоновий режим, поки
foreground service усе ще підключений, Android викликає `node.event` з
`event: "node.presence.alive"`. Gateway записує це як `lastSeenAtMs`/`lastSeenReason` у
метаданих сполученого вузла/пристрою лише після того, як відома ідентичність автентифікованого пристрою вузла.

Застосунок вважає сигнал успішно записаним лише тоді, коли відповідь Gateway містить
`handled: true`. Старіші Gateway можуть підтверджувати `node.event` через `{ "ok": true }`; така відповідь
сумісна, але не рахується як довговічне оновлення last-seen.

### 4) Схваліть сполучення (CLI)

На машині Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Деталі сполучення: [Сполучення](/uk/channels/pairing).

Необов’язково: якщо вузол Android завжди підключається з суворо контрольованої підмережі,
ви можете явно ввімкнути автоматичне схвалення вузла під час першого підключення через CIDR або точні IP:

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

За замовчуванням це вимкнено. Це застосовується лише до нового сполучення `role: node`
без запитаних областей доступу. Сполучення оператора/браузера, а також будь-яка зміна ролі, області доступу, метаданих або
публічного ключа все одно потребує ручного схвалення.

### 5) Перевірте, що вузол підключений

- Через стан вузлів:

  ```bash
  openclaw nodes status
  ```

- Через Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Чат + історія

Вкладка Chat в Android підтримує вибір сесії (типово `main`, а також інші наявні сесії):

- Історія: `chat.history` (нормалізована для відображення; вбудовані теги директив
  вилучаються з видимого тексту, XML-навантаження викликів інструментів у звичайному тексті (зокрема
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і
  обрізані блоки викликів інструментів) та витоки ASCII/повноширинних токенів керування моделлю
  вилучаються, суто беззвучні рядки асистента з токенами, як-от точні `NO_REPLY` /
  `no_reply`, пропускаються, а завеликі рядки можуть замінюватися заповнювачами)
- Надсилання: `chat.send`
- Push-оновлення (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + камера

#### Хост Gateway Canvas (рекомендовано для вебвмісту)

Якщо ви хочете, щоб вузол показував справжні HTML/CSS/JS, які агент може редагувати на диску, вкажіть вузлу хост Gateway canvas.

<Note>
Вузли завантажують canvas із HTTP-сервера Gateway (той самий порт, що й `gateway.port`, типово `18789`).
</Note>

1. Створіть `~/.openclaw/workspace/canvas/index.html` на хості Gateway.

2. Спрямуйте вузол до нього (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (необов’язково): якщо обидва пристрої в Tailscale, використовуйте ім’я MagicDNS або IP tailnet замість `.local`, наприклад `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Цей сервер вставляє клієнт live-reload в HTML і перезавантажує сторінку під час змін файлів.
Gateway також обслуговує `/__openclaw__/a2ui/`, але застосунок Android трактує віддалені сторінки A2UI як такі, що призначені лише для рендерингу. Команди A2UI з діями використовують вбудовану сторінку A2UI, що належить застосунку, перед застосуванням повідомлень.

Команди Canvas (лише на передньому плані):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (використовуйте `{"url":""}` або `{"url":"/"}`, щоб повернутися до стандартного каркаса). `canvas.snapshot` повертає `{ format, base64 }` (типово `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (застарілий псевдонім `canvas.a2ui.pushJSONL`). Ці команди використовують вбудовану сторінку A2UI, що належить застосунку, для рендерингу з підтримкою дій.

Команди камери (лише на передньому плані; обмежені дозволами):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Параметри та CLI-помічники див. у [Вузол камери](/uk/nodes/camera).

### 8) Голос + розширена поверхня команд Android

- Вкладка Voice: Android має два явні режими захоплення. **Mic** — це ручна сесія вкладки Voice, яка надсилає кожну паузу як хід чату й зупиняється, коли застосунок залишає передній план або користувач залишає вкладку Voice. **Talk** — це безперервний Talk Mode, який продовжує слухати, доки його не вимкнуть або вузол не від’єднається.
- Talk Mode підвищує наявний foreground service з `connectedDevice` до `connectedDevice|microphone` перед початком захоплення, а потім знижує його, коли Talk Mode зупиняється. Сервіс вузла оголошує `FOREGROUND_SERVICE_CONNECTED_DEVICE` з `CHANGE_NETWORK_STATE`; Android 14+ також потребує оголошення `FOREGROUND_SERVICE_MICROPHONE`, runtime-дозволу `RECORD_AUDIO` і типу сервісу мікрофона під час виконання.
- За замовчуванням Android Talk використовує нативне розпізнавання мовлення, чат Gateway і `talk.speak` через налаштований Talk-провайдер Gateway. Локальний системний TTS використовується лише тоді, коли `talk.speak` недоступний.
- Android Talk використовує realtime-ретрансляцію Gateway лише тоді, коли `talk.realtime.mode` дорівнює `realtime`, а `talk.realtime.transport` дорівнює `gateway-relay`.
- Voice wake залишається вимкненим в UX/runtime Android.
- Додаткові сімейства команд Android (доступність залежить від пристрою, дозволів і налаштувань користувача):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` лише коли ввімкнено **Settings > Phone Capabilities > Installed Apps**; типово перелічує застосунки, видимі в лаунчері.
  - `notifications.list`, `notifications.actions` (див. [Пересилання сповіщень](#notification-forwarding) нижче)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Точки входу асистента

Android підтримує запуск OpenClaw із системного тригера асистента (Google
Assistant). Після налаштування утримання кнопки Home або фраза "Hey Google, ask
OpenClaw..." відкриває застосунок і передає запит у композер чату.

Це використовує метадані Android **App Actions**, оголошені в маніфесті застосунку. На боці Gateway
не потрібна додаткова конфігурація -- intent асистента
повністю обробляється застосунком Android і пересилається як звичайне повідомлення чату.

<Note>
Доступність App Actions залежить від пристрою, версії Google Play Services
і того, чи встановив користувач OpenClaw як стандартний застосунок асистента.
</Note>

## Пересилання сповіщень

Android може пересилати сповіщення пристрою до Gateway як події. Кілька елементів керування дають змогу обмежити, які сповіщення пересилаються і коли.

| Ключ                             | Тип            | Опис                                                                                              |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Пересилати сповіщення лише від цих імен пакетів. Якщо задано, усі інші пакети ігноруються.        |
| `notifications.denyPackages`     | string[]       | Ніколи не пересилати сповіщення від цих імен пакетів. Застосовується після `allowPackages`.       |
| `notifications.quietHours.start` | string (HH:mm) | Початок вікна тихих годин (локальний час пристрою). Сповіщення придушуються протягом цього вікна. |
| `notifications.quietHours.end`   | string (HH:mm) | Кінець вікна тихих годин.                                                                         |
| `notifications.rateLimit`        | number         | Максимальна кількість пересланих сповіщень на пакет за хвилину. Надлишкові сповіщення відкидаються. |

Вибір сповіщень також використовує безпечнішу поведінку для пересланих подій сповіщень, запобігаючи випадковому пересиланню чутливих системних сповіщень.

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
Пересилання сповіщень потребує дозволу Android Notification Listener. Застосунок запитує його під час налаштування.
</Note>

## Пов’язане

- [Застосунок iOS](/uk/platforms/ios)
- [Вузли](/uk/nodes)
- [Усунення несправностей вузла Android](/uk/nodes/troubleshooting)
