---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий дзвінок Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт для Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio з типовими налаштуваннями голосового зв’язку в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-27T13:07:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42cb0b96ad0c691ee2d44bcfc302010f8668c5973ac4fe2d85049d824f2dd4fb
    source_path: plugins/google-meet.md
    workflow: 15
---

Підтримка учасників Google Meet для OpenClaw — Plugin навмисно є явним за дизайном:

- Він приєднується лише за явним URL `https://meet.google.com/...`.
- Він може створити новий простір Meet через API Google Meet, а потім приєднатися за поверненим URL.
- Голосовий режим `realtime` є типовим режимом.
- Голос у режимі реального часу може повертатися до повноцінного агента OpenClaw, коли потрібні глибше міркування або інструменти.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `realtime` для живого прослуховування/зворотного мовлення або `transcribe`, щоб приєднатися/керувати браузером без голосового мосту реального часу.
- Автентифікація починається як персональний Google OAuth або вже виконаний вхід у профілі Chrome.
- Автоматичного оголошення згоди немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на спареному вузлі.
- Twilio приймає номер для дозвону, а також необов’язковий PIN або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших сценаріїв телеконференцій агента.

## Швидкий старт

Установіть локальні аудіозалежності й налаштуйте постачальника голосу реального часу для бекенда. OpenAI є типовим варіантом; Google Gemini Live також працює з `realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` установлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор Homebrew вимагає перезавантаження, перш ніж macOS покаже цей пристрій:

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

Вивід налаштування призначений для читання агентом. Він повідомляє про профіль Chrome, аудіоміст, прив’язку до вузла, відкладений вступ у `realtime` і, якщо налаштовано делегування Twilio, чи готові Plugin `voice-call` і облікові дані Twilio.
Розглядайте будь-яку перевірку `ok: false` як блокувальну, перш ніж просити агента приєднатися.
Використовуйте `openclaw googlemeet setup --json` для скриптів або машинозчитуваного виводу.
Використовуйте `--transport chrome`, `--transport chrome-node` або `--transport twilio`, щоб попередньо перевірити конкретний транспорт, перш ніж агент спробує його використати.

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

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це найбільш детермінований шлях, який не залежить від стану UI браузера.
- Запасний варіант через браузер: використовується, коли облікові дані OAuth відсутні. OpenClaw використовує закріплений вузол Chrome, відкриває `https://meet.google.com/new`, чекає, поки Google перенаправить на справжній URL із кодом зустрічі, а потім повертає цей URL. Цей шлях вимагає, щоб профіль OpenClaw Chrome на вузлі вже мав виконаний вхід у Google.
  Автоматизація браузера обробляє власний початковий запит Meet на доступ до мікрофона; цей запит не вважається збоєм входу в Google.
  Потоки приєднання й створення також намагаються повторно використати наявну вкладку Meet перед відкриттям нової. Під час зіставлення ігноруються нешкідливі рядки запиту URL, як-от `authuser`, тому повторна спроба агента має сфокусувати вже відкриту зустріч замість створення другої вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти могли пояснити, який шлях було використано. `create` типово приєднується до нової зустрічі й повертає `joined: true` разом із сеансом приєднання. Щоб лише отримати URL, використовуйте `create --no-join` у CLI або передайте `"join": false` в інструменті.

Або скажіть агенту: "Створи Google Meet, приєднайся до нього з голосом у реальному часі й надішли мені посилання." Агент має викликати `google_meet` з `action: "create"`, а потім поділитися поверненим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Для приєднання лише для спостереження/керування браузером установіть `"mode": "transcribe"`. Це не запускає двобічний міст моделі реального часу, тож він не відповідатиме голосом у зустрічі.

