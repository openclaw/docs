---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до виклику Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий дзвінок Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт для Google Meet
summary: 'Plugin Google Meet: підключення за явними URL-адресами Meet через Chrome або Twilio з типовими налаштуваннями зворотного мовлення агента'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-04T06:40:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4268ad895bbf83d649b9571c0888c27eb982ad9710dfb408f22f7818cdc5dbcb
    source_path: plugins/google-meet.md
    workflow: 16
---

Підтримка учасника Google Meet для OpenClaw — Plugin навмисно явний за дизайном:

- Він приєднується лише до явної URL-адреси `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися до
  поверненої URL-адреси.
- `agent` — стандартний режим зворотної відповіді: транскрипція в реальному часі слухає,
  налаштований агент OpenClaw відповідає, а звичайний OpenClaw TTS говорить у Meet.
- `bidi` залишається доступним як резервний режим прямої голосової моделі в реальному часі.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `agent` для живого
  прослуховування/зворотної відповіді, `bidi` для прямого резервного голосового режиму в реальному часі або `transcribe`,
  щоб приєднатися/керувати браузером без мосту зворотної відповіді.
- Автентифікація починається як особистий Google OAuth або вже ввійдений профіль Chrome.
- Автоматичного оголошення згоди немає.
- Стандартний аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на спареному вузловому хості.
- Twilio приймає номер для набору плюс необов’язковий PIN або DTMF-послідовність; він
  не може напряму набрати URL Meet.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших агентських
  телеконференц-процесів.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте провайдера транскрипції в реальному часі
плюс звичайний OpenClaw TTS. OpenAI є стандартним провайдером транскрипції;
Google Gemini Live також працює як окремий голосовий резерв `bidi` з
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
прив’язування вузла та, для приєднань Chrome у реальному часі, аудіоміст BlackHole/SoX
і відкладені перевірки вступу в реальному часі. Для приєднань лише для спостереження перевірте той самий
транспорт із `--mode transcribe`; цей режим пропускає передумови аудіо в реальному часі,
оскільки він не слухає через міст і не говорить через нього:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Коли налаштовано делегування Twilio, налаштування також повідомляє, чи готові
Plugin `voice-call`, облікові дані Twilio та публічне Webhook-експонування.
Розглядайте будь-яку перевірку `ok: false` як блокер для перевіреного транспорту й режиму,
перш ніж просити агента приєднатися. Використовуйте `openclaw googlemeet setup --json` для
скриптів або машинозчитуваного виводу. Використовуйте `--transport chrome`,
`--transport chrome-node` або `--transport twilio`, щоб попередньо перевірити конкретний
транспорт до того, як агент його спробує.

Для Twilio завжди явно попередньо перевіряйте транспорт, коли стандартний транспорт
— Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Це виявляє відсутнє підключення `voice-call`, облікові дані Twilio або недоступне
Webhook-експонування до того, як агент спробує набрати зустріч.

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

Агентський інструмент `google_meet` залишається доступним на хостах не macOS для
артефактів, календаря, налаштування, транскрипції, Twilio та потоків `chrome-node`. Локальні
дії зворотної відповіді Chrome там заблоковано, бо вбудований аудіошлях Chrome
нині залежить від macOS `BlackHole 2ch`. У Linux використовуйте `mode: "transcribe"`,
набір Twilio або хост macOS `chrome-node` для участі Chrome зі зворотною відповіддю.

Створити нову зустріч і приєднатися до неї:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Для кімнат, створених API, використовуйте Google Meet `SpaceConfig.accessType`, коли хочете,
щоб політика входу без стуку кімнати була явною, а не успадкованою зі стандартів Google
акаунта:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` дозволяє будь-кому з URL Meet приєднатися без стуку. `TRUSTED` дозволяє
довіреним користувачам організації хоста, запрошеним зовнішнім користувачам і користувачам набору
приєднуватися без стуку. `RESTRICTED` обмежує вхід без стуку запрошеними. Ці
налаштування застосовуються лише до офіційного шляху створення Google Meet API, тож облікові дані OAuth
мають бути налаштовані.

Якщо ви автентифікували Google Meet до появи цієї опції, повторно запустіть
`openclaw googlemeet auth login --json` після додавання області
`meetings.space.settings` на екран згоди Google OAuth.

Створити лише URL без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це
  найдетермінованіший шлях, який не залежить від стану UI браузера.
