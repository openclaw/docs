---
read_when:
    - Додавання або зміна захоплення з камери на iOS/Android Node або macOS
    - Розширення робочих процесів тимчасових файлів MEDIA, доступних агенту
summary: 'Захоплення з камери (iOS/Android Node + застосунок macOS) для використання агентом: фото (jpg) і короткі відеокліпи (mp4)'
title: Захоплення з камери
x-i18n:
    generated_at: "2026-04-23T20:58:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 089d2628381c7ca8c65bc9ef19b036b5e32cb3202dfd57cb158e4cacb3b069c6
    source_path: nodes/camera.md
    workflow: 15
---

# Захоплення з камери (агент)

OpenClaw підтримує **захоплення з камери** для робочих процесів агента:

- **iOS Node** (спарений через Gateway): захоплення **фото** (`jpg`) або **короткого відеокліпу** (`mp4`, з необов’язковим аудіо) через `node.invoke`.
- **Android Node** (спарений через Gateway): захоплення **фото** (`jpg`) або **короткого відеокліпу** (`mp4`, з необов’язковим аудіо) через `node.invoke`.
- **Застосунок macOS** (Node через Gateway): захоплення **фото** (`jpg`) або **короткого відеокліпу** (`mp4`, з необов’язковим аудіо) через `node.invoke`.

Увесь доступ до камери захищений **налаштуваннями, якими керує користувач**.

## iOS Node

### Налаштування користувача (типово ввімкнено)

- Вкладка налаштувань iOS → **Camera** → **Allow Camera** (`camera.enabled`)
  - Типово: **увімкнено** (відсутній ключ вважається ввімкненим).
  - Якщо вимкнено: команди `camera.*` повертають `CAMERA_DISABLED`.

### Команди (через Gateway `node.invoke`)

- `camera.list`
  - Response payload:
    - `devices`: масив `{ id, name, position, deviceType }`

- `camera.snap`
  - Параметри:
    - `facing`: `front|back` (типово: `front`)
    - `maxWidth`: число (необов’язково; типово `1600` на iOS Node)
    - `quality`: `0..1` (необов’язково; типово `0.9`)
    - `format`: наразі `jpg`
    - `delayMs`: число (необов’язково; типово `0`)
    - `deviceId`: рядок (необов’язково; із `camera.list`)
  - Response payload:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Захист payload: фото повторно стискаються, щоб утримувати payload base64 меншим за 5 МБ.

- `camera.clip`
  - Параметри:
    - `facing`: `front|back` (типово: `front`)
    - `durationMs`: число (типово `3000`, обмежується максимумом `60000`)
    - `includeAudio`: boolean (типово `true`)
    - `format`: наразі `mp4`
    - `deviceId`: рядок (необов’язково; із `camera.list`)
  - Response payload:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Вимога переднього плану

Як і `canvas.*`, iOS Node дозволяє команди `camera.*` лише в **передньому плані**. Виклики у фоновому режимі повертають `NODE_BACKGROUND_UNAVAILABLE`.

### Допоміжний засіб CLI (тимчасові файли + MEDIA)

Найпростіший спосіб отримати вкладення — через допоміжний засіб CLI, який записує декодовані медіа у тимчасовий файл і виводить `MEDIA:<path>`.

Приклади:

```bash
openclaw nodes camera snap --node <id>               # типово: і front, і back (2 рядки MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Примітки:

- `nodes camera snap` типово використовує **обидва** напрями, щоб агент отримав обидва ракурси.
- Вихідні файли є тимчасовими (у тимчасовому каталозі ОС), якщо ви не створите власну обгортку.

## Android Node

### Налаштування користувача Android (типово ввімкнено)

- Аркуш налаштувань Android → **Camera** → **Allow Camera** (`camera.enabled`)
  - Типово: **увімкнено** (відсутній ключ вважається ввімкненим).
  - Якщо вимкнено: команди `camera.*` повертають `CAMERA_DISABLED`.

### Дозволи

- Android потребує runtime-дозволів:
  - `CAMERA` для `camera.snap` і `camera.clip`.
  - `RECORD_AUDIO` для `camera.clip`, коли `includeAudio=true`.

Якщо дозволів бракує, застосунок по можливості покаже запит; якщо доступ заборонено, запити `camera.*` завершуються помилкою
`*_PERMISSION_REQUIRED`.

### Вимога переднього плану Android

Як і `canvas.*`, Android Node дозволяє команди `camera.*` лише в **передньому плані**. Виклики у фоновому режимі повертають `NODE_BACKGROUND_UNAVAILABLE`.

### Команди Android (через Gateway `node.invoke`)

- `camera.list`
  - Response payload:
    - `devices`: масив `{ id, name, position, deviceType }`

### Захист payload

Фото повторно стискаються, щоб утримувати payload base64 меншим за 5 МБ.

## Застосунок macOS

### Налаштування користувача (типово вимкнено)

Супутній застосунок macOS надає прапорець:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - Типово: **вимкнено**
  - Якщо вимкнено: запити до камери повертають “Camera disabled by user”.

### Допоміжний засіб CLI (node invoke)

Використовуйте основний CLI `openclaw`, щоб викликати команди камери на Node macOS.

Приклади:

```bash
openclaw nodes camera list --node <id>            # перелік id камер
openclaw nodes camera snap --node <id>            # виводить MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # виводить MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # виводить MEDIA:<path> (застарілий прапорець)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Примітки:

- `openclaw nodes camera snap` типово використовує `maxWidth=1600`, якщо не перевизначено.
- На macOS `camera.snap` очікує `delayMs` (типово 2000 мс) після прогріву/стабілізації експозиції перед захопленням.
- Payload фотографій повторно стискаються, щоб утримувати base64 меншим за 5 МБ.

## Безпека + практичні обмеження

- Доступ до камери та мікрофона викликає звичайні системні запити дозволів (і потребує рядків використання в Info.plist).
- Відеокліпи обмежені за тривалістю (зараз `<= 60s`), щоб уникнути надто великих payload Node (накладні витрати base64 + ліміти повідомлень).

## Відео екрана macOS (на рівні ОС)

Для _відео екрана_ (не камери) використовуйте супутній застосунок macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # виводить MEDIA:<path>
```

Примітки:

- Потребує дозволу macOS **Screen Recording** (TCC).
