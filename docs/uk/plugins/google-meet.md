---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий дзвінок Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio зі стандартними налаштуваннями голосу в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-02T09:29:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: d97ad823b34264f0a1d8117d4517a4375ae414341c521b4c6d6d9a4db3f9d2bf
    source_path: plugins/google-meet.md
    workflow: 16
---

Підтримка учасника Google Meet для OpenClaw — Plugin навмисно працює явно:

- Він приєднується лише до явної URL-адреси `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися до
  поверненої URL-адреси.
- Голосовий режим `realtime` є типовим.
- Голосовий режим реального часу може звертатися назад до повного агента OpenClaw, коли потрібні глибші
  міркування або інструменти.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `realtime` для живого
  прослуховування/відповіді голосом або `transcribe`, щоб приєднатися/керувати браузером без
  мосту голосу реального часу.
- Автентифікація починається як особистий Google OAuth або вже виконаний вхід у профіль Chrome.
- Автоматичного оголошення про згоду немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на спареному Node-хості.
- Twilio приймає номер для дзвінка плюс необов’язковий PIN або послідовність DTMF; він
  не може напряму набрати URL Meet.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших
  агентських телеконференційних робочих процесів.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте бекенд-провайдера голосу реального часу.
OpenAI є типовим; Google Gemini Live також працює з
`realtime.provider: "google"`:

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

Вивід налаштування призначений бути читабельним для агента й обізнаним про режим. Він повідомляє про профіль Chrome,
прив’язку Node і, для приєднань Chrome у реальному часі, аудіоміст BlackHole/SoX
та відкладені перевірки вступу реального часу. Для приєднань лише для спостереження перевірте той самий
транспорт із `--mode transcribe`; цей режим пропускає передумови аудіо реального часу,
бо він не слухає й не говорить через міст:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Коли налаштовано делегування Twilio, налаштування також повідомляє, чи готові
Plugin `voice-call`, облікові дані Twilio та публічна доступність Webhook.
Сприймайте будь-яку перевірку `ok: false` як блокер для перевіреного транспорту й режиму,
перш ніж просити агента приєднатися. Використовуйте `openclaw googlemeet setup --json` для
скриптів або машинно-читабельного виводу. Використовуйте `--transport chrome`,
`--transport chrome-node` або `--transport twilio`, щоб попередньо перевірити конкретний
транспорт до спроби агента.

Для Twilio завжди явно попередньо перевіряйте транспорт, коли типовий транспорт
— Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Це виявляє відсутню проводку `voice-call`, облікові дані Twilio або недосяжну
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
  "mode": "realtime"
}
```

Інструмент `google_meet` для агента залишається доступним на хостах не macOS для
артефактів, календаря, налаштування, транскрибування, Twilio та потоків `chrome-node`. Локальні
дії Chrome у реальному часі там заблоковані, бо вбудований аудіошлях Chrome реального часу
зараз залежить від macOS `BlackHole 2ch`. На Linux використовуйте
`mode: "transcribe"`, дзвінок через Twilio або macOS-хост `chrome-node` для участі Chrome
у реальному часі.

Створити нову зустріч і приєднатися до неї:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Для кімнат, створених через API, використовуйте Google Meet `SpaceConfig.accessType`, коли хочете,
щоб політика кімнати без очікування допуску була явною, а не успадкованою з типових параметрів Google
облікового запису:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` дозволяє будь-кому з URL Meet приєднатися без очікування допуску. `TRUSTED` дозволяє
довіреним користувачам організації хоста, запрошеним зовнішнім користувачам і користувачам, що набирають номер,
приєднуватися без очікування допуску. `RESTRICTED` обмежує вхід без очікування допуску запрошеними. Ці
налаштування застосовуються лише до офіційного шляху створення через Google Meet API, тому
облікові дані OAuth мають бути налаштовані.

Якщо ви автентифікували Google Meet до появи цієї опції, повторно виконайте
`openclaw googlemeet auth login --json` після додавання scope
`meetings.space.settings` на екрані згоди Google OAuth.

Створити лише URL без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це
  найбільш детермінований шлях, який не залежить від стану UI браузера.
- Резервний браузерний шлях: використовується, коли облікових даних OAuth немає. OpenClaw використовує
  прив’язаний Chrome Node, відкриває `https://meet.google.com/new`, чекає, доки Google
  перенаправить на справжню URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Цей шлях потребує,
  щоб у профілі Chrome OpenClaw на Node вже був виконаний вхід у Google.
  Браузерна автоматизація обробляє власний первинний запит Meet на доступ до мікрофона; цей запит
  не вважається помилкою входу в Google.
  Потоки приєднання та створення також намагаються повторно використати наявну вкладку Meet перед відкриттям
  нової. Зіставлення ігнорує нешкідливі рядки запиту URL, як-от `authuser`, тож
  повторна спроба агента має сфокусувати вже відкриту зустріч замість створення другої
  вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` типово приєднується до нової зустрічі та
повертає `joined: true` плюс сесію приєднання. Щоб лише створити URL, використовуйте
`create --no-join` у CLI або передайте `"join": false` в інструмент.

Або скажіть агенту: "Створи Google Meet, приєднайся до нього з голосом реального часу й надішли
мені посилання." Агент має викликати `google_meet` з `action: "create"`, а
потім поділитися поверненим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Для приєднання лише для спостереження/керування браузером задайте `"mode": "transcribe"`. Це
не запускає дуплексний міст моделі реального часу, не потребує BlackHole або SoX
і не відповідатиме голосом у зустріч. Приєднання Chrome у цьому режимі також уникають
надання OpenClaw дозволів на мікрофон/камеру й уникають шляху Meet **Use
microphone**. Якщо Meet показує проміжний екран вибору аудіо, автоматизація намагається
шлях без мікрофона, а інакше повідомляє про ручну дію замість відкриття
локального мікрофона. У режимі транскрибування керовані транспорти Chrome також установлюють
найкращий можливий спостерігач субтитрів Meet. `googlemeet status --json` і
`googlemeet doctor` показують `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`
і короткий хвіст `recentTranscript`, щоб оператори могли зрозуміти, чи браузер
приєднався до дзвінка і чи субтитри Meet створюють текст.
Використовуйте `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, коли
потрібна перевірка так/ні: він приєднується в режимі транскрибування, чекає на свіжі субтитри або
зміни транскрипту й повертає `listenVerified`, `listenTimedOut`, поля
ручної дії та найновіший стан субтитрів.

