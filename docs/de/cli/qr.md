---
read_when:
    - Sie möchten eine mobile Node-App schnell mit einem Gateway koppeln
    - Sie benötigen die Ausgabe des Einrichtungscodes für die Remote-/manuelle Freigabe
summary: CLI-Referenz für `openclaw qr` (QR-Code für mobile Kopplung + Einrichtungscode generieren)
title: QR
x-i18n:
    generated_at: "2026-07-03T13:22:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2a0d71fb7be0734a015084bfb5edef74953310d384964eab9cccbabf7c497e3
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

- `--remote`: `gateway.remote.url` bevorzugen; wenn es nicht gesetzt ist, kann `gateway.tailscale.mode=serve|funnel` weiterhin die öffentliche Remote-URL bereitstellen
- `--url <url>`: Gateway-URL überschreiben, die in der Nutzlast verwendet wird
- `--public-url <url>`: öffentliche URL überschreiben, die in der Nutzlast verwendet wird
- `--token <token>`: überschreiben, gegen welches Gateway-Token der Bootstrap-Ablauf authentifiziert
- `--password <password>`: überschreiben, gegen welches Gateway-Passwort der Bootstrap-Ablauf authentifiziert
- `--setup-code-only`: nur den Einrichtungscode ausgeben
- `--no-ascii`: ASCII-QR-Darstellung überspringen
- `--json`: JSON ausgeben (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Hinweise

- `--token` und `--password` schließen sich gegenseitig aus.
- Der Einrichtungscode selbst enthält jetzt ein opakes, kurzlebiges `bootstrapToken`, nicht das gemeinsame Gateway-Token/Passwort.
- Der integrierte Einrichtungscode-Bootstrap gibt ein primäres `node`-Token mit `scopes: []` sowie ein begrenztes `operator`-Übergabe-Token für vertrauenswürdiges mobiles Onboarding zurück.
- Das übergebene Operator-Token ist auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` beschränkt; Geltungsbereiche für Kopplungsänderungen und `operator.admin` erfordern weiterhin eine separate genehmigte Operator-Kopplung oder einen separaten Token-Ablauf.
- Mobile Kopplung verweigert sicher Tailscale-/öffentliche `ws://`-Gateway-URLs. Private LAN-Adressen und `.local`-Bonjour-Hosts werden über `ws://` weiterhin unterstützt, aber Tailscale-/öffentliche mobile Routen sollten Tailscale Serve/Funnel oder eine `wss://`-Gateway-URL verwenden.
- Mit `--remote` erfordert OpenClaw entweder `gateway.remote.url` oder
  `gateway.tailscale.mode=serve|funnel`.
- Mit `--remote`: Wenn effektiv aktive Remote-Anmeldedaten als SecretRefs konfiguriert sind und Sie weder `--token` noch `--password` übergeben, löst der Befehl sie aus dem aktiven Gateway-Snapshot auf. Wenn Gateway nicht verfügbar ist, schlägt der Befehl schnell fehl.
- Ohne `--remote` werden SecretRefs für lokale Gateway-Authentifizierung aufgelöst, wenn keine CLI-Authentifizierungsüberschreibung übergeben wird:
  - `gateway.auth.token` wird aufgelöst, wenn Token-Authentifizierung gewinnen kann (explizit `gateway.auth.mode="token"` oder abgeleiteter Modus, bei dem keine Passwortquelle gewinnt).
  - `gateway.auth.password` wird aufgelöst, wenn Passwortauthentifizierung gewinnen kann (explizit `gateway.auth.mode="password"` oder abgeleiteter Modus ohne gewinnendes Token aus Authentifizierung/Umgebung).
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind (einschließlich SecretRefs) und `gateway.auth.mode` nicht gesetzt ist, schlägt die Einrichtungscode-Auflösung fehl, bis der Modus explizit gesetzt wird.
- Hinweis zu Gateway-Versionsabweichungen: Dieser Befehlspfad erfordert ein Gateway, das `secrets.resolve` unterstützt; ältere Gateways geben einen Fehler für eine unbekannte Methode zurück.
- Genehmigen Sie nach dem Scannen die Gerätekopplung mit:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Verwandt

- [CLI-Referenz](/de/cli)
- [Kopplung](/de/cli/pairing)
