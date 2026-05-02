---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий дзвінок Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio з типовими налаштуваннями голосу в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-02T07:17:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef6945172fed00e5583f655789fab9734e5232c6820bd3fafe7d7c4a48e2f33a
    source_path: plugins/google-meet.md
    workflow: 16
---

Підтримка учасника Google Meet для OpenClaw — Plugin навмисно працює лише явно:

- Він приєднується тільки до явної URL-адреси `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися до
  поверненої URL-адреси.
- Голос `realtime` є режимом за замовчуванням.
- Голос у реальному часі може викликати повного агента OpenClaw, коли потрібні глибші
  міркування або інструменти.
- Агенти вибирають поведінку приєднання через `mode`: використовуйте `realtime` для живого
  прослуховування/відповіді голосом або `transcribe`, щоб приєднатися/керувати браузером без
  голосового мосту реального часу.
- Автентифікація починається як особистий Google OAuth або вже виконаний вхід у профіль Chrome.
- Автоматичного оголошення згоди немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на спареному вузловому хості.
- Twilio приймає номер для дозвону плюс необов'язковий PIN або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших
  телеконференц-процесів агента.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте бекенд-провайдера голосу
реального часу. OpenAI є типовим; Google Gemini Live також працює з
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

Вивід налаштування призначений бути придатним для читання агентом і враховувати режим. Він повідомляє профіль Chrome
, прив'язування вузла, а для приєднань Chrome у реальному часі — аудіоміст
BlackHole/SoX і перевірки відкладеного вступу реального часу. Для приєднань лише для спостереження перевірте той самий
транспорт із `--mode transcribe`; цей режим пропускає передумови аудіо реального часу,
оскільки не слухає через міст і не говорить через нього:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Коли налаштовано делегування Twilio, налаштування також повідомляє, чи готові
Plugin `voice-call`, облікові дані Twilio та публічна доступність Webhook.
Ставтеся до будь-якої перевірки `ok: false` як до блокера для перевіреного транспорту й режиму
перед тим, як просити агента приєднатися. Використовуйте `openclaw googlemeet setup --json` для
скриптів або машинозчитуваного виводу. Використовуйте `--transport chrome`,
`--transport chrome-node` або `--transport twilio`, щоб попередньо перевірити конкретний
транспорт до того, як агент спробує його.

Для Twilio завжди явно виконуйте попередню перевірку транспорту, коли типовим транспортом
є Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Це виявляє відсутню прив'язку `voice-call`, облікові дані Twilio або недосяжну
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
  "mode": "realtime"
}
```

Інструмент `google_meet` для агента залишається доступним на хостах не macOS для
артефактів, календаря, налаштування, транскрибування, Twilio та потоків `chrome-node`.
Локальні дії Chrome у реальному часі там заблоковані, оскільки вбудований аудіошлях Chrome
реального часу наразі залежить від macOS `BlackHole 2ch`. У Linux використовуйте
`mode: "transcribe"`, дозвін Twilio або macOS-хост `chrome-node` для участі Chrome
у реальному часі.

