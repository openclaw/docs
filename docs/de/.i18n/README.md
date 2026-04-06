---
x-i18n:
    generated_at: "2026-04-06T03:05:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e1cf417b0c04d001bc494fbe03ac2fcb66866f759e21646dbfd1a9c3a968bff
    source_path: .i18n/README.md
    workflow: 15
---

# OpenClaw-Dokumentations-i18n-Assets

Dieser Ordner speichert die Übersetzungskonfiguration für das Quell-Dokumentations-Repository.

Generierte lokalisierte Seiten und der Live-Übersetzungsspeicher für Sprachen befinden sich jetzt im Publish-Repository (`openclaw/docs`, lokaler benachbarter Checkout `~/Projects/openclaw-docs`).

## Dateien

- `glossary.<lang>.json` — bevorzugte Begriffszuzuordnungen (werden in der Prompt-Anleitung verwendet).
- `<lang>.tm.jsonl` — Übersetzungsspeicher (Cache), verschlüsselt nach Workflow + Modell + Texthash. In diesem Repository werden TM-Dateien für Sprachen bei Bedarf generiert.

## Glossarformat

`glossary.<lang>.json` ist ein Array von Einträgen:

```json
{
  "source": "troubleshooting",
  "target": "故障排除",
  "ignore_case": true,
  "whole_word": false
}
```

Felder:

- `source`: englische (oder Quell-)Phrase, die bevorzugt werden soll.
- `target`: bevorzugte Übersetzungsausgabe.

## Hinweise

- Glossareinträge werden als **Prompt-Anleitung** an das Modell übergeben (keine deterministischen Umschreibungen).
- `scripts/docs-i18n` ist weiterhin für die Generierung von Übersetzungen zuständig.
- Das Quell-Repository synchronisiert englische Dokumente in das Publish-Repository; die Generierung lokalisierter Versionen wird dort pro Sprache bei Push, nach Zeitplan und bei Release-Dispatch ausgeführt.
