---
read_when:
    - Вы хотите, чтобы агент OpenClaw присоединился к звонку в Google Meet
    - Вы хотите, чтобы агент OpenClaw создал новую встречу в Google Meet
    - Вы настраиваете Chrome, Node Chrome или Twilio в качестве транспорта Google Meet
summary: 'Плагин Google Meet: подключение по явно указанным URL Meet через Chrome или Twilio с настройками голосового ответа агента по умолчанию'
title: Плагин Google Meet
x-i18n:
    generated_at: "2026-07-13T18:29:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 5a3a0d2675bdfaeaa869652593fd1931c3afdefe0ed95f13935dade976ff038c
    source_path: plugins/google-meet.md
    workflow: 16
---

Плагин `google-meet` подключается к явно указанным URL Meet от имени агента OpenClaw. Его назначение намеренно ограничено:

- Он подключается только к URL `https://meet.google.com/...`; он никогда не звонит на встречу по номеру телефона, найденному самостоятельно.
- `googlemeet create` может создать новый URL Meet через API Google Meet (или резервный браузерный механизм) и по умолчанию подключиться к нему.
- Для участия через Chrome используется профиль Chrome с выполненным входом, при необходимости на сопряжённом узле. Для участия через Twilio выполняется звонок на номер телефона с последующим вводом PIN-кода/DTMF через [плагин голосовых вызовов](/ru/plugins/voice-call); напрямую вызвать URL Meet невозможно.
- `mode: "agent"` (по умолчанию) транскрибирует речь участников с помощью поставщика услуг реального времени, передаёт её настроенному агенту OpenClaw и озвучивает ответ с помощью обычного TTS OpenClaw. `mode: "bidi"` позволяет голосовой модели реального времени отвечать напрямую. `mode: "transcribe"` подключается только для наблюдения, без возможности ответа голосом.
- При подключении плагина к вызову автоматическое уведомление о согласии не воспроизводится.
- Команда CLI — `googlemeet`; `meet` зарезервирована для более общих сценариев телеконференций агента.

## Быстрый старт

Установите локальные аудиозависимости, затем задайте ключ поставщика услуг реального времени. OpenAI — поставщик транскрибирования по умолчанию для режима `agent`; Google Gemini Live доступен как поставщик голосовой связи в режиме `bidi`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# требуется только при realtime.voiceProvider со значением "google" в режиме bidi
export GEMINI_API_KEY=...
```

`blackhole-2ch` устанавливает виртуальное аудиоустройство `BlackHole 2ch`, через которое Chrome направляет звук. После установки через Homebrew необходимо перезагрузить систему, прежде чем macOS обнаружит устройство:

```bash
sudo reboot
```

После перезагрузки проверьте оба компонента:

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

Проверьте настройку, затем подключитесь:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Вывод `setup` предназначен для чтения агентом и учитывает режим и транспорт: он сообщает о профиле Chrome, закреплении узла, а для подключений Chrome в реальном времени — об аудиомосте BlackHole/SoX и проверке отложенного вступления. При подключении только для наблюдения предварительные требования режима реального времени пропускаются:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Если настроено делегирование Twilio, `setup` также сообщает о готовности `voice-call`, учётных данных Twilio и публичного доступа к Webhook. Любую проверку `ok: false` следует считать блокирующей для соответствующего транспорта/режима до подключения агента. Используйте `--json` для машиночитаемого вывода и `--transport chrome|chrome-node|twilio` для предварительной проверки конкретного транспорта:

```bash
openclaw googlemeet setup --transport twilio
```

Либо позвольте агенту подключиться через инструмент `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

На хостах Gateway, отличных от macOS, `google_meet` остаётся доступным для действий с артефактами, календарём, настройкой, транскрибированием, Twilio и `chrome-node`, однако локальный голосовой ответ через Chrome (`transport: "chrome"` с `mode: "agent"` или `"bidi"`) блокируется до обращения к аудиомосту, поскольку сейчас этот путь зависит от `BlackHole 2ch` в macOS. Вместо него используйте `mode: "transcribe"`, подключение по телефону через Twilio или хост `chrome-node` на macOS.

### Создание встречи

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

У `create` есть два пути, которые указываются в поле `source` результата:

- **`api`**: используется, когда настроены учётные данные OAuth для Google Meet. Детерминированный путь, не зависящий от состояния интерфейса браузера.
- **`browser`**: используется без учётных данных OAuth. OpenClaw открывает `https://meet.google.com/new` на закреплённом узле Chrome и ожидает перенаправления Google на реальный URL с кодом встречи; в профиле Chrome OpenClaw на этом узле уже должен быть выполнен вход в Google. При подключении и создании сначала повторно используется существующая вкладка Meet (либо вкладка с незавершённым запросом `.../new` / учётной записи Google), и только затем открывается новая; при сопоставлении вкладок игнорируются безвредные строки запроса, например `authuser`.

`create` по умолчанию подключается к встрече и возвращает `joined: true` вместе с сеансом подключения. Передайте `--no-join` (CLI) или `"join": false` (инструмент), чтобы только создать URL.

Для комнат, созданных через API, задайте явную политику доступа вместо наследования настройки по умолчанию учётной записи Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | Кто может подключиться без запроса доступа                          |
| --------------- | ------------------------------------------------------------------- |
| `OPEN`          | Любой пользователь с URL Meet                                      |
| `TRUSTED`       | Доверенные пользователи организации организатора, приглашённые внешние пользователи и участники, подключающиеся по телефону |
| `RESTRICTED`    | Только приглашённые                                                 |

Это применимо только к комнатам, созданным через API, поэтому необходимо настроить OAuth. Если вы прошли аутентификацию до появления этого параметра, повторно выполните `openclaw googlemeet auth login --json` после добавления области `meetings.space.settings` на экран согласия OAuth.

Если резервный браузерный механизм сталкивается со страницей входа Google или блокирующим запросом разрешений Meet, инструмент возвращает `manualActionRequired: true` с `manualActionReason`, `manualActionMessage` и `browser.nodeId`/`browser.targetId`/`browserUrl`. Сообщите это сообщение и не открывайте новые вкладки Meet, пока оператор не завершит действие в браузере.

### Подключение только для наблюдения

Задайте `"mode": "transcribe"`, чтобы пропустить дуплексный мост реального времени (BlackHole/SoX не требуются, голосовой ответ отсутствует). При подключениях Chrome в режиме транскрибирования также пропускаются предоставление OpenClaw разрешений на микрофон/камеру и путь Meet **Use microphone**; если Meet показывает промежуточный экран выбора звука, автоматизация сначала пытается выбрать **Continue without microphone**. Управляемые транспорты Chrome в этом режиме устанавливают наблюдатель субтитров Meet, работающий по мере возможности. `googlemeet status --json` и `googlemeet doctor` сообщают `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` и хвост `recentTranscript`.

Чтобы получить ограниченную по объёму транскрипцию сеанса, прочитайте точную отслеживаемую вкладку Meet:

```bash
openclaw googlemeet transcript <session-id>
openclaw googlemeet transcript <session-id> --since <next-index> --json
```

Наблюдатель хранит на странице Meet не более 2 000 завершённых строк субтитров. Отображаемый постепенно дополняемый текст остаётся в хвосте состояния работоспособности до завершения строки субтитров, поэтому сохранение `nextIndex` не может пропустить последующее расширение текста; при выходе отображаемые строки завершаются до создания снимка. `droppedLines` сообщает о строках, потерянных в начале при превышении ограничения. Транскрипции четырёх последних завершённых сеансов остаются доступными для чтения до перезапуска Gateway. Для более старых завершённых транскрипций возвращается `evicted: true`. Это намеренно хранится в памяти среды выполнения, а не в постоянном хранилище истории встреч: перезапуск Gateway, закрытие вкладки до создания снимка или превышение документированных ограничений могут привести к потере субтитров.

Для проверки наличия звука с ответом «да/нет»:

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

Команда подключается в режиме транскрибирования, ожидает нового изменения субтитров/транскрипции и возвращает `listenVerified`, `listenTimedOut`, поля ручного действия и текущее состояние субтитров.

### Состояние сеанса реального времени

Во время сеансов с голосовым ответом состояние `google_meet` сообщает о работоспособности Chrome/аудиомоста: `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, временные метки последнего ввода/вывода, счётчики байтов и состояние закрытия моста. Управляемые сеансы Chrome произносят вступительную/тестовую фразу только после того, как состояние работоспособности сообщает `inCall: true`; в противном случае `speechReady: false`, а попытка воспроизведения речи блокируется, а не игнорируется без уведомления.

Локальные подключения Chrome используют профиль браузера OpenClaw с выполненным входом и требуют `BlackHole 2ch` для пути микрофона/динамика. Для первой быстрой проверки достаточно одного устройства BlackHole, но оно может создавать эхо; для чистого дуплексного звука используйте отдельные виртуальные устройства или схему в стиле Loopback.

## Локальный Gateway + Chrome в Parallels

Для предоставления Chrome в виртуальной машине macOS не требуется запускать внутри неё полноценный Gateway или хранить там ключ API модели. Запустите Gateway и агента локально, а хост узла — в виртуальной машине.

| Где запускается      | Что                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Хост Gateway         | OpenClaw Gateway, рабочая область агента, ключи модели/API, поставщик услуг реального времени, конфигурация плагина Google Meet |
| ВМ Parallels macOS   | CLI/хост узла OpenClaw, Chrome, SoX, BlackHole 2ch, профиль Chrome с выполненным входом в Google |
| Не требуется в ВМ    | Служба Gateway, конфигурация агента, настройка поставщика модели                                 |

Установите зависимости в ВМ, перезагрузите её и выполните проверку:

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Включите плагин в ВМ и запустите хост узла:

```bash
openclaw plugins enable google-meet
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Если `<gateway-host>` — IP-адрес локальной сети без TLS, явно разрешите его для этой доверенной частной сети:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Используйте тот же флаг при установке в качестве LaunchAgent (это переменная окружения процесса, которая сохраняется в окружении LaunchAgent, если присутствует в команде установки, а не настройка `openclaw.json`):

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

Подтвердите узел на хосте Gateway, затем убедитесь, что он объявляет как `googlemeet.chrome`, так и возможность браузера/`browser.proxy`:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Направьте Meet через этот узел:

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

Теперь подключитесь обычным способом с хоста Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Для быстрой проверки одной командой, которая создаёт или повторно использует сеанс, произносит известную фразу и выводит состояние сеанса:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Во время подключения в реальном времени автоматизация браузера заполняет имя гостя, нажимает Join/Ask to join и принимает появляющийся при первом запуске запрос Meet "Use microphone" (или "Continue without microphone" при подключении только для наблюдения и создании встречи только через браузер). Если в профиле не выполнен вход, Meet ожидает допуска организатором, Chrome требуется разрешение на микрофон/камеру или Meet остановился на неразрешённом запросе, результат сообщает `manualActionRequired: true` с `manualActionReason` и `manualActionMessage`. Прекратите повторные попытки, сообщите это сообщение вместе с `browserUrl`/`browserTitle` и повторите попытку только после завершения ручного действия.

Если `chromeNode.node` не указан, OpenClaw выполняет автоматический выбор, только когда ровно один подключённый узел объявляет поддержку как `googlemeet.chrome`, так и управления браузером; если подключено несколько подходящих узлов, закрепите `chromeNode.node` (идентификатор узла, отображаемое имя или удалённый IP-адрес).

### Проверка распространённых сбоев

| Симптом                                                  | Решение                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Configured Google Meet node ... is not usable: offline` | Закреплённый узел известен, но недоступен. Сообщите о препятствии для настройки; не переходите автоматически на другой транспорт, если об этом не попросили.                                                                                                                                    |
| `No connected Google Meet-capable node`                  | Выполните `openclaw node run` в виртуальной машине, подтвердите сопряжение, затем выполните там `openclaw plugins enable google-meet` и `openclaw plugins enable browser`. Убедитесь, что `gateway.nodes.allowCommands` содержит `googlemeet.chrome` и `browser.proxy`.                              |
| `BlackHole 2ch audio device not found`                   | Установите `blackhole-2ch` на проверяемом хосте и перезагрузите его.                                                                                                                                                                                                       |
| `BlackHole 2ch audio device not found on the node`       | Установите `blackhole-2ch` в виртуальной машине и перезагрузите её.                                                                                                                                                                                                                |
| Chrome открывается, но не может присоединиться                             | Войдите в профиль браузера в виртуальной машине или оставьте `chrome.guestName` заданным. Автоматическое присоединение гостя использует автоматизацию браузера OpenClaw через браузерный прокси узла; направьте `browser.defaultProfile` узла (или именованный профиль существующего сеанса) на нужный профиль. |
| Дублирующиеся вкладки Meet                                      | Оставьте `chrome.reuseExistingTab: true`. OpenClaw активирует существующую вкладку с тем же URL-адресом, а при создании повторно использует незавершённую вкладку `.../new` или вкладку запроса учётной записи Google, прежде чем открыть новую.                                                                      |
| Нет звука                                                 | Направьте микрофон и динамик Meet через виртуальный аудиотракт, используемый OpenClaw; для чистого дуплексного звука применяйте отдельные виртуальные устройства или маршрутизацию в стиле Loopback.                                                                                                              |

## Примечания по установке

Стандартная конфигурация обратной передачи звука Chrome использует два внешних инструмента, которые OpenClaw не включает в комплект и не распространяет; установите их как зависимости хоста через Homebrew:

- `sox`: утилита командной строки для работы со звуком. Плагин выполняет явные команды для устройств CoreAudio, обеспечивающие стандартный аудиомост PCM16 с частотой 24 кГц.
- `blackhole-2ch`: виртуальный аудиодрайвер macOS, предоставляющий устройство `BlackHole 2ch`, через которое проходит маршрут Chrome/Meet.

SoX распространяется по лицензии `LGPL-2.0-only AND GPL-2.0-only`; BlackHole — по GPL-3.0. Если вы создаёте установщик или программно-аппаратный комплекс, включающий BlackHole вместе с OpenClaw, изучите условия лицензирования исходного проекта BlackHole или получите отдельную лицензию у Existential Audio.

## Транспорты

| Транспорт     | Когда использовать                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `chrome`      | Chrome и звук работают на хосте Gateway                                                        |
| `chrome-node` | Chrome и звук работают на сопряжённом узле (например, в виртуальной машине Parallels с macOS)                        |
| `twilio`      | Резервное подключение по телефону через плагин Voice Call, когда участие через Chrome недоступно |

### Chrome

Открывает URL-адрес Meet через управление браузером OpenClaw и присоединяется от имени профиля браузера OpenClaw, в котором выполнен вход. В macOS плагин перед запуском проверяет наличие `BlackHole 2ch` и, если настроено, выполняет команду проверки работоспособности или запуска аудиомоста перед открытием Chrome. Для локального Chrome выберите профиль с помощью `browser.defaultProfile`; вместо этого `chrome.browserProfile` передаётся хостам `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Звук микрофона и динамика Chrome проходит через локальный аудиомост OpenClaw. Если `BlackHole 2ch` не установлен, присоединение завершается ошибкой настройки, а не происходит без аудиотракта.

