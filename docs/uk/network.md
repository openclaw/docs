---
read_when:
    - Вам потрібен огляд архітектури мережі та безпеки
    - Ви налагоджуєте локальний доступ, доступ через tailnet або парування
    - Вам потрібен канонічний список документації з мережевих питань
summary: 'Мережевий хаб: інтерфейси Gateway, створення пари, виявлення та безпека'
title: Мережа
x-i18n:
    generated_at: "2026-05-05T16:52:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd4afc23d041df1734e730fe5f09eae529a07154d913f9434f7d413136783287
    source_path: network.md
    workflow: 16
---

# Мережевий центр

Цей центр пов’язує основну документацію про те, як OpenClaw підключає, сполучає в пару й захищає
пристрої через localhost, LAN і tailnet.

## Основна модель

Більшість операцій проходить через Gateway (`openclaw gateway`) — єдиний довготривалий процес, який керує підключеннями каналів і площиною керування WebSocket.

- **Спочатку loopback**: Gateway WS за замовчуванням використовує `ws://127.0.0.1:18789`.
  Прив’язки не до loopback потребують чинного шляху автентифікації gateway: автентифікації
  за спільним секретом через токен/пароль або правильно налаштованого розгортання
  `trusted-proxy` не на loopback.
- **Рекомендовано один Gateway на хост**. Для ізоляції запускайте кілька gateway з ізольованими профілями й портами ([Кілька Gateway](/uk/gateway/multiple-gateways)).
- **Хост Canvas** обслуговується на тому самому порту, що й Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), і захищений автентифікацією Gateway, коли прив’язаний за межами loopback.
- **Віддалений доступ** зазвичай здійснюється через SSH-тунель або Tailscale VPN ([Віддалений доступ](/uk/gateway/remote)).

Ключові посилання:

- [Архітектура Gateway](/uk/concepts/architecture)
- [Протокол Gateway](/uk/gateway/protocol)
- [Runbook Gateway](/uk/gateway)
- [Вебповерхні + режими прив’язки](/uk/web)

## Сполучення в пару + ідентичність

- [Огляд сполучення в пару (DM + вузли)](/uk/channels/pairing)
- [Сполучення вузлів у пару, кероване Gateway](/uk/gateway/pairing)
- [CLI пристроїв (сполучення в пару + ротація токенів)](/uk/cli/devices)
- [CLI сполучення в пару (підтвердження DM)](/uk/cli/pairing)

Локальна довіра:

- Прямі підключення local loopback можуть автоматично схвалюватися для сполучення в пару, щоб забезпечити плавний UX на тому самому хості.
- OpenClaw також має вузький шлях самопідключення, локальний для бекенда/контейнера, для довірених допоміжних потоків зі спільним секретом.
- Клієнти tailnet і LAN, зокрема прив’язки tailnet на тому самому хості, усе одно потребують явного схвалення сполучення в пару.

## Виявлення + транспорти

- [Виявлення й транспорти](/uk/gateway/discovery)
- [Bonjour / mDNS](/uk/gateway/bonjour)
- [Віддалений доступ (SSH)](/uk/gateway/remote)
- [Tailscale](/uk/gateway/tailscale)

## Вузли + транспорти

- [Огляд вузлів](/uk/nodes)
- [Протокол мосту (застарілі вузли, історично)](/uk/gateway/bridge-protocol)
- [Runbook вузла: iOS](/uk/platforms/ios)
- [Runbook вузла: Android](/uk/platforms/android)

## Безпека

- [Огляд безпеки](/uk/gateway/security)
- [Довідник конфігурації Gateway](/uk/gateway/configuration)
- [Усунення несправностей](/uk/gateway/troubleshooting)
- [Doctor](/uk/gateway/doctor)

## Пов’язане

- [Мережева модель Gateway](/uk/network#core-model)
- [Віддалений доступ](/uk/gateway/remote)
