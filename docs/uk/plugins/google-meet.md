---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий дзвінок Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт для Google Meet
summary: 'Google Meet Plugin: приєднання за явними URL-адресами Meet через Chrome або Twilio зі стандартними налаштуваннями відповіді агента'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-04T03:12:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7c35884f9fff49561e884050e1d94099621b1a4acd8a035e82ca8cb0f5a06ff
    source_path: plugins/google-meet.md
    workflow: 16
---

Підтримка учасника Google Meet для OpenClaw — Plugin навмисно є явним за дизайном:

- Він приєднується лише до явної URL-адреси `https://meet.google.com/...`.
- Він може створити новий простір Meet через Google Meet API, а потім приєднатися до
  поверненої URL-адреси.
- `agent` — стандартний режим відповіді голосом: транскрипція в реальному часі слухає,
  налаштований агент OpenClaw відповідає, а звичайний OpenClaw TTS говорить у Meet.
- `bidi` залишається доступним як резервний режим прямої голосової моделі реального часу.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `agent` для живого
  прослуховування/відповіді голосом, `bidi` для прямого резервного голосового режиму реального часу або `transcribe`
  для приєднання/керування браузером без мосту відповіді голосом.
- Автентифікація починається як особистий Google OAuth або вже виконаний вхід у профіль Chrome.
- Автоматичного оголошення згоди немає.
- Стандартний аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на спареному вузловому хості.
- Twilio приймає номер для дозвону плюс необов’язковий PIN або DTMF-послідовність; він
  не може набирати URL-адресу Meet напряму.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших агентних
  телеконференційних робочих процесів.

## Швидкий старт

Установіть локальні аудіозалежності й налаштуйте провайдера транскрипції в реальному часі
плюс звичайний OpenClaw TTS. OpenAI є стандартним провайдером транскрипції;
Google Gemini Live також працює як окремий резервний голосовий режим `bidi` з
`realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
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
закріплення вузла, а для приєднань Chrome у реальному часі — міст аудіо
BlackHole/SoX і відкладені перевірки вступу в реальному часі. Для приєднань лише для спостереження перевірте той самий
транспорт із `--mode transcribe`; цей режим пропускає аудіопередумови реального часу,
оскільки він не слухає через міст і не говорить через нього:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Коли налаштовано делегування Twilio, налаштування також повідомляє, чи готові
Plugin `voice-call`, облікові дані Twilio і публічне відкриття Webhook.
Сприймайте будь-яку перевірку `ok: false` як блокер для перевіреного транспорту й режиму,
перш ніж просити агента приєднатися. Використовуйте `openclaw googlemeet setup --json` для
скриптів або машинозчитуваного виводу. Використовуйте `--transport chrome`,
`--transport chrome-node` або `--transport twilio`, щоб попередньо перевірити конкретний
транспорт до того, як агент спробує його використати.

Для Twilio завжди явно попередньо перевіряйте транспорт, коли стандартним транспортом
є Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Це виявляє відсутню проводку `voice-call`, облікові дані Twilio або недосяжне
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

Орієнтований на агента інструмент `google_meet` залишається доступним на хостах не macOS для
артефактів, календаря, налаштування, транскрибування, Twilio і потоків `chrome-node`. Локальні
дії відповіді голосом у Chrome там заблоковані, оскільки вбудований аудіошлях Chrome
наразі залежить від macOS `BlackHole 2ch`. На Linux використовуйте `mode: "transcribe"`,
дозвон Twilio або macOS-хост `chrome-node` для участі Chrome з відповіддю голосом.

Створіть нову зустріч і приєднайтеся до неї:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Для кімнат, створених через API, використовуйте Google Meet `SpaceConfig.accessType`, коли хочете,
щоб політика входу без запиту для кімнати була явною, а не успадкованою зі стандартних налаштувань
облікового запису Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` дозволяє будь-кому з URL-адресою Meet приєднатися без запиту. `TRUSTED` дозволяє
довіреним користувачам організації хоста, запрошеним зовнішнім користувачам і користувачам
дозвону приєднуватися без запиту. `RESTRICTED` обмежує вхід без запиту лише запрошеними.
Ці налаштування застосовуються лише до офіційного шляху створення Google Meet API, тому
облікові дані OAuth мають бути налаштовані.

Якщо ви автентифікували Google Meet до того, як ця опція стала доступною, повторно запустіть
`openclaw googlemeet auth login --json` після додавання scope
`meetings.space.settings` до екрана згоди Google OAuth.

Створіть лише URL-адресу без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це
  найдетермінованіший шлях, який не залежить від стану UI браузера.
