---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий дзвінок Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт для Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio зі стандартними налаштуваннями відповіді агента'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-04T04:47:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9caeb2d4540b833c75cd0f3b5f61a99f0a6bb16ca71a96011d25e4ea103a4601
    source_path: plugins/google-meet.md
    workflow: 16
---

Підтримка учасника Google Meet для OpenClaw — Plugin навмисно явний за дизайном:

- Він приєднується лише до явної URL-адреси `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися за
  поверненою URL-адресою.
- `agent` — типовий режим відповіді голосом: транскрибування в реальному часі слухає,
  налаштований агент OpenClaw відповідає, а звичайний OpenClaw TTS говорить у Meet.
- `bidi` залишається доступним як резервний режим прямої голосової моделі в реальному часі.
- Агенти вибирають поведінку приєднання через `mode`: використовуйте `agent` для живого
  прослуховування/відповіді голосом, `bidi` для прямого резервного голосового режиму в реальному часі або `transcribe`
  для приєднання/керування браузером без моста відповіді голосом.
- Автентифікація починається як особистий Google OAuth або вже авторизований профіль Chrome.
- Автоматичного оголошення згоди немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на спареному вузловому хості.
- Twilio приймає номер для дзвінка плюс необов’язковий PIN або послідовність DTMF; він
  не може напряму набрати URL Meet.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших агентських
  телеконференційних робочих процесів.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте постачальника транскрибування в реальному часі
плюс звичайний OpenClaw TTS. OpenAI є типовим постачальником транскрибування;
Google Gemini Live також працює як окремий резервний голосовий режим `bidi` з
`realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
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

Вивід налаштування призначений бути читабельним для агента та залежним від режиму. Він повідомляє профіль Chrome,
закріплення вузла та, для приєднань Chrome у реальному часі, аудіоміст BlackHole/SoX
і відкладені перевірки вступу в реальному часі. Для приєднань лише для спостереження перевіряйте той самий
транспорт із `--mode transcribe`; цей режим пропускає аудіопередумови реального часу,
оскільки він не слухає через міст і не говорить через нього:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Коли налаштовано делегування Twilio, налаштування також повідомляє, чи готові
Plugin `voice-call`, облікові дані Twilio та публічна доступність Webhook.
Сприймайте будь-яку перевірку `ok: false` як блокер для перевіреного транспорту й режиму
перед тим, як просити агента приєднатися. Використовуйте `openclaw googlemeet setup --json` для
скриптів або машинозчитуваного виводу. Використовуйте `--transport chrome`,
`--transport chrome-node` або `--transport twilio`, щоб попередньо перевірити конкретний
транспорт до того, як агент спробує його використати.

Для Twilio завжди явно попередньо перевіряйте транспорт, коли типовий транспорт
— Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Це виявляє відсутнє підключення `voice-call`, облікові дані Twilio або недосяжну
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

Агентський інструмент `google_meet` залишається доступним на хостах не macOS для
потоків артефактів, календаря, налаштування, транскрибування, Twilio та `chrome-node`. Локальні
дії відповіді голосом Chrome там заблоковані, оскільки вбудований аудіошлях Chrome
наразі залежить від macOS `BlackHole 2ch`. На Linux використовуйте `mode: "transcribe"`,
дзвінок Twilio або macOS-хост `chrome-node` для участі Chrome з відповіддю голосом.

Створіть нову зустріч і приєднайтеся до неї:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Для кімнат, створених через API, використовуйте Google Meet `SpaceConfig.accessType`, коли хочете,
щоб політика кімнати без запиту на допуск була явною, а не успадкованою від типових значень облікового запису Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` дозволяє будь-кому з URL Meet приєднатися без запиту на допуск. `TRUSTED` дозволяє
довіреним користувачам організації хоста, запрошеним зовнішнім користувачам і користувачам,
що дзвонять телефоном, приєднуватися без запиту на допуск. `RESTRICTED` обмежує вхід без запиту на допуск
запрошеними. Ці налаштування застосовуються лише до офіційного шляху створення Google Meet API,
тож облікові дані OAuth мають бути налаштовані.

Якщо ви автентифікували Google Meet до появи цієї опції, повторно виконайте
`openclaw googlemeet auth login --json` після додавання області
`meetings.space.settings` до екрана згоди Google OAuth.

Створіть лише URL без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це
  найдетермінованіший шлях, який не залежить від стану інтерфейсу браузера.
- Резервний браузерний шлях: використовується, коли облікових даних OAuth немає. OpenClaw використовує
  закріплений вузол Chrome, відкриває `https://meet.google.com/new`, чекає, доки Google
  перенаправить на справжню URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Цей шлях потребує,
  щоб профіль Chrome OpenClaw на вузлі вже був авторизований у Google.
  Браузерна автоматизація обробляє власний початковий запит Meet щодо мікрофона; цей запит
  не вважається помилкою входу в Google.
  Потоки приєднання та створення також намагаються повторно використати наявну вкладку Meet перед відкриттям
  нової. Зіставлення ігнорує нешкідливі рядки запиту URL, як-от `authuser`, тож
  повторна спроба агента має сфокусувати вже відкриту зустріч замість створення другої
  вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` типово приєднується до нової зустрічі та
повертає `joined: true` плюс сесію приєднання. Щоб лише створити URL, використовуйте
`create --no-join` у CLI або передайте `"join": false` інструменту.

Або скажіть агенту: "Створи Google Meet, приєднайся до нього в режимі відповіді голосом агента
і надішли мені посилання." Агент має викликати `google_meet` з
`action: "create"`, а потім поділитися поверненим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Для приєднання лише для спостереження/керування браузером задайте `"mode": "transcribe"`. Це
не запускає двонапрямний голосовий міст у реальному часі, не потребує BlackHole або SoX
і не відповідатиме голосом у зустріч. Приєднання Chrome у цьому режимі також уникають
надання OpenClaw дозволу на мікрофон/камеру та уникають шляху Meet **Use
microphone**. Якщо Meet показує проміжний екран вибору аудіо, автоматизація пробує
шлях без мікрофона, а інакше повідомляє про ручну дію замість відкриття
локального мікрофона. У режимі транскрибування керовані транспорти Chrome також встановлюють
найкращий можливий спостерігач субтитрів Meet. `googlemeet status --json` і
`googlemeet doctor` показують `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`
і короткий хвіст `recentTranscript`, щоб оператори могли зрозуміти, чи браузер
приєднався до дзвінка і чи субтитри Meet створюють текст.
Використовуйте `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, коли
потрібна перевірка так/ні: він приєднується в режимі транскрибування, чекає на нові субтитри або
рух транскрипту й повертає `listenVerified`, `listenTimedOut`, поля ручних
дій і найновіший стан субтитрів.

