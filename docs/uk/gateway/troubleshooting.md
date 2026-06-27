---
read_when:
    - Центр усунення несправностей спрямував вас сюди для глибшої діагностики
    - Вам потрібні стабільні розділи runbook на основі симптомів із точними командами
sidebarTitle: Troubleshooting
summary: Поглиблений посібник з усунення несправностей для gateway, каналів, автоматизації, вузлів і браузера
title: Усунення несправностей
x-i18n:
    generated_at: "2026-06-27T17:37:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ce8e8aed5c3e00be5b093875222962c22883472802e164534dae32adc5365c5
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Ця сторінка — поглиблений runbook. Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спершу потрібен швидкий потік тріажу.

## Драбина команд

Спершу виконайте ці команди в такому порядку:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Очікувані ознаки справного стану:

- `openclaw gateway status` показує `Runtime: running`, `Connectivity probe: ok` і рядок `Capability: ...`.
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації чи сервісу.
- `openclaw channels status --probe` показує живий транспортний статус для кожного акаунта і, де підтримується, результати проби/аудиту, як-от `works` або `audit ok`.

## Після оновлення

Використовуйте це, коли оновлення завершилося, але Gateway не працює, канали порожні або
виклики моделей починають падати з 401.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Шукайте:

- `Update restart` в `openclaw status` / `openclaw status --all`. Відкладені або
  невдалі передавання керування містять наступну команду для запуску.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`
  у розділі Channels. Це означає, що конфігурація каналу ще існує, але реєстрація Plugin
  не вдалася до того, як канал зміг завантажитися.
- 401 від провайдера після повторної автентифікації. `openclaw doctor --fix` перевіряє застарілі
  OAuth-тіні автентифікації для окремих агентів і видаляє старі копії, щоб усі агенти знаходили
  поточний спільний профіль.

## Роздвоєні інсталяції та захист від новішої конфігурації

Використовуйте це, коли сервіс Gateway несподівано зупиняється після оновлення або журнали показують, що один бінарний файл `openclaw` старіший за версію, яка востаннє записала `openclaw.json`.

OpenClaw позначає записи конфігурації через `meta.lastTouchedVersion`. Команди лише для читання все ще можуть перевіряти конфігурацію, записану новішим OpenClaw, але мутації процесів і сервісів відмовляються продовжувати роботу зі старішого бінарного файла. Заблоковані дії включають запуск, зупинку, перезапуск, видалення сервісу Gateway, примусове перевстановлення сервісу, запуск Gateway у режимі сервісу та очищення порту через `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    Виправте `PATH`, щоб `openclaw` вказував на новішу інсталяцію, а потім повторно виконайте дію.
  </Step>
  <Step title="Reinstall the gateway service">
    Перевстановіть потрібний сервіс Gateway із новішої інсталяції:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    Видаліть застарілий системний пакет або старі записи обгорток, які досі вказують на старий бінарний файл `openclaw`.
  </Step>
</Steps>

<Warning>
Лише для навмисного відкату версії або аварійного відновлення встановіть `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` для однієї команди. Для звичайної роботи залишайте цю змінну невстановленою.
</Warning>

## Невідповідність протоколу після відкату

Використовуйте це, коли журнали продовжують друкувати `protocol mismatch` після того, як ви знизили версію або відкотили OpenClaw. Це означає, що працює старіший Gateway, але новіший локальний клієнтський процес усе ще намагається повторно підключитися з діапазоном протоколу, який старіший Gateway не підтримує.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Шукайте:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` у журналах Gateway.
- `Established clients:` в `openclaw gateway status --deep` або `Gateway clients` в `openclaw doctor --deep`. Тут наведено активних TCP-клієнтів, підключених до порту Gateway, зокрема PID і командні рядки, коли ОС це дозволяє.
- Клієнтський процес, командний рядок якого вказує на новішу інсталяцію OpenClaw або обгортку, з якої ви відкотилися.

Виправлення:

1. Зупиніть або перезапустіть застарілий клієнтський процес OpenClaw, показаний у `gateway status --deep`.
2. Перезапустіть застосунки або обгортки, які вбудовують OpenClaw, як-от локальні dashboards, редактори, допоміжні app-server процеси або довготривалі оболонки `openclaw logs --follow`.
3. Повторно виконайте `openclaw gateway status --deep` або `openclaw doctor --deep` і підтвердьте, що застарілий PID клієнта зник.

Не змушуйте старіший Gateway приймати новіший несумісний протокол. Підвищення версій протоколу захищають контракт передачі; відновлення після відкату — це проблема очищення процесів/версій.

## Символічне посилання Skills пропущено як вихід за межі шляху

Використовуйте це, коли журнали містять:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw розглядає кожен корінь Skills як межу ізоляції. Символічне посилання в
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` або
`~/.openclaw/skills` пропускається, коли його реальна ціль знаходиться поза цим коренем,
якщо ціль явно не довірена.

