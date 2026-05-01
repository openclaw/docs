---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий дзвінок Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio зі стандартними налаштуваннями голосу в реальному часі'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-01T06:43:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a52bdd2fe7d080797241471e632d38a4f6aac9f0ca6d855547e364540ff2fd3
    source_path: plugins/google-meet.md
    workflow: 16
---

Підтримка учасника Google Meet для OpenClaw — Plugin навмисно працює явно:

- Він приєднується лише до явної URL-адреси `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися до
  поверненої URL-адреси.
- Голосовий режим `realtime` є режимом за замовчуванням.
- Голосовий режим realtime може звертатися назад до повного агента OpenClaw, коли потрібні глибші
  міркування або інструменти.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `realtime` для живого
  прослуховування/відповіді голосом або `transcribe`, щоб приєднатися/керувати браузером без
  голосового моста realtime.
- Автентифікація починається як персональний Google OAuth або вже авторизований профіль Chrome.
- Автоматичного оголошення згоди немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на спареному Node host.
- Twilio приймає номер для дозвону плюс необов’язковий PIN або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших робочих процесів
  телеконференцій агента.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте бекенд-провайдера голосу realtime.
OpenAI є типовим; Google Gemini Live також працює з
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` установлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор
Homebrew вимагає перезавантаження, перш ніж macOS покаже пристрій:

```bash
sudo reboot
```

Після перезавантаження перевірте обидві складові:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Увімкніть Plugin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Перевірте налаштування:

```bash
openclaw googlemeet setup
```

Вивід setup призначений бути читабельним для агента й ураховувати режим. Він повідомляє про профіль Chrome,
закріплення Node і, для приєднань Chrome у realtime, перевірки аудіомоста
BlackHole/SoX та відкладеного вступу realtime. Для приєднань лише для спостереження перевірте той самий
транспорт із `--mode transcribe`; цей режим пропускає передумови аудіо realtime,
оскільки він не слухає й не говорить через міст:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Коли налаштовано делегування Twilio, setup також повідомляє, чи готові
Plugin `voice-call`, облікові дані Twilio та публічна експозиція Webhook.
Вважайте будь-яку перевірку `ok: false` блокером для перевіреного транспорту й режиму,
перш ніж просити агента приєднатися. Використовуйте `openclaw googlemeet setup --json` для
скриптів або машиночитного виводу. Використовуйте `--transport chrome`,
`--transport chrome-node` або `--transport twilio`, щоб попередньо перевірити конкретний
транспорт до того, як агент спробує його використати.

Для Twilio завжди явно попередньо перевіряйте транспорт, коли типовий транспорт —
Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Це виявляє відсутнє підключення `voice-call`, облікові дані Twilio або недоступну
експозицію Webhook до того, як агент спробує дозвонитися на зустріч.

Приєднайтеся до зустрічі:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Або дозвольте агенту приєднатися через інструмент `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Створіть нову зустріч і приєднайтеся до неї:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Створіть лише URL-адресу без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це
  найдетермінованіший шлях, який не залежить від стану інтерфейсу браузера.
- Резервний варіант через браузер: використовується, коли облікові дані OAuth відсутні. OpenClaw використовує
  закріплений Chrome Node, відкриває `https://meet.google.com/new`, чекає, доки Google
  перенаправить на справжню URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Цей шлях вимагає,
  щоб профіль OpenClaw Chrome на Node вже був авторизований у Google.
  Автоматизація браузера обробляє власний запит Meet першого запуску щодо мікрофона; цей запит
  не вважається помилкою входу в Google.
  Потоки приєднання й створення також намагаються повторно використати наявну вкладку Meet перед відкриттям
  нової. Зіставлення ігнорує нешкідливі рядки запиту URL, як-от `authuser`, тож
  повторна спроба агента має сфокусувати вже відкриту зустріч замість створення другої
  вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` за замовчуванням приєднується до нової зустрічі й
повертає `joined: true` плюс сеанс приєднання. Щоб лише згенерувати URL-адресу, використайте
`create --no-join` у CLI або передайте `"join": false` інструменту.

Або скажіть агенту: "Створи Google Meet, приєднайся до нього з голосом realtime і надішли
мені посилання." Агент має викликати `google_meet` з `action: "create"`, а
потім поділитися поверненим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Для приєднання лише для спостереження/керування браузером установіть `"mode": "transcribe"`. Це
не запускає дуплексний міст моделі realtime, не потребує BlackHole або SoX
і не говоритиме у відповідь у зустрічі. Приєднання Chrome у цьому режимі також уникають
надання OpenClaw дозволу на мікрофон/камеру й уникають шляху Meet **Use
microphone**. Якщо Meet показує проміжний екран вибору аудіо, автоматизація намагається
вибрати шлях без мікрофона, а інакше повідомляє про ручну дію замість відкриття
локального мікрофона.

Під час сеансів realtime статус `google_meet` містить стан браузера й аудіомоста,
наприклад `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, останні мітки часу
вводу/виводу, лічильники байтів і стан закриття моста. Якщо з’являється безпечний запит сторінки Meet,
автоматизація браузера обробляє його, коли може. Вхід, допуск хостом і
запити дозволів браузера/ОС повідомляються як ручна дія з причиною та
повідомленням, яке агент має передати. Керовані сеанси Chrome відтворюють вступ або
тестову фразу лише після того, як стан браузера повідомляє `inCall: true`; інакше статус повідомляє
`speechReady: false`, а спроба мовлення блокується замість удавання, що
агент заговорив у зустрічі.

