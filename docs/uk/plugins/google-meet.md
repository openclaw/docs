---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до виклику Google Meet
    - Ви хочете, щоб агент OpenClaw створив нову зустріч у Google Meet
    - Ви налаштовуєте Chrome, Node Chrome або Twilio як транспорт Google Meet
summary: 'Plugin Google Meet: приєднання за явно вказаними URL-адресами Meet через Chrome або Twilio з типовими налаштуваннями голосової відповіді агента'
title: Плагін Google Meet
x-i18n:
    generated_at: "2026-07-16T18:16:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5a3a0d2675bdfaeaa869652593fd1931c3afdefe0ed95f13935dade976ff038c
    source_path: plugins/google-meet.md
    workflow: 16
---

Плагін `google-meet` приєднується до явних URL-адрес Meet від імені агента OpenClaw. Його можливості навмисно обмежені:

- Він приєднується лише до URL-адрес `https://meet.google.com/...`; він ніколи самостійно не телефонує на зустріч за знайденим номером телефону.
- `googlemeet create` може створити нову URL-адресу Meet через Google Meet API (або резервний варіант у браузері) і типово приєднатися до неї.
- Участь через Chrome використовує профіль Chrome із виконаним входом, за потреби на спареному вузлі. Участь через Twilio передбачає набір номера телефону з PIN-кодом/DTMF через [плагін голосових викликів](/uk/plugins/voice-call); безпосередньо набрати URL-адресу Meet він не може.
- `mode: "agent"` (типово) транскрибує мовлення учасників за допомогою постачальника послуг реального часу, спрямовує його налаштованому агенту OpenClaw і озвучує відповідь за допомогою звичайного TTS OpenClaw. `mode: "bidi"` дає змогу голосовій моделі реального часу відповідати безпосередньо. `mode: "transcribe"` приєднується лише для спостереження без голосових відповідей.
- Під час приєднання плагіна до виклику автоматичне оголошення про згоду не відтворюється.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших сценаріїв телеконференцій агента.

## Швидкий початок

Установіть локальні аудіозалежності, а потім задайте ключ постачальника послуг реального часу. OpenAI є типовим постачальником транскрибування для режиму `agent`; Google Gemini Live доступний як постачальник голосових послуг для режиму `bidi`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# потрібне лише тоді, коли realtime.voiceProvider має значення "google" для режиму bidi
export GEMINI_API_KEY=...
```

`blackhole-2ch` установлює віртуальний аудіопристрій `BlackHole 2ch`, через який Chrome спрямовує звук. Інсталятор Homebrew вимагає перезавантаження, перш ніж macOS зробить пристрій доступним:

```bash
sudo reboot
```

Після перезавантаження перевірте обидва компоненти:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Увімкніть плагін:

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

Перевірте налаштування, а потім приєднайтеся:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Вивід `setup` придатний для читання агентом і враховує режим та транспорт: він повідомляє про профіль Chrome, закріплення вузла, а для приєднань Chrome у реальному часі — про аудіоміст BlackHole/SoX і перевірку відкладеного вступу. Приєднання лише для спостереження пропускають передумови реального часу:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Коли налаштовано делегування Twilio, `setup` також повідомляє, чи готові `voice-call`, облікові дані Twilio та загальнодоступний Webhook. Вважайте будь-яку перевірку `ok: false` блокувальною для відповідного транспорту/режиму до приєднання агента. Використовуйте `--json` для машинозчитуваного виводу, а `--transport chrome|chrome-node|twilio` — для завчасної попередньої перевірки певного транспорту:

```bash
openclaw googlemeet setup --transport twilio
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

На хостах Gateway, відмінних від macOS, `google_meet` залишається доступним для дій з артефактами, календарем, налаштуванням, транскрибуванням, Twilio та `chrome-node`, але локальні голосові відповіді Chrome (`transport: "chrome"` із `mode: "agent"` або `"bidi"`) блокуються до потрапляння в аудіоміст, оскільки цей шлях наразі залежить від macOS `BlackHole 2ch`. Натомість використовуйте `mode: "transcribe"`, телефонне підключення через Twilio або хост macOS `chrome-node`.

### Створення зустрічі

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

`create` має два шляхи, зазначені в полі `source` результату:

- **`api`**: використовується, коли налаштовано облікові дані Google Meet OAuth. Детермінований; не залежить від стану інтерфейсу браузера.
- **`browser`**: використовується без облікових даних OAuth. OpenClaw відкриває `https://meet.google.com/new` на закріпленому вузлі Chrome і чекає, доки Google переспрямує на справжню URL-адресу з кодом зустрічі; у профілі OpenClaw Chrome на цьому вузлі вже має бути виконано вхід у Google. І приєднання, і створення повторно використовують наявну вкладку Meet (або вкладку з незавершеним `.../new` / запитом облікового запису Google), перш ніж відкрити нову; під час зіставлення вкладок ігноруються нешкідливі рядки запиту на кшталт `authuser`.

`create` типово приєднується та повертає `joined: true` разом із сеансом приєднання. Передайте `--no-join` (CLI) або `"join": false` (інструмент), щоб лише створити URL-адресу.

Для кімнат, створених через API, задайте явну політику доступу замість успадкування типових налаштувань облікового запису Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | Хто може приєднатися без запиту на допуск                              |
| --------------- | ------------------------------------------------------------------- |
| `OPEN`          | Будь-хто з URL-адресою Meet                                         |
| `TRUSTED`       | Довірені користувачі організації хоста, запрошені зовнішні користувачі та користувачі телефонного підключення |
| `RESTRICTED`    | Лише запрошені                                                      |

Це стосується лише кімнат, створених через API, тому OAuth має бути налаштовано. Якщо автентифікацію виконано до появи цієї опції, повторно запустіть `openclaw googlemeet auth login --json` після додавання області `meetings.space.settings` на екран згоди OAuth.

Якщо резервний варіант у браузері стикається з блокуванням через вхід у Google або дозволи Meet, інструмент повертає `manualActionRequired: true` із `manualActionReason`, `manualActionMessage` та `browser.nodeId`/`browser.targetId`/`browserUrl`. Повідомте це повідомлення й припиніть відкривати нові вкладки Meet, доки оператор не завершить дію в браузері.

### Приєднання лише для спостереження

Установіть `"mode": "transcribe"`, щоб пропустити дуплексний міст реального часу (без вимоги BlackHole/SoX і без голосових відповідей). Приєднання Chrome у режимі транскрибування також пропускають надання OpenClaw дозволу на мікрофон/камеру та шлях Meet **Use microphone**; якщо Meet показує проміжний екран вибору аудіо, автоматизація спочатку намагається вибрати **Continue without microphone**. Керовані транспорти Chrome у цьому режимі встановлюють спостерігач субтитрів Meet за принципом найкращих зусиль. `googlemeet status --json` і `googlemeet doctor` повідомляють `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` і хвіст `recentTranscript`.

Щоб отримати обмежену стенограму сеансу, прочитайте точну відстежувану вкладку Meet:

```bash
openclaw googlemeet transcript <session-id>
openclaw googlemeet transcript <session-id> --since <next-index> --json
```

Спостерігач зберігає на сторінці Meet щонайбільше 2,000 завершених рядків субтитрів. Видимий текст, що поступово доповнюється, залишається у хвості стану справності, доки рядок субтитрів не завершиться, тому збереження `nextIndex` не може пропустити пізніше розширення тексту; вихід завершує видимі рядки перед створенням знімка. `droppedLines` повідомляє про рядки, утрачені з початку після перевищення обмеження. Стенограми чотирьох останніх завершених сеансів залишаються доступними для читання до перезапуску Gateway. Старіші завершені стенограми повертають `evicted: true`. Це навмисно пам’ять середовища виконання, а не постійне сховище історії зустрічей: перезапуск Gateway, закриття вкладки до створення знімка або перевищення задокументованих обмежень може призвести до втрати субтитрів.

Для перевірки прослуховування з відповіддю «так/ні»:

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

Команда приєднується в режимі транскрибування, очікує нового руху субтитрів/стенограми та повертає `listenVerified`, `listenTimedOut`, поля ручних дій і поточний стан субтитрів.

### Стан сеансу реального часу

Під час сеансів із голосовими відповідями стан `google_meet` повідомляє про справність Chrome/аудіомоста: `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, часові позначки останнього вводу/виводу, лічильники байтів і стан закриття моста. Керовані сеанси Chrome озвучують вступну/тестову фразу лише після того, як стан справності повідомить `inCall: true`; інакше `speechReady: false`, а спроба мовлення блокується замість непомітної бездіяльності.

Локальні приєднання Chrome відбуваються через профіль браузера OpenClaw із виконаним входом і потребують `BlackHole 2ch` для шляху мікрофона/динаміка. Одного пристрою BlackHole достатньо для першої базової перевірки, але він може створювати відлуння; для чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback.

## Локальний Gateway + Chrome у Parallels

Повноцінний Gateway або ключ API моделі не потрібні всередині віртуальної машини macOS, якщо вона лише надає Chrome. Запускайте Gateway і агента локально, а хост вузла — у віртуальній машині.

| Де запускається      | Що                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Хост Gateway         | OpenClaw Gateway, робочий простір агента, ключі моделі/API, постачальник послуг реального часу, конфігурація плагіна Google Meet |
| Віртуальна машина Parallels macOS | Хост CLI/вузла OpenClaw, Chrome, SoX, BlackHole 2ch, профіль Chrome із виконаним входом у Google |
| Не потрібно у віртуальній машині | Служба Gateway, конфігурація агента, налаштування постачальника моделі                         |

Установіть залежності у віртуальній машині, перезавантажте її та перевірте:

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Увімкніть плагін у віртуальній машині та запустіть хост вузла:

```bash
openclaw plugins enable google-meet
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це IP-адреса LAN без TLS, явно дозвольте використання цієї довіреної приватної мережі:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Використовуйте той самий прапорець під час установлення як LaunchAgent (це середовище процесу, яке за наявності в команді встановлення зберігається в середовищі LaunchAgent, а не налаштування `openclaw.json`):

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

Схваліть вузол із хоста Gateway, а потім переконайтеся, що він оголошує і `googlemeet.chrome`, і можливість браузера/`browser.proxy`:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Спрямуйте Meet через цей вузол:

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

Для базової перевірки однією командою, яка створює або повторно використовує сеанс, озвучує відому фразу та виводить стан сеансу:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання в реальному часі автоматизація браузера заповнює ім’я гостя, натискає Join/Ask to join і приймає запит Meet "Use microphone" під час першого запуску, якщо він з’являється (або "Continue without microphone" під час приєднання лише для спостереження та створення зустрічі лише в браузері). Якщо в профілі не виконано вхід, Meet очікує допуску від хоста, Chrome потребує дозволу на мікрофон/камеру або Meet застряг на невирішеному запиті, результат повідомляє `manualActionRequired: true` із `manualActionReason` і `manualActionMessage`. Припиніть повторні спроби, повідомте це повідомлення разом із `browserUrl`/`browserTitle` і повторіть спробу лише після завершення ручної дії.

Якщо `chromeNode.node` не вказано, OpenClaw автоматично вибирає вузол лише тоді, коли рівно один підключений вузол заявляє про підтримку і `googlemeet.chrome`, і керування браузером; зафіксуйте `chromeNode.node` (ідентифікатор вузла, відображуване ім’я або віддалену IP-адресу), коли підключено кілька придатних вузлів.

### Перевірки поширених помилок

| Симптом                                                  | Виправлення                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Configured Google Meet node ... is not usable: offline` | Зафіксований вузол відомий, але недоступний. Повідомте про перешкоду в налаштуванні; не переходьте без запиту непомітно на інший транспорт.                                                                                                                                    |
| `No connected Google Meet-capable node`                  | Запустіть `openclaw node run` у віртуальній машині, схваліть сполучення, а потім запустіть там `openclaw plugins enable google-meet` і `openclaw plugins enable browser`. Переконайтеся, що `gateway.nodes.allowCommands` містить `googlemeet.chrome` і `browser.proxy`.                              |
| `BlackHole 2ch audio device not found`                   | Установіть `blackhole-2ch` на хості, який перевіряється, і перезавантажте його.                                                                                                                                                                                                       |
| `BlackHole 2ch audio device not found on the node`       | Установіть `blackhole-2ch` у віртуальній машині та перезавантажте її.                                                                                                                                                                                                                |
| Chrome відкривається, але не може приєднатися                             | Увійдіть у профіль браузера у віртуальній машині або залиште `chrome.guestName` заданим. Автоматичне приєднання гостьової системи використовує автоматизацію браузера OpenClaw через браузерний проксі вузла; спрямуйте `browser.defaultProfile` вузла (або іменований профіль наявного сеансу) на потрібний профіль. |
| Дублікати вкладок Meet                                      | Залиште `chrome.reuseExistingTab: true`. OpenClaw активує наявну вкладку для тієї самої URL-адреси, а створення повторно використовує незавершену вкладку `.../new` або запиту облікового запису Google, перш ніж відкривати іншу.                                                                      |
| Немає звуку                                                 | Спрямуйте мікрофон і динамік Meet через віртуальний аудіотракт, який використовує OpenClaw; для чистого дуплексного звуку використовуйте окремі віртуальні пристрої або маршрутизацію на кшталт Loopback.                                                                                                              |

## Примітки щодо встановлення

Типова конфігурація зворотного аудіозв’язку Chrome використовує два зовнішні інструменти, які OpenClaw не постачає та не розповсюджує; установіть їх як залежності хоста через Homebrew:

- `sox`: утиліта командного рядка для роботи зі звуком. Plugin надсилає явні команди пристрою CoreAudio для типового аудіомоста PCM16 із частотою 24 кГц.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS, що надає пристрій `BlackHole 2ch`, через який проходить маршрут Chrome/Meet.

SoX ліцензовано за `LGPL-2.0-only AND GPL-2.0-only`; BlackHole — за GPL-3.0. Якщо ви створюєте інсталятор або готовий пристрій, що постачає BlackHole разом з OpenClaw, перевірте умови ліцензування BlackHole від розробника або отримайте окрему ліцензію від Existential Audio.

## Транспорти

| Транспорт     | Коли використовувати                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `chrome`      | Chrome і аудіо працюють на хості Gateway                                                        |
| `chrome-node` | Chrome і аудіо працюють на сполученому вузлі (наприклад, у віртуальній машині Parallels macOS)                        |
| `twilio`      | Резервне телефонне підключення через Plugin голосових викликів, коли участь через Chrome недоступна |

### Chrome

Відкриває URL-адресу Meet за допомогою керування браузером OpenClaw і приєднується через профіль браузера OpenClaw, у якому виконано вхід. У macOS Plugin перед запуском перевіряє наявність `BlackHole 2ch` і, якщо налаштовано, запускає команду перевірки справності або запуску аудіомоста перед відкриттям Chrome. Для локального Chrome виберіть профіль за допомогою `browser.defaultProfile`; натомість `chrome.browserProfile` передається хостам `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Аудіо мікрофона й динаміка Chrome проходить через локальний аудіоміст OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування замість приєднання без аудіотракту.

