---
read_when:
    - Node ist verbunden, aber Kamera-/Canvas-/Bildschirm-/Exec-Tools schlagen fehl
    - Sie müssen das grundlegende Konzept des Node-Pairings im Vergleich zu Genehmigungen verstehen
summary: Fehlerbehebung bei Node-Kopplung, Vordergrundanforderungen, Berechtigungen und Tool-Fehlern
title: Node-Fehlerbehebung
x-i18n:
    generated_at: "2026-07-12T01:50:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53d082dcd2f4bb022eb683d72d193dbb6800b5a81a8f5ab9506d82feaa0dbc49
    source_path: nodes/troubleshooting.md
    workflow: 16
---

Verwenden Sie diese Seite, wenn eine Node im Status sichtbar ist, Node-Tools jedoch fehlschlagen.

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

- Die Node ist verbunden und für die Rolle `node` gekoppelt.
- `nodes describe` enthält die aufgerufene Funktion.
- Die Ausführungsgenehmigungen zeigen den erwarteten Modus und die erwartete Zulassungsliste.

## Anforderungen an den Vordergrund

`canvas.*`, `camera.*` und `screen.*` funktionieren auf iOS-/Android-Nodes nur im Vordergrund.

Schnellprüfung und Fehlerbehebung:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Wenn `NODE_BACKGROUND_UNAVAILABLE` angezeigt wird, bringen Sie die Node-App in den Vordergrund und versuchen Sie es erneut.

## Berechtigungsmatrix

| Funktion                     | iOS                                              | Android                                               | macOS-Node-App                              | Typischer Fehlercode                           |
| ---------------------------- | ------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------- | ---------------------------------------------- |
| `camera.snap`, `camera.clip` | Kamera (+ Mikrofon für Audio in Clips)           | Kamera (+ Mikrofon für Audio in Clips)                | Kamera (+ Mikrofon für Audio in Clips)      | `*_PERMISSION_REQUIRED`                        |
| `screen.record`              | Bildschirmaufnahme (+ optional Mikrofon)         | Aufforderung zur Bildschirmaufnahme (+ optional Mikrofon) | Bildschirmaufnahme                       | `*_PERMISSION_REQUIRED`                        |
| `computer.act`               | nicht verfügbar                                  | nicht verfügbar                                       | Bedienungshilfen + Bildschirmaufnahme       | `COMPUTER_DISABLED`, `ACCESSIBILITY_REQUIRED`  |
| `location.get`               | Beim Verwenden oder immer (je nach Modus)        | Standortzugriff im Vorder-/Hintergrund je nach Modus  | Standortberechtigung                        | `LOCATION_PERMISSION_REQUIRED`                 |
| `system.run`                 | nicht verfügbar (Pfad auf dem Node-Host)         | nicht verfügbar (Pfad auf dem Node-Host)              | Ausführungsgenehmigungen erforderlich       | `SYSTEM_RUN_DENIED`                            |

## Kopplung und Genehmigungen

Drei separate Kontrollstufen bestimmen, ob ein Node-Befehl erfolgreich ausgeführt wird:

1. **Gerätekopplung**: Kann diese Node eine Verbindung zum Gateway herstellen?
2. **Richtlinie für Node-Befehle des Gateways**: Ist die RPC-Befehls-ID gemäß `gateway.nodes.allowCommands` / `denyCommands` und den Plattformstandards zulässig?
3. **Ausführungsgenehmigungen**: Darf diese Node einen bestimmten Shell-Befehl lokal ausführen?

Die Node-Kopplung ist eine Identitäts-/Vertrauenskontrolle und keine Genehmigungsoberfläche für einzelne Befehle. Für `system.run` befindet sich die Node-spezifische Richtlinie in der Ausführungsgenehmigungsdatei dieser Node (`openclaw approvals get --node ...`) und nicht im Kopplungsdatensatz des Gateways.

