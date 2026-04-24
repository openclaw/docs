---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт для Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio з типовими налаштуваннями для голосу в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T16:21:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8ea964b8b5b7d68e3dbd4354b5bbeacce5bbe14b8fe0d703bb5f87c3c7cdff2f
    source_path: plugins/google-meet.md
    workflow: 15
---

Підтримка учасників Google Meet для OpenClaw — Plugin є навмисно явним за задумом:

- Він приєднується лише до явного URL `https://meet.google.com/...`.
- Голос `realtime` є режимом за замовчуванням.
- Голос у реальному часі може повертатися до повного агента OpenClaw, коли потрібні глибші
  міркування або інструменти.
- Автентифікація починається з особистого Google OAuth або вже виконаного входу в профіль Chrome.
- Автоматичного оголошення про згоду немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на з’єднаному вузлі.
- Twilio приймає номер для набору плюс необов’язковий PIN або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших
  сценаріїв телеконференцій агентів.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте бекенд-провайдера голосу
в реальному часі. OpenAI використовується за замовчуванням; Google Gemini Live також працює з
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# або
export GEMINI_API_KEY=...
```

`blackhole-2ch` установлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор
Homebrew потребує перезавантаження, перш ніж macOS зробить пристрій доступним:

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

Chrome приєднується як профіль Chrome із виконаним входом. У Meet виберіть `BlackHole 2ch` для
шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого двобічного аудіо використовуйте
окремі віртуальні пристрої або граф на кшталт Loopback; одного пристрою BlackHole
достатньо для першої димової перевірки, але можливе відлуння.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний Gateway OpenClaw або ключ API моделі всередині macOS VM
лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім
запустіть вузол у VM. Один раз увімкніть у VM вбудований Plugin, щоб вузол
рекламував команду Chrome:

Що де працює:

- Хост Gateway: Gateway OpenClaw, робоче середовище агента, ключі моделі/API, провайдер
  реального часу та конфігурація Plugin Google Meet.
- macOS VM у Parallels: CLI/node host OpenClaw, Google Chrome, SoX, BlackHole 2ch
  і профіль Chrome з виконаним входом у Google.
- Не потрібно у VM: служба Gateway, конфігурація агента, ключ OpenAI/GPT або
  налаштування провайдера моделі.

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

Запустіть node host у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це IP LAN і ви не використовуєте TLS, вузол відхиляє
простий WebSocket, якщо ви явно не дозволите це для довіреної приватної мережі:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це змінна середовища процесу, а не
параметр `openclaw.json`. `openclaw node install` зберігає її в середовищі LaunchAgent,
коли вона присутня в команді встановлення.

Схваліть вузол із хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить вузол і що він рекламує як `googlemeet.chrome`,
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

Тепер приєднуйтеся звичайним способом із хоста Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

або попросіть агента використати інструмент `google_meet` із `transport: "chrome-node"`.

Для димової перевірки однією командою, яка створює або повторно використовує сесію,
промовляє відому фразу та виводить стан сесії:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Якщо `chromeNode.node` не вказано, OpenClaw автоматично вибирає вузол лише тоді, коли рівно один
підключений вузол рекламує і `googlemeet.chrome`, і керування браузером. Якщо
підключено кілька придатних вузлів, установіть `chromeNode.node` на id вузла,
відображуване ім’я або віддалений IP.

Поширені перевірки збоїв:

- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  схваліть з’єднання та переконайтеся, що у VM були виконані `openclaw plugins enable google-meet` і
  `openclaw plugins enable browser`. Також підтвердьте, що
  хост Gateway дозволяє обидві команди вузла через
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch`
  у VM та перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або
  залиште `chrome.guestName` встановленим для гостьового входу. Автоприєднання гостя використовує
  автоматизацію браузера OpenClaw через проксі браузера вузла; переконайтеся, що конфігурація браузера вузла
  вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або іменований профіль наявної сесії.
- Дубльовані вкладки Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw
  активує наявну вкладку для того самого URL Meet перед відкриттям нової.
- Немає аудіо: у Meet спрямовуйте звук мікрофона та динаміка через шлях
  віртуального аудіопристрою, який використовує OpenClaw; для чистого двобічного аудіо використовуйте
  окремі віртуальні пристрої або маршрутизацію на кшталт Loopback.

## Примітки щодо встановлення

Типовий режим реального часу для Chrome використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для роботи з аудіо. Plugin використовує її команди `rec` і `play`
  для типового аудіомоста 8 кГц G.711 mu-law.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`,
  через який Chrome/Meet можуть маршрутизувати звук.

OpenClaw не постачає і не розповсюджує жоден із цих пакетів. У документації користувачам
пропонується встановити їх як залежності хоста через Homebrew. SoX ліцензовано як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole — GPL-3.0. Якщо ви створюєте інсталятор або
пристрій, який постачає BlackHole разом з OpenClaw, перегляньте умови
ліцензування BlackHole в першоджерелі або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL Meet у Google Chrome і приєднується як профіль Chrome
із виконаним входом. У macOS Plugin перед запуском перевіряє наявність `BlackHole 2ch`.
Якщо налаштовано, він також запускає команду перевірки стану аудіомоста та команду запуску
перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway;
використовуйте `chrome-node`, коли Chrome/аудіо працюють на з’єднаному вузлі, наприклад у Parallels
macOS VM.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона та динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування
замість тихого входу без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план набору, делегований Plugin Voice Call. Він
не аналізує сторінки Meet у пошуку телефонних номерів.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Використовуйте `--dtmf-sequence`, коли зустріч потребує користувацької послідовності:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth і попередня перевірка

Доступ до Google Meet Media API спочатку використовує особистий OAuth-клієнт. Налаштуйте
`oauth.clientId` і, за потреби, `oauth.clientSecret`, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` з refresh token. Вона використовує PKCE,
локальний callback на `http://localhost:8085/oauth2callback` і ручний
сценарій копіювання/вставлення з `--manual`.