Під час сесій реального часу статус `google_meet` містить стан браузера й аудіомоста,
як-от `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, останні часові мітки введення/виведення,
лічильники байтів і стан закриття моста. Якщо з’являється безпечний запит сторінки Meet,
браузерна автоматизація обробляє його, коли може. Запити входу, допуску хостом і
дозволів браузера/ОС повідомляються як ручна дія з причиною та
повідомленням для агента. Керовані сесії Chrome відтворюють вступ або
тестову фразу лише після того, як стан браузера повідомить `inCall: true`; інакше статус повідомляє
`speechReady: false`, а спроба мовлення блокується замість імітації, що
агент говорив у зустріч.

Локальні приєднання Chrome проходять через профіль браузера OpenClaw із виконаним входом. Режим реального часу
потребує `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для
чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного
пристрою BlackHole достатньо для першого smoke test, але він може створювати відлуння.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM
лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, потім запустіть
Node-хост у VM. Увімкніть вбудований Plugin у VM один раз, щоб Node
оголошував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, провайдер реального часу
  і конфігурація Plugin Google Meet.
- Parallels macOS VM: OpenClaw CLI/Node-хост, Google Chrome, SoX, BlackHole 2ch
  і профіль Chrome із входом у Google.
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

Установіть або оновіть OpenClaw у VM, потім увімкніть там вбудований Plugin:

```bash
openclaw plugins enable google-meet
```

Запустіть Node-хост у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — LAN IP і ви не використовуєте TLS, Node відхиляє
відкритий WebSocket, якщо ви не погодитеся на нього для цієї довіреної приватної мережі:

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

Схваліть Node з хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить Node і що він оголошує як `googlemeet.chrome`,
так і можливість браузера/`browser.proxy`:

```bash
openclaw nodes status
```

Маршрутизуйте Meet через цей Node на хості Gateway:

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

Для smoke test однією командою, який створює або повторно використовує сесію, промовляє відому
фразу й друкує стан сесії:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час realtime-приєднання автоматизація браузера OpenClaw заповнює ім'я гостя, натискає
Join/Ask to join і приймає перший вибір Meet "Use microphone", коли цей
запит з'являється. Під час observe-only-приєднання або створення зустрічі лише через браузер вона
продовжує після такого самого запиту без мікрофона, коли цей вибір доступний.
Якщо профіль браузера не має виконаного входу, Meet очікує допуску від організатора,
Chrome потребує дозволу на мікрофон/камеру для realtime-приєднання, або Meet застряг
на запиті, який автоматизація не змогла обробити, результат join/test-speech повідомляє
`manualActionRequired: true` з `manualActionReason` і
`manualActionMessage`. Агенти мають припинити повторювати приєднання, повідомити це точне
повідомлення разом із поточними `browserUrl`/`browserTitle` і повторити спробу лише після
завершення ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає лише тоді, коли рівно один
підключений node оголошує і `googlemeet.chrome`, і керування браузером. Якщо
підключено кілька придатних nodes, задайте для `chromeNode.node` id node,
відображуване ім'я або віддалену IP-адресу.

Типові перевірки збоїв:

- `Configured Google Meet node ... is not usable: offline`: закріплений node
  відомий Gateway, але недоступний. Агенти мають трактувати цей node як
  діагностичний стан, а не як придатний хост Chrome, і повідомити про блокер налаштування
  замість переходу на інший транспорт, якщо користувач не просив про це.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  схваліть pairing і переконайтеся, що `openclaw plugins enable google-meet` та
  `openclaw plugins enable browser` були виконані у VM. Також підтвердьте, що
  хост Gateway дозволяє обидві команди node через
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: установіть `blackhole-2ch` на хості,
  який перевіряється, і перезавантажте його перед використанням локального аудіо Chrome.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch`
  у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або
  залиште `chrome.guestName` заданим для гостьового приєднання. Гостьове автоприєднання використовує
  автоматизацію браузера OpenClaw через браузерний проксі node; переконайтеся, що конфігурація браузера node
  вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або іменований профіль наявного сеансу.
- Дублікати вкладок Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw
  активує наявну вкладку для тієї самої URL-адреси Meet перед відкриттям нової, а
  браузерне створення зустрічі повторно використовує поточну вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google перед відкриттям іншої.
- Немає аудіо: у Meet скеруйте аудіо мікрофона/динаміка через шлях віртуального аудіопристрою,
  який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію у стилі Loopback
  для чистого дуплексного аудіо.

## Примітки щодо встановлення

Типове Chrome realtime використовує два зовнішні інструменти:

- `sox`: аудіоутиліта командного рядка. Plugin використовує явні команди пристроїв CoreAudio
  для типового аудіомоста 24 kHz PCM16.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`,
  через який Chrome/Meet можуть маршрутизувати аудіо.

OpenClaw не постачає й не розповсюджує жоден із цих пакетів. Документація просить користувачів
установити їх як залежності хоста через Homebrew. SoX ліцензовано як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole має ліцензію GPL-3.0. Якщо ви створюєте
інсталятор або appliance, що постачає BlackHole разом з OpenClaw, перегляньте
умови ліцензування upstream BlackHole або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet через керування браузером OpenClaw і приєднується
як профіль браузера OpenClaw із виконаним входом. На macOS Plugin перевіряє наявність
`BlackHole 2ch` перед запуском. Якщо налаштовано, він також запускає команду перевірки стану
аудіомоста і команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли
Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють
на paired node, наприклад Parallels macOS VM. Для локального Chrome виберіть
профіль через `browser.defaultProfile`; `chrome.browserProfile` передається
хостам `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Скеруйте аудіо мікрофона та динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування
замість беззвучного приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це суворий план набору, делегований Plugin Voice Call. Він
не аналізує сторінки Meet для пошуку телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або потрібен резервний варіант
телефонного набору. Google Meet має показувати номер телефонного набору та PIN для
зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

Увімкніть Plugin Voice Call на хості Gateway, а не на Chrome node:

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

Надайте облікові дані Twilio через середовище або config. Середовище не дає
секретам потрапити в `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни config Plugin
не з'являються у вже запущеному процесі Gateway, доки він не перезавантажиться.

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

## OAuth і preflight

OAuth необов'язковий для створення посилання Meet, оскільки `googlemeet create` може
повертатися до автоматизації браузера. Налаштуйте OAuth, коли потрібне офіційне створення через API,
розв'язання простору або preflight-перевірки Meet Media API.

Доступ до Google Meet API використовує користувацький OAuth: створіть OAuth-клієнт Google Cloud,
запитайте потрібні scopes, авторизуйте обліковий запис Google, а потім збережіть
отриманий refresh token у config Plugin Google Meet або надайте
змінні середовища `OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання Chrome. Транспорти Chrome і Chrome-node
досі приєднуються через профіль Chrome із виконаним входом, BlackHole/SoX і підключений
node, коли ви використовуєте участь через браузер. OAuth призначений лише для офіційного
шляху Google Meet API: створення просторів зустрічей, розв'язання просторів і виконання
preflight-перевірок Meet Media API.

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
   - Авторизований redirect URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Скопіюйте client ID і client secret.

`meetings.space.created` потрібен Google Meet `spaces.create`.
`meetings.space.readonly` дає OpenClaw змогу розв'язувати URL-адреси/коди Meet у простори.
`meetings.space.settings` дає OpenClaw змогу передавати налаштування `SpaceConfig`, такі як
`accessType`, під час створення кімнати через API.
`meetings.conference.media.readonly` призначений для preflight Meet Media API і роботи з медіа;
Google може вимагати реєстрації Developer Preview для фактичного використання Media API.
Якщо вам потрібні лише браузерні приєднання Chrome, повністю пропустіть OAuth.

### Створення refresh token

Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, або передайте їх як
змінні середовища, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок config `oauth` з refresh token. Вона використовує PKCE,
localhost callback на `http://localhost:8085/oauth2callback` і ручний
потік copy/paste з `--manual`.

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

Збережіть об'єкт `oauth` у config Plugin Google Meet:

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

Надавайте перевагу змінним середовища, коли не хочете зберігати refresh token у config.
Якщо присутні і значення config, і значення середовища, Plugin спочатку розв'язує config,
а потім використовує fallback середовища.

Згода OAuth охоплює створення просторів Meet, доступ на читання до просторів Meet і доступ
на читання медіа конференцій Meet. Якщо ви автентифікувалися до появи підтримки створення
зустрічей, повторно виконайте `openclaw googlemeet auth login --json`, щоб refresh
token мав scope `meetings.space.created`.

### Перевірка OAuth через doctor

