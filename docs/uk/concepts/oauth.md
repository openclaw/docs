---
read_when:
    - Ви хочете зрозуміти OAuth в OpenClaw від початку до кінця
    - Ви зіткнулися з анулюванням токенів / проблемами виходу з системи
    - Вам потрібні Claude CLI або OAuth-потоки автентифікації
    - Ви хочете використовувати кілька облікових записів або маршрутизацію профілів
summary: 'OAuth в OpenClaw: обмін токенами, зберігання та шаблони роботи з кількома обліковими записами'
title: OAuth
x-i18n:
    generated_at: "2026-04-06T15:27:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4117fee70e3e64fd3a762403454ac2b78de695d2b85a7146750c6de615921e02
    source_path: concepts/oauth.md
    workflow: 15
---

# OAuth

OpenClaw підтримує «автентифікацію за підпискою» через OAuth для провайдерів, які її пропонують
(зокрема **OpenAI Codex (ChatGPT OAuth)**). Для Anthropic практичний поділ
тепер такий:

- **Ключ API Anthropic**: звичайна тарифікація Anthropic API
- **Anthropic Claude CLI / автентифікація за підпискою всередині OpenClaw**: співробітники Anthropic
  повідомили нам, що таке використання знову дозволене

OpenAI Codex OAuth офіційно підтримується для використання у зовнішніх інструментах, таких як
OpenClaw. На цій сторінці пояснюється:

Для Anthropic у production безпечнішим рекомендованим шляхом є автентифікація за ключем API.

- як працює **обмін токенами** OAuth (PKCE)
- де **зберігаються** токени (і чому)
- як працювати з **кількома обліковими записами** (профілі + перевизначення для окремої сесії)

OpenClaw також підтримує **плагіни провайдерів**, які постачають власні OAuth- або API‑key-потоки
автентифікації. Запускайте їх через:

```bash
openclaw models auth login --provider <id>
```

## Сховище токенів (навіщо воно існує)

OAuth-провайдери зазвичай випускають **новий refresh token** під час входу або оновлення токенів. Деякі провайдери (або OAuth-клієнти) можуть анулювати старі refresh token, коли для того самого користувача/застосунку видається новий.

Практичний симптом:

- ви входите через OpenClaw _і_ через Claude Code / Codex CLI → один із них пізніше випадково «вилітає з системи»

Щоб зменшити ймовірність цього, OpenClaw розглядає `auth-profiles.json` як **сховище токенів**:

- runtime читає облікові дані з **одного місця**
- ми можемо зберігати кілька профілів і детерміновано їх маршрутизувати
- коли облікові дані повторно використовуються із зовнішнього CLI, як-от Codex CLI, OpenClaw
  дзеркалює їх разом із даними про походження та повторно зчитує це зовнішнє джерело замість того,
  щоб самостійно оновлювати refresh token

## Зберігання (де живуть токени)

Секрети зберігаються **для кожного агента окремо**:

- Профілі автентифікації (OAuth + API keys + необов’язкові посилання на значення): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Файл сумісності зі старою схемою: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (статичні записи `api_key` очищаються під час виявлення)

Старий файл лише для імпорту (досі підтримується, але не є основним сховищем):

- `~/.openclaw/credentials/oauth.json` (імпортується в `auth-profiles.json` під час першого використання)

