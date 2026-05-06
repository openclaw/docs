---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий дзвінок Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Plugin Google Meet: приєднання за явно вказаними URL-адресами Meet через Chrome або Twilio з типовими налаштуваннями відповіді голосом від агента'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-06T08:23:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c1de7528ddabe6411598eea362d4a21c6f95f374700046c18294b215a1333d3
    source_path: plugins/google-meet.md
    workflow: 16
---

Підтримка учасника Google Meet для OpenClaw — Plugin навмисно працює явно:

- Він приєднується лише до явного URL `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися до
  поверненого URL.
- `agent` — стандартний режим відповіді: транскрипція в реальному часі слухає,
  налаштований агент OpenClaw відповідає, а звичайний OpenClaw TTS говорить у Meet.
- `bidi` залишається доступним як резервний режим прямої голосової моделі в реальному часі.
- Агенти вибирають поведінку приєднання через `mode`: використовуйте `agent` для живого
  прослуховування/відповіді, `bidi` для прямого резервного голосового режиму в реальному часі або `transcribe`
  для приєднання/керування браузером без мосту відповіді.
- Автентифікація починається як особистий Google OAuth або вже виконаний вхід у профіль Chrome.
- Автоматичного оголошення згоди немає.
- Стандартний аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на спареному вузловому хості.
- Twilio приймає номер дозвону та необов’язковий PIN або послідовність DTMF; він
  не може набрати URL Meet напряму.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших агентських
  телеконференційних робочих процесів.

## Швидкий старт

Установіть локальні аудіозалежності й налаштуйте провайдера транскрипції в реальному часі
плюс звичайний OpenClaw TTS. OpenAI — стандартний провайдер транскрипції;
Google Gemini Live також працює як окремий голосовий резерв `bidi` з
`realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# потрібно лише коли realtime.voiceProvider має значення "google" для режиму bidi
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

Вивід setup призначений бути читабельним для агента й обізнаним про режим. Він повідомляє профіль Chrome,
закріплення вузла і, для приєднань Chrome у реальному часі, перевірки аудіомосту
BlackHole/SoX та відкладеного вступу в реальному часі. Для приєднань лише для спостереження перевірте той самий
транспорт із `--mode transcribe`; цей режим пропускає передумови аудіо в реальному часі,
бо він не слухає і не говорить через міст:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Коли налаштовано делегування Twilio, setup також повідомляє, чи готові
Plugin `voice-call`, облікові дані Twilio та публічне відкриття Webhook.
Сприймайте будь-яку перевірку `ok: false` як блокер для перевірюваного транспорту й режиму,
перш ніж просити агента приєднатися. Використовуйте `openclaw googlemeet setup --json` для
скриптів або машинозчитуваного виводу. Використовуйте `--transport chrome`,
`--transport chrome-node` або `--transport twilio`, щоб попередньо перевірити конкретний
транспорт до спроби агента.

Для Twilio завжди явно попередньо перевіряйте транспорт, коли стандартним транспортом
є Chrome:

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
  "mode": "agent"
}
```

Інструмент `google_meet` для агентів залишається доступним на хостах не-macOS для
артефактів, календаря, setup, транскрибування, Twilio та потоків `chrome-node`. Локальні
дії відповіді через Chrome там заблоковані, бо вбудований аудіошлях Chrome
наразі залежить від macOS `BlackHole 2ch`. У Linux використовуйте `mode: "transcribe"`,
дозвін Twilio або macOS-хост `chrome-node` для участі з відповіддю через Chrome.

Створіть нову зустріч і приєднайтеся до неї:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Для кімнат, створених через API, використовуйте Google Meet `SpaceConfig.accessType`, коли хочете,
щоб політика кімнати без стуку була явною, а не успадкованою зі стандартних налаштувань Google-акаунта:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` дозволяє будь-кому з URL Meet приєднатися без стуку. `TRUSTED` дозволяє
довіреним користувачам організації хоста, запрошеним зовнішнім користувачам і користувачам дозвону
приєднуватися без стуку. `RESTRICTED` обмежує вхід без стуку запрошеними. Ці
налаштування застосовуються лише до офіційного шляху створення Google Meet API, тому облікові дані
OAuth мають бути налаштовані.

Якщо ви автентифікували Google Meet до появи цієї опції, повторно виконайте
`openclaw googlemeet auth login --json` після додавання області
`meetings.space.settings` на екран згоди Google OAuth.

Створіть лише URL без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це
  найдетермінованіший шлях, який не залежить від стану UI браузера.
