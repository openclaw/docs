---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий дзвінок Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio з типовими налаштуваннями голосу в реальному часі'
title: Plugin для Google Meet
x-i18n:
    generated_at: "2026-05-04T00:59:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46b5a78c09ea1fa1ea1afd6cd8a3d607877f370ca56341753eac9cd7647fe3c3
    source_path: plugins/google-meet.md
    workflow: 16
---

Підтримка учасника Google Meet для OpenClaw — Plugin навмисно спроєктований як явний:

- Він приєднується лише до явної URL-адреси `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися за
  поверненою URL-адресою.
- Голос `realtime` є режимом за замовчуванням.
- Голос у реальному часі може звертатися назад до повного агента OpenClaw, коли потрібні глибші
  міркування або інструменти.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `realtime` для живого
  прослуховування/відповіді голосом або `transcribe`, щоб приєднатися/керувати браузером без
  голосового мосту реального часу.
- Автентифікація починається як особистий Google OAuth або вже виконаний вхід у профілі Chrome.
- Автоматичного оголошення згоди немає.
- Стандартний аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на спареному вузловому хості.
- Twilio приймає номер дозвону плюс необов’язковий PIN або послідовність DTMF; він
  не може набрати URL Meet напряму.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших
  телеконференційних робочих процесів агента.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте бекенд-провайдера голосу реального часу.
OpenAI використовується за замовчуванням; Google Gemini Live також працює з
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

Вивід налаштування призначений для читання агентом і враховує режим. Він повідомляє про профіль Chrome,
закріплення вузла та, для приєднань Chrome у реальному часі, аудіоміст BlackHole/SoX
і відкладені перевірки вступу в реальному часі. Для приєднань лише для спостереження перевірте той самий
транспорт за допомогою `--mode transcribe`; цей режим пропускає передумови аудіо реального часу,
оскільки він не слухає й не говорить через міст:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Коли делегування Twilio налаштовано, налаштування також повідомляє, чи готові
Plugin `voice-call`, облікові дані Twilio та публічне відкриття Webhook.
Вважайте будь-яку перевірку `ok: false` блокером для перевірюваного транспорту й режиму,
перш ніж просити агента приєднатися. Використовуйте `openclaw googlemeet setup --json` для
скриптів або машинозчитуваного виводу. Використовуйте `--transport chrome`,
`--transport chrome-node` або `--transport twilio`, щоб попередньо перевірити конкретний
транспорт перед тим, як агент спробує його використати.

Для Twilio завжди явно виконуйте попередню перевірку транспорту, коли стандартний транспорт —
Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Це виявляє відсутню прив’язку `voice-call`, облікові дані Twilio або недоступне
відкриття Webhook до того, як агент спробує набрати зустріч.

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

Агентський інструмент `google_meet` залишається доступним на хостах не з macOS для
артефактів, календаря, налаштування, транскрибування, Twilio та потоків `chrome-node`. Локальні
дії Chrome у реальному часі там заблоковані, оскільки вбудований аудіошлях Chrome
реального часу наразі залежить від macOS `BlackHole 2ch`. На Linux використовуйте
`mode: "transcribe"`, дозвін Twilio або macOS-хост `chrome-node` для участі Chrome
у реальному часі.

Створіть нову зустріч і приєднайтеся до неї:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Для кімнат, створених через API, використовуйте Google Meet `SpaceConfig.accessType`, коли хочете,
щоб політика кімнати без стуку була явною, а не успадкованою зі стандартних параметрів
облікового запису Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` дозволяє будь-кому з URL Meet приєднатися без стуку. `TRUSTED` дозволяє
довіреним користувачам організації хоста, запрошеним зовнішнім користувачам і користувачам
дозвону приєднуватися без стуку. `RESTRICTED` обмежує вхід без стуку запрошеними.
Ці параметри застосовуються лише до офіційного шляху створення Google Meet API, тому
облікові дані OAuth мають бути налаштовані.

Якщо ви автентифікували Google Meet до появи цієї опції, повторно виконайте
`openclaw googlemeet auth login --json` після додавання області
`meetings.space.settings` до вашого екрана згоди Google OAuth.

Створіть лише URL без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це
  найдетермінованіший шлях, який не залежить від стану інтерфейсу браузера.
- Резервний браузерний шлях: використовується, коли облікові дані OAuth відсутні. OpenClaw використовує
  закріплений вузол Chrome, відкриває `https://meet.google.com/new`, чекає, доки Google
  перенаправить на справжню URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Цей шлях потребує,
  щоб профіль OpenClaw Chrome на вузлі вже був увійшов у Google.
  Автоматизація браузера обробляє власний запит Meet першого запуску щодо мікрофона; цей запит
  не вважається помилкою входу Google.
  Потоки приєднання та створення також намагаються повторно використати наявну вкладку Meet перед відкриттям
  нової. Зіставлення ігнорує нешкідливі рядки запиту URL, такі як `authuser`, тож
  повторна спроба агента має сфокусувати вже відкриту зустріч замість створення другої
  вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` за замовчуванням приєднується до нової зустрічі та
повертає `joined: true` плюс сеанс приєднання. Щоб лише створити URL, використовуйте
`create --no-join` у CLI або передайте `"join": false` до інструмента.

Або скажіть агенту: «Створи Google Meet, приєднайся з голосом у реальному часі та надішли
мені посилання». Агент має викликати `google_meet` з `action: "create"`, а потім
поширити повернений `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Для приєднання лише для спостереження/керування браузером задайте `"mode": "transcribe"`. Це
не запускає дуплексний голосовий міст реального часу, не потребує BlackHole або SoX
і не відповідатиме голосом у зустріч. Приєднання Chrome у цьому режимі також уникають
надання OpenClaw дозволу на мікрофон/камеру та уникають шляху Meet **Use
microphone**. Якщо Meet показує проміжний екран вибору аудіо, автоматизація намагається
шлях без мікрофона, а інакше повідомляє про ручну дію замість відкриття
локального мікрофона. У режимі транскрибування керовані транспорти Chrome також установлюють
best-effort спостерігач субтитрів Meet. `googlemeet status --json` і
`googlemeet doctor` показують `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
і короткий хвіст `recentTranscript`, щоб оператори могли зрозуміти, чи браузер
приєднався до дзвінка та чи субтитри Meet створюють текст.
Використовуйте `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, коли
потрібна перевірка так/ні: він приєднується в режимі транскрибування, чекає свіжого руху субтитрів або
транскрипту та повертає `listenVerified`, `listenTimedOut`, поля ручної
дії та останній стан субтитрів.