Під час сесій у реальному часі статус `google_meet` містить стан браузера й аудіомоста,
зокрема `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, часові мітки останнього вводу/виводу,
лічильники байтів і стан закриття моста. Якщо з’являється безпечний запит сторінки Meet,
браузерна автоматизація обробляє його, коли може. Вхід, допуск хостом і
запити дозволів браузера/ОС повідомляються як ручна дія з причиною та
повідомленням, яке агент має передати. Керовані сесії Chrome надсилають вступ або
тестову фразу лише після того, як стан браузера повідомляє `inCall: true`; інакше статус повідомляє
`speechReady: false`, а спроба мовлення блокується замість удавання, що
агент сказав щось у зустріч.

Локальні приєднання Chrome проходять через авторизований браузерний профіль OpenClaw. Режим реального часу
потребує `BlackHole 2ch` для шляху мікрофон/динамік, який використовує OpenClaw. Для
чистого двонапрямного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного
пристрою BlackHole достатньо для першого smoke-тесту, але він може давати відлуння.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM
лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть
вузловий хост у VM. Увімкніть вбудований Plugin на VM один раз, щоб вузол
оголошував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, постачальник реального часу
  і конфігурація Plugin Google Meet.
- Parallels macOS VM: OpenClaw CLI/вузловий хост, Google Chrome, SoX, BlackHole 2ch
  і профіль Chrome, авторизований у Google.
- Не потрібно у VM: служба Gateway, конфігурація агента, ключ OpenAI/GPT або
  налаштування постачальника моделі.

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

Якщо `<gateway-host>` — LAN IP і ви не використовуєте TLS, вузол відмовиться від
відкритого WebSocket, якщо ви явно не погодитеся на це для цієї довіреної приватної мережі:

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

Під час підключення в реальному часі автоматизація браузера OpenClaw заповнює ім'я гостя, натискає
Join/Ask to join і приймає перший вибір Meet "Use microphone", коли з'являється
цей запит. Під час підключення лише для спостереження або створення зустрічі лише через браузер вона
проходить повз той самий запит без мікрофона, коли такий вибір доступний.
Якщо профіль браузера не має входу в обліковий запис, Meet очікує допуску від організатора,
Chrome потребує дозволу на мікрофон/камеру для підключення в реальному часі або Meet застряг
на запиті, який автоматизація не змогла розв'язати, результат join/test-speech повідомляє
`manualActionRequired: true` з `manualActionReason` і
`manualActionMessage`. Агенти мають припинити повторні спроби підключення, повідомити саме це
повідомлення плюс поточні `browserUrl`/`browserTitle` і повторювати спробу лише після
завершення ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає лише тоді, коли рівно один
підключений вузол оголошує і `googlemeet.chrome`, і керування браузером. Якщо
підключено кілька придатних вузлів, задайте `chromeNode.node` як ідентифікатор вузла,
відображуване ім'я або віддалену IP-адресу.

Типові перевірки збоїв:

- `Configured Google Meet node ... is not usable: offline`: закріплений вузол
  відомий Gateway, але недоступний. Агенти мають трактувати цей вузол як
  діагностичний стан, а не як придатний хост Chrome, і повідомляти про блокер
  налаштування замість резервного переходу на інший транспорт, якщо користувач цього не просив.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  схваліть сполучення й переконайтеся, що `openclaw plugins enable google-meet` і
  `openclaw plugins enable browser` були виконані у VM. Також підтвердьте, що
  хост Gateway дозволяє обидві команди вузла через
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: установіть `blackhole-2ch` на хості,
  який перевіряється, і перезавантажтеся перед використанням локального аудіо Chrome.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch`
  у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або
  залиште `chrome.guestName` заданим для гостьового підключення. Автоматичне підключення гостя використовує
  автоматизацію браузера OpenClaw через браузерний проксі вузла; переконайтеся, що конфігурація браузера
  вузла вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або іменований профіль наявного сеансу.
- Дублікати вкладок Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw
  активує наявну вкладку для тієї самої URL-адреси Meet перед відкриттям нової, а
  створення зустрічі в браузері повторно використовує вкладку `https://meet.google.com/new`
  у процесі або вкладку запиту облікового запису Google перед відкриттям іншої.
- Немає аудіо: у Meet спрямуйте мікрофон/динамік через шлях віртуального аудіопристрою,
  який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію у стилі Loopback
  для чистого двостороннього аудіо.

## Нотатки щодо встановлення

