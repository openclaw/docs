---
read_when:
    - Вам нужно обнаружение в глобальной сети (DNS-SD) через Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Справочник CLI для `openclaw dns` (вспомогательные средства обнаружения в глобальной сети)
title: DNS
x-i18n:
    generated_at: "2026-07-13T17:58:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

Вспомогательные средства DNS для обнаружения в глобальной сети (Tailscale + CoreDNS). В настоящее время поддерживаются только macOS и CoreDNS, установленный через Homebrew.

Связанные материалы:

- Обнаружение Gateway: [Обнаружение](/ru/gateway/discovery)
- Настройка обнаружения в глобальной сети: [Конфигурация](/ru/gateway/configuration)

## `dns setup`

Спланируйте или примените настройку CoreDNS для обнаружения DNS-SD с одноадресной рассылкой.

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| Параметр              | Результат                                                                              |
| ------------------- | ----------------------------------------------------------------------------------- |
| `--domain <domain>` | Домен обнаружения в глобальной сети (например, `openclaw.internal`).                       |
| `--apply`           | Установить или обновить конфигурацию CoreDNS и (пере)запустить службу. Требует sudo; только для macOS. |

Без `--domain` OpenClaw использует `discovery.wideArea.domain` из конфигурации.

Без `--apply` команда только выводит:

- Разрешённый домен обнаружения и путь к файлу зоны
- Текущие IP-адреса tailnet
- Рекомендуемую конфигурацию обнаружения `openclaw.json`
- Значения сервера имён и домена Tailscale Split DNS, которые необходимо задать в консоли администрирования Tailscale

С `--apply` (только для macOS, требуется CoreDNS из Homebrew):

- Инициализирует файл зоны, если он отсутствует
- Добавляет директиву импорта CoreDNS, если она отсутствует
- Перезапускает службу brew `coredns`

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Обнаружение](/ru/gateway/discovery)
