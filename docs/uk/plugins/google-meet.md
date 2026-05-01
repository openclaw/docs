---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий дзвінок Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Google Meet Plugin: приєднання до явних URL-адрес Meet через Chrome або Twilio зі стандартними голосовими налаштуваннями в реальному часі'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-01T13:33:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: af1f327249c45fe318410a15c598fa9aff52bd160961b6354f027cb728b7aa82
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet підтримує учасника для OpenClaw — Plugin навмисно працює лише явно:

- Він приєднується лише до явної URL-адреси `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися до
  поверненої URL-адреси.
- Голос `realtime` є режимом за замовчуванням.
- Голос у реальному часі може викликати повного агента OpenClaw, коли потрібні глибше
  міркування або інструменти.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `realtime` для живого
  прослуховування/відповіді голосом або `transcribe`, щоб приєднатися/керувати браузером без
  голосового мосту реального часу.
- Автентифікація починається з персонального Google OAuth або вже авторизованого профілю Chrome.
- Автоматичного оголошення згоди немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на спареному вузловому хості.
- Twilio приймає номер для дозвону плюс необов’язковий PIN або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших агентських
  телеконференційних робочих процесів.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте бекенд-провайдера голосу в реальному часі.
OpenAI є типовим; Google Gemini Live також працює з
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` встановлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор
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

Вивід налаштування призначений для читання агентами й враховує режим. Він повідомляє про профіль Chrome,
прив’язку вузла та, для приєднань Chrome у реальному часі, аудіоміст BlackHole/SoX
і відкладені перевірки вступу в реальному часі. Для приєднань лише зі спостереженням перевірте той самий
транспорт за допомогою `--mode transcribe`; цей режим пропускає передумови аудіо в реальному часі,
бо він не слухає й не говорить через міст:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Коли налаштовано делегування Twilio, налаштування також повідомляє, чи готові
Plugin `voice-call`, облікові дані Twilio та публічна доступність Webhook.
Сприймайте будь-яку перевірку `ok: false` як блокер для перевіреного транспорту й режиму,
перш ніж просити агента приєднатися. Використовуйте `openclaw googlemeet setup --json` для
скриптів або машиночитного виводу. Використовуйте `--transport chrome`,
`--transport chrome-node` або `--transport twilio`, щоб попередньо перевірити конкретний
транспорт до того, як агент спробує його використати.

Для Twilio завжди явно попередньо перевіряйте транспорт, коли типовим транспортом
є Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Це виявляє відсутнє підключення `voice-call`, облікові дані Twilio або недоступну
публічну експозицію Webhook до того, як агент спробує зателефонувати на зустріч.

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
  найбільш детермінований шлях, який не залежить від стану інтерфейсу браузера.
- Резервний браузерний шлях: використовується, коли облікових даних OAuth немає. OpenClaw використовує
  прив’язаний вузол Chrome, відкриває `https://meet.google.com/new`, чекає, доки Google
  перенаправить на справжню URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Цей шлях потребує,
  щоб профіль Chrome OpenClaw на вузлі вже був авторизований у Google.
  Автоматизація браузера обробляє власний початковий запит Meet щодо мікрофона; цей запит
  не вважається помилкою входу в Google.
  Потоки приєднання й створення також намагаються повторно використати наявну вкладку Meet перед відкриттям
  нової. Зіставлення ігнорує нешкідливі рядки запиту URL, як-от `authuser`, тому повторна спроба
  агента має сфокусувати вже відкриту зустріч замість створення другої
  вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` за замовчуванням приєднується до нової зустрічі та
повертає `joined: true` разом із сесією приєднання. Щоб лише створити URL-адресу, використовуйте
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

Для приєднання лише зі спостереженням/керуванням браузером установіть `"mode": "transcribe"`. Це
не запускає дуплексний міст моделі реального часу, не потребує BlackHole або SoX
і не відповідатиме голосом у зустріч. Приєднання Chrome у цьому режимі також уникають
надання OpenClaw дозволу на мікрофон/камеру та уникають шляху Meet **Use
microphone**. Якщо Meet показує проміжний екран вибору аудіо, автоматизація намагається
вибрати шлях без мікрофона, а інакше повідомляє про ручну дію замість відкриття
локального мікрофона. У режимі transcribe керовані транспорти Chrome також установлюють
спостерігач субтитрів Meet на основі найкращих зусиль. `googlemeet status --json` і
`googlemeet doctor` показують `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`
і короткий хвіст `recentTranscript`, щоб оператори могли визначити, чи браузер
приєднався до дзвінка та чи субтитри Meet створюють текст.

Під час сесій у реальному часі статус `google_meet` містить стан браузера й аудіомоста,
наприклад `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, останні мітки часу вводу/виводу,
лічильники байтів і стан закриття мосту. Якщо з’являється безпечний запит сторінки Meet,
автоматизація браузера обробляє його, коли може. Вхід, допуск організатором і
запити дозволів браузера/ОС повідомляються як ручна дія з причиною та
повідомленням, яке агент має передати. Керовані сесії Chrome відтворюють вступ або
тестову фразу лише після того, як стан браузера повідомляє `inCall: true`; інакше статус повідомляє
`speechReady: false`, а спроба мовлення блокується замість удавання, що
агент говорив у зустріч.