- Резервний браузерний шлях: використовується, коли облікові дані OAuth відсутні. OpenClaw використовує
  закріплений вузол Chrome, відкриває `https://meet.google.com/new`, чекає, доки Google
  переспрямує на справжню URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Цей шлях потребує,
  щоб профіль OpenClaw Chrome на вузлі вже мав виконаний вхід у Google.
  Браузерна автоматизація обробляє власний початковий запит Meet на мікрофон; цей запит
  не вважається помилкою входу Google.
  Потоки приєднання та створення також намагаються повторно використати наявну вкладку Meet, перш ніж відкривати
  нову. Зіставлення ігнорує нешкідливі рядки запиту URL, як-от `authuser`, тому
  повторна спроба агента має сфокусувати вже відкриту зустріч замість створення другої
  вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` стандартно приєднується до нової зустрічі й
повертає `joined: true` плюс сесію приєднання. Щоб лише створити URL-адресу, використовуйте
`create --no-join` у CLI або передайте `"join": false` інструменту.

Або скажіть агенту: "Створи Google Meet, приєднайся до нього в режимі відповіді голосом агента
і надішли мені посилання." Агент має викликати `google_meet` з
`action: "create"`, а потім поділитися поверненим `meetingUri`.

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
надання OpenClaw дозволу на мікрофон/камеру й уникають шляху Meet **Use
microphone**. Якщо Meet показує проміжний екран вибору аудіо, автоматизація пробує
шлях без мікрофона, а інакше повідомляє про ручну дію замість відкриття
локального мікрофона. У режимі транскрибування керовані транспорти Chrome також установлюють
best-effort спостерігач субтитрів Meet. `googlemeet status --json` і
`googlemeet doctor` показують `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`
і короткий хвіст `recentTranscript`, щоб оператори могли визначити, чи браузер
приєднався до виклику і чи субтитри Meet створюють текст.
Використовуйте `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, коли
вам потрібна перевірка так/ні: він приєднується в режимі транскрибування, чекає на свіжий рух субтитрів або
транскрипту й повертає `listenVerified`, `listenTimedOut`, поля ручної
дії та останній стан субтитрів.

Під час сесій реального часу статус `google_meet` містить стан браузера й аудіомоста,
зокрема `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, останні часові позначки
вводу/виводу, лічильники байтів і закритий стан мосту. Якщо з’являється безпечний запит сторінки Meet,
браузерна автоматизація обробляє його, коли може. Запити входу, допуску хостом і
дозволів браузера/OS повідомляються як ручна дія з причиною та
повідомленням, яке агент має передати. Керовані сесії Chrome видають вступну або
тестову фразу лише після того, як стан браузера повідомить `inCall: true`; інакше статус повідомляє
`speechReady: false`, а спроба мовлення блокується замість удавання, що
агент говорив у зустріч.

Локальні приєднання Chrome проходять через профіль браузера OpenClaw із виконаним входом. Режим реального часу
потребує `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для
чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф на кшталт Loopback; одного
пристрою BlackHole достатньо для першого smoke test, але він може давати відлуння.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM
лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть
вузловий хост у VM. Один раз увімкніть вбудований Plugin на VM, щоб вузол
оголошував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, провайдер
  реального часу й конфігурація Plugin Google Meet.
- Parallels macOS VM: OpenClaw CLI/вузловий хост, Google Chrome, SoX, BlackHole 2ch
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

Установіть або оновіть OpenClaw у VM, а потім увімкніть там вбудований Plugin:

```bash
openclaw plugins enable google-meet
```

Запустіть вузловий хост у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — LAN IP і ви не використовуєте TLS, вузол відмовляється від
відкритого WebSocket, якщо ви явно не погодитеся на це для цієї довіреної приватної мережі:

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

Тепер приєднайтеся звичайно з хоста Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

або попросіть агента використати інструмент `google_meet` з `transport: "chrome-node"`.

Для однокомандного smoke test, який створює або повторно використовує сесію, вимовляє відому
фразу й друкує стан сесії:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання в реальному часі автоматизація браузера OpenClaw заповнює ім’я гостя, натискає
Join/Ask to join і приймає вибір першого запуску Meet "Use microphone", коли ця
підказка з’являється. Під час приєднання лише для спостереження або створення зустрічі лише в браузері вона
проходить ту саму підказку без мікрофона, коли такий вибір доступний.
Якщо профіль браузера не ввійшов в обліковий запис, Meet очікує допуску від організатора,
Chrome потребує дозволу на мікрофон/камеру для приєднання в реальному часі, або Meet застряг
на підказці, яку автоматизація не змогла вирішити, результат join/test-speech повідомляє
`manualActionRequired: true` з `manualActionReason` і
`manualActionMessage`. Агенти мають припинити повторні спроби приєднання, повідомити саме це
повідомлення плюс поточні `browserUrl`/`browserTitle` і повторювати спробу лише після завершення
ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає лише тоді, коли рівно один
підключений вузол оголошує і `googlemeet.chrome`, і керування браузером. Якщо
підключено кілька придатних вузлів, задайте `chromeNode.node` як ідентифікатор вузла,
відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `Configured Google Meet node ... is not usable: offline`: закріплений вузол
  відомий Gateway, але недоступний. Агенти мають розглядати цей вузол як
  діагностичний стан, а не як придатний Chrome-хост, і повідомляти про блокер налаштування
  замість переходу на інший транспорт, якщо користувач не попросив про це.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  схваліть pairing і переконайтеся, що `openclaw plugins enable google-meet` і
  `openclaw plugins enable browser` були виконані у VM. Також підтвердьте, що
  хост Gateway дозволяє обидві команди вузла через
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: встановіть `blackhole-2ch` на хості,
  який перевіряється, і перезавантажте його перед використанням локального аудіо Chrome.
- `BlackHole 2ch audio device not found on the node`: встановіть `blackhole-2ch`
  у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або
  залиште `chrome.guestName` заданим для гостьового приєднання. Гостьове автоприєднання використовує
  автоматизацію браузера OpenClaw через браузерний проксі вузла; переконайтеся, що конфігурація браузера
  вузла вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або іменований профіль існуючого сеансу.
