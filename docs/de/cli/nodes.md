---
read_when:
    - Sie verwalten gekoppelte Nodes (Kameras, Bildschirm, Canvas)
    - Sie müssen Anfragen genehmigen oder Node-Befehle ausführen
summary: CLI-Referenz für `openclaw nodes` (status, pairing, invoke, camera/canvas/screen)
title: Nodes
x-i18n:
    generated_at: "2026-05-07T13:14:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 681c199462d5f58c3e4346713263a78e7513335f087c713877e3050e21c8e15f
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Verwalten Sie gekoppelte Nodes (Geräte) und rufen Sie Node-Funktionen auf.

Verwandt:

- Nodes-Übersicht: [Nodes](/de/nodes)
- Kamera: [Kamera-Nodes](/de/nodes/camera)
- Bilder: [Bild-Nodes](/de/nodes/images)

Allgemeine Optionen:

- `--url`, `--token`, `--timeout`, `--json`

## Häufige Befehle

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

`nodes list` gibt Tabellen mit ausstehenden/gekoppelten Einträgen aus. Gekoppelte Zeilen enthalten das Alter der letzten Verbindung (`Last Connect`).
Verwenden Sie `--connected`, um nur aktuell verbundene Nodes anzuzeigen. Verwenden Sie `--last-connected <duration>`, um
auf Nodes zu filtern, die sich innerhalb einer Dauer verbunden haben (z. B. `24h`, `7d`).
Verwenden Sie `nodes remove --node <id|name|ip>`, um einen veralteten, Gateway-eigenen Node-Kopplungsdatensatz zu löschen.

Hinweis zur Genehmigung:

- `openclaw nodes pending` benötigt nur den Pairing-Scope.
- `gateway.nodes.pairing.autoApproveCidrs` kann den ausstehenden Schritt nur für
  ausdrücklich vertrauenswürdige, erstmalige Gerätekopplungen mit `role: node` überspringen. Es ist standardmäßig deaktiviert
  und genehmigt keine Upgrades.
- `openclaw nodes approve <requestId>` übernimmt zusätzliche Scope-Anforderungen aus der
  ausstehenden Anfrage:
  - Anfrage ohne Befehl: nur Pairing
  - Node-Befehle ohne Ausführung: Pairing + Schreibzugriff
  - `system.run` / `system.run.prepare` / `system.which`: Pairing + Admin

## Aufrufen

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Aufruf-Flags:

- `--params <json>`: JSON-Objektzeichenfolge (Standard `{}`).
- `--invoke-timeout <ms>`: Timeout für Node-Aufrufe (Standard `15000`).
- `--idempotency-key <key>`: optionaler Idempotenzschlüssel.
- `system.run` und `system.run.prepare` werden hier blockiert; verwenden Sie das `exec`-Tool mit `host=node` für Shell-Ausführung.

Für Shell-Ausführung auf einer Node verwenden Sie das `exec`-Tool mit `host=node` statt `openclaw nodes run`.
Die `nodes`-CLI ist jetzt auf Funktionen ausgerichtet: direkte RPC über `nodes invoke` sowie Pairing, Kamera,
Bildschirm, Standort, Canvas und Benachrichtigungen. Canvas-Befehle werden durch das gebündelte experimentelle Canvas-Plugin implementiert; der Core behält einen Kompatibilitäts-Hook bei, damit sie weiterhin unter `openclaw nodes canvas` verfügbar bleiben.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)
