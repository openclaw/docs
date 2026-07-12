---
read_when:
    - Sie möchten eine mobile Node-App schnell mit einem Gateway koppeln
    - Sie benötigen die Ausgabe des Einrichtungscodes für die Remote-/manuelle Freigabe
summary: CLI-Referenz für `openclaw qr` (QR-Code für die mobile Kopplung und Einrichtungscode generieren)
title: QR
x-i18n:
    generated_at: "2026-07-12T01:29:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32641ff4e8035f6ca2eda849a59146125763af21c4105ae6cfa584da31ac070f
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Erzeugen Sie aus Ihrer aktuellen Gateway-Konfiguration einen QR-Code und einen Einrichtungscode für die Kopplung mit einem Mobilgerät.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

Offizielle OpenClaw-Apps für iOS und Android stellen automatisch eine Verbindung her, wenn die Metadaten ihres Einrichtungscodes übereinstimmen. Wenn eine Anfrage ausstehend bleibt (beispielsweise bei einem nicht offiziellen Client oder nicht übereinstimmenden Metadaten), prüfen und genehmigen Sie sie:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Optionen

- `--remote`: bevorzugt `gateway.remote.url`; greift auf `gateway.tailscale.mode=serve|funnel` zurück, wenn diese URL nicht festgelegt ist. Ignoriert `publicUrl` des Plugins `device-pair`.
- `--url <url>`: überschreibt die in der Nutzlast verwendete Gateway-URL
- `--public-url <url>`: überschreibt die in der Nutzlast verwendete öffentliche URL
- `--token <token>`: überschreibt das Gateway-Token, gegenüber dem sich der Bootstrap-Ablauf authentifiziert
- `--password <password>`: überschreibt das Gateway-Passwort, gegenüber dem sich der Bootstrap-Ablauf authentifiziert
- `--setup-code-only`: gibt nur den Einrichtungscode aus
- `--no-ascii`: überspringt die Darstellung des QR-Codes als ASCII
- `--json`: gibt JSON aus (`setupCode`, `gatewayUrl`, optional `gatewayUrls`, `auth`, `urlSource`)

`--token` und `--password` schließen sich gegenseitig aus.

## Inhalt des Einrichtungscodes

Der Einrichtungscode enthält ein opakes, kurzlebiges `bootstrapToken`, nicht das gemeinsam verwendete Gateway-Token beziehungsweise -Passwort. Der integrierte Bootstrap-Ablauf stellt Folgendes aus:

- ein primäres `node`-Token mit `scopes: []`
- ein eingeschränktes `operator`-Übergabe-Token, das auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` begrenzt ist

Berechtigungsbereiche für Änderungen an Kopplungen und `operator.admin` erfordern weiterhin eine separate genehmigte Operator-Kopplung oder einen separaten Token-Ablauf.

## Auflösung der Gateway-URL

Die Kopplung mit Mobilgeräten schlägt bei Tailscale-/öffentlichen Gateway-URLs mit `ws://` sicher fehl: Verwenden Sie dafür Tailscale Serve/Funnel oder eine Gateway-URL mit `wss://`. Private LAN-Adressen und Bonjour-Hosts mit `.local` werden weiterhin über unverschlüsseltes `ws://` unterstützt.

Wenn die ausgewählte Gateway-URL aus `gateway.bind=lan` stammt, prüft OpenClaw außerdem persistente Routen aus `tailscale serve status --json`. Jeder HTTPS-Serve-Stammpfad, der den Loopback-Port des aktiven Gateways als Proxy bereitstellt, wird als Rückfalloption aufgenommen. Der QR-Befehl fügt diese Rückfalloption nur für `lan` hinzu; bei `custom` und `tailnet` bleiben die explizit bekannt gegebenen Routen erhalten. Aktuelle iOS-Clients prüfen die bekannt gegebenen Routen der Reihe nach und speichern die erste erreichbare Route; das veraltete Feld `url` bleibt für ältere Clients unverändert.

Bei `--remote` ist entweder `gateway.remote.url` oder `gateway.tailscale.mode=serve|funnel` erforderlich.

## Auflösung der Authentifizierung (ohne `--remote`)

Wenn keine Authentifizierungsüberschreibung über die CLI übergeben wird, werden SecretRefs für die lokale Gateway-Authentifizierung wie folgt aufgelöst:

| Bedingung                                                                                                                     | Wird aufgelöst zu                         |
| ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"` oder abgeleiteter Modus ohne vorrangige Passwortquelle                                            | `gateway.auth.token`                      |
| `gateway.auth.mode="password"` oder abgeleiteter Modus ohne vorrangiges Token aus Authentifizierung/Umgebungsvariablen         | `gateway.auth.password`                   |
| Sowohl `gateway.auth.token` als auch `gateway.auth.password` sind konfiguriert (einschließlich SecretRefs) und `gateway.auth.mode` ist nicht festgelegt | schlägt fehl; legen Sie `gateway.auth.mode` explizit fest |

## Auflösung der Authentifizierung (`--remote`)

Wenn die tatsächlich aktiven Remote-Anmeldedaten als SecretRefs konfiguriert sind und weder `--token` noch `--password` übergeben wird, löst der Befehl sie aus dem aktiven Gateway-Snapshot auf. Wenn das Gateway nicht verfügbar ist, bricht der Befehl sofort mit einem Fehler ab.

<Note>
Dieser Befehlspfad erfordert ein Gateway, das die RPC-Methode `secrets.resolve` unterstützt. Ältere Gateways geben einen Fehler wegen einer unbekannten Methode zurück.
</Note>

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Geräte](/de/cli/devices)
- [Kopplung](/de/cli/pairing)
