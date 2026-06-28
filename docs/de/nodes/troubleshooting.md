---
read_when:
    - Node ist verbunden, aber Kamera-/Canvas-/Bildschirm-/Exec-Tools schlagen fehl
    - Sie benötigen das Denkmodell „Node-Pairing gegenüber Genehmigungen“
summary: Fehlerbehebung bei Node-Kopplung, Anforderungen für den Vordergrund, Berechtigungen und Tool-Fehlern
title: Node-Problembehandlung
x-i18n:
    generated_at: "2026-05-10T19:41:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: d53f06367b63125f04b4b542c322e6e50e1f33153e0fbdd09e7a38772c69a438
    source_path: nodes/troubleshooting.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Verwenden Sie diese Seite, wenn ein Node im Status sichtbar ist, Node-Tools aber fehlschlagen.

## Befehlsleiter

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Führen Sie dann für den Node spezifische Prüfungen aus:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Gesunde Signale:

- Node ist verbunden und für die Rolle `node` gekoppelt.
- `nodes describe` enthält die Fähigkeit, die Sie aufrufen.
- Exec-Genehmigungen zeigen den erwarteten Modus/die erwartete Allowlist.

## Anforderungen an den Vordergrund

`canvas.*`, `camera.*` und `screen.*` sind auf iOS-/Android-Nodes nur im Vordergrund verfügbar.

Schnellprüfung und Behebung:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Wenn Sie `NODE_BACKGROUND_UNAVAILABLE` sehen, bringen Sie die Node-App in den Vordergrund und versuchen Sie es erneut.

## Berechtigungsmatrix

| Fähigkeit                    | iOS                                             | Android                                                   | macOS-Node-App                     | Typischer Fehlercode            |
| ---------------------------- | ----------------------------------------------- | --------------------------------------------------------- | ---------------------------------- | ------------------------------- |
| `camera.snap`, `camera.clip` | Kamera (+ Mikrofon für Clip-Audio)              | Kamera (+ Mikrofon für Clip-Audio)                        | Kamera (+ Mikrofon für Clip-Audio) | `*_PERMISSION_REQUIRED`         |
| `screen.record`              | Bildschirmaufnahme (+ Mikrofon optional)        | Bildschirmaufnahme-Aufforderung (+ Mikrofon optional)     | Bildschirmaufnahme                 | `*_PERMISSION_REQUIRED`         |
| `location.get`               | Beim Verwenden oder Immer (abhängig vom Modus)  | Vordergrund-/Hintergrundstandort basierend auf dem Modus  | Standortberechtigung               | `LOCATION_PERMISSION_REQUIRED`  |
| `system.run`                 | n. z. (Node-Host-Pfad)                          | n. z. (Node-Host-Pfad)                                    | Exec-Genehmigungen erforderlich    | `SYSTEM_RUN_DENIED`             |

## Kopplung versus Genehmigungen

Dies sind unterschiedliche Sperren:

1. **Gerätekopplung**: Kann dieser Node eine Verbindung zum Gateway herstellen?
2. **Gateway-Richtlinie für Node-Befehle**: Ist die RPC-Befehls-ID durch `gateway.nodes.allowCommands` / `denyCommands` und Plattformstandards erlaubt?
3. **Exec-Genehmigungen**: Kann dieser Node lokal einen bestimmten Shell-Befehl ausführen?

Schnellprüfungen:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Wenn die Kopplung fehlt, genehmigen Sie zuerst das Node-Gerät.
Wenn in `nodes describe` ein Befehl fehlt, prüfen Sie die Gateway-Richtlinie für Node-Befehle und ob der Node diesen Befehl beim Verbinden tatsächlich deklariert hat.
Wenn die Kopplung in Ordnung ist, `system.run` aber fehlschlägt, korrigieren Sie die Exec-Genehmigungen/Allowlist auf diesem Node.

Node-Kopplung ist eine Identitäts-/Vertrauenssperre, keine Genehmigungsfläche pro Befehl. Für `system.run` befindet sich die Pro-Node-Richtlinie in der Exec-Genehmigungsdatei dieses Nodes (`openclaw approvals get --node ...`), nicht im Gateway-Kopplungsdatensatz.

Bei genehmigungsgestützten `host=node`-Ausführungen bindet das Gateway die Ausführung außerdem an den
vorbereiteten kanonischen `systemRunPlan`. Wenn ein späterer Aufrufer command/cwd oder
Sitzungsmetadaten verändert, bevor die genehmigte Ausführung weitergeleitet wird, lehnt das Gateway die
Ausführung als Genehmigungsabweichung ab, statt der bearbeiteten Nutzlast zu vertrauen.

## Häufige Node-Fehlercodes

- `NODE_BACKGROUND_UNAVAILABLE` → App läuft im Hintergrund; bringen Sie sie in den Vordergrund.
- `CAMERA_DISABLED` → Kameraschalter in den Node-Einstellungen deaktiviert.
- `*_PERMISSION_REQUIRED` → OS-Berechtigung fehlt/wurde verweigert.
- `LOCATION_DISABLED` → Standortmodus ist ausgeschaltet.
- `LOCATION_PERMISSION_REQUIRED` → angeforderter Standortmodus nicht gewährt.
- `LOCATION_BACKGROUND_UNAVAILABLE` → App läuft im Hintergrund, aber es existiert nur die Berechtigung Beim Verwenden.
- `SYSTEM_RUN_DENIED: approval required` → Exec-Anfrage benötigt ausdrückliche Genehmigung.
- `SYSTEM_RUN_DENIED: allowlist miss` → Befehl durch Allowlist-Modus blockiert.
  Auf Windows-Node-Hosts werden Shell-Wrapper-Formen wie `cmd.exe /c ...` im
  Allowlist-Modus als Allowlist-Fehltreffer behandelt, sofern sie nicht über den Anfrageablauf genehmigt wurden.

## Schnelle Wiederherstellungsschleife

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Wenn Sie weiterhin festhängen:

- Gerätekopplung erneut genehmigen.
- Node-App erneut öffnen (Vordergrund).
- OS-Berechtigungen erneut gewähren.
- Exec-Genehmigungsrichtlinie neu erstellen/anpassen.

## Verwandt

- [Nodes-Übersicht](/de/nodes)
- [Kamera-Nodes](/de/nodes/camera)
- [Standortbefehl](/de/nodes/location-command)
- [Exec-Genehmigungen](/de/tools/exec-approvals)
- [Gateway-Kopplung](/de/gateway/pairing)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
- [Channel-Fehlerbehebung](/de/channels/troubleshooting)