Локальні приєднання Chrome відбуваються через авторизований профіль браузера OpenClaw. Режим реального часу
потребує `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для
чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного
пристрою BlackHole достатньо для першого smoke-тесту, але він може створювати відлуння.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині VM macOS
лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть
вузловий хост у VM. Один раз увімкніть вбудований Plugin на VM, щоб вузол
оголошував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, провайдер реального часу
  та конфігурація Plugin Google Meet.
- Parallels macOS VM: OpenClaw CLI/вузловий хост, Google Chrome, SoX, BlackHole 2ch
  і профіль Chrome, авторизований у Google.
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

Запустіть вузловий хост у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це LAN IP і ви не використовуєте TLS, вузол відмовляється від
відкритого текстового WebSocket, якщо ви явно не дозволите це для довіреної приватної мережі:

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

Підтвердьте, що Gateway бачить вузол і що він оголошує і `googlemeet.chrome`,
і можливість браузера/`browser.proxy`:

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
фразу та друкує стан сесії:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання в реальному часі автоматизація браузера OpenClaw заповнює ім’я гостя, натискає
Join/Ask to join і приймає перший вибір Meet "Use microphone", коли цей
запит з’являється. Під час приєднання лише зі спостереженням або створення зустрічі лише через браузер вона
проходить той самий запит без мікрофона, коли такий вибір доступний.
Якщо профіль браузера не авторизований, Meet очікує допуску організатором,
Chrome потребує дозволу на мікрофон/камеру для приєднання в реальному часі або Meet застряг
на запиті, який автоматизація не змогла вирішити, результат join/test-speech повідомляє
`manualActionRequired: true` з `manualActionReason` і
`manualActionMessage`. Агенти мають припинити повторні спроби приєднання, повідомити саме це
повідомлення плюс поточні `browserUrl`/`browserTitle` і повторити спробу лише після того, як
ручну дію в браузері завершено.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає лише тоді, коли рівно один
підключений вузол оголошує і `googlemeet.chrome`, і керування браузером. Якщо
підключено кілька придатних вузлів, установіть `chromeNode.node` на id вузла,
відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `Configured Google Meet node ... is not usable: offline`: закріплений вузол
  відомий Gateway, але недоступний. Агенти мають трактувати цей вузол як
  діагностичний стан, а не як придатний до використання хост Chrome, і повідомляти
  про блокер налаштування замість переходу на інший транспорт, якщо користувач
  цього не просив.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у ВМ,
  підтвердьте сполучення та переконайтеся, що `openclaw plugins enable google-meet` і
  `openclaw plugins enable browser` були виконані у ВМ. Також підтвердьте, що
  хост Gateway дозволяє обидві команди вузла через
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: встановіть `blackhole-2ch` на хості,
  який перевіряється, і перезавантажте його перед використанням локального аудіо Chrome.
- `BlackHole 2ch audio device not found on the node`: встановіть `blackhole-2ch`
  у ВМ і перезавантажте ВМ.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера
  всередині ВМ або залиште `chrome.guestName` заданим для гостьового приєднання.
  Автоматичне гостьове приєднання використовує браузерну автоматизацію OpenClaw
  через проксі браузера вузла; переконайтеся, що конфігурація браузера вузла
  вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або іменований профіль наявного сеансу.
- Дубльовані вкладки Meet: залиште `chrome.reuseExistingTab: true` увімкненим.
  OpenClaw активує наявну вкладку для тієї самої URL-адреси Meet перед відкриттям
  нової, а створення зустрічі в браузері повторно використовує поточну вкладку
  `https://meet.google.com/new` або вкладку запиту облікового запису Google
  перед відкриттям іншої.
- Немає аудіо: у Meet спрямуйте аудіо мікрофона/динаміка через шлях віртуального
  аудіопристрою, який використовує OpenClaw; використовуйте окремі віртуальні
  пристрої або маршрутизацію у стилі Loopback для чистого дуплексного аудіо.

