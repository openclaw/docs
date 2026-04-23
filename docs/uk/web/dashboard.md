---
read_when:
    - Зміна режимів автентифікації або доступності dashboard
summary: Доступ і автентифікація Gateway dashboard (Control UI)
title: Dashboard
x-i18n:
    generated_at: "2026-04-23T06:19:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5b50d711711f70c51d65f3908b7a8c1e0e978ed46a853f0ab48c13dfe0348ff
    source_path: web/dashboard.md
    workflow: 15
---

# Dashboard (Control UI)

Gateway dashboard — це браузерний Control UI, який типово віддається за адресою `/`
(перевизначається через `gateway.controlUi.basePath`).

Швидке відкриття (локальний Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (або [http://localhost:18789/](http://localhost:18789/))

Ключові посилання:

- [Control UI](/uk/web/control-ui) для використання та можливостей UI.
- [Tailscale](/uk/gateway/tailscale) для автоматизації Serve/Funnel.
- [Web surfaces](/uk/web) для режимів прив’язки та приміток щодо безпеки.

Автентифікація застосовується на етапі WebSocket handshake через налаштований шлях
автентифікації gateway:

- `connect.params.auth.token`
- `connect.params.auth.password`
- заголовки ідентичності Tailscale Serve, коли `gateway.auth.allowTailscale: true`
- заголовки ідентичності trusted-proxy, коли `gateway.auth.mode: "trusted-proxy"`

Див. `gateway.auth` у [Gateway configuration](/uk/gateway/configuration).

Примітка щодо безпеки: Control UI — це **поверхня адміністрування** (чат, конфігурація, погодження exec).
Не відкривайте її публічно. UI зберігає URL-токени dashboard у sessionStorage
для поточної сесії вкладки браузера та вибраної URL-адреси gateway і видаляє їх з URL після завантаження.
Надавайте перевагу localhost, Tailscale Serve або SSH-тунелю.

## Швидкий шлях (рекомендовано)

- Після початкового налаштування CLI автоматично відкриває dashboard і виводить чисте посилання (без токена).
- Відкрити знову будь-коли: `openclaw dashboard` (копіює посилання, відкриває браузер за можливості, показує підказку SSH, якщо середовище безголове).
- Якщо UI запитує автентифікацію за спільним секретом, вставте налаштований токен або
  пароль у налаштуваннях Control UI.

## Основи автентифікації (локально чи віддалено)

- **Localhost**: відкрийте `http://127.0.0.1:18789/`.
- **Джерело токена зі спільним секретом**: `gateway.auth.token` (або
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` може передати його через URL-фрагмент
  для одноразового bootstrap, а Control UI зберігає його в sessionStorage для
  поточної сесії вкладки браузера та вибраної URL-адреси gateway замість localStorage.
- Якщо `gateway.auth.token` керується через SecretRef, `openclaw dashboard`
  навмисно виводить/копіює/відкриває URL без токена. Це дозволяє уникнути розкриття
  токенів, якими керують зовнішні системи, у shell-логах, історії буфера обміну або аргументах
  запуску браузера.
- Якщо `gateway.auth.token` налаштовано як SecretRef і його не вдається визначити у вашій
  поточній shell, `openclaw dashboard` усе одно виводить URL без токена та
  надає дієві підказки щодо налаштування автентифікації.
- **Пароль зі спільним секретом**: використовуйте налаштований `gateway.auth.password` (або
  `OPENCLAW_GATEWAY_PASSWORD`). Dashboard не зберігає паролі між
  перезавантаженнями.
- **Режими з передаванням ідентичності**: Tailscale Serve може задовольняти автентифікацію
  Control UI/WebSocket через заголовки ідентичності, коли `gateway.auth.allowTailscale: true`, а
  reverse proxy з урахуванням ідентичності поза loopback може задовольняти
  `gateway.auth.mode: "trusted-proxy"`. У цих режимах dashboard не
  потребує вставленого спільного секрету для WebSocket.
- **Не localhost**: використовуйте Tailscale Serve, прив’язку зі спільним секретом поза loopback, 
  reverse proxy з урахуванням ідентичності поза loopback із
  `gateway.auth.mode: "trusted-proxy"` або SSH-тунель. HTTP API, як і раніше, використовують
  автентифікацію зі спільним секретом, якщо ви навмисно не використовуєте приватний ingress
  `gateway.auth.mode: "none"` або HTTP-автентифікацію trusted-proxy. Див.
  [Web surfaces](/uk/web).

<a id="if-you-see-unauthorized-1008"></a>

## Якщо ви бачите "unauthorized" / 1008

- Переконайтеся, що gateway доступний (локально: `openclaw status`; віддалено: SSH-тунель `ssh -N -L 18789:127.0.0.1:18789 user@host`, потім відкрийте `http://127.0.0.1:18789/`).
- Для `AUTH_TOKEN_MISMATCH` клієнти можуть виконати одну довірену повторну спробу з кешованим токеном пристрою, коли gateway повертає підказки для повтору. Ця повторна спроба з кешованим токеном повторно використовує кешований набір схвалених scopes цього токена; виклики з явним `deviceToken` / явними `scopes` зберігають запитаний ними набір scopes. Якщо після цього повтору автентифікація все ще не вдається, усуньте розсинхронізацію токена вручну.
- Поза цим шляхом повтору пріоритет автентифікації під час підключення такий: спочатку явний спільний токен/пароль, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap-токен.
- На асинхронному шляху Tailscale Serve Control UI невдалі спроби для тієї самої
  пари `{scope, ip}` серіалізуються до того, як обмежувач невдалої автентифікації їх зафіксує, тому
  уже друга одночасна хибна повторна спроба може показати `retry later`.
- Для кроків відновлення при розсинхронізації токена дотримуйтеся [Token drift recovery checklist](/uk/cli/devices#token-drift-recovery-checklist).
- Отримайте або надайте спільний секрет із хоста gateway:
  - Токен: `openclaw config get gateway.auth.token`
  - Пароль: визначте налаштований `gateway.auth.password` або
    `OPENCLAW_GATEWAY_PASSWORD`
  - Токен, керований через SecretRef: визначте його через зовнішній secret provider або експортуйте
    `OPENCLAW_GATEWAY_TOKEN` у цій shell, а потім повторно запустіть `openclaw dashboard`
  - Спільний секрет не налаштовано: `openclaw doctor --generate-gateway-token`
- У налаштуваннях dashboard вставте токен або пароль у поле автентифікації,
  а потім підключіться.
- Перемикач мови UI розташовано в **Overview -> Gateway Access -> Language**.
  Це частина картки доступу, а не розділу Appearance.
