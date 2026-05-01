---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий дзвінок Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт для Google Meet
summary: 'Plugin Google Meet: приєднання за явно вказаними URL-адресами Meet через Chrome або Twilio з типовими налаштуваннями голосу в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-01T05:53:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b7f5505dcc0ee20a5331f1e41206c8a4fd4090f317799d3f8af0018a067772f
    source_path: plugins/google-meet.md
    workflow: 16
---

Підтримка учасника Google Meet для OpenClaw — Plugin навмисно зроблено явним:

- Він приєднується лише до явної URL-адреси `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися за
  поверненою URL-адресою.
- `realtime` голос є режимом за замовчуванням.
- Realtime голос може звертатися назад до повного агента OpenClaw, коли потрібні глибші
  міркування або інструменти.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `realtime` для живого
  прослуховування/зворотного мовлення або `transcribe`, щоб приєднатися/керувати браузером без
  realtime голосового мосту.
- Автентифікація починається як особистий Google OAuth або вже авторизований профіль Chrome.
- Автоматичного оголошення про згоду немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на спареному вузловому хості.
- Twilio приймає номер для дозвону плюс необов’язковий PIN або DTMF-послідовність.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших агентських
  робочих процесів телеконференцій.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте бекенд-провайдер realtime голосу.
OpenAI є типовим; Google Gemini Live також працює з
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` установлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор
Homebrew потребує перезавантаження, перш ніж macOS покаже пристрій:

```bash
sudo reboot
```

Після перезавантаження перевірте обидві частини:

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

Вивід налаштування призначений бути придатним для читання агентом і враховувати режим. Він повідомляє про профіль Chrome
, прив’язування вузла та, для realtime приєднань Chrome, аудіоміст
BlackHole/SoX і перевірки затриманого realtime вступу. Для приєднань лише для спостереження перевірте той самий
транспорт за допомогою `--mode transcribe`; цей режим пропускає передумови realtime аудіо,
оскільки він не слухає через міст і не говорить через нього:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Коли делегування Twilio налаштовано, налаштування також повідомляє, чи готові
Plugin `voice-call`, облікові дані Twilio та публічне Webhook-розкриття.
Сприймайте будь-яку перевірку `ok: false` як блокер для перевіреного транспорту й режиму,
перш ніж просити агента приєднатися. Використовуйте `openclaw googlemeet setup --json` для
скриптів або машиночитного виводу. Використовуйте `--transport chrome`,
`--transport chrome-node` або `--transport twilio`, щоб попередньо перевірити конкретний
транспорт, перш ніж агент спробує його.

Для Twilio завжди явно попередньо перевіряйте транспорт, коли типовий транспорт
— Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Це виявляє відсутнє підключення `voice-call`, облікові дані Twilio або недосяжне
Webhook-розкриття до того, як агент спробує зателефонувати на зустріч.

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
- Резервний браузерний шлях: використовується, коли облікових даних OAuth немає. OpenClaw використовує
  закріплений вузол Chrome, відкриває `https://meet.google.com/new`, чекає, поки Google
  переспрямує на справжню URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Цей шлях потребує,
  щоб профіль OpenClaw Chrome на вузлі вже був авторизований у Google.
  Автоматизація браузера обробляє власний запит Meet першого запуску щодо мікрофона; цей запит
  не вважається помилкою входу в Google.
  Потоки приєднання й створення також намагаються повторно використати наявну вкладку Meet, перш ніж відкривати
  нову. Зіставлення ігнорує нешкідливі рядки запиту URL, такі як `authuser`, тож повторна спроба
  агента має сфокусувати вже відкриту зустріч замість створення другої
  вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` за замовчуванням приєднується до нової зустрічі й
повертає `joined: true` плюс сесію приєднання. Щоб лише згенерувати URL-адресу, використовуйте
`create --no-join` у CLI або передайте `"join": false` інструменту.

Або скажіть агенту: «Створи Google Meet, приєднайся до нього з realtime голосом і надішли
мені посилання». Агент має викликати `google_meet` з `action: "create"`, а
потім поділитися поверненим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Для приєднання лише для спостереження/керування браузером установіть `"mode": "transcribe"`. Це
не запускає дуплексний realtime модельний міст, не потребує BlackHole або SoX
і не говоритиме назад у зустріч. Приєднання Chrome у цьому режимі також уникають
надання OpenClaw дозволу на мікрофон/камеру та уникають шляху Meet **Використовувати
мікрофон**. Якщо Meet показує проміжний екран вибору аудіо, автоматизація пробує
шлях без мікрофона, а інакше повідомляє про ручну дію замість відкриття
локального мікрофона.

Під час realtime сесій статус `google_meet` містить стан браузера та аудіомоста,
як-от `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, останні часові мітки
вводу/виводу, лічильники байтів і стан закриття мосту. Якщо з’являється безпечний запит сторінки Meet
, автоматизація браузера обробляє його, коли може. Вхід, допуск хостом і
запити дозволів браузера/ОС повідомляються як ручна дія з причиною та
повідомленням, яке агент має передати. Керовані сесії Chrome відтворюють вступ або
тестову фразу лише після того, як стан браузера повідомляє `inCall: true`; інакше статус повідомляє
`speechReady: false`, а спроба мовлення блокується замість удавання, що
агент говорив у зустріч.

