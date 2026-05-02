---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий дзвінок Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Google Meet Plugin: приєднання до явних URL-адрес Meet через Chrome або Twilio з типовими налаштуваннями голосу в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-02T10:00:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dc515382d2cc7beacaf18a50b75cb0f4eda3038cfd8efe73ea3ce7b5007bc43
    source_path: plugins/google-meet.md
    workflow: 16
---

Підтримка учасника Google Meet для OpenClaw — цей Plugin навмисно є явним:

- Він приєднується лише до явної URL-адреси `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися за
  поверненою URL-адресою.
- `realtime`-голос є режимом за замовчуванням.
- Голос у реальному часі може звертатися назад до повного агента OpenClaw, коли потрібні глибші
  міркування або інструменти.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `realtime` для живого
  прослуховування/відповіді голосом або `transcribe`, щоб приєднатися/керувати браузером без
  голосового мосту реального часу.
- Автентифікація починається як особистий Google OAuth або вже авторизований профіль Chrome.
- Автоматичного оголошення згоди немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на спареному вузловому хості.
- Twilio приймає номер дозвону плюс необов’язковий PIN або послідовність DTMF; він
  не може напряму набрати URL Meet.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших агентських
  телеконференційних робочих процесів.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте бекенд-провайдер голосу реального часу.
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

Вивід налаштування призначений бути читабельним для агента та враховувати режим. Він повідомляє про профіль Chrome,
закріплення вузла, а для приєднань Chrome у режимі реального часу — про аудіоміст BlackHole/SoX
і відкладені перевірки вступу в реальному часі. Для приєднань лише для спостереження перевірте той самий
транспорт із `--mode transcribe`; цей режим пропускає передумови аудіо реального часу,
бо не слухає через міст і не говорить через нього:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Коли делегування Twilio налаштоване, налаштування також повідомляє, чи готові
Plugin `voice-call`, облікові дані Twilio та публічне Webhook-оприлюднення.
Вважайте будь-яку перевірку `ok: false` блокером для перевірених транспорту й режиму
перед тим, як просити агента приєднатися. Використовуйте `openclaw googlemeet setup --json` для
скриптів або машинно-читабельного виводу. Використовуйте `--transport chrome`,
`--transport chrome-node` або `--transport twilio`, щоб попередньо перевірити конкретний
транспорт до того, як агент спробує його використати.

Для Twilio завжди попередньо перевіряйте транспорт явно, коли типовим транспортом
є Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Це виявляє відсутню проводку `voice-call`, облікові дані Twilio або недосяжне
Webhook-оприлюднення до того, як агент спробує набрати зустріч.

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
  "mode": "realtime"
}
```

Агентський інструмент `google_meet` залишається доступним на хостах не macOS для
артефактів, календаря, налаштування, транскрибування, Twilio та потоків `chrome-node`. Локальні
дії Chrome у режимі реального часу там заблоковані, бо вбудований аудіошлях Chrome
реального часу наразі залежить від macOS `BlackHole 2ch`. На Linux використовуйте
`mode: "transcribe"`, дозвін Twilio або macOS-хост `chrome-node` для участі Chrome
у режимі реального часу.