### Twilio

Строгий план набору, делегований [Plugin голосових викликів](/uk/plugins/voice-call). Він не аналізує сторінки Meet для пошуку телефонних номерів; Google Meet має надати для зустрічі номер телефонного підключення та PIN-код.

Увімкніть Voice Call на хості Gateway, а не на вузлі Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // або задайте "twilio", якщо Twilio має бути типовим
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Приєднайся до цієї зустрічі Google Meet як агент OpenClaw. Відповідай стисло.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                silenceDurationMs: 500,
                startSensitivity: "high",
              },
            },
          },
        },
      },
      google: {
        enabled: true,
      },
    },
  },
}
```

Надайте облікові дані Twilio через середовище, щоб не зберігати секрети в `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Якщо постачальником голосового зв’язку в реальному часі є OpenAI, натомість використовуйте `realtime.provider: "openai"` разом із `OPENAI_API_KEY`.

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни конфігурації Plugin не набудуть чинності до перезавантаження. Перевірте:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Коли делегування Twilio підключено, `googlemeet setup` містить перевірки `twilio-voice-call-plugin`, `twilio-voice-call-credentials` і `twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Для спеціальної послідовності використовуйте `--dtmf-sequence`, додаючи на початку `w` або коми для паузи перед PIN-кодом:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth і попередня перевірка

OAuth необов’язковий для створення посилання Meet, оскільки `googlemeet create` може використати автоматизацію браузера як резервний варіант. Налаштуйте OAuth для офіційного створення через API, визначення простору або попередньої перевірки Meet Media API. Приєднання через Chrome/Chrome-node ніколи не залежать від OAuth; вони в будь-якому разі використовують профіль Chrome, у якому виконано вхід, BlackHole/SoX і (для `chrome-node`) підключений вузол.

### Створення облікових даних Google

У Google Cloud Console:

<Steps>
<Step title="Створіть або виберіть проєкт">
</Step>
<Step title="Увімкніть Google Meet REST API">
</Step>
<Step title="Налаштуйте екран згоди OAuth">
Варіант Internal найпростіший для організації Google Workspace. Варіант External підходить для особистих або тестових конфігурацій; поки застосунок перебуває в режимі Testing, додайте кожен обліковий запис Google, який його авторизуватиме, як тестового користувача.
</Step>
<Step title="Додайте запитувані області доступу">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly` (пошук у календарі)
- `https://www.googleapis.com/auth/drive.meet.readonly` (експорт тексту документа з транскриптом або інтелектуальними нотатками)

</Step>
<Step title="Створіть ідентифікатор клієнта OAuth">
Тип застосунку **Web application**. Авторизована URI-адреса переспрямування:

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="Скопіюйте ідентифікатор клієнта та секрет клієнта">
</Step>
</Steps>

`meetings.space.created` потрібен для `spaces.create`. `meetings.space.readonly` зіставляє URL-адреси й коди Meet із просторами. `meetings.space.settings` дає OpenClaw змогу передавати параметри `SpaceConfig`, як-от `accessType`, під час створення кімнати через API. `meetings.conference.media.readonly` призначений для попередньої перевірки Meet Media API та роботи з медіа; для фактичного використання Media API Google може вимагати участі в Developer Preview. `calendar.events.readonly` потрібен лише для пошуку в календарі через `--today`/`--event`. `drive.meet.readonly` потрібен лише для експорту `--include-doc-bodies`. Якщо потрібні лише приєднання через Chrome на основі браузера, повністю пропустіть OAuth.

### Створення токена оновлення

Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret` (або передайте їх як змінні середовища), а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Ця команда запускає потік PKCE зі зворотним викликом localhost на `http://localhost:8085/oauth2callback` і виводить блок конфігурації `oauth` із токеном оновлення. Додайте `--manual` для потоку з копіюванням і вставленням, коли браузер не може отримати доступ до локального зворотного виклику:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

Виведення JSON:

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

Збережіть об’єкт `oauth` у конфігурації Plugin:

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

Надавайте перевагу змінним середовища, якщо не хочете зберігати токен оновлення в конфігурації; спочатку опрацьовується конфігурація, а потім як резервний варіант — середовище. Якщо автентифікацію виконано до появи підтримки створення зустрічей, пошуку в календарі або експорту тексту документа, повторно запустіть `openclaw googlemeet auth login --json`, щоб токен оновлення охоплював поточний набір областей доступу.

### Перевірка OAuth за допомогою doctor

```bash
openclaw googlemeet doctor --oauth --json
```

Ця команда перевіряє наявність конфігурації OAuth і можливість отримати токен доступу за допомогою токена оновлення, не завантажуючи середовище виконання Chrome і не вимагаючи підключеного вузла. Звіт містить лише поля стану (`ok`, `configured`, `tokenSource`, `expiresAt`, повідомлення перевірок) і ніколи не виводить токен доступу, токен оновлення або секрет клієнта.

| Перевірка                | Значення                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `oauth-config`       | Наявні `oauth.clientId` разом із `oauth.refreshToken` або кешований токен доступу |
| `oauth-token`        | Кешований токен доступу досі чинний або за допомогою токена оновлення отримано новий    |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` визначила наявний простір Meet                       |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий простір Meet                         |

Підтвердьте ввімкнення Meet API та область доступу `spaces.create` за допомогою перевірки створення, що має побічний ефект:

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

Підтвердьте доступ на читання до наявного простору:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`403` у цих перевірках зазвичай означає, що Meet REST API вимкнено, у токена оновлення немає потрібної області доступу або обліковий запис Google не має доступу до цього простору. Помилка токена оновлення означає, що потрібно повторно виконати `openclaw googlemeet auth login --json` і зберегти новий блок `oauth`.

Для резервного варіанта через браузер OAuth не потрібен; автентифікація Google у цьому випадку надходить із профілю Chrome, у який виконано вхід на вибраному Node, а не з конфігурації OpenClaw.

Як резервні варіанти приймаються такі змінні середовища:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` або `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` або `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` або `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` або `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` або `GOOGLE_MEET_PREVIEW_ACK`

