---
read_when:
    - У вас є проблеми з підключенням або автентифікацією, і ви хочете отримати керовані виправлення
    - Ви оновилися й хочете виконати базову перевірку працездатності
summary: Довідник CLI для `openclaw doctor` (перевірки стану + кероване виправлення)
title: лікар
x-i18n:
    generated_at: "2026-04-23T06:17:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad44619b427b938b2f6d4f904fcdc2d9862ff33c569008590f25e17d12e03530
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Перевірки стану + швидкі виправлення для Gateway і каналів.

Пов’язане:

- Усунення несправностей: [Troubleshooting](/uk/gateway/troubleshooting)
- Аудит безпеки: [Security](/uk/gateway/security)

## Приклади

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Параметри

- `--no-workspace-suggestions`: вимкнути підказки щодо пам’яті/пошуку в робочому просторі
- `--yes`: приймати типові значення без запитів
- `--repair`: застосувати рекомендовані виправлення без запитів
- `--fix`: псевдонім для `--repair`
- `--force`: застосувати агресивні виправлення, включно з перезаписом користувацької конфігурації сервісу за потреби
- `--non-interactive`: запуск без запитів; лише безпечні міграції
- `--generate-gateway-token`: згенерувати й налаштувати токен Gateway
- `--deep`: просканувати системні сервіси на наявність додаткових встановлень Gateway

Примітки:

- Інтерактивні запити (як-от виправлення keychain/OAuth) запускаються лише тоді, коли stdin є TTY і **не** встановлено `--non-interactive`. Безголові запуски (cron, Telegram, без термінала) пропускають запити.
- `--fix` (псевдонім для `--repair`) записує резервну копію в `~/.openclaw/openclaw.json.bak` і видаляє невідомі ключі конфігурації, перелічуючи кожне видалення.
- Перевірки цілісності стану тепер виявляють осиротілі файли transcript у каталозі сесій і можуть архівувати їх як `.deleted.<timestamp>`, щоб безпечно звільнити місце.
- Doctor також сканує `~/.openclaw/cron/jobs.json` (або `cron.store`) на наявність застарілих форм cron jobs і може переписати їх на місці до того, як scheduler муситиме автоматично нормалізувати їх під час виконання.
- Doctor відновлює відсутні runtime-залежності вбудованих plugin без потреби в правах на запис до встановленого пакета OpenClaw. Для npm-встановлень, що належать root, або захищених systemd units установіть `OPENCLAW_PLUGIN_STAGE_DIR` у каталог із правом запису, наприклад `/var/lib/openclaw/plugin-runtime-deps`.
- Doctor автоматично мігрує застарілу пласку конфігурацію Talk (`talk.voiceId`, `talk.modelId` та подібні) у `talk.provider` + `talk.providers.<provider>`.
- Повторні запуски `doctor --fix` більше не повідомляють і не застосовують нормалізацію Talk, якщо єдина відмінність — це порядок ключів об’єкта.
- Doctor містить перевірку готовності memory-search і може рекомендувати `openclaw configure --section model`, якщо відсутні embedding-облікові дані.
- Якщо режим sandbox увімкнено, але Docker недоступний, doctor повідомляє виразне попередження з варіантами виправлення (`install Docker` або `openclaw config set agents.defaults.sandbox.mode off`).
- Якщо `gateway.auth.token`/`gateway.auth.password` керуються через SecretRef і недоступні в поточному шляху команди, doctor повідомляє попередження лише для читання і не записує резервні відкриті облікові дані.
- Якщо перевірка channel SecretRef завершується помилкою в шляху виправлення, doctor продовжує роботу й повідомляє попередження замість передчасного завершення.
- Автоматичне визначення username у Telegram `allowFrom` (`doctor --fix`) потребує токена Telegram, який можна визначити в поточному шляху команди. Якщо перевірка токена недоступна, doctor повідомляє попередження й пропускає автовизначення в цьому проході.

## macOS: перевизначення змінних середовища `launchctl`

Якщо ви раніше запускали `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (або `...PASSWORD`), це значення перевизначає ваш файл конфігурації та може спричиняти стійкі помилки “unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
