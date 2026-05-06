---
read_when:
    - Додавання або змінення захоплення з камери на вузлах iOS/Android або macOS
    - Розширення доступних агенту робочих процесів із тимчасовими файлами MEDIA
summary: 'Захоплення з камери (вузли iOS/Android + застосунок macOS) для використання агентом: фото (jpg) і короткі відеокліпи (mp4)'
title: Захоплення з камери
x-i18n:
    generated_at: "2026-05-06T06:20:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 226b9f44e8d56b9b366d679c6c2f974c714afc4cb962afddba89d17dcdfc09eb
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw підтримує **захоплення з камери** для робочих процесів агента:

- **Node iOS** (спарений через Gateway): захоплення **фото** (`jpg`) або **короткого відеокліпу** (`mp4`, з необов’язковим аудіо) через `node.invoke`.
- **Node Android** (спарений через Gateway): захоплення **фото** (`jpg`) або **короткого відеокліпу** (`mp4`, з необов’язковим аудіо) через `node.invoke`.
- **застосунок macOS** (Node через Gateway): захоплення **фото** (`jpg`) або **короткого відеокліпу** (`mp4`, з необов’язковим аудіо) через `node.invoke`.

Увесь доступ до камери обмежується **налаштуваннями, керованими користувачем**.

## Node iOS

### Налаштування користувача (увімкнено за замовчуванням)

- Вкладка iOS Settings → **Camera** → **Allow Camera** (`camera.enabled`)
  - За замовчуванням: **увімкнено** (відсутній ключ вважається увімкненим).
  - Коли вимкнено: команди `camera.*` повертають `CAMERA_DISABLED`.

### Команди (через Gateway `node.invoke`)

- `camera.list`
  - Корисне навантаження відповіді:
    - `devices`: масив `{ id, name, position, deviceType }`

- `camera.snap`
  - Параметри:
    - `facing`: `front|back` (за замовчуванням: `front`)
    - `maxWidth`: число (необов’язково; за замовчуванням `1600` на Node iOS)
    - `quality`: `0..1` (необов’язково; за замовчуванням `0.9`)
    - `format`: зараз `jpg`
    - `delayMs`: число (необов’язково; за замовчуванням `0`)
    - `deviceId`: рядок (необов’язково; з `camera.list`)
  - Корисне навантаження відповіді:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Захист корисного навантаження: фото повторно стискаються, щоб утримати корисне навантаження base64 меншим за 5 МБ.

- `camera.clip`
  - Параметри:
    - `facing`: `front|back` (за замовчуванням: `front`)
    - `durationMs`: число (за замовчуванням `3000`, обмежується максимумом `60000`)
    - `includeAudio`: булеве значення (за замовчуванням `true`)
    - `format`: зараз `mp4`
    - `deviceId`: рядок (необов’язково; з `camera.list`)
  - Корисне навантаження відповіді:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Вимога переднього плану

Як і `canvas.*`, Node iOS дозволяє команди `camera.*` лише на **передньому плані**. Виклики у фоновому режимі повертають `NODE_BACKGROUND_UNAVAILABLE`.

### Помічник CLI (тимчасові файли + MEDIA)

Найпростіший спосіб отримати вкладення — через помічник CLI, який записує декодовані медіа в тимчасовий файл і друкує `MEDIA:<path>`.

Приклади:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Примітки:

- `nodes camera snap` за замовчуванням використовує **обидва** напрямки, щоб надати агенту обидва види.
- Вихідні файли є тимчасовими (у тимчасовому каталозі ОС), якщо ви не створюєте власну обгортку.

## Node Android

### Налаштування користувача Android (увімкнено за замовчуванням)

- Аркуш Android Settings → **Camera** → **Allow Camera** (`camera.enabled`)
  - За замовчуванням: **увімкнено** (відсутній ключ вважається увімкненим).
  - Коли вимкнено: команди `camera.*` повертають `CAMERA_DISABLED`.

### Дозволи

- Android потребує дозволів під час виконання:
  - `CAMERA` для `camera.snap` і `camera.clip`.
  - `RECORD_AUDIO` для `camera.clip`, коли `includeAudio=true`.

Якщо дозволів немає, застосунок за можливості покаже запит; якщо відмовлено, запити `camera.*` завершуються помилкою
`*_PERMISSION_REQUIRED`.

### Вимога переднього плану Android

Як і `canvas.*`, Node Android дозволяє команди `camera.*` лише на **передньому плані**. Виклики у фоновому режимі повертають `NODE_BACKGROUND_UNAVAILABLE`.

### Команди Android (через Gateway `node.invoke`)

- `camera.list`
  - Корисне навантаження відповіді:
    - `devices`: масив `{ id, name, position, deviceType }`

### Захист корисного навантаження

Фото повторно стискаються, щоб утримати корисне навантаження base64 меншим за 5 МБ.

## Застосунок macOS

### Налаштування користувача (вимкнено за замовчуванням)

Супутній застосунок macOS показує прапорець:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - За замовчуванням: **вимкнено**
  - Коли вимкнено: запити камери повертають "Камеру вимкнено користувачем".

### Помічник CLI (виклик Node)

Використовуйте основний CLI `openclaw`, щоб викликати команди камери на Node macOS.

Приклади:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints MEDIA:<path> (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Примітки:

- `openclaw nodes camera snap` за замовчуванням використовує `maxWidth=1600`, якщо не перевизначено.
- На macOS `camera.snap` чекає `delayMs` (за замовчуванням 2000 мс) після прогріву/стабілізації експозиції перед захопленням.
- Корисні навантаження фото повторно стискаються, щоб утримати base64 меншим за 5 МБ.

## Безпека + практичні обмеження

- Доступ до камери й мікрофона запускає звичайні запити дозволів ОС (і потребує рядків використання в Info.plist).
- Відеокліпи обмежені (зараз `<= 60s`), щоб уникнути завеликих корисних навантажень Node (накладні витрати base64 + обмеження повідомлень).

## Відео екрана macOS (на рівні ОС)

Для _відео екрана_ (не камери) використовуйте супутній застосунок macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

Примітки:

- Потребує дозволу macOS **Screen Recording** (TCC).

## Пов’язане

- [Підтримка зображень і медіа](/uk/nodes/images)
- [Розуміння медіа](/uk/nodes/media-understanding)
- [Команда місцезнаходження](/uk/nodes/location-command)
