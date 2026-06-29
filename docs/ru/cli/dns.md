---
read_when:
    - Вам нужно широкомасштабное обнаружение (DNS-SD) через Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Справочник CLI для `openclaw dns` (вспомогательные средства обнаружения в глобальной сети)
title: DNS
x-i18n:
    generated_at: "2026-06-28T22:43:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 460bdcbaa2c0c0fc1a4f5bdd76b904d8ac35195a25324c66421abfdc2044bb07
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

DNS-помощники для обнаружения в глобальной сети (Tailscale + CoreDNS). Сейчас ориентированы на macOS + Homebrew CoreDNS.

Связано:

- Обнаружение Gateway: [Обнаружение](/ru/gateway/discovery)
- Конфигурация обнаружения в глобальной сети: [Конфигурация](/ru/gateway/configuration)

## Настройка

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Спланировать или применить настройку CoreDNS для обнаружения через одноадресный DNS-SD.

Параметры:

- `--domain <domain>`: домен обнаружения в глобальной сети (например, `openclaw.internal`)
- `--apply`: установить или обновить конфигурацию CoreDNS и перезапустить службу (требуется sudo; только macOS)

Что выводится:

- разрешенный домен обнаружения
- путь к файлу зоны
- текущие IP-адреса tailnet
- рекомендуемая конфигурация обнаружения `openclaw.json`
- значения сервера имен/домена Tailscale Split DNS, которые нужно задать

Примечания:

- Без `--apply` команда служит только помощником для планирования и выводит рекомендуемую настройку.
- Если `--domain` не указан, OpenClaw использует `discovery.wideArea.domain` из конфигурации.
- `--apply` сейчас поддерживает только macOS и ожидает Homebrew CoreDNS.
- `--apply` при необходимости инициализирует файл зоны, проверяет наличие директивы импорта CoreDNS и перезапускает brew-службу `coredns`.

## Связано

- [Справочник CLI](/ru/cli)
- [Обнаружение](/ru/gateway/discovery)
