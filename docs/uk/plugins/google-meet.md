---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий дзвінок Google Meet
    - Ви налаштовуєте Chrome, Chrome Node або Twilio як транспорт Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL Meet через Chrome або Twilio з типовими налаштуваннями голосових відповідей агента'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-04T02:26:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: f26cfd51988f97228d7e45813683c247b29571f3168e0c29c739d512979c8fc9
    source_path: plugins/google-meet.md
    workflow: 16
---

Підтримка учасника Google Meet для OpenClaw — plugin навмисно працює явно:

- Він приєднується лише до явної URL-адреси `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися за
  поверненою URL-адресою.
- `agent` — стандартний режим відповіді голосом: транскрипція в реальному часі слухає,
  налаштований агент OpenClaw відповідає, а звичайний TTS OpenClaw говорить у Meet.
- `bidi` залишається доступним як резервний режим прямої голосової моделі в реальному часі.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `agent` для живого
  прослуховування/відповіді голосом, `bidi` для прямого резервного голосу в реальному часі або `transcribe`,
  щоб приєднатися/керувати браузером без мосту відповіді голосом.
- Автентифікація починається як персональний Google OAuth або вже авторизований профіль Chrome.
- Автоматичного оголошення згоди немає.
- Стандартний аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на спареному вузловому хості.
- Twilio приймає номер для дозвону плюс необов’язковий PIN або послідовність DTMF; він
  не може набирати URL Meet напряму.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших агентських
  робочих процесів телеконференцій.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте постачальника транскрипції в реальному часі
плюс звичайний TTS OpenClaw. OpenAI є стандартним постачальником транскрипції;
Google Gemini Live також працює з `realtime.provider: "google"` для
режиму `bidi`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` установлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор
Homebrew потребує перезавантаження, перш ніж macOS покаже пристрій:

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

Вивід налаштування призначений бути читабельним для агента та враховувати режим. Він повідомляє про профіль Chrome,
прив’язування вузла, а для приєднань Chrome у реальному часі — про аудіоміст
BlackHole/SoX і відкладені перевірки вступу в реальному часі. Для приєднань лише для спостереження перевірте той самий
транспорт за допомогою `--mode transcribe`; цей режим пропускає передумови аудіо в реальному часі,
оскільки він не слухає через міст і не говорить через нього:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Коли налаштовано делегування Twilio, налаштування також повідомляє, чи готові
plugin `voice-call`, облікові дані Twilio і публічне відкриття Webhook.
Вважайте будь-яку перевірку `ok: false` блокером для перевіреного транспорту й режиму
перед тим, як просити агента приєднатися. Використовуйте `openclaw googlemeet setup --json` для
скриптів або машинозчитуваного виводу. Використовуйте `--transport chrome`,
`--transport chrome-node` або `--transport twilio`, щоб попередньо перевірити конкретний
транспорт до того, як агент спробує його використати.

Для Twilio завжди явно попередньо перевіряйте транспорт, коли стандартним транспортом є Chrome:

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

Агентський інструмент `google_meet` залишається доступним на хостах не-macOS для
артефактів, календаря, налаштування, транскрибування, Twilio і потоків `chrome-node`. Локальні
дії відповіді голосом Chrome там заблоковані, оскільки вбудований аудіошлях Chrome
наразі залежить від macOS `BlackHole 2ch`. На Linux використовуйте `mode: "transcribe"`,
дозвін Twilio або хост macOS `chrome-node` для участі Chrome з відповіддю голосом.

Створіть нову зустріч і приєднайтеся до неї:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Для кімнат, створених через API, використовуйте Google Meet `SpaceConfig.accessType`, коли хочете,
щоб політика кімнати без стуку була явною, а не успадкованою зі стандартних налаштувань облікового запису Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` дозволяє будь-кому з URL Meet приєднуватися без стуку. `TRUSTED` дозволяє
довіреним користувачам організації хоста, запрошеним зовнішнім користувачам і користувачам дозвону
приєднуватися без стуку. `RESTRICTED` обмежує вхід без стуку запрошеними. Ці
налаштування застосовуються лише до офіційного шляху створення Google Meet API, тому облікові дані
OAuth мають бути налаштовані.

Якщо ви автентифікували Google Meet до появи цієї опції, повторно запустіть
`openclaw googlemeet auth login --json` після додавання області
`meetings.space.settings` до екрана згоди Google OAuth.

Створіть лише URL без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це
  найбільш детермінований шлях, який не залежить від стану інтерфейсу браузера.
- Резервний браузерний шлях: використовується, коли облікові дані OAuth відсутні. OpenClaw використовує
  закріплений вузол Chrome, відкриває `https://meet.google.com/new`, чекає, доки Google
  переспрямує на справжню URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Цей шлях потребує,
  щоб профіль OpenClaw Chrome на вузлі вже був авторизований у Google.
  Автоматизація браузера обробляє власний перший запит Meet на мікрофон; цей запит
  не вважається помилкою входу Google.
  Потоки приєднання і створення також намагаються повторно використати наявну вкладку Meet перед відкриттям
  нової. Зіставлення ігнорує нешкідливі рядки запиту URL, такі як `authuser`, тому
  повторна спроба агента має сфокусувати вже відкриту зустріч, а не створювати другу
  вкладку Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` стандартно приєднується до нової зустрічі та
повертає `joined: true` плюс сеанс приєднання. Щоб лише створити URL, використовуйте
`create --no-join` у CLI або передайте `"join": false` інструменту.

Або скажіть агенту: «Створи Google Meet, приєднайся до нього в режимі відповіді голосом агента
і надішли мені посилання». Агент має викликати `google_meet` з
`action: "create"`, а потім поділитися поверненим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Для приєднання лише для спостереження/керування браузером задайте `"mode": "transcribe"`. Це
не запускає дуплексний голосовий міст у реальному часі, не потребує BlackHole або SoX
і не відповідатиме голосом у зустріч. Приєднання Chrome у цьому режимі також уникають
надання OpenClaw дозволів на мікрофон/камеру та обходять шлях Meet **Використати
мікрофон**. Якщо Meet показує проміжний екран вибору аудіо, автоматизація пробує
шлях без мікрофона, а в іншому разі повідомляє про ручну дію замість відкриття
локального мікрофона. У режимі транскрибування керовані транспорти Chrome також установлюють
best-effort спостерігач субтитрів Meet. `googlemeet status --json` і
`googlemeet doctor` показують `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`
і короткий хвіст `recentTranscript`, щоб оператори могли зрозуміти, чи браузер
приєднався до виклику і чи субтитри Meet створюють текст.
Використовуйте `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, коли
потрібна перевірка так/ні: вона приєднується в режимі транскрибування, чекає на свіжий рух субтитрів або
транскрипту та повертає `listenVerified`, `listenTimedOut`, поля ручної
дії і найновіший стан субтитрів.