Створіть нову зустріч і приєднайтеся до неї:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Для кімнат, створених через API, використовуйте Google Meet `SpaceConfig.accessType`, коли хочете,
щоб політика кімнати без запиту на вхід була явною, а не успадкованою з типових налаштувань
облікового запису Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` дозволяє будь-кому з URL-адресою Meet приєднатися без запиту на вхід. `TRUSTED` дозволяє
довіреним користувачам організації хоста, запрошеним зовнішнім користувачам і користувачам
дозвону приєднуватися без запиту на вхід. `RESTRICTED` обмежує вхід без запиту
лише запрошеними. Ці налаштування застосовуються тільки до офіційного шляху створення
Google Meet API, тому облікові дані OAuth мають бути налаштовані.

Якщо ви автентифікували Google Meet до появи цієї опції, повторно запустіть
`openclaw googlemeet auth login --json` після додавання області доступу
`meetings.space.settings` до екрана згоди Google OAuth.

Створіть лише URL-адресу без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовані облікові дані Google Meet OAuth. Це
  найдетермінованіший шлях, який не залежить від стану UI браузера.
- Резервний шлях через браузер: використовується, коли облікові дані OAuth відсутні. OpenClaw використовує
  прив'язаний вузол Chrome, відкриває `https://meet.google.com/new`, чекає, доки Google
  перенаправить на справжню URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Цей шлях потребує,
  щоб у профілі OpenClaw Chrome на вузлі вже було виконано вхід у Google.
  Автоматизація браузера обробляє власний запит Meet на мікрофон під час першого запуску; цей запит
  не вважається помилкою входу Google.
  Потоки приєднання та створення також намагаються повторно використати наявну вкладку Meet перед відкриттям
  нової. Зіставлення ігнорує нешкідливі рядки запиту URL, як-от `authuser`, тому повторна спроба
  агента має сфокусувати вже відкриту зустріч замість створення другої
  вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` типово приєднується до нової зустрічі й
повертає `joined: true` плюс сесію приєднання. Щоб лише створити URL-адресу, використовуйте
`create --no-join` у CLI або передайте `"join": false` інструменту.

Або скажіть агенту: "Створи Google Meet, приєднайся до нього з голосом у реальному часі та надішли
мені посилання." Агент має викликати `google_meet` з `action: "create"` і
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
надання OpenClaw дозволів на мікрофон/камеру та уникають шляху Meet **Use
microphone**. Якщо Meet показує проміжний екран вибору аудіо, автоматизація намагається
вибрати шлях без мікрофона, а інакше повідомляє про ручну дію замість відкриття
локального мікрофона. У режимі transcribe керовані транспорти Chrome також установлюють
спостерігач субтитрів Meet на основі найкращих зусиль. `googlemeet status --json` і
`googlemeet doctor` показують `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
і короткий хвіст `recentTranscript`, щоб оператори могли зрозуміти, чи браузер
приєднався до дзвінка та чи субтитри Meet створюють текст.
Використовуйте `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, коли
потрібна перевірка так/ні: вона приєднується в режимі transcribe, чекає на свіжий рух субтитрів або
транскрипту та повертає `listenVerified`, `listenTimedOut`, поля ручної
дії та найновіший стан субтитрів.

Під час сесій реального часу статус `google_meet` містить стан браузера й аудіомосту,
як-от `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, останні часові мітки
вводу/виводу, лічильники байтів і закритий стан мосту. Якщо з'являється безпечний
запит сторінки Meet, автоматизація браузера обробляє його, коли може. Вхід, допуск хостом і
запити дозволів браузера/ОС повідомляються як ручна дія з причиною та
повідомленням, які агент має передати. Керовані сесії Chrome відтворюють вступ або
тестову фразу лише після того, як стан браузера повідомляє `inCall: true`; інакше статус повідомляє
`speechReady: false`, а спробу мовлення заблоковано замість удавання, що
агент говорив у зустріч.

Локальні приєднання Chrome використовують профіль браузера OpenClaw із виконаним входом. Режим реального часу
потребує `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для
чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного
пристрою BlackHole достатньо для першого smoke-тесту, але він може давати відлуння.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM,
щоб лише зробити VM власником Chrome. Запустіть Gateway і агента локально, а потім запустіть
вузловий хост у VM. Увімкніть вбудований Plugin у VM один раз, щоб вузол
оголошував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, провайдер
  реального часу та конфігурація Plugin Google Meet.
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

Якщо `<gateway-host>` — це LAN IP і ви не використовуєте TLS, вузол відхиляє
відкритий WebSocket, якщо ви не погодитеся на це для цієї довіреної приватної мережі:

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

Тепер приєднайтеся звичайним способом із хоста Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

або попросіть агента використати інструмент `google_meet` з `transport: "chrome-node"`.

Для smoke-тесту однією командою, який створює або повторно використовує сесію, промовляє відому
фразу та друкує стан сесії:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час realtime-приєднання автоматизація браузера OpenClaw заповнює ім’я гостя, натискає Join/Ask to join і приймає перший вибір Meet "Use microphone", коли з’являється цей запит. Під час observe-only приєднання або створення зустрічі лише в браузері вона продовжує після того самого запиту без мікрофона, коли такий вибір доступний. Якщо профіль браузера не ввійшов в обліковий запис, Meet очікує допуску від організатора, Chrome потребує дозволу на мікрофон/камеру для realtime-приєднання або Meet застряг на запиті, який автоматизація не змогла вирішити, результат join/test-speech повідомляє `manualActionRequired: true` з `manualActionReason` і `manualActionMessage`. Агенти мають припинити повторювати приєднання, повідомити це точне повідомлення разом із поточними `browserUrl`/`browserTitle` і повторити спробу лише після завершення ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає лише тоді, коли рівно один підключений Node оголошує і `googlemeet.chrome`, і керування браузером. Якщо підключено кілька придатних Node, установіть `chromeNode.node` на ідентифікатор Node, відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `Configured Google Meet node ... is not usable: offline`: закріплений Node відомий Gateway, але недоступний. Агенти мають розглядати цей Node як діагностичний стан, а не як придатний хост Chrome, і повідомити про блокер налаштування замість переходу на інший транспорт, якщо користувач цього не просив.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM, підтвердьте pairing і переконайтеся, що `openclaw plugins enable google-meet` та `openclaw plugins enable browser` були виконані у VM. Також підтвердьте, що хост Gateway дозволяє обидві команди Node через `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: установіть `blackhole-2ch` на хості, який перевіряється, і перезавантажтеся перед використанням локального аудіо Chrome.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch` у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або залиште `chrome.guestName` заданим для приєднання гостя. Автоматичне приєднання гостя використовує браузерну автоматизацію OpenClaw через браузерний проксі Node; переконайтеся, що конфігурація браузера Node вказує на потрібний профіль, наприклад `browser.defaultProfile: "user"` або іменований профіль existing-session.
- Дублікати вкладок Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw активує наявну вкладку для тієї самої URL-адреси Meet перед відкриттям нової, а створення зустрічі в браузері повторно використовує вкладку `https://meet.google.com/new` або запиту Google account, що вже в процесі, перед відкриттям іншої.
- Немає аудіо: у Meet скеруйте аудіо мікрофона/динаміка через шлях віртуального аудіопристрою, який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію у стилі Loopback для чистого duplex-аудіо.

