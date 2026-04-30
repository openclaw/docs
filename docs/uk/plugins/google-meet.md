---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до зустрічі Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий дзвінок Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Plugin Google Meet: приєднання до явно вказаних URL-адрес Meet через Chrome або Twilio з типовими налаштуваннями голосу в реальному часі'
title: Plugin для Google Meet
x-i18n:
    generated_at: "2026-04-30T01:50:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b989c872fee0dca31680f67559cd26b715303f7c6f4eeda51fc63889bb0383c
    source_path: plugins/google-meet.md
    workflow: 16
---

Підтримка учасника Google Meet для OpenClaw — Plugin навмисно працює явно:

- Він приєднується лише до явно вказаної URL-адреси `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися до
  поверненої URL-адреси.
- `realtime` voice є режимом за замовчуванням.
- Realtime voice може звертатися назад до повного агента OpenClaw, коли потрібні глибші
  міркування або інструменти.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `realtime` для живого
  прослуховування/відповіді голосом або `transcribe`, щоб приєднатися/керувати браузером без
  realtime voice bridge.
- Автентифікація починається як особистий Google OAuth або вже виконаний вхід у профіль Chrome.
- Автоматичного оголошення згоди немає.
- Стандартний аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на спареному хості node.
- Twilio приймає номер для дозвону плюс необов’язковий PIN або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших агентських
  телекомунікаційних робочих процесів.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте бекенд-провайдера realtime voice.
OpenAI є стандартним; Google Gemini Live також працює з
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

Вивід налаштування призначений для читання агентом і враховує режим. Він повідомляє про профіль Chrome,
закріплення node і, для realtime-приєднань Chrome, аудіоміст BlackHole/SoX
та відкладені перевірки realtime-вступу. Для приєднань лише для спостереження перевірте той самий
транспорт за допомогою `--mode transcribe`; цей режим пропускає передумови realtime-аудіо,
бо він не слухає і не говорить через міст:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Коли налаштовано делегування Twilio, налаштування також повідомляє, чи готові
Plugin `voice-call` і облікові дані Twilio. Розглядайте будь-яку перевірку `ok: false`
як блокер для перевіреного транспорту й режиму, перш ніж просити агента
приєднатися. Використовуйте `openclaw googlemeet setup --json` для скриптів або машинозчитуваного
виводу. Використовуйте `--transport chrome`, `--transport chrome-node` або `--transport twilio`,
щоб попередньо перевірити конкретний транспорт, перш ніж агент спробує його.

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

Створіть нову зустріч і приєднайтеся до неї:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Створіть лише URL без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це
  найдетермінованіший шлях, який не залежить від стану інтерфейсу браузера.
- Резервний шлях через браузер: використовується, коли облікових даних OAuth немає. OpenClaw використовує
  закріплений Chrome node, відкриває `https://meet.google.com/new`, чекає, поки Google
  перенаправить на справжню URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Цей шлях вимагає,
  щоб у профілі OpenClaw Chrome на node вже було виконано вхід у Google.
  Автоматизація браузера обробляє власний початковий запит Meet щодо мікрофона; цей запит
  не вважається помилкою входу в Google.
  Потоки приєднання і створення також намагаються повторно використати наявну вкладку Meet перед відкриттям
  нової. Зіставлення ігнорує нешкідливі рядки запиту URL, як-от `authuser`, тож повторна спроба агента
  має сфокусувати вже відкриту зустріч замість створення другої
  вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` за замовчуванням приєднується до нової зустрічі та
повертає `joined: true` плюс сеанс приєднання. Щоб лише створити URL, використовуйте
`create --no-join` у CLI або передайте `"join": false` інструменту.

Або скажіть агенту: «Створи Google Meet, приєднайся до нього з realtime voice і надішли
мені посилання». Агент має викликати `google_meet` з `action: "create"`, а
потім поділитися поверненим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Для приєднання лише для спостереження/керування браузером установіть `"mode": "transcribe"`. Це
не запускає дуплексний міст realtime-моделі, не потребує BlackHole або SoX
і не відповідатиме голосом у зустрічі. Приєднання Chrome у цьому режимі також уникають
надання OpenClaw дозволу на мікрофон/камеру й обходять шлях Meet **Use
microphone**. Якщо Meet показує проміжний екран вибору аудіо, автоматизація намагається
обрати шлях без мікрофона, а інакше повідомляє про ручну дію замість відкриття
локального мікрофона.

Під час realtime-сеансів статус `google_meet` містить стан браузера й аудіомоста,
зокрема `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, останні часові позначки вводу/виводу,
лічильники байтів і стан закриття моста. Якщо з’являється безпечний запит сторінки Meet,
автоматизація браузера обробляє його, коли може. Вхід, допуск хостом і
запити дозволів браузера/ОС повідомляються як ручна дія з причиною та
повідомленням, яке агент має передати. Керовані сеанси Chrome видають вступ або
тестову фразу лише після того, як стан браузера повідомить `inCall: true`; інакше статус повідомляє
`speechReady: false`, а спробу мовлення блокують замість удавання, що
агент говорив у зустрічі.