- Резерв браузера: використовується, коли облікові дані OAuth відсутні. OpenClaw використовує
  прив’язаний вузол Chrome, відкриває `https://meet.google.com/new`, чекає, доки Google
  перенаправить на справжній URL із кодом зустрічі, а потім повертає цей URL. Цей шлях вимагає,
  щоб профіль OpenClaw Chrome на вузлі вже був увійдений у Google.
  Автоматизація браузера обробляє власний початковий запит Meet на мікрофон; цей запит
  не вважається помилкою входу Google.
  Потоки приєднання й створення також намагаються повторно використати наявну вкладку Meet перед відкриттям
  нової. Зіставлення ігнорує нешкідливі рядки запиту URL, як-от `authuser`, тож
  повторна спроба агента має сфокусувати вже відкриту зустріч замість створення другої
  вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` за замовчуванням приєднується до нової зустрічі й
повертає `joined: true` плюс сеанс приєднання. Щоб лише створити URL, використовуйте
`create --no-join` у CLI або передайте `"join": false` інструменту.

Або скажіть агенту: "Створи Google Meet, приєднайся до нього в режимі агентської зворотної відповіді
й надішли мені посилання." Агент має викликати `google_meet` з
`action: "create"`, а потім поділитися поверненим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Для приєднання лише для спостереження/керування браузером установіть `"mode": "transcribe"`. Це не
запускає дуплексний голосовий міст у реальному часі, не потребує BlackHole або SoX
і не говоритиме назад у зустріч. Приєднання Chrome у цьому режимі також уникають
надання дозволу OpenClaw на мікрофон/камеру й уникають шляху Meet **Use
microphone**. Якщо Meet показує проміжний екран вибору аудіо, автоматизація пробує
шлях без мікрофона, а інакше повідомляє про ручну дію замість відкриття
локального мікрофона. У режимі транскрипції керовані транспорти Chrome також встановлюють
найкращий можливий спостерігач субтитрів Meet. `googlemeet status --json` і
`googlemeet doctor` показують `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
і короткий хвіст `recentTranscript`, щоб оператори могли зрозуміти, чи браузер
приєднався до дзвінка й чи субтитри Meet створюють текст.
Використовуйте `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, коли
потрібна перевірка так/ні: він приєднується в режимі транскрипції, чекає на свіжий рух субтитрів або
транскрипту й повертає `listenVerified`, `listenTimedOut`, поля ручної
дії та найновіший стан субтитрів.

Під час сеансів у реальному часі статус `google_meet` містить стан браузера й аудіомоста,
як-от `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, останні вхідні/вихідні
часові мітки, лічильники байтів і стан закриття мосту. Якщо з’являється безпечний запит сторінки Meet,
автоматизація браузера обробляє його, коли може. Вхід, допуск хостом і
запити дозволів браузера/ОС повідомляються як ручна дія з причиною та
повідомленням, яке агент має передати. Керовані сеанси Chrome відтворюють вступ або
тестову фразу лише після того, як стан браузера повідомить `inCall: true`; інакше статус повідомляє
`speechReady: false`, а спробу мовлення заблоковано замість удавання, що
агент говорив у зустріч.

Локальні приєднання Chrome використовують увійдений профіль браузера OpenClaw. Режим реального часу
потребує `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для
чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного
пристрою BlackHole достатньо для першого smoke-тесту, але він може давати відлуння.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ model API всередині macOS VM
лише для того, щоб VM володіла Chrome. Запустіть Gateway і агент локально, а потім запустіть
вузловий хост у VM. Увімкніть вбудований Plugin на VM один раз, щоб вузол
оголошував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі model/API, провайдер реального часу
  і конфігурація Google Meet Plugin.
- Parallels macOS VM: OpenClaw CLI/вузловий хост, Google Chrome, SoX, BlackHole 2ch,
  і профіль Chrome, увійдений у Google.
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

Якщо `<gateway-host>` — LAN IP і ви не використовуєте TLS, вузол відхиляє
відкритий WebSocket, якщо ви явно не погодитеся на цю довірену приватну мережу:

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

Для smoke-тесту однією командою, який створює або повторно використовує сеанс, промовляє відому
фразу й друкує стан сеансу:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час realtime-приєднання автоматизація браузера OpenClaw заповнює ім’я гостя, натискає Join/Ask to join і приймає перший вибір Meet "Use microphone", коли з’являється цей запит. Під час приєднання лише для спостереження або створення зустрічі лише через браузер вона проходить той самий запит без мікрофона, коли такий вибір доступний. Якщо профіль браузера не ввійшов в обліковий запис, Meet очікує допуску від організатора, Chrome потребує дозволу на мікрофон/камеру для realtime-приєднання або Meet застряг на запиті, який автоматизація не змогла розв’язати, результат join/test-speech повідомляє `manualActionRequired: true` з `manualActionReason` і `manualActionMessage`. Агенти мають припинити повторні спроби приєднання, повідомити саме це повідомлення разом із поточними `browserUrl`/`browserTitle` і повторити спробу лише після завершення ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає лише тоді, коли рівно один підключений Node оголошує і `googlemeet.chrome`, і керування браузером. Якщо підключено кілька придатних Node, встановіть `chromeNode.node` як ідентифікатор Node, відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `Configured Google Meet node ... is not usable: offline`: закріплений Node відомий Gateway, але недоступний. Агенти мають розглядати цей Node як діагностичний стан, а не як придатний Chrome-хост, і повідомляти про блокер налаштування замість переходу на інший транспорт, якщо користувач цього не просив.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM, схваліть сполучення та переконайтеся, що у VM виконано `openclaw plugins enable google-meet` і `openclaw plugins enable browser`. Також підтвердьте, що хост Gateway дозволяє обидві команди Node через `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: установіть `blackhole-2ch` на хості, який перевіряється, і перезавантажтеся перед використанням локального аудіо Chrome.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch` у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або залиште `chrome.guestName` заданим для гостьового приєднання. Гостьове автоматичне приєднання використовує автоматизацію браузера OpenClaw через проксі браузера Node; переконайтеся, що конфігурація браузера Node вказує на потрібний профіль, наприклад `browser.defaultProfile: "user"` або на іменований профіль наявного сеансу.
- Дублікати вкладок Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw активує наявну вкладку для тієї самої URL-адреси Meet перед відкриттям нової, а створення зустрічі в браузері повторно використовує поточну вкладку `https://meet.google.com/new` або вкладку запиту облікового запису Google перед відкриттям іншої.
- Немає аудіо: у Meet спрямовуйте аудіо мікрофона/динаміка через шлях віртуального аудіопристрою, який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію у стилі Loopback для чистого дуплексного аудіо.

## Примітки щодо встановлення

Типове зворотне мовлення Chrome використовує два зовнішні інструменти:

- `sox`: аудіоутиліта командного рядка. Plugin використовує явні команди пристрою CoreAudio для типового аудіомоста PCM16 24 кГц.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`, через який Chrome/Meet може маршрутизувати аудіо.

OpenClaw не комплектує й не розповсюджує жоден із цих пакетів. Документація просить користувачів установити їх як залежності хоста через Homebrew. SoX ліцензовано як `LGPL-2.0-only AND GPL-2.0-only`; BlackHole має GPL-3.0. Якщо ви створюєте інсталятор або appliance, який комплектує BlackHole з OpenClaw, перегляньте умови ліцензування upstream BlackHole або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet через керування браузером OpenClaw і приєднується як профіль браузера OpenClaw, що ввійшов в обліковий запис. На macOS Plugin перевіряє наявність `BlackHole 2ch` перед запуском. Якщо налаштовано, він також запускає команду перевірки справності аудіомоста та команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють на сполученому Node, наприклад у Parallels macOS VM. Для локального Chrome виберіть профіль через `browser.defaultProfile`; `chrome.browserProfile` передається хостам `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямовуйте аудіо мікрофона й динаміка Chrome через локальний аудіоміст OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це суворий план набору, делегований Voice Call Plugin. Він не аналізує сторінки Meet для пошуку телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або потрібен резервний телефонний набір. Google Meet має надати номер телефонного набору та PIN для зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

Увімкніть Voice Call Plugin на хості Gateway, а не на Chrome Node:

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

Надайте облікові дані Twilio через середовище або конфігурацію. Середовище не дає секретам потрапити в `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Натомість використовуйте `realtime.provider: "openai"` з OpenAI provider Plugin і `OPENAI_API_KEY`, якщо це ваш realtime-провайдер голосу.

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни конфігурації Plugin не з’являються у вже запущеному процесі Gateway, доки він не перезавантажиться.

Потім перевірте:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Коли делегування Twilio під’єднано, `googlemeet setup` включає успішні перевірки `twilio-voice-call-plugin`, `twilio-voice-call-credentials` і `twilio-voice-call-webhook`.

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

OAuth необов’язковий для створення посилання Meet, оскільки `googlemeet create` може перейти на автоматизацію браузера. Налаштуйте OAuth, коли потрібне офіційне створення через API, розв’язання просторів або попередні перевірки Meet Media API.

Доступ до Google Meet API використовує користувацький OAuth: створіть OAuth-клієнт Google Cloud, запросіть потрібні scopes, авторизуйте обліковий запис Google, а потім збережіть отриманий refresh token у конфігурації Google Meet Plugin або надайте змінні середовища `OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання через Chrome. Транспорти Chrome і Chrome-node все ще приєднуються через профіль Chrome, що ввійшов в обліковий запис, BlackHole/SoX і підключений Node, коли ви використовуєте участь через браузер. OAuth призначений лише для офіційного шляху Google Meet API: створення просторів зустрічей, розв’язання просторів і запуск попередніх перевірок Meet Media API.

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
5. Створіть ідентифікатор OAuth-клієнта.
   - Тип застосунку: **Web application**.
   - Авторизований URI перенаправлення:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Скопіюйте ідентифікатор клієнта та секрет клієнта.

`meetings.space.created` потрібен Google Meet `spaces.create`.
`meetings.space.readonly` дає OpenClaw змогу розв’язувати URL-адреси/коди Meet у простори.
`meetings.space.settings` дає OpenClaw змогу передавати налаштування `SpaceConfig`, наприклад `accessType`, під час створення кімнати через API.
`meetings.conference.media.readonly` призначений для попередньої перевірки Meet Media API і роботи з медіа; Google може вимагати реєстрації в Developer Preview для фактичного використання Media API. Якщо вам потрібні лише приєднання Chrome на основі браузера, повністю пропустіть OAuth.

### Випуск refresh token

Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, або передайте їх як змінні середовища, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда друкує конфігураційний блок `oauth` з refresh token. Вона використовує PKCE, localhost callback на `http://localhost:8085/oauth2callback` і ручний потік copy/paste з `--manual`.

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

Збережіть об’єкт `oauth` у конфігурації Google Meet Plugin:

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

Віддавайте перевагу змінним середовища, коли не хочете, щоб refresh token був у конфігурації. Якщо наявні і значення конфігурації, і значення середовища, Plugin спочатку розв’язує конфігурацію, а потім використовує середовище як fallback.

Згода OAuth включає створення просторів Meet, доступ на читання просторів Meet і доступ на читання медіа конференцій Meet. Якщо ви автентифікувалися до появи підтримки створення зустрічей, повторно виконайте `openclaw googlemeet auth login --json`, щоб refresh token мав scope `meetings.space.created`.

### Перевірка OAuth через doctor

Запустіть OAuth doctor, коли потрібна швидка перевірка справності без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує runtime Chrome і не потребує підключеного Chrome Node. Він перевіряє, що конфігурація OAuth існує і що refresh token може випустити access token. JSON-звіт містить лише поля стану, як-от `ok`, `configured`, `tokenSource`, `expiresAt`, і повідомлення перевірок; він не друкує access token, refresh token або секрет клієнта.

Поширені результати:

| Перевірка            | Значення                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Наявні `oauth.clientId` плюс `oauth.refreshToken` або кешований токен доступу.          |
| `oauth-token`        | Кешований токен доступу ще дійсний або токен оновлення створив новий токен доступу.    |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` знайшла наявний простір Meet.                       |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий простір Meet.                   |

Щоб також підтвердити ввімкнення Google Meet API і область доступу `spaces.create`, запустіть
перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює тимчасову URL-адресу Meet. Використовуйте її, коли потрібно підтвердити,
що в проєкті Google Cloud увімкнено Meet API і що авторизований
обліковий запис має область доступу `meetings.space.created`.

Щоб підтвердити доступ для читання до наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` підтверджують доступ для читання до наявного
простору, до якого має доступ авторизований обліковий запис Google. `403` від цих перевірок
зазвичай означає, що Google Meet REST API вимкнено, узгодженому токену оновлення
бракує потрібної області доступу або обліковий запис Google не має доступу до цього простору Meet.
Помилка токена оновлення означає, що потрібно повторно запустити `openclaw googlemeet auth login
--json` і зберегти новий блок `oauth`.

