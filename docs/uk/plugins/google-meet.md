---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до виклику Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий виклик Google Meet
    - Ви налаштовуєте Chrome, Chrome Node або Twilio як транспорт для Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL Google Meet через Chrome або Twilio зі стандартними параметрами голосу в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-27T12:53:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a7f6cd2837bcf30270f73fdaf7b269c93f3338a896f919c29346791ef0b85fe
    source_path: plugins/google-meet.md
    workflow: 15
---

Підтримка учасника Google Meet для OpenClaw — Plugin навмисно зроблено явним:

- Він приєднується лише до явного URL `https://meet.google.com/...`.
- Він може створити новий простір Meet через API Google Meet, а потім приєднатися за
  повернутим URL.
- `realtime` voice — це стандартний режим.
- Голос у режимі реального часу може повертатися до повного агента OpenClaw, коли потрібні глибше
  reasoning або інструменти.
- Агенти вибирають поведінку приєднання через `mode`: використовуйте `realtime` для живого
  прослуховування/відповідей голосом, або `transcribe`, щоб приєднатися/керувати браузером без
  мосту голосу в реальному часі.
- Автентифікація починається як особистий Google OAuth або вже виконаний вхід у профіль Chrome.
- Автоматичного оголошення згоди немає.
- Стандартний аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на хості сполученого Node.
- Twilio приймає номер для дозвону та необов’язковий PIN або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших робочих процесів телеконференцій агентів.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте бекенд-провайдера голосу в реальному часі.
OpenAI використовується за замовчуванням; Google Gemini Live також працює з
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# або
export GEMINI_API_KEY=...
```

`blackhole-2ch` установлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор
Homebrew потребує перезавантаження, перш ніж macOS покаже цей пристрій:

```bash
sudo reboot
```

Після перезавантаження перевірте обидві частини:

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

Вивід setup призначено для читання агентом. Він повідомляє про профіль Chrome,
аудіоміст, прив’язку до Node, відкладене вступне повідомлення realtime, а також, коли налаштовано делегування Twilio,
чи готові Plugin `voice-call` і облікові дані Twilio.
Будь-яку перевірку з `ok: false` слід вважати блокером перед тим, як просити агента приєднатися.
Використовуйте `openclaw googlemeet setup --json` для скриптів або машинозчитуваного виводу.
Використовуйте `--transport chrome`, `--transport chrome-node` або `--transport twilio`,
щоб виконати preflight конкретного транспорту перед тим, як агент спробує його використати.

Приєднання до зустрічі:

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
  найдетермінованіший шлях, який не залежить від стану UI браузера.
- Резервний варіант через браузер: використовується, коли облікові дані OAuth відсутні. OpenClaw використовує
  прив’язаний Chrome Node, відкриває `https://meet.google.com/new`, чекає, доки Google
  перенаправить на справжній URL із кодом зустрічі, а потім повертає цей URL. Цей шлях вимагає,
  щоб профіль OpenClaw Chrome на Node уже був авторизований у Google.
  Автоматизація браузера обробляє власний початковий запит Meet на доступ до мікрофона; цей запит
  не вважається помилкою входу в Google.
  Потоки приєднання і створення також намагаються повторно використати наявну вкладку Meet перед відкриттям
  нової. Під час зіставлення ігноруються нешкідливі рядки параметрів URL, як-от `authuser`, тому
  повторна спроба агента має сфокусувати вже відкриту зустріч, а не створювати другу
  вкладку Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` типово приєднується до нової зустрічі й
повертає `joined: true` разом із сеансом приєднання. Щоб лише згенерувати URL, використовуйте
`create --no-join` у CLI або передайте `"join": false` в інструмент.

Або скажіть агенту: «Створи Google Meet, приєднайся до нього з realtime voice і надішли
мені посилання». Агент має викликати `google_meet` з `action: "create"`, а
потім поділитися повернутим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Для приєднання лише зі спостереженням/керуванням браузером установіть `"mode": "transcribe"`. Це
не запускає двосторонній модельний міст realtime, тому агент не говоритиме назад
у зустріч.

Під час сеансів realtime статус `google_meet` містить стан браузера й аудіомосту,
зокрема `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, часові позначки останнього входу/виходу,
лічильники байтів і стан закриття мосту. Якщо з’являється безпечний запит сторінки Meet,
автоматизація браузера обробляє його, коли може. Вхід, допуск хостом і запити дозволів браузера/ОС
повідомляються як ручна дія з причиною та повідомленням, яке агент має передати далі.