Під час сеансів у реальному часі статус `google_meet` містить стан браузера та аудіомоста,
зокрема `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, останні часові позначки вводу/виводу,
лічильники байтів і стан закриття моста. Якщо з’являється безпечний запит сторінки Meet,
автоматизація браузера обробляє його, коли може. Вхід, допуск хостом і
запити дозволів браузера/ОС повідомляються як ручна дія з причиною та
повідомленням, яке агент має передати. Керовані сеанси Chrome видають вступ або
тестову фразу лише після того, як стан браузера повідомляє `inCall: true`; інакше статус повідомляє
`speechReady: false`, а спроба мовлення блокується замість імітації, ніби
агент говорив у зустріч.

Локальні приєднання Chrome відбуваються через авторизований браузерний профіль OpenClaw. Режим реального часу
потребує `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для
чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного
пристрою BlackHole достатньо для першого smoke-тесту, але він може створювати відлуння.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM
лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть
вузловий хост у VM. Увімкніть вбудований plugin на VM один раз, щоб вузол
оголошував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, постачальник
  реального часу і конфігурація Google Meet plugin.
- Parallels macOS VM: OpenClaw CLI/вузловий хост, Google Chrome, SoX, BlackHole 2ch,
  і профіль Chrome, авторизований у Google.
- Не потрібно у VM: сервіс Gateway, конфігурація агента, ключ OpenAI/GPT або налаштування
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

Установіть або оновіть OpenClaw у VM, а потім увімкніть там вбудований plugin:

```bash
openclaw plugins enable google-meet
```

Запустіть вузловий хост у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — LAN IP і ви не використовуєте TLS, вузол відмовляється від
plaintext WebSocket, якщо ви явно не дозволите це для цієї довіреної приватної мережі:

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

Для smoke-тесту однією командою, який створює або повторно використовує сеанс, вимовляє відому
фразу і друкує стан сеансу:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання в реальному часі автоматизація браузера OpenClaw заповнює ім’я гостя, натискає Join/Ask to join і приймає перший вибір Meet "Use microphone", коли з’являється цей запит. Під час приєднання лише для спостереження або створення зустрічі лише через браузер вона продовжує після того самого запиту без мікрофона, коли такий вибір доступний. Якщо профіль браузера не ввійшов в обліковий запис, Meet очікує допуску від організатора, Chrome потребує дозволу на мікрофон/камеру для приєднання в реальному часі або Meet застряг на запиті, який автоматизація не змогла обробити, результат join/test-speech повідомляє `manualActionRequired: true` з `manualActionReason` і `manualActionMessage`. Агенти мають припинити повторні спроби приєднання, повідомити це точне повідомлення разом із поточними `browserUrl`/`browserTitle` і повторювати спробу лише після завершення ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw вибирає автоматично лише тоді, коли рівно один підключений вузол оголошує і `googlemeet.chrome`, і керування браузером. Якщо підключено кілька придатних вузлів, задайте `chromeNode.node` як id вузла, відображуване ім’я або віддалену IP-адресу.

Поширені перевірки помилок:

- `Configured Google Meet node ... is not usable: offline`: закріплений вузол відомий Gateway, але недоступний. Агенти мають розглядати цей вузол як діагностичний стан, а не як придатний хост Chrome, і повідомляти про блокер налаштування замість переходу на інший транспорт, якщо користувач про це не просив.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM, підтвердьте сполучення та переконайтеся, що `openclaw plugins enable google-meet` і `openclaw plugins enable browser` було виконано у VM. Також підтвердьте, що хост Gateway дозволяє обидві команди вузла через `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: установіть `blackhole-2ch` на хості, що перевіряється, і перезавантажтеся перед використанням локального аудіо Chrome.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch` у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або залиште `chrome.guestName` заданим для гостьового приєднання. Автоматичне гостьове приєднання використовує автоматизацію браузера OpenClaw через проксі браузера вузла; переконайтеся, що конфігурація браузера вузла вказує на потрібний профіль, наприклад `browser.defaultProfile: "user"` або іменований профіль наявного сеансу.
- Дубльовані вкладки Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw активує наявну вкладку для того самого URL Meet перед відкриттям нової, а створення зустрічі через браузер повторно використовує незавершену вкладку `https://meet.google.com/new` або вкладку запиту облікового запису Google перед відкриттям іншої.
- Немає аудіо: у Meet спрямуйте аудіо мікрофона/динаміка через шлях віртуального аудіопристрою, який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію у стилі Loopback для чистого двобічного аудіо.