### Twilio

Строгий план набора номера, делегированный [плагину Voice Call](/ru/plugins/voice-call). Он не анализирует страницы Meet для поиска телефонных номеров; Google Meet должен предоставлять для встречи номер телефонного подключения и PIN-код.

Включите Voice Call на хосте Gateway, а не на узле Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // или задайте "twilio", если Twilio должен использоваться по умолчанию
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
            instructions: "Присоединитесь к этой встрече Google Meet в качестве агента OpenClaw. Отвечайте кратко.",
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

Передавайте учётные данные Twilio через переменные окружения, чтобы секреты не попадали в `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Если провайдером голосовой связи в реальном времени является OpenAI, используйте вместо этого `realtime.provider: "openai"` с `OPENAI_API_KEY`.

После включения `voice-call` перезапустите или перезагрузите Gateway; изменения конфигурации плагина не вступают в силу до перезагрузки. Проверьте:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Когда делегирование Twilio настроено, `googlemeet setup` включает проверки `twilio-voice-call-plugin`, `twilio-voice-call-credentials` и `twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Для пользовательской последовательности используйте `--dtmf-sequence`, добавив в начало `w` или запятые для паузы перед PIN-кодом:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth и предварительная проверка

OAuth необязателен для создания ссылки Meet, поскольку `googlemeet create` может переключиться на автоматизацию браузера. Настройте OAuth для создания через официальный API, разрешения пространства или предварительной проверки Meet Media API. Присоединение через Chrome/Chrome-node никогда не зависит от OAuth: в любом случае используются профиль Chrome, в котором выполнен вход, BlackHole/SoX и, для `chrome-node`, подключённый узел.

### Создание учётных данных Google

В Google Cloud Console:

<Steps>
<Step title="Создайте или выберите проект">
</Step>
<Step title="Включите Google Meet REST API">
</Step>
<Step title="Настройте экран согласия OAuth">
Вариант Internal проще всего для организации Google Workspace. Вариант External подходит для личных и тестовых конфигураций; пока приложение находится в режиме Testing, добавьте каждую учётную запись Google, которая будет выполнять авторизацию, в качестве тестового пользователя.
</Step>
<Step title="Добавьте необходимые области доступа">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly` (поиск в календаре)
- `https://www.googleapis.com/auth/drive.meet.readonly` (экспорт содержимого документа с расшифровкой или интеллектуальными заметками)

</Step>
<Step title="Создайте идентификатор клиента OAuth">
Тип приложения — **Web application**. Разрешённый URI перенаправления:

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="Скопируйте идентификатор клиента и секрет клиента">
</Step>
</Steps>

`meetings.space.created` требуется для `spaces.create`. `meetings.space.readonly` преобразует URL-адреса и коды Meet в пространства. `meetings.space.settings` позволяет OpenClaw передавать параметры `SpaceConfig`, например `accessType`, при создании комнаты через API. `meetings.conference.media.readonly` предназначен для предварительной проверки Meet Media API и работы с мультимедиа; для фактического использования Media API Google может потребовать участие в программе Developer Preview. `calendar.events.readonly` нужен только для поиска в календаре через `--today`/`--event`. `drive.meet.readonly` нужен только для экспорта `--include-doc-bodies`. Если вам требуется только присоединение через Chrome с помощью браузера, полностью пропустите OAuth.

### Получение токена обновления

Настройте `oauth.clientId` и при необходимости `oauth.clientSecret` (или передайте их как переменные окружения), затем выполните:

```bash
openclaw googlemeet auth login --json
```

Команда запускает поток PKCE с локальным обратным вызовом на `http://localhost:8085/oauth2callback` и выводит блок конфигурации `oauth` с токеном обновления. Добавьте `--manual` для потока с копированием и вставкой, когда браузер не может обратиться к локальному обратному вызову:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

Вывод JSON:

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

Сохраните объект `oauth` в конфигурации плагина:

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

Если вы не хотите хранить токен обновления в конфигурации, предпочитайте переменные окружения; сначала разрешаются значения из конфигурации, затем в качестве резервного варианта используются переменные окружения. Если вы проходили аутентификацию до появления поддержки создания встреч, поиска в календаре или экспорта содержимого документов, повторно выполните `openclaw googlemeet auth login --json`, чтобы токен обновления охватывал текущий набор областей доступа.

### Проверка OAuth с помощью doctor

```bash
openclaw googlemeet doctor --oauth --json
```

Эта команда проверяет наличие конфигурации OAuth и возможность получить токен доступа с помощью токена обновления, не загружая среду выполнения Chrome и не требуя подключённого узла. Отчёт содержит только поля состояния (`ok`, `configured`, `tokenSource`, `expiresAt`, сообщения проверок) и никогда не выводит токен доступа, токен обновления или секрет клиента.

| Проверка                | Значение                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `oauth-config`       | Присутствуют `oauth.clientId` вместе с `oauth.refreshToken` либо кэшированный токен доступа |
| `oauth-token`        | Кэшированный токен доступа всё ещё действителен либо с помощью токена обновления получен новый токен    |
| `meet-spaces-get`    | Необязательная проверка `--meeting` разрешила существующее пространство Meet                       |
| `meet-spaces-create` | Необязательная проверка `--create-space` создала новое пространство Meet                         |

Подтвердите включение Meet API и область доступа `spaces.create` с помощью проверки создания, имеющей побочный эффект:

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

Подтвердите доступ на чтение к существующему пространству:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Значение `403` в результатах этих проверок обычно означает, что REST API Meet отключён, в токене обновления отсутствует необходимая область доступа или аккаунт Google не имеет доступа к этому пространству. Ошибка токена обновления означает, что необходимо повторно выполнить `openclaw googlemeet auth login --json` и сохранить новый блок `oauth`.

