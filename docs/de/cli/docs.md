---
read_when:
    - Sie möchten die aktuellen OpenClaw-Dokumente über das Terminal durchsuchen
    - Sie müssen wissen, welche gehostete Such-API die Docs-CLI aufruft
summary: CLI-Referenz für `openclaw docs` (Live-Dokumentationsindex durchsuchen)
title: Dokumentation
x-i18n:
    generated_at: "2026-07-24T04:56:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b0b575f0b76d40a53dd4f79c55fd65969a24eae27e27bd1c46d395f61fe89e42
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Durchsuchen Sie den Live-Index der OpenClaw-Dokumentation vom Terminal aus.

## Verwendung

```bash
openclaw docs                       # Einstiegspunkt der Dokumentation und Beispielsuche ausgeben
openclaw docs <query...>            # Live-Index der Dokumentation durchsuchen
```

| Argument     | Beschreibung                                                                        |
| ------------ | ---------------------------------------------------------------------------------- |
| `[query...]` | Freiform-Suchabfrage. Abfragen mit mehreren Wörtern werden mit Leerzeichen verbunden und als eine Abfrage gesendet. |

Ohne Abfrage gibt `openclaw docs` die URL des Dokumentationseinstiegspunkts und einen Beispiel-Suchbefehl aus, anstatt eine Suche auszuführen.

## Beispiele

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

## Funktionsweise

`openclaw docs` ruft `https://docs.openclaw.ai/api/search` auf und stellt die JSON-Ergebnisse dar. Für die Suchanfrage gilt ein festes Zeitlimit von 30 Sekunden.

## Ausgabe

In einem Rich-Terminal (TTY) werden die Ergebnisse als Überschrift mit anschließender Aufzählung dargestellt: Seitentitel, verlinkte Dokumentations-URL und ein kurzer Auszug in der nächsten Zeile. Bei leeren Ergebnissen wird „Keine Ergebnisse.“ ausgegeben.

Bei einer Ausgabe ohne Rich-Darstellung (über eine Pipe, `--no-color`, Skripte) werden dieselben Daten als Markdown dargestellt:

```markdown
# Dokumentationssuche: <query>

- [Titel](https://docs.openclaw.ai/...) - Auszug
- [Titel](https://docs.openclaw.ai/...) - Auszug
```

## Exit-Codes

| Code | Bedeutung                                                                  |
| ---- | ------------------------------------------------------------------------ |
| `0`  | Die Suche war erfolgreich, einschließlich Antworten ohne Ergebnisse.                       |
| `1`  | Der API-Aufruf der gehosteten Dokumentationssuche ist fehlgeschlagen; stderr gibt die Fehlermeldung aus. |

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Live-Dokumentation](https://docs.openclaw.ai)
