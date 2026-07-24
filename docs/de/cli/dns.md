---
read_when:
    - Sie möchten eine standortübergreifende Erkennung (DNS-SD) über Tailscale + CoreDNS.
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: CLI-Referenz für `openclaw dns` (Hilfsfunktionen für die Weitbereichserkennung)
title: DNS
x-i18n:
    generated_at: "2026-07-24T04:50:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

DNS-Hilfsfunktionen für die Weitbereichserkennung (Tailscale + CoreDNS). Derzeit nur macOS + Homebrew CoreDNS.

Verwandte Themen:

- Gateway-Erkennung: [Erkennung](/de/gateway/discovery)
- Konfiguration der Weitbereichserkennung: [Konfiguration](/de/gateway/configuration)

## `dns setup`

CoreDNS-Einrichtung für die Unicast-DNS-SD-Erkennung planen oder anwenden.

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| Option              | Wirkung                                                                              |
| ------------------- | ----------------------------------------------------------------------------------- |
| `--domain <domain>` | Domäne für die Weitbereichserkennung (zum Beispiel `openclaw.internal`).                       |
| `--apply`           | CoreDNS-Konfiguration installieren/aktualisieren und den Dienst (neu) starten. Erfordert sudo, nur macOS. |

Ohne `--domain` verwendet OpenClaw `discovery.wideArea.domain` aus der Konfiguration.

Ohne `--apply` gibt der Befehl nur Folgendes aus:

- Aufgelöste Erkennungsdomäne und Pfad der Zonendatei
- Aktuelle Tailnet-IPs
- Empfohlene `openclaw.json`-Erkennungskonfiguration
- Im Tailscale-Administrationsportal festzulegende Werte für Nameserver und Domäne von Tailscale Split DNS

Mit `--apply` (nur macOS, erfordert Homebrew CoreDNS):

- Initialisiert die Zonendatei, falls sie fehlt
- Fügt die CoreDNS-Importanweisung hinzu, falls sie fehlt
- Startet den Brew-Dienst `coredns` neu

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Erkennung](/de/gateway/discovery)
