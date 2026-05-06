---
read_when:
    - Potrzebujesz wykrywania w sieci rozległej (DNS-SD) za pomocą Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Dokumentacja referencyjna CLI dla `openclaw dns` (pomocniki wykrywania w sieci rozległej)
title: DNS
x-i18n:
    generated_at: "2026-05-06T09:04:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 460bdcbaa2c0c0fc1a4f5bdd76b904d8ac35195a25324c66421abfdc2044bb07
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

Pomocnicze narzędzia DNS do wykrywania szerokoobszarowego (Tailscale + CoreDNS). Obecnie skupione na macOS + Homebrew CoreDNS.

Powiązane:

- Wykrywanie Gateway: [Wykrywanie](/pl/gateway/discovery)
- Konfiguracja wykrywania szerokoobszarowego: [Konfiguracja](/pl/gateway/configuration)

## Konfiguracja

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Zaplanuj lub zastosuj konfigurację CoreDNS na potrzeby wykrywania unicast DNS-SD.

Opcje:

- `--domain <domain>`: domena wykrywania szerokoobszarowego (na przykład `openclaw.internal`)
- `--apply`: zainstaluj lub zaktualizuj konfigurację CoreDNS i uruchom ponownie usługę (wymaga sudo; tylko macOS)

Co pokazuje:

- rozpoznana domena wykrywania
- ścieżka pliku strefy
- bieżące adresy IP tailnetu
- zalecana konfiguracja wykrywania `openclaw.json`
- wartości serwera nazw/domeny Tailscale Split DNS do ustawienia

Uwagi:

- Bez `--apply` polecenie służy tylko do planowania i wypisuje zalecaną konfigurację.
- Jeśli `--domain` zostanie pominięte, OpenClaw używa `discovery.wideArea.domain` z konfiguracji.
- `--apply` obecnie obsługuje tylko macOS i oczekuje Homebrew CoreDNS.
- `--apply` w razie potrzeby inicjuje plik strefy, upewnia się, że istnieje wpis importu CoreDNS, i uruchamia ponownie usługę brew `coredns`.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Wykrywanie](/pl/gateway/discovery)
