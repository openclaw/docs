---
read_when:
    - Налагодження автентифікації моделі або завершення терміну дії OAuth
    - Документування автентифікації або зберігання облікових даних
summary: 'Автентифікація моделей: OAuth, ключі API, повторне використання Claude CLI та setup-token Anthropic'
title: Автентифікація
x-i18n:
    generated_at: "2026-05-06T04:11:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34c83f8d2bb2016e20e5c0bbd65f8972f543aebdecdc5ad47b1f7df6d02ed783
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Ця сторінка є довідником автентифікації **постачальників моделей** (API keys, OAuth, повторне використання Claude CLI та Anthropic setup-token). Про автентифікацію **підключення Gateway** (токен, пароль, trusted-proxy) див. [Конфігурація](/uk/gateway/configuration) і [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth).
</Note>

OpenClaw підтримує OAuth і API keys для постачальників моделей. Для постійно увімкнених хостів Gateway
API keys зазвичай є найбільш передбачуваним варіантом. Потоки Subscription/OAuth
також підтримуються, коли вони відповідають моделі облікового запису вашого постачальника.

Повний потік OAuth і схему зберігання див. у [/concepts/oauth](/uk/concepts/oauth).
Для автентифікації на основі SecretRef (постачальники `env`/`file`/`exec`) див. [Керування секретами](/uk/gateway/secrets).
Правила придатності облікових даних і кодів причин, які використовує `models status --probe`, див. у
[Семантика облікових даних автентифікації](/uk/auth-credential-semantics).

## Рекомендоване налаштування (API key, будь-який постачальник)

Якщо ви запускаєте довготривалий Gateway, почніть з API key для вибраного
постачальника.
Зокрема для Anthropic автентифікація через API key досі є найбільш передбачуваним серверним
налаштуванням, але OpenClaw також підтримує повторне використання локального входу Claude CLI.

