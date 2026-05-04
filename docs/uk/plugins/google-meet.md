---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви хочете, щоб агент OpenClaw створив нову зустріч Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio з типовими параметрами голосу в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-04T00:29:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7635306e880d37f6f86afc0732322167ff785105201b5dd38658215b5439e6b0
    source_path: plugins/google-meet.md
    workflow: 16
---

Підтримка учасника Google Meet для OpenClaw — Plugin навмисно працює явно:

- Він приєднується лише до явної URL-адреси `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися до
  повернутої URL-адреси.
- `realtime` voice є режимом за замовчуванням.
- Realtime voice може звертатися назад до повного агента OpenClaw, коли потрібні глибше
  міркування або інструменти.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `realtime` для живого
  прослуховування/відповіді голосом або `transcribe`, щоб приєднатися й керувати браузером без
  realtime voice bridge.
- Автентифікація починається як особистий Google OAuth або вже авторизований профіль Chrome.
- Автоматичного оголошення про згоду немає.
- Стандартний аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на спареному вузловому хості.
- Twilio приймає номер для дозвону плюс необов’язковий PIN або DTMF-послідовність; він
  не може напряму набирати URL Meet.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших агентських
  телеконференційних робочих процесів.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте бекенд realtime voice
провайдера. OpenAI використовується за замовчуванням; Google Gemini Live також працює з
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` встановлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор Homebrew
потребує перезавантаження, перш ніж macOS покаже пристрій:

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

Вивід налаштування призначений бути читабельним для агентів і враховувати режим. Він повідомляє про профіль Chrome
, прив’язку до вузла, а для realtime-приєднань через Chrome — про аудіоміст
BlackHole/SoX і перевірки відкладеного realtime-вступу. Для приєднань лише для спостереження перевірте той самий
транспорт за допомогою `--mode transcribe`; цей режим пропускає передумови realtime-аудіо,
оскільки він не слухає через міст і не говорить через нього:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Коли налаштовано делегування Twilio, налаштування також повідомляє, чи готові
Plugin `voice-call`, облікові дані Twilio та публічна доступність Webhook.
Сприймайте будь-яку перевірку `ok: false` як блокер для перевіреного транспорту та режиму
перед тим, як просити агента приєднатися. Використовуйте `openclaw googlemeet setup --json` для
скриптів або машинозчитуваного виводу. Використовуйте `--transport chrome`,
`--transport chrome-node` або `--transport twilio`, щоб попередньо перевірити конкретний
транспорт до того, як агент спробує його використати.

Для Twilio завжди явно попередньо перевіряйте транспорт, коли типовий транспорт
— Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Це виявить відсутнє підключення `voice-call`, облікові дані Twilio або недоступну
експозицію Webhook до того, як агент спробує набрати зустріч.

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

Агентський інструмент `google_meet` залишається доступним на хостах не-macOS для
артефактів, календаря, налаштування, транскрибування, Twilio та потоків `chrome-node`. Локальні
realtime-дії Chrome там заблоковані, бо вбудований realtime-аудіошлях Chrome
зараз залежить від macOS `BlackHole 2ch`. На Linux використовуйте
`mode: "transcribe"`, дозвін Twilio або macOS-хост `chrome-node` для realtime
участі через Chrome.

Створіть нову зустріч і приєднайтеся до неї:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Для кімнат, створених API, використовуйте Google Meet `SpaceConfig.accessType`, коли хочете,
щоб політика кімнати щодо входу без стуку була явною, а не успадкованою з типових налаштувань
облікового запису Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` дозволяє будь-кому з URL Meet приєднатися без стуку. `TRUSTED` дозволяє
довіреним користувачам організації хоста, запрошеним зовнішнім користувачам і користувачам дозвону
приєднуватися без стуку. `RESTRICTED` обмежує вхід без стуку лише запрошеними. Ці
налаштування застосовуються лише до офіційного шляху створення через Google Meet API, тому OAuth
облікові дані мають бути налаштовані.

Якщо ви автентифікували Google Meet до появи цієї опції, повторно запустіть
`openclaw googlemeet auth login --json` після додавання scope
`meetings.space.settings` на екрані згоди Google OAuth.

Створіть лише URL без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано OAuth-облікові дані Google Meet. Це
  найбільш детермінований шлях, який не залежить від стану інтерфейсу браузера.
- Резервний браузерний шлях: використовується, коли OAuth-облікові дані відсутні. OpenClaw використовує
  закріплений вузол Chrome, відкриває `https://meet.google.com/new`, чекає, доки Google
  перенаправить на справжню URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Цей шлях вимагає,
  щоб профіль OpenClaw Chrome на вузлі вже був авторизований у Google.
  Браузерна автоматизація обробляє власну першу підказку Meet щодо мікрофона; ця підказка
  не вважається помилкою входу Google.
  Потоки приєднання та створення також намагаються повторно використати наявну вкладку Meet перед відкриттям
  нової. Зіставлення ігнорує безпечні рядки запиту URL, такі як `authuser`, тому
  повторна спроба агента має сфокусувати вже відкриту зустріч замість створення другої
  вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` за замовчуванням приєднується до нової зустрічі та
повертає `joined: true` плюс сеанс приєднання. Щоб лише створити URL,
використовуйте `create --no-join` у CLI або передайте `"join": false` в інструмент.

Або скажіть агенту: "Створи Google Meet, приєднайся до нього з realtime voice і надішли
мені посилання." Агент має викликати `google_meet` з `action: "create"`, а
потім поділитися повернутим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Для приєднання лише для спостереження/керування браузером задайте `"mode": "transcribe"`. Це
не запускає двобічний realtime voice bridge, не потребує BlackHole або SoX
і не відповідатиме голосом у зустрічі. Приєднання Chrome у цьому режимі також уникають
надання OpenClaw дозволу на мікрофон/камеру та обходять шлях Meet **Використовувати
мікрофон**. Якщо Meet показує проміжний екран вибору аудіо, автоматизація намагається
використати шлях без мікрофона, а в іншому разі повідомляє про ручну дію замість відкриття
локального мікрофона. У режимі transcribe керовані транспорти Chrome також установлюють
best-effort спостерігач субтитрів Meet. `googlemeet status --json` і
`googlemeet doctor` показують `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`
і короткий хвіст `recentTranscript`, щоб оператори могли зрозуміти, чи браузер
приєднався до дзвінка і чи субтитри Meet створюють текст.
Використовуйте `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, коли
потрібна перевірка так/ні: вона приєднується в режимі transcribe, чекає свіжого руху субтитрів або
транскрипту та повертає `listenVerified`, `listenTimedOut`, поля ручних
дій і останній стан субтитрів.

