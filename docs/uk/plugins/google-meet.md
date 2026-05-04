---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий дзвінок Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Plugin Google Meet: приєднання за чітко вказаними URL Meet через Chrome або Twilio зі стандартними налаштуваннями голосової відповіді агента'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-04T05:46:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad2117a42a91f9b494e8c48cc4cfd7439c8bd7b32fd8b97a139fb9b8bbde40a1
    source_path: plugins/google-meet.md
    workflow: 16
---

Підтримка учасника Google Meet для OpenClaw — плагін навмисно працює явно:

- Він приєднується лише до явної URL-адреси `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися до
  повернутої URL-адреси.
- `agent` — типовий режим відповіді голосом: транскрипція в реальному часі слухає,
  налаштований агент OpenClaw відповідає, а звичайний OpenClaw TTS говорить у Meet.
- `bidi` залишається доступним як резервний режим прямої голосової моделі реального часу.
- Агенти вибирають поведінку приєднання через `mode`: використовуйте `agent` для живого
  прослуховування/відповіді голосом, `bidi` для прямого резервного голосу в реальному часі або `transcribe`
  для приєднання/керування браузером без моста відповіді голосом.
- Автентифікація починається з особистого Google OAuth або вже виконаного входу в профіль Chrome.
- Автоматичного оголошення згоди немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на спареному вузловому хості.
- Twilio приймає номер для дозвону плюс необов'язковий PIN або послідовність DTMF; він
  не може напряму набрати URL-адресу Meet.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших агентських
  телеконференц-процесів.

## Швидкий старт

Установіть локальні аудіозалежності й налаштуйте постачальника транскрипції в реальному часі
плюс звичайний OpenClaw TTS. OpenAI є типовим постачальником транскрипції;
Google Gemini Live також працює як окремий резервний голос `bidi` з
`realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
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

Вивід налаштування призначений для читання агентом і враховує режим. Він повідомляє про профіль Chrome,
закріплення вузла, а для приєднань Chrome у реальному часі — про аудіоміст
BlackHole/SoX і відкладені перевірки вступу в реальному часі. Для приєднань лише для спостереження перевірте той самий
транспорт із `--mode transcribe`; цей режим пропускає передумови аудіо в реальному часі,
бо він не слухає й не говорить через міст:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Коли налаштовано делегування Twilio, налаштування також повідомляє, чи готові
плагін `voice-call`, облікові дані Twilio і публічна доступність Webhook.
Сприймайте будь-яку перевірку `ok: false` як блокер для перевіреного транспорту й режиму
перед тим, як просити агента приєднатися. Використовуйте `openclaw googlemeet setup --json` для
скриптів або машинозчитуваного виводу. Використовуйте `--transport chrome`,
`--transport chrome-node` або `--transport twilio`, щоб попередньо перевірити конкретний
транспорт до того, як агент спробує його використати.

Для Twilio завжди явно перевіряйте транспорт, коли типовий транспорт —
Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Це виявляє відсутню прив'язку `voice-call`, облікові дані Twilio або недоступну
публічну Webhook-адресу до того, як агент спробує набрати зустріч.

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

Інструмент `google_meet` для агента залишається доступним на хостах не з macOS для
артефактів, календаря, налаштування, транскрибування, Twilio та потоків `chrome-node`. Локальні
дії Chrome з відповіддю голосом там заблоковані, бо вбудований аудіошлях Chrome
зараз залежить від macOS `BlackHole 2ch`. На Linux використовуйте `mode: "transcribe"`,
дозвін Twilio або macOS-хост `chrome-node` для участі Chrome з відповіддю голосом.

Створіть нову зустріч і приєднайтеся до неї:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Для кімнат, створених через API, використовуйте Google Meet `SpaceConfig.accessType`, коли хочете,
щоб політика входу без стуку для кімнати була явною, а не успадкованою з типових значень
облікового запису Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` дозволяє будь-кому з URL-адресою Meet приєднатися без стуку. `TRUSTED` дозволяє
довіреним користувачам організації хоста, запрошеним зовнішнім користувачам і користувачам із дозвоном
приєднуватися без стуку. `RESTRICTED` обмежує вхід без стуку лише запрошеними. Ці
налаштування застосовуються лише до офіційного шляху створення через Google Meet API, тому облікові дані
OAuth мають бути налаштовані.

Якщо ви автентифікували Google Meet до появи цієї опції, повторно запустіть
`openclaw googlemeet auth login --json` після додавання області
`meetings.space.settings` на екрані згоди Google OAuth.

Створіть лише URL-адресу без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це
  найдетермінованіший шлях, який не залежить від стану інтерфейсу браузера.
- Резервний браузерний шлях: використовується, коли облікових даних OAuth немає. OpenClaw використовує
  закріплений вузол Chrome, відкриває `https://meet.google.com/new`, чекає, доки Google
  перенаправить на справжню URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Цей шлях потребує,
  щоб профіль OpenClaw Chrome на вузлі вже був залогінений у Google.
  Браузерна автоматизація обробляє власний первинний запит Meet на мікрофон; цей запит
  не вважається помилкою входу Google.
  Потоки приєднання й створення також намагаються повторно використати наявну вкладку Meet перед відкриттям
  нової. Зіставлення ігнорує безпечні рядки запиту URL, як-от `authuser`, тому повторна спроба
  агента має сфокусувати вже відкриту зустріч замість створення другої
  вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` типово приєднується до нової зустрічі й
повертає `joined: true` плюс сесію приєднання. Щоб лише створити URL-адресу, використовуйте
`create --no-join` у CLI або передайте `"join": false` інструменту.

Або скажіть агенту: "Створи Google Meet, приєднайся до нього в режимі відповіді голосом агента
і надішли мені посилання." Агент має викликати `google_meet` з
`action: "create"`, а потім поширити повернуте `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Для приєднання лише для спостереження/керування браузером установіть `"mode": "transcribe"`. Це не
запускає дуплексний голосовий міст реального часу, не потребує BlackHole або SoX
і не відповідатиме голосом у зустріч. Приєднання Chrome у цьому режимі також уникають
надання дозволів OpenClaw на мікрофон/камеру й обходять шлях Meet **Use
microphone**. Якщо Meet показує проміжний екран вибору аудіо, автоматизація намагається
вибрати шлях без мікрофона, а інакше повідомляє про ручну дію замість відкриття
локального мікрофона. У режимі transcribe керовані транспорти Chrome також встановлюють
best-effort спостерігач субтитрів Meet. `googlemeet status --json` і
`googlemeet doctor` показують `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
і короткий хвіст `recentTranscript`, щоб оператори могли зрозуміти, чи браузер
приєднався до дзвінка і чи субтитри Meet генерують текст.
Використовуйте `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, коли
потрібна перевірка так/ні: вона приєднується в режимі transcribe, чекає на новий рух субтитрів або
транскрипту і повертає `listenVerified`, `listenTimedOut`, поля ручних
дій і останній стан субтитрів.