## Примітки щодо встановлення

Стандартний режим Chrome у реальному часі використовує два зовнішні інструменти:

- `sox`: аудіоутиліта командного рядка. Plugin використовує явні команди
  пристроїв CoreAudio для стандартного аудіомоста PCM16 24 кГц.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій
  `BlackHole 2ch`, через який Chrome/Meet може маршрутизувати аудіо.

OpenClaw не комплектує і не розповсюджує жоден із цих пакетів. Документація
просить користувачів встановити їх як залежності хоста через Homebrew. SoX
ліцензовано як `LGPL-2.0-only AND GPL-2.0-only`; BlackHole має ліцензію GPL-3.0.
Якщо ви створюєте інсталятор або appliance, який комплектує BlackHole з OpenClaw,
перегляньте умови ліцензування upstream BlackHole або отримайте окрему ліцензію
від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet через керування браузером OpenClaw і
приєднується як профіль браузера OpenClaw, у який виконано вхід. На macOS Plugin
перевіряє наявність `BlackHole 2ch` перед запуском. Якщо налаштовано, він також
виконує команду перевірки справності аудіомоста та команду запуску перед
відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості
Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють на сполученому
вузлі, наприклад ВМ Parallels macOS. Для локального Chrome виберіть профіль через
`browser.defaultProfile`; `chrome.browserProfile` передається хостам
`chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона та динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою
налаштування, а не тихим приєднанням без аудіошляху.

### Twilio

Транспорт Twilio — це суворий план набору, делегований Plugin Voice Call. Він
не аналізує сторінки Meet для пошуку телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або потрібен резервний
варіант телефонного дозвону. Google Meet має надати номер телефонного дозвону
та PIN для зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

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
конфігурації Plugin не з’являються в уже запущеному процесі Gateway, доки він
не перезавантажиться.

Потім перевірте:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Коли делегування Twilio під’єднано, `googlemeet setup` містить успішні перевірки
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

OAuth необов’язковий для створення посилання Meet, оскільки `googlemeet create`
може повернутися до браузерної автоматизації. Налаштуйте OAuth, коли потрібні
офіційне створення через API, розв’язання просторів або попередні перевірки
Meet Media API.

Доступ до Google Meet API використовує користувацький OAuth: створіть клієнт
Google Cloud OAuth, запитайте потрібні scopes, авторизуйте обліковий запис
Google, а потім збережіть отриманий refresh token у конфігурації Plugin Google
Meet або надайте змінні середовища `OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання через Chrome. Транспорти Chrome і Chrome-node
все одно приєднуються через профіль Chrome, у який виконано вхід, BlackHole/SoX
і під’єднаний вузол, коли ви використовуєте участь через браузер. OAuth
призначений лише для офіційного шляху Google Meet API: створення просторів
зустрічей, розв’язання просторів і виконання попередніх перевірок Meet Media API.

### Створення облікових даних Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** — найпростіший варіант для організації Google Workspace.
   - **External** працює для особистих/тестових налаштувань; поки застосунок
     перебуває в Testing, додайте кожен обліковий запис Google, який
     авторизуватиме застосунок, як тестового користувача.
4. Додайте scopes, які запитує OpenClaw:
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

`meetings.space.created` потрібен Google Meet `spaces.create`.
`meetings.space.readonly` дає OpenClaw змогу розв’язувати URL-адреси/коди Meet
у простори. `meetings.conference.media.readonly` призначений для попередньої
перевірки Meet Media API та роботи з медіа; Google може вимагати участі в
Developer Preview для фактичного використання Media API. Якщо вам потрібні лише
браузерні приєднання Chrome, повністю пропустіть OAuth.

### Отримання refresh token

Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, або передайте їх
як змінні середовища, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить конфігураційний блок `oauth` з refresh token. Вона використовує
PKCE, localhost callback на `http://localhost:8085/oauth2callback` і ручний
процес копіювання/вставлення з `--manual`.

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

JSON-вивід містить:

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

Надавайте перевагу змінним середовища, коли не хочете мати refresh token у
конфігурації. Якщо присутні і значення конфігурації, і значення середовища,
Plugin спершу бере конфігурацію, а потім використовує середовище як fallback.

Згода OAuth включає створення просторів Meet, доступ для читання просторів Meet
і доступ для читання медіа конференцій Meet. Якщо ви автентифікувалися до появи
підтримки створення зустрічей, повторно виконайте
`openclaw googlemeet auth login --json`, щоб refresh token мав scope
`meetings.space.created`.

### Перевірка OAuth за допомогою doctor