Локальні приєднання Chrome використовують авторизований профіль браузера OpenClaw. Режим realtime
потребує `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для
чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного
пристрою BlackHole достатньо для першого smoke-тесту, але він може давати відлуння.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM,
щоб лише зробити VM власником Chrome. Запустіть Gateway і агента локально, а потім запустіть
Node host у VM. Один раз увімкніть bundled Plugin у VM, щоб Node
оголошував команду Chrome:

Що де працює:

- Gateway host: OpenClaw Gateway, робочий простір агента, ключі моделі/API, провайдер realtime
  і конфігурація Google Meet Plugin.
- Parallels macOS VM: OpenClaw CLI/Node host, Google Chrome, SoX, BlackHole 2ch
  і профіль Chrome, авторизований у Google.
- Не потрібно у VM: сервіс Gateway, конфігурація агента, ключ OpenAI/GPT або налаштування
  провайдера моделі.

Установіть залежності VM:

```bash
brew install blackhole-2ch sox
```

Перезавантажте VM після встановлення BlackHole, щоб macOS показала `BlackHole 2ch`:

```bash
sudo reboot
```

Після перезавантаження перевірте, що VM бачить аудіопристрій і команди SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Установіть або оновіть OpenClaw у VM, а потім увімкніть там bundled Plugin:

```bash
openclaw plugins enable google-meet
```

Запустіть Node host у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` є LAN IP і ви не використовуєте TLS, Node відмовиться від
plaintext WebSocket, якщо ви явно не дозволите це для цієї довіреної приватної мережі:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Використовуйте ту саму змінну середовища під час установлення Node як LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` є середовищем процесу, а не налаштуванням
`openclaw.json`. `openclaw node install` зберігає його в середовищі LaunchAgent,
коли воно присутнє в команді встановлення.

Схваліть Node з Gateway host:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить Node і що він оголошує як `googlemeet.chrome`,
так і можливість браузера/`browser.proxy`:

```bash
openclaw nodes status
```

Маршрутизуйте Meet через цей Node на Gateway host:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Тепер приєднуйтеся звичайно з Gateway host:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

або попросіть агента використати інструмент `google_meet` з `transport: "chrome-node"`.

Для однокомандного smoke-тесту, який створює або повторно використовує сеанс, промовляє відому
фразу й виводить стан сеансу:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання realtime автоматизація браузера OpenClaw заповнює ім’я гостя, натискає
Join/Ask to join і приймає вибір Meet першого запуску "Use microphone", коли цей
запит з’являється. Під час приєднання лише для спостереження або створення зустрічі лише через браузер вона
проходить той самий запит без мікрофона, коли такий вибір доступний.
Якщо профіль браузера не авторизований, Meet очікує допуску хостом,
Chrome потребує дозволу на мікрофон/камеру для приєднання realtime, або Meet завис
на запиті, який автоматизація не змогла розв’язати, результат join/test-speech повідомляє
`manualActionRequired: true` з `manualActionReason` і
`manualActionMessage`. Агенти мають припинити повторні спроби приєднання, повідомити саме це
повідомлення плюс поточні `browserUrl`/`browserTitle` і повторити спробу лише після завершення
ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає лише тоді, коли рівно один
підключений Node оголошує і `googlemeet.chrome`, і керування браузером. Якщо
підключено кілька сумісних Node, установіть `chromeNode.node` на id Node,
відображуване ім’я або віддалений IP.

Поширені перевірки збоїв:

- `Configured Google Meet node ... is not usable: offline`: закріплений вузол
  відомий Gateway, але недоступний. Агенти мають розглядати цей вузол як
  діагностичний стан, а не як придатний до використання хост Chrome, і повідомляти
  про блокер налаштування замість переходу на інший транспорт, якщо користувач
  не просив про це.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  схваліть сполучення та переконайтеся, що `openclaw plugins enable google-meet` і
  `openclaw plugins enable browser` були виконані у VM. Також підтвердьте, що
  хост Gateway дозволяє обидві команди вузла через
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: установіть `blackhole-2ch` на хості,
  який перевіряється, і перезавантажте його перед використанням локального аудіо Chrome.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch`
  у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або
  залиште `chrome.guestName` установленим для гостьового приєднання. Автоматичне гостьове
  приєднання використовує браузерну автоматизацію OpenClaw через проксі браузера вузла;
  переконайтеся, що конфігурація браузера вузла вказує на потрібний вам профіль, наприклад
  `browser.defaultProfile: "user"` або названий профіль наявного сеансу.