Локальні приєднання Chrome використовують авторизований профіль браузера OpenClaw. Realtime режим
потребує `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для
чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного
пристрою BlackHole достатньо для першого smoke test, але він може створювати відлуння.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM
лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть
вузловий хост у VM. Увімкніть вбудований Plugin на VM один раз, щоб вузол
оголошував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робоча область агента, ключі моделі/API, realtime
  провайдер і конфігурація Plugin Google Meet.
- Parallels macOS VM: OpenClaw CLI/вузловий хост, Google Chrome, SoX, BlackHole 2ch
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

Установіть або оновіть OpenClaw у VM, а потім увімкніть там вбудований Plugin:

```bash
openclaw plugins enable google-meet
```

Запустіть вузловий хост у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це LAN IP і ви не використовуєте TLS, вузол відмовляється від
plain text WebSocket, якщо ви не погодитеся на це для цієї довіреної приватної мережі:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Використовуйте ту саму змінну середовища під час установлення вузла як LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це середовище процесу, а не налаштування
`openclaw.json`. `openclaw node install` зберігає його в середовищі LaunchAgent
, коли воно присутнє в команді встановлення.

Схваліть вузол із хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить вузол і що він оголошує як `googlemeet.chrome`,
так і можливість браузера/`browser.proxy`:

```bash
openclaw nodes status
```

Спрямуйте Meet через цей вузол на хості Gateway:

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

Тепер приєднуйтеся звичайно з хоста Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

або попросіть агента використати інструмент `google_meet` з `transport: "chrome-node"`.

Для smoke test однією командою, який створює або повторно використовує сесію, вимовляє відому
фразу та друкує стан сесії:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час realtime приєднання автоматизація браузера OpenClaw заповнює ім’я гостя, натискає
Join/Ask to join і приймає вибір Meet першого запуску «Використовувати мікрофон», коли цей
запит з’являється. Під час приєднання лише для спостереження або створення зустрічі лише в браузері вона
проходить той самий запит без мікрофона, коли такий вибір доступний.
Якщо профіль браузера не авторизований, Meet чекає допуску хостом,
Chrome потребує дозволу на мікрофон/камеру для realtime приєднання або Meet застряг
на запиті, який автоматизація не змогла розв’язати, результат join/test-speech повідомляє
`manualActionRequired: true` з `manualActionReason` і
`manualActionMessage`. Агенти мають припинити повторювати приєднання, повідомити це точне
повідомлення плюс поточні `browserUrl`/`browserTitle` і повторити спробу лише після завершення
ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає вузол лише тоді, коли рівно один
підключений вузол оголошує як `googlemeet.chrome`, так і керування браузером. Якщо
підключено кілька придатних вузлів, установіть `chromeNode.node` як ідентифікатор вузла,
відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `Configured Google Meet node ... is not usable: offline`: закріплений вузол
  відомий Gateway, але недоступний. Агенти мають розглядати цей вузол як
  діагностичний стан, а не як придатний до використання хост Chrome, і
  повідомляти про блокер налаштування замість переходу на інший транспорт,
  якщо користувач цього не просив.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  підтвердьте pairing і переконайтеся, що `openclaw plugins enable google-meet`
  та `openclaw plugins enable browser` було виконано у VM. Також підтвердьте,
  що хост Gateway дозволяє обидві команди вузла через
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: установіть `blackhole-2ch` на хості,
  який перевіряється, і перезавантажте його перед використанням локального аудіо Chrome.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch`
  у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера
  всередині VM або залиште `chrome.guestName` заданим для гостьового
  приєднання. Гостьове автоматичне приєднання використовує браузерну автоматизацію
  OpenClaw через проксі браузера вузла; переконайтеся, що конфігурація браузера
  вузла вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або іменований профіль наявного сеансу.