Запустіть OAuth doctor, коли потрібна швидка перевірка справності без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує runtime Chrome і не потребує під’єднаного вузла Chrome. Воно
перевіряє, що конфігурація OAuth існує і що refresh token може видати access
token. JSON-звіт містить лише поля стану, як-от `ok`, `configured`,
`tokenSource`, `expiresAt`, і повідомлення перевірок; він не виводить access
token, refresh token або client secret.

Поширені результати:

| Перевірка            | Значення                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Наявний `oauth.clientId` разом із `oauth.refreshToken` або кешований access token.      |
| `oauth-token`        | Кешований access token досі чинний або refresh token видав новий access token.          |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` розв’язала наявний простір Meet.                   |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий простір Meet.                  |

Щоб також підтвердити ввімкнення Google Meet API і scope `spaces.create`,
запустіть перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює одноразову URL-адресу Meet. Використовуйте це, коли
потрібно підтвердити, що в проєкті Google Cloud увімкнено Meet API і що
авторизований обліковий запис має scope `meetings.space.created`.

Щоб підтвердити доступ для читання наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` підтверджують доступ для читання до
наявного простору, до якого авторизований обліковий запис Google має доступ.
`403` від цих перевірок зазвичай означає, що Google Meet REST API вимкнено,
refresh token зі згодою не має потрібного scope або обліковий запис Google не
має доступу до цього простору Meet. Помилка refresh-token означає, що потрібно
повторно виконати `openclaw googlemeet auth login --json` і зберегти новий блок
`oauth`.

Для браузерного fallback облікові дані OAuth не потрібні. У цьому режимі
автентифікація Google надходить із профілю Chrome, у який виконано вхід на
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

Виведіть артефакти зустрічі та відвідуваність після того, як Meet створить записи конференції:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

З `--meeting` `artifacts` і `attendance` типово використовують найновіший запис конференції. Передайте `--all-conference-records`, якщо потрібен кожен збережений запис для цієї зустрічі.

Пошук у Calendar може розв’язати URL зустрічі з Google Calendar перед читанням артефактів Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` шукає в сьогоднішньому календарі `primary` подію Calendar із посиланням Google Meet. Використовуйте `--event <query>` для пошуку відповідного тексту події, а `--calendar <id>` — для неосновного календаря. Пошук у Calendar потребує нового входу OAuth, що включає область readonly для подій Calendar. `calendar-events` попередньо показує відповідні події Meet і позначає подію, яку вибере `latest`, `artifacts`, `attendance` або `export`.

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

`artifacts` повертає метадані запису конференції, а також метадані ресурсів учасників, записів, транскрипту, структурованих записів транскрипту та розумних нотаток, коли Google надає їх для зустрічі. Використовуйте `--no-transcript-entries`, щоб пропустити пошук записів для великих зустрічей. `attendance` розгортає учасників у рядки сеансів учасників із часом першої/останньої появи, загальною тривалістю сеансу, прапорцями запізнення/раннього виходу та дубльованими ресурсами учасників, об’єднаними за користувачем, що ввійшов, або відображуваним іменем. Передайте `--no-merge-duplicates`, щоб залишити необроблені ресурси учасників окремо, `--late-after-minutes` — щоб налаштувати визначення запізнення, і `--early-before-minutes` — щоб налаштувати визначення раннього виходу.

`export` записує папку, що містить `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`. `manifest.json` фіксує вибрані вхідні дані, параметри експорту, записи конференції, вихідні файли, лічильники, джерело токена, подію Calendar, якщо її використано, і будь-які попередження про часткове отримання. Передайте `--zip`, щоб також записати переносний архів поруч із папкою. Передайте `--include-doc-bodies`, щоб експортувати пов’язані транскрипти та текст розумних нотаток Google Docs через Google Drive `files.export`; для цього потрібен новий вхід OAuth, що включає область readonly Drive Meet. Без `--include-doc-bodies` експорт включає лише метадані Meet і структуровані записи транскрипту. Якщо Google повертає часткову помилку артефакту, наприклад помилку списку розумних нотаток, запису транскрипту або тіла документа Drive, зведення й маніфест зберігають попередження замість того, щоб провалити весь експорт. Використовуйте `--dry-run`, щоб отримати ті самі дані артефактів/відвідуваності та надрукувати JSON маніфесту без створення папки чи ZIP. Це корисно перед записом великого експорту або коли агенту потрібні лише лічильники, вибрані записи та попередження.

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

Встановіть `"dryRun": true`, щоб повернути лише маніфест експорту й пропустити запис файлів.

Запустіть захищений live smoke для реальної збереженої зустрічі:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Live smoke середовище:

- `OPENCLAW_LIVE_TEST=1` вмикає захищені live тести.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` вказує на збережений URL Meet, код або `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID` надає ідентифікатор клієнта OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN` надає refresh token.
- Необов’язково: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` і `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` використовують ті самі fallback-імена без префікса `OPENCLAW_`.