Створити нову зустріч і приєднатися до неї:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Для кімнат, створених через API, використовуйте Google Meet `SpaceConfig.accessType`, коли хочете,
щоб політика кімнати без стуку була явною, а не успадкованою з типових налаштувань
облікового запису Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` дозволяє будь-кому з URL Meet приєднатися без стуку. `TRUSTED` дозволяє
довіреним користувачам організації хоста, запрошеним зовнішнім користувачам і користувачам дозвону
приєднуватися без стуку. `RESTRICTED` обмежує вхід без стуку запрошеними. Ці
налаштування застосовуються лише до офіційного шляху створення Google Meet API, тож облікові дані
OAuth мають бути налаштовані.

Якщо ви автентифікували Google Meet до появи цієї опції, повторно запустіть
`openclaw googlemeet auth login --json` після додавання області
`meetings.space.settings` до екрана згоди Google OAuth.

Створити лише URL без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовані облікові дані Google Meet OAuth. Це
  найбільш детермінований шлях, який не залежить від стану інтерфейсу браузера.
- Резервний браузерний шлях: використовується, коли облікові дані OAuth відсутні. OpenClaw використовує
  закріплений вузол Chrome, відкриває `https://meet.google.com/new`, чекає, доки Google
  переспрямує на реальну URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Цей шлях потребує,
  щоб профіль OpenClaw Chrome на вузлі вже був авторизований у Google.
  Браузерна автоматизація обробляє власний перший запит Meet на мікрофон; цей запит
  не вважається помилкою входу Google.
  Потоки приєднання та створення також намагаються повторно використати наявну вкладку Meet перед відкриттям
  нової. Зіставлення ігнорує нешкідливі рядки запиту URL, такі як `authuser`, тож
  повторна спроба агента має сфокусувати вже відкриту зустріч, а не створювати другу
  вкладку Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` за замовчуванням приєднується до нової зустрічі та
повертає `joined: true` плюс сеанс приєднання. Щоб лише створити URL, використовуйте
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

Для приєднання лише для спостереження/керування браузером установіть `"mode": "transcribe"`. Це
не запускає дуплексний міст моделі реального часу, не потребує BlackHole або SoX
і не відповідатиме голосом у зустрічі. Приєднання Chrome у цьому режимі також уникають
надання OpenClaw дозволів на мікрофон/камеру та уникають шляху Meet **Використовувати
мікрофон**. Якщо Meet показує проміжний екран вибору аудіо, автоматизація пробує
шлях без мікрофона, а інакше повідомляє про ручну дію замість відкриття
локального мікрофона. У режимі транскрибування керовані транспорти Chrome також установлюють
best-effort спостерігач субтитрів Meet. `googlemeet status --json` і
`googlemeet doctor` показують `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
і короткий хвіст `recentTranscript`, щоб оператори могли зрозуміти, чи браузер
приєднався до виклику та чи субтитри Meet створюють текст.
Використовуйте `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, коли
потрібна перевірка так/ні: вона приєднується в режимі транскрибування, чекає на свіжі субтитри або
рух транскрипту та повертає `listenVerified`, `listenTimedOut`, поля ручних
дій і найновіший стан субтитрів.

Під час сеансів реального часу статус `google_meet` містить стан браузера й аудіомоста,
як-от `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, останні часові позначки введення/виведення,
лічильники байтів і стан закриття мосту. Якщо з’являється безпечний запит сторінки Meet,
браузерна автоматизація обробляє його, коли може. Запити входу, допуску хостом і
дозволів браузера/ОС повідомляються як ручна дія з причиною та
повідомленням, яке агент має передати. Керовані сеанси Chrome видають вступну або
тестову фразу лише після того, як стан браузера повідомляє `inCall: true`; інакше статус повідомляє
`speechReady: false`, а спроба мовлення блокується замість того, щоб удавати, що
агент говорив у зустрічі.

Локальні приєднання Chrome виконуються через авторизований браузерний профіль OpenClaw. Режим реального часу
потребує `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для
чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного
пристрою BlackHole достатньо для першого smoke test, але він може створювати відлуння.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM
лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть
вузловий хост у VM. Увімкніть вбудований Plugin у VM один раз, щоб вузол
оголошував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, провайдер
  реального часу та конфігурація Plugin Google Meet.
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

Якщо `<gateway-host>` є LAN IP і ви не використовуєте TLS, вузол відмовляється від
незашифрованого WebSocket, якщо ви явно не погодитеся для цієї довіреної приватної мережі:

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

Для однокомандного smoke test, який створює або повторно використовує сеанс, вимовляє відому
фразу та друкує стан сеансу:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час realtime-приєднання браузерна автоматизація OpenClaw заповнює ім’я гостя, натискає
Join/Ask to join і приймає перший вибір Meet "Use microphone", коли цей
запит з’являється. Під час observe-only приєднання або створення зустрічі лише через браузер вона
проходить повз той самий запит без мікрофона, коли такий вибір доступний.
Якщо профіль браузера не ввійшов в обліковий запис, Meet очікує допуску від організатора,
Chrome потребує дозволу на мікрофон/камеру для realtime-приєднання, або Meet застряг
на запиті, який автоматизація не змогла розв’язати, результат join/test-speech повідомляє
`manualActionRequired: true` з `manualActionReason` і
`manualActionMessage`. Агенти мають припинити повторні спроби приєднання, повідомити це точне
повідомлення разом із поточними `browserUrl`/`browserTitle`, і повторити спробу лише після
завершення ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw виконує автовибір лише тоді, коли рівно один
під’єднаний вузол оголошує і `googlemeet.chrome`, і керування браузером. Якщо
під’єднано кілька придатних вузлів, установіть `chromeNode.node` як id вузла,
відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `Configured Google Meet node ... is not usable: offline`: закріплений вузол
  відомий Gateway, але недоступний. Агенти мають трактувати цей вузол як
  діагностичний стан, а не як придатний Chrome-хост, і повідомляти про блокер налаштування
  замість переходу на інший транспорт, якщо користувач не просив цього.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  схваліть спарювання і переконайтеся, що `openclaw plugins enable google-meet` та
  `openclaw plugins enable browser` були виконані у VM. Також підтвердьте, що
  хост Gateway дозволяє обидві команди вузла за допомогою
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: установіть `blackhole-2ch` на хості,
  який перевіряється, і перезавантажтеся перед використанням локального аудіо Chrome.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch`
  у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або
  залиште `chrome.guestName` заданим для гостьового приєднання. Гостьове автоприєднання використовує браузерну
  автоматизацію OpenClaw через проксі браузера вузла; переконайтеся, що конфігурація браузера вузла
  вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або іменований профіль наявної сесії.