- Дублікати вкладок Meet: залиште `chrome.reuseExistingTab: true` увімкненим.
  OpenClaw активує наявну вкладку для тієї самої URL-адреси Meet перед відкриттям
  нової, а створення зустрічі в браузері повторно використовує поточну вкладку
  `https://meet.google.com/new` або вкладку запиту облікового запису Google перед
  відкриттям іншої.
- Немає аудіо: у Meet спрямуйте мікрофон/динамік через шлях віртуального аудіопристрою,
  який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію
  в стилі Loopback для чистого двостороннього аудіо.

## Примітки щодо встановлення

Типовий режим Chrome realtime використовує два зовнішні інструменти:

- `sox`: аудіоутиліта командного рядка. Plugin використовує явні команди пристроїв CoreAudio
  для типового аудіомоста 24 kHz PCM16.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`,
  через який Chrome/Meet може виконувати маршрутизацію.

OpenClaw не постачає й не розповсюджує жоден із цих пакетів. Документація просить користувачів
установлювати їх як залежності хоста через Homebrew. SoX ліцензовано як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole має ліцензію GPL-3.0. Якщо ви створюєте
інсталятор або пристрій, який постачає BlackHole разом з OpenClaw, перегляньте
умови ліцензування BlackHole від upstream або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet через керування браузером OpenClaw і приєднується
як виконаний вхід у браузерний профіль OpenClaw. На macOS Plugin перевіряє наявність
`BlackHole 2ch` перед запуском. Якщо налаштовано, він також виконує команду перевірки
стану аудіомоста та команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли
Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо
працюють на спареному вузлі, наприклад VM Parallels macOS. Для локального Chrome виберіть
профіль за допомогою `browser.defaultProfile`; `chrome.browserProfile` передається на
хости `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона й динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування
замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план набору, делегований Plugin Voice Call. Він
не аналізує сторінки Meet для пошуку телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або потрібен резервний варіант
телефонного дозвону. Google Meet має надавати номер телефонного дозвону та PIN для
зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

Увімкніть Plugin Voice Call на хості Gateway, а не на вузлі Chrome:

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

Надайте облікові дані Twilio через середовище або конфігурацію. Середовище
не допускає потрапляння секретів у `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни
конфігурації Plugin не з’являються у вже запущеному процесі Gateway, доки він не перезавантажиться.

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

Використовуйте `--dtmf-sequence`, коли зустріч потребує спеціальної послідовності:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth і попередня перевірка

OAuth є необов’язковим для створення посилання Meet, оскільки `googlemeet create` може
повертатися до браузерної автоматизації. Налаштуйте OAuth, коли потрібне офіційне
створення через API, розв’язання простору або попередні перевірки Meet Media API.

Доступ до Google Meet API використовує користувацький OAuth: створіть клієнт Google Cloud OAuth,
запросіть потрібні області доступу, авторизуйте обліковий запис Google, а потім збережіть
отриманий токен оновлення в конфігурації Plugin Google Meet або надайте змінні середовища
`OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання Chrome. Транспорти Chrome і Chrome-node все одно
приєднуються через виконаний вхід у профіль Chrome, BlackHole/SoX і підключений вузол,
коли ви використовуєте участь через браузер. OAuth призначений лише для офіційного шляху
Google Meet API: створення просторів зустрічей, розв’язання просторів і виконання
попередніх перевірок Meet Media API.

### Створення облікових даних Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** є найпростішим для організації Google Workspace.
   - **External** працює для особистих/тестових налаштувань; поки застосунок перебуває в Testing,
     додайте кожен обліковий запис Google, який авторизуватиме застосунок, як тестового користувача.
4. Додайте області доступу, які запитує OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Створіть ідентифікатор клієнта OAuth.
   - Тип застосунку: **Web application**.
   - Авторизований URI перенаправлення:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Скопіюйте ідентифікатор клієнта та секрет клієнта.

`meetings.space.created` потрібен Google Meet `spaces.create`.
`meetings.space.readonly` дає OpenClaw змогу розв’язувати URL-адреси/коди Meet у простори.
`meetings.conference.media.readonly` призначений для попередньої перевірки Meet Media API та роботи
з медіа; Google може вимагати реєстрації в Developer Preview для фактичного використання Media API.
Якщо вам потрібні лише приєднання Chrome на основі браузера, повністю пропустіть OAuth.