- Резервний браузерний шлях: використовується, коли облікові дані OAuth відсутні. OpenClaw використовує
  закріплений вузол Chrome, відкриває `https://meet.google.com/new`, чекає, доки Google
  перенаправить на справжній URL із кодом зустрічі, а потім повертає цей URL. Цей шлях вимагає,
  щоб профіль OpenClaw Chrome на вузлі вже мав виконаний вхід у Google.
  Браузерна автоматизація обробляє власний запит Meet на мікрофон під час першого запуску; цей запит
  не вважається помилкою входу в Google.
  Потоки приєднання та створення також намагаються повторно використати наявну вкладку Meet, перш ніж відкривати
  нову. Зіставлення ігнорує нешкідливі рядки запиту URL, такі як `authuser`, тому
  повторна спроба агента має сфокусувати вже відкриту зустріч замість створення другої
  вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` стандартно приєднується до нової зустрічі й
повертає `joined: true` плюс сесію приєднання. Щоб лише створити URL, використовуйте
`create --no-join` у CLI або передайте `"join": false` інструменту.

Або скажіть агенту: "Створи Google Meet, приєднайся до нього в режимі відповіді агента
і надішли мені посилання." Агент має викликати `google_meet` з
`action: "create"`, а потім поділитися поверненим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Для приєднання лише для спостереження/керування браузером установіть `"mode": "transcribe"`. Це
не запускає дуплексний голосовий міст у реальному часі, не потребує BlackHole або SoX
і не відповідатиме голосом у зустріч. Приєднання Chrome у цьому режимі також уникають
надання OpenClaw дозволу на мікрофон/камеру та уникають шляху Meet **Use
microphone**. Якщо Meet показує проміжний екран вибору аудіо, автоматизація намагається
шлях без мікрофона, а інакше повідомляє про ручну дію замість відкриття
локального мікрофона. У режимі transcribe керовані транспорти Chrome також установлюють
best-effort спостерігач субтитрів Meet. `googlemeet status --json` і
`googlemeet doctor` показують `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
і короткий хвіст `recentTranscript`, щоб оператори могли зрозуміти, чи браузер
приєднався до дзвінка і чи субтитри Meet створюють текст.
Використовуйте `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, коли
потрібна перевірка так/ні: він приєднується в режимі transcribe, чекає свіжого руху субтитрів або
транскрипту й повертає `listenVerified`, `listenTimedOut`, поля ручної
дії та останній стан субтитрів.

Під час сесій у реальному часі статус `google_meet` містить стан браузера й аудіомосту,
зокрема `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, останні часові позначки вводу/виводу,
лічильники байтів і стан закриття мосту. Якщо з’являється безпечний запит сторінки Meet,
браузерна автоматизація обробляє його, коли може. Запити входу, допуску хостом і
дозволів браузера/ОС повідомляються як ручна дія з причиною і
повідомленням, яке агент має передати. Керовані сесії Chrome видають вступ або
тестову фразу лише після того, як стан браузера повідомить `inCall: true`; інакше статус повідомляє
`speechReady: false`, а спроба мовлення блокується замість удавання, що
агент говорив у зустріч.

Локальні приєднання Chrome проходять через профіль браузера OpenClaw із виконаним входом. Режим у реальному часі
потребує `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для
чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного
пристрою BlackHole достатньо для першого smoke test, але він може створювати відлуння.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM,
щоб лише зробити VM власником Chrome. Запустіть Gateway і агента локально, а потім запустіть
вузловий хост у VM. Увімкніть вбудований Plugin на VM один раз, щоб вузол
оголошував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, провайдер у реальному часі
  і конфігурація Google Meet Plugin.
- Parallels macOS VM: OpenClaw CLI/вузловий хост, Google Chrome, SoX, BlackHole 2ch
  і профіль Chrome із виконаним входом у Google.
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

Якщо `<gateway-host>` — LAN IP і ви не використовуєте TLS, вузол відмовляється від
plaintext WebSocket, якщо ви явно не погодитеся для цієї довіреної приватної мережі:

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

Тепер приєднайтеся звичайно з хоста Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

або попросіть агента використати інструмент `google_meet` з `transport: "chrome-node"`.

Для smoke test однією командою, який створює або повторно використовує сесію, промовляє відому
фразу й друкує стан сесії:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання в реальному часі автоматизація браузера OpenClaw заповнює ім’я гостя, натискає
«Приєднатися»/«Попросити приєднатися» і приймає перший вибір Meet «Використовувати мікрофон», коли цей
запит з’являється. Під час приєднання лише для спостереження або створення зустрічі тільки в браузері вона
проходить повз той самий запит без мікрофона, коли такий вибір доступний.
Якщо профіль браузера не ввійшов в обліковий запис, Meet очікує допуску від організатора,
Chrome потребує дозволу на мікрофон/камеру для приєднання в реальному часі, або Meet застряг
на запиті, який автоматизація не змогла розв’язати, результат join/test-speech повідомляє
`manualActionRequired: true` з `manualActionReason` і
`manualActionMessage`. Агенти мають припинити повторні спроби приєднання, повідомити це точне
повідомлення разом із поточними `browserUrl`/`browserTitle` і повторювати спробу лише після завершення
ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає лише тоді, коли рівно один
підключений вузол оголошує і `googlemeet.chrome`, і керування браузером. Якщо
підключено кілька придатних вузлів, задайте `chromeNode.node` як id вузла,
відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `Configured Google Meet node ... is not usable: offline`: закріплений вузол
  відомий Gateway, але недоступний. Агенти мають трактувати цей вузол як
  діагностичний стан, а не як придатний хост Chrome, і повідомити про блокер налаштування
  замість повернення до іншого транспорту, якщо користувач не попросив про це.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  схваліть спарювання та переконайтеся, що `openclaw plugins enable google-meet` і
  `openclaw plugins enable browser` було виконано у VM. Також підтвердьте, що
  хост Gateway дозволяє обидві команди вузла через
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: установіть `blackhole-2ch` на хості,
  який перевіряється, і перезавантажте його перед використанням локального аудіо Chrome.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch`
  у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або
  залиште `chrome.guestName` заданим для гостьового приєднання. Автоматичне гостьове приєднання використовує
  автоматизацію браузера OpenClaw через проксі браузера вузла; переконайтеся, що конфігурація браузера вузла
  вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або іменований профіль наявного сеансу.
- Дублікати вкладок Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw
  активує наявну вкладку для тієї самої URL-адреси Meet перед відкриттям нової, а
  створення зустрічі в браузері повторно використовує незавершену вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google перед відкриттям іншої.
- Немає аудіо: у Meet спрямуйте аудіо мікрофона/динаміка через шлях віртуального аудіопристрою,
  який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію в стилі Loopback
  для чистого двостороннього аудіо.

