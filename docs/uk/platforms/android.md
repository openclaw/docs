---
read_when:
    - Підключення в пару або повторне підключення Node Android
    - Налагодження виявлення або auth Gateway Android
    - Перевірка паритету історії чату між клієнтами
summary: 'Android app (node): runbook підключення + поверхня команд Connect/Chat/Voice/Canvas'
title: Застосунок Android
x-i18n:
    generated_at: "2026-04-27T06:27:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8ab1d9defd4606fe1408164f7f393367d01f3431a85e485dbe03b23e8ab69b14
    source_path: platforms/android.md
    workflow: 15
---

<Note>
Застосунок Android ще не було публічно випущено. Вихідний код доступний у [репозиторії OpenClaw](https://github.com/openclaw/openclaw) у `apps/android`. Ви можете зібрати його самостійно, використовуючи Java 17 та Android SDK (`./gradlew :app:assemblePlayDebug`). Інструкції зі збирання див. у [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md).
</Note>

## Стислий огляд підтримки

- Роль: застосунок супровідного Node (Android не хостить Gateway).
- Gateway потрібен: так (запускайте його на macOS, Linux або Windows через WSL2).
- Встановлення: [Початок роботи](/uk/start/getting-started) + [Pairing](/uk/channels/pairing).
- Gateway: [Runbook](/uk/gateway) + [Configuration](/uk/gateway/configuration).
  - Протоколи: [Протокол Gateway](/uk/gateway/protocol) (Node + control plane).

## Керування системою

Керування системою (launchd/systemd) знаходиться на хості Gateway. Див. [Gateway](/uk/gateway).

## Runbook підключення

Node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android підключається безпосередньо до WebSocket Gateway і використовує pairing пристрою (`role: node`).

Для Tailscale або публічних хостів Android потребує захищеного endpoint:

- Рекомендовано: Tailscale Serve / Funnel з `https://<magicdns>` / `wss://<magicdns>`
- Також підтримується: будь-який інший URL Gateway `wss://` з реальним TLS endpoint
- Незашифрований `ws://` усе ще підтримується для приватних LAN-адрес / хостів `.local`, а також `localhost`, `127.0.0.1` і bridge емулятора Android (`10.0.2.2`)

### Передумови

- Ви можете запустити Gateway на “головному” комп’ютері.
- Пристрій/емулятор Android може дістатися до WebSocket Gateway:
  - у тій самій LAN з mDNS/NSD, **або**
  - у тій самій tailnet Tailscale з Wide-Area Bonjour / unicast DNS-SD (див. нижче), **або**
  - через ручне задання хоста/порту Gateway (резервний варіант)
- Pairing Android через tailnet/публічний доступ **не** використовує сирі endpoint `ws://` на IP tailnet. Натомість використовуйте Tailscale Serve або інший URL `wss://`.
- Ви можете запускати CLI (`openclaw`) на комп’ютері Gateway (або через SSH).

### 1) Запустіть Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Підтвердьте в логах, що бачите щось на кшталт:

- `listening on ws://0.0.0.0:18789`

Для віддаленого доступу Android через Tailscale надавайте перевагу Serve/Funnel замість сирого bind до tailnet:

```bash
openclaw gateway --tailscale serve
```

Це надає Android захищений endpoint `wss://` / `https://`. Простого налаштування `gateway.bind: "tailnet"` недостатньо для першого віддаленого pairing Android, якщо ви також окремо не завершуєте TLS.

### 2) Перевірте виявлення (необов’язково)

На комп’ютері Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Додаткові примітки з налагодження: [Bonjour](/uk/gateway/bonjour).

Якщо ви також налаштували wide-area discovery domain, порівняйте з:

```bash
openclaw gateway discover --json
```

Це показує `local.` разом із налаштованим wide-area domain за один прохід і використовує розв’язаний
service endpoint замість підказок лише з TXT.

#### Виявлення tailnet (Відень ⇄ Лондон) через unicast DNS-SD

Виявлення Android NSD/mDNS не працює через різні мережі. Якщо ваш Node Android і Gateway перебувають у різних мережах, але підключені через Tailscale, натомість використовуйте Wide-Area Bonjour / unicast DNS-SD.

Самого виявлення недостатньо для pairing Android через tailnet/публічний доступ. Виявлений маршрут усе одно потребує захищеного endpoint (`wss://` або Tailscale Serve):

1. Налаштуйте зону DNS-SD (наприклад, `openclaw.internal.`) на хості Gateway і опублікуйте записи `_openclaw-gw._tcp`.
2. Налаштуйте split DNS Tailscale для вибраного вами domain, указавши цей DNS-сервер.

Подробиці та приклад конфігурації CoreDNS: [Bonjour](/uk/gateway/bonjour).

### 3) Підключіться з Android

У застосунку Android:

- Застосунок підтримує підключення до Gateway через **foreground service** (постійне сповіщення).
- Відкрийте вкладку **Connect**.
- Використайте режим **Setup Code** або **Manual**.
- Якщо виявлення заблоковано, використайте ручне задання хоста/порту в **Advanced controls**. Для приватних LAN-хостів `ws://` усе ще працює. Для Tailscale/публічних хостів увімкніть TLS і використовуйте endpoint `wss://` / Tailscale Serve.

Після першого успішного pairing Android автоматично перепідключається під час запуску:

- до ручного endpoint (якщо ввімкнено), інакше
- до останнього виявленого Gateway (best-effort).

### 4) Схваліть pairing (CLI)

На комп’ютері Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Подробиці pairing: [Pairing](/uk/channels/pairing).

Необов’язково: якщо Node Android завжди підключається з жорстко контрольованої підмережі,
ви можете ввімкнути автоматичне схвалення першого pairing для Node через явні CIDR або точні IP:

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

За замовчуванням це вимкнено. Це застосовується лише до нового pairing `role: node` без
запитаних scope. Pairing оператора/браузера, а також будь-яка зміна ролі, scope, metadata або
public key, як і раніше, потребують ручного схвалення.

### 5) Перевірте, що Node підключено

- Через статус Node:

  ```bash
  openclaw nodes status
  ```

- Через Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Чат + історія

Вкладка Chat на Android підтримує вибір сесії (типово `main`, а також інші наявні сесії):

- Історія: `chat.history` (нормалізована для відображення; вбудовані теги директив
  прибираються з видимого тексту, payload XML викликів інструментів у звичайному тексті (включно з
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` та
  обрізаними блоками викликів інструментів) і витоки ASCII/повноширинних контрольних токенів моделі
  прибираються, чисті рядки асистента з тихими токенами, як-от точні `NO_REPLY` /
  `no_reply`, пропускаються, а надто великі рядки можуть замінюватися placeholder)
- Надсилання: `chat.send`
- Push-оновлення (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + камера

#### Gateway Canvas Host (рекомендовано для вебвмісту)

Якщо ви хочете, щоб Node показував реальні HTML/CSS/JS, які агент може редагувати на диску, спрямуйте Node на canvas host Gateway.

<Note>
Node завантажують canvas з HTTP-сервера Gateway (той самий порт, що й `gateway.port`, типово `18789`).
</Note>

1. Створіть `~/.openclaw/workspace/canvas/index.html` на хості Gateway.

2. Перейдіть до нього на Node (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (необов’язково): якщо обидва пристрої знаходяться в Tailscale, використовуйте ім’я MagicDNS або IP tailnet замість `.local`, наприклад `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Цей сервер інжектує клієнт live-reload в HTML і перезавантажує сторінку при зміні файлів.
Хост A2UI розміщено за адресою `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Команди Canvas (лише у foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (використовуйте `{"url":""}` або `{"url":"/"}`, щоб повернутися до типового scaffold). `canvas.snapshot` повертає `{ format, base64 }` (типово `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (застарілий псевдонім `canvas.a2ui.pushJSONL`)

Команди камери (лише у foreground; з контролем дозволів):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Параметри й допоміжні CLI-команди див. у [Camera node](/uk/nodes/camera).

### 8) Voice + розширена поверхня команд Android

- Вкладка Voice: Android має два явні режими захоплення. **Mic** — це ручна сесія на вкладці Voice, яка надсилає кожну паузу як хід чату і зупиняється, коли застосунок залишає foreground або користувач залишає вкладку Voice. **Talk** — це безперервний Talk Mode, який продовжує слухати, доки його не вимкнуть або доки Node не від’єднається.
- Talk Mode підвищує наявний foreground service з `dataSync` до `dataSync|microphone` перед початком захоплення, а потім знижує його, коли Talk Mode зупиняється. Android 14+ потребує оголошення `FOREGROUND_SERVICE_MICROPHONE`, runtime-дозволу `RECORD_AUDIO` і типу сервісу microphone під час виконання.
- Озвучені відповіді використовують `talk.speak` через налаштований провайдер Talk на Gateway. Локальний системний TTS використовується лише тоді, коли `talk.speak` недоступний.
- Активація голосом залишається вимкненою в UX/runtime Android.
- Додаткові сімейства команд Android (доступність залежить від пристрою + дозволів):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (див. [Пересилання сповіщень](#notification-forwarding) нижче)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Точки входу асистента

Android підтримує запуск OpenClaw із системного тригера асистента (Google
Assistant). Якщо це налаштовано, утримання кнопки Home або фраза "Hey Google, ask
OpenClaw..." відкриває застосунок і передає prompt у composer чату.

Для цього використовується metadata Android **App Actions**, оголошена в маніфесті застосунку. Додаткове
налаштування на боці Gateway не потрібне — intent асистента повністю
обробляється застосунком Android і пересилається як звичайне повідомлення чату.

<Note>
Доступність App Actions залежить від пристрою, версії Google Play Services
і від того, чи встановив користувач OpenClaw як типовий застосунок асистента.
</Note>

## Пересилання сповіщень

Android може пересилати сповіщення пристрою до Gateway як події. Кілька елементів керування дають змогу обмежити, які сповіщення пересилаються і коли.

| Key                              | Type           | Description                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Пересилати лише сповіщення з цих імен пакетів. Якщо задано, усі інші пакети ігноруються.      |
| `notifications.denyPackages`     | string[]       | Ніколи не пересилати сповіщення з цих імен пакетів. Застосовується після `allowPackages`.              |
| `notifications.quietHours.start` | string (HH:mm) | Початок вікна тихих годин (локальний час пристрою). У цьому вікні сповіщення пригнічуються. |
| `notifications.quietHours.end`   | string (HH:mm) | Кінець вікна тихих годин.                                                                        |
| `notifications.rateLimit`        | number         | Максимальна кількість пересланих сповіщень на пакет за хвилину. Надлишкові сповіщення відкидаються.         |

Засіб вибору сповіщень також використовує безпечнішу поведінку для подій пересилання сповіщень, запобігаючи випадковому пересиланню чутливих системних сповіщень.

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
Для пересилання сповіщень потрібен дозвіл Android Notification Listener. Під час налаштування застосунок запропонує його надати.
</Note>

## Пов’язане

- [Застосунок iOS](/uk/platforms/ios)
- [Node](/uk/nodes)
- [Усунення несправностей Node Android](/uk/nodes/troubleshooting)