Під час сеансів реального часу статус `google_meet` містить стан браузера й аудіомосту,
зокрема `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, останні часові позначки введення/виведення,
лічильники байтів і стан закриття мосту. Якщо з’являється безпечний запит сторінки Meet,
автоматизація браузера обробляє його, коли може. Вхід, допуск хостом і
запити дозволів браузера/ОС повідомляються як ручна дія з причиною та
повідомленням, яке агент має передати. Керовані сеанси Chrome відтворюють вступ або
тестову фразу лише після того, як стан браузера повідомить `inCall: true`; інакше статус повідомляє
`speechReady: false`, а спроба мовлення блокується замість удавання, що
агент говорив у зустріч.

Локальні приєднання Chrome відбуваються через профіль браузера OpenClaw із виконаним входом. Режим реального часу
потребує `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для
чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback;
одного пристрою BlackHole достатньо для першого smoke test, але він може створювати луну.

### Локальний Gateway + Chrome у Parallels

Вам **не** потрібен повний OpenClaw Gateway або ключ model API всередині macOS VM
лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть
вузловий хост у VM. Увімкніть вбудований Plugin на VM один раз, щоб вузол
оголошував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, model/API-ключі, провайдер
  реального часу та конфігурація Plugin Google Meet.
- Parallels macOS VM: OpenClaw CLI/вузловий хост, Google Chrome, SoX, BlackHole 2ch
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

Установіть або оновіть OpenClaw у VM, а потім увімкніть там вбудований Plugin:

```bash
openclaw plugins enable google-meet
```

Запустіть вузловий хост у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це LAN IP і ви не використовуєте TLS, вузол відхиляє
відкритий WebSocket, якщо ви явно не дозволите його для цієї довіреної приватної мережі:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Використовуйте ту саму змінну середовища під час встановлення вузла як LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це середовище процесу, а не параметр
`openclaw.json`. `openclaw node install` зберігає його в середовищі LaunchAgent,
коли він присутній у команді встановлення.

Схваліть вузол з хоста Gateway:

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

Для smoke test однією командою, який створює або повторно використовує сеанс, промовляє відому
фразу та друкує стан сеансу:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час realtime-приєднання браузерна автоматизація OpenClaw заповнює ім’я гостя, натискає
Join/Ask to join і приймає вибір Meet першого запуску "Use microphone", коли такий
запит з’являється. Під час observe-only-приєднання або створення browser-only зустрічі вона
продовжує повз той самий запит без мікрофона, коли такий варіант доступний.
Якщо профіль браузера не авторизований, Meet очікує допуску від організатора,
Chrome потребує дозволу на мікрофон/камеру для realtime-приєднання, або Meet завис
на запиті, який автоматизація не змогла розв’язати, результат join/test-speech повідомляє
`manualActionRequired: true` із `manualActionReason` та
`manualActionMessage`. Агенти мають припинити повторювати приєднання, повідомити це точне
повідомлення разом із поточними `browserUrl`/`browserTitle` і повторити спробу лише після
завершення ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає лише тоді, коли рівно один
підключений вузол оголошує і `googlemeet.chrome`, і керування браузером. Якщо
підключено кілька придатних вузлів, задайте `chromeNode.node` як id вузла,
відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `Configured Google Meet node ... is not usable: offline`: закріплений вузол
  відомий Gateway, але недоступний. Агенти мають сприймати цей вузол як
  діагностичний стан, а не як придатний Chrome-хост, і повідомляти про блокер налаштування
  замість перемикання на інший транспорт, якщо користувач цього не просив.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  підтвердьте спарювання і переконайтеся, що `openclaw plugins enable google-meet` та
  `openclaw plugins enable browser` були виконані у VM. Також підтвердьте, що
  хост Gateway дозволяє обидві команди вузла за допомогою
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: встановіть `blackhole-2ch` на хості,
  який перевіряється, і перезавантажтеся перед використанням локального аудіо Chrome.
- `BlackHole 2ch audio device not found on the node`: встановіть `blackhole-2ch`
  у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або
  залиште `chrome.guestName` заданим для гостьового приєднання. Гостьове автоприєднання використовує браузерну
  автоматизацію OpenClaw через браузерний проксі вузла; переконайтеся, що браузерна
  конфігурація вузла вказує на потрібний вам профіль, наприклад
  `browser.defaultProfile: "user"` або іменований профіль наявного сеансу.
