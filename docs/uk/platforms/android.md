---
read_when:
    - Сполучення або повторне підключення Android Node
    - Налагодження виявлення Android Gateway або автентифікації
    - Перевірка паритету історії чату між клієнтами
summary: 'Android-застосунок (Node): інструкція з підключення + командний інтерфейс Підключення/Чату/Голосу/Полотна'
title: Застосунок Android
x-i18n:
    generated_at: "2026-05-06T05:49:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: cce53df4675e01858ced3d58142512ad096ced0ef50cd617e57b65f9cf911c05
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Застосунок для Android ще не було публічно випущено. Вихідний код доступний у [репозиторії OpenClaw](https://github.com/openclaw/openclaw) у `apps/android`. Ви можете зібрати його самостійно за допомогою Java 17 та Android SDK (`./gradlew :app:assemblePlayDebug`). Інструкції зі збирання див. у [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md).
</Note>

## Знімок підтримки

- Роль: супровідний застосунок вузла (Android не розміщує Gateway).
- Gateway потрібен: так (запустіть його на macOS, Linux або Windows через WSL2).
- Встановлення: [Початок роботи](/uk/start/getting-started) + [Сполучення](/uk/channels/pairing).
- Gateway: [Операційний довідник](/uk/gateway) + [Конфігурація](/uk/gateway/configuration).
  - Протоколи: [протокол Gateway](/uk/gateway/protocol) (вузли + площина керування).

## Керування системою

Керування системою (launchd/systemd) розміщене на хості Gateway. Див. [Gateway](/uk/gateway).

## Операційний довідник підключення

Застосунок вузла Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android підключається безпосередньо до WebSocket Gateway і використовує сполучення пристрою (`role: node`).

Для Tailscale або публічних хостів Android потребує захищеної кінцевої точки:

- Бажано: Tailscale Serve / Funnel з `https://<magicdns>` / `wss://<magicdns>`
- Також підтримується: будь-яка інша URL-адреса Gateway `wss://` зі справжньою кінцевою точкою TLS
- Незашифрований `ws://` і далі підтримується для адрес приватної LAN / хостів `.local`, а також `localhost`, `127.0.0.1` і мосту емулятора Android (`10.0.2.2`)

### Передумови

- Ви можете запустити Gateway на "головній" машині.
- Пристрій/емулятор Android може дістатися до WebSocket gateway:
  - Та сама LAN з mDNS/NSD, **або**
  - Та сама tailnet Tailscale з Wide-Area Bonjour / unicast DNS-SD (див. нижче), **або**
  - Ручне задання хоста/порту gateway (резервний варіант)
- Мобільне сполучення через tailnet/публічну мережу **не** використовує сирі кінцеві точки IP tailnet `ws://`. Натомість використовуйте Tailscale Serve або іншу URL-адресу `wss://`.
- Ви можете запустити CLI (`openclaw`) на машині gateway (або через SSH).

### 1) Запустіть Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Переконайтеся, що в журналах бачите щось на кшталт:

- `listening on ws://0.0.0.0:18789`

Для віддаленого доступу Android через Tailscale надавайте перевагу Serve/Funnel замість сирого прив’язування tailnet:

```bash
openclaw gateway --tailscale serve
```

Це дає Android захищену кінцеву точку `wss://` / `https://`. Простого налаштування `gateway.bind: "tailnet"` недостатньо для першого віддаленого сполучення Android, якщо ви також окремо не завершуєте TLS.

### 2) Перевірте виявлення (необов’язково)

З машини gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Додаткові нотатки з налагодження: [Bonjour](/uk/gateway/bonjour).

Якщо ви також налаштували домен широкозонного виявлення, порівняйте з:

```bash
openclaw gateway discover --json
```

Це показує `local.` разом із налаштованим широкозонним доменом за один прохід і використовує розв’язану кінцеву точку сервісу замість підказок лише з TXT.

#### Виявлення tailnet (Відень ⇄ Лондон) через unicast DNS-SD

Виявлення Android NSD/mDNS не переходить між мережами. Якщо ваш вузол Android і gateway перебувають у різних мережах, але з’єднані через Tailscale, натомість використовуйте Wide-Area Bonjour / unicast DNS-SD.

Самого виявлення недостатньо для сполучення Android через tailnet/публічну мережу. Виявлений маршрут усе одно потребує захищеної кінцевої точки (`wss://` або Tailscale Serve):

1. Налаштуйте зону DNS-SD (приклад `openclaw.internal.`) на хості gateway і опублікуйте записи `_openclaw-gw._tcp`.
2. Налаштуйте split DNS Tailscale для вибраного домену, що вказує на цей DNS-сервер.

Подробиці та приклад конфігурації CoreDNS: [Bonjour](/uk/gateway/bonjour).

### 3) Підключіться з Android

У застосунку Android:

- Застосунок підтримує з’єднання з gateway активним через **службу переднього плану** (постійне сповіщення).
- Відкрийте вкладку **Підключення**.
- Використовуйте режим **Код налаштування** або **Ручний**.
- Якщо виявлення заблоковано, використовуйте ручні хост/порт у **Розширених елементах керування**. Для хостів приватної LAN `ws://` і далі працює. Для хостів Tailscale/публічних хостів увімкніть TLS і використовуйте кінцеву точку `wss://` / Tailscale Serve.

Після першого успішного сполучення Android автоматично перепідключається під час запуску:

- Ручна кінцева точка (якщо ввімкнено), інакше
- Останній виявлений gateway (за можливості).

### Сигнали присутності alive

Після підключення автентифікованого сеансу вузла, а також коли застосунок переходить у фон, поки служба переднього плану все ще підключена, Android викликає `node.event` з `event: "node.presence.alive"`. Gateway записує це як `lastSeenAtMs`/`lastSeenReason` у метаданих сполученого вузла/пристрою лише після того, як стане відома ідентичність автентифікованого вузлового пристрою.

Застосунок рахує сигнал як успішно записаний лише тоді, коли відповідь gateway містить `handled: true`. Старіші gateway можуть підтверджувати `node.event` через `{ "ok": true }`; така відповідь сумісна, але не рахується як довговічне оновлення останньої видимості.

### 4) Схваліть сполучення (CLI)

На машині gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Подробиці сполучення: [Сполучення](/uk/channels/pairing).

Необов’язково: якщо вузол Android завжди підключається з жорстко контрольованої підмережі, ви можете ввімкнути автоматичне схвалення вузла під час першого сполучення з явними CIDR або точними IP-адресами:

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

Це вимкнено за замовчуванням. Це застосовується лише до нового сполучення `role: node` без запитаних областей доступу. Сполучення оператора/браузера та будь-яка зміна ролі, області доступу, метаданих або публічного ключа все одно потребують ручного схвалення.

### 5) Перевірте, що вузол підключено

- Через статус вузлів:

  ```bash
  openclaw nodes status
  ```

- Через Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Чат + історія

Вкладка Chat в Android підтримує вибір сеансу (типово `main`, а також інші наявні сеанси):

- Історія: `chat.history` (нормалізована для відображення; inline-теги директив вилучаються з видимого тексту, XML-навантаження викликів інструментів у plain text (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізані блоки викликів інструментів) та витеклі ASCII/повноширинні керівні токени моделі вилучаються, рядки асистента лише з безшумними токенами, як-от точні `NO_REPLY` / `no_reply`, пропускаються, а надмірно великі рядки можуть замінюватися заповнювачами)
- Надсилання: `chat.send`
- Push-оновлення (за можливості): `chat.subscribe` → `event:"chat"`

### 7) Canvas + камера

#### Хост Canvas Gateway (рекомендовано для вебвмісту)

Якщо ви хочете, щоб вузол показував справжні HTML/CSS/JS, які агент може редагувати на диску, спрямуйте вузол на хост Canvas Gateway.

<Note>
Вузли завантажують canvas із HTTP-сервера Gateway (той самий порт, що й `gateway.port`, типово `18789`).
</Note>

1. Створіть `~/.openclaw/workspace/canvas/index.html` на хості gateway.

2. Перейдіть вузлом до нього (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (необов’язково): якщо обидва пристрої в Tailscale, використовуйте ім’я MagicDNS або IP tailnet замість `.local`, наприклад `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Цей сервер вставляє клієнт live-reload в HTML і перезавантажує сторінку після змін файлів.
Хост A2UI доступний за `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Команди Canvas (лише передній план):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (використовуйте `{"url":""}` або `{"url":"/"}`, щоб повернутися до стандартного шаблону). `canvas.snapshot` повертає `{ format, base64 }` (типово `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` застарілий псевдонім)

Команди камери (лише передній план; обмежено дозволами):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Параметри та допоміжні команди CLI див. у [вузлі камери](/uk/nodes/camera).

### 8) Голос + розширена поверхня команд Android

- Вкладка Voice: Android має два явні режими захоплення. **Mic** — це ручний сеанс вкладки Voice, який надсилає кожну паузу як хід чату й зупиняється, коли застосунок залишає передній план або користувач залишає вкладку Voice. **Talk** — це безперервний Talk Mode, який продовжує слухати, доки його не вимкнуть або вузол не від’єднається.
- Talk Mode підвищує наявну службу переднього плану з `dataSync` до `dataSync|microphone` перед початком захоплення, а потім знижує її, коли Talk Mode зупиняється. Android 14+ потребує декларації `FOREGROUND_SERVICE_MICROPHONE`, runtime-дозволу `RECORD_AUDIO` і типу служби мікрофона під час виконання.
- Озвучені відповіді використовують `talk.speak` через налаштованого провайдера Talk gateway. Локальний системний TTS використовується лише тоді, коли `talk.speak` недоступний.
- Голосова активація залишається вимкненою в UX/runtime Android.
- Додаткові сімейства команд Android (доступність залежить від пристрою + дозволів):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (див. [пересилання сповіщень](#notification-forwarding) нижче)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Точки входу асистента

Android підтримує запуск OpenClaw із системного тригера асистента (Google Assistant). Коли це налаштовано, утримання кнопки додому або фраза "Hey Google, ask OpenClaw..." відкриває застосунок і передає запит у композер чату.

Для цього використовуються метадані Android **App Actions**, оголошені в маніфесті застосунку. Додаткової конфігурації на стороні gateway не потрібно -- intent асистента повністю обробляється застосунком Android і пересилається як звичайне повідомлення чату.

<Note>
Доступність App Actions залежить від пристрою, версії Google Play Services і від того, чи встановив користувач OpenClaw як застосунок асистента за замовчуванням.
</Note>

## Пересилання сповіщень

Android може пересилати сповіщення пристрою до gateway як події. Кілька елементів керування дають змогу обмежити, які сповіщення пересилаються і коли.

| Ключ                             | Тип            | Опис                                                                                                       |
| -------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Пересилати сповіщення лише з цих назв пакетів. Якщо задано, усі інші пакети ігноруються.                  |
| `notifications.denyPackages`     | string[]       | Ніколи не пересилати сповіщення з цих назв пакетів. Застосовується після `allowPackages`.                 |
| `notifications.quietHours.start` | string (HH:mm) | Початок вікна тихих годин (локальний час пристрою). Сповіщення пригнічуються протягом цього вікна.        |
| `notifications.quietHours.end`   | string (HH:mm) | Кінець вікна тихих годин.                                                                                  |
| `notifications.rateLimit`        | number         | Максимальна кількість пересланих сповіщень на пакет за хвилину. Надлишкові сповіщення відкидаються.       |

Засіб вибору сповіщень також використовує безпечнішу поведінку для пересланих подій сповіщень, запобігаючи випадковому пересиланню чутливих системних сповіщень.

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