- Дублікати вкладок Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw
  активує наявну вкладку для того самого URL Meet перед відкриттям нової, а
  браузерне створення зустрічі повторно використовує поточну вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google перед відкриттям іншої.
- Немає аудіо: у Meet спрямовуйте мікрофон/динамік через шлях віртуального аудіопристрою,
  який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію в стилі Loopback
  для чистого двостороннього аудіо.

## Примітки щодо встановлення

Realtime-типовий режим Chrome використовує два зовнішні інструменти:

- `sox`: аудіоутиліта командного рядка. Plugin використовує явні команди CoreAudio
  для пристрою для типового аудіомоста 24 kHz PCM16.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`,
  через який Chrome/Meet можуть маршрутизувати звук.

OpenClaw не включає й не розповсюджує жоден із цих пакетів. Документація просить користувачів
встановлювати їх як залежності хоста через Homebrew. SoX ліцензовано як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole має ліцензію GPL-3.0. Якщо ви створюєте
інсталятор або appliance, який включає BlackHole разом з OpenClaw, перегляньте
умови ліцензування BlackHole від upstream або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL Meet через керування браузером OpenClaw і приєднується
як профіль браузера OpenClaw, що ввійшов в обліковий запис. На macOS Plugin перед запуском
перевіряє наявність `BlackHole 2ch`. Якщо налаштовано, він також запускає команду
перевірки стану аудіомоста і команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли
Chrome/audio працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/audio працюють
на спареному вузлі, наприклад Parallels macOS VM. Для локального Chrome виберіть
профіль через `browser.defaultProfile`; `chrome.browserProfile` передається хостам
`chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямовуйте аудіо мікрофона й динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування
замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це суворий план набору, делегований Plugin Voice Call. Він
не аналізує сторінки Meet для пошуку телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або потрібен резервний варіант
телефонного дозвону. Google Meet має показувати номер телефонного дозвону і PIN для
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
не з’являться в уже запущеному процесі Gateway, доки він не перезавантажиться.

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

OAuth необов’язковий для створення посилання Meet, бо `googlemeet create` може
відступити до браузерної автоматизації. Налаштуйте OAuth, коли потрібне офіційне створення через API,
розв’язання space або попередні перевірки Meet Media API.

Доступ до Google Meet API використовує користувацький OAuth: створіть OAuth-клієнт Google Cloud,
запросіть потрібні scopes, авторизуйте обліковий запис Google, а потім збережіть
отриманий refresh token у конфігурації Plugin Google Meet або надайте
змінні середовища `OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання Chrome. Транспорти Chrome і Chrome-node
досі приєднуються через профіль Chrome, що ввійшов в обліковий запис, BlackHole/SoX і під’єднаний
вузол, коли ви використовуєте браузерну участь. OAuth призначений лише для офіційного шляху
Google Meet API: створення meeting spaces, розв’язання spaces і виконання попередніх перевірок Meet Media API.

### Створення облікових даних Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** — найпростіше для організації Google Workspace.
   - **External** працює для особистих/тестових налаштувань; поки застосунок у Testing,
     додайте кожен обліковий запис Google, який авторизуватиме застосунок, як тестового користувача.
4. Додайте scopes, які запитує OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Створіть OAuth client ID.
   - Тип застосунку: **Web application**.
   - Авторизований redirect URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Скопіюйте client ID і client secret.

`meetings.space.created` потрібен Google Meet `spaces.create`.
`meetings.space.readonly` дає OpenClaw змогу розв’язувати URL/коди Meet у spaces.
`meetings.space.settings` дає OpenClaw змогу передавати налаштування `SpaceConfig`, такі як
`accessType`, під час створення кімнати через API.
`meetings.conference.media.readonly` призначений для попередньої перевірки Meet Media API і роботи з медіа;
Google може вимагати реєстрації Developer Preview для фактичного використання Media API.
Якщо вам потрібні лише браузерні приєднання Chrome, повністю пропустіть OAuth.

### Випуск refresh token

Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, або передайте їх як
змінні середовища, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда друкує конфігураційний блок `oauth` із refresh token. Вона використовує PKCE,
localhost callback на `http://localhost:8085/oauth2callback` і ручний
copy/paste flow з `--manual`.

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

