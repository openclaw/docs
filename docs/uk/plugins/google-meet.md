---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до виклику Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий виклик Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Плагін Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio з типовими параметрами голосу в реальному часі'
title: Плагін Google Meet
x-i18n:
    generated_at: "2026-04-25T00:35:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83256d1c374aeaf18f9b2bdf7ae9cdfa9e053422c65b2db4dcee7013505b555a
    source_path: plugins/google-meet.md
    workflow: 15
---

Підтримка учасника Google Meet для OpenClaw — плагін навмисно є явним за дизайном:

- Він приєднується лише за явною URL-адресою `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися за поверненою URL-адресою.
- Голос `realtime` є типовим режимом.
- Голос у режимі реального часу може повертатися до повного агента OpenClaw, коли потрібні глибші міркування або інструменти.
- Агенти обирають поведінку приєднання за допомогою `mode`: використовуйте `realtime` для живого прослуховування/відповіді голосом або `transcribe`, щоб приєднатися/керувати браузером без мосту голосу в реальному часі.
- Автентифікація починається як персональний Google OAuth або вже виконаний вхід у профіль Chrome.
- Автоматичного оголошення згоди немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на підключеному вузлі.
- Twilio приймає номер для дозвону та необов’язкову PIN-код або DTMF-послідовність.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших сценаріїв агентських телеконференцій.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте бекенд-провайдера голосу в реальному часі. OpenAI є типовим; Google Gemini Live також працює з `realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` встановлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор Homebrew вимагає перезавантаження, перш ніж macOS зробить пристрій доступним:

```bash
sudo reboot
```

Після перезавантаження перевірте обидві складові:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Увімкніть плагін:

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

Вивід налаштування призначений для читання агентом. Він повідомляє про профіль Chrome, аудіоміст, закріплення вузла, відкладений вступ до `realtime`, а також, коли налаштовано делегування Twilio, чи готові плагін `voice-call` і облікові дані Twilio. Розглядайте будь-яку перевірку `ok: false` як блокувальну, перш ніж просити агента приєднатися.
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

Створіть нову зустріч і приєднайтеся до неї:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Створіть лише URL-адресу без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це найдетермінованіший шлях, який не залежить від стану UI браузера.
- Резервний варіант через браузер: використовується, коли облікових даних OAuth немає. OpenClaw використовує закріплений вузол Chrome, відкриває `https://meet.google.com/new`, чекає, поки Google перенаправить на справжню URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Цей шлях вимагає, щоб у профілі OpenClaw Chrome на вузлі вже був виконаний вхід у Google.
  Автоматизація браузера обробляє власний початковий запит Meet на доступ до мікрофона; цей запит не вважається збоєм входу в Google.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти могли пояснити, який шлях було використано. `create` типово приєднується до нової зустрічі та повертає `joined: true` разом із сесією приєднання. Щоб лише згенерувати URL-адресу, використовуйте `create --no-join` у CLI або передайте `"join": false` в інструмент.

Або скажіть агенту: "Створи Google Meet, приєднайся до нього з голосом у режимі реального часу та надішли мені посилання." Агент має викликати `google_meet` з `action: "create"`, а потім поділитися поверненим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Для приєднання лише зі спостереженням/керуванням браузером установіть `"mode": "transcribe"`. Це не запускає дуплексний міст моделі реального часу, тому він не відповідатиме голосом у зустрічі.

