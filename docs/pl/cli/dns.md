---
read_when:
    - Chcesz korzystać z wykrywania w sieci rozległej (DNS-SD) za pośrednictwem Tailscale i CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Dokumentacja CLI dla `openclaw dns` (narzędzia pomocnicze do wykrywania w sieci rozległej)
title: DNS
x-i18n:
    generated_at: "2026-07-12T14:58:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

Narzędzia pomocnicze DNS do wykrywania w sieci rozległej (Tailscale + CoreDNS). Obecnie obsługiwane są tylko macOS i CoreDNS z Homebrew.

Powiązane:

- Wykrywanie Gateway: [Wykrywanie](/pl/gateway/discovery)
- Konfiguracja wykrywania w sieci rozległej: [Konfiguracja](/pl/gateway/configuration)

## `dns setup`

Zaplanuj lub zastosuj konfigurację CoreDNS na potrzeby wykrywania DNS-SD z użyciem transmisji pojedynczej.

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| Opcja               | Działanie                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--domain <domain>` | Domena wykrywania w sieci rozległej (na przykład `openclaw.internal`).                                          |
| `--apply`           | Instaluje lub aktualizuje konfigurację CoreDNS oraz uruchamia bądź ponownie uruchamia usługę. Wymaga sudo; tylko macOS. |

Bez opcji `--domain` OpenClaw używa wartości `discovery.wideArea.domain` z konfiguracji.

Bez opcji `--apply` polecenie wyświetla tylko:

- Ustaloną domenę wykrywania i ścieżkę pliku strefy
- Bieżące adresy IP sieci tailnet
- Zalecaną konfigurację wykrywania w pliku `openclaw.json`
- Wartości serwera nazw i domeny Tailscale Split DNS, które należy ustawić w konsoli administracyjnej Tailscale

Z opcją `--apply` (tylko macOS, wymagany CoreDNS z Homebrew):

- Inicjuje plik strefy, jeśli go brakuje
- Dodaje sekcję importu CoreDNS, jeśli jej brakuje
- Ponownie uruchamia usługę Homebrew `coredns`

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Wykrywanie](/pl/gateway/discovery)