- Дубльовані вкладки Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw
  активує наявну вкладку для тієї самої URL-адреси Meet перед відкриттям нової, а
  браузерне створення зустрічі повторно використовує поточну вкладку
  `https://meet.google.com/new` або вкладку запиту облікового запису Google перед відкриттям іншої.
- Немає аудіо: у Meet спрямуйте аудіо мікрофона/динаміка через шлях віртуального аудіопристрою,
  який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію
  в стилі Loopback для чистого двостороннього аудіо.

## Нотатки щодо встановлення

Стандартний realtime-режим Chrome використовує два зовнішні інструменти:

- `sox`: аудіоутиліта командного рядка. Plugin використовує явні команди пристроїв
  CoreAudio для стандартного аудіомоста PCM16 24 кГц.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій
  `BlackHole 2ch`, через який Chrome/Meet можуть маршрутизувати аудіо.

OpenClaw не постачає й не розповсюджує жоден із цих пакетів. Документація просить користувачів
установити їх як залежності хоста через Homebrew. SoX ліцензовано як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole має ліцензію GPL-3.0. Якщо ви створюєте
інсталятор або appliance, який постачає BlackHole разом з OpenClaw, перегляньте
умови ліцензування upstream BlackHole або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet через керування браузером OpenClaw і приєднується
як профіль браузера OpenClaw із виконаним входом. У macOS Plugin перевіряє наявність
`BlackHole 2ch` перед запуском. Якщо налаштовано, він також виконує команду перевірки
стану аудіомоста та команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли
Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо
працюють на сполученому вузлі, наприклад VM Parallels macOS. Для локального Chrome виберіть
профіль через `browser.defaultProfile`; `chrome.browserProfile` передається хостам
`chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона й динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування
замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план набору, делегований Voice Call Plugin. Він
не аналізує сторінки Meet для пошуку телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або потрібен резервний варіант
телефонного набору. Google Meet має надавати телефонний номер для набору та PIN для
зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

Увімкніть Voice Call Plugin на хості Gateway, а не на вузлі Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // or set "twilio" if Twilio should be the default
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

Надайте облікові дані Twilio через середовище або конфігурацію. Середовище не дає
секретам потрапити в `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни конфігурації Plugin
не з'являються в уже запущеному процесі Gateway, доки він не перезавантажиться.

Потім перевірте:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Коли делегування Twilio підключено, `googlemeet setup` містить успішні перевірки
`twilio-voice-call-plugin`, `twilio-voice-call-credentials` і
`twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Використовуйте `--dtmf-sequence`, коли зустріч потребує власної послідовності:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth і попередня перевірка

OAuth необов'язковий для створення посилання Meet, оскільки `googlemeet create` може
повернутися до браузерної автоматизації. Налаштуйте OAuth, коли вам потрібне офіційне
створення через API, визначення просторів або попередні перевірки Meet Media API.

Доступ до Google Meet API використовує користувацький OAuth: створіть OAuth-клієнт Google Cloud,
запитайте потрібні scopes, авторизуйте обліковий запис Google, а потім збережіть
отриманий refresh token у конфігурації Google Meet Plugin або надайте змінні середовища
`OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання Chrome. Транспорти Chrome і Chrome-node
досі приєднуються через профіль Chrome із виконаним входом, BlackHole/SoX і підключений
вузол, коли ви використовуєте участь через браузер. OAuth призначений лише для офіційного
шляху Google Meet API: створення просторів зустрічей, визначення просторів і виконання
попередніх перевірок Meet Media API.

### Створення облікових даних Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** — найпростіший варіант для організації Google Workspace.
   - **External** працює для особистих/тестових налаштувань; поки застосунок у режимі Testing,
     додайте кожен обліковий запис Google, який авторизуватиме застосунок, як тестового користувача.
4. Додайте scopes, які запитує OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Створіть OAuth client ID.
   - Тип застосунку: **Web application**.
   - Авторизований URI перенаправлення:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Скопіюйте client ID і client secret.

`meetings.space.created` потрібен Google Meet `spaces.create`.
`meetings.space.readonly` дає OpenClaw змогу визначати URL-адреси/коди Meet як простори.
`meetings.conference.media.readonly` призначений для попередньої перевірки Meet Media API і роботи
з медіа; Google може вимагати реєстрацію в Developer Preview для фактичного використання Media API.
Якщо вам потрібні лише приєднання через Chrome у браузері, повністю пропустіть OAuth.

### Створення refresh token