Chrome приєднується як профіль Chrome, у якому виконано вхід. У Meet виберіть `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф на кшталт Loopback; одного пристрою BlackHole достатньо для першої базової перевірки, але може бути луна.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний Gateway OpenClaw або ключ API моделі всередині macOS VM лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть вузол на хості у VM. Увімкніть вбудований плагін у VM один раз, щоб вузол рекламував команду Chrome:

Що де працює:

- Хост Gateway: Gateway OpenClaw, робочий простір агента, ключі моделі/API, провайдер `realtime` і конфігурація плагіна Google Meet.
- macOS VM у Parallels: CLI OpenClaw/вузол-хост, Google Chrome, SoX, BlackHole 2ch і профіль Chrome із виконаним входом у Google.
- Не потрібно у VM: служба Gateway, конфігурація агента, ключ OpenAI/GPT або налаштування провайдера моделі.

Установіть залежності у VM:

```bash
brew install blackhole-2ch sox
```

Перезавантажте VM після встановлення BlackHole, щоб macOS зробила `BlackHole 2ch` доступним:

```bash
sudo reboot
```

Після перезавантаження перевірте, що VM бачить аудіопристрій і команди SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Установіть або оновіть OpenClaw у VM, а потім увімкніть там вбудований плагін:

```bash
openclaw plugins enable google-meet
```

Запустіть вузол-хост у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це IP-адреса локальної мережі і ви не використовуєте TLS, вузол відхиляє plaintext WebSocket, якщо ви явно не дозволите це для цієї довіреної приватної мережі:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Використовуйте ту саму змінну середовища, коли встановлюєте вузол як LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це змінна середовища процесу, а не налаштування `openclaw.json`. `openclaw node install` зберігає її в середовищі LaunchAgent, коли вона присутня в команді встановлення.

Підтвердьте вузол із хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить вузол і що він рекламує як `googlemeet.chrome`, так і можливість браузера/`browser.proxy`:

```bash
openclaw nodes status
```

Спрямовуйте Meet через цей вузол на хості Gateway:

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

Тепер приєднуйтеся як зазвичай із хоста Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

або попросіть агента використати інструмент `google_meet` з `transport: "chrome-node"`.

Для перевірки однією командою, яка створює або повторно використовує сесію, промовляє відому фразу та виводить стан сесії:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання автоматизація браузера OpenClaw заповнює ім’я гостя, натискає Join/Ask to join і приймає початковий вибір Meet "Use microphone", коли з’являється цей запит. Під час створення зустрічі лише через браузер вона також може продовжити після того самого запиту без мікрофона, якщо Meet не показує кнопку використання мікрофона.
Якщо в профілі браузера не виконано вхід, Meet очікує допуску від хоста, Chrome потребує дозволу на мікрофон/камеру або Meet застряг на запиті, який автоматизація не змогла обробити, результат join/test-speech повідомляє `manualActionRequired: true` з `manualActionReason` і `manualActionMessage`. Агенти повинні припинити повторні спроби приєднання, повідомити саме це повідомлення разом із поточними `browserUrl`/`browserTitle` і повторити спробу лише після завершення ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw виконує автоматичний вибір лише тоді, коли рівно один підключений вузол рекламує і `googlemeet.chrome`, і керування браузером. Якщо підключено кілька придатних вузлів, установіть `chromeNode.node` на id вузла, відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM, підтвердьте сполучення та переконайтеся, що у VM було виконано `openclaw plugins enable google-meet` і `openclaw plugins enable browser`. Також підтвердьте, що хост Gateway дозволяє обидві команди вузла через `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch` у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: виконайте вхід у профіль браузера всередині VM або залиште `chrome.guestName` установленим для гостьового приєднання. Автоматичне гостьове приєднання використовує автоматизацію браузера OpenClaw через проксі браузера вузла; переконайтеся, що конфігурація браузера вузла вказує на потрібний профіль, наприклад `browser.defaultProfile: "user"` або іменований профіль наявної сесії.
- Дубльовані вкладки Meet: залиште ввімкненим `chrome.reuseExistingTab: true`. OpenClaw активує наявну вкладку для тієї самої URL-адреси Meet перед відкриттям нової, а створення зустрічі через браузер повторно використовує вкладку `https://meet.google.com/new`, що вже виконується, або вкладку запиту облікового запису Google перед відкриттям іншої.
- Немає аудіо: у Meet спрямовуйте аудіо мікрофона/динаміка через шлях віртуального аудіопристрою, який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію на кшталт Loopback для чистого дуплексу.

## Примітки щодо встановлення