Chrome приєднується як авторизований профіль Chrome. У Meet виберіть `BlackHole 2ch` для
шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого двостороннього аудіо використовуйте
окремі віртуальні пристрої або граф на кшталт Loopback; одного пристрою BlackHole
достатньо для першого smoke-тесту, але він може давати луну.

### Локальний gateway + Parallels Chrome

Вам **не** потрібні повний Gateway OpenClaw або API-ключ моделі всередині macOS VM,
щоб лише VM керувала Chrome. Запустіть Gateway і агента локально, а потім запустіть
хост Node у VM. Один раз увімкніть вбудований Plugin у VM, щоб Node
оголошував команду Chrome:

Що де працює:

- Хост Gateway: Gateway OpenClaw, робочий простір агента, ключі моделі/API, провайдер
  realtime і конфігурація Plugin Google Meet.
- macOS VM у Parallels: CLI/хост Node OpenClaw, Google Chrome, SoX, BlackHole 2ch,
  і профіль Chrome з виконаним входом у Google.
- Не потрібні у VM: сервіс Gateway, конфігурація агента, ключ OpenAI/GPT або
  налаштування провайдера моделі.

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

Запустіть хост Node у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це LAN IP, і ви не використовуєте TLS, Node відхилить
незашифрований WebSocket, якщо ви явно не ввімкнете це для довіреної приватної мережі:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Використовуйте ту саму змінну середовища, коли встановлюєте Node як LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це змінна середовища процесу, а не
параметр `openclaw.json`. `openclaw node install` зберігає її в середовищі LaunchAgent,
коли вона присутня в команді встановлення.

Схваліть Node з хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить Node і що він оголошує і `googlemeet.chrome`,
і можливість браузера/`browser.proxy`:

```bash
openclaw nodes status
```

Маршрутизуйте Meet через цей Node на хості Gateway:

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

Тепер приєднуйтеся звичайним способом з хоста Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

або попросіть агента використати інструмент `google_meet` з `transport: "chrome-node"`.

Для smoke-тесту однією командою, який створює або повторно використовує сеанс, промовляє
відоме речення й виводить стан сеансу:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання автоматизація браузера OpenClaw заповнює ім’я гостя, натискає Join/Ask
to join і приймає початковий вибір Meet «Use microphone», коли з’являється цей запит.
Під час створення зустрічі лише через браузер вона також може пройти далі через
той самий запит без мікрофона, якщо Meet не показує кнопку використання мікрофона.
Якщо профіль браузера не авторизований, Meet очікує
допуску хостом, Chrome потребує дозволу на мікрофон/камеру або Meet завис на
запиті, який автоматизація не змогла розв’язати, результат join/test-speech повідомляє
`manualActionRequired: true` разом із `manualActionReason` і
`manualActionMessage`. Агенти мають припинити повторні спроби приєднання,
повідомити саме це повідомлення разом із поточними `browserUrl`/`browserTitle`,
і повторювати спробу лише після завершення ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw виконує автоматичний вибір лише тоді, коли рівно один
підключений Node оголошує і `googlemeet.chrome`, і керування браузером. Якщо
підключено кілька придатних Node, задайте `chromeNode.node` як id Node,
display name або віддалену IP-адресу.

Поширені перевірки збоїв:

- `Configured Google Meet node ... is not usable: offline`: прив’язаний Node
  відомий Gateway, але недоступний. Агенти мають трактувати цей Node як
  діагностичний стан, а не як придатний хост Chrome, і повідомляти про блокер setup
  замість переходу на інший транспорт, якщо користувач явно не просив про це.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  схваліть сполучення і переконайтеся, що в VM були виконані
  `openclaw plugins enable google-meet` і `openclaw plugins enable browser`.
  Також підтвердьте, що хост Gateway дозволяє обидві команди Node через
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: установіть `blackhole-2ch` на хості,
  який перевіряється, і перезавантажте його перед використанням локального аудіо Chrome.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch`
  у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: виконайте вхід у профіль браузера всередині VM або
  залиште `chrome.guestName` заданим для гостьового входу. Автоматичне приєднання гостя використовує автоматизацію браузера OpenClaw
  через browser proxy Node; переконайтеся, що конфігурація браузера Node
  вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або іменований профіль existing-session.
- Дубльовані вкладки Meet: залишайте `chrome.reuseExistingTab: true` увімкненим. OpenClaw
  активує наявну вкладку для того самого URL Meet перед відкриттям нової, а створення зустрічі через браузер повторно використовує вкладку `https://meet.google.com/new`, що вже виконується, або вкладку запиту облікового запису Google, перш ніж відкривати іншу.
- Немає аудіо: у Meet маршрутизуйте мікрофон/динамік через шлях віртуального аудіопристрою,
  який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію в стилі Loopback
  для чистого двостороннього аудіо.

## Примітки щодо встановлення

Стандартний режим Chrome realtime використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для аудіо. Plugin використовує її команди `rec` і `play`
  для стандартного аудіомосту 24 kHz PCM16.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`,
  через який Chrome/Meet можуть маршрутизувати звук.

OpenClaw не постачає і не розповсюджує жоден із цих пакетів. У документації користувачам пропонується
встановлювати їх як залежності хоста через Homebrew. Ліцензія SoX —
`LGPL-2.0-only AND GPL-2.0-only`; ліцензія BlackHole — GPL-3.0. Якщо ви створюєте
інсталятор або appliance, який постачає BlackHole разом з OpenClaw, перевірте
умови ліцензування BlackHole в першоджерелі або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL Meet у Google Chrome і приєднується як авторизований
профіль Chrome. На macOS Plugin перед запуском перевіряє наявність `BlackHole 2ch`.
Якщо налаштовано, він також запускає команду перевірки стану аудіомосту та команду запуску
перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway;
використовуйте `chrome-node`, коли Chrome/аудіо працюють на сполученому Node, наприклад у Parallels
macOS VM.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Маршрутизуйте аудіо мікрофона та динаміка Chrome через локальний аудіоміст
OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування,
а не мовчазним приєднанням без аудіошляху.

### Twilio

Транспорт Twilio — це суворий план набору, делегований Plugin Voice Call. Він
не аналізує сторінки Meet, щоб знайти телефонні номери.

Використовуйте його, коли участь через Chrome недоступна або коли вам потрібен резервний
варіант дозвону телефоном. Google Meet має показувати номер для дозвону телефоном і PIN для
зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

Увімкніть Plugin Voice Call на хості Gateway, а не на Chrome Node:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // або встановіть "twilio", якщо Twilio має бути стандартним значенням
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

Надайте облікові дані Twilio через середовище або конфігурацію. Середовище дозволяє
не зберігати секрети в `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни конфігурації Plugin
не з’являються в уже запущеному процесі Gateway, доки він не перезавантажиться.

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

Використовуйте `--dtmf-sequence`, коли зустріч потребує власної послідовності:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth і preflight

OAuth необов’язковий для створення посилання Meet, оскільки `googlemeet create` може
використовувати резервний варіант через автоматизацію браузера. Налаштуйте OAuth, якщо вам потрібні офіційне створення через API,
визначення простору або перевірки preflight через Meet Media API.