## Нотатки щодо встановлення

Типовий зворотний аудіозв’язок Chrome використовує два зовнішні інструменти:

- `sox`: аудіоутиліта командного рядка. Plugin використовує явні команди пристрою CoreAudio
  для стандартного аудіомоста PCM16 24 кГц.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`,
  через який Chrome/Meet може маршрутизувати аудіо.

OpenClaw не постачає й не розповсюджує жоден із цих пакетів. Документація просить користувачів
установити їх як залежності хоста через Homebrew. SoX ліцензовано як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole має ліцензію GPL-3.0. Якщо ви створюєте
інсталятор або пристрій, що постачає BlackHole разом з OpenClaw, перегляньте
ліцензійні умови upstream BlackHole або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet через керування браузером OpenClaw і приєднується
як профіль браузера OpenClaw, що ввійшов в обліковий запис. На macOS Plugin перевіряє наявність
`BlackHole 2ch` перед запуском. Якщо налаштовано, він також виконує команду перевірки справності
аудіомоста та команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли
Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють
на спареному вузлі, наприклад Parallels macOS VM. Для локального Chrome виберіть
профіль через `browser.defaultProfile`; `chrome.browserProfile` передається
хостам `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона й динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування
замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio є суворим планом набору, делегованим Plugin Voice Call. Він
не аналізує сторінки Meet для пошуку телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або вам потрібен резервний
телефонний вхід. Google Meet має надати телефонний номер для набору та PIN для
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

Надайте облікові дані Twilio через середовище або конфігурацію. Середовище не дає
секретам потрапити в `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Натомість використовуйте `realtime.provider: "openai"` з Plugin провайдера OpenAI і
`OPENAI_API_KEY`, якщо це ваш провайдер голосу в реальному часі.

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни конфігурації Plugin
не з’являться в уже запущеному процесі Gateway, доки він не перезавантажиться.

Потім перевірте:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Коли делегування Twilio під’єднано, `googlemeet setup` містить успішні
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

OAuth необов’язковий для створення посилання Meet, оскільки `googlemeet create` може
повернутися до автоматизації браузера. Налаштуйте OAuth, коли вам потрібне офіційне створення через API,
розв’язання просторів або попередні перевірки Meet Media API.

Доступ до Google Meet API використовує користувацький OAuth: створіть клієнт Google Cloud OAuth,
запросіть потрібні scopes, авторизуйте обліковий запис Google, а потім збережіть
отриманий refresh token у конфігурації Plugin Google Meet або надайте
змінні середовища `OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання через Chrome. Транспорти Chrome і Chrome-node
все одно приєднуються через профіль Chrome, що ввійшов в обліковий запис, BlackHole/SoX і підключений
вузол, коли ви використовуєте участь через браузер. OAuth призначений лише для офіційного
шляху Google Meet API: створення просторів зустрічей, розв’язання просторів і запуск
попередніх перевірок Meet Media API.

### Створення облікових даних Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** найпростіший для організації Google Workspace.
   - **External** працює для особистих/тестових налаштувань; поки застосунок перебуває в Testing,
     додайте кожен обліковий запис Google, який авторизуватиме застосунок, як тестового користувача.
4. Додайте scopes, які запитує OpenClaw:
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
`meetings.space.readonly` дає OpenClaw змогу розв’язувати URL-адреси/коди Meet у простори.
`meetings.space.settings` дає OpenClaw змогу передавати налаштування `SpaceConfig`, як-от
`accessType`, під час створення кімнати через API.
`meetings.conference.media.readonly` призначений для попередньої перевірки Meet Media API та медіароботи;
Google може вимагати реєстрації в Developer Preview для фактичного використання Media API.
Якщо вам потрібні лише приєднання Chrome на основі браузера, повністю пропустіть OAuth.

### Створення refresh token

Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, або передайте їх як
змінні середовища, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` з refresh token. Вона використовує PKCE,
callback localhost на `http://localhost:8085/oauth2callback` і ручний
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

Віддавайте перевагу змінним середовища, коли не хочете мати refresh token у конфігурації.
Якщо наявні і значення конфігурації, і значення середовища, Plugin спочатку використовує конфігурацію,
а потім резервно переходить до середовища.

Згода OAuth охоплює створення просторів Meet, доступ на читання просторів Meet і доступ на читання
медіа конференцій Meet. Якщо ви автентифікувалися до появи підтримки створення зустрічей,
повторно виконайте `openclaw googlemeet auth login --json`, щоб refresh token мав scope
`meetings.space.created`.

### Перевірка OAuth через doctor

Запустіть OAuth doctor, коли потрібна швидка перевірка справності без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує runtime Chrome і не потребує підключеного вузла Chrome. Воно
перевіряє, що конфігурація OAuth існує і що refresh token може створити access
token. Звіт JSON містить лише поля стану, як-от `ok`, `configured`,
`tokenSource`, `expiresAt`, і повідомлення перевірок; він не виводить access
token, refresh token або client secret.

Поширені результати:

| Перевірка            | Значення                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` плюс `oauth.refreshToken`, або кешований токен доступу, наявні.        |
| `oauth-token`        | Кешований токен доступу все ще чинний, або токен оновлення випустив новий токен доступу. |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` визначила наявний простір Meet.                     |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий простір Meet.                  |

Щоб також підтвердити ввімкнення Google Meet API та область доступу `spaces.create`, запустіть
перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює одноразову URL-адресу Meet. Використовуйте її, коли потрібно підтвердити,
що в проєкті Google Cloud увімкнено Meet API і що авторизований
обліковий запис має область доступу `meetings.space.created`.

