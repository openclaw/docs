---
read_when:
    - Sie verwalten gekoppelte Nodes (Kameras, Bildschirm, Canvas)
    - Sie müssen Anfragen genehmigen oder Node-Befehle aufrufen
summary: CLI-Referenz für `openclaw nodes` (Status, Kopplung, Aufruf, Kamera/Canvas/Bildschirm)
title: Nodes
x-i18n:
    generated_at: "2026-04-25T13:44:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a5701ce0dcba399d93f6eed864b0b0ae34320501de0176aeaad1712d392834
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Gekoppelte Nodes (Geräte) verwalten und Node-Fähigkeiten aufrufen.

Verwandt:

- Nodes-Übersicht: [Nodes](/de/nodes)
- Kamera: [Kamera-Nodes](/de/nodes/camera)
- Bilder: [Bild-Nodes](/de/nodes/images)

Häufige Optionen:

- `--url`, `--token`, `--timeout`, `--json`

## Häufige Befehle

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` gibt Tabellen für ausstehende/gekoppelte Einträge aus. Gekoppelte Zeilen enthalten das Alter der letzten Verbindung (Last Connect).
Verwenden Sie `--connected`, um nur aktuell verbundene Nodes anzuzeigen. Verwenden Sie `--last-connected <duration>`, um
auf Nodes zu filtern, die sich innerhalb einer Dauer verbunden haben (z. B. `24h`, `7d`).

Hinweis zur Genehmigung:

- `openclaw nodes pending` benötigt nur den Pairing-Scope.
- `gateway.nodes.pairing.autoApproveCidrs` kann den ausstehenden Schritt nur für
  explizit vertrauenswürdige erstmalige Gerätekopplung mit `role: node` überspringen. Es ist standardmäßig
  deaktiviert und genehmigt keine Upgrades.
- `openclaw nodes approve <requestId>` übernimmt zusätzliche Scope-Anforderungen aus der
  ausstehenden Anfrage:
  - Anfrage ohne Befehl: nur Pairing
  - Nicht-Exec-Node-Befehle: Pairing + Schreiben
  - `system.run` / `system.run.prepare` / `system.which`: Pairing + Admin

## Aufrufen

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flags für den Aufruf:

- `--params <json>`: JSON-Objekt-String (Standard `{}`).
- `--invoke-timeout <ms>`: Timeout für den Node-Aufruf (Standard `15000`).
- `--idempotency-key <key>`: optionaler Idempotenzschlüssel.
- `system.run` und `system.run.prepare` sind hier blockiert; verwenden Sie das `exec`-Tool mit `host=node` für Shell-Ausführung.

Für Shell-Ausführung auf einer Node verwenden Sie das `exec`-Tool mit `host=node` anstelle von `openclaw nodes run`.
Die `nodes`-CLI ist jetzt auf Fähigkeiten fokussiert: direktes RPC über `nodes invoke` sowie Pairing, Kamera,
Bildschirm, Standort, Canvas und Benachrichtigungen.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)