Стандартне налаштування зворотного відтворення Chrome використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для аудіо. Plugin використовує явні команди пристроїв CoreAudio
  для стандартного 24 кГц PCM16 аудіомоста.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`,
  через який Chrome/Meet можуть маршрутизувати аудіо.

OpenClaw не пакує й не розповсюджує жоден із цих пакетів. Документація просить користувачів
установити їх як залежності хоста через Homebrew. SoX ліцензовано як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole має ліцензію GPL-3.0. Якщо ви створюєте
інсталятор або appliance, який пакує BlackHole разом з OpenClaw, перегляньте умови
ліцензування BlackHole upstream або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet через керування браузером OpenClaw і приєднується
як профіль браузера OpenClaw із виконаним входом. На macOS Plugin перевіряє наявність
`BlackHole 2ch` перед запуском. Якщо налаштовано, він також виконує команду
перевірки стану аудіомоста й команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли
Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють
на сполученому вузлі, наприклад Parallels macOS VM. Для локального Chrome виберіть
профіль через `browser.defaultProfile`; `chrome.browserProfile` передається
хостам `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона й динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, підключення завершується помилкою налаштування
замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план набору, делегований Voice Call plugin. Він
не аналізує сторінки Meet для пошуку телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або потрібен резервний варіант
телефонного набору. Google Meet має надавати телефонний номер для набору й PIN для
зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

Увімкніть Voice Call plugin на хості Gateway, а не на вузлі Chrome:

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

Натомість використовуйте `realtime.provider: "openai"` з OpenAI provider plugin і
`OPENAI_API_KEY`, якщо це ваш провайдер голосу в реальному часі.

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни конфігурації plugin
не з'являються у вже запущеному процесі Gateway, доки він не перезавантажиться.

Потім перевірте:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Коли делегування Twilio під'єднано, `googlemeet setup` містить успішні
перевірки `twilio-voice-call-plugin`, `twilio-voice-call-credentials` і
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

OAuth необов'язковий для створення посилання Meet, тому що `googlemeet create` може
використати резервну автоматизацію браузера. Налаштовуйте OAuth, коли потрібне офіційне створення через API,
розв'язання простору або попередні перевірки Meet Media API.

Доступ до Google Meet API використовує користувацький OAuth: створіть OAuth-клієнт Google Cloud,
запросіть потрібні області доступу, авторизуйте обліковий запис Google, а потім збережіть
отриманий refresh token у конфігурації Google Meet plugin або надайте
змінні середовища `OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях підключення через Chrome. Транспорти Chrome і Chrome-node
далі приєднуються через профіль Chrome із виконаним входом, BlackHole/SoX і підключений
вузол, коли ви використовуєте участь через браузер. OAuth призначений лише для офіційного шляху
Google Meet API: створення просторів зустрічей, розв'язання просторів і виконання попередніх
перевірок Meet Media API.

### Створення облікових даних Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** найпростіший для організації Google Workspace.
   - **External** працює для особистих/тестових налаштувань; доки застосунок перебуває в Testing,
     додайте кожен обліковий запис Google, який авторизуватиме застосунок, як тестового користувача.
4. Додайте області доступу, які запитує OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Створіть OAuth client ID.
   - Тип застосунку: **Web application**.
   - Авторизований URI перенаправлення:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Скопіюйте client ID і client secret.

`meetings.space.created` потрібен Google Meet `spaces.create`.
`meetings.space.readonly` дає OpenClaw змогу розв'язувати URL-адреси/коди Meet у простори.
`meetings.space.settings` дає OpenClaw змогу передавати налаштування `SpaceConfig`, як-от
`accessType`, під час створення кімнати через API.
`meetings.conference.media.readonly` призначено для попередньої перевірки Meet Media API і роботи з медіа;
Google може вимагати реєстрацію в Developer Preview для фактичного використання Media API.
Якщо вам потрібні лише підключення Chrome на основі браузера, повністю пропустіть OAuth.

### Випуск refresh token

Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, або передайте їх як
змінні середовища, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда друкує конфігураційний блок `oauth` із refresh token. Вона використовує PKCE,
локальний callback на `http://localhost:8085/oauth2callback` і ручний
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

Збережіть об'єкт `oauth` у конфігурації Google Meet plugin:

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

Надавайте перевагу змінним середовища, коли не хочете мати refresh token у конфігурації.
Якщо присутні і значення конфігурації, і значення середовища, Plugin спершу використовує конфігурацію,
а потім резервно звертається до середовища.

Згода OAuth включає створення простору Meet, доступ до читання простору Meet і доступ
до читання медіа конференції Meet. Якщо ви автентифікувалися до появи підтримки
створення зустрічей, повторно виконайте `openclaw googlemeet auth login --json`, щоб refresh
token мав область доступу `meetings.space.created`.

### Перевірка OAuth через doctor

Запустіть OAuth doctor, коли потрібна швидка перевірка стану без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує runtime Chrome і не потребує підключеного вузла Chrome. Воно
перевіряє, що конфігурація OAuth існує і що refresh token може випустити access
token. Звіт JSON містить лише поля стану, як-от `ok`, `configured`,
`tokenSource`, `expiresAt`, і повідомлення перевірок; він не друкує access
token, refresh token або client secret.

Типові результати:

| Перевірка            | Значення                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Наявні `oauth.clientId` плюс `oauth.refreshToken` або кешований токен доступу.          |
| `oauth-token`        | Кешований токен доступу досі чинний, або токен оновлення створив новий токен доступу.  |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` знайшла наявний простір Meet.                      |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий простір Meet.                  |

Щоб також підтвердити ввімкнення Google Meet API і scope `spaces.create`, виконайте
перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює одноразову URL-адресу Meet. Використовуйте це, коли потрібно підтвердити,
що в проєкті Google Cloud увімкнено Meet API і що авторизований
обліковий запис має scope `meetings.space.created`.

Щоб підтвердити доступ на читання для наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` підтверджують доступ на читання до наявного
простору, до якого авторизований обліковий запис Google має доступ. `403` від цих перевірок
зазвичай означає, що Google Meet REST API вимкнено, погодженому токену оновлення
бракує потрібного scope або обліковий запис Google не має доступу до цього простору Meet.
Помилка токена оновлення означає, що потрібно повторно виконати `openclaw googlemeet auth login
--json` і зберегти новий блок `oauth`.

Для резервного режиму браузера облікові дані OAuth не потрібні. У цьому режимі автентифікація Google
береться з профілю Chrome з виконаним входом на вибраному Node, а не з
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

Виконайте попередню перевірку перед роботою з медіа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Перелічіть артефакти зустрічі та відвідуваність після того, як Meet створить записи конференції:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

З `--meeting`, `artifacts` і `attendance` за замовчуванням використовують найновіший запис конференції.
Передайте `--all-conference-records`, якщо потрібні всі збережені записи
для цієї зустрічі.

Пошук у календарі може знайти URL-адресу зустрічі з Google Calendar перед читанням
артефактів Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` шукає в сьогоднішньому календарі `primary` подію Calendar з
посиланням Google Meet. Використовуйте `--event <query>` для пошуку відповідного тексту події та
`--calendar <id>` для неосновного календаря. Пошук у календарі потребує нового
входу OAuth, який включає scope лише для читання подій Calendar.
`calendar-events` попередньо показує відповідні події Meet і позначає подію, яку
вибере `latest`, `artifacts`, `attendance` або `export`.

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

Це викликає Google Meet `spaces.endActiveConference` і потребує OAuth зі
scope `meetings.space.created` для простору, яким авторизований обліковий запис може керувати.
OpenClaw приймає URL-адресу Meet, код зустрічі або вхідні дані `spaces/{id}` і перетворює їх
на ресурс простору API перед завершенням активної конференції.
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
позначками запізнення/раннього виходу та об’єднанням дубльованих ресурсів учасників за користувачем
із виконаним входом або відображуваним іменем. Передайте `--no-merge-duplicates`, щоб залишити сирі ресурси учасників
окремими, `--late-after-minutes` для налаштування виявлення запізнення та
`--early-before-minutes` для налаштування виявлення раннього виходу.

`export` записує папку, що містить `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`.
`manifest.json` фіксує вибрані вхідні дані, параметри експорту, записи конференцій,
вихідні файли, кількості, джерело токена, подію Calendar, якщо вона використовувалася, і будь-які
попередження про часткове отримання. Передайте `--zip`, щоб також записати переносний архів поруч
із папкою. Передайте `--include-doc-bodies`, щоб експортувати пов’язаний транскрипт і
текст розумних нотаток Google Docs через Google Drive `files.export`; для цього потрібен
новий вхід OAuth, який включає scope лише для читання Drive Meet. Без
`--include-doc-bodies` експорт містить лише метадані Meet і структуровані записи транскрипту.
Якщо Google повертає часткову помилку артефакту, наприклад помилку списку розумних нотаток,
запису транскрипту або тіла документа Drive, підсумок і
маніфест зберігають попередження замість того, щоб провалити весь експорт.
Використовуйте `--dry-run`, щоб отримати ті самі дані артефактів/відвідуваності та надрукувати
JSON маніфесту без створення папки або ZIP. Це корисно перед записом
великого експорту або коли агенту потрібні лише кількості, вибрані записи та
попередження.

Агенти також можуть створити такий самий пакет через інструмент `google_meet`:

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

Агенти також можуть створити кімнату на базі API з явною політикою доступу:

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

Запустіть live-браузерну перевірку з пріоритетом прослуховування для зустрічі, де хтось
говоритиме з доступними субтитрами Meet:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Середовище live smoke:

- `OPENCLAW_LIVE_TEST=1` вмикає захищені live-тести.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` вказує на збережену URL-адресу Meet, код або
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID` надає ідентифікатор клієнта OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN` надає
  токен оновлення.
- Необов’язково: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` і
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` використовують ті самі резервні назви
  без префікса `OPENCLAW_`.

Базовий live smoke для артефактів/відвідуваності потребує
`https://www.googleapis.com/auth/meetings.space.readonly` і
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Пошук у Calendar
потребує `https://www.googleapis.com/auth/calendar.events.readonly`. Експорт
тіла документа Drive потребує
`https://www.googleapis.com/auth/drive.meet.readonly`.

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда друкує новий `meeting uri`, джерело та сеанс приєднання. З обліковими даними OAuth
вона використовує офіційний Google Meet API. Без облікових даних OAuth вона
використовує профіль браузера з виконаним входом закріпленого Chrome Node як резервний варіант. Агенти можуть
використовувати інструмент `google_meet` з `action: "create"`, щоб створити й приєднатися за один
крок. Для створення лише URL-адреси передайте `"join": false`.

Приклад JSON-виводу з резервного режиму браузера:

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

Якщо резервний режим браузера натрапляє на вхід у Google або блокування дозволу Meet до того, як
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
`manualActionMessage` разом із контекстом Node/вкладки браузера та припинити відкривати нові
вкладки Meet, доки оператор не виконає крок у браузері.

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