Базовий live smoke для артефактів/відвідуваності потребує `https://www.googleapis.com/auth/meetings.space.readonly` і `https://www.googleapis.com/auth/meetings.conference.media.readonly`. Пошук у Calendar потребує `https://www.googleapis.com/auth/calendar.events.readonly`. Експорт тіла документа Drive потребує `https://www.googleapis.com/auth/drive.meet.readonly`.

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда друкує нові `meeting uri`, джерело та сеанс приєднання. З обліковими даними OAuth вона використовує офіційний Google Meet API. Без облікових даних OAuth вона використовує як fallback браузерний профіль із входом у закріпленому Chrome node. Агенти можуть використовувати інструмент `google_meet` з `action: "create"`, щоб створити зустріч і приєднатися за один крок. Для створення лише URL передайте `"join": false`.

Приклад JSON-виводу з браузерного fallback:

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

Якщо браузерний fallback натрапляє на вхід Google або блокування дозволів Meet до того, як зможе створити URL, метод Gateway повертає невдалу відповідь, а інструмент `google_meet` повертає структуровані деталі замість звичайного рядка:

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

Коли агент бачить `manualActionRequired: true`, він має повідомити `manualActionMessage` разом із контекстом браузерного node/tab і припинити відкривати нові вкладки Meet, доки оператор не завершить крок у браузері.

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

Створення Meet типово приєднується до зустрічі. Транспорт Chrome або Chrome-node все одно потребує браузерного профілю Google Chrome із виконаним входом, щоб приєднатися через браузер. Якщо профіль вийшов з облікового запису, OpenClaw повідомляє `manualActionRequired: true` або помилку браузерного fallback і просить оператора завершити вхід Google перед повторною спробою.

Встановлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud project, principal OAuth і учасники зустрічі зареєстровані в Google Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Загальний realtime шлях Chrome потребує лише ввімкненого Plugin, BlackHole, SoX і ключа backend realtime voice provider. OpenAI є типовим варіантом; встановіть `realtime.provider: "google"`, щоб використовувати Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Встановіть конфігурацію Plugin у `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: необов’язковий node id/name/IP для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на гостьовому екрані Meet без входу
- `chrome.autoJoin: true`: best-effort заповнення імені гостя та натискання Join Now через браузерну автоматизацію OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість відкривання дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить, що вона в дзвінку, перед запуском realtime intro
- `chrome.audioFormat: "pcm16-24khz"`: аудіоформат command-pair. Використовуйте `"g711-ulaw-8khz"` лише для legacy/custom command pairs, які все ще видають телефонне аудіо.
- `chrome.audioInputCommand`: команда SoX, що читає з CoreAudio `BlackHole 2ch` і записує аудіо у `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX, що читає аудіо у `chrome.audioFormat` і записує в CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: необов’язкова команда локального мікрофона, що записує signed 16-bit little-endian mono PCM для виявлення втручання людини, поки активне відтворення асистента. Наразі це застосовується до Gateway-hosted мосту command-pair `chrome`.
- `chrome.bargeInRmsThreshold: 650`: RMS-рівень, що вважається людським перериванням на `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: піковий рівень, що вважається людським перериванням на `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: мінімальна затримка між повторними очищеннями людського переривання
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли realtime міст підключається; встановіть `""`, щоб приєднатися мовчки
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

`voiceCall.enabled` за замовчуванням має значення `true`; із транспортом Twilio він делегує фактичний PSTN-виклик, DTMF і вступне привітання плагіну Voice Call. Voice Call відтворює послідовність DTMF перед відкриттям realtime-медіапотоку, а потім використовує збережений вступний текст як початкове realtime-привітання. Якщо `voice-call` не ввімкнено, Google Meet усе ще може перевірити й записати план набору, але не може здійснити виклик Twilio.

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

Використовуйте `transport: "chrome"`, коли Chrome працює на хості Gateway. Використовуйте `transport: "chrome-node"`, коли Chrome працює на спареному вузлі, наприклад у VM Parallels. В обох випадках realtime-модель і `openclaw_agent_consult` працюють на хості Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сеанси або переглянути ID сеансу. Використовуйте `action: "speak"` із `sessionId` і `message`, щоб realtime-агент негайно заговорив. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сеанс, запустити відому фразу й повернути стан `inCall`, коли хост Chrome може його повідомити. `test_speech` завжди примусово встановлює `mode: "realtime"` і завершується помилкою, якщо його просять працювати в `mode: "transcribe"`, оскільки сеанси лише для спостереження навмисно не можуть відтворювати мовлення. Його результат `speechOutputVerified` ґрунтується на збільшенні байтів realtime-аудіовиходу під час цього тестового виклику, тому повторно використаний сеанс зі старішим аудіо не рахується як нова успішна перевірка мовлення. Використовуйте `action: "leave"`, щоб позначити сеанс завершеним.