Запустіть OAuth doctor, коли потрібна швидка перевірка стану без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує runtime Chrome і не потребує підключеного Chrome node. Воно
перевіряє, що config OAuth існує і що refresh token може створити access
token. Звіт JSON містить лише поля стану, такі як `ok`, `configured`,
`tokenSource`, `expiresAt`, і повідомлення перевірок; він не друкує access
token, refresh token або client secret.

Типові результати:

| Перевірка            | Значення                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Присутній `oauth.clientId` плюс `oauth.refreshToken` або cached access token.           |
| `oauth-token`        | Cached access token ще дійсний або refresh token створив новий access token.           |
| `meet-spaces-get`    | Необов'язкова перевірка `--meeting` розв'язала наявний простір Meet.                   |
| `meet-spaces-create` | Необов'язкова перевірка `--create-space` створила новий простір Meet.                  |

Щоб також довести ввімкнення Google Meet API і scope `spaces.create`, запустіть
перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює одноразову Meet URL. Використовуйте його, коли потрібно підтвердити, що в проєкті Google Cloud увімкнено Meet API і що авторизований обліковий запис має scope `meetings.space.created`.

Щоб підтвердити доступ для читання до наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` підтверджують доступ для читання до наявного простору, до якого має доступ авторизований обліковий запис Google. `403` від цих перевірок зазвичай означає, що Google Meet REST API вимкнено, погоджений refresh token не має потрібного scope, або обліковий запис Google не має доступу до цього простору Meet. Помилка refresh-token означає, що потрібно повторно виконати `openclaw googlemeet auth login --json` і зберегти новий блок `oauth`.

Для резервного браузерного режиму облікові дані OAuth не потрібні. У цьому режимі автентифікація Google надходить із профілю Chrome, у який виконано вхід на вибраному вузлі, а не з конфігурації OpenClaw.

Ці змінні середовища приймаються як резервні:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` або `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` або `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` або
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` або `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` або `GOOGLE_MEET_PREVIEW_ACK`

Розв’яжіть Meet URL, код або `spaces/{id}` через `spaces.get`:

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

З `--meeting` команди `artifacts` і `attendance` типово використовують останній запис конференції. Передайте `--all-conference-records`, коли потрібні всі збережені записи для цієї зустрічі.

Пошук у Calendar може визначити URL зустрічі з Google Calendar перед читанням артефактів Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` шукає в сьогоднішньому календарі `primary` подію Calendar із посиланням Google Meet. Використовуйте `--event <query>` для пошуку відповідного тексту події, а `--calendar <id>` для неосновного календаря. Пошук у Calendar потребує свіжого входу OAuth, який включає scope Calendar events readonly.
`calendar-events` попередньо показує відповідні події Meet і позначає подію, яку вибере `latest`, `artifacts`, `attendance` або `export`.

Якщо ви вже знаєте ідентифікатор запису конференції, звертайтеся до нього напряму:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Завершіть активну конференцію для простору, створеного через API, коли потрібно закрити кімнату після дзвінка:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Це викликає Google Meet `spaces.endActiveConference` і потребує OAuth зі scope `meetings.space.created` для простору, яким може керувати авторизований обліковий запис. OpenClaw приймає Meet URL, код зустрічі або вхідні дані `spaces/{id}` і розв’язує їх у ресурс простору API перед завершенням активної конференції.
Це окремо від `googlemeet leave`: `leave` зупиняє локальну/сесійну участь OpenClaw, тоді як `end-active-conference` просить Google Meet завершити активну конференцію для простору.

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

`artifacts` повертає метадані запису конференції, а також метадані ресурсів учасників, записів, транскриптів, структурованих записів транскрипту та smart-note, коли Google надає їх для зустрічі. Використовуйте `--no-transcript-entries`, щоб пропустити пошук записів для великих зустрічей. `attendance` розгортає учасників у рядки participant-session із часом першої/останньої появи, загальною тривалістю сесії, прапорцями запізнення/раннього виходу та об’єднанням дубльованих ресурсів учасників за користувачем, який увійшов у систему, або відображуваним іменем. Передайте `--no-merge-duplicates`, щоб залишити сирі ресурси учасників окремо, `--late-after-minutes`, щоб налаштувати виявлення запізнення, і `--early-before-minutes`, щоб налаштувати виявлення раннього виходу.

`export` записує папку, що містить `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`. `manifest.json` фіксує вибрані вхідні дані, параметри експорту, записи конференції, вихідні файли, лічильники, джерело токена, подію Calendar, якщо вона використовувалась, і будь-які попередження про часткове отримання. Передайте `--zip`, щоб також записати переносний архів поряд із папкою. Передайте `--include-doc-bodies`, щоб експортувати пов’язаний текст транскрипту та smart-note Google Docs через Google Drive `files.export`; для цього потрібен свіжий вхід OAuth, який включає scope Drive Meet readonly. Без `--include-doc-bodies` експорти містять лише метадані Meet і структуровані записи транскрипту. Якщо Google повертає часткову помилку артефакту, наприклад помилку списку smart-note, запису транскрипту або тіла документа Drive, зведення й маніфест зберігають попередження замість того, щоб провалити весь експорт.
Використовуйте `--dry-run`, щоб отримати ті самі дані артефактів/відвідуваності й надрукувати JSON маніфесту без створення папки або ZIP. Це корисно перед записом великого експорту або коли агенту потрібні лише лічильники, вибрані записи та попередження.

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