### Отримання токена оновлення

Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, або передайте їх як
змінні середовища, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` з токеном оновлення. Вона використовує PKCE,
зворотний виклик localhost на `http://localhost:8085/oauth2callback` і ручний потік
копіювання/вставлення з `--manual`.

Приклади:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Використовуйте ручний режим, коли браузер не може досягти локального зворотного виклику:

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

Збережіть об’єкт `oauth` у конфігурації Plugin Google Meet:

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

Надавайте перевагу змінним середовища, коли не хочете зберігати токен оновлення
в конфігурації. Якщо присутні значення і в конфігурації, і в середовищі, Plugin спершу
використовує конфігурацію, а потім fallback до середовища.

Згода OAuth включає створення просторів Meet, доступ на читання просторів Meet і доступ
на читання медіа конференцій Meet. Якщо ви автентифікувалися до появи підтримки створення
зустрічей, повторно виконайте `openclaw googlemeet auth login --json`, щоб токен оновлення
мав область доступу `meetings.space.created`.

### Перевірка OAuth за допомогою doctor

Запустіть OAuth doctor, коли потрібна швидка перевірка стану без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує runtime Chrome і не потребує підключеного вузла Chrome. Воно
перевіряє, що конфігурація OAuth існує і що токен оновлення може отримати токен доступу.
Звіт JSON містить лише поля стану, як-от `ok`, `configured`,
`tokenSource`, `expiresAt`, і повідомлення перевірок; він не виводить токен доступу,
токен оновлення або секрет клієнта.

Поширені результати:

| Перевірка            | Значення                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Присутній `oauth.clientId` плюс `oauth.refreshToken` або кешований токен доступу.       |
| `oauth-token`        | Кешований токен доступу все ще чинний або токен оновлення отримав новий токен доступу. |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` розв’язала наявний простір Meet.                   |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий простір Meet.                  |

Щоб також підтвердити ввімкнення Google Meet API і область доступу `spaces.create`,
запустіть перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює одноразову URL-адресу Meet. Використовуйте це, коли потрібно
підтвердити, що проєкт Google Cloud має ввімкнений Meet API і що авторизований обліковий
запис має область доступу `meetings.space.created`.

Щоб підтвердити доступ на читання для наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` підтверджують доступ на читання до наявного
простору, до якого авторизований обліковий запис Google має доступ. `403` від цих перевірок
зазвичай означає, що Google Meet REST API вимкнено, токен оновлення зі згодою не має
потрібної області доступу або обліковий запис Google не може отримати доступ до цього простору
Meet. Помилка токена оновлення означає, що потрібно повторно виконати `openclaw googlemeet auth login
--json` і зберегти новий блок `oauth`.

Для браузерного fallback облікові дані OAuth не потрібні. У цьому режимі автентифікація
Google надходить із виконаного входу в профіль Chrome на вибраному вузлі, а не з
конфігурації OpenClaw.

Ці змінні середовища приймаються як fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` або `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` або `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` або
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` або `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` або `GOOGLE_MEET_PREVIEW_ACK`

Визначте URL Meet, код або `spaces/{id}` через `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Запустіть попередню перевірку перед роботою з медіа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Перегляньте список артефактів зустрічі та відвідуваність після того, як Meet створить записи конференції:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

З `--meeting` команди `artifacts` і `attendance` за замовчуванням використовують останній запис конференції.
Передайте `--all-conference-records`, якщо потрібні всі збережені записи
для цієї зустрічі.

Пошук у календарі може визначити URL зустрічі з Google Calendar перед читанням
артефактів Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` шукає в сьогоднішньому календарі `primary` подію Calendar із
посиланням Google Meet. Використовуйте `--event <query>` для пошуку відповідного тексту події та
`--calendar <id>` для неосновного календаря. Пошук у календарі потребує нового
входу через OAuth, який включає область доступу лише для читання подій Calendar.
`calendar-events` попередньо показує відповідні події Meet і позначає подію, яку
виберуть `latest`, `artifacts`, `attendance` або `export`.

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