Щоб підтвердити доступ на читання для наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` підтверджують доступ на читання до наявного
простору, до якого авторизований обліковий запис Google має доступ. `403` у цих перевірках
зазвичай означає, що Google Meet REST API вимкнено, погодженому токену оновлення
бракує потрібної області доступу або обліковий запис Google не має доступу до цього простору Meet.
Помилка токена оновлення означає, що потрібно повторно запустити `openclaw googlemeet auth login
--json` і зберегти новий блок `oauth`.

Для браузерного резервного режиму облікові дані OAuth не потрібні. У цьому режимі автентифікація Google
надходить із профілю Chrome, у який виконано вхід на вибраному вузлі, а не з
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

З `--meeting`, `artifacts` і `attendance` за замовчуванням використовують найновіший запис конференції.
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

`--today` шукає в сьогоднішньому календарі `primary` подію Calendar із
посиланням Google Meet. Використовуйте `--event <query>`, щоб шукати відповідний текст події, і
`--calendar <id>` для неосновного календаря. Пошук у календарі потребує нового
входу OAuth, який включає область доступу лише для читання подій Calendar.
`calendar-events` попередньо показує відповідні події Meet і позначає подію, яку
вибере `latest`, `artifacts`, `attendance` або `export`.

Якщо ви вже знаєте ідентифікатор запису конференції, звертайтеся до нього напряму:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Завершіть активну конференцію для створеного через API простору, коли потрібно закрити
кімнату після дзвінка:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Це викликає Google Meet `spaces.endActiveConference` і потребує OAuth з областю доступу
`meetings.space.created` для простору, яким авторизований обліковий запис може керувати.
OpenClaw приймає URL-адресу Meet, код зустрічі або вхід `spaces/{id}` і перетворює його
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
транскрипту, структурованих записів транскрипту й розумних нотаток, коли
Google надає їх для зустрічі. Використовуйте `--no-transcript-entries`, щоб пропустити
пошук записів для великих зустрічей. `attendance` розгортає учасників у
рядки сеансів учасників із часом першої/останньої появи, загальною тривалістю сеансу,
прапорцями запізнення/раннього виходу та об’єднаними дубльованими ресурсами учасників за користувачем,
який увійшов у систему, або відображуваним ім’ям. Передайте `--no-merge-duplicates`, щоб зберегти сирі ресурси учасників
окремо, `--late-after-minutes`, щоб налаштувати виявлення запізнення, і
`--early-before-minutes`, щоб налаштувати виявлення раннього виходу.

`export` записує папку, що містить `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`.
`manifest.json` записує вибраний вхід, параметри експорту, записи конференцій,
вихідні файли, кількості, джерело токена, подію Calendar, коли вона використовувалася, і будь-які
попередження про часткове отримання. Передайте `--zip`, щоб також записати переносний архів поруч
із папкою. Передайте `--include-doc-bodies`, щоб експортувати пов’язаний транскрипт і
текст розумних нотаток Google Docs через Google Drive `files.export`; для цього потрібен
новий вхід OAuth, який включає область доступу лише для читання Drive Meet. Без
`--include-doc-bodies` експорти містять лише метадані Meet і структуровані записи транскрипту.
Якщо Google повертає часткову помилку артефакту, наприклад помилку списку розумних нотаток,
запису транскрипту або тіла документа Drive, зведення та
маніфест зберігають попередження замість збою всього експорту.
Використовуйте `--dry-run`, щоб отримати ті самі дані артефактів/відвідуваності та вивести
JSON маніфесту без створення папки чи ZIP. Це корисно перед записом
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

Установіть `"dryRun": true`, щоб повернути лише маніфест експорту й пропустити записи файлів.

Агенти також можуть створити кімнату з підтримкою API з явною політикою доступу:

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

Для валідації спершу через прослуховування агенти мають використовувати `test_listen`, перш ніж стверджувати, що
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

Запустіть live браузерну перевірку спершу через прослуховування для зустрічі, де хтось буде
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

Базовому live smoke для артефактів/відвідуваності потрібні
`https://www.googleapis.com/auth/meetings.space.readonly` і
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Пошуку в календарі потрібен `https://www.googleapis.com/auth/calendar.events.readonly`. Експорту
тіла документа Drive потрібен
`https://www.googleapis.com/auth/drive.meet.readonly`.

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда виводить новий `meeting uri`, джерело та сеанс приєднання. З обліковими даними OAuth
вона використовує офіційний Google Meet API. Без облікових даних OAuth вона
використовує як резервний варіант профіль браузера прив’язаного вузла Chrome, у який виконано вхід. Агенти можуть
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