## Нотатки щодо встановлення

Стандартний realtime-режим Chrome використовує два зовнішні інструменти:

- `sox`: аудіоутиліта командного рядка. Plugin використовує явні команди CoreAudio device для стандартного 24 kHz PCM16 audio bridge.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`, через який Chrome/Meet може маршрутизувати аудіо.

OpenClaw не пакує й не поширює жоден із цих пакетів. Документація просить користувачів установлювати їх як залежності хоста через Homebrew. SoX ліцензовано як `LGPL-2.0-only AND GPL-2.0-only`; BlackHole має ліцензію GPL-3.0. Якщо ви створюєте інсталятор або appliance, який пакує BlackHole разом з OpenClaw, перегляньте умови ліцензування upstream BlackHole або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet через керування браузером OpenClaw і приєднується як профіль браузера OpenClaw, що ввійшов в обліковий запис. На macOS Plugin перевіряє наявність `BlackHole 2ch` перед запуском. Якщо налаштовано, він також запускає команду перевірки стану audio bridge і команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють на спареному Node, наприклад Parallels macOS VM. Для локального Chrome виберіть профіль через `browser.defaultProfile`; `chrome.browserProfile` передається хостам `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Скеруйте аудіо мікрофона й динаміка Chrome через локальний audio bridge OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план набору, делегований Plugin Voice Call. Він не аналізує сторінки Meet для пошуку телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або потрібен резервний варіант телефонного дозвону. Google Meet має надати номер телефонного дозвону й PIN для зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

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

Коли делегування Twilio підключено, `googlemeet setup` містить успішні перевірки `twilio-voice-call-plugin`, `twilio-voice-call-credentials` і `twilio-voice-call-webhook`.

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

OAuth є необов’язковим для створення посилання Meet, оскільки `googlemeet create` може перейти на браузерну автоматизацію. Налаштуйте OAuth, коли потрібне офіційне створення через API, розв’язання space або preflight-перевірки Meet Media API.

Доступ до Google Meet API використовує user OAuth: створіть OAuth-клієнт Google Cloud, запитайте потрібні scopes, авторизуйте обліковий запис Google, а потім збережіть отриманий refresh token у конфігурації Plugin Google Meet або надайте змінні середовища `OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання Chrome. Транспорти Chrome і Chrome-node все ще приєднуються через профіль Chrome, що ввійшов в обліковий запис, BlackHole/SoX і підключений Node, коли ви використовуєте участь через браузер. OAuth призначений лише для офіційного шляху Google Meet API: створення meeting spaces, розв’язання spaces і запуск preflight-перевірок Meet Media API.

### Створення облікових даних Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** — найпростіше для організації Google Workspace.
   - **External** працює для особистих/тестових налаштувань; доки застосунок у Testing, додайте кожен обліковий запис Google, який авторизуватиме застосунок, як test user.
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

`meetings.space.created` потрібен Google Meet `spaces.create`. `meetings.space.readonly` дає OpenClaw змогу розв’язувати URL-адреси/коди Meet у spaces. `meetings.space.settings` дає OpenClaw змогу передавати налаштування `SpaceConfig`, як-от `accessType`, під час створення кімнати через API. `meetings.conference.media.readonly` призначений для preflight Meet Media API і media-робіт; Google може вимагати участі в Developer Preview для фактичного використання Media API. Якщо вам потрібні лише приєднання Chrome на основі браузера, повністю пропустіть OAuth.

### Отримання refresh token

Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, або передайте їх як змінні середовища, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` з refresh token. Вона використовує PKCE, localhost callback на `http://localhost:8085/oauth2callback` і ручний потік копіювання/вставлення з `--manual`.

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

