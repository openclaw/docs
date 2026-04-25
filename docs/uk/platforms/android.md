---
read_when:
    - Прив’язка або повторне підключення Android Node
    - Налагодження виявлення Gateway або автентифікації Android
    - Перевірка паритету історії чату між клієнтами
summary: 'Android app (node): інструкція з підключення + поверхня команд Connect/Chat/Voice/Canvas'
title: Android app
x-i18n:
    generated_at: "2026-04-25T05:56:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 789de91275a11e63878ba670b9f316538d6b4731c22ec491b2c802f1cd14dcec
    source_path: platforms/android.md
    workflow: 15
---

> **Примітка:** Android app ще не випущено публічно. Вихідний код доступний у [репозиторії OpenClaw](https://github.com/openclaw/openclaw) у `apps/android`. Ви можете зібрати його самостійно за допомогою Java 17 і Android SDK (`./gradlew :app:assemblePlayDebug`). Інструкції зі збирання дивіться в [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md).

## Стан підтримки

- Роль: супутній app Node (Android не розміщує Gateway).
- Gateway потрібен: так (запускайте його на macOS, Linux або Windows через WSL2).
- Встановлення: [Початок роботи](/uk/start/getting-started) + [Прив’язка](/uk/channels/pairing).
- Gateway: [Інструкція](/uk/gateway) + [Конфігурація](/uk/gateway/configuration).
  - Протоколи: [Протокол Gateway](/uk/gateway/protocol) (Nodes + площина керування).

## Керування системою

Керування системою (launchd/systemd) розміщується на хості Gateway. Див. [Gateway](/uk/gateway).

## Інструкція з підключення

Android Node app ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android підключається безпосередньо до WebSocket Gateway і використовує прив’язку пристрою (`role: node`).

Для Tailscale або публічних хостів Android потребує захищеного endpoint:

- Бажано: Tailscale Serve / Funnel з `https://<magicdns>` / `wss://<magicdns>`
- Також підтримується: будь-який інший URL Gateway `wss://` із реальним TLS endpoint
- Незашифрований `ws://` як і раніше підтримується для приватних LAN-адрес / хостів `.local`, а також `localhost`, `127.0.0.1` і мосту емулятора Android (`10.0.2.2`)

### Передумови

- Ви можете запустити Gateway на «головній» машині.
- Пристрій/емулятор Android може досягти WebSocket gateway:
  - Та сама LAN з mDNS/NSD, **або**
  - Та сама tailnet Tailscale з Wide-Area Bonjour / unicast DNS-SD (див. нижче), **або**
  - Ручне задання хоста/порту gateway (резервний варіант)
- Мобільна прив’язка через tailnet/публічну мережу **не** використовує сирі endpoint `ws://` на IP tailnet. Замість цього використовуйте Tailscale Serve або інший URL `wss://`.
- Ви можете запускати CLI (`openclaw`) на машині gateway (або через SSH).

### 1) Запустіть Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Переконайтеся, що в журналах є щось на кшталт:

- `listening on ws://0.0.0.0:18789`

Для віддаленого доступу Android через Tailscale надавайте перевагу Serve/Funnel замість прямої прив’язки tailnet:

```bash
openclaw gateway --tailscale serve
```

Це надає Android захищений endpoint `wss://` / `https://`. Звичайного налаштування `gateway.bind: "tailnet"` недостатньо для першої віддаленої прив’язки Android, якщо ви також окремо не завершуєте TLS.

### 2) Перевірте виявлення (необов’язково)

З машини gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Додаткові примітки з налагодження: [Bonjour](/uk/gateway/bonjour).

Якщо ви також налаштували домен wide-area discovery, порівняйте з:

```bash
openclaw gateway discover --json
```

Це показує `local.` разом із налаштованим wide-area доменом за один прохід і використовує розв’язаний
endpoint сервісу замість лише підказок TXT.

#### Виявлення через tailnet (Відень ⇄ Лондон) за допомогою unicast DNS-SD

Виявлення Android через NSD/mDNS не проходить між мережами. Якщо ваш Android Node і gateway перебувають у різних мережах, але з’єднані через Tailscale, натомість використовуйте Wide-Area Bonjour / unicast DNS-SD.

Самого лише виявлення недостатньо для прив’язки Android через tailnet/публічну мережу. Виявлений маршрут усе одно потребує захищеного endpoint (`wss://` або Tailscale Serve):

1. Налаштуйте зону DNS-SD (наприклад, `openclaw.internal.`) на хості gateway і опублікуйте записи `_openclaw-gw._tcp`.
2. Налаштуйте split DNS у Tailscale для вибраного домену з указанням на цей DNS-сервер.

Докладніше та приклад конфігурації CoreDNS: [Bonjour](/uk/gateway/bonjour).

### 3) Підключіться з Android

У Android app:

- App підтримує з’єднання з gateway через **foreground service** (постійне сповіщення).
- Відкрийте вкладку **Connect**.
- Використайте режим **Setup Code** або **Manual**.
- Якщо виявлення заблоковане, використовуйте ручне задання хоста/порту в **Advanced controls**. Для приватних хостів LAN `ws://` усе ще працює. Для Tailscale/публічних хостів увімкніть TLS і використовуйте endpoint `wss://` / Tailscale Serve.

Після першої успішної прив’язки Android автоматично перепідключається під час запуску:

- Manual endpoint (якщо ввімкнено), інакше
- Останній виявлений gateway (best-effort).

### 4) Схваліть прив’язку (CLI)

На машині gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Докладніше про прив’язку: [Прив’язка](/uk/channels/pairing).

Необов’язково: якщо Android Node завжди підключається з жорстко контрольованої підмережі,
ви можете явно ввімкнути автосхвалення першої прив’язки Node за явними CIDR або точними IP:

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

За замовчуванням це вимкнено. Це застосовується лише до нової прив’язки `role: node` без
запитаних scopes. Прив’язка operator/browser і будь-яка зміна ролі, scope, metadata або
публічного ключа, як і раніше, потребують ручного схвалення.

### 5) Перевірте, що Node підключено

- Через статус Nodes:

  ```bash
  openclaw nodes status
  ```

- Через Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + історія

Вкладка Chat в Android підтримує вибір сесії (типово `main`, а також інші наявні сесії):

- Історія: `chat.history` (нормалізована для відображення; inline-теги директив
  прибираються з видимого тексту, XML payload викликів інструментів у звичайному тексті (включно з
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і
  обрізаними блоками викликів інструментів) та витоки ASCII/повноширинних токенів керування моделлю
  прибираються, чисті рядки асистента лише з тихими токенами, такі як точні `NO_REPLY` /
  `no_reply`, пропускаються, а надто великі рядки можуть бути замінені заповнювачами)
- Надсилання: `chat.send`
- Push-оновлення (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + камера

#### Хост Canvas Gateway (рекомендовано для web-вмісту)

Якщо ви хочете, щоб Node показував справжній HTML/CSS/JS, який агент може редагувати на диску, спрямуйте Node на canvas host Gateway.

Примітка: Nodes завантажують canvas з HTTP-сервера Gateway (той самий порт, що й `gateway.port`, типово `18789`).

1. Створіть `~/.openclaw/workspace/canvas/index.html` на хості gateway.

2. Перейдіть до нього з Node (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (необов’язково): якщо обидва пристрої в Tailscale, використовуйте ім’я MagicDNS або IP tailnet замість `.local`, наприклад `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Цей сервер ін’єктує клієнт live-reload у HTML і перезавантажує сторінку при зміні файлів.
Хост A2UI розташовано за адресою `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Команди Canvas (лише на передньому плані):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (використовуйте `{"url":""}` або `{"url":"/"}`, щоб повернутися до типового scaffold). `canvas.snapshot` повертає `{ format, base64 }` (типово `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` — застарілий alias)

Команди камери (лише на передньому плані; обмежуються дозволами):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Параметри та допоміжні інструменти CLI дивіться в [Camera node](/uk/nodes/camera).

### 8) Voice + розширена поверхня команд Android

- Voice: Android використовує єдиний сценарій увімкнення/вимкнення мікрофона на вкладці Voice із захопленням транскрипту та відтворенням `talk.speak`. Локальний системний TTS використовується лише коли `talk.speak` недоступний. Voice зупиняється, коли app виходить із переднього плану.
- Перемикачі пробудження Voice/talk-mode наразі прибрані з UX/runtime Android.
- Додаткові сімейства команд Android (доступність залежить від пристрою та дозволів):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (див. [Пересилання сповіщень](#notification-forwarding) нижче)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Точки входу Assistant

Android підтримує запуск OpenClaw із системного тригера Assistant (Google
Assistant). Якщо це налаштовано, утримання кнопки home або фраза "Hey Google, ask
OpenClaw..." відкриває app і передає промпт у поле введення чату.

Для цього використовуються метадані Android **App Actions**, оголошені в маніфесті app. Жодної
додаткової конфігурації на боці gateway не потрібно — intent Assistant повністю
обробляється Android app і пересилається як звичайне повідомлення чату.

<Note>
Доступність App Actions залежить від пристрою, версії Google Play Services
і від того, чи встановив користувач OpenClaw як app Assistant за замовчуванням.
</Note>

## Пересилання сповіщень

Android може пересилати сповіщення пристрою до gateway як події. Кілька елементів керування дають змогу обмежити, які сповіщення пересилаються і коли.

| Key                              | Type           | Опис                                                                                              |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Пересилати лише сповіщення від цих назв пакетів. Якщо задано, усі інші пакети ігноруються.       |
| `notifications.denyPackages`     | string[]       | Ніколи не пересилати сповіщення від цих назв пакетів. Застосовується після `allowPackages`.      |
| `notifications.quietHours.start` | string (HH:mm) | Початок вікна тихих годин (локальний час пристрою). Сповіщення пригнічуються в це вікно.         |
| `notifications.quietHours.end`   | string (HH:mm) | Кінець вікна тихих годин.                                                                         |
| `notifications.rateLimit`        | number         | Максимум пересланих сповіщень на пакет за хвилину. Надлишкові сповіщення відкидаються.           |

Засіб вибору сповіщень також використовує безпечнішу поведінку для подій пересланих сповіщень, запобігаючи випадковому пересиланню чутливих системних сповіщень.

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
Пересилання сповіщень потребує дозволу Android Notification Listener. App запитує його під час налаштування.
</Note>

## Пов’язане

- [iOS app](/uk/platforms/ios)
- [Nodes](/uk/nodes)
- [Усунення несправностей Android Node](/uk/nodes/troubleshooting)