Локальні приєднання Chrome використовують профіль браузера OpenClaw, у якому виконано вхід. Realtime-режим
потребує `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для
чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного
пристрою BlackHole достатньо для першого smoke test, але він може створювати луну.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM,
лише щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть
node host у VM. Увімкніть bundled Plugin на VM один раз, щоб node
оголошував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, realtime
  provider і конфігурація Plugin Google Meet.
- Parallels macOS VM: OpenClaw CLI/node host, Google Chrome, SoX, BlackHole 2ch,
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

Установіть або оновіть OpenClaw у VM, а потім увімкніть там bundled Plugin:

```bash
openclaw plugins enable google-meet
```

Запустіть node host у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це LAN IP і ви не використовуєте TLS, node відмовиться від
plaintext WebSocket, якщо ви явно не дозволите це для довіреної приватної мережі:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Використовуйте ту саму змінну середовища під час встановлення node як LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це середовище процесу, а не налаштування
`openclaw.json`. `openclaw node install` зберігає його в середовищі LaunchAgent,
коли воно присутнє в команді встановлення.

Схваліть node з хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить node і що він оголошує як `googlemeet.chrome`,
так і можливість браузера/`browser.proxy`:

```bash
openclaw nodes status
```

Маршрутизуйте Meet через цей node на хості Gateway:

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
фразу й друкує стан сеансу:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час realtime-приєднання автоматизація браузера OpenClaw заповнює ім’я гостя, натискає
Join/Ask to join і приймає початковий вибір Meet "Use microphone", коли цей
запит з’являється. Під час приєднання лише для спостереження або створення зустрічі лише в браузері вона
проходить далі той самий запит без мікрофона, коли такий вибір доступний.
Якщо в профілі браузера не виконано вхід, Meet очікує допуску хостом,
Chrome потребує дозволу на мікрофон/камеру для realtime-приєднання або Meet застряг
на запиті, який автоматизація не змогла розв’язати, результат join/test-speech повідомляє
`manualActionRequired: true` з `manualActionReason` і
`manualActionMessage`. Агенти мають припинити повторні спроби приєднання, повідомити це точне
повідомлення плюс поточні `browserUrl`/`browserTitle` і повторювати спробу лише після завершення
ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає лише тоді, коли рівно один
підключений node оголошує як `googlemeet.chrome`, так і керування браузером. Якщо
підключено кілька придатних node, установіть `chromeNode.node` як id node,
відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `Configured Google Meet node ... is not usable: offline`: закріплений вузол
  відомий Gateway, але недоступний. Агенти мають розглядати цей вузол як
  діагностичний стан, а не як придатний хост Chrome, і повідомляти про блокер
  налаштування замість переходу на інший транспорт, якщо користувач цього не просив.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  схваліть сполучення та переконайтеся, що `openclaw plugins enable google-meet` і
  `openclaw plugins enable browser` були виконані у VM. Також підтвердьте, що
  хост Gateway дозволяє обидві команди вузла через
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: установіть `blackhole-2ch` на хості,
  який перевіряється, і перезавантажтеся перед використанням локального аудіо Chrome.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch`
  у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або
  залиште `chrome.guestName` заданим для гостьового приєднання. Автоматичне гостьове приєднання використовує автоматизацію браузера OpenClaw
  через проксі браузера вузла; переконайтеся, що конфігурація браузера вузла
  вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або іменований профіль наявного сеансу.