Надавайте перевагу змінним середовища, коли не хочете зберігати refresh token у конфігурації. Якщо присутні і значення конфігурації, і значення середовища, Plugin спочатку використовує конфігурацію, а потім fallback середовища.

Згода OAuth включає створення Meet space, доступ для читання Meet space і доступ для читання conference media Meet. Якщо ви автентифікувалися до появи підтримки створення зустрічей, повторно виконайте `openclaw googlemeet auth login --json`, щоб refresh token мав scope `meetings.space.created`.

### Перевірка OAuth через doctor

Запустіть OAuth doctor, коли потрібна швидка перевірка стану без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує runtime Chrome і не потребує підключеного Node Chrome. Перевіряється, що конфігурація OAuth існує і що refresh token може отримати access token. JSON-звіт містить лише поля стану, як-от `ok`, `configured`, `tokenSource`, `expiresAt`, і повідомлення перевірок; він не виводить access token, refresh token або client secret.

Поширені результати:

| Перевірка            | Значення                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Наявний `oauth.clientId` плюс `oauth.refreshToken` або кешований access token.          |
| `oauth-token`        | Кешований access token усе ще дійсний або refresh token отримав новий access token.     |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` розв’язала наявний Meet space.                      |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий Meet space.                     |

Щоб також підтвердити ввімкнення Google Meet API і scope `spaces.create`, виконайте перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює тимчасову URL-адресу Meet. Використовуйте її, коли потрібно підтвердити,
що в проєкті Google Cloud увімкнено Meet API і що авторизований
обліковий запис має scope `meetings.space.created`.

Щоб підтвердити доступ на читання для наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` підтверджують доступ на читання до наявного
простору, до якого має доступ авторизований обліковий запис Google. `403` від цих перевірок
зазвичай означає, що Google Meet REST API вимкнено, погоджений refresh token
не має потрібного scope або обліковий запис Google не може отримати доступ до цього простору
Meet. Помилка refresh-token означає, що потрібно повторно запустити `openclaw googlemeet auth login
--json` і зберегти новий блок `oauth`.

Для резервного браузерного режиму облікові дані OAuth не потрібні. У цьому режимі автентифікація Google
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

Розв’яжіть URL-адресу Meet, код або `spaces/{id}` через `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Запустіть preflight перед роботою з медіа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Виведіть список артефактів зустрічі та відвідуваності після того, як Meet створить записи конференції:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

З `--meeting`, `artifacts` і `attendance` за замовчуванням використовують найновіший запис конференції.
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
`--calendar <id>` для неосновного календаря. Пошук у Calendar потребує нового
входу OAuth, який включає readonly scope для подій Calendar.
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
рядки participant-session із часом першої/останньої появи, загальною тривалістю сесії,
прапорцями запізнення/раннього виходу та дубльованими ресурсами учасників, об’єднаними за користувачем,
який увійшов у систему, або відображуваним ім’ям. Передайте `--no-merge-duplicates`, щоб залишити необроблені ресурси учасників
окремими, `--late-after-minutes`, щоб налаштувати визначення запізнення, і
`--early-before-minutes`, щоб налаштувати визначення раннього виходу.

`export` записує папку, що містить `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`.
`manifest.json` фіксує вибрані вхідні дані, параметри експорту, записи конференції,
вихідні файли, лічильники, джерело токена, подію Calendar, якщо її було використано, і будь-які
попередження про часткове отримання. Передайте `--zip`, щоб також записати портативний архів поруч
із папкою. Передайте `--include-doc-bodies`, щоб експортувати текст пов’язаних транскриптів і
smart-note Google Docs через Google Drive `files.export`; для цього потрібен
новий вхід OAuth, який включає Drive Meet readonly scope. Без
`--include-doc-bodies` експорт містить лише метадані Meet і структуровані записи транскрипту.
Якщо Google повертає частковий збій артефакту, наприклад помилку списку smart-note,
запису транскрипту або тіла документа Drive, summary і
manifest зберігають попередження замість того, щоб провалити весь експорт.
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

Установіть `"dryRun": true`, щоб повернути лише маніфест експорту й пропустити запис файлів.

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

Для валідації з пріоритетом прослуховування агенти мають використовувати `test_listen`, перш ніж стверджувати, що
зустріч корисна:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Запустіть захищену live smoke-перевірку проти реальної збереженої зустрічі:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Запустіть браузерну live-перевірку з пріоритетом прослуховування проти зустрічі, де хтось
говоритиме і будуть доступні субтитри Meet:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Середовище live smoke-перевірки:

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

Базовій live smoke-перевірці артефактів/відвідуваності потрібні
`https://www.googleapis.com/auth/meetings.space.readonly` і
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Пошуку в Calendar
потрібен `https://www.googleapis.com/auth/calendar.events.readonly`. Експорту
тіла документа Drive потрібен
`https://www.googleapis.com/auth/drive.meet.readonly`.

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда виводить новий `meeting uri`, джерело та сесію приєднання. З обліковими даними OAuth
вона використовує офіційний Google Meet API. Без облікових даних OAuth вона
використовує як резервний варіант браузерний профіль закріпленого вузла Chrome, у який виконано вхід. Агенти можуть
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

