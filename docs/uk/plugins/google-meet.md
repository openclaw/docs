---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio з типовими налаштуваннями голосу в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T09:19:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1673ac4adc9cf163194a340dd6e451d0e4d28bb62adeb126898298e62106d43
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Підтримка учасника Google Meet для OpenClaw.

Plugin є навмисно явним:

- Він приєднується лише до явного URL `https://meet.google.com/...`.
- Голос `realtime` є режимом за замовчуванням.
- Голос у реальному часі може повертатися до повного агента OpenClaw, коли потрібні глибші
  міркування або інструменти.
- Автентифікація починається з особистого Google OAuth або вже виконаного входу в профіль Chrome.
- Автоматичного оголошення згоди немає.
- Типовим аудіобекендом Chrome є `BlackHole 2ch`.
- Chrome може працювати локально або на підключеному вузлі хоста.
- Twilio приймає номер для дозвону та необов’язковий PIN або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших
  робочих процесів телеконференцій агентів.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте бекенд-провайдера голосу в реальному часі.
OpenAI використовується за замовчуванням; Google Gemini Live також працює з
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` установлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор
Homebrew вимагає перезавантаження, перш ніж macOS зробить пристрій доступним:

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

Chrome приєднується як профіль Chrome, у якому виконано вхід. У Meet виберіть `BlackHole 2ch` для
шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого двостороннього аудіо використовуйте
окремі віртуальні пристрої або граф на кшталт Loopback; одного пристрою BlackHole
достатньо для першого димового тесту, але може виникати луна.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM
лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім
запустіть хост вузла у VM. Один раз увімкніть вбудований Plugin у VM, щоб вузол
рекламував команду Chrome:

Що де запускається:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, провайдер
  реального часу та конфігурація Plugin Google Meet.
- Parallels macOS VM: OpenClaw CLI/хост вузла, Google Chrome, SoX, BlackHole 2ch,
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

Запустіть хост вузла у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це IP-адреса LAN і ви не використовуєте TLS, вузол відхиляє
незашифрований WebSocket, якщо ви явно не дозволите це для цієї довіреної приватної мережі:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це середовище процесу, а не
параметр `openclaw.json`. `openclaw node install` зберігає його в середовищі LaunchAgent,
коли він присутній у команді встановлення.

Схваліть вузол з хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить вузол і що він рекламує `googlemeet.chrome`:

```bash
openclaw nodes status
```

Спрямуйте Meet через цей вузол на хості Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Тепер приєднуйтеся як зазвичай з хоста Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

або попросіть агента використати інструмент `google_meet` з `transport: "chrome-node"`.

Якщо `chromeNode.node` пропущено, OpenClaw виконує автоматичний вибір лише тоді, коли рівно один
підключений вузол рекламує `googlemeet.chrome`. Якщо підключено кілька придатних вузлів,
установіть `chromeNode.node` на id вузла, відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  схваліть сполучення та переконайтеся, що `openclaw plugins enable google-meet` було виконано
  у VM. Також підтвердьте, що хост Gateway дозволяє команду вузла через
  `gateway.nodes.allowCommands: ["googlemeet.chrome"]`.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch`
  у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у Chrome всередині VM і підтвердьте, що цей
  профіль може вручну приєднатися до URL Meet.
- Немає аудіо: у Meet спрямуйте мікрофон/динамік через шлях віртуального аудіопристрою,
  який використовує OpenClaw; для чистого двостороннього аудіо використовуйте окремі віртуальні пристрої або маршрутизацію
  на кшталт Loopback.

## Примітки щодо встановлення

Типовий режим Chrome у реальному часі використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для роботи з аудіо. Plugin використовує її команди `rec` і `play`
  для типового аудіомоста 8 kHz G.711 mu-law.
- `blackhole-2ch`: віртуальний аудіодрайвер для macOS. Він створює аудіопристрій `BlackHole 2ch`,
  через який Chrome/Meet може маршрутизувати аудіо.

OpenClaw не постачає і не розповсюджує жоден із цих пакетів. У документації користувачам пропонується
встановлювати їх як залежності хоста через Homebrew. SoX ліцензовано як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole — GPL-3.0. Якщо ви збираєте
інсталятор або пристрій, який постачає BlackHole разом з OpenClaw, перегляньте
висхідні умови ліцензування BlackHole або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL Meet у Google Chrome і приєднується як профіль Chrome, у якому виконано вхід.
У macOS Plugin перед запуском перевіряє наявність `BlackHole 2ch`.
Якщо налаштовано, він також запускає команду перевірки стану аудіомоста та команду запуску
перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway;
використовуйте `chrome-node`, коли Chrome/аудіо працюють на підключеному вузлі, наприклад у Parallels
macOS VM.

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