### Визначення, попередня перевірка та читання артефактів

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Після того як Meet створить записи конференції:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

З `--meeting` команди `artifacts` та `attendance` типово використовують найновіший запис конференції; передайте `--all-conference-records` для кожного збереженого запису.

Пошук у календарі визначає URL зустрічі з Google Calendar перед читанням артефактів (потрібен токен оновлення, що містить область доступу лише для читання подій Calendar):

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` шукає в сьогоднішньому календарі `primary` подію з посиланням Meet; `--event <query>` шукає відповідний текст події; `--calendar <id>` націлюється на неосновний календар. `calendar-events` показує попередній перегляд відповідних подій і позначає, яку з них виберуть `latest`/`artifacts`/`attendance`/`export`.

Якщо ідентифікатор запису конференції вже відомий, зверніться до нього безпосередньо:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Закрийте кімнату для простору, створеного через API:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Викликає `spaces.endActiveConference` і потребує OAuth з областю доступу `meetings.space.created` для простору, яким може керувати авторизований обліковий запис. Приймає URL Meet, код зустрічі або `spaces/{id}` і спочатку визначає для нього ресурс простору API. Це окремо від `googlemeet leave`: `leave` припиняє локальну участь або участь у сеансі OpenClaw; `end-active-conference` просить Google Meet завершити активну конференцію для простору.

Створіть зручний для читання звіт:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` повертає метадані запису конференції, а також метадані ресурсів учасників, записів, транскриптів, структурованих записів транскрипту та розумних нотаток, коли Google їх надає. `--no-transcript-entries` пропускає пошук записів для великих зустрічей. `attendance` розгортає учасників у рядки сеансів учасників із часом першої та останньої появи, загальною тривалістю сеансу, ознаками запізнення або дочасного виходу та об’єднанням дублікатів ресурсів учасників за користувачем, який увійшов у систему, або відображуваним ім’ям; `--no-merge-duplicates` зберігає необроблені ресурси окремо, а `--late-after-minutes`/`--early-before-minutes` налаштовують порогові значення.

`export` записує папку з `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` та `manifest.json`. `manifest.json` фіксує вибрані вхідні дані, параметри експорту, записи конференції, вихідні файли, кількості, джерело токена, усі використані події Calendar і попередження про часткове отримання даних. `--zip` також записує переносний архів поруч із папкою. `--include-doc-bodies` експортує текст пов’язаних Google Docs із транскриптами та розумними нотатками через Drive `files.export` (потрібна область доступу Drive Meet лише для читання); без неї експорт містить лише метадані Meet і структуровані записи транскрипту. У разі часткової помилки артефакту (помилки отримання списку розумних нотаток, запису транскрипту або вмісту документа) попередження зберігається у зведенні або маніфесті замість завершення всього експорту з помилкою. `--dry-run` отримує ті самі дані та виводить JSON маніфесту без створення папки або ZIP-архіву.

