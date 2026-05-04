---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до виклику Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий дзвінок Google Meet
    - Ви налаштовуєте Chrome, Chrome node або Twilio як транспорт Google Meet
summary: 'Plugin Google Meet: приєднання за явними URL Meet через Chrome або Twilio з типовими налаштуваннями зворотного зв’язку агента'
title: Plugin для Google Meet
x-i18n:
    generated_at: "2026-05-04T06:21:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 459802231a807001d96d43950993f612234a5394fbe8c57a9992e97e8851dda2
    source_path: plugins/google-meet.md
    workflow: 16
---

Підтримка учасника Google Meet для OpenClaw — Plugin навмисно працює лише явно:

- Він приєднується лише до явної URL-адреси `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися до
  поверненої URL-адреси.
- `agent` — стандартний режим відповіді голосом: realtime-транскрипція слухає,
  налаштований агент OpenClaw відповідає, а звичайний OpenClaw TTS промовляє в Meet.
- `bidi` лишається доступним як резервний режим прямої realtime-голосової моделі.
- Агенти вибирають поведінку приєднання через `mode`: використовуйте `agent` для живого
  прослуховування/відповіді голосом, `bidi` для прямого резервного realtime-голосу або `transcribe`,
  щоб приєднатися/керувати браузером без мосту відповіді голосом.
- Автентифікація починається як персональний Google OAuth або вже виконаний вхід у профілі Chrome.
- Автоматичного оголошення згоди немає.
- Стандартний аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на спареному вузловому хості.
- Twilio приймає номер для набору плюс необов’язковий PIN або послідовність DTMF; він
  не може набрати URL Meet напряму.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших агентських
  телеконференційних робочих процесів.

## Швидкий старт

Встановіть локальні аудіозалежності та налаштуйте постачальника realtime-транскрипції
плюс звичайний OpenClaw TTS. OpenAI є стандартним постачальником транскрипції;
Google Gemini Live також працює як окремий голосовий резерв `bidi` з
`realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` встановлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор
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

Вивід налаштування призначений бути читабельним для агента й обізнаним про режим. Він повідомляє про профіль Chrome,
закріплення вузла, а для realtime-приєднань Chrome — про аудіоміст
BlackHole/SoX і відкладені перевірки realtime-вступу. Для приєднань лише для спостереження перевірте той самий
транспорт із `--mode transcribe`; цей режим пропускає realtime-аудіопередумови,
бо він не слухає через міст і не говорить через нього:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Коли налаштовано делегування Twilio, налаштування також повідомляє, чи готові
Plugin `voice-call`, облікові дані Twilio та публічна доступність Webhook.
Вважайте будь-яку перевірку `ok: false` блокером для перевіреного транспорту й режиму,
перш ніж просити агента приєднатися. Використовуйте `openclaw googlemeet setup --json` для
скриптів або машинно-читаного виводу. Використовуйте `--transport chrome`,
`--transport chrome-node` або `--transport twilio`, щоб попередньо перевірити конкретний
транспорт до того, як агент спробує його.

Для Twilio завжди явно попередньо перевіряйте транспорт, коли стандартний транспорт
— Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Це виявляє відсутню обв’язку `voice-call`, облікові дані Twilio або недосяжну
публічну доступність Webhook до того, як агент спробує набрати зустріч.

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
  "mode": "agent"
}
```

Агентський інструмент `google_meet` лишається доступним на хостах не macOS для
артефактів, календаря, налаштування, транскрипції, Twilio та потоків `chrome-node`. Локальні
дії відповіді голосом Chrome там заблоковані, бо вбудований аудіошлях Chrome
зараз залежить від macOS `BlackHole 2ch`. На Linux використовуйте `mode: "transcribe"`,
набір Twilio або хост macOS `chrome-node` для участі Chrome з відповіддю голосом.

Створіть нову зустріч і приєднайтеся до неї:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Для кімнат, створених через API, використовуйте Google Meet `SpaceConfig.accessType`, коли хочете,
щоб політика кімнати без запиту на вхід була явною, а не успадкованою зі стандартних налаштувань
облікового запису Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` дозволяє будь-кому з URL Meet приєднатися без запиту на вхід. `TRUSTED` дозволяє
довіреним користувачам організації хоста, запрошеним зовнішнім користувачам і користувачам
телефонного набору приєднуватися без запиту на вхід. `RESTRICTED` обмежує вхід без запиту лише запрошеними. Ці
налаштування застосовуються лише до офіційного шляху створення Google Meet API, тому облікові дані OAuth
мають бути налаштовані.

Якщо ви автентифікували Google Meet до появи цієї опції, повторно запустіть
`openclaw googlemeet auth login --json` після додавання області
`meetings.space.settings` до екрана згоди Google OAuth.

Створіть лише URL без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це
  найдетермінованіший шлях, який не залежить від стану інтерфейсу браузера.
- Браузерний резерв: використовується, коли облікові дані OAuth відсутні. OpenClaw використовує
  закріплений вузол Chrome, відкриває `https://meet.google.com/new`, чекає, доки Google
  перенаправить на справжню URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Цей шлях вимагає,
  щоб у профілі OpenClaw Chrome на вузлі вже було виконано вхід у Google.
  Браузерна автоматизація обробляє власний запит Meet на мікрофон під час першого запуску; цей запит
  не вважається помилкою входу в Google.
  Потоки приєднання та створення також намагаються повторно використати наявну вкладку Meet перед відкриттям
  нової. Зіставлення ігнорує нешкідливі рядки запиту URL, як-от `authuser`, тож
  повторна спроба агента має сфокусувати вже відкриту зустріч замість створення другої
  вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` стандартно приєднується до нової зустрічі й
повертає `joined: true` плюс сесію приєднання. Щоб лише створити URL,
використовуйте `create --no-join` у CLI або передайте `"join": false` інструменту.

Або скажіть агенту: «Створи Google Meet, приєднайся до нього в режимі агентської відповіді голосом
і надішли мені посилання». Агент має викликати `google_meet` з
`action: "create"`, а потім поділитися поверненим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Для приєднання лише для спостереження/керування браузером установіть `"mode": "transcribe"`. Це
не запускає дуплексний realtime-голосовий міст, не потребує BlackHole або SoX
і не відповідатиме голосом у зустрічі. Приєднання Chrome у цьому режимі також уникає
надання дозволів OpenClaw на мікрофон/камеру та уникає шляху Meet **Використовувати
мікрофон**. Якщо Meet показує проміжний екран вибору аудіо, автоматизація пробує
шлях без мікрофона, а інакше повідомляє про ручну дію замість відкриття
локального мікрофона. У режимі транскрипції керовані транспорти Chrome також встановлюють
спостерігач субтитрів Meet у режимі найкращого зусилля. `googlemeet status --json` і
`googlemeet doctor` показують `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`
та короткий хвіст `recentTranscript`, щоб оператори могли зрозуміти, чи браузер
приєднався до дзвінка і чи субтитри Meet створюють текст.
Використовуйте `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, коли
потрібна перевірка так/ні: він приєднується в режимі транскрипції, чекає на свіжі субтитри або
рух транскрипту й повертає `listenVerified`, `listenTimedOut`, поля ручної
дії та найновіший стан субтитрів.

