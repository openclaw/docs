---
read_when:
    - Ви хочете стислий огляд мережевої моделі Gateway
summary: Як підключаються Gateway, Node і canvas host.
title: Мережева модель
x-i18n:
    generated_at: "2026-04-23T20:53:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7981c002347c3761708a2c11471166e33be53fd94fc6c50c9be06a61d2d18e33
    source_path: gateway/network-model.md
    workflow: 15
---

> Цей вміст об’єднано в [Network](/uk/network#core-model). Актуальний посібник див. на цій сторінці.

Більшість операцій проходить через Gateway (`openclaw gateway`) — єдиний довготривалий
процес, який володіє підключеннями каналів і WebSocket control plane.

## Основні правила

- Рекомендується один Gateway на хост. Це єдиний процес, якому дозволено володіти сесією WhatsApp Web. Для rescue bots або суворої ізоляції запускайте кілька gateway з ізольованими профілями та портами. Див. [Multiple gateways](/uk/gateway/multiple-gateways).
- Спочатку loopback: Gateway WS типово має адресу `ws://127.0.0.1:18789`. Майстер типово створює автентифікацію зі спільним секретом і зазвичай генерує токен навіть для loopback. Для доступу поза loopback використовуйте дійсний шлях автентифікації gateway: автентифікацію токеном/паролем зі спільним секретом або правильно налаштоване розгортання `trusted-proxy` поза loopback. Сценарії tailnet/mobile зазвичай найкраще працюють через Tailscale Serve або інший endpoint `wss://`, а не через сирий tailnet `ws://`.
- Node підключаються до Gateway WS через LAN, tailnet або SSH за потреби. Застарілий
  TCP bridge видалено.
- Canvas host обслуговується HTTP-сервером Gateway на **тому самому порту**, що й Gateway (типово `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    Коли `gateway.auth` налаштовано і Gateway прив’язаний не лише до loopback, ці маршрути захищаються автентифікацією Gateway. Клієнти Node використовують URL можливостей із областю Node, прив’язані до їхньої активної WS-сесії. Див. [Gateway configuration](/uk/gateway/configuration) (`canvasHost`, `gateway`).
- Для віддаленого використання зазвичай застосовується SSH tunnel або tailnet VPN. Див. [Remote access](/uk/gateway/remote) і [Discovery](/uk/gateway/discovery).
