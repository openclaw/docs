---
read_when:
    - Sie möchten eine mobile Node-App schnell mit einem Gateway koppeln.
    - Sie benötigen die Ausgabe des Einrichtungscodes für die Remote-/manuelle Freigabe
summary: CLI-Referenz für `openclaw qr` (QR-Code für die mobile Kopplung + Einrichtungscode generieren)
title: QR
x-i18n:
    generated_at: "2026-07-16T12:40:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f9d60a58126eae7eec5979f28bb511a09fa52b68cdd73727fca0b2de74efa84a
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
openclaw qr --limited
openclaw qr --url wss://gateway.example/ws
```

Offizielle OpenClaw-Apps für iOS und Android stellen automatisch eine Verbindung her, wenn die Metadaten ihres Einrichtungscodes übereinstimmen. Falls eine Anfrage ausstehend bleibt (beispielsweise bei einem nicht offiziellen Client oder nicht übereinstimmenden Metadaten), prüfen und genehmigen Sie sie:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Optionen

- `--remote`: bevorzugt `gateway.remote.url`; greift auf `gateway.tailscale.mode=serve|funnel` zurück, wenn diese URL nicht festgelegt ist. Ignoriert Plugin `publicUrl` von `device-pair`.
- `--url <url>`: überschreibt die im Payload verwendete Gateway-URL
- `--public-url <url>`: überschreibt die im Payload verwendete öffentliche URL
- `--token <token>`: überschreibt das Gateway-Token, mit dem sich der Bootstrap-Ablauf authentifiziert
- `--password <password>`: überschreibt das Gateway-Passwort, mit dem sich der Bootstrap-Ablauf authentifiziert
- `--limited`: lässt administrativen Gateway-Zugriff im übergebenen Operator-Token weg
- `--setup-code-only`: gibt nur den Einrichtungscode aus
- `--no-ascii`: überspringt die ASCII-QR-Darstellung
- `--json`: gibt JSON aus (`setupCode`, `gatewayUrl`, optional `gatewayUrls`, `auth`, `access`, optional `accessDowngraded`, `urlSource`)

`--token` und `--password` schließen sich gegenseitig aus.

## Inhalt des Einrichtungscodes

Der Einrichtungscode enthält einen opaken, kurzlebigen `bootstrapToken`, nicht das gemeinsam verwendete Gateway-Token/-Passwort. Für einen `wss://`-Endpunkt (oder Loopback auf demselben Host) stellt der standardmäßige Bootstrap-Ablauf Folgendes aus:

- ein primäres `node`-Token mit `scopes: []`
- ein vollständiges natives mobiles `operator`-Übergabe-Token mit `operator.admin`, `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write`

Verwenden Sie `--limited`, um dasselbe Node-Token beizubehalten und dabei `operator.admin` aus der Operator-Übergabe wegzulassen. Der Geltungsbereich für Kopplungsänderungen wird niemals über einen Einrichtungscode übergeben.

Die Einrichtung über Klartext-LAN-`ws://` bleibt verfügbar, OpenClaw verwendet jedoch automatisch
das eingeschränkte Profil, da ein Netzwerkbeobachter das Bearer-
Bootstrap-Token abfangen und schneller verwenden könnte. Konfigurieren Sie `wss://` oder Tailscale Serve und generieren Sie anschließend einen neuen Code,
um vollständigen Zugriff zu erhalten.

## Auflösung der Gateway-URL

Die mobile Kopplung schlägt bei Tailscale-/öffentlichen `ws://`-Gateway-URLs sicher fehl: Verwenden Sie dafür Tailscale Serve/Funnel oder eine `wss://`-Gateway-URL. Private LAN-Adressen und `.local`-Bonjour-Hosts werden weiterhin über einfaches `ws://` unterstützt, mit eingeschränktem Operator-Zugriff wie oben beschrieben.

Wenn die ausgewählte Gateway-URL aus `gateway.bind=lan` stammt, prüft OpenClaw außerdem persistente `tailscale serve status --json`-Routen. Jede HTTPS-Serve-Root, die den Loopback-Port des aktiven Gateways per Proxy weiterleitet, wird als Fallback aufgenommen. Der QR-Befehl fügt diesen Fallback nur für `lan` hinzu; `custom` und `tailnet` behalten ihre ausdrücklich angekündigten Routen bei. Aktuelle iOS-Clients prüfen die angekündigten Routen der Reihe nach und speichern die erste erreichbare Route; das veraltete Feld `url` bleibt für ältere Clients unverändert.

Bei `--remote` ist entweder `gateway.remote.url` oder `gateway.tailscale.mode=serve|funnel` erforderlich.

## Authentifizierungsauflösung (ohne `--remote`)

Wenn keine CLI-Überschreibung für die Authentifizierung übergeben wird, werden lokale SecretRefs für die Gateway-Authentifizierung wie folgt aufgelöst:

| Bedingung                                                                                                                    | Wird aufgelöst zu                         |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"` oder abgeleiteter Modus ohne vorrangige Passwortquelle                                                | `gateway.auth.token`                      |
| `gateway.auth.mode="password"` oder abgeleiteter Modus ohne vorrangiges Token aus Authentifizierung/Umgebung                                         | `gateway.auth.password`                   |
| Sowohl `gateway.auth.token` als auch `gateway.auth.password` sind konfiguriert (einschließlich SecretRefs) und `gateway.auth.mode` ist nicht festgelegt | schlägt fehl; legen Sie `gateway.auth.mode` ausdrücklich fest |

## Authentifizierungsauflösung (`--remote`)

Wenn tatsächlich aktive Remote-Anmeldedaten als SecretRefs konfiguriert sind und weder `--token` noch `--password` übergeben wird, löst der Befehl sie aus dem aktiven Gateway-Snapshot auf. Wenn das Gateway nicht verfügbar ist, schlägt der Befehl sofort fehl.

<Note>
Dieser Befehlspfad erfordert ein Gateway, das die RPC-Methode `secrets.resolve` unterstützt. Ältere Gateways geben einen Fehler wegen einer unbekannten Methode zurück.
</Note>

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Geräte](/de/cli/devices)
- [Kopplung](/de/cli/pairing)