## Нотатки щодо встановлення

Стандартний режим зворотного мовлення Chrome використовує два зовнішні інструменти:

- `sox`: аудіоутиліта командного рядка. Plugin використовує явні команди пристроїв CoreAudio для стандартного аудіомоста 24 kHz PCM16.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`, через який Chrome/Meet можуть маршрутизувати аудіо.

OpenClaw не вбудовує й не поширює жоден із цих пакетів. Документація просить користувачів установити їх як залежності хоста через Homebrew. SoX ліцензовано як `LGPL-2.0-only AND GPL-2.0-only`; BlackHole має GPL-3.0. Якщо ви створюєте інсталятор або appliance, який постачає BlackHole разом з OpenClaw, перегляньте умови ліцензування upstream BlackHole або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL Meet через керування браузером OpenClaw і приєднується як профіль браузера OpenClaw, що ввійшов в обліковий запис. На macOS Plugin перевіряє наявність `BlackHole 2ch` перед запуском. Якщо налаштовано, він також виконує команду перевірки стану аудіомоста та команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють на спареному вузлі, наприклад Parallels macOS VM. Для локального Chrome виберіть профіль через `browser.defaultProfile`; `chrome.browserProfile` передається хостам `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона та динаміка Chrome через локальний аудіоміст OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це суворий план набору, делегований Voice Call Plugin. Він не аналізує сторінки Meet для пошуку телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або потрібен резервний телефонний набір. Google Meet має надавати телефонний номер для набору та PIN для зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

Увімкніть Voice Call Plugin на хості Gateway, а не на вузлі Chrome:

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

Надайте облікові дані Twilio через середовище або конфігурацію. Середовище не допускає потрапляння секретів до `openclaw.json`:

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

Використовуйте `--dtmf-sequence`, коли зустріч потребує власної послідовності:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth і preflight

OAuth необов’язковий для створення посилання Meet, оскільки `googlemeet create` може повертатися до автоматизації браузера. Налаштуйте OAuth, коли потрібне офіційне створення через API, розв’язання просторів або preflight-перевірки Meet Media API.

Доступ до Google Meet API використовує користувацький OAuth: створіть OAuth-клієнт Google Cloud, запросіть потрібні scopes, авторизуйте обліковий запис Google, а потім збережіть отриманий refresh token у конфігурації Google Meet Plugin або надайте змінні середовища `OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання через Chrome. Транспорти Chrome і Chrome-node усе ще приєднуються через профіль Chrome, що ввійшов в обліковий запис, BlackHole/SoX і підключений вузол, коли ви використовуєте участь через браузер. OAuth призначений лише для офіційного шляху Google Meet API: створення просторів зустрічей, розв’язання просторів і виконання preflight-перевірок Meet Media API.

### Створення облікових даних Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** найпростіший для організації Google Workspace.
   - **External** працює для особистих/тестових налаштувань; доки застосунок перебуває в Testing, додайте кожен обліковий запис Google, який авторизуватиме застосунок, як тестового користувача.
4. Додайте scopes, які запитує OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Створіть OAuth client ID.
   - Тип застосунку: **Web application**.
   - Авторизований URI переспрямування:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Скопіюйте client ID і client secret.

`meetings.space.created` потрібен Google Meet `spaces.create`.
`meetings.space.readonly` дає OpenClaw змогу розв’язувати URL/коди Meet у простори.
`meetings.space.settings` дає OpenClaw змогу передавати налаштування `SpaceConfig`, як-от `accessType`, під час створення кімнати через API.
`meetings.conference.media.readonly` призначений для preflight Meet Media API та роботи з медіа; Google може вимагати участі в Developer Preview для фактичного використання Media API. Якщо вам потрібні лише приєднання через Chrome на основі браузера, повністю пропустіть OAuth.

### Випуск refresh token

Налаштуйте `oauth.clientId` і необов’язково `oauth.clientSecret` або передайте їх як змінні середовища, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда друкує конфігураційний блок `oauth` з refresh token. Вона використовує PKCE, callback localhost на `http://localhost:8085/oauth2callback` і ручний потік копіювання/вставлення з `--manual`.

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

Віддавайте перевагу змінним середовища, коли не хочете зберігати refresh token у конфігурації. Якщо присутні і значення конфігурації, і значення середовища, Plugin спочатку розв’язує конфігурацію, а потім fallback середовища.

Згода OAuth включає створення просторів Meet, доступ для читання просторів Meet і доступ для читання медіа конференцій Meet. Якщо ви автентифікувалися до появи підтримки створення зустрічей, повторно виконайте `openclaw googlemeet auth login --json`, щоб refresh token мав scope `meetings.space.created`.