`artifacts` повертає метадані запису конференції, а також метадані ресурсів учасників, записів,
транскриптів, структурованих записів транскрипту та розумних нотаток, коли
Google надає їх для зустрічі. Використовуйте `--no-transcript-entries`, щоб пропустити
пошук записів для великих зустрічей. `attendance` розгортає учасників у
рядки сеансів учасників із часом першої/останньої появи, загальною тривалістю сеансу,
позначками запізнення/раннього виходу та дубльованими ресурсами учасників, об’єднаними за користувачем, що ввійшов,
або відображуваним іменем. Передайте `--no-merge-duplicates`, щоб зберегти необроблені ресурси учасників
окремо, `--late-after-minutes`, щоб налаштувати визначення запізнення, і
`--early-before-minutes`, щоб налаштувати визначення раннього виходу.

`export` записує теку, що містить `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`.
`manifest.json` фіксує вибраний вхід, параметри експорту, записи конференції,
вихідні файли, лічильники, джерело токена, подію Calendar, якщо вона використовувалася, і всі
попередження про часткове отримання. Передайте `--zip`, щоб також записати переносний архів поруч
із текою. Передайте `--include-doc-bodies`, щоб експортувати пов’язаний транскрипт і
текст розумних нотаток Google Docs через Google Drive `files.export`; для цього потрібен
новий вхід через OAuth, який включає область доступу лише для читання Drive Meet. Без
`--include-doc-bodies` експорти містять лише метадані Meet і структуровані записи транскрипту.
Якщо Google повертає часткову помилку артефакту, наприклад помилку списку розумних нотаток,
запису транскрипту або тіла документа Drive, зведення й
маніфест зберігають попередження замість того, щоб провалити весь експорт.
Використовуйте `--dry-run`, щоб отримати ті самі дані артефактів/відвідуваності та вивести
JSON маніфесту без створення теки або ZIP. Це корисно перед записом
великого експорту або коли агенту потрібні лише лічильники, вибрані записи та
попередження.

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

Запустіть захищений живий smoke-тест для реальної збереженої зустрічі:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Середовище живого smoke-тесту:

- `OPENCLAW_LIVE_TEST=1` вмикає захищені живі тести.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` вказує на збережений URL Meet, код або
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID` надає ідентифікатор клієнта OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN` надає
  токен оновлення.
- Необов’язково: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` і
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` використовують ті самі резервні назви
  без префікса `OPENCLAW_`.

Базовому живому smoke-тесту артефактів/відвідуваності потрібні
`https://www.googleapis.com/auth/meetings.space.readonly` і
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Пошуку в Calendar
потрібен `https://www.googleapis.com/auth/calendar.events.readonly`. Експорту
тіла документа Drive потрібен
`https://www.googleapis.com/auth/drive.meet.readonly`.

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда виводить новий `meeting uri`, джерело та сеанс приєднання. З обліковими даними OAuth
вона використовує офіційний Google Meet API. Без облікових даних OAuth вона
використовує профіль браузера закріпленого вузла Chrome, у якому виконано вхід, як резервний варіант. Агенти можуть
використовувати інструмент `google_meet` з `action: "create"`, щоб створити зустріч і приєднатися за один
крок. Для створення лише URL передайте `"join": false`.

Приклад JSON-виводу з резервного браузерного варіанта:

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

Якщо резервний браузерний варіант натикається на вхід у Google або блокування дозволів Meet до того, як
зможе створити URL, метод Gateway повертає невдалу відповідь, а
інструмент `google_meet` повертає структуровані деталі замість звичайного рядка:

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
`manualActionMessage` разом із контекстом вузла/вкладки браузера та припинити відкривати нові
вкладки Meet, доки оператор не завершить крок у браузері.

Приклад JSON-виводу зі створення через API:

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

Створення Meet за замовчуванням приєднується до зустрічі. Транспорту Chrome або Chrome-node все одно
потрібен профіль Google Chrome, у якому виконано вхід, щоб приєднатися через браузер. Якщо з
профілю виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або
помилку резервного браузерного варіанта та просить оператора завершити вхід у Google перед
повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
проект, принципал OAuth і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для медіа-API Meet.

## Конфігурація

Спільному шляху Chrome у реальному часі потрібні лише ввімкнений plugin, BlackHole, SoX
і ключ бекенд-провайдера голосу в реальному часі. OpenAI використовується за замовчуванням; установіть
`realtime.provider: "google"`, щоб використовувати Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Установіть конфігурацію plugin у `plugins.entries.google-meet.config`:

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