Якщо браузерний резервний режим натрапляє на вхід Google або блокування дозволів Meet, перш ніж
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
`manualActionMessage` плюс контекст вузла/вкладки браузера та припинити відкривати нові
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
потребує профілю Google Chrome із виконаним входом, щоб приєднатися через браузер. Якщо
з профілю виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або
помилку резервного переходу браузера й просить оператора завершити вхід у Google перед
повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
project, OAuth principal і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Загальний шлях агента Chrome потребує лише ввімкненого plugin, BlackHole, SoX, ключа
провайдера транскрибування в реальному часі та налаштованого провайдера OpenClaw TTS.
OpenAI є провайдером транскрибування за замовчуванням; задайте `realtime.voiceProvider` як
`"google"` і `realtime.model`, щоб використовувати Google Gemini Live для режиму `bidi`
без зміни стандартного провайдера транскрибування для режиму агента:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Задайте конфігурацію plugin у `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: необов'язковий id/name/IP вузла для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім'я, яке використовується на гостьовому екрані Meet
  без виконаного входу
- `chrome.autoJoin: true`: найкраща спроба заповнити ім'я гостя й натиснути Join Now
  через браузерну автоматизацію OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить, що вона у виклику,
  перед запуском вступного повідомлення з відповіддю голосом
- `chrome.audioFormat: "pcm16-24khz"`: аудіоформат пари команд. Використовуйте
  `"g711-ulaw-8khz"` лише для застарілих/власних пар команд, які все ще видають
  телефонний звук.
- `chrome.audioBufferBytes: 4096`: буфер обробки SoX для згенерованих аудіокоманд
  пари команд Chrome. Це половина стандартного буфера SoX на 8192 байти,
  що зменшує стандартну затримку каналу, залишаючи можливість збільшити його на завантажених хостах.
  Значення нижче мінімуму SoX обмежуються 17 байтами.
- `chrome.audioInputCommand`: команда SoX, що читає з CoreAudio `BlackHole 2ch`
  і записує аудіо у `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX, що читає аудіо у `chrome.audioFormat`
  і записує в CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: необов'язкова команда локального мікрофона, що записує
  знаковий 16-бітний little-endian mono PCM для виявлення втручання людини, поки
  відтворення асистента активне. Наразі це застосовується до розміщеного на Gateway
  моста пари команд `chrome`.
- `chrome.bargeInRmsThreshold: 650`: рівень RMS, який вважається людським
  перериванням на `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: піковий рівень, який вважається людським
  перериванням на `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: мінімальна затримка між повторними очищеннями
  людського переривання
- `mode: "agent"`: стандартний режим відповіді голосом. Мовлення учасника транскрибується
  налаштованим провайдером транскрибування в реальному часі, надсилається налаштованому
  агенту OpenClaw у сесії підагента для кожної зустрічі й озвучується через
  звичайне середовище виконання OpenClaw TTS.
- `mode: "bidi"`: резервний прямий двоспрямований режим моделі реального часу. Провайдер
  голосу в реальному часі відповідає на мовлення учасника напряму й може викликати
  `openclaw_agent_consult` для глибших відповідей або відповідей із використанням інструментів.
- `mode: "transcribe"`: режим лише спостереження без моста відповіді голосом.
- `realtime.provider: "openai"`: резервний варіант сумісності, який використовується, коли наведені нижче
  поля провайдера з обмеженою областю не задані.
- `realtime.transcriptionProvider: "openai"`: id провайдера, який режим `agent` використовує
  для транскрибування в реальному часі.
- `realtime.voiceProvider`: id провайдера, який режим `bidi` використовує для прямого голосу
  в реальному часі. Установіть його в `"google"`, щоб використовувати Gemini Live, зберігаючи
  транскрибування в режимі агента на OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли міст реального часу
  підключається; задайте `""`, щоб приєднатися мовчки
- `realtime.agentId`: необов'язковий id агента OpenClaw для
  `openclaw_agent_consult`; за замовчуванням `main`

Необов'язкові перевизначення:

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

ElevenLabs для прослуховування й мовлення в режимі агента:

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
директиви для кожної відповіді `[[tts:voiceId=... model=eleven_v3]]`, коли перевизначення моделі TTS
увімкнені, але конфігурація є детермінованим стандартом для зустрічей.
Під час приєднання журнали мають показувати `transcriptionProvider=elevenlabs`, а кожна
усна відповідь має журналювати `provider=elevenlabs model=eleven_v3 voice=<voiceId>`.

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
фактичний виклик PSTN, DTMF і вступне привітання plugin Voice Call. Voice Call
відтворює послідовність DTMF перед відкриттям медіапотоку в реальному часі, а потім використовує
збережений вступний текст як початкове привітання в реальному часі. Якщо `voice-call` не
ввімкнено, Google Meet усе ще може перевірити й записати план набору, але не може
розмістити виклик Twilio.

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
`transport: "chrome-node"`, коли Chrome працює на спареному вузлі, наприклад Parallels
VM. В обох випадках провайдери моделей і `openclaw_agent_consult` працюють на
хості Gateway, тому облікові дані моделей залишаються там. Зі стандартним `mode: "agent"`
провайдер транскрибування в реальному часі відповідає за прослуховування, налаштований агент OpenClaw
створює відповідь, а звичайний OpenClaw TTS промовляє її в Meet. Використовуйте
`mode: "bidi"`, коли хочете, щоб голосова модель у реальному часі відповідала напряму.
Необроблений `mode: "realtime"` досі приймається як застарілий псевдонім сумісності для
`mode: "agent"`, але більше не рекламується в схемі інструмента агента.
Журнали режиму агента містять розв'язаний провайдер/модель транскрибування під час запуску
моста, а також провайдера TTS, модель, голос, формат виводу й частоту дискретизації після
кожної синтезованої відповіді.

Використовуйте `action: "status"`, щоб перелічити активні сесії або перевірити id сесії. Використовуйте
`action: "speak"` із `sessionId` і `message`, щоб змусити агента реального часу
говорити негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сесію,
запустити відому фразу й повернути стан `inCall`, коли хост Chrome може
про нього повідомити. `test_speech` завжди примусово задає `mode: "agent"` і завершується помилкою, якщо його просять
працювати в `mode: "transcribe"`, оскільки сесії лише спостереження навмисно не можуть
видавати мовлення. Його результат `speechOutputVerified` базується на збільшенні байтів аудіовиходу
в реальному часі під час цього тестового виклику, тому повторно використана сесія зі старішим аудіо
не рахується як нова успішна перевірка мовлення. Використовуйте `action: "leave"`, щоб позначити
сесію завершеною.