Для валідації з пріоритетом слухання агенти мають використовувати `test_listen`, перш ніж стверджувати, що зустріч корисна:

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

Запустіть live браузерну перевірку з пріоритетом слухання проти зустрічі, де хтось говоритиме й доступні субтитри Meet:

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

Базовий live smoke для артефактів/відвідуваності потребує `https://www.googleapis.com/auth/meetings.space.readonly` і `https://www.googleapis.com/auth/meetings.conference.media.readonly`. Пошук у Calendar потребує `https://www.googleapis.com/auth/calendar.events.readonly`. Експорт тіла документа Drive потребує `https://www.googleapis.com/auth/drive.meet.readonly`.

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда друкує новий `meeting uri`, джерело та сесію приєднання. З обліковими даними OAuth вона використовує офіційний Google Meet API. Без облікових даних OAuth вона використовує як резервний варіант профіль браузера вузла pinned Chrome, у який виконано вхід. Агенти можуть використовувати інструмент `google_meet` з `action: "create"`, щоб створити й приєднатися за один крок. Для створення лише URL передайте `"join": false`.

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

Якщо браузерний резервний режим натрапляє на вхід у Google або блокувальник дозволів Meet до того, як зможе створити URL, метод Gateway повертає невдалу відповідь, а інструмент `google_meet` повертає структуровані деталі замість простого рядка:

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

Коли агент бачить `manualActionRequired: true`, він має повідомити `manualActionMessage` разом із контекстом вузла/вкладки браузера й припинити відкривати нові вкладки Meet, доки оператор не завершить браузерний крок.

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

Створення Meet типово приєднує до зустрічі. Транспорт Chrome або Chrome-node все одно потребує профілю Google Chrome, у який виконано вхід, щоб приєднатися через браузер. Якщо профіль вийшов із системи, OpenClaw повідомляє `manualActionRequired: true` або помилку браузерного резервного режиму й просить оператора завершити вхід у Google перед повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш проєкт Cloud, OAuth principal і учасники зустрічі зареєстровані в Google Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Загальний realtime шлях Chrome потребує лише ввімкненого плагіна, BlackHole, SoX і ключа бекенд-провайдера realtime voice. OpenAI є типовим; установіть `realtime.provider: "google"`, щоб використовувати Google Gemini Live:

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
- `chromeNode.node`: необов’язковий ідентифікатор/назва/IP node для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на екрані
  гостя Meet без входу в обліковий запис
- `chrome.autoJoin: true`: заповнення імені гостя та натискання Join Now за
  можливості через браузерну автоматизацію OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкривання дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить, що вона
  в дзвінку, перш ніж запускати realtime-вступ
- `chrome.audioFormat: "pcm16-24khz"`: аудіоформат пари команд. Використовуйте
  `"g711-ulaw-8khz"` лише для застарілих/користувацьких пар команд, які все ще
  передають телефонний звук.