Агенти використовують ті самі дії через інструмент `google_meet` (`export`, `create` з `accessType`, `end_active_conference`, `test_listen`); див. [Інструмент](#tool).

### Оперативна димова перевірка

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

| Змінна                                                                                                                  | Призначення                                                                |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `OPENCLAW_LIVE_TEST=1`                                                                                                    | Вмикає захищені оперативні перевірки                                             |
| `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`                                                                                       | Збережений URL Meet, код або `spaces/{id}`                              |
| `OPENCLAW_GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_ID`                                                                | Ідентифікатор клієнта OAuth                                                        |
| `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` / `GOOGLE_MEET_REFRESH_TOKEN`                                                        | Токен оновлення                                                          |
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` | Необов’язково; ті самі резервні назви без префікса `OPENCLAW_` також працюють |

Базова димова перевірка артефактів і відвідуваності потребує `meetings.space.readonly` та `meetings.conference.media.readonly`. Для пошуку в календарі потрібен `calendar.events.readonly`. Для експорту вмісту документів Drive потрібен `drive.meet.readonly`.

### Приклади створення

```bash
openclaw googlemeet create
```

Виводить URI нової зустрічі, джерело та сеанс приєднання. З OAuth використовується Meet API; без нього — профіль закріпленого Node Chrome, у який виконано вхід. JSON резервного варіанта через браузер:

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

Якщо резервний варіант через браузер спочатку натрапляє на вхід у Google або блокування дозволів Meet, `google_meet` повертає структуровані відомості замість простого рядка:

```json
{
  "source": "browser",
  "error": "google-login-required: Увійдіть у Google у профілі браузера OpenClaw, а потім повторіть створення зустрічі.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Увійдіть у Google у профілі браузера OpenClaw, а потім повторіть створення зустрічі.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Увійти — Облікові записи Google"
  }
}
```

JSON створення через API:

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

Після створення приєднання відбувається типово, але Chrome або Chrome-node все одно потребує профілю Google, у який виконано вхід, щоб приєднатися через браузер; якщо вхід не виконано, OpenClaw повідомляє `manualActionRequired: true` або помилку резервного варіанта через браузер і просить оператора завершити вхід у Google перед повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш хмарний проєкт, суб’єкт OAuth та учасники зустрічі зареєстровані в Google Workspace Developer Preview Program для медіа-API Meet.

## Конфігурація

Для спільного шляху агента Chrome потрібні лише ввімкнений plugin, BlackHole, SoX, ключ постачальника реального часу та налаштований постачальник TTS OpenClaw:

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

### Типові значення

| Ключ                               | Значення за замовчуванням                                  | Примітки                                                                                                                                                                                                             |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTransport`                | `"chrome"`                               |                                                                                                                                                                                                                   |
| `defaultMode`                     | `"agent"`                                | `"realtime"` приймається як застарілий псевдонім для `"agent"`; нові виклики мають використовувати `"agent"`                                                                                                                        |
| `chromeNode.node`                 | не задано                                    | Ідентифікатор/ім’я/IP-адреса Node для `chrome-node`; обов’язково, якщо може бути підключено кілька придатних вузлів                                                                                                                      |
| `chrome.launch`                   | `true`                                   | Запускає Chrome для приєднання; задавайте `false` лише в разі повторного використання вже відкритого сеансу                                                                                                                                 |
| `chrome.audioBackend`             | `"blackhole-2ch"`                        |                                                                                                                                                                                                                   |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | Відображається на екрані гостя Meet без виконаного входу                                                                                                                                                                         |
| `chrome.autoJoin`                 | `true`                                   | Спроба заповнити ім’я гостя та натиснути Join Now на `chrome-node` без гарантії успіху                                                                                                                                                   |
| `chrome.reuseExistingTab`         | `true`                                   | Активує наявну вкладку Meet замість відкриття дублікатів                                                                                                                                                      |
| `chrome.waitForInCallMs`          | `20000`                                  | Очікує, доки вкладка Meet повідомить про участь у виклику, перш ніж відтворити вступне повідомлення зворотного голосового зв’язку                                                                                                                                          |
| `chrome.audioFormat`              | `"pcm16-24khz"`                          | Формат аудіо для пари команд; `"g711-ulaw-8khz"` призначено лише для застарілих/власних пар команд, що виводять телефонне аудіо                                                                                                   |
| `chrome.audioBufferBytes`         | `4096`                                   | Буфер обробки SoX для згенерованих аудіокоманд пари команд (половина стандартного буфера SoX розміром 8192 байти, що зменшує затримку каналу); значення обмежуються мінімумом у 17 байтів                                         |
| `chrome.audioInputCommand`        | згенерована команда SoX                    | Читає з CoreAudio `BlackHole 2ch`, записує аудіо у форматі `chrome.audioFormat`                                                                                                                                        |
| `chrome.audioOutputCommand`       | згенерована команда SoX                    | Читає аудіо у форматі `chrome.audioFormat`, записує до CoreAudio `BlackHole 2ch`                                                                                                                                          |
| `chrome.bargeInInputCommand`      | не задано                                    | Необов’язкова команда локального мікрофона, що записує підписаний 16-бітний монофонічний PCM із порядком байтів від молодшого до старшого для виявлення втручання людини під час відтворення відповіді асистента; застосовується до розміщеного на Gateway мосту пар команд                          |
| `chrome.bargeInRmsThreshold`      | `650`                                    | Рівень RMS, що вважається втручанням людини                                                                                                                                                                           |
| `chrome.bargeInPeakThreshold`     | `2500`                                   | Піковий рівень, що вважається втручанням людини                                                                                                                                                                          |
| `chrome.bargeInCooldownMs`        | `900`                                    | Мінімальна затримка між повторними скиданнями через втручання                                                                                                                                                                |
| `mode` (для кожного запиту)              | `"agent"`                                | Режим зворотного голосового зв’язку; див. таблицю [Режими агента та двонапрямленого зв’язку](#agent-and-bidi-modes)                                                                                                                                       |
| `realtime.provider`               | `"openai"`                               | Резервний варіант сумісності, що використовується, коли поля з областю дії нижче не задано                                                                                                                                                |
| `realtime.transcriptionProvider`  | `"openai"`                               | Ідентифікатор провайдера, який режим `agent` використовує для транскрибування в реальному часі                                                                                                                                                       |
| `realtime.voiceProvider`          | не задано                                    | Ідентифікатор провайдера, який режим `bidi` використовує для безпосереднього голосового зв’язку в реальному часі; задайте `"google"` для Gemini Live, зберігши транскрибування в режимі агента через OpenAI. Поєднайте з `realtime.model`, щоб вибрати конкретну модель Gemini Live. |
| `realtime.toolPolicy`             | `"safe-read-only"`                       | Див. [Режими агента та двонапрямленого зв’язку](#agent-and-bidi-modes)                                                                                                                                                                 |
| `realtime.instructions`           | короткі інструкції щодо голосової відповіді          | Вказує моделі говорити стисло й використовувати `openclaw_agent_consult` для докладніших відповідей                                                                                                                              |
| `realtime.introMessage`           | `"Say exactly: I'm here and listening."` | Промовляється один раз після підключення мосту реального часу; задайте `""`, щоб приєднатися беззвучно                                                                                                                                       |
| `realtime.agentId`                | `"main"`                                 | Ідентифікатор агента OpenClaw, який використовується для `openclaw_agent_consult`                                                                                                                                                               |
| `voiceCall.enabled`               | `true`                                   | Делегує виклик Twilio PSTN, DTMF і вступне привітання Plugin Voice Call                                                                                                                                 |
| `voiceCall.dtmfDelayMs`           | `12000`                                  | Початкове очікування перед відтворенням через Twilio послідовності DTMF, отриманої з PIN-коду                                                                                                                                               |
| `voiceCall.postDtmfSpeechDelayMs` | `5000`                                   | Затримка перед запитом вступного привітання в реальному часі після того, як Voice Call запускає сегмент Twilio                                                                                                                        |

`chrome.audioBridgeCommand` і `chrome.audioBridgeHealthCommand` дають змогу зовнішньому мосту керувати всім локальним аудіотрактом замість `chrome.audioInputCommand`/`chrome.audioOutputCommand`; обмеження щодо режиму, у якому їх можна використовувати, див. у [Примітках](#notes).

Існує міграція `openclaw doctor --fix` для застарілої структури `realtime.provider: "google"`: вона переносить цей намір до `realtime.voiceProvider: "google"` разом із `realtime.transcriptionProvider: "openai"`, якщо ці поля ще не задано.

### Необов’язкові перевизначення

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
    model: "gemini-3.1-flash-live-preview",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Скажи дослівно: Я тут.",
    providers: {
      google: {
        speakerVoice: "Kore",
      },
    },
  },
}
```

ElevenLabs для прослуховування й озвучення в режимі агента:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        },
      },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        config: {
          realtime: {
            transcriptionProvider: "elevenlabs",
            providers: {
              elevenlabs: {
                modelId: "scribe_v2_realtime",
                audioFormat: "ulaw_8000",
                sampleRate: 8000,
                commitStrategy: "vad",
              },
            },
          },
        },
      },
    },
  },
}
```

Постійний голос Meet надходить із `messages.tts.providers.elevenlabs.speakerVoiceId`. Відповіді агента також можуть використовувати директиви `[[tts:speakerVoiceId=... model=eleven_v3]]` для кожної відповіді, коли перевизначення моделі TTS увімкнено, але конфігурація є детермінованим стандартним варіантом для зустрічей. Під час приєднання в журналах відображається `transcriptionProvider=elevenlabs`, а для кожної озвученої відповіді записується `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

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

З `voiceCall.enabled: true` (значенням за замовчуванням) і транспортом Twilio Voice Call вводить послідовність DTMF перед відкриттям медіапотоку реального часу, а потім використовує збережений текст вступу як початкове привітання в реальному часі. Якщо `voice-call` не ввімкнено, Google Meet усе одно може перевірити й записати план набору, але не може здійснити виклик Twilio.

Залиште `voiceCall.gatewayUrl` невстановленим, щоб використовувати локальне довірене середовище виконання Gateway, яке зберігає
агента-викликувача протягом усього виклику. Налаштована URL-адреса Gateway залишається явною ціллю WebSocket і
не може автентифікувати походження плагіна; приєднання агентів, відмінних від типового, завершується відмовою замість непомітного
використання іншого агента. Запускайте Google Meet і Voice Call в одному процесі Gateway, коли потрібна маршрутизація
за агентами.

## Інструмент

Агенти використовують інструмент `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

| `action`                | Призначення                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `join`                  | Приєднатися за явною URL-адресою Meet                                                                         |
| `create`                | Створити простір (і типово приєднатися); підтримує `accessType`/`entryPointAccess`                    |
| `status`                | Перелічити активні сеанси або переглянути один за `sessionId`                                               |
| `setup_status`          | Виконати ті самі перевірки, що й `googlemeet setup`                                                         |
| `resolve_space`         | Розв’язати URL-адресу/код/`spaces/{id}` через `spaces.get`                                                 |
| `preflight`             | Перевірити передумови OAuth і розв’язання зустрічі                                                 |
| `latest`                | Знайти найновіший запис конференції для зустрічі                                                   |
| `calendar_events`       | Попередньо переглянути події Calendar із посиланнями Meet                                                           |
| `artifacts`             | Перелічити записи конференцій і метадані учасників/записів/транскриптів/розумних нотаток                  |
| `attendance`            | Перелічити учасників і сеанси учасників                                                        |
| `export`                | Записати комплект артефактів/відвідуваності/транскрипту/маніфесту; установіть `"dryRun": true` лише для маніфесту |
| `recover_current_tab`   | Перевести фокус на наявну вкладку Meet або переглянути її, не відкриваючи нову                                      |
| `transcript`            | Прочитати обмежений транскрипт субтитрів; `sinceIndex` продовжує з попереднього `nextIndex`           |
| `leave`                 | Завершити сеанс (Chrome натискає Leave; закриває лише відкриті ним вкладки; Twilio завершує виклик)                  |
| `end_active_conference` | Завершити активну конференцію Google Meet для простору, керованого через API                                    |
| `speak`                 | Негайно наказати агенту реального часу промовити повідомлення, указавши `sessionId` і `message`                        |
| `test_speech`           | Створити/повторно використати сеанс, активувати відому фразу, повернути стан Chrome                              |
| `test_listen`           | Створити/повторно використати сеанс лише для спостереження, очікувати змін субтитрів/транскрипту                        |

`test_speech` завжди примусово встановлює `mode: "agent"` або `"bidi"` і завершується помилкою, якщо його просять працювати в `mode: "transcribe"`, оскільки сеанси лише для спостереження не можуть відтворювати мовлення. Його результат `speechOutputVerified` ґрунтується на збільшенні кількості вихідних аудіобайтів реального часу під час цього виклику, тому повторно використаний сеанс зі старішим аудіо не вважається новою перевіркою.

Для транспортів Chrome `leave` залишає повторно використану вкладку користувача відкритою після натискання кнопки завершення виклику Leave у Meet. Вкладки, відкриті OpenClaw, закриваються після виходу.

Використовуйте `transport: "chrome"`, коли Chrome працює на хості Gateway, і `transport: "chrome-node"`, коли він працює на спареному вузлі. В обох випадках постачальники моделей і `openclaw_agent_consult` працюють на хості Gateway, тому облікові дані моделей залишаються там. Журнали режиму агента містять визначені постачальника/модель транскрибування під час запуску мосту та постачальника/модель/голос/формат виведення/частоту дискретизації TTS після кожної синтезованої відповіді. Необроблений `mode: "realtime"` усе ще приймається як застарілий псевдонім сумісності для `mode: "agent"`, але більше не оголошується в переліку `mode` інструмента.

`create` із кімнатою на основі API та явною політикою доступу:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

Завершення активної конференції відомої кімнати:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Перевірка з початковим прослуховуванням, перш ніж вважати зустріч придатною:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Мовлення на вимогу:

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Скажи дослівно: я тут і слухаю."
}
```

`status` містить стан Chrome, коли він доступний:

| Поле                                                                 | Значення                                                                                                                |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inCall`                                                              | Схоже, Chrome перебуває у виклику Meet                                                                              |
| `micMuted`                                                            | Орієнтовний стан мікрофона Meet                                                                                      |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | Профіль браузера потребує ручного входу, допуску організатором Meet, дозволів або виправлення керування браузером, перш ніж мовлення запрацює |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | Чи дозволено зараз кероване мовлення Chrome; `speechReady: false` означає, що OpenClaw не надіслав вступну/тестову фразу   |
| `providerConnected` / `realtimeReady`                                 | Стан голосового мосту реального часу                                                                                            |
| `lastInputAt` / `lastOutputAt`                                        | Останнє аудіо, отримане від мосту/надіслане до нього                                                                                |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | Чи було медіавиведення вкладки Meet активно спрямовано на пристрій BlackHole мосту                               |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | Зворотний аудіовхід ігнорується під час відтворення відповіді асистента                                                              |

