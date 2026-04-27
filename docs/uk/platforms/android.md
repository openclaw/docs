---
read_when:
    - Сполучення або повторне підключення Android Node
    - Налагодження виявлення Android Gateway або авторизації
    - Перевірка паритету історії чату між клієнтами
summary: 'Android app (Node): runbook підключення + поверхня команд Connect/Chat/Voice/Canvas'
title: Android app
x-i18n:
    generated_at: "2026-04-27T07:09:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb25041d877df32f1a92e6ac9efa95e8f7e2a63368a88e1b9b6dce57353fc0ca
    source_path: platforms/android.md
    workflow: 15
---

<Note>
Android app ще не була публічно випущена. Вихідний код доступний у [репозиторії OpenClaw](https://github.com/openclaw/openclaw) у `apps/android`. Ви можете зібрати її самостійно, використовуючи Java 17 і Android SDK (`./gradlew :app:assemblePlayDebug`). Див. [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) для інструкцій зі збирання.
</Note>

## Короткий стан підтримки

- Роль: допоміжний Node-додаток (Android не розміщує Gateway).
- Gateway обов’язковий: так (запускається на macOS, Linux або Windows через WSL2).
- Встановлення: [Початок роботи](/uk/start/getting-started) + [Сполучення](/uk/channels/pairing).
- Gateway: [Runbook](/uk/gateway) + [Конфігурація](/uk/gateway/configuration).
  - Протоколи: [Протокол Gateway](/uk/gateway/protocol) (Nodes + control plane).

## Керування системою

Керування системою (launchd/systemd) знаходиться на хості Gateway. Див. [Gateway](/uk/gateway).

## Runbook підключення

Android Node-додаток ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android підключається безпосередньо до WebSocket Gateway і використовує сполучення пристрою (`role: node`).

Для Tailscale або публічних хостів Android потребує захищеної кінцевої точки:

- Бажано: Tailscale Serve / Funnel з `https://<magicdns>` / `wss://<magicdns>`
- Також підтримується: будь-який інший URL Gateway `wss://` зі справжньою TLS-кінцевою точкою
- Незашифрований `ws://` усе ще підтримується для приватних LAN-адрес / хостів `.local`, а також `localhost`, `127.0.0.1` і моста Android emulator (`10.0.2.2`)

### Передумови

- Ви можете запустити Gateway на «головній» машині.
- Android-пристрій/емулятор може дістатися до WebSocket Gateway:
  - у тій самій LAN з mDNS/NSD, **або**
  - у тій самій tailnet Tailscale з Wide-Area Bonjour / unicast DNS-SD (див. нижче), **або**
  - через ручне вказання хоста/порту Gateway (резервний варіант)
- Сполучення Android через tailnet/публічну мережу **не** використовує необроблені кінцеві точки `ws://` на IP tailnet. Замість цього використовуйте Tailscale Serve або інший URL `wss://`.
- Ви можете запускати CLI (`openclaw`) на машині Gateway (або через SSH).

### 1) Запустіть Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Підтвердьте в логах, що бачите щось на кшталт:

- `listening on ws://0.0.0.0:18789`

Для віддаленого доступу Android через Tailscale віддавайте перевагу Serve/Funnel замість прямого прив’язування tailnet:

```bash
openclaw gateway --tailscale serve
```

Це надає Android захищену кінцеву точку `wss://` / `https://`. Простого налаштування `gateway.bind: "tailnet"` недостатньо для першого віддаленого сполучення Android, якщо ви також окремо не завершуєте TLS.

### 2) Перевірте виявлення (необов’язково)

На машині Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Більше приміток із налагодження: [Bonjour](/uk/gateway/bonjour).

Якщо ви також налаштували домен wide-area discovery, порівняйте з:

```bash
openclaw gateway discover --json
```

Це показує `local.` разом із налаштованим wide-area доменом за один прохід і використовує
розв’язану кінцеву точку сервісу замість підказок лише з TXT.

#### Виявлення через tailnet (Vienna ⇄ London) за допомогою unicast DNS-SD

Виявлення Android через NSD/mDNS не працює між різними мережами. Якщо ваш Android Node і Gateway знаходяться в різних мережах, але з’єднані через Tailscale, використовуйте Wide-Area Bonjour / unicast DNS-SD.

Самого лише виявлення недостатньо для сполучення Android через tailnet/публічну мережу. Виявлений маршрут усе одно потребує захищеної кінцевої точки (`wss://` або Tailscale Serve):

1. Налаштуйте зону DNS-SD (наприклад, `openclaw.internal.`) на хості Gateway і опублікуйте записи `_openclaw-gw._tcp`.
2. Налаштуйте split DNS у Tailscale для вибраного домену, вказавши цей DNS-сервер.

Деталі та приклад конфігурації CoreDNS: [Bonjour](/uk/gateway/bonjour).

### 3) Підключіться з Android

У додатку Android:

- Додаток підтримує підключення до Gateway через **foreground service** (постійне сповіщення).
- Відкрийте вкладку **Connect**.
- Використовуйте режим **Setup Code** або **Manual**.
- Якщо виявлення заблоковано, використовуйте ручне вказання хоста/порту в **Advanced controls**. Для приватних LAN-хостів `ws://` усе ще працює. Для Tailscale/публічних хостів увімкніть TLS і використовуйте кінцеву точку `wss://` / Tailscale Serve.

Після першого успішного сполучення Android автоматично перепідключається під час запуску:

- до ручної кінцевої точки (якщо ввімкнено), або
- до останнього виявленого Gateway (best-effort).

### 4) Схваліть сполучення (CLI)

На машині Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Деталі сполучення: [Сполучення](/uk/channels/pairing).

Необов’язково: якщо Android Node завжди підключається з жорстко контрольованої підмережі,
ви можете опціонально ввімкнути автоматичне схвалення першого сполучення Node з явними CIDR або точними IP:

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

Типово це вимкнено. Це застосовується лише до нового сполучення `role: node` без
запитаних scope. Сполучення operator/browser, а також будь-яка зміна ролі, scope, метаданих або
публічного ключа, як і раніше, потребують ручного схвалення.

### 5) Перевірте, що Node підключений

- Через статус Nodes:

  ```bash
  openclaw nodes status
  ```

- Через Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + history

Вкладка Chat в Android підтримує вибір сесії (типово `main`, а також інші наявні сесії):

- Історія: `chat.history` (нормалізована для відображення; вбудовані теги директив
  прибираються з видимого тексту, XML-корисні навантаження викликів інструментів у простому тексті (включно з
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і
  обрізаними блоками викликів інструментів) та витеклі ASCII/full-width токени керування моделлю
  прибираються, суто рядки помічника з silent-token, такі як точні `NO_REPLY` /
  `no_reply`, пропускаються, а надто великі рядки можуть бути замінені placeholder-ами)
- Надсилання: `chat.send`
- Push-оновлення (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + camera

#### Хост Canvas Gateway (рекомендовано для вебконтенту)

Якщо ви хочете, щоб Node показував справжні HTML/CSS/JS, які агент може редагувати на диску, спрямуйте Node на хост canvas Gateway.

<Note>
Nodes завантажують canvas з HTTP-сервера Gateway (той самий порт, що й `gateway.port`, типово `18789`).
</Note>

1. Створіть `~/.openclaw/workspace/canvas/index.html` на хості Gateway.

2. Перейдіть до нього на Node (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (необов’язково): якщо обидва пристрої в Tailscale, використовуйте ім’я MagicDNS або IP tailnet замість `.local`, наприклад `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Цей сервер додає клієнт live-reload у HTML і перезавантажує сторінку при змінах файлів.
Хост A2UI знаходиться за адресою `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Команди Canvas (лише у foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (використовуйте `{"url":""}` або `{"url":"/"}` для повернення до типового scaffold). `canvas.snapshot` повертає `{ format, base64 }` (типово `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` — застарілий alias)

Команди камери (лише у foreground; потребують дозволів):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Див. [Camera Node](/uk/nodes/camera) для параметрів і CLI-хелперів.

### 8) Voice + розширена поверхня команд Android

- Вкладка Voice: Android має два явні режими захоплення. **Mic** — це ручна сесія на вкладці Voice, яка надсилає кожну паузу як хід чату і зупиняється, коли додаток виходить із foreground або користувач залишає вкладку Voice. **Talk** — це безперервний Talk Mode, який продовжує слухати, доки його не вимкнуть або Node не від’єднається.
- Talk Mode підвищує наявний foreground service з `dataSync` до `dataSync|microphone` перед початком захоплення, а після зупинки Talk Mode понижує його. Android 14+ вимагає декларацію `FOREGROUND_SERVICE_MICROPHONE`, надання `RECORD_AUDIO` під час виконання і тип foreground service для мікрофона під час виконання.
- Озвучені відповіді використовують `talk.speak` через налаштований Talk-провайдер Gateway. Локальний системний TTS використовується лише тоді, коли `talk.speak` недоступний.
- Активація голосом залишається вимкненою в UX/runtime Android.
- Додаткові сімейства команд Android (доступність залежить від пристрою + дозволів):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (див. [Переадресація сповіщень](#notification-forwarding) нижче)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Точки входу помічника

Android підтримує запуск OpenClaw із системного тригера помічника (Google
Assistant). Якщо це налаштовано, утримання кнопки home або фраза "Hey Google, ask
OpenClaw..." відкриває додаток і передає запит у поле введення чату.

Для цього використовуються метадані Android **App Actions**, оголошені в маніфесті додатка. Жодної
додаткової конфігурації з боку Gateway не потрібно — intent помічника повністю
обробляється Android-додатком і пересилається як звичайне повідомлення чату.

<Note>
Доступність App Actions залежить від пристрою, версії Google Play Services
і від того, чи встановив користувач OpenClaw як типовий додаток помічника.
</Note>

## Переадресація сповіщень

Android може переадресовувати сповіщення пристрою до Gateway як події. Кілька параметрів дають змогу обмежити, які сповіщення переадресовуються і коли саме.

| Key                              | Type           | Description                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Переадресовувати лише сповіщення з цих назв пакетів. Якщо встановлено, усі інші пакети ігноруються. |
| `notifications.denyPackages`     | string[]       | Ніколи не переадресовувати сповіщення з цих назв пакетів. Застосовується після `allowPackages`. |
| `notifications.quietHours.start` | string (HH:mm) | Початок вікна тихих годин (локальний час пристрою). Сповіщення приглушуються впродовж цього вікна. |
| `notifications.quietHours.end`   | string (HH:mm) | Кінець вікна тихих годин.                                                                        |
| `notifications.rateLimit`        | number         | Максимальна кількість переадресованих сповіщень на пакет за хвилину. Надлишкові сповіщення відкидаються. |

Вибір сповіщень також використовує безпечнішу поведінку для подій переадресованих сповіщень, запобігаючи випадковому переадресуванню чутливих системних сповіщень.

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
Переадресація сповіщень вимагає дозволу Android Notification Listener. Під час налаштування додаток запропонує його надати.
</Note>

## Пов’язане

- [iOS app](/uk/platforms/ios)
- [Nodes](/uk/nodes)
- [Усунення проблем Android Node](/uk/nodes/troubleshooting)
