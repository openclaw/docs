---
read_when:
    - Sie verwalten gekoppelte Nodes (Kameras, Bildschirm, Canvas)
    - Sie müssen Anfragen genehmigen oder Node-Befehle aufrufen.
summary: CLI-Referenz für `openclaw nodes` (Status, Kopplung, Aufruf, Kamera/Canvas/Bildschirm/Standort/Benachrichtigung)
title: Nodes
x-i18n:
    generated_at: "2026-07-16T12:37:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5b57235006d803fe09f626a65157dfb1f620d3d3c6f337e33132bcffdf4f1e37
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Verwalten Sie gekoppelte Nodes (Geräte) und rufen Sie Node-Funktionen auf.

Verwandte Themen: [Nodes – Übersicht](/de/nodes) - [Aktive Computerpräsenz](/de/nodes/presence) - [Kamera-Nodes](/de/nodes/camera) - [Bild-Nodes](/de/nodes/images)

Allgemeine Optionen für jeden Unterbefehl: `--url <url>`, `--token <token>`, `--timeout <ms>` (Standard: `10000`), `--json`.

## Status

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status` und `list` akzeptieren beide `--connected` (nur verbundene Nodes) und `--last-connected <duration>` (z. B. `24h`, `7d`; nur Nodes, die innerhalb dieses Zeitraums verbunden waren). `list` zeigt ausstehende und gekoppelte Nodes in getrennten Tabellen an, wobei die Zeilen gekoppelter Nodes das Alter der letzten Verbindung (Last Connect) enthalten; `status` zeigt eine zusammengeführte Tabelle mit Details zu Funktionen, Version und letzter Eingabe pro Node. Ein verbundener macOS-Node meldet die letzte Eingabe nur, wenn die Bedienungshilfen-Berechtigung erteilt ist, und die aktuellste Zeile wird mit `active` markiert; siehe [Aktive Computerpräsenz](/de/nodes/presence). `describe` gibt die Funktionen, Berechtigungen, Aktivität sowie die wirksamen und ausstehenden Aufrufbefehle eines Nodes aus.

## Kopplung

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

Diese Befehle steuern den Gateway-eigenen Speicher `node.pair.*`, der von der Gerätekopplung (`openclaw devices approve`) getrennt ist, die den WS-Handshake `connect` des Nodes absichert. Unter [Nodes](/de/nodes) wird erläutert, wie beide zusammenhängen.

- `remove` widerruft den Eintrag für die gekoppelte Rolle des Nodes. Bei einem gerätegestützten Node widerruft dies die Rolle `node` im Speicher für Gerätekopplungen und trennt dessen Sitzungen mit Node-Rolle: Ein Gerät mit mehreren Rollen behält seinen Eintrag und verliert nur die Rolle `node`, während der Eintrag eines reinen Node-Geräts gelöscht wird. Außerdem werden alle übereinstimmenden Legacy-Kopplungseinträge des Gateways für den Node entfernt.
- `pending` benötigt nur den Geltungsbereich `operator.pairing`.
- `gateway.nodes.pairing.autoApproveCidrs` kann bei einer ausdrücklich vertrauenswürdigen, erstmaligen Gerätekopplung über `role: node` den ausstehenden Schritt überspringen. Standardmäßig deaktiviert; Rollen-Upgrades werden nicht genehmigt.
- `gateway.nodes.pairing.sshVerify` (standardmäßig aktiviert) genehmigt eine erstmalige Gerätekopplung über `role: node` automatisch, wenn das Gateway den Geräteschlüssel per SSH zum Node-Host verifizieren kann; die erste Funktionsoberfläche wird im selben Schritt genehmigt. Siehe [Node-Kopplung](/de/gateway/pairing#ssh-verified-device-auto-approval-default).
- Die Anforderungen an den Geltungsbereich von `approve` richten sich nach den deklarierten Befehlen der ausstehenden Anfrage:
  - Anfrage ohne Befehle: `operator.pairing`
  - gewöhnliche Node-Befehle: `operator.pairing` + `operator.write`
  - administrativ sensible Befehle (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` und `system.execApprovals.get/set`): `operator.pairing` + `operator.admin`
- Geltungsbereich von `remove`: `operator.pairing` kann Node-Einträge entfernen, die nicht zu Operatoren gehören; ein Aufrufer mit Geräte-Token, der seine eigene Node-Rolle auf einem Gerät mit mehreren Rollen widerruft, benötigt zusätzlich `operator.admin`.

## Aufrufen

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

Optionen:

- `--command <command>` (erforderlich): z. B. `canvas.eval`.
- `--params <json>`: Zeichenfolge mit einem JSON-Objekt (Standard: `{}`).
- `--invoke-timeout <ms>`: Zeitüberschreitung für den Node-Aufruf (Standard: `15000`).
- `--idempotency-key <key>`: optionaler Idempotenzschlüssel.

`system.run` und `system.run.prepare` sind hier gesperrt; verwenden Sie stattdessen das Tool `exec` mit `host=node` zur Shell-Ausführung. `system.which` ist über `invoke` zulässig.

## Benachrichtigung, Push, Standort, Bildschirm

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` sendet eine lokale Benachrichtigung an einen Node, der `system.notify` deklariert, einschließlich macOS-, iOS-, Android- und direkter watchOS-Nodes. Für die direkte Zustellung an watchOS muss OpenClaw aktiv sein. Erfordert `--title` oder `--body`. Optionen: `--sound <name>`, `--priority <passive|active|timeSensitive>`, `--delivery <system|overlay|auto>` (Standard: `system`), `--invoke-timeout <ms>` (Standard: `15000`).
- `push` sendet einen APNs-Test-Push an einen iOS-Node. Optionen: `--title <text>` (Standard: `OpenClaw`), `--body <text>`, `--environment <sandbox|production>`, um die erkannte APNs-Umgebung zu überschreiben.
- `location get` ruft den aktuellen Standort des Nodes ab. Optionen: `--max-age <ms>` (eine zwischengespeicherte Positionsbestimmung wiederverwenden), `--accuracy <coarse|balanced|precise>`, `--location-timeout <ms>` (Standard: `10000`), `--invoke-timeout <ms>` (Standard: `20000`).
- `screen record` zeichnet einen kurzen Clip auf und gibt den Speicherpfad aus (oder schreibt mit `--json` JSON). Optionen: `--screen <index>` (Standard: `0`), `--duration <ms|10s>` (Standard: `10000`), `--fps <fps>` (Standard: `10`), `--no-audio`, `--out <path>`, `--invoke-timeout <ms>` (Standard: `120000`).

Für Kamera- und Canvas-Befehle gibt es eigene Dokumentationen: [Kamera-Nodes](/de/nodes/camera), [Canvas](/de/platforms/mac/canvas). Canvas wird durch das gebündelte experimentelle Canvas-Plugin implementiert; der Kern behält `openclaw nodes canvas` als Kompatibilitäts-Einhängepunkt bei.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)
