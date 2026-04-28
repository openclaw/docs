---
read_when:
    - Налагодження автентифікації моделі або завершення терміну дії OAuth
    - Документування автентифікації або зберігання облікових даних
summary: 'Автентифікація моделей: OAuth, ключі API, повторне використання Claude CLI та setup-token Anthropic'
title: Автентифікація
x-i18n:
    generated_at: "2026-04-28T11:09:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 225adf26963183f8b5ecc76ca7bdc143f6a8800797fbd4be9d53d65b434f36c7
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Ця сторінка є довідником автентифікації **model provider** (ключі API, OAuth, повторне використання Claude CLI та setup-token Anthropic). Для автентифікації **підключення до Gateway** (токен, пароль, trusted-proxy) див. [Конфігурація](/uk/gateway/configuration) і [Автентифікація Trusted Proxy](/uk/gateway/trusted-proxy-auth).
</Note>

OpenClaw підтримує OAuth і ключі API для model provider. Для постійно ввімкнених
хостів Gateway ключі API зазвичай є найпередбачуванішим варіантом. Потоки
передплати/OAuth також підтримуються, коли вони відповідають моделі облікового
запису вашого провайдера.

Див. [/concepts/oauth](/uk/concepts/oauth), щоб отримати повний опис потоку OAuth і
структури зберігання.
Для автентифікації на основі SecretRef (провайдери `env`/`file`/`exec`) див. [Керування секретами](/uk/gateway/secrets).
Правила придатності облікових даних/кодів причин, які використовує `models status --probe`, див. у
[Семантика облікових даних автентифікації](/uk/auth-credential-semantics).

## Рекомендоване налаштування (ключ API, будь-який провайдер)

Якщо ви запускаєте довготривалий Gateway, почніть із ключа API для вибраного
провайдера.
Зокрема для Anthropic автентифікація ключем API усе ще є найпередбачуванішим
серверним налаштуванням, але OpenClaw також підтримує повторне використання
локального входу Claude CLI.

1. Створіть ключ API у консолі свого провайдера.
2. Розмістіть його на **хості Gateway** (машині, де працює `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Якщо Gateway працює під systemd/launchd, краще розмістити ключ у
   `~/.openclaw/.env`, щоб daemon міг його прочитати:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Потім перезапустіть daemon (або перезапустіть процес Gateway) і перевірте ще раз:

```bash
openclaw models status
openclaw doctor
```

Якщо ви не хочете самостійно керувати змінними середовища, onboarding може
зберігати ключі API для використання daemon: `openclaw onboard`.

Докладніше про успадкування env (`env.shellEnv`, `~/.openclaw/.env`,
systemd/launchd) див. у [Довідці](/uk/help).

## Anthropic: сумісність Claude CLI і токенів

Автентифікація setup-token Anthropic усе ще доступна в OpenClaw як підтримуваний
шлях токена. Співробітники Anthropic відтоді повідомили нам, що використання
Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw вважає повторне
використання Claude CLI і використання `claude -p` санкціонованими для цієї
інтеграції, якщо Anthropic не опублікує нову політику. Коли повторне
використання Claude CLI доступне на хості, тепер це рекомендований шлях.

Для довготривалих хостів Gateway ключ API Anthropic усе ще є
найпередбачуванішим налаштуванням. Якщо ви хочете повторно використати наявний
вхід Claude на тому самому хості, скористайтеся шляхом Anthropic Claude CLI в
onboarding/configure.

Рекомендоване налаштування хоста для повторного використання Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Це двокрокове налаштування:

1. Увійдіть у сам Claude Code до Anthropic на хості Gateway.
2. Скажіть OpenClaw перемкнути вибір моделей Anthropic на локальний backend `claude-cli`
   і зберегти відповідний профіль автентифікації OpenClaw.

Якщо `claude` немає в `PATH`, спочатку встановіть Claude Code або встановіть
`agents.defaults.cliBackends.claude-cli.command` на справжній шлях до binary.

Ручне введення токена (будь-який провайдер; записує `auth-profiles.json` + оновлює config):

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

Під час виконання OpenClaw очікує канонічну форму `version` + `profiles`. Якщо старіше встановлення все ще має плоский файл, як-от `{ "openrouter": { "apiKey": "..." } }`, запустіть `openclaw doctor --fix`, щоб переписати його як профіль ключа API `openrouter:default`; doctor збереже копію `.legacy-flat.*.bak` поруч з оригіналом. Деталі endpoint, як-от `baseUrl`, `api`, ідентифікатори моделей, headers і timeouts, мають бути в `models.providers.<id>` у `openclaw.json` або `models.json`, а не в `auth-profiles.json`.

Посилання на профілі автентифікації також підтримуються для статичних облікових даних:

- Облікові дані `api_key` можуть використовувати `keyRef: { source, provider, id }`
- Облікові дані `token` можуть використовувати `tokenRef: { source, provider, id }`
- Профілі в режимі OAuth не підтримують облікові дані SecretRef; якщо `auth.profiles.<id>.mode` встановлено на `"oauth"`, введення `keyRef`/`tokenRef` на базі SecretRef для цього профілю відхиляється.

Перевірка, зручна для автоматизації (exit `1`, коли строк дії минув/бракує, `2`, коли строк дії скоро мине):

```bash
openclaw models status --check
```

Живі перевірки автентифікації:

```bash
openclaw models status --probe
```

Примітки:

- Рядки перевірки можуть надходити з профілів автентифікації, облікових даних env або `models.json`.
- Якщо явний `auth.order.<provider>` пропускає збережений профіль, перевірка повідомляє
  `excluded_by_auth_order` для цього профілю замість спроби використати його.
- Якщо автентифікація існує, але OpenClaw не може визначити кандидата моделі, придатного для перевірки
  для цього провайдера, перевірка повідомляє `status: no_model`.
- Cooldown обмеження швидкості може бути прив’язаний до моделі. Профіль, що перебуває в cooldown для однієї
  моделі, усе ще може бути придатним для спорідненої моделі того самого провайдера.

Необов’язкові операційні скрипти (systemd/Termux) задокументовано тут:
[Скрипти моніторингу автентифікації](/uk/help/scripts#auth-monitoring-scripts)

## Примітка про Anthropic

Backend Anthropic `claude-cli` знову підтримується.

- Співробітники Anthropic повідомили нам, що цей шлях інтеграції OpenClaw знову дозволений.
- Тому OpenClaw вважає повторне використання Claude CLI і використання `claude -p` санкціонованими
  для запусків на базі Anthropic, якщо Anthropic не опублікує нову політику.
- Ключі API Anthropic залишаються найпередбачуванішим вибором для довготривалих хостів Gateway
  і явного контролю серверного billing.

## Перевірка стану автентифікації моделей

```bash
openclaw models status
openclaw doctor
```

## Поведінка ротації ключів API (Gateway)

Деякі провайдери підтримують повторну спробу запиту з альтернативними ключами, коли API-виклик
натрапляє на обмеження швидкості провайдера.

- Порядок пріоритету:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одиночне перевизначення)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Провайдери Google також включають `GOOGLE_API_KEY` як додатковий fallback.
- Той самий список ключів дедуплікується перед використанням.
- OpenClaw повторює спробу з наступним ключем лише для помилок обмеження швидкості (наприклад,
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` або
  `workers_ai ... quota limit exceeded`).