Якщо браузерний резервний режим натрапляє на вхід Google або блокування дозволів Meet до того, як
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
`manualActionMessage` разом із контекстом браузерного вузла/вкладки й припинити відкривати нові
вкладки Meet, доки оператор не завершить крок у браузері.

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

Створення Meet за замовчуванням приєднує до зустрічі. Транспорту Chrome або Chrome-node все одно
потрібен профіль Google Chrome, у який виконано вхід, щоб приєднатися через браузер. Якщо з
профілю виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або
помилку браузерного резервного режиму й просить оператора завершити вхід Google перед
повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
проєкт, OAuth principal і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Загальному realtime-шляху Chrome потрібні лише ввімкнений plugin, BlackHole, SoX
і ключ backend realtime voice provider. OpenAI є типовим; установіть
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
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на екрані гостя Meet без входу
  в обліковий запис
- `chrome.autoJoin: true`: найкраща можлива спроба заповнити ім’я гостя й натиснути Join Now
  через браузерну автоматизацію OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить, що вона у виклику,
  перш ніж буде запущено realtime-вступ
- `chrome.audioFormat: "pcm16-24khz"`: формат аудіо для пари команд. Використовуйте
  `"g711-ulaw-8khz"` лише для застарілих/кастомних пар команд, які все ще видають
  телефонне аудіо.
- `chrome.audioInputCommand`: команда SoX, що читає з CoreAudio `BlackHole 2ch`
  і записує аудіо у форматі `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX, що читає аудіо у форматі `chrome.audioFormat`
  і записує в CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: необов’язкова команда локального мікрофона, яка записує
  signed 16-bit little-endian mono PCM для виявлення людського втручання, поки
  відтворення асистента активне. Наразі це застосовується до розміщеного на Gateway
  мосту пар команд `chrome`.
- `chrome.bargeInRmsThreshold: 650`: рівень RMS, що вважається людським
  перериванням на `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: піковий рівень, що вважається людським
  перериванням на `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: мінімальна затримка між повторними очищеннями
  людських переривань
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли realtime-міст
  під’єднується; установіть `""`, щоб приєднатися беззвучно
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

`voiceCall.enabled` типово має значення `true`; із транспортом Twilio він делегує
фактичний PSTN-виклик, DTMF і вступне привітання до Plugin Voice Call. Voice Call
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
  "mode": "realtime"
}
```

Використовуйте `transport: "chrome"`, коли Chrome працює на хості Gateway. Використовуйте
`transport: "chrome-node"`, коли Chrome працює на спареному вузлі, наприклад у Parallels
VM. В обох випадках realtime-модель і `openclaw_agent_consult` працюють на хості
Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сесії або перевірити ідентифікатор сесії. Використовуйте
`action: "speak"` із `sessionId` і `message`, щоб realtime-агент
заговорив негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сесію,
запустити відому фразу й повернути стан `inCall`, коли хост Chrome може
про нього повідомити. `test_speech` завжди примусово встановлює `mode: "realtime"` і завершується помилкою, якщо його просять
працювати в `mode: "transcribe"`, оскільки сесії лише для спостереження навмисно не можуть
видавати мовлення. Його результат `speechOutputVerified` базується на збільшенні байтів realtime-аудіовиходу
під час цього тестового виклику, тому повторно використана сесія зі старішим аудіо
не вважається новою успішною перевіркою мовлення. Використовуйте `action: "leave"`, щоб позначити
сесію завершеною.

