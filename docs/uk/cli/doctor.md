---
read_when:
    - У вас є проблеми з підключенням/автентифікацією, і ви хочете отримати керовані способи виправлення
    - Ви оновилися й хочете виконати базову перевірку працездатності
summary: Довідник CLI для `openclaw doctor` (перевірки стану + керовані виправлення)
title: Doctor
x-i18n:
    generated_at: "2026-04-23T20:47:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf02538f95ebb3752795da58cb5785814a064cf938c3a034a1cdf3795b3fa96e
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Перевірки стану + швидкі виправлення для Gateway і каналів.

Пов’язане:

- Усунення несправностей: [Усунення несправностей](/uk/gateway/troubleshooting)
- Аудит безпеки: [Безпека](/uk/gateway/security)

## Приклади

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Параметри

- `--no-workspace-suggestions`: вимкнути пропозиції щодо пам’яті/пошуку робочого простору
- `--yes`: приймати типові значення без запиту
- `--repair`: застосувати рекомендовані виправлення без запиту
- `--fix`: псевдонім для `--repair`
- `--force`: застосувати агресивні виправлення, зокрема перезаписати користувацьку конфігурацію сервісу за потреби
- `--non-interactive`: запуск без запитів; лише безпечні міграції
- `--generate-gateway-token`: згенерувати й налаштувати токен Gateway
- `--deep`: сканувати системні сервіси на наявність додаткових встановлень Gateway

Примітки:

- Інтерактивні запити (наприклад, виправлення keychain/OAuth) запускаються лише тоді, коли stdin є TTY і `--non-interactive` **не** задано. У headless-запусках (Cron, Telegram, без термінала) запити буде пропущено.
- Продуктивність: неінтерактивні запуски `doctor` пропускають жадібне завантаження Plugin, щоб headless-перевірки стану залишалися швидкими. В інтерактивних сесіях Plugins, як і раніше, повністю завантажуються, коли перевірка потребує їхнього внеску.
- `--fix` (псевдонім для `--repair`) записує резервну копію в `~/.openclaw/openclaw.json.bak` і видаляє невідомі ключі конфігурації, перелічуючи кожне видалення.
- Перевірки цілісності стану тепер виявляють осиротілі файли транскриптів у каталозі сесій і можуть архівувати їх як `.deleted.<timestamp>`, щоб безпечно звільнити місце.
- Doctor також сканує `~/.openclaw/cron/jobs.json` (або `cron.store`) на наявність застарілих форм Cron jobs і може переписати їх на місці, перш ніж планувальнику доведеться автоматично нормалізувати їх під час виконання.
- Doctor виправляє відсутні runtime-залежності вбудованих Plugin без потреби в доступі на запис до встановленого пакета OpenClaw. Для npm-встановлень, що належать root, або захищених systemd unit задайте `OPENCLAW_PLUGIN_STAGE_DIR` на каталог із доступом на запис, наприклад `/var/lib/openclaw/plugin-runtime-deps`.
- Doctor автоматично мігрує застарілу плоску конфігурацію Talk (`talk.voiceId`, `talk.modelId` та пов’язані параметри) у `talk.provider` + `talk.providers.<provider>`.
- Повторні запуски `doctor --fix` більше не звітують і не застосовують нормалізацію Talk, якщо єдина відмінність полягає в порядку ключів об’єкта.
- Doctor містить перевірку готовності пошуку в пам’яті й може рекомендувати `openclaw configure --section model`, якщо відсутні облікові дані для embeddings.
- Якщо режим sandbox увімкнено, але Docker недоступний, doctor повідомляє про чітке попередження з варіантами виправлення (`install Docker` або `openclaw config set agents.defaults.sandbox.mode off`).
- Якщо `gateway.auth.token`/`gateway.auth.password` керуються через SecretRef і недоступні в поточному шляху виконання команди, doctor повідомляє про попередження лише для читання й не записує plaintext fallback credentials.
- Якщо перевірка SecretRef каналу завершується помилкою на шляху виправлення, doctor продовжує роботу й повідомляє попередження замість дострокового завершення.
- Автоматичне зіставлення username у Telegram `allowFrom` (`doctor --fix`) потребує токена Telegram, який можна розв’язати в поточному шляху виконання команди. Якщо перевірка токена недоступна, doctor повідомляє попередження й пропускає автоматичне зіставлення в цьому проході.

## macOS: перевизначення середовища `launchctl`

Якщо ви раніше запускали `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (або `...PASSWORD`), це значення перевизначає ваш файл конфігурації й може спричиняти постійні помилки “unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
