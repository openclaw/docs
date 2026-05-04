---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий дзвінок Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Google Meet Plugin: приєднання за явними URL-адресами Meet через Chrome або Twilio зі стандартними налаштуваннями зворотного мовлення агента'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-04T02:43:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 79d04eb50b157863cce9b03f1195ae01628f21966267485df1e489c843e55826
    source_path: plugins/google-meet.md
    workflow: 16
---

Підтримка учасника Google Meet для OpenClaw — plugin навмисно є явним за задумом:

- Він приєднується лише до явної URL-адреси `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися до
  поверненої URL-адреси.
- `agent` є типовим режимом зворотного мовлення: транскрибування в реальному часі слухає,
  налаштований агент OpenClaw відповідає, а звичайний OpenClaw TTS говорить у Meet.
- `bidi` залишається доступним як резервний режим прямої голосової моделі реального часу.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `agent` для живого
  прослуховування/зворотного мовлення, `bidi` для прямого резервного голосового режиму реального часу або `transcribe`
  для приєднання/керування браузером без моста зворотного мовлення.
- Автентифікація починається як особистий Google OAuth або вже виконаний вхід у профілі Chrome.
- Автоматичного оголошення згоди немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на спареному Node-хості.
- Twilio приймає номер для дозвону плюс необов'язковий PIN або DTMF-послідовність; він
  не може напряму набирати URL Meet.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших
  робочих процесів агентських телеконференцій.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте провайдера транскрибування в реальному часі
плюс звичайний OpenClaw TTS. OpenAI є типовим провайдером транскрибування;
Google Gemini Live також працює з `realtime.provider: "google"` для
режиму `bidi`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` установлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор Homebrew
потребує перезавантаження, перш ніж macOS покаже пристрій:

```bash
sudo reboot
```

Після перезавантаження перевірте обидві частини:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Увімкніть plugin:

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
закріплення Node, а для приєднань Chrome у реальному часі — про аудіоміст
BlackHole/SoX і відкладені перевірки вступу в реальному часі. Для приєднань лише для спостереження перевірте той самий
транспорт за допомогою `--mode transcribe`; цей режим пропускає передумови аудіо реального часу,
бо він не слухає через міст і не говорить через нього:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Коли налаштовано делегування Twilio, налаштування також повідомляє, чи готові
plugin `voice-call`, облікові дані Twilio та публічна доступність Webhook.
Вважайте будь-яку перевірку `ok: false` блокером для перевірених транспорту й режиму
перед тим, як просити агента приєднатися. Використовуйте `openclaw googlemeet setup --json` для
скриптів або машинозчитуваного виводу. Використовуйте `--transport chrome`,
`--transport chrome-node` або `--transport twilio`, щоб попередньо перевірити конкретний
транспорт перед спробою агента.

Для Twilio завжди явно попередньо перевіряйте транспорт, коли типовим транспортом
є Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Це виявляє відсутнє з'єднання з `voice-call`, облікові дані Twilio або недосяжну
публічну доступність Webhook до того, як агент спробує набрати зустріч.

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

Інструмент `google_meet` для агентів залишається доступним на хостах не з macOS для
артефактів, календаря, налаштування, транскрибування, Twilio та потоків `chrome-node`. Дії локального
зворотного мовлення Chrome там заблоковані, бо вбудований аудіошлях Chrome
наразі залежить від macOS `BlackHole 2ch`. У Linux використовуйте `mode: "transcribe"`,
дозвін Twilio або macOS `chrome-node`-хост для участі Chrome зі зворотним мовленням.