Типовий режим реального часу для Chrome використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для роботи з аудіо. Плагін використовує її команди `rec` і `play` для типового аудіомосту G.711 mu-law 8 кГц.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`, через який Chrome/Meet може спрямовувати аудіо.

OpenClaw не постачає і не розповсюджує жоден із цих пакетів. Документація просить користувачів установлювати їх як залежності хоста через Homebrew. SoX ліцензовано як `LGPL-2.0-only AND GPL-2.0-only`; BlackHole має ліцензію GPL-3.0. Якщо ви створюєте інсталятор або appliance, який постачає BlackHole разом з OpenClaw, перегляньте умови ліцензування BlackHole від апстриму або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet у Google Chrome і приєднується як профіль Chrome, у якому виконано вхід. У macOS плагін перед запуском перевіряє наявність `BlackHole 2ch`. Якщо налаштовано, він також запускає команду перевірки стану аудіомосту та команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють на підключеному вузлі, наприклад у macOS VM Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямовуйте аудіо мікрофона і динаміка Chrome через локальний аудіоміст OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план набору, делегований плагіну Voice Call. Він не аналізує сторінки Meet для пошуку телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або ви хочете резервний варіант через телефонний дозвін. Google Meet має надавати номер для телефонного дозвону та PIN для зустрічі; OpenClaw не виявляє їх на сторінці Meet.

Увімкніть плагін Voice Call на хості Gateway, а не на вузлі Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // або встановіть "twilio", якщо Twilio має бути типовим
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

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни конфігурації плагіна не з’являються в уже запущеному процесі Gateway, доки він не буде перезавантажений.

Потім перевірте:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Коли делегування Twilio налаштовано, `googlemeet setup` містить успішні перевірки `twilio-voice-call-plugin` і `twilio-voice-call-credentials`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Використовуйте `--dtmf-sequence`, коли зустріч вимагає спеціальної послідовності:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth і попередня перевірка

OAuth є необов’язковим для створення посилання Meet, оскільки `googlemeet create` може використовувати резервний варіант через автоматизацію браузера. Налаштуйте OAuth, якщо вам потрібні офіційне створення через API, визначення простору або перевірки попередньої готовності Meet Media API.

Доступ до Google Meet API спочатку використовує персональний OAuth-клієнт. Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` з refresh token. Вона використовує PKCE, локальний callback на `http://localhost:8085/oauth2callback` і ручний потік копіювання/вставлення з `--manual`.

Згода OAuth включає створення простору Meet, доступ на читання простору Meet і доступ на читання медіаданих конференції Meet. Якщо ви проходили автентифікацію до появи підтримки створення зустрічей, повторно виконайте `openclaw googlemeet auth login --json`, щоб refresh token мав область `meetings.space.created`.

Для резервного варіанта через браузер облікові дані OAuth не потрібні. У цьому режимі автентифікація Google походить із профілю Chrome із виконаним входом на вибраному вузлі, а не з конфігурації OpenClaw.

Як резервні варіанти приймаються такі змінні середовища:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` або `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` або `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` або
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` або `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` або `GOOGLE_MEET_PREVIEW_ACK`

Визначте URL-адресу Meet, код або `spaces/{id}` через `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Запустіть попередню перевірку перед роботою з медіа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда виводить новий `meeting uri`, джерело та сесію приєднання. За наявності облікових даних OAuth вона використовує офіційний Google Meet API. Без облікових даних OAuth вона використовує як резервний варіант профіль браузера із виконаним входом на закріпленому вузлі Chrome. Агенти можуть використовувати інструмент `google_meet` з `action: "create"`, щоб створити і приєднатися за один крок. Щоб створити лише URL-адресу, передайте `"join": false`.

Приклад виводу JSON для резервного варіанта через браузер:

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

Приклад виводу JSON для створення через API:

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

Створення Meet типово також приєднується до нього. Транспорт Chrome або Chrome-node усе ще потребує профілю Google Chrome із виконаним входом, щоб приєднатися через браузер. Якщо з профілю виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або про помилку резервного варіанта браузера й просить оператора завершити вхід у Google перед повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud project, OAuth principal і учасники зустрічі зареєстровані в Google Workspace Developer Preview Program для медіа-API Meet.

## Конфігурація

Поширеному шляху `realtime` через Chrome потрібні лише ввімкнений плагін, BlackHole, SoX і ключ бекенд-провайдера голосу в реальному часі. OpenAI є типовим; установіть `realtime.provider: "google"`, щоб використовувати Google Gemini Live:

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
- `chromeNode.node`: необов’язковий id/ім’я/IP вузла для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на екрані гостя Meet без входу
- `chrome.autoJoin: true`: заповнення імені гостя та натискання Join Now з найкращим зусиллям через автоматизацію браузера OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, поки вкладка Meet повідомить про вхід у виклик, перш ніж буде активовано вступ до `realtime`
- `chrome.audioInputCommand`: команда SoX `rec`, яка записує аудіо G.711 mu-law 8 кГц у stdout
- `chrome.audioOutputCommand`: команда SoX `play`, яка читає аудіо G.711 mu-law 8 кГц із stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді з `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли підключається міст `realtime`; установіть `""`, щоб приєднуватися беззвучно

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