## Режими агента та bidi

| Режим    | Хто визначає відповідь        | Шлях виведення мовлення                     | Коли використовувати                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | Налаштований агент OpenClaw | Звичайне середовище виконання TTS OpenClaw            | Потрібна поведінка «мій агент перебуває на зустрічі»        |
| `bidi`  | Голосова модель реального часу      | Аудіовідповідь постачальника голосу реального часу | Потрібен голосовий діалоговий цикл із найменшою затримкою |

Режим `agent`: постачальник транскрибування реального часу отримує аудіо зустрічі, остаточні транскрипти учасників спрямовуються через налаштованого агента OpenClaw, а відповідь озвучується через звичайний TTS OpenClaw. Сусідні фрагменти остаточного транскрипту об’єднуються перед консультацією, щоб одна усна репліка не породжувала кілька застарілих часткових відповідей; вхід реального часу пригнічується, доки аудіо асистента в черзі ще відтворюється, а нещодавні відлуння транскрипту, схожі на мовлення асистента, ігноруються перед консультацією, щоб зворотний зв’язок BlackHole не змушував агента відповідати на власне мовлення.

Режим `bidi`: голосова модель реального часу відповідає безпосередньо й може викликати `openclaw_agent_consult` для глибшого міркування, актуальної інформації або звичайних інструментів OpenClaw. Інструмент консультації непомітно запускає звичайного агента OpenClaw із контекстом нещодавнього транскрипту зустрічі та повертає стислу усну відповідь; у режимі `agent` OpenClaw надсилає цю відповідь безпосередньо до TTS, у режимі `bidi` голосова модель реального часу може її озвучити. Він використовує той самий спільний механізм консультацій, що й Voice Call.

Типово консультації виконуються для агента `main`; установіть `realtime.agentId`, щоб спрямувати канал Meet на окремий робочий простір агента, типові параметри моделі, політику інструментів, пам’ять та історію сеансів. Консультації в режимі агента використовують окремий для кожної зустрічі ключ сеансу `agent:<id>:subagent:google-meet:<session>`, тому подальші запитання зберігають контекст зустрічі й водночас успадковують звичайну політику агента. Коли агент викликає `google_meet` у режимі агента, сеанс консультанта створює відгалуження поточного транскрипту агента-викликувача, перш ніж відповідати на мовлення учасника; сеанс Meet залишається окремим, тому подальші запитання зустрічі не змінюють транскрипт агента-викликувача безпосередньо.

`realtime.toolPolicy` керує виконанням консультації:

| Політика           | Поведінка                                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Надати інструмент консультації; обмежити звичайного агента інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get` |
| `owner`          | Надати інструмент консультації; дозволити звичайному агенту використовувати його звичайну політику інструментів                                                        |
| `none`           | Не надавати інструмент консультації голосовій моделі реального часу                                                                       |

Ключ сеансу консультації має область дії окремого сеансу Meet, тому наступні виклики консультації повторно використовують попередній контекст консультації під час тієї самої зустрічі.

Примусово виконайте голосову перевірку готовності після повного приєднання Chrome:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Повна димова перевірка приєднання та мовлення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Контрольний список перевірки в реальному середовищі

Перед передаванням зустрічі автономному агенту:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Очікуваний стан Chrome-node:

- `googlemeet setup` повністю зелений і містить `chrome-node-connected`, коли Chrome-node є типовим транспортом або закріплено вузол.
- `nodes status` показує, що вибраний вузол підключений і оголошує як `googlemeet.chrome`, так і `browser.proxy`.
- Вкладка Meet приєднується, а `test-speech` повертає стан Chrome з `inCall: true`.

Для віддаленого хоста Chrome, наприклад віртуальної машини macOS Parallels, найкоротша безпечна перевірка після оновлення Gateway або віртуальної машини:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Це підтверджує, що плагін Gateway завантажено, вузол віртуальної машини підключено з поточним токеном, а аудіоміст Meet доступний до того, як агент відкриє справжню вкладку зустрічі.

Для димової перевірки Twilio використовуйте зустріч, яка надає дані для приєднання телефоном:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Очікуваний стан Twilio:

- `googlemeet setup` містить зелені перевірки `twilio-voice-call-plugin`, `twilio-voice-call-credentials` і `twilio-voice-call-webhook`.
- `voicecall` доступний у CLI після перезавантаження Gateway.
- Повернений сеанс має `transport: "twilio"` і `twilio.voiceCallId`.
- `openclaw logs --follow` показує, що DTMF TwiML обслуговується перед TwiML реального часу, а потім створюється міст реального часу з початковим привітанням у черзі.
- `googlemeet leave <sessionId>` завершує делегований голосовий виклик.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Переконайтеся, що плагін увімкнено, і перезавантажте Gateway; запущений агент бачить лише інструменти плагінів, зареєстровані поточним процесом Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

На хостах Gateway не з macOS `google_meet` залишається видимим, але локальні дії зворотного передавання звуку Chrome блокуються до потрапляння в аудіоміст. Замість стандартного шляху локального агента Chrome використовуйте `mode: "transcribe"`, телефонне підключення Twilio або хост macOS `chrome-node`.

### Немає підключеного Node з підтримкою Google Meet

На хості Node:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

На хості Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node має бути підключений і містити в списку `googlemeet.chrome` та `browser.proxy`; конфігурація Gateway має дозволяти обидві команди:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Якщо `googlemeet setup` завершує `chrome-node-connected` невдало або журнал Gateway повідомляє `gateway token mismatch`, перевстановіть чи перезапустіть Node з поточним токеном Gateway:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Потім перезавантажте службу Node і повторно виконайте:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Браузер відкривається, але агент не може приєднатися

Запустіть `googlemeet test-listen` для приєднання лише в режимі спостереження або `googlemeet test-speech` для приєднання в реальному часі, а потім перевірте повернений стан Chrome. Якщо будь-яка з команд повідомляє `manualActionRequired: true`, покажіть оператору `manualActionMessage` і припиніть повторні спроби, доки дію в браузері не буде завершено.

Поширені ручні дії: увійти в профіль Chrome; допустити гостя з облікового запису організатора Meet; надати Chrome дозволи на мікрофон і камеру, коли з’явиться системний запит; закрити або виправити зависле діалогове вікно дозволів Meet.

Не повідомляйте «не виконано вхід» лише тому, що Meet запитує «Do you want people to hear you in the meeting?»; це проміжний екран Meet для вибору аудіо. OpenClaw натискає **Use microphone** за допомогою автоматизації браузера, коли це можливо, і продовжує очікувати фактичного стану зустрічі; для резервного браузерного створення без приєднання натомість може бути натиснуто **Continue without microphone**, оскільки для створення URL не потрібен шлях аудіо в реальному часі.

### Не вдається створити зустріч

`googlemeet create` використовує API Meet `spaces.create`, коли налаштовано OAuth, а інакше — браузер закріпленого Node Chrome. Перевірте:

- **Створення через API**: наявні `oauth.clientId` та `oauth.refreshToken` (або відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`), а токен оновлення створено після додавання підтримки створення; старішим токенам може бракувати `meetings.space.created`, тому повторно запустіть `openclaw googlemeet auth login --json`.
- **Резервний браузерний шлях**: `defaultTransport: "chrome-node"` і `chromeNode.node` вказують на підключений Node з `browser.proxy` та `googlemeet.chrome`; у профілі OpenClaw Chrome на цьому Node виконано вхід і він може відкрити `https://meet.google.com/new`.
- **Повторні спроби резервного браузерного шляху**: повторно використовуйте наявну вкладку `.../new` або вкладку із запитом облікового запису Google, перш ніж відкривати нову; повторіть виклик інструмента замість ручного відкриття іншої вкладки.
- **Ручна дія**: якщо інструмент повертає `manualActionRequired: true`, використовуйте `browser.nodeId`, `browser.targetId`, `browserUrl` і `manualActionMessage`, щоб надати оператору вказівки; не повторюйте спроби циклічно.
- **Проміжний екран вибору аудіо**: якщо Meet показує «Do you want people to hear you in the meeting?», залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або (лише для створення) **Continue without microphone** і продовжувати очікувати згенерований URL; якщо це не вдається, у помилці має згадуватися `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "agent"` для шляху STT -> агент OpenClaw -> TTS, а `mode: "bidi"` — для прямого резервного голосового зв’язку в реальному часі. `mode: "transcribe"` навмисно не запускає міст зворотного передавання звуку. Для налагодження лише в режимі спостереження запустіть `openclaw googlemeet status --json <session-id>` після того, як учасники заговорять, і перевірте `captioning`, `transcriptLines`, `lastCaptionText`. Якщо `inCall` має значення true, але `transcriptLines` залишається `0`, субтитри Meet може бути вимкнено, після встановлення спостерігача ніхто не говорив, інтерфейс Meet змінився або живі субтитри недоступні для мови чи облікового запису зустрічі.

`googlemeet test-speech` завжди перевіряє шлях реального часу й повідомляє, чи спостерігалися вихідні байти мосту для цього виклику. Якщо `speechOutputVerified` має значення false, а `speechOutputTimedOut` — true, постачальник реального часу міг прийняти висловлювання, але OpenClaw не виявив, що нові вихідні байти надійшли до аудіомосту Chrome.

Також перевірте: на хості Gateway доступний ключ постачальника реального часу (`OPENAI_API_KEY` або `GEMINI_API_KEY`); `BlackHole 2ch` видимий на хості Chrome; там існує `sox`; мікрофон і динамік Meet спрямовані через віртуальний аудіошлях (`doctor` має показувати `meet output routed: yes` для локальних приєднань Chrome у реальному часі).

