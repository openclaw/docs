---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до виклику Google Meet
    - Ви налаштовуєте Chrome, Chrome Node або Twilio як транспорт для Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL Meet через Chrome або Twilio з типовими параметрами голосу в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T18:11:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5870ce256924c9a5df455ee8f3c74d75dc24413314dc745eaf24282b58fb2036
    source_path: plugins/google-meet.md
    workflow: 15
---

Підтримка учасників Google Meet для OpenClaw — цей Plugin навмисно зроблено явним:

- Він приєднується лише до явного URL `https://meet.google.com/...`.
- `realtime` voice — типовий режим.
- Voice у реальному часі може повертатися до повного агента OpenClaw, коли потрібні глибші
  міркування або інструменти.
- Агенти вибирають поведінку приєднання через `mode`: використовуйте `realtime` для живого
  прослуховування/відповідей голосом, або `transcribe`, щоб приєднатися/керувати браузером без
  мосту голосу в реальному часі.
- Автентифікація починається як особистий Google OAuth або вже виконаний вхід у профіль Chrome.
- Автоматичного оголошення згоди немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на сполученому хості Node.
- Twilio приймає номер для дозвону та необов’язковий PIN або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших
  сценаріїв телеконференцій агента.

## Швидкий старт

Встановіть локальні аудіозалежності та налаштуйте бекенд-провайдера voice у реальному часі.
Типово використовується OpenAI; Google Gemini Live також працює з
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` встановлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор
Homebrew вимагає перезавантаження, перш ніж macOS покаже цей пристрій:

```bash
sudo reboot
```

Після перезавантаження перевірте обидва компоненти:

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
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Для приєднання лише для спостереження/керування браузером установіть `"mode": "transcribe"`. Це
не запускає двобічний міст моделі в реальному часі, тож він не говоритиме назад у
зустріч.

Chrome приєднується як профіль Chrome з виконаним входом. У Meet виберіть `BlackHole 2ch` для
шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого двобічного аудіо використовуйте
окремі віртуальні пристрої або граф у стилі Loopback; одного пристрою BlackHole
достатньо для першого smoke test, але він може давати луну.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM
лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть
хост Node у VM. Один раз увімкніть вбудований Plugin на VM, щоб Node
рекламував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, realtime-
  провайдер і конфігурація Plugin Google Meet.
- macOS VM у Parallels: CLI/хост Node OpenClaw, Google Chrome, SoX, BlackHole 2ch,
  і профіль Chrome з виконаним входом у Google.
- Не потрібно у VM: сервіс Gateway, конфігурація агента, ключ OpenAI/GPT або налаштування
  провайдера моделі.

Встановіть залежності у VM:

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
command -v rec play
```

Встановіть або оновіть OpenClaw у VM, потім увімкніть там вбудований Plugin:

```bash
openclaw plugins enable google-meet
```

Запустіть хост Node у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це IP LAN і ви не використовуєте TLS, Node відмовляється від
простого WebSocket, якщо ви явно не дозволите цю довірену приватну мережу:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це змінна середовища процесу, а не
налаштування `openclaw.json`. `openclaw node install` зберігає її в середовищі LaunchAgent,
коли вона присутня в команді встановлення.

Схваліть Node з хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить Node і що він рекламує і `googlemeet.chrome`,
і можливість браузера/`browser.proxy`:

```bash
openclaw nodes status
```

Спрямуйте Meet через цей Node на хості Gateway:

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

Тепер приєднуйтесь як звичайно з хоста Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

або попросіть агента використати інструмент `google_meet` з `transport: "chrome-node"`.

Для smoke test однією командою, який створює або повторно використовує сесію, промовляє відому
фразу та виводить стан сесії:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Якщо профіль браузера не має виконаного входу, Meet очікує допуску хоста, або
Chrome потребує дозволу на мікрофон/камеру, результат join/test-speech повідомляє
`manualActionRequired: true` з `manualActionReason` і
`manualActionMessage`. Агенти повинні припинити повторні спроби приєднання, повідомити
оператору це повідомлення і повторити спробу лише після завершення ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає лише тоді, коли рівно один
підключений Node рекламує і `googlemeet.chrome`, і керування браузером. Якщо
підключено кілька придатних Node, установіть `chromeNode.node` у значення id Node,
display name або віддаленого IP.

Поширені перевірки збоїв:

- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  схваліть сполучення і переконайтеся, що у VM було виконано `openclaw plugins enable google-meet` і
  `openclaw plugins enable browser`. Також підтвердьте, що
  хост Gateway дозволяє обидві команди Node через
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch`
  у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM, або
  залиште `chrome.guestName` установленим для гостьового входу. Гостьове auto-join використовує
  автоматизацію браузера OpenClaw через browser proxy Node; переконайтеся, що конфігурація
  браузера Node вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або профіль наявної сесії з іменем.
- Дублі вкладок Meet: залишайте `chrome.reuseExistingTab: true` увімкненим. OpenClaw
  активує наявну вкладку для того самого URL Meet перед відкриттям нової.
- Немає аудіо: у Meet спрямовуйте мікрофон і динамік через шлях віртуального аудіопристрою,
  який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію в стилі Loopback
  для чистого двобічного аудіо.

## Примітки щодо встановлення

Типовий шлях Chrome realtime використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для аудіо. Plugin використовує її команди `rec` і `play`
  для типового аудіомосту 8 kHz G.711 mu-law.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій
  `BlackHole 2ch`, через який Chrome/Meet можуть маршрутизувати звук.

OpenClaw не постачає і не розповсюджує жоден із цих пакетів. У документації користувачам
пропонується встановлювати їх як залежності хоста через Homebrew. SoX ліцензовано як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole — GPL-3.0. Якщо ви збираєте
інсталятор або appliance, який містить BlackHole разом з OpenClaw, перегляньте
умови ліцензування BlackHole у першоджерелі або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL Meet у Google Chrome і приєднується як профіль
Chrome з виконаним входом. На macOS Plugin перевіряє наявність `BlackHole 2ch` перед запуском.
Якщо налаштовано, він також виконує команду перевірки стану аудіомосту та команду запуску
перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway;
використовуйте `chrome-node`, коли Chrome/аудіо працюють на сполученому Node, наприклад у macOS VM Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона й динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування
замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план дозвону, делегований Plugin Voice Call. Він
не аналізує сторінки Meet у пошуках телефонних номерів.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Використовуйте `--dtmf-sequence`, коли зустріч потребує нестандартної послідовності:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth і preflight

Доступ до Google Meet Media API спочатку використовує особистий клієнт OAuth. Налаштуйте
`oauth.clientId` і, за бажанням, `oauth.clientSecret`, потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` із refresh token. Вона використовує PKCE,
localhost callback на `http://localhost:8085/oauth2callback` і ручний
процес copy/paste з `--manual`.

