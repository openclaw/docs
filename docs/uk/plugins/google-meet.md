---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий дзвінок Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт для Google Meet
summary: 'Plugin Google Meet: приєднання до явно вказаних URL Meet через Chrome або Twilio з типовими налаштуваннями голосу в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-01T12:19:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: d96601ca5ba6737d92de013047a26662f691ebc7a24e816db6616f99652865b6
    source_path: plugins/google-meet.md
    workflow: 16
---

Підтримка учасника Google Meet для OpenClaw — Plugin навмисно зроблено явним:

- Він приєднується лише до явної URL-адреси `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися до
  поверненої URL-адреси.
- Голос `realtime` є режимом за замовчуванням.
- Голос у реальному часі може звертатися назад до повного агента OpenClaw, коли потрібні глибші
  міркування або інструменти.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `realtime` для живого
  прослуховування/відповіді голосом або `transcribe`, щоб приєднатися/керувати браузером без
  голосового моста реального часу.
- Автентифікація починається як особистий Google OAuth або вже виконаний вхід у профілі Chrome.
- Автоматичного оголошення згоди немає.
- Аудіобекенд Chrome за замовчуванням — `BlackHole 2ch`.
- Chrome може працювати локально або на спареному хості вузла.
- Twilio приймає номер для дзвінка плюс необов’язковий PIN або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших агентських
  сценаріїв телеконференцій.

## Швидкий старт

Установіть локальні аудіозалежності й налаштуйте бекенд-провайдера голосу
реального часу. OpenAI використовується за замовчуванням; Google Gemini Live також працює з
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

Вивід налаштування призначений для читання агентом і враховує режим. Він повідомляє про профіль Chrome,
прив’язування вузла, а для приєднань Chrome у реальному часі — про аудіоміст BlackHole/SoX
і відкладені перевірки вступу реального часу. Для приєднань лише для спостереження перевірте той самий
транспорт із `--mode transcribe`; цей режим пропускає передумови аудіо реального часу,
бо не слухає через міст і не говорить через нього:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Коли налаштовано делегування Twilio, налаштування також повідомляє, чи готові
Plugin `voice-call`, облікові дані Twilio та публічна доступність Webhook.
Вважайте будь-яку перевірку `ok: false` блокером для перевірених транспорту й режиму,
перш ніж просити агента приєднатися. Використовуйте `openclaw googlemeet setup --json` для
скриптів або машиночитного виводу. Використовуйте `--transport chrome`,
`--transport chrome-node` або `--transport twilio`, щоб попередньо перевірити конкретний
транспорт до того, як агент спробує його використати.

Для Twilio завжди явно попередньо перевіряйте транспорт, коли транспорт за замовчуванням
— Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Це виявляє відсутнє підключення `voice-call`, облікові дані Twilio або недоступну
публічну Webhook-експозицію до того, як агент спробує набрати зустріч.

Приєднатися до зустрічі:

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

Створити нову зустріч і приєднатися до неї:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Створити лише URL без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це
  найбільш детермінований шлях, який не залежить від стану інтерфейсу браузера.
- Резервний шлях через браузер: використовується, коли облікових даних OAuth немає. OpenClaw використовує
  прив’язаний вузол Chrome, відкриває `https://meet.google.com/new`, чекає, доки Google
  перенаправить на справжню URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Цей шлях вимагає,
  щоб профіль Chrome OpenClaw на вузлі вже мав виконаний вхід у Google.
  Автоматизація браузера обробляє власний перший запит Meet щодо мікрофона; цей запит
  не вважається помилкою входу в Google.
  Потоки приєднання та створення також намагаються повторно використати наявну вкладку Meet, перш ніж відкривати
  нову. Зіставлення ігнорує нешкідливі рядки запиту URL, як-от `authuser`, тож
  повторна спроба агента має сфокусувати вже відкриту зустріч замість створення другої
  вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` за замовчуванням приєднується до нової зустрічі та
повертає `joined: true` плюс сесію приєднання. Щоб лише створити URL, використовуйте
`create --no-join` у CLI або передайте `"join": false` інструменту.

Або скажіть агенту: "Створи Google Meet, приєднайся до нього з голосом у реальному часі та надішли
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
не запускає двосторонній міст моделі реального часу, не потребує BlackHole або SoX
і не відповідатиме голосом у зустрічі. Приєднання Chrome у цьому режимі також уникають
надання OpenClaw дозволів на мікрофон/камеру та уникають шляху Meet **Використати
мікрофон**. Якщо Meet показує проміжний екран вибору аудіо, автоматизація пробує
шлях без мікрофона, а інакше повідомляє про ручну дію замість відкриття
локального мікрофона.

Під час сесій у реальному часі статус `google_meet` містить стан браузера й аудіомоста,
як-от `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, часові мітки останнього вводу/виводу,
лічильники байтів і закритий стан моста. Якщо з’являється безпечний запит сторінки Meet,
автоматизація браузера обробляє його, коли може. Вхід, допуск хостом і
запити дозволів браузера/ОС повідомляються як ручна дія з причиною й
повідомленням, яке агент має передати. Керовані сесії Chrome видають вступ або
тестову фразу лише після того, як стан браузера повідомить `inCall: true`; інакше статус повідомляє
`speechReady: false`, а спроба мовлення блокується замість удавання, що
агент говорив у зустріч.

