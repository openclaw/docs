---
read_when:
    - Вы хотите, чтобы агент OpenClaw присоединился к звонку Google Meet
    - Вы хотите, чтобы агент OpenClaw создал новый звонок Google Meet
    - Вы настраиваете Chrome, узел Chrome или Twilio как транспорт Google Meet
summary: 'Plugin Google Meet: подключение к явным URL Meet через Chrome или Twilio с настройками ответа агента по умолчанию'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-06-28T23:17:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e85d531897e3aeadf0ac718f82a7aac5ce73715e182e96ceba77cb76eff094c4
    source_path: plugins/google-meet.md
    workflow: 16
---

Поддержка участников Google Meet для OpenClaw — плагин намеренно работает явно:

- Он подключается только к явно указанному URL `https://meet.google.com/...`.
- Он может создать новое пространство Meet через Google Meet API, а затем подключиться к
  возвращенному URL.
- `agent` — режим обратной речи по умолчанию: транскрипция в реальном времени слушает,
  настроенный агент OpenClaw отвечает, а обычный OpenClaw TTS говорит в Meet.
- `bidi` остается доступным как резервный режим прямой голосовой модели реального времени.
- Агенты выбирают поведение подключения через `mode`: используйте `agent` для живого
  прослушивания/обратной речи, `bidi` для прямого резервного голоса реального времени или `transcribe`
  для подключения/управления браузером без моста обратной речи.
- Аутентификация начинается как личный Google OAuth или уже выполненный вход в профиль Chrome.
- Автоматического объявления о согласии нет.
- Аудиобэкенд Chrome по умолчанию — `BlackHole 2ch`.
- Chrome может работать локально или на сопряженном узловом хосте.
- Twilio принимает номер для дозвона плюс необязательный PIN или последовательность DTMF; он
  не может набрать URL Meet напрямую.
- Команда CLI — `googlemeet`; `meet` зарезервирована для более широких
  агентских рабочих процессов телеконференций.

## Быстрый старт

Установите локальные аудиозависимости и настройте провайдера транскрипции в реальном времени
плюс обычный OpenClaw TTS. OpenAI — провайдер транскрипции по умолчанию;
Google Gemini Live также работает как отдельный резервный голос `bidi` с
`realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` устанавливает виртуальное аудиоустройство `BlackHole 2ch`. Установщик
Homebrew требует перезагрузки, прежде чем macOS покажет устройство:

```bash
sudo reboot
```

После перезагрузки проверьте обе части:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Включите плагин:

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

Проверьте настройку:

```bash
openclaw googlemeet setup
```

Вывод настройки предназначен для чтения агентом и учитывает режим. Он сообщает профиль Chrome,
привязку узла и, для подключений Chrome в реальном времени, аудиомост BlackHole/SoX
и отложенные проверки вступления в реальном времени. Для подключений только для наблюдения проверьте тот же
транспорт с `--mode transcribe`; этот режим пропускает предварительные требования к аудио реального времени,
поскольку он не слушает через мост и не говорит через него:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Когда настроено делегирование Twilio, настройка также сообщает, готовы ли
плагин `voice-call`, учетные данные Twilio и публичная доступность Webhook.
Считайте любую проверку `ok: false` блокирующей для проверяемого транспорта и режима
перед тем, как просить агента подключиться. Используйте `openclaw googlemeet setup --json` для
скриптов или машиночитаемого вывода. Используйте `--transport chrome`,
`--transport chrome-node` или `--transport twilio`, чтобы предварительно проверить конкретный
транспорт до того, как агент попробует его использовать.

Для Twilio всегда предварительно проверяйте транспорт явно, когда транспорт по умолчанию —
Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Это выявляет отсутствующую связку `voice-call`, учетные данные Twilio или недоступную
экспозицию Webhook до того, как агент попытается набрать встречу.

Подключитесь к встрече:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Или позвольте агенту подключиться через инструмент `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Инструмент `google_meet` для агента остается доступным на хостах не под macOS для
артефактов, календаря, настройки, транскрибирования, Twilio и потоков `chrome-node`. Локальные
действия обратной речи Chrome там заблокированы, поскольку встроенный аудиопуть Chrome
сейчас зависит от macOS `BlackHole 2ch`. В Linux используйте `mode: "transcribe"`,
дозвон Twilio или хост macOS `chrome-node` для участия в Chrome с обратной речью.

Создайте новую встречу и подключитесь к ней:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Для комнат, созданных через API, используйте Google Meet `SpaceConfig.accessType`, когда хотите,
чтобы политика входа без запроса была задана явно, а не наследовалась из настроек учетной записи Google
по умолчанию:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` позволяет любому с URL Meet подключиться без запроса. `TRUSTED` позволяет
доверенным пользователям организации хоста, приглашенным внешним пользователям и пользователям дозвона
подключаться без запроса. `RESTRICTED` ограничивает вход без запроса приглашенными. Эти
настройки применяются только к официальному пути создания через Google Meet API, поэтому учетные данные
OAuth должны быть настроены.

Если вы аутентифицировали Google Meet до появления этой опции, повторно выполните
`openclaw googlemeet auth login --json` после добавления области
`meetings.space.settings` на экран согласия Google OAuth.

Создайте только URL без подключения:

```bash
openclaw googlemeet create --no-join
```

У `googlemeet create` два пути:

- Создание через API: используется, когда настроены учетные данные Google Meet OAuth. Это
  наиболее детерминированный путь, и он не зависит от состояния UI браузера.
- Резервный путь браузера: используется, когда учетные данные OAuth отсутствуют. OpenClaw использует
  закрепленный узел Chrome, открывает `https://meet.google.com/new`, ждет, пока Google
  перенаправит на реальный URL с кодом встречи, затем возвращает этот URL. Этот путь требует,
  чтобы профиль OpenClaw Chrome на узле уже был авторизован в Google.
  Автоматизация браузера обрабатывает собственный первый запрос Meet на доступ к микрофону; этот запрос
  не считается ошибкой входа Google.
  Потоки подключения и создания также пытаются повторно использовать существующую вкладку Meet перед открытием
  новой. Сопоставление игнорирует безвредные строки запроса URL, такие как `authuser`, поэтому
  повторная попытка агента должна сфокусировать уже открытую встречу вместо создания второй
  вкладки Chrome.

Вывод команды/инструмента включает поле `source` (`api` или `browser`), чтобы агенты
могли объяснить, какой путь был использован. `create` по умолчанию подключается к новой встрече и
возвращает `joined: true` плюс сессию подключения. Чтобы только выпустить URL, используйте
`create --no-join` в CLI или передайте `"join": false` инструменту.