Доступ до Google Meet API використовує OAuth користувача: створіть OAuth-клієнт Google Cloud,
запросіть потрібні області дії, авторизуйте обліковий запис Google, а потім збережіть
отриманий refresh token у конфігурації Plugin Google Meet або надайте
змінні середовища `OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання через Chrome. Транспорти Chrome і Chrome-node
однаково приєднуються через авторизований профіль Chrome, BlackHole/SoX і підключений
Node, коли ви використовуєте участь через браузер. OAuth потрібен лише для офіційного шляху Google
Meet API: створення просторів зустрічей, визначення просторів і виконання
перевірок preflight Meet Media API.

### Створення облікових даних Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** — найпростіший варіант для організації Google Workspace.
   - **External** підходить для особистих/тестових конфігурацій; поки застосунок перебуває в режимі Testing,
     додайте кожен обліковий запис Google, який авторизуватиме застосунок, як тестового користувача.
4. Додайте області дії, які запитує OpenClaw:
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

`meetings.space.created` потрібна для Google Meet `spaces.create`.
`meetings.space.readonly` дозволяє OpenClaw визначати простори з URL/кодів Meet.
`meetings.conference.media.readonly` потрібна для preflight через Meet Media API і роботи з медіа;
для фактичного використання Media API Google може вимагати участі в Developer Preview.
Якщо вам потрібні лише приєднання через Chrome у браузері, повністю пропустіть OAuth.

### Отримання refresh token

Налаштуйте `oauth.clientId` і, за бажання, `oauth.clientSecret`, або передайте їх як
змінні середовища, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` з refresh token. Вона використовує PKCE,
localhost callback на `http://localhost:8085/oauth2callback` і ручний
потік copy/paste з `--manual`.

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

Надавайте перевагу змінним середовища, якщо не хочете зберігати refresh token у конфігурації.
Якщо присутні і значення в конфігурації, і значення середовища, Plugin спочатку визначає значення з конфігурації,
а потім використовує резервні значення середовища.

OAuth-згода включає створення просторів Meet, доступ до читання просторів Meet і доступ до читання медіа конференцій Meet.
Якщо ви проходили автентифікацію до того, як з’явилася підтримка
створення зустрічей, повторно виконайте `openclaw googlemeet auth login --json`, щоб refresh
token містив область дії `meetings.space.created`.

### Перевірка OAuth через doctor

Запустіть doctor для OAuth, коли вам потрібна швидка перевірка стану без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує runtime Chrome і не потребує підключеного Chrome Node. Команда
перевіряє, що конфігурація OAuth існує і що refresh token може отримати access
token. Звіт JSON містить лише поля стану, як-от `ok`, `configured`,
`tokenSource`, `expiresAt` і повідомлення перевірок; він не виводить access
token, refresh token або client secret.

Поширені результати:

| Перевірка            | Значення                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `oauth-config`       | Присутні `oauth.clientId` плюс `oauth.refreshToken` або кешований access token.          |
| `oauth-token`        | Кешований access token ще дійсний або refresh token отримав новий access token.          |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` визначила наявний простір Meet.                      |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий простір Meet.                    |

Щоб також довести, що Google Meet API увімкнено і що є область дії `spaces.create`, виконайте
перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює тимчасовий URL Meet. Використовуйте цю опцію, коли потрібно підтвердити,
що в проєкті Google Cloud увімкнено Meet API і що авторизований
обліковий запис має область дії `meetings.space.created`.

Щоб довести доступ для читання до наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` доводять доступ для читання до наявного
простору, до якого має доступ авторизований обліковий запис Google. `403` у цих перевірках
зазвичай означає, що Google Meet REST API вимкнено, що consented refresh token
не містить потрібної області дії або що обліковий запис Google не має доступу до цього простору Meet.
Помилка refresh token означає, що потрібно повторно виконати `openclaw googlemeet auth login
--json` і зберегти новий блок `oauth`.

