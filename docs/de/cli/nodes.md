---
read_when:
    - Sie verwalten gekoppelte Nodes (Kameras, Bildschirm, Canvas)
    - Sie müssen Anfragen genehmigen oder Node-Befehle aufrufen
summary: CLI-Referenz für `openclaw nodes` (status, pairing, invoke, camera/canvas/screen)
title: Nodes
x-i18n:
    generated_at: "2026-06-27T17:19:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e752e4a5809e01ee7970204c84d9f1008f146d8a55954f6ed5de527a6a124bc7
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

`nodes list` gibt Tabellen mit ausstehenden/gekoppelten Einträgen aus. Gekoppelte Zeilen enthalten das Alter der letzten Verbindung (Last Connect).
Verwenden Sie `--connected`, um nur aktuell verbundene Nodes anzuzeigen. Verwenden Sie `--last-connected <duration>`, um
auf Nodes zu filtern, die sich innerhalb einer Dauer verbunden haben (z. B. `24h`, `7d`).
Verwenden Sie `nodes remove --node <id|name|ip>`, um eine Node-Kopplung zu entfernen. Bei einer
gerätegestützten Node widerruft dies die `node`-Rolle des Geräts in `devices/paired.json`
und trennt dessen Node-Rollen-Sitzungen (ein Gerät mit gemischten Rollen behält seine Zeile und
verliert nur die `node`-Rolle; ein reines Node-Gerät wird gelöscht); außerdem werden alle
passenden Legacy-Node-Kopplungsdatensätze im Besitz des Gateway gelöscht. `operator.pairing` kann
Nicht-Operator-Node-Zeilen entfernen; ein Device-Token-Aufrufer, der seine eigene Node-Rolle auf einem
Gerät mit gemischten Rollen widerruft, benötigt zusätzlich `operator.admin`.

Hinweis zur Genehmigung:

- `openclaw nodes pending` benötigt nur den Kopplungs-Scope.
- `gateway.nodes.pairing.autoApproveCidrs` kann den ausstehenden Schritt nur für
  ausdrücklich vertrauenswürdige, erstmalige `role: node`-Gerätekopplungen überspringen. Es ist
  standardmäßig deaktiviert und genehmigt keine Upgrades.
- `openclaw nodes approve <requestId>` übernimmt zusätzliche Scope-Anforderungen aus der
  ausstehenden Anfrage:
  - Anfrage ohne Befehl: nur Kopplung
  - Nicht-Exec-Node-Befehle: Kopplung + Schreibzugriff
  - `system.run` / `system.run.prepare` / `system.which`: Kopplung + Admin

## Aufrufen

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Aufruf-Flags:

- `--params <json>`: JSON-Objektzeichenfolge (Standard `{}`).
- `--invoke-timeout <ms>`: Timeout für Node-Aufrufe (Standard `15000`).
- `--idempotency-key <key>`: optionaler Idempotenzschlüssel.
- `system.run` und `system.run.prepare` sind hier blockiert; verwenden Sie für Shell-Ausführung das `exec`-Tool mit `host=node`.

Verwenden Sie für Shell-Ausführung auf einer Node das `exec`-Tool mit `host=node` anstelle von `openclaw nodes run`.
Die `nodes`-CLI ist jetzt funktionsorientiert: direkter RPC über `nodes invoke` sowie Kopplung, Kamera,
Bildschirm, Standort, Canvas und Benachrichtigungen. Canvas-Befehle werden vom gebündelten experimentellen Canvas-Plugin implementiert; Core behält einen Kompatibilitäts-Hook, damit sie weiterhin unter `openclaw nodes canvas` verfügbar bleiben.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)