`status` включає стан Chrome, коли він доступний:

- `inCall`: Chrome, схоже, перебуває всередині виклику Meet
- `micMuted`: найкраща можлива оцінка стану мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профіль браузера потребує ручного входу, допуску хостом Meet, дозволів або ремонту керування браузером, перш ніж мовлення зможе працювати
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: чи дозволено зараз кероване мовлення Chrome. `speechReady: false` означає, що OpenClaw не надіслав вступну/тестову фразу в аудіоміст.
- `providerConnected` / `realtimeReady`: стан realtime-голосового мосту
- `lastInputAt` / `lastOutputAt`: останнє аудіо, побачене з мосту або надіслане до нього
- `lastSuppressedInputAt` / `suppressedInputBytes`: вхід local loopback, проігнорований під час активного відтворення асистента

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime-консультація агента

Realtime-режим Chrome оптимізовано для живого голосового циклу. Realtime-провайдер голосу чує аудіо зустрічі й говорить через налаштований аудіоміст. Коли realtime-моделі потрібні глибше міркування, актуальна інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw у фоновому режимі з контекстом останньої розшифровки зустрічі й повертає стислу усну відповідь до realtime-голосового сеансу. Потім голосова модель може промовити цю відповідь назад у зустріч. Він використовує той самий спільний realtime-інструмент консультації, що й Voice Call.

За замовчуванням консультації виконуються для агента `main`. Встановіть `realtime.agentId`, коли лінія Meet має консультуватися з виділеним робочим простором агента OpenClaw, типовими налаштуваннями моделі, політикою інструментів, пам’яттю та історією сеансу.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: надати інструмент консультації й обмежити звичайного агента до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`.
- `owner`: надати інструмент консультації й дозволити звичайному агенту використовувати стандартну політику інструментів агента.
- `none`: не надавати інструмент консультації realtime-голосовій моделі.

Ключ сеансу консультації обмежений окремим сеансом Meet, тому наступні виклики консультації можуть повторно використовувати попередній контекст консультації під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після повного приєднання Chrome до виклику:

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
- `googlemeet setup` включає `chrome-node-connected`, коли Chrome-node є транспортом за замовчуванням або вузол закріплено.
- `nodes status` показує вибраний вузол підключеним.
- Вибраний вузол оголошує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до виклику, а `test-speech` повертає стан Chrome із `inCall: true`.

Для віддаленого хоста Chrome, наприклад VM Parallels macOS, це найкоротша безпечна перевірка після оновлення Gateway або VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Це доводить, що плагін Gateway завантажено, вузол VM підключено з поточним токеном, а аудіоміст Meet доступний перед тим, як агент відкриє вкладку реальної зустрічі.

Для smoke-тесту Twilio використовуйте зустріч, яка надає дані телефонного входу:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Очікуваний стан Twilio:

- `googlemeet setup` включає зелені перевірки `twilio-voice-call-plugin`, `twilio-voice-call-credentials` і `twilio-voice-call-webhook`.
- `voicecall` доступний у CLI після перезавантаження Gateway.
- Повернений сеанс має `transport: "twilio"` і `twilio.voiceCallId`.
- `openclaw logs --follow` показує, що DTMF TwiML віддано перед realtime TwiML, а потім realtime-міст із поставленим у чергу початковим привітанням.
- `googlemeet leave <sessionId>` завершує делегований голосовий виклик.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що плагін увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно редагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway. Запущений агент бачить лише інструменти плагінів, зареєстровані поточним процесом Gateway.

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

Вузол має бути підключеним і перелічувати `googlemeet.chrome` плюс `browser.proxy`. Конфігурація Gateway має дозволяти ці команди вузла:

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

Запустіть `googlemeet test-speech` і перегляньте повернений стан Chrome. Якщо він повідомляє `manualActionRequired: true`, покажіть `manualActionMessage` оператору й припиніть повторні спроби, доки дію в браузері не буде завершено.

Поширені ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису хоста Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’явиться нативний запит дозволу Chrome.
- Закрити або відновити завислий діалог дозволів Meet.

Не повідомляйте "not signed in" лише тому, що Meet показує "Do you want people to hear you in the meeting?" Це проміжний екран вибору аудіо Meet; OpenClaw натискає **Use microphone** через автоматизацію браузера, коли це доступно, і продовжує чекати справжнього стану зустрічі. Для fallback створення лише через браузер OpenClaw може натиснути **Continue without microphone**, оскільки створення URL не потребує realtime-аудіошляху.

### Не вдається створити зустріч

`googlemeet create` спершу використовує endpoint Google Meet API `spaces.create`, коли налаштовано облікові дані OAuth. Без облікових даних OAuth він переходить до fallback через браузер закріпленого вузла Chrome. Підтвердьте:

- Для створення через API: налаштовано `oauth.clientId` і `oauth.refreshToken` або наявні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh-токен було видано після додавання підтримки створення. Старішим токенам може бракувати scope `meetings.space.created`; повторно виконайте `openclaw googlemeet auth login --json` і оновіть конфігурацію плагіна.
- Для browser fallback: `defaultTransport: "chrome-node"` і `chromeNode.node` вказують на підключений вузол із `browser.proxy` і `googlemeet.chrome`.
- Для browser fallback: профіль OpenClaw Chrome на цьому вузлі увійшов у Google і може відкрити `https://meet.google.com/new`.
- Для browser fallback: повторні спроби повторно використовують наявну вкладку `https://meet.google.com/new` або запит облікового запису Google перед відкриттям нової вкладки. Якщо агент перевищив час очікування, повторіть виклик інструмента, а не відкривайте вручну ще одну вкладку Meet.
- Для browser fallback: якщо інструмент повертає `manualActionRequired: true`, використовуйте повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і `manualActionMessage`, щоб скерувати оператора. Не повторюйте спроби в циклі, доки цю дію не завершено.
- Для browser fallback: якщо Meet показує "Do you want people to hear you in the meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для fallback лише створення, **Continue without microphone** через автоматизацію браузера й продовжити очікувати згенерований URL Meet. Якщо він не може, помилка має згадувати `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте realtime-шлях:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Use `mode: "realtime"` для прослуховування/зворотного мовлення. `mode: "transcribe"` навмисно
не запускає дуплексний realtime голосовий міст. Для observe-only налагодження
запустіть `openclaw googlemeet status --json <session-id>` після того, як учасники заговорять,
і перевірте `captioning`, `transcriptLines` та `lastCaptionText`. Якщо `inCall` має
значення true, але `transcriptLines` лишається `0`, субтитри Meet можуть бути вимкнені, ніхто
не говорив після встановлення спостерігача, інтерфейс Meet змінився або live
субтитри недоступні для мови/облікового запису зустрічі.

