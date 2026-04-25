---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий дзвінок Google Meet
    - Ви налаштовуєте Chrome, Chrome Node або Twilio як transport для Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL Google Meet через Chrome або Twilio зі стандартними налаштуваннями realtime voice'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-25T05:57:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: c96496a06d00e719ecd0af4b8edf1423cbbc37f7773672e2456baaf06c7ca0ec
    source_path: plugins/google-meet.md
    workflow: 15
---

Підтримка учасників Google Meet для OpenClaw — Plugin навмисно зроблено явним:

- Він приєднується лише за явним URL `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися за повернутим URL.
- `realtime` voice — стандартний режим.
- Realtime voice може викликати назад повний агент OpenClaw, коли потрібні глибше reasoning або інструменти.
- Агенти вибирають поведінку приєднання через `mode`: використовуйте `realtime` для живого прослуховування/відповіді голосом або `transcribe`, щоб приєднатися/керувати браузером без моста realtime voice.
- Auth починається з особистого Google OAuth або вже увійденого профілю Chrome.
- Автоматичного оголошення про згоду немає.
- Стандартний аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на підключеному host Node.
- Twilio приймає номер для дозвону плюс необов’язкову PIN або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших workflow телекомунікацій агентів.

## Швидкий старт

Установіть локальні аудіозалежності й налаштуйте backend provider-а realtime voice.
OpenAI використовується за замовчуванням; Google Gemini Live також працює з
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# або
export GEMINI_API_KEY=...
```

`blackhole-2ch` встановлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор
Homebrew потребує перезавантаження, перш ніж macOS покаже цей пристрій:

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

Вивід налаштування призначено для читання агентом. Він повідомляє про профіль
Chrome, аудіоміст, pinning Node, відкладений вступ realtime, а також, коли
налаштовано делегування Twilio, чи готові Plugin `voice-call` і облікові дані Twilio.
Будь-яку перевірку з `ok: false` слід вважати блокером, перш ніж просити агента приєднатися.
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

Створіть лише URL без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це найдетермінованіший шлях, який не залежить від стану UI браузера.
- Резервний варіант через браузер: використовується, коли облікові дані OAuth відсутні. OpenClaw використовує закріплений Chrome Node, відкриває `https://meet.google.com/new`, чекає, поки Google перенаправить на реальний URL із кодом зустрічі, а потім повертає цей URL. Цей шлях вимагає, щоб профіль Chrome OpenClaw на Node уже був увійдений у Google.
  Автоматизація браузера обробляє власний початковий запит Meet на мікрофон; цей запит не вважається помилкою входу в Google.
  Потоки приєднання і створення також намагаються повторно використати наявну вкладку Meet, перш ніж відкривати нову. Під час зіставлення ігноруються нешкідливі рядки запиту URL, такі як `authuser`, тому повторна спроба агента має фокусувати вже відкриту зустріч замість створення другої вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` за замовчуванням приєднується
до нової зустрічі й повертає `joined: true` разом із сесією приєднання. Щоб лише
створити URL, використовуйте `create --no-join` у CLI або передайте `"join": false`
в інструмент.

Або скажіть агенту: «Створи Google Meet, приєднайся до нього з realtime voice і надішли
мені посилання». Агент має викликати `google_meet` з `action: "create"`, а потім
поділитися повернутим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Для приєднання лише зі спостереженням/керуванням браузером задайте `"mode": "transcribe"`. Це
не запускає duplex-міст моделі realtime, тому вона не буде відповідати голосом у
зустріч.

Під час сесій realtime статус `google_meet` містить дані про стан браузера й аудіомоста,
такі як `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, часові мітки останнього
входу/виходу, лічильники байтів і стан закриття моста. Якщо з’являється безпечний
запит сторінки Meet, автоматизація браузера обробляє його, коли це можливо. Запити
на вхід, допуск host, а також браузерні/системні запити дозволів повідомляються як
ручна дія з причиною й повідомленням, яке агент має передати.

Chrome приєднується як увійдений профіль Chrome. У Meet виберіть `BlackHole 2ch`
для шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого duplex-аудіо
використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного
пристрою BlackHole достатньо для першого smoke-тесту, але може виникати луна.

