---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий виклик Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Google Meet Plugin: приєднання за явними URL-адресами Meet через Chrome або Twilio зі стандартними налаштуваннями голосового зв’язку в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-04T01:57:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 77ab70d27d47bcc037144c7c6cfad6f93f307355b6ebcf3ee75c85b96a24af2f
    source_path: plugins/google-meet.md
    workflow: 16
---

Підтримка учасника Google Meet для OpenClaw — Plugin навмисно вимагає явних дій:

- Він приєднується лише до явної URL-адреси `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися до
  поверненої URL-адреси.
- Голос у режимі `realtime` є типовим режимом.
- Голос у режимі реального часу може звертатися назад до повного агента OpenClaw, коли потрібні глибше
  міркування або інструменти.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `realtime` для живого
  прослуховування/відповіді голосом або `transcribe`, щоб приєднатися/керувати браузером без
  голосового мосту реального часу.
- Автентифікація починається як особистий Google OAuth або вже виконаний вхід у профілі Chrome.
- Автоматичного оголошення про згоду немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на спареному вузловому хості.
- Twilio приймає номер для дозвону плюс необов’язковий PIN або послідовність DTMF; він
  не може напряму набрати URL Meet.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших робочих процесів
  телеконференцій агента.

## Швидкий старт

Установіть локальні аудіозалежності й налаштуйте бекенд-провайдер голосу реального часу.
OpenAI є типовим; Google Gemini Live також працює з
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

Вивід налаштування призначений бути читабельним для агента й залежним від режиму. Він повідомляє про профіль Chrome,
прив’язування вузла, а для приєднань Chrome у режимі реального часу — про аудіоміст
BlackHole/SoX і відкладені перевірки вступу реального часу. Для приєднань лише для спостереження перевірте той самий
транспорт із `--mode transcribe`; цей режим пропускає передумови аудіо реального часу,
оскільки він не слухає через міст і не говорить через нього:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Коли налаштовано делегування Twilio, налаштування також повідомляє, чи готові
Plugin `voice-call`, облікові дані Twilio та публічна доступність Webhook.
Сприймайте будь-яку перевірку `ok: false` як блокер для перевіреного транспорту й режиму,
перш ніж просити агента приєднатися. Використовуйте `openclaw googlemeet setup --json` для
скриптів або машинно-читабельного виводу. Використовуйте `--transport chrome`,
`--transport chrome-node` або `--transport twilio`, щоб попередньо перевірити конкретний
транспорт до того, як агент спробує його.

Для Twilio завжди явно попередньо перевіряйте транспорт, коли типовим транспортом є Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Це виявляє відсутню проводку `voice-call`, облікові дані Twilio або недосяжну
доступність Webhook до того, як агент спробує набрати зустріч.

Приєднатися до зустрічі:

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
артефактів, календаря, налаштування, транскрибування, Twilio і потоків `chrome-node`. Локальні
дії відповіді голосом через Chrome там заблоковані, оскільки вбудований аудіошлях Chrome
наразі залежить від macOS `BlackHole 2ch`. У Linux використовуйте `mode: "transcribe"`,
дозвін Twilio або macOS-хост `chrome-node` для участі Chrome з відповіддю голосом.

Створити нову зустріч і приєднатися до неї:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Для кімнат, створених через API, використовуйте Google Meet `SpaceConfig.accessType`, коли хочете,
щоб політика кімнати без запиту на вхід була явною, а не успадкованою від типових параметрів
облікового запису Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` дозволяє будь-кому з URL Meet приєднатися без запиту на вхід. `TRUSTED` дозволяє
довіреним користувачам організації хоста, запрошеним зовнішнім користувачам і користувачам
дозвону приєднуватися без запиту на вхід. `RESTRICTED` обмежує вхід без запиту лише запрошеними.
Ці параметри застосовуються лише до офіційного шляху створення Google Meet API, тому
потрібно налаштувати облікові дані OAuth.

Якщо ви автентифікували Google Meet до появи цієї опції, повторно виконайте
`openclaw googlemeet auth login --json` після додавання області
`meetings.space.settings` на екран згоди Google OAuth.

Створити лише URL без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це
  найдетермінованіший шлях, який не залежить від стану інтерфейсу браузера.