`status` містить стан Chrome, коли він доступний:

- `inCall`: Chrome, схоже, перебуває всередині виклику Meet
- `micMuted`: найкраща спроба визначити стан мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профілю
  браузера потрібен ручний вхід, допуск від організатора Meet, дозволи або
  ремонт керування браузером, перш ніж мовлення зможе працювати
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: чи
  кероване мовлення Chrome зараз дозволене. `speechReady: false` означає, що OpenClaw не
  надіслав вступну/тестову фразу в аудіоміст.
- `providerConnected` / `realtimeReady`: стан голосового моста реального часу
- `lastInputAt` / `lastOutputAt`: останнє аудіо, побачене з моста або надіслане до нього
- `audioOutputRouted` / `audioOutputDeviceLabel`: чи було медіавиведення вкладки Meet
  активно спрямоване на пристрій BlackHole, який використовує міст
- `lastSuppressedInputAt` / `suppressedInputBytes`: вхід local loopback, проігнорований, поки
  відтворення асистента активне

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Режими агента й Bidi

Режим Chrome `agent` оптимізований для поведінки "мій агент на зустрічі". Провайдер
транскрибування в реальному часі чує аудіо зустрічі, фінальні транскрипти учасників
маршрутизуються через налаштованого агента OpenClaw, а відповідь озвучується
через звичайне середовище виконання OpenClaw TTS. Задайте `mode: "bidi"`, коли хочете,
щоб голосова модель у реальному часі відповідала напряму.
Близькі фінальні фрагменти транскрипту об'єднуються перед консультацією, щоб один усний
хід не створював кілька застарілих часткових відповідей. Вхід у реальному часі також
пригнічується, поки поставлене в чергу аудіо асистента ще відтворюється,
а нещодавні схожі на асистента відлуння транскрипту ігноруються перед консультацією агента,
щоб local loopback BlackHole не змушував агента відповідати на власне мовлення.

| Режим   | Хто визначає відповідь        | Шлях виводу мовлення                   | Коли використовувати                                  |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | Налаштований агент OpenClaw   | Звичайне середовище виконання OpenClaw TTS | Потрібна поведінка "мій агент на зустрічі"            |
| `bidi`  | Голосова модель реального часу | Аудіовідповідь голосового провайдера реального часу | Потрібен голосовий цикл розмови з найнижчою затримкою |

У режимі `bidi`, коли моделі реального часу потрібні глибше міркування, поточна
інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Засіб consult запускає звичайного агента OpenClaw за лаштунками з нещодавнім
контекстом стенограми зустрічі й повертає стислу усну відповідь. У режимі `agent`
OpenClaw надсилає цю відповідь безпосередньо до середовища виконання TTS; у режимі `bidi`
голосова модель реального часу може озвучити результат consult назад у зустрічі. Він використовує
той самий спільний механізм consult, що й Voice Call.

За замовчуванням consult-запити виконуються для агента `main`. Установіть `realtime.agentId`, коли
лінія Meet має звертатися до окремого робочого простору агента OpenClaw, типових налаштувань моделі,
політики інструментів, пам'яті та історії сесій.

Consult-запити в режимі агента використовують ключ сесії для кожної зустрічі
`agent:<id>:subagent:google-meet:<session>`, тож подальші запитання зберігають контекст зустрічі,
успадковуючи звичайну політику агента від налаштованого агента.

`realtime.toolPolicy` керує виконанням consult:

- `safe-read-only`: надати інструмент consult і обмежити звичайного агента
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: надати інструмент consult і дозволити звичайному агенту використовувати звичайну
  політику інструментів агента.
- `none`: не надавати інструмент consult голосовій моделі реального часу.

Ключ сесії consult обмежений окремою сесією Meet, тому подальші виклики consult
можуть повторно використовувати попередній контекст consult під час тієї самої зустрічі.

Щоб примусово виконати голосову перевірку готовності після повного приєднання Chrome до дзвінка:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повної smoke-перевірки приєднання та озвучення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Контрольний список live-тесту

Скористайтеся цією послідовністю, перш ніж передавати зустріч автономному агенту:

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
- Вкладка Meet приєднується до дзвінка, а `test-speech` повертає стан Chrome із
  `inCall: true`.

Для віддаленого хоста Chrome, наприклад VM Parallels macOS, це найкоротша
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
поточним токеном, а аудіоміст Meet доступний до того, як агент відкриє
справжню вкладку зустрічі.

Для smoke-перевірки Twilio використовуйте зустріч, яка надає дані телефонного дозвону:

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
- Повернена сесія має `transport: "twilio"` і `twilio.voiceCallId`.
- `openclaw logs --follow` показує, що DTMF TwiML було віддано перед TwiML реального часу, а потім
  міст реального часу з початковим привітанням у черзі.
- `googlemeet leave <sessionId>` завершує делегований голосовий дзвінок.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно редагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway.
Запущений агент бачить лише інструменти Plugin, зареєстровані поточним процесом Gateway.

На хостах Gateway не з macOS інструмент `google_meet`, доступний агенту, лишається видимим,
але локальні дії озвучування Chrome блокуються до потрапляння в аудіоміст.
Локальне аудіо озвучування Chrome наразі залежить від macOS `BlackHole 2ch`, тому
агентам Linux слід використовувати `mode: "transcribe"`, дозвін Twilio або хост
`chrome-node` на macOS замість типового локального шляху агента Chrome.

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

Вузол має бути підключений і містити `googlemeet.chrome` плюс `browser.proxy`.
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