Під час сесій реального часу статус `google_meet` містить стан браузера та аудіомоста,
зокрема `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, останні часові мітки вводу/виводу,
лічильники байтів і стан закриття моста. Якщо з'являється безпечний запит сторінки Meet,
браузерна автоматизація обробляє його, коли може. Вхід, допуск хостом і
запити дозволів браузера/ОС повідомляються як ручна дія з причиною та
повідомленням, яке агент має передати. Керовані сесії Chrome відтворюють вступну або
тестову фразу лише після того, як стан браузера повідомить `inCall: true`; інакше статус повідомляє
`speechReady: false`, а спробу мовлення блокують замість удавання, що
агент говорив у зустріч.

Локальні приєднання Chrome використовують залогінений профіль браузера OpenClaw. Режим реального часу
потребує `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для
чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного
пристрою BlackHole достатньо для першого smoke test, але він може давати луну.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM
лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть
вузловий хост у VM. Увімкніть вбудований плагін на VM один раз, щоб вузол
оголосив команду Chrome:

Що де запускається:

- Хост Gateway: OpenClaw Gateway, робоча область агента, ключі моделі/API, постачальник реального часу
  і конфіг плагіна Google Meet.
- Parallels macOS VM: OpenClaw CLI/вузловий хост, Google Chrome, SoX, BlackHole 2ch
  і профіль Chrome, залогінений у Google.
- Не потрібно у VM: сервіс Gateway, конфіг агента, ключ OpenAI/GPT або налаштування
  постачальника моделі.

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

Установіть або оновіть OpenClaw у VM, а потім увімкніть там вбудований плагін:

```bash
openclaw plugins enable google-meet
```

Запустіть вузловий хост у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це LAN IP і ви не використовуєте TLS, вузол відхилить
незашифрований WebSocket, якщо ви явно не дозволите його для цієї довіреної приватної мережі:

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

Тепер приєднайтеся звичайно з хоста Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

або попросіть агента використати інструмент `google_meet` з `transport: "chrome-node"`.

Для smoke test однією командою, який створює або повторно використовує сесію, промовляє відому
фразу і друкує стан сесії:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання в реальному часі браузерна автоматизація OpenClaw заповнює ім’я гостя, натискає Приєднатися/Попросити приєднатися та приймає перший вибір Meet «Використовувати мікрофон», коли з’являється цей запит. Під час приєднання лише для спостереження або створення зустрічі лише в браузері вона проходить повз той самий запит без мікрофона, коли такий вибір доступний. Якщо профіль браузера не ввійшов в обліковий запис, Meet очікує допуску від організатора, Chrome потребує дозволу на мікрофон/камеру для приєднання в реальному часі або Meet застряг на запиті, який автоматизація не змогла розв’язати, результат join/test-speech повідомляє `manualActionRequired: true` з `manualActionReason` і `manualActionMessage`. Агенти мають припинити повторювати приєднання, повідомити це точне повідомлення разом із поточними `browserUrl`/`browserTitle` і повторювати спробу лише після завершення ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає лише тоді, коли рівно один підключений вузол оголошує і `googlemeet.chrome`, і керування браузером. Якщо підключено кілька придатних вузлів, задайте `chromeNode.node` як ідентифікатор вузла, відображуване ім’я або віддалену IP-адресу.

Поширені перевірки помилок:

- `Configured Google Meet node ... is not usable: offline`: закріплений вузол відомий Gateway, але недоступний. Агенти мають розглядати цей вузол як діагностичний стан, а не як придатний хост Chrome, і повідомляти про блокер налаштування замість переходу до іншого транспорту, якщо користувач не просив цього.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM, підтвердьте спарювання та переконайтеся, що `openclaw plugins enable google-meet` і `openclaw plugins enable browser` були запущені у VM. Також підтвердьте, що хост Gateway дозволяє обидві команди вузла через `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: установіть `blackhole-2ch` на хості, який перевіряється, і перезавантажтеся перед використанням локального аудіо Chrome.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch` у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або залиште `chrome.guestName` заданим для гостьового приєднання. Автоматичне гостьове приєднання використовує браузерну автоматизацію OpenClaw через браузерний проксі вузла; переконайтеся, що конфігурація браузера вузла вказує на потрібний профіль, наприклад `browser.defaultProfile: "user"` або іменований профіль наявного сеансу.
- Дубльовані вкладки Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw активує наявну вкладку для тієї самої URL-адреси Meet перед відкриттям нової, а створення зустрічі в браузері повторно використовує незавершену вкладку `https://meet.google.com/new` або вкладку запиту облікового запису Google перед відкриттям іншої.
- Немає аудіо: у Meet спрямуйте аудіо мікрофона/динаміка через шлях віртуального аудіопристрою, який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію в стилі Loopback для чистого дуплексного аудіо.

