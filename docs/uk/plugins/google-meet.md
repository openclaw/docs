---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до виклику Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий виклик Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Плагін Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio з типовими налаштуваннями голосу в реальному часі'
title: Плагін Google Meet
x-i18n:
    generated_at: "2026-04-24T21:43:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3075b803b04001a7a205215d2606087a38ce75cbde1ab0a44f61f8d5c88ccf78
    source_path: plugins/google-meet.md
    workflow: 15
---

Підтримка учасника Google Meet для OpenClaw — Plugin є навмисно явним за дизайном:

- Він приєднується лише до явного URL `https://meet.google.com/...`.
- Він може створити новий простір Meet через API Google Meet, а потім приєднатися за поверненим URL.
- Голос `realtime` є режимом за замовчуванням.
- Голос у режимі реального часу може повертатися до повного агента OpenClaw, коли потрібні глибше міркування або інструменти.
- Агенти обирають поведінку приєднання за допомогою `mode`: використовуйте `realtime` для живого прослуховування/зворотного мовлення або `transcribe`, щоб приєднатися/керувати браузером без голосового моста режиму реального часу.
- Автентифікація починається як персональний Google OAuth або вже виконаний вхід у профіль Chrome.
- Автоматичного оголошення згоди немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на підключеному хості Node.
- Twilio приймає номер для дозвону та необов’язкову послідовність PIN або DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших робочих процесів телеконференцій агента.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте бекенд-провайдера голосу в режимі реального часу. OpenAI використовується за замовчуванням; Google Gemini Live також працює з `realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` установлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор Homebrew вимагає перезавантаження, перш ніж macOS зробить пристрій доступним:

```bash
sudo reboot
```

Після перезавантаження перевірте обидві складові:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
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

Вивід налаштування призначений для читання агентом. Він повідомляє про профіль Chrome, аудіоміст, прив’язку до Node, відкладене вступне повідомлення режиму реального часу, а також, коли налаштовано делегування Twilio, чи готові Plugin `voice-call` і облікові дані Twilio. Вважайте будь-яку перевірку з `ok: false` блокувальною, перш ніж просити агента приєднатися.
Використовуйте `openclaw googlemeet setup --json` для скриптів або машинозчитуваного виводу.

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

Створіть нову зустріч, а потім приєднайтеся до неї:

```bash
openclaw googlemeet create
openclaw googlemeet join https://meet.google.com/new-abcd-xyz --transport chrome-node
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це найдетермінованіший шлях, який не залежить від стану інтерфейсу браузера.
- Резервний варіант через браузер: використовується, коли облікові дані OAuth відсутні. OpenClaw використовує закріплений Chrome Node, відкриває `https://meet.google.com/new`, чекає, поки Google перенаправить на реальний URL із кодом зустрічі, а потім повертає цей URL. Цей шлях вимагає, щоб профіль OpenClaw Chrome на Node уже мав виконаний вхід у Google.

Вивід команди містить поле `source` (`api` або `browser`), щоб агенти могли пояснити, який шлях було використано.

Або скажіть агенту: "Створи Google Meet, приєднайся до нього з голосом у режимі реального часу та надішли мені посилання". Агент має викликати `google_meet` з `action: "create"`, скопіювати повернений `meetingUri`, а потім викликати `google_meet` з `action: "join"` і цим URL.

```json
{
  "action": "create"
}
```

```json
{
  "action": "join",
  "url": "https://meet.google.com/new-abcd-xyz",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Для приєднання лише зі спостереженням/керуванням браузером установіть `"mode": "transcribe"`. Це не запускає міст дуплексної моделі режиму реального часу, тому він не буде відповідати голосом у зустрічі.

Chrome приєднується як профіль Chrome, у якому виконано вхід. У Meet виберіть `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф на кшталт Loopback; одного пристрою BlackHole достатньо для першого smoke-тесту, але може бути луна.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть хост Node у VM. Один раз увімкніть у VM вбудований Plugin, щоб Node оголошував команду Chrome:

Що де запускається:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, провайдер режиму реального часу та конфігурація Plugin Google Meet.
- macOS VM у Parallels: OpenClaw CLI/хост Node, Google Chrome, SoX, BlackHole 2ch і профіль Chrome з виконаним входом у Google.
- Не потрібно у VM: сервіс Gateway, конфігурація агента, ключ OpenAI/GPT або налаштування провайдера моделі.

Установіть залежності у VM:

```bash
brew install blackhole-2ch sox
```

Перезавантажте VM після встановлення BlackHole, щоб macOS зробила `BlackHole 2ch` доступним:

```bash
sudo reboot
```

Після перезавантаження переконайтеся, що VM бачить аудіопристрій і команди SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Установіть або оновіть OpenClaw у VM, а потім увімкніть там вбудований Plugin:

```bash
openclaw plugins enable google-meet
```

Запустіть хост Node у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` є LAN IP і ви не використовуєте TLS, Node відхилить незашифрований WebSocket, якщо ви явно не дозволите це для цієї довіреної приватної мережі:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це середовище процесу, а не параметр `openclaw.json`. `openclaw node install` зберігає його в середовищі LaunchAgent, коли воно присутнє в команді встановлення.

Схваліть Node з хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить Node і що він оголошує як `googlemeet.chrome`, так і можливість браузера/`browser.proxy`:

```bash
openclaw nodes status
```

Спрямуйте Meet через цей Node на хості Gateway:

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

Тепер приєднуйтеся звичайним способом із хоста Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

або попросіть агента використати інструмент `google_meet` з `transport: "chrome-node"`.

Для smoke-тесту однією командою, який створює або повторно використовує сесію, промовляє відому фразу та виводить стан сесії:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Якщо в профілі браузера не виконано вхід, Meet очікує допуску від організатора або Chrome потребує дозволу на мікрофон/камеру, результат join/test-speech повідомляє `manualActionRequired: true` разом із `manualActionReason` і `manualActionMessage`. Агенти повинні припинити повторні спроби приєднання, повідомити оператору це повідомлення та повторити спробу лише після завершення ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично обирає Node лише тоді, коли рівно один підключений Node оголошує і `googlemeet.chrome`, і керування браузером. Якщо підключено кілька придатних Node, установіть `chromeNode.node` в ідентифікатор Node, відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM, схваліть сполучення та переконайтеся, що у VM було виконано `openclaw plugins enable google-meet` і `openclaw plugins enable browser`. Також підтвердьте, що хост Gateway дозволяє обидві команди Node через `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch` у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або залиште `chrome.guestName` увімкненим для гостьового приєднання. Автоприєднання гостя використовує автоматизацію браузера OpenClaw через проксі браузера Node; переконайтеся, що конфігурація браузера Node вказує на потрібний вам профіль, наприклад `browser.defaultProfile: "user"` або іменований профіль наявної сесії.
- Дубльовані вкладки Meet: залишайте `chrome.reuseExistingTab: true` увімкненим. OpenClaw активує наявну вкладку для того самого URL Meet перед відкриттям нової.
- Немає аудіо: у Meet спрямовуйте мікрофон і динамік через шлях віртуального аудіопристрою, який використовує OpenClaw; для чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або маршрутизацію на кшталт Loopback.

## Примітки щодо встановлення

Типовий режим реального часу для Chrome використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для роботи з аудіо. Plugin використовує її команди `rec` і `play` для типового аудіомоста G.711 mu-law 8 кГц.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`, через який можна маршрутизувати Chrome/Meet.