Під час realtime-сеансів статус `google_meet` містить стан браузера й аудіомоста,
як-от `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, останні часові мітки вводу/виводу,
лічильники байтів і стан закриття моста. Якщо з’являється безпечна підказка сторінки Meet,
браузерна автоматизація обробляє її, коли може. Вхід, допуск хостом і
підказки дозволів браузера/ОС повідомляються як ручна дія з причиною та
повідомленням, яке агент може передати. Керовані сеанси Chrome видають вступ або
тестову фразу лише після того, як стан браузера повідомить `inCall: true`; інакше статус повідомляє
`speechReady: false`, а спроба мовлення блокується замість того, щоб удавати, ніби
агент говорив у зустрічі.

Локальні приєднання Chrome використовують авторизований профіль браузера OpenClaw. Realtime-режим
потребує `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для
чистого двобічного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного
пристрою BlackHole достатньо для першого smoke test, але він може давати відлуння.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM
лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть
вузловий хост у VM. Один раз увімкніть вбудований Plugin у VM, щоб вузол
оголошував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, realtime
  провайдер і конфігурація Plugin Google Meet.
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

Якщо `<gateway-host>` — це LAN IP і ви не використовуєте TLS, вузол відмовиться від
plaintext WebSocket, якщо ви явно не дозволите його для цієї довіреної приватної мережі:

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

Під час realtime-приєднання автоматизація браузера OpenClaw заповнює ім’я гостя, натискає Join/Ask to join і приймає початковий вибір Meet "Use microphone", коли з’являється цей запит. Під час приєднання лише для спостереження або створення зустрічі лише через браузер вона проходить той самий запит без мікрофона, коли такий вибір доступний. Якщо профіль браузера не ввійшов в обліковий запис, Meet очікує допуску від організатора, Chrome потребує дозволу на мікрофон/камеру для realtime-приєднання або Meet застряг на запиті, який автоматизація не змогла розв’язати, результат join/test-speech повідомляє `manualActionRequired: true` з `manualActionReason` і `manualActionMessage`. Агенти мають припинити повторювати приєднання, повідомити саме це повідомлення разом із поточними `browserUrl`/`browserTitle` і повторити спробу лише після завершення ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає лише тоді, коли рівно один підключений Node оголошує і `googlemeet.chrome`, і керування браузером. Якщо підключено кілька придатних Node, задайте `chromeNode.node` як ідентифікатор Node, відображуване ім’я або віддалену IP-адресу.

Типові перевірки збоїв:

- `Configured Google Meet node ... is not usable: offline`: закріплений Node відомий Gateway, але недоступний. Агенти мають розглядати цей Node як діагностичний стан, а не як придатний хост Chrome, і повідомляти про блокер налаштування замість переходу на інший транспорт, якщо користувач не попросив про це.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM, схваліть спарювання і переконайтеся, що `openclaw plugins enable google-meet` та `openclaw plugins enable browser` були виконані у VM. Також підтвердьте, що хост Gateway дозволяє обидві команди Node через `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: установіть `blackhole-2ch` на хості, який перевіряється, і перезавантажте його перед використанням локального аудіо Chrome.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch` у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або залиште `chrome.guestName` заданим для гостьового приєднання. Автоматичне гостьове приєднання використовує автоматизацію браузера OpenClaw через проксі браузера Node; переконайтеся, що конфігурація браузера Node вказує на потрібний профіль, наприклад `browser.defaultProfile: "user"` або іменований профіль існуючого сеансу.
- Дублікати вкладок Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw активує наявну вкладку для тієї самої URL-адреси Meet перед відкриттям нової, а створення зустрічі в браузері повторно використовує незавершену вкладку `https://meet.google.com/new` або вкладку запиту облікового запису Google перед відкриттям іншої.
- Немає аудіо: у Meet спрямуйте мікрофон/динамік через шлях віртуального аудіопристрою, який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію у стилі Loopback для чистого дуплексного аудіо.