## Примітки щодо встановлення

Типове зворотне аудіо Chrome використовує два зовнішні інструменти:

- `sox`: аудіоутиліта командного рядка. Plugin використовує явні команди пристрою CoreAudio для типового аудіомоста 24 кГц PCM16.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`, через який Chrome/Meet може маршрутизувати аудіо.

OpenClaw не комплектує й не розповсюджує жоден із цих пакетів. Документація просить користувачів установлювати їх як залежності хоста через Homebrew. SoX ліцензовано як `LGPL-2.0-only AND GPL-2.0-only`; BlackHole має ліцензію GPL-3.0. Якщо ви створюєте інсталятор або appliance, що комплектує BlackHole з OpenClaw, перегляньте умови ліцензування upstream BlackHole або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet через керування браузером OpenClaw і приєднується як профіль браузера OpenClaw, що ввійшов в обліковий запис. На macOS Plugin перевіряє наявність `BlackHole 2ch` перед запуском. Якщо налаштовано, він також запускає команду перевірки стану аудіомоста й команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють на спареному вузлі, наприклад VM Parallels macOS. Для локального Chrome виберіть профіль через `browser.defaultProfile`; `chrome.browserProfile` передається хостам `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона й динаміка Chrome через локальний аудіоміст OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це суворий план набору, делегований Plugin Voice Call. Він не аналізує сторінки Meet для пошуку телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або потрібен резервний варіант телефонного дозвону. Google Meet має надати номер телефонного дозвону й PIN для зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

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

Надайте облікові дані Twilio через середовище або конфігурацію. Середовище тримає секрети поза `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Натомість використовуйте `realtime.provider: "openai"` з Plugin провайдера OpenAI і `OPENAI_API_KEY`, якщо це ваш провайдер голосу в реальному часі.

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни конфігурації Plugin не з’являються в уже запущеному процесі Gateway, доки він не перезавантажиться.

Потім перевірте:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Коли делегування Twilio підключено, `googlemeet setup` містить успішні перевірки `twilio-voice-call-plugin`, `twilio-voice-call-credentials` і `twilio-voice-call-webhook`.

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

OAuth необов’язковий для створення посилання Meet, оскільки `googlemeet create` може відступити до браузерної автоматизації. Налаштуйте OAuth, коли потрібні офіційне створення через API, розв’язання простору або перевірки preflight Meet Media API.

Доступ до Google Meet API використовує користувацький OAuth: створіть клієнт Google Cloud OAuth, запитайте потрібні scopes, авторизуйте обліковий запис Google, а потім збережіть отриманий refresh token у конфігурації Plugin Google Meet або надайте змінні середовища `OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання Chrome. Транспорти Chrome і Chrome-node усе ще приєднуються через профіль Chrome, що ввійшов в обліковий запис, BlackHole/SoX і підключений вузол, коли ви використовуєте участь через браузер. OAuth призначений лише для офіційного шляху Google Meet API: створення просторів зустрічей, розв’язання просторів і виконання перевірок preflight Meet Media API.

### Створення облікових даних Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** — найпростіший варіант для організації Google Workspace.
   - **External** працює для особистих/тестових налаштувань; поки застосунок перебуває в Testing, додайте кожен обліковий запис Google, який авторизуватиме застосунок, як тестового користувача.
4. Додайте scopes, які запитує OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Створіть OAuth client ID.
   - Тип застосунку: **Web application**.
   - Авторизована URI перенаправлення:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Скопіюйте client ID і client secret.

`meetings.space.created` потрібен Google Meet `spaces.create`. `meetings.space.readonly` дає OpenClaw змогу розв’язувати URL-адреси/коди Meet у простори. `meetings.space.settings` дає OpenClaw змогу передавати налаштування `SpaceConfig`, як-от `accessType`, під час створення кімнати через API. `meetings.conference.media.readonly` призначений для preflight Meet Media API і роботи з медіа; Google може вимагати участі в Developer Preview для фактичного використання Media API. Якщо вам потрібні лише приєднання Chrome на основі браузера, повністю пропустіть OAuth.

### Випуск refresh token

Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, або передайте їх як змінні середовища, а потім запустіть:

```bash
openclaw googlemeet auth login --json
```

Команда виводить конфігураційний блок `oauth` з refresh token. Вона використовує PKCE, localhost callback на `http://localhost:8085/oauth2callback` і ручний потік копіювання/вставлення з `--manual`.

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

Віддавайте перевагу змінним середовища, коли не хочете зберігати refresh token у конфігурації. Якщо наявні і конфігурація, і значення середовища, Plugin спершу використовує конфігурацію, а потім fallback до середовища.

Згода OAuth включає створення просторів Meet, доступ на читання просторів Meet і доступ на читання медіа конференції Meet. Якщо ви автентифікувалися до появи підтримки створення зустрічей, повторно запустіть `openclaw googlemeet auth login --json`, щоб refresh token мав scope `meetings.space.created`.

### Перевірка OAuth через doctor

Запустіть OAuth doctor, коли потрібна швидка перевірка стану без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує runtime Chrome і не потребує підключеного вузла Chrome. Воно перевіряє, що конфігурація OAuth існує і що refresh token може видати access token. JSON-звіт містить лише поля стану, як-от `ok`, `configured`, `tokenSource`, `expiresAt`, і повідомлення перевірок; він не друкує access token, refresh token або client secret.

Поширені результати:

| Перевірка            | Значення                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Наявні `oauth.clientId` плюс `oauth.refreshToken` або кешований маркер доступу.         |
| `oauth-token`        | Кешований маркер доступу досі чинний або маркер оновлення створив новий маркер доступу. |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` визначила наявний простір Meet.                     |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий простір Meet.                   |

Щоб також підтвердити ввімкнення Google Meet API та область `spaces.create`, запустіть
перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює тимчасовий Meet URL. Використовуйте це, коли потрібно підтвердити,
що в проєкті Google Cloud увімкнено Meet API і що авторизований
обліковий запис має область `meetings.space.created`.

Щоб підтвердити доступ для читання наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` підтверджують доступ для читання до наявного
простору, до якого має доступ авторизований обліковий запис Google. `403` від цих перевірок
зазвичай означає, що Google Meet REST API вимкнено, погодженому маркеру оновлення
бракує потрібної області або обліковий запис Google не має доступу до цього простору Meet.
Помилка маркера оновлення означає, що потрібно повторно виконати `openclaw googlemeet auth login
--json` і зберегти новий блок `oauth`.

Для резервного браузерного режиму облікові дані OAuth не потрібні. У цьому режимі автентифікація Google
надходить із профілю Chrome, у який виконано вхід, на вибраному вузлі, а не з
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

Визначте Meet URL, код або `spaces/{id}` через `spaces.get`:

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

З `--meeting` команди `artifacts` і `attendance` типово використовують найновіший запис конференції.
Передайте `--all-conference-records`, коли потрібні всі збережені записи
для цієї зустрічі.

Пошук у календарі може визначити URL зустрічі з Google Calendar перед читанням
артефактів Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` шукає в сьогоднішньому календарі `primary` подію Calendar із
посиланням Google Meet. Використовуйте `--event <query>` для пошуку відповідного тексту події та
`--calendar <id>` для неосновного календаря. Пошук у календарі потребує свіжого
входу OAuth, який включає область лише для читання подій Calendar.
`calendar-events` попередньо показує відповідні події Meet і позначає подію, яку
виберуть `latest`, `artifacts`, `attendance` або `export`.

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

Це викликає Google Meet `spaces.endActiveConference` і потребує OAuth з областю
`meetings.space.created` для простору, яким може керувати авторизований обліковий запис.
OpenClaw приймає Meet URL, код зустрічі або вхідні дані `spaces/{id}` і визначає їх
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

`artifacts` повертає метадані запису конференції плюс метадані ресурсів учасників, записів,
транскрипта, структурованих записів транскрипта та розумних нотаток, коли
Google надає їх для зустрічі. Використовуйте `--no-transcript-entries`, щоб пропустити
пошук записів для великих зустрічей. `attendance` розгортає учасників у
рядки сеансів учасників із часом першої/останньої появи, загальною тривалістю сеансу,
прапорцями запізнення/раннього виходу та об’єднанням дубльованих ресурсів учасників за користувачем,
що ввійшов, або відображуваним іменем. Передайте `--no-merge-duplicates`, щоб зберегти необроблені ресурси учасників
окремо, `--late-after-minutes`, щоб налаштувати виявлення запізнень, і
`--early-before-minutes`, щоб налаштувати виявлення раннього виходу.

`export` записує папку, що містить `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`.
`manifest.json` фіксує вибрані вхідні дані, параметри експорту, записи конференції,
вихідні файли, лічильники, джерело маркера, подію Calendar, якщо її було використано, і будь-які
попередження про часткове отримання. Передайте `--zip`, щоб також записати переносний архів поряд
із папкою. Передайте `--include-doc-bodies`, щоб експортувати текст пов’язаних транскриптів і
розумних нотаток Google Docs через Google Drive `files.export`; для цього потрібен
свіжий вхід OAuth, який включає область лише для читання Drive Meet. Без
`--include-doc-bodies` експорти включають лише метадані Meet і структуровані записи транскрипта.
Якщо Google повертає часткову помилку артефакта, як-от помилку переліку розумних нотаток,
запису транскрипта або тіла документа Drive, підсумок і
маніфест зберігають попередження замість того, щоб зірвати весь експорт.
Використовуйте `--dry-run`, щоб отримати ті самі дані артефактів/відвідуваності та вивести
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

Агенти також можуть створити кімнату на основі API з явною політикою доступу:

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

Для перевірки спершу з прослуховуванням агенти мають використовувати `test_listen`, перш ніж стверджувати, що
зустріч корисна:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Запустіть захищену live smoke-перевірку на реальній збереженій зустрічі:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Запустіть live браузерну пробу з прослуховуванням спочатку на зустрічі, де хтось буде
говорити за наявності субтитрів Meet:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Середовище live smoke-перевірки:

- `OPENCLAW_LIVE_TEST=1` вмикає захищені live-тести.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` вказує на збережений Meet URL, код або
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID` надає ідентифікатор клієнта OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN` надає
  маркер оновлення.
- Необов’язково: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` і
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` використовують ті самі резервні імена
  без префікса `OPENCLAW_`.

Базова live smoke-перевірка артефактів/відвідуваності потребує
`https://www.googleapis.com/auth/meetings.space.readonly` і
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Пошук у Calendar
потребує `https://www.googleapis.com/auth/calendar.events.readonly`. Експорт
тіла документа Drive потребує
`https://www.googleapis.com/auth/drive.meet.readonly`.

Створіть свіжий простір Meet:

```bash
openclaw googlemeet create
```

Команда виводить новий `meeting uri`, джерело та сеанс приєднання. З обліковими даними OAuth
вона використовує офіційний Google Meet API. Без облікових даних OAuth вона
використовує як резервний варіант профіль браузера закріпленого вузла Chrome, у який виконано вхід. Агенти можуть
використовувати інструмент `google_meet` з `action: "create"`, щоб створити й приєднатися за один
крок. Для створення лише URL передайте `"join": false`.

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

