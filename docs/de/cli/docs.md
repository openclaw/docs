---
read_when:
    - Sie möchten die aktuelle OpenClaw-Dokumentation vom Terminal aus durchsuchen
    - Sie müssen wissen, welche Hilfs-Binärdateien die Dokumentations-CLI per Shell aufruft
summary: CLI-Referenz für `openclaw docs` (Live-Dokumentationsindex durchsuchen)
title: Dokumentation
x-i18n:
    generated_at: "2026-05-10T19:28:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0f733083bf455695ed24b13db6fe53e95aa3804fa8696a2fd29e749f24324c8
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Durchsuchen Sie den Live-Index der OpenClaw-Dokumentation vom Terminal aus. Der Befehl ruft den öffentlichen, von Mintlify gehosteten MCP-Suchendpunkt der Dokumentation unter `https://docs.openclaw.ai/mcp.SearchOpenClaw` auf und stellt die Ergebnisse in Ihrem Terminal dar.

## Verwendung

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

Argumente:

| Argument     | Beschreibung                                                                                         |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| `[query...]` | Freiform-Suchabfrage. Abfragen mit mehreren Wörtern werden mit Leerzeichen verbunden und als eine gesendet. |

## Beispiele

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Ohne Abfrage gibt `openclaw docs` die Einstiegs-URL der Dokumentation sowie einen Beispiel-Suchbefehl aus, anstatt eine Suche auszuführen.

## Funktionsweise

`openclaw docs` ruft die `mcporter`-CLI auf, um das MCP-Tool für die Dokumentationssuche auszuführen, und parst anschließend die Blöcke `Title: / Link: / Content:` aus der Tool-Ausgabe in eine Ergebnisliste.

Um `mcporter` aufzulösen, prüft OpenClaw der Reihe nach:

1. `mcporter` in `PATH` (wird direkt verwendet, wenn vorhanden).
2. `pnpm dlx mcporter ...`, wenn `pnpm` installiert ist.
3. `npx -y mcporter ...`, wenn `npx` installiert ist.

Wenn keines davon verfügbar ist, schlägt der Befehl mit einem Hinweis fehl, `pnpm` zu installieren (`npm install -g pnpm`).

Der Suchaufruf verwendet ein festes Timeout von 30 Sekunden. Ergebnisausschnitte werden auf etwa 220 Zeichen pro Eintrag gekürzt.

## Ausgabe

In einem Rich-Terminal (TTY) werden Ergebnisse als Überschrift gefolgt von einer Aufzählungsliste dargestellt. Jeder Aufzählungspunkt zeigt den Seitentitel, die verlinkte Dokumentations-URL und in der nächsten Zeile einen kurzen Ausschnitt. Leere Ergebnisse geben "Keine Ergebnisse." aus.

In nicht-formatierter Ausgabe (per Pipe, `--no-color`, Skripte) werden dieselben Daten als Markdown dargestellt:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## Exit-Codes

| Code | Bedeutung                                                         |
| ---- | ----------------------------------------------------------------- |
| `0`  | Suche erfolgreich (einschließlich Antworten ohne Ergebnisse).     |
| `1`  | Der MCP-Tool-Aufruf ist fehlgeschlagen; stderr wird inline ausgegeben. |

## Verwandt

- [CLI-Referenz](/de/cli)
- [Live-Dokumentation](https://docs.openclaw.ai)
