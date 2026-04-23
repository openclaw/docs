---
read_when:
    - Pairing або повторне підключення Android Node
    - Налагодження виявлення gateway або auth на Android
    - Перевірка паритету історії чату між клієнтами
summary: 'Android app (Node): runbook підключення + поверхня команд Connect/Chat/Voice/Canvas'
title: Android app
x-i18n:
    generated_at: "2026-04-23T21:00:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5753da56938c05cf8b63d22bd73dd4a1cd729c8a1b0599904b634ebeac841104
    source_path: platforms/android.md
    workflow: 15
---

# Android app (Node)

> **Примітка:** Android app ще не було публічно випущено. Вихідний код доступний у [репозиторії OpenClaw](https://github.com/openclaw/openclaw) у `apps/android`. Ви можете зібрати його самостійно за допомогою Java 17 і Android SDK (`./gradlew :app:assemblePlayDebug`). Інструкції зі збірки див. у [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md).

## Короткий огляд підтримки

- Роль: companion Node app (Android не хостить Gateway).
- Gateway потрібен: так (запускайте його на macOS, Linux або Windows через WSL2).
- Установлення: [Getting Started](/uk/start/getting-started) + [Pairing](/uk/channels/pairing).
- Gateway: [Runbook](/uk/gateway) + [Configuration](/uk/gateway/configuration).
  - Протоколи: [Gateway protocol](/uk/gateway/protocol) (Node + control plane).

## Керування системою

Керування системою (launchd/systemd) живе на хості Gateway. Див. [Gateway](/uk/gateway).

## Runbook підключення

Android Node app ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android підключається напряму до WebSocket Gateway і використовує device pairing (`role: node`).

Для Tailscale або публічних хостів Android вимагає безпечний endpoint:

- Бажано: Tailscale Serve / Funnel з `https://<magicdns>` / `wss://<magicdns>`
- Також підтримується: будь-яка інша URL Gateway `wss://` зі справжнім TLS endpoint
- Відкритий `ws://` усе ще підтримується для приватних LAN-адрес / `.local` host-ів, а також `localhost`, `127.0.0.1` і bridge Android emulator (`10.0.2.2`)

### Передумови

- Ви можете запустити Gateway на “master”-машині.
- Пристрій/emulator Android може дістатися до WebSocket gateway:
  - Та сама LAN з mDNS/NSD, **або**
  - Той самий Tailscale tailnet з Wide-Area Bonjour / unicast DNS-SD (див. нижче), **або**
  - Ручний host/port gateway (fallback)
- Pairing Android через tailnet/public **не** використовує сирі `ws://` endpoints на tailnet IP. Натомість використовуйте Tailscale Serve або іншу URL `wss://`.
- Ви можете запускати CLI (`openclaw`) на машині gateway (або через SSH).

### 1) Запустіть Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Підтвердьте в логах, що бачите щось на кшталт:

- `listening on ws://0.0.0.0:18789`

Для віддаленого доступу Android через Tailscale віддавайте перевагу Serve/Funnel замість сирого bind tailnet:

```bash
openclaw gateway --tailscale serve
```

Це дає Android безпечний endpoint `wss://` / `https://`. Простого налаштування `gateway.bind: "tailnet"` недостатньо для першого віддаленого pairing Android, якщо ви також окремо не завершуєте TLS.

### 2) Перевірте виявлення (необов’язково)

На машині gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Додаткові примітки щодо налагодження: [Bonjour](/uk/gateway/bonjour).

Якщо ви також налаштували wide-area discovery domain, порівняйте з:

```bash
openclaw gateway discover --json
```

Це показує `local.` і налаштований wide-area domain за один прохід та використовує розв’язаний
service endpoint замість підказок лише з TXT.

#### Виявлення через tailnet (Vienna ⇄ London) за допомогою unicast DNS-SD

Виявлення Android через NSD/mDNS не проходить між мережами. Якщо ваш Android Node і gateway знаходяться в різних мережах, але з’єднані через Tailscale, використовуйте Wide-Area Bonjour / unicast DNS-SD.

Самого лише виявлення недостатньо для pairing Android через tailnet/public. Виявлений маршрут усе одно потребує безпечний endpoint (`wss://` або Tailscale Serve):

1. Налаштуйте DNS-SD zone (наприклад, `openclaw.internal.`) на хості gateway і опублікуйте записи `_openclaw-gw._tcp`.
2. Налаштуйте split DNS Tailscale для вибраного домену, вказавши цей DNS server.

Подробиці та приклад конфігурації CoreDNS: [Bonjour](/uk/gateway/bonjour).

### 3) Підключіться з Android

В Android app:

- App підтримує з’єднання з gateway через **foreground service** (постійне сповіщення).
- Відкрийте вкладку **Connect**.
- Використовуйте режим **Setup Code** або **Manual**.
- Якщо виявлення заблоковано, використовуйте ручний host/port у **Advanced controls**. Для приватних LAN host-ів `ws://` і далі працює. Для Tailscale/public host-ів увімкніть TLS і використовуйте endpoint `wss://` / Tailscale Serve.

Після першого успішного pairing Android автоматично перепідключається під час запуску:

- до Manual endpoint (якщо ввімкнено), інакше
- до останнього виявленого gateway (best-effort).

### 4) Схваліть pairing (CLI)

На машині gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Подробиці pairing: [Pairing](/uk/channels/pairing).

### 5) Переконайтеся, що Node підключено

- Через статус Node:

  ```bash
  openclaw nodes status
  ```

- Через Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Чат + історія

Вкладка Chat в Android підтримує вибір сесії (типово `main`, плюс інші наявні сесії):

- Історія: `chat.history` (нормалізована для відображення; inline directive tags
  видаляються з видимого тексту, XML payload-і tool call у plain text (включно з
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` та
  обрізаними блоками tool-call) і витіклі ASCII/full-width control tokens моделі
  видаляються, чисті assistant rows лише з silent-token, як-от точний `NO_REPLY` /
  `no_reply`, пропускаються, а надто великі rows можуть замінюватися placeholders)
- Надсилання: `chat.send`
- Push-оновлення (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + camera

#### Gateway Canvas Host (рекомендовано для web content)

Якщо ви хочете, щоб Node показував справжні HTML/CSS/JS, які агент може редагувати на диску, націльте Node на Gateway canvas host.

Примітка: Node завантажують canvas з HTTP-сервера Gateway (той самий порт, що й `gateway.port`, типово `18789`).

1. Створіть `~/.openclaw/workspace/canvas/index.html` на хості gateway.

2. Перейдіть до нього на Node (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (необов’язково): якщо обидва пристрої в Tailscale, використовуйте ім’я MagicDNS або IP tailnet замість `.local`, наприклад `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Цей сервер додає клієнт live-reload в HTML і перезавантажує його після змін у файлах.
A2UI host доступний за адресою `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Команди Canvas (лише на передньому плані):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (використовуйте `{"url":""}` або `{"url":"/"}`, щоб повернутися до типового scaffold). `canvas.snapshot` повертає `{ format, base64 }` (типово `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` — застарілий псевдонім)

Команди камери (лише на передньому плані; захищені дозволами):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Параметри та helper-и CLI див. у [Camera node](/uk/nodes/camera).

### 8) Voice + розширена поверхня команд Android

- Voice: Android використовує єдиний потік увімкнення/вимкнення мікрофона у вкладці Voice із захопленням transcript і відтворенням `talk.speak`. Локальний system TTS використовується лише тоді, коли `talk.speak` недоступний. Voice зупиняється, коли app покидає передній план.
- Перемикачі wake/talk-mode для voice наразі прибрано з UX/runtime Android.
- Додаткові сімейства команд Android (доступність залежить від пристрою + дозволів):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (див. [Notification forwarding](#notification-forwarding) нижче)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Entrypoint-и assistant

Android підтримує запуск OpenClaw через системний тригер assistant (Google
Assistant). Якщо все налаштовано, утримання кнопки home або фраза "Hey Google, ask
OpenClaw..." відкриває app і передає prompt у composer чату.

Це використовує метадані Android **App Actions**, оголошені в маніфесті app. Додаткове
налаштування на боці gateway не потрібне — intent assistant повністю
обробляється Android app і пересилається як звичайне повідомлення чату.

<Note>
Доступність App Actions залежить від пристрою, версії Google Play Services
і того, чи вибрав користувач OpenClaw як типову assistant app.
</Note>

## Пересилання сповіщень

Android може пересилати сповіщення пристрою в gateway як події. Кілька елементів керування дозволяють обмежити, які саме сповіщення пересилаються і коли.

| Ключ                             | Тип            | Опис                                                                                                  |
| -------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Пересилати сповіщення лише від цих package name. Якщо задано, усі інші packages ігноруються.         |
| `notifications.denyPackages`     | string[]       | Ніколи не пересилати сповіщення від цих package name. Застосовується після `allowPackages`.          |
| `notifications.quietHours.start` | string (HH:mm) | Початок вікна quiet hours (локальний час пристрою). У цей період сповіщення придушуються.            |
| `notifications.quietHours.end`   | string (HH:mm) | Кінець вікна quiet hours.                                                                             |
| `notifications.rateLimit`        | number         | Максимум пересланих сповіщень від одного package за хвилину. Надлишкові сповіщення відкидаються.     |

Picker сповіщень також використовує безпечнішу поведінку для подій пересланих сповіщень, запобігаючи випадковому пересиланню чутливих системних сповіщень.

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
Пересилання сповіщень вимагає дозволу Android Notification Listener. App запитує його під час налаштування.
</Note>