`voiceCall.enabled` типово має значення `true`; із транспортом Twilio він делегує фактичний PSTN-виклик і DTMF плагіну Voice Call. Якщо `voice-call` не ввімкнено, Google Meet усе ще може перевіряти та записувати план набору, але не може здійснити виклик Twilio.

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

Використовуйте `transport: "chrome"`, коли Chrome працює на хості Gateway. Використовуйте `transport: "chrome-node"`, коли Chrome працює на підключеному вузлі, наприклад у VM Parallels. В обох випадках модель `realtime` і `openclaw_agent_consult` працюють на хості Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сесії або перевірити ID сесії. Використовуйте `action: "speak"` із `sessionId` і `message`, щоб агент `realtime` негайно заговорив. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сесію, активувати відому фразу та повернути стан `inCall`, якщо хост Chrome може про це повідомити. Використовуйте `action: "leave"`, щоб позначити сесію як завершену.

`status` включає стан Chrome, коли він доступний:

- `inCall`: Chrome, імовірно, перебуває всередині виклику Meet
- `micMuted`: приблизний стан мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профіль браузера потребує ручного входу, допуску від хоста Meet, дозволів або виправлення керування браузером, перш ніж зможе працювати мовлення
- `providerConnected` / `realtimeReady`: стан мосту голосу `realtime`
- `lastInputAt` / `lastOutputAt`: час останнього аудіо, отриманого або надісланого через міст

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Консультація агента в реальному часі

Режим Chrome `realtime` оптимізовано для живого голосового циклу. Провайдер голосу в реальному часі чує аудіо зустрічі й говорить через налаштований аудіоміст. Коли моделі `realtime` потрібні глибші міркування, актуальна інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент consult запускає звичайного агента OpenClaw у фоновому режимі з контекстом недавньої розшифровки зустрічі й повертає коротку усну відповідь до голосової сесії `realtime`. Потім голосова модель може озвучити цю відповідь назад у зустріч. Він використовує той самий спільний інструмент консультації `realtime`, що й Voice Call.

`realtime.toolPolicy` керує запуском consult:

- `safe-read-only`: надати інструмент consult і обмежити звичайного агента інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`.
- `owner`: надати інструмент consult і дозволити звичайному агенту використовувати стандартну політику інструментів агента.
- `none`: не надавати інструмент consult моделі голосу `realtime`.

Ключ сесії consult обмежено кожною сесією Meet, тому наступні виклики consult можуть повторно використовувати попередній контекст consult під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднався до виклику:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повної перевірки приєднання та мовлення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Контрольний список для живого тесту

Використовуйте цю послідовність перед передачею зустрічі агенту без нагляду:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Очікуваний стан Chrome-node:

- у `googlemeet setup` усе зелене.
- `nodes status` показує, що вибраний вузол підключено.
- Вибраний вузол рекламує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до виклику, а `test-speech` повертає стан Chrome з `inCall: true`.

Для перевірки Twilio використовуйте зустріч, яка надає дані для телефонного дозвону:

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

Підтвердьте, що плагін увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно відредагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway.
Запущений агент бачить лише ті інструменти плагінів, які зареєстровані поточним процесом Gateway.

### Немає підключеного вузла з підтримкою Google Meet

На хості вузла виконайте:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

На хості Gateway підтвердьте вузол і перевірте команди:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Вузол має бути підключений і містити `googlemeet.chrome` та `browser.proxy`.
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

### Браузер відкривається, але агент не може приєднатися

Запустіть `googlemeet test-speech` і перевірте повернутий стан Chrome. Якщо він
повідомляє `manualActionRequired: true`, покажіть оператору `manualActionMessage`
і припиніть повторні спроби, доки дію в браузері не буде завершено.

Поширені ручні дії:

- Виконати вхід у профіль Chrome.
- Дозволити вхід гостю з облікового запису хоста Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’являється власний запит дозволу Chrome.
- Закрити або виправити завислий діалог дозволів Meet.

Не повідомляйте "вхід не виконано" лише тому, що Meet показує "Do you want people to
hear you in the meeting?" Це проміжний екран вибору аудіо в Meet; OpenClaw
натискає **Use microphone** через автоматизацію браузера, коли це доступно, і продовжує
чекати на справжній стан зустрічі. Для резервного варіанта створення лише через браузер OpenClaw
може натиснути **Continue without microphone**, оскільки створення URL-адреси не потребує
аудіошляху `realtime`.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує endpoint `spaces.create` Google Meet API,
коли налаштовано облікові дані OAuth. Без облікових даних OAuth він повертається
до браузера закріпленого вузла Chrome. Перевірте:

- Для створення через API: налаштовано `oauth.clientId` і `oauth.refreshToken`,
  або наявні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було отримано після додавання підтримки
  створення. Старі токени можуть не мати області `meetings.space.created`; повторно виконайте
  `openclaw googlemeet auth login --json` і оновіть конфігурацію плагіна.
- Для резервного варіанта через браузер: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений вузол із `browser.proxy` та
  `googlemeet.chrome`.
- Для резервного варіанта через браузер: профіль OpenClaw Chrome на цьому вузлі має виконаний вхід
  у Google і може відкрити `https://meet.google.com/new`.