Перевірте посилання:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Якщо ціль навмисна, налаштуйте і прямий корінь Skills, і
дозволену ціль символічного посилання:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Потім почніть нову сесію або зачекайте, доки watcher Skills оновиться. Перезапустіть
Gateway, якщо запущений процес передував зміні конфігурації.

Не використовуйте широкі цілі на кшталт `~`, `/` або цілої синхронізованої теки проєкту.
Тримайте `allowSymlinkTargets` обмеженим реальним коренем Skills, що містить довірені
каталоги `SKILL.md`.

Якщо застосування Skill Workshop також має записувати через ці довірені символічні
посилання на шляхи Skills у workspace, увімкніть `skills.workshop.allowSymlinkTargetWrites`. Залишайте
це вимкненим для спільних коренів Skills лише для читання.

Пов’язане:

- [Конфігурація Skills](/uk/tools/skills-config#symlinked-skill-roots)
- [Приклади конфігурації](/uk/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 вимагає додаткового використання для довгого контексту

Використовуйте це, коли журнали/помилки містять: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Шукайте:

- Вибрана модель Anthropic є GA-сумісною моделлю Claude 4.x на 1M, або модель має застаріле `params.context1m: true`.
- Поточні облікові дані Anthropic не мають права на використання довгого контексту.
- Запити падають лише в довгих сесіях/запусках моделей, яким потрібен шлях контексту 1M.

Варіанти виправлення:

<Steps>
  <Step title="Use a standard context window">
    Перемкніться на модель зі стандартним вікном або видаліть застаріле `context1m` зі старішої
    конфігурації моделі, яка не є GA-сумісною для контексту 1M.
  </Step>
  <Step title="Use an eligible credential">
    Використайте облікові дані Anthropic, які мають право на запити з довгим контекстом, або перемкніться на API key Anthropic.
  </Step>
  <Step title="Configure fallback models">
    Налаштуйте резервні моделі, щоб запуски продовжувалися, коли запити Anthropic із довгим контекстом відхиляються.
  </Step>
</Steps>

Пов’язане:

- [Anthropic](/uk/providers/anthropic)
- [Використання токенів і витрати](/uk/reference/token-use)
- [Чому я бачу HTTP 429 від Anthropic?](/uk/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Відповіді upstream 403 заблоковано

Використовуйте це, коли upstream LLM-провайдер повертає загальний `403`, наприклад
`Your request was blocked`.

Не припускайте, що це завжди проблема конфігурації OpenClaw. Відповідь може
надходити від upstream-рівня безпеки, як-от CDN, WAF, правило керування ботами або
reverse proxy перед OpenAI-сумісною кінцевою точкою.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Шукайте:

- кілька моделей у того самого провайдера падають однаково
- HTML або загальний текст безпеки замість звичайної помилки API провайдера
- події безпеки на боці провайдера для того самого часу запиту
- крихітна пряма проба `curl` успішна, тоді як звичайні SDK-подібні запити падають

Спершу виправте фільтрацію на боці провайдера, коли докази вказують на блокування
WAF/CDN. Надавайте перевагу вузько обмеженому правилу дозволу або пропуску для API-шляху,
який використовує OpenClaw, і уникайте вимкнення захисту для всього сайту.

<Warning>
Успішний мінімальний `curl` не гарантує, що реальні SDK-стильові запити пройдуть
через той самий upstream-рівень безпеки.
</Warning>

Пов’язане:

- [OpenAI-сумісні кінцеві точки](/uk/gateway/configuration-reference#openai-compatible-endpoints)
- [Конфігурація провайдерів](/uk/providers)
- [Журнали](/uk/logging)

## Локальний OpenAI-сумісний backend проходить прямі проби, але запуски агента падають

Використовуйте це, коли:

- `curl ... /v1/models` працює
- крихітні прямі виклики `/v1/chat/completions` працюють
- Запуски моделей OpenClaw падають лише на звичайних ходах агента

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Шукайте:

- прямі крихітні виклики успішні, але запуски OpenClaw падають лише на більших prompts
- помилки `model_not_found` або 404, хоча прямий `/v1/chat/completions`
  працює з тим самим простим id моделі
- помилки backend про те, що `messages[].content` очікує рядок
- періодичні попередження `incomplete turn detected ... stopReason=stop payloads=0` з OpenAI-сумісним локальним backend
- аварійні збої backend, які з’являються лише з більшими кількостями prompt-токенів або повними prompts runtime агента

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` з локальним MLX/vLLM-стильовим сервером → перевірте, що `baseUrl` містить `/v1`, `api` дорівнює `"openai-completions"` для backend `/v1/chat/completions`, а `models.providers.<provider>.models[].id` є простим локальним id провайдера. Вибирайте його з префіксом провайдера один раз, наприклад `mlx/mlx-community/Qwen3-30B-A3B-6bit`; залишайте запис каталогу як `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend відхиляє структуровані частини вмісту Chat Completions. Виправлення: встановіть `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` або дозволені ключі повідомлень на кшталт `["role","content"]` → backend відхиляє OpenAI-стильові метадані повторного відтворення в повідомленнях Chat Completions. Виправлення: встановіть `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend завершив запит Chat Completions, але не повернув видимого для користувача тексту асистента для цього ходу. OpenClaw один раз повторює безпечні для replay порожні OpenAI-сумісні ходи; сталі збої зазвичай означають, що backend видає порожній/нетекстовий вміст або пригнічує текст фінальної відповіді.
    - прямі крихітні запити успішні, але запуски агентів OpenClaw падають із збоями backend/моделі (наприклад, Gemma на деяких збірках `inferrs`) → транспорт OpenClaw, імовірно, уже правильний; backend падає на більшій формі prompt runtime агента.
    - збої зменшуються після вимкнення tools, але не зникають → схеми tools були частиною навантаження, але решта проблеми все ще є обмеженням upstream моделі/сервера або помилкою backend.

  </Accordion>
  <Accordion title="Fix options">
    1. Встановіть `compat.requiresStringContent: true` для backend Chat Completions, які підтримують лише рядковий вміст.
    2. Встановіть `compat.strictMessageKeys: true` для строгих backend Chat Completions, які приймають лише `role` і `content` у кожному повідомленні.
    3. Встановіть `compat.supportsTools: false` для моделей/backend, які не можуть надійно обробляти поверхню схем tools OpenClaw.
    4. Зменште тиск prompt, де це можливо: менший bootstrap workspace, коротша історія сесії, легша локальна модель або backend із сильнішою підтримкою довгого контексту.
    5. Якщо крихітні прямі запити й далі проходять, а ходи агента OpenClaw усе ще падають усередині backend, трактуйте це як обмеження upstream сервера/моделі й подайте туди repro з прийнятою формою payload.
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Конфігурація](/uk/gateway/configuration)
- [Локальні моделі](/uk/gateway/local-models)
- [OpenAI-сумісні кінцеві точки](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали працюють, але нічого не відповідає, перевірте маршрутизацію та політики, перш ніж щось перепідключати.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Шукайте:

- Pairing очікує для відправників DM.
- Обмеження згадування в групі (`requireMention`, `mentionPatterns`).
- Невідповідності allowlist каналу/групи.

Поширені ознаки:

- `drop guild message (mention required` → повідомлення групи ігнорується до згадування.
- `pairing request` → відправнику потрібне схвалення.
- `blocked` / `allowlist` → відправник/канал відфільтровано політикою.

Пов’язано:

- [Усунення проблем із каналами](/uk/channels/troubleshooting)
- [Групи](/uk/channels/groups)
- [Pairing](/uk/channels/pairing)

## Підключення Dashboard control UI

Коли dashboard/control UI не підключається, перевірте URL, режим автентифікації та припущення щодо безпечного контексту.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Шукайте:

- Правильний URL проби та URL dashboard.
- Невідповідність режиму автентифікації/токена між клієнтом і gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

Якщо локальний браузер не може підключитися до `127.0.0.1:18789` після оновлення, спершу
відновіть локальну службу Gateway і підтвердьте, що вона обслуговує dashboard:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Якщо `curl` повертає HTML OpenClaw, Gateway працює, а решта проблеми
ймовірно пов’язана з кешем браузера, старим глибоким посиланням або застарілим станом вкладки. Відкрийте
`http://127.0.0.1:18789` напряму й перейдіть із dashboard. Якщо restart
не залишає службу запущеною, виконайте `openclaw gateway start` і повторно перевірте
`openclaw gateway status`.

<AccordionGroup>
  <Accordion title="Ознаки підключення / автентифікації">
    - `device identity required` → небезпечний контекст або відсутня автентифікація пристрою.
    - `origin not allowed` → браузерний `Origin` відсутній у `gateway.controlUi.allowedOrigins` (або ви підключаєтеся з браузерного origin, що не є loopback, без явного allowlist).
    - `device nonce required` / `device nonce mismatch` → клієнт не завершує потік автентифікації пристрою на основі challenge (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → клієнт підписав неправильне корисне навантаження (або застарілу часову позначку) для поточного handshake.
    - `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим токеном пристрою.
    - Ця повторна спроба з кешованим токеном повторно використовує кешований набір scope, збережений разом із paired device token. Виклики з явним `deviceToken` / явними `scopes` натомість зберігають свій запитаний набір scope.
    - `AUTH_SCOPE_MISMATCH` → device token розпізнано, але його схвалені scopes не покривають цей запит підключення; повторно виконайте pairing або схваліть запитаний контракт scope замість ротації спільного gateway token.
    - Поза цим шляхом повторної спроби пріоритет автентифікації підключення такий: спершу явний спільний token/password, потім явний `deviceToken`, потім збережений device token, потім bootstrap token.
    - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, ip}` серіалізуються до того, як limiter записує збій. Тому дві погані паралельні повторні спроби від того самого клієнта можуть показати `retry later` на другій спробі замість двох звичайних невідповідностей.
    - `too many failed authentication attempts (retry later)` від браузерного loopback-клієнта → повторні збої з того самого нормалізованого `Origin` тимчасово заблоковано; інший localhost origin використовує окремий bucket.
    - повторне `unauthorized` після цієї повторної спроби → розходження shared token/device token; оновіть конфігурацію токена та за потреби повторно схваліть/ротейтіть device token.
    - `gateway connect failed:` → неправильний host/port/url target.

  </Accordion>
</AccordionGroup>

### Швидка мапа кодів деталей автентифікації

Використовуйте `error.details.code` з невдалої відповіді `connect`, щоб вибрати наступну дію:

| Код деталі                  | Значення                                                                                                                                                                                      | Рекомендована дія                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав потрібний shared token.                                                                                                                                                 | Вставте/задайте токен у клієнті та повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, потім вставте в налаштування Control UI.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Shared token не збігся з gateway auth token.                                                                                                                                               | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені схвалені scopes; виклики з явним `deviceToken` / `scopes` зберігають запитані scopes. Якщо помилка лишається, виконайте [контрольний список відновлення після розходження токенів](/uk/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен окремого пристрою застарів або відкликаний.                                                                                                                                                 | Ротейтіть/повторно схваліть device token за допомогою [CLI пристроїв](/uk/cli/devices), потім перепідключіться.                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | Device token дійсний, але його схвалена роль/scopes не покривають цей запит підключення.                                                                                                       | Повторно виконайте pairing пристрою або схваліть запитаний контракт scope; не трактуйте це як розходження shared-token.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | Ідентичність пристрою потребує схвалення. Перевірте `error.details.reason` на `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade` і використовуйте `requestId` / `remediationHint`, коли вони наявні. | Схваліть очікуваний запит: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Оновлення scope/ролі використовують той самий потік після перегляду запитаного доступу.                                                                                                               |

<Note>
Прямі loopback backend RPC, автентифіковані shared gateway token/password, не мають залежати від базового scope paired-device у CLI. Якщо subagents або інші внутрішні виклики все ще завершуються помилкою `scope-upgrade`, перевірте, що виклик використовує `client.id: "gateway-client"` і `client.mode: "backend"` та не примусово задає явний `deviceIdentity` або device token.
</Note>

Перевірка міграції device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо журнали показують помилки nonce/signature, оновіть клієнт, що підключається, і перевірте його:

<Steps>
  <Step title="Дочекайтеся connect.challenge">
    Клієнт чекає на виданий gateway `connect.challenge`.
  </Step>
  <Step title="Підпишіть payload">
    Клієнт підписує payload, прив’язаний до challenge.
  </Step>
  <Step title="Надішліть device nonce">
    Клієнт надсилає `connect.params.device.nonce` з тим самим challenge nonce.
  </Step>
</Steps>

Якщо `openclaw devices rotate` / `revoke` / `remove` неочікувано відхилено:

- paired-device token sessions можуть керувати лише **своїм власним** пристроєм, якщо виклик також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише operator scopes, які вже має сесія виклику

Пов’язано:

- [Конфігурація](/uk/gateway/configuration) (режими автентифікації gateway)
- [Control UI](/uk/web/control-ui)
- [Пристрої](/uk/cli/devices)
- [Віддалений доступ](/uk/gateway/remote)
- [Автентифікація trusted proxy](/uk/gateway/trusted-proxy-auth)

## Служба Gateway не запущена

Використовуйте це, коли службу встановлено, але процес не залишається запущеним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Шукайте:

- `Runtime: stopped` з підказками щодо виходу.
- Невідповідність конфігурації служби (`Config (cli)` проти `Config (service)`).
- Конфлікти port/listener.
- Додаткові встановлення launchd/systemd/schtasks, коли використовується `--deep`.
- Підказки очищення `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Поширені ознаки">
    - `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим gateway не ввімкнено, або конфігураційний файл було перезаписано й втрачено `gateway.mode`. Виправлення: задайте `gateway.mode="local"` у вашій конфігурації або повторно виконайте `openclaw onboard --mode local` / `openclaw setup`, щоб заново проставити очікувану конфігурацію локального режиму. Якщо ви запускаєте OpenClaw через Podman, типовий шлях конфігурації — `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → non-loopback bind без дійсного шляху автентифікації gateway (token/password або trusted-proxy, якщо налаштовано).
    - `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
    - `Other gateway-like services detected (best effort)` → існують застарілі або паралельні unit launchd/systemd/schtasks. У більшості налаштувань має бути один gateway на машину; якщо вам потрібно більше одного, ізолюйте порти + config/state/workspace. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` від doctor → існує systemd system unit, тоді як служба рівня користувача відсутня. Видаліть або вимкніть дублікат, перш ніж дозволити doctor встановити user service, або задайте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, якщо system unit є призначеним supervisor.
    - `Gateway service port does not match current gateway config` → встановлений supervisor досі фіксує старий `--port`. Виконайте `openclaw doctor --fix` або `openclaw gateway install --force`, потім перезапустіть службу gateway.

  </Accordion>
</AccordionGroup>

Пов’язано:

- [Фонове виконання та інструмент процесів](/uk/gateway/background-process)
- [Конфігурація](/uk/gateway/configuration)
- [Doctor](/uk/gateway/doctor)

## macOS gateway непомітно припиняє відповідати, а потім відновлюється, коли ви торкаєтеся dashboard

Використовуйте це, коли канали (Telegram, WhatsApp тощо) на macOS-хості затихають на хвилини або години, а gateway, здається, повертається саме в момент, коли ви відкриваєте Control UI, підключаєтеся через SSH або інакше взаємодієте з хостом. Зазвичай у `openclaw status` немає очевидного симптому, бо на момент перевірки gateway уже знову працює.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Шукайте:

- Один або кілька пакетів `*-uncaught_exception.json` у `~/.openclaw/logs/stability/`, де `error.code` має тимчасовий мережевий код, наприклад `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` або `ECONNREFUSED`.
- Рядки `pmset -g log` на кшталт `Entering Sleep state due to 'Maintenance Sleep'` або `en0 driver is slow (msg: WillChangeState to 0)`, що збігаються з часовими мітками аварійного завершення. Power Nap / Maintenance Sleep короткочасно переводить драйвер Wi-Fi у стан 0; будь-який вихідний `connect()`, що потрапляє в це вікно, може завершитися помилкою `ENETDOWN` навіть на хості, який загалом має повне мережеве підключення.
- Вивід `launchctl print`, що показує `state = not running` із кількома нещодавніми `runs` і кодом виходу, особливо коли проміжок між аварійним завершенням і наступним запуском становить приблизно годину, а не секунди. macOS launchd застосовує недокументований запобіжник від повторних запусків після серії аварійних завершень, який може припинити виконання `KeepAlive=true`, доки зовнішній тригер, наприклад інтерактивний вхід, підключення до панелі керування або `launchctl kickstart`, знову його не активує.

Типові ознаки:

- Пакет стабільності, де `error.code` дорівнює `ENETDOWN` або спорідненому коду, а стек викликів вказує на Node `net` `lookupAndConnect` / `Socket.connect`. OpenClaw `2026.5.26` і новіші версії класифікують їх як безпечні тимчасові мережеві помилки, тому вони більше не доходять до верхньорівневого обробника неперехоплених винятків; якщо ви використовуєте старіший випуск, спочатку оновіться.
- Довгі періоди тиші, що завершуються саме в момент підключення до інтерфейсу керування або входу на хост через SSH: видима для користувача активність повторно активує запобіжник повторного запуску launchd, а не будь-яка дія панелі керування щодо Gateway.
- Лічильник `runs` зростає протягом дня без відповідного рядка `received SIG*; shutting down` у `~/Library/Logs/openclaw/gateway.log`: коректні завершення роботи записують сигнал; тимчасові аварійні завершення цього не роблять.

Що робити:

1. **Оновіть Gateway**, якщо ви використовуєте випуск до `2026.5.26`. Після оновлення майбутні помилки `ENETDOWN` записуватимуться як попередження, а не завершуватимуть процес.
2. **Зменште активність maintenance sleep** на Mac mini / настільних хостах, які мають працювати як постійно ввімкнені сервери:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Це суттєво зменшує, але не усуває повністю, базове перемикання драйвера. Система все одно може виконувати деякі maintenance sleep для TCP keepalive і підтримки mDNS незалежно від цих прапорців.

3. **Додайте сторожовий механізм доступності**, щоб майбутня серія аварійних завершень, яку launchd залишить у зупиненому стані, швидко виявлялася:

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   Суть у тому, щоб ззовні повторно активувати запобіжник повторного запуску; одного `KeepAlive=true` на macOS після серії аварійних завершень недостатньо.

Пов’язане:

- [Примітки щодо платформи macOS](/uk/platforms/macos)
- [Журналювання](/uk/logging)
- [Doctor](/uk/gateway/doctor)

## Gateway завершується під час високого використання пам’яті

Використовуйте це, коли Gateway зникає під навантаженням, супервізор повідомляє про перезапуск у стилі OOM або журнали згадують `critical memory pressure bundle written`.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Шукайте:

- `Reason: diagnostic.memory.pressure.critical` в останньому пакеті стабільності.
- `Memory pressure:` із `critical/rss_threshold`, `critical/heap_threshold` або `critical/rss_growth`.
- Значення `V8 heap:` поблизу межі heap.
- Записи `Largest session files:`, наприклад `agents/<agent>/sessions/<session>.jsonl` або `sessions/<session>.jsonl`.
- Лічильники пам’яті cgroup Linux, коли Gateway працює всередині контейнера або служби з обмеженням пам’яті.

Типові ознаки:

- `critical memory pressure bundle written` з’являється незадовго до перезапуску → OpenClaw зібрав пакет стабільності перед OOM. Перегляньте його через `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` з’являється в журналах Gateway → OpenClaw виявив критичний тиск на пам’ять, але знімок стабільності перед OOM вимкнено.
- `Largest session files:` вказує на дуже великий шлях редагованого транскрипту → зменште збережену історію сеансів, перевірте зростання сеансу або перемістіть старі транскрипти з активного сховища перед перезапуском.
- Використані байти `V8 heap:` близькі до межі heap → зменште навантаження промптів/сеансів, скоротіть паралельну роботу або збільште межу heap Node лише після підтвердження, що навантаження очікуване.
- `Memory pressure: critical/rss_growth` → пам’ять швидко зросла в межах одного інтервалу вибірки. Перевірте останні журнали на великий імпорт, неконтрольований вивід інструмента, повторні спроби або пакет поставлених у чергу завдань агентів.
- Критичний тиск на пам’ять з’являється в журналах, але пакета немає → це типовий режим. Установіть `diagnostics.memoryPressureSnapshot: true`, щоб збирати пакет стабільності перед OOM для майбутніх подій критичного тиску на пам’ять.

Пакет стабільності не містить payload. Він включає операційні дані про пам’ять і редаговані відносні шляхи файлів, а не текст повідомлень, тіла Webhook, облікові дані, токени, cookies або необроблені ідентифікатори сеансів. Додавайте експорт діагностики до звітів про помилки замість копіювання сирих журналів.

Пов’язане:

- [Стан Gateway](/uk/gateway/health)
- [Експорт діагностики](/uk/gateway/diagnostics)
- [Сеанси](/uk/cli/sessions)

## Gateway відхилив недійсну конфігурацію

Використовуйте це, коли запуск Gateway завершується помилкою `Invalid config` або журнали гарячого перезавантаження повідомляють, що недійсну зміну пропущено.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Шукайте:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- Файл із часовою міткою `openclaw.json.rejected.*` поруч з активною конфігурацією
- Файл із часовою міткою `openclaw.json.clobbered.*`, якщо `doctor --fix` виправив пошкоджену пряму зміну
- OpenClaw зберігає останні 32 файли `.clobbered.*` для кожного шляху конфігурації та ротує старіші

<AccordionGroup>
  <Accordion title="Що сталося">
    - Конфігурація не пройшла перевірку під час запуску, гарячого перезавантаження або запису, яким керує OpenClaw.
    - Запуск Gateway завершується fail-closed замість переписування `openclaw.json`.
    - Гаряче перезавантаження пропускає недійсні зовнішні зміни та залишає поточну runtime-конфігурацію активною.
    - Записи, якими керує OpenClaw, відхиляють недійсні або руйнівні payload перед commit і зберігають `.rejected.*`.
    - `openclaw doctor --fix` відповідає за виправлення. Він може видалити префікси не-JSON або відновити останню відому справну копію, зберігаючи відхилений payload як `.clobbered.*`.
    - Коли для одного шляху конфігурації відбувається багато виправлень, OpenClaw ротує старіші файли `.clobbered.*`, щоб найновіший виправлений payload залишався доступним.

  </Accordion>
  <Accordion title="Перевірка й виправлення">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Типові ознаки">
    - `.clobbered.*` існує → doctor зберіг пошкоджену зовнішню зміну під час виправлення активної конфігурації.
    - `.rejected.*` існує → запис конфігурації, яким керує OpenClaw, не пройшов перевірки схеми або clobber-перевірки перед commit.
    - `Config write rejected:` → запис намагався прибрати обов’язкову форму, різко зменшити файл або зберегти недійсну конфігурацію.
    - `config reload skipped (invalid config):` → пряма зміна не пройшла перевірку й була проігнорована запущеним Gateway.
    - `Invalid config at ...` → запуск завершився помилкою до старту служб Gateway.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` або `size-drop-vs-last-good:*` → запис, яким керує OpenClaw, було відхилено, бо він втратив поля або розмір порівняно з останньою відомою справною резервною копією.
    - `Config last-known-good promotion skipped` → кандидат містив редаговані заповнювачі секретів, наприклад `***`.

  </Accordion>
  <Accordion title="Варіанти виправлення">
    1. Запустіть `openclaw doctor --fix`, щоб doctor виправив конфігурацію з префіксом/перезаписом або відновив останню відому справну.
    2. Скопіюйте лише потрібні ключі з `.clobbered.*` або `.rejected.*`, потім застосуйте їх через `openclaw config set` або `config.patch`.
    3. Запустіть `openclaw config validate` перед перезапуском.
    4. Якщо редагуєте вручну, зберігайте повну конфігурацію JSON5, а не лише частковий об’єкт, який хотіли змінити.
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Конфігурація](/uk/cli/config)
- [Конфігурація: гаряче перезавантаження](/uk/gateway/configuration#config-hot-reload)
- [Конфігурація: сувора перевірка](/uk/gateway/configuration#strict-validation)
- [Doctor](/uk/gateway/doctor)

## Попередження probe Gateway

Використовуйте це, коли `openclaw gateway probe` досягає чогось, але все одно друкує блок попереджень.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Шукайте:

- `warnings[].code` і `primaryTargetId` у JSON-виводі.
- Чи попередження стосується резервного SSH, кількох Gateway, відсутніх scopes або нерозв’язаних auth refs.

Типові ознаки:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH завершилося помилкою, але команда все одно спробувала прямі налаштовані/loopback цілі.
- `multiple reachable gateway identities detected` → відповіли різні Gateway або OpenClaw не зміг довести, що доступні цілі є тим самим Gateway. SSH-тунель, proxy URL або налаштований віддалений URL до того самого Gateway вважається одним Gateway із кількома транспортами, навіть коли порти транспортів відрізняються.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але детальний RPC обмежений scope; спарте ідентичність пристрою або використовуйте облікові дані з `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → підключення спрацювало, але повний набір діагностичних RPC вичерпав час або завершився помилкою. Розглядайте це як доступний Gateway із погіршеною діагностикою; порівняйте `connect.ok` і `connect.rpcOk` у виводі `--json`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → Gateway відповів, але цьому клієнту все ще потрібне pairing/approval перед звичайним operator-доступом.
- Нерозв’язаний текст попередження `gateway.auth.*` / `gateway.remote.*` SecretRef → auth-матеріал був недоступний у цьому шляху команди для цілі, що завершилася помилкою.

Пов’язане:

- [Gateway](/uk/cli/gateway)
- [Кілька Gateway на одному хості](/uk/gateway#multiple-gateways-same-host)
- [Віддалений доступ](/uk/gateway/remote)

## Канал підключено, але повідомлення не проходять

Якщо стан каналу підключений, але потік повідомлень не працює, зосередьтеся на політиці, дозволах і правилах доставлення, специфічних для каналу.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Шукайте:

- Політику DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist груп і вимоги щодо згадок.
- Відсутні дозволи/scopes API каналу.

Типові ознаки:

- `mention required` → повідомлення проігноровано політикою згадок у групі.
- Траси `pairing` / pending approval → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема auth/дозволів каналу.

Пов’язане:

- [Усунення несправностей каналів](/uk/channels/troubleshooting)
- [Discord](/uk/channels/discord)
- [Telegram](/uk/channels/telegram)
- [WhatsApp](/uk/channels/whatsapp)

## Доставлення Cron і Heartbeat

Якщо Cron або Heartbeat не запустився чи не доставився, спочатку перевірте стан планувальника, а потім ціль доставлення.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Шукайте:

- Cron увімкнено, і наявне наступне пробудження.
- Статус історії запусків завдань (`ok`, `skipped`, `error`).
- Причини пропуску Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Поширені сигнатури">
    - `cron: scheduler disabled; jobs will not run automatically` → cron вимкнено.
    - `cron: timer tick failed` → збій тику планувальника; перевірте помилки файлів/журналів/runtime.
    - `heartbeat skipped` з `reason=quiet-hours` → поза вікном активних годин.
    - `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки, коментар, заголовок, блок fence або порожній каркас контрольного списку, тому OpenClaw пропускає виклик моделі.
    - `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але жодне із завдань не має виконуватися під час цього тику.
    - `heartbeat: unknown accountId` → недійсний ідентифікатор облікового запису для цілі доставлення Heartbeat.
    - `heartbeat skipped` з `reason=dm-blocked` → ціль Heartbeat визначено як призначення у стилі DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для агента) встановлено в `block`.

  </Accordion>
</AccordionGroup>

Пов’язане:

- [Heartbeat](/uk/gateway/heartbeat)
- [Заплановані завдання](/uk/automation/cron-jobs)
- [Заплановані завдання: усунення несправностей](/uk/automation/cron-jobs#troubleshooting)

## Node спарено, інструмент не працює

Якщо node спарено, але інструменти не працюють, ізолюйте стан переднього плану, дозволів і схвалень.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Шукайте:

- Node онлайн з очікуваними можливостями.
- Надані дозволи ОС для камери/мікрофона/місцезнаходження/екрана.
- Стан схвалень виконання та списку дозволених команд.

Поширені сигнатури:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → бракує дозволу ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується схвалення виконання.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано списком дозволених.

Пов’язане:

- [Схвалення виконання](/uk/tools/exec-approvals)
- [Усунення несправностей Node](/uk/nodes/troubleshooting)
- [Nodes](/uk/nodes/index)

## Інструмент браузера не працює

Використовуйте це, коли дії інструмента браузера не працюють, хоча сам Gateway справний.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Шукайте:

- Чи встановлено `plugins.allow` і чи містить він `browser`.
- Дійсний шлях до виконуваного файлу браузера.
- Досяжність профілю CDP.
- Наявність локального Chrome для профілів `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Сигнатури Plugin / виконуваного файлу">
    - `unknown command "browser"` або `unknown command 'browser'` → вбудований browser plugin виключено через `plugins.allow`.
    - інструмент браузера відсутній / недоступний, коли `browser.enabled=true` → `plugins.allow` виключає `browser`, тому plugin ніколи не завантажився.
    - `Failed to start Chrome CDP on port` → не вдалося запустити процес браузера.
    - `browser.executablePath not found` → налаштований шлях недійсний.
    - `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему, як-от `file:` або `ftp:`.
    - `browser.cdpUrl has invalid port` → налаштований URL CDP має неправильний або поза межами допустимого діапазону порт.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → поточне встановлення gateway не має основної runtime-залежності браузера; перевстановіть або оновіть OpenClaw, а потім перезапустіть gateway. Знімки ARIA та базові знімки сторінок усе ще можуть працювати, але навігація, AI-знімки, знімки елементів за CSS-селекторами та експорт PDF залишаються недоступними.

  </Accordion>
  <Accordion title="Сигнатури Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session ще не зміг під’єднатися до вибраного каталогу даних браузера. Відкрийте сторінку інспектування браузера, увімкніть віддалене налагодження, залиште браузер відкритим, схваліть перший запит на під’єднання, а потім повторіть спробу. Якщо стан входу не потрібен, віддайте перевагу керованому профілю `openclaw`.
    - `No Chrome tabs found for profile="user"` → профіль під’єднання Chrome MCP не має відкритих локальних вкладок Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → налаштована віддалена кінцева точка CDP недосяжна з хоста gateway.
    - `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль лише для під’єднання не має досяжної цілі, або HTTP-кінцева точка відповіла, але CDP WebSocket усе одно не вдалося відкрити.

  </Accordion>
  <Accordion title="Сигнатури елементів / знімків екрана / завантажень">
    - `fullPage is not supported for element screenshots` → запит знімка екрана змішав `--full-page` з `--ref` або `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики знімків екрана Chrome MCP / `existing-session` мають використовувати захоплення сторінки або `--ref` зі знімка, а не CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → хукам завантаження Chrome MCP потрібні refs зі знімка, а не CSS-селектори.
    - `existing-session file uploads currently support one file at a time.` → надсилайте одне завантаження за виклик у профілях Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → хуки діалогів у профілях Chrome MCP не підтримують перевизначення timeout.
    - `existing-session type does not support timeoutMs overrides.` → пропустіть `timeoutMs` для `act:type` у профілях `profile="user"` / Chrome MCP existing-session або використовуйте керований/CDP-профіль браузера, коли потрібен користувацький timeout.
    - `existing-session evaluate does not support timeoutMs overrides.` → пропустіть `timeoutMs` для `act:evaluate` у профілях `profile="user"` / Chrome MCP existing-session або використовуйте керований/CDP-профіль браузера, коли потрібен користувацький timeout.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` усе ще потребує керованого браузера або сирого CDP-профілю.
    - застарілі перевизначення viewport / dark-mode / locale / offline у профілях лише для під’єднання або віддалених CDP-профілях → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активну сесію керування та звільнити стан емуляції Playwright/CDP без перезапуску всього gateway.

  </Accordion>
</AccordionGroup>

Пов’язане:

- [Браузер (керований OpenClaw)](/uk/tools/browser)
- [Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting)

## Якщо ви оновилися, і щось раптово зламалося

Більшість поломок після оновлення спричинені дрейфом конфігурації або суворішими типовими значеннями, які тепер застосовуються.

<AccordionGroup>
  <Accordion title="1. Поведінка автентифікації та перевизначення URL змінилася">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Що перевірити:

    - Якщо `gateway.mode=remote`, CLI-виклики можуть бути спрямовані на віддалений вузол, тоді як ваш локальний сервіс працює нормально.
    - Явні виклики з `--url` не повертаються до збережених облікових даних.

    Поширені сигнатури:

    - `gateway connect failed:` → неправильна ціль URL.
    - `unauthorized` → кінцева точка досяжна, але автентифікація неправильна.

  </Accordion>
  <Accordion title="2. Обмеження bind і автентифікації стали суворішими">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Що перевірити:

    - Прив’язки не до loopback (`lan`, `tailnet`, `custom`) потребують дійсного шляху автентифікації gateway: автентифікації спільним token/password або правильно налаштованого розгортання `trusted-proxy` не до loopback.
    - Старі ключі на кшталт `gateway.token` не замінюють `gateway.auth.token`.

    Поширені сигнатури:

    - `refusing to bind gateway ... without auth` → прив’язка не до loopback без дійсного шляху автентифікації gateway.
    - `Connectivity probe: failed`, коли runtime запущено → gateway працює, але недоступний із поточними auth/url.

  </Accordion>
  <Accordion title="3. Стан спарювання та ідентичності пристрою змінився">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Що перевірити:

    - Очікувані схвалення пристроїв для dashboard/nodes.
    - Очікувані схвалення спарювання DM після змін політики або ідентичності.

    Поширені сигнатури:

    - `device identity required` → автентифікацію пристрою не задоволено.
    - `pairing required` → відправника/пристрій потрібно схвалити.

  </Accordion>
</AccordionGroup>

Якщо конфігурація сервісу та runtime все ще не збігаються після перевірок, перевстановіть метадані сервісу з того самого каталогу профілю/стану:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язане:

- [Автентифікація](/uk/gateway/authentication)
- [Фонове виконання та інструмент процесів](/uk/gateway/background-process)
- [Спарювання, яким керує Gateway](/uk/gateway/pairing)

## Пов’язане

- [Doctor](/uk/gateway/doctor)
- [FAQ](/uk/help/faq)
- [Runbook Gateway](/uk/gateway)
