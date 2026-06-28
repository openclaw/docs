---
read_when:
    - Вам потрібен огляд мережевої архітектури та безпеки
    - Ви налагоджуєте локальний доступ, доступ через tailnet або зв’язування
    - Вам потрібен канонічний список мережевої документації
summary: 'Мережевий хаб: інтерфейси Gateway, сполучення, виявлення та безпека'
title: Мережа
x-i18n:
    generated_at: "2026-05-06T04:19:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0ff6c4ee46005aeac1612ea40f1ce3d5824aa507d0842788dbf4bffbaccfcc
    source_path: network.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Цей хаб посилається на основну документацію про те, як OpenClaw підключає, спарює та захищає
пристрої в localhost, LAN і tailnet.

## Основна модель

Більшість операцій проходить через Gateway (`openclaw gateway`), єдиний довготривалий процес, який керує підключеннями каналів і площиною керування WebSocket.

- **Спочатку loopback**: Gateway WS за замовчуванням використовує `ws://127.0.0.1:18789`.
  Прив’язки не до loopback потребують чинного шляху автентифікації Gateway: автентифікації
  токеном/паролем зі спільним секретом або правильно налаштованого розгортання
  `trusted-proxy` не на loopback.
- **Рекомендовано один Gateway на хост**. Для ізоляції запускайте кілька Gateway з ізольованими профілями та портами ([Кілька Gateway](/uk/gateway/multiple-gateways)).
- **Хост Canvas** обслуговується на тому самому порту, що й Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), і захищається автентифікацією Gateway, коли прив’язаний поза loopback.
- **Віддалений доступ** зазвичай здійснюється через тунель SSH або VPN Tailscale ([Віддалений доступ](/uk/gateway/remote)).

Ключові довідкові матеріали:

- [Архітектура Gateway](/uk/concepts/architecture)
- [Протокол Gateway](/uk/gateway/protocol)
- [Runbook Gateway](/uk/gateway)
- [Вебповерхні + режими прив’язки](/uk/web)

## Спарювання + ідентичність

- [Огляд спарювання (DM + вузли)](/uk/channels/pairing)
- [Спарювання вузлів під керуванням Gateway](/uk/gateway/pairing)
- [CLI пристроїв (спарювання + ротація токенів)](/uk/cli/devices)
- [CLI спарювання (схвалення DM)](/uk/cli/pairing)

Локальна довіра:

- Прямі підключення local loopback можуть автоматично схвалюватися для спарювання, щоб зберігати
  плавний UX на тому самому хості.
- OpenClaw також має вузький шлях самопідключення backend/container-local для
  довірених допоміжних потоків зі спільним секретом.
- Клієнти tailnet і LAN, включно з прив’язками tailnet на тому самому хості, все одно потребують
  явного схвалення спарювання.

## Виявлення + транспорти

- [Виявлення та транспорти](/uk/gateway/discovery)
- [Bonjour / mDNS](/uk/gateway/bonjour)
- [Віддалений доступ (SSH)](/uk/gateway/remote)
- [Tailscale](/uk/gateway/tailscale)

## Вузли + транспорти

- [Огляд вузлів](/uk/nodes)
- [Протокол Bridge (застарілі вузли, історичний)](/uk/gateway/bridge-protocol)
- [Runbook вузла: iOS](/uk/platforms/ios)
- [Runbook вузла: Android](/uk/platforms/android)

## Безпека

- [Огляд безпеки](/uk/gateway/security)
- [Довідник конфігурації Gateway](/uk/gateway/configuration)
- [Усунення несправностей](/uk/gateway/troubleshooting)
- [Doctor](/uk/gateway/doctor)

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Віддалений доступ](/uk/gateway/remote)