Створення Meet за замовчуванням приєднує до зустрічі. Транспорт Chrome або Chrome-node все ще
потребує профілю Google Chrome із виконаним входом, щоб приєднатися через браузер. Якщо
профіль вийшов із системи, OpenClaw повідомляє `manualActionRequired: true` або
помилку резервного браузерного варіанта й просить оператора завершити вхід у Google перед
повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
project, OAuth principal і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Спільному шляху агента Chrome потрібні лише ввімкнений Plugin, BlackHole, SoX, ключ
провайдера транскрипції в реальному часі та налаштований провайдер TTS OpenClaw.
OpenAI є провайдером транскрипції за замовчуванням; установіть `realtime.voiceProvider` на
`"google"` і `realtime.model`, щоб використовувати Google Gemini Live для режиму `bidi`
без зміни провайдера транскрипції за замовчуванням для agent-mode:

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
- `chromeNode.node`: необов’язковий id/name/IP Node для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на екрані гостя Meet
  без виконаного входу
- `chrome.autoJoin: true`: заповнення імені гостя та натискання Join Now за принципом
  найкращого зусилля через браузерну автоматизацію OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить, що вона в дзвінку,
  перш ніж спрацює вступний talk-back
- `chrome.audioFormat: "pcm16-24khz"`: аудіоформат пари команд. Використовуйте
  `"g711-ulaw-8khz"` лише для застарілих/кастомних пар команд, які все ще видають
  телефонне аудіо.
- `chrome.audioBufferBytes: 4096`: буфер обробки SoX для згенерованих команд аудіо
  пари команд Chrome. Це половина стандартного 8192-байтового буфера SoX,
  що зменшує стандартну затримку каналу, залишаючи можливість збільшити його на завантажених хостах.
  Значення нижче мінімуму SoX обмежуються до 17 байтів.