Надавайте перевагу змінним середовища, якщо не хочете мати refresh token у конфігурації.
Якщо наявні і значення конфігурації, і значення середовища, Plugin спершу бере конфігурацію,
а потім використовує середовище як fallback.

Згода OAuth включає створення Meet space, доступ читання Meet space і доступ читання
медіа конференцій Meet. Якщо ви автентифікувалися до появи підтримки створення зустрічей,
повторно виконайте `openclaw googlemeet auth login --json`, щоб refresh token мав scope
`meetings.space.created`.

### Перевірка OAuth через doctor

Запустіть OAuth doctor, коли потрібна швидка перевірка стану без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує runtime Chrome і не потребує під’єднаного вузла Chrome. Воно
перевіряє, що конфігурація OAuth існує і що refresh token може випустити access
token. JSON-звіт містить лише поля стану, такі як `ok`, `configured`,
`tokenSource`, `expiresAt`, і повідомлення перевірок; він не друкує access
token, refresh token або client secret.

Поширені результати:

| Перевірка            | Значення                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `oauth-config`       | Наявні `oauth.clientId` плюс `oauth.refreshToken` або кешований access token.             |
| `oauth-token`        | Кешований access token досі чинний, або refresh token випустив новий access token.        |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` розв’язала наявний Meet space.                        |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий Meet space.                       |

Щоб також довести ввімкнення Google Meet API і scope `spaces.create`, запустіть
перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює тимчасову URL-адресу Meet. Використовуйте його, коли потрібно підтвердити,
що в проєкті Google Cloud увімкнено Meet API і що авторизований
обліковий запис має область доступу `meetings.space.created`.

Щоб підтвердити доступ на читання для наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` підтверджують доступ на читання до наявного
простору, до якого авторизований обліковий запис Google має доступ. `403` від цих перевірок
зазвичай означає, що Google Meet REST API вимкнено, погоджений refresh token
не має потрібної області доступу або обліковий запис Google не може отримати доступ до цього
простору Meet. Помилка refresh-token означає, що потрібно повторно виконати `openclaw googlemeet auth login
--json` і зберегти новий блок `oauth`.

Для резервного браузерного режиму облікові дані OAuth не потрібні. У цьому режимі Google
auth надходить із профілю Chrome з виконаним входом на вибраному вузлі, а не з
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

З `--meeting`, `artifacts` і `attendance` типово використовують найновіший запис конференції.
Передайте `--all-conference-records`, коли потрібні всі збережені записи
для цієї зустрічі.

Пошук у календарі може розв’язати URL-адресу зустрічі з Google Calendar перед читанням
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
входу OAuth, який включає область доступу Calendar events readonly.
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

Це викликає Google Meet `spaces.endActiveConference` і потребує OAuth з областю
`meetings.space.created` для простору, яким авторизований обліковий запис може керувати.
OpenClaw приймає URL-адресу Meet, код зустрічі або вхід `spaces/{id}` і розв’язує його
до ресурсу простору API перед завершенням активної конференції.
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
прапорцями запізнення/раннього виходу та об’єднаними дубльованими ресурсами учасників за користувачем
із виконаним входом або відображуваним ім’ям. Передайте `--no-merge-duplicates`, щоб залишити сирі ресурси учасників
окремими, `--late-after-minutes` для налаштування виявлення запізнення та
`--early-before-minutes` для налаштування виявлення раннього виходу.

`export` записує папку, що містить `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`.
`manifest.json` фіксує вибраний вхід, параметри експорту, записи конференцій,
вихідні файли, лічильники, джерело токена, подію Calendar, якщо її було використано, і будь-які
попередження про часткове отримання. Передайте `--zip`, щоб також записати переносний архів поруч
із папкою. Передайте `--include-doc-bodies`, щоб експортувати текст пов’язаних транскриптів і
розумних нотаток Google Docs через Google Drive `files.export`; для цього потрібен
новий вхід OAuth, який включає область доступу Drive Meet readonly. Без
`--include-doc-bodies` експорти містять лише метадані Meet і структуровані записи транскрипту.
Якщо Google повертає часткову помилку артефакта, наприклад помилку переліку розумних нотаток,
запису транскрипту або тіла документа Drive, зведення та
маніфест зберігають попередження замість того, щоб провалити весь експорт.
Використовуйте `--dry-run`, щоб отримати ті самі дані артефактів/відвідуваності та надрукувати
JSON маніфесту без створення папки чи ZIP. Це корисно перед записом
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

