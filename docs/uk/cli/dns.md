---
read_when:
    - Вам потрібне виявлення у глобальній мережі (DNS-SD) через Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Довідник CLI для `openclaw dns` (допоміжні засоби виявлення в глобальній мережі)
title: DNS
x-i18n:
    generated_at: "2026-07-12T13:03:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

Допоміжні засоби DNS для виявлення в глобальній мережі (Tailscale + CoreDNS). Наразі підтримуються лише macOS і CoreDNS, установлений через Homebrew.

Пов’язані матеріали:

- Виявлення Gateway: [Виявлення](/uk/gateway/discovery)
- Конфігурація виявлення в глобальній мережі: [Конфігурація](/uk/gateway/configuration)

## `dns setup`

Планування або застосування налаштування CoreDNS для виявлення DNS-SD через одноадресний DNS.

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| Параметр            | Дія                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| `--domain <domain>` | Домен виявлення в глобальній мережі (наприклад, `openclaw.internal`).                                       |
| `--apply`           | Установлює або оновлює конфігурацію CoreDNS і (пере)запускає службу. Потребує sudo; лише для macOS.          |

Без `--domain` OpenClaw використовує значення `discovery.wideArea.domain` із конфігурації.

Без `--apply` команда лише виводить:

- Визначений домен виявлення та шлях до файлу зони
- Поточні IP-адреси мережі Tailscale
- Рекомендовану конфігурацію виявлення в `openclaw.json`
- Значення сервера імен і домену Tailscale Split DNS, які потрібно встановити в консолі адміністрування Tailscale

З `--apply` (лише для macOS; потрібен CoreDNS, установлений через Homebrew):

- Ініціалізує файл зони, якщо він відсутній
- Додає директиву імпорту CoreDNS, якщо вона відсутня
- Перезапускає службу Homebrew `coredns`

## Пов’язані матеріали

- [Довідник CLI](/uk/cli)
- [Виявлення](/uk/gateway/discovery)