- `chrome.audioInputCommand`: команда SoX, що читає з CoreAudio `BlackHole 2ch`
  і записує аудіо у `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX, що читає аудіо у `chrome.audioFormat`
  і записує в CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: необов’язкова команда локального мікрофона, яка записує
  підписаний 16-бітний little-endian mono PCM для виявлення втручання людини, доки
  відтворення асистента активне. Наразі це застосовується до розміщеного на Gateway
  мосту пари команд `chrome`.
- `chrome.bargeInRmsThreshold: 650`: рівень RMS, що рахується як людське
  переривання на `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: піковий рівень, що рахується як людське
  переривання на `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: мінімальна затримка між повторними очищеннями
  людського переривання
- `mode: "agent"`: стандартний режим talk-back. Мовлення учасників транскрибується
  налаштованим провайдером транскрипції в реальному часі, надсилається налаштованому
  агенту OpenClaw у сесії під-агента для окремої зустрічі та озвучується через
  звичайне середовище виконання TTS OpenClaw.
- `mode: "bidi"`: резервний прямий двонапрямний режим моделі реального часу. Провайдер
  голосу в реальному часі відповідає безпосередньо на мовлення учасників і може викликати
  `openclaw_agent_consult` для глибших/підкріплених інструментами відповідей.
- `mode: "transcribe"`: режим лише спостереження без моста talk-back.
- `realtime.provider: "openai"`: резерв сумісності, який використовується, коли наведені нижче
  поля провайдера з областю дії не задані.
- `realtime.transcriptionProvider: "openai"`: id провайдера, який режим `agent` використовує
  для транскрипції в реальному часі.
- `realtime.voiceProvider`: id провайдера, який режим `bidi` використовує для прямого голосу
  в реальному часі. Установіть це на `"google"`, щоб використовувати Gemini Live, залишаючи
  транскрипцію agent-mode на OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли міст реального часу
  підключається; установіть її на `""`, щоб приєднуватися мовчки
- `realtime.agentId`: необов’язковий id агента OpenClaw для
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

`voiceCall.enabled` за замовчуванням має значення `true`; з транспортом Twilio він делегує
фактичний PSTN-дзвінок, DTMF і вступне привітання Plugin Voice Call. Voice Call
відтворює послідовність DTMF перед відкриттям медіапотоку реального часу, а потім використовує
збережений вступний текст як початкове привітання в реальному часі. Якщо `voice-call` не
ввімкнено, Google Meet усе ще може перевіряти й записувати план набору, але не може
здійснити дзвінок Twilio.

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
`transport: "chrome-node"`, коли Chrome працює на спареному Node, наприклад VM Parallels.
В обох випадках провайдери моделей і `openclaw_agent_consult` виконуються на хості
Gateway, тому облікові дані моделей залишаються там. З типовим `mode: "agent"`
провайдер транскрипції в реальному часі відповідає за прослуховування, налаштований агент OpenClaw
створює відповідь, а звичайний TTS OpenClaw промовляє її в Meet. Використовуйте
`mode: "bidi"`, коли хочете, щоб голосова модель реального часу відповідала безпосередньо.
Сире `mode: "realtime"` і надалі приймається як застарілий псевдонім сумісності для
`mode: "agent"`, але більше не рекламується у схемі інструментів агента.

Використовуйте `action: "status"`, щоб перелічити активні сесії або перевірити ID сесії. Використовуйте
`action: "speak"` з `sessionId` і `message`, щоб агент реального часу
заговорив негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сесію,
запустити відому фразу й повернути стан `inCall`, коли хост Chrome може
про це повідомити. `test_speech` завжди примусово встановлює `mode: "agent"` і завершується помилкою, якщо його просять
працювати в `mode: "transcribe"`, оскільки сесії лише спостереження навмисно не можуть
видавати мовлення. Його результат `speechOutputVerified` базується на збільшенні байтів аудіовиходу
в реальному часі під час цього тестового виклику, тому повторно використана сесія зі старішим аудіо
не рахується як нова успішна перевірка мовлення. Використовуйте `action: "leave"`, щоб позначити
сесію завершеною.

`status` містить стан Chrome, коли він доступний:

- `inCall`: Chrome, схоже, перебуває всередині дзвінка Meet
- `micMuted`: стан мікрофона Meet за принципом найкращого зусилля
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профілю
  браузера потрібні ручний вхід, допуск хостом Meet, дозволи або
  ремонт керування браузером, перш ніж мовлення зможе працювати
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: чи
  кероване мовлення Chrome дозволене зараз. `speechReady: false` означає, що OpenClaw не
  надіслав вступну/тестову фразу в аудіоміст.
- `providerConnected` / `realtimeReady`: стан голосового моста реального часу
- `lastInputAt` / `lastOutputAt`: останнє аудіо, побачене з моста або надіслане до нього
- `audioOutputRouted` / `audioOutputDeviceLabel`: чи було медіавиведення вкладки Meet
  активно скеровано на пристрій BlackHole, який використовує міст
- `lastSuppressedInputAt` / `suppressedInputBytes`: вхід local loopback, проігнорований, доки
  відтворення асистента активне

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Режими Agent і Bidi

Режим Chrome `agent` оптимізований для поведінки «мій агент перебуває на зустрічі». Провайдер
транскрипції в реальному часі чує аудіо зустрічі, фінальні транскрипти учасників
спрямовуються через налаштованого агента OpenClaw, а відповідь промовляється через
звичайне середовище виконання TTS OpenClaw. Установіть `mode: "bidi"`, коли хочете,
щоб голосова модель реального часу відповідала безпосередньо.
Близькі фінальні фрагменти транскрипту об’єднуються перед consult, щоб один усний
хід не створював кілька застарілих часткових відповідей. Вхід реального часу також
пригнічується, доки поставлене в чергу аудіо асистента все ще відтворюється,
а нещодавні схожі на асистента відлуння транскрипту ігноруються перед agent consult,
щоб local loopback BlackHole не змушував агента відповідати на власне мовлення.

| Режим   | Хто вирішує відповідь         | Шлях виведення мовлення                | Коли використовувати                                  |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | Налаштований агент OpenClaw   | Звичайне середовище виконання TTS OpenClaw | Потрібна поведінка «мій агент перебуває на зустрічі» |
| `bidi`  | Голосова модель реального часу | Аудіовідповідь провайдера голосу реального часу | Потрібен розмовний голосовий цикл із найменшою затримкою |

У режимі `bidi`, коли моделі реального часу потрібні глибше міркування, поточна
інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент consult запускає звичайного агента OpenClaw за лаштунками з контекстом
нещодавнього транскрипту зустрічі й повертає стислу усну відповідь. У режимі `agent`
OpenClaw надсилає цю відповідь безпосередньо до середовища виконання TTS; у режимі `bidi`
голосова модель реального часу може промовити результат consult назад у зустріч. Він використовує
той самий спільний механізм consult, що й Voice Call.

За замовчуванням consult виконуються для агента `main`. Установіть `realtime.agentId`, коли
лінія Meet має консультуватися з окремим робочим простором агента OpenClaw, стандартними моделями,
політикою інструментів, пам’яттю та історією сесії.

Consult у режимі agent-mode використовують ключ сесії `agent:<id>:subagent:google-meet:<session>`
для окремої зустрічі, щоб подальші запитання зберігали контекст зустрічі, успадковуючи звичайну
політику агента від налаштованого агента.

`realtime.toolPolicy` керує запуском consult:

- `safe-read-only`: відкрити інструмент consult і обмежити звичайного агента до
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: відкрити інструмент consult і дозволити звичайному агенту використовувати звичайну
  політику інструментів агента.
- `none`: не відкривати інструмент consult для голосової моделі реального часу.

Ключ сесії consult має область дії в межах сесії Meet, тому наступні виклики consult
можуть повторно використовувати попередній контекст consult під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після повного приєднання Chrome до дзвінка:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повної smoke-перевірки приєднання й мовлення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Контрольний список live-тесту

Використовуйте цю послідовність, перш ніж передавати зустріч автономному агенту:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Очікуваний стан Chrome-node:

- `googlemeet setup` повністю зелений.
- `googlemeet setup` містить `chrome-node-connected`, коли Chrome-node є
  типовим транспортом або вузол закріплено.
- `nodes status` показує, що вибраний вузол підключено.
- Вибраний вузол оголошує і `googlemeet.chrome`, і `browser.proxy`.
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

Це підтверджує, що Plugin Gateway завантажено, вузол VM підключено з поточним
токеном, а аудіоміст Meet доступний до того, як агент відкриє вкладку реальної
зустрічі.

Для smoke-перевірки Twilio використовуйте зустріч, яка надає дані телефонного
дозвону:

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
- `openclaw logs --follow` показує, що DTMF TwiML віддано перед realtime TwiML,
  а потім realtime-міст із поставленим у чергу початковим привітанням.
- `googlemeet leave <sessionId>` завершує делегований голосовий виклик.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно редагували `plugins.entries.google-meet`, перезапустіть або
перезавантажте Gateway. Запущений агент бачить лише інструменти Plugin,
зареєстровані поточним процесом Gateway.

На хостах Gateway не macOS інструмент `google_meet`, видимий агенту, залишається
доступним, але локальні дії Chrome talk-back блокуються до потрапляння в
аудіоміст. Локальний звук Chrome talk-back наразі залежить від macOS
`BlackHole 2ch`, тому агенти Linux мають використовувати `mode: "transcribe"`,
дозвін Twilio або хост macOS `chrome-node` замість типового шляху локального
агента Chrome.

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

Вузол має бути підключений і вказувати `googlemeet.chrome` разом із
`browser.proxy`. Конфігурація Gateway має дозволяти ці команди вузла:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Якщо `googlemeet setup` не проходить `chrome-node-connected` або журнал Gateway
повідомляє `gateway token mismatch`, перевстановіть або перезапустіть вузол із
поточним токеном Gateway. Для LAN Gateway це зазвичай означає:

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

Запустіть `googlemeet test-listen` для приєднань лише для спостереження або
`googlemeet test-speech` для realtime-приєднань, а потім перевірте повернений
стан Chrome. Якщо будь-яка з перевірок повідомляє `manualActionRequired: true`,
покажіть `manualActionMessage` оператору й припиніть повторні спроби, доки дію в
браузері не буде завершено.

Поширені ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису хоста Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’явиться нативний запит
  дозволу Chrome.
- Закрити або відновити завислий діалог дозволів Meet.

Не повідомляйте "not signed in" лише тому, що Meet показує "Do you want people to
hear you in the meeting?" Це проміжний екран вибору аудіо Meet; OpenClaw
натискає **Use microphone** через автоматизацію браузера, коли це доступно, і
продовжує чекати на реальний стан зустрічі. Для резервного створення лише через
браузер OpenClaw може натиснути **Continue without microphone**, оскільки для
створення URL не потрібен realtime-аудіошлях.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує endpoint Google Meet API
`spaces.create`, коли облікові дані OAuth налаштовано. Без облікових даних OAuth
він переходить до резервного браузера закріпленого вузла Chrome. Підтвердьте:

- Для створення через API: `oauth.clientId` і `oauth.refreshToken` налаштовано,
  або присутні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було видано після додавання підтримки
  створення. Старішим токенам може бракувати scope `meetings.space.created`;
  повторно виконайте `openclaw googlemeet auth login --json` і оновіть
  конфігурацію Plugin.
- Для резервного браузера: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений вузол із `browser.proxy` і
  `googlemeet.chrome`.
- Для резервного браузера: профіль Chrome OpenClaw на цьому вузлі виконано вхід
  у Google і може відкрити `https://meet.google.com/new`.
