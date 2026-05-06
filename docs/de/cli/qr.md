---
read_when:
    - Sie möchten schnell eine mobile Node-App mit einem Gateway koppeln
    - Sie benötigen die Ausgabe des Einrichtungscodes für die Remote-/manuelle Freigabe
summary: CLI-Referenz für `openclaw qr` (QR-Code für mobile Kopplung und Einrichtungscode generieren)
title: QR
x-i18n:
    generated_at: "2026-05-06T06:42:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2e8f86b860701dcd625b6573070e30ed26a2f3fda9e5e7998723c8058de498b
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Generieren Sie einen QR-Code für mobiles Pairing und einen Einrichtungscode aus Ihrer aktuellen Gateway-Konfiguration.

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
- `--url <url>`: die im Payload verwendete Gateway-URL überschreiben
- `--public-url <url>`: die im Payload verwendete öffentliche URL überschreiben
- `--token <token>`: überschreiben, gegen welches Gateway-Token sich der Bootstrap-Ablauf authentifiziert
- `--password <password>`: überschreiben, gegen welches Gateway-Passwort sich der Bootstrap-Ablauf authentifiziert
- `--setup-code-only`: nur den Einrichtungscode ausgeben
- `--no-ascii`: ASCII-QR-Darstellung überspringen
- `--json`: JSON ausgeben (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Hinweise

- `--token` und `--password` schließen sich gegenseitig aus.
- Der Einrichtungscode selbst enthält jetzt ein opakes, kurzlebiges `bootstrapToken`, nicht das gemeinsam verwendete Gateway-Token/Passwort.
- Im integrierten Bootstrap-Ablauf für Node/Operator landet das primäre Node-Token weiterhin mit `scopes: []`.
- Wenn die Bootstrap-Übergabe auch ein Operator-Token ausstellt, bleibt es auf die Bootstrap-Allowlist beschränkt: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Bootstrap-Scope-Prüfungen sind rollenpräfixiert. Diese Operator-Allowlist erfüllt nur Operator-Anfragen; Nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.
- Mobiles Pairing schlägt für Tailscale/öffentliche `ws://`-Gateway-URLs geschlossen fehl. Private LAN-Adressen und `.local`-Bonjour-Hosts werden über `ws://` weiterhin unterstützt, aber Tailscale/öffentliche mobile Routen sollten Tailscale Serve/Funnel oder eine `wss://`-Gateway-URL verwenden.
- Mit `--remote` benötigt OpenClaw entweder `gateway.remote.url` oder
  `gateway.tailscale.mode=serve|funnel`.
- Mit `--remote`: Wenn effektiv aktive Remote-Anmeldedaten als SecretRefs konfiguriert sind und Sie weder `--token` noch `--password` übergeben, löst der Befehl sie aus dem aktiven Gateway-Snapshot auf. Wenn das Gateway nicht verfügbar ist, schlägt der Befehl schnell fehl.
- Ohne `--remote` werden SecretRefs für lokale Gateway-Authentifizierung aufgelöst, wenn keine CLI-Authentifizierungsüberschreibung übergeben wird:
  - `gateway.auth.token` wird aufgelöst, wenn Token-Authentifizierung gewinnen kann (explizites `gateway.auth.mode="token"` oder abgeleiteter Modus, in dem keine Passwortquelle gewinnt).
  - `gateway.auth.password` wird aufgelöst, wenn Passwort-Authentifizierung gewinnen kann (explizites `gateway.auth.mode="password"` oder abgeleiteter Modus ohne gewinnendes Token aus Auth/Env).
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind (einschließlich SecretRefs) und `gateway.auth.mode` nicht gesetzt ist, schlägt die Einrichtungscode-Auflösung fehl, bis der Modus explizit gesetzt wird.
- Hinweis zu Gateway-Versionsabweichungen: Dieser Befehlspfad benötigt ein Gateway, das `secrets.resolve` unterstützt; ältere Gateways geben einen Fehler wegen unbekannter Methode zurück.
- Genehmigen Sie nach dem Scannen das Geräte-Pairing mit:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Pairing](/de/cli/pairing)
