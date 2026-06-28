---
read_when:
    - Вам потрібне глобальне виявлення (DNS-SD) за допомогою Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Довідник CLI для `openclaw dns` (допоміжні засоби широкозонного виявлення)
title: DNS
x-i18n:
    generated_at: "2026-05-06T07:28:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 460bdcbaa2c0c0fc1a4f5bdd76b904d8ac35195a25324c66421abfdc2044bb07
    source_path: cli/dns.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw dns`

DNS-помічники для широкомасштабного виявлення (Tailscale + CoreDNS). Наразі зосереджено на macOS + Homebrew CoreDNS.

Пов’язане:

- Виявлення Gateway: [Виявлення](/uk/gateway/discovery)
- Конфігурація широкомасштабного виявлення: [Конфігурація](/uk/gateway/configuration)

## Налаштування

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Планує або застосовує налаштування CoreDNS для виявлення unicast DNS-SD.

Параметри:

- `--domain <domain>`: домен широкомасштабного виявлення (наприклад, `openclaw.internal`)
- `--apply`: установити або оновити конфігурацію CoreDNS і перезапустити сервіс (потрібен sudo; лише macOS)

Що показує:

- визначений домен виявлення
- шлях до файлу зони
- поточні IP-адреси tailnet
- рекомендовану конфігурацію виявлення `openclaw.json`
- значення nameserver/domain для Tailscale Split DNS, які потрібно встановити

Примітки:

- Без `--apply` команда є лише помічником для планування й виводить рекомендоване налаштування.
- Якщо `--domain` пропущено, OpenClaw використовує `discovery.wideArea.domain` з конфігурації.
- `--apply` наразі підтримує лише macOS і очікує Homebrew CoreDNS.
- `--apply` за потреби ініціалізує файл зони, забезпечує наявність stanza імпорту CoreDNS і перезапускає brew-сервіс `coredns`.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Виявлення](/uk/gateway/discovery)
