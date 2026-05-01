---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий дзвінок Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт для Google Meet
summary: 'Plugin Google Meet: приєднання за явними URL Meet через Chrome або Twilio зі стандартними налаштуваннями голосу в реальному часі'
title: Plugin для Google Meet
x-i18n:
    generated_at: "2026-05-01T08:05:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9d0d195fc709e487ef1bf5603fdb32fade1b6a0a13aa9bed5110979490f92ff
    source_path: plugins/google-meet.md
    workflow: 16
---

Підтримка учасника Google Meet для OpenClaw — Plugin навмисно працює явно:

- Він приєднується лише до явної URL-адреси `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися до
  поверненої URL-адреси.
- Голос `realtime` є режимом за замовчуванням.
- Голос у реальному часі може викликати повного агента OpenClaw, коли потрібні глибше
  міркування або інструменти.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `realtime` для живого
  прослуховування/відповіді голосом або `transcribe`, щоб приєднатися/керувати браузером без
  голосового мосту реального часу.
- Автентифікація починається як особистий Google OAuth або вже виконаний вхід у профіль Chrome.
- Автоматичного оголошення про згоду немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на спареному хості вузла.
- Twilio приймає номер для набору плюс необов’язковий PIN або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших робочих процесів
  агентських телеконференцій.

## Швидкий старт

Установіть локальні аудіозалежності й налаштуйте бекенд-провайдера голосу
реального часу. OpenAI є типовим; Google Gemini Live також працює з
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

Після перезавантаження перевірте обидва компоненти:

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

Вивід налаштування призначений бути читабельним для агента й обізнаним про режим. Він повідомляє про профіль Chrome,
закріплення вузла та, для приєднань Chrome у реальному часі, аудіоміст BlackHole/SoX
і перевірки відкладеного вступу в реальному часі. Для приєднань лише для спостереження перевірте той самий
транспорт із `--mode transcribe`; цей режим пропускає передумови аудіо реального часу,
бо не слухає через міст і не говорить через нього:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Коли налаштовано делегування Twilio, налаштування також повідомляє, чи готові
Plugin `voice-call`, облікові дані Twilio та публічне відкриття Webhook.
Сприймайте будь-яку перевірку `ok: false` як блокер для перевірених транспорту й режиму
перед тим, як просити агента приєднатися. Використовуйте `openclaw googlemeet setup --json` для
скриптів або машинно-читабельного виводу. Використовуйте `--transport chrome`,
`--transport chrome-node` або `--transport twilio`, щоб попередньо перевірити конкретний
транспорт, перш ніж агент спробує його використати.

Для Twilio завжди явно попередньо перевіряйте транспорт, коли типовим транспортом
є Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Це виявляє відсутнє підключення `voice-call`, облікові дані Twilio або недоступне
публічне відкриття Webhook, перш ніж агент спробує набрати зустріч.

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

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це
  найдетермінованіший шлях, який не залежить від стану інтерфейсу браузера.
- Резервний браузерний шлях: використовується, коли облікових даних OAuth немає. OpenClaw використовує
  закріплений вузол Chrome, відкриває `https://meet.google.com/new`, чекає, доки Google
  переспрямує на справжню URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Цей шлях вимагає,
  щоб профіль OpenClaw Chrome на вузлі вже мав вхід у Google.
  Автоматизація браузера обробляє власний запит Meet на мікрофон під час першого запуску; цей запит
  не вважається помилкою входу в Google.
  Потоки приєднання та створення також намагаються повторно використати наявну вкладку Meet, перш ніж відкривати
  нову. Зіставлення ігнорує нешкідливі рядки запиту URL, як-от `authuser`, тому
  повторна спроба агента має сфокусувати вже відкриту зустріч замість створення другої
  вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` за замовчуванням приєднується до нової зустрічі й
повертає `joined: true` плюс сеанс приєднання. Щоб лише створити URL, використовуйте
`create --no-join` у CLI або передайте `"join": false` інструменту.

Або скажіть агенту: «Створи Google Meet, приєднайся до нього з голосом реального часу й надішли
мені посилання». Агент має викликати `google_meet` з `action: "create"`, а
потім поділитися поверненим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Для приєднання лише для спостереження/керування браузером задайте `"mode": "transcribe"`. Це
не запускає дуплексний міст моделі реального часу, не вимагає BlackHole або SoX
і не відповідатиме голосом у зустрічі. Приєднання Chrome у цьому режимі також уникають
надання дозволу OpenClaw на мікрофон/камеру та обходять шлях Meet **Use
microphone**. Якщо Meet показує проміжний екран вибору аудіо, автоматизація намагається
обрати шлях без мікрофона, а інакше повідомляє про ручну дію замість відкриття
локального мікрофона.

Під час сеансів реального часу статус `google_meet` містить стан браузера й аудіомоста,
як-от `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, останні мітки часу вводу/виводу,
лічильники байтів і стан закриття мосту. Якщо з’являється безпечний запит сторінки Meet,
автоматизація браузера обробляє його, коли може. Вхід, допуск хостом і
запити дозволів браузера/ОС повідомляються як ручна дія з причиною та
повідомленням, яке агент має передати. Керовані сеанси Chrome видають вступ або
тестову фразу лише після того, як стан браузера повідомить `inCall: true`; інакше статус повідомляє
`speechReady: false`, а спроба мовлення блокується замість удавання, що
агент говорив у зустріч.