## Нотатки щодо встановлення

Realtime-типовий режим Chrome використовує два зовнішні інструменти:

- `sox`: аудіоутиліта командного рядка. Плагін використовує явні команди пристроїв CoreAudio для стандартного аудіомоста 24 kHz PCM16.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`, через який Chrome/Meet може виконувати маршрутизацію.

OpenClaw не вбудовує й не розповсюджує жоден із цих пакетів. Документація просить користувачів установити їх як залежності хоста через Homebrew. SoX ліцензовано як `LGPL-2.0-only AND GPL-2.0-only`; BlackHole має ліцензію GPL-3.0. Якщо ви створюєте інсталятор або appliance, який комплектує BlackHole разом з OpenClaw, перегляньте умови ліцензування upstream BlackHole або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet через керування браузером OpenClaw і приєднується як профіль браузера OpenClaw, що ввійшов в обліковий запис. На macOS плагін перевіряє наявність `BlackHole 2ch` перед запуском. Якщо налаштовано, він також запускає команду перевірки стану аудіомоста і стартову команду перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють на спареному Node, наприклад Parallels macOS VM. Для локального Chrome виберіть профіль через `browser.defaultProfile`; `chrome.browserProfile` передається хостам `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона і динаміка Chrome через локальний аудіоміст OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план набору, делегований плагіну Voice Call. Він не розбирає сторінки Meet для пошуку телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або потрібен запасний варіант телефонного дозвону. Google Meet має надати телефонний номер дозвону і PIN для зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

Увімкніть плагін Voice Call на хості Gateway, а не на Node Chrome:

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

Надайте облікові дані Twilio через середовище або конфігурацію. Середовище не допускає потрапляння секретів у `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни конфігурації плагіна не з’являються в уже запущеному процесі Gateway, доки він не перезавантажиться.

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

OAuth необов’язковий для створення посилання Meet, оскільки `googlemeet create` може повернутися до автоматизації браузера. Налаштуйте OAuth, коли потрібне офіційне створення через API, розв’язання простору або preflight-перевірки Meet Media API.

Доступ до Google Meet API використовує OAuth користувача: створіть OAuth-клієнт Google Cloud, запросіть потрібні scopes, авторизуйте обліковий запис Google, а потім збережіть отриманий refresh token у конфігурації плагіна Google Meet або надайте змінні середовища `OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання Chrome. Транспорти Chrome і Chrome-node все одно приєднуються через профіль Chrome, що ввійшов в обліковий запис, BlackHole/SoX і підключений Node, коли ви використовуєте участь через браузер. OAuth призначений лише для офіційного шляху Google Meet API: створення просторів зустрічей, розв’язання просторів і виконання preflight-перевірок Meet Media API.

### Створення облікових даних Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** найпростіший для організації Google Workspace.
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

`meetings.space.created` потрібен Google Meet `spaces.create`.
`meetings.space.readonly` дає OpenClaw змогу розв’язувати URL-адреси/коди Meet у простори.
`meetings.space.settings` дає OpenClaw змогу передавати налаштування `SpaceConfig`, такі як `accessType`, під час створення кімнати через API.
`meetings.conference.media.readonly` призначений для preflight Meet Media API і роботи з медіа; Google може вимагати реєстрації в Developer Preview для фактичного використання Media API.
Якщо вам потрібні лише приєднання Chrome на основі браузера, повністю пропустіть OAuth.

### Отримання refresh token

Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, або передайте їх як змінні середовища, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда друкує конфігураційний блок `oauth` із refresh token. Вона використовує PKCE, localhost callback на `http://localhost:8085/oauth2callback` і ручний потік копіювання/вставлення з `--manual`.

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

Збережіть об’єкт `oauth` у конфігурації плагіна Google Meet:

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

Надавайте перевагу змінним середовища, коли не хочете зберігати refresh token у конфігурації. Якщо присутні і конфігураційні, і середовищні значення, плагін спочатку розв’язує конфігурацію, а потім використовує середовище як fallback.

Згода OAuth включає створення просторів Meet, доступ на читання просторів Meet і доступ на читання медіа конференцій Meet. Якщо ви автентифікувалися до появи підтримки створення зустрічей, повторно виконайте `openclaw googlemeet auth login --json`, щоб refresh token мав scope `meetings.space.created`.

### Перевірка OAuth через doctor

