---
read_when:
    - Добавление или изменение захвата с камеры на узлах iOS/Android или macOS
    - Расширение доступных агенту рабочих процессов с временными файлами MEDIA
summary: 'Захват с камеры (узлы iOS/Android + приложение macOS) для использования агентом: фотографии (jpg) и короткие видеоклипы (mp4)'
title: Съемка камерой
x-i18n:
    generated_at: "2026-06-28T23:09:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cb02b1e0e5d68e537dc699bcabacfb48b7beaf07459bf47800810a721191795
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw поддерживает **захват с камеры** для рабочих процессов агентов:

- **узел iOS** (сопряженный через Gateway): захват **фото** (`jpg`) или **короткого видеоклипа** (`mp4`, с необязательным аудио) через `node.invoke`.
- **узел Android** (сопряженный через Gateway): захват **фото** (`jpg`) или **короткого видеоклипа** (`mp4`, с необязательным аудио) через `node.invoke`.
- **приложение macOS** (узел через Gateway): захват **фото** (`jpg`) или **короткого видеоклипа** (`mp4`, с необязательным аудио) через `node.invoke`.

Весь доступ к камере ограничен **настройками, управляемыми пользователем**.

## Узел iOS

### Пользовательская настройка (по умолчанию включена)

- Вкладка iOS Settings → **Camera** → **Allow Camera** (`camera.enabled`)
  - По умолчанию: **включено** (отсутствующий ключ считается включенным).
  - Если выключено: команды `camera.*` возвращают `CAMERA_DISABLED`.

### Команды (через Gateway `node.invoke`)

- `camera.list`
  - Полезная нагрузка ответа:
    - `devices`: массив `{ id, name, position, deviceType }`

- `camera.snap`
  - Параметры:
    - `facing`: `front|back` (по умолчанию: `front`)
    - `maxWidth`: число (необязательно; по умолчанию `1600` на узле iOS)
    - `quality`: `0..1` (необязательно; по умолчанию `0.9`)
    - `format`: сейчас `jpg`
    - `delayMs`: число (необязательно; по умолчанию `0`)
    - `deviceId`: строка (необязательно; из `camera.list`)
  - Полезная нагрузка ответа:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Ограничение полезной нагрузки: фотографии повторно сжимаются, чтобы удерживать полезную нагрузку base64 меньше 5 МБ.

- `camera.clip`
  - Параметры:
    - `facing`: `front|back` (по умолчанию: `front`)
    - `durationMs`: число (по умолчанию `3000`, ограничивается максимумом `60000`)
    - `includeAudio`: boolean (по умолчанию `true`)
    - `format`: сейчас `mp4`
    - `deviceId`: строка (необязательно; из `camera.list`)
  - Полезная нагрузка ответа:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Требование переднего плана

Как и `canvas.*`, узел iOS разрешает команды `camera.*` только на **переднем плане**. Вызовы в фоне возвращают `NODE_BACKGROUND_UNAVAILABLE`.

### Помощник CLI

Самый простой способ получить медиафайлы — использовать помощник CLI, который записывает декодированные медиа во временный файл и выводит сохраненный путь.

Примеры:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Примечания:

- `nodes camera snap` по умолчанию использует **оба** направления, чтобы дать агенту оба вида.
- Выходные файлы временные (в каталоге временных файлов ОС), если вы не создадите собственную обертку.

## Узел Android

### Пользовательская настройка Android (по умолчанию включена)

- Лист Android Settings → **Camera** → **Allow Camera** (`camera.enabled`)
  - По умолчанию: **включено** (отсутствующий ключ считается включенным).
  - Если выключено: команды `camera.*` возвращают `CAMERA_DISABLED`.

### Разрешения

- Android требует разрешения времени выполнения:
  - `CAMERA` для `camera.snap` и `camera.clip`.
  - `RECORD_AUDIO` для `camera.clip`, когда `includeAudio=true`.

Если разрешений нет, приложение по возможности покажет запрос; если доступ отклонен, запросы `camera.*` завершаются ошибкой
`*_PERMISSION_REQUIRED`.

### Требование переднего плана Android

Как и `canvas.*`, узел Android разрешает команды `camera.*` только на **переднем плане**. Вызовы в фоне возвращают `NODE_BACKGROUND_UNAVAILABLE`.

### Команды Android (через Gateway `node.invoke`)

- `camera.list`
  - Полезная нагрузка ответа:
    - `devices`: массив `{ id, name, position, deviceType }`

### Ограничение полезной нагрузки

Фотографии повторно сжимаются, чтобы удерживать полезную нагрузку base64 меньше 5 МБ.

## Приложение macOS

### Пользовательская настройка (по умолчанию выключена)

Сопутствующее приложение macOS предоставляет флажок:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - По умолчанию: **выключено**
  - Если выключено: запросы камеры возвращают "Камера отключена пользователем".

### Помощник CLI (вызов узла)

Используйте основной CLI `openclaw`, чтобы вызывать команды камеры на узле macOS.

Примеры:

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

Примечания:

- `openclaw nodes camera snap` по умолчанию использует `maxWidth=1600`, если значение не переопределено.
- В macOS `camera.snap` ожидает `delayMs` (по умолчанию 2000 мс) после прогрева/стабилизации экспозиции перед захватом.
- Полезные нагрузки фотографий повторно сжимаются, чтобы удерживать base64 меньше 5 МБ.

## Безопасность + практические ограничения

- Доступ к камере и микрофону вызывает обычные запросы разрешений ОС (и требует строки использования в Info.plist).
- Видеоклипы ограничены (сейчас `<= 60s`), чтобы избежать слишком больших полезных нагрузок узла (накладные расходы base64 + ограничения сообщений).

## Видео экрана macOS (на уровне ОС)

Для видео _экрана_ (не камеры) используйте сопутствующее приложение macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints saved path
```

Примечания:

- Требуется разрешение macOS **Screen Recording** (TCC).

## См. также

- [Поддержка изображений и медиа](/ru/nodes/images)
- [Понимание медиа](/ru/nodes/media-understanding)
- [Команда местоположения](/ru/nodes/location-command)