Під час сеансів у режимі реального часу стан `google_meet` включає дані про стан браузера й аудіомоста, такі як `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, часові мітки останнього вхідного/вихідного сигналу, лічильники байтів і стан закриття моста. Якщо з’являється безпечний запит сторінки Meet, автоматизація браузера обробляє його, коли це можливо. Запити на вхід, допуск від хоста та запити дозволів браузера/ОС повідомляються як ручна дія з причиною та повідомленням, яке агент має передати далі.

Локальні приєднання через Chrome використовують профіль браузера OpenClaw, у якому вже виконано вхід. У Meet виберіть `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого двобічного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного пристрою BlackHole достатньо для першого smoke-тесту, але може виникати відлуння.

### Локальний Gateway + Chrome у Parallels

Вам **не** потрібен повний Gateway OpenClaw або ключ API моделі всередині macOS VM лише для того, щоб Chrome у VM був керованим. Запустіть Gateway і агента локально, а потім запустіть вузол у VM. Один раз увімкніть у VM вбудований Plugin, щоб вузол оголошував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, постачальник `realtime` і конфігурація Plugin Google Meet.
- macOS VM у Parallels: OpenClaw CLI/вузол, Google Chrome, SoX, BlackHole 2ch і профіль Chrome з виконаним входом у Google.
- Не потрібно у VM: служба Gateway, конфігурація агента, ключ OpenAI/GPT або налаштування постачальника моделі.

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

Установіть або оновіть OpenClaw у VM, а потім увімкніть там вбудований Plugin:

```bash
openclaw plugins enable google-meet
```

Запустіть вузол у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це IP-адреса LAN і ви не використовуєте TLS, вузол відхилить незашифрований WebSocket, якщо ви явно не дозволите це для довіреної приватної мережі:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це змінна середовища процесу, а не параметр `openclaw.json`. `openclaw node install` зберігає її в середовищі LaunchAgent, якщо вона присутня в команді встановлення.

Схваліть вузол із хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить вузол і що він оголошує і `googlemeet.chrome`, і можливість браузера/`browser.proxy`:

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

Тепер приєднуйтеся як звичайно з хоста Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

або попросіть агента використати інструмент `google_meet` з `transport: "chrome-node"`.

Для одно-командного smoke-тесту, який створює або повторно використовує сеанс, промовляє відому фразу й друкує стан сеансу:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання автоматизація браузера OpenClaw заповнює ім’я гостя, натискає Join/Ask to join і погоджується з початковим вибором Meet "Use microphone", коли з’являється цей запит.
Під час створення зустрічі лише через браузер вона також може пройти далі повз той самий запит без мікрофона, якщо Meet не показує кнопку використання мікрофона.
Якщо в профілі браузера не виконано вхід, Meet чекає на допуск від хоста, Chrome потребує дозволу на мікрофон/камеру або Meet застряг на запиті, який автоматизація не змогла розв’язати, результат join/test-speech повідомляє
`manualActionRequired: true` з `manualActionReason` і
`manualActionMessage`. Агенти мають припинити повторювати спроби приєднання, повідомити саме це повідомлення разом із поточними `browserUrl`/`browserTitle` і повторити спробу лише після завершення ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає вузол лише тоді, коли підключено рівно один вузол, який оголошує і `googlemeet.chrome`, і керування браузером. Якщо підключено кілька придатних вузлів, установіть `chromeNode.node` на id вузла, відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `Configured Google Meet node ... is not usable: offline`: закріплений вузол відомий Gateway, але недоступний. Агенти мають розглядати цей вузол як діагностичний стан, а не як придатний хост Chrome, і повідомляти про блокувальну проблему налаштування замість переходу на інший транспорт, якщо користувач прямо цього не просив.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM, схваліть спарювання та переконайтеся, що у VM було виконано `openclaw plugins enable google-meet` і `openclaw plugins enable browser`. Також підтвердьте, що хост Gateway дозволяє обидві команди вузла за допомогою
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: установіть `blackhole-2ch` на хості, який перевіряється, і перезавантажте його перед використанням локального аудіо Chrome.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch` у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або залиште встановленим `chrome.guestName` для гостьового приєднання. Автоматичне гостьове приєднання використовує автоматизацію браузера OpenClaw через проксі браузера вузла; переконайтеся, що конфігурація браузера вузла вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або іменований профіль наявного сеансу.
- Дубльовані вкладки Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw активує наявну вкладку для того самого URL Meet перед відкриттям нової, а створення зустрічі в браузері повторно використовує вкладку `https://meet.google.com/new`, що вже в процесі, або вкладку запиту облікового запису Google перед відкриттям ще однієї.
- Немає аудіо: у Meet спрямовуйте мікрофон/динамік через шлях віртуального аудіопристрою, який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію у стилі Loopback для чистого двобічного аудіо.