Локальний Chrome приєднується через профіль браузера OpenClaw із виконаним входом. Режим реального часу
потребує `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для
чистого двостороннього аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного
пристрою BlackHole достатньо для першого smoke-тесту, але він може створювати відлуння.

### Локальний Gateway + Chrome у Parallels

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM
лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть
хост вузла у VM. Один раз увімкніть вбудований Plugin на VM, щоб вузол
оголошував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, провайдер реального часу
  і конфігурація Google Meet Plugin.
- Parallels macOS VM: OpenClaw CLI/хост вузла, Google Chrome, SoX, BlackHole 2ch
  і профіль Chrome із виконаним входом у Google.
- Не потрібно у VM: служба Gateway, конфігурація агента, ключ OpenAI/GPT або налаштування
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

Запустіть хост вузла у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це LAN IP і ви не використовуєте TLS, вузол відхиляє
відкритий WebSocket, якщо ви явно не дозволите його для цієї довіреної приватної мережі:

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
`openclaw.json`. `openclaw node install` зберігає його в середовищі LaunchAgent,
коли воно присутнє в команді встановлення.

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

Маршрутизуйте Meet через цей вузол на хості Gateway:

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

Для smoke-тесту однією командою, який створює або повторно використовує сесію, промовляє відому
фразу й друкує стан сесії:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання в реальному часі автоматизація браузера OpenClaw заповнює ім’я гостя, натискає
Приєднатися/Попросити приєднання та приймає перший вибір Meet "Використати мікрофон", коли цей
запит з’являється. Під час приєднання лише для спостереження або створення зустрічі лише через браузер вона
проходить той самий запит без мікрофона, коли такий вибір доступний.
Якщо в профілі браузера не виконано вхід, Meet очікує допуску хостом,
Chrome потребує дозволу на мікрофон/камеру для приєднання в реальному часі або Meet застряг
на запиті, який автоматизація не змогла розв’язати, результат join/test-speech повідомляє
`manualActionRequired: true` з `manualActionReason` і
`manualActionMessage`. Агенти мають припинити повторювати приєднання, повідомити саме це
повідомлення плюс поточні `browserUrl`/`browserTitle` і повторити спробу лише після того,
як ручну дію в браузері завершено.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає лише тоді, коли рівно один
підключений вузол оголошує як `googlemeet.chrome`, так і керування браузером. Якщо
підключено кілька придатних вузлів, установіть `chromeNode.node` як id вузла,
відображуване ім’я або віддалений IP.

Поширені перевірки помилок:

- `Configured Google Meet node ... is not usable: offline`: закріплений Node
  відомий Gateway, але недоступний. Агенти мають сприймати цей Node як
  діагностичний стан, а не як придатний хост Chrome, і повідомляти про блокер
  налаштування замість переходу на інший транспорт, якщо користувач не попросив
  про це.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  схваліть сполучення та переконайтеся, що у VM були виконані
  `openclaw plugins enable google-meet` і `openclaw plugins enable browser`.
  Також підтвердьте, що хост Gateway дозволяє обидві команди Node через
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: установіть `blackhole-2ch` на хості,
  який перевіряється, і перезавантажте його перед використанням локального аудіо
  Chrome.
- `BlackHole 2ch audio device not found on the node`: установіть
  `blackhole-2ch` у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера
  всередині VM або залиште `chrome.guestName` налаштованим для гостьового
  приєднання. Автоприєднання гостя використовує браузерну автоматизацію OpenClaw
  через проксі браузера Node; переконайтеся, що конфігурація браузера Node
  вказує на потрібний профіль, наприклад `browser.defaultProfile: "user"` або
  іменований профіль наявного сеансу.
- Дублікати вкладок Meet: залиште `chrome.reuseExistingTab: true` увімкненим.
  OpenClaw активує наявну вкладку для тієї самої URL-адреси Meet перед
  відкриттям нової, а створення зустрічі через браузер повторно використовує
  незавершену вкладку `https://meet.google.com/new` або вкладку запиту облікового
  запису Google перед відкриттям іншої.
- Немає аудіо: у Meet спрямуйте мікрофон/динамік через шлях віртуального
  аудіопристрою, який використовує OpenClaw; використовуйте окремі віртуальні
  пристрої або маршрутизацію у стилі Loopback для чистого дуплексного аудіо.

