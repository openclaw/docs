---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до виклику Google Meet
    - Ви налаштовуєте Chrome або Twilio як транспорт Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio із типовими налаштуваннями голосу в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T02:07:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a3b040007d09f1bc13aea1b046868b85c39380f287b1185e644cb8b83761bf5
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Підтримка учасників Google Meet для OpenClaw.

Plugin є навмисно явним:

- Він приєднується лише до явного URL `https://meet.google.com/...`.
- Голос `realtime` є режимом за замовчуванням.
- Голос у режимі реального часу може повертатися до повного агента OpenClaw, коли потрібні глибші міркування або інструменти.
- Автентифікація починається з особистого Google OAuth або вже виконаного входу в профіль Chrome.
- Автоматичного оголошення згоди немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Twilio приймає номер для дозвону, а також необов’язковий PIN або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших сценаріїв телеконференцій агентів.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL Meet у Google Chrome і приєднується як профіль Chrome, у якому виконано вхід. У macOS Plugin перед запуском перевіряє наявність `BlackHole 2ch`. Якщо це налаштовано, він також запускає команду перевірки стану аудіомоста та команду запуску перед відкриттям Chrome.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
```

Спрямуйте аудіо мікрофона та динаміка Chrome через локальний аудіоміст OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування, а не тихим приєднанням без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план набору, делегований Plugin Voice Call. Він не аналізує сторінки Meet у пошуку телефонних номерів.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Використовуйте `--dtmf-sequence`, якщо зустріч потребує спеціальної послідовності:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth і попередня перевірка

Доступ до Google Meet Media API спочатку використовує особистий клієнт OAuth. Налаштуйте `oauth.clientId` і, за бажання, `oauth.clientSecret`, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` з токеном оновлення. Вона використовує PKCE, локальний callback на `http://localhost:8085/oauth2callback` і ручний потік копіювання/вставлення з `--manual`.

Ці змінні середовища приймаються як резервні варіанти:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` або `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` або `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` або
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` або `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` або `GOOGLE_MEET_PREVIEW_ACK`

Розв’яжіть URL Meet, код або `spaces/{id}` через `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Запускайте попередню перевірку перед роботою з медіа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud project, принципал OAuth і учасники зустрічі зареєстровані в Google Workspace Developer Preview Program для медіа-API Meet.

## Конфігурація

Поширений шлях Chrome realtime потребує лише ввімкненого Plugin, BlackHole, SoX і ключа OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
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
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: команда SoX `rec`, яка записує аудіо 8 кГц G.711 mu-law у stdout
- `chrome.audioOutputCommand`: команда SoX `play`, яка читає аудіо 8 кГц G.711 mu-law зі stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з
  `openclaw_agent_consult` для глибших відповідей

Необов’язкові перевизначення:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
  },
  realtime: {
    toolPolicy: "owner",
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
  "transport": "chrome",
  "mode": "realtime"
}
```

Використовуйте `action: "status"`, щоб перелічити активні сесії або перевірити ідентифікатор сесії. Використовуйте `action: "leave"`, щоб позначити сесію як завершену.

## Консультація агента в режимі реального часу

Режим Chrome realtime оптимізований для живого голосового циклу. Постачальник голосу в режимі реального часу чує аудіо зустрічі та говорить через налаштований аудіоміст. Коли моделі реального часу потрібні глибші міркування, актуальна інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw у фоновому режимі з контекстом нещодавньої стенограми зустрічі та повертає стислу усну відповідь у голосову сесію реального часу. Потім голосова модель може озвучити цю відповідь назад у зустрічі.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: надає інструмент консультації та обмежує звичайного агента інструментами
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: надає інструмент консультації та дозволяє звичайному агенту використовувати стандартну політику інструментів агента.
- `none`: не надає інструмент консультації голосовій моделі реального часу.

Ключ сесії консультації має область дії в межах кожної сесії Meet, тому подальші виклики консультації можуть повторно використовувати попередній контекст консультацій під час тієї самої зустрічі.

## Примітки

Офіційний медіа-API Google Meet орієнтований на прийом, тому для мовлення у виклик Meet усе ще потрібен шлях участі. Цей Plugin робить цю межу видимою: Chrome забезпечує участь через браузер і локальне маршрутизування аудіо; Twilio забезпечує участь через телефонний дозвін.

Режим Chrome realtime потребує одного з таких варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує мостом моделі реального часу та передає аудіо 8 кГц G.711 mu-law між цими командами та вибраним постачальником голосу реального часу.
- `chrome.audioBridgeCommand`: зовнішня команда мосту керує всім локальним аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого двостороннього аудіо спрямовуйте вихід Meet і мікрофон Meet через окремі віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний пристрій BlackHole може повертати голоси інших учасників назад у виклик.

`googlemeet leave` зупиняє аудіоміст реального часу на парі команд для сесій Chrome. Для сесій Twilio, делегованих через Plugin Voice Call, команда також завершує базовий голосовий виклик.
