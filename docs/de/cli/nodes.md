---
read_when:
    - Sie verwalten gekoppelte Nodes (Kameras, Bildschirm, Canvas)
    - Sie müssen Anfragen genehmigen oder Node-Befehle ausführen
summary: CLI-Referenz für `openclaw nodes` (Status, Kopplung, Aufruf, Kamera/Canvas/Bildschirm)
title: Nodes
x-i18n:
    generated_at: "2026-04-30T06:46:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3229db91d7e64b0d37bee29bd51895d90796f5fd33b67e3d900fd8bda2b6e7e9
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Gekoppelte Nodes (Geräte) verwalten und Node-Funktionen aufrufen.

Zugehörig:

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

`nodes list` gibt Tabellen für ausstehende/gekoppelte Nodes aus. Gekoppelte Zeilen enthalten das Alter der letzten Verbindung (Last Connect).
Verwenden Sie `--connected`, um nur aktuell verbundene Nodes anzuzeigen. Verwenden Sie `--last-connected <duration>`, um
auf Nodes zu filtern, die sich innerhalb einer Dauer verbunden haben (z. B. `24h`, `7d`).
Verwenden Sie `nodes remove --node <id|name|ip>`, um einen veralteten, vom Gateway verwalteten Node-Kopplungseintrag zu löschen.

Hinweis zur Genehmigung:

- `openclaw nodes pending` benötigt nur den Kopplungs-Scope.
- `gateway.nodes.pairing.autoApproveCidrs` kann den ausstehenden Schritt nur für
  explizit vertrauenswürdige erstmalige Gerätekopplungen mit `role: node` überspringen. Es ist standardmäßig deaktiviert
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

Aufruf-Flags:

- `--params <json>`: JSON-Objektzeichenfolge (Standard `{}`).
- `--invoke-timeout <ms>`: Node-Aufruf-Timeout (Standard `15000`).
- `--idempotency-key <key>`: optionaler Idempotency-Key.
- `system.run` und `system.run.prepare` sind hier blockiert; verwenden Sie das Tool `exec` mit `host=node` für Shell-Ausführung.

Für Shell-Ausführung auf einem Node verwenden Sie das Tool `exec` mit `host=node` anstelle von `openclaw nodes run`.
Die `nodes`-CLI ist jetzt auf Funktionen ausgerichtet: direkter RPC über `nodes invoke`, plus Kopplung, Kamera,
Bildschirm, Standort, Canvas und Benachrichtigungen.

## Zugehörig

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)
