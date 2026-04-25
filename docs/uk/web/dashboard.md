---
read_when:
    - Зміна режимів автентифікації або доступності панелі керування
summary: Доступ і автентифікація до панелі керування Gateway (Control UI)
title: Панель керування
x-i18n:
    generated_at: "2026-04-25T10:48:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e0e7c8cebe715f96e7f0e967e9fd86c4c6c54f7cc08a4291b02515fc0933a1a
    source_path: web/dashboard.md
    workflow: 15
---

Панель керування Gateway — це браузерний Control UI, який типово обслуговується за адресою `/`
(перевизначається через `gateway.controlUi.basePath`).

Швидке відкриття (локальний Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (або [http://localhost:18789/](http://localhost:18789/))
- Якщо `gateway.tls.enabled: true`, використовуйте `https://127.0.0.1:18789/` і
  `wss://127.0.0.1:18789` для кінцевої точки WebSocket.

Ключові посилання:

- [Control UI](/uk/web/control-ui) для використання та можливостей інтерфейсу.
- [Tailscale](/uk/gateway/tailscale) для автоматизації Serve/Funnel.
- [Web surfaces](/uk/web) для режимів прив’язки та приміток щодо безпеки.

Автентифікація примусово застосовується під час рукостискання WebSocket через налаштований шлях автентифікації gateway:

- `connect.params.auth.token`
- `connect.params.auth.password`
- заголовки ідентичності Tailscale Serve, коли `gateway.auth.allowTailscale: true`
- заголовки ідентичності trusted-proxy, коли `gateway.auth.mode: "trusted-proxy"`

Див. `gateway.auth` у [Gateway configuration](/uk/gateway/configuration).

Примітка щодо безпеки: Control UI — це **адміністративна поверхня** (чат, конфігурація, підтвердження exec).
Не відкривайте її публічно. Інтерфейс зберігає URL-токени панелі в sessionStorage
для поточної сесії вкладки браузера та вибраної URL-адреси gateway і видаляє їх з URL після завантаження.
Надавайте перевагу localhost, Tailscale Serve або SSH-тунелю.

## Швидкий шлях (рекомендовано)

- Після онбордингу CLI автоматично відкриває панель керування та виводить чисте (без токена) посилання.
- Повторно відкрити будь-коли: `openclaw dashboard` (копіює посилання, відкриває браузер, якщо можливо, показує підказку SSH у headless-режимі).
- Якщо UI запитує автентифікацію за спільним секретом, вставте налаштований токен або
  пароль у налаштуваннях Control UI.

## Основи автентифікації (локально чи віддалено)

- **Localhost**: відкрийте `http://127.0.0.1:18789/`.
- **Gateway TLS**: коли `gateway.tls.enabled: true`, посилання панелі/статусу використовують
  `https://`, а посилання WebSocket у Control UI використовують `wss://`.
- **Джерело токена спільного секрету**: `gateway.auth.token` (або
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` може передати його через фрагмент URL
  для одноразового початкового налаштування, а Control UI зберігає його в sessionStorage для
  поточної сесії вкладки браузера та вибраної URL-адреси gateway замість localStorage.
- Якщо `gateway.auth.token` керується через SecretRef, `openclaw dashboard`
  навмисно виводить/копіює/відкриває URL без токена. Це дозволяє уникнути розкриття
  зовнішньо керованих токенів у логах оболонки, історії буфера обміну або аргументах
  запуску браузера.
- Якщо `gateway.auth.token` налаштовано як SecretRef і він не розв’язується у вашій
  поточній оболонці, `openclaw dashboard` усе одно виводить URL без токена та
  практичні рекомендації щодо налаштування автентифікації.
- **Пароль спільного секрету**: використовуйте налаштований `gateway.auth.password` (або
  `OPENCLAW_GATEWAY_PASSWORD`). Панель керування не зберігає паролі між
  перезавантаженнями.
- **Режими з передачею ідентичності**: Tailscale Serve може забезпечувати автентифікацію
  Control UI/WebSocket через заголовки ідентичності, коли `gateway.auth.allowTailscale: true`, а
  reverse proxy, що підтримує ідентичність і не прив’язаний до loopback, може забезпечувати її за
  `gateway.auth.mode: "trusted-proxy"`. У цих режимах панелі керування не
  потрібен вставлений спільний секрет для WebSocket.
- **Не localhost**: використовуйте Tailscale Serve, прив’язку зі спільним секретом не до loopback, reverse proxy з підтримкою ідентичності не до loopback із
  `gateway.auth.mode: "trusted-proxy"` або SSH-тунель. HTTP API, як і раніше, використовують
  автентифікацію зі спільним секретом, якщо тільки ви навмисно не використовуєте private-ingress
  `gateway.auth.mode: "none"` або HTTP-автентифікацію trusted-proxy. Див.
  [Web surfaces](/uk/web).

<a id="if-you-see-unauthorized-1008"></a>

## Якщо ви бачите "unauthorized" / 1008

- Переконайтеся, що gateway доступний (локально: `openclaw status`; віддалено: SSH-тунель `ssh -N -L 18789:127.0.0.1:18789 user@host`, потім відкрийте `http://127.0.0.1:18789/`).
- Для `AUTH_TOKEN_MISMATCH` клієнти можуть виконати одну довірену повторну спробу з кешованим токеном пристрою, коли gateway повертає підказки для повторної спроби. Ця повторна спроба з кешованим токеном повторно використовує кешовані схвалені області доступу токена; виклики з явним `deviceToken` / явними `scopes` зберігають запитаний ними набір областей доступу. Якщо після цієї повторної спроби автентифікація все одно не вдається, вручну усуньте розсинхронізацію токена.
- Поза цим шляхом повторної спроби пріоритет автентифікації під час з’єднання такий: спочатку явний спільний токен/пароль, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap token.
- В асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого
  `{scope, ip}` серіалізуються до того, як обмежувач невдалої автентифікації їх зафіксує, тому друга одночасна невдала повторна спроба вже може показати `retry later`.
- Для кроків відновлення при розсинхронізації токена див. [Token drift recovery checklist](/uk/cli/devices#token-drift-recovery-checklist).
- Отримайте або надайте спільний секрет із хоста gateway:
  - Токен: `openclaw config get gateway.auth.token`
  - Пароль: розв’яжіть налаштований `gateway.auth.password` або
    `OPENCLAW_GATEWAY_PASSWORD`
  - Токен під керуванням SecretRef: розв’яжіть зовнішнього постачальника секретів або експортуйте
    `OPENCLAW_GATEWAY_TOKEN` у цій оболонці, потім знову виконайте `openclaw dashboard`
  - Спільний секрет не налаштовано: `openclaw doctor --generate-gateway-token`
- У налаштуваннях панелі керування вставте токен або пароль у поле автентифікації,
  потім підключіться.
- Перемикач мови UI розташований у **Overview -> Gateway Access -> Language**.
  Він є частиною картки доступу, а не розділу Appearance.

## Пов’язане

- [Control UI](/uk/web/control-ui)
- [WebChat](/uk/web/webchat)