### Перевірка OAuth через doctor

Запустіть OAuth doctor, коли потрібна швидка перевірка стану без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує runtime Chrome і не потребує підключеного вузла Chrome. Перевіряється, що конфігурація OAuth існує і що refresh token може випустити access token. Звіт JSON містить лише поля стану, як-от `ok`, `configured`, `tokenSource`, `expiresAt`, і повідомлення перевірок; він не друкує access token, refresh token або client secret.

Поширені результати:

| Перевірка            | Значення                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` плюс `oauth.refreshToken` або кешований access token присутні.         |
| `oauth-token`        | Кешований access token усе ще дійсний або refresh token випустив новий access token.    |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` розв’язала наявний простір Meet.                    |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий простір Meet.                   |

Щоб також підтвердити ввімкнення Google Meet API та scope `spaces.create`, виконайте перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює одноразову URL-адресу Meet. Використовуйте це, коли потрібно підтвердити,
що в проєкті Google Cloud увімкнено Meet API і що авторизований
обліковий запис має scope `meetings.space.created`.

Щоб підтвердити доступ на читання до наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` підтверджують доступ на читання до наявного
простору, до якого має доступ авторизований обліковий запис Google. `403` від цих перевірок
зазвичай означає, що Google Meet REST API вимкнено, узгоджений refresh token
не має потрібного scope, або обліковий запис Google не може отримати доступ до цього простору
Meet. Помилка refresh-token означає, що потрібно повторно виконати `openclaw googlemeet auth login
--json` і зберегти новий блок `oauth`.

Для браузерного fallback облікові дані OAuth не потрібні. У цьому режимі авторизація Google
надходить із профілю Chrome, у який виконано вхід, на вибраному Node, а не з
конфігурації OpenClaw.

Ці змінні середовища приймаються як fallback:

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
посиланням Google Meet. Використовуйте `--event <query>`, щоб шукати відповідний текст події, і
`--calendar <id>` для неосновного календаря. Пошук у календарі потребує нового
входу OAuth, який включає readonly scope для подій Calendar.
`calendar-events` попередньо показує відповідні події Meet і позначає подію, яку
вибере `latest`, `artifacts`, `attendance` або `export`.

Якщо ви вже знаєте ідентифікатор запису конференції, звертайтеся до нього напряму:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Завершіть активну конференцію для простору, створеного API, коли потрібно закрити
кімнату після дзвінка:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Це викликає Google Meet `spaces.endActiveConference` і потребує OAuth зі
scope `meetings.space.created` для простору, яким авторизований обліковий запис може керувати.
OpenClaw приймає URL-адресу Meet, код зустрічі або вхідні дані `spaces/{id}` і визначає їх
як ресурс простору API перед завершенням активної конференції.
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
транскрипту, структурованих записів транскрипту та smart-note, коли
Google надає їх для зустрічі. Використовуйте `--no-transcript-entries`, щоб пропустити
пошук записів для великих зустрічей. `attendance` розгортає учасників у
рядки сесій учасників із часом першої/останньої появи, загальною тривалістю сесії,
прапорцями запізнення/раннього виходу та дубльованими ресурсами учасників, об’єднаними за користувачем,
який увійшов у систему, або відображуваним іменем. Передайте `--no-merge-duplicates`, щоб залишити сирі ресурси учасників
окремо, `--late-after-minutes`, щоб налаштувати визначення запізнення, і
`--early-before-minutes`, щоб налаштувати визначення раннього виходу.

`export` записує папку, що містить `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`.
`manifest.json` записує вибрані вхідні дані, параметри експорту, записи конференції,
вихідні файли, лічильники, джерело токена, подію Calendar, якщо її було використано, і будь-які
попередження про часткове отримання. Передайте `--zip`, щоб також записати переносний архів поруч
із папкою. Передайте `--include-doc-bodies`, щоб експортувати пов’язаний транскрипт і
текст smart-note Google Docs через Google Drive `files.export`; для цього потрібен
новий вхід OAuth, який включає readonly scope Drive Meet. Без
`--include-doc-bodies` експорти включають лише метадані Meet і структуровані записи транскрипту.
Якщо Google повертає часткову помилку артефакту, наприклад помилку списку smart-note,
запису транскрипту або тіла документа Drive, summary і
manifest зберігають попередження замість збою всього експорту.
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

Задайте `"dryRun": true`, щоб повернути лише export manifest і пропустити запис файлів.

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

Для валідації listen-first агенти повинні використовувати `test_listen`, перш ніж стверджувати, що
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

Запустіть live browser probe у режимі listen-first для зустрічі, де хтось
говоритиме за доступних субтитрів Meet:

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
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` використовують ті самі fallback-назви
  без префікса `OPENCLAW_`.

Базовому live smoke для артефактів/відвідуваності потрібні
`https://www.googleapis.com/auth/meetings.space.readonly` і
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Пошуку в календарі потрібен `https://www.googleapis.com/auth/calendar.events.readonly`. Експорту тіла документа Drive потрібен
`https://www.googleapis.com/auth/drive.meet.readonly`.

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда друкує новий `meeting uri`, джерело та join session. З обліковими даними OAuth
вона використовує офіційний Google Meet API. Без облікових даних OAuth вона
використовує профіль браузера закріпленого Chrome Node, у який виконано вхід, як fallback. Агенти можуть
використовувати інструмент `google_meet` з `action: "create"`, щоб створити й приєднатися за один
крок. Для створення лише URL-адреси передайте `"join": false`.

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