Якщо резервний браузерний режим стикається з входом Google або блокуванням дозволів Meet до того, як
зможе створити URL, метод Gateway повертає невдалу відповідь, а інструмент
`google_meet` повертає структуровані деталі замість звичайного рядка:

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
`manualActionMessage` разом із контекстом вузла/вкладки браузера та припинити відкривати нові
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

Створення Meet за замовчуванням приєднує до зустрічі. Транспорт Chrome або Chrome-node все ще
потребує профілю Google Chrome із виконаним входом, щоб приєднатися через браузер. Якщо
з профілю виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або
помилку резервного браузерного режиму й просить оператора завершити вхід у Google перед
повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
проєкт, OAuth-принципал і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Спільному шляху агента Chrome потрібні лише ввімкнений Plugin, BlackHole, SoX,
ключ провайдера транскрипції в реальному часі та налаштований провайдер TTS OpenClaw.
OpenAI є стандартним провайдером транскрипції; установіть `realtime.voiceProvider` на
`"google"` і `realtime.model`, щоб використовувати Google Gemini Live для режиму `bidi`
без зміни стандартного провайдера транскрипції для режиму агента:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
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

Типові значення:

- `defaultTransport: "chrome"`
- `defaultMode: "agent"` (`"realtime"` приймається лише як застарілий
  псевдонім сумісності для `"agent"`; нові виклики інструментів мають указувати `"agent"`)
- `chromeNode.node`: необов’язковий ідентифікатор/назва/IP вузла для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на гостьовому
  екрані Meet без виконаного входу
- `chrome.autoJoin: true`: best-effort заповнення гостьового імені та натискання Join Now
  через браузерну автоматизацію OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкривання дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить про стан у дзвінку,
  перш ніж запускати вступ для відповіді голосом
- `chrome.audioFormat: "pcm16-24khz"`: аудіоформат пари команд. Використовуйте
  `"g711-ulaw-8khz"` лише для застарілих/користувацьких пар команд, які досі видають
  телефонний звук.
- `chrome.audioBufferBytes: 4096`: буфер обробки SoX для згенерованих Chrome
  аудіокоманд пари команд. Це половина стандартного буфера SoX у 8192 байти,
  що зменшує стандартну затримку каналу, залишаючи простір для збільшення на завантажених хостах.
  Значення нижче мінімуму SoX обмежуються 17 байтами.