- Резервний шлях браузера: використовується, коли облікових даних OAuth немає. OpenClaw використовує
  закріплений вузол Chrome, відкриває `https://meet.google.com/new`, чекає, поки Google
  перенаправить на справжню URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Цей шлях вимагає,
  щоб профіль OpenClaw Chrome на вузлі вже мав виконаний вхід у Google.
  Браузерна автоматизація обробляє власний перший запит Meet на доступ до мікрофона; цей запит
  не вважається помилкою входу в Google.
  Потоки приєднання і створення також намагаються повторно використати наявну вкладку Meet перед відкриттям
  нової. Зіставлення ігнорує нешкідливі рядки запиту URL, як-от `authuser`, тож повторна спроба
  агента має сфокусувати вже відкриту зустріч замість створення другої
  вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` типово приєднується до нової зустрічі та
повертає `joined: true` плюс сесію приєднання. Щоб лише створити URL, використовуйте
`create --no-join` у CLI або передайте `"join": false` інструменту.

Або скажіть агенту: "Створи Google Meet, приєднайся до нього з голосом реального часу та надішли
мені посилання." Агент має викликати `google_meet` з `action: "create"`, а потім
поділитися поверненим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Для приєднання лише для спостереження/керування браузером установіть `"mode": "transcribe"`. Це
не запускає дуплексний голосовий міст реального часу, не вимагає BlackHole або SoX
і не відповідатиме голосом у зустрічі. Приєднання Chrome у цьому режимі також уникають
надання OpenClaw дозволу на мікрофон/камеру та уникають шляху Meet **Використати
мікрофон**. Якщо Meet показує проміжний екран вибору аудіо, автоматизація намагається
шлях без мікрофона, а інакше повідомляє про ручну дію замість відкриття
локального мікрофона. У режимі transcribe керовані транспорти Chrome також установлюють
best-effort спостерігач субтитрів Meet. `googlemeet status --json` і
`googlemeet doctor` показують `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
і короткий хвіст `recentTranscript`, щоб оператори могли зрозуміти, чи браузер
приєднався до виклику і чи субтитри Meet створюють текст.
Використовуйте `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, коли
потрібна перевірка так/ні: вона приєднується в режимі transcribe, чекає на свіжий рух субтитрів або
транскрипту і повертає `listenVerified`, `listenTimedOut`, поля ручних
дій і останній стан субтитрів.

Під час сесій реального часу статус `google_meet` містить стан браузера та аудіомоста,
як-от `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, останні часові мітки вводу/виводу,
лічильники байтів і стан закриття мосту. Якщо з’являється безпечний запит сторінки Meet,
браузерна автоматизація обробляє його, коли може. Вхід, допуск хостом і
запити дозволів браузера/ОС повідомляються як ручна дія з причиною і
повідомленням, яке агент має передати. Керовані сесії Chrome відтворюють вступну або
тестову фразу лише після того, як стан браузера повідомляє `inCall: true`; інакше статус повідомляє
`speechReady: false`, а спроба мовлення блокується замість удавання, що
агент говорив у зустріч.

Локальні приєднання Chrome проходять через браузерний профіль OpenClaw із виконаним входом. Режим реального часу
вимагає `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для
чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного
пристрою BlackHole достатньо для першого smoke-тесту, але він може створювати відлуння.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM
лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть
вузловий хост у VM. Увімкніть вбудований Plugin у VM один раз, щоб вузол
оголошував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робоча область агента, ключі моделі/API, провайдер реального часу
  і конфігурація Plugin Google Meet.
- Parallels macOS VM: OpenClaw CLI/вузловий хост, Google Chrome, SoX, BlackHole 2ch,
  і профіль Chrome із виконаним входом у Google.
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

Установіть або оновіть OpenClaw у VM, потім увімкніть там вбудований Plugin:

```bash
openclaw plugins enable google-meet
```

Запустіть вузловий хост у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` є LAN IP і ви не використовуєте TLS, вузол відмовляється від
plaintext WebSocket, якщо ви явно не погодитеся для цієї довіреної приватної мережі:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` є середовищем процесу, а не налаштуванням
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

Для smoke-тесту однією командою, який створює або повторно використовує сесію, промовляє відому
фразу і друкує стан сесії:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання в реальному часі автоматизація браузера OpenClaw заповнює ім’я гостя, натискає Join/Ask to join і приймає перший вибір Meet "Use microphone", коли з’являється цей запит. Під час приєднання лише для спостереження або створення зустрічі лише в браузері вона проходить той самий запит без мікрофона, коли такий вибір доступний. Якщо профіль браузера не авторизований, Meet очікує допуску від організатора, Chrome потребує дозволу на мікрофон/камеру для приєднання в реальному часі або Meet застряг на запиті, який автоматизація не змогла обробити, результат join/test-speech повідомляє `manualActionRequired: true` з `manualActionReason` і `manualActionMessage`. Агенти мають припинити повторні спроби приєднання, повідомити це точне повідомлення разом із поточними `browserUrl`/`browserTitle` і повторювати спробу лише після завершення ручної дії в браузері.

Якщо `chromeNode.node` не вказано, OpenClaw автоматично вибирає лише тоді, коли рівно один підключений вузол оголошує і `googlemeet.chrome`, і керування браузером. Якщо підключено кілька придатних вузлів, задайте `chromeNode.node` як id вузла, відображуване ім’я або віддалену IP-адресу.

Типові перевірки збоїв:

- `Configured Google Meet node ... is not usable: offline`: закріплений вузол відомий Gateway, але недоступний. Агенти мають розглядати цей вузол як діагностичний стан, а не як придатний хост Chrome, і повідомляти про блокер налаштування замість переходу на інший транспорт, якщо користувач цього не просив.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM, підтвердьте сполучення і переконайтеся, що `openclaw plugins enable google-meet` та `openclaw plugins enable browser` були виконані у VM. Також підтвердьте, що хост Gateway дозволяє обидві команди вузла через `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: установіть `blackhole-2ch` на хості, який перевіряється, і перезавантажте його перед використанням локального аудіо Chrome.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch` у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або залиште `chrome.guestName` заданим для гостьового приєднання. Автоматичне гостьове приєднання використовує браузерну автоматизацію OpenClaw через проксі браузера вузла; переконайтеся, що конфігурація браузера вузла вказує на потрібний профіль, наприклад `browser.defaultProfile: "user"` або іменований профіль наявного сеансу.
- Дублікати вкладок Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw активує наявну вкладку для тієї самої URL-адреси Meet перед відкриттям нової, а створення зустрічі в браузері повторно використовує вкладку незавершеного `https://meet.google.com/new` або запиту акаунта Google перед відкриттям іншої.
- Немає аудіо: у Meet спрямуйте аудіо мікрофона/динаміка через шлях віртуального аудіопристрою, який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію у стилі Loopback для чистого дуплексного аудіо.