Для резервного варіанта через браузер облікові дані OAuth не потрібні. У цьому режимі автентифікація Google
береться з авторизованого профілю Chrome на вибраному Node, а не з
конфігурації OpenClaw.

Як резервні значення приймаються такі змінні середовища:

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

Запустіть preflight перед роботою з медіа:

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
останній запис конференції. Передайте `--all-conference-records`, якщо вам потрібні всі збережені записи
для цієї зустрічі.

Пошук у календарі може визначити URL зустрічі з Google Calendar перед читанням
артефактів Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` шукає в сьогоднішньому календарі `primary` подію Calendar з
посиланням Google Meet. Використовуйте `--event <query>` для пошуку подій із відповідним текстом, а
`--calendar <id>` — для неосновного календаря. Пошук у календарі вимагає нового
входу OAuth, що містить область дії лише для читання подій Calendar.
`calendar-events` попередньо показує відповідні події Meet і позначає подію, яку
виберуть `latest`, `artifacts`, `attendance` або `export`.

Якщо ви вже знаєте id запису конференції, звертайтеся до нього напряму:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Напишіть зрозумілий звіт:

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

`artifacts` повертає метадані запису конференції разом із метаданими ресурсів учасників, запису,
транскрипту, структурованих записів транскрипту й smart-note, коли
Google надає їх для цієї зустрічі. Використовуйте `--no-transcript-entries`, щоб пропустити
пошук записів для великих зустрічей. `attendance` розгортає учасників у
рядки сеансів учасників із часом першої/останньої появи, загальною тривалістю сеансу,
позначками запізнення/раннього виходу та об’єднанням дублікатів ресурсів учасників за авторизованим
користувачем або display name. Передайте `--no-merge-duplicates`, щоб залишити сирі ресурси учасників
окремо, `--late-after-minutes` — щоб налаштувати визначення запізнення, і
`--early-before-minutes` — щоб налаштувати визначення раннього виходу.

`export` записує папку, що містить `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`.
`manifest.json` фіксує вибрані вхідні дані, параметри експорту, записи конференцій,
вихідні файли, кількості, джерело токена, подію Calendar, якщо її було використано, і всі
попередження про часткове отримання. Передайте `--zip`, щоб також записати переносимий архів
поруч із папкою. Передайте `--include-doc-bodies`, щоб експортувати текст пов’язаних
документів Google Docs для транскрипту і smart-note через Google Drive `files.export`; для цього потрібен
новий вхід OAuth, що містить область дії лише для читання Drive Meet. Без
`--include-doc-bodies` експорт містить лише метадані Meet і структуровані записи
транскрипту. Якщо Google повертає часткову помилку артефакту, наприклад помилку
списку smart-note, запису транскрипту або тіла документа Drive, summary і
manifest зберігають попередження замість того, щоб завершувати весь експорт помилкою.
Використовуйте `--dry-run`, щоб отримати ті самі дані artifact/attendance і вивести
JSON manifest без створення папки або ZIP. Це корисно перед записом
великого експорту або коли агенту потрібні лише кількості, вибрані записи й
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

Запустіть захищений живий smoke-тест на справжній збереженій зустрічі:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Середовище живого smoke-тесту:

- `OPENCLAW_LIVE_TEST=1` вмикає захищені живі тести.
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

Базовий живий smoke-тест artifact/attendance потребує
`https://www.googleapis.com/auth/meetings.space.readonly` і
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Пошук
у Calendar потребує `https://www.googleapis.com/auth/calendar.events.readonly`. Експорт
тіла документа Drive потребує
`https://www.googleapis.com/auth/drive.meet.readonly`.

Створити новий простір Meet:

```bash
openclaw googlemeet create
```

Команда виводить нові `meeting uri`, source і сеанс приєднання. За наявності облікових даних OAuth
вона використовує офіційний Google Meet API. Без облікових даних OAuth вона
використовує авторизований профіль браузера прив’язаного Chrome Node як резервний варіант. Агенти можуть
використовувати інструмент `google_meet` з `action: "create"`, щоб створити зустріч і приєднатися за один
крок. Щоб лише створити URL, передайте `"join": false`.

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

