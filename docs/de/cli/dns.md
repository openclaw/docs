---
read_when:
    - Sie möchten bereichsübergreifende Erkennung (DNS-SD) über Tailscale + CoreDNS nutzen
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: CLI-Referenz für `openclaw dns` (Hilfsfunktionen für die Weitbereichserkennung)
title: DNS
x-i18n:
    generated_at: "2026-05-06T09:02:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 460bdcbaa2c0c0fc1a4f5bdd76b904d8ac35195a25324c66421abfdc2044bb07
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

DNS-Helfer für Wide-Area-Erkennung (Tailscale + CoreDNS). Derzeit auf macOS + Homebrew CoreDNS ausgerichtet.

Verwandt:

- Gateway-Erkennung: [Erkennung](/de/gateway/discovery)
- Wide-Area-Erkennungskonfiguration: [Konfiguration](/de/gateway/configuration)

## Einrichtung

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

CoreDNS-Einrichtung für Unicast-DNS-SD-Erkennung planen oder anwenden.

Optionen:

- `--domain <domain>`: Wide-Area-Erkennungsdomain (zum Beispiel `openclaw.internal`)
- `--apply`: CoreDNS-Konfiguration installieren oder aktualisieren und den Dienst neu starten (erfordert sudo; nur macOS)

Angezeigte Informationen:

- aufgelöste Erkennungsdomain
- Zone-Dateipfad
- aktuelle Tailnet-IPs
- empfohlene `openclaw.json`-Erkennungskonfiguration
- die festzulegenden Tailscale-Split-DNS-Nameserver-/Domainwerte

Hinweise:

- Ohne `--apply` dient der Befehl nur als Planungshilfe und gibt die empfohlene Einrichtung aus.
- Wenn `--domain` ausgelassen wird, verwendet OpenClaw `discovery.wideArea.domain` aus der Konfiguration.
- `--apply` unterstützt derzeit nur macOS und erwartet Homebrew CoreDNS.
- `--apply` initialisiert bei Bedarf die Zone-Datei, stellt sicher, dass die CoreDNS-Import-Anweisung vorhanden ist, und startet den Brew-Dienst `coredns` neu.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Erkennung](/de/gateway/discovery)
