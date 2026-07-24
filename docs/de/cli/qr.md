---
read_when:
    - Sie möchten eine mobile Node-App schnell mit einem Gateway koppeln
    - Sie benötigen die Ausgabe des Einrichtungscodes für die Remote-/manuelle Freigabe
summary: CLI-Referenz für `openclaw qr` (QR-Code für die mobile Kopplung und Einrichtungscode generieren)
title: QR
x-i18n:
    generated_at: "2026-07-24T04:19:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f9d60a58126eae7eec5979f28bb511a09fa52b68cdd73727fca0b2de74efa84a
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Generieren Sie anhand Ihrer aktuellen Gateway-Konfiguration einen QR-Code zur mobilen Kopplung und einen Einrichtungscode.

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

- `--remote`: `gateway.remote.url` bevorzugen; greift auf `gateway.tailscale.mode=serve|funnel` zurück, wenn diese URL nicht festgelegt ist. Ignoriert `publicUrl` des `device-pair`-Plugins.
- `--url <url>`: die in der Nutzlast verwendete Gateway-URL überschreiben
- `--public-url <url>`: die in der Nutzlast verwendete öffentliche URL überschreiben
- `--token <token>`: das Gateway-Token überschreiben, mit dem sich der Bootstrap-Ablauf authentifiziert
- `--password <password>`: das Gateway-Passwort überschreiben, mit dem sich der Bootstrap-Ablauf authentifiziert
- `--limited`: administrativen Gateway-Zugriff aus dem übergebenen Operator-Token ausschließen
- `--setup-code-only`: nur den Einrichtungscode ausgeben
- `--no-ascii`: die ASCII-Darstellung des QR-Codes überspringen
- `--json`: JSON ausgeben (`setupCode`, `gatewayUrl`, optional `gatewayUrls`, `auth`, `access`, optional `accessDowngraded`, `urlSource`)

`--token` und `--password` schließen sich gegenseitig aus.

## Inhalt des Einrichtungscodes

Der Einrichtungscode enthält ein undurchsichtiges, kurzlebiges `bootstrapToken`, nicht das gemeinsam verwendete Gateway-Token bzw. -Passwort. Für einen `wss://`-Endpunkt (oder eine Loopback-Verbindung auf demselben Host) stellt der standardmäßige Bootstrap-Ablauf Folgendes aus:

- ein primäres `node`-Token mit `scopes: []`
- ein vollständiges natives `operator`-Übergabe-Token für Mobilgeräte mit `operator.admin`, `operator.approvals`, `operator.read`, `operator.talk.secrets` und `operator.write`

Verwenden Sie `--limited`, um dasselbe Node-Token beizubehalten und dabei `operator.admin` aus der Übergabe an den Operator auszuschließen. Der Berechtigungsumfang für Kopplungsänderungen wird niemals über einen Einrichtungscode übergeben.

Die Einrichtung über Klartext-LAN mit `ws://` bleibt verfügbar, OpenClaw verwendet jedoch automatisch das eingeschränkte Profil, da ein Netzwerkbeobachter das Bearer-Bootstrap-Token abfangen und bei dessen Verwendung zuvorkommen könnte. Konfigurieren Sie `wss://` oder Tailscale Serve und generieren Sie anschließend einen neuen Code, um vollständigen Zugriff zu erhalten.

## Auflösung der Gateway-URL

Die mobile Kopplung schlägt bei Tailscale-/öffentlichen `ws://`-Gateway-URLs sicher fehl: Verwenden Sie dafür Tailscale Serve/Funnel oder eine `wss://`-Gateway-URL. Private LAN-Adressen und `.local`-Bonjour-Hosts werden weiterhin über unverschlüsseltes `ws://` unterstützt, wobei der Operator-Zugriff wie oben beschrieben eingeschränkt ist.

Wenn die ausgewählte Gateway-URL aus `gateway.bind=lan` stammt, prüft OpenClaw außerdem persistente `tailscale serve status --json`-Routen. Jeder HTTPS-Serve-Stammpfad, der den Loopback-Port des aktiven Gateways per Proxy weiterleitet, wird als Ausweichroute einbezogen. Der QR-Befehl fügt diese Ausweichroute nur für `lan` hinzu; `custom` und `tailnet` behalten ihre ausdrücklich bekannt gegebenen Routen bei. Aktuelle iOS-Clients prüfen die bekannt gegebenen Routen der Reihe nach und speichern die erste erreichbare Route; das veraltete Feld `url` bleibt für ältere Clients unverändert.

Mit `--remote` ist entweder `gateway.remote.url` oder `gateway.tailscale.mode=serve|funnel` erforderlich.

## Authentifizierungsauflösung (ohne `--remote`)

Wenn keine Authentifizierungsüberschreibung über die CLI angegeben wird, werden SecretRefs für die lokale Gateway-Authentifizierung wie folgt aufgelöst:

| Bedingung                                                                                                                    | Wird aufgelöst zu                         |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"` oder abgeleiteter Modus ohne maßgebliche Passwortquelle                                                   | `gateway.auth.token`                        |
| `gateway.auth.mode="password"` oder abgeleiteter Modus ohne maßgebliches Token aus Authentifizierung/Umgebung                            | `gateway.auth.password`                        |
| Sowohl `gateway.auth.token` als auch `gateway.auth.password` sind konfiguriert (einschließlich SecretRefs) und `gateway.auth.mode` ist nicht festgelegt | schlägt fehl; legen Sie `gateway.auth.mode` ausdrücklich fest |

## Authentifizierungsauflösung (`--remote`)

Wenn tatsächlich aktive Remote-Anmeldedaten als SecretRefs konfiguriert sind und weder `--token` noch `--password` angegeben wird, löst der Befehl sie anhand des aktiven Gateway-Snapshots auf. Wenn das Gateway nicht verfügbar ist, schlägt der Befehl sofort fehl.

<Note>
Dieser Befehlspfad erfordert ein Gateway, das die RPC-Methode `secrets.resolve` unterstützt. Ältere Gateways geben einen Fehler wegen einer unbekannten Methode zurück.
</Note>

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Geräte](/de/cli/devices)
- [Kopplung](/de/cli/pairing)