Или скажите агенту: «Создай Google Meet, подключись к нему в режиме обратной речи агента
и отправь мне ссылку». Агент должен вызвать `google_meet` с
`action: "create"`, а затем поделиться возвращенным `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Для подключения только для наблюдения/управления браузером задайте `"mode": "transcribe"`. Это
не запускает дуплексный голосовой мост реального времени, не требует BlackHole или SoX
и не будет говорить обратно во встречу. Подключения Chrome в этом режиме также избегают
выдачи разрешения OpenClaw на микрофон/камеру и избегают пути Meet **Использовать
микрофон**. Если Meet показывает промежуточный выбор аудио, автоматизация пытается
путь без микрофона, а иначе сообщает о ручном действии вместо открытия
локального микрофона. В режиме transcribe управляемые транспорты Chrome также устанавливают
наблюдатель субтитров Meet по принципу максимальных усилий. `googlemeet status --json` и
`googlemeet doctor` показывают `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
и короткий хвост `recentTranscript`, чтобы операторы могли понять, подключился ли браузер
к звонку и производят ли субтитры Meet текст.
Используйте `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, когда
нужна проверка да/нет: он подключается в режиме transcribe, ждет свежего движения субтитров или
транскрипта и возвращает `listenVerified`, `listenTimedOut`, поля ручного
действия и последнее состояние субтитров.

Во время сессий реального времени статус `google_meet` включает состояние браузера и аудиомоста,
например `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, последние временные метки ввода/вывода,
счетчики байтов и закрытое состояние моста. Если появляется безопасный запрос страницы Meet,
автоматизация браузера обрабатывает его, когда может. Вход, допуск хостом и
запросы разрешений браузера/ОС сообщаются как ручное действие с причиной и
сообщением, которое агент должен передать. Управляемые сессии Chrome произносят вступление или
тестовую фразу только после того, как состояние браузера сообщает `inCall: true`; иначе статус сообщает
`speechReady: false`, а попытка речи блокируется вместо имитации того, что
агент говорил во встречу.

Локальные подключения Chrome проходят через авторизованный профиль браузера OpenClaw. Режим реального времени
требует `BlackHole 2ch` для пути микрофона/динамика, используемого OpenClaw. Для
чистого дуплексного аудио используйте отдельные виртуальные устройства или граф в стиле Loopback; одного
устройства BlackHole достаточно для первого smoke-теста, но оно может давать эхо.

### Локальный Gateway + Parallels Chrome

Вам **не** нужен полноценный OpenClaw Gateway или ключ API модели внутри VM macOS
только для того, чтобы VM владела Chrome. Запустите Gateway и агента локально, затем запустите
узловой хост в VM. Один раз включите встроенный плагин в VM, чтобы узел
объявлял команду Chrome:

Что где работает:

- Хост Gateway: OpenClaw Gateway, рабочая область агента, ключи модели/API, провайдер
  реального времени и конфиг плагина Google Meet.
- VM Parallels macOS: OpenClaw CLI/узловой хост, Google Chrome, SoX, BlackHole 2ch
  и профиль Chrome, авторизованный в Google.
- Не требуется в VM: сервис Gateway, конфиг агента, ключ OpenAI/GPT или настройка
  провайдера модели.

Установите зависимости VM:

```bash
brew install blackhole-2ch sox
```

Перезагрузите VM после установки BlackHole, чтобы macOS показала `BlackHole 2ch`:

```bash
sudo reboot
```

После перезагрузки проверьте, что VM видит аудиоустройство и команды SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Установите или обновите OpenClaw в VM, затем включите там встроенный плагин:

```bash
openclaw plugins enable google-meet
```

Запустите узловой хост в VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Если `<gateway-host>` — LAN IP и вы не используете TLS, узел отклоняет
незашифрованный WebSocket, пока вы явно не разрешите его для этой доверенной частной сети:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Используйте ту же переменную окружения при установке узла как LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — это окружение процесса, а не настройка
`openclaw.json`. `openclaw node install` сохраняет ее в окружении LaunchAgent,
когда она присутствует в команде установки.

Одобрите узел с хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Подтвердите, что Gateway видит узел и что он объявляет и `googlemeet.chrome`,
и возможность браузера/`browser.proxy`:

```bash
openclaw nodes status
```

Направьте Meet через этот узел на хосте Gateway:

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

Теперь подключайтесь обычным образом с хоста Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

или попросите агента использовать инструмент `google_meet` с `transport: "chrome-node"`.

Для smoke-теста одной командой, который создает или повторно использует сессию, произносит известную
фразу и печатает состояние сессии:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Во время подключения в реальном времени браузерная автоматизация OpenClaw заполняет имя гостя, нажимает
Join/Ask to join и принимает выбор первого запуска Meet "Use microphone", когда этот
запрос появляется. Во время подключения только для наблюдения или создания встречи только в браузере она
проходит тот же запрос без микрофона, когда такой выбор доступен.
Если профиль браузера не авторизован, Meet ожидает допуска от организатора,
Chrome требуется разрешение на микрофон/камеру для подключения в реальном времени, или Meet завис
на запросе, который автоматизация не смогла обработать, результат join/test-speech сообщает
`manualActionRequired: true` с `manualActionReason` и
`manualActionMessage`. Агенты должны прекратить повторять подключение, сообщить это точное
сообщение плюс текущие `browserUrl`/`browserTitle` и повторить попытку только после
завершения ручного действия в браузере.

Если `chromeNode.node` не указан, OpenClaw выбирает автоматически только когда ровно один
подключенный узел объявляет и `googlemeet.chrome`, и управление браузером. Если
подключено несколько подходящих узлов, задайте `chromeNode.node` как id узла,
отображаемое имя или удаленный IP.

Типовые проверки сбоев:

- `Configured Google Meet node ... is not usable: offline`: закрепленный узел
  известен Gateway, но недоступен. Агенты должны считать этот узел
  диагностическим состоянием, а не пригодным хостом Chrome, и сообщать о блокере настройки
  вместо перехода на другой транспорт, если пользователь не просил об этом.
- `No connected Google Meet-capable node`: запустите `openclaw node run` в VM,
  подтвердите сопряжение и убедитесь, что `openclaw plugins enable google-meet` и
  `openclaw plugins enable browser` были выполнены в VM. Также подтвердите, что
  хост Gateway разрешает обе команды узла через
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: установите `blackhole-2ch` на проверяемом хосте
  и перезагрузите его перед использованием локального аудио Chrome.
- `BlackHole 2ch audio device not found on the node`: установите `blackhole-2ch`
  в VM и перезагрузите VM.
- Chrome открывается, но не может подключиться: войдите в профиль браузера внутри VM или
  оставьте `chrome.guestName` заданным для гостевого подключения. Гостевое автоподключение использует
  браузерную автоматизацию OpenClaw через браузерный прокси узла; убедитесь, что конфигурация браузера узла
  указывает на нужный профиль, например
  `browser.defaultProfile: "user"` или именованный профиль существующей сессии.
- Дублирующиеся вкладки Meet: оставьте `chrome.reuseExistingTab: true` включенным. OpenClaw
  активирует существующую вкладку для того же URL Meet перед открытием новой, а
  создание встречи в браузере повторно использует выполняющуюся вкладку `https://meet.google.com/new`
  или вкладку запроса Google-аккаунта перед открытием другой.
- Нет аудио: в Meet направьте микрофон/динамик через путь виртуального аудиоустройства,
  используемый OpenClaw; используйте отдельные виртуальные устройства или маршрутизацию в стиле Loopback
  для чистого дуплексного аудио.