Локальні приєднання Chrome відбуваються через профіль браузера OpenClaw із виконаним входом. Режим реального часу
вимагає `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для
чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного
пристрою BlackHole достатньо для першого smoke-тесту, але він може давати відлуння.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM,
лише щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть
хост вузла у VM. Увімкніть укомплектований Plugin у VM один раз, щоб вузол
оголошував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робоча область агента, ключі моделі/API, провайдер реального часу
  і конфігурація Plugin Google Meet.
- Parallels macOS VM: OpenClaw CLI/хост вузла, Google Chrome, SoX, BlackHole 2ch
  і профіль Chrome із входом у Google.
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

Установіть або оновіть OpenClaw у VM, а потім увімкніть укомплектований Plugin там:

```bash
openclaw plugins enable google-meet
```

Запустіть хост вузла у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це LAN IP і ви не використовуєте TLS, вузол відхиляє
простий WebSocket, якщо ви явно не погодитеся на це для довіреної приватної мережі:

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

Для smoke-тесту однією командою, який створює або повторно використовує сеанс, вимовляє відому
фразу й друкує стан сеансу:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання в реальному часі автоматизація браузера OpenClaw заповнює ім’я гостя, натискає
Join/Ask to join і приймає вибір Meet першого запуску "Use microphone", коли цей
запит з’являється. Під час приєднання лише для спостереження або браузерного створення зустрічі вона
проходить повз той самий запит без мікрофона, коли такий вибір доступний.
Якщо у профілі браузера не виконано вхід, Meet чекає допуску хостом,
Chrome потребує дозволу на мікрофон/камеру для приєднання в реальному часі або Meet застряг
на запиті, який автоматизація не змогла розв’язати, результат join/test-speech повідомляє
`manualActionRequired: true` з `manualActionReason` і
`manualActionMessage`. Агенти мають припинити повторювати приєднання, повідомити саме це
повідомлення плюс поточні `browserUrl`/`browserTitle` і повторити спробу лише після завершення
ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає лише тоді, коли рівно один
підключений вузол оголошує як `googlemeet.chrome`, так і керування браузером. Якщо
підключено кілька придатних вузлів, задайте `chromeNode.node` як ідентифікатор вузла,
відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `Configured Google Meet node ... is not usable: offline`: закріплений вузол
  відомий Gateway, але недоступний. Агенти мають розглядати цей вузол як
  діагностичний стан, а не як придатний хост Chrome, і повідомляти про блокер
  налаштування замість переходу на інший транспорт, якщо користувач цього не
  просив.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  підтвердьте сполучення та переконайтеся, що у VM були виконані
  `openclaw plugins enable google-meet` і
  `openclaw plugins enable browser`. Також підтвердьте, що хост Gateway
  дозволяє обидві команди вузла через
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: установіть `blackhole-2ch` на хості,
  який перевіряється, і перезавантажте його перед використанням локального аудіо
  Chrome.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch`
  у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера
  всередині VM або залиште `chrome.guestName` заданим для гостьового
  приєднання. Гостьове автоматичне приєднання використовує браузерну
  автоматизацію OpenClaw через проксі браузера вузла; переконайтеся, що
  конфігурація браузера вузла вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або іменований профіль наявного сеансу.
- Дублікати вкладок Meet: залиште `chrome.reuseExistingTab: true` увімкненим.
  OpenClaw активує наявну вкладку для тієї самої URL-адреси Meet перед
  відкриттям нової, а створення зустрічі через браузер повторно використовує
  вкладку з поточним `https://meet.google.com/new` або запитом облікового запису
  Google перед відкриттям іншої.
