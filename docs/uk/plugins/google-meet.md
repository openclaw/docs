---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт для Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio з типовими налаштуваннями голосу в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T19:34:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75602b454c3a27a5d7155390e15525d170290846758d9d1ea3b19336d7aa10a9
    source_path: plugins/google-meet.md
    workflow: 15
---

Підтримка учасників Google Meet для OpenClaw — цей Plugin навмисно є явним за дизайном:

- Він приєднується лише за явною URL-адресою `https://meet.google.com/...`.
- Голосовий режим `realtime` є типовим режимом.
- Голосовий режим реального часу може повертатися до повного агента OpenClaw, коли потрібні глибші міркування або інструменти.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `realtime` для живого прослуховування/зворотного мовлення або `transcribe`, щоб приєднатися/керувати браузером без голосового мосту реального часу.
- Автентифікація починається як персональний Google OAuth або вже виконаний вхід у профіль Chrome.
- Автоматичного оголошення згоди немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на підключеному вузлі.
- Twilio приймає номер для дозвону та необов’язкову PIN-код або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших сценаріїв агентських телеконференцій.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте бекенд-провайдера голосу реального часу. OpenAI використовується за замовчуванням; Google Gemini Live також працює з `realtime.provider: "google"`:

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

Після перезавантаження перевірте обидві частини:

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

Вивід налаштування призначений для читання агентом. Він повідомляє про профіль Chrome, аудіоміст, закріплення вузла, відкладений вступ у realtime і, якщо налаштовано делегування Twilio, чи готові Plugin `voice-call` і облікові дані Twilio.
Будь-яку перевірку `ok: false` слід вважати блокувальним фактором перед тим, як просити агента приєднатися.

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

Для приєднання лише для спостереження/керування браузером установіть `"mode": "transcribe"`. Це не запускає двонапрямний міст моделі реального часу, тому він не буде відповідати голосом у зустрічі.

Chrome приєднується як профіль Chrome, у якому виконано вхід. У Meet виберіть `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого двонапрямного аудіо використовуйте окремі віртуальні пристрої або граф на кшталт Loopback; одного пристрою BlackHole достатньо для першого smoke-тесту, але може виникати луна.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM лише для того, щоб Chrome працював у VM. Запустіть Gateway і агента локально, а потім запустіть хост вузла у VM. Один раз увімкніть вбудований Plugin у VM, щоб вузол оголошував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, провайдер realtime і конфігурація Plugin Google Meet.
- macOS VM у Parallels: CLI/хост вузла OpenClaw, Google Chrome, SoX, BlackHole 2ch і профіль Chrome з виконаним входом у Google.
- Не потрібно у VM: служба Gateway, конфігурація агента, ключ OpenAI/GPT або налаштування провайдера моделі.

Установіть залежності у VM:

```bash
brew install blackhole-2ch sox
```

Після встановлення BlackHole перезавантажте VM, щоб macOS зробила `BlackHole 2ch` доступним:

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

Якщо `<gateway-host>` — це IP-адреса локальної мережі й ви не використовуєте TLS, вузол відхилить відкритий WebSocket, якщо ви явно не дозволите це для цієї довіреної приватної мережі:

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

Підтвердьте вузол із хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить вузол і що він оголошує і `googlemeet.chrome`, і можливість браузера/`browser.proxy`:

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

або попросіть агента використати інструмент `google_meet` з `transport: "chrome-node"`.

Для smoke-тесту однією командою, який створює або повторно використовує сеанс, промовляє відому фразу та виводить стан сеансу:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Якщо профіль браузера не авторизований, Meet очікує допуску від організатора або Chrome потребує дозволу на мікрофон/камеру, результат join/test-speech повідомить `manualActionRequired: true` разом із `manualActionReason` і `manualActionMessage`. Агенти повинні припинити повторні спроби приєднання, повідомити оператору це повідомлення й повторити спробу лише після завершення ручної дії в браузері.

Якщо `chromeNode.node` не вказано, OpenClaw автоматично вибирає вузол лише тоді, коли рівно один підключений вузол оголошує і `googlemeet.chrome`, і керування браузером. Якщо підключено кілька придатних вузлів, задайте `chromeNode.node` як id вузла, відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM, підтвердьте сполучення й переконайтеся, що у VM було виконано `openclaw plugins enable google-meet` і `openclaw plugins enable browser`. Також підтвердьте, що хост Gateway дозволяє обидві команди вузла через `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch` у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або залиште `chrome.guestName` установленим для гостьового входу. Автоматичне гостьове приєднання використовує автоматизацію браузера OpenClaw через проксі браузера вузла; переконайтеся, що конфігурація браузера вузла вказує на потрібний профіль, наприклад `browser.defaultProfile: "user"` або іменований профіль існуючого сеансу.
- Дубльовані вкладки Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw активує наявну вкладку для тієї самої URL-адреси Meet перед відкриттям нової.
- Немає аудіо: у Meet спрямовуйте мікрофон/динамік через шлях віртуального аудіопристрою, який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію на кшталт Loopback для чистого двонапрямного аудіо.

## Примітки щодо встановлення

Типовий режим realtime для Chrome використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для роботи з аудіо. Plugin використовує її команди `rec` і `play` для типового аудіомосту 8 кГц G.711 mu-law.
- `blackhole-2ch`: віртуальний аудіодрайвер для macOS. Він створює аудіопристрій `BlackHole 2ch`, через який Chrome/Meet можуть маршрутизувати звук.

OpenClaw не постачає й не розповсюджує жоден із цих пакетів. У документації користувачам пропонується встановлювати їх як залежності хоста через Homebrew. SoX ліцензується як `LGPL-2.0-only AND GPL-2.0-only`; BlackHole — за GPL-3.0. Якщо ви збираєте інсталятор або appliance, що постачає BlackHole разом з OpenClaw, перегляньте умови ліцензування BlackHole в апстрімі або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet у Google Chrome і приєднується як профіль Chrome, у якому виконано вхід. На macOS Plugin перед запуском перевіряє наявність `BlackHole 2ch`. Якщо налаштовано, він також запускає команду перевірки працездатності аудіомосту та команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють на підключеному вузлі, наприклад у macOS VM Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона й динаміка Chrome через локальний аудіоміст OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершиться помилкою налаштування, а не непомітним приєднанням без аудіошляху.

### Twilio

Транспорт Twilio — це суворий план дозвону, делегований Plugin Voice Call. Він не аналізує сторінки Meet для пошуку телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або якщо вам потрібен резервний варіант дозвону телефоном. Google Meet має показувати номер для телефонного дозвону та PIN для зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

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

Надайте облікові дані Twilio через середовище або конфігурацію. Середовище дозволяє не зберігати секрети в `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Після ввімкнення `voice-call` перезапустіть або перезавантажте Gateway; зміни конфігурації Plugin не з’являються в уже запущеному процесі Gateway, доки його не буде перезавантажено.