Створити нову зустріч і приєднатися до неї:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Для кімнат, створених API, використовуйте Google Meet `SpaceConfig.accessType`, коли хочете,
щоб політика кімнати без стуку була явною, а не успадкованою з типових налаштувань
облікового запису Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` дозволяє будь-кому з URL Meet приєднатися без стуку. `TRUSTED` дозволяє
довіреним користувачам організації хоста, запрошеним зовнішнім користувачам і користувачам
дозвону приєднуватися без стуку. `RESTRICTED` обмежує вхід без стуку запрошеними. Ці
налаштування застосовуються лише до офіційного шляху створення Google Meet API, тому облікові дані
OAuth мають бути налаштовані.

Якщо ви автентифікували Google Meet до появи цієї опції, повторно запустіть
`openclaw googlemeet auth login --json` після додавання області
`meetings.space.settings` на екран згоди Google OAuth.

Створити лише URL без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це
  найбільш детермінований шлях, який не залежить від стану інтерфейсу браузера.
- Резервний браузерний шлях: використовується, коли облікові дані OAuth відсутні. OpenClaw використовує
  закріплений Chrome Node, відкриває `https://meet.google.com/new`, чекає, доки Google
  перенаправить на справжню URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Цей шлях потребує,
  щоб у профілі Chrome OpenClaw на Node вже був виконаний вхід у Google.
  Браузерна автоматизація обробляє власний запит Meet першого запуску для мікрофона; цей запит
  не вважається помилкою входу в Google.
  Потоки приєднання та створення також намагаються повторно використати наявну вкладку Meet перед відкриттям
  нової. Зіставлення ігнорує нешкідливі рядки запиту URL, як-от `authuser`, тож
  повторна спроба агента має сфокусувати вже відкриту зустріч замість створення другої
  вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` типово приєднується до нової зустрічі та
повертає `joined: true` плюс сесію приєднання. Щоб лише створити URL,
використовуйте `create --no-join` у CLI або передайте `"join": false` в інструмент.

Або скажіть агенту: "Створи Google Meet, приєднайся до нього в режимі зворотного мовлення агента
та надішли мені посилання." Агент має викликати `google_meet` з
`action: "create"`, а потім поділитися поверненим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Для приєднання лише для спостереження/керування браузером задайте `"mode": "transcribe"`. Це
не запускає дуплексний голосовий міст реального часу, не потребує BlackHole або SoX
і не говоритиме у відповідь у зустрічі. Приєднання Chrome у цьому режимі також уникають
надання дозволу OpenClaw на мікрофон/камеру та уникають шляху Meet **Use
microphone**. Якщо Meet показує проміжний екран вибору аудіо, автоматизація намагається
обрати шлях без мікрофона, а інакше повідомляє про ручну дію замість відкриття
локального мікрофона. У режимі transcribe керовані транспорти Chrome також установлюють
best-effort спостерігач субтитрів Meet. `googlemeet status --json` і
`googlemeet doctor` показують `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
і короткий хвіст `recentTranscript`, щоб оператори могли зрозуміти, чи браузер
приєднався до дзвінка та чи субтитри Meet створюють текст.
Використовуйте `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, коли
потрібна перевірка так/ні: він приєднується в режимі transcribe, чекає на новий рух субтитрів або
транскрипту та повертає `listenVerified`, `listenTimedOut`, поля ручної
дії та останній стан субтитрів.

Під час сесій реального часу статус `google_meet` містить стан браузера й аудіомоста,
як-от `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, останні часові мітки вводу/виводу,
лічильники байтів і стан закриття моста. Якщо з'являється безпечний запит сторінки Meet,
браузерна автоматизація обробляє його, коли може. Вхід, допуск хостом і
запити дозволів браузера/ОС повідомляються як ручна дія з причиною та
повідомленням, яке агент має передати. Керовані сесії Chrome відтворюють вступну або
тестову фразу лише після того, як стан браузера повідомляє `inCall: true`; інакше статус повідомляє
`speechReady: false`, а спроба мовлення блокується замість удавання, ніби
агент говорив у зустріч.

Локальні приєднання Chrome проходять через профіль браузера OpenClaw із виконаним входом. Режим реального часу
потребує `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для
чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного
пристрою BlackHole достатньо для першого smoke-тесту, але він може давати відлуння.

### Локальний Gateway + Chrome у Parallels

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM
лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть
Node-хост у VM. Увімкніть вбудований plugin у VM один раз, щоб Node
оголошував команду Chrome:

Що де працює:

- Gateway-хост: OpenClaw Gateway, робоча область агента, ключі моделі/API, провайдер реального часу
  і конфігурація Google Meet plugin.
- Parallels macOS VM: OpenClaw CLI/Node-хост, Google Chrome, SoX, BlackHole 2ch
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

Установіть або оновіть OpenClaw у VM, а потім увімкніть там вбудований plugin:

```bash
openclaw plugins enable google-meet
```

Запустіть Node-хост у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` є LAN IP і ви не використовуєте TLS, Node відмовляє
незашифрованому WebSocket, якщо ви явно не погодитеся для цієї довіреної приватної мережі:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Використовуйте ту саму змінну середовища під час встановлення Node як LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це середовище процесу, а не налаштування
`openclaw.json`. `openclaw node install` зберігає його в середовищі LaunchAgent,
коли воно присутнє в команді встановлення.

Схваліть Node з Gateway-хоста:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить Node і що він оголошує як `googlemeet.chrome`,
так і можливість браузера/`browser.proxy`:

```bash
openclaw nodes status
```

Спрямуйте Meet через цей Node на Gateway-хості:

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

Тепер приєднуйтеся звичайно з Gateway-хоста:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

або попросіть агента використати інструмент `google_meet` з `transport: "chrome-node"`.

Для smoke-тесту однією командою, який створює або повторно використовує сесію, вимовляє відому
фразу та друкує стан сесії:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час realtime-приєднання браузерна автоматизація OpenClaw заповнює ім’я гостя, натискає
Приєднатися/Попросити приєднатися та приймає вибір першого запуску Meet "Використовувати мікрофон", коли така
підказка з’являється. Під час приєднання лише для спостереження або створення зустрічі лише через браузер вона
проходить ту саму підказку без мікрофона, коли такий вибір доступний.
Якщо браузерний профіль не ввійшов в обліковий запис, Meet очікує допуску від організатора,
Chrome потребує дозволу на мікрофон/камеру для realtime-приєднання, або Meet застряг
на підказці, яку автоматизація не змогла обробити, результат join/test-speech повідомляє
`manualActionRequired: true` з `manualActionReason` і
`manualActionMessage`. Агенти мають припинити повторювати приєднання, повідомити це точне
повідомлення разом із поточними `browserUrl`/`browserTitle` і повторити спробу лише після завершення
ручної дії у браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає лише тоді, коли рівно один
підключений Node оголошує і `googlemeet.chrome`, і керування браузером. Якщо
підключено кілька придатних Node, задайте `chromeNode.node` як id Node,
відображуване ім’я або віддалену IP-адресу.