- Дублікати вкладок Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw
  активує наявну вкладку для того самого URL Meet перед відкриттям нової, а
  створення зустрічі в браузері повторно використовує поточну вкладку `https://meet.google.com/new`
  або вкладку підказки облікового запису Google перед відкриттям ще однієї.
- Немає аудіо: у Meet спрямуйте аудіо мікрофона/динаміка через шлях віртуального аудіопристрою,
  який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію на кшталт Loopback
  для чистого двостороннього аудіо.

## Нотатки щодо встановлення

Типове зворотне мовлення Chrome використовує два зовнішні інструменти:

- `sox`: утиліта аудіо командного рядка. Плагін використовує явні команди пристрою CoreAudio
  для типового аудіомоста 24 kHz PCM16.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`,
  через який Chrome/Meet можуть маршрутизувати аудіо.

OpenClaw не комплектує і не розповсюджує жоден із цих пакетів. Документація просить користувачів
установити їх як залежності хоста через Homebrew. SoX ліцензовано як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole має ліцензію GPL-3.0. Якщо ви створюєте
інсталятор або appliance, який комплектує BlackHole з OpenClaw, перегляньте умови
ліцензування upstream BlackHole або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL Meet через керування браузером OpenClaw і приєднується
як профіль браузера OpenClaw, що ввійшов в обліковий запис. На macOS плагін перевіряє наявність
`BlackHole 2ch` перед запуском. Якщо налаштовано, він також запускає команду перевірки стану
аудіомоста і команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли
Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють
на спареному вузлі, наприклад Parallels macOS VM. Для локального Chrome виберіть
профіль через `browser.defaultProfile`; `chrome.browserProfile` передається
хостам `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона й динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування
замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план набору, делегований плагіну Voice Call. Він
не аналізує сторінки Meet для пошуку телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або потрібен резервний варіант
телефонного дозвону. Google Meet має надати телефонний номер дозвону й PIN для
зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

Увімкніть плагін Voice Call на хості Gateway, а не на вузлі Chrome:

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

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни конфігурації плагіна
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

## OAuth і preflight

OAuth необов’язковий для створення посилання Meet, тому що `googlemeet create` може
відкотитися до автоматизації браузера. Налаштуйте OAuth, коли потрібне створення через офіційний API,
розв’язання space або preflight-перевірки Meet Media API.

Доступ до Google Meet API використовує користувацький OAuth: створіть OAuth-клієнт Google Cloud,
запросіть потрібні scopes, авторизуйте обліковий запис Google, а потім збережіть
отриманий refresh token у конфігурації плагіна Google Meet або надайте змінні середовища
`OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання Chrome. Транспорти Chrome і Chrome-node
і далі приєднуються через профіль Chrome, що ввійшов в обліковий запис, BlackHole/SoX і підключений
вузол, коли ви використовуєте участь через браузер. OAuth призначений лише для офіційного
шляху Google Meet API: створення meeting spaces, розв’язання spaces і запуску preflight-перевірок
Meet Media API.

### Створення облікових даних Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** — найпростіше для організації Google Workspace.
   - **External** працює для персональних/тестових налаштувань; поки застосунок у Testing,
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
`meetings.space.readonly` дає OpenClaw змогу розв’язувати URL/коди Meet у spaces.
`meetings.space.settings` дає OpenClaw змогу передавати налаштування `SpaceConfig`, наприклад
`accessType`, під час створення кімнати через API.
`meetings.conference.media.readonly` призначений для preflight Meet Media API і роботи з медіа;
Google може вимагати участі в Developer Preview для фактичного використання Media API.
Якщо вам потрібні лише приєднання Chrome на основі браузера, повністю пропустіть OAuth.

### Створення refresh token

Налаштуйте `oauth.clientId` і необов’язково `oauth.clientSecret` або передайте їх як
змінні середовища, а потім запустіть:

```bash
openclaw googlemeet auth login --json
```

Команда друкує блок конфігурації `oauth` з refresh token. Вона використовує PKCE,
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

Віддавайте перевагу змінним середовища, коли не хочете зберігати refresh token у конфігурації.
Якщо наявні і значення конфігурації, і значення середовища, плагін спершу бере конфігурацію,
а потім fallback із середовища.

Згода OAuth включає створення Meet space, доступ на читання Meet space і доступ на читання
медіа конференції Meet. Якщо ви автентифікувалися до появи підтримки створення зустрічей,
повторно запустіть `openclaw googlemeet auth login --json`, щоб refresh token мав scope
`meetings.space.created`.

### Перевірка OAuth через doctor

Запустіть OAuth doctor, коли потрібна швидка перевірка стану без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує runtime Chrome і не потребує підключеного вузла Chrome. Воно
перевіряє, що конфігурація OAuth існує і що refresh token може створити access
token. JSON-звіт містить лише поля статусу, такі як `ok`, `configured`,
`tokenSource`, `expiresAt` і повідомлення перевірок; він не друкує access
token, refresh token або client secret.

Поширені результати:

| Перевірка            | Значення                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Наявний `oauth.clientId` плюс `oauth.refreshToken` або кешований access token.          |
| `oauth-token`        | Кешований access token і досі дійсний або refresh token створив новий access token.     |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` розв’язала наявний Meet space.                      |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий Meet space.                     |