- Немає аудіо: у Meet спрямуйте мікрофон/динамік через шлях віртуального
  аудіопристрою, який використовує OpenClaw; використовуйте окремі віртуальні
  пристрої або маршрутизацію у стилі Loopback для чистого дуплексного аудіо.

## Примітки щодо встановлення

Типове налаштування Chrome realtime використовує два зовнішні інструменти:

- `sox`: аудіоутиліта командного рядка. Plugin використовує явні команди
  пристроїв CoreAudio для типового аудіомоста 24 kHz PCM16.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій
  `BlackHole 2ch`, через який Chrome/Meet можуть маршрутизувати аудіо.

OpenClaw не постачає й не поширює жоден із цих пакетів. Документація просить
користувачів установити їх як залежності хоста через Homebrew. SoX ліцензовано
як `LGPL-2.0-only AND GPL-2.0-only`; BlackHole має ліцензію GPL-3.0. Якщо ви
створюєте інсталятор або appliance, що постачає BlackHole разом з OpenClaw,
перегляньте умови ліцензування BlackHole в upstream або отримайте окрему
ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet через керування браузером OpenClaw і
приєднується як профіль браузера OpenClaw із виконаним входом. У macOS Plugin
перед запуском перевіряє наявність `BlackHole 2ch`. Якщо налаштовано, він також
виконує команду перевірки справності аудіомоста та команду запуску перед
відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості
Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють на сполученому
вузлі, наприклад Parallels macOS VM. Для локального Chrome виберіть профіль за
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
аналізує сторінки Meet для пошуку телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або потрібен резервний
варіант телефонного дозвону. Google Meet має показувати номер телефонного
дозвону та PIN для зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

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
тримає секрети поза `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни
конфігурації Plugin не з'являться в уже запущеному процесі Gateway, доки він не
перезавантажиться.

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

## OAuth і попередні перевірки

OAuth необов'язковий для створення посилання Meet, оскільки `googlemeet create`
може повертатися до браузерної автоматизації. Налаштуйте OAuth, коли потрібні
офіційне створення через API, розв'язання простору або попередні перевірки Meet
Media API.

Доступ до Google Meet API використовує користувацький OAuth: створіть OAuth
клієнт Google Cloud, запитайте потрібні scopes, авторизуйте обліковий запис
Google, а потім збережіть отриманий refresh token у конфігурації Plugin Google
Meet або надайте змінні середовища `OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання через Chrome. Транспорти Chrome і Chrome-node
все одно приєднуються через профіль Chrome із виконаним входом, BlackHole/SoX і
підключений вузол, коли ви використовуєте участь через браузер. OAuth потрібен
лише для офіційного шляху Google Meet API: створення просторів зустрічей,
розв'язання просторів і виконання попередніх перевірок Meet Media API.

### Створення облікових даних Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** — найпростіший варіант для організації Google Workspace.
   - **External** працює для особистих/тестових налаштувань; поки застосунок у
     Testing, додайте кожен обліковий запис Google, який авторизуватиме
     застосунок, як тестового користувача.
4. Додайте scopes, які запитує OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Створіть OAuth client ID.
   - Тип застосунку: **Web application**.
   - Авторизована URI переадресації:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Скопіюйте client ID і client secret.

`meetings.space.created` потрібен Google Meet `spaces.create`.
`meetings.space.readonly` дає OpenClaw змогу розв'язувати URL-адреси/коди Meet у
простори. `meetings.conference.media.readonly` призначений для попередніх
перевірок Meet Media API і роботи з медіа; Google може вимагати реєстрацію в
Developer Preview для фактичного використання Media API. Якщо вам потрібні лише
приєднання через Chrome на основі браузера, повністю пропустіть OAuth.

### Створення refresh token

Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, або передайте їх
як змінні середовища, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить конфігураційний блок `oauth` із refresh token. Вона використовує
PKCE, callback localhost на `http://localhost:8085/oauth2callback` і ручний
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

Збережіть об'єкт `oauth` у конфігурації Plugin Google Meet:

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

Надавайте перевагу змінним середовища, коли не хочете зберігати refresh token у
конфігурації. Якщо наявні і значення конфігурації, і значення середовища,
Plugin спершу використовує конфігурацію, а потім fallback до середовища.

Згода OAuth охоплює створення просторів Meet, доступ для читання просторів Meet
і доступ для читання медіа конференцій Meet. Якщо ви автентифікувалися до появи
підтримки створення зустрічей, повторно виконайте
`openclaw googlemeet auth login --json`, щоб refresh token мав scope
`meetings.space.created`.

### Перевірка OAuth за допомогою doctor

