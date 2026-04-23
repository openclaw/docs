---
read_when:
    - Ви хочете зрозуміти OAuth в OpenClaw наскрізно
    - Ви зіткнулися з проблемами інвалідизації токена / виходу з акаунта
    - Ви хочете потоки автентифікації Claude CLI або OAuth
    - Вам потрібні кілька акаунтів або маршрутизація профілів
summary: 'OAuth в OpenClaw: обмін токенами, зберігання та шаблони для кількох акаунтів'
title: OAuth
x-i18n:
    generated_at: "2026-04-23T20:50:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81b8891850123c32a066dbfb855feb132bc1f2bbc694f10ee2797b694bd5d848
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw підтримує «автентифікацію за підпискою» через OAuth для provider-ів, які це пропонують
(зокрема **OpenAI Codex (ChatGPT OAuth)**). Для Anthropic практичний поділ
тепер такий:

- **API key Anthropic**: звичайне білінгування Anthropic API
- **Anthropic Claude CLI / автентифікація за підпискою всередині OpenClaw**: співробітники Anthropic
  повідомили нам, що таке використання знову дозволене

OpenAI Codex OAuth явно підтримується для використання у зовнішніх інструментах, таких як
OpenClaw. Ця сторінка пояснює:

Для Anthropic у production безпечнішим рекомендованим шляхом є автентифікація через API key.

- як працює OAuth **обмін токенами** (PKCE)
- де **зберігаються** токени (і чому)
- як працювати з **кількома акаунтами** (профілі + перевизначення для кожної session)

OpenClaw також підтримує **Plugin-и provider-ів**, які постачають власні потоки OAuth або API‑key.
Запускайте їх так:

```bash
openclaw models auth login --provider <id>
```

## Token sink (навіщо він існує)

OAuth provider-и часто випускають **новий refresh token** під час потоків входу/оновлення. Деякі provider-и (або OAuth clients) можуть інвалідовувати старі refresh token-и, коли для того самого користувача/застосунку випускається новий.

Практичний симптом:

- ви входите через OpenClaw _і_ через Claude Code / Codex CLI → один із них випадково пізніше «вилітає з акаунта»

Щоб зменшити це, OpenClaw розглядає `auth-profiles.json` як **token sink**:

- runtime читає облікові дані **з одного місця**
- ми можемо зберігати кілька профілів і маршрутизувати їх детерміновано
- коли облікові дані повторно використовуються із зовнішнього CLI, такого як Codex CLI, OpenClaw
  дзеркалить їх із provenance і повторно читає це зовнішнє джерело замість
  самостійного обертання refresh token

## Зберігання (де живуть токени)

Секрети зберігаються **для кожного агента окремо**:

- Профілі автентифікації (OAuth + API keys + необов’язкові посилання на значення): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Застарілий файл сумісності: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (статичні записи `api_key` очищуються при виявленні)

Застарілий файл лише для імпорту (усе ще підтримується, але не є основним сховищем):

- `~/.openclaw/credentials/oauth.json` (імпортується в `auth-profiles.json` під час першого використання)