- `chrome.audioInputCommand`: команда SoX, що читає з CoreAudio `BlackHole 2ch`
  і записує аудіо у форматі `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX, що читає аудіо у форматі `chrome.audioFormat`
  і записує в CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: необов’язкова команда локального мікрофона, що записує
  signed 16-bit little-endian mono PCM для виявлення людського втручання, поки
  активне відтворення асистента. Наразі це застосовується до розміщеного на Gateway
  моста пари команд `chrome`.
- `chrome.bargeInRmsThreshold: 650`: рівень RMS, що вважається людським
  перериванням на `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: піковий рівень, що вважається людським
  перериванням на `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: мінімальна затримка між повторними очищеннями
  людських переривань
- `mode: "agent"`: стандартний режим відповіді голосом. Мовлення учасників транскрибується
  налаштованим провайдером транскрипції в реальному часі, надсилається налаштованому
  агенту OpenClaw у сеансі субагента для конкретної зустрічі та озвучується через
  звичайне середовище виконання OpenClaw TTS.
- `mode: "bidi"`: резервний прямий двоспрямований режим моделі реального часу. Провайдер
  голосу реального часу відповідає безпосередньо на мовлення учасників і може викликати
  `openclaw_agent_consult` для глибших відповідей із підтримкою інструментів.
- `mode: "transcribe"`: режим лише спостереження без моста відповіді голосом.
- `realtime.provider: "openai"`: резервна сумісність, що використовується, коли
  наведені нижче поля провайдера в області дії не задані.
- `realtime.transcriptionProvider: "openai"`: ідентифікатор провайдера, який режим `agent`
  використовує для транскрипції в реальному часі.
- `realtime.voiceProvider`: ідентифікатор провайдера, який режим `bidi` використовує для прямого
  голосу в реальному часі. Установіть це на `"google"`, щоб використовувати Gemini Live,
  зберігаючи транскрипцію режиму агента на OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли міст реального часу
  підключається; установіть значення `""`, щоб приєднатися мовчки
- `realtime.agentId`: необов’язковий ідентифікатор агента OpenClaw для
  `openclaw_agent_consult`; стандартне значення — `main`

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
фактичний виклик PSTN, DTMF і вступне привітання Plugin Voice Call. Voice Call
відтворює послідовність DTMF перед відкриттям медіапотоку реального часу, а потім використовує
збережений вступний текст як початкове привітання реального часу. Якщо `voice-call` не
ввімкнено, Google Meet усе ще може перевірити й записати план набору, але не може
здійснити виклик Twilio.

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
`transport: "chrome-node"`, коли Chrome працює на спареному вузлі, наприклад VM Parallels.
В обох випадках провайдери моделей і `openclaw_agent_consult` працюють на хості
Gateway, тому облікові дані моделей залишаються там. Зі стандартним `mode: "agent"`
провайдер транскрипції в реальному часі виконує прослуховування, налаштований агент OpenClaw
створює відповідь, а звичайний OpenClaw TTS промовляє її в Meet. Використовуйте
`mode: "bidi"`, коли потрібно, щоб голосова модель реального часу відповідала напряму.
Сире `mode: "realtime"` і надалі приймається як застарілий псевдонім сумісності для
`mode: "agent"`, але більше не рекламується в схемі інструментів агента.
Журнали режиму агента містять визначені провайдера/модель транскрипції під час запуску
моста, а також провайдера TTS, модель, голос, вихідний формат і частоту дискретизації після
кожної синтезованої відповіді.

Використовуйте `action: "status"`, щоб перелічити активні сеанси або перевірити ID сеансу. Використовуйте
`action: "speak"` із `sessionId` і `message`, щоб агент реального часу
негайно заговорив. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сеанс,
запустити відому фразу й повернути стан `inCall`, коли хост Chrome може
повідомити його. `test_speech` завжди примусово встановлює `mode: "agent"` і завершується помилкою, якщо його просять
запуститися в `mode: "transcribe"`, оскільки сеанси лише спостереження навмисно не можуть
виводити мовлення. Його результат `speechOutputVerified` ґрунтується на збільшенні байтів аудіовиходу
реального часу під час цього тестового виклику, тому повторно використаний сеанс зі старішим аудіо
не вважається свіжою успішною перевіркою мовлення. Використовуйте `action: "leave"`, щоб позначити
сеанс завершеним.

`status` містить стан Chrome, коли він доступний:

- `inCall`: схоже, Chrome перебуває всередині виклику Meet
- `micMuted`: best-effort стан мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профілю
  браузера потрібні ручний вхід, допуск хостом Meet, дозволи або
  відновлення керування браузером, перш ніж мовлення зможе працювати
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: чи
  кероване мовлення Chrome дозволене зараз. `speechReady: false` означає, що OpenClaw не
  надіслав вступну/тестову фразу в аудіоміст.
- `providerConnected` / `realtimeReady`: стан голосового моста реального часу
- `lastInputAt` / `lastOutputAt`: останнє аудіо, побачене з моста або надіслане до нього
- `audioOutputRouted` / `audioOutputDeviceLabel`: чи медіавихід вкладки Meet
  був активно маршрутизований до пристрою BlackHole, який використовує міст
- `lastSuppressedInputAt` / `suppressedInputBytes`: вхід local loopback, проігнорований, поки
  активне відтворення асистента

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Режими агента та Bidi

Режим Chrome `agent` оптимізований для поведінки «мій агент присутній на зустрічі». Провайдер
транскрипції в реальному часі чує аудіо зустрічі, фінальні транскрипти учасників
маршрутизуються через налаштованого агента OpenClaw, а відповідь
озвучується через звичайне середовище виконання OpenClaw TTS. Установіть `mode: "bidi"`, коли хочете,
щоб голосова модель реального часу відповідала напряму.
Близькі фінальні фрагменти транскрипту об’єднуються перед консультацією, щоб один усний
хід не створював кілька застарілих часткових відповідей. Вхід реального часу також
приглушується, поки аудіо асистента в черзі ще відтворюється,
а недавні схожі на асистента відлуння транскрипту ігноруються перед консультацією агента,
щоб local loopback BlackHole не змушував агента відповідати на власне мовлення.

| Режим   | Хто визначає відповідь        | Шлях мовного виводу                     | Коли використовувати                                   |
| ------- | ----------------------------- | --------------------------------------- | ------------------------------------------------------ |
| `agent` | Налаштований агент OpenClaw   | Звичайне середовище виконання OpenClaw TTS | Потрібна поведінка «мій агент присутній на зустрічі»  |
| `bidi`  | Голосова модель реального часу | Аудіовідповідь провайдера голосу реального часу | Потрібен голосовий діалоговий цикл із найнижчою затримкою |

У режимі `bidi`, коли моделі реального часу потрібні глибші міркування, поточна
інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw у фоновому режимі з нещодавнім
контекстом транскрипту зустрічі й повертає стислу усну відповідь. У режимі `agent`
OpenClaw надсилає цю відповідь безпосередньо до середовища виконання TTS; у режимі `bidi`
голосова модель реального часу може промовити результат консультації назад у зустріч. Він використовує
той самий спільний механізм консультацій, що й Voice Call.

За замовчуванням консультації виконуються для агента `main`. Установіть `realtime.agentId`, коли
лінія Meet має консультуватися зі спеціальним робочим простором агента OpenClaw, стандартними значеннями моделі,
політикою інструментів, пам’яттю та історією сеансів.

Консультації в режимі агента використовують ключ сеансу `agent:<id>:subagent:google-meet:<session>`
для конкретної зустрічі, щоб подальші запитання зберігали контекст зустрічі, успадковуючи звичайну
політику агента від налаштованого агента.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: відкрити інструмент консультації та обмежити звичайного агента до
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: відкрити інструмент консультації та дозволити звичайному агенту використовувати звичайну
  політику інструментів агента.
- `none`: не відкривати інструмент консультації для голосової моделі реального часу.

Ключ консультаційного сеансу має область дії в межах одного сеансу Meet, тож подальші консультаційні виклики
можуть повторно використовувати попередній консультаційний контекст під час тієї самої зустрічі.

Щоб примусово виконати голосову перевірку готовності після того, як Chrome повністю приєднався до виклику:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повної перевірки приєднання з промовлянням:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Контрольний список live-тесту

Використайте цю послідовність перед передаванням зустрічі автономному агенту:

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
  типовим транспортом або node закріплено.
- `nodes status` показує, що вибраний node підключено.
- Вибраний node оголошує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до виклику, а `test-speech` повертає стан Chrome із
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

Це підтверджує, що Gateway Plugin завантажено, node VM підключено з
поточним токеном, а аудіоміст Meet доступний до того, як агент відкриє
справжню вкладку зустрічі.

Для перевірки Twilio використовуйте зустріч, яка показує дані телефонного дозвону:

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
- `openclaw logs --follow` показує, що DTMF TwiML було віддано перед realtime TwiML, а потім
  realtime-міст із початковим привітанням у черзі.
- `googlemeet leave <sessionId>` завершує делегований голосовий виклик.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно відредагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway.
Запущений агент бачить лише інструменти Plugin, зареєстровані поточним процесом Gateway.

На хостах Gateway не з macOS інструмент `google_meet`, видимий агенту, залишається доступним,
але локальні дії зворотного мовлення Chrome блокуються до потрапляння в аудіоміст.
Локальне аудіо зворотного мовлення Chrome наразі залежить від macOS `BlackHole 2ch`, тому
агентам Linux слід використовувати `mode: "transcribe"`, дозвін Twilio або хост macOS
`chrome-node` замість типового локального шляху агента Chrome.

### Немає підключеного node з підтримкою Google Meet

На хості node виконайте:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

На хості Gateway схваліть node і перевірте команди:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node має бути підключений і перелічувати `googlemeet.chrome` плюс `browser.proxy`.
Конфігурація Gateway має дозволяти ці команди node:

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
`gateway token mismatch`, перевстановіть або перезапустіть node з поточним токеном Gateway.
Для LAN Gateway це зазвичай означає:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Потім перезавантажте службу node і повторно виконайте:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Браузер відкривається, але агент не може приєднатися

Запустіть `googlemeet test-listen` для приєднань лише для спостереження або `googlemeet test-speech`
для realtime-приєднань, а потім перегляньте повернений стан Chrome. Якщо будь-яка перевірка
повідомляє `manualActionRequired: true`, покажіть оператору `manualActionMessage`
і припиніть повторні спроби, доки дію в браузері не буде завершено.

Типові ручні дії:

- Увійдіть у профіль Chrome.
- Допустіть гостя з облікового запису хоста Meet.
- Надайте Chrome дозволи на мікрофон/камеру, коли з’явиться нативний запит дозволу Chrome.
- Закрийте або виправте завислий діалог дозволів Meet.

Не повідомляйте "не виконано вхід" лише тому, що Meet показує "Do you want people to
hear you in the meeting?" Це проміжний екран вибору аудіо Meet; OpenClaw
натискає **Use microphone** через автоматизацію браузера, коли це доступно, і продовжує
очікувати на справжній стан зустрічі. Для резервного створення лише через браузер OpenClaw
може натиснути **Continue without microphone**, оскільки створення URL не потребує
realtime-аудіошляху.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує endpoint `spaces.create` API Google Meet,
коли облікові дані OAuth налаштовано. Без облікових даних OAuth він переходить до
резервного браузера закріпленого Chrome node. Підтвердьте:

- Для створення через API: налаштовано `oauth.clientId` і `oauth.refreshToken`,
  або наявні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було випущено після додавання підтримки створення.
  Старішим токенам може бракувати scope `meetings.space.created`; повторно виконайте
  `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для резервного браузера: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений node із `browser.proxy` і
  `googlemeet.chrome`.