Потім перевірте:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Коли делегування Twilio налаштовано, `googlemeet setup` містить успішні перевірки `twilio-voice-call-plugin` і `twilio-voice-call-credentials`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Використовуйте `--dtmf-sequence`, якщо зустріч потребує спеціальної послідовності:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth і попередня перевірка

Доступ до Google Meet Media API спочатку використовує персональний OAuth-клієнт. Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` із токеном оновлення. Вона використовує PKCE, зворотний виклик localhost на `http://localhost:8085/oauth2callback` і ручний потік копіювання/вставлення з `--manual`.

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

Запустіть попередню перевірку перед роботою з медіа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud project, OAuth-принципал і учасники зустрічі зареєстровані в Google Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Поширений шлях realtime для Chrome потребує лише ввімкненого Plugin, BlackHole, SoX і ключа бекенд-провайдера голосу реального часу. OpenAI використовується за замовчуванням; установіть `realtime.provider: "google"`, щоб використовувати Google Gemini Live:

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
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на гостьовому екрані Meet без входу
- `chrome.autoJoin: true`: найкраща можлива спроба заповнити гостьове ім’я і натиснути Join Now через автоматизацію браузера OpenClaw у `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, поки вкладка Meet повідомить про перебування в дзвінку, перш ніж буде запущено вступ у realtime
- `chrome.audioInputCommand`: команда SoX `rec`, що записує аудіо 8 кГц G.711 mu-law у stdout
- `chrome.audioOutputCommand`: команда SoX `play`, що читає аудіо 8 кГц G.711 mu-law зі stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли підключається міст realtime; установіть `""`, щоб приєднатися беззвучно

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

`voiceCall.enabled` за замовчуванням має значення `true`; з транспортом Twilio він делегує фактичний PSTN-дзвінок і DTMF Plugin Voice Call. Якщо `voice-call` не ввімкнено, Google Meet усе ще може перевіряти та записувати план дозвону, але не може здійснювати дзвінок Twilio.

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

Використовуйте `transport: "chrome"`, коли Chrome працює на хості Gateway. Використовуйте `transport: "chrome-node"`, коли Chrome працює на підключеному вузлі, наприклад у VM Parallels. В обох випадках модель realtime і `openclaw_agent_consult` працюють на хості Gateway, тож облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сеанси або перевірити ID сеансу. Використовуйте `action: "speak"` із `sessionId` і `message`, щоб змусити агента realtime говорити негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сеанс, запустити відому фразу й повернути стан `inCall`, коли хост Chrome може його повідомити. Використовуйте `action: "leave"`, щоб позначити сеанс як завершений.

`status` включає стан Chrome, коли він доступний:

- `inCall`: схоже, що Chrome перебуває всередині дзвінка Meet
- `micMuted`: найкраща можлива оцінка стану мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профіль браузера потребує ручного входу, допуску від організатора Meet, дозволів або відновлення керування браузером, перш ніж мовлення зможе працювати
- `providerConnected` / `realtimeReady`: стан голосового мосту realtime
- `lastInputAt` / `lastOutputAt`: коли востаннє аудіо надходило до мосту або надсилалося з нього

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Консультація агента realtime

Режим realtime для Chrome оптимізовано для живого голосового циклу. Провайдер голосу реального часу чує аудіо зустрічі й говорить через налаштований аудіоміст. Коли моделі realtime потрібні глибші міркування, поточна інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент consult запускає звичайного агента OpenClaw у фоновому режимі з контекстом нещодавньої стенограми зустрічі й повертає стислу усну відповідь до голосового сеансу realtime. Потім голосова модель може озвучити цю відповідь назад у зустрічі.

`realtime.toolPolicy` керує запуском consult:

- `safe-read-only`: показувати інструмент consult і обмежувати звичайного агента інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`.
- `owner`: показувати інструмент consult і дозволяти звичайному агенту використовувати звичайну політику інструментів агента.
- `none`: не показувати інструмент consult голосовій моделі realtime.