## Примітки щодо встановлення

Стандартний режим Chrome talk-back використовує два зовнішні інструменти:

- `sox`: аудіоутиліта командного рядка. Plugin використовує явні команди CoreAudio для стандартного аудіомоста 24 kHz PCM16.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`, через який Chrome/Meet може маршрутизувати аудіо.

OpenClaw не вбудовує і не розповсюджує жоден із цих пакетів. Документація просить користувачів установити їх як залежності хоста через Homebrew. SoX ліцензовано як `LGPL-2.0-only AND GPL-2.0-only`; BlackHole має ліцензію GPL-3.0. Якщо ви створюєте інсталятор або appliance, який постачає BlackHole разом з OpenClaw, перегляньте умови ліцензування BlackHole в upstream або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL Meet через керування браузером OpenClaw і приєднується як авторизований профіль браузера OpenClaw. На macOS Plugin перевіряє наявність `BlackHole 2ch` перед запуском. Якщо налаштовано, він також запускає команду перевірки стану аудіомоста і команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють на спареному вузлі, наприклад Parallels macOS VM. Для локального Chrome виберіть профіль через `browser.defaultProfile`; `chrome.browserProfile` передається хостам `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона і динаміка Chrome через локальний аудіоміст OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування, а не тихо приєднується без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план набору, делегований Plugin Voice Call. Він не аналізує сторінки Meet для пошуку телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або потрібен резервний варіант телефонного дозвону. Google Meet має надати телефонний номер дозвону і PIN для зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

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

Надайте облікові дані Twilio через середовище або конфігурацію. Середовище не допускає потрапляння секретів у `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни конфігурації Plugin не з’являються в уже запущеному процесі Gateway, доки він не перезавантажиться.

Потім перевірте:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Коли делегування Twilio підключене, `googlemeet setup` містить успішні перевірки `twilio-voice-call-plugin`, `twilio-voice-call-credentials` і `twilio-voice-call-webhook`.

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

OAuth є необов’язковим для створення посилання Meet, тому що `googlemeet create` може перейти на браузерну автоматизацію. Налаштуйте OAuth, коли потрібне офіційне створення через API, розв’язання space або preflight-перевірки Meet Media API.

Доступ до Google Meet API використовує користувацький OAuth: створіть OAuth-клієнт Google Cloud, запросіть потрібні scopes, авторизуйте акаунт Google, а потім збережіть отриманий refresh token у конфігурації Plugin Google Meet або надайте змінні середовища `OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання через Chrome. Транспорти Chrome і Chrome-node все одно приєднуються через авторизований профіль Chrome, BlackHole/SoX і підключений вузол, коли ви використовуєте участь через браузер. OAuth призначений лише для офіційного шляху Google Meet API: створення meeting spaces, розв’язання spaces і запуск preflight-перевірок Meet Media API.

### Створення облікових даних Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** — найпростіший варіант для організації Google Workspace.
   - **External** працює для персональних/тестових налаштувань; поки застосунок перебуває в Testing, додайте кожен акаунт Google, який авторизуватиме застосунок, як test user.
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

`meetings.space.created` потрібен для Google Meet `spaces.create`. `meetings.space.readonly` дає OpenClaw змогу розв’язувати URL/коди Meet у spaces. `meetings.space.settings` дає OpenClaw змогу передавати налаштування `SpaceConfig`, як-от `accessType`, під час створення кімнати через API. `meetings.conference.media.readonly` призначений для preflight Meet Media API і роботи з медіа; Google може вимагати реєстрації в Developer Preview для фактичного використання Media API. Якщо вам потрібні лише приєднання Chrome на основі браузера, повністю пропустіть OAuth.

### Створення refresh token

Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, або передайте їх як змінні середовища, потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить конфігураційний блок `oauth` із refresh token. Вона використовує PKCE, localhost callback на `http://localhost:8085/oauth2callback` і ручний потік копіювання/вставлення з `--manual`.

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

Надавайте перевагу змінним середовища, коли не хочете зберігати refresh token у конфігурації. Якщо присутні і значення конфігурації, і значення середовища, Plugin спочатку бере конфігурацію, а потім fallback із середовища.

Згода OAuth включає створення Meet space, доступ для читання Meet space і доступ для читання медіа Meet conference. Якщо ви автентифікувалися до появи підтримки створення зустрічей, повторно виконайте `openclaw googlemeet auth login --json`, щоб refresh token мав scope `meetings.space.created`.

### Перевірка OAuth через doctor

Запустіть OAuth doctor, коли потрібна швидка перевірка стану без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує runtime Chrome і не потребує підключеного вузла Chrome. Воно перевіряє, що конфігурація OAuth існує і що refresh token може створити access token. JSON-звіт містить лише поля стану, як-от `ok`, `configured`, `tokenSource`, `expiresAt`, і повідомлення перевірок; він не виводить access token, refresh token або client secret.

Типові результати:

| Перевірка            | Значення                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Наявні `oauth.clientId` плюс `oauth.refreshToken` або кешований access token.           |
| `oauth-token`        | Кешований access token досі чинний або refresh token створив новий access token.        |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` розв’язала наявний Meet space.                      |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий Meet space.                     |

Щоб також довести ввімкнення Google Meet API і scope `spaces.create`, запустіть перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює тимчасову URL-адресу Meet. Використовуйте це, коли потрібно підтвердити,
що в проєкті Google Cloud увімкнено Meet API і що авторизований
обліковий запис має scope `meetings.space.created`.

Щоб довести доступ на читання для наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` доводять доступ на читання до наявного
простору, до якого авторизований обліковий запис Google має доступ. `403` від цих перевірок
зазвичай означає, що Google Meet REST API вимкнено, погоджений refresh token
не має потрібного scope або обліковий запис Google не може отримати доступ до цього
простору Meet. Помилка refresh-token означає, що потрібно повторно запустити `openclaw googlemeet auth login
--json` і зберегти новий блок `oauth`.

Для браузерного резервного режиму облікові дані OAuth не потрібні. У цьому режимі Google
auth надходить із профілю Chrome, у який виконано вхід, на вибраному вузлі, а не з
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

З `--meeting` `artifacts` і `attendance` за замовчуванням використовують найновіший запис конференції.
Передайте `--all-conference-records`, коли потрібні всі збережені записи
для цієї зустрічі.

Пошук у Calendar може розв’язати URL-адресу зустрічі з Google Calendar перед читанням
артефактів Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` шукає в сьогоднішньому календарі `primary` подію Calendar із
посиланням Google Meet. Використовуйте `--event <query>` для пошуку відповідного тексту події та
`--calendar <id>` для неосновного календаря. Пошук у Calendar потребує свіжого
входу OAuth, який включає scope лише для читання подій Calendar.
`calendar-events` показує попередній перегляд відповідних подій Meet і позначає подію, яку
виберуть `latest`, `artifacts`, `attendance` або `export`.

Якщо ви вже знаєте id запису конференції, зверніться до нього напряму:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Завершіть активну конференцію для простору, створеного через API, коли потрібно закрити
кімнату після виклику:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Це викликає Google Meet `spaces.endActiveConference` і потребує OAuth зі
scope `meetings.space.created` для простору, яким авторизований обліковий запис може керувати.
OpenClaw приймає URL-адресу Meet, код зустрічі або вхідні дані `spaces/{id}` і розв’язує їх
до ресурсу простору API перед завершенням активної конференції.
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
транскриптів, структурованих записів транскрипту та smart-note, коли
Google надає їх для зустрічі. Використовуйте `--no-transcript-entries`, щоб пропустити
пошук записів для великих зустрічей. `attendance` розгортає учасників у
рядки participant-session із часом першого/останнього виявлення, загальною тривалістю сесії,
прапорцями запізнення/раннього виходу та дубльованими ресурсами учасників, об’єднаними за користувачем,
який увійшов у систему, або відображуваним іменем. Передайте `--no-merge-duplicates`, щоб залишити необроблені
ресурси учасників окремо, `--late-after-minutes`, щоб налаштувати виявлення запізнення, і
`--early-before-minutes`, щоб налаштувати виявлення раннього виходу.

`export` записує папку, що містить `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`.
`manifest.json` записує вибрані вхідні дані, параметри експорту, записи конференції,
вихідні файли, лічильники, джерело токена, подію Calendar, якщо її використано, і будь-які
попередження про часткове отримання. Передайте `--zip`, щоб також записати переносний архів поруч
із папкою. Передайте `--include-doc-bodies`, щоб експортувати текст пов’язаних транскриптів і
smart-note Google Docs через Google Drive `files.export`; для цього потрібен
свіжий вхід OAuth, який включає scope лише для читання Drive Meet. Без
`--include-doc-bodies` експорти включають лише метадані Meet і структуровані записи транскрипту.
Якщо Google повертає часткову помилку артефакту, як-от помилку списку smart-note,
запису транскрипту або тіла документа Drive, summary і
manifest зберігають попередження замість того, щоб завершити весь експорт помилкою.
Використовуйте `--dry-run`, щоб отримати ті самі дані артефактів/відвідуваності та надрукувати
JSON manifest без створення папки або ZIP. Це корисно перед записом
великого експорту або коли агенту потрібні лише лічильники, вибрані записи та
попередження.

Агенти також можуть створити той самий bundle через інструмент `google_meet`:

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

Агенти також можуть створити кімнату на основі API з явною політикою доступу:

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

Для валідації listen-first агенти мають використовувати `test_listen`, перш ніж стверджувати, що
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

Запустіть live listen-first браузерну пробу проти зустрічі, де хтось говоритиме
з доступними субтитрами Meet:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Середовище live smoke:

- `OPENCLAW_LIVE_TEST=1` вмикає захищені live-тести.
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

Базовому live smoke для артефактів/відвідуваності потрібні
`https://www.googleapis.com/auth/meetings.space.readonly` і
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Пошуку в Calendar
потрібен `https://www.googleapis.com/auth/calendar.events.readonly`. Експорту
тіла документа Drive потрібен
`https://www.googleapis.com/auth/drive.meet.readonly`.

Створіть свіжий простір Meet:

```bash
openclaw googlemeet create
```

Команда друкує новий `meeting uri`, джерело та join session. З обліковими даними OAuth
вона використовує офіційний Google Meet API. Без облікових даних OAuth вона
використовує профіль браузера закріпленого вузла Chrome, у який виконано вхід, як резервний режим. Агенти можуть
використовувати інструмент `google_meet` з `action: "create"`, щоб створити та приєднатися за один
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