- Для резервного браузера: профіль Chrome OpenClaw на цьому node увійшов
  у Google і може відкрити `https://meet.google.com/new`.
- Для резервного браузера: повторні спроби повторно використовують наявну вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google перед відкриттям нової вкладки. Якщо в агента стається тайм-аут,
  повторіть виклик інструмента, а не відкривайте іншу вкладку Meet вручну.
- Для резервного браузера: якщо інструмент повертає `manualActionRequired: true`, використайте
  повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і
  `manualActionMessage`, щоб скерувати оператора. Не повторюйте спроби в циклі, доки цю
  дію не буде завершено.
- Для резервного браузера: якщо Meet показує "Do you want people to hear you in the
  meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для
  резервного створення лише через браузер, **Continue without microphone** через автоматизацію браузера
  і продовжити чекати на згенерований URL Meet. Якщо це не вдається, у
  помилці має згадуватися `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте realtime-шлях:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "agent"` для нормального шляху STT -> агент OpenClaw -> TTS-зворотне мовлення,
або `mode: "bidi"` для прямого резервного realtime-голосу. `mode: "transcribe"`
навмисно не запускає міст зворотного мовлення. Для налагодження лише спостереження
виконайте `openclaw googlemeet status --json <session-id>` після того, як учасники заговорять,
і перевірте `captioning`, `transcriptLines` і `lastCaptionText`. Якщо `inCall` має
значення true, але `transcriptLines` залишається `0`, субтитри Meet можуть бути вимкнені, ніхто
не говорив після встановлення спостерігача, інтерфейс Meet змінився або live-субтитри
недоступні для мови/облікового запису зустрічі.

`googlemeet test-speech` завжди перевіряє realtime-шлях і повідомляє, чи
байти виводу моста було помічено для цього виклику. Якщо `speechOutputVerified` має значення false, а
`speechOutputTimedOut` має значення true, realtime-провайдер міг прийняти
висловлювання, але OpenClaw не побачив, щоб нові байти виводу дійшли до аудіомоста
Chrome.

Також перевірте:

- На хості Gateway доступний ключ realtime-провайдера, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `sox` існує на хості Chrome.
- Мікрофон і динамік Meet спрямовано через віртуальний аудіошлях, який використовує
  OpenClaw. `doctor` має показати `meet output routed: yes` для локальних realtime-приєднань Chrome.

`googlemeet doctor [session-id]` друкує сеанс, node, стан у виклику,
причину ручної дії, підключення realtime-провайдера, `realtimeReady`, активність
аудіовходу/аудіовиходу, останні аудіомітки часу, лічильники байтів і URL браузера.
Використовуйте `googlemeet status [session-id] --json`, коли потрібен сирий JSON. Використовуйте
`googlemeet doctor --oauth`, коли потрібно перевірити оновлення OAuth Google Meet
без розкриття токенів; додайте `--meeting` або `--create-space`, коли також потрібне
підтвердження API Google Meet.