Для резервного варианта через браузер OAuth не требуется; аутентификация Google в этом случае выполняется через профиль Chrome, в который выполнен вход на выбранном узле, а не через конфигурацию OpenClaw.

В качестве резервных вариантов принимаются следующие переменные окружения:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` или `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` или `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` или `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` или `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` или `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` или `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` или `GOOGLE_MEET_PREVIEW_ACK`

### Разрешение, предварительная проверка и чтение артефактов

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

После создания записей конференции в Meet:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

При использовании `--meeting` команды `artifacts` и `attendance` по умолчанию используют последнюю запись конференции; передайте `--all-conference-records`, чтобы обработать все сохранённые записи.

Поиск в календаре разрешает URL встречи через Google Calendar перед чтением артефактов (требуется токен обновления, включающий область доступа только для чтения событий Calendar):

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` ищет в сегодняшнем календаре `primary` событие со ссылкой Meet; `--event <query>` ищет совпадающий текст события; `--calendar <id>` указывает неосновной календарь. `calendar-events` предварительно показывает совпадающие события и отмечает, какое из них выберут `latest`/`artifacts`/`attendance`/`export`.

Если идентификатор записи конференции уже известен, обратитесь к ней напрямую:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Закройте комнату для пространства, созданного через API:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Вызывает `spaces.endActiveConference` и требует OAuth с областью доступа `meetings.space.created` для пространства, которым может управлять авторизованный аккаунт. Принимает URL Meet, код встречи или `spaces/{id}` и сначала разрешает его в ресурс пространства API. Это не связано с `googlemeet leave`: `leave` прекращает локальное участие OpenClaw или его участие в сеансе; `end-active-conference` запрашивает у Google Meet завершение активной конференции в пространстве.

Создайте удобочитаемый отчёт:

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

`artifacts` возвращает метаданные записи конференции, а также метаданные ресурсов участников, записей, расшифровок, структурированных записей расшифровки и умных заметок, если Google предоставляет их. `--no-transcript-entries` пропускает поиск записей для крупных встреч. `attendance` разворачивает участников в строки сеансов участников с временем первого и последнего присутствия, общей продолжительностью сеанса, признаками опоздания и раннего ухода, а также объединяет дублирующиеся ресурсы участников по вошедшему в систему пользователю или отображаемому имени; `--no-merge-duplicates` сохраняет исходные ресурсы раздельно, а `--late-after-minutes`/`--early-before-minutes` настраивают пороговые значения.

`export` создаёт папку с файлами `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` и `manifest.json`. `manifest.json` записывает выбранные входные данные, параметры экспорта, записи конференции, выходные файлы, количества, источник токена, использованное событие Calendar и предупреждения о частичном получении данных. `--zip` также создаёт переносимый архив рядом с папкой. `--include-doc-bodies` экспортирует текст связанных расшифровок и умных заметок Google Docs через Drive `files.export` (требуется область доступа Drive Meet только для чтения); без неё экспорт включает только метаданные Meet и структурированные записи расшифровки. При частичной ошибке получения артефактов (ошибке перечисления умных заметок, записи расшифровки или тела документа) предупреждение сохраняется в сводке или манифесте, а весь экспорт не завершается с ошибкой. `--dry-run` получает те же данные и выводит JSON манифеста без создания папки или ZIP-архива.