Типові перевірки помилок:

- `Configured Google Meet node ... is not usable: offline`: закріплений Node
  відомий Gateway, але недоступний. Агенти мають трактувати цей Node як
  діагностичний стан, а не як придатний хост Chrome, і повідомляти блокер налаштування
  замість переходу на інший транспорт, якщо користувач цього не просив.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  схваліть сполучення та переконайтеся, що у VM виконано
  `openclaw plugins enable google-meet` і
  `openclaw plugins enable browser`. Також підтвердьте, що хост
  Gateway дозволяє обидві команди Node через
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: установіть `blackhole-2ch` на хості,
  що перевіряється, і перезавантажтеся перед використанням локального аудіо Chrome.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch`
  у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у браузерний профіль усередині VM або
  залиште `chrome.guestName` заданим для гостьового приєднання. Гостьове автоприєднання використовує
  браузерну автоматизацію OpenClaw через браузерний проксі Node; переконайтеся, що конфігурація браузера
  Node вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або іменований профіль наявного сеансу.
- Дубльовані вкладки Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw
  активує наявну вкладку для того самого URL Meet перед відкриттям нової, а
  браузерне створення зустрічі повторно використовує вкладку з незавершеним `https://meet.google.com/new`
  або підказкою облікового запису Google перед відкриттям іншої.
- Немає аудіо: у Meet спрямуйте мікрофон/динамік через шлях віртуального аудіопристрою,
  який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію в стилі Loopback
  для чистого дуплексного аудіо.

## Нотатки щодо встановлення

Типове зворотне мовлення Chrome використовує два зовнішні інструменти:

- `sox`: аудіоутиліта командного рядка. Plugin використовує явні команди пристроїв CoreAudio
  для типового аудіомоста 24 кГц PCM16.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`,
  через який Chrome/Meet може маршрутизувати аудіо.

OpenClaw не комплектує і не розповсюджує жоден із цих пакетів. Документація просить користувачів
установити їх як залежності хоста через Homebrew. SoX ліцензовано як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole має ліцензію GPL-3.0. Якщо ви створюєте
інсталятор або appliance, який комплектує BlackHole з OpenClaw, перегляньте
умови ліцензування BlackHole від upstream або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL Meet через керування браузером OpenClaw і приєднується
як браузерний профіль OpenClaw, що ввійшов в обліковий запис. На macOS Plugin перевіряє наявність
`BlackHole 2ch` перед запуском. Якщо налаштовано, він також запускає команду перевірки стану
аудіомоста та команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли
Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють
на сполученому Node, як-от Parallels macOS VM. Для локального Chrome виберіть
профіль через `browser.defaultProfile`; `chrome.browserProfile` передається
хостам `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона й динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування
замість мовчазного приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план набору, делегований Plugin Voice Call. Він
не аналізує сторінки Meet для пошуку телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або потрібен резервний варіант
телефонного дозвону. Google Meet має надати номер телефонного дозвону та PIN для
зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

Увімкніть Plugin Voice Call на хості Gateway, а не на Node Chrome:

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

Надайте облікові дані Twilio через середовище або конфігурацію. Середовище утримує
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

## OAuth і попередня перевірка

OAuth необов’язковий для створення посилання Meet, тому що `googlemeet create` може
перейти на браузерну автоматизацію. Налаштуйте OAuth, коли потрібне офіційне створення через API,
розв’язання просторів або попередні перевірки Meet Media API.

Доступ до Google Meet API використовує користувацький OAuth: створіть OAuth-клієнт Google Cloud,
запросіть потрібні scopes, авторизуйте обліковий запис Google, потім збережіть
отриманий refresh token у конфігурації Plugin Google Meet або надайте
змінні середовища `OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання Chrome. Транспорти Chrome і Chrome-node
так само приєднуються через профіль Chrome, що ввійшов в обліковий запис, BlackHole/SoX і підключений
Node, коли ви використовуєте браузерну участь. OAuth призначений лише для офіційного
шляху Google Meet API: створення просторів зустрічей, розв’язання просторів і виконання
попередніх перевірок Meet Media API.

### Створіть облікові дані Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** — найпростіший варіант для організації Google Workspace.
   - **External** працює для особистих/тестових налаштувань; поки застосунок у Testing,
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
`meetings.space.readonly` дає OpenClaw змогу розв’язувати URL/коди Meet у простори.
`meetings.space.settings` дає OpenClaw змогу передавати параметри `SpaceConfig`, як-от
`accessType`, під час створення кімнати через API.
`meetings.conference.media.readonly` призначено для попередньої перевірки Meet Media API та медіароботи;
Google може вимагати реєстрації в Developer Preview для фактичного використання Media API.
Якщо вам потрібні лише браузерні приєднання Chrome, повністю пропустіть OAuth.

### Випустіть refresh token

Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, або передайте їх як
змінні середовища, потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда друкує конфігураційний блок `oauth` із refresh token. Вона використовує PKCE,
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
Якщо присутні і значення конфігурації, і значення середовища, Plugin спершу використовує конфігурацію,
а потім fallback до середовища.

Згода OAuth охоплює створення просторів Meet, доступ на читання до просторів Meet і доступ
на читання до медіа конференцій Meet. Якщо ви автентифікувалися до появи підтримки
створення зустрічей, повторно виконайте `openclaw googlemeet auth login --json`, щоб refresh
token мав scope `meetings.space.created`.

### Перевірте OAuth через doctor

Запустіть OAuth doctor, коли потрібна швидка перевірка стану без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує runtime Chrome і не вимагає підключеного Node Chrome. Команда
перевіряє, що конфігурація OAuth існує і що refresh token може випустити access
token. JSON-звіт містить лише поля стану, як-от `ok`, `configured`,
`tokenSource`, `expiresAt`, і повідомлення перевірок; він не друкує access
token, refresh token або client secret.

Типові результати:

| Перевірка            | Значення                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Наявний `oauth.clientId` плюс `oauth.refreshToken` або кешований access token.          |
| `oauth-token`        | Кешований access token ще дійсний, або refresh token випустив новий access token.       |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` розв’язала наявний простір Meet.                    |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий простір Meet.                  |