Якщо браузерний fallback натрапляє на вхід у Google або блокування дозволів Meet перед тим, як
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
`manualActionMessage` разом із контекстом browser node/tab і припинити відкривати нові
вкладки Meet, доки оператор не завершить крок у браузері.

Приклад JSON-виводу з API create:

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

Створення Meet за замовчуванням приєднує до нього. Транспорт Chrome або Chrome-node усе ще
потребує профілю Google Chrome, у який виконано вхід, щоб приєднатися через браузер. Якщо з
профілю виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або
помилку браузерного fallback і просить оператора завершити вхід у Google перед
повторною спробою.

Задавайте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
project, OAuth principal і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Звичайному шляху агента Chrome потрібні лише увімкнений plugin, BlackHole, SoX,
ключ realtime-провайдера транскрибування та налаштований OpenClaw TTS provider.
OpenAI є стандартним провайдером транскрибування; задайте `realtime.provider: "google"`,
щоб використовувати Google Gemini Live для режиму `bidi`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Установіть конфігурацію Plugin у `plugins.entries.google-meet.config`:

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

Стандартні значення:

- `defaultTransport: "chrome"`
- `defaultMode: "agent"` (`"realtime"` приймається лише як застарілий псевдонім
  сумісності для `"agent"`; нові виклики інструментів мають указувати `"agent"`)
- `chromeNode.node`: необов’язковий ідентифікатор, назва або IP вузла для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на екрані
  гостя Meet без входу в обліковий запис
- `chrome.autoJoin: true`: найкраща можлива автоматична підстановка імені гостя
  та натискання Join Now через браузерну автоматизацію OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить, що
  вона у виклику, перед запуском вступного голосового відгуку
- `chrome.audioFormat: "pcm16-24khz"`: аудіоформат пари команд. Використовуйте
  `"g711-ulaw-8khz"` лише для застарілих або користувацьких пар команд, які все
  ще видають телефонний аудіопотік.