Для резервного браузерного режиму облікові дані OAuth не потрібні. У цьому режимі автентифікація Google
береться з профілю Chrome із виконаним входом на вибраному вузлі, а не з
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

З `--meeting` команди `artifacts` і `attendance` за замовчуванням використовують останній запис конференції.
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

`--today` шукає в сьогоднішньому календарі `primary` подію Calendar із посиланням
Google Meet. Використовуйте `--event <query>` для пошуку відповідного тексту події та
`--calendar <id>` для неосновного календаря. Пошук у календарі потребує нового
входу OAuth, який включає область доступу лише для читання подій Calendar.
`calendar-events` попередньо показує відповідні події Meet і позначає подію, яку
виберуть `latest`, `artifacts`, `attendance` або `export`.

Якщо ідентифікатор запису конференції вже відомий, зверніться до нього напряму:

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

Це викликає Google Meet `spaces.endActiveConference` і потребує OAuth з областю доступу
`meetings.space.created` для простору, яким може керувати авторизований обліковий запис.
OpenClaw приймає як вхідні дані Meet URL, код зустрічі або `spaces/{id}` і визначає їх
до ресурсу простору API перед завершенням активної конференції.
Це окремо від `googlemeet leave`: `leave` зупиняє локальну/сеансову
участь OpenClaw, а `end-active-conference` просить Google Meet завершити активну
конференцію для простору.

Запишіть зручний для читання звіт:

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
Google відкриває їх для зустрічі. Використовуйте `--no-transcript-entries`, щоб пропустити
пошук записів для великих зустрічей. `attendance` розгортає учасників у
рядки сеансів учасників із часом першої/останньої появи, загальною тривалістю сеансу,
позначками запізнення/раннього виходу та дубльованими ресурсами учасників, об’єднаними за користувачем
із виконаним входом або відображуваним ім’ям. Передайте `--no-merge-duplicates`, щоб залишити сирі ресурси
учасників окремо, `--late-after-minutes`, щоб налаштувати виявлення запізнень, і
`--early-before-minutes`, щоб налаштувати виявлення раннього виходу.

`export` записує папку, що містить `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`.
`manifest.json` фіксує вибрані вхідні дані, параметри експорту, записи конференції,
вихідні файли, кількості, джерело токена, подію Calendar, якщо вона використовувалася, і будь-які
попередження про часткове отримання. Передайте `--zip`, щоб також записати портативний архів поруч
із папкою. Передайте `--include-doc-bodies`, щоб експортувати текст пов’язаних транскриптів і
розумних нотаток Google Docs через Google Drive `files.export`; для цього потрібен
новий вхід OAuth, який включає область доступу лише для читання Drive Meet. Без
`--include-doc-bodies` експорт включає лише метадані Meet і структуровані записи транскрипту.
Якщо Google повертає часткову помилку артефакту, наприклад помилку списку розумних нотаток,
запису транскрипту або тіла документа Drive, підсумок і
маніфест зберігають попередження замість того, щоб провалити весь експорт.
Використовуйте `--dry-run`, щоб отримати ті самі дані артефактів/відвідуваності й надрукувати
JSON маніфесту без створення папки або ZIP. Це корисно перед записом
великого експорту або коли агенту потрібні лише кількості, вибрані записи та
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

Установіть `"dryRun": true`, щоб повернути лише маніфест експорту й пропустити запис файлів.

Агенти також можуть створити кімнату, підтриману API, з явною політикою доступу:

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

Для перевірки спершу через прослуховування агенти мають використовувати `test_listen`, перш ніж стверджувати, що
зустріч корисна:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Запустіть захищену live smoke-перевірку з реальною збереженою зустріччю:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Запустіть live браузерну пробу з попереднім прослуховуванням для зустрічі, де хтось
говоритиме й будуть доступні субтитри Meet:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Середовище live smoke-перевірки:

- `OPENCLAW_LIVE_TEST=1` вмикає захищені live-тести.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` вказує на збережену Meet URL, код або
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID` надає OAuth
  ідентифікатор клієнта.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN` надає
  токен оновлення.
- Необов’язково: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` і
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` використовують ті самі резервні назви
  без префікса `OPENCLAW_`.

Базова live smoke-перевірка артефактів/відвідуваності потребує
`https://www.googleapis.com/auth/meetings.space.readonly` і
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Пошук у календарі
потребує `https://www.googleapis.com/auth/calendar.events.readonly`. Експорт тіла документа
Drive потребує
`https://www.googleapis.com/auth/drive.meet.readonly`.

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда друкує новий `meeting uri`, джерело та сеанс приєднання. З обліковими даними OAuth
вона використовує офіційний Google Meet API. Без облікових даних OAuth вона
використовує профіль браузера вибраного вузла Chrome із виконаним входом як резервний режим. Агенти можуть
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

Якщо резервний браузерний режим натрапляє на вхід Google або блокування дозволів Meet перед тим, як
може створити URL, метод Gateway повертає невдалу відповідь, а
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

Створення Meet типово приєднує до зустрічі. Транспорт Chrome або Chrome-node все ще
потребує профілю Google Chrome із виконаним входом, щоб приєднатися через браузер. Якщо з
профілю виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або
помилку резервного браузерного шляху й просить оператора завершити вхід у Google перед
повторною спробою.

Встановлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
проєкт, OAuth principal і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Спільний шлях агента Chrome потребує лише ввімкненого plugin, BlackHole, SoX,
ключа провайдера транскрибування в реальному часі та налаштованого провайдера TTS OpenClaw.
OpenAI є типовим провайдером транскрибування; встановіть `realtime.voiceProvider` на
`"google"` і `realtime.model`, щоб використовувати Google Gemini Live для режиму `bidi`
без зміни типового провайдера транскрибування в режимі агента:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Встановіть конфігурацію plugin у `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: необов’язковий id/ім’я/IP node для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, яке використовується на екрані гостя Meet
  без виконаного входу
- `chrome.autoJoin: true`: найкраща спроба заповнити ім’я гостя й натиснути Join Now
  через браузерну автоматизацію OpenClaw у `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить про перебування у виклику,
  перш ніж буде запущено вступ для зворотної розмови
- `chrome.audioFormat: "pcm16-24khz"`: аудіоформат пари команд. Використовуйте
  `"g711-ulaw-8khz"` лише для застарілих/кастомних пар команд, які досі виводять
  телефонне аудіо.
- `chrome.audioBufferBytes: 4096`: буфер обробки SoX для згенерованих Chrome
  аудіокоманд пари команд. Це половина типового буфера SoX на 8192 байти,
  що зменшує типову затримку каналу й залишає можливість збільшити її на завантажених хостах.
  Значення нижче мінімуму SoX обмежуються 17 байтами.
- `chrome.audioInputCommand`: команда SoX, що читає з CoreAudio `BlackHole 2ch`
  і записує аудіо у `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX, що читає аудіо у `chrome.audioFormat`
  і записує в CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: необов’язкова команда локального мікрофона, яка записує
  signed 16-bit little-endian mono PCM для виявлення людського втручання, поки
  відтворення асистента активне. Наразі це застосовується до розміщеного на Gateway
  bridge пари команд `chrome`.
- `chrome.bargeInRmsThreshold: 650`: рівень RMS, що вважається людським
  перериванням на `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: піковий рівень, що вважається людським
  перериванням на `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: мінімальна затримка між повторними очищеннями
  людських переривань
- `mode: "agent"`: типовий режим зворотної розмови. Мовлення учасника транскрибується
  налаштованим провайдером транскрибування в реальному часі, надсилається налаштованому
  агенту OpenClaw в окремому для зустрічі сеансі субагента й озвучується через
  звичайне середовище виконання TTS OpenClaw.
- `mode: "bidi"`: резервний прямий двонапрямний режим моделі реального часу. Провайдер
  голосу в реальному часі відповідає на мовлення учасника напряму й може викликати
  `openclaw_agent_consult` для глибших відповідей або відповідей із підтримкою інструментів.
- `mode: "transcribe"`: режим лише спостереження без bridge зворотної розмови.
- `realtime.provider: "openai"`: резервний варіант сумісності, який використовується, коли
  наведені нижче scoped поля провайдера не задані.
- `realtime.transcriptionProvider: "openai"`: id провайдера, який режим `agent` використовує
  для транскрибування в реальному часі.
- `realtime.voiceProvider`: id провайдера, який режим `bidi` використовує для прямого голосу
  в реальному часі. Встановіть його на `"google"`, щоб використовувати Gemini Live, зберігаючи
  транскрибування режиму агента в OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли bridge реального часу
  підключається; встановіть її на `""`, щоб приєднуватися без звуку
- `realtime.agentId`: необов’язковий id агента OpenClaw для
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

Постійний голос Meet надходить із
`messages.tts.providers.elevenlabs.voiceId`. Відповіді агента також можуть використовувати
директиви для кожної відповіді `[[tts:voiceId=... model=eleven_v3]]`, коли перевизначення
моделі TTS увімкнені, але конфігурація є детермінованим типовим значенням для зустрічей.
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

`voiceCall.enabled` типово має значення `true`; з транспортом Twilio він делегує
фактичний PSTN-виклик, DTMF і вступне привітання plugin Voice Call. Voice Call
відтворює послідовність DTMF перед відкриттям медіапотоку реального часу, а потім використовує
збережений вступний текст як початкове привітання реального часу. Якщо `voice-call` не
ввімкнено, Google Meet усе ще може перевірити й записати план набору, але не може
виконати Twilio-виклик.

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
`transport: "chrome-node"`, коли Chrome працює на спареному node, наприклад Parallels
VM. В обох випадках провайдери моделей і `openclaw_agent_consult` працюють на
хості Gateway, тому облікові дані моделей залишаються там. З типовим `mode: "agent"`
провайдер транскрибування в реальному часі виконує прослуховування, налаштований агент OpenClaw
створює відповідь, а звичайний TTS OpenClaw озвучує її в Meet. Використовуйте
`mode: "bidi"`, коли потрібно, щоб голосова модель реального часу відповідала напряму.
Сирий `mode: "realtime"` і далі приймається як застарілий псевдонім сумісності для
`mode: "agent"`, але більше не рекламується в схемі інструмента агента.
Журнали режиму агента містять визначеного провайдера/модель транскрибування під час запуску
bridge, а також провайдера TTS, модель, голос, вихідний формат і частоту дискретизації після
кожної синтезованої відповіді.

Використовуйте `action: "status"`, щоб перелічити активні сеанси або перевірити ID сеансу. Використовуйте
`action: "speak"` із `sessionId` і `message`, щоб агент реального часу
заговорив негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сеанс,
запустити відому фразу й повернути стан `inCall`, коли хост Chrome може
про нього повідомити. `test_speech` завжди примусово встановлює `mode: "agent"` і завершується помилкою, якщо його просять
працювати в `mode: "transcribe"`, бо сеанси лише спостереження навмисно не можуть
виводити мовлення. Його результат `speechOutputVerified` ґрунтується на збільшенні байтів аудіовиходу
реального часу під час цього тестового виклику, тому повторно використаний сеанс зі старішим аудіо
не зараховується як свіжа успішна перевірка мовлення. Використовуйте `action: "leave"`, щоб позначити
сеанс завершеним.

`status` містить стан Chrome, коли він доступний:

- `inCall`: Chrome, схоже, перебуває всередині виклику Meet
- `micMuted`: стан мікрофона Meet за найкращою спробою
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профіль
  браузера потребує ручного входу, допуску хостом Meet, дозволів або
  відновлення керування браузером, перш ніж мовлення зможе працювати
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: чи
  кероване мовлення Chrome зараз дозволене. `speechReady: false` означає, що OpenClaw не
  надіслав вступну/тестову фразу в аудіо bridge.
- `providerConnected` / `realtimeReady`: стан голосового bridge реального часу
- `lastInputAt` / `lastOutputAt`: останнє аудіо, отримане з bridge або надіслане до нього
- `audioOutputRouted` / `audioOutputDeviceLabel`: чи медіавивід вкладки Meet
  було активно спрямовано до пристрою BlackHole, який використовує bridge
- `lastSuppressedInputAt` / `suppressedInputBytes`: вхід local loopback, ігнорований, поки
  відтворення асистента активне

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Режими Agent і Bidi

Режим Chrome `agent` оптимізований для поведінки «мій агент у зустрічі». Провайдер
транскрибування в реальному часі чує аудіо зустрічі, остаточні транскрипти учасників
маршрутизуються через налаштованого агента OpenClaw, а відповідь озвучується
через звичайне середовище виконання TTS OpenClaw. Встановіть `mode: "bidi"`, коли потрібно,
щоб голосова модель реального часу відповідала напряму.
Близькі фрагменти остаточного транскрипта об’єднуються перед consult, щоб один усний
хід не створював кілька застарілих часткових відповідей. Вхід реального часу також
приглушується, поки поставлене в чергу аудіо асистента ще відтворюється,
а нещодавні схожі на асистента відлуння транскрипта ігноруються перед consult агента,
щоб local loopback BlackHole не змушував агента відповідати на власне мовлення.

| Режим   | Хто визначає відповідь        | Шлях виводу мовлення                   | Коли використовувати                                  |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | Налаштований агент OpenClaw   | Звичайне середовище виконання TTS OpenClaw | Вам потрібна поведінка «мій агент у зустрічі»         |
| `bidi`  | Голосова модель реального часу | Аудіовідповідь провайдера голосу реального часу | Вам потрібен розмовний голосовий цикл із найнижчою затримкою |

У режимі `bidi`, коли моделі реального часу потрібні глибше міркування, актуальна
інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент consult запускає звичайного агента OpenClaw за лаштунками з контекстом нещодавньої розшифровки зустрічі та повертає стислу усну відповідь. У режимі `agent` OpenClaw надсилає цю відповідь безпосередньо в середовище виконання TTS; у режимі `bidi` голосова модель реального часу може озвучити результат consult назад у зустрічі. Він використовує той самий спільний механізм consult, що й Voice Call.

За замовчуванням consult запускається для агента `main`. Установіть `realtime.agentId`, коли гілка Meet має звертатися до окремого робочого простору агента OpenClaw, стандартних налаштувань моделі, політики інструментів, пам’яті та історії сеансів.

Consult у режимі агента використовує ключ сеансу для кожної зустрічі `agent:<id>:subagent:google-meet:<session>`, щоб подальші запитання зберігали контекст зустрічі, водночас успадковуючи звичайну політику агента від налаштованого агента.

`realtime.toolPolicy` керує запуском consult:

- `safe-read-only`: надати доступ до інструмента consult і обмежити звичайного агента інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`.
- `owner`: надати доступ до інструмента consult і дозволити звичайному агенту використовувати звичайну політику інструментів агента.
- `none`: не надавати голосовій моделі реального часу доступ до інструмента consult.