Значення за замовчуванням:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: необов’язковий ідентифікатор/назва/IP вузла для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на гостьовому екрані Meet
  без входу
- `chrome.autoJoin: true`: найкраща спроба заповнити ім’я гостя та натиснути Join Now
  через браузерну автоматизацію OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить про стан у дзвінку,
  перш ніж запускати вступ у реальному часі
- `chrome.audioFormat: "pcm16-24khz"`: аудіоформат пари команд. Використовуйте
  `"g711-ulaw-8khz"` лише для застарілих/користувацьких пар команд, які все ще генерують
  телефонне аудіо.
- `chrome.audioInputCommand`: команда SoX, що читає з CoreAudio `BlackHole 2ch`
  і записує аудіо у `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX, що читає аудіо у `chrome.audioFormat`
  і записує в CoreAudio `BlackHole 2ch`
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли міст реального часу
  підключається; установіть значення `""`, щоб приєднатися без звуку
- `realtime.agentId`: необов’язковий ідентифікатор агента OpenClaw для
  `openclaw_agent_consult`; за замовчуванням `main`

Необов’язкові перевизначення:

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
фактичний виклик PSTN і DTMF до Voice Call plugin. Якщо `voice-call` не
ввімкнено, Google Meet усе ще може перевірити й записати план набору, але не може
розмістити виклик Twilio.

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
`transport: "chrome-node"`, коли Chrome працює на спареному Node, наприклад у Parallels
VM. В обох випадках realtime-модель і `openclaw_agent_consult` працюють на хості
Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сеанси або переглянути ID сеансу. Використовуйте
`action: "speak"` із `sessionId` і `message`, щоб realtime-агент
заговорив негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сеанс,
запустити відому фразу та повернути стан справності `inCall`, коли хост Chrome може
про нього повідомити. `test_speech` завжди примусово встановлює `mode: "realtime"` і завершується помилкою, якщо його просять
працювати в `mode: "transcribe"`, тому що сеанси лише для спостереження навмисно не можуть
виводити мовлення. Його результат `speechOutputVerified` базується на збільшенні байтів realtime-аудіовиходу
під час цього тестового виклику, тому повторно використаний сеанс зі старішим аудіо
не зараховується як свіжа успішна перевірка мовлення. Використовуйте `action: "leave"`, щоб позначити
сеанс завершеним.

`status` містить стан справності Chrome, коли він доступний:

- `inCall`: схоже, Chrome перебуває всередині виклику Meet
- `micMuted`: приблизний стан мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профіль
  браузера потребує ручного входу, допуску від хоста Meet, дозволів або
  відновлення керування браузером, перш ніж мовлення зможе працювати
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: чи
  кероване мовлення Chrome дозволене зараз. `speechReady: false` означає, що OpenClaw не
  надіслав вступну/тестову фразу в аудіоміст.
- `providerConnected` / `realtimeReady`: стан realtime-голосового мосту
- `lastInputAt` / `lastOutputAt`: останнє аудіо, отримане з мосту або надіслане до нього

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Консультація realtime-агента

Realtime-режим Chrome оптимізовано для живого голосового циклу. Realtime-провайдер голосу
чує аудіо зустрічі та говорить через налаштований аудіоміст.
Коли realtime-моделі потрібні глибші міркування, актуальна інформація або звичайні
інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw у фоновому режимі з нещодавнім
контекстом транскрипту зустрічі та повертає стислу усну відповідь до realtime
голосового сеансу. Потім голосова модель може промовити цю відповідь назад у зустріч.
Він використовує той самий спільний realtime-інструмент консультації, що й Voice Call.

За замовчуванням консультації виконуються для агента `main`. Встановіть `realtime.agentId`, коли
смуга Meet має консультуватися зі спеціальним робочим простором агента OpenClaw, типовими налаштуваннями моделі,
політикою інструментів, пам’яттю та історією сеансів.

`realtime.toolPolicy` керує виконанням консультації:

- `safe-read-only`: відкрити інструмент консультації та обмежити звичайного агента
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: відкрити інструмент консультації та дозволити звичайному агенту використовувати звичайну
  політику інструментів агента.
- `none`: не відкривати інструмент консультації realtime-голосовій моделі.

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

Використовуйте цю послідовність, перш ніж передати зустріч автономному агенту:

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
  типовим транспортом або Node закріплено.
- `nodes status` показує вибраний Node як підключений.
- Вибраний Node оголошує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до виклику, а `test-speech` повертає стан справності Chrome з
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

Це доводить, що Plugin Gateway завантажено, Node VM підключений із
поточним токеном, а аудіоміст Meet доступний до того, як агент відкриє
реальну вкладку зустрічі.

Для smoke-перевірки Twilio використовуйте зустріч, яка надає дані телефонного підключення:

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
- `googlemeet leave <sessionId>` завершує делегований голосовий виклик.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно редагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway.
Запущений агент бачить лише інструменти Plugin, зареєстровані поточним процесом Gateway.

### Немає підключеного Node із підтримкою Google Meet

На хості Node виконайте:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

На хості Gateway схваліть Node і перевірте команди:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node має бути підключений і перелічувати `googlemeet.chrome` разом із `browser.proxy`.
Конфігурація Gateway має дозволяти ці команди Node:

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
`gateway token mismatch`, перевстановіть або перезапустіть Node із поточним токеном Gateway.
Для LAN Gateway це зазвичай означає:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Потім перезавантажте службу Node і повторно виконайте:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Браузер відкривається, але агент не може приєднатися

Запустіть `googlemeet test-speech` і перегляньте повернений стан справності Chrome. Якщо він
повідомляє `manualActionRequired: true`, покажіть `manualActionMessage` оператору
і припиніть повторні спроби, доки дія в браузері не буде завершена.

Поширені ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису хоста Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’явиться нативний запит дозволу
  Chrome.
- Закрити або відновити завислий діалог дозволів Meet.

Не повідомляйте "not signed in" лише тому, що Meet показує "Do you want people to
hear you in the meeting?" Це проміжний екран вибору аудіо Meet; OpenClaw
натискає **Use microphone** через браузерну автоматизацію, коли вона доступна, і продовжує
очікувати реального стану зустрічі. Для резервного режиму браузера лише для створення OpenClaw
може натиснути **Continue without microphone**, тому що створення URL не потребує
realtime-аудіошляху.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує endpoint Google Meet API `spaces.create`,
коли налаштовано облікові дані OAuth. Без облікових даних OAuth він переходить
до резервного браузера на закріпленому Chrome Node. Перевірте:

- Для створення через API: налаштовано `oauth.clientId` і `oauth.refreshToken`,
  або присутні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token був створений після додавання підтримки створення.
  Старішим токенам може бракувати scope `meetings.space.created`; повторно виконайте
  `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для резервного браузера: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений Node із `browser.proxy` і
  `googlemeet.chrome`.