Усе вищенаведене також враховує `$OPENCLAW_STATE_DIR` (перевизначення каталогу стану). Повний довідник: [/gateway/configuration](/uk/gateway/configuration-reference#auth-storage)

Для статичних secret refs і поведінки активації runtime snapshot див. [Керування секретами](/uk/gateway/secrets).

## Сумісність зі застарілими токенами Anthropic

<Warning>
Публічна документація Anthropic для Claude Code стверджує, що пряме використання Claude Code залишається в межах
лімітів підписки Claude, а співробітники Anthropic повідомили нам, що використання
Claude CLI у стилі OpenClaw знову дозволене. Тому OpenClaw розглядає повторне використання Claude CLI і
використання `claude -p` як санкціоновані для цієї інтеграції, якщо Anthropic
не опублікує нову політику.

Для поточної документації Anthropic щодо планів прямого використання Claude Code див. [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
і [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Якщо вам потрібні інші варіанти в стилі підписки в OpenClaw, див. [OpenAI
Codex](/uk/providers/openai), [Qwen Cloud Coding
Plan](/uk/providers/qwen), [MiniMax Coding Plan](/uk/providers/minimax),
і [Z.AI / GLM Coding Plan](/uk/providers/glm).
</Warning>

OpenClaw також надає setup-token Anthropic як підтримуваний шлях автентифікації за токеном, але тепер він надає перевагу повторному використанню Claude CLI і `claude -p`, коли це доступно.

## Міграція Anthropic Claude CLI

OpenClaw знову підтримує повторне використання Anthropic Claude CLI. Якщо у вас уже є локальний
вхід Claude на хості, onboarding/configure може повторно використати його напряму.

## OAuth exchange (як працює вхід)

Інтерактивні потоки входу OpenClaw реалізовано в `@mariozechner/pi-ai` і підключено до wizard-ів/команд.

### Anthropic setup-token

Форма потоку:

1. запустіть Anthropic setup-token або paste-token з OpenClaw
2. OpenClaw зберігає отримані облікові дані Anthropic у профілі автентифікації
3. вибір моделі залишається на `anthropic/...`
4. наявні профілі автентифікації Anthropic залишаються доступними для rollback/керування порядком

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth явно підтримується для використання поза Codex CLI, включно з робочими процесами OpenClaw.

Форма потоку (PKCE):

1. згенерувати verifier/challenge PKCE + випадковий `state`
2. відкрити `https://auth.openai.com/oauth/authorize?...`
3. спробувати перехопити callback на `http://127.0.0.1:1455/auth/callback`
4. якщо callback не може прив’язатися (або ви працюєте віддалено/безголово), вставити redirect URL/code вручну
5. обміняти на `https://auth.openai.com/oauth/token`
6. витягти `accountId` з access token і зберегти `{ access, refresh, expires, accountId }`

Шлях wizard-а: `openclaw onboard` → вибір автентифікації `openai-codex`.

## Refresh + expiry

Профілі зберігають часову мітку `expires`.

Під час виконання:

- якщо `expires` у майбутньому → використовується збережений access token
- якщо строк дії сплив → виконується refresh (під блокуванням файла) і збережені облікові дані перезаписуються
- виняток: повторно використані облікові дані зовнішнього CLI залишаються під зовнішнім керуванням; OpenClaw
  повторно читає сховище автентифікації CLI і ніколи сам не витрачає скопійований refresh token

Потік refresh є автоматичним; зазвичай вам не потрібно керувати токенами вручну.

## Кілька акаунтів (профілі) + маршрутизація

Два шаблони:

### 1) Бажано: окремі агенти

Якщо ви хочете, щоб «personal» і «work» ніколи не взаємодіяли, використовуйте ізольованих агентів (окремі sessions + облікові дані + workspace):

```bash
openclaw agents add work
openclaw agents add personal
```

Потім налаштуйте автентифікацію для кожного агента окремо (через wizard) і маршрутизуйте чати до правильного агента.

### 2) Розширений варіант: кілька профілів в одному агенті

`auth-profiles.json` підтримує кілька profile ID для того самого provider.

Вибір профілю:

- глобально через порядок у конфігурації (`auth.order`)
- для окремої session через `/model ...@<profileId>`

Приклад (перевизначення для session):

- `/model Opus@anthropic:work`

Як побачити, які profile ID існують:

- `openclaw channels list --json` (показує `auth[]`)

Пов’язані документи:

- [/concepts/model-failover](/uk/concepts/model-failover) (правила ротації + cooldown)
- [/tools/slash-commands](/uk/tools/slash-commands) (поверхня команд)

## Пов’язане

- [Автентифікація](/uk/gateway/authentication) — огляд автентифікації provider-ів моделей
- [Секрети](/uk/gateway/secrets) — зберігання облікових даних і SecretRef
- [Довідник конфігурації](/uk/gateway/configuration-reference#auth-storage) — ключі конфігурації автентифікації