Ключ сеансу consult обмежений окремим сеансом Meet, тому подальші виклики consult можуть повторно використовувати попередній контекст consult під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднався до дзвінка:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повної smoke-перевірки приєднання й озвучення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Контрольний список live-тесту

Використовуйте цю послідовність перед передачею зустрічі автономному агенту:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Очікуваний стан Chrome-node:

- `googlemeet setup` повністю зелений.
- `googlemeet setup` містить `chrome-node-connected`, коли Chrome-node є стандартним транспортом або закріплено вузол.
- `nodes status` показує, що вибраний вузол підключено.
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

Це підтверджує, що Gateway Plugin завантажено, вузол VM підключено з поточним токеном, а аудіоміст Meet доступний до того, як агент відкриє вкладку реальної зустрічі.

Для smoke-перевірки Twilio використовуйте зустріч із даними телефонного підключення:

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
- Повернений сеанс має `transport: "twilio"` і `twilio.voiceCallId`.
- `openclaw logs --follow` показує, що DTMF TwiML було віддано перед TwiML реального часу, а потім міст реального часу з поставленим у чергу початковим привітанням.
- `googlemeet leave <sessionId>` завершує делегований голосовий дзвінок.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно відредагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway. Запущений агент бачить лише інструменти Plugin, зареєстровані поточним процесом Gateway.

На хостах Gateway не з macOS інструмент `google_meet`, доступний агенту, залишається видимим, але дії локального зворотного озвучення Chrome блокуються до потрапляння в аудіоміст. Локальне аудіо зворотного озвучення Chrome наразі залежить від macOS `BlackHole 2ch`, тому агенти Linux мають використовувати `mode: "transcribe"`, телефонне підключення Twilio або хост macOS `chrome-node` замість стандартного локального шляху агента Chrome.

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