## Примечания по установке

По умолчанию обратная передача речи Chrome использует два внешних инструмента:

- `sox`: аудиоутилита командной строки. Plugin использует явные команды устройства CoreAudio
  для стандартного аудиомоста 24 kHz PCM16.
- `blackhole-2ch`: виртуальный аудиодрайвер macOS. Он создает аудиоустройство `BlackHole 2ch`,
  через которое Chrome/Meet могут маршрутизировать звук.

OpenClaw не включает и не распространяет ни один из этих пакетов. Документация просит пользователей
устанавливать их как зависимости хоста через Homebrew. SoX лицензирован как
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole — GPL-3.0. Если вы создаете
установщик или appliance, который включает BlackHole вместе с OpenClaw, проверьте
лицензионные условия BlackHole upstream или получите отдельную лицензию от Existential Audio.

## Транспорты

### Chrome

Транспорт Chrome открывает URL Meet через управление браузером OpenClaw и подключается
как авторизованный браузерный профиль OpenClaw. В macOS Plugin проверяет наличие
`BlackHole 2ch` перед запуском. Если настроено, он также выполняет команду проверки
состояния аудиомоста и команду запуска перед открытием Chrome. Используйте `chrome`, когда
Chrome/аудио находятся на хосте Gateway; используйте `chrome-node`, когда Chrome/аудио находятся
на сопряженном узле, например macOS VM в Parallels. Для локального Chrome выберите
профиль через `browser.defaultProfile`; `chrome.browserProfile` передается хостам
`chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Маршрутизируйте звук микрофона и динамика Chrome через локальный аудиомост OpenClaw.
Если `BlackHole 2ch` не установлен, подключение завершается ошибкой настройки
вместо тихого подключения без аудиопути.

### Twilio

Транспорт Twilio — строгий план набора, делегированный Plugin Voice Call. Он
не анализирует страницы Meet для поиска телефонных номеров.

Используйте его, когда участие через Chrome недоступно или нужен резервный телефонный
дозвон. Google Meet должен предоставлять телефонный номер дозвона и PIN для
встречи; OpenClaw не обнаруживает их на странице Meet.

Включите Plugin Voice Call на хосте Gateway, а не на узле Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
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
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Join this Google Meet as an OpenClaw agent. Be brief.",
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

Передайте учетные данные Twilio через окружение или конфигурацию. Окружение не дает
секретам попасть в `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Используйте вместо этого `realtime.provider: "openai"` с Plugin провайдера OpenAI и
`OPENAI_API_KEY`, если это ваш провайдер голоса в реальном времени.

Перезапустите или перезагрузите Gateway после включения `voice-call`; изменения конфигурации Plugin
не появляются в уже запущенном процессе Gateway до его перезагрузки.

Затем проверьте:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Когда делегирование Twilio подключено, `googlemeet setup` включает успешные проверки
`twilio-voice-call-plugin`, `twilio-voice-call-credentials` и
`twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Используйте `--dtmf-sequence`, когда встрече нужна пользовательская последовательность:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth и предварительная проверка

OAuth необязателен для создания ссылки Meet, потому что `googlemeet create` может
вернуться к автоматизации браузера. Настройте OAuth, когда вам нужно официальное создание через API,
разрешение пространств или предварительные проверки Meet Media API.

Доступ к Google Meet API использует пользовательский OAuth: создайте OAuth-клиент Google Cloud,
запросите необходимые области доступа, авторизуйте аккаунт Google, затем сохраните
полученный токен обновления в конфигурации Plugin Google Meet или передайте
переменные окружения `OPENCLAW_GOOGLE_MEET_*`.

OAuth не заменяет путь подключения через Chrome. Транспорты Chrome и Chrome-node
по-прежнему подключаются через профиль Chrome с выполненным входом, BlackHole/SoX и подключенный
узел, когда вы используете участие через браузер. OAuth нужен только для официального пути
Google Meet API: создавать пространства встреч, разрешать пространства и выполнять предварительные проверки
Meet Media API.

### Создайте учетные данные Google

В Google Cloud Console:

1. Создайте или выберите проект Google Cloud.
2. Включите **Google Meet REST API** для этого проекта.
3. Настройте экран согласия OAuth.
   - **Internal** проще всего для организации Google Workspace.
   - **External** подходит для личных/тестовых установок; пока приложение находится в Testing,
     добавьте каждый аккаунт Google, который будет авторизовывать приложение, как тестового пользователя.
4. Добавьте области доступа, которые запрашивает OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Создайте OAuth client ID.
   - Тип приложения: **Web application**.
   - Разрешенный URI перенаправления:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Скопируйте client ID и client secret.

`meetings.space.created` требуется Google Meet `spaces.create`.
`meetings.space.readonly` позволяет OpenClaw разрешать URL/коды Meet в пространства.
`meetings.space.settings` позволяет OpenClaw передавать настройки `SpaceConfig`, такие как
`accessType`, при создании комнаты через API.
`meetings.conference.media.readonly` предназначен для предварительных проверок Meet Media API и работы
с медиа; Google может требовать регистрацию в Developer Preview для фактического использования Media API.
Если вам нужны только подключения Chrome через браузер, полностью пропустите OAuth.

### Выпустите токен обновления

Настройте `oauth.clientId` и, при необходимости, `oauth.clientSecret`, или передайте их как
переменные окружения, затем выполните:

```bash
openclaw googlemeet auth login --json
```

Команда выводит блок конфигурации `oauth` с токеном обновления. Она использует PKCE,
локальный обратный вызов на `http://localhost:8085/oauth2callback` и ручной
поток копирования/вставки с `--manual`.

Примеры:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Используйте ручной режим, когда браузер не может открыть локальный обратный вызов:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

Вывод JSON включает:

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

Сохраните объект `oauth` в конфигурации Plugin Google Meet:

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

Предпочитайте переменные окружения, если не хотите хранить токен обновления в конфигурации.
Если присутствуют и значения конфигурации, и значения окружения, Plugin сначала использует конфигурацию,
а затем резервно переходит к окружению.

Согласие OAuth включает создание пространств Meet, доступ на чтение пространств Meet и доступ
на чтение медиа конференций Meet. Если вы прошли аутентификацию до появления поддержки
создания встреч, повторно выполните `openclaw googlemeet auth login --json`, чтобы токен обновления
имел область доступа `meetings.space.created`.

### Проверьте OAuth с помощью doctor

Запустите OAuth doctor, когда нужна быстрая проверка состояния без секретов:

```bash
openclaw googlemeet doctor --oauth --json
```

Это не загружает среду выполнения Chrome и не требует подключенного узла Chrome. Команда
проверяет, что конфигурация OAuth существует и что токен обновления может выпустить токен доступа.
Отчет JSON включает только поля состояния, такие как `ok`, `configured`,
`tokenSource`, `expiresAt`, и сообщения проверок; он не выводит токен доступа,
токен обновления или client secret.

Распространенные результаты:

| Проверка             | Значение                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Присутствует `oauth.clientId` плюс `oauth.refreshToken` или кэшированный токен доступа. |
| `oauth-token`        | Кэшированный токен доступа всё ещё действителен, или токен обновления выпустил новый токен доступа. |
| `meet-spaces-get`    | Необязательная проверка `--meeting` разрешила существующее пространство Meet.            |
| `meet-spaces-create` | Необязательная проверка `--create-space` создала новое пространство Meet.                |

Чтобы также подтвердить включение Google Meet API и область доступа `spaces.create`, запустите
проверку создания с побочным эффектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` создаёт одноразовый URL Meet. Используйте его, когда нужно подтвердить,
что в проекте Google Cloud включён Meet API и что авторизованная
учётная запись имеет область доступа `meetings.space.created`.

Чтобы подтвердить доступ на чтение для существующего пространства встречи:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` и `resolve-space` подтверждают доступ на чтение к существующему
пространству, к которому авторизованная учётная запись Google имеет доступ. `403` от этих проверок
обычно означает, что Google Meet REST API отключён, в согласованном токене обновления
нет требуемой области доступа или учётная запись Google не может получить доступ к этому пространству
Meet. Ошибка токена обновления означает, что нужно повторно выполнить `openclaw googlemeet auth login
--json` и сохранить новый блок `oauth`.

Для резервного браузерного режима учётные данные OAuth не нужны. В этом режиме аутентификация Google
берётся из вошедшего в систему профиля Chrome на выбранном узле, а не из
конфигурации OpenClaw.

Эти переменные окружения принимаются как резервные варианты:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` или `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` или `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` или `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` или `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` или
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` или `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` или `GOOGLE_MEET_PREVIEW_ACK`

Разрешите URL Meet, код или `spaces/{id}` через `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Запустите предварительную проверку перед работой с медиа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Выведите список артефактов встречи и посещаемость после того, как Meet создаст записи конференции:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

С `--meeting` команды `artifacts` и `attendance` по умолчанию используют последнюю запись конференции.
Передайте `--all-conference-records`, если нужны все сохранённые записи
для этой встречи.

Поиск в календаре может разрешить URL встречи из Google Calendar перед чтением
артефактов Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` ищет в сегодняшнем календаре `primary` событие Calendar со ссылкой
Google Meet. Используйте `--event <query>` для поиска по совпадающему тексту события и
`--calendar <id>` для неосновного календаря. Для поиска в календаре требуется свежий
вход OAuth, включающий область доступа только для чтения событий Calendar.
`calendar-events` показывает предварительный список совпадающих событий Meet и помечает событие, которое
выберут `latest`, `artifacts`, `attendance` или `export`.

Если вы уже знаете идентификатор записи конференции, укажите его напрямую:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Завершите активную конференцию для пространства, созданного через API, когда нужно закрыть
комнату после звонка:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Это вызывает `spaces.endActiveConference` Google Meet и требует OAuth с областью доступа
`meetings.space.created` для пространства, которым авторизованная учётная запись может управлять.
OpenClaw принимает URL Meet, код встречи или ввод `spaces/{id}` и разрешает его
в ресурс пространства API перед завершением активной конференции.
Это отдельно от `googlemeet leave`: `leave` прекращает локальное/сессионное
участие OpenClaw, а `end-active-conference` просит Google Meet завершить активную
конференцию для пространства.

Запишите читаемый отчёт:

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

`artifacts` возвращает метаданные записи конференции плюс метаданные ресурсов участников,
записей, расшифровок, структурированных записей расшифровки и умных заметок, когда
Google предоставляет их для встречи. Используйте `--no-transcript-entries`, чтобы пропустить
поиск записей для больших встреч. `attendance` разворачивает участников в
строки сеансов участников с временем первого/последнего появления, общей длительностью сеанса,
флагами опоздания/раннего ухода и объединением дублирующихся ресурсов участников по вошедшему
пользователю или отображаемому имени. Передайте `--no-merge-duplicates`, чтобы оставить необработанные ресурсы
участников отдельно, `--late-after-minutes`, чтобы настроить определение опозданий, и
`--early-before-minutes`, чтобы настроить определение раннего ухода.

`export` записывает папку, содержащую `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` и `manifest.json`.
`manifest.json` фиксирует выбранный ввод, параметры экспорта, записи конференций,
выходные файлы, счётчики, источник токена, событие Calendar, если оно использовалось, и любые
предупреждения о частичном получении. Передайте `--zip`, чтобы также записать переносимый архив рядом
с папкой. Передайте `--include-doc-bodies`, чтобы экспортировать текст связанных расшифровок и
умных заметок Google Docs через Google Drive `files.export`; для этого требуется
свежий вход OAuth, включающий область доступа только для чтения Drive Meet. Без
`--include-doc-bodies` экспорт включает только метаданные Meet и структурированные записи расшифровки.
Если Google возвращает частичный сбой артефакта, например ошибку списка умных заметок,
записи расшифровки или тела документа Drive, сводка и
манифест сохраняют предупреждение вместо сбоя всего экспорта.
Используйте `--dry-run`, чтобы получить те же данные артефактов/посещаемости и вывести
JSON манифеста без создания папки или ZIP. Это полезно перед записью
большого экспорта или когда агенту нужны только счётчики, выбранные записи и
предупреждения.

Агенты также могут создать тот же пакет через инструмент `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Установите `"dryRun": true`, чтобы вернуть только манифест экспорта и пропустить запись файлов.

Агенты также могут создать комнату на базе API с явной политикой доступа:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

И они могут завершить активную конференцию для известной комнаты:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Для проверки сначала через прослушивание агенты должны использовать `test_listen`, прежде чем утверждать, что
встреча полезна:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Запустите защищённую live smoke-проверку на реальной сохранённой встрече:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Запустите live-браузерную пробу сначала через прослушивание на встрече, где кто-то будет
говорить и доступны субтитры Meet:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Окружение live smoke-проверки:

- `OPENCLAW_LIVE_TEST=1` включает защищённые live-тесты.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` указывает на сохранённый URL Meet, код или
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` или `GOOGLE_MEET_CLIENT_ID` предоставляет идентификатор клиента OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` или `GOOGLE_MEET_REFRESH_TOKEN` предоставляет
  токен обновления.
- Необязательно: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` и
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` используют те же резервные имена
  без префикса `OPENCLAW_`.

Базовой live smoke-проверке артефактов/посещаемости нужны
`https://www.googleapis.com/auth/meetings.space.readonly` и
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Для поиска в календаре нужен `https://www.googleapis.com/auth/calendar.events.readonly`. Для экспорта
тела документа Drive нужен
`https://www.googleapis.com/auth/drive.meet.readonly`.

Создайте свежее пространство Meet:

```bash
openclaw googlemeet create
```

Команда выводит новый `meeting uri`, источник и сеанс присоединения. С учётными данными OAuth
она использует официальный Google Meet API. Без учётных данных OAuth она
использует вошедший в систему браузерный профиль закреплённого узла Chrome как резервный вариант. Агенты могут
использовать инструмент `google_meet` с `action: "create"`, чтобы создать встречу и присоединиться за один
шаг. Для создания только URL передайте `"join": false`.