- `chrome.audioInputCommand`: команда SoX, що читає з CoreAudio `BlackHole 2ch`
  і записує аудіо у `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX, що читає аудіо у `chrome.audioFormat`
  і записує до CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: необов’язкова команда локального мікрофона, яка
  записує підписаний 16-бітний little-endian моно PCM для виявлення втручання
  людини, поки активне відтворення асистента. Наразі це стосується
  розміщеного на Gateway мосту пари команд `chrome`.
- `chrome.bargeInRmsThreshold: 650`: RMS-рівень, що рахується людським
  перериванням на `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: піковий рівень, що рахується людським
  перериванням на `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: мінімальна затримка між повторними очищеннями
  людського переривання
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли
  realtime-міст підключається; встановіть `""`, щоб приєднуватися мовчки
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

Типове значення `voiceCall.enabled` — `true`; із транспортом Twilio вона
делегує фактичний PSTN-дзвінок, DTMF і вступне привітання Plugin Voice Call.
Voice Call відтворює послідовність DTMF перед відкриттям realtime-медіапотоку,
а потім використовує збережений вступний текст як початкове realtime-привітання.
Якщо `voice-call` не ввімкнено, Google Meet усе ще може перевірити й записати
план набору, але не може здійснити Twilio-дзвінок.

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

Використовуйте `transport: "chrome"`, коли Chrome працює на хості Gateway.
Використовуйте `transport: "chrome-node"`, коли Chrome працює на спареному node,
наприклад Parallels VM. В обох випадках realtime-модель і
`openclaw_agent_consult` працюють на хості Gateway, тому облікові дані моделі
залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сесії або перевірити
ідентифікатор сесії. Використовуйте `action: "speak"` з `sessionId` і `message`,
щоб realtime-агент заговорив негайно. Використовуйте `action: "test_speech"`,
щоб створити або повторно використати сесію, запустити відому фразу та повернути
стан `inCall`, коли хост Chrome може про нього повідомити. `test_speech` завжди
примусово встановлює `mode: "realtime"` і завершується помилкою, якщо попросити
його запуститися в `mode: "transcribe"`, бо сесії лише для спостереження
навмисно не можуть видавати мовлення. Його результат `speechOutputVerified`
базується на збільшенні байтів realtime-аудіовиходу під час цього тестового
виклику, тому повторно використана сесія зі старішим аудіо не рахується як
свіжа успішна перевірка мовлення. Використовуйте `action: "leave"`, щоб
позначити сесію завершеною.

`status` містить стан Chrome, коли він доступний:

- `inCall`: Chrome, схоже, перебуває всередині дзвінка Meet
- `micMuted`: стан мікрофона Meet за принципом найкращого зусилля
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профіль
  браузера потребує ручного входу, допуску від хоста Meet, дозволів або ремонту
  керування браузером, перш ніж мовлення зможе працювати
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: чи дозволене
  кероване мовлення Chrome зараз. `speechReady: false` означає, що OpenClaw не
  надіслав вступну/тестову фразу до аудіомоста.
- `providerConnected` / `realtimeReady`: стан realtime-голосового моста
- `lastInputAt` / `lastOutputAt`: останнє аудіо, побачене з моста або надіслане
  до нього
- `lastSuppressedInputAt` / `suppressedInputBytes`: local loopback-вхід,
  проігнорований, поки активне відтворення асистента

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime-консультація агента

Realtime-режим Chrome оптимізований для живого голосового циклу. Realtime
голосовий провайдер чує аудіо зустрічі й говорить через налаштований
аудіоміст. Коли realtime-моделі потрібне глибше міркування, актуальна інформація
або звичайні інструменти OpenClaw, вона може викликати
`openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw у фоновому режимі з
контекстом нещодавньої транскрипції зустрічі та повертає стислу усну відповідь
до realtime-голосової сесії. Голосова модель потім може промовити цю відповідь
назад у зустріч. Він використовує той самий спільний інструмент
realtime-консультації, що й Voice Call.

Типово консультації виконуються для агента `main`. Встановіть
`realtime.agentId`, коли lane Meet має консультуватися з окремим робочим
простором агента OpenClaw, типовими значеннями моделі, політикою інструментів,
пам’яттю та історією сесії.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: відкрити інструмент консультації та обмежити звичайного
  агента до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: відкрити інструмент консультації та дозволити звичайному агенту
  використовувати звичайну політику інструментів агента.
- `none`: не відкривати інструмент консультації для realtime голосової моделі.

Ключ сесії консультації обмежений кожною сесією Meet, тому подальші виклики
консультації можуть повторно використовувати попередній контекст консультації
під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після повного приєднання
Chrome до дзвінка:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повного smoke-тесту приєднання й мовлення:

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
- `googlemeet setup` містить `chrome-node-connected`, коли Chrome-node є
  типовим транспортом або node закріплено.
- `nodes status` показує, що вибраний node підключено.
- Вибраний node оголошує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до дзвінка, а `test-speech` повертає стан Chrome з
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

Це доводить, що Plugin Gateway завантажено, node VM підключено з поточним
токеном, а аудіоміст Meet доступний до того, як агент відкриє реальну вкладку
зустрічі.

Для Twilio smoke використовуйте зустріч, що надає телефонні дані для набору:

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
- `openclaw logs --follow` показує, що DTMF TwiML надано перед realtime TwiML,
  а потім realtime-міст із поставленим у чергу початковим привітанням.
- `googlemeet leave <sessionId>` завершує делегований голосовий дзвінок.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте
Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно редагували `plugins.entries.google-meet`, перезапустіть або
перезавантажте Gateway. Запущений агент бачить лише інструменти Plugin,
зареєстровані поточним процесом Gateway.

На хостах Gateway не з macOS агентський інструмент `google_meet` залишається
видимим, але локальні realtime-дії Chrome блокуються до того, як потраплять до
аудіомоста. Локальне realtime-аудіо Chrome наразі залежить від macOS
`BlackHole 2ch`, тому Linux-агентам слід використовувати `mode: "transcribe"`,
Twilio-набір або хост macOS `chrome-node` замість типового локального
realtime-шляху Chrome.

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

Node має бути підключений і перелічувати `googlemeet.chrome` плюс
`browser.proxy`. Конфігурація Gateway має дозволяти ці команди node:

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
повідомляє `gateway token mismatch`, перевстановіть або перезапустіть node з
поточним токеном Gateway. Для LAN Gateway це зазвичай означає:

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

Запустіть `googlemeet test-listen` для приєднань лише для спостереження або
`googlemeet test-speech` для realtime-приєднань, а потім перегляньте повернений
стан Chrome. Якщо будь-яка перевірка повідомляє `manualActionRequired: true`,
покажіть `manualActionMessage` оператору й припиніть повторні спроби, доки дію в
браузері не буде завершено.

Поширені ручні дії:

- Увійти до профілю Chrome.
- Допустити гостя з облікового запису хоста Meet.
- Надати дозволи Chrome на мікрофон/камеру, коли з’явиться нативний запит
  дозволів Chrome.
