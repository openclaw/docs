---
read_when:
    - Sie verwalten gekoppelte Nodes (Kameras, Bildschirm, Canvas)
    - Sie müssen Anfragen genehmigen oder Node-Befehle aufrufen.
summary: CLI-Referenz für `openclaw nodes` (Status, Kopplung, Aufruf, Kamera/Canvas/Bildschirm/Standort/Benachrichtigung)
title: Nodes
x-i18n:
    generated_at: "2026-07-24T03:43:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 53003bcd3d30b0e754aa0717452700595c0cf69d9ecd6301b8a1bf320ea1838a
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Verwalten Sie gekoppelte Nodes (Geräte) und rufen Sie Node-Funktionen auf.

Verwandte Themen: [Node-Übersicht](/de/nodes) - [Aktive Computerpräsenz](/de/nodes/presence) - [Kamera-Nodes](/de/nodes/camera) - [Bild-Nodes](/de/nodes/images)

Allgemeine Optionen für jeden Unterbefehl: `--url <url>`, `--token <token>`, `--timeout <ms>` (Standardwert `10000`), `--json`.

## Status

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status` und `list` akzeptieren beide `--connected` (nur verbundene Nodes) und `--last-connected <duration>` (z. B. `24h`, `7d`; nur Nodes, die innerhalb der Zeitspanne verbunden waren). `list` zeigt ausstehende und gekoppelte Nodes in separaten Tabellen an, wobei die Zeilen gekoppelter Nodes das Alter der letzten Verbindung (Last Connect) enthalten; `status` zeigt eine zusammengeführte Tabelle mit Funktionen, Version und Details zur letzten Eingabe je Node an. Eine verbundene macOS-Node meldet die letzte Eingabe erst, nachdem der Benutzer **Aktive Computererkennung** aktiviert und Bedienungshilfen gewährt hat; die aktuellste Zeile ist mit `active` gekennzeichnet. Siehe [Aktive Computerpräsenz](/de/nodes/presence). `describe` gibt die Funktionen, Berechtigungen, Aktivität sowie die effektiven und ausstehenden Aufrufbefehle einer Node aus.

## Kopplung

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

Diese Befehle steuern den Gateway-eigenen Speicher `node.pair.*`, der von der Gerätekopplung (`openclaw devices approve`) getrennt ist, die den WS-Handshake `connect` der Node absichert. Unter [Nodes](/de/nodes) erfahren Sie, wie beide zusammenhängen.

- `remove` widerruft den Eintrag der gekoppelten Rolle der Node. Bei einer gerätegestützten Node wird dadurch die Rolle `node` im Gerätekopplungsspeicher widerrufen und die Sitzungen ihrer Node-Rolle werden getrennt: Ein Gerät mit mehreren Rollen behält seinen Eintrag und verliert nur die Rolle `node`, während der Eintrag eines Geräts, das ausschließlich eine Node ist, gelöscht wird. Außerdem werden alle übereinstimmenden veralteten Gateway-eigenen Node-Kopplungseinträge entfernt.
- `pending` benötigt nur den Geltungsbereich `operator.pairing`.
- `gateway.nodes.pairing.autoApproveCidrs` kann bei der erstmaligen Kopplung eines ausdrücklich vertrauenswürdigen Geräts vom Typ `role: node` den ausstehenden Schritt überspringen. Standardmäßig deaktiviert; genehmigt keine Rollenerweiterungen.
- `gateway.nodes.pairing.sshVerify` (standardmäßig aktiviert) genehmigt automatisch die erstmalige Kopplung eines Geräts vom Typ `role: node`, wenn der Gateway den Geräteschlüssel über SSH zum Node-Host verifizieren kann; die erste Funktionsoberfläche wird im selben Schritt genehmigt. Siehe [Node-Kopplung](/de/gateway/pairing#ssh-verified-device-auto-approval-default).
- Die Anforderungen an den Geltungsbereich von `approve` richten sich nach den deklarierten Befehlen der ausstehenden Anfrage:
  - Anfrage ohne Befehl: `operator.pairing`
  - gewöhnliche Node-Befehle: `operator.pairing` + `operator.write`
  - administrativ sensible Befehle (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` und `system.execApprovals.get/set`): `operator.pairing` + `operator.admin`
- Geltungsbereich von `remove`: `operator.pairing` kann Node-Einträge entfernen, die keinem Operator gehören; ein Aufrufer mit Geräte-Token, der seine eigene Node-Rolle auf einem Gerät mit mehreren Rollen widerruft, benötigt zusätzlich `operator.admin`.

## Aufrufen

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

Optionen:

- `--command <command>` (erforderlich): z. B. `canvas.eval`.
- `--params <json>`: Zeichenfolge mit einem JSON-Objekt (Standardwert `{}`).
- `--invoke-timeout <ms>`: Zeitüberschreitung für den Node-Aufruf (Standardwert `15000`).
- `--idempotency-key <key>`: optionaler Idempotenzschlüssel.

`system.run` und `system.run.prepare` sind hier gesperrt; verwenden Sie stattdessen das Werkzeug `exec` mit `host=node`, um Shell-Befehle auszuführen. `system.which` ist über `invoke` zulässig.

## Benachrichtigung, Push, Standort, Bildschirm

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` sendet eine lokale Benachrichtigung an eine Node, die `system.notify` deklariert, einschließlich macOS-, iOS-, Android- und direkter watchOS-Nodes. Für die direkte Zustellung an watchOS muss OpenClaw aktiv sein. Erfordert `--title` oder `--body`. Optionen: `--sound <name>`, `--priority <passive|active|timeSensitive>`, `--delivery <system|overlay|auto>` (Standardwert `system`), `--invoke-timeout <ms>` (Standardwert `15000`).
- `push` sendet einen APNs-Test-Push an eine iOS-Node. Optionen: `--title <text>` (Standardwert `OpenClaw`), `--body <text>`, `--environment <sandbox|production>`, um die erkannte APNs-Umgebung zu überschreiben.
- `location get` ruft den aktuellen Standort der Node ab. Optionen: `--max-age <ms>` (eine zwischengespeicherte Positionsbestimmung wiederverwenden), `--accuracy <coarse|balanced|precise>`, `--location-timeout <ms>` (Standardwert `10000`), `--invoke-timeout <ms>` (Standardwert `20000`).
- `screen record` nimmt einen kurzen Clip auf und gibt den Speicherpfad aus (oder schreibt mit `--json` JSON). Optionen: `--screen <index>` (Standardwert `0`), `--duration <ms|10s>` (Standardwert `10000`), `--fps <fps>` (Standardwert `10`), `--no-audio`, `--out <path>`, `--invoke-timeout <ms>` (Standardwert `120000`).

Für Kamera- und Canvas-Befehle gibt es eigene Dokumentationen: [Kamera-Nodes](/de/nodes/camera), [Canvas](/de/platforms/mac/canvas). Canvas wird durch das gebündelte experimentelle Canvas-Plugin implementiert; der Kern behält `openclaw nodes canvas` als Kompatibilitäts-Einhängepunkt bei.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)