Налаштуйте `oauth.clientId` і за потреби `oauth.clientSecret` або передайте їх як
змінні середовища, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` з refresh token. Вона використовує PKCE,
localhost callback на `http://localhost:8085/oauth2callback` і ручний потік
копіювання/вставлення з `--manual`.

Приклади:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Використовуйте ручний режим, коли браузер не може дістатися локального callback:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

Вивід JSON містить:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

Збережіть об'єкт `oauth` у конфігурації Google Meet Plugin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

Віддавайте перевагу змінним середовища, якщо не хочете зберігати refresh token у конфігурації.
Якщо наявні і значення конфігурації, і значення середовища, Plugin спочатку бере
конфігурацію, а потім використовує середовище як резервний варіант.

Згода OAuth включає створення просторів Meet, доступ на читання просторів Meet і доступ
на читання медіа конференцій Meet. Якщо ви автентифікувалися до появи підтримки
створення зустрічей, повторно виконайте `openclaw googlemeet auth login --json`, щоб refresh
token мав scope `meetings.space.created`.

### Перевірка OAuth через doctor

Запустіть OAuth doctor, коли потрібна швидка перевірка стану без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує runtime Chrome і не потребує підключеного вузла Chrome. Воно
перевіряє, що конфігурація OAuth існує і що refresh token може створити access
token. Звіт JSON містить лише поля стану, такі як `ok`, `configured`,
`tokenSource`, `expiresAt`, і повідомлення перевірок; він не виводить access
token, refresh token або client secret.

Поширені результати:

| Перевірка            | Значення                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Наявний `oauth.clientId` плюс `oauth.refreshToken` або кешований access token.          |
| `oauth-token`        | Кешований access token досі чинний або refresh token створив новий access token.        |
| `meet-spaces-get`    | Необов'язкова перевірка `--meeting` визначила наявний простір Meet.                     |
| `meet-spaces-create` | Необов'язкова перевірка `--create-space` створила новий простір Meet.                   |

Щоб також довести ввімкнення Google Meet API і scope `spaces.create`, виконайте
перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює одноразову URL-адресу Meet. Використовуйте це, коли потрібно підтвердити,
що в проєкті Google Cloud увімкнено Meet API і що авторизований обліковий запис має
scope `meetings.space.created`.

Щоб довести доступ на читання для наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` доводять доступ на читання до наявного
простору, до якого авторизований обліковий запис Google має доступ. `403` від цих перевірок
зазвичай означає, що Google Meet REST API вимкнено, refresh token зі згодою
не має потрібного scope або обліковий запис Google не має доступу до цього простору Meet.
Помилка refresh-token означає, що потрібно повторно виконати `openclaw googlemeet auth login
--json` і зберегти новий блок `oauth`.

Облікові дані OAuth не потрібні для браузерного резервного варіанта. У цьому режимі Google
auth надходить із профілю Chrome із виконаним входом на вибраному вузлі, а не з
конфігурації OpenClaw.

Ці змінні середовища приймаються як резервні варіанти:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` або `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` або `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` або
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` або `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` або `GOOGLE_MEET_PREVIEW_ACK`

Розв’яжіть URL Meet, код або `spaces/{id}` через `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Запустіть попередню перевірку перед роботою з медіа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Перелічіть артефакти зустрічі та відвідуваність після того, як Meet створить записи конференції:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

З `--meeting`, `artifacts` і `attendance` типово використовують найновіший запис конференції. Передайте `--all-conference-records`, коли потрібні всі збережені записи для цієї зустрічі.

Пошук у Calendar може розв’язати URL зустрічі з Google Calendar перед читанням артефактів Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` шукає в сьогоднішньому календарі `primary` подію Calendar з посиланням Google Meet. Використовуйте `--event <query>` для пошуку відповідного тексту події та `--calendar <id>` для неосновного календаря. Пошук у Calendar потребує нового входу OAuth, який включає readonly scope для подій Calendar. `calendar-events` попередньо показує відповідні події Meet і позначає подію, яку виберуть `latest`, `artifacts`, `attendance` або `export`.

Якщо ви вже знаєте ідентифікатор запису конференції, звертайтеся до нього напряму:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Запишіть читабельний звіт:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` повертає метадані запису конференції, а також метадані ресурсів учасників, записів, транскрипта, структурованих записів транскрипта та smart-note, коли Google надає їх для зустрічі. Використовуйте `--no-transcript-entries`, щоб пропустити пошук записів для великих зустрічей. `attendance` розгортає учасників у рядки сеансів учасників із часом першої/останньої появи, загальною тривалістю сеансу, прапорцями запізнення/раннього виходу та ресурсами дублікатів учасників, об’єднаними за користувачем, що ввійшов, або відображуваним іменем. Передайте `--no-merge-duplicates`, щоб залишити сирі ресурси учасників окремо, `--late-after-minutes`, щоб налаштувати виявлення запізнення, і `--early-before-minutes`, щоб налаштувати виявлення раннього виходу.