- Для резервного браузера: профіль OpenClaw Chrome на цьому Node увійшов
  у Google і може відкрити `https://meet.google.com/new`.
- Для резервного браузера: повторні спроби використовують наявну вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google, перш ніж відкривати нову вкладку. Якщо агент перевищує час очікування,
  повторіть виклик інструмента замість ручного відкриття ще однієї вкладки Meet.
- Для резервного браузера: якщо інструмент повертає `manualActionRequired: true`, використовуйте
  повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і
  `manualActionMessage`, щоб скерувати оператора. Не повторюйте спроби в циклі, доки ця
  дія не буде завершена.
- Для резервного браузера: якщо Meet показує "Do you want people to hear you in the
  meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для
  резервного режиму лише створення, **Continue without microphone** через браузерну
  автоматизацію та продовжити очікування згенерованого URL Meet. Якщо він не може, у
  помилці має згадуватися `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте realtime-шлях:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "realtime"` для прослуховування/відповіді голосом. `mode: "transcribe"` навмисно
не запускає дуплексний realtime-голосовий міст. `googlemeet test-speech`
завжди перевіряє realtime-шлях і повідомляє, чи були помічені байти виходу мосту
для цього виклику. Якщо `speechOutputVerified` має значення false, а
`speechOutputTimedOut` має значення true, realtime-провайдер міг прийняти
висловлювання, але OpenClaw не побачив, що нові вихідні байти дійшли до аудіомосту
Chrome.

Також перевірте:

- Ключ realtime-провайдера доступний на хості Gateway, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `sox` існує на хості Chrome.
- Мікрофон і динамік Meet спрямовані через віртуальний аудіошлях, який використовує
  OpenClaw.