Агенты используют те же действия через инструмент `google_meet` (`export`, `create` с `accessType`, `end_active_conference`, `test_listen`); см. раздел [Инструмент](#tool).

### Оперативная проверка

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

| Переменная                                                                                                               | Назначение                                                                 |
| ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `OPENCLAW_LIVE_TEST=1`                                                                                                       | Включает защищённые оперативные тесты                                      |
| `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`                                                                                                       | Сохранённый URL Meet, код или `spaces/{id}`                            |
| `OPENCLAW_GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_ID`                                                                                  | Идентификатор клиента OAuth                                                |
| `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` / `GOOGLE_MEET_REFRESH_TOKEN`                                                                                  | Токен обновления                                                           |
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`                                                               | Необязательно; также работают те же резервные имена без префикса `OPENCLAW_` |

Для базовой оперативной проверки артефактов и посещаемости требуются `meetings.space.readonly` и `meetings.conference.media.readonly`. Для поиска в календаре требуется `calendar.events.readonly`. Для экспорта тела документа Drive требуется `drive.meet.readonly`.

### Примеры создания

```bash
openclaw googlemeet create
```

Выводит URI новой встречи, источник и сеанс подключения. При наличии OAuth используется Meet API; без него — профиль выбранного узла Chrome, в который выполнен вход. JSON резервного варианта через браузер:

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

Если резервный вариант через браузер сначала сталкивается со страницей входа в Google или блокировкой разрешений Meet, `google_meet` возвращает структурированные сведения вместо простой строки:

```json
{
  "source": "browser",
  "error": "google-login-required: Войдите в Google в профиле браузера OpenClaw, затем повторите создание встречи.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Войдите в Google в профиле браузера OpenClaw, затем повторите создание встречи.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Вход — Аккаунты Google"
  }
}
```

JSON создания через API:

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

При создании подключение выполняется по умолчанию, но для подключения через браузер Chrome или Chrome-node по-прежнему требуется профиль Google, в который выполнен вход; если вход не выполнен, OpenClaw сообщает `manualActionRequired: true` или ошибку резервного варианта через браузер и просит оператора завершить вход в Google перед повторной попыткой.

Устанавливайте `preview.enrollmentAcknowledged: true` только после подтверждения того, что ваш проект Cloud, субъект OAuth и участники встречи зарегистрированы в программе Google Workspace Developer Preview Program для медиа-API Meet.

## Конфигурация

Для общего пути агента Chrome требуются только включённый плагин, BlackHole, SoX, ключ поставщика реального времени и настроенный поставщик TTS OpenClaw:

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

### Значения по умолчанию

| Ключ                             | Значение по умолчанию                     | Примечания                                                                                                                                                                                                        |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTransport`                | `"chrome"`                               |                                                                                                                                                                                                                   |
| `defaultMode`                     | `"agent"`                                | `"realtime"` принимается как устаревший псевдоним для `"agent"`; новые вызывающие стороны должны использовать `"agent"`                                                                                                                        |
| `chromeNode.node`                 | не задано                                | Идентификатор/имя/IP-адрес Node для `chrome-node`; обязателен, если может быть подключено более одного подходящего узла                                                                                                                      |
| `chrome.launch`                   | `true`                                   | Запускает Chrome для подключения; задавайте `false` только при повторном использовании уже открытого сеанса                                                                                                                               |
| `chrome.audioBackend`             | `"blackhole-2ch"`                        |                                                                                                                                                                                                                   |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | Отображается на гостевом экране Meet без выполненного входа                                                                                                                                                       |
| `chrome.autoJoin`                 | `true`                                   | Пытается заполнить имя гостя и нажать Join Now в `chrome-node`                                                                                                                                                   |
| `chrome.reuseExistingTab`         | `true`                                   | Активирует существующую вкладку Meet вместо открытия дубликатов                                                                                                                                                   |
| `chrome.waitForInCallMs`          | `20000`                                  | Ожидает, пока вкладка Meet сообщит о подключении к вызову, прежде чем воспроизвести вступление обратной голосовой связи                                                                                            |
| `chrome.audioFormat`              | `"pcm16-24khz"`                          | Формат аудио для пары команд; `"g711-ulaw-8khz"` предназначен только для устаревших или пользовательских пар команд, выводящих аудио телефонного качества                                                        |
| `chrome.audioBufferBytes`         | `4096`                                   | Буфер обработки SoX для аудиокоманд, создаваемых парой команд (половина стандартного буфера SoX размером 8192 байта, что снижает задержку канала); минимальное значение ограничено 17 байтами                     |
| `chrome.audioInputCommand`        | сгенерированная команда SoX              | Читает из CoreAudio `BlackHole 2ch`, записывает аудио в `chrome.audioFormat`                                                                                                                                      |
| `chrome.audioOutputCommand`       | сгенерированная команда SoX              | Читает аудио в `chrome.audioFormat`, записывает в CoreAudio `BlackHole 2ch`                                                                                                                                       |
| `chrome.bargeInInputCommand`      | не задано                                | Необязательная локальная команда микрофона, выводящая знаковый 16-битный монофонический PCM с порядком байтов от младшего к старшему для обнаружения вмешательства человека во время воспроизведения ответа ассистента; применяется к размещённому на Gateway мосту пары команд |
| `chrome.bargeInRmsThreshold`      | `650`                                    | Среднеквадратичный уровень, считающийся вмешательством человека                                                                                                                                                   |
| `chrome.bargeInPeakThreshold`     | `2500`                                   | Пиковый уровень, считающийся вмешательством человека                                                                                                                                                              |
| `chrome.bargeInCooldownMs`        | `900`                                    | Минимальная задержка между повторными сбросами при вмешательстве                                                                                                                                                   |
| `mode` (для каждого запроса)      | `"agent"`                                | Режим обратной голосовой связи; см. таблицу [Режимы агента и bidi](#agent-and-bidi-modes)                                                                                                                         |
| `realtime.provider`               | `"openai"`                               | Резервное значение для совместимости, используемое, когда указанные ниже поля области не заданы                                                                                                                    |
| `realtime.transcriptionProvider`  | `"openai"`                               | Идентификатор провайдера, используемый режимом `agent` для транскрибирования в реальном времени                                                                                                         |
| `realtime.voiceProvider`          | не задано                                | Идентификатор провайдера, используемый режимом `bidi` для прямой голосовой связи в реальном времени; задайте `"google"` для Gemini Live, сохранив транскрибирование в режиме агента через OpenAI. Используйте вместе с `realtime.model`, чтобы выбрать конкретную модель Gemini Live. |
| `realtime.toolPolicy`             | `"safe-read-only"`                       | См. [Режимы агента и bidi](#agent-and-bidi-modes)                                                                                                                                                                 |
| `realtime.instructions`           | краткие инструкции для голосового ответа | Предписывает модели отвечать кратко и использовать `openclaw_agent_consult` для более подробных ответов                                                                                                                 |
| `realtime.introMessage`           | `"Say exactly: I'm here and listening."` | Произносится один раз при подключении моста реального времени; задайте `""`, чтобы подключаться без звукового сообщения                                                                              |
| `realtime.agentId`                | `"main"`                                 | Идентификатор агента OpenClaw, используемый для `openclaw_agent_consult`                                                                                                                                                 |
| `voiceCall.enabled`               | `true`                                   | Делегирует вызов Twilio PSTN, DTMF и вступительное приветствие плагину Voice Call                                                                                                                                 |
| `voiceCall.dtmfDelayMs`           | `12000`                                  | Начальная пауза перед воспроизведением через Twilio последовательности DTMF, сформированной из PIN-кода                                                                                                            |
| `voiceCall.postDtmfSpeechDelayMs` | `5000`                                   | Задержка перед запросом вступительного приветствия в реальном времени после того, как Voice Call запускает участок вызова Twilio                                                                                   |

`chrome.audioBridgeCommand` и `chrome.audioBridgeHealthCommand` позволяют внешнему мосту полностью управлять локальным аудиотрактом вместо `chrome.audioInputCommand`/`chrome.audioOutputCommand`; ограничение на режим, в котором их можно использовать, приведено в разделе [Примечания](#notes).

Для устаревшей структуры `realtime.provider: "google"` предусмотрена миграция `openclaw doctor --fix`: она переносит соответствующую настройку в `realtime.voiceProvider: "google"` и `realtime.transcriptionProvider: "openai"`, если эти поля ещё не заданы.

### Необязательные переопределения

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  browser: {
    defaultProfile: "openclaw",
  },
  chrome: {
    guestName: "Агент OpenClaw",
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
    introMessage: "Скажи в точности: Я здесь.",
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

Постоянный голос Meet задаётся в `messages.tts.providers.elevenlabs.speakerVoiceId`. В ответах агента также можно использовать директивы `[[tts:speakerVoiceId=... model=eleven_v3]]` для отдельных ответов, если включено переопределение модели TTS, но конфигурация служит детерминированным значением по умолчанию для встреч. При подключении в журналах отображается `transcriptionProvider=elevenlabs`, а для каждого озвученного ответа регистрируется `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

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

При `voiceCall.enabled: true` (значение по умолчанию) и транспорте Twilio плагин Voice Call вводит последовательность DTMF перед открытием медиапотока реального времени, а затем использует сохранённый вступительный текст как первоначальное приветствие в реальном времени. Если `voice-call` не включён, Google Meet по-прежнему может проверять и записывать план набора, но не может выполнить вызов Twilio.

Оставьте `voiceCall.gatewayUrl` незаданным, чтобы использовать локальную доверенную среду выполнения Gateway, которая сохраняет
агента, инициировавшего вызов, на протяжении всего вызова. Настроенный URL Gateway остаётся явной целью WebSocket и
не позволяет проверить происхождение плагина; подключения агентов, отличных от агента по умолчанию, завершаются отказом вместо неявного
использования другого агента. Запускайте Google Meet и Voice Call в одном процессе Gateway, когда требуется
маршрутизация по агентам.

## Инструмент

Агенты используют инструмент `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

| `action`                | Назначение                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `join`                  | Подключиться по явно указанному URL Meet                                                                         |
| `create`                | Создать пространство (и по умолчанию подключиться к нему); поддерживает `accessType`/`entryPointAccess`                    |
| `status`                | Вывести активные сеансы или проверить один из них по `sessionId`                                               |
| `setup_status`          | Выполнить те же проверки, что и `googlemeet setup`                                                         |
| `resolve_space`         | Разрешить URL/код/`spaces/{id}` через `spaces.get`                                                 |
| `preflight`             | Проверить OAuth и необходимые условия для разрешения встречи                                                 |
| `latest`                | Найти последнюю запись конференции для встречи                                                   |
| `calendar_events`       | Предварительно просмотреть события Calendar со ссылками Meet                                                           |
| `artifacts`             | Вывести записи конференций и метаданные участников, записей, расшифровок и интеллектуальных заметок                  |
| `attendance`            | Вывести участников и их сеансы                                                        |
| `export`                | Записать пакет артефактов, посещаемости, расшифровки и манифеста; задайте `"dryRun": true`, чтобы записать только манифест |
| `recover_current_tab`   | Перевести фокус на существующую вкладку Meet или проверить её, не открывая новую                                      |
| `transcript`            | Прочитать ограниченную расшифровку субтитров; `sinceIndex` продолжает с предыдущего `nextIndex`           |
| `leave`                 | Завершить сеанс (Chrome нажимает кнопку выхода; закрываются только открытые им вкладки; Twilio завершает вызов)                  |
| `end_active_conference` | Завершить активную конференцию Google Meet для пространства, управляемого через API                                    |
| `speak`                 | Немедленно воспроизвести речь агента реального времени с указанными `sessionId` и `message`                        |
| `test_speech`           | Создать или повторно использовать сеанс, воспроизвести известную фразу и вернуть состояние Chrome                              |
| `test_listen`           | Создать или повторно использовать сеанс только для наблюдения и дождаться изменения субтитров или расшифровки                        |

`test_speech` всегда принудительно использует `mode: "agent"` или `"bidi"` и завершается ошибкой при запросе запуска в `mode: "transcribe"`, поскольку сеансы только для наблюдения не могут воспроизводить речь. Результат `speechOutputVerified` основан на увеличении числа байтов аудиовывода реального времени во время этого вызова, поэтому старое аудио в повторно используемом сеансе не считается новой проверкой.

Для транспортов Chrome `leave` оставляет повторно используемую пользовательскую вкладку открытой после нажатия кнопки завершения вызова Meet. Вкладки, открытые OpenClaw, закрываются после выхода.

Используйте `transport: "chrome"`, когда Chrome работает на хосте Gateway, и `transport: "chrome-node"`, когда он работает на сопряжённом узле. В обоих случаях провайдеры моделей и `openclaw_agent_consult` работают на хосте Gateway, поэтому учётные данные моделей остаются там. При запуске моста журналы режима агента содержат разрешённые провайдер и модель распознавания речи, а после каждого синтезированного ответа — провайдер, модель, голос, формат вывода и частоту дискретизации TTS. Необработанное значение `mode: "realtime"` по-прежнему принимается как устаревший псевдоним совместимости для `mode: "agent"`, но больше не указывается в перечислении `mode` инструмента.

`create` с комнатой на базе API и явно заданной политикой доступа:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

Завершение активной конференции известной комнаты:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Проверка прослушивания перед заявлением о готовности встречи к использованию:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Воспроизведение речи по запросу:

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

`status` включает состояние Chrome, когда оно доступно:

| Поле                                                                 | Значение                                                                                                                |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inCall`                                                              | Chrome, по-видимому, находится внутри вызова Meet                                                                              |
| `micMuted`                                                            | Определённое по мере возможности состояние микрофона Meet                                                                                      |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | Чтобы речь могла работать, профиль браузера требует ручного входа, допуска организатором Meet, предоставления разрешений или восстановления управления браузером |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | Разрешена ли сейчас речь в управляемом Chrome; `speechReady: false` означает, что OpenClaw не отправил вводную или тестовую фразу   |
| `providerConnected` / `realtimeReady`                                 | Состояние голосового моста реального времени                                                                                            |
| `lastInputAt` / `lastOutputAt`                                        | Последнее аудио, полученное от моста или отправленное ему                                                                                |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | Был ли медиавывод вкладки Meet активно направлен на устройство BlackHole моста                               |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | Игнорируется ли вход обратной связи во время воспроизведения речи ассистента                                                              |

## Режимы агента и двунаправленной связи

| Режим    | Кто определяет ответ        | Путь вывода речи                     | Когда использовать                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | Настроенный агент OpenClaw | Обычная среда выполнения TTS OpenClaw            | Когда требуется поведение «мой агент находится на встрече»        |
| `bidi`  | Голосовая модель реального времени      | Аудиоответ голосового провайдера реального времени | Когда требуется диалоговый голосовой цикл с минимальной задержкой |

Режим `agent`: провайдер распознавания речи в реальном времени получает аудио встречи, окончательные расшифровки речи участников направляются настроенному агенту OpenClaw, а ответ воспроизводится через обычный TTS OpenClaw. Близкие фрагменты окончательной расшифровки объединяются перед консультацией, чтобы один речевой фрагмент не приводил к нескольким устаревшим частичным ответам; ввод в реальном времени подавляется, пока поставленное в очередь аудио ассистента продолжает воспроизводиться, а недавние фрагменты расшифровки, похожие на речь ассистента, игнорируются перед консультацией, чтобы обратная связь BlackHole не заставляла агента отвечать на собственную речь.

Режим `bidi`: голосовая модель реального времени отвечает напрямую и может вызывать `openclaw_agent_consult` для более глубокого анализа, получения актуальной информации или использования обычных инструментов OpenClaw. Инструмент консультации незаметно запускает обычного агента OpenClaw с контекстом недавней расшифровки встречи и возвращает краткий ответ для озвучивания; в режиме `agent` OpenClaw отправляет этот ответ непосредственно в TTS, а в режиме `bidi` его может озвучить голосовая модель реального времени. Используется тот же общий механизм консультаций, что и в Voice Call.

По умолчанию консультации выполняются с агентом `main`; задайте `realtime.agentId`, чтобы направить канал Meet в выделенное рабочее пространство агента с отдельными значениями моделей по умолчанию, политикой инструментов, памятью и историей сеансов. Консультации в режиме агента используют отдельный для каждой встречи ключ сеанса `agent:<id>:subagent:google-meet:<session>`, поэтому последующие вопросы сохраняют контекст встречи и при этом наследуют обычную политику агента. Когда агент вызывает `google_meet` в режиме агента, сеанс консультанта перед ответом на речь участника создаёт ответвление текущей расшифровки вызывающего агента; сеанс Meet остаётся отдельным, поэтому последующие вопросы на встрече не изменяют расшифровку вызывающего агента напрямую.

`realtime.toolPolicy` управляет запуском консультации:

| Политика           | Поведение                                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Предоставить инструмент консультации; ограничить обычного агента инструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get` |
| `owner`          | Предоставить инструмент консультации; разрешить обычному агенту использовать его стандартную политику инструментов                                                        |
| `none`           | Не предоставлять инструмент консультации голосовой модели реального времени                                                                       |

Ключ сеанса консультации имеет область действия в пределах отдельного сеанса Meet, поэтому последующие вызовы консультации повторно используют предыдущий контекст консультации в рамках той же встречи.

Принудительно выполните голосовую проверку готовности после полного подключения Chrome:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Полная быстрая проверка подключения и воспроизведения речи:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Контрольный список проверки в реальных условиях

Перед передачей встречи автономному агенту:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Ожидаемое состояние Chrome-node:

- `googlemeet setup` полностью исправен и включает `chrome-node-connected`, когда Chrome-node является транспортом по умолчанию или закреплён определённый узел.
- `nodes status` показывает, что выбранный узел подключён и объявляет как `googlemeet.chrome`, так и `browser.proxy`.
- Вкладка Meet подключается, а `test-speech` возвращает состояние Chrome с `inCall: true`.

Для удалённого хоста Chrome, например виртуальной машины macOS в Parallels, кратчайшая безопасная проверка после обновления Gateway или виртуальной машины:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Это подтверждает, что плагин Gateway загружен, узел виртуальной машины подключён с текущим токеном, а аудиомост Meet доступен до того, как агент откроет вкладку реальной встречи.

Для быстрой проверки Twilio используйте встречу, в которой доступны данные для подключения по телефону:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Ожидаемое состояние Twilio:

- `googlemeet setup` включает зелёные проверки `twilio-voice-call-plugin`, `twilio-voice-call-credentials` и `twilio-voice-call-webhook`.
- `voicecall` доступен в CLI после перезагрузки Gateway.
- Возвращённый сеанс содержит `transport: "twilio"` и `twilio.voiceCallId`.
- `openclaw logs --follow` показывает, что DTMF TwiML обслуживается перед TwiML реального времени, затем создаётся мост реального времени с поставленным в очередь начальным приветствием.
- `googlemeet leave <sessionId>` завершает делегированный голосовой вызов.

## Устранение неполадок

### Агент не видит инструмент Google Meet

Убедитесь, что плагин включён, и перезагрузите Gateway; работающий агент видит только инструменты плагинов, зарегистрированные текущим процессом Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

На хостах Gateway без macOS `google_meet` остаётся видимым, но локальные действия Chrome для обратной передачи речи блокируются до попадания в аудиомост. Вместо стандартного пути локального агента Chrome используйте `mode: "transcribe"`, телефонное подключение Twilio или хост `chrome-node` на macOS.

### Нет подключённого Node с поддержкой Google Meet

На хосте Node:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

На хосте Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node должен быть подключён и содержать в списке `googlemeet.chrome` и `browser.proxy`; конфигурация Gateway должна разрешать обе команды:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Если `googlemeet setup` завершается ошибкой `chrome-node-connected` или в журнале Gateway указано `gateway token mismatch`, переустановите или перезапустите Node с текущим токеном Gateway:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Затем перезагрузите службу Node и повторно выполните:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Браузер открывается, но агент не может присоединиться

Выполните `googlemeet test-listen` для подключения только в режиме наблюдения или `googlemeet test-speech` для подключения в реальном времени, затем проверьте возвращённое состояние Chrome. Если какая-либо из команд сообщает `manualActionRequired: true`, покажите оператору `manualActionMessage` и прекратите повторные попытки до завершения действия в браузере.

Распространённые ручные действия: войти в профиль Chrome; допустить гостя из учётной записи организатора Meet; предоставить Chrome разрешения на использование микрофона и камеры при появлении системного запроса; закрыть или исправить зависшее диалоговое окно разрешений Meet.

Не сообщайте «вход не выполнен» только потому, что Meet спрашивает «Do you want people to hear you in the meeting?»; это промежуточный экран выбора звука в Meet. Когда доступна автоматизация браузера, OpenClaw нажимает **Use microphone** и продолжает ожидать фактического состояния встречи; при резервном создании встречи только через браузер вместо этого может быть нажато **Continue without microphone**, поскольку для создания URL не требуется аудиоканал реального времени.

### Не удаётся создать встречу

`googlemeet create` использует API Meet `spaces.create`, если настроен OAuth, а в противном случае — браузер закреплённого Node Chrome. Проверьте следующее:

- **Создание через API**: присутствуют `oauth.clientId` и `oauth.refreshToken` (или соответствующие переменные окружения `OPENCLAW_GOOGLE_MEET_*`), а токен обновления был создан после добавления поддержки создания; в старых токенах может отсутствовать `meetings.space.created`, поэтому повторно выполните `openclaw googlemeet auth login --json`.
- **Резервный вариант через браузер**: `defaultTransport: "chrome-node"` и `chromeNode.node` указывают на подключённый Node с `browser.proxy` и `googlemeet.chrome`; в профиле OpenClaw Chrome на этом Node выполнен вход и он может открыть `https://meet.google.com/new`.
- **Повторные попытки резервного варианта через браузер**: перед открытием новой вкладки повторно используйте существующую вкладку `.../new` или вкладку с запросом учётной записи Google; повторите вызов инструмента, а не открывайте ещё одну вкладку вручную.
- **Ручное действие**: если инструмент возвращает `manualActionRequired: true`, используйте `browser.nodeId`, `browser.targetId`, `browserUrl` и `manualActionMessage` для инструктажа оператора; не выполняйте повторные попытки в цикле.
- **Промежуточный экран выбора звука**: если Meet показывает «Do you want people to hear you in the meeting?», оставьте вкладку открытой. OpenClaw должен нажать **Use microphone** или, только при создании, **Continue without microphone** и продолжить ожидание созданного URL; если это невозможно, ошибка должна упоминать `meet-audio-choice-required`, а не `google-login-required`.

### Агент присоединяется, но не говорит

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Используйте `mode: "agent"` для пути STT -> агент OpenClaw -> TTS, а `mode: "bidi"` — для прямого резервного голосового пути реального времени. `mode: "transcribe"` намеренно не запускает мост обратной передачи речи. Для отладки в режиме только наблюдения выполните `openclaw googlemeet status --json <session-id>` после того, как участники начнут говорить, и проверьте `captioning`, `transcriptLines`, `lastCaptionText`. Если `inCall` имеет значение true, но `transcriptLines` остаётся `0`, возможно, субтитры Meet отключены, после установки наблюдателя никто не говорил, интерфейс Meet изменился или субтитры в реальном времени недоступны для языка встречи или учётной записи.

`googlemeet test-speech` всегда проверяет путь реального времени и сообщает, были ли для этого вызова обнаружены выходные байты моста. Если `speechOutputVerified` имеет значение false, а `speechOutputTimedOut` — true, провайдер реального времени мог принять высказывание, но OpenClaw не обнаружил поступления новых выходных байтов в аудиомост Chrome.

Также проверьте: на хосте Gateway доступен ключ провайдера реального времени (`OPENAI_API_KEY` или `GEMINI_API_KEY`); `BlackHole 2ch` виден на хосте Chrome; там существует `sox`; микрофон и динамик Meet направлены через виртуальный аудиоканал (`doctor` должен показывать `meet output routed: yes` для локальных подключений Chrome в реальном времени).

`googlemeet doctor [session-id]` выводит сведения о сеансе, Node, состоянии вызова, причине ручного действия, подключении провайдера реального времени, `realtimeReady`, активности ввода и вывода звука, временных метках последней аудиоактивности, счётчиках байтов и URL браузера. Используйте `googlemeet status [session-id] --json` для необработанного JSON, а `googlemeet doctor --oauth` (добавьте `--meeting` или `--create-space`) — для проверки обновления OAuth без раскрытия токенов.

Если время ожидания агента истекло, а вкладка Meet уже открыта, проверьте её, не открывая новую:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Эквивалентное действие инструмента — `recover_current_tab`: оно переводит фокус на существующую вкладку Meet и проверяет её для выбранного транспорта (локальное управление браузером для `chrome`, настроенный Node для `chrome-node`), не открывая новую вкладку или сеанс, и сообщает о текущей блокирующей причине (вход, допуск, разрешения, состояние выбора звука). Команда CLI обращается к настроенному Gateway, который должен быть запущен; для `chrome-node` также требуется подключённый Node.

### Проверки настройки Twilio завершаются ошибкой

`twilio-voice-call-plugin` завершается ошибкой, если `voice-call` не разрешён или не включён: добавьте его в `plugins.allow`, включите `plugins.entries.voice-call` и перезагрузите Gateway.

`twilio-voice-call-credentials` завершается ошибкой, если в бэкенде Twilio отсутствуют SID учётной записи, токен аутентификации или номер вызывающего абонента:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` завершается ошибкой, если у `voice-call` нет общедоступной конечной точки Webhook или `publicUrl` указывает на loopback-адрес или частную сеть. Не используйте `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` или `fd00::/8` в качестве `publicUrl`; обратные вызовы оператора связи не могут обратиться к ним. Задайте для `plugins.entries.voice-call.config.publicUrl` общедоступный URL или настройте публикацию через туннель/Tailscale:

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

Для локальной разработки используйте публикацию через туннель или Tailscale вместо URL частного хоста:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // или
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Перезапустите или перезагрузите Gateway, затем выполните:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

По умолчанию `voicecall smoke` только проверяет готовность. Выполните пробный запуск для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Добавляйте `--yes` только для намеренного выполнения реального исходящего вызова:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Вызов Twilio начинается, но подключение к встрече не происходит

Убедитесь, что событие Meet содержит сведения о телефонном подключении, и передайте точный номер подключения и PIN-код или пользовательскую последовательность DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Используйте начальные `w` или запятые в `--dtmf-sequence`, чтобы добавить паузу перед PIN-кодом.

Если вызов создан, но участник, подключающийся по телефону, так и не появляется в списке участников Meet:

- `openclaw googlemeet doctor <session-id>`: проверьте идентификатор делегированного вызова Twilio, была ли последовательность DTMF поставлена в очередь и было ли запрошено вступительное приветствие.
- `openclaw voicecall status --call-id <id>`: убедитесь, что вызов всё ещё активен.
- `openclaw voicecall tail`: убедитесь, что Webhook Twilio поступают в Gateway.
- `openclaw logs --follow`: найдите последовательность Twilio Meet: Google Meet делегирует подключение, Voice Call сохраняет и обслуживает TwiML DTMF перед подключением, Voice Call обслуживает TwiML реального времени для вызова Twilio, затем Google Meet запрашивает вступительную речь с помощью `voicecall.speak`.
- Повторно выполните `openclaw googlemeet setup --transport twilio`; зелёная проверка настройки обязательна, но не подтверждает правильность последовательности PIN-кода встречи.
- Убедитесь, что номер телефонного подключения относится к тому же приглашению Meet и региону, что и PIN-код.
- Увеличьте `voiceCall.dtmfDelayMs` относительно значения по умолчанию 12 секунд, если Meet отвечает медленно или в расшифровке вызова всё ещё отображается запрос PIN-кода после отправки DTMF перед подключением.
- Если участник подключился, но приветствие не слышно, проверьте `openclaw logs --follow` на наличие запроса `voicecall.speak` после DTMF и воспроизведения TTS через медиапоток или резервного варианта Twilio `<Say>`. Если в расшифровке всё ещё отображается «enter the meeting PIN», телефонная линия ещё не подключилась к комнате Meet, поэтому участники не услышат речь.

Если Webhook не поступают, сначала выполните отладку плагина Voice Call: провайдер должен иметь доступ к `plugins.entries.voice-call.config.publicUrl` или настроенному туннелю. См. [устранение неполадок голосовых вызовов](/ru/plugins/voice-call#troubleshooting).

## Примечания

Официальный мультимедийный API Google Meet ориентирован на приём, поэтому для передачи речи в вызов по-прежнему требуется путь участника. Этот плагин явно сохраняет это разделение: Chrome обеспечивает участие через браузер и локальную маршрутизацию звука; Twilio обеспечивает участие через телефонное подключение.

Режимы обратной передачи речи Chrome требуют `BlackHole 2ch` и одного из следующих вариантов:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw управляет мостом и передаёт аудио в `chrome.audioFormat` между этими командами и выбранным провайдером. Режим `agent` использует транскрипцию в реальном времени и обычный TTS; режим `bidi` использует провайдера голосовой связи в реальном времени. По умолчанию используется PCM16 с частотой 24 кГц и `chrome.audioBufferBytes: 4096`; G.711 mu-law с частотой 8 кГц остаётся доступным для устаревших пар команд.
- `chrome.audioBridgeCommand`: внешняя команда моста управляет всем локальным аудиотрактом и должна завершиться после запуска или проверки своего демона. Допустимо только для `bidi`, поскольку режиму `agent` необходим прямой доступ к паре команд для TTS.

При использовании Chrome-моста с парой команд `chrome.bargeInInputCommand` может прослушивать отдельный локальный микрофон и прерывать воспроизведение ответа ассистента, когда человек начинает говорить, отдавая человеческой речи приоритет над выводом ассистента, даже когда общий вход обратной связи BlackHole временно подавляется во время воспроизведения ответа ассистента. Как и `chrome.audioInputCommand`/`chrome.audioOutputCommand`, это локальная команда, настраиваемая оператором: используйте явно указанный доверенный путь к команде или список аргументов и никогда не используйте скрипт из недоверенного расположения.

Для чистого дуплексного звука направляйте вывод Meet и микрофон Meet через отдельные виртуальные устройства или граф виртуальных устройств наподобие Loopback; одно общее устройство BlackHole может возвращать эхо голосов других участников обратно в звонок.

`googlemeet speak` запускает активный аудиомост двусторонней голосовой связи для сеанса Chrome; `googlemeet leave` останавливает его (а для сеансов Twilio, делегированных через Voice Call, также завершает базовый звонок). Используйте `googlemeet end-active-conference`, чтобы также закрыть активную конференцию Google Meet для пространства, управляемого через API.

## Связанные материалы

- [Плагин голосовых вызовов](/ru/plugins/voice-call)
- [Режим разговора](/ru/nodes/talk)
- [Создание плагинов](/ru/plugins/building-plugins)