Запустіть OAuth doctor, коли потрібна швидка перевірка стану без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує runtime Chrome і не потребує підключеного Node Chrome. Воно перевіряє, що конфігурація OAuth існує і що refresh token може видати access token. JSON-звіт містить лише поля стану, такі як `ok`, `configured`, `tokenSource`, `expiresAt`, і повідомлення перевірок; він не друкує access token, refresh token або client secret.

Типові результати:

| Перевірка            | Значення                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Наявні `oauth.clientId` плюс `oauth.refreshToken` або кешований access token.           |
| `oauth-token`        | Кешований access token усе ще чинний або refresh token видав новий access token.        |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` розв’язала наявний простір Meet.                    |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий простір Meet.                   |

Щоб також підтвердити ввімкнення Google Meet API і scope `spaces.create`, виконайте перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює одноразову URL-адресу Meet. Використовуйте це, коли потрібно підтвердити,
що в проєкті Google Cloud увімкнено Meet API і що авторизований
обліковий запис має область `meetings.space.created`.

Щоб підтвердити доступ на читання для наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` підтверджують доступ на читання до наявного
простору, до якого авторизований обліковий запис Google має доступ. `403` від цих перевірок
зазвичай означає, що Google Meet REST API вимкнено, погоджений refresh token
не має потрібної області або обліковий запис Google не може отримати доступ до цього простору
Meet. Помилка refresh-token означає, що потрібно повторно виконати `openclaw googlemeet auth login
--json` і зберегти новий блок `oauth`.

Для резервного браузерного режиму облікові дані OAuth не потрібні. У цьому режимі автентифікація Google
береться з профілю Chrome, у який виконано вхід на вибраному вузлі, а не з
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

З `--meeting`, `artifacts` і `attendance` типово використовують найновіший запис конференції.
Передайте `--all-conference-records`, якщо потрібні всі збережені записи
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
посиланням Google Meet. Використовуйте `--event <query>` для пошуку відповідного тексту події, і
`--calendar <id>` для неосновного календаря. Пошук у календарі потребує свіжого
входу OAuth, який включає область readonly для подій Calendar.
`calendar-events` попередньо показує відповідні події Meet і позначає подію, яку
виберуть `latest`, `artifacts`, `attendance` або `export`.

Якщо ви вже знаєте id запису конференції, звертайтеся до нього напряму:

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
`meetings.space.created` для простору, яким авторизований обліковий запис може керувати.
OpenClaw приймає на вході Meet URL, код зустрічі або `spaces/{id}` і перетворює його
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
стенограм, структурованих записів стенограми та розумних нотаток, коли
Google надає їх для зустрічі. Використовуйте `--no-transcript-entries`, щоб пропустити
пошук записів для великих зустрічей. `attendance` розгортає учасників у
рядки сеансів учасників із часом першої/останньої появи, загальною тривалістю сеансу,
прапорцями запізнення/раннього виходу та дубльованими ресурсами учасників, об’єднаними за користувачем,
що ввійшов у систему, або відображуваним іменем. Передайте `--no-merge-duplicates`, щоб тримати необроблені ресурси учасників
окремо, `--late-after-minutes`, щоб налаштувати визначення запізнення, і
`--early-before-minutes`, щоб налаштувати визначення раннього виходу.

`export` записує папку, що містить `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`.
`manifest.json` записує вибраний вхід, параметри експорту, записи конференції,
вихідні файли, лічильники, джерело токена, подію Calendar, якщо вона використовувалася, і будь-які
попередження про часткове отримання. Передайте `--zip`, щоб також записати переносний архів поруч
із папкою. Передайте `--include-doc-bodies`, щоб експортувати текст пов’язаних стенограм і
розумних нотаток Google Docs через Google Drive `files.export`; для цього потрібен
свіжий вхід OAuth, який включає область Drive Meet readonly. Без
`--include-doc-bodies` експорти включають лише метадані Meet і структуровані записи стенограми.
Якщо Google повертає часткову помилку артефакта, як-от помилку списку розумних нотаток,
запису стенограми або тіла документа Drive, підсумок і
маніфест зберігають попередження замість провалу всього експорту.
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

Задайте `"dryRun": true`, щоб повернути лише маніфест експорту й пропустити записи файлів.

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

Запустіть live браузерну перевірку з пріоритетом прослуховування для зустрічі, де хтось
говоритиме, а субтитри Meet будуть доступні:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Середовище live smoke:

- `OPENCLAW_LIVE_TEST=1` вмикає захищені live тести.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` вказує на збережений Meet URL, код або
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

Створіть свіжий простір Meet:

```bash
openclaw googlemeet create
```

Команда друкує новий `meeting uri`, джерело та сеанс приєднання. З обліковими даними OAuth
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

Якщо резервний браузерний режим натрапляє на вхід у Google або блокування дозволів Meet до того, як
зможе створити URL, метод Gateway повертає невдалу відповідь, а
інструмент `google_meet` повертає структуровані подробиці замість простого рядка:

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
вкладки Meet, доки оператор не завершить браузерний крок.

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

Створення Meet типово приєднується до зустрічі. Транспорт Chrome або Chrome-node все ще
потребує профілю Google Chrome, у який виконано вхід, щоб приєднатися через браузер. Якщо
з профілю виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або
помилку резервного браузерного режиму й просить оператора завершити вхід у Google перед
повторною спробою.

Задавайте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш проєкт Cloud,
принципал OAuth і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Загальний шлях Chrome realtime потребує лише увімкненого Plugin, BlackHole, SoX
і ключа бекенд-постачальника realtime voice. OpenAI є типовим; задайте
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
- `chromeNode.node`: необов'язковий ідентифікатор/назва/IP вузла для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім'я, що використовується на екрані гостя Meet без входу в обліковий запис
- `chrome.autoJoin: true`: найкраща спроба заповнити ім'я гостя й натиснути Join Now через браузерну автоматизацію OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість відкривання дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить про стан у дзвінку, перш ніж буде запущено realtime-вступ
- `chrome.audioFormat: "pcm16-24khz"`: аудіоформат пари команд. Використовуйте `"g711-ulaw-8khz"` лише для застарілих/користувацьких пар команд, які досі видають телефонний аудіосигнал.
- `chrome.audioInputCommand`: команда SoX, що читає з CoreAudio `BlackHole 2ch` і записує аудіо у форматі `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX, що читає аудіо у форматі `chrome.audioFormat` і записує в CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: необов'язкова команда локального мікрофона, що записує знаковий 16-бітний little-endian моно PCM для виявлення людського втручання, поки відтворення асистента активне. Наразі це застосовується до розміщеного на Gateway мосту пари команд `chrome`.
- `chrome.bargeInRmsThreshold: 650`: рівень RMS, що вважається людським перериванням на `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: піковий рівень, що вважається людським перериванням на `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: мінімальна затримка між повторними очищеннями людського переривання
- `realtime.strategy: "agent"`: типово. Мовлення учасника транскрибується, надсилається налаштованому агенту OpenClaw в окремій sub-agent-сесії для зустрічі, а отримана відповідь озвучується через realtime-провайдера.
- `realtime.strategy: "bidi"`: прямий двонапрямний режим realtime-моделі. Realtime-провайдер відповідає на мовлення учасника напряму й може викликати `openclaw_agent_consult` для глибших відповідей або відповідей із використанням інструментів.
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли realtime-міст підключається; встановіть `""`, щоб приєднатися мовчки
- `realtime.agentId`: необов'язковий ідентифікатор агента OpenClaw для `openclaw_agent_consult`; типово `main`

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

`voiceCall.enabled` типово має значення `true`; з транспортом Twilio він делегує фактичний PSTN-дзвінок, DTMF і вступне привітання Plugin Voice Call. Voice Call відтворює DTMF-послідовність перед відкриттям realtime-медіапотоку, а потім використовує збережений вступний текст як початкове realtime-привітання. Якщо `voice-call` не ввімкнено, Google Meet усе ще може перевірити й записати план набору, але не може здійснити Twilio-дзвінок.

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

Використовуйте `transport: "chrome"`, коли Chrome працює на хості Gateway. Використовуйте `transport: "chrome-node"`, коли Chrome працює на спареному вузлі, наприклад VM Parallels. В обох випадках realtime-модель і `openclaw_agent_consult` працюють на хості Gateway, тому облікові дані моделі залишаються там. З типовою стратегією `realtime.strategy: "agent"` realtime-провайдер обробляє аудіо й транскрипцію, а налаштований агент OpenClaw створює усну відповідь. З `realtime.strategy: "bidi"` realtime-модель відповідає напряму.

Використовуйте `action: "status"`, щоб перелічити активні сесії або переглянути ідентифікатор сесії. Використовуйте `action: "speak"` із `sessionId` і `message`, щоб realtime-агент заговорив негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сесію, запустити відому фразу й повернути стан `inCall`, коли хост Chrome може про нього повідомити. `test_speech` завжди примусово встановлює `mode: "realtime"` і завершується помилкою, якщо його просять працювати в `mode: "transcribe"`, бо сесії лише для спостереження навмисно не можуть видавати мовлення. Його результат `speechOutputVerified` базується на збільшенні байтів realtime-аудіовиходу під час цього тестового виклику, тому повторно використана сесія зі старішим аудіо не зараховується як свіжа успішна перевірка мовлення. Використовуйте `action: "leave"`, щоб позначити сесію завершеною.

`status` містить стан Chrome, коли він доступний:

- `inCall`: Chrome, схоже, перебуває всередині дзвінка Meet
- `micMuted`: найкраща спроба визначити стан мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профіль браузера потребує ручного входу, допуску хостом Meet, дозволів або відновлення керування браузером, перш ніж мовлення зможе працювати
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: чи дозволене зараз кероване Chrome мовлення. `speechReady: false` означає, що OpenClaw не надіслав вступну/тестову фразу в аудіоміст.
- `providerConnected` / `realtimeReady`: стан realtime-голосового мосту
- `lastInputAt` / `lastOutputAt`: останнє аудіо, отримане з мосту або надіслане до нього
- `audioOutputRouted` / `audioOutputDeviceLabel`: чи медіавихід вкладки Meet було активно спрямовано на пристрій BlackHole, який використовує міст
- `lastSuppressedInputAt` / `suppressedInputBytes`: loopback-вхід, проігнорований, поки відтворення асистента активне

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime-консультація агента