- `chrome.audioInputCommand`: команда SoX, що читає з CoreAudio `BlackHole 2ch`
  і записує аудіо у форматі `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX, що читає аудіо у форматі
  `chrome.audioFormat` і записує до CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: необов’язкова команда локального мікрофона, яка
  записує підписаний 16-бітний little-endian моно PCM для виявлення втручання
  людини, поки активне відтворення асистента. Наразі це застосовується до
  розміщеного в Gateway мосту пари команд `chrome`.
- `chrome.bargeInRmsThreshold: 650`: рівень RMS, який вважається людським
  перериванням у `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: піковий рівень, який вважається людським
  перериванням у `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: мінімальна затримка між повторними очищеннями
  людського переривання
- `mode: "agent"`: стандартний режим голосового відгуку. Мовлення учасників
  транскрибується налаштованим провайдером транскрипції в реальному часі,
  надсилається налаштованому агенту OpenClaw у сесії під-агента для окремої
  зустрічі та озвучується назад через звичайне середовище виконання TTS OpenClaw.
- `mode: "bidi"`: резервний прямий двонапрямний режим моделі реального часу.
  Голосовий провайдер реального часу відповідає на мовлення учасників напряму
  і може викликати `openclaw_agent_consult` для глибших відповідей із підтримкою
  інструментів.
- `mode: "transcribe"`: режим лише спостереження без мосту голосового відгуку.
- `realtime.provider: "openai"`: ідентифікатор провайдера, який режим `agent`
  використовує для транскрипції в реальному часі, а режим `bidi` — для голосу
  в реальному часі.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді з використанням
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли міст
  реального часу підключається; установіть значення `""`, щоб приєднуватися
  без звуку
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

Стандартне значення `voiceCall.enabled` — `true`; з транспортом Twilio він
делегує фактичний виклик PSTN, DTMF і вступне привітання до Voice Call Plugin.
Voice Call відтворює послідовність DTMF перед відкриттям медіапотоку реального
часу, а потім використовує збережений вступний текст як початкове привітання
в реальному часі. Якщо `voice-call` не ввімкнено, Google Meet усе ще може
перевірити та записати план набору, але не може здійснити виклик Twilio.

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
хості Gateway, тому облікові дані моделей залишаються там. Із типовим `mode: "agent"`
провайдер транскрипції в реальному часі обробляє прослуховування, налаштований агент OpenClaw
створює відповідь, а звичайний OpenClaw TTS озвучує її в Meet. Використовуйте
`mode: "bidi"`, коли хочете, щоб голосова модель реального часу відповідала напряму.
Сире значення `mode: "realtime"` і надалі приймається як застарілий сумісний псевдонім для
`mode: "agent"`, але більше не рекламується в схемі інструментів агента.

Використовуйте `action: "status"`, щоб перелічити активні сеанси або перевірити ID сеансу. Використовуйте
`action: "speak"` із `sessionId` і `message`, щоб агент реального часу
негайно заговорив. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сеанс,
запустити відому фразу й повернути стан `inCall`, коли хост Chrome може
повідомити про нього. `test_speech` завжди примусово встановлює `mode: "agent"` і завершується помилкою, якщо його попросити
запуститися в `mode: "transcribe"`, оскільки сеанси лише для спостереження навмисно не можуть
відтворювати мовлення. Його результат `speechOutputVerified` базується на збільшенні байтів аудіовиходу в реальному часі
під час цього тестового виклику, тому повторно використаний сеанс зі старішим аудіо
не зараховується як нова успішна перевірка мовлення. Використовуйте `action: "leave"`, щоб позначити
сеанс завершеним.

`status` включає стан Chrome, коли він доступний:

- `inCall`: Chrome, схоже, перебуває всередині виклику Meet
- `micMuted`: приблизний стан мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профілю
  браузера потрібні ручний вхід, допуск хостом Meet, дозволи або
  відновлення керування браузером, перш ніж мовлення зможе працювати
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: чи
  кероване мовлення Chrome зараз дозволене. `speechReady: false` означає, що OpenClaw не
  надіслав вступну/тестову фразу в аудіоміст.
- `providerConnected` / `realtimeReady`: стан голосового мосту реального часу
- `lastInputAt` / `lastOutputAt`: останнє аудіо, отримане з мосту або надіслане до нього
- `audioOutputRouted` / `audioOutputDeviceLabel`: чи медіавивід вкладки Meet
  було активно спрямовано на пристрій BlackHole, який використовує міст
- `lastSuppressedInputAt` / `suppressedInputBytes`: вхід local loopback, проігнорований під час
  активного відтворення помічником

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Режими Agent і Bidi

Режим Chrome `agent` оптимізований для поведінки "мій агент на зустрічі". Провайдер
транскрипції в реальному часі чує аудіо зустрічі, фінальні транскрипти учасників
спрямовуються через налаштованого агента OpenClaw, а відповідь
озвучується через звичайне середовище виконання OpenClaw TTS. Установіть `mode: "bidi"`, коли хочете,
щоб голосова модель реального часу відповідала напряму.
Сусідні фінальні фрагменти транскрипту об’єднуються перед консультацією, щоб один усний
хід не створював кілька застарілих часткових відповідей. Вхід реального часу також
пригнічується, поки аудіо помічника в черзі ще відтворюється,
а нещодавні схожі на помічника відлуння транскрипту ігноруються перед консультацією агента,
щоб local loopback BlackHole не змушував агента відповідати на власне мовлення.

| Режим    | Хто визначає відповідь        | Шлях мовленнєвого виводу                     | Коли використовувати                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | Налаштований агент OpenClaw | Звичайне середовище виконання OpenClaw TTS            | Потрібна поведінка "мій агент на зустрічі"        |
| `bidi`  | Голосова модель реального часу      | Аудіовідповідь голосового провайдера реального часу | Потрібен розмовний голосовий цикл із найменшою затримкою |

У режимі `bidi`, коли моделі реального часу потрібні глибші міркування, актуальна інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw у фоновому режимі з контекстом нещодавнього транскрипту зустрічі та повертає стислу усну відповідь. У режимі `agent` OpenClaw надсилає цю відповідь безпосередньо до середовища виконання TTS; у режимі `bidi` голосова модель реального часу може озвучити результат консультації назад у зустрічі. Він використовує той самий спільний механізм консультацій, що й Голосовий виклик.

За замовчуванням консультації виконуються для агента `main`. Установіть `realtime.agentId`, коли лінія Meet має консультуватися з виділеним робочим простором агента OpenClaw, типовими параметрами моделі, політикою інструментів, пам’яттю та історією сесій.

Консультації в режимі агента використовують ключ сесії `agent:<id>:subagent:google-meet:<session>` для кожної зустрічі, щоб подальші запитання зберігали контекст зустрічі, успадковуючи звичайну політику агента від налаштованого агента.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: відкрити інструмент консультації та обмежити звичайного агента до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`.
- `owner`: відкрити інструмент консультації та дозволити звичайному агенту використовувати звичайну політику інструментів агента.
- `none`: не відкривати інструмент консультації для голосової моделі реального часу.

Ключ сесії консультації обмежений окремою сесією Meet, тому подальші виклики консультації можуть повторно використовувати попередній контекст консультації під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднався до виклику:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повної перевірки приєднання й озвучення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Контрольний список live-тесту

Використовуйте цю послідовність, перш ніж передати зустріч автономному агенту:

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
- Вкладка Meet приєднується до виклику, а `test-speech` повертає стан Chrome із `inCall: true`.

Для віддаленого хоста Chrome, наприклад VM Parallels macOS, це найкоротша безпечна перевірка після оновлення Gateway або VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Це підтверджує, що Plugin Gateway завантажено, вузол VM підключений із поточним токеном, а аудіоміст Meet доступний до того, як агент відкриє реальну вкладку зустрічі.

Для перевірки Twilio використовуйте зустріч, яка надає дані для телефонного підключення:

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
- `openclaw logs --follow` показує, що DTMF TwiML обслуговується перед realtime TwiML, а потім
  realtime-міст із початковим привітанням, поставленим у чергу.
- `googlemeet leave <sessionId>` завершує делегований голосовий виклик.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Переконайтеся, що плагін увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно відредагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway.
Запущений агент бачить лише інструменти плагінів, зареєстровані поточним процесом
Gateway.