Запустіть doctor OAuth, коли потрібна швидка перевірка справності без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує runtime Chrome і не потребує підключеного вузла Chrome. Команда
перевіряє, що конфігурація OAuth існує і що refresh token може створити access
token. Звіт JSON містить лише поля стану, такі як `ok`, `configured`,
`tokenSource`, `expiresAt`, і повідомлення перевірок; він не виводить access
token, refresh token або client secret.

Поширені результати:

| Перевірка            | Значення                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Наявні `oauth.clientId` плюс `oauth.refreshToken` або кешований access token.           |
| `oauth-token`        | Кешований access token досі чинний або refresh token створив новий access token.        |
| `meet-spaces-get`    | Необов'язкова перевірка `--meeting` розв'язала наявний простір Meet.                    |
| `meet-spaces-create` | Необов'язкова перевірка `--create-space` створила новий простір Meet.                   |

Щоб також підтвердити ввімкнення Google Meet API і scope `spaces.create`,
запустіть перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює одноразову URL-адресу Meet. Використовуйте його, коли
потрібно підтвердити, що в проєкті Google Cloud увімкнено Meet API і що
авторизований обліковий запис має scope `meetings.space.created`.

Щоб підтвердити доступ для читання до наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` підтверджують доступ для читання до
наявного простору, до якого авторизований обліковий запис Google має доступ.
`403` з цих перевірок зазвичай означає, що Google Meet REST API вимкнено,
погоджений refresh token не має потрібного scope або обліковий запис Google не
має доступу до цього простору Meet. Помилка refresh-token означає, що потрібно
повторно виконати `openclaw googlemeet auth login --json` і зберегти новий блок
`oauth`.

Для браузерного fallback облікові дані OAuth не потрібні. У цьому режимі
автентифікація Google надходить із профілю Chrome із виконаним входом на
вибраному вузлі, а не з конфігурації OpenClaw.

Ці змінні середовища приймаються як fallback:

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

З `--meeting`, `artifacts` і `attendance` за замовчуванням використовують
останній запис конференції. Передайте `--all-conference-records`, коли потрібні
всі збережені записи для цієї зустрічі.

Пошук у Calendar може розв’язати URL зустрічі з Google Calendar перед читанням
артефактів Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` шукає в сьогоднішньому календарі `primary` подію Calendar із
посиланням Google Meet. Використовуйте `--event <query>` для пошуку відповідного
тексту події, а `--calendar <id>` для неосновного календаря. Пошук у Calendar
потребує свіжого входу OAuth, який містить readonly-область для подій Calendar.
`calendar-events` попередньо показує відповідні події Meet і позначає подію, яку
виберуть `latest`, `artifacts`, `attendance` або `export`.

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

`artifacts` повертає метадані запису конференції, а також метадані ресурсів
учасників, записів, транскриптів, структурованих записів транскрипту й розумних
нотаток, коли Google відкриває їх для зустрічі. Використовуйте
`--no-transcript-entries`, щоб пропустити пошук записів для великих зустрічей.
`attendance` розгортає учасників у рядки сеансів учасників із часом першої та
останньої появи, загальною тривалістю сеансу, прапорцями запізнення/раннього
виходу та об’єднанням дубльованих ресурсів учасників за користувачем, що ввійшов,
або відображуваним іменем. Передайте `--no-merge-duplicates`, щоб зберегти сирі
ресурси учасників окремо, `--late-after-minutes`, щоб налаштувати виявлення
запізнення, і `--early-before-minutes`, щоб налаштувати виявлення раннього виходу.

`export` записує папку, що містить `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`.
`manifest.json` фіксує вибраний вхід, параметри експорту, записи конференції,
вихідні файли, лічильники, джерело токена, подію Calendar, якщо її було
використано, і будь-які попередження про часткове отримання. Передайте `--zip`,
щоб також записати портативний архів поряд із папкою. Передайте
`--include-doc-bodies`, щоб експортувати текст пов’язаних транскриптів і
розумних нотаток Google Docs через Google Drive `files.export`; для цього
потрібен свіжий вхід OAuth, який містить readonly-область Drive Meet. Без
`--include-doc-bodies` експорти містять лише метадані Meet і структуровані
записи транскрипту. Якщо Google повертає часткову помилку артефакту, наприклад
помилку переліку розумних нотаток, запису транскрипту або тіла документа Drive,
підсумок і маніфест зберігають попередження замість провалу всього експорту.
Використовуйте `--dry-run`, щоб отримати ті самі дані артефактів/відвідуваності
та вивести JSON маніфесту без створення папки або ZIP. Це корисно перед записом
великого експорту або коли агенту потрібні лише лічильники, вибрані записи й
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

