---
read_when:
    - Додавання або зміна захоплення з камери на вузлах iOS/Android чи macOS
    - Розширення робочих процесів із тимчасовими файлами MEDIA, доступними агенту
summary: 'Знімання камерою (вузли iOS/Android + застосунок macOS) для використання агентом: фотографії (jpg) і короткі відеокліпи (mp4)'
title: Знімання камерою
x-i18n:
    generated_at: "2026-07-12T13:20:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw підтримує знімання камерою для робочих процесів агента на спарених вузлах **iOS**, **Android** і **macOS**: створення фотографії (`jpg`) або короткого відеокліпу (`mp4`, із необов’язковим звуком) через Gateway `node.invoke`.

Доступ до камери на кожній платформі контролюється налаштуванням користувача.

## Вузол iOS

### Налаштування користувача iOS

- Вкладка iOS Settings → **Camera** → **Allow Camera** (`camera.enabled`).
  - Типове значення: **увімкнено** (відсутній ключ вважається ввімкненим).
  - Коли вимкнено: команди `camera.*` повертають `CAMERA_DISABLED`.

### Команди iOS (через Gateway `node.invoke`)

- `camera.list`
  - Дані відповіді: `devices` — масив `{ id, name, position, deviceType }`.

- `camera.snap`
  - Параметри:
    - `facing`: `front|back` (типово: `front`)
    - `maxWidth`: число (необов’язково; типово `1600`)
    - `quality`: `0..1` (необов’язково; типово `0.9`, обмежується діапазоном `[0.05, 1.0]`)
    - `format`: наразі `jpg`
    - `delayMs`: число (необов’язково; типово `0`, внутрішнє максимальне значення — `10000`)
    - `deviceId`: рядок (необов’язково; з `camera.list`)
  - Дані відповіді: `format: "jpg"`, `base64`, `width`, `height`.
  - Обмеження даних: фотографії повторно стискаються, щоб розмір закодованих у base64 даних не перевищував 5 МБ.

- `camera.clip`
  - Параметри:
    - `facing`: `front|back` (типово: `front`)
    - `durationMs`: число (типово `3000`, обмежується діапазоном `[250, 60000]`)
    - `includeAudio`: логічне значення (типово `true`)
    - `format`: наразі `mp4`
    - `deviceId`: рядок (необов’язково; з `camera.list`)
  - Дані відповіді: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### Вимога активного режиму для iOS

Як і `canvas.*`, вузол iOS дозволяє команди `camera.*` лише в **активному режимі**. Виклики у фоновому режимі повертають `NODE_BACKGROUND_UNAVAILABLE`.

### Допоміжна команда CLI

Найпростіше отримати медіафайли за допомогою допоміжної команди CLI, яка записує декодовані медіадані до тимчасового файлу та виводить шлях до нього.

```bash
openclaw nodes camera snap --node <id>                 # типово: обидві камери — передня та задня (2 рядки MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Для `nodes camera snap` типовим значенням є `--facing both`, тому знімки створюються як передньою, так і задньою камерою, щоб агент отримав обидва ракурси; параметр `--device-id` слід передавати з одним явно вказаним напрямком камери (`both` відхиляється, якщо встановлено `--device-id`). Файли результатів є тимчасовими (у каталозі тимчасових файлів ОС), якщо ви не створите власну обгортку.

## Вузол Android

### Налаштування користувача Android

- Панель Android Settings → **Camera** → **Allow Camera** (`camera.enabled`).
  - **Для нових установлень типово вимкнено.** Наявні встановлення, які передують появі цього налаштування, мігрують до стану **увімкнено**, щоб після оновлення не втратити без попередження доступ до камери, який раніше працював.
  - Коли вимкнено: команди `camera.*` повертають `CAMERA_DISABLED: enable Camera in Settings`.

### Дозволи

- `CAMERA` потрібен як для `camera.snap`, так і для `camera.clip`; якщо дозволу немає або його відхилено, повертається `CAMERA_PERMISSION_REQUIRED`.
- `RECORD_AUDIO` потрібен для `camera.clip`, коли `includeAudio` має значення `true`; якщо дозволу немає або його відхилено, повертається `MIC_PERMISSION_REQUIRED`.

Коли це можливо, застосунок запитує дозволи під час виконання.

### Вимога активного режиму для Android

Як і `canvas.*`, вузол Android дозволяє команди `camera.*` лише в **активному режимі**. Виклики у фоновому режимі повертають `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### Команди Android (через Gateway `node.invoke`)

- `camera.list`
  - Дані відповіді: `devices` — масив `{ id, name, position, deviceType }`.

- `camera.snap`
  - Параметри: `facing` (`front|back`, типово `front`), `quality` (типово `0.95`, обмежується діапазоном `[0.1, 1.0]`), `maxWidth` (типово `1600`), `deviceId` (необов’язково; невідомий ідентифікатор спричиняє помилку `INVALID_REQUEST`).
  - Дані відповіді: `format: "jpg"`, `base64`, `width`, `height`.
  - Обмеження даних: повторне стиснення, щоб обсяг base64 не перевищував 5 МБ (такий самий ліміт, як в iOS).

- `camera.clip`
  - Параметри: `facing` (типово `front`), `durationMs` (типово `3000`, обмежується діапазоном `[200, 60000]`), `includeAudio` (типово `true`), `deviceId` (необов’язково).
  - Дані відповіді: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Обмеження даних: розмір необробленого MP4 перед кодуванням у base64 обмежено 18 МБ; для завеликих кліпів повертається помилка `PAYLOAD_TOO_LARGE` (зменште `durationMs` і повторіть спробу).

## Застосунок macOS

### Налаштування користувача macOS

Супровідний застосунок macOS надає прапорець:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - Типове значення: **вимкнено**.
  - Коли вимкнено: запити до камери повертають `CAMERA_DISABLED: enable Camera in Settings`.

### Допоміжна команда CLI (виклик вузла)

Використовуйте основний CLI `openclaw`, щоб викликати команди камери на вузлі macOS.

```bash
openclaw nodes camera list --node <id>                     # вивести ідентифікатори камер
openclaw nodes camera snap --node <id>                     # виводить шлях до збереженого файлу
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # виводить шлях до збереженого файлу
openclaw nodes camera clip --node <id> --duration-ms 3000   # виводить шлях до збереженого файлу (застарілий прапорець)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- Для `openclaw nodes camera snap` типовим значенням є `maxWidth=1600`, якщо його не перевизначено.
- `camera.snap` очікує протягом `delayMs` (типово 2000 мс, обмежується діапазоном `[0, 10000]`) після прогрівання та стабілізації експозиції, перш ніж зробити знімок.
- Фотографії повторно стискаються, щоб обсяг base64 не перевищував 5 МБ.

## Безпека та практичні обмеження

- Доступ до камери й мікрофона спричиняє звичайні запити дозволів ОС (і потребує рядків опису використання в `Info.plist`).
- Тривалість відеокліпів обмежена 60 с, щоб уникнути завеликих даних вузла (накладні витрати base64 разом з обмеженнями повідомлень).

## Відеозапис екрана macOS (на рівні ОС)

Для відеозапису _екрана_ (не камери) використовуйте супровідний застосунок macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # виводить шлях до збереженого файлу
```

Потрібен дозвіл macOS **Screen Recording** (TCC).

## Пов’язані матеріали

- [Підтримка зображень і медіаданих](/uk/nodes/images)
- [Розуміння медіаданих](/uk/nodes/media-understanding)
- [Команда визначення розташування](/uk/nodes/location-command)