- Дублікати вкладок Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw
  активує наявну вкладку для тієї самої Meet URL перед відкриттям нової, а
  браузерне створення зустрічі повторно використовує поточну вкладку `https://meet.google.com/new`
  або вкладку запиту Google-акаунта перед відкриттям іншої.
- Немає аудіо: у Meet спрямуйте мікрофон/динамік через шлях віртуального аудіопристрою,
  який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію у стилі Loopback
  для чистого дуплексного аудіо.

## Нотатки зі встановлення

Стандартна Chrome realtime-конфігурація використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для аудіо. Plugin використовує явні команди пристроїв CoreAudio
  для стандартного 24 kHz PCM16 аудіомоста.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`,
  через який Chrome/Meet можуть маршрутизувати аудіо.

OpenClaw не вбудовує і не розповсюджує жоден із цих пакетів. Документація просить користувачів
встановити їх як залежності хоста через Homebrew. SoX ліцензовано як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole має GPL-3.0. Якщо ви створюєте
інсталятор або appliance, який постачає BlackHole разом з OpenClaw, перегляньте
умови ліцензування upstream BlackHole або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває Meet URL через керування браузером OpenClaw і приєднується
як авторизований браузерний профіль OpenClaw. На macOS Plugin перевіряє наявність
`BlackHole 2ch` перед запуском. Якщо налаштовано, він також запускає команду перевірки стану
аудіомоста і команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли
Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють
на спареному вузлі, наприклад Parallels macOS VM. Для локального Chrome виберіть
профіль за допомогою `browser.defaultProfile`; `chrome.browserProfile` передається
хостам `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Маршрутизуйте аудіо мікрофона і динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування
замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio є суворим планом набору, делегованим Plugin Voice Call. Він
не аналізує сторінки Meet для пошуку телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або потрібен резервний варіант
телефонного дозвону. Google Meet має надати номер телефонного дозвону і PIN для
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

Надайте облікові дані Twilio через середовище або конфігурацію. Середовище тримає
секрети поза `openclaw.json`:

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

Коли делегування Twilio під’єднано, `googlemeet setup` включає успішні
перевірки `twilio-voice-call-plugin`, `twilio-voice-call-credentials` і
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

## OAuth і preflight

OAuth необов’язковий для створення посилання Meet, тому що `googlemeet create` може
повернутися до браузерної автоматизації. Налаштуйте OAuth, коли потрібне офіційне створення через API,
визначення простору або preflight-перевірки Meet Media API.

Доступ до Google Meet API використовує OAuth користувача: створіть OAuth-клієнт Google Cloud,
запросіть потрібні області доступу, авторизуйте обліковий запис Google, а потім збережіть
отриманий токен оновлення в конфігурації Plugin Google Meet або надайте
змінні середовища `OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання через Chrome. Транспорти Chrome і Chrome-node
досі приєднуються через профіль Chrome із виконаним входом, BlackHole/SoX і підключений
вузол, коли ви використовуєте участь через браузер. OAuth призначений лише для офіційного
шляху Google Meet API: створення просторів зустрічей, розпізнавання просторів і запуск
передпольотних перевірок Meet Media API.

### Створіть облікові дані Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** — найпростіший варіант для організації Google Workspace.
   - **External** працює для особистих/тестових налаштувань; доки застосунок перебуває в режимі Testing,
     додайте кожен обліковий запис Google, який авторизуватиме застосунок, як тестового користувача.
4. Додайте області доступу, які запитує OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Створіть OAuth client ID.
   - Тип застосунку: **Web application**.
   - Авторизований URI переспрямування:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Скопіюйте client ID і client secret.

`meetings.space.created` потрібен для Google Meet `spaces.create`.
`meetings.space.readonly` дає OpenClaw змогу розпізнавати URL/коди Meet як простори.
`meetings.space.settings` дає OpenClaw змогу передавати налаштування `SpaceConfig`, як-от
`accessType`, під час створення кімнати через API.
`meetings.conference.media.readonly` призначений для передпольотної перевірки Meet Media API і роботи
з медіа; Google може вимагати реєстрації в Developer Preview для фактичного використання Media API.
Якщо вам потрібні лише приєднання через Chrome на основі браузера, повністю пропустіть OAuth.

### Згенеруйте токен оновлення

Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, або передайте їх як
змінні середовища, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` із токеном оновлення. Вона використовує PKCE,
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

Надавайте перевагу змінним середовища, коли не хочете зберігати токен оновлення в конфігурації.
Якщо присутні і значення конфігурації, і значення середовища, Plugin спершу використовує конфігурацію,
а потім резервно звертається до середовища.

Згода OAuth включає створення просторів Meet, доступ до читання просторів Meet і доступ до читання
медіа конференцій Meet. Якщо ви автентифікувалися до появи підтримки створення зустрічей,
повторно виконайте `openclaw googlemeet auth login --json`, щоб токен оновлення мав область доступу
`meetings.space.created`.

### Перевірте OAuth за допомогою doctor

Запустіть OAuth doctor, коли потрібна швидка перевірка стану без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує runtime Chrome і не потребує підключеного вузла Chrome. Перевіряється,
що конфігурація OAuth існує і що токен оновлення може згенерувати токен доступу. Звіт JSON містить
лише поля стану, як-от `ok`, `configured`, `tokenSource`, `expiresAt`, і повідомлення перевірок;
він не друкує токен доступу, токен оновлення або client secret.

Поширені результати:

| Перевірка            | Значення                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Наявний `oauth.clientId` разом із `oauth.refreshToken` або кешований токен доступу.       |
| `oauth-token`        | Кешований токен доступу досі чинний, або токен оновлення згенерував новий токен доступу. |
| `meet-spaces-get`    | Додаткова перевірка `--meeting` розпізнала наявний простір Meet.                         |
| `meet-spaces-create` | Додаткова перевірка `--create-space` створила новий простір Meet.                        |

Щоб також підтвердити ввімкнення Google Meet API і область доступу `spaces.create`, виконайте
перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює одноразову URL-адресу Meet. Використовуйте її, коли потрібно підтвердити,
що в проєкті Google Cloud увімкнено Meet API і що авторизований
обліковий запис має scope `meetings.space.created`.

Щоб підтвердити доступ на читання для наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` підтверджують доступ на читання до наявного
простору, до якого авторизований обліковий запис Google має доступ. `403` від цих перевірок
зазвичай означає, що Google Meet REST API вимкнено, погоджений refresh token
не має потрібного scope або обліковий запис Google не може отримати доступ до цього простору
Meet. Помилка refresh token означає, що потрібно повторно виконати `openclaw googlemeet auth login
--json` і зберегти новий блок `oauth`.

Для резервного браузерного режиму облікові дані OAuth не потрібні. У цьому режимі авторизація Google
надходить із профілю Chrome, у який виконано вхід на вибраному вузлі, а не з
конфігурації OpenClaw.

Ці змінні середовища приймаються як резервні значення:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` або `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` або `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` або
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` або `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` або `GOOGLE_MEET_PREVIEW_ACK`

Розв’яжіть URL-адресу Meet, код або `spaces/{id}` через `spaces.get`:

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

З `--meeting` команди `artifacts` і `attendance` за замовчуванням використовують останній запис конференції.
Передайте `--all-conference-records`, якщо потрібні всі збережені записи
для цієї зустрічі.

Пошук у календарі може визначити URL-адресу зустрічі з Google Calendar перед читанням
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
входу OAuth, який включає scope лише для читання подій Calendar.
`calendar-events` попередньо показує відповідні події Meet і позначає подію, яку
вибере `latest`, `artifacts`, `attendance` або `export`.

Якщо ви вже знаєте ідентифікатор запису конференції, звертайтеся до нього напряму:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Завершіть активну конференцію для простору, створеного через API, коли потрібно закрити
кімнату після дзвінка:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Це викликає Google Meet `spaces.endActiveConference` і потребує OAuth зі
scope `meetings.space.created` для простору, яким авторизований обліковий запис може керувати.
OpenClaw приймає URL-адресу Meet, код зустрічі або вхідні дані `spaces/{id}` і перетворює їх
на ресурс простору API перед завершенням активної конференції.
Це окремо від `googlemeet leave`: `leave` зупиняє локальну/сесійну
участь OpenClaw, тоді як `end-active-conference` просить Google Meet завершити активну
конференцію для простору.

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
рядки сесій учасників із часом першої/останньої появи, загальною тривалістю сесії,
позначками запізнення/раннього виходу та дубльованими ресурсами учасників, об’єднаними за користувачем,
що ввійшов у систему, або відображуваним іменем. Передайте `--no-merge-duplicates`, щоб залишити сирі ресурси
учасників окремо, `--late-after-minutes`, щоб налаштувати визначення запізнення, і
`--early-before-minutes`, щоб налаштувати визначення раннього виходу.

`export` записує папку, що містить `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`.
`manifest.json` записує вибрані вхідні дані, параметри експорту, записи конференції,
вихідні файли, лічильники, джерело токена, подію Calendar, якщо її було використано, і всі
попередження про часткове отримання. Передайте `--zip`, щоб також записати переносний архів поруч
із папкою. Передайте `--include-doc-bodies`, щоб експортувати текст пов’язаних транскриптів і
розумних нотаток Google Docs через Google Drive `files.export`; для цього потрібен
новий вхід OAuth, який включає scope лише для читання Drive Meet. Без
`--include-doc-bodies` експорти містять лише метадані Meet і структуровані записи транскрипту.
Якщо Google повертає часткову помилку артефакту, як-от помилку списку розумних нотаток,
запису транскрипту або тіла документа Drive, зведення й
маніфест зберігають попередження замість збою всього експорту.
Використовуйте `--dry-run`, щоб отримати ті самі дані артефактів/відвідуваності та надрукувати
JSON маніфесту без створення папки або ZIP. Це корисно перед записом
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

Установіть `"dryRun": true`, щоб повернути лише маніфест експорту та пропустити запис файлів.

Агенти також можуть створити кімнату на базі API з явною політикою доступу:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
  "accessType": "OPEN"
}
```

І вони можуть завершити активну конференцію для відомої кімнати:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Для перевірки з пріоритетом прослуховування агенти мають використовувати `test_listen`, перш ніж стверджувати, що
зустріч корисна:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Запустіть захищений live smoke для реальної збереженої зустрічі:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Запустіть live браузерний пробник із пріоритетом прослуховування для зустрічі, де хтось
говоритиме з доступними субтитрами Meet:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Live smoke середовище:

- `OPENCLAW_LIVE_TEST=1` вмикає захищені live тести.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` вказує на збережену URL-адресу Meet, код або
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID` надає OAuth
  client id.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN` надає
  refresh token.
- Необов’язково: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` і
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` використовують ті самі резервні назви
  без префікса `OPENCLAW_`.

Базовий live smoke для артефактів/відвідуваності потребує
`https://www.googleapis.com/auth/meetings.space.readonly` і
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Пошук у Calendar
потребує `https://www.googleapis.com/auth/calendar.events.readonly`. Експорт тіла документа Drive
потребує
`https://www.googleapis.com/auth/drive.meet.readonly`.

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда друкує новий `meeting uri`, джерело та сесію приєднання. З обліковими даними OAuth
вона використовує офіційний Google Meet API. Без облікових даних OAuth вона
використовує як резервний варіант браузерний профіль закріпленого вузла Chrome, у який виконано вхід. Агенти можуть
використовувати інструмент `google_meet` з `action: "create"`, щоб створити зустріч і приєднатися за один
крок. Для створення лише URL-адреси передайте `"join": false`.

Приклад JSON-виводу з браузерного резервного режиму:

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

Якщо браузерний резервний режим натрапляє на вхід Google або блокування дозволів Meet, перш ніж він
зможе створити URL-адресу, метод Gateway повертає невдалу відповідь, а
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
`manualActionMessage` разом із контекстом браузерного вузла/вкладки та припинити відкривати нові
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

Створення Meet за замовчуванням приєднується до зустрічі. Транспорт Chrome або Chrome-node все ще
потребує профілю Google Chrome, у який виконано вхід, щоб приєднатися через браузер. Якщо
з профілю виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або
помилку браузерного резервного режиму й просить оператора завершити вхід Google перед
повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
проєкт, OAuth principal і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Загальний шлях Chrome у режимі realtime потребує лише ввімкненого Plugin, BlackHole, SoX
і ключа backend постачальника realtime voice. OpenAI є типовим; установіть
`realtime.provider: "google"`, щоб використовувати Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Налаштуйте конфігурацію Plugin у `plugins.entries.google-meet.config`:

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
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на екрані
  гостя Meet без входу в обліковий запис
- `chrome.autoJoin: true`: найкраща спроба заповнити ім’я гостя й натиснути
  Join Now через автоматизацію браузера OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкривання дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить про
  стан у дзвінку, перед запуском вступу в реальному часі
- `chrome.audioFormat: "pcm16-24khz"`: аудіоформат пари команд. Використовуйте
  `"g711-ulaw-8khz"` лише для застарілих/власних пар команд, які досі видають
  телефонне аудіо.
- `chrome.audioInputCommand`: команда SoX, що читає з CoreAudio `BlackHole 2ch`
  і записує аудіо у `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX, що читає аудіо у `chrome.audioFormat`
  і записує до CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: необов’язкова команда локального мікрофона, яка
  записує підписаний 16-бітний little-endian моно PCM для виявлення втручання
  людини під час активного відтворення асистента. Наразі це застосовується до
  розміщеного на Gateway мосту пари команд `chrome`.
- `chrome.bargeInRmsThreshold: 650`: рівень RMS, який зараховується як
  переривання людиною у `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: піковий рівень, який зараховується як
  переривання людиною у `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: мінімальна затримка між повторними очищеннями
  переривань людиною
- `realtime.strategy: "agent"`: типово. Мовлення учасників транскрибується,
  надсилається налаштованому агенту OpenClaw у сеансі підагента для окремої
  зустрічі, а повернена відповідь озвучується через провайдера реального часу.
- `realtime.strategy: "bidi"`: прямий двонапрямний режим моделі реального часу.
  Провайдер реального часу відповідає на мовлення учасників напряму й може
  викликати `openclaw_agent_consult` для глибших відповідей із підтримкою
  інструментів.
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли міст
  реального часу підключається; задайте `""`, щоб приєднатися без звуку
- `realtime.agentId`: необов’язковий ідентифікатор агента OpenClaw для
  `openclaw_agent_consult`; типово `main`

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
    strategy: "agent",
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

`voiceCall.enabled` типово має значення `true`; із транспортом Twilio він
делегує фактичний PSTN-дзвінок, DTMF і вступне привітання Plugin Voice Call.
Voice Call відтворює послідовність DTMF перед відкриттям медіапотоку реального
часу, а потім використовує збережений вступний текст як початкове привітання в
реальному часі. Якщо `voice-call` не ввімкнено, Google Meet усе одно може
перевірити й записати план набору, але не може здійснити Twilio-дзвінок.

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

Використовуйте `transport: "chrome"`, коли Chrome працює на хості Gateway.
Використовуйте `transport: "chrome-node"`, коли Chrome працює на спареному
вузлі, як-от VM Parallels. В обох випадках модель реального часу та
`openclaw_agent_consult` працюють на хості Gateway, тож облікові дані моделі
залишаються там. Із типовою `realtime.strategy: "agent"` провайдер реального
часу обробляє аудіо й транскрипцію, а налаштований агент OpenClaw створює
усну відповідь. Із `realtime.strategy: "bidi"` модель реального часу відповідає
напряму.

Використовуйте `action: "status"`, щоб перелічити активні сеанси або перевірити
ідентифікатор сеансу. Використовуйте `action: "speak"` із `sessionId` і
`message`, щоб агент реального часу заговорив негайно. Використовуйте
`action: "test_speech"`, щоб створити або повторно використати сеанс, запустити
відому фразу й повернути стан здоров’я `inCall`, коли хост Chrome може про це
повідомити. `test_speech` завжди примусово задає `mode: "realtime"` і завершується
помилкою, якщо його просять працювати в `mode: "transcribe"`, бо сеанси лише
для спостереження навмисно не можуть видавати мовлення. Його результат
`speechOutputVerified` базується на збільшенні байтів аудіовиходу реального
часу під час цього тестового виклику, тож повторно використаний сеанс зі старішим
аудіо не зараховується як нова успішна перевірка мовлення. Використовуйте
`action: "leave"`, щоб позначити сеанс завершеним.

`status` містить стан Chrome, коли він доступний:

- `inCall`: Chrome, схоже, перебуває всередині дзвінка Meet
- `micMuted`: найкраща спроба визначити стан мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профілю
  браузера потрібен ручний вхід, допуск хостом Meet, дозволи або відновлення
  керування браузером, перш ніж мовлення зможе працювати
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: чи дозволене
  зараз кероване мовлення Chrome. `speechReady: false` означає, що OpenClaw не
  надіслав вступну/тестову фразу в аудіоміст.
- `providerConnected` / `realtimeReady`: стан голосового мосту реального часу
- `lastInputAt` / `lastOutputAt`: останнє аудіо, побачене з мосту або надіслане
  до нього
- `audioOutputRouted` / `audioOutputDeviceLabel`: чи медіавихід вкладки Meet
  було активно спрямовано на пристрій BlackHole, який використовує міст
- `lastSuppressedInputAt` / `suppressedInputBytes`: вхід local loopback,
  проігнорований під час активного відтворення асистента

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Консультація агента в реальному часі

Режим реального часу Chrome оптимізовано для живого голосового циклу. Голосовий
провайдер реального часу чує аудіо зустрічі й говорить через налаштований
аудіоміст. Типова `realtime.strategy: "agent"` використовує провайдера реального
часу для аудіо I/O та транскрипції, але спрямовує фінальні транскрипти учасників
через налаштованого агента OpenClaw перед озвученням. Задайте
`realtime.strategy: "bidi"`, коли потрібно, щоб модель реального часу відповідала
напряму.
Близькі фінальні фрагменти транскрипту об’єднуються перед консультацією, щоб
один усний хід не створював кілька застарілих часткових відповідей.
Вхід реального часу також пригнічується, поки аудіо асистента в черзі ще
відтворюється, а нещодавні схожі на асистента відлуння транскрипту ігноруються
перед консультацією агента, щоб local loopback BlackHole не змушував агента
відповідати на власне мовлення.

| Стратегія | Хто визначає відповідь        | Поведінка контексту                                                                 | Коли використовувати                                  |
| -------- | ----------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `agent`  | Налаштований агент OpenClaw | Сеанс підагента для окремої зустрічі плюс звичайна політика агента, інструменти, робочий простір і пам’ять | Коли потрібна поведінка "мій агент на зустрічі"        |
| `bidi`   | Голосова модель реального часу      | Контекст сеансу реального часу з необов’язковими викликами `openclaw_agent_consult`               | Коли потрібен розмовний голосовий цикл із найменшою затримкою |

У стратегії `bidi`, коли моделі реального часу потрібні глибше міркування,
актуальна інформація або звичайні інструменти OpenClaw, вона може викликати
`openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw за лаштунками з
контекстом нещодавнього транскрипту зустрічі й повертає стислу усну відповідь до
голосового сеансу реального часу. Потім голосова модель може озвучити цю
відповідь у зустріч. Він використовує той самий спільний інструмент консультації
реального часу, що й Voice Call.