На хостах Gateway не з macOS агентський інструмент `google_meet` лишається видимим,
але локальні дії talk-back у Chrome блокуються до потрапляння в аудіоміст.
Локальний Chrome talk-back audio зараз залежить від macOS `BlackHole 2ch`, тому
Linux-агентам слід використовувати `mode: "transcribe"`, набір через Twilio або хост macOS
`chrome-node` замість стандартного локального шляху агента Chrome.

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

Виконайте `googlemeet test-listen` для підключень лише для спостереження або `googlemeet test-speech`
для realtime-підключень, а потім перевірте повернений стан Chrome. Якщо будь-яка з перевірок
повідомляє `manualActionRequired: true`, покажіть `manualActionMessage` оператору
і припиніть повторні спроби, доки дія в браузері не буде завершена.

Поширені ручні дії:

- Увійдіть у профіль Chrome.
- Допустіть гостя з облікового запису хоста Meet.
- Надайте Chrome дозволи на мікрофон/камеру, коли з’явиться нативний запит дозволу Chrome.
- Закрийте або виправте завислий діалог дозволів Meet.

Не повідомляйте "not signed in" лише тому, що Meet показує "Do you want people to
hear you in the meeting?" Це проміжний екран вибору аудіо Meet; OpenClaw
натискає **Use microphone** через автоматизацію браузера, коли це доступно, і продовжує
очікувати реальний стан зустрічі. Для browser fallback лише для створення OpenClaw
може натиснути **Continue without microphone**, бо створення URL не потребує
realtime-аудіошляху.

### Не вдається створити зустріч

`googlemeet create` спершу використовує endpoint Google Meet API `spaces.create`,
коли налаштовано OAuth-облікові дані. Без OAuth-облікових даних він повертається
до закріпленого браузера Chrome node. Перевірте:

- Для створення через API: `oauth.clientId` і `oauth.refreshToken` налаштовані,
  або наявні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було випущено після додавання підтримки створення.
  У старіших токенах може бракувати scope `meetings.space.created`; повторно виконайте
  `openclaw googlemeet auth login --json` і оновіть конфігурацію плагіна.
- Для browser fallback: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений вузол із `browser.proxy` і
  `googlemeet.chrome`.
- Для browser fallback: профіль OpenClaw Chrome на цьому вузлі виконано вхід
  у Google і він може відкрити `https://meet.google.com/new`.
- Для browser fallback: повторні спроби повторно використовують наявну вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google перед відкриттям нової вкладки. Якщо час очікування агента спливає,
  повторіть виклик інструмента замість ручного відкриття ще однієї вкладки Meet.
- Для browser fallback: якщо інструмент повертає `manualActionRequired: true`, використовуйте
  повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і
  `manualActionMessage`, щоб скерувати оператора. Не повторюйте спроби в циклі, доки цю
  дію не завершено.
- Для browser fallback: якщо Meet показує "Do you want people to hear you in the
  meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для
  fallback лише для створення, **Continue without microphone** через автоматизацію браузера
  і продовжити очікування згенерованого URL Meet. Якщо він не може, помилка має згадувати
  `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте realtime-шлях:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "agent"` для звичайного шляху STT -> агент OpenClaw -> TTS talk-back,
або `mode: "bidi"` для прямого запасного варіанту realtime-голосу. `mode: "transcribe"`
навмисно не запускає міст talk-back. Для налагодження лише спостереження
виконайте `openclaw googlemeet status --json <session-id>` після того, як учасники заговорять,
і перевірте `captioning`, `transcriptLines` і `lastCaptionText`. Якщо `inCall` дорівнює
true, але `transcriptLines` залишається `0`, субтитри Meet можуть бути вимкнені, ніхто
не говорив після встановлення спостерігача, UI Meet змінився або live
captions недоступні для мови/облікового запису зустрічі.

`googlemeet test-speech` завжди перевіряє realtime-шлях і повідомляє, чи
байти виводу мосту були зафіксовані для цього виклику. Якщо `speechOutputVerified` є false і
`speechOutputTimedOut` є true, realtime-провайдер міг прийняти
висловлювання, але OpenClaw не побачив, що нові байти виводу дійшли до аудіомоста Chrome.

Також перевірте:

- На хості Gateway доступний ключ realtime-провайдера, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `sox` існує на хості Chrome.
- Мікрофон і динамік Meet маршрутизовані через віртуальний аудіошлях, який використовує
  OpenClaw. `doctor` має показувати `meet output routed: yes` для локальних Chrome
  realtime-підключень.

`googlemeet doctor [session-id]` виводить сеанс, вузол, стан перебування у виклику,
причину ручної дії, з’єднання realtime-провайдера, `realtimeReady`, активність
аудіовходу/виходу, останні аудіомітки часу, лічильники байтів і URL браузера.
Використовуйте `googlemeet status [session-id] --json`, коли потрібен сирий JSON. Використовуйте
`googlemeet doctor --oauth`, коли потрібно перевірити Google Meet OAuth refresh
без розкриття токенів; додайте `--meeting` або `--create-space`, коли також потрібне
підтвердження Google Meet API.

Якщо час очікування агента сплив і ви бачите вже відкриту вкладку Meet, перевірте цю вкладку
без відкриття іншої:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує та перевіряє
наявну вкладку Meet для вибраного транспорту. З `chrome` вона використовує локальне
керування браузером через Gateway; з `chrome-node` вона використовує налаштований
Chrome node. Вона не відкриває нову вкладку й не створює новий сеанс; вона повідомляє
поточний блокер, наприклад стан входу, допуску, дозволів або вибору аудіо.
Команда CLI звертається до налаштованого Gateway, тому Gateway має працювати;
`chrome-node` також вимагає, щоб Chrome node був підключений.