Щоб також підтвердити ввімкнення Google Meet API і scope `spaces.create`, запустіть
перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює одноразову URL-адресу Meet. Використовуйте його, коли потрібно підтвердити,
що в проєкті Google Cloud увімкнено Meet API і що авторизований
обліковий запис має область доступу `meetings.space.created`.

Щоб підтвердити доступ на читання для наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` підтверджують доступ на читання до наявного
простору, до якого авторизований обліковий запис Google має доступ. `403` від цих перевірок
зазвичай означає, що Google Meet REST API вимкнено, узгодженому токену оновлення
бракує потрібної області доступу або обліковий запис Google не має доступу до цього простору
Meet. Помилка токена оновлення означає, що потрібно повторно виконати `openclaw googlemeet auth login
--json` і зберегти новий блок `oauth`.

Для резервного варіанта через браузер облікові дані OAuth не потрібні. У цьому режимі автентифікація Google
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

`--today` шукає в сьогоднішньому календарі `primary` подію Calendar з
посиланням Google Meet. Використовуйте `--event <query>` для пошуку відповідного тексту події та
`--calendar <id>` для неосновного календаря. Пошук у календарі потребує нового
входу OAuth, який включає область доступу лише для читання подій Calendar.
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

Це викликає Google Meet `spaces.endActiveConference` і потребує OAuth з
областю доступу `meetings.space.created` для простору, яким авторизований обліковий запис може керувати.
OpenClaw приймає URL-адресу Meet, код зустрічі або вхід `spaces/{id}` і розв’язує його
до ресурсу простору API перед завершенням активної конференції.
Це окремо від `googlemeet leave`: `leave` зупиняє локальну/сеансову
участь OpenClaw, а `end-active-conference` просить Google Meet завершити активну
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
який увійшов, або відображуваним іменем. Передайте `--no-merge-duplicates`, щоб залишити необроблені ресурси
учасників окремими, `--late-after-minutes`, щоб налаштувати виявлення запізнень, і
`--early-before-minutes`, щоб налаштувати виявлення раннього виходу.

`export` записує папку, що містить `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`.
`manifest.json` фіксує вибраний вхід, параметри експорту, записи конференції,
вихідні файли, лічильники, джерело токена, подію Calendar, якщо її було використано, і будь-які
попередження про часткове отримання. Передайте `--zip`, щоб також записати портативний архів поряд
із папкою. Передайте `--include-doc-bodies`, щоб експортувати текст пов’язаних транскриптів і
розумних нотаток Google Docs через Google Drive `files.export`; для цього потрібен
новий вхід OAuth, який включає область доступу Drive Meet лише для читання. Без
`--include-doc-bodies` експорт містить лише метадані Meet і структуровані записи транскрипту.
Якщо Google повертає часткову помилку артефакту, як-от помилку списку розумних нотаток,
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

Установіть `"dryRun": true`, щоб повернути лише маніфест експорту та пропустити запис файлів.

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

Для перевірки з пріоритетом прослуховування агенти мають використовувати `test_listen`, перш ніж заявляти, що
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

Запустіть live браузерну перевірку з пріоритетом прослуховування проти зустрічі, де хтось
говоритиме з доступними субтитрами Meet:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Live smoke середовище:

- `OPENCLAW_LIVE_TEST=1` вмикає захищені live тести.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` вказує на збережену URL-адресу Meet, код або
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID` надає
  ідентифікатор клієнта OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN` надає
  токен оновлення.
- Необов’язково: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` і
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` використовують ті самі резервні назви
  без префікса `OPENCLAW_`.

Базовий live smoke для артефактів/відвідуваності потребує
`https://www.googleapis.com/auth/meetings.space.readonly` і
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Пошук у календарі
потребує `https://www.googleapis.com/auth/calendar.events.readonly`. Експорт
тіла документа Drive потребує
`https://www.googleapis.com/auth/drive.meet.readonly`.

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда друкує нові `meeting uri`, джерело та сеанс приєднання. З обліковими даними OAuth
вона використовує офіційний Google Meet API. Без облікових даних OAuth вона
використовує профіль браузера з виконаним входом закріпленого вузла Chrome як резервний варіант. Агенти можуть
використовувати інструмент `google_meet` з `action: "create"`, щоб створити й приєднатися за один
крок. Для створення лише URL передайте `"join": false`.

Приклад JSON-виводу з резервного варіанта через браузер:

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