- Для резервного браузера: повторні спроби повторно використовують наявну
  вкладку `https://meet.google.com/new` або вкладку запиту облікового запису
  Google перед відкриттям нової вкладки. Якщо агенту вичерпано час очікування,
  повторіть виклик інструмента замість ручного відкриття ще однієї вкладки Meet.
- Для резервного браузера: якщо інструмент повертає `manualActionRequired: true`,
  використовуйте повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і
  `manualActionMessage`, щоб скерувати оператора. Не повторюйте спроби в циклі,
  доки цю дію не буде завершено.
- Для резервного браузера: якщо Meet показує "Do you want people to hear you in the
  meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone**
  або, для резервного створення лише через браузер, **Continue without microphone**
  через автоматизацію браузера й продовжити чекати на згенерований URL Meet.
  Якщо це неможливо, помилка має згадувати `meet-audio-choice-required`, а не
  `google-login-required`.

### Агент приєднується, але не говорить

Перевірте realtime-шлях:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "agent"` для звичайного шляху STT -> агент OpenClaw ->
TTS talk-back або `mode: "bidi"` для прямого резервного realtime-голосу.
`mode: "transcribe"` навмисно не запускає міст talk-back. Для налагодження лише
спостереження запустіть `openclaw googlemeet status --json <session-id>` після
того, як учасники говоритимуть, і перевірте `captioning`, `transcriptLines` і
`lastCaptionText`. Якщо `inCall` дорівнює true, але `transcriptLines` залишається
`0`, субтитри Meet можуть бути вимкнені, ніхто не говорив після встановлення
спостерігача, інтерфейс Meet змінився або live-субтитри недоступні для мови чи
облікового запису зустрічі.

`googlemeet test-speech` завжди перевіряє realtime-шлях і повідомляє, чи були
спостережені байти виходу моста для цього виклику. Якщо `speechOutputVerified` дорівнює false, а
`speechOutputTimedOut` дорівнює true, realtime-провайдер міг прийняти
висловлювання, але OpenClaw не побачив, щоб нові вихідні байти дійшли до
аудіомоста Chrome.

Також перевірте:

- Ключ realtime-провайдера доступний на хості Gateway, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `sox` існує на хості Chrome.
- Мікрофон і динамік Meet маршрутизовано через віртуальний аудіошлях, який
  використовує OpenClaw. `doctor` має показати `meet output routed: yes` для
  локальних realtime-приєднань Chrome.

`googlemeet doctor [session-id]` виводить сеанс, вузол, стан у виклику, причину
ручної дії, підключення realtime-провайдера, `realtimeReady`, активність
аудіовходу/виходу, останні аудіомітки часу, лічильники байтів і URL браузера.
Використовуйте `googlemeet status [session-id] --json`, коли потрібен сирий
JSON. Використовуйте `googlemeet doctor --oauth`, коли потрібно перевірити
оновлення Google Meet OAuth без розкриття токенів; додайте `--meeting` або
`--create-space`, коли також потрібне підтвердження Google Meet API.

Якщо агенту вичерпано час очікування і ви бачите вже відкриту вкладку Meet,
перевірте цю вкладку, не відкриваючи іншу:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує та перевіряє
наявну вкладку Meet для вибраного транспорту. З `chrome` вона використовує
локальне керування браузером через Gateway; з `chrome-node` вона використовує
налаштований вузол Chrome. Вона не відкриває нову вкладку й не створює новий
сеанс; вона повідомляє поточний блокер, наприклад вхід, допуск, дозволи або стан
вибору аудіо. Команда CLI звертається до налаштованого Gateway, тому Gateway має
працювати; `chrome-node` також вимагає, щоб вузол Chrome було підключено.

### Перевірки налаштування Twilio не проходять

`twilio-voice-call-plugin` не проходить, коли `voice-call` не дозволено або не
увімкнено. Додайте його до `plugins.allow`, увімкніть
`plugins.entries.voice-call` і перезавантажте Gateway.

`twilio-voice-call-credentials` не проходить, коли бекенду Twilio бракує account
SID, auth token або номера абонента. Задайте їх на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` не проходить, коли `voice-call` не має публічної
Webhook-експозиції або коли `publicUrl` вказує на loopback чи приватний
мережевий простір. Установіть `plugins.entries.voice-call.config.publicUrl` на
публічний URL провайдера або налаштуйте тунель/експозицію Tailscale для
`voice-call`.

