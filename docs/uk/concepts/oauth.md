---
read_when:
    - Ви хочете зрозуміти OAuth в OpenClaw наскрізно
    - Ви зіткнулися з проблемами інвалідації токенів / виходу з системи
    - Вам потрібні потоки автентифікації Claude CLI або OAuth
    - Вам потрібні кілька облікових записів або маршрутизація профілів
summary: 'OAuth в OpenClaw: обмін токенами, зберігання та шаблони з кількома обліковими записами'
title: OAuth
x-i18n:
    generated_at: "2026-04-25T05:55:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: c793c52f48a3f49c0677d8e55a84c2bf5cdf0d385e6a858f26c0701d45583211
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw підтримує «subscription auth» через OAuth для провайдерів, які це пропонують
(зокрема **OpenAI Codex (ChatGPT OAuth)**). Для Anthropic практичний поділ
тепер такий:

- **Anthropic API key**: звичайна тарифікація Anthropic API
- **Anthropic Claude CLI / subscription auth всередині OpenClaw**: співробітники Anthropic
  повідомили нам, що таке використання знову дозволене

OpenAI Codex OAuth явно підтримується для використання у зовнішніх інструментах, як-от
OpenClaw. На цій сторінці пояснюється:

Для Anthropic у production безпечнішим рекомендованим шляхом є автентифікація через API key.

- як працює OAuth **обмін токенами** (PKCE)
- де **зберігаються** токени (і чому)
- як працювати з **кількома обліковими записами** (профілі + перевизначення для окремої сесії)

OpenClaw також підтримує **provider plugins**, які постачають власні потоки OAuth або API‑key
автентифікації. Запускайте їх через:

```bash
openclaw models auth login --provider <id>
```

## Сховище токенів (навіщо воно існує)

Провайдери OAuth часто випускають **новий refresh token** під час входу або оновлення. Деякі провайдери (або OAuth clients) можуть анулювати старі refresh token, коли для того самого користувача/застосунку видається новий.

Практичний симптом:

- ви входите через OpenClaw _і_ через Claude Code / Codex CLI → один із них згодом випадково «виходить із системи»

Щоб зменшити це, OpenClaw розглядає `auth-profiles.json` як **сховище токенів**:

- runtime читає облікові дані **з одного місця**
- ми можемо зберігати кілька профілів і маршрутизувати їх детерміновано
- повторне використання зовнішнього CLI залежить від провайдера: Codex CLI може ініціалізувати порожній
  профіль `openai-codex:default`, але щойно OpenClaw має локальний профіль OAuth,
  локальний refresh token стає канонічним; інші інтеграції можуть залишатися
  під зовнішнім керуванням і повторно читати своє сховище автентифікації CLI

## Зберігання (де живуть токени)

Секрети зберігаються **для кожного агента окремо**:

- Профілі автентифікації (OAuth + API keys + необов’язкові refs на рівні значень): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Файл сумісності зі застарілою схемою: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (статичні записи `api_key` очищаються при виявленні)

Застарілий файл лише для імпорту (досі підтримується, але не є основним сховищем):

- `~/.openclaw/credentials/oauth.json` (імпортується в `auth-profiles.json` під час першого використання)