Якщо в агента стався тайм-аут і ви бачите вже відкриту вкладку Meet, огляньте цю вкладку
без відкриття іншої:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує й оглядає
наявну вкладку Meet для вибраного транспорту. З `chrome` вона використовує локальне
керування браузером через Gateway; з `chrome-node` вона використовує налаштований
Chrome node. Вона не відкриває нову вкладку й не створює новий сеанс; вона повідомляє
поточний блокер, наприклад вхід, допуск, дозволи або стан вибору аудіо.
Команда CLI звертається до налаштованого Gateway, тому Gateway має бути запущений;
`chrome-node` також потребує підключеного Chrome node.

### Не проходять перевірки налаштування Twilio

`twilio-voice-call-plugin` не проходить, коли `voice-call` не дозволено або не ввімкнено.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` не проходить, коли backend Twilio не має account
SID, auth token або caller number. Встановіть їх на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` не проходить, коли `voice-call` не має публічного
доступу Webhook або коли `publicUrl` вказує на loopback чи простір приватної мережі.
Встановіть `plugins.entries.voice-call.config.publicUrl` на публічний URL провайдера або
налаштуйте tunnel/Tailscale-доступ для `voice-call`.

Loopback і приватні URL не є дійсними для callback від операторів. Не використовуйте
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

Для локальної розробки використовуйте tunnel або Tailscale-доступ замість URL приватного
хоста:

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

`voicecall smoke` типово лише перевіряє готовність. Щоб виконати пробний запуск для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли навмисно хочете здійснити справжній вихідний
сповіщувальний виклик:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Виклик Twilio починається, але ніколи не входить у зустріч

Переконайтеся, що подія Meet надає подробиці телефонного підключення. Передайте точний номер для набору та PIN або власну послідовність DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкові `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза перед введенням PIN.

Якщо телефонний виклик створено, але список учасників Meet ніколи не показує учасника з телефонним підключенням:

- Запустіть `openclaw googlemeet doctor <session-id>`, щоб підтвердити делегований Twilio ID виклику, чи було поставлено DTMF у чергу та чи було запитано вступне привітання.
- Запустіть `openclaw voicecall status --call-id <id>` і підтвердьте, що виклик досі активний.
- Запустіть `openclaw voicecall tail` і перевірте, що webhooks Twilio надходять до Gateway.
- Запустіть `openclaw logs --follow` і знайдіть послідовність Twilio Meet: Google Meet делегує приєднання, Voice Call запускає телефонну ділянку, Google Meet чекає `voiceCall.dtmfDelayMs`, надсилає DTMF через `voicecall.dtmf`, чекає `voiceCall.postDtmfSpeechDelayMs`, а потім запитує вступне мовлення через `voicecall.speak`.
- Повторно запустіть `openclaw googlemeet setup --transport twilio`; успішна перевірка налаштування обов’язкова, але вона не доводить, що послідовність PIN для зустрічі правильна.
- Переконайтеся, що номер для телефонного підключення належить до того самого запрошення Meet і регіону, що й PIN.
- Збільште `voiceCall.dtmfDelayMs`, якщо Meet відповідає повільно або транскрипт виклику досі показує запит на введення PIN після надсилання DTMF.
- Якщо учасник приєднується, але ви не чуєте привітання, перевірте `openclaw logs --follow` на наявність post-DTMF запиту `voicecall.speak` і відтворення TTS через медіапотік або резервний варіант Twilio `<Say>`. Якщо транскрипт виклику досі містить "enter the meeting PIN", телефонна ділянка ще не приєдналася до кімнати Meet, тож учасники зустрічі не почують мовлення.

Якщо webhooks не надходять, спочатку налагодьте Plugin Voice Call: провайдер має дістатися до `plugins.entries.voice-call.config.publicUrl` або налаштованого тунелю. Див. [усунення несправностей Voice call](/uk/plugins/voice-call#troubleshooting).

## Примітки

Офіційний медіа API Google Meet орієнтований на приймання, тож для мовлення в виклик Meet усе одно потрібен шлях учасника. Цей Plugin робить цю межу видимою: Chrome обробляє участь через браузер і локальну маршрутизацію аудіо; Twilio обробляє участь через телефонне підключення.

Режими talk-back у Chrome потребують `BlackHole 2ch` плюс один із варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує мостом і передає аудіо у форматі `chrome.audioFormat` між цими командами та вибраним провайдером. Режим агента використовує транскрипцію в реальному часі плюс звичайний TTS; режим bidi використовує голосового провайдера реального часу. Стандартний шлях Chrome — 24 kHz PCM16 з `chrome.audioBufferBytes: 4096`; 8 kHz G.711 mu-law залишається доступним для застарілих пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда мосту керує всім локальним аудіошляхом і має завершитися після запуску або перевірки свого демона. Це припустимо лише для `bidi`, оскільки режим `agent` потребує прямого доступу до пари команд для TTS.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний пристрій BlackHole може повертати звук інших учасників назад у виклик.

З Chrome-мостом на парі команд `chrome.bargeInInputCommand` може слухати окремий локальний мікрофон і очищати відтворення асистента, коли людина починає говорити. Це зберігає людське мовлення попереду виводу асистента, навіть коли спільний вхід BlackHole loopback тимчасово приглушено під час відтворення асистента. Як і `chrome.audioInputCommand` та `chrome.audioOutputCommand`, це налаштована оператором локальна команда. Використовуйте явний довірений шлях команди або список аргументів і не спрямовуйте її на скрипти з недовірених розташувань.

`googlemeet speak` запускає активний talk-back аудіоміст для сесії Chrome. `googlemeet leave` зупиняє цей міст. Для сесій Twilio, делегованих через Plugin Voice Call, `leave` також завершує базовий голосовий виклик. Використовуйте `googlemeet end-active-conference`, коли також потрібно закрити активну конференцію Google Meet для простору, керованого API.

## Пов’язане

- [Plugin Voice call](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення plugins](/uk/plugins/building-plugins)