Якщо резервний варіант через браузер натрапляє на вхід у Google або блокер дозволів Meet до того,
як зможе створити URL, метод Gateway повертає невдалу відповідь, а
інструмент `google_meet` повертає структуровані деталі замість простого рядка:

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
`manualActionMessage` разом із контекстом browser node/tab і припинити відкривати нові
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

Створення Meet типово також приєднує до нього. Транспорт Chrome або Chrome-node однаково
потребує авторизованого профілю Google Chrome, щоб приєднатися через браузер. Якщо
з профілю виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або
помилку резервного варіанта через браузер і просить оператора завершити вхід у Google перед
повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
проєкт, OAuth principal і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Для поширеного шляху Chrome realtime потрібні лише ввімкнений Plugin, BlackHole, SoX
і ключ бекенд-провайдера голосу в реальному часі. OpenAI використовується типово; установіть
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
- `chromeNode.node`: необов’язковий id/назва/IP Node для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на гостьовому
  екрані Meet без входу
- `chrome.autoJoin: true`: best-effort заповнення імені гостя і натискання Join Now
  через автоматизацію браузера OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активує наявну вкладку Meet замість
  відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить стан in-call,
  перш ніж буде запущено вступне повідомлення realtime
- `chrome.audioFormat: "pcm16-24khz"`: аудіоформат для пари команд. Використовуйте
  `"g711-ulaw-8khz"` лише для застарілих/власних пар команд, які все ще видають
  телефонне аудіо.
