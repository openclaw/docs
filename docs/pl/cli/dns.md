---
read_when:
    - Chcesz wykrywania w sieci rozległej (DNS-SD) przez Tailscale + CoreDNS
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Dokumentacja CLI dla `openclaw dns` (pomocniki wykrywania w sieci rozległej)
title: dns
x-i18n:
    generated_at: "2026-04-05T13:48:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4831fbb7791adfed5195bc4ba36bb248d2bc8830958334211d3c96f824617927
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

Pomocniki DNS do wykrywania w sieci rozległej (Tailscale + CoreDNS). Obecnie skupiają się na macOS + Homebrew CoreDNS.

Powiązane:

- Wykrywanie gateway: [Discovery](/gateway/discovery)
- Konfiguracja wykrywania w sieci rozległej: [Configuration](/gateway/configuration)

## Konfiguracja

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Zaplanuj lub zastosuj konfigurację CoreDNS dla wykrywania unicast DNS-SD.

Opcje:

- `--domain <domain>`: domena wykrywania w sieci rozległej (na przykład `openclaw.internal`)
- `--apply`: zainstaluj lub zaktualizuj konfigurację CoreDNS i uruchom ponownie usługę (wymaga sudo; tylko macOS)

Co pokazuje:

- rozwiązana domena wykrywania
- ścieżka pliku strefy
- bieżące adresy IP tailnet
- zalecana konfiguracja wykrywania w `openclaw.json`
- wartości nameserver/domain Tailscale Split DNS do ustawienia

Uwagi:

- Bez `--apply` polecenie jest tylko pomocnikiem planowania i wypisuje zalecaną konfigurację.
- Jeśli pominięto `--domain`, OpenClaw używa `discovery.wideArea.domain` z konfiguracji.
- `--apply` obecnie obsługuje tylko macOS i oczekuje Homebrew CoreDNS.
- `--apply` inicjalizuje plik strefy, jeśli to konieczne, zapewnia istnienie sekcji importu CoreDNS i uruchamia ponownie usługę `coredns` z Homebrew.