Пример JSON-вывода из резервного браузерного режима:

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

Если резервный браузерный режим сталкивается с входом в Google или блокировкой разрешений Meet до того, как
сможет создать URL, метод Gateway возвращает неуспешный ответ, а
инструмент `google_meet` возвращает структурированные сведения вместо простой строки:

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

Когда агент видит `manualActionRequired: true`, он должен сообщить
`manualActionMessage` плюс контекст браузерного узла/вкладки и прекратить открывать новые
вкладки Meet, пока оператор не выполнит браузерный шаг.

Пример JSON-вывода при создании через API:

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

Создание Meet по умолчанию выполняет подключение. Транспорт Chrome или Chrome-node по-прежнему
требует профиля Google Chrome с выполненным входом, чтобы подключиться через браузер. Если из
профиля выполнен выход, OpenClaw сообщает `manualActionRequired: true` или ошибку
резервного варианта браузера и просит оператора завершить вход в Google перед
повторной попыткой.

Задавайте `preview.enrollmentAcknowledged: true` только после подтверждения, что ваш Cloud
project, OAuth principal и участники встречи зарегистрированы в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфигурация

Обычному пути агента Chrome нужны только включенный Plugin, BlackHole, SoX, ключ
провайдера транскрипции в реальном времени и настроенный провайдер OpenClaw TTS.
OpenAI является провайдером транскрипции по умолчанию; задайте `realtime.voiceProvider` как
`"google"` и `realtime.model`, чтобы использовать Google Gemini Live для режима `bidi`
без изменения провайдера транскрипции по умолчанию для режима агента:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Задайте конфигурацию Plugin в `plugins.entries.google-meet.config`:

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

Значения по умолчанию:

- `defaultTransport: "chrome"`
- `defaultMode: "agent"` (`"realtime"` принимается только как устаревший
  псевдоним совместимости для `"agent"`; новые вызовы инструментов должны указывать `"agent"`)
- `chromeNode.node`: необязательный идентификатор/имя/IP узла для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: имя, используемое на экране гостя Meet
  без выполненного входа
- `chrome.autoJoin: true`: попытка заполнить имя гостя и нажать Join Now
  через браузерную автоматизацию OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активировать существующую вкладку Meet вместо
  открытия дубликатов
- `chrome.waitForInCallMs: 20000`: ждать, пока вкладка Meet сообщит, что находится в вызове,
  прежде чем будет запущено вступительное сообщение с обратной речью
- `chrome.audioFormat: "pcm16-24khz"`: аудиоформат пары команд. Используйте
  `"g711-ulaw-8khz"` только для устаревших/пользовательских пар команд, которые все еще выдают
  телефонийное аудио.
- `chrome.audioBufferBytes: 4096`: буфер обработки SoX для сгенерированных
  аудиокоманд пары команд Chrome. Это половина стандартного буфера SoX размером 8192 байта,
  что снижает стандартную задержку канала и оставляет возможность увеличить его на загруженных хостах.
  Значения ниже минимума SoX ограничиваются 17 байтами.
- `chrome.audioInputCommand`: команда SoX, читающая из CoreAudio `BlackHole 2ch`
  и записывающая аудио в `chrome.audioFormat`
- `chrome.audioOutputCommand`: команда SoX, читающая аудио в `chrome.audioFormat`
  и записывающая в CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: необязательная команда локального микрофона, которая записывает
  подписанный 16-битный little-endian моно PCM для обнаружения перебивания человеком, пока
  активно воспроизведение ассистента. Сейчас это применяется к размещенному в Gateway
  мосту пары команд `chrome`.
- `chrome.bargeInRmsThreshold: 650`: уровень RMS, который считается человеческим
  прерыванием на `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: пиковый уровень, который считается человеческим
  прерыванием на `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: минимальная задержка между повторными очистками
  человеческих прерываний
- `mode: "agent"`: режим обратной речи по умолчанию. Речь участников транскрибируется
  настроенным провайдером транскрипции в реальном времени, отправляется настроенному
  агенту OpenClaw в сессии подагента для конкретной встречи и проговаривается обратно через
  обычную среду выполнения OpenClaw TTS.
- `mode: "bidi"`: резервный режим прямой двунаправленной модели в реальном времени. Провайдер
  голоса в реальном времени отвечает на речь участников напрямую и может вызывать
  `openclaw_agent_consult` для более глубоких/поддерживаемых инструментами ответов.
- `mode: "transcribe"`: режим только наблюдения без моста обратной речи.
- `realtime.provider: "openai"`: резервный вариант совместимости, используемый, когда указанные ниже
  поля провайдера с областью действия не заданы.
- `realtime.transcriptionProvider: "openai"`: идентификатор провайдера, используемый режимом `agent`
  для транскрипции в реальном времени.
- `realtime.voiceProvider`: идентификатор провайдера, используемый режимом `bidi` для прямого
  голоса в реальном времени. Задайте его как `"google"`, чтобы использовать Gemini Live, сохранив
  транскрипцию в режиме агента на OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: краткие устные ответы с
  `openclaw_agent_consult` для более глубоких ответов
- `realtime.introMessage`: короткая устная проверка готовности при подключении моста в реальном времени;
  задайте `""`, чтобы подключаться беззвучно
- `realtime.agentId`: необязательный идентификатор агента OpenClaw для
  `openclaw_agent_consult`; по умолчанию `main`

Необязательные переопределения:

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
        speakerVoice: "Kore",
      },
    },
  },
}
```

ElevenLabs для прослушивания и озвучивания в режиме агента:

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

Постоянный голос Meet берется из
`messages.tts.providers.elevenlabs.speakerVoiceId`. Ответы агента также могут использовать
директивы для каждого ответа `[[tts:speakerVoiceId=... model=eleven_v3]]`, когда переопределения
модели TTS включены, но конфигурация является детерминированным значением по умолчанию для встреч.
При подключении журналы должны показывать `transcriptionProvider=elevenlabs`, а каждый
произнесенный ответ должен записывать `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

Конфигурация только для Twilio:

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

`voiceCall.enabled` по умолчанию имеет значение `true`; с транспортом Twilio он делегирует
фактический вызов PSTN, DTMF и вступительное приветствие Plugin Voice Call. Voice Call
воспроизводит последовательность DTMF перед открытием медиапотока в реальном времени, затем использует
сохраненный вступительный текст как начальное приветствие в реальном времени. Если `voice-call` не
включен, Google Meet все равно может проверить и записать план дозвона, но не может
разместить вызов Twilio.

## Инструмент