Типово консультації виконуються для агента `main`. Задайте `realtime.agentId`,
коли канал Meet має консультуватися з виділеним робочим простором агента
OpenClaw, типовими параметрами моделі, політикою інструментів, пам’яттю та
історією сеансу.

Консультації стратегії агента використовують ключ сеансу для окремої зустрічі
`agent:<id>:subagent:google-meet:<session>`, щоб подальші запитання зберігали
контекст зустрічі, успадковуючи звичайну політику агента від налаштованого
агента.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: надати інструмент консультації й обмежити звичайного агента
  до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: надати інструмент консультації й дозволити звичайному агенту
  використовувати звичайну політику інструментів агента.
- `none`: не надавати інструмент консультації голосовій моделі реального часу.

Ключ сеансу консультації обмежений окремим сеансом Meet, тож подальші виклики
консультації можуть повторно використовувати попередній контекст консультації в
межах тієї самої зустрічі.

Щоб примусово запустити усну перевірку готовності після повного приєднання
Chrome до дзвінка:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повної димової перевірки приєднання й мовлення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Контрольний список живого тесту

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
- `googlemeet setup` містить `chrome-node-connected`, коли Chrome-node є типовим
  транспортом або вузол закріплено.
- `nodes status` показує, що вибраний вузол підключено.
- Вибраний вузол оголошує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до дзвінка, а `test-speech` повертає стан Chrome із
  `inCall: true`.

Для віддаленого хоста Chrome, як-от VM Parallels macOS, це найкоротша безпечна
перевірка після оновлення Gateway або VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Це доводить, що Plugin Gateway завантажено, вузол VM підключено з поточним
токеном, а аудіоміст Meet доступний перед тим, як агент відкриє справжню вкладку
зустрічі.

Для димової перевірки Twilio використовуйте зустріч, яка надає дані телефонного
додзвону:

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
- `openclaw logs --follow` показує, що DTMF TwiML подано перед TwiML реального
  часу, а потім міст реального часу з початковим привітанням у черзі.
- `googlemeet leave <sessionId>` завершує делегований голосовий дзвінок.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Переконайтеся, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно відредагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway.
Запущений агент бачить лише інструменти Plugin, зареєстровані поточним процесом
Gateway.