Під час realtime-сесій статус `google_meet` містить стан браузера й аудіомоста,
як-от `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, останні часові мітки вводу/виводу,
лічильники байтів і стан закриття моста. Якщо з’являється безпечний запит сторінки Meet,
браузерна автоматизація обробляє його, коли може. Вхід, допуск хостом і
запити дозволів браузера/ОС повідомляються як ручна дія з причиною та
повідомленням для агента, яке треба передати. Керовані сесії Chrome видають вступ або
тестову фразу лише після того, як стан браузера повідомить `inCall: true`; інакше статус повідомляє
`speechReady: false`, а спроба мовлення блокується замість удавання, що
агент говорив у зустріч.

Локальні приєднання Chrome відбуваються через профіль браузера OpenClaw, у якому виконано вхід. Realtime-режим
потребує `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для
чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного
пристрою BlackHole достатньо для першого smoke-тесту, але він може давати відлуння.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ model API всередині macOS VM,
щоб лише зробити VM власником Chrome. Запустіть Gateway і агента локально, потім запустіть
вузловий хост у VM. Один раз увімкніть вбудований Plugin у VM, щоб вузол
рекламував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робоча область агента, ключі model/API, realtime
  provider і конфігурація Google Meet Plugin.
- Parallels macOS VM: OpenClaw CLI/вузловий хост, Google Chrome, SoX, BlackHole 2ch
  і профіль Chrome із входом у Google.
- Не потрібно у VM: служба Gateway, конфігурація агента, ключ OpenAI/GPT або налаштування
  model provider.

Встановіть залежності VM:

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

Встановіть або оновіть OpenClaw у VM, потім увімкніть там вбудований Plugin:

```bash
openclaw plugins enable google-meet
```

Запустіть вузловий хост у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — LAN IP і ви не використовуєте TLS, вузол відмовляється від
відкритого WebSocket, якщо ви явно не погодитеся для цієї довіреної приватної мережі:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це середовище процесу, а не налаштування
`openclaw.json`. `openclaw node install` зберігає його в середовищі LaunchAgent,
коли воно присутнє в команді встановлення.

Схваліть вузол із хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить вузол і що він рекламує і `googlemeet.chrome`,
і можливість браузера/`browser.proxy`:

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

Для smoke-тесту однією командою, який створює або повторно використовує сесію, промовляє відому
фразу й друкує стан сесії:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання в реальному часі автоматизація браузера OpenClaw заповнює ім’я гостя, натискає
Join/Ask to join і приймає перший вибір Meet "Use microphone", коли з’являється цей
запит. Під час приєднання лише для спостереження або створення зустрічі лише в браузері вона
продовжує після того самого запиту без мікрофона, коли такий вибір доступний.
Якщо профіль браузера не ввійшов в обліковий запис, Meet очікує підтвердження від організатора,
Chrome потребує дозволу на мікрофон/камеру для приєднання в реальному часі, або Meet застряг
на запиті, який автоматизація не змогла розв’язати, результат join/test-speech повідомляє
`manualActionRequired: true` з `manualActionReason` і
`manualActionMessage`. Агенти мають припинити повторювати приєднання, повідомити це точне
повідомлення разом із поточними `browserUrl`/`browserTitle` і повторити спробу лише після
завершення ручної дії в браузері.

Якщо `chromeNode.node` опущено, OpenClaw автоматично вибирає лише тоді, коли рівно один
підключений вузол оголошує і `googlemeet.chrome`, і керування браузером. Якщо
підключено кілька придатних вузлів, установіть `chromeNode.node` на id вузла,
відображуване ім’я або віддалену IP-адресу.

Типові перевірки збоїв:

- `Configured Google Meet node ... is not usable: offline`: закріплений вузол
  відомий Gateway, але недоступний. Агенти мають розглядати цей вузол як
  діагностичний стан, а не як придатний хост Chrome, і повідомити про блокер
  налаштування замість переходу на інший транспорт, якщо користувач цього не просив.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  схваліть спарювання й переконайтеся, що `openclaw plugins enable google-meet` і
  `openclaw plugins enable browser` були виконані у VM. Також підтвердьте, що
  хост Gateway дозволяє обидві команди вузла через
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: установіть `blackhole-2ch` на хості,
  який перевіряється, і перезавантажтеся перед використанням локального аудіо Chrome.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch`
  у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або
  залиште `chrome.guestName` установленим для гостьового приєднання. Автоматичне гостьове приєднання використовує автоматизацію
  браузера OpenClaw через проксі браузера вузла; переконайтеся, що конфігурація браузера вузла
  вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або іменований профіль наявного сеансу.
- Дублікати вкладок Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw
  активує наявну вкладку для тієї самої URL-адреси Meet перед відкриттям нової, а
  створення зустрічі в браузері повторно використовує незавершену вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google перед відкриттям ще однієї.
- Немає аудіо: у Meet спрямуйте мікрофон/динамік через шлях віртуального аудіопристрою,
  який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію у стилі Loopback
  для чистого дуплексного аудіо.

## Нотатки щодо встановлення

Стандартний зворотний аудіоканал Chrome використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для аудіо. Plugin використовує явні команди пристрою CoreAudio
  для стандартного аудіомоста 24 кГц PCM16.
- `blackhole-2ch`: драйвер віртуального аудіо macOS. Він створює аудіопристрій `BlackHole 2ch`,
  через який Chrome/Meet можуть маршрутизувати аудіо.

OpenClaw не комплектує й не розповсюджує жоден із цих пакетів. Документація просить користувачів
установити їх як залежності хоста через Homebrew. SoX ліцензовано як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole має GPL-3.0. Якщо ви створюєте
інсталятор або appliance, який комплектує BlackHole з OpenClaw, перегляньте умови
ліцензування BlackHole від upstream або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet через керування браузером OpenClaw і приєднується
як профіль браузера OpenClaw, що ввійшов в обліковий запис. На macOS Plugin перевіряє наявність
`BlackHole 2ch` перед запуском. Якщо налаштовано, він також запускає команду перевірки справності
аудіомоста й команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли
Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють
на спареному вузлі, наприклад VM Parallels macOS. Для локального Chrome виберіть
профіль через `browser.defaultProfile`; `chrome.browserProfile` передається
хостам `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Маршрутизуйте аудіо мікрофона й динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування
замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план набору, делегований Plugin Voice Call. Він
не аналізує сторінки Meet для телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або потрібен резервний варіант
телефонного набору. Google Meet має надати телефонний номер для набору та PIN для
зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