Якщо резервний варіант через браузер натрапляє на вхід Google або блокування дозволів Meet до того, як
зможе створити URL-адресу, метод Gateway повертає невдалу відповідь, а
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

Створення Meet за замовчуванням приєднує до зустрічі. Транспорт Chrome або Chrome-node все одно
потребує профілю Google Chrome з виконаним входом, щоб приєднатися через браузер. Якщо
з профілю виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або
помилку резервного варіанта через браузер і просить оператора завершити вхід Google перед
повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
проєкт, суб’єкт OAuth і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Загальний шлях агента Chrome потребує лише ввімкненого plugin, BlackHole, SoX,
ключа провайдера транскрипції в реальному часі та налаштованого провайдера TTS OpenClaw.
OpenAI є провайдером транскрипції за замовчуванням; установіть `realtime.provider: "google"`,
щоб використовувати Google Gemini Live для режиму `bidi`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Налаштуйте конфігурацію plugin у `plugins.entries.google-meet.config`:

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
  сумісний псевдонім для `"agent"`; нові виклики інструментів мають указувати `"agent"`)
- `chromeNode.node`: необов’язковий id/ім’я/IP Node для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на екрані
  гостя Meet без входу в обліковий запис
- `chrome.autoJoin: true`: найкраща спроба заповнити ім’я гостя й натиснути Join Now
  через браузерну автоматизацію OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить, що вона у виклику,
  перш ніж буде запущено вступну фразу зворотного мовлення
- `chrome.audioFormat: "pcm16-24khz"`: аудіоформат пари команд. Використовуйте
  `"g711-ulaw-8khz"` лише для застарілих/користувацьких пар команд, які досі видають
  телефонний звук.
- `chrome.audioBufferBytes: 4096`: буфер обробки SoX для згенерованих аудіокоманд
  пари команд Chrome. Це половина стандартного буфера SoX у 8192 байти,
  що зменшує типову затримку каналу, залишаючи можливість збільшити її на зайнятих хостах.
  Значення нижче мінімуму SoX обмежуються 17 байтами.