Вузол має бути підключений і показувати `googlemeet.chrome` разом із `browser.proxy`. Конфігурація Gateway має дозволяти ці команди вузла:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Якщо `googlemeet setup` не проходить `chrome-node-connected` або журнал Gateway повідомляє `gateway token mismatch`, перевстановіть або перезапустіть вузол із поточним токеном Gateway. Для Gateway у LAN це зазвичай означає:

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

Запустіть `googlemeet test-listen` для приєднань лише зі спостереженням або `googlemeet test-speech` для приєднань у реальному часі, потім перегляньте повернений стан Chrome. Якщо будь-яка перевірка повідомляє `manualActionRequired: true`, покажіть `manualActionMessage` оператору й припиніть повторні спроби, доки дію в браузері не буде завершено.

Поширені ручні дії:

- Увійдіть у профіль Chrome.
- Допустіть гостя з облікового запису хоста Meet.
- Надайте Chrome дозволи на мікрофон/камеру, коли з’явиться нативний запит дозволу Chrome.
- Закрийте або виправте завислий діалог дозволів Meet.

Не повідомляйте "not signed in" лише тому, що Meet показує "Do you want people to hear you in the meeting?" Це проміжний екран вибору аудіо Meet; OpenClaw натискає **Use microphone** через автоматизацію браузера, коли це доступно, і продовжує чекати реального стану зустрічі. Для резервного сценарію браузера лише для створення OpenClaw може натиснути **Continue without microphone**, тому що створення URL не потребує аудіошляху реального часу.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує endpoint Google Meet API `spaces.create`, коли налаштовано облікові дані OAuth. Без облікових даних OAuth він переходить до резервного браузера закріпленого вузла Chrome. Підтвердьте:

- Для створення через API: `oauth.clientId` і `oauth.refreshToken` налаштовані або наявні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було згенеровано після додавання підтримки створення. Старішим токенам може бракувати scope `meetings.space.created`; повторно виконайте `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для резервного браузера: `defaultTransport: "chrome-node"` і `chromeNode.node` вказують на підключений вузол із `browser.proxy` і `googlemeet.chrome`.
- Для резервного браузера: профіль OpenClaw Chrome на цьому вузлі увійшов у Google і може відкрити `https://meet.google.com/new`.
- Для резервного браузера: повторні спроби повторно використовують наявну вкладку `https://meet.google.com/new` або вкладку запиту облікового запису Google перед відкриттям нової вкладки. Якщо час очікування агента спливає, повторіть виклик інструмента замість ручного відкриття іншої вкладки Meet.
- Для резервного браузера: якщо інструмент повертає `manualActionRequired: true`, використовуйте повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і `manualActionMessage`, щоб скерувати оператора. Не повторюйте спроби в циклі, доки цю дію не буде завершено.
- Для резервного браузера: якщо Meet показує "Do you want people to hear you in the meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для резервного сценарію лише створення, **Continue without microphone** через автоматизацію браузера й продовжити чекати згенерованого URL Meet. Якщо це неможливо, помилка має згадувати `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте шлях реального часу:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "agent"` для звичайного шляху зворотного озвучення STT -> агент OpenClaw -> TTS або `mode: "bidi"` для прямого резервного голосового сценарію реального часу. `mode: "transcribe"` навмисно не запускає міст зворотного озвучення. Для налагодження лише зі спостереженням виконайте `openclaw googlemeet status --json <session-id>` після того, як учасники говоритимуть, і перевірте `captioning`, `transcriptLines` і `lastCaptionText`. Якщо `inCall` дорівнює true, але `transcriptLines` лишається `0`, субтитри Meet можуть бути вимкнені, ніхто не говорив після встановлення спостерігача, інтерфейс Meet змінився або live-субтитри недоступні для мови/облікового запису зустрічі.

`googlemeet test-speech` завжди перевіряє шлях реального часу й повідомляє, чи були помічені байти виводу мосту для цього виклику. Якщо `speechOutputVerified` має значення false, а `speechOutputTimedOut` має значення true, провайдер реального часу міг прийняти фразу, але OpenClaw не побачив, щоб нові байти виводу дійшли до аудіомоста Chrome.

Також перевірте:

- На хості Gateway доступний ключ провайдера реального часу, наприклад `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `sox` існує на хості Chrome.
- Мікрофон і динамік Meet спрямовані через віртуальний аудіошлях, який використовує OpenClaw. `doctor` має показувати `meet output routed: yes` для локальних приєднань Chrome у реальному часі.

`googlemeet doctor [session-id]` виводить сеанс, вузол, стан у дзвінку, причину ручної дії, підключення провайдера реального часу, `realtimeReady`, активність аудіовходу/виходу, останні часові позначки аудіо, лічильники байтів і URL браузера. Використовуйте `googlemeet status [session-id] --json`, коли потрібен сирий JSON. Використовуйте `googlemeet doctor --oauth`, коли потрібно перевірити Google Meet OAuth refresh без розкриття токенів; додайте `--meeting` або `--create-space`, коли також потрібне підтвердження Google Meet API.

Якщо час очікування агента сплив і ви бачите, що вкладку Meet уже відкрито, огляньте цю вкладку, не відкриваючи іншу:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусується на наявній вкладці Meet і перевіряє її для вибраного транспорту. З `chrome` вона використовує локальне керування браузером через Gateway; з `chrome-node` вона використовує налаштований вузол Chrome. Вона не відкриває нову вкладку й не створює новий сеанс; вона повідомляє поточний блокер, наприклад стан входу, допуску, дозволів або вибору аудіо. Команда CLI звертається до налаштованого Gateway, тому Gateway має бути запущений; `chrome-node` також потребує підключеного вузла Chrome.

### Перевірки налаштування Twilio не проходять

`twilio-voice-call-plugin` не проходить, коли `voice-call` не дозволено або не ввімкнено. Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте Gateway.

`twilio-voice-call-credentials` не проходить, коли бекенду Twilio бракує account SID, auth token або номера абонента, що телефонує. Установіть їх на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` не проходить, коли `voice-call` не має публічного Webhook-доступу або коли `publicUrl` вказує на loopback чи приватний мережевий простір. Установіть `plugins.entries.voice-call.config.publicUrl` на публічний URL провайдера або налаштуйте tunnel/Tailscale-доступ для `voice-call`.