Якщо `googlemeet setup` не проходить `chrome-node-connected` або журнал Gateway повідомляє
`gateway token mismatch`, перевстановіть або перезапустіть вузол із поточним токеном Gateway.
Для LAN Gateway це зазвичай означає:

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

Запустіть `googlemeet test-listen` для приєднань лише для спостереження або `googlemeet test-speech`
для приєднань у реальному часі, а потім перегляньте повернений стан Chrome. Якщо будь-яка перевірка
повідомляє `manualActionRequired: true`, покажіть `manualActionMessage` оператору
і припиніть повторні спроби, доки дію в браузері не буде завершено.

Поширені ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису хоста Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з'явиться нативний запит дозволу Chrome.
- Закрити або виправити зависле діалогове вікно дозволів Meet.

Не повідомляйте "not signed in" лише тому, що Meet показує "Do you want people to
hear you in the meeting?" Це проміжний екран вибору аудіо Meet; OpenClaw
натискає **Use microphone** через автоматизацію браузера, коли це доступно, і продовжує
очікувати справжнього стану зустрічі. Для резервного браузерного шляху лише створення OpenClaw
може натиснути **Continue without microphone**, оскільки створення URL не потребує
аудіошляху реального часу.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує endpoint Google Meet API `spaces.create`,
коли облікові дані OAuth налаштовано. Без облікових даних OAuth він переходить
до резервного браузера на закріпленому вузлі Chrome. Перевірте:

- Для створення через API: налаштовано `oauth.clientId` і `oauth.refreshToken`,
  або наявні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було створено після додавання підтримки створення.
  У старіших токенів може бракувати scope `meetings.space.created`; повторно виконайте
  `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для резервного браузерного шляху: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений вузол із `browser.proxy` і
  `googlemeet.chrome`.
- Для резервного браузерного шляху: профіль OpenClaw Chrome на цьому вузлі виконано вхід
  у Google і він може відкрити `https://meet.google.com/new`.
- Для резервного браузерного шляху: повторні спроби повторно використовують наявну вкладку
  `https://meet.google.com/new` або вкладку запиту облікового запису Google перед відкриттям нової вкладки. Якщо агент вичерпує час очікування,
  повторіть виклик інструмента, а не відкривайте іншу вкладку Meet вручну.
- Для резервного браузерного шляху: якщо інструмент повертає `manualActionRequired: true`, використовуйте
  повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і
  `manualActionMessage`, щоб скерувати оператора. Не повторюйте спроби в циклі, доки цю
  дію не буде завершено.
- Для резервного браузерного шляху: якщо Meet показує "Do you want people to hear you in the
  meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для
  резервного створення без приєднання, **Continue without microphone** через
  автоматизацію браузера й продовжити очікувати згенерований URL Meet. Якщо він не може, у
  помилці має згадуватися `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте шлях реального часу:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "agent"` для звичайного шляху озвучування STT -> агент OpenClaw -> TTS,
або `mode: "bidi"` для прямого резервного голосового шляху реального часу. `mode: "transcribe"`
навмисно не запускає міст озвучування. Для налагодження лише спостереження
запустіть `openclaw googlemeet status --json <session-id>` після того, як учасники заговорять,
і перевірте `captioning`, `transcriptLines` і `lastCaptionText`. Якщо `inCall` дорівнює
true, але `transcriptLines` лишається `0`, субтитри Meet можуть бути вимкнені, ніхто
не говорив після встановлення спостерігача, інтерфейс Meet змінився або живі
субтитри недоступні для мови/облікового запису зустрічі.

`googlemeet test-speech` завжди перевіряє шлях реального часу й повідомляє, чи
було зафіксовано байти виходу мосту для цього виклику. Якщо `speechOutputVerified` має значення false, а
`speechOutputTimedOut` має значення true, провайдер реального часу міг прийняти
висловлювання, але OpenClaw не побачив, що нові вихідні байти дійшли до аудіомоста Chrome.

Також перевірте:

- Ключ провайдера реального часу доступний на хості Gateway, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `sox` існує на хості Chrome.
- Мікрофон і динамік Meet спрямовано через віртуальний аудіошлях, який використовує
  OpenClaw. `doctor` має показувати `meet output routed: yes` для локальних приєднань Chrome
  у реальному часі.

`googlemeet doctor [session-id]` виводить сесію, вузол, стан у дзвінку,
причину ручної дії, підключення провайдера реального часу, `realtimeReady`, активність
аудіовходу/виходу, останні часові мітки аудіо, лічильники байтів і URL браузера.
Використовуйте `googlemeet status [session-id] --json`, коли потрібен сирий JSON. Використовуйте
`googlemeet doctor --oauth`, коли потрібно перевірити оновлення OAuth Google Meet
без розкриття токенів; додайте `--meeting` або `--create-space`, коли також потрібне
підтвердження Google Meet API.

Якщо агент вичерпав час очікування, а ви бачите вже відкриту вкладку Meet, огляньте цю вкладку
без відкриття іншої:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує та оглядає
наявну вкладку Meet для вибраного транспорту. З `chrome` вона використовує локальне
керування браузером через Gateway; з `chrome-node` вона використовує налаштований
вузол Chrome. Вона не відкриває нову вкладку й не створює нову сесію; вона повідомляє
поточний блокер, наприклад вхід, допуск, дозволи або стан вибору аудіо.
Команда CLI звертається до налаштованого Gateway, тому Gateway має бути запущений;
`chrome-node` також вимагає підключення вузла Chrome.

### Перевірки налаштування Twilio не проходять