Усе вищезазначене також враховує `$OPENCLAW_STATE_DIR` (перевизначення каталогу стану). Повна довідка: [/gateway/configuration](/uk/gateway/configuration-reference#auth-storage)

Щодо статичних посилань на секрети та поведінки активації runtime snapshot див. [Керування секретами](/uk/gateway/secrets).

## Сумісність зі старими токенами Anthropic

<Warning>
У публічній документації Anthropic для Claude Code сказано, що пряме використання Claude Code залишається в межах
лімітів підписки Claude, а співробітники Anthropic повідомили нам, що використання Claude
CLI у стилі OpenClaw знову дозволене. Тому OpenClaw вважає повторне використання Claude CLI та
використання `claude -p` санкціонованими для цієї інтеграції, якщо Anthropic
не опублікує нову політику.

Актуальну документацію Anthropic щодо планів для прямого Claude Code див. у [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
і [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Якщо вам потрібні інші варіанти в стилі підписки в OpenClaw, див. [OpenAI
Codex](/uk/providers/openai), [Qwen Cloud Coding
Plan](/uk/providers/qwen), [MiniMax Coding Plan](/uk/providers/minimax),
і [Z.AI / GLM Coding Plan](/uk/providers/glm).
</Warning>

OpenClaw також надає setup-token Anthropic як підтримуваний шлях автентифікації за токеном, але тепер надає перевагу повторному використанню Claude CLI та `claude -p`, коли це можливо.

## Міграція Anthropic Claude CLI

OpenClaw знову підтримує повторне використання Anthropic Claude CLI. Якщо у вас уже є локальний
вхід у Claude на хості, onboarding/configure може повторно використати його безпосередньо.

## OAuth exchange (як працює вхід)

Інтерактивні потоки входу OpenClaw реалізовані в `@mariozechner/pi-ai` і підключені до майстрів/команд.

### Anthropic setup-token

Форма потоку:

1. запустіть Anthropic setup-token або paste-token з OpenClaw
2. OpenClaw зберігає отримані облікові дані Anthropic у профілі автентифікації
3. вибір моделі залишається на `anthropic/...`
4. наявні профілі автентифікації Anthropic залишаються доступними для відкату/керування порядком

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth офіційно підтримується для використання поза Codex CLI, зокрема у workflow OpenClaw.

Форма потоку (PKCE):

1. згенерувати verifier/challenge PKCE + випадковий `state`
2. відкрити `https://auth.openai.com/oauth/authorize?...`
3. спробувати перехопити callback на `http://127.0.0.1:1455/auth/callback`
4. якщо callback не вдається прив’язати (або ви працюєте віддалено / без headless), вставте redirect URL/code
5. виконати exchange на `https://auth.openai.com/oauth/token`
6. витягти `accountId` з access token і зберегти `{ access, refresh, expires, accountId }`

Шлях у майстрі: `openclaw onboard` → вибір автентифікації `openai-codex`.

## Оновлення + строк дії

Профілі зберігають часову позначку `expires`.

Під час runtime:

- якщо `expires` у майбутньому → використовуйте збережений access token
- якщо строк дії минув → оновіть (під файловим блокуванням) і перезапишіть збережені облікові дані
- виняток: повторно використані облікові дані зовнішнього CLI залишаються під зовнішнім керуванням; OpenClaw
  повторно зчитує сховище автентифікації CLI і ніколи сам не витрачає скопійований refresh token

Потік оновлення автоматичний; зазвичай вам не потрібно керувати токенами вручну.

## Кілька облікових записів (профілі) + маршрутизація

Два шаблони:

### 1) Бажано: окремі агенти

Якщо ви хочете, щоб «особистий» і «робочий» ніколи не взаємодіяли, використовуйте ізольованих агентів (окремі сесії + облікові дані + робочий простір):

```bash
openclaw agents add work
openclaw agents add personal
```

Потім налаштуйте автентифікацію для кожного агента окремо (майстер) і маршрутизуйте чати до потрібного агента.

### 2) Розширено: кілька профілів в одному агенті

`auth-profiles.json` підтримує кілька ID профілів для одного провайдера.

Вибрати, який профіль використовується:

- глобально через порядок у конфігурації (`auth.order`)
- для окремої сесії через `/model ...@<profileId>`

Приклад (перевизначення для сесії):

- `/model Opus@anthropic:work`

Як побачити, які ID профілів існують:

- `openclaw channels list --json` (показує `auth[]`)

Пов’язані документи:

- [/concepts/model-failover](/uk/concepts/model-failover) (правила ротації + cooldown)
- [/tools/slash-commands](/uk/tools/slash-commands) (поверхня команд)

## Пов’язане

- [Автентифікація](/uk/gateway/authentication) — огляд автентифікації провайдерів моделей
- [Секрети](/uk/gateway/secrets) — зберігання облікових даних і SecretRef
- [Довідник з конфігурації](/uk/gateway/configuration-reference#auth-storage) — ключі конфігурації автентифікації