- Дублікати вкладок Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw
  активує наявну вкладку для тієї самої URL-адреси Meet перед відкриттям нової, а
  створення зустрічі в браузері повторно використовує незавершену вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google перед відкриттям іншої.
- Немає аудіо: у Meet спрямуйте мікрофон/динамік через шлях віртуального аудіопристрою,
  який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію у стилі Loopback
  для чистого дуплексного аудіо.

## Примітки щодо встановлення

Стандартне реального часу Chrome використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для аудіо. Plugin використовує явні команди пристрою CoreAudio
  для стандартного 24 кГц PCM16 аудіомоста.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`,
  через який Chrome/Meet можуть маршрутизувати аудіо.

OpenClaw не комплектує й не розповсюджує жоден із цих пакетів. Документація просить користувачів
установити їх як залежності хоста через Homebrew. SoX ліцензовано як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole має ліцензію GPL-3.0. Якщо ви створюєте
інсталятор або appliance, який комплектує BlackHole з OpenClaw, перегляньте умови
ліцензування BlackHole upstream або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL Meet через керування браузером OpenClaw і приєднується
як профіль браузера OpenClaw, у який виконано вхід. На macOS Plugin перевіряє наявність
`BlackHole 2ch` перед запуском. Якщо налаштовано, він також виконує команду перевірки справності аудіомоста
та стартову команду перед відкриттям Chrome. Використовуйте `chrome`, коли
Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють
на сполученому вузлі, наприклад VM Parallels macOS. Для локального Chrome виберіть
профіль через `browser.defaultProfile`; `chrome.browserProfile` передається хостам
`chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона й динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування
замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план набору, делегований Plugin Voice Call. Він
не аналізує сторінки Meet для пошуку телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або потрібен резервний варіант телефонного дозвону.
Google Meet має надавати телефонний номер для дозвону та PIN для
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

Надайте облікові дані Twilio через середовище або конфігурацію. Середовище зберігає
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

Коли делегування Twilio підключене, `googlemeet setup` містить успішні
перевірки `twilio-voice-call-plugin` і `twilio-voice-call-credentials`.

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

OAuth є необов’язковим для створення посилання Meet, оскільки `googlemeet create` може
повертатися до автоматизації браузера. Налаштуйте OAuth, коли вам потрібне офіційне створення через API,
визначення простору або попередні перевірки Meet Media API.