Якщо браузерний резервний режим стикається з входом Google або блокуванням дозволу Meet до того, як
може створити URL-адресу, метод Gateway повертає невдалу відповідь, а
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
`manualActionMessage` разом із контекстом вузла/вкладки браузера й припинити відкривати нові
вкладки Meet, доки оператор не виконає браузерний крок.

Приклад JSON-виводу створення через API:

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

Створення Meet приєднується за замовчуванням. Транспорт Chrome або Chrome-node все одно
потребує профілю Google Chrome із виконаним входом, щоб приєднатися через браузер. Якщо з
профілю виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або
помилку браузерного резервного режиму й просить оператора завершити вхід у Google перед
повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
проєкт, OAuth principal і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Спільний шлях агента Chrome потребує лише ввімкненого plugin, BlackHole, SoX,
ключа провайдера realtime-транскрипції та налаштованого TTS-провайдера OpenClaw.
OpenAI є провайдером транскрипції за замовчуванням; установіть `realtime.provider: "google"`,
щоб використовувати Google Gemini Live для режиму `bidi`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# або
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
- `defaultMode: "agent"` (`"realtime"` приймається як сумісний псевдонім для
  `"agent"`)
- `chromeNode.node`: необов’язковий ідентифікатор/назва/IP вузла для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на екрані гостя Meet без входу в обліковий запис
- `chrome.autoJoin: true`: найкраща спроба заповнити ім’я гостя та натиснути Join Now через браузерну автоматизацію OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкривання дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить, що вона у виклику,
  перед запуском вступу realtime
- `chrome.audioFormat: "pcm16-24khz"`: формат аудіо для пари команд. Використовуйте
  `"g711-ulaw-8khz"` лише для застарілих/власних пар команд, які все ще видають
  телефонне аудіо.