## Примітки щодо встановлення

Типовий режим Chrome realtime використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для роботи з аудіо. Plugin використовує її команди `rec` і `play` для типового аудіомоста 24 кГц PCM16.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`, через який Chrome/Meet може маршрутизувати звук.

OpenClaw не постачається разом із жодним із цих пакетів і не розповсюджує їх. У документації користувачам пропонується встановлювати їх як залежності хоста через Homebrew. SoX ліцензовано як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole — за GPL-3.0. Якщо ви збираєте інсталятор або appliance, який постачається з BlackHole разом з OpenClaw, перегляньте умови ліцензування BlackHole в першоджерелі або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL Meet через керування браузером OpenClaw і приєднується
як профіль браузера OpenClaw, у якому вже виконано вхід. На macOS Plugin перевіряє
наявність `BlackHole 2ch` перед запуском. Якщо налаштовано, він також запускає
команду перевірки стану аудіомоста й команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли
Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють
на спареному вузлі, наприклад у macOS VM Parallels. Для локального Chrome виберіть
профіль через `browser.defaultProfile`; `chrome.browserProfile` передається на хости
`chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона й динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується з помилкою налаштування
замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це суворий план набору, делегований Plugin `voice-call`. Він
не аналізує сторінки Meet, щоб знаходити телефонні номери.

Використовуйте його, коли участь через Chrome недоступна або ви хочете
резервний варіант дозвону телефоном. Google Meet має показувати номер для
дозвону й PIN для зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

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
дозволяє не зберігати секрети в `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни
конфігурації Plugin не з’являються в уже запущеному процесі Gateway, доки він не перезавантажиться.

Потім перевірте:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Коли делегування Twilio підключене, `googlemeet setup` включає успішні перевірки
`twilio-voice-call-plugin` і `twilio-voice-call-credentials`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Використовуйте `--dtmf-sequence`, коли зустріч потребує нетипової послідовності:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth і попередня перевірка

OAuth є необов’язковим для створення посилання Meet, оскільки `googlemeet create` може
використовувати запасний варіант через автоматизацію браузера. Налаштуйте OAuth, коли вам потрібні офіційне створення через API,
розв’язання просторів або перевірки попередньої готовності Meet Media API.

Доступ до API Google Meet використовує OAuth користувача: створіть клієнт Google Cloud OAuth,
запросіть потрібні scope, авторизуйте обліковий запис Google, а потім збережіть
отриманий refresh token у конфігурації Plugin Google Meet або надайте
змінні середовища `OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання через Chrome. Транспорти Chrome і Chrome-node
усе одно приєднуються через профіль Chrome, у якому виконано вхід, BlackHole/SoX
і підключений вузол, коли ви використовуєте участь через браузер. OAuth потрібен лише для офіційного
шляху API Google Meet: створення просторів зустрічей, розв’язання просторів і запуск перевірок
попередньої готовності Meet Media API.

### Створення облікових даних Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** — найпростіший варіант для організації Google Workspace.
   - **External** підходить для персональних/тестових налаштувань; поки застосунок перебуває в режимі Testing,
     додайте кожен обліковий запис Google, який авторизуватиме застосунок, як тестового користувача.
4. Додайте scope, які запитує OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Створіть OAuth client ID.
   - Тип застосунку: **Web application**.
   - Авторизований redirect URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Скопіюйте client ID і client secret.