## Нотатки щодо встановлення

Типове налаштування Chrome realtime використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для аудіо. Plugin використовує явні команди
  пристрою CoreAudio для типового аудіомоста PCM16 24 кГц.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій
  `BlackHole 2ch`, через який Chrome/Meet може маршрутизувати аудіо.

OpenClaw не вбудовує і не розповсюджує жоден із цих пакетів. Документація
просить користувачів установлювати їх як залежності хоста через Homebrew. SoX
ліцензовано як `LGPL-2.0-only AND GPL-2.0-only`; BlackHole має ліцензію
GPL-3.0. Якщо ви створюєте інсталятор або пристрій, який постачається з
BlackHole разом з OpenClaw, перегляньте умови ліцензування BlackHole від
upstream або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet через керування браузером OpenClaw і
приєднується як профіль браузера OpenClaw із виконаним входом. На macOS Plugin
перед запуском перевіряє наявність `BlackHole 2ch`. Якщо налаштовано, він також
виконує команду перевірки справності аудіомоста та команду запуску перед
відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості
Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють на сполученому
Node, наприклад у Parallels macOS VM. Для локального Chrome виберіть профіль за
допомогою `browser.defaultProfile`; `chrome.browserProfile` передається хостам
`chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона й динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою
налаштування замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план набору, делегований Plugin Voice Call. Він не
аналізує сторінки Meet на наявність телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або вам потрібен запасний
варіант телефонного набору. Google Meet має надавати телефонний номер для
набору та PIN для зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

Увімкніть Plugin Voice Call на хості Gateway, а не на Node Chrome:

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
дозволяє не зберігати секрети в `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни
конфігурації Plugin не з’являються в уже запущеному процесі Gateway, доки він
не перезавантажиться.

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

OAuth є необов’язковим для створення посилання Meet, оскільки `googlemeet create`
може перейти на браузерну автоматизацію. Налаштуйте OAuth, коли вам потрібне
офіційне створення через API, визначення просторів або попередні перевірки Meet
Media API.

Доступ до Google Meet API використовує користувацький OAuth: створіть клієнт
Google Cloud OAuth, запросіть потрібні області доступу, авторизуйте обліковий
запис Google, а потім збережіть отриманий токен оновлення в конфігурації Plugin
Google Meet або надайте змінні середовища `OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання через Chrome. Транспорти Chrome і Chrome-node
все одно приєднуються через профіль Chrome із виконаним входом, BlackHole/SoX і
підключений Node, коли ви використовуєте участь через браузер. OAuth призначений
лише для офіційного шляху Google Meet API: створення просторів зустрічей,
визначення просторів і виконання попередніх перевірок Meet Media API.

### Створення облікових даних Google

У Google Cloud Console:

1. Створіть або виберіть проект Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проекту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** є найпростішим для організації Google Workspace.
   - **External** підходить для особистих/тестових налаштувань; доки застосунок
     перебуває в режимі Testing, додайте кожен обліковий запис Google, який
     авторизуватиме застосунок, як тестового користувача.
4. Додайте області доступу, які запитує OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Створіть ідентифікатор клієнта OAuth.
   - Тип застосунку: **Web application**.
   - Авторизований URI переспрямування:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Скопіюйте ідентифікатор клієнта та секрет клієнта.

`meetings.space.created` потрібен для Google Meet `spaces.create`.
`meetings.space.readonly` дає OpenClaw змогу визначати простори за URL-адресами
або кодами Meet. `meetings.conference.media.readonly` призначений для
попередньої перевірки Meet Media API та роботи з медіа; Google може вимагати
реєстрації в Developer Preview для фактичного використання Media API. Якщо вам
потрібні лише браузерні приєднання через Chrome, повністю пропустіть OAuth.

### Створення токена оновлення

Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, або передайте
їх як змінні середовища, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить конфігураційний блок `oauth` із токеном оновлення. Вона
використовує PKCE, localhost callback на
`http://localhost:8085/oauth2callback` і ручний процес копіювання/вставлення з
`--manual`.

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
в конфігурації. Якщо присутні і значення конфігурації, і значення середовища,
Plugin спершу використовує конфігурацію, а потім запасний варіант із середовища.

Згода OAuth включає створення просторів Meet, доступ на читання до просторів
Meet і доступ на читання до медіа конференцій Meet. Якщо ви автентифікувалися до
появи підтримки створення зустрічей, повторно запустіть
`openclaw googlemeet auth login --json`, щоб токен оновлення мав область доступу
`meetings.space.created`.

### Перевірка OAuth за допомогою doctor