На хостах Gateway не macOS інструмент `google_meet`, видимий агенту, залишається доступним,
але локальні realtime-дії Chrome блокуються до того, як потраплять в аудіоміст.
Локальний realtime-аудіо Chrome наразі залежить від macOS `BlackHole 2ch`, тому
агентам Linux слід використовувати `mode: "transcribe"`, dial-in Twilio або хост macOS
`chrome-node` замість стандартного локального realtime-шляху Chrome.

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

Потім перезавантажте сервіс вузла й повторно виконайте:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Браузер відкривається, але агент не може приєднатися

Запустіть `googlemeet test-listen` для приєднань лише в режимі спостереження або `googlemeet test-speech`
для realtime-приєднань, а потім перевірте повернутий стан Chrome. Якщо будь-яка перевірка
повідомляє `manualActionRequired: true`, покажіть оператору `manualActionMessage`
і припиніть повторні спроби, доки дію в браузері не буде завершено.

Поширені ручні дії:

- Увійдіть у профіль Chrome.
- Допустіть гостя з облікового запису організатора Meet.
- Надайте Chrome дозволи на мікрофон/камеру, коли з’явиться нативний запит дозволу
  Chrome.
- Закрийте або виправте зависле діалогове вікно дозволів Meet.

Не повідомляйте "not signed in" лише тому, що Meet показує "Do you want people to
hear you in the meeting?" Це проміжний екран вибору аудіо Meet; OpenClaw
натискає **Use microphone** через автоматизацію браузера, коли це доступно, і продовжує
очікувати реального стану зустрічі. Для резервного створення лише через браузер OpenClaw
може натиснути **Continue without microphone**, оскільки для створення URL не потрібен
realtime-аудіошлях.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує endpoint Google Meet API `spaces.create`,
коли облікові дані OAuth налаштовані. Без облікових даних OAuth він переходить до
резервного варіанта із закріпленим браузером вузла Chrome. Переконайтеся:

- Для створення через API: `oauth.clientId` і `oauth.refreshToken` налаштовані,
  або наявні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було створено після додавання підтримки
  створення. У старіших токенах може бракувати scope `meetings.space.created`; повторно виконайте
  `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для резервного варіанта через браузер: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений вузол із `browser.proxy` та
  `googlemeet.chrome`.
- Для резервного варіанта через браузер: профіль Chrome OpenClaw на цьому вузлі ввійшов
  у Google і може відкрити `https://meet.google.com/new`.
- Для резервного варіанта через браузер: повторні спроби повторно використовують наявну вкладку
  `https://meet.google.com/new` або вкладку запиту облікового запису Google перед відкриттям
  нової вкладки. Якщо в агента стається timeout, повторіть виклик інструмента замість
  ручного відкриття ще однієї вкладки Meet.
- Для резервного варіанта через браузер: якщо інструмент повертає `manualActionRequired: true`, використовуйте
  повернуті `browser.nodeId`, `browser.targetId`, `browserUrl` і
  `manualActionMessage`, щоб скерувати оператора. Не повторюйте спроби в циклі, доки цю
  дію не буде завершено.
- Для резервного варіанта через браузер: якщо Meet показує "Do you want people to hear you in the
  meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для
  резервного створення лише через браузер, **Continue without microphone** через автоматизацію
  браузера й продовжити чекати на згенерований URL Meet. Якщо він не може, помилка
  має згадувати `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте realtime-шлях:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "realtime"` для прослуховування/відповіді голосом. `mode: "transcribe"` навмисно
не запускає дуплексний realtime-голосовий міст. Для налагодження лише в режимі спостереження
запустіть `openclaw googlemeet status --json <session-id>` після того, як учасники заговорять,
і перевірте `captioning`, `transcriptLines` та `lastCaptionText`. Якщо `inCall` має
значення true, але `transcriptLines` залишається `0`, субтитри Meet можуть бути вимкнені, ніхто
не говорив після встановлення спостерігача, інтерфейс Meet змінився або живі
субтитри недоступні для мови/облікового запису зустрічі.

`googlemeet test-speech` завжди перевіряє realtime-шлях і повідомляє, чи
було спостережено вихідні байти мосту для цього виклику. Якщо `speechOutputVerified` має значення false, а
`speechOutputTimedOut` має значення true, realtime-провайдер міг прийняти
висловлювання, але OpenClaw не побачив, щоб нові вихідні байти дійшли до аудіомоста
Chrome.

Також перевірте:

- Ключ realtime-провайдера доступний на хості Gateway, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `sox` існує на хості Chrome.
- Мікрофон і динамік Meet спрямовані через віртуальний аудіошлях, який використовує
  OpenClaw. `doctor` має показувати `meet output routed: yes` для локальних realtime-приєднань Chrome.

`googlemeet doctor [session-id]` виводить сесію, вузол, стан у дзвінку,
причину ручної дії, підключення realtime-провайдера, `realtimeReady`, активність
аудіовходу/виходу, останні часові мітки аудіо, лічильники байтів і URL браузера.
Використовуйте `googlemeet status [session-id] --json`, коли потрібен необроблений JSON. Використовуйте
`googlemeet doctor --oauth`, коли потрібно перевірити Google Meet OAuth refresh
без розкриття токенів; додайте `--meeting` або `--create-space`, коли також потрібне
підтвердження Google Meet API.