Установіть `"dryRun": true`, щоб повернути лише маніфест експорту та пропустити записи файлів.

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

Запустіть захищений live smoke проти реальної збереженої зустрічі:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Запустіть live браузерну пробу з пріоритетом прослуховування проти зустрічі, де хтось буде
говорити з доступними субтитрами Meet:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Середовище live smoke:

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
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Пошук у календарі
потребує `https://www.googleapis.com/auth/calendar.events.readonly`. Експорт тіла документа Drive
потребує
`https://www.googleapis.com/auth/drive.meet.readonly`.

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда друкує новий `meeting uri`, джерело та сеанс приєднання. З обліковими даними OAuth
вона використовує офіційний Google Meet API. Без облікових даних OAuth вона
використовує профіль браузера з виконаним входом закріпленого вузла Chrome як резервний варіант. Агенти можуть
використовувати інструмент `google_meet` з `action: "create"`, щоб створити й приєднатися за один
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

Якщо браузерний резервний режим натрапляє на вхід Google або блокування дозволу Meet до того, як
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
`manualActionMessage` разом із контекстом вузла/вкладки браузера та припинити відкривати нові
вкладки Meet, доки оператор не завершить браузерний крок.

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

Створення Meet типово приєднує до зустрічі. Транспорт Chrome або Chrome-node все одно
потребує профілю Google Chrome з виконаним входом, щоб приєднатися через браузер. Якщо
з профілю виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або
помилку браузерного резервного режиму й просить оператора завершити вхід Google перед
повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш проєкт Cloud,
OAuth principal і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Загальний realtime шлях Chrome потребує лише ввімкненого plugin, BlackHole, SoX
і ключа backend realtime постачальника голосу. OpenAI є типовим; установіть
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
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на екрані гостя Meet без входу в обліковий запис
- `chrome.autoJoin: true`: заповнення імені гостя та натискання Join Now за принципом best-effort через браузерну автоматизацію OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить, що вона в дзвінку, перш ніж буде запущено вступ у режимі realtime
- `chrome.audioFormat: "pcm16-24khz"`: аудіоформат command-pair. Використовуйте `"g711-ulaw-8khz"` лише для застарілих/користувацьких command pairs, які все ще видають телефонний звук.
- `chrome.audioInputCommand`: команда SoX, що читає з CoreAudio `BlackHole 2ch` і записує звук у `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX, що читає звук у `chrome.audioFormat` і записує в CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: необов’язкова команда локального мікрофона, яка записує підписаний 16-бітний little-endian моно PCM для виявлення людського втручання, поки відтворення асистента активне. Наразі це застосовується до command-pair bridge `chrome`, розміщеного на Gateway.
- `chrome.bargeInRmsThreshold: 650`: рівень RMS, що вважається людським перериванням на `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: піковий рівень, що вважається людським перериванням на `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: мінімальна затримка між повторними очищеннями людського переривання
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді з `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли realtime bridge підключається; задайте `""`, щоб приєднатися тихо
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

`voiceCall.enabled` типово має значення `true`; із транспортом Twilio він делегує фактичний PSTN-дзвінок, DTMF і вступне привітання Plugin Voice Call. Voice Call відтворює послідовність DTMF перед відкриттям realtime media stream, а потім використовує збережений вступний текст як початкове realtime-привітання. Якщо `voice-call` не ввімкнено, Google Meet усе ще може перевірити й записати план набору, але не може здійснити дзвінок Twilio.

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

Використовуйте `transport: "chrome"`, коли Chrome працює на хості Gateway. Використовуйте `transport: "chrome-node"`, коли Chrome працює на спареному вузлі, наприклад у Parallels VM. В обох випадках realtime-модель і `openclaw_agent_consult` працюють на хості Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сеанси або перевірити ідентифікатор сеансу. Використовуйте `action: "speak"` із `sessionId` і `message`, щоб realtime-агент негайно заговорив. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сеанс, запустити відому фразу й повернути стан `inCall`, коли хост Chrome може про нього повідомити. `test_speech` завжди примусово задає `mode: "realtime"` і завершується помилкою, якщо його просять працювати в `mode: "transcribe"`, оскільки сеанси лише для спостереження навмисно не можуть видавати мовлення. Його результат `speechOutputVerified` базується на збільшенні байтів вихідного realtime-аудіо під час цього тестового виклику, тому повторно використаний сеанс зі старішим аудіо не вважається свіжою успішною перевіркою мовлення. Використовуйте `action: "leave"`, щоб позначити сеанс як завершений.

`status` містить стан Chrome, коли він доступний:

- `inCall`: Chrome, схоже, перебуває всередині дзвінка Meet
- `micMuted`: стан мікрофона Meet за принципом best-effort
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профіль браузера потребує ручного входу, допуску хостом Meet, дозволів або виправлення керування браузером, перш ніж мовлення зможе працювати
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: чи дозволене кероване мовлення Chrome зараз. `speechReady: false` означає, що OpenClaw не надіслав вступну/тестову фразу в audio bridge.
- `providerConnected` / `realtimeReady`: стан realtime voice bridge
- `lastInputAt` / `lastOutputAt`: останній звук, отриманий із bridge або надісланий до нього
- `lastSuppressedInputAt` / `suppressedInputBytes`: loopback-вхід, проігнорований, поки відтворення асистента активне

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Консультація realtime-агента

Режим Chrome realtime оптимізовано для живого голосового циклу. Realtime voice provider чує аудіо зустрічі й говорить через налаштований audio bridge. Коли realtime-моделі потрібні глибше міркування, актуальна інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw у фоновому режимі з контекстом нещодавньої транскрипції зустрічі та повертає стислу усну відповідь realtime-голосовому сеансу. Потім голосова модель може озвучити цю відповідь назад у зустріч. Він використовує той самий спільний інструмент realtime-консультації, що й Voice Call.

Типово консультації запускаються для агента `main`. Задайте `realtime.agentId`, коли канал Meet має консультувати спеціалізований робочий простір агента OpenClaw, типові налаштування моделі, політику інструментів, пам’ять і історію сеансу.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: надати інструмент консультації та обмежити звичайного агента до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`.
- `owner`: надати інструмент консультації та дозволити звичайному агенту використовувати звичайну політику інструментів агента.
- `none`: не надавати інструмент консультації realtime-голосовій моделі.

Ключ сеансу консультації обмежений кожним сеансом Meet, тому подальші виклики консультації можуть повторно використовувати попередній контекст консультації під час тієї самої зустрічі.

Щоб примусово запустити усну перевірку готовності після того, як Chrome повністю приєднався до дзвінка:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повної smoke-перевірки join-and-speak:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Чекліст live-тесту

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
- `googlemeet setup` містить `chrome-node-connected`, коли Chrome-node є типовим транспортом або вузол закріплено.
- `nodes status` показує вибраний вузол як підключений.
- Вибраний вузол оголошує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до дзвінка, а `test-speech` повертає стан Chrome із `inCall: true`.

Для віддаленого хоста Chrome, наприклад Parallels macOS VM, це найкоротша безпечна перевірка після оновлення Gateway або VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Це підтверджує, що Plugin Gateway завантажено, вузол VM підключений із поточним токеном, а Meet audio bridge доступний, перш ніж агент відкриє вкладку реальної зустрічі.

Для smoke-перевірки Twilio використовуйте зустріч, яка надає телефонні дані для набору:

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
- Повернутий сеанс має `transport: "twilio"` і `twilio.voiceCallId`.
- `openclaw logs --follow` показує, що DTMF TwiML віддано перед realtime TwiML, а потім realtime bridge із початковим привітанням у черзі.
- `googlemeet leave <sessionId>` завершує делегований голосовий дзвінок.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Переконайтеся, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно відредагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway. Запущений агент бачить лише інструменти Plugin, зареєстровані поточним процесом Gateway.

На хостах Gateway не під macOS агентський інструмент `google_meet` залишається видимим, але локальні дії Chrome realtime блокуються до того, як вони потраплять в audio bridge. Локальне realtime-аудіо Chrome наразі залежить від macOS `BlackHole 2ch`, тому Linux-агентам слід використовувати `mode: "transcribe"`, набір Twilio або хост macOS `chrome-node` замість типового локального шляху Chrome realtime.

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

Вузол має бути підключений і містити `googlemeet.chrome` плюс `browser.proxy`. Конфігурація Gateway має дозволяти ці команди вузла:

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

Потім перезавантажте службу вузла й повторно запустіть:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Браузер відкривається, але агент не може приєднатися

Запустіть `googlemeet test-listen` для приєднань лише для спостереження або `googlemeet test-speech` для realtime-приєднань, а потім перегляньте повернутий стан Chrome. Якщо будь-яка з перевірок повідомляє `manualActionRequired: true`, покажіть `manualActionMessage` оператору й припиніть повторні спроби, доки дію в браузері не буде завершено.

Типові ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису хоста Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’явиться власний запит дозволу Chrome.
- Закрити або виправити завислий діалог дозволів Meet.

Не повідомляйте "not signed in" лише тому, що Meet показує "Do you want people to
hear you in the meeting?" Це проміжний екран вибору аудіо в Meet; OpenClaw
натискає **Use microphone** через браузерну автоматизацію, коли це доступно, і
продовжує чекати справжній стан зустрічі. Для резервного браузерного режиму лише створення OpenClaw
може натиснути **Continue without microphone**, оскільки для створення URL не потрібен
шлях аудіо в реальному часі.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує endpoint Google Meet API `spaces.create`,
коли налаштовано облікові дані OAuth. Без облікових даних OAuth він переходить
до закріпленого браузера Chrome node. Перевірте:

- Для створення через API: `oauth.clientId` і `oauth.refreshToken` налаштовані,
  або наявні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було згенеровано після додавання
  підтримки створення. У старіших токенах може бракувати scope `meetings.space.created`; повторно запустіть
  `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для резервного браузерного режиму: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений node з `browser.proxy` і
  `googlemeet.chrome`.
