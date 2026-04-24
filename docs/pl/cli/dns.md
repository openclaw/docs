---
read_when:
    - Chcesz wykrywania w sieci rozległej (DNS-SD) przez Tailscale + CoreDNS
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Dokumentacja referencyjna CLI dla `openclaw dns` (narzędzia pomocnicze do wykrywania w sieci rozległej)
title: DNS
x-i18n:
    generated_at: "2026-04-24T09:02:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99dcf7c8c76833784a2b712b02f9e40c6c0548c37c9743a89b9d650fe503d385
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

Narzędzia pomocnicze DNS do wykrywania w sieci rozległej (Tailscale + CoreDNS). Obecnie skupiają się na macOS + CoreDNS z Homebrew.

Powiązane:

- Wykrywanie Gateway: [Discovery](/pl/gateway/discovery)
- Konfiguracja wykrywania w sieci rozległej: [Configuration](/pl/gateway/configuration)

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

- rozwiązaną domenę wykrywania
- ścieżkę pliku strefy
- bieżące adresy IP tailnet
- zalecaną konfigurację wykrywania `openclaw.json`
- wartości serwera nazw/domeny Tailscale Split DNS do ustawienia

Uwagi:

- Bez `--apply` polecenie jest tylko narzędziem pomocniczym do planowania i wypisuje zalecaną konfigurację.
- Jeśli pominięto `--domain`, OpenClaw używa `discovery.wideArea.domain` z konfiguracji.
- `--apply` obecnie obsługuje tylko macOS i zakłada CoreDNS z Homebrew.
- `--apply` inicjalizuje plik strefy, jeśli to konieczne, zapewnia istnienie sekcji importu CoreDNS i uruchamia ponownie usługę `coredns` z brew.

## Powiązane

- [Dokumentacja referencyjna CLI](/pl/cli)
- [Discovery](/pl/gateway/discovery)