Запустіть doctor OAuth, коли потрібна швидка перевірка справності без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує середовище виконання Chrome і не потребує підключеного Node
Chrome. Перевіряється, що конфігурація OAuth існує і що токен оновлення може
створити токен доступу. Звіт JSON містить лише поля стану, як-от `ok`,
`configured`, `tokenSource`, `expiresAt`, і повідомлення перевірок; він не
виводить токен доступу, токен оновлення або секрет клієнта.

Поширені результати:

| Перевірка            | Значення                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Наявні `oauth.clientId` разом з `oauth.refreshToken` або кешований токен доступу.       |
| `oauth-token`        | Кешований токен доступу досі чинний або токен оновлення створив новий токен доступу.   |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` визначила наявний простір Meet.                     |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий простір Meet.                  |

Щоб також довести ввімкнення Google Meet API та область доступу `spaces.create`,
запустіть перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює одноразову URL-адресу Meet. Використовуйте це, коли
потрібно підтвердити, що для проекту Google Cloud увімкнено Meet API і що
авторизований обліковий запис має область доступу `meetings.space.created`.

Щоб довести доступ на читання до наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` доводять доступ на читання до
наявного простору, до якого авторизований обліковий запис Google має доступ.
`403` від цих перевірок зазвичай означає, що Google Meet REST API вимкнено, у
токені оновлення зі згодою бракує потрібної області доступу або обліковий запис
Google не має доступу до цього простору Meet. Помилка токена оновлення означає,
що потрібно повторно виконати `openclaw googlemeet auth login --json` і зберегти
новий блок `oauth`.

Для браузерного запасного варіанта облікові дані OAuth не потрібні. У цьому
режимі автентифікація Google береться з профілю Chrome із виконаним входом на
вибраному Node, а не з конфігурації OpenClaw.

Ці змінні середовища приймаються як запасні варіанти:

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

З `--meeting` команди `artifacts` і `attendance` типово використовують найновіший запис конференції. Передайте `--all-conference-records`, коли потрібні всі збережені записи для цієї зустрічі.

Пошук у календарі може визначити URL зустрічі з Google Calendar перед читанням артефактів Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` шукає в сьогоднішньому календарі `primary` подію Calendar із посиланням Google Meet. Використовуйте `--event <query>` для пошуку відповідного тексту події та `--calendar <id>` для неосновного календаря. Пошук у календарі потребує нового входу OAuth, який включає readonly-область подій Calendar. `calendar-events` попередньо показує відповідні події Meet і позначає подію, яку виберуть `latest`, `artifacts`, `attendance` або `export`.

Якщо ви вже знаєте ідентифікатор запису конференції, зверніться до нього напряму:

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

`artifacts` повертає метадані запису конференції, а також метадані ресурсів учасників, записів, транскрипту, структурованих записів транскрипту та smart-note, коли Google надає їх для зустрічі. Використовуйте `--no-transcript-entries`, щоб пропустити пошук записів для великих зустрічей. `attendance` розгортає учасників у рядки сеансів учасників із часом першої й останньої появи, загальною тривалістю сеансу, прапорцями запізнення/раннього виходу та дубльованими ресурсами учасників, об’єднаними за користувачем, що ввійшов, або відображуваним ім’ям. Передайте `--no-merge-duplicates`, щоб зберегти необроблені ресурси учасників окремо, `--late-after-minutes`, щоб налаштувати виявлення запізнення, і `--early-before-minutes`, щоб налаштувати виявлення раннього виходу.

`export` записує папку, що містить `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`. `manifest.json` записує вибраний вхід, параметри експорту, записи конференції, вихідні файли, кількості, джерело токена, подію Calendar, якщо вона використовувалася, і будь-які попередження про часткове отримання. Передайте `--zip`, щоб також записати переносний архів поруч із папкою. Передайте `--include-doc-bodies`, щоб експортувати текст пов’язаних транскриптів і smart-note Google Docs через Google Drive `files.export`; для цього потрібен новий вхід OAuth, який включає readonly-область Drive Meet. Без `--include-doc-bodies` експорти містять лише метадані Meet і структуровані записи транскрипту. Якщо Google повертає часткову помилку артефакту, наприклад помилку списку smart-note, запису транскрипту або тіла документа Drive, зведення та маніфест зберігають попередження замість того, щоб провалити весь експорт. Використовуйте `--dry-run`, щоб отримати ті самі дані артефактів/відвідуваності й вивести JSON маніфесту без створення папки або ZIP. Це корисно перед записом великого експорту або коли агенту потрібні лише кількості, вибрані записи та попередження.

Агенти також можуть створити той самий пакет через інструмент `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Установіть `"dryRun": true`, щоб повернути лише маніфест експорту й пропустити запис файлів.

Запустіть захищену live-smoke-перевірку на реальній збереженій зустрічі:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Середовище live-smoke:

- `OPENCLAW_LIVE_TEST=1` вмикає захищені live-тести.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` вказує на збережений URL Meet, код або `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID` надає ідентифікатор клієнта OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN` надає refresh token.
- Необов’язково: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` і `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` використовують ті самі резервні імена без префікса `OPENCLAW_`.

Базова live-smoke-перевірка артефактів/відвідуваності потребує `https://www.googleapis.com/auth/meetings.space.readonly` і `https://www.googleapis.com/auth/meetings.conference.media.readonly`. Пошук у календарі потребує `https://www.googleapis.com/auth/calendar.events.readonly`. Експорт тіла документа Drive потребує `https://www.googleapis.com/auth/drive.meet.readonly`.

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда виводить нові `meeting uri`, джерело та сеанс приєднання. З обліковими даними OAuth вона використовує офіційний Google Meet API. Без облікових даних OAuth вона використовує як резервний варіант браузерний профіль із виконаним входом у закріпленому Chrome-вузлі. Агенти можуть використовувати інструмент `google_meet` з `action: "create"`, щоб створити зустріч і приєднатися до неї за один крок. Для створення лише URL передайте `"join": false`.

Приклад JSON-виводу з браузерного резервного варіанта:

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

Якщо браузерний резервний варіант натрапляє на вхід Google або блокування дозволів Meet до того, як зможе створити URL, метод Gateway повертає невдалу відповідь, а інструмент `google_meet` повертає структуровані деталі замість простого рядка:

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

Коли агент бачить `manualActionRequired: true`, він має повідомити `manualActionMessage` разом із контекстом браузерного вузла/вкладки та припинити відкривати нові вкладки Meet, доки оператор не завершить крок у браузері.

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

Створення Meet типово приєднується до зустрічі. Транспорт Chrome або Chrome-node все одно потребує профілю Google Chrome із виконаним входом, щоб приєднатися через браузер. Якщо профіль вийшов з облікового запису, OpenClaw повідомляє `manualActionRequired: true` або помилку браузерного резервного варіанта та просить оператора завершити вхід Google перед повторною спробою.

Установіть `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud-проєкт, OAuth-принципал і учасники зустрічі зареєстровані в Google Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Загальний realtime-шлях Chrome потребує лише ввімкненого плагіна, BlackHole, SoX і ключа backend realtime-провайдера голосу. OpenAI є типовим; установіть `realtime.provider: "google"`, щоб використовувати Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Установіть конфігурацію плагіна в `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: необов’язковий ідентифікатор/ім’я/IP вузла для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на екрані гостя Meet без входу
- `chrome.autoJoin: true`: найкраща спроба заповнення імені гостя та натискання Join Now через браузерну автоматизацію OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить про стан in-call, перш ніж спрацює realtime-вступ
- `chrome.audioFormat: "pcm16-24khz"`: аудіоформат пари команд. Використовуйте `"g711-ulaw-8khz"` лише для застарілих/кастомних пар команд, які все ще виводять телефонне аудіо.
- `chrome.audioInputCommand`: команда SoX, що читає з CoreAudio `BlackHole 2ch` і записує аудіо у форматі `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX, що читає аудіо у форматі `chrome.audioFormat` і записує в CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: необов’язкова команда локального мікрофона, що записує знаковий 16-бітний little-endian mono PCM для виявлення людського втручання, поки відтворення асистента активне. Наразі це застосовується до розміщеного Gateway мосту пар команд `chrome`.
- `chrome.bargeInRmsThreshold: 650`: RMS-рівень, який зараховується як людське переривання на `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: піковий рівень, який зараховується як людське переривання на `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: мінімальна затримка між повторними очищеннями людського переривання
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді з `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли realtime-міст підключається; установіть значення `""`, щоб приєднуватися мовчки
- `realtime.agentId`: необов’язковий ідентифікатор агента OpenClaw для `openclaw_agent_consult`; типово `main`

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
    bargeInInputCommand: [
      "sox",
      "-q",
      "-t",
      "coreaudio",
      "External Microphone",
      "-r",
      "24000",
      "-c",
      "1",
      "-b",
      "16",
      "-e",
      "signed-integer",
      "-t",
      "raw",
      "-",
    ],
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

`voiceCall.enabled` за замовчуванням має значення `true`; із транспортом Twilio він делегує фактичний виклик PSTN, DTMF і вступне привітання Plugin Voice Call. Voice Call відтворює послідовність DTMF перед відкриттям потоку медіа в реальному часі, а потім використовує збережений вступний текст як початкове привітання в реальному часі. Якщо `voice-call` не ввімкнено, Google Meet усе ще може перевірити й записати план набору, але не може здійснити виклик Twilio.

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

