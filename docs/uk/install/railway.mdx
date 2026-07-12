---
read_when:
    - Розгортання OpenClaw на Railway
    - Вам потрібне хмарне розгортання одним кліком із браузерним інтерфейсом керування
summary: Розгорніть OpenClaw на Railway за допомогою шаблону в один клік
title: Railway
x-i18n:
    generated_at: "2026-07-12T13:27:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbef00b8de61545e9971b18164472c2f47fe607f69ec36f83a27a11b65ea863f
    source_path: install/railway.mdx
    workflow: 16
---

Розгорніть OpenClaw на Railway за допомогою шаблону для розгортання одним клацанням і отримайте доступ до нього через вебінтерфейс керування. Це найпростіший варіант «без термінала на сервері»: Railway запускає Gateway за вас.

## Розгортання одним клацанням

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Розгорнути на Railway
</a>

<Steps>
  <Step title="Розгорніть шаблон">
    Натисніть **Deploy on Railway** вище.
  </Step>

<Step title="Додайте том">
  Підключіть том, змонтований у `/data` (потрібно для постійного зберігання стану).
</Step>

  <Step title="Задайте змінні">
    Задайте обов’язкові **Variables** для сервісу:

    - `OPENCLAW_GATEWAY_PORT=8080` (обов’язково — має відповідати порту в Public Networking)
    - `OPENCLAW_GATEWAY_TOKEN` (обов’язково; поводьтеся з ним як із секретом адміністратора)
    - `OPENCLAW_STATE_DIR=/data/.openclaw` (рекомендовано)
    - `OPENCLAW_WORKSPACE_DIR=/data/workspace` (рекомендовано)

  </Step>

<Step title="Увімкніть публічну мережу">
  У розділі **Public Networking** увімкніть **HTTP Proxy** для сервісу на порту `8080`.
</Step>

  <Step title="Підключіться">
    Знайдіть свою загальнодоступну URL-адресу в **Railway -> your service -> Settings -> Domains** — це може бути згенерований домен (часто `https://<something>.up.railway.app`) або підключений власний домен.

    Відкрийте `https://<your-railway-domain>/openclaw` і підключіться за допомогою налаштованого спільного секрету. За замовчуванням шаблон використовує `OPENCLAW_GATEWAY_TOKEN`; якщо ви заміните його автентифікацією за паролем, використовуйте натомість цей пароль.

  </Step>
</Steps>

## Що ви отримуєте

- Розміщені в хмарі OpenClaw Gateway та інтерфейс керування
- Постійне сховище через том Railway (`/data`), завдяки чому `openclaw.json`, файли `auth-profiles.json` окремих агентів, стан каналів і постачальників, сеанси та робочий простір зберігаються після повторних розгортань

## Підключення каналу

Скористайтеся інтерфейсом керування за адресою `/openclaw` або виконайте `openclaw onboard` в оболонці Railway, щоб отримати інструкції з налаштування каналу:

- [Discord](/uk/channels/discord)
- [Telegram](/uk/channels/telegram) (найшвидший варіант — потрібен лише токен бота)
- [Усі канали](/uk/channels)

## Резервне копіювання та міграція

Експортуйте стан, конфігурацію, профілі автентифікації та робочий простір:

```bash
openclaw backup create
```

Ця команда створює переносний архів резервної копії зі станом OpenClaw і всіма налаштованими робочими просторами. Докладніше див. у розділі [Резервне копіювання](/uk/cli/backup).

## Наступні кроки

- Налаштуйте канали обміну повідомленнями: [Канали](/uk/channels)
- Налаштуйте Gateway: [Конфігурація Gateway](/uk/gateway/configuration)
- Підтримуйте OpenClaw в актуальному стані: [Оновлення](/uk/install/updating)