`googlemeet doctor [session-id]` виводить сеанс, Node, стан у виклику,
причину ручної дії, підключення realtime-провайдера, `realtimeReady`, активність
аудіовходу/аудіовиходу, останні аудіомітки часу, лічильники байтів і URL браузера.
Використовуйте `googlemeet status [session-id] --json`, коли потрібен сирий JSON. Використовуйте
`googlemeet doctor --oauth`, коли потрібно перевірити оновлення OAuth Google Meet
без розкриття токенів; додайте `--meeting` або `--create-space`, коли також потрібен
доказ Google Meet API.

Якщо агент перевищив час очікування і ви бачите вже відкриту вкладку Meet, перегляньте цю вкладку
без відкриття іншої:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує та переглядає
наявну вкладку Meet для вибраного транспорту. З `chrome` вона використовує локальне
керування браузером через Gateway; з `chrome-node` вона використовує налаштований
Chrome Node. Вона не відкриває нову вкладку й не створює новий сеанс; вона повідомляє
поточний блокер, наприклад вхід, допуск, дозволи або стан вибору аудіо.
Команда CLI звертається до налаштованого Gateway, тому Gateway має бути запущений;
`chrome-node` також вимагає, щоб Chrome Node був підключений.

### Перевірки налаштування Twilio не проходять

`twilio-voice-call-plugin` завершується з помилкою, коли `voice-call` не дозволено або не ввімкнено.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` завершується з помилкою, коли в бекенді Twilio бракує account
SID, auth token або номера абонента, що телефонує. Задайте їх на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` завершується з помилкою, коли `voice-call` не має публічного
доступу Webhook або коли `publicUrl` вказує на local loopback чи простір приватної мережі.
Задайте `plugins.entries.voice-call.config.publicUrl` як публічну URL-адресу провайдера або
налаштуйте тунель/Tailscale-доступ для `voice-call`.

Loopback і приватні URL-адреси не підходять для зворотних викликів операторів. Не використовуйте
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

Для локальної розробки використовуйте тунель або Tailscale-доступ замість приватної
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

`voicecall smoke` за замовчуванням перевіряє лише готовність. Щоб виконати пробний запуск для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли навмисно хочете здійснити живий вихідний сповіщувальний
дзвінок:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Виклик Twilio починається, але ніколи не входить у зустріч

Переконайтеся, що подія Meet надає дані для телефонного підключення. Передайте точний номер для
телефонного підключення та PIN або власну DTMF-послідовність:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкові `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза
перед введенням PIN.

Якщо телефонний виклик створено, але список учасників Meet ніколи не показує учасника
телефонного підключення:

- Виконайте `openclaw voicecall status --call-id <id>` і переконайтеся, що виклик досі
  активний.
- Виконайте `openclaw voicecall tail` і перевірте, що Webhook-и Twilio надходять до
  Gateway.
- Повторно виконайте `openclaw googlemeet setup --transport twilio`; зелена перевірка налаштування
  обов’язкова, але не доводить, що послідовність PIN для зустрічі правильна.
- Переконайтеся, що номер для телефонного підключення належить тому самому запрошенню Meet і регіону, що й
  PIN.
- Збільште початкові паузи в `--dtmf-sequence`, якщо Meet відповідає повільно, наприклад
  `wwww123456#`.

Якщо Webhook-и не надходять, спочатку налагодьте Plugin Voice Call: провайдер має
досягати `plugins.entries.voice-call.config.publicUrl` або налаштованого тунелю.
Див. [усунення проблем із голосовими викликами](/uk/plugins/voice-call#troubleshooting).

## Нотатки

Офіційний медіа-API Google Meet орієнтований на приймання, тому для мовлення в
дзвінку Meet все одно потрібен шлях учасника. Цей Plugin робить цю межу видимою:
Chrome обробляє участь у браузері та локальну маршрутизацію аудіо; Twilio обробляє
участь через телефонне підключення.

Для режиму реального часу Chrome потрібен `BlackHole 2ch` плюс один із варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує
  мостом моделі реального часу та передає аудіо в `chrome.audioFormat` між цими
  командами й вибраним голосовим провайдером реального часу. Стандартний шлях Chrome —
  24 kHz PCM16; 8 kHz G.711 mu-law залишається доступним для застарілих пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда моста керує всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може відлунювати інших учасників назад у дзвінок.

`googlemeet speak` запускає активний аудіоміст реального часу для сесії Chrome. `googlemeet leave` зупиняє цей міст. Для сесій Twilio, делегованих
через Plugin Voice Call, `leave` також завершує базовий голосовий виклик.

## Пов’язане

- [Plugin голосових викликів](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення plugins](/uk/plugins/building-plugins)