Агенты могут использовать инструмент `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Используйте `transport: "chrome"`, когда Chrome работает на хосте Gateway. Используйте
`transport: "chrome-node"`, когда Chrome работает на сопряженном узле, например на Parallels
VM. В обоих случаях провайдеры моделей и `openclaw_agent_consult` работают на хосте
Gateway, поэтому учетные данные модели остаются там. Со стандартным `mode: "agent"`
провайдер транскрипции в реальном времени обрабатывает прослушивание, настроенный агент OpenClaw
создает ответ, а обычный OpenClaw TTS произносит его в Meet. Используйте
`mode: "bidi"`, когда хотите, чтобы голосовая модель в реальном времени отвечала напрямую.
Сырой `mode: "realtime"` по-прежнему принимается как устаревший псевдоним совместимости для
`mode: "agent"`, но больше не рекламируется в схеме инструмента агента.
Журналы режима агента включают разрешенные провайдера/модель транскрипции при запуске моста,
а также провайдера TTS, модель, голос, формат вывода и частоту дискретизации после
каждого синтезированного ответа.

Используйте `action: "status"`, чтобы перечислить активные сессии или проверить идентификатор сессии. Используйте
`action: "speak"` с `sessionId` и `message`, чтобы агент в реальном времени
заговорил немедленно. Используйте `action: "test_speech"`, чтобы создать или повторно использовать сессию,
запустить известную фразу и вернуть состояние `inCall`, когда хост Chrome может
сообщить его. `test_speech` всегда принудительно задает `mode: "agent"` и завершается ошибкой, если его просят
работать в `mode: "transcribe"`, потому что сессии только наблюдения намеренно не могут
выводить речь. Его результат `speechOutputVerified` основан на увеличении байтов аудиовывода
в реальном времени во время этого тестового вызова, поэтому повторно используемая сессия со старым аудио
не считается свежей успешной проверкой речи. Используйте `action: "leave"`, чтобы пометить
сессию завершенной.

`status` включает состояние Chrome, когда оно доступно:

- `inCall`: Chrome, по-видимому, находится внутри вызова Meet
- `micMuted`: состояние микрофона Meet по мере возможности
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профилю
  браузера нужен ручной вход, допуск хостом Meet, разрешения или
  восстановление управления браузером, прежде чем речь сможет работать
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: разрешена ли
  управляемая речь Chrome сейчас. `speechReady: false` означает, что OpenClaw не
  отправил вступительную/тестовую фразу в аудиомост.
- `providerConnected` / `realtimeReady`: состояние голосового моста в реальном времени
- `lastInputAt` / `lastOutputAt`: последнее аудио, полученное из моста или отправленное в него
- `audioOutputRouted` / `audioOutputDeviceLabel`: был ли медиавывод вкладки Meet
  активно направлен на устройство BlackHole, используемое мостом
- `lastSuppressedInputAt` / `suppressedInputBytes`: ввод loopback, проигнорированный, пока
  активно воспроизведение ассистента

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Режимы агента и bidi

Режим Chrome `agent` оптимизирован для поведения «мой агент находится на встрече». Провайдер
транскрипции в реальном времени слышит аудио встречи, финальные транскрипты участников
передаются настроенному агенту OpenClaw, а ответ произносится через
обычную среду выполнения OpenClaw TTS. Задайте `mode: "bidi"`, когда хотите,
чтобы голосовая модель в реальном времени отвечала напрямую.
Близкие финальные фрагменты транскрипта объединяются перед консультацией, чтобы один устный
ход не создавал несколько устаревших частичных ответов. Ввод в реальном времени также
подавляется, пока аудио ассистента в очереди все еще воспроизводится,
а недавние похожие на ассистента эхо-фрагменты транскрипта игнорируются перед консультацией агента,
чтобы loopback BlackHole не заставлял агента отвечать на собственную речь.

| Режим   | Кто определяет ответ          | Путь вывода речи                         | Когда использовать                                      |
| ------- | ----------------------------- | ---------------------------------------- | ------------------------------------------------------- |
| `agent` | Настроенный агент OpenClaw    | Обычная среда выполнения OpenClaw TTS    | Нужное поведение: «мой агент находится на встрече»      |
| `bidi`  | Голосовая модель в реальном времени | Аудиоответ голосового провайдера в реальном времени | Нужен голосовой разговорный цикл с минимальной задержкой |

В режиме `bidi`, когда модели в реальном времени нужны более глубокие рассуждения, актуальная
информация или обычные инструменты OpenClaw, она может вызвать `openclaw_agent_consult`.

Инструмент consult запускает обычного агента OpenClaw за кулисами с контекстом недавней
расшифровки встречи и возвращает краткий устный ответ. В режиме `agent`
OpenClaw отправляет этот ответ напрямую в среду выполнения TTS; в режиме `bidi`
голосовая модель реального времени может произнести результат consult обратно на встрече. Он использует
тот же общий механизм consult, что и Voice Call.

По умолчанию consult запускается для агента `main`. Задайте `realtime.agentId`, когда
канал Meet должен обращаться к выделенному рабочему пространству агента OpenClaw, стандартным настройкам модели,
политике инструментов, памяти и истории сеанса.

Consult в режиме агента использует ключ сеанса вида `agent:<id>:subagent:google-meet:<session>`
для каждой встречи, чтобы последующие вопросы сохраняли контекст встречи и при этом наследовали обычную
политику агента от настроенного агента.

`realtime.toolPolicy` управляет запуском consult:

- `safe-read-only`: открыть инструмент consult и ограничить обычного агента
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` и
  `memory_get`.
- `owner`: открыть инструмент consult и разрешить обычному агенту использовать обычную
  политику инструментов агента.
- `none`: не открывать инструмент consult голосовой модели реального времени.

Ключ сеанса consult ограничен конкретным сеансом Meet, поэтому последующие вызовы consult
могут повторно использовать предыдущий контекст consult в рамках той же встречи.

Чтобы принудительно выполнить устную проверку готовности после того, как Chrome полностью присоединился к звонку:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для полного smoke-теста присоединения и произнесения:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Контрольный список live-теста

Используйте эту последовательность перед передачей встречи автономному агенту:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Ожидаемое состояние Chrome-node:

- `googlemeet setup` полностью зеленый.
- `googlemeet setup` включает `chrome-node-connected`, когда Chrome-node является
  транспортом по умолчанию или закреплен узел.
- `nodes status` показывает, что выбранный узел подключен.
- Выбранный узел объявляет и `googlemeet.chrome`, и `browser.proxy`.
- Вкладка Meet присоединяется к звонку, а `test-speech` возвращает состояние Chrome с
  `inCall: true`.

Для удаленного хоста Chrome, например Parallels macOS VM, это самая короткая
безопасная проверка после обновления Gateway или VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Это доказывает, что Plugin Gateway загружен, узел VM подключен с
текущим токеном, а аудиомост Meet доступен до того, как агент откроет
реальную вкладку встречи.

Для smoke-теста Twilio используйте встречу, которая предоставляет данные телефонного подключения:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Ожидаемое состояние Twilio:

- `googlemeet setup` включает зеленые проверки `twilio-voice-call-plugin`,
  `twilio-voice-call-credentials` и `twilio-voice-call-webhook`.
- `voicecall` доступен в CLI после перезагрузки Gateway.
- Возвращенный сеанс содержит `transport: "twilio"` и `twilio.voiceCallId`.
- `openclaw logs --follow` показывает, что DTMF TwiML отдан до realtime TwiML, затем
  мост реального времени с поставленным в очередь начальным приветствием.
