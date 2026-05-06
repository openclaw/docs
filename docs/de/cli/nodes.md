---
read_when:
    - Sie verwalten gekoppelte Nodes (Kameras, Bildschirm, Canvas)
    - Sie müssen Anfragen genehmigen oder Node-Befehle ausführen
summary: CLI-Referenz für `openclaw nodes` (status, pairing, invoke, camera/canvas/screen)
title: Nodes
x-i18n:
    generated_at: "2026-05-06T17:54:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3eb0d23037c939e4022115a2d65e0e9cb25a872daed715b8652979ce6707cf7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Gekoppelte Nodes (Geräte) verwalten und Node-Funktionen aufrufen.

Verwandt:

- Nodes-Übersicht: [Nodes](/de/nodes)
- Kamera: [Kamera-Nodes](/de/nodes/camera)
- Bilder: [Bild-Nodes](/de/nodes/images)

Allgemeine Optionen:

- `--url`, `--token`, `--timeout`, `--json`

## Allgemeine Befehle

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` gibt Tabellen für ausstehende/gekoppelte Nodes aus. Zeilen für gekoppelte Nodes enthalten das Alter der letzten Verbindung (Letzte Verbindung).
Verwenden Sie `--connected`, um nur derzeit verbundene Nodes anzuzeigen. Verwenden Sie `--last-connected <duration>`, um
auf Nodes zu filtern, die sich innerhalb einer Dauer verbunden haben (z. B. `24h`, `7d`).
Verwenden Sie `nodes remove --node <id|name|ip>`, um einen veralteten, Gateway-eigenen Node-Kopplungsdatensatz zu löschen.

Hinweis zur Genehmigung:

- `openclaw nodes pending` benötigt nur den Kopplungs-Scope.
- `gateway.nodes.pairing.autoApproveCidrs` kann den ausstehenden Schritt nur für
  ausdrücklich vertrauenswürdige, erstmalige Gerätekopplungen mit `role: node` überspringen. Die Option ist standardmäßig deaktiviert
  und genehmigt keine Upgrades.
- `openclaw nodes approve <requestId>` übernimmt zusätzliche Scope-Anforderungen aus der
  ausstehenden Anfrage:
  - Anfrage ohne Befehl: nur Kopplung
  - Nicht-Exec-Node-Befehle: Kopplung + Schreiben
  - `system.run` / `system.run.prepare` / `system.which`: Kopplung + Admin

## Aufrufen

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flags für den Aufruf:

- `--params <json>`: JSON-Objektzeichenfolge (Standard `{}`).
- `--invoke-timeout <ms>`: Timeout für den Node-Aufruf (Standard `15000`).
- `--idempotency-key <key>`: optionaler Idempotenzschlüssel.
- `system.run` und `system.run.prepare` sind hier blockiert; verwenden Sie das `exec`-Tool mit `host=node` für die Shell-Ausführung.

Für die Shell-Ausführung auf einem Node verwenden Sie das `exec`-Tool mit `host=node` anstelle von `openclaw nodes run`.
Die `nodes`-CLI ist jetzt funktionsorientiert: direkter RPC über `nodes invoke` sowie Kopplung, Kamera,
Bildschirm, Standort, Canvas und Benachrichtigungen.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)