### Локальний Gateway + Parallels Chrome

Вам **не потрібен** повний Gateway OpenClaw або API key моделі всередині macOS VM
лише для того, щоб Chrome працював у VM. Запустіть Gateway і агента локально, а потім
запустіть host Node у VM. Один раз увімкніть bundled Plugin у VM, щоб Node
оголошував команду Chrome:

Що де запускається:

- Host Gateway: Gateway OpenClaw, робочий простір агента, ключі моделі/API, realtime
  provider і конфігурація Plugin Google Meet.
- macOS VM у Parallels: CLI/host Node OpenClaw, Google Chrome, SoX, BlackHole 2ch
  і профіль Chrome з входом у Google.
- Не потрібно у VM: сервіс Gateway, конфігурація агента, ключ OpenAI/GPT або
  налаштування provider-а моделі.

Установіть залежності у VM:

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
command -v rec play
```

Установіть або оновіть OpenClaw у VM, а потім увімкніть там bundled Plugin:

```bash
openclaw plugins enable google-meet
```

Запустіть host Node у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це LAN IP і ви не використовуєте TLS, Node відхиляє
простий WebSocket, якщо ви явно не дозволите це для довіреної приватної мережі:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Використовуйте ту саму змінну середовища під час встановлення Node як LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це змінна середовища процесу, а не
налаштування `openclaw.json`. `openclaw node install` зберігає її в середовищі
LaunchAgent, коли вона присутня в команді встановлення.

Схваліть Node з host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить Node і що він оголошує і `googlemeet.chrome`,
і capability браузера/`browser.proxy`:

```bash
openclaw nodes status
```

Спрямуйте Meet через цей Node на host Gateway:

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

Тепер приєднуйтеся як звичайно з host Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

або попросіть агента використати інструмент `google_meet` з `transport: "chrome-node"`.

Для smoke-тесту однією командою, який створює або повторно використовує сесію,
вимовляє відому фразу й виводить стан сесії:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання автоматизація браузера OpenClaw заповнює ім’я гостя, натискає Join/Ask
to join і приймає початковий вибір Meet «Use microphone», коли цей запит
з’являється. Під час створення зустрічі лише через браузер вона також може пройти
далі через той самий запит без мікрофона, якщо Meet не показує кнопку use-microphone.
Якщо профіль браузера не увійшов у систему, Meet чекає на
допуск host, Chrome потребує дозволу на мікрофон/камеру або Meet застряг на
запиті, який автоматизація не змогла обробити, результат join/test-speech повідомляє
`manualActionRequired: true` разом із `manualActionReason` і
`manualActionMessage`. Агенти мають припинити повторні спроби приєднання, передати саме
це повідомлення разом із поточними `browserUrl`/`browserTitle` і повторити спробу
лише після завершення ручної дії в браузері.

Якщо `chromeNode.node` не вказано, OpenClaw виконує автовибір лише тоді, коли рівно один
підключений Node оголошує і `googlemeet.chrome`, і керування браузером. Якщо
підключено кілька придатних Node, задайте `chromeNode.node` як id Node,
відображуване ім’я або віддалений IP.

Поширені перевірки збоїв:

- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  схваліть сполучення й переконайтеся, що у VM виконано `openclaw plugins enable google-meet` і
  `openclaw plugins enable browser`. Також підтвердьте, що
  host Gateway дозволяє обидві команди Node через
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch`
  у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або
  залиште `chrome.guestName` заданим для гостьового приєднання. Автоприєднання гостя використовує
  автоматизацію браузера OpenClaw через proxy браузера Node; переконайтеся, що конфігурація браузера Node
  вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або іменований профіль наявної сесії.
- Дубльовані вкладки Meet: залишайте `chrome.reuseExistingTab: true` увімкненим. OpenClaw
  активує наявну вкладку для того самого URL Meet, перш ніж відкривати нову, а
  створення зустрічі через браузер повторно використовує вкладку `https://meet.google.com/new`,
  яка вже в процесі, або вкладку запиту облікового запису Google, перш ніж відкривати іншу.
