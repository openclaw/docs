---
read_when:
    - Ви хочете широкозонне виявлення (DNS-SD) через Tailscale + CoreDNS
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Довідка CLI для `openclaw dns` (допоміжні засоби для широкозонного виявлення)
title: DNS
x-i18n:
    generated_at: "2026-04-23T06:17:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4831fbb7791adfed5195bc4ba36bb248d2bc8830958334211d3c96f824617927
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

Допоміжні засоби DNS для широкозонного виявлення (Tailscale + CoreDNS). Наразі зосереджено на macOS + Homebrew CoreDNS.

Пов’язано:

- Виявлення Gateway: [Виявлення](/uk/gateway/discovery)
- Конфігурація широкозонного виявлення: [Конфігурація](/uk/gateway/configuration)

## Налаштування

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Сплануйте або застосуйте налаштування CoreDNS для виявлення unicast DNS-SD.

Параметри:

- `--domain <domain>`: домен широкозонного виявлення (наприклад, `openclaw.internal`)
- `--apply`: установити або оновити конфігурацію CoreDNS і перезапустити сервіс (потребує sudo; лише macOS)

Що показується:

- визначений домен виявлення
- шлях до файлу зони
- поточні IP-адреси tailnet
- рекомендована конфігурація виявлення в `openclaw.json`
- значення nameserver/domain для Tailscale Split DNS, які потрібно встановити

Примітки:

- Без `--apply` команда є лише допоміжним засобом планування та виводить рекомендоване налаштування.
- Якщо `--domain` не вказано, OpenClaw використовує `discovery.wideArea.domain` із конфігурації.
- `--apply` наразі підтримується лише на macOS і очікує Homebrew CoreDNS.
- `--apply` ініціалізує файл зони за потреби, перевіряє наявність import-рядка CoreDNS і перезапускає brew-сервіс `coredns`.