Доступ до Google Meet API використовує користувацький OAuth: створіть клієнт Google Cloud OAuth,
запитайте потрібні області доступу, авторизуйте обліковий запис Google, а потім збережіть
отриманий refresh token у конфігурації Plugin Google Meet або надайте
змінні середовища `OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання Chrome. Транспорти Chrome і Chrome-node
все одно приєднуються через профіль Chrome, у який виконано вхід, BlackHole/SoX і підключений
вузол, коли ви використовуєте участь через браузер. OAuth призначений лише для офіційного шляху
Google Meet API: створення просторів зустрічей, визначення просторів і виконання попередніх перевірок Meet Media API.

### Створіть облікові дані Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** є найпростішим для організації Google Workspace.
   - **External** підходить для особистих/тестових налаштувань; доки застосунок перебуває в Testing,
     додайте кожен обліковий запис Google, який авторизуватиме застосунок, як тестового користувача.
4. Додайте області доступу, які запитує OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Створіть OAuth client ID.
   - Тип застосунку: **Web application**.
   - Авторизований URI перенаправлення:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Скопіюйте client ID і client secret.

`meetings.space.created` потрібен Google Meet `spaces.create`.
`meetings.space.readonly` дає OpenClaw змогу визначати URL/коди Meet як простори.
`meetings.conference.media.readonly` призначений для попередньої перевірки Meet Media API та роботи з медіа;
Google може вимагати участі в Developer Preview для фактичного використання Media API.
Якщо вам потрібні лише приєднання Chrome на основі браузера, повністю пропустіть OAuth.

### Створіть refresh token

Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, або передайте їх як
змінні середовища, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить конфігураційний блок `oauth` із refresh token. Вона використовує PKCE,
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

Надавайте перевагу змінним середовища, коли не хочете зберігати refresh token у конфігурації.
Якщо присутні і значення конфігурації, і значення середовища, Plugin спершу використовує конфігурацію,
а потім резервне значення середовища.

Згода OAuth включає створення простору Meet, доступ на читання простору Meet і доступ на читання
медіа конференції Meet. Якщо ви автентифікувалися до появи підтримки створення зустрічей,
повторно виконайте `openclaw googlemeet auth login --json`, щоб refresh
token мав область доступу `meetings.space.created`.

### Перевірте OAuth через doctor

Запустіть doctor OAuth, коли потрібна швидка перевірка справності без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує runtime Chrome і не потребує підключеного вузла Chrome. Він
перевіряє, що конфігурація OAuth існує і що refresh token може створити access
token. Звіт JSON містить лише поля стану, як-от `ok`, `configured`,
`tokenSource`, `expiresAt`, і повідомлення перевірок; він не виводить access
token, refresh token або client secret.

Поширені результати:

| Перевірка            | Значення                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `oauth-config`       | Наявний `oauth.clientId` плюс `oauth.refreshToken` або кешований access token.           |
| `oauth-token`        | Кешований access token досі дійсний, або refresh token створив новий access token.       |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` визначила наявний простір Meet.                      |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий простір Meet.                    |

Щоб також довести ввімкнення Google Meet API і область доступу `spaces.create`, виконайте
перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює одноразову URL-адресу Meet. Використовуйте це, коли потрібно підтвердити,
що в проєкті Google Cloud увімкнено Meet API і що авторизований
обліковий запис має область доступу `meetings.space.created`.

Щоб довести доступ на читання для наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` доводять доступ на читання до наявного
простору, до якого авторизований обліковий запис Google має доступ. `403` від цих перевірок
зазвичай означає, що Google Meet REST API вимкнено, погодженому refresh token
бракує потрібної області доступу або обліковий запис Google не може отримати доступ до цього простору Meet.
Помилка refresh-token означає, що потрібно повторно виконати `openclaw googlemeet auth login
--json` і зберегти новий блок `oauth`.

Облікові дані OAuth не потрібні для резервного режиму браузера. У цьому режимі автентифікація Google
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

Розпізнайте URL Meet, код або `spaces/{id}` через `spaces.get`:

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

З `--meeting`, `artifacts` і `attendance` типово використовують найновіший запис конференції. Передайте `--all-conference-records`, коли потрібні всі збережені записи для цієї зустрічі.

Пошук у календарі може визначити URL зустрічі з Google Calendar перед читанням артефактів Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` шукає в сьогоднішньому календарі `primary` подію Calendar із посиланням Google Meet. Використовуйте `--event <query>` для пошуку відповідного тексту події, а `--calendar <id>` для неосновного календаря. Пошук у календарі потребує нового входу OAuth, який містить readonly-область подій Calendar. `calendar-events` попередньо показує відповідні події Meet і позначає подію, яку виберуть `latest`, `artifacts`, `attendance` або `export`.