- `chrome.audioInputCommand`: команда SoX, що читає з CoreAudio `BlackHole 2ch`
  і записує аудіо у форматі `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX, що читає аудіо у форматі `chrome.audioFormat`
  і записує в CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: необов’язкова команда локального мікрофона, яка записує
  підписаний 16-бітний little-endian моно PCM для виявлення людського втручання
  під час активного відтворення асистента. Наразі це застосовується до розміщеного в Gateway
  мосту пар команд `chrome`.
- `chrome.bargeInRmsThreshold: 650`: рівень RMS, що вважається людським
  перериванням на `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: піковий рівень, що вважається людським
  перериванням на `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: мінімальна затримка між повторними очищеннями
  людського переривання
- `mode: "agent"`: типовий режим відповіді голосом. Мовлення учасників транскрибується
  налаштованим realtime-провайдером транскрипції, надсилається налаштованому
  агенту OpenClaw у підсесії агента для окремої зустрічі та озвучується через
  звичайний runtime TTS OpenClaw.
- `mode: "bidi"`: запасний прямий двонапрямний режим realtime-моделі. Провайдер
  realtime-голосу відповідає на мовлення учасників напряму та може викликати
  `openclaw_agent_consult` для глибших відповідей або відповідей із підтримкою інструментів.
- `mode: "transcribe"`: режим лише спостереження без мосту відповіді голосом.
- `realtime.provider: "openai"`: ідентифікатор провайдера, який режим `agent` використовує для realtime
  транскрипції, а режим `bidi` — для realtime-голосу.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі голосові відповіді, з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка голосова перевірка готовності, коли realtime-міст
  підключається; встановіть `""`, щоб приєднатися мовчки
- `realtime.agentId`: необов’язковий ідентифікатор агента OpenClaw для
  `openclaw_agent_consult`; типове значення — `main`

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

Типове значення `voiceCall.enabled` — `true`; з транспортом Twilio він делегує
фактичний PSTN-виклик, DTMF і вступне привітання Plugin Voice Call. Voice Call
відтворює послідовність DTMF перед відкриттям realtime-медіапотоку, а потім використовує
збережений вступний текст як початкове realtime-привітання. Якщо `voice-call` не
увімкнено, Google Meet усе ще може перевірити та записати план набору, але не може
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
`transport: "chrome-node"`, коли Chrome працює на спареному вузлі, наприклад у VM Parallels.
В обох випадках провайдери моделей і `openclaw_agent_consult` працюють на хості
Gateway, тож облікові дані моделей залишаються там. З типовим `mode: "agent"`
провайдер realtime-транскрипції виконує прослуховування, налаштований агент OpenClaw
створює відповідь, а звичайний TTS OpenClaw озвучує її в Meet. Використовуйте
`mode: "bidi"`, коли потрібно, щоб realtime-голосова модель відповідала напряму.
`mode: "realtime"` і надалі приймається як сумісний псевдонім для
`mode: "agent"`.

Використовуйте `action: "status"`, щоб перелічити активні сесії або перевірити ідентифікатор сесії. Використовуйте
`action: "speak"` із `sessionId` і `message`, щоб realtime-агент
заговорив негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сесію,
запустити відому фразу та повернути стан `inCall`, коли хост Chrome може
його повідомити. `test_speech` завжди примусово встановлює `mode: "agent"` і завершується помилкою, якщо його просять
запуститися в `mode: "transcribe"`, бо сесії лише спостереження навмисно не можуть
виводити мовлення. Його результат `speechOutputVerified` базується на зростанні байтів realtime-аудіовиходу
під час цього тестового виклику, тому повторно використана сесія зі старішим аудіо
не рахується як свіжа успішна перевірка мовлення. Використовуйте `action: "leave"`, щоб позначити
сесію завершеною.

`status` включає стан Chrome, коли він доступний:

- `inCall`: Chrome, схоже, перебуває всередині виклику Meet
- `micMuted`: найкраща спроба визначити стан мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профіль
  браузера потребує ручного входу, допуску хостом Meet, дозволів або
  відновлення керування браузером, перш ніж мовлення зможе працювати
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: чи
  кероване мовлення Chrome дозволене зараз. `speechReady: false` означає, що OpenClaw не
  надіслав вступну/тестову фразу в аудіоміст.
- `providerConnected` / `realtimeReady`: стан realtime-голосового мосту
- `lastInputAt` / `lastOutputAt`: останнє аудіо, побачене з мосту або надіслане до нього
- `audioOutputRouted` / `audioOutputDeviceLabel`: чи медіавихід вкладки Meet
  активно спрямовано на пристрій BlackHole, який використовує міст
- `lastSuppressedInputAt` / `suppressedInputBytes`: вхід local loopback, проігнорований під час
  активного відтворення асистента

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Режими Agent і Bidi

Режим Chrome `agent` оптимізовано для поведінки "мій агент присутній на зустрічі". Провайдер
realtime-транскрипції чує аудіо зустрічі, фінальні транскрипти учасників
передаються налаштованому агенту OpenClaw, а відповідь озвучується через
звичайний runtime TTS OpenClaw. Встановіть `mode: "bidi"`, коли потрібно, щоб
realtime-голосова модель відповідала напряму.
Близькі фінальні фрагменти транскриптів об’єднуються перед consult, щоб один усний
хід не породжував кілька застарілих часткових відповідей. Realtime-вхід також
приглушується, доки поставлене в чергу аудіо асистента ще відтворюється,
а нещодавні схожі на асистента луна-транскрипти ігноруються перед consult агента,
щоб local loopback BlackHole не змушував агента відповідати на власне мовлення.

| Режим   | Хто визначає відповідь        | Шлях виводу мовлення                  | Коли використовувати                                  |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | Налаштований агент OpenClaw   | Звичайний runtime TTS OpenClaw         | Потрібна поведінка "мій агент присутній на зустрічі" |
| `bidi`  | Realtime-голосова модель      | Аудіовідповідь провайдера realtime-голосу | Потрібен голосовий діалоговий цикл із найнижчою затримкою |

У режимі `bidi`, коли realtime-моделі потрібні глибше міркування, актуальна
інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент consult запускає звичайного агента OpenClaw за лаштунками з контекстом
нещодавнього транскрипту зустрічі та повертає стислу голосову відповідь. У режимі `agent`
OpenClaw надсилає цю відповідь безпосередньо до runtime TTS; у режимі `bidi` realtime-голосова модель може
озвучити результат consult назад у зустріч. Він використовує той самий спільний механізм consult, що й Voice Call.

Типово consult виконується для агента `main`. Встановіть `realtime.agentId`, коли
лінія Meet має консультуватися з окремим робочим простором агента OpenClaw, типовими значеннями моделі,
політикою інструментів, пам’яттю та історією сесій.

Consult у режимі агента використовує ключ сесії `agent:<id>:subagent:google-meet:<session>`
для кожної зустрічі, щоб подальші запитання зберігали контекст зустрічі, успадковуючи звичайну
політику агента від налаштованого агента.

`realtime.toolPolicy` керує запуском consult:

- `safe-read-only`: надати інструмент consult і обмежити звичайного агента
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: надати інструмент consult і дозволити звичайному агенту використовувати звичайну
  політику інструментів агента.
- `none`: не надавати інструмент consult realtime-голосовій моделі.

Ключ сесії consult обмежений конкретною сесією Meet, тому подальші виклики consult
можуть повторно використовувати попередній контекст consult під час тієї самої зустрічі.

Щоб примусово виконати голосову перевірку готовності після того, як Chrome повністю приєднався до виклику:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повної перевірки приєднання та мовлення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Контрольний список live-тесту

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
- `googlemeet setup` включає `chrome-node-connected`, коли Chrome-node є
  типовим транспортом або вузол закріплено.
- `nodes status` показує, що вибраний вузол підключено.
- Вибраний вузол оголошує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до виклику, а `test-speech` повертає стан Chrome із
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

Це доводить, що Plugin Gateway завантажено, вузол VM підключено з
поточним токеном, а аудіоміст Meet доступний перед тим, як агент відкриє
справжню вкладку зустрічі.

Для перевірки Twilio використовуйте зустріч, яка надає дані телефонного підключення:

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
- Повернений сеанс має `transport: "twilio"` і `twilio.voiceCallId`.
- `openclaw logs --follow` показує DTMF TwiML, наданий перед realtime TwiML, а потім
  realtime-міст із початковим привітанням у черзі.
- `googlemeet leave <sessionId>` завершує делегований голосовий виклик.

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

На хостах Gateway не з macOS інструмент `google_meet`, видимий агенту, залишається видимим,
але локальні дії Chrome talk-back блокуються до потрапляння в аудіоміст.
Локальне Chrome talk-back-аудіо наразі залежить від macOS `BlackHole 2ch`, тому
агенти Linux мають використовувати `mode: "transcribe"`, набір через Twilio або хост macOS
`chrome-node` замість стандартного шляху локального агента Chrome.

### Немає підключеного вузла з підтримкою Google Meet

На хості вузла запустіть:

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

Вузол має бути підключений і містити `googlemeet.chrome` разом із `browser.proxy`.
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

Потім перезавантажте службу вузла й повторно виконайте:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Браузер відкривається, але агент не може приєднатися

Запустіть `googlemeet test-listen` для приєднань лише для спостереження або `googlemeet test-speech`
для realtime-приєднань, а потім перевірте повернений стан Chrome. Якщо будь-яка перевірка
повідомляє `manualActionRequired: true`, покажіть `manualActionMessage` оператору
і припиніть повторні спроби, доки дія в браузері не буде завершена.

Поширені ручні дії:

- Увійдіть у профіль Chrome.
- Допустіть гостя з облікового запису організатора Meet.
- Надайте Chrome дозволи на мікрофон/камеру, коли з’явиться нативний запит дозволу Chrome.
- Закрийте або виправте завислий діалог дозволів Meet.

Не повідомляйте "not signed in" лише тому, що Meet показує "Do you want people to
hear you in the meeting?" Це проміжний екран вибору аудіо Meet; OpenClaw
натискає **Use microphone** через автоматизацію браузера, коли це доступно, і продовжує
чекати на реальний стан зустрічі. Для браузерного запасного варіанта лише створення OpenClaw
може натиснути **Continue without microphone**, тому що створення URL не потребує
realtime-аудіошляху.

### Створення зустрічі не вдається

`googlemeet create` спершу використовує endpoint Google Meet API `spaces.create`,
коли налаштовано облікові дані OAuth. Без облікових даних OAuth він переходить
до закріпленого браузера вузла Chrome. Перевірте:

- Для створення через API: `oauth.clientId` і `oauth.refreshToken` налаштовані
  або наявні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було створено після додавання підтримки створення.
  Старішим токенам може бракувати scope `meetings.space.created`; повторно запустіть
  `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для браузерного запасного варіанта: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений вузол із `browser.proxy` і
  `googlemeet.chrome`.