Увімкніть Plugin Voice Call на хості Gateway, а не на вузлі Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
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
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Join this Google Meet as an OpenClaw agent. Be brief.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                silenceDurationMs: 500,
                startSensitivity: "high",
              },
            },
          },
        },
      },
      google: {
        enabled: true,
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
export GEMINI_API_KEY=...
```

Натомість використовуйте `realtime.provider: "openai"` з Plugin постачальника OpenAI і
`OPENAI_API_KEY`, якщо це ваш постачальник голосу в реальному часі.

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни конфігурації Plugin
не з’являються в уже запущеному процесі Gateway, доки він не перезавантажиться.

Потім перевірте:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Коли делегування Twilio підключено, `googlemeet setup` містить успішні
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

## OAuth і попередня перевірка

OAuth необов’язковий для створення посилання Meet, бо `googlemeet create` може
відкотитися до автоматизації браузера. Налаштуйте OAuth, коли потрібні офіційне створення через API,
розв’язання просторів або попередні перевірки Meet Media API.

Доступ до Google Meet API використовує користувацький OAuth: створіть OAuth-клієнт Google Cloud,
запитайте потрібні області, авторизуйте обліковий запис Google, а потім збережіть
отриманий refresh token у конфігурації Plugin Google Meet або надайте
змінні середовища `OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання Chrome. Транспорти Chrome і Chrome-node
усе одно приєднуються через профіль Chrome, що ввійшов в обліковий запис, BlackHole/SoX і підключений
вузол, коли ви використовуєте участь через браузер. OAuth призначений лише для офіційного шляху
Google Meet API: створення просторів зустрічей, розв’язання просторів і запуск попередніх
перевірок Meet Media API.

### Створіть облікові дані Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** найпростіший для організації Google Workspace.
   - **External** працює для персональних/тестових налаштувань; доки застосунок у Testing,
     додайте кожен обліковий запис Google, який авторизуватиме застосунок, як тестового користувача.
4. Додайте області, які запитує OpenClaw:
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

`meetings.space.created` потрібен Google Meet `spaces.create`.
`meetings.space.readonly` дає OpenClaw змогу розв’язувати URL-адреси/коди Meet у простори.
`meetings.space.settings` дає OpenClaw змогу передавати налаштування `SpaceConfig`, як-от
`accessType`, під час створення кімнати через API.
`meetings.conference.media.readonly` призначений для попередньої перевірки Meet Media API і роботи з медіа;
Google може вимагати реєстрації в Developer Preview для фактичного використання Media API.
Якщо вам потрібні лише браузерні приєднання Chrome, повністю пропустіть OAuth.

### Згенеруйте refresh token

Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, або передайте їх як
змінні середовища, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда друкує блок конфігурації `oauth` з refresh token. Вона використовує PKCE,
localhost callback на `http://localhost:8085/oauth2callback` і ручний
потік копіювання/вставлення з `--manual`.

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

Надавайте перевагу змінним середовища, коли не хочете зберігати refresh token у конфігурації.
Якщо наявні і значення конфігурації, і значення середовища, Plugin спочатку використовує конфігурацію,
а потім резервно звертається до середовища.

Згода OAuth охоплює створення просторів Meet, доступ для читання просторів Meet і доступ для читання
медіа конференцій Meet. Якщо ви автентифікувалися до появи підтримки створення зустрічей,
повторно виконайте `openclaw googlemeet auth login --json`, щоб refresh token мав область
`meetings.space.created`.

### Перевірте OAuth за допомогою doctor

Запускайте OAuth doctor, коли потрібна швидка перевірка справності без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує runtime Chrome і не потребує підключеного вузла Chrome. Воно
перевіряє, що конфігурація OAuth існує і що refresh token може згенерувати access
token. JSON-звіт містить лише поля стану, як-от `ok`, `configured`,
`tokenSource`, `expiresAt`, і повідомлення перевірок; він не друкує access
token, refresh token або client secret.

Типові результати:

| Перевірка            | Значення                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Наявні `oauth.clientId` і `oauth.refreshToken` або кешований токен доступу.             |
| `oauth-token`        | Кешований токен доступу досі чинний, або токен оновлення видав новий токен доступу.     |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` визначила наявний простір Meet.                     |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий простір Meet.                   |

Щоб також підтвердити ввімкнення Google Meet API і область дії `spaces.create`, запустіть
перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює одноразову URL-адресу Meet. Використовуйте її, коли потрібно підтвердити,
що в проєкті Google Cloud увімкнено Meet API і що авторизований
обліковий запис має область дії `meetings.space.created`.

Щоб підтвердити доступ для читання до наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` підтверджують доступ для читання до наявного
простору, до якого авторизований обліковий запис Google має доступ. `403` від цих перевірок
зазвичай означає, що Google Meet REST API вимкнено, погоджений токен оновлення
не має потрібної області дії або обліковий запис Google не має доступу до цього простору
Meet. Помилка токена оновлення означає, що потрібно повторно виконати `openclaw googlemeet auth login
--json` і зберегти новий блок `oauth`.

Для резервного браузерного режиму облікові дані OAuth не потрібні. У цьому режимі автентифікація Google
надходить із профілю Chrome, у який виконано вхід на вибраному Node, а не з
конфігурації OpenClaw.

Ці змінні середовища приймаються як резервні:

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

Перелічіть артефакти зустрічі та відвідуваність після того, як Meet створить записи конференції:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

З `--meeting`, `artifacts` і `attendance` типово використовують найновіший запис конференції.
Передайте `--all-conference-records`, коли потрібні всі збережені записи
для цієї зустрічі.

Пошук у календарі може визначити URL-адресу зустрічі з Google Calendar перед читанням
артефактів Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` шукає в сьогоднішньому `primary` календарі подію Calendar із
посиланням Google Meet. Використовуйте `--event <query>` для пошуку відповідного тексту події, і
`--calendar <id>` для неосновного календаря. Пошук у календарі потребує свіжого
входу OAuth, що включає область дії лише для читання подій Calendar.
`calendar-events` попередньо показує відповідні події Meet і позначає подію, яку
виберуть `latest`, `artifacts`, `attendance` або `export`.

Якщо ви вже знаєте ідентифікатор запису конференції, зверніться до нього напряму:

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

Це викликає Google Meet `spaces.endActiveConference` і потребує OAuth з областю дії
`meetings.space.created` для простору, яким авторизований обліковий запис може керувати.
OpenClaw приймає URL-адресу Meet, код зустрічі або вхід `spaces/{id}` і визначає його
як ресурс простору API перед завершенням активної конференції.
Це окремо від `googlemeet leave`: `leave` зупиняє локальну/сеансову
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
рядки сеансів учасників із часом першої/останньої появи, загальною тривалістю сеансу,
прапорцями запізнення/раннього виходу та дубльованими ресурсами учасників, об’єднаними за користувачем,
який виконав вхід, або відображуваним іменем. Передайте `--no-merge-duplicates`, щоб залишити необроблені ресурси учасників
окремими, `--late-after-minutes`, щоб налаштувати виявлення запізнення, і
`--early-before-minutes`, щоб налаштувати виявлення раннього виходу.

`export` записує папку, що містить `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`.
`manifest.json` записує вибраний вхід, параметри експорту, записи конференції,
вихідні файли, лічильники, джерело токена, подію Calendar, коли вона використовувалася, і будь-які
попередження про часткове отримання. Передайте `--zip`, щоб також записати переносний архів поруч
із папкою. Передайте `--include-doc-bodies`, щоб експортувати текст пов’язаних транскриптів і
розумних нотаток Google Docs через Google Drive `files.export`; для цього потрібен
свіжий вхід OAuth, що включає область дії лише для читання Drive Meet. Без
`--include-doc-bodies` експорт містить лише метадані Meet і структуровані записи транскрипту.
Якщо Google повертає часткову помилку артефакту, наприклад помилку переліку розумних нотаток,
запису транскрипту або тіла документа Drive, зведення і
маніфест зберігають попередження замість провалу всього експорту.
Використовуйте `--dry-run`, щоб отримати ті самі дані артефактів/відвідуваності та вивести
JSON маніфесту без створення папки або ZIP. Це корисно перед записом
великого експорту або коли агенту потрібні лише лічильники, вибрані записи і
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

Установіть `"dryRun": true`, щоб повернути лише маніфест експорту і пропустити записи файлів.

Агенти також можуть створити кімнату з підтримкою API та явною політикою доступу:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
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

Для перевірки за принципом спочатку слухання агенти мають використовувати `test_listen`, перш ніж стверджувати, що
зустріч корисна:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Запустіть захищений live smoke проти реальної збереженої зустрічі:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Запустіть live браузерну пробу за принципом спочатку слухання проти зустрічі, де хтось буде
говорити з доступними субтитрами Meet:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Середовище live smoke:

- `OPENCLAW_LIVE_TEST=1` вмикає захищені live тести.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` вказує на збережену URL-адресу Meet, код або
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID` надає ідентифікатор клієнта OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN` надає
  токен оновлення.
- Необов’язково: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` і
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` використовують ті самі резервні імена
  без префікса `OPENCLAW_`.

Базовий live smoke артефактів/відвідуваності потребує
`https://www.googleapis.com/auth/meetings.space.readonly` і
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Пошук у Calendar
потребує `https://www.googleapis.com/auth/calendar.events.readonly`. Експорт тіла документа Drive
потребує
`https://www.googleapis.com/auth/drive.meet.readonly`.

Створіть свіжий простір Meet:

```bash
openclaw googlemeet create
```

Команда виводить новий `meeting uri`, джерело і сеанс приєднання. З обліковими даними OAuth
вона використовує офіційний Google Meet API. Без облікових даних OAuth вона
використовує профіль браузера вибраного Chrome Node, у який виконано вхід, як резерв. Агенти можуть
використовувати інструмент `google_meet` з `action: "create"`, щоб створити й приєднатися за один
крок. Для створення лише URL-адреси передайте `"join": false`.

Приклад JSON-виводу з резервного браузерного режиму:

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

Якщо резервний браузерний режим натрапляє на вхід Google або блокування дозволів Meet до того, як
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
`manualActionMessage` разом із контекстом браузерного Node/вкладки й припинити відкривати нові
вкладки Meet, доки оператор не виконає браузерний крок.

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
потребує профілю Google Chrome із виконаним входом, щоб приєднатися через браузер. Якщо з
профілю виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або
помилку резервного переходу браузера й просить оператора завершити вхід у Google перед
повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
project, OAuth principal і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Загальному шляху Chrome-агента потрібні лише увімкнений Plugin, BlackHole, SoX,
ключ провайдера транскрибування в реальному часі та налаштований провайдер TTS OpenClaw.
OpenAI є стандартним провайдером транскрибування; установіть `realtime.voiceProvider` на
`"google"` і `realtime.model`, щоб використовувати Google Gemini Live для режиму `bidi`
без зміни стандартного провайдера транскрибування для agent-режиму:

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

Значення за замовчуванням:

- `defaultTransport: "chrome"`
- `defaultMode: "agent"` (`"realtime"` приймається лише як застарілий
  псевдонім сумісності для `"agent"`; нові виклики інструментів мають указувати `"agent"`)
- `chromeNode.node`: необов’язковий ідентифікатор/назва/IP Node для
  `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на екрані гостя Meet
  без виконаного входу
- `chrome.autoJoin: true`: best-effort заповнення імені гостя та натискання Join Now
  через автоматизацію браузера OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить, що вона у виклику,
  перш ніж буде запущено вступ talk-back
- `chrome.audioFormat: "pcm16-24khz"`: аудіоформат command-pair. Використовуйте
  `"g711-ulaw-8khz"` лише для застарілих/кастомних command pairs, які все ще видають
  телефонне аудіо.
- `chrome.audioBufferBytes: 4096`: буфер обробки SoX для згенерованих аудіокоманд Chrome
  command-pair. Це половина стандартного буфера SoX у 8192 байти,
  що зменшує стандартну затримку каналу, залишаючи можливість збільшити її на зайнятих хостах.
  Значення нижче мінімуму SoX обмежуються 17 байтами.
- `chrome.audioInputCommand`: команда SoX, що читає з CoreAudio `BlackHole 2ch`
  і записує аудіо у `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX, що читає аудіо у `chrome.audioFormat`
  і записує в CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: необов’язкова команда локального мікрофона, що записує
  signed 16-bit little-endian mono PCM для виявлення людського втручання, поки
  відтворення асистента активне. Наразі це застосовується до розміщеного на Gateway
  command-pair bridge `chrome`.
- `chrome.bargeInRmsThreshold: 650`: рівень RMS, який рахується як людське
  переривання на `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: піковий рівень, який рахується як людське
  переривання на `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: мінімальна затримка між повторними очищеннями
  людських переривань
- `mode: "agent"`: стандартний режим talk-back. Мовлення учасників транскрибується
  налаштованим провайдером транскрибування в реальному часі, надсилається налаштованому
  агенту OpenClaw в окремій sub-agent сесії для кожної зустрічі та озвучується через
  звичайний runtime TTS OpenClaw.
- `mode: "bidi"`: резервний прямий двонапрямний режим моделі в реальному часі. Провайдер
  голосу в реальному часі відповідає на мовлення учасників напряму й може викликати
  `openclaw_agent_consult` для глибших/підкріплених інструментами відповідей.
- `mode: "transcribe"`: режим лише спостереження без talk-back bridge.
- `realtime.provider: "openai"`: резервний варіант сумісності, що використовується, коли наведені нижче
  scoped provider fields не встановлено.
- `realtime.transcriptionProvider: "openai"`: ідентифікатор провайдера, який режим `agent`
  використовує для транскрибування в реальному часі.
- `realtime.voiceProvider`: ідентифікатор провайдера, який режим `bidi` використовує для прямого голосу
  в реальному часі. Установіть його на `"google"`, щоб використовувати Gemini Live, залишаючи
  транскрибування agent-режиму на OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли realtime bridge
  підключається; установіть значення `""`, щоб приєднатися беззвучно
- `realtime.agentId`: необов’язковий ідентифікатор агента OpenClaw для
  `openclaw_agent_consult`; стандартно `main`

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
  defaultMode: "agent",
  realtime: {
    provider: "openai",
    transcriptionProvider: "openai",
    voiceProvider: "google",
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        voice: "Kore",
      },
    },
  },
}
```

ElevenLabs для прослуховування й мовлення в agent-режимі:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
        },
      },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        config: {
          realtime: {
            transcriptionProvider: "elevenlabs",
            providers: {
              elevenlabs: {
                modelId: "scribe_v2_realtime",
                audioFormat: "ulaw_8000",
                sampleRate: 8000,
                commitStrategy: "vad",
              },
            },
          },
        },
      },
    },
  },
}
```

