---
x-i18n:
    generated_at: "2026-05-10T19:20:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb1075777cead58155336aa27359c8c149748bec8a854ff1de1f75a992b8c8f
    source_path: AGENTS.md
    workflow: 16
---

# Dokumentationsleitfaden

Dieses Verzeichnis enthält die Regeln für das Erstellen von Dokumentation, Mintlify-Links und die i18n-Richtlinie für Dokumentation.

## Mintlify-Regeln

- Dokumentation wird auf Mintlify gehostet (`https://docs.openclaw.ai`).
- Interne Dokumentationslinks in `docs/**/*.md` müssen root-relativ bleiben und dürfen kein Suffix `.md` oder `.mdx` haben (Beispiel: `[Config](/gateway/configuration)`).
- Abschnittsübergreifende Verweise sollten Anker auf root-relativen Pfaden verwenden (Beispiel: `[Hooks](/gateway/configuration-reference#hooks)`).
- Dokumentationsüberschriften sollten Gedankenstriche und Apostrophe vermeiden, da die Ankererzeugung von Mintlify dort fragil ist.
- README-Dateien und andere von GitHub gerenderte Dokumentation sollten absolute Dokumentations-URLs behalten, damit Links außerhalb von Mintlify funktionieren.
- Dokumentationsinhalte müssen generisch bleiben: keine persönlichen Gerätenamen, Hostnamen oder lokalen Pfade; verwenden Sie Platzhalter wie `user@gateway-host`.

## Regeln für Dokumentationsinhalte

- Ordnen Sie Services/Provider in Dokumentation, UI-Texten und Auswahllisten alphabetisch, sofern der Abschnitt nicht ausdrücklich die Laufzeitreihenfolge oder die Reihenfolge der automatischen Erkennung beschreibt.
- Halten Sie die Benennung gebündelter Plugins konsistent mit den repo-weiten Regeln zur Plugin-Terminologie im Root-`AGENTS.md`.

## Interne Dokumentation

- Langlebige private Betreiber-Dokumentation gehört nach `~/Projects/manager/docs/`.
- Repo-lokale interne Scratch-/Mirror-Dokumentation kann unter dem ignorierten Pfad `docs/internal/` liegen.
- Fügen Sie niemals Seiten unter `docs/internal/**` zur Navigation in `docs/docs.json` hinzu und verlinken Sie sie nicht aus öffentlicher Dokumentation.
- `scripts/docs-sync-publish.mjs` schließt `docs/internal/**` aus und entfernt es aus dem öffentlichen Publish-Repo `openclaw/docs`, falls später eine Seite erzwungen hinzugefügt wird.
- Interne Dokumentation darf Repo-Pfade, private App-Namen, 1Password-Elementnamen und Runbooks erwähnen, darf aber niemals geheime Werte enthalten.

## Dokumentations-i18n

- Fremdsprachige Dokumentation wird nicht in diesem Repo gepflegt. Die generierte Publish-Ausgabe liegt im separaten Repo `openclaw/docs` (lokal häufig als `../openclaw-docs` geklont).
- Fügen Sie hier keine lokalisierten Dokumentationsdateien unter `docs/<locale>/**` hinzu und bearbeiten Sie sie nicht.
- Behandeln Sie die englische Dokumentation in diesem Repo sowie Glossardateien als maßgebliche Quelle.
- Pipeline: Aktualisieren Sie hier die englische Dokumentation, aktualisieren Sie `docs/.i18n/glossary.<locale>.json` nach Bedarf, und lassen Sie dann die Synchronisierung des Publish-Repos sowie `scripts/docs-i18n` in `openclaw/docs` laufen.
- Bevor Sie `scripts/docs-i18n` erneut ausführen, fügen Sie Glossareinträge für neue Fachbegriffe, Seitentitel oder kurze Navigationslabels hinzu, die auf Englisch bleiben oder eine feste Übersetzung verwenden müssen.
- `pnpm docs:check-i18n-glossary` ist der Schutzmechanismus für geänderte englische Dokumentationstitel und kurze interne Dokumentationslabels.
- Translation Memory befindet sich in den generierten Dateien `docs/.i18n/*.tm.jsonl` im Publish-Repo.
- Siehe `docs/.i18n/README.md`.