`googlemeet test-speech` завжди перевіряє realtime шлях і повідомляє, чи
було помічено байти виводу мосту для цього виклику. Якщо `speechOutputVerified` має значення false, а
`speechOutputTimedOut` має значення true, realtime провайдер міг прийняти
висловлювання, але OpenClaw не побачив, щоб нові байти виводу досягли аудіо
мосту Chrome.

Також перевірте:

- Ключ realtime провайдера доступний на хості Gateway, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `sox` існує на хості Chrome.
- Мікрофон і динамік Meet спрямовані через віртуальний аудіошлях, який
  використовує OpenClaw.

`googlemeet doctor [session-id]` виводить сеанс, node, стан in-call,
причину ручної дії, підключення realtime провайдера, `realtimeReady`, активність
аудіовходу/виходу, останні аудіо часові позначки, лічильники байтів і URL браузера.
Використовуйте `googlemeet status [session-id] --json`, коли потрібен сирий JSON. Використовуйте
`googlemeet doctor --oauth`, коли потрібно перевірити оновлення Google Meet OAuth
без розкриття токенів; додайте `--meeting` або `--create-space`, коли також потрібен
доказ Google Meet API.

Якщо агент перевищив час очікування і ви бачите, що вкладка Meet уже відкрита, перевірте цю вкладку
без відкриття ще однієї:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує та перевіряє
наявну вкладку Meet для вибраного транспорту. З `chrome` вона використовує локальне
керування браузером через Gateway; з `chrome-node` вона використовує налаштований
Chrome node. Вона не відкриває нову вкладку й не створює новий сеанс; вона повідомляє
поточний блокер, як-от вхід, допуск, дозволи або стан вибору аудіо.
Команда CLI звертається до налаштованого Gateway, тому Gateway має бути запущений;
`chrome-node` також вимагає, щоб Chrome node був підключений.

### Перевірки налаштування Twilio не проходять

