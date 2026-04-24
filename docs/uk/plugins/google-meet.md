---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до виклику Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio з типовими параметрами голосового зв’язку в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T16:12:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: f96c5a1e08155514155094602e4d32c232cfa7f47f4105fd9b75a57cbd2d6535
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Підтримка учасника Google Meet для OpenClaw.

Plugin є навмисно явним:

- Він приєднується лише за явною URL-адресою `https://meet.google.com/...`.
- Голосовий зв’язок `realtime` є типовим режимом.
- Голосовий зв’язок у реальному часі може повертатися до повного агента OpenClaw, коли потрібні глибші міркування або інструменти.
- Автентифікація починається як персональний Google OAuth або вже виконаний вхід у профіль Chrome.
- Автоматичного оголошення згоди немає.
- Типовим аудіобекендом Chrome є `BlackHole 2ch`.
- Chrome може працювати локально або на спареному вузлі-хості.
- Twilio приймає номер для дозвону плюс необов’язковий PIN або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших робочих процесів агентських телеконференцій.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте бекенд-провайдера голосового зв’язку в реальному часі. OpenAI використовується за замовчуванням; Google Gemini Live також працює з `realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` установлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор Homebrew потребує перезавантаження, перш ніж macOS зробить пристрій доступним:

```bash
sudo reboot
```

Після перезавантаження перевірте обидві складові:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
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

Приєднайтеся до зустрічі:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Або дозвольте агенту приєднатися через інструмент `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

Chrome приєднується як профіль Chrome, у якому вже виконано вхід. У Meet виберіть `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного пристрою BlackHole достатньо для першого швидкого тесту, але він може створювати відлуння.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM лише для того, щоб Chrome працював у VM. Запустіть Gateway і агента локально, а потім запустіть хост вузла у VM. Увімкніть вбудований Plugin у VM один раз, щоб вузол анонсував команду Chrome:

Що де запускається:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, провайдер realtime та конфігурація Plugin Google Meet.
- macOS VM у Parallels: CLI/node host OpenClaw, Google Chrome, SoX, BlackHole 2ch і профіль Chrome з виконаним входом у Google.
- Не потрібно у VM: служба Gateway, конфігурація агента, ключ OpenAI/GPT або налаштування провайдера моделі.

Установіть залежності у VM:

```bash
brew install blackhole-2ch sox
```

Перезавантажте VM після встановлення BlackHole, щоб macOS зробила `BlackHole 2ch` доступним:

```bash
sudo reboot
```

Після перезавантаження перевірте, що VM бачить аудіопристрій і команди SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Установіть або оновіть OpenClaw у VM, а потім увімкніть там вбудований Plugin:

```bash
openclaw plugins enable google-meet
```

Запустіть хост вузла у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це LAN IP і ви не використовуєте TLS, вузол відхиляє plaintext WebSocket, якщо ви явно не дозволите це для цієї довіреної приватної мережі:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Використовуйте ту саму змінну середовища, коли встановлюєте вузол як LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це змінна середовища процесу, а не параметр `openclaw.json`. `openclaw node install` зберігає її в середовищі LaunchAgent, якщо вона присутня в команді встановлення.

Схваліть вузол із хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить вузол і що він анонсує як `googlemeet.chrome`, так і можливість браузера/`browser.proxy`:

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

Тепер приєднуйтеся як зазвичай із хоста Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

або попросіть агента використати інструмент `google_meet` із `transport: "chrome-node"`.

Для швидкого тесту однією командою, який створює або повторно використовує сеанс, промовляє відому фразу та виводить стан сеансу:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає вузол лише тоді, коли рівно один підключений вузол анонсує і `googlemeet.chrome`, і керування браузером. Якщо підключено кілька придатних вузлів, установіть `chromeNode.node` як id вузла, відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM, схваліть спарювання та переконайтеся, що у VM були виконані `openclaw plugins enable google-meet` і `openclaw plugins enable browser`. Також підтвердьте, що хост Gateway дозволяє обидві команди вузла через `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch` у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або залиште `chrome.guestName` установленим для гостьового входу. Автоматичне гостьове приєднання використовує автоматизацію браузера OpenClaw через browser proxy вузла; переконайтеся, що конфігурація browser вузла вказує на потрібний профіль, наприклад `browser.defaultProfile: "user"` або профіль named existing-session.
- Дубльовані вкладки Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw активує наявну вкладку для тієї самої URL-адреси Meet перед відкриттям нової.
- Немає аудіо: у Meet спрямовуйте аудіо мікрофона й динаміка через шлях віртуального аудіопристрою, який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію в стилі Loopback для чистого дуплексу.

## Примітки щодо встановлення

Типове налаштування realtime для Chrome використовує два зовнішні інструменти:

- `sox`: утиліта аудіо командного рядка. Plugin використовує її команди `rec` і `play` для типового аудіомоста G.711 mu-law 8 кГц.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`, через який Chrome/Meet може маршрутизувати звук.

OpenClaw не постачається разом із жодним із цих пакетів і не розповсюджує їх. У документації користувачам пропонується встановлювати їх як залежності хоста через Homebrew. SoX ліцензовано як `LGPL-2.0-only AND GPL-2.0-only`; BlackHole — за GPL-3.0. Якщо ви створюєте інсталятор або appliance, що містить BlackHole разом з OpenClaw, перегляньте умови ліцензування BlackHole в апстрімі або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet у Google Chrome і приєднується як профіль Chrome, у якому виконано вхід. На macOS Plugin перед запуском перевіряє наявність `BlackHole 2ch`. Якщо налаштовано, він також запускає команду перевірки стану аудіомоста та команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють на спареному вузлі, наприклад у macOS VM Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона та динаміка Chrome через локальний аудіоміст OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування, а не тихим приєднанням без аудіошляху.

### Twilio

Транспорт Twilio — це суворий план набору, делегований Plugin Voice Call. Він не аналізує сторінки Meet для пошуку номерів телефону.

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

Доступ до Google Meet Media API спочатку використовує персональний клієнт OAuth. Налаштуйте `oauth.clientId` і за потреби `oauth.clientSecret`, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` з токеном оновлення. Вона використовує PKCE, localhost callback на `http://localhost:8085/oauth2callback` і ручний потік копіювання/вставлення з `--manual`.

Ці змінні середовища приймаються як резервні варіанти:

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

Запускайте попередню перевірку перед роботою з медіа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш проєкт Cloud, принципал OAuth і учасники зустрічі зареєстровані в Google Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Поширений шлях Chrome realtime потребує лише ввімкненого Plugin, BlackHole, SoX і ключа бекенд-провайдера голосового зв’язку в реальному часі. OpenAI використовується за замовчуванням; установіть `realtime.provider: "google"` для використання Google Gemini Live:

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

Типові значення:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: необов’язковий id/ім’я/IP вузла для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на сторінці гостьового входу Meet без авторизації
- `chrome.autoJoin: true`: заповнення гостьового імені та натискання Join Now за принципом best-effort через автоматизацію браузера OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активує наявну вкладку Meet замість відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: очікування, доки вкладка Meet повідомить про стан in-call, перш ніж буде ініційовано вступне повідомлення realtime
- `chrome.audioInputCommand`: команда SoX `rec`, що записує аудіо G.711 mu-law 8 кГц у stdout
- `chrome.audioOutputCommand`: команда SoX `play`, що зчитує аудіо G.711 mu-law 8 кГц із stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді з `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли підключається міст realtime; установіть `""`, щоб приєднуватися беззвучно

Необов’язкові перевизначення:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    toolPolicy: "owner",
    introMessage: "Скажи рівно так: Я тут.",
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

Використовуйте `transport: "chrome"`, коли Chrome працює на хості Gateway. Використовуйте `transport: "chrome-node"`, коли Chrome працює на спареному вузлі, наприклад у VM Parallels. В обох випадках модель realtime і `openclaw_agent_consult` працюють на хості Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб отримати список активних сеансів або перевірити ідентифікатор сеансу. Використовуйте `action: "speak"` з `sessionId` і `message`, щоб агент realtime почав говорити негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сеанс, запустити відому фразу й повернути стан `inCall`, якщо хост Chrome може його повідомити. Використовуйте `action: "leave"`, щоб позначити сеанс як завершений.

`status` містить стан Chrome, коли він доступний:

- `inCall`: схоже, що Chrome перебуває всередині виклику Meet
- `micMuted`: best-effort стан мікрофона Meet
- `providerConnected` / `realtimeReady`: стан голосового моста realtime
- `lastInputAt` / `lastOutputAt`: час останнього аудіо, отриманого мостом або надісланого до нього

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Скажи рівно так: Я тут і слухаю."
}
```

## Консультація агента realtime

Режим Chrome realtime оптимізовано для живого голосового циклу. Провайдер голосового зв’язку realtime чує аудіо зустрічі та говорить через налаштований аудіоміст. Коли моделі realtime потрібні глибші міркування, актуальна інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw у фоновому режимі з контекстом нещодавньої стенограми зустрічі та повертає стислу усну відповідь до голосового сеансу realtime. Потім голосова модель може озвучити цю відповідь назад у зустрічі.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: надає інструмент консультації та обмежує звичайного агента інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`.
- `owner`: надає інструмент консультації та дозволяє звичайному агенту використовувати звичайну політику інструментів агента.
- `none`: не надає інструмент консультації моделі голосового зв’язку realtime.

Ключ сеансу консультації обмежено межами кожного сеансу Meet, тому повторні виклики консультації можуть повторно використовувати попередній контекст консультації протягом тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднався до виклику:

```bash
openclaw googlemeet speak meet_... "Скажи рівно так: Я тут і слухаю."
```

Для повного швидкого тесту приєднання та озвучення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Скажи рівно так: Я тут і слухаю."
```

## Примітки

Офіційний медіа-API Google Meet орієнтований на приймання, тому для мовлення у виклик Meet усе ще потрібен шлях учасника. Цей Plugin зберігає цю межу видимою: Chrome відповідає за участь через браузер і локальну маршрутизацію аудіо; Twilio відповідає за участь через телефонний дозвін.

Режиму Chrome realtime потрібно одне з такого:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує мостом моделі realtime і передає аудіо G.711 mu-law 8 кГц між цими командами та вибраним провайдером голосового зв’язку realtime.
- `chrome.audioBridgeCommand`: зовнішня команда моста повністю керує локальним аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний пристрій BlackHole може повертати голоси інших учасників назад у виклик.

`googlemeet speak` запускає активний аудіоміст realtime для сеансу Chrome. `googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих через Plugin Voice Call, `leave` також кладе слухавку базового голосового виклику.

## Пов’язане

- [Plugin Voice call](/uk/plugins/voice-call)
- [Режим Talk](/uk/nodes/talk)
- [Створення Plugin](/uk/plugins/building-plugins)
