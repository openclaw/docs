---
read_when:
    - Вам потрібне покрокове налаштування gateway, робочої області, автентифікації, каналів і skills
summary: Довідник CLI для `openclaw onboard` (інтерактивне початкове налаштування)
title: Підключення
x-i18n:
    generated_at: "2026-07-04T20:42:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99362cdca49929f7d05c2bf7bd8b0a55811b7ad6c618be90effb8869cd2ad839
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Повне кероване початкове налаштування для локального або віддаленого налаштування Gateway. Використовуйте це, коли хочете, щоб OpenClaw провів вас через автентифікацію моделі, робочий простір, gateway, канали, skills і перевірку стану в одному потоці.

## Пов’язані посібники

<CardGroup cols={2}>
  <Card title="Центр початкового налаштування CLI" href="/uk/start/wizard" icon="rocket">
    Покроковий опис інтерактивного потоку CLI.
  </Card>
  <Card title="Огляд початкового налаштування" href="/uk/start/onboarding-overview" icon="map">
    Як початкове налаштування OpenClaw узгоджується загалом.
  </Card>
  <Card title="Довідник налаштування CLI" href="/uk/start/wizard-cli-reference" icon="book">
    Вивід, внутрішні механізми та поведінка кожного кроку.
  </Card>
  <Card title="Автоматизація CLI" href="/uk/start/wizard-cli-automation" icon="terminal">
    Неінтерактивні прапорці та скриптовані налаштування.
  </Card>
  <Card title="Початкове налаштування застосунку macOS" href="/uk/start/onboarding" icon="apple">
    Потік початкового налаштування для застосунку в рядку меню macOS.
  </Card>
</CardGroup>

## Приклади

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--flow import` використовує постачальників міграції, що належать Plugin, як-от Hermes. Він запускається лише для свіжого налаштування OpenClaw; якщо наявні конфігурація, облікові дані, сеанси або файли пам’яті/ідентичності робочого простору, скиньте їх або виберіть свіже налаштування перед імпортом.

`--modern` запускає попередній перегляд розмовного початкового налаштування Crestodian. Без
`--modern` команда `openclaw onboard` зберігає класичний потік початкового налаштування.

В інтерактивному терміналі простий `openclaw` (без підкоманди) маршрутизується за станом
конфігурації:

- Якщо активний файл конфігурації відсутній або не має авторських налаштувань (порожній або
  лише з метаданими), запускається цей класичний потік початкового налаштування.
- Якщо файл конфігурації існує, але не проходить валідацію, запускається
  [Crestodian](/uk/cli/crestodian) для виправлення.
- Якщо файл конфігурації валідний, відкривається звичайний TUI агента: локально
  або з підключенням до доступного налаштованого Gateway. У налаштованій інсталяції
  відкрийте Crestodian за допомогою `/crestodian` у TUI або `openclaw crestodian`.

Відкритий текстовий `ws://` приймається для loopback, приватних IP-літералів, `.local` і
URL Gateway Tailnet `*.ts.net`. Для інших довірених приватних DNS-імен задайте
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` в оточенні процесу початкового налаштування.

## Локаль

Інтерактивне початкове налаштування використовує локаль майстра CLI для фіксованого тексту налаштування. Порядок
визначення такий:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Резервна англійська

Підтримувані локалі майстра: `en`, `zh-CN` і `zh-TW`. Значення локалі можуть використовувати
підкреслення або форми суфіксів POSIX, як-от `zh_CN.UTF-8`. Назви продуктів, назви команд,
ключі конфігурації, URL, ID постачальників, ID моделей і мітки Plugin/каналів
залишаються буквальними.

Приклад:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Неінтерактивний власний постачальник:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` є необов’язковим у неінтерактивному режимі. Якщо його пропущено, початкове налаштування перевіряє `CUSTOM_API_KEY`.
OpenClaw автоматично позначає поширені ID моделей зору як здатні працювати із зображеннями. Передайте `--custom-image-input` для невідомих власних ID моделей зору або `--custom-text-input`, щоб примусово встановити метадані лише для тексту.
Використовуйте `--custom-compatibility openai-responses` для сумісних з OpenAI кінцевих точок, які підтримують `/v1/responses`, але не `/v1/chat/completions`.