- Немає аудіо: у Meet спрямовуйте мікрофон/динамік через шлях віртуального аудіопристрою,
  який використовує OpenClaw; для чистого duplex використовуйте окремі віртуальні пристрої або маршрутизацію
  в стилі Loopback.

## Примітки щодо встановлення

Стандартний режим realtime у Chrome використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для аудіо. Plugin використовує її команди `rec` і `play`
  для стандартного аудіомоста G.711 mu-law на 8 кГц.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій
  `BlackHole 2ch`, через який Chrome/Meet можуть маршрутизувати звук.

OpenClaw не постачає й не розповсюджує жоден із цих пакунків. У документації користувачам
пропонується встановлювати їх як залежності host через Homebrew. SoX ліцензовано як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole має ліцензію GPL-3.0. Якщо ви створюєте
інсталятор або appliance, що постачає BlackHole разом з OpenClaw, перегляньте
умови ліцензування BlackHole в upstream або отримайте окрему ліцензію від Existential Audio.

## Transport-и

### Chrome

Transport Chrome відкриває URL Meet у Google Chrome і приєднується як увійдений
профіль Chrome. На macOS Plugin перевіряє наявність `BlackHole 2ch` перед запуском.
За наявності відповідної конфігурації він також виконує команду перевірки стану аудіомоста
й команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо
працюють на host Gateway; використовуйте `chrome-node`, коли Chrome/аудіо
працюють на підключеному Node, наприклад у macOS VM Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Маршрутизуйте аудіо мікрофона й динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування
замість тихого приєднання без аудіошляху.

### Twilio

Transport Twilio — це строгий план набору, делегований Plugin Voice Call. Він
не розбирає сторінки Meet, щоб знаходити номери телефонів.

Використовуйте його, коли участь через Chrome недоступна або коли вам потрібен
резервний варіант із телефонним дозвоном. Google Meet має показувати номер для
дозвону й PIN для зустрічі; OpenClaw не визначає їх зі сторінки Meet.

Увімкніть Plugin Voice Call на host Gateway, а не на Chrome Node:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // або задайте "twilio", якщо Twilio має бути transport за замовчуванням
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
конфігурації Plugin не з’являються в уже запущеному процесі Gateway, доки його не буде перезавантажено.

Потім перевірте:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Коли делегування Twilio підключено, `googlemeet setup` містить успішні перевірки
`twilio-voice-call-plugin` і `twilio-voice-call-credentials`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Використовуйте `--dtmf-sequence`, коли зустріч потребує custom-послідовності:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth і preflight

OAuth не є обов’язковим для створення посилання Meet, оскільки `googlemeet create` може
використовувати fallback через автоматизацію браузера. Налаштуйте OAuth, якщо вам потрібні офіційне створення через API,
визначення простору або перевірки preflight Meet Media API.

Доступ до Google Meet API спочатку використовує особистий OAuth client. Налаштуйте
`oauth.clientId` і, за потреби, `oauth.clientSecret`, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` із refresh token. Вона використовує PKCE,
localhost callback на `http://localhost:8085/oauth2callback` і ручний
потік копіювання/вставлення з `--manual`.

OAuth consent включає створення простору Meet, доступ на читання простору Meet і
доступ на читання conference media Meet. Якщо ви автентифікувалися до появи
підтримки створення зустрічей, повторно виконайте `openclaw googlemeet auth login --json`, щоб refresh token
мав scope `meetings.space.created`.

Для fallback через браузер облікові дані OAuth не потрібні. У цьому режимі auth Google
береться зі signed-in профілю Chrome на вибраному Node, а не з конфігурації
OpenClaw.

Як fallback приймаються такі змінні середовища:

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

Запустіть preflight перед роботою з media:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда виводить новий `meeting uri`, джерело й сесію приєднання. За наявності
облікових даних OAuth вона використовує офіційний Google Meet API. Без облікових даних OAuth вона
використовує signed-in профіль браузера на закріпленому Chrome Node як fallback. Агенти можуть
використовувати інструмент `google_meet` з `action: "create"`, щоб створити й приєднатися за один
крок. Для створення лише URL передайте `"join": false`.