`export` записує папку, що містить `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`. `manifest.json` фіксує вибрані вхідні дані, параметри експорту, записи конференції, вихідні файли, лічильники, джерело токена, подію Calendar, якщо її було використано, та будь-які попередження про часткове отримання. Передайте `--zip`, щоб також записати портативний архів поруч із папкою. Передайте `--include-doc-bodies`, щоб експортувати пов’язаний текст транскрипта та smart-note Google Docs через Google Drive `files.export`; для цього потрібен новий вхід OAuth, який включає readonly scope Drive Meet. Без `--include-doc-bodies` експорти містять лише метадані Meet і структуровані записи транскрипта. Якщо Google повертає часткову помилку артефакта, наприклад помилку списку smart-note, запису транскрипта або тіла документа Drive, зведення й маніфест зберігають попередження замість того, щоб провалити весь експорт. Використовуйте `--dry-run`, щоб отримати ті самі дані артефактів/відвідуваності та надрукувати JSON маніфесту без створення папки або ZIP. Це корисно перед записом великого експорту або коли агенту потрібні лише лічильники, вибрані записи та попередження.

Агенти також можуть створити такий самий пакет через інструмент `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Установіть `"dryRun": true`, щоб повернути лише маніфест експорту та пропустити запис файлів.

Запустіть захищений live smoke для реальної збереженої зустрічі:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Середовище live smoke:

- `OPENCLAW_LIVE_TEST=1` вмикає захищені live-тести.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` вказує на збережений URL Meet, код або `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID` надає OAuth client id.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN` надає refresh token.
- Необов’язково: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` і
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` використовують ті самі fallback-імена без префікса `OPENCLAW_`.

Базовий live smoke для артефактів/присутності потребує
`https://www.googleapis.com/auth/meetings.space.readonly` і
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Пошук у Calendar
потребує `https://www.googleapis.com/auth/calendar.events.readonly`. Експорт тіла
документа з Drive потребує
`https://www.googleapis.com/auth/drive.meet.readonly`.

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда виводить нові `meeting uri`, джерело та сеанс приєднання. З обліковими
даними OAuth вона використовує офіційний Google Meet API. Без облікових даних
OAuth вона використовує профіль браузера Chrome, у який виконано вхід, із закріпленого
вузла як резервний варіант. Агенти можуть використовувати інструмент `google_meet`
з `action: "create"`, щоб створити зустріч і приєднатися до неї за один крок. Для
створення лише URL передайте `"join": false`.

Приклад виводу JSON із резервного браузерного варіанта:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Якщо резервний браузерний варіант натрапляє на вхід у Google або блокування
дозволу Meet до того, як зможе створити URL, метод Gateway повертає відповідь із
помилкою, а інструмент `google_meet` повертає структуровані деталі замість простого
рядка:

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

Коли агент бачить `manualActionRequired: true`, він має повідомити
`manualActionMessage` разом із контекстом вузла/вкладки браузера й припинити
відкривати нові вкладки Meet, доки оператор не виконає крок у браузері.

Приклад виводу JSON зі створення через API:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Створення Meet за замовчуванням виконує приєднання. Транспорт Chrome або
Chrome-node усе одно потребує профілю Google Chrome, у який виконано вхід, щоб
приєднатися через браузер. Якщо з профілю виконано вихід, OpenClaw повідомляє
`manualActionRequired: true` або помилку резервного браузерного варіанта й просить
оператора завершити вхід у Google перед повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що
ваш Cloud-проєкт, принципал OAuth і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Спільний шлях Chrome realtime потребує лише увімкненого Plugin, BlackHole, SoX
і ключа бекенд-провайдера realtime-голосу. OpenAI є типовим; установіть
`realtime.provider: "google"`, щоб використовувати Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Установіть конфігурацію Plugin у `plugins.entries.google-meet.config`:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Типові значення:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: необов'язковий id/назва/IP вузла для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім'я, що використовується на гостьовому
  екрані Meet без входу
- `chrome.autoJoin: true`: найкраща спроба заповнення імені гостя та натискання
  Join Now через браузерну автоматизацію OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить, що вона
  в дзвінку, перш ніж буде запущено realtime-вступ
- `chrome.audioFormat: "pcm16-24khz"`: аудіоформат пари команд. Використовуйте
  `"g711-ulaw-8khz"` лише для застарілих/користувацьких пар команд, які досі
  видають телефонне аудіо.