- Помилки, не пов’язані з обмеженням швидкості, не повторюються з альтернативними ключами.
- Якщо всі ключі зазнають невдачі, повертається остаточна помилка з останньої спроби.

## Керування тим, які облікові дані використовуються

### Для кожного сеансу (команда чату)

Використовуйте `/model <alias-or-id>@<profileId>`, щоб закріпити конкретні облікові дані провайдера для поточного сеансу (приклади ідентифікаторів профілів: `anthropic:default`, `anthropic:work`).

Використовуйте `/model` (або `/model list`) для компактного вибирача; використовуйте `/model status` для повного подання (кандидати + наступний профіль автентифікації, а також деталі endpoint провайдера, якщо налаштовано).

### Для кожного агента (перевизначення CLI)

Установіть явне перевизначення порядку профілів автентифікації для агента (зберігається в `auth-state.json` цього агента):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Використовуйте `--agent <id>`, щоб націлитися на конкретного агента; пропустіть його, щоб використати налаштованого агента за замовчуванням.
Коли ви налагоджуєте проблеми порядку, `openclaw models status --probe` показує пропущені
збережені профілі як `excluded_by_auth_order` замість мовчазного пропуску.
Коли ви налагоджуєте проблеми cooldown, пам’ятайте, що cooldown обмеження швидкості може бути прив’язаний
до одного ідентифікатора моделі, а не до всього профілю провайдера.

## Усунення несправностей

### "No credentials found"

Якщо профілю Anthropic бракує, налаштуйте ключ API Anthropic на
**хості Gateway** або налаштуйте шлях setup-token Anthropic, а потім перевірте ще раз:

```bash
openclaw models status
```

### Строк дії токена скоро минає/минув

Запустіть `openclaw models status`, щоб підтвердити, строк дії якого профілю минає. Якщо
профілю токена Anthropic бракує або строк його дії минув, оновіть це налаштування через
setup-token або перейдіть на ключ API Anthropic.

## Пов’язане

- [Керування секретами](/uk/gateway/secrets)
- [Віддалений доступ](/uk/gateway/remote)
- [Зберігання автентифікації](/uk/concepts/oauth)