Приклад JSON-виводу для fallback через браузер:

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

Якщо fallback через браузер натрапляє на вхід у Google або блокування дозволів Meet
до того, як зможе створити URL, метод Gateway повертає відповідь із помилкою, а
інструмент `google_meet` повертає структуровані деталі замість простого рядка:

```json
{
  "source": "browser",
  "error": "google-login-required: Увійдіть у Google в профілі браузера OpenClaw, а потім повторіть створення зустрічі.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Увійдіть у Google в профілі браузера OpenClaw, а потім повторіть створення зустрічі.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Вхід — Google Accounts"
  }
}
```

Коли агент бачить `manualActionRequired: true`, він має повідомити
`manualActionMessage` разом із контекстом Node/вкладки браузера й припинити відкривати нові
вкладки Meet, доки оператор не завершить крок у браузері.

Приклад JSON-виводу для створення через API:

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

Створення Meet за замовчуванням також приєднує до нього. Transport Chrome або Chrome-node
усе одно потребує signed-in профілю Google Chrome, щоб приєднатися через браузер. Якщо
профіль вийшов із системи, OpenClaw повідомляє `manualActionRequired: true` або
помилку fallback браузера й просить оператора завершити вхід у Google перед
повторною спробою.

Задавайте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
project, OAuth principal і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Поширений шлях Chrome realtime потребує лише ввімкненого Plugin, BlackHole, SoX
і ключа backend provider-а realtime voice. OpenAI використовується за замовчуванням; задайте
`realtime.provider: "google"`, щоб використовувати Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# або
export GEMINI_API_KEY=...
```

Задайте конфігурацію Plugin у `plugins.entries.google-meet.config`:

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

Стандартні значення:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: необов’язкові id/ім’я/IP Node для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на екрані гостя Meet
  без входу
- `chrome.autoJoin: true`: best-effort заповнення імені гостя й натискання Join Now
  через автоматизацію браузера OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить про стан in-call,
  перш ніж буде запущено вступне повідомлення realtime
- `chrome.audioInputCommand`: команда SoX `rec`, що записує аудіо 8 кГц G.711 mu-law
  у stdout
- `chrome.audioOutputCommand`: команда SoX `play`, що читає аудіо 8 кГц G.711 mu-law
  зі stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли realtime bridge
  підключається; задайте `""`, щоб приєднуватися беззвучно

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
    introMessage: "Скажи рівно так: Я тут.",
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

`voiceCall.enabled` за замовчуванням має значення `true`; з transport Twilio він делегує
фактичний PSTN-дзвінок і DTMF Plugin Voice Call. Якщо `voice-call` не
увімкнено, Google Meet усе ще може перевірити й записати план набору, але не
може виконати дзвінок Twilio.

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

Використовуйте `transport: "chrome"`, коли Chrome працює на host Gateway. Використовуйте
`transport: "chrome-node"`, коли Chrome працює на підключеному Node, наприклад у Parallels
VM. В обох випадках модель realtime і `openclaw_agent_consult` працюють на
host Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сесії або переглянути ID сесії. Використовуйте
`action: "speak"` із `sessionId` і `message`, щоб змусити агента realtime
заговорити негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сесію,
запустити відому фразу й повернути стан `inCall`, коли host Chrome може його повідомити. Використовуйте
`action: "leave"`, щоб позначити сесію завершеною.

`status` містить дані про стан Chrome, коли вони доступні:

- `inCall`: схоже, що Chrome перебуває всередині дзвінка Meet
- `micMuted`: best-effort стан мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профіль
  браузера потребує ручного входу, допуску host Meet, дозволів або ремонту
  керування браузером, перш ніж зможе працювати мовлення
- `providerConnected` / `realtimeReady`: стан моста realtime voice
- `lastInputAt` / `lastOutputAt`: час останнього аудіо, отриманого або надісланого мостом

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Скажи рівно так: Я тут і слухаю."
}
```

## Консультація агента realtime