Щоб також довести ввімкнення Google Meet API і scope `spaces.create`, запустіть
перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює тимчасовий URL Meet. Використовуйте його, коли потрібно підтвердити,
що в проєкті Google Cloud увімкнено Meet API і що авторизований
обліковий запис має scope `meetings.space.created`.

Щоб підтвердити доступ на читання для наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` підтверджують доступ на читання до наявного
простору, до якого має доступ авторизований обліковий запис Google. `403` від цих перевірок
зазвичай означає, що REST API Google Meet вимкнено, погодженому refresh token
бракує потрібного scope або обліковий запис Google не має доступу до цього простору
Meet. Помилка refresh-token означає, що потрібно повторно виконати `openclaw googlemeet auth login
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

Розв’яжіть URL Meet, код або `spaces/{id}` через `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Запустіть попередню перевірку перед роботою з медіа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Виведіть артефакти зустрічі та відвідуваність після того, як Meet створить записи конференції:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

З `--meeting`, `artifacts` і `attendance` за замовчуванням використовують найновіший запис конференції.
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

`--today` шукає в сьогоднішньому календарі `primary` подію Calendar із посиланням
Google Meet. Використовуйте `--event <query>`, щоб шукати відповідний текст події, і
`--calendar <id>` для неосновного календаря. Пошук у календарі потребує нового
входу OAuth, який включає readonly scope для подій Calendar.
`calendar-events` попередньо показує відповідні події Meet і позначає подію, яку
виберуть `latest`, `artifacts`, `attendance` або `export`.

Якщо ви вже знаєте id запису конференції, зверніться до нього напряму:

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
OpenClaw приймає URL Meet, код зустрічі або вхідні дані `spaces/{id}` і розв’язує їх
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

`artifacts` повертає метадані запису конференції плюс метадані ресурсів учасників, записів,
транскриптів, структурованих записів транскрипту та розумних нотаток, коли
Google надає їх для зустрічі. Використовуйте `--no-transcript-entries`, щоб пропустити
пошук записів для великих зустрічей. `attendance` розгортає учасників у
рядки сесій учасників із часом першої/останньої появи, загальною тривалістю сесії,
позначками запізнення/раннього виходу та дубльованими ресурсами учасників, об’єднаними за користувачем,
який увійшов у систему, або відображуваним іменем. Передайте `--no-merge-duplicates`, щоб залишити необроблені ресурси
учасників окремо, `--late-after-minutes`, щоб налаштувати виявлення запізнення, і
`--early-before-minutes`, щоб налаштувати виявлення раннього виходу.

`export` записує папку, що містить `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`.
`manifest.json` фіксує вибрані вхідні дані, параметри експорту, записи конференції,
вихідні файли, лічильники, джерело токена, подію Calendar, якщо її було використано, і будь-які
попередження про часткове отримання. Передайте `--zip`, щоб також записати переносний архів поруч
із папкою. Передайте `--include-doc-bodies`, щоб експортувати пов’язаний текст транскриптів і
розумних нотаток Google Docs через Google Drive `files.export`; для цього потрібен
новий вхід OAuth, який включає Drive Meet readonly scope. Без
`--include-doc-bodies` експорт містить лише метадані Meet і структуровані записи транскрипту.
Якщо Google повертає часткову помилку артефакту, наприклад помилку списку розумних нотаток,
запису транскрипту або тіла документа Drive, зведення й
маніфест зберігають попередження замість того, щоб провалити весь експорт.
Використовуйте `--dry-run`, щоб отримати ті самі дані артефактів/відвідуваності та надрукувати
JSON маніфесту без створення папки або ZIP. Це корисно перед записом
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

Установіть `"dryRun": true`, щоб повернути лише маніфест експорту й пропустити запис файлів.

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

Запустіть live browser probe з пріоритетом прослуховування проти зустрічі, де хтось буде
говорити з доступними субтитрами Meet:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Live smoke environment:

- `OPENCLAW_LIVE_TEST=1` вмикає захищені live tests.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` вказує на збережений URL Meet, код або
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

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда друкує новий `meeting uri`, джерело та сесію приєднання. З обліковими даними OAuth
вона використовує офіційний Google Meet API. Без облікових даних OAuth вона
використовує профіль браузера Chrome закріпленого вузла, у який виконано вхід, як резервний варіант. Агенти можуть
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

Якщо резервний браузерний режим наштовхується на вхід Google або блокування дозволів Meet, перш ніж
зможе створити URL, метод Gateway повертає невдалу відповідь, а інструмент
`google_meet` повертає структуровані деталі замість простого рядка:

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

Створення Meet за замовчуванням приєднує до зустрічі. Транспорт Chrome або Chrome-node все ще
потребує профілю Google Chrome, у який виконано вхід, щоб приєднатися через браузер. Якщо
з профілю виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або
помилку резервного браузерного режиму й просить оператора завершити вхід Google перед
повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
project, OAuth principal і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Звичайний шлях агента Chrome потребує лише увімкненого plugin, BlackHole, SoX, ключа
провайдера транскрипції в реальному часі та налаштованого провайдера TTS OpenClaw.
OpenAI є стандартним провайдером транскрипції; установіть `realtime.voiceProvider` на
`"google"` і `realtime.model`, щоб використовувати Google Gemini Live для режиму `bidi`
без зміни стандартного провайдера транскрипції режиму агента:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Задайте конфігурацію plugin у `plugins.entries.google-meet.config`:

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
- `defaultMode: "agent"` (`"realtime"` приймається лише як застарілий
  сумісний псевдонім для `"agent"`; нові виклики інструментів мають указувати `"agent"`)
