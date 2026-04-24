---
read_when:
    - Налагодження автентифікації моделі або завершення строку дії OAuth
    - Документування автентифікації або зберігання облікових даних
summary: 'Автентифікація моделі: OAuth, API-ключі, повторне використання Claude CLI та setup-token Anthropic'
title: Автентифікація
x-i18n:
    generated_at: "2026-04-24T18:10:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc8dbd0ccb9b167720a03f9e7486c1498d8d9eb500b8174e2a27ea0523285f70
    source_path: gateway/authentication.md
    workflow: 15
---

<Note>
Ця сторінка охоплює автентифікацію **постачальника моделей** (API-ключі, OAuth, повторне використання Claude CLI та setup-token Anthropic). Для автентифікації **підключення Gateway** (токен, пароль, trusted-proxy) див. [Configuration](/uk/gateway/configuration) і [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth).
</Note>

OpenClaw підтримує OAuth і API-ключі для постачальників моделей. Для постійно
працюючих хостів Gateway API-ключі зазвичай є найпередбачуванішим варіантом. Також
підтримуються потоки передплати/OAuth, якщо вони відповідають моделі облікового запису вашого постачальника.

Див. [/concepts/oauth](/uk/concepts/oauth) для повного опису потоку OAuth і схеми
зберігання.
Для автентифікації на основі SecretRef (постачальники `env`/`file`/`exec`) див. [Керування секретами](/uk/gateway/secrets).
Правила допустимості облікових даних/коди причин, які використовує `models status --probe`, див. у
[Семантика облікових даних автентифікації](/uk/auth-credential-semantics).

## Рекомендоване налаштування (API-ключ, будь-який постачальник)

Якщо ви запускаєте довготривалий gateway, почніть з API-ключа для вибраного
постачальника.
Зокрема для Anthropic, автентифікація через API-ключ усе ще є найпередбачуванішим серверним
налаштуванням, але OpenClaw також підтримує повторне використання локального входу Claude CLI.