- `chrome.audioInputCommand`: команда SoX `rec`, що записує аудіо у форматі
  `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX `play`, що читає аудіо у форматі
  `chrome.audioFormat`
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли міст realtime
  підключається; установіть `""`, щоб приєднатися беззвучно
- `realtime.agentId`: необов’язковий id агента OpenClaw для
  `openclaw_agent_consult`; типово `main`

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

`voiceCall.enabled` типово дорівнює `true`; із транспортом Twilio він делегує
фактичний PSTN-виклик і DTMF Plugin Voice Call. Якщо `voice-call` не
увімкнено, Google Meet однаково може перевіряти й записувати план набору, але не може
здійснити виклик через Twilio.

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
`transport: "chrome-node"`, коли Chrome працює на сполученому Node, наприклад у Parallels
VM. В обох випадках модель realtime і `openclaw_agent_consult` працюють на
хості Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сеанси або переглянути конкретний session ID. Використовуйте
`action: "speak"` із `sessionId` і `message`, щоб агент realtime
негайно щось сказав. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сеанс,
запустити відому фразу й повернути стан `inCall`, коли хост Chrome може
повідомити його. Використовуйте `action: "leave"`, щоб позначити сеанс завершеним.

`status` містить стан Chrome, коли він доступний:

- `inCall`: Chrome, імовірно, уже перебуває у виклику Meet
- `micMuted`: best-effort стан мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профіль
  браузера потребує ручного входу, допуску хостом Meet, дозволів або
  відновлення керування браузером, перш ніж мовлення зможе працювати
- `providerConnected` / `realtimeReady`: стан мосту голосу realtime
- `lastInputAt` / `lastOutputAt`: час останнього аудіо, отриманого мостом або надісланого до нього

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Консультація агента realtime

Режим Chrome realtime оптимізований для живого голосового циклу. Провайдер голосу realtime
чує аудіо зустрічі та говорить через налаштований аудіоміст.
Коли моделі realtime потрібні глибше reasoning, актуальна інформація або звичайні
інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент consult запускає звичайного агента OpenClaw у фоновому режимі з недавнім
контекстом транскрипту зустрічі та повертає стислу усну відповідь для сеансу
голосу realtime. Потім голосова модель може озвучити цю відповідь назад у зустріч.
Він використовує той самий спільний інструмент консультації realtime, що й Voice Call.

Типово consultation запускаються для агента `main`. Установіть `realtime.agentId`, коли
доріжка Meet має звертатися до окремого робочого простору агента OpenClaw, стандартних значень моделі,
політики інструментів, пам’яті та історії сеансу.

`realtime.toolPolicy` керує запуском consultation:

- `safe-read-only`: показує інструмент consult і обмежує звичайного агента
  інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: показує інструмент consult і дозволяє звичайному агенту використовувати
  стандартну політику інструментів агента.
- `none`: не показує інструмент consult моделі голосу realtime.

Ключ сеансу consult має область дії для кожного сеансу Meet, тому подальші виклики consult
можуть повторно використовувати попередній контекст consult під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднався до виклику:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повного smoke-тесту приєднання і мовлення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Контрольний список живого тесту

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
- `googlemeet setup` містить `chrome-node-connected`, коли `chrome-node` є
  стандартним транспортом або коли Node прив’язано.
- `nodes status` показує, що вибраний Node підключений.
- Вибраний Node оголошує і `googlemeet.chrome`, і `browser.proxy`.
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

Це доводить, що Plugin Gateway завантажено, Node VM підключений з
поточним токеном, а аудіоміст Meet доступний до того, як агент відкриє
справжню вкладку зустрічі.

Для smoke-тесту Twilio використовуйте зустріч, яка показує дані для дозвону телефоном:

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
- `googlemeet leave <sessionId>` завершує делегований голосовий виклик.

## Усунення проблем

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно відредагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway.
Запущений агент бачить лише інструменти Plugin, зареєстровані поточним процесом
Gateway.

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

Node має бути підключений і показувати `googlemeet.chrome` разом із `browser.proxy`.
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

Якщо `googlemeet setup` не проходить перевірку `chrome-node-connected` або журнал Gateway повідомляє
`gateway token mismatch`, перевстановіть або перезапустіть Node з поточним токеном Gateway.
Для Gateway у LAN це зазвичай означає:

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

Запустіть `googlemeet test-speech` і перегляньте повернений стан Chrome. Якщо там
повідомляється `manualActionRequired: true`, покажіть оператору `manualActionMessage`
і припиніть повторні спроби, доки не буде виконано дію в браузері.

Поширені ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису хоста Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’являється нативний запит дозволу Chrome.
- Закрити або виправити завислий діалог дозволу Meet.

Не повідомляйте «не виконано вхід» лише тому, що Meet показує «Do you want people to
hear you in the meeting?». Це проміжний екран вибору аудіо Meet; OpenClaw
натискає **Use microphone** через автоматизацію браузера, коли це можливо, і далі
чекає на справжній стан зустрічі. Для резервного варіанта створення лише через браузер OpenClaw
може натиснути **Continue without microphone**, оскільки для створення URL
не потрібен шлях аудіо realtime.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує endpoint Google Meet API `spaces.create`,
коли налаштовано облікові дані OAuth. Без облікових даних OAuth він повертається
до браузера прив’язаного Chrome Node. Переконайтеся:

- Для створення через API: налаштовано `oauth.clientId` і `oauth.refreshToken`,
  або присутні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було отримано після додавання
  підтримки створення. Старі токени можуть не містити області дії `meetings.space.created`; повторно виконайте
  `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для резервного варіанта через браузер: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений Node з `browser.proxy` і
  `googlemeet.chrome`.
- Для резервного варіанта через браузер: профіль OpenClaw Chrome на цьому Node авторизований
  у Google і може відкрити `https://meet.google.com/new`.
- Для резервного варіанта через браузер: повторні спроби повторно використовують наявну вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google перед відкриттям нової вкладки. Якщо агент отримав тайм-аут,
  повторіть виклик інструмента, а не відкривайте вручну ще одну вкладку Meet.