Використовуйте `transport: "chrome"`, коли Chrome працює на хості Gateway. Використовуйте `transport: "chrome-node"`, коли Chrome працює на спареному Node, наприклад Parallels VM. В обох випадках модель реального часу й `openclaw_agent_consult` працюють на хості Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сесії або перевірити ID сесії. Використовуйте `action: "speak"` із `sessionId` і `message`, щоб агент реального часу заговорив негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сесію, запустити відому фразу й повернути стан `inCall`, коли хост Chrome може про нього повідомити. `test_speech` завжди примусово встановлює `mode: "realtime"` і завершується помилкою, якщо його просять працювати в `mode: "transcribe"`, бо сесії лише для спостереження навмисно не можуть виводити мовлення. Його результат `speechOutputVerified` базується на збільшенні байтів аудіовиходу реального часу під час цього тестового виклику, тому повторно використана сесія зі старішим аудіо не зараховується як свіжа успішна перевірка мовлення. Використовуйте `action: "leave"`, щоб позначити сесію завершеною.

`status` містить стан Chrome, коли він доступний:

- `inCall`: Chrome, схоже, перебуває всередині виклику Meet
- `micMuted`: приблизний стан мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профілю браузера потрібен ручний вхід, допуск від хоста Meet, дозволи або ремонт керування браузером, перш ніж мовлення зможе працювати
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: чи дозволене кероване мовлення Chrome зараз. `speechReady: false` означає, що OpenClaw не надіслав вступну/тестову фразу в аудіоміст.
- `providerConnected` / `realtimeReady`: стан голосового мосту реального часу
- `lastInputAt` / `lastOutputAt`: останнє аудіо, побачене з мосту або надіслане до нього
- `lastSuppressedInputAt` / `suppressedInputBytes`: вхід loopback, проігнорований, поки активне відтворення асистента

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Консультація агента реального часу

Режим Chrome у реальному часі оптимізований для живого голосового циклу. Голосовий провайдер реального часу чує аудіо зустрічі й говорить через налаштований аудіоміст. Коли моделі реального часу потрібні глибші міркування, актуальна інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw у фоновому режимі з контекстом нещодавньої транскрипції зустрічі та повертає стислу усну відповідь у голосову сесію реального часу. Голосова модель потім може промовити цю відповідь назад у зустріч. Він використовує той самий спільний інструмент консультації реального часу, що й Voice Call.