`meetings.space.created` потрібен для Google Meet `spaces.create`.
`meetings.space.readonly` дозволяє OpenClaw розв’язувати URL/коди Meet у простори.
`meetings.conference.media.readonly` потрібен для попередньої перевірки Meet Media API і роботи з медіа;
Google може вимагати участі в Developer Preview для фактичного використання Media API.
Якщо вам потрібні лише приєднання через Chrome на основі браузера, повністю пропустіть OAuth.

### Отримання refresh token

Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, або передайте їх як
змінні середовища, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` з refresh token. Вона використовує PKCE,
localhost callback на `http://localhost:8085/oauth2callback` і ручний
потік копіювання/вставлення з `--manual`.

Приклади:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Використовуйте ручний режим, коли браузер не може досягти локального callback:

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

Надавайте перевагу змінним середовища, якщо не хочете зберігати refresh token у конфігурації.
Якщо присутні і значення конфігурації, і значення середовища, Plugin спочатку використовує конфігурацію,
а потім запасний варіант із середовища.

Згода OAuth включає створення просторів Meet, доступ на читання просторів Meet і
доступ на читання медіаданих конференцій Meet. Якщо ви автентифікувалися до появи підтримки
створення зустрічей, повторно виконайте `openclaw googlemeet auth login --json`, щоб refresh
token мав scope `meetings.space.created`.

### Перевірка OAuth за допомогою doctor

Запустіть doctor для OAuth, коли вам потрібна швидка перевірка працездатності без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує runtime Chrome і не потребує підключеного вузла Chrome. Воно
перевіряє, що конфігурація OAuth існує і що refresh token може отримати access
token. Звіт JSON містить лише поля стану, такі як `ok`, `configured`,
`tokenSource`, `expiresAt` і повідомлення перевірок; access
token, refresh token або client secret не виводяться.

Поширені результати:

| Перевірка            | Значення                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Присутні `oauth.clientId` плюс `oauth.refreshToken` або кешований access token.        |
| `oauth-token`        | Кешований access token ще дійсний, або refresh token отримав новий access token.       |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` успішно розв’язала наявний простір Meet.            |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий простір Meet.                   |

Щоб також підтвердити ввімкнення API Google Meet і scope `spaces.create`,
запустіть перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює тимчасовий URL Meet. Використовуйте його, коли потрібно підтвердити,
що в проєкті Google Cloud увімкнено Meet API і що авторизований
обліковий запис має scope `meetings.space.created`.

Щоб підтвердити доступ на читання для наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` підтверджують доступ на читання до наявного
простору, до якого має доступ авторизований обліковий запис Google. `403` від цих перевірок
зазвичай означає, що Google Meet REST API вимкнено, refresh token із наданою згодою
не має потрібного scope або обліковий запис Google не має доступу до цього простору Meet.
Помилка refresh token означає, що потрібно знову виконати `openclaw googlemeet auth login
--json` і зберегти новий блок `oauth`.

Для запасного варіанта через браузер облікові дані OAuth не потрібні. У цьому режимі Google
auth береться з профілю Chrome, у якому виконано вхід, на вибраному вузлі, а не з
конфігурації OpenClaw.

Як запасні варіанти приймаються такі змінні середовища:

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

З `--meeting` команди `artifacts` і `attendance` типово використовують
найновіший запис конференції. Передайте `--all-conference-records`, якщо хочете отримати всі збережені записи
для цієї зустрічі.