Якщо ви вже знаєте ідентифікатор запису конференції, зверніться до нього напряму:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

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

`artifacts` повертає метадані запису конференції, а також метадані ресурсів учасників, записів, транскрипту, структурованих записів транскрипту та розумних нотаток, коли Google надає їх для зустрічі. Використовуйте `--no-transcript-entries`, щоб пропустити пошук записів для великих зустрічей. `attendance` розгортає учасників у рядки сеансів учасників із часом першої/останньої появи, загальною тривалістю сеансу, прапорцями запізнення/раннього виходу та об'єднаними дублікатами ресурсів учасників за користувачем, що ввійшов, або відображуваним ім'ям. Передайте `--no-merge-duplicates`, щоб зберегти необроблені ресурси учасників окремо, `--late-after-minutes`, щоб налаштувати виявлення запізнення, і `--early-before-minutes`, щоб налаштувати виявлення раннього виходу.

`export` записує папку, що містить `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`. `manifest.json` фіксує вибрані вхідні дані, параметри експорту, записи конференції, вихідні файли, кількості, джерело токена, подію Calendar, якщо її використано, і будь-які попередження про часткове отримання. Передайте `--zip`, щоб також записати переносний архів поруч із папкою. Передайте `--include-doc-bodies`, щоб експортувати пов'язані тексти транскриптів і розумних нотаток Google Docs через Google Drive `files.export`; для цього потрібен новий вхід OAuth, що містить readonly-область Drive Meet. Без `--include-doc-bodies` експорти містять лише метадані Meet і структуровані записи транскрипту. Якщо Google повертає частковий збій артефакту, наприклад помилку списку розумних нотаток, запису транскрипту або тіла документа Drive, підсумок і маніфест зберігають попередження замість того, щоб провалити весь експорт. Використовуйте `--dry-run`, щоб отримати ті самі дані артефактів/відвідуваності та надрукувати JSON маніфесту без створення папки або ZIP. Це корисно перед записом великого експорту або коли агенту потрібні лише кількості, вибрані записи та попередження.

Агенти також можуть створити такий самий набір через інструмент `google_meet`:

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

Запустіть захищений live smoke проти справжньої збереженої зустрічі:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Середовище live smoke:

- `OPENCLAW_LIVE_TEST=1` вмикає захищені live-тести.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` указує на збережений URL Meet, код або
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID` надає OAuth
  client id.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN` надає
  refresh token.
- Необов'язково: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` і
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` використовують ті самі fallback-назви
  без префікса `OPENCLAW_`.

Базовий live smoke для артефактів/відвідуваності потребує `https://www.googleapis.com/auth/meetings.space.readonly` і `https://www.googleapis.com/auth/meetings.conference.media.readonly`. Пошук у Calendar потребує `https://www.googleapis.com/auth/calendar.events.readonly`. Експорт тіла документа Drive потребує `https://www.googleapis.com/auth/drive.meet.readonly`.

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда друкує новий `meeting uri`, джерело та сеанс приєднання. З OAuth-обліковими даними вона використовує офіційний Google Meet API. Без OAuth-облікових даних вона використовує браузерний профіль закріпленого Chrome node, у якому виконано вхід, як fallback. Агенти можуть використовувати інструмент `google_meet` з `action: "create"`, щоб створити й приєднатися за один крок. Для створення лише URL передайте `"join": false`.

Приклад JSON-виводу з браузерного fallback:

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

Якщо браузерний fallback наштовхується на вхід Google або блокування дозволів Meet до того, як зможе створити URL, метод Gateway повертає невдалу відповідь, а інструмент `google_meet` повертає структуровані деталі замість звичайного рядка:

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

Коли агент бачить `manualActionRequired: true`, він має повідомити `manualActionMessage` разом із контекстом browser node/tab і припинити відкривати нові вкладки Meet, доки оператор не завершить крок у браузері.

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