- `chromeNode.node`: необов’язковий ідентифікатор/назва/IP вузла для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, яке використовується на гостьовому
  екрані Meet без входу в обліковий запис
- `chrome.autoJoin: true`: заповнення імені гостя та натискання Join Now у режимі
  найкращого зусилля через браузерну автоматизацію OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet повідомить, що
  вона у виклику, перед запуском вступного голосового зворотного зв’язку
- `chrome.audioFormat: "pcm16-24khz"`: аудіоформат пари команд. Використовуйте
  `"g711-ulaw-8khz"` лише для застарілих/користувацьких пар команд, які все ще
  видають телефонне аудіо.
- `chrome.audioBufferBytes: 4096`: буфер обробки SoX для згенерованих аудіокоманд
  пари команд Chrome. Це половина стандартного буфера SoX у 8192 байти, що
  зменшує стандартну затримку каналу, залишаючи можливість збільшити її на
  завантажених хостах. Значення нижче мінімуму SoX обмежуються 17 байтами.
- `chrome.audioInputCommand`: команда SoX, що читає з CoreAudio `BlackHole 2ch`
  і записує аудіо у `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX, що читає аудіо у `chrome.audioFormat`
  і записує в CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: необов’язкова команда локального мікрофона, яка
  записує знаковий 16-бітний little-endian моно PCM для виявлення людського
  втручання, доки активне відтворення асистента. Наразі це застосовується до
  розміщеного в Gateway моста пари команд `chrome`.
- `chrome.bargeInRmsThreshold: 650`: рівень RMS, який рахується як людське
  переривання на `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: піковий рівень, який рахується як людське
  переривання на `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: мінімальна затримка між повторними очищеннями
  людських переривань
- `mode: "agent"`: стандартний режим голосового зворотного зв’язку. Мовлення
  учасників транскрибується налаштованим провайдером транскрипції в реальному
  часі, надсилається налаштованому агенту OpenClaw у сеансі підагента для
  конкретної зустрічі та озвучується через звичайне середовище виконання TTS OpenClaw.
- `mode: "bidi"`: резервний прямий двонапрямний режим моделі реального часу.
  Провайдер голосу реального часу відповідає на мовлення учасників напряму та
  може викликати `openclaw_agent_consult` для глибших відповідей або відповідей
  з підтримкою інструментів.
- `mode: "transcribe"`: режим лише спостереження без моста голосового зворотного зв’язку.
- `realtime.provider: "openai"`: сумісний резервний варіант, який використовується,
  коли наведені нижче поля провайдера в межах області не задані.
- `realtime.transcriptionProvider: "openai"`: ідентифікатор провайдера, який режим
  `agent` використовує для транскрипції в реальному часі.
- `realtime.voiceProvider`: ідентифікатор провайдера, який режим `bidi` використовує
  для прямого голосу в реальному часі. Установіть його на `"google"`, щоб
  використовувати Gemini Live, залишаючи транскрипцію режиму агента на OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності під час підключення
  моста реального часу; задайте `""`, щоб приєднуватися без звуку
- `realtime.agentId`: необов’язковий ідентифікатор агента OpenClaw для
  `openclaw_agent_consult`; стандартно `main`

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

`voiceCall.enabled` стандартно дорівнює `true`; з транспортом Twilio він делегує
фактичний PSTN-виклик, DTMF і вступне привітання plugin Voice Call. Voice Call
відтворює послідовність DTMF перед відкриттям медіапотоку реального часу, а потім
використовує збережений вступний текст як початкове привітання в реальному часі.
Якщо `voice-call` не увімкнено, Google Meet усе ще може перевірити та записати
план набору, але не може здійснити виклик Twilio.

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

Використовуйте `transport: "chrome"`, коли Chrome працює на хості Gateway.
Використовуйте `transport: "chrome-node"`, коли Chrome працює на спареному вузлі,
наприклад VM Parallels. В обох випадках провайдери моделей і `openclaw_agent_consult`
працюють на хості Gateway, тож облікові дані моделей залишаються там. Зі
стандартним `mode: "agent"` провайдер транскрипції в реальному часі обробляє
прослуховування, налаштований агент OpenClaw створює відповідь, а звичайний
TTS OpenClaw озвучує її в Meet. Використовуйте `mode: "bidi"`, коли хочете, щоб
голосова модель реального часу відповідала напряму. Сирий `mode: "realtime"`
досі приймається як застарілий сумісний псевдонім для `mode: "agent"`, але
більше не рекламується у схемі інструмента агента.

Використовуйте `action: "status"`, щоб перелічити активні сеанси або перевірити
ідентифікатор сеансу. Використовуйте `action: "speak"` із `sessionId` і `message`,
щоб агент реального часу негайно заговорив. Використовуйте `action: "test_speech"`,
щоб створити або повторно використати сеанс, запустити відому фразу та повернути
стан `inCall`, коли хост Chrome може його повідомити. `test_speech` завжди
примусово встановлює `mode: "agent"` і завершується помилкою, якщо його просять
працювати в `mode: "transcribe"`, оскільки сеанси лише спостереження навмисно не
можуть видавати мовлення. Його результат `speechOutputVerified` базується на
збільшенні байтів аудіовиходу в реальному часі під час цього тестового виклику,
тому повторно використаний сеанс зі старішим аудіо не рахується як свіжа успішна
перевірка мовлення. Використовуйте `action: "leave"`, щоб позначити сеанс як завершений.

`status` включає стан Chrome, коли він доступний:

- `inCall`: Chrome, схоже, перебуває у виклику Meet
- `micMuted`: стан мікрофона Meet у режимі найкращого зусилля
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профілю
  браузера потрібні ручний вхід, допуск хостом Meet, дозволи або виправлення
  керування браузером, перш ніж мовлення зможе працювати
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: чи дозволене
  кероване мовлення Chrome зараз. `speechReady: false` означає, що OpenClaw не
  надіслав вступну/тестову фразу в аудіоміст.
- `providerConnected` / `realtimeReady`: стан голосового моста реального часу
- `lastInputAt` / `lastOutputAt`: останнє аудіо, побачене мостом або надіслане до нього
- `audioOutputRouted` / `audioOutputDeviceLabel`: чи медіавихід вкладки Meet було
  активно спрямовано на пристрій BlackHole, який використовує міст
- `lastSuppressedInputAt` / `suppressedInputBytes`: вхід local loopback,
  проігнорований, доки активне відтворення асистента

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Режими Agent і Bidi

Режим Chrome `agent` оптимізований для поведінки "мій агент перебуває на зустрічі".
Провайдер транскрипції в реальному часі чує аудіо зустрічі, фінальні транскрипти
учасників маршрутизуються через налаштованого агента OpenClaw, а відповідь
озвучується через звичайне середовище виконання TTS OpenClaw. Установіть
`mode: "bidi"`, коли хочете, щоб голосова модель реального часу відповідала напряму.
Сусідні фінальні фрагменти транскрипту об’єднуються перед консультацією, щоб один
усний хід не створював кілька застарілих часткових відповідей. Вхід реального
часу також пригнічується, доки аудіо асистента в черзі ще відтворюється, а
недавні схожі на асистента відлуння транскрипту ігноруються перед консультацією
агента, щоб local loopback BlackHole не змушував агента відповідати на власне мовлення.

| Режим   | Хто визначає відповідь          | Шлях виведення мовлення                 | Коли використовувати                                   |
| ------- | ------------------------------- | --------------------------------------- | ----------------------------------------------------- |
| `agent` | Налаштований агент OpenClaw     | Звичайне середовище виконання TTS OpenClaw | Ви хочете поведінку "мій агент перебуває на зустрічі" |
| `bidi`  | Голосова модель реального часу  | Аудіовідповідь провайдера голосу реального часу | Ви хочете голосовий цикл розмови з найнижчою затримкою |

У режимі `bidi`, коли моделі реального часу потрібні глибше міркування, актуальна
інформація або звичайні інструменти OpenClaw, вона може викликати
`openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw за лаштунками з
контекстом останніх транскриптів зустрічі та повертає стислу усну відповідь. У
режимі `agent` OpenClaw надсилає цю відповідь напряму в середовище виконання TTS;
у режимі `bidi` голосова модель реального часу може озвучити результат
консультації назад у зустріч. Він використовує той самий спільний механізм
консультацій, що й Voice Call.