- `chrome.audioInputCommand`: команда SoX, що читає з CoreAudio `BlackHole 2ch`
  і записує аудіо у `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX, що читає аудіо у `chrome.audioFormat`
  і записує в CoreAudio `BlackHole 2ch`
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли realtime-міст
  підключається; установіть її на `""`, щоб приєднатися беззвучно
- `realtime.agentId`: необов'язковий id агента OpenClaw для
  `openclaw_agent_consult`; типово `main`

Необов'язкові перевизначення:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  browser: {
    defaultProfile: "openclaw",
  },
  chrome: {
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

Конфігурація лише для Twilio:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled` за замовчуванням має значення `true`; з транспортом Twilio він делегує
фактичний PSTN-виклик, DTMF і вступне привітання Plugin Voice Call. Voice Call
відтворює послідовність DTMF перед відкриттям realtime медіапотоку, а потім використовує
збережений вступний текст як початкове realtime привітання. Якщо `voice-call` не
увімкнено, Google Meet усе ще може перевірити й записати план набору, але не може
здійснити Twilio-виклик.

## Інструмент

Агенти можуть використовувати інструмент `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Використовуйте `transport: "chrome"`, коли Chrome працює на хості Gateway. Використовуйте
`transport: "chrome-node"`, коли Chrome працює на спареному вузлі, наприклад у Parallels
VM. В обох випадках realtime модель і `openclaw_agent_consult` працюють на хості
Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сеанси або перевірити ID сеансу. Використовуйте
`action: "speak"` із `sessionId` і `message`, щоб realtime агент
заговорив негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сеанс,
запустити відому фразу й повернути стан `inCall`, коли хост Chrome може
про нього повідомити. `test_speech` завжди примусово задає `mode: "realtime"` і завершується помилкою, якщо його просять
працювати в `mode: "transcribe"`, оскільки сеанси лише для спостереження навмисно не можуть
виводити мовлення. Його результат `speechOutputVerified` базується на збільшенні байтів realtime аудіовиходу
під час цього тестового виклику, тому повторно використаний сеанс зі старішим аудіо
не рахується як свіжа успішна перевірка мовлення. Використовуйте `action: "leave"`, щоб позначити
сеанс завершеним.

`status` містить стан Chrome, коли він доступний:

- `inCall`: Chrome, схоже, перебуває всередині виклику Meet
- `micMuted`: найкраща можлива оцінка стану мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профілю
  браузера потрібен ручний вхід, допуск організатором Meet, дозволи або
  відновлення керування браузером, перш ніж мовлення зможе працювати
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: чи
  кероване мовлення Chrome зараз дозволене. `speechReady: false` означає, що OpenClaw
  не надіслав вступну або тестову фразу в аудіоміст.
- `providerConnected` / `realtimeReady`: стан realtime голосового мосту
- `lastInputAt` / `lastOutputAt`: останнє аудіо, побачене з мосту або надіслане в нього

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime консультація агента

Realtime режим Chrome оптимізований для живого голосового циклу. Realtime голосовий
провайдер чує аудіо зустрічі й говорить через налаштований аудіоміст.
Коли realtime моделі потрібне глибше міркування, актуальна інформація або звичайні
інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw у фоновому режимі з нещодавнім
контекстом транскрипту зустрічі й повертає стислу усну відповідь у realtime
голосовий сеанс. Потім голосова модель може промовити цю відповідь назад у зустріч.
Він використовує той самий спільний realtime інструмент консультації, що й Voice Call.

За замовчуванням консультації виконуються для агента `main`. Задайте `realtime.agentId`, коли
канал Meet має консультуватися зі спеціальним робочим простором агента OpenClaw, типовими параметрами моделі,
політикою інструментів, пам’яттю та історією сеансів.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: відкрити інструмент консультації й обмежити звичайного агента
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: відкрити інструмент консультації й дозволити звичайному агенту використовувати звичайну
  політику інструментів агента.
- `none`: не відкривати інструмент консультації для realtime голосової моделі.

Ключ сеансу консультації обмежений кожним сеансом Meet, тому подальші виклики консультації
можуть повторно використовувати попередній контекст консультації під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднався до виклику:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повної smoke-перевірки приєднання й мовлення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Контрольний список live-тесту

Використовуйте цю послідовність перед передаванням зустрічі агенту без нагляду:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Очікуваний стан Chrome-node:

- `googlemeet setup` повністю зелений.
- `googlemeet setup` містить `chrome-node-connected`, коли Chrome-node є
  транспортом за замовчуванням або вузол закріплено.
- `nodes status` показує, що вибраний вузол підключений.
- Вибраний вузол оголошує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до виклику, а `test-speech` повертає стан Chrome з
  `inCall: true`.

Для віддаленого хоста Chrome, наприклад Parallels macOS VM, це найкоротша
безпечна перевірка після оновлення Gateway або VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Це доводить, що Plugin Gateway завантажений, вузол VM підключений з
поточним токеном, а аудіоміст Meet доступний до того, як агент відкриє
справжню вкладку зустрічі.

Для Twilio smoke-перевірки використовуйте зустріч, яка надає дані телефонного набору:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Очікуваний стан Twilio:

- `googlemeet setup` містить зелені перевірки `twilio-voice-call-plugin`,
  `twilio-voice-call-credentials` і `twilio-voice-call-webhook`.
- `voicecall` доступний у CLI після перезавантаження Gateway.
- Повернений сеанс має `transport: "twilio"` і `twilio.voiceCallId`.
- `openclaw logs --follow` показує DTMF TwiML, відданий перед realtime TwiML, а потім
  realtime міст із початковим привітанням у черзі.
- `googlemeet leave <sessionId>` завершує делегований голосовий виклик.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно редагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway.
Працюючий агент бачить лише інструменти Plugin, зареєстровані поточним процесом
Gateway.

### Немає підключеного вузла з підтримкою Google Meet

На хості вузла виконайте:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

На хості Gateway схваліть вузол і перевірте команди:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Вузол має бути підключений і містити `googlemeet.chrome` плюс `browser.proxy`.
Конфігурація Gateway має дозволяти ці команди вузла:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Якщо `googlemeet setup` не проходить `chrome-node-connected` або журнал Gateway повідомляє
`gateway token mismatch`, перевстановіть або перезапустіть вузол із поточним токеном Gateway.
Для LAN Gateway це зазвичай означає:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Потім перезавантажте сервіс вузла й повторно виконайте:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Браузер відкривається, але агент не може приєднатися

Виконайте `googlemeet test-speech` і перевірте повернений стан Chrome. Якщо він
повідомляє `manualActionRequired: true`, покажіть `manualActionMessage` оператору
й припиніть повторні спроби, доки дію в браузері не буде завершено.

Поширені ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису організатора Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’явиться нативний запит дозволу
  Chrome.
- Закрити або відновити завислий діалог дозволів Meet.

Не повідомляйте "not signed in" лише тому, що Meet показує "Do you want people to
hear you in the meeting?" Це проміжний екран вибору аудіо Meet; OpenClaw
натискає **Use microphone** через автоматизацію браузера, коли це доступно, і продовжує
чекати на справжній стан зустрічі. Для резервного створення лише через браузер OpenClaw
може натиснути **Continue without microphone**, оскільки створення URL не потребує
realtime аудіошляху.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує endpoint Google Meet API `spaces.create`,
коли налаштовано OAuth облікові дані. Без OAuth облікових даних він переходить
до резервного браузера закріпленого вузла Chrome. Підтвердьте:

- Для створення через API: `oauth.clientId` і `oauth.refreshToken` налаштовані,
  або присутні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було випущено після додавання підтримки створення.
  Старішим токенам може бракувати scope `meetings.space.created`; повторно виконайте
  `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для резервного браузера: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений вузол із `browser.proxy` та
  `googlemeet.chrome`.