- `chrome.audioInputCommand`: команда SoX, що читає з CoreAudio `BlackHole 2ch`
  і записує аудіо у `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX, що читає аудіо у `chrome.audioFormat`
  і записує в CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: необов’язкова команда локального мікрофона, яка записує
  16-бітний little-endian моно PCM зі знаком для виявлення втручання людини, поки
  активне відтворення асистента. Наразі це застосовується до розміщеного на Gateway
  мосту пари команд `chrome`.
- `chrome.bargeInRmsThreshold: 650`: RMS-рівень, що вважається людським
  перериванням на `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: піковий рівень, що вважається людським
  перериванням на `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: мінімальна затримка між повторними очищеннями
  людського переривання
- `mode: "agent"`: типовий режим зворотного мовлення. Мовлення учасника транскрибується
  налаштованим провайдером realtime-транскрипції, надсилається налаштованому
  агенту OpenClaw у сесії підагентa для окремої зустрічі й озвучується через
  звичайний runtime OpenClaw TTS.
- `mode: "bidi"`: резервний прямий двонапрямний режим realtime-моделі. Провайдер
  realtime-голосу відповідає на мовлення учасника напряму й може викликати
  `openclaw_agent_consult` для глибших відповідей або відповідей із підтримкою інструментів.
- `mode: "transcribe"`: режим лише спостереження без мосту зворотного мовлення.
- `realtime.provider: "openai"`: id провайдера, який режим `agent` використовує для realtime
  транскрипції, а режим `bidi` — для realtime-голосу.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли realtime-міст
  підключається; установіть `""`, щоб приєднатися мовчки
- `realtime.agentId`: необов’язковий id агента OpenClaw для
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

`voiceCall.enabled` типово має значення `true`; з транспортом Twilio він делегує
фактичний виклик PSTN, DTMF і вступне привітання Plugin Voice Call. Voice Call
відтворює послідовність DTMF перед відкриттям realtime медіапотоку, а потім використовує
збережений вступний текст як початкове realtime привітання. Якщо `voice-call` не
увімкнено, Google Meet усе ще може перевірити й записати план набору, але не може
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
`transport: "chrome-node"`, коли Chrome працює на спареному Node, наприклад у Parallels
VM. В обох випадках провайдери моделей і `openclaw_agent_consult` працюють на
хості Gateway, тож облікові дані моделей залишаються там. Із типовим `mode: "agent"`
провайдер realtime-транскрипції відповідає за прослуховування, налаштований агент OpenClaw
створює відповідь, а звичайний OpenClaw TTS озвучує її в Meet. Використовуйте
`mode: "bidi"`, коли потрібно, щоб realtime-голосова модель відповідала напряму.
Сире `mode: "realtime"` і далі приймається як застарілий сумісний псевдонім для
`mode: "agent"`, але більше не рекламується в схемі інструмента агента.

Використовуйте `action: "status"`, щоб перелічити активні сесії або переглянути ID сесії. Використовуйте
`action: "speak"` із `sessionId` і `message`, щоб realtime-агент
заговорив негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сесію,
запустити відому фразу й повернути стан `inCall`, коли хост Chrome може
про нього повідомити. `test_speech` завжди примусово встановлює `mode: "agent"` і завершується помилкою, якщо його просять
працювати в `mode: "transcribe"`, бо сесії лише спостереження навмисно не можуть
видавати мовлення. Його результат `speechOutputVerified` базується на збільшенні байтів realtime аудіовиходу
під час цього тестового виклику, тому повторно використана сесія зі старішим аудіо
не зараховується як свіжа успішна перевірка мовлення. Використовуйте `action: "leave"`, щоб позначити
сесію завершеною.

`status` містить стан Chrome, коли він доступний:

- `inCall`: схоже, Chrome перебуває всередині виклику Meet
- `micMuted`: найкраща спроба визначити стан мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профілю
  браузера потрібні ручний вхід, допуск хостом Meet, дозволи або
  відновлення керування браузером, перш ніж мовлення зможе працювати
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: чи
  дозволено кероване мовлення Chrome зараз. `speechReady: false` означає, що OpenClaw не
  надіслав вступну/тестову фразу в аудіоміст.
- `providerConnected` / `realtimeReady`: стан realtime голосового мосту
- `lastInputAt` / `lastOutputAt`: останнє аудіо, отримане з мосту або надіслане до нього
- `audioOutputRouted` / `audioOutputDeviceLabel`: чи медіавивід вкладки Meet
  був активно спрямований на пристрій BlackHole, який використовує міст
- `lastSuppressedInputAt` / `suppressedInputBytes`: local loopback вхід, проігнорований під час
  активного відтворення асистента

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Режими Agent і Bidi

Режим Chrome `agent` оптимізовано для поведінки «мій агент присутній на зустрічі». Провайдер
realtime-транскрипції чує аудіо зустрічі, фінальні транскрипти учасників
спрямовуються через налаштованого агента OpenClaw, а відповідь
озвучується через звичайний runtime OpenClaw TTS. Установіть `mode: "bidi"`, коли потрібно,
щоб realtime-голосова модель відповідала напряму.
Сусідні фінальні фрагменти транскрипта об’єднуються перед консультацією, щоб один усний
хід не створював кілька застарілих часткових відповідей. Realtime вхід також
приглушується, поки поставлене в чергу аудіо асистента ще відтворюється,
а нещодавні схожі на асистентські відлуння транскрипта ігноруються перед консультацією агента,
щоб local loopback BlackHole не змушував агента відповідати на власне мовлення.

| Режим   | Хто визначає відповідь        | Шлях виводу мовлення                   | Коли використовувати                                  |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | Налаштований агент OpenClaw   | Звичайний runtime OpenClaw TTS         | Потрібна поведінка «мій агент присутній на зустрічі» |
| `bidi`  | Realtime-голосова модель      | Аудіовідповідь realtime-голосового провайдера | Потрібен голосовий діалоговий цикл із найнижчою затримкою |

У режимі `bidi`, коли realtime-моделі потрібні глибше міркування, актуальна
інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw за лаштунками з контекстом
нещодавнього транскрипта зустрічі й повертає стислу усну відповідь. У режимі `agent`
OpenClaw надсилає цю відповідь напряму в runtime TTS; у режимі `bidi`
realtime-голосова модель може озвучити результат консультації назад у зустріч. Він використовує
той самий спільний механізм консультації, що й Voice Call.

Типово консультації виконуються для агента `main`. Установіть `realtime.agentId`, коли
доріжка Meet має консультуватися з виділеним робочим простором агента OpenClaw, типовими налаштуваннями моделі,
політикою інструментів, пам’яттю та історією сесії.

Консультації в режимі агента використовують ключ сесії `agent:<id>:subagent:google-meet:<session>`
для кожної зустрічі, щоб подальші запитання зберігали контекст зустрічі й водночас успадковували звичайну
політику агента від налаштованого агента.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: надати інструмент консультації й обмежити звичайного агента
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: надати інструмент консультації й дозволити звичайному агенту використовувати звичайну
  політику інструментів агента.
- `none`: не надавати інструмент консультації realtime-голосовій моделі.

Ключ сесії консультації обмежено сесією Meet, тому подальші виклики консультації
можуть повторно використовувати попередній контекст консультації під час тієї самої зустрічі.

Щоб примусово запустити усну перевірку готовності після того, як Chrome повністю приєднався до виклику:

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
- `googlemeet setup` містить `chrome-node-connected`, коли Chrome-node є
  типовим транспортом або Node закріплено.
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
вкладку справжньої зустрічі.

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
- Повернений сеанс має `transport: "twilio"` і `twilio.voiceCallId`.
- `openclaw logs --follow` показує, що DTMF TwiML віддано перед realtime TwiML, а потім
  realtime-міст із поставленим у чергу початковим привітанням.
- `googlemeet leave <sessionId>` завершує делегований голосовий виклик.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно відредагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway.
Запущений агент бачить лише інструменти Plugin, зареєстровані поточним процесом
Gateway.

На хостах Gateway не з macOS інструмент `google_meet`, видимий агенту, залишається доступним,
але локальні дії Chrome talk-back блокуються до потрапляння в аудіоміст.
Локальний Chrome talk-back audio наразі залежить від macOS `BlackHole 2ch`, тому
агенти Linux мають використовувати `mode: "transcribe"`, Twilio dial-in або хост macOS
`chrome-node` замість стандартного шляху локального агента Chrome.

### Немає підключеного Node із підтримкою Google Meet

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

Node має бути підключений і показувати `googlemeet.chrome` разом із `browser.proxy`.
Конфігурація Gateway має дозволяти ці команди Node:

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
`gateway token mismatch`, перевстановіть або перезапустіть Node з поточним токеном Gateway.
Для LAN Gateway це зазвичай означає:

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

Запустіть `googlemeet test-listen` для приєднань лише для спостереження або `googlemeet test-speech`
для realtime-приєднань, а потім перевірте повернений стан Chrome. Якщо будь-яка перевірка
повідомляє `manualActionRequired: true`, покажіть `manualActionMessage` оператору
і припиніть повторні спроби, доки дія в браузері не буде завершена.

Типові ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису хоста Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’явиться нативний запит дозволів
  Chrome.
- Закрити або виправити завислий діалог дозволів Meet.

Не повідомляйте "not signed in" лише тому, що Meet показує "Do you want people to
hear you in the meeting?" Це проміжний екран вибору аудіо Meet; OpenClaw
натискає **Use microphone** через автоматизацію браузера, коли це доступно, і продовжує
чекати на справжній стан зустрічі. Для резервного варіанта браузера лише для створення OpenClaw
може натиснути **Continue without microphone**, оскільки створення URL не потребує
realtime-аудіошляху.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує endpoint Google Meet API `spaces.create`,
коли налаштовано облікові дані OAuth. Без облікових даних OAuth він переходить до
резервного браузера закріпленого Chrome Node. Підтвердьте:

- Для створення через API: налаштовано `oauth.clientId` і `oauth.refreshToken`,
  або наявні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було створено після додавання підтримки
  створення. Старішим токенам може бракувати scope `meetings.space.created`; повторно виконайте
  `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для резервного варіанта браузера: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений Node із `browser.proxy` і
  `googlemeet.chrome`.