Стандартно консультації виконуються для агента `main`. Установіть
`realtime.agentId`, коли канал Meet має консультувати спеціальний робочий простір
агента OpenClaw, стандартні параметри моделі, політику інструментів, пам’ять та
історію сеансу.

Консультації режиму агента використовують ключ сеансу
`agent:<id>:subagent:google-meet:<session>` для конкретної зустрічі, щоб додаткові
запитання зберігали контекст зустрічі, успадковуючи звичайну політику агента від
налаштованого агента.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: показати інструмент консультації та обмежити звичайного агента
  до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: показати інструмент консультації та дозволити звичайному агенту
  використовувати звичайну політику інструментів агента.
- `none`: не показувати інструмент консультації голосовій моделі реального часу.

Ключ сеансу консультації обмежений кожним сеансом Meet, тому подальші виклики
консультації можуть повторно використовувати попередній контекст консультації
під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю
приєднався до виклику:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повної димової перевірки приєднання й мовлення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Контрольний список live-тесту

Використовуйте цю послідовність перед переданням зустрічі автономному агенту:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Очікуваний стан Chrome-node:

- `googlemeet setup` увесь зелений.
- `googlemeet setup` містить `chrome-node-connected`, коли Chrome-node є
  стандартним транспортом або node закріплено.
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

Це підтверджує, що Plugin Gateway завантажено, node VM підключено з поточним
токеном, а аудіоміст Meet доступний до того, як агент відкриє вкладку реальної
зустрічі.

Для smoke-перевірки Twilio використовуйте зустріч, яка надає дані телефонного
підключення:

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
- `googlemeet leave <sessionId>` завершує делегований голосовий дзвінок.

## Усунення неполадок

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно редагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway.
Запущений агент бачить лише інструменти Plugin, зареєстровані поточним процесом
Gateway.

На хостах Gateway не з macOS інструмент `google_meet`, видимий агенту, залишається видимим,
але локальні дії відповіді голосом Chrome блокуються до потрапляння в аудіоміст.
Локальний Chrome-аудіо talk-back наразі залежить від macOS `BlackHole 2ch`, тому
агенти Linux мають використовувати `mode: "transcribe"`, телефонне підключення Twilio або хост macOS
`chrome-node` замість стандартного локального шляху агента Chrome.