Установіть `"dryRun": true`, щоб повернути лише маніфест експорту й пропустити запис файлів.

Запустіть захищений живий перевірковий тест для реальної збереженої зустрічі:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Середовище живого перевіркового тесту:

- `OPENCLAW_LIVE_TEST=1` вмикає захищені живі тести.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` вказує на збережений URL Meet, код або
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID` надає ідентифікатор
  клієнта OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN` надає
  refresh token.
- Необов’язково: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` і
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` використовують ті самі fallback-назви
  без префікса `OPENCLAW_`.

Базовий живий перевірковий тест артефактів/відвідуваності потребує
`https://www.googleapis.com/auth/meetings.space.readonly` і
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Пошук у
Calendar потребує `https://www.googleapis.com/auth/calendar.events.readonly`.
Експорт тіла документа Drive потребує
`https://www.googleapis.com/auth/drive.meet.readonly`.

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда виводить новий `meeting uri`, джерело та сеанс приєднання. З обліковими
даними OAuth вона використовує офіційний Google Meet API. Без облікових даних
OAuth вона використовує як fallback профіль браузера з виконаним входом у
прикріпленому вузлі Chrome. Агенти можуть використовувати інструмент
`google_meet` з `action: "create"`, щоб створити й приєднатися за один крок.
Для створення лише URL передайте `"join": false`.

Приклад JSON-виводу з browser fallback:

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

Якщо browser fallback наштовхується на вхід Google або блокування дозволів Meet,
перш ніж зможе створити URL, метод Gateway повертає відповідь із помилкою, а
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
`manualActionMessage` разом із контекстом вузла/вкладки браузера й припинити
відкривати нові вкладки Meet, доки оператор не завершить крок у браузері.

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

Створення Meet за замовчуванням виконує приєднання. Транспорту Chrome або
Chrome-node усе ще потрібен профіль Google Chrome із виконаним входом, щоб
приєднатися через браузер. Якщо профіль вийшов із системи, OpenClaw повідомляє
`manualActionRequired: true` або помилку browser fallback і просить оператора
завершити вхід Google перед повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що
ваш Cloud-проєкт, OAuth principal і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Спільний realtime-шлях Chrome потребує лише ввімкненого plugin, BlackHole, SoX
і ключа backend realtime voice provider. OpenAI є типовим; установіть
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

Типові значення:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: необов’язковий ідентифікатор/назва/IP вузла для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на екрані гостя
  Meet без виконаного входу
- `chrome.autoJoin: true`: best-effort заповнення імені гостя та натискання
  «Приєднатися зараз» через автоматизацію браузера OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкривання дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить про
  стан у виклику, перш ніж буде запущено realtime-вступ
- `chrome.audioFormat: "pcm16-24khz"`: аудіоформат пари команд. Використовуйте
  `"g711-ulaw-8khz"` лише для legacy/custom пар команд, які все ще видають
  телефонний звук.