`status` містить стан Chrome, коли він доступний:

- `inCall`: Chrome, схоже, перебуває всередині виклику Meet
- `micMuted`: найкраща можлива оцінка стану мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профілю
  браузера потрібен ручний вхід, допуск від організатора Meet, дозволи або
  відновлення керування браузером, перш ніж мовлення зможе працювати
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: чи
  кероване мовлення Chrome дозволене зараз. `speechReady: false` означає, що OpenClaw
  не надіслав вступну/тестову фразу в аудіоміст.
- `providerConnected` / `realtimeReady`: стан realtime-голосового мосту
- `lastInputAt` / `lastOutputAt`: останнє аудіо, побачене з мосту або надіслане до нього
- `lastSuppressedInputAt` / `suppressedInputBytes`: вхід local loopback, проігнорований, поки
  відтворення асистента активне

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime-консультація агента

Realtime-режим Chrome оптимізований для живого голосового циклу. Realtime-голосовий
провайдер чує аудіо зустрічі й говорить через налаштований аудіоміст.
Коли realtime-моделі потрібне глибше міркування, актуальна інформація або звичайні
інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw у фоновому режимі з контекстом
нещодавньої стенограми зустрічі й повертає стислу усну відповідь до realtime-
голосової сесії. Потім голосова модель може вимовити цю відповідь назад у зустріч.
Він використовує той самий спільний realtime-інструмент консультації, що й Voice Call.

Типово консультації виконуються для агента `main`. Установіть `realtime.agentId`, коли
канал Meet має консультуватися зі спеціальним робочим простором агента OpenClaw, типовими параметрами моделі,
політикою інструментів, пам’яттю та історією сесій.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: надати інструмент консультації й обмежити звичайного агента до
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: надати інструмент консультації й дозволити звичайному агенту використовувати стандартну
  політику інструментів агента.
- `none`: не надавати інструмент консультації realtime-голосовій моделі.

Ключ сесії консультації обмежений кожною сесією Meet, тому подальші виклики консультації
можуть повторно використовувати попередній контекст консультації протягом тієї самої зустрічі.

Щоб примусово запустити усну перевірку готовності після того, як Chrome повністю приєднався до виклику:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повної перевірки smoke з приєднанням і мовленням:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Чеклист live-тесту

Використовуйте цю послідовність, перш ніж передавати зустріч агенту без нагляду:

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
  стандартним транспортом або вузол закріплено.
- `nodes status` показує вибраний вузол як підключений.
- Вибраний вузол оголошує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до виклику, а `test-speech` повертає стан Chrome з
  `inCall: true`.

Для віддаленого хоста Chrome, наприклад macOS VM у Parallels, це найкоротша
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
токеном, а аудіоміст Meet доступний до того, як агент відкриє реальну вкладку
зустрічі.

Для smoke-перевірки Twilio використовуйте зустріч, яка надає дані для
телефонного дозвону:

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
- `openclaw logs --follow` показує, що DTMF TwiML віддано перед realtime TwiML,
  а потім realtime-міст із початковим привітанням у черзі.
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

На хостах Gateway не з macOS інструмент `google_meet`, видимий агенту, залишається
доступним, але локальні realtime-дії Chrome блокуються до потрапляння в
аудіоміст. Локальне realtime-аудіо Chrome наразі залежить від macOS
`BlackHole 2ch`, тож агенти Linux мають використовувати `mode: "transcribe"`,
дозвін Twilio або хост `chrome-node` на macOS замість стандартного локального
realtime-шляху Chrome.

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

Виконайте `googlemeet test-listen` для приєднань лише для спостереження або
`googlemeet test-speech` для realtime-приєднань, а потім перевірте повернутий
стан Chrome. Якщо будь-яка з перевірок повідомляє `manualActionRequired: true`,
покажіть `manualActionMessage` оператору й припиніть повторні спроби, доки дію в
браузері не буде завершено.

Поширені ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису організатора Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’явиться нативний запит
  дозволу Chrome.
- Закрити або виправити завислий діалог дозволів Meet.

Не повідомляйте "не виконано вхід" лише тому, що Meet показує "Хочете, щоб люди чули вас
на зустрічі?" Це проміжний екран вибору аудіо в Meet; OpenClaw
натискає **Використовувати мікрофон** через браузерну автоматизацію, коли це доступно, і продовжує
чекати на справжній стан зустрічі. Для резервного браузерного режиму лише створення OpenClaw
може натиснути **Продовжити без мікрофона**, бо для створення URL не потрібен
шлях аудіо в реальному часі.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує endpoint Google Meet API `spaces.create`,
коли налаштовано облікові дані OAuth. Без облікових даних OAuth він переходить
до закріпленого браузера Chrome node. Перевірте:

- Для створення через API: налаштовано `oauth.clientId` і `oauth.refreshToken`,
  або наявні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було згенеровано після додавання підтримки
  створення. У старіших токенах може бракувати scope `meetings.space.created`; повторно виконайте
  `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для резервного браузерного режиму: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений node з `browser.proxy` і
  `googlemeet.chrome`.
- Для резервного браузерного режиму: профіль OpenClaw Chrome на цьому node увійшов
  у Google і може відкрити `https://meet.google.com/new`.
- Для резервного браузерного режиму: повторні спроби повторно використовують наявну вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google перед відкриттям нової вкладки. Якщо агент перевищує час очікування,
  повторіть виклик інструмента, а не відкривайте вручну ще одну вкладку Meet.
- Для резервного браузерного режиму: якщо інструмент повертає `manualActionRequired: true`, використовуйте
  повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і
  `manualActionMessage`, щоб скерувати оператора. Не повторюйте спроби в циклі, доки цю
  дію не буде завершено.
- Для резервного браузерного режиму: якщо Meet показує "Хочете, щоб люди чули вас на
  зустрічі?", залиште вкладку відкритою. OpenClaw має натиснути **Використовувати мікрофон** або, для
  резервного режиму лише створення, **Продовжити без мікрофона** через браузерну
  автоматизацію та продовжити чекати на згенерований URL Meet. Якщо це неможливо, в
  помилці має згадуватися `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте шлях реального часу:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "realtime"` для прослуховування/відповіді голосом. `mode: "transcribe"` навмисно
не запускає дуплексний голосовий міст реального часу. Для налагодження лише спостереження
виконайте `openclaw googlemeet status --json <session-id>` після того, як учасники заговорять,
і перевірте `captioning`, `transcriptLines` та `lastCaptionText`. Якщо `inCall` має
значення true, але `transcriptLines` залишається `0`, субтитри Meet можуть бути вимкнені, ніхто
не говорив після встановлення спостерігача, інтерфейс Meet змінився або живі
субтитри недоступні для мови/облікового запису зустрічі.

`googlemeet test-speech` завжди перевіряє шлях реального часу й повідомляє, чи
було помічено байти виходу моста для цього виклику. Якщо `speechOutputVerified` має значення false і
`speechOutputTimedOut` має значення true, провайдер реального часу міг прийняти
висловлювання, але OpenClaw не побачив, щоб нові вихідні байти дійшли до аудіомоста Chrome.

Також перевірте:

- Ключ провайдера реального часу доступний на хості Gateway, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видно на хості Chrome.
- `sox` існує на хості Chrome.
- Мікрофон і динамік Meet маршрутизовано через віртуальний аудіошлях, який використовує
  OpenClaw.

`googlemeet doctor [session-id]` друкує сесію, node, стан перебування у дзвінку,
причину ручної дії, підключення провайдера реального часу, `realtimeReady`, активність
аудіовходу/аудіовиходу, останні часові мітки аудіо, лічильники байтів і URL браузера.
Використовуйте `googlemeet status [session-id] --json`, коли потрібен сирий JSON. Використовуйте
`googlemeet doctor --oauth`, коли потрібно перевірити оновлення Google Meet OAuth
без розкриття токенів; додайте `--meeting` або `--create-space`, коли також потрібне
підтвердження Google Meet API.

Якщо агент перевищив час очікування й ви бачите вже відкриту вкладку Meet, перевірте цю вкладку,
не відкриваючи ще одну:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує та перевіряє
наявну вкладку Meet для вибраного транспорту. З `chrome` вона використовує локальне
керування браузером через Gateway; з `chrome-node` вона використовує налаштований
Chrome node. Вона не відкриває нову вкладку й не створює нову сесію; вона повідомляє
поточний блокувальник, наприклад стан входу, допуску, дозволів або вибору аудіо.
Команда CLI звертається до налаштованого Gateway, тож Gateway має бути запущений;
`chrome-node` також вимагає, щоб Chrome node був підключений.

### Перевірки налаштування Twilio не проходять