Постійний голос Meet береться з
`messages.tts.providers.elevenlabs.voiceId`. Відповіді агента також можуть використовувати
директиви per-reply `[[tts:voiceId=... model=eleven_v3]]`, коли перевизначення моделі TTS
увімкнені, але конфігурація є детермінованим стандартом для зустрічей.
Після приєднання журнали мають показувати `transcriptionProvider=elevenlabs`, а кожна
озвучена відповідь має логувати `provider=elevenlabs model=eleven_v3 voice=<voiceId>`.

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

`voiceCall.enabled` за замовчуванням дорівнює `true`; з транспортом Twilio він делегує
фактичний PSTN-виклик, DTMF і вступне привітання Plugin Voice Call. Voice Call
відтворює послідовність DTMF перед відкриттям медіапотоку в реальному часі, а потім використовує
збережений вступний текст як початкове привітання в реальному часі. Якщо `voice-call` не
увімкнено, Google Meet усе ще може перевірити й записати план набору, але не може
здійснити Twilio-виклик.

## Інструмент

Агенти можуть використовувати інструмент `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Використовуйте `transport: "chrome"`, коли Chrome працює на хості Gateway. Використовуйте
`transport: "chrome-node"`, коли Chrome працює на спареному Node, наприклад Parallels
VM. В обох випадках провайдери моделей і `openclaw_agent_consult` працюють на
хості Gateway, тож облікові дані моделей залишаються там. Зі стандартним `mode: "agent"`
провайдер транскрибування в реальному часі обробляє прослуховування, налаштований агент OpenClaw
створює відповідь, а звичайний TTS OpenClaw озвучує її в Meet. Використовуйте
`mode: "bidi"`, коли хочете, щоб голосова модель у реальному часі відповідала напряму.
Сире `mode: "realtime"` досі приймається як застарілий псевдонім сумісності для
`mode: "agent"`, але більше не рекламується в схемі інструмента агента.
Журнали agent-режиму містять визначений провайдер/модель транскрибування під час запуску
bridge, а також провайдер TTS, модель, голос, формат виводу й частоту дискретизації після
кожної синтезованої відповіді.

Використовуйте `action: "status"`, щоб перелічити активні сесії або переглянути ідентифікатор сесії. Використовуйте
`action: "speak"` з `sessionId` і `message`, щоб агент у реальному часі
заговорив негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сесію,
запустити відому фразу й повернути стан `inCall`, коли хост Chrome може
про нього повідомити. `test_speech` завжди примусово встановлює `mode: "agent"` і завершується помилкою, якщо його просять
працювати в `mode: "transcribe"`, бо сесії лише спостереження навмисно не можуть
видавати мовлення. Результат `speechOutputVerified` базується на збільшенні байтів аудіовиходу
в реальному часі під час цього тестового виклику, тому повторно використана сесія зі старішим аудіо
не рахується як свіжа успішна перевірка мовлення. Використовуйте `action: "leave"`, щоб позначити
сесію завершеною.

`status` містить стан Chrome, коли доступно:

- `inCall`: Chrome, схоже, перебуває всередині виклику Meet
- `micMuted`: best-effort стан мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профілю
  браузера потрібен ручний вхід, допуск хостом Meet, дозволи або
  виправлення browser-control, перш ніж мовлення зможе працювати
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: чи
  кероване мовлення Chrome дозволено зараз. `speechReady: false` означає, що OpenClaw не
  надіслав вступну/тестову фразу в audio bridge.
- `providerConnected` / `realtimeReady`: стан realtime voice bridge
- `lastInputAt` / `lastOutputAt`: останнє аудіо, отримане з bridge або надіслане до нього
- `audioOutputRouted` / `audioOutputDeviceLabel`: чи медіавивід вкладки Meet
  було активно спрямовано на пристрій BlackHole, який використовується bridge
- `lastSuppressedInputAt` / `suppressedInputBytes`: loopback-вхід, проігнорований, поки
  відтворення асистента активне

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Режими Agent і Bidi

Режим Chrome `agent` оптимізований для поведінки "мій агент у зустрічі". Провайдер
транскрибування в реальному часі чує аудіо зустрічі, фінальні транскрипти учасників
маршрутизуються через налаштованого агента OpenClaw, а відповідь
озвучується через звичайний runtime TTS OpenClaw. Установіть `mode: "bidi"`, коли хочете,
щоб голосова модель у реальному часі відповідала напряму.
Близькі фінальні фрагменти транскрипту об’єднуються перед consult, щоб один усний
хід не створював кілька застарілих часткових відповідей. Вхід у реальному часі також
приглушується, поки поставлене в чергу аудіо асистента ще відтворюється,
а нещодавні схожі на асистента луни транскрипту ігноруються перед consult агента,
щоб BlackHole loopback не змусив агента відповідати на власне мовлення.

| Режим   | Хто визначає відповідь        | Шлях виводу мовлення                   | Коли використовувати                                  |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | Налаштований агент OpenClaw   | Звичайний runtime TTS OpenClaw         | Потрібна поведінка "мій агент у зустрічі"             |
| `bidi`  | Голосова модель у реальному часі | Аудіовідповідь провайдера голосу в реальному часі | Потрібен голосовий розмовний цикл із найнижчою затримкою |

У режимі `bidi`, коли моделі в реальному часі потрібні глибші міркування, актуальна
інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент consult запускає звичайного агента OpenClaw у фоновому режимі з контекстом нещодавньої стенограми зустрічі й повертає стислу усну відповідь. У режимі `agent` OpenClaw надсилає цю відповідь безпосередньо до середовища виконання TTS; у режимі `bidi` голосова модель реального часу може озвучити результат consult назад у зустріч. Він використовує той самий спільний механізм consult, що й Voice Call.

За замовчуванням consult-запити виконуються для агента `main`. Установіть `realtime.agentId`, коли Meet-смуга має звертатися до окремого робочого простору агента OpenClaw, типових налаштувань моделі, політики інструментів, пам’яті та історії сесій.

Consult-запити в режимі агента використовують ключ сесії для кожної зустрічі `agent:<id>:subagent:google-meet:<session>`, щоб уточнювальні запитання зберігали контекст зустрічі, успадковуючи звичайну політику агента від налаштованого агента.

`realtime.toolPolicy` керує виконанням consult:

- `safe-read-only`: надати інструмент consult і обмежити звичайного агента до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`.
- `owner`: надати інструмент consult і дозволити звичайному агенту використовувати звичайну політику інструментів агента.
- `none`: не надавати інструмент consult голосовій моделі реального часу.