Створення Meet типово приєднується до зустрічі. Транспорт Chrome або Chrome-node все ще потребує профілю Google Chrome із виконаним входом, щоб приєднатися через браузер. Якщо з профілю виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або помилку браузерного fallback і просить оператора завершити вхід Google перед повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud-проєкт, OAuth-принципал і учасники зустрічі зареєстровані в Google Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Спільний realtime-шлях Chrome потребує лише ввімкненого plugin, BlackHole, SoX і ключа backend realtime voice provider. OpenAI є типовим; установіть `realtime.provider: "google"`, щоб використовувати Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Установіть конфігурацію plugin у `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: необов'язковий ідентифікатор/назва/IP node для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім'я, що використовується на екрані гостя Meet без входу
- `chrome.autoJoin: true`: best-effort заповнення імені гостя та натискання Join Now через браузерну автоматизацію OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить, що вона in-call, перш ніж буде запущено realtime-вступ
- `chrome.audioFormat: "pcm16-24khz"`: аудіоформат command-pair. Використовуйте
  `"g711-ulaw-8khz"` лише для legacy/custom command pairs, які досі emit
  telephony audio.
- `chrome.audioInputCommand`: команда SoX, що читає з CoreAudio `BlackHole 2ch`
  і записує аудіо у `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX, що читає аудіо в `chrome.audioFormat`
  і записує в CoreAudio `BlackHole 2ch`
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли під'єднується realtime bridge; установіть її в `""`, щоб приєднатися мовчки
- `realtime.agentId`: необов'язковий ідентифікатор агента OpenClaw для
  `openclaw_agent_consult`; типово `main`

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

`voiceCall.enabled` типово дорівнює `true`; із транспортом Twilio він делегує фактичний PSTN-виклик і DTMF до Voice Call plugin. Якщо `voice-call` не ввімкнено, Google Meet усе ще може перевірити й записати план набору, але не може здійснити Twilio-виклик.

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
`transport: "chrome-node"`, коли Chrome працює на спареному вузлі, наприклад Parallels
VM. В обох випадках realtime-модель і `openclaw_agent_consult` працюють на
хості Gateway, тож облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сеанси або перевірити ідентифікатор сеансу. Використовуйте
`action: "speak"` із `sessionId` і `message`, щоб realtime-агент
заговорив негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сеанс,
запустити відому фразу й повернути стан `inCall`, коли хост Chrome може
про нього повідомити. `test_speech` завжди примусово встановлює `mode: "realtime"` і завершується помилкою, якщо його просять
працювати в `mode: "transcribe"`, оскільки сеанси лише для спостереження навмисно не можуть
виводити мовлення. Його результат `speechOutputVerified` базується на збільшенні байтів realtime-аудіовиходу
під час цього тестового виклику, тому повторно використаний сеанс зі старішим аудіо
не зараховується як свіжа успішна перевірка мовлення. Використовуйте `action: "leave"`, щоб позначити
сеанс завершеним.

`status` включає стан Chrome, коли він доступний:

- `inCall`: Chrome, схоже, перебуває всередині виклику Meet
- `micMuted`: найкраща доступна оцінка стану мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профілю
  браузера потрібен ручний вхід, допуск від хоста Meet, дозволи або
  відновлення керування браузером, перш ніж мовлення зможе працювати
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: чи
  кероване мовлення Chrome зараз дозволене. `speechReady: false` означає, що OpenClaw не
  надіслав вступну/тестову фразу в аудіоміст.
- `providerConnected` / `realtimeReady`: стан realtime-голосового мосту
- `lastInputAt` / `lastOutputAt`: останнє аудіо, побачене з мосту або надіслане до нього

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Консультація realtime-агента

Realtime-режим Chrome оптимізований для живого голосового циклу. Realtime-голосовий
провайдер чує аудіо зустрічі й говорить через налаштований аудіоміст.
Коли realtime-моделі потрібні глибше міркування, актуальна інформація або звичайні
інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw у фоновому режимі з нещодавнім
контекстом транскрипту зустрічі й повертає стислу усну відповідь до realtime
голосового сеансу. Потім голосова модель може промовити цю відповідь назад у зустріч.
Він використовує той самий спільний realtime-інструмент консультацій, що й Voice Call.