Realtime-режим Chrome оптимізований для живого голосового циклу. Realtime-голосовий провайдер чує аудіо зустрічі й говорить через налаштований аудіоміст. Типова стратегія `realtime.strategy: "agent"` використовує realtime-провайдера для аудіовводу/виводу й транскрипції, але спрямовує фінальні транскрипти учасників через налаштованого агента OpenClaw перед озвученням. Встановіть `realtime.strategy: "bidi"`, коли потрібно, щоб realtime-модель відповідала напряму.
Близькі фінальні фрагменти транскрипту об'єднуються перед консультацією, щоб один усний хід не створював кілька застарілих часткових відповідей.

| Стратегія | Хто визначає відповідь        | Поведінка контексту                                                                     | Коли використовувати                                              |
| -------- | ----------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `agent`  | Налаштований агент OpenClaw | Окрема sub-agent-сесія для зустрічі плюс звичайна політика агента, інструменти, workspace і memory | Потрібна поведінка «мій агент присутній на зустрічі»        |
| `bidi`   | Realtime-голосова модель      | Контекст realtime-сесії з необов'язковими викликами `openclaw_agent_consult`               | Потрібен голосовий цикл розмови з найменшою затримкою |

У стратегії `bidi`, коли realtime-моделі потрібне глибше міркування, актуальна інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw у фоновому режимі з контекстом останніх транскриптів зустрічі та повертає стислу усну відповідь у realtime-голосову сесію. Потім голосова модель може озвучити цю відповідь назад у зустріч. Він використовує той самий спільний realtime-інструмент консультації, що й Voice Call.

Типово консультації виконуються для агента `main`. Встановіть `realtime.agentId`, коли канал Meet має консультуватися з виділеним workspace агента OpenClaw, типовими налаштуваннями моделі, політикою інструментів, memory та історією сесії.

Консультації зі стратегії агента використовують ключ сеансу `agent:<id>:subagent:google-meet:<session>` для кожної зустрічі, щоб подальші запитання зберігали контекст зустрічі й водночас успадковували звичайну політику агента від налаштованого агента.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: показувати інструмент консультації та обмежити звичайного агента до
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: показувати інструмент консультації та дозволити звичайному агенту використовувати звичайну політику інструментів агента.
- `none`: не показувати інструмент консультації голосовій моделі реального часу.

Ключ сеансу консультації обмежений окремим сеансом Meet, тому подальші виклики консультації можуть повторно використовувати попередній контекст консультації під час тієї самої зустрічі.

Щоб примусово виконати голосову перевірку готовності після того, як Chrome повністю приєднався до виклику:

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
- `googlemeet setup` включає `chrome-node-connected`, коли Chrome-node є
  транспортом за замовчуванням або Node закріплено.
- `nodes status` показує, що вибраний Node підключено.
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

Це доводить, що Plugin Gateway завантажено, Node VM підключено з
поточним токеном, а аудіоміст Meet доступний до того, як агент відкриє
справжню вкладку зустрічі.

Для Twilio smoke використовуйте зустріч, яка надає дані телефонного дозвону:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Очікуваний стан Twilio:

- `googlemeet setup` включає зелені перевірки `twilio-voice-call-plugin`,
  `twilio-voice-call-credentials` і `twilio-voice-call-webhook`.
- `voicecall` доступний у CLI після перезавантаження Gateway.
- Повернута сесія має `transport: "twilio"` і `twilio.voiceCallId`.
- `openclaw logs --follow` показує, що DTMF TwiML віддано перед TwiML реального
  часу, а потім міст реального часу з початковим привітанням у черзі.
- `googlemeet leave <sessionId>` завершує делегований голосовий виклик.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Переконайтеся, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно відредагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway.
Запущений агент бачить лише інструменти плагінів, зареєстровані поточним процесом Gateway.

На хостах Gateway, що не є macOS, інструмент `google_meet`, видимий агенту, залишається видимим, але локальні realtime-дії Chrome блокуються до того, як вони потрапляють до аудіомоста.
Локальний realtime-аудіо Chrome зараз залежить від macOS `BlackHole 2ch`, тому агенти Linux мають використовувати `mode: "transcribe"`, Twilio dial-in або macOS-хост `chrome-node` замість стандартного локального realtime-шляху Chrome.

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

Вузол має бути підключений і перелічувати `googlemeet.chrome` плюс `browser.proxy`.
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

Якщо `googlemeet setup` не проходить перевірку `chrome-node-connected` або журнал Gateway повідомляє `gateway token mismatch`, перевстановіть або перезапустіть вузол із поточним токеном Gateway.
Для LAN Gateway це зазвичай означає:

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