- Для браузерного запасного варіанта: профіль OpenClaw Chrome на цьому вузлі має вхід
  у Google і може відкрити `https://meet.google.com/new`.
- Для браузерного запасного варіанта: повторні спроби повторно використовують наявну вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google перед відкриттям нової вкладки. Якщо агент вичерпує час очікування,
  повторіть виклик інструмента замість ручного відкриття ще однієї вкладки Meet.
- Для браузерного запасного варіанта: якщо інструмент повертає `manualActionRequired: true`, використовуйте
  повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і
  `manualActionMessage`, щоб скерувати оператора. Не повторюйте спроби в циклі, доки ця
  дія не буде завершена.
- Для браузерного запасного варіанта: якщо Meet показує "Do you want people to hear you in the
  meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для
  запасного варіанта лише створення, **Continue without microphone** через автоматизацію браузера
  і продовжити чекати на згенерований URL Meet. Якщо це не вдається, помилка
  має згадувати `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте realtime-шлях:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "agent"` для звичайного шляху STT -> агент OpenClaw -> TTS talk-back
або `mode: "bidi"` для прямого запасного варіанта realtime-голосу. `mode: "transcribe"`
навмисно не запускає міст talk-back. Для налагодження лише спостереження
запустіть `openclaw googlemeet status --json <session-id>` після того, як учасники говоритимуть,
і перевірте `captioning`, `transcriptLines` і `lastCaptionText`. Якщо `inCall` має значення
true, але `transcriptLines` залишається `0`, субтитри Meet можуть бути вимкнені, ніхто
не говорив після встановлення спостерігача, інтерфейс Meet змінився або live
captions недоступні для мови/облікового запису зустрічі.

`googlemeet test-speech` завжди перевіряє realtime-шлях і повідомляє, чи
було виявлено байти виводу мосту для цього виклику. Якщо `speechOutputVerified` має значення false і
`speechOutputTimedOut` має значення true, realtime-провайдер міг прийняти
висловлювання, але OpenClaw не побачив, щоб нові байти виводу дійшли до аудіомоста Chrome.

Також перевірте:

- Ключ realtime-провайдера доступний на хості Gateway, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `sox` існує на хості Chrome.
- Мікрофон і динамік Meet спрямовані через віртуальний аудіошлях, який використовує
  OpenClaw. `doctor` має показувати `meet output routed: yes` для локальних Chrome
  realtime-приєднань.

`googlemeet doctor [session-id]` виводить сеанс, вузол, стан у виклику,
причину ручної дії, підключення realtime-провайдера, `realtimeReady`, активність
вводу/виводу аудіо, останні аудіомітки часу, лічильники байтів і URL браузера.
Використовуйте `googlemeet status [session-id] --json`, коли потрібен сирий JSON. Використовуйте
`googlemeet doctor --oauth`, коли потрібно перевірити Google Meet OAuth refresh
без розкриття токенів; додайте `--meeting` або `--create-space`, коли також потрібне
підтвердження Google Meet API.

Якщо час очікування агента минув і ви бачите вже відкриту вкладку Meet, перевірте цю вкладку
без відкриття іншої:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує і перевіряє
наявну вкладку Meet для вибраного транспорту. З `chrome` вона використовує локальне
керування браузером через Gateway; з `chrome-node` вона використовує налаштований
вузол Chrome. Вона не відкриває нову вкладку і не створює новий сеанс; вона повідомляє
поточний блокер, наприклад стан входу, допуску, дозволів або вибору аудіо.
Команда CLI звертається до налаштованого Gateway, тому Gateway має бути запущений;
`chrome-node` також потребує підключеного вузла Chrome.