- `chrome.audioInputCommand`: команда SoX, що читає з CoreAudio `BlackHole 2ch`
  і записує аудіо у форматі `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX, що читає аудіо у форматі
  `chrome.audioFormat` і записує в CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: необов’язкова команда локального мікрофона, яка
  записує signed 16-bit little-endian mono PCM для виявлення людського втручання,
  поки активне відтворення асистента. Наразі це застосовується до розміщеного в
  Gateway мосту пар команд `chrome`.
- `chrome.bargeInRmsThreshold: 650`: RMS-рівень, який рахується як людське
  втручання на `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: піковий рівень, який рахується як людське
  втручання на `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: мінімальна затримка між повторними очищеннями
  людського втручання
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли realtime-міст
  підключається; установіть `""`, щоб приєднатися мовчки
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

`voiceCall.enabled` за замовчуванням має значення `true`; з транспортом Twilio він делегує фактичний PSTN-дзвінок, DTMF і вступне привітання Plugin Voice Call. Voice Call відтворює послідовність DTMF перед відкриттям медіапотоку реального часу, а потім використовує збережений вступний текст як початкове привітання в реальному часі. Якщо `voice-call` не ввімкнено, Google Meet усе ще може перевіряти й записувати план набору, але не може здійснити Twilio-дзвінок.

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

Використовуйте `transport: "chrome"`, коли Chrome працює на хості Gateway. Використовуйте `transport: "chrome-node"`, коли Chrome працює на спареному вузлі, наприклад у Parallels VM. В обох випадках модель реального часу й `openclaw_agent_consult` працюють на хості Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сеанси або переглянути ID сеансу. Використовуйте `action: "speak"` із `sessionId` і `message`, щоб агент реального часу заговорив негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сеанс, запустити відому фразу й повернути стан `inCall`, коли хост Chrome може про нього повідомити. `test_speech` завжди примусово встановлює `mode: "realtime"` і завершується помилкою, якщо його просять працювати в `mode: "transcribe"`, оскільки сеанси лише для спостереження навмисно не можуть виводити мовлення. Його результат `speechOutputVerified` базується на збільшенні байтів аудіовиходу реального часу під час цього тестового виклику, тому повторно використаний сеанс зі старішим аудіо не зараховується як нова успішна перевірка мовлення. Використовуйте `action: "leave"`, щоб позначити сеанс завершеним.

`status` містить стан Chrome, коли він доступний:

- `inCall`: Chrome, схоже, перебуває всередині дзвінка Meet
- `micMuted`: приблизний стан мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профіль браузера потребує ручного входу, допуску хостом Meet, дозволів або ремонту керування браузером, перш ніж мовлення зможе працювати
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: чи зараз дозволено кероване мовлення Chrome. `speechReady: false` означає, що OpenClaw не надіслав вступну/тестову фразу в аудіоміст.
- `providerConnected` / `realtimeReady`: стан голосового мосту реального часу
- `lastInputAt` / `lastOutputAt`: останнє аудіо, побачене з мосту або надіслане до нього
- `lastSuppressedInputAt` / `suppressedInputBytes`: вхід local loopback, проігнорований під час активного відтворення асистентом

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Консультація агента реального часу

Режим Chrome реального часу оптимізовано для живого голосового циклу. Голосовий провайдер реального часу чує аудіо зустрічі й говорить через налаштований аудіоміст. Коли моделі реального часу потрібні глибше міркування, актуальна інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw у фоновому режимі з контекстом нещодавньої стенограми зустрічі та повертає стислу усну відповідь у голосовий сеанс реального часу. Потім голосова модель може промовити цю відповідь назад у зустріч. Він використовує той самий спільний інструмент консультації реального часу, що й Voice Call.

За замовчуванням консультації виконуються для агента `main`. Установіть `realtime.agentId`, коли смуга Meet має консультувати окремий робочий простір агента OpenClaw, стандартні моделі, політику інструментів, пам’ять та історію сеансів.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: відкрити інструмент консультації й обмежити звичайного агента інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`.
- `owner`: відкрити інструмент консультації й дозволити звичайному агенту використовувати стандартну політику інструментів агента.
- `none`: не відкривати інструмент консультації для голосової моделі реального часу.

Ключ сеансу консультації обмежений кожним сеансом Meet, тому подальші виклики консультації можуть повторно використовувати попередній контекст консультації під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після повного приєднання Chrome до дзвінка:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повної перевірки приєднання й мовлення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Контрольний список live-тесту

Використовуйте цю послідовність перед передаванням зустрічі автономному агенту:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Очікуваний стан Chrome-node:

- `googlemeet setup` повністю зелений.
- `googlemeet setup` містить `chrome-node-connected`, коли Chrome-node є транспортом за замовчуванням або вузол закріплено.
- `nodes status` показує, що вибраний вузол підключено.
- Вибраний вузол оголошує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до дзвінка, а `test-speech` повертає стан Chrome з `inCall: true`.

Для віддаленого хоста Chrome, наприклад Parallels macOS VM, це найкоротша безпечна перевірка після оновлення Gateway або VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Це доводить, що Plugin Gateway завантажено, вузол VM підключено з поточним токеном, а аудіоміст Meet доступний до того, як агент відкриє вкладку реальної зустрічі.

Для перевірки Twilio використовуйте зустріч, яка надає телефонні дані для дозвону:

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
- Повернений сеанс має `transport: "twilio"` і `twilio.voiceCallId`.
- `openclaw logs --follow` показує, що DTMF TwiML було подано перед TwiML реального часу, а потім міст реального часу з початковим привітанням у черзі.
- `googlemeet leave <sessionId>` завершує делегований голосовий дзвінок.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно відредагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway. Запущений агент бачить лише інструменти Plugin, зареєстровані поточним процесом Gateway.

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

Вузол має бути підключеним і містити `googlemeet.chrome` плюс `browser.proxy`.
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

Якщо `googlemeet setup` не проходить `chrome-node-connected` або журнал Gateway повідомляє `gateway token mismatch`, перевстановіть або перезапустіть вузол із поточним токеном Gateway. Для LAN Gateway це зазвичай означає:

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

