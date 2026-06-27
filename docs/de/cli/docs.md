---
read_when:
    - Sie möchten die aktuellen OpenClaw-Dokumente über das Terminal durchsuchen
    - Sie müssen wissen, welche gehostete Such-API die Dokumentations-CLI aufruft
summary: CLI-Referenz für `openclaw docs` (Live-Dokumentationsindex durchsuchen)
title: Dokumentation
x-i18n:
    generated_at: "2026-06-27T17:18:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8be22f689d40ffec29df9562b69444c0f8b9bb607dfcb79de20b3023e0eb30a
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Durchsuchen Sie den Live-Index der OpenClaw-Dokumentation vom Terminal aus. Der Befehl ruft die von Cloudflare gehostete Such-API der OpenClaw-Dokumentation auf und rendert die Ergebnisse in Ihrem Terminal.

## Verwendung

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

Argumente:

| Argument     | Beschreibung                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| `[query...]` | Frei formulierte Suchanfrage. Mehrwort-Abfragen werden mit Leerzeichen verbunden und als eine gesendet. |

## Beispiele

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Ohne Abfrage gibt `openclaw docs` die URL des Dokumentations-Einstiegspunkts sowie einen Beispiel-Suchbefehl aus, statt eine Suche auszuführen.

## Funktionsweise

`openclaw docs` ruft `https://docs.openclaw.ai/api/search` auf und rendert die JSON-Ergebnisse. Der Suchaufruf verwendet ein festes Timeout von 30 Sekunden.

## Ausgabe

In einem Rich-(TTY)-Terminal werden Ergebnisse als Überschrift gefolgt von einer Aufzählungsliste gerendert. Jeder Aufzählungspunkt zeigt den Seitentitel, die verlinkte Dokumentations-URL und in der nächsten Zeile einen kurzen Ausschnitt. Leere Ergebnisse geben „Keine Ergebnisse.“ aus.

In nicht angereicherter Ausgabe (weitergeleitet, `--no-color`, Skripte) werden dieselben Daten als Markdown gerendert:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## Exit-Codes

| Code | Bedeutung                                                                 |
| ---- | ------------------------------------------------------------------------- |
| `0`  | Suche erfolgreich (einschließlich Antworten ohne Ergebnisse).             |
| `1`  | Der Aufruf der gehosteten Such-API der Dokumentation ist fehlgeschlagen; stderr wird inline ausgegeben. |

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Live-Dokumentation](https://docs.openclaw.ai)
