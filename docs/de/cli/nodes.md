---
read_when:
    - Sie verwalten gekoppelte Nodes (Kameras, Bildschirm, Canvas)
    - Sie müssen Anfragen genehmigen oder Node-Befehle aufrufen
summary: CLI-Referenz für `openclaw nodes` (Status, Kopplung, Aufruf, Kamera/Canvas/Bildschirm/Standort/Benachrichtigung)
title: Nodes
x-i18n:
    generated_at: "2026-07-12T15:10:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f6b80ca2d82e834280943bcde32f6dfab51ce5566e2174f2d0aa1cd58ca39d6a
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Verwalten Sie gekoppelte Nodes (Geräte) und rufen Sie Node-Funktionen auf.

Verwandte Themen: [Node-Übersicht](/de/nodes) - [Aktive Computerpräsenz](/nodes/presence) - [Kamera-Nodes](/de/nodes/camera) - [Bild-Nodes](/de/nodes/images)

Allgemeine Optionen für jeden Unterbefehl: `--url <url>`, `--token <token>`, `--timeout <ms>` (Standardwert `10000`), `--json`.

## Status

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status` und `list` akzeptieren beide `--connected` (nur verbundene Nodes) und `--last-connected <duration>` (z. B. `24h`, `7d`; nur Nodes, die innerhalb des Zeitraums verbunden waren). `list` zeigt ausstehende und gekoppelte Nodes in separaten Tabellen, wobei die Zeilen gekoppelter Nodes das Alter der letzten Verbindung (Last Connect) enthalten; `status` zeigt eine zusammengeführte Tabelle mit Funktionen, Version und Details zur letzten Eingabe je Node. Eine verbundene macOS-Node meldet die letzte Eingabe nur, solange die Berechtigung für Bedienungshilfen erteilt ist; die aktuellste Zeile wird mit `active` gekennzeichnet. Weitere Informationen finden Sie unter [Aktive Computerpräsenz](/nodes/presence). `describe` gibt die Funktionen, Berechtigungen, Aktivität sowie die wirksamen und ausstehenden Aufrufbefehle einer Node aus.

## Kopplung

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

Diese Befehle steuern den Gateway-eigenen Speicher `node.pair.*`, der von der Gerätekopplung (`openclaw devices approve`) getrennt ist, die den WS-`connect`-Handshake der Node freigibt. Unter [Nodes](/de/nodes) erfahren Sie, wie beide zusammenhängen.

- `remove` widerruft den Eintrag für die gekoppelte Rolle der Node. Bei einer gerätegestützten Node widerruft dies die Rolle `node` im Speicher für Gerätekopplungen und trennt deren Sitzungen mit Node-Rolle: Ein Gerät mit mehreren Rollen behält seine Zeile und verliert nur die Rolle `node`; die Zeile eines Geräts, das ausschließlich eine Node ist, wird gelöscht. Außerdem werden alle übereinstimmenden Legacy-Datensätze für Gateway-eigene Node-Kopplungen gelöscht.
- `pending` benötigt nur den Geltungsbereich `operator.pairing`.
- `gateway.nodes.pairing.autoApproveCidrs` kann den ausstehenden Schritt bei der erstmaligen Gerätekopplung mit `role: node` für ausdrücklich vertrauenswürdige Geräte überspringen. Standardmäßig deaktiviert; genehmigt keine Rollenerweiterungen.
- `gateway.nodes.pairing.sshVerify` (standardmäßig aktiviert) genehmigt die erstmalige Gerätekopplung mit `role: node` automatisch, wenn das Gateway den Geräteschlüssel per SSH zum Node-Host verifizieren kann; die erste Funktionsoberfläche wird im selben Schritt genehmigt. Weitere Informationen finden Sie unter [Node-Kopplung](/de/gateway/pairing#ssh-verified-device-auto-approval-default).
- Die Anforderungen an den Geltungsbereich für `approve` richten sich nach den in der ausstehenden Anfrage deklarierten Befehlen:
  - Anfrage ohne Befehl: `operator.pairing`
  - Node-Befehle ohne Ausführung: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`
- Geltungsbereich für `remove`: Mit `operator.pairing` können Node-Zeilen entfernt werden, die nicht zu Operatoren gehören; ein Aufrufer mit Geräte-Token, der seine eigene Node-Rolle auf einem Gerät mit mehreren Rollen widerruft, benötigt zusätzlich `operator.admin`.

## Aufruf

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

Flags:

- `--command <command>` (erforderlich): z. B. `canvas.eval`.
- `--params <json>`: Zeichenfolge eines JSON-Objekts (Standardwert `{}`).
- `--invoke-timeout <ms>`: Zeitüberschreitung für den Node-Aufruf (Standardwert `15000`).
- `--idempotency-key <key>`: optionaler Idempotenzschlüssel.

`system.run` und `system.run.prepare` sind hier gesperrt; verwenden Sie stattdessen das Tool `exec` mit `host=node` für die Shell-Ausführung. `system.which` ist über `invoke` zulässig.

## Benachrichtigungen, Push-Nachrichten, Standort und Bildschirm

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` sendet eine lokale Benachrichtigung auf einer Node, die `system.notify` deklariert, einschließlich macOS-, iOS- und Android-Nodes sowie direkter watchOS-Nodes. Für die direkte Zustellung an watchOS muss OpenClaw aktiv sein. Erfordert `--title` oder `--body`. Optionen: `--sound <name>`, `--priority <passive|active|timeSensitive>`, `--delivery <system|overlay|auto>` (Standardwert `system`), `--invoke-timeout <ms>` (Standardwert `15000`).
- `push` sendet eine APNs-Test-Push-Nachricht an eine iOS-Node. Optionen: `--title <text>` (Standardwert `OpenClaw`), `--body <text>`, `--environment <sandbox|production>`, um die erkannte APNs-Umgebung zu überschreiben.
- `location get` ruft den aktuellen Standort der Node ab. Optionen: `--max-age <ms>` (zwischengespeicherte Positionsbestimmung wiederverwenden), `--accuracy <coarse|balanced|precise>`, `--location-timeout <ms>` (Standardwert `10000`), `--invoke-timeout <ms>` (Standardwert `20000`).
- `screen record` zeichnet einen kurzen Clip auf und gibt den Speicherpfad aus (oder schreibt mit `--json` JSON). Optionen: `--screen <index>` (Standardwert `0`), `--duration <ms|10s>` (Standardwert `10000`), `--fps <fps>` (Standardwert `10`), `--no-audio`, `--out <path>`, `--invoke-timeout <ms>` (Standardwert `120000`).

Für Kamera- und Canvas-Befehle gibt es eigene Dokumentationen: [Kamera-Nodes](/de/nodes/camera), [Canvas](/de/platforms/mac/canvas). Canvas wird durch das gebündelte experimentelle Canvas-Plugin implementiert; der Kern behält `openclaw nodes canvas` als Kompatibilitäts-Einhängepunkt bei.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)