За замовчуванням консультації виконуються для агента `main`. Встановіть `realtime.agentId`, коли
лінія Meet має консультуватися з виділеним робочим простором агента OpenClaw, типовими параметрами моделі,
політикою інструментів, пам’яттю та історією сеансів.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: надати інструмент консультації й обмежити звичайного агента
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: надати інструмент консультації й дозволити звичайному агенту використовувати стандартну
  політику інструментів агента.
- `none`: не надавати інструмент консультації realtime-голосовій моделі.

Ключ сеансу консультації обмежений конкретним сеансом Meet, тож подальші виклики консультації
можуть повторно використовувати попередній контекст консультації під час тієї самої зустрічі.

Щоб примусово запустити усну перевірку готовності після повного приєднання Chrome до виклику:

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
- `nodes status` показує вибраний вузол як підключений.
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

Це доводить, що Plugin Gateway завантажено, вузол VM підключено з
поточним токеном, а аудіоміст Meet доступний, перш ніж агент відкриє
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

- `googlemeet setup` включає зелені перевірки `twilio-voice-call-plugin` і
  `twilio-voice-call-credentials`.
- `voicecall` доступний у CLI після перезавантаження Gateway.
- Повернений сеанс має `transport: "twilio"` і `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` завершує делегований голосовий виклик.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно редагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway.
Запущений агент бачить лише інструменти Plugin, зареєстровані поточним процесом Gateway.

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

Запустіть `googlemeet test-speech` і перевірте повернений стан Chrome. Якщо він
повідомляє `manualActionRequired: true`, покажіть `manualActionMessage` оператору
й припиніть повторні спроби, доки дія в браузері не буде завершена.

Типові ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису хоста Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’явиться нативний запит дозволів Chrome.
- Закрити або відновити завислий діалог дозволів Meet.

Не повідомляйте "not signed in" лише тому, що Meet показує "Do you want people to
hear you in the meeting?" Це проміжний екран вибору аудіо Meet; OpenClaw
натискає **Use microphone** через автоматизацію браузера, коли це доступно, і продовжує
чекати справжнього стану зустрічі. Для браузерного fallback лише для створення OpenClaw
може натиснути **Continue without microphone**, оскільки створення URL не потребує
realtime-аудіошляху.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує endpoint Google Meet API `spaces.create`,
коли налаштовано облікові дані OAuth. Без облікових даних OAuth він переходить на fallback
до браузера закріпленого вузла Chrome. Підтвердьте:

- Для створення через API: `oauth.clientId` і `oauth.refreshToken` налаштовані,
  або наявні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було видано після додавання підтримки створення.
  Старішим токенам може бракувати scope `meetings.space.created`; повторно виконайте
  `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для browser fallback: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений вузол із `browser.proxy` і
  `googlemeet.chrome`.
- Для browser fallback: профіль OpenClaw Chrome на цьому вузлі ввійшов
  у Google і може відкрити `https://meet.google.com/new`.
- Для browser fallback: повторні спроби повторно використовують наявну вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google, перш ніж відкривати нову вкладку. Якщо агент вичікує тайм-аут,
  повторіть виклик інструмента замість ручного відкриття ще однієї вкладки Meet.
- Для browser fallback: якщо інструмент повертає `manualActionRequired: true`, використовуйте
  повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і
  `manualActionMessage`, щоб спрямувати оператора. Не повторюйте спроби в циклі, доки цю
  дію не буде завершено.
- Для browser fallback: якщо Meet показує "Do you want people to hear you in the
  meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для
  fallback лише для створення, **Continue without microphone** через автоматизацію браузера
  й продовжити чекати згенерований URL Meet. Якщо він не може, помилка
  має згадувати `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте realtime-шлях:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "realtime"` для прослуховування/відповіді голосом. `mode: "transcribe"` навмисно
