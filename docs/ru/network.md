---
read_when:
    - Вам нужен обзор сетевой архитектуры и безопасности
    - Вы отлаживаете локальный доступ, доступ через tailnet или сопряжение
    - Вам нужен канонический список документации по сетевому взаимодействию
summary: 'Сетевой хаб: поверхности Gateway, сопряжение, обнаружение и безопасность'
title: Сеть
x-i18n:
    generated_at: "2026-06-28T23:09:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b0ff6c4ee46005aeac1612ea40f1ce3d5824aa507d0842788dbf4bffbaccfcc
    source_path: network.md
    workflow: 16
---

Этот раздел связывает основные документы о том, как OpenClaw подключает, сопрягает и защищает
устройства в localhost, LAN и tailnet.

## Основная модель

Большинство операций проходит через Gateway (`openclaw gateway`) — единый долгоживущий процесс, который владеет подключениями каналов и плоскостью управления WebSocket.

- **Сначала loopback**: Gateway WS по умолчанию использует `ws://127.0.0.1:18789`.
  Привязки не к loopback требуют действительный путь аутентификации Gateway:
  аутентификацию по общему секретному токену/паролю или корректно настроенное развертывание
  `trusted-proxy` не на loopback.
- **Рекомендуется один Gateway на хост**. Для изоляции запускайте несколько Gateway с изолированными профилями и портами ([Несколько Gateway](/ru/gateway/multiple-gateways)).
- **Хост Canvas** обслуживается на том же порту, что и Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), и защищается аутентификацией Gateway при привязке за пределами loopback.
- **Удаленный доступ** обычно реализуется через SSH-туннель или VPN Tailscale ([Удаленный доступ](/ru/gateway/remote)).

Ключевые справочные материалы:

- [Архитектура Gateway](/ru/concepts/architecture)
- [Протокол Gateway](/ru/gateway/protocol)
- [Руководство по эксплуатации Gateway](/ru/gateway)
- [Веб-поверхности и режимы привязки](/ru/web)

## Сопряжение и идентификация

- [Обзор сопряжения (DM + узлы)](/ru/channels/pairing)
- [Сопряжение узлов под управлением Gateway](/ru/gateway/pairing)
- [CLI устройств (сопряжение + ротация токенов)](/ru/cli/devices)
- [CLI сопряжения (одобрения DM)](/ru/cli/pairing)

local loopback доверие:

- Прямые подключения через local loopback могут автоматически одобряться для сопряжения, чтобы сохранить
  удобный пользовательский опыт на одном хосте.
- В OpenClaw также есть узкий путь самоподключения локально для бэкенда/контейнера для
  доверенных вспомогательных потоков с общим секретом.
- Клиенты tailnet и LAN, включая привязки tailnet на том же хосте, все равно требуют
  явного одобрения сопряжения.

## Обнаружение и транспорты

- [Обнаружение и транспорты](/ru/gateway/discovery)
- [Bonjour / mDNS](/ru/gateway/bonjour)
- [Удаленный доступ (SSH)](/ru/gateway/remote)
- [Tailscale](/ru/gateway/tailscale)

## Узлы и транспорты

- [Обзор узлов](/ru/nodes)
- [Протокол Bridge (устаревшие узлы, исторический)](/ru/gateway/bridge-protocol)
- [Руководство по эксплуатации узла: iOS](/ru/platforms/ios)
- [Руководство по эксплуатации узла: Android](/ru/platforms/android)

## Безопасность

- [Обзор безопасности](/ru/gateway/security)
- [Справочник конфигурации Gateway](/ru/gateway/configuration)
- [Устранение неполадок](/ru/gateway/troubleshooting)
- [Doctor](/ru/gateway/doctor)

## Связанные материалы

- [Руководство по эксплуатации Gateway](/ru/gateway)
- [Удаленный доступ](/ru/gateway/remote)
