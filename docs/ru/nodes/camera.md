---
read_when:
    - Добавление или изменение захвата изображения с камеры на узлах iOS/Android или macOS
    - Расширение рабочих процессов с временными файлами MEDIA, доступными агенту
summary: 'Съёмка камерой (узлы iOS/Android и приложение macOS) для использования агентом: фотографии (jpg) и короткие видеоклипы (mp4)'
title: Съёмка с камеры
x-i18n:
    generated_at: "2026-07-13T19:54:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw поддерживает захват изображения с камеры для рабочих процессов агента на сопряжённых узлах **iOS**, **Android** и **macOS**: получение фотографии (`jpg`) или короткого видеоклипа (`mp4`, с необязательным звуком) через Gateway `node.invoke`.

Доступ к камере на каждой платформе контролируется пользовательской настройкой.

## Узел iOS

### Пользовательская настройка iOS

- Вкладка iOS Settings → **Camera** → **Allow Camera** (`camera.enabled`).
  - По умолчанию: **включено** (отсутствующий ключ считается включённым).
  - Если выключено: команды `camera.*` возвращают `CAMERA_DISABLED`.

### Команды iOS (через Gateway `node.invoke`)

- `camera.list`
  - Данные ответа: `devices` — массив `{ id, name, position, deviceType }`.

- `camera.snap`
  - Параметры:
    - `facing`: `front|back` (по умолчанию: `front`)
    - `maxWidth`: число (необязательно; по умолчанию `1600`)
    - `quality`: `0..1` (необязательно; по умолчанию `0.9`, ограничивается диапазоном `[0.05, 1.0]`)
    - `format`: в настоящее время `jpg`
    - `delayMs`: число (необязательно; по умолчанию `0`, внутреннее максимальное значение — `10000`)
    - `deviceId`: строка (необязательно; из `camera.list`)
  - Данные ответа: `format: "jpg"`, `base64`, `width`, `height`.
  - Ограничение данных: фотографии повторно сжимаются, чтобы объём данных в кодировке base64 не превышал 5 МБ.

- `camera.clip`
  - Параметры:
    - `facing`: `front|back` (по умолчанию: `front`)
    - `durationMs`: число (по умолчанию `3000`, ограничивается диапазоном `[250, 60000]`)
    - `includeAudio`: логическое значение (по умолчанию `true`)
    - `format`: в настоящее время `mp4`
    - `deviceId`: строка (необязательно; из `camera.list`)
  - Данные ответа: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### Требование активного режима для iOS

Как и `canvas.*`, узел iOS разрешает команды `camera.*` только в **активном режиме**. Фоновые вызовы возвращают `NODE_BACKGROUND_UNAVAILABLE`.

### Вспомогательная команда CLI

Проще всего получать медиафайлы с помощью вспомогательной команды CLI, которая записывает декодированные медиафайлы во временный файл и выводит путь к сохранённому файлу.

```bash
openclaw nodes camera snap --node <id>                 # по умолчанию: передняя и задняя камеры (2 строки MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` по умолчанию имеет значение `--facing both`, поэтому съёмка выполняется одновременно передней и задней камерами, чтобы предоставить агенту оба ракурса; передайте `--device-id` с одним явно указанным направлением камеры (`both` отклоняется, если задано `--device-id`). Выходные файлы являются временными (в каталоге временных файлов ОС), если вы не создадите собственную обёртку.

## Узел Android

### Пользовательская настройка Android

- Панель Android Settings → **Camera** → **Allow Camera** (`camera.enabled`).
  - **В новых установках по умолчанию выключено.** В существующих установках, появившихся до добавления этой настройки, выполняется миграция в состояние **включено**, чтобы после обновления ранее работавший доступ к камере не был незаметно утрачен.
  - Если выключено: команды `camera.*` возвращают `CAMERA_DISABLED: enable Camera in Settings`.

### Разрешения

- `CAMERA` требуется как для `camera.snap`, так и для `camera.clip`; если разрешение отсутствует или отклонено, возвращается `CAMERA_PERMISSION_REQUIRED`.
- `RECORD_AUDIO` требуется для `camera.clip`, когда `includeAudio` имеет значение `true`; если разрешение отсутствует или отклонено, возвращается `MIC_PERMISSION_REQUIRED`.

Когда это возможно, приложение запрашивает разрешения во время выполнения.

### Требование активного режима для Android

Как и `canvas.*`, узел Android разрешает команды `camera.*` только в **активном режиме**. Фоновые вызовы возвращают `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### Команды Android (через Gateway `node.invoke`)

- `camera.list`
  - Данные ответа: `devices` — массив `{ id, name, position, deviceType }`.

- `camera.snap`
  - Параметры: `facing` (`front|back`, по умолчанию `front`), `quality` (по умолчанию `0.95`, ограничивается диапазоном `[0.1, 1.0]`), `maxWidth` (по умолчанию `1600`), `deviceId` (необязательно; неизвестный идентификатор приводит к ошибке `INVALID_REQUEST`).
  - Данные ответа: `format: "jpg"`, `base64`, `width`, `height`.
  - Ограничение данных: выполняется повторное сжатие, чтобы объём данных в base64 не превышал 5 МБ (тот же лимит, что и в iOS).

- `camera.clip`
  - Параметры: `facing` (по умолчанию `front`), `durationMs` (по умолчанию `3000`, ограничивается диапазоном `[200, 60000]`), `includeAudio` (по умолчанию `true`), `deviceId` (необязательно).
  - Данные ответа: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Ограничение данных: размер исходного файла MP4 до кодирования в base64 ограничен 18 МБ; для слишком больших клипов возвращается ошибка `PAYLOAD_TOO_LARGE` (уменьшите `durationMs` и повторите попытку).

## Приложение macOS

### Пользовательская настройка macOS

В сопутствующем приложении macOS доступен флажок:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - По умолчанию: **выключено**.
  - Если выключено: запросы к камере возвращают `CAMERA_DISABLED: enable Camera in Settings`.

### Вспомогательная команда CLI (вызов узла)

Используйте основной CLI `openclaw` для вызова команд камеры на узле macOS.

```bash
openclaw nodes camera list --node <id>                     # список идентификаторов камер
openclaw nodes camera snap --node <id>                     # выводит путь к сохранённому файлу
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # выводит путь к сохранённому файлу
openclaw nodes camera clip --node <id> --duration-ms 3000   # выводит путь к сохранённому файлу (устаревший флаг)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- `openclaw nodes camera snap` по умолчанию имеет значение `maxWidth=1600`, если оно не переопределено.
- `camera.snap` ожидает `delayMs` (по умолчанию 2000 мс, ограничивается диапазоном `[0, 10000]`) после прогрева и стабилизации экспозиции перед съёмкой.
- Фотографии повторно сжимаются, чтобы объём данных в base64 не превышал 5 МБ.

## Безопасность и практические ограничения

- Доступ к камере и микрофону вызывает стандартные запросы разрешений ОС (и требует строк описания использования в `Info.plist`).
- Продолжительность видеоклипов ограничена 60 с, чтобы избежать слишком больших данных узла (накладные расходы base64 и ограничения сообщений).

## Видео экрана macOS (на уровне ОС)

Для записи видео _экрана_ (не камеры) используйте сопутствующее приложение macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # выводит путь к сохранённому файлу
```

Требуется разрешение macOS **Screen Recording** (TCC).

## Связанные материалы

- [Поддержка изображений и медиафайлов](/ru/nodes/images)
- [Распознавание медиаданных](/ru/nodes/media-understanding)
- [Команда определения местоположения](/ru/nodes/location-command)