- Для резервного варіанта через браузер: якщо інструмент повертає `manualActionRequired: true`, використовуйте
  повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і
  `manualActionMessage`, щоб допомогти оператору. Не повторюйте спроби в циклі, доки ця
  дія не буде завершена.
- Для резервного варіанта через браузер: якщо Meet показує «Do you want people to hear you in the
  meeting?», залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для
  резервного варіанта лише створення, **Continue without microphone** через автоматизацію
  браузера і далі чекати на згенерований URL Meet. Якщо він не може цього зробити, помилка
  має згадувати `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте шлях realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "realtime"` для прослуховування/відповідей голосом. `mode: "transcribe"` навмисно
не запускає двосторонній міст голосу realtime.

Також переконайтеся:

- На хості Gateway доступний ключ провайдера realtime, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `rec` і `play` існують на хості Chrome.
- Мікрофон і динамік Meet маршрутизовані через шлях віртуального аудіо, який використовує
  OpenClaw.

`googlemeet doctor [session-id]` виводить сеанс, Node, стан in-call,
причину ручної дії, підключення провайдера realtime, `realtimeReady`, активність
аудіовходу/аудіовиходу, часові позначки останнього аудіо, лічильники байтів і URL браузера.
Використовуйте `googlemeet status [session-id]`, коли вам потрібен сирий JSON. Використовуйте
`googlemeet doctor --oauth`, коли потрібно перевірити оновлення OAuth Google Meet
без показу токенів; додайте `--meeting` або `--create-space`, коли вам також потрібен
доказ через Google Meet API.

Якщо агент отримав тайм-аут, а ви бачите, що вкладка Meet уже відкрита, перевірте цю вкладку,
не відкриваючи іншу:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує та перевіряє
наявну вкладку Meet для вибраного транспорту. З `chrome` вона використовує локальне
керування браузером через Gateway; з `chrome-node` — налаштований Chrome Node. Вона
не відкриває нову вкладку і не створює новий сеанс; натомість повідомляє про поточний
блокер, наприклад вхід, допуск, дозволи або стан вибору аудіо.
Команда CLI звертається до налаштованого Gateway, тому Gateway має працювати;
`chrome-node` також вимагає підключеного Chrome Node.

### Не проходять перевірки налаштування Twilio

`twilio-voice-call-plugin` не проходить, коли `voice-call` не дозволено або не ввімкнено.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` не проходить, коли в бекенда Twilio відсутні account
SID, auth token або номер виклику. Установіть це на хості Gateway:

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

Додавайте `--yes` лише тоді, коли ви свідомо хочете здійснити живий вихідний виклик
сповіщення:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Виклик Twilio починається, але ніколи не входить у зустріч

Переконайтеся, що подія Meet показує дані для дозвону телефоном. Передайте точний номер дозвону
і PIN або власну послідовність DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкові `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза
перед введенням PIN.

## Примітки

Офіційний медіа-API Google Meet орієнтований на приймання, тому для мовлення у виклик Meet
усе одно потрібен шлях учасника. Цей Plugin залишає цю межу видимою:
Chrome відповідає за участь через браузер і локальну маршрутизацію аудіо; Twilio відповідає за
участь через телефонний дозвін.

Режим Chrome realtime потребує одного з таких варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує
  мостом моделі realtime і передає аудіо у форматі `chrome.audioFormat` між цими
  командами та вибраним провайдером голосу realtime. Стандартний шлях Chrome —
  це 24 kHz PCM16; 8 kHz G.711 mu-law залишається доступним для застарілих пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда мосту повністю керує локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого двостороннього аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може повертати голоси інших учасників назад у виклик.

`googlemeet speak` запускає активний аудіоміст realtime для сеансу
Chrome. `googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих
через Plugin Voice Call, `leave` також завершує базовий голосовий виклик.

## Пов’язано

- [Plugin Voice Call](/uk/plugins/voice-call)
- [Режим Talk](/uk/nodes/talk)
- [Створення Plugins](/uk/plugins/building-plugins)