Ключ сесії consult обмежений окремою сесією Meet, тому подальші виклики consult можуть повторно використовувати попередній контекст consult під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднався до дзвінка:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повного join-and-speak smoke:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Чекліст live-тесту

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
- `googlemeet setup` містить `chrome-node-connected`, коли Chrome-node є типовим транспортом або закріплено Node.
- `nodes status` показує, що вибраний Node підключено.
- Вибраний Node оголошує і `googlemeet.chrome`, і `browser.proxy`.
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

Це доводить, що Plugin Gateway завантажено, VM Node підключено з поточним токеном, а аудіоміст Meet доступний до того, як агент відкриє вкладку справжньої зустрічі.

Для Twilio smoke використовуйте зустріч, яка надає дані телефонного підключення:

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
- `openclaw logs --follow` показує, що DTMF TwiML було віддано перед realtime TwiML, а потім міст реального часу з поставленим у чергу початковим привітанням.
- `googlemeet leave <sessionId>` завершує делегований голосовий виклик.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно відредагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway. Запущений агент бачить лише інструменти Plugin, зареєстровані поточним процесом Gateway.

На хостах Gateway не під macOS інструмент `google_meet`, доступний агенту, лишається видимим, але локальні дії Chrome talk-back блокуються до потрапляння в аудіоміст. Локальний звук Chrome talk-back наразі залежить від macOS `BlackHole 2ch`, тому Linux-агенти мають використовувати `mode: "transcribe"`, телефонне підключення Twilio або macOS-хост `chrome-node` замість типового шляху локального Chrome-агента.

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