- Для резервного браузерного режиму: профіль OpenClaw Chrome на цьому node увійшов
  у Google і може відкрити `https://meet.google.com/new`.
- Для резервного браузерного режиму: повторні спроби повторно використовують наявну вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google перед відкриттям нової вкладки. Якщо агент вичерпав час очікування,
  повторіть виклик інструмента, а не відкривайте вручну ще одну вкладку Meet.
- Для резервного браузерного режиму: якщо інструмент повертає `manualActionRequired: true`, використовуйте
  повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і
  `manualActionMessage`, щоб скерувати оператора. Не повторюйте спроби в циклі, доки цю
  дію не буде завершено.
- Для резервного браузерного режиму: якщо Meet показує "Do you want people to hear you in the
  meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для
  резервного режиму лише створення, **Continue without microphone** через браузерну
  автоматизацію і продовжити чекати згенерований URL Meet. Якщо це неможливо, у
  помилці має згадуватися `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте шлях у реальному часі:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "realtime"` для прослуховування/відповіді голосом. `mode: "transcribe"` навмисно
не запускає двосторонній голосовий міст у реальному часі. Для налагодження лише спостереження
запустіть `openclaw googlemeet status --json <session-id>` після того, як учасники заговорять,
і перевірте `captioning`, `transcriptLines` та `lastCaptionText`. Якщо `inCall` дорівнює
true, але `transcriptLines` залишається `0`, субтитри Meet можуть бути вимкнені, ніхто
не говорив після встановлення спостерігача, інтерфейс Meet змінився або живі
субтитри недоступні для мови/облікового запису цієї зустрічі.

`googlemeet test-speech` завжди перевіряє шлях у реальному часі та повідомляє, чи
було зафіксовано вихідні байти моста для цього виклику. Якщо `speechOutputVerified` дорівнює false і
`speechOutputTimedOut` дорівнює true, провайдер реального часу міг прийняти
висловлювання, але OpenClaw не побачив, що нові вихідні байти дійшли до аудіо
моста Chrome.

Також перевірте:

- Ключ провайдера реального часу доступний на хості Gateway, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `sox` існує на хості Chrome.
- Мікрофон і динамік Meet спрямовані через віртуальний аудіошлях, який використовує
  OpenClaw.

`googlemeet doctor [session-id]` виводить сесію, node, стан перебування у виклику,
причину ручної дії, підключення провайдера реального часу, `realtimeReady`, активність
аудіовходу/аудіовиходу, останні аудіо timestamp-и, лічильники байтів і URL браузера.
Використовуйте `googlemeet status [session-id] --json`, коли потрібен сирий JSON. Використовуйте
`googlemeet doctor --oauth`, коли потрібно перевірити refresh Google Meet OAuth
без розкриття токенів; додайте `--meeting` або `--create-space`, коли також потрібен
доказ Google Meet API.

Якщо агент вичерпав час очікування, а ви бачите, що вкладку Meet уже відкрито, перевірте цю вкладку
без відкриття ще однієї:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує та перевіряє
наявну вкладку Meet для вибраного транспорту. З `chrome` вона використовує локальне
керування браузером через Gateway; з `chrome-node` вона використовує налаштований
Chrome node. Вона не відкриває нову вкладку і не створює нову сесію; вона повідомляє про
поточний блокер, наприклад вхід, допуск, дозволи або стан вибору аудіо.
Команда CLI взаємодіє з налаштованим Gateway, тому Gateway має бути запущений;
`chrome-node` також потребує підключення Chrome node.

### Перевірки налаштування Twilio не проходять