`googlemeet doctor [session-id]` виводить сеанс, Node, стан виклику, причину ручної дії, підключення постачальника реального часу, `realtimeReady`, активність аудіовходу й аудіовиходу, часові позначки останнього аудіо, лічильники байтів і URL браузера. Використовуйте `googlemeet status [session-id] --json` для необробленого JSON, а `googlemeet doctor --oauth` (додайте `--meeting` або `--create-space`) — щоб перевірити оновлення OAuth без розкриття токенів.

Якщо час очікування агента минув, а вкладку Meet уже відкрито, перевірте її, не відкриваючи нову:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`: вона фокусує й перевіряє наявну вкладку Meet для вибраного транспорту (локальне керування браузером для `chrome`, налаштований Node для `chrome-node`), не відкриваючи нової вкладки чи сеансу, і повідомляє про поточну перешкоду (вхід, допуск, дозволи, стан вибору аудіо). Команда CLI взаємодіє з налаштованим Gateway, який має бути запущений; для `chrome-node` також потрібно, щоб Node був підключений.

### Перевірки налаштування Twilio завершуються невдало

`twilio-voice-call-plugin` завершується невдало, коли `voice-call` не дозволено або не ввімкнено: додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте Gateway.

`twilio-voice-call-credentials` завершується невдало, коли в бекенді Twilio відсутні SID облікового запису, токен автентифікації або номер абонента:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` завершується невдало, коли `voice-call` не має загальнодоступної адреси Webhook або `publicUrl` вказує на loopback чи простір приватної мережі. Не використовуйте `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` або `fd00::/8` як `publicUrl`; зворотні виклики оператора не можуть звернутися до них. Установіть для `plugins.entries.voice-call.config.publicUrl` загальнодоступний URL або налаштуйте доступ через тунель/Tailscale:

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

Для локальної розробки використовуйте тунель або доступ через Tailscale замість URL приватного хоста:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // або
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Перезапустіть або перезавантажте Gateway, а потім виконайте:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` за замовчуванням лише перевіряє готовність. Виконайте тестовий запуск для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише для навмисного здійснення реального вихідного виклику:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Виклик Twilio починається, але не переходить до зустрічі

Переконайтеся, що подія Meet містить відомості для телефонного підключення, і передайте точний номер підключення разом із PIN-кодом або власною послідовністю DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкові `w` або коми в `--dtmf-sequence` для паузи перед PIN-кодом.

Якщо виклик створено, але учасник, що підключається телефоном, так і не з’являється у списку Meet:

- `openclaw googlemeet doctor <session-id>`: перевірте ідентифікатор делегованого виклику Twilio, чи додано DTMF до черги та чи було запитано вступне привітання.
- `openclaw voicecall status --call-id <id>`: переконайтеся, що виклик досі активний.
- `openclaw voicecall tail`: переконайтеся, що вебхуки Twilio надходять до Gateway.
- `openclaw logs --follow`: знайдіть послідовність Twilio Meet: Google Meet делегує приєднання, Voice Call зберігає та обслуговує DTMF TwiML до підключення, Voice Call обслуговує TwiML реального часу для виклику Twilio, а потім Google Meet запитує вступне мовлення через `voicecall.speak`.
- Повторно запустіть `openclaw googlemeet setup --transport twilio`; успішна перевірка налаштування є обов’язковою, але не доводить правильності послідовності PIN-коду зустрічі.
- Переконайтеся, що номер телефонного підключення належить тому самому запрошенню Meet і регіону, що й PIN-код.
- Збільште `voiceCall.dtmfDelayMs` порівняно зі стандартним значенням 12 секунд, якщо Meet відповідає повільно або транскрипт виклику все ще показує запит PIN-коду після надсилання DTMF до підключення.
- Якщо учасник приєднується, але привітання не чути, перевірте `openclaw logs --follow` на наявність запиту `voicecall.speak` після DTMF і відтворення TTS через медіапотік або резервного варіанта Twilio `<Say>`. Якщо транскрипт усе ще показує «enter the meeting PIN», телефонне з’єднання ще не приєдналося до кімнати Meet, тому учасники не почують мовлення.

Якщо вебхуки не надходять, спочатку налагодьте плагін Voice Call: постачальник має мати доступ до `plugins.entries.voice-call.config.publicUrl` або налаштованого тунелю. Див. [усунення несправностей голосових викликів](/uk/plugins/voice-call#troubleshooting).

## Примітки

Офіційний API мультимедіа Google Meet орієнтований на отримання даних, тому для мовлення у виклику все одно потрібен шлях учасника. Цей плагін чітко зберігає цю межу: Chrome забезпечує участь через браузер і локальне спрямування аудіо; Twilio забезпечує участь через телефонне підключення.

Для режимів зворотного передавання звуку Chrome потрібен `BlackHole 2ch` і один із таких варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує мостом і передає аудіо в `chrome.audioFormat` між цими командами та вибраним провайдером. Режим `agent` використовує транскрибування в реальному часі разом зі звичайним TTS; режим `bidi` використовує провайдера голосового зв’язку в реальному часі. Типовий шлях — 24 кГц PCM16 із `chrome.audioBufferBytes: 4096`; 8 кГц G.711 mu-law залишається доступним для застарілих пар команд.
- `chrome.audioBridgeCommand`: зовнішня команда мосту керує всім локальним аудіотрактом і має завершити роботу після запуску або перевірки свого демона. Припустимо лише для `bidi`, оскільки режиму `agent` потрібен прямий доступ до пари команд для TTS.

З мостом Chrome на основі пари команд `chrome.bargeInInputCommand` може прослуховувати окремий локальний мікрофон і прибирати відтворення асистента, коли людина починає говорити, надаючи мовленню людини пріоритет над виведенням асистента, навіть коли спільний петльовий вхід BlackHole тимчасово приглушено під час відтворення асистента. Як і `chrome.audioInputCommand`/`chrome.audioOutputCommand`, це локальна команда, яку налаштовує оператор: використовуйте явно вказаний довірений шлях до команди або список аргументів, але ніколи не використовуйте сценарій із недовіреного розташування.

Для чистого дуплексного аудіо спрямовуйте вихід Meet і мікрофон Meet через окремі віртуальні пристрої або граф віртуальних пристроїв на кшталт Loopback; один спільний пристрій BlackHole може повертати відлуння голосів інших учасників у виклик.

`googlemeet speak` запускає активний аудіоміст зворотного зв’язку для сеансу Chrome; `googlemeet leave` зупиняє його (а для сеансів Twilio, делегованих через Voice Call, завершує базовий виклик). Використовуйте `googlemeet end-active-conference`, щоб також закрити активну конференцію Google Meet для простору, керованого через API.

## Пов’язане

- [Plugin голосових викликів](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення плагінів](/uk/plugins/building-plugins)