OpenClaw не постачає й не розповсюджує жоден із цих пакетів. У документації користувачам пропонується встановлювати їх як залежності хоста через Homebrew. SoX ліцензовано як `LGPL-2.0-only AND GPL-2.0-only`; BlackHole — GPL-3.0. Якщо ви збираєте інсталятор або appliance, що постачає BlackHole разом з OpenClaw, перегляньте умови ліцензування BlackHole в джерелі або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL Meet у Google Chrome і приєднується як профіль Chrome, у якому виконано вхід. У macOS Plugin перед запуском перевіряє наявність `BlackHole 2ch`. Якщо налаштовано, він також запускає команду перевірки стану аудіомоста та команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють на підключеному Node, наприклад у macOS VM Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона та динаміка Chrome через локальний аудіоміст OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершиться помилкою налаштування замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план набору, делегований Plugin Voice Call. Він не аналізує сторінки Meet у пошуку телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або коли вам потрібен резервний варіант через телефонний дозвін. Google Meet має надавати номер для телефонного підключення та PIN для зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

Увімкніть Plugin Voice Call на хості Gateway, а не на Node із Chrome:

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

Надайте облікові дані Twilio через середовище або конфігурацію. Середовище дозволяє не зберігати секрети в `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни конфігурації Plugin не з’являються у вже запущеному процесі Gateway, доки він не буде перезавантажений.

Потім перевірте:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Коли делегування Twilio підключено, `googlemeet setup` містить успішні перевірки `twilio-voice-call-plugin` і `twilio-voice-call-credentials`.

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

OAuth є необов’язковим для створення посилання Meet, оскільки `googlemeet create` може перейти до резервного варіанта з автоматизацією браузера. Налаштуйте OAuth, якщо вам потрібні офіційне створення через API, розв’язання простору або перевірки перед запуском через Meet Media API.

Доступ до API Google Meet спочатку використовує персональний OAuth client. Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` із токеном оновлення. Вона використовує PKCE, локальний callback на `http://localhost:8085/oauth2callback` і ручний сценарій копіювання/вставлення з `--manual`.

Згода OAuth включає створення просторів Meet, доступ на читання простору Meet і доступ на читання медіаданих конференції Meet. Якщо ви проходили автентифікацію до появи підтримки створення зустрічей, повторно виконайте `openclaw googlemeet auth login --json`, щоб токен оновлення мав область дії `meetings.space.created`.

Для резервного варіанта через браузер облікові дані OAuth не потрібні. У цьому режимі автентифікація Google походить із профілю Chrome із виконаним входом на вибраному Node, а не з конфігурації OpenClaw.

Як резервні варіанти приймаються такі змінні середовища:

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

Запустіть попередню перевірку перед роботою з медіаданими:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда виводить новий `meeting uri` і джерело. За наявності облікових даних OAuth вона використовує офіційний API Google Meet. Без облікових даних OAuth вона використовує профіль браузера із виконаним входом на закріпленому Chrome Node як резервний варіант. Агенти можуть використовувати інструмент `google_meet` з `action: "create"` для створення зустрічі, а потім викликати `action: "join"` з поверненим `meetingUri`.

Приклад виводу JSON із резервного варіанта через браузер:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  }
}
```

Приклад виводу JSON зі створення через API:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  }
}
```

Створення Meet лише створює або виявляє URL зустрічі. Транспорт Chrome або Chrome-node усе ще потребує профілю Google Chrome із виконаним входом, щоб приєднатися через браузер. Якщо в профілі виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або помилку резервного варіанта через браузер і просить оператора завершити вхід у Google перед повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш проєкт Cloud, OAuth principal і учасники зустрічі зареєстровані в Google Workspace Developer Preview Program для медіа-API Meet.

## Конфігурація

