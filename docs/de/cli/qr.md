---
read_when:
    - Sie möchten schnell eine mobile Node-App mit einem Gateway koppeln
    - Sie benötigen die Ausgabe des Einrichtungscodes für Remote-/manuelle Freigabe
summary: CLI-Referenz für `openclaw qr` (mobilen Kopplungs-QR-Code + Einrichtungscode generieren)
title: QR
x-i18n:
    generated_at: "2026-06-27T17:20:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d08bbeb69627dafea45c912af4e92c08cd5c79d4ae52bb3f0a6fba5e789acb51
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Generieren Sie einen QR-Code für die mobile Kopplung und einen Einrichtungscode aus Ihrer aktuellen Gateway-Konfiguration.

## Verwendung

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Optionen

- `--remote`: bevorzugt `gateway.remote.url`; wenn dies nicht gesetzt ist, kann `gateway.tailscale.mode=serve|funnel` dennoch die öffentliche Remote-URL bereitstellen
- `--url <url>`: überschreibt die im Payload verwendete Gateway-URL
- `--public-url <url>`: überschreibt die im Payload verwendete öffentliche URL
- `--token <token>`: überschreibt, gegen welches Gateway-Token sich der Bootstrap-Ablauf authentifiziert
- `--password <password>`: überschreibt, gegen welches Gateway-Passwort sich der Bootstrap-Ablauf authentifiziert
- `--setup-code-only`: gibt nur den Einrichtungscode aus
- `--no-ascii`: überspringt das ASCII-QR-Rendering
- `--json`: gibt JSON aus (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Hinweise

- `--token` und `--password` schließen sich gegenseitig aus.
- Der Einrichtungscode selbst enthält jetzt ein opakes, kurzlebiges `bootstrapToken`, nicht das gemeinsame Gateway-Token/Passwort.
- Der integrierte Bootstrap für Einrichtungscodes gibt ein primäres `node`-Token mit `scopes: []` plus ein begrenztes `operator`-Übergabe-Token für vertrauenswürdiges mobiles Onboarding zurück.
- Das übergebene Operator-Token ist auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` beschränkt; `operator.admin` und `operator.pairing` erfordern eine separate genehmigte Operator-Kopplung oder einen separaten Token-Ablauf.
- Die mobile Kopplung schlägt für Tailscale/öffentliche `ws://`-Gateway-URLs sicher fehl. Private LAN-Adressen und `.local`-Bonjour-Hosts bleiben über `ws://` unterstützt, aber Tailscale/öffentliche mobile Routen sollten Tailscale Serve/Funnel oder eine `wss://`-Gateway-URL verwenden.
- Mit `--remote` erfordert OpenClaw entweder `gateway.remote.url` oder
  `gateway.tailscale.mode=serve|funnel`.
- Mit `--remote` löst der Befehl effektiv aktive Remote-Anmeldedaten, die als SecretRefs konfiguriert sind, aus dem aktiven Gateway-Snapshot auf, wenn Sie weder `--token` noch `--password` übergeben. Wenn das Gateway nicht verfügbar ist, schlägt der Befehl schnell fehl.
- Ohne `--remote` werden lokale Gateway-Auth-SecretRefs aufgelöst, wenn keine CLI-Auth-Überschreibung übergeben wird:
  - `gateway.auth.token` wird aufgelöst, wenn Token-Auth gewinnen kann (explizit `gateway.auth.mode="token"` oder abgeleiteter Modus, bei dem keine Passwortquelle gewinnt).
  - `gateway.auth.password` wird aufgelöst, wenn Passwort-Auth gewinnen kann (explizit `gateway.auth.mode="password"` oder abgeleiteter Modus ohne gewinnendes Token aus Auth/Env).
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind (einschließlich SecretRefs) und `gateway.auth.mode` nicht gesetzt ist, schlägt die Auflösung des Einrichtungscodes fehl, bis der Modus explizit gesetzt wird.
- Hinweis zu Gateway-Versionsabweichungen: Dieser Befehlspfad erfordert ein Gateway, das `secrets.resolve` unterstützt; ältere Gateways geben einen Fehler wegen einer unbekannten Methode zurück.
- Nach dem Scannen genehmigen Sie die Gerätekopplung mit:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Kopplung](/de/cli/pairing)
