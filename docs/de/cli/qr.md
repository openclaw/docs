---
read_when:
    - Sie möchten eine mobile Node-App schnell mit einem Gateway koppeln
    - Sie benötigen die setup-code-Ausgabe für die Remote-/manuelle Weitergabe
summary: CLI-Referenz für `openclaw qr` (QR-Code für mobile Kopplung + Einrichtungscode generieren)
title: QR
x-i18n:
    generated_at: "2026-07-04T17:53:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81d15c9d551960c6f5677649b481e447ecda55a395957746959b4ecf81712bdb
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
- `--url <url>`: die im Payload verwendete Gateway-URL überschreiben
- `--public-url <url>`: die im Payload verwendete öffentliche URL überschreiben
- `--token <token>`: überschreiben, gegen welches Gateway-Token der Bootstrap-Ablauf authentifiziert
- `--password <password>`: überschreiben, gegen welches Gateway-Passwort der Bootstrap-Ablauf authentifiziert
- `--setup-code-only`: nur den Einrichtungscode ausgeben
- `--no-ascii`: ASCII-QR-Darstellung überspringen
- `--json`: JSON ausgeben (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Hinweise

- `--token` und `--password` schließen sich gegenseitig aus.
- Der Einrichtungscode selbst trägt jetzt ein opakes, kurzlebiges `bootstrapToken`, nicht das gemeinsame Gateway-Token/Passwort.
- Der integrierte Einrichtungscode-Bootstrap gibt ein primäres `node`-Token mit `scopes: []` sowie ein begrenztes `operator`-Übergabe-Token für vertrauenswürdiges mobiles Onboarding zurück.
- Das übergebene Operator-Token ist auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` begrenzt; Kopplungs-Mutations-Scopes und `operator.admin` erfordern weiterhin eine separate genehmigte Operator-Kopplung oder einen Token-Ablauf.
- Mobile Kopplung schlägt für Tailscale/öffentliche `ws://`-Gateway-URLs geschlossen fehl. Private LAN-Adressen und `.local`-Bonjour-Hosts werden weiterhin über `ws://` unterstützt, aber mobile Routen über Tailscale/öffentlich sollten Tailscale Serve/Funnel oder eine `wss://`-Gateway-URL verwenden.
- Mit `--remote` erfordert OpenClaw entweder `gateway.remote.url` oder
  `gateway.tailscale.mode=serve|funnel`.
- Mit `--remote`, wenn effektiv aktive Remote-Anmeldedaten als SecretRefs konfiguriert sind und Sie weder `--token` noch `--password` übergeben, löst der Befehl sie aus dem aktiven Gateway-Snapshot auf. Wenn der Gateway nicht verfügbar ist, schlägt der Befehl schnell fehl.
- Ohne `--remote` werden lokale Gateway-Auth-SecretRefs aufgelöst, wenn keine CLI-Auth-Überschreibung übergeben wird:
  - `gateway.auth.token` wird aufgelöst, wenn Token-Auth gewinnen kann (explizit `gateway.auth.mode="token"` oder abgeleiteter Modus, bei dem keine Passwortquelle gewinnt).
  - `gateway.auth.password` wird aufgelöst, wenn Passwort-Auth gewinnen kann (explizit `gateway.auth.mode="password"` oder abgeleiteter Modus ohne gewinnendes Token aus Auth/Env).
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind (einschließlich SecretRefs) und `gateway.auth.mode` nicht gesetzt ist, schlägt die Auflösung des Einrichtungscodes fehl, bis der Modus explizit gesetzt wird.
- Hinweis zu Gateway-Versionsabweichungen: Dieser Befehlspfad erfordert einen Gateway, der `secrets.resolve` unterstützt; ältere Gateways geben einen Fehler wegen einer unbekannten Methode zurück.
- Offizielle OpenClaw-iOS- und Android-Apps verbinden sich automatisch, wenn ihre
  Einrichtungscode-Metadaten übereinstimmen. Wenn eine Anfrage ausstehend bleibt (zum Beispiel für einen
  nicht offiziellen Client oder nicht übereinstimmende Metadaten), prüfen und genehmigen Sie sie mit:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Verwandt

- [CLI-Referenz](/de/cli)
- [Kopplung](/de/cli/pairing)