Пошук у календарі може розв’язати URL зустрічі з Google Calendar перед читанням
артефактів Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` шукає в сьогоднішньому календарі `primary` подію Calendar з
посиланням Google Meet. Використовуйте `--event <query>` для пошуку відповідного тексту події, а
`--calendar <id>` — для неосновного календаря. Пошук у календарі потребує нового
входу OAuth, який включає scope readonly для подій Calendar.
`calendar-events` попередньо показує відповідні події Meet і позначає подію, яку
виберуть `latest`, `artifacts`, `attendance` або `export`.

Якщо ви вже знаєте id запису конференції, звертайтеся до нього безпосередньо:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Запишіть зрозумілий звіт:

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

`artifacts` повертає метадані запису конференції, а також метадані ресурсів учасників,
запису, стенограми, структурованих записів стенограми й розумних нотаток, коли
Google надає їх для цієї зустрічі. Використовуйте `--no-transcript-entries`, щоб пропустити
пошук записів для великих зустрічей. `attendance` розгортає учасників у
рядки сеансів учасників із часом першої/останньої появи, загальною тривалістю сеансу,
прапорцями запізнення/раннього виходу та об’єднанням дублікатів ресурсів учасників за обліковим записом,
у якому виконано вхід, або відображуваним іменем. Передайте `--no-merge-duplicates`, щоб залишити сирі ресурси учасників
окремо, `--late-after-minutes` для налаштування визначення запізнення і
`--early-before-minutes` для налаштування визначення раннього виходу.

`export` записує теку, що містить `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`.
`manifest.json` фіксує вибрані вхідні дані, параметри експорту, записи конференції,
вихідні файли, лічильники, джерело токена, подію Calendar, якщо її було використано, і всі
попередження про часткове отримання даних. Передайте `--zip`, щоб також записати переносимий архів поруч
із текою. Передайте `--include-doc-bodies`, щоб експортувати текст пов’язаних Google Docs
для стенограми й розумних нотаток через Google Drive `files.export`; для цього потрібен
новий вхід OAuth, який включає scope readonly для Drive Meet. Без
`--include-doc-bodies` експорт містить лише метадані Meet і структуровані
записи стенограми. Якщо Google повертає часткову помилку артефакту, наприклад помилку
переліку розумних нотаток, запису стенограми або тіла документа Drive, summary і
manifest зберігають попередження замість того, щоб завершити весь експорт помилкою.
Використовуйте `--dry-run`, щоб отримати ті самі дані про артефакти/відвідуваність і вивести
JSON manifest без створення теки чи ZIP. Це корисно перед записом
великого експорту або коли агенту потрібні лише лічильники, вибрані записи та
попередження.

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

Установіть `"dryRun": true`, щоб повернути лише manifest експорту й пропустити запис файлів.

Запустіть захищений live smoke для реальної збереженої зустрічі:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Середовище live smoke:

- `OPENCLAW_LIVE_TEST=1` вмикає захищені live-тести.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` вказує на збережений URL Meet, код або
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID` надає OAuth
  client id.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN` надає
  refresh token.
- Необов’язково: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` і
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` використовують ті самі резервні назви
  без префікса `OPENCLAW_`.

Базовому live smoke для артефактів/відвідуваності потрібні
`https://www.googleapis.com/auth/meetings.space.readonly` і
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Для пошуку в Calendar
потрібен `https://www.googleapis.com/auth/calendar.events.readonly`. Для експорту
тіла документів Drive потрібен
`https://www.googleapis.com/auth/drive.meet.readonly`.

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда виводить новий `meeting uri`, джерело та сеанс приєднання. За наявності облікових даних OAuth
вона використовує офіційний API Google Meet. Без облікових даних OAuth вона
використовує профіль браузера із виконаним входом на закріпленому вузлі Chrome як резервний варіант. Агенти можуть
використовувати інструмент `google_meet` з `action: "create"`, щоб створити й приєднатися за один
крок. Щоб створити лише URL, передайте `"join": false`.

Приклад виводу JSON для резервного варіанту через браузер:

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

Якщо резервний варіант через браузер натрапляє на вхід у Google або блокування дозволів Meet до того,
як зможе створити URL, метод Gateway повертає відповідь із помилкою, а
інструмент `google_meet` повертає структуровані деталі замість простого рядка:

```json
{
  "source": "browser",
  "error": "google-login-required: Увійдіть у Google в профілі браузера OpenClaw, а потім повторіть спробу створення зустрічі.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Увійдіть у Google в профілі браузера OpenClaw, а потім повторіть спробу створення зустрічі.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Вхід - Облікові записи Google"
  }
}
```