Запустіть `googlemeet test-listen` для приєднань лише для спостереження або `googlemeet test-speech` для realtime-приєднань, а потім перевірте повернений стан Chrome. Якщо будь-яка перевірка повідомляє `manualActionRequired: true`, покажіть `manualActionMessage` оператору й припиніть повторні спроби, доки дія в браузері не буде завершена.

Поширені ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису хоста Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’явиться нативний запит дозволу Chrome.
- Закрити або виправити завислий діалог дозволів Meet.

Не повідомляйте "not signed in" лише тому, що Meet показує "Do you want people to hear you in the meeting?" Це проміжний екран вибору аудіо Meet; OpenClaw натискає **Use microphone** через автоматизацію браузера, коли це доступно, і продовжує чекати на реальний стан зустрічі. Для create-only резервного сценарію браузера OpenClaw може натиснути **Continue without microphone**, бо створення URL не потребує realtime-аудіошляху.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує endpoint `spaces.create` Google Meet API, коли налаштовані облікові дані OAuth. Без облікових даних OAuth він переходить до резервного pinned браузера Chrome node. Перевірте:

- Для створення через API: налаштовані `oauth.clientId` і `oauth.refreshToken` або наявні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було створено після додавання підтримки створення. У старіших токенів може бракувати scope `meetings.space.created`; повторно виконайте `openclaw googlemeet auth login --json` і оновіть конфігурацію плагіна.
- Для резервного браузерного сценарію: `defaultTransport: "chrome-node"` і `chromeNode.node` вказують на підключений вузол із `browser.proxy` і `googlemeet.chrome`.
- Для резервного браузерного сценарію: профіль Chrome OpenClaw на цьому вузлі виконано вхід у Google і може відкрити `https://meet.google.com/new`.
- Для резервного браузерного сценарію: повторні спроби повторно використовують наявну вкладку `https://meet.google.com/new` або вкладку запиту облікового запису Google перед відкриттям нової вкладки. Якщо в агента спливає час очікування, повторіть виклик інструмента замість того, щоб вручну відкривати ще одну вкладку Meet.
- Для резервного браузерного сценарію: якщо інструмент повертає `manualActionRequired: true`, використайте повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і `manualActionMessage`, щоб скерувати оператора. Не повторюйте спроби в циклі, доки ця дія не буде завершена.
- Для резервного браузерного сценарію: якщо Meet показує "Do you want people to hear you in the meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для create-only резервного сценарію, **Continue without microphone** через автоматизацію браузера й продовжити чекати на згенерований Meet URL. Якщо це неможливо, помилка має згадувати `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте realtime-шлях:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "realtime"` для прослуховування/відповіді голосом. `mode: "transcribe"` навмисно не запускає дуплексний realtime-голосовий міст. Для налагодження лише зі спостереженням виконайте `openclaw googlemeet status --json <session-id>` після того, як учасники заговорять, і перевірте `captioning`, `transcriptLines` і `lastCaptionText`. Якщо `inCall` дорівнює true, але `transcriptLines` залишається `0`, субтитри Meet можуть бути вимкнені, ніхто не говорив після встановлення спостерігача, інтерфейс Meet змінився або live captions недоступні для мови/облікового запису зустрічі.

`googlemeet test-speech` завжди перевіряє realtime-шлях і повідомляє, чи були помічені вихідні байти моста для цього виклику. Якщо `speechOutputVerified` дорівнює false, а `speechOutputTimedOut` дорівнює true, realtime-провайдер міг прийняти висловлювання, але OpenClaw не побачив, щоб нові вихідні байти дійшли до аудіомоста Chrome.

Також перевірте:

- На хості Gateway доступний ключ realtime-провайдера, наприклад `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `sox` існує на хості Chrome.
- Мікрофон і динамік Meet спрямовані через віртуальний аудіошлях, який використовує OpenClaw. `doctor` має показати `meet output routed: yes` для локальних realtime-приєднань Chrome.

`googlemeet doctor [session-id]` виводить сесію, вузол, стан in-call, причину ручної дії, підключення realtime-провайдера, `realtimeReady`, активність аудіовходу/аудіовиходу, останні аудіомітки часу, лічильники байтів і URL браузера. Використовуйте `googlemeet status [session-id] --json`, коли потрібен сирий JSON. Використовуйте `googlemeet doctor --oauth`, коли потрібно перевірити Google Meet OAuth refresh без розкриття токенів; додайте `--meeting` або `--create-space`, коли також потрібен доказ Google Meet API.

Якщо в агента сплив час очікування і ви бачите вже відкриту вкладку Meet, перевірте цю вкладку, не відкриваючи ще одну:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує й перевіряє наявну вкладку Meet для вибраного транспорту. З `chrome` вона використовує локальне керування браузером через Gateway; з `chrome-node` вона використовує налаштований вузол Chrome. Вона не відкриває нову вкладку й не створює нову сесію; вона повідомляє поточний блокер, наприклад стан входу, допуску, дозволів або вибору аудіо. Команда CLI звертається до налаштованого Gateway, тому Gateway має бути запущений; `chrome-node` також потребує підключеного вузла Chrome.

### Перевірки налаштування Twilio не проходять

`twilio-voice-call-plugin` завершується помилкою, коли `voice-call` не дозволений або не ввімкнений.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте Gateway.

`twilio-voice-call-credentials` завершується помилкою, коли в бекенді Twilio бракує account SID, auth token або caller number. Задайте їх на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` завершується помилкою, коли `voice-call` не має публічного Webhook-доступу або коли `publicUrl` вказує на local loopback чи приватний мережевий простір.
Задайте `plugins.entries.voice-call.config.publicUrl` як публічний URL провайдера або налаштуйте tunnel/Tailscale-доступ для `voice-call`.