### Немає підключеного node із підтримкою Google Meet

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

Node має бути підключений і перелічувати `googlemeet.chrome` разом із `browser.proxy`.
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

Виконайте `googlemeet test-listen` для підключень лише для спостереження або `googlemeet test-speech`
для realtime-підключень, а потім перегляньте повернений стан Chrome. Якщо будь-яка проба
повідомляє `manualActionRequired: true`, покажіть `manualActionMessage` оператору
і припиніть повтори, доки дія в браузері не буде завершена.

Поширені ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису хоста Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’явиться нативний запит дозволу Chrome.
- Закрити або виправити завислий діалог дозволів Meet.

Не повідомляйте "not signed in" лише через те, що Meet показує "Do you want people to
hear you in the meeting?" Це проміжний екран вибору аудіо Meet; OpenClaw
натискає **Use microphone** через автоматизацію браузера, коли це доступно, і продовжує
чекати реального стану зустрічі. Для browser fallback лише для створення OpenClaw
може натиснути **Continue without microphone**, бо створення URL не потребує
realtime-аудіошляху.

### Створення зустрічі не вдається

`googlemeet create` спочатку використовує endpoint Google Meet API `spaces.create`,
коли налаштовано облікові дані OAuth. Без облікових даних OAuth він переходить
до pinned Chrome node browser. Підтвердьте:

- Для створення через API: `oauth.clientId` і `oauth.refreshToken` налаштовано,
  або присутні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було створено після додавання підтримки створення.
  У старіших токенах може бракувати scope `meetings.space.created`; повторно виконайте
  `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для browser fallback: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений node з `browser.proxy` і
  `googlemeet.chrome`.
- Для browser fallback: профіль OpenClaw Chrome на цьому node увійшов
  у Google і може відкрити `https://meet.google.com/new`.
- Для browser fallback: повтори використовують наявну вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google перед відкриттям нової вкладки. Якщо агент вичерпує час очікування,
  повторіть виклик інструмента замість ручного відкриття іншої вкладки Meet.
- Для browser fallback: якщо інструмент повертає `manualActionRequired: true`, використовуйте
  повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і
  `manualActionMessage`, щоб скерувати оператора. Не повторюйте в циклі, доки ця
  дія не буде завершена.
- Для browser fallback: якщо Meet показує "Do you want people to hear you in the
  meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для
  create-only fallback, **Continue without microphone** через автоматизацію браузера
  і продовжити чекати згенерований URL Meet. Якщо він не може, помилка має згадувати
  `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте realtime-шлях:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "agent"` для нормального шляху STT -> агент OpenClaw -> TTS talk-back,
або `mode: "bidi"` для прямого резервного realtime-голосу. `mode: "transcribe"`
навмисно не запускає міст talk-back. Для налагодження лише зі спостереженням
виконайте `openclaw googlemeet status --json <session-id>` після того, як учасники заговорять,
і перевірте `captioning`, `transcriptLines` і `lastCaptionText`. Якщо `inCall` дорівнює
true, але `transcriptLines` залишається `0`, субтитри Meet можуть бути вимкнені, ніхто
не говорив після встановлення спостерігача, UI Meet змінився або живі
субтитри недоступні для мови/облікового запису зустрічі.

`googlemeet test-speech` завжди перевіряє realtime-шлях і повідомляє, чи
було зафіксовано вихідні байти мосту для цього виклику. Якщо `speechOutputVerified` дорівнює false, а
`speechOutputTimedOut` дорівнює true, realtime-провайдер міг прийняти
фразу, але OpenClaw не побачив, щоб нові вихідні байти дійшли до аудіомоста
Chrome.

Також перевірте:

- На хості Gateway доступний ключ realtime-провайдера, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видно на хості Chrome.
- `sox` існує на хості Chrome.
- Мікрофон і динамік Meet спрямовано через віртуальний аудіошлях, який використовує
  OpenClaw. `doctor` має показати `meet output routed: yes` для локальних Chrome
  realtime-підключень.

`googlemeet doctor [session-id]` виводить сеанс, node, стан перебування в дзвінку,
причину ручної дії, з’єднання realtime-провайдера, `realtimeReady`, активність
аудіовходу/аудіовиходу, останні аудіо timestamps, лічильники байтів і URL браузера.
Використовуйте `googlemeet status [session-id] --json`, коли потрібен сирий JSON. Використовуйте
`googlemeet doctor --oauth`, коли потрібно перевірити refresh Google Meet OAuth
без розкриття токенів; додайте `--meeting` або `--create-space`, коли також потрібне
підтвердження Google Meet API.

Якщо час очікування агента вичерпався і ви бачите вже відкриту вкладку Meet, перегляньте цю вкладку
без відкриття ще однієї:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує та перевіряє
наявну вкладку Meet для вибраного транспорту. З `chrome` вона використовує локальне
керування браузером через Gateway; з `chrome-node` вона використовує налаштований
Chrome node. Вона не відкриває нову вкладку і не створює новий сеанс; вона повідомляє
поточний блокер, наприклад стан входу, допуску, дозволів або вибору аудіо.
Команда CLI звертається до налаштованого Gateway, тому Gateway має бути запущений;
`chrome-node` також потребує підключеного Chrome node.

### Перевірки налаштування Twilio не проходять