Коли агент бачить `manualActionRequired: true`, він має повідомити
`manualActionMessage` разом із контекстом вузла/вкладки браузера й припинити відкривати нові
вкладки Meet, доки оператор не завершить крок у браузері.

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

Створення Meet типово також приєднує до нього. Транспорт Chrome або Chrome-node усе одно
потребує профілю Google Chrome, у якому виконано вхід, щоб приєднатися через браузер. Якщо
в профілі виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або
помилку резервного варіанту через браузер і просить оператора завершити вхід у Google перед
повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
проєкт, OAuth principal і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для медіа-API Meet.

## Конфігурація

Типовому шляху Chrome realtime потрібні лише ввімкнений Plugin, BlackHole, SoX
і ключ постачальника голосу реального часу для бекенда. OpenAI є типовим варіантом; установіть
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
- `chromeNode.node`: необов’язковий id/ім’я/IP вузла для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, яке використовується на екрані гостя Meet
  без входу
- `chrome.autoJoin: true`: заповнення імені гостя та натискання Join Now у режимі best-effort
  через автоматизацію браузера OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, поки вкладка Meet повідомить про стан in-call,
  перш ніж буде запущено вступ `realtime`
- `chrome.audioFormat: "pcm16-24khz"`: аудіоформат для пари команд. Використовуйте
  `"g711-ulaw-8khz"` лише для застарілих/нестандартних пар команд, які все ще видають
  телефонне аудіо.
- `chrome.audioInputCommand`: команда SoX `rec`, що записує аудіо у форматі
  `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX `play`, що відтворює аудіо у форматі
  `chrome.audioFormat`
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли міст realtime
  підключається; установіть `""`, щоб приєднатися беззвучно
- `realtime.agentId`: необов’язковий id агента OpenClaw для
  `openclaw_agent_consult`; типовим є `main`

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

`voiceCall.enabled` типово має значення `true`; із транспортом Twilio він делегує
фактичний PSTN-дзвінок і DTMF Plugin `voice-call`. Якщо `voice-call` не
увімкнено, Google Meet все одно може перевіряти та записувати план набору, але не може
здійснити дзвінок Twilio.

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
VM. В обох випадках модель realtime і `openclaw_agent_consult` працюють на
хості Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сеанси або перевірити ID сеансу. Використовуйте
`action: "speak"` із `sessionId` і `message`, щоб змусити агента realtime
негайно заговорити. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сеанс,
запустити відому фразу й повернути стан `inCall`, якщо хост Chrome може
про нього повідомити. Використовуйте `action: "leave"`, щоб позначити сеанс завершеним.

`status` включає стан Chrome, коли він доступний:

- `inCall`: Chrome, імовірно, перебуває всередині дзвінка Meet
- `micMuted`: стан мікрофона Meet у режимі best-effort
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: у
  профілі браузера потрібен ручний вхід, допуск хоста Meet, дозволи або
  відновлення керування браузером, перш ніж мовлення зможе працювати
- `providerConnected` / `realtimeReady`: стан голосового мосту realtime
- `lastInputAt` / `lastOutputAt`: останнє аудіо, отримане мостом або надіслане ним

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Консультація агента realtime

Режим Chrome realtime оптимізовано для живого голосового циклу. Постачальник голосу realtime
чує аудіо зустрічі та говорить через налаштований аудіоміст.
Коли моделі realtime потрібні глибші міркування, актуальна інформація або звичайні
інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw у фоновому режимі з нещодавнім
контекстом стенограми зустрічі й повертає стислу усну відповідь у сеанс голосу realtime. Потім голосова модель може
озвучити цю відповідь назад у зустріч. Він використовує той самий спільний інструмент консультації realtime, що й Voice Call.

Типово консультації виконуються для агента `main`. Установіть `realtime.agentId`, коли
ланка Meet має консультуватися з окремим робочим простором агента OpenClaw, типовими налаштуваннями моделі,
політикою інструментів, пам’яттю та історією сеансів.

`realtime.toolPolicy` керує виконанням консультації:

- `safe-read-only`: показувати інструмент консультації й обмежувати звичайного агента
  до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: показувати інструмент консультації й дозволяти звичайному агенту використовувати звичайну
  політику інструментів агента.
- `none`: не показувати інструмент консультації моделі голосу realtime.

Ключ сеансу консультації має область дії в межах кожного сеансу Meet, тому наступні виклики консультації
можуть повторно використовувати попередній контекст консультації під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднався до дзвінка:

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

Використовуйте цю послідовність перед передачею зустрічі агенту без нагляду:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Очікуваний стан Chrome-node:

- `googlemeet setup` повністю зелений.
- `googlemeet setup` включає `chrome-node-connected`, коли `chrome-node` є
  типовим транспортом або коли вузол закріплено.
- `nodes status` показує, що вибраний вузол підключено.
- Вибраний вузол оголошує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до дзвінка, а `test-speech` повертає стан Chrome з
  `inCall: true`.

Для віддаленого хоста Chrome, наприклад macOS VM у Parallels, це найкоротша
безпечна перевірка після оновлення Gateway або VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Це підтверджує, що Plugin Gateway завантажено, вузол VM підключено з
поточним токеном і аудіоміст Meet доступний до того, як агент відкриє
справжню вкладку зустрічі.

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
- Повернений сеанс має `transport: "twilio"` і `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` завершує делегований голосовий дзвінок.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно змінили `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway.
Запущений агент бачить лише інструменти Plugin, зареєстровані поточним процесом
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