`twilio-voice-call-plugin` завершується помилкою, коли `voice-call` не дозволено або не ввімкнено.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` завершується помилкою, коли бекенду Twilio бракує account
SID, auth token або номера абонента. Установіть їх на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` завершується помилкою, коли `voice-call` не має публічного Webhook
експонування або коли `publicUrl` вказує на loopback чи приватний мережевий простір.
Установіть `plugins.entries.voice-call.config.publicUrl` на публічний URL провайдера або
налаштуйте тунель/Tailscale експонування `voice-call`.

Loopback і приватні URL непридатні для carrier callbacks. Не використовуйте
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

Для локальної розробки використовуйте тунель або Tailscale експонування замість приватного
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

Додавайте `--yes` лише тоді, коли навмисно хочете здійснити живий вихідний
дзвінок-сповіщення:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Дзвінок Twilio починається, але ніколи не входить у зустріч

Переконайтеся, що подія Meet містить дані телефонного dial-in. Передайте точний dial-in
номер і PIN або власну DTMF послідовність:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкові `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза
перед введенням PIN.

Якщо телефонний дзвінок створено, але список учасників Meet ніколи не показує dial-in
учасника:

- Виконайте `openclaw googlemeet doctor <session-id>`, щоб підтвердити делегований Twilio
  call ID, чи було поставлено DTMF у чергу та чи було запрошено вступне привітання.
- Виконайте `openclaw voicecall status --call-id <id>` і підтвердьте, що дзвінок досі
  активний.
- Виконайте `openclaw voicecall tail` і перевірте, що Twilio webhooks надходять до
  Gateway.
- Виконайте `openclaw logs --follow` і шукайте послідовність Twilio Meet: Google
  Meet делегує приєднання, Voice Call зберігає pre-connect DTMF TwiML, віддає
  цей початковий TwiML, потім віддає realtime TwiML і запускає міст реального часу
  з `initialGreeting=queued`.
- Повторно виконайте `openclaw googlemeet setup --transport twilio`; зелена перевірка налаштування
  обов’язкова, але вона не доводить, що PIN послідовність зустрічі правильна.
- Переконайтеся, що dial-in номер належить до того самого запрошення Meet і регіону, що й
  PIN.
- Збільште початкові паузи в `--dtmf-sequence`, якщо Meet відповідає повільно, наприклад
  `wwww123456#`.
- Якщо учасник приєднується, але ви не чуєте привітання, перевірте
  `openclaw logs --follow` на realtime TwiML, запуск моста реального часу та
  `initialGreeting=queued`. Привітання генерується з початкового
  повідомлення `voicecall.start` після підключення моста реального часу.

Якщо webhooks не надходять, спочатку налагодьте Voice Call plugin: провайдер має
досягати `plugins.entries.voice-call.config.publicUrl` або налаштованого тунелю.
Див. [Усунення несправностей голосових дзвінків](/uk/plugins/voice-call#troubleshooting).

## Примітки

Офіційний медіа-API Google Meet орієнтований на отримання, тож для мовлення в дзвінок Meet
досі потрібен шлях учасника. Цей Plugin залишає цю межу видимою:
Chrome обробляє участь у браузері та локальну маршрутизацію аудіо; Twilio обробляє
участь через телефонний dial-in.

Режим реального часу Chrome потребує `BlackHole 2ch` плюс одне з такого:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw володіє
  мостом моделі реального часу й передає аудіо у `chrome.audioFormat` між цими
  командами та вибраним провайдером голосу реального часу. Типовий шлях Chrome —
  24 kHz PCM16; 8 kHz G.711 mu-law залишається доступним для застарілих пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда моста володіє всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуального пристрою в стилі Loopback. Один спільний
пристрій BlackHole може відлунювати інших учасників назад у дзвінок.

З командною парою моста Chrome `chrome.bargeInInputCommand` може слухати окремий
локальний мікрофон і очищати відтворення асистента, коли людина починає
говорити. Це тримає людське мовлення попереду виходу асистента, навіть коли спільний
loopback вхід BlackHole тимчасово приглушений під час відтворення асистента.
Як і `chrome.audioInputCommand` та `chrome.audioOutputCommand`, це
локальна команда, налаштована оператором. Використовуйте явний довірений шлях команди або
список аргументів і не спрямовуйте її на скрипти з недовірених розташувань.

`googlemeet speak` запускає активний аудіоміст реального часу для сесії Chrome.
`googlemeet leave` зупиняє цей міст. Для сесій Twilio, делегованих
через Voice Call plugin, `leave` також завершує базовий голосовий дзвінок.
Використовуйте `googlemeet end-active-conference`, коли також хочете закрити активну
конференцію Google Meet для простору, керованого API.

## Пов’язане

- [Voice call plugin](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення plugins](/uk/plugins/building-plugins)