1. Створіть API key у консолі вашого постачальника.
2. Розмістіть його на **хості Gateway** (машині, на якій працює `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Якщо Gateway працює під systemd/launchd, краще помістити ключ у
   `~/.openclaw/.env`, щоб daemon міг його прочитати:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Потім перезапустіть daemon (або перезапустіть процес Gateway) і перевірте повторно:

```bash
openclaw models status
openclaw doctor
```

Якщо ви не хочете самостійно керувати env vars, onboarding може зберігати
API keys для використання daemon: `openclaw onboard`.

Докладніше про успадкування env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd) див. у [Довідці](/uk/help).

## Anthropic: сумісність Claude CLI і токенів

Автентифікація Anthropic setup-token досі доступна в OpenClaw як підтримуваний шлях
токена. Відтоді співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw
знову дозволене, тому OpenClaw вважає повторне використання Claude CLI і використання `claude -p`
санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику. Коли
повторне використання Claude CLI доступне на хості, тепер це рекомендований шлях.

Для довготривалих хостів Gateway Anthropic API key досі є найбільш передбачуваним
налаштуванням. Якщо ви хочете повторно використати наявний вхід Claude на тому самому хості, скористайтеся
шляхом Anthropic Claude CLI в onboarding/configure.

Рекомендоване налаштування хоста для повторного використання Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Це двоетапне налаштування:

1. Увійдіть у сам Claude Code в Anthropic на хості Gateway.
2. Вкажіть OpenClaw переключити вибір моделей Anthropic на локальний бекенд `claude-cli`
   і зберегти відповідний профіль автентифікації OpenClaw.

Якщо `claude` немає в `PATH`, спочатку встановіть Claude Code або задайте
`agents.defaults.cliBackends.claude-cli.command` як справжній шлях до binary.

Ручне введення токена (будь-який постачальник; записує `auth-profiles.json` + оновлює конфігурацію):

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` зберігає лише облікові дані. Канонічна форма така:

```json
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "OPENROUTER_API_KEY"
    }
  }
}
```

OpenClaw під час виконання очікує канонічну форму `version` + `profiles`. Якщо у старішій інсталяції досі є плоский файл, наприклад `{ "openrouter": { "apiKey": "..." } }`, запустіть `openclaw doctor --fix`, щоб переписати його як профіль API-key `openrouter:default`; doctor збереже копію `.legacy-flat.*.bak` поруч з оригіналом. Деталі endpoint, як-от `baseUrl`, `api`, model ids, headers і timeouts, мають бути в `models.providers.<id>` у `openclaw.json` або `models.json`, а не в `auth-profiles.json`.

Auth profile refs також підтримуються для статичних облікових даних:

- Облікові дані `api_key` можуть використовувати `keyRef: { source, provider, id }`
- Облікові дані `token` можуть використовувати `tokenRef: { source, provider, id }`
- Профілі режиму OAuth не підтримують облікові дані SecretRef; якщо `auth.profiles.<id>.mode` задано як `"oauth"`, введення `keyRef`/`tokenRef` на основі SecretRef для цього профілю відхиляється.

Перевірка, зручна для автоматизації (вихід `1`, коли прострочено/відсутнє, `2`, коли скоро прострочиться):

```bash
openclaw models status --check
```

Live-перевірки автентифікації:

```bash
openclaw models status --probe
```

Примітки:

- Рядки перевірки можуть надходити з профілів автентифікації, облікових даних env або `models.json`.
- Якщо явний `auth.order.<provider>` пропускає збережений профіль, перевірка повідомляє
  `excluded_by_auth_order` для цього профілю замість спроби його використання.
- Якщо автентифікація існує, але OpenClaw не може визначити придатний для перевірки кандидат моделі для
  цього постачальника, перевірка повідомляє `status: no_model`.
- Cooldown через rate-limit може бути прив’язаний до моделі. Профіль, який перебуває в cooldown для однієї
  моделі, може досі бути придатним для спорідненої моделі того самого постачальника.

Необов’язкові ops scripts (systemd/Termux) задокументовані тут:
[Скрипти моніторингу автентифікації](/uk/help/scripts#auth-monitoring-scripts)

## Примітка щодо Anthropic

Бекенд Anthropic `claude-cli` знову підтримується.

- Співробітники Anthropic повідомили нам, що цей шлях інтеграції OpenClaw знову дозволений.
- Тому OpenClaw вважає повторне використання Claude CLI і використання `claude -p` санкціонованими
  для запусків із підтримкою Anthropic, якщо Anthropic не опублікує нову політику.
- Anthropic API keys залишаються найбільш передбачуваним вибором для довготривалих хостів Gateway
  і явного контролю серверного білінгу.

## Перевірка стану автентифікації моделі

```bash
openclaw models status
openclaw doctor
```

## Поведінка ротації API key (Gateway)

Деякі постачальники підтримують повторну спробу запиту з альтернативними ключами, коли виклик API
досягає ліміту частоти постачальника.

- Порядок пріоритету:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одне перевизначення)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Постачальники Google також включають `GOOGLE_API_KEY` як додатковий fallback.
- Той самий список ключів дедуплікується перед використанням.
- OpenClaw повторює спробу з наступним ключем лише для помилок rate-limit (наприклад
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` або
  `workers_ai ... quota limit exceeded`).
- Помилки, не пов’язані з rate-limit, не повторюються з альтернативними ключами.
- Якщо всі ключі зазнають невдачі, повертається фінальна помилка з останньої спроби.

## Керування тим, які облікові дані використовуються

### Для сеансу (команда чату)

Використовуйте `/model <alias-or-id>@<profileId>`, щоб закріпити конкретні облікові дані постачальника для поточного сеансу (приклади profile ids: `anthropic:default`, `anthropic:work`).

Використовуйте `/model` (або `/model list`) для компактного вибору; використовуйте `/model status` для повного подання (кандидати + наступний профіль автентифікації, а також деталі endpoint постачальника, якщо налаштовано).

### Для агента (перевизначення CLI)

Задайте явне перевизначення порядку профілів автентифікації для агента (зберігається в `auth-state.json` цього агента):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Використовуйте `--agent <id>`, щоб націлитися на конкретного агента; пропустіть його, щоб використати налаштованого агента за замовчуванням.
Коли ви налагоджуєте проблеми порядку, `openclaw models status --probe` показує пропущені
збережені профілі як `excluded_by_auth_order` замість мовчазного пропуску.
Коли ви налагоджуєте проблеми cooldown, пам’ятайте, що cooldown через rate-limit може бути прив’язаний
до одного model id, а не до всього профілю постачальника.

## Усунення несправностей

### "No credentials found"

Якщо профіль Anthropic відсутній, налаштуйте Anthropic API key на
**хості Gateway** або налаштуйте шлях Anthropic setup-token, потім перевірте повторно:

```bash
openclaw models status
```

### Токен скоро прострочиться/прострочений

Запустіть `openclaw models status`, щоб підтвердити, який профіль прострочується. Якщо
профіль токена Anthropic відсутній або прострочений, оновіть це налаштування через
setup-token або перейдіть на Anthropic API key.

## Пов’язане

- [Керування секретами](/uk/gateway/secrets)
- [Віддалений доступ](/uk/gateway/remote)
- [Зберігання автентифікації](/uk/concepts/oauth)