- `googlemeet leave <sessionId>` завершает делегированный голосовой звонок.

## Устранение неполадок

### Агент не видит инструмент Google Meet

Убедитесь, что Plugin включен в конфигурации Gateway, и перезагрузите Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Если вы только что изменили `plugins.entries.google-meet`, перезапустите или перезагрузите Gateway.
Запущенный агент видит только инструменты Plugin, зарегистрированные текущим
процессом Gateway.

На хостах Gateway не под macOS агентский инструмент `google_meet` остается видимым,
но действия локального Chrome для обратной речи блокируются до попадания в аудиомост.
Локальная обратная речь Chrome сейчас зависит от macOS `BlackHole 2ch`, поэтому
агентам Linux следует использовать `mode: "transcribe"`, телефонный вход Twilio или хост macOS
`chrome-node` вместо стандартного пути локального агента Chrome.

### Нет подключенного узла с поддержкой Google Meet

На хосте узла выполните:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

На хосте Gateway одобрите узел и проверьте команды:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Узел должен быть подключен и перечислять `googlemeet.chrome` плюс `browser.proxy`.
Конфигурация Gateway должна разрешать эти команды узла:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Если `googlemeet setup` не проходит `chrome-node-connected` или журнал Gateway сообщает
`gateway token mismatch`, переустановите или перезапустите узел с текущим токеном Gateway.
Для LAN Gateway это обычно означает:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Затем перезагрузите службу узла и повторно выполните:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Браузер открывается, но агент не может присоединиться

Запустите `googlemeet test-listen` для присоединений только для наблюдения или `googlemeet test-speech`
для присоединений реального времени, затем изучите возвращенное состояние Chrome. Если любая из проверок
сообщает `manualActionRequired: true`, покажите `manualActionMessage` оператору
и прекратите повторять попытки, пока действие в браузере не будет завершено.

Распространенные ручные действия:

- Войти в профиль Chrome.
- Допустить гостя из аккаунта хоста Meet.
- Предоставить Chrome разрешения на микрофон/камеру, когда появится нативный запрос разрешений
  Chrome.
- Закрыть или исправить зависший диалог разрешений Meet.

Не сообщайте "not signed in" только потому, что Meet показывает "Do you want people to
hear you in the meeting?" Это промежуточный экран выбора аудио Meet; OpenClaw
нажимает **Use microphone** через автоматизацию браузера, когда это доступно, и продолжает
ждать реального состояния встречи. Для резервного создания только через браузер OpenClaw
может нажать **Continue without microphone**, потому что для создания URL не нужен
аудиопуть реального времени.

### Не удается создать встречу

`googlemeet create` сначала использует endpoint Google Meet API `spaces.create`,
когда настроены учетные данные OAuth. Без учетных данных OAuth он переключается
на браузер закрепленного узла Chrome. Проверьте:

- Для создания через API: настроены `oauth.clientId` и `oauth.refreshToken`,
  либо присутствуют соответствующие переменные окружения `OPENCLAW_GOOGLE_MEET_*`.
- Для создания через API: refresh token был выпущен после добавления поддержки создания.
  У старых токенов может отсутствовать scope `meetings.space.created`; повторно выполните
  `openclaw googlemeet auth login --json` и обновите конфигурацию Plugin.
- Для резервного браузерного варианта: `defaultTransport: "chrome-node"` и
  `chromeNode.node` указывают на подключенный узел с `browser.proxy` и
  `googlemeet.chrome`.
- Для резервного браузерного варианта: профиль OpenClaw Chrome на этом узле выполнен вход
  в Google и может открыть `https://meet.google.com/new`.
- Для резервного браузерного варианта: повторные попытки используют существующую вкладку
  `https://meet.google.com/new` или вкладку запроса аккаунта Google, прежде чем открыть новую вкладку. Если агент истекает по тайм-ауту,
  повторите вызов инструмента вместо ручного открытия другой вкладки Meet.
- Для резервного браузерного варианта: если инструмент возвращает `manualActionRequired: true`, используйте
  возвращенные `browser.nodeId`, `browser.targetId`, `browserUrl` и
  `manualActionMessage`, чтобы направить оператора. Не повторяйте попытки в цикле, пока это
  действие не будет завершено.
- Для резервного браузерного варианта: если Meet показывает "Do you want people to hear you in the
  meeting?", оставьте вкладку открытой. OpenClaw должен нажать **Use microphone** или, для
  резервного создания только через браузер, **Continue without microphone** через автоматизацию
  браузера и продолжить ждать сгенерированный URL Meet. Если он не может этого сделать, ошибка
  должна упоминать `meet-audio-choice-required`, а не `google-login-required`.

### Агент присоединяется, но не говорит

Проверьте путь реального времени:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Используйте `mode: "agent"` для обычного пути STT -> агент OpenClaw -> обратная речь TTS,
или `mode: "bidi"` для прямого резервного голосового пути реального времени. `mode: "transcribe"`
намеренно не запускает мост обратной речи. Для отладки только наблюдения
выполните `openclaw googlemeet status --json <session-id>` после того, как участники заговорят,
и проверьте `captioning`, `transcriptLines` и `lastCaptionText`. Если `inCall` равно
true, но `transcriptLines` остается `0`, субтитры Meet могут быть отключены, никто
не говорил после установки наблюдателя, UI Meet изменился, либо live
субтитры недоступны для языка/аккаунта встречи.

`googlemeet test-speech` всегда проверяет путь реального времени и сообщает, были ли
байты вывода моста замечены для этого вызова. Если `speechOutputVerified` равно false и
`speechOutputTimedOut` равно true, realtime-провайдер мог принять
высказывание, но OpenClaw не увидел, чтобы новые байты вывода дошли до аудиомоста
Chrome.

Также проверьте:

- Ключ realtime-провайдера доступен на хосте Gateway, например
  `OPENAI_API_KEY` или `GEMINI_API_KEY`.
- `BlackHole 2ch` видим на хосте Chrome.
- `sox` существует на хосте Chrome.
- Микрофон и динамик Meet маршрутизируются через виртуальный аудиопуть, используемый
  OpenClaw. `doctor` должен показывать `meet output routed: yes` для локальных
  присоединений Chrome в реальном времени.

`googlemeet doctor [session-id]` печатает сеанс, узел, состояние в звонке,
причину ручного действия, подключение realtime-провайдера, `realtimeReady`, активность
аудиовхода/выхода, последние временные метки аудио, счетчики байтов и URL браузера.
Используйте `googlemeet status [session-id] --json`, когда нужен сырой JSON. Используйте
`googlemeet doctor --oauth`, когда нужно проверить обновление OAuth Google Meet
без раскрытия токенов; добавьте `--meeting` или `--create-space`, когда также нужно
доказательство Google Meet API.