- Для резервного браузера: профіль OpenClaw Chrome на цьому вузлі має вхід у Google
  і може відкрити `https://meet.google.com/new`.
- Для резервного браузера: повторні спроби повторно використовують наявну вкладку
  `https://meet.google.com/new` або вкладку запиту облікового запису Google перед відкриттям нової вкладки. Якщо агент вичерпав час очікування,
  повторіть виклик інструмента замість ручного відкриття ще однієї вкладки Meet.
- Для резервного браузера: якщо інструмент повертає `manualActionRequired: true`, використовуйте
  повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і
  `manualActionMessage`, щоб скерувати оператора. Не повторюйте спроби в циклі, доки ця
  дія не буде завершена.
- Для резервного браузера: якщо Meet показує "Do you want people to hear you in the
  meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для
  резервного створення лише браузером, **Continue without microphone** через автоматизацію браузера
  й продовжити чекати на згенерований URL Meet. Якщо це неможливо, помилка
  має згадувати `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте realtime шлях:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "realtime"` для прослуховування й відповіді голосом. `mode: "transcribe"` навмисно
не запускає дуплексний realtime голосовий міст. `googlemeet test-speech`
завжди перевіряє realtime шлях і повідомляє, чи були помічені байти виходу мосту
для цього виклику. Якщо `speechOutputVerified` дорівнює false і
`speechOutputTimedOut` дорівнює true, realtime провайдер міг прийняти
висловлювання, але OpenClaw не побачив, щоб нові вихідні байти досягли аудіомосту
Chrome.

Також перевірте:

- На хості Gateway доступний ключ realtime провайдера, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `sox` існує на хості Chrome.
- Мікрофон і динамік Meet спрямовані через віртуальний аудіошлях, який використовує
  OpenClaw.

`googlemeet doctor [session-id]` друкує сеанс, вузол, стан у виклику,
причину ручної дії, підключення realtime провайдера, `realtimeReady`, активність
аудіовходу/виходу, останні аудіомітки часу, лічильники байтів і URL браузера.
Використовуйте `googlemeet status [session-id] --json`, коли потрібен сирий JSON. Використовуйте
`googlemeet doctor --oauth`, коли потрібно перевірити Google Meet OAuth refresh
без розкриття токенів; додайте `--meeting` або `--create-space`, коли також потрібне
підтвердження Google Meet API.