`twilio-voice-call-plugin` не проходить, коли `voice-call` не дозволений або не ввімкнений.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` не проходить, коли бекенду Twilio бракує account
SID, auth token або caller number. Установіть їх на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` не проходить, коли `voice-call` не має публічного Webhook
доступу або коли `publicUrl` вказує на loopback чи приватний мережевий простір.
Установіть `plugins.entries.voice-call.config.publicUrl` на URL публічного провайдера або
налаштуйте tunnel/Tailscale доступ для `voice-call`.

Loopback і приватні URL не придатні для callback-ів оператора. Не використовуйте
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

Для локальної розробки використовуйте tunnel або Tailscale доступ замість URL
приватного хоста:

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

`voicecall smoke` за замовчуванням перевіряє лише готовність. Щоб виконати dry-run для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли ви навмисно хочете здійснити живий вихідний notify
call:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Виклик Twilio починається, але ніколи не входить до зустрічі

Підтвердьте, що подія Meet надає дані телефонного dial-in. Передайте точний dial-in
номер і PIN або власну DTMF послідовність:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкові `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза
перед введенням PIN.

Якщо телефонний виклик створено, але список учасників Meet ніколи не показує dial-in
учасника:

- Запустіть `openclaw googlemeet doctor <session-id>`, щоб підтвердити делегований Twilio
  call ID, чи DTMF було поставлено в чергу та чи було запитано вступне привітання.
- Запустіть `openclaw voicecall status --call-id <id>` і підтвердьте, що виклик усе ще
  активний.
- Запустіть `openclaw voicecall tail` і перевірте, що Webhook-и Twilio надходять до
  Gateway.
- Запустіть `openclaw logs --follow` і знайдіть послідовність Twilio Meet: Google
  Meet делегує приєднання, Voice Call зберігає pre-connect DTMF TwiML, віддає
  цей початковий TwiML, потім віддає realtime TwiML і запускає realtime міст
  з `initialGreeting=queued`.
- Повторно запустіть `openclaw googlemeet setup --transport twilio`; зелена перевірка налаштування
  обов’язкова, але не доводить, що PIN послідовність зустрічі правильна.
- Підтвердьте, що dial-in номер належить тому самому запрошенню Meet і регіону, що й
  PIN.
- Збільште початкові паузи в `--dtmf-sequence`, якщо Meet відповідає повільно, наприклад
  `wwww123456#`.
- Якщо учасник приєднується, але ви не чуєте привітання, перевірте
  `openclaw logs --follow` на наявність realtime TwiML, запуску realtime мосту та
  `initialGreeting=queued`. Привітання генерується з початкового
  повідомлення `voicecall.start` після підключення realtime мосту.

Якщо Webhook-и не надходять, спочатку налагодьте Voice Call Plugin: провайдер має
досягати `plugins.entries.voice-call.config.publicUrl` або налаштованого tunnel.
Див. [Усунення несправностей голосових викликів](/uk/plugins/voice-call#troubleshooting).

## Примітки

Офіційний медіа API Google Meet орієнтований на отримання, тому мовлення в Meet
call досі потребує шляху учасника. Цей Plugin робить цю межу видимою:
Chrome обробляє участь браузера та локальну аудіомаршрутизацію; Twilio обробляє
телефонну dial-in участь.

Режим Chrome realtime потребує `BlackHole 2ch` плюс одне з наведеного:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw володіє
  realtime мостом моделі та передає аудіо у форматі `chrome.audioFormat` між цими
  командами й вибраним realtime голосовим провайдером. Типовий шлях Chrome —
  24 kHz PCM16; 8 kHz G.711 mu-law залишається доступним для застарілих пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда мосту володіє всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого daemon.

Для чистого дуплексного аудіо спрямовуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може повертати аудіо інших учасників назад у виклик.

З command-pair мостом Chrome `chrome.bargeInInputCommand` може слухати
окремий локальний мікрофон і очищати відтворення асистента, коли людина починає
говорити. Це тримає мовлення людини попереду виводу асистента, навіть коли спільний
BlackHole loopback вхід тимчасово приглушений під час відтворення асистента.
Як і `chrome.audioInputCommand` та `chrome.audioOutputCommand`, це
локальна команда, налаштована оператором. Використовуйте явний довірений шлях команди або
список аргументів і не спрямовуйте її на скрипти з недовірених місць.

`googlemeet speak` запускає активний realtime аудіоміст для сеансу Chrome.
`googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих
через Voice Call Plugin, `leave` також завершує базовий голосовий виклик.

## Пов’язане

- [Voice call Plugin](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення Plugin-ів](/uk/plugins/building-plugins)