Якщо в агента стався timeout і ви бачите вже відкриту вкладку Meet, перевірте цю вкладку
без відкриття іншої:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує й перевіряє
наявну вкладку Meet для вибраного транспорту. З `chrome` вона використовує локальне
керування браузером через Gateway; з `chrome-node` вона використовує налаштований
вузол Chrome. Вона не відкриває нову вкладку й не створює нову сесію; вона повідомляє
поточний блокер, наприклад вхід, допуск, дозволи або стан вибору аудіо.
Команда CLI звертається до налаштованого Gateway, тому Gateway має бути запущений;
`chrome-node` також вимагає, щоб вузол Chrome був підключений.

### Перевірки налаштування Twilio завершуються помилкою

`twilio-voice-call-plugin` завершується помилкою, коли `voice-call` не дозволено або не ввімкнено.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` завершується помилкою, коли backend Twilio не має account
SID, auth token або номера абонента. Налаштуйте їх на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` завершується помилкою, коли `voice-call` не має публічного webhook
доступу або коли `publicUrl` вказує на local loopback чи приватний мережевий простір.
Установіть `plugins.entries.voice-call.config.publicUrl` на публічний URL провайдера або
налаштуйте tunnel/Tailscale-доступ для `voice-call`.

Loopback і приватні URL не є допустимими для carrier callbacks. Не використовуйте
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

Для локальної розробки використовуйте tunnel або Tailscale-доступ замість приватного
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

`voicecall smoke` за замовчуванням лише перевіряє готовність. Щоб виконати dry-run для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли навмисно хочете здійснити живий вихідний
notify-виклик:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Виклик Twilio починається, але ніколи не входить у зустріч

Переконайтеся, що подія Meet надає дані phone dial-in. Передайте точний dial-in
номер і PIN або власну послідовність DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкову `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза
перед введенням PIN.

Якщо телефонний виклик створено, але список учасників Meet ніколи не показує dial-in
учасника:

- Запустіть `openclaw googlemeet doctor <session-id>`, щоб підтвердити делегований Twilio
  call ID, чи DTMF було поставлено в чергу та чи було запитано вступне привітання.
- Запустіть `openclaw voicecall status --call-id <id>` і переконайтеся, що виклик досі
  активний.
- Запустіть `openclaw voicecall tail` і перевірте, що webhook Twilio надходять до
  Gateway.
- Запустіть `openclaw logs --follow` і шукайте послідовність Twilio Meet: Google
  Meet делегує приєднання, Voice Call запускає телефонну гілку, Google Meet чекає
  `voiceCall.dtmfDelayMs`, надсилає DTMF через `voicecall.dtmf`, чекає
  `voiceCall.postDtmfSpeechDelayMs`, а потім запитує вступне мовлення через
  `voicecall.speak`.
- Повторно запустіть `openclaw googlemeet setup --transport twilio`; зелена перевірка налаштування
  обов’язкова, але не доводить, що послідовність PIN зустрічі правильна.
- Переконайтеся, що dial-in номер належить до того самого запрошення Meet і регіону, що й
  PIN.
- Збільште `voiceCall.dtmfDelayMs`, якщо Meet відповідає повільно або transcript виклику
  все ще показує запит на PIN після надсилання DTMF.
- Якщо учасник приєднується, але ви не чуєте привітання, перевірте
  `openclaw logs --follow` на наявність post-DTMF запиту `voicecall.speak` і
  або відтворення TTS через media-stream, або резервного Twilio `<Say>`. Якщо transcript виклику
  все ще містить "enter the meeting PIN", телефонна гілка ще не приєдналася
  до кімнати Meet, тому учасники зустрічі не почують мовлення.

Якщо webhook не надходять, спочатку налагодьте Voice Call Plugin: провайдер має
досягати `plugins.entries.voice-call.config.publicUrl` або налаштованого tunnel.
Див. [Усунення несправностей голосових викликів](/uk/plugins/voice-call#troubleshooting).

## Примітки

Офіційний медіа API Google Meet орієнтований на приймання, тому мовлення в
дзвінок Meet усе ще потребує шляху учасника. Цей Plugin зберігає цю межу видимою:
Chrome обробляє участь через браузер і локальну маршрутизацію аудіо; Twilio обробляє
участь через phone dial-in.

Realtime-режим Chrome потребує `BlackHole 2ch` плюс одного з таких:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw володіє
  голосовим мостом реального часу та передає аудіо у `chrome.audioFormat` між цими
  командами й вибраним постачальником голосу реального часу. Стандартний шлях Chrome -
  24 кГц PCM16; 8 кГц G.711 mu-law залишається доступним для застарілих пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда мосту володіє всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого дуплексного аудіо спрямовуйте вивід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може повертати луну інших учасників назад у виклик.

З мостом Chrome на основі пари команд `chrome.bargeInInputCommand` може слухати
окремий локальний мікрофон і очищати відтворення асистента, коли людина починає
говорити. Це зберігає пріоритет людського мовлення над виводом асистента, навіть коли
спільний вхід BlackHole loopback тимчасово приглушено під час відтворення асистента.
Як і `chrome.audioInputCommand` та `chrome.audioOutputCommand`, це локальна команда,
налаштована оператором. Використовуйте явний довірений шлях команди або список
аргументів і не вказуйте на скрипти з недовірених розташувань.

`googlemeet speak` запускає активний аудіоміст реального часу для сеансу Chrome.
`googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих через Plugin
голосового виклику, `leave` також завершує базовий голосовий виклик.
Використовуйте `googlemeet end-active-conference`, коли також потрібно закрити активну
конференцію Google Meet для простору, керованого API.

## Пов’язане

- [Plugin голосового виклику](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення Plugin](/uk/plugins/building-plugins)