Якщо агент вичерпав час очікування і ви бачите вже відкриту вкладку Meet, перевірте цю вкладку
без відкриття ще однієї:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує та перевіряє
наявну вкладку Meet для вибраного транспорту. З `chrome` вона використовує
локальне керування браузером через Gateway; з `chrome-node` вона використовує
налаштований Chrome node. Вона не відкриває нову вкладку й не створює новий сеанс; вона повідомляє
поточний блокер, наприклад стан входу, допуску, дозволів або вибору аудіо.
Команда CLI звертається до налаштованого Gateway, тому Gateway має бути запущений;
`chrome-node` також потребує підключеного Chrome node.

### Перевірки налаштування Twilio не проходять

`twilio-voice-call-plugin` не проходить, коли `voice-call` не дозволено або не ввімкнено.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` не проходить, коли бекенду Twilio бракує SID облікового запису,
токена автентифікації або номера абонента, що телефонує. Задайте їх на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` не проходить, коли `voice-call` не має публічного Webhook
доступу або коли `publicUrl` вказує на loopback чи простір приватної мережі.
Установіть `plugins.entries.voice-call.config.publicUrl` на публічну URL-адресу провайдера або
налаштуйте тунель/Tailscale доступ для `voice-call`.

Loopback і приватні URL-адреси не придатні для зворотних викликів оператора. Не використовуйте
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` або `fd00::/8` як `publicUrl`.

Для стабільної публічної URL-адреси:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          fromNumber: "+15550001234",
          publicUrl: "https://voice.example.com/voice/webhook",
        },
      },
    },
  },
}
```

Для локальної розробки використовуйте тунель або Tailscale доступ замість приватної
URL-адреси хоста:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Потім перезапустіть або перезавантажте Gateway і виконайте:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` за замовчуванням лише перевіряє готовність. Щоб виконати пробний запуск для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли ви навмисно хочете здійснити живий вихідний
дзвінок-сповіщення:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Дзвінок Twilio починається, але не входить у зустріч

Переконайтеся, що подія Meet надає дані телефонного підключення. Передайте точний номер
дозвону й PIN або власну DTMF-послідовність:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкові `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза
перед введенням PIN.

Якщо телефонний дзвінок створено, але список учасників Meet так і не показує учасника
дозвону:

- Виконайте `openclaw voicecall status --call-id <id>` і переконайтеся, що дзвінок досі
  активний.
- Виконайте `openclaw voicecall tail` і перевірте, що Webhook-и Twilio надходять до
  Gateway.
- Виконайте `openclaw logs --follow` і знайдіть послідовність Twilio Meet: Google
  Meet делегує приєднання, Voice Call зберігає DTMF TwiML до підключення, віддає
  цей початковий TwiML, потім віддає TwiML реального часу й запускає міст реального часу
  з `initialGreeting=queued`.
- Повторно виконайте `openclaw googlemeet setup --transport twilio`; зелена перевірка налаштування
  обов’язкова, але не доводить, що послідовність PIN зустрічі правильна.
- Переконайтеся, що номер дозвону належить тому самому запрошенню Meet і регіону, що й
  PIN.
- Збільште початкові паузи в `--dtmf-sequence`, якщо Meet відповідає повільно, наприклад
  `wwww123456#`.
- Якщо учасник приєднується, але ви не чуєте привітання, перевірте
  `openclaw logs --follow` на TwiML реального часу, запуск моста реального часу та
  `initialGreeting=queued`. Привітання генерується з початкового
  повідомлення `voicecall.start` після підключення моста реального часу.

Якщо Webhook-и не надходять, спершу налагодьте Plugin Voice Call: провайдер має
досягати `plugins.entries.voice-call.config.publicUrl` або налаштованого тунелю.
Див. [Усунення неполадок голосових дзвінків](/uk/plugins/voice-call#troubleshooting).

## Примітки

Офіційний медіа-API Google Meet орієнтований на приймання, тому для мовлення в дзвінок Meet
усе ще потрібен шлях учасника. Цей Plugin робить цю межу видимою:
Chrome обробляє участь браузера та локальну маршрутизацію аудіо; Twilio обробляє
участь через телефонний дозвін.

Режим реального часу Chrome потребує `BlackHole 2ch` плюс одне з такого:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw володіє
  мостом моделі реального часу й передає аудіо у `chrome.audioFormat` між цими
  командами та вибраним провайдером голосу реального часу. Стандартний шлях Chrome —
  24 кГц PCM16; 8 кГц G.711 mu-law лишається доступним для застарілих пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда моста володіє всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може відлунювати інших учасників назад у дзвінок.

`googlemeet speak` запускає активний аудіоміст реального часу для сеансу Chrome.
`googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих через Plugin
Voice Call, `leave` також завершує базовий голосовий дзвінок.

## Пов’язане

- [Plugin голосових дзвінків](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення Plugin-ів](/uk/plugins/building-plugins)