LM Studio також підтримує прапорець ключа, специфічний для постачальника, у неінтерактивному режимі:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Неінтерактивний Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` за замовчуванням має значення `http://127.0.0.1:11434`. `--custom-model-id` є необов’язковим; якщо його пропущено, початкове налаштування використовує рекомендовані Ollama значення за замовчуванням. Хмарні ID моделей, як-от `kimi-k2.5:cloud`, також працюють тут.

Зберігайте ключі постачальників як посилання замість відкритого тексту:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

З `--secret-input-mode ref` початкове налаштування записує посилання на базі env замість значень ключів відкритим текстом.
Для постачальників на базі auth-profile це записує записи `keyRef`; для власних постачальників це записує `models.providers.<id>.apiKey` як env-посилання (наприклад `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Контракт неінтерактивного режиму `ref`:

- Задайте env-змінну постачальника в оточенні процесу початкового налаштування (наприклад `OPENAI_API_KEY`).
- Не передавайте вбудовані прапорці ключів (наприклад `--openai-api-key`), якщо ця env-змінна також не задана.
- Якщо вбудований прапорець ключа передано без потрібної env-змінної, початкове налаштування швидко завершується з помилкою та підказками.

Параметри токена Gateway у неінтерактивному режимі:

- `--gateway-auth token --gateway-token <token>` зберігає токен відкритим текстом.
- `--gateway-auth token --gateway-token-ref-env <name>` зберігає `gateway.auth.token` як env SecretRef.
- `--gateway-token` і `--gateway-token-ref-env` взаємовиключні.
- `--gateway-token-ref-env` потребує непорожньої env-змінної в оточенні процесу початкового налаштування.
- З `--install-daemon`, коли автентифікація токеном потребує токен, токени gateway, керовані SecretRef, валідовуються, але не зберігаються як розв’язаний відкритий текст у метаданих оточення служби supervisor.
- З `--install-daemon`, якщо режим токена потребує токен, а налаштований SecretRef токена нерозв’язаний, початкове налаштування закривається з відмовою та інструкціями з виправлення.
- З `--install-daemon`, якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, початкове налаштування блокує інсталяцію, доки режим не буде задано явно.
- Локальне початкове налаштування записує `gateway.mode="local"` у конфігурацію. Якщо пізніший файл конфігурації не має `gateway.mode`, розглядайте це як пошкодження конфігурації або незавершене ручне редагування, а не як валідне скорочення локального режиму.
- Локальне початкове налаштування встановлює вибрані завантажувані Plugin, коли вибраний шлях налаштування цього потребує.
- Віддалене початкове налаштування записує лише інформацію про підключення до віддаленого Gateway і не встановлює локальні пакети Plugin.
- `--allow-unconfigured` є окремим аварійним виходом для runtime gateway. Він не означає, що початкове налаштування може пропустити `gateway.mode`.

Приклад:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Стан локального gateway у неінтерактивному режимі:

- Якщо ви не передасте `--skip-health`, початкове налаштування чекатиме на доступний локальний gateway перед успішним завершенням.
- `--install-daemon` спершу запускає керований шлях інсталяції gateway. Без нього у вас уже має бути запущений локальний gateway, наприклад `openclaw gateway run`.
- Якщо в автоматизації вам потрібні лише записи конфігурації/робочого простору/bootstrap, використовуйте `--skip-health`.
- Якщо ви самі керуєте файлами робочого простору, передайте `--skip-bootstrap`, щоб задати `agents.defaults.skipBootstrap: true` і пропустити створення `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` і `BOOTSTRAP.md`.
- У нативній Windows `--install-daemon` спершу пробує Scheduled Tasks і повертається до елемента входу в папці Startup для поточного користувача, якщо створення завдання відхилено.

Поведінка інтерактивного початкового налаштування з режимом посилань:

- Виберіть **Використати посилання на секрет**, коли з’явиться запит.
- Потім виберіть одне з двох:
  - Змінна оточення
  - Налаштований постачальник секретів (`file` або `exec`)
- Початкове налаштування виконує швидку попередню валідацію перед збереженням посилання.
  - Якщо валідація не вдається, початкове налаштування показує помилку та дає змогу повторити спробу.

### Варіанти неінтерактивних кінцевих точок Z.AI

<Note>
`--auth-choice zai-api-key` автоматично визначає найкращу кінцеву точку й модель Z.AI для
вашого ключа. Кінцеві точки Coding Plan віддають перевагу `zai/glm-5.2`; загальні кінцеві точки API використовують
`zai/glm-5.1`. Щоб примусово вибрати кінцеву точку Coding Plan, виберіть `zai-coding-global` або
`zai-coding-cn`.
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Неінтерактивний приклад Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Додаткові неінтерактивні прапорці

Автентифікація моделі на основі токена (неінтерактивна; використовується з `--auth-choice token`):

- `--token-provider <id>` — ID постачальника токена. Визначає, який постачальник видає токен.
- `--token <token>` — Значення токена для автентифікації моделі.
- `--token-profile-id <id>` — ID профілю автентифікації. Типове сховище generic token за замовчуванням використовує `<provider>:manual`; потоки налаштування, що належать постачальнику, можуть використовувати власне значення за замовчуванням, як-от `anthropic:default`.
- `--token-expires-in <duration>` — Необов’язкова тривалість строку дії токена (наприклад `365d`, `12h`).

Cloudflare AI Gateway (неінтерактивно):

- `--cloudflare-ai-gateway-account-id <id>` — Cloudflare Account ID для маршрутизації через Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — Cloudflare AI Gateway ID.

Керування інсталяцією daemon:

- `--no-install-daemon` — Явно пропустити інсталяцію служби gateway.
- `--skip-daemon` — Псевдонім для `--no-install-daemon`.

Керування налаштуванням UI і hook:

- `--skip-ui` — Пропустити запити Control UI / TUI під час початкового налаштування.
- `--skip-hooks` — Пропустити запити налаштування webhook / hook під час початкового налаштування.

Приглушення виводу:

- `--suppress-gateway-token-output` — Приглушити вивід Gateway/UI, що містить токени (підказки токенів, URL автоматичного входу з вбудованим токеном і автоматичний запуск Control UI). Корисно у спільних терміналах і середовищах CI.

## Нотатки щодо потоку

<AccordionGroup>
  <Accordion title="Типи потоків">
    - `quickstart`: мінімум запитів, автоматично генерує токен gateway.
    - `manual`: повні запити для порту, прив’язки та автентифікації (псевдонім `advanced`).
    - `import`: запускає виявленого постачальника міграції, показує план, а потім застосовує його після підтвердження.

  </Accordion>
  <Accordion title="Попереднє фільтрування постачальників">
    Коли вибір автентифікації передбачає бажаного постачальника, початкове налаштування попередньо фільтрує засоби вибору моделі за замовчуванням і allowlist до цього постачальника. Для Volcengine і BytePlus це також зіставляє варіанти coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Якщо фільтр бажаного постачальника ще не дає жодної завантаженої моделі, початкове налаштування повертається до нефільтрованого каталогу замість того, щоб залишати вибір порожнім.

  </Accordion>
  <Accordion title="Подальші запити вебпошуку">
    Деякі постачальники вебпошуку запускають додаткові запити, специфічні для постачальника:

    - **Grok** може запропонувати необов’язкове налаштування `x_search` з тим самим профілем xAI OAuth або API-ключем і вибором моделі `x_search`.
    - **Kimi** може запитати регіон Moonshot API (`api.moonshot.ai` чи `api.moonshot.cn`) і модель вебпошуку Kimi за замовчуванням.

  </Accordion>
  <Accordion title="Інші поведінки">
    - Поведінка локального початкового налаштування щодо DM scope: [Довідник налаштування CLI](/uk/start/wizard-cli-reference#outputs-and-internals).
    - Найшвидший перший чат: `openclaw dashboard` (Control UI, без налаштування каналу).
    - Власний постачальник: підключіть будь-яку сумісну з OpenAI або Anthropic кінцеву точку, включно з хостинговими постачальниками, яких немає в списку. Використовуйте Unknown для автоматичного виявлення.
    - Якщо виявлено стан Hermes, початкове налаштування пропонує потік міграції. Використовуйте [Migrate](/uk/cli/migrate) для планів dry-run, режиму перезапису, звітів і точних зіставлень.

  </Accordion>
</AccordionGroup>

## Поширені подальші команди

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Використовуйте `openclaw setup` як ту саму точку входу до керованого початкового налаштування. Використовуйте `openclaw setup --baseline`, коли потрібні лише базова конфігурація/робочий простір, `openclaw configure` пізніше для цільових змін, а `openclaw channels add` для налаштування лише каналу.

<Note>
`--json` не означає неінтерактивний режим. Використовуйте `--non-interactive` для скриптів.
</Note>