Режим Chrome realtime оптимізований для живого голосового циклу. Provider realtime voice
чує аудіо зустрічі й говорить через налаштований аудіоміст.
Коли моделі realtime потрібні глибше reasoning, поточна інформація або звичайні
інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент consult запускає за лаштунками звичайного агента OpenClaw із контекстом
нещодавнього transcript зустрічі й повертає коротку усну відповідь у сесію
realtime voice. Потім голосова модель може озвучити цю відповідь назад у зустріч.
Він використовує той самий спільний інструмент realtime consult, що й Voice Call.

`realtime.toolPolicy` керує запуском consult:

- `safe-read-only`: показати інструмент consult і обмежити звичайного агента
  інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: показати інструмент consult і дозволити звичайному агенту використовувати звичайну
  політику інструментів агента.
- `none`: не показувати інструмент consult моделі realtime voice.

Ключ сесії consult обмежений окремою сесією Meet, тому наступні виклики consult
можуть повторно використовувати попередній контекст consult у межах тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднався до дзвінка:

```bash
openclaw googlemeet speak meet_... "Скажи рівно так: Я тут і слухаю."
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
- `googlemeet setup` містить `chrome-node-connected`, коли `chrome-node` є
  transport за замовчуванням або коли Node закріплено.
- `nodes status` показує, що вибраний Node підключено.
- Вибраний Node оголошує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до дзвінка, а `test-speech` повертає стан Chrome з
  `inCall: true`.

Для віддаленого host Chrome, такого як macOS VM у Parallels, це найкоротша
безпечна перевірка після оновлення Gateway або VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Це доводить, що Plugin Gateway завантажено, VM Node підключено з
поточним токеном, а аудіоміст Meet доступний до того, як агент відкриє реальну вкладку зустрічі.

Для smoke-тесту Twilio використовуйте зустріч, яка показує дані для телефонного дозвону:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Очікуваний стан Twilio:

- `googlemeet setup` містить зелені перевірки `twilio-voice-call-plugin` і
  `twilio-voice-call-credentials`.
- `voicecall` доступний у CLI після перезавантаження Gateway.
- Повернена сесія має `transport: "twilio"` і `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` завершує делегований voice call.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно змінили `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway.
Поточний агент бачить лише інструменти Plugin, зареєстровані поточним процесом Gateway.

### Немає підключеного Node з підтримкою Google Meet

На host Node виконайте:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

На host Gateway схваліть Node і перевірте команди:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node має бути підключений і містити `googlemeet.chrome` плюс `browser.proxy`.
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
`gateway token mismatch`, повторно встановіть або перезапустіть Node з поточним токеном Gateway.
Для LAN Gateway це зазвичай означає:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Потім перезавантажте сервіс Node і повторно виконайте:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Браузер відкривається, але агент не може приєднатися

Запустіть `googlemeet test-speech` і перегляньте повернутий стан Chrome. Якщо там
вказано `manualActionRequired: true`, покажіть оператору `manualActionMessage`
і припиніть повторні спроби, доки дію в браузері не буде завершено.

Поширені ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису host Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’являється нативний запит дозволу Chrome.
- Закрити або виправити завислий діалог дозволів Meet.

Не повідомляйте «не виконано вхід», лише тому що Meet показує «Do you want people to
hear you in the meeting?». Це проміжний екран вибору аудіо Meet; OpenClaw
натискає **Use microphone** через автоматизацію браузера, коли це можливо, і далі чекає
реального стану зустрічі. Для fallback створення лише через браузер OpenClaw
може натиснути **Continue without microphone**, оскільки для створення URL не потрібен
аудіошлях realtime.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує endpoint Google Meet API `spaces.create`,
коли налаштовано облікові дані OAuth. Без облікових даних OAuth він переходить до
fallback через браузер на закріпленому Chrome Node. Підтвердьте:

- Для створення через API: налаштовано `oauth.clientId` і `oauth.refreshToken`,
  або присутні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було створено після додавання
  підтримки створення. Старіші токени можуть не мати scope `meetings.space.created`; повторно виконайте
  `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для fallback через браузер: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений Node з `browser.proxy` і
  `googlemeet.chrome`.
- Для fallback через браузер: профіль Chrome OpenClaw на цьому Node увійшов
  у Google і може відкрити `https://meet.google.com/new`.