Loopback і приватні URL не є допустимими для callback від операторів зв’язку. Не використовуйте `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` або `fd00::/8` як `publicUrl`.

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

Для локальної розробки використовуйте тунель або експозицію Tailscale замість приватної
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

Додавайте `--yes` лише тоді, коли ви навмисно хочете здійснити реальний вихідний
дзвінок-сповіщення:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Виклик Twilio починається, але не входить у зустріч

Переконайтеся, що подія Meet надає дані для телефонного дозвону. Передайте точний номер
для дозвону й PIN-код або власну послідовність DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкові `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза
перед введенням PIN-коду.

Якщо телефонний виклик створено, але список учасників Meet ніколи не показує учасника
дозвону:

- Виконайте `openclaw googlemeet doctor <session-id>`, щоб підтвердити делегований Twilio
  ID виклику, чи DTMF було поставлено в чергу, і чи було запитано вступне привітання.
- Виконайте `openclaw voicecall status --call-id <id>` і переконайтеся, що виклик досі
  активний.
- Виконайте `openclaw voicecall tail` і перевірте, що Webhook-и Twilio надходять до
  Gateway.
- Виконайте `openclaw logs --follow` і знайдіть послідовність Twilio Meet: Google
  Meet делегує приєднання, Voice Call запускає телефонну гілку, Google Meet очікує
  `voiceCall.dtmfDelayMs`, надсилає DTMF через `voicecall.dtmf`, очікує
  `voiceCall.postDtmfSpeechDelayMs`, а потім запитує вступне мовлення через
  `voicecall.speak`.
- Повторно виконайте `openclaw googlemeet setup --transport twilio`; успішна перевірка налаштування
  обов'язкова, але вона не доводить, що послідовність PIN-коду зустрічі правильна.
- Переконайтеся, що номер дозвону належить тому самому запрошенню Meet і регіону, що й
  PIN-код.
- Збільште `voiceCall.dtmfDelayMs`, якщо Meet відповідає повільно або транскрипт виклику
  все ще показує запит на введення PIN-коду після надсилання DTMF.
- Якщо учасник приєднується, але ви не чуєте привітання, перевірте
  `openclaw logs --follow` на наявність post-DTMF запиту `voicecall.speak` і
  відтворення TTS через медіапотік або резервний варіант Twilio `<Say>`. Якщо транскрипт виклику
  все ще містить "enter the meeting PIN", телефонна гілка ще не приєдналася
  до кімнати Meet, тому учасники зустрічі не почують мовлення.

Якщо Webhook-и не надходять, спочатку налагодьте Plugin Voice Call: провайдер має
досягати `plugins.entries.voice-call.config.publicUrl` або налаштованого тунелю.
Див. [Усунення несправностей голосових викликів](/uk/plugins/voice-call#troubleshooting).

## Примітки

Офіційний медіа API Google Meet орієнтований на отримання, тому для мовлення в
дзвінок Meet усе ще потрібен шлях учасника. Цей Plugin робить цю межу видимою:
Chrome обробляє участь через браузер і локальну маршрутизацію аудіо; Twilio обробляє
участь через телефонний дозвін.

Режими зворотного мовлення Chrome потребують `BlackHole 2ch` і одного з таких варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує
  мостом і передає аудіо у форматі `chrome.audioFormat` між цими командами та
  вибраним провайдером. Режим агента використовує транскрипцію в реальному часі плюс звичайний TTS;
  режим bidi використовує голосового провайдера реального часу. Стандартний шлях Chrome — це 24 kHz
  PCM16 із `chrome.audioBufferBytes: 4096`; 8 kHz G.711 mu-law залишається
  доступним для застарілих пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда моста керує всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона. Це
  допустимо лише для `bidi`, оскільки режим `agent` потребує прямого доступу до пари команд для TTS.

Коли агент викликає інструмент `google_meet` у режимі агента, сесія консультанта зустрічі
розгалужує поточний транскрипт викликувача перед відповіддю на мовлення учасника.
Сесія Meet усе одно залишається окремою (`agent:<agentId>:subagent:google-meet:<sessionId>`),
тому подальші дії зустрічі не змінюють транскрипт викликувача напряму.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може повертати звук інших учасників назад у виклик.

З командно-парним мостом Chrome `chrome.bargeInInputCommand` може прослуховувати
окремий локальний мікрофон і очищати відтворення асистента, коли людина починає
говорити. Це ставить мовлення людини попереду виводу асистента навіть тоді, коли спільний
loopback-вхід BlackHole тимчасово приглушено під час відтворення асистента.
Як і `chrome.audioInputCommand` та `chrome.audioOutputCommand`, це
локальна команда, налаштована оператором. Використовуйте явний довірений шлях команди або
список аргументів і не спрямовуйте її на скрипти з недовірених розташувань.

`googlemeet speak` запускає активний аудіоміст зворотного мовлення для сесії Chrome.
`googlemeet leave` зупиняє цей міст. Для сесій Twilio, делегованих
через Plugin Voice Call, `leave` також завершує базовий голосовий виклик.
Використовуйте `googlemeet end-active-conference`, коли також хочете закрити активну
конференцію Google Meet для простору, керованого API.

## Пов'язане

- [Plugin голосових викликів](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення Plugin-ів](/uk/plugins/building-plugins)
