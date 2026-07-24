---
read_when:
    - Node ist verbunden, aber Kamera-/Canvas-/Bildschirm-/Exec-Tools schlagen fehl
    - Sie müssen das mentale Modell für Node-Kopplung im Vergleich zu Genehmigungen verstehen
summary: Fehlerbehebung bei Node-Kopplung, Anforderungen an den Vordergrund, Berechtigungen und Tool-Fehlern
title: Node-Fehlerbehebung
x-i18n:
    generated_at: "2026-07-24T03:58:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a7ee9e48985805e91cd5acfa1b9f6b676b7e67236ce29fe91e2c8d03002e5c4
    source_path: nodes/troubleshooting.md
    workflow: 16
---

Verwenden Sie diese Seite, wenn ein Node im Status sichtbar ist, die Node-Tools jedoch fehlschlagen.

## Befehlsabfolge

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Führen Sie anschließend Node-spezifische Prüfungen aus:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Anzeichen für einen fehlerfreien Zustand:

- Der Node ist verbunden und für die Rolle `node` gekoppelt.
- `nodes describe` enthält die aufgerufene Funktion.
- Die Ausführungsgenehmigungen zeigen den erwarteten Modus/die erwartete Zulassungsliste.

## Anforderungen an den Vordergrund

`canvas.*`, `camera.*` und `screen.*` funktionieren auf iOS-/Android-Nodes nur im Vordergrund.

Schnelle Prüfung und Behebung:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Wenn `NODE_BACKGROUND_UNAVAILABLE` angezeigt wird, bringen Sie die Node-App in den Vordergrund und versuchen Sie es erneut.

## Berechtigungsmatrix

| Funktion                     | iOS                                               | Android                                             | macOS-Node-App                         | Typischer Fehlercode                         |
| ---------------------------- | ------------------------------------------------- | --------------------------------------------------- | -------------------------------------- | -------------------------------------------- |
| `camera.snap`, `camera.clip` | Kamera (+ Mikrofon für Clip-Audio)                 | Kamera (+ Mikrofon für Clip-Audio)                   | Kamera (+ Mikrofon für Clip-Audio)     | `*_PERMISSION_REQUIRED`                           |
| `screen.record`           | Bildschirmaufnahme (+ Mikrofon optional)           | Abfrage zur Bildschirmaufnahme (+ Mikrofon optional) | Bildschirmaufnahme                     | `*_PERMISSION_REQUIRED`                           |
| `computer.act`           | Nicht verfügbar                                   | Nicht verfügbar                                     | Bedienungshilfen + Bildschirmaufnahme  | `COMPUTER_DISABLED`, `ACCESSIBILITY_REQUIRED`       |
| `location.get`           | Beim Verwenden oder Immer (abhängig vom Modus)     | Standort im Vorder-/Hintergrund abhängig vom Modus  | Standortberechtigung                   | `LOCATION_PERMISSION_REQUIRED`                           |
| `system.run`           | Nicht verfügbar (Node-Host-Pfad)                   | Nicht verfügbar (Node-Host-Pfad)                     | Ausführungsgenehmigungen erforderlich  | `SYSTEM_RUN_DENIED`                           |

## Kopplung im Vergleich zu Genehmigungen

Drei separate Prüfstellen bestimmen, ob ein Node-Befehl erfolgreich ausgeführt wird:

1. **Gerätekopplung**: Kann dieser Node eine Verbindung zum Gateway herstellen?
2. **Gateway-Richtlinie für Node-Befehle**: Ist die RPC-Befehls-ID durch `gateway.nodes.commands.allow` / `gateway.nodes.commands.deny` und die Plattformstandardwerte zulässig?
3. **Ausführungsgenehmigungen**: Darf dieser Node einen bestimmten Shell-Befehl lokal ausführen?

Die Node-Kopplung ist eine Identitäts-/Vertrauensprüfung und keine Genehmigungsoberfläche für einzelne Befehle. Für `system.run` befindet sich die Node-spezifische Richtlinie in der Datei mit den Ausführungsgenehmigungen dieses Nodes (`openclaw approvals get --node ...`) und nicht im Kopplungsdatensatz des Gateways.