- Для резервного варіанта через браузер: повторні спроби повторно використовують наявну вкладку
  `https://meet.google.com/new` або запит облікового запису Google перед відкриттям нової вкладки.
  Якщо агент перевищив час очікування, повторіть виклик інструмента, а не відкривайте вручну іншу вкладку Meet.
- Для резервного варіанта через браузер: якщо Meet показує "Do you want people to hear you in the
  meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для
  резервного варіанта лише створення, **Continue without microphone** через автоматизацію браузера
  і продовжити чекати на згенеровану URL-адресу Meet. Якщо це не вдається, у помилці має згадуватися
  `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте шлях `realtime`:

```bash
openclaw googlemeet setup
openclaw googlemeet status
```

Використовуйте `mode: "realtime"` для прослуховування/відповіді голосом. `mode: "transcribe"` навмисно
не запускає дуплексний голосовий міст `realtime`.

Також перевірте:

- На хості Gateway доступний ключ провайдера `realtime`, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- На хості Chrome видно `BlackHole 2ch`.
- На хості Chrome існують `rec` і `play`.
- Мікрофон і динамік Meet спрямовано через віртуальний аудіошлях, який використовує
  OpenClaw.

### Не проходять перевірки налаштування Twilio

`twilio-voice-call-plugin` не проходить, коли `voice-call` не дозволено або не ввімкнено.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` не проходить, коли у бекенда Twilio відсутні account
SID, auth token або номер виклику. Установіть це на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Потім перезапустіть або перезавантажте Gateway і виконайте:

```bash
openclaw googlemeet setup
```

### Дзвінок Twilio починається, але ніколи не входить у зустріч

Переконайтеся, що подія Meet надає дані для телефонного дозвону. Передайте точний номер
для дозвону та PIN або спеціальну DTMF-послідовність:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкові `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза
перед введенням PIN.

## Примітки

Офіційний медіа-API Google Meet орієнтований на прийом, тому для мовлення у виклику
Meet усе ще потрібен шлях учасника. Цей плагін зберігає цю межу видимою:
Chrome обробляє участь через браузер і локальну маршрутизацію аудіо; Twilio обробляє
участь через телефонний дозвін.

Режиму Chrome `realtime` потрібно одне з такого:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує
  мостом моделі `realtime` і передає аудіо G.711 mu-law 8 кГц між цими
  командами та вибраним провайдером голосу `realtime`.
- `chrome.audioBridgeCommand`: зовнішня команда мосту керує всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого дуплексного аудіо спрямовуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв на кшталт Loopback. Один спільний
пристрій BlackHole може повертати голоси інших учасників назад у виклик.

`googlemeet speak` активує активний аудіоміст `realtime` для сесії Chrome.
`googlemeet leave` зупиняє цей міст. Для сесій Twilio, делегованих через плагін Voice Call,
`leave` також завершує базовий голосовий виклик.

## Пов’язане

- [Плагін Voice Call](/uk/plugins/voice-call)
- [Режим Talk](/uk/nodes/talk)
- [Створення плагінів](/uk/plugins/building-plugins)