Node має бути підключений і показувати `googlemeet.chrome` разом із `browser.proxy`. Конфігурація Gateway має дозволяти ці команди Node:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Якщо `googlemeet setup` не проходить `chrome-node-connected` або журнал Gateway повідомляє `gateway token mismatch`, перевстановіть або перезапустіть Node з поточним токеном Gateway. Для LAN Gateway це зазвичай означає:

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

Запустіть `googlemeet test-listen` для приєднань лише для спостереження або `googlemeet test-speech` для приєднань у реальному часі, потім перегляньте повернений стан Chrome. Якщо будь-яка перевірка повідомляє `manualActionRequired: true`, покажіть оператору `manualActionMessage` і припиніть повторні спроби, доки дію в браузері не буде завершено.

Поширені ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису хоста Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’явиться нативний запит дозволу Chrome.
- Закрити або виправити завислий діалог дозволів Meet.

Не повідомляйте «not signed in» лише тому, що Meet показує «Do you want people to hear you in the meeting?» Це проміжний екран вибору аудіо Meet; OpenClaw натискає **Use microphone** через автоматизацію браузера, коли це доступно, і продовжує чекати на справжній стан зустрічі. Для резервного створення лише через браузер OpenClaw може натиснути **Continue without microphone**, бо створення URL не потребує аудіошляху реального часу.

### Створення зустрічі не вдається

`googlemeet create` спочатку використовує endpoint Google Meet API `spaces.create`, коли OAuth-облікові дані налаштовані. Без OAuth-облікових даних він переходить до резервного браузера закріпленого Chrome Node. Підтвердьте:

- Для створення через API: `oauth.clientId` і `oauth.refreshToken` налаштовані або наявні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було видано після додавання підтримки створення. Старіші токени можуть не мати scope `meetings.space.created`; повторно виконайте `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для резервного браузера: `defaultTransport: "chrome-node"` і `chromeNode.node` вказують на підключений Node з `browser.proxy` і `googlemeet.chrome`.
- Для резервного браузера: профіль OpenClaw Chrome на цьому Node увійшов у Google і може відкрити `https://meet.google.com/new`.
- Для резервного браузера: повторні спроби повторно використовують наявну вкладку `https://meet.google.com/new` або вкладку запиту облікового запису Google перед відкриттям нової вкладки. Якщо час очікування агента спливає, повторіть виклик інструмента замість ручного відкриття ще однієї вкладки Meet.
- Для резервного браузера: якщо інструмент повертає `manualActionRequired: true`, використовуйте повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і `manualActionMessage`, щоб скерувати оператора. Не повторюйте спроби в циклі, доки цю дію не буде завершено.
- Для резервного браузера: якщо Meet показує «Do you want people to hear you in the meeting?», залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для резервного створення лише через браузер, **Continue without microphone** через автоматизацію браузера й продовжити очікування згенерованого URL Meet. Якщо це неможливо, помилка має згадувати `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте шлях реального часу:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "agent"` для звичайного шляху STT -> агент OpenClaw -> TTS talk-back або `mode: "bidi"` для прямого резервного голосового шляху реального часу. `mode: "transcribe"` навмисно не запускає міст talk-back. Для налагодження лише спостереження запустіть `openclaw googlemeet status --json <session-id>` після того, як учасники заговорять, і перевірте `captioning`, `transcriptLines` та `lastCaptionText`. Якщо `inCall` дорівнює true, але `transcriptLines` лишається `0`, субтитри Meet можуть бути вимкнені, ніхто не говорив після встановлення спостерігача, інтерфейс Meet змінився або live-субтитри недоступні для мови/облікового запису зустрічі.

`googlemeet test-speech` завжди перевіряє шлях реального часу й повідомляє, чи було зафіксовано вихідні байти мосту для цього виклику. Якщо `speechOutputVerified` дорівнює false, а `speechOutputTimedOut` дорівнює true, realtime-провайдер міг прийняти висловлювання, але OpenClaw не побачив, щоб нові вихідні байти дійшли до аудіомоста Chrome.

Також перевірте:

- Ключ realtime-провайдера доступний на хості Gateway, наприклад `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видно на хості Chrome.
- `sox` існує на хості Chrome.
- Мікрофон і динамік Meet маршрутизуються через віртуальний аудіошлях, який використовує OpenClaw. `doctor` має показувати `meet output routed: yes` для локальних Chrome-приєднань у реальному часі.

`googlemeet doctor [session-id]` друкує сесію, Node, стан у дзвінку, причину ручної дії, підключення realtime-провайдера, `realtimeReady`, активність аудіовходу/аудіовиходу, останні аудіомітки часу, лічильники байтів і URL браузера. Використовуйте `googlemeet status [session-id] --json`, коли потрібен сирий JSON. Використовуйте `googlemeet doctor --oauth`, коли потрібно перевірити оновлення Google Meet OAuth без розкриття токенів; додайте `--meeting` або `--create-space`, коли також потрібен доказ Google Meet API.

Якщо час очікування агента сплив і ви бачите вже відкриту вкладку Meet, огляньте цю вкладку без відкриття ще однієї:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Відповідна дія інструмента — `recover_current_tab`. Вона фокусується на наявній вкладці Meet і оглядає її для вибраного транспорту. З `chrome` вона використовує локальне керування браузером через Gateway; з `chrome-node` вона використовує налаштований Chrome Node. Вона не відкриває нову вкладку й не створює нову сесію; вона повідомляє поточний блокер, наприклад стан входу, допуску, дозволів або вибору аудіо. Команда CLI звертається до налаштованого Gateway, тому Gateway має бути запущений; `chrome-node` також потребує підключеного Chrome Node.

### Перевірки налаштування Twilio не проходять

`twilio-voice-call-plugin` не проходить, коли `voice-call` не дозволений або не ввімкнений. Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте Gateway.

`twilio-voice-call-credentials` не проходить, коли в бекенді Twilio бракує account SID, auth token або номера відправника. Установіть їх на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` не проходить, коли `voice-call` не має публічного Webhook-доступу або коли `publicUrl` вказує на loopback чи приватний мережевий простір. Установіть `plugins.entries.voice-call.config.publicUrl` на URL публічного провайдера або налаштуйте тунель/Tailscale-доступ для `voice-call`.