`twilio-voice-call-plugin` не проходить, коли `voice-call` не дозволено або не ввімкнено.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` не проходить, коли бекенду Twilio бракує account
SID, auth token або caller number. Задайте їх на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` не проходить, коли `voice-call` не має публічної Webhook
експозиції або коли `publicUrl` вказує на loopback чи простір приватної мережі.
Задайте `plugins.entries.voice-call.config.publicUrl` як публічний URL провайдера або
налаштуйте тунель/Tailscale експозицію `voice-call`.

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

Для локальної розробки використовуйте тунель або Tailscale експозицію замість URL приватного
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

`voicecall smoke` за замовчуванням перевіряє лише готовність. Щоб dry-run конкретний номер:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли навмисно хочете здійснити живий outbound notify
дзвінок:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Дзвінок Twilio починається, але ніколи не входить у зустріч

Підтвердьте, що подія Meet надає дані телефонного підключення. Передайте точний номер
підключення і PIN або спеціальну DTMF-послідовність:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкові `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза
перед введенням PIN.

Якщо телефонний дзвінок створено, але roster Meet ніколи не показує учасника
dial-in:

- Запустіть `openclaw googlemeet doctor <session-id>`, щоб підтвердити делегований
  ідентифікатор виклику Twilio, чи було DTMF поставлено в чергу та чи було
  запитано вступне привітання.
- Запустіть `openclaw voicecall status --call-id <id>` і підтвердьте, що виклик
  усе ще активний.
- Запустіть `openclaw voicecall tail` і перевірте, що Webhook-и Twilio надходять
  до Gateway.
- Запустіть `openclaw logs --follow` і знайдіть послідовність Twilio Meet: Google
  Meet делегує приєднання, Voice Call запускає телефонну гілку, Google Meet
  очікує `voiceCall.dtmfDelayMs`, надсилає DTMF за допомогою `voicecall.dtmf`,
  очікує `voiceCall.postDtmfSpeechDelayMs`, а потім запитує вступне мовлення за
  допомогою `voicecall.speak`.
- Повторно запустіть `openclaw googlemeet setup --transport twilio`; потрібна
  зелена перевірка налаштування, але вона не доводить, що послідовність PIN
  зустрічі правильна.
- Підтвердьте, що номер для дозвону належить до того самого запрошення Meet і
  регіону, що й PIN.
- Збільште `voiceCall.dtmfDelayMs`, якщо Meet відповідає повільно або транскрипт
  виклику все ще показує підказку з проханням ввести PIN після надсилання DTMF.
- Якщо учасник приєднується, але ви не чуєте привітання, перевірте
  `openclaw logs --follow` на наявність post-DTMF запиту `voicecall.speak` і
  або відтворення TTS через медіапотік, або резервний варіант Twilio `<Say>`.
  Якщо транскрипт виклику все ще містить "enter the meeting PIN", телефонна гілка
  ще не приєдналася до кімнати Meet, тож учасники зустрічі не почують мовлення.

Якщо Webhook-и не надходять, спершу налагодьте Plugin Voice Call: провайдер має
досягати `plugins.entries.voice-call.config.publicUrl` або налаштованого тунелю.
Див. [Усунення несправностей голосового виклику](/uk/plugins/voice-call#troubleshooting).

## Нотатки

Офіційний медіа-API Google Meet орієнтований на отримання, тому для мовлення у
виклик Meet все ще потрібен шлях учасника. Цей Plugin робить цю межу видимою:
Chrome обробляє участь у браузері та локальну маршрутизацію аудіо; Twilio
обробляє участь через телефонний дозвін.

Режими зворотного мовлення Chrome потребують `BlackHole 2ch` плюс одне з такого:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw володіє
  мостом і передає аудіо у `chrome.audioFormat` між цими командами та вибраним
  провайдером. Режим агента використовує транскрипцію в реальному часі плюс
  звичайний TTS; режим bidi використовує провайдера голосу в реальному часі.
  Типовий шлях Chrome — 24 кГц PCM16 з `chrome.audioBufferBytes: 4096`; 8 кГц
  G.711 mu-law залишається доступним для застарілих пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда мосту володіє всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона. Це
  дійсно лише для `bidi`, оскільки режим `agent` потребує прямого доступу до
  пари команд для TTS.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через
окремі віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один
спільний пристрій BlackHole може відлунювати інших учасників назад у виклик.

З командно-парним мостом Chrome `chrome.bargeInInputCommand` може прослуховувати
окремий локальний мікрофон і очищати відтворення асистента, коли людина починає
говорити. Це утримує людське мовлення попереду виводу асистента, навіть коли
спільний вхід BlackHole loopback тимчасово приглушено під час відтворення
асистента. Як і `chrome.audioInputCommand` та `chrome.audioOutputCommand`, це
налаштована оператором локальна команда. Використовуйте явний довірений шлях
команди або список аргументів і не спрямовуйте її на скрипти з недовірених
розташувань.

`googlemeet speak` запускає активний аудіоміст зворотного мовлення для сесії
Chrome. `googlemeet leave` зупиняє цей міст. Для сесій Twilio, делегованих через
Plugin Voice Call, `leave` також завершує базовий голосовий виклик. Використовуйте
`googlemeet end-active-conference`, коли також потрібно закрити активну конференцію
Google Meet для простору, керованого API.

## Пов’язане

- [Plugin голосового виклику](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення Plugins](/uk/plugins/building-plugins)