Loopback і приватні URL не є дійсними для carrier callbacks. Не використовуйте `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` або `fd00::/8` як `publicUrl`.

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

Для локальної розробки використовуйте tunnel або Tailscale-доступ замість приватного URL хоста:

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

Додавайте `--yes` лише тоді, коли навмисно хочете здійснити live outbound notify call:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Виклик Twilio починається, але ніколи не входить у зустріч

Переконайтеся, що подія Meet надає дані phone dial-in. Передайте точний dial-in number і PIN або спеціальну DTMF-послідовність:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початковий `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза перед введенням PIN.

Якщо телефонний виклик створено, але roster Meet так і не показує dial-in учасника:

- Виконайте `openclaw googlemeet doctor <session-id>`, щоб підтвердити делегований Twilio call ID, чи DTMF було поставлено в чергу, і чи було запитано вступне привітання.
- Виконайте `openclaw voicecall status --call-id <id>` і переконайтеся, що виклик усе ще активний.
- Виконайте `openclaw voicecall tail` і перевірте, що Twilio webhooks надходять до Gateway.
- Виконайте `openclaw logs --follow` і знайдіть послідовність Twilio Meet: Google Meet делегує приєднання, Voice Call запускає phone leg, Google Meet чекає `voiceCall.dtmfDelayMs`, надсилає DTMF через `voicecall.dtmf`, чекає `voiceCall.postDtmfSpeechDelayMs`, а потім запитує вступну промову через `voicecall.speak`.
- Повторно виконайте `openclaw googlemeet setup --transport twilio`; зелена перевірка налаштування потрібна, але не доводить, що послідовність PIN зустрічі правильна.
- Переконайтеся, що dial-in number належить до того самого запрошення Meet і регіону, що й PIN.
- Збільште `voiceCall.dtmfDelayMs`, якщо Meet відповідає повільно або транскрипт виклику все ще показує запит на PIN після надсилання DTMF.
- Якщо учасник приєднується, але ви не чуєте привітання, перевірте `openclaw logs --follow` на наявність post-DTMF запиту `voicecall.speak` і або media-stream TTS playback, або резервного Twilio `<Say>`. Якщо транскрипт виклику все ще містить "enter the meeting PIN", phone leg ще не приєднався до кімнати Meet, тому учасники зустрічі не почують мовлення.

Якщо webhooks не надходять, спершу налагодьте Plugin Voice Call: провайдер має дістатися до `plugins.entries.voice-call.config.publicUrl` або налаштованого tunnel.
Див. [усунення несправностей голосового виклику](/uk/plugins/voice-call#troubleshooting).

## Примітки

Офіційний media API Google Meet орієнтований на отримання, тому мовлення в Meet-виклик усе ще потребує шляху учасника. Цей плагін робить цю межу видимою: Chrome обробляє участь у браузері й локальну маршрутизацію аудіо; Twilio обробляє участь через phone dial-in.

Chrome realtime mode потребує `BlackHole 2ch` плюс будь-що з:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує
  мостом голосу в реальному часі та передає аудіо у `chrome.audioFormat` між цими
  командами й вибраним провайдером голосу в реальному часі. Типовий шлях Chrome —
  PCM16 24 кГц; G.711 mu-law 8 кГц залишається доступним для застарілих пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда мосту керує всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого дуплексного аудіо спрямуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може відлунювати інших учасників назад у виклик.

З мостом Chrome на основі пари команд `chrome.bargeInInputCommand` може слухати
окремий локальний мікрофон і очищати відтворення асистента, коли людина починає
говорити. Це утримує людське мовлення попереду виводу асистента, навіть коли спільний
loopback-вхід BlackHole тимчасово приглушено під час відтворення асистента.
Як і `chrome.audioInputCommand` та `chrome.audioOutputCommand`, це локальна команда,
налаштована оператором. Використовуйте явний довірений шлях до команди або
список аргументів і не вказуйте їй скрипти з недовірених розташувань.

`googlemeet speak` запускає активний аудіоміст реального часу для сеансу Chrome.
`googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих через Plugin
голосових викликів, `leave` також завершує базовий голосовий виклик.
Використовуйте `googlemeet end-active-conference`, коли також потрібно закрити активну
конференцію Google Meet для простору, керованого API.

## Пов’язане

- [Plugin голосових викликів](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення Plugin](/uk/plugins/building-plugins)