`twilio-voice-call-plugin` завершується помилкою, коли `voice-call` не дозволений або не ввімкнений.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` завершується помилкою, коли в backend Twilio бракує account
SID, auth token або номера абонента. Задайте їх на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` завершується помилкою, коли `voice-call` не має публічного webhook
доступу або коли `publicUrl` вказує на loopback чи простір приватної мережі.
Встановіть `plugins.entries.voice-call.config.publicUrl` на URL публічного провайдера або
налаштуйте тунель/Tailscale exposure для `voice-call`.

Loopback і приватні URL не є дійсними для callback-ів оператора зв'язку. Не використовуйте
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

Для локальної розробки використовуйте тунель або Tailscale exposure замість приватного
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

`voicecall smoke` за замовчуванням перевіряє лише готовність. Щоб виконати dry-run для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли навмисно хочете здійснити живий вихідний notify
виклик:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Виклик Twilio починається, але ніколи не входить у зустріч

Переконайтеся, що подія Meet надає дані телефонного dial-in. Передайте точний dial-in
номер і PIN або користувацьку DTMF-послідовність:

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
  call ID, чи було поставлено DTMF у чергу та чи було запитано вступне привітання.
- Запустіть `openclaw voicecall status --call-id <id>` і підтвердьте, що виклик досі
  активний.
- Запустіть `openclaw voicecall tail` і перевірте, що webhooks Twilio надходять до
  Gateway.
- Запустіть `openclaw logs --follow` і шукайте послідовність Twilio Meet: Google
  Meet делегує приєднання, Voice Call запускає телефонну гілку, Google Meet чекає
  `voiceCall.dtmfDelayMs`, надсилає DTMF через `voicecall.dtmf`, чекає
  `voiceCall.postDtmfSpeechDelayMs`, потім запитує вступне мовлення через
  `voicecall.speak`.
- Повторно запустіть `openclaw googlemeet setup --transport twilio`; зелена перевірка налаштування є
  обов'язковою, але не доводить, що PIN-послідовність зустрічі правильна.
- Переконайтеся, що dial-in номер належить до того самого запрошення Meet і регіону, що й
  PIN.
- Збільште `voiceCall.dtmfDelayMs`, якщо Meet відповідає повільно або транскрипт виклику
  все ще показує запит на PIN після надсилання DTMF.
- Якщо учасник приєднується, але ви не чуєте привітання, перевірте
  `openclaw logs --follow` на наявність post-DTMF запиту `voicecall.speak` і
  або відтворення TTS через media-stream, або резервного Twilio `<Say>`. Якщо транскрипт виклику
  все ще містить "enter the meeting PIN", телефонна гілка ще не приєдналася
  до кімнати Meet, тому учасники зустрічі не почують мовлення.

Якщо webhooks не надходять, спочатку налагодьте Plugin Voice Call: провайдер має
досягати `plugins.entries.voice-call.config.publicUrl` або налаштованого тунелю.
Див. [Усунення несправностей голосових викликів](/uk/plugins/voice-call#troubleshooting).

## Примітки

Офіційний media API Google Meet орієнтований на отримання, тому для мовлення в Meet
виклику все одно потрібен шлях учасника. Цей Plugin робить цю межу видимою:
Chrome обробляє участь у браузері та локальну маршрутизацію аудіо; Twilio обробляє
участь через телефонний dial-in.

Режим Chrome realtime потребує `BlackHole 2ch` плюс одне з наведеного:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw володіє
  мостом моделі реального часу та передає аудіо у `chrome.audioFormat` між цими
  командами й вибраним провайдером голосу реального часу. Типовий шлях Chrome —
  24 kHz PCM16; 8 kHz G.711 mu-law залишається доступним для legacy пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда моста володіє всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого daemon.

Для чистого двостороннього аудіо спрямовуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може повертати аудіо інших учасників назад у виклик.

З командною парою Chrome bridge `chrome.bargeInInputCommand` може слухати
окремий локальний мікрофон і очищати відтворення асистента, коли людина починає
говорити. Це тримає людське мовлення попереду виходу асистента, навіть коли спільний
BlackHole loopback input тимчасово приглушено під час відтворення асистента.
Як і `chrome.audioInputCommand` та `chrome.audioOutputCommand`, це
локальна команда, налаштована оператором. Використовуйте явний довірений шлях команди або
список аргументів і не вказуйте на скрипти з недовірених розташувань.

`googlemeet speak` запускає активний аудіоміст реального часу для сесії Chrome.
`googlemeet leave` зупиняє цей міст. Для сесій Twilio, делегованих
через Plugin Voice Call, `leave` також завершує базовий голосовий виклик.
Використовуйте `googlemeet end-active-conference`, коли також потрібно закрити активну
конференцію Google Meet для простору, керованого через API.

## Пов'язане

- [Plugin голосового виклику](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення Plugin](/uk/plugins/building-plugins)