Доступ до Google Meet Media API спочатку використовує особистий клієнт OAuth. Налаштуйте
`oauth.clientId` і, за потреби, `oauth.clientSecret`, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` з токеном оновлення. Вона використовує PKCE,
локальний callback на `http://localhost:8085/oauth2callback` і ручний
потік копіювання/вставлення з `--manual`.

Ці змінні середовища приймаються як резервні варіанти:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` або `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` або `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` або
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` або `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` або `GOOGLE_MEET_PREVIEW_ACK`

Визначте URL Meet, код або `spaces/{id}` через `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Перед роботою з медіа виконайте попередню перевірку:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш проєкт Cloud,
принципал OAuth і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для медіа API Meet.

## Конфігурація

Поширений шлях Chrome у реальному часі потребує лише ввімкненого Plugin, BlackHole, SoX
і ключа бекенд-провайдера голосу в реальному часі. OpenAI використовується за замовчуванням; установіть
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
- `chromeNode.node`: необов’язкові id/ім’я/IP вузла для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: команда SoX `rec`, що записує аудіо
  8 kHz G.711 mu-law у stdout
- `chrome.audioOutputCommand`: команда SoX `play`, що читає аудіо
  8 kHz G.711 mu-law із stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли міст реального часу
  підключається; установіть `""`, щоб приєднатися беззвучно

Необов’язкові перевизначення:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
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
`transport: "chrome-node"`, коли Chrome працює на підключеному вузлі, наприклад у Parallels
VM. В обох випадках модель реального часу та `openclaw_agent_consult` працюють на
хості Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сесії або перевірити ID сесії. Використовуйте
`action: "speak"` із `sessionId` і `message`, щоб агент реального часу
одразу заговорив. Використовуйте `action: "leave"`, щоб позначити сесію завершеною.

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Консультація агента в реальному часі

Режим Chrome у реальному часі оптимізовано для живого голосового циклу. Провайдер голосу
в реальному часі чує аудіо зустрічі й говорить через налаштований аудіоміст.
Коли моделі реального часу потрібні глибші міркування, актуальна інформація або звичайні
інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент consult запускає звичайного агента OpenClaw у фоновому режимі з контекстом
недавньої стенограми зустрічі та повертає стислу усну відповідь до голосової сесії
реального часу. Потім голосова модель може озвучити цю відповідь назад у зустріч.

`realtime.toolPolicy` керує запуском consult:

- `safe-read-only`: надавати інструмент consult і обмежувати звичайного агента
  інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: надавати інструмент consult і дозволяти звичайному агенту використовувати
  звичайну політику інструментів агента.
- `none`: не надавати інструмент consult голосовій моделі реального часу.

Ключ сесії consult обмежено однією сесією Meet, тому подальші виклики consult
можуть повторно використовувати попередній контекст consult протягом тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднався до дзвінка:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

## Примітки

Офіційний медіа API Google Meet орієнтований на отримання, тому для мовлення в дзвінок
Meet усе ще потрібен шлях участі учасника. Цей Plugin зберігає цю межу видимою:
Chrome відповідає за участь через браузер і локальну маршрутизацію аудіо; Twilio відповідає за
участь через телефонний дозвін.

Для режиму Chrome у реальному часі потрібно одне з такого:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує
  мостом моделі реального часу й передає аудіо 8 kHz G.711 mu-law між цими
  командами та вибраним провайдером голосу реального часу.
- `chrome.audioBridgeCommand`: зовнішня команда моста керує всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого двостороннього аудіо спрямовуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв на кшталт Loopback. Один спільний
пристрій BlackHole може повертати голоси інших учасників назад у дзвінок.

`googlemeet speak` запускає активний аудіоміст реального часу для сесії
Chrome. `googlemeet leave` зупиняє цей міст. Для сесій Twilio, делегованих
через Plugin Voice Call, `leave` також завершує пов’язаний голосовий дзвінок.

## Пов’язане

- [Plugin Voice call](/uk/plugins/voice-call)
- [Режим talk](/uk/nodes/talk)
- [Створення Plugin](/uk/plugins/building-plugins)