Усе перелічене також враховує `$OPENCLAW_STATE_DIR` (перевизначення каталогу стану). Повний довідник: [/gateway/configuration](/uk/gateway/configuration-reference#auth-storage)

Для статичних secret refs і поведінки активації знімків runtime див. [Керування секретами](/uk/gateway/secrets).

## Сумісність зі застарілим токеном Anthropic

<Warning>
У публічній документації Claude Code від Anthropic сказано, що пряме використання Claude Code залишається в межах
лімітів підписки Claude, а співробітники Anthropic повідомили нам, що використання Claude
CLI у стилі OpenClaw знову дозволене. Тому OpenClaw розглядає повторне використання Claude CLI та
використання `claude -p` як санкціоновані для цієї інтеграції, якщо Anthropic
не опублікує нову політику.

Щодо актуальної документації Anthropic про плани для прямого Claude Code див. [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
і [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Якщо вам потрібні інші варіанти в стилі підписки в OpenClaw, див. [OpenAI
Codex](/uk/providers/openai), [Qwen Cloud Coding
Plan](/uk/providers/qwen), [MiniMax Coding Plan](/uk/providers/minimax),
і [Z.AI / GLM Coding Plan](/uk/providers/glm).
</Warning>

OpenClaw також надає setup-token Anthropic як підтримуваний шлях автентифікації за токеном, але тепер надає перевагу повторному використанню Claude CLI та `claude -p`, коли це доступно.

## Міграція Anthropic Claude CLI

OpenClaw знову підтримує повторне використання Anthropic Claude CLI. Якщо у вас уже є локальний
вхід Claude на хості, onboarding/configure може повторно використати його напряму.

## OAuth exchange (як працює вхід)

Інтерактивні потоки входу OpenClaw реалізовані в `@mariozechner/pi-ai` і підключені до майстрів/команд.

### Setup-token Anthropic

Форма потоку:

1. запустіть setup-token Anthropic або вставте токен з OpenClaw
2. OpenClaw зберігає отримані облікові дані Anthropic у профілі автентифікації
3. вибір моделі залишається на `anthropic/...`
4. наявні профілі автентифікації Anthropic залишаються доступними для відкату/керування порядком

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth явно підтримується для використання поза Codex CLI, зокрема у workflow OpenClaw.

Форма потоку (PKCE):

1. згенерувати verifier/challenge PKCE + випадковий `state`
2. відкрити `https://auth.openai.com/oauth/authorize?...`
3. спробувати перехопити callback на `http://127.0.0.1:1455/auth/callback`
4. якщо callback не може прив’язатися (або ви працюєте віддалено/headless), вставте redirect URL/code
5. виконати обмін на `https://auth.openai.com/oauth/token`
6. витягнути `accountId` з access token і зберегти `{ access, refresh, expires, accountId }`

Шлях у майстрі: `openclaw onboard` → вибір автентифікації `openai-codex`.

## Refresh + строк дії

Профілі зберігають часову позначку `expires`.

У runtime:

- якщо `expires` у майбутньому → використовується збережений access token
- якщо строк дії минув → виконується оновлення (під file lock) і збережені облікові дані перезаписуються
- виняток: деякі облікові дані зовнішнього CLI залишаються під зовнішнім керуванням; OpenClaw
  повторно читає ці сховища автентифікації CLI замість використання скопійованих refresh token.
  Bootstrap Codex CLI навмисно вужчий: він ініціалізує порожній
  профіль `openai-codex:default`, а потім оновлення під керуванням OpenClaw зберігають локальний
  профіль як канонічний.

Потік оновлення автоматичний; зазвичай вам не потрібно керувати токенами вручну.

## Кілька облікових записів (профілі) + маршрутизація

Два шаблони:

### 1) Бажано: окремі агенти

Якщо ви хочете, щоб «особистий» і «робочий» ніколи не перетиналися, використовуйте ізольованих агентів (окремі сесії + облікові дані + workspace):

```bash
openclaw agents add work
openclaw agents add personal
```

Потім налаштуйте автентифікацію для кожного агента окремо (майстер) і маршрутизуйте чати до потрібного агента.

### 2) Розширено: кілька профілів в одному агенті

`auth-profiles.json` підтримує кілька ідентифікаторів профілів для одного й того самого провайдера.

Вибір профілю:

- глобально через порядок у config (`auth.order`)
- для окремої сесії через `/model ...@<profileId>`

Приклад (перевизначення для сесії):

- `/model Opus@anthropic:work`

Як побачити, які ідентифікатори профілів існують:

- `openclaw channels list --json` (показує `auth[]`)

Пов’язані документи:

- [Перемикання моделей при відмові](/uk/concepts/model-failover) (правила ротації + cooldown)
- [Слеш-команди](/uk/tools/slash-commands) (поверхня команд)

## Пов’язане

- [Автентифікація](/uk/gateway/authentication) — огляд автентифікації провайдерів моделей
- [Секрети](/uk/gateway/secrets) — зберігання облікових даних і SecretRef
- [Довідник з конфігурації](/uk/gateway/configuration-reference#auth-storage) — ключі config для автентифікації