Ключ сеансу consult має область видимості в межах кожного сеансу Meet, тому наступні виклики consult можуть повторно використовувати попередній контекст consult під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднався до дзвінка:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повного smoke-тесту приєднання і мовлення:

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

Очікуваний стан для Chrome-node:

- `googlemeet setup` повністю зелений.
- `nodes status` показує, що вибраний вузол підключено.
- Вибраний вузол оголошує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до дзвінка, а `test-speech` повертає стан Chrome з `inCall: true`.

Для smoke-тесту Twilio використовуйте зустріч, яка показує дані телефонного дозвону:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Очікуваний стан для Twilio:

- `googlemeet setup` включає зелені перевірки `twilio-voice-call-plugin` і `twilio-voice-call-credentials`.
- `voicecall` доступний у CLI після перезавантаження Gateway.
- Повернутий сеанс має `transport: "twilio"` і `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` завершує делегований голосовий дзвінок.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно редагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway. Запущений агент бачить лише інструменти Plugin, зареєстровані поточним процесом Gateway.

### Немає підключеного вузла з підтримкою Google Meet

На хості вузла виконайте:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

На хості Gateway підтвердьте вузол і перевірте команди:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Вузол має бути підключений і містити `googlemeet.chrome` та `browser.proxy`.
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

### Браузер відкривається, але агент не може приєднатися

Запустіть `googlemeet test-speech` і перевірте повернутий стан Chrome. Якщо він повідомляє `manualActionRequired: true`, покажіть `manualActionMessage` оператору й припиніть повторні спроби, доки дію в браузері не буде завершено.

Поширені ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису організатора Meet.
- Надати Chrome дозволи на мікрофон/камеру.
- Закрити або виправити зависле діалогове вікно дозволів Meet.

### Агент приєднується, але не говорить

Перевірте шлях realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet status
```

Використовуйте `mode: "realtime"` для прослуховування/зворотного мовлення. `mode: "transcribe"` навмисно не запускає двонапрямний голосовий міст realtime.

Також перевірте:

- На хості Gateway доступний ключ провайдера realtime, наприклад `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `rec` і `play` існують на хості Chrome.
- Мікрофон і динамік Meet спрямовано через віртуальний аудіошлях, який використовує OpenClaw.

### Перевірки налаштування Twilio завершуються з помилкою

`twilio-voice-call-plugin` завершується з помилкою, коли `voice-call` не дозволено або не ввімкнено. Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте Gateway.

`twilio-voice-call-credentials` завершується з помилкою, коли у бекенда Twilio немає SID облікового запису, токена автентифікації або номера абонента. Установіть їх на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Потім перезапустіть або перезавантажте Gateway і виконайте:

```bash
openclaw googlemeet setup
```

### Дзвінок Twilio починається, але ніколи не входить у зустріч

Підтвердьте, що подія Meet показує дані телефонного дозвону. Передайте точний номер дозвону та PIN або спеціальну послідовність DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початковий `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза перед введенням PIN.

## Примітки

Офіційний media API Google Meet орієнтований на приймання, тому мовлення в дзвінок Meet усе ще потребує шляху участі. Цей Plugin зберігає цю межу видимою: Chrome відповідає за участь через браузер і локальну маршрутизацію аудіо; Twilio відповідає за участь через телефонний дозвін.

Режим realtime для Chrome потребує одного з варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує мостом моделі realtime і передає аудіо 8 кГц G.711 mu-law між цими командами та вибраним провайдером голосу реального часу.
- `chrome.audioBridgeCommand`: зовнішня команда мосту керує всім локальним аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого двонапрямного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі віртуальні пристрої або граф віртуального пристрою на кшталт Loopback. Один спільний пристрій BlackHole може повертати голоси інших учасників назад у дзвінок.

`googlemeet speak` запускає активний аудіоміст realtime для сеансу Chrome.
`googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих через Plugin Voice Call, `leave` також завершує базовий голосовий дзвінок.

## Пов’язані матеріали

- [Plugin Voice call](/uk/plugins/voice-call)
- [Режим talk](/uk/nodes/talk)
- [Створення Plugin](/uk/plugins/building-plugins)