Вузол має бути підключений і перелічувати `googlemeet.chrome` та `browser.proxy`.
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

Якщо `googlemeet setup` завершується помилкою `chrome-node-connected` або журнал Gateway повідомляє
`gateway token mismatch`, перевстановіть або перезапустіть вузол із поточним токеном Gateway.
Для Gateway у LAN це зазвичай означає:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Потім перезавантажте службу вузла й повторно виконайте:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Браузер відкривається, але агент не може приєднатися

Запустіть `googlemeet test-speech` і перевірте повернений стан Chrome. Якщо він
повідомляє `manualActionRequired: true`, покажіть оператору `manualActionMessage`
і припиніть повторні спроби, доки дію в браузері не буде завершено.

Поширені ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису хоста Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’являється рідний
  запит дозволів Chrome.
- Закрити або виправити зависле діалогове вікно дозволів Meet.

Не повідомляйте "not signed in" лише тому, що Meet показує "Do you want people to
hear you in the meeting?" Це проміжний екран вибору аудіо в Meet; OpenClaw
натискає **Use microphone** через автоматизацію браузера, коли це можливо, і продовжує
чекати на справжній стан зустрічі. Для резервного варіанту створення лише через браузер OpenClaw
може натиснути **Continue without microphone**, оскільки для створення URL не потрібен
аудіошлях realtime.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує кінцеву точку Google Meet API `spaces.create`,
коли налаштовано облікові дані OAuth. Без облікових даних OAuth він повертається
до браузера на закріпленому вузлі Chrome. Підтвердьте:

- Для створення через API: налаштовано `oauth.clientId` і `oauth.refreshToken`,
  або присутні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було отримано після додавання
  підтримки створення. У старіших токенів може не бути scope `meetings.space.created`; повторно виконайте
  `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для резервного варіанту через браузер: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений вузол із `browser.proxy` і
  `googlemeet.chrome`.
- Для резервного варіанту через браузер: у профілі OpenClaw Chrome на цьому вузлі виконано вхід
  у Google, і він може відкрити `https://meet.google.com/new`.
- Для резервного варіанту через браузер: повторні спроби повторно використовують наявну вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google перед відкриттям нової вкладки. Якщо агент перевищив час очікування,
  повторіть виклик інструмента, а не відкривайте вручну ще одну вкладку Meet.
- Для резервного варіанту через браузер: якщо інструмент повертає `manualActionRequired: true`, використовуйте
  повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і
  `manualActionMessage`, щоб зорієнтувати оператора. Не повторюйте спроби в циклі, доки цю
  дію не буде завершено.