Запустіть `googlemeet test-speech` і перегляньте повернений стан Chrome. Якщо він повідомляє `manualActionRequired: true`, покажіть `manualActionMessage` оператору й припиніть повторні спроби, доки дія в браузері не буде завершена.

Поширені ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису хоста Meet.
- Надати дозволи Chrome на мікрофон/камеру, коли з’явиться нативний запит дозволу Chrome.
- Закрити або виправити завислий діалог дозволів Meet.

Не повідомляйте "not signed in" лише тому, що Meet показує "Do you want people to hear you in the meeting?" Це проміжний екран вибору аудіо Meet; OpenClaw натискає **Use microphone** через автоматизацію браузера, коли вона доступна, і продовжує чекати на реальний стан зустрічі. Для резервного варіанта браузера лише для створення OpenClaw може натиснути **Continue without microphone**, оскільки створення URL не потребує аудіошляху реального часу.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує endpoint Google Meet API `spaces.create`, коли налаштовано облікові дані OAuth. Без облікових даних OAuth він переходить до резервного варіанта через браузер закріпленого вузла Chrome. Підтвердьте:

- Для створення через API: налаштовано `oauth.clientId` і `oauth.refreshToken` або наявні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було створено після додавання підтримки створення. Старішим токенам може бракувати scope `meetings.space.created`; повторно запустіть `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для резервного браузерного варіанта: `defaultTransport: "chrome-node"` і `chromeNode.node` вказують на підключений вузол з `browser.proxy` і `googlemeet.chrome`.
- Для резервного браузерного варіанта: профіль OpenClaw Chrome на цьому вузлі виконано вхід у Google і він може відкрити `https://meet.google.com/new`.
- Для резервного браузерного варіанта: повторні спроби повторно використовують наявну вкладку `https://meet.google.com/new` або вкладку запиту облікового запису Google перед відкриттям нової вкладки. Якщо час очікування агента вичерпано, повторіть виклик інструмента, а не відкривайте вручну ще одну вкладку Meet.
- Для резервного браузерного варіанта: якщо інструмент повертає `manualActionRequired: true`, використовуйте повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і `manualActionMessage`, щоб скерувати оператора. Не повторюйте спроби в циклі, доки цю дію не буде завершено.
- Для резервного браузерного варіанта: якщо Meet показує "Do you want people to hear you in the meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для резервного варіанта лише для створення, **Continue without microphone** через автоматизацію браузера й продовжити чекати на згенерований URL Meet. Якщо він не може, помилка має згадувати `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте шлях реального часу:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "realtime"` для прослуховування/відповіді голосом. `mode: "transcribe"` навмисно
не запускає дуплексний голосовий міст реального часу. `googlemeet test-speech`
завжди перевіряє шлях реального часу й повідомляє, чи були зафіксовані вихідні байти мосту
для цього виклику. Якщо `speechOutputVerified` має значення false, а
`speechOutputTimedOut` має значення true, провайдер реального часу міг прийняти
висловлювання, але OpenClaw не побачив, щоб нові вихідні байти дійшли до аудіомоста
Chrome.

Також перевірте:

- Ключ провайдера реального часу доступний на хості Gateway, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `sox` існує на хості Chrome.
- Мікрофон і динамік Meet маршрутизуються через віртуальний аудіошлях, який використовує
  OpenClaw.

`googlemeet doctor [session-id]` виводить сесію, вузол, стан у дзвінку,
причину ручної дії, з’єднання з провайдером реального часу, `realtimeReady`, активність
аудіовходу/виходу, останні часові мітки аудіо, лічильники байтів і URL браузера.
Використовуйте `googlemeet status [session-id] --json`, коли потрібен сирий JSON. Використовуйте
`googlemeet doctor --oauth`, коли потрібно перевірити оновлення OAuth Google Meet
без розкриття токенів; додайте `--meeting` або `--create-space`, коли також потрібне
підтвердження Google Meet API.

Якщо час очікування агента минув і ви бачите, що вкладка Meet уже відкрита, перевірте цю вкладку
без відкриття нової:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує та перевіряє
наявну вкладку Meet для вибраного транспорту. З `chrome` вона використовує локальне
керування браузером через Gateway; з `chrome-node` вона використовує налаштований
вузол Chrome. Вона не відкриває нову вкладку й не створює нову сесію; вона повідомляє
поточний блокер, наприклад стан входу, допуску, дозволів або вибору аудіо.
Команда CLI звертається до налаштованого Gateway, тому Gateway має бути запущений;
`chrome-node` також потребує підключеного вузла Chrome.