За замовчуванням консультації виконуються для агента `main`. Налаштуйте `realtime.agentId`, коли канал Meet має консультуватися з окремим робочим простором агента OpenClaw, стандартними параметрами моделі, політикою інструментів, пам’яттю та історією сесій.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: відкрити інструмент консультації та обмежити звичайного агента до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`.
- `owner`: відкрити інструмент консультації та дозволити звичайному агенту використовувати стандартну політику інструментів агента.
- `none`: не відкривати інструмент консультації для голосової моделі реального часу.

Ключ сесії консультації обмежений кожною сесією Meet, тому подальші виклики консультації можуть повторно використовувати попередній контекст консультації під час тієї самої зустрічі.

Щоб примусово запустити усну перевірку готовності після того, як Chrome повністю приєднався до виклику:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повної перевірки приєднання та мовлення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Контрольний список живого тесту

Використовуйте цю послідовність, перш ніж передавати зустріч агенту без нагляду:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Очікуваний стан Chrome-node:

- `googlemeet setup` повністю зелений.
- `googlemeet setup` містить `chrome-node-connected`, коли Chrome-node є стандартним транспортом або Node закріплено.
- `nodes status` показує, що вибраний Node підключений.
- Вибраний Node оголошує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до виклику, а `test-speech` повертає стан Chrome із `inCall: true`.

Для віддаленого хоста Chrome, наприклад Parallels macOS VM, це найкоротша безпечна перевірка після оновлення Gateway або VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Це підтверджує, що Plugin Gateway завантажено, Node VM підключений із поточним токеном, а аудіоміст Meet доступний, перш ніж агент відкриє реальну вкладку зустрічі.

Для перевірки Twilio використовуйте зустріч, яка надає телефонні дані для набору:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Очікуваний стан Twilio:

- `googlemeet setup` містить зелені перевірки `twilio-voice-call-plugin`, `twilio-voice-call-credentials` і `twilio-voice-call-webhook`.
- `voicecall` доступний у CLI після перезавантаження Gateway.
- Повернена сесія має `transport: "twilio"` і `twilio.voiceCallId`.
- `openclaw logs --follow` показує, що DTMF TwiML надано перед TwiML реального часу, а потім міст реального часу з поставленим у чергу початковим привітанням.
- `googlemeet leave <sessionId>` завершує делегований голосовий виклик.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно редагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway. Запущений агент бачить лише інструменти Plugin, зареєстровані поточним процесом Gateway.

### Немає підключеного Node з підтримкою Google Meet

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

Node має бути підключений і показувати `googlemeet.chrome` плюс `browser.proxy`. Конфігурація Gateway має дозволяти ці команди Node:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Якщо `googlemeet setup` не проходить `chrome-node-connected` або журнал Gateway повідомляє `gateway token mismatch`, перевстановіть або перезапустіть Node із поточним токеном Gateway. Для LAN Gateway це зазвичай означає:

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

Запустіть `googlemeet test-speech` і перевірте повернений стан Chrome. Якщо він повідомляє `manualActionRequired: true`, покажіть `manualActionMessage` оператору та припиніть повторні спроби, доки дія в браузері не буде завершена.

Поширені ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису хоста Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’явиться нативний запит дозволу Chrome.
- Закрити або відремонтувати завислий діалог дозволів Meet.

Не повідомляйте "not signed in" лише тому, що Meet показує "Do you want people to hear you in the meeting?" Це проміжний екран вибору аудіо Meet; OpenClaw натискає **Use microphone** через автоматизацію браузера, коли це доступно, і продовжує чекати реального стану зустрічі. Для резервного режиму браузера лише для створення OpenClaw може натиснути **Continue without microphone**, бо створення URL не потребує аудіошляху реального часу.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує endpoint Google Meet API `spaces.create`, коли налаштовано облікові дані OAuth. Без облікових даних OAuth він переходить до резервного браузера закріпленого Node Chrome. Перевірте:

- Для створення через API: `oauth.clientId` і `oauth.refreshToken` налаштовані або наявні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було видано після додавання підтримки створення. Старішим токенам може бракувати scope `meetings.space.created`; повторно виконайте `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для резервного браузера: `defaultTransport: "chrome-node"` і `chromeNode.node` вказують на підключений Node із `browser.proxy` і `googlemeet.chrome`.
- Для резервного браузера: профіль OpenClaw Chrome на цьому Node увійшов у Google і може відкрити `https://meet.google.com/new`.
- Для резервного браузера: повторні спроби повторно використовують наявну вкладку `https://meet.google.com/new` або запит облікового запису Google перед відкриттям нової вкладки. Якщо агент очікує надто довго, повторіть виклик інструмента замість ручного відкриття іншої вкладки Meet.
- Для резервного браузера: якщо інструмент повертає `manualActionRequired: true`, використовуйте повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і `manualActionMessage`, щоб скерувати оператора. Не повторюйте в циклі, доки ця дія не буде завершена.
- Для резервного браузера: якщо Meet показує "Do you want people to hear you in the meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для резервного режиму лише створення, **Continue without microphone** через автоматизацію браузера й продовжити чекати на згенерований URL Meet. Якщо він не може, помилка має згадувати `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте шлях реального часу:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "realtime"` для прослуховування/зворотного мовлення. `mode: "transcribe"` навмисно
не запускає дуплексний голосовий міст реального часу. `googlemeet test-speech`
завжди перевіряє шлях реального часу й повідомляє, чи були байти виводу моста
зафіксовані для цього виклику. Якщо `speechOutputVerified` має значення false, а
`speechOutputTimedOut` має значення true, провайдер реального часу міг прийняти
висловлювання, але OpenClaw не побачив, що нові байти виводу дійшли до аудіомоста
Chrome.

Також перевірте:

- Ключ провайдера реального часу доступний на хості Gateway, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `sox` існує на хості Chrome.
- Мікрофон і динамік Meet маршрутизовано через віртуальний аудіошлях, який
  використовує OpenClaw.

`googlemeet doctor [session-id]` виводить сеанс, вузол, стан у дзвінку,
причину ручної дії, підключення провайдера реального часу, `realtimeReady`, активність
аудіовходу/аудіовиходу, останні часові позначки аудіо, лічильники байтів і URL браузера.
Використовуйте `googlemeet status [session-id] --json`, коли потрібен необроблений JSON. Використовуйте
`googlemeet doctor --oauth`, коли потрібно перевірити оновлення Google Meet OAuth
без розкриття токенів; додайте `--meeting` або `--create-space`, коли також потрібне
підтвердження Google Meet API.

Якщо агент завершився за тайм-аутом і ви бачите, що вкладка Meet уже відкрита, перевірте цю вкладку,
не відкриваючи нову:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує та перевіряє
наявну вкладку Meet для вибраного транспорту. З `chrome` вона використовує локальне
керування браузером через Gateway; з `chrome-node` вона використовує налаштований
вузол Chrome. Вона не відкриває нову вкладку й не створює новий сеанс; вона повідомляє про
поточний блокер, наприклад вхід, допуск, дозволи або стан вибору аудіо.
Команда CLI звертається до налаштованого Gateway, тому Gateway має бути запущений;
`chrome-node` також потребує підключеного вузла Chrome.

