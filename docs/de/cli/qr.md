---
read_when:
    - Sie möchten eine mobile Node-App schnell mit einem Gateway koppeln
    - Sie benötigen die Ausgabe des Einrichtungscodes für die Remote-/manuelle Freigabe.
summary: CLI-Referenz für `openclaw qr` (QR-Code für die mobile Kopplung und Einrichtungscode generieren)
title: QR
x-i18n:
    generated_at: "2026-07-12T15:08:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 32641ff4e8035f6ca2eda849a59146125763af21c4105ae6cfa584da31ac070f
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Generieren Sie einen QR-Code für die mobile Kopplung und einen Einrichtungscode aus Ihrer aktuellen Gateway-Konfiguration.

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

- `--remote`: bevorzugt `gateway.remote.url`; fällt auf `gateway.tailscale.mode=serve|funnel` zurück, wenn diese URL nicht festgelegt ist. Ignoriert `publicUrl` des Plugins `device-pair`.
- `--url <url>`: überschreibt die im Payload verwendete Gateway-URL
- `--public-url <url>`: überschreibt die im Payload verwendete öffentliche URL
- `--token <token>`: überschreibt das Gateway-Token, gegenüber dem sich der Bootstrap-Ablauf authentifiziert
- `--password <password>`: überschreibt das Gateway-Passwort, gegenüber dem sich der Bootstrap-Ablauf authentifiziert
- `--setup-code-only`: gibt nur den Einrichtungscode aus
- `--no-ascii`: überspringt die ASCII-Darstellung des QR-Codes
- `--json`: gibt JSON aus (`setupCode`, `gatewayUrl`, optional `gatewayUrls`, `auth`, `urlSource`)

`--token` und `--password` schließen sich gegenseitig aus.

## Inhalt des Einrichtungscodes

Der Einrichtungscode enthält ein opakes, kurzlebiges `bootstrapToken`, nicht das gemeinsam verwendete Gateway-Token/-Passwort. Der integrierte Bootstrap-Ablauf stellt Folgendes aus:

- ein primäres `node`-Token mit `scopes: []`
- ein beschränktes `operator`-Übergabe-Token, das auf `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write` begrenzt ist

Berechtigungsbereiche für Kopplungsänderungen und `operator.admin` erfordern weiterhin eine separate genehmigte Operator-Kopplung oder einen separaten Token-Ablauf.

## Auflösung der Gateway-URL

Die mobile Kopplung schlägt bei Tailscale-/öffentlichen `ws://`-Gateway-URLs sicher fehl: Verwenden Sie dafür Tailscale Serve/Funnel oder eine `wss://`-Gateway-URL. Private LAN-Adressen und `.local`-Bonjour-Hosts werden weiterhin über einfaches `ws://` unterstützt.

Wenn die ausgewählte Gateway-URL von `gateway.bind=lan` stammt, prüft OpenClaw außerdem persistente Routen aus `tailscale serve status --json`. Jeder HTTPS-Serve-Stamm, der den Loopback-Port des aktiven Gateways weiterleitet, wird als Ausweichroute aufgenommen. Der QR-Befehl fügt diese Ausweichroute nur für `lan` hinzu; `custom` und `tailnet` behalten ihre ausdrücklich bekannt gegebenen Routen. Aktuelle iOS-Clients prüfen die bekannt gegebenen Routen der Reihe nach und speichern die erste erreichbare Route; das veraltete Feld `url` bleibt für ältere Clients unverändert.

Mit `--remote` ist entweder `gateway.remote.url` oder `gateway.tailscale.mode=serve|funnel` erforderlich.

## Authentifizierungsauflösung (ohne `--remote`)

Wenn keine CLI-Überschreibung für die Authentifizierung übergeben wird, werden lokale SecretRefs für die Gateway-Authentifizierung wie folgt aufgelöst:

| Bedingung                                                                                                                    | Wird aufgelöst zu                         |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"` oder abgeleiteter Modus ohne maßgebliche Passwortquelle                                          | `gateway.auth.token`                      |
| `gateway.auth.mode="password"` oder abgeleiteter Modus ohne maßgebliches Token aus Authentifizierung/Umgebung                 | `gateway.auth.password`                   |
| Sowohl `gateway.auth.token` als auch `gateway.auth.password` sind konfiguriert (einschließlich SecretRefs) und `gateway.auth.mode` ist nicht festgelegt | schlägt fehl; legen Sie `gateway.auth.mode` ausdrücklich fest |

## Authentifizierungsauflösung (`--remote`)

Wenn die tatsächlich aktiven Remote-Anmeldedaten als SecretRefs konfiguriert sind und weder `--token` noch `--password` übergeben wird, löst der Befehl sie aus dem aktiven Gateway-Snapshot auf. Wenn das Gateway nicht verfügbar ist, schlägt der Befehl sofort fehl.

<Note>
Dieser Befehlspfad erfordert ein Gateway, das die RPC-Methode `secrets.resolve` unterstützt. Ältere Gateways geben einen Fehler wegen einer unbekannten Methode zurück.
</Note>

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Geräte](/de/cli/devices)
- [Kopplung](/de/cli/pairing)
