---
read_when:
    - Sie möchten die aktuellen OpenClaw-Dokumente über das Terminal durchsuchen
    - Sie müssen wissen, welche gehostete Such-API die Dokumentations-CLI aufruft.
summary: CLI-Referenz für `openclaw docs` (den Index der Live-Dokumentation durchsuchen)
title: Dokumentation
x-i18n:
    generated_at: "2026-07-12T01:28:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0b575f0b76d40a53dd4f79c55fd65969a24eae27e27bd1c46d395f61fe89e42
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Durchsuchen Sie den Live-Index der OpenClaw-Dokumentation über das Terminal.

## Verwendung

```bash
openclaw docs                       # Einstiegspunkt der Dokumentation und Beispielsuche ausgeben
openclaw docs <query...>            # Live-Index der Dokumentation durchsuchen
```

| Argument     | Beschreibung                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| `[query...]` | Frei formulierte Suchanfrage. Mehrteilige Anfragen werden mit Leerzeichen verbunden und als eine übermittelt. |

Ohne Suchanfrage gibt `openclaw docs` die URL des Dokumentationseinstiegspunkts und einen Beispielbefehl für die Suche aus, anstatt eine Suche durchzuführen.

## Beispiele

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

## Funktionsweise

`openclaw docs` ruft `https://docs.openclaw.ai/api/search` auf und stellt die JSON-Ergebnisse dar. Für die Suchanfrage gilt ein festes Zeitlimit von 30 Sekunden.

## Ausgabe

In einem ausgabestarken Terminal (TTY) werden die Ergebnisse als Überschrift mit anschließender Aufzählung dargestellt: Seitentitel, verlinkte URL der Dokumentation und ein kurzer Textausschnitt in der nächsten Zeile. Bei leeren Ergebnissen wird „Keine Ergebnisse.“ ausgegeben.

Bei nicht ausgabestarker Ausgabe (weitergeleitet, `--no-color`, Skripte) werden dieselben Daten als Markdown dargestellt:

```markdown
# Dokumentationssuche: <query>

- [Titel](https://docs.openclaw.ai/...) - Textausschnitt
- [Titel](https://docs.openclaw.ai/...) - Textausschnitt
```

## Exit-Codes

| Code | Bedeutung                                                                                  |
| ---- | ------------------------------------------------------------------------------------------ |
| `0`  | Suche erfolgreich, einschließlich Antworten ohne Ergebnisse.                              |
| `1`  | Der Aufruf der gehosteten Such-API für die Dokumentation ist fehlgeschlagen; stderr gibt die Fehlermeldung aus. |

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Live-Dokumentation](https://docs.openclaw.ai)