- Для резервного варіанта браузера: профіль OpenClaw Chrome на цьому Node увійшов
  у Google і може відкрити `https://meet.google.com/new`.
- Для резервного варіанта браузера: повторні спроби повторно використовують наявну вкладку
  `https://meet.google.com/new` або вкладку запиту облікового запису Google перед відкриттям нової вкладки. Якщо агент отримує timeout,
  повторіть виклик інструмента, а не відкривайте вручну іншу вкладку Meet.
- Для резервного варіанта браузера: якщо інструмент повертає `manualActionRequired: true`, використовуйте
  повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і
  `manualActionMessage`, щоб зорієнтувати оператора. Не повторюйте спроби в циклі, доки цю
  дію не завершено.
- Для резервного варіанта браузера: якщо Meet показує "Do you want people to hear you in the
  meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для
  резервного варіанта лише для створення, **Continue without microphone** через автоматизацію
  браузера і продовжити чекати на згенерований URL Meet. Якщо це неможливо, у
  помилці має згадуватися `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте realtime-шлях:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "agent"` для звичайного шляху STT -> агент OpenClaw -> TTS talk-back,
або `mode: "bidi"` для прямого резервного realtime-голосу. `mode: "transcribe"`
навмисно не запускає міст talk-back. Для налагодження лише спостереження
запустіть `openclaw googlemeet status --json <session-id>` після того, як учасники заговорять,
і перевірте `captioning`, `transcriptLines` і `lastCaptionText`. Якщо `inCall` дорівнює
true, але `transcriptLines` залишається `0`, субтитри Meet можуть бути вимкнені, ніхто
не говорив після встановлення спостерігача, UI Meet змінився або живі
субтитри недоступні для мови/облікового запису зустрічі.

`googlemeet test-speech` завжди перевіряє realtime-шлях і повідомляє, чи
було помічено вихідні байти мосту для цього виклику. Якщо `speechOutputVerified` дорівнює false і
`speechOutputTimedOut` дорівнює true, realtime-провайдер міг прийняти
висловлювання, але OpenClaw не побачив, щоб нові вихідні байти дійшли до аудіомоста
Chrome.

Також перевірте:

- На хості Gateway доступний ключ realtime-провайдера, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `sox` існує на хості Chrome.
- Мікрофон і динамік Meet маршрутизуються через віртуальний аудіошлях, який використовує
  OpenClaw. `doctor` має показувати `meet output routed: yes` для локальних realtime-приєднань
  Chrome.

`googlemeet doctor [session-id]` виводить сеанс, Node, стан у виклику,
причину ручної дії, підключення realtime-провайдера, `realtimeReady`, активність
аудіовходу/виходу, останні часові мітки аудіо, лічильники байтів і URL браузера.
Використовуйте `googlemeet status [session-id] --json`, коли потрібен сирий JSON. Використовуйте
`googlemeet doctor --oauth`, коли потрібно перевірити Google Meet OAuth refresh
без розкриття токенів; додайте `--meeting` або `--create-space`, коли також потрібен
доказ Google Meet API.

Якщо агент отримав timeout і ви бачите вже відкриту вкладку Meet, перевірте цю вкладку
без відкриття іншої:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує та перевіряє
наявну вкладку Meet для вибраного транспорту. З `chrome` вона використовує локальне
керування браузером через Gateway; з `chrome-node` вона використовує налаштований
Chrome Node. Вона не відкриває нову вкладку і не створює новий сеанс; вона повідомляє
поточний блокер, наприклад вхід, допуск, дозволи або стан вибору аудіо.
Команда CLI звертається до налаштованого Gateway, тому Gateway має бути запущений;
`chrome-node` також вимагає, щоб Chrome Node був підключений.