Loopback і приватні URL недійсні для callback-викликів операторів зв’язку. Не використовуйте `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` або `fd00::/8` як `publicUrl`.

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

Для локальної розробки використовуйте тунель або експонування через Tailscale замість приватної
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

`voicecall smoke` за замовчуванням лише перевіряє готовність. Щоб виконати пробний запуск для певного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли навмисно хочете здійснити реальний вихідний сповіщувальний
дзвінок:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Виклик Twilio починається, але ніколи не входить у зустріч

Переконайтеся, що подія Meet надає дані для телефонного підключення. Передайте точний номер
для набору та PIN або власну послідовність DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкові `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза
перед введенням PIN.

Якщо телефонний виклик створено, але в списку учасників Meet не з’являється
учасник через телефонне підключення:

- Виконайте `openclaw googlemeet doctor <session-id>`, щоб підтвердити делегований ідентифікатор
  виклику Twilio, чи було поставлено DTMF у чергу та чи було запитано вступове привітання.
- Виконайте `openclaw voicecall status --call-id <id>` і переконайтеся, що виклик досі
  активний.
- Виконайте `openclaw voicecall tail` і перевірте, що Webhook-и Twilio надходять до
  Gateway.
- Виконайте `openclaw logs --follow` і знайдіть послідовність Twilio Meet: Google
  Meet делегує приєднання, Voice Call запускає телефонну частину, Google Meet очікує
  `voiceCall.dtmfDelayMs`, надсилає DTMF через `voicecall.dtmf`, очікує
  `voiceCall.postDtmfSpeechDelayMs`, а потім запитує вступове мовлення через
  `voicecall.speak`.
- Повторно виконайте `openclaw googlemeet setup --transport twilio`; успішна перевірка налаштування
  потрібна, але вона не доводить, що послідовність PIN для зустрічі правильна.
- Переконайтеся, що номер для набору належить до того самого запрошення Meet і регіону, що й
  PIN.
- Збільште `voiceCall.dtmfDelayMs`, якщо Meet відповідає повільно або транскрипт виклику
  досі показує запит на введення PIN після надсилання DTMF.
- Якщо учасник приєднується, але ви не чуєте привітання, перевірте
  `openclaw logs --follow` на наявність post-DTMF-запиту `voicecall.speak` і
  або відтворення TTS через медіапотік, або резервний варіант Twilio `<Say>`. Якщо транскрипт виклику
  досі містить "enter the meeting PIN", телефонна частина ще не приєдналася
  до кімнати Meet, тому учасники зустрічі не почують мовлення.

Якщо Webhook-и не надходять, спочатку налагодьте Plugin Voice Call: провайдер має
досягати `plugins.entries.voice-call.config.publicUrl` або налаштованого тунелю.
Дивіться [усунення несправностей голосових викликів](/uk/plugins/voice-call#troubleshooting).

## Примітки

Офіційний медіа API Google Meet орієнтований на отримання, тому для мовлення в
дзвінку Meet усе ще потрібен шлях учасника. Цей Plugin залишає цю межу видимою:
Chrome обробляє участь через браузер і локальну маршрутизацію аудіо; Twilio обробляє
участь через телефонне підключення.

Режими зворотного мовлення Chrome потребують `BlackHole 2ch` і одного з таких варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує
  мостом і передає аудіо у форматі `chrome.audioFormat` між цими командами та
  вибраним провайдером. Режим агента використовує транскрипцію в реальному часі плюс звичайний TTS;
  двонапрямний режим використовує голосового провайдера реального часу. Стандартний шлях Chrome — 24 кГц
  PCM16 з `chrome.audioBufferBytes: 4096`; 8 кГц G.711 mu-law залишається
  доступним для застарілих пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда моста керує всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона. Це дійсно лише
  для `bidi`, тому що режим `agent` потребує прямого доступу до пари команд для TTS.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може повертати інших учасників назад у дзвінок як ехо.

З мостом Chrome на основі пари команд `chrome.bargeInInputCommand` може слухати
окремий локальний мікрофон і очищати відтворення асистента, коли людина починає
говорити. Це утримує мовлення людини попереду виводу асистента навіть тоді, коли спільний
вхід BlackHole loopback тимчасово приглушено під час відтворення асистента.
Як і `chrome.audioInputCommand` та `chrome.audioOutputCommand`, це локальна команда,
налаштована оператором. Використовуйте явний довірений шлях до команди або
список аргументів і не спрямовуйте її на скрипти з недовірених розташувань.

`googlemeet speak` запускає активний аудіоміст зворотного мовлення для сесії Chrome.
`googlemeet leave` зупиняє цей міст. Для сесій Twilio, делегованих
через Plugin Voice Call, `leave` також завершує базовий голосовий виклик.
Використовуйте `googlemeet end-active-conference`, коли також потрібно закрити активну
конференцію Google Meet для простору, керованого API.

## Пов’язано

- [Plugin голосових викликів](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення Plugin-ів](/uk/plugins/building-plugins)