- Закрити або відремонтувати завислий діалог дозволів Meet.

Не повідомляйте "не виконано вхід" лише тому, що Meet показує "Чи хочете ви, щоб люди чули вас на зустрічі?" Це аудіо-проміжний екран вибору Meet; OpenClaw натискає **Використовувати мікрофон** через браузерну автоматизацію, коли це доступно, і продовжує чекати на реальний стан зустрічі. Для браузерного резервного режиму лише створення OpenClaw може натиснути **Продовжити без мікрофона**, бо створення URL не потребує шляху realtime-аудіо.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує endpoint Google Meet API `spaces.create`,
коли налаштовано облікові дані OAuth. Без облікових даних OAuth він переходить
до резервного використання закріпленого браузера вузла Chrome. Перевірте:

- Для створення через API: налаштовано `oauth.clientId` і `oauth.refreshToken`,
  або наявні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було випущено після додавання підтримки
  створення. У старіших токенах може бракувати scope `meetings.space.created`; повторно виконайте
  `openclaw googlemeet auth login --json` і оновіть конфігурацію plugin.
- Для браузерного резервного режиму: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений вузол із `browser.proxy` та
  `googlemeet.chrome`.
- Для браузерного резервного режиму: профіль OpenClaw Chrome на цьому вузлі
  увійшов у Google і може відкрити `https://meet.google.com/new`.
- Для браузерного резервного режиму: повторні спроби повторно використовують
  наявну вкладку `https://meet.google.com/new` або вкладку запиту облікового
  запису Google перед відкриттям нової вкладки. Якщо agent перевищує час
  очікування, повторіть виклик інструмента замість ручного відкриття іншої
  вкладки Meet.
- Для браузерного резервного режиму: якщо інструмент повертає
  `manualActionRequired: true`, використайте повернені `browser.nodeId`,
  `browser.targetId`, `browserUrl` і `manualActionMessage`, щоб скерувати
  оператора. Не повторюйте спроби в циклі, доки цю дію не буде завершено.
- Для браузерного резервного режиму: якщо Meet показує "Чи хочете ви, щоб люди
  чули вас на зустрічі?", залиште вкладку відкритою. OpenClaw має натиснути
  **Використовувати мікрофон** або, для резервного режиму лише створення,
  **Продовжити без мікрофона** через браузерну автоматизацію і продовжити
  чекати на згенерований URL Meet. Якщо це неможливо, помилка має згадувати
  `meet-audio-choice-required`, а не `google-login-required`.

### Agent приєднується, але не говорить

Перевірте realtime-шлях:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "realtime"` для прослуховування/відповіді голосом. `mode: "transcribe"` навмисно
не запускає duplex realtime voice bridge. Для налагодження лише спостереження
запустіть `openclaw googlemeet status --json <session-id>` після того, як учасники
заговорять, і перевірте `captioning`, `transcriptLines` та `lastCaptionText`. Якщо `inCall` має
значення true, але `transcriptLines` залишається `0`, субтитри Meet можуть бути
вимкнені, ніхто не говорив після встановлення спостерігача, UI Meet змінився або
live captions недоступні для мови/облікового запису цієї зустрічі.

`googlemeet test-speech` завжди перевіряє realtime-шлях і повідомляє, чи було
зафіксовано вихідні байти bridge для цього виклику. Якщо `speechOutputVerified` має значення false, а
`speechOutputTimedOut` має значення true, realtime provider міг прийняти
висловлювання, але OpenClaw не побачив, що нові вихідні байти досягли Chrome audio
bridge.

Також перевірте:

- Ключ realtime provider доступний на хості Gateway, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видно на хості Chrome.
- `sox` існує на хості Chrome.
- Мікрофон і динамік Meet спрямовано через віртуальний аудіошлях, який
  використовує OpenClaw.

`googlemeet doctor [session-id]` виводить session, node, стан in-call,
причину ручної дії, підключення realtime provider, `realtimeReady`, активність
аудіовходу/аудіовиходу, останні audio timestamps, byte counters і browser URL.
Використовуйте `googlemeet status [session-id] --json`, коли потрібен raw JSON. Використовуйте
`googlemeet doctor --oauth`, коли потрібно перевірити Google Meet OAuth refresh
без розкриття токенів; додайте `--meeting` або `--create-space`, коли також
потрібен доказ Google Meet API.

Якщо agent перевищив час очікування і ви бачите, що вкладка Meet уже відкрита,
перевірте цю вкладку, не відкриваючи іншу:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує та перевіряє
наявну вкладку Meet для вибраного transport. З `chrome` вона використовує локальне
керування браузером через Gateway; з `chrome-node` вона використовує налаштований
вузол Chrome. Вона не відкриває нову вкладку й не створює нову session; вона
повідомляє поточний blocker, наприклад стан login, admission, permissions або
audio-choice. Команда CLI звертається до налаштованого Gateway, тому Gateway має
бути запущений; `chrome-node` також вимагає, щоб вузол Chrome був підключений.

### Не проходять перевірки налаштування Twilio

`twilio-voice-call-plugin` завершується помилкою, коли `voice-call` не дозволено
або не ввімкнено. Додайте його до `plugins.allow`, увімкніть
`plugins.entries.voice-call` і перезавантажте Gateway.

`twilio-voice-call-credentials` завершується помилкою, коли в backend Twilio
бракує account SID, auth token або caller number. Налаштуйте їх на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` завершується помилкою, коли `voice-call` не має
публічного доступу webhook або коли `publicUrl` вказує на loopback чи простір
приватної мережі. Установіть `plugins.entries.voice-call.config.publicUrl` на
публічний URL provider або налаштуйте tunnel/Tailscale exposure для `voice-call`.