Если агент истек по тайм-ауту и вы видите уже открытую вкладку Meet, проверьте эту вкладку
без открытия новой:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Эквивалентное действие инструмента — `recover_current_tab`. Оно фокусирует и проверяет
существующую вкладку Meet для выбранного транспорта. С `chrome` оно использует локальное
управление браузером через Gateway; с `chrome-node` оно использует настроенный
узел Chrome. Оно не открывает новую вкладку и не создает новый сеанс; оно сообщает
текущий блокер, например вход, допуск, разрешения или состояние выбора аудио.
Команда CLI обращается к настроенному Gateway, поэтому Gateway должен быть запущен;
`chrome-node` также требует, чтобы узел Chrome был подключен.

### Проверки настройки Twilio не проходят

`twilio-voice-call-plugin` не проходит, когда `voice-call` не разрешен или не включен.
Добавьте его в `plugins.allow`, включите `plugins.entries.voice-call` и перезагрузите
Gateway.

`twilio-voice-call-credentials` не проходит, когда в бэкенде Twilio отсутствуют account
SID, auth token или номер вызывающего абонента. Задайте их на хосте Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` не проходит, когда у `voice-call` нет публичной экспозиции Webhook
или когда `publicUrl` указывает на loopback или пространство частной сети.
Задайте `plugins.entries.voice-call.config.publicUrl` на публичный URL провайдера или
настройте туннель/Tailscale-экспозицию `voice-call`.

Loopback и частные URL недопустимы для callback-ов операторов связи. Не используйте
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` или `fd00::/8` как `publicUrl`.

Для стабильного публичного URL:

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

Для локальной разработки используйте туннель или публикацию через Tailscale вместо URL
частного хоста:

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

Затем перезапустите или перезагрузите Gateway и выполните:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` по умолчанию только проверяет готовность. Чтобы выполнить пробный запуск для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Добавляйте `--yes` только если намеренно хотите совершить живой исходящий
уведомительный звонок:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Вызов Twilio начинается, но не попадает на встречу

Убедитесь, что событие Meet содержит сведения для телефонного подключения. Передайте точный номер
для дозвона и PIN или пользовательскую DTMF-последовательность:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Используйте начальные `w` или запятые в `--dtmf-sequence`, если провайдеру нужна пауза
перед вводом PIN.

Если телефонный вызов создан, но в списке участников Meet так и не появляется
участник, подключившийся по телефону:

- Выполните `openclaw googlemeet doctor <session-id>`, чтобы подтвердить делегированный Twilio
  call ID, проверить, была ли DTMF поставлена в очередь и был ли запрошен вступительный приветственный текст.
- Выполните `openclaw voicecall status --call-id <id>` и убедитесь, что вызов все еще
  активен.
- Выполните `openclaw voicecall tail` и проверьте, что Webhook Twilio поступают в
  Gateway.
- Выполните `openclaw logs --follow` и найдите последовательность Twilio Meet: Google
  Meet делегирует присоединение, Voice Call сохраняет и отдает TwiML DTMF перед подключением,
  Voice Call отдает realtime TwiML для вызова Twilio, затем Google Meet запрашивает
  вступительную речь через `voicecall.speak`.
- Повторно выполните `openclaw googlemeet setup --transport twilio`; зеленая проверка настройки
  обязательна, но она не доказывает, что последовательность PIN для встречи корректна.
- Убедитесь, что номер для дозвона относится к тому же приглашению Meet и тому же региону, что и
  PIN.
- Увеличьте `voiceCall.dtmfDelayMs` по сравнению со значением по умолчанию 12 секунд, если Meet отвечает
  медленно или расшифровка вызова все еще показывает запрос на ввод PIN после отправки
  DTMF перед подключением.
- Если участник присоединяется, но приветствие не слышно, проверьте
  `openclaw logs --follow` на наличие запроса `voicecall.speak` после DTMF и
  либо воспроизведения TTS через медиапоток, либо резервного Twilio `<Say>`. Если расшифровка вызова
  все еще содержит "enter the meeting PIN", телефонная линия еще не присоединилась
  к комнате Meet, поэтому участники встречи не услышат речь.

Если Webhook не поступают, сначала отлаживайте Plugin Voice Call: провайдер должен
достигать `plugins.entries.voice-call.config.publicUrl` или настроенного туннеля.
См. [устранение неполадок голосовых вызовов](/ru/plugins/voice-call#troubleshooting).

## Примечания

Официальный media API Google Meet ориентирован на прием, поэтому для речи в вызове Meet
по-прежнему нужен путь участника. Этот Plugin оставляет эту границу видимой:
Chrome обрабатывает участие через браузер и локальную маршрутизацию аудио; Twilio обрабатывает
участие через телефонный дозвон.

Для режимов обратной речи Chrome нужны `BlackHole 2ch` и один из вариантов:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw владеет
  мостом и передает аудио в `chrome.audioFormat` между этими командами и
  выбранным провайдером. Агентский режим использует realtime-транскрибацию плюс обычный TTS;
  режим bidi использует realtime голосового провайдера. Путь Chrome по умолчанию — 24 кГц
  PCM16 с `chrome.audioBufferBytes: 4096`; 8 кГц G.711 mu-law остается
  доступным для устаревших пар команд.
- `chrome.audioBridgeCommand`: внешняя команда моста владеет всем локальным
  аудиопутем и должна завершиться после запуска или проверки своего демона. Это допустимо только
  для `bidi`, потому что режиму `agent` нужен прямой доступ к паре команд для TTS.

Когда агент вызывает инструмент `google_meet` в режиме agent, сессия консультанта встречи
создает ответвление текущей расшифровки вызывающего перед ответом на речь участника.
Сессия Meet при этом остается отдельной (`agent:<agentId>:subagent:google-meet:<sessionId>`),
поэтому последующие действия встречи не изменяют напрямую расшифровку вызывающего.

Для чистого дуплексного аудио маршрутизируйте вывод Meet и микрофон Meet через отдельные
виртуальные устройства или граф виртуального устройства в стиле Loopback. Одно общее
устройство BlackHole может возвращать эхо других участников обратно в вызов.

С мостом Chrome на паре команд `chrome.bargeInInputCommand` может слушать
отдельный локальный микрофон и очищать воспроизведение ассистента, когда человек начинает
говорить. Это сохраняет приоритет человеческой речи над выводом ассистента, даже когда общий
loopback-вход BlackHole временно подавлен во время воспроизведения ассистента.
Как и `chrome.audioInputCommand` и `chrome.audioOutputCommand`, это
локальная команда, настроенная оператором. Используйте явный доверенный путь к команде или
список аргументов и не указывайте на скрипты из недоверенных расположений.

`googlemeet speak` запускает активный аудиомост обратной речи для сессии Chrome.
`googlemeet leave` останавливает этот мост. Для сессий Twilio, делегированных
через Plugin Voice Call, `leave` также завершает базовый голосовой вызов.
Используйте `googlemeet end-active-conference`, когда также нужно закрыть активную
конференцию Google Meet для пространства, управляемого API.

## Связанные материалы

- [Plugin голосовых вызовов](/ru/plugins/voice-call)
- [Режим разговора](/ru/nodes/talk)
- [Создание Plugins](/ru/plugins/building-plugins)