Schnellprüfungen:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- Kopplung fehlt: Genehmigen Sie zuerst das Node-Gerät.
- In `nodes describe` fehlt ein Befehl: Prüfen Sie die Richtlinie für Node-Befehle des Gateways und ob die Node diesen Befehl beim Verbindungsaufbau tatsächlich deklariert hat.
- Die Kopplung funktioniert, aber `system.run` schlägt fehl: Korrigieren Sie die Ausführungsgenehmigungen/Zulassungsliste auf dieser Node.

Bei genehmigungsbasierten Ausführungen mit `host=node` bindet das Gateway die Ausführung außerdem an den vorbereiteten, kanonischen `systemRunPlan`. Wenn ein nachgelagerter Aufrufer den Befehl, das Arbeitsverzeichnis oder die Sitzungsmetadaten verändert, bevor die genehmigte Ausführung weitergeleitet wird, lehnt das Gateway die Ausführung wegen einer Abweichung von der Genehmigung ab, anstatt den bearbeiteten Nutzdaten zu vertrauen.

## Häufige Node-Fehlercodes

| Code                                   | Bedeutung                                                                                                                                                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_BACKGROUND_UNAVAILABLE`          | Die App befindet sich im Hintergrund; bringen Sie sie in den Vordergrund.                                                                                                                                |
| `CAMERA_DISABLED`                      | Der Kameraschalter ist in den Node-Einstellungen deaktiviert.                                                                                                                                            |
| `*_PERMISSION_REQUIRED`                | Die Betriebssystemberechtigung fehlt oder wurde verweigert.                                                                                                                                               |
| `LOCATION_DISABLED`                    | Der Standortmodus ist deaktiviert.                                                                                                                                                                        |
| `LOCATION_PERMISSION_REQUIRED`         | Der angeforderte Standortmodus wurde nicht gewährt.                                                                                                                                                       |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | Die App befindet sich im Hintergrund, aber es liegt nur die Berechtigung „Beim Verwenden“ vor.                                                                                                            |
| `COMPUTER_DISABLED`                    | Aktivieren Sie **Allow Computer Control** in der macOS-App und genehmigen Sie anschließend die Aktualisierung der Kopplung.                                                                               |
| `ACCESSIBILITY_REQUIRED`               | Gewähren Sie dem aktuellen OpenClaw-App-Bundle in den macOS-Systemeinstellungen Zugriff auf die Bedienungshilfen.                                                                                          |
| `SYSTEM_RUN_DENIED: approval required` | Die Ausführungsanforderung benötigt eine ausdrückliche Genehmigung.                                                                                                                                        |
| `SYSTEM_RUN_DENIED: allowlist miss`    | Der Befehl wird durch den Zulassungslistenmodus blockiert. Auf Windows-Node-Hosts gelten Shell-Wrapper-Formen wie `cmd.exe /c ...` im Zulassungslistenmodus als nicht in der Zulassungsliste enthalten, sofern sie nicht über den Rückfrageablauf genehmigt wurden. |

## Schnelle Wiederherstellungsschleife

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Wenn das Problem weiterhin besteht:

- Genehmigen Sie die Gerätekopplung erneut.
- Öffnen Sie die Node-App erneut im Vordergrund.
- Erteilen Sie die Betriebssystemberechtigungen erneut.
- Erstellen Sie die Richtlinie für Ausführungsgenehmigungen neu oder passen Sie sie an.

Prüfen Sie für die Computersteuerung außerdem, ob ein für visuelle Verarbeitung geeigneter Agent das Tool `computer` bereitstellt, `screen.snapshot` mit der Berechtigung zur Bildschirmaufnahme erfolgreich ausgeführt wird und `/phone status` die von Ihnen vorgesehene temporäre oder dauerhafte Gateway-Autorisierung anzeigt. Ein Eintrag in `gateway.nodes.denyCommands` hat immer Vorrang vor `allowCommands`.

## Verwandte Themen

- [Node-Übersicht](/de/nodes)
- [Kamera-Nodes](/de/nodes/camera)
- [Standortbefehl](/de/nodes/location-command)
- [Computernutzung](/de/nodes/computer-use)
- [Ausführungsgenehmigungen](/de/tools/exec-approvals)
- [Gateway-Kopplung](/de/gateway/pairing)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
- [Fehlerbehebung für Kanäle](/de/channels/troubleshooting)