- Для резервного варіанту через браузер: якщо Meet показує "Do you want people to hear you in the
  meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для
  резервного варіанту лише створення, **Continue without microphone** через браузерну
  автоматизацію й продовжити чекати на згенерований URL Meet. Якщо він не може цього зробити, у
  помилці має згадуватися `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте шлях realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "realtime"` для прослуховування/зворотного мовлення. `mode: "transcribe"` навмисно
не запускає двобічний голосовий міст realtime.

Також перевірте:

- На хості Gateway доступний ключ постачальника realtime, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `rec` і `play` існують на хості Chrome.
- Мікрофон і динамік Meet спрямовані через віртуальний аудіошлях, який використовує
  OpenClaw.

`googlemeet doctor [session-id]` виводить сеанс, вузол, стан in-call,
причину ручної дії, підключення постачальника realtime, `realtimeReady`, активність аудіовходу/виходу,
часові мітки останнього аудіо, лічильники байтів і URL браузера.
Використовуйте `googlemeet status [session-id]`, коли потрібен сирий JSON. Використовуйте
`googlemeet doctor --oauth`, коли потрібно перевірити оновлення OAuth Google Meet
без показу токенів; додайте `--meeting` або `--create-space`, коли також потрібне підтвердження
Google Meet API.

Якщо в агента стався тайм-аут і ви бачите, що вкладка Meet уже відкрита, перевірте цю вкладку
без відкриття нової:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує й перевіряє
наявну вкладку Meet для вибраного транспорту. З `chrome` вона використовує локальне
керування браузером через Gateway; з `chrome-node` — налаштований
вузол Chrome. Вона не відкриває нову вкладку й не створює новий сеанс; натомість повідомляє про
поточну перешкоду, наприклад вхід, допуск, дозволи або стан вибору аудіо.
Команда CLI звертається до налаштованого Gateway, тому Gateway має бути запущений;
для `chrome-node` також потрібно, щоб вузол Chrome був підключений.

### Перевірки налаштування Twilio завершуються помилкою

Помилка `twilio-voice-call-plugin` виникає, коли `voice-call` не дозволено або не ввімкнено.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

Помилка `twilio-voice-call-credentials` виникає, коли у бекенді Twilio відсутні account
SID, auth token або номер абонента. Установіть їх на хості Gateway:

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

`voicecall smoke` типово перевіряє лише готовність. Щоб виконати dry-run для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли навмисно хочете здійснити реальний вихідний
дзвінок-сповіщення:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Дзвінок Twilio починається, але ніколи не входить у зустріч

Підтвердьте, що подія Meet показує дані для телефонного дозвону. Передайте точний номер
для дозвону й PIN або власну послідовність DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початковий `w` або коми в `--dtmf-sequence`, якщо постачальнику потрібна пауза
перед введенням PIN.

## Примітки

Офіційний медіа-API Google Meet орієнтований на прийом, тому для мовлення в дзвінок Meet
усе одно потрібен шлях учасника. Цей Plugin зберігає цю межу видимою:
Chrome обробляє участь через браузер і локальну маршрутизацію аудіо; Twilio обробляє
участь через телефонний дозвін.

Режиму Chrome realtime потрібне одне з такого:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує
  мостом моделі realtime і передає аудіо у форматі `chrome.audioFormat` між цими
  командами та вибраним постачальником голосу realtime. Типовий шлях Chrome — це
  24 кГц PCM16; 8 кГц G.711 mu-law залишається доступним для застарілих пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда моста керує всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого двобічного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може повертати відлуння інших учасників назад у дзвінок.

`googlemeet speak` запускає активний аудіоміст realtime для сеансу
Chrome. `googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих
через Plugin Voice Call, `leave` також завершує базовий голосовий дзвінок.

## Пов’язане

- [Plugin Voice call](/uk/plugins/voice-call)
- [Режим talk](/uk/nodes/talk)
- [Створення Plugin](/uk/plugins/building-plugins)