Ці змінні середовища приймаються як резервні варіанти:

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

Виконайте попередню перевірку перед роботою з медіа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
project, OAuth principal і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Поширений шлях Chrome для режиму реального часу потребує лише увімкненого Plugin, BlackHole, SoX
і ключа бекенд-провайдера голосу реального часу. OpenAI використовується за замовчуванням; установіть
`realtime.provider: "google"`, щоб використовувати Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# або
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
- `chrome.guestName: "OpenClaw Agent"`: ім’я, яке використовується на екрані
  гостя Meet без виконаного входу
- `chrome.autoJoin: true`: найкраща спроба заповнити ім’я гостя та натиснути Join Now
  через автоматизацію браузера OpenClaw у `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, поки вкладка Meet повідомить про стан in-call,
  перш ніж буде запущено вступне повідомлення реального часу
- `chrome.audioInputCommand`: команда SoX `rec`, що записує аудіо
  8 кГц G.711 mu-law у stdout
- `chrome.audioOutputCommand`: команда SoX `play`, що читає аудіо
  8 кГц G.711 mu-law зі stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли підключається міст
  реального часу; установіть `""`, щоб приєднатися беззвучно

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
    introMessage: "Скажи рівно: Я тут.",
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
`transport: "chrome-node"`, коли Chrome працює на з’єднаному вузлі, наприклад у Parallels
VM. В обох випадках модель реального часу та `openclaw_agent_consult` працюють на
хості Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сесії або перевірити ID сесії. Використовуйте
`action: "speak"` із `sessionId` і `message`, щоб агент реального часу
почав говорити негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сесію,
запустити відому фразу та повернути стан `inCall`, якщо хост Chrome може
його повідомити. Використовуйте `action: "leave"`, щоб позначити сесію завершеною.

`status` включає стан Chrome, коли він доступний:

- `inCall`: Chrome, імовірно, перебуває всередині дзвінка Meet
- `micMuted`: найкраща спроба визначити стан мікрофона Meet
- `providerConnected` / `realtimeReady`: стан моста голосу реального часу
- `lastInputAt` / `lastOutputAt`: час останнього аудіо, отриманого мостом або надісланого до нього

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Скажи рівно: Я тут і слухаю."
}
```

## Консультація агента реального часу

Режим реального часу Chrome оптимізовано для живого голосового циклу. Провайдер голосу
реального часу чує аудіо зустрічі та говорить через налаштований аудіоміст.
Коли моделі реального часу потрібні глибші міркування, актуальна інформація або звичайні
інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації у фоновому режимі запускає звичайного агента OpenClaw з недавнім
контекстом транскрипту зустрічі та повертає стислу усну відповідь до сесії
голосу реального часу. Потім голосова модель може озвучити цю відповідь назад у зустріч.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: надає інструмент консультації та обмежує звичайного агента
  інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: надає інструмент консультації та дозволяє звичайному агенту використовувати звичайну
  політику інструментів агента.
- `none`: не надає інструмент консультації моделі голосу реального часу.

Ключ сесії консультації має область дії на рівні сесії Meet, тому наступні виклики консультації
можуть повторно використовувати попередній контекст консультації протягом тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднався до дзвінка:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повної димової перевірки приєднання та мовлення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Примітки

Офіційний media API Google Meet орієнтований на прийом, тому мовлення в дзвінок Meet
усе ще потребує шляху учасника. Цей Plugin зберігає цю межу видимою:
Chrome відповідає за участь через браузер і локальну маршрутизацію аудіо; Twilio відповідає за
участь через телефонний набір.

Режим реального часу Chrome потребує одного з варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw володіє
  мостом моделі реального часу та передає аудіо 8 кГц G.711 mu-law між цими
  командами та вибраним провайдером голосу реального часу.
- `chrome.audioBridgeCommand`: зовнішня команда моста повністю керує локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого двобічного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв на кшталт Loopback. Один спільний
пристрій BlackHole може повертати аудіо інших учасників назад у дзвінок.

`googlemeet speak` запускає активний аудіоміст реального часу для сесії
Chrome. `googlemeet leave` зупиняє цей міст. Для сесій Twilio, делегованих через Plugin Voice Call,
`leave` також завершує базовий голосовий дзвінок.

## Пов’язані матеріали

- [Plugin Voice call](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення Plugin](/uk/plugins/building-plugins)