Schnelle Prüfungen:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- Kopplung fehlt: Genehmigen Sie zuerst das Node-Gerät.
- In `nodes describe` fehlt ein Befehl: Prüfen Sie die Gateway-Richtlinie für Node-Befehle und ob der Node diesen Befehl beim Verbindungsaufbau tatsächlich deklariert hat.
- Die Kopplung funktioniert, aber `system.run` schlägt fehl: Korrigieren Sie die Ausführungsgenehmigungen/Zulassungsliste auf diesem Node.

Bei durch Genehmigungen abgesicherten Ausführungen von `host=node` bindet das Gateway die Ausführung außerdem an den vorbereiteten kanonischen Wert `systemRunPlan`. Wenn ein späterer Aufrufer den Befehl, das Arbeitsverzeichnis oder die Sitzungsmetadaten verändert, bevor die genehmigte Ausführung weitergeleitet wird, weist das Gateway die Ausführung wegen einer Abweichung von der Genehmigung zurück, statt den bearbeiteten Nutzdaten zu vertrauen.

## Häufige Node-Fehlercodes

| Code                                   | Bedeutung                                                                                                                                                                                                                           |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_BACKGROUND_UNAVAILABLE`                     | Die App befindet sich im Hintergrund. Bringen Sie sie in den Vordergrund.                                                                                                                                                            |
| `CAMERA_DISABLED`                     | Der Kameraschalter ist in den Node-Einstellungen deaktiviert.                                                                                                                                                                       |
| `*_PERMISSION_REQUIRED`                     | Die Betriebssystemberechtigung fehlt oder wurde verweigert.                                                                                                                                                                         |
| `LOCATION_DISABLED`                     | Der Standortmodus ist deaktiviert.                                                                                                                                                                                                  |
| `LOCATION_PERMISSION_REQUIRED`                     | Der angeforderte Standortmodus wurde nicht genehmigt.                                                                                                                                                                               |
| `LOCATION_BACKGROUND_UNAVAILABLE`                     | Die App befindet sich im Hintergrund, aber es liegt nur die Berechtigung „Beim Verwenden“ vor.                                                                                                                                       |
| `COMPUTER_DISABLED`                     | Aktivieren Sie **Allow Computer Control** in der macOS-App und genehmigen Sie anschließend die Aktualisierung der Kopplung.                                                                                                         |
| `ACCESSIBILITY_REQUIRED`                     | Gewähren Sie dem aktuellen OpenClaw-App-Bundle in den macOS-Systemeinstellungen Zugriff auf die Bedienungshilfen.                                                                                                                   |
| `SYSTEM_RUN_DENIED: approval required`                     | Die Ausführungsanforderung benötigt eine ausdrückliche Genehmigung.                                                                                                                                                                  |
| `SYSTEM_RUN_DENIED: allowlist miss`                     | Der Befehl wird durch den Zulassungslistenmodus blockiert. Auf Windows-Node-Hosts gelten Shell-Wrapper-Formen wie `cmd.exe /c ...` im Zulassungslistenmodus als nicht in der Zulassungsliste enthalten, sofern sie nicht über den Abfrageablauf genehmigt wurden. |

## Schnelle Wiederherstellungsschleife

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Falls das Problem weiterhin besteht:

- Genehmigen Sie die Gerätekopplung erneut.
- Öffnen Sie die Node-App erneut im Vordergrund.
- Erteilen Sie die Betriebssystemberechtigungen erneut.
- Erstellen Sie die Richtlinie für Ausführungsgenehmigungen neu oder passen Sie sie an.

Prüfen Sie für die Computersteuerung außerdem, ob ein visionsfähiger Agent das Tool `computer` bereitstellt, `screen.snapshot` mit der Berechtigung zur Bildschirmaufnahme erfolgreich ausgeführt wird und `/phone status` die beabsichtigte temporäre oder dauerhafte Gateway-Autorisierung anzeigt. Ein Eintrag vom Typ `gateway.nodes.commands.deny` überschreibt stets `gateway.nodes.commands.allow`.

## Verwandte Themen

- [Node-Übersicht](/de/nodes)
- [Kamera-Nodes](/de/nodes/camera)
- [Standortbefehl](/de/nodes/location-command)
- [Computersteuerung](/de/nodes/computer-use)
- [Ausführungsgenehmigungen](/de/tools/exec-approvals)
- [Gateway-Kopplung](/de/gateway/pairing)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
- [Kanal-Fehlerbehebung](/de/channels/troubleshooting)