Для поширеного шляху Chrome у режимі реального часу потрібні лише ввімкнений Plugin, BlackHole, SoX і ключ бекенд-провайдера голосу в режимі реального часу. OpenAI використовується за замовчуванням; установіть `realtime.provider: "google"`, щоб використовувати Google Gemini Live:

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
- `chromeNode.node`: необов’язковий id/ім’я/IP Node для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, яке використовується на екрані гостя Meet без входу
- `chrome.autoJoin: true`: найкраща можлива спроба заповнення імені гостя й натискання Join Now через автоматизацію браузера OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet не повідомить про вхід у виклик, перш ніж буде запущено вступ у режимі реального часу
- `chrome.audioInputCommand`: команда SoX `rec`, яка записує аудіо G.711 mu-law 8 кГц у stdout
- `chrome.audioOutputCommand`: команда SoX `play`, яка читає аудіо G.711 mu-law 8 кГц зі stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли підключається міст режиму реального часу; установіть `""`, щоб приєднуватися беззвучно

Необов’язкові перевизначення:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
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

`voiceCall.enabled` за замовчуванням має значення `true`; із транспортом Twilio він делегує фактичний виклик PSTN і DTMF Plugin `Voice Call`. Якщо `voice-call` не ввімкнено, Google Meet усе ще може перевіряти й записувати план набору, але не може виконати виклик Twilio.

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

Використовуйте `transport: "chrome"`, коли Chrome працює на хості Gateway. Використовуйте `transport: "chrome-node"`, коли Chrome працює на підключеному Node, наприклад у Parallels VM. В обох випадках модель режиму реального часу та `openclaw_agent_consult` працюють на хості Gateway, тож облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сесії або перевірити id сесії. Використовуйте `action: "speak"` із `sessionId` і `message`, щоб агент режиму реального часу негайно заговорив. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сесію, запустити відому фразу й повернути стан `inCall`, коли хост Chrome може про нього повідомити. Використовуйте `action: "leave"`, щоб позначити завершення сесії.

`status` містить стан Chrome, коли він доступний:

- `inCall`: схоже, що Chrome перебуває всередині виклику Meet
- `micMuted`: найкраща можлива оцінка стану мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профіль браузера потребує ручного входу, допуску організатора Meet, дозволів або відновлення керування браузером, перш ніж мовлення зможе працювати
- `providerConnected` / `realtimeReady`: стан голосового моста режиму реального часу
- `lastInputAt` / `lastOutputAt`: останнє аудіо, отримане мостом або надіслане до нього

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Консультація агента режиму реального часу

Режим Chrome у режимі реального часу оптимізовано для живого голосового циклу. Провайдер голосу режиму реального часу чує аудіо зустрічі й говорить через налаштований аудіоміст. Коли моделі режиму реального часу потрібні глибші міркування, актуальна інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw у фоновому режимі з контекстом нещодавньої розшифровки зустрічі та повертає стислу усну відповідь до голосової сесії режиму реального часу. Потім голосова модель може озвучити цю відповідь назад у зустріч.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: показувати інструмент консультації та обмежувати звичайного агента інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`.
- `owner`: показувати інструмент консультації й дозволяти звичайному агенту використовувати нормальну політику інструментів агента.
- `none`: не показувати інструмент консультації моделі голосу режиму реального часу.

Ключ сесії консультації має область дії в межах кожної сесії Meet, тож подальші виклики консультації можуть повторно використовувати попередній контекст консультації під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднався до виклику:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повного smoke-тесту приєднання й мовлення:

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
- `nodes status` показує, що вибраний Node підключено.
- Вибраний Node оголошує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до виклику, а `test-speech` повертає стан Chrome з `inCall: true`.

Для smoke-тесту Twilio використовуйте зустріч, яка показує дані для телефонного підключення:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Очікуваний стан Twilio:

- `googlemeet setup` містить зелені перевірки `twilio-voice-call-plugin` і `twilio-voice-call-credentials`.
- `voicecall` доступний у CLI після перезавантаження Gateway.
- Повернена сесія має `transport: "twilio"` і `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` завершує делегований голосовий виклик.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно відредагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway.
Запущений агент бачить лише інструменти Plugin, зареєстровані поточним процесом Gateway.

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

Node має бути підключеним і містити `googlemeet.chrome` та `browser.proxy`.
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

### Браузер відкривається, але агент не може приєднатися

Запустіть `googlemeet test-speech` і перевірте повернутий стан Chrome. Якщо він повідомляє `manualActionRequired: true`, покажіть `manualActionMessage` оператору й припиніть повторні спроби, доки не буде завершено дію в браузері.

Поширені ручні дії:

- Увійдіть у профіль Chrome.
- Допустіть гостя з облікового запису організатора Meet.
- Надайте Chrome дозволи на мікрофон/камеру.
- Закрийте або виправте зависле діалогове вікно дозволів Meet.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує endpoint `spaces.create` API Google Meet, коли налаштовано облікові дані OAuth. Без облікових даних OAuth він переходить до резервного варіанта через браузер закріпленого Chrome Node. Переконайтеся в такому:

- Для створення через API: налаштовано `oauth.clientId` і `oauth.refreshToken`, або присутні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: токен оновлення було видано після додавання підтримки створення. Старіші токени можуть не містити область дії `meetings.space.created`; повторно виконайте `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для резервного варіанта через браузер: `defaultTransport: "chrome-node"` і `chromeNode.node` вказують на підключений Node з `browser.proxy` і `googlemeet.chrome`.
- Для резервного варіанта через браузер: профіль OpenClaw Chrome на цьому Node має виконаний вхід у Google і може відкрити `https://meet.google.com/new`.