### Перевірки налаштування Twilio не проходять

`twilio-voice-call-plugin` не проходить, коли `voice-call` не дозволений або не ввімкнений.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` не проходить, коли бекенд Twilio не має SID облікового запису,
токена автентифікації або номера абонента-відправника. Задайте їх на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` не проходить, коли `voice-call` не має публічної експозиції Webhook
або коли `publicUrl` вказує на loopback чи простір приватної мережі.
Задайте `plugins.entries.voice-call.config.publicUrl` як публічний URL провайдера або
налаштуйте тунель/Tailscale-експозицію для `voice-call`.

Loopback і приватні URL не є допустимими для зворотних викликів оператора. Не використовуйте
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

Для локальної розробки використовуйте тунель або Tailscale-експозицію замість приватного
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

`voicecall smoke` за замовчуванням перевіряє лише готовність. Щоб виконати пробний запуск для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли навмисно хочете здійснити живий вихідний сповіщувальний
дзвінок:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Дзвінок Twilio починається, але не входить у зустріч

Підтвердьте, що подія Meet надає деталі телефонного входу. Передайте точний номер для дзвінка
та PIN або власну послідовність DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкові `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза
перед введенням PIN.

Якщо телефонний дзвінок створено, але список учасників Meet так і не показує учасника
телефонного входу:

- Виконайте `openclaw voicecall status --call-id <id>` і підтвердьте, що дзвінок усе ще
  активний.
- Виконайте `openclaw voicecall tail` і перевірте, що Webhook Twilio надходять до
  Gateway.
- Виконайте `openclaw logs --follow` і знайдіть послідовність Twilio Meet: Google
  Meet делегує приєднання, Voice Call зберігає DTMF TwiML до підключення, віддає
  цей початковий TwiML, потім віддає TwiML реального часу й запускає міст реального часу
  з `initialGreeting=queued`.
- Повторно виконайте `openclaw googlemeet setup --transport twilio`; зелена перевірка налаштування
  потрібна, але не доводить, що послідовність PIN зустрічі правильна.
- Підтвердьте, що номер для дзвінка належить до того самого запрошення Meet і регіону, що й
  PIN.
- Збільште початкові паузи в `--dtmf-sequence`, якщо Meet відповідає повільно, наприклад
  `wwww123456#`.
- Якщо учасник приєднується, але ви не чуєте привітання, перевірте
  `openclaw logs --follow` на наявність TwiML реального часу, запуску мосту реального часу та
  `initialGreeting=queued`. Привітання генерується з початкового
  повідомлення `voicecall.start` після підключення мосту реального часу.

Якщо Webhook не надходять, спершу налагодьте Plugin Voice Call: провайдер має
досягати `plugins.entries.voice-call.config.publicUrl` або налаштованого тунелю.
Див. [усунення несправностей голосових дзвінків](/uk/plugins/voice-call#troubleshooting).

## Примітки

Офіційний медіа API Google Meet орієнтований на приймання, тому для мовлення в дзвінок Meet
усе одно потрібен шлях учасника. Цей Plugin залишає цю межу видимою:
Chrome відповідає за участь у браузері та локальну маршрутизацію аудіо; Twilio відповідає
за участь через телефонний вхід.

Режиму реального часу Chrome потрібен `BlackHole 2ch` плюс один із варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw володіє
  мостом моделі реального часу й передає аудіо у `chrome.audioFormat` між цими
  командами та вибраним голосовим провайдером реального часу. Типовий шлях Chrome —
  24 кГц PCM16; 8 кГц G.711 mu-law залишається доступним для застарілих пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда мосту володіє всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може відлунювати інших учасників назад у дзвінок.

З мостом Chrome на парі команд `chrome.bargeInInputCommand` може слухати
окремий локальний мікрофон і очищати відтворення асистента, коли людина починає
говорити. Це утримує людське мовлення попереду виводу асистента навіть тоді, коли спільний
вхід BlackHole loopback тимчасово приглушений під час відтворення асистента.
Як і `chrome.audioInputCommand` та `chrome.audioOutputCommand`, це
локальна команда, налаштована оператором. Використовуйте явний довірений шлях команди або
список аргументів і не вказуйте на скрипти з недовірених розташувань.

`googlemeet speak` запускає активний аудіоміст реального часу для сесії Chrome.
`googlemeet leave` зупиняє цей міст. Для сесій Twilio, делегованих
через Plugin Voice Call, `leave` також завершує базовий голосовий дзвінок.

## Пов’язане

- [Plugin голосових дзвінків](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення plugins](/uk/plugins/building-plugins)