### Перевірки налаштування Twilio не проходять

`twilio-voice-call-plugin` завершується з помилкою, коли `voice-call` не дозволений або не ввімкнений.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` завершується з помилкою, коли у бекенді Twilio бракує SID облікового запису,
токена автентифікації або номера абонента, що телефонує. Задайте їх на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` завершується з помилкою, коли `voice-call` не має публічної експозиції Webhook,
або коли `publicUrl` вказує на loopback чи простір приватної мережі.
Задайте для `plugins.entries.voice-call.config.publicUrl` URL публічного провайдера або
налаштуйте експозицію тунелю/Tailscale для `voice-call`.

Loopback і приватні URL не є дійсними для callback-викликів операторів зв’язку. Не використовуйте
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` або `fd00::/8` як `publicUrl`.

Для стабільного публічного URL:

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

Для локальної розробки використовуйте тунель або експозицію Tailscale замість приватного
URL хоста:

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

Додавайте `--yes` лише тоді, коли навмисно хочете здійснити живий вихідний
дзвінок зі сповіщенням:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Дзвінок Twilio починається, але ніколи не входить у зустріч

Переконайтеся, що подія Meet надає дані телефонного підключення. Передайте точний номер
для дозвону та PIN або власну послідовність DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкові `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза
перед введенням PIN.

Якщо телефонний дзвінок створено, але список учасників Meet ніколи не показує учасника
телефонного підключення:

- Виконайте `openclaw googlemeet doctor <session-id>`, щоб підтвердити делегований Twilio
  ID дзвінка, чи було поставлено DTMF у чергу та чи було запитано вступне привітання.
- Виконайте `openclaw voicecall status --call-id <id>` і переконайтеся, що дзвінок досі
  активний.
- Виконайте `openclaw voicecall tail` і перевірте, що Webhook Twilio надходять до
  Gateway.
- Виконайте `openclaw logs --follow` і знайдіть послідовність Twilio Meet: Google
  Meet делегує приєднання, Voice Call зберігає DTMF TwiML перед підключенням, віддає
  цей початковий TwiML, потім віддає TwiML реального часу й запускає міст реального часу
  з `initialGreeting=queued`.
- Повторно виконайте `openclaw googlemeet setup --transport twilio`; зелена перевірка налаштування
  обов’язкова, але не доводить, що послідовність PIN зустрічі правильна.
- Переконайтеся, що номер для дозвону належить до того самого запрошення Meet і регіону, що й
  PIN.
- Збільште початкові паузи в `--dtmf-sequence`, якщо Meet відповідає повільно, наприклад
  `wwww123456#`.
- Якщо учасник приєднується, але ви не чуєте привітання, перевірте
  `openclaw logs --follow` на TwiML реального часу, запуск моста реального часу та
  `initialGreeting=queued`. Привітання генерується з початкового
  повідомлення `voicecall.start` після підключення моста реального часу.

Якщо Webhook не надходять, спершу налагодьте Plugin Voice Call: провайдер має
досягати `plugins.entries.voice-call.config.publicUrl` або налаштованого тунелю.
Див. [усунення несправностей голосових викликів](/uk/plugins/voice-call#troubleshooting).

## Примітки

Офіційний медіа API Google Meet орієнтований на приймання, тому для мовлення в дзвінку Meet
все одно потрібен шлях учасника. Цей Plugin робить цю межу видимою:
Chrome обробляє участь браузера та локальну маршрутизацію аудіо; Twilio обробляє
участь через телефонний дозвін.

Режим реального часу Chrome потребує `BlackHole 2ch` плюс одне з такого:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw володіє
  мостом моделі реального часу й передає аудіо у `chrome.audioFormat` між цими
  командами та вибраним голосовим провайдером реального часу. Типовий шлях Chrome —
  24 кГц PCM16; 8 кГц G.711 mu-law залишається доступним для застарілих пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда моста володіє всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може повертати звук інших учасників назад у дзвінок.

З мостом Chrome на основі пари команд `chrome.bargeInInputCommand` може слухати
окремий локальний мікрофон і очищати відтворення асистента, коли людина починає
говорити. Це зберігає пріоритет людського мовлення над виводом асистента, навіть коли спільний
вхід BlackHole loopback тимчасово приглушено під час відтворення асистента.
Як і `chrome.audioInputCommand` та `chrome.audioOutputCommand`, це
локальна команда, налаштована оператором. Використовуйте явний довірений шлях команди або
список аргументів і не вказуйте на скрипти з недовірених розташувань.

`googlemeet speak` запускає активний аудіоміст реального часу для сеансу Chrome.
`googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих
через Plugin Voice Call, `leave` також завершує базовий голосовий дзвінок.

## Пов’язане

- [Plugin голосових викликів](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення Plugin](/uk/plugins/building-plugins)