`twilio-voice-call-plugin` не проходить, коли `voice-call` не дозволено або не увімкнено.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` не проходить, коли бекенду Twilio бракує account
SID, auth token або caller number. Установіть їх на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` не проходить, коли `voice-call` не має публічної Webhook
доступності або коли `publicUrl` вказує на loopback чи простір приватної мережі.
Установіть `plugins.entries.voice-call.config.publicUrl` на URL публічного провайдера або
налаштуйте тунель/Tailscale-доступ для `voice-call`.

Loopback і приватні URL не є чинними для callback-ів операторів зв'язку. Не використовуйте
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

`voicecall smoke` за замовчуванням лише перевіряє готовність. Щоб виконати пробний запуск для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли навмисно хочете здійснити реальний вихідний дзвінок-сповіщення:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Виклик Twilio запускається, але так і не входить до зустрічі

Переконайтеся, що подія Meet надає дані для телефонного підключення. Передайте точний номер для телефонного підключення та PIN або власну послідовність DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкову `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза
перед введенням PIN.

Якщо телефонний виклик створено, але список учасників Meet ніколи не показує
учасника, що підключився телефоном:

- Запустіть `openclaw googlemeet doctor <session-id>`, щоб підтвердити делегований Twilio
  ідентифікатор виклику, чи DTMF було поставлено в чергу, і чи було запитано вступне привітання.
- Запустіть `openclaw voicecall status --call-id <id>` і підтвердьте, що виклик усе ще
  активний.
- Запустіть `openclaw voicecall tail` і перевірте, що Webhook Twilio надходять до
  Gateway.
- Запустіть `openclaw logs --follow` і знайдіть послідовність Twilio Meet: Google
  Meet делегує приєднання, Voice Call зберігає й надає передпідключувальний DTMF TwiML,
  Voice Call надає realtime TwiML для виклику Twilio, потім Google Meet запитує
  вступне мовлення через `voicecall.speak`.
- Повторно запустіть `openclaw googlemeet setup --transport twilio`; зелена перевірка налаштування
  потрібна, але вона не доводить, що послідовність PIN-коду зустрічі правильна.
- Підтвердьте, що номер для телефонного підключення належить до того самого запрошення Meet і регіону, що й
  PIN.
- Збільште `voiceCall.dtmfDelayMs` від стандартних 12 секунд, якщо Meet відповідає
  повільно або розшифровка виклику все ще показує запит на введення PIN після того,
  як передпідключувальний DTMF було надіслано.
- Якщо учасник приєднується, але ви не чуєте привітання, перевірте
  `openclaw logs --follow` на наявність post-DTMF запиту `voicecall.speak` і
  або відтворення TTS через медіапотік, або резервного Twilio `<Say>`. Якщо розшифровка
  виклику все ще містить "enter the meeting PIN", телефонна лінія ще не приєдналася
  до кімнати Meet, тому учасники зустрічі не почують мовлення.

Якщо Webhook не надходять, спочатку налагодьте Plugin Voice Call: провайдер має
досягати `plugins.entries.voice-call.config.publicUrl` або налаштованого тунелю.
Див. [Усунення несправностей голосових викликів](/uk/plugins/voice-call#troubleshooting).

## Примітки

Офіційний медіа API Google Meet орієнтований на отримання, тому для мовлення в
виклик Meet усе ще потрібен шлях учасника. Цей Plugin робить цю межу видимою:
Chrome обробляє участь через браузер і локальну маршрутизацію аудіо; Twilio обробляє
участь через телефонне підключення.

Режими зворотного аудіозв'язку Chrome потребують `BlackHole 2ch` плюс одне з такого:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw володіє
  мостом і передає аудіо у форматі `chrome.audioFormat` між цими командами та
  вибраним провайдером. Режим агента використовує транскрибування в реальному часі плюс звичайний TTS;
  режим bidi використовує голосового провайдера реального часу. Стандартний шлях Chrome - це 24 кГц
  PCM16 з `chrome.audioBufferBytes: 4096`; 8 кГц G.711 mu-law лишається
  доступним для застарілих пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда мосту володіє всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона. Це чинно лише
  для `bidi`, бо режим `agent` потребує прямого доступу до пари команд для TTS.

Коли агент викликає інструмент `google_meet` у режимі агента, консультативна сесія
зустрічі відгалужує поточну розшифровку викликача перед відповіддю на мовлення
учасника. Сесія Meet усе одно лишається окремою (`agent:<agentId>:subagent:google-meet:<sessionId>`),
тому подальші дії зустрічі не змінюють розшифровку викликача напряму.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може відлунювати інших учасників назад у виклик.

З Chrome-мостом через пару команд `chrome.bargeInInputCommand` може слухати
окремий локальний мікрофон і очищати відтворення асистента, коли людина починає
говорити. Це ставить людське мовлення попереду виводу асистента, навіть коли спільний
вхід BlackHole loopback тимчасово пригнічено під час відтворення асистента.
Як і `chrome.audioInputCommand` та `chrome.audioOutputCommand`, це
локальна команда, налаштована оператором. Використовуйте явний довірений шлях команди або
список аргументів і не спрямовуйте її на скрипти з недовірених розташувань.

`googlemeet speak` запускає активний аудіоміст зворотного аудіозв'язку для сесії Chrome.
`googlemeet leave` зупиняє цей міст. Для сесій Twilio, делегованих
через Plugin Voice Call, `leave` також завершує базовий голосовий виклик.
Використовуйте `googlemeet end-active-conference`, коли також хочете закрити активну
конференцію Google Meet для простору, керованого API.

## Пов'язане

- [Plugin голосових викликів](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення plugins](/uk/plugins/building-plugins)