Ці змінні середовища приймаються як запасні варіанти:

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

Перед роботою з медіа виконайте preflight:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш
Cloud project, OAuth principal і учасники зустрічі включені до програми Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Загальному шляху Chrome realtime потрібні лише увімкнений Plugin, BlackHole, SoX
і ключ бекенд-провайдера voice у реальному часі. Типово використовується OpenAI; установіть
`realtime.provider: "google"`, щоб використовувати Google Gemini Live:

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
- `chromeNode.node`: необов’язковий id/ім’я/IP Node для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, яке використовується на екрані
  гостьового входу Meet без виконаного входу
- `chrome.autoJoin: true`: заповнення імені гостя та натискання Join Now з
  найкращим зусиллям через автоматизацію браузера OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкривання дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, поки вкладка Meet повідомить про
  перебування в дзвінку, перш ніж запускати вступ для realtime
- `chrome.audioInputCommand`: команда SoX `rec`, яка записує аудіо 8 kHz G.711 mu-law
  у stdout
- `chrome.audioOutputCommand`: команда SoX `play`, яка читає аудіо 8 kHz G.711 mu-law
  зі stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли підключається
  міст realtime; установіть `""`, щоб приєднуватися беззвучно

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
`transport: "chrome-node"`, коли Chrome працює на сполученому Node, наприклад у Parallels
VM. В обох випадках realtime-модель і `openclaw_agent_consult` працюють на
хості Gateway, тож облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сесії або перевірити ID сесії. Використовуйте
`action: "speak"` із `sessionId` і `message`, щоб змусити realtime-агента
говорити негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сесію,
запустити відому фразу і повернути стан `inCall`, якщо хост Chrome може його повідомити. Використовуйте
`action: "leave"`, щоб позначити сесію завершеною.

`status` містить стан Chrome, коли він доступний:

- `inCall`: Chrome, імовірно, перебуває всередині виклику Meet
- `micMuted`: стан мікрофона Meet з найкращим зусиллям
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профіль
  браузера потребує ручного входу, допуску хоста Meet, дозволів або відновлення
  керування браузером, перш ніж запрацює мовлення
- `providerConnected` / `realtimeReady`: стан мосту голосу в реальному часі
- `lastInputAt` / `lastOutputAt`: останнє аудіо, отримане мостом або надіслане ним

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Консультація агента в реальному часі

Режим Chrome realtime оптимізовано для живого голосового циклу. Провайдер голосу в реальному часі
чує аудіо зустрічі і говорить через налаштований аудіоміст.
Коли realtime-моделі потрібні глибші міркування, актуальна інформація або звичайні
інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент consult у фоновому режимі запускає звичайного агента OpenClaw з контекстом
недавнього транскрипту зустрічі та повертає стислу усну відповідь до сесії
voice у реальному часі. Потім voice-модель може проговорити цю відповідь назад у зустріч.

`realtime.toolPolicy` керує запуском consult:

- `safe-read-only`: показує інструмент consult і обмежує звичайного агента
  інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: показує інструмент consult і дозволяє звичайному агенту використовувати
  звичайну політику інструментів агента.
- `none`: не показує інструмент consult realtime-voice-моделі.

Ключ сесії consult обмежений кожною окремою сесією Meet, тож наступні виклики consult
можуть повторно використовувати попередній контекст consult під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднався до виклику:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повного smoke test із приєднанням і мовленням:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Примітки

Офіційний media API Google Meet орієнтований на отримання, тож для мовлення у виклик Meet
усе ще потрібен шлях учасника. Цей Plugin зберігає цю межу видимою:
Chrome обробляє участь через браузер і локальну маршрутизацію аудіо; Twilio обробляє
участь через телефонний дозвін.

Режиму Chrome realtime потрібне одне з такого:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw володіє
  мостом realtime-моделі та передає аудіо 8 kHz G.711 mu-law між цими
  командами та вибраним провайдером voice у реальному часі.
- `chrome.audioBridgeCommand`: зовнішня команда моста володіє всім локальним
  аудіошляхом і повинна завершитися після запуску або перевірки свого демона.

Для чистого двобічного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може повертати інших учасників луною назад у виклик.

`googlemeet speak` запускає активний мост realtime-аудіо для сесії Chrome.
`googlemeet leave` зупиняє цей міст. Для сесій Twilio, делегованих через Plugin Voice Call,
`leave` також кладе слухавку базового голосового виклику.

## Пов’язане

- [Plugin Voice Call](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення Plugins](/uk/plugins/building-plugins)