- Для fallback через браузер: повторні спроби повторно використовують наявну вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google перед відкриттям нової вкладки. Якщо в агента стався тайм-аут,
  повторіть виклик інструмента, а не відкривайте вручну ще одну вкладку Meet.
- Для fallback через браузер: якщо інструмент повертає `manualActionRequired: true`, використовуйте
  повернуті `browser.nodeId`, `browser.targetId`, `browserUrl` і
  `manualActionMessage`, щоб спрямувати оператора. Не повторюйте спроби в циклі, доки цю
  дію не буде завершено.
- Для fallback через браузер: якщо Meet показує «Do you want people to hear you in the
  meeting?», залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для
  fallback лише створення, **Continue without microphone** через автоматизацію
  браузера й продовжити очікування згенерованого URL Meet. Якщо це не вдається, у
  помилці має згадуватися `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте шлях realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "realtime"` для прослуховування/відповіді голосом. `mode: "transcribe"` навмисно
не запускає duplex-міст realtime voice.

Також перевірте:

- На host Gateway доступний ключ provider-а realtime, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видно на host Chrome.
- `rec` і `play` існують на host Chrome.
- Мікрофон і динамік Meet маршрутизовано через віртуальний аудіошлях, який використовує
  OpenClaw.

`googlemeet doctor [session-id]` виводить сесію, Node, стан in-call,
причину ручної дії, підключення provider-а realtime, `realtimeReady`, активність
аудіовходу/аудіовиходу, часові мітки останнього аудіо, лічильники байтів і URL браузера.
Використовуйте `googlemeet status [session-id]`, коли вам потрібен сирий JSON.

Якщо в агента стався тайм-аут і ви бачите, що вкладка Meet уже відкрита, перевірте цю вкладку
без відкриття нової:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує й перевіряє
наявну вкладку Meet на налаштованому Chrome Node. Вона не відкриває нову вкладку і не
створює нову сесію; вона повідомляє про поточний блокер, наприклад вхід, допуск,
дозволи або стан вибору аудіо. Команда CLI звертається до налаштованого
Gateway, тому Gateway має бути запущений, а Chrome Node має бути підключений.

### Не проходять перевірки налаштування Twilio

`twilio-voice-call-plugin` не проходить, коли `voice-call` не дозволено або не увімкнено.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` не проходить, коли backend Twilio не має account
SID, auth token або номера абонента. Задайте це на host Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Потім перезапустіть або перезавантажте Gateway і виконайте:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` за замовчуванням перевіряє лише готовність. Щоб виконати dry-run для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли ви навмисно хочете здійснити справжній вихідний
дзвінок-сповіщення:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Дзвінок Twilio починається, але ніколи не входить у зустріч

Підтвердьте, що подія Meet показує дані для телефонного дозвону. Передайте точний номер
для дозвону й PIN або custom-послідовність DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початковий `w` або коми в `--dtmf-sequence`, якщо provider-у потрібна пауза
перед введенням PIN.

## Примітки

Офіційний media API Google Meet орієнтований на прийом, тож мовлення в дзвінок Meet
усе ще потребує шляху учасника. Цей Plugin робить цю межу видимою:
Chrome відповідає за участь через браузер і локальну маршрутизацію аудіо; Twilio відповідає за
участь через телефонний дозвін.

Режим Chrome realtime потребує одного з такого:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw володіє
  мостом моделі realtime і передає аудіо 8 кГц G.711 mu-law між цими
  командами та вибраним provider-ом realtime voice.
- `chrome.audioBridgeCommand`: зовнішня команда моста керує всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого daemon.

Для чистого duplex-аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може повертати аудіо інших учасників назад у дзвінок.

`googlemeet speak` запускає активний аудіоміст realtime для сесії Chrome.
`googlemeet leave` зупиняє цей міст. Для сесій Twilio, делегованих через Plugin Voice Call,
`leave` також завершує базовий voice call.

## Пов’язане

- [Plugin Voice Call](/uk/plugins/voice-call)
- [Talk mode](/uk/nodes/talk)
- [Створення Plugin](/uk/plugins/building-plugins)
