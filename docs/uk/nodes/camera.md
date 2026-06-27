---
read_when:
    - Додавання або змінення захоплення з камери на вузлах iOS/Android або macOS
    - Розширення доступних агенту робочих процесів із тимчасовими файлами MEDIA
summary: 'Захоплення з камери (вузли iOS/Android + застосунок macOS) для використання агентом: фото (jpg) і короткі відеокліпи (mp4)'
title: Зйомка камерою
x-i18n:
    generated_at: "2026-06-27T17:43:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cb02b1e0e5d68e537dc699bcabacfb48b7beaf07459bf47800810a721191795
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw підтримує **захоплення з камери** для робочих процесів агентів:

- **вузол iOS** (спарений через Gateway): захоплення **фото** (`jpg`) або **короткого відеокліпу** (`mp4`, з необов’язковим аудіо) через `node.invoke`.
- **вузол Android** (спарений через Gateway): захоплення **фото** (`jpg`) або **короткого відеокліпу** (`mp4`, з необов’язковим аудіо) через `node.invoke`.
- **застосунок macOS** (вузол через Gateway): захоплення **фото** (`jpg`) або **короткого відеокліпу** (`mp4`, з необов’язковим аудіо) через `node.invoke`.

Увесь доступ до камери обмежений **налаштуваннями, які контролює користувач**.

## Вузол iOS

### Налаштування користувача (увімкнено за замовчуванням)

- Вкладка налаштувань iOS → **Camera** → **Allow Camera** (`camera.enabled`)
  - За замовчуванням: **увімкнено** (відсутній ключ вважається ввімкненим).
  - Коли вимкнено: команди `camera.*` повертають `CAMERA_DISABLED`.

### Команди (через Gateway `node.invoke`)

- `camera.list`
  - Корисне навантаження відповіді:
    - `devices`: масив `{ id, name, position, deviceType }`

- `camera.snap`
  - Параметри:
    - `facing`: `front|back` (за замовчуванням: `front`)
    - `maxWidth`: число (необов’язково; за замовчуванням `1600` на вузлі iOS)
    - `quality`: `0..1` (необов’язково; за замовчуванням `0.9`)
    - `format`: наразі `jpg`
    - `delayMs`: число (необов’язково; за замовчуванням `0`)
    - `deviceId`: рядок (необов’язково; з `camera.list`)
  - Корисне навантаження відповіді:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Захист корисного навантаження: фото повторно стискаються, щоб утримувати корисне навантаження base64 меншим за 5 МБ.

- `camera.clip`
  - Параметри:
    - `facing`: `front|back` (за замовчуванням: `front`)
    - `durationMs`: число (за замовчуванням `3000`, обмежується максимумом `60000`)
    - `includeAudio`: boolean (за замовчуванням `true`)
    - `format`: наразі `mp4`
    - `deviceId`: рядок (необов’язково; з `camera.list`)
  - Корисне навантаження відповіді:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Вимога активного переднього плану

Як і `canvas.*`, вузол iOS дозволяє команди `camera.*` лише на **передньому плані**. Виклики у фоновому режимі повертають `NODE_BACKGROUND_UNAVAILABLE`.

### Допоміжний засіб CLI

Найпростіший спосіб отримати медіафайли — скористатися допоміжним засобом CLI, який записує декодовані медіа в тимчасовий файл і виводить збережений шлях.

Приклади:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Примітки:

- `nodes camera snap` за замовчуванням використовує **обидва** напрями камери, щоб надати агенту обидва огляди.
- Вихідні файли є тимчасовими (у тимчасовому каталозі ОС), якщо ви не створите власну обгортку.

## Вузол Android

### Налаштування користувача Android (увімкнено за замовчуванням)

- Аркуш налаштувань Android → **Camera** → **Allow Camera** (`camera.enabled`)
  - За замовчуванням: **увімкнено** (відсутній ключ вважається ввімкненим).
  - Коли вимкнено: команди `camera.*` повертають `CAMERA_DISABLED`.

### Дозволи

- Android вимагає дозволів часу виконання:
  - `CAMERA` для `camera.snap` і `camera.clip`.
  - `RECORD_AUDIO` для `camera.clip`, коли `includeAudio=true`.

Якщо дозволів бракує, застосунок запропонує їх надати, коли це можливо; якщо відмовлено, запити `camera.*` завершуються помилкою
`*_PERMISSION_REQUIRED`.

### Вимога активного переднього плану Android

Як і `canvas.*`, вузол Android дозволяє команди `camera.*` лише на **передньому плані**. Виклики у фоновому режимі повертають `NODE_BACKGROUND_UNAVAILABLE`.

### Команди Android (через Gateway `node.invoke`)

- `camera.list`
  - Корисне навантаження відповіді:
    - `devices`: масив `{ id, name, position, deviceType }`

### Захист корисного навантаження

Фото повторно стискаються, щоб утримувати корисне навантаження base64 меншим за 5 МБ.

## Застосунок macOS

### Налаштування користувача (вимкнено за замовчуванням)

Супутній застосунок macOS надає прапорець:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - За замовчуванням: **вимкнено**
  - Коли вимкнено: запити камери повертають "Камеру вимкнено користувачем".

### Допоміжний засіб CLI (виклик вузла)

Використовуйте основний CLI `openclaw`, щоб викликати команди камери на вузлі macOS.

Приклади:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints saved path
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints saved path
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints saved path (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Примітки:

- `openclaw nodes camera snap` за замовчуванням використовує `maxWidth=1600`, якщо це не перевизначено.
- На macOS `camera.snap` чекає `delayMs` (за замовчуванням 2000 мс) після прогрівання/стабілізації експозиції перед захопленням.
- Корисні навантаження фото повторно стискаються, щоб утримувати base64 меншим за 5 МБ.

## Безпека й практичні обмеження

- Доступ до камери та мікрофона запускає звичайні запити дозволів ОС (і потребує рядків використання в Info.plist).
- Відеокліпи обмежені (наразі `<= 60s`), щоб уникнути завеликих корисних навантажень вузла (накладні витрати base64 + обмеження повідомлень).

## Відео екрана macOS (на рівні ОС)

Для відео _екрана_ (не камери) використовуйте супутній застосунок macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints saved path
```

Примітки:

- Потребує дозволу macOS **Screen Recording** (TCC).

## Пов’язане

- [Підтримка зображень і медіа](/uk/nodes/images)
- [Розуміння медіа](/uk/nodes/media-understanding)
- [Команда місцезнаходження](/uk/nodes/location-command)