Loopback і приватні URL недійсні для callback-ів операторів зв’язку. Не
використовуйте `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
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

Для локальної розробки використовуйте тунель або експозицію Tailscale замість
приватного URL хоста:

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

`voicecall smoke` за замовчуванням лише перевіряє готовність. Щоб виконати dry-run
для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли навмисно хочете здійснити live вихідний
сповіщувальний виклик:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Виклик Twilio починається, але ніколи не входить у зустріч

Підтвердьте, що подія Meet надає дані телефонного дозвону. Передайте точний
номер дозвону та PIN або власну DTMF-послідовність:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкові `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза
перед введенням PIN-коду.

Якщо телефонний виклик створено, але в списку учасників Meet так і не зʼявляється
учасник, що приєднався через телефонний набір:

- Запустіть `openclaw googlemeet doctor <session-id>`, щоб підтвердити делегований Twilio
  ID виклику, чи DTMF було поставлено в чергу, і чи було запитано вступне привітання.
- Запустіть `openclaw voicecall status --call-id <id>` і підтвердьте, що виклик усе ще
  активний.
- Запустіть `openclaw voicecall tail` і перевірте, що Webhook-и Twilio надходять до
  Gateway.
- Запустіть `openclaw logs --follow` і знайдіть послідовність Twilio Meet: Google
  Meet делегує приєднання, Voice Call запускає телефонну гілку, Google Meet очікує
  `voiceCall.dtmfDelayMs`, надсилає DTMF через `voicecall.dtmf`, очікує
  `voiceCall.postDtmfSpeechDelayMs`, а потім запитує вступне мовлення через
  `voicecall.speak`.
- Повторно запустіть `openclaw googlemeet setup --transport twilio`; успішна перевірка
  налаштування потрібна, але вона не доводить, що послідовність PIN-коду зустрічі
  правильна.
- Підтвердьте, що номер для телефонного підключення належить до того самого запрошення
  Meet і регіону, що й PIN-код.
- Збільште `voiceCall.dtmfDelayMs`, якщо Meet відповідає повільно або транскрипт виклику
  все ще показує запит на введення PIN-коду після надсилання DTMF.
- Якщо учасник приєднується, але ви не чуєте привітання, перевірте
  `openclaw logs --follow` на наявність post-DTMF запиту `voicecall.speak` і
  або відтворення TTS через медіапотік, або резервний варіант Twilio `<Say>`. Якщо
  транскрипт виклику все ще містить "enter the meeting PIN", телефонна гілка ще не
  приєдналася до кімнати Meet, тому учасники зустрічі не почують мовлення.

Якщо Webhook-и не надходять, спершу налагодьте Plugin Voice Call: провайдер має
досягати `plugins.entries.voice-call.config.publicUrl` або налаштованого тунелю.
Див. [усунення проблем із голосовими викликами](/uk/plugins/voice-call#troubleshooting).

## Нотатки

Офіційний медіа-API Google Meet орієнтований на приймання, тому для мовлення в
виклику Meet усе ще потрібен шлях учасника. Цей Plugin робить цю межу видимою:
Chrome обробляє участь через браузер і маршрутизацію локального аудіо; Twilio
обробляє участь через телефонне підключення.

Режими зворотного мовлення Chrome потребують `BlackHole 2ch` плюс одне з такого:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw володіє
  мостом і передає аудіо у форматі `chrome.audioFormat` між цими командами та
  вибраним провайдером. Режим агента використовує транскрипцію в реальному часі
  плюс звичайний TTS; режим bidi використовує голосового провайдера реального часу.
  Стандартний шлях Chrome — 24 кГц PCM16 з `chrome.audioBufferBytes: 4096`; 8 кГц
  G.711 mu-law залишається доступним для застарілих пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда мосту володіє всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона. Це
  чинно лише для `bidi`, оскільки режим `agent` потребує прямого доступу до пари
  команд для TTS.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через
окремі віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback.
Один спільний пристрій BlackHole може відлунювати інших учасників назад у виклик.

З мостом Chrome на основі пари команд `chrome.bargeInInputCommand` може слухати
окремий локальний мікрофон і очищати відтворення асистента, коли людина починає
говорити. Це зберігає мовлення людини попереду виводу асистента навіть тоді, коли
спільний вхід loopback BlackHole тимчасово приглушено під час відтворення
асистента. Як і `chrome.audioInputCommand` та `chrome.audioOutputCommand`, це
налаштована оператором локальна команда. Використовуйте явний довірений шлях до
команди або список аргументів і не спрямовуйте її на скрипти з недовірених
розташувань.

`googlemeet speak` запускає активний аудіоміст зворотного мовлення для сеансу
Chrome. `googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих
через Plugin Voice Call, `leave` також завершує базовий голосовий виклик.
Використовуйте `googlemeet end-active-conference`, коли також потрібно закрити
активну конференцію Google Meet для простору, керованого API.

## Повʼязане

- [Plugin голосових викликів](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення plugins](/uk/plugins/building-plugins)