### Агент приєднується, але не говорить

Перевірте шлях режиму реального часу:

```bash
openclaw googlemeet setup
openclaw googlemeet status
```

Використовуйте `mode: "realtime"` для прослуховування/зворотного мовлення. `mode: "transcribe"` навмисно не запускає міст дуплексного голосу режиму реального часу.

Також перевірте:

- На хості Gateway доступний ключ провайдера режиму реального часу, наприклад `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `rec` і `play` існують на хості Chrome.
- Мікрофон і динамік Meet спрямовано через шлях віртуального аудіо, який використовує OpenClaw.

### Не проходять перевірки налаштування Twilio

`twilio-voice-call-plugin` не проходить, коли `voice-call` не дозволено або не ввімкнено.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте Gateway.

`twilio-voice-call-credentials` не проходить, коли в бекенді Twilio відсутні account SID, auth token або номер абонента. Установіть це на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Потім перезапустіть або перезавантажте Gateway і виконайте:

```bash
openclaw googlemeet setup
```

### Виклик Twilio починається, але ніколи не входить у зустріч

Підтвердьте, що подія Meet показує дані для телефонного підключення. Передайте точний номер для дозвону та PIN або спеціальну послідовність DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початковий `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза перед введенням PIN.

## Примітки

Офіційний медіа-API Google Meet орієнтований на отримання, тому для мовлення у виклику Meet усе ще потрібен шлях учасника. Цей Plugin зберігає цю межу видимою:
Chrome обробляє участь через браузер і локальну маршрутизацію аудіо; Twilio обробляє участь через телефонний дозвін.

Режим Chrome у режимі реального часу потребує одного з такого:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує мостом моделі режиму реального часу та передає аудіо G.711 mu-law 8 кГц між цими командами та вибраним провайдером голосу режиму реального часу.
- `chrome.audioBridgeCommand`: зовнішня команда моста керує всім локальним аудіошляхом і має завершитися після запуску або перевірки свого daemon.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі віртуальні пристрої або граф віртуальних пристроїв на кшталт Loopback. Один спільний пристрій BlackHole може повертати голоси інших учасників назад у виклик.

`googlemeet speak` запускає активний аудіоміст режиму реального часу для сесії Chrome.
`googlemeet leave` зупиняє цей міст. Для сесій Twilio, делегованих через Plugin Voice Call, `leave` також завершує базовий голосовий виклик.

## Пов’язане

- [Plugin Voice Call](/uk/plugins/voice-call)
- [Режим talk](/uk/nodes/talk)
- [Створення Plugin](/uk/plugins/building-plugins)