### Перевірки налаштування Twilio не проходять

`twilio-voice-call-plugin` не проходить, коли `voice-call` не дозволено або не ввімкнено.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` не проходить, коли backend Twilio не має account
SID, auth token або номера абонента, що телефонує. Налаштуйте це на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` не проходить, коли `voice-call` не має публічної Webhook-
експозиції або коли `publicUrl` вказує на loopback чи простір приватної мережі.
Встановіть `plugins.entries.voice-call.config.publicUrl` на публічний URL провайдера або
налаштуйте tunnel/Tailscale-експозицію для `voice-call`.

Loopback і приватні URL не є дійсними для callback-ів оператора. Не використовуйте
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

`voicecall smoke` за замовчуванням лише перевіряє готовність. Щоб виконати dry-run для певного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли навмисно хочете здійснити live вихідний
сповіщувальний виклик:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Виклик Twilio починається, але ніколи не входить у зустріч

Переконайтеся, що подія Meet надає дані для телефонного набору. Передайте точний номер
dial-in і PIN або власну DTMF-послідовність:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкову `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза
перед введенням PIN.

Якщо телефонний виклик створено, але список учасників Meet ніколи не показує учасника
dial-in:

- Запустіть `openclaw googlemeet doctor <session-id>`, щоб підтвердити делегований Twilio
  call ID, чи DTMF було поставлено в чергу і чи було запитано вступне привітання.
- Запустіть `openclaw voicecall status --call-id <id>` і переконайтеся, що виклик досі
  активний.
- Запустіть `openclaw voicecall tail` і перевірте, що Twilio webhooks надходять до
  Gateway.
- Запустіть `openclaw logs --follow` і знайдіть послідовність Twilio Meet: Google
  Meet делегує приєднання, Voice Call запускає телефонну гілку, Google Meet чекає
  `voiceCall.dtmfDelayMs`, надсилає DTMF через `voicecall.dtmf`, чекає
  `voiceCall.postDtmfSpeechDelayMs`, а потім запитує вступну мову через
  `voicecall.speak`.
- Повторно запустіть `openclaw googlemeet setup --transport twilio`; зелена перевірка налаштування
  обов’язкова, але не доводить, що PIN-послідовність зустрічі правильна.
- Переконайтеся, що номер dial-in належить до того самого запрошення Meet і регіону, що й
  PIN.
- Збільште `voiceCall.dtmfDelayMs`, якщо Meet відповідає повільно або транскрипт виклику
  досі показує запит PIN після надсилання DTMF.
- Якщо учасник приєднується, але ви не чуєте привітання, перевірте
  `openclaw logs --follow` на запит `voicecall.speak` після DTMF і
  або відтворення TTS media-stream, або запасний варіант Twilio `<Say>`. Якщо транскрипт виклику
  досі містить "enter the meeting PIN", телефонна гілка ще не приєдналася
  до кімнати Meet, тому учасники зустрічі не почують мовлення.

Якщо webhooks не надходять, спершу налагодьте Plugin голосових викликів: провайдер має
досягати `plugins.entries.voice-call.config.publicUrl` або налаштованого тунелю.
Див. [усунення несправностей голосових викликів](/uk/plugins/voice-call#troubleshooting).

## Примітки

Офіційний медіа-API Google Meet орієнтований на отримання, тому мовлення у
виклику Meet усе ще потребує шляху учасника. Цей Plugin робить цю межу видимою:
Chrome обробляє участь у браузері та локальну маршрутизацію аудіо; Twilio обробляє
участь через телефонне підключення.

Режими зворотного мовлення Chrome потребують `BlackHole 2ch` плюс один із варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw володіє
  мостом і передає аудіо у `chrome.audioFormat` між цими командами та вибраним
  провайдером. Режим агента використовує транскрипцію в реальному часі плюс звичайний TTS;
  bidi-режим використовує голосового провайдера в реальному часі. Типовий шлях Chrome — 24 кГц
  PCM16; 8 кГц G.711 mu-law залишається доступним для застарілих пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда мосту володіє всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона. Це чинно лише
  для `bidi`, оскільки режим `agent` потребує прямого доступу до пари команд для TTS.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може повертати відлуння інших учасників назад у виклик.

З мостом Chrome на основі пари команд `chrome.bargeInInputCommand` може слухати
окремий локальний мікрофон і очищати відтворення асистента, коли людина починає
говорити. Це зберігає людське мовлення попереду виводу асистента, навіть коли спільний
вхід local loopback BlackHole тимчасово приглушено під час відтворення асистента.
Як і `chrome.audioInputCommand` та `chrome.audioOutputCommand`, це
локальна команда, налаштована оператором. Використовуйте явний довірений шлях команди або
список аргументів і не спрямовуйте її на скрипти з недовірених розташувань.

`googlemeet speak` запускає активний аудіоміст зворотного мовлення для сеансу Chrome.
`googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих
через Plugin Voice Call, `leave` також завершує базовий голосовий виклик.
Використовуйте `googlemeet end-active-conference`, коли також хочете закрити активну
конференцію Google Meet для простору, керованого API.

## Пов’язане

- [Plugin голосових викликів](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення plugins](/uk/plugins/building-plugins)
