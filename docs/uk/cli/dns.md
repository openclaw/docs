---
read_when:
    - Ви хочете wide-area discovery (DNS-SD) через Tailscale + CoreDNS
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Довідник CLI для `openclaw dns` (допоміжні засоби wide-area discovery)
title: DNS
x-i18n:
    generated_at: "2026-04-23T20:47:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5205cd835b7bd6e873b473d40b94fbc764a9ad8a5184111f9866390c6d0c4d53
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

Допоміжні засоби DNS для wide-area discovery (Tailscale + CoreDNS). Наразі зосереджено на macOS + Homebrew CoreDNS.

Пов’язане:

- Discovery Gateway: [Discovery](/uk/gateway/discovery)
- Конфігурація wide-area discovery: [Configuration](/uk/gateway/configuration)

## Налаштування

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Планування або застосування налаштування CoreDNS для unicast DNS-SD discovery.

Параметри:

- `--domain <domain>`: домен wide-area discovery (наприклад, `openclaw.internal`)
- `--apply`: установити або оновити конфігурацію CoreDNS і перезапустити сервіс (потребує sudo; лише macOS)

Що показується:

- розв’язаний домен discovery
- шлях до файла зони
- поточні IP tailnet
- рекомендована конфігурація discovery для `openclaw.json`
- значення nameserver/domain Tailscale Split DNS, які потрібно встановити

Примітки:

- Без `--apply` команда є лише допоміжним засобом планування й виводить рекомендоване налаштування.
- Якщо `--domain` не вказано, OpenClaw використовує `discovery.wideArea.domain` з конфігурації.
- `--apply` наразі підтримується лише на macOS і очікує Homebrew CoreDNS.
- `--apply` ініціалізує файл зони за потреби, гарантує наявність import stanza для CoreDNS і перезапускає brew-сервіс `coredns`.