не запускає дуплексний realtime-голосовий міст. `googlemeet test-speech`
завжди перевіряє realtime-шлях і повідомляє, чи були помічені байти виходу мосту
для цього виклику. Якщо `speechOutputVerified` дорівнює false, а
`speechOutputTimedOut` дорівнює true, realtime-провайдер міг прийняти
висловлювання, але OpenClaw не побачив, щоб нові вихідні байти досягли аудіомоста Chrome.

Також перевірте:

- Ключ realtime-провайдера доступний на хості Gateway, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `sox` існує на хості Chrome.
- Мікрофон і динамік Meet спрямовані через віртуальний аудіошлях, який використовує
  OpenClaw.

`googlemeet doctor [session-id]` друкує сеанс, вузол, стан у виклику,
причину ручної дії, підключення realtime-провайдера, `realtimeReady`, активність
аудіовходу/аудіовиходу, останні аудіочасові мітки, лічильники байтів і URL браузера.
Використовуйте `googlemeet status [session-id]`, коли потрібен сирий JSON. Використовуйте
`googlemeet doctor --oauth`, коли потрібно перевірити refresh Google Meet OAuth
без розкриття токенів; додайте `--meeting` або `--create-space`, коли також потрібне
підтвердження Google Meet API.

Якщо агент дочекався тайм-ауту, а ви бачите вже відкриту вкладку Meet, перевірте цю вкладку
без відкриття ще однієї:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує та перевіряє
наявну вкладку Meet для вибраного транспорту. З `chrome` вона використовує локальне
керування браузером через Gateway; з `chrome-node` вона використовує налаштований
вузол Chrome. Вона не відкриває нову вкладку й не створює новий сеанс; вона повідомляє
поточний блокер, наприклад вхід, допуск, дозволи або стан вибору аудіо.
Команда CLI звертається до налаштованого Gateway, тож Gateway має бути запущений;
`chrome-node` також вимагає, щоб вузол Chrome був підключений.

### Перевірки налаштування Twilio не проходять

`twilio-voice-call-plugin` завершується помилкою, коли `voice-call` не дозволено або не ввімкнено.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` завершується помилкою, коли бекенд Twilio не має облікового
SID, токена автентифікації або номера абонента-відправника. Налаштуйте їх на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Потім перезапустіть або перезавантажте Gateway і виконайте:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` за замовчуванням перевіряє лише готовність. Щоб виконати пробний запуск для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли навмисно хочете здійснити реальний вихідний
дзвінок-сповіщення:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Виклик Twilio починається, але ніколи не входить у зустріч

Переконайтеся, що подія Meet містить дані телефонного підключення. Передайте точний номер
для набору й PIN або власну послідовність DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкові `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза
перед введенням PIN.

## Нотатки

Офіційний медіа API Google Meet орієнтований на приймання, тому для мовлення в
дзвінку Meet усе ще потрібен шлях учасника. Цей Plugin робить цю межу видимою:
Chrome обробляє участь через браузер і локальну маршрутизацію аудіо; Twilio обробляє
участь через телефонне підключення.

Режим реального часу Chrome потребує `BlackHole 2ch` і одного з таких варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує
  мостом моделі реального часу й передає аудіо у форматі `chrome.audioFormat` між цими
  командами та вибраним провайдером голосу реального часу. Типовий шлях Chrome —
  24 кГц PCM16; 8 кГц G.711 mu-law лишається доступним для застарілих пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда моста керує всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може повертати аудіо інших учасників назад у дзвінок.

`googlemeet speak` запускає активний міст аудіо реального часу для сеансу Chrome.
`googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих через Plugin
Voice Call, `leave` також завершує базовий голосовий виклик.

## Пов’язане

- [Plugin голосового виклику](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення Plugin](/uk/plugins/building-plugins)