### Не проходять перевірки налаштування Twilio

`twilio-voice-call-plugin` не проходить, коли `voice-call` не дозволено або не ввімкнено.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` не проходить, коли backend Twilio не має account
SID, auth token або caller number. Задайте їх на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` не проходить, коли `voice-call` не має публічного Webhook
exposure або коли `publicUrl` вказує на local loopback чи приватний мережевий простір.
Задайте `plugins.entries.voice-call.config.publicUrl` як URL публічного провайдера або
налаштуйте tunnel/Tailscale exposure для `voice-call`.

Loopback і приватні URL не є дійсними для carrier callbacks. Не використовуйте
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

Для локальної розробки використовуйте tunnel або Tailscale exposure замість приватного
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

`voicecall smoke` за замовчуванням перевіряє лише готовність. Щоб dry-run для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли навмисно хочете здійснити живий outbound notify
call:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Виклик Twilio починається, але ніколи не входить у зустріч

Підтвердьте, що подія Meet надає дані телефонного dial-in. Передайте точний dial-in
номер і PIN або власну послідовність DTMF:

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

- Виконайте `openclaw googlemeet doctor <session-id>`, щоб підтвердити делегований ID виклику Twilio, чи було поставлено DTMF у чергу та чи було запитано вступне привітання.
- Виконайте `openclaw voicecall status --call-id <id>` і підтвердьте, що виклик усе ще активний.
- Виконайте `openclaw voicecall tail` і перевірте, що webhooks Twilio надходять до Gateway.
- Виконайте `openclaw logs --follow` і знайдіть послідовність Twilio Meet: Google Meet делегує приєднання, Voice Call запускає телефонну гілку, Google Meet очікує `voiceCall.dtmfDelayMs`, надсилає DTMF через `voicecall.dtmf`, очікує `voiceCall.postDtmfSpeechDelayMs`, а потім запитує вступне мовлення через `voicecall.speak`.
- Повторно виконайте `openclaw googlemeet setup --transport twilio`; успішна перевірка налаштування обов’язкова, але вона не доводить, що послідовність PIN зустрічі правильна.
- Підтвердьте, що номер для телефонного підключення належить до того самого запрошення Meet і регіону, що й PIN.
- Збільште `voiceCall.dtmfDelayMs`, якщо Meet відповідає повільно або транскрипт виклику все ще показує запит на введення PIN після надсилання DTMF.
- Якщо учасник приєднується, але ви не чуєте привітання, перевірте `openclaw logs --follow` на наявність post-DTMF запиту `voicecall.speak` і або відтворення TTS через медіапотік, або резервний Twilio `<Say>`. Якщо транскрипт виклику все ще містить "enter the meeting PIN", телефонна гілка ще не приєдналася до кімнати Meet, тому учасники зустрічі не почують мовлення.

Якщо webhooks не надходять, спершу діагностуйте плагін Voice Call: провайдер має досягати `plugins.entries.voice-call.config.publicUrl` або налаштованого тунелю. Див. [усунення несправностей голосових викликів](/uk/plugins/voice-call#troubleshooting).

## Примітки

Офіційний медіа-API Google Meet орієнтований на отримання, тому мовлення в виклик Meet усе ще потребує шляху учасника. Цей плагін робить цю межу видимою: Chrome обробляє участь через браузер і маршрутизацію локального аудіо; Twilio обробляє участь через телефонне підключення.

Режими talk-back Chrome потребують `BlackHole 2ch` плюс один із варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw володіє мостом і передає аудіо у форматі `chrome.audioFormat` між цими командами та вибраним провайдером. Режим агента використовує транскрипцію в реальному часі плюс звичайний TTS; режим bidi використовує голосового провайдера в реальному часі. Стандартний шлях Chrome — 24 kHz PCM16 із `chrome.audioBufferBytes: 4096`; 8 kHz G.711 mu-law залишається доступним для застарілих пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда моста володіє всім локальним аудіошляхом і має завершитися після запуску або перевірки свого демона. Це допустимо лише для `bidi`, оскільки режим `agent` потребує прямого доступу до пари команд для TTS.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний пристрій BlackHole може повертати аудіо інших учасників назад у виклик.

З командно-парним мостом Chrome `chrome.bargeInInputCommand` може слухати окремий локальний мікрофон і очищати відтворення асистента, коли людина починає говорити. Це утримує людське мовлення попереду виводу асистента, навіть коли спільний вхід loopback BlackHole тимчасово приглушений під час відтворення асистента. Як і `chrome.audioInputCommand` та `chrome.audioOutputCommand`, це локальна команда, налаштована оператором. Використовуйте явний довірений шлях до команди або список аргументів і не спрямовуйте її на скрипти з недовірених розташувань.

`googlemeet speak` запускає активний аудіоміст talk-back для сеансу Chrome. `googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих через плагін Voice Call, `leave` також завершує базовий голосовий виклик. Використовуйте `googlemeet end-active-conference`, коли також потрібно закрити активну конференцію Google Meet для простору, керованого API.

## Пов’язане

- [Плагін голосових викликів](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення плагінів](/uk/plugins/building-plugins)