Loopback і приватні URL недійсні для carrier callbacks. Не використовуйте
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

Для локальної розробки використовуйте tunnel або Tailscale exposure замість URL
приватного хоста:

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

`voicecall smoke` за замовчуванням перевіряє лише готовність. Щоб виконати dry-run
для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли навмисно хочете здійснити реальний вихідний
notify call:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Виклик Twilio починається, але ніколи не входить у зустріч

Переконайтеся, що подія Meet містить дані phone dial-in. Передайте точний
dial-in number і PIN або власну DTMF sequence:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкові `w` або коми в `--dtmf-sequence`, якщо provider потребує
паузи перед введенням PIN.

Якщо телефонний виклик створено, але roster Meet ніколи не показує dial-in
participant:

- Запустіть `openclaw googlemeet doctor <session-id>`, щоб підтвердити делегований
  Twilio call ID, чи було поставлено DTMF у чергу, і чи було запитано вступне
  привітання.
- Запустіть `openclaw voicecall status --call-id <id>` і переконайтеся, що виклик
  усе ще активний.
- Запустіть `openclaw voicecall tail` і перевірте, що Twilio webhooks надходять
  до Gateway.
- Запустіть `openclaw logs --follow` і знайдіть послідовність Twilio Meet: Google
  Meet делегує приєднання, Voice Call зберігає pre-connect DTMF TwiML, віддає
  цей початковий TwiML, потім віддає realtime TwiML і запускає realtime bridge
  з `initialGreeting=queued`.
- Повторно запустіть `openclaw googlemeet setup --transport twilio`; успішна
  перевірка setup потрібна, але вона не доводить, що PIN sequence зустрічі
  правильна.
- Переконайтеся, що dial-in number належить тому самому запрошенню Meet і регіону,
  що й PIN.
- Збільште початкові паузи в `--dtmf-sequence`, якщо Meet відповідає повільно,
  наприклад `wwww123456#`.
- Якщо participant приєднується, але ви не чуєте привітання, перевірте
  `openclaw logs --follow` на наявність realtime TwiML, запуску realtime bridge і
  `initialGreeting=queued`. Привітання генерується з початкового повідомлення
  `voicecall.start` після підключення realtime bridge.

Якщо webhooks не надходять, спочатку налагодьте Voice Call plugin: provider має
досягати `plugins.entries.voice-call.config.publicUrl` або налаштованого tunnel.
Див. [Усунення несправностей голосових викликів](/uk/plugins/voice-call#troubleshooting).

## Примітки

Офіційний media API Google Meet орієнтований на приймання, тому мовлення в
дзвінок Meet усе ще потребує participant path. Цей plugin робить цю межу
видимою: Chrome обробляє браузерну участь і локальну маршрутизацію аудіо; Twilio
обробляє участь через phone dial-in.

Chrome realtime mode потребує `BlackHole 2ch` плюс одне з наведеного:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw володіє
  realtime model bridge і передає аудіо у `chrome.audioFormat` між цими
  командами та вибраним realtime voice provider. Стандартний шлях Chrome — це
  24 kHz PCM16; 8 kHz G.711 mu-law залишається доступним для legacy command pairs.
- `chrome.audioBridgeCommand`: зовнішня bridge command володіє всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого daemon.

Для чистого duplex-аудіо спрямовуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один
спільний пристрій BlackHole може повертати інших учасників назад у дзвінок як
луна.

З command-pair Chrome bridge `chrome.bargeInInputCommand` може слухати окремий
локальний мікрофон і очищати відтворення assistant, коли людина починає говорити.
Це зберігає людське мовлення попереду виводу assistant навіть тоді, коли спільний
BlackHole loopback input тимчасово приглушено під час відтворення assistant.
Як і `chrome.audioInputCommand` та `chrome.audioOutputCommand`, це локальна
команда, налаштована оператором. Використовуйте явний trusted command path або
argument list і не вказуйте на scripts із ненадійних розташувань.

`googlemeet speak` запускає активний realtime audio bridge для session Chrome.
`googlemeet leave` зупиняє цей bridge. Для sessions Twilio, делегованих через
Voice Call plugin, `leave` також завершує базовий voice call. Використовуйте
`googlemeet end-active-conference`, коли також хочете закрити активну конференцію
Google Meet для API-managed space.

## Пов’язане

- [Voice Call plugin](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення plugins](/uk/plugins/building-plugins)