### Не проходять перевірки налаштування Twilio

`twilio-voice-call-plugin` не проходить, коли `voice-call` не дозволений або не ввімкнений.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` не проходить, коли у backend Twilio бракує account
SID, auth token або caller number. Встановіть їх на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` не проходить, коли `voice-call` не має публічної Webhook
експозиції або коли `publicUrl` вказує на loopback чи приватний мережевий простір.
Встановіть `plugins.entries.voice-call.config.publicUrl` на URL публічного провайдера або
налаштуйте tunnel/Tailscale-експозицію `voice-call`.

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

Для локальної розробки використовуйте tunnel або експозицію Tailscale замість URL приватного
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

`voicecall smoke` за замовчуванням перевіряє лише готовність. Щоб виконати dry-run для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли навмисно хочете здійснити live вихідний notify
call:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Виклик Twilio починається, але ніколи не потрапляє в зустріч

Переконайтеся, що подія Meet містить дані телефонного підключення. Передайте точний dial-in
номер і PIN або власну DTMF-послідовність:

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

- Виконайте `openclaw googlemeet doctor <session-id>`, щоб підтвердити делегований Twilio
  call ID, чи було поставлено DTMF у чергу і чи було запитано вступне привітання.
- Виконайте `openclaw voicecall status --call-id <id>` і переконайтеся, що виклик досі
  активний.
- Виконайте `openclaw voicecall tail` і перевірте, що Webhook-и Twilio надходять до
  Gateway.
- Виконайте `openclaw logs --follow` і шукайте послідовність Twilio Meet: Google
  Meet делегує приєднання, Voice Call запускає телефонну лінію, Google Meet очікує
  `voiceCall.dtmfDelayMs`, надсилає DTMF через `voicecall.dtmf`, очікує
  `voiceCall.postDtmfSpeechDelayMs`, а потім запитує вступну промову через
  `voicecall.speak`.
- Повторно виконайте `openclaw googlemeet setup --transport twilio`; зелена перевірка налаштування є
  обов’язковою, але не доводить, що послідовність PIN зустрічі правильна.
- Переконайтеся, що dial-in номер належить до того самого запрошення Meet і регіону, що й
  PIN.
- Збільште `voiceCall.dtmfDelayMs`, якщо Meet відповідає повільно або транскрипт виклику
  досі показує запит на PIN після надсилання DTMF.
- Якщо учасник приєднується, але ви не чуєте привітання, перевірте
  `openclaw logs --follow` на наявність post-DTMF запиту `voicecall.speak` і
  або відтворення TTS через media-stream, або запасний варіант Twilio `<Say>`. Якщо транскрипт виклику
  досі містить "enter the meeting PIN", телефонна лінія ще не приєдналася
  до кімнати Meet, тому учасники зустрічі не почують мовлення.

Якщо Webhook не надходять, спершу налагодьте Plugin Voice Call: провайдер має
досягати `plugins.entries.voice-call.config.publicUrl` або налаштованого тунелю.
Див. [усунення несправностей голосових викликів](/uk/plugins/voice-call#troubleshooting).

## Примітки

Офіційний медіа API Google Meet орієнтований на отримання, тому для мовлення у
виклику Meet усе ще потрібен шлях учасника. Цей Plugin робить цю межу явною:
Chrome обробляє участь у браузері та локальну маршрутизацію аудіо; Twilio
обробляє участь через телефонний дозвін.

Режими зворотного мовлення Chrome потребують `BlackHole 2ch` і одного з таких варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw володіє
  мостом і передає аудіо у `chrome.audioFormat` між цими командами та вибраним
  провайдером. Режим агента використовує транскрипцію в реальному часі плюс
  звичайний TTS; режим bidi використовує голосового провайдера в реальному часі.
  Типовий шлях Chrome — 24 кГц PCM16; 8 кГц G.711 mu-law залишається доступним
  для застарілих пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда мосту володіє всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона. Це
  допустимо лише для `bidi`, оскільки режим `agent` потребує прямого доступу до
  пари команд для TTS.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через
окремі віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback.
Один спільний пристрій BlackHole може повертати відлуння інших учасників назад
у виклик.

З командною парою мосту Chrome `chrome.bargeInInputCommand` може слухати
окремий локальний мікрофон і очищати відтворення асистента, коли людина починає
говорити. Це тримає людське мовлення попереду виводу асистента навіть тоді,
коли спільний вхід BlackHole loopback тимчасово пригнічено під час відтворення
асистента. Як і `chrome.audioInputCommand` та `chrome.audioOutputCommand`, це
локальна команда, налаштована оператором. Використовуйте явний довірений шлях
команди або список аргументів і не спрямовуйте її на скрипти з недовірених
розташувань.

`googlemeet speak` запускає активний аудіоміст зворотного мовлення для сеансу
Chrome. `googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих
через Plugin Voice Call, `leave` також завершує базовий голосовий виклик.
Використовуйте `googlemeet end-active-conference`, коли також потрібно закрити
активну конференцію Google Meet для простору, керованого API.

## Пов’язане

- [Plugin голосових викликів](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення plugins](/uk/plugins/building-plugins)