1. Створіть API-ключ у консолі вашого постачальника.
2. Розмістіть його на **хості gateway** (машині, на якій виконується `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Якщо Gateway працює під systemd/launchd, краще розмістити ключ у
   `~/.openclaw/.env`, щоб демон міг його прочитати:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Потім перезапустіть демон (або перезапустіть процес Gateway) і повторно перевірте:

```bash
openclaw models status
openclaw doctor
```

Якщо ви не хочете самостійно керувати змінними env, онбординг може зберігати
API-ключі для використання демоном: `openclaw onboard`.

Детальніше про успадкування env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd) див. у [Довідці](/uk/help).

## Anthropic: сумісність Claude CLI і токенів

Автентифікація Anthropic через setup-token усе ще доступна в OpenClaw як підтримуваний
шлях токена. З того часу співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw
знову дозволене, тому OpenClaw вважає повторне використання Claude CLI і використання `claude -p`
санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику. Якщо
повторне використання Claude CLI доступне на хості, тепер це бажаний шлях.

Для довготривалих хостів gateway API-ключ Anthropic усе ще є найпередбачуванішим
налаштуванням. Якщо ви хочете повторно використати наявний вхід Claude на тому самому хості, скористайтеся
шляхом Anthropic Claude CLI в onboarding/configure.

Рекомендоване налаштування хоста для повторного використання Claude CLI:

```bash
# Виконайте на хості gateway
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Це двоетапне налаштування:

1. Увійдіть у сам Claude Code в Anthropic на хості gateway.
2. Вкажіть OpenClaw переключити вибір моделі Anthropic на локальний бекенд `claude-cli`
   і зберегти відповідний профіль автентифікації OpenClaw.

Якщо `claude` відсутній у `PATH`, спочатку встановіть Claude Code або задайте
`agents.defaults.cliBackends.claude-cli.command` на фактичний шлях до двійкового файла.

Ручне введення токена (будь-який постачальник; записує `auth-profiles.json` + оновлює конфігурацію):

```bash
openclaw models auth paste-token --provider openrouter
```

Для статичних облікових даних також підтримуються посилання на профілі автентифікації:

- облікові дані `api_key` можуть використовувати `keyRef: { source, provider, id }`
- облікові дані `token` можуть використовувати `tokenRef: { source, provider, id }`
- профілі в режимі OAuth не підтримують облікові дані SecretRef; якщо для `auth.profiles.<id>.mode` задано `"oauth"`, вхідні дані `keyRef`/`tokenRef` на основі SecretRef для цього профілю відхиляються.

Перевірка, зручна для автоматизації (завершення з кодом `1`, якщо відсутній/прострочений, `2`, якщо скоро спливає):

```bash
openclaw models status --check
```

Живі перевірки автентифікації:

```bash
openclaw models status --probe
```

Примітки:

- Рядки probe можуть надходити з профілів автентифікації, облікових даних env або `models.json`.
- Якщо явний `auth.order.<provider>` пропускає збережений профіль, probe повідомляє
  `excluded_by_auth_order` для цього профілю замість спроби його використати.
- Якщо автентифікація існує, але OpenClaw не може визначити кандидата моделі цього постачальника,
  придатного для probe, probe повідомляє `status: no_model`.
- Затримки cooldown через rate limit можуть бути прив’язані до конкретної моделі. Профіль, що перебуває в cooldown для однієї
  моделі, усе ще може бути придатним для сусідньої моделі в того самого постачальника.

Необов’язкові операційні скрипти (systemd/Termux) задокументовані тут:
[Скрипти моніторингу автентифікації](/uk/help/scripts#auth-monitoring-scripts)

## Примітка щодо Anthropic

Бекенд Anthropic `claude-cli` знову підтримується.

- Співробітники Anthropic повідомили нам, що цей шлях інтеграції OpenClaw знову дозволений.
- Тому OpenClaw вважає повторне використання Claude CLI і використання `claude -p`
  санкціонованими для запусків через Anthropic, якщо Anthropic не опублікує нову політику.
- API-ключі Anthropic залишаються найпередбачуванішим вибором для довготривалих хостів gateway
  і явного керування білінгом на боці сервера.

## Перевірка стану автентифікації моделі

```bash
openclaw models status
openclaw doctor
```

## Поведінка ротації API-ключів (gateway)

Деякі постачальники підтримують повторну спробу запиту з альтернативними ключами, коли API-виклик
натрапляє на rate limit постачальника.

- Порядок пріоритету:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одне перевизначення)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Постачальники Google також включають `GOOGLE_API_KEY` як додатковий резервний варіант.
- Один і той самий список ключів дедуплікується перед використанням.
- OpenClaw повторює спробу з наступним ключем лише для помилок rate limit (наприклад,
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` або
  `workers_ai ... quota limit exceeded`).
- Для помилок, не пов’язаних із rate limit, повторні спроби з альтернативними ключами не виконуються.
- Якщо всі ключі не спрацювали, повертається фінальна помилка з останньої спроби.

## Керування тим, які облікові дані використовуються

### Для окремої сесії (команда чату)

Використовуйте `/model <alias-or-id>@<profileId>`, щоб закріпити конкретні облікові дані постачальника для поточної сесії (приклади id профілів: `anthropic:default`, `anthropic:work`).

Використовуйте `/model` (або `/model list`) для компактного вибору; використовуйте `/model status` для повного перегляду (кандидати + наступний профіль автентифікації, а також деталі endpoint постачальника, якщо їх налаштовано).

### Для окремого агента (перевизначення CLI)

Задайте явне перевизначення порядку профілів автентифікації для агента (зберігається в `auth-state.json` цього агента):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Використовуйте `--agent <id>`, щоб націлитися на конкретного агента; без нього використовується налаштований агент за замовчуванням.
Під час налагодження проблем із порядком `openclaw models status --probe` показує пропущені
збережені профілі як `excluded_by_auth_order`, а не просто тихо їх пропускає.
Під час налагодження проблем із cooldown пам’ятайте, що cooldown через rate limit може бути прив’язаний
до одного id моделі, а не до всього профілю постачальника.

## Усунення несправностей

### "No credentials found"

Якщо профіль Anthropic відсутній, налаштуйте API-ключ Anthropic на
**хості gateway** або налаштуйте шлях setup-token Anthropic, а потім повторно перевірте:

```bash
openclaw models status
```

### Токен скоро спливає/прострочений

Запустіть `openclaw models status`, щоб підтвердити, який профіль скоро спливає. Якщо
профіль токена Anthropic відсутній або прострочений, оновіть це налаштування через
setup-token або перейдіть на API-ключ Anthropic.

## Пов’язане

- [Керування секретами](/uk/gateway/secrets)
- [Віддалений доступ](/uk/gateway/remote)
- [Зберігання автентифікації](/uk/concepts/oauth)
